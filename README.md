# RoutaCagayan

**Your next sakay, made simple.** A mobile-first, interactive jeepney trip-planning prototype for Cagayan de Oro, built with HTML, CSS, and JavaScript.

## Run locally

From the project root, with Python 3 installed:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). On Windows, `py -m http.server 8080 --bind 127.0.0.1` is an alternative if Python uses the `py` launcher. Stop with Ctrl+C. Any static HTTP server will also work.

There is **no installation or build step**, no environment variables, and no application dependencies. Serve over HTTP rather than opening `index.html` directly, because the app uses JavaScript modules. All assets, including the font, are bundled locally. Internet access is unnecessary while the local server is running; this is not an installable offline PWA.

## Try the demo

1. Keep **USTP CDO** as your starting point.
2. Tap **Divisoria** under “Around the city.”
3. Tap **Find my jeepney** to see the fictional **D1** recommendation, four journey steps, and schematic.
4. Choose **Change trip**, swap the endpoints, and search again to see the reverse instructions.
5. Try **Centrio → Cogon Market** for the unsupported-trip state and working alternative journeys.

You can also type a landmark and choose a suggestion. Keyboard controls include Arrow Up/Down, Enter, Tab, and Escape. The starting point’s destination shortcut is labeled and disabled to prevent accidentally selecting the same place twice. Result URLs can be reloaded, and browser Back/Forward restores the appropriate screen.

## What is simulated

**This is not a navigation service.** All D-series route codes, boarding points, drop-off stops, and journey instructions are fictional, unverified demonstration fixtures. The schematic has no geographic scale. No routes, distances, fares, or travel times should be inferred from it. Do not use this prototype for real travel directions.

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

All other landmark pairs receive an honest empty state. Recommendations use deterministic local lookups; **no AI routing model, GPS, external API, or live transport information is running**.

Landmark identities were checked against [USTP](https://www.ustp.edu.ph/cdeo/), [Ayala Malls Centrio](https://www.ayalamalls.com/explore/ayala-centrio/store/AYALA-CENTRIO-1435180), and [SM Prime](https://www.smprime.com/latest_news/manila-bulletin-sms-premier-mall-opens-in-downtown-cdo-on-may-12/) on October 17, 2026. These sources do not verify the demo routes. Other landmark names follow the supplied brief.

## Files

```text
index.html                 Semantic screens and trip form
src/app.js                 Interactions, validation, rendering, navigation
src/routes.js              Fictional route fixtures and lookup functions
src/styles.css             Responsive design and interaction states
assets/                    Original SVG favicon and local licensed font
tests/smoke.cjs             Optional browser checks
.hackathon/QA.md            Executed checks, fixes, and limitations
.hackathon/DEMO.md          75-second presentation and click script
```

## Verification

The app was exercised in installed Google Chrome through Playwright: **14 check groups passed**, including all 14 directed example journeys, empty and invalid inputs, unsupported trips, reverse instructions, keyboard autocomplete, dialogs, browser history, and local-only network behavior. Home, result, and empty states had no horizontal overflow at **320, 360, 375, 390, 430, 768, and 1440px**. Screenshots at 375, 390, and 1440px are in `.hackathon/screenshots/`.

Optional: if Playwright and Chrome are already available, start the server and run `node tests/smoke.cjs`. Set `NODE_PATH` if Playwright is installed outside the project. `TEST_URL` can override the server URL. Playwright is only a QA tool; users do not need it to run the app. See [QA evidence](.hackathon/QA.md) for exact commands and coverage limits.

## Credits and AI disclosure

Codex assisted with product interpretation, original HTML/CSS/JavaScript, SVG illustration, tests, and documentation. No frontend template or UI component library was reused. The included **Hackathon Agent Kit** and **Design Partner** skill guided the workflow; the user's 60-minute brief superseded the kit's three-hour schedule. Existing kit files were preserved.

[Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) is bundled under the SIL Open Font License; see `assets/fonts/OFL.txt`. Icons and the jeepney illustration are original SVG markup created for this prototype.

Before a real launch: validate routes and boarding locations with local transport authorities and commuters, field-test the instructions, and conduct assistive-technology and device testing.
