---
name: demo-delivery
description: Use near the end of a hackathon sprint to write a convincing, reproducible demo and pitch based only on implemented functionality, produce accurate run instructions, and list tests plus limitations transparently.
license: MIT
---

# Demo as a product, not a slideshow

Write `.hackathon/DEMO.md` including:

1. **One-line pitch:** For [audience], [product] solves [pain] by [distinctive behavior].
2. **60-second story:** 0–10s pain; 10–20s proposition; 20–50s actual interaction; 50–60s outcome and why it matters.
3. **Click script:** exact start URL/command and 3–6 clicks with deterministic data; show one visible wow moment.
4. **Recovery:** what to do if network unavailable, API rate-limited, or the browser reloads.
5. **Features live vs mocked:** explicit truthful distinctions; no magic demo hiding broken flows.
6. **Run/setup:** exact commands tried or required, environment variables listed by NAME only, default URL.
7. **QA and known issues:** link to `.hackathon/QA.md`; never claim features or tests not exercised.
8. **Future roadmap:** max three realistic next steps, not part of the promised MVP.

## Presentation sanity
Judges typically respond to a clear user problem, visible result, reliable flow, and coherent design. Keep the pitch relevant to the event's actual scoring rules if provided. Do not invent judging criteria, traction, user counts, sources, or revenue.

## Exit
Project works locally (or limitation disclosed); reproducible demo script exists; current status and test evidence documented. Stop making cosmetic edits that threaten the demo.
