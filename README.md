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

1. Keep **USTP CDO** as your starting point.
2. Tap **Divisoria** under “Around the city.”
3. Tap **Find my jeepney** to see the fictional **D1** recommendation, four journey steps, and schematic.
4. Choose **Change trip**, swap the endpoints, and search again to see the reverse instructions.
5. Try **Centrio → Cogon Market** for the unsupported-trip state and working alternative journeys.

You can also type a landmark and choose a suggestion. Keyboard controls include Arrow Up/Down, Enter, Tab, and Escape. The starting point’s destination shortcut is labeled and disabled to prevent accidentally selecting the same place twice. Result URLs can be reloaded, and browser Back/Forward restores the appropriate screen.

## Map and optional location

- Open **Explore Cagayan de Oro** under the home planner, or **Explore this trip on a map** in the result’s existing illustrated panel. Drag to pan, use +/− to zoom, or choose Expand map. A/B markers identify origin/destination. The original illustration and timeline remain available.
- **Use my current location** requests one browser position after you click. It requires HTTPS or localhost and browser permission. Errors for denied, unavailable, timed-out, unsupported, or insecure location access are explained without replacing your starting point.
- **Try demo location: USTP CDO** explicitly selects a configured landmark; it never pretends to be GPS.
- GPS origins show the actual reported coordinates as a marker. **No arbitrary GPS position is snapped to a landmark or assigned a fictional jeepney route**, even if it is near USTP. A clear unsupported-routing state lets you select a landmark or switch explicitly to the demo while keeping the destination.
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

## What is simulated

**This is not a navigation service.** All D-series route codes, boarding points, drop-off stops, and journey instructions are fictional, unverified demonstration fixtures. The schematic has no geographic scale. The map’s dashed straight line is explicitly a **demo connection, not a verified jeepney road route**. No directions, distances, fares, or travel times should be inferred from it. Do not use this prototype for real travel directions.

The dataset contains seven curated pairs, supported in both directions:

| Demo code | Example pair |
| --- | --- |
| D1 | USTP CDO ↔ Divisoria |
| D2 | USTP CDO ↔ Centrio |
| D3 | USTP CDO ↔ Limketkai |
| D4 | USTP CDO ↔ Cogon Market |
| D5 | USTP CDO ↔ SM CDO Downtown Premier |
| D6 | Divisoria ↔ Centrio |
| D7 | Cogon Market ↔ Limketkai |

All other landmark pairs receive an honest empty state. Recommendations use deterministic local lookups; **no AI routing model, road routing API, or live transport information is running**. Browser GPS only locates the user; it does not calculate routes.

Landmark identities were checked against [USTP](https://www.ustp.edu.ph/cdeo/), [Ayala Malls Centrio](https://www.ayalamalls.com/explore/ayala-centrio/store/AYALA-CENTRIO-1435180), and [SM Prime](https://www.smprime.com/latest_news/manila-bulletin-sms-premier-mall-opens-in-downtown-cdo-on-may-12/) on October 17, 2026. These sources do not verify the demo routes. Other landmark names follow the supplied brief.

## Files

```text
index.html                 Semantic screens and trip form
src/app.js                 Interactions, validation, rendering, navigation
src/routes.js              Fictional route fixtures and lookup functions
src/locations.js           Sourced landmark coordinates and map configuration
src/map.js                 Lazy Leaflet maps, markers, demo connection, fallback
src/geolocation.js         User-initiated browser location and error handling
src/styles.css             Responsive design and interaction states
src/maps.css               Additive map/location styles in the existing design
assets/                    Original SVG favicon and local licensed font
tests/smoke.cjs             Optional browser checks
tests/maps.cjs              Map, geolocation, privacy, and failure checks
.hackathon/QA.md            Executed checks, fixes, and limitations
.hackathon/DEMO.md          75-second presentation and click script
```

## Verification

The app was exercised in installed Google Chrome through Playwright: **14 original regression check groups and 17 map/geolocation check groups passed**. This includes all 14 directed example journeys, empty/invalid/unsupported trips, reverse instructions, keyboard autocomplete, dialogs, history, actual browser geolocation success/denial under test permissions, injected timeout/unavailable/unsupported cases, privacy assertions, tile fallback/retry, and map controls. Expanded home/result maps had no horizontal overflow at **320, 360, 375, 390, 430, 768, and 1440px**. A separate live-map check received four HTTP 200 tile responses. Automated pan/zoom tests use intercepted **fixture tiles**, not repeated requests to OSM servers. Screenshots in `.hackathon/maps-screenshots/` identify fixture views; `live-map-desktop.png` shows real tiles.

Optional: if Playwright and Chrome are already available, start the server and run `node tests/smoke.cjs` and `node tests/maps.cjs`. Set `NODE_PATH` if Playwright is installed outside the project. `TEST_URL` can override the server URL. Playwright is only a QA tool; users do not need it to run the app. See [QA evidence](.hackathon/QA.md) for exact commands and coverage limits.

## Credits and AI disclosure

Codex assisted with product interpretation, original HTML/CSS/JavaScript, SVG illustration, tests, and documentation. No frontend template or UI component library was reused. The included **Hackathon Agent Kit** and **Design Partner** skill guided the workflow; the user's 60-minute brief superseded the kit's three-hour schedule. Existing kit files were preserved.

[Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) is bundled under the SIL Open Font License; see `assets/fonts/OFL.txt`. Icons and the jeepney illustration are original SVG markup created for this prototype.

[Leaflet 1.9.4](https://leafletjs.com/) is vendored under BSD-2-Clause (`assets/vendor/leaflet/LICENSE`). Map data and tiles are © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under ODbL. Attribution remains visible inside every opened map. No map tiles are bundled.

Before a real launch: validate routes and boarding locations with local transport authorities and commuters, field-test the instructions, and conduct assistive-technology and device testing.
