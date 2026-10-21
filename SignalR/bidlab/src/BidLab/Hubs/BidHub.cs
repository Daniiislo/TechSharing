using System.Globalization;
using BidLab.Auction;
using BidLab.Tracing;
using Microsoft.AspNetCore.SignalR;

namespace BidLab.Hubs;

// Bản rút gọn của TravelPledgeAuctions/Hubs/BidHub.cs: giữ tên hàm, thứ tự 6 bước,
// tên event và thứ tự tham số. Phần bỏ qua được ghi rõ trong trace ("demo: bỏ qua").
// Lỗ hổng giữ nguyên cho giống thật: bidderId do client gửi lên, hub không có [Authorize].
public class BidHub(AuctionStore store, TraceBus trace) : Hub
{
    private static readonly CultureInfo Us = CultureInfo.GetCultureInfo("en-US");

    private class BidContext
    {
        public int ItemId { get; init; }
        public required string BidderId { get; init; }
        public decimal BidAmount { get; init; }
        public bool IsMaxBid { get; init; }
        public bool IsBuyNow { get; init; }
        public required Item Item { get; set; }
        public Bid? HighestBid { get; init; }
        public Bid? HighestMaxBid { get; init; }
        public decimal HighMaxBid { get; init; }
        public bool IsAvailableForBidding { get; init; }
        public bool CanUserBid { get; init; }
        public ItemBidStats? CurrentBid { get; set; }
    }

    private Task Trace(string fn, string note, object? data = null) =>
        trace.EmitAsync($"hub.{fn}", "geronimo", $"BidHub.{fn}", note, data, Context.ConnectionId);

    private async Task<BidContext> GetBidContextAsync(int itemId, string bidderId, decimal bidAmount, bool isMaxBid, bool isBuyNow)
    {
        var item = store.GetItem(itemId);
        var (highestBid, highestMaxBid) = store.GetHighestBids(itemId);
        var highMaxBid = highestMaxBid?.Amount ?? 0;
        if (bidAmount > highMaxBid && isMaxBid) highMaxBid = bidAmount;
        var context = new BidContext
        {
            ItemId = itemId, BidderId = bidderId, BidAmount = bidAmount, IsMaxBid = isMaxBid, IsBuyNow = isBuyNow,
            Item = item, HighestBid = highestBid, HighestMaxBid = highestMaxBid, HighMaxBid = highMaxBid,
            IsAvailableForBidding = store.AvailableForBidding(item), CanUserBid = store.CanBidderBid(itemId, bidderId),
        };
        await Trace(nameof(GetBidContextAsync), "Gom dữ liệu một lần: user, item, bid cao nhất, max bid (Geronimo: Redis cache + DB)",
            new { highestBid = highestBid?.Amount, highBidder = highestBid?.UserId, context.IsAvailableForBidding, context.CanUserBid });
        return context;
    }

    private static bool ValidateBidRequest(BidContext context) =>
        (context.HighestBid == null || context.HighestBid.Amount < context.BidAmount)
        && context.IsAvailableForBidding && context.CanUserBid && !context.IsBuyNow;

    private static string DetermineValidationFailureReason(BidContext context)
    {
        if (!context.IsAvailableForBidding) return "ITEM_CLOSED";
        if (!context.CanUserBid) return "ALREADY_WON";
        if (context.IsBuyNow) return "BUY_NOW_UNAVAILABLE";  // demo: Buy it now không thuộc phạm vi
        if (context.HighestBid != null && context.HighestBid.Amount >= context.BidAmount) return "BID_TOO_LOW";
        return "UNKNOWN";
    }

    private async Task<ItemBidStats> ProcessBidCreationAsync(BidContext context)
    {
        // Geronimo: nếu bật popcorn bidding thì ExtendClosingTimeAsync chạy TRƯỚC CreateBid để tránh race với job đóng item.
        var stats = store.CreateBid(new BidCreationRequest(context.Item, context.BidderId, context.BidAmount, context.IsMaxBid));
        await Trace(nameof(ProcessBidCreationAsync), "CreateBid: lưu bid, chạy proxy bid nếu có max bid",
            new { stats.Amount, stats.NumberOfBids, stats.HighBidUserId });
        return stats;
    }

