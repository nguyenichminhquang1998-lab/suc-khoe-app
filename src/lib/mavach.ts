// Quét mã vạch sản phẩm đóng gói và tra cứu dinh dưỡng.
//
// Tra trên Open Food Facts — cơ sở dữ liệu mở, miễn phí, không cần key.
// Hàng Việt Nam trên đó còn thiếu nhiều, nên khi không tìm thấy app cho phép
// người dùng tự nhập một lần rồi lưu lại theo mã vạch để lần sau quét là ra ngay.

import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import type { DinhDuong, ThucPham } from './types'
import { db } from '../db/db'

const URL_OFF = 'https://world.openfoodfacts.org/api/v2/product'

export interface SanPhamMaVach {
  maVach: string
  ten: string
  thuongHieu: string
  tren100g: DinhDuong
  khoiLuongGoi?: number
  nguon: 'open_food_facts' | 'nguoi_dung'
}

/** Tạo trình đọc mã vạch giới hạn ở các định dạng dùng cho hàng hóa — quét nhanh hơn. */
export function taoTrinhDocMaVach(): BrowserMultiFormatReader {
  const goiY = new Map()
  goiY.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
  ])
  return new BrowserMultiFormatReader(goiY)
}

function so(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/**
 * Tra mã vạch. Ưu tiên dữ liệu người dùng đã tự nhập trên máy,
 * vì đó là số liệu họ đã xác nhận đúng.
 */
export async function traMaVach(
  maVach: string,
  signal?: AbortSignal,
): Promise<SanPhamMaVach | null> {
  const daCo = await db.thucPham.where('maVach').equals(maVach).first()
  if (daCo) {
    return {
      maVach,
      ten: daCo.ten,
      thuongHieu: '',
      tren100g: daCo.tren100g,
      nguon: 'nguoi_dung',
    }
  }

  let phanHoi: Response
  try {
    phanHoi = await fetch(
      `${URL_OFF}/${encodeURIComponent(maVach)}?fields=product_name,product_name_vi,brands,nutriments,quantity`,
      { signal, headers: { Accept: 'application/json' } },
    )
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    // Không có mạng: người dùng vẫn nhập tay được, không coi là lỗi chặn.
    return null
  }

  if (!phanHoi.ok) return null

  const dl = (await phanHoi.json()) as {
    status?: number
    product?: {
      product_name?: string
      product_name_vi?: string
      brands?: string
      quantity?: string
      nutriments?: Record<string, unknown>
    }
  }
  if (dl.status !== 1 || !dl.product) return null

  const sp = dl.product
  const n = sp.nutriments ?? {}
  const ten = sp.product_name_vi || sp.product_name || ''
  if (!ten) return null

  // Open Food Facts đôi khi chỉ có kJ, quy đổi 1 kcal = 4.184 kJ.
  const calo =
    so(n['energy-kcal_100g']) || Math.round(so(n['energy_100g']) / 4.184)

  return {
    maVach,
    ten,
    thuongHieu: sp.brands ?? '',
    tren100g: {
      calo,
      dam: so(n.proteins_100g),
      tinhbot: so(n.carbohydrates_100g),
      beo: so(n.fat_100g),
      chatxo: so(n.fiber_100g),
      duong: so(n.sugars_100g),
      // OFF lưu muối theo gam, đổi sang natri mg: 1 g muối ≈ 400 mg natri.
      natri: so(n.sodium_100g) * 1000 || so(n.salt_100g) * 400,
    },
    khoiLuongGoi: doKhoiLuongGoi(sp.quantity),
    nguon: 'open_food_facts',
  }
}

/** Đọc khối lượng gói từ chuỗi kiểu "330 ml", "100g", "1.5 L". */
export function doKhoiLuongGoi(chuoi?: string): number | undefined {
  if (!chuoi) return undefined
  const khop = chuoi.match(/([\d.,]+)\s*(kg|g|l|ml)\b/i)
  if (!khop) return undefined
  const soLuong = parseFloat(khop[1].replace(',', '.'))
  if (!Number.isFinite(soLuong)) return undefined
  switch (khop[2].toLowerCase()) {
    case 'kg':
    case 'l':
      return Math.round(soLuong * 1000)
    default:
      return Math.round(soLuong)
  }
}

/** Lưu sản phẩm vừa tra được vào máy để lần sau quét là ra ngay, kể cả offline. */
export async function luuSanPhamMaVach(sp: SanPhamMaVach): Promise<number> {
  const daCo = await db.thucPham.where('maVach').equals(sp.maVach).first()
  const ten = sp.thuongHieu ? `${sp.ten} (${sp.thuongHieu})` : sp.ten
  const banGhi: Omit<ThucPham, 'id'> = {
    ten,
    tenKhac: [sp.ten],
    nhom: 'Ăn vặt & bánh kẹo',
    tren100g: sp.tren100g,
    khauPhanChuan: sp.khoiLuongGoi
      ? [{ ten: 'cả gói', gam: sp.khoiLuongGoi }, { ten: '100 g', gam: 100 }]
      : [{ ten: '100 g', gam: 100 }],
    maVach: sp.maVach,
    nguon: sp.nguon === 'open_food_facts' ? 'Open Food Facts' : 'Tự nhập',
    laCuaNguoiDung: sp.nguon === 'nguoi_dung',
    taoLuc: Date.now(),
  }

  if (daCo) {
    await db.thucPham.update(daCo.id!, banGhi)
    return daCo.id!
  }
  return db.thucPham.add(banGhi as ThucPham)
}
