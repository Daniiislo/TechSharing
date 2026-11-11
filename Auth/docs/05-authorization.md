# Authorization — Phân quyền trong ứng dụng web và API

Sau khi xác thực Anna, server biết ai đang gửi yêu cầu. Khi Anna muốn đặt giá vào phiên đấu giá 42, **authorization** quyết định cô ấy có quyền thực hiện hành động đó trên phiên này hay không. Một quyết định thường có bốn đầu vào: **chủ thể**, **hành động**, **tài nguyên** và **ngữ cảnh**.

## 1. Các mô hình thường gặp

| Mô hình hoặc cơ chế | Dựa vào đâu để quyết định? | Ví dụ | Khi phù hợp |
|---|---|---|---|
| **RBAC** (Role-Based Access Control) | Vai trò của tài khoản và các quyền gắn với vai trò đó. | Role `Bidder` có permission `bid:place`. | Quyền ổn định theo chức năng, chẳng hạn Bidder, Organizer, Admin. |
| **ABAC** (Attribute-Based Access Control) | Thuộc tính của chủ thể, tài nguyên, hành động hoặc môi trường. | Anna được đọc tài liệu cùng phòng ban nếu mức truy cập của cô đủ cao. | Quyền phụ thuộc phòng ban, mức bảo mật của tài liệu hoặc thời gian truy cập. |
| **ReBAC** (Relationship-Based Access Control) | Quan hệ giữa chủ thể và tài nguyên, có thể đi qua các quan hệ trung gian. | Anna có quan hệ `invited_bidder` với phiên 42. | Quyền phụ thuộc vào chủ sở hữu, lời mời, thành viên nhóm hoặc quyền kế thừa từ thư mục cha. |
| **ACL** (Access Control List) | Danh sách lưu trên hoặc gắn với từng tài nguyên, ghi rõ user hoặc nhóm được làm gì. | Phiên 42 có mục cấp `bid:place` cho Anna. | Cần cấp trực tiếp một số quyền cho từng tài nguyên. ACL là cách biểu diễn quyền và có thể dùng cùng các mô hình trên. |

**DAC** (Discretionary Access Control) mô tả việc chủ thể có thẩm quyền có thể cấp quyền tiếp, ví dụ chủ tài liệu mời người khác chỉnh sửa. **MAC** (Mandatory Access Control) áp dụng quy tắc bắt buộc do hệ thống kiểm soát, ví dụ đối chiếu nhãn phân loại tài liệu với mức clearance. Hai khái niệm này giúp trả lời ai có quyền thay đổi việc cấp quyền. ACL có thể được dùng để triển khai DAC.

## 2. RBAC — Cấp quyền qua role

