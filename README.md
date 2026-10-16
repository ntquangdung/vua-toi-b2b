# Hộp quà Vua Tỏi — landing page local

Trang tĩnh gồm HTML, CSS, JS và assets; chưa triển khai hosting. Tích hợp nhận đơn qua Google Apps Script/Google Sheets đã triển khai và kiểm tra thực tế ngày 16/10/2026. URL Web App được cấu hình trong site-config.js; đơn từ landing page local ghi vào tab DonHang của Sheet do người dùng cung cấp.

Mã nguồn đã được đẩy lên repository Private https://github.com/ntquangdung/vua-toi-b2b, nhánh main. Cấu hình build/hosting và trạng thái triển khai nằm trong DEPLOYMENT.md. Đã chọn Cloudflare Pages, đang chờ đăng nhập tài khoản để triển khai; chưa có bản ghi DNS thực tế cho b2b.vuatoi.com.vn.

## Nguồn thông tin

Thông tin sản phẩm, tên bộ, thành phần, giá và hotline được đọc từ 8 ảnh trong ZIP HỘP QUÀ TẶNG VUA TỎI.zip người dùng cung cấp. Chi tiết đối chiếu nằm trong assets/gift-collection/source-map.json. Theo yêu cầu bổ sung ngày 16/10/2026, mục Về Vua Tỏi sử dụng tên công ty, địa chỉ, email và thông tin giới thiệu từ website chính thức https://vuatoi.com.vn/. Giá và thành phần các bộ quà vẫn theo ảnh ZIP. Các liên kết website, câu chuyện thương hiệu, chính sách và Facebook https://www.facebook.com/vuatoidacsanlyson mở trong tab mới.

- An Khang: 2 hủ tỏi đen — giá gốc 736.000 ₫, giá KM 659.000 ₫.
- Phúc Thọ: 2 hủ mật ong tỏi đen — giá gốc 720.000 ₫, giá KM 639.000 ₫.
- Thịnh Vượng: 1 chai rượu tỏi đen — 399.000 ₫; ảnh chỉ có một giá, không gắn nhãn KM.
- Phúc An: 1 tỏi đen + 1 mật ong tỏi đen — giá gốc 728.000 ₫, giá KM 655.000 ₫.
- Trường Thọ: 1 tỏi đen + 1 tỏi Lý Sơn – ớt xiêm rừng — giá gốc 454.000 ₫, giá KM 399.000 ₫.
- Phúc Lộc: 1 mật ong tỏi đen + 1 tỏi Lý Sơn – ớt xiêm rừng — giá gốc 446.000 ₫, giá KM 389.000 ₫.

Ảnh không ghi ngày hiệu lực giá, trọng lượng/dung tích đọc được hoặc điều kiện chiết khấu. Trang ghi giá tham khảo và hướng dẫn xác nhận khi đặt; không sử dụng badge giảm tới 35% hoặc nội dung Tết. Giá gốc trong ảnh được gạch ngang một nét và đặt cạnh giá KM; nguyên giá được ghi trong source-map.json bằng original_price. Tên đầy đủ sản phẩm tỏi Lý Sơn – ớt xiêm rừng được xác nhận từ bảng giá 7.png; đó là một sản phẩm kết hợp.

Bộ Phúc Lành đã được bỏ khỏi giao diện và cả hai form theo yêu cầu. Ảnh gốc vẫn lưu để đối chiếu. Giá khởi điểm của danh mục hiện tại là 389.000 ₫.

## Ảnh và giao diện

Logo chính thức giữ nguyên. Ảnh PNG gốc nằm trong assets/gift-collection. Bản WebP giữ nguyên toàn bộ ảnh, chỉ nén định dạng để tải nhanh. CSS dùng cửa sổ ảnh để lấy vùng hộp quà và tránh chữ khuyến mại/Tết in sẵn, không tạo hay thay đổi sản phẩm.

## Hướng thiết kế

Bố cục tham khảo trực tiếp https://b2b.farmersmarket.vn/: headline in hoa, form ở đầu, khung đỏ viền vàng, dải vàng, các phần giới thiệu bộ quà bằng ảnh lớn + thành phần + giá. Bản Vua Tỏi giữ thông tin từ ZIP, không sử dụng dữ liệu sản phẩm, đối tác, năng lực, điều kiện ưu đãi hay nội dung Tết 2027 của trang mẫu.

