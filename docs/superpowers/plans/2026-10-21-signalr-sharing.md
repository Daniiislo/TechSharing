# SignalR Tech Sharing: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm xong ba sản phẩm cho buổi sharing ngày 23/10/2026: tài liệu deep-dive và presenter guide (tiếng Việt), deck ppt-master khoảng 14 slide (tiếng Anh), và demo **SignalR BidLab**. Demo chạy SignalR thật, cho thấy từng bước SignalR làm và từng bước code Geronimo làm khi bid trên TravelPledgeAuctions.

**Architecture:** BidLab là ASP.NET Core .NET 8 minimal app, chạy một process, dữ liệu in-memory.
- `BidHub` mô phỏng lại `TravelPledgeAuctions/Hubs/BidHub.cs`: cùng tên hàm, thứ tự bước, tên event và thứ tự tham số.
- Server phát trace qua những điểm móc thật của SignalR (`IHubFilter`, một `HubLifetimeManager<BidHub>` có trace) tới `/tracehub`.
- Trình duyệt mở hai `HubConnection` thật (An, Bình). Mỗi connection đi qua một **tap**, là WebSocket và HttpClient bọc ngoài. Tap ghi lại frame thật và **giữ frame ở cổng mạng** tới khi mô phỏng nhả ra. Vì vậy chính SignalR client thật bị "tạm dừng" theo nhịp thuyết trình, không có animation kịch bản.

**Tech Stack:**
- .NET 8 (SDK 8.0.100 đã có), xUnit, `Microsoft.AspNetCore.Mvc.Testing`, `Microsoft.AspNetCore.SignalR.Client` 8.x.
- Trình duyệt: JS thuần (ES modules), `signalr.min.js` 10.0.0 chép từ Geronimo, Bootstrap 4.5.2 và Font Awesome 4.7 vendored (để trình chiếu offline). Test JS bằng `node --test`.
- Slide: skill ppt-master.

**Spec:** `docs/superpowers/specs/2026-10-21-signalr-sharing-design.md`. Mockup đã duyệt: `.superpowers/brainstorm/1316-1792550005/content/demo-layout-v4.html`. Đọc cả hai trước khi làm.

## Global Constraints

- Hạn chót: 23/10/2026. Thứ tự: Ngày 1 làm Task 1–6 (demo core) song song với Task 11 (deep-dive). Ngày 2 làm Task 7–10, Task 12–14.
- Nếu thiếu thời gian, cắt theo đúng thứ tự: (1) kịch bản max bid, (2) kịch bản bid quá thấp, (3) nút Ngắt mạng trong demo. **Không cắt** luồng chính Phase 2, Phase 1, độ giống trang clone, diagram flow code trên slide.
- Quy ước màu thống nhất ở slide và demo:
  - code Geronimo: cyan `#007595` (demo) hoặc `#007F9E` (slide), viền **liền**, nền `#E6F6FA`;
  - SignalR: tím `#5B21B6`, viền **đứt**, nền `#F1EBFD`;
  - không phân biệt hai bên chỉ bằng màu, luôn kèm chữ "Geronimo"/"SignalR".
- Trang clone dùng giá trị CSS lấy từ `TPAuctions.css`, `item.css` và `<style>` trong `Item.cshtml`, gồm `#385e7c`, `#007bff`, `#52b05f`, `#ffc107`, `#666` (đã có sẵn trong mockup v4).
- Tên event và thứ tự tham số giữ đúng Geronimo:
  - `updateItem(itemId, currentAmount, nextBidAmount, numberOfBids, closingTimeG, secondsToNextUpdate, highBidderUserId, isSuccessful, highMaxBid)`
  - `updateEvent(itemId, currentAmount, nextBidAmount, numberOfBids, closingTimeG, highBidderUserId, isSuccessful)`
  - `addBidSuccess(itemId, bidderId, isHighBidder)`
  - `addBidFail(itemId, bidderId, errorReason)`
  - Hub method `AddBid(int itemId, string bidderId, decimal bidAmount, bool isBuyNow, bool isMaxBid)`
- Demo **giữ** việc client gửi `bidderId` cho giống thật, kèm ghi chú lỗ hổng trong ô chi tiết của bước invoke. Không làm kịch bản tấn công.
- Chữ trên UI demo bằng tiếng Việt. Chữ trên trang clone giữ tiếng Anh như site thật. Slide tiếng Anh, không có speaker notes.
- UI tuân theo `frontend-design` (một điểm nhấn duy nhất là dải SignalR, không thêm trang trí) và `front-end-checklist`:
  - `reduced-motion`: tắt gói tin chạy;
  - `sensory-instructions`;
  - `aria-live-regions` cho ô chi tiết;
  - `focus-styles` (`:focus-visible`);
  - `color-contrast` ≥ 4.5:1;
  - chữ ≥ 12px.
- Demo phải đẹp ở 1920×1080. Chụp màn hình bằng Edge headless để tự rà (lệnh ở Task 7).
- Không commit lên `main`. Làm trên nhánh `feat/signalr-sharing`.

## Review Focus

