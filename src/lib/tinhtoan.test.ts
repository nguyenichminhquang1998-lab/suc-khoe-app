import { describe, expect, it } from 'vitest'
import {
  duBaoSoNgayDatMucTieu,
  khoangNgay,
  congDinhDuong,
  ngayLocal,
  nhanDinhDuong,
  phanLoaiBMI,
  themNgay,
  tinh1RM,
  tinhBMI,
  tinhBMR,
  tinhCaloConLai,
  tinhCaloDot,
  tinhCaloMucTieu,
  tinhMacroGam,
  tinhNuocMucTieuMl,
  tinhTDEE,
  tinhTuoi,
  tinhVolume,
  tocDoThayDoiKgTuan,
  trungBinhDong,
} from './tinhtoan'
import type { DinhDuong } from './types'

describe('tinhTuoi', () => {
  it('tính đúng tuổi khi đã qua sinh nhật trong năm', () => {
    expect(tinhTuoi('1990-03-15', new Date('2026-08-15T12:00:00'))).toBe(36)
  })

  it('trừ 1 khi chưa qua sinh nhật', () => {
    expect(tinhTuoi('1990-12-25', new Date('2026-08-15T12:00:00'))).toBe(35)
  })

  it('đúng vào chính ngày sinh nhật', () => {
    expect(tinhTuoi('1990-08-15', new Date('2026-08-15T12:00:00'))).toBe(36)
  })

  it('không trả về số âm', () => {
    expect(tinhTuoi('2030-01-01', new Date('2026-08-15T12:00:00'))).toBe(0)
  })
})

describe('tinhBMR — Mifflin-St Jeor', () => {
  it('nam 70kg 175cm 30 tuổi', () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
    expect(tinhBMR('nam', 70, 175, 30)).toBe(1649)
  })

  it('nữ 55kg 160cm 25 tuổi', () => {
    // 10*55 + 6.25*160 - 5*25 - 161 = 550 + 1000 - 125 - 161 = 1264
    expect(tinhBMR('nu', 55, 160, 25)).toBe(1264)
  })

  it('giới tính khác nằm giữa hai công thức', () => {
    const nam = tinhBMR('nam', 70, 175, 30)
    const nu = tinhBMR('nu', 70, 175, 30)
    const khac = tinhBMR('khac', 70, 175, 30)
    expect(khac).toBeGreaterThan(nu)
    expect(khac).toBeLessThan(nam)
  })
})

describe('tinhTDEE', () => {
  it('nhân đúng hệ số vận động', () => {
    expect(tinhTDEE(1600, 'it')).toBe(1920)
    expect(tinhTDEE(1600, 'vua')).toBe(2480)
    expect(tinhTDEE(1600, 'rat_nhieu')).toBe(3040)
  })
})

describe('tinhCaloMucTieu', () => {
  it('giảm cân 0.5kg/tuần trừ khoảng 550 kcal mỗi ngày', () => {
    const kq = tinhCaloMucTieu(2500, 'giam_can', 0.5, 'nam')
    expect(kq.calo).toBe(2500 - Math.round((0.5 * 7700) / 7))
    expect(kq.biKep).toBe(false)
  })

  it('giữ cân bằng đúng TDEE', () => {
    expect(tinhCaloMucTieu(2200, 'giu_can', 0.5, 'nu').calo).toBe(2200)
  })

  it('tăng cân thì cộng thêm', () => {
    const kq = tinhCaloMucTieu(2000, 'tang_can', 0.25, 'nam')
    expect(kq.calo).toBeGreaterThan(2000)
  })

  it('kẹp vào sàn 1200 kcal cho nữ và báo là đã kẹp', () => {
    const kq = tinhCaloMucTieu(1500, 'giam_can', 1, 'nu')
    expect(kq.caloTruocKhiKep).toBeLessThan(1200)
    expect(kq.calo).toBe(1200)
    expect(kq.biKep).toBe(true)
  })

  it('kẹp vào sàn 1500 kcal cho nam', () => {
    expect(tinhCaloMucTieu(1800, 'giam_can', 1, 'nam').calo).toBe(1500)
  })

  it('tốc độ âm vẫn được hiểu là độ lớn, hướng lấy từ mục tiêu', () => {
    expect(tinhCaloMucTieu(2500, 'giam_can', -0.5, 'nam').calo).toBe(
      tinhCaloMucTieu(2500, 'giam_can', 0.5, 'nam').calo,
    )
  })
})