Palette gồm đỏ #AC080E, kem #FFF6E9, kem sáng #FEFBF2, vàng kim #C79740 và vàng nhạt #FFE99A. Dải thông tin dùng vàng tươi #FFDE59. Token nằm ở đầu styles.css. Font nội dung và giá tiền Manrope, font tiêu đề phụ Red Rose, font tiêu đề HỘP QUÀ VUA TỎI Playfair Display được lưu local trong assets/fonts kèm giấy phép OFL riêng. Red Rose cũng xuất hiện trên trang mẫu. Playfair Display được bổ sung từ kho Google Fonts chính thức, lưu local kèm playfair-OFL.txt; hỗ trợ tiếng Việt. Giá tiền ở cả hai thẻ hero và toàn trang dùng Manrope, số lining/tabular để đồng nhất. Ký hiệu ® được thêm cạnh tên thương hiệu theo yêu cầu của người dùng; logo ảnh gốc giữ nguyên. Nguồn font: https://github.com/google/fonts/tree/main/ofl/manrope và https://github.com/google/fonts/tree/main/ofl/redrose. Các font Be Vietnam Pro cũ vẫn được lưu làm tài sản tham khảo, hiện không tải trên trang.

Hai minh họa SVG nguyên bản garlic-ivory.svg và garlic-black.svg thay vị trí nhân vật trang trí. Đây là minh họa củ tỏi; ảnh sản phẩm vẫn dùng ảnh thật từ ZIP. Trang gồm hero hai bộ nổi bật + hai tab Tư vấn/Đặt hàng, dải số liệu của chính bộ sưu tập, sáu bộ quà dạng lưới 3 cột × 2 hàng trên desktop, 2 cột trên tablet/điện thoại từ 360px và 1 cột trên điện thoại nhỏ hơn 360px, chọn dịp tặng, thông tin lựa chọn, form cuối và FAQ.

Khung nội dung desktop tối đa 1040px, tiêu đề hero 49–56px, nội dung chính 14–15px. Typography và khoảng cách được cân lại: nhãn form 12–13px, input 14–15px desktop/16px mobile; ĐẶT HÀNG dùng Manrope 18px/800, nút cao 56px; TƯ VẤN 14px, cao 46px. Form đầu trang thu gọn header, họ tên/điện thoại chung một hàng từ 360px. Mỗi dòng bộ quà có số lượng riêng, nút Thêm bộ quà/Xóa lựa chọn; cả hai form giữ chiều cao danh sách cố định và cuộn bên trong khi chọn nhiều; tổng tạm tính luôn có vùng riêng nên thêm/xóa/chọn quà không đẩy nền hoặc nút đặt hàng. Nút ĐẶT HÀNG ở form đầu trang dùng chữ vàng kim viền trắng trên nền đỏ. Khoảng cách section 48px desktop/36px mobile; tiêu đề 29px/25px, giá sản phẩm 25px/23px. Phần bổ sung cuối styles.css quản lý các tỷ lệ này.

Hiệu ứng gồm xuất hiện một lần khi cuộn, xuất hiện đầu trang, hover nút/ảnh nhẹ và mở hộp chi tiết. Dùng IntersectionObserver; hỗ trợ prefers-reduced-motion. Khi tắt JavaScript hoặc người dùng giảm chuyển động, nội dung vẫn hiển thị đầy đủ.

## Chức năng

- Menu mobile và điều hướng đến từng phần.
- Hiển thị đủ 6 bộ quà trong bộ sưu tập; mục chọn quà theo thành phần đã được gỡ để khách đến danh mục nhanh hơn.
- Xem ảnh/thành phần/giá trong hộp thoại; hỗ trợ Escape và bàn phím.
- Chọn bộ quà hoặc dịp tặng sẽ điền sẵn vào form.
- Tab TƯ VẤN hiển thị đầu tiên với họ tên, số điện thoại và Email không bắt buộc; gửi liên hệ để nhân viên gọi lại, không yêu cầu chọn sản phẩm.
- Hai form nhận yêu cầu đặt hàng: tên, điện thoại, Email không bắt buộc, nhiều bộ quà và số lượng riêng từng loại; form cuối có thêm dịp tặng/lời nhắn. Email hợp lệ được lưu ở cột Email (F) trong Sheet. Form đầu trang đã bỏ liên kết Bảo mật thông tin dưới nút đặt hàng.
- gift-picker.js đồng bộ danh sách chọn giữa hai form trong bộ nhớ trang, thêm/xóa tối đa sáu loại, chặn chọn trùng và tính tổng tạm tính theo ảnh gốc. Bấm ĐẶT HÀNG trên thẻ bổ sung vào danh sách, giữ các bộ đã chọn. Giá/giao nhận cần được xác nhận khi đặt.
- Payload gửi nhận dùng items: [{product, quantity}, ...]. Code.gs lưu một hàng cho mỗi đơn, cột Các bộ quà có đủ từng loại/số lượng và Tổng số bộ có tổng; không lấy giá do trình duyệt gửi lên.
- Trong form đặt hàng, hai nút xếp dọc, mỗi nút rộng trọn hàng: ĐẶT HÀNG có hiệu ứng phóng/thu nhẹ chu kỳ 1,6 giây, hỗ trợ giảm chuyển động; TƯ VẤN không có animation và mở https://zalo.me/0935176188. Nút ĐẶT HÀNG trong danh mục dùng nền đỏ, chữ trắng.
- orders.js xử lý kiểm tra dữ liệu, trạng thái đang gửi/thành công/lỗi; chỉ báo thành công sau xác nhận đã lưu từ Apps Script. Dữ liệu khách không được đưa vào URL hoặc lưu localStorage.
- Giữ mã yêu cầu khi gửi lại cùng nội dung để tránh đơn trùng sau lỗi mạng.
- Không có thanh toán trực tuyến; yêu cầu gửi đi cần được Vua Tỏi xác nhận.

