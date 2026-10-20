# Hộp quà Vua Tỏi

Landing page tĩnh HTML, CSS, JS và assets. Đã triển khai tại **https://b2b.vuatoi.com.vn/** (Cloudflare: https://vua-toi-b2b.pages.dev/). Mã nguồn riêng tư: https://github.com/ntquangdung/vua-toi-b2b.

Tên miền b2b.vuatoi.com.vn đã hoạt động trên HTTPS; ngày 20/10/2026 đã xác nhận gửi đơn theo giá mới từ địa chỉ này. Xem DEPLOYMENT.md và DNS-B2B-VUA-TOI.md để bàn giao DNS.

## Chạy và build

- Chạy CHAY_LOCAL.cmd hoặc python -m http.server 8765 --bind 127.0.0.1.
- Mở http://127.0.0.1:8765/. file:// chỉ dùng xem, không gửi thông tin.
- npm test: 12 kiểm thử giao tiếp biểu mẫu, 35 kiểm thử Apps Script.
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

Ảnh sản phẩm lấy từ ZIP người dùng cung cấp. Giá cập nhật ngày 20/10/2026 theo cột GIÁ GỐC trong ảnh bảng giá ngày 18/10. Mỗi bộ chỉ hiển thị một giá; không có giá KM hoặc giá gạch ngang. Không tự áp dụng bảng chiết khấu số lượng trong ảnh.

| Bộ quà | Giá bộ quà |
|---|---:|
| An Khang | 936.000 ₫ |
| Phúc Thọ | 720.000 ₫ |
| Thịnh Vượng | 399.000 ₫ |
| Phúc An | 828.000 ₫ |
| Trường Thọ | 554.000 ₫ |
| Phúc Lộc | 446.000 ₫ |

Bộ Phúc Lành 155.000 ₫ đã bỏ. Tỏi Lý Sơn – ớt xiêm rừng là một sản phẩm kết hợp. Khi đổi giá, cập nhật cả gift-catalog trong HTML và VUA_TOI_UNIT_PRICES_ trong Apps Script; giá đã lưu của đơn cũ được giữ nguyên.

## Giao diện

Phần đầu canh giữa tiêu đề và khối +1000, ngăn bằng đường vàng và ngôi sao; dòng KHÁCH HÀNG ĐÃ ĐẶT HÀNG viết hoa. Bên dưới chia hai: ảnh An Khang thật kèm quy cách 2 hủ × 500g, và bảng CHƯƠNG TRÌNH KHUYẾN MÃI. Các mức giảm từ 30% đến 10% theo số lượng hiển thị theo ảnh người dùng cung cấp; tạm tính đặt hàng vẫn theo giá gốc và được nhân viên xác nhận. Tone đỏ, kem và vàng. Logo Vua Tỏi thật; tên thương hiệu có ®. Body và giá dùng Manrope, tiêu đề phụ Red Rose, tiêu đề chính Playfair Display; font tải local cùng giấy phép. Lưới sáu bộ quà: 3 cột desktop, 2 cột mobile từ 360px, 1 cột màn hình nhỏ hơn. Màu thẻ đỏ–vàng–đỏ và vàng–đỏ–vàng.

Tab TƯ VẤN mở mặc định; tab ĐẶT HÀNG giữ lựa chọn nhiều loại. Tabs hỗ trợ bàn phím. TƯ VẤN có hiệu ứng nhấn chữ và quét sáng nhẹ; nút ĐẶT HÀNG chữ vàng kim viền trắng trên đỏ có animation nhẹ. Các hiệu ứng hỗ trợ prefers-reduced-motion. Danh sách quà có chiều cao cố định và cuộn bên trong. Mục Chọn quà theo thành phần đã bỏ; dải mời đặt hàng có khoảng cách trước/sau để cân đối.

Hotline 0935 176 188; email cungung@vuatoi.com.vn; liên kết thương hiệu vuatoi.com.vn và facebook.com/vuatoidacsanlyson. Cách viết hủ theo yêu cầu; không hiển thị mã số thuế.

## Nhận thông tin

Tư vấn gửi họ tên, số điện thoại và email không bắt buộc vào Sheet để nhân viên liên hệ. Đặt hàng gửi thêm nhiều bộ quà/số lượng, form cuối có lời nhắn không bắt buộc. **Đã bỏ trường Dịp tặng khỏi website và Sheet.** Nút TƯ VẤN trong form đặt hàng mở Zalo.

Apps Script phiên bản 6 ánh xạ dữ liệu theo tên cột nên có thể đổi thứ tự cột Sheet. Giữ tên các cột hệ thống; Email ở F, hai cột kỹ thuật được ẩn. Máy chủ tính đơn giá, thành tiền từng bộ và tổng tiền hàng, chỉ xác nhận sau khi ghi và đọc lại đúng dữ liệu. Yêu cầu gửi lại cùng ID và nội dung không tạo dòng trùng. Dữ liệu khách không đưa vào URL hoặc localStorage.

Sheet riêng tư, chỉ chủ sở hữu và người được chia sẻ mới xem được. Endpoint cho khách gửi không cần đăng nhập Google; không cung cấp chức năng đọc danh sách khách. Không có thanh toán trực tuyến; Vua Tỏi liên hệ xác nhận giá và giao nhận.

Ngày 16/10/2026 đã kiểm tra tư vấn và đơn nhiều bộ từ bản Cloudflare, đối chiếu các ô Sheet. Hai dòng thử có tên KIỂM THỬ CLOUDFLARE … – KHÔNG XỬ LÝ, email example.invalid, điện thoại 0000000000. Đơn thử tổng 1.437.000 ₫. Đây là ghi nhận kiểm thử ngày 16/10; kiểm tra tên miền riêng đã hoàn tất trong lần cập nhật 20/10 bên dưới.

## Cập nhật 20/10/2026

Đã phát hành khối +1000 Khách hàng đã đặt hàng và bảng một giá theo ảnh 18/10 lên Cloudflare. Apps Script phiên bản 6 cùng URL /exec. Đã thử An Khang × 1 + Phúc Lộc × 2 từ https://b2b.vuatoi.com.vn/: tổng 1.828.000 ₫; Sheet hàng 8 có đúng đơn giá 936.000/446.000, thành tiền 936.000/892.000 và tổng số 1828000. Dòng thử mang tên KIỂM THỬ GIÁ 20-10 – KHÔNG XỬ LÝ, điện thoại 0000000000, email example.invalid. Không xử lý như đơn khách. Kiểm thử 12 frontend + 35 máy chủ đạt; giao diện desktop 1280px/mobile 390px không tràn ngang.
