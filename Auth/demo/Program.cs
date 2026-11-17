using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Encodings.Web;
using AuthLab;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);
var port = int.TryParse(Environment.GetEnvironmentVariable("AUTHLAB_PORT"), out var p) ? p : 5090;
var accessSeconds = int.TryParse(Environment.GetEnvironmentVariable("AUTHLAB_ACCESS_SECONDS"), out var s) ? Math.Clamp(s, 1, 3600) : 600;
builder.WebHost.UseUrls($"http://127.0.0.1:{port}");
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 8192);
builder.Services.AddAuthentication("LabBearer").AddScheme<AuthenticationSchemeOptions, LabBearerHandler>("LabBearer", _ => { });
builder.Services.AddAuthorization();
var app = builder.Build();
var labs = new ConcurrentDictionary<string, LabState>();
var passwordHasher = new PasswordHasher<string>();
var passwordHash = passwordHasher.HashPassword("anna", "Anna@123!");

app.Use(async (ctx, next) =>
{
    if (ctx.Request.Host.Host is not ("127.0.0.1" or "localhost")) { ctx.Response.StatusCode = 400; return; }
    ctx.Response.Headers["X-Content-Type-Options"] = "nosniff";
    ctx.Response.Headers["X-Frame-Options"] = "DENY";
    ctx.Response.Headers["Referrer-Policy"] = "no-referrer";
    ctx.Response.Headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
    if (!ctx.Request.Path.StartsWithSegments("/api")) { await next(); return; }
    ctx.Response.Headers.CacheControl = "no-store";
    if (ctx.Request.Method == "POST")
    {
        var expected = $"{ctx.Request.Scheme}://{ctx.Request.Host}";
        if (ctx.Request.Headers.Origin != expected)
        { await Reply(ctx, 403, "guard", "Chỉ chấp nhận thao tác từ trang demo cùng origin."); return; }
        if (!ctx.Request.HasJsonContentType())
        { await Reply(ctx, 415, "guard", "Request phải dùng application/json."); return; }
    }
    if (ctx.Request.Path == "/api/health") { await next(); return; }
    foreach (var pair in labs.Where(x => x.Value.TouchedAt < DateTimeOffset.UtcNow.AddHours(-2))) labs.TryRemove(pair.Key, out _);
    var id = ctx.Request.Cookies["authlab"];
    if (id is null || !labs.TryGetValue(id, out var lab))
    {
        if (labs.Count >= 200) { await Reply(ctx, 503, "guard", "Đã đạt giới hạn lab đang mở."); return; }
        id = LabState.Token(); lab = new LabState(); labs[id] = lab;
        ctx.Response.Cookies.Append("authlab", id, new CookieOptions { HttpOnly = true, SameSite = SameSiteMode.Strict, IsEssential = true, MaxAge = TimeSpan.FromHours(2) });
    }
    lab.TouchedAt = DateTimeOffset.UtcNow;
    ctx.Items["lab"] = lab;
    await next();
});
app.UseDefaultFiles(); app.UseStaticFiles();
app.UseAuthentication(); app.UseAuthorization();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", service = "Auth Lifecycle Lab" }));
app.MapGet("/api/lab", (HttpContext ctx) => { var lab = Lab(ctx); lock (lab.Gate) return Results.Ok(lab.Snapshot()); });
app.MapPost("/api/login", (LoginInput input, HttpContext ctx) =>
{
    if (input.Username != "anna" || input.Password is null || passwordHasher.VerifyHashedPassword("anna", passwordHash, input.Password) == PasswordVerificationResult.Failed)
        return Results.Json(new { stage = "authenticate", message = "Tên đăng nhập hoặc mật khẩu không đúng." }, statusCode: 401);
    var lab = Lab(ctx);
    lock (lab.Gate)
    {
        // Bound memory for long presentation sessions; retain expired entries briefly to explain expiry.
        foreach (var token in lab.Access.Where(x => x.Value.ExpiresAt < DateTimeOffset.UtcNow.AddMinutes(-5)).Select(x => x.Key).ToArray()) lab.Access.Remove(token);
        foreach (var token in lab.Refresh.Where(x => x.Value.Revoked || x.Value.ExpiresAt < DateTimeOffset.UtcNow).Select(x => x.Key).ToArray()) lab.Refresh.Remove(token);
        if (lab.Access.Count >= 100) return Results.Json(new { stage = "authenticate", message = "Quá nhiều lần đăng nhập; hãy Reset demo." }, statusCode: 429);
        return Results.Ok(lab.Issue(accessSeconds));
    }
});
app.MapPost("/api/refresh", (RefreshInput input, HttpContext ctx) =>
{
    var lab = Lab(ctx);
    lock (lab.Gate)
    {
        if (input.RefreshToken is null || !lab.Refresh.TryGetValue(input.RefreshToken, out var token) || token.Revoked || token.ExpiresAt <= DateTimeOffset.UtcNow)
            return Results.Json(new { stage = "authenticate", message = "Refresh token không còn hiệu lực." }, statusCode: 401);
        lab.Refresh[input.RefreshToken] = token with { Revoked = true };
        return Results.Ok(lab.Issue(accessSeconds));
    }
});
app.MapPost("/api/presenter/roles", (RolesInput input, HttpContext ctx) =>
{
    if (input.Roles is null || input.Roles.Any(r => string.IsNullOrEmpty(r) || !LabState.RolePermissions.ContainsKey(r)))
        return Results.BadRequest(new { stage = "validate", message = "Role không hợp lệ." });
    var lab = Lab(ctx); lock (lab.Gate) { lab.SetRoles(input.Roles); return Results.Ok(lab.Snapshot()); }
});
app.MapPost("/api/presenter/reset", (HttpContext ctx) => { var lab = Lab(ctx); lock (lab.Gate) { lab.Reset(); return Results.Ok(lab.Snapshot()); } });
app.MapPost("/api/presenter/revoke-refresh", (HttpContext ctx) =>
{
    var lab = Lab(ctx); lock (lab.Gate)
    {
        foreach (var key in lab.Refresh.Keys.ToArray()) lab.Refresh[key] = lab.Refresh[key] with { Revoked = true };
        return Results.Ok(new { stage = "revoke", message = "Đã thu hồi refresh token của Anna." });
    }
});
app.MapPost("/api/presenter/revoke-access", (RevokeInput input, HttpContext ctx) =>
{
    var lab = Lab(ctx); lock (lab.Gate)
    {
        if (input.AccessToken is null || !lab.Access.TryGetValue(input.AccessToken, out var token))
            return Results.BadRequest(new { stage = "revoke", message = "Không tìm thấy access token trong lab này." });
        lab.Access[input.AccessToken] = token with { Revoked = true };
        return Results.Ok(new { stage = "revoke", message = $"Đã thu hồi access token {token.Id}." });
    }
});
app.MapGet("/api/products/current", (HttpContext ctx) =>
{
    var lab = Lab(ctx); lock (lab.Gate)
        return Results.Ok(new { stage = "public", message = "Đã tải thông tin sản phẩm.", product = new { name = lab.ProductName, description = lab.ProductDescription, eventName = "Đấu giá thiện nguyện — Vì trẻ em", currentBid = lab.CurrentBid, minimumBid = lab.CurrentBid + 100000, bidCount = lab.BidCount, eventClosed = lab.Closed } });
}).AllowAnonymous();
app.MapGet("/api/me", (HttpContext ctx) => Results.Ok(new { stage = "authenticate", message = "Đã xác thực: Anna.", user = ctx.User.Identity!.Name })).RequireAuthorization();
app.MapPost("/api/products/current", (ProductInput input, HttpContext ctx) => Action(ctx, "product:update", lab =>
{
    if (string.IsNullOrWhiteSpace(input.Name) || input.Name.Trim().Length > 100 || input.Description is null || input.Description.Length > 300)
        return Results.BadRequest(new { stage = "validate", message = "Tên sản phẩm cần 1–100 ký tự; mô tả tối đa 300 ký tự." });
    lab.ProductName = input.Name.Trim();
    lab.ProductDescription = input.Description.Trim();
    return Results.Ok(new { stage = "business", message = "Đã cập nhật sản phẩm." });
})).RequireAuthorization();
app.MapPost("/api/bids", (BidInput input, HttpContext ctx) => Action(ctx, "bid:place", lab =>
{
    if (lab.Closed) return Results.Json(new { stage = "business", message = "Event đấu giá đã đóng." }, statusCode: 409);
    if (input.Amount < lab.CurrentBid + 100000 || input.Amount > 1000000000 || input.Amount != decimal.Truncate(input.Amount))
        return Results.Json(new { stage = "business", message = $"Giá đặt phải là số nguyên từ {lab.CurrentBid + 100000:N0} đến 1.000.000.000 đồng." }, statusCode: 422);
    lab.CurrentBid = input.Amount; lab.BidCount++;
    return Results.Ok(new { stage = "business", message = $"Anna đã đặt {input.Amount:N0} đồng cho {lab.ProductName}." });
})).RequireAuthorization();
app.MapPost("/api/event/close", (HttpContext ctx) => Action(ctx, "event:close", lab =>
{
    if (lab.Closed) return Results.Json(new { stage = "business", message = "Event đã được đóng trước đó." }, statusCode: 409);
    lab.Closed = true; return Results.Ok(new { stage = "business", message = "Đã đóng event đấu giá." });
})).RequireAuthorization();
app.Run();

