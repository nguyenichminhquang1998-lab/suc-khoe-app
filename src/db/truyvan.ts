// Các truy vấn dùng chung cho màn hình. Mọi hàm ở đây đều lọc bản ghi đã xóa mềm.

import { db } from './db'
import { boDau } from '../data/thucpham'
import { congDinhDuong, khoangNgay, nhanDinhDuong, ngayLocal, themNgay } from '../lib/tinhtoan'
import type {
  ChiSoSucKhoe, DinhDuong, LoaiBua, LoaiChiSo, NhatKyAn, ThucPham,
} from '../lib/types'

export async function layNhatKyAnTheoNgay(ngay: string): Promise<NhatKyAn[]> {
  const ds = await db.nhatKyAn.where('ngay').equals(ngay).toArray()
  return ds.filter((n) => !n.deletedAt).sort((a, b) => a.thoiDiem - b.thoiDiem)
}

export function gomTheoBua(ds: NhatKyAn[]): Record<LoaiBua, NhatKyAn[]> {
  const kq: Record<LoaiBua, NhatKyAn[]> = { sang: [], trua: [], toi: [], phu: [] }
  for (const n of ds) kq[n.loaiBua].push(n)
  return kq
}

export function tongDinhDuong(ds: NhatKyAn[]): DinhDuong {
  return congDinhDuong(ds.map((n) => n.dinhDuong))
}

export async function tongCaloTheoNgay(ngay: string): Promise<number> {
  return tongDinhDuong(await layNhatKyAnTheoNgay(ngay)).calo
}

/**
 * Tìm món ăn. Gõ có dấu hay không dấu đều ra kết quả.
 * Xếp hạng: khớp đầu tên > khớp giữa tên > khớp tên khác.
 */
export async function timThucPham(tuKhoa: string, gioiHan = 40): Promise<ThucPham[]> {
  const q = boDau(tuKhoa)
  if (q.length === 0) {
    return db.thucPham.limit(gioiHan).toArray()
  }

  const tatCa = await db.thucPham.toArray()
  const chamDiem = (t: ThucPham): number => {
    const ten = boDau(t.ten)
    if (ten === q) return 0
    if (ten.startsWith(q)) return 1
    if (ten.includes(q)) return 2
    if (t.tenKhac.some((tk) => boDau(tk).startsWith(q))) return 3
    if (t.tenKhac.some((tk) => boDau(tk).includes(q))) return 4
    if (boDau(t.nhom).includes(q)) return 5
    return 99
  }

  return tatCa
    .map((t) => ({ t, diem: chamDiem(t) }))
    .filter((x) => x.diem < 99)
    .sort((a, b) => a.diem - b.diem || a.t.ten.localeCompare(b.t.ten, 'vi'))
    .slice(0, gioiHan)
    .map((x) => x.t)
}

export async function timTheoMaVach(maVach: string): Promise<ThucPham | undefined> {
  return db.thucPham.where('maVach').equals(maVach).first()
}

export interface MonThuongAn {
  tenHienThi: string
  thucPhamId?: number
  khoiLuongG: number
  dinhDuong: DinhDuong
  soLan: number
  lanCuoi: number
}

/**
 * Món ăn thường xuyên, sinh từ lịch sử 90 ngày gần nhất.
 * Xếp theo tần suất rồi tới lần ăn gần nhất — để ghi log nhanh chỉ vài chạm.
 */
