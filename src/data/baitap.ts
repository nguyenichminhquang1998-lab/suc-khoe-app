// Thư viện bài tập. Chỉ số MET lấy theo Compendium of Physical Activities
// (Ainsworth et al.) — dùng để ước lượng calo đốt: MET × cân nặng × giờ.

import type { NhomCo } from '../lib/types'

export interface BaiTapMau {
  ten: string
  nhomCo: NhomCo
  dungCu: string
  moTa: string
  met: number
  laCardio: boolean
}

function b(
  ten: string, nhomCo: NhomCo, dungCu: string, met: number, moTa: string, laCardio = false,
): BaiTapMau {
  return { ten, nhomCo, dungCu, met, moTa, laCardio }
}

export const NHAN_NHOM_CO: Record<NhomCo, string> = {
  nguc: 'Ngực',
  lung: 'Lưng',
  chan: 'Chân',
  vai: 'Vai',
  tay: 'Tay',
  bung: 'Bụng',
  cardio: 'Cardio',
  toan_than: 'Toàn thân',
}

export const BAI_TAP_MAC_DINH: BaiTapMau[] = [
  // ---------- Ngực ----------
  b('Đẩy ngực nằm (Bench Press)', 'nguc', 'Thanh đòn', 5, 'Nằm ngửa trên ghế, hạ thanh đòn chạm giữa ngực rồi đẩy lên thẳng tay. Giữ vai ép xuống ghế.'),
  b('Đẩy ngực tạ đơn', 'nguc', 'Tạ đơn', 5, 'Như bench press nhưng dùng hai tạ đơn, biên độ rộng hơn.'),
  b('Đẩy ngực dốc lên', 'nguc', 'Thanh đòn', 5, 'Ghế nghiêng 30–45°, tập trung phần ngực trên.'),
  b('Hít đất (Push-up)', 'nguc', 'Không', 3.8, 'Chống tay rộng hơn vai, thân thẳng, hạ ngực gần chạm sàn.'),
  b('Ép ngực máy (Pec Deck)', 'nguc', 'Máy', 4, 'Ngồi thẳng lưng, ép hai tay vào giữa, siết ngực ở đỉnh.'),
  b('Dip ngực', 'nguc', 'Xà kép', 5, 'Người hơi đổ về trước để dồn lực vào ngực thay vì tay sau.'),

  // ---------- Lưng ----------
  b('Kéo xà (Pull-up)', 'lung', 'Xà đơn', 8, 'Nắm xà rộng hơn vai, kéo tới khi cằm qua xà, hạ xuống có kiểm soát.'),
  b('Kéo cáp mặt trước (Lat Pulldown)', 'lung', 'Máy cáp', 5, 'Kéo thanh xuống trước ngực, siết bả vai, không ngả người quá nhiều.'),
  b('Chèo tạ đòn (Barbell Row)', 'lung', 'Thanh đòn', 5.5, 'Gập hông 45°, lưng thẳng, kéo thanh về phía rốn.'),
  b('Chèo tạ đơn một tay', 'lung', 'Tạ đơn', 5, 'Chống một tay lên ghế, kéo tạ sát thân người.'),
  b('Deadlift', 'lung', 'Thanh đòn', 6, 'Giữ lưng thẳng tuyệt đối, đẩy sàn bằng chân, thanh đòn đi sát ống chân.'),
  b('Chèo cáp ngồi', 'lung', 'Máy cáp', 5, 'Ngồi thẳng, kéo tay cầm về bụng, siết bả vai.'),

  // ---------- Chân ----------
  b('Squat', 'chan', 'Thanh đòn', 6, 'Chân rộng bằng vai, hạ hông xuống tới khi đùi song song sàn, gối không đổ vào trong.'),
  b('Squat không tạ', 'chan', 'Không', 4, 'Như squat nhưng dùng trọng lượng cơ thể, phù hợp tập tại nhà.'),
  b('Đạp đùi (Leg Press)', 'chan', 'Máy', 5.5, 'Đặt chân giữa bàn đạp, hạ tới góc 90° rồi đẩy, không khóa gối.'),
  b('Lunge', 'chan', 'Tạ đơn', 5, 'Bước một chân về trước, hạ gối sau gần chạm sàn.'),
  b('Đá đùi trước (Leg Extension)', 'chan', 'Máy', 4, 'Ngồi máy, duỗi thẳng chân, siết đùi trước ở đỉnh.'),
  b('Cuốn đùi sau (Leg Curl)', 'chan', 'Máy', 4, 'Nằm sấp hoặc ngồi, gập gối kéo tạ về phía mông.'),
  b('Nhón bắp chân', 'chan', 'Tạ đơn', 3.5, 'Đứng thẳng, nhón gót lên cao nhất có thể, hạ chậm.'),
  b('Hip Thrust', 'chan', 'Thanh đòn', 5, 'Lưng tựa ghế, đẩy hông lên cao, siết mông ở đỉnh.'),

  // ---------- Vai ----------
  b('Đẩy vai (Overhead Press)', 'vai', 'Thanh đòn', 5, 'Đứng hoặc ngồi, đẩy thanh đòn từ vai lên thẳng qua đầu.'),
  b('Đẩy vai tạ đơn', 'vai', 'Tạ đơn', 5, 'Hai tạ đơn ngang vai, đẩy lên qua đầu.'),
  b('Nâng tạ ngang vai (Lateral Raise)', 'vai', 'Tạ đơn', 4, 'Nâng hai tay sang ngang tới ngang vai, khuỷu hơi cong.'),
  b('Nâng tạ trước mặt', 'vai', 'Tạ đơn', 4, 'Nâng tạ thẳng ra trước tới ngang vai.'),
  b('Bay ngược (Reverse Fly)', 'vai', 'Tạ đơn', 4, 'Gập người, mở hai tay sang ngang, tập vai sau.'),

  // ---------- Tay ----------
  b('Cuốn tay trước (Bicep Curl)', 'tay', 'Tạ đơn', 3.5, 'Khuỷu tay cố định sát thân, cuốn tạ lên, hạ chậm.'),
  b('Cuốn tay thanh đòn', 'tay', 'Thanh đòn', 3.5, 'Nắm thanh rộng bằng vai, cuốn lên, không đưa người theo.'),
  b('Cuốn búa (Hammer Curl)', 'tay', 'Tạ đơn', 3.5, 'Lòng bàn tay hướng vào nhau suốt động tác.'),
  b('Duỗi tay sau cáp', 'tay', 'Máy cáp', 3.5, 'Khuỷu tay cố định, duỗi thẳng cẳng tay xuống.'),
  b('Duỗi tay sau qua đầu', 'tay', 'Tạ đơn', 3.5, 'Cầm một tạ bằng hai tay, hạ sau đầu rồi duỗi thẳng.'),
  b('Dip tay sau', 'tay', 'Ghế', 4, 'Chống tay lên ghế sau lưng, hạ người xuống rồi đẩy lên.'),

  // ---------- Bụng ----------
  b('Gập bụng (Crunch)', 'bung', 'Không', 3, 'Nằm ngửa, gối co, nâng vai khỏi sàn, không kéo cổ.'),
  b('Plank', 'bung', 'Không', 3, 'Chống khuỷu tay, thân thẳng một đường từ đầu tới gót, siết bụng.'),
  b('Nâng chân nằm', 'bung', 'Không', 3, 'Nằm ngửa, nâng hai chân thẳng lên 90° rồi hạ chậm không chạm sàn.'),
  b('Russian Twist', 'bung', 'Tạ đơn', 3.5, 'Ngồi ngả người, xoay thân sang hai bên.'),
  b('Mountain Climber', 'bung', 'Không', 6, 'Tư thế hít đất, thay nhau kéo gối về ngực nhanh.'),

  // ---------- Cardio ----------
  b('Đi bộ nhanh', 'cardio', 'Không', 4.3, 'Tốc độ khoảng 5–6 km/h.', true),
  b('Chạy bộ', 'cardio', 'Không', 8, 'Tốc độ khoảng 8 km/h.', true),
  b('Chạy nhanh', 'cardio', 'Không', 11.5, 'Tốc độ khoảng 11 km/h.', true),
  b('Đạp xe', 'cardio', 'Xe đạp', 7.5, 'Cường độ vừa, khoảng 19–22 km/h.', true),
  b('Bơi lội', 'cardio', 'Hồ bơi', 7, 'Bơi tự do cường độ vừa.', true),
  b('Nhảy dây', 'cardio', 'Dây nhảy', 11, 'Nhịp trung bình 100–120 lần/phút.', true),
  b('Máy chạy bộ', 'cardio', 'Máy', 8, 'Chạy trên máy, độ dốc 0–2%.', true),
  b('Máy elliptical', 'cardio', 'Máy', 5, 'Cường độ vừa.', true),
  b('Leo cầu thang', 'cardio', 'Không', 8, 'Leo liên tục không nghỉ.', true),
  b('Đá bóng', 'cardio', 'Không', 7, 'Đá sân nhỏ hoặc sân lớn.', true),
  b('Cầu lông', 'cardio', 'Vợt', 5.5, 'Đánh đơn hoặc đôi cường độ vừa.', true),
  b('Yoga', 'cardio', 'Thảm', 3, 'Các bài tư thế cơ bản.', true),
  b('HIIT', 'cardio', 'Không', 10, 'Xen kẽ gắng sức tối đa và nghỉ ngắn.', true),

  // ---------- Toàn thân ----------
  b('Burpee', 'toan_than', 'Không', 8, 'Squat xuống, bật ra tư thế hít đất, thu chân, bật nhảy lên.'),
  b('Kettlebell Swing', 'toan_than', 'Tạ ấm', 6, 'Đẩy hông về trước để vung tạ lên ngang ngực, không dùng tay nhấc.'),
  b('Clean and Press', 'toan_than', 'Thanh đòn', 6, 'Kéo thanh từ sàn lên vai rồi đẩy qua đầu.'),
  b('Farmer Walk', 'toan_than', 'Tạ đơn', 5, 'Cầm hai tạ nặng đi thẳng lưng một quãng.'),
]
