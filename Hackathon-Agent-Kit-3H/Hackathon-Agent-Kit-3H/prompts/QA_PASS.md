# Independent QA sweep prompt

```text
Act as the hackathon QA owner. Read .hackathon/BRIEF.md and its acceptance criteria.
Do not add features. Run the app and actually exercise the primary user flow,
invalid input, empty state, navigation, reload/persistence, and small viewport
when tools permit. Run available existing lint/typecheck/test/build commands.
For each check record PASS/FAIL/NOT RUN and evidence in .hackathon/QA.md.
Fix only confirmed P0 regressions, re-run affected checks, and update DEMO.md.
Do not claim browser checks passed if you only inspected source code.
```
