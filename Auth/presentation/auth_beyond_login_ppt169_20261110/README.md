# Auth — Beyond the Login Screen

**Hiện hành: 16 slide, đối chiếu 16/11/2026.** English slides, Vietnamese learning/presenter documents. Không có appendix hoặc demo riêng. Thời lượng dự toán 38 phút gồm Q&A, chưa rehearsal để đo thật.

## Nguồn và trạng thái xuất

- svg_output/ là nguồn biên tập hiện tại; svg_final/ là bản SVG self-contained được tạo lại từ nguồn.
- [Tài liệu học sâu](../../docs/auth-study-guide.md), [presenter guide](../../docs/auth-presentation-presenter-guide.md), [outline hiện hành](../../docs/auth-presentation-outline.md).
- Bản xuất hiện hành: [Auth - Beyond the Login Screen.pptx](../Auth%20-%20Beyond%20the%20Login%20Screen.pptx), đã cập nhật từ `auth_beyond_login_20261120_114026.pptx`, gồm 16 slide; agenda và nhãn phần 03 đã bổ sung Custom Auth. Quality gate và postflight đều passed, không có cảnh báo.
- Các file PPTX không tự cập nhật khi sửa SVG; cần xuất lại và cập nhật bản chính sau mỗi vòng chỉnh sửa.
- Không khẳng định bản 16 slide hiện tại đã được mở/QA trong PowerPoint chỉ dựa vào việc một bản export cũ từng được kiểm tra.

## Biên tập

Dùng PPT Master preview để xem. Mọi thay đổi nội dung phải đồng bộ design_spec.md và tài liệu liên quan; đổi số trang thì cập nhật layout.json, spec_lock.md và roster. Giữ style navy/cyan, Cambria/Segoe UI và tọa độ header/footer theo layout.json. Slide đầu và recap dùng cùng visual lifecycle, icon cùng màu. Footer nguồn đã thay bằng nhãn của bài; nguồn nằm trong tài liệu.

## Thư mục

- svg_output/: 16 trang nguồn SVG.
- svg_final/: 16 trang SVG dẫn xuất; không phải nguồn export PPTX.
- sources/: snapshot đầu vào lịch sử; xem README trong thư mục đó, không dùng thay docs/ hiện hành.
- notes/: không bật speaker notes; lời dẫn là tài liệu riêng.
- images/, icons/, templates/: tài nguyên theo workflow; không tự bổ sung dependency mới.
- live_preview/: trạng thái/log/history của editor.
- validation/: báo cáo kiểm tra; báo cáo cũ chỉ chứng minh đúng artifact lúc nó chạy.
- exports/: các bản PPTX xuất theo thời điểm, không tự cập nhật khi sửa SVG.
- backup/: lịch sử trước sửa; giữ để khôi phục, không dùng làm tài liệu đọc chính.
- analysis/: dữ liệu phân tích/import.

planning-decisions.md giữ lịch sử các quyết định; phần CURRENT STATE ở đầu ghi những điều đã thay thế. Canvas 1280 × 720 (16:9), workspace tạo ngày 10/11/2026.