## Chạy local

    python -m http.server 8765 --bind 127.0.0.1

Mở http://127.0.0.1:8765/. Luồng gửi đơn cần http/https, không chạy qua file://.

## Kết nối nhận đơn Google Sheets

Xem integrations/google-apps-script/README.md. Mã server nằm trong Code.gs; URL Web App /exec đã được điền tại site-config.js. ID Sheet và danh sách origin được cấu hình ở Script Properties của Apps Script, không đưa vào frontend. Web App thực thi bằng cmavuatoilyson@gmail.com, cho phép khách gửi đơn không đăng nhập; Sheet giữ quyền xem Hạn chế, chỉ chủ sở hữu và những người được chia sẻ mới mở được. Hiện danh sách truy cập chỉ có chủ sở hữu. Không cung cấp API đọc danh sách khách.

Không dùng fetch no-cors để báo gửi thành công. Trang nhúng bridge HtmlService, trao đổi qua postMessage rồi gọi google.script.run; server xác nhận ghi Sheet trước khi trả kết quả. Đã gửi một đơn ghi rõ KIỂM THỬ KẾT NỐI – KHÔNG XỬ LÝ: An Khang × 2, Phúc An × 3; đối chiếu ô Các bộ quà, tổng 5 bộ và điện thoại thử 0000000000 trong Sheet. Không xử lý đơn này như đơn khách. Luồng hoạt động từ http://127.0.0.1:8765; khi có tên miền hosting cần cập nhật ALLOWED_ORIGINS và kiểm thử lại từ origin đó.

## Cập nhật bố cục ngày 16/10/2026

Sáu thẻ quà giữ thứ tự hiện có, phối đỏ–vàng–đỏ ở hàng đầu và vàng–đỏ–vàng ở hàng sau. Phúc Thọ, Phúc An và Phúc Lộc dùng lớp gift-card--gold: nền vàng chuyển sắc #E5BA5D → #F4D581 → #FFE79C, tên bộ màu đỏ. Ảnh sản phẩm và giá giữ nguyên. Các thẻ vẫn xếp 3 cột desktop, 2 cột điện thoại từ 360px và 1 cột trên màn hình nhỏ hơn.

Email được bổ sung ở cả hai form, không bắt buộc. Apps Script phiên bản 2 thêm cột L vào cấu trúc 11 cột đã biết, không thay đổi hàng cũ; đơn cũ không có Email vẫn giữ mã chống trùng tương thích. Đã gửi một đơn kiểm thử Email từ form đầu trang và đối chiếu ô L3 trong Sheet.

## Giá trị đơn hàng trong Sheet

Apps Script phiên bản 3 bổ sung cột M Đơn giá từng bộ (VNĐ), N Thành tiền từng bộ (VNĐ) và O Tổng tiền hàng (VNĐ). Giá bán được lấy từ VUA_TOI_UNIT_PRICES_ trên máy chủ, tương ứng giá đang hiển thị trên landing page; không nhận giá hoặc tổng do khách gửi lên. Thành tiền = đơn giá × số lượng. Cột O lưu số để lọc và cộng, hiển thị định dạng tiền Việt. Tổng chỉ gồm tiền hàng, giao nhận vẫn xác nhận riêng.

Bảng cũ đúng cấu trúc 11/12 cột được bổ sung cột ở cuối; các dòng hợp lệ đang thiếu cả ba giá trị được điền theo bảng giá hiện tại. Không ghi đè giá đã lưu, trường nhập tay hoặc công thức. Khi giá bán thay đổi, giá các đơn đã lưu không bị tính lại; cần đồng thời cập nhật VUA_TOI_UNIT_PRICES_ và gift-catalog trong index.html cho các đơn mới.

