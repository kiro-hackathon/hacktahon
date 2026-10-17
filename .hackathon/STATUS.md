# Status

## Current app presentation update — October 17, 2026

Implemented the requested three-second centered Routa logo intro, map-first Home, compact mobile trip sheet, desktop map/planner composition, and destination/results transitions. Existing researched routes, curated DICT presets, Routa AI, directory, saved manual guides, and provider handoffs remain. Reduced motion disables movement; the intro never waits for map tiles. Guide actions remain anchored during animation.

Current focused verification: `tests/presentation.cjs` — **9 passing groups**, exit 0; `tests/routa-intelligence.cjs` — **7 passing logic groups**, exit 0. Phone widths: 360/390/430px; desktop: 1280px; short viewport: 390×450. Actual results, screenshots, data limitations, and the presentation walkthrough: [app presentation report](../.design/app-presentation-report.md).

## Historical implementation notes

The notes below describe earlier D-series builds. Current route data and default selection are documented in README.md and the current report above; older totals and fictional-line descriptions are not current regression results.

DONE: complete mobile Home → Search → Options → Details → Manual Guide → Arrival flow, Jeepneys directory, and My Trip. Existing maps/geolocation, JoyRide/Angkas handoff, desktop hero, and approved visual identity are preserved. No new framework, backend, build step, or dependency installation.

Local server confirmed: http://127.0.0.1:8080
Final browser QA: 15 complete-experience groups + 14 core + 17 maps/geolocation + 11 handoff = 57 passing groups; each final suite exited 0. Full touch walkthrough at 360/390/430px and desktop at 1440px. Safe-area simulation, short search viewport, guide refresh/resume, storage failures, explicit reverse directions, and manual transfer completion verified. See QA.md, four *test-results.json records, and .design/mobile-experience-report.md.

Usability fixes: prevent origin-as-destination shortcuts, keep submit clickable for no-match input, correct mobile heading wrapping, improve mobile text and touch targets.

README.md includes setup, route limitations, licensing/AI disclosure. DEMO.md contains the 75-second script. Existing hackathon kit preserved. No deployment performed.

Current presentation: DEMO-90-SECONDS.md supersedes the earlier demonstration scripts. Final walkthrough screenshots: experience-screenshots/.

Upgrade: six sourced landmark centers; origin/destination markers; labeled illustrative connections; compact/expanded maps; tile failure/retry; one-shot browser GPS with error recovery; explicit demo origin; truthful unsupported GPS routing; memory-only exact coordinates.

Known limits: all routes/directions remain fictional; GPS is not routing; landmark centers are not entrances or boarding stops. Online tiles are needed for the real basemap. Demo coverage rectangle is not a legal city boundary. Physical-device, screen-reader, and cross-browser testing remain future work.

Handoff: compact service rows below instructions, trip-context confirmation sheet, exact official website links in separate tabs, explicit manual trip entry, destination copy with selectable fallback. No logos reused, deep-link schemes, booking APIs, automatic trip transfer, or simulated bookings. Real booking APIs and automatic transfer remain future provider integrations.

New data: seven fictional lines with 14 explicitly configured directions; 14 direct options plus two complete transfer options via Centrio. Direct guides have four steps; transfer guides have seven. Only fixture identifiers and progress are stored in localStorage, never GPS coordinates. Arrival clears the active/selected guide while preserving search choices.

Post-test fix: reproduced and repaired a stale exit-confirmation overlay on browser Back; guide progress remains resumable. Corrupted storage is discarded safely; blocked writes fall back to tab memory with a visible explanation.
