# Status
DONE: static prototype plus the requested Leaflet/OpenStreetMap and optional geolocation upgrade. Approved palette, header, hero, destination cards, recommendation, timeline, and illustration preserved. No framework, backend, build step, or package installation added; Leaflet is vendored locally.

Local server confirmed: http://127.0.0.1:8080
Browser QA: 14 original regression groups and 17 map/geolocation groups passed. Expanded maps checked from 320px to 1440px. Real OSM tiles separately returned HTTP 200. Pan/zoom automation uses fixture tiles. See QA.md, test-results.json, and maps-test-results.json.

Usability fixes: prevent origin-as-destination shortcuts, keep submit clickable for no-match input, correct mobile heading wrapping, improve mobile text and touch targets.

README.md includes setup, route limitations, licensing/AI disclosure. DEMO.md contains the 75-second script. Existing hackathon kit preserved. No deployment performed.

Upgrade: six sourced landmark centers; origin/destination markers; labeled illustrative connections; compact/expanded maps; tile failure/retry; one-shot browser GPS with error recovery; explicit demo origin; truthful unsupported GPS routing; memory-only exact coordinates.

Known limits: all routes/directions remain fictional; GPS is not routing; landmark centers are not entrances or boarding stops. Online tiles are needed for the real basemap. Demo coverage rectangle is not a legal city boundary. Physical-device, screen-reader, and cross-browser testing remain future work.
