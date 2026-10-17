# START HERE — automatic project execution

This file is the launch sequence. The human should only need to provide an **IDEA** and, optionally, a hard deadline/stack. If the request is clearly a hackathon project idea, **proceed**, don't respond with a long plan or ask a preference survey.

## First response, then action

1. Read `AGENTS.md` and `.agents/skills/hackathon-director/SKILL.md` (or `.claude/skills/...` if relevant), then `workflow/3_HOUR_RUNBOOK.md`.
2. Identify a demoable problem, target user, and a single memorable core workflow. Use reasonable defaults; ask **at most one** question only when there is a genuine blocking external requirement (credential, inaccessible dataset, legal constraint). Otherwise assume and note your assumptions.
3. Do concise local inventory; run `python scripts/project_probe.py --project .` if available; identify existing project conventions before deciding a stack.
4. If browsing is available, research up to 5 minutes and use **at most 3 genuinely helpful sources**. If unavailable, work from available knowledge and mark anything needing verification. Do not hallucinate citations.
5. Create `.hackathon/BRIEF.md`, `.hackathon/TASKS.md`, `.hackathon/STATUS.md`; write concisely. No large specs.
6. Immediately **write and run application code**. Give the human a short status update at the first working milestone. Never stop at wireframes or TODO lists.
7. Prioritize a functional end-to-end vertical slice and responsive design. Then test, fix, and package the demo.
8. Finish by updating `.hackathon/QA.md`, `.hackathon/DEMO.md`, `.hackathon/STATUS.md` with what ran, known limitations, and next action.

## 3-hour execution philosophy

- Ship a smaller **working** product, not a large imaginary one.
- One distinctive feature beats ten unfinished screens.
- Design coherently from the start; don't postpone all visual polish.
- Mock mode is allowed only if **clearly labeled** and all flows function locally.
- Do not install multiple agent frameworks, switch model providers, or spend 20 minutes debating tools.
- Continue through build and verification unless blocked by tool permission, missing credentials, or a genuine requirement. If blocked, deliver the best runnable local fallback.

## Copy-ready invocation

> Read AGENTS.md and START_HERE.md. IDEA: [your idea]. Execute the 3-hour sprint autonomously; build the app, verify it, and prepare the demo. Keep me informed at major milestones, not after every step.
