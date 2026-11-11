<!-- ppt-master-schema: design-spec/v1 -->
# Auth Beyond the Login Screen - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | auth_beyond_login_ppt169_20261110 |
| Canvas Format | PPT 16:9 (1280 × 720) |
| Page Count | 25 |
| Primary Language | en |
| Target Audience | Developers in the Geronimo team, with varied .NET experience and the previous SignalR sharing as context |
| Communication Intent | Explain authentication mechanisms, connect sessions and delegated API access to resource authorization, and show why detection and revocation remain necessary |
| Desired Audience Outcome | Trace one bid from identity proof through session and resource permission to server-enforced revocation |
| Core Message / Ask / Action | Identity proof, session continuity, resource permission and revocation are distinct responsibilities on one request path |
| Delivery Context | Live talk in Vietnamese with English slides, 43 minutes including a 5-minute demo slot and Q&A; 19 main pages plus 6 reference pages |
| Artifact Afterlife | Editable PowerPoint plus Vietnamese presenter guide and existing research docs |
| Reading Mode | presentation |
| Content Strategy | Preserve the accepted 20-page story and required mechanisms; put protocol validation and implementation details in appendix; distinguish proposed BidLab demo from implemented behavior |
| Design Style | Custom editorial engineering narrative inheriting SignalR typography and navy/cyan identity |
| AI Image Acquisition Path | not applicable |
| Generation Mode | continuous |
| Spec Refinement | disabled |
| Speaker Notes | disabled — inherited user requirement; Vietnamese guide is a separate document |
| Custom Animations | disabled — static diagrams with numbered steps |
| Narration Audio | disabled — live delivery |
| Created Date | 2026-11-10 |

## II. Canvas Specification

| Property | Value |
| --- | --- |
| Format | PPT 16:9 |
| Dimensions | 1280 × 720 |
| viewBox | `0 0 1280 720` |
| Margins | 64 px left/right, 48 px top/bottom |
| Content Area | x 64–1216, y 48–672 |

## III. Visual Theme

### Theme Style

- **Mode**: custom
- **Mode Behavior**: Begin with Anna placing a bid after login. Introduce each mechanism in response to a question on that path, keep the same actors across related diagrams, and return to the four opening questions at the close. Appendix pages answer implementation questions without extending the main talk.
- **Visual style**: custom
- **Visual Style Behavior**: Use the inherited editorial serif headlines, open sans-serif explanations and monospace artifacts. Fine rules separate regions, while meaningful server/device boundaries contain credentials. Diagrams dominate mechanism pages, questions carry breathing pages and the appendix uses compact but readable annotations.
- **Theme**: Follow one authenticated request from evidence to enforcement. Cyan emphasizes the currently explained artifact or check; navy defines actors and trusted boundaries. Violet dashed lines retain the previous deck's SignalR meaning only.
- **Tone**: Precise, explanatory, candid about limitations.

### Color Scheme

| Role | HEX | Purpose |
| --- | --- | --- |
| Background | #F7F9FC | Slide field |
| Secondary background | #E8F4F8 | Authenticator or server context |
| Primary | #102A43 | Headings and boundaries |
| Accent | #007F9E | Current proof, artifact or check |
| Secondary accent | #5B21B6 | SignalR only |
| Body text | #243B53 | Primary explanations |
| Secondary text | #526B80 | Captions and citations |
| Divider | #CAD7E2 | Lifelines and rules |
| Warning | #9C5A0A | Threats and caveats |

## IV. Typography System

### Font Plan

| Role | Character (Reference) | Primary | English if non-English | Fallback tail |
| --- | --- | --- | --- | --- |
| Title | Editorial serif | Cambria | — | serif |
| Body | Humanist sans | Segoe UI | — | sans-serif |
| Code | Technical artifacts | Consolas | — | monospace |
| Display | Opening title and hero questions | Cambria | — | serif |

- **Title stack**: Cambria, serif
- **Body stack**: Segoe UI, sans-serif
- **Code stack**: Consolas, monospace
- **Display stack**: Cambria, serif
- **Role rationale**: Code distinguishes credential names and functions; display inherits the title face for the cover and closing.

### Font Size Hierarchy

| Purpose | Anchor Size (px) |
| --- | ---: |
| Body | 28 |
| Title | 46 |
| Subtitle | 36 |
| Lead | 32 |
| Annotation | 22 |
| Code | 24 |
| Kicker | 18 |
| Footnote | 16 |
| Display | 76 |

## V. Layout Principles

### Deck-wide Direction

