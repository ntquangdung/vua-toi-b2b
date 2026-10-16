# Nhận tư vấn và đặt hàng Vua Tỏi bằng Google Sheets

## Trạng thái ngày 16/10/2026

- Apps Script: **Vua Tỏi – Nhận đơn landing page**, phiên bản **5** lúc 14:35.
- Chủ sở hữu/thực thi: cmavuatoilyson@gmail.com.
- Dự án: https://script.google.com/u/0/home/projects/1NYc4tDjKCif-zE1wJUCgxg0TMixB07jB8BEbrJ1hYfZQcFh6SwHiu_Z7/edit
- Sheet riêng tư: https://docs.google.com/spreadsheets/d/1_BCtHhRPrdNBLz2Kwg6ONd2tHVlE_FKMiotHNEw7QCo/edit?gid=1147376088#gid=1147376088, tab DonHang.
- Web App /exec đã đặt trong site-config.js. Quyền Bất kỳ ai cho phép khách gửi yêu cầu; không cấp quyền xem Sheet.
- Đã xác nhận gửi thực tế từ https://vua-toi-b2b.pages.dev/, cả tư vấn và đặt hàng. b2b.vuatoi.com.vn đang chờ DNS.

## Cấu hình

Trong Project Settings → Script properties:

| Thuộc tính | Giá trị |
|---|---|
| SPREADSHEET_ID | 1_BCtHhRPrdNBLz2Kwg6ONd2tHVlE_FKMiotHNEw7QCo |
| SHEET_NAME | DonHang |
| ALLOWED_ORIGINS | ["http://127.0.0.1:8765","http://localhost:8765","https://vua-toi-b2b.pages.dev","https://b2b.vuatoi.com.vn"] |

Origin không có đường dẫn/dấu / cuối, không dùng wildcard hoặc null. Chỉ HTTP localhost được chấp nhận; website công khai dùng HTTPS. Thêm origin là cấu hình luồng trình duyệt, không phải cơ chế xác thực chống bot.

Mỗi lần sửa Code.gs: lưu nguồn → Deploy → Manage deployments → Edit → New version → Deploy. Giữ deployment hiện tại để URL /exec không đổi. Execute as Me và Who has access Anyone như đã được chủ sở hữu cho phép. Không đổi quyền truy cập Sheet. Hướng dẫn Google: https://developers.google.com/apps-script/guides/web.

## Cột dữ liệu

Máy chủ ghi theo **tên tiêu đề**, không phụ thuộc thứ tự. Có thể sắp xếp lại cột và thêm cột nhân viên có tên riêng. Không đổi tên/xóa cột hệ thống, không tạo hai tiêu đề trùng hoặc cột không có tiêu đề nhưng có dữ liệu. Email được giữ tại F, hai cột kỹ thuật được ẩn theo vị trí thực tế.

Bố cục Sheet hiện tại:

| Cột | Nội dung |
|---|---|
| A | Mã đơn |
| B, ẩn | Request ID — chống ghi trùng |
| C | Thời gian nhận — thời gian máy chủ |
| D | Họ và tên |
| E | Số điện thoại — giữ số 0 đầu |
| F | Email — không bắt buộc |
| G | Các bộ quà — mỗi loại và số lượng một dòng |
| H | Tổng số bộ |
| I | Loại yêu cầu — Tư vấn hoặc Đặt hàng |
| J, ẩn | Payload SHA-256 — đối chiếu nội dung của cùng Request ID |
| K | Đơn giá từng bộ (VNĐ) |
| L | Thành tiền từng bộ (VNĐ) |
| M | Tổng tiền hàng (VNĐ) — lưu số để cộng/lọc |
| N | Nguồn form |
| O | Ghi chú |

Đã xóa trường Dịp tặng khỏi website và cột O cũ mang tiêu đề gm khỏi Sheet theo yêu cầu chủ sở hữu. Bảng mới tạo từ orders-headers.csv có cùng các tên cột cần thiết, thứ tự mặc định có thể khác Sheet hiện tại.

Bảng cũ có cấu trúc nhận diện được sẽ được bổ sung Email/giá/loại yêu cầu còn thiếu, loại bỏ cột tên Dịp tặng và chuyển nguyên cột Email về F. Các cột còn lại giữ giá trị, công thức và thứ tự. Nếu cấu trúc không nhận diện hoặc thiếu tên cốt lõi, máy chủ dừng với SHEET_HEADERS_MISMATCH trước khi ghi dữ liệu. Không nhập lại CSV lên bảng đang có đơn.

## Dữ liệu gửi từ website

Tư vấn:

    {
      kind: 'consultation',
      requestId: 'ID_NGAU_NHIEN_IT_NHAT_16_KY_TU',
      name: 'Tên khách', phone: '0935123456', email: '',
      source: 'consultation-form'
    }

