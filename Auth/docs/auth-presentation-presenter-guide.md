# Auth — Beyond the Login Screen: Presenter Guide

**Phiên bản:** 10/11/2026. **Người trình bày:** Tavian Nguyen.

Slide tiếng Anh, trình bày tiếng Việt. Phần chính gồm 17 slide, dự toán 43 phút gồm 5 phút demo và khoảng 3.5 phút Q&A. Lời dẫn dưới đây là bản luyện nói; khoảng dừng để chỉ hình và trao đổi ngắn nằm trong thời lượng mỗi trang. Chưa rehearsal nên đây chưa phải thời lượng đã đo.

**Phạm vi demo:** kịch bản chuẩn bị cho BidLab, chưa phải chức năng Auth đã triển khai. Deck không tuyên bố mô hình minh họa là kiến trúc thật của eBay hay TravelPledgeAuctions.

## 01. Beyond the Login Screen — 1.5 phút

Anna vừa đăng nhập thành công. Đến đây mình có thể nghĩ phần auth đã xong: tài khoản đúng, mật khẩu đúng, màn hình bid đã mở.

Nhưng khi Anna bấm Place Bid, một request mới đi lên server. Server biết request này vẫn thuộc Anna bằng cách nào? Nếu Anna thay mã auction trong request thì cô ấy có quyền bid ở auction khác không? Nếu một người giữ bản sao phiên đăng nhập của Anna, server có phân biệt được không? Và sau khi mình khóa tài khoản, kết nối đang mở có còn nhận lệnh bid không?

Đây là những việc phía sau màn hình login mà hôm nay mình muốn lần theo. Mình sẽ dùng cùng một người dùng và một hành động bid để nối các phần lại, thay vì học từng tên công nghệ rời rạc.

**Chỉ hình:** Đi từ trái sang phải: xác thực Anna, duy trì danh tính qua các request, kiểm tra quyền đặt giá, rồi thu hồi quyền truy cập khi cần. Mũi tên nét đứt đánh dấu bước thu hồi có điều kiện.

**Chuyển:** Từ luồng này, mình sẽ đi qua những chủ đề nào trong buổi hôm nay?

## 02. Agenda — 0.5 phút

Mình sẽ đi từ đăng nhập qua phiên và phân quyền đến thu hồi. Cuối buổi mình so sánh các cách thiết kế rồi áp dụng một lựa chọn vào BidLab.

**Chuyển:** Trước khi đi vào chi tiết, nhìn qua bản đồ của phần Authentication.

## 03. Authentication Overview — 1 phút

Nhìn từ trên xuống. Bên trái là đăng nhập trực tiếp với ứng dụng. Nhắc đến mã OTP quen thuộc: server tạo mã rồi gửi qua SMS hoặc email. Sau đó mình sẽ xem cách ứng dụng xác thực tự tạo mã TOTP, rồi đến passkey. Bên phải là đăng nhập qua một nhà cung cấp danh tính. OIDC và SAML 2.0 cho ứng dụng biết ai đã đăng nhập qua nhà cung cấp danh tính. OAuth là cơ chế cấp quyền truy cập API, sẽ giải thích riêng; PKCE là cơ chế bảo vệ bước đổi code, không phải phương thức đăng nhập.

**Chuyển:** Bắt đầu bên trái, với những loại bằng chứng mà người dùng có thể đưa ra.

## 04. Three Types of Authentication Factors — 2 phút

**Chỉ hình:** Mật khẩu, PIN và cụm mật khẩu đều là điều mình biết. Khóa bảo mật, thiết bị có ứng dụng OTP đã đăng ký và thẻ thông minh là thứ mình có. Vân tay, khuôn mặt và mống mắt là các đặc điểm sinh trắc. Sau khi chỉ cả ba hình, dùng ví dụ password + TOTP để giải thích cách kết hợp hai loại yếu tố.

