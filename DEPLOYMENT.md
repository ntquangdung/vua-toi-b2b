# Triển khai Vua Tỏi — cập nhật 20/10/2026

## Địa chỉ và tài khoản

- Website chính thức: https://b2b.vuatoi.com.vn/
- Địa chỉ Cloudflare: https://vua-toi-b2b.pages.dev/
- GitHub: https://github.com/ntquangdung/vua-toi-b2b — Private, nhánh main.
- Cloudflare Pages: project vua-toi-b2b, tài khoản Cmavuatoilyson@gmail.com's Account.
- Dashboard: https://dash.cloudflare.com/0beedba03694b1cbc29d52af5007ab20/pages/view/vua-toi-b2b
- Bản Production đã cập nhật, gồm 22 file web, khoảng 1,66 MB.

## DNS bàn giao cho bên quản lý domain

Tên miền **b2b.vuatoi.com.vn** đã phục vụ website bằng HTTPS. Đã mở trực tiếp và xác nhận gửi đơn thành công ngày 20/10/2026. Bản ghi bàn giao ban đầu:

| Loại | Host / Name | Target / Value | TTL |
|---|---|---|---|
| CNAME | b2b | vua-toi-b2b.pages.dev | Auto hoặc mặc định |

Tạo trong zone vuatoi.com.vn. Nếu hệ thống yêu cầu tên đầy đủ, nhập b2b.vuatoi.com.vn. Host này cần trỏ đến target trên; nếu đã có bản ghi A/AAAA/CNAME trùng host b2b, thay bản ghi đó khi chuyển subdomain sang Pages. Giữ các bản ghi khác của domain hiện có.

Sau khi bên domain lưu bản ghi, vào Pages → Custom domains → Complete DNS setup → Check DNS records. Chờ trạng thái Active và HTTPS hợp lệ trước khi dùng địa chỉ chính thức. Đã xác nhận website và biểu mẫu tại b2b.vuatoi.com.vn ngày 20/10/2026; hướng dẫn trên giữ để tham khảo khi thay đổi DNS.

Hướng dẫn chính thức: https://developers.cloudflare.com/pages/configuration/custom-domains/

## Cách cập nhật hosting

Dự án hiện dùng **Direct Upload**. Push GitHub lưu mã nguồn, không tự phát hành lên Pages.

1. Chạy npm test và npm run build.
2. Nén nội dung bên trong dist thành ZIP, index.html nằm ngay ở gốc ZIP.
3. Pages → vua-toi-b2b → Create deployment → Production → tải ZIP → Save and deploy.
4. Mở website công khai và kiểm tra thay đổi.

Gói gần nhất: deployment/vua-toi-cloudflare-pages.zip (1.317.316 byte). Build chỉ đưa HTML/CSS/JS, tài sản dùng trên trang, giấy phép font và _headers vào dist; bản nháp, mã nhận đơn, tests và tài liệu nội bộ nằm ngoài thư mục công khai.

Direct Upload và Git integration là hai loại project khác nhau; muốn CI từ GitHub sau này cần tạo project dùng Git integration. https://developers.cloudflare.com/pages/get-started/direct-upload/

## Nhận tư vấn và đơn hàng

Apps Script đã cập nhật **phiên bản 6**, cùng URL /exec đang cấu hình trong site-config.js. ALLOWED_ORIGINS đã có:

- http://127.0.0.1:8765
- http://localhost:8765
- https://vua-toi-b2b.pages.dev
- https://b2b.vuatoi.com.vn

Sheet DonHang giữ riêng tư. Trường Dịp tặng đã xóa khỏi form và cột O cũ (đang có tiêu đề gm) đã xóa theo yêu cầu; Ghi chú hiện ở O. Máy chủ ánh xạ theo tên cột, giữ thứ tự cột mà nhân viên đã sắp xếp. Email ở F; Request ID và Payload SHA-256 được ẩn theo vị trí thực tế.

Đã gửi từ https://vua-toi-b2b.pages.dev và đối chiếu trong Sheet:

