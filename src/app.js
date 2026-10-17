import { locations, routes, searchLocations, resolveLocation, findRoute } from './routes.js';
import { detectLocation } from './geolocation.js';
import { createTripMap, mapMarkup } from './map.js';
import { addRideOptions, closeRideHandoff } from './ride-handoff.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const paths = {
  campus: '<path d="m3 9 9-5 9 5-9 5-9-5Zm4 3v6c3 2 7 2 10 0v-6M21 9v7"/>',
  city: '<path d="M3 21h18M5 21V10h5v11m0-16h6v16m0-8h4v8M12 8h2m-2 4h2m-2 4h2M7 13v1m0 3v1M18 16v1"/>',
  bag: '<path d="M5 8h14l2 13H3L5 8Zm3 0V6a4 4 0 0 1 8 0v2M8 11v1m8-1v1"/>',
  building: '<path d="M3 21h18M5 21V8l7-4 7 4v13M8 10h2m4 0h2m-8 4h2m4 0h2m-6 7v-3h4v3"/>',
  market: '<path d="M4 10v11h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 21v-6h6v6M9 4v6m6-6v6"/>',
  shop: '<path d="M4 21V8h16v13M3 8l2-4h14l2 4M8 12h8m-8 4h8M2 21h20"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  jeep: '<rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 19v2m8-2v2M4 12h16M8 5V3h8v2M8 16h1m6 0h1M8 8v2m4-2v2m4-2v2"/>',
  walk: '<circle cx="14" cy="4" r="2"/><path d="m10 10 3-3 3 4 4 1M5 13l4-1 2-3m2 0-2 7-4 5m4-5 5 2 1 3"/>',
  stop: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  flag: '<path d="M5 22V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  route: '<circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><path d="M6 7v7a4 4 0 0 0 4 4h1m7-1v-7a4 4 0 0 0-4-4h-1"/>',
};
const icon = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.stop}</svg>`;
const screens = ['home', 'result', 'empty'];
const origin = $('#origin');
const destination = $('#destination');
let currentScreen = 'home';
let currentPosition = null;
let locationRequest = 0;
let homeMap;
let resultMap;
let emptyMap;

function resetLocation(message = 'Optional. Your coordinates stay in this tab.') {
  locationRequest += 1;
  currentPosition = null;
  origin.classList.remove('gps-origin');
  $('.origin-symbol').classList.remove('gps-symbol');
  $('#use-location').disabled = false;
  $('#use-location span').textContent = 'Use my current location';
  $('#location-status').textContent = message;
}

function selectedOrigin() {
  return currentPosition && origin.value === 'Current location'
    ? { id: 'current', name: 'Current location', short: 'Current location', ...currentPosition }
    : resolveLocation(origin.value);
}

function updateHomeMap() {
  const from = selectedOrigin();
  const to = resolveLocation(destination.value);
  homeMap?.update({ from, to, connection: Boolean(from && to && findRoute(from.id, to.id)) });
}

function announce(message) { $('#announcer').textContent = message; }

function showScreen(name) {
  closeRideHandoff();
  if (name !== 'result') { resultMap?.dispose(); resultMap = null; }
  if (name !== 'empty') { emptyMap?.dispose(); emptyMap = null; }
  screens.forEach(screen => { $(`#${screen}-screen`).hidden = screen !== name; });
  currentScreen = name;
  closeSuggestions();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showHome(focus = true) {
  showScreen('home');
  document.title = 'RoutaCagayan — Your next sakay, made simple.';
  if (focus) destination.focus({ preventScroll: true });
  updateHomeMap();
}

function clearError() {
  $('#form-error').hidden = true;
  [origin, destination].forEach(input => input.removeAttribute('aria-invalid'));
}

function showError(message, input) {
  const error = $('#form-error');
  error.textContent = message;
  error.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  input.focus();
  closeSuggestions();
}

