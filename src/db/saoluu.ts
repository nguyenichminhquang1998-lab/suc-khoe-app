// Xuất / nhập toàn bộ dữ liệu. Đây là mạng lưới an toàn của app:
// dữ liệu chỉ nằm trên máy người dùng nên file xuất ra là bản sao lưu duy nhất.

import { db, PHIEN_BAN_SCHEMA } from './db'
import type { AnhBuaAn, AnhTienTrinh } from '../lib/types'
import { ngayLocal } from '../lib/tinhtoan'

export interface GoiSaoLuu {
  dinhDang: 'suc-khoe-app-backup'
  phienBanSchema: number
  phienBanApp: string
  xuatLuc: number
  bang: Record<string, unknown[]>
  /** Ảnh mã hóa base64, tách riêng vì có thể rất nặng. */
  anh?: {
    buaAn: { id: number; hash: string; chupLuc: number; ketQuaAi?: string; base64: string }[]
    tienTrinh: { id: number; ngay: string; gocChup: string; taoLuc: number; base64: string }[]
  }
}

/** Các bảng được sao lưu, trừ bảng ảnh vì blob cần xử lý riêng. */
const BANG_SAO_LUU = [
  'nguoiDung', 'thucPham', 'congThuc', 'nhatKyAn', 'canNang', 'soDoCoThe',
  'chiSoSucKhoe', 'baiTap', 'buoiTapMau', 'lichTap', 'nhatKyTap', 'setTap',
  'mucTieuLichSu', 'caiDat',
] as const

function blobSangBase64(blob: Blob): Promise<string> {
  return new Promise((giaiQuyet, tuChoi) => {
    const doc = new FileReader()
    doc.onloadend = () => {
      const kq = doc.result as string
      // Cắt tiền tố 'data:image/jpeg;base64,' để giữ file gọn.
      giaiQuyet(kq.slice(kq.indexOf(',') + 1))
    }
    doc.onerror = () => tuChoi(doc.error)
    doc.readAsDataURL(blob)
  })
}

function base64SangBlob(base64: string, kieu = 'image/jpeg'): Blob {
  const nhiPhan = atob(base64)
  const mang = new Uint8Array(nhiPhan.length)
  for (let i = 0; i < nhiPhan.length; i++) mang[i] = nhiPhan.charCodeAt(i)
  return new Blob([mang], { type: kieu })
}

export async function xuatDuLieu(kemAnh: boolean): Promise<GoiSaoLuu> {
  const bang: Record<string, unknown[]> = {}
  for (const ten of BANG_SAO_LUU) {
    bang[ten] = await (db as unknown as Record<string, { toArray(): Promise<unknown[]> }>)[
      ten
    ].toArray()
  }

  const goi: GoiSaoLuu = {
    dinhDang: 'suc-khoe-app-backup',
    phienBanSchema: PHIEN_BAN_SCHEMA,
    phienBanApp: __PHIEN_BAN_APP__,
    xuatLuc: Date.now(),
    bang,
  }

  if (kemAnh) {
    const buaAn = await db.anhBuaAn.toArray()
    const tienTrinh = await db.anhTienTrinh.toArray()
    goi.anh = {
      buaAn: await Promise.all(
        buaAn.map(async (a) => ({
          id: a.id!,
          hash: a.hash,
          chupLuc: a.chupLuc,
          ketQuaAi: a.ketQuaAi,
          base64: await blobSangBase64(a.blob),
        })),
      ),
      tienTrinh: await Promise.all(
        tienTrinh.map(async (a) => ({
          id: a.id!,
          ngay: a.ngay,
          gocChup: a.gocChup,
          taoLuc: a.taoLuc,
          base64: await blobSangBase64(a.blob),
        })),
      ),
    }
  }

  return goi
}

