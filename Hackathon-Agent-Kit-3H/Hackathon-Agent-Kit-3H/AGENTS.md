# AGENTS.md — 3-Hour Hackathon Mode

**Applies to this workspace.** When a user provides an app/product idea, follow this workflow by default unless the user explicitly opts out.

## Mandatory behavior

1. Read `START_HERE.md` and `.agents/skills/hackathon-director/SKILL.md` (or `.claude/skills/hackathon-director/SKILL.md`) before coding. Use the other matching skills at their designated phases.
2. **Implement**, don't merely describe, the user's idea. Optimize for a verified demo within **180 minutes**. Ask questions only for true blockers; make reversible assumptions otherwise.
3. Work in this order: **small scope → working vertical slice → verification → polish → demo**. `workflow/3_HOUR_RUNBOOK.md` is the phase policy.
4. Use existing repo patterns, packages, lockfiles, and dev commands before adding a new stack. Minimize external dependencies and paid services.
5. Respect the scope freeze at minute 125. After that, fix defects and prepare delivery; don't add new major features.
6. Maintain `.hackathon/BRIEF.md`, `TASKS.md`, `STATUS.md`, `QA.md`, and `DEMO.md` as concise records. These are evidence, not paperwork.
7. No fake test claims, fabricated web sources, dummy buttons presented as working, undisclosed mocked integrations, or exposed secrets. Check relevant security/accessibility basics.
8. Prefer tools already available in the environment. If browsing, browser automation, deployment, or subagents are missing, use the documented fallbacks. Do not stall waiting for unavailable tooling.
9. Never erase existing work or force-push/reset/delete unrelated files. Never automatically spend money, publish secrets, or deploy publicly without the user's authorization when required.
10. Do not ask the user to keep the agent alive indefinitely. Work to a concrete, verifiable stopping condition: app runnable, critical paths checked, and demo documentation complete.

## Skill routing

| Situation | Read skill |
|---|---|
| Always / phase control | `hackathon-director` |
| Research available and materially useful | `rapid-research` |
| Product scope / feature selection | `mvp-scope` |
| Architecture / coding | `fast-implementation` |
| Visual frontend | `interface-quality` |
| Testing and bugs | `browser-qa` |
| Auth, data, uploads, keys, third-party APIs | `security-sanity` |
| Final demo / deliverables | `demo-delivery` |

Skills live in `.agents/skills/<skill-name>/SKILL.md` and mirrored `.claude/skills/<skill-name>/SKILL.md`.

**If the user only supplies a short idea:** Treat that as an execution request. Begin without asking them to fill out a form.
