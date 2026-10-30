# SignalR — Ghi nhớ từ buổi hỏi đáp

Ngày: 22/10/2026. Tổng hợp các khái niệm đã hỏi để ôn trước buổi present.

Tài liệu này giải thích **ASP.NET Core SignalR**, không phải ASP.NET SignalR đời cũ. Ví dụ Geronimo dựa trên phân tích source trong [deep dive](signalr-deep-dive.md), chưa phải kiểm chứng trên production. BidLab là demo rút gọn, không triển khai toàn bộ kiến trúc Geronimo.

## 1. .NET, ASP.NET Core và SignalR liên quan thế nào?

```text
.NET: nền tảng phát triển và chạy ứng dụng
  └─ ASP.NET Core: framework xây dựng web/API
       └─ SignalR: thư viện bổ sung giao tiếp real-time
```

Microsoft gọi SignalR là **library**. Tài liệu chia sẻ dùng “framework real-time” để nhấn mạnh nó cung cấp cả cơ chế giao tiếp có cấu trúc: Hub, protocol, connection, routing và tích hợp scale-out.

SignalR server cơ bản có sẵn trong ASP.NET Core shared framework hiện đại. Có sẵn thư viện không có nghĩa tự hoạt động:

```csharp
builder.Services.AddSignalR();          // Đăng ký dịch vụ vào DI.
app.MapHub<BidHub>("/bidhub");           // Tạo endpoint cho client kết nối.
```

Browser cần thư viện client `@microsoft/signalr` riêng. BidLab đã lưu sẵn thư viện trong `wwwroot/vendor/`. Redis backplane cần package tích hợp riêng.

**Câu nhớ:** ASP.NET Core xây dựng ứng dụng web; SignalR đảm nhiệm phần giao tiếp real-time trong ứng dụng đó.

## 2. Hub là gì?

Hub là lớp phía server tiếp nhận lời gọi từ client và cung cấp API gửi message về client.

```csharp
public class BidHub : Hub
{
    public async Task AddBid(/* tham số */)
    {
        // Kiểm tra, tạo bid, gửi cập nhật.
    }
}
```

| Tên | Ý nghĩa |
|---|---|
| `Hub` | Class nền do SignalR cung cấp |
| `BidHub` | Class ứng dụng viết, kế thừa `Hub` |
| `/bidhub` | Đường dẫn được map để kết nối tới BidHub |
| `AddBid` | Hub method C# mà client gọi qua `invoke()` |

Có thể liên hệ Hub với Controller: đều expose các thao tác phía server, nhưng Hub giao tiếp qua kết nối SignalR.

Hub là **transient**: mỗi invocation có instance Hub mới. Không lưu giá hiện tại hoặc danh sách user trong field Hub rồi kỳ vọng dùng lại ở invocation sau. BidLab lưu dữ liệu trong `AuctionStore`; hạ tầng SignalR quản lý connection qua `HubLifetimeManager`.

## 3. `Clients` do ai cung cấp, đại diện cho ai?

`Clients` là thuộc tính do class nền `Hub` cung cấp. Đây là API **chọn các connection nhận message**, không phải mảng tài khoản người dùng.

| API | Người nhận |
|---|---|
| `Clients.All` | Mọi connection của Hub đích |
| `Clients.Caller` | Connection vừa gọi Hub method |
| `Clients.Others` | Các connection trừ connection vừa gọi |
| `Clients.Client(id)` | Một connection cụ thể |
| `Clients.User(id)` | Các connection gắn với user đó |
| `Clients.Group(name)` | Các connection thuộc group đó |

Một user có thể có nhiều connection. Anna mở hai tab thì Caller chỉ là tab vừa gọi; User có thể nhắm tới cả hai tab khi danh tính được cấu hình đúng.

**`All` không có nghĩa toàn bộ client của mọi Hub trong ứng dụng.**

## 4. Nhiều Hub có dùng chung connection không?

Trong ASP.NET Core SignalR, mỗi connection kết nối tới một Hub. Muốn dùng hai Hub, client tạo hai `HubConnection`.

```text
Một tab Event
  ├─ connection A → BidHub   /bidhub
  └─ connection B → EventHub /eventhub
```

Nếu cả hai dùng WebSocket, tab giữ hai kết nối WebSocket. Hai tab Event có thể tạo bốn connection. Vì thế phải đếm theo connection/tab thực tế, không cố định theo user.