static LabState Lab(HttpContext ctx) => (LabState)ctx.Items["lab"]!;
static IResult Action(HttpContext ctx, string permission, Func<LabState, IResult> execute)
{
    var lab = Lab(ctx); lock (lab.Gate)
    {
        if (!lab.Permissions.Contains(permission))
            return Results.Json(new { stage = "authorize", permission, roles = lab.Roles, message = $"Không có quyền {permission}." }, statusCode: 403);
        return execute(lab);
    }
}
static async Task Reply(HttpContext ctx, int status, string stage, string message)
{ ctx.Response.StatusCode = status; await ctx.Response.WriteAsJsonAsync(new { stage, message }); }

record LoginInput(string? Username, string? Password);
record RefreshInput(string? RefreshToken);
record RolesInput(string[]? Roles);
record RevokeInput(string? AccessToken);
record BidInput(decimal Amount);
record ProductInput(string? Name, string? Description);

sealed class LabBearerHandler(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (Context.Items["lab"] is not LabState lab) return Task.FromResult(AuthenticateResult.NoResult());
        var header = Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return Task.FromResult(AuthenticateResult.NoResult());
        var raw = header[7..];
        lock (lab.Gate)
        {
            if (!lab.Access.TryGetValue(raw, out var token)) return Fail("Access token không hợp lệ.");
            if (token.Revoked) return Fail("Access token đã bị thu hồi.");
            if (token.ExpiresAt <= DateTimeOffset.UtcNow) return Fail("Access token đã hết hạn.");
            var identity = new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "anna"), new Claim(ClaimTypes.Name, "Anna")], Scheme.Name);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name)));
        }
    }
    Task<AuthenticateResult> Fail(string message) { Context.Items["authError"] = message; return Task.FromResult(AuthenticateResult.Fail(message)); }
    protected override async Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode = 401; Response.Headers.WWWAuthenticate = "Bearer";
        await Response.WriteAsJsonAsync(new { stage = "authenticate", message = Context.Items["authError"] as string ?? "Yêu cầu xác thực." });
    }
}