export async function layMonThuongAn(gioiHan = 20): Promise<MonThuongAn[]> {
  const tuNgay = themNgay(ngayLocal(), -90)
  const ds = (await db.nhatKyAn.where('ngay').aboveOrEqual(tuNgay).toArray()).filter(
    (n) => !n.deletedAt,
  )

  const gom = new Map<string, MonThuongAn>()
  for (const n of ds) {
    // Gộp theo tên hiển thị: cùng món ăn nhiều khối lượng khác nhau vẫn là một mục.
    const khoa = n.tenHienThi.toLowerCase()
    const daCo = gom.get(khoa)
    if (daCo) {
      daCo.soLan++
      if (n.thoiDiem > daCo.lanCuoi) {
        daCo.lanCuoi = n.thoiDiem
        daCo.khoiLuongG = n.khoiLuongG
        daCo.dinhDuong = n.dinhDuong
      }
    } else {
      gom.set(khoa, {
        tenHienThi: n.tenHienThi,
        thucPhamId: n.thucPhamId,
        khoiLuongG: n.khoiLuongG,
        dinhDuong: n.dinhDuong,
        soLan: 1,
        lanCuoi: n.thoiDiem,
      })
    }
  }

  return [...gom.values()]
    .sort((a, b) => b.soLan - a.soLan || b.lanCuoi - a.lanCuoi)
    .slice(0, gioiHan)
}

/** Chép toàn bộ bữa ăn của một ngày sang ngày khác. */
export async function chepBuaAn(
  tuNgay: string,
  denNgay: string,
  loaiBua?: LoaiBua,
): Promise<number> {
  let nguon = await layNhatKyAnTheoNgay(tuNgay)
  if (loaiBua) nguon = nguon.filter((n) => n.loaiBua === loaiBua)
  if (nguon.length === 0) return 0

  const bayGio = Date.now()
  const moc = new Date(denNgay + 'T00:00:00').getTime()
  await db.nhatKyAn.bulkAdd(
    nguon.map((n) => {
      const { id: _bo, anhId: _boAnh, ...conLai } = n
      // Giữ nguyên giờ trong ngày, chỉ đổi phần ngày.
      const gioTrongNgay = n.thoiDiem - new Date(n.ngay + 'T00:00:00').getTime()
      return {
        ...conLai,
        ngay: denNgay,
        thoiDiem: moc + gioTrongNgay,
        nguonNhap: 'chep_lai' as const,
        taoLuc: bayGio,
        suaLuc: bayGio,
      }
    }),
  )
  return nguon.length
}

export async function layCanNangGanNhat(): Promise<number | undefined> {
  const ds = (await db.canNang.toArray()).filter((c) => !c.deletedAt)
  if (ds.length === 0) return undefined
  ds.sort((a, b) => b.ngay.localeCompare(a.ngay))
  return ds[0].kg
}

export async function layChuoiCanNang(): Promise<{ ngay: string; kg: number }[]> {
  const ds = (await db.canNang.toArray()).filter((c) => !c.deletedAt)
  return ds
    .sort((a, b) => a.ngay.localeCompare(b.ngay))
    .map((c) => ({ ngay: c.ngay, kg: c.kg }))
}

export async function ghiCanNang(ngay: string, kg: number, tyLeMo?: number, ghiChu = ''): Promise<void> {
  // Mỗi ngày chỉ giữ một giá trị — nhập lại thì ghi đè.
  const daCo = await db.canNang.where('ngay').equals(ngay).first()
  if (daCo) {
    await db.canNang.update(daCo.id!, { kg, tyLeMo, ghiChu, deletedAt: undefined })
  } else {
    await db.canNang.add({ ngay, kg, tyLeMo, ghiChu, taoLuc: Date.now() })
  }
}

export async function layChiSoTheoNgay(ngay: string, loai: LoaiChiSo): Promise<ChiSoSucKhoe[]> {
  const ds = await db.chiSoSucKhoe.where('[ngay+loai]').equals([ngay, loai]).toArray()
  return ds.filter((c) => !c.deletedAt).sort((a, b) => a.thoiDiem - b.thoiDiem)
}

export async function tongNuocTrongNgay(ngay: string): Promise<number> {
  const ds = await layChiSoTheoNgay(ngay, 'nuoc')
  return ds.reduce((t, c) => t + c.giaTri, 0)
}

export async function themNuoc(ngay: string, ml: number): Promise<void> {
  await db.chiSoSucKhoe.add({
    ngay, thoiDiem: Date.now(), loai: 'nuoc', giaTri: ml,
    donVi: 'ml', ghiChu: '', taoLuc: Date.now(),
  })
}