- Hàng 2: KIỂM THỬ CLOUDFLARE TƯ VẤN – KHÔNG XỬ LÝ; F2 có email thử, I2=Tư vấn, không có tiền hàng.
- Hàng 3: KIỂM THỬ CLOUDFLARE ĐẶT HÀNG – KHÔNG XỬ LÝ; An Khang × 1 và Phúc Lộc × 2; H3=3; I3=Đặt hàng; K3 có đơn giá 659.000 và 389.000; L3 có thành tiền 659.000 và 778.000; M3=1437000.
- Hai biểu mẫu đều nhận xác nhận lưu thành công. Điện thoại thử 0000000000, email thuộc example.invalid. Các dòng thử được giữ nguyên, không xử lý như đơn khách.
- 12 kiểm thử frontend và 35 kiểm thử máy chủ đạt. Desktop 1280×720 và mobile 390×844 đã kiểm tra trên bản công khai; ảnh tải đúng, không tràn ngang, console không có lỗi trên tab kiểm tra.

## Vercel

Không có deployment Vercel. Người dùng đã chuyển sang Cloudflare sau khi thao tác thương mại trên nhóm Hobby bị bộ duyệt tự động từ chối; không mua hoặc nâng cấp gói. vercel.json chỉ là cấu hình tham khảo chưa dùng.

## Thay đổi 20/10/2026

- Thay nhãn đầu trang bằng +1000 Khách hàng đã đặt hàng, khối đỏ/số vàng.
- Giá duy nhất theo ảnh 18/10: An Khang 936.000; Phúc Thọ 720.000; Thịnh Vượng 399.000; Phúc An 828.000; Trường Thọ 554.000; Phúc Lộc 446.000 ₫. Bỏ giá KM/gạch ngang, giá từ 399.000 ₫. Không áp dụng chiết khấu số lượng tự động.
- Đồng bộ card, hero, dialog, gift-catalog và máy chủ. Các giá lịch sử giữ nguyên.
- Apps Script phiên bản 6, 08:53 20/10/2026; Production Cloudflare báo Success.
- Đơn thử từ b2b.vuatoi.com.vn ghi hàng 8: An Khang × 1 + Phúc Lộc × 2 = 1.828.000 ₫; đã đối chiếu đơn giá, thành tiền và tổng trong Sheet. Tên KIỂM THỬ GIÁ 20-10 – KHÔNG XỬ LÝ; không xử lý như đơn khách.

## Phát hành bản thiết kế đã duyệt — 20/10/2026

- Áp dụng bản nháp hero-divider: tiêu đề cân giữa, dấu ngăn vàng, +1000 và dòng khách hàng viết hoa.
- Hero chia ảnh An Khang và bảng CHƯƠNG TRÌNH KHUYẾN MÃI; thêm quy cách, hộp và túi đồng bộ. Bảng xếp mức giảm 30%, 25%, 20%, 15%, 10% theo số lượng; bỏ headline “GIẢM ĐẾN 30%”.
- Thêm hiệu ứng TƯ VẤN, có hỗ trợ giảm chuyển động. Giữ scripts nhận đơn của bản chính; không đưa cấu hình demo hoặc đường dẫn bản nháp lên hosting.
- Cloudflare nhận đủ 22 file và báo Success. Đã xác nhận nội dung mới, CSS v25 trên https://b2b.vuatoi.com.vn/.
- Kiểm tra desktop 1280px và mobile 390px: hai thẻ hero cao bằng nhau, không tràn ngang; console không có lỗi. Form tư vấn và đặt hàng được bật; thử chọn An Khang × 1 + Phúc Lộc × 2 hiển thị 1.828.000 ₫ mà không gửi đơn mới.
- 12 kiểm thử frontend và 35 kiểm thử máy chủ đạt. Apps Script và dữ liệu Sheet giữ nguyên; bảng khuyến mãi là thông tin để nhân viên xác nhận, chưa tự trừ vào tạm tính.
- Ảnh kiểm tra lưu tại deployment/published-desktop.png và deployment/published-mobile.png; thư mục deployment không đưa lên GitHub hoặc hosting.
