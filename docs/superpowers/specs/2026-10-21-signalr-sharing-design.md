# SignalR Tech Sharing: thiết kế tổng

**Ngày viết:** 21/10/2026 · **Buổi sharing:** 23/10/2026 (còn 2 ngày, phải xong toàn bộ và được chỉnh chu) · **Người trình bày:** Tavian Nguyen · **Thư mục:** `SignalR/`

Buổi sharing thứ hai, nối tiếp ProtoLab ("Real-time Communication on the Web"). Tài liệu này mô tả đủ để lập kế hoạch và làm 3 sản phẩm: **tài liệu**, **slide**, **demo**.

## 1. Ý định và lý do

Người nghe là dev trong team và đã dự buổi ProtoLab. Họ đã tự tay thấy Polling, Long polling, SSE, WebSocket và chuyện phải tự lo mất kết nối. Buổi này trả lời câu hỏi tiếp theo: **"Đã có WebSocket, sao còn cần SignalR?"**

Thông điệp xuyên suốt: **SignalR là framework real-time, không phải một transport.** Nó tự chọn transport (WebSocket → SSE → Long polling), quản lý connection và reconnect, cho RPC hai chiều giữa client và server, định tuyến tới All/Caller/User/Group, và scale-out qua backplane. Dev chỉ còn viết business logic. TravelPledgeAuctions là ví dụ thật: Geronimo viết khá ít code SignalR mà sync được bid cho mọi user.

Thành công nghĩa là sau 30 phút người nghe:
- nói được SignalR làm gì thay mình, và khi nào nên hoặc không nên dùng nó;
- nhìn sơ đồ là hiểu một bid đi từ nút PLACE BID tới màn hình người khác ra sao, chỗ nào là code Geronimo, chỗ nào SignalR làm;
- biết vài best practice và lỗi hay gặp, lấy từ chính code của team.

## 2. Mục tiêu, ngoài phạm vi, phản mục tiêu

**Mục tiêu**
1. Bốn phần nội dung theo yêu cầu của bạn: (1) SignalR là gì, giúp gì, dùng vào việc gì, vì sao chọn nó; (2) setup ở mức high-level: mindset, các bước, chuẩn bị, requirement, không đi vào code cài đặt; (3) Geronimo dùng SignalR ở TravelPledgeAuctions, đi từ high-level xuống detail bằng diagram, chia **Phase 1: kết nối vào bid** và **Phase 2: bid và nhận cập nhật**; (4) best practice và những gì nên tránh.
2. Ở phần (3), **slide cũng phải có diagram flow code**: hàm nào gọi hàm nào, xử lý gì. Không để phần này chỉ có trong demo (bạn đã xác nhận).
3. Demo chạy trực tiếp ở slide "Demo – Q&A".

**Ngoài phạm vi**
- Hướng dẫn cài SignalR vào source từng dòng.
- Chi tiết frame/opcode WebSocket (đã nói ở ProtoLab).
- Azure SignalR Service, MessagePack, streaming: mỗi thứ chỉ nhắc một dòng nếu cần.
- Chạy demo nhiều server kèm Redis thật (xem §6.4).

**Phản mục tiêu** (có làm đúng kỹ thuật thì vẫn tính là hỏng)
- Mô phỏng không phân biệt được SignalR đã làm gì và code Geronimo làm gì. Đây là yêu cầu cốt lõi của bạn.
- Slide nhiều chữ. Slide chỉ dùng keyword và diagram, lời giải thích nằm ở presenter guide.
- Giao diện demo chật hoặc xấu, hoặc trang bid không giống TravelPledgeAuctions.
- Trình bày các điểm yếu trong code Geronimo theo giọng chê bai. Nêu thành "bài học / cách làm tốt hơn".
- Bịa số liệu benchmark hoặc nói về production những điều chưa kiểm chứng.

## 3. Ràng buộc

- **Thời lượng 30 phút cho tất cả**, demo nằm trong đó. Phân bổ đề xuất (my call): Phần 1 khoảng 7′, Phần 2 khoảng 4′, Phần 3 khoảng 10′, Phần 4 khoảng 4′, Demo và Q&A khoảng 5′.
- **Theo chuẩn deck ProtoLab** (`protolab/presentation/realtime_web_20261007/design_spec.md`):
  - slide tiếng Anh, thuyết trình tiếng Việt, **không speaker notes**, 16:9;
  - ít chữ, keyword;
  - sơ đồ native chỉnh được trong PowerPoint;
  - bảng màu off-white `#F7F9FC`, navy `#102A43`, cyan `#007F9E`, nền nhấn `#E8F4F8`.
  - Thêm một màu cho SignalR: **tím `#5B21B6`, nền `#F1EBFD`, viền đứt**, dùng thống nhất ở cả slide và demo.
