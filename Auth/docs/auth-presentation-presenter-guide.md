# Auth — Beyond the Login Screen: Presenter Guide

**Phiên bản:** 10/11/2026. **Người trình bày:** Tavian Nguyen.

Slide tiếng Anh, trình bày tiếng Việt. Phần chính gồm 19 slide, dự toán 43 phút gồm 5 phút demo và khoảng 3.5 phút Q&A. Sáu slide appendix dùng tra cứu, không đọc nối tiếp sau slide kết. Lời dẫn dưới đây là bản luyện nói; khoảng dừng để chỉ hình và trao đổi ngắn nằm trong thời lượng mỗi trang. Chưa rehearsal nên đây chưa phải thời lượng đã đo.

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

Nhìn từ trên xuống. Bên trái là đăng nhập trực tiếp với ứng dụng. Nhắc đến mã OTP quen thuộc: server tạo mã rồi gửi qua SMS hoặc email. Sau đó mình sẽ xem cách ứng dụng xác thực tự tạo mã TOTP, rồi đến passkey. Bên phải là đăng nhập qua một nhà cung cấp danh tính. OIDC cho ứng dụng biết ai đã đăng nhập. OAuth 2.0 dùng khi ứng dụng cần quyền gọi API, còn PKCE bảo vệ bước đổi code.

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

## 07. OIDC: Who Signed In? — 2 phút

**Câu hỏi mở:** “Anna đã có tài khoản ở một nhà cung cấp danh tính. Làm sao app lịch biết người vừa đăng nhập là Anna?”

Chỉ hai cột. App chuyển browser sang nhà cung cấp danh tính để Anna đăng nhập. Khi xong, browser quay lại app với một authorization code. Backend của app đổi code tại token endpoint và nhận ID token trong phản hồi. App kiểm tra chữ ký, issuer, audience, thời hạn và các điều kiện của flow trước khi xác nhận danh tính và tạo phiên. [S4]

**Câu chốt:** “OIDC trả lời ai đã đăng nhập. App kiểm tra ID token để biết người đó là ai.”

**Chuyển:** Bây giờ Anna muốn app đọc sự kiện trong lịch. App cần thêm quyền gì?

## 08. OAuth 2.0: What Can the App Access? — 3 phút

**Chỉ hình:** Bên trái app xin quyền đọc lịch. Sau khi quyền được cấp, app nhận access token ở bước đổi code. Bên phải app gửi access token khi gọi Calendar API. API kiểm tra token và quyền đọc trước khi trả sự kiện.

Trong ví dụ, nhà cung cấp danh tính cũng đảm nhiệm vai trò authorization server. Hai vai trò có thể cùng một hệ thống. ID token dành cho app để xác nhận danh tính, còn access token được trình cho API để sử dụng quyền đã cấp. Nếu Anna chỉ đăng nhập và app không cần đọc lịch, app không cần xin quyền đọc lịch. [S4][S9]

**Chuyển:** Cả hai slide đều đi qua bước đổi authorization code. PKCE bảo vệ chính bước đó.

## 09. PKCE: Protecting the Code Exchange — 2 phút

**Chỉ hình:** Hàng trên là lúc xin code. App tạo verifier ngẫu nhiên cho giao dịch, giữ lại verifier và gửi challenge được dẫn xuất từ nó. Server gắn challenge với code sẽ trả về.

Hàng dưới là lúc đổi code. App gửi code và verifier. Server dùng cùng cách biến đổi, chẳng hạn S256, để tính lại challenge rồi so với giá trị đã gắn với code. Nếu khớp và các kiểm tra khác đạt, server mới cấp token. [S9][S12]

**Câu chốt:** “PKCE buộc lượt đổi code phải đưa ra verifier khớp với yêu cầu ban đầu.”

**Chuyển:** Sau khi xác nhận Anna là ai, app vẫn cần một cách nhận ra request tiếp theo của cô ấy.

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

## 13. Can Anna Bid on This Auction? — 2.5 phút

**Chỉ hình:** Đi qua ba hàng kiểm tra. Role Bidder cho Anna quyền đặt giá và cả hai phiên đều cùng tenant với Anna. Lời mời là điểm khác biệt. Phiên 42 đạt cả ba điều kiện nên được phép. Phiên 99 thiếu lời mời nên bị từ chối.

Đây là resource-based authorization: server tải phiên được yêu cầu và đánh giá policy với dữ liệu của phiên đó. Nếu request đi qua API dùng OAuth, scope `bids:write` cho biết phạm vi token được cấp. Quyền trên từng phiên vẫn được kiểm tra bằng policy của ứng dụng. [S16][S26]

