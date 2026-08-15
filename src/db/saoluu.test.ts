import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, ID_NGUOI_DUNG, donAnhMoCoi, donBanGhiCu, xoaMem } from './db'
import { kiemTraGoiSaoLuu, nhapDuLieu, xuatCsvNhatKyAn, xuatDuLieu, type GoiSaoLuu } from './saoluu'
import type { NguoiDung } from '../lib/types'

vi.stubGlobal('__PHIEN_BAN_APP__', '0.1.0-test')

const NGUOI_DUNG_MAU: NguoiDung = {
  id: ID_NGUOI_DUNG,
  ten: 'Quang',
  gioiTinh: 'nam',
  ngaySinh: '1998-01-01',
  chieuCaoCm: 172,
  mucVanDong: 'vua',
  mucTieu: 'giam_can',
  canNangMucTieuKg: 68,
  tocDoKgTuan: 0.5,
  cheDoAn: 'binh_thuong',
  diUng: [],
  benhNen: [],
  caloMucTieu: 2000,
  macroDamPhanTram: 30,
  macroTinhbotPhanTram: 40,
  macroBeoPhanTram: 30,
  nuocMucTieuMl: 2500,
  congCaloTapLuyen: false,
  taoLuc: 1,
  suaLuc: 1,
}

async function napDuLieuMau() {
  await db.nguoiDung.put(NGUOI_DUNG_MAU)
  await db.nhatKyAn.add({
    ngay: '2026-08-15',
    loaiBua: 'sang',
    thoiDiem: Date.parse('2026-08-15T07:00:00Z'),
    tenHienThi: 'Phở bò',
    khoiLuongG: 500,
    dinhDuong: { calo: 450, dam: 25, tinhbot: 60, beo: 10, chatxo: 2, duong: 5, natri: 2000 },
    nguonNhap: 'anh',
    doTinCay: 'trung_binh',
    ghiChu: '',
    taoLuc: 1,
    suaLuc: 1,
  })
  await db.canNang.add({ ngay: '2026-08-15', kg: 75.5, ghiChu: '', taoLuc: 1 })
  await db.canNang.add({ ngay: '2026-08-14', kg: 75.8, ghiChu: '', taoLuc: 1 })
  await db.chiSoSucKhoe.add({
    ngay: '2026-08-15', thoiDiem: 1, loai: 'nuoc', giaTri: 250,
    donVi: 'ml', ghiChu: '', taoLuc: 1,
  })
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('xuất và nhập lại dữ liệu', () => {
  it('xuất ra gói có đúng định dạng và phiên bản', async () => {
    await napDuLieuMau()
    const goi = await xuatDuLieu(false)
    expect(goi.dinhDang).toBe('suc-khoe-app-backup')
    expect(goi.phienBanSchema).toBe(1)
    expect(goi.bang.nhatKyAn).toHaveLength(1)
    expect(goi.bang.canNang).toHaveLength(2)
  })

  it('xóa sạch rồi nhập lại thì dữ liệu khôi phục nguyên vẹn', async () => {
    await napDuLieuMau()
    const goi = await xuatDuLieu(false)

    for (const bang of db.tables) await bang.clear()
    expect(await db.nhatKyAn.count()).toBe(0)

    const kq = await nhapDuLieu(goi, 'thay_the')
    expect(kq.thanhCong).toBe(true)

    expect(await db.nhatKyAn.count()).toBe(1)
    expect(await db.canNang.count()).toBe(2)
    const nd = await db.nguoiDung.get(ID_NGUOI_DUNG)
    expect(nd?.ten).toBe('Quang')
    expect(nd?.caloMucTieu).toBe(2000)
    const bua = await db.nhatKyAn.toCollection().first()
    expect(bua?.dinhDuong.calo).toBe(450)
    expect(bua?.tenHienThi).toBe('Phở bò')
  })

  it('chế độ thay thế xóa dữ liệu cũ, không để lại bản ghi thừa', async () => {
    await napDuLieuMau()
    const goi = await xuatDuLieu(false)
    await db.canNang.add({ ngay: '2026-08-13', kg: 76, ghiChu: 'thừa', taoLuc: 1 })
    expect(await db.canNang.count()).toBe(3)

    await nhapDuLieu(goi, 'thay_the')
    expect(await db.canNang.count()).toBe(2)
  })

  it('chế độ trộn giữ dữ liệu hiện có và chỉ thêm ngày chưa có', async () => {
    await napDuLieuMau()
    const goi = await xuatDuLieu(false)

    for (const bang of db.tables) await bang.clear()
    await db.canNang.add({ ngay: '2026-08-15', kg: 99, ghiChu: 'bản trên máy', taoLuc: 1 })

    await nhapDuLieu(goi, 'tron')

    const ds = await db.canNang.toArray()
    expect(ds).toHaveLength(2)
    // Bản ghi cùng ngày trên máy không bị file ghi đè.
    expect(ds.find((c) => c.ngay === '2026-08-15')?.kg).toBe(99)
    expect(ds.find((c) => c.ngay === '2026-08-14')?.kg).toBe(75.8)
  })

  it('chế độ trộn không ghi đè hồ sơ người dùng đang có', async () => {
    await napDuLieuMau()
    const goi = await xuatDuLieu(false)
    await db.nguoiDung.put({ ...NGUOI_DUNG_MAU, ten: 'Tên mới', caloMucTieu: 1800 })

    await nhapDuLieu(goi, 'tron')
    const nd = await db.nguoiDung.get(ID_NGUOI_DUNG)
    expect(nd?.ten).toBe('Tên mới')
    expect(nd?.caloMucTieu).toBe(1800)
  })

  it('nhập hai lần ở chế độ thay thế không nhân đôi dữ liệu', async () => {
    await napDuLieuMau()
    const goi = await xuatDuLieu(false)
    await nhapDuLieu(goi, 'thay_the')
    await nhapDuLieu(goi, 'thay_the')
    expect(await db.nhatKyAn.count()).toBe(1)
    expect(await db.canNang.count()).toBe(2)
  })
})

describe('kiemTraGoiSaoLuu', () => {
  it('từ chối file không phải JSON đối tượng', () => {
    expect(kiemTraGoiSaoLuu(null).hopLe).toBe(false)
    expect(kiemTraGoiSaoLuu('abc').hopLe).toBe(false)
  })

  it('từ chối file của app khác', () => {
    const kq = kiemTraGoiSaoLuu({ dinhDang: 'app-khac', phienBanSchema: 1, bang: {} })
    expect(kq.hopLe).toBe(false)
    expect(kq.loi).toContain('không phải bản sao lưu')
  })

  it('từ chối file tạo bởi phiên bản app mới hơn', () => {
    const kq = kiemTraGoiSaoLuu({
      dinhDang: 'suc-khoe-app-backup', phienBanSchema: 99, bang: {},
    })
    expect(kq.hopLe).toBe(false)
    expect(kq.loi).toContain('mới hơn')
  })

  it('chấp nhận gói hợp lệ', () => {
    expect(
      kiemTraGoiSaoLuu({ dinhDang: 'suc-khoe-app-backup', phienBanSchema: 1, bang: {} }).hopLe,
    ).toBe(true)
  })

  it('nhập file hỏng trả về lỗi thay vì làm sập app', async () => {
    const kq = await nhapDuLieu({ dinhDang: 'sai' } as unknown as GoiSaoLuu, 'thay_the')
    expect(kq.thanhCong).toBe(false)
    expect(kq.loi).toBeTruthy()
  })
})

describe('xóa mềm', () => {
  it('bản ghi bị xóa vẫn còn trong bảng, chỉ gắn cờ', async () => {
    await napDuLieuMau()
    const id = (await db.canNang.toCollection().first())!.id!
    await xoaMem(db.canNang, id)
    const sauKhiXoa = await db.canNang.get(id)
    expect(sauKhiXoa).toBeDefined()
    expect(sauKhiXoa?.deletedAt).toBeTypeOf('number')
  })

  it('donBanGhiCu chỉ xóa hẳn bản ghi quá 30 ngày', async () => {
    await napDuLieuMau()
    const ds = await db.canNang.toArray()
    await db.canNang.update(ds[0].id!, { deletedAt: Date.now() - 40 * 86400000 })
    await db.canNang.update(ds[1].id!, { deletedAt: Date.now() - 5 * 86400000 })

    const daXoa = await donBanGhiCu()
    expect(daXoa).toBe(1)
    expect(await db.canNang.count()).toBe(1)
  })
})

describe('donAnhMoCoi', () => {
  it('xóa ảnh không còn bữa ăn nào trỏ tới', async () => {
    const anhDung = await db.anhBuaAn.add({
      blob: new Blob(['x']), hash: 'a', chupLuc: 1,
    })
    await db.anhBuaAn.add({ blob: new Blob(['y']), hash: 'b', chupLuc: 1 })
    await db.nhatKyAn.add({
      ngay: '2026-08-15', loaiBua: 'sang', thoiDiem: 1, tenHienThi: 'X',
      khoiLuongG: 100, anhId: anhDung,
      dinhDuong: { calo: 1, dam: 0, tinhbot: 0, beo: 0, chatxo: 0, duong: 0, natri: 0 },
      nguonNhap: 'anh', ghiChu: '', taoLuc: 1, suaLuc: 1,
    })

    expect(await donAnhMoCoi()).toBe(1)
    expect(await db.anhBuaAn.count()).toBe(1)
    expect((await db.anhBuaAn.toCollection().first())?.hash).toBe('a')
  })
})

describe('xuất CSV', () => {
  it('có tiêu đề cột và một dòng cho mỗi bữa ăn', async () => {
    await napDuLieuMau()
    const csv = await xuatCsvNhatKyAn()
    const dong = csv.split('\n')
    expect(dong[0]).toContain('Ngày')
    expect(dong[0]).toContain('Calo')
    expect(dong).toHaveLength(2)
    expect(dong[1]).toContain('Phở bò')
    expect(dong[1]).toContain('450')
  })

  it('bỏ qua bản ghi đã xóa mềm', async () => {
    await napDuLieuMau()
    const id = (await db.nhatKyAn.toCollection().first())!.id!
    await xoaMem(db.nhatKyAn, id)
    expect((await xuatCsvNhatKyAn()).split('\n')).toHaveLength(1)
  })

  it('bọc dấu ngoặc kép trong tên món để không vỡ cột', async () => {
    await db.nhatKyAn.add({
      ngay: '2026-08-15', loaiBua: 'trua', thoiDiem: 1,
      tenHienThi: 'Cơm "gà" xối mỡ, đặc biệt',
      khoiLuongG: 300,
      dinhDuong: { calo: 600, dam: 30, tinhbot: 70, beo: 20, chatxo: 1, duong: 2, natri: 900 },
      nguonNhap: 'thu_cong', ghiChu: '', taoLuc: 1, suaLuc: 1,
    })
    const csv = await xuatCsvNhatKyAn()
    expect(csv).toContain('"Cơm ""gà"" xối mỡ, đặc biệt"')
  })
})
