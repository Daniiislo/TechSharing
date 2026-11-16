# 03. App tự đăng nhập hay nhận kết quả từ identity provider?

**Biên tập lại 16/11/2026 — đọc cùng slide 03, 07–08 và 15.** Mục tiêu là phân biệt bằng chứng người dùng, nơi xác thực, giao thức liên kết và token gọi API trước khi đi sâu vào flow.

[Mục lục chuyên đề](auth-deep-dive.md) · [Học theo slide](auth-study-guide.md#slide-07)

## 1. Cùng password + OTP, hai nơi xử lý khác nhau

Anna có thể đăng nhập theo hai cách:

~~~text
Tại app:       Web → auth backend kiểm tra password + OTP → tạo phiên/token
Qua provider:  App → provider kiểm tra password + OTP → app nhận kết quả theo giao thức
~~~

**Password/OTP/passkey** là bằng chứng hoặc cơ chế xác thực người dùng. **Identity provider** là bên xử lý và cung cấp kết quả danh tính. **OIDC/SAML** là giao thức app dùng nhận kết quả đó. Chúng có thể kết hợp, không phải những phương thức loại trừ nhau.

| Tên | Viết đầy đủ / vai trò | Ví dụ điều không nên hiểu nhầm |
|---|---|---|
| IdP | Identity Provider, bên cung cấp danh tính | Không phải viết đầy đủ của OIDC |
| OIDC | OpenID Connect, lớp xác thực trên OAuth 2.0 | Không phải một loại provider hay factor |
| SAML | Security Assertion Markup Language; có profile Web SSO | Không phải OIDC chuyển sang XML |
| OAuth 2.0 | Framework cấp quyền truy cập tài nguyên | Một mình nó không chuẩn hóa đầy đủ login user |
| SSO | Single Sign-On, khả năng/trải nghiệm đăng nhập nhiều app | Không phải tên một giao thức riêng |

Một provider có thể hỗ trợ OIDC, SAML và nhiều cách xác thực. App có thể chạy trong monolith, BFF, web tách API hoặc mobile. Kiến trúc không quyết định chỉ được dùng password hay OIDC.

## 2. Bắt đầu từ nhu cầu đăng nhập: OIDC

### 2.1. Vì sao app cần giao thức nhận kết quả?

App lịch muốn dùng danh tính công ty của Anna nhưng không tự kiểm tra mật khẩu công ty. Nó cần xác nhận kết quả đến từ provider được tin, dành đúng cho app, còn hiệu lực và thuộc giao dịch login đang chờ. Không chỉ nhận một chuỗi email từ browser rồi tin.

Trong OIDC, app là Relying Party (RP); bên cung cấp là OpenID Provider (OP). Scope openid cho biết client đang dùng OIDC. IdP là tên vai trò chung; OP là thuật ngữ chính xác trong giao thức này.

### 2.2. Luồng code theo ví dụ web có backend

1. App ghi nhận giao dịch đăng nhập và tạo yêu cầu tới provider đã cấu hình.
2. Browser được chuyển tới provider. Provider xác thực bằng password/OTP/passkey hoặc sử dụng phiên hiện có nếu policy cho phép.
3. Browser quay về redirect URI của app với authorization code.
4. Client kiểm tra kết quả thuộc giao dịch đã khởi tạo và thực hiện code exchange theo loại client.
5. Provider trả token theo giao thức; client xác minh ID token và các điều kiện flow.
6. App ánh xạ danh tính bên ngoài sang user nội bộ và tạo trạng thái đăng nhập riêng nếu cần.

Authorization code là mã tạm để đổi token; không phải access token hay danh tính mà app có thể tin ngay. App không hoàn thành login chỉ vì callback chứa code.

### 2.3. ID token giúp app biết ai đã được xác thực

ID token dành cho client kiểm tra kết quả xác thực OIDC. Nó có cấu trúc JWT theo chuẩn nhưng không vì vậy mà dùng thay access token cho mọi API.

Client/thư viện kiểm tra issuer đúng cấu hình, audience đúng client, chữ ký/khóa theo trust, thời hạn và các điều kiện bắt buộc. Khi yêu cầu có nonce, kết quả phải được kiểm tra tương ứng. state/correlation giúp liên kết giao dịch theo flow; không coi state, nonce, PKCE là các giá trị thay nhau tùy ý.

App thường ánh xạ cặp issuer + subject sang user nội bộ. Không tự coi email là mã định danh bất biến toàn cầu hay tự liên kết mọi tài khoản cùng email mà thiếu policy xác minh.

### 2.4. Cấu hình và public key từ đâu?

OIDC Discovery cung cấp metadata của provider, gồm endpoints và địa chỉ JWKS. App chỉ dùng issuer/metadata được cấu hình tin cậy. Không tải khóa từ URL bất kỳ do token hoặc người gọi đưa rồi tin ngay. Rotation và cache khóa phải theo cơ chế thư viện/nền tảng.

### 2.5. OIDC khác cookie thế nào?

OIDC giúp app nhận kết quả login từ provider. Cookie có thể giúp browser duy trì phiên của app sau đó. Hai thứ cùng xuất hiện là bình thường:

~~~text
Provider xác thực Anna → OIDC → app chấp nhận danh tính
App tạo cookie phiên → browser gửi cookie ở request sau
~~~

Login nội bộ cũng có thể tạo cùng kiểu cookie. Vị trí xác thực ban đầu và credential request là hai quyết định khác nhau.

Nguồn: [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html), [OIDC Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html).

## 3. SSO: đăng nhập một lần, không nhất thiết chỉ một phiên

Giả sử app A và B tin cùng provider. Anna login A, provider có phiên. Khi vào B, B chuyển tới provider; provider có thể xác thực bằng phiên hiện tại mà không hỏi password lần nữa. B vẫn kiểm tra kết quả và quản lý phiên của mình.

Có thể đồng thời có phiên provider, phiên A và phiên B. Logout A không mặc nhiên logout provider/B hoặc thu hồi access token. Phải xác định muốn kết thúc phạm vi nào và tích hợp RP-initiated logout, back-channel logout hoặc cơ chế nền tảng thực sự hỗ trợ.

SSO không tự cấp mọi quyền cho mọi app. B vẫn quyết định Anna có tài khoản nội bộ, tenant, role và quyền tài nguyên nào. Có thể cần provisioning/linking riêng, không coi federation tự giải quyết toàn bộ vòng đời tài khoản.

Nguồn: [RP-Initiated Logout](https://openid.net/specs/openid-connect-rpinitiated-1_0.html), [Back-Channel Logout](https://openid.net/specs/openid-connect-backchannel-1_0.html).

## 4. Nhu cầu khác: app muốn gọi API thay vì chỉ biết user là ai

App lịch muốn đọc Google Calendar của Anna. Nó không nên giữ password Google để gọi API. OAuth cho phép nhận access token với quyền được cấp.

| Vai trò OAuth | Trong ví dụ |
|---|---|
| Resource owner | Anna, người có thể cho phép truy cập tài nguyên |
| Client | App muốn đọc lịch |
| Authorization server | Bên xử lý cấp quyền/phát token |
| Resource server | Calendar API nhận token và bảo vệ dữ liệu |

Các vai trò có thể được triển khai cùng hệ thống, không yêu cầu bốn máy riêng. Authorization server và identity provider thường nằm trong cùng nền tảng nhưng là các trách nhiệm cần phân biệt.

### 4.1. Authorization Code để lấy access token

Client yêu cầu phạm vi cần thiết; authorization server xác thực user khi cần và xử lý quyền theo policy; client nhận code rồi đổi code tại token endpoint. Sau đó client dùng access token gọi resource API. OIDC có thể dùng flow nền này và bổ sung kết quả xác thực; không suy mọi OAuth flow đều là OIDC.

Consent là việc cho phép truy cập; có thể là tương tác người dùng hoặc policy tổ chức. Không bắt buộc hiện hộp thoại consent ở mọi lần cấp token.

### 4.2. Access, ID và refresh token

| Token | Nơi dùng | Không dùng thay cho |
|---|---|---|
| ID token | Client kiểm tra kết quả login | Access token của resource API |
| Access token | API được cấp làm audience/phạm vi phù hợp | Bằng chứng login OIDC tổng quát cho mọi client |
| Refresh token | Token endpoint xin token mới khi được phép | Token gửi tới nghiệp vụ API |

Access token có thể JWT hoặc opaque. Token do provider cấp để gọi Calendar không tự gọi được Order API của mình. API phải tin đúng issuer, audience, điều kiện thời gian và quyền. Auth backend nội bộ cũng có thể phát token nếu đảm nhiệm vai trò tương ứng; phải có hợp đồng bảo mật và thư viện phù hợp.

### 4.3. Scope không thay quyền trên từng bản ghi

Scope mô tả phạm vi API đã cấp cho client, ví dụ orders:read. Audience xác định token dành cho dịch vụ nào. Có scope đó chưa cho Anna quyền xem mọi order của mọi tenant; API còn kiểm tra quan hệ/quyền trên order cụ thể.

Token tự chứa không tự cập nhật khi role/tài khoản thay đổi. Thu hồi access/refresh và khả năng API biết trạng thái mới được giải thích ở [chương 02](02-sessions-and-tokens.md).

Nguồn: [OAuth 2.0 — RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html), [OAuth Security BCP — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).

## 5. PKCE và các chi tiết flow: học sau khi hiểu mục tiêu

PKCE là Proof Key for Code Exchange. Nó không phải kiến trúc, factor hoặc nơi xử lý login. Vai trò là ràng buộc lần đổi code với client đã khởi tạo giao dịch.

1. Client tạo code verifier ngẫu nhiên riêng cho giao dịch và giữ lại.
2. Với S256, client tạo challenge từ SHA-256(verifier), biểu diễn theo quy tắc Base64url.
3. Client gửi challenge ở yêu cầu đầu.
4. Khi đổi code, client gửi verifier; server kiểm tra tương ứng.

Lấy được code mà không có verifier thiếu bằng chứng để đổi token theo yêu cầu này. PKCE không làm access token đã bị lấy trở nên vô dụng, không giải quyết mọi XSS và không thay client authentication ở loại client cần xác thực.

**Public client** không giữ được một secret cố định bí mật khỏi người sử dụng/attacker, như JavaScript browser và native app phân phối tới thiết bị. **Confidential client** có môi trường giữ credential phù hợp, như backend. Client ID nhận diện ứng dụng, không phải password.

| Giá trị/địa chỉ | Vai trò cần hiểu |
|---|---|
| Redirect URI | Đích nhận kết quả đã đăng ký/kiểm tra theo giao thức |
| state/correlation | Liên kết kết quả với yêu cầu và bảo vệ giao dịch theo flow |
| nonce OIDC | Ràng buộc kết quả xác thực theo yêu cầu và quy tắc OIDC |
| PKCE verifier/challenge | Bảo vệ code exchange |
| Token endpoint | Nơi xử lý code/grant để cấp token |

Cần hiểu chuẩn/thư viện kết hợp các kiểm soát này, không tự bỏ một trường vì trường khác “cũng là số ngẫu nhiên”. Flow mới theo hướng dẫn hiện hành, không dùng Password Grant chỉ vì thư viện còn có tùy chọn.

**Backend tự kiểm tra password rồi tạo phiên/token không tự là OAuth Password Grant.** Password Grant là một grant OAuth cụ thể; login first-party nội bộ có password không mặc nhiên thuộc grant đó. Cũng không tự gọi một endpoint login tùy biến là OAuth/OIDC.

Nguồn: [PKCE — RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html), [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).

## 6. OAuth không chỉ có người dùng tương tác

Client Credentials dùng quyền riêng của ứng dụng/service; không có user nhập password/OTP trong lần xin token đó. Cách xác thực service tại token endpoint là quyết định khác grant. Refresh Token dùng để xin token mới theo grant còn được phép. Device Authorization hỗ trợ thiết bị khó nhập liệu bằng tương tác ở thiết bị khác và polling theo giao thức.

Không biến mọi machine-to-machine thành login người dùng qua OIDC. Đọc [chương 04](04-machine-authentication.md) cho Client Credentials, mTLS, signed request và workload identity. Nguồn: [RFC 6749 §4.4](https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4), [Device Authorization — RFC 8628](https://www.rfc-editor.org/rfc/rfc8628.html).

## 7. SAML Web SSO: cùng nhu cầu liên kết danh tính, giao thức khác

SAML là một họ chuẩn; ở đây xét Web SSO. IdP xác thực user; Service Provider (SP) là ứng dụng nhận kết quả. SAML Response có thể chứa assertion XML mô tả danh tính/lần xác thực và điều kiện sử dụng.

### 7.1. Luồng do app khởi tạo

SP tạo AuthnRequest và ghi nhận giao dịch. Browser đưa yêu cầu tới IdP. IdP xác thực hoặc dùng phiên phù hợp, trả kết quả về Assertion Consumer Service (ACS) của SP. SP kiểm tra rồi tạo phiên nội bộ.

SP cần xác minh IdP/khóa đã tin, nơi nhận, thời hạn, tương quan với yêu cầu khi có và chống dùng lại theo profile. Không chỉ thấy Success hoặc tên user là cho login. Dùng thư viện được duy trì thay vì tự xử lý XML/chữ ký.

Metadata chứa định danh, endpoints và dữ liệu trust cần thiết. Thay certificate ký phải được phối hợp; certificate đúng cú pháp không tự là IdP đáng tin.

### 7.2. IdP-initiated và logout

Có thể nhận SAML login do IdP khởi tạo khi SP chưa tạo request trước. Điều đó thay đổi tương quan giao dịch và rủi ro; chỉ bật khi cần và theo chính sách. Không tự suy luồng này có cùng kiểm tra request-response như SP-initiated.

Assertion hết hạn không tự kết thúc phiên SP đã tạo. Single Logout cần hỗ trợ/tích hợp của các bên và không tự giải quyết mọi access token/API.

**Dùng khi:** hệ thống doanh nghiệp/đối tác yêu cầu hoặc hỗ trợ SAML phù hợp. OIDC phù hợp với nhiều ứng dụng hiện đại hỗ trợ nó, nhưng không kết luận SAML không dùng được chỉ vì nó cũ hơn. Chọn theo hợp đồng, khả năng hỗ trợ và vận hành.

Nguồn: [SAML Overview](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html), [Core](https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf), [Profiles](https://docs.oasis-open.org/security/saml/v2.0/saml-profiles-2.0-os.pdf), [Metadata](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf).

## 8. Ghép vào năm cấu trúc đã chốt ở slide 15

| Cấu trúc | Điều không được suy sai |
|---|---|
| Web monolith | Có thể tự login hoặc dùng provider; cookie sau login không mâu thuẫn OIDC |
| Web tách frontend/API | Không tự bắt buộc OIDC/JWT; browser direct API có khác biệt giữ credential |
| Web + BFF | BFF có thể thực hiện login liên kết; browser cookie, token ở backend theo ví dụ |
| Mobile + API | Có thể cùng API với web; nếu dùng OAuth/OIDC native cần browser/flow/storage phù hợp |
| Microservices | Tổ chức backend, có thể kết hợp BFF/mobile; user login khác service identity |

Đừng đọc bảng này thành cấu hình production đủ dùng. Xác định issuer/audience, loại client, nơi giữ credential, yếu tố cần thiết, quyền và thu hồi. Lý do/đánh đổi chi tiết ở [slide 15 trong tài liệu học sâu](auth-study-guide.md#slide-15). Nguồn: [Browser OAuth — RFC 10017](https://www.rfc-editor.org/rfc/rfc10017.html), [Native OAuth — RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html).

## 9. Tự kiểm tra

Giải thích một tình huống có đủ password + OTP, OIDC, cookie và access token mà không gọi chúng là bốn lựa chọn đối lập. Sau đó chỉ ra ai phát từng token, bên nào nhận và vì sao token cho API A không tự dùng cho API B.

Đọc tiếp [04 — Khi bên gọi là một service](04-machine-authentication.md).
