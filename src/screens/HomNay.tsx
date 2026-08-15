import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import {
  layNhatKyAnTheoNgay, layNhatKyTapTheoKhoang, themNuoc, tinhChuoiNgayGhiLog,
  tongDinhDuong, tongNuocTrongNgay,
} from '../db/truyvan'
import { ngayLocal, tinhCaloConLai } from '../lib/tinhtoan'
import { useChiSoMucTieu, useNguoiDung, useThongBao } from '../hooks/useApp'
import { ThanhMacro, ThongBao, VongTienDo } from '../components/chung'
import type { LoaiBua } from '../lib/types'

const TEN_BUA: Record<LoaiBua, string> = {
  sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Bữa phụ',
}

const LUONG_NUOC_NHANH = [100, 250, 500]

export default function HomNay() {
  const homNay = ngayLocal()
  const dieuHuong = useNavigate()
  const nguoiDung = useNguoiDung()
  const mucTieu = useChiSoMucTieu(nguoiDung)
  const { thongBao, hien } = useThongBao()

  const buaAn = useLiveQuery(() => layNhatKyAnTheoNgay(homNay), [homNay])
  const nuocMl = useLiveQuery(() => tongNuocTrongNgay(homNay), [homNay])
  const buoiTap = useLiveQuery(() => layNhatKyTapTheoKhoang(homNay, homNay), [homNay])
  const chuoi = useLiveQuery(() => tinhChuoiNgayGhiLog(), [buaAn])
  const lichHomNay = useLiveQuery(async () => {
    const thu = new Date().getDay()
    const lich = await db.lichTap.where('thuTrongTuan').equals(thu).toArray()
    if (lich.length === 0) return []
    const mau = await db.buoiTapMau.bulkGet(lich.map((l) => l.buoiTapMauId))
    return mau.filter((m): m is NonNullable<typeof m> => !!m && !m.deletedAt)
  }, [])

  if (!nguoiDung || !mucTieu) return null

  const tong = tongDinhDuong(buaAn ?? [])
  const caloDot = (buoiTap ?? []).reduce((t, b) => t + b.caloDot, 0)
  const conLai = tinhCaloConLai(mucTieu.calo, tong.calo, caloDot, nguoiDung.congCaloTapLuyen)
  const phanTram = mucTieu.calo > 0 ? (tong.calo / mucTieu.calo) * 100 : 0
  const gio = new Date().getHours()
  const loiChao = gio < 11 ? 'Chào buổi sáng' : gio < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm text-slate-500">{loiChao}</p>
          <h1 className="text-2xl font-bold">{nguoiDung.ten}</h1>
        </div>
        <div className="flex items-center gap-2">
          {(chuoi ?? 0) > 0 && (
            <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-1 text-xs text-orange-300">
              🔥 {chuoi} ngày
            </span>
          )}
          <Link to="/cai-dat" className="text-xl text-slate-500 px-1" aria-label="Cài đặt">
            ⚙️
          </Link>
        </div>
      </div>

      <div className="the flex flex-col items-center py-6">
        <VongTienDo
          phanTram={phanTram}
          giuaTren={
            <>
              <span className={`text-4xl font-bold ${conLai < 0 ? 'text-rose-400' : ''}`}>
                {Math.abs(conLai)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5">
                {conLai >= 0 ? 'kcal còn lại' : 'kcal vượt mức'}
              </span>
            </>
          }
        />

        <div className="flex w-full justify-around mt-5 text-center text-sm">
          <div>
            <div className="font-semibold">{mucTieu.calo}</div>
            <div className="text-xs text-slate-500">Mục tiêu</div>
          </div>
          <div>
            <div className="font-semibold">{tong.calo}</div>
            <div className="text-xs text-slate-500">Đã ăn</div>
          </div>
          <div>
            <div className="font-semibold">{caloDot}</div>
            <div className="text-xs text-slate-500">Đã đốt</div>
          </div>
        </div>

        <div className="flex w-full gap-4 mt-6">
          <ThanhMacro nhan="Đạm" daAn={tong.dam} mucTieu={mucTieu.dam} mau="#3b82f6" />
          <ThanhMacro nhan="Tinh bột" daAn={tong.tinhbot} mucTieu={mucTieu.tinhbot} mau="#f59e0b" />
          <ThanhMacro nhan="Béo" daAn={tong.beo} mucTieu={mucTieu.beo} mau="#a855f7" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={() => dieuHuong('/camera')}
          className="the flex flex-col items-start gap-1 hover:border-slate-700 transition"
        >
          <span className="text-2xl">📷</span>
          <span className="font-medium text-sm">Chụp món ăn</span>
          <span className="text-xs text-slate-500">AI ước lượng calo</span>
        </button>
        <button
          onClick={() => dieuHuong('/them-mon')}
          className="the flex flex-col items-start gap-1 hover:border-slate-700 transition"
        >
          <span className="text-2xl">🔍</span>
          <span className="font-medium text-sm">Tìm món</span>
          <span className="text-xs text-slate-500">Hoặc nhập tay</span>
        </button>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Hôm nay đã ăn</h2>
          <Link to="/nhat-ky" className="text-sm text-emerald-400">Xem nhật ký</Link>
        </div>

        {buaAn && buaAn.length > 0 ? (
          <div className="space-y-2">
            {(['sang', 'trua', 'toi', 'phu'] as LoaiBua[]).map((bua) => {
              const cua = buaAn.filter((n) => n.loaiBua === bua)
              if (cua.length === 0) return null
              const caloBua = cua.reduce((t, n) => t + n.dinhDuong.calo, 0)
              return (
                <Link
                  key={bua}
                  to="/nhat-ky"
                  className="the flex items-center justify-between py-3 hover:border-slate-700 transition"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{TEN_BUA[bua]}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {cua.map((n) => n.tenHienThi).join(', ')}
                    </div>
                  </div>
                  <span className="text-sm font-semibold shrink-0 ml-3">{caloBua} kcal</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="the text-center py-6 text-sm text-slate-500">
            Chưa ghi bữa nào hôm nay
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold mb-3">Nước uống</h2>
        <div className="the">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-2xl font-bold">
              {nuocMl ?? 0}
              <span className="text-sm font-normal text-slate-500"> / {mucTieu.nuocMl} ml</span>
            </span>
            <span className="text-sm text-slate-400">
              {Math.round(((nuocMl ?? 0) / mucTieu.nuocMl) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${Math.min(((nuocMl ?? 0) / mucTieu.nuocMl) * 100, 100)}%` }}
            />
          </div>
          <div className="flex gap-2">
            {LUONG_NUOC_NHANH.map((ml) => (
              <button
                key={ml}
                className="nut-phu flex-1 py-2.5 text-sm"
                onClick={async () => {
                  await themNuoc(homNay, ml)
                  hien(`Đã thêm ${ml} ml nước`)
                }}
              >
                +{ml}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Tập luyện</h2>
          <Link to="/tap-luyen" className="text-sm text-emerald-400">Lịch tập</Link>
        </div>
        {buoiTap && buoiTap.length > 0 ? (
          <div className="space-y-2">
            {buoiTap.map((b) => (
              <div key={b.id} className="the flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{b.ten}</div>
                  <div className="text-xs text-slate-500">
                    {b.ketThuc ? 'Đã xong' : 'Đang tập'} · {b.caloDot} kcal
                  </div>
                </div>
                <span className="text-xl">{b.ketThuc ? '✅' : '⏱️'}</span>
              </div>
            ))}
          </div>
        ) : lichHomNay && lichHomNay.length > 0 ? (
          <div className="space-y-2">
            {lichHomNay.map((m) => (
              <button
                key={m.id}
                onClick={() => dieuHuong(`/ghi-buoi-tap/${m.id}`)}
                className="the w-full flex items-center justify-between py-3 hover:border-slate-700 transition"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{m.ten}</div>
                  <div className="text-xs text-slate-500">{m.baiTap.length} bài · theo lịch</div>
                </div>
                <span className="text-sm text-emerald-400">Bắt đầu →</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="the text-center py-6 text-sm text-slate-500">
            Hôm nay không có lịch tập
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Link to="/can-nang" className="the text-center py-4 hover:border-slate-700 transition">
          <div className="text-2xl mb-1">⚖️</div>
          <div className="text-sm font-medium">Cân nặng</div>
          <div className="text-xs text-slate-500 mt-0.5">{mucTieu.canNangHienTai} kg</div>
        </Link>
        <Link to="/suc-khoe" className="the text-center py-4 hover:border-slate-700 transition">
          <div className="text-2xl mb-1">❤️</div>
          <div className="text-sm font-medium">Sức khỏe</div>
          <div className="text-xs text-slate-500 mt-0.5">Huyết áp, ngủ...</div>
        </Link>
      </div>

      {thongBao && <ThongBao noiDung={thongBao.noiDung} loai={thongBao.loai} />}
    </div>
  )
}
