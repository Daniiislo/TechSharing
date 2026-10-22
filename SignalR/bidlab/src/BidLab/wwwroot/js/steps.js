// Template các bước mô phỏng. Dữ liệu thật (frame, trace) được gắn vào lúc chạy.
// owner: "geronimo" = code TravelPledgeAuctions tự viết; "signalr" = framework làm thay.
// path: các node trên sơ đồ mà gói tin đi qua; "x" là người dùng của lượt chạy, "y" là người còn lại.
// gate: bước này nhả các frame/HTTP đang bị giữ. Frame chiều vào được nhả ở bước code app dùng nó.
// trace: tên trace server (TraceBus) mà bước này hiển thị.

export const NODES = ["app-anna", "sr-anna", "wire", "sr-server", "app-server", "redis", "sr-ben", "app-ben", "app-x", "sr-x", "app-y", "sr-y"];

export const PHASE1 = [
  {
    id: "build", owner: "geronimo", path: ["app-x"], title: "Tạo connection và start()",
    fn: 'new HubConnectionBuilder().withUrl("/bidhub").withAutomaticReconnect().build(); connection.start()',
    explain: "itemBid.js tạo connection tới /bidhub và gọi start(). Nút PLACE BID bị khóa cho tới khi start() hoàn tất.",
  },
  {
    id: "negotiate-req", owner: "signalr", path: ["app-x", "sr-x", "wire", "sr-server"], gate: { dir: "out", kind: "http" },
    title: "Thương lượng transport", fn: "POST /bidhub/negotiate?negotiateVersion=1",
    explain: "Trước khi mở kết nối, client gửi một HTTP request để thương lượng.",
    without: "bước thương lượng và việc cấp mã kết nối cho từng client phải tự xây dựng.",
  },
  {
    id: "negotiate-res", owner: "signalr", path: ["sr-server", "wire", "sr-x"], gate: { dir: "in", kind: "http" },
    title: "Server trả về transport khả dụng", fn: "{ connectionToken, availableTransports: [WebSockets, ServerSentEvents, LongPolling] }",
    explain: "Client chọn transport tốt nhất cả hai bên cùng hỗ trợ: WebSocket, rồi SSE, rồi Long polling.",
    without: "việc phát hiện WebSocket bị chặn và đường dự phòng phải tự xây dựng.",
  },
  {
    id: "ws-open", owner: "signalr", path: ["sr-x", "wire", "sr-server"], gate: { dir: "in", kind: "ws-open" },
    title: "Mở WebSocket", fn: "GET /bidhub?id=<connectionToken>  (Upgrade: websocket)",
    explain: "Một kết nối lâu dài, hai chiều, dùng cho mọi message sau này.",
    without: "vòng đời socket và việc gắn socket với người dùng phải tự quản lý.",
  },
  {
    id: "handshake-req", owner: "signalr", path: ["sr-x", "wire", "sr-server"], gate: { dir: "out", kind: "frame" },
    title: "Handshake: chọn protocol", fn: '{"protocol":"json","version":1}␞',
    explain: "Message đầu tiên trên socket báo server sẽ nói chuyện bằng JSON Hub Protocol (hoặc MessagePack).",
    without: "định dạng message và cơ chế đánh phiên bản phải tự định nghĩa.",
  },
  {
    id: "server-connected", owner: "signalr", path: ["sr-server"], trace: ["server.connected"],
    title: "Server ghi nhận connection", fn: "HubLifetimeManager.OnConnectedAsync",
    explain: "Connection được thêm vào danh sách để sau này Clients.All / Caller / Group tìm ra nó. Với Redis backplane, server khác cũng biết.",
    without: "danh sách socket đang mở và việc dọn socket đã chết phải tự quản lý.",
  },
  {
    id: "handshake-res", owner: "signalr", path: ["sr-server", "wire", "sr-x"], capture: { dir: "in", kind: "frame" },
    title: "Server xác nhận handshake", fn: "{}␞",
    explain: "Message rỗng nghĩa là handshake thành công. Từ đây hai bên gửi ping (type 6) mỗi 15 giây để giữ kết nối.",
    without: "heartbeat và timeout để phát hiện kết nối chết phải tự xây dựng.",
  },
  {
    id: "started", owner: "geronimo", path: ["sr-x", "app-x"], gate: { dir: "in", kind: "frame" },
    title: "start() xong, bật nút bid", fn: "connection.start().then(() => bidButton.disabled = false)",
    explain: "itemBid.js:389 mở khóa nút PLACE BID khi connection đã sẵn sàng.",
  },
];

