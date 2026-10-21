<!-- ppt-master-schema: design-spec/v1 -->
# SignalR — More Than WebSocket - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | signalr_sharing_ppt169_20261021 |
| Canvas Format | PPT 16:9 (1280 × 720) |
| Page Count | 15 |
| Primary Language | en |
| Target Audience | Dev trong team Geronimo, đã dự buổi ProtoLab (Polling, Long polling, SSE, WebSocket, vấn đề mất kết nối); quen .NET và code TravelPledgeAuctions ở mức khác nhau |
| Communication Intent | Giải thích SignalR là framework (không chỉ WebSocket) và nó làm gì thay mình; định hướng mindset chuẩn bị khi dùng; mổ xẻ cách Geronimo dùng SignalR để sync bid (Phase 1 kết nối, Phase 2 bid và nhận cập nhật) bằng diagram flow code; chốt bằng best practice, nêu thẳng lỗ hổng bidderId và lộ max bid |
| Desired Audience Outcome | Người nghe nói được SignalR làm thay mình những gì và khi nào nên/không nên dùng; nhìn sơ đồ là biết một bid đi từ PLACE BID tới màn hình người khác ra sao, phần nào code Geronimo, phần nào SignalR; nhớ được vài best practice và hai lỗ hổng cần sửa |
| Core Message / Ask / Action | SignalR is a real-time framework, not a transport: it negotiates the transport, keeps the connection alive, turns calls into messages and fans them out — you write the business logic, and you still own identity and what you broadcast. |
| Delivery Context | Thuyết trình trực tiếp 30 phút cho team, slide tiếng Anh, nói tiếng Việt, demo BidLab chạy live ở slide Demo & Q&A; không speaker notes |
| Artifact Afterlife | File PPTX chỉnh sửa được, chia sẻ lại cho team kèm tài liệu deep-dive và presenter guide tiếng Việt |
| Reading Mode | presentation |
| Content Strategy | balanced (blank divergence field) — re-architect the deep-dive into a story arc, keep all substance, no outside facts. User revision: on slides use English names Anna (bidder, was An) and Ben (viewer, was Bình); never mention ProtoLab on slides. |
| Design Style | Custom narrative "case file" mode + custom editorial style on the ProtoLab palette with a violet SignalR layer |
| AI Image Acquisition Path | not applicable (image source: none) |
| Generation Mode | continuous |
| Spec Refinement | disabled |
| Speaker Notes | disabled — final Stage-2 proactive policy (also explicit in the delivery context) |
| Custom Animations | disabled — final Stage-2 proactive policy |
| Narration Audio | disabled — final Stage-2 proactive policy |
| Created Date | 2026-10-21 |

## II. Canvas Specification

| Property | Value |
| --- | --- |
| Format | PPT 16:9 |
| Dimensions | 1280 × 720 |
| viewBox | `0 0 1280 720` |
| Margins | 64 px left/right, 56 px top, 48 px bottom |
| Content Area | x 64–1216, y 56–672 |

## III. Visual Theme

### Theme Style

- **Mode**: custom
- **Mode References**: narrative
- **Mode Behavior**: Mở bằng một khoảnh khắc: An bấm PLACE BID, Bình thấy giá đổi. Câu hỏi 'ai đã làm việc đó?' kéo người nghe qua SignalR là gì, chuẩn bị gì, rồi lần theo dấu vết từng hàm; cao trào là hai lỗ hổng, kết bằng bài học. Tiêu đề là nhịp kể, không phải nhãn.
- **Visual style**: custom
- **Visual Style References**: editorial
- **Visual Style Behavior**: Bố cục biên tập: kicker nhỏ, tiêu đề serif lớn, đường kẻ mảnh và cột lệch; sơ đồ đặt như hình minh hoạ trong bài báo, có chú thích ngoài lề. Màu tím đánh dấu bằng chứng về SignalR, cyan cho code Geronimo, còn lại đơn sắc.
- **Theme**: A case file on one bid. A dashed violet band is the recurring "SignalR layer" — it appears wherever SignalR acts and is absent where Geronimo code acts (solid cyan), matching the BidLab demo legend.
- **Tone**: Curious, precise, candid about flaws; engineering peers talking to peers.

