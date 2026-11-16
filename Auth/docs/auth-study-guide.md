# Auth — Kiến thức tổng hợp theo 16 slide

**Cập nhật: 16/11/2026.** Tài liệu học và tra cứu cho người trình bày, bám bộ 16 SVG đang chỉnh sửa. Không phải kịch bản phải đọc hết trên sân khấu. Bản PPTX đã xuất trước đây có thể khác preview hiện tại; chỉ xuất lại sau khi chốt slide.

Mục tiêu là giải thích được **ai giữ gì, gửi gì, ai kiểm tra gì, vì sao cần và giới hạn ở đâu**. Các ví dụ tài khoản, tài liệu, đơn hàng và đấu giá đều để học; không mô tả kiến trúc nội bộ của một công ty thật.

## Cách đọc

Lần đầu, đọc từ slide 1 đến 16. Trước buổi trình bày, dùng [presenter guide](auth-presentation-presenter-guide.md) để tập nói. Khi cần code hoặc một chủ đề riêng, đọc các chương 01–05 được dẫn ở từng phần. Các thuật ngữ được giải thích khi xuất hiện, không cần học thuộc danh sách viết tắt trước.

| Slide | Nội dung học |
|---|---|
| [01](#slide-01) | Bốn trách nhiệm sau màn hình đăng nhập |
| [02](#slide-02) | Bản đồ kiến thức và thứ tự giải thích |
| [03](#slide-03) | Đăng nhập tại app, đăng nhập qua provider và các tầng dễ nhầm |
| [04](#slide-04) | Yếu tố xác thực, MFA, sinh trắc học, khóa vật lý |
| [05](#slide-05) | TOTP offline, shared secret, thời gian, chống dùng lại |
| [06](#slide-06) | Passkey: challenge, chữ ký, đăng ký, kiểm tra public key |
| [07](#slide-07) | OIDC, IdP, SSO và phiên của ứng dụng |
| [08](#slide-08) | OAuth, scope, token issuer, ID/access/refresh token, PKCE |
| [09](#slide-09) | Service identity, mTLS, HMAC, chữ ký request |
| [10](#slide-10) | Session, cookie, ticket, nhận diện request tiếp theo |
| [11](#slide-11) | Bearer token, JWT và credential bị sao chép |
| [12](#slide-12) | RBAC, ABAC, ReBAC, ACL: cơ chế, ví dụ, lựa chọn |
| [13](#slide-13) | Cấu hình, hook và custom handler trong .NET |
| [14](#slide-14) | Thu hồi session/access/refresh và độ trễ thực thi |
| [15](#slide-15) | Năm cấu trúc dự án và bốn câu hỏi thiết kế auth |
| [16](#slide-16) | Ghép một request hoàn chỉnh, tự kiểm tra trước khi trình bày |

<a id="slide-01"></a>
## Slide 01 — Beyond the Login Screen

Bốn nhãn hiện tại là **Authenticate → Stay Signed In → Authorize → Revoke Access**. Chúng là bốn trách nhiệm liên quan, không phải bốn request HTTP bắt buộc chạy tuần tự mỗi lần.

**Authenticate — xác thực:** kiểm tra bằng chứng để xác định bên đang truy cập là người dùng hoặc service nào. Ví dụ kiểm tra mật khẩu, xác minh chữ ký passkey, hoặc kiểm tra token của request. Authentication không chỉ xảy ra ở màn hình login: mỗi request được bảo vệ vẫn cần credential hợp lệ theo cơ chế đã chọn.

**Stay Signed In — tiếp tục được nhận diện sau đăng nhập:** sau lần xác thực đầu, client trình cookie hoặc token cho các lần gọi sau. “Stay Signed In” là cách đặt tên dễ hiểu, không phải tên giao thức. Nó không có nghĩa giữ kết nối mạng luôn mở, không bao giờ hỏi lại mật khẩu, hoặc luôn phải có bảng session trong DB.

**Authorize — phân quyền:** đã biết Anna là ai, server còn phải quyết định Anna có được đặt giá ở auction 42 hay không. Biết danh tính không đồng nghĩa có mọi quyền.

**Revoke Access — chấm dứt quyền truy cập đã cấp:** làm credential cũ bị từ chối ở nơi xử lý thật. Xóa cookie ở một browser không xóa bản sao ở nơi khác. Token có chữ ký không tự nhận được thông tin “tài khoản vừa bị khóa”.

Ví dụ xuyên suốt:

~~~text
Anna đăng nhập → hệ thống cấp credential truy cập
Anna gửi bid + credential → server xác thực request
Server kiểm tra quyền trên auction 42 → kiểm tra nghiệp vụ → ghi bid
Thu hồi phiên → những đường kiểm tra trạng thái mới phải từ chối credential cũ
~~~

**Câu nói được trên sân khấu:** “Login giúp mình chứng minh danh tính lần đầu. Bài này còn xem request sau đó được nhận diện, được cấp quyền và bị chặn lại như thế nào.”

<a id="slide-02"></a>
## Slide 02 — Agenda

Sáu phần trên agenda: Authentication & Sign-In; Sessions & Tokens; Authorization; Revocation; Choosing an Auth Architecture; Recap & Q&A. Không còn slide demo BidLab riêng hoặc appendix trong bộ 16 trang hiện tại. Các ví dụ đấu giá vẫn dùng để giải thích, không phải cam kết có lab chạy được.

Đừng mở bài bằng việc đọc một loạt tên công nghệ. Hãy dẫn bằng câu hỏi: đăng nhập bằng gì; request tiếp theo mang gì; ai được làm gì; làm sao chặn truy cập; sau cùng mới ghép vào kiến trúc dự án.

**Authentication** và **authorization** thường cùng được gọi tắt là “auth”. Khi giải thích, dùng “xác thực” và “phân quyền” để người nghe biết đang trả lời câu hỏi nào.

<a id="slide-03"></a>
## Slide 03 — Authentication Overview

Có hai cách tổ chức việc xác thực người dùng trong hình:

- **Đăng nhập với app:** thành phần auth của hệ thống tự kiểm tra password, OTP, passkey hoặc credential được hỗ trợ.
- **Đăng nhập qua nhà cung cấp danh tính:** app tin một bên đã cấu hình, nhận và kiểm tra kết quả xác thực qua OIDC hoặc SAML.

“App tự xử lý” không có nghĩa tự viết thuật toán mật mã. Có thể dùng framework/library được duy trì và dịch vụ tài khoản của chính tổ chức. “Qua provider” không có nghĩa người dùng không dùng mật khẩu: provider có thể dùng password, OTP, passkey hoặc nhiều yếu tố.

### Bốn tầng cần phân biệt

| Tầng | Câu hỏi | Ví dụ |
|---|---|---|
| Bằng chứng/yếu tố | Người dùng chứng minh điều gì? | Password, quyền dùng khóa, sinh trắc học |
| Nơi xử lý | Ai thực hiện xác thực? | Auth backend của app, identity provider |
| Giao thức liên kết | App nhận kết quả từ bên khác thế nào? | OIDC, SAML |
| Credential sau đăng nhập | Request sau đó mang gì? | Cookie phiên, access token |

**IdP** là viết tắt của **Identity Provider**, một vai trò hệ thống. **OIDC** là **OpenID Connect**, một giao thức dựa trên OAuth 2.0. OIDC không phải viết tắt hay một loại IdP. Một provider có thể hỗ trợ nhiều giao thức.

Ví dụ kết hợp hợp lệ: provider xác thực bằng password + OTP; web app nhận kết quả qua OIDC; app tạo cookie phiên; backend dùng access token khi gọi một API. Không có mâu thuẫn giữa bốn lựa chọn này.

Đọc thêm: [chương xác thực người dùng](01-user-authentication.md), [OAuth/OIDC/SAML](03-oauth-oidc-saml.md).

<a id="slide-04"></a>
## Slide 04 — Three Types of Authentication Factors

Ba nhóm là **điều biết**, **thứ có/kiểm soát được**, **đặc điểm sinh trắc học**. Đây là nhóm bằng chứng, không phải ba loại màn hình.

| Nhóm | Ví dụ | Điều cần hiểu đúng |
|---|---|---|
| Knowledge — điều biết | Password, passphrase, PIN | PIN dùng tại authenticator khác password gửi cho server |
| Possession — thứ có | OTP authenticator, security key, smart card, quyền sử dụng private key | Tên thiết bị không tự chứng minh giao thức đang dùng |
| Biometric — sinh trắc học | Vân tay, khuôn mặt, mống mắt | Thường được kiểm tra để kích hoạt authenticator; không mặc nhiên gửi dữ liệu sinh trắc lên website |

**MFA** yêu cầu ít nhất hai yếu tố thuộc các nhóm khác nhau theo cơ chế bảo đảm tương ứng. **2FA** là trường hợp hai yếu tố. Hai mật khẩu, hoặc hai màn hình hỏi cùng một bí mật, không tự trở thành MFA. Passwordless chỉ nói không dùng mật khẩu theo luồng đó, không tự bảo đảm mức an toàn nào.

### Vân tay, passkey và khóa vật lý liên hệ thế nào?

**Passkey** là credential dựa trên khóa công khai; **security key** là một loại authenticator vật lý có thể lưu/sử dụng credential; **vân tay/PIN** có thể xác minh người dùng ngay tại authenticator trước khi cho phép dùng private key. Chúng không phải ba lựa chọn luôn loại trừ nhau.

Ví dụ: Anna cắm security key, nhập PIN của key rồi key ký dữ liệu WebAuthn. Hoặc Anna dùng passkey trên điện thoại và xác nhận bằng khuôn mặt. Website nhận kết quả mật mã cùng thông tin xác minh theo giao thức, không nhận ảnh khuôn mặt để tự so.

Một key có thể hỗ trợ nhiều chức năng; không suy mọi USB key đều là passkey. Chạm vào key để xác nhận **user presence** cũng khác **user verification** bằng PIN/sinh trắc học. Đánh giá MFA/phishing resistance theo loại authenticator, thông tin xác minh và chính sách, không chỉ theo số động tác người dùng làm.

**Khôi phục tài khoản** và **thêm yếu tố mới** phải được bảo vệ tương xứng. Một luồng đăng nhập mạnh vẫn có thể bị bỏ qua nếu recovery chỉ cần dữ liệu dễ đoán. Chuẩn NIST có yêu cầu riêng về việc sử dụng sinh trắc học cùng authenticator; phân loại trên slide là bản nhập môn, không phải chứng nhận tuân thủ. [NIST — Authenticator requirements](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/).

<a id="slide-05"></a>
## Slide 05 — TOTP: Your Authenticator Works Offline

TOTP là **Time-based One-Time Password**. Khi thiết lập, app xác thực và server có cùng secret dành cho credential đó. App không hỏi server “mã hiện tại là gì”; hai bên tự tính từ secret và bước thời gian.

~~~text
T = floor((thời gian hiện tại − mốc ban đầu) / độ dài bước)
Mã = phép tính HOTP với secret và T, rồi lấy số chữ số theo cấu hình
~~~

Đây là mô tả để hiểu; triển khai dùng thư viện chuẩn, không chép công thức giản lược thành thuật toán production. Bước 30 giây là giá trị phổ biến, không phải mọi dịch vụ đều bắt buộc như nhau.

### Vì sao không cần Internet?

Secret đã có trên điện thoại, đồng hồ cũng có tại chỗ. Điện thoại có thể tính mã khi offline. Nhưng trang đăng nhập vẫn phải gửi mã tới server để được kiểm tra; “offline” chỉ nói về **việc tạo mã trên authenticator**.

### Server kiểm tra thế nào?

Server tìm secret đúng tài khoản/credential, tính mã theo thời gian của mình và kiểm tra một cửa sổ được cấu hình để xử lý lệch đồng hồ. Cần giới hạn số lần thử, ngăn dùng lại mã đã được chấp nhận trong thời gian hợp lệ và cập nhật trạng thái một cách nhất quán khi request đồng thời. Không chỉ so sáu chữ số rồi luôn cho qua.

### TOTP khác SMS/email OTP và HOTP?

| Cơ chế | Nguồn mã | Điều làm đầu vào đổi |
|---|---|---|
| HOTP | Secret + counter | Bộ đếm tiến lên theo cách dùng |
| TOTP | Secret + bước thời gian | Đồng hồ chuyển sang bước mới |
| OTP gửi SMS/email thường gặp | Server phát mã rồi gửi | Một lần phát mã theo chính sách |

SMS/email là **kênh chuyển mã**; mã hết hạn sau 30 giây không tự biến nó thành TOTP. TOTP không phải mã hóa thời gian rồi gửi secret lên server. Server phải có khả năng dùng secret để tính; chỉ lưu hash một chiều của seed thường không đủ để thực hiện phép tính tương ứng.

**Giới hạn:** người lấy được seed có thể tạo mã; người lấy được mã còn hiệu lực có thể chuyển tiếp ngay. Challenge hoặc thời gian ngắn giúp hạn chế replay nhưng OTP nhập tay vẫn có thể bị phishing thời gian thực. [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226.html), [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html).

<a id="slide-06"></a>
## Slide 06 — Passkeys: Register and Sign In

Đây là slide cần phân biệt **hai lần khác nhau**: lần gắn credential mới vào tài khoản và lần dùng credential đã đăng ký để đăng nhập. Browser là bên điều phối; authenticator quản lý và dùng private key; backend quyết định có chấp nhận kết quả hay không.

### 6.1. Challenge để làm gì?

Challenge là dữ liệu ngẫu nhiên do server tạo cho một lần đăng ký/xác thực. Nó giúp ràng buộc phản hồi vào yêu cầu đang chờ và ngăn dùng nguyên một phản hồi cũ cho lần mới.

Ví dụ minh họa dùng chuỗi ngắn để dễ đọc; challenge thật phải có entropy và cách sinh phù hợp:

~~~text
Lần đăng nhập 1: challenge ABC123 → phản hồi đã ký S1
Lần đăng nhập 2: challenge XYZ789 → phải có phản hồi cho XYZ789
~~~

Gửi ABC123 + S1 ở lần 2: không khớp challenge. Đổi dữ liệu thành XYZ789 nhưng giữ S1: chữ ký không hợp lệ với dữ liệu mới. Server phải ghi nhận challenge còn hiệu lực, thuộc đúng giao dịch và không được dùng lại sau khi đã chấp nhận. Hết hạn và xử lý đồng thời cũng phải được thiết kế.

### 6.2. Private key ký hay mã hóa challenge?

**Ký**, không phải mã hóa để server giải mã. Public key xác minh quan hệ giữa dữ liệu và chữ ký; nó không cần khôi phục challenge từ chữ ký.

Phản hồi đăng nhập có dữ liệu như clientDataJSON, authenticatorData, signature và credential ID. Challenge nằm trong clientDataJSON. Trong WebAuthn authentication, authenticator ký trên authenticatorData nối với SHA-256 của clientDataJSON. Vì thế challenge được ràng buộc vào chữ ký thông qua hash, cùng các thông tin kiểm tra khác.

~~~text
Server đã lưu challenge đang chờ
                ↓
Browser trả dữ liệu chứa challenge + authenticatorData + signature
                ↓
Server so challenge và origin
Server dùng public key kiểm tra chữ ký trên dữ liệu theo giao thức
Server kiểm tra RP ID, cờ xác minh và các điều kiện bắt buộc
~~~

Không mô tả “private key mã hóa, public key giải mã” như định nghĩa của chữ ký. Cách nói đó gây nhầm giữa tính bí mật và tính xác thực, đồng thời không đúng cho mọi thuật toán chữ ký.

### 6.3. Người khác đọc được dữ liệu raw thì sao?

Chữ ký **không che giấu nội dung**. Challenge không cần là bí mật như private key. Người chỉ biết challenge không tạo được chữ ký mới hợp lệ bằng public key.

Nếu kẻ khác có **toàn bộ phản hồi còn hiệu lực**, không nên khẳng định “chắc chắn vô dụng”: cần xét giao dịch đang chờ, phiên, chống dùng lại và khả năng gửi trước người dùng. HTTPS bảo vệ truyền tải; server gắn đúng giao dịch và tiêu thụ challenge một lần; WebAuthn còn ràng buộc website/origin theo giao thức. Challenge mới giải quyết replay cũ, không thay thế mọi kiểm soát khác.

### 6.4. Đăng ký: Verify and store public key thực sự làm gì?

Trước khi thêm passkey, hệ thống phải biết **đang thêm cho tài khoản nào và ai có quyền thêm**. Có thể là phiên đã xác thực hoặc một luồng tạo tài khoản/binding được bảo vệ. Một public key đúng định dạng không tự chứng minh chủ sở hữu của tài khoản.

Các bước logic:

1. Backend phát creation options, challenge và dữ liệu tài khoản/RP theo giao dịch đăng ký.
2. Browser gọi navigator.credentials.create(); authenticator tạo credential mới theo yêu cầu.
3. Browser gửi clientDataJSON và attestationObject về backend. Public key/credential ID nằm trong dữ liệu credential đăng ký, không chỉ là một public key rời do frontend tự khai.
4. Backend kiểm tra loại thao tác là webauthn.create; challenge khớp; origin hợp lệ; RP ID hash đúng; có user presence và user verification theo chính sách; thuật toán và cấu trúc credential được chấp nhận; credential không bị gắn nhầm tài khoản.
5. Xử lý attestation theo format và policy. **Không có quy tắc “mọi đăng ký đều có chữ ký cần kiểm tra bằng public key mới”**: với attestation none không có attestation signature; các format khác có quy tắc xác minh khác nhau.
6. Chỉ sau khi chấp nhận, gắn credential ID và public key vào đúng user; lưu metadata phục vụ xác thực, quản lý credential và chính sách.

Attestation có thể giúp đánh giá nguồn gốc/đặc tính authenticator. Nó không thay việc xác minh ai có quyền thêm credential vào tài khoản. Với none, không nên diễn đạt rằng server đã có bằng chứng attestation về phần cứng hoặc một chứng minh giữ khóa cùng loại với assertion đăng nhập.

### 6.5. Đăng nhập: Verify with stored public key

Backend phát request options và challenge mới; browser gọi navigator.credentials.get(). Authenticator có thể yêu cầu PIN hoặc sinh trắc học theo khả năng và policy, rồi dùng credential để tạo assertion.

Server tìm credential đã đăng ký, đối chiếu user/account theo luồng discoverable hoặc định danh trước, kiểm tra webauthn.get, challenge, origin, RP ID hash, chữ ký và flags bắt buộc. Nếu dùng signature counter để đánh giá rủi ro thì phải xử lý theo đặc tính authenticator; không suy mọi synced passkey đều có counter tăng đơn điệu hữu ích.

Xác thực đạt rồi app mới tạo phiên/cấp credential truy cập. Public key không cần giữ bí mật nhưng cần **toàn vẹn và liên kết đúng tài khoản**: attacker thay được public key trong DB có thể tạo credential cho khóa của mình.

### 6.6. Passkey bảo vệ gì, không bảo vệ gì?

WebAuthn có ràng buộc RP/origin giúp chống phishing theo giao thức; OTP nhập tay không có cùng ràng buộc này. Tuy nhiên, passkey không tự bảo vệ mọi credential sau đăng nhập. App vẫn có thể cấp bearer cookie/token và bản sao của credential đó vẫn cần được bảo vệ, thu hồi.

Synced passkey có thể được đồng bộ theo cơ chế nhà cung cấp; đừng nói private key “không bao giờ rời đúng một thiết bị”. Với app backend, điều quan trọng là không nhận private key từ client và dùng bằng chứng WebAuthn hợp lệ. Recovery, thêm/xóa credential và bảo vệ tài khoản đồng bộ là các đường cần xem xét riêng.

Các mô tả bước trên là bản học, không thay thuật toán kiểm tra đầy đủ trong thư viện WebAuthn. [W3C WebAuthn — Registration and authentication](https://www.w3.org/TR/webauthn-3/#sctn-rp-operations). Xem thêm [chương 01, phần passkey](01-user-authentication.md).

<a id="slide-07"></a>
## Slide 07 — OIDC: Sign In with an Identity Provider

**OIDC = OpenID Connect. IdP = Identity Provider.** Một cái là giao thức, một cái là bên thực hiện vai trò danh tính. Trong OIDC, provider được gọi chính xác là OpenID Provider; app là Relying Party.

Ví dụ: app lịch của công ty tin dịch vụ danh tính doanh nghiệp. Anna đăng nhập ở provider bằng password + OTP hoặc passkey. App không tự kiểm tra những bằng chứng đó, mà kiểm tra kết quả OIDC theo cấu hình đã tin cậy.

### Luồng đang thể hiện trên slide

App khởi tạo giao dịch đăng nhập, chuyển browser tới provider với scope openid và các tham số cần thiết. Provider xác thực hoặc sử dụng phiên hiện có theo policy. Browser quay về callback của app với authorization code. Client thực hiện code exchange theo loại client và biện pháp bảo vệ của flow, nhận token, kiểm tra ID token và liên kết giao dịch trước khi tạo phiên app.

Code là mã trao đổi tạm thời, không phải danh tính đã được app tin ngay. ID token là kết quả xác thực cho client; access token có mục đích/nơi nhận khác.

### App kiểm tra gì trước khi tin?

Thư viện phải kiểm tra bên phát hành đã cấu hình, chữ ký và khóa được tin, audience cho đúng client, thời hạn, nonce khi đã gửi và các điều kiện của flow. Kiểm tra state/correlation và redirect URI theo giao thức/thư viện. Các giá trị đều có vai trò riêng, không thay nhau chỉ vì cùng ngẫu nhiên.

Danh tính từ provider thường được ánh xạ bằng cặp issuer + subject sang user nội bộ. Không tự gộp tài khoản chỉ vì cùng email mà chưa có chính sách liên kết đáng tin cậy.

### SSO và cookie của app

Có thể tồn tại phiên ở provider, phiên ở app A và phiên ở app B. Người dùng vào app B, được chuyển tới provider đang có phiên, nên có thể không phải nhập lại credential. App B vẫn tạo trạng thái đăng nhập riêng.

SSO là trải nghiệm/khả năng đăng nhập liên kết, không phải tên một giao thức. Đăng xuất app A chưa chắc kết thúc phiên provider, app B, access token hay kết nối đang mở. Muốn làm global logout phải tích hợp và xác minh cơ chế cụ thể, không chỉ xóa một cookie.

### SAML ở đâu?

SAML Web SSO cũng cho app nhận kết quả từ IdP nhưng dùng message/assertion và quy tắc khác OIDC. Nhiều tích hợp doanh nghiệp yêu cầu SAML; không gọi SAML là “OIDC dùng XML”. Chọn theo khả năng tích hợp và yêu cầu hệ thống, không cần dạy toàn bộ SAML trên slide OIDC. [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html), [SAML Technical Overview](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html).

<a id="slide-08"></a>
## Slide 08 — OAuth 2.0: Grant Access to an API

Nhu cầu trong hình: app lịch muốn đọc lịch Google của Anna mà không giữ password Google của cô ấy. OAuth tổ chức việc cấp quyền API. OIDC bổ sung lớp xác thực người dùng; OAuth đơn thuần không định nghĩa trọn vẹn login ứng dụng.

Bốn vai trò: Anna là resource owner; Calendar app là client; authorization server phát token theo quyền được phép; Google Calendar API là resource server. Một sản phẩm có thể đảm nhận nhiều vai trò; không bắt buộc bốn server vật lý.

### Ba loại token không dùng thay nhau

| Loại | Ai dùng/nhận? | Mục đích |
|---|---|---|
| ID token | Client đăng nhập | Kiểm tra kết quả xác thực theo OIDC |
| Access token | Resource API | Truy cập theo quyền và điều kiện token |
| Refresh token | Token endpoint của authorization server | Xin access token mới khi được phép |

Access token có thể là JWT hoặc opaque. “Access” nói về mục đích; “JWT” nói về định dạng; “Bearer” nói về cách trình token. Ba nhãn không loại trừ nhau. ID token OIDC có định dạng JWT, nhưng điều đó không làm nó dùng được thay access token.

### API token là token BE cấp hay token provider cấp?

Trong tài liệu hiện tại, dùng tên **access token** thay nhãn chung “API token” khi nói credential để gọi API. Issuer có thể là auth backend của hệ thống hoặc authorization server trong nền tảng danh tính. “BE” và “IdP” không luôn là hai công ty hay hai máy khác nhau; cần xác định **vai trò phát hành và cấu hình tin cậy**.

Token do Google cấp để gọi Calendar không tự dùng được cho Order API của mình. API phải được cấu hình tin đúng issuer, audience và quy tắc quyền. Kể cả chữ ký hợp lệ nhưng audience khác thì vẫn từ chối. Không để mọi microservice tự nhận password và tự phát loại token riêng chỉ vì chúng đều là backend.

### Scope, audience và quyền tài nguyên

Audience trả lời token dành cho API nào; scope mô tả phạm vi truy cập đã cấp cho client theo hợp đồng API. Scope orders:read không mặc nhiên cho Anna xem mọi order. API còn kiểm tra tenant, chủ sở hữu hoặc quan hệ với order cụ thể.

Consent là việc cho phép cấp phạm vi truy cập; có thể thực hiện bằng tương tác hoặc chính sách tổ chức. Không phải mọi request đều hiện một hộp thoại xin quyền.

### PKCE có vai trò gì và vì sao không đặt thành loại kiến trúc?

PKCE là Proof Key for Code Exchange, bảo vệ code exchange. Client tạo verifier riêng cho giao dịch; gửi challenge tương ứng ở bước đầu; gửi verifier khi đổi code. Bên chỉ lấy được code nhưng không có verifier thiếu bằng chứng để đổi thành token.

Nó không phải một kiến trúc, một loại credential của người dùng hay một màn hình đăng nhập. Không cần đưa PKCE thành lựa chọn ngang BFF/mobile trên slide kiến trúc. Tuy nhiên, khi triển khai OAuth/OIDC cho public client, không được vì “chỉ là chi tiết” mà bỏ kiểm soát này. PKCE cũng không giải quyết access token đã bị lấy hoặc XSS đã kiểm soát client.

**Public client** là client không thể giữ một secret cố định bí mật khỏi người sử dụng/attacker, như JavaScript trong browser và app native phân phối tới người dùng. **Confidential client** có môi trường giữ credential phù hợp, như backend. Client ID là mã định danh, không phải secret.

Nếu backend tự quản lý login bằng password rồi tạo session/token, điều đó không tự là OAuth Resource Owner Password Credentials grant. Password Grant là một flow OAuth cụ thể và bị hướng dẫn bảo mật hiện hành loại bỏ; không đánh đồng hai thiết kế chỉ vì đều có password. [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749.html), [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html), [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html).

<a id="slide-09"></a>
## Slide 09 — Service-to-Service Authentication

Order Service gọi Payment Service để xử lý nghiệp vụ. Nếu đang chạy bằng quyền ứng dụng, cần xác thực **Order Service**, không giả vờ có nhân viên đang nhập OTP. Nếu thực hiện thay người dùng, cần thiết kế quyền ủy quyền phù hợp; app-only identity không tự thay được quyền người dùng.

### 9.1. Shared secret: API key và Basic

API key có thể là secret được ánh xạ tới bên tích hợp. Nhưng có sản phẩm dùng key công khai chỉ cho quota/billing, nên phải kiểm tra ý nghĩa cụ thể. Basic gửi user/password biểu diễn bằng Base64; Base64 không mã hóa bí mật. Hai cách này cần HTTPS, quyền hẹp, khả năng xoay vòng và thu hồi riêng từng bên.

### 9.2. Access token và Client Credentials

Order xác thực với authorization server bằng cơ chế được hỗ trợ rồi xin token bằng Client Credentials. Authorization server cấp access token cho quyền của Order; Payment kiểm tra token và quyền. Credential để xin token và access token dùng ở API là hai thứ khác nhau.

Client secret, mTLS hoặc private-key JWT có thể là cách xác thực client tại token endpoint. Client Credentials là grant, không phải một thuật toán chữ ký. Theo luồng chuẩn, không kỳ vọng refresh token như một phiên người dùng; service có thể xác thực và xin token mới. Workload identity của nền tảng có thể giảm secret tĩnh, nhưng vẫn phải hiểu loại token/certificate được cấp và ai tin nó.

### 9.3. mTLS là gì?

TLS thông thường cho client kiểm tra certificate server. **Mutual TLS** bổ sung việc client trình certificate và chứng minh giữ private key tương ứng trong handshake. Certificate chứa public key và thông tin nhận dạng; quy tắc tin cậy quyết định certificate nào được chấp nhận.

~~~text
Order kiểm tra certificate của Payment
Payment kiểm tra certificate của Order
Mỗi bên chứng minh có khả năng dùng private key tương ứng
→ Thiết lập kênh TLS đã xác thực hai chiều
~~~

Certificate công khai có thể bị sao chép; thiếu private key thì không tạo được bằng chứng TLS tương ứng. Sau mTLS, ứng dụng vẫn phải ánh xạ danh tính và kiểm tra quyền. Certificate hợp lệ không tự cho phép hoàn tiền mọi giao dịch.

Nếu TLS kết thúc tại gateway/proxy, backend chỉ nên tin danh tính được chuyển tiếp trên đường đã bảo vệ và sau khi loại bỏ header giả từ bên ngoài. Quản lý CA/trust, cấp phát, thời hạn, xoay vòng và thu hồi certificate là chi phí vận hành chính.

mTLS xác thực client tại token endpoint và certificate-bound access token là hai khả năng khác nhau. Chỉ dùng mTLS khi xin token chưa đủ để nói token đã bị sao chép sẽ vô dụng ở API; API phải kiểm tra ràng buộc certificate theo thiết kế.

### 9.4. Signed request là gì?

Bên gửi tạo MAC/chữ ký trên các thành phần đã quy định của request. Bên nhận kiểm tra trước khi xử lý. Có thể bảo vệ method, địa chỉ đích, các header quan trọng và digest của body; phạm vi chính xác phụ thuộc giao thức, không phải mọi byte luôn được ký tự động.

Ví dụ học:

~~~text
POST /payments
Body: orderId=42, amount=500000
Thời điểm + nonce + định danh khóa
MAC/chữ ký bảo vệ các thành phần đã thống nhất
~~~

Nếu amount được bảo vệ qua body digest và attacker sửa amount, kiểm tra phải thất bại. Nhưng nếu chỉ ký timestamp mà bỏ body, không thể tuyên bố toàn bộ khoản thanh toán không bị sửa.

### 9.5. HMAC khác asymmetric signature thế nào?

| | HMAC | Chữ ký bất đối xứng |
|---|---|---|
| Khóa tạo | Shared secret K | Private key |
| Khóa kiểm tra | Cũng là K | Public key đã được tin cậy |
| Cách kiểm tra | Tính lại MAC theo cùng dữ liệu, so khớp an toàn | Xác minh chữ ký bằng public key |
| Bên nhận có thể tự tạo bằng chứng hợp lệ? | Có, vì cũng giữ K | Không, nếu chỉ giữ public key |
| Ví dụ | HMAC-SHA256 | RSA-PSS, ECDSA, Ed25519 |

HMAC là Message Authentication Code, không phải chữ ký số bất đối xứng. Cả hai bảo vệ tính toàn vẹn và hỗ trợ xác thực nguồn theo mô hình khóa; không che giấu nội dung. Public key phải được gắn với danh tính theo nguồn tin cậy; không nhận key tùy ý kèm request rồi tin ngay.

### 9.6. Nếu attacker lấy dữ liệu + chữ ký rồi gửi lại?

Chữ ký hợp lệ không tự có tính “dùng một lần”. Hệ thống cần kiểm tra thời điểm/thời hạn, nonce hoặc định danh request và trạng thái đã dùng theo policy. Timestamp chỉ giới hạn cửa sổ, chưa tự chặn mọi replay trong cửa sổ đó. Với thanh toán, **idempotency** giải quyết tác dụng nghiệp vụ khi gửi lặp, nhưng không thay kiểm tra danh tính/chống replay.

Chuẩn hóa dữ liệu ký rất quan trọng: hai bên phải hiểu giống nhau method, URL, body digest, encoding và header. Dùng giao thức/library cụ thể thay vì tự nối vài chuỗi rồi cho là an toàn.

### 9.7. mTLS và signed request khác nhau ở đâu?

mTLS xác thực bên tham gia **kết nối TLS**. Signed request bảo vệ **những thành phần thông điệp đã ký**. Có thể dùng cùng nhau và cùng OAuth. Chữ ký request không thay HTTPS, vì không cung cấp bí mật truyền tải. [TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html), [OAuth mTLS](https://www.rfc-editor.org/rfc/rfc8705.html), [HTTP Message Signatures](https://www.rfc-editor.org/rfc/rfc9421.html).

Đọc thêm cách lưu key, xoay vòng và DPoP trong [chương machine authentication](04-machine-authentication.md).

<a id="slide-10"></a>
## Slide 10 — Sessions and Cookies

Slide minh họa **server-side session**: đăng nhập xong, server tạo session ID khó đoán, lưu liên kết với Anna và đặt ID vào cookie. Browser gửi cookie ở request phù hợp; server tra phiên, kiểm tra trạng thái rồi tạo danh tính cho request.

| Thành phần | Là gì? | Không tự bảo đảm điều gì? |
|---|---|---|
| Session | Trạng thái/ngữ cảnh truy cập được quản lý | Không nhất thiết là một bảng DB hoặc một kết nối mạng |
| Cookie | Cách browser lưu/gửi dữ liệu theo quy tắc | Không mặc nhiên là server-side session |
| Authentication ticket | Dữ liệu đăng nhập được framework bảo vệ | Không mặc nhiên tra trạng thái DB mỗi request |
| Access token | Credential cho quyền truy cập API | Không mặc nhiên là JWT hay có session store |

Cookie có thể mang session ID, ticket được bảo vệ hoặc dữ liệu khác. Vì vậy **cookie và JWT không phải hai loại cùng một trục**: cookie là cơ chế mang dữ liệu, JWT là định dạng. Trong ASP.NET Core, cookie authentication có thể dùng ticket được Data Protection bảo vệ; không nhầm với Session middleware dùng lưu dữ liệu phiên ứng dụng.

### Các thuộc tính cookie cần hiểu

- Secure giới hạn cách gửi theo quy tắc kết nối bảo mật.
- HttpOnly ngăn JavaScript đọc cookie qua các API cookie thông thường; không ngăn mã XSS thực hiện hành động bằng phiên hiện có.
- SameSite kiểm soát ngữ cảnh cross-site; không thay mọi kiểm soát CSRF.
- Domain, Path, thời hạn quyết định phạm vi/lưu giữ theo quy tắc browser; Path không phải ranh giới bảo mật giữa các app.

Server vẫn kiểm tra thời hạn và trạng thái riêng, không chỉ tin browser đã xóa cookie. Khi login hoặc thay đổi mức quyền, phải xử lý session fixation và việc thay credential phù hợp.

**CSRF** lợi dụng browser gửi credential tự động để thực hiện hành động không mong muốn. **XSS** là mã độc chạy trong ngữ cảnh trang. Hai rủi ro khác nhau; cookie HttpOnly không giải quyết tất cả, token trong localStorage cũng không phải giải pháp an toàn mặc định. Giữ token trong memory hạn chế lưu lâu nhưng không ngăn mã độc trong trang sử dụng nó.

### “Stateless” có nghĩa không có session nào không?

Chỉ có nghĩa thành phần đang xét không cần bản ghi lần đăng nhập trước để kiểm tra request theo thiết kế đó. API xác minh JWT tại chỗ vẫn có thể đọc DB nghiệp vụ, authorization data hoặc denylist. Authorization server vẫn có thể lưu user, refresh token, consent và phiên đăng nhập. Phải nói rõ **thành phần nào, bước nào** là stateless. [ASP.NET Core cookie authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0), [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

<a id="slide-11"></a>
## Slide 11 — Bearer Tokens

**Bearer** nghĩa là bên cầm token có thể trình nó để sử dụng quyền nếu các kiểm tra khác đạt. Với bearer thông thường, API không yêu cầu thêm chữ ký mới do client tạo cho từng request.

~~~text
Anna:        token A → API → danh tính Anna
Bên sao chép: token A → API → cũng có thể là danh tính Anna
~~~

Server vẫn kiểm tra token đúng issuer, audience, còn hạn và có quyền cần thiết. Điểm của hình là **chỉ có token hợp lệ không đủ phân biệt ai đang giữ bản sao**.

### Chữ ký JWT có chống copy không?

Không. Nếu token là JWT đã ký, attacker copy cả payload lẫn chữ ký hợp lệ. Chữ ký ngăn sửa token hoặc tự tạo token mới không có khóa, không ngăn dùng lại nguyên token kiểu bearer còn được chấp nhận.

JWT ký phổ biến có header.payload.signature. Decode Base64url chỉ đọc cấu trúc, không xác minh. Chữ ký/MAC không tự mã hóa payload. JWE là cơ chế mã hóa khác; không dùng câu “JWT luôn mã hóa”.

### Bearer token khác passkey assertion

Access token bearer được dùng lại trong thời gian cho phép. Passkey assertion gắn với challenge của một lần xác thực và phải được server kiểm tra đúng giao dịch. Không thể suy “passkey dùng chữ ký an toàn, vậy JWT cũng không copy được” chỉ vì cả hai có chữ ký.

Cookie session ID và API key bí mật cũng có đặc tính bên cầm bản sao có thể sử dụng nếu không có ràng buộc bổ sung. Đổi vị trí token từ header sang cookie không tự giải quyết replay.

### Hạn chế tác hại của credential bị lấy

Bảo vệ truyền tải và nơi lưu, không log credential nguyên bản, giới hạn quyền/thời hạn, có cơ chế thu hồi và phát hiện rủi ro. DPoP hoặc certificate-bound access token có thể yêu cầu bằng chứng giữ khóa ngoài chuỗi token. Nếu attacker còn kiểm soát client và gọi được thao tác ký, không được hứa rằng những cơ chế đó chặn mọi cuộc tấn công.

IP/User-Agent mới chỉ là tín hiệu. Chúng có thể thay đổi hợp lệ hoặc bị giả; không phải cách xác định chắc ai là attacker. [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html), [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html), [DPoP](https://www.rfc-editor.org/rfc/rfc9449.html).

<a id="slide-12"></a>
## Slide 12 — Common Authorization Models

Quyết định phân quyền thường nhận bốn đầu vào: **chủ thể, hành động, tài nguyên, ngữ cảnh**. Ví dụ: An có được sửa document 42 vào lúc này không? Bốn cách dưới đây khác mô hình tổ chức dữ liệu và quy tắc; có thể kết hợp trong cùng hệ thống.

### 12.1. RBAC — Role-Based Access Control

**Quyền qua vai trò.** An có role Editor; Editor có permission document.edit; policy xác nhận permission đó trong đúng phạm vi.

~~~text
UserRoles:       An → Editor trong Project A
RolePermissions: Editor → document.read, document.edit
~~~

Server lấy user từ principal đã xác thực, tra role/permission rồi áp dụng phạm vi project/tenant. Role Editor trong Project A không tự là Editor toàn hệ thống. Nên kiểm tra permission theo thiết kế thay vì rải tên role tùy tiện khắp code.

**Ưu:** dễ quản trị khi quyền ổn định theo chức năng; thêm nhân viên chỉ cần gán role. **Nhược:** nhiều ngoại lệ theo tài nguyên, trạng thái, thời gian dễ dẫn tới quá nhiều role. **Dùng khi:** màn hình quản trị, bộ phận bán hàng/kế toán, chức danh và bộ quyền rõ ràng.

### 12.2. ABAC — Attribute-Based Access Control

**Đánh giá thuộc tính bằng policy.** Ví dụ An được sửa tài liệu nếu cùng phòng ban, đủ clearance và tài liệu còn Draft.

~~~text
An:       department=Finance, clearance=3
Document: department=Finance, level=2, status=Draft

allow edit = cùng department AND clearance >= level AND status == Draft
~~~

Server tải thuộc tính từ nguồn tin cậy, kiểm tra dữ liệu bắt buộc rồi đánh giá rule cho action. Không tin department, clearance hay isOwner chỉ vì frontend gửi trong body. Khi document chuyển Published, quyền sửa có thể mất ở lần kiểm tra tiếp theo dù role của An không đổi.

**Ưu:** diễn đạt điều kiện nghiệp vụ/ngữ cảnh chi tiết; một rule áp dụng nhiều tài nguyên. **Nhược:** policy phức tạp, thuộc tính sai/cũ dẫn tới quyết định sai, cần giải thích vì sao bị từ chối. **Dùng khi:** hạn mức duyệt, phân loại dữ liệu, trạng thái, điều kiện thiết bị/mạng/thời gian.

### 12.3. ReBAC — Relationship-Based Access Control

**Suy ra quyền từ quan hệ.** An là thành viên Team Finance; team có quyền editor trên Folder Budget; document 42 thuộc folder đó.

~~~text
An → member → Team Finance → editor → Folder Budget ← parent ← Document 42
Rule: editor của folder được sửa document thuộc folder
~~~

Hệ thống lưu các quan hệ và model định nghĩa quan hệ nào cho phép hành động nào. Có thể dùng bảng SQL và JOIN/EXISTS; không bắt buộc có graph database hoặc dịch vụ authorization riêng ngay từ đầu. Engine chuyên dụng hữu ích khi có nhiều loại quan hệ, nhóm lồng nhau và nhiều cấp kế thừa.

Nếu An rời team, đường quyền qua team mất hiệu lực. Nhưng nếu An còn được cấp editor trực tiếp, quyền vẫn có thể còn: xóa một đường không đồng nghĩa xóa mọi quyền.

**Ưu:** tự nhiên cho cộng tác, workspace/project/folder, quyền kế thừa và sở hữu. **Nhược:** nhiều đường cấp quyền khó giải thích; cần cập nhật quan hệ và cache nhất quán. **Dùng khi:** ai thuộc team/project nào và tài nguyên nằm dưới đâu là trung tâm nghiệp vụ.

### 12.4. ACL — Access Control List

**Danh sách quyền của từng tài nguyên.** Document 42 có các mục An:edit, Bình:read, TeamManagement:edit.

~~~text
ResourceGrants(resourceId, principalType, principalId, permission)
42 | user  | An             | edit
42 | user  | Bình           | read
42 | group | TeamManagement | edit
~~~

Server tìm mục cho user hoặc group mà user thuộc về, theo action/tài nguyên. Ví dụ này dùng allow-only, không có grant thì từ chối. Một ACL cụ thể có thể hỗ trợ deny, kế thừa và thứ tự ưu tiên; phải theo semantics của hệ thống, không tự áp dụng “deny luôn thắng” cho mọi ACL.

**Ưu:** dễ chia sẻ tài nguyên cụ thể và xem ai được làm gì. **Nhược:** nhiều grant riêng lẻ khó quản trị hàng loạt; xóa grant trực tiếp chưa chắc mất quyền qua group. **Dùng khi:** nút Share, cấp quyền riêng cho file, report hoặc một đối tượng cụ thể.

### 12.5. Vì sao ABAC và ReBAC dễ bị nhầm?

Cùng yêu cầu có thể biểu diễn theo nhiều cách. Thuộc tính cũng có thể chứa thông tin suy ra từ quan hệ; ReBAC có thể kèm điều kiện. Ranh giới không tuyệt đối.

Điểm khác thực dụng là nơi policy đặt trọng tâm:

| Câu hỏi | ABAC | ReBAC |
|---|---|---|
| Dữ liệu chính | Giá trị thuộc tính của user/resource/context | Các quan hệ giữa các đối tượng |
| Cách đánh giá | So giá trị với điều kiện | Tìm quan hệ/đường quan hệ hợp lệ theo model |
| Thay đổi ví dụ | Draft → Published | An rời Team Finance |
| Mạnh ở | Điều kiện và hạn mức | Cộng tác và quyền kế thừa |

Không kết luận ABAC chỉ là một phép so sánh đơn giản hay ReBAC chỉ là xem userId == ownerId. Đó là các ví dụ nhỏ; cả hai có thể diễn đạt policy phức tạp hơn.

### 12.6. ReBAC khác ACL ở đâu?

ACL thường là danh sách grant gắn tài nguyên. ReBAC thường định nghĩa quan hệ nghiệp vụ và suy ra permission theo model. ACL với group/kế thừa và ReBAC với quan hệ viewer trực tiếp có thể rất giống nhau. Đừng dạy “ACL luôn trực tiếp, ReBAC luôn gián tiếp”; cả hai đều có thể có đường quyền trực tiếp và kế thừa tùy cách thiết kế.

### 12.7. Chọn và kết hợp

RBAC cấp khả năng edit; ReBAC/ACL xác định document nào; ABAC yêu cầu document còn Draft. Policy cuối có thể yêu cầu cả ba. Không mặc định nhiều điều kiện nghĩa là OR hay tất cả là AND: phải định nghĩa logic rõ.

Authorization khác kiểm tra nghiệp vụ. An có quyền đặt giá nhưng bid thấp hơn giá tối thiểu vẫn bị nghiệp vụ từ chối. Một điều kiện như trạng thái tài nguyên có thể được tổ chức trong policy hoặc domain tùy thiết kế; điều quan trọng là ranh giới và cách thực thi nhất quán.

**Khi quyền thay đổi:** claim cũ trong token/cookie không tự cập nhật. Cache, thời điểm đọc và race giữa kiểm tra quyền với ghi dữ liệu ảnh hưởng kết quả. Kiểm tra tài nguyên cụ thể, tenant và các đường HTTP/SignalR cùng thao tác. [NIST RBAC](https://csrc.nist.gov/projects/role-based-access-control/faqs), [NIST ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final), [Google Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/), [Microsoft ACL](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists).

Đọc code SQL, C# và tình huống kiểm thử trong [chương Authorization](05-authorization.md).

<a id="slide-13"></a>
## Slide 13 — Custom Authentication: Why and How?

Ba hàng là ba mức can thiệp, không phải ba bước bắt buộc:

| Cách | Khi nào cần? | Ví dụ |
|---|---|---|
| Configure | Scheme/library đã có hành vi cần thiết | Issuer, audience, cookie lifetime, provider |
| Add a hook | Cần thêm kiểm tra/xử lý tại điểm mở rộng có sẵn | Sau khi token hợp lệ, ánh xạ user và kiểm tra trạng thái |
| Custom handler | Credential đặc thù chưa có handler phù hợp | Header credential của hệ thống cũ với hợp đồng xác minh rõ |

Trong ASP.NET Core, **scheme** là tên gắn handler/options; **handler** xử lý cơ chế xác thực; **principal** biểu diễn danh tính đã được framework chấp nhận; **claims** là các thông tin về danh tính/token. Một hệ thống có thể dùng cookie cho web và bearer cho API.

Đừng dùng cùng chữ “challenge” theo nghĩa lẫn lộn: WebAuthn challenge là dữ liệu ngẫu nhiên cho ceremony; authentication Challenge trong .NET là hành động yêu cầu client xác thực, ví dụ trả 401 hoặc chuyển hướng đăng nhập tùy scheme.

Claims transformation dùng bổ sung/chuyển đổi thông tin danh tính; authorization handler kiểm tra quyền. Viết thêm permission không có nghĩa cần custom authentication handler. Hook không thay việc validate chữ ký, issuer, audience hoặc giao thức.

Ví dụ luồng xử lý:

~~~text
Request mang token
→ JWT bearer handler xác minh credential
→ ánh xạ issuer + subject sang user nội bộ
→ policy kiểm tra quyền trên document/auction
→ thực hiện nghiệp vụ
~~~

Với API bảo vệ bằng bearer, thiếu/sai token thường dẫn tới 401; danh tính hợp lệ nhưng thiếu quyền thường là 403. Cookie scheme có thể redirect theo cấu hình và loại endpoint; không áp một kết quả cho mọi phiên bản .NET. Cần kiểm tra behavior đúng phiên bản triển khai.

Không tự viết OAuth server/crypto chỉ để “custom auth”. Ưu tiên cấu hình và extension point của thư viện đã được kiểm chứng. [ASP.NET Core authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/?view=aspnetcore-10.0), [claims transformation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/claims), [resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0).

<a id="slide-14"></a>
## Slide 14 — Revoking Sessions & Tokens

Slide hiện chỉ giữ **credential + hành động thu hồi**, đã bỏ các dòng mô tả kết quả để nhẹ chữ. Nhưng khi giải thích phải nói rõ **nơi thực thi** và **khi nào bị từ chối**.

### Session: Delete the session

Áp dụng ví dụ session có store. Server xóa/vô hiệu hóa bản ghi; request sau phải tra và từ chối khi thấy phiên không còn hoạt động. Nếu dùng cookie ticket tự chứa, không có cùng bản ghi để xóa; cần kiểm tra trạng thái/version, ticket store hoặc cơ chế phù hợp.

### Access token: Add to denylist until token expiry

Đây là **một chiến lược minh họa**, không phải cách duy nhất. Hệ thống ghi nhận token/credential bị chặn; API phải tra denylist ngoài việc kiểm tra token. Định danh nên đủ rõ, ví dụ issuer + jti khi issuer có cam kết jti phù hợp; không giả định mọi JWT có jti hay mọi jti là duy nhất toàn cầu.

Giữ entry đến lúc token không còn được chấp nhận, tính cả clock skew nếu validator cho phép. Nếu không có điểm kiểm tra trạng thái, đưa token vào một bảng blacklist không ảnh hưởng API chỉ validate offline. Lựa chọn khác gồm introspection, phiên/version và token lifetime ngắn; lifetime ngắn chỉ giảm cửa sổ, không phải thu hồi tức thời.

### Refresh token: Revoke the token or its token family

Authorization server/token endpoint kiểm tra refresh token đang hoạt động rồi mới cấp token mới. Rotation thay refresh token sau khi dùng; phát hiện token cũ dùng lại có thể dẫn tới thu hồi family theo policy. Cần xử lý retry/race, không tự kết luận ai là attacker chỉ từ một reuse.

Nếu provider phát token, dùng cơ chế mà provider hỗ trợ. Đánh dấu revoked trong DB app không tự làm token của provider mất hiệu lực.

**Thu hồi refresh không mặc nhiên thu hồi access token đã cấp.** Một provider có thể triển khai liên đới nhiều credential, nhưng phải dựa vào cam kết và enforcement thật, không dựa vào giả định.

### Cache, nhiều server và SignalR

“Bấm revoke thành công” là thời điểm ghi quyết định, khác thời điểm mọi request bị chặn. Cache TTL, replication, gateway và introspection caching có thể tạo khoảng trễ. Request đang chạy cũng có thể hoàn thành nếu không có kiểm tra lại phù hợp trước tác vụ nhạy cảm.

Kết nối SignalR/WebSocket không mặc nhiên chạy lại HTTP authentication mỗi message. Cần kiểm tra quyền/trạng thái ở thao tác phù hợp và/hoặc chủ động ngắt kết nối theo kiến trúc. Token hết hạn, account bị khóa và role đổi là các sự kiện khác nhau. Không chỉ gửi lệnh client tự logout, vì bên xấu có thể bỏ qua.

**Cách kiểm chứng:** giữ credential cũ trong client lab có kiểm soát, thu hồi, thử lại API, refresh và kết nối đang mở; ghi nhận thời điểm từ chối thật. Không log raw credential. Thu hồi không lấy lại dữ liệu đã tải xuống. [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009.html), [RFC 7662](https://www.rfc-editor.org/rfc/rfc7662.html), [SignalR auth](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-10.0).

<a id="slide-15"></a>
## Slide 15 — Auth Choices by Architecture

Bảng hiện tại dùng bốn cột: **kiến trúc → request sau đăng nhập → nơi xử lý đăng nhập → yếu tố xác thực người dùng**. Đây là bốn câu hỏi khác nhau; đọc ngang để hiểu một cấu trúc, rồi nhớ các cấu trúc vẫn có thể kết hợp.

| Cấu trúc đã chốt | Request sau đăng nhập, theo ví dụ trên slide | Nơi xử lý đăng nhập |
|---|---|---|
| Web monolith | Cookie phiên | App hoặc identity provider |
| Web frontend tách API | Access token | Auth backend hoặc identity provider |
| Web + BFF | Browser dùng cookie với BFF; BFF dùng access token với API | BFF/backend hoặc identity provider |
| Mobile + API | Access token | Auth backend hoặc identity provider |
| Microservices | API kiểm tra token và quyền | Hệ thống danh tính chung cho người dùng; danh tính workload riêng cho máy-máy |

Cột USER FACTORS gộp chung các **ví dụ** điều biết, thứ có và sinh trắc học. Không phải mọi dự án phải bật hết chúng, không phải mọi combination đều thành MFA, và service chạy nền không đăng nhập bằng vân tay của nhân viên.

### 15.1. Web monolith: khi nào là điểm xuất phát hợp lý?

Monolith là ứng dụng được tổ chức/deploy như một đơn vị thống nhất; trong ví dụ web này backend còn tạo giao diện, như MVC/Razor. Một app, một team, nghiệp vụ chưa cần nhiều ranh giới triển khai: cookie authentication và tài khoản tại app là phương án đơn giản.

Có thể kết nối IdP qua OIDC/SAML nếu cần tài khoản công ty hoặc không muốn vận hành mật khẩu. Sau liên kết đăng nhập, web vẫn dùng cookie của app. Monolith có thể chạy nhiều instance và dùng store/khóa được quản lý chung; monolith không có nghĩa chỉ một máy vật lý.

### 15.2. Web tách frontend/API: có bắt buộc OIDC hoặc JWT không?

Không. “Tách” mô tả tổ chức frontend/backend, không quy định mật mã hay giao thức đăng nhập. Ví dụ trên bảng xét browser gọi API trực tiếp bằng access token. Login có thể do backend tự xử lý bằng framework được chọn hoặc do IdP đảm nhiệm; access token có thể JWT hoặc opaque theo hợp đồng.

Cookie cũng có thể dùng cho web/API nếu cấu hình origin/site, credential, CORS, CSRF và deployment phù hợp. CORS là cơ chế browser kiểm soát khả năng trang đọc phản hồi cross-origin, không phải authentication và không ngăn một client ngoài browser gọi API. Hai repository hay hai tên miền không tự quyết định “phải dùng JWT”.

Khi browser phải giữ token, cần chấp nhận và xử lý nguy cơ JavaScript độc hại. Nếu có khả năng chạy server intermediary, cân nhắc BFF. Chọn theo dữ liệu nhạy cảm, threat model và chi phí vận hành, không theo “React thì dùng token”.

### 15.3. BFF có phải nơi tổng hợp API từ nhiều server/service?

Có thể. **Backend for Frontend** là backend phục vụ nhu cầu của một frontend. Nó có thể gọi nhiều service rồi tổng hợp kết quả thành dữ liệu màn hình, hoặc chỉ chuyển một request tới một API. Không bắt buộc có nhiều service và không bắt buộc luôn tổng hợp.

~~~text
                    ┌→ Product API
Browser → BFF ───────├→ Order API
                    └→ Payment API
~~~

Trong mô hình auth minh họa, browser dùng cookie phiên với BFF. BFF giữ access/refresh token phía server theo thiết kế và gọi API bằng access token đúng audience. Khi dùng OIDC, BFF có thể là confidential client thực hiện flow đăng nhập. BFF cũng có thể được tổ chức với login nội bộ; không bắt buộc OIDC chỉ vì gọi tên BFF.

**Vì sao chọn:** giảm token lộ cho JavaScript và tập trung phần tích hợp API. **Đánh đổi:** proxy, vận hành, độ trễ, bảo vệ phiên/CSRF và xử lý lỗi downstream. BFF không tự loại bỏ XSS, không phải hệ thống phân quyền thay cho các API, và khác API gateway dùng chung ở mục tiêu phục vụ frontend. Hai vai trò có thể được triển khai chung nhưng không đồng nghĩa.

### 15.4. Mobile khác web + backend ở đâu?

Cùng gọi HTTP API không có nghĩa môi trường bảo vệ credential giống nhau.

| | Web trong browser | Mobile native |
|---|---|---|
| Môi trường | Trang chạy trong sandbox/origin của browser | App cài trên nền tảng thiết bị |
| Credential | Cookie do browser quản lý hoặc token theo thiết kế | Thường dùng token, giữ bằng storage được bảo vệ của nền tảng |
| Đăng nhập liên kết | Redirect/flow theo loại web client | Thường dùng browser hệ thống với OAuth/OIDC native |
| Secret nhúng trong client | JavaScript không giữ được secret cố định | Secret trong app binary cũng không được coi là bí mật của confidential client |
| Những ràng buộc khác | Cookie, same-site/origin, CORS và CSRF theo browser | Deep link/redirect, token storage, lifecycle và rủi ro thiết bị |

Một web frontend giữ bearer access token và gọi API trực tiếp khá giống mobile ở cách trình token. Khác biệt lớn hơn khi web dùng cookie/BFF, còn mobile trực tiếp giữ token. Backend API có thể phục vụ cả hai, nhưng cấu hình client, redirect và policy phải phù hợp từng môi trường.

Không nói mobile “không thể dùng cookie”; đó không phải hạn chế tuyệt đối. Khuyến nghị token trong bảng phản ánh mô hình API/native phổ biến và nhu cầu tích hợp, không phải luật của HTTP.

### 15.5. Microservices nằm ở đâu?

Microservices là cách chia backend thành các service có ranh giới nghiệp vụ/triển khai. Nó không phải một loại browser, một phương thức đăng nhập hay một đối thủ của BFF.

~~~text
Web browser → BFF ─┬→ Order Service
                  └→ Payment Service
Mobile app ─────────→ API entry point → các service phù hợp
Login/identity platform → phát kết quả đăng nhập và token theo cấu hình
~~~

Các đường vào chỉ là hình minh họa, không phải yêu cầu mobile được truy cập mọi service trực tiếp. Thiết kế public/private endpoints và gateway theo ranh giới tin cậy.

Hướng tổ chức tốt để cân nhắc: tập trung hệ thống tài khoản/xác thực và trách nhiệm phát token; các service tin đúng issuer, kiểm tra token cho đúng audience và thực thi quyền tài nguyên của mình. Không chia sẻ một password DB tùy tiện hay để mỗi service tự phát JWT không có hợp đồng tin cậy.

Phân biệt hai cuộc gọi:

- **App-only:** job/Order Service hành động bằng quyền riêng. Dùng workload identity, Client Credentials, mTLS hoặc cơ chế phù hợp hạ tầng.
- **Thay người dùng:** service cần bảo toàn phạm vi quyền người dùng. Có thể dùng token dành đúng downstream, delegated flow/token exchange theo nền tảng; không chuyển một token không đúng audience cho mọi service, cũng không âm thầm nâng thành quyền app rộng hơn.

Gateway có thể tập trung xác thực nhưng phải bảo vệ đường tới service và danh tính chuyển tiếp; không chỉ gắn header userId rồi cho mọi bên tin. Authorization đối với dữ liệu vẫn cần nơi chịu trách nhiệm rõ.

### 15.6. OIDC nằm ở đâu trong bảng?

Ở **mối liên kết giữa app và identity provider** khi app giao bước xác thực người dùng cho provider. Cột nơi xử lý ghi Identity provider; giao thức tích hợp có thể OIDC hoặc SAML theo hỗ trợ. Không ghi OIDC như viết tắt của provider.

Cả app lẫn provider đều có thể hỗ trợ password, OTP, passkey. OIDC không thay ba loại bằng chứng đó. Khi một user đã được provider xác thực, app có thể tạo cookie hoặc quản lý token theo kiến trúc của mình.

### 15.7. Khi nào chọn gì? Trình tự quyết định

1. Xác định người dùng, browser/native/service và tài nguyên cần bảo vệ.
2. Xác định quyền sở hữu tài khoản: tự quản lý, danh tính doanh nghiệp hay nhiều provider.
3. Chọn ai xử lý login và giao thức liên kết nếu có. Dùng IdP không đồng nghĩa phải tách thêm một server tự xây.
4. Chọn đường request: browser trực tiếp, BFF, mobile và backend services.
5. Xác định ai phát token, API nào nhận, token/session giữ ở đâu và vòng đời credential.
6. Chọn mức xác thực, permission/resource policy và yêu cầu thu hồi, kể cả cache/kết nối dài.
7. Đánh giá chi phí vận hành. Không gọi một mapping “chuẩn mọi dự án” khi chưa nêu điều kiện.

### 15.8. Một cấu hình kết hợp hoàn chỉnh

Công ty có web bán hàng, mobile và backend microservices. Một IdP xác thực nhân viên/khách hàng theo policy bằng passkey hoặc password + OTP. Web dùng BFF: OIDC login, cookie với browser, access token giữ tại BFF. Mobile dùng đăng nhập native qua browser hệ thống và giữ token bằng cơ chế nền tảng. Order/Payment API xác minh token đúng audience rồi kiểm tra quyền nghiệp vụ. Job đối soát có workload identity riêng. Thu hồi phiên web, refresh token và quyền gọi API là các đường cần được thiết kế đồng bộ.

Đây là **một ví dụ có điều kiện**, không phải cấu hình bắt buộc. Nếu dự án chỉ có một web nhỏ, thêm mọi thành phần đó có thể không mang lại lợi ích tương xứng. [Browser OAuth architectures](https://www.rfc-editor.org/rfc/rfc10017.html), [Native apps](https://www.rfc-editor.org/rfc/rfc8252.html), [Microsoft microservice security](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/secure-net-microservices-web-applications/).

<a id="slide-16"></a>
## Slide 16 — Auth Lifecycle Recap & Q&A

Bốn nhãn và icon thống nhất với slide 1: **Authenticate, Stay Signed In, Authorize, Revoke Access**. Không dùng “Maintain Session” làm tên chung cho mọi kiến trúc; thuật ngữ session vẫn đúng khi đang giải thích một cơ chế session cụ thể.

Tự kể lại một lượt bid:

1. Anna chứng minh danh tính tại app/provider bằng bằng chứng đã chọn.
2. Request sau mang cookie hoặc access token. Server xác thực credential và tạo principal của request.
3. Policy kiểm tra Anna có quyền bid đúng auction, đúng tenant/phạm vi và dữ liệu hiện tại.
4. Nghiệp vụ kiểm tra auction còn mở, giá có hợp lệ và tính nhất quán khi ghi.
5. Khi thu hồi, nơi kiểm tra session/token/quyền nhận biết trạng thái mới và từ chối theo độ trễ đã cam kết; kết nối đang mở cũng có đường thực thi.

Một câu hỏi sâu có thể chạm nhiều slide: “Đã dùng passkey sao token còn bị lấy?” nối slide 6, 10, 11 và 14; “Microservices có bắt buộc OIDC?” nối slide 3, 7, 9 và 15. Trả lời bằng trách nhiệm và luồng trước, tên công nghệ sau.

## Bộ câu hỏi tự kiểm tra trước buổi nói

Thử trả lời không nhìn tài liệu rồi kiểm tra phần tương ứng:

| Câu hỏi | Điểm trả lời cần có | Slide |
|---|---|---|
| Vì sao authenticator tạo TOTP offline được? | Có seed + đồng hồ; đăng nhập vẫn gửi request tới server | 05 |
| Challenge có cần giữ bí mật không? | Không như private key; cần ngẫu nhiên, đúng giao dịch, kiểm tra dùng lại | 06 |
| Public key có giải mã để lấy challenge không? | Không; server đọc challenge từ dữ liệu trả về và xác minh chữ ký | 06 |
| Đọc được dữ liệu raw có giả chữ ký được không? | Không nếu thiếu private key; nguyên response còn hiệu lực vẫn cần bảo vệ khỏi dùng lại | 06 |
| Registration none có bắt buộc chữ ký attestation không? | Không; vẫn kiểm tra ceremony/account binding và những điều kiện bắt buộc | 06 |
| Vân tay có gửi về server trong passkey không? | Không theo luồng WebAuthn đó; authenticator xác minh cục bộ | 04, 06 |
| OIDC có thay password/OTP không? | Provider vẫn dùng chúng; OIDC truyền kết quả xác thực tới app | 03, 07 |
| IdP và OIDC có phải hai cách viết một tên? | Không; vai trò provider và giao thức | 03, 07 |
| ID token gọi API được không? | Không dùng thay access token; mục đích/audience khác | 08 |
| API token do ai cấp? | Auth backend hoặc authorization server được tin; nói rõ issuer/audience | 08, 15 |
| PKCE có phải loại kiến trúc? | Không; bảo vệ flow đổi code, không bảo vệ token đã bị lấy | 08 |
| mTLS khác request signing? | Xác thực kết nối và bảo vệ thành phần message; có thể kết hợp | 09 |
| HMAC dùng public/private key không? | Không, cùng secret; bên verify cũng tạo MAC được | 09 |
| Copy JWT có copy cả chữ ký không? | Có; bearer copy không cần sửa token | 11 |
| Cookie luôn có session DB không? | Không; có thể chứa protected ticket | 10 |
| ABAC khác ReBAC? | Thuộc tính/điều kiện so với quan hệ và đường suy quyền; có overlap | 12 |
| ACL luôn không có kế thừa? | Không; semantics tùy hệ thống | 12 |
| Revoke refresh có dừng access token ngay không? | Không mặc nhiên; cần enforcement tương ứng | 14 |
| BFF có phải microservices? | Không; BFF phục vụ frontend, có thể đứng trước microservices | 15 |
| Mobile khác SPA direct API? | Có thể cùng bearer model; khác môi trường, browser flow, storage và bảo vệ client | 15 |
| Khóa user có chặn SignalR ngay? | Không mặc nhiên; phải có kiểm tra/ngắt theo thiết kế | 14 |

## Từ vựng để giải thích bằng lời

| Từ | Cách diễn giải ngắn |
|---|---|
| Credential | Dữ liệu/phương tiện được trình để xác thực hoặc truy cập theo một cơ chế |
| Principal | Danh tính mà framework chấp nhận cho thao tác đang xét |
| Claim | Một thông tin được khẳng định về danh tính/token; chỉ tin sau kiểm tra phù hợp |
| Issuer | Bên phát hành token/kết quả |
| Audience | Bên được phép nhận/sử dụng token theo giao thức |
| Identity provider | Hệ thống xác thực và cung cấp kết quả danh tính |
| Authorization server | Vai trò xử lý cấp token/quyền OAuth |
| Authenticator | Thành phần giữ/dùng credential để cung cấp bằng chứng |
| Signature | Bằng chứng mật mã gắn với dữ liệu; không mặc nhiên mã hóa dữ liệu |
| Nonce/challenge | Giá trị cho một giao dịch; ý nghĩa và cách kiểm tra theo giao thức |
| Canonicalization | Quy tắc đưa dữ liệu về cách biểu diễn thống nhất để hai bên ký/kiểm tra cùng nội dung |
| Revocation | Thay đổi điều kiện để credential cũ không tiếp tục được chấp nhận |
| Step-up | Yêu cầu xác thực bổ sung phù hợp thao tác/rủi ro |
| Tenant | Phạm vi tổ chức/khách hàng trong hệ thống dùng chung |

## Những câu nên tránh khi trình bày

- “Private key mã hóa challenge rồi public key giải mã.” → Thiết bị ký, server xác minh chữ ký và so challenge trong dữ liệu.
- “Có JWT là stateless hoàn toàn.” → Xác định thành phần/bước nào không cần session lookup.
- “OIDC là một loại identity provider.” → OIDC là giao thức kết nối với provider.
- “Web tách API chỉ dùng được OIDC.” → Có thể tự xử lý login hoặc delegate; credential request là quyết định khác.
- “Passkey luôn chỉ có trên một thiết bị.” → Có synced và device-bound; cách bảo vệ/đồng bộ tùy loại.
- “OTP + bất kỳ bước nào cũng là MFA.” → Kiểm tra yếu tố độc lập và cơ chế thực thi.
- “Thấy role Admin thì bỏ mọi kiểm tra khác.” → Vẫn cần phạm vi, tenant và policy đúng yêu cầu.
- “Bỏ refresh token là mọi access token mất hiệu lực ngay.” → Cần cơ chế thu hồi của API hoặc chờ hết hạn theo thiết kế.
- “Có chữ ký thì không cần HTTPS.” → Chữ ký không cung cấp bí mật nội dung truyền tải.

## Tài liệu liên quan và giới hạn

Các nguồn chuẩn được đặt cạnh phần cần đối chiếu. Bảng lựa chọn, ví dụ và cách diễn đạt là tổng hợp phục vụ bài nói; không phải số liệu khảo sát về tỷ lệ dự án dùng từng cơ chế. Khả năng thư viện/framework phải được kiểm tra với phiên bản triển khai.

- [Hướng dẫn trình bày theo 16 slide](auth-presentation-presenter-guide.md).
- [Outline hiện hành](auth-presentation-outline.md).
- [Nghiên cứu chuyên đề và mở rộng](auth-deep-dive.md).
- [Xác thực người dùng](01-user-authentication.md).
- [Session, cookie, token](02-sessions-and-tokens.md).
- [OAuth, OIDC, SAML](03-oauth-oidc-saml.md).
- [Service authentication, mTLS, signed request](04-machine-authentication.md).
- [Authorization và ví dụ triển khai](05-authorization.md).
