// Kiểu dữ liệu dùng chung toàn app.
// Quy ước: ngày lưu dạng chuỗi 'YYYY-MM-DD' (giờ địa phương), thời điểm lưu epoch milliseconds.

export type GioiTinh = 'nam' | 'nu' | 'khac'

export type MucVanDong = 'it' | 'nhe' | 'vua' | 'nhieu' | 'rat_nhieu'

export type MucTieu = 'giam_can' | 'giu_can' | 'tang_can' | 'tang_co'

export type CheDoAn = 'binh_thuong' | 'chay' | 'thuan_chay' | 'low_carb' | 'keto' | 'eat_clean'

export type LoaiBua = 'sang' | 'trua' | 'toi' | 'phu'

export type DoTinCay = 'cao' | 'trung_binh' | 'thap'

export type NguonNhap = 'anh' | 'tim_kiem' | 'thu_cong' | 'ma_vach' | 'cong_thuc' | 'chep_lai'

/** Thành phần dinh dưỡng. Mọi giá trị tính trên cùng một khẩu phần đang xét. */
export interface DinhDuong {
  calo: number
  dam: number
  tinhbot: number
  beo: number
  chatxo: number
  duong: number
  natri: number // mg
}

export interface KhauPhan {
  ten: string // 'tô vừa', 'chén', 'cái', '100 g'
  gam: number
}

export interface NguoiDung {
  id: number
  ten: string
  gioiTinh: GioiTinh
  ngaySinh: string
  chieuCaoCm: number
  mucVanDong: MucVanDong
  mucTieu: MucTieu
  canNangMucTieuKg: number
  tocDoKgTuan: number
  cheDoAn: CheDoAn
  diUng: string[]
  benhNen: string[]
  /** Người dùng có thể ghi đè con số app tính ra. */
  caloMucTieu: number
  macroDamPhanTram: number
  macroTinhbotPhanTram: number
  macroBeoPhanTram: number
  nuocMucTieuMl: number
  /** Cộng calo đốt do tập luyện vào hạn mức ăn trong ngày. Mặc định tắt. */
  congCaloTapLuyen: boolean
  taoLuc: number
  suaLuc: number
}

export interface ThucPham {
  id?: number
  ten: string
  tenKhac: string[]
  nhom: string
  /** Dinh dưỡng trên 100 g. */
  tren100g: DinhDuong
  khauPhanChuan: KhauPhan[]
  maVach?: string
  nguon: string
  laCuaNguoiDung: boolean
  taoLuc: number
}

export interface NguyenLieu {
  thucPhamId: number
  tenHienThi: string
  gam: number
}

export interface CongThuc {
  id?: number
  ten: string
  soPhan: number
  nguyenLieu: NguyenLieu[]
  ghiChu: string
  taoLuc: number
  suaLuc: number
  deletedAt?: number
}

export interface NhatKyAn {
  id?: number
  ngay: string
  loaiBua: LoaiBua
  thoiDiem: number
  thucPhamId?: number
  tenHienThi: string
  khoiLuongG: number
  /** Dinh dưỡng đã nhân theo khối lượng thực tế, không phải trên 100 g. */
  dinhDuong: DinhDuong
  anhId?: number
  doTinCay?: DoTinCay
  nguonNhap: NguonNhap
  ghiChu: string
  taoLuc: number
  suaLuc: number
  deletedAt?: number
}

export interface AnhBuaAn {
  id?: number
  /** Ảnh lưu thẳng trong IndexedDB, không upload đi đâu. */
  blob: Blob
  hash: string
  ketQuaAi?: string
  chupLuc: number
}

export interface CanNang {
  id?: number
  ngay: string
  kg: number
  tyLeMo?: number
  ghiChu: string
  taoLuc: number
  deletedAt?: number
}

export interface SoDoCoThe {
  id?: number
  ngay: string
  eo?: number
  mong?: number
  nguc?: number
  tay?: number
  dui?: number
  taoLuc: number
  deletedAt?: number
}

export interface AnhTienTrinh {
  id?: number
  ngay: string
  blob: Blob
  gocChup: 'truoc' | 'nghieng' | 'sau'
  taoLuc: number
  deletedAt?: number
}

export type LoaiChiSo =
  | 'nuoc'
  | 'ngu'
  | 'buoc'
  | 'nhip_tim'
  | 'huyet_ap'
  | 'duong_huyet'
  | 'tam_trang'

export interface ChiSoSucKhoe {
  id?: number
  ngay: string
  thoiDiem: number
  loai: LoaiChiSo
  giaTri: number
  /** Dùng cho huyết áp (tâm trương) hoặc chất lượng giấc ngủ. */
  giaTriPhu?: number
  donVi: string
  ghiChu: string
  taoLuc: number
  deletedAt?: number
}

export type NhomCo =
  | 'nguc' | 'lung' | 'chan' | 'vai' | 'tay' | 'bung' | 'cardio' | 'toan_than'

export interface BaiTap {
  id?: number
  ten: string
  nhomCo: NhomCo
  dungCu: string
  moTa: string
  /** Chỉ số MET để ước lượng calo đốt. */
  met: number
  laCardio: boolean
  laCuaNguoiDung: boolean
}

export interface BaiTapTrongMau {
  baiTapId: number
  soSet: number
  soRep: number
  taKg: number
  /** Với bài cardio: thời lượng dự kiến (phút). */
  phut?: number
}

export interface BuoiTapMau {
  id?: number
  ten: string
  ghiChu: string
  baiTap: BaiTapTrongMau[]
  taoLuc: number
  suaLuc: number
  deletedAt?: number
}

export interface LichTap {
  id?: number
  /** 0 = Chủ nhật ... 6 = Thứ Bảy, khớp với Date.getDay(). */
  thuTrongTuan: number
  buoiTapMauId: number
}

export interface NhatKyTap {
  id?: number
  ngay: string
  buoiTapMauId?: number
  ten: string
  batDau: number
  ketThuc?: number
  tongVolume: number
  caloDot: number
  camNhan?: 1 | 2 | 3 | 4 | 5
  ghiChu: string
  taoLuc: number
  suaLuc: number
  deletedAt?: number
}

export interface SetTap {
  id?: number
  nhatKyTapId: number
  baiTapId: number
  thuTuSet: number
  rep: number
  taKg: number
  phut?: number
  hoanThanh: boolean
}

/** Lưu lịch sử mục tiêu để báo cáo cũ vẫn đúng khi người dùng đổi mục tiêu. */
export interface MucTieuLichSu {
  id?: number
  apDungTu: string
  calo: number
  dam: number
  tinhbot: number
  beo: number
  taoLuc: number
}

export interface CaiDat {
  key: string
  value: unknown
}
