/** Corridor references from the supplied October 2026 research, not live navigation. */
import { locations } from './locations.js';
import { roadPaths, getRoadPath, findNearestRoadPath } from './road-paths.js';
export { locations } from './locations.js';
export { roadPaths, getRoadPath, findNearestRoadPath } from './road-paths.js';
const base = 'https://ph.commutetour.com/ph/routes/cdo-routes/';
const thread = 'https://www.reddit.com/r/cagayandeoro/comments/zju4tl/';
export const routeWarning = 'Confirm the signboard, direction, and boarding point with the driver. Routes may vary.';

// Explicit researched pairs only. No automatic reverse, transfer, intermediate
// stop matching, or implied equivalence with similarly named official LPTRP plans.
export const routes = [
  { id: 'legacy-r1-gaisano-carmen', code: 'R1', name: 'Gaisano / Carmen loop', from: 'gaisano', to: 'carmen',
    via: 'Gaisano · Kauswagan / Liceo · Carmen Market · City Hall / Divisoria · Centrio',
    path: roadPaths['divisoria-centrio'],
    sourceUrls: [`${base}cdo-r1-gaisano-carmen-jeep-route/`],
    notes: 'Toward Carmen via Kauswagan / Liceo, then downtown and Centrio. Cogon / Limketkai variants need driver confirmation. R2 follows the opposite loop.',
    pairs: [['gaisano', 'carmen'], ['gaisano', 'divisoria'], ['carmen', 'divisoria'], ['carmen', 'centrio'], ['divisoria', 'centrio'], ['dict', 'centrio'], ['dict', 'divisoria'], ['dict', 'gaisano']] },
  { id: 'legacy-r2-gaisano-agora-cogon-carmen', code: 'R2', name: 'Gaisano / Agora / Cogon / Carmen loop', from: 'gaisano', to: 'carmen',
    via: 'Gaisano · Centrio · SM Downtown · Agora · Limketkai · Cogon · Divisoria · Carmen',
    path: [...roadPaths['centrio-sm'], ...roadPaths['sm-limketkai'].slice(1), ...roadPaths['limketkai-cogon'].slice(1), ...roadPaths['cogon-divisoria'].slice(1)],
    sourceUrls: [`${base}cdo-r2-gaisano-agora-cogon-carmen-jeep-route/`],
    notes: 'Toward Agora / Limketkai, then Cogon, downtown and Carmen. Generally the opposite loop to R1; confirm the unit’s destination.',
    pairs: [['gaisano', 'cogon'], ['gaisano', 'carmen'], ['centrio', 'cogon'], ['centrio', 'divisoria'], ['sm', 'cogon'], ['sm', 'divisoria'], ['agora', 'carmen'], ['limketkai', 'cogon'], ['cogon', 'divisoria'], ['cogon', 'carmen']] },
  { id: 'legacy-c2-patag-ketkai', code: 'C2', name: 'Patag / Carmen / Ketkai', from: 'patag', to: 'limketkai',
    via: 'Patag / Camp Evangelista · Liceo · Marcos Bridge · Gaisano / Centrio · USTP highway · Limketkai',
    path: roadPaths['ustp-limketkai'],
    sourceUrls: ['https://www.reddit.com/r/cagayandeoro/comments/1ib619o/', thread],
    notes: 'Uses the highway / USTP area toward Ketkai. Confirm where to board near campus and whether the unit continues to Limketkai. Directional diversions vary.',
    pairs: [['patag', 'limketkai'], ['patag', 'ustp'], ['liceo', 'ustp'], ['gaisano', 'limketkai'], ['ustp', 'limketkai']] },
  { id: 'legacy-b3-bulua-ketkai-highway', code: 'B3', name: 'Bulua / Gaisano / Ketkai', from: 'bulua', to: 'limketkai',
    via: 'Bulua Highway · Kauswagan · Gaisano · USTP / Lapasan highway · Limketkai',
    path: roadPaths['ustp-limketkai'],
    sourceUrls: ['https://www.reddit.com/r/cagayandeoro/comments/1nqoek6/', thread],
    notes: 'Via C.M. Recto / National Highway. Bulua means the highway corridor, not guaranteed entry into Westbound Terminal. Ask if the unit continues to Ketkai.',
    pairs: [['bulua', 'gaisano'], ['bulua', 'limketkai'], ['gaisano', 'limketkai'], ['ustp', 'limketkai'], ['limketkai', 'bulua']] },
  { id: 'legacy-patag-camp', code: 'Patag', name: 'Patag / Camp Evangelista → Divisoria', from: 'patag', to: 'divisoria',
    via: 'Camp Evangelista · P.N. Roa · R.N. Pelaez · Divisoria', sourceUrls: [thread],
    notes: 'Check the Patag / Camp Evangelista signboard and where the unit terminates. This is distinct from C2 toward Ketkai.', pairs: [['patag', 'divisoria']] },
  { id: 'legacy-iponan-cogon', code: 'Iponan', name: 'Iponan → Cogon', from: 'iponan', to: 'cogon',
    via: 'Iponan · Bulua highway · downtown · Cogon Market', sourceUrls: [thread, `${base}cdo-r1-gaisano-carmen-jeep-route/`],
    notes: 'Choose a city-bound Iponan / Cogon signboard. Bulua Terminal entry varies; ask the driver.', pairs: [['iponan', 'cogon'], ['bulua', 'cogon']] },
  { id: 'legacy-nha-kauswagan', code: 'NHA', name: 'NHA / Kauswagan', from: 'nha', to: 'gaisano',
    via: 'NHA · Kauswagan · Gaisano / Limketkai area', sourceUrls: [thread],
    notes: 'The destination depends on the unit. Confirm Gaisano or Limketkai before boarding.', pairs: [['nha', 'gaisano']] },
  { id: 'legacy-rd-gusa-bugo', code: 'RD', name: 'RD / Gusa / Bugo corridor', from: 'gusa', to: 'cogon',
    via: 'Gusa · Cugman / eastern national highway · downtown / Cogon', sourceUrls: [thread, `${base}cdo-r1-gaisano-carmen-jeep-route/`],
    notes: 'Eastern highway units have different Gusa / Bugo / downtown signboards. Not every RD jeep reaches Bugo. Confirm the actual destination.', pairs: [['gusa', 'cogon']] },
].map(line => ({ ...line, sourceType: 'COMMUTER_REFERENCE', status: 'COMMUTER_DOCUMENTED', statusLabel: 'Commuter reference' }));

