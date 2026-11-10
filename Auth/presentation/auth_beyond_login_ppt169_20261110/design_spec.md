<!-- ppt-master-schema: design-spec/v1 -->
# Auth Beyond the Login Screen - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | auth_beyond_login_ppt169_20261110 |
| Canvas Format | PPT 16:9 (1280 × 720) |
| Page Count | 26 |
| Primary Language | en |
| Target Audience | Developers in the Geronimo team, with varied .NET experience and the previous SignalR sharing as context |
| Communication Intent | Explain authentication mechanisms, connect sessions and delegated API access to resource authorization, and show why detection and revocation remain necessary |
| Desired Audience Outcome | Trace one bid from identity proof through session and resource permission to server-enforced revocation |
| Core Message / Ask / Action | Identity proof, session continuity, resource permission and revocation are distinct responsibilities on one request path |
| Delivery Context | Live talk in Vietnamese with English slides, 45 minutes including a 5-minute demo slot and Q&A; 20 main pages plus 6 reference pages |
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
- Keep app left, server right on HOTP/TOTP. Keep browser left, authenticator center, backend right on both passkey pages. Preserve client/provider/API positions on OAuth pages.
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

## IX. Content Outline

#### Slide 01 - Beyond the Login Screen
- **Audience move**: Login complete → questions about the next bid.
- **Relationships**: Anna's successful login precedes a bid request; the request raises identity, permission and revocation questions.
- **Title**: Beyond the Login Screen
- **Core message**: Login begins a longer access-control lifecycle.
- **Content**: Auth; Anna is signed in; Who sent this bid? Which auction? How do we stop access?; Tavian Nguyen.
- **Composition**: Large cover title on the left, one bid request and its unanswered questions on the right.

#### Slide 02 - One Bid, Four Security Questions
- **Audience move**: One vague auth task → four separate responsibilities.
- **Relationships**: Identity proof precedes session continuity, then resource authorization; revocation can terminate access.
- **Title**: One Bid, Four Security Questions
- **Core message**: Each responsibility answers a different question.
- **Content**: Authentication: Who are you? Session: Which request is yours? Authorization: May you bid here? Revocation: Is access still allowed?

#### Slide 03 - Different Evidence, the Same Identity Question
- **Audience move**: Authentication names → proof types and factor independence.
- **Relationships**: Password, authenticator and biometric verification belong to different factor categories; 2FA is a subset of MFA.
- **Title**: Different Evidence, the Same Identity Question
- **Core message**: Count independent factor types rather than screens.
- **Content**: Know: password; Have: authenticator or key; Are: local biometric verification; MFA ≥2 factor types; 2FA =2; two passwords remain one type; eBay supports passkeys and two-step options.

#### Slide 04 - HOTP: Keep the Counters in Sync
- **Audience move**: OTP appears magical → both sides compute from the same secret and counter.
- **Relationships**: Authenticator and server share K; equal counter produces equal OTP; successful verification advances server state.
- **Title**: HOTP: Keep the Counters in Sync
- **Core message**: An event counter changes the code.
- **Content**: App K + C=0; server K + C=0; 755224; accepted C=1; next test code 287082; RFC test vector; counter drift and bounded look-ahead; no inherent 30-second expiry.

#### Slide 05 - TOTP: Let Time Move the Counter
- **Audience move**: Time-limited code → time-derived moving factor and replay control.
- **Relationships**: App and server derive the same time step; moving to the next time step changes their input; SMS/email describes delivery rather than this algorithm.
- **Title**: TOTP: Let Time Move the Counter
- **Core message**: Both sides compute locally using K and the current time step.
- **Content**: App K + current step; server K + current step; example step 30 s; works offline; bounded clock tolerance; reject replay; SMS/email delivery differs.

#### Slide 06 - Passkeys: Register a Public Key
- **Audience move**: Biometric login → registered key pair and account binding.
- **Relationships**: Frontend requests registration options, invokes authenticator through browser, then submits registration response to backend; private key remains with authenticator.
- **Title**: Passkeys: Register a Public Key
- **Core message**: Server stores a public key linked to an account.
- **Content**: Browser; authenticator; backend; 1 start registration; 2 challenge/options; 3 create key pair; 4 registration response; 5 validate and store credential ID/public key; private key stays protected; existing identity must be verified.

#### Slide 07 - Passkeys: Prove Possession Without Sending the Key
- **Audience move**: Registered key → challenge signature checked by the server.
- **Relationships**: Browser obtains challenge, authenticator signs ceremony data, backend verifies assertion with registered public key; website binding constrains use.
- **Title**: Passkeys: Prove Possession Without Sending the Key
- **Core message**: Authenticator signs; server verifies.
- **Content**: 1 get challenge; 2 get assertion after local verification; 3 send signed assertion; 4 validate signature, challenge and origin/RP; no biometric sent; protect recovery and later sessions.

