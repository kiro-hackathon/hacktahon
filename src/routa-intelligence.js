/** Local, deterministic prototype. No model, network calls, or new route facts.
 * UI consumes these plain results; a future parser can implement the same contract.
 */
import { locations, getTripOptions } from './routes.js';

const normalize = value => String(value || '').toLowerCase().normalize('NFKC')
  .replace(/[?!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();

export function matchLandmark(value) {
  const query = normalize(value);
  // Shared aliases such as “mall” must ask for clarification, never pick the first.
  const matches = locations.filter(place => [place.id, place.name, place.short, ...place.aliases]
    .some(name => normalize(name) === query));
  return { place: matches.length === 1 ? matches[0] : null, matches };
}

export function parsePreference(value) {
  const text = normalize(value);
  if (/\b(less walking|less walk|gamay lakaw|konting lakad)\b/.test(text)) return 'walking';
  if (/\b(fewer transfers|less transfers|no transfers|walay balhin|walang lipat)\b/.test(text)) return 'transfers';
  if (/\b(simpler journey|simpler trip|simple journey|simple trip|pinakasimple)\b/.test(text)) return 'simple';
  return null;
}

function cleanSlot(value) {
  return normalize(value).replace(/\b(?:with )?(?:fewer transfers|less transfers|no transfers|less walking|less walk|simpler journey|simpler trip|simple journey|simple trip|gamay lakaw|konting lakad|walay balhin|walang lipat|pinakasimple)\b/g, '')
    .replace(/\b(please|palihog|salamat|po|lang)\b/g, '').replace(/\s+/g, ' ').trim();
}

export function parseTripRequest(text, selectedOriginId = null) {
  const query = cleanSlot(text);
  const preference = parsePreference(text);
  let originText;
  let destinationText;
  const pair = query.match(/^(?:from|gikan(?: sa)?|mula(?: sa)?) (.+?) (?:to|padulong(?: sa)?|paingon(?: sa)?|papunta(?: sa)?|pupunta(?: sa)?) (.+)$/);
  const reverse = query.match(/^(?:to|padulong(?: sa)?|papunta(?: sa)?) (.+?) (?:from|gikan(?: sa)?|mula(?: sa)?) (.+)$/);
  if (pair) [, originText, destinationText] = pair;
  else if (reverse) [, destinationText, originText] = reverse;
  else {
    const destinationOnly = query.match(/^(?:(?:how (?:do i|can i) get|take me|i want to go|unsa akong sakyan|asa ko [muo]sakay|paano (?:ako )?(?:pumunta|makapunta)|anong sasakyan) )?(?:to|sa|padulong(?: sa)?|paingon(?: sa)?|papunta(?: sa)?) (.+)$/);
    destinationText = destinationOnly ? destinationOnly[1] : query;
  }
  const clarify = (message, field = 'destination', matches = []) => ({ status: 'clarify', message, field, matches, preference });
  const target = matchLandmark(destinationText);
  if (!target.place) return clarify(target.matches.length
    ? `Which landmark do you mean: ${target.matches.map(place => place.short).join(', ')}?`
    : 'I couldn’t identify the destination. Try “From USTP to Divisoria”, or choose a supported landmark in the planner.', 'destination', target.matches);
  const start = originText !== undefined ? matchLandmark(originText) : { place: locations.find(place => place.id === selectedOriginId), matches: [] };
  if (!start.place) {
    if (originText !== undefined) return clarify(start.matches.length
      ? `Which starting landmark do you mean: ${start.matches.map(place => place.short).join(', ')}?`
      : 'I couldn’t identify the starting point. Choose a demo landmark such as USTP CDO.', 'origin', start.matches);
    return { status: 'missing-origin', to: target.place, preference, message: `Going to ${target.place.short}. Choose a starting landmark below.` };
  }
  if (start.place.id === target.place.id) return clarify('Your starting point and destination are the same. Choose a different destination.');
  const options = getTripOptions(start.place.id, target.place.id);
  return { status: options.length ? 'ready' : 'unsupported-trip', from: start.place, to: target.place, preference,
    reusedOrigin: originText === undefined,
    message: options.length ? `${start.place.short} → ${target.place.short}. ${originText === undefined ? 'Using your selected starting point. ' : ''}Only itineraries in the current prototype dataset are shown.`
      : `There’s no demo itinerary from ${start.place.short} to ${target.place.short}. Choose another trip in the planner.` };
}

function transfers(option) {
  return Number.isInteger(option.transferCount) && option.transferCount >= 0 ? option.transferCount : null;
}
function walkingDistance(option) {
  if (!Array.isArray(option.steps) || !option.steps.length) return null;
  // Transfers can contain walking; every walk/transfer needs an explicit distance.
  const walks = option.steps.filter(step => ['walk', 'flag', 'transfer'].includes(step.type));
  if (!walks.length || walks.some(step => !Number.isFinite(step.distanceMeters) || step.distanceMeters < 0)) return null;
  return walks.reduce((sum, step) => sum + step.distanceMeters, 0);
}

export function rankTripOptions(options, preference = 'transfers') {
  const metric = option => preference === 'walking' ? walkingDistance(option) : preference === 'simple'
    ? (transfers(option) !== null && option.steps?.length ? [transfers(option), option.steps.length] : null) : transfers(option);
  const supported = options.length > 0 && options.every(option => metric(option) !== null);
  if (!supported) return { options: [...options], supported: false, reason: preference === 'walking'
    ? 'Walking distances aren’t available in these demo steps, so less walking can’t be compared.'
    : 'There isn’t enough structured information to compare this preference. Showing the existing demo order.' };
  const sorted = options.map((option, index) => ({ option, index, score: [].concat(metric(option)) }))
    .sort((a, b) => a.score.reduce((result, value, index) => result || value - b.score[index], 0) || a.index - b.index).map(item => item.option);
  const first = sorted[0];
  let reason;
  if (preference === 'walking') reason = 'Suggested because this sample route has the least recorded walking distance.';
  else if (preference === 'simple') reason = 'Suggested by comparing demo transfers first, then the number of instruction steps.';
  else reason = first.transferCount === 0 ? 'Suggested because this sample route has no transfers.'
    : `Suggested because this sample route has ${first.transferCount} ${first.transferCount === 1 ? 'transfer' : 'transfers'}.`;
  const firstScore = JSON.stringify(metric(first));
  if (sorted.length > 1 && JSON.stringify(metric(sorted[1])) === firstScore) reason += ' Matching routes keep the existing demo order.';
  return { options: sorted, supported: true, reason };
}

export function parseRouteQuestion(value) {
  const text = normalize(value);
  if (/\b(fare|cost|price|pamasahe|pila|magkano|fastest|cheapest|time|how long|minutes|oras|dugay|tagal|traffic|live|real time|gps|location now)\b/.test(text)) return 'unavailable';
  if (/\b(signboard|sign board|sign|karatula|placard)\b/.test(text)) return 'signboard';
  if (/\b(transfer|transfers|balhin|balhinan|lipat|sasakyan ulit)\b/.test(text)) return 'transfers';
  if (/\b(get off|drop off|dropoff|alight|naog|manaog|bababa|baba|bababaan)\b/.test(text)) return 'dropoff';
  if (/\b(board|boarding|get on|sakay|mosakay|musakay|sumakay|sasakay|sakyan)\b/.test(text)) return 'boarding';
  return 'unknown';
}

export function answerRouteQuestion(question, option) {
  const intent = parseRouteQuestion(question);
  const unavailable = info => `${info} information is unavailable for this sample route.`;
  if (!option) {
    const text = normalize(question);
    if (intent === 'unavailable' || /\b(fare|pamasahe|pila|cost|price|magkano)\b/.test(text)) {
      return 'Estimated standard jeepney fare in Cagayan de Oro is ₱13. Discounted fare applies for students, senior citizens, and PWDs.';
    }
    if (/\b(centrio|ayala)\b/.test(text)) {
      return 'Centrio Mall is accessible via jeepney lines like R1, R2, and C2 along Corrales Avenue and Claro M. Recto Avenue. Estimated fare: ₱13.';
    }
    if (/\b(limketkai|ketkai)\b/.test(text)) {
      return 'Limketkai Center is served by Lapasan Highway jeepneys and C2 route lines. Estimated fare: ₱13.';
    }
    if (/\b(cogon)\b/.test(text)) {
      return 'Cogon Market is one of CDO’s main public market transit hubs, connected by routes R1, C2, and eastbound/westbound lines. Estimated fare: ₱13.';
    }
    if (/\b(ustp)\b/.test(text)) {
      return 'USTP CDO is located along Claro M. Recto Avenue (Highway). Jeepneys along the Lapasan and R1 corridors stop near the campus. Estimated fare: ₱13.';
    }
    if (/\b(divisoria)\b/.test(text)) {
      return 'Divisoria is the central downtown hub. Most classic CDO jeepney lines pass through or loop at Divisoria. Estimated fare: ₱13.';
    }
    if (/\b(bulua)\b/.test(text)) {
      return 'Bulua Westbound Terminal connects city jeepneys to provincial routes and western barangays. Estimated fare: ₱13.';
    }
    return 'Choose a demo itinerary first so I can answer about its steps and boarding points.';
  }
  const demoNote = option.isDemo ? ' These are fictional, unverified demo instructions.'
    : ' These are sample instructions. Exact boarding and stopping points are not verified; confirm them with the driver.';
  if (intent === 'unavailable') return 'Verified fares, travel times, live vehicle locations, and fastest or cheapest comparisons are unavailable. I can explain the selected sample’s boarding, drop-off, transfers, or signboards.';
  if (intent === 'boarding') return option.boarding ? `Board at ${option.boarding}.${option.steps?.find(step => step.type === 'walk')?.detail ? ` ${option.steps.find(step => step.type === 'walk').detail}` : ''}${demoNote}` : unavailable('Boarding');
  if (intent === 'dropoff') return option.dropoff ? `Your final drop-off is ${option.dropoff}.${option.steps?.find(step => step.type === 'flag')?.detail ? ` ${option.steps.find(step => step.type === 'flag').detail}` : ''}${demoNote}` : unavailable('Drop-off');
  if (intent === 'transfers') {
    if (transfers(option) === null) return unavailable('Transfer');
    if (!option.transferCount) return `This sample route has no transfers.${demoNote}`;
    const steps = option.steps?.filter(step => step.type === 'transfer' && (step.place || step.detail)) || [];
    return `This sample route has ${option.transferCount} ${option.transferCount === 1 ? 'transfer' : 'transfers'}.${steps.length ? ` ${steps.map(step => [step.place, step.detail].filter(Boolean).join('. ')).join(' ')}` : ' Transfer-point information is unavailable.'}${demoNote}`;
  }
  if (intent === 'signboard') {
    if (!option.signboard) return unavailable('Signboard');
    const nextRides = option.steps?.filter(step => step.type === 'jeep').slice(1) || [];
    return `First, look for “${option.signboard}”.${nextRides.map(step => ` Next ride: ${step.detail || 'Signboard information is unavailable.'}`).join('')}${option.transferCount > nextRides.length ? ' Remaining signboard information is unavailable.' : ''}${demoNote}`;
  }
  return 'I didn’t recognize that question. Try asking where to board, where to get off, whether there are transfers, or which signboard to look for.';
}