MFA nghĩa là Multi-Factor Authentication: kết hợp ít nhất hai loại yếu tố. Cả ứng dụng lẫn nhà cung cấp danh tính đều có thể yêu cầu MFA. Những nhóm thường gặp là điều bạn biết, thứ bạn có, và đặc điểm sinh trắc học của bạn. 2FA là trường hợp dùng hai yếu tố. Số màn hình và số lần bấm không quyết định số yếu tố: hai mật khẩu vẫn thuộc cùng loại.

Với password cộng TOTP, mình yêu cầu bí mật đã nhớ và quyền sử dụng authenticator đã đăng ký. Tuy nhiên, từng yếu tố phải được triển khai và bảo vệ đúng. Không mặc định email OTP độc lập nếu chính hộp thư cũng bị chiếm cùng tài khoản. Với passkey, việc thiết bị kiểm tra PIN hoặc sinh trắc học có vai trò khác nhập password cho server; khả năng đáp ứng MFA còn phụ thuộc user verification và chính sách.

eBay công khai hỗ trợ passkey và các lựa chọn xác thực hai bước. Đây là ví dụ một dịch vụ có thể đưa ra nhiều cách xác thực, không có nghĩa các lựa chọn có cùng cơ chế bên trong. [S5][S7]

**Chuyển:** Bỏ qua password quen thuộc, bắt đầu từ cơ chế mà app và server tự tính cùng một mã.

## 05. TOTP: Your Authenticator Works Offline — 2 phút

Khi đăng ký, app xác thực và server đã có cùng khóa bí mật dành cho tài khoản. Sau đó, dù điện thoại ở chế độ máy bay, app vẫn dùng khóa đã lưu và đồng hồ của máy để tính mã. Server dùng khóa của tài khoản và đồng hồ của mình để tính mã dự kiến. Nếu hai bên cùng khoảng thời gian, thường là 30 giây, chúng tính ra cùng mã. [S2]

**Chỉ hình:** Chỉ hai ô mã giống nhau, rồi chỉ các mốc 0, 30 và 60 giây để cho thấy cả hai bên cùng chuyển sang bước thời gian mới. App tạo mã offline. Khi Anna nhập mã vào trang đăng nhập, request vẫn phải tới server. Mã khớp là bằng chứng rằng người nhập có quyền dùng app xác thực đã đăng ký, nên có thể dùng cùng mật khẩu làm yếu tố thứ hai.

Với SMS/email, server thường tạo mã rồi gửi cho người dùng. TOTP không cần bước gửi mã từ server tới app. Hai loại mã nhập tay đều có thể bị lừa lấy và sử dụng trước khi hết hạn. [S2][S6]

**Chuyển:** Tiếp theo là passkey, nơi thiết bị ký thử thách để chứng minh quyền sử dụng khóa.

## 06. Passkeys: Register and Sign In — 4 phút

**Mở đầu:** “Hai hàng là hai lần khác nhau. Hàng trên mình thêm passkey. Hàng dưới mình dùng passkey đã thêm để đăng nhập.”

**Hàng trên — Đăng ký một lần.** Anna đã được xác minh và chọn **Add a passkey**. Chỉ mũi tên **Start registration**: browser gọi backend để bắt đầu. Backend kiểm tra phiên và quyền thêm passkey, rồi trả options cùng challenge. Browser gọi WebAuthn để làm việc với authenticator. Chỉ ô bên phải: Anna xác nhận trên thiết bị, rồi authenticator tạo một cặp khóa cho dịch vụ. Khi nhận kết quả từ authenticator, browser gửi phản hồi đăng ký về backend theo mũi tên **Submit registration**. Sau khi kiểm tra phản hồi, server lưu credential ID và public key gắn với tài khoản Anna. Authenticator hoặc trình quản lý passkey bảo vệ private key.

