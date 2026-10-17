---
name: fast-implementation
description: Use while coding a three-hour hackathon MVP. Select the smallest compatible stack, implement runnable vertical slices, preserve existing code, minimize dependencies, and validate each milestone rather than generating massive scaffolds.
license: MIT
---

# Implementation accelerator

## Repo and stack
1. Inspect the existing project first: manifests, scripts, source, lockfile, configuration, git diff. Never rewrite it blindly.
2. If greenfield browser app: use plain HTML/CSS/JS for extremely small demos; Vite+React+TypeScript for interactive multi-component UI **if packages can be installed promptly**. Other stacks only when the idea demands them or existing project uses them.
3. Don't introduce unnecessary cloud infra, microservices, state-management frameworks, auth, payment or GraphQL.
4. No speculative abstraction: separate UI, domain logic, and I/O where that prevents bugs, not every 8-line function into a file.

## Implementation order
- Verify the app boots with the smallest viable page.
- Implement `input → processing/action → result` with meaningful state and error handling.
- Implement persistence when essential; test reload.
- Add secondary interaction(s), responsive styles, and polished states.
- Create deterministic demo data or a seed/reset affordance, clearly marked if simulated.

## Discipline
- Keep components accessible and semantic; all visible controls have real handlers or are explicitly disabled with explanation.
- Keep types and data contracts explicit for external APIs. Validate untrusted inputs.
- Use existing formatter/linter/test commands rather than changing entire repo configuration.
- Inspect build errors and runtime output before declaring success.
- If network/package install fails, revert to built-in web platform APIs where viable; don't fight the package manager for half the hackathon.
- Preserve a known-good checkpoint before risky late edits; do not force-reset unrelated changes.
- Never place secrets in frontend code. Use safe `.env.example` placeholders; real secrets stay untracked.

## Milestone evidence
After each vertical slice, record what function works and how verified in `.hackathon/STATUS.md`. If no terminal/browser tool, report NOT RUN and give precise verification steps.
