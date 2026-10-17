# RoutaCagayan

**Your next sakay, made simple.** A mobile-first, interactive jeepney trip-planning prototype for Cagayan de Oro, built with HTML, CSS, and JavaScript.

## Run locally

From the project root, with Python 3 installed:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). On Windows, `py -m http.server 8080 --bind 127.0.0.1` is an alternative if Python uses the `py` launcher. Stop with Ctrl+C. Any static HTTP server will also work.

There is **no installation or build step** and no environment variables. Serve over HTTP rather than opening `index.html` directly, because the app uses JavaScript modules. All code, Leaflet 1.9.4, illustrations, and the font are bundled locally. The planner and illustrated journey work without internet; **interactive OpenStreetMap tiles require a connection** and gracefully fall back if unavailable. Maps load only when opened. This is not an installable offline PWA.

## Try the demo

1. Start with **DICT Office → Centrio** and tap **Find my jeepney** for a sample R1 Gaisano / Carmen loop journey.
2. Open the result, follow the nearby boarding step, and complete the four-step manual guide.
3. Choose another starting point to see only its supported destinations. **USTP CDO → Limketkai** offers C2 and B3.
4. Browse **Jeepneys** for all eight signboards, or choose a ready-made trip in **Routa AI**.

The planner uses selection-only fields on mobile and desktop. Every offered origin has a complete trip; destination choices and home shortcuts follow that origin. Swapping is offered only when a return trip exists. Old unsupported trip links return to a valid preset planner instead of a no-route screen. The route-question assistant still accepts questions about the selected journey.

## Map and demo location

