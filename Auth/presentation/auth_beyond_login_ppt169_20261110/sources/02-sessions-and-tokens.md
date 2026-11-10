# 2. Session, cookie và token

[Về mục lục](auth-deep-dive.md)

Người dùng vừa nhập đúng mật khẩu hoặc hoàn thành passkey. Nhưng khi họ bấm sang trang khác, máy chủ nhận một yêu cầu mới. **Làm sao máy chủ biết yêu cầu mới vẫn thuộc người đã đăng nhập?**

Session và token giải quyết việc nhận biết các yêu cầu tiếp theo. Cookie là một cách để trình duyệt giữ và gửi dữ liệu cần thiết. JWT là một định dạng token. Chương này giải thích từng phần riêng trước khi nối chúng lại.

## 1. Session: khi máy chủ lưu phiên đăng nhập

Đây là một cách thiết kế, không phải bước bắt buộc của mọi hệ thống. Nếu API xác minh token theo cách stateless, nó không cần bản ghi phiên để nhận biết từng yêu cầu. Mục 1.6 giải thích cách đó.

### 1.1. Mỗi bên giữ gì?

Session là một phiên truy cập mà hệ thống quản lý sau đăng nhập. Với **server-side session**, máy chủ giữ thông tin phiên; trình duyệt thường chỉ giữ một mã khó đoán, gọi là Session ID.

| Trình duyệt | Máy chủ |
|---|---|
| Giữ Session ID, thường trong cookie | Giữ bản ghi phiên gắn với tài khoản |
| Gửi ID theo yêu cầu | Tra ID để biết tài khoản và hiệu lực phiên |

Một bản ghi có thể trông như sau. Giá trị trong bảng chỉ minh họa cấu trúc:

| Session ID | Tài khoản | Hết hạn | Trạng thái |
|---|---|---|---|
| `random-session-A` | Alice | Thời điểm đã đặt | Còn hiệu lực |

### 1.2. Lần đăng nhập đầu tiên

1. Người dùng hoàn thành xác thực.
2. Máy chủ tạo Session ID mới, khó đoán.
3. Máy chủ lưu bản ghi liên kết ID với tài khoản.
4. Máy chủ gửi ID cho trình duyệt, thường bằng cookie.

### 1.3. Yêu cầu tiếp theo

1. Trình duyệt gửi Session ID.
2. Máy chủ tìm bản ghi phiên tương ứng.
3. Máy chủ kiểm tra phiên còn hiệu lực và được phép sử dụng.
4. Máy chủ xác định tài khoản rồi kiểm tra quyền của yêu cầu.

**Máy chủ không cần nhận lại mật khẩu ở từng yêu cầu.** Nó tin bản ghi phiên do chính hệ thống tạo và kiểm soát.

### 1.4. Đăng xuất làm gì?

Máy chủ vô hiệu hóa phiên, đồng thời yêu cầu trình duyệt bỏ cookie. Nếu attacker còn giữ bản sao ID, yêu cầu của hắn phải bị từ chối khi máy chủ kiểm tra phiên đã bị thu hồi.

Việc này chỉ có hiệu lực ở nơi thực sự kiểm tra trạng thái mới. Khi có nhiều máy chủ hoặc bộ nhớ đệm, phải bảo đảm thay đổi được nhận biết trong thời gian cần thiết.

### 1.5. Khi nào phù hợp? Đào sâu thêm ở đâu?

Session phù hợp khi cần quản lý và thu hồi truy cập tập trung. Chi phí là nơi lưu phiên và bước tra cứu khi xử lý yêu cầu.

