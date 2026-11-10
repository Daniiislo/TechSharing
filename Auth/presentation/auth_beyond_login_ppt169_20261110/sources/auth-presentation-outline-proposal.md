# Auth — Beyond the Login Screen: outline đề xuất

Ngày: 10/11/2026. Trạng thái: bản đề xuất để thảo luận, chưa chốt nội dung/thiết kế và chưa tạo PPTX.

## Ràng buộc và mức độ giải thích

- Người dùng xác nhận thời lượng 30–45 phút, gồm demo và Q&A. Đề xuất dùng đủ 45 phút.
- Audience dự kiến kế thừa deck SignalR: dev trong team, quen .NET ở mức khác nhau. Đây là giả định cần giữ khi viết bản chi tiết.
- Mục tiêu: người nghe giải thích được các trách nhiệm của auth, lần theo luồng HOTP/TOTP, passkey và OAuth/OIDC; áp dụng vào một lượt bid; hiểu giới hạn phát hiện và thu hồi credential.
- Mức sâu của phần nói: ai giữ gì, gửi gì, bên nào kiểm tra gì, vì sao cần bước đó và giới hạn chính. Từng trường giao thức, thuật toán mật mã và code tích hợp đầy đủ nằm trong tài liệu/appendix.
- Không thể giải thích mọi cơ chế đến mức triển khai production trong 30–45 phút. Nếu chỉ có 30 phút, cần chốt giảm phạm vi giải thích trực tiếp; không giải quyết bằng nói nhanh hoặc thu nhỏ chữ.

## Những gì kế thừa từ deck trước

Nguồn: `SignalR/presentation/signalr_sharing_ppt169_20261021/design_spec.md`, `SignalR/docs/signalr-presentation-final.md`, `docs/superpowers/specs/2026-10-21-signalr-sharing-design.md`.

- Slide tiếng Anh; nói và presenter guide tiếng Việt; không speaker notes.
- 16:9, PowerPoint chỉnh sửa được, ít chữ, keyword và sơ đồ là chính.
- Nền #F7F9FC, navy #102A43, cyan #007F9E; Cambria cho heading, Segoe UI cho body, Consolas cho code.
- Kể một tình huống xuyên suốt, tiêu đề mang thông điệp/câu hỏi; không biến tài liệu deep-dive thành các trang bullet.
- Dùng lại Anna và Ben cho ví dụ bidding.
- Màu tím/viền đứt của deck trước mang nghĩa SignalR. Chỉ dùng với nghĩa đó khi xuất hiện SignalR; nếu cần quy ước mới cho Auth phải nêu rõ, không tự đổi nghĩa màu.
- Không kế thừa số slide, thời lượng 30 phút hoặc animation như một ràng buộc mới. Thời lượng lần này do người dùng xác nhận riêng.

## Mở bài và thông điệp

Working title: **Auth — Beyond the Login Screen**.

Không tìm thấy đúng nguyên văn một đoạn có tên “Beyond the Login Screen”. Đoạn gần nhất là §1–2 của `auth-deep-dive.md`: xác thực → tạo phiên/token → nhận yêu cầu tiếp theo → kiểm tra phiên/token → kiểm tra quyền và nghiệp vụ → thực hiện hoặc từ chối. Chương `02-sessions-and-tokens.md` mở bằng câu hỏi làm sao nhận ra người đã đăng nhập ở request tiếp theo.

Lời mở đề xuất:

“Anna vừa đăng nhập thành công và bấm Place Bid. Server biết request này vẫn là Anna bằng cách nào? Nếu cô ấy đổi auction ID, cô ấy có được bid ở phiên đấu giá khác không? Nếu ai đó sao chép phiên của Anna, họ có bid được không? Và khi mình khóa tài khoản, kết nối đang mở có dừng lại không?”

Lần lượt mở bốn câu hỏi, không đọc toàn bộ thuật ngữ ngay đầu bài:

1. **Who are you?** — xác thực.
2. **How do we recognize the next request?** — phiên và credential truy cập.
3. **What may you do here?** — phân quyền trên tài nguyên.
4. **How do we stop access?** — phát hiện, thu hồi và khôi phục.