### Color Scheme

| Role | HEX | Purpose |
| --- | --- | --- |
| Background | #F7F9FC | Page field (ProtoLab) |
| Secondary background | #E8F4F8 | Geronimo-code boxes, quiet panels |
| Primary | #102A43 | Titles, server boundaries, rules |
| Accent | #007F9E | Geronimo code (solid outline), kickers |
| Secondary accent | #5B21B6 | SignalR layer and evidence (dashed outline, band fill #F1EBFD) |
| Body text | #243B53 | Main text |
| Secondary text | #526B80 | Captions, annotations, footnotes |
| Divider | #CAD7E2 | Hairline rules, lifelines, inactive paths |
| SignalR tint | #F1EBFD | Fill of the SignalR band / SignalR nodes |
| Warning | #B36A13 | Vulnerabilities and disconnects (text ≥ 18 px only or as rule/stroke) |

## IV. Typography System

### Font Plan

| Role | Character (Reference) | Primary | English if non-English | Fallback tail |
| --- | --- | --- | --- | --- |
| Title | editorial serif, lining figures | Cambria | — | serif |
| Body | neutral humanist sans | Segoe UI | — | sans-serif |
| Code | monospace for function names, frames, endpoints | Consolas | — | monospace |
| Display | editorial serif for cover hook and hero numerals | Cambria | — | serif |

- **Title stack**: Cambria, serif
- **Body stack**: Segoe UI, sans-serif
- **Code stack**: Consolas, monospace
- **Display stack**: Cambria, serif
- **Role rationale**: Code (Consolas) recurs on every architecture/flow page for hub methods, client events and wire frames; Display keeps the cover hook and hero numerals in the title family.

### Font Size Hierarchy

| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 28 |
| Title | 50 |
| Subtitle | 38 |
| Annotation | 22 |
| Kicker | 20 |
| Code | 22 |
| Footnote | 16 |
| Display | 88 |

## V. Layout Principles

### Deck-wide Direction

- **Hierarchy direction**: kicker (small caps-free label, cyan) → serif headline → one figure or short list; eye lands on the headline, then the diagram's highlighted unit.
- **Composition tendency**: editorial spreads — asymmetric column splits, a figure that owns most of the page with margin notes, hairline rules instead of cards; architecture/flow pages use a wide figure with the violet SignalR band.
- **Cross-page continuity**: the three-layer grammar (Geronimo code / SignalR band / network) recurs on P04, P08–P12 so the audience reads every flow the same way; solid cyan = Geronimo, dashed violet = SignalR, always with text labels.
- **Spacing posture**: open on anchor/breathing pages, denser on the flow pages.
- **Spacing anchors**: page margin 64 · block gap 24 · column gutter 40 · corner radius 4 · body leading 1.35

## VI. Icon Usage Specification

- **Primary bundled library**: tabler-outline
- **Stroke Width**: 2

| Icon Path | Suitable Scenarios |
| --- | --- |
| icons/tabler-outline/browser.svg | |
| icons/tabler-outline/server.svg | |
| icons/tabler-outline/plug-connected.svg | |
| icons/tabler-outline/refresh.svg | |
| icons/tabler-outline/shield-lock.svg | |
| icons/tabler-outline/users.svg | |
| icons/tabler-outline/user.svg | |
| icons/tabler-outline/database.svg | |
| icons/tabler-outline/alert-triangle.svg | |
| icons/tabler-outline/terminal-2.svg | |
| icons/tabler-outline/eye.svg | |
| icons/tabler-outline/clock.svg | |
| icons/tabler-outline/route.svg | |
| icons/tabler-outline/stack-2.svg | |
| icons/tabler-outline/hand-click.svg | |

## VII. Visualization Reference List

| Page | Family | Template | Usage |
| --- | --- | --- | --- |
| P06 | table | comparison_matrix | Compare raw WebSocket, SSE, polling, SignalR and Azure SignalR Service across what you must build yourself |

## VIII. Image Resource List

| Filename | Dimensions | Ratio | Purpose | Type | Image pattern | Crop Policy | Acquire Via | Status | Reference | text_policy | page_role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## IX. Content Outline

### Part 1: The moment and the framework

#### Slide 01 - Cover

