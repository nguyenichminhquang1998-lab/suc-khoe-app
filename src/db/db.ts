import Dexie, { type Table } from 'dexie'
import type {
  AnhBuaAn,
  AnhTienTrinh,
  BaiTap,
  BuoiTapMau,
  CaiDat,
  CanNang,
  ChiSoSucKhoe,
  CongThuc,
  LichTap,
  MucTieuLichSu,
  NguoiDung,
  NhatKyAn,
  NhatKyTap,
  SetTap,
  SoDoCoThe,
  ThucPham,
} from '../lib/types'

/**
 * Phiên bản schema. Mỗi lần đổi cấu trúc phải tăng số này và thêm một khối
 * .version() mới bên dưới — không bao giờ sửa khối cũ, vì máy người dùng
 * đang chạy phiên bản cũ cần đường nâng cấp liên tục.
 */
export const PHIEN_BAN_SCHEMA = 1

export class SucKhoeDB extends Dexie {
  nguoiDung!: Table<NguoiDung, number>
  thucPham!: Table<ThucPham, number>
  congThuc!: Table<CongThuc, number>
  nhatKyAn!: Table<NhatKyAn, number>
  anhBuaAn!: Table<AnhBuaAn, number>
  canNang!: Table<CanNang, number>
  soDoCoThe!: Table<SoDoCoThe, number>
  anhTienTrinh!: Table<AnhTienTrinh, number>
  chiSoSucKhoe!: Table<ChiSoSucKhoe, number>
  baiTap!: Table<BaiTap, number>
  buoiTapMau!: Table<BuoiTapMau, number>
  lichTap!: Table<LichTap, number>
  nhatKyTap!: Table<NhatKyTap, number>
  setTap!: Table<SetTap, number>
  mucTieuLichSu!: Table<MucTieuLichSu, number>
  caiDat!: Table<CaiDat, string>

  constructor(ten = 'suc-khoe-db') {
    super(ten)

    this.version(1).stores({
      // Chỉ index các trường thực sự dùng để truy vấn — index thừa làm chậm ghi.
      nguoiDung: 'id',
      // laCuaNguoiDung là boolean nên không index được — IndexedDB bỏ qua khóa boolean.
      // Lọc trường này bằng .filter() thay vì .where().
      thucPham: '++id, ten, nhom, maVach',
      congThuc: '++id, ten, deletedAt',
      nhatKyAn: '++id, ngay, [ngay+loaiBua], thucPhamId, deletedAt',
      anhBuaAn: '++id, hash, chupLuc',
      canNang: '++id, &ngay, deletedAt',
      soDoCoThe: '++id, &ngay, deletedAt',
      anhTienTrinh: '++id, ngay, deletedAt',
      chiSoSucKhoe: '++id, ngay, loai, [ngay+loai], deletedAt',
      baiTap: '++id, ten, nhomCo',
      buoiTapMau: '++id, ten, deletedAt',
      lichTap: '++id, thuTrongTuan',
      nhatKyTap: '++id, ngay, buoiTapMauId, deletedAt',
      setTap: '++id, nhatKyTapId, baiTapId, [nhatKyTapId+baiTapId]',
      mucTieuLichSu: '++id, apDungTu',
      caiDat: 'key',
    })
  }
}

export const db = new SucKhoeDB()

/** Người dùng luôn có id = 1 — app dùng cho một người, không có đăng nhập. */
export const ID_NGUOI_DUNG = 1

export async function layNguoiDung(): Promise<NguoiDung | undefined> {
  return db.nguoiDung.get(ID_NGUOI_DUNG)
}

export async function luuNguoiDung(nd: Omit<NguoiDung, 'id'>): Promise<void> {
  await db.nguoiDung.put({ ...nd, id: ID_NGUOI_DUNG })
}

export async function layCaiDat<T>(key: string, macDinh: T): Promise<T> {
  const row = await db.caiDat.get(key)
  return row === undefined ? macDinh : (row.value as T)
}

export async function luuCaiDat(key: string, value: unknown): Promise<void> {
  await db.caiDat.put({ key, value })
}

/**
 * Xóa mềm: gắn cờ thay vì xóa hẳn, giữ 30 ngày để khôi phục được.
 * Mọi truy vấn hiển thị đều phải lọc deletedAt === undefined.
 */
export async function xoaMem(
  bang: Table<{ id?: number; deletedAt?: number }, number>,
  id: number,
): Promise<void> {
  await bang.update(id, { deletedAt: Date.now() })
}

export async function khoiPhuc(
  bang: Table<{ id?: number; deletedAt?: number }, number>,
  id: number,
): Promise<void> {
  await bang.update(id, { deletedAt: undefined })
}

const NGAY_GIU_BAN_GHI_DA_XOA = 30

/** Dọn các bản ghi đã xóa mềm quá hạn giữ. Gọi lúc khởi động app. */
export async function donBanGhiCu(): Promise<number> {
  const nguong = Date.now() - NGAY_GIU_BAN_GHI_DA_XOA * 86400000
  const bangs = [
    db.nhatKyAn, db.canNang, db.soDoCoThe, db.chiSoSucKhoe,
    db.nhatKyTap, db.buoiTapMau, db.congThuc, db.anhTienTrinh,
  ]
  let daXoa = 0
  for (const bang of bangs) {
    const cu = await (bang as Table<{ id?: number; deletedAt?: number }, number>)
      .filter((r) => r.deletedAt !== undefined && r.deletedAt < nguong)
      .toArray()
    if (cu.length > 0) {
      await (bang as Table<{ id?: number }, number>).bulkDelete(
        cu.map((r) => r.id!),
      )
      daXoa += cu.length
    }
  }
  return daXoa
}

/**
 * Xóa ảnh bữa ăn không còn bản ghi nhật ký nào trỏ tới.
 * Ảnh là thứ chiếm dung lượng nhất nên cần dọn riêng.
 */
export async function donAnhMoCoi(): Promise<number> {
  const dsAnhId = new Set(
    (await db.nhatKyAn.toArray()).map((n) => n.anhId).filter((x): x is number => x !== undefined),
  )
  const moCoi = (await db.anhBuaAn.toArray()).filter((a) => !dsAnhId.has(a.id!))
  if (moCoi.length > 0) await db.anhBuaAn.bulkDelete(moCoi.map((a) => a.id!))
  return moCoi.length
}
