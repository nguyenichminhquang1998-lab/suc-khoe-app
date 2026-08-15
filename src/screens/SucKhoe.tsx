import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, khoiPhuc, xoaMem } from '../db/db'
import { ngayLocal, themNgay } from '../lib/tinhtoan'
import { useCaiDat, useThongBao } from '../hooks/useApp'
import { BangTruot, NhapSo, ThongBao, TieuDeTrang } from '../components/chung'
import type { ChiSoSucKhoe, LoaiChiSo } from '../lib/types'

interface CauHinhChiSo {
  loai: LoaiChiSo
  nhan: string
  bieuTuong: string
  donVi: string
  buoc: number
  thapPhan: number
  macDinh: number
  /** Chỉ số có hai giá trị, ví dụ huyết áp tâm thu/tâm trương. */
  giaTriPhu?: { nhan: string; donVi: string; macDinh: number }
  goiY?: string
  /** Trả về lời cảnh báo nếu giá trị nằm ngoài khoảng an toàn thông thường. */
  canhBao?: (gt: number, phu?: number) => string | null
}

const CHI_SO: CauHinhChiSo[] = [
  {
    loai: 'ngu', nhan: 'Giấc ngủ', bieuTuong: '😴', donVi: 'giờ',
    buoc: 0.5, thapPhan: 1, macDinh: 7,
    giaTriPhu: { nhan: 'Chất lượng (1–5)', donVi: '', macDinh: 3 },
    canhBao: (gt) => (gt < 6 ? 'Ngủ dưới 6 giờ kéo dài ảnh hưởng tới trao đổi chất và cảm giác thèm ăn.' : null),
  },
  {
    loai: 'buoc', nhan: 'Số bước chân', bieuTuong: '👟', donVi: 'bước',
    buoc: 500, thapPhan: 0, macDinh: 6000,
    goiY: 'Nhập tay từ app đếm bước của điện thoại.',
  },
  {
    loai: 'nhip_tim', nhan: 'Nhịp tim nghỉ', bieuTuong: '💓', donVi: 'bpm',
    buoc: 1, thapPhan: 0, macDinh: 70,
    goiY: 'Đo lúc vừa ngủ dậy, còn nằm trên giường.',
    canhBao: (gt) =>
      gt > 100 ? 'Nhịp tim nghỉ trên 100 là cao hơn bình thường.'
        : gt < 40 ? 'Nhịp tim nghỉ dưới 40 là thấp hơn bình thường.'
          : null,
  },
  {
    loai: 'huyet_ap', nhan: 'Huyết áp', bieuTuong: '🩺', donVi: 'mmHg',
    buoc: 1, thapPhan: 0, macDinh: 120,
    giaTriPhu: { nhan: 'Tâm trương', donVi: 'mmHg', macDinh: 80 },
    goiY: 'Ngồi nghỉ 5 phút trước khi đo. Giá trị đầu là tâm thu (số lớn).',
    canhBao: (gt, phu) =>
      gt >= 140 || (phu ?? 0) >= 90
        ? 'Chỉ số này ở mức cao huyết áp. Nếu lặp lại nhiều lần, bạn nên đi khám.'
        : gt <= 90 || (phu ?? 0) <= 60
          ? 'Chỉ số này ở mức huyết áp thấp.'
          : null,
  },
  {
    loai: 'duong_huyet', nhan: 'Đường huyết', bieuTuong: '🩸', donVi: 'mmol/L',
    buoc: 0.1, thapPhan: 1, macDinh: 5.5,
    goiY: 'Ghi rõ đo lúc đói hay sau ăn trong phần ghi chú.',
    canhBao: (gt) =>
      gt >= 7 ? 'Chỉ số cao hơn khoảng bình thường lúc đói (3,9–5,6 mmol/L).'
        : gt < 3.9 ? 'Chỉ số thấp hơn khoảng bình thường.'
          : null,
  },
  {
    loai: 'tam_trang', nhan: 'Tâm trạng', bieuTuong: '🙂', donVi: '/5',
    buoc: 1, thapPhan: 0, macDinh: 3,
  },
]

const KHOA_CHI_SO_BAT = 'chiSoDangBat'

