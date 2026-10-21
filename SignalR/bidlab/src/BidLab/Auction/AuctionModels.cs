namespace BidLab.Auction;

// Bản rút gọn các model của TravelPledgeAuctions, giữ tên để dễ đối chiếu.
public record Item(int Id, int Number, int EventId, string Name, decimal MinimumBid, decimal BidIncrement,
    decimal BuyNowPrice, DateTime ClosingTime);

public record Bid(int Id, string UserId, decimal Amount, bool IsMaxBid);

// NextBidIncrement là số tiền bid tối thiểu tiếp theo (đặt tên giống Geronimo).
public record ItemBidStats(int BidId, decimal Amount, decimal NextBidIncrement, int NumberOfBids, string? HighBidUserId);

public record BidCreationRequest(Item Item, string BidderId, decimal BidAmount, bool IsMaxBid);

public static class Users
{
    public const string Anna = "u-anna";
    public const string Ben = "u-ben";
}
