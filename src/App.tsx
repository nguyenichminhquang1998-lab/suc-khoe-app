import { Suspense, lazy, useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { donAnhMoCoi, donBanGhiCu } from './db/db'
import { napDuLieuMacDinh } from './db/seed'
import { xinLuuTruBenVung } from './db/saoluu'
import { useNguoiDung } from './hooks/useApp'
import HomNay from './screens/HomNay'
import NhatKy from './screens/NhatKy'

// Màn hình chính nạp ngay; phần còn lại tải khi cần để app mở nhanh.
// Biểu đồ (recharts) và trình quét mã vạch (zxing) là hai thứ nặng nhất,
// chúng chỉ nằm trong các chunk được tải theo yêu cầu.
const Onboarding = lazy(() => import('./screens/Onboarding'))
const ThemMon = lazy(() => import('./screens/ThemMon'))
const ChupAnh = lazy(() => import('./screens/ChupAnh'))
const CanNang = lazy(() => import('./screens/CanNang'))
const SucKhoe = lazy(() => import('./screens/SucKhoe'))
const TapLuyen = lazy(() => import('./screens/TapLuyen'))
const GhiBuoiTap = lazy(() => import('./screens/GhiBuoiTap'))
const ThongKe = lazy(() => import('./screens/ThongKe'))
const CaiDat = lazy(() => import('./screens/CaiDat'))

const MUC_DIEU_HUONG = [
  { den: '/', nhan: 'Hôm nay', bieuTuong: '🏠' },
  { den: '/nhat-ky', nhan: 'Nhật ký', bieuTuong: '📓' },
  { den: '/camera', nhan: 'Chụp', bieuTuong: '📷', laNutGiua: true },
  { den: '/tap-luyen', nhan: 'Tập', bieuTuong: '💪' },
  { den: '/thong-ke', nhan: 'Thống kê', bieuTuong: '📊' },
]

function ThanhDieuHuong() {
  const dieuHuong = useNavigate()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto max-w-lg flex items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {MUC_DIEU_HUONG.map((m) =>
          m.laNutGiua ? (
            <button
              key={m.den}
              onClick={() => dieuHuong(m.den)}
              className="relative -top-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-2xl text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95 transition"
              aria-label="Chụp ảnh món ăn"
            >
              {m.bieuTuong}
            </button>
          ) : (
            <NavLink
              key={m.den}
              to={m.den}
              end={m.den === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] transition ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`
              }
            >
              <span className="text-xl leading-none">{m.bieuTuong}</span>
              {m.nhan}
            </NavLink>
          ),
        )}
      </div>
    </nav>
  )
}

function DangTai() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
    </div>
  )
}

export default function App() {
  const nguoiDung = useNguoiDung()
  const viTri = useLocation()
  const [daKhoiTao, datDaKhoiTao] = useState(false)

  useEffect(() => {
    // Khởi động: nạp dữ liệu mặc định, xin giữ dữ liệu bền vững, dọn bản ghi cũ.
    // Dọn dẹp chạy nền, lỗi ở đây không được chặn app khởi động.
    ;(async () => {
      try {
        await napDuLieuMacDinh()
        await xinLuuTruBenVung()
      } catch (e) {
        console.error('Lỗi khởi tạo dữ liệu:', e)
      } finally {
        datDaKhoiTao(true)
      }
      donBanGhiCu().catch(() => {})
      donAnhMoCoi().catch(() => {})
    })()
  }, [])

  if (!daKhoiTao || nguoiDung === undefined) return <DangTai />

  // Chưa có hồ sơ thì bắt buộc qua onboarding trước.
  if (nguoiDung === null && viTri.pathname !== '/bat-dau') {
    return <Navigate to="/bat-dau" replace />
  }

  const anThanhDieuHuong =
    viTri.pathname === '/bat-dau' ||
    viTri.pathname === '/camera' ||
    viTri.pathname.startsWith('/ghi-buoi-tap')

  return (
    <div className="min-h-full">
      <main className={`mx-auto max-w-lg px-4 pt-5 ${anThanhDieuHuong ? 'pb-6' : 'pb-28'}`}>
        <Suspense fallback={<DangTai />}>
        <Routes>
          <Route path="/bat-dau" element={<Onboarding />} />
          <Route path="/" element={<HomNay />} />
          <Route path="/nhat-ky" element={<NhatKy />} />
          <Route path="/them-mon" element={<ThemMon />} />
          <Route path="/camera" element={<ChupAnh />} />
          <Route path="/can-nang" element={<CanNang />} />
          <Route path="/suc-khoe" element={<SucKhoe />} />
          <Route path="/tap-luyen" element={<TapLuyen />} />
          <Route path="/ghi-buoi-tap/:id" element={<GhiBuoiTap />} />
          <Route path="/thong-ke" element={<ThongKe />} />
          <Route path="/cai-dat" element={<CaiDat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      {!anThanhDieuHuong && <ThanhDieuHuong />}
    </div>
  )
}