1. **Presenter dừng lâu ở một bước** (trên 15s, ví dụ đang giải thích handshake). Kỳ vọng: connection không bị rớt. Cấu hình `HandshakeTimeout`, `ClientTimeoutInterval` và client `serverTimeoutInMilliseconds` đều 10 phút, và ping (type 6) không bao giờ bị giữ. Test ở Task 2 và Task 4.
2. **Bấm PLACE BID khi lượt trước còn đang phát.** Kỳ vọng: nút bị disable tới khi lượt hiện tại kết thúc, không có hai lượt chồng nhau. Test ở Task 5.
3. **Bấm "Trước" rồi "Tiếp".** Kỳ vọng: chỉ tua hình. Frame đã nhả không gửi lại, handler không chạy lại hai lần. Test ở Task 5.
4. **Reset giữa buổi** (đặt lại dữ liệu và kết nối lại). Kỳ vọng: giá về $1,250, 7 bids, Bình là high bidder, cả hai pane đồng bộ. Test ở Task 2 và Task 8.
5. **Mất mạng khi đang giữ frame.** Kỳ vọng: frame đang giữ bị bỏ, lượt hiện tại kết thúc với trạng thái "đứt kết nối", không treo mô phỏng. Test ở Task 9.

---

## Cấu trúc file

```
SignalR/
  README.md                         cách chạy demo, kịch bản trình diễn
  docs/signalr-deep-dive.md         Task 11
  docs/signalr-presentation-final.md Task 13
  presentation/                     workspace ppt-master và .pptx (Task 12)
  bidlab/
    BidLab.sln
    src/BidLab/
      BidLab.csproj  Program.cs
      Auction/AuctionModels.cs      Item, Bid, ItemBidStats, BidCreationRequest
      Auction/AuctionStore.cs       dữ liệu in-memory, quy tắc bid và max bid
      Hubs/BidHub.cs                mô phỏng BidHub của Geronimo
      Hubs/TraceHub.cs              kênh trace (hub rỗng)
      Tracing/TraceBus.cs           Emit(...) tới /tracehub
      Tracing/TraceHubFilter.cs     IHubFilter: bước "SignalR dispatch"
      Tracing/TracingHubLifetimeManager.cs  bước fan-out/caller và connect/disconnect
      wwwroot/index.html
      wwwroot/css/lab.css  wwwroot/css/tpa-item.css
      wwwroot/vendor/  (bootstrap 4.5.2, font-awesome 4.7, signalr.min.js, img)
      wwwroot/js/gates.js     core thuần: hàng đợi cổng, không dùng DOM
      wwwroot/js/steps.js     template các bước (thuần)
      wwwroot/js/tap.js       TappedWebSocket + TapHttpClient
      wwwroot/js/bidder.js    clone itemBid.js cho từng pane
      wwwroot/js/sim.js       điều phối lượt chạy, inspector, điều khiển
      wwwroot/js/diagram.js   SVG và gói tin
      wwwroot/js/main.js
    tests/BidLab.Tests/  (xUnit)
    tests/js/            (node --test cho gates.js và steps.js)
```

---

### Task 1: Khung BidLab và AuctionStore

**Files:**
- Create: `SignalR/bidlab/BidLab.sln`, `src/BidLab/BidLab.csproj` (web, net8.0), `src/BidLab/Program.cs` (tạm thời chỉ có static files và `AddSingleton<AuctionStore>()`), `Auction/AuctionModels.cs`, `Auction/AuctionStore.cs`
- Test: `tests/BidLab.Tests/BidLab.Tests.csproj`, `tests/BidLab.Tests/AuctionStoreTests.cs`

**Interfaces:**
- Produces:
  - `record Item(int Id, int Number, int EventId, string Name, decimal MinimumBid, decimal BidIncrement, decimal BuyNowPrice, DateTime ClosingTime)`
  - `record Bid(int Id, string UserId, decimal Amount, bool IsMaxBid)`
  - `record ItemBidStats(int BidId, decimal Amount, decimal NextBidIncrement, int NumberOfBids, string? HighBidUserId)`. `NextBidIncrement` là **số tiền bid tối thiểu tiếp theo**, giống Geronimo.
  - `record BidCreationRequest(Item Item, string BidderId, decimal BidAmount, bool IsMaxBid)`
  - `AuctionStore`:
    - `Item GetItem(int id)`
    - `(Bid? HighestBid, Bid? HighestMaxBid) GetHighestBids(int itemId)`
    - `bool CanBidderBid(int itemId, string bidderId)`: luôn true trong demo
    - `bool AvailableForBidding(Item item)`
    - `ItemBidStats CreateBid(BidCreationRequest r)`
    - `ItemBidStats GetCurrentBid(int itemId)`
    - `void Reset()`
  - Hằng số user: `Users.An = "u-an"`, `Users.Binh = "u-binh"`. Item seed: `1042`, Number 12, EventId 7, "Maui Getaway – 5 Nights at Wailea", increment 50, BuyNow 3000, closing 30/10/2026 21:00. Bid seed: 7 non-max bid, bid cao nhất $1,250 của `u-binh`.
