# SignalR — More Than WebSocket: Presenter Guide

**Người trình bày:** Tavian Nguyen
**Buổi nói:** 23/10/2026 · 30 phút (kể cả demo và Q&A)
**Deck:** [SignalR - More Than WebSocket.pptx](../presentation/SignalR%20-%20More%20Than%20WebSocket.pptx) (16 slide gồm 15 slide chính và 1 slide backup, tiếng Anh, không có speaker notes)
**Demo:** SignalR BidLab, chạy bằng `dotnet run --project SignalR/bidlab/src/BidLab` rồi mở http://127.0.0.1:5080
**Tài liệu nền:** [signalr-deep-dive.md](./signalr-deep-dive.md) (nguồn, file:line, câu hỏi phản biện)

Slide chỉ có keyword và sơ đồ; lời giải thích nằm ở tài liệu này. Trên slide dùng tên **Anna** (người bid) và **Ben** (người đang xem). Không nhắc ProtoLab trên slide; khi nói có thể liên hệ nếu thấy hợp.

## 1. Thông điệp xuyên suốt

**SignalR là thư viện real-time, không phải một transport.** Nó thương lượng transport, giữ kết nối sống, biến lời gọi hàm thành message và phát tới đúng người. Mình viết business logic, nhưng **danh tính và những gì mình broadcast vẫn là trách nhiệm của mình**.

Slide dùng chữ **library** (đúng cách Microsoft gọi). Khi nói có thể thêm "làm nhiều hơn một transport" để người nghe không hiểu nhầm là nó chỉ gói WebSocket.

Quy ước màu dùng chung cho slide và demo:
- **Cyan, viền liền:** code Geronimo viết.
- **Tím, viền đứt:** SignalR tự làm.

Nhắc quy ước này một lần ở slide 04 (slide 08 có chú giải màu, tức Geronimo code / SignalR / WebSocket), sau đó người nghe tự đọc được mọi sơ đồ.

## 2. Phân bổ thời gian

| Phần | Slide | Phút |
| --- | --- | ---: |
| Mở đầu | 01–02 | 1,5 |
| 1 · SignalR là gì | 03–06 | 5,5 |
| 2 · Chuẩn bị gì | 07 | 4 |
| 3 · Geronimo sync bid thế nào | 08–12 | 9,5 |
| 4 · Best practices: Do & Avoid | 13–14 | 4 |
| Demo & Q&A | 15 | 5 |
| **Tổng** | | **29,5** |

Nếu trễ giờ: rút slide 06 (chỉ đọc dòng "Best fit") và slide 12 (một câu), giữ nguyên phần 3 và 4.

## 3. Nội dung theo từng slide

### Slide 01 — SignalR — More Than WebSocket (30 giây)

Mở bằng câu hook trên slide: một cú click, mọi màn hình đổi theo. Chỉ vào hai khung trình duyệt bên phải: Anna giữ giá $1,300, Ben bị outbid, ở giữa là dải tím "SignalR · updateItem".

**Chuyển:** "Ai đã làm việc đó? Hôm nay mình lần theo dấu vết của đúng một lượt bid."

### Slide 02 — Anna clicks. Ben's price changes. (1 phút)

Kể khoảnh khắc: Anna bấm PLACE BID rồi CONFIRM trên Item #12. Ben không refresh, không có code polling, vậy mà giá đổi và banner "You have been outbid" hiện ra ngay.

Bốn câu hỏi bên phải chính là agenda. Cuối buổi sẽ chạy lại đúng lượt bid này trong BidLab.

### Slide 03 — Everything raw WebSocket leaves to you (1,5 phút)

Đọc theo từng hàng: bên trái là những việc phải tự viết khi chỉ có WebSocket, bên phải là thứ SignalR làm sẵn.
- Vòng reconnect → `withAutomaticReconnect()`.
- Fallback khi proxy chặn WebSocket → WebSockets › SSE › Long Polling.
- Tự định nghĩa format message → Hub Protocol (JSON hoặc MessagePack).
- Ghép request với response → `invoke()` + `invocationId`.
- Danh sách socket và vòng broadcast → `Clients.All / Caller / User / Group`.
- Đồng bộ nhiều server → Redis backplane hoặc Azure SignalR.

