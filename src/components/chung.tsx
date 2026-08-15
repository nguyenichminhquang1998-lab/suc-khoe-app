// Các thành phần giao diện dùng lại nhiều nơi.

import { useEffect, useRef, type ReactNode } from 'react'

export function VongTienDo({
  phanTram,
  giuaTren,
  giuaDuoi,
  kichThuoc = 168,
  mau = '#10b981',
}: {
  phanTram: number
  giuaTren: ReactNode
  giuaDuoi?: ReactNode
  kichThuoc?: number
  mau?: string
}) {
  const banKinh = kichThuoc / 2 - 12
  const chuVi = 2 * Math.PI * banKinh
  // Vượt 100% thì vòng vẫn đầy, phần vượt được báo bằng màu chứ không vẽ chồng.
  const daVe = Math.min(phanTram, 100) / 100
  const vuot = phanTram > 100

  return (
    <div className="relative" style={{ width: kichThuoc, height: kichThuoc }}>
      <svg width={kichThuoc} height={kichThuoc} className="-rotate-90">
        <circle
          cx={kichThuoc / 2} cy={kichThuoc / 2} r={banKinh}
          fill="none" stroke="#1e293b" strokeWidth={12}
        />
        <circle
          cx={kichThuoc / 2} cy={kichThuoc / 2} r={banKinh}
          fill="none" stroke={vuot ? '#f43f5e' : mau} strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={chuVi}
          strokeDashoffset={chuVi * (1 - daVe)}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {giuaTren}
        {giuaDuoi}
      </div>
    </div>
  )
}

export function ThanhMacro({
  nhan, daAn, mucTieu, mau, donVi = 'g',
}: {
  nhan: string
  daAn: number
  mucTieu: number
  mau: string
  donVi?: string
}) {
  const phanTram = mucTieu > 0 ? Math.min((daAn / mucTieu) * 100, 100) : 0
  const vuot = mucTieu > 0 && daAn > mucTieu
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{nhan}</span>
        <span className={vuot ? 'text-rose-400' : 'text-slate-300'}>
          {Math.round(daAn)}/{mucTieu}
          {donVi}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${phanTram}%`, backgroundColor: vuot ? '#f43f5e' : mau }}
        />
      </div>
    </div>
  )
}

export function TrangRong({
  bieuTuong, tieuDe, moTa, hanhDong,
}: {
  bieuTuong: string
  tieuDe: string
  moTa?: string
  hanhDong?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="text-5xl mb-3 opacity-60">{bieuTuong}</div>
      <p className="font-medium text-slate-300">{tieuDe}</p>
      {moTa && <p className="text-sm text-slate-500 mt-1.5 max-w-xs">{moTa}</p>}
      {hanhDong && <div className="mt-5">{hanhDong}</div>}
    </div>
  )
}

/** Bảng trượt lên từ đáy màn hình — kiểu tương tác quen thuộc trên điện thoại. */
export function BangTruot({
  mo, dong, tieuDe, children,
}: {
  mo: boolean
  dong: () => void
  tieuDe: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!mo) return
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', xuLy)
    // Chặn cuộn trang nền khi bảng đang mở.
    const cuOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', xuLy)
      document.body.style.overflow = cuOverflow
    }
  }, [mo, dong])

  if (!mo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Đóng"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dong}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl bg-slate-900 border-t border-x border-slate-800">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-800">
          <h2 className="text-lg font-semibold">{tieuDe}</h2>
          <button onClick={dong} className="text-slate-400 hover:text-slate-200 text-2xl leading-none px-2">
            ×
          </button>
        </div>
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  )
}

export function HopThoaiXacNhan({
  mo, tieuDe, noiDung, nhanDongY = 'Đồng ý', nguyHiem, dongY, huy,
}: {
  mo: boolean
  tieuDe: string
  noiDung: string
  nhanDongY?: string
  nguyHiem?: boolean
  dongY: () => void
  huy: () => void
}) {
  if (!mo) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button aria-label="Đóng" className="absolute inset-0 bg-black/70" onClick={huy} />
      <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h3 className="font-semibold text-lg">{tieuDe}</h3>
        <p className="text-sm text-slate-400 mt-2 whitespace-pre-line">{noiDung}</p>
        <div className="flex gap-3 mt-5">
          <button className="nut-vien flex-1" onClick={huy}>Hủy</button>
          <button
            className={`${nguyHiem ? 'nut-nguy-hiem' : 'nut-chinh'} flex-1`}
            onClick={dongY}
          >
            {nhanDongY}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Thông báo ngắn hiện ở đáy màn hình, tự biến mất. */
export function ThongBao({
  noiDung, loai = 'thanh_cong', hoanTac,
}: {
  noiDung: string
  loai?: 'thanh_cong' | 'loi'
  hoanTac?: () => void
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm">
      <div
        className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-lg border ${
          loai === 'loi'
            ? 'bg-rose-950 border-rose-800 text-rose-100'
            : 'bg-slate-800 border-slate-700 text-slate-100'
        }`}
      >
        <span className="text-sm">{noiDung}</span>
        {hoanTac && (
          <button onClick={hoanTac} className="text-sm font-semibold text-emerald-400 shrink-0">
            Hoàn tác
          </button>
        )}
      </div>
    </div>
  )
}

export function TieuDeTrang({ children, phu }: { children: ReactNode; phu?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <h1 className="text-2xl font-bold">{children}</h1>
      {phu}
    </div>
  )
}

/** Ô nhập số có nút cộng trừ hai bên — bấm bằng ngón cái dễ hơn gõ số. */
export function NhapSo({
  giaTri, doiGiaTri, buoc = 1, toiThieu = 0, toiDa, donVi, thapPhan = 0,
}: {
  giaTri: number
  doiGiaTri: (v: number) => void
  buoc?: number
  toiThieu?: number
  toiDa?: number
  donVi?: string
  thapPhan?: number
}) {
  const keo = (v: number) => {
    let kq = v
    if (toiThieu !== undefined) kq = Math.max(toiThieu, kq)
    if (toiDa !== undefined) kq = Math.min(toiDa, kq)
    return Math.round(kq * 10 ** thapPhan) / 10 ** thapPhan
  }

  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        className="nut-phu px-4 text-xl"
        onClick={() => doiGiaTri(keo(giaTri - buoc))}
        aria-label="Giảm"
      >
        −
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          inputMode="decimal"
          className="o-nhap text-center text-lg font-semibold"
          value={Number.isFinite(giaTri) ? giaTri : ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            doiGiaTri(Number.isFinite(v) ? v : 0)
          }}
          onBlur={() => doiGiaTri(keo(giaTri))}
        />
        {donVi && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
            {donVi}
          </span>
        )}
      </div>
      <button
        type="button"
        className="nut-phu px-4 text-xl"
        onClick={() => doiGiaTri(keo(giaTri + buoc))}
        aria-label="Tăng"
      >
        +
      </button>
    </div>
  )
}

/** Tự động focus vào ô nhập khi bảng vừa mở — bớt một chạm cho người dùng. */
export function useTuDongFocus<T extends HTMLElement>(bat: boolean) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (bat) {
      // Chờ animation của bảng trượt xong mới focus, nếu không bàn phím che mất.
      const t = setTimeout(() => ref.current?.focus(), 100)
      return () => clearTimeout(t)
    }
  }, [bat])
  return ref
}
