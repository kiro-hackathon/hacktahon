# RoutaCagayan
Student commuters choose two Cagayan de Oro landmarks and understand a fictional jeepney journey in four steps.

Stack: static HTML, CSS, ES modules; no build, dependencies, or network services.
Scope: trip search with accessible suggestions; curated recommendations; four-step instructions and schematic.
Out of scope: real navigation, verified route data, fares, times, accounts, backend, AI models.
Visual direction: transit teal, warm off-white, amber route signage, original SVG jeepney, mobile-first planner.

Acceptance:
- Given USTP and Divisoria, searching displays D1 with matching endpoints.
- Given a sample route, all four steps match the direction selected.
- Given empty, unknown, or identical places, show actionable validation and preserve inputs.
- Given unsupported Centrio → Cogon, explain coverage and offer working example trips.
- Given 375px and 390px viewports, the workflow has no horizontal overflow.

Research (2026-10-17): landmark identities only; no route facts established.
- USTP: https://www.ustp.edu.ph/cdeo/
- Centrio: https://www.ayalamalls.com/explore/ayala-centrio/store/AYALA-CENTRIO-1435180
- SM: https://www.smprime.com/latest_news/manila-bulletin-sms-premier-mall-opens-in-downtown-cdo-on-may-12/
All D-series routes, stops, and directions are fictional. Other landmark names are supplied by the brief.
The user's 60-minute limit overrides the bundled three-hour schedule.

## Requested map/geolocation upgrade
Preserve the approved UI. Add vendored Leaflet + online OSM tiles as compact, expandable sections; keep the illustration available offline. Reusable sourced feature centers live in src/locations.js, with source evidence in landmark-source.json. Browser GPS is click-initiated, optional, memory-only, and never silently converted to a demo origin or valid jeepney route. All original route fixtures remain unchanged.

## Complete mobile experience — final authorized scope
The later complete-experience brief supersedes the interrupted audit's no-new-features restriction. Keep the brand and desktop hero. Add focused mobile search, option comparison/selection, route details with signboard, manual guide and arrival, shared-data line directory, and Home/Jeepneys/My Trip navigation. Preserve map, GPS, and ride-app handoffs. Two explicitly fictional complete transfer alternatives via Centrio are authorized for the primary pair; other pairs retain direct fixtures. Progress may persist as known fixture IDs and manual step indices, never exact GPS. The final flow and review are documented in .design/mobile-experience-report.md and DEMO-90-SECONDS.md.
