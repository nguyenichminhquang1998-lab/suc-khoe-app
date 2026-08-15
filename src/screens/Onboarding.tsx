import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { luuNguoiDung } from '../db/db'
import { ghiCanNang } from '../db/truyvan'
import {
  MACRO_MAC_DINH, NHAN_BMI, NHAN_MUC_TIEU, NHAN_MUC_VAN_DONG,
  ngayLocal, phanLoaiBMI, tinhBMI, tinhBMR, tinhCaloMucTieu, tinhMacroGam,
  tinhNuocMucTieuMl, tinhTDEE, tinhTuoi,
} from '../lib/tinhtoan'
import type { CheDoAn, GioiTinh, MucTieu, MucVanDong } from '../lib/types'
import { NhapSo } from '../components/chung'

const TOC_DO = [0.25, 0.5, 0.75, 1.0]

const CHE_DO_AN: { ma: CheDoAn; nhan: string }[] = [
  { ma: 'binh_thuong', nhan: 'Bình thường' },
  { ma: 'chay', nhan: 'Chay' },
  { ma: 'thuan_chay', nhan: 'Thuần chay' },
  { ma: 'low_carb', nhan: 'Low-carb' },
  { ma: 'keto', nhan: 'Keto' },
  { ma: 'eat_clean', nhan: 'Eat-clean' },
]

const BENH_NEN = ['Tiểu đường', 'Cao huyết áp', 'Mỡ máu', 'Gout', 'Dạ dày', 'Thận']

