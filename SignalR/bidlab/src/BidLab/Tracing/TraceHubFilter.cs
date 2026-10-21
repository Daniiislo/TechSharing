using BidLab.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BidLab.Tracing;

// Móc vào pipeline thật của SignalR: chạy sau khi framework đã parse frame Invocation,
// tìm ra hub method và bind tham số, ngay trước khi gọi BidHub.AddBid.
public class TraceHubFilter(TraceBus trace) : IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(HubInvocationContext context,
        Func<HubInvocationContext, ValueTask<object?>> next)
    {
        if (context.Hub is BidHub)
            await trace.EmitAsync("server.dispatch", "signalr", $"{nameof(BidHub)}.{context.HubMethodName}",
                "SignalR tìm method theo tên trong frame, tạo BidHub qua DI, bind tham số",
                context.HubMethodArguments, context.Context.ConnectionId);
        return await next(context);
    }
}
