using BidLab.Auction;
using BidLab.Hubs;
using BidLab.Tracing;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:5080");

builder.Services.AddSingleton<AuctionStore>();
builder.Services.AddSingleton<TraceBus>();
builder.Services.AddSignalR(options =>
{
    // Demo giữ frame ở cổng mạng khi thuyết trình nên kéo dài timeout lên 10 phút.
    // TravelPledgeAuctions dùng mặc định: handshake 15s, client timeout 30s.
    options.HandshakeTimeout = TimeSpan.FromMinutes(10);
    options.ClientTimeoutInterval = TimeSpan.FromMinutes(10);
    options.AddFilter<TraceHubFilter>();
});
// Geronimo: .AddStackExchangeRedis(...) thay HubLifetimeManager bằng bản Redis. Demo: bản mặc định có trace.
builder.Services.AddSingleton<HubLifetimeManager<BidHub>, TracingHubLifetimeManager<BidHub>>();

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapHub<BidHub>("/bidhub");
app.MapHub<TraceHub>("/tracehub");
// Thay cho phần Razor Page render trạng thái item lúc tải trang.
app.MapGet("/api/item", (string user, AuctionStore store) =>
{
    var current = store.GetCurrentBid(AuctionStore.SeedItemId);
    return Results.Ok(new
    {
        itemId = AuctionStore.SeedItemId,
        currentAmount = current.Amount,
        nextBidAmount = current.NextBidIncrement,
        numberOfBids = current.NumberOfBids,
        highBidderUserId = current.HighBidUserId,
        myBidAmount = store.GetMyBidAmount(AuctionStore.SeedItemId, user),
    });
});
app.MapPost("/api/reset", (AuctionStore store) =>
{
    store.Reset();
    return Results.NoContent();
});
app.Run();

public partial class Program;
