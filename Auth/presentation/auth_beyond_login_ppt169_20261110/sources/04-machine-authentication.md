# 4. Xác thực ứng dụng: Basic, API key, mTLS và DPoP

[Về mục lục](auth-deep-dive.md)

Một dịch vụ chạy nền cũng có thể gọi API mà không có người dùng đang thao tác. API cần nhận biết bên gọi và quyền của nó. Những cơ chế bên dưới giải quyết việc này theo các cách khác nhau; từng phần làm rõ những điểm dễ thắc mắc khi tìm hiểu cơ chế đó.

## 1. HTTP Basic authentication

### 1.1. Client gửi gì?

Client gửi tên tài khoản và mật khẩu trong header:

```http
Authorization: Basic <chuỗi Base64 của tên tài khoản và mật khẩu>
```

**Base64 chỉ là cách biểu diễn dữ liệu. Ai đọc được header có thể lấy lại tên tài khoản và mật khẩu.** Đường truyền cần được bảo vệ, thường bằng HTTPS. [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617.html).

### 1.2. Máy chủ xác thực thế nào?

1. Máy chủ nhận header và đọc thông tin tài khoản.
2. Máy chủ kiểm tra credential theo hệ thống của mình.
3. Nếu hợp lệ, máy chủ xác định danh tính rồi kiểm tra quyền.

Basic không tự tạo access token ngắn hạn. Client có thể gửi lại credential ở nhiều yêu cầu.

### 1.3. Chặn truy cập bằng cách nào?

Máy chủ vô hiệu hóa hoặc thay credential và bảo đảm các nơi kiểm tra nhận biết thay đổi. Header không được để lộ trong nhật ký hoặc chuyển tiếp tới sai dịch vụ.

Basic có thể phục vụ tích hợp đơn giản/hệ thống cũ yêu cầu nó. Nó không tự giải quyết cấp quyền đại diện người dùng, MFA hoặc quản lý token.

## 2. API key

### 2.1. Ý tưởng chính

API key là credential hệ thống cấp cho bên tích hợp. Client trình key; API kiểm tra key để biết bên gọi và quyền được cấp.

Tên “API key” không bảo đảm key có hạn dùng hoặc quyền hẹp. Các thuộc tính đó phải do hệ thống thiết kế.

### 2.2. Mỗi bên giữ gì?

| Bên gọi API | Máy chủ |
|---|---|
| Giữ key để gửi yêu cầu | Giữ dữ liệu kiểm tra key và thông tin quyền |
| Bảo vệ key khỏi rò rỉ | Quản lý chủ sở hữu, trạng thái và thời hạn |

Với key ngẫu nhiên đủ mạnh và chỉ cần so khớp, máy chủ có thể lưu giá trị băm thay key nguyên bản. Nếu cần dùng chính bí mật để ký hoặc gọi hệ thống khác, phải có cách lưu và lấy bí mật an toàn phù hợp.

### 2.3. API kiểm tra thế nào?

1. Client gửi key theo cách API quy định.
2. Máy chủ tìm thông tin và kiểm tra key.
3. Máy chủ kiểm tra key còn hoạt động, còn hạn và có quyền phù hợp.
4. API xử lý yêu cầu nếu các điều kiện đều đạt.

