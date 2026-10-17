---
name: mvp-scope
description: Use after receiving the idea to define a demoable MVP, prioritize the most compelling core flow, convert it into acceptance checks, and reject distracting stretch features under a three-hour deadline.
license: MIT
---

# Scope to one vertical slice

Produce `.hackathon/BRIEF.md` and `.hackathon/TASKS.md` using these rules:

- One target user and one measurable user outcome.
- One complete `input → action → useful output` sequence that a judge can perform in <60 seconds.
- Up to two support flows only if low risk (e.g. history, export, share).
- 3–5 **observable acceptance tests** written `Given / When / Then`.
- Explicit **OUT OF SCOPE** section. Force tradeoffs: no unnecessary auth, admin panel, social layer, complicated backend, elaborate analytics, or generic landing pages unless core idea requires them.
- Choose real local persistence or a marked fixture/demo mode over fake APIs.
- Score wow factor, simplicity and testability. If ambiguous, bias toward a unique interactive moment.

Task sizing: P0 tasks of 10–25 minutes, ordered by dependencies; P1 visual polish; P2 stretch. Estimate conservatively. A P0 task is complete only when its behavior is exercised or its test runs.

If the core feature is too ambitious, choose a narrow slice with no misleading claims rather than pretending the complete product works.