#### Slide 08 - The Next Request Still Needs Proof
- **Audience move**: Authentication once → session credential on later requests.
- **Relationships**: Login causes server-side session creation and browser cookie; later request presents session ID for server lookup.
- **Title**: The Next Request Still Needs Proof
- **Core message**: A new request needs a checked session or token.
- **Content**: Browser cookie sid; server session sid → Anna, active; later bid request; session lookup; cookie is transport/storage, session is access state; protected cookie tickets are another design.

#### Slide 09 - A Valid Token Can Still Be Stolen
- **Audience move**: Valid signature means safe → bearer copies may work.
- **Relationships**: Anna and a lab client can present copies of one bearer credential to the same verifier.
- **Title**: A Valid Token Can Still Be Stolen
- **Core message**: Validity does not prove who holds the credential.
- **Content**: Anna; copied bearer credential; lab client; API sees same identity; JWT is a format; bearer is a usage model; signature is not encryption.

#### Slide 10 - Let an App Act Without Sharing Your Password
- **Audience move**: OAuth as login buzzword → delegated API access.
- **Relationships**: Seller permits a client application to receive scoped access from an authorization server to a protected API.
- **Title**: Let an App Act Without Sharing Your Password
- **Core message**: OAuth grants an application API access.
- **Content**: Seller; seller tool/client; authorization server; eBay API; scoped User access token; public eBay developer example; application token is a different context.

#### Slide 11 - OAuth Grants Access; OIDC Adds Identity
- **Audience move**: Four roles → code exchange and token recipients.
- **Relationships**: User interaction returns code to client; client exchanges code for access token; API accepts access token; OIDC adds ID token for client.
- **Title**: OAuth Grants Access; OIDC Adds Identity
- **Core message**: Access token goes to API; ID token goes to client.
- **Content**: Client/browser; identity and authorization provider; API; authorize and authenticate; code; code exchange; access token plus ID token in OIDC; API request; generic flow, not an eBay implementation claim.

#### Slide 12 - A Stolen Code Should Not Be Enough
- **Audience move**: Temporary code → proof bound to its exchange.
- **Relationships**: Client retains verifier and sends derived challenge first; server compares verifier-derived challenge when code is exchanged.
- **Title**: A Stolen Code Should Not Be Enough
- **Core message**: PKCE binds code exchange to the client's verifier.
- **Content**: Generate verifier; S256 challenge; authorization request; code plus verifier; compare; stolen code alone lacks verifier; already stolen access token remains a separate problem.

#### Slide 13 - Choose Where Credentials Live
- **Audience move**: Acronym matrix → concrete architecture choices.
- **Relationships**: Backend-mediated browser access contrasts with direct browser API access and native mobile access; SSO can combine with these options.
- **Title**: Choose Where Credentials Live
- **Core message**: Credential location changes responsibilities.
- **Content**: Browser cookie → BFF tokens → API; SPA tokens → API; mobile via system browser with Code + PKCE; consider OIDC for login; SSO is a cross-app requirement, not another factor.

#### Slide 14 - A Bidder Role Is Only the First Check
- **Audience move**: Role membership → unanswered resource scope.
- **Relationships**: Anna belongs to Bidder role but auction 42 and auction 99 can have different access rules.
- **Title**: A Bidder Role Is Only the First Check
- **Core message**: Role membership does not settle every resource decision.
- **Content**: RBAC groups capabilities by role; Anna: Bidder; auction 42 allowed; auction 99 outside scope; server enforces permission even when UI hides action.

#### Slide 15 - Can Anna Bid on This Auction?
- **Audience move**: Broad role → actor/action/resource decision plus business validation.
- **Relationships**: Trusted actor, resource and relationship facts feed policy; permitted actions still pass business rules.
- **Title**: Can Anna Bid on This Auction?
- **Core message**: Evaluate the actor, action and resource together.
- **Content**: Role/permission; attributes ABAC; relationships ReBAC; combined policy; then auction open and valid bid amount; tenant and relationship facts from server.

#### Slide 16 - Customize the Decision at the Right Layer
- **Audience move**: Custom auth as one task → three extension responsibilities.
- **Relationships**: Credential validation precedes internal identity mapping and resource authorization.
- **Title**: Customize the Decision at the Right Layer
- **Core message**: Customize the layer that owns the requirement.
- **Content**: Validate credential: standard middleware or scheme handler; map identity: issuer + subject → local bidder; authorize resource: policy/handler; use trusted data; no need to invent a protocol.

#### Slide 17 - Would We Notice a Stolen Session?
- **Audience move**: Server always knows theft → uncertain signals and reuse evidence.
- **Relationships**: Rotation replaces R1 with R2; presentation of old R1 is evidence of reuse, not conclusive attacker identity.
- **Title**: Would We Notice a Stolen Session?
- **Core message**: Signals inform a response; they do not guarantee detection.
- **Content**: User report, unusual activity, factor changes; new IP is uncertain; R1 used → R2 issued → R1 replayed; investigate copy versus race/retry; only where rotation exists.