Sau khi qua bước phân quyền, ứng dụng vẫn kiểm tra quy tắc nghiệp vụ như auction có đang mở hay số tiền đặt giá có hợp lệ hay không. Endpoint và đường realtime đều cần thực thi điều kiện bắt buộc.

**Chuyển:** Khi cần thay đổi logic này, nên tùy chỉnh ở lớp nào?

Đọc thêm trong [tài liệu Authorization](05-authorization.md).

## 14. Where to Customize Auth — 2 phút

**Chỉ hình:** Chỉ đúng vị trí mở rộng. Handler kiểm tra credential, ánh xạ tìm tài khoản, policy quyết định quyền trên auction.

Ba yêu cầu thường bị gọi chung là custom auth nhưng thuộc các lớp khác nhau.

Thứ nhất là kiểm tra credential theo một scheme. Khi dùng cookie, bearer hay OIDC chuẩn, ưu tiên middleware và thư viện đã có; chỉ cân nhắc authentication handler riêng khi thật sự có scheme khác cần được xử lý.

Thứ hai là ánh xạ identity: subject do IdP phát hành phải được liên kết an toàn với account và bidder nội bộ. Thứ ba là quyền: bidder đó có được làm hành động này trên auction đã tải không? Đây là nhiệm vụ policy/resource handler, không phải lý do tự viết giao thức đăng nhập.

Trong ví dụ, middleware kiểm tra kết quả bên ngoài, lớp identity tìm bidder nội bộ, rồi authorization handler kiểm tra phạm vi tài nguyên. Claims transformation có thể hỗ trợ bổ sung/ánh xạ claim nhưng không được biến dữ liệu tùy ý từ client thành quyền đáng tin. Việc liên kết tài khoản và thay yếu tố xác thực cần chính sách riêng. [S16][S17]

**Chuyển:** Mình đã kiểm tra đúng credential và quyền. Nhưng chuyện gì xảy ra nếu credential hợp lệ đang nằm trong tay hai người?

## 15. Refresh Token Rotation — 2 phút

**Chỉ hình:** Chỉ lần xuất hiện thứ hai của R1. Đây là tín hiệu trong hệ thống có rotation. Giải thích khả năng retry hoặc race bằng lời.

Server thường không có tín hiệu trực tiếp rằng một cookie vừa được sao chép. Một request có credential hợp lệ có thể đến từ Anna hoặc từ người đang giữ bản sao.

Hệ thống có thể quan sát phiên lạ do người dùng báo, thay đổi mạng/thiết bị, hành vi tải dữ liệu bất thường hoặc thay email khôi phục/MFA. Đây là tín hiệu để đánh giá, yêu cầu xác thực bổ sung hay chặn theo policy. IP mới có thể do mạng di động hoặc VPN; User-Agent có thể giả. Không có một tín hiệu đó là đủ kết luận chắc chắn.

Nếu hệ thống dùng refresh-token rotation, sau khi R1 được dùng và thay bằng R2, việc R1 xuất hiện lại cho biết token cũ đã được trình. Có thể có bản sao, nhưng cũng phải xử lý race/retry để tránh báo động nhầm. Server không tự biết bên nào là attacker. Nó có thể thu hồi chuỗi token liên quan, nhưng access token đã phát cần cách xử lý riêng. [S9][S18]

**Chuyển:** Phát hiện chỉ hữu ích khi mình thực sự chặn được đường truy cập còn lại.

## 16. Session Revocation — 2 phút

**Chỉ hình:** So sánh cùng một bid trước và sau khi revoke. Giải thích thêm bằng lời với token tự kiểm tra và kết nối SignalR đang mở.

Xóa cookie trên browser của Anna không xóa bản sao ở client khác. Muốn chặn, server hoặc API phải kiểm tra một điều kiện đã thay đổi: session còn active không, token có bị chặn không, phiên bản còn khớp không, hoặc kết quả introspection còn active không.

Nếu API chỉ kiểm tra JWT tại chỗ, chữ ký và thời hạn có thể vẫn hợp lệ sau khi mình bấm revoke ở nơi khác. Access token có thể tiếp tục dùng tới hạn nếu kiến trúc không có đường nhận trạng thái thu hồi. Token ngắn hạn giới hạn cửa sổ, không chặn ngay lập tức. Thu hồi refresh token chặn việc xin token mới theo cơ chế đó, không tự hủy token cũ.

Với SignalR, kết nối đã mở có thể vẫn giữ danh tính cũ. Cần ngắt server-side hoặc kiểm tra lại trước lệnh nhạy cảm theo thiết kế. Đừng chỉ gửi event yêu cầu client logout rồi giả định attacker sẽ làm theo. Cache và request đang chạy cũng ảnh hưởng thời điểm chặn thật.