export default function Onboarding() {
  const dieuHuong = useNavigate()
  const [buoc, datBuoc] = useState(1)
  const [dangLuu, datDangLuu] = useState(false)

  const [ten, datTen] = useState('')
  const [gioiTinh, datGioiTinh] = useState<GioiTinh>('nam')
  const [ngaySinh, datNgaySinh] = useState('1995-01-01')
  const [chieuCao, datChieuCao] = useState(170)
  const [canNang, datCanNang] = useState(70)
  const [mucVanDong, datMucVanDong] = useState<MucVanDong>('nhe')
  const [mucTieu, datMucTieu] = useState<MucTieu>('giam_can')
  const [canNangMucTieu, datCanNangMucTieu] = useState(65)
  const [tocDo, datTocDo] = useState(0.5)
  const [cheDoAn, datCheDoAn] = useState<CheDoAn>('binh_thuong')
  const [benhNen, datBenhNen] = useState<string[]>([])

  const tinhToan = useMemo(() => {
    const tuoi = tinhTuoi(ngaySinh)
    const bmr = tinhBMR(gioiTinh, canNang, chieuCao, tuoi)
    const tdee = tinhTDEE(bmr, mucVanDong)
    const kqCalo = tinhCaloMucTieu(tdee, mucTieu, tocDo, gioiTinh)
    const tyLe = MACRO_MAC_DINH[mucTieu]
    const macro = tinhMacroGam(kqCalo.calo, tyLe)
    const bmi = tinhBMI(canNang, chieuCao)
    const soTuan = tocDo > 0 ? Math.abs(canNang - canNangMucTieu) / tocDo : 0
    const ngayDat = new Date()
    ngayDat.setDate(ngayDat.getDate() + Math.ceil(soTuan * 7))
    return { tuoi, bmr, tdee, kqCalo, tyLe, macro, bmi, soTuan, ngayDat }
  }, [ngaySinh, gioiTinh, canNang, chieuCao, mucVanDong, mucTieu, tocDo, canNangMucTieu])

  const tocDoQuaNhanh = tocDo > 0.75 && mucTieu === 'giam_can'

  async function hoanTat() {
    datDangLuu(true)
    try {
      const bayGio = Date.now()
      await luuNguoiDung({
        ten: ten.trim() || 'Bạn',
        gioiTinh,
        ngaySinh,
        chieuCaoCm: chieuCao,
        mucVanDong,
        mucTieu,
        canNangMucTieuKg: canNangMucTieu,
        tocDoKgTuan: tocDo,
        cheDoAn,
        diUng: [],
        benhNen,
        caloMucTieu: tinhToan.kqCalo.calo,
        macroDamPhanTram: tinhToan.tyLe.dam,
        macroTinhbotPhanTram: tinhToan.tyLe.tinhbot,
        macroBeoPhanTram: tinhToan.tyLe.beo,
        nuocMucTieuMl: tinhNuocMucTieuMl(canNang),
        congCaloTapLuyen: false,
        taoLuc: bayGio,
        suaLuc: bayGio,
      })
      // Cân nặng lúc đăng ký là điểm đầu tiên của biểu đồ.
      await ghiCanNang(ngayLocal(), canNang, undefined, 'Cân nặng ban đầu')
      dieuHuong('/', { replace: true })
    } finally {
      datDangLuu(false)
    }
  }

  return (
    <div className="pb-8">
      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3, 4, 5].map((b) => (
          <div
            key={b}
            className={`h-1 flex-1 rounded-full transition ${
              b <= buoc ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {buoc === 1 && (
        <section>
          <h1 className="text-2xl font-bold">Chào bạn 👋</h1>
          <p className="text-slate-400 mt-1.5 mb-6">
            App cần vài thông tin cơ bản để tính lượng calo phù hợp với bạn. Mọi thứ được lưu
            trên máy bạn, không gửi đi đâu cả.
          </p>

          <div className="space-y-5">
            <div>
              <label className="nhan">Tên gọi</label>
              <input
                className="o-nhap"
                placeholder="Bạn muốn app gọi mình là gì?"
                value={ten}
                onChange={(e) => datTen(e.target.value)}
              />
            </div>

            <div>
              <label className="nhan">Giới tính</label>
              <div className="flex gap-2">
                {([['nam', 'Nam'], ['nu', 'Nữ'], ['khac', 'Khác']] as [GioiTinh, string][]).map(
                  ([ma, nhan]) => (
                    <button
                      key={ma}
                      onClick={() => datGioiTinh(ma)}
                      className={`flex-1 ${gioiTinh === ma ? 'chip-bat' : 'chip-tat'}`}
                    >
                      {nhan}
                    </button>
                  ),
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Dùng để tính nhu cầu calo, công thức cho nam và nữ khác nhau.
              </p>
            </div>

            <div>
              <label className="nhan">Ngày sinh</label>
              <input
                type="date"
                className="o-nhap"
                value={ngaySinh}
                max={ngayLocal()}
                onChange={(e) => datNgaySinh(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1.5">{tinhToan.tuoi} tuổi</p>
            </div>

            <div>
              <label className="nhan">Chiều cao</label>
              <NhapSo
                giaTri={chieuCao} doiGiaTri={datChieuCao}
                buoc={1} toiThieu={100} toiDa={250} donVi="cm"
              />
            </div>

            <div>
              <label className="nhan">Cân nặng hiện tại</label>
              <NhapSo
                giaTri={canNang} doiGiaTri={datCanNang}
                buoc={0.5} toiThieu={25} toiDa={300} donVi="kg" thapPhan={1}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                BMI {tinhToan.bmi} — {NHAN_BMI[phanLoaiBMI(tinhToan.bmi)]}
              </p>
            </div>
          </div>
        </section>
      )}

      {buoc === 2 && (
        <section>
          <h1 className="text-2xl font-bold">Bạn vận động thế nào?</h1>
          <p className="text-slate-400 mt-1.5 mb-6">
            Chọn mức gần đúng nhất với sinh hoạt hàng ngày của bạn.
          </p>
          <div className="space-y-2.5">
            {(Object.keys(NHAN_MUC_VAN_DONG) as MucVanDong[]).map((ma) => (
              <button
                key={ma}
                onClick={() => datMucVanDong(ma)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  mucVanDong === ma
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="font-medium">{NHAN_MUC_VAN_DONG[ma]}</div>
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-5">
            Nhu cầu calo ước tính: <span className="text-slate-300 font-semibold">{tinhToan.tdee} kcal/ngày</span>
          </p>
        </section>
      )}

      {buoc === 3 && (
        <section>
          <h1 className="text-2xl font-bold">Mục tiêu của bạn</h1>
          <p className="text-slate-400 mt-1.5 mb-6">Bạn muốn cơ thể thay đổi theo hướng nào?</p>

          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {(Object.keys(NHAN_MUC_TIEU) as MucTieu[]).map((ma) => (
              <button
                key={ma}
                onClick={() => {
                  datMucTieu(ma)
                  if (ma === 'giu_can') datCanNangMucTieu(canNang)
                }}
                className={`rounded-xl border p-4 font-medium transition ${
                  mucTieu === ma
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {NHAN_MUC_TIEU[ma]}
              </button>
            ))}
          </div>

          {mucTieu !== 'giu_can' && (
            <>
              <div className="mb-5">
                <label className="nhan">Cân nặng mục tiêu</label>
                <NhapSo
                  giaTri={canNangMucTieu} doiGiaTri={datCanNangMucTieu}
                  buoc={0.5} toiThieu={25} toiDa={300} donVi="kg" thapPhan={1}
                />
              </div>

              <div>
                <label className="nhan">Tốc độ mong muốn</label>
                <div className="grid grid-cols-4 gap-2">
                  {TOC_DO.map((t) => (
                    <button
                      key={t}
                      onClick={() => datTocDo(t)}
                      className={tocDo === t ? 'chip-bat' : 'chip-tat'}
                    >
                      {t} kg
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">mỗi tuần</p>
              </div>

              {tocDoQuaNhanh && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-sm text-amber-200">
                  Giảm hơn 0,75 kg mỗi tuần thường khiến bạn mất cơ và rất khó duy trì.
                  Tốc độ 0,5 kg/tuần bền hơn nhiều.
                </div>
              )}

              {tinhToan.kqCalo.biKep && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200">
                  Với tốc độ này, calo tính ra chỉ còn {tinhToan.kqCalo.caloTruocKhiKep} kcal —
                  thấp hơn mức an toàn. App đã nâng lên {tinhToan.kqCalo.calo} kcal.
                  Bạn nên chọn tốc độ chậm hơn.
                </div>
              )}

              {tinhToan.soTuan > 0 && (
                <p className="text-sm text-slate-400 mt-5">
                  Dự kiến đạt mục tiêu khoảng{' '}
                  <span className="text-slate-200 font-semibold">
                    {tinhToan.ngayDat.toLocaleDateString('vi-VN')}
                  </span>{' '}
                  ({Math.ceil(tinhToan.soTuan)} tuần)
                </p>
              )}
            </>
          )}
        </section>
      )}

      {buoc === 4 && (
        <section>
          <h1 className="text-2xl font-bold">Thêm vài chi tiết</h1>
          <p className="text-slate-400 mt-1.5 mb-6">Phần này không bắt buộc, bỏ qua cũng được.</p>

          <div className="mb-6">
            <label className="nhan">Chế độ ăn</label>
            <div className="flex flex-wrap gap-2">
              {CHE_DO_AN.map((c) => (
                <button
                  key={c.ma}
                  onClick={() => datCheDoAn(c.ma)}
                  className={cheDoAn === c.ma ? 'chip-bat' : 'chip-tat'}
                >
                  {c.nhan}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="nhan">Bệnh nền cần lưu ý</label>
            <div className="flex flex-wrap gap-2">
              {BENH_NEN.map((b) => (
                <button
                  key={b}
                  onClick={() =>
                    datBenhNen((cu) => (cu.includes(b) ? cu.filter((x) => x !== b) : [...cu, b]))
                  }
                  className={benhNen.includes(b) ? 'chip-bat' : 'chip-tat'}
                >
                  {b}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              App sẽ bật sẵn các chỉ số liên quan để bạn theo dõi. Đây không phải công cụ
              chẩn đoán y khoa.
            </p>
          </div>
        </section>
      )}

      {buoc === 5 && (
        <section>
          <h1 className="text-2xl font-bold">Đây là mục tiêu của bạn</h1>
          <p className="text-slate-400 mt-1.5 mb-6">
            Bạn chỉnh lại được bất cứ lúc nào trong phần Cài đặt.
          </p>

          <div className="the mb-4">
            <div className="text-center py-2">
              <div className="text-4xl font-bold text-emerald-400">{tinhToan.kqCalo.calo}</div>
              <div className="text-sm text-slate-400 mt-1">kcal mỗi ngày</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[
              ['Đạm', tinhToan.macro.dam, 'text-blue-400'],
              ['Tinh bột', tinhToan.macro.tinhbot, 'text-amber-400'],
              ['Béo', tinhToan.macro.beo, 'text-purple-400'],
            ].map(([nhan, gam, mau]) => (
              <div key={nhan as string} className="the text-center py-3">
                <div className={`text-xl font-bold ${mau}`}>{gam as number}g</div>
                <div className="text-xs text-slate-500 mt-0.5">{nhan as string}</div>
              </div>
            ))}
          </div>

          <div className="the space-y-2.5 text-sm">
            {[
              ['Trao đổi chất cơ bản (BMR)', `${tinhToan.bmr} kcal`],
              ['Tiêu hao cả ngày (TDEE)', `${tinhToan.tdee} kcal`],
              ['Nước nên uống', `${tinhNuocMucTieuMl(canNang)} ml`],
              ['BMI', `${tinhToan.bmi} — ${NHAN_BMI[phanLoaiBMI(tinhToan.bmi)]}`],
            ].map(([nhan, gt]) => (
              <div key={nhan} className="flex justify-between">
                <span className="text-slate-400">{nhan}</span>
                <span className="font-medium">{gt}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mt-5 leading-relaxed">
            Các con số này là ước lượng theo công thức Mifflin-St Jeor, dùng làm điểm khởi đầu.
            Sau 2–3 tuần theo dõi cân nặng thực tế, bạn nên chỉnh lại cho khớp với cơ thể mình.
          </p>
        </section>
      )}

      <div className="flex gap-3 mt-8">
        {buoc > 1 && (
          <button className="nut-vien flex-1" onClick={() => datBuoc(buoc - 1)}>
            Quay lại
          </button>
        )}
        {buoc < 5 ? (
          <button className="nut-chinh flex-1" onClick={() => datBuoc(buoc + 1)}>
            Tiếp tục
          </button>
        ) : (
          <button className="nut-chinh flex-1" onClick={hoanTat} disabled={dangLuu}>
            {dangLuu ? 'Đang lưu...' : 'Bắt đầu dùng app'}
          </button>
        )}
      </div>
    </div>
  )
}