Các Hub có phạm vi message/group riêng. Cùng tên event hoặc group không tự nối hai Hub lại. Chúng vẫn có thể dùng chung service/database hoặc chủ động gửi tới client của Hub khác bằng `IHubContext<HubĐích>`.

## 5. `HubConnection` là gì?

Đối tượng phía client quản lý việc giao tiếp với một Hub:

```text
Browser: HubConnection ←── mạng ──→ Server: BidHub
```

```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/bidhub")
    .withAutomaticReconnect()
    .build();
```

- `HubConnectionBuilder`: tạo và cấu hình đối tượng.
- `withUrl`: chọn endpoint Hub.
- `withAutomaticReconnect`: bật chính sách reconnect.
- `build`: tạo đối tượng, **chưa mở kết nối mạng**.
- `start`: bắt đầu kết nối.
- `invoke`: gọi method server và chờ Completion.
- `on`: đăng ký handler nhận message.
- `stop`: chủ động ngắt.

`HubConnection` là lớp cấp cao trên transport. Nó có thể dùng WebSocket, SSE hoặc Long polling bên dưới. Đối tượng vẫn có thể tồn tại khi mạng bị ngắt; reconnect không yêu cầu tự tạo lại biến `connection`.

## 6. `updateItem`, `addBidSuccess` định nghĩa ở đâu?

Phần **In** của BidHub là các method C# client gọi vào, như `AddBid`, `AddBids`.

Phần **Out** là các tên message server phát ra, như `updateItem`, `updateEvent`, `addBidSuccess`, `addBidFail`.

```csharp
// Server: gửi tên message và dữ liệu, không gửi code JavaScript.
await Clients.All.SendAsync("updateItem", itemId, currentAmount);
```

```javascript
// Client: quyết định làm gì khi nhận message.
connection.on("updateItem", (itemId, currentAmount) => {
    // Cập nhật giá trên UI.
});
```

Geronimo đăng ký `updateItem`, `addBidSuccess`, `addBidFail` trong `itemBid.js`; `updateEvent` trong `eventBidUpdates.js`. BidLab đăng ký trong `bidder.js`.

Tên hàm JavaScript có thể khác tên message:

```javascript
connection.on("updateItem", refreshPrice);
```

**Vì sao đăng ký ở client?** Vì client cần biết cách xử lý dữ liệu và sửa giao diện. Tương tự `addEventListener("click", handler)`, nhưng sự kiện đến từ server.

**Đăng ký lúc nào?** Sau `build()`, trước `start()` để handler sẵn sàng trước khi message đến. `on()` ghi nhớ handler tại client; nó không gửi một yêu cầu subscribe lên server và không tự thêm connection vào group.

## 7. Response thật của `invoke("AddBid")` là gì?

**Là Completion do SignalR gửi khi AddBid kết thúc, không phải `addBidSuccess`.**

```text
Client                              Server
invoke AddBid
  ├─ Invocation id=7 ─────────────→ AddBid
  │                                  ├─ xử lý nghiệp vụ
  │←─ updateItem ─────────────────────┤  ứng dụng chủ động gửi
  │←─ addBidSuccess ──────────────────┤  ứng dụng chủ động gửi
  │                                  └─ method kết thúc
  │←─ Completion id=7 ─────────────────  SignalR tự gửi
  └─ SignalR resolve đúng Promise đang chờ
```

Ví dụ Invocation:

```json
{"type":1,"invocationId":"7","target":"AddBid","arguments":[1042,"u-anna",1300,false,false]}
```

AddBid hiện trả `Task`, nên Completion thành công không có `result`:

```json
{"type":3,"invocationId":"7"}
```

Nếu method ném exception, Completion có `error`, Promise reject. SignalR tự quản lý ID và Promise; không đăng ký `on("Completion")`.

**Bẫy:** Bid quá thấp có thể gửi `addBidFail` rồi `return` bình thường. Khi đó nghiệp vụ thất bại nhưng method vẫn hoàn thành bình thường, nên Promise của `invoke()` vẫn resolve.

| Kết quả | Client nhận |
|---|---|
| Method kết thúc bình thường | Completion thành công → resolve |
| Method ném exception | Completion có error → reject |
| Code gửi `addBidFail` | Handler nghiệp vụ chạy; không tự quyết định trạng thái Promise |