Sau sự cố còn phải xử lý nguồn lộ, credential/factor attacker đã thêm và khôi phục chủ tài khoản. Revoke không lấy lại được dữ liệu đã tải xuống. [S19][S20][S21]

**Chuyển:** Yêu cầu về tốc độ thu hồi có thể thay đổi kiến trúc. Giờ so sánh bốn kiểu dự án và chọn cách làm cho BidLab.

## 17. Four Project Setups and When to Use Them — 3 phút

**Chỉ hình:** Đi theo loại dự án người nghe đang làm, rồi đọc phương án và lý do tương ứng. Kết bằng câu hỏi về thu hồi tức thời để dẫn sang BidLab.

Với web app cùng origin, cookie đăng nhập là điểm xuất phát hợp lý vì trình duyệt chỉ cần duy trì phiên với backend của app. Nếu cần thu hồi từng phiên ngay, có thể để cookie mang ID và tra trạng thái phiên phía server. [S8]

Với web app nội bộ cần SSO, dùng OIDC để nhận danh tính từ IdP công ty, sau đó tạo phiên riêng cho app. App vẫn thực thi quyền nghiệp vụ. [S4][S22]

Với SPA có backend riêng gọi API, BFF giữ access token ở server và trình duyệt dùng cookie phiên. Đổi lại, đội dự án vận hành thêm backend và bảo vệ phiên. Với mobile gọi API, dùng browser hệ thống cho OIDC Authorization Code + PKCE rồi gửi access token tới API. [S9][S13][S14]

Hỏi cả phòng: nếu khóa tài khoản Anna lúc này, request đặt giá tiếp theo có phải bị chặn ngay không? Với BidLab, giả sử có yêu cầu đó. Chọn cookie chứa ID phiên, tra trạng thái ở backend và kiểm tra quyền trên auction. Với kết nối SignalR đang mở, cần kiểm tra lại trước lệnh nhạy cảm hoặc ngắt kết nối theo chính sách. [S8][S21]

**Chuyển:** Dùng các quyết định này để lần theo lượt bid của Anna trong kịch bản BidLab.

## 18. Three Outcomes in BidLab — 5 phút

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

## 19. Auth Lifecycle Recap — 4 phút

**Chỉ hình:** Quay lại bốn bước trên trang bìa và gọi tên một kiểm tra ở mỗi bước trước khi mở Q&A.

Quay lại câu hỏi ban đầu. Mình kiểm tra danh tính bằng password, OTP hoặc passkey theo cơ chế đã chọn. Sau đó session/token giúp nhận biết request tiếp theo. Authorization kiểm tra hành động với tài nguyên cụ thể. Và khi có vấn đề, trạng thái thu hồi phải tới được nơi thực thi request và kết nối đang mở.

Khi review một hệ thống auth, mình có thể lấy một hành động như Place Bid và lần theo đúng những điểm đó: bằng chứng ban đầu, credential của request, quyết định quyền và cách chặn lại. Nếu chưa chỉ ra được một điểm, mình đã tìm thấy câu hỏi cần làm rõ trong thiết kế.

**Q&A khoảng 3.5 phút.** Dùng appendix đúng câu hỏi thay vì trình bày tiếp toàn bộ.

## Appendix 20. TOTP Verification Checklist

**Chỉ hình:** Tra ba trách nhiệm: bảo vệ khóa, chấp nhận lệch giờ có giới hạn và cập nhật trạng thái chống dùng lại.

TOTP dùng số bước thời gian `T = floor((UnixTime - T0) / X)`, trong đó X thường là 30 giây. App và server dùng cùng tham số đã thiết lập khi đăng ký. Giữ khóa riêng cho từng authenticator và bảo vệ QR đăng ký vì nó mang thông tin bí mật. [S2]

Giới hạn số lần thử và phạm vi lệch giờ được chấp nhận. Sau khi chấp nhận một mã, cập nhật trạng thái sao cho cùng bước thời gian không thể được chấp nhận lại do hai request đến đồng thời.

## Appendix 21. Passkey Verification and Recovery

**Chỉ hình:** Tra nhóm kiểm tra lúc đăng nhập hoặc nhóm chính sách khôi phục tùy câu hỏi.

Mỗi lần ceremony cần challenge ngẫu nhiên gắn với giao dịch, thời hạn và kiểm soát sử dụng. Backend kiểm tra loại ceremony, origin, RP ID hash, dữ liệu trả về, chữ ký và user presence/verification theo yêu cầu. Không coi `signCount` là bộ phát hiện clone chắc chắn cho mọi passkey, đặc biệt với credential đồng bộ.