const normalize = value => String(value).trim().toLowerCase().replace(/[–—-]/g, ' ').replace(/\s+/g, ' ');
export function searchLocations(query) {
  return locations.filter(place => normalize(`${place.name} ${place.category} ${place.aliases.join(' ')}`).includes(normalize(query)));
}
export function resolveLocation(value) {
  return locations.find(place => [place.name, place.short, ...place.aliases].some(name => normalize(name) === normalize(value)));
}
export const placeById = id => locations.find(place => place.id === id);
export const searchLines = query => jeepneyLines.filter(line => normalize(`${line.code} ${line.name} ${line.via}`).includes(normalize(query)));
export const jeepneyLines = routes.map(line => ({
  ...line, displayCode: line.code,
  directions: line.pairs.map(([originId, destinationId]) => ({
    id: `${originId}-${destinationId}`, originId, destinationId,
    signboard: `${line.code} · ${placeById(destinationId).short}`,
    orderedStops: [originId, destinationId], // Endpoints only, not validated stops.
    path: getRoadPath(originId, destinationId),
  })),
}));
function makeOption(line, direction) {
  const from = placeById(direction.originId);
  const to = placeById(direction.destinationId);
  const id = `${line.id}-${direction.id}`;
  const path = direction.path || getRoadPath(from.id, to.id) || null;
  const steps = [
    { type: 'walk', title: 'Confirm where to board', place: `${from.short} area`, detail: `Ask locally for the ${line.code} boarding point toward ${to.short}. The landmark is a reference, not a verified jeepney stop.`, guideTitle: 'Find the boarding point', action: "I've confirmed the boarding point" },
    { type: 'jeep', title: `Look for ${line.code}`, place: direction.signboard, detail: `Ask the driver if this unit passes ${to.name} before boarding. ${line.notes}`, guideTitle: `Confirm the ${line.code} signboard`, action: "I've confirmed and boarded" },
    { type: 'stop', title: 'Ask where to get off', place: `${to.short} area`, detail: `Tell the driver you are headed to ${to.name} and ask for a safe drop-off. Exact stopping points are not verified.`, guideTitle: `Heading toward ${to.short}`, action: "I've gotten off" },
    { type: 'flag', title: 'Continue to your destination', place: to.name, detail: `Check the remaining walk to ${to.name} locally. This reference does not include walking directions.`, guideTitle: 'Check your final walk', action: "I've arrived" },
  ];
  const isOfficeDemo = from.id === 'dict';
  if (isOfficeDemo) {
    steps[0].title = 'Walk to the Carmen boarding area';
    steps[0].place = 'Near DICT Office · Carmen';
    steps[0].detail = 'For this demo, start at DICT Office on Villarin Street and walk to a nearby Carmen corridor boarding point. The walk and pickup point are illustrative.';
    steps[1].detail = `Take the R1 Gaisano / Carmen loop toward ${to.short}. This demo uses nearby corridor access, not a verified stop outside the office. Confirm the signboard with the driver.`;
  }
  return {
    id, originId: from.id, destinationId: to.id, from, to, code: line.code, lineCodes: [line.code], lineIds: [line.id],
    legs: [{ code: line.code, from: from.id, to: to.id }], name: `${from.short} → ${to.short}`,
    description: `${line.code} corridor reference. Confirm this trip with the driver.`, signboard: direction.signboard,
    boarding: `${from.short} area · confirm locally`, dropoff: `${to.short} area · ask driver`,
    transferCount: 0, rideCount: 1, viaLocations: [], status: line.status, statusLabel: line.statusLabel,
    fare: '₱13', estimatedFare: '₱13',
    path,
    sourceUrls: isOfficeDemo ? [...line.sourceUrls, from.addressSourceUrl] : line.sourceUrls, notes: line.notes, via: line.via,
    ...(isOfficeDemo ? { isDemo: true, status: 'DEMO_ILLUSTRATIVE', statusLabel: 'Demo journey', boarding: 'Near DICT Office · Carmen corridor' } : {}),
    steps: steps.map((item, index) => ({ ...item, description: item.detail, locationId: index < 2 ? from.id : to.id, id: `${id}-step-${index + 1}` })),
  };
}
export const tripOptions = jeepneyLines.flatMap(line => line.directions.map(direction => makeOption(line, direction)));
export const getTripOptions = (fromId, toId) => tripOptions.filter(option => option.originId === fromId && option.destinationId === toId);
export const getTripOption = id => tripOptions.find(option => option.id === id);
export const findRoute = (fromId, toId) => getTripOptions(fromId, toId)[0] || null;

// The demo offers only trips that already have a complete result.
export const getDemoOrigins = () => locations.filter(place => tripOptions.some(option => option.originId === place.id));
export const getDemoDestinations = fromId => locations.filter(place => tripOptions.some(option => option.originId === fromId && option.destinationId === place.id));
export function demoSelection(fromId, toId) {
  const from = getDemoOrigins().find(place => place.id === fromId) || placeById('dict');
  const destinations = getDemoDestinations(from.id);
  return { from, to: destinations.find(place => place.id === toId) || destinations[0] };
}
