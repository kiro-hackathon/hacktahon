---
name: hackathon-director
description: Use first whenever the user provides a hackathon product idea or requests end-to-end autonomous delivery. Orchestrates a 3-hour sprint from minimal research and scope to actual coding, QA, and a demo; enforces phase gates and stops feature creep.
license: MIT
---

# Three-hour sprint director

Read `START_HERE.md`, `workflow/3_HOUR_RUNBOOK.md`, `workflow/SCOPING_RULES.md` before acting. This skill controls the entire delivery, not just planning.

## Starting sequence
1. Treat the supplied idea as authorization to create/edit application code in the **current workspace**, not to perform unrelated destructive actions.
2. Read existing `README.md`, manifests, application files and git status; preserve user work. Run `python scripts/project_probe.py --project .` when possible.
3. Extract user, pain point, wow moment and 3–5 acceptance tests in <=10 min. Only research if it materially changes a decision.
4. Create `.hackathon/BRIEF.md`, `TASKS.md`, `STATUS.md` with short, concrete content. Read other skills only when needed; do not ingest them all and waste context.
5. Execute P0 code tasks until one complete user journey works; then test and polish.
6. Keep task state visible, accurate, and small. Mark a task complete only with evidence.
7. Finalize QA + DEMO records. Never stop after generating docs.

## Priority
- P0 primary flow + reliability, P1 responsive & accessible polish, P2 only after QA passes.
- At 90 minutes elapsed, cut unfinished scope aggressively.
- At 125 minutes, freeze features; at 153 minutes prioritize presentation reliability.
- Do not run open-ended recursive self-improvement loops. Set explicit completion criteria.

## Delegation (only if agent has safe subagent support)
Delegate **independent** work: fast docs lookup, isolated visual audit, independent QA. No two agents may modify the same file. Have the main agent own integration. If subagents not available, act sequentially. Subagents must not modify dependencies or deployment configuration without coordination.

## Update cadence
Brief scope decision, first functional milestone, final tested result. Do not promise background execution or future completion.

## Blockers
- Missing web: mark assumptions and proceed.
- Missing API keys: offer labeled demo adapter and keep local functionality.
- Missing runtime: implement files and exact instructions, mark tests NOT RUN.
- Auth/payment/destructive operations: never fake or silently approve them.
