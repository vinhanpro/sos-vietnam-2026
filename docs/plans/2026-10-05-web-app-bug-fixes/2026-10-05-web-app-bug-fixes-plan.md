# Web App Bug Fixes (Vehicle Routing + Real Voice Call) Plan

## Metadata

- Date: `2026-10-05`
- Status: `draft`
- Plan: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-plan.md`
- Evidence: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-evidence.md`
- Benchmark: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-benchmark.md`
- Actual status: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-actual-status.md`

## Goal

Fix two confirmed, user-reported defects in the SOS Vietnam web app (P1, P2), then close the gap between the SOS_VIETNAM_2026 NCKH (research) document's technical claims and the real running code (P3-P9), without regressing any already-working behavior:

1. The in-app tactical map route line (`MapController.drawRoute`) always renders a car/driving route from the public OSRM demo server, regardless of which emergency service (and implied vehicle: motorbike for ward police/CSGT patrol, car/ambulance for 115, truck/car for PCCC, tow vehicle for traffic-rescue) is actually assigned. The user clicks "Xe máy" expecting a motorbike-appropriate route and the in-app line still looks like a car route because it is literally always the OSRM `driving` profile.
2. The citizen <-> dispatcher voice call feature (`startCitizenVoiceCall` / `handleVideoCallSignal` in `js/app.js`, and the mirrored dispatcher flow in `js/dispatcher.js`) never establishes a real WebRTC media path. Each side only captures its own microphone locally for a visualizer/recorder; no SDP offer/answer or ICE candidates are exchanged, and no remote audio track is ever attached to a playable `<audio>` element. The user hears silence from the other party even after both sides "accept" the call.
3. A document-vs-code review (separate session, 2026-10-05) found a login backdoor more serious than anything the document claims (P3), a TLS claim with no code backing it (P4), a document-cited "4-sheet Excel + action column" feature that is 90% real but has one dead variable (P6), a "Kalman Filter" claim with no real filter behind it (P7), two Playwright test files the document cites by name that do not exist (P8), and a performance table with figures that cannot be traced to any benchmark in the repo (P9). The user decided: make all of these real and working, not relax the document to match the gaps — except where the user explicitly scoped a narrower fix (MASTER PASS restricted by environment, not bcrypt migration; GPS accuracy description corrected to an honest range, not fabricated field measurements).

## Rules

- Complete P0 actual status before implementation work.
- Update each checklist item immediately when it is completed.
- Record evidence as work completes.
- Record benchmarkable counts or measurements when they are taken.
- Update later phase status assumptions, next actions, and work steps when actual-status evidence changes the repo state.
- After completing a phase or implementation slice and refreshing `actual-status.md`, update the next affected phase's work steps as needed to match the latest repo reality, while preserving that phase's original goal, scope, acceptance criteria, and major phase order.
- Run Anvien detect-changes before every implementation-slice commit when implementation work was performed.
- For public runtime or UI-facing changes, validate the real user-visible runtime with browser or Playwright evidence.
- For app/runtime validation, full build must include Docker image/container build. If Docker is missing or not run, full build is incomplete. This repo ships a `Dockerfile` and `docker-compose.yml`; use them for the full-build gate in `Pn-C`.
- Any Playwright validation must target the real built Docker/container runtime. Running Playwright against a host dev server, framework dev mode, mocked server, or source-run shortcut is not valid runtime evidence.
- If the Docker runtime cannot be built or started, the slice/plan is blocked; do not replace it with dev-server Playwright evidence.
- Playwright evidence must record the Docker build/run or compose command, container/service name, exposed URL, Playwright command, and screenshot/trace/result.
- Keep the standard planner structure. These detail rules only make phase checklist items concrete enough to implement safely.
- Every implementation phase must be decomposed into multiple implementation slices that are as small as practical. A phase is a grouping and ordering container; a slice is the executable implementation unit.
- Do not implement a phase directly. Work starts from a slice ID such as `P1-A`, `P1-B`, or `P2-C`.
- Prefer many narrow slices over one broad slice.
- Each implementation slice must include Goal, Scope Boundary, Non-Goals when useful, Pre-flight Questions, Work Steps, Implementation Gate, Acceptance, Evidence Targets, Actual-status Update, Commit Boundary.
- Split planned work into separate slices when it contains more than one primary user-visible behavior, user trigger, render location, permission or visibility rule, DB write target, DB state transition, API/CLI/MCP contract, async/event/webhook flow, external side effect, cleanup/quarantine domain, behavior test target, independent acceptance gate, or independent commit boundary.
- Hidden fallback is forbidden. Prefer a visible failure over a fallback that hides a broken primary path. Concretely: if WebRTC negotiation fails, the UI must show a clear failure/retry state, not silently stay in a fake "connected" look.
- When touching DB-backed content, verify the full loop when applicable: UI input -> submit action -> DB write -> DB read after reload/new request -> correct UI render or omission. This plan has no DB; the equivalent loop is UI trigger -> HTTP/SSE signal -> server relay -> other side's UI/media render.
- Tests must prove product behavior.
- `anvien analyze --force` was already run for this worktree (repo name `sos-vietnam-2026-worktree-bugreview`) before P0 evidence gathering in this plan; re-run it again immediately before any `P1`/`P2` implementation slice if the working tree has new commits since the last analyze.
- `js/dispatcher.js` (13,225 lines) is NOT currently parsed into the Anvien graph for this repo (file-detail lookup fails with "not found in repo"). Any slice touching `js/dispatcher.js` must use direct `Grep`/`Read` inspection plus the Implementation Gate's manual-impact checklist instead of relying on `anvien impact`/`file-detail` for that file.

## Problem

### Problem 1 — Vehicle-profile routing bug

- User-reported: clicking the motorbike ("Xe máy") routing control still results in a route that behaves/looks like a car route.
- Root cause confirmed by source + live network capture: `MapController.drawRoute(fromCoords, toCoords)` in `js/map-controller.js` (around line 546-612) is hardcoded to:
  ```
  https://router.project-osrm.org/route/v1/driving/{from};{to}?overview=full&geometries=geojson
  ```
  There is no parameter for vehicle/profile anywhere in the function signature or its 3 call sites (`js/app.js:1762`, `js/app.js:2591`, `js/dispatcher.js:9829`). Every incident, regardless of `incident.agency` (police/csgt/fire/hospital/traffic-rescue), draws the same OSRM `driving` route.
- The two **external** Google Maps deep links (`btnOpenGoogleMapsCar` -> `travelmode=driving`, `btnOpenGoogleMapsMoto` -> `travelmode=two_wheeler`) are already correct and are explicitly OUT of scope for this problem (confirmed working via live network/DOM inspection on 2026-10-05).
- Public OSRM demo server (`router.project-osrm.org`) only exposes a `driving` profile; it has no `foot`/`bike`/motorbike profile at all. A real motorbike-specific profile would require a different routing backend. This plan scopes the fix to what is achievable without introducing a new paid/self-hosted routing backend: make the drawn route vehicle-aware in a way that is honest about the OSRM limitation (see Requirements).

### Problem 2 — No real two-way call audio

- User-reported: after starting a voice call in-app, the other side's phone/screen shows ringing/accepted state but no audio is ever heard from the other party.
- Root cause confirmed by source + live DOM/network capture:
  - Zero occurrences of `RTCPeerConnection`, `createOffer`, `createAnswer`, `setRemoteDescription`, or `addIceCandidate` anywhere in the repository.
  - `/api/sos/videocall/signal` and `/api/sos/voicecall/signal` in `server.js` (around line 5353) only relay a small JSON state payload (`action: request|accept|reject|end`, `sender`, `callType`) via SSE (`broadcastToDispatchers` / `notifyCitizen`); they never carry SDP or ICE payloads.
  - `startCitizenVoiceCall` (`js/app.js:2238`) and the dispatcher-side equivalent in `js/dispatcher.js` each call `getUserMedia` purely to drive a local waveform visualizer (`setupCitizenVoiceVisualizer`) and an optional local mixed-audio recorder (`CallAudioRecorder`); neither attaches the local stream to any `RTCPeerConnection`, and neither creates an `<audio>` sink for a remote stream.
  - Confirmed live: after accepting a call, `citizenVoiceCallStatusText` shows "Đang đàm thoại 2 bên..." (now in a 2-way call) while no remote-audio `<audio>` element exists in the DOM.
- Server transport is SSE-only (`text/event-stream`), one-directional server->client; there is no WebSocket server in this codebase. Client->server messages already go over normal HTTP POST (the existing signal endpoints). This plan reuses that same POST+SSE relay pattern to also carry WebRTC SDP/ICE payloads instead of introducing a new transport (e.g. WebSocket server), to minimize blast radius on `server.js`.

### Problem 3 — Login backdoor is not environment-gated (discovered during document review, more severe than the document's own claims)

- `server.js:2322-2324` has a literal "MASTER PASS: 2002": if the submitted password equals the string `'2002'`, login succeeds for **any** `username` key present in `AGENCY_ACCOUNTS` (453 real accounts), with no environment check at all. This is independent of the per-account `passwordHash`.
- This is more serious than the document-review finding it was discovered alongside (the document claims "bcrypt password hashing"; the real algorithm is PBKDF2-SHA512 at 100,000 iterations via `services/security-crypto-service.js:26` `hashPassword` / `:46` `verifyPassword`, which is an adequate standard — no algorithm change is needed). The real defect is the universal bypass password, not the hashing algorithm.
- User decision: restrict the MASTER PASS branch to fire only when `process.env.NODE_ENV !== 'production'`; it must be fully inert in production. The repo already has this exact pattern at `server.js:270` (`if (process.env.NODE_ENV === 'production') { throw ... }` guarding account-load failure) to follow.
- A second, legitimate branch exists at `server.js:2341-2342` (`else if (user.password)`): a lazy-migration fallback for any account that still has a plaintext legacy `password` field (none should remain — `scripts/migrate-passwords.js` already ran and stripped `password` from all 453 records in `assets/agency-accounts.json`, replacing it with `passwordHash`). This branch is not a defect; preserve it as-is (it only matters if a future manual edit reintroduces a plaintext `password` field).

### Problem 4 — TLS 1.3 claim has no backing code (document review)

- The document claims (section 2.4.7.6) "mã hóa toàn bộ luồng truyền thông tin bằng giao thức TLS 1.3". `server.js` uses Node's plain `http` module (`http.createServer`, confirmed in P0 of this plan's original scope); there is no `https`, `tls`, certificate, or key configuration anywhere in the repo's application code.
- User decision: do not make Node terminate TLS itself. Add a reverse-proxy layer (new Docker Compose service) in front of the existing `sos-vietnam` service that terminates TLS 1.3, and keep `server.js` on plain HTTP behind it — this matches how the claim would be true in a real deployment (edge/proxy TLS) without touching the Node app's networking code.

### Problem 5 — Real two-way WebRTC (reference only, no new work)

- This is Problem 2 / `P2` above. Do not create a duplicate phase; `P3` through `P9` below continue numbering after `P2` precisely so this is not re-done.

### Problem 6 — Excel "4-sheet + Thao Tác (action) column" is mostly real; one field is parsed but never used

- The document (sections 2.5, 4.2) claims a 4-sheet export (`Công An`, `Y Tế`, `Cứu Nạn`, `Mẫu Thêm Mới`) with an action column whose `TAO_MOI` value drives automatic new-account creation on import.
- Confirmed real: `services/accounts-excel-generator.js` generates exactly 3 sheets (`wb.addWorksheet('Công An & CAND')` line 243, `wb.addWorksheet('Cấp Cứu Y Tế')` line 377, `wb.addWorksheet('Cứu Hộ Doanh Nghiệp')` line 421) — no 4th "Mẫu Thêm Mới" sheet. A real import endpoint already exists: `server.js:6013` `POST /api/admin/import-accounts-excel`, which shells out (`exec`, line 6046) to `scripts/import_accounts_excel.py`.
- Confirmed real in the Python script: header detection for the action column already exists (`scripts/import_accounts_excel.py:181-182`, matching `'thêm tài khoản'`/`'thao tác'`/`'action'`/`'thêm mới'` in the header row), and the per-row value is read into `raw_action` at line 243. Confirmed by `Grep`: `raw_action` is read exactly once and never referenced again anywhere else in the file — the column is parsed but has zero effect on behavior today. Create-vs-update is actually decided purely by whether `username` already exists in `existing_accounts` (line 282).
- User decision: build this for real — add the missing 4th template sheet, and wire the already-parsed `raw_action` value into real create/skip logic (require a recognizable "create" signal in that column before creating a brand-new username; rows with no username match and no valid action value are skipped and reported back, not silently created or silently dropped).

### Problem 7 — "Kalman Filter" claim; real code only does a simple accuracy-threshold check

- The document (section 2.2) claims GPS smoothing via a "Kalman Filter". `js/location.js`'s `refineLocation()` (lines 82-126) only compares each new `watchPosition` reading's accuracy against the previous accuracy (`const better = acc + 25 < this.accuracy`, line 110) or distance moved (`moved > 40`, same line) — this is a simple best-of-N accuracy gate, not a Kalman filter (no state vector, no process/measurement noise model, no prediction step).
- User decision: implement a real 1D Kalman filter over successive GPS fixes inside `refineLocation()`, replacing the accuracy-threshold logic, while keeping `LocationService`'s external contract (constructor, `onLocationUpdate`, `emitUpdate`, `acquireLocation`, `reverseGeocode`) unchanged — `js/app.js` calls into these and must not need any change.

### Problem 8 — Playwright test files cited by name in the document do not exist

- The document (section 4.4, table) cites `playwright/test-bidirectional-signature-persistence.cjs` and `playwright/verify-ui-signature-draw-and-display.cjs` as existing, passing E2E tests. Confirmed: the `playwright/` directory does not exist in the repo at all (`ls playwright/` fails). `package.json` lists `playwright: ^1.63.0` under `devDependencies` but the package is not installed (`node_modules/@playwright` absent).
- User decision: create both files for real, testing the bidirectional e-signature mechanism this document and the earlier plan's own `/api/sos/sign` work already describe (citizen hand-drawn canvas signature, dispatcher electronic signature, dispatcher sign-on-behalf-of-citizen, citizen blocked from signing the officer slot with a real `403` from `server.js:4839` `/api/sos/sign`), plus a server-restart-readback persistence check.

### Problem 9 — Table 4.3 performance figures and the "192 trạm" count cannot be traced to any benchmark or data in the repo