- Slide làm bằng skill **ppt-master**.
- Demo: khi làm UI phải áp dụng **frontend-design** (đã cài ở `~/.claude/skills/frontend-design`) và **front-end-checklist** (bạn yêu cầu).
- Máy có .NET SDK 8.0.100 và 10.0.301, Node 22.22, Docker.
- Code nguồn tham chiếu: `D:\Geronimo\Geronimo\Geronimo\Sites\TravelPledgeAuctions` (.NET 8 Razor Pages). Có một bản sao ở `D:\Geronimo\internship-training`; dùng bản `Geronimo\Geronimo`.

## 4. Sự thật từ code TravelPledgeAuctions (nền cho phần 3 và 4)

Đã đọc trực tiếp. Builder dùng những điểm này, có thể trích file:line.

**Server**
- `Program.cs:216-219`: `AddSignalR(o => o.EnableDetailedErrors = true).AddStackExchangeRedis(...)`, tức là có **Redis backplane**. `Program.cs:117-118` map `/bidhub` và `/eventhub`. **Không map `MessageHub`.**
- `Hubs/BidHub.cs`: hai method client gọi được là `AddBid(itemId, bidderId, bidAmount, isBuyNow, isMaxBid)` và `AddBids(... , itemQuantity)`. `AddBid` gồm 6 bước:
  1. `GetBidContextAsync`: user và item từ Redis cache, highest bid và highest max bid, event, `CanBidderBid`.
  2. `ValidateBidRequest`. Nếu không hợp lệ thì `DetermineValidationFailureReason` trả về `ITEM_CLOSED`, `ALREADY_WON`, `BUY_NOW_UNAVAILABLE`, `BID_TOO_LOW` hoặc `QUANTITY_UNAVAILABLE`, rồi `HandleValidationFailureAsync` gửi `addBidFail` cho Caller và phát `updateItem`/`updateEvent` trạng thái hiện tại cho All.
  3. `ProcessBidCreationAsync`: nếu bật popcorn bidding thì `ExtendClosingTimeAsync` chạy **trước** `BidService.CreateBid` để tránh race với job đóng item. `CreateBid` xử lý cả proxy/max bid tự động.
  4. `ProcessPostBidActionsAsync`: đăng ký user vào event, thêm vào watchlist.
  5. `HandleBuyNowPurchaseAsync`.
  6. `BroadcastBidUpdateAsync`: `Clients.All.SendAsync("updateItem", 9 tham số)`, `Clients.All.SendAsync("updateEvent", 7 tham số)`, `Clients.Caller.SendAsync("addBidSuccess", itemId, bidderId, isHighBidder)`. High bidder lấy từ `HighBidUserId` vì max bid của người khác có thể thắng ngay (có comment "CRITICAL BUG FIX").
- `Hubs/EventHub.cs` có `closeItem`, `closeItems`, `closeEvent`. Thực tế server gửi qua **`IHubContext<EventHub>`** từ `ItemService.CloseItemForBidding` (`ItemService.cs:574`) và `Jobs/CloseItemAndEventQuartzJob`. Đây là ví dụ **server tự đẩy, không cần client gọi**.
- `Services/Notifications/WebService.cs` dùng `IHubContext<MessageHub>` với `Clients.User(userId)`.

**Client** (bundle `wwwroot/js/signalr/dist/browser/signalr.js`, nạp trong `_LayoutEvent.cshtml:99`)
- `itemBid.js` (trang Item):
  - `new HubConnectionBuilder().withUrl("/bidhub").withAutomaticReconnect().build()`;
  - nút bid bị disable tới khi `start()` xong;
  - PLACE BID mở panel confirm, `confirm-bid-button` mới gọi `connection.invoke("AddBid", ...)`; nếu lỗi thì `reload()`;
  - handler: `addBidSuccess`, `addBidFail`, `updateItem`;
  - `onreconnecting`/`onreconnected`/`onclose` hiện thông báo "Connection to WinningBidder.com was lost…".