**Chốt:** phần "đường ống" là thứ SignalR bán cho mình.

### Slide 04 — A real-time library, not a transport (1,5 phút)

Ba lớp từ trên xuống:
- **Code của mình:** hub methods, client handlers, business rules.
- **Lớp SignalR (dải tím):** HubConnection ở client, Hub dispatch, HubLifetimeManager (giữ danh sách connection và phát), Hub Protocol, Negotiate, Keep-alive và reconnect.
- **Transport:** WebSocket, SSE hoặc Long Polling, do SignalR tự chọn.

Ghi chú lề: SignalR có sẵn trong ASP.NET Core (`AddSignalR()` + `MapHub()`); có client JavaScript, .NET, Java.

**Giới thiệu quy ước màu ở đây.**

### Slide 05 — Six jobs you no longer write (1,5 phút)

Sáu việc, đọc nhanh:
- **Negotiate:** chọn transport tốt nhất cả hai bên hỗ trợ.
- **Stay alive:** ping mỗi 15 giây; client coi là mất kết nối sau 30 giây im lặng.
- **Reconnect:** thử lại sau 0, 2, 10, 30 giây rồi dừng.
- **RPC hai chiều:** client gọi server bằng `invoke()`, server gọi client và client nhận bằng `on()`.
- **Targeting:** All, Caller, Others, User, Group.
- **Scale-out:** Redis backplane hoặc Azure SignalR Service.

Các con số mặc định có nguồn trong deep-dive §1.7–1.8.

### Slide 06 — Reach for it when both sides talk, often (1 phút)

Chỉ đọc dòng **Best fit** và cột tím:
- Polling: cập nhật hiếm.
- SSE: feed một chiều từ server.
- Raw WebSocket: protocol riêng hoặc môi trường không phải .NET.
- **SignalR:** hai chiều, nhiều client, trên .NET (chat, đấu giá, dashboard).
- Azure SignalR: như SignalR nhưng hạ tầng scale được quản lý sẵn.

### Slide 07 — Before the first hub: six decisions (4 phút)

Đây là phần "mindset", không đi vào code cài đặt.
1. **Server:** có sẵn trong ASP.NET Core, chỉ cần `AddSignalR()` + `MapHub<T>()`.
2. **Thiết kế hub:** method là API công khai; tên event là hợp đồng với client.
3. **Client:** `@microsoft/signalr`, bật `withAutomaticReconnect()`.
4. **Danh tính:** `[Authorize]`, đọc người dùng từ `Context.UserIdentifier`.
5. **Hạ tầng:** proxy cho WebSocket đi qua, sticky session khi nhiều server không dùng WebSocket-only, backplane.
6. **Giới hạn:** timeout, kích thước message tối đa 32 KB, lên kế hoạch group từ đầu.

**Câu trích bên phải là ý cần nhớ:** "A hub is a public API." Ai kết nối được là gọi được mọi public method, với bất kỳ tham số nào. Câu này cài sẵn cho slide 13.

### Slide 08 — Two hubs, one Redis backplane (1,5 phút)

Bản đồ TravelPledgeAuctions:
- **Trang Item** (`itemBid.js`) nối `/bidhub`; **trang Event** (`eventBidUpdates.js`) nối cả `/bidhub` và `/eventhub`.
- **BidHub:** nhận `AddBid`/`AddBids`; phát `updateItem`, `updateEvent`, `addBidSuccess`/`addBidFail`.
- **EventHub:** phát `closeItem(s)`, `closeEvent`, do job đẩy qua `IHubContext`.
- **Dải tím dưới cùng ("SignalR runtime"):** `AddStackExchangeRedis()` nối với Redis "↔ other servers" (`Program.cs:216-219`), tức Redis backplane để nhiều server cùng phát.
- **Chú giải màu** ở góc slide: Geronimo code, SignalR, WebSocket.

### Slide 09 — Phase 1: Two lines, then SignalR takes over (2,5 phút)