- The document's Table 4.3 (section 4.3) cites specific load-time, offline-load-time, SSE latency, GPS accuracy (3.2m outdoor / 6.8m indoor), and bot-block-rate figures from "30 field measurement points in Cần Thơ". No field-measurement infrastructure, log, or script exists in the repo to back any of these numbers.
- The document also cites "192 trạm trực ban tác chiến toàn quốc" (section 2.4.4); the real account store (`assets/agency-accounts.json`) has 453 records (counted directly, confirmed twice in this session).
- User decision: do not travel to Cần Thơ for field measurement. Instead, measure for real against the Dockerized runtime using tools already available (Playwright, the browser's own Performance/Resource Timing APIs, and the existing WAF counter logic) for every metric that is actually measurable from this machine: first paint/load time, offline-cache load time (via `sw.js`), SSE signal latency (`POST /api/sos/create` to `EventSource` receipt), and the WAF bot-block behavior (`server.js:2108`, "Layer 7 Anti-AI Crawler & Scraper Bot WAF"). GPS accuracy cannot be measured this way (it depends on real device hardware and real-world signal conditions) — classify it `blocked` for field-measurement and replace the fabricated 3.2m/6.8m figures with an honest, spec-based description instead of inventing new numbers. The "192 trạm" figure gets corrected to the real, final account count once P3-P8 are done (count again at that point in case P6's new-account wiring changed it).

## Scope

