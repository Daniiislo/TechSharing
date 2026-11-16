# 02. Sau đăng nhập, server nhận ra request tiếp theo bằng gì?

**Biên tập lại 16/11/2026 — đọc cùng slide 10–11, 14 và nhãn Stay Signed In ở slide đầu/cuối.** Đọc [chương 01](01-user-authentication.md) nếu cần ôn bằng chứng đăng nhập; chương này bắt đầu từ lúc bằng chứng đó đã được chấp nhận.

[Mục lục chuyên đề](auth-deep-dive.md) · [Học theo slide](auth-study-guide.md#slide-10)

## 1. Một request mới không tự nhớ lần login trước

Anna đăng nhập rồi bấm xem đơn hàng. Server nhận một HTTP request khác. Hệ thống cần credential để liên kết request này với danh tính/quyền đã được chấp nhận.

Hai ví dụ nền tảng:

~~~text
Cách A: Client gửi session ID → server tra phiên → nhận ra Anna
Cách B: Client gửi access token → API xác minh token → nhận ra chủ thể/quyền
~~~

Mỗi request được bảo vệ vẫn phải được xác thực theo cơ chế đang dùng, rồi kiểm tra quyền. Không phải chỉ có một lần authentication ở màn hình login và từ đó mọi request tự đáng tin.

## 2. Các tên này đang trả lời những câu hỏi khác nhau

| Tên | Nó nói về gì? | Không nên hiểu thành |
|---|---|---|
| Session | Trạng thái/ngữ cảnh truy cập được quản lý | Luôn là một DB row hoặc một kết nối TCP |
| Cookie | Cách browser lưu và gửi dữ liệu | Đồng nghĩa server-side session |
| Access token | Credential dùng cho quyền truy cập API | Luôn là JWT hoặc luôn do provider ngoài cấp |
| Refresh token | Credential để xin token mới tại token endpoint | Token gửi thay access token cho API |
| ID token | Kết quả xác thực OIDC dành cho client | Token đăng nhập được mọi API chấp nhận |
| JWT | Định dạng chứa claim theo chuẩn | Giao thức login hoặc tính chất chống copy |
| Bearer | Cách dùng dựa vào việc đang cầm token | Một định dạng khác, đối lập JWT |

Một access token có thể vừa là JWT vừa dùng kiểu bearer. Cookie có thể chứa ID tra phiên hoặc protected ticket. “Cookie hay JWT?” vì vậy thường là câu hỏi chưa xác định đúng tầng.

## 3. Server-side session: server giữ bản ghi, browser mang mã tra cứu

### 3.1. Lúc đăng nhập

1. Server xác thực bằng chứng và các điều kiện tài khoản.
2. Server tạo session ID khó đoán, lưu liên kết với user, thời hạn và trạng thái.
3. Server gửi session ID cho browser, thường trong Set-Cookie.
4. Browser giữ cookie theo các thuộc tính của nó.

### 3.2. Request sau đó

Browser gửi cookie theo phạm vi được phép. Server lấy ID, tìm phiên, kiểm tra trạng thái/thời hạn, tạo principal cho request rồi đánh giá quyền.

~~~text
Cookie: session=<ID ngẫu nhiên>
                       ↓
Session store: ID → Anna, còn hiệu lực, thông tin quản lý phù hợp
                       ↓
Principal → policy cho tài nguyên → nghiệp vụ
~~~

Session ID không cần chứa tên user hay quyền ở dạng đọc được. Nó cần đủ khó đoán và được bảo vệ như credential. Sau login/thay đổi mức quyền phải xử lý việc thay ID phù hợp để tránh session fixation — attacker biết trước ID mà người dùng tiếp tục sử dụng.

### 3.3. Đăng xuất và thu hồi

Xóa/vô hiệu hóa bản ghi là điều kiện để request cũ bị từ chối **nếu nơi xử lý tra đúng trạng thái mới**. Yêu cầu browser xóa cookie chỉ xử lý bản sao trên browser đó. Nhiều server, cache và kết nối đang mở có thể tạo độ trễ cần được thiết kế.

**Ưu:** dễ quản lý từng phiên và thu hồi ở nguồn tập trung. **Đánh đổi:** lưu/tra phiên, đồng bộ giữa instance và chính sách khi store lỗi. Có thể dùng DB/cache phù hợp; session không mặc nhiên bắt buộc một loại storage.

## 4. Cookie là phương tiện mang dữ liệu, không phải loại bằng chứng ban đầu

### 4.1. Server đặt, browser gửi

~~~http
Set-Cookie: session=example; Secure; HttpOnly; SameSite=Lax
~~~

Header này chỉ minh họa, không phải cấu hình đủ cho mọi deployment. Browser quyết định khi nào gửi cookie theo domain/path, site context, thời hạn và quy tắc nền tảng. Server vẫn tự kiểm tra credential, không tin chỉ vì browser còn gửi nó.

| Thuộc tính | Vai trò | Giới hạn |
|---|---|---|
| Secure | Giới hạn gửi theo kết nối bảo mật | Không thay HTTPS và bảo vệ endpoint toàn hệ thống |
| HttpOnly | Hạn chế JavaScript đọc cookie | XSS vẫn có thể thực hiện hành động bằng phiên |
| SameSite | Điều khiển gửi cookie trong ngữ cảnh cross-site | Không thay mọi kiểm soát CSRF |
| Domain, Path | Xác định phạm vi cookie | Path không phải ranh giới bảo mật giữa các app |
| Expires, Max-Age | Thời gian browser giữ cookie | Không thay server-side expiry/revocation |

Same-origin và same-site không phải cùng một khái niệm. Khi web/API khác origin, phải xét cookie/CORS/CSRF theo deployment cụ thể; không suy ngay “khác domain thì phải JWT”.

### 4.2. Cookie có thể mang protected ticket

Một framework có thể đóng gói danh tính và thời hạn thành authentication ticket được bảo vệ chống sửa đổi; cookie mang ticket thay vì ID tra session. Server giải bảo vệ/xác minh ticket rồi lấy principal, có thể không cần tra session DB mỗi request.

Trong ASP.NET Core, cookie authentication và Session middleware không phải một chức năng. Cookie handler xử lý authentication ticket; Session middleware có mục tiêu lưu trạng thái ứng dụng. Đừng thấy cả hai có cookie rồi coi chúng là một.

Muốn thu hồi protected ticket trước hạn, cần cơ chế trạng thái/phiên bản/kiểm tra lại/ticket store phù hợp. Security stamp cũng chỉ có hiệu lực theo nơi và chu kỳ kiểm tra. Nhiều instance phải quản lý Data Protection keys và cấu hình chia sẻ theo thiết kế.

### 4.3. XSS khác CSRF

XSS là mã độc chạy trong trang/ngữ cảnh ứng dụng. CSRF lợi dụng việc browser tự mang credential để tạo hành động người dùng không chủ động cho phép. HttpOnly ngăn đọc cookie, không ngăn mọi hành động của XSS. SameSite hỗ trợ hạn chế một số CSRF, không có nghĩa mọi flow đã được bảo vệ.

Token trong localStorage có thể bị JavaScript cùng origin đọc; giữ token trong memory giảm lưu lâu nhưng không giải quyết client đã bị mã độc kiểm soát. Không chọn nơi lưu chỉ theo slogan “cookie an toàn” hay “JWT an toàn”.

Nguồn: [Cookie authentication — ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0), [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## 5. Access token do ai cấp? “API token” nghĩa là gì?

Khi nói credential để gọi API, chương này dùng **access token** thay nhãn chung “API token”. Nó có thể do:

- Backend của hệ thống trong vai trò phát hành token.
- Authorization server thuộc nền tảng danh tính mà API đã cấu hình tin cậy.

BE là thành phần triển khai; issuer là vai trò/định danh phát hành. Một backend có thể chính là nơi triển khai authorization server; provider thường cũng đảm nhiệm nhiều vai trò. Không mặc định hai khái niệm này luôn tương ứng hai máy hoặc hai nhà cung cấp khác nhau.

### 5.1. API tin nguồn nào?

API phải biết issuer nào được tin, token dành cho audience nào, cơ chế xác minh và quyền. Token hợp lệ để gọi Google Calendar hay Microsoft Graph không tự hợp lệ cho Order API của mình.

JWT chỉ là định dạng. Cả backend tự quản lý lẫn nền tảng danh tính đều có thể phát token dạng JWT nếu thiết kế hỗ trợ; access token cũng có thể opaque. Đừng suy nguồn token từ hình dạng chuỗi.

Nếu app nhận kết quả OIDC rồi phát token nội bộ, đó là một bước thiết lập trust và ánh xạ danh tính phải bảo vệ rõ. Không decode token ngoài rồi ký lại tùy ý như thể đã xác minh.

### 5.2. Ba mục đích không dùng lẫn

~~~text
ID token      → client kiểm tra kết quả login OIDC
Access token  → resource API xử lý quyền truy cập
Refresh token → token endpoint xem có được cấp token mới không
~~~

API không dùng ID token thay access token. Access token hết hạn không mặc nhiên buộc nhập lại password nếu còn cơ chế refresh được phép. Chi tiết cấp quyền và login ở [chương 03](03-oauth-oidc-saml.md).

## 6. JWT: đọc được khác với xác minh được

### 6.1. Nội dung và chữ ký

JWT mang claim theo profile sử dụng. Một JWT ký dạng phổ biến có header.payload.signature; header mô tả thông số, payload chứa claim, signature/MAC phục vụ kiểm tra theo thuật toán và khóa được tin.

| Claim thường gặp | Ý nghĩa |
|---|---|
| iss | Bên phát hành |
| sub | Chủ thể được đề cập |
| aud | Bên nhận token |
| exp | Hết hạn |
| jti | Định danh token nếu issuer/profile có sử dụng |

Không phải mọi JWT có tất cả các claim này. Decode Base64url không xác minh chữ ký hay nguồn tin cậy. JWT ký không tự che giấu payload; JWE là cơ chế mã hóa khác. Không đặt secret vào payload chỉ vì token được ký.

### 6.2. Bên nào giữ khóa?

Với chữ ký bất đối xứng, issuer giữ private key ký; API giữ public key được tin để kiểm tra. Với HMAC, bên phát và bên kiểm tra giữ cùng secret; bên có secret verify cũng có thể tạo MAC hợp lệ. Không gọi HMAC là một cặp public/private key.

API không tin algorithm/key URL chỉ vì token tự khai. kid giúp chọn khóa trong tập được quản lý, không tự làm khóa đáng tin. Rotation cần kế hoạch cập nhật và khoảng chấp nhận khóa cũ.

### 6.3. API xác minh gì?

Xác minh cấu trúc/profile được phép, thuật toán/khóa theo cấu hình, issuer, audience, thời gian và điều kiện bắt buộc. Sau đó mới dùng claim để tạo principal và kiểm tra quyền trên tài nguyên. Chữ ký đúng nhưng audience khác vẫn phải bị từ chối.

Khóa tài khoản hay đổi role trong DB không tự sửa claim đã phát. Nếu API chỉ kiểm tra token tại chỗ, token có thể còn được chấp nhận tới hạn. Cần trạng thái hoặc enforcement bổ sung để biết thay đổi mới.

Nguồn: [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html), [JWT BCP — RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html).

## 7. Opaque token và chữ “stateless”

Opaque token thường được xử lý như chuỗi tham chiếu; client không dựa vào cấu trúc của nó để hiểu danh tính/quyền. API có thể tra store hoặc gọi introspection tới nơi có thẩm quyền. Không phải cứ opaque là mọi request bắt buộc gọi một endpoint mạng; đó là lựa chọn triển khai.

Introspection hỏi token có active và metadata liên quan hay không. Endpoint phải được bảo vệ. Cache kết quả có thể tạo độ trễ thu hồi. JWT cũng có thể được kiểm tra trạng thái/introspection nếu hệ thống hỗ trợ, nên đừng phân loại JWT = không bao giờ tra, opaque = luôn thu hồi tức thì.

**Stateless phải gắn với thành phần và bước cụ thể.** API có thể xác minh JWT không cần session lookup nhưng vẫn đọc DB nghiệp vụ/quyền/denylist. Issuer vẫn có thể quản lý account, consent, phiên và refresh token. Không thể chỉ tin JWT chưa hết hạn mà tự biết quyết định khóa user vừa xảy ra nếu không nhận/kiểm tra thông tin mới.

Nguồn: [Token Introspection — RFC 7662](https://www.rfc-editor.org/rfc/rfc7662.html).

## 8. Bearer: ai cầm bản sao có thể trình nó

### 8.1. Header Bearer làm gì?

~~~http
GET /api/orders/42 HTTP/1.1
Authorization: Bearer <access_token>
~~~

Handler nhận scheme Bearer, lấy token, xác minh theo cấu hình rồi tạo danh tính nếu hợp lệ. Chữ Bearer không tự kiểm tra token thay backend. API vẫn phải được cấu hình bảo vệ endpoint và kiểm tra quyền.

### 8.2. Chữ ký JWT có chống copy không?

Không. Anna gửi token A và attacker gửi nguyên token A đều có thể trình cùng chữ ký hợp lệ. Chữ ký ngăn sửa/tự tạo token không có khóa, không chứng minh ai đang giữ bản sao của bearer token.

~~~text
Sửa payload nhưng giữ chữ ký → kiểm tra chữ ký thất bại
Copy nguyên token còn được chấp nhận → chữ ký vẫn có thể hợp lệ
~~~

Đây là điểm khác phản hồi passkey gắn challenge mới. Client dùng bearer thông thường không tạo chữ ký mới cho từng API request; chữ ký token do issuer tạo khi cấp.

Session ID cookie và API key bí mật cũng có thể mang đặc tính người cầm bản sao có thể sử dụng. Đổi header thành cookie không tự giải quyết replay.

### 8.3. Có cách yêu cầu thêm bằng chứng giữ khóa không?

Có, chẳng hạn DPoP hoặc certificate-bound token qua mTLS khi toàn chuỗi hỗ trợ. API kiểm tra cả token và bằng chứng/ràng buộc khóa. Token bị lấy mà không dùng được khóa có thể không đủ để truy cập. Nếu attacker kiểm soát client và gọi được ký, không hứa chặn mọi hành vi.

Bảo vệ truyền tải và nơi lưu, không log token, quyền hẹp, thời hạn và thu hồi vẫn cần. Xem [chương 04](04-machine-authentication.md).

Nguồn: [Bearer — RFC 6750](https://www.rfc-editor.org/rfc/rfc6750.html), [DPoP — RFC 9449](https://www.rfc-editor.org/rfc/rfc9449.html), [OAuth mTLS — RFC 8705](https://www.rfc-editor.org/rfc/rfc8705.html).

## 9. Refresh, logout và revoke: ba việc không được gộp thành một

Refresh token cho phép client xin token mới theo quyền còn được phép. Rotation thay refresh token sau sử dụng và quản lý quan hệ giữa các token. Reuse token cũ là tín hiệu cần xử lý; retry/race cũng phải được tính tới, không tự biết ai là attacker chỉ từ reuse.

| Việc xảy ra | Điều chắc chắn phải xác định riêng |
|---|---|
| Client xóa cookie/token | Server có vô hiệu hóa credential cũ hay chỉ client ngừng gửi? |
| Thu hồi session | Những nơi xử lý nào tra trạng thái và cache có trễ không? |
| Thu hồi refresh token | Access token đã cấp còn được API chấp nhận không? |
| Đổi password/khóa user | Validator có biết trạng thái mới không? |
| Token tới hạn | Clock skew và kết nối đang mở được xử lý thế nào? |

Denylist, session/version check, introspection hay các cơ chế khác chỉ có tác dụng tại nơi thực sự kiểm tra. Entry denylist phải tồn tại đến khi token không còn được chấp nhận, kể cả khoảng clock skew nếu có. Lifetime ngắn giảm cửa sổ rủi ro, không phải thu hồi trước hạn.

Với SignalR/WebSocket, mỗi message không mặc nhiên chạy lại HTTP authentication. Cần kiểm tra tại thao tác phù hợp hoặc chủ động ngắt kết nối theo thiết kế. Không chỉ gửi lệnh client tự logout. Đọc sâu [slide 14](auth-study-guide.md#slide-14).

Nguồn: [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009.html), [OAuth Security BCP — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), [SignalR auth](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-10.0).

## 10. Tự kiểm tra bằng cách giải thích một request

Nói rõ client mang gì, ai cấp, API tin ai, API kiểm tra gì và quyền tài nguyên ở đâu. Sau đó giả sử credential bị copy hoặc user vừa bị khóa: điều kiện nào đổi và validator biết bằng cách nào?

Nếu vẫn trả lời “vì dùng JWT” hoặc “vì có HttpOnly” cho mọi câu hỏi, cần quay lại đúng tầng khái niệm. Đọc tiếp [03 — Login với provider và cấp quyền API](03-oauth-oidc-saml.md).
