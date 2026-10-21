// Template các bước mô phỏng. Dữ liệu thật (frame, trace) được gắn vào lúc chạy.
// owner: "geronimo" = code TravelPledgeAuctions tự viết; "signalr" = framework làm thay.
// path: các node trên sơ đồ mà gói tin đi qua; "x" là người dùng của lượt chạy (an hoặc binh).
// gate: bước này nhả các frame/HTTP đang bị giữ. Frame chiều vào được nhả ở bước code app dùng nó.
// trace: tên trace server (TraceBus) mà bước này hiển thị.

export const NODES = ["app-an", "sr-an", "wire", "sr-server", "app-server", "redis", "sr-binh", "app-binh", "app-x", "sr-x"];

export const PHASE1 = [
  {
    id: "build", owner: "geronimo", path: ["app-x"], title: "Tạo connection và start()",
    fn: 'new HubConnectionBuilder().withUrl("/bidhub").withAutomaticReconnect().build(); connection.start()',
    explain: "Toàn bộ code kết nối của itemBid.js chỉ có vậy. Nút PLACE BID bị disable cho tới khi start() xong.",
  },
  {
    id: "negotiate-req", owner: "signalr", path: ["app-x", "sr-x", "wire", "sr-server"], gate: { dir: "out", kind: "http" },
    title: "Hỏi server: dùng transport nào?", fn: "POST /bidhub/negotiate?negotiateVersion=1",
    explain: "Trước khi mở kết nối, client gửi một HTTP request để thương lượng.",
    without: "tự viết bước thương lượng, tự cấp mã kết nối cho từng client.",
  },
  {
    id: "negotiate-res", owner: "signalr", path: ["sr-server", "wire", "sr-x"], gate: { dir: "in", kind: "http" },
    title: "Server trả danh sách transport", fn: "{ connectionToken, availableTransports: [WebSockets, ServerSentEvents, LongPolling] }",
    explain: "Client chọn transport tốt nhất cả hai bên cùng hỗ trợ: WebSocket, rồi SSE, rồi Long polling.",
    without: "tự phát hiện WebSocket bị proxy chặn và tự viết đường dự phòng (đúng những gì ProtoLab làm tay).",
  },
  {
    id: "ws-open", owner: "signalr", path: ["sr-x", "wire", "sr-server"], gate: { dir: "in", kind: "ws-open" },
    title: "Mở WebSocket", fn: "GET /bidhub?id=<connectionToken>  (Upgrade: websocket)",
    explain: "Một kết nối lâu dài, hai chiều, dùng cho mọi message sau này.",
    without: "tự quản lý vòng đời socket, tự gắn socket với người dùng.",
  },
  {
    id: "handshake-req", owner: "signalr", path: ["sr-x", "wire", "sr-server"], gate: { dir: "out", kind: "frame" },
    title: "Handshake: chọn protocol", fn: '{"protocol":"json","version":1}␞',
    explain: "Message đầu tiên trên socket báo server sẽ nói chuyện bằng JSON Hub Protocol (hoặc MessagePack).",
    without: "tự định nghĩa format message và cách đánh version.",
  },
  {
    id: "server-connected", owner: "signalr", path: ["sr-server"], trace: ["server.connected"],
    title: "Server ghi nhận connection", fn: "HubLifetimeManager.OnConnectedAsync",
    explain: "Connection được thêm vào danh sách để sau này Clients.All / Caller / Group tìm ra nó. Với Redis backplane, server khác cũng biết.",
    without: "tự giữ danh sách socket đang mở và dọn socket đã chết.",
  },
  {
    id: "handshake-res", owner: "signalr", path: ["sr-server", "wire", "sr-x"],
    title: "Server xác nhận handshake", fn: "{}␞",
    explain: "Message rỗng nghĩa là handshake thành công. Từ đây hai bên gửi ping (type 6) mỗi 15 giây để giữ kết nối.",
    without: "tự viết heartbeat và timeout để phát hiện kết nối chết.",
  },
  {
    id: "started", owner: "geronimo", path: ["sr-x", "app-x"], gate: { dir: "in", kind: "frame" },
    title: "start() xong, bật nút bid", fn: "connection.start().then(() => bidButton.disabled = false)",
    explain: "itemBid.js:389 — chỉ khi đã kết nối mới cho bid, tránh bấm mà không có đường gửi.",
  },
];