- **Audience move**: knows the topic is "SignalR" → curious who moved Ben's price
- **Relationships**: hook line · title · presenter (order)
- **Cover impact**: hook "One click. Every screen." — Anna's bid appears on Ben's screen; composition Reference: two small browser frames joined by a dashed violet band, big serif title beside it
- **Title**: SignalR — More Than WebSocket
- **Core message**: One click updates every screen; something did that work.
- **Content**: kicker "Tech sharing · Geronimo" · title · hook "One click. Every screen. Who did the work?" · Tavian Nguyen

#### Slide 02 - The moment

- **Audience move**: sees a familiar real flow → wants to know the four answers
- **Relationships**: Anna clicks → Ben's price changes (order, link); four questions (order)
- **Composition**: left: the moment as two stacked mini item cards (Anna $1,300 → Ben "outbid"); right: the four questions as a numbered editorial list that doubles as the agenda
- **Title**: Anna clicks. Ben's price changes.
- **Core message**: Four questions take us from the click to the fix.
- **Content**: Anna bids $1,300 on Item #12 · Ben's screen: $1,300, "You have been outbid" — no refresh · 1 What is SignalR? · 2 What do we prepare? · 3 How does Geronimo sync a bid? · 4 What should we fix? · then live demo

#### Slide 03 - What raw WebSocket leaves to you

- **Audience move**: knows raw WebSocket → sees each chore it leaves as a SignalR feature
- **Relationships**: six hand-built jobs, each paired with the SignalR feature that replaces it (membership, link)
- **Composition**: two-column ledger with a hairline between: "With raw WebSocket you write…" vs "SignalR gives you…"
- **Title**: Everything raw WebSocket leaves to you
- **Core message**: The plumbing raw WebSocket leaves to you is exactly what SignalR ships.
- **Content**: Reconnect loop → withAutomaticReconnect() · WebSocket blocked → transport fallback (WS → SSE → Long polling) · Message format → Hub Protocol (JSON / MessagePack) · Request ↔ response matching → invoke() + invocationId · Socket list & broadcast → Clients.All / Caller / User / Group · Many servers → backplane (Redis / Azure SignalR)

#### Slide 04 - Framework, not transport

- **Audience move**: thinks "SignalR = WebSocket" → sees three layers
- **Relationships**: app code over SignalR over transport (parent / order); SignalR parts belong to the middle layer (membership)
- **Composition**: one wide stack diagram — top cyan "Your code: Hub methods · client handlers", middle dashed violet band "SignalR: HubConnection · Hub dispatch · HubLifetimeManager · Hub Protocol · negotiate · keep-alive", bottom grey "Transport: WebSockets › Server-Sent Events › Long Polling"; margin note
- **Title**: A framework, not a transport
- **Core message**: SignalR sits between your code and the wire.
- **Content**: Your code · SignalR layer (5–6 labelled parts) · Transport (3 options, auto-chosen) · margin note "built into ASP.NET Core; JS / .NET / Java clients"

#### Slide 05 - What it does for you

- **Audience move**: has the layers → can name concrete services
- **Relationships**: six services, parallel (membership)
- **Composition**: 3×2 editorial grid of keyword + one-line gloss with icons, hairlines only
- **Title**: Six jobs you no longer write
- **Core message**: SignalR handles connection, messaging and fan-out.
- **Content**: Negotiate (pick best transport) · Stay alive (ping 15s, timeout 30s) · Reconnect (0 / 2 / 10 / 30 s) · RPC both ways (invoke ↔ on) · Targeting (All · Caller · User · Group) · Scale-out (Redis backplane / Azure SignalR)

#### Slide 06 - When to use it

- **Audience move**: knows the features → can choose against alternatives
- **Relationships**: options compared on criteria (contrast)
- **Composition**: comparison matrix as the whole page, SignalR column highlighted with violet
- **Title**: Reach for it when both sides talk, often
- **Core message**: Pick SignalR for two-way, many-client, .NET real-time; simpler needs take simpler tools.
- **Content**: rows: Two-way · Fallback · Reconnect · Fan-out / groups · Multi-server · Best fit; columns: Polling · SSE · Raw WebSocket · SignalR · Azure SignalR Service; best fit: rare updates · server → client feeds · custom protocol / non-.NET · chat, bidding, dashboards on ASP.NET Core · same + managed scale
- **Visualization**: `when-to-use` comparison matrix (table/comparison_matrix)
- **Native-ready**: when-to-use=yes

