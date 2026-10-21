using Microsoft.AspNetCore.SignalR;

namespace BidLab.Hubs;

// Hub rỗng, chỉ để panel mô phỏng nhận trace. Không thuộc luồng bid.
public class TraceHub : Hub;