- Mọi thao tác ghi đi qua một `lock`. Dùng `// ponytail: global lock, đủ cho demo 2 user`.

- [ ] **Step 1: Tạo nhánh.** `git switch -c feat/signalr-sharing`.
- [ ] **Step 2: Viết test fail** trong `AuctionStoreTests`:
  - `Seed_IsBinhAt1250With7Bids`: `GetCurrentBid(1042)` trả về Amount 1250, NumberOfBids 7, HighBidUserId "u-binh", NextBidIncrement 1300.
  - `ExactBid_AboveCurrent_BecomesHigh`: An bid 1300 → Amount 1300, 8 bids, High "u-an", Next 1350.
  - `MaxBid_Competing_ProxyBidsForHolder`: Bình đặt max 2000 → Amount 1300, High "u-binh". Sau đó An bid exact 1500 → Amount 1550, High "u-binh", NumberOfBids tăng 2 (bid của An và auto-bid của Bình).
  - `MaxBid_Exceeded_HolderLoses`: Bình max 1400, An exact 1500 → Amount 1500, High "u-an".
  - `Reset_RestoresSeed`.
- [ ] **Step 3: Chạy `dotnet test SignalR/bidlab`.** Kỳ vọng FAIL (compile error).
- [ ] **Step 4: Cài `AuctionStore`.** Quy tắc proxy (bản đơn giản của `BidService.CreateBid`):
  - Max bid mới mà không có max đối thủ: tạo bid ở mức `max(min-next, current+increment)` đứng tên người đặt.
  - Có max đối thủ ≥ amount: tạo bid của người gọi, rồi auto-bid cho người giữ max ở mức `min(holderMax, amount + increment)`.
  - Max mới > max đối thủ: bid ở `min(newMax, otherMax + increment)` cho người mới.
- [ ] **Step 5: `dotnet test`.** Kỳ vọng PASS 5/5.
- [ ] **Step 6: Commit** `feat(bidlab): auction store with proxy bidding`.

### Task 2: BidHub và kênh trace

**Files:**
- Create: `Hubs/BidHub.cs`, `Hubs/TraceHub.cs`, `Tracing/TraceBus.cs`, `Tracing/TraceHubFilter.cs`, `Tracing/TracingHubLifetimeManager.cs`
- Modify: `Program.cs`
- Test: `tests/BidLab.Tests/BidHubTests.cs`, dùng `WebApplicationFactory<Program>` và `HubConnectionBuilder().WithUrl(server.BaseAddress + "bidhub", o => { o.HttpMessageHandlerFactory = _ => server.CreateHandler(); o.Transports = HttpTransportType.LongPolling; })`. Test chạy được trên TestServer; transport WebSocket thật được kiểm ở Task 7.

**Interfaces:**
- Consumes: `AuctionStore` (Task 1).
- Produces:
  - Hub `/bidhub` với `AddBid(int itemId, string bidderId, decimal bidAmount, bool isBuyNow, bool isMaxBid)`. `isBuyNow` bị bỏ qua và trả về `addBidFail(..., "BUY_NOW_UNAVAILABLE")`, vì Buy it now nằm ngoài demo.
  - Hub `/tracehub` (rỗng). Client nhận event `"trace"` với payload `TraceEvent`.
  - `record TraceEvent(long Seq, string Step, string Owner /* "geronimo"|"signalr" */, string Fn, string Note, object? Data, string? ConnectionId)`
  - `TraceBus.Emit(string step, string owner, string fn, string note, object? data = null, string? connectionId = null)`
  - Danh sách `Step` (Task 4 dùng y nguyên):
    - `server.connected`, `server.disconnected`: lifetime manager `OnConnectedAsync`/`OnDisconnectedAsync`, kèm `Data = { total }`.
    - `server.dispatch`: `TraceHubFilter.InvokeMethodAsync` trước khi gọi `next`, `Fn = "BidHub.AddBid"`, `Data = args`.
    - `hub.GetBidContextAsync`, `hub.ValidateBidRequest`, `hub.ProcessBidCreationAsync`, `hub.ProcessPostBidActionsAsync`, `hub.HandleBuyNowPurchaseAsync`, `hub.BroadcastBidUpdateAsync`. Mỗi bước có `Data` tóm tắt kết quả, ví dụ `{ highestBid, isValid, reason }`.
    - `server.sendAll`: `TracingHubLifetimeManager.SendAllAsync`, `Data = { method, args, recipients }`.
    - `server.sendCaller`: `SendConnectionAsync`.
  - `POST /api/reset`: `AuctionStore.Reset()` và trả 204.
- `Program.cs`:
  - `AddSignalR(o => { o.HandshakeTimeout = TimeSpan.FromMinutes(10); o.ClientTimeoutInterval = TimeSpan.FromMinutes(10); o.AddFilter<TraceHubFilter>(); })`
  - `services.AddSingleton<HubLifetimeManager<BidHub>, TracingHubLifetimeManager<BidHub>>()`
  - Chỉ trace cho `BidHub`. Filter bỏ qua `TraceHub`, nếu không trace sẽ tự sinh vòng lặp.
  - Thêm comment ghi rõ timeout 10 phút là để giữ frame khi thuyết trình; Geronimo dùng mặc định.
  - Bind `127.0.0.1:5080`. Thêm `public partial class Program {}` cho test.
