# Example one-shot use

**Idea pasted into an agent:**

```text
Read AGENTS.md and START_HERE.md. Enter 3-hour hackathon mode.
IDEA: Build a browser app where students paste lecture notes and instantly
get interactive flashcards they can study offline. Make it visually polished.
Build and verify the demo. Do not stop at planning.
```

**A realistic agent scope choice:**

- P0: paste notes → parse into cards from structured lines → flip card → mark remembered → progress visible → save locally.
- P1: keyboard shortcuts, shuffle, clear empty/error feedback, responsive presentation.
- P2 OUT OF SCOPE: LLM API summarization, login, collaboration, payments, automatic PDFs.
- Honest UX: parsing is rule-based unless an actual AI integration was implemented.

**Sample acceptance:**

1. Given valid `Q: ... / A: ...` lines, when pasted and imported, a review deck appears.
2. Given cards exist, when clicking/pressing Space on a card, the answer appears.
3. Given a card is rated, when continuing, progress updates without a reload.
4. Given a stored deck, when refreshing, its cards persist if local storage works.

**Warning:** This example is not a prebuilt app. It demonstrates appropriate three-hour scoping.