Không đặt key trong URL vì có nguy cơ lộ qua các nơi lưu địa chỉ. Cần đường truyền an toàn và khả năng thu hồi. [OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

### 2.4. Khi thay key thì sao?

Có thể cấp key mới, chuyển bên tích hợp sang key mới rồi vô hiệu hóa key cũ trong khoảng đã quy định. Nên cấp riêng từng bên để biết ai dùng và thu hồi độc lập.

Key nhúng trong mã SPA hoặc ứng dụng di động có thể bị lấy. Không coi đó là bí mật chỉ máy chủ giữ. Với nhu cầu quyền phức tạp hoặc rủi ro cao, phải đánh giá thêm các cơ chế phù hợp.

## 3. mTLS: xác thực bằng chứng chỉ và khóa riêng

### 3.1. Khác HTTPS thông thường ở đâu?

Trong HTTPS thông thường, client kiểm tra danh tính máy chủ. Với **mutual TLS — mTLS**, máy chủ còn yêu cầu client chứng minh mình giữ khóa riêng tương ứng với chứng chỉ được chấp nhận. Hai phía xác thực trong quá trình thiết lập kết nối TLS. [TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html).

### 3.2. Các bên có gì?

| Client | Máy chủ |
|---|---|
| Chứng chỉ và khóa riêng tương ứng | Quy tắc tin cậy và kiểm tra chứng chỉ client |
| Dùng khóa để thực hiện bằng chứng theo TLS | Kiểm tra bằng chứng và ánh xạ sang danh tính |

Chỉ có bản chứng chỉ công khai không đủ giả làm client: còn cần khả năng sử dụng khóa riêng tương ứng.

### 3.3. API cho quyền dựa vào đâu?

Sau khi TLS xác thực client, hệ thống vẫn phải xác định danh tính đó được gọi API nào. Chứng chỉ hợp lệ không có nghĩa được phép dùng mọi tài nguyên.

Nếu TLS kết thúc ở reverse proxy, backend không trực tiếp kiểm tra bằng chứng của client. Backend chỉ nên tin thông tin proxy chuyển khi proxy đã xác minh và không cho người ngoài tự giả header.

### 3.4. Mất khóa hoặc đổi chứng chỉ thì sao?

Cần cấp lại, thu hồi và cập nhật chính sách tin cậy. Xóa một file trên máy không làm bản sao khóa ở nơi khác biến mất. Cũng cần kiểm tra tác động tới kết nối đang mở; không mặc nhiên cho rằng mọi kết nối cũ đã bị ngắt.

mTLS phù hợp khi hạ tầng có khả năng cấp phát, bảo vệ và quản lý chứng chỉ. Chi phí chính nằm ở vận hành khóa và cấu hình các điểm kết thúc TLS.

## 4. mTLS trong OAuth: xác thực client khác với ràng buộc token

### 4.1. Hai việc cần phân biệt

Client có thể dùng mTLS để xác thực khi xin token. Ngoài ra, OAuth còn hỗ trợ **certificate-bound access token**, tức token gắn với chứng chỉ của client.

Với loại token được gắn này:

1. Máy chủ cấp token ghi nhận ràng buộc với chứng chỉ.
2. Client gọi API bằng token qua kết nối dùng chứng chỉ phù hợp.
3. API kiểm tra cả token và ràng buộc chứng chỉ.

Vì vậy, chỉ lấy được chuỗi token chưa đủ dùng. Nhưng client dùng mTLS ở nơi xin token không tự chứng minh API đã kiểm tra ràng buộc này. [RFC 8705](https://www.rfc-editor.org/rfc/rfc8705.html).

### 4.2. Khi đổi chứng chỉ cần xét gì?

Token cũ có thể vẫn gắn với chứng chỉ cũ. Máy chủ cấp token, client và API phải phối hợp về thời hạn và thay khóa. Quyền truy cập và khả năng thu hồi vẫn cần được kiểm tra riêng.

## 5. DPoP: ký bằng chứng cho yêu cầu dùng token

### 5.1. Vấn đề cần giải quyết

Bearer token có thể bị bên lấy được nó sử dụng. DPoP thêm yêu cầu: bên trình token phải tạo được bằng chứng bằng khóa riêng mà token đã gắn với nó.

DPoP viết đầy đủ là **Demonstrating Proof of Possession**. Điểm cốt lõi là **token và bằng chứng giữ khóa được kiểm tra cùng nhau**.

### 5.2. Client gửi thêm gì?

Client tạo một **proof**, là dữ liệu được ký dưới dạng JWT. Nó gắn với yêu cầu cụ thể, gồm những thông tin như phương thức HTTP, địa chỉ, thời điểm và mã định danh; khi dùng với access token còn có thông tin gắn với token. [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html).

### 5.3. Quá trình xử lý

1. Client có một cặp khóa.
2. Client gửi proof khi xin token theo DPoP.
3. Máy chủ cấp token gắn với khóa công khai tương ứng.
4. Client gọi API bằng token và proof cho yêu cầu đó.
5. API kiểm tra token, chữ ký, sự phù hợp của yêu cầu và điều kiện chống dùng lại proof.

Proof không phải một header cố định để sao chép cho mọi lần gọi.

### 5.4. Giới hạn là gì?

DPoP giúp khi attacker lấy token nhưng không tạo được proof hợp lệ. Nếu attacker kiểm soát cả client và có thể yêu cầu ký, lợi ích giảm.

Nó không thay HTTPS hoặc kiểm tra quyền tài nguyên. Muốn dùng phải có hỗ trợ từ client, máy chủ cấp token và API. Các chi tiết như nonce, địa chỉ qua proxy, chống dùng lại proof và thay khóa là phần nghiên cứu sau luồng chính.

## 6. Cần chọn theo yêu cầu nào?

| Yêu cầu | Điều phải tìm hiểu |
|---|---|
| Tích hợp đơn giản | Cơ chế bên kia hỗ trợ, bảo vệ credential và thu hồi |
| Danh tính riêng từng dịch vụ | Cách cấp credential, giới hạn quyền và theo dõi |
| Giảm secret dài hạn | Khả năng cấp token/chứng chỉ ngắn hạn và tự gia hạn |
| Token bị lấy không đủ sử dụng | Khả năng ràng buộc khóa bằng mTLS hoặc DPoP |

**Workload identity** là cách cấp và quản lý danh tính cho ứng dụng hoặc tác vụ đang chạy. Đây là nhu cầu tổ chức danh tính, không phải một header duy nhất. Cách thực hiện phụ thuộc nền tảng.

## Đọc tiếp

[Phân quyền và xử lý mất credential](auth-deep-dive.md#phan-quyen): sau khi biết bên gọi là ai, hệ thống quyết định và thu hồi quyền thế nào?
