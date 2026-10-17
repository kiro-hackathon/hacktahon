# RoutaCagayan — final mobile experience review

Date: October 17, 2026. Scope: incremental completion of the existing prototype, then mobile UX review. The newer Complete Mobile App Experience brief authorized the directory, options, guide, arrival, and three-item navigation that were missing during the interrupted audit. The earlier “no new features” audit scope was superseded; the brand and existing integrations were preserved.

**Verdict: complete, verified fictional demonstration flow. Not real commuter navigation.**

## Walkthrough and assessment

Scenario: a new USTP CDO student selects Divisoria, compares the direct D1 example with the D2 → Centrio → D6 transfer example, opens details, manually completes the selected guide, and reaches the arrival screen.

| Review question | Result and evidence |
| --- | --- |
| Can I find the destination input immediately? | PASS. A persistent DESTINATION label, large input target, and early Find my jeepney action are visible at 360/390/430px. Large artwork is hidden on mobile and preserved on desktop. |
| Is GPS versus demo/manual origin clear? | PASS. Initial status says GPS is off. The separate demo button explicitly selects USTP. Actual GPS says Current location, and arbitrary positions never produce a fake route. |
| Can I select with one thumb? | PASS in touch emulation. Full-screen search provides full-width ≥65px suggestion rows, a selected check, visible labels, swap, and an accessible primary action. A reduced 390×450 viewport remains usable. Physical-thumb/keyboard behavior is not field-tested. |
| Can I compare suggested jeepneys? | PASS. The primary pair has two complete fictional options with signboards, board/drop-off, ride/transfer counts, and explicit View directions actions. Other pairs show only their configured option. No fastest/time/price claims. |
| Can I identify a signboard? | PASS for the demo. D1 · Divisoria · DEMO is prominent in options and details. The transfer itinerary specifies D2 toward Centrio, then D6 toward Divisoria. These are fictional signs, not real instructions. |
| Can I understand boarding and alighting? | PASS for the demo. The details and ordered steps name illustrative boarding, transfer, drop-off, and final-walk places. No actual designated stops or walking paths are asserted. |
| Are demo routes disclosed? | PASS. Home footnote, route badges, option disclosure, details, guide header, directory, and arrival text identify fictional/manual behavior. |
| Can I start and finish a guide? | PASS. Four-step direct and seven-step transfer guides completed. Previous step, completed/current/upcoming states, exit confirmation, resume, refresh, and intentional arrival clearing verified. |
| Can I recover from Back or a wrong choice? | PASS. Search Back retains choices; details Back and browser Back return to options. Replacing an active guide requires confirmation. Browser Back dismisses a pending exit sheet after the fix below. |
| Is the approved design retained? | PASS by visual review of screenshots: existing teal/cream/amber, typography, SVG style, route badges, desktop hero, map, timeline, and secondary ride-app rows are retained. New controls reuse these roles. |

## Executed evidence

Commands (existing Playwright installation; no app dependencies installed):

```powershell
$env:NODE_PATH='C:\Users\USER-PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node tests/experience.cjs
node tests/smoke.cjs
node tests/maps.cjs
node tests/handoff.cjs
```

Final results: **15 complete-experience groups + 14 core groups + 17 map/geolocation groups + 11 external-handoff groups = 57 passing groups**. Each final suite exited 0. Browser: installed Google Chrome, Playwright touch emulation for the new mobile walkthrough. No uncaught exceptions or console errors in the complete flow.

Layout coverage: Home, options, transfer details, directory, line details, My Trip, and transfer guide at 360, 390, 430, and 1440px without horizontal overflow. Existing suites additionally cover 320/375/768px for their surfaces. Navigation has exactly Home/Jeepneys/My Trip; it hides during search and the focused guide. The Start action stays above navigation, even with a simulated 24px bottom inset. An expanded map cannot intercept the primary action. The guide has its own safe-area-aware action bar. Physical notch behavior remains untested.

Repeated map checks use marked fixture tiles rather than automated traffic to OSM. Provider navigations are intercepted at the verified official URL; no ride is booked. Clipboard cases use API fixtures; OS clipboard is not read. A previous independent live-map check confirmed real tiles. Browser permission denial is set through Chromium’s actual permission controls; position and provider error cases use the documented emulation/fixtures.

Evidence: `.hackathon/experience-test-results.json`, the other three `*test-results.json` records, and `.hackathon/experience-screenshots/` (home/search/options/guide/directory/My Trip/arrival). Mobile and desktop screenshot states were visually reviewed.

## Observed defect and usability improvements

1. **P1, fixed and retested:** browser Back while “Leave the demo guide?” was open left a stale confirmation over the previous details screen. Reproduced before repair (`resultVisible: true`, `staleExitDialogOpen: true`). Screen navigation now dismisses the confirmation, preserving guide progress. The complete-flow regression asserts the overlay is closed and the original guide remains resumable.
2. Clarified the starting-point status to “Manual starting point · GPS is off” and moved a concise fictional-route disclosure next to the primary search action.
3. Home inputs now have 44px hit areas. The mobile hero is more compact, destination shortcuts precede the optional map, and bottom actions reserve space for navigation/safe-area insets.
4. Corrupted stored JSON is discarded safely. Blocked writes preserve in-tab progress and display a clear persistence limitation. Loaded storage is restricted to configured identifiers and integer progress, never coordinates.

## Data and integrity

- Seven fictional line definitions with 14 explicitly configured directions. Reversing a new line is not automatic.
- Fourteen direct options plus two complete fictional transfer options (one per featured direction). All signboards, boarding/drop-off/transfer points, walking instructions, ride counts, and progress relate to these fixtures. No authentic route codes, times, fares, live availability, or verified stop locations are asserted.
- The six real landmark feature centers are reused from sourced `locations.js` data. Coordinates are not boarding locations. Map connections and schematics are illustrative.
- Guide advancement and arrival are manual user confirmations, not GPS stop/arrival detection.
- Local storage contains only known fixture IDs, selection/progress, and the last landmark pair. Exact GPS readings remain in memory. It is not an account or trip-history system.
- JoyRide/Angkas remain optional official-website handoffs with no automatic trip transfer or booking API.

## Limitations and reuse disclosure

Real transport data and field verification are still required for a launch. Physical phones, real on-screen keyboards, Safari/Firefox, screen readers, and comprehensive WCAG testing were not performed. Keyboard space and safe-area tests are approximations, not physical-device certification. Refresh persistence requires browser storage; unavailable storage falls back to the open tab. Online map tiles and provider sites require connectivity.

Codex assisted with code, original SVG assets, review, tests, and documentation. Reused guidance: Design Partner (design/accessibility/verification) and the Hackathon Agent Kit (director/browser QA). No frontend template or proprietary ride-app artwork was copied. Existing Manrope (SIL OFL), Leaflet 1.9.4 (BSD-2-Clause), and OpenStreetMap data/tiles (attributed ODbL) remain. No new application library, framework, backend, or AI routing model was introduced.