### Part 2: Getting ready

#### Slide 07 - The mindset

- **Audience move**: wants to adopt → knows the steps and the traps to plan for
- **Relationships**: six preparation steps in order (order)
- **Composition**: vertical numbered sequence on the left two-thirds; right margin note "Hub methods are public API"
- **Title**: Before the first hub: six decisions
- **Core message**: Treat a hub as a public API and plan infrastructure early.
- **Content**: 1 Server — AddSignalR + MapHub (built in) · 2 Design the hub — methods = public API, events = contract · 3 Client — @microsoft/signalr, withAutomaticReconnect · 4 Identity — [Authorize], Context.UserIdentifier · 5 Infrastructure — proxy allows WebSockets, sticky sessions, backplane · 6 Limits — timeouts, 32 KB max message, groups

### Part 3: Following one bid

#### Slide 08 - TravelPledgeAuctions at a glance

- **Audience move**: knows SignalR in general → sees Geronimo's map
- **Relationships**: browsers ↔ BidHub / EventHub (link); Quartz job and services push through IHubContext (link); Redis backplane joins servers (link)
- **Composition**: one map: browser pages on the left, server box with three hubs in the middle, Redis below, background job feeding EventHub; violet band marks SignalR parts
- **Title**: Three hubs, one Redis backplane
- **Core message**: Bids flow through BidHub; closing pushes come from the server.
- **Content**: BidHub /bidhub — AddBid · AddBids → updateItem · updateEvent · addBidSuccess / addBidFail · EventHub /eventhub — closeItem(s) · closeEvent via IHubContext · MessageHub — sendMessage (not mapped) · AddSignalR().AddStackExchangeRedis(...) · clients: itemBid.js (Item page) · eventBidUpdates.js (Event page)

#### Slide 09 - Phase 1: connecting to a bid

- **Audience move**: sees connection as magic → knows the 2 lines Geronimo writes vs the handshake SignalR runs
- **Relationships**: client ↔ server exchange in order (order); Geronimo lines vs SignalR steps (contrast)
- **Composition**: sequence diagram Browser ↔ Server with lifelines; Geronimo's two lines in cyan at top; SignalR exchange inside the violet band; reconnect strip at bottom
- **Title**: Phase 1 — two lines, then SignalR takes over
- **Core message**: Geronimo writes build() and start(); SignalR negotiates, upgrades, handshakes and keeps the line alive.
- **Content**: Geronimo: new HubConnectionBuilder().withUrl("/bidhub").withAutomaticReconnect().build() · connection.start() · SignalR: POST /bidhub/negotiate → GET /bidhub?id=… (101 Upgrade) → {"protocol":"json","version":1} → {} → OnConnectedAsync · Geronimo: start().then → enable PLACE BID (itemBid.js:389) · lost? onreconnecting banner → retries 0/2/10/30 s → onreconnected

#### Slide 10 - Phase 2a: placing a bid

- **Audience move**: knows connection → can trace one click to AddBid's six steps
- **Relationships**: click → confirm → invoke → SignalR dispatch → six ordered steps (order); validation failure branches off (contrast)
- **Composition**: left-to-right function flow across three lanes (Browser · SignalR band · BidHub), six AddBid steps as a numbered column; failure branch as a side exit
- **Title**: Phase 2 — one click becomes AddBid
- **Core message**: SignalR turns invoke() into a message and dispatches it; BidHub runs six steps.
- **Content**: Geronimo: PLACE BID → CONFIRM → connection.invoke("AddBid", itemId, bidderId, bidAmount, isBuyNow, isMaxBid) · SignalR: Invocation type 1 + invocationId → find method → new BidHub via DI → bind args · BidHub.AddBid: 1 GetBidContextAsync · 2 ValidateBidRequest · 3 ProcessBidCreationAsync · 4 ProcessPostBidActionsAsync · 5 HandleBuyNowPurchaseAsync · 6 BroadcastBidUpdateAsync · invalid → addBidFail (Caller) + current state (All)

