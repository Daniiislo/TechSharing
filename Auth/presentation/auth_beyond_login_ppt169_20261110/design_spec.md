<!-- ppt-master-schema: design-spec/v1 -->
# Auth Beyond the Login Screen - Design Spec

## I. Project Information

| Item | Value |
| --- | --- |
| Project Name | auth_beyond_login_ppt169_20261110 |
| Canvas Format | PPT 16:9 (1280 × 720) |
| Page Count | 16 |
| Primary Language | en |
| Target Audience | Developers in the Geronimo team, with varied .NET experience and the previous SignalR sharing as context |
| Communication Intent | Explain authentication mechanisms, connect sessions and delegated API access to resource authorization, and show why detection and revocation remain necessary |
| Desired Audience Outcome | Trace one request from identity proof through continued recognition and resource permission to server-enforced revocation |
| Core Message / Ask / Action | Identity proof, continued recognition after sign-in, resource permission and revocation are distinct responsibilities on one request path |
| Delivery Context | Live talk in Vietnamese with English slides, 38 minutes including Q&A; 16 main pages |
| Artifact Afterlife | SVG preview plus Vietnamese study guide, presenter guide and specialized references; existing PPTX remains an earlier export until final approval |
| Reading Mode | presentation |
| Content Strategy | Preserve the current 16-slide roster; detailed protocol checks and implementation examples live in the Vietnamese study guide and specialized documents. No standalone demo or appendix in the current deck. |
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

Apply the common header, body and footer coordinates in `layout.json` to all slides. On topic slides, use the exact numbered Agenda section as the small cyan label above the slide title. Keep the title and optional context aligned with the cover and Agenda. Source-citation footers on slides 04–15 are replaced by “AUTH · Beyond the Login Screen”; page numbers stay. References remain in the presenter guide.

## IX. Content Outline

#### Slide 01 - Beyond the Login Screen
- **Audience move**: A single sign-in action → the lifecycle the system must support.
- **Relationships**: Authentication establishes identity. The session carries it across requests. Authorization checks what that identity can do. Revocation ends access when needed.
- **Title**: Beyond the Login Screen
- **Core message**: Login begins a longer access-control lifecycle.
- **Content**: Authenticate / Prove identity → Stay Signed In / Recognize the request → Authorize / Check resource access → Revoke Access / Reject old access; Tavian Nguyen.
- **Composition**: Same lifecycle visual as slide 16: four 64px pale-cyan circles centered at x=195/492/788/1085 and y=328, matching icons, 28px labels at y=441 and 22px descriptions at y=483. Preserve recap main-visual transforms for exact geometry match. All four icons use cyan #007F9E; last arrow is dashed. Cover title, presenter name and footer remain.


#### Slide 02 - Agenda
- **Audience move**: The cover's four-step lifecycle → know what the session will cover.
- **Relationships**: The agenda follows the presentation order from authentication to the lifecycle recap and Q&A.
- **Title**: Agenda
- **Core message**: The talk covers identity proof, request continuity, permissions and revocation, then compares architectures and recaps the auth lifecycle.
- **Content**: Authentication & Sign-In; Sessions & Tokens; Authorization & Custom Auth; Revocation; Choosing an Auth Architecture; Recap & Q&A. Section 03 covers authorization models on slide 12 and authentication extension points on slide 13.
- **Composition**: Six ordered rows, each with a topic and a brief preview of its content.

#### Slide 03 - Authentication Overview
- **Audience move**: Agenda → map the authentication topics before the details.
- **Relationships**: A user can sign in directly with the app or through an identity provider. OIDC and SAML 2.0 convey the sign-in result from an identity provider. OAuth delegates API access and is explained separately.
- **Title**: Authentication Overview
- **Core message**: Direct and federated sign-in are two routes for establishing identity.
- **Content**: Password; server-issued SMS/email codes and TOTP; passkey; OIDC; SAML 2.0.
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

#### Slide 07 - OIDC: Sign In with an Identity Provider
- **Audience move**: Understand how federated identity becomes an app login session.
- **Relationships**: App redirects Anna to the trusted identity provider with openid scope; the trusted identity provider returns code; app exchanges code for tokens, validates ID token, identifies Anna and creates its own session.
- **Title**: OIDC: Sign In with an Identity Provider
- **Core message**: OIDC confirms identity. The app creates its own login session after validation.
- **Composition**: Two-actor sequence ending in an explicit app-session takeaway.

#### Slide 08 - OAuth 2.0: Grant Access to an API
- **Audience move**: Separate delegated API access from user sign-in.
- **Relationships**: Anna grants access; Google issues an access token; app calls Google Calendar API; API checks token and permissions.
- **Title**: OAuth 2.0: Grant Access to an API
- **Core message**: OAuth delegates resource access. OAuth alone does not define user sign-in.
- **Composition**: Google, app and Google Calendar API sequence focused on access token issuance and use.

#### Slide 09 - Service-to-Service Authentication
- **Audience move**: Distinguish service identity from user sign-in and recognize four proof mechanisms.
- **Relationships**: Order Service presents a credential/proof to Payment Service; the receiver authenticates then authorizes the calling service.
- **Title**: Service-to-Service Authentication
- **Core message**: Authenticate the calling service, then check what it is allowed to do.
- **Content**: Shared secret: API key / Basic Auth. Access token: e.g. OAuth Client Credentials. mTLS: client certificate + private key. Signed request: HMAC / asymmetric signature.
- **Composition**: Four spacious icon-led rows following the deck’s pale cyan fields, common header and footer, single takeaway.

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

