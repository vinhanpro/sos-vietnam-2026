# TODO for Antigravity: close out the P1-P10 plan

**Context:** a supervisor review just ran against your P1-P10 work. Verdict: **REJECT** — but only on process grounds, not implementation quality. Report: `docs/plans/2026-10-05-web-app-bug-fixes/rp_supervisor_261006_000831_by_claude-sonnet-5-5_p1-p10-closure.md` (read it for full detail/evidence; this file is the condensed action list).

**Good news first:** every implementation claim that was spot-checked against real source/files survived verification — Excel 4-sheet + action gate, Kalman filter math, both Playwright files cited by the NCKH doc, benchmark script using real timing APIs (not hardcoded numbers), and the actual external `.docx` file confirmed edited (2-tier letterhead, re-extracted directly). Nothing needs to be re-implemented. The reject is purely because the plan's own closure steps were skipped.

## Do these 5 things, in order

1. **Tick the stale checkboxes in `plan.md`.** These lines still say `- [ ]` even though the matching commits and evidence already exist — just change to `- [x]`:
   - Line 435 (`P2-C`), 549 (`P4-A`), 604 (`P6-A`), 647 (`P6-B`), 707 (`P7-A`), 762 (`P8-A`), 811 (`P8-B`), 865 (`P9-A`), 924 (`P10-A`).

2. **Add a closure note to `actual-status.md`.** Its "Final P0 Decision" section at the very end is still the original P0-era note. Add a new line/row (in the Status Refresh Log, or right after the existing Decision note) stating the plan reached full closure as of this cleanup pass — the "Next Phase Status Decisions" table above it already correctly says every phase is `correct`, this section just needs to catch up.

3. **Do a real `Pn-B` dead-work sweep and write down what you found.** Specifically look at the 7 files in `playwright/` for any duplication or one-off helper that should have been folded into another script. The supervisor review's own quick pass found nothing suspicious, but that was incidental — do it deliberately and record a one-line finding in `evidence.md` (e.g. "Pn-B: reviewed all 7 playwright/ scripts, no duplication or dead helpers found" or list what you removed).

4. **Run `Pn-C`:**
   ```bash
   cd "C:\Users\dienv\Desktop\sos_vietnam_2026_web_hosting\.claude\worktrees\web-app-bug-review-c735b2"
   anvien detect-changes --repo sos-vietnam-2026-worktree-bugreview --scope all
   ```
   Record the output in `evidence.md`'s Closure Evidence section as its own dated entry (don't just reuse the P10-A commit's existing summary — this needs to be a fresh run tied to this cleanup pass). If Docker is available, a quick rebuild/health-check is enough — you don't need to re-run every phase's own test suite again, those already have their own evidence.

5. **Commit.** One commit covering the `plan.md` + `actual-status.md` + `evidence.md` documentation fixes from steps 1-4. Suggested message:
   ```
   docs(plan): close out P1-P10 — tick stale checklist, run Pn-A/B/C

   - plan.md: mark P2-C/P4-A/P6-A/P6-B/P7-A/P8-A/P8-B/P9-A/P10-A complete
     (code and evidence already existed; checklist was just stale)
   - actual-status.md: add final closure note
   - evidence.md: record Pn-B dead-work sweep finding + fresh Pn-C
     detect-changes output
   - Supervisor review (rp_supervisor_261006_000831_...): REJECT on
     process grounds only, all implementation claims verified clean
   ```

After that, the plan is genuinely done — no further implementation work needed, this is pure bookkeeping to match the plan's own rules (which required checklist updates "immediately" and a Pn-A/B/C gate before calling anything complete).
