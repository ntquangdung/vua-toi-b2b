# Nhận yêu cầu đặt hàng Vua Tỏi bằng Google Sheets

Bộ mã nhận đơn đã được triển khai trong dự án Apps Script **Vua Tỏi – Nhận đơn landing page**, phiên bản 3 ngày 16/10/2026, bổ sung đơn giá, thành tiền từng bộ và tổng tiền hàng. **Đã kết nối URL /exec với landing page local và kiểm tra đơn ghi vào Sheet thành công.**

Đích nhận đơn do người dùng chỉ định: [Thông Tin Landing Page - VUA TỎI / DonHang](https://docs.google.com/spreadsheets/d/1_BCtHhRPrdNBLz2Kwg6ONd2tHVlE_FKMiotHNEw7QCo/edit?gid=1147376088#gid=1147376088). Script Properties đã lưu đúng ID này, tab nhận đơn `DonHang` và hai origin local cổng 8765. Sheet giữ quyền xem Hạn chế; danh sách quyền truy cập hiện chỉ có chủ sở hữu cmavuatoilyson@gmail.com. Người dùng đã xác nhận mở kênh nhận đơn công khai, giữ dữ liệu Sheet riêng tư.

## Trạng thái triển khai

- [Dự án Apps Script](https://script.google.com/u/0/home/projects/1NYc4tDjKCif-zE1wJUCgxg0TMixB07jB8BEbrJ1hYfZQcFh6SwHiu_Z7/edit) thực thi bằng **cmavuatoilyson@gmail.com**.
- URL `/exec` nằm trong `site-config.js`; quyền Web App là **Bất kỳ ai** để khách không cần đăng nhập Google. Quyền này cho phép gọi chức năng nhận đơn, không cấp quyền mở Sheet hoặc xem danh sách khách.
- Đơn kiểm thử `VT-889ed036d9f13a171f2466a89451db4b` nằm ở hàng 2, ghi rõ **KIỂM THỬ KẾT NỐI – KHÔNG XỬ LÝ**. Hai loại: An Khang × 2 và Phúc An × 3; tổng 5 bộ, điện thoại thử 0000000000. Frontend nhận ACK thành công và đã đối chiếu dữ liệu qua giao diện Sheet.
- Phiên bản 2 đã nhận đơn thử **KIỂM THỬ EMAIL – KHÔNG XỬ LÝ** ở hàng 3, Email `qa-vuatoi@example.invalid` lưu đúng ô L3 ở phiên bản 2 (nay là F3). Cột L1 là Email; mã đơn cũ ở A2 giữ nguyên. Email thử thuộc miền dành cho kiểm thử, không gửi thư đến địa chỉ này.
- Endpoint công khai có thể nhận đơn rác. Để thêm người xem dữ liệu, chia sẻ trực tiếp Sheet cho tài khoản cần thiết; giữ quyền truy cập chung **Hạn chế**.

Mã hiện chỉ gửi và nhận từ `http://127.0.0.1:8765` và `http://localhost:8765`. Khi triển khai landing page lên tên miền sau này, cần cập nhật `ALLOWED_ORIGINS`.

Sau khi cấu hình, biểu mẫu gửi yêu cầu gồm nhiều loại bộ quà và số lượng riêng từng loại vào Google Sheets. Thông báo thành công chỉ xuất hiện khi máy chủ đã ghi, `flush()` và đọc lại đúng hàng. Đây là xác nhận nhận yêu cầu, chưa xác nhận thanh toán, tồn kho hay giao hàng.

## Chuẩn bị và triển khai khi có tài khoản Google

1. Dùng Sheet nhận đơn ở trên hoặc tạo Google Sheet riêng khi thiết lập một môi trường khác. Giữ quyền xem dữ liệu cho người phụ trách; khách truy cập trang không cần quyền mở Sheet.
2. Lấy ID trong địa chỉ `https://docs.google.com/spreadsheets/d/ID_CUA_BANG/edit`.
3. Mở **Extensions → Apps Script**, dán toàn bộ [Code.gs](Code.gs) và lưu.
4. Vào **Project Settings → Script properties**, thêm các giá trị:

| Thuộc tính | Giá trị |
|---|---|
| `SPREADSHEET_ID` | ID của Google Sheet nhận đơn; không đặt ID này trong frontend |
| `SHEET_NAME` | `DonHang` hoặc tên tab riêng bạn muốn sử dụng |
| `ALLOWED_ORIGINS` | `["http://localhost:8765","http://127.0.0.1:8765"]` khi kiểm tra local |

Khi trang có tên miền thật, thêm origin chính xác vào mảng JSON, ví dụ `"https://ten-mien-cua-ban.vn"`. Origin chỉ gồm giao thức, tên miền và cổng nếu có; không thêm đường dẫn hoặc dấu `/` cuối. `www` và tên miền không có `www` là hai origin khác nhau. Chỉ cho phép HTTP với localhost; website công khai dùng HTTPS. Khi thiếu `ALLOWED_ORIGINS`, mã chỉ cho phép hai địa chỉ local cổng 8765 ở trên.

5. Tab `DonHang` và hàng tiêu đề được tạo tự động khi nhận đơn đầu tiên. Không cần chạy hàm riêng `setupOrdersSheet_` trước khi triển khai; lần gửi đầu tự chuẩn bị hoặc cập nhật cấu trúc bảng. Mã không ghi đè hàng tiêu đề hiện có. Nếu tiêu đề khác cấu trúc, dùng tab trống riêng hoặc nhập [orders-headers.csv](orders-headers.csv) vào hàng đầu theo đúng thứ tự.
6. Đặt múi giờ của Sheet thành Việt Nam, GMT+07:00, để cột thời gian nhận hiển thị đúng giờ. Thời gian được tạo bởi máy chủ, không tin đồng hồ của khách.
7. Chọn **Deploy → New deployment → Web app**. Chạy bằng tài khoản chủ sở hữu (**Execute as: Me**) và cho phép khách truy cập (**Who has access: Anyone**). Chủ sở hữu cấp quyền truy cập Google Sheets khi được yêu cầu. Nếu chính sách Workspace không cho phép truy cập ẩn danh, cần điều chỉnh cấu hình tài khoản hoặc chọn dịch vụ nhận đơn khác; không coi trang đăng nhập là một ACK.
8. Sao chép URL triển khai dạng `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`. Dùng `/exec`, không dùng `/dev` chỉ dành cho kiểm thử có quyền truy cập. [Hướng dẫn Web Apps của Google](https://developers.google.com/apps-script/guides/web).
9. Điền URL trên vào `window.VUA_TOI_CONFIG.googleScriptUrl` của landing page. Giữ `timeoutMs: 25000`. URL này được phép công khai; đây không phải khóa bí mật. Giữ giá trị rỗng trước khi có URL thật.
10. Chạy landing page bằng HTTP local tại `http://localhost:8765`, gửi đơn kiểm thử và đối chiếu hàng trong Sheet theo phần kiểm tra bên dưới. Không kiểm tra bằng `file://` vì origin là `null` và bị từ chối.

Khi sửa `Code.gs` sau triển khai, tạo phiên bản mới trong **Deploy → Manage deployments → Edit → New version → Deploy**. Sửa nguồn trong trình soạn thảo không tự cập nhật bản `/exec` đang chạy.

## Dữ liệu và cấu trúc bảng

| Cột | Nội dung |
|---|---|
| Mã đơn | `VT-` + `requestId`; mã trả về cho khách khi lưu thành công |
| Request ID (B, ẩn) | Khóa chống ghi trùng khi khách thử gửi lại |
| Thời gian nhận | Thời gian máy chủ nhận đơn lần đầu |
| Họ và tên | Từ 2 đến 80 ký tự |
| Số điện thoại | Từ 9 đến 15 chữ số, giữ số 0 đầu và cách viết có dấu `+` |
| Email (F) | Không bắt buộc, tối đa 254 ký tự; sau Số điện thoại |
| Các bộ quà | Danh sách từng bộ và số lượng, mỗi loại trên một dòng trong ô; tối đa sáu loại, không trùng |
| Tổng số bộ | Tổng số lượng của các dòng; mỗi dòng là số nguyên từ 1 đến 10.000 bộ |
| Dịp tặng | Người thân, khách hàng, đối tác, khác hoặc cần tư vấn |
| Ghi chú | Tối đa 600 ký tự |
| Nguồn form | `quick-form`, `contact-form` hoặc `consultation-form` |
| Payload SHA-256 (L, ẩn) | Kiểm tra một `requestId` chỉ dùng cho một nội dung; không dùng làm mật khẩu |
| Đơn giá từng bộ (VNĐ) | Cột M; mỗi bộ quà một dòng, giá bán từ máy chủ |
| Thành tiền từng bộ (VNĐ) | Cột N; đơn giá nhân số lượng của từng bộ |
| Tổng tiền hàng (VNĐ) | Cột O; tổng thành tiền, lưu số và định dạng tiền Việt |
| Loại yêu cầu (P) | Tư vấn hoặc Đặt hàng |

Sáu tên trong items được máy chủ chấp nhận chính xác: `Hộp quà An Khang`, `Hộp quà Phúc Thọ`, `Hộp quà Thịnh Vượng`, `Hộp quà Phúc An`, `Hộp quà Trường Thọ`, `Hộp quà Phúc Lộc`. Một đơn được ghi trong một hàng, giữ cùng Request ID cho toàn bộ các bộ quà. Cột Các bộ quà hiển thị như `Hộp quà An Khang × 2` và xuống dòng cho bộ tiếp theo; Tổng số bộ là tổng số lượng. Không nhận giá do trình duyệt gửi lên. Khi đã dùng một tab với cấu trúc cũ Bộ quà/Số lượng, chọn tab trống mới (ví dụ DonHangV2) để tránh thay nghĩa dữ liệu cũ; mã không tự ghi đè header. Tạm tính trên trang chỉ là tham khảo theo giá của bộ sưu tập. Bộ Phúc Lành đã được bỏ khỏi danh mục.

Mọi chuỗi do khách nhập được ghi dạng văn bản và thêm dấu nháy đơn bảo vệ để không trở thành công thức, kể cả chuỗi bắt đầu bằng `=`, `+`, `-`, `@` hoặc `'`. Máy chủ còn đọc lại các ô và từ chối ACK nếu phát hiện công thức. [Google mô tả `setValues()` và cách xử lý giá trị bắt đầu bằng `=`](https://developers.google.com/apps-script/reference/spreadsheet/range#setvaluesvalues).

Email có thể bỏ qua hoặc để chuỗi rỗng. Máy chủ kiểm tra định dạng và không đưa Email vào ACK hoặc URL. Với bảng cũ đúng 11, 12 hoặc 15 tiêu đề và các cột sau chưa có dữ liệu, mã bổ sung phần còn thiếu, chuyển nguyên cột Email từ L sang F và thêm P Loại yêu cầu. Các trường cũ được giữ nguyên, B và L mới được ẩn. Cấu trúc 15 cột đã chuyển Email nhưng chưa có P cũng được nhận để tiếp tục migration bị ngắt. Nếu vùng cột mới đã có dữ liệu hoặc cấu trúc không khớp, mã từ chối thay vì ghi đè. Fingerprint của đơn không có Email tương thích phiên bản 1.

`ScriptLock` bao quanh tìm `requestId` và ghi hàng: gửi lại cùng ID và cùng nội dung trả về cùng mã đơn; ID đã dùng với nội dung khác bị từ chối. Không xóa cột ID hoặc sửa các cột kỹ thuật trong Sheet. Chỉ một Apps Script deployment/project phụ trách tab này để khóa có hiệu lực chung. [Tài liệu LockService](https://developers.google.com/apps-script/reference/lock/lock-service).

## Giao thức frontend và bridge, phiên bản 1

Mã dùng iframe nhỏ để mở HTML Service, sau đó gọi máy chủ qua `google.script.run`. Đây là API bất đồng bộ chính thức của HTML Service, có callback thành công và thất bại. Mã không dùng `fetch(..., {mode: 'no-cors'})`, không coi phản hồi opaque hoặc sự kiện iframe `load` là lưu thành công. [HTML Service: giao tiếp với máy chủ](https://developers.google.com/apps-script/guides/html/communication).

Google đặt HTML Service trong iframe sandbox. `ALLOWALL` cho phép landing page nhúng bridge; bridge kiểm tra origin trước khi nhận thông tin. Đặt landing page là tài liệu đầu trang của tab, không nhúng cả landing page trong một iframe bên ngoài. [Sandbox của HTML Service](https://developers.google.com/apps-script/guides/html/restrictions), [XFrameOptionsMode](https://developers.google.com/apps-script/reference/html/x-frame-options-mode).

1. Frontend tạo `requestId` ngẫu nhiên, thí dụ `crypto.randomUUID()`, và `nonce` ngẫu nhiên riêng cho lần kết nối. ID dài 16–80 ký tự; nonce dài 16–160 ký tự, chỉ chữ ASCII, số, `_`, `-`.
2. Gắn listener `message` **trước** khi thêm iframe. Mở iframe tại:

   ```text
   WEB_APP_URL?origin=ENCODED_LOCATION_ORIGIN&requestId=REQUEST_ID&nonce=NONCE
   ```

   Chỉ ba tham số kỹ thuật nằm trong URL. Tên, số điện thoại, bộ quà, số lượng và ghi chú không được đưa vào query string.
3. Bridge gửi READY:

   ```js
   { type: 'VUA_TOI_ORDER_READY', version: 1, requestId, nonce }
   ```

4. Frontend kiểm tra cấu trúc, phiên bản, ID, nonce và origin Google. Sau READY hợp lệ, lưu chính xác `event.source` và `event.origin` làm đối tác giao tiếp. HTML Service còn có iframe sandbox bên trong nên nguồn READY có thể khác `iframe.contentWindow`.

   ```js
   function isGoogleBridgeOrigin(origin) {
     try {
       const url = new URL(origin);
       return url.origin === origin && url.protocol === 'https:' && !url.port && (
         url.hostname === 'script.google.com' ||
         url.hostname === 'script.googleusercontent.com' ||
         url.hostname.endsWith('-script.googleusercontent.com') ||
         url.hostname.endsWith('.script.googleusercontent.com')
       );
     } catch { return false; }
   }
   ```

   Đây là allowlist cho các origin triển khai Google hiện dùng, cần xác nhận lại khi kiểm thử Web App thật. Không nhận mọi miền `googleusercontent.com`, không nhận origin `null`, không mở rộng thành `*` nếu gặp lỗi. Sau READY, RESULT phải đến từ đúng source và origin đã lưu. [Hướng dẫn `postMessage` về `origin`, `source` và `targetOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).
5. Gửi thông tin tới source đã lưu với `targetOrigin` chính xác:

   ```js
   bridgeSource.postMessage({
     type: 'VUA_TOI_ORDER_SUBMIT', version: 1, requestId, nonce,
     payload: {
       requestId,
       name: 'Nguyễn Văn A',
       phone: '0935123456',
       email: 'khach@example.com',
       items: [
         {product: 'Hộp quà An Khang', quantity: 2},
         {product: 'Hộp quà Phúc An', quantity: 3}
       ],
       occasion: 'Biếu người thân',
       notes: '',
       source: 'contact-form'
     }
   }, bridgeOrigin);
   ```

   `items` là mảng từ 1 đến 6 phần tử, mỗi phần tử chỉ có `product` và `quantity`. Mỗi loại xuất hiện một lần. `quantity` là số, không phải chuỗi hoặc khoảng số lượng. Không gửi khóa product/quantity ở cấp đơn. Form nhanh có thể bỏ `occasion` và `notes`; máy chủ dùng `Cần tư vấn` và chuỗi rỗng. Không thêm khóa khác vào `payload`.
6. Bridge gọi `google.script.run.saveOrder(payload, origin)`. Kết quả sau khi ghi và đọc lại đúng hàng:

   ```js
   {
     type: 'VUA_TOI_ORDER_RESULT', version: 1, requestId, nonce,
     saved: true, orderId: 'VT-' + requestId
   }
   ```

   Phản hồi không chứa tên, điện thoại hoặc dữ liệu đơn. Frontend chỉ báo đã nhận yêu cầu khi có ACK này và `orderId` đúng định dạng.
7. Nếu lỗi, bridge trả:

   ```js
   {
     type: 'VUA_TOI_ORDER_RESULT', version: 1, requestId, nonce,
     saved: false,
     error: { code: 'STORAGE_ERROR', message: '…', retryable: true }
   }
   ```

   Mã lỗi và thông báo an toàn không chứa dữ liệu khách hoặc thông báo lỗi nội bộ Google. `retryable` không có nghĩa chắc chắn chưa ghi; lỗi mạng có thể xảy ra sau khi Sheet đã nhận hàng.

## Hết thời gian và gửi lại

- Chờ tối đa 25 giây cho toàn bộ bắt tay và phản hồi. Vô hiệu hóa nút trong lúc gửi để tránh khách bấm liên tiếp.
- Hết thời gian phải báo “Chưa xác nhận được đơn”, giữ thông tin người dùng đã nhập và cho thử lại hoặc mở Zalo. Không báo “Đặt hàng thành công”.
- Khi thử lại cùng nội dung, giữ **cùng `requestId`**, có thể tạo nonce mới và iframe mới. Nếu lần trước đã ghi nhưng phản hồi bị mất, máy chủ tìm hàng cũ và trả cùng mã đơn, không thêm hàng.
- Khi người dùng chủ động sửa nội dung để tạo yêu cầu khác, tạo ID mới. Không tự đổi ID chỉ vì một lần bị timeout. Sau ACK thành công, ID đã dùng không được tái sử dụng cho đơn mới.
- Listener và iframe phải được dọn khi kết thúc hoặc timeout; bỏ qua ACK muộn từ kết nối cũ. Giữ retry ID và nội dung trong bộ nhớ của trang, không lưu thông tin cá nhân vào `localStorage` hoặc URL. Tải lại trang có thể làm mất ID retry; không hứa chống trùng qua lần tải lại hoặc trình duyệt khác.
- Nếu thiếu URL cấu hình, báo kênh đặt hàng chưa được kết nối và cung cấp [Zalo Vua Tỏi](https://zalo.me/0935176188). Không tạo ACK giả hoặc lưu đơn âm thầm trên trình duyệt.

Origin allowlist và nonce chỉ bảo vệ giao tiếp đúng cửa sổ; endpoint công khai chưa có CAPTCHA, xác thực khách hay hạn mức theo IP. Apps Script có quota, có thể trả lỗi hoặc timeout khi quá tải. Nếu cần tiếp nhận lưu lượng lớn hoặc chống spam mạnh hơn, thêm tầng máy chủ phù hợp. [Quota Apps Script](https://developers.google.com/apps-script/guides/services/quotas).

## Kiểm tra trước khi sử dụng thật

Mã có kiểm thử local bằng mock Apps Script trong [Code.test.cjs](Code.test.cjs); chạy `node integrations/google-apps-script/Code.test.cjs` từ thư mục dự án. Các kiểm thử mock độc lập với phép kiểm tra Google thật đã ghi ở phần trạng thái triển khai.

Sau khi cấu hình và triển khai, kiểm tra trên desktop và điện thoại:

1. Gửi đơn thử với ít nhất hai bộ quà và số lượng khác nhau; đối chiếu đủ từng bộ/số lượng, tổng số bộ, mã đơn, thời gian và số 0 đầu điện thoại trong Sheet. Chỉ sau ACK trang mới hiển thị xác nhận.
2. Gửi lại cùng ID/nội dung: vẫn một hàng và cùng mã đơn. Sửa nội dung nhưng giữ ID phải bị từ chối; đơn mới với ID mới tạo hàng mới.
3. Thử mảng items rỗng, trùng loại bộ quà, số lượng 0, số thập phân, bộ quà ngoài sáu tên và điện thoại thiếu số: máy chủ từ chối, không thêm hàng.
4. Thử ghi chú `=1+2` hoặc `@SUM(1,2)`: ô là văn bản, không chạy công thức.
5. Chặn mạng hoặc dùng URL không hợp lệ: trang báo chưa xác nhận, không báo thành công. Khi kết nối phục hồi, thử lại cùng ID để kiểm tra chống trùng.
6. Mở trang từ origin chưa cho phép: không nhận đơn. Kiểm tra chế độ riêng tư để chắc Web App không bắt khách đăng nhập.
7. Xác nhận Zalo mở đúng số `0935176188`. Đổi mục đích tặng và chọn từng bộ quà để kiểm tra cả hai form.

Kết nối Google Sheets đã hoạt động từ landing page local. Landing page chưa được đưa lên hosting. Chưa kiểm thử qua cửa sổ ẩn danh hoặc từ tên miền công khai; cần kiểm tra lại sau khi bổ sung origin hosting.

## Giá bán và kiểm tra thực tế phiên bản 3

Giá máy chủ: An Khang 659.000; Phúc Thọ 639.000; Thịnh Vượng 399.000; Phúc An 655.000; Trường Thọ 399.000; Phúc Lộc 389.000 VNĐ/bộ. Khách chỉ gửi tên bộ và số lượng; gửi thêm khóa price/total bị từ chối. Giá được ghi tại thời điểm nhận đơn; gửi lại cùng yêu cầu dùng giá đã lưu, không dùng giá mới từ danh mục. Cột Tổng tiền hàng không gồm phí giao nhận chưa được xác nhận.

Hàm backfillPricing_ chỉ điền các dòng có danh sách bộ quà hợp lệ và cả ba ô M/N/O đang trống, không có công thức. Giá có sẵn, dữ liệu nhập tay hoặc dòng không đúng cấu trúc được giữ nguyên. Đơn cũ được bổ sung theo bảng giá đang áp dụng; các snapshot giá có sẵn không tính lại.

Đã kiểm tra Google thật ngày 16/10/2026: M5 hiển thị Trường Thọ 399.000 ₫ và Phúc Lộc 389.000 ₫; N5 có 798.000 ₫ và 1.167.000 ₫; O5 là số 1965000, hiển thị 1.965.000 ₫. O2 = 3283000, O3 = 639000 xác nhận các đơn cũ đã được bổ sung. Hàng 5 ghi rõ KIỂM THỬ GIÁ – KHÔNG XỬ LÝ. Bộ kiểm thử local có 26 trường hợp, gồm chống sửa giá, tổng nhiều bộ, tương thích dữ liệu cũ và giữ giá lịch sử.

## Nhận tư vấn và sắp cột — phiên bản 4

Bản /exec đang dùng phiên bản 4 (11:43 ngày 16/10/2026), cùng deployment URL và quyền truy cập đã được cho phép. Sheet vẫn riêng tư. Bảng có 16 cột theo orders-headers.csv; B (Request ID) và L (Payload SHA-256) được ẩn thay vì xóa. Email nằm ở F sau Số điện thoại. M/N/O vẫn là đơn giá, thành tiền và tổng tiền; P là Loại yêu cầu. Đơn trước đây có nguồn quick-form/contact-form được bổ sung nhãn Đặt hàng nếu P trống, không thay nhãn nhập tay/công thức.

Payload tư vấn chỉ nhận:

```js
{kind:'consultation', name:'Khách tư vấn', phone:'0000000000',
 email:'qa@example.invalid', source:'consultation-form', requestId:'request-lead-0000001'}
```

Email có thể để trống hoặc bỏ qua. Không gửi items, occasion, notes, giá hoặc tổng tiền trong yêu cầu tư vấn; các khóa ngoài hợp đồng bị từ chối. Server lưu nhãn Tư vấn, các ô quà/số lượng/tiền trống, dùng fingerprint riêng. Các đơn đặt hàng cũ không có kind vẫn tương thích; giá và fingerprint lịch sử được giữ nguyên. Cả hai loại cùng dùng bridge v1 và chỉ nhận ACK sau khi ghi/flush/đọc lại đúng dữ liệu.

Đã kiểm tra thực tế: hàng 6 KIỂM THỬ TƯ VẤN – KHÔNG XỬ LÝ, Email F6=qa-vuatoi-consult@example.invalid, P6=Tư vấn, G6/H6/O6 trống. Hàng 7 KIỂM THỬ HAI TAB – KHÔNG XỬ LÝ, An Khang × 1 và Phúc Lộc × 2, H7=3, O7=1437000, P7=Đặt hàng. M7/N7 có đủ giá từng bộ và thành tiền. Email cũ F3 giữ đúng giá trị, tổng tiền đơn thực ở O4 vẫn là 5308000. Không xử lý các hàng đánh dấu kiểm thử như đơn khách.

Kiểm thử mock có 30 trường hợp Apps Script và 11 trường hợp frontend; bổ sung migration V3, migration bị ngắt, nhận tư vấn không có tiền, chống gửi khóa lạ và giữ lựa chọn quà sau khi gửi tư vấn. moveColumns dùng thao tác cột gốc của Google: https://developers.google.com/apps-script/reference/spreadsheet/sheet#movecolumnscolumnspec-destinationindex
