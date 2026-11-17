using System.Security.Cryptography;

namespace AuthLab;

public sealed record AccessCredential(string Id, DateTimeOffset ExpiresAt, bool Revoked = false);
public sealed record RefreshCredential(DateTimeOffset ExpiresAt, bool Revoked = false);

public sealed class LabState
{
    public object Gate { get; } = new();
    public HashSet<string> Roles { get; private set; } = [];
    public Dictionary<string, AccessCredential> Access { get; } = [];
    public Dictionary<string, RefreshCredential> Refresh { get; } = [];
    public bool Closed { get; set; }
    public decimal CurrentBid { get; set; } = 1500000;
    public int BidCount { get; set; }
    public string ProductName { get; set; } = "Tranh Bình Minh";
    public string ProductDescription { get; set; } = "Tranh sơn dầu trên canvas, chủ đề bình minh.";
    public DateTimeOffset TouchedAt { get; set; } = DateTimeOffset.UtcNow;
    public static readonly Dictionary<string, string[]> RolePermissions = new()
    {
        ["Bidder"] = ["bid:place"],
        ["Auctioneer"] = ["product:update", "event:close"]
    };
    public string[] Permissions => Roles.SelectMany(r => RolePermissions[r]).Distinct().Order().ToArray();
    public object Snapshot() => new
    {
        roles = Roles.Order(), permissions = Permissions, rolePermissions = RolePermissions,
        auction = new { name = "Đấu giá thiện nguyện — Vì trẻ em", item = ProductName, description = ProductDescription, currentBid = CurrentBid, minimumBid = CurrentBid + 100000, bidCount = BidCount, closed = Closed },
        accessTokens = Access.Values.Select(t => new { t.Id, t.ExpiresAt, t.Revoked }),
        refreshActive = Refresh.Values.Count(t => !t.Revoked && t.ExpiresAt > DateTimeOffset.UtcNow)
    };
    public void SetRoles(IEnumerable<string> roles) => Roles = roles.ToHashSet();
    public void Reset()
    {
        Roles = [];
        Access.Clear(); Refresh.Clear(); Closed = false; CurrentBid = 1500000; BidCount = 0;
        ProductName = "Tranh Bình Minh";
        ProductDescription = "Tranh sơn dầu trên canvas, chủ đề bình minh.";
    }
    public object Issue(int accessSeconds)
    {
        var access = Token(); var refresh = Token();
        var expires = DateTimeOffset.UtcNow.AddSeconds(accessSeconds);
        var id = "AT-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(3));
        Access[access] = new(id, expires);
        Refresh[refresh] = new(DateTimeOffset.UtcNow.AddMinutes(30));
        return new { accessToken = access, refreshToken = refresh, accessId = id, expiresAt = expires, tokenType = "Bearer", user = "Anna" };
    }
    public static string Token() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
}
