# 3. OAuth 2.0, OpenID Connect và SAML

[Về mục lục](auth-deep-dive.md)

Chương này giải thích ba việc thường gặp khi có nhiều hệ thống:

- Cấp cho một ứng dụng quyền gọi API: OAuth 2.0.
- Đăng nhập ứng dụng bằng danh tính do hệ thống khác xác thực: OIDC.
- Kết nối đăng nhập một lần giữa hệ thống danh tính và ứng dụng: SAML Web SSO.

Trước tiên cần hiểu ai cần quyền, ai cấp kết quả và ai kiểm tra. Tên endpoint và trường dữ liệu sẽ xuất hiện sau khi quá trình chính đã rõ.

## 1. OAuth 2.0: cấp quyền truy cập cho ứng dụng

### 1.1. Vì sao cần OAuth?

Giả sử một ứng dụng cần đọc dữ liệu mà người dùng đang giữ ở dịch vụ khác. Người dùng không nên phải giao mật khẩu của dịch vụ đó cho ứng dụng.

OAuth cho phép ứng dụng nhận **access token** với quyền đã cấp. Ứng dụng dùng token gọi API, thay vì giữ mật khẩu của người dùng tại dịch vụ chứa dữ liệu.

Điểm cốt lõi là: **OAuth chuẩn hóa cách cấp quyền truy cập. Chỉ có OAuth chưa đủ để kết luận ứng dụng đã xác thực người dùng theo chuẩn OIDC.** [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html).

### 1.2. Những bên nào tham gia?

| Tên trong chuẩn | Vai trò dễ hiểu |
|---|---|
| Resource owner | Chủ thể có thể cho phép truy cập tài nguyên; thường là người dùng |
| Client | Ứng dụng muốn gọi API |
| Authorization server | Máy chủ xử lý cấp quyền và phát token |
| Resource server | API nhận token và bảo vệ dữ liệu |

Các vai trò có thể nằm chung hệ thống. Cần phân biệt trách nhiệm, không bắt buộc có bốn máy chủ riêng.

### 1.3. Trước khi trao đổi, hai bên cần biết gì?

Ứng dụng được đăng ký với máy chủ cấp quyền và nhận **Client ID**, là mã nhận diện ứng dụng. Hai bên cấu hình **Redirect URI**, là địa chỉ ứng dụng nhận kết quả sau bước tương tác người dùng.

Client ID không phải mật khẩu. Nếu ứng dụng có khả năng giữ bí mật, nó có thể được cấu hình cách xác thực riêng với máy chủ cấp token. Bí mật nhúng trong mã SPA hoặc ứng dụng di động không được coi là chỉ phía máy chủ biết.

### 1.4. Authorization Code hoạt động thế nào?

Đây là cách trao đổi dùng một mã tạm thời trước khi cấp token:

1. Client chuyển người dùng đến máy chủ cấp quyền, kèm quyền muốn xin và thông tin cần thiết.
2. Máy chủ xác thực người dùng và xử lý quyền theo chính sách.
3. Máy chủ trả **authorization code** về Redirect URI đã đăng ký.
4. Client kiểm tra kết quả có thuộc yêu cầu mình đã bắt đầu.
5. Client gửi code tới máy chủ cấp token, cùng bằng chứng cần thiết.
6. Máy chủ kiểm tra và trả access token.
7. Client dùng access token gọi API.

```text
Client → Máy chủ cấp quyền: yêu cầu quyền
Người dùng ↔ Máy chủ: xác thực và cho phép theo chính sách
Máy chủ → Client: code tạm thời
Client → Máy chủ cấp token: đổi code
Máy chủ → Client: access token
Client → API: gọi bằng access token
```

Code không phải access token. Nó chỉ phục vụ bước đổi token và phải được sử dụng đúng điều kiện.

### 1.5. PKCE thêm điều gì vào quá trình trên?

Nếu attacker lấy được code, hệ thống cần ngăn hắn dùng code đó thay client. PKCE thêm một bí mật riêng cho lần yêu cầu hiện tại:

1. Client tạo chuỗi ngẫu nhiên **code verifier** và giữ lại.
2. Client tính **code challenge** từ verifier rồi gửi ở yêu cầu ban đầu.
3. Khi đổi code, client gửi verifier.
4. Máy chủ tính lại và kiểm tra có khớp challenge đã nhận không.

