---
name: interface-quality
description: Use when designing or polishing hackathon frontend pages. Prevents generic AI-generated 'vibe-coded' UI while retaining clear navigation, responsive full-width layouts, usable forms, accessible interactions and authentic content.
license: MIT
---

# Anti-slop UI / product design

Do not automatically choose dark gradients, giant rounded dashboard cards, purple/cyan glows, meaningless analytics, five badges per page, or oversized hero text. Use a coherent, purposeful interface suited to the product.

## First 3-minute design decision
- Who uses this and what must they do in five seconds? Make the **primary action obvious**.
- Pick a suitable composition: full-width app shell with sensible content width, sidebar only when useful, clear top navigation, main working area; avoid centering the whole app in one narrow card unless it's a focused tool.
- Define reusable tokens: font family and scale, spacing (4/8/12/16/24/32), surface/background, primary/accent, border radius, interaction styles; use CSS custom properties.
- Prefer strong typographic hierarchy, restrained palette, correct alignment, deliberate whitespace, meaningful empty states, clear real microcopy.

## Usability requirements
- Desktop and at least ~375px mobile width; check no clipped CTAs or horizontal overflow.
- Keyboard support, visible focus, semantic labels, sufficient contrast, actionable errors.
- All buttons respond; no fake filters, tabs, charts or progress indicators.
- Primary flow visible without unnecessary scrolling; give immediate feedback after actions.
- Loading and failure states must preserve user progress when reasonable.
- Clear source/mode attribution for generated/demo data; no fabricated reviews or metrics.

## Fast visual audit
At minimum inspect homepage, the core interaction, success/result, empty/invalid input and narrow viewport. If screenshots are available, compare visually. If browser automation is unavailable, record that these remain manual checks.

## Timebox
Spend 5–10 minutes on an initial design system, then refine while implementing. Final polish only after P0 works; don't rebuild working UI at the end just to chase aesthetics.
