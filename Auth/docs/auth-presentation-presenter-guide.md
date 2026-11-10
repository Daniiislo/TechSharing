# Auth — Beyond the Login Screen: Presenter Guide

**Phiên bản:** 10/11/2026. **Người trình bày:** Tavian Nguyen.

Slide tiếng Anh, trình bày tiếng Việt. Phần chính gồm 20 slide, dự toán 45 phút gồm 5 phút demo và khoảng 3.5 phút Q&A. Sáu slide appendix dùng tra cứu, không đọc nối tiếp sau slide kết. Lời dẫn dưới đây là bản luyện nói; khoảng dừng để chỉ hình và trao đổi ngắn nằm trong thời lượng mỗi trang. Chưa rehearsal nên đây chưa phải thời lượng đã đo.

**Phạm vi demo:** kịch bản chuẩn bị cho BidLab, chưa phải chức năng Auth đã triển khai. Deck không tuyên bố mô hình minh họa là kiến trúc thật của eBay hay TravelPledgeAuctions.

## 01. Beyond the Login Screen — 1.5 phút

Anna vừa đăng nhập thành công. Đến đây mình có thể nghĩ phần auth đã xong: tài khoản đúng, mật khẩu đúng, màn hình bid đã mở.

Nhưng khi Anna bấm Place Bid, một request mới đi lên server. Server biết request này vẫn thuộc Anna bằng cách nào? Nếu Anna thay mã auction trong request thì cô ấy có quyền bid ở auction khác không? Nếu một người giữ bản sao phiên đăng nhập của Anna, server có phân biệt được không? Và sau khi mình khóa tài khoản, kết nối đang mở có còn nhận lệnh bid không?

Đây là những việc phía sau màn hình login mà hôm nay mình muốn lần theo. Mình sẽ dùng cùng một người dùng và một hành động bid để nối các phần lại, thay vì học từng tên công nghệ rời rạc.

**Chỉ hình:** Anna đã login ở bên trái, Place Bid ở giữa, các câu hỏi ở phía server. Không giải thích token ngay tại đây.

**Chuyển:** Trước khi chọn cách đăng nhập, mình cần biết mỗi thành phần của auth chịu trách nhiệm cho câu hỏi nào.

## 02. One Bid, Four Security Questions — 1.5 phút

Authentication là kiểm tra bằng chứng để xác thực chủ thể đang truy cập. Có thể là người dùng hoặc ứng dụng; phần chính hôm nay tập trung vào người dùng. Authorization là quyết định chủ thể đó có được thực hiện một hành động trên tài nguyên cụ thể hay không.

Giữa hai việc này có một đoạn thường bị bỏ qua: sau lần xác thực đầu, ứng dụng giữ một phiên hoặc phát credential để nhận biết những request sau. Cuối cùng, mình cần cách chặn credential hoặc phiên cũ khi không còn cho phép truy cập.

Vì thế, một bid đi qua bốn câu hỏi: ai đang gọi, request hiện tại còn thuộc phiên được chấp nhận không, người đó có quyền với auction này không, và hệ thống có còn cho phép phiên đó hoạt động không. Điều kiện nghiệp vụ như giá bid hợp lệ cũng phải được kiểm tra trước khi ghi dữ liệu.

**Chỉ hình:** đi từ trái sang phải một lần; gọi đúng tên authentication/authorization, không gọi tất cả các bước là login.

**Chuyển:** Đầu tiên là bằng chứng: người dùng đưa gì để mình kiểm tra danh tính?

## 03. Different Evidence, the Same Identity Question — 2 phút

Password chứng minh người dùng biết một bí mật. Authenticator tạo OTP dựa vào bí mật nó giữ. Passkey dùng khóa riêng để tạo chữ ký mà server kiểm tra bằng khóa công khai. Chúng cùng phục vụ xác thực nhưng không có cùng cách hoạt động hay cùng mức chống lại từng kiểu tấn công.

MFA nghĩa là Multi-Factor Authentication: kết hợp ít nhất hai loại yếu tố. Những nhóm thường gặp là điều bạn biết, thứ bạn có, và đặc điểm sinh trắc học của bạn. 2FA là trường hợp dùng hai yếu tố. Số màn hình và số lần bấm không quyết định số yếu tố: hai mật khẩu vẫn thuộc cùng loại.

