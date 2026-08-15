// Toàn bộ công thức tính toán của app. Đây là phần sai là hỏng cả app,
// nên mọi hàm ở đây đều có unit test trong tinhtoan.test.ts.

import type { DinhDuong, GioiTinh, MucTieu, MucVanDong } from './types'

export const HE_SO_VAN_DONG: Record<MucVanDong, number> = {
  it: 1.2,
  nhe: 1.375,
  vua: 1.55,
  nhieu: 1.725,
  rat_nhieu: 1.9,
}

export const NHAN_MUC_VAN_DONG: Record<MucVanDong, string> = {
  it: 'Ít vận động, ngồi nhiều',
  nhe: 'Vận động nhẹ, tập 1–3 buổi/tuần',
  vua: 'Vận động vừa, tập 3–5 buổi/tuần',
  nhieu: 'Vận động nhiều, tập 6–7 buổi/tuần',
  rat_nhieu: 'Vận động rất nhiều, lao động nặng',
}

export const NHAN_MUC_TIEU: Record<MucTieu, string> = {
  giam_can: 'Giảm cân',
  giu_can: 'Giữ cân',
  tang_can: 'Tăng cân',
  tang_co: 'Tăng cơ',
}

/** Số kcal trong 1 kg mỡ cơ thể — dùng để quy đổi tốc độ giảm/tăng cân sang chênh lệch calo. */
export const KCAL_MOI_KG = 7700

export const KCAL_MOI_GAM = { dam: 4, tinhbot: 4, beo: 9 } as const

/** Sàn calo an toàn, không bao giờ đề xuất thấp hơn. */
export const SAN_CALO: Record<GioiTinh, number> = { nam: 1500, nu: 1200, khac: 1200 }

export function tinhTuoi(ngaySinh: string, moc: Date = new Date()): number {
  const sinh = new Date(ngaySinh + 'T00:00:00')
  let tuoi = moc.getFullYear() - sinh.getFullYear()
  const chuaQuaSinhNhat =
    moc.getMonth() < sinh.getMonth() ||
    (moc.getMonth() === sinh.getMonth() && moc.getDate() < sinh.getDate())
  if (chuaQuaSinhNhat) tuoi--
  return Math.max(0, tuoi)
}

/** BMR theo công thức Mifflin-St Jeor. */
export function tinhBMR(
  gioiTinh: GioiTinh,
  canNangKg: number,
  chieuCaoCm: number,
  tuoi: number,
): number {
  const nen = 10 * canNangKg + 6.25 * chieuCaoCm - 5 * tuoi
  // 'khac' dùng trung bình của hai công thức để không thiên lệch.
  const buTru = gioiTinh === 'nam' ? 5 : gioiTinh === 'nu' ? -161 : -78
  return Math.round(nen + buTru)
}

export function tinhTDEE(bmr: number, mucVanDong: MucVanDong): number {
  return Math.round(bmr * HE_SO_VAN_DONG[mucVanDong])
}

export interface KetQuaCaloMucTieu {
  calo: number
  /** Con số trước khi kẹp vào sàn an toàn, để biết có bị kẹp hay không. */
  caloTruocKhiKep: number
  biKep: boolean
}

/**
 * Calo mục tiêu mỗi ngày.
 * tocDoKgTuan luôn là số dương; hướng tăng/giảm lấy từ mucTieu.
 */
export function tinhCaloMucTieu(
  tdee: number,
  mucTieu: MucTieu,
  tocDoKgTuan: number,
  gioiTinh: GioiTinh,
): KetQuaCaloMucTieu {
  const chenhLechMoiNgay = (Math.abs(tocDoKgTuan) * KCAL_MOI_KG) / 7
  let calo: number
  switch (mucTieu) {
    case 'giam_can':
      calo = tdee - chenhLechMoiNgay
      break
    case 'tang_can':
    case 'tang_co':
      calo = tdee + chenhLechMoiNgay
      break
    case 'giu_can':
      calo = tdee
      break
  }
  const caloTruocKhiKep = Math.round(calo)
  const san = SAN_CALO[gioiTinh]
  const biKep = caloTruocKhiKep < san
  return { calo: biKep ? san : caloTruocKhiKep, caloTruocKhiKep, biKep }
}

export interface TyLeMacro {
  dam: number
  tinhbot: number
  beo: number
}