- Sparse cover and closing. Mechanism pages use wide sequence diagrams, paired ownership fields or explicit validation paths. Role/resource pages use a decision progression.
- Keep app left, server right on TOTP. Use a single key-placement or message-flow visual on each passkey and OAuth page. Put full sequences and validation checks in the presenter guide.
- Use labeled rules and arrows for actual exchanges. Do not imply private keys cross to the backend. Keep source notes small at the bottom and English-only visible text.
- Preserve whitespace around titles and reserve an independent takeaway region. Relationship labels belong to their own lines and should not collide with other exchanges.
- Main pages use 28 px body and 22 px annotations; appendix detail uses annotations in generously spaced groups. Do not solve overflow by reducing below the declared role band.

## VI. Icon Usage Specification

- **Primary bundled library**: none

| Icon Path | Suitable Scenarios |
| --- | --- |

No icon asset is needed: actor names and credential labels carry precise identity; no documentary screenshot is asserted. eBay is a sourced text example, not a depicted interface.

## VIII. Image Resource List

| Filename | Dimensions | Ratio | Purpose | Type | Image pattern | Crop Policy | Acquire Via | Status | Reference | text_policy | page_role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

Apply the common header, body and footer coordinates in `layout.json` to all slides. On topic slides, use the exact numbered Agenda section as the small cyan label above the slide title. Keep the title and optional context aligned with the cover and Agenda.

## IX. Content Outline

#### Slide 01 - Beyond the Login Screen
- **Audience move**: A single sign-in action → the lifecycle the system must support.
- **Relationships**: Authentication establishes identity. The session carries it across requests. Authorization checks what that identity can do. Revocation ends access when needed.
- **Title**: Beyond the Login Screen
- **Core message**: Login begins a longer access-control lifecycle.
- **Content**: Authenticate → Maintain Session → Authorize → Revoke Access; Tavian Nguyen.
- **Composition**: Large title above a horizontal flow of four labeled icons. The final arrow is dashed to indicate revocation when needed. Presenter name sits just above the footer.

#### Slide 02 - Agenda
- **Audience move**: The cover's four-step lifecycle → know what the session will cover.
- **Relationships**: The agenda follows the presentation order from authentication to the BidLab walkthrough and Q&A.
- **Title**: Agenda
- **Core message**: The talk covers identity proof, request continuity, permissions and revocation, then compares architectures and applies one to BidLab.
- **Content**: Authentication & Sign-In; Sessions & Tokens; Authorization; Session Security & Revocation; Choosing an Auth Architecture; BidLab Walkthrough & Q&A.
- **Composition**: Six ordered rows, each with a topic and a brief preview of its content.

#### Slide 03 - Authentication Overview
- **Audience move**: Agenda → map the authentication topics before the details.
- **Relationships**: A user can sign in directly with the app or through an identity provider. OIDC conveys the sign-in result, OAuth delegates API access and PKCE protects the code exchange.
- **Title**: Authentication Overview
- **Core message**: Direct and federated sign-in are two routes for establishing identity.
- **Content**: Password; server-issued SMS/email codes and TOTP; passkey; OIDC; OAuth 2.0; PKCE.
- **Composition**: A sign-in node branches into two routes.

#### Slide 04 - Three Types of Authentication Factors
- **Audience move**: Recognize the three types of evidence used in MFA.
- **Relationships**: Passwords illustrate knowledge, security keys illustrate possession and fingerprints illustrate inherence.
- **Title**: Three Types of Authentication Factors
- **Core message**: MFA combines at least two distinct factor types and can apply to either sign-in route.
- **Content**: Something you know (password, PIN, passphrase); something you have (security key, enrolled OTP app, smart card); something you are (fingerprint, face scan, iris scan).
- **Composition**: Three illustrations above a short MFA definition and a separately labeled password-plus-OTP example.

#### Slide 05 - TOTP: Your Authenticator Works Offline
- **Audience move**: OTP needs message delivery → an authenticator can compute its code offline.
- **Relationships**: The enrolled authenticator and server independently compute the same code from a shared key and matching time step. The user submits the displayed code over the sign-in connection.
- **Title**: TOTP: Your Authenticator Works Offline
- **Core message**: The authenticator needs no internet to generate a code. The server verifies the submitted code against the expected code for the account.
- **Content**: Offline authenticator; shared key and clocks; matching example codes; example 30-second timeline; user submission and server verification.