Trái (cyan) là toàn bộ code kết nối của Geronimo: builder, `withUrl("/bidhub")`, `withAutomaticReconnect()`, `build()`, `start()`, rồi bật nút PLACE BID (`itemBid.js:389`).

Phải (tím) là những gì SignalR làm sau `start()`:
1. `POST /bidhub/negotiate`.
2. Server trả `connectionToken` và danh sách transport.
3. `GET /bidhub?id=…` với Upgrade, nhận `101 Switching Protocols`.
4. Handshake `{"protocol":"json","version":1}`, server trả `{}` và gọi `OnConnectedAsync`.
5. Ping mỗi 15 giây theo cả hai chiều.

Dải dưới: mất mạng thì `onreconnecting` hiện banner (code Geronimo), SignalR thử lại sau 0/2/10/30 giây, `onreconnected` hiện “You’re connected… Refresh your page for the latest bid updates.” (`itemBid.js:442`), tức người dùng phải tự tải lại.

### Slide 10 — Phase 2: One click becomes AddBid (2,5 phút)

Đọc từ trái sang phải:
- **Browser:** PLACE BID → panel CONFIRM → `connection.invoke("AddBid", itemId, bidderId, bidAmount, isBuyNow, isMaxBid)`. Chỉ vào chữ `bidderId` màu cam và nói "nhớ tham số này".
- **SignalR:** đóng gói thành message Invocation (type 1) có `invocationId` trên WebSocket đang mở → tìm method theo tên → tạo `BidHub` mới qua DI và bind tham số.
- **BidHub.AddBid** (`BidHub.cs:403`), 6 bước: `GetBidContextAsync` → `ValidateBidRequest` → `ProcessBidCreationAsync` (popcorn bidding gia hạn giờ đóng **trước** khi tạo bid) → `ProcessPostBidActionsAsync` → `HandleBuyNowPurchaseAsync` → `BroadcastBidUpdateAsync`.
- **Nhánh invalid:** `addBidFail` chỉ gửi cho Caller (ví dụ `BID_TOO_LOW`), giá hiện tại gửi cho All với `isSuccessful = false`.
- Promise của `invoke()` chỉ resolve khi server trả Completion (type 3).

### Slide 11 — Phase 2: One bid, two audiences (2 phút)

- **Geronimo viết ("Server sends"):** hai lệnh `Clients.All.SendAsync` (`updateItem` 9 tham số, `updateEvent` 7 tham số) và một `Clients.Caller.SendAsync("addBidSuccess", …)`.
- **SignalR làm:** HubLifetimeManager "Send to connected clients": serialize một lần rồi ghi vào mọi connection đang mở; Redis backplane đưa cùng message sang các server khác. Geronimo không có vòng lặp, không giữ danh sách socket.
- **Hai nhóm người nhận:**
  - **Anna (người bid)** nhận cả All lẫn Caller: `updateItem` cho giá mới và `addBidSuccess` làm xác nhận ("Bid accepted").
  - **Ben (người xem)** chỉ nhận All: `updateItem` cho giá mới ("Price updates live").
- **Chi tiết hay:** trang Item không đăng ký `updateEvent` (chỉ trang Event dùng), nên SignalR client bỏ qua và in warning. Demo sẽ cho thấy warning này.
- **Người thắng** lấy từ `HighBidUserId`, không phải người vừa bấm, vì max bid của đối thủ có thể thắng ngay.

### Slide 12 — No click needed: closing items (1 phút)

Server cũng tự đẩy. Ba nguồn đều đi qua `IHubContext<EventHub>` rồi `Clients.All`:
- **Quartz close job:** gửi `closeItems` theo lô, **trước** khi đóng.
- **Buy Now:** `ItemService` gửi `closeItem`.
- **Đóng event:** `EventOrderService` gửi `closeEvent`.

Câu chốt trên slide: *"A background job triggers the update, and SignalR delivers it to connected clients."* Cùng đường ống như lúc bid, chỉ khác là server khởi xướng, không phải một cú click.

### Slide 13 — Who chooses the bidder? The client. (2,5 phút)

