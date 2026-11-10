# 1. Các phương thức xác thực người dùng

[Về mục lục](auth-deep-dive.md)

Chương này trả lời một câu hỏi: **Máy chủ dựa vào đâu để biết người đang đăng nhập đúng là chủ tài khoản?**

Với mật khẩu, máy chủ kiểm tra một bí mật người dùng biết. Với OTP, hai bên tính hoặc kiểm tra cùng một mã dùng một lần. Với passkey, thiết bị tạo chữ ký và máy chủ kiểm tra chữ ký đó.

Các phần bên dưới đi vào những câu hỏi riêng của từng phương thức. Nếu một khái niệm còn khó hiểu, cần giải thích tiếp ngay tại đó thay vì chỉ nêu tên rồi chuyển sang phần khác.

## 1. Đăng nhập bằng mật khẩu

### 1.1. Máy chủ lưu gì?

Khi tạo tài khoản, người dùng đặt một mật khẩu. Máy chủ không nên lưu nguyên mật khẩu đó. Thay vào đó, thư viện bảo mật tính một **giá trị băm**, rồi máy chủ lưu giá trị này cùng thông tin cần để kiểm tra về sau.

| Dữ liệu | Ý nghĩa |
|---|---|
| Mã tài khoản | Cho biết dữ liệu thuộc người dùng nào |
| Giá trị băm mật khẩu | Dùng kiểm tra mật khẩu được nhập khi đăng nhập |
| Salt | Dữ liệu ngẫu nhiên riêng cho lần băm; giúp cùng mật khẩu không tạo cùng kết quả lưu |
| Thuật toán và tham số | Cho thư viện biết cách kiểm tra |

Salt có thể được lưu cùng giá trị băm. Nó không phải mật khẩu và không cần giữ bí mật.

### 1.2. Đăng nhập diễn ra thế nào?

1. Người dùng gửi tên tài khoản và mật khẩu qua kết nối HTTPS.
2. Máy chủ tìm bản ghi tài khoản.
3. Thư viện kiểm tra mật khẩu vừa nhập với giá trị băm đã lưu, sử dụng salt và tham số tương ứng.
4. Nếu khớp, máy chủ kiểm tra tài khoản có được đăng nhập không.
5. Máy chủ tạo phiên đăng nhập hoặc cấp token theo thiết kế.

**Máy chủ không cần giải mã giá trị băm để lấy lại mật khẩu.** Nó dùng thuật toán xác minh để biết đầu vào có đúng hay không.

### 1.3. Vì sao phải dùng thuật toán riêng cho mật khẩu?

Nếu cơ sở dữ liệu bị lấy, attacker có thể thử đoán mật khẩu mà không gọi chức năng đăng nhập. Thuật toán băm dành cho mật khẩu được thiết kế để mỗi lần thử tốn tài nguyên, làm việc dò hàng loạt khó hơn.

