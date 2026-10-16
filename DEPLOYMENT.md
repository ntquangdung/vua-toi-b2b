# Triển khai landing page Vua Tỏi

## Đã hoàn tất

- Mã nguồn: https://github.com/ntquangdung/vua-toi-b2b (Private), nhánh main.
- Build bằng `npm run build`, xuất 22 file công khai vào `dist/`, khoảng 1,66 MB.
- Kiểm thử: 12 trường hợp frontend và 30 trường hợp Apps Script đã đạt.
- `_headers` áp dụng các header cơ bản cho Cloudflare Pages.
- Gói tải trực tiếp Cloudflare: `deployment/vua-toi-cloudflare-pages.zip`, khoảng 1,3 MB; có index.html ngay ở gốc, không chứa mã Apps Script, tests hoặc tài liệu nội bộ.
- Apps Script nhận tư vấn/đặt hàng vẫn chạy, Sheet giữ riêng tư.

## Cloudflare Pages — đang chờ đăng nhập

Người dùng đã chọn Cloudflare Pages ngày 16/10/2026. Tab https://dash.cloudflare.com/ đang mở để người dùng đăng nhập tài khoản sở hữu hosting. Chưa tạo project hoặc deployment trên Cloudflare, chưa có URL pages.dev hay DNS thực tế.

Dự kiến dùng Direct Upload với gói đã build. Phương thức này cập nhật bằng upload/Wrangler; push lên GitHub không tự tạo deployment. Nếu muốn tích hợp Git tự động sau này, Cloudflare yêu cầu một Pages project dùng Git integration riêng.

Hướng dẫn: https://developers.cloudflare.com/pages/get-started/direct-upload/

## Tên miền cần cấu hình

Tên miền chính xác: **b2b.vuatoi.com.vn**.

Sau khi deploy, thêm tên miền trong Pages project → Custom domains. Bên quản lý domain tạo CNAME cho host `b2b` trong zone `vuatoi.com.vn`, trỏ đến đúng tên Pages thực tế của dự án. Không cần IP máy tính local hoặc chuyển nameserver của domain chính để gắn riêng subdomain này.

Chưa có giá trị CNAME thật để bàn giao. Không dùng giá trị ví dụ thay cho bản ghi do dự án cấp.

https://developers.cloudflare.com/pages/configuration/custom-domains/

## Kết nối Sheet khi có địa chỉ công khai

Script Properties `ALLOWED_ORIGINS` hiện chỉ cho hai origin local cổng 8765. Khi có hosting, bổ sung chính xác origin HTTPS Pages của bản triển khai và `https://b2b.vuatoi.com.vn`; không dùng wildcard hoặc origin null. Gửi yêu cầu kiểm thử có tên KIỂM THỬ – KHÔNG XỬ LÝ, đối chiếu ACK và hàng trong Sheet. Chỉ xác nhận luồng hoạt động trên tên miền mới sau kiểm tra thực tế.

## Phương án Vercel đã dừng

Repository còn vercel.json để tham khảo cấu hình build. Nhóm CMA-VuaToi trên Vercel đang dùng Hobby; thao tác Deploy bị bộ duyệt tự động từ chối vì landing page thương mại cần Pro. Chưa có deployment Vercel công khai hoặc bản ghi DNS Vercel. Người dùng đã chuyển sang Cloudflare Pages, không thực hiện mua/nâng cấp Vercel.
