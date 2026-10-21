using Microsoft.AspNetCore.SignalR;

namespace BidLab.Tracing;

// HubLifetimeManager là chỗ SignalR giữ danh sách connection và phát Clients.All/Caller/Group.
// Geronimo thay nó bằng RedisHubLifetimeManager (AddStackExchangeRedis); demo bọc bản mặc định để ghi trace.
public class TracingHubLifetimeManager<THub>(ILogger<DefaultHubLifetimeManager<THub>> logger, TraceBus trace)
    : DefaultHubLifetimeManager<THub>(logger) where THub : Hub
{
    private int _total;

    public override async Task OnConnectedAsync(HubConnectionContext connection)
    {
        await base.OnConnectedAsync(connection);
        var total = Interlocked.Increment(ref _total);
        await trace.EmitAsync("server.connected", "signalr", "HubLifetimeManager.OnConnectedAsync",
            "Thêm connection vào danh sách", new { total }, connection.ConnectionId);
    }

    public override async Task OnDisconnectedAsync(HubConnectionContext connection)
    {
        await base.OnDisconnectedAsync(connection);
        var total = Interlocked.Decrement(ref _total);
        await trace.EmitAsync("server.disconnected", "signalr", "HubLifetimeManager.OnDisconnectedAsync",
            "Bỏ connection khỏi danh sách", new { total }, connection.ConnectionId);
    }

    public override async Task SendAllAsync(string methodName, object?[] args, CancellationToken cancellationToken = default)
    {
        await trace.EmitAsync("server.sendAll", "signalr", methodName,
            "Clients.All: serialize một lần, ghi vào mọi connection đang mở",
            new { method = methodName, args, recipients = Volatile.Read(ref _total) });
        await base.SendAllAsync(methodName, args, cancellationToken);
    }

    public override async Task SendConnectionAsync(string connectionId, string methodName, object?[] args,
        CancellationToken cancellationToken = default)
    {
        await trace.EmitAsync("server.sendCaller", "signalr", methodName,
            "Clients.Caller: chỉ gửi về connection đã gọi", new { method = methodName, args }, connectionId);
        await base.SendConnectionAsync(connectionId, methodName, args, cancellationToken);
    }
}