// Comboboxes accept free text but only resolve known locations on submission.
const combos = [origin, destination].map(input => ({ input, list: $(`#${input.id}-list`), matches: [], active: -1 }));

function closeSuggestions(except) {
  combos.forEach(combo => {
    if (combo === except) return;
    combo.list.hidden = true;
    combo.input.setAttribute('aria-expanded', 'false');
    combo.input.removeAttribute('aria-activedescendant');
    combo.active = -1;
  });
}

function activateOption(combo, index) {
  combo.active = index;
  [...combo.list.querySelectorAll('[role="option"]')].forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
  if (index >= 0) {
    const selected = combo.list.children[index];
    combo.input.setAttribute('aria-activedescendant', selected.id);
    selected.scrollIntoView({ block: 'nearest' });
  } else combo.input.removeAttribute('aria-activedescendant');
}

function chooseLocation(combo, place) {
  if (combo.input === origin) resetLocation();
  combo.input.value = place.name;
  clearError();
  closeSuggestions();
  updateShortcuts();
  announce(`${place.name} selected as ${combo.input === origin ? 'starting point' : 'destination'}.`);
}

function openSuggestions(combo, force = false) {
  if (combo.input === origin && currentPosition && origin.value === 'Current location') {
    combo.matches = [];
    closeSuggestions();
    return;
  }
  closeSuggestions(combo);
  combo.active = -1;
  combo.input.removeAttribute('aria-activedescendant');
  combo.matches = searchLocations(combo.input.value);
  combo.list.classList.toggle('no-matches', combo.matches.length === 0);
  if (!force && resolveLocation(combo.input.value)) {
    closeSuggestions();
    return;
  }
  combo.list.innerHTML = combo.matches.length
    ? combo.matches.map((place, i) => `<li id="${combo.input.id}-option-${i}" role="option" aria-selected="false" data-place="${place.id}"><strong>${escape(place.name)}</strong><small>${escape(place.category)} · Cagayan de Oro</small></li>`).join('')
    : '<li class="no-suggestions" role="presentation">No matching landmark. Try USTP, Divisoria, Centrio, Limketkai, Cogon, or SM Downtown.</li>';
  combo.list.hidden = false;
  combo.input.setAttribute('aria-expanded', 'true');
}

combos.forEach(combo => {
  combo.input.addEventListener('input', () => { if (combo.input === origin) resetLocation(); clearError(); openSuggestions(combo); updateShortcuts(); });
  combo.input.addEventListener('focus', () => openSuggestions(combo));
  combo.input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeSuggestions(); return; }
    if (event.key === 'Tab') { closeSuggestions(); return; }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (combo.list.hidden) openSuggestions(combo, true);
      if (!combo.matches.length) return;
      const next = event.key === 'ArrowDown' ? (combo.active + 1) % combo.matches.length : (combo.active <= 0 ? combo.matches.length - 1 : combo.active - 1);
      activateOption(combo, next);
    }
    if (event.key === 'Enter' && !combo.list.hidden && combo.active >= 0) {
      event.preventDefault();
      chooseLocation(combo, combo.matches[combo.active]);
    }
  });
  combo.list.addEventListener('pointerdown', event => {
    const option = event.target.closest('[data-place]');
    if (!option) return;
    event.preventDefault();
    chooseLocation(combo, locations.find(place => place.id === option.dataset.place));
  });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.autocomplete')) closeSuggestions();
});

$('#popular-destinations').innerHTML = locations.map(place => `<button type="button" class="destination-card" data-destination="${place.id}" aria-pressed="false" aria-label="Set destination to ${escape(place.name)}"><span class="place-icon">${icon(place.icon)}</span><span class="place-arrow" aria-hidden="true">↗</span><strong>${escape(place.short)}</strong><small>${escape(place.category)}</small></button>`).join('');