**Hàng dưới — Đăng nhập sau đó.** Anna chọn **Use your passkey**. Browser gọi backend theo mũi tên **Start sign-in** để lấy options và một challenge mới. Chỉ ô bên phải: authenticator kiểm tra PIN hoặc sinh trắc học của Anna, rồi dùng private key đã có để ký dữ liệu chứa challenge mới. Browser nhận phản hồi đã ký rồi gửi tới backend theo mũi tên **Submit signed response**. Server tìm public key đã lưu, kiểm tra challenge, origin/RP và chữ ký. Nếu các kiểm tra đạt, ứng dụng tạo phiên cho Anna.

**Câu chốt:** “Lúc đăng ký, server lưu public key. Lúc đăng nhập, server dùng đúng public key đó để kiểm tra chữ ký mới.” PIN hoặc sinh trắc học chỉ dùng để xác minh cục bộ. Trình duyệt chuyển thông điệp và phản hồi giữa hai phía. [S3][S5]

**Nếu cần chi tiết:** browser gọi `navigator.credentials.create()` khi đăng ký và `navigator.credentials.get()` khi xác thực. Kiểm tra quyền thêm passkey vào tài khoản và bảo vệ quá trình khôi phục.

**Chuyển:** Tiếp theo là trường hợp một nhà cung cấp danh tính thực hiện bước xác thực và trả kết quả cho ứng dụng.

## 07. OIDC: Sign In with an Identity Provider — 2 phút

OIDC được nhiều nhà cung cấp hỗ trợ, ví dụ Google, Microsoft Entra ID, Okta và Keycloak. Anna muốn đăng nhập vào app bằng tài khoản tại nhà cung cấp danh tính mà app tin cậy. App chuyển Anna sang nhà cung cấp danh tính với scope openid. Sau khi nhà cung cấp danh tính xác thực Anna, trình duyệt quay về app với code. App đổi code lấy token, kiểm tra ID token bằng thư viện chuẩn để xác định Anna. Sau đó chính app tạo session đăng nhập riêng. OIDC cung cấp kết quả xác thực; app quản lý phiên của mình. Không dùng ID token để gọi Google Calendar API.

**Chỉ hình:** nhà cung cấp danh tính xác nhận danh tính, rồi chỉ dòng cuối app tạo session.

## 08. OAuth 2.0: Grant Access to an API — 2 phút

Đây là nhu cầu khác: app muốn đọc lịch Google của Anna. Anna cấp quyền; Google phát access token; app gửi token khi gọi Google Calendar API. Token có thể cho phép đọc dữ liệu, gửi email hoặc thao tác khác tùy scope. OAuth chuẩn hóa việc cấp quyền truy cập tài nguyên, không tự định nghĩa đăng nhập. Có thể lấy profile qua API, nhưng lấy được profile chưa đủ để kết luận đã triển khai login an toàn; cần giao thức hoặc quy tắc xác minh danh tính của nhà cung cấp. OIDC chuẩn hóa việc xác thực danh tính trên nền OAuth. Nếu chỉ Login with Google, không cần xin quyền đọc lịch.

**Chỉ hình:** Theo access token từ Google đến app rồi Google Calendar API.

**Chuyển:** Sau khi xác thực thành công, app duy trì đăng nhập ra sao?

## 09. Service-to-Service Authentication — 2 phút

Order Service gọi Payment Service bằng danh tính của chính nó, không phải người dùng đăng nhập. Có bốn nhóm bằng chứng: shared secret (API key hoặc Basic Auth); access token; client certificate qua mTLS; chữ ký trên request bằng HMAC hoặc khóa bất đối xứng. Các cơ chế có thể kết hợp, không phải những lựa chọn loại trừ nhau.

API key chỉ xác thực service nếu là bí mật được ánh xạ riêng đến service; có sản phẩm dùng API key chỉ để đo quota/billing. Basic là encoding credential, không phải mã hóa; dùng HTTPS. Với Client Credentials, service xác thực ở token endpoint bằng client secret, private_key_jwt hoặc mTLS để nhận access token, rồi gửi token cho API. Đây là luồng cấp token; JWT assertion là bằng chứng xin token, khác JWT access token. Token hết hạn thì service thường xác thực và xin token mới; không cần refresh token theo luồng chuẩn.

