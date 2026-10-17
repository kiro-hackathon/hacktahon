# RoutaCagayan — 90-second final demonstration

Run `python -m http.server 8080 --bind 127.0.0.1` from the project root. Open http://127.0.0.1:8080/?v=complete#home at 390px. Use a clean browser context for an empty My Trip, or complete a saved guide first. Maps are optional; the demonstration works without their tiles.

**0–12s — The student’s problem**

“I’m a new student at USTP CDO. I want to reach Divisoria, but I don’t know what jeepney to look for. RoutaCagayan puts the next decision in front of me.”

Show the starting point, GPS-off label, destination input, and three-item navigation.

**12–27s — Search**

“I tap the destination, search Divisoria, and choose the matching landmark. I can go back without losing my choices. Then I find my jeepney.”

Tap destination → type `div` → select Divisoria → Find my jeepney.

**27–43s — Compare and understand**

“These are clearly fictional examples: a direct D1 journey or a D2/D6 transfer via Centrio. Each option shows the signboard, boarding point, drop-off, and number of rides. I’ll choose the direct example.”

Tap D1 View directions. Point to the signboard and four steps. The existing optional map and ride-app handoffs remain available.

**43–65s — Follow, save, resume**

“I start the manual guide and confirm each step myself. This isn’t live navigation. If I leave, My Trip saves my progress. I can resume at the same step, even after refreshing.”

Start trip guide → I’m at the boarding point → Exit guide → Save and leave → Resume trip guide.

**65–78s — Arrival**

“I confirm boarding, getting off, and the final walk. You’re here—salamat sa pagsakay! The guide is completed and cleared, while my search remains available.”

I’ve boarded → I’ve gotten off → I’ve arrived → Plan another trip.

**78–90s — Explore and explain limits**

“Jeepneys lets me search the same demo lines and choose their configured direction. GPS is optional; verified real-world routes and booking integrations are future work. Today, the complete search-to-arrival interaction works.”

Tap Jeepneys → search D1 → open the line. End on its explicit DEMO signboard and ordered example stops.

## Reliable links and recovery

- Options: http://127.0.0.1:8080/#options/ustp/divisoria
- Direct details: http://127.0.0.1:8080/#trip/ustp/divisoria
- Transfer details: http://127.0.0.1:8080/#trip/ustp/divisoria/via-centrio-ustp-divisoria
- Directory: http://127.0.0.1:8080/#jeepneys
- Saved guide: http://127.0.0.1:8080/#my-trip
- GPS denied: use the separate Try demo location button; never present that as a detected GPS reading.
- An arrival screen confirms manual progress only. No real booking, pickup transfer, price, ETA, stop detection, or physical arrival is simulated.

Evidence: [final review](../.design/mobile-experience-report.md), [QA](QA.md), and the four browser test-result records.
