---
name: browser-qa
description: Use after first working feature and during the QA phase to test real app behavior, including navigation, forms, invalid input, persistence, responsive viewport, keyboard interactions, build commands and regression fixes.
license: MIT
---

# Test like a judge

1. Read acceptance criteria in `.hackathon/BRIEF.md` and current scripts from project manifests.
2. Run available lint/typecheck/test/build commands **only when actually supported**; capture command, result/exit status, and fixes.
3. If an agent browser, Playwright MCP, or browser automation is available, open the app and exercise this sequence: load → required input → core action → visible result → reset/reload as needed. Use 375px viewport and keyboard Tab/Enter/Escape paths when meaningful.
4. Exercise at least one invalid input, no-result or offline/failure path where applicable.
5. Check console errors, broken links, dead buttons, horizontal overflow, focus indicators, form labels and loading states.
6. Log PASS/FAIL/NOT RUN with evidence in `.hackathon/QA.md`; tests not executed must be marked NOT RUN.
7. Fix highest impact confirmed P0 bugs, then re-run failing path. Do not add unrelated features. Use `workflow/QUALITY_GATE.md`.

## Without browser tools
- `npm run build` or equivalent tests only if project scripts exist.
- Launch dev server and check local HTTP health when possible.
- Prepare click-by-click manual QA steps, mark them NOT RUN until a person actually executes them.
- Code inspection is **not** proof a visual/user interaction passed.

## Reporting
`Build: PASS (command...)`, `Core flow: PASS (actual browser...)`, `Mobile viewport: NOT RUN (no browser tool)`. Never invent 'all tests passed'.
