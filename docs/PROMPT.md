# Đặc tả yêu cầu — Ứng dụng theo dõi Calo, Dinh dưỡng & Sức khỏe

> Đây là bản viết lại chi tiết từ yêu cầu gốc:
> *"Tôi muốn tạo ra một ứng dụng đo lường calo, dinh dưỡng, cân nặng, sức khỏe, lịch tập. Đo bằng cách chụp ảnh đồ ăn, cung cấp thông tin app yêu cầu, theo dõi sức khỏe. App dùng được lâu dài, dữ liệu phải được ghi lại."*
>
> Dùng file này làm prompt/đặc tả đầu vào cho việc xây dựng app. Các mục đánh dấu **[CẦN CHỐT]** là quyết định cần bạn xác nhận trước khi code.

---

## 1. Tổng quan sản phẩm

**Tên tạm:** Sức Khỏe App

**Một câu mô tả:** Ứng dụng cá nhân giúp người Việt ghi lại bữa ăn bằng cách chụp ảnh, tự động ước lượng calo và dinh dưỡng, đồng thời theo dõi cân nặng, các chỉ số sức khỏe và lịch tập luyện trong nhiều năm mà không mất dữ liệu.

**Người dùng mục tiêu:**
- Người muốn giảm cân / tăng cân / giữ cân có kiểm soát.
- Người tập gym cần theo dõi macro (đạm/tinh bột/béo) và lịch tập.
- Người có nhu cầu theo dõi sức khỏe dài hạn (huyết áp, đường huyết, cân nặng).

**Nguyên tắc thiết kế (bắt buộc tuân thủ):**
1. **Ghi log phải nhanh** — ghi một bữa ăn không quá 3 chạm nếu là món đã ăn trước đó.
2. **Offline-first** — mở app không có mạng vẫn xem và nhập được dữ liệu; chỉ chức năng nhận diện ảnh cần mạng.
3. **Dữ liệu là của người dùng** — không bao giờ xóa dữ liệu lịch sử, luôn có đường xuất dữ liệu ra file.
4. **Ước lượng trung thực** — AI nhận diện ảnh phải hiển thị rõ độ tin cậy và cho phép người dùng sửa, không giả vờ chính xác tuyệt đối.
5. **Tiếng Việt là ngôn ngữ chính**, ưu tiên món ăn Việt Nam trong cơ sở dữ liệu.

---

## 2. Nền tảng & công nghệ **[CẦN CHỐT]**

Chọn 1 trong 3 hướng:

| | Hướng A — Web app (PWA) | Hướng B — Mobile React Native | Hướng C — Native Android |
|---|---|---|---|
| Công nghệ | Next.js/React + TypeScript | React Native + Expo | Kotlin + Jetpack Compose |
| Chụp ảnh | Camera API trình duyệt | Camera thiết bị (tốt) | Camera thiết bị (tốt nhất) |
| Cài lên điện thoại | Thêm vào màn hình chính | Có, file APK/store | Có, file APK/store |
| Tốc độ ra bản chạy được | Nhanh nhất | Trung bình | Chậm nhất |
| Đề xuất | ✅ Nên bắt đầu ở đây | Khi cần app thật | Khi cần tối ưu sâu |

**Khuyến nghị:** bắt đầu bằng **Hướng A (PWA)** — chạy được trên cả điện thoại lẫn máy tính, dùng camera được, cài lên màn hình chính như app thật, và có thể chuyển sang Hướng B sau mà giữ nguyên logic.

**Stack đề xuất cho Hướng A:**
- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Lưu trữ cục bộ: IndexedDB (qua Dexie.js) — chạy offline
- Lưu trữ đám mây: **[CẦN CHỐT]** Supabase (Postgres + Auth + Storage) hoặc chỉ local + export file
- Nhận diện ảnh: Claude API (model `claude-opus-5` hoặc `claude-sonnet-5` cho rẻ hơn) với vision
- Biểu đồ: Recharts
- PWA: next-pwa (service worker, offline, cài đặt được)

---

