# Auth Lifecycle Lab

Demo chạy thật trên localhost cho bài **Beyond the Login Screen**. Một event “Đấu giá thiện nguyện — Vì trẻ em”, vật phẩm “Tranh Bình Minh”, người dùng Anna.

Giao diện dùng Be Vietnam Pro được lưu tại `wwwroot/fonts`, kèm giấy phép SIL Open Font License; không gọi dịch vụ font bên ngoài lúc chạy. Hướng dẫn diễn chi tiết nằm trong tài liệu này; giao diện chỉ giữ nhãn thao tác, trạng thái và nhật ký. Permission được hiển thị bằng badge monospace.

## Chạy

Cần .NET SDK 8+; Node.js 18+ chỉ dùng cho integration tests. Không cần npm install, NuGet package ngoài framework, database hoặc tài khoản provider.

```powershell
dotnet run --project Auth/demo --no-launch-profile
```

Mở http://127.0.0.1:5090. Tài khoản demo: **anna / Anna@123!**.

```powershell
dotnet build Auth/demo
node --test Auth/demo/tests/auth.test.mjs
```

Tests tự mở server ở cổng **5091**, tạo các lab riêng và đóng tiến trình khi kết thúc. Cổng đó phải trống; server demo 5090 có thể chạy song song nếu không rebuild file đang bị khóa trên Windows.

## Diễn demo trong 8–10 phút

### 01 — Xác thực
- Reset: Anna chưa đăng nhập và chưa có role.
- Xem sản phẩm → **200** ngay cả khi chưa đăng nhập: đây là dữ liệu công khai.
- Thử đặt giá hoặc lưu sản phẩm khi chưa đăng nhập → **401**.
- Thử sai mật khẩu → **401**; đăng nhập đúng → **200**, nhận access/refresh token.

### 02 — Duy trì đăng nhập
- Sao chép token từ A; bấm **B kiểm tra danh tính** → `GET /api/me` trả **200**, xác định Anna dù B không nhập password.
- `/api/me` cần credential hợp lệ nhưng không cần role. Xem sản phẩm công khai không được dùng để chứng minh bearer token có hiệu lực.
- Hai client panel là hai bên gọi logic trong cùng lab, không phải hai browser độc lập.

### 03 — Phân quyền RBAC
- Chưa có role sau login: đặt giá, lưu sản phẩm, đóng event đều **403**.
- Chọn **Bidder**: đặt giá **200**; lưu sản phẩm và đóng event **403**.
- Chọn **Auctioneer**: có `product:update` và `event:close`; sửa tên/mô tả rồi bấm **Lưu sản phẩm**. Thẻ sản phẩm cập nhật ngay; role này không tự có quyền đặt giá.
- Chọn cả hai: có đủ ba permission; bỏ một role thì mất đúng bộ quyền role đó cấp.
- Có 4 tổ hợp: không có role, Bidder, Auctioneer, cả hai. Xem sản phẩm luôn công khai.
- Đóng event → đặt giá tiếp **409** nếu vẫn có Bidder. Metadata sản phẩm vẫn có thể chỉnh sửa; không sửa giá bid hoặc dữ liệu giao dịch qua form này.
- Các nút cho phép thử API cả khi thiếu quyền để quan sát server từ chối. Nội dung đang soạn được giữ khi đổi role hoặc request thất bại.

### 04 — Thu hồi
- Reset, đăng nhập, chọn Bidder, sao chép token sang B.
- Gỡ Bidder → đặt giá **403**; B kiểm tra danh tính vẫn **200**.
- Thu hồi refresh → Cấp token mới **401**; B kiểm tra danh tính vẫn **200**.
- Thu hồi access token A → B kiểm tra danh tính và A thử đặt giá đều **401**. Xem sản phẩm vẫn **200**.
- Đăng nhập lại/refresh thành công chỉ thay credential của A; B vẫn giữ bản sao cũ.

## Phạm vi và cơ chế

- Access token là **opaque bearer** ngẫu nhiên 256 bit, mặc định 10 phút; refresh token 30 phút, rotation sau khi dùng. Không phải JWT và không phải triển khai OAuth/OIDC. Server dùng random generator và password hasher của framework.
- Authentication handler kiểm tra token tồn tại, hết hạn và denylist. Role/permission được đọc từ trạng thái server mỗi request; không nhúng role vào access token.
- Thu hồi refresh tác động toàn bộ refresh token của Anna **trong lab**; thu hồi access chỉ tác động token A hiện đang chọn và mọi bản sao của nó. Không tuyên bố đây là hành vi bắt buộc của mọi hệ thống.
- Quyền, chỉnh sửa sản phẩm, bid và đóng event được xử lý dưới cùng một khóa để tránh thay đổi giữa kiểm tra và ghi trong demo một process.
- Lab tách theo cookie HttpOnly/SameSite=Strict. Mở tab cùng browser có thể dùng chung trạng thái server; để hai lab độc lập dùng browser profile/private context khác. Cookie chỉ định sandbox thuyết trình; credential truy cập API vẫn là access token. Trạng thái quá 2 giờ không hoạt động được dọn; tối đa 200 lab.
- Bảng presenter và `/api/lab` là kênh quản trị/quan sát **cố ý không có đăng nhập admin**. Nó cho người thuyết trình nhìn được vật phẩm và quyền dù Anna không có permission. Đây không phải đường đọc dữ liệu của Anna. GET `/api/products/current` công khai. GET `/api/me` cần xác thực; POST `/api/products/current`, `/api/bids`, `/api/event/close` kiểm tra xác thực và permission tương ứng.
- Server chỉ bind loopback, kiểm tra Host/Origin, giới hạn JSON 8 KB; không bật CORS. Không triển khai production. HTTP là ngoại lệ cho localhost; môi trường thật cần HTTPS và thiết kế vận hành đầy đủ.
- Token nằm trong memory của trang, không ghi localStorage hoặc log. Reload trang làm mất credential client; đăng nhập lại để tiếp tục. Reset vô hiệu hóa toàn bộ token cũ trong lab.
- Dữ liệu trong bộ nhớ, không có thanh toán thật, MFA/passkey, recovery, database hoặc SignalR. Slide và PPTX không bị thay đổi bởi demo.

Biến môi trường: `AUTHLAB_PORT` đổi port; `AUTHLAB_ACCESS_SECONDS` đổi hạn access (1–3600 giây, dùng 3 giây trong tests). Endpoint mutation yêu cầu `Origin` bằng origin của server và `Content-Type: application/json`.