mTLS chứng minh giữ private key tương ứng certificate đáng tin cậy; vẫn cần ánh xạ danh tính và kiểm tra quyền. Request signing bảo vệ các thành phần đã ký; cần canonicalization và chống replay phù hợp. Workload identity như Managed Identity hoặc SPIFFE/SPIRE tự động cấp/quản lý token hay certificate, không phải phương thức song song độc lập với bốn hàng. Không chọn giải pháp chỉ theo số service.

**Chỉ hình:** Đi qua bốn hàng, kết bằng AuthN xác định service nào đang gọi, AuthZ quyết định service đó được làm gì. Service thay mặt người dùng là phạm vi khác, cần bảo toàn quyền người dùng.

**Nguồn:** RFC 6749 §4.4 https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4 ; RFC 8705 https://www.rfc-editor.org/rfc/rfc8705.html ; RFC 9421 https://www.rfc-editor.org/rfc/rfc9421.html ; SPIFFE https://spiffe.io/docs/latest/spiffe/concepts/ .

## 10. Sessions and Cookies — 1.5 phút

**Chỉ hình:** Theo cookie từ lần đăng nhập tới request tiếp theo. Ví dụ dùng session ID phía server; ticket và bearer token giải thích bằng lời.

HTTP request mới không tự chứa ký ức về lần login trước. Trong ví dụ session phía server, server tạo một mã ngẫu nhiên, lưu quan hệ với Anna và đặt cookie chứa session ID trên browser. Request tiếp theo browser gửi cookie; server tra phiên rồi kiểm tra trạng thái, thời hạn và quyền.

Session là khái niệm quản lý truy cập; cookie là cách browser lưu và gửi dữ liệu. Cookie cũng có thể chứa một ticket được bảo vệ thay vì chỉ session ID, nên không nói mọi cookie đều có bản ghi session để tra.

Trong kiến trúc dùng access token, client gửi token cho API. Hai cách có những lựa chọn kiểm tra và thu hồi khác nhau. HttpOnly hạn chế JavaScript đọc cookie, nhưng mã độc đang chạy trong trang vẫn có thể gửi request bằng phiên. Cookie tự động gửi cũng đòi hỏi bảo vệ CSRF phù hợp. [S8]

**Chuyển:** Vậy chữ ký token hợp lệ đã đủ chứng minh người đang gửi là Anna chưa?

## 11. Bearer Tokens — 1.5 phút

**Chỉ hình:** Chỉ hai token giống nhau. Chữ ký cho phép API xác minh token, nhưng không cho biết thiết bị nào đang giữ bản sao.

JWT là một cách biểu diễn token. Bearer mô tả cách sử dụng: bên giữ credential có thể trình nó để truy cập, nếu các điều kiện kiểm tra khác vẫn đạt. JWT và bearer không phải hai lựa chọn đối lập; một access token dạng JWT có thể được dùng theo kiểu bearer.

Nếu Anna và một client lab giữ cùng token hoặc session cookie, server có thể nhận những request với cùng danh tính. Chữ ký hợp lệ cho biết dữ liệu qua được kiểm tra theo khóa và thuật toán tin cậy; nó không chứng minh máy đang gửi là máy của Anna. Cũng không nên mô tả JWT luôn mã hóa nội dung.

Passkey bảo vệ lần xác thực nhưng sau đó ứng dụng vẫn có thể cấp bearer credential. Đây là lý do login mạnh cần đi cùng bảo vệ phiên và cách thu hồi. [S8][S9]

**Chuyển:** Server đã nhận diện được request. Giờ cần quyết định người dùng có quyền thực hiện hành động đó không.

## 12. Common Authorization Models — 1.5 phút

**Chỉ hình:** Đọc từ tên ở cột trái sang cách ra quyết định ở cột phải.