## 3. Onboarding — thông tin app hỏi người dùng lần đầu

Chia làm 4 bước, có thể bỏ qua và điền sau. Mỗi trường ghi rõ kiểu dữ liệu và ràng buộc:

**Bước 1 — Thông tin cơ bản**
- Họ tên hoặc biệt danh (text)
- Giới tính (nam / nữ / khác) — dùng cho công thức BMR
- Ngày sinh (date) — suy ra tuổi
- Chiều cao (cm, 100–250)
- Cân nặng hiện tại (kg, 25–300)

**Bước 2 — Mức vận động**
- Ít vận động, ngồi nhiều (hệ số 1.2)
- Vận động nhẹ, tập 1–3 buổi/tuần (1.375)
- Vận động vừa, tập 3–5 buổi/tuần (1.55)
- Vận động nhiều, tập 6–7 buổi/tuần (1.725)
- Vận động rất nhiều, lao động nặng (1.9)

**Bước 3 — Mục tiêu**
- Mục tiêu: giảm cân / giữ cân / tăng cân / tăng cơ
- Cân nặng mục tiêu (kg)
- Tốc độ mong muốn: 0.25 / 0.5 / 0.75 / 1.0 kg mỗi tuần
  - App phải **cảnh báo** nếu tốc độ > 1 kg/tuần hoặc calo mục tiêu < 1200 kcal (nữ) / 1500 kcal (nam)
- Ngày dự kiến đạt mục tiêu (app tự tính, hiển thị lại cho người dùng)

**Bước 4 — Tùy chọn thêm (có thể bỏ qua)**
- Chế độ ăn: bình thường / chay / thuần chay / low-carb / keto / eat-clean
- Dị ứng, thực phẩm cần tránh (danh sách tag)
- Bệnh nền cần lưu ý: tiểu đường, cao huyết áp, mỡ máu, gout... (ảnh hưởng tới cảnh báo và chỉ số muốn theo dõi thêm)
- Số đo cơ thể ban đầu: vòng eo, vòng mông, vòng ngực, vòng tay, vòng đùi (cm)
- Tỷ lệ mỡ cơ thể (%) nếu biết

**Đầu ra sau onboarding:** app tính và hiển thị bảng tóm tắt gồm BMR, TDEE, calo mục tiêu/ngày, macro mục tiêu/ngày, nước/ngày, và cho phép người dùng chỉnh tay từng con số.

---

## 4. Công thức tính toán (quy định rõ, không tự chế)

**BMR — Mifflin-St Jeor:**
- Nam: `10 × cân nặng(kg) + 6.25 × chiều cao(cm) − 5 × tuổi + 5`
- Nữ: `10 × cân nặng(kg) + 6.25 × chiều cao(cm) − 5 × tuổi − 161`

**TDEE:** `BMR × hệ số vận động`

**Calo mục tiêu/ngày:** `TDEE − (tốc độ kg/tuần × 7700 / 7)` khi giảm cân, `TDEE + (...)` khi tăng cân.
Chặn dưới: không bao giờ đề xuất dưới 1200 kcal (nữ) / 1500 kcal (nam) — nếu công thức ra thấp hơn thì kẹp lại và hiện cảnh báo.

**Macro mặc định (cho phép chỉnh):**
- Giảm cân: đạm 30% / tinh bột 40% / béo 30%
- Giữ cân: 25 / 45 / 30
- Tăng cơ: 30 / 45 / 25
- Quy đổi: 1g đạm = 4 kcal, 1g tinh bột = 4 kcal, 1g béo = 9 kcal, 1g cồn = 7 kcal

**Nước/ngày:** `35ml × cân nặng(kg)`, cộng thêm 500ml cho mỗi giờ tập.

**BMI:** `cân nặng(kg) / (chiều cao(m))²` — phân loại theo chuẩn châu Á (WHO Asia-Pacific): <18.5 thiếu cân, 18.5–22.9 bình thường, 23–24.9 thừa cân, ≥25 béo phì.