export function taiFileJson(goi: GoiSaoLuu): void {
  const chuoi = JSON.stringify(goi)
  const blob = new Blob([chuoi], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `suc-khoe-backup-${ngayLocal()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Xuất nhật ký ăn ra CSV để mở bằng Excel. */
export async function xuatCsvNhatKyAn(): Promise<string> {
  const ds = (await db.nhatKyAn.toArray())
    .filter((n) => !n.deletedAt)
    .sort((a, b) => a.thoiDiem - b.thoiDiem)
  const dong = [
    'Ngày,Bữa,Món,Khối lượng (g),Calo,Đạm (g),Tinh bột (g),Béo (g),Chất xơ (g),Đường (g),Natri (mg),Nguồn nhập,Ghi chú',
  ]
  const thoat = (s: string) => `"${String(s).replace(/"/g, '""')}"`
  for (const n of ds) {
    dong.push(
      [
        n.ngay, n.loaiBua, thoat(n.tenHienThi), n.khoiLuongG,
        n.dinhDuong.calo, n.dinhDuong.dam, n.dinhDuong.tinhbot, n.dinhDuong.beo,
        n.dinhDuong.chatxo, n.dinhDuong.duong, n.dinhDuong.natri,
        n.nguonNhap, thoat(n.ghiChu),
      ].join(','),
    )
  }
  // BOM để Excel nhận đúng tiếng Việt UTF-8.
  return '﻿' + dong.join('\n')
}

export async function xuatCsvCanNang(): Promise<string> {
  const ds = (await db.canNang.toArray())
    .filter((c) => !c.deletedAt)
    .sort((a, b) => a.ngay.localeCompare(b.ngay))
  const dong = ['Ngày,Cân nặng (kg),Tỷ lệ mỡ (%),Ghi chú']
  for (const c of ds) {
    dong.push(`${c.ngay},${c.kg},${c.tyLeMo ?? ''},"${c.ghiChu.replace(/"/g, '""')}"`)
  }
  return '﻿' + dong.join('\n')
}