    private Task ProcessPostBidActionsAsync(BidContext context) =>
        Trace(nameof(ProcessPostBidActionsAsync), "Đăng ký user vào event, thêm watchlist (demo: bỏ qua)");

    private Task HandleBuyNowPurchaseAsync(BidContext context) =>
        Trace(nameof(HandleBuyNowPurchaseAsync), "Chỉ chạy khi Buy it now (demo: bỏ qua)");

    private async Task BroadcastBidUpdateAsync(BidContext context)
    {
        var bid = context.CurrentBid!;
        await Trace(nameof(BroadcastBidUpdateAsync), "Gọi SignalR: updateItem/updateEvent cho All, addBidSuccess cho Caller",
            new { highBidUserId = bid.HighBidUserId });
        var secondsToNextUpdate = (context.Item.ClosingTime - DateTime.UtcNow).TotalSeconds;
        // HighBidUserId thay vì người bấm: max bid của người khác có thể thắng ngay.
        var uid = bid.HighBidUserId ?? context.BidderId;
        var (_, highestMaxBid) = store.GetHighestBids(context.ItemId);
        var closing = context.Item.ClosingTime.ToString("g", Us);

        await Clients.All.SendAsync("updateItem", context.ItemId, bid.Amount, bid.NextBidIncrement, bid.NumberOfBids,
            closing, secondsToNextUpdate, uid, true, highestMaxBid?.Amount ?? 0);
        await Clients.All.SendAsync("updateEvent", context.ItemId, bid.Amount, bid.NextBidIncrement, bid.NumberOfBids,
            closing, uid, true);
        await Clients.Caller.SendAsync("addBidSuccess", context.ItemId, context.BidderId, bid.HighBidUserId == context.BidderId);
    }

    private async Task HandleValidationFailureAsync(BidContext context, string errorReason)
    {
        await Clients.Caller.SendAsync("addBidFail", context.ItemId, context.BidderId, errorReason);
        var current = store.GetCurrentBid(context.ItemId);
        var secondsToNextUpdate = (int)(context.Item.ClosingTime - DateTime.UtcNow).TotalSeconds;
        var closing = context.Item.ClosingTime.ToString("g", Us);
        await Clients.All.SendAsync("updateItem", context.ItemId, current.Amount, current.NextBidIncrement,
            current.NumberOfBids, closing, (double)secondsToNextUpdate, current.HighBidUserId ?? "", false, context.HighMaxBid);
        await Clients.All.SendAsync("updateEvent", context.ItemId, current.Amount, current.NextBidIncrement,
            current.NumberOfBids, closing, current.HighBidUserId ?? "", false);
    }

    public async Task AddBid(int itemId, string bidderId, decimal bidAmount, bool isBuyNow, bool isMaxBid)
    {
        try
        {
            // Step 1: Fetch all required data
            var context = await GetBidContextAsync(itemId, bidderId, bidAmount, isMaxBid, isBuyNow);

            // Step 2: Validate the bid request
            var isValid = ValidateBidRequest(context);
            var reason = isValid ? null : DetermineValidationFailureReason(context);
            await Trace(nameof(ValidateBidRequest), "Bid phải cao hơn bid hiện tại, item còn mở", new { isValid, reason });
            if (!isValid)
            {
                await HandleValidationFailureAsync(context, reason!);
                return;
            }

            // Step 3: Create the bid
            context.CurrentBid = await ProcessBidCreationAsync(context);
            // Step 4: Post-bid actions
            await ProcessPostBidActionsAsync(context);
            // Step 5: Buy now
            await HandleBuyNowPurchaseAsync(context);
            // Step 6: Broadcast
            await BroadcastBidUpdateAsync(context);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in AddBid for item {itemId}: {ex.Message}");
            await Clients.Caller.SendAsync("addBidFail", itemId, bidderId, "UNKNOWN");
            throw;
        }
    }
}