Đặt hàng:

    {
      requestId: 'ID_NGAU_NHIEN_IT_NHAT_16_KY_TU',
      name: 'Tên khách', phone: '0935123456', email: '',
      items: [
        { product: 'Hộp quà An Khang', quantity: 1 },
        { product: 'Hộp quà Phúc Lộc', quantity: 2 }
      ],
      notes: '', source: 'quick-form'
    }

Tên 2–80 ký tự; điện thoại 9–15 chữ số; email trống hoặc đúng định dạng tối đa 254 ký tự; lời nhắn tối đa 600 ký tự. Mỗi đơn có 1–6 loại, mỗi loại 1–10.000 bộ, không trùng loại. source đặt hàng là quick-form hoặc contact-form. Không gửi giá/tổng tiền từ trình duyệt. Request ID dùng chữ ASCII, số, dấu gạch ngang/gạch dưới, dài 16–80 ký tự.

Sáu tên sản phẩm: Hộp quà An Khang, Hộp quà Phúc Thọ, Hộp quà Thịnh Vượng, Hộp quà Phúc An, Hộp quà Trường Thọ, Hộp quà Phúc Lộc. Giá máy chủ lần lượt 659000, 639000, 399000, 655000, 399000, 389000. Đơn giá/tiền từng dòng lưu tại thời điểm đặt; tổng chỉ gồm tiền hàng. Giá/giao nhận do nhân viên xác nhận.

Để tương thích việc gửi lại từ tab web phiên bản cũ, API vẫn chấp nhận khóa occasion hợp lệ của giao thức cũ khi tính dấu vân tay; không lưu cột này. Website hiện không gửi khóa đó. Các yêu cầu tư vấn không nhận items, occasion, notes hoặc giá.

## Xác nhận lưu và bảo vệ dữ liệu

Trang mở bridge HTML Service trong iframe bằng URL chỉ gồm origin, requestId và nonce. Tên/điện thoại/email/sản phẩm đi qua postMessage rồi google.script.run, không nằm trong URL và không lưu localStorage. Bridge đối chiếu source, origin, ID và nonce. Landing page phải mở trực tiếp trên HTTP/HTTPS, không nhúng cả trang trong iframe ngoài.

ScriptLock bao quanh tìm Request ID và ghi hàng. Gửi lại cùng ID/nội dung trả cùng mã đơn, không tạo dòng mới; ID có nội dung khác bị từ chối. Với đơn cũ, giá đã ghi được dùng để kiểm tra gửi lại, không tính lại theo catalog mới. Chỉ một dự án Apps Script phụ trách tab DonHang để khóa có hiệu lực chung.

Máy chủ thêm dấu nháy đơn vào chuỗi khách nhập để tránh công thức, giữ điện thoại dạng text. ACK chỉ trả saved=true và orderId sau ghi → flush → đọc lại chính xác trường hệ thống, số tiền và kiểu thời gian/số lượng. Không đưa thông tin khách vào ACK hoặc trả danh sách khách. Các cột nhân viên riêng được giữ nguyên khi gửi lại.

HTML Service/google.script.run: https://developers.google.com/apps-script/guides/html/communication
LockService: https://developers.google.com/apps-script/reference/lock/lock-service
Range.setValues: https://developers.google.com/apps-script/reference/spreadsheet/range#setvaluesvalues

## Kiểm thử

Chạy npm test từ gốc dự án: 12 frontend và 34 Apps Script checks bằng mock. Các ca mới kiểm tra cột đổi thứ tự, cột nhân viên, gửi lại, giá theo tên cột, bỏ Dịp tặng và từ chối tiêu đề thiếu/trùng.

Đã đối chiếu trực tiếp bản Cloudflare:

- Hàng 2: KIỂM THỬ CLOUDFLARE TƯ VẤN – KHÔNG XỬ LÝ. F2=qa-cloudflare-lead@example.invalid; I2=Tư vấn; các ô quà/giá trống.
- Hàng 3: KIỂM THỬ CLOUDFLARE ĐẶT HÀNG – KHÔNG XỬ LÝ. F3=qa-cloudflare-order@example.invalid; G3=An Khang × 1, Phúc Lộc × 2; H3=3; I3=Đặt hàng; K3=659.000 và 389.000; L3=659.000 và 778.000; M3=1437000.
- Hai yêu cầu đều dùng điện thoại thử 0000000000, frontend nhận ACK thành công. Không xử lý các dòng này như đơn khách. Vị trí hàng chỉ là bản ghi kiểm tra ngày 16/10/2026, có thể đổi khi nhân viên sắp xếp bảng.
- Sheet vẫn hiện chỉ riêng tư với chủ sở hữu. Không thay đổi ACL trong lần triển khai này.

Sau khi DNS b2b.vuatoi.com.vn có hiệu lực, kiểm tra lại biểu mẫu từ địa chỉ đó. ALLOWED_ORIGINS đã chuẩn bị chính xác origin; không khẳng định luồng tên miền riêng thành công trước kiểm tra thực tế.