Sau khi hiểu cơ chế, cần nghiên cứu thời hạn không hoạt động, tuổi tối đa của phiên và cách thay ID sau đăng nhập để chống session fixation. Session fixation là việc attacker tìm cách khiến người dùng dùng một ID mà hắn đã biết. [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

### 1.6. Nếu dùng stateless thì không có session, vậy nhận biết người dùng bằng cách nào?

Đúng là API có thể không lưu bản ghi phiên đăng nhập. **Stateless trong ngữ cảnh này nghĩa là API không cần nhớ lần đăng nhập trước để xác thực yêu cầu hiện tại.** Nó không có nghĩa toàn hệ thống không có cơ sở dữ liệu, tài khoản hoặc khóa.

Một cách thực hiện là dùng access token tự chứa thông tin và có chữ ký, chẳng hạn JWT:

1. Client hoàn thành xác thực với bên cấp token.
2. Bên cấp token tạo token chứa thông tin cần thiết, ký rồi trả cho client.
3. Client gửi token khi gọi API.
4. API dùng khóa tin cậy kiểm tra token, bên phát hành, bên nhận, thời hạn và các điều kiện bắt buộc.
5. API lấy danh tính từ kết quả hợp lệ rồi kiểm tra quyền truy cập.

API không phải tìm `Session ID → tài khoản` trong một bảng phiên. Dữ liệu trong token và kết quả kiểm tra giúp nó nhận biết bên gọi. Chi tiết JWT nằm ở mục 3.

| Lưu phiên ở máy chủ | API kiểm tra token tự chứa theo cách stateless |
|---|---|
| Client gửi mã để tra phiên | Client gửi token có thông tin và chữ ký |
| Máy chủ dựa vào bản ghi phiên | API dựa vào token hợp lệ và cấu hình tin cậy |
| Có thể vô hiệu hóa bản ghi để thu hồi | Không có bản ghi phiên để xóa; phải xét cơ chế thu hồi token |

**Vậy đăng xuất làm gì?** Client có thể bỏ token để ngừng gửi nó. Nhưng nếu attacker giữ bản sao, bỏ token ở client không khiến bản sao mất hiệu lực. Nếu API chỉ kiểm tra token tại chỗ, token có thể còn được chấp nhận tới lúc hết hạn.

Muốn chặn trước hạn, API cần biết thêm trạng thái mới, chẳng hạn danh sách token bị thu hồi hoặc trạng thái tài khoản/phiên. Đây là phần trạng thái được bổ sung vào thiết kế. Không thể vừa chỉ tin token chưa hết hạn, vừa tự biết một quyết định thu hồi mới mà không nhận hay kiểm tra thông tin đó. OAuth mô tả các đánh đổi này trong [RFC 7009, mục 3](https://www.rfc-editor.org/rfc/rfc7009.html#section-3).

Trong thực tế, API có thể kiểm tra access token mà không tra phiên, trong khi bên cấp token vẫn quản lý refresh token ở máy chủ. Khi đăng xuất, hệ thống thu hồi refresh token để ngăn cấp thêm token; access token đã cấp vẫn cần hết hạn hoặc có cơ chế thu hồi riêng. Vì vậy, phải nói rõ thành phần và bước nào là stateless, thay vì gọi cả hệ thống là hoàn toàn không có trạng thái.

## 2. Cookie: trình duyệt giữ và gửi dữ liệu

### 2.1. Cookie có phải session không?

Không. **Cookie là cách mang dữ liệu; session là trạng thái mà hệ thống quản lý.** Cookie có thể chứa Session ID hoặc một gói dữ liệu khác phục vụ xác thực.

Máy chủ đặt cookie bằng `Set-Cookie`. Ở các yêu cầu phù hợp, trình duyệt tự gửi dữ liệu đó trong header `Cookie`.

```http
Set-Cookie: session=example-value; Secure; HttpOnly; SameSite=Lax
```

Đây chỉ là minh họa cấu trúc header, không phải cấu hình đủ cho mọi ứng dụng.

### 2.2. Các thuộc tính giúp gì?

| Thuộc tính | Giải thích |
|---|---|
| `Secure` | Giới hạn gửi cookie qua kết nối bảo mật theo quy tắc trình duyệt |
| `HttpOnly` | Không cho JavaScript đọc cookie qua API của trình duyệt |
| `SameSite` | Kiểm soát gửi cookie trong ngữ cảnh truy cập từ site khác |
| `Domain` và `Path` | Xác định phạm vi gửi cookie |
| `Max-Age` hoặc `Expires` | Xác định thời gian trình duyệt giữ cookie |

Thời gian trình duyệt giữ cookie không thay việc máy chủ kiểm tra hiệu lực. `Path` cũng không phải ranh giới bảo mật giữa các ứng dụng. Chi tiết các thuộc tính nằm trong [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

### 2.3. Cookie có thể chứa dữ liệu đăng nhập luôn không?

Có. Một số framework tạo **authentication ticket**, là gói thông tin danh tính và thời hạn được bảo vệ chống sửa đổi. Cookie chứa ticket thay vì chỉ chứa mã tra cứu phiên.

Máy chủ kiểm tra ticket rồi lấy danh tính, có thể không cần tra bản ghi phiên ở mỗi lần gọi. Vì vậy, muốn thu hồi ticket trước hạn thì phải có bước kiểm tra bổ sung phù hợp.

Trong ASP.NET Core, cookie handler xử lý ticket; có thể cấu hình kiểm tra lại trạng thái tài khoản hoặc dùng nơi lưu ticket. Các máy chủ cần quản lý khóa nhất quán nếu cùng kiểm tra ticket. [Microsoft Cookie Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0).

### 2.4. Vì sao có HttpOnly vẫn cần bảo vệ ứng dụng?

HttpOnly ngăn JavaScript đọc cookie, nhưng mã độc chạy trong trang vẫn có thể gửi yêu cầu bằng phiên đang mở. Đây là một phần rủi ro của **XSS**, tức mã độc được thực thi trong trang ứng dụng.

Trình duyệt tự gửi cookie cũng có thể bị lợi dụng để tạo hành động người dùng không chủ động cho phép. Đó là vấn đề **CSRF**. Cần cơ chế chống CSRF theo kiến trúc, không chỉ đặt thuộc tính cookie. [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## 3. JWT: token chứa thông tin có thể kiểm tra

### 3.1. JWT chứa gì?

JWT là định dạng token chứa các **claim**: thông tin bên phát hành khẳng định về chủ thể hoặc token.

Một token có thể mô tả:

| Thông tin | Claim thường dùng |
|---|---|
| Ai phát hành? | `iss` |
| Token đề cập tài khoản hoặc chủ thể nào? | `sub` |
| Dịch vụ nào được nhận? | `aud` |
| Đến khi nào thì hết hạn? | `exp` |

Mỗi loại token có quy tắc yêu cầu claim riêng. Không phải mọi JWT đều chứa đúng cùng một tập trường.

### 3.2. Chữ ký dùng để làm gì?

JWT được ký ở dạng phổ biến có ba phần:

```text
header.payload.signature
```

Header mô tả thông số xử lý. Payload chứa claim. Signature là chữ ký hoặc mã xác thực để phát hiện sửa đổi và kiểm tra token theo khóa được tin cậy.

**Đọc được payload chưa có nghĩa token hợp lệ.** JWT có chữ ký cũng không mặc nhiên che giấu nội dung; không đặt bí mật vào đó chỉ vì đã ký. JWT có thể có dạng mã hóa riêng, gọi là JWE. [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html).

### 3.3. API kiểm tra token thế nào?

1. API nhận token.
2. API dùng cấu hình đã xác định để kiểm tra chữ ký và khóa phù hợp.
3. API kiểm tra bên phát hành có được tin, token có dành cho mình và còn hạn không.
4. API kiểm tra các điều kiện bổ sung của loại token.
5. Nếu đạt, API lấy danh tính và tiếp tục kiểm tra quyền trên tài nguyên.

API không được tin một thuật toán hoặc địa chỉ tải khóa chỉ vì token tự khai báo. Token đúng chữ ký nhưng dành cho dịch vụ khác vẫn phải bị từ chối. [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html).

### 3.4. Máy chủ cần giữ khóa nào?

Với chữ ký bất đối xứng, bên cấp token giữ **khóa riêng để ký**. API có thể dùng **khóa công khai để kiểm tra**, không cần giữ khóa ký.

Với HMAC, bên tạo và bên kiểm tra dùng chung bí mật. Vì vậy, bên có bí mật kiểm tra cũng có thể tạo mã xác thực tương ứng.

Khi thay khóa, phải xác định API lấy khóa mới từ đâu và còn chấp nhận khóa cũ đến khi nào. Trường `kid` chỉ giúp nhận diện khóa; nó không tự khiến khóa trở nên đáng tin.

### 3.5. Khóa tài khoản có làm JWT cũ vô hiệu ngay không?

Không nếu API chỉ kiểm tra chữ ký và thời hạn. Token đã phát không tự thay nội dung khi tài khoản bị khóa.

Muốn chặn trước hạn, API cần kiểm tra thêm trạng thái thu hồi, phiên hoặc dữ liệu quyền hiện tại. Đây là đánh đổi quan trọng: giảm tra cứu giúp kiểm tra độc lập, nhưng muốn thu hồi nhanh thường cần thêm trạng thái.

### 3.6. Khi nào phù hợp?

JWT phù hợp khi cần một định dạng token để các dịch vụ kiểm tra theo quy tắc thống nhất. Nó không tự quy định đăng nhập, làm mới hay đăng xuất. Các việc đó thuộc giao thức và thiết kế sử dụng token.

## 4. Opaque token: API hỏi bên có thẩm quyền

### 4.1. Khác JWT ở đâu?

Với opaque token, client không dựa vào cấu trúc bên trong để hiểu danh tính hoặc quyền. Token có thể chỉ là một chuỗi tham chiếu; máy chủ có thẩm quyền biết cách kiểm tra nó.

### 4.2. API biết token còn hợp lệ thế nào?

Một cách là **token introspection**:

1. Client gửi token tới API.
2. API hỏi máy chủ cấp token về trạng thái token.
3. Máy chủ trả kết quả, gồm trạng thái hoạt động và thông tin liên quan.
4. API dùng kết quả để tiếp tục kiểm tra quyền.

Chức năng hỏi thông tin phải được bảo vệ. [RFC 7662](https://www.rfc-editor.org/rfc/rfc7662.html).

### 4.3. Lợi ích và chi phí

Trạng thái có thể được quản lý tập trung, nhưng API phụ thuộc nơi kiểm tra. Nếu lưu đệm kết quả để giảm số lần hỏi, việc thu hồi có thể chậm tới lúc bộ đệm cập nhật. Opaque token không mặc nhiên bị thu hồi nhanh hơn JWT.

## 5. Access token, refresh token và bearer token

### 5.1. Vì sao cần hai loại token?

**Access token** được gửi tới API để thực hiện quyền đã cấp. **Refresh token** được gửi tới máy chủ cấp token để xin access token mới.

```text
Client → API: access token
Client → Máy chủ cấp token: refresh token để xin token mới
```

Không gửi refresh token cho API thay access token. Access token hết hạn chưa chắc yêu cầu nhập lại mật khẩu nếu client còn được phép làm mới.

### 5.2. Bearer nghĩa là gì?

**Bearer có nghĩa là “người cầm giữ”. Với bearer token, người có token có thể gửi nó để sử dụng quyền mà token cho phép.**

Giả sử bạn đăng nhập thành công và nhận một access token. Khi gọi API, ứng dụng gửi token đó trong HTTP header:

```http
Authorization: Bearer <access_token>
```

`Authorization` là tên header; `Bearer` cho API biết cách nhận thông tin xác thực; phần sau là token thực tế.

API kiểm tra token còn hợp lệ, dành cho mình và đáp ứng yêu cầu truy cập hay không. Nếu đạt, API xử lý yêu cầu. Trong cách dùng bearer thông thường, API không yêu cầu người gọi cung cấp thêm một bằng chứng mật mã riêng để chứng minh mình là người đã được cấp token.

**Nếu attacker sao chép được token rồi gửi nó tới API, token có thể vẫn được chấp nhận.** API chỉ dựa vào token sẽ không phân biệt được người gửi là bạn hay attacker đang giữ bản sao. Các điều kiện khác như quyền, thời hạn và trạng thái thu hồi vẫn được kiểm tra theo thiết kế.

Vì vậy, phải giữ token bí mật, dùng HTTPS và tránh để token trong URL hoặc nhật ký. Bearer token có thể có định dạng JWT hoặc opaque: **bearer nói về cách sử dụng token, còn JWT nói về định dạng token.** [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html).

### 5.3. API thực sự xử lý `Bearer` thế nào?

Giả sử API đã được cấu hình hỗ trợ bearer token. Một yêu cầu có thể là:

```http
GET /api/profile HTTP/1.1
Host: api.example.com
Authorization: Bearer <access_token>
```

Các bước phía máy chủ:

1. Thành phần xác thực đọc header `Authorization`, nhận ra tên cơ chế `Bearer` và lấy chuỗi token phía sau.
2. Token được kiểm tra theo cấu hình. Nếu dùng JWT, thành phần kiểm tra chữ ký, bên phát hành, bên nhận, thời hạn và các điều kiện bắt buộc. Nếu dùng opaque token, nó có thể hỏi dịch vụ kiểm tra hoặc tra dữ liệu tương ứng.
3. Nếu token hợp lệ, hệ thống tạo kết quả danh tính cho yêu cầu, gồm thông tin chủ thể và quyền/claim theo thiết kế.
4. Thành phần phân quyền kiểm tra yêu cầu có được thực hiện hay không.
5. Nếu được phép, API mới thực hiện chức năng.

Với API được bảo vệ, thiếu hoặc có token không hợp lệ thường dẫn đến `401 Unauthorized`. Token được chấp nhận nhưng thiếu quyền cần thiết có thể dẫn đến `403 Forbidden`. RFC 6750 quy định phản hồi Bearer và các lỗi như `invalid_token`, `insufficient_scope`. [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html).

**Chữ `Bearer` không kiểm tra token thay máy chủ.** Backend phải có thành phần xử lý được cấu hình đúng. Nếu backend chỉ đọc token rồi tin dữ liệu mà không xác minh, đó là lỗi triển khai, không phải cách Bearer hoạt động.

### 5.4. Có phải mỗi lần gọi API đều tạo chữ ký mới?

Không trong cách dùng bearer thông thường. Client gửi lại access token còn hiệu lực ở nhiều yêu cầu. Nếu token là JWT có chữ ký, chữ ký đó do bên phát hành tạo khi cấp token. Client không cần ký riêng từng yêu cầu chỉ để sử dụng bearer token.

Đó là điểm cần phân biệt: chữ ký JWT giúp API kiểm tra **token**, không chứng minh người đang gửi token hôm nay là người đã nhận nó ban đầu. Attacker sao chép nguyên token cũng sao chép cả chữ ký hợp lệ đi kèm.

### 5.5. Những cách khác khác ở đâu?

Không phải mọi cách trong bảng đều là một giá trị thay trực tiếp vào chỗ `Bearer`; chúng là những cơ chế truy cập để đối chiếu.

| Cơ chế | Client gửi hoặc thực hiện gì? | Máy chủ kiểm tra gì? |
|---|---|---|
| HTTP Basic | Gửi tên tài khoản và mật khẩu được biểu diễn Base64 trong `Authorization: Basic ...` | Kiểm tra credential theo hệ thống tài khoản |
| Bearer | Gửi access token trong `Authorization: Bearer ...` | Kiểm tra token và quyền được cấp |
| Cookie chứa Session ID | Trình duyệt tự gửi cookie theo quy tắc | Tra phiên rồi kiểm tra quyền |
| API key | Gửi key theo quy ước API | Kiểm tra key, bên sở hữu, trạng thái và quyền |
| DPoP | Gửi token ràng buộc khóa và proof được ký cho yêu cầu theo giao thức | Kiểm tra token, bằng chứng giữ khóa và chống dùng lại proof |
| mTLS | Chứng minh kiểm soát khóa riêng của chứng chỉ trong TLS | Kiểm tra chứng chỉ và bằng chứng TLS; kiểm tra token nếu API cũng yêu cầu token |

Basic truyền cặp tài khoản/mật khẩu thay vì access token đã cấp. Base64 không mã hóa bí mật; Basic và Bearer đều cần đường truyền an toàn. [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617.html).

Cookie chứa Session ID và nhiều loại API key cũng có đặc tính “ai có bản sao thì có thể sử dụng” nếu không có bảo vệ bổ sung. Khác header hoặc cách lưu không tự giải quyết nguy cơ sao chép credential.

DPoP tạo khác biệt ở bằng chứng giữ khóa: chỉ có token chưa đủ, bên gọi còn phải tạo proof phù hợp. Khi gọi tài nguyên theo DPoP, giao thức dùng `Authorization: DPoP ...` cùng header proof riêng; không đơn giản đổi chữ Bearer bằng DPoP mà giữ nguyên cách kiểm tra. [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html).

mTLS có thể dùng độc lập để xác thực client. Với OAuth certificate-bound token, API còn kiểm tra token gắn với chứng chỉ của bên gọi, nên chỉ lấy token sẽ chưa đủ nếu không có khả năng sử dụng khóa tương ứng. [RFC 8705](https://www.rfc-editor.org/rfc/rfc8705.html).

### 5.6. Khi nào cân nhắc Bearer hoặc cơ chế có bằng chứng giữ khóa?

Bearer thuận tiện cho API vì client chỉ cần giữ và gửi token, còn API có thể dùng các thư viện tiêu chuẩn để kiểm tra. Đổi lại, thiết kế phải bảo vệ nơi giữ token, đường truyền, thời hạn và thu hồi.

Nếu cần giảm khả năng sử dụng token bị sao chép, có thể đánh giá DPoP hoặc token ràng buộc chứng chỉ. Chi phí là quản lý khóa và phối hợp hỗ trợ giữa client, bên cấp token và API. Không có cơ chế nào tự thay việc kiểm tra quyền tài nguyên.

### 5.7. Refresh token bị lấy có nguy hiểm không?

Có. Attacker có thể dùng nó xin thêm access token. Vì vậy, nhiều hệ thống áp dụng **refresh token rotation**: dùng token hiện tại để xin token mới, rồi token cũ bị vô hiệu hóa.

Máy chủ giữ quan hệ giữa các token để phát hiện token cũ xuất hiện lại. Phải xử lý nhiều yêu cầu cùng làm mới để không nhầm hoạt động hợp lệ thành đánh cắp. [OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html).

### 5.8. Thu hồi refresh có chặn access token không?

Không mặc nhiên. Thu hồi refresh ngăn việc xin thêm token; access token đã cấp phải được xử lý bằng thời hạn hoặc cơ chế thu hồi của API.

## 6. Ghép lại để tránh nhầm

| Tên | Nói về điều gì? |
|---|---|
| Session | Trạng thái truy cập được hệ thống quản lý |
| Cookie | Cách trình duyệt giữ và gửi dữ liệu |
| JWT | Một định dạng token |
| Access token | Token để gọi API |
| Refresh token | Token để xin token mới |
| Bearer token | Cách sử dụng token dựa trên việc đang giữ nó |

Các tên không loại trừ nhau: access token có thể vừa là JWT vừa được dùng theo kiểu bearer. Cookie có thể mang Session ID hoặc ticket tự chứa dữ liệu.

## Đọc tiếp

[OAuth, OIDC và SAML](03-oauth-oidc-saml.md): ai cấp quyền, ai xác thực và các hệ thống trao đổi kết quả bằng cách nào?