Chỉ lấy được code mà không có verifier thì thiếu bằng chứng cần thiết để đổi token. Với phương thức S256, challenge được tính bằng SHA-256 và biểu diễn theo quy tắc Base64url. [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html).

**PKCE bảo vệ việc đổi code. Nó không làm một access token đã bị đánh cắp trở nên vô dụng.**

### 1.6. API tin token bằng cách nào?

API kiểm tra token theo cơ chế đã cấu hình: bên phát hành, bên được nhận, thời hạn, chữ ký hoặc trạng thái do máy chủ có thẩm quyền cung cấp. Sau đó, API kiểm tra quyền của hành động và tài nguyên.

**Scope** là phạm vi quyền được yêu cầu hoặc được cấp. **Audience** xác định dịch vụ được nhận token theo quy tắc sử dụng. Có scope phù hợp không mặc nhiên cho quyền với mọi bản ghi trong hệ thống.

Việc người dùng chấp thuận quyền gọi là **consent**. Nó có thể được xử lý bằng tương tác hoặc chính sách; không phải mọi lần cấp token đều hiện màn hình xin phép.

### 1.7. Những địa chỉ và giá trị sẽ gặp khi đọc code

| Tên | Dùng ở bước nào? |
|---|---|
| Authorization endpoint | Nhận yêu cầu xin quyền và tương tác người dùng |
| Token endpoint | Nhận yêu cầu đổi code hoặc xin token theo cơ chế được phép |
| Redirect URI / callback | Địa chỉ client nhận kết quả trả về |
| `state` | Giúp đối chiếu kết quả với yêu cầu client đã khởi tạo |

Client cần xử lý cả việc người dùng hủy, code hết hạn, kết quả bị gửi lại hoặc không có yêu cầu ban đầu. Thiết kế mới phải kiểm tra Redirect URI chặt chẽ và theo hướng dẫn bảo mật hiện hành; không dùng Password Grant để client nhận mật khẩu người dùng rồi đổi trực tiếp lấy token. [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).

### 1.8. OAuth chỉ dùng khi có người dùng không?

Không. OAuth còn có **Client Credentials**, trong đó ứng dụng xác thực và nhận token bằng quyền riêng, không có người dùng đăng nhập trong lần trao đổi đó.

Các cơ chế cấp token được gọi là **grant**:

| Grant | Mục đích |
|---|---|
| Authorization Code | Trao đổi có tương tác người dùng như trên |
| Client Credentials | Ứng dụng dùng quyền riêng |
| Refresh Token | Xin token mới theo quyền đã cấp |
| Device Authorization | Người dùng xác thực trên thiết bị khác vì thiết bị ban đầu khó nhập liệu |

Device Authorization có cách hỏi kết quả theo chu kỳ và các trạng thái riêng. Đây là phần đọc sau khi đã hiểu luồng code. [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html).

### 1.9. Khi nào dùng OAuth?

Dùng khi cần cấp và kiểm soát quyền API giữa các thành phần theo chuẩn. Không phải website chỉ có đăng nhập và cookie nào cũng cần tự xây máy chủ OAuth.

Sau khi chọn OAuth, còn phải chọn loại client, cách giữ token, scope, thời hạn và thu hồi. Có chuẩn thu hồi token không đồng nghĩa API đã tự ngừng nhận mọi token cũ. [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009.html).

## 2. OIDC: ứng dụng nhận kết quả đăng nhập từ hệ thống khác

### 2.1. OIDC bổ sung gì cho OAuth?

OAuth trả lời việc ứng dụng được cấp quyền truy cập tài nguyên. OIDC bổ sung kết quả xác thực để ứng dụng biết **người dùng đã được xác thực là ai**.

Ứng dụng cần đăng nhập được gọi là **Relying Party — RP**. Hệ thống cung cấp danh tính được gọi là **OpenID Provider — OP**. Client yêu cầu scope `openid` để dùng OIDC.

Kết quả quan trọng là **ID token**, chứa thông tin danh tính và lần xác thực để client kiểm tra. ID token không dùng thay access token gọi API. [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html).

### 2.2. Hai bên giữ và trả dữ liệu gì?

