# Hackathon Agent Kit — 3-Hour Sprint (v1.0)

**Paste one project idea. Your coding agent takes the lead.**

This is an original, lightweight, offline-ready workflow kit, **not** a collection of cloned third-party repos. It is designed for a ~3-hour AI-assisted hackathon with one working, polished, demonstrable MVP as the goal. No npm install, API key, subscription, or plugin installation is required **for the workflow itself**. Building or deploying a particular app may need its own runtime, dependency downloads, account, or credentials.

## Fast start: new project

1. Create/open an empty project folder in **Codex, OpenCode, Antigravity, Claude Code**, or another terminal-capable coding agent.
2. Extract the **contents** of this ZIP into the project root, so `AGENTS.md` sits beside your future app files. (Alternatively use the installer below.)
3. Open a **new agent session** with the project root as its working directory.
4. Paste this exact message, replacing only the idea:

```text
Read AGENTS.md and START_HERE.md. Enter 3-hour hackathon execution mode.
IDEA: <PASTE MY IDEA HERE>
Make reasonable decisions autonomously. Research briefly if tools are available,
then implement the smallest complete, polished MVP. Test it and prepare the demo.
Do not stop after writing a plan; implement and verify the actual app.
```

There is also a longer copy-ready prompt at `prompts/ONE_SHOT_START.md`.

## Existing project: safe installer (recommended)

Extract the ZIP to a **separate** folder, then run **from inside the extracted kit**:

```bash
python install.py --target "/path/to/your/existing-project"
# Windows example:
py install.py --target "C:\Projects\my-hackathon-app"
```

The installer copies `workflow/`, `prompts/`, tools, and skill directories. If an existing instruction file (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, Copilot instructions) is present, it adds a short pointer **without overwriting the original text**. Conflicting non-instruction files are skipped. Run `python install.py --help` to see options. **Do not extract a ZIP on top of an existing project expecting automatic merges.**

## Supported conventions (current as of October 2026)

- **Codex / Antigravity / OpenCode:** `.agents/skills/<skill-name>/SKILL.md` plus root `AGENTS.md`.
- **Claude Code:** `.claude/skills/<skill-name>/SKILL.md` plus root `CLAUDE.md`.
- **Gemini-oriented agents:** root `GEMINI.md` supplies the same entry instructions; directory discovery varies by product.
- **GitHub Copilot:** `.github/copilot-instructions.md` assists where workspace instructions are supported.
- **Other agents:** explicitly paste the startup prompt and direct them to `AGENTS.md`; automatic skills discovery cannot be guaranteed.

The `.agents/skills` and `.claude/skills` directories contain **identical original skills**, intentionally duplicated for Windows ZIP portability rather than symlinks. OpenCode can see `.agents/skills`, so `.opencode/skills` copies are unnecessary.

## What the agent does

1. Choose the smallest demoable scope; define who the user is and the one memorable interaction.
2. Spend no more than **5 minutes** researching, when browsing is available.
3. Create a concise project brief, acceptance tests, and task order.
4. Implement end-to-end features, not dead buttons or decorative mockups.
5. Apply visual quality, usability, accessibility, and basic security checks.
6. Actually run build/tests/browser smoke checks when supported.
7. Leave a crisp demo script, honest test status, and presentation talking points.

## Hard budget: 180 minutes

| Elapsed | Phase | Target |
|---|---|---|
| 00–10 | Understand + quick research | One-sentence pitch, scoped MVP |
| 10–20 | Architecture + design | Brief, acceptance criteria, implementation plan |
| 20–125 | Build | One complete user journey (stretch only if ready) |
| 125–153 | Verify + fix | Working app and honest test results |
| 153–171 | Polish / optional deploy | Responsive UI, edge states, stable demo |
| 171–180 | Presentation | Repeatable demo and pitch |

These are **milestones**, not guaranteed agent timing. If you have less than 3 hours, go directly to the current phase using `prompts/RECOVERY_MODE.md`.

## Included skills

- `hackathon-director`: drives phase gates, priorities, and artifacts.
- `rapid-research`: makes a 5-minute decision-oriented comparison; records source links only when available.
- `mvp-scope`: cuts ideas to one demonstrable user journey and measurable acceptance criteria.
- `fast-implementation`: implements working vertical slices with minimal architecture and tests.
- `interface-quality`: avoids generic AI-looking UI; checks real usability and responsiveness.
- `browser-qa`: verifies keyboard, navigation, flows, persistence, and UI defects.
- `security-sanity`: prevents secret exposure and unsafe shortcuts.
- `demo-delivery`: leaves a demo, talking points, run instructions, and truthful status.

## Tool defaults

- Prefer the **already configured** agent/model and existing dependencies.
- For a new web MVP with Node available: prefer the simplest existing starter or lightweight **Vite + React + TypeScript**; plain HTML/CSS/JS is excellent for tiny single-page prototypes. Use a heavier stack only if the idea demands it.
- Prefer local persistence/mock fixtures with accurate labeling to a half-built backend. Never fake an external integration as if it were real.
- Use browser automation when present; otherwise manual QA checklist plus HTTP/build checks.
- Optional external tools: Context7, Playwright MCP, agent-browser, UI/UX Pro Max, OpenSpec, etc. **Do not install them mid-hackathon unless already configured and useful**. See `workflow/OPTIONAL_TOOLS.md`.

## Quick local check

```bash
python scripts/kit_doctor.py
python scripts/project_probe.py --project .
```

The doctor validates the packaged kit. The project probe only **reads** the current project; it never installs dependencies or executes project code.

## Important limitations

- A prompt/skill cannot force model tool availability, uninterrupted execution, paid API credits, or successful deployment. The agent must have local file-edit + terminal access and sufficient execution allowance.
- Some agents require granting filesystem/terminal access, opening the workspace, or explicitly invoking the skill.
- Skills are **instructions, not an autonomous daemon**; you still need to start a coding agent session and monitor phase outcomes.
- Keep accounts and payment authorization under human control; never paste secrets into the idea.
- Follow hackathon rules regarding AI assistance, originality, datasets, disclosure, and permitted services.

MIT License applies to original kit files. External repositories linked as optional references are **not bundled** or relicensed by this kit.