describe('tinhMacroGam', () => {
  it('quy đổi đúng phần trăm calo sang gam', () => {
    const m = tinhMacroGam(2000, { dam: 30, tinhbot: 40, beo: 30 })
    expect(m.dam).toBe(150) // 600 kcal / 4
    expect(m.tinhbot).toBe(200) // 800 kcal / 4
    expect(m.beo).toBe(67) // 600 kcal / 9 = 66.67
  })

  it('tổng calo từ macro xấp xỉ calo mục tiêu', () => {
    const calo = 2400
    const m = tinhMacroGam(calo, { dam: 25, tinhbot: 45, beo: 30 })
    const tong = m.dam * 4 + m.tinhbot * 4 + m.beo * 9
    expect(Math.abs(tong - calo)).toBeLessThan(10)
  })
})

describe('tinhNuocMucTieuMl', () => {
  it('35ml mỗi kg, làm tròn tới 50ml', () => {
    expect(tinhNuocMucTieuMl(70)).toBe(2450)
    expect(tinhNuocMucTieuMl(55)).toBe(1950) // 1925 -> làm tròn lên 1950
  })
})

describe('BMI theo chuẩn châu Á', () => {
  it('tính đúng chỉ số', () => {
    expect(tinhBMI(70, 175)).toBe(22.9)
  })

  it('ngưỡng thừa cân là 23, không phải 25 như chuẩn phương Tây', () => {
    expect(phanLoaiBMI(22.9)).toBe('binh_thuong')
    expect(phanLoaiBMI(23)).toBe('thua_can')
    expect(phanLoaiBMI(24.9)).toBe('thua_can')
    expect(phanLoaiBMI(25)).toBe('beo_phi')
    expect(phanLoaiBMI(18.4)).toBe('thieu_can')
  })
})

const PHO_100G: DinhDuong = {
  calo: 90, dam: 5, tinhbot: 12, beo: 2, chatxo: 0.5, duong: 1, natri: 400,
}

describe('nhanDinhDuong', () => {
  it('nhân theo khối lượng thực tế', () => {
    const d = nhanDinhDuong(PHO_100G, 500)
    expect(d.calo).toBe(450)
    expect(d.dam).toBe(25)
    expect(d.natri).toBe(2000)
  })

  it('khối lượng 0 cho ra toàn số 0', () => {
    expect(nhanDinhDuong(PHO_100G, 0).calo).toBe(0)
  })
})

describe('congDinhDuong', () => {
  it('cộng nhiều món và làm tròn gọn', () => {
    const tong = congDinhDuong([
      nhanDinhDuong(PHO_100G, 300),
      nhanDinhDuong(PHO_100G, 200),
    ])
    expect(tong.calo).toBe(450)
    expect(tong.dam).toBe(25)
  })

  it('danh sách rỗng trả về toàn số 0', () => {
    expect(congDinhDuong([]).calo).toBe(0)
  })
})

describe('tinhCaloConLai', () => {
  it('mặc định không cộng calo tập luyện', () => {
    expect(tinhCaloConLai(2000, 1500, 300, false)).toBe(500)
  })

  it('cộng calo tập khi người dùng bật', () => {
    expect(tinhCaloConLai(2000, 1500, 300, true)).toBe(800)
  })

  it('trả về số âm khi ăn vượt mục tiêu', () => {
    expect(tinhCaloConLai(2000, 2300, 0, false)).toBe(-300)
  })
})

describe('tinhCaloDot', () => {
  it('MET × cân nặng × giờ', () => {
    // chạy bộ MET 8, 70kg, 30 phút = 8 * 70 * 0.5 = 280
    expect(tinhCaloDot(8, 70, 30)).toBe(280)
  })
})

describe('tinhVolume', () => {
  it('chỉ tính các set đã hoàn thành', () => {
    expect(
      tinhVolume([
        { taKg: 60, rep: 10, hoanThanh: true },
        { taKg: 60, rep: 8, hoanThanh: true },
        { taKg: 60, rep: 8, hoanThanh: false },
      ]),
    ).toBe(1080)
  })

  it('không có set nào thì bằng 0', () => {
    expect(tinhVolume([])).toBe(0)
  })
})

