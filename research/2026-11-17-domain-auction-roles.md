# Vai trò thực tế trong hệ thống đấu giá

Ngày: 2026-11-17. Phạm vi: khảo sát nhanh tài liệu sản phẩm chính thức để chọn vai trò thay Viewer/Auditor trong Auth Lab; không phải khảo sát thị phần hay thiết kế đầy đủ cho production. Nghiên cứu trực tiếp, quy mô hẹp, giữ quy trình gọn theo yêu cầu trong chat.

## Bằng chứng đã kiểm tra

Easy.Auction phân biệt quyền bán với quyền bid: tài khoản có sell rights mới được đăng vật phẩm; những tài khoản khác có thể chỉ bid. Nhãn Seller được nhà cung cấp gợi ý rõ trong hướng dẫn. [Easy.Auction](https://www.easy.auction/index.php/knowledgebase/17/I-ordered-a-new-site.-What-should-I-do-first.html) (accessed 2026-11-17, confidence: Medium).

AuctionNinja có ví dụ cấu hình quyền cho Customer service representatives và Auction Managers. Nhân viên hỗ trợ có thể xử lý thông tin khách hàng, câu hỏi bidder, xem/in đơn hỗ trợ nhận hàng; Auction Manager được quyền vận hành sale. Tài liệu cũng yêu cầu gán nhân viên vào auction cụ thể, nên không thể suy ra chỉ có RBAC toàn cục. [AuctionNinja](https://support.auctionninja.com/knowledge/vend-resources-admin-management) (accessed 2026-11-17, confidence: Medium).

Auctria, gần với bối cảnh thiện nguyện của demo, dùng mức None, Read Only, User, Power User, Admin. User được thêm participant/item/donor, ghi bid, xử lý checkout; Admin có thêm quyền quản trị tổ chức và hoàn tiền. Hệ thống cho phép quyền khác nhau theo event. Đây là mức quyền tổng quát chứ không phải bộ chức danh nghề nghiệp cố định. [Auctria](https://academy.auctria.com/embed/organizations/users/) (accessed 2026-11-17, confidence: Medium).

BidWrangler liệt kê Admin, Clerk, Cataloger, Consignor. Clerk chỉ có clerking panel; Cataloger truy cập một phần admin liên quan items/import/barcode; Consignor chỉ truy cập auction được giao. Auction Flex 360 cũng nêu Admin, Clerk, Cataloger khi gán role/permission group. Hai nguồn độc lập xác nhận Cataloger/Clerk là những nhóm quyền có dùng trong sản phẩm đấu giá, nhưng không xác nhận một ma trận quyền chung cho mọi sản phẩm. [BidWrangler](https://support.bidwrangler.com/en/articles/2678464), [Auction Flex 360](https://help.auctionflex360.com/en/articles/11951390-add-and-manage-user-accounts) (accessed 2026-11-17, confidence: High cho sự tồn tại các tên role, Medium cho từng quyền riêng của nhà cung cấp).

ListerLeo là công cụ quản lý kho/catalog phục vụ nền tảng auction, không được coi là bằng chứng về mọi chức năng bidder của nền tảng đấu giá. Tài liệu ghi rõ cataloger được tạo, cập nhật và chỉnh sửa hàng loạt auction items; scanner nhận hàng và tạo item; team-lead phụ trách workflow, lots và xuất dữ liệu; org-admin/org-owner phụ trách quản trị. [ListerLeo](https://listerleo.com/docs/help/getting-started) (accessed 2026-11-17, confidence: Medium).

## Kết luận cho demo — đề xuất, không phải chuẩn ngành

Cataloger và Auction Manager có thể tách theo trách nhiệm: biên tập vật phẩm so với vận hành sale. Đề xuất `product:update` cho Cataloger và `event:close` cho người điều hành là thiết kế demo của chúng ta, không phải permission key được lấy nguyên từ vendor. Nếu cùng một nhóm thực hiện cả hai nhiệm vụ, có thể gộp role; tài liệu không chứng minh mọi hệ thống phải tách.

Các lựa chọn có bằng chứng để cân nhắc thêm là Seller/Consignor, Clerk, Customer Service, Auction Manager và Admin. Seller khác nhân viên nội bộ: quyền sửa tài nguyên riêng vẫn cần giới hạn ownership, không thể chỉ kiểm tra một role toàn cục rồi cho sửa mọi item. Demo hiện chỉ dạy RBAC nên cần công khai sự đơn giản hóa này nếu chọn Seller.

Việc giữ đúng ba role là yêu cầu trình diễn, không phải nhu cầu nghiệp vụ đã được chứng minh. Chưa chốt role thứ ba hoặc thay đổi code trong vòng nghiên cứu này; người dùng đang đánh giá mức độ khác biệt giữa Cataloger và Auctioneer.
