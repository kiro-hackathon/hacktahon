# Optional external tools — DO NOT install automatically

The kit is self-contained; the following are reference points and optional upgrades **only if already available**. These projects are not embedded in the ZIP; their licenses and install requirements remain their own. Version compatibility can change. Inspect third-party code before executing it.

| Optional tool | Why consider it | URL |
|---|---|---|
| Context7 | Version-aware framework/API documentation | https://github.com/upstash/context7 |
| Agent Browser | Agent-driven browser interaction | https://github.com/vercel-labs/agent-browser |
| Playwright MCP | Browser verification tools | https://github.com/microsoft/playwright-mcp |
| UI/UX Pro Max | Design and UX heuristics | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| OpenSpec | Requirements/specification workflow | https://github.com/Fission-AI/OpenSpec |
| Superpowers | Disciplined planning/testing development skills | https://github.com/obra/superpowers |
| Graphify | Codebase relationships and knowledge graph | https://github.com/Graphify-Labs/graphify |

**Hackathon advice:** Avoid stacking full orchestration frameworks (e.g. multiple spec drivers and loop controllers). They add tool setup, tokens, and failure modes. The built-in workflow already covers minimal research → scope → build → verify → pitch.

## Capabilities matrix and fallbacks

- **No search/browsing**: make assumptions explicit in `.hackathon/BRIEF.md`, skip online competitors. Do not invent statistics or sources.
- **No browser automation**: run the build and a local HTTP smoke check if feasible; write manual click paths to QA file and say they were not automated.
- **No terminal access**: edit files if supported; provide exact runnable commands, mark tests not executed.
- **No environment variables/credentials**: use a labeled local sample-data mode; never invent tokens.
- **No deployment access**: deliver working local run instructions.
- **No subagents**: run stages sequentially in a single session. Multi-agent orchestration is optional and may not save time.
- **No real clock**: use phase gates and conservative approximations, document uncertainty. Do not fabricate elapsed times.
