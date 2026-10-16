# Triển khai landing page Vua Tỏi

## Đã hoàn tất

- Mã nguồn: https://github.com/ntquangdung/vua-toi-b2b (Private), nhánh main.
- Build bằng `npm run build`, xuất 21 file công khai vào `dist/`, khoảng 1,66 MB.
- Kiểm thử: `npm test`, 12 trường hợp frontend và 30 trường hợp Apps Script đã đạt.
- `vercel.json` cấu hình build ra dist, chỉ phục vụ giao diện và assets cần thiết.
- Apps Script nhận tư vấn/đặt hàng vẫn chạy, Sheet giữ riêng tư.

## Vercel hiện đang chờ

Nhóm được người dùng chọn: CMA-VuaToi, tài khoản hiển thị cmavuatoi-2142. Ngày 16/10/2026, nhóm đang dùng Hobby. Gói giao diện đã được tải vào luồng New Project / Drop, tên dự kiến vua-toi-b2b. Thao tác Deploy bị bộ duyệt tự động từ chối vì đây là landing page thương mại và nhóm chưa có Pro. Chưa có deployment thành công, URL Vercel công khai hoặc bản ghi DNS thực tế.

Điều kiện Vercel: https://vercel.com/docs/plans/hobby

Gói `deployment/vua-toi-b2b.zip` chỉ chứa file giao diện, được bỏ qua bởi Git. Bản tải trực tiếp chưa kết nối GitHub nên cập nhật mã nguồn sẽ chưa tự tạo deployment. Có thể kết nối repository sau khi chọn nhóm phù hợp và cấp quyền cần thiết.

## Tên miền cần cấu hình sau khi triển khai

Tên miền chính xác: **b2b.vuatoi.com.vn**.

Thêm tên miền này vào Project → Settings → Domains, rồi sao chép đúng bản ghi CNAME Vercel hiển thị. Bên quản lý DNS thường nhập host `b2b` trong zone `vuatoi.com.vn`; giá trị trỏ đến lấy từ dự án thực tế, không dùng IP của máy tính local. Không thay nameserver hoặc bản ghi domain chính chỉ để nối subdomain này.

Chưa có giá trị DNS để gửi bên domain. Không dùng CNAME ví dụ hoặc IP suy đoán.

Hướng dẫn Vercel: https://vercel.com/docs/domains/working-with-domains/add-a-domain

## Kết nối Sheet khi trang có địa chỉ công khai

Script Properties `ALLOWED_ORIGINS` hiện chỉ cho hai origin local cổng 8765. Khi có hosting, bổ sung chính xác origin HTTPS của bản triển khai và `https://b2b.vuatoi.com.vn`; không dùng wildcard hoặc origin null. Gửi yêu cầu kiểm thử có tên KIỂM THỬ – KHÔNG XỬ LÝ, đối chiếu ACK và hàng trong Sheet. Chỉ xác nhận luồng hoạt động trên tên miền mới sau kiểm tra thực tế.

## Lựa chọn khác nếu cần hosting miễn phí

Cloudflare Pages hỗ trợ subdomain qua CNAME về tên dự án pages.dev mà không cần chuyển nameserver của domain chính. Người dùng chưa yêu cầu triển khai lựa chọn này; chưa tạo dự án Cloudflare.

https://developers.cloudflare.com/pages/configuration/custom-domains/