#### Slide 06 - Passkeys: Register and Sign In
- **Audience move**: Understand how a registered passkey proves identity on a later sign-in.
- **Relationships**: At registration, the server sends a challenge and the authenticator creates a key pair. The browser returns the registration response, and the server stores the public key. At sign-in, the authenticator signs a fresh challenge and the server verifies the response with the registered public key.
- **Title**: Passkeys: Register and Sign In
- **Core message**: Registration stores the public key. Sign-in verifies a signature produced with the matching private key.
- **Content**: Add a passkey; registration challenge; create key pair; save public key; sign-in challenge; sign locally; verify against stored key.
- **Composition**: Two sequence diagrams with the same Server, Browser and Authenticator lifelines. Each shows the request names, the WebAuthn call, and the local work in the authenticator lane.

#### Slide 07 - OIDC: Who Signed In?
- **Audience move**: Follow federated sign-in from redirect to an app session.
- **Relationships**: Anna signs in at an identity provider. The browser returns an authorization code. The app exchanges it, validates the ID token and starts its own session.
- **Title**: OIDC: Who Signed In?
- **Core message**: The ID token lets the calendar app verify who signed in.
- **Composition**: Calendar app and identity provider exchange four labeled messages.

#### Slide 08 - OAuth 2.0: What Can the App Access?
- **Audience move**: Identify Anna → understand what the app can do on her behalf.
- **Relationships**: The authorization server issues a scoped access token. The calendar app presents it to the Calendar API, which checks the grant and returns events.
- **Title**: OAuth 2.0: What Can the App Access?
- **Core message**: The access token gives the app scoped access to the API.
- **Composition**: The app sits between the authorization server and the Calendar API. The highlighted arrows show where the access token is issued and used.

#### Slide 09 - PKCE: Protecting the Code Exchange
- **Audience move**: Follow the authorization code → understand the proof required to redeem it.
- **Relationships**: The app keeps a random verifier and sends its derived challenge. The server binds the challenge to the code and verifies the revealed verifier at exchange.
- **Title**: PKCE: Protecting the Code Exchange
- **Core message**: The authorization server checks for the matching verifier before issuing tokens.
- **Composition**: Two labeled phases align the app and authorization server and highlight the exchange.

#### Slide 10 - Sessions and Cookies
- **Audience move**: Authentication once → session credential on later requests.
- **Relationships**: Login causes server-side session creation and browser cookie; later request presents session ID for server lookup.
- **Title**: Sessions and Cookies
- **Core message**: A new request needs a checked session or token.
- **Content**: After Anna signs in, the browser uses a session cookie on her next protected request. Anna signs in; Server creates a session; Browser sends a cookie; With the next request; Server finds the session; Anna · Active.
- **Presenter detail**: Browser cookie sid; server session sid → Anna, active; later bid request; session lookup; cookie is transport/storage, session is access state; protected cookie tickets are another design.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 11 - Bearer Tokens
- **Audience move**: Valid signature means safe → bearer copies may work.
- **Relationships**: Anna and a lab client can present copies of one bearer credential to the same verifier.
- **Title**: Bearer Tokens
- **Core message**: Validity does not prove who holds the credential.
- **Content**: Anyone holding a valid bearer token can present it to the API. Anna sends Token A; Original token; API sees Anna; Another client sends Token A; Copied token; API sees Anna.
- **Presenter detail**: Anna; copied bearer credential; lab client; API sees same identity; JWT is a format; bearer is a usage model; signature is not encryption.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 12 - Common Authorization Models
- **Audience move**: Identify the information each model or mechanism uses to decide access.
- **Relationships**: RBAC maps role to permission. ABAC compares attributes. ReBAC checks relationships. An ACL lists direct grants on a resource.
- **Title**: Common Authorization Models
- **Core message**: Authorization decides whether an actor may perform an action on a resource.
- **Content**: Roles grant permissions; policies evaluate attributes; resource relationships determine permissions; an ACL records grants on a resource.
- **Composition**: Four rows pair the full model or mechanism name with the access check it performs.

#### Slide 13 - Can Anna Bid on This Auction?
- **Audience move**: Follow the same policy to two different decisions.
- **Relationships**: The resource policy requires the role permission, a tenant match and an invitation to the auction.
- **Title**: Can Anna Bid on This Auction?
- **Core message**: One resource policy can combine role, attribute and relationship checks.
- **Content**: Anna has the Bidder role and shares a tenant with both auctions. Auction 42 has an invitation and is allowed. Auction 99 has no invitation and is denied. Business rules apply after authorization succeeds.
- **Composition**: Compare the checks and decision side by side for the two auctions.

