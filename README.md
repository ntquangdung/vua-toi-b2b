# Hộp quà Vua Tỏi

Landing page tĩnh HTML, CSS, JS và assets. Đã triển khai tại **https://vua-toi-b2b.pages.dev/**. Mã nguồn riêng tư: https://github.com/ntquangdung/vua-toi-b2b.

Tên miền b2b.vuatoi.com.vn đã thêm vào Cloudflare Pages, đang chờ bên quản lý domain cấu hình CNAME. Xem DEPLOYMENT.md và DNS-B2B-VUA-TOI.md để bàn giao DNS.

## Chạy và build

- Chạy CHAY_LOCAL.cmd hoặc python -m http.server 8765 --bind 127.0.0.1.
- Mở http://127.0.0.1:8765/. file:// chỉ dùng xem, không gửi thông tin.
- npm test: 12 kiểm thử giao tiếp biểu mẫu, 34 kiểm thử Apps Script.
- npm run build: xuất 22 file công khai vào dist. Không cần cài thư viện.
- Cloudflare dùng Direct Upload; push GitHub chưa tự cập nhật hosting.

## Cấu trúc

| Tệp / thư mục | Vai trò |
|---|---|
| index.html | Nội dung, sản phẩm, biểu mẫu và catalog |
| styles.css | Màu sắc, chữ, bố cục responsive và animation |
| script.js | Menu, tabs, ảnh chi tiết và hiệu ứng xuất hiện |
| gift-picker.js | Chọn nhiều bộ quà, số lượng riêng và tổng tạm tính |
| orders.js | Kiểm tra thông tin, gửi qua bridge và chờ xác nhận đã lưu |
| site-config.js | URL Apps Script /exec công khai |
| assets | Logo thật, ảnh sản phẩm từ ZIP, font và minh họa tỏi |
| integrations/google-apps-script | Bộ nhận đơn và hướng dẫn vận hành |
| scripts/build.mjs | Build danh sách file công khai |
| _headers | Header cho Cloudflare Pages |

## Sản phẩm và giá

Ảnh và thông tin bộ quà lấy từ ZIP người dùng cung cấp. Không dùng nội dung Tết 2027. Giá gốc gạch ngang khi có hai giá trong tài liệu; Thịnh Vượng chỉ có một giá.

| Bộ quà | Giá gốc | Giá bán |
|---|---:|---:|
| An Khang | 736.000 ₫ | 659.000 ₫ |
| Phúc Thọ | 720.000 ₫ | 639.000 ₫ |
| Thịnh Vượng | — | 399.000 ₫ |
| Phúc An | 728.000 ₫ | 655.000 ₫ |
| Trường Thọ | 454.000 ₫ | 399.000 ₫ |
| Phúc Lộc | 446.000 ₫ | 389.000 ₫ |

Bộ Phúc Lành 155.000 ₫ đã bỏ. Tỏi Lý Sơn – ớt xiêm rừng là một sản phẩm kết hợp. Khi đổi giá, cập nhật cả gift-catalog trong HTML và VUA_TOI_UNIT_PRICES_ trong Apps Script; giá đã lưu của đơn cũ được giữ nguyên.

## Giao diện

Tone đỏ, kem và vàng. Logo Vua Tỏi thật; tên thương hiệu có ®. Body và giá dùng Manrope, tiêu đề phụ Red Rose, tiêu đề chính Playfair Display; font tải local cùng giấy phép. Lưới sáu bộ quà: 3 cột desktop, 2 cột mobile từ 360px, 1 cột màn hình nhỏ hơn. Màu thẻ đỏ–vàng–đỏ và vàng–đỏ–vàng.

Tab TƯ VẤN mở mặc định; tab ĐẶT HÀNG giữ lựa chọn nhiều loại. Tabs hỗ trợ bàn phím. Nút ĐẶT HÀNG chữ vàng kim viền trắng trên đỏ có animation nhẹ; hỗ trợ prefers-reduced-motion. Danh sách quà có chiều cao cố định và cuộn bên trong. Mục Chọn quà theo thành phần đã bỏ; dải mời đặt hàng có khoảng cách trước/sau để cân đối.

Hotline 0935 176 188; email cungung@vuatoi.com.vn; liên kết thương hiệu vuatoi.com.vn và facebook.com/vuatoidacsanlyson. Cách viết hủ theo yêu cầu; không hiển thị mã số thuế.

## Nhận thông tin

Tư vấn gửi họ tên, số điện thoại và email không bắt buộc vào Sheet để nhân viên liên hệ. Đặt hàng gửi thêm nhiều bộ quà/số lượng, form cuối có lời nhắn không bắt buộc. **Đã bỏ trường Dịp tặng khỏi website và Sheet.** Nút TƯ VẤN trong form đặt hàng mở Zalo.

Apps Script phiên bản 5 ánh xạ dữ liệu theo tên cột nên có thể đổi thứ tự cột Sheet. Giữ tên các cột hệ thống; Email ở F, hai cột kỹ thuật được ẩn. Máy chủ tính đơn giá, thành tiền từng bộ và tổng tiền hàng, chỉ xác nhận sau khi ghi và đọc lại đúng dữ liệu. Yêu cầu gửi lại cùng ID và nội dung không tạo dòng trùng. Dữ liệu khách không đưa vào URL hoặc localStorage.

Sheet riêng tư, chỉ chủ sở hữu và người được chia sẻ mới xem được. Endpoint cho khách gửi không cần đăng nhập Google; không cung cấp chức năng đọc danh sách khách. Không có thanh toán trực tuyến; Vua Tỏi liên hệ xác nhận giá và giao nhận.

Ngày 16/10/2026 đã kiểm tra tư vấn và đơn nhiều bộ từ bản Cloudflare, đối chiếu các ô Sheet. Hai dòng thử có tên KIỂM THỬ CLOUDFLARE … – KHÔNG XỬ LÝ, email example.invalid, điện thoại 0000000000. Đơn thử tổng 1.437.000 ₫. Chưa kiểm tra tên miền riêng vì đang chờ DNS.