- Thân `AddBid` giữ đúng 6 bước và `BidContext` như Geronimo (đọc `TravelPledgeAuctions/Hubs/BidHub.cs:403-438`):
  - sai thì `addBidFail` cho Caller cộng `updateItem`/`updateEvent` cho All với `isSuccessful=false`;
  - đúng thì `updateItem`, `updateEvent` cho All, `addBidSuccess(itemId, bidderId, HighBidUserId == bidderId)` cho Caller.
  - `ProcessPostBidActionsAsync` và `HandleBuyNowPurchaseAsync` chỉ phát trace với note "demo: bỏ qua".

- [ ] **Step 1: Viết test fail** trong `BidHubTests`:
  - `AddBid_Valid_AllGetUpdateItem_CallerGetsSuccess`: An và Bình cùng kết nối, An `InvokeAsync("AddBid", 1042, "u-an", 1300m, false, false)` → Bình nhận `updateItem` có args `[1042, 1300, 1350, 8, <string>, <double>, "u-an", true, 0]`; An nhận `addBidSuccess(1042, "u-an", true)`; Bình **không** nhận `addBidSuccess`.
  - `AddBid_TooLow_CallerGetsFail_AllGetCurrentState`: An bid 1200 → An nhận `addBidFail(1042, "u-an", "BID_TOO_LOW")`, Bình nhận `updateItem` với amount 1250, `isSuccessful=false`.
  - `AddBid_OutbidByMax_SuccessButNotHigh`: Bình đặt max 2000, An bid 1300 → `addBidSuccess(..., false)` và `updateItem` có high bidder "u-binh".
  - `Trace_OrderForValidBid`: một client nối `/tracehub` thu được đúng chuỗi `server.dispatch, hub.GetBidContextAsync, hub.ValidateBidRequest, hub.ProcessBidCreationAsync, hub.ProcessPostBidActionsAsync, hub.HandleBuyNowPurchaseAsync, server.sendAll(updateItem), server.sendAll(updateEvent), server.sendCaller(addBidSuccess), hub.BroadcastBidUpdateAsync`, và **không có** event nào của TraceHub.
  - `Timeouts_AreExtendedForPresenting`: lấy `HubOptions` từ DI, assert `HandshakeTimeout` và `ClientTimeoutInterval` bằng 10 phút.
  - `Reset_RestoresSeed`: `POST /api/reset` sau một bid → bid tiếp theo 1300 hợp lệ trở lại.
- [ ] **Step 2: `dotnet test`.** Kỳ vọng FAIL.
- [ ] **Step 3: Cài đặt các file Hub, Tracing và Program** theo Interfaces.
- [ ] **Step 4: `dotnet test`.** Kỳ vọng PASS toàn bộ.
- [ ] **Step 5: Commit** `feat(bidlab): BidHub mirroring Geronimo with SignalR trace hooks`.

### Task 3: Trang clone hai pane và layout (tĩnh)

**Files:**
- Create: `wwwroot/index.html`, `wwwroot/css/lab.css`, `wwwroot/css/tpa-item.css`, `wwwroot/vendor/*`
- Vendor:
  - `signalr.min.js` chép từ `D:\Geronimo\Geronimo\Geronimo\Sites\TravelPledgeAuctions\wwwroot\js\signalr\dist\browser\signalr.min.js` (10.0.0);
  - Bootstrap 4.5.2 css và Font Awesome 4.7 (css cùng fonts) tải từ cdnjs về `vendor/`;
  - `DonatedItemGiftBox.png` từ `TravelPledgeAuctions/wwwroot/img`.

**Interfaces:**
- Produces các DOM hook cho Task 6–8:
  - mỗi pane là `<article class="win" data-user="an|binh">`;
  - bên trong dùng **cùng id phạm vi theo pane** như Geronimo, dưới dạng `data-role`: `current-bid-amount`, `current-bid-label`, `winning-bid`, `outbid-bid`, `bid-circle-count`, `max-bid-amount`, `bid-type-exact`, `bid-type-max`, `bid-button`, `buynow-button`, `confirm-panel`, `confirm-bid-button`, `conn-banner`, `conn-state`, `toast-host`;
  - simulation dùng `#phase-toggle`, `#steps`, `#detail`, `#ctl-prev`, `#ctl-play`, `#ctl-next`, `#ctl-speed`, `#ctl-reset`, `#ctl-offline`, `#ctl-scenario`, `svg#stage`.
- Bố cục, màu và kích thước theo `demo-layout-v4.html`. Tách CSS: `tpa-item.css` (mọi selector nằm dưới `.page`) và `lab.css`.
- Thêm vào clone: panel confirm như `Item.cshtml:746` ("Confirm your bid" và nút CONFIRM màu `btn-success`), một toast giống toastr (success `#51A351`, info `#2F96B4`, error `#BD362F`), banner kết nối giống `itemBid.js:440` (dùng **đúng câu chữ gốc**).

