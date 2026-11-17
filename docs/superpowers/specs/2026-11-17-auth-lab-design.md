# Auth Lifecycle Lab

## Current scope — approved follow-up

Only Bidder (`bid:place`) and Auctioneer (`product:update`, `event:close`) remain. Product reads are public. Auctioneer edits product name (1–100 characters) and description (0–300), without changing bid prices. Default/reset roles are empty. Client B calls authenticated `/api/me` to demonstrate bearer replay and access revocation. The four-part flow is a static diagram, not navigation. This supersedes Viewer/product:view, the eight-combination matrix and earlier tab navigation below.

## Original implementation brief

Approved scope: the four-part script agreed in chat on 17 November 2026. User explicitly requests lightweight Superpowers and continuous implementation; no further design approval or review ceremony.

- Story: Anna joins “Đấu giá thiện nguyện — Vì trẻ em”, bidding on “Tranh Bình Minh”. Vietnamese interface.
- Authenticate: wrong password fails; correct password issues real access/refresh credentials. Unauthenticated protected requests return 401.
- Stay signed in: subsequent requests use bearer access token. A second client panel can hold the same token and make real requests as Anna.
- Authorize: presenter selects any subset of Viewer, Bidder, Auctioneer. Permissions are a union: Viewer=view; Bidder=view+bid; Auctioneer=view+close. Zero roles grants nothing. Current server roles are checked on every request. Each action explains its decision. Denied actions can still be explicitly attempted against the server.
- Revoke: removing a role affects permission (403), revoking refresh prevents renewal without invalidating access, denylisting access prevents either copy authenticating (401). Expiry is also enforced.
- Auction closed / bid too low are business failures (409/422), distinct from authorization.
- Reset restores a clean scenario, including invalidation of all previous credentials. Separate browser labs must not interfere.

Implementation choices: independent `Auth/demo` ASP.NET Core net8 app with static frontend, port 5090. In-memory state and opaque random tokens, framework password hashing; no external provider, database, JWT or SignalR needed. Existing BidLab remains untouched. Presenter controls are intentionally privileged local lab controls, isolated by HttpOnly lab cookie and same-origin checks. Bind only loopback. Token values remain in page memory and are masked in traces.

Approaches considered: extend SignalR BidLab (adds transport noise); reuse Next app (unrelated protocol lab); standalone small ASP.NET app (chosen for clarity and no NuGet/frontend dependencies).

Verification: dependency-free Node integration tests exercise real HTTP including all 8 role combinations, credential lifecycle, copies, expiry, isolation and domain rejection. Browser inspect desktop/mobile and complete key walkthrough. No production/security completeness claim.