/** Calo đã ăn của từng ngày trong khoảng, dùng cho biểu đồ thống kê. */
export async function caloTheoKhoang(
  tuNgay: string,
  denNgay: string,
): Promise<{ ngay: string; calo: number; dam: number; tinhbot: number; beo: number }[]> {
  const ds = (
    await db.nhatKyAn.where('ngay').between(tuNgay, denNgay, true, true).toArray()
  ).filter((n) => !n.deletedAt)

  const gom = new Map<string, NhatKyAn[]>()
  for (const n of ds) {
    const mang = gom.get(n.ngay)
    if (mang) mang.push(n)
    else gom.set(n.ngay, [n])
  }

  return khoangNgay(tuNgay, denNgay).map((ngay) => {
    const t = tongDinhDuong(gom.get(ngay) ?? [])
    return { ngay, calo: t.calo, dam: t.dam, tinhbot: t.tinhbot, beo: t.beo }
  })
}

export async function layNhatKyTapTheoKhoang(tuNgay: string, denNgay: string) {
  const ds = await db.nhatKyTap.where('ngay').between(tuNgay, denNgay, true, true).toArray()
  return ds.filter((n) => !n.deletedAt).sort((a, b) => a.ngay.localeCompare(b.ngay))
}

/** Lần tập gần nhất của một bài — hiển thị để biết cần nâng bao nhiêu tạ. */
export async function laySetGanNhatCuaBai(
  baiTapId: number,
): Promise<{ ngay: string; sets: { rep: number; taKg: number }[] } | null> {
  const sets = await db.setTap.where('baiTapId').equals(baiTapId).toArray()
  if (sets.length === 0) return null

  const theoBuoi = new Map<number, typeof sets>()
  for (const s of sets) {
    const mang = theoBuoi.get(s.nhatKyTapId)
    if (mang) mang.push(s)
    else theoBuoi.set(s.nhatKyTapId, [s])
  }

  const buoi = await db.nhatKyTap.bulkGet([...theoBuoi.keys()])
  const hopLe = buoi
    .filter((b): b is NonNullable<typeof b> => !!b && !b.deletedAt)
    .sort((a, b) => b.ngay.localeCompare(a.ngay))
  if (hopLe.length === 0) return null

  const ganNhat = hopLe[0]
  const cua = (theoBuoi.get(ganNhat.id!) ?? [])
    .filter((s) => s.hoanThanh)
    .sort((a, b) => a.thuTuSet - b.thuTuSet)
  if (cua.length === 0) return null

  return { ngay: ganNhat.ngay, sets: cua.map((s) => ({ rep: s.rep, taKg: s.taKg })) }
}

/** Chuỗi ngày ghi log liên tiếp tính tới hôm nay. */
export async function tinhChuoiNgayGhiLog(): Promise<number> {
  const ds = (await db.nhatKyAn.toArray()).filter((n) => !n.deletedAt)
  const coLog = new Set(ds.map((n) => n.ngay))
  let chuoi = 0
  let ngay = ngayLocal()
  // Hôm nay chưa ghi thì tính từ hôm qua, không phá chuỗi khi mới sáng sớm.
  if (!coLog.has(ngay)) ngay = themNgay(ngay, -1)
  while (coLog.has(ngay)) {
    chuoi++
    ngay = themNgay(ngay, -1)
  }
  return chuoi
}

/** Tạo bản ghi nhật ký ăn từ một món trong cơ sở dữ liệu, đã nhân theo khối lượng. */
export function taoBanGhiTuThucPham(
  tp: ThucPham,
  gam: number,
  ngay: string,
  loaiBua: LoaiBua,
  nguonNhap: NhatKyAn['nguonNhap'] = 'tim_kiem',
): Omit<NhatKyAn, 'id'> {
  const bayGio = Date.now()
  return {
    ngay,
    loaiBua,
    thoiDiem: bayGio,
    thucPhamId: tp.id,
    tenHienThi: tp.ten,
    khoiLuongG: gam,
    dinhDuong: nhanDinhDuong(tp.tren100g, gam),
    nguonNhap,
    ghiChu: '',
    taoLuc: bayGio,
    suaLuc: bayGio,
  }
}