Một hàm băm nhanh như SHA-256 không nên được dùng trực tiếp thay cho thuật toán băm mật khẩu. Khi triển khai, chọn thư viện và tham số theo [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

### 1.4. Đổi mật khẩu có đăng xuất mọi thiết bị không?

Không mặc nhiên. Đổi mật khẩu thay dữ liệu dùng cho lần đăng nhập tiếp theo. Phiên và token đã được cấp là những dữ liệu khác; hệ thống phải có bước thu hồi nếu muốn chúng ngừng hoạt động.

Tương tự, chức năng quên mật khẩu là một đường khác để lấy lại quyền tài khoản. Nó cần xác minh chủ tài khoản và kiểm soát token khôi phục. [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

### 1.5. Khi nào dùng? Cần nghiên cứu gì tiếp?

Dùng mật khẩu khi ứng dụng tự quản lý tài khoản và có khả năng bảo vệ đăng nhập, đổi mật khẩu và khôi phục. Các vấn đề tiếp theo gồm giới hạn số lần thử, ngăn dùng mật khẩu đã lộ và bảo vệ trước trang đăng nhập giả. [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## 2. HOTP: mã thay đổi theo bộ đếm

### 2.1. Bộ đếm là gì?

Bộ đếm là một số nguyên được lưu lại để biết đang tạo mã ở bước thứ mấy. Nó không phải đồng hồ đếm ngược, số lần đăng nhập sai hay tổng số lần đăng nhập.

HOTP tính mã từ hai dữ liệu:

```text
Khóa bí mật dùng chung + bộ đếm → mã HOTP
```

HOTP viết đầy đủ là HMAC-based One-Time Password. HMAC là phép tính dùng khóa bí mật để tạo mã xác thực; khi mới học, điều cần nhớ là **cùng khóa, cùng bộ đếm và tham số thì hai bên tính được cùng mã**.

### 2.2. Ứng dụng và máy chủ lưu gì?

Cả hai giữ cùng khóa bí mật và theo dõi bộ đếm. Các mã dưới đây chỉ minh họa cách hoạt động, không phải kết quả tính từ một khóa cụ thể.

| Bộ đếm | Mã minh họa |
|---|---|
| 10 | `482193` |
| 11 | `705821` |
| 12 | `139604` |

### 2.3. Máy chủ kiểm tra ra sao?

1. Ứng dụng dùng khóa và bộ đếm 10 để tạo mã.
2. Người dùng gửi mã cho máy chủ.
3. Máy chủ dùng khóa đã lưu và bộ đếm đang chờ để tính mã đối chiếu.
4. Nếu khớp, máy chủ chấp nhận và cập nhật sang bước tiếp theo.

Ứng dụng tăng bộ đếm khi tạo mã tiếp theo. Máy chủ cập nhật sau khi chấp nhận mã. Nếu người dùng tạo nhiều mã nhưng chưa gửi, ứng dụng có thể đi trước máy chủ. Vì vậy, máy chủ có thể kiểm tra thêm một số bước phía trước hoặc yêu cầu đồng bộ lại theo chính sách. [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226.html).

### 2.4. Mã có hết hạn sau 30 giây không?

Bản thân HOTP không có quy tắc đó. Thời gian trôi qua không tự tăng bộ đếm. Dịch vụ có thể đặt thêm thời hạn, nhưng đó là điều kiện bổ sung.

## 3. TOTP: mã thay đổi theo thời gian

### 3.1. TOTP khác HOTP ở đâu?

TOTP dùng cách tính của HOTP, nhưng lấy giá trị thay đổi từ **khoảng thời gian hiện tại** thay vì số lần tạo mã.

```text
Khóa bí mật dùng chung + khoảng thời gian hiện tại → mã TOTP
```

Chu kỳ thường gặp là 30 giây. Trong cùng khoảng, đầu vào giữ nguyên nên mã giữ nguyên. Khi sang khoảng mới, đầu vào thay đổi dù người dùng chưa nhập mã.

### 3.2. Vì sao ứng dụng và máy chủ biết cùng mã?

Khi thiết lập, dịch vụ cấp một khóa bí mật cho ứng dụng authenticator, thường thông qua mã QR. Máy chủ giữ khóa tương ứng với tài khoản.

Khi đăng nhập:

1. Ứng dụng lấy khóa bí mật và thời gian hiện tại để tính mã.
2. Người dùng nhập mã vào dịch vụ.
3. Máy chủ dùng cùng khóa và khoảng thời gian để tính mã đối chiếu.
4. Máy chủ chấp nhận nếu mã phù hợp các điều kiện kiểm tra.

Ứng dụng tự tính, không cần nhận mã qua mạng. Đây là lý do nó vẫn hiển thị mã khi điện thoại không có Internet. Đồng hồ sai có thể khiến hai bên tính cho các khoảng khác nhau. [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html).

### 3.3. Nhập mã có làm mã thay đổi ngay không?

Không. Việc nhập mã không làm đồng hồ chuyển khoảng. Tuy nhiên, máy chủ phải ngăn một mã đã chấp nhận bị dùng lại trong thời gian còn hiệu lực.

Máy chủ có thể chấp nhận một số khoảng lân cận để xử lý chênh lệch đồng hồ. Khoảng chấp nhận càng rộng thì càng có nhiều mã có thể được thử. [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html).

### 3.4. Các ứng dụng authenticator dùng loại nào?

Kiểu mã có đồng hồ đếm ngược và tự thay theo chu kỳ thường là TOTP. Tuy nhiên, một ứng dụng có thể hỗ trợ nhiều cơ chế; dịch vụ đăng nhập quyết định cách thiết lập.

Microsoft Authenticator hỗ trợ TOTP và còn có thông báo phê duyệt hoặc passkey. Bấm chấp thuận thông báo không phải nhập mã TOTP. [Microsoft Authenticator](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-authenticator-app).

2FAS hỗ trợ cả TOTP và HOTP. [2FAS](https://2fas.com/support/2fa-knowledge/i-have-changed-my-phone-number-what-should-i-do/).

### 3.5. So sánh để tránh nhầm

| | HOTP | TOTP |
|---|---|---|
| Dữ liệu thay đổi | Bộ đếm số lần tạo mã | Khoảng thời gian |
| Không thao tác thì sao? | Bộ đếm không tự tăng theo thời gian | Vẫn chuyển sang khoảng tiếp theo |
| Khó khăn đồng bộ | Bộ đếm hai bên lệch nhau | Đồng hồ hai bên lệch nhau |
| Có tự giới hạn theo thời gian? | Không, trừ chính sách bổ sung | Có khoảng chấp nhận theo cấu hình |

### 3.6. Phần cần nghiên cứu sau khi hiểu cơ chế

OTP ngắn nên cần giới hạn số lần thử. Khóa dùng tạo mã phải được bảo vệ; ai lấy được khóa có thể tạo mã tương ứng. Mã nhập trên trang giả cũng có thể bị chuyển tiếp ngay sang dịch vụ thật. OTP gửi qua SMS/email có quá trình khác, được giải thích ở mục tiếp theo. [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

## 4. OTP gửi qua SMS hoặc email

### 4.1. Mã này có phải TOTP không?

Không thể kết luận chỉ vì mã có thời hạn. **TOTP là cách tính mã từ khóa bí mật và khoảng thời gian. SMS và email là kênh chuyển mã đến người dùng.**

Với cách gửi OTP thường gặp, máy chủ tạo một mã ngẫu nhiên, ghi nhận thông tin để kiểm tra rồi gửi qua SMS hoặc email. Người dùng không cần ứng dụng authenticator có chung khóa để tự tính mã.

### 4.2. Khi bấm “Gửi mã”, điều gì xảy ra?

Giả sử hệ thống cần xác minh một lần đăng nhập:

1. Máy chủ xác định lần xác minh và số điện thoại/email đã gắn với tài khoản theo chính sách.
2. Máy chủ tạo mã ngẫu nhiên bằng bộ sinh số an toàn cho mục đích bảo mật.
3. Máy chủ lưu dữ liệu kiểm tra mã, thời hạn, số lần thử và mục đích sử dụng.
4. Máy chủ gửi mã qua nhà cung cấp SMS hoặc dịch vụ email.
5. Người dùng nhập mã; máy chủ kiểm tra mã có thuộc đúng lần xác minh, đúng mục đích, còn hạn và chưa bị dùng hay không.
6. Nếu đạt, máy chủ đánh dấu đã sử dụng và cho phép tiếp tục thao tác.

Máy chủ có thể lưu giá trị băm thay mã nguyên bản để giảm việc lộ mã khi dữ liệu lưu trữ bị đọc. Tuy nhiên, mã ngắn có ít khả năng, nên giá trị băm không thay thế thời hạn ngắn và giới hạn số lần thử. [OWASP — Xử lý và lưu OTP](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html#one-time-password-otp-handling-and-storage).

### 4.3. Máy chủ kiểm tra điều gì ngoài việc nhập đúng mã?

Mã phải thuộc đúng tài khoản và đúng yêu cầu. Mã dùng xác minh email không được tự trở thành mã cho phép đổi mật khẩu hoặc đăng nhập. Nếu có nhiều yêu cầu cùng lúc, hệ thống phải xác định rõ mỗi mã dùng cho yêu cầu nào.

Hai yêu cầu đồng thời gửi cùng mã không được cùng sử dụng thành công. Sau khi mã được chấp nhận, trạng thái đã dùng phải có hiệu lực với các yêu cầu sau đó.

Điểm quan trọng là: **nhập đúng mã chứng minh người nhập đã có được mã gửi tới kênh đó.** Nó không chứng minh tuyệt đối người nhập là chủ tài khoản, vì mã có thể bị đọc trộm, chuyển tiếp hoặc lấy qua trang giả.

### 4.4. Bấm “Gửi lại mã” thì mã cũ còn dùng được không?

Đó là chính sách của hệ thống, không phải quy tắc chung của SMS/email. Nếu phát mã mới, hệ thống cần quy định rõ mã cũ có bị vô hiệu hóa hay không. Nên tránh để nhiều mã cùng hiệu lực mà người dùng không biết mã nào đang được chấp nhận.

Gửi lại không được xóa giới hạn số lần thử để người gọi có thể đoán mã vô hạn. Cũng cần giới hạn tần suất gửi để tránh spam và phát sinh chi phí SMS. [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

### 4.5. SMS và email có rủi ro khác nhau không?

**SMS** phụ thuộc quyền kiểm soát số điện thoại và hạ tầng viễn thông. Nếu attacker chiếm số bằng SIM swap hoặc chuyển số trái phép, hắn có thể nhận mã. Số đã bỏ dùng còn có thể được cấp lại.

**Email** phụ thuộc quyền truy cập hộp thư. Nếu hộp thư bị chiếm, bị chuyển tiếp hoặc còn mở trên thiết bị khác, mã có thể bị đọc. Email OTP không mặc nhiên là yếu tố độc lập nếu email cũng được truy cập bằng cùng thông tin đang bị xâm phạm.

Cả hai đều có thể bị phishing thời gian thực: người dùng nhập mã vào trang giả và attacker chuyển ngay mã đó sang dịch vụ thật. [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

Trong phạm vi hướng dẫn xác thực số của NIST, email không được chấp nhận làm kênh xác thực ngoài băng; việc dùng mạng điện thoại để xác thực bị xếp vào nhóm hạn chế và cần đánh giá rủi ro. Đây là yêu cầu trong phạm vi chuẩn đó, không có nghĩa mọi chức năng xác minh địa chỉ email đều là cùng một bài toán. [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html#out-of-band).

### 4.6. So với TOTP trong authenticator

| | TOTP | OTP ngẫu nhiên gửi qua SMS/email |
|---|---|---|
| Mã từ đâu ra? | Ứng dụng và máy chủ tự tính từ khóa và thời gian | Máy chủ tạo mã rồi gửi |
| Người dùng lấy mã bằng cách nào? | Mở ứng dụng authenticator | Nhận tin nhắn hoặc email |
| Cần nhận tin qua kênh gửi không? | Không, ứng dụng có thể tính khi ngoại tuyến | Có, để nhận mã |
| Thời hạn do đâu? | Khoảng thời gian và quy tắc kiểm tra TOTP | Thời hạn máy chủ đặt cho lần phát mã |
| Rủi ro chính cần bảo vệ | Khóa tạo mã, thiết bị, phishing | Kênh nhận mã, việc gửi và phishing |

## 5. Đăng nhập bằng liên kết email — magic link

### 5.1. Ý tưởng chính

Dịch vụ gửi một liên kết có chứa token tới email tài khoản. Người dùng mở liên kết; máy chủ kiểm tra token rồi tạo phiên đăng nhập.

Ở đây, quyền sử dụng email trở thành một phần quan trọng của việc xác minh. Liên kết có thể cho phép đăng nhập, nên phải được bảo vệ như thông tin nhạy cảm.

### 5.2. Hai bên lưu gì và trao đổi thế nào?

Máy chủ giữ thông tin kiểm tra token: tài khoản, mục đích, thời hạn và trạng thái đã sử dụng. Email của người dùng nhận liên kết chứa token.

1. Người dùng yêu cầu gửi liên kết.
2. Máy chủ tạo token ngẫu nhiên và gắn với tài khoản.
3. Người dùng mở liên kết.
4. Máy chủ kiểm tra token còn hạn, đúng mục đích và chưa được dùng.
5. Máy chủ đánh dấu token đã dùng và tạo phiên mới.

Hai yêu cầu đồng thời không được cùng sử dụng thành công một token. Token đăng nhập cũng không được chấp nhận nhầm thành token đặt lại mật khẩu. Các nguyên tắc này có thể đối chiếu với [OWASP Forgot Password](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

### 5.3. Khi nào dùng? Giới hạn là gì?

Phương thức này thuận tiện khi chấp nhận email là kênh xác minh chính. Nếu hộp thư bị chiếm hoặc liên kết bị lộ, quyền đăng nhập cũng có thể bị ảnh hưởng.

Khi triển khai cần xét việc liên kết bị chuyển tiếp, mở trên thiết bị khác hoặc bị phần mềm bảo mật email mở trước. Đây là các tình huống xử lý liên kết, không thay đổi nguyên lý xác thực chính.

## 6. Passkey: thiết bị ký, máy chủ kiểm tra chữ ký

### 6.1. Vân tay có được gửi lên máy chủ không?

Không. Khi dùng vân tay, khuôn mặt hoặc PIN với passkey, thiết bị kiểm tra người dùng có được phép sử dụng khóa riêng hay không. Dịch vụ nhận kết quả mật mã, không nhận dữ liệu vân tay để so sánh.

**Điểm cần hiểu trước tiên: passkey dùng một cặp khóa. Khóa riêng tạo chữ ký; khóa công khai kiểm tra chữ ký.**

### 6.2. Mỗi bên giữ gì?

| Dữ liệu | Ai giữ? | Dùng làm gì? |
|---|---|---|
| Private key — khóa riêng | Thiết bị hoặc trình quản lý passkey bảo vệ | Ký dữ liệu khi xác thực |
| Public key — khóa công khai | Dịch vụ lưu cùng tài khoản | Kiểm tra chữ ký |
| Credential ID | Được dùng để nhận diện passkey đã đăng ký | Giúp tìm đúng thông tin xác thực và tài khoản |

Khóa công khai không cần giữ bí mật. Lấy được khóa công khai không đủ để tạo chữ ký như người giữ khóa riêng.

### 6.3. Đăng ký passkey diễn ra thế nào?

Giả sử người dùng đã được xác minh và nhấn **Tạo passkey**. Trong luồng này, frontend gọi backend trước; máy chủ không tự đẩy một yêu cầu HTTP xuống trình duyệt.

1. **Frontend gọi API bắt đầu đăng ký.** Backend kiểm tra phiên và quyền thêm passkey vào tài khoản.
2. **Backend trả dữ liệu thiết lập.** Dữ liệu gồm thông tin tài khoản, dịch vụ và một **challenge**: dữ liệu ngẫu nhiên cho lần đăng ký đó. Backend giữ thông tin cần để đối chiếu kết quả về sau.
3. **Frontend nhận phản hồi rồi gọi `navigator.credentials.create(...)`.** Đây là API của trình duyệt, không phải một lần gọi HTTP tới backend. Frontend truyền dữ liệu thiết lập vào API này.
4. **Trình duyệt làm việc với authenticator.** Authenticator là thành phần quản lý và sử dụng khóa, có thể nằm trong thiết bị hoặc khóa bảo mật. Người dùng xác nhận theo yêu cầu và authenticator tạo cặp khóa cho dịch vụ.
5. **Frontend nhận kết quả từ trình duyệt rồi gọi API hoàn tất đăng ký.** Kết quả gửi về backend chứa dữ liệu đăng ký, trong đó có khóa công khai và Credential ID. Khóa riêng không được gửi lên backend.
6. **Backend kiểm tra và lưu.** Backend đối chiếu challenge, kiểm tra các điều kiện WebAuthn rồi lưu thông tin xác thực gắn với tài khoản.

Như vậy, thường có hai lượt gọi backend: **xin dữ liệu bắt đầu** và **gửi kết quả để hoàn tất**. Giữa hai lượt đó, frontend gọi WebAuthn để trình duyệt giao tiếp với authenticator. Tên API và cách đóng gói dữ liệu do ứng dụng quyết định. [MDN — Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API).

### 6.4. Đăng nhập ở lần sau diễn ra thế nào?

1. **Frontend gọi API bắt đầu đăng nhập bằng passkey**, chẳng hạn sau khi người dùng chọn cách đăng nhập này.
2. **Backend trả dữ liệu xác thực**, gồm challenge mới và những tùy chọn cần thiết.
3. **Frontend gọi `navigator.credentials.get(...)`** với dữ liệu vừa nhận. Trình duyệt tìm passkey phù hợp; thiết bị có thể yêu cầu vân tay, khuôn mặt hoặc PIN để cho phép dùng khóa.
4. **Authenticator dùng khóa riêng ký dữ liệu xác thực**, trong đó có thông tin gắn với challenge và dịch vụ, rồi trả kết quả qua trình duyệt cho frontend.
5. **Frontend gọi API hoàn tất đăng nhập**, gửi kết quả xác thực về backend.
6. **Backend tìm khóa công khai và kiểm tra** chữ ký, challenge cùng các điều kiện của WebAuthn.

Nếu hợp lệ, máy chủ nhận biết thông tin xác thực đó thuộc tài khoản nào rồi tạo phiên hoặc cấp token theo thiết kế.

### 6.5. Vì sao máy chủ biết đúng tài khoản?

Máy chủ đã lưu quan hệ giữa tài khoản, Credential ID và khóa công khai khi đăng ký. Một tài khoản có thể đăng ký nhiều passkey.

| Tài khoản | Credential ID minh họa | Khóa công khai |
|---|---|---|
| Alice | `credential-A1` | Khóa của passkey thứ nhất |
| Alice | `credential-A2` | Khóa của passkey thứ hai |
| Bob | `credential-B1` | Khóa của Bob |

Credential ID giúp tra thông tin, nhưng **không phải bằng chứng đủ để đăng nhập**. Máy chủ chỉ chấp nhận khi chữ ký và các điều kiện xác thực hợp lệ.

Máy chủ còn kiểm tra challenge, nguồn yêu cầu và danh tính dịch vụ theo WebAuthn. Challenge mới giúp ngăn việc lấy kết quả cũ gửi lại để đăng nhập. Cơ chế cũng gắn thông tin xác thực với dịch vụ, giúp chống trang giả. [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/).

### 6.6. Đổi thiết bị thì sao?

| Loại | Cách hiểu |
|---|---|
| Passkey được đồng bộ | Trình quản lý passkey có thể giúp sử dụng trên các thiết bị khác theo cơ chế của nhà cung cấp |
| Passkey gắn với thiết bị | Không mặc nhiên có trên máy mới; cần phương án đăng ký hoặc truy cập khác |

Vì có cơ chế đồng bộ, không nên khẳng định mọi khóa riêng luôn chỉ tồn tại trên một thiết bị. Điều cần bảo đảm là khóa được quản lý và bảo vệ đúng với yêu cầu hệ thống. Tham khảo phân loại authenticator trong [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).

### 6.7. Phân biệt với mật khẩu

| Mật khẩu | Passkey |
|---|---|
| Người dùng gửi một bí mật để máy chủ kiểm tra | Authenticator dùng khóa riêng tạo chữ ký |
| Máy chủ lưu dữ liệu băm mật khẩu | Máy chủ lưu khóa công khai và thông tin đăng ký |
| Có thể bị lừa nhập vào trang giả | Có cơ chế gắn xác thực với dịch vụ |

Sau khi đăng nhập, hệ thống vẫn có thể dùng cookie hoặc token. Nếu cookie đó bị đánh cắp, passkey không tự thu hồi nó. Đây là vấn đề của phiên sau đăng nhập, được giải thích ở chương tiếp theo.

### 6.8. Những phần có thể đào sâu tiếp

Sau khi hiểu cặp khóa và hai quá trình đăng ký/đăng nhập, có thể nghiên cứu thêm RP ID, origin, các kiểm tra phản hồi và việc đăng ký/thu hồi nhiều passkey. RP ID xác định phạm vi dịch vụ; origin cho biết nguồn trang thực hiện yêu cầu. Không cần bắt đầu bằng toàn bộ tên trường của WebAuthn.

## 7. MFA — xác thực nhiều yếu tố — và xác thực bổ sung

### 7.1. MFA nghĩa là gì?

**MFA viết tắt của Multi-Factor Authentication, nghĩa là xác thực nhiều yếu tố.** Hệ thống yêu cầu ít nhất hai loại bằng chứng khác nhau để xác thực người dùng.

Để hiểu vì sao cần MFA, bắt đầu từ đăng nhập bằng mật khẩu: nếu một người biết mật khẩu của bạn, hệ thống có thể chấp nhận họ như bạn. MFA thêm yêu cầu khác để chỉ biết mật khẩu vẫn chưa đủ.

Chẳng hạn, đăng nhập bằng mật khẩu rồi nhập mã từ ứng dụng authenticator:

1. Mật khẩu chứng minh bạn biết bí mật của tài khoản.
2. Mã authenticator cung cấp bằng chứng bạn kiểm soát thông tin xác thực đã được thiết lập trong ứng dụng.
3. Hệ thống chỉ hoàn tất đăng nhập khi các yêu cầu xác thực đều đạt.

**“Yếu tố” là loại bằng chứng, không phải số màn hình hoặc số lần nhập.** Ba nhóm thường dùng là:

| Nhóm yếu tố | Ý nghĩa | Ví dụ |
|---|---|---|
| Điều bạn biết | Một bí mật bạn có thể cung cấp | Mật khẩu, PIN |
| Thứ bạn sở hữu hoặc kiểm soát | Thiết bị hoặc thông tin xác thực bạn có khả năng sử dụng | Khóa bảo mật, khóa tạo mã trong authenticator |
| Đặc điểm của bạn | Đặc điểm sinh học được kiểm tra theo cơ chế phù hợp | Vân tay, khuôn mặt |

Nhập hai mật khẩu vẫn thuộc cùng nhóm “điều bạn biết”, nên không tự trở thành MFA. **2FA — Two-Factor Authentication** là xác thực hai yếu tố, một trường hợp của MFA. [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

Passwordless chỉ nói rằng không cần nhập mật khẩu. Nó không tự xác định mức bảo đảm hoặc số yếu tố đã được kiểm tra. [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).

### 7.2. Máy chủ biết đã hoàn thành MFA bằng cách nào?

Máy chủ quản lý trạng thái xác thực: đã qua bước nào, vào thời điểm nào và thuộc phiên nào. Không chấp nhận cờ `mfaCompleted=true` chỉ vì client gửi lên.

Khi một hành động cần bằng chứng mới hoặc mạnh hơn, hệ thống yêu cầu **step-up authentication**, tức xác thực bổ sung. **Reauthentication** là xác thực lại, có thể bằng phương thức cũ. Kết quả phải gắn với đúng phiên và có thời hạn phù hợp.

### 7.3. Mất phương thức xác thực thì sao?

Cần có quy trình khôi phục đã thiết kế trước. Mã dự phòng chỉ dùng một lần; việc thêm, xóa hoặc thay yếu tố phải được bảo vệ. Nếu quy trình khôi phục quá yếu, attacker có thể bỏ qua lợi ích của MFA bằng đường này. [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).

## Đọc tiếp

[Session, cookie và token](02-sessions-and-tokens.md): sau khi xác thực, máy chủ nhận biết người dùng ở yêu cầu tiếp theo bằng cách nào?