Với password cộng TOTP, mình yêu cầu bí mật đã nhớ và quyền sử dụng authenticator đã đăng ký. Tuy nhiên, từng yếu tố phải được triển khai và bảo vệ đúng. Không mặc định email OTP độc lập nếu chính hộp thư cũng bị chiếm cùng tài khoản. Với passkey, việc thiết bị kiểm tra PIN hoặc sinh trắc học có vai trò khác nhập password cho server; khả năng đáp ứng MFA còn phụ thuộc user verification và chính sách.

eBay công khai hỗ trợ passkey và các lựa chọn xác thực hai bước. Đây là ví dụ một dịch vụ có thể đưa ra nhiều cách xác thực, không có nghĩa các lựa chọn có cùng cơ chế bên trong. [S5][S7]

**Chuyển:** Bỏ qua password quen thuộc, bắt đầu từ cơ chế mà app và server tự tính cùng một mã.

## 04. HOTP: Keep the Counters in Sync — 2 phút

HOTP dùng một khóa bí mật chung, ký hiệu K, và bộ đếm C. Bộ đếm cho biết đang ở bước tạo mã nào; nó không phải số giây còn lại hay số lần login sai.

Trong ví dụ test vector của chuẩn, hai phía cùng có K và C bằng 0 thì tính ra mã 755224. Người dùng nhập mã; server tự tính kết quả dự kiến và đối chiếu. Khi chấp nhận, server chuyển trạng thái để không chấp nhận lại bước đó. Authenticator tăng bộ đếm khi tạo mã tiếp theo. Mã tiếp theo của test vector là 287082. Đây là dữ liệu kiểm thử công khai, không phải secret dùng trong hệ thống thật.

Nếu Anna tạo vài mã mà chưa dùng, authenticator có thể đi trước server. Server có thể kiểm tra một số bước phía trước trong giới hạn rồi cập nhật theo bước được chấp nhận. Cửa sổ rộng hơn cần được cân nhắc cùng giới hạn thử sai.

Điểm dễ nhầm: HOTP không tự đổi chỉ vì 30 giây đã qua. Nếu dịch vụ đặt thời hạn thì đó là chính sách thêm vào. [S1]

**Chỉ hình:** hai bản counter; chỉ rõ phía tạo mã và phía chấp nhận cập nhật ở những sự kiện khác nhau.

**Chuyển:** Có thể thay bộ đếm thao tác bằng một giá trị mà hai bên cùng suy ra từ đồng hồ không?

## 05. TOTP: Let Time Move the Counter — 2 phút

TOTP dùng HOTP làm nền, nhưng giá trị thay đổi là khoảng thời gian hiện tại. Ví dụ cấu hình 30 giây: cả app và server lấy thời gian rồi tính xem đang ở khoảng thứ mấy. Cùng khóa và cùng khoảng thì hai bên tính được cùng mã.

Khóa đã được đưa vào authenticator khi thiết lập, thường qua QR. App không phải gọi server xin một mã mới mỗi 30 giây. Bởi vậy, điện thoại offline vẫn hiển thị mã; nó cần khóa và đồng hồ đủ chính xác.

Nếu đồng hồ lệch, server có thể kiểm tra một số khoảng lân cận theo chính sách. Dù mã vẫn hiển thị trong cùng khoảng, server phải ngăn mã đã chấp nhận được dùng lại. Mã ngắn cũng cần giới hạn thử sai.

SMS và email là kênh chuyển mã. Mã ngẫu nhiên do server tạo rồi gửi SMS không tự trở thành TOTP chỉ vì nó có thời hạn. Một giới hạn chung của OTP nhập tay là attacker có thể chuyển tiếp mã từ trang giả sang trang thật ngay lúc đó. [S2][S6]

**Chuyển:** Nếu mình không muốn người dùng nhập một bí mật có thể chuyển tiếp như vậy, passkey thay đổi bằng chứng ra sao?

## 06. Passkeys: Register a Public Key — 2 phút

Trước hết cần hai chức năng: khóa riêng tạo chữ ký; khóa công khai kiểm tra chữ ký. Biết khóa công khai không đủ để ký như người giữ khóa riêng. Mình không cần học phép toán mật mã để theo dõi luồng này.

Khi Anna thêm passkey, backend phải xác minh phiên và cho phép thêm credential vào tài khoản. Frontend gọi backend lấy dữ liệu đăng ký, trong đó có challenge ngẫu nhiên cho lần này. Sau đó frontend gọi API WebAuthn của browser, `navigator.credentials.create`.