- `eventBidUpdates.js` (trang Event): hai connection `/bidhub` và `/eventhub`; `updateEvent` cập nhật tile, sort lại, highlight; `closeItem(s)`/`closeEvent` xử lý đóng.
- `TPAuctions_SignalR.js`: build connection tới `/messagehub` nhưng **không gọi `start()`**, và server không map hub này.

**Quan sát cho phần best practice** (trình bày như bài học, nên xác nhận lại với team trước buổi nói)
- Dùng `Clients.All` cho mọi bid: mọi client ở mọi event đều nhận, client tự lọc theo `#item_<id>`. Nên dùng **Groups** theo event/item.
- **Lỗ hổng (bạn đã quyết: trình bày thẳng là lỗ hổng):** `BidHub.AddBid` (`BidHub.cs:403`) nhận `bidderId` do client gửi (hidden field `#bidder-id`, `itemBid.js:920`). Hub không có `[Authorize]` và không dùng `Context.UserIdentifier`, nên ai mở console gọi `connection.invoke("AddBid", item, "<id người khác>", …)` là bid dưới tên người khác. Cách sửa: `[Authorize]` cộng lấy user từ `Context.UserIdentifier`, bỏ tham số `bidderId`.
- `EnableDetailedErrors = true` không phân biệt môi trường. Chỉ nên bật ở Development.
- Không có `OnConnectedAsync`/`OnDisconnectedAsync`. Sau khi reconnect, client không chủ động lấy lại trạng thái bị lỡ. Nên **resync sau `onreconnected`**.
- Đường `MessageHub` có vẻ không hoạt động (không map, không start). Cần xác nhận rồi mới nói.
- Điểm làm tốt nên khen: gom data một lần (`BidContext`), popcorn extend trước khi create, `HighBidUserId`, đẩy từ background job qua `IHubContext`, `withAutomaticReconnect` kèm UI báo trạng thái, Redis backplane.

## 5. Sản phẩm 1: tài liệu (tiếng Việt)

Đặt ở `SignalR/docs/`:

1. **`signalr-deep-dive.md`**: tài liệu học thuật và lý thuyết, giống `protolab/presentation/docs/sse-websocket-signalr-deep-dive-and-challenge-questions.md`. Nội dung:
   - kiến trúc SignalR: Hub, HubConnection, HubLifetimeManager, Hub Protocol (JSON/MessagePack, ký tự phân tách `0x1E`), negotiate, transport fallback, handshake, keep-alive/timeout, reconnect;
   - mô hình gửi (All/Caller/Others/User/Group), `IHubContext`, scale-out (sticky session, Redis backplane, Azure SignalR);
   - so sánh với WebSocket thuần, SSE, Socket.IO, dịch vụ managed;
   - setup mindset;
   - walkthrough Geronimo có file:line và sơ đồ Mermaid;
   - best practice;
   - **câu hỏi phản biện kèm trả lời** để chuẩn bị Q&A.
   - Dẫn nguồn Microsoft Learn (docs ASP.NET Core SignalR) và spec Hub Protocol trên GitHub `dotnet/aspnetcore`. Kiểm tra từng nguồn khi viết, không trích từ trí nhớ.
2. **`signalr-presentation-final.md`**: presenter guide bám từng slide, giống `real-time-communication-presentation-final.md`. Gồm thông điệp, agenda, nội dung nói cho mỗi slide, câu chuyển phần, thời lượng, kịch bản demo từng bước, và phương án dự phòng nếu demo lỗi.

## 6. Sản phẩm 2: slide (ppt-master, tiếng Anh)

Workspace ppt-master đặt trong `SignalR/presentation/`, xuất `.pptx`. Khoảng 14 slide. Đề xuất (builder chỉnh được, giữ 4 phần và có diagram ở phần 3):