export default function SucKhoe() {
  const dieuHuong = useNavigate()
  const { thongBao, hien, an } = useThongBao()
  const [dangBat, datDangBat] = useCaiDat<LoaiChiSo[]>(KHOA_CHI_SO_BAT, [
    'ngu', 'nhip_tim', 'huyet_ap',
  ])

  const [dangGhi, datDangGhi] = useState<CauHinhChiSo | null>(null)
  const [giaTri, datGiaTri] = useState(0)
  const [giaTriPhu, datGiaTriPhu] = useState(0)
  const [ghiChu, datGhiChu] = useState('')
  const [moChinh, datMoChinh] = useState(false)

  const homNay = ngayLocal()
  const ganDay = useLiveQuery(async () => {
    const tuNgay = themNgay(homNay, -30)
    const ds = await db.chiSoSucKhoe.where('ngay').between(tuNgay, homNay, true, true).toArray()
    return ds.filter((c) => !c.deletedAt && c.loai !== 'nuoc').sort((a, b) => b.thoiDiem - a.thoiDiem)
  }, [homNay])

  function ganNhatCua(loai: LoaiChiSo): ChiSoSucKhoe | undefined {
    return ganDay?.find((c) => c.loai === loai)
  }

  async function luuChiSo() {
    if (!dangGhi) return
    await db.chiSoSucKhoe.add({
      ngay: homNay,
      thoiDiem: Date.now(),
      loai: dangGhi.loai,
      giaTri,
      giaTriPhu: dangGhi.giaTriPhu ? giaTriPhu : undefined,
      donVi: dangGhi.donVi,
      ghiChu,
      taoLuc: Date.now(),
    })
    const canhBao = dangGhi.canhBao?.(giaTri, giaTriPhu)
    datDangGhi(null)
    datGhiChu('')
    hien(canhBao ? `${canhBao} Đây không phải chẩn đoán y khoa.` : 'Đã ghi', canhBao ? 'loi' : 'thanh_cong')
  }

  const hienThi = CHI_SO.filter((c) => dangBat.includes(c.loai))

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => dieuHuong(-1)} className="nut-phu px-3 py-2">←</button>
        <TieuDeTrang
          phu={
            <button onClick={() => datMoChinh(true)} className="text-sm text-emerald-400">
              Chọn chỉ số
            </button>
          }
        >
          Sức khỏe
        </TieuDeTrang>
      </div>

      <div className="space-y-3 mt-4">
        {hienThi.map((c) => {
          const ganNhat = ganNhatCua(c.loai)
          const canhBao = ganNhat ? c.canhBao?.(ganNhat.giaTri, ganNhat.giaTriPhu) : null
          return (
            <button
              key={c.loai}
              onClick={() => {
                datDangGhi(c)
                datGiaTri(ganNhat?.giaTri ?? c.macDinh)
                datGiaTriPhu(ganNhat?.giaTriPhu ?? c.giaTriPhu?.macDinh ?? 0)
                datGhiChu('')
              }}
              className="the w-full text-left hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{c.bieuTuong}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{c.nhan}</div>
                    <div className="text-xs text-slate-500">
                      {ganNhat
                        ? new Date(ganNhat.thoiDiem).toLocaleDateString('vi-VN')
                        : 'Chưa ghi lần nào'}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {ganNhat ? (
                    <>
                      <div className="font-semibold">
                        {ganNhat.giaTri}
                        {ganNhat.giaTriPhu !== undefined && c.loai === 'huyet_ap'
                          ? `/${ganNhat.giaTriPhu}`
                          : ''}
                      </div>
                      <div className="text-[10px] text-slate-500">{c.donVi}</div>
                    </>
                  ) : (
                    <span className="text-emerald-400 text-sm">Ghi +</span>
                  )}
                </div>
              </div>
              {canhBao && (
                <p className="text-xs text-amber-300 mt-2.5 border-t border-slate-800 pt-2.5">
                  ⚠️ {canhBao}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {hienThi.length === 0 && (
        <div className="the text-center py-8 text-sm text-slate-500">
          Chưa bật chỉ số nào. Bấm "Chọn chỉ số" để chọn thứ bạn muốn theo dõi.
        </div>
      )}

      <p className="text-xs text-slate-500 mt-5 leading-relaxed">
        App chỉ ghi lại số liệu bạn nhập, không chẩn đoán bệnh. Nếu có chỉ số bất thường lặp lại
        nhiều lần, hãy đi khám bác sĩ.
      </p>

      {ganDay && ganDay.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold mb-3">Đã ghi gần đây</h2>
          <div className="space-y-2">
            {ganDay.slice(0, 15).map((c) => {
              const ch = CHI_SO.find((x) => x.loai === c.loai)
              return (
                <div key={c.id} className="the py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm">
                      {ch?.bieuTuong} {ch?.nhan ?? c.loai}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(c.thoiDiem).toLocaleString('vi-VN', {
                        day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                      {c.ghiChu && ` · ${c.ghiChu}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">
                      {c.giaTri}
                      {c.giaTriPhu !== undefined && c.loai === 'huyet_ap' ? `/${c.giaTriPhu}` : ''}
                      <span className="text-xs text-slate-500 font-normal"> {c.donVi}</span>
                    </span>
                    <button
                      onClick={async () => {
                        await xoaMem(db.chiSoSucKhoe, c.id!)
                        hien('Đã xóa', 'thanh_cong', async () => {
                          await khoiPhuc(db.chiSoSucKhoe, c.id!)
                          an()
                        })
                      }}
                      className="text-slate-600 hover:text-rose-400 px-1"
                      aria-label="Xóa"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <BangTruot
        mo={!!dangGhi}
        dong={() => datDangGhi(null)}
        tieuDe={dangGhi ? `Ghi ${dangGhi.nhan.toLowerCase()}` : ''}
      >
        {dangGhi && (
          <div className="space-y-5">
            {dangGhi.goiY && <p className="text-sm text-slate-500">{dangGhi.goiY}</p>}
            <div>
              <label className="nhan">
                {dangGhi.loai === 'huyet_ap' ? 'Tâm thu' : dangGhi.nhan} ({dangGhi.donVi})
              </label>
              <NhapSo
                giaTri={giaTri} doiGiaTri={datGiaTri}
                buoc={dangGhi.buoc} thapPhan={dangGhi.thapPhan}
                toiThieu={0} donVi={dangGhi.donVi}
              />
            </div>
            {dangGhi.giaTriPhu && (
              <div>
                <label className="nhan">{dangGhi.giaTriPhu.nhan}</label>
                <NhapSo
                  giaTri={giaTriPhu} doiGiaTri={datGiaTriPhu}
                  buoc={dangGhi.loai === 'ngu' ? 1 : 1}
                  toiThieu={0}
                  toiDa={dangGhi.loai === 'ngu' ? 5 : 250}
                  donVi={dangGhi.giaTriPhu.donVi}
                />
              </div>
            )}
            <div>
              <label className="nhan">Ghi chú</label>
              <input
                className="o-nhap"
                placeholder={dangGhi.loai === 'duong_huyet' ? 'Lúc đói / sau ăn 2 giờ' : 'Không bắt buộc'}
                value={ghiChu}
                onChange={(e) => datGhiChu(e.target.value)}
              />
            </div>
            <button className="nut-chinh w-full" onClick={luuChiSo}>Lưu</button>
          </div>
        )}
      </BangTruot>

      <BangTruot mo={moChinh} dong={() => datMoChinh(false)} tieuDe="Chọn chỉ số theo dõi">
        <p className="text-sm text-slate-500 mb-4">
          Chỉ bật những gì bạn thực sự muốn theo dõi. Tắt một chỉ số không xóa dữ liệu đã ghi.
        </p>
        <div className="space-y-2">
          {CHI_SO.map((c) => (
            <label
              key={c.loai}
              className="the flex items-center gap-3 cursor-pointer py-3"
            >
              <input
                type="checkbox"
                checked={dangBat.includes(c.loai)}
                onChange={(e) =>
                  datDangBat(
                    e.target.checked
                      ? [...dangBat, c.loai]
                      : dangBat.filter((x) => x !== c.loai),
                  )
                }
                className="h-5 w-5 rounded accent-emerald-500"
              />
              <span className="text-xl">{c.bieuTuong}</span>
              <span className="text-sm font-medium">{c.nhan}</span>
            </label>
          ))}
        </div>
      </BangTruot>

      {thongBao && <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} hoanTac={thongBao.hoanTac} />}
    </div>
  )
}