Browser làm việc với authenticator để tạo cặp khóa cho dịch vụ. Frontend gửi phản hồi đăng ký về backend. Backend kiểm tra challenge, origin, RP và các điều kiện WebAuthn rồi lưu credential ID cùng public key gắn với tài khoản. Private key do authenticator hoặc trình quản lý passkey bảo vệ, không gửi vào cơ sở dữ liệu ứng dụng.

Đây là hai lượt HTTP quanh một lần gọi API browser. Không vẽ backend gọi trực tiếp hộp thoại vân tay trên điện thoại. Thêm passkey là thao tác nhạy cảm: nếu cho attacker tự thêm khóa, họ có thể giữ quyền vào tài khoản lâu dài. [S3][S5]

**Chuyển:** Đã đăng ký xong public key. Lần đăng nhập tiếp theo server kiểm tra nó thế nào?

## 07. Passkeys: Prove Possession Without Sending the Key — 2 phút

Frontend lấy challenge mới từ server rồi gọi `navigator.credentials.get`. Browser tìm credential phù hợp. Thiết bị có thể yêu cầu PIN, vân tay hoặc khuôn mặt để cho phép dùng khóa riêng, theo chính sách xác thực.

Authenticator ký dữ liệu của lần xác thực. Frontend gửi assertion về server. Server tìm public key đã gắn với credential, kiểm tra chữ ký, challenge, origin/RP và các điều kiện bắt buộc rồi mới tạo phiên. Vân tay không được gửi cho server để so sánh. Challenge được ràng buộc với lần yêu cầu và phải có thời hạn/sử dụng phù hợp để không dùng lại phản hồi cũ.

Sự khác biệt cần nhớ so với OTP là bằng chứng mật mã được ràng buộc với dịch vụ. Một trang giả trên domain khác không đơn giản lấy được mã rồi chuyển tiếp như OTP nhập tay. Tuy nhiên, điều này không tự bảo vệ mọi đường khôi phục tài khoản hoặc một session đã bị đánh cắp sau login. Nếu mất thiết bị, vẫn cần quy trình recovery và quản lý credential rõ ràng. [S3][S5]

**Chuyển:** Sau password, TOTP hay passkey, mình đều quay về cùng câu hỏi: request tiếp theo mang gì?

## 08. The Next Request Still Needs Proof — 1.5 phút

HTTP request mới không tự chứa ký ức về lần login trước. Trong ví dụ session phía server, server tạo một mã ngẫu nhiên, lưu quan hệ với Anna và đặt cookie chứa session ID trên browser. Request tiếp theo browser gửi cookie; server tra phiên rồi kiểm tra trạng thái, thời hạn và quyền.

Session là khái niệm quản lý truy cập; cookie là cách browser lưu và gửi dữ liệu. Cookie cũng có thể chứa một ticket được bảo vệ thay vì chỉ session ID, nên không nói mọi cookie đều có bản ghi session để tra.

Trong kiến trúc dùng access token, client gửi token cho API. Hai cách có những lựa chọn kiểm tra và thu hồi khác nhau. HttpOnly hạn chế JavaScript đọc cookie, nhưng mã độc đang chạy trong trang vẫn có thể gửi request bằng phiên. Cookie tự động gửi cũng đòi hỏi bảo vệ CSRF phù hợp. [S8]

**Chuyển:** Vậy chữ ký token hợp lệ đã đủ chứng minh người đang gửi là Anna chưa?

## 09. A Valid Token Can Still Be Stolen — 1.5 phút

JWT là một cách biểu diễn token. Bearer mô tả cách sử dụng: bên giữ credential có thể trình nó để truy cập, nếu các điều kiện kiểm tra khác vẫn đạt. JWT và bearer không phải hai lựa chọn đối lập; một access token dạng JWT có thể được dùng theo kiểu bearer.

Nếu Anna và một client lab giữ cùng token hoặc session cookie, server có thể nhận những request với cùng danh tính. Chữ ký hợp lệ cho biết dữ liệu qua được kiểm tra theo khóa và thuật toán tin cậy; nó không chứng minh máy đang gửi là máy của Anna. Cũng không nên mô tả JWT luôn mã hóa nội dung.

Passkey bảo vệ lần xác thực nhưng sau đó ứng dụng vẫn có thể cấp bearer credential. Đây là lý do login mạnh cần đi cùng bảo vệ phiên và cách thu hồi. [S8][S9]