**Calo còn lại trong ngày:** `calo mục tiêu − calo đã ăn + calo đốt do tập luyện`
(có tùy chọn bật/tắt việc cộng lại calo tập luyện, mặc định **tắt** vì dễ ước lượng thừa).

---

## 5. Chức năng cốt lõi: Chụp ảnh đồ ăn → ước lượng dinh dưỡng

Đây là tính năng quan trọng nhất, cần làm kỹ.

**Luồng người dùng:**
1. Nhấn nút camera nổi ở giữa thanh điều hướng.
2. Chụp ảnh hoặc chọn từ thư viện (cho phép chọn nhiều ảnh của cùng một bữa).
3. Ảnh được nén xuống ~1024px cạnh dài, chất lượng 80% trước khi gửi.
4. Hiện màn hình "Đang phân tích..." với skeleton, tối đa 15 giây, có nút hủy.
5. Trả về danh sách món nhận diện được, mỗi món gồm:
   - Tên món (tiếng Việt)
   - Khẩu phần ước lượng + đơn vị (VD: "1 tô vừa", "150 g", "2 cái")
   - Calo, đạm, tinh bột, béo, chất xơ, đường, natri
   - **Độ tin cậy**: cao / trung bình / thấp (hiển thị bằng màu)
6. Người dùng có thể: sửa tên món, sửa khối lượng (slider + nhập số), xóa món, thêm món thủ công.
7. Chọn loại bữa: sáng / trưa / tối / phụ. Chọn thời điểm (mặc định giờ hiện tại).
8. Nhấn "Lưu" → ghi vào nhật ký, ảnh được lưu kèm.

**Yêu cầu kỹ thuật cho phần AI:**
- Gọi Claude API với ảnh + prompt yêu cầu trả về **JSON có schema cố định** (dùng tool use / structured output để đảm bảo parse được).
- Prompt phải nêu rõ: ưu tiên nhận diện món ăn Việt Nam (phở, bún bò, cơm tấm, bánh mì, chè...), ước lượng khẩu phần dựa trên vật tham chiếu trong ảnh (bát, đũa, tay), và **bắt buộc trả về khoảng tin cậy thay vì con số giả chính xác**.
- Nếu API lỗi/hết mạng: lưu ảnh vào hàng đợi, cho phép nhập tay ngay, và tự phân tích lại khi có mạng.
- Cache kết quả theo hash ảnh để không gọi lại API cho cùng một ảnh.
- Hiển thị rõ dòng chữ: *"Số liệu là ước lượng của AI, có thể sai lệch 20–30%. Hãy sửa lại nếu bạn biết chính xác hơn."*

**Các cách nhập bữa ăn khác (bắt buộc có, vì ảnh không phải lúc nào cũng tiện):**
- Tìm kiếm trong cơ sở dữ liệu món ăn có sẵn.
- Chọn từ "Món ăn thường xuyên" (tự sinh từ lịch sử, sắp theo tần suất).
- Chép lại bữa ăn của một ngày trước đó ("Ăn lại như hôm qua").
- Tạo "Món của tôi": tự nhập tên + dinh dưỡng, dùng lại nhiều lần.
- Tạo "Công thức": gộp nhiều nguyên liệu thành 1 món, chia theo số phần.
- Quét mã vạch sản phẩm đóng gói **[CẦN CHỐT — có cần không?]**

**Cơ sở dữ liệu món ăn:**
- Tự dựng bảng món Việt Nam (tối thiểu 300 món phổ biến) với dinh dưỡng trên 100g và trên khẩu phần chuẩn.
- Nguồn tham khảo: Bảng thành phần thực phẩm Việt Nam (Viện Dinh dưỡng Quốc gia), USDA FoodData Central.
- Mỗi món có: tên, tên khác/từ khóa tìm kiếm, nhóm món, dinh dưỡng, đơn vị khẩu phần thông dụng.

---

## 6. Nhật ký ăn uống