const WARN_BIDDER_ID =
  "bidderId được lấy từ hidden field và do client gửi lên. Hub không có [Authorize] và không đọc Context.UserIdentifier, nên một client bất kỳ có thể gọi AddBid với id của người khác.";

export const PHASE2 = [
  {
    id: "click", owner: "geronimo", path: ["app-x"], title: "Click PLACE BID → CONFIRM",
    fn: "itemBid.js: #bid-button → .bid-panel-confirm → #confirm-bid-button",
    explain: "Bước xác nhận diễn ra trên trình duyệt, chưa có gì được gửi đi.",
  },
  {
    id: "invoke-frame", owner: "signalr", path: ["app-x", "sr-x", "wire", "sr-server"], gate: { dir: "out", kind: "frame", user: "x" },
    title: "Đóng gói lời gọi", fn: 'connection.invoke("AddBid", itemId, bidderId, bidAmount, isBuyNow, isMaxBid)',
    explain: "HubConnection đóng gói lời gọi thành message Invocation (type 1) có invocationId và gửi trên WebSocket đang mở. Promise của invoke() hoàn tất khi server trả Completion (type 3).",
    without: "định dạng message, việc ghép request với response và xử lý lỗi trả về phải tự xây dựng.",
    warn: WARN_BIDDER_ID,
  },
  {
    id: "dispatch", owner: "signalr", path: ["sr-server", "app-server"], trace: ["server.dispatch"],
    title: "Định tuyến tới hub method", fn: "BidHub.AddBid",
    explain: 'SignalR đọc target "AddBid", tạo một BidHub mới qua DI (hub không giữ state giữa các lần gọi), gán 5 tham số theo kiểu rồi gọi hàm.',
    without: "bộ định tuyến từ tên message tới hàm, cùng việc phân tích và kiểm kiểu tham số, phải tự xây dựng.",
  },
  {
    id: "addbid", owner: "geronimo", path: ["app-server"],
    trace: ["hub.GetBidContextAsync", "hub.ValidateBidRequest", "hub.ProcessBidCreationAsync",
      "hub.ProcessPostBidActionsAsync", "hub.HandleBuyNowPurchaseAsync", "hub.BroadcastBidUpdateAsync"],
    title: "Xử lý bid (6 bước)", fn: "BidHub.AddBid",
    explain: "Logic của Geronimo: gom dữ liệu, kiểm tra, tạo bid (kể cả proxy bid từ max bid), rồi gọi SignalR để phát kết quả.",
  },
  {
    id: "fanout", owner: "signalr", path: ["app-server", "sr-server", "redis", "wire", "sr-x", "sr-y"], trace: ["server.sendAll"],
    title: "Phát tới mọi client", fn: 'Clients.All.SendAsync("updateItem", …) + ("updateEvent", …)',
    explain: "SignalR serialize message một lần rồi ghi vào mọi connection đang mở. Trên production, RedisHubLifetimeManager chuyển message qua Redis để các server khác phát cho client của chúng.",
    without: "danh sách socket, vòng lặp gửi, xử lý socket đã chết và pub/sub giữa các server phải tự xây dựng.",
    warn: "Tham số cuối của updateItem là max bid cao nhất (highMaxBid) và được gửi tới mọi client, nên có thể đọc được trong DevTools.",
  },
  {
    id: "caller", owner: "signalr", path: ["sr-server", "wire", "sr-x"], trace: ["server.sendCaller"],
    title: "Phản hồi riêng cho người đặt bid", fn: 'Clients.Caller.SendAsync("addBidSuccess", itemId, bidderId, isHighBidder)',
    explain: "Caller là connection vừa gọi AddBid. isHighBidder so HighBidUserId với người bid, vì max bid của người khác có thể thắng ngay.",
    without: "việc ghi nhớ socket đã gửi request để phản hồi đúng người phải tự xây dựng.",
  },
  {
    id: "receive", owner: "signalr", path: ["wire", "sr-x", "sr-y"], capture: { dir: "in", kind: "frame" },
    title: "Trình duyệt nhận frame", fn: 'connection.on("updateItem", handler)',
    explain: 'SignalR client đọc target của từng message và gọi handler đã đăng ký. Trang Item không đăng ký "updateEvent" (chỉ trang Event có) nên message đó bị bỏ qua, kèm một warning.',
    without: "việc phân tích message và bảng ánh xạ tên sự kiện tới hàm xử lý phải tự xây dựng.",
  },
  {
    id: "ui", owner: "geronimo", path: ["sr-x", "app-x", "sr-y", "app-y"], gate: { dir: "in" },
    title: "Cập nhật giao diện", fn: 'itemBid.js: on("updateItem") · on("addBidSuccess")',
    explain: "Handler của Geronimo cập nhật giá, số bid, banner winning/outbid, và hiện toast cho người bid.",
  },
];