Slide chỉ còn **một** lỗ hổng: danh tính người bid do client tự khai. Đọc từ trái sang phải:
- **Anna gửi ID của Ben:** `invoke("AddBid", itemId, "ben-id", amount, ...)`. Tham số nói là Ben, người gọi thật là Anna.
- **Server dùng đúng ID đó:** `GetBidContextAsync` nạp Ben và kiểm tra tư cách của Ben; `CreateBid` ghi Ben là người bid.
- **Hệ quả (dòng đỏ):** Anna đặt bid, nhưng Ben bị ghi là người chịu trách nhiệm.

Căn cứ trong code:
- `bidderId` lấy từ hidden field (`itemBid.js:920`).
- Hub không có `[Authorize]`, không đọc `Context.UserIdentifier`.
- `connection` là biến global, và user id của người đang dẫn được phát kèm mỗi `updateItem`, nên chỉ cần một dòng trong Console là đặt được bid đứng tên người khác.

**Sửa (hai ô dưới slide):**
- `[Authorize]`: bắt buộc đăng nhập cho `AddBid`/`AddBids`. Đặt trên method, không đặt cả class, vì khách chưa đăng nhập vẫn cần nhận update.
- `Context.UserIdentifier`: dùng ID của người gọi, bỏ tham số `bidderId` từ client.

**Nói rõ:** suy ra từ code, **chưa thử trên production**. Đây là bài học "hub là public API" của slide 07, chứ không phải đi tìm lỗi người viết.

**Lỗ hổng thứ hai không còn trên slide:** tham số cuối của `updateItem` là `highMaxBid`, gửi cho All, nên mở DevTools → Network → WS là thấy max bid của đối thủ. Cách sửa là server tự so sánh rồi gửi `isBuyNowAvailable`. Demo BidLab vẫn có ghi chú này ở bước 5. Dùng khi demo hoặc khi bị hỏi; không cần nói nếu thiếu giờ.

### Slide 14 — Three rules for the next hub (1,5 phút)

Ba hàng, mỗi hàng một cặp **Do** (cyan) và **Avoid**:

| Do | Avoid |
| --- | --- |
| **Target the right audience:** Groups theo event/item | **Broadcasting everything:** chỉ gửi dữ liệu mà người nhận được phép thấy |
| **Use authenticated identity:** `[Authorize]` + `Context.UserIdentifier` | **Trusting a client-supplied user ID:** caller có thể gửi ID của người khác |
| **Plan for multiple servers:** backplane + sticky sessions khi cần | **Isolated servers:** không có scale-out thì message chỉ ở trong server đó |

Hàng giữa là phần sửa của slide 13. Slide không còn dòng xám về hiện trạng Geronimo.

**Không còn trên slide, giữ làm câu trả lời khi bị hỏi:**
- Resync sau `onreconnected`: reconnect không phát lại message bị lỡ (slide 09 đã nói "Refresh your page").
- `DetailedErrors` chỉ bật ở Development.
- Hub method ngắn và không giữ state, vì Hub là transient.
- Đừng broadcast thứ riêng tư như `highMaxBid`.

### Slide 15 — Demo & Questions (5 phút)

Slide có ba bước demo: **1 · Connect** (negotiate → handshake), **2 · Bid** (bid → broadcast → update clients), **3 · Go offline** (reconnect or give up); bên dưới là "SignalR BidLab" và "Questions?". Slide không còn câu takeaway, nên nói miệng khi chuyển sang BidLab: *"SignalR moves the message. You own who sends it and what it says."*

### Slide 16 — Redis backplane: one message, every server (backup, không tính giờ)

Đặt sau Demo & Questions, chỉ mở khi có người hỏi "backplane là gì" hoặc "nhiều server thì sao". Đọc theo năm bước đánh số:
1. Anna gọi `invoke("AddBid")` tới **Server A**.
2. Server A chạy `Clients.All.SendAsync("updateItem")`; HubLifetimeManager của A chỉ biết connection của A nên mới gửi được cho Anna.
3. Server A **publish** cùng message lên Redis (Pub/Sub).
4. Redis chuyển message sang **Server B**.
5. HubLifetimeManager của B ghi `updateItem` xuống connection của Ben. Server B không hề chạy `AddBid`.