export const MACRO_MAC_DINH: Record<MucTieu, TyLeMacro> = {
  giam_can: { dam: 30, tinhbot: 40, beo: 30 },
  giu_can: { dam: 25, tinhbot: 45, beo: 30 },
  tang_can: { dam: 25, tinhbot: 50, beo: 25 },
  tang_co: { dam: 30, tinhbot: 45, beo: 25 },
}

export interface MacroGam {
  dam: number
  tinhbot: number
  beo: number
}

/** Đổi tỷ lệ phần trăm calo sang số gam mỗi ngày. */
export function tinhMacroGam(calo: number, tyLe: TyLeMacro): MacroGam {
  return {
    dam: Math.round((calo * tyLe.dam) / 100 / KCAL_MOI_GAM.dam),
    tinhbot: Math.round((calo * tyLe.tinhbot) / 100 / KCAL_MOI_GAM.tinhbot),
    beo: Math.round((calo * tyLe.beo) / 100 / KCAL_MOI_GAM.beo),
  }
}

/** Nước cần mỗi ngày: 35 ml cho mỗi kg cân nặng. */
export function tinhNuocMucTieuMl(canNangKg: number): number {
  return Math.round((35 * canNangKg) / 50) * 50
}

export function tinhBMI(canNangKg: number, chieuCaoCm: number): number {
  const m = chieuCaoCm / 100
  return Math.round((canNangKg / (m * m)) * 10) / 10
}

export type PhanLoaiBMI = 'thieu_can' | 'binh_thuong' | 'thua_can' | 'beo_phi'

/** Phân loại theo chuẩn WHO châu Á - Thái Bình Dương, khác chuẩn phương Tây. */
export function phanLoaiBMI(bmi: number): PhanLoaiBMI {
  if (bmi < 18.5) return 'thieu_can'
  if (bmi < 23) return 'binh_thuong'
  if (bmi < 25) return 'thua_can'
  return 'beo_phi'
}

export const NHAN_BMI: Record<PhanLoaiBMI, string> = {
  thieu_can: 'Thiếu cân',
  binh_thuong: 'Bình thường',
  thua_can: 'Thừa cân',
  beo_phi: 'Béo phì',
}

/** Nhân dinh dưỡng trên 100 g theo khối lượng thực tế. */
export function nhanDinhDuong(tren100g: DinhDuong, gam: number): DinhDuong {
  const k = gam / 100
  const lam = (v: number) => Math.round(v * k * 10) / 10
  return {
    calo: Math.round(tren100g.calo * k),
    dam: lam(tren100g.dam),
    tinhbot: lam(tren100g.tinhbot),
    beo: lam(tren100g.beo),
    chatxo: lam(tren100g.chatxo),
    duong: lam(tren100g.duong),
    natri: Math.round(tren100g.natri * k),
  }
}

export const DINH_DUONG_RONG: DinhDuong = {
  calo: 0, dam: 0, tinhbot: 0, beo: 0, chatxo: 0, duong: 0, natri: 0,
}

export function congDinhDuong(ds: DinhDuong[]): DinhDuong {
  const t = ds.reduce(
    (a, b) => ({
      calo: a.calo + b.calo,
      dam: a.dam + b.dam,
      tinhbot: a.tinhbot + b.tinhbot,
      beo: a.beo + b.beo,
      chatxo: a.chatxo + b.chatxo,
      duong: a.duong + b.duong,
      natri: a.natri + b.natri,
    }),
    DINH_DUONG_RONG,
  )
  return {
    calo: Math.round(t.calo),
    dam: Math.round(t.dam * 10) / 10,
    tinhbot: Math.round(t.tinhbot * 10) / 10,
    beo: Math.round(t.beo * 10) / 10,
    chatxo: Math.round(t.chatxo * 10) / 10,
    duong: Math.round(t.duong * 10) / 10,
    natri: Math.round(t.natri),
  }
}

/**
 * Calo còn lại được ăn trong ngày.
 * congCaloTapLuyen mặc định tắt vì calo đốt do tập rất dễ ước lượng thừa.
 */
export function tinhCaloConLai(
  caloMucTieu: number,
  caloDaAn: number,
  caloDot: number,
  congCaloTapLuyen: boolean,
): number {
  return Math.round(caloMucTieu - caloDaAn + (congCaloTapLuyen ? caloDot : 0))
}

/** Calo đốt của một bài tập: MET × cân nặng (kg) × thời gian (giờ). */
export function tinhCaloDot(met: number, canNangKg: number, phut: number): number {
  return Math.round(met * canNangKg * (phut / 60))
}