export const PHASE2_FAIL = [
  PHASE2[0],
  PHASE2[1],
  PHASE2[2],
  {
    ...PHASE2[3], trace: ["hub.GetBidContextAsync", "hub.ValidateBidRequest"],
    title: "Bid không hợp lệ", explain: "ValidateBidRequest trả về false và DetermineValidationFailureReason xác định lý do. HandleValidationFailureAsync phản hồi cho người đặt bid, rồi phát lại trạng thái hiện tại tới mọi client.",
  },
  {
    ...PHASE2[5], fn: 'Clients.Caller.SendAsync("addBidFail", itemId, bidderId, errorReason)',
    title: "Phản hồi lỗi cho người đặt bid", explain: "Chỉ người đặt bid nhận lý do lỗi (ví dụ BID_TOO_LOW).",
  },
  {
    ...PHASE2[4], title: "Phát lại trạng thái hiện tại", explain: "updateItem với isSuccessful = false: mọi trình duyệt đồng bộ lại giá hiện tại.",
  },
  PHASE2[6],
  { ...PHASE2[7], fn: 'itemBid.js: on("addBidFail") · on("updateItem")', explain: "addBidFail hiện toast lỗi; updateItem đồng bộ lại giá." },
];

export const RECONNECT = [
  {
    id: "drop", owner: "signalr", path: ["sr-x", "wire"], capture: { dir: "in", kind: "ws-close" }, title: "Mất kết nối", fn: "WebSocket onclose",
    explain: "Socket đóng bất thường. Vì đã bật withAutomaticReconnect(), HubConnection chuyển sang trạng thái Reconnecting.",
    without: "việc phân biệt đóng chủ động với đứt mạng phải tự xử lý.",
  },
  {
    id: "reconnecting", owner: "geronimo", path: ["app-x"], title: "Thông báo mất kết nối", fn: "connection.onreconnecting(…)",
    explain: 'itemBid.js:437 hiện "Connection to WinningBidder.com was lost. Attempting to reconnect…".',
  },
  {
    id: "retry", owner: "signalr", path: ["sr-x", "wire"], capture: { dir: "out", kind: "http" }, gate: {}, title: "Thử kết nối lại", fn: "withAutomaticReconnect(): sau 0s, 2s, 10s, 30s",
    explain: "Mỗi lần thử gồm negotiate, mở WebSocket và handshake lại từ đầu. Nếu cả 4 lần đều lỗi, SignalR gọi onclose.",
    without: "vòng thử lại có backoff và điều kiện dừng phải tự xây dựng.",
  },
  {
    id: "reconnected", branch: "ok", branchLabel: "Kết nối lại thành công", owner: "signalr", path: ["sr-x", "wire", "sr-server"], title: "Kết nối lại thành công", fn: "connection.onreconnected(connectionId)",
    explain: "Connection mới với connectionId mới; server coi đây là một client mới nên các Group phải được join lại.",
    without: "việc kết nối lại và khôi phục trạng thái đăng ký phải tự xây dựng.",
  },
  {
    id: "note-resync", branch: "ok", owner: "geronimo", path: ["app-x"], title: "Geronimo: thông báo đã kết nối lại", fn: "onreconnected → showNotification(…)",
    explain: "itemBid.js:442 hiện “You're connected to WinningBidder.com. Refresh your page for the latest bid updates.” Bid xảy ra lúc mất mạng chỉ cập nhật ở lần updateItem kế tiếp.",
  },

  {
    id: "closed", branch: "fail", branchLabel: "Hết 4 lần thử không thành công", owner: "signalr", path: ["sr-x", "wire"], title: "Dừng thử lại: onclose", fn: "connection.onclose(error)",
    explain: "Sau lần thử thứ 4 (30 s) vẫn lỗi, SignalR dừng và gọi onclose. Connection chuyển sang Disconnected và không tự thử lại.",
    without: "việc đếm số lần thử và quyết định thời điểm dừng phải tự xây dựng.",
  },
  {
    id: "note-closed", branch: "fail", owner: "geronimo", path: ["app-x"], title: "Geronimo: thông báo đã đóng kết nối", fn: "onclose → showNotification(…)",
    explain: 'itemBid.js:447 hiện "Connection to WinningBidder.com was closed due to an error. Refresh this page to restart the connection." Connection không tự dựng lại.',
  },
];

