# Authentication & Authorization — Tài liệu nghiên cứu

**Bản nháp đang được bổ sung qua quá trình tìm hiểu và trao đổi.**

**Cập nhật:** 08/11/2026.

Tài liệu dành cho người muốn hiểu cách xác thực và phân quyền hoạt động, không yêu cầu đã biết OAuth, OIDC hay SAML. Có thể dùng để học và tra cứu; không giới hạn theo thời lượng thuyết trình.

Mỗi chủ đề được giải thích theo những thắc mắc có thể nảy sinh khi tìm hiểu nó. Nội dung không theo một bộ câu hỏi hay trình tự cố định: phần giải thích cần nối tiếp điều người đọc vừa hiểu và làm rõ điều còn gây băn khoăn. Ví dụ, bảng hoặc luồng xử lý chỉ được dùng khi giúp giải thích vấn đề đang nói đến. Những dữ liệu minh họa không phải cấu hình có thể dùng nguyên trạng trong hệ thống thật.

## Mục lục

| Đọc theo thứ tự | Nội dung |
|---|---|
| [1. Xác thực người dùng](01-user-authentication.md) | Mật khẩu, HOTP, TOTP, magic link, passkey và MFA |
| [2. Session, cookie và token](02-sessions-and-tokens.md) | Nhận biết yêu cầu sau đăng nhập; JWT, access và refresh token |
| [3. OAuth, OIDC và SAML](03-oauth-oidc-saml.md) | Cấp quyền API và nhận kết quả xác thực từ hệ thống khác |
| [4. Xác thực ứng dụng](04-machine-authentication.md) | Basic, API key, mTLS và DPoP |
| [5. Lựa chọn kiến trúc](#lua-chon-kien-truc) | Khi nào cân nhắc cơ chế nào |
| [6. Phân quyền](05-authorization.md) | RBAC, ABAC, ReBAC, ACL và cách kiểm tra quyền trên từng tài nguyên |
| [7. Tùy biến auth](#tuy-bien-auth) | Phân biệt tùy biến xác thực, danh tính và quyền |
| [8. Phát hiện đánh cắp](#phat-hien-danh-cap) | Những tín hiệu hệ thống có thể nhận biết |
| [9. Thu hồi và khôi phục](#thu-hoi-khoi-phuc) | Chặn credential cũ và kiểm tra đã chặn được chưa |

## 1. Trước tiên, hệ thống cần biết gì?

**Authentication — xác thực** giúp xác định người dùng hoặc ứng dụng đang truy cập. **Authorization — phân quyền** quyết định bên đó có được thực hiện hành động cụ thể hay không.

Sau khi xác thực thành công, hệ thống thường tạo phiên hoặc cấp token. Nhờ đó, yêu cầu tiếp theo không cần gửi lại toàn bộ bằng chứng ban đầu. Máy chủ vẫn phải kiểm tra phiên/token và quyền trước khi xử lý.

```text
Xác thực danh tính
    → Tạo phiên hoặc cấp token
    → Nhận yêu cầu tiếp theo
    → Kiểm tra phiên/token
    → Kiểm tra quyền và điều kiện nghiệp vụ
    → Thực hiện hoặc từ chối
```

Bản thân việc cấu hình xác thực không tự bảo vệ mọi chức năng. Trong ASP.NET Core, cần cấu hình phân quyền để yêu cầu đăng nhập hoặc quyền phù hợp ở endpoint cần bảo vệ. [S1]

## 2. Vì sao có nhiều tên khác nhau?

Các tên nói về những việc khác nhau, nên một hệ thống có thể dùng chúng cùng lúc:

| Thành phần | Nhiệm vụ |
|---|---|
| Mật khẩu, OTP, passkey | Cung cấp bằng chứng để xác thực |
| Session | Quản lý một phiên truy cập |
| Cookie | Giúp trình duyệt giữ và gửi dữ liệu |
| JWT | Biểu diễn thông tin trong token |
| OAuth | Cấp quyền truy cập tài nguyên cho ứng dụng |
| OIDC, SAML Web SSO | Cho ứng dụng nhận kết quả xác thực từ hệ thống khác |

**Credential** là tên gọi chung cho thông tin hoặc bằng chứng dùng xác thực/truy cập theo một cơ chế. Trong tài liệu, từ này có thể nói tới mật khẩu, token hoặc chứng chỉ; từng phần sẽ nêu rõ loại đang xét.

**Client** là ứng dụng yêu cầu đăng nhập hoặc gọi API, không nhất thiết là trình duyệt. **IdP — Identity Provider** là hệ thống xác thực và cung cấp kết quả danh tính cho ứng dụng tin cậy nó.

Nên bắt đầu từ [chương xác thực người dùng](01-user-authentication.md), rồi đọc session/token trước khi học các giao thức liên kết hệ thống.

<a id="lua-chon-kien-truc"></a>

## 3. Chọn cơ chế cho loại ứng dụng nào?

### 3.1. Bắt đầu bằng yêu cầu

Trước khi chọn, cần xác định: ai gọi hệ thống, credential được giữ ở đâu, có cần IdP bên ngoài không và phải chặn truy cập cũ nhanh đến mức nào.

| Bối cảnh | Hướng thường đáng cân nhắc | Vì sao? |
|---|---|---|
| Web tạo giao diện ở máy chủ | Cookie và tài khoản nội bộ hoặc OIDC | Quản lý phiên trình duyệt thuận tiện |
| SPA có backend riêng | BFF: trình duyệt dùng cookie, backend giữ token | Hạn chế token xuất hiện ở trình duyệt |
| SPA gọi API trực tiếp | Authorization Code + PKCE | Client xin token theo cơ chế phù hợp ứng dụng không giữ được secret |
| Ứng dụng di động | Authorization Code + PKCE qua trình duyệt hệ thống | Tách tương tác xác thực khỏi mã ứng dụng |
| SSO doanh nghiệp | OIDC hoặc SAML theo hệ thống tích hợp | Dùng danh tính tập trung |
| Dịch vụ gọi API bằng quyền riêng | Danh tính ứng dụng; Client Credentials nếu dùng OAuth | Không giả định luôn có người dùng tham gia |

**SPA** là ứng dụng web có giao diện chủ yếu chạy trong trình duyệt. **BFF — Backend for Frontend** là backend phục vụ riêng giao diện và có thể gọi API thay trình duyệt.

Đây là định hướng, không phải quy tắc bắt buộc cho mọi dự án. Với mobile, đọc hướng dẫn OAuth cho ứng dụng native; với browser, đối chiếu kiến trúc BFF và client trực tiếp. [S9][S10]

### 3.2. Cách giữ credential quan trọng không kém tên công nghệ

Cookie `HttpOnly` hạn chế JavaScript đọc cookie, nhưng mã XSS vẫn có thể gọi API bằng phiên hiện tại. Trình duyệt tự gửi cookie cũng tạo yêu cầu chống CSRF.

Token trong `localStorage` có thể bị JavaScript cùng origin đọc. Giữ trong bộ nhớ giảm lưu lại nhưng không loại bỏ mã độc chạy trong trang. BFF hạn chế token phía trình duyệt nhưng vẫn cần bảo vệ phiên và backend. [S10]

**XSS** là mã độc được thực thi trong trang ứng dụng. **CSRF** là lợi dụng việc trình duyệt mang credential để tạo yêu cầu người dùng không chủ động cho phép. Chi tiết nằm ở chương cookie.

### 3.3. Khi chọn OAuth cần tránh nhầm gì?

PKCE bảo vệ việc đổi code, không bảo vệ token đã bị lấy sau khi cấp. OAuth và OIDC cũng không tự giải quyết phiên riêng của ứng dụng, mọi quyền tài nguyên hoặc logout toàn hệ thống.

Thiết kế mới cần theo hướng dẫn bảo mật OAuth, thay vì dùng flow cũ chỉ vì thư viện còn hỗ trợ. [S11]

<a id="phan-quyen"></a>
<a id="4-phan-quyen-vuot-ra-ngoai-role"></a>

## 4. Phân quyền: đã biết danh tính thì kiểm tra gì tiếp?

Xem [tài liệu Authorization](05-authorization.md) để so sánh các mô hình và theo dõi quyết định cho hai phiên đấu giá trong ví dụ BidLab.

### 4.1. Role có đủ không?

**Role** là vai trò dùng gom quyền theo chức năng. **Permission** là hành động hoặc khả năng được phép. Chỉ biết role chưa chắc biết người dùng có quyền với một tài nguyên cụ thể.

Máy chủ có thể cần kiểm tra tổ chức của tài khoản, quan hệ với tài nguyên và trạng thái hiện tại. **Tenant** là phạm vi tổ chức/khách hàng được phân tách trong hệ thống dùng chung.

### 4.2. Các mô hình khác nhau ở cách quyết định

| Mô hình hoặc cơ chế | Quyết định dựa trên gì? |
|---|---|
| RBAC | Vai trò được gán cho tài khoản hoặc ứng dụng |
| ABAC | Thuộc tính của bên truy cập, tài nguyên, hành động và môi trường |
| ReBAC | Quan hệ giữa bên truy cập và tài nguyên |
| ACL | Danh sách quyền của từng tài khoản hoặc nhóm trên tài nguyên |

RBAC là Role-Based Access Control, ABAC là Attribute-Based Access Control và ReBAC là Relationship-Based Access Control. ACL là Access Control List. Policy có thể kết hợp các điều kiện từ nhiều mô hình để ra quyết định. Nguyên tắc là quyền tối thiểu, mặc định từ chối và kiểm tra ở các yêu cầu cần bảo vệ. [S13]

### 4.3. Máy chủ lấy dữ liệu ở đâu để quyết định?

1. Lấy danh tính từ kết quả xác thực đã kiểm tra.
2. Xác định hành động và tài nguyên được yêu cầu.
3. Tra quyền hoặc quan hệ từ nguồn đáng tin.
4. Kiểm tra điều kiện bắt buộc và cho phép/từ chối.

Không tin `userId`, `tenantId` hoặc `isOwner` chỉ vì client gửi lên. Mã tài nguyên khó đoán cũng không thay phân quyền. Trong ASP.NET Core, chỉ gắn `[Authorize]` chưa đủ cho mọi quyết định phụ thuộc tài nguyên cụ thể. [S14]

### 4.4. Quyền khác điều kiện nghiệp vụ thế nào?

Phân quyền xét bên truy cập có được thực hiện hành động hay không. Kiểm tra nghiệp vụ xét hành động có hợp lệ với trạng thái và quy tắc hiện tại hay không. Cả hai phải được thực thi phía máy chủ.

Quy tắc cần được dùng nhất quán ở HTTP API, tác vụ nền và lệnh qua kết nối thời gian thực. Không để một đường gọi khác bỏ qua điều kiện bắt buộc.

### 4.5. Nếu quyền thay đổi sau khi cấp token?

Quyền ghi trong token không tự cập nhật. Máy chủ cần tra quyền hiện tại, hạn chế thời gian token hoặc đối chiếu phiên bản quyền/phiên theo thiết kế.

Ví dụ cơ chế phiên bản: token mang giá trị 3; hệ thống tăng giá trị hiện tại lên 4 khi muốn vô hiệu hóa quyền cũ. API phải thực sự tra và so sánh hai giá trị. **Chỉ thêm số phiên bản vào token không tự tạo khả năng thu hồi.**

<a id="tuy-bien-auth"></a>

## 5. Tùy biến auth: cần sửa phần nào?

### 5.1. Ba nhu cầu dễ bị gọi chung

| Muốn thay đổi | Trách nhiệm cần xem |
|---|---|
| Cách kiểm tra credential | Xác thực |
| Cách chuyển kết quả xác thực thành thông tin nội bộ | Xử lý danh tính |
| Điều kiện được làm một việc | Phân quyền |

Đổi giao diện login hoặc thêm permission thường không yêu cầu tự viết giao thức đăng nhập.

### 5.2. Áp dụng vào ASP.NET Core

| Thành phần | Dùng để làm gì? |
|---|---|
| Authentication handler | Kiểm tra một cơ chế xác thực và tạo kết quả danh tính |
| Claims transformation | Bổ sung/chuyển đổi thông tin danh tính sau xác thực |
| Authorization requirement/handler | Biểu diễn và đánh giá điều kiện quyền |
| Policy provider | Cung cấp policy khi hệ thống cần cách tạo policy riêng |

**Claim** là một thông tin được khẳng định về danh tính hoặc token. **Principal** là đối tượng framework dùng biểu diễn danh tính. Chuyển claim không tự thay bước xác minh credential. [S1][S15]

### 5.3. Khi nào cần viết riêng?

Khi credential đặc thù chưa có handler phù hợp, có thể cần tự triển khai phần kiểm tra. Trước đó phải nêu rõ dữ liệu được nhận, cách xác minh, hạn dùng, chống dùng lại, lỗi và quản lý khóa.

Với policy, cần xác định ai muốn làm gì trên tài nguyên nào và nguồn quyền ở đâu. Các điều kiện như tài khoản còn hoạt động, phiên còn hạn và đúng tenant không được bị bỏ qua bởi một nhánh cho phép.

### 5.4. Phần cần đào sâu khi triển khai

Cần đọc cách framework kết hợp nhiều handler/policy; không mặc định rằng chỉ một điều kiện đúng là đủ hoặc mọi điều kiện đều bắt buộc.

Với cookie, kiểm tra trạng thái định kỳ có thể tạo khoảng trễ. **Security stamp** có thể được dùng để nhận biết thay đổi bảo mật tài khoản, nhưng hiệu lực phụ thuộc nơi và chu kỳ kiểm tra. [S8]

<a id="phat-hien-danh-cap"></a>

## 6. Phát hiện credential bị đánh cắp

### 6.1. Máy chủ có biết cookie vừa bị sao chép không?

Thường không nếu chưa có tín hiệu bổ sung. Một cookie hoặc token hợp lệ được gửi lên vẫn có thể là từ chủ tài khoản hoặc từ attacker đang giữ bản sao.

Chữ ký token hợp lệ không chứng minh người gửi là chủ tài khoản. Với bearer token, bên giữ token có thể dùng quyền của nó. [S5][S6]

### 6.2. Hệ thống có thể nhìn thấy gì?

| Tín hiệu | Cách hiểu |
|---|---|
| Người dùng báo mất thiết bị hoặc phiên lạ | Cần xác minh và xử lý theo mức độ |
| Mạng, vị trí hoặc phần mềm truy cập thay đổi | Là dấu hiệu nghi ngờ, chưa đủ kết luận |
| Tải nhiều dữ liệu, thử nhiều tài nguyên | Cần phân biệt tác vụ thật và hành vi lạm dụng |
| Thay email khôi phục, MFA hoặc cấp credential mới | Có thể làm tài khoản bị chiếm lâu dài |
| Refresh token đã thay thế xuất hiện lại | Có thể có bản sao hoặc vấn đề gửi yêu cầu đồng thời |

IP có thể đổi do VPN/mạng di động; nhiều người có thể dùng chung IP. User-Agent là thông tin phần mềm client khai báo, có thể giả. Không dùng một giá trị này làm bằng chứng chắc chắn. [S16]

### 6.3. Refresh token cũ xuất hiện lại cho biết gì?

Giả sử máy chủ đã nhận R1, trả R2 và vô hiệu hóa R1. Nếu sau đó có yêu cầu dùng R1, máy chủ biết token cũ đã được trình lại.

Nếu cả người dùng và attacker giữ bản sao, một bên có thể trình token đã bị thay thế. Máy chủ không biết chắc bên nào là attacker. Các yêu cầu đồng thời/gửi lại sau lỗi cũng cần được xử lý để tránh báo động nhầm. [S11]

Máy chủ giữ quan hệ chuỗi token, gọi là **token family**, để thu hồi nhóm liên quan khi cần. Việc này chưa tự vô hiệu hóa access token đã cấp.

### 6.4. Từ tín hiệu đến hành động

Tín hiệu yếu có thể dẫn tới ghi nhận và thông báo. Nhiều tín hiệu hoặc thao tác nhạy cảm có thể dẫn tới tạm chặn và yêu cầu xác thực lại. Khi có bằng chứng mạnh hoặc người dùng xác nhận bị chiếm quyền, cần thu hồi và khôi phục theo chính sách.

Nhật ký nên nối được tài khoản, phiên, thời điểm, sự kiện và kết quả. Không ghi mật khẩu, OTP, cookie hoặc token nguyên bản; dùng mã tham chiếu an toàn. [S17]

Không dựa duy nhất vào phiên đang nghi bị chiếm để cho phép khôi phục. Cũng cần tránh việc chức năng báo cáo bị lợi dụng nhằm khóa tài khoản người khác.

<a id="thu-hoi-khoi-phuc"></a>

## 7. Thu hồi: làm gì để credential cũ không dùng được?

### 7.1. Phải thay đổi ở nơi máy chủ kiểm tra

Xóa cookie trên máy người dùng không xóa bản attacker giữ. Đổi password không tự sửa access token đã phát. Muốn chặn, phải thay đổi một điều kiện mà bên xử lý yêu cầu sẽ kiểm tra.

| Credential | Điều kiện có thể thay đổi |
|---|---|
| Session ID | Đánh dấu bản ghi phiên không còn hoạt động |
| Ticket cookie | Bổ sung/áp dụng kiểm tra trạng thái hoặc phiên bản phù hợp |
| Access token | Kiểm tra thu hồi, trạng thái hoặc chờ hết hạn nếu không có cơ chế đó |
| Refresh token | Vô hiệu hóa token, family hoặc quyền cấp token liên quan |
| Client secret/khóa ký | Thay credential/khóa và cập nhật các bên kiểm tra |

OAuth có chuẩn thu hồi, nhưng API chỉ kiểm tra JWT tại chỗ không tự nhận thông tin từ endpoint thu hồi. [S18]

### 7.2. Các cách API biết token đã bị thu hồi

| Cách | API làm gì? |
|---|---|
| Kiểm tra phiên | Tra xem phiên còn hoạt động |
| Denylist | Tra mã token/phiên có trong danh sách bị chặn |
| Phiên bản | So giá trị trong credential với giá trị hiện tại |
| Introspection | Hỏi máy chủ cấp token về trạng thái |
| Hạn token ngắn | Từ chối khi tới hạn; không chặn ngay trước hạn |

Introspection là chức năng hỏi thông tin/trạng thái token. Nếu lưu đệm kết quả, API có thể tiếp tục dùng kết quả cũ trong thời gian đó. [S19]

### 7.3. Vì sao đã bấm thu hồi nhưng vẫn còn truy cập?

Một máy chủ có thể chưa nhận trạng thái mới. Bộ nhớ đệm có thể chưa hết hạn. Một kết nối dài hạn có thể vẫn giữ danh tính cũ. Vì vậy, phải đo lúc **mọi đường truy cập thực sự từ chối**, không chỉ lúc nút thu hồi trả thành công.

Khi nơi kiểm tra trạng thái lỗi, cần chính sách rõ. **Fail-closed** nghĩa là từ chối nếu không xác minh được điều kiện bắt buộc. Nếu chọn tiếp tục một số yêu cầu, phải hiểu tác động thay vì coi hệ thống đã chặn đầy đủ.

### 7.4. Kết nối đang mở được xử lý thế nào?

WebSocket/SignalR không nhất thiết chạy lại xác thực HTTP ở từng thông điệp. SignalR có thể giữ danh tính trong suốt kết nối. Token hết hạn và tài khoản vừa bị khóa là hai sự kiện cần xử lý riêng.

Tùy framework, cần ngắt kết nối phía máy chủ hoặc kiểm tra lại trước lệnh nhạy cảm. Gửi yêu cầu client tự logout không đủ: attacker có thể không làm theo. [S20]

Yêu cầu đã bắt đầu trước thu hồi cũng có thể tiếp tục chạy. Với tác vụ nhạy cảm, cần quyết định kiểm tra lại trước khi ghi dữ liệu, hủy tác vụ hoặc xử lý khắc phục.

### 7.5. Trình tự xử lý khi xác nhận bị lộ

1. Xác định tài khoản, phiên hoặc credential bị ảnh hưởng; giữ bằng chứng cần thiết.
2. Chặn hoặc thu hồi trong phạm vi phù hợp, không chờ điều tra xong mới chặn.
3. Cập nhật các máy chủ, bộ nhớ đệm và kết nối đang mở.
4. Xử lý nguồn rò rỉ và kiểm tra email khôi phục, MFA hoặc credential attacker có thể đã thêm.
5. Xác minh chủ tài khoản qua cách đáng tin, thay credential liên quan và cấp phiên mới.
6. Thử lại credential cũ ở các đường được phép kiểm thử: API, refresh và kết nối lại; xem nhật ký sau thu hồi.

Dữ liệu đã bị tải xuống không thể lấy lại bằng logout. Những thao tác attacker đã thực hiện cần được điều tra riêng.

### 7.6. Passkey, MFA hay DPoP có thay được thu hồi không?

Không. Passkey/MFA bảo vệ một số khâu xác thực; DPoP/mTLS có thể yêu cầu bằng chứng giữ khóa khi dùng token. Chúng giảm rủi ro nhưng không thay quản lý phiên, quyền và trạng thái thu hồi. [S21]

## 8. Tiếp tục tìm hiểu từ chỗ chưa rõ

Khi một giải thích làm xuất hiện thắc mắc mới, cần làm rõ thắc mắc đó thay vì chỉ chuyển sang thuật ngữ tiếp theo. Hiểu HOTP có thể dẫn tới câu hỏi “bộ đếm là gì?”; hiểu passkey có thể dẫn tới câu hỏi “vì sao khóa công khai kiểm tra được chữ ký?”. Mỗi câu hỏi cần phần giải thích phù hợp, không nhất thiết cùng cấu trúc.

Tài liệu sẽ được bổ sung từ những trao đổi này. Khi chuyển sang đọc mã nguồn, cần đối chiếu điều đã hiểu với cách ứng dụng thực sự xử lý; không chỉ thấy thư viện hỗ trợ là coi như cơ chế đã được sử dụng đúng.

## Nguồn tham khảo

Các nguồn dùng để kiểm chứng thuật ngữ và cơ chế. Các bảng lựa chọn và cách tổ chức nội dung là tổng hợp cho tài liệu này.

- **[S1]** [Microsoft — Overview of ASP.NET Core authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/?view=aspnetcore-10.0).
- **[S2]** [NIST SP 800-63B — Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html).
- **[S3]** [RFC 6749 — OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749.html).
- **[S4]** [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html).
- **[S5]** [RFC 7519 — JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519.html).
- **[S6]** [RFC 6750 — OAuth 2.0 Bearer Token Usage](https://www.rfc-editor.org/rfc/rfc6750.html).
- **[S7]** [OASIS — SAML 2.0 Technical Overview](https://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html).
- **[S8]** [Microsoft — Cookie authentication and principal validation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0).
- **[S9]** [RFC 8252 — OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252.html).
- **[S10]** [RFC 10017 — OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html).
- **[S11]** [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html).
- **[S12]** [RFC 7617 — Basic HTTP Authentication Scheme](https://www.rfc-editor.org/rfc/rfc7617.html).
- **[S13]** [OWASP — Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- **[S14]** [Microsoft — Resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0).
- **[S15]** [Microsoft — Policy-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-10.0).
- **[S16]** [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- **[S17]** [OWASP — Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).
- **[S18]** [RFC 7009 — OAuth 2.0 Token Revocation](https://www.rfc-editor.org/rfc/rfc7009.html).
- **[S19]** [RFC 7662 — OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662.html).
- **[S20]** [Microsoft — SignalR authentication and authorization](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-8.0).
- **[S21]** [RFC 9449 — OAuth 2.0 Demonstrating Proof of Possession](https://www.rfc-editor.org/rfc/rfc9449.html) và [RFC 8705 — OAuth 2.0 Mutual-TLS](https://www.rfc-editor.org/rfc/rfc8705.html).