- **RBAC:** Xem người dùng có role nào, rồi tra các quyền gắn với role đó.
- **ABAC:** Đưa thuộc tính của người dùng, tài nguyên, hành động hoặc ngữ cảnh vào một quy tắc để quyết định cho phép hay từ chối.
- **ReBAC:** Tìm quan hệ giữa người dùng và tài nguyên, rồi áp dụng quyền dành cho quan hệ đó.
- **ACL:** Tra người dùng hoặc nhóm trong danh sách gắn với tài nguyên và kiểm tra họ được làm gì.

Một policy của ứng dụng có thể kết hợp các cách này. [S15][S23][S24][S25]

**Chuyển:** Ở trang sau, xem một policy dùng nhiều điều kiện để quyết định Anna có được đặt giá không.

## 13. Custom Authentication: Why and How? — 2 phút

Cần custom khi ứng dụng muốn thay đổi cấu hình, bổ sung xử lý trong luồng đăng nhập hoặc xác minh credential mà scheme có sẵn chưa hỗ trợ. Đọc ba hàng theo mức độ can thiệp.

Configure: thay đổi issuer, audience, provider hoặc thời hạn cookie trong scheme có sẵn. Add a hook: đăng ký đoạn code chạy ở một điểm thư viện cung cấp, ví dụ sau khi token được xác minh hoặc khi xác thực thất bại; dùng để bổ sung kiểm tra hay xử lý kết quả theo yêu cầu ứng dụng. Hook không tự thay thế việc kiểm tra chữ ký và giao thức của thư viện. Custom handler: dùng khi có loại credential riêng, cần tự định nghĩa cách đọc, xác minh và tạo principal, ví dụ credential từ hệ thống cũ.

**Chỉ hình:** Mỗi hàng là một lựa chọn, không phải ba bước bắt buộc. Ưu tiên cấu hình, sau đó hooks; chỉ viết handler khi cần hỗ trợ credential riêng. Quyền thực hiện hành động thuộc authorization.

**Chuyển:** Khi cần chấm dứt truy cập, mình thu hồi session và token như thế nào?

## 14. Revoking Sessions & Tokens — 2 phút

Slide này chọn một cách thu hồi cụ thể cho mỗi loại credential. Session minh họa phiên có store: xóa hoặc vô hiệu hóa session trong kho lưu trữ; request tiếp theo tra session sẽ bị từ chối. Không áp dụng máy móc cho cookie chứa ticket tự xác minh, vốn cần cơ chế kiểm tra trạng thái riêng.

Access token: đưa định danh token vào blacklist/denylist, chẳng hạn jti của JWT khi hệ thống phát hành hỗ trợ định danh duy nhất. Giữ bản ghi đến lúc token hết hạn. API phải kiểm tra denylist khi nhận request, ngoài chữ ký, issuer, audience và thời hạn. Nếu chỉ kiểm tra JWT cục bộ mà không kiểm tra trạng thái, token vẫn có thể dùng đến khi hết hạn. Cache và đồng bộ giữa các API ảnh hưởng độ trễ thu hồi.

Refresh token: server lưu trạng thái token (thường bằng hash thay vì token thô). Đánh dấu token revoked hoặc thu hồi cả token family khi cần. Token endpoint kiểm tra trạng thái này và từ chối refresh tiếp theo. Thu hồi cả family giúp vô hiệu hóa các token thay thế đã cấp trong cùng chuỗi rotation. Nếu provider bên ngoài phát token thì dùng endpoint/cơ chế revocation mà provider hỗ trợ; app không thể chỉ sửa database nội bộ để thu hồi token của provider.

**Chỉ hình:** Xóa session; blacklist access token; đánh dấu refresh token đã thu hồi. Kết bằng dòng cuối: thu hồi refresh token chỉ chặn việc cấp token mới, access token đã cấp cần thu hồi riêng hoặc chờ hết hạn.

**Chuyển:** Chọn kiến trúc theo nơi lưu credential và yêu cầu thu hồi của ứng dụng.