| Bên | Trách nhiệm |
|---|---|
| OP | Quản lý xác thực và phát ID token |
| Ứng dụng | Cấu hình OP được tin, kiểm tra token và nối với tài khoản nội bộ |
| ID token | Mang thông tin có chữ ký để ứng dụng kiểm tra kết quả |

Ứng dụng không cần nhận password hoặc dữ liệu vân tay mà OP dùng xác thực. Nó cần xác minh kết quả đến từ đúng OP và dành cho mình.

### 2.3. Đăng nhập theo luồng code

1. Ứng dụng ghi nhận lần đăng nhập và chuyển người dùng tới OP.
2. OP xác thực hoặc dùng phiên hiện có nếu phù hợp.
3. OP trả code; ứng dụng đổi code để nhận token.
4. Ứng dụng kiểm tra ID token và kết quả có thuộc lần đăng nhập đã khởi tạo.
5. Ứng dụng tìm tài khoản nội bộ tương ứng.
6. Ứng dụng tạo phiên của mình nếu kiến trúc cần.

Như vậy, có thể đồng thời tồn tại **phiên ở OP** và **phiên ở ứng dụng**. Đăng xuất ứng dụng chưa chắc kết thúc phiên OP. Lần đăng nhập sau có thể hoàn tất mà không hỏi lại mật khẩu nếu OP vẫn cho phép dùng phiên cũ.

### 2.4. Vì sao ID token giúp nhận diện tài khoản?

ID token có bên phát hành `iss` và mã chủ thể `sub`. Ứng dụng kiểm tra nguồn phát rồi dùng danh tính đó để tìm tài khoản tương ứng. Cần diễn giải `sub` trong phạm vi `iss`; không coi email là mã định danh bất biến ở mọi hệ thống.

Ứng dụng còn phải kiểm tra chữ ký, bên nhận, thời hạn và các điều kiện OIDC. **Đọc được tên hoặc email từ token không đủ để cho đăng nhập.**

Nếu tự liên kết hai tài khoản chỉ vì cùng email, cần đánh giá nguy cơ nhầm danh tính. Đây là quyết định quản lý tài khoản của ứng dụng, không phải việc chữ ký token tự giải quyết.

### 2.5. Khóa kiểm tra và cấu hình lấy ở đâu?

**OIDC Discovery** giúp lấy thông tin cấu hình của OP, gồm các endpoint và địa chỉ bộ khóa công khai, gọi là JWKS. Ứng dụng chỉ sử dụng cấu hình từ nguồn được tin cậy và kiểm tra bên phát hành đúng như đã cấu hình. [OIDC Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html).

Không tải khóa từ bất kỳ URL người dùng đưa vào rồi tin token. Khi OP thay khóa, ứng dụng cần cập nhật theo cơ chế phù hợp.

### 2.6. Đăng xuất như thế nào?

Cần xác định rõ muốn kết thúc phiên ứng dụng, phiên OP hay thu hồi quyền gọi API.

