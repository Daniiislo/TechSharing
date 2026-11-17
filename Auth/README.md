# Auth — Beyond the Login Screen

**Bản đang chỉnh sửa: 16 slide, cập nhật 16/11/2026.** Slide tiếng Anh; tài liệu học và trình bày tiếng Việt. Không có demo/appendix riêng trong bộ hiện tại.

## Đọc theo mục đích

1. [Kiến thức tổng hợp theo từng slide](docs/auth-study-guide.md): tài liệu chính để học sâu, giải đáp câu hỏi và chuẩn bị Q&A.
2. [Hướng dẫn trình bày](docs/auth-presentation-presenter-guide.md): mốc nói ngắn theo đúng 16 slide.
3. [Outline hiện hành](docs/auth-presentation-outline.md): tên slide, mục tiêu và thời lượng dự toán.
4. [Nghiên cứu chuyên đề](docs/auth-deep-dive.md): đường dẫn các chương 01–05 và nội dung mở rộng.

## Slide hiện hành

- [Preview PPT Master](http://127.0.0.1:6060) khi server đang chạy.
- Nguồn biên tập: [svg_output](presentation/auth_beyond_login_ppt169_20261110/svg_output/).
- [README workspace](presentation/auth_beyond_login_ppt169_20261110/README.md) giải thích trạng thái export và thư mục.
- PPTX đã xuất trước đây ở presentation/ có thể cũ hơn SVG. Chỉ xuất lại khi đã chốt bản cuối.

## Demo Auth Lifecycle Lab

[Demo và kịch bản thuyết trình](demo/README.md): Anna đăng nhập, dùng bearer token, được gán tùy ý Bidder/Auctioneer và bị thu hồi quyền/token trong một phiên đấu giá. Demo ASP.NET Core độc lập, không thay đổi bộ 16 slide.

Chạy `dotnet run --project Auth/demo --no-launch-profile`, mở [Auth Lab](http://127.0.0.1:5090).

## Quy ước tài liệu

Tài liệu học sâu và các chương trong docs/ là bản hiện hành. Outline cũ nằm trong docs/archive/. Thư mục sources/ của workspace giữ snapshot đầu vào lịch sử, không phải bản tài liệu đang cập nhật; đọc README tại đó trước khi dùng.

Các ví dụ Anna/Order/Payment/document/auction là minh họa, không mô tả kiến trúc nội bộ của một dịch vụ thật. Demo đã triển khai riêng ở `Auth/demo`; code minh họa trong các chương nghiên cứu không tự trở thành một ứng dụng chạy được.
