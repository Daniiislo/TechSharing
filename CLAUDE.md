# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Tech-sharing monorepo. Only `protolab/` has code; `SignalR/` is a placeholder README for a future topic.

- `protolab/` — **ProtoLab**, a localhost lab demoing Polling, Long polling, SSE, WebSocket and Webhook, each with a real backend and a send/receive log. UI copy, comments and docs are in **Vietnamese**; keep that language when editing them.
- `protolab/presentation/` — slide material (`docs/*.md` sources, a generated `realtime_web_20261007/` ppt-master workspace, `.pptx` exports). Not part of the app.
- `protolab/work/` — git-ignored scratch (Chrome profile, npm cache, `check-websocket.ts`); excluded from `tsconfig`.
- `protolab/BACKEND_METHODS_EXPLAINED.md` — long walkthrough from UI action to backend function; read it before changing backend behaviour.

## Commands (run from `protolab/`)

Requires Node.js 22.22+.

```sh
npm run dev        # tsx server.ts → http://127.0.0.1:3000 (Next + WebSocket in one process)
npm run build      # next build
npm start          # tsx server.ts --production (needs build first)
npm run typecheck  # tsc --noEmit
npm test           # tsx --test tests/protocols.test.ts tests/flow-diagram.test.tsx
```

- **Never use `next dev` directly** — it skips `server.ts`, so `/ws` doesn't exist.
- Change port with `PORT` (PowerShell: `$env:PORT='3001'`); tests then need `BASE_URL=http://127.0.0.1:3001`.
- `tests/protocols.test.ts` is an integration suite against a **running server** (it does not start one) and takes ~30s because of a real 20s long-poll timeout. Start `npm run dev` in another terminal first. `tests/flow-diagram.test.tsx` is a pure render test and needs no server.
- Single test: `npx tsx --test --test-name-pattern="long polling" tests/protocols.test.ts`
- There is no lint script; Prettier config exists (`printWidth` 100, trailing commas) but is not wired to a script.

## Architecture

**Custom server in front of Next.js (`server.ts`).** A plain Node `http` server hands normal requests to Next's handler, but intercepts the `upgrade` event: path `/ws` goes to `createChatServer()` (the `ws` library, `noServer` mode), anything else goes back to Next's upgrade handler so HMR still works. It also rejects any `Host` header other than `127.0.0.1:<port>` / `localhost:<port>`, and binds to 127.0.0.1 only.

**Two separate pieces of server state:**
- HTTP-based demos (polling, long polling, SSE, webhook) share one in-memory `Map<sessionUuid, SessionState>` in `src/server/event-store.ts`, stored on `globalThis.protoLabSessions` so Next hot reload/separate route bundles share it. Limits: 1000 sessions, idle sessions swept after 1h on the next `getSession()` (skipped while waiters/subscribers/webhook delivery are active).
- WebSocket chat rooms live separately in `src/server/websocket.ts` (`rooms: Map<roomId, Map<WebSocket, participant>>`). They do not touch `event-store`.

**Session model.** `ProtocolTabs` generates a fresh UUID on tab switch or "Đặt lại"; the demo passes it as `?session=` (GET), in the JSON body (POST), or as `?room=` (WS). Old session memory is simply abandoned. Everything is single-process memory — no DB, state is lost on restart.

**Request flow per demo:** `components/demos/<x>-demo.tsx` (state, direct `fetch`/`EventSource`/`WebSocket`, markup all in one file by design — don't split these up) → `app/api/<x>/route.ts` → `server/event-store.ts`. Chat goes `websocket-demo.tsx` → `server.ts` → `server/websocket.ts`.

**Mechanisms worth knowing before editing:**
- Long polling: `waitForNotification` parks the request on `state.waiters` until `publishNotification` wakes it, an abort fires, or the 20s timeout hits; a monotonically increasing `cursor` lets clients replay events created between requests.
- SSE: client must receive the `ready` event before POSTing `start`, otherwise progress events fire before it subscribes. `next.config.ts` sets `compress: false` so events flush immediately.
- Webhook: the provider route returns `202` immediately, then `after()` runs `deliver()`, which does a **real `fetch`** to the fixed receiver URL (3 attempts, same `eventId`). The receiver dedups by `eventId` (idempotency) and checks the `x-webhook-secret` header. Provider and receiver are two roles in one Next process.
- Chat: the display name is taken from the connect-time query, not from message frames; the server broadcasts to the whole room including the sender, with `recipients` computed per message.

**Shared contracts and guards.**
- `src/lib/protocol-contracts.ts` holds all Zod schemas/types; tests import them to parse real responses, so change them with the routes.
- `src/server/http.ts` `readBody` is the single POST entry guard: local-Origin check, JSON content-type, 4 KB cap, Zod validation. Routes throw `Response` objects (`json(...)`) and catch with `errorResponse`. WebSocket upgrade enforces the same local-Origin rule and `maxPayload: 4096`.
- Routes use `export const runtime = "nodejs"` and the `@/*` → `src/*` path alias; `server.ts` and `src/server/*` import with relative paths since they run under `tsx`.
- `tsconfig` is strict with `noUncheckedIndexedAccess`.

**UI.** Tailwind v4 + shadcn-derived `components/ui/{button,tabs}.tsx` (Radix). `flow-diagram.tsx` animates the actor/step sequence diagram shown in each demo; `activity-log.tsx` is the shared log hook/timeline.

## Conventions

- `// ponytail:` comments mark deliberate simplifications with a named ceiling (e.g. in-memory store → Redis for multi-instance). Leave them in place and follow the same style when adding shortcuts.