/** Tổng volume của một buổi tập tạ: Σ (tạ × rep). */
export function tinhVolume(sets: { taKg: number; rep: number; hoanThanh: boolean }[]): number {
  return Math.round(
    sets.filter((s) => s.hoanThanh).reduce((tong, s) => tong + s.taKg * s.rep, 0),
  )
}

/**
 * 1RM ước lượng theo công thức Epley.
 * Chỉ đáng tin trong khoảng 1–10 rep, trên 10 rep sai số lớn dần.
 */
export function tinh1RM(taKg: number, rep: number): number {
  if (rep <= 0 || taKg <= 0) return 0
  if (rep === 1) return Math.round(taKg * 10) / 10
  return Math.round(taKg * (1 + rep / 30) * 10) / 10
}

/**
 * Trung bình động n ngày cho chuỗi cân nặng — làm mượt dao động nước,
 * tránh làm người dùng nản vì con số nhảy lên xuống mỗi ngày.
 * Chuỗi đầu vào phải đã sắp xếp tăng dần theo ngày.
 */
export function trungBinhDong<T>(
  ds: T[],
  layGiaTri: (item: T) => number,
  soNgay = 7,
): (number | null)[] {
  return ds.map((_, i) => {
    const batDau = Math.max(0, i - soNgay + 1)
    const cua = ds.slice(batDau, i + 1)
    if (cua.length === 0) return null
    const tong = cua.reduce((a, item) => a + layGiaTri(item), 0)
    return Math.round((tong / cua.length) * 100) / 100
  })
}

/**
 * Tốc độ thay đổi cân nặng (kg/tuần) tính bằng hồi quy tuyến tính
 * trên các điểm đo — ổn định hơn nhiều so với lấy điểm đầu trừ điểm cuối.
 */
export function tocDoThayDoiKgTuan(
  diem: { ngay: string; kg: number }[],
): number | null {
  if (diem.length < 2) return null
  const goc = new Date(diem[0].ngay + 'T00:00:00').getTime()
  const xs = diem.map((d) => (new Date(d.ngay + 'T00:00:00').getTime() - goc) / 86400000)
  const ys = diem.map((d) => d.kg)
  const n = xs.length
  const tbX = xs.reduce((a, b) => a + b, 0) / n
  const tbY = ys.reduce((a, b) => a + b, 0) / n
  let tu = 0
  let mau = 0
  for (let i = 0; i < n; i++) {
    tu += (xs[i] - tbX) * (ys[i] - tbY)
    mau += (xs[i] - tbX) ** 2
  }
  if (mau === 0) return null
  const kgMoiNgay = tu / mau
  return Math.round(kgMoiNgay * 7 * 100) / 100
}

/**
 * Dự báo số ngày còn lại để đạt cân nặng mục tiêu.
 * Trả về null nếu đang đi sai hướng hoặc chưa đủ dữ liệu.
 */
export function duBaoSoNgayDatMucTieu(
  canNangHienTai: number,
  canNangMucTieu: number,
  tocDoKgTuan: number | null,
): number | null {
  if (tocDoKgTuan === null || tocDoKgTuan === 0) return null
  const conLai = canNangMucTieu - canNangHienTai
  if (Math.abs(conLai) < 0.1) return 0
  // Tốc độ phải cùng dấu với khoảng cách còn lại, nếu không là đang đi sai hướng.
  if (Math.sign(conLai) !== Math.sign(tocDoKgTuan)) return null
  return Math.ceil(Math.abs(conLai / tocDoKgTuan) * 7)
}

/** Ngày dạng 'YYYY-MM-DD' theo giờ địa phương, không dùng toISOString vì nó lệch múi giờ. */
export function ngayLocal(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const ng = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${ng}`
}

export function themNgay(ngay: string, soNgay: number): string {
  const d = new Date(ngay + 'T00:00:00')
  d.setDate(d.getDate() + soNgay)
  return ngayLocal(d)
}

export function khoangNgay(tuNgay: string, denNgay: string): string[] {
  const ds: string[] = []
  let hienTai = tuNgay
  // Chặn vòng lặp vô hạn nếu tham số bị đảo ngược.
  let dem = 0
  while (hienTai <= denNgay && dem < 4000) {
    ds.push(hienTai)
    hienTai = themNgay(hienTai, 1)
    dem++
  }
  return ds
}