describe('tinh1RM — Epley', () => {
  it('1 rep thì 1RM chính là mức tạ đó', () => {
    expect(tinh1RM(100, 1)).toBe(100)
  })

  it('100kg × 5 rep ≈ 116.7kg', () => {
    expect(tinh1RM(100, 5)).toBe(116.7)
  })

  it('dữ liệu vô lý trả về 0', () => {
    expect(tinh1RM(0, 5)).toBe(0)
    expect(tinh1RM(100, 0)).toBe(0)
  })
})

describe('trungBinhDong', () => {
  it('làm mượt chuỗi cân nặng dao động', () => {
    const ds = [{ kg: 70 }, { kg: 71 }, { kg: 69 }]
    const tb = trungBinhDong(ds, (d) => d.kg, 3)
    expect(tb[0]).toBe(70)
    expect(tb[1]).toBe(70.5)
    expect(tb[2]).toBe(70)
  })

  it('cửa sổ chỉ lấy các điểm đã có, không cần đủ n ngày', () => {
    const ds = [{ kg: 80 }, { kg: 78 }]
    expect(trungBinhDong(ds, (d) => d.kg, 7)).toEqual([80, 79])
  })

  it('chuỗi rỗng trả về mảng rỗng', () => {
    expect(trungBinhDong([] as { kg: number }[], (d) => d.kg)).toEqual([])
  })
})

describe('tocDoThayDoiKgTuan', () => {
  it('giảm đều 0.5kg mỗi tuần cho ra -0.5', () => {
    const diem = [
      { ngay: '2026-01-01', kg: 80 },
      { ngay: '2026-01-08', kg: 79.5 },
      { ngay: '2026-01-15', kg: 79 },
      { ngay: '2026-01-22', kg: 78.5 },
    ]
    expect(tocDoThayDoiKgTuan(diem)).toBe(-0.5)
  })

  it('cân nặng không đổi cho ra 0', () => {
    expect(
      tocDoThayDoiKgTuan([
        { ngay: '2026-01-01', kg: 70 },
        { ngay: '2026-01-08', kg: 70 },
      ]),
    ).toBe(0)
  })

  it('ít hơn 2 điểm thì chưa kết luận được', () => {
    expect(tocDoThayDoiKgTuan([{ ngay: '2026-01-01', kg: 70 }])).toBeNull()
  })

  it('nhiều lần cân trong cùng một ngày không gây chia cho 0', () => {
    expect(
      tocDoThayDoiKgTuan([
        { ngay: '2026-01-01', kg: 70 },
        { ngay: '2026-01-01', kg: 71 },
      ]),
    ).toBeNull()
  })
})

describe('duBaoSoNgayDatMucTieu', () => {
  it('còn 5kg với tốc độ -0.5kg/tuần thì mất 70 ngày', () => {
    expect(duBaoSoNgayDatMucTieu(80, 75, -0.5)).toBe(70)
  })

  it('đang đi sai hướng thì không dự báo', () => {
    expect(duBaoSoNgayDatMucTieu(80, 75, 0.5)).toBeNull()
  })

  it('tốc độ bằng 0 thì không dự báo', () => {
    expect(duBaoSoNgayDatMucTieu(80, 75, 0)).toBeNull()
  })

  it('đã đạt mục tiêu thì còn 0 ngày', () => {
    expect(duBaoSoNgayDatMucTieu(75, 75, -0.5)).toBe(0)
  })
})

describe('xử lý ngày tháng', () => {
  it('ngayLocal không bị lệch múi giờ như toISOString', () => {
    // 23:30 giờ địa phương vẫn phải là ngày hôm đó
    const d = new Date(2026, 7, 15, 23, 30)
    expect(ngayLocal(d)).toBe('2026-08-15')
  })

  it('themNgay vượt qua ranh giới tháng', () => {
    expect(themNgay('2026-01-31', 1)).toBe('2026-02-01')
    expect(themNgay('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('themNgay xử lý đúng năm nhuận', () => {
    expect(themNgay('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('khoangNgay trả về dãy ngày liên tục bao gồm hai đầu', () => {
    expect(khoangNgay('2026-01-30', '2026-02-02')).toEqual([
      '2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02',
    ])
  })

  it('khoangNgay với đầu vào đảo ngược trả về mảng rỗng', () => {
    expect(khoangNgay('2026-02-02', '2026-01-30')).toEqual([])
  })
})
