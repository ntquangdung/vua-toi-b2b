# Triển khai Vua Tỏi — 16/10/2026

## Địa chỉ và tài khoản

- Website công khai: https://vua-toi-b2b.pages.dev/
- GitHub: https://github.com/ntquangdung/vua-toi-b2b — Private, nhánh main.
- Cloudflare Pages: project vua-toi-b2b, tài khoản Cmavuatoilyson@gmail.com's Account.
- Dashboard: https://dash.cloudflare.com/0beedba03694b1cbc29d52af5007ab20/pages/view/vua-toi-b2b
- Bản Production đã cập nhật, gồm 22 file web, khoảng 1,66 MB.

## DNS bàn giao cho bên quản lý domain

Tên miền đã thêm vào Pages: **b2b.vuatoi.com.vn**. Cloudflare hiện hiển thị **Inactive (Requires DNS setup)**; bên quản lý DNS chưa thêm bản ghi.

| Loại | Host / Name | Target / Value | TTL |
|---|---|---|---|
| CNAME | b2b | vua-toi-b2b.pages.dev | Auto hoặc mặc định |

Tạo trong zone vuatoi.com.vn. Nếu hệ thống yêu cầu tên đầy đủ, nhập b2b.vuatoi.com.vn. Host này cần trỏ đến target trên; nếu đã có bản ghi A/AAAA/CNAME trùng host b2b, thay bản ghi đó khi chuyển subdomain sang Pages. Giữ các bản ghi khác của domain hiện có.

Sau khi bên domain lưu bản ghi, vào Pages → Custom domains → Complete DNS setup → Check DNS records. Chờ trạng thái Active và HTTPS hợp lệ trước khi dùng địa chỉ chính thức. Chưa xác nhận website hoặc biểu mẫu trên b2b.vuatoi.com.vn vì DNS chưa được cấu hình.

Hướng dẫn chính thức: https://developers.cloudflare.com/pages/configuration/custom-domains/

## Cách cập nhật hosting

Dự án hiện dùng **Direct Upload**. Push GitHub lưu mã nguồn, không tự phát hành lên Pages.

1. Chạy npm test và npm run build.
2. Nén nội dung bên trong dist thành ZIP, index.html nằm ngay ở gốc ZIP.
3. Pages → vua-toi-b2b → Create deployment → Production → tải ZIP → Save and deploy.
4. Mở website công khai và kiểm tra thay đổi.

Gói gần nhất: deployment/vua-toi-cloudflare-pages.zip (1.315.202 byte). Build chỉ đưa HTML/CSS/JS, tài sản dùng trên trang, giấy phép font và _headers vào dist; mã nhận đơn, tests và tài liệu nội bộ nằm ngoài thư mục công khai.

Direct Upload và Git integration là hai loại project khác nhau; muốn CI từ GitHub sau này cần tạo project dùng Git integration. https://developers.cloudflare.com/pages/get-started/direct-upload/

## Nhận tư vấn và đơn hàng

Apps Script đã cập nhật **phiên bản 5**, cùng URL /exec đang cấu hình trong site-config.js. ALLOWED_ORIGINS đã có:

- http://127.0.0.1:8765
- http://localhost:8765
- https://vua-toi-b2b.pages.dev
- https://b2b.vuatoi.com.vn

Sheet DonHang giữ riêng tư. Trường Dịp tặng đã xóa khỏi form và cột O cũ (đang có tiêu đề gm) đã xóa theo yêu cầu; Ghi chú hiện ở O. Máy chủ ánh xạ theo tên cột, giữ thứ tự cột mà nhân viên đã sắp xếp. Email ở F; Request ID và Payload SHA-256 được ẩn theo vị trí thực tế.

Đã gửi từ https://vua-toi-b2b.pages.dev và đối chiếu trong Sheet:

- Hàng 2: KIỂM THỬ CLOUDFLARE TƯ VẤN – KHÔNG XỬ LÝ; F2 có email thử, I2=Tư vấn, không có tiền hàng.
- Hàng 3: KIỂM THỬ CLOUDFLARE ĐẶT HÀNG – KHÔNG XỬ LÝ; An Khang × 1 và Phúc Lộc × 2; H3=3; I3=Đặt hàng; K3 có đơn giá 659.000 và 389.000; L3 có thành tiền 659.000 và 778.000; M3=1437000.
- Hai biểu mẫu đều nhận xác nhận lưu thành công. Điện thoại thử 0000000000, email thuộc example.invalid. Các dòng thử được giữ nguyên, không xử lý như đơn khách.
- 12 kiểm thử frontend và 34 kiểm thử máy chủ đạt. Desktop 1280×720 và mobile 390×844 đã kiểm tra trên bản công khai; ảnh tải đúng, không tràn ngang, console không có lỗi trên tab kiểm tra.

## Vercel

Không có deployment Vercel. Người dùng đã chuyển sang Cloudflare sau khi thao tác thương mại trên nhóm Hobby bị bộ duyệt tự động từ chối; không mua hoặc nâng cấp gói. vercel.json chỉ là cấu hình tham khảo chưa dùng.