- Màn hình theo ngày, vuốt trái/phải để đổi ngày, có lịch để nhảy nhanh.
- Nhóm theo bữa: sáng / trưa / tối / phụ, mỗi bữa hiện tổng calo.
- Vòng tròn tiến độ calo ở đầu trang: đã ăn / mục tiêu / còn lại.
- 3 thanh macro: đạm, tinh bột, béo — hiện gam đã ăn / mục tiêu.
- Nhấn vào món để sửa hoặc xóa; vuốt để xóa nhanh (có Hoàn tác).
- Xem lại ảnh đã chụp của bữa ăn đó.
- Ghi chú tự do cho từng ngày (VD: "hôm nay đi ăn cưới").

---

## 7. Theo dõi cân nặng & số đo cơ thể

- Nhập cân nặng theo ngày (chỉ giữ 1 giá trị/ngày, ghi đè nếu nhập lại).
- Biểu đồ đường theo thời gian: 7 ngày / 1 tháng / 3 tháng / 1 năm / tất cả.
- **Đường trung bình động 7 ngày** vẽ đè lên để làm mượt dao động nước — điều này quan trọng, tránh làm người dùng nản.
- Hiển thị: thay đổi tuần này, thay đổi tổng cộng, còn bao nhiêu tới mục tiêu, tốc độ trung bình kg/tuần, dự báo ngày đạt mục tiêu.
- Số đo cơ thể (eo, mông, ngực, tay, đùi) — nhập theo tuần, có biểu đồ riêng.
- Tỷ lệ mỡ cơ thể (%) nếu người dùng có cân thông minh.
- **Ảnh tiến trình**: chụp ảnh cơ thể theo mốc thời gian, xem so sánh trước/sau cạnh nhau. Ảnh này lưu cục bộ, không upload trừ khi người dùng bật đồng bộ.

---

## 8. Theo dõi sức khỏe tổng quát

Mỗi chỉ số là một "tracker" bật/tắt được trong cài đặt, người dùng chọn cái nào mình quan tâm:

| Chỉ số | Đơn vị | Cách nhập | Cảnh báo |
|---|---|---|---|
| Nước uống | ml | Nút nhanh +100/+250/+500 | Nhắc nếu chưa đủ vào cuối ngày |
| Giấc ngủ | giờ + chất lượng 1–5 | Giờ đi ngủ / giờ dậy | < 6 giờ liên tục 3 ngày |
| Số bước chân | bước | Nhập tay hoặc đồng bộ **[CẦN CHỐT]** | — |
| Nhịp tim nghỉ | bpm | Nhập tay | < 40 hoặc > 100 |
| Huyết áp | mmHg (tâm thu/tâm trương) | Nhập tay | ≥ 140/90 hoặc ≤ 90/60 |
| Đường huyết | mmol/L hoặc mg/dL | Nhập tay + ghi rõ đói/no | Ngoài khoảng an toàn |
| Tâm trạng | 1–5 + tag cảm xúc | Chọn icon | — |
| Chu kỳ kinh nguyệt (nữ) | ngày | Đánh dấu lịch | — |

**Lưu ý bắt buộc:** mọi cảnh báo phải kèm câu *"Đây không phải chẩn đoán y khoa. Hãy gặp bác sĩ nếu bạn lo lắng."* App không được đưa ra lời khuyên điều trị.

---

## 9. Lịch tập luyện

**Thư viện bài tập:**
- Tối thiểu 100 bài tập, mỗi bài có: tên, nhóm cơ chính, dụng cụ cần, mô tả cách thực hiện, mức MET để tính calo đốt.
- Phân loại: ngực, lưng, chân, vai, tay, bụng, cardio, giãn cơ.

**Tạo lịch tập:**
- Tạo "Buổi tập mẫu" (VD: "Push Day") gồm danh sách bài + số set + số rep + tạ dự kiến.
- Gán buổi tập vào các ngày trong tuần → thành lịch tập lặp lại hàng tuần.
- Lịch hiển thị dạng tuần, biết hôm nay tập gì, đã tập chưa.

