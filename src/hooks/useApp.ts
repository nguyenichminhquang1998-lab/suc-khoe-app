import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useState } from 'react'
import { db, ID_NGUOI_DUNG, layCaiDat, luuCaiDat } from '../db/db'
import { layCanNangGanNhat } from '../db/truyvan'
import {
  tinhBMR, tinhCaloMucTieu, tinhMacroGam, tinhNuocMucTieuMl, tinhTDEE, tinhTuoi,
} from '../lib/tinhtoan'
import type { NguoiDung } from '../lib/types'

export function useNguoiDung(): NguoiDung | undefined | null {
  // undefined = đang tải, null = chưa có hồ sơ (cần onboarding)
  const nd = useLiveQuery(() => db.nguoiDung.get(ID_NGUOI_DUNG), [])
  if (nd === undefined) return undefined
  return nd ?? null
}

export interface ChiSoMucTieu {
  bmr: number
  tdee: number
  calo: number
  dam: number
  tinhbot: number
  beo: number
  nuocMl: number
  canNangHienTai: number
}

/**
 * Chỉ số mục tiêu, tính lại theo cân nặng mới nhất chứ không dùng cân nặng
 * lúc đăng ký — giảm 10kg mà TDEE không đổi thì con số sẽ sai dần.
 */
export function useChiSoMucTieu(nd: NguoiDung | null | undefined): ChiSoMucTieu | null {
  const canNang = useLiveQuery(() => layCanNangGanNhat(), [])

  if (!nd) return null
  const canNangHienTai = canNang ?? nd.canNangMucTieuKg
  const tuoi = tinhTuoi(nd.ngaySinh)
  const bmr = tinhBMR(nd.gioiTinh, canNangHienTai, nd.chieuCaoCm, tuoi)
  const tdee = tinhTDEE(bmr, nd.mucVanDong)

  // Người dùng chỉnh tay calo thì tôn trọng con số của họ.
  const calo = nd.caloMucTieu > 0
    ? nd.caloMucTieu
    : tinhCaloMucTieu(tdee, nd.mucTieu, nd.tocDoKgTuan, nd.gioiTinh).calo

  const macro = tinhMacroGam(calo, {
    dam: nd.macroDamPhanTram,
    tinhbot: nd.macroTinhbotPhanTram,
    beo: nd.macroBeoPhanTram,
  })

  return {
    bmr,
    tdee,
    calo,
    ...macro,
    nuocMl: nd.nuocMucTieuMl > 0 ? nd.nuocMucTieuMl : tinhNuocMucTieuMl(canNangHienTai),
    canNangHienTai,
  }
}

/** Đọc/ghi một khóa cài đặt, đồng bộ với IndexedDB. */
export function useCaiDat<T>(key: string, macDinh: T): [T, (v: T) => Promise<void>] {
  const [giaTri, datGiaTri] = useState<T>(macDinh)

  useEffect(() => {
    let conSong = true
    layCaiDat(key, macDinh).then((v) => {
      if (conSong) datGiaTri(v)
    })
    return () => {
      conSong = false
    }
    // macDinh cố tình không nằm trong deps: nó thường là literal mới mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const ghi = useCallback(
    async (v: T) => {
      datGiaTri(v)
      await luuCaiDat(key, v)
    },
    [key],
  )

  return [giaTri, ghi]
}

export interface TrangThaiThongBao {
  noiDung: string
  loai?: 'thanh_cong' | 'loi'
  hoanTac?: () => void
}

/** Thông báo ngắn ở đáy màn hình, tự ẩn sau vài giây. */
export function useThongBao(thoiGianMs = 4000) {
  const [thongBao, datThongBao] = useState<TrangThaiThongBao | null>(null)

  useEffect(() => {
    if (!thongBao) return
    const t = setTimeout(() => datThongBao(null), thoiGianMs)
    return () => clearTimeout(t)
  }, [thongBao, thoiGianMs])

  const hien = useCallback((noiDung: string, loai: 'thanh_cong' | 'loi' = 'thanh_cong', hoanTac?: () => void) => {
    datThongBao({ noiDung, loai, hoanTac })
  }, [])

  const an = useCallback(() => datThongBao(null), [])

  return { thongBao, hien, an }
}

/** Theo dõi trạng thái mạng để báo cho người dùng biết vì sao nút chụp ảnh không dùng được. */
export function useTrangThaiMang(): boolean {
  const [online, datOnline] = useState(navigator.onLine)
  useEffect(() => {
    const len = () => datOnline(true)
    const xuong = () => datOnline(false)
    window.addEventListener('online', len)
    window.addEventListener('offline', xuong)
    return () => {
      window.removeEventListener('online', len)
      window.removeEventListener('offline', xuong)
    }
  }, [])
  return online
}