**Chuyển:** Một nhu cầu khác: ứng dụng của mình muốn gọi API ở dịch vụ khác thay người dùng mà không giữ password của họ.

## 10. Let an App Act Without Sharing Your Password — 2 phút

Giả sử một công cụ giúp seller quản lý dữ liệu eBay. Công cụ cần quyền gọi API trên tài khoản của seller. Seller không nên giao password eBay cho công cụ đó.

OAuth tổ chức cách ứng dụng nhận access token với quyền được cấp. Trong câu chuyện này có người dùng, ứng dụng muốn truy cập, hệ thống cấp quyền/token, và API giữ dữ liệu. Các vai trò có thể chung một hạ tầng nhưng vẫn cần phân biệt trách nhiệm.

Ứng dụng đăng ký client ID, redirect URI và các thông tin theo yêu cầu của nhà cung cấp. Client ID nhận diện ứng dụng, không phải password. Scope nói về phạm vi quyền API, không mặc nhiên cho ứng dụng truy cập mọi bản ghi.

eBay công khai phân biệt Application access token và User access token. Với truy cập đại diện người dùng, tài liệu mô tả consent và authorization code. Đây là case OAuth API thật; không dùng nó làm bằng chứng rằng eBay triển khai login website bằng OIDC hay PKCE theo hình minh họa tiếp theo. [S10][S11]

**Chuyển:** Mình đi qua một flow tổng quát trước, rồi chỉ ra chỗ kết quả danh tính xuất hiện.

## 11. OAuth Grants Access; OIDC Adds Identity — 3 phút

Ứng dụng chuyển browser tới hệ thống cấp quyền, mang yêu cầu quyền và thông tin liên quan. Hệ thống đó xác thực người dùng và xử lý consent theo chính sách. Không phải mọi lần đều hiện lại hộp xin phép nếu chính sách/ủy quyền trước đã đủ.

Browser quay về redirect URI với một authorization code. Code này là mã tạm phục vụ bước đổi token, không dùng để gọi API. Client kiểm tra phản hồi thuộc giao dịch nó đã bắt đầu rồi gửi code tới token endpoint cùng các bằng chứng cần thiết. Hệ thống trả access token, và client dùng access token gọi API. API kiểm tra token và quyền trước khi trả dữ liệu.

OAuth giải quyết quyền truy cập ứng dụng. Nếu ứng dụng còn cần kết quả xác thực danh tính theo một chuẩn liên kết, OIDC bổ sung lớp đó. Trong authorization-code flow OIDC, token response còn có ID token. Client kiểm tra ID token để nhận kết quả danh tính; API nhận access token. Hai token có mục đích và đối tượng nhận khác nhau.

Ứng dụng còn phải ánh xạ danh tính bên ngoài sang tài khoản nội bộ và có thể tạo session riêng. Logout ở một nơi chưa đủ chứng minh mọi session khác đã kết thúc. [S4][S9]

**Chỉ hình:** đường qua browser và đường đổi code tách rõ; đọc các bước theo số, sau đó chỉ phần ID token như một lớp bổ sung. Sơ đồ là flow tổng quát, không phải sơ đồ nội bộ của eBay.

**Chuyển:** Nếu code bị lấy trước khi client đổi token, mình cần thêm kiểm tra gì?

## 12. A Stolen Code Should Not Be Enough — 2 phút

Client tạo một giá trị ngẫu nhiên riêng cho giao dịch gọi là verifier và giữ lại. Nó tính challenge từ verifier, thường dùng S256, rồi gửi challenge khi bắt đầu yêu cầu.

Đến bước đổi code, client gửi verifier. Authorization server tính lại challenge và kiểm tra có khớp giá trị đã gắn với yêu cầu ban đầu không. Một bên chỉ lấy được code mà không có verifier sẽ thiếu bằng chứng để đổi token. Điều này giả định verifier được giữ đúng và server thực thi PKCE.

Tên của cách bảo vệ này là Proof Key for Code Exchange, viết tắt PKCE. Nó phù hợp với public client không thể giữ một client secret lâu dài chỉ cho mình, và hướng dẫn OAuth hiện đại áp dụng PKCE rộng hơn cả public client.

PKCE bảo vệ code exchange. Nếu attacker đã lấy access token sau khi cấp, PKCE không tự làm token đó vô dụng. State và nonce có nhiệm vụ riêng tùy flow và thư viện; không thay chúng bằng một trường bất kỳ hoặc bỏ kiểm tra theo suy đoán. [S9][S12]