| # | Slide | Nội dung chính |
|---|---|---|
| 1 | Cover: *SignalR — More Than WebSocket* | |
| 2 | Agenda | 4 phần + Demo |
| 3 | What we hand-built in ProtoLab | Những việc tự làm: reconnect, routing, fan-out, fallback, format message → nối sang SignalR |
| 4 | What SignalR is | Sơ đồ lớp: App code / SignalR (dải tím) / Transport |
| 5 | What it does for you | Transport negotiation · Auto reconnect · RPC · All/User/Group · Scale-out · Auth |
| 6 | When to use / not | So với raw WS, SSE, polling, Socket.IO, managed |
| 7 | Getting ready | Mindset và các bước high-level: server (built-in ASP.NET Core) → map hub → client lib → auth → hạ tầng (proxy cho WebSocket, sticky session, backplane) |
| 8 | TravelPledgeAuctions at a glance | 3 hub, ai gọi ai, Redis backplane, Quartz/`IHubContext` |
| 9 | Phase 1: Connecting to a bid | Sơ đồ tuần tự: `build()` → `start()` → negotiate → WebSocket → handshake → bật nút bid; reconnect |
| 10 | Phase 2a: Placing a bid | **Sơ đồ flow hàm**: click → confirm → `invoke("AddBid")` → dispatch → 6 bước `AddBid` |
| 11 | Phase 2b: Everyone gets the update | **Sơ đồ fan-out**: `Clients.All`/`Caller` → backplane → `on("updateItem")`/`updateEvent`/`addBidSuccess` → UI |
| 12 | Server-initiated: closing items | Quartz → `IHubContext<EventHub>` → `closeItem` |
| 13 | Best practices & pitfalls | Do/Avoid, có ví dụ từ §4. **Lỗ hổng `bidderId` nêu thẳng nhưng gọn**: hình minh họa (console → `invoke` với id người khác → bid đứng tên nạn nhân) với vài keyword như *client-supplied identity*, *no [Authorize]*, *fix: Context.UserIdentifier*. Không đoạn văn, phần giải thích do bạn nói. Nếu không đủ chỗ thì tách thành slide 13b. |
| 14 | Demo & Q&A | |

Slide 9–12 dùng quy ước hai màu như demo (cyan viền liền = code Geronimo, tím viền đứt = SignalR), tên hàm viết bằng font mono. Trước khi làm, tham chiếu deck ProtoLab và `design_spec.md` của nó.

## 7. Sản phẩm 3: demo "SignalR BidLab"

Mockup đã được duyệt: `.superpowers/brainstorm/1316-1792550005/content/demo-layout-v4.html`.

### 7.1 Bố cục (đã chốt)

- Thanh trên: tiêu đề, công tắc **① Kết nối vào bid / ② Bid & nhận cập nhật**, chú giải hai màu (kèm chữ và kiểu viền, không chỉ dựa vào màu).
- **Trái, hai ngăn trên dưới:** mỗi ngăn là một khung trình duyệt (An ở trên, Bình ở dưới). Bên trong là **bản clone giống hệt trang Item của TravelPledgeAuctions**, gồm:
  - Bootstrap 4.5.2;
  - giá trị CSS lấy từ `TPAuctions.css`, `item.css` và style inline trong `Item.cshtml`;
  - header charity, line-header "Item #", ảnh và vòng bid count;
  - title, location, watchlist;
  - banner winning (`#52b05f`) và outbid (`#ffc107`);
  - Current Bid (`#007bff`);
  - −/input/+, tab Exact/Maximum, PLACE BID (`#385e7c`), panel confirm, Buy it now, Time left;
  - toastr cho `addBidSuccess`/`addBidFail`;
  - banner mất kết nối.
- **Phải, mô phỏng:**
  - sơ đồ SVG ba lớp × ba cột (An | Server | Bình), dải SignalR tím nằm ngang làm điểm nhấn duy nhất, Redis backplane dưới server, gói tin chạy theo đường đi;
  - danh sách bước, mỗi bước có tag Geronimo hoặc SignalR;
  - ô chi tiết: ai làm, tên hàm, frame JSON thật, câu "Không có SignalR: …";
  - điều khiển Trước / Chạy / Tiếp / tốc độ.

### 7.2 Hành vi

- **Phase 1:** bấm kết nối cho từng user → hiện negotiate, transport được chọn, handshake `{"protocol":"json","version":1}`, connectionId, ping, nút bid được bật. Có nút **"Ngắt mạng"** để thấy `onreconnecting`, banner, tự kết nối lại (backoff 0/2/10/30s), `onreconnected` (my call, vì reconnect là giá trị lớn của SignalR so với ProtoLab).
- **Phase 2:** An bid → 8 bước như mockup (click/confirm → đóng gói Invocation → dispatch tới `BidHub.AddBid` → 6 bước xử lý → `Clients.All` updateItem → `Clients.Caller` addBidSuccess → nhận frame → handler cập nhật UI). Bình chuyển sang banner outbid, giá mới, bid count tăng.
- Kịch bản phụ (my call, vì đều có trong code thật):
  - **bid quá thấp**: `addBidFail BID_TOO_LOW` chỉ cho Caller, All vẫn nhận state hiện tại;
  - **max bid**: Bình có max bid, An bid và bị vượt ngay, toast "immediately outbid by another bidder's max bid", minh họa `HighBidUserId`.
