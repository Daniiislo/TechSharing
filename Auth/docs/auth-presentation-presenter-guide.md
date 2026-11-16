# Auth — Hướng dẫn trình bày theo 16 slide

**Cập nhật: 16/11/2026. Người trình bày: Tavian Nguyen.**

Bản này là mốc nói và lời dẫn, không phải tài liệu kiến thức đầy đủ. Đọc [tài liệu tổng hợp](auth-study-guide.md) để nắm cơ chế và hỏi đáp. Slide tiếng Anh, trình bày tiếng Việt. Dự toán 38 phút gồm Q&A; cần rehearsal để đo thật. Không có demo riêng hoặc appendix trong bộ 16 trang. PPTX cũ chưa chắc khớp preview hiện tại.

## 01. Beyond the Login Screen — 1.5 phút

**Chỉ hình:** Bốn nhãn trên trang đầu và recap giống nhau: Authenticate, Stay Signed In, Authorize, Revoke Access.

Anna đã đăng nhập rồi bấm Place Bid. Mình còn bốn việc phải làm: nhận bằng chứng danh tính, nhận ra những request tiếp theo, kiểm tra quyền trên auction cụ thể, rồi chặn truy cập cũ khi cần. Vì thế màn hình login chỉ là điểm bắt đầu. “Stay Signed In” bao quát cookie/session hoặc token, không bắt buộc server luôn có bảng session.

**Chuyển:** Đi qua bản đồ các phần trước khi giải thích từng cơ chế.