#### Slide 11 - Phase 2b: everyone gets the update

- **Audience move**: has the server result → sees how it reaches every screen
- **Relationships**: one broadcast fans out to many connections (parent / membership); Caller-only message to the bidder (contrast); Redis relays across servers (link)
- **Composition**: fan-out diagram: BroadcastBidUpdateAsync (cyan) → violet HubLifetimeManager → Redis → Anna and Ben browsers; per-browser handler labels; side note on updateEvent
- **Title**: Phase 2 — one line, every screen
- **Core message**: Geronimo writes one SendAsync; SignalR finds every connection and delivers.
- **Content**: Clients.All.SendAsync("updateItem", 9 args) · Clients.All.SendAsync("updateEvent", 7 args) · Clients.Caller.SendAsync("addBidSuccess", itemId, bidderId, isHighBidder) · Redis backplane → other servers · browsers: on("updateItem") → price · bids · winning / outbid banner · Item page has no updateEvent handler → ignored (Event page uses it) · HighBidUserId, not the clicker

#### Slide 12 - The server pushes too

- **Audience move**: thinks updates come from clicks → sees server-initiated pushes
- **Relationships**: three server-side sources push to clients without a request (membership, link)
- **Composition**: three short horizontal paths converging on IHubContext<EventHub> → browsers; breathing page
- **Title**: No click needed: closing items
- **Core message**: IHubContext lets jobs and services push outside a hub.
- **Content**: Quartz CloseItemAndEventQuartzJob → closeItems (batch, before closing) · Buy Now → ItemService.CloseItemForBidding → closeItem · EventOrderService → closeEvent · all via IHubContext<EventHub> · Clients.All

### Part 4: What to fix

#### Slide 13 - Two holes in the bid path

- **Audience move**: trusts the flow → sees two concrete vulnerabilities and their fixes
- **Relationships**: hole 1 cause → effect → fix (order); hole 2 cause → effect → fix (order); the two holes are parallel (membership)
- **Composition**: two editorial columns, each with a native console/DevTools frame as evidence, warning rule, and a one-line fix
- **Title**: Two holes: who bids, and what everyone sees
- **Core message**: Take identity from the connection and broadcast only public data.
- **Content**: Hole 1 — client-supplied identity: console › connection.invoke("AddBid", 1042, "<victim id>", 1300, false, false) → bid in the victim's name · bidderId from a hidden field · no [Authorize] · ids already broadcast in updateItem · fix: [Authorize] on AddBid + Context.UserIdentifier · Hole 2 — max bid leak: DevTools › WS › updateItem(…, "u-binh", true, 2000) → rival's max bid visible · fix: send isBuyNowAvailable, not the amount · not yet tested on production

#### Slide 14 - Do / Avoid

- **Audience move**: knows the holes → leaves with a short checklist
- **Relationships**: paired do / avoid items (contrast)
- **Composition**: two-column checklist with hairline divider; Do in cyan check marks, Avoid in warning marks
- **Title**: Seven habits for the next hub
- **Core message**: Small habits keep a hub safe and cheap.
- **Content**: Do: Groups per event/item, not Clients.All · identity from Context · broadcast only public data · resync after onreconnected · DetailedErrors only in Development · short, stateless hub methods · plan scale-out (sticky sessions / backplane) · Avoid: trusting ids in arguments · leaking private values · relying on reconnect to replay missed updates

#### Slide 15 - Demo & Q&A

- **Audience move**: has the model → sees it run live and asks questions
- **Relationships**: demo scenes in order (order); core message as takeaway
- **Closing impact**: takeaway "SignalR moves the message. You own who sends it and what it says." composition Reference: big serif takeaway with the four demo scenes as a small numbered strip
- **Title**: See it run: SignalR BidLab
- **Core message**: SignalR moves the message; you own identity and what you broadcast.
- **Content**: 1 Connect (negotiate → handshake) · 2 Bid (8 steps, Ben updates last) · 3 Max bid (outbid instantly) · 4 Go offline (reconnect 0/2/10 s) · http://127.0.0.1:5080 · Q&A

## X. Speaker Notes Requirements

- **Generation**: disabled