## 8. Tự định nghĩa `BidResult` có vi phạm Hub Protocol không?

Không. **Protocol quy định vỏ message; ứng dụng định nghĩa dữ liệu nghiệp vụ bên trong.**

Nếu thiết kế method trả `Task<BidResult>`, bạn tự định nghĩa DTO `BidResult`, rồi trả object. SignalR serialize nó vào field `result`:

```json
{
  "type": 3,
  "invocationId": "7",
  "result": { "success": true, "currentAmount": 1300 }
}
```

- `type`, `invocationId`, `result`: cấu trúc Hub Protocol.
- `success`, `currentAmount`: contract nghiệp vụ do ứng dụng quyết định.

```javascript
const result = await connection.invoke("AddBid", /* tham số */);
console.log(result.success);
```

Đây là ví dụ thiết kế thay thế; demo hiện báo kết quả nghiệp vụ bằng event riêng. Dùng SignalR vẫn phải thiết kế tên method/event, tham số và DTO.

## 9. Redis backplane và `AddStackExchangeRedis`

Khi chạy nhiều server, mỗi server giữ một phần connection:

```text
Anna → Server A → Redis Pub/Sub → Server B → Ben
```

Redis backplane trung chuyển message giữa các server để broadcast/routing hoạt động xuyên server. Browser vẫn kết nối server ứng dụng, không trực tiếp nối Redis.

- **Redis**: phần mềm có khả năng lưu key–value và Pub/Sub.
- **Backplane**: vai trò cầu nối message phía sau các server.
- **Pub/Sub**: server publish message lên kênh; các subscriber nhận message.

```csharp
builder.Services.AddSignalR()
    .AddStackExchangeRedis(connectionString);
```

`AddStackExchangeRedis` đăng ký tích hợp SignalR–Redis, sử dụng thư viện .NET `StackExchange.Redis`. Cần package `Microsoft.AspNetCore.SignalR.StackExchangeRedis`. Nó không cài hoặc khởi chạy Redis server.

Tích hợp dùng `RedisHubLifetimeManager` thay cho bản mặc định. Code nghiệp vụ vẫn dùng `Clients.All`, `Clients.Group`…

| Redis cache | Redis backplane |
|---|---|
| Lưu dữ liệu để đọc nhanh | Trung chuyển message SignalR giữa server |
| `AddStackExchangeRedisCache()` | `AddSignalR().AddStackExchangeRedis()` |

Backplane không đồng bộ toàn bộ dữ liệu nghiệp vụ, không xử lý cạnh tranh hai bid, không giữ socket browser thay app server và không cung cấp kho lịch sử phát lại. Message gửi khi Redis down không được SignalR buffer để gửi bù. BidLab chạy một process nên không triển khai Redis thật.

## 10. Slide 3 — Sáu việc SignalR giúp làm

| WebSocket thuần: phải tự xây nếu cần | SignalR cung cấp |
|---|---|
| Vòng phát hiện ngắt và thử kết nối lại | `withAutomaticReconnect()` |
| Transport thay thế khi WebSocket không dùng được | WebSocket → SSE → Long polling khi thiết lập kết nối |
| Quy ước message gọi hàm, kết quả, lỗi, ping | Hub Protocol, mã hóa JSON hoặc MessagePack |
| Ghép kết quả với lời gọi đang chờ | `invoke()` và `invocationId` |
| Quản lý socket và lặp gửi đúng người | `Clients.All/Caller/User/Group` |
| Phân phối message xuyên server | Redis backplane hoặc Azure SignalR Service |

Các điểm cần nói chính xác:

- Delay reconnect mặc định là 0, 2, 10, 30 giây **trước từng lần thử**, không phải các mốc tuyệt đối.
- Không tự retry lần `start()` đầu tiên; không tự gửi lại lệnh bid bị lỗi.
- Fallback không có nghĩa WebSocket đang chạy bị đứt là lập tức chuyển sang SSE.
- SSE/Long polling kết hợp HTTP POST cho chiều client → server.
- JSON/MessagePack là cách mã hóa message; WebSocket/SSE/Long polling là transport.
- Azure SignalR Service quản lý kết nối client; Redis backplane vẫn để app server giữ chúng.
- BidLab ép WebSocket nên không chứng minh fallback.

## 11. Slide 4 — SignalR là library real-time, không phải transport