**Chuyển:** Đã hiểu các thành phần, giờ mình chọn cách kết hợp dựa vào nơi credential được giữ.

## 13. Choose Where Credentials Live — 3 phút

Nhìn hình thứ nhất: browser gọi backend riêng; backend giữ token gọi API, browser giữ cookie phiên. Khi backend phục vụ riêng giao diện theo cách này, mình thường gọi nó là Backend for Frontend, hay BFF. Nó giảm việc token API xuất hiện ở browser nhưng vẫn cần bảo vệ session, CSRF, XSS và backend.

Hình thứ hai: giao diện chạy chủ yếu trong browser, tức SPA, gọi API trực tiếp. Browser trở thành nơi dùng token. Khi tích hợp hệ thống danh tính, thường cân nhắc OIDC authorization-code flow với PKCE và xử lý vòng đời token phù hợp. Không nhúng client secret rồi coi mã tải về máy người dùng là nơi giữ bí mật.

Hình thứ ba: mobile dùng browser hệ thống để thực hiện tương tác xác thực, rồi nhận kết quả theo cơ chế native-app đã đăng ký. Authorization Code với PKCE là hướng tiêu chuẩn cần cân nhắc.

SSO là nhu cầu khác: dùng cùng hệ thống danh tính để đi qua nhiều ứng dụng với ít lần xác thực lại hơn, theo policy. Nó có thể cùng tồn tại với các kiến trúc trên. Khi chọn, hỏi ai đang gọi, token ở đâu, có IdP không và phải thu hồi nhanh đến đâu. Không có một nhãn công nghệ quyết định hết cả bốn câu hỏi. [S13][S14]

**Chuyển:** Dù chọn kiến trúc nào, biết Anna là ai vẫn chưa quyết định được cô ấy được bid ở đâu.

## 14. A Bidder Role Is Only the First Check — 1.5 phút

RBAC, Role-Based Access Control, gom quyền theo vai trò. Bidder có quyền tham gia bid, organizer quản lý auction, admin có quyền vận hành theo phạm vi được cấp. Cách này dễ hiểu và giúp quản lý quyền theo chức năng.

Nhưng nếu chỉ kiểm tra Anna có role Bidder, mình chưa biết cô ấy có được bid auction 42 hay auction 99. Hai auction có thể thuộc hai tổ chức khác nhau, hoặc một auction chỉ dành cho người đã được mời.

Ẩn nút Place Bid chỉ thay đổi giao diện. Người dùng vẫn có thể gửi HTTP request hoặc lệnh qua một đường gọi khác. Endpoint cần kiểm tra quyền và các đường realtime cũng phải thực thi điều kiện bắt buộc. [S15]

**Chuyển:** Giờ thêm tài nguyên cụ thể vào câu hỏi phân quyền.

## 15. Can Anna Bid on This Auction? — 2.5 phút

Server nhận danh tính Anna từ kết quả xác thực đã kiểm tra, rồi tải auction được yêu cầu từ nguồn đáng tin. Nó không nhận `tenantId` hay `isOwner` từ request rồi mặc nhiên coi là đúng.

Nếu quyết định dựa vào thuộc tính như tổ chức của người dùng và tài nguyên, đó là hướng ABAC. Nếu dựa vào quan hệ như Anna là thành viên được mời vào auction này, đó là hướng ReBAC. Policy là nơi diễn đạt và kết hợp các điều kiện để đưa ra quyết định; nó không nhất thiết là một mô hình tách rời RBAC/ABAC/ReBAC.

Ví dụ mình yêu cầu có permission PlaceBid, cùng phạm vi tổ chức và có quan hệ được tham gia auction. Sau khi cho phép, vẫn cần kiểm tra nghiệp vụ: auction có đang mở không, số tiền có hợp lệ không, cập nhật đồng thời xử lý ra sao. Không gán mọi điều kiện này vào role.

Một request đã được xác thực nhưng không có quyền phải bị từ chối. Mã tài nguyên khó đoán không thay kiểm tra đó. Trong .NET, resource-based authorization giải quyết quyết định phụ thuộc tài nguyên mà một kiểm tra login chung chưa đủ. [S15][S16]

**Chuyển:** Khi cần custom auth, mình cần sửa chính xác đoạn nào trong đường đi này?

## 16. Customize the Decision at the Right Layer — 2 phút

