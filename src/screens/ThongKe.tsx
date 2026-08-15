import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { db } from '../db/db'
import { caloTheoKhoang, layChuoiCanNang, layNhatKyTapTheoKhoang } from '../db/truyvan'
import { NHAN_NHOM_CO } from '../data/baitap'
import { khoangNgay, ngayLocal, themNgay, trungBinhDong } from '../lib/tinhtoan'
import { useChiSoMucTieu, useNguoiDung } from '../hooks/useApp'
import { TieuDeTrang, TrangRong } from '../components/chung'
import type { NhomCo } from '../lib/types'

type Khoang = 'tuan' | 'thang' | 'nam'

const SO_NGAY: Record<Khoang, number> = { tuan: 7, thang: 30, nam: 365 }

export default function ThongKe() {
  const nguoiDung = useNguoiDung()
  const mucTieu = useChiSoMucTieu(nguoiDung)
  const [khoang, datKhoang] = useState<Khoang>('tuan')

  const soNgay = SO_NGAY[khoang]
  const tuNgay = themNgay(ngayLocal(), -(soNgay - 1))
  const denNgay = ngayLocal()

  const calo = useLiveQuery(() => caloTheoKhoang(tuNgay, denNgay), [tuNgay, denNgay])
  const canNang = useLiveQuery(() => layChuoiCanNang(), [])
  const buoiTap = useLiveQuery(() => layNhatKyTapTheoKhoang(tuNgay, denNgay), [tuNgay, denNgay])
  const nhomCoTuan = useLiveQuery(async () => {
    const buoi = await layNhatKyTapTheoKhoang(themNgay(ngayLocal(), -6), ngayLocal())
    if (buoi.length === 0) return {} as Record<NhomCo, number>
    const sets = await db.setTap.where('nhatKyTapId').anyOf(buoi.map((b) => b.id!)).toArray()
    const baiTap = await db.baiTap.toArray()
    const dem = {} as Record<NhomCo, number>
    for (const s of sets.filter((x) => x.hoanThanh)) {
      const bai = baiTap.find((b) => b.id === s.baiTapId)
      if (bai) dem[bai.nhomCo] = (dem[bai.nhomCo] ?? 0) + 1
    }
    return dem
  }, [])

  if (!nguoiDung || !mucTieu) return null

  const coDuLieu = calo?.some((c) => c.calo > 0)

  const duLieuCalo = (calo ?? []).map((c) => ({
    ...c,
    nhan: new Date(c.ngay + 'T00:00:00').toLocaleDateString('vi-VN', {
      day: 'numeric', month: 'numeric',
    }),
  }))

  const ngayCoLog = duLieuCalo.filter((c) => c.calo > 0)
  const caloTrungBinh = ngayCoLog.length > 0
    ? Math.round(ngayCoLog.reduce((t, c) => t + c.calo, 0) / ngayCoLog.length)
    : 0
  const soNgayDatMucTieu = ngayCoLog.filter(
    (c) => Math.abs(c.calo - mucTieu.calo) <= mucTieu.calo * 0.1,
  ).length

  const macroTrungBinh = ngayCoLog.length > 0
    ? {
        dam: Math.round(ngayCoLog.reduce((t, c) => t + c.dam, 0) / ngayCoLog.length),
        tinhbot: Math.round(ngayCoLog.reduce((t, c) => t + c.tinhbot, 0) / ngayCoLog.length),
        beo: Math.round(ngayCoLog.reduce((t, c) => t + c.beo, 0) / ngayCoLog.length),
      }
    : { dam: 0, tinhbot: 0, beo: 0 }

  const canNangTrongKhoang = (canNang ?? []).filter((c) => c.ngay >= tuNgay)
  const thayDoiCan =
    canNangTrongKhoang.length >= 2
      ? Math.round(
          (canNangTrongKhoang[canNangTrongKhoang.length - 1].kg - canNangTrongKhoang[0].kg) * 10,
        ) / 10
      : null

  const duLieuCan = (() => {
    if (canNangTrongKhoang.length === 0) return []
    const tb = trungBinhDong(canNangTrongKhoang, (c) => c.kg, 7)
    return canNangTrongKhoang.map((c, i) => ({
      nhan: new Date(c.ngay + 'T00:00:00').toLocaleDateString('vi-VN', {
        day: 'numeric', month: 'numeric',
      }),
      kg: c.kg,
      trungBinh: tb[i],
    }))
  })()

  // Lịch nhiệt: mỗi ô là một ngày, đậm nhạt theo mức calo so với mục tiêu.
  const lichNhiet = khoangNgay(themNgay(ngayLocal(), -83), ngayLocal()).map((ngay) => {
    const c = calo?.find((x) => x.ngay === ngay)
    return { ngay, calo: c?.calo ?? 0 }
  })

  return (
    <div>
      <TieuDeTrang>Thống kê</TieuDeTrang>

      <div className="flex gap-2 mb-4">
        {([['tuan', 'Tuần'], ['thang', 'Tháng'], ['nam', 'Năm']] as [Khoang, string][]).map(
          ([ma, nhan]) => (
            <button
              key={ma}
              onClick={() => datKhoang(ma)}
              className={`flex-1 ${khoang === ma ? 'chip-bat' : 'chip-tat'}`}
            >
              {nhan}
            </button>
          ),
        )}
      </div>

      {!coDuLieu ? (
        <TrangRong
          bieuTuong="📊"
          tieuDe="Chưa đủ dữ liệu để thống kê"
          moTa="Ghi log vài ngày rồi quay lại đây, bạn sẽ thấy xu hướng ăn uống và cân nặng của mình."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="the py-3">
              <div className="text-xs text-slate-500">Calo trung bình</div>
              <div className="text-xl font-semibold">{caloTrungBinh}</div>
              <div className="text-xs text-slate-600">mục tiêu {mucTieu.calo}</div>
            </div>
            <div className="the py-3">
              <div className="text-xs text-slate-500">Ngày đạt mục tiêu</div>
              <div className="text-xl font-semibold">
                {soNgayDatMucTieu}/{ngayCoLog.length}
              </div>
              <div className="text-xs text-slate-600">sai lệch dưới 10%</div>
            </div>
            <div className="the py-3">
              <div className="text-xs text-slate-500">Thay đổi cân nặng</div>
              <div className="text-xl font-semibold">
                {thayDoiCan === null ? '—' : `${thayDoiCan > 0 ? '+' : ''}${thayDoiCan} kg`}
              </div>
            </div>
            <div className="the py-3">
              <div className="text-xs text-slate-500">Buổi tập</div>
              <div className="text-xl font-semibold">
                {buoiTap?.filter((b) => b.ketThuc).length ?? 0}
              </div>
            </div>
          </div>

          <section className="mb-5">
            <h2 className="font-semibold mb-3">Calo theo ngày</h2>
            <div className="the">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={duLieuCalo} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="nhan" tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#334155" minTickGap={20}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#334155" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a', border: '1px solid #1e293b',
                      borderRadius: 12, fontSize: 13,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(v: number) => [`${v} kcal`, 'Đã ăn']}
                    cursor={{ fill: '#1e293b40' }}
                  />
                  <Bar dataKey="calo" radius={[4, 4, 0, 0]}>
                    {duLieuCalo.map((c, i) => (
                      <Cell
                        key={i}
                        fill={
                          c.calo === 0
                            ? '#1e293b'
                            : c.calo > mucTieu.calo * 1.1
                              ? '#f43f5e'
                              : '#10b981'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 text-center mt-1">
                <span className="text-emerald-400">■</span> Trong mục tiêu ·{' '}
                <span className="text-rose-400">■</span> Vượt hơn 10%
              </p>
            </div>
          </section>

          <section className="mb-5">
            <h2 className="font-semibold mb-3">Macro trung bình mỗi ngày</h2>
            <div className="the grid grid-cols-3 gap-3 text-center">
              {[
                ['Đạm', macroTrungBinh.dam, mucTieu.dam, 'text-blue-400'],
                ['Tinh bột', macroTrungBinh.tinhbot, mucTieu.tinhbot, 'text-amber-400'],
                ['Béo', macroTrungBinh.beo, mucTieu.beo, 'text-purple-400'],
              ].map(([nhan, gt, mt, mau]) => (
                <div key={nhan as string}>
                  <div className={`text-xl font-bold ${mau}`}>{gt as number}g</div>
                  <div className="text-xs text-slate-500">{nhan as string}</div>
                  <div className="text-[10px] text-slate-600">mục tiêu {mt as number}g</div>
                </div>
              ))}
            </div>
          </section>

          {duLieuCan.length >= 2 && (
            <section className="mb-5">
              <h2 className="font-semibold mb-3">Cân nặng</h2>
              <div className="the">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={duLieuCan} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="nhan" tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#334155" minTickGap={24}
                    />
                    <YAxis
                      domain={['dataMin - 1', 'dataMax + 1']}
                      tick={{ fontSize: 11, fill: '#64748b' }} stroke="#334155"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a', border: '1px solid #1e293b',
                        borderRadius: 12, fontSize: 13,
                      }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(v: number) => [`${v} kg`, '']}
                    />
                    <Line
                      type="monotone" dataKey="kg" stroke="#475569" strokeWidth={1.5}
                      dot={{ r: 2 }}
                    />
                    <Line
                      type="monotone" dataKey="trungBinh" stroke="#10b981" strokeWidth={2.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {nhomCoTuan && Object.keys(nhomCoTuan).length > 0 && (
            <section className="mb-5">
              <h2 className="font-semibold mb-3">Nhóm cơ tuần này</h2>
              <div className="the space-y-2.5">
                {(Object.keys(NHAN_NHOM_CO) as NhomCo[])
                  .filter((n) => (nhomCoTuan[n] ?? 0) > 0)
                  .sort((a, b) => (nhomCoTuan[b] ?? 0) - (nhomCoTuan[a] ?? 0))
                  .map((n) => {
                    const soSet = nhomCoTuan[n] ?? 0
                    const max = Math.max(...Object.values(nhomCoTuan))
                    return (
                      <div key={n}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">{NHAN_NHOM_CO[n]}</span>
                          <span className="text-slate-300">{soSet} set</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${(soSet / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </section>
          )}

          <section className="mb-5">
            <h2 className="font-semibold mb-3">12 tuần gần đây</h2>
            <div className="the">
              <div className="grid grid-cols-[repeat(12,1fr)] gap-1">
                {lichNhiet.map((o) => (
                  <div
                    key={o.ngay}
                    title={`${new Date(o.ngay + 'T00:00:00').toLocaleDateString('vi-VN')}: ${o.calo} kcal`}
                    className="aspect-square rounded-[3px]"
                    style={{
                      backgroundColor:
                        o.calo === 0
                          ? '#1e293b'
                          : o.calo < mucTieu.calo * 0.5
                            ? '#065f46'
                            : o.calo <= mucTieu.calo * 1.1
                              ? '#10b981'
                              : '#f43f5e',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Mỗi ô là một ngày. Ô xám là ngày chưa ghi log.
              </p>
            </div>
          </section>

          <p className="text-xs text-slate-500 leading-relaxed">
            Các con số ở đây mô tả những gì bạn đã ghi lại, không phải kết luận nhân quả.
            Cân nặng chịu ảnh hưởng của nhiều yếu tố ngoài calo: nước, muối, giấc ngủ, chu kỳ.
          </p>
        </>
      )}
    </div>
  )
}