- [ ] **Step 1:** Dựng `index.html` từ mockup v4: chuyển style inline thành hai file CSS, dùng vendor nội bộ thay CDN, thêm panel confirm, toast host, banner, các nút điều khiển (Đặt lại, Ngắt mạng, Kịch bản).
- [ ] **Step 2:** `dotnet run --project SignalR/bidlab/src/BidLab`, rồi chụp màn hình bằng `"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --hide-scrollbars --window-size=1920,1080 --virtual-time-budget=3000 --screenshot=<scratchpad>/t3.png http://127.0.0.1:5080/`. Kỳ vọng: giống mockup v4, không có request ra ngoài (kiểm tab Network hoặc tắt mạng).
- [ ] **Step 3: Commit** `feat(bidlab): static two-pane TravelPledge clone and lab shell`.

### Task 4: Core cổng mạng và template bước (thuần JS, có test)

**Files:**
- Create: `wwwroot/js/gates.js`, `wwwroot/js/steps.js`
- Test: `tests/js/gates.test.mjs`, `tests/js/steps.test.mjs`

**Interfaces:**
- Produces:
  - `gates.js`:
    - `export function classifyFrame(text) → { type: number|null, target?: string, invocationId?: string, isPing: boolean, isHandshake: boolean }`. Text có thể chứa nhiều message phân tách bằng `\x1e`; trả về một mảng nếu có nhiều.
    - `export class GateQueue { hold(item) → Promise<void>; releaseNext() → item|null; releaseAll(); dropAll(reason); get pending() }`. Item là `{ user, dir: 'in'|'out', kind: 'frame'|'http', text, meta }`.
    - Quy tắc: frame `isPing` **không bao giờ bị giữ**. Mọi thứ khác bị giữ khi `holding === true`.
  - `steps.js`: `export const PHASE1`, `PHASE2`, `RECONNECT`. Mỗi bước có dạng `{ id, owner: 'geronimo'|'signalr', actor: 'an'|'binh'|'server', from, to /* node id */, title, fn, explain, without? }`. Node id: `app-an`, `sr-an`, `wire`, `sr-server`, `app-server`, `redis`, `sr-binh`, `app-binh`.
    - **PHASE2** (8 bước, nhãn y như mockup): `click` (geronimo, an), `invoke-frame` (signalr, frame out), `dispatch` (signalr, trace `server.dispatch`), `addbid` (geronimo, gom 6 trace `hub.*` thành bước con), `fanout` (signalr, `server.sendAll`, có note Redis "production"), `caller` (signalr, `server.sendCaller`), `receive` (signalr, nhả frame in cho cả hai pane, ghi chú `updateEvent` tới nhưng trang Item không có handler), `ui` (geronimo, handler chạy).
    - **PHASE1**: `build`, `negotiate-req`, `negotiate-res`, `ws-open`, `handshake-req`, `handshake-res`, `server-connected`, `started` (bật nút bid).
    - **RECONNECT**: `drop`, `reconnecting` (banner gốc), `retry` (0/2/10/30s), `reconnected`, `note-resync` (Geronimo không resync, đây là best practice).
  - Chữ `without` (tiếng Việt) cho mỗi bước SignalR, lấy từ mockup v2/v4.
  - Bước `invoke-frame` có `explain` nhắc lỗ hổng: "bidderId do client tự gửi, xem slide Best practices".

- [ ] **Step 1: Viết test fail:**
  - `classifyFrame('{"type":6}\x1e')` trả về isPing true.
  - `classifyFrame('{"type":1,"invocationId":"0","target":"AddBid","arguments":[]}\x1e')` trả về type 1, target "AddBid".
  - `classifyFrame('{}\x1e')` trả về isHandshake true.
  - GateQueue: hai item giữ theo thứ tự, `releaseNext` resolve đúng FIFO; ping qua thẳng khi holding; `dropAll('offline')` reject các promise đang chờ với lý do đó.
  - steps: mọi `id` không trùng; mọi bước signalr có `without`; `PHASE2.map(s => s.id)` bằng danh sách 8 id ở trên.
