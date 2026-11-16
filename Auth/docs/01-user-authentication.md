# 01. Người dùng chứng minh danh tính bằng cách nào?

**Biên tập lại 16/11/2026 — đọc cùng slide 03–06.** Chương này đi từ password/OTP quen thuộc tới passkey và MFA. Các câu hỏi về challenge, chữ ký, dữ liệu raw và public key được giải thích ngay trong luồng passkey, không tách thành phần bổ sung ở cuối.

[Mục lục chuyên đề](auth-deep-dive.md) · [Học theo 16 slide](auth-study-guide.md)

## 1. Trước hết, đừng đặt những tên khác tầng ngang hàng nhau

Anna đăng nhập vào website bằng password rồi nhập mã OTP. Website có thể tự kiểm tra hai bằng chứng đó. Nó cũng có thể chuyển Anna sang dịch vụ danh tính của công ty, để dịch vụ đó kiểm tra rồi trả kết quả.

| Câu hỏi | Ví dụ câu trả lời |
|---|---|
| Anna dùng bằng chứng gì? | Password, OTP, quyền sử dụng private key của passkey |
| Ai kiểm tra bằng chứng? | Backend của app hoặc identity provider |
| App nhận kết quả từ provider thế nào? | Qua OIDC hoặc SAML |
| Request sau login mang gì? | Cookie hoặc access token theo thiết kế |

Vì thế **dùng OIDC không loại bỏ password/OTP/passkey**. Chúng có thể được kiểm tra tại provider. Chương này tập trung vào bằng chứng; [chương 03](03-oauth-oidc-saml.md) nói về giao thức liên kết, [chương 02](02-sessions-and-tokens.md) nói về request sau đăng nhập.

## 2. Password: server kiểm tra một bí mật người dùng biết

### Server giữ gì, nhận gì?

Khi đặt mật khẩu, thư viện password hashing tạo giá trị kiểm tra từ mật khẩu, salt và tham số thuật toán. Server lưu kết quả cùng thông tin cần để xác minh về sau, không lưu password nguyên bản.

~~~text
Đăng ký: password → thư viện password hashing → bản ghi hash + tham số
Đăng nhập: password vừa nhập + bản ghi đã lưu → thư viện xác minh → đúng/sai
~~~

Salt là dữ liệu ngẫu nhiên giúp những lần băm cùng password không cho cùng kết quả lưu; salt không phải bí mật như password. Một chuỗi hash có thể đóng gói cả salt, thuật toán và tham số, không nhất thiết là các cột riêng.

Server **không giải mã hash lấy password gốc**. Nó xác minh đầu vào theo thuật toán. Password hashing phải làm việc đoán offline tốn tài nguyên; không thay bằng SHA-256 chạy nhanh chỉ vì SHA-256 cũng là hàm băm.

### Đúng password đã đủ cho truy cập chưa?

Chưa. Server còn kiểm tra trạng thái tài khoản, bước xác thực bổ sung nếu cần, rồi tạo phiên/cấp credential truy cập. Quyền với tài nguyên được kiểm tra sau đó. Phải bảo vệ login bằng HTTPS, giới hạn thử sai, thông báo lỗi phù hợp và tránh log bí mật.

Đổi password thay dữ liệu dùng xác thực lần sau; **không tự sửa hay thu hồi cookie/token đã cấp**. Quy trình đổi/quên password phải quyết định riêng việc chặn các phiên cũ. Recovery là một đường vào tài khoản cần được bảo vệ tương xứng.

**Phù hợp khi:** app tự quản lý tài khoản và có khả năng vận hành cả login, lưu password, recovery và MFA. Chọn provider cũng là cách giao một phần trách nhiệm này cho bên khác, không phải lựa chọn ngăn người dùng dùng password.

Nguồn: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## 3. OTP: nhìn mã giống nhau nhưng nguồn tạo có thể khác nhau