Dải Redis có dòng `.AddStackExchangeRedis()`: đây là phần duy nhất Geronimo thêm vào code.

Khung bên phải:
- **What it does:** chuyển message giữa các server; `Clients.All/Group/User` tới được client ở mọi server; code hub không đổi.
- **What it does not do:** không chuyển connection (vẫn cần sticky session), không phát lại message client bỏ lỡ lúc offline, không thay database.

Liên hệ: slide 08 (dải Redis), slide 11 (Redis relay), slide 07 (sticky sessions), câu Q&A "Redis backplane có làm mất message không?".

## 4. Kịch bản demo (BidLab)

**Chuẩn bị trước giờ nói:**
- Chạy `dotnet run --project SignalR/bidlab/src/BidLab`, mở http://127.0.0.1:5080, zoom trình duyệt 100% ở 1920×1080.
- Bấm **Đặt lại**; kiểm tra cả hai trình duyệt đều hiện "● WebSocket" và giá $1,250.

1. **Connect (khoảng 1 phút).** Bấm "① Kết nối vào bid", rồi **Kết nối** trên thanh trình duyệt của Anna. Bấm **Tiếp** (hoặc phím →) qua 8 bước. Chỉ ra frame negotiate thật, `101 Switching Protocols`, handshake `{}`, rồi nút PLACE BID sáng lên.
2. **Bid (khoảng 2 phút).** Bấm "② Bid & nhận cập nhật", Anna bid $1,300. Anna bấm PLACE BID → CONFIRM, rồi bấm Tiếp:
   - **Bước 2:** frame `{"type":1,"target":"AddBid",...}` và ghi chú lỗ hổng `bidderId`.
   - **Bước 4:** 6 bước con của AddBid sáng dần.
   - **Bước 5:** `Clients.All → 2 connection` và ghi chú lộ `highMaxBid` (ý này không còn trên slide 13, nói thoáng qua nếu còn giờ).
   - **Bước 8:** Ben mới đổi sang $1,300 và banner vàng. Mở DevTools (F12 → Console) để thấy warning `No client method with the name 'updateevent' found`.
3. *(nếu còn thời gian)* **Go offline.** Bấm **Ngắt mạng** ở Ben: banner "Connection to WinningBidder.com was lost", mô phỏng tự chạy tới bước "Tự thử lại" rồi chờ kết quả thật. Bỏ Ngắt mạng thì kết nối lại được (khoảng 12 giây); giữ Ngắt mạng hết 4 lần thử (khoảng 42 giây) thì SignalR bỏ cuộc và gọi `onclose`.

**Phương án dự phòng:**

| Sự cố | Cách xử lý |
| --- | --- |
| App không chạy hoặc treo | Mở ảnh trong `SignalR/presentation/backup/` theo thứ tự: `demo-phase1-negotiate.png` → `demo-phase2-step2-invoke.png` → `demo-phase2-step5-fanout.png` → `demo-phase2-step8-ui.png` → `demo-reconnect-retry.png` |
| Một lượt chạy rối | Bấm **Đặt lại** (đưa về $1,250, 7 bids, Ben dẫn) |
| Dừng lâu ở một bước để giải thích | Không sao: timeout của demo được nới lên 10 phút |

## 5. Q&A nhanh

Câu hỏi phản biện kèm trả lời đầy đủ ở [deep-dive §6](./signalr-deep-dive.md). Ba câu hay gặp:

- **"Sao không dùng WebSocket thuần cho nhẹ?"** Được, nếu chấp nhận tự viết lại các việc ở slide 03. SignalR đáng giá khi có nhiều client, nhiều server và cần reconnect, nhắm đúng người nhận.
- **"Redis backplane có làm mất message không?"** Backplane không lưu lại message; client mất kết nối sẽ lỡ những gì xảy ra lúc đó. Đó là lý do cần resync sau `onreconnected`.
- **"Groups có tốn hơn `Clients.All` không?"** Groups giảm số message gửi đi vì chỉ ai đang xem event/item đó mới nhận. Lưu ý group membership mất khi reconnect, nên phải join lại.