#### Slide 14 - Where to Customize Auth
- **Audience move**: Custom auth as one task → three extension responsibilities.
- **Relationships**: Credential validation precedes internal identity mapping and resource authorization.
- **Title**: Where to Customize Auth
- **Core message**: Customize the layer that owns the requirement.
- **Content**: Choose the extension point based on what you need to change. Validate credential; Authentication handler; Map the account; Issuer + subject; Decide permission; Resource policy.
- **Presenter detail**: Validate credential: standard middleware or scheme handler; map identity: issuer + subject → local bidder; authorize resource: policy/handler; use trusted data; no need to invent a protocol.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 15 - Refresh Token Rotation
- **Audience move**: Server always knows theft → uncertain signals and reuse evidence.
- **Relationships**: Rotation replaces R1 with R2; presentation of old R1 is evidence of reuse, not conclusive attacker identity.
- **Title**: Refresh Token Rotation
- **Core message**: Signals inform a response; they do not guarantee detection.
- **Content**: Each successful refresh issues a replacement token and retires the previous one. Client uses R1; Refresh succeeds; Server issues R2; R1 is retired; R1 appears again; Server detects reuse; Possible causes include a stolen copy or two refresh attempts close together.
- **Presenter detail**: User report, unusual activity, factor changes; new IP is uncertain; R1 used → R2 issued → R1 replayed; investigate copy versus race/retry; only where rotation exists.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 16 - Session Revocation
- **Audience move**: Revoke button → enforcement at each access path.
- **Relationships**: Revocation state must reach session lookup, API checks, refresh issuance and active connection handling as applicable.
- **Title**: Session Revocation
- **Core message**: Change a condition that the request handler actually checks.
- **Content**: After the server revokes Anna’s session, her next bid request must be rejected. Before revocation; Accepted; Session is active; After revocation; Rejected; Session is revoked; Same bid; The request handler must check the updated state.
- **Presenter detail**: Session: inactive; access token: state check or expiry; refresh: revoke token/family; SignalR: disconnect or recheck sensitive commands; clear-cookie is insufficient; recover account after containment.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 17 - Four Project Setups and When to Use Them
- **Audience move**: Understand the lifecycle → choose a design for project requirements.
- **Relationships**: Client topology, identity provider and revocation latency inform how an app authenticates users and handles credentials.
- **Title**: Four Project Setups and When to Use Them
- **Core message**: Choose sign-in and session handling by project needs, including how quickly access must stop.
- **Content**: Start with who signs in, what calls the API, and where credentials are stored. Same-origin web; Session cookie; Browser talks to one backend.; Company SSO; OIDC + app session; Reuse the company identity provider.; SPA with a backend; Backend for Frontend; Keep API tokens on the server.; Mobile + API; OIDC code flow + PKCE; Use the system browser for sign-in.; Need immediate revocation? Check current state on the request path.
- **Presenter detail**: Same-origin web and cookies; company SSO with OIDC plus app session; SPA with BFF; native mobile with OIDC Code + PKCE and access tokens; immediate revocation requires access to current state.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 18 - Three Outcomes in BidLab
- **Audience move**: Theory → concrete expected server outcomes.
- **Relationships**: Valid bid precedes out-of-scope rejection, followed by revocation and retry of old access.
- **Title**: Three Outcomes in BidLab
- **Core message**: Observe server decisions on the same request path.
- **Content**: Three expected outcomes in the proposed lab, using Anna’s account. Allow the bid; Auction 42 is within scope; Deny the bid; Auction 99 is outside scope; Revoke the session; Retry on Auction 42 fails; Design choice: check server-side session state on the next request.
- **Presenter detail**: Proposed lab scenario, implementation pending; 1 allowed auction; 2 different auction denied; 3 old session rejected after revoke; include open connection; controlled test credentials only.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 19 - Auth Lifecycle Recap
- **Audience move**: Many terms → reusable four-question review.
- **Relationships**: Identity, continuity, permission and termination are complementary checks on one bid.
- **Title**: Auth Lifecycle Recap
- **Core message**: Trace proof, session, permission and revocation.
- **Content**: Follow one bid through sign-in, session handling, authorization and revocation. Authenticate; Prove identity; Maintain session; Recognize the request; Authorize; Check the auction; Revoke access; Reject old access.
- **Presenter detail**: Who are you? Which session? May you bid here? Can access stop?; Questions.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.

#### Slide 20 - TOTP Verification Checklist
- **Audience move**: An offline matching code → what the verifier needs to check.
- **Relationships**: Both sides derive the same time step from the clock and share enrollment parameters.
- **Title**: TOTP Verification Checklist
- **Core message**: Protect enrollment, allow limited clock drift and prevent replay.
- **Content**: The server matches the submitted code against a narrow window around the current time. Protect enrollment; Unique shared key; Match the time step; Allow limited clock drift; Accept a step once; Limit attempts and replay; Time step = floor((UnixTime − T0) / X). X is commonly 30 seconds.
- **Presenter detail**: T = floor((UnixTime - T0) / X); commonly 30-second steps; unique seed; bounded clock tolerance; attempt limits; atomic replay protection.
- **Composition**: Topic heading, one sentence of context and a labeled visual.