Ba yêu cầu thường bị gọi chung là custom auth nhưng thuộc các lớp khác nhau.

Thứ nhất là kiểm tra credential theo một scheme. Khi dùng cookie, bearer hay OIDC chuẩn, ưu tiên middleware và thư viện đã có; chỉ cân nhắc authentication handler riêng khi thật sự có scheme khác cần được xử lý.

Thứ hai là ánh xạ identity: subject do IdP phát hành phải được liên kết an toàn với account và bidder nội bộ. Thứ ba là quyền: bidder đó có được làm hành động này trên auction đã tải không? Đây là nhiệm vụ policy/resource handler, không phải lý do tự viết giao thức đăng nhập.

Trong ví dụ, middleware kiểm tra kết quả bên ngoài, lớp identity tìm bidder nội bộ, rồi authorization handler kiểm tra phạm vi tài nguyên. Claims transformation có thể hỗ trợ bổ sung/ánh xạ claim nhưng không được biến dữ liệu tùy ý từ client thành quyền đáng tin. Việc liên kết tài khoản và thay yếu tố xác thực cần chính sách riêng. [S16][S17]

**Chuyển:** Mình đã kiểm tra đúng credential và quyền. Nhưng chuyện gì xảy ra nếu credential hợp lệ đang nằm trong tay hai người?

## 17. Would We Notice a Stolen Session? — 2 phút

Server thường không có tín hiệu trực tiếp rằng một cookie vừa được sao chép. Một request có credential hợp lệ có thể đến từ Anna hoặc từ người đang giữ bản sao.

Hệ thống có thể quan sát phiên lạ do người dùng báo, thay đổi mạng/thiết bị, hành vi tải dữ liệu bất thường hoặc thay email khôi phục/MFA. Đây là tín hiệu để đánh giá, yêu cầu xác thực bổ sung hay chặn theo policy. IP mới có thể do mạng di động hoặc VPN; User-Agent có thể giả. Không có một tín hiệu đó là đủ kết luận chắc chắn.

Nếu hệ thống dùng refresh-token rotation, sau khi R1 được dùng và thay bằng R2, việc R1 xuất hiện lại cho biết token cũ đã được trình. Có thể có bản sao, nhưng cũng phải xử lý race/retry để tránh báo động nhầm. Server không tự biết bên nào là attacker. Nó có thể thu hồi chuỗi token liên quan, nhưng access token đã phát cần cách xử lý riêng. [S9][S18]

**Chuyển:** Phát hiện chỉ hữu ích khi mình thực sự chặn được đường truy cập còn lại.

## 18. Revoked Must Mean Rejected — 2 phút

Xóa cookie trên browser của Anna không xóa bản sao ở client khác. Muốn chặn, server hoặc API phải kiểm tra một điều kiện đã thay đổi: session còn active không, token có bị chặn không, phiên bản còn khớp không, hoặc kết quả introspection còn active không.

Nếu API chỉ kiểm tra JWT tại chỗ, chữ ký và thời hạn có thể vẫn hợp lệ sau khi mình bấm revoke ở nơi khác. Access token có thể tiếp tục dùng tới hạn nếu kiến trúc không có đường nhận trạng thái thu hồi. Token ngắn hạn giới hạn cửa sổ, không chặn ngay lập tức. Thu hồi refresh token chặn việc xin token mới theo cơ chế đó, không tự hủy token cũ.

Với SignalR, kết nối đã mở có thể vẫn giữ danh tính cũ. Cần ngắt server-side hoặc kiểm tra lại trước lệnh nhạy cảm theo thiết kế. Đừng chỉ gửi event yêu cầu client logout rồi giả định attacker sẽ làm theo. Cache và request đang chạy cũng ảnh hưởng thời điểm chặn thật.

Sau sự cố còn phải xử lý nguồn lộ, credential/factor attacker đã thêm và khôi phục chủ tài khoản. Revoke không lấy lại được dữ liệu đã tải xuống. [S19][S20][S21]

**Chuyển:** Demo sẽ kiểm tra hành vi ở phía server thay vì chỉ nhìn màn hình logout.

## 19. Demo: Bid, Deny, Revoke — 5 phút

**Trạng thái hiện tại:** kịch bản này là đặc tả cho lab; chưa có bản demo Auth chạy được đi kèm deck. Có thể trình bày sơ đồ tại trang này nếu chưa triển khai. Không giới thiệu là live demo sẵn sàng.

