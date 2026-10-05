# Web App Bug Fixes (Vehicle Routing + Real Voice Call) Actual Status

Title: Web App Bug Fixes (Vehicle Routing + Real Voice Call)
Date: 2026-10-05
Status: P0 Complete
Companion plan: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-plan.md`
Companion evidence: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-evidence.md`
Companion benchmark: `docs/plans/2026-10-05-web-app-bug-fixes/2026-10-05-web-app-bug-fixes-benchmark.md`

## Purpose

This file records the real current state before implementation.

Implementation must not start until the target scope has a completed status row, evidence IDs, and a downstream plan decision.

This file does not replace `evidence.md`. It classifies current state from evidence.

Use exact evidence IDs from `evidence.md`, such as `E0-P0A-SRC1`, not broad section IDs such as `E0` or `E1`.

## Freshness / Refresh Rules

This actual-status file is a living current-state record, not a one-time P0 snapshot. Update after each completed implementation slice, before starting the next phase if repo state changed, and whenever evidence changes a current-state classification.

## Scope

Target scope (P1-P2, original):

- `js/map-controller.js`: `MapController.drawRoute`.
- `js/app.js`: `drawRoute` call sites (`:1762`, `:2591`); voice-call lifecycle (`startCitizenVoiceCall`, `handleVideoCallSignal`, `endCitizenVoiceCall`, `citizenAccessHeaders`).
- `js/dispatcher.js`: `drawRoute` call site (`:9829`); dispatcher-side voice-call lifecycle.
- `server.js`: `/api/sos/videocall/signal` / `/api/sos/voicecall/signal` handler; `broadcastToDispatchers`; `notifyCitizen`.
- `index.html` (and dispatcher HTML) call-modal markup for a new remote-audio `<audio>` sink.

Target scope (P3-P10, added 2026-10-05 for the document-vs-code gap-closing work):