#### Slide 13 - Custom Authentication: Why and How?
- **Audience move**: Choose the smallest extension needed when default authentication behavior does not meet app requirements.
- **Relationships**: Three extension choices: settings for existing scheme; hooks at defined flow points; own handler for own credential.
- **Title**: Custom Authentication: Why and How?
- **Core message**: Use configuration first, then hooks. Build a handler for a custom credential.
- **Content**: Configure: change settings for an existing scheme. Add a hook: run your code at a defined point in the sign-in flow. Custom handler: define how your own credential is read and verified.
- **Composition**: Three aligned icon-led groups at x=240/640/1040: sliders for scheme settings; validation flow with an inserted code hook; credential-handler-identity pipeline. Common header, takeaway y=630 and footer retained.

#### Slide 14 - Revoking Sessions & Tokens
- **Audience move**: Know one concrete revocation strategy for each credential type.
- **Relationships**: Session deletion is enforced through session lookup; access-token denylist through API checks; refresh-token revocation through token-store checks at refresh.
- **Title**: Revoking Sessions & Tokens
- **Core message**: Revoking a refresh token does not automatically revoke issued access tokens.
- **Content**: Three credentials, three revocation actions. Session → Delete the session. Access token → Add to denylist / until token expiry. Refresh token → Revoke the token / or its token family. Refresh revocation does not revoke existing access tokens. Per-method result descriptions are omitted from the slide and retained in the guide.
- **Composition**: Three open icon-led vertical groups aligned with the deck’s three-actor geometry, x=240/640/1040. Icon center y=300, credential baseline y=398, cyan action baselines y=456/492; the one-line Session action is centered at y=474. No result descriptions below the actions. All text 26px; no row containers, horizontal arrows or small annotations. Shared takeaway divider y=588.

#### Slide 15 - Auth Choices by Architecture
- **Audience move**: Separate architecture, post-login credential, sign-in handler, and user authentication evidence.
- **Relationships**: Five architecture rows map to post-login request handling and sign-in location. A shared user-proof cell spans all rows. Microservices can combine with all frontend patterns.
- **Title**: Auth Choices by Architecture
- **Core message**: The architecture influences auth organization, not which user proof is permitted. OIDC connects an app to an identity provider; password/OTP/passkey remain separate evidence choices.
- **Content**: ARCHITECTURE | AFTER SIGN-IN | SIGN-IN HANDLER | USER FACTORS. Web monolith | Session cookie | App / Identity provider. Separate web + API | Access token | Auth backend / Identity provider. Web + BFF | Cookie to BFF; token to APIs | BFF / Identity provider. Mobile + API | Access token | Auth backend / Identity provider. Microservices | Access tokens; service checks | Shared identity service. Shared user-factor examples: Knowledge — Password, PIN; Possession — Passkey, OTP, Security key, Smart card; Biometric — Fingerprint, face, iris.
- **Presenter detail**: These are representative arrangements, not mandatory client/token mappings. The user-proof column refers to end-user login in systems containing these architectures, never service-to-service authentication. Services/jobs authenticate their own workload identity when appropriate using service credentials, Client Credentials or mTLS; delegated calls retain appropriately scoped user context. BFF can manage a local login session or delegate to an IdP; a provider can validate any listed user proof. OTP alone is not automatically MFA. Token issuer is the auth backend or authorization server associated with the identity platform; APIs require the configured issuer, audience and permissions. JWT is format, not issuer; ID tokens are not API access tokens. Native OIDC uses system browser plus Code + PKCE; cookie CSRF and browser token exposure remain guide details.
- **Composition**: Four columns; five rows in the first three columns; a single merged fourth column for common user-proof choices avoids repetition. 23px body with wrapped cells, 23px factor headings and 20px examples; no explanatory lines beneath. Qualitative table rendered as native-safe shapes and text.
- **Native-ready**: architecture-table=no

- **User-factor clarification**: Examples inherit slide 4. Passkeys/security keys can combine possession with local PIN or biometric user verification. Fingerprint/face/iris are not necessarily sent to a server; WebAuthn uses local verification and returns cryptographic proof. These are factor categories and examples, not seven mutually exclusive protocols or automatic MFA.

- **Terminology**: IdP abbreviates Identity Provider, an identity-system role. OIDC abbreviates OpenID Connect, a federation/authentication protocol, not a provider type or abbreviation of Identity Provider. SAML is another federation protocol. Provider location and federation protocol are labeled separately.

- **Column fit**: Architecture x=80; request credential x=330; sign-in handler x=590 with approximately 374px usable width; user factors x=988 in a 236px shared field. Every sign-in handler is one 23px line, vertically centered in its row.

#### Slide 16 - Auth Lifecycle Recap & Q&A
- **Audience move**: Many terms → reusable four-question review.
- **Relationships**: Identity, continuity, permission and termination are complementary checks on one bid.
- **Title**: Auth Lifecycle Recap & Q&A
- **Core message**: Trace proof, session, permission and revocation.
- **Content**: Prove identity, stay signed in, check permissions and revoke access. Authenticate; Prove identity; Stay Signed In; Recognize the request; Authorize; Check resource access; Revoke access; Reject old access.
- **Presenter detail**: Who are you? Which session? May you bid here? Can access stop?; Questions.
- **Composition**: Cyan section label, topic heading, one sentence of context and a labeled visual.


## X. Speaker Notes Requirements

- **Generation**: disabled

- **Lifecycle consistency**: Share the exact main-visual geometry, icons, labels and descriptions with slide 1. Revoke Access uses the same cyan #007F9E as the other three icons; no warning-colored icon.
