using BidLab.Auction;
using System.Net.Http.Json;
using System.Text.Json;
using BidLab.Tracing;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace BidLab.Tests;

public class BidHubTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private const int ItemId = AuctionStore.SeedItemId;
    private static readonly TimeSpan Wait = TimeSpan.FromSeconds(5);
    private readonly WebApplicationFactory<Program> _factory;
    private readonly List<HubConnection> _connections = new();

    // updateItem có 9 tham số, vượt quá overload generic On<T1..T8>.
    private static readonly Type[] UpdateItemTypes =
        { typeof(int), typeof(decimal), typeof(decimal), typeof(int), typeof(string), typeof(double), typeof(string), typeof(bool), typeof(decimal) };

    public BidHubTests(WebApplicationFactory<Program> factory) => _factory = factory;

    public async Task InitializeAsync() => await _factory.CreateClient().PostAsync("/api/reset", null);

    public async Task DisposeAsync()
    {
        foreach (var c in _connections) await c.DisposeAsync();
    }

    private async Task<HubConnection> ConnectAsync(string path)
    {
        var server = _factory.Server;
        var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(server.BaseAddress, path), o =>
            {
                o.HttpMessageHandlerFactory = _ => server.CreateHandler();
                o.Transports = HttpTransportType.LongPolling;
            })
            .Build();
        _connections.Add(connection);
        await connection.StartAsync();
        return connection;
    }

    private static Task<object?[]> NextUpdateItem(HubConnection c)
    {
        var tcs = new TaskCompletionSource<object?[]>(TaskCreationOptions.RunContinuationsAsynchronously);
        c.On("updateItem", UpdateItemTypes, (args, _) => { tcs.TrySetResult(args); return Task.CompletedTask; }, null!);
        return tcs.Task;
    }

    private static Task<T> Next<T>(HubConnection c, string method, Func<object?[], T> map, Type[] types)
    {
        var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        c.On(method, types, (args, _) => { tcs.TrySetResult(map(args)); return Task.CompletedTask; }, null!);
        return tcs.Task;
    }

    private static readonly Type[] SuccessTypes = { typeof(int), typeof(string), typeof(bool) };
    private static readonly Type[] FailTypes = { typeof(int), typeof(string), typeof(string) };

    [Fact]
    public async Task AddBid_Valid_AllGetUpdateItem_CallerGetsSuccess()
    {
        var an = await ConnectAsync("bidhub");
        var binh = await ConnectAsync("bidhub");
        var binhUpdate = NextUpdateItem(binh);
        var anSuccess = Next(an, "addBidSuccess", a => a, SuccessTypes);
        var binhGotSuccess = false;
        binh.On("addBidSuccess", SuccessTypes, (_, _) => { binhGotSuccess = true; return Task.CompletedTask; }, null!);

        await an.InvokeAsync("AddBid", ItemId, Users.An, 1300m, false, false);

        var u = await binhUpdate.WaitAsync(Wait);
        Assert.Equal(ItemId, u[0]);
        Assert.Equal(1300m, u[1]);
        Assert.Equal(1350m, u[2]);
        Assert.Equal(8, u[3]);
        Assert.IsType<string>(u[4]);
        Assert.IsType<double>(u[5]);
        Assert.Equal(Users.An, u[6]);
        Assert.Equal(true, u[7]);
        Assert.Equal(0m, u[8]);
        Assert.Equal(new object?[] { ItemId, Users.An, true }, await anSuccess.WaitAsync(Wait));
        await Task.Delay(200);
        Assert.False(binhGotSuccess);
    }

    [Fact]
    public async Task AddBid_TooLow_CallerGetsFail_AllGetCurrentState()
    {
        var an = await ConnectAsync("bidhub");
        var binh = await ConnectAsync("bidhub");
        var binhUpdate = NextUpdateItem(binh);
        var anFail = Next(an, "addBidFail", a => a, FailTypes);

        await an.InvokeAsync("AddBid", ItemId, Users.An, 1200m, false, false);

        Assert.Equal(new object?[] { ItemId, Users.An, "BID_TOO_LOW" }, await anFail.WaitAsync(Wait));
        var u = await binhUpdate.WaitAsync(Wait);
        Assert.Equal(1250m, u[1]);
        Assert.Equal(false, u[7]);
    }

    [Fact]
    public async Task AddBid_OutbidByMax_SuccessButNotHigh()
    {
        var an = await ConnectAsync("bidhub");
        var binh = await ConnectAsync("bidhub");
        await binh.InvokeAsync("AddBid", ItemId, Users.Binh, 2000m, false, true);
        var anUpdate = NextUpdateItem(an);
        var anSuccess = Next(an, "addBidSuccess", a => a, SuccessTypes);

        await an.InvokeAsync("AddBid", ItemId, Users.An, 1300m, false, false);

        Assert.Equal(new object?[] { ItemId, Users.An, false }, await anSuccess.WaitAsync(Wait));
        Assert.Equal(Users.Binh, (await anUpdate.WaitAsync(Wait))[6]);
    }

    [Fact]
    public async Task Trace_OrderForValidBid()
    {
        var trace = await ConnectAsync("tracehub");
        var events = new List<TraceEvent>();
        trace.On<TraceEvent>("trace", e => { lock (events) events.Add(e); });
        var an = await ConnectAsync("bidhub");
        var anSuccess = Next(an, "addBidSuccess", a => a, SuccessTypes);
        lock (events) events.Clear();

        await an.InvokeAsync("AddBid", ItemId, Users.An, 1300m, false, false);
        await anSuccess.WaitAsync(Wait);
        await Task.Delay(300);

        string[] labels;
        lock (events) labels = events.Where(e => e.Step != "server.connected").Select(e => e.Step == "server.sendAll" || e.Step == "server.sendCaller" ? $"{e.Step}({e.Fn})" : e.Step).ToArray();
        Assert.Equal(new[]
        {
            "server.dispatch", "hub.GetBidContextAsync", "hub.ValidateBidRequest", "hub.ProcessBidCreationAsync",
            "hub.ProcessPostBidActionsAsync", "hub.HandleBuyNowPurchaseAsync", "hub.BroadcastBidUpdateAsync",
            "server.sendAll(updateItem)", "server.sendAll(updateEvent)", "server.sendCaller(addBidSuccess)",
        }, labels);
    }

    [Fact]
    public async Task ItemApi_ReturnsCurrentStateAndMyBid()
    {
        var json = await _factory.CreateClient().GetFromJsonAsync<JsonElement>($"/api/item?user={Users.An}");

        Assert.Equal(1250m, json.GetProperty("currentAmount").GetDecimal());
        Assert.Equal(1300m, json.GetProperty("nextBidAmount").GetDecimal());
        Assert.Equal(7, json.GetProperty("numberOfBids").GetInt32());
        Assert.Equal(Users.Binh, json.GetProperty("highBidderUserId").GetString());
        Assert.Equal(1000m, json.GetProperty("myBidAmount").GetDecimal());
    }

    [Fact]
    public async Task TwoClients_EndToEnd_WebSockets()
    {
        var server = _factory.Server;
        HubConnection Ws() => new HubConnectionBuilder()
            .WithUrl(new Uri(server.BaseAddress, "bidhub"), o =>
            {
                o.Transports = HttpTransportType.WebSockets;
                o.HttpMessageHandlerFactory = _ => server.CreateHandler();
                o.WebSocketFactory = async (ctx, ct) => await server.CreateWebSocketClient().ConnectAsync(ctx.Uri, ct);
            })
            .Build();
        var an = Ws();
        var binh = Ws();
        _connections.Add(an);
        _connections.Add(binh);
        await an.StartAsync();
        await binh.StartAsync();
        var binhUpdate = NextUpdateItem(binh);

        await an.InvokeAsync("AddBid", ItemId, Users.An, 1300m, false, false);

        var u = await binhUpdate.WaitAsync(Wait);
        Assert.Equal(1300m, u[1]);
        Assert.Equal(Users.An, u[6]);
    }

    [Fact]
    public void Timeouts_AreExtendedForPresenting()
    {
        var options = _factory.Services.GetRequiredService<IOptions<HubOptions>>().Value;

        Assert.Equal(TimeSpan.FromMinutes(10), options.HandshakeTimeout);
        Assert.Equal(TimeSpan.FromMinutes(10), options.ClientTimeoutInterval);
    }

    [Fact]
    public async Task Reset_RestoresSeed()
    {
        var an = await ConnectAsync("bidhub");
        await an.InvokeAsync("AddBid", ItemId, Users.An, 1300m, false, false);
        await _factory.CreateClient().PostAsync("/api/reset", null);
        var anSuccess = Next(an, "addBidSuccess", a => a, SuccessTypes);

        await an.InvokeAsync("AddBid", ItemId, Users.An, 1300m, false, false);

        Assert.Equal(true, (await anSuccess.WaitAsync(Wait))[2]);
    }
}