- [ ] **Step 2: `node --test SignalR/bidlab/tests/js`.** Kỳ vọng FAIL.
- [ ] **Step 3:** Cài đặt `gates.js` và `steps.js`. Hai file chỉ export thuần, không chạm DOM.
- [ ] **Step 4: `node --test SignalR/bidlab/tests/js`.** Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat(bidlab): gate queue and step templates`.

### Task 5: Tap và bộ điều phối lượt chạy

**Files:**
- Create: `wwwroot/js/tap.js`, `wwwroot/js/sim.js`
- Test: `tests/js/sim.test.mjs` (với `Run` thuần)

**Interfaces:**
- Consumes: `GateQueue`, `classifyFrame`, `PHASE1/PHASE2/RECONNECT`.
- Produces:
  - `tap.js`:
    - `export function createTap(user, gate, onCapture) → { WebSocket: class, httpClient: signalR.HttpClient }`.
    - `TappedWebSocket` kế thừa `window.WebSocket`.
      - `send(data)`: `onCapture({user, dir:'out', text})`, rồi `await gate.hold(...)` (ping thì không giữ) trước `super.send`.
      - Nhận `message`: `onCapture` ngay, rồi giữ qua gate trước khi phát lại cho listener mà SignalR gắn. Bọc cả `onmessage` setter. Chỉ gói **đúng chỗ SignalR client 10.0.0 gắn listener**: kiểm `signalr.js` khoảng dòng 2719–2800.
    - `TapHttpClient extends signalR.DefaultHttpClient`, `send(request)` ghi lại và giữ request negotiate cùng response. Nếu bản 10.0.0 không nhận `options.httpClient`, chuyển sang bắt negotiate qua custom `ILogger` (`logMessageContent:true`, mức Trace) và ghi rõ trong README.
    - Có `setOffline(bool)`. Khi offline: đóng socket hiện tại, socket mới tự lỗi ngay, `httpClient.send` ném `HttpError`, và `gate.dropAll('offline')`.
  - `sim.js`:
    - `export class Run { constructor(template, captures); stepAt(i); get length }` (thuần, có test).
    - `export class Simulator { start(phase); next(); prev(); play(); pause(); setSpeed(x); reset() }`. DOM chỉ đi qua callback `render(view)`.
    - `next()` đi tới bước kế. Khi bước đó tương ứng một item đang giữ, nhả **đúng một** cổng. Bước `addbid` hiện 6 trace `hub.*` dưới dạng bước con.
    - `prev()` chỉ lùi chỉ số hiển thị. Đi tới lại một bước đã nhả thì không nhả lần nữa.
    - Trong lúc một lượt chạy: `isBusy === true`, và pane disable nút PLACE BID.
    - Tốc độ: 0.5×, 1×, 2×. Mặc định 0.5×.

- [ ] **Step 1: Viết test fail** (`sim.test.mjs`, dùng GateQueue thật và capture giả):
  - `next_releasesExactlyOneHeldItemPerGatedStep`
  - `prev_thenNext_doesNotReleaseTwice`: đếm số lần resolve của gate.
  - `busy_blocksNewRunUntilFinished`
  - `offline_dropsHeldAndEndsRunWithDisconnectedState`
- [ ] **Step 2: `node --test`.** Kỳ vọng FAIL.
- [ ] **Step 3:** Cài đặt `sim.js` (phần thuần) và `tap.js`.
- [ ] **Step 4: `node --test`.** Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat(bidlab): network tap and step simulator`.

### Task 6: Pane bidder (clone `itemBid.js`) và nối luồng Phase 2

**Files:**
- Create: `wwwroot/js/bidder.js`, `wwwroot/js/main.js`

**Interfaces:**
- Consumes: `createTap`, `Simulator`, DOM hooks của Task 3.
- Produces:
  - `export function createBidder(user, root, tap) → { connection, connect(), disconnect() }`.
  - Connection dựng **giống Geronimo**: `new signalR.HubConnectionBuilder().withUrl('/bidhub', { WebSocket: tap.WebSocket, httpClient: tap.httpClient, transport: signalR.HttpTransportType.WebSockets }).withAutomaticReconnect().withServerTimeout(600000).build()`.
  - Handler giữ tên và logic hiển thị theo `itemBid.js`:
    - `addBidSuccess` → toast "Your bid was successful! You're winning!" hoặc toast info "…immediately outbid by another bidder's max bid.";
    - `addBidFail` → thông báo theo `errorReason`, đọc `itemBid.js:77-106`;
    - `updateItem` → giá, vòng bid count, `minbid`, banner winning/outbid theo `highBidderUserId`.
  - Pane không đăng ký `updateEvent`, giống trang Item thật.
  - Luồng nút: PLACE BID → hiện confirm panel → CONFIRM → `connection.invoke("AddBid", 1042, bidderId, amount, false, isMaxBid)`, trong đó `bidderId` lấy từ hidden input của pane (giữ đúng lỗ hổng). Tab Exact/Maximum đặt `isMaxBid`. Nút −/+ đổi theo bước 50.
  - `main.js`: tạo hai bidder, một connection `/tracehub` (không vẽ trên sơ đồ) đẩy trace vào Simulator, nối các nút điều khiển. Khi bấm CONFIRM thì `sim.start('phase2')` trước rồi mới invoke.

- [ ] **Step 1:** Cài đặt. Chạy app, mở `http://127.0.0.1:5080`, kết nối cả hai pane.
- [ ] **Step 2: Kiểm thủ công luồng chính.** An bid $1,300 rồi bấm Tiếp lần lượt. Kỳ vọng:
  - frame `{"type":1,...,"target":"AddBid","arguments":[1042,"u-an",1300,false,false]}` hiện ở bước 2 **trước khi** server có trace;
  - 6 bước con `hub.*` hiện ở bước 4;
  - pane Bình chỉ đổi (sang $1,300, banner vàng "outbid") ở bước 8;
  - DevTools Network → WS của Bình thấy frame tới **sớm hơn** lúc UI đổi. Đó là bằng chứng cổng giữ ở phía client.