Khi triển khai, dùng một kiến trúc session nhất quán và tài khoản lab. Không thêm refresh-token rotation vào lab session-cookie chỉ để mô phỏng mọi khái niệm.

| Thời gian | Thao tác người trình bày | Điều cần nhìn thấy |
|---|---|---|
| 0:00–1:00 | Anna xác thực và bid auction được phép | Server nhận dạng Anna, policy cho phép, bid thành công |
| 1:00–2:00 | Đổi auction ID/gọi request trực tiếp ngoài phạm vi | Server từ chối dù client tự gửi request |
| 2:00–3:00 | Client lab B trình cùng credential với Anna | Trước revoke, hai client có thể mang cùng danh tính |
| 3:00–4:15 | Thu hồi phiên ở server, gửi lại request cũ | Credential cũ bị từ chối theo policy; không chỉ đổi UI |
| 4:15–5:00 | Thử lệnh nhạy cảm qua kết nối đang mở và reconnect | Lệnh/phiên cũ không vượt kiểm tra; nêu rõ cơ chế thực thi |

Nếu cookie HttpOnly được dùng, harness lab cấp bản sao có kiểm soát; không dùng JavaScript đọc cookie rồi giả vờ đó là khả năng bình thường của trang. Hiển thị session alias/ID nội bộ đã rút gọn; không log raw cookie/token.

Nếu chưa có chức năng chặn trên kết nối dài hạn, ghi nhận đó là phần chưa đạt, không gọi việc logout browser là đã thu hồi đầy đủ. Chuẩn bị recording/screenshot từ chính lab khi lab đã chạy, không tạo ảnh kết quả giả.

## 20. Follow One Request End to End — 4 phút

Quay lại câu hỏi ban đầu. Mình kiểm tra danh tính bằng password, OTP hoặc passkey theo cơ chế đã chọn. Sau đó session/token giúp nhận biết request tiếp theo. Authorization kiểm tra hành động với tài nguyên cụ thể. Và khi có vấn đề, trạng thái thu hồi phải tới được nơi thực thi request và kết nối đang mở.

Khi review một hệ thống auth, mình có thể lấy một hành động như Place Bid và lần theo đúng những điểm đó: bằng chứng ban đầu, credential của request, quyết định quyền và cách chặn lại. Nếu chưa chỉ ra được một điểm, mình đã tìm thấy câu hỏi cần làm rõ trong thiết kế.

**Q&A khoảng 3.5 phút.** Dùng appendix đúng câu hỏi thay vì trình bày tiếp toàn bộ.

## Appendix 21. HOTP and TOTP Verification Details

HOTP tính HMAC với khóa K và counter 8 byte theo quy tắc chuẩn, dynamic truncation rồi lấy modulo theo số chữ số. TOTP dùng `T = floor((UnixTime - T0) / X)` làm counter; X thường là 30 giây nhưng là tham số cấu hình. Hình chính không cần dạy phép toán bit. Test vector RFC 4226: secret ASCII công khai `12345678901234567890`, C=0 cho 755224, C=1 cho 287082. Không dùng secret này trong triển khai.

Verifier cần kiểm soát attempts, lưu trạng thái chống replay nguyên tử và bảo vệ seed. Seed cần dùng để tính mã nên cách bảo vệ khác password hash một chiều. Drift/window là lựa chọn có giới hạn, không mở cửa sổ vô hạn để “đỡ lỗi”. QR enrollment chứa secret phải được xử lý như credential. [S1][S2]

## Appendix 22. Passkey Checks and Account Recovery

Mỗi lần ceremony cần challenge ngẫu nhiên gắn với giao dịch, thời hạn và kiểm soát sử dụng. Backend kiểm tra loại ceremony, origin, RP ID hash, dữ liệu trả về, chữ ký và user presence/verification theo yêu cầu. Không coi `signCount` là bộ phát hiện clone chắc chắn cho mọi passkey, đặc biệt với credential đồng bộ.

User verification có thể dùng PIN/sinh trắc học cục bộ. Synced passkey và device-bound credential có đặc tính triển khai/khôi phục khác nhau; không nói khóa riêng luôn chỉ tồn tại trên đúng một thiết bị. Bảo vệ thêm/xóa passkey, thông báo thay đổi nhạy cảm, recovery và cấp lại phiên. Sinh trắc học không được dùng như một bí mật server có thể thu hồi giống password. [S3][S5]