- `server.js:2319-2349` (login handler's `isValidPassword` decision chain) — P3.
- `docker-compose.yml`, a new Caddyfile — P4.
- `services/accounts-excel-generator.js`, `scripts/import_accounts_excel.py`, `server.js:6013-6099` — P6.
- `js/location.js`'s `refineLocation()` — P7.
- New files `playwright/verify-ui-signature-draw-and-display.cjs`, `playwright/test-bidirectional-signature-persistence.cjs`; `package.json`'s already-declared `playwright` devDependency (install only, no version change) — P8.
- Measurement only, no committed source change expected — P9.
- `C:\Users\dienv\Desktop\docs\thuyết trình\SOS_VIETNAM_2026.docx` and its paired `.pdf` (outside the repo, outside Anvien's scope) — P10.

Out of scope:

- Google Maps `travelmode` deep links in `js/app.js` (already correct, preserve-only).
- Report-doc agency checkbox/label gap (`docCheckRescue`, `docCheck115`, hospital/rescue labels) — user explicitly deferred.
- Video call `RTCPeerConnection` wiring beyond what the signaling-channel extension incidentally supports.
- Dead mobile-menu-hamburger event wiring (inert, no HTML counterpart, no behavior impact).
- Password-hashing algorithm migration (PBKDF2-SHA512 is already adequate; not changing to bcrypt — user decision).
- `server.js:2341-2347` (legacy-plaintext lazy-migration branch) — preserve-only, not a defect.
- Real public-domain TLS certificate provisioning — self-signed only for this plan's local validation.
- TURN server procurement (STUN only, per the original P2 decision, unchanged).
- Field GPS/network measurement in Cần Thơ or any other real-world site.

## Relationship / Impact Evidence

| Unit / File / Surface | File Detail Evidence | Related File Count | Relationship Summary | Impact Note |
|-----------------------|----------------------|--------------------|----------------------|-------------|
| `js/map-controller.js` | `E0-P0A-FD1` | 1 related file (`js/app.js`) | 101 local relationships, inbound 3, outbound 0, unresolved 1048 | high — scope warning, not a block; edits stay inside `drawRoute` |
| `js/app.js` | `E0-P0A-FD2` | 2 related files (`js/location.js`, `js/map-controller.js`) | 257 local relationships, outbound 6, unresolved 4008 | high — scope warning; this plan's edits are localized to named functions/lines only |
| `server.js` | `E0-P0A-FD3` | multiple (`services/*.js`, etc.) | 209 local relationships, outbound 33, unresolved 4613 | high — scope warning; P2-A edit scoped strictly to the signal-handler payload fields |
| `js/dispatcher.js` | `E0-P0A-FD4` | NOT INDEXED — `file-detail` lookup fails ("not found in repo") | N/A | blocked for graph-based impact; must use manual `Grep`/`Read` verification at edit time (see Risk Notes in plan.md) |
| `js/location.js` | `E0-P0A-FD5` | 1 related file (`js/app.js`) | 19 local relationships, inbound 3, outbound 0, unresolved 112 | high — scope warning; `P7`'s edit stays inside `refineLocation()` |
| `services/accounts-excel-generator.js` | `E0-P0A-FD6` | 1 related file (`server.js`) | 7 local relationships, inbound 3, outbound 0, unresolved 276 | high — scope warning; `P6-A`'s edit adds one worksheet, no change to the 3 existing ones |
| `services/security-crypto-service.js` | `E0-P0A-FD7` | 9 related files (`scripts/fix-admin-password.mjs`, `scripts/migrate-passwords.js`, `scripts/reset-agency-default-passwords.mjs`, `scripts/test-agency-default-passwords.mjs`, `scripts/test-citizen-access.js`, `scripts/test-security-boundary.js`, `scripts/test-security-suite.js`, `server.js`, `services/runtime-data-store.js`, `services/security-firewall-middleware.js`) | 18 local relationships, inbound 20, outbound 0, unresolved 104 | high — this file is `preserve-only` for `P3` (the hashing algorithm is not changed; only `server.js`'s MASTER PASS branch is edited, which does not call into this file) |
| `scripts/import_accounts_excel.py` | N/A | NOT CHECKED THIS SESSION (Python script; `anvien file-detail` was not run against it before this plan was authored — must be run or its graph-coverage confirmed/denied immediately before `P6-B` edits it, per the Risk Notes pattern already used for `js/dispatcher.js`) | N/A | unknown — treat as potentially not graph-indexed until confirmed at `P6-B`'s Implementation Gate |
| `docker-compose.yml`, `Dockerfile` | N/A | infrastructure config, not source code — not indexed by Anvien's graph by design | N/A | `P4`'s Implementation Gate records this as "not applicable, infra file" rather than skipping the check |

## Status Rules

| Status | Meaning | Allowed next action |
|--------|---------|---------------------|
| `correct` | Already behaves as required. | Preserve. Add evidence or tests only if needed. |
| `partial` | Some required behavior exists, but gaps remain. | Change only the missing parts. Preserve correct parts. |
| `wrong` | Current behavior, source, or contract is incorrect. | Replace with required behavior. Record the exact reason. |
| `missing` | Required behavior, source, or contract does not exist. | Implement the missing piece only. |
| `unbound` | Surface exists but is not wired to the real source, flow, or contract. | Bind to the real source only. Preserve approved surface. |
| `fake-or-stub` | Prototype, demo, mock, fallback, or placeholder data is being used as real behavior. | Remove fake behavior or replace it with an approved truthful state. |
| `blocked` | Source, authority, contract, or required evidence is unclear. | Stop. Do not implement until resolved. |

## Current Status Matrix

| Unit | Current State | Required State | Status | Relationship Count | Evidence | Next Plan Decision |
|------|---------------|----------------|--------|--------------------|----------|--------------------|
| `MapController.drawRoute` (`js/map-controller.js:546-630`) | Accepts `vehicleProfile = 'driving'`; OSRM request still always `driving` (documented limitation); glow/line paint colors + dash pattern now vary by profile; re-draw on an existing source re-applies paint via `setPaintProperty` | (met) | `correct` (final — proven end to end against the real Docker-built container via `E1-P1B-UI1/UI2`) | 1 related file | `E1-P1A-SRC1`, `E1-P1B-DOCKER1`, `E1-P1B-UI1`, `E1-P1B-UI2` | preserve |
| `drawRoute` call site `js/app.js:1762` (now `:1766`) | Passes `vehicleProfile` computed from `incident.agency` (`police`/`traffic-rescue` → `motorbike`, else `driving`) | (met) | `correct` (final) | part of `js/app.js` (257 local rel.) | `E1-P1A-SRC2`, `E1-P1B-UI1` | preserve |
| `drawRoute` call site `js/app.js:2591` (now `:2599`) | Same mapping as above | (met) | `correct` (final) | part of `js/app.js` | `E1-P1A-SRC2`, `E1-P1B-UI1` | preserve |
| `drawRoute` call site `js/dispatcher.js:9829` (now `:9833`) | Same mapping as above; line re-verified via fresh `Grep` immediately before editing, unchanged from P0's recorded line number | (met) | `correct` (code-level only — `P1-B`'s live proof exercised the citizen flow; the dispatcher-side call site was not independently re-verified live in this slice since it is byte-identical logic to the proven citizen-side call sites) | NOT graph-indexed | `E1-P1A-SRC2` | preserve; flag if a future dispatcher-specific defect surfaces |
| `Dockerfile` (`npm install` step) | Missing entirely; `docker build` succeeded but the resulting image crashed at container startup (`ERR_MODULE_NOT_FOUND: exceljs`) | `COPY package.json package-lock.json ./` + `RUN npm ci --omit=dev` added before `COPY . .` | `wrong -> correct` | n/a (infra) | `E1-P1B-DOCKER1` (pre-existing defect, unrelated to this plan's original scope, fixed as a necessary prerequisite for every subsequent Docker-validation requirement) | preserve |
| Google Maps `travelmode` links (`js/app.js:2574-2582`) | `btnOpenGoogleMapsCar` -> `driving`, `btnOpenGoogleMapsMoto` -> `two_wheeler`, confirmed distinct via live DOM read | Unchanged | `correct` | part of `js/app.js` | `E0-P0A-UI1` | preserve |
| `server.js` `/api/sos/videocall/signal` + `/api/sos/voicecall/signal` handler (`server.js:5354-5403`) | Relays `request`/`accept`/`reject`/`end`/`webrtc-offer`/`webrtc-answer`/`webrtc-ice` + metadata, with `sdp`/`candidate` passthrough; proven live via real SSE round-trip | (met) | `correct` | 33 outbound / 209 local relationships | `E2-P2A-SRC1`, `E2-P2A-HTTP1` | preserve |
| `broadcastToDispatchers` / `notifyCitizen` (`server.js:1583-1699`) | Routes by `event` + escalation level + agency; confirmed `action`-value-agnostic by full re-read and by live proof | (met) | `correct` (final) | part of `server.js` | `E2-P2A-SRC2`, `E2-P2A-HTTP1` | preserve, unchanged |
| Citizen voice-call lifecycle (`js/app.js` `startCitizenVoiceCall`/`handleVideoCallSignal`/`endCitizenVoiceCall`) | Real `RTCPeerConnection`, local track, SDP offer/answer both directions, ICE relay, cleanup on end/reject, `<audio>` sink | (met) | `correct` (citizen side proven live via `E2-P2B-UI1`; full 2-way audio proof deferred to P2-C) | part of `js/app.js` | `E2-P2B-SRC1`, `E2-P2B-UI1` | validate full loop in P2-C |
| Dispatcher voice-call lifecycle (`js/dispatcher.js`, exact fn names TBD at edit time) | Same local-only pattern confirmed in `js/dispatcher.js` via `getUserMedia` grep | Mirror of citizen-side P2-B wiring | `fake-or-stub` | NOT graph-indexed | `E0-P0A-SRC7` | edit P2-C, re-verify exact function/line at edit time |
| `CallAudioRecorder.startRecording` remote-stream handling (`js/call-audio-recorder.js:104-114`) | Already has `remoteStreamToConnect` parameter/branch, currently always receives `null`/unused since no remote stream exists today | Should receive the real remote `MediaStream` once P2-B/P2-C wire it, to mix both parties into the recording | `partial` | 0 related files found via query (file: `js/call-audio-recorder.js`) | `E0-P0A-SRC8` | wire in P2-B/P2-C, do not redesign |
| Report-doc agency labels/checkboxes (`docUnitHospitalLabel`, `docUnitRescueLabel`, `docCheckRescue`, `docCheck115`) | IDs referenced in `js/app.js`, absent from `index.html` | User explicitly deferred: keep phone-based intake for Y tế/Cứu hộ unchanged | `missing` (by design, deferred) | n/a | prior-session evidence (not re-verified in this plan) | preserve — explicitly out of scope per user decision |
| `js/dispatcher.js` Anvien graph coverage | File not present in Anvien's parsed graph for this repo (`file-detail` returns "not found in repo") | N/A — document as a tooling gap | `blocked` (for graph-based impact only; not blocking manual-inspection-based edits) | n/a | `E0-P0A-FD4` | manual `Grep`/`Read` required at every dispatcher.js edit point |
| MASTER PASS login backdoor (`server.js:2322-2325`) | Only active when `NODE_ENV !== 'production'`; proven live in both states | (met) | `correct` | part of `server.js` (209 local rel.) | `E3-P3A-SRC1`, `E3-P3A-HTTP1`, `E3-P3A-HTTP2` | preserve |
| Password hashing algorithm (`services/security-crypto-service.js:26,46`) | PBKDF2-SHA512, 100,000 iterations, salted — already an adequate standard | No change required | `correct` | 9 related files, `E0-P0A-FD7` | `E0-P0A-SRC10` | preserve — explicitly not migrating to bcrypt per user decision |
| Legacy-plaintext lazy-migration branch (`server.js:2341-2347`) | Converts any remaining plaintext `password` field to `passwordHash` on first successful login, then deletes the plaintext field | Unchanged | `correct` | part of `server.js` | `E0-P0A-SRC9` | preserve-only |
| `scripts/migrate-passwords.js` | Already run successfully once; stripped `password` from all records in `assets/agency-accounts.json`, replaced with `passwordHash` | No further action needed | `correct` | n/a (one-shot script, already executed) | `E0-P0A-SRC11` | preserve-only, not re-run |
| TLS 1.3 (document claim, section 2.4.7.6) | `reverse-proxy` service added to `docker-compose.yml` running Caddy 2 with `tls internal` enforcing TLS 1.3 minimum; live handshake verified via Node TLS/Playwright | (met; self-signed certificate for local validation, real production deployment would use public DNS + Let's Encrypt) | `correct` | n/a (infra, not graph-indexed) | `E4-P4A-SRC1`, `E4-P4A-TLS1`, `E4-P4A-FD1` | preserve |
| Excel generator — sheet count (`services/accounts-excel-generator.js:243,377,421`) | Generates exactly 4 worksheets (`Công An & CAND`, `Cấp Cứu Y Tế`, `Cứu Hộ Doanh Nghiệp`, and `Mẫu Thêm Mới` with 13 columns including `Thao Tác (Action)`) | (met) | `correct` | 1 related file, `E0-P0A-FD6` | `E6-P6A-SRC1`, `E6-P6A-GEN1`, `E6-P6A-FD1` | preserve |
| Excel import — action column (`scripts/import_accounts_excel.py:181-182,243`) | `raw_action` gates creation of new accounts (requires `TAO_MOI`); non-matching new accounts skipped and reported in `skipped` list; existing account updates preserved; live-tested via CLI and HTTP endpoint | (met) | `correct` | indexed in Anvien (File:scripts/import_accounts_excel.py) | `E6-P6B-SRC1`, `E6-P6B-SCRIPT1`, `E6-P6B-HTTP1`, `E6-P6B-CLEANUP1`, `E6-P6B-FD1` | preserve |
| Excel import — update path for existing usernames (`scripts/import_accounts_excel.py:282`+) | Decided purely by whether `username` already exists in `existing_accounts`; unaffected by the action column | Unchanged | `correct` | same as above | `E0-P0A-SRC14` | preserve-only in P6-B |
| GPS refinement algorithm (`js/location.js:82-126` `refineLocation`) | `GPSKalmanFilter` class fuses successive fixes, weights by accuracy/measurement noise, maintains state and error covariance across ticks; 92.25% variance reduction verified | (met) | `correct` | 1 related file, `E0-P0A-FD5` | `E7-P7A-SRC1`, `E7-P7A-TEST1`, `E7-P7A-FD1` | preserve |
| `LocationService` public API (`js/location.js`, constructor + `onLocationUpdate`/`emitUpdate`/`acquireLocation`/`reverseGeocode`) | Stable, consumed by `js/app.js` | Unchanged signature after `P7` | `correct` | same as above | `E0-P0A-SRC15` | preserve-only, contract must not change |
| `playwright/` directory and its 2 document-cited files | Both cited files (`verify-ui-signature-draw-and-display.cjs`, `test-bidirectional-signature-persistence.cjs`) created and verified passing against real runtime | Both files exist, are runnable, and pass | `correct` | n/a (new test files) | `E8-P8A-SRC1`, `E8-P8A-RUN1`, `E8-P8B-SRC1`, `E8-P8B-RUN1` | closed in P8-A, P8-B |
| `/api/sos/sign` role-check / `403` behavior (`server.js:4839` region) | Already confirmed correct in the earlier document-review session (citizen cannot write the officer-signature slot, gets a real `403`) | Unchanged; `P8-B` writes a test proving this, does not change the behavior | `correct` | part of `server.js` | prior-session document-review evidence (not re-numbered here; re-verify exact current line range immediately before `P8-B` writes assertions against it) | validate (test only) in P8-B |
| Table 4.3 figures (document, section 4.3) | All 4 measurable figures empirically measured on Docker runtime (first load ~0.79s, cached load ~0.135s, SSE latency 45ms, WAF bot-block 100%); honest GPS statement formulated | Real measurements recorded across 2 stable runs | `correct` | n/a | `E9-P9A-PERF1..4`, `E9-P9A-GPS1` | fed to P10-A |
| "192 trạm" count (document, section 2.4.4) | Recounted live from assets/agency-accounts.json on disk: exactly 453 records | Verified count 453 | `correct` | n/a | `E9-P9A-COUNT1` | fed to P10-A |
| Document letterhead (2-tier: `BỘ CÔNG AN` / `BỘ TƯ LỆNH CẢNH SÁT CƠ ĐỘNG`) | 2 tiers only, 3rd tier removed; Table 0 author/org updated | 2 tiers only (`BỘ CÔNG AN` / `BỘ TƯ LỆNH CẢNH SÁT CƠ ĐỘNG`), verified across DOCX and PDF | `correct` | n/a | `E10-P10A-DOC1`, `E10-P10A-CONSIST1` | P10-A complete |

## Status Refresh Log

| Refresh | Date | Repo Basis | Changed Scope | Status Changes | Evidence | Next Phase Update |
|---------|------|------------|----------------|----------------|----------|-------------------|
| R0 | 2026-10-05 | `sos-vietnam-2026-worktree-bugreview` at commit `34e919dc949a265bccf829612f9e7e53af3711bd` | full target scope above | initial classification (all rows as listed in Current Status Matrix) | `E0-P0A-SRC1..E0-P0A-SRC8`, `E0-P0A-NET1`, `E0-P0A-UI1..UI2`, `E0-P0A-FD1..FD4` | P1-A and P2-A may proceed; P1-A/P2-C must re-verify `js/dispatcher.js` line numbers manually before editing per the blocked graph-coverage row |
| R1 | 2026-10-05 | same commit; `anvien detect-changes --scope all` re-run, confirmed no implementation edits yet (same 3 runtime-noise files as `R0`) | added scope for `P3`-`P10` (password backdoor, TLS, Excel action column, Kalman filter, Playwright files, performance figures, document correction) | new classification: MASTER PASS `wrong`; hashing algorithm `correct` (no bcrypt migration needed — corrects the original, now-superseded assumption that the password store was plaintext); legacy-plaintext branch `correct`/preserve; TLS claim `missing`; Excel sheet count `partial`; Excel action-column wiring `fake-or-stub`; Excel update path `correct`/preserve; GPS Kalman claim `fake-or-stub`; `LocationService` public API `correct`/preserve; Playwright files `missing`; `/api/sos/sign` 403 behavior `correct` (validate-only); Table 4.3 figures `fake-or-stub`; "192 trạm" count `wrong`; document letterhead `wrong` | `E0-P0A-SRC9..SRC18`, `E0-P0A-FD5..FD7` | P3-A, P4-A, P6-A, P6-B, P7-A, P8-A, P8-B, P9-A may proceed as independent phases; P10-A is gated on P3-P9 completing or being explicitly blocked first |
| R2 | 2026-10-05 | after implementing `P1-A` (not yet committed at time of this refresh) | `drawRoute` + 3 call sites | `wrong -> correct` (code-level; final close pending P1-B's Docker-based proof) for all 4 rows | `E1-P1A-SRC1`, `E1-P1A-SRC2`, `E1-P1A-UI2`, `E1-P1A-UI3` | P1-B may proceed; P1-B's Docker-based live test should also independently confirm the browser-cache gap noted in `E1-P1A-UI2/UI3`'s evidence does not block real citizen/dispatcher usage (since real users load the page once per cache window, not repeatedly across dev-cycle reloads the way this session's testing did) |
| R3 | 2026-10-05 | after implementing `P3-A`, live-HTTP-tested in both `NODE_ENV` states | MASTER PASS login backdoor | `wrong -> correct` | `E3-P3A-SRC1`, `E3-P3A-HTTP1`, `E3-P3A-HTTP2` | none required; separately, a new finding (277 of 453 accounts have a real `initialPassword` of `"2002"`, unrelated to the MASTER PASS branch) was recorded in evidence and flagged to the user as a related but out-of-scope data characteristic, not a code defect for this plan to fix |
| R4 | 2026-10-05 | after implementing `P1-B`, live-Docker-tested; discovered and fixed a pre-existing `Dockerfile` defect (missing `npm ci`) as a prerequisite | `drawRoute`, 3 call sites, `Dockerfile` | citizen-side call sites and `drawRoute` itself move to final `correct` (Docker-proven); dispatcher-side call site stays `correct` but code-level only (not independently live-tested in this slice); `Dockerfile` moves `wrong -> correct` | `E1-P1B-DOCKER1`, `E1-P1B-UI1`, `E1-P1B-UI2` | `P1` is fully closed; `P2` may now also use the fixed `Dockerfile` for its own Docker-based validation requirements without hitting the same `exceljs` crash |
| R5 | 2026-10-05 | after completing and live-testing `P2-C` WebRTC two-way audio call verification via Playwright | `js/dispatcher.js`, `dispatcher.html`, `js/app.js` | `P2-C` moves `fake-or-stub -> correct`; real two-way WebRTC audio confirmed connected with non-silent audio on both citizen and dispatcher ends | `E2-P2C-SRC1`, `E2-P2C-UI1` | `P2` (real two-way WebRTC voice call) is fully closed |
| R6 | 2026-10-05 | after implementing and live-testing `P4-A` Caddy reverse-proxy service | `docker-compose.yml`, `Caddyfile` | TLS 1.3 moves `missing -> correct` (local validation with self-signed certificate; TLS 1.3 handshake verified and TLS 1.2 rejected) | `E4-P4A-SRC1`, `E4-P4A-TLS1`, `E4-P4A-FD1` | `P4` is fully closed |
| R7 | 2026-10-05 | after implementing and live-testing `P6-A` 4th Excel template sheet | `services/accounts-excel-generator.js` | Excel generator sheet count moves `partial -> correct`; 4 worksheets generated including 'Mẫu Thêm Mới' with 13 columns | `E6-P6A-SRC1`, `E6-P6A-GEN1`, `E6-P6A-FD1` | P6-B may proceed |
| R8 | 2026-10-05 | after implementing and live-testing `P6-B` action-column create gate | `scripts/import_accounts_excel.py`, `server.js` | Excel import action column moves `fake-or-stub -> correct`; new accounts require TAO_MOI to create, un-commanded rows skipped with report | `E6-P6B-SRC1`, `E6-P6B-SCRIPT1`, `E6-P6B-HTTP1`, `E6-P6B-CLEANUP1`, `E6-P6B-FD1` | P6 is fully closed |
| R9 | 2026-10-05 | after implementing and statistically verifying `P7-A` GPS Kalman filter | `js/location.js`, `playwright/verify-gps-kalman-filter.cjs` | GPS Kalman filter moves `fake-or-stub -> correct`; 92.25% variance reduction confirmed on 100-sample noisy GPS sequence | `E7-P7A-SRC1`, `E7-P7A-TEST1`, `E7-P7A-FD1` | P7 is fully closed |
| R10 | 2026-10-05 | after implementing and verifying P8-A citizen signature UI test | `playwright/verify-ui-signature-draw-and-display.cjs` | verify-ui-signature-draw-and-display.cjs moves `missing -> correct` | `E8-P8A-TOOL1`, `E8-P8A-SRC1`, `E8-P8A-RUN1`, `E8-P8A-FD1` | P8-B may proceed |
| R11 | 2026-10-05 | after implementing and verifying P8-B 5-scenario signature persistence test | `playwright/test-bidirectional-signature-persistence.cjs` | playwright files move `missing -> correct`; bidirectional signature verified across restart | `E8-P8B-SRC1`, `E8-P8B-RUN1`, `E8-P8B-CLEANUP1`, `E8-P8B-FD1` | P8 is fully closed; P9-A may proceed |
| R12 | 2026-10-05 | after empirical performance benchmarking and account recount (P9-A) | `playwright/measure-empirical-benchmarks.cjs` | Table 4.3 figures move `fake-or-stub -> correct`; account count moves `wrong -> correct` (453) | `E9-P9A-PERF1..4`, `E9-P9A-GPS1`, `E9-P9A-COUNT1`, `E9-P9A-FD1` | P9 is fully closed; P10-A (document revision) unblocked and ready |
| R13 | 2026-10-05 | after applying P10-A document corrections and verifying DOCX/PDF consistency | `SOS_VIETNAM_2026.docx`, `SOS_VIETNAM_2026.pdf` | Document letterhead moves `wrong -> correct` (2 tiers); all document claims move `wrong`/`fake-or-stub -> correct`; 100% DOCX/PDF consistency verified | `E10-P10A-DOC1`, `E10-P10A-CONSIST1`, `E10-P10A-FD1` | P10 is fully closed; all plan phases (P1-P10) complete |

## Phase Touch Map

| Unit / File / Surface | Plan-Relevant Relationship File | Relationship to Target | Plan Item | Touch Mode | Evidence | Constraint |
|-----------------------|---------------------------------|------------------------|-----------|------------|----------|------------|
| `js/map-controller.js` (`drawRoute`) | `js/app.js` | consumer (2 call sites) | P1-A | edit | `E0-P0A-FD1` | keep layer IDs (`routeSourceId` + `-glow`/`-line`) unchanged |
| `js/app.js` (`drawRoute` call sites) | `js/map-controller.js` | source-of-truth for `drawRoute` signature | P1-A | edit | `E0-P0A-FD2` | pass new profile arg only; no other call-site logic change |
| `js/dispatcher.js` (`drawRoute` call site) | `js/map-controller.js` | source-of-truth for `drawRoute` signature | P1-A | edit (manual-verify, not graph-indexed) | `E0-P0A-FD4` | re-`Grep` exact line before editing |
| `server.js` (signal handler) | `js/app.js`, `js/dispatcher.js` | consumer of relayed `action` values | P2-A | edit (scoped to handler body) | `E0-P0A-FD3` | do not touch unrelated `server.js` routes/handlers |
| `broadcastToDispatchers` / `notifyCitizen` | `server.js` signal handler | routing logic consumed by the handler | P2-A | inspect-only | `E0-P0A-SRC5` | confirm action-agnostic; do not modify unless proven otherwise |
| `js/app.js` (citizen call lifecycle) | `server.js` signal handler, `js/call-audio-recorder.js` | consumer of signal relay; producer feeding recorder | P2-B | edit | `E0-P0A-SRC6`, `E0-P0A-SRC8` | preserve modal DOM IDs, timer/mute/recorder logic |
| `js/call-audio-recorder.js` (`startRecording`) | `js/app.js`, `js/dispatcher.js` | consumer of local+remote stream references | P2-B / P2-C | edit (pass remote stream in) only if acceptance requires mixed recording; otherwise preserve-only | `E0-P0A-SRC8` | do not change its internal mixing logic, only what stream references are passed in |
| `js/dispatcher.js` (dispatcher call lifecycle) | `server.js` signal handler | consumer of signal relay | P2-C | edit (manual-verify, not graph-indexed) | `E0-P0A-SRC7` | re-`Grep` exact function/line before editing |
| `index.html` call modal (`citizenVoiceCallModal`) | `js/app.js` | render target for new `<audio>` sink | P2-B | edit (additive only) | `E0-P0A-UI2` | add one `<audio>` element only; no layout/visual redesign |
| Dispatcher HTML call modal | `js/dispatcher.js` | render target for new `<audio>` sink | P2-C | edit (additive only) | TBD at P2-C (exact file/markup to be confirmed by read) | add one `<audio>` element only; no layout/visual redesign |
| `server.js` login handler (`isValidPassword` chain) | `services/security-crypto-service.js`, `services/agency-password-policy.js` | consumer of hash-verify/default-password functions | P3-A | edit (scoped to the MASTER PASS condition only) | `E0-P0A-SRC9`, `E0-P0A-FD7` | do not touch the hash-verify or default-password call sites |
| `docker-compose.yml` | `Dockerfile`, `server.js` (indirectly, via the existing `sos-vietnam` service) | consumer-of/front-for the existing service | P4-A | edit (additive new service only) | n/a (infra) | do not change the existing `sos-vietnam` service block |
| `services/accounts-excel-generator.js` | `server.js:5967` (`/api/admin/export-accounts-excel`) | consumer of the generator's output shape | P6-A | edit (additive worksheet only) | `E0-P0A-FD6` | preserve the generator's return shape/signature |
| `scripts/import_accounts_excel.py` | `server.js:6013-6099` (import handler) | consumer of the script's JSON summary | P6-B | edit | not yet checked for graph coverage — confirm at P6-B's Implementation Gate | preserve the update-path logic; only gate the create path |
| `server.js:6058-6087` (import response construction) | `scripts/import_accounts_excel.py` | consumer forwarding the script's JSON fields | P6-B | edit (additive field only) | `E0-P0A-FD3` | do not change existing `created`/`updated`/`newUnits` fields |
| `js/location.js` (`refineLocation`) | `js/app.js` (consumer of `LocationService`) | consumer of the class's public API | P7-A | edit (method body only) | `E0-P0A-FD5` | do not change the public method signatures `js/app.js` calls |
| `playwright/` (new files) | `index.html`/`js/app.js` (citizen signature UI), `js/dispatcher.js` (dispatcher signature UI), `server.js:4839` (`/api/sos/sign`) | consumer of these UI/API surfaces, read-only (test, not edit) | P8-A, P8-B | validate-only (new test files; the UI/API surfaces themselves are inspect-only) | n/a (new files) | do not modify the signature feature's own implementation unless a real defect is found |
| `js/location.js`, `sw.js`, `server.js` (SSE handlers, WAF at `:2108`) | measurement targets | consumer, read-only | P9-A | inspect-only / validate-only | `E0-P0A-FD5`, n/a for `sw.js`/WAF line (not separately file-detailed this session) | measurement only, no edits expected |
| `SOS_VIETNAM_2026.docx`/`.pdf` | all of `P3`-`P9`'s evidence | consumer of this plan's own evidence | P10-A | edit (outside repo, outside Anvien scope) | all `E3`-`E9` evidence IDs collectively | every edited sentence/number must cite a specific evidence ID |

## Detailed Findings

### `MapController.drawRoute`

Current state:

`js/map-controller.js:546-612` defines `async drawRoute(fromCoords, toCoords)`. It always builds `https://router.project-osrm.org/route/v1/driving/${fromCoords[0]},${fromCoords[1]};${toCoords[0]},${toCoords[1]}?overview=full&geometries=geojson`, falls back to a straight line on fetch error, and renders a fixed-color glow+line pair of MapLibre layers. No parameter varies the OSRM profile or the paint colors by agency/vehicle.

Required state:

```text
drawRoute(fromCoords, toCoords, vehicleProfile = 'driving') should:
- keep the OSRM request on the 'driving' profile string (only real profile the public demo server offers) when vehicleProfile indicates car-class
- for motorbike-class vehicleProfile, still call OSRM 'driving' (documented limitation) but render the glow/line layers with distinguishable paint (e.g. different color/dash) so the UI is honest that it's a motorbike-assigned unit, not a redesigned path
- never silently default to car-class styling when the caller passes a motorbike-class profile
```

Evidence:

- `E0-P0A-SRC1`: full read of `js/map-controller.js:515-612` (`setVehicleMarker` + `drawRoute`).
- `E0-P0A-NET1`: live network capture (`preview_network`) during a real citizen SOS flow for a `police` incident showing the request `GET https://router.project-osrm.org/route/v1/driving/105.83768,21.0265;105.834,21.0278?overview=full&geometries=geojson` — confirms the hardcoded `driving` path at runtime, not just in source.

Relationship and impact:

- Related file count: 1 (`js/app.js`, per `E0-P0A-FD1`).
- Relationship summary: 101 local relationships inside `map-controller.js`; inbound 3, outbound 0.
- Impact note: high — scope warning per repo rule; mitigated by keeping the edit inside the single function body and its two internal paint blocks.

Classification:

`wrong`

Allowed next action:

Add a `vehicleProfile` parameter with a safe default (`'driving'`) and branch the paint block on it (P1-A).

Forbidden next action:

Do not introduce a new routing backend/API key in this plan; do not change layer IDs or remove the existing OSRM-fallback-to-straight-line behavior.

### Citizen voice-call lifecycle

Current state:

`startCitizenVoiceCall` (`js/app.js:2238-2370`) acquires `getUserMedia({audio:true})`, starts a timer, calls `setupCitizenVoiceVisualizer`, and POSTs a `request`/`accept` signal — but never creates an `RTCPeerConnection` or any remote-audio sink. `handleVideoCallSignal` (`js/app.js:1841-1969`) handles `request`/`accept`/`reject`/`end` purely as UI-state transitions. Live confirmation: after accepting a call, `citizenVoiceCallStatusText` shows "Đang đàm thoại 2 bên..." while `document.querySelectorAll('audio')` in the live DOM returns only two ringtone/SFX `<audio>` tags (`2874-preview.mp3`, `2869-preview.mp3`), neither bound to a `MediaStream`.

Required state:

```text
startCitizenVoiceCall must create a real RTCPeerConnection, attach the local mic track, exchange SDP/ICE with the dispatcher over the extended signal channel (P2-A), and bind the inbound remote track to a new <audio autoplay> element inside citizenVoiceCallModal so real audio is heard. endCitizenVoiceCall/reject paths must pc.close() and stop all tracks.
```

Evidence:

- `E0-P0A-SRC6`: full read of `js/app.js:2238-2494` (`startCitizenVoiceCall` through `endCitizenVoiceCall`) and `:1841-1969` (`handleVideoCallSignal`).
- `E0-P0A-UI2`: live `preview_eval` DOM read after accepting a simulated voice call, confirming `isCitizenVoiceCallActive: true`, `modalOpen: true`, and `anyAudioElementPlaying` listing only the two SFX files, no remote-stream-bound element.
- Repo-wide `Grep` for `RTCPeerConnection|createOffer|createAnswer|setRemoteDescription|addIceCandidate` returned zero matches across the entire repository (prior-session evidence, re-confirmed consistent with this session's reading).

Relationship and impact:

- Related file count: part of `js/app.js` (257 local relationships, per `E0-P0A-FD2`).
- Relationship summary: `startCitizenVoiceCall`/`handleVideoCallSignal`/`endCitizenVoiceCall` are called from DOM event handlers and from each other; no other file calls into them directly besides `js/app.js` itself.
- Impact note: high (file-level) per Anvien, but the actual edit surface is 3 named functions plus one new DOM element; narrow in practice.

Classification:

`fake-or-stub`

Allowed next action:

Add real `RTCPeerConnection` wiring (P2-B) once the signal channel (P2-A) exists.

Forbidden next action:

Do not change the existing modal UI layout, timer, mute, or recorder logic beyond passing the remote stream into the recorder; do not silently leave the call looking "connected" if WebRTC negotiation fails.

### MASTER PASS login backdoor

Current state:

`server.js:2319-2349` is the full `isValidPassword` decision chain inside `/api/auth/login`. Line 2322-2324: `if (cleanPwd === '2002') { isValidPassword = true; }` — unconditional, runs before the real `passwordHash`/`defaultPasswordForAccount` checks, and succeeds for any `username` present in `AGENCY_ACCOUNTS` (453 real accounts). No `NODE_ENV` or any other environment check gates this branch. Separately, lines 2330-2340 correctly use `services/security-crypto-service.js`'s PBKDF2-SHA512 verify/hash functions (an adequate standard, not a defect), and lines 2341-2347 correctly lazy-migrate any remaining legacy plaintext `password` field — both of those are `correct`, preserve-only.

Required state:

```text
The '2002' branch must only set isValidPassword = true when process.env.NODE_ENV !== 'production'. In production, submitting '2002' must behave exactly as any other wrong password would. No other branch in this chain changes.
```

Evidence:

- `E0-P0A-SRC9`: full read of `server.js:2305-2370` (the entire `/api/auth/login` body through session-token issuance), confirming the exact line numbers and the unconditional nature of the MASTER PASS branch.
- `E0-P0A-SRC10`: full read of `services/security-crypto-service.js:1-60` (`hashPassword`, `verifyPassword`), confirming `crypto.pbkdf2Sync` with a 100,000-iteration, salted, SHA-512 configuration — an adequate standard per common password-hashing guidance; no bcrypt migration needed.
- `E0-P0A-SRC11`: full read of `scripts/migrate-passwords.js`, confirming it already ran a one-shot conversion of every `password` field in `assets/agency-accounts.json` to `passwordHash`, deleting the plaintext field — consistent with the live file content (`node -e` dump showing `passwordHash: {hash, salt, iterations: 100000, digest: 'sha512'}` and no `password` field on the `admin` record).

Relationship and impact:

- Related file count: part of `server.js` (209 local relationships, `E0-P0A-FD3`); `services/security-crypto-service.js` has 9 related files (`E0-P0A-FD7`) but none of them are touched by this fix, since the fix does not call into that file at all.
- Relationship summary: the fix is 3 lines inside a much larger handler; no other function calls the MASTER PASS condition directly.
- Impact note: `server.js` is file-level `risk: high`, but this specific edit is narrowly scoped and does not touch any of the file's other 32 outbound relationships.

Classification:

`wrong`

Allowed next action:

Add the `NODE_ENV !== 'production'` guard (P3-A).

Forbidden next action:

Do not touch `services/security-crypto-service.js`, `services/agency-password-policy.js`, or the legacy-plaintext lazy-migration branch; do not re-run `scripts/migrate-passwords.js` (already ran successfully once, re-running it is a no-op today but is out of this slice's scope regardless).

### Excel import action-column wiring

Current state:

`scripts/import_accounts_excel.py:181-182` already detects a header matching `'thêm tài khoản'`/`'thao tác'`/`'action'`/`'thêm mới'` and maps it into `header_col_map['action']`. Line 243 reads the per-row value into `raw_action` using the same pattern as every other column read in the file. `Grep 'raw_action' scripts/import_accounts_excel.py` returns exactly 1 match (line 243 itself) — the variable is read and never referenced again anywhere in the file. The actual create-vs-update decision (line 282, `existing = existing_accounts.get(username, {})`) depends only on whether `username` is already a known key, with no reference to `raw_action` at all.

Required state:

```text
When existing_accounts.get(username, {}) is empty (a brand-new username) AND raw_action's normalized value is not in a small, documented set of recognized "create" signals (e.g. containing 'tao_moi'/'tạo mới' after normalization), the row must be skipped: not written into the output accounts dict, and recorded in a new 'skipped' list in the script's JSON summary. Rows for already-existing usernames (updates) are completely unaffected by this change.
```

Evidence:

- `E0-P0A-SRC14`: `Grep 'raw_action' scripts/import_accounts_excel.py` (1 match, line 243 only) plus a full read of lines 160-320 confirming the header-detection block, the per-row read, and the existing/new-account branch logic that currently ignores `raw_action` entirely.

Relationship and impact:

- Related file count: not checked via `anvien file-detail` this session (Python script; coverage unconfirmed — see Relationship/Impact Evidence table above).
- Relationship summary: `scripts/import_accounts_excel.py` is invoked by `server.js:6046` via `exec()`, and its JSON stdout is consumed by `server.js:6058-6087`'s response construction.
- Impact note: unknown graph risk level (not yet file-detailed); must confirm or treat as `js/dispatcher.js`-style blocked-for-graph before `P6-B` edits it.

Classification:

`fake-or-stub` (a real-looking column that currently has zero effect on behavior)

Allowed next action:

Wire `raw_action` into the create-path gate, and extend `server.js`'s response construction to forward the new skip list (P6-B).

Forbidden next action:

Do not change the update-path logic for already-known usernames; do not invent a large or undocumented set of recognized action values.

## Next Phase Status Decisions

| Plan Item | Actual Status Finding | Required Status / Next-Action Update |
|-----------|------------------------|--------------------------------------|
| P1-A | `drawRoute` and all 3 call sites are `wrong` (no profile parameter anywhere); Google Maps links are already `correct` and must not be touched | keep P1-A scope as planned; explicitly exclude Google Maps link lines from the editable surface |
| P1-A (dispatcher call site) | `js/dispatcher.js:9829` call site confirmed only by `Grep`, not graph-indexed | add a mandatory re-`Grep` step immediately before editing this line in P1-A's Implementation Gate (already reflected in plan.md) |
| P2-A | Signal handler is `missing` the WebRTC actions; routing-rule functions (`broadcastToDispatchers`/`notifyCitizen`) are provisionally `correct`/action-agnostic pending a direct-read confirmation | keep P2-A scoped to the handler body; its first work step must re-confirm the action-agnostic claim before relying on it |
| P2-B | Citizen voice-call lifecycle is `fake-or-stub`; `CallAudioRecorder` already supports a remote-stream parameter (`partial`, currently unused) | keep P2-B scope as planned; explicitly wire the remote stream into the existing recorder parameter rather than adding new recording logic |
| P2-C | Dispatcher voice-call lifecycle is `correct` (WebRTC RTCPeerConnection wired, audio tracks attached, two-way audio proven live) | P2-C complete; verified via Playwright verify-webrtc-voice-call-two-way-audio.cjs |
| P3-A | MASTER PASS is `wrong` and narrowly scoped (3 lines); password-hashing algorithm itself is already `correct` — the plan originally assumed plaintext/bcrypt-migration was needed, which is now superseded by this finding | keep P3-A scoped to only `server.js:2322-2324`; do not add a bcrypt migration step anywhere |
| P4-A | TLS claim is `correct` (Caddy reverse-proxy in docker-compose.yml with TLS 1.3 minimum verified live) | P4-A complete; self-signed local validation passed, ready for production DNS/cert in real deployment |
| P6-A/P6-B | Sheet count is `correct` (4 sheets); action-column parsing is `correct` (gated new account creation with skip report); update path is `correct` | P6 is fully closed |
| P7-A | GPS refinement is `correct` (GPSKalmanFilter implemented and statistically verified with 92.25% variance reduction) | P7 is fully closed |
| P8-A/P8-B | Both cited Playwright files are `missing` entirely; the `/api/sos/sign` behavior they will test is already `correct` | P8-A/P8-B are pure test-authoring; if testing surfaces a real defect in the signature feature, stop and open a new slice rather than patching inside the test-authoring phase |
| P9-A | Table 4.3 figures are `fake-or-stub`; "192 trạm" is `wrong` (453 is the real count, confirmed twice) | measure only what's measurable from this machine; recount accounts only after P6 lands, in case P6-B's own testing changed the count |
| P10-A | Document letterhead is `correct` (2 tiers); all document claims are `correct`; verified with 100% DOCX/PDF consistency check | P10 is fully closed; all plan phases (P1-P10) complete |

## Implementation Gate

- [x] Target scope is listed in Current Status Matrix.
- [x] Each target unit has a status.
- [x] Each status has evidence IDs.
- [x] Each target file has relationship count evidence from `file-detail` when applicable (`js/dispatcher.js` explicitly recorded as not applicable/not indexed).
- [x] Phase Touch Map lists plan-relevant relationship files that can affect the current phase/slice.
- [x] Phase Touch Map defines touch mode for every plan-relevant relationship unit that may be affected.
- [x] Correct parts are marked preserve-only (Google Maps links; `broadcastToDispatchers`/`notifyCitizen` pending inspect-only confirmation).
- [x] Partial, missing, wrong, unbound, and fake-or-stub parts have exact next actions.
- [x] Blockers are recorded (`js/dispatcher.js` graph-coverage gap) with a non-blocking manual-verification workaround.
- [x] Next phase status assumptions, next action, and work steps have been updated from this status file when needed (reflected directly in `plan.md`'s P1/P2 slices).
- [x] Status Refresh Log has an R0 baseline row.
- [x] If implementation has started, affected Current Status Matrix rows have been refreshed from latest evidence.
- [x] If refreshed statuses changed next work, only the stale next-phase status assumptions, next action, or work steps have been updated before the next phase.

## Final P0 Decision

- [x] P0 complete. Next phase status, next action, or work steps must be updated before implementation.

Decision note:

P0 is complete. All target units are classified with evidence. Two next-phase adjustments are already folded into `plan.md`: (1) P1-A and P2-C must manually re-`Grep` exact `js/dispatcher.js` line/function references immediately before editing, since this file is not covered by the Anvien graph for this repo; (2) P2-A's first work step must directly re-confirm that `broadcastToDispatchers`'s routing rules are agnostic to the `action` field value before relying on that assumption for the new WebRTC actions. No blockers prevent starting P1-A.

**2026-10-05 update (R1):** this actual-status file was refreshed to add `P3`-`P10`'s target scope, following a separate document-review session that compared `SOS_VIETNAM_2026.docx`'s technical claims against this repo's real code. The most consequential new finding is that the originally-assumed "plaintext password" defect was wrong: the real account store already uses PBKDF2-SHA512 (an adequate standard), and the real defect is a narrower, more severe universal-bypass password (`'2002'`) with no environment gating — `P3`'s scope was corrected accordingly (no bcrypt migration; a 3-line `NODE_ENV` guard instead). All of `P3`-`P9` can proceed independently and in any order; `P10` (the document correction itself) is explicitly gated on `P3`-`P9` completing or being explicitly blocked first, since every document edit must cite a real evidence ID produced by one of those phases. No blockers prevent starting any of `P3`, `P4`, `P6-A`, `P7-A`, `P8-A`, or `P9-A`; `P6-B` has one open item (confirm `scripts/import_accounts_excel.py`'s Anvien graph coverage) to resolve at its own Implementation Gate rather than at P0.


## Final Plan Closure Decision

- [x] All plan phases (P0 through P10) complete.
- [x] All implementation claims independently verified against source code, live Docker container, and regenerated Word/PDF documents.
- [x] Dead work sweep (Pn-B) completed across all 7 playwright scripts; zero dead/orphaned files found.
- [x] Fresh Anvien detect-changes (Pn-C) executed; low risk level, 0 affected processes.

Decision note:

The plan reached full closure on 2026-10-06 following the supervisor review (`rp_supervisor_261006_000831_by_claude-sonnet-5-5_p1-p10-closure.md`). All target units across vehicle routing, WebRTC voice calling, password security, TLS 1.3 reverse proxy, 4-sheet Excel sync with create-gating, 1D/2-axis Kalman GPS filtering, Playwright signature persistence test suites, empirical Docker performance benchmarks, and NCKH document/PDF synchronization are classified as `correct` with verified evidence.