const WARN_BIDDER_ID =
  "bidderId lấy từ hidden field và do client tự gửi; hub không có [Authorize], không dùng Context.UserIdentifier. Ai mở console cũng gọi được AddBid với id người khác.";

export const PHASE2 = [
  {
    id: "click", owner: "geronimo", path: ["app-an"], title: "Click PLACE BID → CONFIRM",
    fn: "itemBid.js: #bid-button → .bid-panel-confirm → #confirm-bid-button",
    explain: "Bước xác nhận chạy hoàn toàn trên trình duyệt, chưa có gì đi qua mạng.",
  },
  {
    id: "invoke-frame", owner: "signalr", path: ["app-an", "sr-an", "wire", "sr-server"], gate: { dir: "out", kind: "frame", user: "an" },
    title: "Đóng gói lời gọi", fn: 'connection.invoke("AddBid", itemId, bidderId, bidAmount, isBuyNow, isMaxBid)',
    explain: "HubConnection biến lời gọi hàm thành message Invocation (type 1) có invocationId, gửi trên WebSocket đang mở. invoke() trả về Promise, chờ server trả Completion (type 3).",
    without: "tự định nghĩa format message, tự ghép request với response bằng id, tự xử lý lỗi trả về.",
    warn: WARN_BIDDER_ID,
  },
  {
    id: "dispatch", owner: "signalr", path: ["sr-server", "app-server"], trace: ["server.dispatch"],
    title: "Tìm hàm trên hub", fn: "BidHub.AddBid",
    explain: 'SignalR đọc target "AddBid", tạo một BidHub mới qua DI (hub không giữ state giữa các lần gọi), bind 5 tham số đúng kiểu rồi gọi hàm.',
    without: "tự viết router từ tên message tới hàm, tự parse và kiểm kiểu tham số.",
  },
  {
    id: "addbid", owner: "geronimo", path: ["app-server"],
    trace: ["hub.GetBidContextAsync", "hub.ValidateBidRequest", "hub.ProcessBidCreationAsync",
      "hub.ProcessPostBidActionsAsync", "hub.HandleBuyNowPurchaseAsync", "hub.BroadcastBidUpdateAsync"],
    title: "Xử lý bid (6 bước)", fn: "BidHub.AddBid",
    explain: "Business logic của Geronimo: gom dữ liệu một lần, kiểm tra, tạo bid (kể cả proxy bid từ max bid), rồi nhờ SignalR phát kết quả.",
  },
  {
    id: "fanout", owner: "signalr", path: ["app-server", "sr-server", "redis", "wire", "sr-an", "sr-binh"], trace: ["server.sendAll"],
    title: "Phát cho mọi người", fn: 'Clients.All.SendAsync("updateItem", …) + ("updateEvent", …)',
    explain: "Geronimo viết một dòng. SignalR serialize một lần rồi ghi vào mọi connection đang mở. Production: RedisHubLifetimeManager publish qua Redis để các server khác phát cho client của chúng.",
    without: "tự giữ danh sách socket, tự lặp gửi, tự bỏ socket đã chết, tự pub/sub giữa các server.",
  },
  {
    id: "caller", owner: "signalr", path: ["sr-server", "wire", "sr-an"], trace: ["server.sendCaller"],
    title: "Báo riêng người bid", fn: 'Clients.Caller.SendAsync("addBidSuccess", itemId, bidderId, isHighBidder)',
    explain: "Caller là đúng connection vừa gọi AddBid. isHighBidder dựa trên HighBidUserId vì max bid của người khác có thể thắng ngay.",
    without: "tự nhớ socket nào gửi request để trả lời đúng người.",
  },
  {
    id: "receive", owner: "signalr", path: ["wire", "sr-an", "sr-binh"],
    title: "Trình duyệt nhận frame", fn: 'connection.on("updateItem", handler)',
    explain: 'SignalR client đọc target của từng message và gọi handler đã đăng ký. Trang Item không đăng ký "updateEvent" (chỉ trang Event có), nên SignalR bỏ qua message đó và ghi warning.',
    without: "tự parse message, tự viết bảng tra tên sự kiện → hàm xử lý.",
  },
  {
    id: "ui", owner: "geronimo", path: ["sr-an", "app-an", "sr-binh", "app-binh"], gate: { dir: "in" },
    title: "Cập nhật giao diện", fn: 'itemBid.js: on("updateItem") · on("addBidSuccess")',
    explain: "Handler của Geronimo đổi giá, số bid, banner winning/outbid, rồi toast cho người bid.",
  },
];

