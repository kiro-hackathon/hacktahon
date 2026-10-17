# 75-second demo

Pitch: RoutaCagayan helps unfamiliar CDO commuters turn two landmarks into an understandable jeepney journey.

## Preparation

Run `python -m http.server 8080 --bind 127.0.0.1` from the project root.
Open http://127.0.0.1:8080 at a 390px viewport, or use a desktop browser.
Default starting point: USTP CDO. No internet or account is needed.

## Spoken story and clicks

**0–12 seconds — The problem.**
“You’re a student in Cagayan de Oro. You know where you want to go, but not which jeepney to take or where to get off. RoutaCagayan makes that first journey easier to understand.”

**12–25 seconds — Plan.**
“We start at USTP. I’ll choose Divisoria and tap Find my jeepney. You can also search the six landmarks by name.”
Click Divisoria → Find my jeepney.

**25–45 seconds — The useful result.**
“The route badge is easy to spot. Under it are the boarding and drop-off points. The journey breaks into four steps: walk, board, get off, and walk to the destination. The simple diagram connects those steps without needing a map service.”
Point to D1, then scroll through the steps and schematic.

**45–60 seconds — Honest recovery.**
“Change trip keeps my choices. I can swap them for the return example. For a trip we haven’t included, like Centrio to Cogon, we say so and offer a sample from the same starting point.”
Choose Change trip. Set origin Centrio and destination Cogon Market. Search. Point to the working alternative buttons.

**60–75 seconds — Scope and next step.**
“These are explicitly fictional demonstration routes. The prototype uses local, deterministic data, not a live AI routing engine. The next step is verifying real routes and boarding points with local operators and testing with commuters. The planner works without internet; the optional real map needs online tiles.”

## Recovery

- Reload the home URL to reset the demo.
- Reliable direct result: http://127.0.0.1:8080/#trip/ustp/divisoria
- Unsupported example: http://127.0.0.1:8080/#trip/centrio/cogon
- If the port is busy, use `python -m http.server 8081 --bind 127.0.0.1` and update the URL.
- The local HTTP server must remain running. Without internet, the planner and original schematic still work; live map tiles show a fallback.

## What works / what is simulated

Working: selectors, suggestions, aliases, shortcuts, swap, validation, 14 directed journeys, four-step instructions, schematic, unsupported-trip recovery, dialog, reloadable result URLs, browser history, optional Leaflet maps, sourced landmark markers, one-shot GPS detection, and GPS/demo recovery.
Simulated: every route code, boarding point, drop-off, travel instruction, and straight-line demo connection. No fares, travel times, road routing API, or AI model.

## Optional map/GPS walkthrough

1. On home, choose **Try demo location: USTP CDO**, choose Divisoria, then open **Explore Cagayan de Oro**. Explain that the dashed line illustrates a connection and does not follow verified jeepney roads.
2. Search, then open **Explore this trip on a map** inside the preserved illustrated panel. Show A/B markers and Expand map. The timeline is unchanged.
3. Return home and click **Use my current location**. If permission is granted, the actual browser position is marked. Search to show the truthful “Live jeepney routing isn’t available yet” state. If permission is denied or unavailable, point to the recovery message and separate demo option. Never claim the demo button detects GPS.
4. Explain that exact coordinates remain in tab memory; tile requests reveal the approximate map view. Reload requires detecting the GPS position again.

Evidence and limits: [QA.md](QA.md). Future work: verified route data, commuter field tests, accessibility and physical-device testing.
