// Cơ sở dữ liệu món ăn Việt Nam.
// Số liệu tham khảo Bảng thành phần thực phẩm Việt Nam (Viện Dinh dưỡng Quốc gia)
// và USDA FoodData Central, quy về đơn vị trên 100 g phần ăn được.
// Đây là số liệu trung bình — cách nấu của mỗi nhà mỗi khác, người dùng sửa được.

import type { DinhDuong, KhauPhan } from '../lib/types'

export interface ThucPhamMau {
  ten: string
  tenKhac: string[]
  nhom: string
  tren100g: DinhDuong
  khauPhanChuan: KhauPhan[]
}

/** Rút gọn khai báo: [calo, đạm, tinh bột, béo, chất xơ, đường, natri] trên 100 g. */
type Bo7 = [number, number, number, number, number, number, number]

function dd(b: Bo7): DinhDuong {
  return {
    calo: b[0], dam: b[1], tinhbot: b[2], beo: b[3],
    chatxo: b[4], duong: b[5], natri: b[6],
  }
}

function kp(...ds: [string, number][]): KhauPhan[] {
  return ds.map(([ten, gam]) => ({ ten, gam }))
}

function m(
  ten: string, tenKhac: string[], nhom: string, b: Bo7, khauPhan: KhauPhan[],
): ThucPhamMau {
  return { ten, tenKhac, nhom, tren100g: dd(b), khauPhanChuan: khauPhan }
}

export const NHOM_THUC_PHAM = [
  'Món nước', 'Cơm & món mặn', 'Bún, phở, miến khô', 'Bánh mì & món cuốn',
  'Đồ ăn sáng', 'Thịt & hải sản', 'Rau củ', 'Trái cây', 'Ngũ cốc & tinh bột',
  'Sữa & trứng', 'Đồ uống', 'Ăn vặt & bánh kẹo', 'Gia vị & dầu mỡ',
  'Món chay', 'Đồ ăn nhanh', 'Chè & tráng miệng',
] as const

