# Auth — Outline hiện hành

**Cập nhật 20/11/2026.** 16 slide, 38 phút dự toán gồm Q&A. Chưa phải thời lượng đã đo. Không có demo BidLab riêng hoặc appendix. Nội dung SVG hiện tại là chuẩn; đã xuất lại bản `auth_beyond_login_20261120_114026.pptx` với agenda đồng bộ phần Authorization & Custom Auth.

Slide tiếng Anh; [presenter guide](auth-presentation-presenter-guide.md) và [tài liệu học sâu](auth-study-guide.md) tiếng Việt.

| # | Tên slide hiện tại | Mục tiêu | Phút |
|---|---|---|---:|
| 01 | Beyond the Login Screen | Bốn trách nhiệm, không giới hạn cơ chế session. | 1.5 |
| 02 | Agenda | Sáu phần nội dung; không hứa demo/appendix. | 0.5 |
| 03 | Authentication Overview | Tách bằng chứng, nơi xử lý, giao thức và credential request. | 1.5 |
| 04 | Three Types of Authentication Factors | Ba nhóm yếu tố và MFA; sinh trắc/key không loại trừ passkey. | 2 |
| 05 | TOTP: Your Authenticator Works Offline | Cùng secret và bước thời gian; app tạo mã offline. | 2 |
| 06 | Passkeys: Register and Sign In | Đăng ký khác đăng nhập; challenge, ký/xác minh, account binding. | 5 |
| 07 | OIDC: Sign In with an Identity Provider | IdP xác thực; app nhận ID token và quản lý phiên riêng. | 2 |
| 08 | OAuth 2.0: Grant Access to an API | OAuth cấp quyền API; scope, audience, nguồn token. | 2 |
| 09 | Service-to-Service Authentication | Secret, access token, mTLS, signed request bằng danh tính service. | 3 |
| 10 | Sessions and Cookies | Cookie mang dữ liệu; ví dụ session lookup phía server. | 1.5 |
| 11 | Bearer Tokens | Copy token có thể copy luôn chữ ký; bearer không chứng minh người cầm. | 1.5 |
| 12 | Common Authorization Models | RBAC, ABAC, ReBAC, ACL và quyết định trên tài nguyên. | 3 |
| 13 | Custom Authentication: Why and How? | Cấu hình, hook, handler; khác mở rộng authorization. | 2 |
| 14 | Revoking Sessions & Tokens | Session/access/refresh có nơi thu hồi và enforcement khác nhau. | 2.5 |
| 15 | Auth Choices by Architecture | Năm cấu trúc, bốn cột; hướng cân nhắc, không mapping bắt buộc. | 4 |
| 16 | Auth Lifecycle Recap & Q&A | Bốn icon giống bìa; tổng kết và Q&A. | 4 |

## Những quyết định đã chốt

- Authenticate → Stay Signed In → Authorize → Revoke Access xuất hiện nhất quán trên bìa và recap. Icon cùng màu cyan.
- Slide 15 giữ năm cấu trúc: web monolith, web tách API, web+BFF, mobile+API, microservices. Bốn cột phân biệt kiến trúc, request sau login, nơi xử lý login và nhóm yếu tố.
- OIDC/SAML là giao thức, IdP là vai trò. Password/OTP/passkey không bị loại bỏ khi dùng provider. PKCE là chi tiết bảo vệ flow, không phải lựa chọn kiến trúc.
- Microservices có thể kết hợp BFF/web/mobile; cột user factors không mô tả đăng nhập machine-to-machine.
- Slide 14 chỉ giữ hành động thu hồi và takeaway; kết quả/caveat nằm trong tài liệu.
- Không hiển thị trích dẫn ở footer; nguồn vẫn nằm trong tài liệu.
- Chỉ xuất PPTX sau khi người dùng chốt bản cuối. Không tự coi PPTX cũ là bản 16 slide đã cập nhật.

Lịch sử đề xuất ban đầu ở [archive](archive/2026-11-10-auth-presentation-outline-proposal.md).