Slide “1 · What is SignalR?”, phụ đề *A real-time library, not a transport*. Thời lượng khoảng 1,5 phút.

**Ý phải chốt:** WebSocket chỉ là đường truyền. SignalR là lớp nằm trên đường truyền, lo mọi việc còn lại để mình chỉ viết business logic.

### Đọc sơ đồ từ trên xuống

| Lớp trên slide | Gồm gì | Ai viết |
|---|---|---|
| **Your code** | Hub methods, client handlers, business rules | Mình (Geronimo) |
| **SignalR** | HubConnection, Hub dispatch, HubLifetimeManager, Hub Protocol, Negotiate, Keep-alive/reconnect | SignalR tự làm |
| **Transport · picked for you** | WebSockets › Server-Sent Events › Long Polling | SignalR chọn |

Mỗi khối trong lớp SignalR chỉ cần một câu:

- **HubConnection:** đối tượng phía client giữ kết nối tới một Hub (mục 5).
- **Hub dispatch:** server nhận message gọi hàm và tìm đúng Hub method để chạy.
- **HubLifetimeManager:** sổ danh sách connection và group, thực hiện việc gửi tới All/Caller/User/Group. Redis backplane thay bản này (mục 9).
- **Hub Protocol:** quy ước vỏ message (Invocation, Completion, Ping…), mã hóa JSON hoặc MessagePack (mục 8).
- **Negotiate:** bước đầu tiên để client và server chọn transport.
- **Keep-alive, reconnect:** ping giữ kết nối và vòng thử lại khi mất mạng.

Ghi chú “Where it lives”: server có sẵn trong ASP.NET Core (`AddSignalR()` + `MapHub()`); client có JavaScript, .NET, Java (mục 1).

### Gợi ý lời nói (~90 giây)

1. **Nối từ slide 3:** “Slide trước là những việc WebSocket thuần để lại cho mình. Vậy SignalR là gì?”
2. **Đọc từ dưới lên:** “Dưới cùng là transport: WebSocket, nếu không được thì SSE hoặc Long polling. Mình không chọn, SignalR thương lượng giúp.”
3. **Chỉ vào dải tím:** “Phần này là cái SignalR bán cho mình: giữ kết nối, biến lời gọi hàm thành message, biết ai đang kết nối để gửi đúng người.” Không đọc hết từng khối; chi tiết có ở slide 09–11.
4. **Chỉ vào lớp trên cùng:** “Phần còn lại, luật bid, UI, event nào gửi cho ai, vẫn là code của mình.”
5. **Giới thiệu quy ước màu một lần:** cyan viền liền là code Geronimo viết; tím viền đứt là SignalR tự làm. Các sơ đồ sau và demo đều dùng quy ước này.

**Câu chốt:** SignalR không phải WebSocket xịn hơn; nó là lớp chạy phía trên WebSocket.

### Các điểm cần nói chính xác

- Slide dùng chữ **library** (đúng với cách Microsoft gọi). Presenter guide và tiêu đề cũ dùng “framework”. Chọn một cách nói, kèm lý do: nó làm nhiều hơn một transport (mục 1).
- **“Picked for you”** nghĩa là negotiate chọn transport lúc thiết lập kết nối, không phải đang chạy WebSocket bị đứt thì tự chuyển sang SSE. BidLab ép WebSocket nên không chứng minh được fallback.
- Gọi WebSocket là “transport” là cách gọi của SignalR. Theo mô hình mạng, WebSocket là giao thức tầng ứng dụng chạy trên TCP, mở đầu bằng HTTP Upgrade (`101 Switching Protocols`). Nếu bị hỏi: đây là cách nói rộng, “phương tiện chở message”.
- WebSocket chỉ cung cấp đường hai chiều có đóng khung message. Nó không có phòng, ack, reconnect hay RPC; những thứ đó nằm ở lớp SignalR.
- SignalR **không thay thế** WebSocket. Nó dùng WebSocket làm transport ưu tiên.

### Có thể bị hỏi

| Câu hỏi | Trả lời ngắn |
|---|---|
| Sao không dùng WebSocket thuần? | Dùng được, nhưng phải tự viết sáu việc ở slide 3 và 5. |
| SignalR có thay WebSocket không? | Không, SignalR chạy trên WebSocket và chỉ hạ xuống SSE/Long polling khi cần. |
| Có bắt buộc dùng .NET không? | Server SignalR chạy trên ASP.NET Core; client có JavaScript, .NET, Java. |