## Appendix 23. OAuth and OIDC Validation Boundaries

Client kiểm tra ID token theo OIDC: issuer đúng, audience phù hợp, chữ ký/thuật toán đúng, thời hạn và các claim/nonce cần kiểm tra theo flow. Dùng thư viện cấu hình đúng; decode payload không thay validation. API kiểm tra access token cho chính API của nó và kiểm tra scope/quyền/tài nguyên; không đưa ID token vào API như access token.

PKCE ràng buộc code exchange với verifier. State liên quan đối chiếu giao dịch và chống request forgery theo thiết kế; nonce ràng buộc kết quả OIDC với yêu cầu theo flow. Các chuẩn cho phép những cơ chế tương tác cụ thể, nên không phát biểu ba trường này luôn thay nhau hay luôn bắt buộc giống nhau ở mọi flow. Redirect URI, client authentication khi có, HTTPS và việc bảo vệ token vẫn cần riêng. [S4][S9][S12]

## Appendix 24. SSO and Application Identity

SSO là trải nghiệm dùng danh tính tập trung qua nhiều ứng dụng. OIDC hoặc SAML Web SSO có thể thực hiện liên kết tùy nhà cung cấp. Phiên ở IdP và phiên ở ứng dụng là hai phạm vi; logout cần thiết kế theo các phạm vi đó.

Một worker chạy nền có thể gọi API bằng danh tính riêng, không có người dùng đang login. OAuth Client Credentials là một lựa chọn khi có hệ thống OAuth phù hợp. Quyền của worker phải là quyền ứng dụng được cấp, không giả làm quyền của Anna. API key, certificate/mTLS và sender-constrained token có nhiệm vụ và vòng đời riêng; tra chương machine authentication thay vì thêm chúng vào danh sách cách login cho người dùng.

## Appendix 25. A Resource Authorization Decision

Trình tự tham chiếu: middleware xác thực → ánh xạ account nội bộ → tải resource trong ranh giới dữ liệu đúng → authorization service/handler đánh giá actor + action + resource → kiểm tra nghiệp vụ → ghi dữ liệu. Trình tự cụ thể có thể gộp query có phạm vi và policy nhưng không bỏ một ranh giới bắt buộc.

Trong ASP.NET Core, gọi `IAuthorizationService.AuthorizeAsync` với resource và policy/requirement phù hợp; handler nhận resource đã xác định. `[Authorize]` có thể làm cổng chung nhưng một mình nó chưa thể biết mọi quan hệ của auction. Không nhận role/permission từ body của request. Chỉ thiếu đăng nhập và đã xác thực nhưng thiếu quyền là hai trạng thái khác nhau; có thể trả 404 theo chính sách tránh lộ tài nguyên. [S16][S17]

## Appendix 26. Revocation Across Active Requests

Một lệnh revoke chỉ tạo hiệu lực ở nơi trạng thái mới được kiểm tra. Timeline cần thể hiện: nhận yêu cầu revoke → commit trạng thái → cập nhật/invalidate cache → API/handler thấy trạng thái → từ chối credential cũ → xử lý kết nối và request đang chạy theo chính sách.

Với access token kiểm tra offline, chờ hết hạn là chặn có độ trễ. Với introspection/cache, TTL và phân phối trạng thái giới hạn tốc độ chặn. Với version, API phải thực sự so với giá trị hiện tại, chỉ nhét version vào JWT không có tác dụng thu hồi. Thu hồi signing key ảnh hưởng rộng và không nên được coi là cách mặc định để logout một tài khoản.

Khi phát hiện refresh token cũ được trình sau rotation, hệ thống cần quản lý token family và xử lý race/retry theo policy. Xác minh lại quyền truy cập API, refresh và reconnect sau khi xử lý. Không tuyên bố đã giảm thời gian thu hồi nếu chưa đo trên các đường liên quan. [S9][S19][S20][S21]

## Nguồn và giới hạn case thật

- **S1:** [RFC 4226 — HOTP](https://www.rfc-editor.org/rfc/rfc4226.html).
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

Tài liệu eBay xác nhận các tính năng và API công khai đã dẫn. Không có căn cứ từ các nguồn này để khẳng định eBay dùng JWT, BFF, một mô hình quyền cụ thể, hay một hệ thống thu hồi/phát hiện nội bộ cụ thể. Mọi account, auction và đường quyết định của BidLab trong bài là ví dụ giảng giải.