**Ghi log buổi tập:**
- Bắt đầu buổi tập → hiện danh sách bài, tick từng set, nhập tạ × rep thực tế.
- Bộ đếm nghỉ giữa set (mặc định 90 giây, chỉnh được, có rung/chuông).
- Hiển thị số liệu buổi trước của cùng bài tập để biết cần nâng bao nhiêu (progressive overload).
- Tính tổng volume (tạ × rep × set) và calo đốt ước lượng.
- Với cardio: nhập thời gian + cường độ, tính calo theo MET × cân nặng × giờ.

**Thống kê tập luyện:**
- Số buổi tập theo tuần/tháng, chuỗi ngày tập liên tiếp.
- Biểu đồ tiến bộ theo từng bài tập (tạ nặng nhất, 1RM ước lượng, tổng volume).
- Bản đồ nhiệt nhóm cơ: tuần này tập nhóm nào nhiều/ít.

---

## 10. Báo cáo & thống kê

- **Tuần:** calo trung bình/ngày, macro trung bình, số ngày đạt mục tiêu, thay đổi cân nặng, số buổi tập.
- **Tháng:** biểu đồ cột calo theo ngày, xu hướng cân nặng, tổng kết tập luyện.
- **Năm:** biểu đồ cân nặng cả năm, biểu đồ dạng lịch nhiệt (ngày nào ghi log đầy đủ).
- **Phân tích liên hệ:** so sánh tuần ăn nhiều calo với thay đổi cân nặng — chỉ mô tả tương quan, không kết luận nhân quả.
- Chuỗi ngày ghi log liên tiếp (streak) + huy hiệu thành tích, nhưng **không được** làm người dùng thấy tội lỗi khi bỏ lỡ.

---

## 11. Dữ liệu & lưu trữ lâu dài (yêu cầu bắt buộc)

Đây là yêu cầu bạn nhấn mạnh — "app dùng được lâu dài, dữ liệu phải được ghi lại". Cụ thể hóa như sau:

1. **Không mất dữ liệu khi đóng app / tắt máy** — mọi thao tác ghi thẳng xuống IndexedDB, không giữ trong bộ nhớ tạm.
2. **Không giới hạn thời gian** — dữ liệu 5 năm trước vẫn xem được; màn hình lịch sử phải phân trang, không tải hết một lúc.
3. **Xuất dữ liệu** — nút "Xuất toàn bộ dữ liệu" ra file JSON (đầy đủ) và CSV (cho Excel). Xuất được cả ảnh dưới dạng file nén.
4. **Nhập lại dữ liệu** — nhập từ file JSON đã xuất, có kiểm tra phiên bản và trộn dữ liệu không ghi đè nhầm.
5. **Sao lưu tự động** — nhắc người dùng xuất file mỗi tháng nếu chưa bật đồng bộ đám mây.
6. **Đồng bộ nhiều thiết bị [CẦN CHỐT]** — nếu bật: đăng nhập bằng email, dữ liệu đẩy lên Supabase, giải quyết xung đột theo nguyên tắc "bản sửa sau thắng" ở mức từng bản ghi.
7. **Di chuyển phiên bản (migration)** — mỗi thay đổi cấu trúc dữ liệu phải có script nâng cấp, đánh số phiên bản schema, và **không bao giờ xóa cột cũ** trong 2 phiên bản kế tiếp.
8. **Xóa mềm** — bản ghi bị xóa gắn cờ `deleted_at` thay vì xóa hẳn, giữ 30 ngày để khôi phục.

**Sơ đồ dữ liệu tối thiểu:**

