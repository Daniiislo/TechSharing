# SignalR

Tech sharing: **SignalR — More Than WebSocket**. Buổi tiếp theo sau ProtoLab: SignalR làm gì thay mình, cần chuẩn bị gì, TravelPledgeAuctions dùng nó ra sao, và best practice.

| Thư mục | Nội dung |
| --- | --- |
| `docs/signalr-deep-dive.md` | Tài liệu lý thuyết, walkthrough Geronimo có file:line, best practice, câu hỏi phản biện |
| `docs/signalr-presentation-final.md` | Presenter guide bám từng slide |
| `presentation/` | Deck ppt-master (`.pptx`) |
| `bidlab/` | Demo **SignalR BidLab** |

## SignalR BidLab

Trang bid clone từ TravelPledgeAuctions (hai trình duyệt Anna và Ben, trên dưới) cạnh một sơ đồ cho thấy từng bước ai làm: **code Geronimo** (cyan, viền liền) hay **SignalR** (tím, viền đứt).

Demo chạy **SignalR thật**: ASP.NET Core hub, SignalR JS client 10.0.0 (cùng bản Geronimo dùng). Frame trên sơ đồ là frame thật. Để người xem theo kịp, demo **giữ frame ở cổng mạng** (bọc `WebSocket` và `httpClient` qua option chính thức của `withUrl`) và nhả từng bước khi bấm **Tiếp**. Logic của SignalR không bị thay.

### Chạy

Cần .NET SDK 8+.

```sh
dotnet run --project SignalR/bidlab/src/BidLab
```

Mở **http://127.0.0.1:5080**. Không cần mạng ngoài (thư viện đã vendored).

### Kiểm tra

```sh
dotnet test SignalR/bidlab
node --test SignalR/bidlab/tests/js/gates.test.mjs SignalR/bidlab/tests/js/steps.test.mjs SignalR/bidlab/tests/js/sim.test.mjs
```

Tắt server trước khi `dotnet test`, vì `BidLab.exe` đang chạy sẽ khóa file build.

### Kịch bản trình diễn (khoảng 5 phút)

1. **① Kết nối vào bid** → bấm **Kết nối** trên thanh trình duyệt của Anna → **Tiếp** qua 8 bước: negotiate, chọn transport, mở WebSocket, handshake, server ghi nhận connection, `start()` xong thì bật nút bid. Làm tương tự với Ben.
2. **② Bid & nhận cập nhật**, kịch bản *Anna bid $1,300* → Anna bấm **PLACE BID → CONFIRM** → **Tiếp** qua 8 bước. Pane Ben chỉ đổi giá ở bước 8. Ở bước 2 có ghi chú lỗ hổng `bidderId`; ở bước 5 có ghi chú lộ `highMaxBid`.
3. *(tuỳ thời gian)* **Max bid của Ben**: Ben đặt Maximum $2,000 trước, sau đó Anna bid $1,300 thì bị vượt ngay (`HighBidUserId`).
4. *(tuỳ thời gian)* **Ngắt mạng** ở Ben → banner gốc "Connection to WinningBidder.com was lost" → mô phỏng đứng ở bước 1 cho tới khi bạn bấm **Tiếp** (hoặc **Chạy**); mỗi lần SignalR thử lại bị giữ cho tới bước "Tự thử lại". Bỏ **Ngắt mạng** rồi bấm **Tiếp** để thấy kết nối lại thành công.

Phím tắt: ← / → để lùi/tiến bước. **Chạy** để tự chạy theo tốc độ đã chọn. **Đặt lại** đưa dữ liệu về $1,250, 7 bids, Ben đang dẫn.

### Khác với TravelPledgeAuctions

- Một item, dữ liệu trong memory, một process. Không có Redis: node "Redis backplane" trên sơ đồ chỉ để chỉ chỗ production dùng `AddStackExchangeRedis`.
- Timeout handshake và client đặt 10 phút để giữ frame khi thuyết trình (Geronimo dùng mặc định 15s / 30s).
- Không có Buy it now, thẻ tín dụng, SMS, và không reload trang khi `addBidFail`.
- Kênh `/tracehub` chỉ có trong demo, dùng để đẩy trace server (`IHubFilter`, `HubLifetimeManager` có trace) sang panel mô phỏng.
