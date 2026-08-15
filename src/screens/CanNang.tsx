import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { db } from '../db/db'
import { ghiCanNang, layChuoiCanNang } from '../db/truyvan'
import {
  NHAN_BMI, duBaoSoNgayDatMucTieu, ngayLocal, phanLoaiBMI, themNgay, tinhBMI,
  tocDoThayDoiKgTuan, trungBinhDong,
} from '../lib/tinhtoan'
import { useNguoiDung, useThongBao } from '../hooks/useApp'
import { BangTruot, NhapSo, ThongBao, TieuDeTrang, TrangRong } from '../components/chung'

const KHOANG_XEM = [
  { ma: 7, nhan: '7 ngày' },
  { ma: 30, nhan: '1 tháng' },
  { ma: 90, nhan: '3 tháng' },
  { ma: 365, nhan: '1 năm' },
  { ma: 0, nhan: 'Tất cả' },
]

const SO_DO = [
  { khoa: 'eo', nhan: 'Vòng eo' },
  { khoa: 'mong', nhan: 'Vòng mông' },
  { khoa: 'nguc', nhan: 'Vòng ngực' },
  { khoa: 'tay', nhan: 'Vòng tay' },
  { khoa: 'dui', nhan: 'Vòng đùi' },
] as const

export default function CanNang() {
  const dieuHuong = useNavigate()
  const nguoiDung = useNguoiDung()
  const { thongBao, hien } = useThongBao()

  const [khoang, datKhoang] = useState(30)
  const [moGhi, datMoGhi] = useState(false)
  const [moSoDo, datMoSoDo] = useState(false)
  const [kgMoi, datKgMoi] = useState(70)
  const [tyLeMo, datTyLeMo] = useState(0)
  const [ngayGhi, datNgayGhi] = useState(ngayLocal())
  const [soDoMoi, datSoDoMoi] = useState<Record<string, number>>({})

  const chuoi = useLiveQuery(() => layChuoiCanNang(), [])
  const soDoGanNhat = useLiveQuery(async () => {
    const ds = (await db.soDoCoThe.toArray()).filter((s) => !s.deletedAt)
    return ds.sort((a, b) => b.ngay.localeCompare(a.ngay))[0]
  }, [])

  const duLieu = useMemo(() => {
    if (!chuoi || chuoi.length === 0) return []
    const loc = khoang === 0
      ? chuoi
      : chuoi.filter((c) => c.ngay >= themNgay(ngayLocal(), -khoang))
    const tb = trungBinhDong(loc, (c) => c.kg, 7)
    return loc.map((c, i) => ({
      ngay: c.ngay,
      nhan: new Date(c.ngay + 'T00:00:00').toLocaleDateString('vi-VN', {
        day: 'numeric', month: 'numeric',
      }),
      kg: c.kg,
      trungBinh: tb[i],
    }))
  }, [chuoi, khoang])

  const thongKe = useMemo(() => {
    if (!chuoi || chuoi.length === 0 || !nguoiDung) return null
    const hienTai = chuoi[chuoi.length - 1].kg
    const banDau = chuoi[0].kg
    const tuanTruoc = chuoi.filter((c) => c.ngay >= themNgay(ngayLocal(), -7))
    // Dùng hồi quy trên 30 ngày gần nhất: ổn định hơn lấy hai điểm đầu cuối.
    const gan30 = chuoi.filter((c) => c.ngay >= themNgay(ngayLocal(), -30))
    const tocDo = tocDoThayDoiKgTuan(gan30.length >= 2 ? gan30 : chuoi)
    const soNgayConLai = duBaoSoNgayDatMucTieu(hienTai, nguoiDung.canNangMucTieuKg, tocDo)
    const ngayDat = soNgayConLai !== null ? themNgay(ngayLocal(), soNgayConLai) : null
    const bmi = tinhBMI(hienTai, nguoiDung.chieuCaoCm)

    return {
      hienTai,
      thayDoiTong: Math.round((hienTai - banDau) * 10) / 10,
      thayDoiTuan:
        tuanTruoc.length >= 2
          ? Math.round((hienTai - tuanTruoc[0].kg) * 10) / 10
          : null,
      conLai: Math.round((hienTai - nguoiDung.canNangMucTieuKg) * 10) / 10,
      tocDo,
      ngayDat,
      bmi,
    }
  }, [chuoi, nguoiDung])

  if (!nguoiDung) return null

  async function luuCanNang() {
    await ghiCanNang(ngayGhi, kgMoi, tyLeMo > 0 ? tyLeMo : undefined)
    datMoGhi(false)
    hien('Đã ghi cân nặng')
  }

  async function luuSoDo() {
    const co = Object.entries(soDoMoi).filter(([, v]) => v > 0)
    if (co.length === 0) {
      datMoSoDo(false)
      return
    }
    const daCo = await db.soDoCoThe.where('ngay').equals(ngayLocal()).first()
    const ban = { ...Object.fromEntries(co), ngay: ngayLocal(), taoLuc: Date.now() }
    if (daCo) await db.soDoCoThe.update(daCo.id!, ban)
    else await db.soDoCoThe.add(ban as never)
    datMoSoDo(false)
    hien('Đã ghi số đo')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => dieuHuong(-1)} className="nut-phu px-3 py-2">←</button>
        <TieuDeTrang>Cân nặng</TieuDeTrang>
      </div>

      {thongKe ? (
        <>
          <div className="the mb-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold">{thongKe.hienTai}</div>
                <div className="text-sm text-slate-500 mt-0.5">kg hiện tại</div>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  BMI <span className="font-semibold">{thongKe.bmi}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {NHAN_BMI[phanLoaiBMI(thongKe.bmi)]}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="the py-3">
              <div className="text-xs text-slate-500">Tuần này</div>
              <div
                className={`text-lg font-semibold ${
                  thongKe.thayDoiTuan === null
                    ? ''
                    : thongKe.thayDoiTuan < 0
                      ? 'text-emerald-400'
                      : thongKe.thayDoiTuan > 0
                        ? 'text-amber-400'
                        : ''
                }`}
              >
                {thongKe.thayDoiTuan === null
                  ? '—'
                  : `${thongKe.thayDoiTuan > 0 ? '+' : ''}${thongKe.thayDoiTuan} kg`}
              </div>
            </div>
            <div className="the py-3">
              <div className="text-xs text-slate-500">Từ lúc bắt đầu</div>
              <div className="text-lg font-semibold">
                {thongKe.thayDoiTong > 0 ? '+' : ''}
                {thongKe.thayDoiTong} kg
              </div>
            </div>
            <div className="the py-3">
              <div className="text-xs text-slate-500">Còn tới mục tiêu</div>
              <div className="text-lg font-semibold">
                {Math.abs(thongKe.conLai)} kg
              </div>
            </div>
            <div className="the py-3">
              <div className="text-xs text-slate-500">Tốc độ</div>
              <div className="text-lg font-semibold">
                {thongKe.tocDo === null
                  ? '—'
                  : `${thongKe.tocDo > 0 ? '+' : ''}${thongKe.tocDo} kg/tuần`}
              </div>
            </div>
          </div>

          {thongKe.ngayDat && (
            <div className="the mb-3 text-sm">
              <span className="text-slate-400">Với tốc độ này, bạn đạt </span>
              <span className="font-semibold">{nguoiDung.canNangMucTieuKg} kg</span>
              <span className="text-slate-400"> khoảng </span>
              <span className="font-semibold">
                {new Date(thongKe.ngayDat + 'T00:00:00').toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}

          <div className="flex gap-2 mb-3 overflow-x-auto an-thanh-cuon">
            {KHOANG_XEM.map((k) => (
              <button
                key={k.ma}
                onClick={() => datKhoang(k.ma)}
                className={`shrink-0 text-sm ${khoang === k.ma ? 'chip-bat' : 'chip-tat'}`}
              >
                {k.nhan}
              </button>
            ))}
          </div>

          <div className="the mb-3">
            {duLieu.length >= 2 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={duLieu} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="nhan"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#334155"
                    minTickGap={24}
                  />
                  <YAxis
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#334155"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v: number, ten: string) => [
                      `${v} kg`,
                      ten === 'kg' ? 'Cân nặng' : 'Trung bình 7 ngày',
                    ]}
                  />
                  <Line
                    type="monotone" dataKey="kg" stroke="#475569" strokeWidth={1.5}
                    dot={{ r: 2.5, fill: '#475569' }} activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone" dataKey="trungBinh" stroke="#10b981" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-sm text-slate-500 py-10">
                Cần ít nhất 2 lần cân để vẽ biểu đồ
              </p>
            )}
            <p className="text-xs text-slate-500 text-center mt-2">
              <span className="text-emerald-400">━</span> Trung bình 7 ngày ·{' '}
              <span className="text-slate-600">━</span> Số cân từng ngày
            </p>
          </div>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Cân nặng dao động 1–2 kg mỗi ngày do nước và thức ăn trong người là chuyện bình thường.
            Hãy nhìn đường xanh — đó mới là xu hướng thật.
          </p>
        </>
      ) : (
        <TrangRong
          bieuTuong="⚖️"
          tieuDe="Chưa có dữ liệu cân nặng"
          moTa="Cân vào buổi sáng sau khi đi vệ sinh, trước khi ăn — đó là lúc số cân ổn định nhất."
        />
      )}

      <div className="flex gap-3">
        <button
          className="nut-chinh flex-1"
          onClick={() => {
            datKgMoi(thongKe?.hienTai ?? 70)
            datNgayGhi(ngayLocal())
            datMoGhi(true)
          }}
        >
          Ghi cân nặng
        </button>
        <button
          className="nut-phu flex-1"
          onClick={() => {
            datSoDoMoi(
              soDoGanNhat
                ? Object.fromEntries(
                    SO_DO.map((s) => [s.khoa, (soDoGanNhat[s.khoa] as number) ?? 0]),
                  )
                : {},
            )
            datMoSoDo(true)
          }}
        >
          Số đo cơ thể
        </button>
      </div>

      {soDoGanNhat && (
        <div className="the mt-4">
          <div className="text-sm font-medium mb-3">
            Số đo gần nhất ·{' '}
            <span className="text-slate-500 font-normal">
              {new Date(soDoGanNhat.ngay + 'T00:00:00').toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {SO_DO.map((s) => {
              const gt = soDoGanNhat[s.khoa] as number | undefined
              if (!gt) return null
              return (
                <div key={s.khoa}>
                  <div className="font-semibold">{gt} cm</div>
                  <div className="text-xs text-slate-500">{s.nhan}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <BangTruot mo={moGhi} dong={() => datMoGhi(false)} tieuDe="Ghi cân nặng">
        <div className="space-y-5">
          <div>
            <label className="nhan">Ngày</label>
            <input
              type="date"
              className="o-nhap"
              value={ngayGhi}
              max={ngayLocal()}
              onChange={(e) => datNgayGhi(e.target.value)}
            />
          </div>
          <div>
            <label className="nhan">Cân nặng</label>
            <NhapSo
              giaTri={kgMoi} doiGiaTri={datKgMoi}
              buoc={0.1} toiThieu={25} toiDa={300} donVi="kg" thapPhan={1}
            />
          </div>
          <div>
            <label className="nhan">Tỷ lệ mỡ (nếu có cân thông minh)</label>
            <NhapSo
              giaTri={tyLeMo} doiGiaTri={datTyLeMo}
              buoc={0.5} toiThieu={0} toiDa={70} donVi="%" thapPhan={1}
            />
          </div>
          <button className="nut-chinh w-full" onClick={luuCanNang}>Lưu</button>
        </div>
      </BangTruot>

      <BangTruot mo={moSoDo} dong={() => datMoSoDo(false)} tieuDe="Số đo cơ thể">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Số đo thường phản ánh tiến bộ rõ hơn cân nặng, nhất là khi bạn vừa giảm mỡ vừa tăng cơ.
          </p>
          {SO_DO.map((s) => (
            <div key={s.khoa}>
              <label className="nhan">{s.nhan}</label>
              <NhapSo
                giaTri={soDoMoi[s.khoa] ?? 0}
                doiGiaTri={(v) => datSoDoMoi((cu) => ({ ...cu, [s.khoa]: v }))}
                buoc={0.5} toiThieu={0} toiDa={250} donVi="cm" thapPhan={1}
              />
            </div>
          ))}
          <button className="nut-chinh w-full" onClick={luuSoDo}>Lưu số đo</button>
        </div>
      </BangTruot>

      {thongBao && <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} />}
    </div>
  )
}