OTP là one-time password/passcode theo cơ chế cụ thể. Đừng suy thuật toán chỉ vì thấy sáu chữ số hoặc đồng hồ đếm ngược.

| Cách | Mã từ đâu ra? | Hai phía phải biết gì? |
|---|---|---|
| Mã ngẫu nhiên gửi SMS/email | Server tạo rồi gửi qua kênh nhận | Server giữ dữ liệu kiểm tra; người dùng nhận được mã |
| TOTP | Authenticator và server tự tính | Cùng secret và tham số, thời gian phù hợp |
| HOTP | Authenticator và server tự tính | Cùng secret và tham số, bộ đếm được đồng bộ |

### 3.1. TOTP: vì sao app tạo được mã khi offline?

Khi thiết lập, dịch vụ cấp một secret riêng cho credential, thường qua QR. Authenticator giữ secret; server cũng có khả năng sử dụng secret tương ứng. Sau đó hai bên tính mã từ secret và bước thời gian hiện tại.

~~~text
Điện thoại: secret + đồng hồ điện thoại → mã
Server:     cùng secret + đồng hồ server → mã dự kiến
~~~

Điện thoại không cần nhận mã từ server nên có thể tạo khi offline. Khi Anna nhập mã vào trang login, request vẫn phải tới server. “Offline” không có nghĩa hoàn tất đăng nhập một dịch vụ online mà không liên lạc dịch vụ.

Ví dụ bước 30 giây: trong cùng bước, đầu vào thời gian giữ nguyên. Khi qua bước mới, đầu vào đổi dù không ai bấm nút. 30 giây là cấu hình phổ biến, không phải mọi dịch vụ đều giống nhau. Việc nhập mã không tự làm mã đổi ngay.

Server lấy secret đúng tài khoản/credential, tính mã, kiểm tra cửa sổ thời gian được phép, giới hạn thử sai và chống sử dụng lại sau khi mã được chấp nhận. Có thể chấp nhận bước lân cận để xử lý lệch đồng hồ; cửa sổ rộng hơn cũng mở thêm khả năng thử. Các request đồng thời không được cùng tiêu thụ mã đã dùng nếu policy yêu cầu dùng một lần.

Secret TOTP không giống password hash: server cần dùng secret để tính mã. Chỉ giữ hash một chiều của seed thường không đủ cho phép tính chuẩn. Phải bảo vệ seed khi lưu, phân quyền và ghi log. Ai lấy được seed có thể tạo mã; ai lấy được một mã có thể dùng/chuyển tiếp trong điều kiện còn hiệu lực.

### 3.2. Mã SMS/email khác TOTP thế nào?

Trong cách thường gặp, server tạo mã ngẫu nhiên, gắn với tài khoản/giao dịch/mục đích, đặt thời hạn rồi gửi. Người dùng không có seed chung để tự tính.

Khi kiểm tra, phải biết mã thuộc lần xác minh nào, có đúng mục đích không, còn hạn, chưa dùng, còn số lần thử hay không. Mã xác minh địa chỉ email không tự được dùng làm mã đổi password. Lưu hash mã có thể giảm lộ trực tiếp khi DB bị đọc nhưng mã ngắn vẫn dễ bị thử hết không gian; không thay thời hạn và rate limit.

Gửi lại cần quy định mã cũ còn hiệu lực không. Không để thao tác gửi lại xóa bộ đếm thử sai và tạo vòng đoán vô hạn. Cũng giới hạn tần suất gửi để tránh spam và chi phí.

SMS phụ thuộc quyền kiểm soát số điện thoại, có rủi ro SIM swap/chuyển số/cấp lại số. Email phụ thuộc hộp thư; nếu hộp thư bị chiếm thì mã có thể bị đọc. Không tự coi email OTP là yếu tố độc lập nếu cùng chuỗi thông tin đăng nhập đã bị xâm phạm. Trong phạm vi chuẩn NIST, email không được chấp nhận làm kênh out-of-band authentication; điều đó không cấm mọi chức năng xác minh địa chỉ email.