export const PHASE2_FAIL = [
  PHASE2[0],
  PHASE2[1],
  PHASE2[2],
  {
    ...PHASE2[3], trace: ["hub.GetBidContextAsync", "hub.ValidateBidRequest"],
    title: "Kiểm tra bid: không hợp lệ", explain: "ValidateBidRequest trả false, DetermineValidationFailureReason trả lý do; HandleValidationFailureAsync báo người bid rồi phát lại trạng thái hiện tại cho mọi người.",
  },
  {
    ...PHASE2[5], fn: 'Clients.Caller.SendAsync("addBidFail", itemId, bidderId, errorReason)',
    title: "Báo lỗi riêng người bid", explain: "Chỉ người bid nhận lý do lỗi (ví dụ BID_TOO_LOW).",
  },
  {
    ...PHASE2[4], title: "Phát lại trạng thái hiện tại", explain: "updateItem với isSuccessful = false: mọi trình duyệt đồng bộ lại giá đúng.",
  },
  PHASE2[6],
  { ...PHASE2[7], fn: 'itemBid.js: on("addBidFail") · on("updateItem")', explain: "addBidFail hiện toast lỗi. Geronimo còn reload trang sau 1,5 giây; demo bỏ bước reload." },
];

export const RECONNECT = [
  {
    id: "drop", owner: "signalr", path: ["sr-x", "wire"], title: "Mất mạng", fn: "WebSocket onclose",
    explain: "Socket đóng bất thường. HubConnection không coi đây là kết thúc vì đã bật withAutomaticReconnect().",
    without: "tự phân biệt đóng chủ động với đứt mạng.",
  },
  {
    id: "reconnecting", owner: "geronimo", path: ["app-x"], title: "Báo người dùng", fn: "connection.onreconnecting(…)",
    explain: 'itemBid.js:437 hiện "Connection to WinningBidder.com was lost. Attempting to reconnect…".',
  },
  {
    id: "retry", owner: "signalr", path: ["sr-x", "wire"], title: "Tự thử lại", fn: "withAutomaticReconnect(): sau 0s, 2s, 10s, 30s",
    explain: "Mỗi lần thử là negotiate + mở WebSocket + handshake lại từ đầu. Hết 4 lần mà vẫn lỗi thì onclose.",
    without: "tự viết vòng retry có backoff, tự dừng khi người dùng rời trang.",
  },
  {
    id: "reconnected", owner: "signalr", path: ["sr-x", "wire", "sr-server"], title: "Kết nối lại được", fn: "connection.onreconnected(connectionId)",
    explain: "Connection mới với connectionId mới. Server coi đây là client mới; Group (nếu có) phải join lại.",
    without: "tự kết nối lại và tự khôi phục trạng thái đăng ký.",
  },
  {
    id: "note-resync", owner: "geronimo", path: ["app-x"], title: "Bài học: đồng bộ lại", fn: "onreconnected → tải lại giá hiện tại",
    explain: "Geronimo chỉ ẩn banner. Bid xảy ra lúc mất mạng sẽ bị lỡ cho tới lần updateItem kế tiếp. Nên gọi lại API lấy trạng thái mới nhất sau khi reconnect.",
  },
];
