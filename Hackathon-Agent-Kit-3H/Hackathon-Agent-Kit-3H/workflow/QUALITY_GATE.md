# Demo release gate

Mark each as **PASS, FAIL, or NOT RUN** with evidence. Never mark a check PASS just because the code looks right.

## P0 (demo blockers)
- [ ] Application launches without uncaught runtime exceptions.
- [ ] Main use case completes from start to useful result.
- [ ] Buttons, forms, navigation and links needed for demo work.
- [ ] No secrets or real credentials included in client bundle or screenshots.
- [ ] No deceptive 'live' integration when using mock/sample mode.
- [ ] Bad input produces understandable feedback rather than a crash.
- [ ] Demo data is reliable and resettable.

## P1 (polish)
- [ ] At ~375px wide: no horizontal overflow or clipped primary controls.
- [ ] Keyboard works for critical interactions with visible focus and form labels.
- [ ] Typography hierarchy, consistent spacing, contrast, and responsive states.
- [ ] Explicit empty/loading/error/success states, as applicable.
- [ ] README and demo script reflect actual commands and functionality.

## Evidence style

| Check | Status | How verified | Note |
|---|---|---|---|
| Example: build | PASS | `npm run build` exit 0 | 2026-... |
| Example: mobile view | NOT RUN | Browser automation unavailable | needs human test |

Never fabricate screenshots, command output, pass percentages, deployments, or external API responses.