**Cơ chế.** Khi Anna thực hiện `bid:place`, server tìm các role của Anna trong tenant của phiên đấu giá. Server kiểm tra xem có role nào cấp permission đó hay không. Anna có role `Bidder`, và role `Bidder` có permission `bid:place`, nên điều kiện RBAC đạt. [NIST — Role-Based Access Control](https://csrc.nist.gov/projects/role-based-access-control/faqs).

```text
Anna ── có role trong tenant T1 ──► Bidder ── cấp ──► bid:place
```

**Dữ liệu cần lưu.** Ví dụ này dùng bộ role chung cho mọi tenant, với mỗi lần gán role giới hạn trong một tenant.

| Bảng | Cột chính | Dữ liệu mẫu |
|---|---|---|
| `Roles` | `Id`, `Name` | `bidder`, `Bidder` |
| `UserRoles` | `UserId`, `TenantId`, `RoleId` | `anna`, `T1`, `bidder` |
| `RolePermissions` | `RoleId`, `Permission` | `bidder`, `bid:place` |

**Triển khai.** Server truyền ID người dùng từ principal đã xác thực, tenant từ bản ghi phiên đấu giá và permission từ thao tác đang xử lý. Có ít nhất một dòng kết quả thì điều kiện RBAC đạt.

```sql
SELECT 1
FROM UserRoles AS ur
JOIN RolePermissions AS rp ON rp.RoleId = ur.RoleId
WHERE ur.UserId = @userId
  AND ur.TenantId = @auctionTenantId
  AND rp.Permission = @permission;
```

Tạo ràng buộc duy nhất cho `(UserId, TenantId, RoleId)` và `(RoleId, Permission)`. Khi thêm người dùng có cùng chức năng, gán cùng role. Khi thay đổi quyền của một chức năng, sửa `RolePermissions` để áp dụng cho toàn bộ người có role đó. Dùng RBAC khi nhóm quyền bám theo chức năng như `Bidder`, `Organizer` hoặc `Admin`. Với quyền riêng trên từng phiên, giữ role chung và bổ sung kiểm tra trên phiên cụ thể.

## 3. ABAC — Đánh giá thuộc tính theo policy

**Cơ chế.** Server lấy các thuộc tính cần cho policy rồi đánh giá một biểu thức. Ví dụ công ty cho phép nhân viên đọc tài liệu khi **cùng phòng ban** và **mức truy cập của nhân viên bằng hoặc cao hơn mức bảo mật của tài liệu**. Phòng ban và mức truy cập là thuộc tính của nhân viên. Phòng ban sở hữu và mức bảo mật là thuộc tính của tài liệu. [NIST SP 800-162 — Guide to Attribute Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final).

Anna thuộc phòng A và có mức truy cập `2`. Cùng một người mở ba tài liệu sẽ cho ba kết quả sau.

| Phòng ban của tài liệu | Mức bảo mật | Kết quả |
|---|---:|---|
| A | 2 | Cho phép vì cùng phòng ban và `2 >= 2`. |
| A | 3 | Từ chối vì mức truy cập `2` thấp hơn mức yêu cầu `3`. |
| B | 1 | Từ chối vì khác phòng ban, dù `2 >= 1`. |

**Dữ liệu cần lưu.** `Employees(UserId, DepartmentId, ClearanceLevel)` lưu hồ sơ truy cập của nhân viên. `Documents(Id, DepartmentId, ClassificationLevel)` lưu phòng ban sở hữu và mức bảo mật của từng tài liệu.

**Triển khai.** Khi xử lý `document:read`, server dùng ID từ principal đã xác thực để tải hồ sơ nhân viên và dùng `documentId` từ request để tải bản ghi tài liệu. Nếu tài liệu hoặc bất kỳ thuộc tính bắt buộc nào bị thiếu, server không cấp quyền đọc. Sau khi có đủ dữ liệu hợp lệ, server áp dụng policy.

```csharp
var canRead = employee.DepartmentId == document.DepartmentId
    && employee.ClearanceLevel >= document.ClassificationLevel;
```

Nếu công ty chỉ yêu cầu cùng phòng ban, policy dùng phép so sánh đầu tiên. Điều kiện mức bảo mật là một quy tắc bổ sung. Khi tài liệu của phòng A được nâng từ mức `2` lên `3`, lần kiểm tra đọc tiếp theo dùng mức mới và từ chối Anna.

## 4. ReBAC — Suy ra quyền từ quan hệ

**Cơ chế.** Policy định nghĩa quan hệ nào cấp một khả năng. BidLab có thể cho phép Anna đáp ứng điều kiện lời mời theo hai đường. Cô ấy có lời mời trực tiếp, hoặc cô ấy là thành viên của một team được mời. Cùng một quy tắc có thể kiểm tra lời mời trên phiên 42 và phiên 99, với kết quả tùy dữ liệu từng phiên. [Google Research — Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).

```text
Lời mời trực tiếp   Anna ── được mời ───────────────────────► Phiên 42
Lời mời qua nhóm    Anna ── thành viên ──► Team A ── được mời ──► Phiên 42
```

**Dữ liệu cần lưu.** Một ứng dụng dùng cơ sở dữ liệu quan hệ có thể lưu ba loại quan hệ bằng `AuctionUserInvitations(AuctionId, UserId)`, `AuctionTeamInvitations(AuctionId, TeamId)` và `TeamMembers(TeamId, UserId)`. Ví dụ dưới đây giả định ID phiên và team là duy nhất toàn hệ thống, và thao tác tạo lời mời đã kiểm tra team thuộc cùng tenant với phiên. Chỉ các lời mời và membership còn hiệu lực xuất hiện trong các bảng dùng để kiểm tra. Nếu lưu lịch sử trong cùng bảng, thêm điều kiện trạng thái hoặc hạn dùng vào truy vấn.

**Triển khai.** Trong biểu thức `WHERE` của truy vấn kiểm tra quyền, kiểm tra có ít nhất một đường hợp lệ:

```sql
EXISTS (
    SELECT 1 FROM AuctionUserInvitations
    WHERE AuctionId = @auctionId AND UserId = @userId
)
OR EXISTS (
    SELECT 1
    FROM AuctionTeamInvitations AS ai
    JOIN TeamMembers AS tm ON tm.TeamId = ai.TeamId
    WHERE ai.AuctionId = @auctionId AND tm.UserId = @userId
)
```

Nếu Anna rời Team A, nhánh qua team sẽ mất hiệu lực. Một lời mời trực tiếp còn hiệu lực vẫn đáp ứng điều kiện vì policy dùng `OR`. Dùng bảng và phép `JOIN` khi các đường suy ra quyền ngắn và cố định. Với nhiều loại tài nguyên, nhóm lồng nhau hoặc quyền kế thừa nhiều cấp, cân nhắc dịch vụ authorization có thể đánh giá các đường quan hệ và xác định dữ liệu quyền phải mới đến mức nào.

## 5. ACL — Tra danh sách quyền của từng tài nguyên

**Cơ chế.** Mỗi tài nguyên có thể có danh sách các mục cấp quyền. Một mục xác định **ai** được thực hiện **hành động nào**. Ví dụ dưới đây dùng ACL chỉ chứa các mục `allow`. Nếu không có mục khớp, policy từ chối. [Microsoft Learn — Access Control Lists](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists).

**Dữ liệu cần lưu.** Ví dụ tính năng chia sẻ báo cáo kết quả đấu giá dùng bảng `ResourceGrants(ResourceType, ResourceId, PrincipalType, PrincipalId, Permission)`.

| Tài nguyên | Loại principal | Principal | Permission |
|---|---|---|---|
| `report:42` | `user` | `anna` | `report:view` |
| `report:42` | `group` | `organizers-t1` | `report:edit` |

**Triển khai.** Server truy vấn theo loại tài nguyên, ID và permission. Sau đó kiểm tra mục tương ứng với user hiện tại hoặc một nhóm mà user đang thuộc về. Nhóm cũng có thể được đối chiếu bằng `JOIN` với bảng membership. Với dữ liệu trên, Anna xem được báo cáo 42. Nếu cô ấy không thuộc nhóm `organizers-t1` và không có mục cấp `report:edit` khác, yêu cầu chỉnh sửa bị từ chối. Nếu muốn người có quyền chỉnh sửa đồng thời được xem, policy cần thể hiện điều đó hoặc hệ thống cấp cả hai permission.

```sql
SELECT 1
FROM ResourceGrants AS g
WHERE g.ResourceType = 'report'
  AND g.ResourceId = @reportId
  AND g.Permission = @permission
  AND (
      (g.PrincipalType = 'user' AND g.PrincipalId = @userId)
      OR (g.PrincipalType = 'group' AND EXISTS (
          SELECT 1 FROM GroupMembers AS gm
          WHERE gm.GroupId = g.PrincipalId AND gm.UserId = @userId
      ))
  );
```

Khi xây API chia sẻ, kiểm tra riêng quyền quản lý chia sẻ của người gọi trước khi thêm hoặc xóa grant. Việc xóa grant của Anna chỉ loại bỏ đường cấp trực tiếp. Nếu quyền còn đến từ một nhóm, truy vấn vẫn tìm được mục phù hợp. ACL hữu ích khi người quản lý cần cấp và xem quyền cụ thể trên từng tài nguyên. ReBAC cũng có thể biểu diễn quyền chia sẻ trực tiếp. Khác biệt trong hai ví dụ ở đây là ACL lưu **permission đã cấp**, còn policy ReBAC suy ra khả năng từ **quan hệ nghiệp vụ** như lời mời hoặc membership.

## 6. Một request có thể kết hợp nhiều điều kiện

Trong kịch bản BidLab minh họa, policy cho phép đặt giá khi **cả ba** điều kiện đều đạt.

| Kiểm tra | Phiên 42 | Phiên 99 |
|---|---|---|
| Role Bidder cấp quyền `bid:place` (RBAC) | Có | Có |
| Anna là thành viên đang hoạt động của tenant chứa phiên (điều kiện thuộc tính) | Có | Có |
| Anna được mời vào đúng phiên (điều kiện quan hệ) | Có | Không |
| **Kết quả phân quyền** | **Cho phép** | **Từ chối** |

Với một ứng dụng nội bộ có chức năng ổn định, RBAC có thể đủ cho các thao tác chung. Khi nhiều tenant dùng chung hệ thống, kiểm tra thuộc tính tenant giới hạn phạm vi của role. Khi hai người cùng role và cùng tenant nhưng có quyền khác nhau trên từng tài nguyên, lưu quan hệ hoặc mục ACL phù hợp với cách ứng dụng cấp quyền.

Sau khi phân quyền cho phép, nghiệp vụ vẫn kiểm tra phiên còn mở và số tiền đặt giá hợp lệ. Hai bước trả lời hai câu hỏi khác nhau: Anna có quyền đặt giá ở đây không, và lượt đặt giá cụ thể này có hợp lệ không?

## 7. Role, permission, policy và OAuth scope

- **Role** gom một tập quyền theo chức năng. **Permission** mô tả một khả năng, ví dụ `bid:place`. Ứng dụng có thể áp dụng permission ở phạm vi tenant hoặc tài nguyên.
- **Policy** là quy tắc server đánh giá. **Resource-based authorization** là việc đánh giá quy tắc với một tài nguyên cụ thể. Policy có thể dùng cả role, thuộc tính, quan hệ và dữ liệu cấp quyền trực tiếp.
- **OAuth scope** giới hạn phạm vi truy cập API đã cấp cho client. Nếu API yêu cầu scope `bids:write`, scope đó cho biết token được cấp phạm vi ghi bid. API vẫn kiểm tra quyền đối với phiên 42. [RFC 6749, mục 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3).

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

## 9. Chọn cách triển khai và kiểm thử

| Nhu cầu | Cách bắt đầu |
|---|---|
| Nhiều tài khoản dùng cùng bộ quyền theo chức năng | RBAC với role và permission. |
| Quyền phụ thuộc phòng ban, trạng thái tài khoản hoặc mức bảo mật | Thêm policy ABAC dùng các thuộc tính do server quản lý. |
| Quyền đi theo lời mời, nhóm, chủ sở hữu hoặc tài nguyên cha | ReBAC với các quan hệ biểu diễn đúng nghiệp vụ. |
| Người quản lý chia sẻ một tài nguyên cụ thể cho một user hoặc nhóm | ACL với các mục cấp quyền trên tài nguyên. |

| Ca kiểm thử | Kết quả mong đợi |
|---|---|
| Anna có `bid:place` trong `T1`, là thành viên đang hoạt động và được mời vào phiên 42 thuộc `T1`. | Policy `PlaceBid` cho phép. |
| Anna có lời mời nhưng role không cấp `bid:place`. | Policy từ chối ở điều kiện RBAC. |
| Anna có role và lời mời nhưng membership trong tenant của phiên bị vô hiệu hóa. | Policy từ chối ở điều kiện ABAC. |
| Anna có role và membership hợp lệ, chỉ được mời vào phiên 42, rồi gửi request đặt giá vào phiên 99. | Policy từ chối ở điều kiện ReBAC. |
| Anna chỉ có lời mời qua Team A, sau đó bị xóa khỏi team. | Từ chối sau khi việc thu hồi có hiệu lực ở nguồn dữ liệu mà policy đọc. |
| ACL cấp `report:view` cho Anna trên báo cáo 42, và không có grant nào khác cho Anna. | Xem báo cáo 42 được phép, chỉnh sửa hoặc xem báo cáo 99 bị từ chối. |
| Anna qua policy nhưng đặt giá sau khi phiên đã đóng. | Policy cho phép thao tác, bước kiểm tra nghiệp vụ từ chối lượt đặt giá. |

Đọc cùng slide 12–13 và phần ASP.NET Core ở phụ lục A5 của [Auth — Beyond the Login Screen](../presentation/Auth%20-%20Beyond%20the%20Login%20Screen.pptx). Lời dẫn theo từng slide nằm trong [presenter guide](auth-presentation-presenter-guide.md).

## Nguồn tham khảo

- [NIST — Role-Based Access Control](https://csrc.nist.gov/projects/role-based-access-control).
- [NIST SP 800-162 — Guide to Attribute Based Access Control](https://csrc.nist.gov/pubs/sp/800/162/upd2/final).
- [Google Research — Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).
- [NIST — Access control list](https://csrc.nist.gov/glossary/term/access_control_list), [DAC](https://csrc.nist.gov/glossary/term/discretionary_access_control) và [MAC](https://csrc.nist.gov/glossary/term/mandatory_access_control).
- [Microsoft Learn — Resource-based authorization in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0).
