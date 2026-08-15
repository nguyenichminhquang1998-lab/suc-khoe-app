// Nhận diện món ăn từ ảnh bằng Claude API.
//
// App không có máy chủ, nên trình duyệt gọi thẳng API bằng key người dùng tự dán vào
// phần Cài đặt. Key nằm trong IndexedDB trên máy người dùng và chỉ được gửi tới
// api.anthropic.com. Đây là đánh đổi có ý thức: app dùng cho cá nhân, không có
// backend để giữ key hộ.

import type { DinhDuong, DoTinCay } from './types'

const URL_API = 'https://api.anthropic.com/v1/messages'
const MODEL_MAC_DINH = 'claude-sonnet-5'

export interface MonNhanDien {
  ten: string
  khauPhanMoTa: string
  khoiLuongG: number
  dinhDuong: DinhDuong
  doTinCay: DoTinCay
  ghiChu: string
}

export interface KetQuaNhanDien {
  thanhCong: boolean
  mon: MonNhanDien[]
  loi?: string
}

const CONG_CU_TRA_KET_QUA = {
  name: 'ghi_nhan_mon_an',
  description:
    'Ghi nhận danh sách món ăn nhìn thấy trong ảnh cùng ước lượng dinh dưỡng của từng món.',
  input_schema: {
    type: 'object' as const,
    properties: {
      mon: {
        type: 'array',
        description: 'Danh sách các món ăn riêng biệt nhìn thấy trong ảnh.',
        items: {
          type: 'object',
          properties: {
            ten: { type: 'string', description: 'Tên món bằng tiếng Việt, ví dụ "Phở bò tái".' },
            khau_phan_mo_ta: {
              type: 'string',
              description: 'Mô tả khẩu phần theo cách người Việt hay nói, ví dụ "1 tô vừa", "2 chén cơm".',
            },
            khoi_luong_g: {
              type: 'number',
              description: 'Ước lượng khối lượng phần ăn được, tính bằng gam.',
            },
            calo: { type: 'number', description: 'Tổng calo của cả phần ăn này (không phải trên 100g).' },
            dam_g: { type: 'number' },
            tinh_bot_g: { type: 'number' },
            beo_g: { type: 'number' },
            chat_xo_g: { type: 'number' },
            duong_g: { type: 'number' },
            natri_mg: { type: 'number' },
            do_tin_cay: {
              type: 'string',
              enum: ['cao', 'trung_binh', 'thap'],
              description:
                'cao khi nhìn rõ món và ước lượng được khẩu phần; trung_binh khi đoán được món nhưng khẩu phần mơ hồ; thap khi ảnh mờ, bị che, hoặc món khó xác định.',
            },
            ghi_chu: {
              type: 'string',
              description: 'Điều khiến ước lượng có thể sai, ví dụ "không rõ có thêm dầu mỡ không".',
            },
          },
          required: [
            'ten', 'khau_phan_mo_ta', 'khoi_luong_g', 'calo', 'dam_g',
            'tinh_bot_g', 'beo_g', 'chat_xo_g', 'duong_g', 'natri_mg',
            'do_tin_cay', 'ghi_chu',
          ],
        },
      },
    },
    required: ['mon'],
  },
}

const LOI_NHAC = `Bạn đang xem ảnh một bữa ăn do người dùng Việt Nam chụp.

Nhiệm vụ: liệt kê từng món ăn riêng biệt trong ảnh và ước lượng dinh dưỡng của chúng.

Nguyên tắc bắt buộc:
- Ưu tiên nhận diện món ăn Việt Nam (phở, bún bò, cơm tấm, bánh mì, hủ tiếu, chè...). Gọi đúng tên tiếng Việt của món, không dịch sang tên nước ngoài.
- Tách riêng từng món: cơm, món mặn, canh, rau là các mục riêng, không gộp thành "cơm phần".
- Ước lượng khẩu phần dựa vào vật tham chiếu trong ảnh: đường kính tô/chén (tô phở thường 20–22cm, chén cơm 11–12cm), đôi đũa, bàn tay, lon nước.
- Số liệu dinh dưỡng phải tính cho CẢ PHẦN ĂN trong ảnh, không phải trên 100g.
- Thành thật về độ tin cậy. Nếu ảnh mờ, món bị che khuất, hoặc không đoán được lượng dầu mỡ thì đặt do_tin_cay là "thap" và nói rõ lý do trong ghi_chu. Không được tỏ ra chắc chắn hơn thực tế.
- Nếu trong ảnh không có đồ ăn, trả về danh sách rỗng.

Luôn trả lời bằng cách gọi công cụ ghi_nhan_mon_an.`

export class LoiNhanDien extends Error {
  constructor(message: string, readonly canDanKey = false) {
    super(message)
    this.name = 'LoiNhanDien'
  }
}

/**
 * Nén ảnh trước khi gửi: cạnh dài tối đa 1024px, JPEG chất lượng 80%.
 * Ảnh gốc từ camera điện thoại thường 4–8 MB, nén xuống còn khoảng 100–200 KB.
 */
