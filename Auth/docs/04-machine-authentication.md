# 04. Khi Order Service gọi Payment Service, ai chứng minh danh tính?

**Biên tập lại 16/11/2026 — đọc cùng slide 09.** Bốn nhóm trên slide là shared secret, access token, mTLS và signed request. Chương đi đúng thứ tự đó, giải thích HMAC/chữ ký ngay trong signed request; DPoP là phần mở rộng sau cùng.

[Mục lục chuyên đề](auth-deep-dive.md) · [Giải thích theo slide](auth-study-guide.md#slide-09)

## 1. Bắt đầu bằng một cuộc gọi cụ thể

Order muốn yêu cầu Payment xử lý một giao dịch. Payment cần xác định **bên gọi là service nào**, rồi kiểm tra service đó được phép làm gì. Không phải lúc nào cũng có người dùng đứng đó nhập OTP.

~~~text
Order → credential / bằng chứng phù hợp → Payment
Payment: xác thực Order → kiểm tra quyền → kiểm tra nghiệp vụ thanh toán
~~~

Có hai tình huống cần tách:

- **Quyền riêng của ứng dụng:** job đối soát chạy bằng danh tính của job/service.
- **Thay mặt người dùng:** Order thực hiện thao tác được ủy quyền cho Anna; cần bảo toàn giới hạn quyền Anna và đúng API đích.

App-only token không tự thay được quyền người dùng. Cũng không dùng một access token sai audience để chuyển tới mọi service. Giao thức token exchange/delegation cụ thể phụ thuộc nền tảng/hợp đồng.

## 2. Shared secret: Payment kiểm tra một bí mật bên gọi biết

### 2.1. API key

Hệ thống cấp một key cho bên tích hợp, Payment ánh xạ key tới danh tính/quyền và trạng thái. Nhưng tên “API key” không tự bảo đảm là bí mật hay thực hiện authentication: có sản phẩm dùng key để nhận diện project/quota/billing. Phải đọc hợp đồng.

Client gửi key theo quy ước, chẳng hạn một header; server kiểm tra dữ liệu lưu và quyền. Key ngẫu nhiên đủ mạnh chỉ cần so khớp có thể được lưu dưới dạng hash. Nếu phải dùng chính secret để tạo HMAC hoặc gọi hệ thống khác, chỉ giữ hash không đủ cho việc đó; cần lưu và sử dụng secret an toàn theo chức năng.

Cấp key riêng từng bên để audit, rotate và thu hồi độc lập. Không nhúng service secret vào JavaScript/mobile app rồi coi nó chỉ service giữ. Không đặt secret trong URL hoặc log.

### 2.2. Basic Auth

~~~http
Authorization: Basic <Base64 của username:password>
~~~

Base64 biểu diễn dữ liệu, không mã hóa bí mật. Người đọc được header có thể khôi phục cặp credential. Server kiểm tra user/password hoặc credential ứng dụng theo hợp đồng, rồi tạo danh tính và kiểm tra quyền.

Basic không tự cấp access token ngắn hạn. Bên gọi có thể gửi lại credential ở nhiều request. Nếu tích hợp yêu cầu Basic, cần HTTPS, secret service riêng, giới hạn quyền và khả năng thay/thu hồi.

### 2.3. Khi nào phù hợp, giới hạn ở đâu?

Hợp đồng đơn giản hoặc hệ thống cũ có thể yêu cầu API key/Basic. Chi phí triển khai thấp hơn một số hệ thống cấp token/chứng chỉ, nhưng secret có thể được dùng lại nếu lộ. Phải vận hành vòng đời và phạm vi quyền, không chỉ “có key là an toàn”.

Nguồn: [Basic — RFC 7617](https://www.rfc-editor.org/rfc/rfc7617.html), [OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

## 3. Access token: Order xin quyền từ bên phát hành, Payment kiểm tra token

### 3.1. Credential xin token khác token gửi API

~~~text
Order → authorization server: xác thực client + yêu cầu Client Credentials
Order ← authorization server: access token cho quyền ứng dụng
Order → Payment: access token
Payment: kiểm tra issuer/audience/hiệu lực/quyền
~~~

**Client Credentials** là grant OAuth cho ứng dụng dùng quyền riêng. Client secret, private_key_jwt hoặc mTLS là các cơ chế có thể dùng để xác thực client tại token endpoint. Chúng là hai tầng khác nhau.

JWT assertion mà client ký để xin token không phải cùng vai trò với access token mà authorization server cấp để gọi Payment. Cùng là JWT không làm hai thứ dùng thay nhau được.

Theo Client Credentials chuẩn, không kỳ vọng refresh token như phiên người dùng. Service có thể xác thực để xin token mới. Thiết kế phải xử lý caching token, hết hạn và lỗi cấp token phù hợp, không xin token cho mọi request một cách máy móc.

### 3.2. Bên phát hành có phải IdP bên ngoài không?

Có thể là authorization server nội bộ hoặc thuộc nền tảng danh tính đã chọn. Payment cần tin cấu hình issuer và token dành cho mình. JWT/opaque là định dạng/cách xử lý, không nói ai cấp. Token có chữ ký vẫn cần audience và authorization đúng.

### 3.3. Workload identity giải quyết gì?

Workload identity tổ chức cấp/quản lý danh tính cho service/job đang chạy. Nền tảng có thể dùng token, certificate, federation hoặc credential ngắn hạn, giảm secret tĩnh và tự động hóa gia hạn.

Đây không phải một header duy nhất, cũng không phải hàng thứ năm luôn độc lập với bốn cơ chế trên slide. Cần biết nền tảng cấp gì, ứng dụng chứng minh gì, ai tin issuer/certificate và vòng đời thế nào.

**Phù hợp khi:** nhiều service cần quyền API có hạn và trust nhất quán. Đánh đổi là vận hành authorization server/integration, credential, audience và quyền. Số lượng service một mình chưa đủ chọn giải pháp.

Nguồn: [RFC 6749 §4.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4).

## 4. mTLS: xác thực hai bên khi thiết lập kết nối

### 4.1. Certificate và private key khác nhau

Certificate gắn public key với thông tin nhận dạng theo hệ thống trust. Private key là khóa bí mật dùng tạo bằng chứng mật mã. Certificate công khai có thể được sao chép; chỉ có certificate không đủ giả client nếu thiếu khả năng dùng private key tương ứng.

Với HTTPS thường gặp, client kiểm tra danh tính server. Với mutual TLS, server cũng yêu cầu client trình certificate và chứng minh giữ private key trong handshake TLS.

~~~text
Order kiểm tra certificate của Payment
Payment kiểm tra certificate của Order
Hai bên chứng minh khả năng dùng private key tương ứng theo TLS
→ Thiết lập kết nối được xác thực hai chiều
~~~

Không phải client gửi private key cho server. TLS thực hiện bằng chứng theo giao thức. Trust có thể dựa trên PKI/CA hoặc cấu hình phù hợp hệ thống; không đơn giản nhận một certificate bất kỳ có public key rồi tin.

### 4.2. Sau mTLS có cần phân quyền?

Có. Certificate được chấp nhận giúp xác định bên gọi theo mapping. Payment còn phải kiểm tra Order có quyền gọi endpoint/hành động nào. “Certificate hợp lệ” không đồng nghĩa được hoàn tiền mọi giao dịch.

Nếu TLS kết thúc tại proxy/gateway, backend không trực tiếp chứng kiến handshake của client. Nó chỉ nên tin thông tin proxy chuyển trên đường đã được bảo vệ, sau khi chặn header giả và bypass. Không cho client tự gắn header certificate/userId rồi coi là mTLS.

### 4.3. mTLS tại token endpoint khác certificate-bound token

Một client có thể dùng mTLS **chỉ để xin token**. Việc đó chưa chứng minh API yêu cầu certificate khi token được sử dụng.

Với certificate-bound access token, issuer ràng buộc token với certificate; client gọi API qua mTLS phù hợp; API kiểm tra cả token và ràng buộc. Khi đó chỉ lấy chuỗi token mà không dùng được private key có thể chưa đủ truy cập.

Hai khả năng có thể dùng cùng hoặc riêng theo chuẩn. Chứng chỉ đổi cũng ảnh hưởng token đang ràng buộc với chứng chỉ cũ; cần kế hoạch rotation/expiry.

### 4.4. Khi nào chọn mTLS?

Khi cần xác thực hai chiều tại kết nối và hạ tầng có khả năng cấp, bảo vệ, gia hạn, thu hồi certificate, xử lý TLS termination và ánh xạ service identity. Chi phí lớn nằm ở vận hành. Mất khóa phải thu hồi/cập nhật trust và xem xét kết nối đang mở; xóa một file không xóa bản sao của attacker.

Nguồn: [TLS 1.3 — RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), [OAuth mTLS — RFC 8705](https://www.rfc-editor.org/rfc/rfc8705.html).

## 5. Signed request: xác minh nội dung request đã quy định

### 5.1. Cần bảo vệ dữ liệu nào?

Order tạo request thanh toán. Ngoài việc biết ai kết nối, Payment có thể cần bằng chứng rằng các thành phần quan trọng được gửi bởi bên giữ khóa và không bị sửa.

~~~text
Method: POST
Target: /payments
Body: orderId=42, amount=500000
Timestamp + nonce + key identifier
MAC/chữ ký trên các thành phần theo hợp đồng
~~~

Không phải cứ có header Signature là toàn bộ request tự được bảo vệ. Phải quy định phạm vi ký. Body có thể được ràng buộc qua Content-Digest được kiểm tra và ký theo profile. Nếu chỉ ký timestamp mà bỏ amount, không thể nói amount đã được bảo vệ.

### 5.2. HMAC là gì?

HMAC tạo mã xác thực từ **shared secret** và dữ liệu. Order và Payment biết cùng secret K.

~~~text
Order:   HMAC(K, dữ liệu chuẩn hóa) → MAC; gửi dữ liệu + MAC
Payment: HMAC(K, dữ liệu nhận theo cùng quy tắc) → so khớp an toàn
~~~

Dữ liệu bị sửa thì MAC tính lại không khớp. Không biết K thì không tạo được MAC hợp lệ cho dữ liệu mới theo giả định bảo mật của thuật toán. Nhưng Payment cũng có K nên **Payment cũng tạo được MAC**. HMAC không cho mô hình “chỉ bên gửi có khả năng ký” như khi bên nhận chỉ giữ public key.

HMAC là mã xác thực thông điệp, không phải chữ ký số bất đối xứng. Không dùng SHA256(secret + message) tự nghĩ ra thay HMAC chuẩn.

### 5.3. Asymmetric signature là gì?

Order giữ private key và ký dữ liệu. Payment giữ public key đã được tin là của Order để kiểm tra. Chỉ có public key không tạo được chữ ký mới tương ứng. Public key tự gửi kèm request không tự chứng minh nó thuộc Order; cần trust/key registration đúng.

| | HMAC | Chữ ký bất đối xứng |
|---|---|---|
| Khóa tạo | Shared secret K | Private key |
| Khóa kiểm tra | Cùng K | Public key |
| Bên nhận tự tạo bằng chứng được? | Có, vì biết K | Không nếu chỉ có public key |
| Có che giấu dữ liệu? | Không | Không |
| Ví dụ | HMAC-SHA256 | RSA-PSS, ECDSA, Ed25519 |

### 5.4. Raw data hoặc nguyên request bị lấy thì sao?

Chỉ đọc dữ liệu không đủ giả MAC/chữ ký mới nếu thiếu khóa. Nhưng attacker có thể gửi lại **nguyên dữ liệu và bằng chứng hợp lệ** nếu verifier không kiểm tra replay.

Timestamp giới hạn cửa sổ; nonce/định danh request và trạng thái đã dùng có thể ngăn replay trong cửa sổ theo policy. Hai request đồng thời và retry cần được xử lý nhất quán. Idempotency ngăn tác dụng nghiệp vụ lặp, không thay authentication hay mọi kiểm soát replay.

Hai bên phải chuẩn hóa dữ liệu cùng quy tắc: method, URL, header, encoding và digest. Reverse proxy đổi một số thành phần có thể ảnh hưởng xác minh; dùng giao thức/library đã xác định thay vì tự nối chuỗi tùy ý.

### 5.5. mTLS và signed request khác nhau ở đâu?

mTLS xác thực các bên của **kết nối TLS**. Signed request bảo vệ **các thành phần thông điệp đã ký**. Có thể dùng chung và có thể kết hợp OAuth. Chữ ký không cung cấp bí mật nội dung, nên không thay HTTPS.

**Phù hợp khi:** đối tác/webhook yêu cầu ký request hoặc cần bằng chứng trên thông điệp cụ thể. Đánh đổi là canonicalization, key management, replay và phối hợp profile giữa hai bên.

Nguồn: [HTTP Message Signatures — RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html).

## 6. DPoP: phần mở rộng để token bị copy chưa chắc dùng được

DPoP là Demonstrating Proof of Possession. Client dùng cặp khóa; issuer ràng buộc token với khóa; client trình proof được ký khi gọi API; API kiểm tra token và proof theo giao thức.

Proof gắn với các thông tin request như method, URI, thời điểm, định danh và ràng buộc token khi cần. Không phải một header cố định để copy mọi lần. Khi gọi resource theo DPoP, giao thức dùng scheme/header tương ứng; không chỉ đổi chữ Bearer mà giữ nguyên validator.

Nếu attacker chỉ lấy token mà không tạo proof phù hợp, có thể bị chặn. Nếu kiểm soát client và gọi được ký, lợi ích giảm. DPoP không mặc nhiên bảo vệ body như một HTTP Message Signature profile; không gộp hai cơ chế thành một. Cần toàn chuỗi hỗ trợ và vẫn cần HTTPS, quyền và thu hồi.

Nguồn: [DPoP — RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html).

## 7. Chọn theo nhu cầu và khả năng vận hành

| Nhu cầu chính | Hướng cân nhắc | Cần chịu trách nhiệm |
|---|---|---|
| Tích hợp đơn giản theo hợp đồng | API key/Basic qua HTTPS | Secret riêng, quyền hẹp, rotation/revoke |
| Quyền ứng dụng qua hệ thống token chung | Client Credentials/workload identity | Issuer/audience, cấp token, lifecycle |
| Xác thực kết nối hai chiều | mTLS | PKI/trust, certificate lifecycle, proxy |
| Bảo vệ request cụ thể | HMAC/chữ ký theo giao thức | Phạm vi ký, canonicalization, replay |
| Giảm khả năng dùng token bị lấy | DPoP/certificate-bound token | Proof/key, hỗ trợ toàn chuỗi, giới hạn client compromise |

Các cơ chế không loại trừ nhau. “Nhiều service” không tự có nghĩa bắt buộc mTLS. “Có JWT” không tự có nghĩa bỏ kiểm tra resource authorization.

## 8. Tự kiểm tra

Giải thích được: ai giữ secret/private/public key; Payment kiểm tra gì; MAC/signature bảo vệ dữ liệu nào; bản sao credential/request còn dùng được khi nào; xoay vòng/thu hồi tác động ở đâu. Sau đó chỉ ra đâu là xác thực, đâu là quyết định quyền.

Đọc tiếp [05 — Phân quyền trên tài nguyên](05-authorization.md).