- [ ] **Step 3:** Thêm test xUnit `TwoClients_EndToEnd_WebSockets` chạy Kestrel thật trên cổng ngẫu nhiên, dùng `HttpTransportType.WebSockets` cho cả hai client. Assert như test đầu ở Task 2. `dotnet test` PASS.
- [ ] **Step 4: Commit** `feat(bidlab): bidder panes wired to real hub through tap`.

### Task 7: Sơ đồ SVG và ô chi tiết

**Files:**
- Create: `wwwroot/js/diagram.js`
- Modify: `wwwroot/js/main.js`, `wwwroot/css/lab.css`

**Interfaces:**
- Consumes: `view` từ `Simulator.render`, gồm `{ phase, index, step, subSteps, frame, trace }`.
- Produces: `export function renderDiagram(svg, view)` và `export function renderDetail(el, view)`.
  - Sơ đồ giữ đúng toạ độ và node của mockup v4 (`viewBox 0 0 900 400`).
  - Node đang hoạt động có viền dày.
  - Gói tin chạy theo `from` → `to`, đi qua `wire` nếu khác cột, thời gian 1.2s chia cho tốc độ.
  - Bước `fanout` vẽ hai nhánh tới An và Bình, kèm nhánh nét đứt xuống `redis` có nhãn "production".
  - Ô chi tiết gồm: chip ai làm, `fn` (font mono), `explain`, khung frame JSON thật (`pre-wrap`), dòng "Không có SignalR:". Khung có `aria-live="polite"`.
  - `@media (prefers-reduced-motion: reduce)`: không có gói tin, chỉ highlight node.

- [ ] **Step 1:** Cài đặt. Chạy Phase 2, chụp màn hình ở bước 5 bằng lệnh Edge headless (Task 3 Step 2).
- [ ] **Step 2: Tự rà ảnh theo frontend-design.**
  - Không có chữ đè đường nối.
  - Chỉ có một điểm nhấn là dải tím.
  - Bỏ bớt trang trí thừa.
  - Kiểm contrast bằng DevTools.
  - Sửa đến khi đạt.
- [ ] **Step 3: Commit** `feat(bidlab): animated layer diagram and step inspector`.

### Task 8: Phase 1 (kết nối) và Đặt lại

**Files:**
- Modify: `main.js`, `bidder.js`, `sim.js`

- [ ] **Step 1:** Công tắc Phase 1: pane chưa kết nối, nút bid disable, `conn-state` ghi "Chưa kết nối". Có nút "Kết nối An" / "Kết nối Bình". Khi bấm thì `sim.start('phase1')` rồi `connection.start()`. Cổng giữ negotiate req/res, handshake req/res. Bước `started` bật nút bid (giống `itemBid.js:389`). Ping hiện như bộ đếm nhỏ trên `conn-state`, không thành bước.
- [ ] **Step 2:** "Đặt lại": `POST /api/reset`, `connection.stop()` cả hai pane, xoá UI về seed, sim về Phase 1.
- [ ] **Step 3: Kiểm thủ công.**
  - Dừng 60s ở bước `handshake-res` rồi bấm Tiếp. Kỳ vọng: kết nối thành công, không timeout (Review Focus 1).
  - Đặt lại giữa lượt Phase 2. Kỳ vọng: $1,250, 7 bids, Bình winning ở cả hai pane (Review Focus 4).
- [ ] **Step 4: Commit** `feat(bidlab): connect phase and reset`.

### Task 9: Ngắt mạng và reconnect *(cắt thứ 3)*

**Files:**
- Modify: `tap.js`, `bidder.js`, `main.js`

- [ ] **Step 1:** Nút "Ngắt mạng" bật/tắt `tap.setOffline` cho một pane (chọn An hoặc Bình). Pane gắn `onreconnecting` / `onreconnected` / `onclose` với **câu chữ gốc** của `itemBid.js:437-450`. Sim chạy `RECONNECT`, ghi nhận từng lần retry thật (thời điểm 0/2/10/30s lấy từ log callback, không tự đặt timer giả).
- [ ] **Step 2: Kiểm thủ công.**
  - Offline 15s rồi online. Kỳ vọng: banner "lost… reconnecting", sau đó `onreconnected`, bước `note-resync` hiện ra.
  - Offline giữa lúc đang giữ frame Phase 2. Kỳ vọng: lượt kết thúc với "đứt kết nối", không treo (Review Focus 5).
- [ ] **Step 3: Commit** `feat(bidlab): offline toggle and automatic reconnect walkthrough`.

### Task 10: Kịch bản phụ *(max bid cắt thứ 1, bid quá thấp cắt thứ 2)* và README

**Files:**
- Modify: `main.js`
- Create: `SignalR/README.md`