```
users(id, ten, gioi_tinh, ngay_sinh, chieu_cao_cm, muc_van_dong,
      muc_tieu, can_nang_muc_tieu, toc_do_kg_tuan, che_do_an,
      calo_muc_tieu, macro_dam, macro_tinhbot, macro_beo, tao_luc, sua_luc)

thuc_pham(id, ten, ten_khac[], nhom, calo_100g, dam_100g, tinhbot_100g,
          beo_100g, chatxo_100g, duong_100g, natri_100g,
          khau_phan_chuan[], nguon, la_cua_nguoi_dung)

cong_thuc(id, ten, so_phan, nguyen_lieu[{thuc_pham_id, khoi_luong}])

nhat_ky_an(id, user_id, ngay, loai_bua, thoi_diem, thuc_pham_id,
           ten_hien_thi, khoi_luong_g, calo, dam, tinhbot, beo,
           chatxo, duong, natri, anh_id, do_tin_cay, nguon_nhap,
           ghi_chu, tao_luc, sua_luc, deleted_at)

anh_bua_an(id, user_id, duong_dan_local, url_cloud, hash, kich_thuoc,
           ket_qua_ai_json, chup_luc)

can_nang(id, user_id, ngay, kg, ty_le_mo, ghi_chu, tao_luc)

so_do_co_the(id, user_id, ngay, eo, mong, nguc, tay, dui)

anh_tien_trinh(id, user_id, ngay, duong_dan, goc_chup)

chi_so_suc_khoe(id, user_id, ngay, thoi_diem, loai, gia_tri, gia_tri_phu,
                don_vi, ghi_chu)   -- loai: nuoc|ngu|buoc|nhip_tim|huyet_ap|duong_huyet|tam_trang

bai_tap(id, ten, nhom_co, dung_cu, mo_ta, met, la_cua_nguoi_dung)

buoi_tap_mau(id, user_id, ten, ghi_chu, bai_tap[{bai_tap_id, set, rep, ta}])

lich_tap(id, user_id, thu_trong_tuan, buoi_tap_mau_id, bat_dau_tu)

nhat_ky_tap(id, user_id, ngay, buoi_tap_mau_id, bat_dau, ket_thuc,
            tong_volume, calo_dot, cam_nhan, ghi_chu)

set_tap(id, nhat_ky_tap_id, bai_tap_id, thu_tu_set, rep, ta_kg,
        thoi_gian_giay, hoan_thanh)

muc_tieu_lich_su(id, user_id, ap_dung_tu, calo, dam, tinhbot, beo)
   -- lưu lịch sử mục tiêu để báo cáo cũ vẫn đúng khi người dùng đổi mục tiêu
```

---

## 12. Nhắc nhở & thông báo

- Nhắc ghi bữa sáng/trưa/tối (giờ tùy chỉnh, tắt được).
- Nhắc uống nước theo khoảng thời gian.
- Nhắc cân vào buổi sáng (mặc định thứ Hai hàng tuần).
- Nhắc buổi tập theo lịch.
- Báo cáo tổng kết tuần vào tối Chủ nhật.
- Tất cả thông báo **mặc định tắt**, người dùng tự bật cái mình muốn.

---

## 13. Danh sách màn hình

1. **Onboarding** (4 bước) — chỉ chạy lần đầu
2. **Trang chủ / Hôm nay** — vòng calo, macro, các bữa đã ăn, nước, tập luyện hôm nay
3. **Chụp & phân tích ảnh** — camera → kết quả → xác nhận
4. **Nhật ký ăn** — theo ngày, chỉnh sửa
5. **Tìm & thêm món** — tìm kiếm, món thường ăn, món của tôi, công thức
6. **Cân nặng & cơ thể** — biểu đồ, nhập số đo, ảnh tiến trình
7. **Sức khỏe** — các chỉ số bật/tắt được
8. **Tập luyện** — lịch tuần, thư viện bài tập, ghi log buổi tập
9. **Thống kê** — tuần/tháng/năm
10. **Cài đặt** — hồ sơ, mục tiêu, đơn vị, thông báo, xuất/nhập dữ liệu, đồng bộ

**Điều hướng:** thanh dưới 5 mục — Hôm nay | Nhật ký | **Camera (nút giữa nổi)** | Tập luyện | Thống kê.

---

## 14. Yêu cầu phi chức năng