## 12. Slide 7 — Sáu điều chuẩn bị

| Dòng trên slide | Ý nghĩa |
|---|---|
| Server | Đăng ký `AddSignalR()` và map endpoint bằng `MapHub<T>()` |
| Hub design | Public hub method là API; tên event và cấu trúc dữ liệu là contract |
| Client | Nạp thư viện client, cấu hình reconnect và xử lý trạng thái UI |
| Identity | Xác thực/phân quyền và lấy user từ Context |
| Infrastructure | Proxy hỗ trợ WebSocket, sticky sessions, backplane khi cần |
| Limits | Hiểu timeout, giới hạn message và thiết kế group |

### Identity: cookie chỉ là một lựa chọn

SignalR tích hợp hệ thống authentication của ASP.NET Core. Cookie, JWT hay cơ chế khác được cấu hình để xác thực trước, rồi danh tính được cung cấp qua `Context.User`.

```javascript
// Ví dụ client dùng JWT.
.withUrl("/bidhub", {
    accessTokenFactory: () => accessToken
})
```

Server vẫn dùng `[Authorize]` và `Context.UserIdentifier`. Mặc định mã user lấy từ claim `ClaimTypes.NameIdentifier`; có thể tùy chỉnh bằng `IUserIdProvider`. Server phải được cấu hình xác thực tương ứng; browser WebSocket/SSE cần xử lý token qua query string tại endpoint phù hợp.

`[Authorize]` không thay thế kiểm tra quyền bid, giá, trạng thái item. Không tin mã người bid do client tự khai.

### Infrastructure và Limits

- **Proxy hỗ trợ WebSocket:** cho phép chuyển tiếp kết nối tới app server.
- **Sticky sessions:** request của một connection tới đúng server giữ connection đó.
- **Backplane:** chuyển message giữa server. Có Redis vẫn thường cần sticky sessions.
- Ngoại lệ không cần sticky: một server/process, Azure SignalR Service, hoặc mọi client dùng WebSocket-only cùng `skipNegotiation`.
- Timeout mặc định đáng nhớ: handshake 15s; keep-alive 15s; timeout không nhận message khoảng 30s. Đây không phải giới hạn thời gian chạy AddBid.
- **32 KB** là giới hạn mặc định mỗi Hub message **server nhận vào**, không phải tổng dữ liệu connection hoặc mọi message gửi ra.
- Group theo item/event để gửi đúng người; phải kiểm tra quyền khi cần, group không tự là cơ chế bảo mật.

“A hub is a public API” nghĩa là client có thể tự tạo lời gọi và chọn input, không bị giới hạn bởi UI. Server vẫn áp dụng binding kiểu, authorization và validation; không phải client được vượt các kiểm tra này.

## 13. Slide 8 — EventHub làm gì, ai kết nối?

Slide mô tả Geronimo:

| Trang | Kết nối |
|---|---|
| Item page (`itemBid.js`) | BidHub |
| Event page (`eventBidUpdates.js`) | BidHub và EventHub |

EventHub thông báo việc đóng đấu giá:

- `closeItem`: một item.
- `closeItems`: nhiều item.
- `closeEvent`: cả event.

Job/service chủ động gửi bằng `IHubContext<EventHub>`; không cần client invoke trước. Client Event page nhận và sửa UI. Nghiệp vụ đóng trong database do job/service thực hiện, không phải việc gửi message tự đóng database.

Trong source được phân tích, job đóng theo lô phát `closeItems` trước khi xử lý đóng từng item; không nên diễn đạt rằng mọi push đều chỉ xảy ra sau khi commit. Đây là điểm cần xác nhận ý định với team.

BidLab không triển khai EventHub; demo có BidHub và TraceHub. Sơ đồ slide 8 ghi `/bidhub + /eventhub` ở Event page nhưng đường nối chưa tách rõ từng Hub.

## 14. `IHubContext` là gì?

**Công cụ gửi message tới client của Hub đích từ code phía server, đặc biệt là code ngoài Hub.**

```csharp
public class CloseAuctionJob(IHubContext<EventHub> eventHub)
{
    public Task NotifyClosed(int eventId) =>
        eventHub.Clients.All.SendAsync("closeEvent", eventId);
}
```