Thông điệp xuyên suốt: hệ thống cần xác thực, duy trì phiên, kiểm tra quyền và chặn truy cập cũ; hoàn thành màn hình login mới giải quyết một phần hành trình.

## Cách tổ chức nội dung

Khuyến nghị: một hành trình bid, giải thích cơ chế khi nó giải quyết câu hỏi vừa xuất hiện.

Hai phương án ít phù hợp hơn: một danh mục công nghệ khó tạo liên hệ giữa các phần; hoặc mở đầu bằng một vụ tấn công dài khiến người nghe phải hiểu session/token trước khi học xác thực. Tình huống đánh cắp sẽ xuất hiện sau khi phiên đã rõ.

Phân loại ngay đầu để tránh đặt các tên ngang hàng:

| Trách nhiệm | Ví dụ |
|---|---|
| Cung cấp bằng chứng xác thực | Password, HOTP/TOTP, passkey |
| Kết hợp loại bằng chứng | MFA, 2FA |
| Duy trì truy cập sau xác thực | Session, cookie, access/refresh token |
| Ủy quyền ứng dụng gọi API | OAuth |
| Nhận kết quả xác thực từ hệ thống khác | OIDC; SAML ở appendix |
| Quyết định quyền với tài nguyên | RBAC, ABAC, ReBAC, policy |

Các cách xác thực có chung mục tiêu kiểm tra danh tính đã khai báo nhưng khác loại bằng chứng, cách kiểm tra, phụ thuộc và rủi ro. OAuth giải quyết ủy quyền API; OIDC bổ sung xác thực trên OAuth, vì vậy không liệt kê “OAuth login” như một loại bằng chứng ngang với password/passkey.

## Roster đề xuất — 20 slide, 45 phút

Thời lượng là dự toán cần rehearsal. Tổng gồm 36 phút nội dung, 5 phút demo và 4 phút kết/Q&A.

| # | English slide title | Nhiệm vụ và hình chính | Phút |
|---|---|---|---:|
| 01 | Beyond the Login Screen | Anna đã login; lần lượt đặt câu hỏi về request, quyền và truy cập bị đánh cắp. | 1.5 |
| 02 | One Bid, Four Security Questions | Một đường đi login → session → bid permission → revoke. Định nghĩa authentication và authorization ngay ở đây. | 1.5 |
| 03 | Different Evidence, the Same Identity Question | Password/OTP/passkey và ba nhóm yếu tố; MFA là từ hai loại yếu tố, 2FA là đúng hai; hai bước không tự bằng hai yếu tố. | 2 |
| 04 | HOTP: Keep the Counters in Sync | Hai phía giữ shared secret + counter; cùng tính mã. Cho thấy tăng counter và lý do có thể lệch. | 2 |
| 05 | TOTP: Let Time Move the Counter | Thay counter sự kiện bằng time step; app offline vẫn tạo mã; server kiểm tra cửa sổ và chống replay. Một chú thích phân biệt TOTP với kênh SMS/email. | 2 |
| 06 | Passkeys: Register a Public Key | Account đã được xác minh → challenge → authenticator tạo cặp khóa → server lưu credential ID/public key. Server phải kiểm tra phản hồi đăng ký. | 2 |
| 07 | Passkeys: Prove Possession Without Sending the Key | Challenge mới → thiết bị cho phép dùng private key → ký → server kiểm tra. Thể hiện ràng buộc website và khác biệt với OTP có thể chuyển tiếp. | 2 |
| 08 | The Next Request Still Needs Proof | Sau login, tạo phiên; request tiếp theo gửi credential truy cập. Cookie và session có vai trò khác nhau. | 1.5 |
| 09 | A Valid Token Can Still Be Stolen | JWT là dạng token; bearer là cách sử dụng. Chữ ký hợp lệ không chứng minh người đang gửi là Anna. | 1.5 |
| 10 | Let an App Act Without Sharing Your Password | Nhu cầu ứng dụng hỗ trợ seller gọi eBay API; bốn vai trò OAuth, scope; phân biệt với login website. | 2 |
| 11 | OAuth Grants Access; OIDC Adds Identity | Một sequence diagram code → đổi token → API; OIDC thêm ID token cho client. Access token và ID token có nơi nhận/mục đích riêng. | 3 |
| 12 | A Stolen Code Should Not Be Enough | PKCE: giữ verifier, gửi challenge, chứng minh verifier khi đổi code. Không bảo vệ access token đã bị đánh cắp. | 2 |
| 13 | Choose Where Credentials Live | Ba hình: web có server; browser gọi API trực tiếp; app mobile. Giới thiệu BFF/SPA sau hình; SSO là nhu cầu riêng có thể kết hợp. | 3 |
| 14 | A Bidder Role Is Only the First Check | RBAC: bidder/organizer/admin; role chỉ là điểm bắt đầu, chưa xác nhận mọi auction. | 1.5 |
| 15 | Can Anna Bid on This Auction? | ABAC/ReBAC/policy qua resource, quan hệ, tenant và hành động; tách permission khỏi điều kiện nghiệp vụ. | 2.5 |
| 16 | Customize the Decision at the Right Layer | Credential validation → identity mapping → resource policy. Một ví dụ ánh xạ subject của IdP sang bidder nội bộ, rồi kiểm tra auction. | 2 |
| 17 | Would We Notice a Stolen Session? | Hai bên dùng cùng credential; tín hiệu là nghi ngờ. Một chuỗi refresh R1 → R2 → R1 xuất hiện lại; chỉ áp dụng nếu hệ thống có rotation. | 2 |
| 18 | Revoked Must Mean Rejected | Session, access token, refresh token, kết nối SignalR; đánh dấu nơi kiểm tra và thời điểm từ chối thực tế. | 2 |
| 19 | Demo: Bid, Deny, Revoke | Ba kết quả live theo kịch bản bên dưới. | 5 |
| 20 | Follow One Request End to End | Quay lại bốn câu hỏi đầu; 30 giây chốt và khoảng 3.5 phút Q&A. | 4 |