- `js/map-controller.js`: `MapController.drawRoute` and its OSRM call.
- `js/app.js`: citizen-side call sites of `drawRoute` (`:1762`, `:2591`); citizen-side call lifecycle (`startCitizenVoiceCall`, `handleVideoCallSignal`, `endCitizenVoiceCall`, `citizenAccessHeaders`), to be extended with real WebRTC peer logic.
- `js/dispatcher.js`: dispatcher-side call site of `drawRoute` (`:9829`); dispatcher-side call lifecycle (`startDispatcherVideoCall` and its voice-call counterpart), to be extended with matching WebRTC peer logic.
- `server.js`: `/api/sos/videocall/signal` and `/api/sos/voicecall/signal` handlers, and the `broadcastToDispatchers` / `notifyCitizen` SSE relay functions, extended to also relay SDP/ICE payloads (`action: 'webrtc-offer' | 'webrtc-answer' | 'webrtc-ice'`), while preserving all existing `action` values and routing rules (escalation level filtering, citizen<->dispatcher direction rules).
- New or extended `<audio>` elements in `index.html` and the dispatcher HTML page needed to play the remote stream, scoped strictly to the existing call modals (`citizenVoiceCallModal`, and the dispatcher equivalent) — no new modal structure, no redesign of the existing call UI/UX (timer, visualizer, recorder, accept/reject buttons stay as-is).
- `server.js:2322-2347` (login handler's MASTER PASS and legacy-password branches) — restrict, do not remove the legitimate lazy-migration branch.
- `Dockerfile`, `docker-compose.yml` — add a reverse-proxy service; no change to the existing `sos-vietnam` service's build or `CMD`.
- `services/accounts-excel-generator.js` — add a 4th worksheet.
- `scripts/import_accounts_excel.py` — wire the already-parsed `raw_action` value into real logic.
- `js/location.js` — replace the accuracy-threshold logic inside `refineLocation()` with a real Kalman filter, same public API.
- New files: `playwright/test-bidirectional-signature-persistence.cjs`, `playwright/verify-ui-signature-draw-and-display.cjs`.
- `C:\Users\dienv\Desktop\docs\thuyết trình\SOS_VIETNAM_2026.docx` (and its paired `.pdf`) — outside this repo, outside Anvien's index; corrected in the final phase once the real numbers from P3-P8 are known.

## Non-Goals

- Not replacing OSRM with a paid/self-hosted routing engine that has a true motorcycle-specific profile. If the user later wants genuinely different motorbike-vs-car street paths (e.g. one-way exemptions, alley access), that is a separate future plan requiring a new routing backend decision — explicitly deferred, not solved here.
- Not building video call WebRTC in this plan's required scope — video call (`startCitizenLiveStream` / dispatcher video) shares the same missing-RTCPeerConnection defect, but the user's reported bug and explicit approval in this conversation were about the **voice** call. Video call gets the same signaling channel extension for free at the server layer, but wiring an actual video `RTCPeerConnection` end-to-end is out of scope unless explicitly requested later. Flag this as a known follow-up in evidence, do not silently "fix" it beyond what the channel extension naturally provides.
- Not changing the Agency Checkbox Toggles / `docCheckRescue` / `docCheck115` report gap (user explicitly deferred this: keep current phone-call-based intake for Y tế and Cứu hộ dịch vụ unchanged).
- Not touching the dead mobile-menu-hamburger event wiring found during the earlier review (`btnToggleMobileMenu`, `mobileMenuDrawer`, etc.) — that is inert dead code with no HTML counterpart and causes no behavior regression; cleanup is optional and out of this plan's required scope.
- Not changing TURN/STUN infrastructure procurement. This plan uses public STUN only (e.g. Google's `stun:stun.l.google.com:19302`); if NAT traversal in the field requires a TURN server, that is a deployment/ops decision outside this plan's scope — must be flagged, not silently assumed solved.
- Not migrating the password-hashing algorithm to bcrypt. PBKDF2-SHA512 at 100,000 iterations (already in place via `services/security-crypto-service.js`) is an adequate standard; changing it would not fix the actual defect (the MASTER PASS bypass) and is explicitly out of scope per user decision.
- Not removing the `server.js:2341-2342` legacy-plaintext-password lazy-migration branch — it is a legitimate one-time upgrade path, not a defect, and `scripts/migrate-passwords.js` already proves it was used correctly once; only the unrelated MASTER PASS branch is restricted.
- Not provisioning a real public domain or a real Let's Encrypt certificate for `P4`; local/CI validation of TLS 1.3 uses a self-signed certificate. Production rollout with a real domain is a deployment-time decision outside this plan.
- Not building AI voice transcription, flood/landslide sensor integration, or any other "Hướng phát triển tiếp theo" (future-work) item from the document's section 5.2 — those are explicitly future work in the document itself, not claims of current capability, so there is no document/code gap to close for them.
- Not traveling to Cần Thơ or any other site for field GPS/network measurement; `P9`'s GPS-accuracy sub-item is corrected to an honest, spec-based description instead of a field-measured number.

## Requirements

### Vehicle-profile routing (Problem 1)

- `drawRoute` must accept a vehicle/profile argument derived from `incident.agency` at each of its 3 call sites.
- OSRM only has a `driving` profile on the public demo server, so the fix must be honest: use OSRM `driving` for car/ambulance-class agencies (`hospital`, `fire` which uses trucks, `csgt` when operating 4-wheel), and for the motorbike-class case (default ward `police` patrol, and `traffic-rescue` 2-wheel recovery), compute a visually-distinct route styling (dashed/different color per the existing route-layer paint block) PLUS attempt the OSRM `driving` profile as the only real street-shape source available, since no motorbike profile exists upstream. The acceptance bar is: the drawn route profile parameter, the visible route styling, and the vehicle icon/marker (`setVehicleMarker`) must all agree with the assigned agency's actual vehicle — no call site may silently default to car styling/profile for a motorbike-class agency.
- Must not regress the already-correct Google Maps `travelmode` deep links.
- Must not introduce a new network dependency beyond the existing `router.project-osrm.org` call (no new paid API key work in this plan).

### Real two-way voice call (Problem 2)

- Must implement a real `RTCPeerConnection` on both the citizen side (`js/app.js`) and dispatcher side (`js/dispatcher.js`) for the voice call feature only.
- Must extend the existing `/api/sos/videocall/signal` / `/api/sos/voicecall/signal` POST handlers and SSE relay in `server.js` to carry `action: 'webrtc-offer'`, `'webrtc-answer'`, `'webrtc-ice'` payloads end to end, reusing the existing per-incident, per-direction (citizen<->dispatcher) routing rules already implemented in `broadcastToDispatchers`/`notifyCitizen` (including the escalation-level filtering already in place) — must not weaken or bypass those existing authorization/routing rules.
- Must attach the remote `MediaStream`'s audio track to a real `<audio autoplay>` element so the other party's voice is actually audible.
- Must preserve 100% of the existing call UI/UX: call modal, ringing/accepted status text, call timer, mic mute toggle, audio visualizer canvas, 2-way call recorder (`CallAudioRecorder`) — these must keep working exactly as before, now against a real remote stream instead of (or in addition to) the local-only stream.
- Must handle and visibly surface WebRTC failure (ICE failure, getUserMedia denial, peer connection closed unexpectedly) rather than silently leaving the UI in a fake "connected" state (ties to the Hidden-fallback-forbidden rule).
- Must clean up (`close()` the RTCPeerConnection, stop tracks) on `endCitizenVoiceCall`/dispatcher end-call and on call reject, to avoid leaking open peer connections across repeated calls on the same incident.

### Login backdoor restriction (Problem 3)

- The MASTER PASS `'2002'` branch at `server.js:2322-2324` must only evaluate to `isValidPassword = true` when `process.env.NODE_ENV !== 'production'`.
- When `NODE_ENV === 'production'`, submitting `'2002'` as a password must behave exactly as if that branch did not exist (fall through to the real `passwordHash`/`defaultPasswordForAccount` checks, and fail if those also fail).
- Must not touch the real `passwordHash` verification path (`services/security-crypto-service.js`), the `defaultPasswordForAccount` fallback, or the legacy-plaintext lazy-migration branch (`server.js:2341-2347`) — all three stay exactly as they are.
- Must prove the restriction with live HTTP requests in both `NODE_ENV` states, not by reading the diff alone.

### TLS 1.3 via reverse proxy (Problem 4)

- `server.js` keeps using `http.createServer`; zero changes to its networking code.
- A new reverse-proxy service (Caddy, chosen for built-in modern-TLS defaults and simpler config than Nginx+certbot for this repo's single-service case) is added to `docker-compose.yml`, terminates TLS with a minimum protocol version of TLS 1.3, and proxies to the existing `sos-vietnam` service over the Docker-internal network.
- For local/CI validation (no public domain available), the proxy uses a self-signed certificate; the plan must say explicitly that a real deployment needs a real domain for Let's Encrypt and that this is a known, accepted gap for this environment.
- Must prove TLS 1.3 is actually negotiated with a live `openssl s_client` (or equivalent) handshake against the running Docker Compose stack, not by reading the Caddyfile/config alone.

### Excel 4th sheet + real action-column wiring (Problem 6)

- `services/accounts-excel-generator.js` gains a 4th worksheet (a "Mẫu Thêm Mới" template sheet) in addition to the 3 existing worksheets, with example/placeholder rows showing the expected columns including the action column.
- `scripts/import_accounts_excel.py`'s already-parsed `raw_action` value must gate new-account creation: when a row's `username` does not already exist in `existing_accounts`, the row is only turned into a new account if `raw_action` contains a recognizable "create" signal (e.g. normalized value containing `tao_moi`/`tạo mới`/`them moi`/`thêm mới`); otherwise the row is skipped and listed in a `skipped`/`warnings` array in the script's JSON output (already consumed by `server.js:6013`'s response construction, which already forwards `created`/`updated`/`newUnits` — extend it to also forward the skip list).
- Existing-username rows (updates) are unaffected by this change — the action-column gate only applies to the create path, to avoid breaking the already-working update behavior.
- Must prove with a real import request against a real multi-row `.xlsx` file: one row with an unused username and a valid action value creates an account; one row with an unused username and no/invalid action value is skipped and reported, not silently created.

### Real Kalman filter for GPS smoothing (Problem 7)

- `js/location.js`'s `refineLocation()` method is rewritten to run a 1D Kalman filter (independently over latitude and longitude, or over a 2D state — implementer's choice, documented in the code) across successive `watchPosition` fixes, using each fix's own `position.coords.accuracy` as the measurement-noise input.
- `LocationService`'s public surface (constructor fields, `onLocationUpdate`, `emitUpdate`, `acquireLocation`, `reverseGeocode`) keeps its exact current signature; `js/app.js`'s calls into it must not need any change.
- Must prove with a live, repeatable test (Playwright driving a mocked/synthetic geolocation sequence with injected noise) that the filtered output is smoother (lower variance) than the raw synthetic input, not just that the code runs without throwing.

### Playwright test files matching the document's citations (Problem 8)

- `playwright/test-bidirectional-signature-persistence.cjs` and `playwright/verify-ui-signature-draw-and-display.cjs` must exist, be runnable (`npx playwright test` or direct `node` invocation per the file's own convention), and actually exercise: citizen hand-drawn canvas signature capture and persistence, dispatcher electronic signature, dispatcher sign-on-behalf-of-citizen, a citizen attempt to sign the officer slot receiving a real `403` from `/api/sos/sign`, and a server-restart-then-reread check that the persisted signatures survive.
- Must run against the real Docker-built runtime per this plan's existing Docker-evidence rule, not a dev server.

### Honest, measured Table 4.3 figures + corrected "192 trạm" (Problem 9)

- Every figure that is actually measurable from this machine (first load time, offline/cache load time, SSE signal latency, WAF bot-block rate) must come from a real measurement against the Docker-built runtime, recorded with the exact tool/command used.
- The GPS-accuracy figure must not be a fabricated field measurement; it is replaced with an honest, spec-based statement (W3C Geolocation API accuracy is hardware/environment-dependent; this codebase applies no accuracy-guaranteeing filter beyond the Kalman smoothing added in `P7`), explicitly marked `blocked` for field measurement in `actual-status.md`.
- The "192 trạm" figure is corrected to the real final count of `assets/agency-accounts.json` records, counted again after `P6` lands (in case new-account creation during `P6`'s own testing changed the count), with the exact count and the counting command recorded as evidence before it is written into the document in `Pn`'s document-correction slice.

## Acceptance Criteria

- Live browser test (citizen tab + dispatcher tab, Dockerized runtime) for a `police` (ward-level) incident shows the in-app map route styled/profiled as the motorbike case, matching the vehicle marker icon; the same test for a `hospital` incident shows the car/driving case. Both verified by network capture of the OSRM request plus DOM/style inspection of the rendered route layers.
- Live browser test (two real browser contexts/tabs, Dockerized runtime) for a voice call: citizen starts a voice call, dispatcher accepts, and dispatcher-side injected/synthetic audio (e.g. a WebAudio oscillator tone fed into the mocked mic track) is actually received and audible/measurable on the citizen tab's remote `<audio>` element (and vice versa for the reverse direction), proving real two-way audio transport — not just UI state text.
- Existing call UI elements (timer, visualizer, mute, recorder, reject/end flows) still function unchanged, verified live.
- `anvien detect-changes --repo sos-vietnam-2026-worktree-bugreview --scope all` run before each implementation-slice commit, with no unexpected affected files outside this plan's Scope.
- Full Docker build (`docker-compose build` or `docker build`) succeeds and the container serves the app; Playwright/browser evidence captured against that running container, not a host `node server.js` dev run.
- Live HTTP proof that `password=2002` fails against the Docker container running with `NODE_ENV=production`, and succeeds (for an account with no other matching password) when the container runs with `NODE_ENV` set to a non-production value.
- Live `openssl s_client`/equivalent proof of a TLS 1.3 handshake against the reverse-proxy service in the Docker Compose stack.
- Live import proof: a 2-row test `.xlsx` upload where one row (new username + valid action value) creates an account and the other (new username + no/invalid action value) is skipped and reported, verified against the real `/api/admin/import-accounts-excel` endpoint.
- A Playwright-driven synthetic-noise test demonstrating the new Kalman filter output has lower variance than the raw noisy input it was fed.
- Both new Playwright test files run successfully against the Docker-built runtime and their pass/fail output is recorded.
- The final NCKH document correction pass only writes numbers that trace to an evidence ID recorded earlier in this plan's `evidence.md` — no new number is invented at document-editing time.

## Checklist

- [x] P0-A: Complete actual status before implementation work.
  - Goal: establish the real current state.
  - Work Steps: inspect source-of-truth files, classify each surface, record blocked or missing pieces, and update later phase status assumptions, next actions, and work steps from evidence.
  - Implementation Gate: no implementation or editing starts until `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-actual-status.md` has a final P0 decision.
  - Acceptance: actual status identifies correct, partial, missing/unbound, fake-or-stub, and blocked surfaces for this scope.

### P1: Vehicle-aware route rendering

- Phase Goal: make the in-app tactical-map route line agree with the assigned agency's real vehicle (motorbike-class vs car/truck-class), end to end from the 3 call sites down through `drawRoute`'s OSRM call and route-layer styling.
- Phase Boundary:
  - In scope: `MapController.drawRoute` signature/body in `js/map-controller.js`; the 3 call sites in `js/app.js` (`:1762`, `:2591`) and `js/dispatcher.js` (`:9829`); route-layer paint properties already defined in `drawRoute`.
  - Out of scope: Google Maps deep links (already correct); introducing a new routing backend/API key; `setVehicleMarker` icon logic beyond confirming it already agrees with agency (read-only check).
  - Dependencies: P0-A actual status must classify `js/dispatcher.js:9829`'s exact current call signature (not graph-indexed; manual read required).
- Phase Implementation Rule: do not implement `P1` directly. Implement `P1-A`, verify it, record evidence, refresh actual-status, commit when required, then continue to `P1-B`.
- Ordered Slice List:
  - P1-A: Add a vehicle-profile parameter to `MapController.drawRoute` and derive it from agency at all 3 call sites.
  - P1-B: Validate the vehicle-aware route rendering live in both citizen and dispatcher UIs for a motorbike-class and a car-class incident.

- [x] P1-A: Add a vehicle-profile parameter to `MapController.drawRoute` and derive it from agency at all 3 call sites.
  - Goal: `drawRoute` receives and uses an explicit vehicle-profile argument instead of being hardcoded to OSRM `driving`; all 3 callers pass the correct profile derived from `incident.agency`.
  - Scope Boundary:
    - Editable: `js/map-controller.js` (`drawRoute` function body/signature, route layer paint blocks), `js/app.js` lines around `:1762` and `:2591` (call-site arguments only), `js/dispatcher.js` line around `:9829` (call-site arguments only).
    - Inspect-only: `setVehicleMarker` in `js/map-controller.js` (confirm icon already matches agency; do not change unless a mismatch is found, in which case split into a new slice).
    - Preserve-only: Google Maps `travelmode` link logic in `js/app.js` (`:2574-2582`); `js/dispatcher.js` Google Maps link logic if present.
    - Out of scope: any OSRM backend/API change, any new HTTP dependency.
  - Non-Goals: do not attempt a real motorbike-specific street path; OSRM demo server has no such profile. The goal is correct profile parameterization + honest visual distinction, not a geometrically different path when OSRM has nothing else to offer.
  - Pre-flight Questions:
    - Data source: `incident.agency` (string already present on every incident object per `js/app.js:2566-2592` usage).
    - Display permission: N/A, no new visibility/permission rule.
    - DB read flow: N/A, no DB in this repo; incident state comes from the in-memory/SSE-pushed incident object already in hand at each call site.
    - DB write flow: N/A.
    - Render location: MapLibre GL route layer (`this.routeSourceId + '-glow'`, `'-line'`) inside the existing map canvas on both citizen tracking view and dispatcher map view.
    - UI behavior flow: no new user-facing control; this changes what the existing in-app route line looks like for a given already-assigned incident, automatically, with no new button.
    - Docker runtime: validated in P1-B, not here (code-only slice).
    - Playwright target: validated in P1-B.
    - Behavior test: validated in P1-B via live network+DOM capture (no existing automated test harness for this repo was found in P0; do not invent one here beyond what P1-B's live evidence requires).
    - Cleanup/quarantine: N/A, no persistent test data created.
    - External side effects: still calls the same external `router.project-osrm.org` host; no new external side effect.
    - N/A notes: none.
  - Work Steps:
    1. Read current `drawRoute` body in `js/map-controller.js` (already read in P0 evidence `E0-P0A-SRC1`); add a `vehicleProfile` (e.g. `'driving'` or `'motorbike'`) parameter with a safe default that preserves current behavior if omitted (`'driving'`), then branch the route-layer paint colors/dash-pattern on it, and keep the OSRM request always using `driving` (documented in a code comment explaining the public-OSRM limitation) while the visual distinction (color/dash) reflects the true profile.
       - UI flow check: open tracking view for an incident, confirm the route line visually differs (color/dash) between a motorbike-class and car-class incident.
       - DB/data flow check: N/A (no DB).
       - Render location check: MapLibre layer IDs unchanged (`this.routeSourceId + '-glow'/'-line'`), only paint properties conditionally vary.
       - Mini QA for each completed implementation slice (MUST): use the Browser preview tool to open the citizen tracking view after this code change and confirm the route layer paint reflects the passed profile (inline eval reading `map.getPaintProperty`).
       - Evidence target: `E1-P1A-SRC1` (diff of `drawRoute` signature/body), `E1-P1A-UI1` (preview_eval reading computed paint property).
    2. Update the 3 call sites to pass a profile derived from `incident.agency`: `js/app.js:1762` and `:2591` (citizen-visible tracking render), `js/dispatcher.js:9829` (dispatcher map render). Define the agency->profile mapping once (e.g. a small shared lookup/comment: `police`(ward default)/`traffic-rescue` -> motorbike-class, `hospital`/`fire`/`csgt` -> car-class) consistently across both files; since there is no shared module imported by both `app.js` and `dispatcher.js`, duplicate the small mapping with an identical comment in both files rather than introducing a new shared module (keeps blast radius minimal; note this duplication explicitly in evidence).
       - UI flow check: submit a `police` SOS as citizen, confirm route renders motorbike-class styling; separately exercise a `hospital` incident on the dispatcher map and confirm car-class styling.
       - DB/data flow check: N/A.
       - Render location check: same as step 1.
       - Mini QA for each completed implementation slice (MUST): use the Browser preview tool to drive both the citizen flow (`index.html`) and, separately, open `dispatcher.html`, log in with a sample dispatcher account from `D:\DOWNLOAD\DanhSach_TaiKhoan_PhanQuyen_DonVi_2026-09-17.xlsx` (e.g. `admin`/`Admin` national level, or `capcaikhect`/`Congan@113` ward level), and confirm the dispatcher-side route render also reflects the correct profile for an assigned incident.
       - Evidence target: `E1-P1A-SRC2` (diff of 3 call sites), `E1-P1A-UI2` (citizen-side screenshot/log), `E1-P1A-UI3` (dispatcher-side screenshot/log with the account used).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - Run `anvien impact symbol "drawRoute" --repo sos-vietnam-2026-worktree-bugreview --direction upstream` before editing `js/map-controller.js`; since `js/dispatcher.js` is not graph-indexed, additionally `Grep` the exact line/args at `js/dispatcher.js:9829` immediately before editing to confirm the line number has not drifted.
  - Acceptance:
    - Source: `drawRoute` signature now takes a profile argument with a documented default; all 3 call sites pass an agency-derived value; no call site left on the old 2-argument signature.
    - Runtime/UI: live preview shows visually distinct route styling for a motorbike-class vs car-class incident on both citizen and dispatcher views.
    - DB/data: N/A.
    - Behavior test: live network capture still shows the OSRM `driving` request (expected, documented limitation) but route layer paint differs by profile.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E1-P1A-SRC1`, `E1-P1A-SRC2`, `E1-P1A-UI1`, `E1-P1A-UI2`, `E1-P1A-UI3`.
    - Actual-status rows refreshed: `drawRoute` row moves `wrong -> correct` (or `partial -> correct` if styling-only is judged partial pending P1-B live confirmation).
  - Evidence Targets: `E1-P1A-SRC1`, `E1-P1A-SRC2`, `E1-P1A-UI1`, `E1-P1A-UI2`, `E1-P1A-UI3`.
  - Actual-status Update: update `drawRoute` / 3 call sites rows in Current Status Matrix after this slice.
  - Commit Boundary: commit after this slice when acceptance passes.

- [x] P1-B: Validate the vehicle-aware route rendering live in both citizen and dispatcher UIs for a motorbike-class and a car-class incident.
  - Goal: close the loop with real browser/Docker evidence that the fix is visible to an actual user, not just unit-level code correctness.
  - Scope Boundary:
    - Editable: none (validation-only slice); may add a temporary Playwright script under `playwright/` per repo convention (reusable location, not a one-off temp file) if deeper automation is useful, but a manual Browser-tool pass is sufficient to satisfy acceptance.
    - Inspect-only: all files touched in P1-A.
    - Preserve-only: everything else.
    - Out of scope: any further code change; if a defect is found here, open a new slice rather than silently patching mid-validation.
  - Non-Goals: do not expand scope to video call or report-doc fields during this validation pass.
  - Pre-flight Questions:
    - Data source: live incidents created through the real citizen SOS flow and real dispatcher accounts from the provided Excel account list.
    - Display permission: dispatcher login must use a real account row (document which row was used) to also exercise the real auth path, not a bypass.
    - DB read flow: N/A.
    - DB write flow: N/A.
    - Render location: citizen tracking view map canvas; dispatcher map canvas.
    - UI behavior flow: SOS submit (citizen) -> dispatcher sees/accepts/assigns -> route renders on both sides.
    - Docker runtime: must run the app via the repo's `Dockerfile`/`docker-compose.yml`, not `node server.js` directly, per the full-build rule.
    - Playwright target: the Docker-exposed URL.
    - Behavior test: pass/fail recorded in evidence with screenshots.
    - Cleanup/quarantine: any test incidents created in `.runtime-data/incident-history.json` or similar during this pass must be identified; if the app has no reset mechanism, note this in evidence rather than hand-editing runtime data files outside of normal app flows.
    - External side effects: real call to `router.project-osrm.org` (acceptable, matches production behavior).
    - N/A notes: none.
  - Work Steps:
    1. Build and start the Docker runtime (`docker compose up --build` or equivalent); confirm the container serves the app on its mapped port.
       - UI flow check: load the citizen landing page through the Docker-exposed URL.
       - DB/data flow check: N/A.
       - Render location check: N/A at this step.
       - Mini QA for each completed implementation slice (MUST): Browser tool preview against the Docker-exposed URL (not the host dev server).
       - Evidence target: `E1-P1B-DOCKER1` (build/run command + success log).
    2. Drive the citizen SOS flow for a `police` (ward) incident and the dispatcher accept/assign flow using a real account from the Excel list; capture the rendered route styling + OSRM network call; repeat for a `hospital` incident.
       - UI flow check: both citizen and dispatcher screens show the route; styling differs correctly by agency class.
       - DB/data flow check: N/A.
       - Render location check: confirmed via `preview_eval` reading MapLibre layer paint properties, plus a screenshot.
       - Mini QA for each completed implementation slice (MUST): Browser tool screenshots + network capture for both scenarios.
       - Evidence target: `E1-P1B-UI1` (motorbike-class capture), `E1-P1B-UI2` (car-class capture).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - This slice is validation-only; if evidence reveals a defect, stop and open a new P1 slice instead of patching inside P1-B.
  - Acceptance:
    - Source: N/A (no source change in this slice).
    - Runtime/UI: both scenarios show correct, visually distinct, agency-correct route styling against the Docker runtime.
    - DB/data: N/A.
    - Behavior test: pass recorded with evidence IDs below.
    - Cleanup/quarantine: any test incident data created is identified in evidence.
    - Evidence IDs: `E1-P1B-DOCKER1`, `E1-P1B-UI1`, `E1-P1B-UI2`.
    - Actual-status rows refreshed: `drawRoute` / 3 call sites rows move to final `correct` status with live-evidence IDs attached.
  - Evidence Targets: `E1-P1B-DOCKER1`, `E1-P1B-UI1`, `E1-P1B-UI2`.
  - Actual-status Update: finalize P1 rows as `correct` with live evidence.
  - Commit Boundary: no new commit required if no code changed; if a Playwright script was added under `playwright/`, commit that script alone.

### P2: Real two-way WebRTC voice call

- Phase Goal: make the citizen<->dispatcher voice call feature carry real two-way audio using WebRTC, signaled over the existing POST+SSE channel, while preserving all existing call UI/UX.
- Phase Boundary:
  - In scope: `server.js` signal handlers + SSE relay (extend payload `action` vocabulary only); `js/app.js` citizen-side call lifecycle; `js/dispatcher.js` dispatcher-side call lifecycle; a new/extended `<audio>` sink element in each HTML page's existing call modal markup.
  - Out of scope: video call WebRTC wiring (signaling channel extension incidentally supports it, but no video `RTCPeerConnection` work is required or should be added here); TURN server procurement; any new transport (WebSocket, dedicated media server).
  - Dependencies: P1 is independent and does not block P2; P0-A must classify the exact current `startCitizenVoiceCall`/`handleVideoCallSignal`/dispatcher-equivalent code before P2-A starts, since `js/dispatcher.js` is not graph-indexed.
- Phase Implementation Rule: do not implement `P2` directly. Implement `P2-A`, verify it, record evidence, refresh actual-status, commit when required, then continue to `P2-B`, `P2-C`.
- Ordered Slice List:
  - P2-A: Extend `server.js` signal relay to carry WebRTC SDP/ICE payloads end to end.
  - P2-B: Wire a real `RTCPeerConnection` + remote-audio sink on the citizen side (`js/app.js`).
  - P2-C: Wire a real `RTCPeerConnection` + remote-audio sink on the dispatcher side (`js/dispatcher.js`), and validate a live two-way audio call end to end.

- [x] P2-A: Extend `server.js` signal relay to carry WebRTC SDP/ICE payloads end to end.
  - Goal: `/api/sos/videocall/signal` and `/api/sos/voicecall/signal` accept and relay new `action` values (`webrtc-offer`, `webrtc-answer`, `webrtc-ice`) with an opaque `sdp`/`candidate` payload, routed with the exact same citizen<->dispatcher direction and escalation-level rules already enforced for `request`/`accept`/`reject`/`end`.
  - Scope Boundary:
    - Editable: the signal POST handler body (around `server.js:5353-5402`) only to widen the accepted/forwarded payload shape; no change to `broadcastToDispatchers`/`notifyCitizen` routing-rule logic itself (reuse as-is).
    - Inspect-only: `requireIncidentActor`, `incidents` map, escalation-level filtering logic in `broadcastToDispatchers` (confirm it is agnostic to `action` value and therefore already works for the new actions without modification; if not agnostic, split a new slice).
    - Preserve-only: all existing `action` handling (`request`/`accept`/`reject`/`end`) and their current recipients/filters.
    - Out of scope: any new endpoint path; any auth/token model change.
  - Non-Goals: do not build a generic signaling abstraction; keep the extension minimal and inline with the existing handler.
  - Pre-flight Questions:
    - Data source: SDP/ICE payloads originate from the browser's native WebRTC APIs on each side; server treats them as opaque JSON passthrough.
    - Display permission: identical to existing `citizenAccessToken/requireIncidentActor` check already gating this endpoint; must not weaken it.
    - DB read flow: reads `incidents.get(cleanId)` exactly as today.
    - DB write flow: no persistent write of SDP/ICE payloads needed (ephemeral, in-memory relay only); do not add them to `incidents` map state or `.runtime-data` persistence.
    - Render location: N/A (server-only slice).
    - UI behavior flow: no direct UI change in this slice.
    - Docker runtime: validated in P2-C.
    - Playwright target: validated in P2-C.
    - Behavior test: validated in P2-C (end-to-end audio); this slice's own acceptance is a direct HTTP+SSE round-trip check.
    - Cleanup/quarantine: no persistent data created.
    - External side effects: none beyond existing SSE connections.
    - N/A notes: none.
  - Work Steps:
    1. Widen the destructured body fields and `signalPayload` construction in the POST handler to pass through `sdp`/`candidate` fields when `action` is one of the new WebRTC actions, without altering behavior for existing actions.
       - UI flow check: N/A (server-only).
       - DB/data flow check: confirm no new field is written into persistent incident state.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): use a terminal/HTTP tool (e.g. `curl` via Bash, or the Browser tool's network panel) to POST a synthetic `webrtc-offer` payload against the running dev server and confirm it is relayed to an open SSE listener with the same payload fields.
       - Evidence target: `E2-P2A-SRC1`, `E2-P2A-HTTP1` (round-trip capture).
    2. Confirm (by reading, not editing) that `broadcastToDispatchers`'s existing `if (event === 'videocall_signal' || event === 'voicecall_signal')` branch and its escalation-level filtering apply uniformly regardless of the inner `action` value, so the new WebRTC actions inherit the same authorization/routing behavior automatically.
       - UI flow check: N/A.
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): re-read the exact `broadcastToDispatchers` branch and confirm no `action`-specific special-casing exists that would need updating; record the exact line range read.
       - Evidence target: `E2-P2A-SRC2`.
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - Run `anvien api impact /api/sos/videocall/signal --repo sos-vietnam-2026-worktree-bugreview` (or `anvien impact symbol` on the handler) before editing `server.js`; `server.js` is graph-indexed and flagged `risk: high` with 33 outbound/209 local relationships, so treat edits as scoped strictly to the destructuring/payload lines named above.
  - Acceptance:
    - Source: handler accepts and relays the 3 new actions with `sdp`/`candidate` payload intact; existing actions byte-for-byte unchanged in behavior.
    - Runtime/UI: N/A for this slice.
    - DB/data: confirmed no persistent write of SDP/ICE payloads.
    - Behavior test: synthetic HTTP+SSE round-trip proves relay works for the new actions.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E2-P2A-SRC1`, `E2-P2A-SRC2`, `E2-P2A-HTTP1`.
    - Actual-status rows refreshed: `server.js` signal handler row moves `missing -> partial` (full close only after P2-C end-to-end proof).
  - Evidence Targets: `E2-P2A-SRC1`, `E2-P2A-SRC2`, `E2-P2A-HTTP1`.
  - Actual-status Update: update signal-handler row to `partial`.
  - Commit Boundary: commit after this slice when acceptance passes.

- [x] P2-B: Wire a real `RTCPeerConnection` + remote-audio sink on the citizen side (`js/app.js`).
  - Goal: `startCitizenVoiceCall` creates a real `RTCPeerConnection`, exchanges SDP/ICE over the P2-A channel, and plays the dispatcher's remote audio through a real `<audio autoplay>` element, while keeping all existing call UI (timer, visualizer, mute, recorder) working unchanged.
  - Scope Boundary:
    - Editable: `startCitizenVoiceCall`, `endCitizenVoiceCall`, `handleVideoCallSignal` (voice branch only) in `js/app.js`; `index.html` call modal markup limited to adding one `<audio id="citizenRemoteVoiceAudio" autoplay>` element inside the existing `citizenVoiceCallModal` block (no layout/visual redesign).
    - Inspect-only: `setupCitizenVoiceVisualizer`, `CallAudioRecorder` usage (must keep receiving the correct stream reference; if the recorder should now also mix in the *remote* stream, that is already supported per `call-audio-recorder.js:104-114`'s `remoteStreamToConnect` handling found in the earlier review — confirm and wire the remote stream into it rather than leaving it unused).
    - Preserve-only: modal DOM IDs, timer logic, mute-toggle logic, ringtone logic (`startIncomingCallRingtone`/`stopIncomingCallRingtone`), existing SSE listener wiring for non-WebRTC actions.
    - Out of scope: dispatcher-side changes (P2-C); video call changes.
  - Non-Goals: do not redesign the call modal UI; do not add new user-facing controls beyond what's needed for failure-state surfacing (one small status-text branch is enough, no new buttons unless retry is explicitly required by acceptance).
  - Pre-flight Questions:
    - Data source: local `getUserMedia` stream (already acquired) becomes the local track added to the new `RTCPeerConnection`; remote track arrives via `pc.ontrack`.
    - Display permission: existing mic-permission flow unchanged; add a visible failure state if `getUserMedia` or ICE negotiation fails (ties to hidden-fallback-forbidden rule).
    - DB read flow: N/A.
    - DB write flow: N/A.
    - Render location: existing `citizenVoiceCallModal`; new `<audio>` element is non-visual (no layout change) but must be present in the DOM.
    - UI behavior flow: start call -> request signal (existing) -> on accept, create/send offer -> receive answer -> exchange ICE -> `ontrack` fills the new `<audio>` element -> existing timer/visualizer/recorder continue to function; end call -> `pc.close()` + stop all tracks.
    - Docker runtime: validated in P2-C (full two-way loop needs both sides).
    - Playwright target: validated in P2-C.
    - Behavior test: validated in P2-C.
    - Cleanup/quarantine: ensure no lingering open `RTCPeerConnection` across repeated calls on the same incident (explicit `close()` on end/reject).
    - External side effects: adds STUN requests to the public Google STUN server (`stun:stun.l.google.com:19302`) during ICE gathering — a new external dependency; must be documented in evidence as an accepted, minimal addition (no TURN, no paid service).
    - N/A notes: none.
  - Work Steps:
    1. Add `RTCPeerConnection` creation (with the public STUN config), local-track attachment, `onicecandidate` -> POST `webrtc-ice`, and offer creation/send on the citizen-initiated path inside `startCitizenVoiceCall`; add `ontrack` handling that attaches the remote stream to the new `<audio>` element and (per Inspect-only note) also feeds `CallAudioRecorder` the remote stream if citizen initiated recording.
       - UI flow check: start a citizen voice call; confirm `RTCPeerConnection` object exists (`preview_eval`) and local track attached.
       - DB/data flow check: N/A.
       - Render location check: new `<audio>` element present in `citizenVoiceCallModal` DOM, `autoplay` set, `srcObject` assigned once a remote track arrives.
       - Mini QA for each completed implementation slice (MUST): Browser tool: open citizen page, start voice call, inspect DOM for the new audio element and `RTCPeerConnection` signaling state transitions via `preview_eval`.
       - Evidence target: `E2-P2B-SRC1`, `E2-P2B-UI1`.
    2. Add `handleVideoCallSignal`'s voice branch to also process `webrtc-offer`/`webrtc-answer`/`webrtc-ice` (dispatcher-initiated direction: dispatcher sends offer, citizen answers), and add `pc.close()` + track stop in `endCitizenVoiceCall` and in the reject path.
       - UI flow check: receive a (simulated, until P2-C) incoming call signal and confirm the citizen side responds with an answer when accepted.
       - DB/data flow check: N/A.
       - Render location check: N/A beyond step 1.
       - Mini QA for each completed implementation slice (MUST): Browser tool: simulate an incoming `webrtc-offer` via a direct POST (Bash/curl) against the dev server and confirm the citizen tab's `handleVideoCallSignal` produces a `webrtc-answer` POST in the network log.
       - Evidence target: `E2-P2B-SRC2`, `E2-P2B-HTTP1`.
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - Run `anvien impact symbol "startCitizenVoiceCall" --repo sos-vietnam-2026-worktree-bugreview --direction upstream` and the same for `handleVideoCallSignal` and `endCitizenVoiceCall` before editing `js/app.js`.
  - Acceptance:
    - Source: citizen-side `RTCPeerConnection` lifecycle fully wired (create, local track, ICE, offer/answer per direction, cleanup on end/reject).
    - Runtime/UI: new `<audio>` element present and correctly bound; existing call UI (timer/visualizer/mute/recorder) still functions, confirmed live.
    - DB/data: N/A.
    - Behavior test: synthetic signal round-trip (step 2) proves the answer path fires correctly; full audio proof deferred to P2-C.
    - Cleanup/quarantine: `pc.close()` confirmed called on end/reject paths by code inspection.
    - Evidence IDs: `E2-P2B-SRC1`, `E2-P2B-SRC2`, `E2-P2B-UI1`, `E2-P2B-HTTP1`.
    - Actual-status rows refreshed: citizen-side call lifecycle row moves `fake-or-stub -> partial`.
  - Evidence Targets: `E2-P2B-SRC1`, `E2-P2B-SRC2`, `E2-P2B-UI1`, `E2-P2B-HTTP1`.
  - Actual-status Update: update citizen-side call lifecycle row to `partial`.
  - Commit Boundary: commit after this slice when acceptance passes.

- [x] P2-C: Wire a real `RTCPeerConnection` + remote-audio sink on the dispatcher side (`js/dispatcher.js`), and validate a live two-way audio call end to end.
  - Goal: mirror P2-B's wiring on the dispatcher side, then prove real two-way audio transport live against the Docker runtime.
  - Scope Boundary:
    - Editable: dispatcher-side voice-call lifecycle functions in `js/dispatcher.js` (exact function names/line ranges to be confirmed by direct read in this slice's Implementation Gate step, since the file is not graph-indexed); dispatcher HTML page's call-modal markup limited to adding one `<audio autoplay>` element, mirroring P2-B.
    - Inspect-only: dispatcher-side existing call UI (timer, mute, recorder) equivalents.
    - Preserve-only: dispatcher map/incident-list features untouched; dispatcher auth/login flow untouched.
    - Out of scope: any further citizen-side change (already done in P2-B); video call wiring.
  - Non-Goals: no dispatcher UI redesign.
  - Pre-flight Questions:
    - Data source: dispatcher-side local mic stream + remote track from citizen.
    - Display permission: dispatcher must be logged in with a real account (from the provided Excel list) with permission to view/accept the incident's call, exercising the real auth path.
    - DB read flow: N/A.
    - DB write flow: N/A.
    - Render location: dispatcher's existing call-accept UI block.
    - UI behavior flow: mirror of P2-B, dispatcher-initiated and citizen-initiated directions both exercised in validation.
    - Docker runtime: required for this slice's validation step (full two-way audio proof).
    - Playwright target: Docker-exposed URL, two separate browser contexts (citizen + dispatcher) or two Browser-tool sessions.
    - Behavior test: synthetic audio tone injected on one side's mocked mic track, measured as received on the other side's remote `<audio>` element (e.g. via Web Audio `AnalyserNode` reading above-noise-floor signal), proving real transport, not just UI state.
    - Cleanup/quarantine: any test incidents/accounts exercised are from the real seed account list; no new persistent accounts are created; note which existing account rows were used.
    - External side effects: same public STUN dependency as P2-B, already accepted.
    - N/A notes: none.
  - Work Steps:
    1. Read `js/dispatcher.js`'s voice-call lifecycle functions directly (`Grep`/`Read`, since not graph-indexed) and mirror P2-B's `RTCPeerConnection`/`<audio>`/cleanup wiring for the dispatcher-initiated and citizen-initiated directions.
       - UI flow check: dispatcher logs in (real account), opens an incident with an active citizen voice-call request, accepts it.
       - DB/data flow check: N/A.
       - Render location check: new dispatcher-side `<audio>` element present and bound on `ontrack`.
       - Mini QA for each completed implementation slice (MUST): Browser tool on the dispatcher page: confirm `RTCPeerConnection` created, offer/answer exchanged, DOM audio element bound.
       - Evidence target: `E2-P2C-SRC1`, `E2-P2C-UI1`.
    2. Run the full Docker build/run per the full-build rule; execute the live two-way audio proof (synthetic tone injected one side, measured on the other, and the reverse direction) across citizen and dispatcher tabs/contexts for one real incident created through the real SOS flow and accepted by a real dispatcher account.
       - UI flow check: both sides show "Đang đàm thoại 2 bên" state; both sides' remote `<audio>` elements carry a non-silent `srcObject`.
       - DB/data flow check: N/A.
       - Render location check: confirmed via `preview_eval`/Web Audio analysis on both tabs.
       - Mini QA for each completed implementation slice (MUST): Browser tool, Docker-backed, two tabs/contexts, screenshots + analyser-node measurement captured both directions; also exercise end-call cleanup (confirm `RTCPeerConnection` closed, no dangling connection on a second call attempt for the same incident).
       - Evidence target: `E2-P2C-DOCKER1`, `E2-P2C-AUDIO1` (citizen hears dispatcher), `E2-P2C-AUDIO2` (dispatcher hears citizen), `E2-P2C-CLEANUP1`.
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - `js/dispatcher.js` is not graph-indexed (confirmed in P0); this slice's gate is manual: `Grep` the exact current dispatcher voice-call function names/line ranges immediately before editing and record them as `E2-P2C-SRC0` so the edit targets exact, current line numbers rather than the earlier review's approximate references.
  - Acceptance:
    - Source: dispatcher-side `RTCPeerConnection` lifecycle fully wired, mirroring P2-B; both directions (dispatcher-initiated, citizen-initiated) implemented.
    - Runtime/UI: live Docker-backed two-way audio proof passes in both directions; existing dispatcher call UI unaffected.
    - DB/data: N/A.
    - Behavior test: analyser-node (or equivalent) measurement proves non-silent remote audio received on both sides; failure-state surfacing confirmed by forcing a getUserMedia denial or ICE failure and observing a visible failure state (not a silent fake-connected UI).
    - Cleanup/quarantine: confirmed no dangling `RTCPeerConnection` after end-call; no new persistent test accounts created.
    - Evidence IDs: `E2-P2C-SRC0`, `E2-P2C-SRC1`, `E2-P2C-UI1`, `E2-P2C-DOCKER1`, `E2-P2C-AUDIO1`, `E2-P2C-AUDIO2`, `E2-P2C-CLEANUP1`.
    - Actual-status rows refreshed: citizen-side and dispatcher-side call lifecycle rows, and the `server.js` signal-handler row, all move to final `correct`.
  - Evidence Targets: `E2-P2C-SRC0`, `E2-P2C-SRC1`, `E2-P2C-UI1`, `E2-P2C-DOCKER1`, `E2-P2C-AUDIO1`, `E2-P2C-AUDIO2`, `E2-P2C-CLEANUP1`.
  - Actual-status Update: finalize all P2 rows as `correct` with live evidence.
  - Commit Boundary: commit after this slice when acceptance passes.

### P3: Restrict the MASTER PASS login backdoor to non-production

- Phase Goal: make `password=2002` unable to authenticate any account when `NODE_ENV=production`, with zero change to any other authentication path.
- Phase Boundary:
  - In scope: `server.js:2319-2349` (the `isValidPassword` decision block inside `/api/auth/login`) only.
  - Out of scope: `services/security-crypto-service.js` (hash algorithm stays PBKDF2-SHA512, untouched); `defaultPasswordForAccount` in `services/agency-password-policy.js`; the legacy-plaintext lazy-migration branch (`server.js:2341-2347`, preserve-only); `scripts/migrate-passwords.js` (already ran successfully, not re-run).
  - Dependencies: none; independent of P1/P2.
- Phase Implementation Rule: do not implement `P3` directly. Implement `P3-A`, verify it, record evidence, refresh actual-status, commit when required.
- Ordered Slice List:
  - P3-A: Gate the MASTER PASS branch on `NODE_ENV` and prove it live in both environment states.

- [x] P3-A: Gate the MASTER PASS branch on `NODE_ENV` and prove it live in both environment states.
  - Goal: `password === '2002'` only authenticates when `process.env.NODE_ENV !== 'production'`.
  - Scope Boundary:
    - Editable: `server.js:2322-2324` (the `if (cleanPwd === '2002') { isValidPassword = true; }` block) only.
    - Inspect-only: the rest of the `isValidPassword` decision chain (`server.js:2319-2349`) to confirm no other branch depends on this one's side effects.
    - Preserve-only: `server.js:2341-2347` (legacy-plaintext lazy migration); `services/security-crypto-service.js`; `services/agency-password-policy.js`.
    - Out of scope: any other `/api/auth/login` behavior (lockout, session token issuance, login history).
  - Non-Goals: not changing the hash algorithm; not adding a new "test account" mechanism to replace the convenience this backdoor provided for internal testing — if testers need a non-production login shortcut, the existing `NODE_ENV`-gated behavior already provides it outside production.
  - Pre-flight Questions:
    - Data source: `process.env.NODE_ENV`, already read elsewhere in `server.js` (line 270) with the exact comparison style to reuse.
    - Display permission: N/A.
    - DB read flow: N/A (no DB).
    - DB write flow: N/A.
    - Render location: N/A (server-only).
    - UI behavior flow: no UI change; a login attempt with `password=2002` in production now fails with the same error UI already shown for any other wrong password.
    - Docker runtime: required for Acceptance (must prove both `NODE_ENV` states against the real container).
    - Playwright target: not required; direct HTTP (`curl`/Bash) proof is sufficient and matches the plan's existing `test-security-boundary.js` convention.
    - Behavior test: live HTTP request in each environment state.
    - Cleanup/quarantine: no persistent state created.
    - External side effects: none.
    - N/A notes: none.
  - Work Steps:
    1. Wrap the existing `if (cleanPwd === '2002') { isValidPassword = true; }` condition with `process.env.NODE_ENV !== 'production' &&`.
       - UI flow check: N/A (server-only).
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): start the Docker container twice — once with `NODE_ENV=production` (its default per `Dockerfile`/`docker-compose.yml`), once with it overridden to a non-production value — and POST to `/api/auth/login` with a real username and `password: "2002"` in each; confirm failure in the first case and success in the second (for an account whose real password is not `2002`).
       - Evidence target: `E3-P3A-SRC1` (diff), `E3-P3A-HTTP1` (production-mode failure), `E3-P3A-HTTP2` (non-production-mode success).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - Run `anvien impact symbol "login" --repo sos-vietnam-2026-worktree-bugreview --direction upstream` (or the equivalent symbol name for the `/api/auth/login` handler) before editing; `server.js` is `risk: high` per `E0-P0A-FD3`, so the edit must stay inside the single `if` condition named above.
  - Acceptance:
    - Source: the MASTER PASS branch is unreachable when `NODE_ENV=production`; unchanged otherwise.
    - Runtime/UI: live Docker proof in both environment states (`E3-P3A-HTTP1`, `E3-P3A-HTTP2`).
    - DB/data: N/A.
    - Behavior test: `E3-P3A-HTTP1`/`E3-P3A-HTTP2` pass.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E3-P3A-SRC1`, `E3-P3A-HTTP1`, `E3-P3A-HTTP2`.
    - Actual-status rows refreshed: MASTER PASS row moves `wrong -> correct`.
  - Evidence Targets: `E3-P3A-SRC1`, `E3-P3A-HTTP1`, `E3-P3A-HTTP2`.
  - Actual-status Update: update the login-backdoor row in Current Status Matrix.
  - Commit Boundary: commit after this slice when acceptance passes.

### P4: TLS 1.3 via a reverse-proxy Docker Compose service

- Phase Goal: a live TLS 1.3 handshake succeeds against a reverse-proxy service that fronts the existing `sos-vietnam` container, with `server.js` itself unchanged.
- Phase Boundary:
  - In scope: `docker-compose.yml` (add a new service); a new Caddyfile or Nginx config file; `Dockerfile` only if the proxy needs its own build context (prefer the official Caddy image unmodified where possible, to minimize new build surface).
  - Out of scope: `server.js` networking code (stays on `http.createServer`); any change to the existing `sos-vietnam` service's `Dockerfile`, `CMD`, or exposed port; real public-domain certificate provisioning (self-signed for this plan's validation).
  - Dependencies: none; independent of P1-P3.
- Phase Implementation Rule: do not implement `P4` directly. Implement `P4-A`, verify it, record evidence, refresh actual-status, commit when required.
- Ordered Slice List:
  - P4-A: Add a Caddy reverse-proxy service to `docker-compose.yml` with TLS 1.3 minimum and a self-signed certificate, and prove the handshake live.

- [x] P4-A: Add a Caddy reverse-proxy service to `docker-compose.yml` with TLS 1.3 minimum and a self-signed certificate, and prove the handshake live.
  - Goal: a new `reverse-proxy` service in `docker-compose.yml` terminates TLS (minimum version 1.3) and forwards to `sos-vietnam:3000` over the Docker-internal network.
  - Scope Boundary:
    - Editable: `docker-compose.yml` (new service block); a new `Caddyfile` (or equivalent) added to the repo.
    - Inspect-only: existing `sos-vietnam` service block (confirm its internal port/network name to proxy to; do not change it).
    - Preserve-only: `Dockerfile`, `server.js`.
    - Out of scope: any change to how `SOS_BIND_ADDRESS`/`SOS_PORT` currently expose the app; the reverse proxy is additive, not a replacement for the existing direct-port mapping unless the user later asks for that.
  - Non-Goals: not setting up real DNS or a real Let's Encrypt certificate (no public domain available in this environment); not disabling the existing direct `sos-vietnam` port mapping.
  - Pre-flight Questions:
    - Data source: N/A.
    - Display permission: N/A.
    - DB read flow: N/A.
    - DB write flow: N/A.
    - Render location: N/A (infrastructure-only).
    - UI behavior flow: no application UI change; this only changes how the stack is reached over the network.
    - Docker runtime: required (this entire slice only exists to prove something about the Docker Compose stack).
    - Playwright target: not applicable; `openssl s_client` is the validation tool.
    - Behavior test: live TLS handshake.
    - Cleanup/quarantine: the self-signed certificate/key material generated for this slice must be clearly marked as test-only (e.g. committed only inside a `*.local-dev` config comment, or generated at container start rather than committed to the repo — prefer generation at container start to avoid committing key material).
    - External side effects: none (no real external domain contacted).
    - N/A notes: none.
  - Work Steps:
    1. Add a `reverse-proxy` service (official `caddy` image) to `docker-compose.yml`, with a `Caddyfile` configuring a `tls internal` (Caddy's built-in self-signed mode) site block, `reverse_proxy sos-vietnam:3000`, and an explicit minimum TLS version of 1.3.
       - UI flow check: N/A.
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): `docker compose up --build`, then from the host run `openssl s_client -connect localhost:<proxy-port> -tls1_3` (or the equivalent flag confirming the negotiated protocol) and confirm the handshake reports TLS 1.3; also confirm a plain HTTP/1.1 TLS1.2-only client attempt is rejected or renegotiated per Caddy's minimum-version config.
       - Evidence target: `E4-P4A-SRC1` (compose/Caddyfile diff), `E4-P4A-TLS1` (handshake capture).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs. `docker-compose.yml`/`Dockerfile` are infrastructure config, not JS/Python source — Anvien's graph does not index them; record this as `E4-P4A-FD1` (not applicable, infra file) rather than skipping the check silently.
    - No code symbol is edited in this slice; the gate is satisfied by recording `E4-P4A-FD1`.
  - Acceptance:
    - Source: `docker-compose.yml` has a new reverse-proxy service; `server.js` diff is empty for this slice.
    - Runtime/UI: N/A beyond the handshake proof.
    - DB/data: N/A.
    - Behavior test: `E4-P4A-TLS1` shows TLS 1.3 negotiated.
    - Cleanup/quarantine: no committed key material (confirmed by `git status`/diff showing no new `.key`/`.pem` files).
    - Evidence IDs: `E4-P4A-SRC1`, `E4-P4A-TLS1`, `E4-P4A-FD1`.
    - Actual-status rows refreshed: TLS claim row moves `missing -> correct` (with the self-signed/local-validation caveat recorded).
  - Evidence Targets: `E4-P4A-SRC1`, `E4-P4A-TLS1`, `E4-P4A-FD1`.
  - Actual-status Update: update the TLS row in Current Status Matrix.
  - Commit Boundary: commit after this slice when acceptance passes.

### P6: Real 4th Excel sheet + real action-column wiring on import

- Phase Goal: the account-sync Excel workbook has a real 4th template sheet, and the already-parsed action column actually gates account creation on import instead of being read and discarded.
- Phase Boundary:
  - In scope: `services/accounts-excel-generator.js` (add one worksheet); `scripts/import_accounts_excel.py` (wire `raw_action` into the create-vs-skip decision, extend the JSON summary with a skip list); `server.js:6013-6099` (`/api/admin/import-accounts-excel` handler) only to forward the new skip-list field in its JSON response.
  - Out of scope: the existing 3 worksheets' column layout (preserve); the existing update-path logic for already-known usernames (preserve, only the create path gets the new gate); `server.js:2581-2721` (`/api/admin/accounts/*` CRUD endpoints, unrelated to Excel import).
  - Dependencies: none; independent of P1-P5.
- Phase Implementation Rule: do not implement `P6` directly. Implement `P6-A`, then `P6-B`, verifying and recording evidence after each.
- Ordered Slice List:
  - P6-A: Add the 4th "Mẫu Thêm Mới" template worksheet to the generator.
  - P6-B: Wire `raw_action` into real create/skip logic and prove it live against the real import endpoint.

- [x] P6-A: Add the 4th "Mẫu Thêm Mới" template worksheet to the generator.
  - Goal: `generateAccountsWorkbookBuffer` (or the function wrapping the 3 `addWorksheet` calls) produces a workbook with a 4th sheet containing column headers matching what `scripts/import_accounts_excel.py`'s header-detection already recognizes, plus 1-2 example/placeholder rows demonstrating the action column's expected values.
  - Scope Boundary:
    - Editable: `services/accounts-excel-generator.js` only, adding a new `wb.addWorksheet(...)` call and its row-population logic, following the same style as the 3 existing sheets.
    - Inspect-only: the 3 existing worksheets (confirm column header text/order to mirror in the new sheet's headers) and `scripts/import_accounts_excel.py:181-182`'s exact header-matching strings (so the new sheet's header text actually gets recognized by the existing parser).
    - Preserve-only: `server.js:5967` (`/api/admin/export-accounts-excel`, the endpoint that calls this generator — no signature change needed if the function keeps its existing return shape).
    - Out of scope: any change to the 3 existing sheets' content or styling.
  - Non-Goals: not building a separate "import template download" endpoint; the 4th sheet simply ships inside the existing export output.
  - Pre-flight Questions:
    - Data source: static template content (column headers + 1-2 illustrative example rows), not derived from live `AGENCY_ACCOUNTS` data.
    - Display permission: same as the existing export endpoint (already gated — inspect-only, not re-verified here since no permission logic changes).
    - DB read flow: N/A (file-based, not DB).
    - DB write flow: N/A for this slice (no import yet).
    - Render location: N/A (file generation, not UI).
    - UI behavior flow: downloading the export now yields a 4-sheet file instead of 3; no button/label changes needed since the existing export button already triggers this generator.
    - Docker runtime: validated in `P6-B` once the full create/skip loop is testable; this slice can be validated with a direct Node script run against the generator.
    - Playwright target: not required for this slice.
    - Behavior test: direct invocation of the generator function, inspecting the resulting buffer's sheet names.
    - Cleanup/quarantine: no persistent runtime data touched.
    - External side effects: none.
    - N/A notes: none.
  - Work Steps:
    1. Add the 4th worksheet with header row text chosen to match `scripts/import_accounts_excel.py`'s existing recognized header strings (`'thêm tài khoản'`/`'thao tác'`/`'action'`/`'thêm mới'` for the action column, plus whatever header strings the script already recognizes for username/agency/province/etc. — read the script's full header-matching block before choosing exact text) and 1-2 example rows showing a valid "create" action value.
       - UI flow check: N/A (file content, not interactive UI).
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): run the generator directly (`node -e` or a short script importing `generateAccountsWorkbookBuffer`), write the buffer to a temp `.xlsx` inside the repo's existing `.tmp/`-style scratch convention (never outside the repo), and confirm with the `xlsx`/`exceljs` reader that exactly 4 sheets exist with the expected 4th sheet's name and header row.
       - Evidence target: `E6-P6A-SRC1` (diff), `E6-P6A-GEN1` (generated-file sheet-count/header confirmation).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - Run `anvien file-detail services/accounts-excel-generator.js --repo sos-vietnam-2026-worktree-bugreview --json` immediately before editing (already run once in P0 of this phase set, confirm no drift) and record as `E6-P6A-FD1`.
  - Acceptance:
    - Source: generator produces a 4-sheet workbook; the 3 existing sheets are byte-for-byte unchanged in column layout.
    - Runtime/UI: N/A beyond the export endpoint producing the new file shape.
    - DB/data: N/A.
    - Behavior test: `E6-P6A-GEN1` confirms 4 sheets with expected headers.
    - Cleanup/quarantine: any scratch `.xlsx` file created for this test is removed after the check, or kept only inside the repo's own temp convention — never written outside the repo.
    - Evidence IDs: `E6-P6A-SRC1`, `E6-P6A-GEN1`, `E6-P6A-FD1`.
    - Actual-status rows refreshed: "4-sheet Excel" row moves `partial -> correct` (the action-column *behavior* is still pending `P6-B`).
  - Evidence Targets: `E6-P6A-SRC1`, `E6-P6A-GEN1`, `E6-P6A-FD1`.
  - Actual-status Update: update the Excel-sheet-count row in Current Status Matrix.
  - Commit Boundary: commit after this slice when acceptance passes.

- [x] P6-B: Wire `raw_action` into real create/skip logic and prove it live against the real import endpoint.
  - Goal: a row with a username that does not already exist only becomes a new account when `raw_action` carries a recognizable "create" signal; otherwise it is skipped and reported, not silently created or silently ignored.
  - Scope Boundary:
    - Editable: `scripts/import_accounts_excel.py` (add the gate right after `raw_action` is read at line 243, and after `existing = existing_accounts.get(username, {})` at line 282 determines whether this is a create or update); `server.js:6058-6087` (the response-construction block in the import handler) to forward a new `skipped`/`warnings` list from the script's JSON summary.
    - Inspect-only: the rest of `scripts/import_accounts_excel.py`'s per-row account-building logic (lines ~282-320+) — the update path for already-known usernames must remain completely unaffected by this change.
    - Preserve-only: `server.js:6013-6057` (request parsing, temp-file handling) — no change needed there.
    - Out of scope: any change to how `existing_accounts` is loaded or how the final merged accounts file is written.
  - Non-Goals: not inventing new action values beyond what reasonably normalizes to "create" (e.g. `TAO_MOI`, `Tạo mới`, `them moi`, case/diacritic-insensitive) — keep the recognized-value set small and documented in a code comment, matching the document's own `TAO_MOI` example.
  - Pre-flight Questions:
    - Data source: the uploaded `.xlsx` file's action column, already read into `raw_action`.
    - Display permission: same as the existing import endpoint (unchanged, already gated to admin — inspect-only).
    - DB read flow: N/A (file-based).
    - DB write flow: `assets/agency-accounts.json` gains new records only for rows passing the new gate; rows failing the gate must not appear in the written file at all (not even as partial/incomplete records).
    - Render location: N/A (server-side logic + JSON response; no new UI needed, though the admin UI consuming this response may want to surface the skip list later — out of scope to build that UI in this slice).
    - UI behavior flow: an admin uploading a file with a mix of valid-create and invalid-create rows gets back a response whose `created`/`updated` counts reflect only what actually got written, plus a new list of what was skipped and why.
    - Docker runtime: required for Acceptance (live import against the real endpoint).
    - Playwright target: not required; a direct HTTP POST (Bash/curl, matching the plan's existing synthetic-HTTP convention from `P2-A`) is sufficient.
    - Behavior test: live import with a crafted 2+-row test file.
    - Cleanup/quarantine: the test import will write real new rows into the running container's `assets/agency-accounts.json` (or its runtime-data copy) — this must be done against a disposable/test container state, not the account store that holds the 453 real production-looking records from the user's own Excel sheet; if no disposable test instance exists, use a copy of the accounts file under a controlled path for the direct-script-invocation half of this test, and only use the real running container for the final live-endpoint confirmation with an easily identifiable/removable test username (e.g. prefixed `test_p6b_`), removed afterward.
    - External side effects: none.
    - N/A notes: none.
  - Work Steps:
    1. In `scripts/import_accounts_excel.py`, after `existing = existing_accounts.get(username, {})` (line 282), add: if `existing` is empty (new username) and `raw_action`'s normalized value is not in the recognized "create" set, skip this row (do not add it to the output accounts dict) and append a record to a new `skipped` list in the script's final JSON summary (reusing the existing `normalize_text` helper already used elsewhere in the file for consistent normalization).
       - UI flow check: N/A (server-side).
       - DB/data flow check: confirm a skipped row never appears in the written `agency-accounts.json`.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): invoke the script directly against a small 2-row test `.xlsx` (one valid-create row, one new-username-no-action row), inspect the script's stdout JSON for `created`/`skipped` counts, and inspect the output accounts JSON to confirm only the valid-create row is present.
       - Evidence target: `E6-P6B-SRC1` (diff), `E6-P6B-SCRIPT1` (direct script-invocation proof).
    2. Extend `server.js`'s response construction (around line 6071-6087) to forward the script's new `skipped`/`warnings` list in the HTTP JSON response.
       - UI flow check: N/A (no admin UI built in this slice; API-level only).
       - DB/data flow check: same as step 1, confirmed again at the HTTP layer.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): POST the same 2-row test file to the real running `/api/admin/import-accounts-excel` endpoint (admin-authenticated) against the Docker container, and confirm the JSON response's `created`/`skipped` fields match the direct-script result from step 1; remove the test-created account afterward (per the Cleanup/quarantine plan above).
       - Evidence target: `E6-P6B-HTTP1` (live import response), `E6-P6B-CLEANUP1` (test account removed).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - `scripts/import_accounts_excel.py` is a Python script; confirm whether Anvien's graph indexes it (if `file-detail` fails like `js/dispatcher.js` did, record that and fall back to manual `Grep`/`Read` verification immediately before editing, same pattern as the dispatcher-file risk note in this plan).
  - Acceptance:
    - Source: `raw_action` now gates new-account creation; update-path behavior for existing usernames is unchanged (confirmed by re-running the existing update behavior with no action-column value and seeing it still succeed, since the gate only applies to the create path).
    - Runtime/UI: `E6-P6B-HTTP1` shows the real endpoint returning accurate `created`/`skipped` data.
    - DB/data: confirmed no skipped row reaches `agency-accounts.json`.
    - Behavior test: `E6-P6B-SCRIPT1` and `E6-P6B-HTTP1` both pass.
    - Cleanup/quarantine: `E6-P6B-CLEANUP1` confirms the test-created account was removed from the real account store afterward.
    - Evidence IDs: `E6-P6B-SRC1`, `E6-P6B-SCRIPT1`, `E6-P6B-HTTP1`, `E6-P6B-CLEANUP1`.
    - Actual-status rows refreshed: "action column wiring" row moves `fake-or-stub -> correct`.
  - Evidence Targets: `E6-P6B-SRC1`, `E6-P6B-SCRIPT1`, `E6-P6B-HTTP1`, `E6-P6B-CLEANUP1`.
  - Actual-status Update: update the action-column-wiring row in Current Status Matrix.
  - Commit Boundary: commit after this slice when acceptance passes.

### P7: Real Kalman filter for GPS smoothing

- Phase Goal: `js/location.js`'s GPS-refinement step uses a real Kalman filter instead of a simple accuracy threshold, with no change to `LocationService`'s external contract.
- Phase Boundary:
  - In scope: `js/location.js`'s `refineLocation()` method body only (lines 82-126); a small internal filter-state field on `LocationService` (e.g. `this._kalmanState`) is allowed as a new private field.
  - Out of scope: `acquireLocation()`'s first-fix logic (preserve: the Kalman filter only applies across the successive `watchPosition` refinement fixes, not the initial fix); `reverseGeocode()`; the public method signatures and `onLocationUpdate`/`emitUpdate` event shape consumed by `js/app.js`.
  - Dependencies: none; independent of P1-P6.
- Phase Implementation Rule: do not implement `P7` directly. Implement `P7-A`, verify it, record evidence, refresh actual-status, commit when required.
- Ordered Slice List:
  - P7-A: Replace the accuracy-threshold logic with a real 1D Kalman filter and prove it reduces noise on a synthetic sequence.

- [x] P7-A: Replace the accuracy-threshold logic with a real 1D Kalman filter and prove it reduces noise on a synthetic sequence.
  - Goal: successive GPS fixes inside `refineLocation()` are fused through a Kalman filter (state: position, optionally velocity; measurement noise derived from each fix's `position.coords.accuracy`), and the filtered output is empirically smoother than the raw input on an injected noisy sequence.
  - Scope Boundary:
    - Editable: `js/location.js` (`refineLocation()` body, plus any small private helper/state the filter needs on the `LocationService` instance).
    - Inspect-only: `js/app.js`'s calls into `LocationService` (confirm no change to how `onLocationUpdate` payload shape or `emitUpdate` timing is consumed — the filter changes *how* `this.currentCoords`/`this.accuracy` are computed internally, not the shape of what gets emitted).
    - Preserve-only: `acquireLocation()`, `reverseGeocode()`, the constructor's public fields.
    - Out of scope: any UI change; the citizen-facing GPS display already reads `this.currentCoords`/`this.accuracy` and needs no change since those fields keep their existing meaning and units.
  - Non-Goals: not implementing a full Extended/Unscented Kalman filter or a multi-sensor fusion system; a straightforward linear 1D (or independent-per-axis) Kalman filter is sufficient and matches what the document actually claims ("Kalman Filter", unqualified).
  - Pre-flight Questions:
    - Data source: successive `position.coords.{latitude,longitude,accuracy}` from `navigator.geolocation.watchPosition`, exactly as today.
    - Display permission: N/A.
    - DB read flow: N/A.
    - DB write flow: N/A.
    - Render location: N/A (internal computation; existing render consumers unaffected).
    - UI behavior flow: no new user-facing control; the GPS indicator a citizen already sees becomes smoother/more stable across successive fixes, same as before but via a real filter instead of a threshold check.
    - Docker runtime: not required for this slice's own proof (a synthetic unit-style test suffices); may still be exercised incidentally during later Docker-based end-to-end passes.
    - Playwright target: a Playwright script driving `page.evaluate` against a loaded page (or a standalone Node test importing the module directly, if `js/location.js`'s ESM export allows a non-browser import) with a scripted sequence of synthetic noisy coordinates fed through the class's refinement logic.
    - Behavior test: statistical — filtered-sequence variance must be lower than raw-sequence variance for the same synthetic input.
    - Cleanup/quarantine: no persistent state; a test script may be added under `playwright/` if that is the chosen harness, in which case it follows the repo's "reusable, not one-off" `playwright/` convention from `AGENTS.md`.
    - External side effects: none (synthetic input, no real device/geolocation call).
    - N/A notes: none.
  - Work Steps:
    1. Implement the Kalman filter inside `refineLocation()`, replacing the `better`/`moved` threshold branch with: predict step (carry forward previous state), update step (blend the new noisy fix using a Kalman gain derived from the fix's own `accuracy` as measurement variance and a small fixed process-noise constant), and update `this.currentCoords`/`this.accuracy` from the filter's posterior estimate before calling `emitUpdate()`.
       - UI flow check: N/A (internal computation).
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): write a small synthetic test (Playwright or a standalone Node script, per the Pre-flight decision) that feeds a sequence of noisy coordinates (true position + random Gaussian-like jitter) through the filter logic and asserts the filtered output's variance from the true position is meaningfully lower than the raw input's variance.
       - Evidence target: `E7-P7A-SRC1` (diff), `E7-P7A-TEST1` (variance-reduction proof with the before/after numbers).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs.
    - Run `anvien impact symbol "refineLocation" --repo sos-vietnam-2026-worktree-bugreview --direction upstream` before editing (or `file-detail js/location.js` already recorded as `E0-P0A-FD5` in `actual-status.md` for this phase set — confirm no drift) and record the result.
  - Acceptance:
    - Source: `refineLocation()` runs a real Kalman filter; `LocationService`'s public surface is unchanged (confirmed by re-reading `js/app.js`'s call sites and seeing no required edits there).
    - Runtime/UI: no citizen-visible change beyond smoother GPS behavior over time (not independently provable without real-device field testing, so this is not claimed as a separately-provable UI acceptance item — the statistical proof is the acceptance bar).
    - DB/data: N/A.
    - Behavior test: `E7-P7A-TEST1` shows measured variance reduction.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E7-P7A-SRC1`, `E7-P7A-TEST1`.
    - Actual-status rows refreshed: "Kalman Filter" claim row moves `fake-or-stub -> correct`.
  - Evidence Targets: `E7-P7A-SRC1`, `E7-P7A-TEST1`.
  - Actual-status Update: update the Kalman-filter row in Current Status Matrix.
  - Commit Boundary: commit after this slice when acceptance passes.

### P8: Real Playwright test files matching the document's citations

- Phase Goal: `playwright/test-bidirectional-signature-persistence.cjs` and `playwright/verify-ui-signature-draw-and-display.cjs` exist, are runnable, and genuinely test the bidirectional e-signature mechanism against the real Docker-built runtime.
- Phase Boundary:
  - In scope: two new files under `playwright/`; `package.json`'s `devDependencies.playwright` (already present, just needs `npm install` to actually be usable — confirm and run if missing, do not change the version).
  - Out of scope: any change to the signature feature's own implementation (`/api/sos/sign` at `server.js:4839`, and the citizen/dispatcher signature UI) unless this phase's testing surfaces an actual defect there, in which case stop and open a new slice rather than silently patching mid-test-authoring.
  - Dependencies: none; independent of P1-P7, though it reuses the same Docker-runtime validation convention already established by P1/P2.
- Phase Implementation Rule: do not implement `P8` directly. Implement `P8-A`, then `P8-B`, verifying and recording evidence after each.
- Ordered Slice List:
  - P8-A: Install Playwright and write `verify-ui-signature-draw-and-display.cjs` (UI-level signature capture/display check).
  - P8-B: Write `test-bidirectional-signature-persistence.cjs` (citizen/officer/sign-on-behalf/403-block/server-restart-readback) and run both files against the real Docker runtime.

- [x] P8-A: Install Playwright and write `verify-ui-signature-draw-and-display.cjs` (UI-level signature capture/display check).
  - Goal: a runnable Playwright script that drives the citizen-facing HTML5 canvas signature control, captures a drawn signature, and verifies it is displayed back correctly in the UI.
  - Scope Boundary:
    - Editable: new file `playwright/verify-ui-signature-draw-and-display.cjs`; `node_modules` (via `npm install`, not hand-edited).
    - Inspect-only: the citizen signature canvas markup/JS in `index.html`/`js/app.js` (to find the correct selectors/IDs to drive).
    - Preserve-only: the signature feature's own implementation.
    - Out of scope: the dispatcher-side and bidirectional/persistence/403/restart scenarios (those belong to `P8-B`).
  - Non-Goals: not building a full visual-regression/pixel-diff harness; a DOM-state/attribute-level check that a signature was captured and is reflected in the relevant element is sufficient.
  - Pre-flight Questions:
    - Data source: live UI interaction (simulated pointer/touch drawing on the canvas).
    - Display permission: citizen flow requires no special auth beyond the existing citizen-access-token flow already used elsewhere in this plan's P1/P2 validation.
    - DB read flow: N/A (no DB).
    - DB write flow: the signature gets persisted into the incident's record via the existing `/api/sos/sign` flow — this script observes that, does not bypass it.
    - Render location: the citizen report/signature UI already present in `index.html`.
    - UI behavior flow: open citizen tracking view for a real incident -> trigger the signature canvas -> draw -> submit -> observe the UI reflects a captured signature.
    - Docker runtime: required (per this plan's existing Playwright-must-target-Docker rule).
    - Playwright target: the Docker Compose-exposed URL.
    - Behavior test: this script itself is the behavior test.
    - Cleanup/quarantine: any test incident created for this script must be identifiable (e.g. a distinct description/tag) and the script should document how to find/remove it afterward, consistent with the Cleanup convention already used in `P1-B`/`P6-B`.
    - External side effects: none beyond the already-accepted OSRM/STUN calls from P1/P2 if the same incident flow is reused.
    - N/A notes: none.
  - Work Steps:
    1. Run `npm install` (first use of the already-declared `playwright` devDependency in this repo) and record the installed version; confirm `npx playwright --version` succeeds.
       - UI flow check: N/A (tooling setup).
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): run `npx playwright --version` and `npx playwright install --dry-run` (or equivalent) to confirm the toolchain is usable before writing the test.
       - Evidence target: `E8-P8A-TOOL1` (install/version confirmation).
    2. Write `playwright/verify-ui-signature-draw-and-display.cjs`: launch against the Docker-exposed URL, create or reuse a test incident, drive the citizen signature canvas (simulate drawing strokes), submit, and assert the UI reflects a non-empty captured signature (e.g. a filled canvas, a stored signature image/data reference, or whatever concrete DOM signal the real implementation exposes — confirmed by the Inspect-only read, not assumed).
       - UI flow check: the script's own assertions are the UI flow check.
       - DB/data flow check: assert the signature round-trips (e.g. by reloading the page/incident view and confirming the signature still displays, if the implementation supports that read-back — if it does not, document that limitation rather than asserting something untrue).
       - Render location check: assertions target the real citizen signature UI element, not a mocked DOM.
       - Mini QA for each completed implementation slice (MUST): run the script against the Docker-built runtime and record pass/fail with a screenshot/trace.
       - Evidence target: `E8-P8A-RUN1` (script run result against Docker).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs. New files under `playwright/` have no prior graph entry; record `E8-P8A-FD1` as "new file, no prior graph entry" rather than skipping the check.
    - No existing source is edited in this slice beyond `package-lock.json` from `npm install`; the gate is satisfied by `E8-P8A-FD1`.
  - Acceptance:
    - Source: `playwright/verify-ui-signature-draw-and-display.cjs` exists and is syntactically runnable.
    - Runtime/UI: `E8-P8A-RUN1` shows a real pass against the Docker-built runtime.
    - DB/data: N/A beyond what the script itself observes.
    - Behavior test: `E8-P8A-RUN1` passes.
    - Cleanup/quarantine: any test incident created is identifiable and documented for later removal.
    - Evidence IDs: `E8-P8A-TOOL1`, `E8-P8A-RUN1`, `E8-P8A-FD1`.
    - Actual-status rows refreshed: "verify-ui-signature-draw-and-display.cjs exists" row moves `missing -> correct`.
  - Evidence Targets: `E8-P8A-TOOL1`, `E8-P8A-RUN1`, `E8-P8A-FD1`.
  - Actual-status Update: update the Playwright-file-existence row in Current Status Matrix.
  - Commit Boundary: commit after this slice when acceptance passes.

- [x] P8-B: Write `test-bidirectional-signature-persistence.cjs` (citizen/officer/sign-on-behalf/403-block/server-restart-readback) and run both files against the real Docker runtime.
  - Goal: a second Playwright script exercises the full bidirectional-signature scenario set the document's Table 4.4 claims were already tested: citizen signs, dispatcher signs, dispatcher signs on behalf of the citizen, a citizen attempt to sign the officer slot is blocked with a real `403`, and signatures survive a server restart.
  - Scope Boundary:
    - Editable: new file `playwright/test-bidirectional-signature-persistence.cjs`.
    - Inspect-only: `/api/sos/sign` (`server.js:4839`, confirmed in this session's review to already enforce the citizen/officer role check and return `403` on violation) and the dispatcher-side sign-on-behalf UI control.
    - Preserve-only: the signature feature's own implementation (no fix expected here; this phase proves it already works, per the earlier document-review finding that `/api/sos/sign`'s `403` behavior was already confirmed `CÓ-ĐÚNG`/correct).
    - Out of scope: any change to `/api/sos/sign` itself unless this testing surfaces a real defect, in which case stop and open a new slice.
  - Non-Goals: not building a full regression suite for every signature edge case; the 5 scenarios the document's Table 4.4 explicitly claims are the acceptance bar.
  - Pre-flight Questions:
    - Data source: live incident + live citizen/dispatcher sessions, same as `P8-A`.
    - Display permission: the dispatcher-side scenarios require a real dispatcher login (an account from the Excel-derived account list already used in P1-B/P2-C, referenced by username only).
    - DB read flow: N/A (file/in-memory incident state, not a DB).
    - DB write flow: the server-restart-readback scenario specifically requires stopping and restarting the Docker container (or the `server.js` process inside it) and re-reading the persisted incident/signature state afterward.
    - Render location: citizen signature UI; dispatcher signature UI; dispatcher sign-on-behalf control.
    - UI behavior flow: 5 distinct scenarios, each a complete UI trigger -> request -> persisted-state -> re-render loop.
    - Docker runtime: required; the restart scenario specifically needs real container stop/start, not a dev-server reload.
    - Playwright target: the Docker Compose-exposed URL, before and after a real container restart.
    - Behavior test: this script is the behavior test; each of the 5 scenarios is a separate assertion block.
    - Cleanup/quarantine: test incidents/accounts used must be identifiable and removed/documented afterward, consistent with the plan's existing cleanup convention.
    - External side effects: none beyond what P1/P2 already accept.
    - N/A notes: none.
  - Work Steps:
    1. Write the 5 scenario blocks in `playwright/test-bidirectional-signature-persistence.cjs`: (a) citizen hand-drawn canvas signature persists; (b) dispatcher electronic signature persists; (c) dispatcher signs on behalf of the citizen (the document-cited "Ký Thay Người Dân" control) and the resulting record reflects that; (d) a citizen-session attempt to write into the officer-signature slot receives a real `403` from `/api/sos/sign`; (e) stop and restart the Docker container, then re-read the incident and confirm the previously captured signatures are still present and unchanged.
       - UI flow check: each scenario's own UI trigger, asserted directly.
       - DB/data flow check: each scenario's persistence (or correct rejection) is asserted directly.
       - Render location check: assertions target the real citizen/dispatcher signature UI elements.
       - Mini QA for each completed implementation slice (MUST): run both `P8-A`'s and this slice's scripts together against the Docker-built runtime (including the real container restart for scenario (e)) and record full pass/fail output.
       - Evidence target: `E8-P8B-SRC1` (script content), `E8-P8B-RUN1` (full 5-scenario run result, including the restart step), `E8-P8B-CLEANUP1` (test data identified/removed).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs. Record `E8-P8B-FD1` as "new file, no prior graph entry", same as `P8-A`.
    - Re-confirm `/api/sos/sign`'s exact current line range (`server.js:4839` plus its surrounding role-check block) immediately before writing assertions against it, since `server.js` is large and `risk: high`.
  - Acceptance:
    - Source: `playwright/test-bidirectional-signature-persistence.cjs` exists and covers all 5 scenarios.
    - Runtime/UI: `E8-P8B-RUN1` shows all 5 scenarios passing against the real Docker runtime, including a genuine container restart.
    - DB/data: scenario (e) specifically proves persisted-state survival across a restart.
    - Behavior test: `E8-P8B-RUN1` passes.
    - Cleanup/quarantine: `E8-P8B-CLEANUP1` confirms test data was identified/removed.
    - Evidence IDs: `E8-P8B-SRC1`, `E8-P8B-RUN1`, `E8-P8B-CLEANUP1`, `E8-P8B-FD1`.
    - Actual-status rows refreshed: both Playwright-file-existence rows and the "bidirectional signature already works" row move to final `correct` with live-evidence IDs attached.
  - Evidence Targets: `E8-P8B-SRC1`, `E8-P8B-RUN1`, `E8-P8B-CLEANUP1`, `E8-P8B-FD1`.
  - Actual-status Update: finalize both Playwright-file rows and the signature-feature row.
  - Commit Boundary: commit after this slice when acceptance passes.

### P9: Honest, measured performance figures + corrected account count

- Phase Goal: replace Table 4.3's unsupported figures with real measurements for everything measurable from this machine, an honest spec-based statement for GPS accuracy, and the "192 trạm" figure corrected to the real final account count.
- Phase Boundary:
  - In scope: measurement scripts/commands only (no application source change expected); the actual document-text correction happens in the later document-correction phase, not here — this phase only produces the real numbers and an honest replacement statement to feed into that later phase.
  - Out of scope: any change to the measured systems themselves (SSE, Service Worker, WAF) unless measurement reveals an actual defect, in which case stop and open a new slice.
  - Dependencies: should run after `P3`-`P8` land, since the final account count (for the "192 trạm" correction) and the Docker/TLS stack (for realistic load-time measurement) are more representative once those phases are done; `P9` is still listed before the document-correction phase because its output feeds that phase directly.
- Phase Implementation Rule: do not implement `P9` directly. Implement `P9-A`, verify it, record evidence, refresh actual-status, commit when required (commit here means committing any measurement script added to the repo, not the figures themselves, which live in `evidence.md`/`benchmark.md`).
- Ordered Slice List:
  - P9-A: Measure first-load, offline-load, SSE latency, and WAF bot-block rate against the real Docker runtime; record an honest GPS-accuracy statement; recount real accounts.

- [x] P9-A: Measure first-load, offline-load, SSE latency, and WAF bot-block rate against the real Docker runtime; record an honest GPS-accuracy statement; recount real accounts.
  - Goal: every Table 4.3 figure that is measurable from this machine has a real, reproducible measurement; the GPS-accuracy figure is replaced with an honest statement instead of a fabricated number; the account count is correct.
  - Scope Boundary:
    - Editable: none required in application source; a measurement script may be added under `playwright/` (reusable convention) if that is the chosen tool.
    - Inspect-only: `server.js:2108` (WAF Layer 7 Anti-AI Crawler block, to confirm its real block-rate behavior under a synthetic bot-request burst); `sw.js` (Service Worker cache, to confirm the offline-load path actually being measured is the real cache path, not a false "offline" state caused by something else).
    - Preserve-only: all measured systems themselves (no code change expected).
    - Out of scope: application source changes; if a measurement reveals the WAF/SW/SSE path is actually broken, stop and open a new slice rather than reporting a broken measurement as if it were a real figure.
  - Non-Goals: not measuring GPS accuracy via any simulated/fake method and presenting it as a real figure; not inventing a "30 points in Cần Thơ" claim replacement — the correction is explicit that this plan did not do field measurement.
  - Pre-flight Questions:
    - Data source: live timing data from the browser (Resource/Navigation Timing, Playwright's own timing APIs) and from the server (SSE event timestamps vs. the originating `POST /api/sos/create` timestamp).
    - Display permission: N/A.
    - DB read flow: N/A.
    - DB write flow: N/A (measurement only).
    - Render location: N/A.
    - UI behavior flow: this phase observes existing flows (SOS submit -> SSE receipt; first page load; offline reload) without adding new ones.
    - Docker runtime: required (per the plan's existing full-build rule; measuring against a dev server would misrepresent production-like latency).
    - Playwright target: the Docker Compose-exposed URL (and, if `P4` has landed, optionally the TLS-fronted URL too — note any latency difference honestly rather than only reporting the faster path).
    - Behavior test: each measurement's own pass/fail is "a real number was recorded", not a threshold judgment — this plan does not require hitting the document's original (possibly fabricated) targets, only replacing fabrication with honest measurement.
    - Cleanup/quarantine: any test incidents created for the SSE-latency measurement must be identifiable and documented.
    - External side effects: the WAF bot-block measurement intentionally sends bot-like requests at the running container — keep the burst small and clearly test-scoped (e.g. a few dozen requests, not a real load test), since this is still a measurement against a shared Docker Compose stack, not a dedicated load-test environment.
    - N/A notes: none.
  - Work Steps:
    1. Measure first-load time and offline/cache-load time (reload after `sw.js` has cached, with network disabled) using Playwright's navigation timing against the Docker-exposed URL; measure SSE latency by timestamping a `POST /api/sos/create` request and the corresponding `EventSource` message receipt on a subscribed client; measure the WAF's bot-block behavior by sending a small burst of requests with bot-like headers/user-agents and recording the block rate the existing `server.js:2108` logic actually produces.
       - UI flow check: N/A (measurement, not a new user flow).
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): run each measurement against the real Docker-built container at least twice to confirm the numbers are stable/reproducible, not a one-off fluke; record both runs.
       - Evidence target: `E9-P9A-PERF1` (first-load), `E9-P9A-PERF2` (offline-load), `E9-P9A-PERF3` (SSE latency), `E9-P9A-PERF4` (WAF block rate) — each with 2 runs recorded in `benchmark.md`.
    2. Write the honest GPS-accuracy replacement statement (spec-based, no fabricated field number) and recount `assets/agency-accounts.json`'s real record count (re-run the same `Object.keys(...).length` check used in `E0-P0A` evidence, after confirming `P6` has landed and any test accounts created during `P6-B`'s validation have been cleaned up).
       - UI flow check: N/A.
       - DB/data flow check: the recount must read the actual file on disk at the time of counting, not a cached number from earlier in this plan.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): re-run the count command live and record the exact output before writing it into `benchmark.md`/`evidence.md`.
       - Evidence target: `E9-P9A-GPS1` (honest statement text), `E9-P9A-COUNT1` (final account count, with the exact command and output).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs. This slice is measurement-only; if a measurement script is added under `playwright/`, record `E9-P9A-FD1` as "new file, no prior graph entry", same pattern as `P8`.
  - Acceptance:
    - Source: no application source change (or, if a measurement script was added, it is isolated to `playwright/`).
    - Runtime/UI: all 4 measurable Table 4.3 figures have 2 reproducible runs each against the real Docker runtime.
    - DB/data: N/A.
    - Behavior test: `E9-P9A-PERF1..4` all show stable, real numbers.
    - Cleanup/quarantine: any test incidents created for SSE-latency measurement are identified/removed.
    - Evidence IDs: `E9-P9A-PERF1`, `E9-P9A-PERF2`, `E9-P9A-PERF3`, `E9-P9A-PERF4`, `E9-P9A-GPS1`, `E9-P9A-COUNT1`.
    - Actual-status rows refreshed: the Table-4.3-figures row and the "192 trạm" row both move `fake-or-stub -> correct` (fed by real measurement) / `wrong -> correct` (count) respectively.
  - Evidence Targets: `E9-P9A-PERF1`, `E9-P9A-PERF2`, `E9-P9A-PERF3`, `E9-P9A-PERF4`, `E9-P9A-GPS1`, `E9-P9A-COUNT1`.
  - Actual-status Update: update the Table-4.3 and account-count rows in Current Status Matrix.
  - Commit Boundary: commit after this slice only if a measurement script was added to the repo; the figures themselves are evidence/benchmark content, not a source commit.

### P10: Correct the NCKH document itself using only numbers already proven in evidence

- Phase Goal: `SOS_VIETNAM_2026.docx` (and its paired `.pdf`) are corrected on every point this plan's P3-P9 work established as a real gap, using only values already recorded as evidence earlier in this plan — no new number is invented at document-editing time.
- Phase Boundary:
  - In scope: `C:\Users\dienv\Desktop\docs\thuyết trình\SOS_VIETNAM_2026.docx` and its paired `.pdf` only. This path is outside the repo and outside Anvien's indexed scope — do not run Anvien commands or `detect-changes` against it; it is not part of this plan's `anvien detect-changes --scope all` gate.
  - Out of scope: any repo source file (all source corrections happened in `P3`-`P9`); regenerating the `.pdf` is in scope only if the user confirms the existing PDF-generation toolchain for this document (not yet identified in this plan — confirm before assuming a specific tool).
  - Dependencies: `P3`-`P9` must be complete (or explicitly blocked with recorded evidence) before this phase starts, since every correction here must cite an evidence ID from an earlier phase.
- Phase Implementation Rule: do not implement `P10` directly. Implement `P10-A`, verify it, record evidence.
- Ordered Slice List:
  - P10-A: Apply the heading-level correction (3-tier to 2-tier) and the technical corrections, each cited to an evidence ID, and verify the `.docx`/`.pdf` stay textually consistent with each other afterward.

- [x] P10-A: Apply the heading-level correction (3-tier to 2-tier) and the technical corrections, each cited to an evidence ID, and verify the `.docx`/`.pdf` stay textually consistent with each other afterward.
  - Goal: the document's letterhead reads only `BỘ CÔNG AN` / `BỘ TƯ LỆNH CẢNH SÁT CƠ ĐỘNG` (2 tiers, per the user's earlier explicit instruction, dropping `TRUNG ĐOÀN CẢNH SÁT CƠ ĐỘNG SỐ 10`), and every technical claim this plan corrected (MASTER PASS→environment-gated login is not itself a document claim to change, but TLS 1.3, WebSocket/SSE wording, the NĐ144 fine-amount inconsistency, the Excel 4-sheet/`TAO_MOI` description, the Kalman Filter description, the Playwright file citations, Table 4.3's figures, and the "192 trạm" count) is corrected to match the real, evidenced state.
  - Scope Boundary:
    - Editable: `SOS_VIETNAM_2026.docx` text content (header/tiêu ngữ block; the sections already identified in the earlier document-review session: WebSocket/SSE wording, NĐ144 fine amount, Excel/`TAO_MOI` description, Kalman Filter description, Table 4.4's Playwright file names if they need adjusting to the final real file names, Table 4.3's figures, the "192 trạm" count).
    - Inspect-only: the `.pdf` counterpart, to confirm whether it is a separate hand-maintained file or a direct export of the `.docx` (if it is an export, regenerate it from the corrected `.docx` using whatever tool produced it originally; if it is hand-maintained separately, edit both and verify textual consistency as this slice's own acceptance check — do not assume one tool without confirming).
    - Preserve-only: this repo's own source files (no repo file is touched in this slice).
    - Out of scope: any content in the document this plan did not establish a gap for (e.g. unrelated narrative sections); do not rewrite sections beyond what P3-P9's evidence supports changing.
  - Non-Goals: not re-litigating or re-reviewing claims this plan did not scope (the earlier document-review session covered 17 claims total; only the ones this plan's P3-P9 actually built real behavior for get corrected here using real numbers — any other previously-flagged-but-out-of-scope claim stays as a known, separately-tracked gap, not silently "fixed" by rewording without new evidence).
  - Pre-flight Questions:
    - Data source: evidence IDs from `E3`-`E9` in this plan's `evidence.md`, plus the already-recorded `E0-P0A` document-review findings from the earlier session (WebSocket/SSE, NĐ144 amount, "192 trạm" baseline) referenced by whatever evidence-ID style that earlier session used, cross-referenced here for traceability.
    - Display permission: N/A (document editing, not application permission).
    - DB read flow: N/A.
    - DB write flow: N/A.
    - Render location: N/A (document, not application UI).
    - UI behavior flow: N/A.
    - Docker runtime: N/A for this slice (document editing does not need the application running, though the evidence it cites came from Docker-based measurement in earlier phases).
    - Playwright target: N/A.
    - Behavior test: a manual read-through confirming every changed sentence/number traces to a specific evidence ID, and that the `.docx` and `.pdf` say the same thing afterward (same check style used in this session's original 95.7%-similarity comparison).
    - Cleanup/quarantine: N/A (no test data).
    - External side effects: none (local file edits only).
    - N/A notes: this phase does not touch the repo, so the plan's `anvien detect-changes` gate and Docker/Playwright validation rules do not apply to it directly — only to `P3`-`P9`.
  - Work Steps:
    1. Edit the letterhead block to 2 tiers, and apply each technical correction, writing down which evidence ID justifies each specific sentence/number changed (e.g. "TLS 1.3 claim: now justified by `E4-P4A-TLS1`"; "192 trạm → <N>: justified by `E9-P9A-COUNT1`"; "WebSocket wording → SSE: justified by the original document-review session's SSE/WebSocket finding plus `server.js`'s continued `text/event-stream` usage, unchanged by this plan").
       - UI flow check: N/A.
       - DB/data flow check: N/A.
       - Render location check: N/A.
       - Mini QA for each completed implementation slice (MUST): re-extract text from both the corrected `.docx` and its `.pdf` counterpart (the same `python-docx`/`fitz` text-extraction approach already used earlier in this session) and re-run a similarity check between them, confirming they still agree closely (matching this session's earlier ~95.7% baseline methodology) — if the PDF was not regenerated, this check will reveal that and the slice is not complete until it is addressed.
       - Evidence target: `E10-P10A-DOC1` (list of changes with their justifying evidence IDs), `E10-P10A-CONSIST1` (docx/pdf consistency re-check result).
  - Implementation Gate:
    - Before editing target files, run the relevant Anvien impact/file-detail command for files, symbols, routes, tools, or contracts touched by this slice, and record the evidence IDs. N/A — this file is outside the repo and outside Anvien's scope; record `E10-P10A-FD1` as "out of repo, out of Anvien scope by design" instead of running a command against it.
    - Every edited sentence/number must have a cited evidence ID from `P3`-`P9` (or the earlier document-review session) before being written; do not edit based on memory of the earlier findings without re-confirming the exact current, final value (especially the account count, which may have shifted during `P6` testing).
  - Acceptance:
    - Source: N/A (not a repo change).
    - Runtime/UI: N/A.
    - DB/data: N/A.
    - Behavior test: `E10-P10A-CONSIST1` confirms the `.docx`/`.pdf` remain textually consistent after the edit.
    - Cleanup/quarantine: N/A.
    - Evidence IDs: `E10-P10A-DOC1`, `E10-P10A-CONSIST1`, `E10-P10A-FD1`.
    - Actual-status rows refreshed: all document-claim rows this plan touched move to final `correct`, each citing the evidence ID that made it true.
  - Evidence Targets: `E10-P10A-DOC1`, `E10-P10A-CONSIST1`, `E10-P10A-FD1`.
  - Actual-status Update: finalize all document-claim rows in Current Status Matrix.
  - Commit Boundary: no repo commit (file is outside the repo); note the completion in `evidence.md`'s Closure Evidence instead.

- [x] Pn-A: Call supervisor for the implemented-plan acceptance loop.
  - Goal: verify the completed plan work against the accepted plan, actual-status decisions, evidence, benchmark, changed files, generated output, and validation results before closure.
  - Work Steps:
    1. Call the supervisor skill to review the full completed plan work.
    2. If supervisor fails the work, return to the responsible implementation workflow/skill for the failed scope only.
    3. Re-run supervisor review after the fix.
    4. Repeat until supervisor passes or records a blocker.
  - Implementation Gate: all planned implementation phases must be completed or explicitly blocked before this review.
  - Acceptance: supervisor review passes, or the plan records a blocker with evidence and no closure is performed.
- [x] Pn-B: Remove dead work created during this plan.
  - Goal: ensure the final diff contains only artifacts that still serve the accepted plan.
  - Work Steps:
    1. Review files, sections, generated output, tests, temp files, and plan artifacts created or modified during this plan.
    2. Remove or rewrite any artifact made obsolete by actual-status findings, user corrections, failed approaches, or phase status updates.
    3. Verify no rejected approach, stale placeholder, unused generated output, or dead helper artifact remains in the final diff.
    4. Call supervisor to review the dead-work cleanup.
    5. If supervisor fails the cleanup, return to the responsible implementation workflow/skill for the failed cleanup scope only, then re-run supervisor review.
  - Implementation Gate: only remove artifacts created by this plan unless the user explicitly approves broader cleanup.
  - Acceptance: final `git diff/status` contains no dead plan-created artifacts, supervisor passes the cleanup, and evidence records what was removed or preserved.
- [x] Pn-C: Close the plan.
  - Goal: finish validation, evidence, benchmark, detect-changes, commit, and final status.
  - Work Steps:
    1. Run the required final validation for the accepted scope, including full build before final runtime validation. For app/runtime scopes, full build must include Docker image/container build.
    2. Start the real built Docker/container runtime for app/runtime validation. If Docker cannot be built or started, record the blocker and do not substitute a host dev server.
    3. Validate public runtime or UI-facing changes with browser or Playwright evidence against the real built Docker/container runtime. Playwright evidence must include Docker build/run or compose command, container/service name, exposed URL, Playwright command, and screenshot/trace/result.
    4. Regenerate generated outputs if source-of-truth changes require it.
    5. Run Anvien detect-changes before commit when implementation work was performed.
    6. Record final validation, detect-changes, benchmark, and commit evidence.
    7. Commit the completed scope and verify the worktree state.
  - Implementation Gate: Pn-A and Pn-B must pass or record blockers.
  - Acceptance: final evidence is recorded, required commits exist, and the worktree state is known.

## Risk Notes

- `server.js` is flagged `risk: high` by Anvien (33 outbound relationships, 209 local relationships, 4613 unresolved references) — this is a scope warning per repo rules, not a block; P2-A keeps the edit surgically scoped to the signal-handler payload fields to avoid disturbing the rest of this large file.
- `js/dispatcher.js` is not currently parsed into the Anvien graph (file too large / parse gap). All dispatcher-side slices (P1-A's third call site, P2-C) must use manual `Grep`/`Read` verification immediately before editing instead of relying on `anvien impact`, and must re-confirm exact line numbers at edit time since no graph-backed drift detection is available for this file.
- Public OSRM demo server (`router.project-osrm.org`) has no real motorbike profile; P1's fix is honest styling/profile-parameter correctness, not a geometrically different motorbike-specific path. If the user later wants true motorbike-specific paths (shortcuts, one-way exemptions), that requires a new routing-backend decision outside this plan.
- WebRTC NAT traversal: this plan uses public STUN only. If field deployment (e.g. dispatchers and citizens both behind restrictive NATs/firewalls) prevents direct peer connection, calls may still fail to connect even with correct code; a TURN server would be the next step and is explicitly out of scope — must be flagged to the user as a possible follow-up need observed during P2-C live testing, not silently absorbed.
- The dispatcher account credentials come from `D:\DOWNLOAD\DanhSach_TaiKhoan_PhanQuyen_DonVi_2026-09-17.xlsx`, a file outside the repo containing real-looking operational credentials (usernames/passwords for police units). Treat this file as sensitive: do not copy its full contents into any committed plan/evidence file; reference only the specific account(s) actually used for validation (e.g. "admin / national level" or "capcaikhect / ward level, Cần Thơ"), and avoid echoing the password value verbatim in evidence files that will be committed to the repo — reference it as "the ward-level password from the provided account sheet" instead.
- Video call shares the missing-RTCPeerConnection defect but is explicitly out of this plan's required scope; flagging it now so it is not mistaken for "already fixed" after P2 lands.
- The MASTER PASS restriction (`P3`) only closes the gap for *this* code path; if any other endpoint or script independently re-implements a similar universal-bypass check (not found in this session's review, but `server.js` is large and `risk: high`), it would not be covered by `P3`'s narrow edit — flag this if discovered later rather than assuming `P3` closed every possible bypass.
- `P4`'s TLS 1.3 proof uses a self-signed certificate because no public domain is available in this environment; this is an accepted, explicitly-flagged gap, not a silent substitution — a real deployment needs real DNS + Let's Encrypt (or an equivalent CA) before the document's TLS 1.3 claim is true in production, not just in this plan's local validation.
- `P6`'s action-column "create" value set is a small, documented normalization list (e.g. `TAO_MOI` and close variants); if a future Excel template uses a different phrase, rows will be correctly skipped-and-reported rather than silently misclassified, but the recognized-value list itself may need extending later — this is intentional conservatism, not a bug, but should be flagged if it surfaces in real admin usage.
- `P7`'s Kalman filter is validated with a synthetic noise test, not a real-device field test (consistent with the user's decision not to do field measurement); the filter's real-world behavior on actual noisy GPS hardware is not independently proven by this plan beyond the statistical synthetic-sequence proof.
- `P9`'s performance figures are measured against this machine's Docker Compose stack, not the document's originally-claimed Cần Thơ field conditions (network, device diversity, real GPS hardware); this is an explicit, accepted scope reduction per the user's decision, not a claim of field-equivalent conditions.
- `P10` depends on `P3`-`P9` being complete (or explicitly blocked) first, since every document correction must cite a real evidence ID; if any of `P3`-`P9` ends up blocked, `P10` must only correct the claims that *did* get resolved and must leave the blocked ones flagged as a known, still-open gap in the document rather than writing a number that was never actually proven.