#### Slide 21 - Passkey Verification and Recovery
- **Audience move**: Signature success → complete ceremony and lifecycle checks.
- **Relationships**: Ceremony validation and secure enrollment/recovery both support account access; synchronized credentials affect counter interpretation.
- **Title**: Passkey Verification and Recovery
- **Core message**: A registered public key is one part of a complete verifier.
- **Content**: Check the signed response at sign-in and protect changes to the account’s registered keys. Sign-in checks; Verify the assertion; Challenge · Origin / RP · Signature; Account recovery; Protect changes; New keys · Lost devices · Recovery; Apply user-verification policy at sign-in and during sensitive account changes.
- **Presenter detail**: Challenge/type; origin/RP; signature; UP/UV policy; signCount limits; synced vs device-bound; protect factor changes and recovery; local biometrics.
- **Composition**: Topic heading, one sentence of context and a labeled visual.

#### Slide 22 - OAuth and OIDC Validation
- **Audience move**: Token names → distinct verifiers and checks.
- **Relationships**: Client validates ID token; API validates access token; PKCE/state/nonce protect different flow properties.
- **Title**: OAuth and OIDC Validation
- **Core message**: Validate each artifact at its intended recipient.
- **Content**: Each response or token has a specific recipient responsible for checking it. Authorization response; Correlate with the sign-in request; Client app; ID token; Issuer, audience, signature, expiry; Client app; Access token; Issuer, audience, expiry, scopes; Protected API.
- **Presenter detail**: Client ID token: issuer, audience, signature, time, flow claims; API access token: recipient, validity, scope, resource permission; PKCE exchange binding; state transaction/CSRF; nonce OIDC request binding according to flow.
- **Composition**: Topic heading, one sentence of context and a labeled visual.

#### Slide 23 - User SSO and Workload Identity
- **Audience move**: One login pattern → cross-app and non-user access contexts.
- **Relationships**: Two apps may trust one IdP while a background worker uses its own application identity.
- **Title**: User SSO and Workload Identity
- **Core message**: User SSO and service identity address different callers.
- **Content**: The credential depends on whether a person signs in or a service calls an API. Interactive sign-in; User identity; OIDC sign-in through a shared IdP; Service-to-service; Workload identity; Client credentials or managed identity.
- **Presenter detail**: App A / IdP / App B; OIDC or SAML per integration; separate app and IdP sessions; worker → API with application rights; OAuth Client Credentials where suitable.
- **Composition**: Topic heading, one sentence of context and a labeled visual.

#### Slide 24 - Resource Authorization in ASP.NET Core
- **Audience move**: .NET login gate → resource-aware enforcement.
- **Relationships**: Validated principal and scoped loaded resource feed authorization; business validation precedes commit.
- **Title**: Resource Authorization in ASP.NET Core
- **Core message**: Authorize the actual resource before the action.
- **Content**: Evaluate authorization against the auction before you apply the rules for the bid itself. Load the resource; Within the trusted scope; Check the policy; Actor + action + resource; Apply business rules; Then write the bid.
- **Presenter detail**: Authenticate; map account; load scoped auction; AuthorizeAsync(user, auction, policy); validate bid; commit; missing login versus insufficient rights; UI checks insufficient.
- **Composition**: Topic heading, one sentence of context and a labeled visual.

#### Slide 25 - Revocation Across Active Requests
- **Audience move**: Instant global logout assumption → propagation and validation timeline.
- **Relationships**: Revocation commit precedes cache/API awareness; ongoing connection and request handling require separate enforcement.
- **Title**: Revocation Across Active Requests
- **Core message**: Effective revocation ends when old access paths reject.
- **Content**: Trace when the updated state reaches both new requests and already open connections. Commit revocation; Update access state; Propagate state; Caches and handlers; Reject old access; HTTP and open connections; Measure when each access path starts rejecting the old credential.
- **Presenter detail**: Commit revoke; update state/cache; API rejects; connection rechecks/disconnects; offline JWT may remain until expiry; refresh-family response differs; validate API, refresh and reconnect.
- **Composition**: Topic heading, one sentence of context and a labeled visual.

## X. Speaker Notes Requirements

- **Generation**: disabled