## Mức sâu bắt buộc và phần mở rộng

HOTP/TOTP: giải thích secret, moving factor, vì sao hai phía có cùng mã, lệch counter/clock và replay. Không trình bày từng phép bit/truncation trên sân khấu. HOTP không tự hết hạn vì thời gian trôi qua; OTP gửi SMS không tự là TOTP. Không ngụ ý authenticator app luôn chỉ dùng TOTP.

Passkey: giải thích public/private key bằng chức năng ký/kiểm tra trước khi dùng WebAuthn; tách registration khỏi authentication. Private key không gửi tới server; sinh trắc học/PIN kiểm tra cục bộ. Challenge một lần và kiểm tra origin/RP là thành phần cần hiểu. Không khẳng định mọi passkey tự động đáp ứng MFA: phụ thuộc user verification và yêu cầu triển khai. Phải nhắc thêm/đổi authenticator và recovery là đường nhạy cảm.

OAuth/OIDC: giải thích nhu cầu, các vai trò, redirect/code exchange, token nhận ở đâu, token dùng ở đâu. Giới thiệu PKCE ngay trên flow đã có. Không dùng ID token như access token cho API. Không gán flow OIDC/PKCE của demo cho eBay khi nguồn eBay chỉ xác nhận OAuth API.

Sessions: giữ hai slide cầu nối. Nếu bỏ phần này, người nghe không thể giải thích hợp lý token theft, refresh rotation và revoke ở cuối.

Authorization: dùng cùng một câu hỏi “Anna có được bid auction này không?” trước khi đặt tên RBAC/ABAC/ReBAC. Không cần biến thành bốn bài tổng quan riêng. Authorization kiểm tra chủ thể/hành động/tài nguyên; bid cao hơn giá hiện tại và auction chưa kết thúc là điều kiện nghiệp vụ cần được phân biệt, dù đều phải kiểm tra server-side.