## 15. Four Project Setups and When to Use Them — 3 phút

**Chỉ hình:** Đi theo loại dự án người nghe đang làm, rồi đọc phương án và lý do tương ứng. Kết bằng câu hỏi về thu hồi tức thời để dẫn sang BidLab.

Với web app cùng origin, cookie đăng nhập là điểm xuất phát hợp lý vì trình duyệt chỉ cần duy trì phiên với backend của app. Nếu cần thu hồi từng phiên ngay, có thể để cookie mang ID và tra trạng thái phiên phía server. [S8]

Với web app nội bộ cần SSO, dùng OIDC để nhận danh tính từ IdP công ty, sau đó tạo phiên riêng cho app. App vẫn thực thi quyền nghiệp vụ. [S4][S22]

Với SPA có backend riêng gọi API, BFF giữ access token ở server và trình duyệt dùng cookie phiên. Đổi lại, đội dự án vận hành thêm backend và bảo vệ phiên. Với mobile gọi API, dùng browser hệ thống cho OIDC Authorization Code + PKCE rồi gửi access token tới API. [S9][S13][S14]

Hỏi cả phòng: nếu khóa tài khoản Anna lúc này, request đặt giá tiếp theo có phải bị chặn ngay không? Với BidLab, giả sử có yêu cầu đó. Chọn cookie chứa ID phiên, tra trạng thái ở backend và kiểm tra quyền trên auction. Với kết nối SignalR đang mở, cần kiểm tra lại trước lệnh nhạy cảm hoặc ngắt kết nối theo chính sách. [S8][S21]

**Chuyển:** Dùng các quyết định này để lần theo lượt bid của Anna trong kịch bản BidLab.

## 16. Three Outcomes in BidLab — 5 phút

**Chỉ hình:** Đi qua ba kết quả dự kiến. Đây là kịch bản minh họa, có thể trình bày sơ đồ khi chưa có lab chạy được.

**Trạng thái hiện tại:** kịch bản này là đặc tả cho lab; chưa có bản demo Auth chạy được đi kèm deck. Có thể trình bày sơ đồ tại trang này nếu chưa triển khai. Không giới thiệu là live demo sẵn sàng.

Khi triển khai kịch bản này, dùng cookie chứa ID phiên, tra trạng thái ở backend và dùng tài khoản lab. Không thêm refresh-token rotation vào lab session-cookie chỉ để mô phỏng mọi khái niệm.

| Thời gian | Thao tác người trình bày | Điều cần nhìn thấy |
|---|---|---|
| 0:00–1:00 | Anna xác thực và bid auction được phép | Server nhận dạng Anna, policy cho phép, bid thành công |
| 1:00–2:00 | Đổi auction ID/gọi request trực tiếp ngoài phạm vi | Server từ chối dù client tự gửi request |
| 2:00–3:00 | Client lab B trình cùng credential với Anna | Trước revoke, hai client có thể mang cùng danh tính |
| 3:00–4:15 | Thu hồi phiên ở server, gửi lại request cũ | Credential cũ bị từ chối theo policy; không chỉ đổi UI |
| 4:15–5:00 | Thử lệnh nhạy cảm qua kết nối đang mở và reconnect | Lệnh/phiên cũ không vượt kiểm tra; nêu rõ cơ chế thực thi |

Nếu cookie HttpOnly được dùng, harness lab cấp bản sao có kiểm soát; không dùng JavaScript đọc cookie rồi giả vờ đó là khả năng bình thường của trang. Hiển thị session alias/ID nội bộ đã rút gọn; không log raw cookie/token.

Nếu chưa có chức năng chặn trên kết nối dài hạn, ghi nhận đó là phần chưa đạt, không gọi việc logout browser là đã thu hồi đầy đủ. Chuẩn bị recording/screenshot từ chính lab khi lab đã chạy, không tạo ảnh kết quả giả.