User verification có thể dùng PIN/sinh trắc học cục bộ. Synced passkey và device-bound credential có đặc tính triển khai/khôi phục khác nhau; không nói khóa riêng luôn chỉ tồn tại trên đúng một thiết bị. Bảo vệ thêm/xóa passkey, thông báo thay đổi nhạy cảm, recovery và cấp lại phiên. Sinh trắc học không được dùng như một bí mật server có thể thu hồi giống password. [S3][S5]

## Appendix 22. OAuth and OIDC Validation

**Chỉ hình:** Theo từng dòng đến bên chịu trách nhiệm. Các kiểm tra còn tùy loại token, flow và policy.

Client kiểm tra ID token theo OIDC: issuer đúng, audience phù hợp, chữ ký/thuật toán đúng, thời hạn và các claim/nonce cần kiểm tra theo flow. Dùng thư viện cấu hình đúng; decode payload không thay validation. API kiểm tra access token cho chính API của nó và kiểm tra scope/quyền/tài nguyên; không đưa ID token vào API như access token.

PKCE ràng buộc code exchange với verifier. State liên quan đối chiếu giao dịch và chống request forgery theo thiết kế; nonce ràng buộc kết quả OIDC với yêu cầu theo flow. Các chuẩn cho phép những cơ chế tương tác cụ thể, nên không phát biểu ba trường này luôn thay nhau hay luôn bắt buộc giống nhau ở mọi flow. Redirect URI, client authentication khi có, HTTPS và việc bảo vệ token vẫn cần riêng. [S4][S9][S12]

## Appendix 23. User SSO and Workload Identity

**Chỉ hình:** Chọn theo chủ thể đang gọi: người dùng tương tác hoặc dịch vụ chạy tự động.

SSO là trải nghiệm dùng danh tính tập trung qua nhiều ứng dụng. OIDC hoặc SAML Web SSO có thể thực hiện liên kết tùy nhà cung cấp. Phiên ở IdP và phiên ở ứng dụng là hai phạm vi; logout cần thiết kế theo các phạm vi đó.

Một worker chạy nền có thể gọi API bằng danh tính riêng, không có người dùng đang login. OAuth Client Credentials là một lựa chọn khi có hệ thống OAuth phù hợp. Quyền của worker phải là quyền ứng dụng được cấp, không giả làm quyền của Anna. API key, certificate/mTLS và sender-constrained token có nhiệm vụ và vòng đời riêng; tra chương machine authentication thay vì thêm chúng vào danh sách cách login cho người dùng.

## Appendix 24. Resource Authorization in ASP.NET Core

**Chỉ hình:** Chỉ ranh giới giữa lấy tài nguyên, quyết định quyền và kiểm tra nghiệp vụ trước khi ghi.

Trình tự tham chiếu: middleware xác thực → ánh xạ account nội bộ → tải resource trong ranh giới dữ liệu đúng → authorization service/handler đánh giá actor + action + resource → kiểm tra nghiệp vụ → ghi dữ liệu. Trình tự cụ thể có thể gộp query có phạm vi và policy nhưng không bỏ một ranh giới bắt buộc.

Trong ASP.NET Core, gọi `IAuthorizationService.AuthorizeAsync` với resource và policy/requirement phù hợp; handler nhận resource đã xác định. `[Authorize]` có thể làm cổng chung nhưng một mình nó chưa thể biết mọi quan hệ của auction. Không nhận role/permission từ body của request. Chỉ thiếu đăng nhập và đã xác thực nhưng thiếu quyền là hai trạng thái khác nhau; có thể trả 404 theo chính sách tránh lộ tài nguyên. [S16][S17]

## Appendix 25. Revocation Across Active Requests

**Chỉ hình:** Lần theo từng điểm từ lúc ghi revoke đến lúc HTTP và kết nối đang mở thực sự từ chối credential cũ.

Một lệnh revoke chỉ tạo hiệu lực ở nơi trạng thái mới được kiểm tra. Timeline cần thể hiện: nhận yêu cầu revoke → commit trạng thái → cập nhật/invalidate cache → API/handler thấy trạng thái → từ chối credential cũ → xử lý kết nối và request đang chạy theo chính sách.

Với access token kiểm tra offline, chờ hết hạn là chặn có độ trễ. Với introspection/cache, TTL và phân phối trạng thái giới hạn tốc độ chặn. Với version, API phải thực sự so với giá trị hiện tại, chỉ nhét version vào JWT không có tác dụng thu hồi. Thu hồi signing key ảnh hưởng rộng và không nên được coi là cách mặc định để logout một tài khoản.

Khi phát hiện refresh token cũ được trình sau rotation, hệ thống cần quản lý token family và xử lý race/retry theo policy. Xác minh lại quyền truy cập API, refresh và reconnect sau khi xử lý. Không tuyên bố đã giảm thời gian thu hồi nếu chưa đo trên các đường liên quan. [S9][S19][S20][S21]

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
