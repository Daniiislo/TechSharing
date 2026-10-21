using BidLab.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace BidLab.Tracing;

// Owner: "geronimo" = bước tương ứng code Geronimo viết; "signalr" = bước framework tự làm.
public record TraceEvent(long Seq, string Step, string Owner, string Fn, string Note, object? Data, string? ConnectionId);

// Kênh phụ của demo: đẩy trace tới panel mô phỏng qua /tracehub. Không có trong TravelPledgeAuctions.
public class TraceBus(IHubContext<TraceHub> traceHub)
{
    private long _seq;

    public Task EmitAsync(string step, string owner, string fn, string note, object? data = null, string? connectionId = null) =>
        traceHub.Clients.All.SendAsync("trace",
            new TraceEvent(Interlocked.Increment(ref _seq), step, owner, fn, note, data, connectionId));
}
