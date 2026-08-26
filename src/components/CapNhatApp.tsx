// Chủ động kiểm tra bản cập nhật, không phó mặc cho trình duyệt tự làm.
//
// vite-plugin-pwa mặc định chỉ kiểm tra bản mới khi trình duyệt tự quyết định
// (thường là lúc tải lại trang) — với app cài lên màn hình chính, đặc biệt trên
// iPhone, việc này rất không đáng tin cậy: mở app từ biểu tượng nhiều khi không
// tính là "tải lại trang" nên không bao giờ kiểm tra được. Ở đây ta tự hỏi máy chủ
// mỗi khi app được đưa trở lại màn hình, và báo rõ cho người dùng khi có bản mới
// thay vì âm thầm tải lại — tải lại đột ngột giữa lúc đang gõ dở sẽ mất dữ liệu.

import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const CHU_KY_KIEM_TRA_MS = 60 * 60 * 1000

export default function CapNhatApp() {
  const { needRefresh: [canCapNhat], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, dangKy) {
      if (!dangKy) return
      const kiemTra = () => dangKy.update().catch(() => {})
      const hen = setInterval(kiemTra, CHU_KY_KIEM_TRA_MS)
      const khiHienLai = () => {
        if (document.visibilityState === 'visible') kiemTra()
      }
      document.addEventListener('visibilitychange', khiHienLai)
      return () => {
        clearInterval(hen)
        document.removeEventListener('visibilitychange', khiHienLai)
      }
    },
  })

  useEffect(() => {
    if (canCapNhat) console.info('Đã tải xong bản cập nhật, chờ người dùng xác nhận tải lại.')
  }, [canCapNhat])

  if (!canCapNhat) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-950 px-4 py-3 shadow-lg">
        <span className="text-sm text-emerald-100">Có bản cập nhật mới cho app</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950"
        >
          Tải lại
        </button>
      </div>
    </div>
  )
}