export async function nenAnh(file: Blob, canhToiDa = 1024, chatLuong = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const tyLe = Math.min(1, canhToiDa / Math.max(bitmap.width, bitmap.height))
  const rong = Math.round(bitmap.width * tyLe)
  const cao = Math.round(bitmap.height * tyLe)

  const canvas = document.createElement('canvas')
  canvas.width = rong
  canvas.height = cao
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new LoiNhanDien('Trình duyệt không hỗ trợ xử lý ảnh.')
  ctx.drawImage(bitmap, 0, 0, rong, cao)
  bitmap.close()

  return new Promise((giaiQuyet, tuChoi) => {
    canvas.toBlob(
      (blob) => (blob ? giaiQuyet(blob) : tuChoi(new LoiNhanDien('Không nén được ảnh.'))),
      'image/jpeg',
      chatLuong,
    )
  })
}

export async function bamAnh(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function blobSangBase64(blob: Blob): Promise<string> {
  return new Promise((giaiQuyet, tuChoi) => {
    const doc = new FileReader()
    doc.onloadend = () => {
      const kq = doc.result as string
      giaiQuyet(kq.slice(kq.indexOf(',') + 1))
    }
    doc.onerror = () => tuChoi(doc.error)
    doc.readAsDataURL(blob)
  })
}

interface KhoiTraVe {
  type: string
  name?: string
  input?: { mon?: Record<string, unknown>[] }
}

function chuyenDoiMon(tho: Record<string, unknown>): MonNhanDien {
  const so = (v: unknown): number => {
    const n = typeof v === 'number' ? v : Number(v)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  const doTinCay = tho.do_tin_cay
  return {
    ten: String(tho.ten ?? 'Món không rõ'),
    khauPhanMoTa: String(tho.khau_phan_mo_ta ?? ''),
    khoiLuongG: Math.round(so(tho.khoi_luong_g)),
    dinhDuong: {
      calo: Math.round(so(tho.calo)),
      dam: Math.round(so(tho.dam_g) * 10) / 10,
      tinhbot: Math.round(so(tho.tinh_bot_g) * 10) / 10,
      beo: Math.round(so(tho.beo_g) * 10) / 10,
      chatxo: Math.round(so(tho.chat_xo_g) * 10) / 10,
      duong: Math.round(so(tho.duong_g) * 10) / 10,
      natri: Math.round(so(tho.natri_mg)),
    },
    doTinCay:
      doTinCay === 'cao' || doTinCay === 'trung_binh' || doTinCay === 'thap'
        ? doTinCay
        : 'thap',
    ghiChu: String(tho.ghi_chu ?? ''),
  }
}

export interface TuyChonNhanDien {
  apiKey: string
  model?: string
  /** Hủy yêu cầu khi người dùng bấm nút hủy hoặc quá thời gian chờ. */
  signal?: AbortSignal
}

export async function nhanDienMonAn(
  anh: Blob,
  { apiKey, model = MODEL_MAC_DINH, signal }: TuyChonNhanDien,
): Promise<MonNhanDien[]> {
  if (!apiKey) {
    throw new LoiNhanDien(
      'Chưa có API key. Vào Cài đặt → Nhận diện ảnh để dán key, hoặc nhập món ăn bằng tay.',
      true,
    )
  }

  const base64 = await blobSangBase64(anh)

  let phanHoi: Response
  try {
    phanHoi = await fetch(URL_API, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Bắt buộc khi gọi API thẳng từ trình duyệt.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      signal,
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        tools: [CONG_CU_TRA_KET_QUA],
        tool_choice: { type: 'tool', name: 'ghi_nhan_mon_an' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
              { type: 'text', text: LOI_NHAC },
            ],
          },
        ],
      }),
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new LoiNhanDien(
      'Không kết nối được tới máy chủ nhận diện. Kiểm tra mạng rồi thử lại, hoặc nhập bằng tay.',
    )
  }

  if (!phanHoi.ok) {
    const chu = await phanHoi.text().catch(() => '')
    if (phanHoi.status === 401 || phanHoi.status === 403) {
      throw new LoiNhanDien('API key không hợp lệ. Kiểm tra lại trong Cài đặt.', true)
    }
    if (phanHoi.status === 429) {
      throw new LoiNhanDien('Gọi quá nhiều lần, chờ một lát rồi thử lại.')
    }
    if (phanHoi.status >= 500) {
      throw new LoiNhanDien('Máy chủ nhận diện đang lỗi. Thử lại sau ít phút.')
    }
    throw new LoiNhanDien(`Lỗi ${phanHoi.status} khi nhận diện ảnh. ${chu.slice(0, 200)}`)
  }

  const dl = (await phanHoi.json()) as { content?: KhoiTraVe[] }
  const khoiCongCu = dl.content?.find((k) => k.type === 'tool_use' && k.name === 'ghi_nhan_mon_an')
  if (!khoiCongCu?.input?.mon) {
    throw new LoiNhanDien('Không đọc được kết quả nhận diện. Hãy thử chụp lại rõ hơn.')
  }

  return khoiCongCu.input.mon.map(chuyenDoiMon)
}

export const NHAN_DO_TIN_CAY: Record<DoTinCay, string> = {
  cao: 'Khá chắc chắn',
  trung_binh: 'Tương đối',
  thap: 'Không chắc',
}

export const MAU_DO_TIN_CAY: Record<DoTinCay, string> = {
  cao: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  trung_binh: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  thap: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
}
