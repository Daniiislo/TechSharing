using BidLab.Auction;

namespace BidLab.Tests;

public class AuctionStoreTests
{
    private const int ItemId = AuctionStore.SeedItemId;
    private readonly AuctionStore _store = new();

    private ItemBidStats Bid(string user, decimal amount, bool isMax = false) =>
        _store.CreateBid(new BidCreationRequest(_store.GetItem(ItemId), user, amount, isMax));

    [Fact]
    public void Seed_IsBinhAt1250With7Bids()
    {
        var current = _store.GetCurrentBid(ItemId);

        Assert.Equal(1250m, current.Amount);
        Assert.Equal(7, current.NumberOfBids);
        Assert.Equal(Users.Binh, current.HighBidUserId);
        Assert.Equal(1300m, current.NextBidIncrement);
    }

    [Fact]
    public void ExactBid_AboveCurrent_BecomesHigh()
    {
        var stats = Bid(Users.An, 1300m);

        Assert.Equal(1300m, stats.Amount);
        Assert.Equal(8, stats.NumberOfBids);
        Assert.Equal(Users.An, stats.HighBidUserId);
        Assert.Equal(1350m, stats.NextBidIncrement);
    }

    [Fact]
    public void MaxBid_Competing_ProxyBidsForHolder()
    {
        var afterMax = Bid(Users.Binh, 2000m, isMax: true);
        Assert.Equal(1250m, afterMax.Amount); // đang dẫn đầu thì đặt max không đẩy giá lên
        Assert.Equal(Users.Binh, afterMax.HighBidUserId);
        var countBefore = afterMax.NumberOfBids;

        var stats = Bid(Users.An, 1500m);

        Assert.Equal(1550m, stats.Amount);
        Assert.Equal(Users.Binh, stats.HighBidUserId);
        Assert.Equal(countBefore + 2, stats.NumberOfBids);
    }

    [Fact]
    public void MaxBid_Exceeded_HolderLoses()
    {
        Bid(Users.Binh, 1400m, isMax: true);

        var stats = Bid(Users.An, 1500m);

        Assert.Equal(1500m, stats.Amount);
        Assert.Equal(Users.An, stats.HighBidUserId);
    }

    [Fact]
    public void Reset_RestoresSeed()
    {
        Bid(Users.An, 1300m);

        _store.Reset();

        var current = _store.GetCurrentBid(ItemId);
        Assert.Equal(1250m, current.Amount);
        Assert.Equal(7, current.NumberOfBids);
        Assert.Equal(Users.Binh, current.HighBidUserId);
    }
}
