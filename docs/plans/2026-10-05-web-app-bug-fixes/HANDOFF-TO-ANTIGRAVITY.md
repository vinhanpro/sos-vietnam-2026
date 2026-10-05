# Handoff: SOS Vietnam 2026 — bug fixes + document-vs-code gap closing

**Why this file exists:** budget ran low on the Claude Code session doing this work. Everything below is what the next agent (Antigravity or otherwise) needs to pick up exactly where this session stopped, with no re-discovery needed.

**Repo / worktree:** `C:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\.claude\worktrees\web-app-bug-review-c735b2` (branch `claude/web-app-bug-review-c735b2`).

**Full plan (read this first, it has all approved scope, rules, and evidence):**
`docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-plan.md`
+ its companion `-actual-status.md`, `-evidence.md`, `-benchmark.md` in the same folder.

The user already approved the **entire** P1–P10 plan. Do not re-ask for approval on scope already in that plan — just keep executing phases in order and follow the plan's own rules section (Anvien impact-check before editing, detect-changes before each commit, Docker-based validation for UI/runtime changes, record evidence as you go).

## Done and committed (safe, verified, do not redo)

| Commit | What |
|---|---|
| `f13cdcb` | P1: vehicle-aware route styling (motorbike vs car), proven via Playwright against real Docker container |
| `ac0e78b` | P3: MASTER PASS "2002" login backdoor restricted to non-production, proven live both env states |
| `6ee3f5b` | Fixed a pre-existing Dockerfile bug (missing `npm ci` — image crashed on `exceljs` import). Also P1-B Docker validation |
| `999d282` | P2-A: server.js signal relay now carries `sdp`/`candidate` for `webrtc-offer`/`webrtc-answer`/`webrtc-ice`, proven via real HTTP+SSE round-trip |
| `57cd80c` | P2-B: citizen-side (`js/app.js`) real `RTCPeerConnection` wiring, proven via Playwright (real offer created, local track attached, remote-audio sink bound) |

## In progress, NOT committed — pick up here

**P2-C (dispatcher-side WebRTC wiring)** is code-complete but **not yet verified passing**, so it is uncommitted in the working tree. Files touched (uncommitted):
- `js/app.js` — added duplicate-SSE-event guards (`_citizenHandlingVoiceOffer`, `_citizenHandlingVoiceAnswer`) on top of the P2-B offer/answer handlers
- `js/dispatcher.js` — mirrors P2-B's RTCPeerConnection wiring in `openDispatcherVoiceCall`/`endDispatcherVoiceCall`/the voice branch of `handleCallSignal`, plus the same duplicate-event guards
- `dispatcher.html` — added `<audio id="dispatcherRemoteVoiceAudio" autoplay>` inside `dispatcherVoiceCallModal`
- `playwright/verify-webrtc-voice-call-two-way-audio.cjs` (new, untracked) — the reusable full-loop test: citizen + dispatcher in two real browser contexts, dispatcher logs in and calls, citizen accepts, measures real audio via AnalyserNode on both `<audio>` sinks

**Known root cause already found, fix already applied, but not yet confirmed working:** the server relays every call signal over **both** `videocall_signal` and `voicecall_signal` SSE event names (see `server.js` `broadcastToDispatchers`/`notifyCitizen` — this is intentional pre-existing behavior for other signal types, not a bug to "fix" at the source). Both `js/app.js` and `js/dispatcher.js` listen on both event names and route to the same handler, so the identical WebRTC offer/answer arrives **twice**, nearly simultaneously. First attempt at a fix (checking `pc.signalingState !== 'stable'`) was NOT enough — the two duplicate deliveries land synchronously, before `signalingState` has transitioned from the first call's own earlier `await`, so the check races and lets the second call through anyway, causing `InvalidStateError: Called in wrong state: stable`.

**Fix applied (second attempt), not yet verified:** replaced the `signalingState` check with a synchronous boolean flag (`this._citizenHandlingVoiceOffer` / `this._dispatcherHandlingVoiceOffer`, and separately `..._VoiceAnswer` for the answer side) set **before any `await`**, reset to `false` each time a fresh `RTCPeerConnection` is created in `startCitizenVoiceCall`/`openDispatcherVoiceCall`. This should correctly block the duplicate delivery since JS runs the synchronous prefix of both calls back-to-back before either hits its first `await`. **This has not been re-tested yet** — the session was interrupted while restarting the server to re-run `playwright/verify-webrtc-voice-call-two-way-audio.cjs`.

### Immediate next step

```bash
cd "C:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\.claude\worktrees\web-app-bug-review-c735b2"
node --check js/app.js && node --check js/dispatcher.js   # should already pass
# kill any node server.js already running on :3000, then:
node server.js > /tmp/sos_p2c_test.log 2>&1 &
sleep 2
node playwright/verify-webrtc-voice-call-two-way-audio.cjs http://localhost:3000 admin 2002
```

If it still fails with `InvalidStateError`, the flags aren't enough — likely need to also guard at the very top of the SSE event listener itself (dedupe by a signal fingerprint/nonce) rather than inside the handler, since two *separate* event listeners (`videocall_signal` and `voicecall_signal`) both fire into the same handler and the flag-based guard assumes synchronous mutual exclusion that may not hold once React/microtask scheduling is involved — add a `console.log` of `Date.now()` at the very top of `handleIncomingVoiceOffer`/the dispatcher equivalent to confirm whether the two calls are truly synchronous back-to-back or have a scheduler gap between them.

