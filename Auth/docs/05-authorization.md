# 05. Đã biết người dùng là ai, còn phải kiểm tra họ được làm gì

**Biên tập lại 16/11/2026 — đọc cùng slide 12.** Slide 13 nói về các điểm mở rộng authentication; custom authorization là trách nhiệm khác. Chương này giải thích bốn mô hình bằng cùng một ví dụ trước, rồi mới chuyển tới code .NET và bài toán đấu giá.

[Mục lục chuyên đề](auth-deep-dive.md) · [Học theo slide](auth-study-guide.md#slide-12)

## 1. Hỏi một câu cụ thể trước khi gọi tên mô hình

**An có được sửa tài liệu Kế hoạch Q4 không?** Đây là câu hỏi phân quyền. Việc An đã login thành công chỉ xác định danh tính, không tự cho quyền sửa.

| Đầu vào | Ví dụ |
|---|---|
| Chủ thể | An, lấy từ danh tính đã xác thực |
| Hành động | document.edit, xác định bởi thao tác server |
| Tài nguyên | Document 42 — Kế hoạch Q4 |
| Ngữ cảnh | Thời điểm, trạng thái, tenant, thiết bị… nếu policy cần |

Permission là một khả năng được phép, chẳng hạn document.edit. Role gom quyền theo chức năng. Policy là quy tắc ra quyết định. Scope OAuth giới hạn phạm vi API đã cấp cho client; không tự thay quyền trên từng tài liệu.

Server lấy user từ principal được xác minh, tải tài liệu đúng phạm vi và dùng dữ liệu tin cậy để quyết định. Không tin isOwner, department, tenantId hay userId chỉ vì client gửi. Ẩn nút Edit và dùng ID khó đoán không thay kiểm tra server-side.

## 2. RBAC — An có vai trò nào, vai trò đó cấp quyền gì?

RBAC là Role-Based Access Control. Ví dụ:

~~~text
An → Editor trong Project A
Editor → document.read, document.edit
Document 42 thuộc phạm vi Project A
~~~

Server tìm role của An trong phạm vi cần xét, tra permission gắn role rồi kiểm tra document.edit. Một cách tổ chức dữ liệu:

| Bảng | Dữ liệu ví dụ |
|---|---|
| UserRoles(UserId, ProjectId, RoleId) | An, A, Editor |
| RolePermissions(RoleId, Permission) | Editor, document.edit |

**Điều quyết định quyền:** permission An có qua role trong đúng phạm vi. Editor Project A không tự là Editor mọi project. Nếu có rule theo tài nguyên/trạng thái, thêm rule đó thay vì cho rằng role đã giải quyết hết.

Khi thêm một người có cùng chức năng, gán role. Khi thay bộ quyền của chức năng, đổi RolePermissions. Không nhất thiết dùng role name trực tiếp rải khắp code; ứng dụng có thể kiểm tra permission theo thiết kế.

Nguồn: [NIST RBAC](https://csrc.nist.gov/projects/role-based-access-control/faqs).

## 3. ABAC — Những thuộc tính nào phải thỏa điều kiện?

ABAC là Attribute-Based Access Control. Ví dụ policy cho sửa nếu cùng phòng ban, đủ clearance và tài liệu còn Draft.

| Dữ liệu An | Dữ liệu tài liệu |
|---|---|
| department = Finance | department = Finance |
| clearance = 3 | classificationLevel = 2 |
| accountActive = true | status = Draft |

~~~text
allow edit = accountActive
             AND user.department == document.department
             AND user.clearance >= document.classificationLevel
             AND document.status == Draft
~~~

Server tải hồ sơ An và document 42 từ nguồn tin cậy, kiểm tra thuộc tính bắt buộc rồi đánh giá rule. Thiếu dữ liệu cần thiết không có nghĩa tự cho phép. Hành động và môi trường cũng có thể cung cấp thuộc tính; không chỉ có thông tin user.

Nếu tài liệu đổi Draft → Published, lần kiểm tra dùng trạng thái mới sẽ từ chối An dù role không đổi. Nếu tài liệu nâng level từ 2 lên 4, clearance 3 không còn đủ. Đó là lý do ABAC diễn đạt tốt điều kiện/hạn mức mà không cần tạo role cho mọi tổ hợp.

Đổi giá trị trong DB chưa chắc mọi quyết định thấy ngay: cache hoặc claim cũ có thể tạo độ trễ. Phải biết policy đọc từ đâu và mới tới mức nào.

Nguồn: [NIST SP 800-162 — ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final).

## 4. ReBAC — An có quan hệ gì với tài nguyên?

ReBAC là Relationship-Based Access Control. Dùng cùng tài liệu nhưng biểu diễn quyền bằng quan hệ:

~~~text
An → thành viên → Team Finance
Team Finance → có quyền editor → Folder Budget
Document 42 → thuộc → Folder Budget

Rule: thành viên team có quyền editor trên folder được sửa tài liệu trong folder.
~~~

Server không tự suy cứ “thuộc folder” là có quyền. **Model phải quy định quan hệ nào dẫn tới permission nào.** Dữ liệu quan hệ có thể được lưu như:

| Đối tượng | Quan hệ | Đối tượng liên quan |
|---|---|---|
| Team Finance | member | An |
| Folder Budget | editor | Thành viên Team Finance |
| Document 42 | parent | Folder Budget |

Một ứng dụng nhỏ có thể dùng các bảng SQL và JOIN/EXISTS; ReBAC không bắt buộc graph database. Khi có nhiều loại tài nguyên, nhóm lồng nhau, nhiều cấp kế thừa và truy vấn quyền phức tạp, có thể cân nhắc engine phù hợp.

Nếu An rời team, đường quyền qua team mất hiệu lực khi nơi kiểm tra thấy dữ liệu mới. Nếu An còn editor trực tiếp trên document thì vẫn có thể sửa: policy có thể có nhiều đường OR. Muốn thu hồi hết phải biết tất cả đường cấp liên quan, không chỉ xóa một membership.

Nguồn: [Google Research — Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).

## 5. ACL — Danh sách quyền của tài liệu ghi ai được làm gì?

ACL là Access Control List. Ví dụ khi bấm Share trên document 42:

| Principal | Quyền được cấp |
|---|---|
| An | Read, Edit |
| Bình | Read |
| Team Management | Read, Edit |

Server tra grant cho user hiện tại hoặc group user thuộc về, trên đúng resource và action. Ví dụ dữ liệu:

~~~text
ResourceGrants(ResourceType, ResourceId, PrincipalType, PrincipalId, Permission)
document | 42 | user  | An             | edit
document | 42 | group | TeamManagement | edit
~~~

Ví dụ này dùng allow-only: không có grant phù hợp thì từ chối. Nếu muốn edit bao hàm read, policy phải định nghĩa hoặc cấp cả hai; không tự suy từ tên permission.

Một ACL cụ thể có thể hỗ trợ deny, thứ tự xử lý và kế thừa. Tuân semantics hệ thống, không khẳng định mọi ACL đều “deny luôn thắng” hoặc không có kế thừa. Xóa grant riêng của An cũng chưa chắc mất quyền qua group.

API chia sẻ phải kiểm tra quyền quản lý chia sẻ của bên gọi trước khi thêm/xóa grant. Người được xem tài liệu không tự được cấp quyền cho người khác.

Nguồn: [Microsoft — Access Control Lists](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists).

## 6. Các điểm dễ bối rối cần đặt cạnh nhau

### 6.1. ABAC khác ReBAC thế nào?

| | ABAC | ReBAC |
|---|---|---|
| Trọng tâm mô hình | Thuộc tính và điều kiện | Quan hệ và rule suy quyền |
| Với An sửa document | Cùng phòng ban, đủ clearance, còn Draft? | Có đường quan hệ hợp lệ tới document/folder/project? |
| Ví dụ thay đổi làm mất quyền | Draft → Published | An rời team được cấp editor |
| Nhu cầu nổi bật | Hạn mức, trạng thái, ngữ cảnh | Cộng tác, team/project, kế thừa |

Một bên chủ yếu so giá trị với rule; bên kia chủ yếu xét quan hệ theo model. Nhưng ranh giới không tuyệt đối: thuộc tính có thể được suy từ quan hệ và ReBAC có thể kèm điều kiện. Cùng yêu cầu có thể được biểu diễn theo nhiều cách. Chọn cách phù hợp dữ liệu/nghiệp vụ, không cố phân loại mọi dòng if bằng một nhãn duy nhất.

### 6.2. ACL khác ReBAC thế nào?

ACL thường lưu grant trên tài nguyên; ReBAC thường lưu quan hệ nghiệp vụ rồi suy permission bằng model. ACL có group/kế thừa và ReBAC có viewer/editor trực tiếp có thể trông giống nhau. Không dạy “ACL luôn trực tiếp, ReBAC luôn gián tiếp”.

### 6.3. Policy, DAC và MAC nằm ở đâu?

Policy là quy tắc đánh giá, không phải mô hình thứ năm ngang hàng mọi cơ chế. Nó có thể kết hợp role, thuộc tính, quan hệ và ACL. DAC mô tả khả năng bên có thẩm quyền cấp lại quyền; MAC mô tả quy tắc bắt buộc do hệ thống quản lý. ACL có thể được dùng để triển khai một phần DAC, nhưng không phải từ đồng nghĩa.

### 6.4. Có phải phải chọn duy nhất một loại?

Không. Với document: RBAC cho phép chức năng sửa; ReBAC/ACL giới hạn tài liệu được sửa; ABAC yêu cầu còn Draft. Model phải định nghĩa rõ AND/OR và những điều kiện tenant/tài khoản nào luôn bắt buộc.

Để nối với ví dụ code bên dưới, đổi sang tình huống đấu giá minh họa. Anna được bid khi cả ba điều kiện đạt: có permission bid:place trong tenant của auction; membership tenant còn active; có lời mời vào đúng auction (trực tiếp hoặc qua team theo model). Đây là một policy kết hợp, không phải demo đã triển khai.

### 6.5. Phân quyền khác nghiệp vụ và scope

Anna có quyền bid nhưng bid thấp hơn mức tối thiểu vẫn có thể bị nghiệp vụ từ chối. Scope bids:write cho biết token được cấp phạm vi API; không tự cho quyền vào mọi auction. Một điều kiện trạng thái có thể đặt ở policy hoặc domain theo thiết kế, nhưng phải có trách nhiệm rõ và thực thi nhất quán.

Nguồn: [OAuth scope](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3), [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## 7. Ưu, nhược điểm và khi nào dùng

| Cách | Điểm mạnh | Chi phí/rủi ro quản trị | Nhu cầu phù hợp |
|---|---|---|---|
| RBAC | Dễ gán bộ quyền chung, thay đổi theo vai trò | Role explosion nếu mã hóa mọi ngoại lệ thành role | Chức năng công việc ổn định: Admin, Editor, kế toán |
| ABAC | Rule chung cho nhiều điều kiện/tài nguyên | Thuộc tính sai/cũ, policy chồng chéo, cần giải thích quyết định | Hạn mức duyệt, mức bảo mật, trạng thái, thiết bị/mạng |
| ReBAC | Tự nhiên cho quan hệ và kế thừa | Nhiều đường cấp quyền, cập nhật quan hệ/cache | Workspace, team, project, folder, sở hữu |
| ACL | Trực quan trên từng tài nguyên, dễ chia sẻ ngoại lệ | Nhiều grant riêng lẻ, thu hồi qua group dễ sót | Share file/report cho người hoặc nhóm cụ thể |

Với hệ thống nhỏ, có thể bắt đầu bằng role/permission và kiểm tra tài nguyên rõ ràng. Không thêm engine phức tạp chỉ để có tên ABAC/ReBAC. Nhưng cũng không giữ role toàn cục khi nghiệp vụ đã yêu cầu phân quyền theo tenant/project. Đánh giá theo khả năng quản trị, truy vấn danh sách tài nguyên được xem, thu hồi và giải thích quyết định.

Quyền trong claim/token/cookie không tự đổi khi DB thay đổi. Nếu cần quyền hiện tại, policy phải đọc nguồn mới hoặc có version/revalidation/cache invalidation phù hợp. Request kiểm tra xong rồi mới ghi còn có race; yêu cầu nhất quán trước lúc commit phải được thiết kế ở tầng giao dịch/domain.

## Phần triển khai đọc sau khi đã hiểu mô hình

Ví dụ bên dưới dùng auction thay vì document để nối với tình huống của bài thuyết trình. Đây là mã minh họa có dependencies của ứng dụng, không phải một chương trình standalone hay bằng chứng lab đã triển khai. Giữ các kiểm tra tenant, membership và lời mời như mô tả ở mục 6.4.

## 8. Triển khai policy trên server với ASP.NET Core

1. Xác thực request và lấy danh tính từ principal đã được kiểm tra. Xác định hành động từ thao tác server đang xử lý.
2. Tải tài nguyên trong phạm vi dữ liệu phù hợp. Lấy tenant, role và lời mời từ nguồn server tin cậy. ID tài nguyên từ client chỉ định đối tượng cần tra.
3. Đánh giá policy trên chính tài nguyên đó. Trong ASP.NET Core, có thể dùng `IAuthorizationService.AuthorizeAsync(User, auction, "PlaceBid")` sau khi tải auction. Dùng cùng quy tắc khi thao tác đi qua HTTP API hoặc SignalR.
4. Khi được phép, kiểm tra nghiệp vụ rồi ghi bid. Mặc định từ chối nếu điều kiện bắt buộc thiếu hoặc không đạt. Nếu quyền thay đổi trong khi token còn hạn, quyết định phụ thuộc vào thời điểm server đọc trạng thái quyền hiện tại.

### 8.1. Khai báo policy và viết handler

Ví dụ `PlaceBid` kết hợp ba điều kiện ở mục 6. `IBidAccessReader` là interface truy cập dữ liệu của ứng dụng, với ba phương thức kiểm tra permission, trạng thái thành viên trong tenant của phiên và lời mời. Điều kiện thuộc tính ở đây áp dụng cho phiên đấu giá, theo cùng cách mà policy `document:read` áp dụng thuộc tính của tài liệu ở mục 3. API cần cấu hình authentication để principal có claim ID tương ứng với ID người dùng nội bộ. Ví dụ dùng `ClaimTypes.NameIdentifier`. [Microsoft Learn — Resource-based authorization in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0).

```csharp
public sealed class PlaceBidRequirement : IAuthorizationRequirement { }

public sealed class PlaceBidHandler(IBidAccessReader access)
    : AuthorizationHandler<PlaceBidRequirement, Auction>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PlaceBidRequirement requirement,
        Auction auction)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userId))
            return;

        var hasPermission = await access.HasPermissionAsync(
            userId, auction.TenantId, "bid:place");
        if (!hasPermission)
            return;

        if (!await access.HasActiveMembershipAsync(userId, auction.TenantId))
            return;

        if (await access.HasInvitationAsync(userId, auction.Id))
            context.Succeed(requirement);
    }
}
```

Đăng ký implementation của `IBidAccessReader` trong DI, sau đó đăng ký handler và policy. Đoạn mẫu dùng cú pháp C# 12.

```csharp
builder.Services.AddScoped<IAuthorizationHandler, PlaceBidHandler>();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("PlaceBid", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new PlaceBidRequirement());
    });
});
```

### 8.2. Gọi policy sau khi tải tài nguyên

Ví dụ phần thân của action trên controller đã có `[Authorize]`. `FindAsync` tải phiên theo ID. `PlaceAsync` kiểm tra các điều kiện nghiệp vụ, như trạng thái phiên và mức giá tối thiểu, rồi mới lưu lượt đặt giá. Ánh xạ lỗi nghiệp vụ sang phản hồi phù hợp với hợp đồng API.

```csharp
var auction = await auctions.FindAsync(auctionId);
if (auction is null)
    return NotFound();

var decision = await authorizationService.AuthorizeAsync(User, auction, "PlaceBid");
if (!decision.Succeeded)
    return Forbid();

await bids.PlaceAsync(auction, input.Amount, User);
return NoContent();
```

Với API dùng bearer token, request thiếu thông tin xác thực hợp lệ thường nhận `401`. Một principal đã xác thực nhưng không đạt policy nhận `403` theo ví dụ này. Nếu hợp đồng API yêu cầu che giấu sự tồn tại của phiên đối với người ngoài phạm vi, áp dụng nhất quán cách tải hoặc trả `404` cho phạm vi đó. [Microsoft Learn — Authorization challenge and forbid](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0#challenge-and-forbid).

### 8.3. Quyền thay đổi trong lúc hệ thống hoạt động

- **Quyền nằm trong JWT hoặc cookie.** Nếu handler dùng role claim đã phát trước đó, việc sửa role trong DB chỉ có tác dụng khi ứng dụng làm mới, vô hiệu hóa hoặc kiểm tra lại claim theo cơ chế đã thiết kế. Ví dụ handler trên đọc quyền từ nguồn của ứng dụng theo mỗi quyết định. Nếu thêm cache, định nghĩa thời hạn và cách xóa cache khi quyền bị thu hồi.
- **Quyền thay đổi trong lúc ghi.** Nếu nghiệp vụ yêu cầu từ chối một bid khi việc thu hồi quyền đã có hiệu lực trước lúc ghi, thiết kế kiểm tra và ghi với cơ chế nhất quán phù hợp, chẳng hạn kiểm tra lại trong giao dịch có isolation hoặc khóa phù hợp với cách cập nhật quyền. Việc gọi handler trước khi ghi chỉ kiểm tra trạng thái tại thời điểm đọc.
- **Nhiều đường vào cùng thao tác.** Dùng cùng policy cho các đường ghi được người dùng gọi, chẳng hạn HTTP và SignalR. Với API liệt kê tài nguyên, giới hạn truy vấn theo quyền trước khi phân trang hoặc tính tổng để kết quả phản ánh đúng phạm vi được xem.

## 9. Kiểm thử policy bằng kết quả mong đợi

Bên cạnh happy path, kiểm tra từng điều kiện thất bại độc lập và các đường cấp quyền thay thế.

| Ca kiểm thử | Kết quả mong đợi |
|---|---|
| Anna có `bid:place` trong `T1`, là thành viên đang hoạt động và được mời vào phiên 42 thuộc `T1`. | Policy `PlaceBid` cho phép. |
| Anna có lời mời nhưng role không cấp `bid:place`. | Policy từ chối ở điều kiện RBAC. |
| Anna có role và lời mời nhưng membership trong tenant của phiên bị vô hiệu hóa. | Policy từ chối ở điều kiện ABAC. |
| Anna có role và membership hợp lệ, chỉ được mời vào phiên 42, rồi gửi request đặt giá vào phiên 99. | Policy từ chối ở điều kiện ReBAC. |
| Anna chỉ có lời mời qua Team A, sau đó bị xóa khỏi team. | Từ chối sau khi việc thu hồi có hiệu lực ở nguồn dữ liệu mà policy đọc. |
| ACL cấp `report:view` cho Anna trên báo cáo 42, và không có grant nào khác cho Anna. | Xem báo cáo 42 được phép, chỉnh sửa hoặc xem báo cáo 99 bị từ chối. |
| Anna qua policy nhưng đặt giá sau khi phiên đã đóng. | Policy cho phép thao tác, bước kiểm tra nghiệp vụ từ chối lượt đặt giá. |

Với ví dụ document, thử thêm: An rời team nhưng còn grant trực tiếp; document chuyển Published; user gửi department giả; cùng permission nhưng khác tenant. Kết quả phải theo policy đã định nghĩa, không theo trạng thái UI.

Với listing, giới hạn truy vấn theo quyền trước khi phân trang/tính tổng; không tải tất cả rồi chỉ lọc ở giao diện. Với HTTP và SignalR cùng thực hiện thao tác, dùng cùng quy tắc bắt buộc để tránh đường vòng.

## 10. Tự kiểm tra trước khi giải thích

- Nói được lý do An được sửa document theo từng mô hình mà không chỉ đọc tên viết tắt.
- Chỉ ra một thay đổi thuộc tính và một thay đổi quan hệ làm quyền mất hiệu lực.
- Giải thích vì sao ACL và ReBAC có thể chồng lấn.
- Xác định user/action/resource/context lấy từ đâu và dữ liệu nào không được tin từ client.
- Biết permission cũ trong token được cập nhật hoặc vô hiệu hóa thế nào.
- Giải thích được quyền hành động khác điều kiện hợp lệ của nghiệp vụ.

[Đọc lại theo slide 12](auth-study-guide.md#slide-12) · [Presenter guide](auth-presentation-presenter-guide.md). Bộ 16 slide hiện tại không có appendix hoặc demo riêng.

## Nguồn tham khảo

- [NIST RBAC](https://csrc.nist.gov/projects/role-based-access-control/faqs).
- [NIST ABAC — SP 800-162](https://csrc.nist.gov/pubs/sp/800/162/upd2/final).
- [Google Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).
- [Microsoft ACL](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists).
- [Microsoft resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0).
- [NIST DAC](https://csrc.nist.gov/glossary/term/discretionary_access_control), [NIST MAC](https://csrc.nist.gov/glossary/term/mandatory_access_control).