### 3.3. HOTP: “bộ đếm” là gì?

HOTP tính từ secret và một số nguyên chỉ vị trí đang tạo mã. Nó không phải đồng hồ đếm ngược, tổng số login thành công hay số lần nhập sai.

~~~text
Secret K + counter 10 → mã cho bước 10
Secret K + counter 11 → mã cho bước 11
~~~

Authenticator có thể tiến bộ đếm khi tạo mã; server tiến sau khi chấp nhận theo cơ chế triển khai. Người dùng tạo nhiều mã chưa dùng có thể làm hai bên lệch. Server có thể dùng cửa sổ phía trước hoặc quy trình đồng bộ lại được kiểm soát. Thời gian trôi qua không tự tăng counter, nên HOTP không mặc nhiên hết hạn sau 30 giây. TOTP xây trên HOTP nhưng lấy moving factor từ bước thời gian.

### 3.4. OTP có chống phishing không?

Mã nhập tay có thể bị người dùng nhập vào trang giả rồi bị chuyển ngay sang trang thật. Có thời hạn và chống dùng lại không tự tạo ràng buộc với website như WebAuthn. Không nói “mã dùng một lần thì không thể bị lấy cắp”.

Nguồn: [HOTP — RFC 4226](https://www.rfc-editor.org/rfc/rfc4226.html), [TOTP — RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html), [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), [NIST authenticator requirements](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/).

## 4. Passkey: hiểu ký và kiểm tra trước khi đọc tên trường

### 4.1. Thiết bị giữ gì, server giữ gì?

Authenticator là thành phần quản lý và dùng credential, có thể ở thiết bị hoặc security key. Với credential khóa công khai, phía người dùng có private key được bảo vệ; server lưu public key và liên kết credential ID với tài khoản.

Private key tạo chữ ký. Public key kiểm tra chữ ký có hợp lệ với dữ liệu theo thuật toán không. **Ký không phải “private key mã hóa, public key giải mã”.** Chữ ký không tự che giấu dữ liệu, cũng không cần server lấy dữ liệu gốc từ chữ ký.

Giữ public key công khai không đủ tạo chữ ký mới. Nhưng bản ghi public key phải toàn vẹn và thuộc đúng user: sửa được liên kết này có thể làm server tin credential của attacker.

### 4.2. Challenge để làm gì, có phải giữ bí mật không?

Server tạo challenge ngẫu nhiên cho một giao dịch đăng ký/login và ghi nhận thông tin đối chiếu. Challenge không cần bí mật như private key. Nó cần đủ ngẫu nhiên, còn hiệu lực, đúng giao dịch và được tiêu thụ/chống dùng lại theo policy.

Ví dụ chuỗi ngắn chỉ để học:

~~~text
Lần 1: server chờ ABC123 → assertion chứa ABC123, có chữ ký S1
Lần 2: server chờ XYZ789 → assertion cũ ABC123 + S1 không khớp
~~~

Đổi ABC123 thành XYZ789 nhưng giữ chữ ký cũ cũng không được, vì dữ liệu ràng buộc với chữ ký đã đổi. Challenge giúp chống replay kết quả cũ; không thay mọi kiểm soát khác của giao thức và endpoint.

### 4.3. Server lấy challenge ở đâu để so?

Browser gửi dữ liệu phản hồi, trong đó có clientDataJSON chứa challenge, cùng authenticatorData và signature. Ở authentication WebAuthn, dữ liệu ký là authenticatorData nối với SHA-256(clientDataJSON).

~~~text
Server đọc challenge từ dữ liệu phản hồi → so với giao dịch đang chờ
Server dựng dữ liệu theo WebAuthn → dùng public key xác minh chữ ký
Server kiểm tra thêm loại thao tác, origin, RP ID và flags bắt buộc
~~~

Challenge không được “giấu trong chữ ký chờ giải mã”. Hash làm dữ liệu client được ràng buộc vào chữ ký theo giao thức.

### 4.4. Nếu người khác đọc được dữ liệu raw thì sao?

Chỉ biết dữ liệu không tạo được chữ ký mới nếu thiếu private key. Nhưng nếu lấy được nguyên phản hồi còn hiệu lực, vẫn phải xét khả năng gửi lại hoặc gửi trước người dùng. Server cần HTTPS, liên kết giao dịch/phiên, thời hạn và chống dùng lại. Không nói mọi raw + signature luôn vô dụng với attacker.

### 4.5. Đăng ký: Verify and store public key

Trước tiên phải biết ai có quyền thêm credential vào tài khoản. Có thể là phiên đã được xác thực hoặc luồng tạo tài khoản/binding được bảo vệ. Public key đúng cấu trúc không tự chứng minh chủ tài khoản.

1. Frontend gọi backend bắt đầu đăng ký; backend kiểm tra tài khoản/quyền và trả creation options + challenge.
2. Frontend gọi navigator.credentials.create(); browser làm việc với authenticator và người dùng xác nhận theo yêu cầu.
3. Authenticator tạo credential; browser gửi kết quả đăng ký về backend. Public key/credential ID nằm trong dữ liệu credential, private key không gửi cho backend.
4. Backend kiểm tra clientDataJSON và attestationObject theo WebAuthn: loại webauthn.create, challenge, origin, RP ID hash, presence/verification theo policy, thuật toán và cấu trúc credential được chấp nhận, trùng credential và liên kết tài khoản.
5. Backend xử lý attestation theo format/policy; chỉ sau khi chấp nhận mới lưu credential ID, public key và metadata phù hợp với user.

**Điểm khác đăng nhập:** chưa có public key cũ để xác minh một assertion đăng nhập. Attestation none không có attestation signature. Format khác có quy tắc xác minh riêng; không khẳng định mọi registration đều ký bằng private key mới và server luôn kiểm tra theo cùng một cách. Attestation không thay account binding và quyền thêm credential.

### 4.6. Đăng nhập: Verify with stored public key

1. Frontend xin request options và challenge mới từ backend.
2. Browser gọi navigator.credentials.get(); chọn credential phù hợp.
3. Authenticator thực hiện presence/verification theo yêu cầu rồi ký bằng private key của credential.
4. Browser gửi assertion; backend tìm credential đã đăng ký và xác minh chữ ký cùng loại webauthn.get, challenge, origin, RP ID hash, user/account và flags bắt buộc.
5. Nếu đạt, app tạo phiên/cấp credential cho các request sau theo thiết kế.

Credential ID giúp tra bản ghi, không phải bằng chứng đủ để login. Một user có thể có nhiều credential. Với discoverable credential, cách nhận diện account khác luồng yêu cầu username trước, nhưng vẫn cần kiểm tra quan hệ user/credential đúng.

### 4.7. Vân tay, khuôn mặt, PIN và security key nằm ở đâu?

Passkey là credential; security key là authenticator vật lý; PIN/sinh trắc học có thể xác minh người dùng cục bộ trước khi cho dùng private key. Trong luồng WebAuthn đó, server nhận bằng chứng mật mã và thông tin xác minh, không nhận ảnh vân tay/khuôn mặt để tự so.

Chạm key xác nhận user presence khác user verification bằng PIN/sinh trắc. Một key có thể hỗ trợ nhiều giao thức/chức năng; không suy mọi USB key là cùng một loại passkey.

### 4.8. Đổi thiết bị, mất key và giới hạn bảo vệ

Synced passkey có thể được đồng bộ theo cơ chế nhà cung cấp; device-bound credential không tự xuất hiện trên máy mới. Không khẳng định mọi private key luôn chỉ tồn tại trên một thiết bị. Cần bảo vệ recovery, thêm/xóa credential và tài khoản quản lý đồng bộ.

WebAuthn có ràng buộc RP/origin hỗ trợ chống phishing theo giao thức. Sau login, app vẫn có thể cấp bearer cookie/token; passkey không tự thu hồi hoặc bảo vệ mọi bản sao credential sau login. Signature counter cũng phải diễn giải theo loại authenticator, không mặc định synced passkey nào cũng có counter tăng hữu ích.

Các bước ở đây để hiểu cơ chế, không thay thuật toán kiểm tra đầy đủ của thư viện. Nguồn: [W3C WebAuthn](https://www.w3.org/TR/webauthn-3/).

## 5. MFA: ghép yếu tố đúng, không đếm số màn hình

| Nhóm | Ví dụ | Chú ý |
|---|---|---|
| Điều biết | Password, passphrase, PIN | PIN cục bộ có vai trò khác password gửi server |
| Thứ có/kiểm soát | Secret OTP, security key, quyền dùng private key, smart card | Tên thiết bị không đủ xác định mức bảo đảm |
| Sinh trắc học | Vân tay, khuôn mặt, mống mắt | Dùng theo cơ chế và policy, thường kích hoạt authenticator |

MFA yêu cầu ít nhất hai yếu tố thuộc các nhóm khác nhau theo mô hình bảo đảm phù hợp; 2FA là trường hợp hai yếu tố. Hai password không tự thành MFA. Passwordless không tự chứng minh MFA hay mức an toàn nào.

Một passkey có thể kết hợp quyền sử dụng khóa với user verification; đánh giá theo credential, cờ xác minh và policy, không chỉ vì màn hình có Face ID. Trong phạm vi NIST, sinh trắc học không phải một bí mật độc lập thay thế mọi authenticator; phải tuân quy tắc dùng kèm authenticator và mức bảo đảm tương ứng.

Server giữ trạng thái đã hoàn thành các bước xác thực, thời điểm và giao dịch/phiên. Không nhận cờ mfaCompleted=true từ client rồi tin. Step-up là yêu cầu xác thực bổ sung phù hợp thao tác/rủi ro; reauthentication là xác thực lại và không nhất thiết thêm yếu tố khác.

Recovery codes cần quản lý vòng đời/dùng một lần theo chính sách. Thêm yếu tố hoặc đổi kênh khôi phục là thao tác nhạy cảm. Login mạnh nhưng recovery yếu có thể làm mất lợi ích của MFA.

Nguồn: [NIST Authenticator Requirements](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/), [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

## 6. Magic link: phần mở rộng ngoài các ví dụ chính trên slide

Dịch vụ gửi liên kết có token đăng nhập tới email. Server kiểm tra token đúng tài khoản, mục đích, thời hạn và chưa dùng trước khi tạo phiên. Token cần đủ ngẫu nhiên; hai request đồng thời không được cùng tiêu thụ nếu yêu cầu một lần.

Quyền truy cập email trở thành một phần quyết định. Link bị chuyển tiếp, bị lộ hoặc hộp thư bị chiếm có thể ảnh hưởng login. Cần xét phần mềm quét email mở link trước và việc mở khác thiết bị, không chỉ “bấm đúng link là xong”. Token login và token reset password không được dùng lẫn. [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## 7. Tự kiểm tra đã hiểu chưa

- TOTP offline được ở bước nào, còn bước nào vẫn cần gọi server?
- Vì sao public key không cần giải mã để lấy challenge?
- Biết dữ liệu raw khác có nguyên response còn hiệu lực thế nào?
- Registration none có chữ ký attestation để kiểm tra không?
- Vân tay, security key và passkey có thể cùng xuất hiện trong một lần login không?
- Dùng OIDC có cấm app/provider yêu cầu password + OTP không?

Nếu trả lời được bằng luồng dữ liệu thay vì chỉ tên công nghệ, bạn đã có nền để giải thích phần này. Đọc tiếp [02 — Cookie, session và token](02-sessions-and-tokens.md).
