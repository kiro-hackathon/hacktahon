# QA — October 17, 2026

## Executed

Environment: Windows, Python 3.14 static HTTP server, installed Google Chrome controlled by bundled Playwright. No application packages installed.

Commands:

```powershell
python -m http.server 8080 --bind 127.0.0.1
node --check src/app.js
node --check src/routes.js
$env:NODE_PATH='C:\Users\USER-PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node tests/smoke.cjs
```

Final browser run: exit 0, **14 check groups passed**. Machine-readable evidence: [test-results.json](test-results.json).

| Check | Observed result |
| --- | --- |
| Empty destination | PASS: actionable error, invalid input marked |
| Unknown landmark | PASS: no-match guidance and validation; search stays clickable |
| Identical endpoints | PASS: clear error, inputs retained |
| Shortcut → supported result | PASS: Divisoria selects; D1 displays; four matching steps; title receives focus |
| Change, reload, swap, reverse | PASS: fields retained, reverse boarding/destination instructions correct |
| Unsupported route | PASS: Centrio → Cogon shows honest empty state; alternative opens a working route |
| Keyboard autocomplete | PASS: alias query, ArrowDown, Enter, Escape; ARIA selection and expanded state update |
| Information dialogs | PASS: both openers, Escape, and primary close action |
| Curated route coverage | PASS: 7 pairs × 2 directions, matching badges and four steps |
| Responsive reflow | PASS: home/result/empty have no horizontal overflow at 320, 360, 375, 390, 430, 768, 1440px |
| Zoom-equivalent/reduced motion | PASS: 640 CSS px reflow (1280px at 200% equivalent); reduced-motion disables smooth scrolling |
| Browser history | PASS: Plan a trip, Back, Forward restore correct screens |
| No internet dependency | PASS: only local requests; D5 search works with external requests blocked |
| Browser diagnostics | PASS: no console errors, page exceptions, or HTTP failures |

Screenshots saved for home/result/empty at 375, 390, and 1440px. Visually inspected the 375px and 390px mobile home/result states, 390px empty state, and desktop home/result states. No build step exists or is necessary.

## Issues found and fixed

1. **Mobile heading wrapping:** a broad heading-span rule put punctuation on an extra line and split the result arrow. Removed the broad rule and grouped the amber question mark with its word. Re-inspected screenshots.
2. **Shortcut usability:** tapping the USTP destination shortcut with USTP as the origin produced an avoidable same-place error. The matching shortcut now says “Your starting point,” shows a check, and is disabled. This state updates when the origin changes. Verified in browser.
3. **Autocomplete blocked search:** the unknown-place popup overlaid the submit button. No-match guidance now flows inside the input area; fully resolved locations close suggestions unless explicitly opened with an arrow key. Closing on click rather than pointerdown prevents a layout shift from swallowing the submit click. Re-ran unknown and supported searches.
4. **Readability and touch targets:** increased mobile body/category/instruction text, and enlarged swap and dialog controls to 44px. Re-ran all layout checks.

## Tool/test corrections

The default bundled Chromium binary was absent; tests used the existing Chrome channel instead, with no browser installation. An initial CSS `zoom` test was replaced with an explicitly labeled viewport equivalent because CSS zoom does not update media queries. A desktop-only navigation test now runs at desktop width; mobile uses the tested Change trip action.

## Limits / NOT RUN

- Physical phone, iOS Safari, Firefox, and screen-reader testing: NOT RUN.
- Actual browser-chrome 200% zoom control: NOT RUN; viewport equivalent tested instead.
- Comprehensive WCAG certification and automated contrast audit: NOT RUN. Semantic labels, ARIA behavior, focus styling, reduced motion, keyboard suggestions, and focus transfer were implemented/checked within the stated coverage.
- All route facts: NOT VERIFIED. Routes and instructions are clearly labeled fictional in the interface and documentation.
- No backend, AI inference, fares, time estimation, or live road routing exists. Optional browser GPS was added in the upgrade below.

## Map and geolocation upgrade

Executed `node tests/maps.cjs` with the same NODE_PATH and Chrome setup above: **17 check groups passed**, exit 0. Machine-readable evidence: [maps-test-results.json](maps-test-results.json).

- Six landmark coordinates have explicit OSM feature sources and persisted verification evidence in [landmark-source.json](landmark-source.json). Points are feature centers, not boarding locations.
- No map tiles are requested before opening a section. Opened maps show all configured markers, visible attribution, origin/destination roles, and keyboard-accessible marker names.
- Zoom buttons, pointer panning, compact/expanded controls, fit-to-endpoints, and the labeled dashed demo connection were exercised. GPS scenarios have no demo connection or route recommendation.
- Browser geolocation success used Chrome’s geolocation permission and position emulation. Returned coordinates were preserved exactly in marker state. Browser permission denial used the actual Chromium permission setting. Error codes for unavailable/timeout, missing API, and insecure context were separately injected to exercise their handlers; these are simulations of provider failures, not physical GPS tests.
- Outside-area GPS retained the reported position, showed coverage guidance, and produced no substituted location or recommendation. The demo switch preserved the destination and explicitly replaced GPS with USTP. Manual origin editing restored curated routing. Reload discarded the GPS position with an explanation.
- No geolocation call occurred on load. A delayed callback could not override a later demo choice.
- Assertions found no exact coordinates in local/session storage, URL/history, or outgoing request URLs. OSM tile requests still imply the approximate viewed map area; the interface and README explain this.
- Tile request failures showed a fallback message while retaining the original illustration and all four steps. Retrying after restored fixture availability recovered the map.
- Expanded home and result maps had no horizontal overflow at **320, 360, 375, 390, 430, 768, and 1440px**. Visual review covered 390px home/result and desktop with the original UI intact.
- No uncaught JavaScript errors across upgrade scenarios. Expected network errors from the intentionally aborted tile test are not reported as application exceptions.

**Tile test policy:** automated pan/zoom and responsive tests fulfill tile requests with a marked SVG fixture, preventing repeated automated requests against public OSM servers. Fixture screenshots are labeled `*-fixture.png`. A separate single live-map view returned **four HTTP 200 tile responses** and displayed “Map ready.” Its screenshot is `maps-screenshots/live-map-desktop.png`. No real tile prefetch/bulk download or offline map cache was added.

**Regression:** re-ran `node tests/smoke.cjs`: all 14 original check groups passed. Closed maps preserve the previous local-only request behavior. `node --check` covers app, map, geolocation, routes, and locations modules.

**Usability corrections during upgrade:** marker accessible names now explicitly identify both role and place rather than only “A/B”; collapsing an expanded section resets the expansion control; the initial landmark preview fits all six configured points. Request tokens prevent stale GPS callbacks from overriding manual/demo choices. Tile-library failure retains the planner and offers a reload action.

**Still NOT RUN:** physical GPS hardware, a human-operated browser permission prompt, Safari/Firefox, screen readers, and comprehensive accessibility certification. The city coverage rectangle is intentionally coarse and is not a legal city boundary. Landmark data verification does not verify jeepney directions.
