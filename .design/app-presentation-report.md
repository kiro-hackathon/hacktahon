# RoutaCagayan app presentation review

Date: October 17, 2026. Scope: the requested three-second logo launch, map-first Home inspired by the supplied mobile reference, and destination-to-results transitions. This review describes the current researched-route / DICT preset app; older D-series audit reports are historical.

## Result

The existing RoutaCagayan mark and wordmark appear centered for three seconds, including the final 200 ms fade. A thin accent line supports the intro without implying route-calculation progress. The native modal temporarily blocks interaction with the underlying app. It releases on its own timer, without waiting for map tiles, and does not replay during internal navigation.

Home opens its existing Leaflet map automatically. On mobile, the rounded trip sheet follows the map, with the primary action before the demo reset. On desktop, the map and compact planner share the existing content width. The oversized heading and home illustration give way to the map; the route-detail illustration remains. The palette, font, icons, directory, assistant, saved guide, and ride-provider handoff code are retained.

The picker enters in 280 ms; a different trip screen enters in 340 ms. The guide animates only its instruction card, keeping fixed actions anchored to the viewport. The initial app reveal uses opacity only for the same reason. There is no extra routing delay. Back cancels an unfinished screen animation. Reduced-motion preferences disable these animations and splash movement; the requested three-second intro still applies. Picker opening now waits for click/tap completion, avoiding introduction of a moving modal between pointer press and release.

## Executed verification

`node tests/presentation.cjs` passed all nine reporting groups in installed Chrome through Playwright, with touch emulation on mobile:

| Check | Actual result |
| --- | --- |
| 360×800, 390×844, 430×844 | Three-second modal intro completed within the timing assertion (2.9–4.5 seconds); map precedes fields; primary action stays above bottom navigation; 44px destination target; no horizontal overflow. |
| Full commuter flow at each width | Home → destination picker → Centrio → animated options → R1 details → four manual steps → Arrival passed. Cancel retained Centrio. Intro did not repeat. The guide action stayed within the viewport during entry motion. |
| Repeated taps and alternative trip | Six successive starting-point picker open/close taps retained DICT; USTP → Limketkai offered two options. Browser Back preserved the chosen places and the picker could be dismissed. |
| Existing app surfaces | All eight directory lines, My Trip, and the ready-to-view Routa AI preset remained usable. |
| Provider handoff / map recovery | Both provider hrefs matched the official URLs; cancel retained the selected trip. Expanded map, accuracy notes, and a 390×450 viewport still allowed successful trip submission. |
| Reduced motion | Splash, picker, and screen movement disabled; normal selection and results still worked. |
| Desktop 1280×900 | Side-by-side map and planner fit without horizontal overflow; screenshot visually reviewed. |
| Map failure | Aborted tile requests exposed Retry map, released the intro, and still allowed successful trip results. |
| Runtime | No uncaught browser exceptions across the focused suite. |

`node tests/routa-intelligence.cjs` also passed all seven logic groups, including route-specific answers for all 33 configured itineraries, unknown-input fallback, and deterministic preferences. Syntax checks passed for the edited JavaScript files; `git diff --check` passed.

The final `node tests/routes-research.cjs` run passed all **11 groups**, exit 0: all 33 itinerary deep links, all 30 supported origin/destination pairs, all 30 AI presets, directory filters/directions, guide refresh and completion, unsourced-map-point handling, old unsupported-link recovery, and Home/options/directory/line/results/DICT layouts at 320, 360, 390, 430, 768, and 1440px. No browser exceptions. Its helper now waits for the launch to finish after navigation and explicit reloads before reading visible content. [Full regression results](../.hackathon/route-research-results.json).

Evidence: [focused results](../.hackathon/presentation-results.json), [mobile and desktop screenshots](../.hackathon/presentation-screenshots/). Automated map requests use explicit SVG test tiles, identified as QA fixtures in screenshots. One live OpenStreetMap Home view was separately rendered and visually reviewed; [live map preview](../.hackathon/map-home-preview.png) was captured before the final compact-spacing adjustment. No tiles were downloaded for offline use.

## Usability improvements

The destination field is now attached to the map through a compact rounded sheet. Moving the secondary demo reset below the main action keeps Find my jeepney above navigation on the smallest tested phone. Both location fields have at least 44px targets. Map accuracy/privacy notes remain available under About this map, while tile failures always expose a visible explanation and retry action. GPS off is stated beside the map title; no fabricated location dot or DICT marker appears.

## Data, limitations, and reuse

Eight signboards use the existing sourced commuter references; all 33 configured itineraries still need local validation. DICT journeys are explicitly samples. Boarding/alighting instructions and landmark connections are approximate, not verified road navigation. Only the six already sourced landmark centers have map coordinates. Arrival is a manual walkthrough confirmation. JoyRide and Angkas remain external handoffs; booking APIs and automatic trip transfer are future integrations.

This remains a browser prototype, not an installed native app or offline PWA. Real map tiles need connectivity. Physical phones, OS navigation bars, Safari/Firefox, screen readers, and actual device notches were not tested in this change. Desktop and mobile browser emulation are the executed evidence; they do not certify hardware behavior.

Codex assisted with implementation, review, tests, and documentation. Reused guidance: Design Partner and the existing Hackathon Agent Kit workflow. Existing Manrope, Leaflet, OpenStreetMap attribution, and original RoutaCagayan SVG assets remain. The supplied Angkas screenshot guided composition only; no provider branding, commercial UI components, AI-generated image, new template, framework, backend, or library was introduced.

## Presentation-ready walkthrough

“Open RoutaCagayan: the logo welcomes you, then reveals Cagayan de Oro on the map. The GPS-off label makes the demo context clear. Choose your starting landmark and destination in the trip sheet. Find my jeepney brings in the available signboards with a short transition. Compare the route references, open directions, and follow the manual guide through to Arrival. Jeepneys and My Trip remain one tap away.”
