# Cấu hình DNS cho b2b.vuatoi.com.vn

Nhờ bên quản lý tên miền thêm bản ghi trong zone vuatoi.com.vn:

| Loại | Name / Host | Target / Value | TTL |
|---|---|---|---|
| CNAME | b2b | vua-toi-b2b.pages.dev | Auto hoặc mặc định |

Tên đầy đủ: **b2b.vuatoi.com.vn**.

Hosting Cloudflare Pages đã triển khai và đã đăng ký custom domain này. Trang đang hoạt động tại https://vua-toi-b2b.pages.dev/.

Nếu host b2b đang có A/AAAA/CNAME khác, thay bản ghi trùng host khi chuyển sang hosting này. Không thay đổi DNS của website chính hoặc email. Subdomain dùng CNAME, không cần IP máy tính cá nhân hay chuyển nameserver domain chính.

Sau khi lưu DNS, báo lại để kiểm tra trạng thái Active, HTTPS và biểu mẫu tại https://b2b.vuatoi.com.vn/.