- Open **Explore Cagayan de Oro** under the home planner, or **Explore this trip on a map** in the result’s existing illustrated panel. Drag to pan, use +/− to zoom, or choose Expand map. A/B markers identify origin/destination. The original illustration and timeline remain available.
- **Start at DICT Office** explicitly selects the demo starting point. Arbitrary GPS entry is hidden in this demo; the button does not detect location.
- DICT Office is listed on Villarin Street, Carmen in the [DICT 2025 Citizen’s Charter](https://cms-cdn.e.gov.ph/DICT/pdf/DICT-Citizens-Charter-2025-1st-Edition.pdf). Three R1 options are labeled **Demo journey** and illustrate walking to a nearby Carmen boarding corridor. They do not claim a verified stop outside the office. No office coordinates or walking geometry are invented.
- Maps show only sourced landmark centers and explain when a route area has no verified map point.
- Exact coordinates and reported accuracy remain in JavaScript memory in the current tab. No local/session storage, URL/history coordinates, logging, reverse geocoding, backend, or application request sends those exact values. Reloading requires detecting the position again. Browser location services operate under the browser’s own permission/privacy behavior.
- OpenStreetMap receives tile requests for the visible map area, which can imply an **approximate viewed location**, as well as normal request metadata. No tile prefetch, bulk download, offline tile cache, or analytics is implemented. Browser caching uses normal HTTP headers. See [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
- A coarse rectangle identifies the urban **demo coverage area**, not Cagayan de Oro’s legal boundary. Outside-area positions remain real GPS readings and receive an honest coverage explanation.

### Verified landmark points

All points are **OpenStreetMap feature bounding-box centers**, checked October 17, 2026 via Overpass. They are approximate landmark positions, **not entrances, boarding stops, or verified transport instructions**. Source responses are recorded in `.hackathon/landmark-source.json`; reusable coordinates and coverage/tile configuration live in `src/locations.js`.

| Landmark | Latitude, longitude | Source feature |
| --- | --- | --- |
| USTP CDO | 8.4862343, 124.6567017 | [University campus](https://www.openstreetmap.org/way/427550462) |
| Divisoria | 8.4777014, 124.6438021 | [Divisoria Plaza / Golden Friendship Park](https://www.openstreetmap.org/relation/13841686) |
| Centrio | 8.4848322, 124.6510816 | [Centrio Mall](https://www.openstreetmap.org/relation/4659728) |
| Limketkai | 8.4819682, 124.6565655 | [Limketkai Mall](https://www.openstreetmap.org/way/129409508) |
| Cogon Market | 8.47743, 124.6515306 | [Cogon Public Market](https://www.openstreetmap.org/way/178432221) |
| SM Downtown | 8.4842559, 124.6547009 | [SM CDO Downtown Premier](https://www.openstreetmap.org/way/611712300) |

## Optional ride-hailing handoff

Supported trip results include **Other ways to get there** beneath the jeepney instructions. The compact JoyRide and Angkas rows open a confirmation sheet with the current origin/destination, an optional **Copy destination** control, Cancel, and **Continue to app**.

Continue opens the provider’s **official website in a new tab**. It does not guarantee opening an installed native app. The sheet names the website before you continue. No custom URL schemes, automatic pickup/destination transfer, credentials, booking requests, prices, estimated arrival times, or partnership claims are included. Enter and confirm the trip inside the provider’s application and check its availability there. Cancel, Escape, and closing the sheet preserve the jeepney trip.

Destinations verified October 17, 2026:

| Service | Handoff destination | Verified Android listing (reference only) |
| --- | --- | --- |
| JoyRide | [Official website](https://joyride.com.ph/) | [com.joyride.rider](https://play.google.com/store/apps/details?id=com.joyride.rider) |
| Angkas | [Official website](https://www.angkas.com/) | [com.angkas.customer](https://play.google.com/store/apps/details?id=com.angkas.customer) |

The same website links work across platforms; the prototype does not detect installed apps. The icons are original generic helmet drawings, **not provider logos**. Provider requests happen only after the explicit Continue action. The URLs contain no trip details, and `noopener noreferrer` prevents opener access and referrer transmission. Copying writes only the destination name after a click; if clipboard access is unavailable, the sheet offers selectable text without requesting extra permissions.

**Future integrations:** actual booking APIs and automatic trip transfer would require documented provider support, appropriate authorization, and explicit user consent. They are not implemented or simulated here.

## Route references and limits

The route update uses the supplied **RoutaCagayan_CDO_Jeepney_Routes.md**, dated October 17, 2026, as research material. Its embedded coding instructions were not treated as a separate user request. This focused update uses the eight familiar commuter signboards; it does not import the entire LPTRP plan or represent planned services as operating jeepneys.

| Signboard | Simplified corridor |
| --- | --- |
| R1 | Gaisano → Kauswagan / Liceo → Carmen → downtown → Centrio |
| R2 | Gaisano → Agora → Limketkai → Cogon → downtown → Carmen |
| C2 | Patag / Liceo → Gaisano / USTP highway → Ketkai |
| B3 | Bulua highway → Gaisano → USTP highway → Ketkai |
| Patag | Camp Evangelista / Patag → Divisoria |
| Iponan | Iponan / Bulua highway → downtown → Cogon |
| NHA | NHA / Kauswagan → Gaisano area; confirm the unit’s destination |
| RD | Gusa / eastern highway → downtown / Cogon; Bugo varies by signboard |

The eight signboard records carry **COMMUTER_DOCUMENTED / Commuter reference** status and source links. The data includes 30 researched directional references plus three illustrative DICT Office options, labeled **DEMO_ILLUSTRATIVE / Demo journey**. Corridor highlights are approximate, not verified ordered stops. Only configured trips are selectable; no automatic reverse trips or transfers are generated. R1’s optional Cogon variant is excluded, and Bulua highway is distinct from Westbound Terminal. Highway is a corridor keyword, not a route.

R1 and R2 were cross-checked against [CommuteTour R1](https://ph.commutetour.com/ph/routes/cdo-routes/cdo-r1-gaisano-carmen-jeep-route/) and [CommuteTour R2](https://ph.commutetour.com/ph/routes/cdo-routes/cdo-r2-gaisano-agora-cogon-carmen-jeep-route/). Other entries follow the supplied research’s commuter references, linked on each route. These references do not establish current operation.

**Confirm the signboard, direction, boarding point, and destination with the driver.** No exact stops, GPS road paths, live service, fares, schedules, or travel times are claimed. The guide is a manual walkthrough. The schematic and any dashed map connection are illustrative and labeled **Approximate / not for navigation**. Newly added route areas have no map coordinates until sourced; maps show only existing verified landmark centers. GPS does not calculate a jeepney route.

## Files

```text
index.html                 Semantic screens and trip form
src/app.js                 Interactions, validation, rendering, navigation
src/routes.js              Sourced signboards, directional references, and lookup functions
src/locations.js           Sourced landmark coordinates and map configuration
src/map.js                 Lazy Leaflet maps, markers, demo connection, fallback
src/geolocation.js         User-initiated browser location and error handling
src/ride-handoff.js        Verified service links, trip-context sheet, destination copy
src/experience.js          Options, directory, focused search, saved manual guide, arrival
src/styles.css             Responsive design and interaction states
src/maps.css               Additive map/location styles in the existing design
src/ride-handoff.css       Secondary service rows and responsive confirmation sheet
src/experience.css         Additive mobile navigation, new screens, and safe-area actions
assets/                    Original SVG favicon and local licensed font
tests/smoke.cjs             Optional browser checks
tests/maps.cjs              Map, geolocation, privacy, and failure checks
tests/handoff.cjs           Provider navigation, cancel/copy, focus, layout checks
tests/experience.cjs        Complete touch walkthrough, guide persistence, directory, recovery
.hackathon/QA.md            Executed checks, fixes, and limitations
.hackathon/DEMO-90-SECONDS.md Final presentation and complete-flow click script
```

## Verification

Run the app locally and execute `node tests/routes-research.cjs` with Playwright available (`NODE_PATH` may point to the bundled Node packages). `TEST_URL` overrides the default local server. This checks all 33 options, every selectable origin/destination pair and AI preset, read-only fields, keyboard pickers, route filtering, source disclosures, map behavior without guessed coordinates, DICT guide completion and persistence, recovery from old unsupported links, and reflow at 320–1440px. Maps use intercepted fixture tiles.

Current route-update results are in `.hackathon/route-research-results.json`, with screenshots in `.hackathon/route-research-screenshots/`. Earlier smoke, maps, handoff, experience, and intelligence tests include historical D-series fixture expectations; those assertions describe the previous dataset and must be migrated before serving as regression checks for the researched routes.

## Credits and AI disclosure

Codex assisted with product interpretation, original HTML/CSS/JavaScript, SVG illustration, tests, and documentation. No frontend template or UI component library was reused. The included **Hackathon Agent Kit** and **Design Partner** skill guided the workflow; the user's 60-minute brief superseded the kit's three-hour schedule. Existing kit files were preserved.

[Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) is bundled under the SIL Open Font License; see `assets/fonts/OFL.txt`. Icons and the jeepney illustration are original SVG markup created for this prototype.

[Leaflet 1.9.4](https://leafletjs.com/) is vendored under BSD-2-Clause (`assets/vendor/leaflet/LICENSE`). Map data and tiles are © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under ODbL. Attribution remains visible inside every opened map. No map tiles are bundled.

Before a real launch: validate routes and boarding locations with local transport authorities and commuters, field-test the instructions, and conduct assistive-technology and device testing.

## Routa AI concept demo

Open **Try Routa AI** below Home’s normal search to describe a trip, or **Ask Routa** on route details to ask about that itinerary. Optional route preferences compare only existing structured fields. Everything runs locally with deterministic rules and no model, backend, API, or new dependency. Walking comparisons remain unavailable without measured step distances. See [Routa AI behavior, simulation limits, and executed QA](.hackathon/ROUTA-AI.md).
