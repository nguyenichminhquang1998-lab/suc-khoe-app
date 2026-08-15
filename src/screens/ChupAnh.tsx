import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { db } from '../db/db'
import {
  LoiNhanDien, MAU_DO_TIN_CAY, NHAN_DO_TIN_CAY, bamAnh, nenAnh, nhanDienMonAn,
  type MonNhanDien,
} from '../lib/nhandienanh'
import { nhanDinhDuong, ngayLocal } from '../lib/tinhtoan'
import { useCaiDat, useTrangThaiMang } from '../hooks/useApp'
import { NhapSo } from '../components/chung'
import type { LoaiBua } from '../lib/types'

const TEN_BUA: Record<LoaiBua, string> = {
  sang: 'Sáng', trua: 'Trưa', toi: 'Tối', phu: 'Phụ',
}

const THOI_GIAN_CHO_MS = 60_000

function doanBua(): LoaiBua {
  const g = new Date().getHours()
  if (g < 10) return 'sang'
  if (g < 14) return 'trua'
  if (g < 21) return 'toi'
  return 'phu'
}

type GiaiDoan = 'chon_anh' | 'dang_phan_tich' | 'xem_ket_qua'

export default function ChupAnh() {
  const dieuHuong = useNavigate()
  const [thamSo] = useSearchParams()
  const ngay = thamSo.get('ngay') ?? ngayLocal()
  const online = useTrangThaiMang()
  const [apiKey] = useCaiDat<string>('apiKey', '')
  const [model] = useCaiDat<string>('model', 'claude-sonnet-5')

  const [giaiDoan, datGiaiDoan] = useState<GiaiDoan>('chon_anh')
  const [anh, datAnh] = useState<Blob | null>(null)
  const [urlAnh, datUrlAnh] = useState<string>()
  const [mon, datMon] = useState<MonNhanDien[]>([])
  const [loaiBua, datLoaiBua] = useState<LoaiBua>(doanBua())
  const [loi, datLoi] = useState<string>()
  const [canDanKey, datCanDanKey] = useState(false)
  const [dangLuu, datDangLuu] = useState(false)

  const nhapAnhRef = useRef<HTMLInputElement>(null)
  const huyRef = useRef<AbortController>()

  useEffect(() => {
    if (!anh) return
    const u = URL.createObjectURL(anh)
    datUrlAnh(u)
    return () => URL.revokeObjectURL(u)
  }, [anh])

  useEffect(() => () => huyRef.current?.abort(), [])

  async function xuLyAnh(file: File) {
    datLoi(undefined)
    datCanDanKey(false)
    let daNen: Blob
    try {
      daNen = await nenAnh(file)
    } catch {
      datLoi('Không đọc được ảnh này. Thử chụp lại hoặc chọn ảnh khác.')
      return
    }
    datAnh(daNen)

    if (!apiKey) {
      datLoi(
        'Chưa cài API key nên app chưa tự nhận diện được. Bạn vào Cài đặt → Nhận diện ảnh để dán key, hoặc bấm "Nhập tay" bên dưới — ảnh vẫn được lưu kèm bữa ăn.',
      )
      datCanDanKey(true)
      datGiaiDoan('xem_ket_qua')
      return
    }

    if (!online) {
      datLoi('Đang không có mạng nên chưa nhận diện được. Ảnh đã lưu, bạn nhập tay trước cũng được.')
      datGiaiDoan('xem_ket_qua')
      return
    }

    // Kết quả cũ của đúng tấm ảnh này được dùng lại, không gọi API lần nữa.
    const hash = await bamAnh(daNen)
    const daCo = await db.anhBuaAn.where('hash').equals(hash).first()
    if (daCo?.ketQuaAi) {
      try {
        datMon(JSON.parse(daCo.ketQuaAi) as MonNhanDien[])
        datGiaiDoan('xem_ket_qua')
        return
      } catch {
        // Kết quả cache hỏng thì bỏ qua, gọi lại API như bình thường.
      }
    }

    datGiaiDoan('dang_phan_tich')
    const dieuKhien = new AbortController()
    huyRef.current = dieuKhien
    const hetGio = setTimeout(() => dieuKhien.abort(), THOI_GIAN_CHO_MS)

    try {
      const kq = await nhanDienMonAn(daNen, { apiKey, model, signal: dieuKhien.signal })
      datMon(kq)
      if (kq.length === 0) {
        datLoi('Không thấy món ăn nào trong ảnh. Bạn thử chụp lại gần hơn, hoặc nhập tay.')
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        datLoi('Đã hủy hoặc quá thời gian chờ. Bạn thử lại hoặc nhập tay.')
      } else if (e instanceof LoiNhanDien) {
        datLoi(e.message)
        datCanDanKey(e.canDanKey)
      } else {
        datLoi('Có lỗi khi nhận diện. Bạn nhập tay giúp nhé.')
      }
    } finally {
      clearTimeout(hetGio)
      huyRef.current = undefined
      datGiaiDoan('xem_ket_qua')
    }
  }

  function suaMon(i: number, thayDoi: Partial<MonNhanDien>) {
    datMon((cu) => cu.map((m, j) => (j === i ? { ...m, ...thayDoi } : m)))
  }

  function doiKhoiLuong(i: number, gamMoi: number) {
    datMon((cu) =>
      cu.map((m, j) => {
        if (j !== i) return m
        const gamCu = Math.max(m.khoiLuongG, 1)
        const tren100 = nhanDinhDuong(m.dinhDuong, (100 / gamCu) * 100)
        return { ...m, khoiLuongG: gamMoi, dinhDuong: nhanDinhDuong(tren100, gamMoi) }
      }),
    )
  }

  async function luuTatCa() {
    if (mon.length === 0) return
    datDangLuu(true)
    try {
      let anhId: number | undefined
      if (anh) {
        anhId = await db.anhBuaAn.add({
          blob: anh,
          hash: await bamAnh(anh),
          ketQuaAi: JSON.stringify(mon),
          chupLuc: Date.now(),
        })
      }
      const bayGio = Date.now()
      await db.nhatKyAn.bulkAdd(
        mon.map((m) => ({
          ngay,
          loaiBua,
          thoiDiem: bayGio,
          tenHienThi: m.ten,
          khoiLuongG: m.khoiLuongG,
          dinhDuong: m.dinhDuong,
          anhId,
          doTinCay: m.doTinCay,
          nguonNhap: 'anh' as const,
          ghiChu: m.ghiChu,
          taoLuc: bayGio,
          suaLuc: bayGio,
        })),
      )
      dieuHuong(`/nhat-ky?ngay=${ngay}`)
    } finally {
      datDangLuu(false)
    }
  }

  const tongCalo = mon.reduce((t, m) => t + m.dinhDuong.calo, 0)

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => dieuHuong(-1)} className="nut-phu px-3 py-2">←</button>
        <h1 className="font-semibold">Chụp món ăn</h1>
        <div className="w-11" />
      </div>

      <input
        ref={nhapAnhRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) xuLyAnh(f)
          e.target.value = ''
        }}
      />

      {giaiDoan === 'chon_anh' && (
        <div className="flex-1 flex flex-col justify-center">
          <div className="the text-center py-10 mb-4">
            <div className="text-6xl mb-4">📷</div>
            <p className="font-medium">Chụp ảnh bữa ăn của bạn</p>
            <p className="text-sm text-slate-500 mt-2 px-4">
              Chụp từ trên xuống, lấy trọn cả đĩa và để lọt đôi đũa hoặc cái chén vào khung —
              AI cần vật tham chiếu để đoán khẩu phần.
            </p>
          </div>

          <button className="nut-chinh w-full mb-3" onClick={() => nhapAnhRef.current?.click()}>
            📷 Mở camera
          </button>
          <button
            className="nut-phu w-full mb-3"
            onClick={() => {
              // Bỏ capture để trình duyệt mở thư viện ảnh thay vì camera.
              if (nhapAnhRef.current) {
                nhapAnhRef.current.removeAttribute('capture')
                nhapAnhRef.current.click()
                nhapAnhRef.current.setAttribute('capture', 'environment')
              }
            }}
          >
            🖼️ Chọn từ thư viện
          </button>
          <button
            className="nut-vien w-full"
            onClick={() => dieuHuong(`/them-mon?ngay=${ngay}`)}
          >
            Nhập tay thay vì chụp
          </button>

          {!apiKey && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-200">
              Chưa cài API key nên phần nhận diện tự động chưa chạy. Mọi chức năng khác của app
              vẫn dùng bình thường.{' '}
              <button onClick={() => dieuHuong('/cai-dat')} className="underline font-medium">
                Cài đặt key
              </button>
            </div>
          )}
        </div>
      )}

      {giaiDoan === 'dang_phan_tich' && (
        <div className="flex-1 flex flex-col">
          {urlAnh && <img src={urlAnh} alt="" className="w-full rounded-2xl mb-5" />}
          <div className="the flex items-center gap-4">
            <div className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
            <div>
              <p className="font-medium text-sm">Đang xem ảnh...</p>
              <p className="text-xs text-slate-500 mt-0.5">Thường mất 5–15 giây</p>
            </div>
          </div>
          <button
            className="nut-vien w-full mt-4"
            onClick={() => huyRef.current?.abort()}
          >
            Hủy
          </button>
        </div>
      )}

      {giaiDoan === 'xem_ket_qua' && (
        <div className="flex-1 flex flex-col">
          {urlAnh && <img src={urlAnh} alt="" className="w-full rounded-2xl mb-4" />}

          {loi && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-200 mb-4">
              {loi}
              {canDanKey && (
                <button
                  onClick={() => dieuHuong('/cai-dat')}
                  className="underline font-medium ml-1"
                >
                  Mở Cài đặt
                </button>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="nhan">Bữa</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TEN_BUA) as LoaiBua[]).map((b) => (
                <button
                  key={b}
                  onClick={() => datLoaiBua(b)}
                  className={`text-sm py-2 ${loaiBua === b ? 'chip-bat' : 'chip-tat'}`}
                >
                  {TEN_BUA[b]}
                </button>
              ))}
            </div>
          </div>

          {mon.length > 0 && (
            <>
              <div className="rounded-xl bg-slate-800/50 border border-slate-800 p-3 mb-3 text-xs text-slate-400 leading-relaxed">
                Số liệu là ước lượng của AI, có thể lệch 20–30%. Hãy sửa lại nếu bạn biết
                chính xác hơn — con số bạn sửa mới là con số được lưu.
              </div>

              <div className="space-y-3">
                {mon.map((m, i) => (
                  <div key={i} className="the">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <input
                        className="bg-transparent font-medium flex-1 min-w-0 border-b border-transparent focus:border-slate-700 focus:outline-none"
                        value={m.ten}
                        onChange={(e) => suaMon(i, { ten: e.target.value })}
                      />
                      <button
                        onClick={() => datMon((cu) => cu.filter((_, j) => j !== i))}
                        className="text-slate-600 hover:text-rose-400 px-1 shrink-0"
                        aria-label="Bỏ món này"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          MAU_DO_TIN_CAY[m.doTinCay]
                        }`}
                      >
                        {NHAN_DO_TIN_CAY[m.doTinCay]}
                      </span>
                      {m.khauPhanMoTa && (
                        <span className="text-xs text-slate-500">{m.khauPhanMoTa}</span>
                      )}
                    </div>

                    <NhapSo
                      giaTri={m.khoiLuongG}
                      doiGiaTri={(v) => doiKhoiLuong(i, v)}
                      buoc={10}
                      toiThieu={1}
                      toiDa={5000}
                      donVi="g"
                    />

                    <div className="grid grid-cols-4 gap-2 mt-3 text-center text-sm">
                      {[
                        ['Calo', m.dinhDuong.calo, ''],
                        ['Đạm', m.dinhDuong.dam, 'g'],
                        ['T.bột', m.dinhDuong.tinhbot, 'g'],
                        ['Béo', m.dinhDuong.beo, 'g'],
                      ].map(([nhan, gt, dv]) => (
                        <div key={nhan as string}>
                          <div className="font-semibold">
                            {gt as number}
                            {dv as string}
                          </div>
                          <div className="text-[10px] text-slate-500">{nhan as string}</div>
                        </div>
                      ))}
                    </div>

                    {m.ghiChu && (
                      <p className="text-xs text-slate-500 mt-3 italic">{m.ghiChu}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="the mt-3 flex items-center justify-between">
                <span className="text-sm text-slate-400">Tổng cộng</span>
                <span className="text-xl font-bold">{tongCalo} kcal</span>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-5">
            <button
              className="nut-vien flex-1"
              onClick={() => {
                datAnh(null)
                datMon([])
                datLoi(undefined)
                datGiaiDoan('chon_anh')
              }}
            >
              Chụp lại
            </button>
            {mon.length > 0 ? (
              <button className="nut-chinh flex-1" onClick={luuTatCa} disabled={dangLuu}>
                {dangLuu ? 'Đang lưu...' : `Lưu ${mon.length} món`}
              </button>
            ) : (
              <button
                className="nut-chinh flex-1"
                onClick={() => dieuHuong(`/them-mon?ngay=${ngay}&bua=${loaiBua}`)}
              >
                Nhập tay
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