OIDC có cơ chế ứng dụng yêu cầu đăng xuất tại OP và cơ chế OP thông báo trực tiếp cho ứng dụng để kết thúc phiên. Các bên phải tích hợp và kiểm tra thông báo đúng. [RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html), [Back-Channel Logout](https://openid.net/specs/openid-connect-backchannel-1_0.html).

Đăng xuất không tự bảo đảm mọi access token hoặc kết nối đang mở đã bị chặn. Phần thu hồi trong tài liệu chính xử lý câu hỏi đó.

### 2.7. Khi nào dùng? Đào sâu tiếp những gì?

OIDC phù hợp khi cần đăng nhập qua hệ thống danh tính hỗ trợ chuẩn này. Sau luồng chính, có thể nghiên cứu `nonce`, `auth_time`, `acr` và `amr`: lần lượt liên quan đến đối chiếu lần xác thực, thời điểm và ngữ cảnh/phương thức xác thực. Cách diễn giải phải theo chuẩn và cam kết của OP, không tự suy một claim bất kỳ đồng nghĩa MFA. [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html).

## 3. SAML: ứng dụng tin kết quả xác thực do IdP cung cấp

### 3.1. Ý tưởng chính

Trong SAML Web SSO, hệ thống danh tính xác thực người dùng rồi gửi kết quả để ứng dụng kiểm tra. Hệ thống danh tính được gọi là **Identity Provider — IdP**; ứng dụng nhận kết quả là **Service Provider — SP**.

Điểm cần nhớ: **SP không cần tự kiểm tra password của người dùng; SP kiểm tra thông tin xác thực mà IdP cung cấp theo chuẩn SAML.**

### 3.2. IdP gửi gì?

IdP có thể trả **SAML Response** chứa **assertion**. Assertion là nội dung khẳng định về người dùng, lần xác thực và điều kiện được sử dụng. Dữ liệu được biểu diễn bằng XML. [SAML Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf).

Hai bên cấu hình định danh, địa chỉ nhận kết quả và khóa/chứng chỉ tin cậy. Thông tin cấu hình này được mô tả trong **metadata**. [SAML Metadata](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf).

### 3.3. Đăng nhập do ứng dụng khởi tạo

1. Người dùng yêu cầu đăng nhập vào ứng dụng.
2. SP tạo yêu cầu xác thực, gọi là `AuthnRequest`, và ghi nhận để đối chiếu.
3. Trình duyệt đưa yêu cầu tới IdP.
4. IdP xác thực hoặc dùng phiên phù hợp.
5. Kết quả được chuyển về địa chỉ nhận của SP, gọi là **ACS — Assertion Consumer Service**.
6. SP kiểm tra kết quả và tạo phiên nội bộ.

### 3.4. SP kiểm tra gì trước khi tin?

SP cần kiểm tra kết quả đến từ IdP được tin, dành cho đúng ứng dụng, còn trong thời hạn và đáp ứng điều kiện của giao thức. Nếu có yêu cầu ban đầu, phải đối chiếu kết quả với yêu cầu đó. Chữ ký và việc ngăn dùng lại thông điệp cũng cần được xử lý theo quy tắc sử dụng. [SAML Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf).

Không chỉ đọc thấy “Success” hoặc có tên người dùng rồi tạo phiên. Nên dùng thư viện SAML được duy trì thay vì tự xử lý XML và chữ ký.

### 3.5. IdP có thể chủ động bắt đầu không?

Có, gọi là **IdP-initiated SSO**. Khi đó, SP có thể nhận kết quả mà chưa tạo yêu cầu trước đó. Việc không có yêu cầu ban đầu để đối chiếu làm thay đổi cách kiểm tra và rủi ro; chỉ bật khi cần và có chính sách phù hợp. [SAML Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf).

### 3.6. Khi nào dùng? Đào sâu tiếp những gì?

SAML thường được dùng khi tích hợp SSO với hệ thống doanh nghiệp yêu cầu/hỗ trợ nó. Ngoài đăng nhập, cần giải quyết tài khoản nội bộ, quyền và kết thúc phiên.

Sau luồng chính, nghiên cứu thêm:

- **Binding:** cách chuyển thông điệp, chẳng hạn HTTP Redirect hoặc POST.
- **Profile:** quy tắc kết hợp giao thức cho một nhu cầu cụ thể.
- **Thay chứng chỉ ký:** cách hai bên cập nhật để tiếp tục tin đúng khóa.
- **Single Logout:** cách kết thúc phiên khi các bên hỗ trợ.

Assertion hết hạn không tự kết thúc phiên SP đã tạo. SAML cũng không tự cung cấp toàn bộ quyền API cho ứng dụng. [SAML Bindings](https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf), [SAML Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf).

## 4. So sánh sau khi hiểu cơ chế

| | OAuth 2.0 | OIDC | SAML Web SSO |
|---|---|---|---|
| Câu hỏi chính | Ứng dụng được gọi tài nguyên nào? | Người dùng đã được OP xác thực là ai? | SP kiểm tra kết quả xác thực từ IdP thế nào? |
| Kết quả cần phân biệt | Access token | ID token; có thể kèm access token | SAML Response/assertion |
| Quan hệ | Chuẩn cấp quyền | Xây trên OAuth 2.0 | Hệ chuẩn riêng |

Chọn theo nhu cầu và khả năng tích hợp. Dù dùng chuẩn nào, ứng dụng vẫn phải quản lý quyền và phiên của chính mình.

## Đọc tiếp

[Danh tính ứng dụng, mTLS và DPoP](04-machine-authentication.md) giải thích cơ chế cho bên gọi API và bằng chứng giữ khóa.