- [ ] **Step 1:** Thêm hai kịch bản vào `#ctl-scenario`:
  - **"Bid quá thấp"**: điền sẵn $1,200 cho An → bước 5 chỉ còn `updateItem isSuccessful=false`, bước 6 là `addBidFail BID_TOO_LOW`.
  - **"Max bid của Bình"**: Bình đặt Maximum $2,000 trước (chạy như một lượt Phase 2), sau đó An bid $1,300 → toast info "immediately outbid", ô chi tiết nêu `HighBidUserId`.
- [ ] **Step 2: README.** Gồm:
  - yêu cầu .NET 8;
  - `dotnet run --project SignalR/bidlab/src/BidLab` → `http://127.0.0.1:5080`;
  - `dotnet test SignalR/bidlab` và `node --test SignalR/bidlab/tests/js`;
  - kịch bản trình diễn 5 phút: Phase 1 An → Phase 1 Bình → Phase 2 bid → (max bid) → (Ngắt mạng);
  - khác biệt so với Geronimo: timeout 10 phút, không có Redis, không có Buy now.
- [ ] **Step 3:** Chạy toàn bộ: `dotnet test SignalR/bidlab`, `node --test SignalR/bidlab/tests/js`. Kỳ vọng PASS. Chụp màn hình 1920×1080 và 1366×768.
- [ ] **Step 4: Commit** `feat(bidlab): side scenarios and README`.

### Task 11: `SignalR/docs/signalr-deep-dive.md` (Ngày 1)

- [ ] **Step 1:** Kiểm từng nguồn bằng WebFetch trước khi trích. Các trang cần đọc:
  - Microsoft Learn "Overview of ASP.NET Core SignalR", "Hubs", "JavaScript client" (reconnect), "Configuration" (timeout, keep-alive), "Scale out" (sticky sessions, Redis backplane), "Authentication and authorization", "Security considerations";
  - spec Hub Protocol và Transport Protocols trong `dotnet/aspnetcore/src/SignalR/docs/specs`.
- [ ] **Step 2:** Viết theo spec §5.1:
  - lý thuyết;
  - so sánh;
  - setup mindset;
  - walkthrough Geronimo có file:line (dữ liệu ở spec §4) và **sơ đồ Mermaid** cho Phase 1, Phase 2a, Phase 2b, đóng item qua `IHubContext`;
  - best practice, có mục lỗ hổng `bidderId` (vì sao là lỗ hổng, cách sửa);
  - 10–15 câu hỏi phản biện kèm trả lời.
  - Giọng văn như `protolab/presentation/docs/sse-websocket-signalr-deep-dive-and-challenge-questions.md`.
- [ ] **Step 3:** Rà: mọi khẳng định kỹ thuật đều có nguồn hoặc file:line; không có số liệu bịa. Commit `docs(signalr): deep-dive`.

### Task 12: Slide bằng ppt-master (Ngày 2)

- [ ] **Step 1:** Gọi skill `ppt-master`, theo đúng workflow của nó. Workspace đặt ở `SignalR/presentation/`. Nguồn gồm `signalr-deep-dive.md` và spec §6. Design spec dựa trên `protolab/presentation/realtime_web_20261007/design_spec.md`: cùng canvas, lề, bảng màu; thêm vai trò màu `signalr #5B21B6 / #F1EBFD`; speaker notes tắt; tiếng Anh.
- [ ] **Step 2:** Đủ 14 slide theo bảng ở spec §6.
  - Slide 9–12 là **diagram flow code** với tên hàm font mono, theo quy ước hai màu.
  - Slide 13 nêu lỗ hổng chỉ bằng hình (console → `invoke("AddBid", …, "<victim id>")` → bid đứng tên nạn nhân) và keyword.
  - Không slide nào có đoạn văn.
- [ ] **Step 3:** Xuất `.pptx`, mở kiểm từng slide (chữ tràn, sơ đồ lệch). Commit `docs(signalr): presentation deck`.

### Task 13: `SignalR/docs/signalr-presentation-final.md` (sau Task 12)

- [ ] **Step 1:** Viết presenter guide bám **deck đã xuất**, theo format `protolab/presentation/docs/real-time-communication-presentation-final.md`. Gồm thông điệp, agenda, mỗi slide (điều cần nói, câu chuyển phần, số phút; tổng ≤ 30′), kịch bản demo từng thao tác, phương án dự phòng (demo lỗi thì dùng ảnh chụp màn hình trong `SignalR/presentation/backup/`).
- [ ] **Step 2: Commit** `docs(signalr): presenter guide`.

### Task 14: Tổng duyệt

- [ ] **Step 1:** Chạy lại toàn bộ test (.NET và JS). Kỳ vọng PASS. Chụp bộ ảnh dự phòng của demo (Phase 1, Phase 2 bước 2/4/5/8, reconnect).
- [ ] **Step 2:** Đối chiếu: tên hàm, event, tham số trên slide = tài liệu = demo = code Geronimo. Thuật ngữ thống nhất.
- [ ] **Step 3:** Review cuối toàn nhánh bằng `superpowers:requesting-code-review`, sửa các phát hiện.
- [ ] **Step 4:** Báo cáo trung thực cho user: cái gì đã kiểm, cái gì chưa (ví dụ chưa thử trên máy chiếu).