Custom auth: làm rõ điểm mở rộng trong hệ thống/.NET, không hướng dẫn tự xây OAuth server hoặc tự viết mật mã. Authentication handler chỉ là một lựa chọn khi thực sự có credential scheme riêng; claims transformation giải quyết ánh xạ/bổ sung identity; policy/resource handler giải quyết quyền, không thay nhau.

Appendix dự kiến 6–8 trang, không tính vào phần nói chính:

- HOTP/TOTP: công thức, test vector, drift/replay/seed protection.
- Passkey: RP ID, origin, challenge, UV, synced/device-bound và recovery.
- OAuth/OIDC: token validation, state/nonce/PKCE có nhiệm vụ riêng, scope/audience và client authentication.
- SSO/SAML: nhu cầu đăng nhập nhiều ứng dụng và giao thức tích hợp.
- Full decision matrix cho web, BFF, browser trực tiếp, mobile và machine-to-machine.
- Resource authorization và ví dụ .NET.
- Refresh rotation/reuse, race/retry và lựa chọn thu hồi.
- Credential lifecycle: mất thiết bị, đổi MFA, thêm khóa, khôi phục tài khoản.

## Giải quyết quá tải thuật ngữ

Mỗi hình mới chỉ thêm một vấn đề mới; giữ vị trí các actor qua các slide.

- **SSO:** “Anna vào ứng dụng thứ hai, hệ thống danh tính đã có phiên nên có thể không cần nhập lại.” Sau đó mới gọi tên Single Sign-On. Không nói SSO là tên một giao thức.
- **SPA:** “Giao diện và logic trang chạy chủ yếu trong browser.” Đặt tên dưới hình browser.
- **BFF:** “Backend gọi API thay browser và giữ token phía server.” Sau khi hiểu hình mới ghi Backend for Frontend. Browser vẫn cần phiên và bảo vệ CSRF/XSS phù hợp.
- **PKCE:** đã giải thích ngay ở OAuth; tới trang chọn kiến trúc chỉ nhắc lại ký hiệu, không dạy lại.
- Tên đầy đủ các acronym đặt ở presenter guide/appendix, chỉ đưa lên slide nếu cần đọc được hình.

Các lựa chọn ở slide 13 là hướng cân nhắc, không phải mapping bắt buộc. SSO, giao thức đăng nhập, cách giữ token và yếu tố xác thực là những trục có thể phối hợp, không phải các phương án loại trừ nhau.

## Case thật và demo

### eBay: điều nguồn công khai xác nhận

