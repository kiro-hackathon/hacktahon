# Scope and decision rules

## Fast priority rubric (score each 0–2)

| Question | 0 | 1 | 2 |
|---|---|---|---|
| Core value | vague | useful | instantly understandable |
| Demo impact | hidden | visible after setup | visible within 30s |
| Build feasibility | external dependency risk | moderate | local/demo-ready |
| Differentiation | generic clone | some twist | memorable interaction |
| Testability | difficult | partly testable | deterministic |

Pick the smallest feature combination that maximizes the rubric and can work in the time budget. Do not spend 15 minutes scoring; this is a thinking aid.

## Decision hierarchy

1. Honor explicit user constraints.
2. Finish one end-to-end vertical slice.
3. Prefer existing code/lockfile and zero-cost options.
4. Choose the simplest UI that communicates the product clearly.
5. Add polish and a visible 'wow' moment.
6. Stretch features only after P0 validation.

## Allowed simplifications

- LocalStorage/IndexedDB for low-risk browser demos where appropriate.
- Deterministic sample input bundled in-repo; clearly label as demo/sample.
- Mock API adapter with clear mock-mode banner; only if no viable real API.
- Single-user local experience instead of half-working OAuth.
- Static visualizations powered by real sample data if the domain allows it.

## Disallowed shortcuts

- Login screens that imply real authentication but accept any password.
- 'Analyze' actions that always display the same generic text without disclosure.
- Unusable buttons, fake loading spinners, placeholder graphs claimed as measured data.
- Secret API keys committed to code or copied into `.hackathon` artifacts.
- Fake third-party integrations, bogus source citations or untested '100% passing' claims.

## Default architecture

A new browser-first MVP: existing app first; otherwise Vite+React+TypeScript if already comfortable, or HTML/CSS/JS for the smallest no-build interactive demo. Avoid adding DB/auth/payments unless core concept requires them. Use simple, explicit separation: UI/components, state/actions, domain logic, data adapter, styling. No architecture for its own sake.
