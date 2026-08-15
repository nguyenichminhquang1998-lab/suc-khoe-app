# Sức Khỏe App

Ứng dụng theo dõi calo, dinh dưỡng, cân nặng, sức khỏe và lịch tập luyện — chạy hoàn toàn trên máy bạn, không có máy chủ, không tài khoản, không gửi dữ liệu đi đâu.

Cài lên màn hình chính điện thoại như một app thật (PWA), mở được cả khi không có mạng.

---

## Chức năng

**Ăn uống**
- Chụp ảnh món ăn → AI đọc ảnh và ước lượng calo, đạm, tinh bột, béo (cần API key, xem bên dưới)
- Tìm trong cơ sở dữ liệu ~130 món Việt Nam, gõ có dấu hay không dấu đều ra
- Món thường ăn tự sinh từ lịch sử — thêm chỉ một chạm
- Quét mã vạch sản phẩm đóng gói (Open Food Facts), sản phẩm đã quét được nhớ lại cho lần sau
- Nhập tay và lưu thành món riêng
- Chép lại toàn bộ bữa ăn của hôm trước

**Cân nặng & cơ thể**
- Biểu đồ theo tuần/tháng/quý/năm, có đường trung bình động 7 ngày để lọc nhiễu do nước
- Tốc độ thay đổi tính bằng hồi quy tuyến tính, dự báo ngày đạt mục tiêu
- Số đo eo, mông, ngực, tay, đùi

**Sức khỏe**
- Giấc ngủ, số bước, nhịp tim nghỉ, huyết áp, đường huyết, tâm trạng — bật/tắt từng chỉ số
- Cảnh báo khi giá trị nằm ngoài khoảng thông thường (không phải chẩn đoán y khoa)
- Nước uống với nút thêm nhanh

**Tập luyện**
- Thư viện 50+ bài tập kèm nhóm cơ, dụng cụ, cách thực hiện
- Tạo buổi tập mẫu, gán vào các ngày trong tuần
- Ghi từng set với đồng hồ nghỉ, hiển thị số liệu buổi trước để biết cần nâng bao nhiêu
- 1RM ước lượng, tổng volume, calo đốt theo MET

**Thống kê**
- Calo theo ngày, macro trung bình, cân bằng nhóm cơ, lịch nhiệt 12 tuần

---

## Chạy thử

```bash
npm install
npm run dev
```

Mở địa chỉ hiện ra trong terminal. Trên điện thoại, mở cùng địa chỉ đó rồi chọn **Thêm vào màn hình chính**.

Các lệnh khác:

```bash
npm test         # chạy 102 unit test
npm run build    # build ra thư mục dist/
npm run preview  # xem thử bản build
npm run lint     # kiểm tra kiểu TypeScript
```

## Đưa lên mạng để dùng trên điện thoại

App là static site nên host ở đâu cũng được (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

Với GitHub Pages, build kèm đường dẫn con:

```bash
BASE_PATH=/suc-khoe-app/ npm run build
```

rồi đẩy thư mục `dist/` lên nhánh `gh-pages`.

---

## Nhận diện ảnh bằng AI

Phần này **không bắt buộc**. Không có key thì mọi chức năng khác vẫn chạy đầy đủ, chỉ là bạn nhập món ăn bằng tay hoặc tìm trong danh sách.

Để bật:

1. Tạo tài khoản tại [console.anthropic.com](https://console.anthropic.com) và nạp tiền
2. Tạo một API key
3. Mở app → **Cài đặt → Nhận diện ảnh** → dán key vào

Key được lưu trong IndexedDB trên máy bạn và chỉ gửi tới `api.anthropic.com`. Vì app không có máy chủ riêng, trình duyệt gọi thẳng API — đây là đánh đổi có ý thức cho một app cá nhân không backend.

Chi phí tính theo lượt dùng. Chọn model trong Cài đặt: Haiku rẻ nhất, Sonnet cân bằng, Opus chính xác nhất.

**Số liệu AI trả về là ước lượng, có thể lệch 20–30%.** App luôn hiển thị mức độ tin cậy của từng món và cho bạn sửa trước khi lưu — con số bạn sửa mới là con số được ghi lại.

---

## Dữ liệu của bạn

Toàn bộ dữ liệu nằm trong IndexedDB của trình duyệt trên máy này. Không có bản sao trên mây.

**Điều đó có nghĩa là:** mất máy, xóa dữ liệu trình duyệt, hoặc gỡ app là mất hết.

App có vài lớp bảo vệ:

- Xin trình duyệt quyền *persistent storage* để không tự xóa khi máy thiếu chỗ (Cài đặt → Dữ liệu của bạn)
- **Xuất toàn bộ ra file JSON** (có tùy chọn kèm ảnh) — hãy làm mỗi tháng và cất vào Google Drive hoặc tự gửi email cho mình
- Xuất CSV nhật ký ăn và cân nặng để mở bằng Excel
- **Nhập lại** với hai chế độ: *trộn* (giữ dữ liệu đang có, chỉ thêm phần thiếu — dùng khi gộp từ máy khác) và *thay thế* (xóa hết rồi nạp file vào — dùng khi khôi phục sau khi mất máy)
- Xóa mềm: bản ghi bị xóa còn giữ 30 ngày, xóa nhầm thì bấm Hoàn tác

Vòng **xuất → xóa sạch → nhập lại khôi phục nguyên vẹn** có unit test kiểm chứng (`src/db/saoluu.test.ts`).

---

## Công nghệ

| | |
|---|---|
| Giao diện | React 18 + TypeScript + Tailwind CSS |
| Build | Vite 6 + vite-plugin-pwa |
| Lưu trữ | IndexedDB qua Dexie 4 |
| Biểu đồ | Recharts |
| Mã vạch | ZXing + Open Food Facts API |
| Nhận diện ảnh | Claude API (vision + tool use) |

Không có backend, không có phân tích hành vi, không có bên thứ ba nào ngoài hai API nói trên và chỉ khi bạn chủ động dùng chúng.

---

## Cấu trúc mã nguồn

```
src/
  lib/tinhtoan.ts     Toàn bộ công thức: BMR, TDEE, macro, BMI, MET, 1RM,
                      trung bình động, hồi quy xu hướng cân nặng
  lib/nhandienanh.ts  Nén ảnh, gọi Claude API, xử lý lỗi
  lib/mavach.ts       Quét và tra cứu mã vạch
  db/db.ts            Schema Dexie, xóa mềm, dọn dẹp
  db/saoluu.ts        Xuất/nhập JSON và CSV
  db/truyvan.ts       Truy vấn dùng chung cho các màn hình
  db/seed.ts          Nạp dữ liệu mặc định
  data/               Cơ sở dữ liệu món ăn và bài tập
  screens/            10 màn hình
  components/chung.tsx  Thành phần giao diện dùng lại
docs/PROMPT.md        Bản đặc tả đầy đủ của sản phẩm
```

Mọi hàm tính toán đều có unit test — đó là phần sai thì cả app sai theo.

---

## Lưu ý

App này ghi lại số liệu bạn nhập và tính toán theo các công thức tiêu chuẩn. Nó **không chẩn đoán bệnh và không thay thế bác sĩ**. Nếu có chỉ số bất thường lặp lại, hãy đi khám.

Số liệu dinh dưỡng của món ăn là giá trị trung bình tham khảo từ Bảng thành phần thực phẩm Việt Nam và USDA — cách nấu của mỗi nhà mỗi khác, bạn nên sửa lại cho khớp với thực tế của mình.