## 17. Auth Lifecycle Recap — 4 phút

**Chỉ hình:** Quay lại bốn bước trên trang bìa và gọi tên một kiểm tra ở mỗi bước trước khi mở Q&A.

Quay lại câu hỏi ban đầu. Mình kiểm tra danh tính bằng password, OTP hoặc passkey theo cơ chế đã chọn. Sau đó session/token giúp nhận biết request tiếp theo. Authorization kiểm tra hành động với tài nguyên cụ thể. Và khi có vấn đề, trạng thái thu hồi phải tới được nơi thực thi request và kết nối đang mở.

Khi review một hệ thống auth, mình có thể lấy một hành động như Place Bid và lần theo đúng những điểm đó: bằng chứng ban đầu, credential của request, quyết định quyền và cách chặn lại. Nếu chưa chỉ ra được một điểm, mình đã tìm thấy câu hỏi cần làm rõ trong thiết kế.

**Q&A khoảng 3.5 phút.** Dùng appendix đúng câu hỏi thay vì trình bày tiếp toàn bộ.

## Nguồn và giới hạn case thật

- **S2:** [RFC 6238 — TOTP](https://www.rfc-editor.org/rfc/rfc6238.html).
- **S3:** [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/), đối chiếu registration/authentication ceremonies. Trang chuẩn đã được kiểm tra ngày 10/11/2026 và ghi W3C Recommendation ngày 25/08/2026; khi triển khai vẫn cần kiểm tra khả năng hỗ trợ của nền tảng đích.
- **S4:** [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html).
- **S5:** [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html).
- **S6:** [OWASP MFA Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).
- **S7:** [eBay account security](https://www.ebay.com/help/account/protecting-account/tips-keeping-ebay-account-secure?id=4872).
- **S8:** [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- **S9:** [RFC 9700 — OAuth Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html).
- **S10:** [eBay access token types](https://www.developer.ebay.com/api-docs/static/oauth-token-types.html).
- **S11:** [eBay authorization](https://developer.ebay.com/develop/guides/sell/authorization).
- **S12:** [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636.html).
- **S13:** [RFC 8252 — OAuth for Native Apps](https://www.rfc-editor.org/rfc/rfc8252.html).
- **S14:** [RFC 10017 — OAuth 2.0 for Browser-Based Applications](https://datatracker.ietf.org/doc/rfc10017/), đã đối chiếu trạng thái RFC Best Current Practice, tháng 8/2026, khi chuẩn bị deck ngày 10/11/2026.
- **S15:** [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).
- **S16:** [ASP.NET Core resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased).
- **S17:** [ASP.NET Core claims transformation](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/claims).
- **S18:** [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- **S19:** [RFC 7009 — Token Revocation](https://www.rfc-editor.org/rfc/rfc7009.html).
- **S20:** [RFC 7662 — Token Introspection](https://www.rfc-editor.org/rfc/rfc7662.html).
- **S21:** [ASP.NET Core SignalR authentication and authorization](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-10.0), đối chiếu hành vi cached principal và việc kiểm tra quyền hiện tại; không giả định tính năng authentication refresh của phiên bản mới hơn đã có trong .NET 8/10.

- **S22:** [ASP.NET Core OpenID Connect web authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-oidc-web-authentication?view=aspnetcore-10.0).
- **S23:** [NIST SP 800-162 — Attribute-Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final).
- **S24:** [Google Research — Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).
- **S25:** [NIST — Access control list](https://csrc.nist.gov/glossary/term/access_control_list).
- **S26:** [RFC 6749, mục 3.3 — Access Token Scope](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).

Tài liệu eBay xác nhận các tính năng và API công khai đã dẫn. Không có căn cứ từ các nguồn này để khẳng định eBay dùng JWT, BFF, một mô hình quyền cụ thể, hay một hệ thống thu hồi/phát hiện nội bộ cụ thể. Mọi account, auction và đường quyết định của BidLab trong bài là ví dụ giảng giải.