If/when it passes: update `evidence.md`/`actual-status.md` for P2-C (follow the exact pattern already used for P2-A/P2-B in those files — short diff description + live-proof paragraph + evidence IDs `E2-P2C-*`), run `anvien detect-changes --repo sos-vietnam-2026-worktree-bugreview --scope all`, revert any `.runtime-data/*` noise with `git checkout --`, then commit. **P2 (real two-way WebRTC voice call) is then fully closed.**

## Not started yet (P4, P6–P10)

All fully specified in `plan.md` with exact file/line targets, work steps, and acceptance criteria. Short summary of what's left:

- **P4** — add a Caddy reverse-proxy service to `docker-compose.yml` for real TLS 1.3 (self-signed cert for local validation, since there's no public domain in this environment). `server.js` itself stays on plain HTTP.
- **P6** — `services/accounts-excel-generator.js` needs a 4th "Mẫu Thêm Mới" worksheet; `scripts/import_accounts_excel.py` already parses an action column into `raw_action` but never uses it (confirmed dead variable) — wire it into real create-vs-skip logic.
- **P7** — `js/location.js`'s `refineLocation()` only does a simple accuracy-threshold check; replace with a real 1D Kalman filter, keep the public API (`onLocationUpdate`/`emitUpdate`/`acquireLocation`/`reverseGeocode`) unchanged.
- **P8** — create `playwright/test-bidirectional-signature-persistence.cjs` and `playwright/verify-ui-signature-draw-and-display.cjs` (the NCKH document cites these by name; they don't exist yet). `npm install` + `npx playwright install chromium` already done in this worktree.
- **P9** — measure real performance figures (load time, offline load, SSE latency, WAF bot-block rate) against the Docker-built container using Playwright; do NOT fabricate GPS-accuracy field-measurement numbers — write an honest spec-based statement instead (the plan's `P9-A` already has the exact wording approach).
- **P10** — correct the NCKH document (`C:\Users\dienv\Desktop\docs\thuyết trình\SOS_VIETNAM_2026.docx` + its `.pdf`, both OUTSIDE this repo) using only numbers proven by P3–P9's evidence: 2-tier letterhead (drop "TRUNG ĐOÀN CẢNH SÁT CƠ ĐỘNG SỐ 10", keep only `BỘ CÔNG AN` / `BỘ TƯ LỆNH CẢNH SÁT CƠ ĐỘNG`), fix "192 trạm" → real account count, fix NĐ144 fine amount to "4-6 triệu" (matches real UI), fix WebSocket→SSE wording, etc. This must be done LAST, after P3–P9 give it real numbers to cite.

## Important facts already discovered (don't re-discover these)

- **Password security:** already uses PBKDF2-SHA512 (100k iterations) — NOT plaintext, NOT bcrypt-needed. The real defect was the MASTER PASS backdoor (fixed in P3). 277 of 453 real seed accounts happen to have `"2002"` as their actual real password (unrelated data fact, not a bug — don't try to "fix" this).
- **Dockerfile was broken** (missing `npm install`) before this session's fix in `6ee3f5b` — if you ever see `ERR_MODULE_NOT_FOUND: exceljs` again, check that fix wasn't reverted.
- **Dispatcher login flow for Playwright tests:** there's a pre-login "Cyber Defense Gatekeeper" screen requiring `sessionStorage.setItem('sos_gatekeeper_pass', 'true')` (set via `page.addInitScript` before `goto`), then a force-selection screen requiring a click on text `"CÔNG AN"` (or another force), THEN the actual `#loginUsername`/`#loginPassword` form appears, with submit button text `"ĐĂNG NHẬP ..."` (varies by selected force — don't hardcode "ĐĂNG NHẬP TRỰC BAN", use a substring match on `"ĐĂNG NHẬP"`).
- **Layer-7 WAF blocks default User-Agents as bots** — any Playwright/curl/http.request test against this server needs a realistic desktop-Chrome `User-Agent` header or it gets a `403 AI_BOT_FORBIDDEN`.
- **`/api/dispatcher/*` requires a real `Authorization: Bearer <token>` header** (from `POST /api/auth/login`) even for the SSE stream endpoint — the handler itself allows anonymous access but a global router-level gate (`server.js` ~line 2133-2154) blocks all `/api/dispatcher/*` paths without one.
- **Dispatcher voice-call function names are NOT what the original plan guessed.** They are `openDispatcherVoiceCall(targetIncidentId, isIncomingFromCitizen, targetUnit)` and `endDispatcherVoiceCall(notify)`, both on `window.dispatcherApp` (not `window.app` — dispatcher.html's global is `window.dispatcher = window.dispatcherApp = new DispatcherApp()`).
- **`js/dispatcher.js` (13k+ lines) is NOT indexed by Anvien's graph** for this repo (`anvien file-detail` returns "not found in repo"). Always `Grep` for exact current line numbers immediately before editing it — don't trust line numbers from this document or from `actual-status.md`, they drift with every commit.
- **This worktree's `node_modules` did not exist** until this session ran `npm install` — if you're in a *different* worktree/clone, you'll need to run it again, plus `npx playwright install chromium`.

## Budget-conscious tips for whoever continues

- The plan's Docker/Playwright validation requirement is real and important (per the user's explicit rules), but don't rebuild Docker images for every tiny code tweak — iterate with a plain `node server.js` dev run first (same code, same ports work since `.dockerignore`/`Dockerfile` don't change app logic), and only do the full `docker build && docker run` pass at the very end of each phase for the committed evidence.
- Always `git checkout -- .runtime-data/` before committing — every test run (SOS submissions, logins) writes real noise into tracked runtime-data JSON files that must not be committed.
- `anvien detect-changes --repo sos-vietnam-2026-worktree-bugreview --scope all` before every commit is cheap and already a habit established in this session's commits — keep doing it, it catches accidental scope creep.