| Câu hỏi | Trả lời |
|---|---|
| Ai tạo? | SignalR đăng ký dịch vụ qua `AddSignalR`; DI cung cấp cho service yêu cầu nó |
| Chứa khả năng gì? | `Clients` để gửi và `Groups` để quản lý membership |
| Có gọi `EventHub.CloseEvent()` không? | Không; gửi trực tiếp qua hạ tầng SignalR |
| Có dữ liệu đấu giá không? | Không; dữ liệu thuộc store/service/database |
| Có Caller/Context người gọi không? | Không; code ngoài Hub không có caller gắn với thao tác gửi |
| Gửi riêng bằng gì? | Chọn rõ User, Group hoặc ConnectionId |

Trong BidLab, `TraceBus` nhận `IHubContext<TraceHub>` qua DI:

```text
BidHub/filter/lifetime manager ghi trace
                 ↓
TraceBus.EmitAsync(...)
                 ↓
IHubContext<TraceHub>.Clients.All.SendAsync("trace", ...)
                 ↓
Panel quan sát nhận dữ liệu qua /tracehub
```

TraceBus không phải Hub nhưng vẫn gửi được tới client của TraceHub. Không dùng `new TraceHub()` để gửi.

**Câu nhớ:** Trong Hub dùng `Clients`; ngoài Hub dùng `IHubContext<HubĐích>.Clients`.

## 15. Tự kiểm tra trước khi present

1. SignalR có sẵn phía server có nghĩa browser cũng có sẵn không? **Không.**
2. `build()` đã mở mạng chưa? **Chưa, cần `start()`.**
3. `Clients.All` có gửi sang mọi Hub không? **Không.**
4. Một tab nối hai Hub dùng mấy connection? **Hai.**
5. `updateItem` có cần method C# tương ứng không? **Không, là tên message có handler client.**
6. `on()` có gửi subscription lên server không? **Không.**
7. `addBidSuccess` có hoàn tất Promise invoke không? **Không, Completion mới làm việc đó.**
8. Promise resolve có bảo đảm bid thành công không? **Không, phụ thuộc contract nghiệp vụ.**
9. DTO tự định nghĩa có trái Hub Protocol không? **Không, nằm trong payload protocol cho phép.**
10. Reconnect có đồng nghĩa dữ liệu đã mới nhất không? **Không, cần resync; ordinary reconnect không tự replay các message bị lỡ.**
11. Redis backplane có thay database/transaction không? **Không.**
12. IHubContext có dùng để gọi Hub method không? **Không.**
13. “Transport picked for you” có nghĩa WebSocket đứt thì tự chuyển sang SSE không? **Không, transport được chọn khi thiết lập kết nối.**
14. SignalR có thay WebSocket không? **Không, nó chạy trên WebSocket.**

## 16. Source để đọc lại

- [Deep dive và phân tích Geronimo](signalr-deep-dive.md)
- [Presenter guide](signalr-presentation-final.md)
- [Program.cs](../bidlab/src/BidLab/Program.cs): đăng ký service, map Hub.
- [BidHub.cs](../bidlab/src/BidLab/Hubs/BidHub.cs): AddBid, gửi message nghiệp vụ.
- [bidder.js](../bidlab/src/BidLab/wwwroot/js/bidder.js): connection, handler, invoke.
- [AuctionStore.cs](../bidlab/src/BidLab/Auction/AuctionStore.cs): dữ liệu đấu giá demo.
- [TraceBus.cs](../bidlab/src/BidLab/Tracing/TraceBus.cs): IHubContext trong demo.
- [Microsoft: HubContext](https://learn.microsoft.com/en-us/aspnet/core/signalr/hubcontext?view=aspnetcore-8.0)
- [Microsoft: JavaScript client](https://learn.microsoft.com/en-us/aspnet/core/signalr/javascript-client?view=aspnetcore-8.0)
- [Microsoft: Authentication/authorization](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz?view=aspnetcore-8.0)
- [Microsoft: Configuration](https://learn.microsoft.com/en-us/aspnet/core/signalr/configuration?view=aspnetcore-8.0)
- [Microsoft: Scaling](https://learn.microsoft.com/en-us/aspnet/core/signalr/scale?view=aspnetcore-8.0)
- [Microsoft: Redis backplane](https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane?view=aspnetcore-8.0)
- [Hub Protocol specification](https://github.com/dotnet/aspnetcore/blob/main/src/SignalR/docs/specs/HubProtocol.md)