#### Slide 18 - Revoked Must Mean Rejected
- **Audience move**: Revoke button → enforcement at each access path.
- **Relationships**: Revocation state must reach session lookup, API checks, refresh issuance and active connection handling as applicable.
- **Title**: Revoked Must Mean Rejected
- **Core message**: Change a condition that the request handler actually checks.
- **Content**: Session: inactive; access token: state check or expiry; refresh: revoke token/family; SignalR: disconnect or recheck sensitive commands; clear-cookie is insufficient; recover account after containment.

#### Slide 19 - Demo: Bid, Deny, Revoke
- **Audience move**: Theory → concrete expected server outcomes.
- **Relationships**: Valid bid precedes out-of-scope rejection, followed by revocation and retry of old access.
- **Title**: Demo: Bid, Deny, Revoke
- **Core message**: Observe server decisions on the same request path.
- **Content**: Proposed lab scenario, implementation pending; 1 allowed auction; 2 different auction denied; 3 old session rejected after revoke; include open connection; controlled test credentials only.

#### Slide 20 - Follow One Request End to End
- **Audience move**: Many terms → reusable four-question review.
- **Relationships**: Identity, continuity, permission and termination are complementary checks on one bid.
- **Title**: Follow One Request End to End
- **Core message**: Trace proof, session, permission and revocation.
- **Content**: Who are you? Which session? May you bid here? Can access stop?; Questions.

#### Slide 21 - HOTP and TOTP Verification Details
- **Audience move**: Main mechanism → formula, state and test vector.
- **Relationships**: TOTP uses the HOTP construction with a time-derived counter; accepted steps must not replay.
- **Title**: HOTP and TOTP Verification Details
- **Core message**: Shared computation still requires guarded verifier state.
- **Content**: HOTP(K,C) = truncate(HMAC(K,C)) mod 10^digits; T = floor((UnixTime - T0) / X); public test vector 0:755224, 1:287082; protect seed; limit guesses; atomic replay prevention; no production seed.

#### Slide 22 - Passkey Checks and Account Recovery
- **Audience move**: Signature success → complete ceremony and lifecycle checks.
- **Relationships**: Ceremony validation and secure enrollment/recovery both support account access; synchronized credentials affect counter interpretation.
- **Title**: Passkey Checks and Account Recovery
- **Core message**: A registered public key is one part of a complete verifier.
- **Content**: Challenge/type; origin/RP; signature; UP/UV policy; signCount limits; synced vs device-bound; protect factor changes and recovery; local biometrics.

#### Slide 23 - OAuth and OIDC Validation Boundaries
- **Audience move**: Token names → distinct verifiers and checks.
- **Relationships**: Client validates ID token; API validates access token; PKCE/state/nonce protect different flow properties.
- **Title**: OAuth and OIDC Validation Boundaries
- **Core message**: Validate each artifact at its intended recipient.
- **Content**: Client ID token: issuer, audience, signature, time, flow claims; API access token: recipient, validity, scope, resource permission; PKCE exchange binding; state transaction/CSRF; nonce OIDC request binding according to flow.

#### Slide 24 - SSO and Application Identity
- **Audience move**: One login pattern → cross-app and non-user access contexts.
- **Relationships**: Two apps may trust one IdP while a background worker uses its own application identity.
- **Title**: SSO and Application Identity
- **Core message**: User SSO and service identity address different callers.
- **Content**: App A / IdP / App B; OIDC or SAML per integration; separate app and IdP sessions; worker → API with application rights; OAuth Client Credentials where suitable.

#### Slide 25 - A Resource Authorization Decision
- **Audience move**: .NET login gate → resource-aware enforcement.
- **Relationships**: Validated principal and scoped loaded resource feed authorization; business validation precedes commit.
- **Title**: A Resource Authorization Decision
- **Core message**: Authorize the actual resource before the action.
- **Content**: Authenticate; map account; load scoped auction; AuthorizeAsync(user, auction, policy); validate bid; commit; missing login versus insufficient rights; UI checks insufficient.

#### Slide 26 - Revocation Across Active Requests
- **Audience move**: Instant global logout assumption → propagation and validation timeline.
- **Relationships**: Revocation commit precedes cache/API awareness; ongoing connection and request handling require separate enforcement.
- **Title**: Revocation Across Active Requests
- **Core message**: Effective revocation ends when old access paths reject.
- **Content**: Commit revoke; update state/cache; API rejects; connection rechecks/disconnects; offline JWT may remain until expiry; refresh-family response differs; validate API, refresh and reconnect.

## X. Speaker Notes Requirements

- **Generation**: disabled
