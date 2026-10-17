# Routa AI prototype

Implemented October 17, 2026 as an addition to the existing planner. No application dependencies, backend, paid API, model installation, or external AI service were added.

## Try it

1. Open **Try Routa AI** below the normal Home search button. Enter a phrase and choose **Find demo routes**.
2. Review the recognized endpoints, then choose **View demo routes**. For the current corridor dataset, try **From USTP to Limketkai** or **From Gaisano to Carmen**. The parser also recognizes **From USTP to Divisoria**, **Unsa akong sakyan padulong Divisoria?**, and **How do I get to Centrio?**, but explains when their endpoint pair has no configured itinerary.
3. Leave out the origin to use the starting landmark currently selected in the planner. If it is empty, unrecognized, or GPS, choose a starting landmark in the inline selector. GPS is never converted into a pretend landmark route.
4. When several itineraries exist, use **Fewer transfers** or **Simpler journey** on the existing options screen. A short explanation states which available fields were used. You can also include a preference in the phrase, such as **From Gaisano to Carmen, simpler journey please**.
5. Open an itinerary, then **Ask Routa** beside its existing signboard information. Use the four question chips or type English, Bisaya, or Filipino phrases such as **Asa ko mosakay?**, **Asa ko manaog?**, **Saan ako sasakay?**, **Saan ako bababa?**, **May lipat ba?**, or **Unsa nga karatula?**.
6. Close the sheet and continue the existing manual trip guide through arrival. Normal destination selection, maps, trip storage, and optional ride-provider handoffs retain their existing behavior.

## What is simulated

**Routa AI is a rule-based concept demo, not an LLM or routing service.** Pattern matching identifies supported phrases and exact aliases from `locations.js`, which is re-exported by `routes.js`. Shared aliases such as “mall” request clarification. Unknown or extra locations are not guessed. Unsupported pairs never receive a generated route, inferred reverse trip, or newly assembled transfer.

Answers are local templates populated from the selected itinerary's existing boarding, drop-off, transfer count, signboard, and instruction steps. The assistant does not validate those source facts. Missing fields receive “information is unavailable”; unsupported questions receive helpful suggested topics. It never supplies verified stops, fares, travel times, live vehicle locations, or fastest/cheapest claims. When the source marks an itinerary `isDemo`, responses identify fictional instructions; current corridor references instead retain their unverified-stop/driver-confirmation caveat.

Ranking is deterministic and stable. Fewer transfers compares explicit nonnegative integer `transferCount` values. Simpler journey compares transfer count first, then the number of instruction steps. Ties keep dataset order and say so. Neither preference proves a route faster or cheaper. **Less walking is unavailable in the current dataset**, because walking distance is absent. A future dataset can enable it by supplying nonnegative `distanceMeters` on every walk, final-walk (`flag`), and transfer step; counting walk segments alone is not used as a distance estimate. Distance/transfer alternatives in logic tests are isolated test fixtures, never added to the app's routes.

Typed requests and assistant conversations stay in tab memory. Conversations reset when reopened, are bounded to 40 messages, and are not written to storage, URLs, logs, or a service. Existing selected landmark/trip persistence continues through the original planner. The optional OpenStreetMap and provider website behavior is separate from Routa AI.

## Implementation boundary

- `src/routa-intelligence.js`: pure landmark matching, trip intent parsing, question intent/response generation, and route ranking. `parseTripRequest(text, selectedOriginId)` returns `ready`, `missing-origin`, `unsupported-trip`, or `clarify` with structured context. A future model adapter can produce this contract while retaining dataset validation.
- `src/routa-ai.js`: optional Home form, inline recovery, and one reusable native dialog with route context, conversation bubbles, question chips, keyboard dismissal, focus restoration, backdrop dismissal, and viewport adjustment.
- `src/routa-ai.css`: additive styles using the existing teal, cream, amber, font, borders, and spacing conventions.
- `src/app.js` and `src/experience.js`: small lifecycle, detail, and preference hooks. Route definitions and landmark records were not changed by the assistant implementation.

## Verification

Run the documented static server, then:

```powershell
node tests/routa-intelligence.cjs
$env:NODE_PATH='C:\Users\USER-PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node tests/routa-ai.cjs
node tests/routes-research.cjs
```

The logic suite has **7 passing groups** covering recognized endpoints/aliases, missing origins including GPS, ambiguity and unknown locations, unsupported pairs, all **30 current directional itineraries**, route-specific answers in three languages, absent fields, unknown questions, stable ranking, tie handling, immutability, and explicitly measured walking fixtures.

The Routa AI browser suite has **8 passing groups** in installed Chrome through Playwright. At **360px and 390px**, it exercises the existing mobile landmark search → options/preferences → details → all four assistant topics → manual guide → arrival → Home, plus natural-language preferences, refresh, browser Back, origin recovery, unsupported pairs, escaped user text, changed-route context, native modal focus containment, Escape, and reopening. The assistant was checked at **320×640, 390×568, 390×420, 768×900, and 1440×1000**, including the composer and reduced motion. No uncaught application exceptions or external assistant requests were observed. Evidence: `routa-ai-test-results.json` and `routa-ai-screenshots/`.

Current-dataset regression, `tests/routes-research.cjs`, also passed **8 groups**: all 30 directional references and source links, directory/filter/direction/reload interactions, maps with and without sourced points, mobile search through guide and arrival with saved progress, honest unsupported-direction recovery, and Home/options/directory/line/details/empty-state reflow from 320–1440px. Evidence: `route-research-results.json`. Together with the logic and assistant suites, this is **23 passing groups**. Historical suites are scoped separately below.

Visual review covered the Home addition, search preview, selected preferences, boarding conversation, and short-viewport sheet. A background transition that briefly reduced selected-preference text contrast was removed. The assistant transcript follows the latest reply after viewport resizing.

Normal Home validation was separately asserted at 360px and 390px for empty destinations, unknown landmarks, and identical endpoints before completing the mobile flow. These checks pass in the new integration suite.

The shared route/location data changed independently during implementation, replacing the prior D-series fictional routes with corridor references. The new logic/browser tests intentionally read the latest data. The historical `tests/smoke.cjs` was attempted and failed its first old-flow assertion; it still hardcodes D-series fixtures and is not claimed as passing for the updated dataset. Current-dataset regression is checked with `tests/routes-research.cjs`; its ambiguous R1 directory locator was narrowed to the actual R1 link because R2's notes also mention R1.

Physical phones, actual OS keyboards, Safari/Firefox, screen readers, and transport facts were not verified. Short viewports approximate keyboard space; they are not physical-device certification. Existing historical QA documents describe earlier fixture versions and should be read with their stated dates/data scope.
