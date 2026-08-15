import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, xoaMem } from './db'
import { napDuLieuMacDinh } from './seed'
import {
  caloTheoKhoang,
  chepBuaAn,
  ghiCanNang,
  gomTheoBua,
  layMonThuongAn,
  laySetGanNhatCuaBai,
  layNhatKyAnTheoNgay,
  taoBanGhiTuThucPham,
  timThucPham,
  tinhChuoiNgayGhiLog,
  tongDinhDuong,
  tongNuocTrongNgay,
  themNuoc,
} from './truyvan'
import { ngayLocal, themNgay } from '../lib/tinhtoan'
import type { LoaiBua } from '../lib/types'

vi.stubGlobal('__PHIEN_BAN_APP__', '0.1.0-test')

async function themBua(ngay: string, ten: string, calo: number, loaiBua: LoaiBua = 'trua', thoiDiem = 1) {
  return db.nhatKyAn.add({
    ngay, loaiBua, thoiDiem, tenHienThi: ten, khoiLuongG: 100,
    dinhDuong: { calo, dam: 10, tinhbot: 20, beo: 5, chatxo: 1, duong: 2, natri: 300 },
    nguonNhap: 'thu_cong', ghiChu: '', taoLuc: 1, suaLuc: 1,
  })
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('napDuLieuMacDinh', () => {
  it('nạp món ăn và bài tập vào máy lần đầu', async () => {
    const kq = await napDuLieuMacDinh()
    expect(kq.themThucPham).toBeGreaterThan(100)
    expect(kq.themBaiTap).toBeGreaterThan(40)
    expect(await db.thucPham.count()).toBe(kq.themThucPham)
  })

  it('chạy lại lần hai không tạo bản trùng', async () => {
    await napDuLieuMacDinh()
    const soLan1 = await db.thucPham.count()
    const kq2 = await napDuLieuMacDinh()
    expect(kq2.themThucPham).toBe(0)
    expect(await db.thucPham.count()).toBe(soLan1)
  })

  it('không đụng tới món do người dùng tự tạo', async () => {
    await napDuLieuMacDinh()
    await db.thucPham.add({
      ten: 'Món mẹ nấu', tenKhac: [], nhom: 'Cơm & món mặn',
      tren100g: { calo: 200, dam: 10, tinhbot: 20, beo: 8, chatxo: 1, duong: 1, natri: 400 },
      khauPhanChuan: [{ ten: 'chén', gam: 150 }], nguon: 'tự nhập',
      laCuaNguoiDung: true, taoLuc: 1,
    })
    await napDuLieuMacDinh()
    expect(await db.thucPham.where('ten').equals('Món mẹ nấu').count()).toBe(1)
  })
})

describe('timThucPham', () => {
  beforeEach(async () => {
    await napDuLieuMacDinh()
  })

  it('tìm được khi gõ có dấu', async () => {
    const kq = await timThucPham('phở bò')
    expect(kq[0].ten).toBe('Phở bò')
  })

  it('tìm được khi gõ không dấu', async () => {
    const kq = await timThucPham('pho bo')
    expect(kq[0].ten).toBe('Phở bò')
  })

  it('tìm được qua tên gọi khác', async () => {
    const kq = await timThucPham('mì tôm')
    expect(kq.some((t) => t.ten.includes('Mì gói'))).toBe(true)
  })

  it('khớp đầu tên được xếp trước khớp giữa tên', async () => {
    const kq = await timThucPham('com')
    expect(kq[0].ten.toLowerCase().startsWith('cơm')).toBe(true)
  })

  it('không phân biệt hoa thường', async () => {
    expect((await timThucPham('PHỞ BÒ'))[0].ten).toBe('Phở bò')
  })

  it('từ khóa rỗng trả về danh sách chứ không lỗi', async () => {
    expect((await timThucPham('')).length).toBeGreaterThan(0)
  })

  it('từ khóa vô nghĩa trả về mảng rỗng', async () => {
    expect(await timThucPham('xyzabc123')).toEqual([])
  })
})

describe('taoBanGhiTuThucPham', () => {
  it('nhân dinh dưỡng theo khối lượng chọn', async () => {
    await napDuLieuMacDinh()
    const pho = (await db.thucPham.where('ten').equals('Phở bò').first())!
    const ban = taoBanGhiTuThucPham(pho, 500, '2026-08-15', 'sang')
    expect(ban.khoiLuongG).toBe(500)
    expect(ban.dinhDuong.calo).toBe(Math.round(pho.tren100g.calo * 5))
    expect(ban.thucPhamId).toBe(pho.id)
  })
})

describe('nhật ký theo ngày', () => {
  it('chỉ lấy đúng ngày và bỏ bản ghi đã xóa', async () => {
    await themBua('2026-08-15', 'A', 300)
    const idXoa = await themBua('2026-08-15', 'B', 200)
    await themBua('2026-08-14', 'C', 100)
    await xoaMem(db.nhatKyAn, idXoa)

    const ds = await layNhatKyAnTheoNgay('2026-08-15')
    expect(ds).toHaveLength(1)
    expect(ds[0].tenHienThi).toBe('A')
  })

  it('sắp xếp theo thời điểm ăn', async () => {
    await themBua('2026-08-15', 'Tối', 300, 'toi', 3000)
    await themBua('2026-08-15', 'Sáng', 300, 'sang', 1000)
    const ds = await layNhatKyAnTheoNgay('2026-08-15')
    expect(ds.map((n) => n.tenHienThi)).toEqual(['Sáng', 'Tối'])
  })

  it('gom đúng theo bữa', async () => {
    await themBua('2026-08-15', 'A', 300, 'sang')
    await themBua('2026-08-15', 'B', 400, 'trua')
    await themBua('2026-08-15', 'C', 100, 'phu')
    const gom = gomTheoBua(await layNhatKyAnTheoNgay('2026-08-15'))
    expect(gom.sang).toHaveLength(1)
    expect(gom.trua).toHaveLength(1)
    expect(gom.toi).toHaveLength(0)
    expect(gom.phu).toHaveLength(1)
  })

  it('cộng tổng dinh dưỡng cả ngày', async () => {
    await themBua('2026-08-15', 'A', 300)
    await themBua('2026-08-15', 'B', 450)
    const t = tongDinhDuong(await layNhatKyAnTheoNgay('2026-08-15'))
    expect(t.calo).toBe(750)
    expect(t.dam).toBe(20)
  })
})

describe('chepBuaAn', () => {
  it('chép cả ngày sang ngày khác', async () => {
    await themBua('2026-08-14', 'A', 300, 'sang')
    await themBua('2026-08-14', 'B', 500, 'trua')

    const soChep = await chepBuaAn('2026-08-14', '2026-08-15')
    expect(soChep).toBe(2)

    const moi = await layNhatKyAnTheoNgay('2026-08-15')
    expect(moi).toHaveLength(2)
    expect(moi.every((n) => n.nguonNhap === 'chep_lai')).toBe(true)
    // Ngày nguồn không bị đụng tới.
    expect(await layNhatKyAnTheoNgay('2026-08-14')).toHaveLength(2)
  })

  it('chép được riêng một bữa', async () => {
    await themBua('2026-08-14', 'A', 300, 'sang')
    await themBua('2026-08-14', 'B', 500, 'trua')
    expect(await chepBuaAn('2026-08-14', '2026-08-15', 'sang')).toBe(1)
  })

  it('ngày nguồn rỗng thì không chép gì', async () => {
    expect(await chepBuaAn('2026-01-01', '2026-08-15')).toBe(0)
  })

  it('không chép theo ảnh của bữa gốc', async () => {
    const anhId = await db.anhBuaAn.add({ blob: new Blob(['x']), hash: 'h', chupLuc: 1 })
    await db.nhatKyAn.add({
      ngay: '2026-08-14', loaiBua: 'sang', thoiDiem: 1, tenHienThi: 'A',
      khoiLuongG: 100, anhId,
      dinhDuong: { calo: 100, dam: 1, tinhbot: 1, beo: 1, chatxo: 0, duong: 0, natri: 0 },
      nguonNhap: 'anh', ghiChu: '', taoLuc: 1, suaLuc: 1,
    })
    await chepBuaAn('2026-08-14', '2026-08-15')
    expect((await layNhatKyAnTheoNgay('2026-08-15'))[0].anhId).toBeUndefined()
  })
})

describe('layMonThuongAn', () => {
  it('xếp món ăn nhiều lần lên đầu', async () => {
    const homNay = ngayLocal()
    await themBua(homNay, 'Phở bò', 450)
    await themBua(themNgay(homNay, -1), 'Phở bò', 450)
    await themBua(themNgay(homNay, -2), 'Phở bò', 450)
    await themBua(homNay, 'Bánh mì', 300)

    const ds = await layMonThuongAn()
    expect(ds[0].tenHienThi).toBe('Phở bò')
    expect(ds[0].soLan).toBe(3)
    expect(ds[1].tenHienThi).toBe('Bánh mì')
  })

  it('bỏ qua bữa ăn quá 90 ngày', async () => {
    await themBua(themNgay(ngayLocal(), -200), 'Món cũ', 300)
    expect(await layMonThuongAn()).toHaveLength(0)
  })
})

describe('cân nặng', () => {
  it('mỗi ngày chỉ giữ một giá trị, nhập lại thì ghi đè', async () => {
    await ghiCanNang('2026-08-15', 75.5)
    await ghiCanNang('2026-08-15', 75.2)
    const ds = await db.canNang.where('ngay').equals('2026-08-15').toArray()
    expect(ds).toHaveLength(1)
    expect(ds[0].kg).toBe(75.2)
  })

  it('ghi lại sau khi xóa mềm thì khôi phục bản ghi cũ', async () => {
    await ghiCanNang('2026-08-15', 75.5)
    const id = (await db.canNang.where('ngay').equals('2026-08-15').first())!.id!
    await xoaMem(db.canNang, id)
    await ghiCanNang('2026-08-15', 74)
    const ban = await db.canNang.get(id)
    expect(ban?.deletedAt).toBeUndefined()
    expect(ban?.kg).toBe(74)
  })
})

describe('nước uống', () => {
  it('cộng dồn các lần uống trong ngày', async () => {
    await themNuoc('2026-08-15', 250)
    await themNuoc('2026-08-15', 500)
    await themNuoc('2026-08-14', 250)
    expect(await tongNuocTrongNgay('2026-08-15')).toBe(750)
  })

  it('ngày chưa uống gì thì bằng 0', async () => {
    expect(await tongNuocTrongNgay('2026-08-15')).toBe(0)
  })
})

describe('caloTheoKhoang', () => {
  it('trả về đủ mọi ngày trong khoảng, ngày trống là 0', async () => {
    await themBua('2026-08-13', 'A', 500)
    await themBua('2026-08-15', 'B', 700)

    const ds = await caloTheoKhoang('2026-08-13', '2026-08-15')
    expect(ds).toHaveLength(3)
    expect(ds[0]).toMatchObject({ ngay: '2026-08-13', calo: 500 })
    expect(ds[1]).toMatchObject({ ngay: '2026-08-14', calo: 0 })
    expect(ds[2]).toMatchObject({ ngay: '2026-08-15', calo: 700 })
  })
})

describe('tinhChuoiNgayGhiLog', () => {
  it('đếm số ngày ghi log liên tiếp', async () => {
    const homNay = ngayLocal()
    await themBua(homNay, 'A', 100)
    await themBua(themNgay(homNay, -1), 'B', 100)
    await themBua(themNgay(homNay, -2), 'C', 100)
    expect(await tinhChuoiNgayGhiLog()).toBe(3)
  })

  it('hôm nay chưa ghi vẫn giữ chuỗi tính từ hôm qua', async () => {
    const homNay = ngayLocal()
    await themBua(themNgay(homNay, -1), 'B', 100)
    await themBua(themNgay(homNay, -2), 'C', 100)
    expect(await tinhChuoiNgayGhiLog()).toBe(2)
  })

  it('chuỗi đứt khi có ngày trống ở giữa', async () => {
    const homNay = ngayLocal()
    await themBua(homNay, 'A', 100)
    await themBua(themNgay(homNay, -3), 'C', 100)
    expect(await tinhChuoiNgayGhiLog()).toBe(1)
  })

  it('chưa ghi gì thì chuỗi bằng 0', async () => {
    expect(await tinhChuoiNgayGhiLog()).toBe(0)
  })
})

describe('laySetGanNhatCuaBai', () => {
  it('trả về các set của buổi tập gần nhất', async () => {
    const buoiCu = await db.nhatKyTap.add({
      ngay: '2026-08-01', ten: 'Push', batDau: 1, tongVolume: 0, caloDot: 0,
      ghiChu: '', taoLuc: 1, suaLuc: 1,
    })
    const buoiMoi = await db.nhatKyTap.add({
      ngay: '2026-08-10', ten: 'Push', batDau: 1, tongVolume: 0, caloDot: 0,
      ghiChu: '', taoLuc: 1, suaLuc: 1,
    })
    await db.setTap.bulkAdd([
      { nhatKyTapId: buoiCu, baiTapId: 1, thuTuSet: 1, rep: 10, taKg: 50, hoanThanh: true },
      { nhatKyTapId: buoiMoi, baiTapId: 1, thuTuSet: 1, rep: 10, taKg: 60, hoanThanh: true },
      { nhatKyTapId: buoiMoi, baiTapId: 1, thuTuSet: 2, rep: 8, taKg: 60, hoanThanh: true },
      { nhatKyTapId: buoiMoi, baiTapId: 1, thuTuSet: 3, rep: 8, taKg: 60, hoanThanh: false },
    ])

    const kq = await laySetGanNhatCuaBai(1)
    expect(kq?.ngay).toBe('2026-08-10')
    // Set chưa hoàn thành không được tính.
    expect(kq?.sets).toEqual([{ rep: 10, taKg: 60 }, { rep: 8, taKg: 60 }])
  })

  it('bài chưa từng tập trả về null', async () => {
    expect(await laySetGanNhatCuaBai(999)).toBeNull()
  })
})