function updateShortcuts() {
  const place = resolveLocation(destination.value);
  const start = resolveLocation(origin.value);
  document.querySelectorAll('[data-destination]').forEach(button => {
    const location = locations.find(item => item.id === button.dataset.destination);
    const isStart = location.id === start?.id;
    button.setAttribute('aria-pressed', String(location.id === place?.id && !isStart));
    button.disabled = isStart;
    button.querySelector('small').textContent = isStart ? 'Your starting point' : location.category;
    button.setAttribute('aria-label', isStart ? `${location.name} is your starting point` : `Set destination to ${location.name}`);
    button.querySelector('.place-arrow').textContent = isStart ? '✓' : '↗';
  });
  updateHomeMap();
}

$('#popular-destinations').addEventListener('click', event => {
  const button = event.target.closest('[data-destination]');
  if (!button) return;
  const place = locations.find(item => item.id === button.dataset.destination);
  chooseLocation(combos[1], place);
  // Place the next action in view on a phone after selecting a shortcut below the form.
  $('#find-button').focus({ preventScroll: true });
  $('#trip-form').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

$('#swap-button').addEventListener('click', () => {
  if (currentPosition) return showError('Current location is a starting point only. Choose a landmark starting point to swap places.', origin);
  resetLocation();
  [origin.value, destination.value] = [destination.value, origin.value];
  clearError();
  updateShortcuts();
  announce('Starting point and destination swapped.');
});

function schematic(route) {
  return `<svg class="schematic" viewBox="0 0 390 360" role="img" aria-label="Sample journey from ${escape(route.from.name)} to ${escape(route.to.name)}: walk, ride ${route.code}, and walk. Not a map.">
    <defs><pattern id="journey-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#cad9c5"/></pattern></defs>
    <rect width="390" height="360" fill="url(#journey-dots)"/>
    <path d="M52 57v57m0 162v42" fill="none" stroke="#7e9484" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path d="M52 114v30q0 23 23 23h204q22 0 22 22v44q0 22-22 22H75q-23 0-23 23" fill="none" stroke="#fff" stroke-width="13"/>
    <path d="M52 114v30q0 23 23 23h204q22 0 22 22v44q0 22-22 22H75q-23 0-23 23" fill="none" stroke="#147d76" stroke-width="5" stroke-linecap="round"/>
    <circle cx="52" cy="47" r="8" fill="#fff" stroke="#147d76" stroke-width="3"/>
    <circle cx="52" cy="114" r="6" fill="#147d76" stroke="#fff" stroke-width="3"/>
    <circle cx="52" cy="278" r="6" fill="#147d76" stroke="#fff" stroke-width="3"/>
    <circle cx="52" cy="325" r="10" fill="#e8a43b"/><circle cx="52" cy="325" r="3" fill="#fff"/>
    <g font-family="Segoe UI,Arial,sans-serif" fill="#142b36"><text x="77" y="46" font-size="13" font-weight="700">${escape(route.from.short)}</text><text x="77" y="64" font-size="9" fill="#637378">Your starting point</text><text x="76" y="111" font-size="10" font-weight="600">Demo boarding point</text><text x="77" y="286" font-size="10" font-weight="600">Demo drop-off</text><text x="77" y="330" font-size="13" font-weight="700">${escape(route.to.short)}</text></g>
    <g transform="translate(154 188)"><rect width="96" height="46" rx="8" fill="#147d76"/><text x="48" y="20" text-anchor="middle" fill="white" font-family="Segoe UI,Arial,sans-serif" font-size="17" font-weight="800">${route.code}</text><text x="48" y="34" text-anchor="middle" fill="#dcefe1" font-family="Segoe UI,Arial,sans-serif" font-size="7" letter-spacing="1">DEMO JEEPNEY</text></g>
  </svg>`;
}

function renderResult(route, focus = true) {
  resultMap?.dispose();
  $('#result-screen').innerHTML = `<button class="back-button" data-action="back">${icon('arrow')}Change trip</button>
    <div class="result-topline"><div><div class="eyebrow">YOUR NEXT SAKAY</div><h1 class="result-title" id="result-title" tabindex="-1">${escape(route.from.short)} <span aria-hidden="true">→</span><span class="sr-only">to</span> ${escape(route.to.short)}</h1><p class="result-kicker">One jeepney. Four simple steps. Here’s your example journey.</p></div><span class="demo-pill">FICTIONAL DEMO ROUTE</span></div>
    <div class="result-layout"><div><article class="recommendation" aria-labelledby="route-name"><div class="recommendation-label">${icon('check')} YOUR DEMO JEEPNEY</div><div class="route-identity"><span class="route-badge">${route.code}<small>DEMO</small></span><div><h2 id="route-name">${escape(route.name)}</h2><p>Board: ${escape(route.boarding)}<br>Get off: ${escape(route.dropoff)}</p></div></div><div class="route-meta"><span>${icon('jeep')}1 jeepney</span><span>${icon('route')}No transfers</span><span>Fictional example</span></div></article>
    <section class="journey-steps" aria-labelledby="steps-title"><h2 id="steps-title">Your journey, step by step</h2><p>From your first walk to your final stop.</p><ol class="timeline">${route.steps.map((step, i) => `<li><span class="step-icon">${icon(step.type)}</span><div class="step-body"><h3><span class="sr-only">Step ${i + 1}: </span>${escape(step.title)}</h3><strong>${escape(step.place)}</strong><p>${escape(step.detail)}</p></div></li>`).join('')}</ol></section></div>
    <aside class="journey-panel" aria-labelledby="diagram-title"><div class="eyebrow">THE BIG PICTURE</div><h2 id="diagram-title">A little less guesswork.</h2><p>See how the pieces of your sample trip connect.</p>${schematic(route)}<div class="diagram-legend"><span><i class="legend-walk"></i>Walk</span><span><i class="legend-ride"></i>Ride the jeepney</span></div><div class="diagram-disclaimer">${icon('info')}<span>A schematic, not a map. Stops and distances are illustrative. Don’t use this diagram for navigation.</span></div></aside></div>
    <p class="result-disclosure"><strong>Demo only.</strong> ${route.code} is an invented route code. All boarding points, stops, and instructions above are fictional and unverified. Check local transport information before traveling.</p>`;
  showScreen('result');
  addRideOptions($('#result-screen .journey-steps'), { origin: route.from.name, destination: route.to.name });
  const panel = $('#result-screen .journey-panel');
  panel.querySelector('.schematic').insertAdjacentHTML('beforebegin', mapMarkup('result-trip-map'));
  resultMap = createTripMap($('#result-trip-map'), { from: route.from, to: route.to, connection: true });
  document.title = `${route.from.short} to ${route.to.short} — Demo trip | RoutaCagayan`;
  if (focus) $('#result-title').focus({ preventScroll: true });
  announce(`Fictional ${route.code} example found. ${route.from.name} to ${route.to.name}. Four journey steps.`);
}

function renderEmpty(from, to, focus = true) {
  emptyMap?.dispose();
  const examples = routes.filter(route => route.from === from.id || route.to === from.id).slice(0, 3);
  $('#empty-screen').innerHTML = `<button class="back-button" data-action="back">${icon('arrow')}Change trip</button><div class="empty-content"><div class="empty-icon">${icon('route')}</div><span class="demo-pill">A SMALL DEMO, FOR NOW</span><h1 id="empty-title" tabindex="-1">This trip isn’t in our<br>demo yet.</h1><p>We don’t have a sample for <strong>${escape(from.name)} → ${escape(to.name)}</strong>. Your places are saved in the planner. Try a supported example below, or change your trip.</p><button class="primary-button" data-action="back">Change my trip <span aria-hidden="true">→</span></button></div><section class="supported-options"><h2>Try a journey from ${escape(from.short)}</h2>${examples.map(route => {
    const toId = route.from === from.id ? route.to : route.from;
    const target = locations.find(place => place.id === toId);
    return `<button class="example-trip" data-from="${from.id}" data-to="${toId}"><span>${route.code}</span><span>${escape(from.short)} → ${escape(target.short)}</span><span aria-hidden="true">→</span></button>`;
  }).join('')}</section>`;
  showScreen('empty');
  $('#empty-screen .supported-options').insertAdjacentHTML('beforebegin', mapMarkup('empty-trip-map', 'See the selected landmarks'));
  emptyMap = createTripMap($('#empty-trip-map'), { from, to, connection: false });
  document.title = 'Try another demo journey | RoutaCagayan';
  if (focus) $('#empty-title').focus({ preventScroll: true });
  announce(`No demo route for ${from.name} to ${to.name}. Try one of the supported examples.`);
}

function planTrip(from, to, push = true) {
  resetLocation();
  origin.value = from.name;
  destination.value = to.name;
  clearError();
  updateShortcuts();
  if (push) history.pushState({ from: from.id, to: to.id }, '', `#trip/${from.id}/${to.id}`);
  const route = findRoute(from.id, to.id);
  if (route) renderResult(route);
  else renderEmpty(from, to);
}

$('#trip-form').addEventListener('submit', event => {
  event.preventDefault();
  clearError();
  closeSuggestions();
  if (!origin.value.trim()) return showError('Choose a starting point to begin your trip.', origin);
  if (!destination.value.trim()) return showError('Choose a destination, or pick a landmark below.', destination);
  const from = resolveLocation(origin.value);
  const to = resolveLocation(destination.value);
  if (currentPosition && origin.value === 'Current location') {
    if (!to) return showError('Choose one of the six CDO landmarks as your destination.', destination);
    history.pushState({ screen: 'gps', to: to.id }, '', `#location/${to.id}`);
    renderGpsTrip(to);
    return;
  }
  if (!from) return showError('We don’t recognize that starting point. Choose one of the six CDO landmarks.', origin);
  if (!to) return showError('We don’t recognize that destination. Choose one of the six CDO landmarks.', destination);
  if (from.id === to.id) return showError('You’ve picked the same place twice. Choose a different destination.', destination);
  planTrip(from, to);
});

document.addEventListener('click', event => {
  const back = event.target.closest('[data-action="back"]');
  if (back) {
    history.pushState({ screen: 'home' }, '', location.pathname + location.search);
    showHome();
    closeSuggestions();
  }
  const example = event.target.closest('[data-from][data-to]');
  if (example) planTrip(locations.find(place => place.id === example.dataset.from), locations.find(place => place.id === example.dataset.to));
});

$('#plan-link').addEventListener('click', event => {
  event.preventDefault();
  if (currentScreen !== 'home') history.pushState({ screen: 'home' }, '', location.pathname + location.search);
  showHome();
});

function restoreLocation() {
  const gpsMatch = location.hash.match(/^#location\/([a-z]+)$/);
  if (gpsMatch) {
    const to = locations.find(place => place.id === gpsMatch[1]);
    if (currentPosition && to) { renderGpsTrip(to); return; }
    history.replaceState({ screen: 'home' }, '', location.pathname + location.search);
    resetLocation('Your GPS position wasn’t saved. Detect it again, choose a landmark, or try the demo location.');
    origin.value = '';
    showHome(false);
    return;
  }
  const match = location.hash.match(/^#trip\/([a-z]+)\/([a-z]+)$/);
  const from = match && locations.find(place => place.id === match[1]);
  const to = match && locations.find(place => place.id === match[2]);
  if (from && to && from.id !== to.id) planTrip(from, to, false);
  else showHome(false);
}
window.addEventListener('popstate', restoreLocation);

const dialog = $('#about-dialog');
['#how-button', '#about-demo'].forEach(selector => $(selector).addEventListener('click', () => { closeSuggestions(); dialog.showModal(); }));
['#close-dialog', '#got-it'].forEach(selector => $(selector).addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });

function renderGpsTrip(to) {
  emptyMap?.dispose();
  const from = selectedOrigin();
  $('#empty-screen').innerHTML = `<button class="back-button" data-action="back">${icon('arrow')}Change trip</button><div class="empty-content"><div class="empty-icon">${icon('stop')}</div><span class="demo-pill">GPS POSITION · NO LIVE ROUTING</span><h1 id="empty-title" tabindex="-1">Live jeepney routing<br>isn’t available yet.</h1><p>Your detected position is shown on the map with <strong>${escape(to.name)}</strong>. We can’t recommend a verified jeepney from GPS coordinates. ${currentPosition.inDemoArea ? 'Choose a demo landmark to explore a fictional sample trip.' : 'Your position is outside our Cagayan de Oro demo area. You can still explore a clearly labeled sample.'}</p><button class="primary-button" data-action="back">Choose a starting landmark <span aria-hidden="true">→</span></button></div>${mapMarkup('gps-trip-map', 'View your position and destination')}<section class="supported-options"><h2>Switch to a fictional demo trip</h2><p class="gps-demo-explanation">This replaces your GPS starting point with a configured landmark. It does not move your real location.</p><button class="example-trip" data-gps-demo="${to.id}"><span>DEMO</span><span>Try demo location: USTP CDO</span><span aria-hidden="true">→</span></button></section>`;
  showScreen('empty');
  const mapSection = $('#gps-trip-map');
  mapSection.open = true;
  emptyMap = createTripMap(mapSection, { from, to, connection: false });
  document.title = 'GPS location — No live routing | RoutaCagayan';
  $('#empty-title').focus({ preventScroll: true });
  announce('Location detected. Live jeepney routing is not available. Choose a starting landmark or switch to the demo.');
}

$('#use-location').addEventListener('click', async () => {
  closeSuggestions();
  const request = ++locationRequest;
  $('#use-location').disabled = true;
  $('#use-location span').textContent = 'Detecting location…';
  $('#location-status').textContent = 'Waiting for your browser’s location permission. You can still choose a landmark instead.';
  try {
    const position = await detectLocation();
    if (request !== locationRequest) return;
    currentPosition = position;
    origin.value = 'Current location';
    origin.classList.add('gps-origin');
    $('.origin-symbol').classList.add('gps-symbol');
    clearError();
    $('#location-status').textContent = position.inDemoArea
      ? 'Location detected. Live jeepney routing isn’t available; choose a demo landmark for sample directions.'
      : 'Location detected outside our Cagayan de Oro demo area. Choose a landmark or try the separate demo location.';
    updateShortcuts();
    $('#home-trip-map').open = true;
    announce('Current location selected. Exact coordinates are kept only in this tab.');
  } catch (error) {
    if (request !== locationRequest) return;
    $('#location-status').textContent = error.message;
  } finally {
    if (request === locationRequest) {
      $('#use-location').disabled = false;
      $('#use-location span').textContent = 'Use my current location';
    }
  }
});

function useDemoLocation() {
  chooseLocation(combos[0], locations.find(place => place.id === 'ustp'));
  $('#location-status').textContent = 'Demo location selected: USTP CDO. This is a sample landmark, not your detected position.';
}
$('#demo-location').addEventListener('click', useDemoLocation);
document.addEventListener('click', event => {
  const demo = event.target.closest('[data-gps-demo]');
  if (!demo) return;
  const to = locations.find(place => place.id === demo.dataset.gpsDemo);
  useDemoLocation();
  history.pushState({ screen: 'home' }, '', location.pathname + location.search);
  showHome();
  if (to.id === 'ustp') {
    destination.value = '';
    announce('Demo starting point set to USTP CDO. Choose a different destination.');
  } else destination.value = to.name;
  updateShortcuts();
  closeSuggestions();
  $('#find-button').focus({ preventScroll: true });
});

$('#home-map-slot').innerHTML = mapMarkup('home-trip-map', 'Explore Cagayan de Oro');
homeMap = createTripMap($('#home-trip-map'));
restoreLocation();
updateShortcuts();