**Học sâu:** [Slide 01 và phần giải thích](auth-study-guide.md#slide-01).

## 02. Agenda — 0.5 phút

**Chỉ hình:** Sáu phần từ Authentication & Sign-In tới Recap & Q&A.

Đầu tiên mình xem người dùng và service chứng minh danh tính thế nào. Sau đó là cookie/token cho các request tiếp theo, quyền trên tài nguyên và cách thu hồi. Cuối cùng mình ghép vào năm cấu trúc dự án. Bộ hiện tại không có slide demo/appendix riêng; các ví dụ đấu giá để giải thích, không phải cam kết có lab chạy được.

**Chuyển:** Có hai nơi có thể thực hiện bước đăng nhập.

**Học sâu:** [Slide 02 và phần giải thích](auth-study-guide.md#slide-02).

## 03. Authentication Overview — 1.5 phút

**Chỉ hình:** Bên trái app xác thực trực tiếp; bên phải app nhận kết quả từ identity provider.

Password, OTP, passkey nói về bằng chứng. App hay provider nói về nơi xử lý. OIDC và SAML nói về giao thức liên kết với provider. Cookie/access token nói về request sau login. Không đặt bốn tầng đó thành lựa chọn loại trừ nhau. Provider vẫn có thể dùng password + OTP hoặc passkey trước khi trả kết quả OIDC.

**Nếu được hỏi:** IdP là Identity Provider; OIDC là OpenID Connect, không phải viết tắt hoặc một loại provider.

**Chuyển:** Bằng chứng người dùng được chia thành những nhóm nào?

**Học sâu:** [Slide 03 và phần giải thích](auth-study-guide.md#slide-03).

## 04. Three Types of Authentication Factors — 2 phút

**Chỉ hình:** Điều biết; thứ có; sinh trắc học. Sau đó chỉ ví dụ password + OTP.

MFA dùng ít nhất hai yếu tố thuộc các nhóm khác nhau, không phải cứ hai màn hình là MFA. Password và PIN vẫn thuộc nhóm điều biết, dù cách dùng PIN tại thiết bị có thể khác password gửi server. Security key là thiết bị; passkey là credential khóa công khai; vân tay/PIN có thể mở việc dùng credential ngay trên thiết bị. Một lần xác thực có thể kết hợp chúng.

**Nếu được hỏi:** Chạm key xác nhận presence không tự tương đương PIN/sinh trắc xác minh người dùng. Recovery và thêm yếu tố mới cần bảo vệ tương xứng.

**Chuyển:** Vì sao app OTP vẫn tạo mã khi không có mạng?

**Học sâu:** [Slide 04 và phần giải thích](auth-study-guide.md#slide-04).

## 05. TOTP: Your Authenticator Works Offline — 2 phút

**Chỉ hình:** Hai phía có cùng secret, dùng đồng hồ riêng, cùng chuyển sang bước thời gian mới.

Khi đăng ký, app và server đã có cùng secret cho tài khoản. App tự tính TOTP từ secret và bước thời gian, nên không cần Internet để hiện mã. Khi nhập mã để login, request vẫn phải tới server. Server tính mã dự kiến, kiểm tra lệch đồng hồ trong cửa sổ đã cấu hình và ngăn dùng lại mã đã chấp nhận.

**Nếu được hỏi:** 30 giây là ví dụ phổ biến. TOTP khác HOTP ở moving factor; SMS/email là kênh chuyển mã, không tự là TOTP. OTP nhập tay vẫn có thể bị phishing thời gian thực.

**Chuyển:** Passkey thay mã nhập tay bằng bằng chứng chữ ký.

**Học sâu:** [Slide 05 và phần giải thích](auth-study-guide.md#slide-05).

## 06. Passkeys: Register and Sign In — 5 phút

**Chỉ hình:** Hàng trên đăng ký; hàng dưới đăng nhập. Browser điều phối, authenticator dùng khóa, server kiểm tra.

Lúc đăng ký, backend xác minh quyền thêm passkey và trả options + challenge. Browser gọi credentials.create(), authenticator tạo credential. Browser gửi kết quả lại; server kiểm tra challenge, origin, RP, flags và attestation theo format, rồi gắn credential ID/public key vào tài khoản. Private key được authenticator hoặc trình quản lý passkey bảo vệ.

Lúc đăng nhập, server phát challenge mới; browser gọi credentials.get(). Sau xác minh cục bộ theo policy, authenticator dùng private key ký dữ liệu gắn với challenge. Server lấy public key đã đăng ký, kiểm tra chữ ký cùng dữ liệu ceremony trước khi tạo phiên/cấp credential truy cập.

**Câu chốt:** Thiết bị ký, server xác minh; không phải private key mã hóa rồi public key giải mã. Challenge nằm trong dữ liệu trả về để so với giá trị server đã ghi nhận.

**Câu hỏi sâu cần sẵn sàng:** Dữ liệu raw không cần bí mật như private key, nhưng nguyên response còn hiệu lực vẫn phải được bảo vệ bởi HTTPS, liên kết giao dịch và chống replay. Registration none không có attestation signature; không áp logic assertion đăng nhập cho mọi registration. Vân tay/PIN kiểm tra cục bộ, không gửi ảnh sinh trắc tới website. Xem phần học sâu thay vì cố đọc hết tên trường trên sân khấu.

**Chuyển:** Nếu app giao bước xác thực cho một bên khác thì nhận kết quả thế nào?

**Học sâu:** [Slide 06 và phần giải thích](auth-study-guide.md#slide-06).

## 07. OIDC: Sign In with an Identity Provider — 2 phút

**Chỉ hình:** App chuyển browser sang provider, nhận code, đổi token rồi kiểm tra ID token.

App lịch tin một identity provider đã cấu hình. Provider xác thực Anna hoặc dùng phiên phù hợp; app nhận kết quả qua OIDC. Sau khi xác minh ID token và giao dịch, app có thể tạo cookie phiên riêng. OIDC không có nghĩa app hết trách nhiệm quản lý phiên và quyền.

**Nếu được hỏi:** ID token cho client xác minh kết quả login, không thay access token gọi API. SSO có thể dùng phiên provider để app thứ hai không hỏi lại credential; logout một app chưa chắc logout toàn hệ thống.

**Chuyển:** Đăng nhập khác nhu cầu cho một ứng dụng quyền đọc lịch.

**Học sâu:** [Slide 07 và phần giải thích](auth-study-guide.md#slide-07).

## 08. OAuth 2.0: Grant Access to an API — 2 phút

**Chỉ hình:** Access token đi từ authorization server tới client, rồi tới Calendar API.

OAuth cấp quyền truy cập tài nguyên mà app không phải giữ password tại dịch vụ chứa dữ liệu. Scope giới hạn quyền API đã cấp, audience xác định nơi nhận token, còn API vẫn kiểm tra quyền trên tài nguyên cụ thể. OAuth một mình không định nghĩa đầy đủ login ứng dụng; OIDC bổ sung kết quả xác thực.

**Nếu được hỏi:** Access token do auth backend hoặc authorization server của nền tảng danh tính cấp theo trust đã cấu hình. JWT là định dạng. ID/access/refresh token khác mục đích. PKCE bảo vệ code exchange, không phải một kiến trúc và không bảo vệ token đã bị lấy. Không đọc mọi bước PKCE nếu chưa có câu hỏi.

**Chuyển:** Khi bên gọi là service, mình dùng danh tính nào?

**Học sâu:** [Slide 08 và phần giải thích](auth-study-guide.md#slide-08).

## 09. Service-to-Service Authentication — 3 phút

**Chỉ hình:** Order gọi Payment bằng danh tính của Order; đi qua bốn hàng.

Shared secret có thể là API key hoặc Basic theo hợp đồng. Access token có thể được xin qua Client Credentials bằng quyền ứng dụng. mTLS xác thực hai chiều trong kết nối TLS bằng certificate và bằng chứng giữ private key. Signed request dùng HMAC hoặc chữ ký bất đối xứng trên các thành phần message được quy định.

**Giải thích nếu cần:** HMAC dùng chung secret nên bên nhận cũng tạo MAC được. Chữ ký bất đối xứng: bên gửi giữ private key, bên nhận chỉ cần public key tin cậy để kiểm tra. Chữ ký không che giấu dữ liệu và không tự chống mọi replay; cần timestamp/nonce/trạng thái phù hợp. mTLS bảo vệ kết nối; request signing bảo vệ thành phần message. Có thể kết hợp, vẫn cần kiểm tra quyền.

Service thay mặt người dùng khác app-only. Không mượn tài khoản nhân viên chạy job, không gửi token sai audience cho mọi service.

**Chuyển:** Sau login, request tiếp theo của người dùng được nhận ra thế nào?

**Học sâu:** [Slide 09 và phần giải thích](auth-study-guide.md#slide-09).

## 10. Sessions and Cookies — 1.5 phút

**Chỉ hình:** Anna login → browser nhận cookie → request sau server tìm session.

Ví dụ này dùng server-side session: server lưu phiên, browser giữ session ID trong cookie. Cookie là cách mang dữ liệu; session là trạng thái/ngữ cảnh truy cập. Cookie còn có thể chứa ticket được bảo vệ, nên không nói mọi cookie đều phải tra một session DB.

**Nếu được hỏi:** HttpOnly hạn chế đọc cookie, không ngăn XSS thực hiện hành động bằng phiên. Cookie tự gửi còn đòi hỏi chống CSRF phù hợp. Token là lựa chọn khác cho request; “Stay Signed In” không đồng nghĩa kết nối luôn mở.

**Chuyển:** API có biết ai đang giữ bản sao credential không?

**Học sâu:** [Slide 10 và phần giải thích](auth-study-guide.md#slide-10).

## 11. Bearer Tokens — 1.5 phút

**Chỉ hình:** Hai client trình cùng Token A; API có thể thấy cùng danh tính.

Bearer nghĩa là bên cầm token có thể trình để sử dụng quyền nếu các kiểm tra khác đạt. JWT ký không tự chống copy: attacker có thể sao chép cả dữ liệu lẫn chữ ký hợp lệ. JWT không mặc nhiên mã hóa payload. Passkey bảo vệ lần login, nhưng app sau đó vẫn có thể cấp bearer cookie/token.

**Nếu được hỏi:** DPoP hoặc certificate-bound token có thêm bằng chứng giữ khóa, cần hỗ trợ và kiểm tra đúng ở toàn chuỗi. IP mới không đủ kết luận credential bị đánh cắp.

**Chuyển:** Đã nhận ra request, server cần quyết định quyền.

**Học sâu:** [Slide 11 và phần giải thích](auth-study-guide.md#slide-11).

## 12. Common Authorization Models — 3 phút

**Chỉ hình:** Mỗi dòng là cách ra quyết định; dùng cùng ví dụ An sửa tài liệu.

RBAC: An có role Editor cấp permission sửa. ABAC: thuộc tính An và tài liệu thỏa điều kiện, chẳng hạn cùng phòng ban, đủ clearance, còn Draft. ReBAC: An thuộc team được quyền trên project/folder chứa tài liệu. ACL: danh sách quyền trên tài liệu cấp cho An hoặc nhóm của An.

**Phân biệt ABAC/ReBAC:** một bên chủ yếu đánh giá giá trị thuộc tính với policy, bên kia mô hình hóa quan hệ và đường suy quyền. Ranh giới không tuyệt đối. ACL cũng có thể hỗ trợ group và kế thừa. Một policy có thể kết hợp nhiều điều kiện với AND/OR rõ ràng.

**Khi nào dùng:** RBAC cho bộ quyền công việc ổn định; ABAC cho điều kiện; ReBAC cho cộng tác/team/project; ACL cho chia sẻ riêng tài nguyên. Server phải kiểm tra đúng tenant/resource, không chỉ ẩn nút ở UI.

**Chuyển:** Nếu framework chưa đáp ứng đủ hành vi auth, mở rộng ở đâu?

**Học sâu:** [Slide 12 và phần giải thích](auth-study-guide.md#slide-12).

## 13. Custom Authentication: Why and How? — 2 phút

**Chỉ hình:** Configure → hook → custom handler là mức can thiệp, không phải ba bước bắt buộc.

Trước tiên cấu hình scheme có sẵn: issuer, audience, lifetime, provider. Nếu cần bổ sung xử lý, dùng điểm mở rộng được thư viện cung cấp. Chỉ viết handler riêng khi có credential chưa có handler phù hợp và hợp đồng kiểm tra rõ ràng. Ánh xạ claims khác xác minh credential; kiểm tra quyền thuộc authorization.

**Nếu được hỏi:** “Challenge” trong .NET là yêu cầu client xác thực, khác chuỗi challenge WebAuthn. Không tự viết OAuth server/crypto chỉ để thêm permission hoặc đổi UI login.

**Chuyển:** Khi cần chặn truy cập đã cấp thì tác động vào đâu?

**Học sâu:** [Slide 13 và phần giải thích](auth-study-guide.md#slide-13).

## 14. Revoking Sessions & Tokens — 2.5 phút

**Chỉ hình:** Chỉ tên credential rồi hành động; các mô tả kết quả đã bỏ khỏi slide.

Session có store: xóa/vô hiệu hóa bản ghi, nơi kiểm tra phiên phải nhận biết trạng thái mới. Access token: một chiến lược là denylist tới lúc token không còn được chấp nhận; API phải thực sự tra danh sách. Refresh token: token endpoint từ chối token/family đã thu hồi. Thu hồi refresh không mặc nhiên dừng access token đã cấp.

**Nếu được hỏi:** JWT validate offline không tự biết quyết định revoke mới. Introspection/cache/replication ảnh hưởng độ trễ. Cookie ticket tự chứa không giống session ID. SignalR đang mở cần cách kiểm tra/ngắt phù hợp; không chỉ nhờ client tự logout. Kiểm chứng bằng credential cũ trên các đường truy cập cần bảo vệ.

**Chuyển:** Ghép kiến thức này vào cấu trúc dự án.

**Học sâu:** [Slide 14 và phần giải thích](auth-study-guide.md#slide-14).

## 15. Auth Choices by Architecture — 4 phút

**Chỉ hình:** Bốn cột: kiến trúc, request sau login, nơi xử lý login, yếu tố người dùng. Cột handler đã nới rộng để đọc một dòng. Cột yếu tố gộp chung để tránh lặp.

Web monolith thường có thể bắt đầu bằng cookie và login tại app hoặc provider. Web tách frontend/API trên bảng minh họa access token, nhưng không cấm cookie hay login nội bộ. Web+BFF: browser dùng cookie, BFF giữ token gọi API. Mobile dùng access token theo ví dụ; khi OIDC thì đăng nhập qua browser hệ thống. Microservices dùng hệ thống danh tính chung và kiểm tra tại ranh giới API; nó có thể nằm sau BFF hoặc mobile.

**Điểm phải nói rõ:** Password/OTP/passkey và sinh trắc học là bằng chứng/nhóm yếu tố; provider là nơi xử lý; OIDC/SAML là giao thức. Cụm “Identity provider” trong bảng không phải viết tắt của OIDC. Một app cũng có thể dùng provider, không cần đợi nhiều app. Service/job dùng credential máy riêng, không dùng vân tay nhân viên.

**Vì sao/đánh đổi:** Cookie đơn giản cho web; BFF giữ token khỏi JavaScript nhưng thêm proxy; frontend trực tiếp phải xử lý rủi ro token trong browser; native cần flow/storage phù hợp; microservices cần trust/audience/permissions và vận hành credential. Các dòng là hướng khởi đầu, không phải luật mọi dự án.

**Chuyển:** Quay lại bốn câu hỏi của bài.

**Học sâu:** [Slide 15 và phần giải thích](auth-study-guide.md#slide-15).

## 16. Auth Lifecycle Recap & Q&A — 4 phút

**Chỉ hình:** Bốn icon giống trang đầu và cùng màu cyan.

Chứng minh danh tính. Giúp request tiếp theo được nhận diện. Kiểm tra quyền trên tài nguyên. Chặn credential cũ khi cần. Lấy một thao tác thật của hệ thống và chỉ ra bốn điểm đó; nếu chưa chỉ được một điểm thì đó là phần thiết kế cần làm rõ.

**Q&A khoảng 3,5 phút:** dùng [tài liệu học sâu](auth-study-guide.md) và các chương chuyên đề để trả lời. Bộ slide hiện tại không có appendix. Không giả vờ có demo Auth đã triển khai hoặc khẳng định đây là kiến trúc thật của eBay.

**Học sâu:** [Slide 16 và phần giải thích](auth-study-guide.md#slide-16).

## Nguồn và phạm vi

Nguồn chuẩn đặt cạnh từng phần trong [tài liệu học sâu](auth-study-guide.md). Các chương [01](01-user-authentication.md), [02](02-sessions-and-tokens.md), [03](03-oauth-oidc-saml.md), [04](04-machine-authentication.md) và [05](05-authorization.md) giữ nội dung chuyên sâu/code. Tài khoản và hành động trong ví dụ là minh họa; không suy ra cấu trúc nội bộ của dịch vụ thật. Nguồn không còn hiển thị ở footer slide nhưng vẫn nằm trong tài liệu.