export function taiFileCsv(noiDung: string, tenFile: string): void {
  const blob = new Blob([noiDung], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = tenFile
  a.click()
  URL.revokeObjectURL(url)
}

export type CheDoNhap = 'thay_the' | 'tron'

export interface KetQuaNhap {
  thanhCong: boolean
  loi?: string
  soBanGhi: number
  chiTiet: Record<string, number>
}

export function kiemTraGoiSaoLuu(dl: unknown): { hopLe: boolean; loi?: string } {
  if (typeof dl !== 'object' || dl === null) {
    return { hopLe: false, loi: 'File không phải dữ liệu JSON hợp lệ.' }
  }
  const goi = dl as Partial<GoiSaoLuu>
  if (goi.dinhDang !== 'suc-khoe-app-backup') {
    return { hopLe: false, loi: 'File này không phải bản sao lưu của Sức Khỏe App.' }
  }
  if (typeof goi.phienBanSchema !== 'number') {
    return { hopLe: false, loi: 'File sao lưu thiếu thông tin phiên bản.' }
  }
  if (goi.phienBanSchema > PHIEN_BAN_SCHEMA) {
    return {
      hopLe: false,
      loi: `File được tạo bởi phiên bản app mới hơn (schema ${goi.phienBanSchema}, app hiện tại ${PHIEN_BAN_SCHEMA}). Hãy cập nhật app rồi thử lại.`,
    }
  }
  if (typeof goi.bang !== 'object' || goi.bang === null) {
    return { hopLe: false, loi: 'File sao lưu không có dữ liệu.' }
  }
  return { hopLe: true }
}

/**
 * Nhập dữ liệu từ file sao lưu.
 * - 'thay_the': xóa sạch dữ liệu hiện có rồi nạp file vào (khôi phục sau khi mất máy).
 * - 'tron': giữ dữ liệu hiện có, chỉ thêm bản ghi chưa có (gộp từ máy khác).
 *
 * Ở chế độ trộn, id trong file bị bỏ đi để tránh ghi đè nhầm bản ghi khác nội dung
 * nhưng trùng id. Riêng cân nặng và số đo dùng ngày làm khóa vì mỗi ngày chỉ có một bản ghi.
 */
export async function nhapDuLieu(goi: GoiSaoLuu, cheDo: CheDoNhap): Promise<KetQuaNhap> {
  const kiemTra = kiemTraGoiSaoLuu(goi)
  if (!kiemTra.hopLe) {
    return { thanhCong: false, loi: kiemTra.loi, soBanGhi: 0, chiTiet: {} }
  }

  const chiTiet: Record<string, number> = {}
  let tong = 0

  try {
    await db.transaction('rw', db.tables, async () => {
      if (cheDo === 'thay_the') {
        for (const bang of db.tables) await bang.clear()
      }

      for (const ten of BANG_SAO_LUU) {
        const hang = (goi.bang[ten] ?? []) as Record<string, unknown>[]
        if (hang.length === 0) continue
        const bang = (db as unknown as Record<string, import('dexie').Table>)[ten]

        if (cheDo === 'thay_the') {
          await bang.bulkPut(hang)
          chiTiet[ten] = hang.length
          tong += hang.length
          continue
        }

        // Chế độ trộn
        if (ten === 'nguoiDung' || ten === 'caiDat') {
          // Hồ sơ và cài đặt: giữ nguyên bản trên máy, không ghi đè.
          const daCo = await bang.count()
          if (daCo === 0) {
            await bang.bulkPut(hang)
            chiTiet[ten] = hang.length
            tong += hang.length
          }
          continue
        }

        if (ten === 'canNang' || ten === 'soDoCoThe') {
          const ngayDaCo = new Set((await bang.toArray()).map((r) => (r as { ngay: string }).ngay))
          const moi = hang.filter((r) => !ngayDaCo.has(r.ngay as string))
          await bang.bulkAdd(moi.map(({ id: _bo, ...r }) => r))
          chiTiet[ten] = moi.length
          tong += moi.length
          continue
        }

        // Các bảng còn lại: thêm mới, bỏ id cũ để Dexie tự cấp id.
        await bang.bulkAdd(hang.map(({ id: _bo, ...r }) => r))
        chiTiet[ten] = hang.length
        tong += hang.length
      }

      // Ảnh: id được giữ nguyên ở chế độ thay thế vì nhật ký ăn trỏ tới id đó.
      if (goi.anh && cheDo === 'thay_the') {
        const buaAn: AnhBuaAn[] = goi.anh.buaAn.map((a) => ({
          id: a.id,
          hash: a.hash,
          chupLuc: a.chupLuc,
          ketQuaAi: a.ketQuaAi,
          blob: base64SangBlob(a.base64),
        }))
        const tienTrinh: AnhTienTrinh[] = goi.anh.tienTrinh.map((a) => ({
          id: a.id,
          ngay: a.ngay,
          gocChup: a.gocChup as AnhTienTrinh['gocChup'],
          taoLuc: a.taoLuc,
          blob: base64SangBlob(a.base64),
        }))
        await db.anhBuaAn.bulkPut(buaAn)
        await db.anhTienTrinh.bulkPut(tienTrinh)
        chiTiet.anh = buaAn.length + tienTrinh.length
        tong += chiTiet.anh
      }
    })
  } catch (e) {
    return {
      thanhCong: false,
      loi: `Lỗi khi ghi dữ liệu: ${e instanceof Error ? e.message : String(e)}`,
      soBanGhi: 0,
      chiTiet: {},
    }
  }

  return { thanhCong: true, soBanGhi: tong, chiTiet }
}

export async function docFileSaoLuu(file: File): Promise<GoiSaoLuu> {
  const chu = await file.text()
  return JSON.parse(chu) as GoiSaoLuu
}

/** Ước lượng dung lượng đang dùng để cảnh báo trước khi hết chỗ. */
export async function uocLuongDungLuong(): Promise<{ dungMb: number; conMb: number } | null> {
  if (!navigator.storage?.estimate) return null
  const kq = await navigator.storage.estimate()
  const dung = (kq.usage ?? 0) / 1048576
  const tong = (kq.quota ?? 0) / 1048576
  return { dungMb: Math.round(dung * 10) / 10, conMb: Math.round((tong - dung) * 10) / 10 }
}

/**
 * Xin trình duyệt giữ dữ liệu lâu dài, không tự xóa khi thiếu chỗ.
 * Quan trọng với app này vì dữ liệu chỉ nằm trên máy.
 */
export async function xinLuuTruBenVung(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