- Mỗi bước có thể chạy tự động hoặc từng bước. Tốc độ chậm để thuyết trình.

### 7.3 Nguyên tắc trung thực

Mô phỏng phải dựa trên **SignalR chạy thật**, không phải animation kịch bản:
- Frame hiển thị là frame thật đi qua connection.
- Các bước server là trace phát ra từ code thật đang chạy.
- Logic bid đơn giản hóa từ `BidHub`/`BidService` nhưng **giữ đúng tên hàm, thứ tự bước, tên event và thứ tự tham số** như TravelPledgeAuctions.

**Chạy thật nhưng xem chậm được (my call).** Round trip thật chỉ mất vài mili giây, nên làm như sau:
- Bid chạy thật hết một lượt. Server ghi trace từng bước, client ghi lại mọi frame thật gửi và nhận.
- Ở phía client, frame nhận về được **giữ trong hàng đợi**. Handler thật (`updateItem`, `addBidSuccess`, …) chỉ áp vào giao diện An và Bình khi animation chạy tới đúng bước đó. Nhờ vậy người xem thấy gói tin tới nơi rồi màn hình mới đổi.
- "Trước" chỉ tua lại hình ảnh và trạng thái hiển thị, không hoàn tác bid trên server.
- Không làm phương án hub tạm dừng giữa các bước chờ người bấm, vì sẽ chặn hub và không tua lại được.

### 7.4 Kỹ thuật (my call, builder có thể đề xuất khác nếu giữ được §7.3)

- Backend: **ASP.NET Core (.NET 8) minimal app**, SignalR built-in, dữ liệu in-memory, một process, đặt ở `SignalR/bidlab/`.
- Frontend: HTML/CSS/JS thuần, dùng `@microsoft/signalr` browser bundle và Bootstrap 4.5.2 cho phần clone. Một trang chứa **hai `HubConnection` thật** (An, Bình).
- Lấy frame thật: client logger của SignalR với `logMessageContent: true`, hoặc bọc transport. Bước server: hub ghi trace và gửi tới một kênh trace riêng mà UI mô phỏng nghe. Kênh trace không được xuất hiện trong luồng chính như thể là của Geronimo.
- Demo **giữ y nguyên** việc client gửi `bidderId` cho giống thật (my call). Ô chi tiết của bước `invoke` có ghi chú lỗ hổng để nối với slide 13. Không làm kịch bản tấn công.
- Redis backplane chỉ **hiển thị như một node** kèm chú thích "production: Redis, nhiều server"; demo không chạy Redis.
- Chạy được ở 1920×1080 khi trình chiếu. Responsive tối thiểu và reduced motion theo front-end-checklist.
- Có một kiểm tra chạy được, ví dụ test tích hợp nhỏ: hai client, một bid, client kia nhận `updateItem`.

## 8. Thứ tự làm (2 ngày)

Demo lớn và rủi ro nhất nên **làm song song với tài liệu**, không để cuối:
- **Ngày 1:** `signalr-deep-dive.md` chạy song song với khung demo (backend .NET, hai connection thật, Phase 2 luồng chính, trang clone).
- **Ngày 2:** slide (ppt-master, dựa trên deep-dive), demo hoàn thiện (Phase 1 và reconnect, kịch bản phụ, polish theo frontend-design và front-end-checklist), `signalr-presentation-final.md` (cần slide chốt trước), rồi tổng duyệt và sửa.

**Nếu thiếu thời gian, cắt theo thứ tự:** (1) kịch bản max bid, (2) kịch bản bid quá thấp, (3) nút Ngắt mạng/reconnect trong demo (vẫn giữ trên slide). Không cắt: luồng chính Phase 2, Phase 1 connect, độ giống của trang clone, diagram flow code trên slide.

Sau khi bạn duyệt tài liệu này, bước tiếp theo là kế hoạch triển khai chi tiết.

## 9. Để builder quyết định

- Câu chữ và thứ tự chi tiết trong từng slide (giữ 4 phần, các slide diagram ở phần 3 và tổng thời lượng).
- Dữ liệu mẫu (charity, item, giá). Mockup dùng Hope Foundation, Maui Getaway, $1,250 → $1,300.
- Cấu trúc thư mục bên trong `SignalR/`, tên file con.
- Cơ chế cụ thể để bắt frame và trace, miễn đúng §7.3.