export const THUC_PHAM_MAC_DINH: ThucPhamMau[] = [
  // ---------- Món nước ----------
  m('Phở bò', ['pho bo', 'phở tái', 'phở chín'], 'Món nước', [90, 5.5, 12, 2.2, 0.6, 0.8, 420], kp(['tô nhỏ', 400], ['tô vừa', 500], ['tô lớn', 700])),
  m('Phở gà', ['pho ga'], 'Món nước', [85, 5.8, 11.5, 1.8, 0.5, 0.7, 400], kp(['tô nhỏ', 400], ['tô vừa', 500], ['tô lớn', 700])),
  m('Bún bò Huế', ['bun bo hue', 'bún bò'], 'Món nước', [105, 6, 12.5, 3.5, 0.7, 1, 520], kp(['tô vừa', 500], ['tô lớn', 650])),
  m('Bún riêu cua', ['bun rieu'], 'Món nước', [88, 5, 11, 2.8, 0.9, 1.2, 480], kp(['tô vừa', 500])),
  m('Bún chả cá', ['bun cha ca'], 'Món nước', [92, 6.5, 11, 2.5, 0.6, 1, 500], kp(['tô vừa', 500])),
  m('Bún mắm', ['bun mam'], 'Món nước', [110, 6.5, 12, 4, 0.8, 1, 700], kp(['tô vừa', 500])),
  m('Bún măng vịt', ['bun mang vit'], 'Món nước', [95, 6.8, 10.5, 3, 0.9, 0.8, 450], kp(['tô vừa', 500])),
  m('Hủ tiếu Nam Vang', ['hu tieu nam vang', 'hủ tiếu'], 'Món nước', [98, 6, 13, 2.6, 0.6, 1.2, 460], kp(['tô vừa', 500])),
  m('Mì Quảng', ['mi quang'], 'Món nước', [130, 7, 16, 4.5, 0.8, 1.2, 480], kp(['tô vừa', 400])),
  m('Bánh canh cua', ['banh canh cua'], 'Món nước', [100, 5.5, 14, 2.5, 0.5, 1, 500], kp(['tô vừa', 500])),
  m('Cháo lòng', ['chao long'], 'Món nước', [78, 4, 10, 2.5, 0.3, 0.4, 400], kp(['tô vừa', 400])),
  m('Cháo gà', ['chao ga'], 'Món nước', [62, 4, 9, 1.2, 0.3, 0.3, 350], kp(['tô vừa', 400])),
  m('Cháo trắng', ['chao trang'], 'Món nước', [45, 0.9, 10, 0.1, 0.2, 0, 120], kp(['tô vừa', 400])),
  m('Canh chua cá', ['canh chua'], 'Món nước', [45, 4, 4, 1.2, 0.8, 2.5, 380], kp(['chén', 200], ['tô', 350])),
  m('Canh rau ngót thịt băm', ['canh rau ngot'], 'Món nước', [30, 3, 2, 1.2, 1.2, 0.6, 300], kp(['chén', 200])),
  m('Lẩu thái', ['lau thai'], 'Món nước', [70, 5, 5, 3.5, 0.8, 1.5, 600], kp(['chén', 250])),
  m('Súp cua', ['sup cua'], 'Món nước', [75, 5, 8, 2.5, 0.3, 1.5, 450], kp(['chén', 250])),

  // ---------- Cơm & món mặn ----------
  m('Cơm trắng', ['com trang', 'cơm'], 'Cơm & món mặn', [130, 2.7, 28, 0.3, 0.4, 0.1, 1], kp(['chén', 150], ['tô', 250], ['đĩa', 200])),
  m('Cơm gạo lứt', ['com gao lut'], 'Cơm & món mặn', [123, 2.7, 26, 1, 1.8, 0.4, 4], kp(['chén', 150])),
  m('Cơm tấm sườn bì chả', ['com tam'], 'Cơm & món mặn', [175, 8, 24, 5.5, 0.7, 2, 520], kp(['đĩa', 450])),
  m('Cơm gà xối mỡ', ['com ga xoi mo'], 'Cơm & món mặn', [190, 9, 24, 7, 0.6, 1, 500], kp(['đĩa', 400])),
  m('Cơm chiên dương châu', ['com chien'], 'Cơm & món mặn', [165, 6, 24, 5, 0.7, 1.5, 560], kp(['đĩa', 350])),
  m('Cơm rang dưa bò', ['com rang dua bo'], 'Cơm & món mặn', [170, 7.5, 23, 5.5, 0.8, 1.2, 600], kp(['đĩa', 350])),
  m('Thịt kho tàu', ['thit kho tau', 'thịt kho trứng'], 'Cơm & món mặn', [240, 14, 4, 19, 0, 3.5, 620], kp(['miếng', 60], ['chén', 150])),
  m('Cá kho tộ', ['ca kho to'], 'Cơm & món mặn', [155, 18, 3.5, 8, 0.1, 2.5, 700], kp(['khúc', 80], ['chén', 150])),
  m('Gà kho gừng', ['ga kho gung'], 'Cơm & món mặn', [170, 20, 3, 8.5, 0.2, 2, 580], kp(['chén', 150])),
  m('Sườn xào chua ngọt', ['suon xao chua ngot'], 'Cơm & món mặn', [215, 15, 9, 13, 0.4, 6.5, 520], kp(['chén', 150])),
  m('Tôm rim mặn', ['tom rim'], 'Cơm & món mặn', [130, 18, 4, 4.5, 0.1, 3, 750], kp(['chén', 120])),
  m('Trứng chiên', ['trung chien', 'trứng rán'], 'Cơm & món mặn', [196, 13, 1, 15, 0, 0.8, 250], kp(['quả', 60])),
  m('Đậu hũ sốt cà', ['dau hu sot ca'], 'Cơm & món mặn', [105, 8, 5, 6, 1, 2.5, 380], kp(['chén', 150])),
  m('Rau muống xào tỏi', ['rau muong xao toi'], 'Cơm & món mặn', [75, 2.6, 5, 5, 2, 1, 320], kp(['đĩa', 150])),
  m('Thịt luộc', ['thit luoc', 'thịt heo luộc'], 'Cơm & món mặn', [242, 26, 0, 15, 0, 0, 60], kp(['miếng', 40], ['đĩa', 150])),
  m('Chả lụa', ['cha lua', 'giò lụa'], 'Cơm & món mặn', [190, 14, 4, 13, 0, 1, 800], kp(['lát', 30])),
  m('Nem rán', ['nem ran', 'chả giò'], 'Cơm & món mặn', [280, 11, 24, 16, 1.2, 2, 480], kp(['cái', 40])),

  // ---------- Bún, phở, miến khô ----------
  m('Bún thịt nướng', ['bun thit nuong'], 'Bún, phở, miến khô', [150, 8, 20, 4.5, 1, 4, 450], kp(['tô vừa', 400])),
  m('Bún chả Hà Nội', ['bun cha'], 'Bún, phở, miến khô', [145, 9, 17, 5, 0.9, 4.5, 520], kp(['suất', 400])),
  m('Bún đậu mắm tôm', ['bun dau mam tom'], 'Bún, phở, miến khô', [175, 8, 20, 7.5, 1.2, 1, 850], kp(['suất', 400])),
  m('Miến xào', ['mien xao'], 'Bún, phở, miến khô', [155, 4, 27, 4, 0.8, 1.5, 480], kp(['đĩa', 300])),
  m('Mì xào giòn', ['mi xao gion'], 'Bún, phở, miến khô', [210, 7, 26, 9, 1, 2, 620], kp(['đĩa', 300])),
  m('Mì gói (đã nấu)', ['mi goi', 'mì tôm', 'mì ăn liền'], 'Bún, phở, miến khô', [135, 3, 18, 5.5, 0.7, 0.6, 620], kp(['gói', 330])),
  m('Bún tươi (chưa chan)', ['bun tuoi'], 'Bún, phở, miến khô', [110, 2, 25, 0.2, 0.5, 0, 5], kp(['chén', 150])),

  // ---------- Bánh mì & món cuốn ----------
  m('Bánh mì thịt', ['banh mi thit', 'bánh mì'], 'Bánh mì & món cuốn', [250, 10, 33, 9, 1.5, 3, 620], kp(['ổ', 180])),
  m('Bánh mì trứng', ['banh mi trung'], 'Bánh mì & món cuốn', [255, 10, 32, 10, 1.4, 2.5, 520], kp(['ổ', 160])),
  m('Bánh mì không', ['banh mi khong', 'bánh mì trắng'], 'Bánh mì & món cuốn', [265, 8.5, 50, 3, 2.2, 4, 490], kp(['ổ', 90], ['lát', 30])),
  m('Gỏi cuốn tôm thịt', ['goi cuon'], 'Bánh mì & món cuốn', [95, 6, 14, 1.5, 0.8, 1.5, 280], kp(['cuốn', 70])),
  m('Bánh cuốn', ['banh cuon'], 'Bánh mì & món cuốn', [130, 5, 20, 3.5, 0.6, 1, 420], kp(['đĩa', 250])),
  m('Bánh xèo', ['banh xeo'], 'Bánh mì & món cuốn', [215, 7, 22, 11, 1.2, 2, 450], kp(['cái', 150])),
  m('Bánh bèo', ['banh beo'], 'Bánh mì & món cuốn', [125, 3, 22, 2.5, 0.4, 1.5, 380], kp(['đĩa', 200])),
  m('Bánh bột lọc', ['banh bot loc'], 'Bánh mì & món cuốn', [155, 4, 30, 2, 0.3, 1, 400], kp(['cái', 25])),
  m('Bánh giò', ['banh gio'], 'Bánh mì & món cuốn', [145, 5, 21, 4.5, 0.5, 1, 420], kp(['cái', 200])),
  m('Bánh chưng', ['banh chung'], 'Bánh mì & món cuốn', [205, 6, 30, 6.5, 0.8, 0.6, 380], kp(['miếng', 150])),

  // ---------- Đồ ăn sáng ----------
  m('Xôi mặn', ['xoi man'], 'Đồ ăn sáng', [215, 6, 34, 6, 0.9, 1, 420], kp(['gói', 250])),
  m('Xôi đậu xanh', ['xoi dau xanh'], 'Đồ ăn sáng', [185, 5, 36, 2.5, 1.3, 2, 60], kp(['gói', 200])),
  m('Bánh bao thịt trứng cút', ['banh bao'], 'Đồ ăn sáng', [235, 9, 32, 8, 1, 5, 450], kp(['cái', 110])),
  m('Yến mạch nấu sữa', ['yen mach', 'oatmeal'], 'Đồ ăn sáng', [95, 3.5, 15, 2.2, 1.8, 4, 40], kp(['chén', 250])),
  m('Ngũ cốc ăn sáng', ['ngu coc', 'cereal'], 'Đồ ăn sáng', [380, 8, 78, 4, 6, 20, 400], kp(['chén', 40])),

  // ---------- Thịt & hải sản ----------
  m('Ức gà không da (luộc)', ['uc ga', 'ức gà'], 'Thịt & hải sản', [165, 31, 0, 3.6, 0, 0, 74], kp(['miếng', 120], ['100 g', 100])),
  m('Đùi gà (luộc)', ['dui ga'], 'Thịt & hải sản', [209, 26, 0, 11, 0, 0, 88], kp(['cái', 120])),
  m('Thịt bò nạc', ['thit bo', 'bò'], 'Thịt & hải sản', [217, 26, 0, 12, 0, 0, 66], kp(['100 g', 100])),
  m('Thịt heo nạc', ['thit heo', 'thịt lợn'], 'Thịt & hải sản', [242, 27, 0, 14, 0, 0, 62], kp(['100 g', 100])),
  m('Ba chỉ heo', ['ba chi', 'ba rọi'], 'Thịt & hải sản', [518, 9, 0, 53, 0, 0, 32], kp(['100 g', 100])),
  m('Cá basa', ['ca basa'], 'Thịt & hải sản', [125, 15, 0, 7, 0, 0, 50], kp(['khúc', 100])),
  m('Cá thu', ['ca thu'], 'Thịt & hải sản', [205, 19, 0, 14, 0, 0, 90], kp(['khúc', 100])),
  m('Cá hồi', ['ca hoi', 'salmon'], 'Thịt & hải sản', [208, 20, 0, 13, 0, 0, 59], kp(['miếng', 120])),
  m('Tôm sú (luộc)', ['tom su', 'tôm'], 'Thịt & hải sản', [99, 24, 0, 0.3, 0, 0, 111], kp(['con', 20], ['100 g', 100])),
  m('Mực tươi', ['muc'], 'Thịt & hải sản', [92, 15.6, 3, 1.4, 0, 0, 44], kp(['100 g', 100])),
  m('Nghêu, sò', ['ngheu', 'sò'], 'Thịt & hải sản', [86, 14, 3, 1, 0, 0, 300], kp(['100 g', 100])),

  // ---------- Rau củ ----------
  m('Rau muống', ['rau muong'], 'Rau củ', [19, 2.6, 3, 0.2, 2.1, 0.5, 113], kp(['bó', 300], ['đĩa', 150])),
  m('Cải ngọt', ['cai ngot'], 'Rau củ', [15, 1.5, 2.2, 0.2, 1.2, 1, 65], kp(['đĩa', 150])),
  m('Bắp cải', ['bap cai'], 'Rau củ', [25, 1.3, 6, 0.1, 2.5, 3.2, 18], kp(['chén', 90])),
  m('Cà chua', ['ca chua'], 'Rau củ', [18, 0.9, 3.9, 0.2, 1.2, 2.6, 5], kp(['quả', 120])),
  m('Dưa leo', ['dua leo', 'dưa chuột'], 'Rau củ', [15, 0.7, 3.6, 0.1, 0.5, 1.7, 2], kp(['quả', 150])),
  m('Cà rốt', ['ca rot'], 'Rau củ', [41, 0.9, 10, 0.2, 2.8, 4.7, 69], kp(['củ', 70])),
  m('Bí đỏ', ['bi do', 'bí ngô'], 'Rau củ', [26, 1, 6.5, 0.1, 0.5, 2.8, 1], kp(['chén', 150])),
  m('Súp lơ xanh', ['sup lo xanh', 'bông cải xanh', 'broccoli'], 'Rau củ', [34, 2.8, 7, 0.4, 2.6, 1.7, 33], kp(['chén', 90])),
  m('Nấm rơm', ['nam rom'], 'Rau củ', [22, 3.1, 3.3, 0.3, 1.5, 1, 5], kp(['chén', 80])),
  m('Giá đỗ', ['gia do'], 'Rau củ', [30, 3, 6, 0.2, 1.8, 4.1, 6], kp(['chén', 100])),
  m('Khoai tây luộc', ['khoai tay'], 'Rau củ', [87, 1.9, 20, 0.1, 1.8, 0.9, 4], kp(['củ', 150])),
  m('Khoai lang luộc', ['khoai lang'], 'Rau củ', [90, 2, 21, 0.2, 3.3, 6.5, 36], kp(['củ', 150])),

  // ---------- Trái cây ----------
  m('Chuối', ['chuoi'], 'Trái cây', [89, 1.1, 23, 0.3, 2.6, 12, 1], kp(['quả', 120])),
  m('Táo', ['tao'], 'Trái cây', [52, 0.3, 14, 0.2, 2.4, 10, 1], kp(['quả', 180])),
  m('Cam', ['cam'], 'Trái cây', [47, 0.9, 12, 0.1, 2.4, 9, 0], kp(['quả', 150])),
  m('Xoài', ['xoai'], 'Trái cây', [60, 0.8, 15, 0.4, 1.6, 14, 1], kp(['quả', 200])),
  m('Dưa hấu', ['dua hau'], 'Trái cây', [30, 0.6, 7.6, 0.2, 0.4, 6.2, 1], kp(['miếng', 200])),
  m('Đu đủ', ['du du'], 'Trái cây', [43, 0.5, 11, 0.3, 1.7, 7.8, 8], kp(['miếng', 150])),
  m('Ổi', ['oi'], 'Trái cây', [68, 2.6, 14, 1, 5.4, 9, 2], kp(['quả', 150])),
  m('Thanh long', ['thanh long'], 'Trái cây', [60, 1.2, 13, 0.4, 3, 8, 0], kp(['quả', 250])),
  m('Nho', ['nho'], 'Trái cây', [69, 0.7, 18, 0.2, 0.9, 16, 2], kp(['chùm nhỏ', 100])),
  m('Bơ', ['bo', 'avocado'], 'Trái cây', [160, 2, 8.5, 15, 6.7, 0.7, 7], kp(['quả', 200])),
  m('Sầu riêng', ['sau rieng'], 'Trái cây', [147, 1.5, 27, 5.3, 3.8, 6, 2], kp(['múi', 60])),
  m('Mít', ['mit'], 'Trái cây', [95, 1.7, 23, 0.6, 1.5, 19, 2], kp(['múi', 40])),

  // ---------- Ngũ cốc & tinh bột ----------
  m('Gạo trắng (chưa nấu)', ['gao trang'], 'Ngũ cốc & tinh bột', [365, 7, 80, 0.7, 1.3, 0.1, 1], kp(['100 g', 100])),
  m('Yến mạch khô', ['yen mach kho'], 'Ngũ cốc & tinh bột', [389, 17, 66, 7, 11, 1, 2], kp(['muỗng', 15], ['chén', 80])),
  m('Bánh phở khô', ['banh pho kho'], 'Ngũ cốc & tinh bột', [364, 6, 82, 0.6, 1.6, 0, 5], kp(['100 g', 100])),
  m('Bắp luộc', ['bap luoc', 'ngô'], 'Ngũ cốc & tinh bột', [96, 3.4, 21, 1.5, 2.4, 4.5, 15], kp(['bắp', 180])),
  m('Đậu xanh', ['dau xanh'], 'Ngũ cốc & tinh bột', [347, 24, 63, 1.2, 16, 6.6, 15], kp(['100 g', 100])),
  m('Đậu phộng rang', ['dau phong', 'lạc'], 'Ngũ cốc & tinh bột', [585, 24, 21, 50, 8, 4, 18], kp(['nắm', 30])),
  m('Hạt điều', ['hat dieu'], 'Ngũ cốc & tinh bột', [553, 18, 30, 44, 3.3, 6, 12], kp(['nắm', 30])),

  // ---------- Sữa & trứng ----------
  m('Trứng gà luộc', ['trung ga luoc', 'trứng luộc'], 'Sữa & trứng', [155, 13, 1.1, 11, 0, 1.1, 124], kp(['quả', 55])),
  m('Trứng vịt lộn', ['trung vit lon', 'hột vịt lộn'], 'Sữa & trứng', [185, 14, 2, 13, 0, 1, 130], kp(['quả', 70])),
  m('Sữa tươi không đường', ['sua tuoi khong duong'], 'Sữa & trứng', [61, 3.2, 4.8, 3.3, 0, 4.8, 43], kp(['hộp', 180], ['ly', 250])),
  m('Sữa tươi có đường', ['sua tuoi co duong'], 'Sữa & trứng', [74, 3, 10, 3, 0, 10, 45], kp(['hộp', 180])),
  m('Sữa đặc', ['sua dac', 'sữa ông thọ'], 'Sữa & trứng', [321, 8, 54, 9, 0, 54, 127], kp(['muỗng', 20])),
  m('Sữa chua có đường', ['sua chua', 'yaourt'], 'Sữa & trứng', [97, 3.5, 15, 2.5, 0, 15, 50], kp(['hộp', 100])),
  m('Sữa chua không đường', ['sua chua khong duong'], 'Sữa & trứng', [61, 3.5, 4.7, 3.3, 0, 4.7, 46], kp(['hộp', 100])),
  m('Phô mai', ['pho mai', 'cheese'], 'Sữa & trứng', [402, 25, 1.3, 33, 0, 0.5, 621], kp(['lát', 20], ['miếng', 15])),
  m('Whey protein (bột)', ['whey', 'protein powder'], 'Sữa & trứng', [400, 80, 8, 5, 0, 5, 200], kp(['muỗng', 30])),

  // ---------- Đồ uống ----------
  m('Cà phê đen không đường', ['ca phe den'], 'Đồ uống', [2, 0.2, 0, 0, 0, 0, 5], kp(['ly', 200])),
  m('Cà phê sữa đá', ['ca phe sua da', 'bạc xỉu'], 'Đồ uống', [90, 2, 15, 2.5, 0, 14, 40], kp(['ly', 250])),
  m('Trà sữa trân châu', ['tra sua', 'bubble tea'], 'Đồ uống', [95, 1, 18, 2.5, 0.2, 15, 35], kp(['ly vừa', 500], ['ly lớn', 700])),
  m('Nước ngọt có ga', ['nuoc ngot', 'coca', 'pepsi'], 'Đồ uống', [42, 0, 11, 0, 0, 11, 10], kp(['lon', 330], ['chai', 500])),
  m('Nước cam ép', ['nuoc cam ep'], 'Đồ uống', [45, 0.7, 10, 0.2, 0.2, 8.4, 1], kp(['ly', 250])),
  m('Nước mía', ['nuoc mia'], 'Đồ uống', [55, 0.1, 14, 0, 0, 13, 3], kp(['ly', 400])),
  m('Bia', ['bia'], 'Đồ uống', [43, 0.5, 3.6, 0, 0, 0, 4], kp(['lon', 330], ['chai', 450])),
  m('Nước lọc', ['nuoc loc', 'nước'], 'Đồ uống', [0, 0, 0, 0, 0, 0, 0], kp(['ly', 250], ['chai', 500])),
  m('Trà đá', ['tra da'], 'Đồ uống', [1, 0, 0.3, 0, 0, 0, 3], kp(['ly', 250])),

  // ---------- Ăn vặt & bánh kẹo ----------
  m('Bánh tráng trộn', ['banh trang tron'], 'Ăn vặt & bánh kẹo', [280, 8, 42, 9, 1.5, 4, 950], kp(['bịch', 150])),
  m('Khoai tây chiên', ['khoai tay chien'], 'Ăn vặt & bánh kẹo', [312, 3.4, 41, 15, 3.8, 0.3, 210], kp(['phần vừa', 115])),
  m('Bánh quy', ['banh quy'], 'Ăn vặt & bánh kẹo', [480, 6, 65, 21, 2, 25, 350], kp(['cái', 12])),
  m('Snack khoai tây', ['snack', 'bim bim'], 'Ăn vặt & bánh kẹo', [530, 6, 53, 33, 4, 1, 550], kp(['gói', 40])),
  m('Sô cô la sữa', ['so co la', 'chocolate'], 'Ăn vặt & bánh kẹo', [535, 7.6, 59, 30, 3.4, 52, 79], kp(['thanh', 45])),
  m('Bánh bông lan', ['banh bong lan'], 'Ăn vặt & bánh kẹo', [340, 6, 52, 12, 0.8, 30, 280], kp(['lát', 70])),
  m('Kem', ['kem', 'ice cream'], 'Ăn vặt & bánh kẹo', [207, 3.5, 24, 11, 0.7, 21, 80], kp(['cây', 70], ['hũ', 100])),

  // ---------- Gia vị & dầu mỡ ----------
  m('Dầu ăn', ['dau an'], 'Gia vị & dầu mỡ', [884, 0, 0, 100, 0, 0, 0], kp(['muỗng canh', 14], ['muỗng cà phê', 5])),
  m('Nước mắm', ['nuoc mam'], 'Gia vị & dầu mỡ', [35, 5, 3.6, 0, 0, 3, 7850], kp(['muỗng canh', 15])),
  m('Nước tương', ['nuoc tuong', 'xì dầu'], 'Gia vị & dầu mỡ', [53, 8, 5, 0.1, 0.8, 1.7, 5493], kp(['muỗng canh', 15])),
  m('Tương ớt', ['tuong ot'], 'Gia vị & dầu mỡ', [93, 1, 22, 0.4, 1.5, 18, 1300], kp(['muỗng canh', 15])),
  m('Mayonnaise', ['mayonnaise', 'sốt mayo'], 'Gia vị & dầu mỡ', [680, 1, 0.6, 75, 0, 0.6, 635], kp(['muỗng canh', 14])),
  m('Đường cát', ['duong cat', 'đường'], 'Gia vị & dầu mỡ', [387, 0, 100, 0, 0, 100, 1], kp(['muỗng cà phê', 4], ['muỗng canh', 12])),

  // ---------- Món chay ----------
  m('Đậu hũ trắng', ['dau hu', 'tàu hũ', 'đậu phụ'], 'Món chay', [76, 8, 1.9, 4.8, 0.3, 0.6, 7], kp(['miếng', 100])),
  m('Đậu hũ chiên', ['dau hu chien'], 'Món chay', [190, 12, 6, 13, 1, 1, 15], kp(['miếng', 60])),
  m('Cơm chay thập cẩm', ['com chay'], 'Món chay', [145, 4.5, 24, 4, 2, 2, 400], kp(['đĩa', 350])),
  m('Mì căn kho', ['mi can', 'seitan'], 'Món chay', [140, 21, 8, 2.5, 0.8, 1.5, 500], kp(['chén', 120])),
  m('Nấm xào', ['nam xao'], 'Món chay', [85, 3, 5, 6, 1.5, 1.5, 350], kp(['đĩa', 150])),

  // ---------- Đồ ăn nhanh ----------
  m('Hamburger bò', ['hamburger', 'burger'], 'Đồ ăn nhanh', [255, 13, 30, 9.5, 1.5, 5, 500], kp(['cái', 220])),
  m('Pizza phô mai', ['pizza'], 'Đồ ăn nhanh', [266, 11, 33, 10, 2.3, 3.6, 598], kp(['miếng', 100])),
  m('Gà rán', ['ga ran', 'fried chicken'], 'Đồ ăn nhanh', [280, 21, 12, 17, 0.8, 0, 650], kp(['miếng', 100])),
  m('Xúc xích', ['xuc xich'], 'Đồ ăn nhanh', [300, 12, 3, 27, 0, 1.5, 900], kp(['cây', 50])),

  // ---------- Chè & tráng miệng ----------
  m('Chè đậu xanh', ['che dau xanh'], 'Chè & tráng miệng', [120, 3, 24, 1.5, 1.5, 16, 30], kp(['ly', 250])),
  m('Chè ba màu', ['che ba mau'], 'Chè & tráng miệng', [145, 2, 28, 3.5, 1.2, 20, 40], kp(['ly', 250])),
  m('Sữa chua nếp cẩm', ['sua chua nep cam'], 'Chè & tráng miệng', [130, 3.5, 24, 2.5, 1, 18, 45], kp(['ly', 200])),
  m('Bánh flan', ['banh flan', 'caramen'], 'Chè & tráng miệng', [150, 4, 22, 5, 0, 21, 90], kp(['cái', 100])),
  m('Rau câu', ['rau cau', 'thạch'], 'Chè & tráng miệng', [70, 0.5, 17, 0.2, 0.3, 15, 20], kp(['miếng', 80])),
]

/** Bỏ dấu tiếng Việt để tìm kiếm gõ không dấu vẫn ra kết quả. */
export function boDau(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}