- **Hiệu năng:** mở app tới màn hình chính < 2 giây; biểu đồ 1 năm dữ liệu không giật.
- **Offline:** mọi màn hình trừ phân tích ảnh phải hoạt động không mạng.
- **Bảo mật:** dữ liệu sức khỏe là nhạy cảm — nếu có đồng bộ đám mây thì bắt buộc HTTPS, bật Row Level Security, không log dữ liệu người dùng ra console/server log. Có tùy chọn khóa app bằng vân tay/PIN.
- **Riêng tư:** không gửi dữ liệu cho bên thứ ba; ảnh chỉ gửi lên API nhận diện và không lưu lại phía nhà cung cấp quá thời gian xử lý. Ghi rõ điều này trong app.
- **Khả năng tiếp cận:** cỡ chữ đọc được, độ tương phản đạt WCAG AA, hỗ trợ chế độ tối.
- **Ngôn ngữ:** tiếng Việt mặc định, kiến trúc sẵn sàng thêm tiếng Anh (tách chuỗi ra file i18n).
- **Đơn vị:** kg/cm là mặc định, hỗ trợ lbs/ft cho tương lai.
- **Kiểm thử:** unit test cho toàn bộ hàm tính toán (BMR, TDEE, macro, volume, MET) — đây là phần sai là hỏng cả app.

---

## 15. Lộ trình phát triển

**Giai đoạn 1 — MVP (bản chạy được đầu tiên)**
- Onboarding + tính BMR/TDEE/macro
- Chụp ảnh → nhận diện → lưu bữa ăn
- Nhật ký ăn theo ngày + vòng tiến độ calo
- Ghi cân nặng + biểu đồ
- Lưu toàn bộ vào IndexedDB, xuất/nhập JSON
- PWA cài được lên điện thoại

**Giai đoạn 2 — Đầy đủ chức năng**
- Cơ sở dữ liệu món Việt + tìm kiếm + món thường ăn + công thức
- Module tập luyện đầy đủ (lịch, ghi log, bộ đếm nghỉ)
- Các chỉ số sức khỏe (nước, ngủ, huyết áp, đường huyết)
- Thống kê tuần/tháng/năm
- Thông báo nhắc nhở

**Giai đoạn 3 — Dài hạn**
- Đăng nhập + đồng bộ đám mây nhiều thiết bị
- Ảnh tiến trình so sánh trước/sau
- Quét mã vạch
- Đồng bộ Google Fit / Apple Health
- Gợi ý bữa ăn dựa trên macro còn thiếu trong ngày

---

## 16. Tiêu chí nghiệm thu

App được coi là hoàn thành giai đoạn 1 khi:
- [ ] Người dùng mới hoàn tất onboarding và nhận được calo + macro mục tiêu đúng công thức.
- [ ] Chụp ảnh một bữa cơm Việt Nam → nhận được ít nhất tên món và ước lượng calo, sửa được, lưu được.
- [ ] Đóng hoàn toàn app, mở lại → toàn bộ dữ liệu còn nguyên.
- [ ] Tắt mạng → vẫn xem được nhật ký, nhập tay được bữa ăn và cân nặng.
- [ ] Xuất file JSON, xóa toàn bộ dữ liệu, nhập lại file → dữ liệu khôi phục đúng 100%.
- [ ] Biểu đồ cân nặng hiển thị đúng với đường trung bình động 7 ngày.
- [ ] Cài lên màn hình chính điện thoại và chạy như một app.
- [ ] Toàn bộ hàm tính toán có unit test và test pass.

---

## 17. Các quyết định cần bạn chốt

1. **Nền tảng:** Web app PWA (khuyến nghị) / React Native / Android native?
2. **Lưu trữ:** chỉ trên máy + xuất file (đơn giản, miễn phí, riêng tư) hay có tài khoản + đồng bộ đám mây (dùng nhiều thiết bị, tốn setup)?
3. **API nhận diện ảnh:** bạn có sẵn Anthropic API key chưa? Nếu chưa có, cần một phương án nhập tay hoàn chỉnh trước.
4. **Người dùng:** chỉ mình bạn dùng, hay định cho nhiều người dùng / phát hành?
5. **Quét mã vạch** có cần không?
6. **Đồng bộ Google Fit / Apple Health** có cần không, hay nhập tay số bước là đủ?
