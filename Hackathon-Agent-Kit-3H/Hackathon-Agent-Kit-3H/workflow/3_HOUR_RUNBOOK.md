# 3-hour autonomous execution runbook

**Start:** When the agent receives the idea. **Budget:** 180 minutes wall clock, unless the user supplies a different limit. Use actual elapsed time when accessible; if the clock is unavailable, use phase order and conservative task budgets. No timer daemon is assumed. The goal is **one runnable, convincing demo**, not exhaustive production software.

## Phase A — 0–10 min: decide the concept

- Parse idea into *user*, *pain*, *single transformation*, *why this is memorable*.
- Check existing repo and tooling. Do research only if it will change the plan, maximum 5 minutes. Use direct sources when feasible; no invented competitors/metrics.
- Choose ONE primary end-to-end flow and up to TWO supporting flows.
- Pick a distinctive differentiator visible in under 30 seconds of demo.
- Write `.hackathon/BRIEF.md` (<=30 lines). State out-of-scope items explicitly.

**Exit:** A one-sentence pitch and 3–5 acceptance checks.

## Phase B — 10–20 min: plan and UI direction

- Use existing stack where possible. For greenfield browser demos choose low setup complexity. Pick a data strategy (local, fixture, real API if already available).
- Define route/components/data and the one interaction judges must see.
- Establish typography hierarchy, spacing tokens, colors, responsive strategy. No endless inspiration gathering.
- Write `.hackathon/TASKS.md` with P0 (must work), P1 (polish), P2 (stretch). Implement P0 before P1/P2.

**Exit:** Ordered plan and a clear first vertical slice.

## Phase C — 20–125 min: code the working product

- Build in **vertical slices**. Example: open app → input → processing/action → result → refresh/persistence if relevant.
- Start dev server early, verify app renders, then deliver functional interaction, then add secondary features.
- Keep architecture proportionate (separate state, UI, and services only where it genuinely improves speed/testability).
- Validate as you go. On each milestone record working evidence and remaining bugs.
- Prefer input validation, empty/loading/error/success states to extra feature pages.
- **At ~90 min**: if the main flow is not end-to-end, aggressively cut scope and ship the simplest real version.

**Exit:** P0 accepted or clearly identified limitations.

## Phase D — 125–153 min: verify and repair (feature freeze)

- **No new features.** Run build, tests and lint where scripts exist and are affordable.
- Exercise happy path + bad input + empty data + persistence/reload + narrow viewport + keyboard + failure/retry.
- Use a browser agent / Playwright if configured; otherwise give explicit manual instructions and run CLI checks/HTTP checks as possible.
- Fix P0 and obvious P1 bugs. Log *commands actually run* and their exit codes in `.hackathon/QA.md`.

**Exit:** Known defect list with impact and honest evidence.

## Phase E — 153–171 min: polish and deploy optionally

- Fix layout overflow, keyboard traps, cramped mobile UI, contrast, inconsistent copy, broken states.
- Make seeded/sample mode clear; remove fake CTAs. Add short setup/run commands and sample data.
- Deploy ONLY if credentials are already available, allowed, and deployment won't jeopardize the local demo. Local demo is sufficient if deployment is blocked.

**Exit:** Stable live or local demo with run instructions.

## Phase F — 171–180 min: demo / pitch

- Record 45–90 second story: problem → solution → memorable interaction → impact.
- Prepare click-by-click demo script and one reliable demo dataset.
- Summarize what is truly functional, limitations, and follow-up opportunities.
- Update `.hackathon/DEMO.md` and `.hackathon/STATUS.md`. STOP when deliverables are ready; do not burn final minutes on random extras.

## Rules for a compressed timeline

- **<90 min left:** implement only primary flow, reduce secondary pages.
- **<45 min left:** stop adding features; stabilize, test, prepare story.
- **<20 min left:** preserve known-good build; no dependency or architecture changes.
- **<10 min left:** no coding except a proven fix for a demo-blocking defect.

## Completion contract

A sprint can be reported **DONE** only if the user can find app start instructions, a realistic demo flow, a known working command/build (or an honest blocker), and QA evidence. Use **PARTIAL** if a critical requirement remains unverified. Never convert unknown results into pass marks.