- Có passkey và các cách xác thực hai bước được mô tả trong tài liệu tài khoản: [eBay account security](https://www.ebay.com/help/account/protecting-account/tips-keeping-ebay-account-secure?id=4872).
- Developer platform phân biệt Application access token và User access token: [Access token types](https://www.developer.ebay.com/api-docs/static/oauth-token-types.html).
- Ứng dụng seller xin consent, dùng authorization code để lấy User access token và dùng refresh token: [eBay authorization](https://developer.ebay.com/develop/guides/sell/authorization).

Dùng ba chi tiết này làm ví dụ tại các trang passkey/MFA, OAuth và chọn cơ chế. Chúng không đủ để kết luận eBay dùng JWT, RBAC/ABAC nào, BFF hay thuật toán phát hiện gian lận/thu hồi nội bộ nào. Các tài liệu trên mô tả tính năng và API công khai, không phải thiết kế toàn bộ hệ thống bidding của eBay.

### BidLab: demo đề xuất, chưa có tính năng Auth được xác minh/triển khai

Kế thừa Anna/Ben và hình thức lab của buổi SignalR, nhưng cần một bước khảo sát code trước khi chốt kỹ thuật demo.

Kịch bản 5 phút, toàn bộ tài khoản và credential là dữ liệu lab:

1. Anna được xác thực; server chấp nhận một bid đúng phạm vi.
2. Đổi auction ID hoặc gọi API trực tiếp tới tài nguyên ngoài phạm vi: server từ chối dù UI đã ẩn nút. Hiển thị actor/resource/reason, không log raw credential.
3. Một client lab thứ hai giữ bản sao cùng credential, truy cập được trước khi revoke. Thu hồi server-side, thử lại request và kết nối đang mở: phải bị chặn theo chính sách đã chọn. Chỉ gửi logout event cho client chưa đủ.

Không biểu diễn đánh cắp từ người thật hoặc phụ thuộc việc khai thác một trang bên ngoài. Nếu dùng cookie HttpOnly, dùng fixture/harness của lab để cấp bản sao, không giả vờ JavaScript có thể đọc cookie đó.

Nếu demo dùng session cookie, nói đúng session revocation. Nếu muốn demo refresh-token reuse phải bổ sung hẳn kiến trúc/token store cần thiết, không ghép refresh token vào demo cookie chỉ để minh họa.

HOTP/TOTP, passkey và OAuth dùng sơ đồ từng bước trong deck. Có thể thêm demo tùy chọn sau giờ; không nhồi thêm ba live demo vào slot 5 phút. Có screenshot/recording dự phòng của chính lab.

## Các giới hạn kỹ thuật cần giữ đúng

- Không thể luôn phát hiện một credential bị sao chép; bearer credential hợp lệ có thể được trình bởi cả người dùng và attacker.
- IP mới/User-Agent mới là tín hiệu; không là kết luận chắc chắn bị chiếm tài khoản.
- Refresh-token reuse cho thấy token cũ được dùng lại; cần xét race/retry và không tự xác định được ai là attacker.
- Revoke refresh token không tự vô hiệu hóa access token đã phát. JWT kiểm tra offline có thể còn hợp lệ tới hạn nếu không có kiểm tra trạng thái bổ sung.
- Xóa cookie trên một browser không thu hồi bản sao. Cookie ticket tự chứa cũng cần cơ chế kiểm tra trạng thái nếu muốn chặn trước hạn.
- Kết nối SignalR đang mở cần cách thực thi trạng thái thu hồi: ngắt server-side và/hoặc kiểm tra trước lệnh nhạy cảm; không tin client tự ngắt.
- Thu hồi credential bị ảnh hưởng, khôi phục chủ tài khoản và xử lý nguồn lộ là ba công việc liên quan. Thu hồi không lấy lại dữ liệu đã bị tải xuống.

## Nguồn chuẩn cho bước viết chi tiết

- [HOTP — RFC 4226](https://www.rfc-editor.org/rfc/rfc4226.html).
- [TOTP — RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html).
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html).
- [OAuth Security BCP — RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html).
- Nguồn nội bộ: `auth-deep-dive.md`, `01-user-authentication.md`, `02-sessions-and-tokens.md`, `03-oauth-oidc-saml.md`, `04-machine-authentication.md`.

## Các bước sau khi chốt outline

1. Chốt thông điệp từng slide và phần nói tiếng Việt tương ứng; kiểm tra có câu hỏi nào bị đưa tới trước kiến thức nền hay không.
2. Viết rõ từng actor, artifact và điểm kiểm tra của sơ đồ HOTP/TOTP, passkey, OAuth/OIDC, session/revocation; đối chiếu chuẩn.
3. Khảo sát BidLab và chọn một kiến trúc demo nhất quán; chốt tiêu chí bid thành công, truy cập sai phạm vi bị từ chối và credential cũ bị chặn.
4. Dùng ppt-master theo Generate PPTX/Default để chuyển outline đã chốt thành thiết kế và deck; giữ rule cũ, không tự nhận bản đề xuất này là design_spec đã được duyệt.
5. Render/kiểm tra hình, chỉnh sửa được trong PowerPoint; rehearsal có bấm giờ. Nếu quá 45 phút, thu hẹp nội dung live có chủ đích trước khi bỏ các bước giải thích cốt lõi.

Nếu thời lượng cuối cùng là 30 phút: cần chọn ưu tiên. Đề xuất giữ passkey, OAuth/OIDC, quyền theo tài nguyên và revoke ở phần chính; đưa giải thích HOTP/TOTP chi tiết và full architecture matrix sang appendix. Đây là thay đổi scope cần người dùng chọn, chưa phải quyết định đã đồng ý.
