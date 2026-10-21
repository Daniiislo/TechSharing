namespace BidLab.Auction;

// Thay cho BidService/ItemService + DB + Redis cache của Geronimo: một item, lưu trong memory.
public class AuctionStore
{
    public const int SeedItemId = 1042;

    // ponytail: global lock, đủ cho demo 2 user.
    private readonly object _lock = new();
    private readonly Item _item = new(SeedItemId, 12, 7, "Maui Getaway – 5 Nights at Wailea", 500m, 50m, 3000m,
        new DateTime(2026, 10, 31, 2, 0, 0, DateTimeKind.Utc));
    private readonly List<Bid> _bids = new();   // bid thường (đã xảy ra)
    private readonly Dictionary<string, Bid> _maxBids = new();  // max bid còn hiệu lực theo user
    private int _nextId;

    public AuctionStore() => Reset();

    public void Reset()
    {
        lock (_lock)
        {
            _bids.Clear();
            _maxBids.Clear();
            _nextId = 0;
            var seed = new[] { (Users.An, 500m), (Users.Binh, 600m), (Users.An, 750m), (Users.Binh, 900m),
                (Users.An, 1000m), (Users.Binh, 1150m), (Users.Binh, 1250m) };
            foreach (var (user, amount) in seed) Add(user, amount);
        }
    }

    public Item GetItem(int id) =>
        id == _item.Id ? _item : throw new KeyNotFoundException($"Item with ID {id} not found.");

    public (Bid? HighestBid, Bid? HighestMaxBid) GetHighestBids(int itemId)
    {
        lock (_lock) return (_bids.LastOrDefault(), _maxBids.Values.MaxBy(b => b.Amount));
    }

    public bool CanBidderBid(int itemId, string bidderId) => true;

    public bool AvailableForBidding(Item item) => DateTime.UtcNow < item.ClosingTime;

    public ItemBidStats GetCurrentBid(int itemId)
    {
        lock (_lock) return Stats();
    }

    // Geronimo render MyBidAmount phía server vào hidden field #my-bid-amount.
    public decimal GetMyBidAmount(int itemId, string userId)
    {
        lock (_lock) return _bids.Where(b => b.UserId == userId).Select(b => b.Amount).DefaultIfEmpty(0).Max();
    }

    public ItemBidStats CreateBid(BidCreationRequest r)
    {
        lock (_lock)
        {
            var increment = r.Item.BidIncrement;
            var current = _bids.Last();
            var rival = _maxBids.Values.Where(b => b.UserId != r.BidderId).MaxBy(b => b.Amount);

            if (r.IsMaxBid)
            {
                _maxBids[r.BidderId] = new Bid(0, r.BidderId, r.BidAmount, true);
                if (rival is not null && rival.Amount >= r.BidAmount)
                {
                    // Max của đối thủ vẫn cao hơn: đối thủ tự trả cao hơn max mới một bước.
                    Add(r.BidderId, r.BidAmount);
                    Add(rival.UserId, Math.Min(rival.Amount, r.BidAmount + increment));
                }
                else if (current.UserId != r.BidderId)
                {
                    var floor = current.Amount + increment;
                    Add(r.BidderId, rival is null ? floor : Math.Min(r.BidAmount, Math.Max(floor, rival.Amount + increment)));
                }
                return Stats();
            }

            Add(r.BidderId, r.BidAmount);
            if (rival is not null && rival.Amount >= r.BidAmount + increment)
                Add(rival.UserId, Math.Min(rival.Amount, r.BidAmount + increment));
            else if (rival is not null && rival.Amount >= r.BidAmount)
                Add(rival.UserId, rival.Amount);
            return Stats();
        }
    }

    private void Add(string user, decimal amount) => _bids.Add(new Bid(++_nextId, user, amount, false));

    private ItemBidStats Stats()
    {
        var high = _bids.Last();
        return new ItemBidStats(high.Id, high.Amount, high.Amount + _item.BidIncrement, _bids.Count, high.UserId);
    }
}