Đã đối chiếu đơn kiểm thử giá ở hàng 5: Trường Thọ 399.000 × 2 = 798.000 ₫; Phúc Lộc 389.000 × 3 = 1.167.000 ₫; tổng 1.965.000 ₫. Các đơn cũ ở hàng 2 và 3 đã có tổng tương ứng 3.283.000 ₫ và 639.000 ₫. Nội dung giao diện đã bỏ Mã số thuế, dùng Hotline: 0935 176 188 và cách viết hủ theo yêu cầu.

## Hai tab và cấu trúc Sheet — phiên bản 4

- Tab TƯ VẤN mở mặc định, gửi liên hệ với kind=consultation và source=consultation-form. Cột Loại yêu cầu (P) ghi Tư vấn; sản phẩm, số lượng và các ô tiền để trống. Đây là yêu cầu nhân viên liên hệ, không tự mở Zalo. Nút TƯ VẤN trong form đặt hàng vẫn mở Zalo theo luồng hiện có.
- Tab ĐẶT HÀNG giữ danh sách nhiều bộ quà, số lượng riêng, tạm tính và cách gửi cũ. Chọn một bộ quà từ danh mục kích hoạt tab ĐẶT HÀNG. Chuyển tab điền thông tin liên hệ vào các ô trống của tab đích; không ghi đè thông tin đã nhập. Tabs hỗ trợ phím mũi tên/Home/End và bị khóa khi gửi.
- Nền mục Chọn quà đổi từ vàng sọc sang chuyển sắc đỏ trầm #710B14 / #A20B17 / #780C17, ánh vàng nhẹ, tiêu đề vàng sáng và thẻ kem viền vàng.
- Sheet: Email được chuyển nguyên cột L cũ sang F bằng moveColumns; các cột giá M/N/O giữ vị trí. Request ID ở B và Payload SHA-256 ở L được ẩn, vẫn dùng cho chống trùng/đối chiếu. Cột P ghi Loại yêu cầu. Migration nhận đúng cấu trúc cũ 11/12/15 cột, giữ dữ liệu, từ chối cột lạ đã có dữ liệu, có thể tiếp tục khi bị ngắt sau bước chuyển Email.
- Đã triển khai cùng URL /exec, phiên bản 4 ngày 16/10/2026. Đã gửi hai yêu cầu ghi rõ KIỂM THỬ ... – KHÔNG XỬ LÝ: tư vấn ở hàng 6 (Email F6, P6=Tư vấn, không có tiền); đặt hàng ở hàng 7 (An Khang × 1 + Phúc Lộc × 2, tổng 3 bộ / 1.437.000 ₫, P7=Đặt hàng). Đối chiếu trực tiếp Sheet, cả hai frontend nhận ACK. Email thử dùng miền example.invalid, điện thoại 0000000000.
- Kiểm tra desktop 1280×900 và mobile 390×844: không tràn ngang, tab và bàn phím hoạt động, thêm bộ quà giữ nguyên chiều cao form 752,23px và vùng danh sách 187,99px trên mobile. Console không báo lỗi. Kiểm thử local: 30 phía Apps Script, 11 phía giao tiếp biểu mẫu.

## Cập nhật mục chọn quà

Đã gỡ toàn bộ mục CHỌN QUÀ THEO THÀNH PHẦN theo yêu cầu, gồm ba thẻ Tỏi đen / Mật ong tỏi đen / Tỏi Lý Sơn – ớt xiêm rừng và liên kết phụ Thịnh Vượng. Menu không còn liên kết tới chon-san-pham; bộ sưu tập sáu bộ quà vẫn hiển thị đầy đủ ngay sau dải thông tin. Mã JavaScript và CSS của mục cũ đã được xóa.

## Cân đối khối mời đặt hàng

Khối đầu bộ sưu tập được bố trí thành hai phần: thông điệp bên trái, giá khởi điểm và nút ĐẶT HÀNG đi cùng nhau bên phải. Nền kem chuyển vàng nhạt, viền vàng và điểm nhấn đỏ; bỏ vòng trang trí lớn, giảm khoảng cách đến tiêu đề bộ sưu tập. Từ màn hình 900px, hai phần xếp dọc; dưới 360px nút chiếm trọn hàng để tránh ép giá.

## Mở trang để gửi tư vấn / đặt hàng

Mở trực tiếp index.html bằng file:// chỉ dùng xem giao diện; biểu mẫu không gửi dữ liệu từ origin này. Chạy CHAY_LOCAL.cmd và mở http://127.0.0.1:8765/. Giữ cửa sổ server mở trong lúc sử dụng. Nếu cổng 8765 đã có server của dự án, dùng ngay liên kết HTTP. Trang file hiện thông báo cụ thể khi khách bấm gửi, giữ nguyên thông tin đã nhập.
