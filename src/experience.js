import { locations, jeepneyLines, getTripOptions, getTripOption, placeById, resolveLocation, searchLocations, searchLines, routeWarning, getDemoOrigins, getDemoDestinations, demoSelection } from './routes.js';
import { createTripMap, mapMarkup } from './map.js';
import { rankTripOptions } from './routa-intelligence.js';
import { icon } from './icons.js';

const storageKey = 'routacagayan.demo.v1';
const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const badges = option => `<span class="option-badges">${option.lineCodes.map(code => `<span class="mini-route-badge" data-long="${code.length > 3}">${code}<small>ROUTE</small></span>`).join('')}</span>`;
const disclosure = `<p class="experience-disclosure">Commuter references · ${routeWarning}</p>`;
const sources = line => `<p class="experience-disclosure">${esc(line.statusLabel)} · ${line.sourceUrls.map((url, i) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Source${i ? ` ${i + 1}` : ''} ↗</a>`).join(' · ')}</p>`;

export function createExperience(hooks) {
  const $ = selector => document.querySelector(selector);
  let state = { activeTrip: null, selectedOptionId: null, completedOptionId: null, lastSearch: null };
  let storageAvailable = true;
  let viewMap;
  let currentView = 'home';
  let draft;
  let searchField = 'destination';
  let searchLocal = false;
  let closingSearch = false;
  let promptAction;
  let routePreference = 'transfers';

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved?.version === 1) {
      const active = saved.activeTrip;
      const option = active && getTripOption(active.optionId);
      if (option && Number.isInteger(active.stepIndex) && active.stepIndex >= 0 && active.stepIndex < option.steps.length) {
        state.activeTrip = { optionId: option.id, stepIndex: active.stepIndex, status: 'paused' };
      }
      if (getTripOption(saved.selectedOptionId)) state.selectedOptionId = saved.selectedOptionId;
      if (getTripOption(saved.completedOptionId)) state.completedOptionId = saved.completedOptionId;
      if (placeById(saved.lastSearch?.originId) && placeById(saved.lastSearch?.destinationId)) state.lastSearch = { originId: saved.lastSearch.originId, destinationId: saved.lastSearch.destinationId };
    }
  } catch {
    try { localStorage.removeItem(storageKey); }
    catch { storageAvailable = false; }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, ...state })); }
    catch { storageAvailable = false; }
  }
  function rememberSearch(from, to) {
    if (!from || !to) return;
    state.lastSearch = { originId: from.id, destinationId: to.id };
    save();
  }
  if (state.lastSearch) hooks.applyForm({ origin: placeById(state.lastSearch.originId).name, destination: placeById(state.lastSearch.destinationId).name });

  const screenNames = ['options', 'directory', 'line', 'mytrip', 'guide', 'arrival'];
  screenNames.forEach(name => {
    const section = document.createElement('section');
    section.id = `${name}-screen`;
    section.className = `experience-screen ${name}-screen`;
    section.hidden = true;
    $('main').append(section);
  });
  $('.site-header nav').insertAdjacentHTML('beforeend', `<a href="#jeepneys" data-main-nav="directory">${icon('jeep')}<span>Routes</span></a><a href="#my-trip" data-main-nav="mytrip">${icon('trip')}<span>My Trip</span></a>`);
  document.body.insertAdjacentHTML('beforeend', `<nav class="bottom-nav" id="bottom-nav" aria-label="Main app navigation"><a href="#home" data-main-nav="home">${icon('home')}<span>Home</span></a><a href="#jeepneys" data-main-nav="directory">${icon('jeep')}<span>Routes</span></a><a href="#my-trip" data-main-nav="mytrip">${icon('trip')}<span>My Trip</span></a></nav><div class="details-action" id="details-action" hidden><span>ROUTE REFERENCE · MANUAL GUIDE</span><button class="primary-button" id="start-trip-guide">Start trip guide <span aria-hidden="true">→</span></button></div>`);
  document.body.insertAdjacentHTML('beforeend', `<dialog id="destination-search" class="destination-search" aria-labelledby="search-title"><header class="search-header"><button type="button" class="search-back" aria-label="Back from destination search">${icon('arrow')}</button><h2 id="search-title">Where are you headed?</h2><span class="demo-pill">REFERENCE</span></header><div class="search-fields"><label for="search-origin">STARTING POINT</label><div class="search-origin-row"><input id="search-origin" readonly autocomplete="off" placeholder="Choose a starting landmark"><button type="button" id="search-swap" aria-label="Swap search locations">${icon('swap')}</button></div><label for="search-destination">DESTINATION</label><input id="search-destination" readonly autocomplete="off" placeholder="Search a CDO landmark"></div><div class="search-matches"><h3 id="search-list-title">CDO landmarks</h3><p id="search-no-match" role="status" hidden>Location not in demo yet. Choose a supported landmark below.</p><div id="search-location-list" aria-labelledby="search-list-title"></div></div><div class="search-bottom"><p id="search-help" role="status"></p><button type="button" class="primary-button" id="search-submit">Find my jeepney <span aria-hidden="true">→</span></button></div></dialog><dialog id="guide-confirm" class="guide-confirm" aria-labelledby="guide-confirm-title"><span class="eyebrow">YOUR JOURNEY</span><h2 id="guide-confirm-title"></h2><p id="guide-confirm-description"></p><div class="confirm-actions"><button type="button" class="secondary-button" id="confirm-cancel" autofocus>Keep guiding</button><button type="button" class="primary-button" id="confirm-accept">Save and leave</button></div></dialog>`);
  const searchDialog = $('#destination-search');
  const confirmDialog = $('#guide-confirm');

  function baseUrl(hash) { return location.pathname + location.search + hash; }
  function go(hash, replace = false) {
    history[replace ? 'replaceState' : 'pushState']({}, '', baseUrl(hash));
    restoreHash();
  }
  function show(name, html, title) {
    viewMap?.dispose(); viewMap = null;
    $(`#${name}-screen`).innerHTML = html;
    hooks.showScreen(name);
    document.title = `${title} | RoutaCagayan`;
    $(`#${name}-screen [data-screen-title]`)?.focus({ preventScroll: true });
  }
  function heading(title, subtitle, back = '#home') {
    return `<a class="back-button" href="${back}" data-app-link>${icon('arrow')}Back</a><div class="eyebrow">YOUR EVERYDAY SAKAY</div><h1 class="app-title" tabindex="-1" data-screen-title>${title}</h1><p class="app-subtitle">${subtitle}</p>`;
  }
  function miniJourney(option) {
    return `<div class="mini-journey" aria-label="Illustrative journey overview, not a map"><span class="eyebrow">SCHEMATIC · NOT A MAP</span><ol>${[option.from, ...option.viaLocations, option.to].map((place, index, all) => `<li><span class="mini-journey-dot ${index === all.length - 1 ? 'is-destination' : ''}"></span><span>${esc(place.short)}${index > 0 && index < all.length - 1 ? '<small>Demo transfer</small>' : ''}</span></li>`).join('')}</ol></div>`;
  }
  function optionCard(option, index, suggested = false) {
    const selected = state.selectedOptionId === option.id;
    return `<article class="trip-option ${selected ? 'is-selected' : ''}" data-option-id="${option.id}"><div class="option-top">${badges(option)}<span class="option-label">${esc(option.statusLabel)}</span></div><h2>${esc(option.name)}</h2><p class="option-signboard"><span>SIGNBOARD TO CONFIRM</span>${esc(option.signboard)}</p><dl class="option-stops"><div><dt>Board</dt><dd>${esc(option.boarding)}</dd></div><div><dt>Get off</dt><dd>${esc(option.dropoff)}</dd></div></dl><div class="option-bottom"><span>${option.rideCount} jeepney ${option.rideCount === 1 ? 'ride' : 'rides'} · ${option.transferCount ? '1 transfer' : 'No transfers'}</span><button type="button" class="option-view" data-select-option="${option.id}" aria-label="View directions for ${esc(option.code)} ${option.transferCount ? 'transfer' : 'direct'} reference">${selected ? 'Selected · ' : ''}View directions <span aria-hidden="true">→</span></button></div></article>`;
  }
  function renderOptions(from, to) {
    rememberSearch(from, to);
    const options = getTripOptions(from.id, to.id);
    if (!options.length) { hooks.unsupported(from, to); return; }
    const walking = rankTripOptions(options, 'walking');
    show('options', `${heading('Your jeepney options', `${esc(from.name)} <span aria-hidden="true">→</span> ${esc(to.name)}`)}<div class="options-top"><span class="demo-pill">ROUTE REFERENCES</span><button type="button" class="text-button" data-edit-trip>Edit trip ↗</button></div>${disclosure}${options.length > 1 ? `<section class="route-preferences" aria-labelledby="preference-title"><h2 id="preference-title">What matters for this trip?</h2><div class="preference-buttons" role="group" aria-label="Route preference"><button type="button" data-route-preference="transfers" aria-pressed="false">Fewer transfers</button><button type="button" data-route-preference="simple" aria-pressed="false">Simpler journey</button><button type="button" data-route-preference="walking" aria-pressed="false" ${walking.supported ? '' : 'disabled aria-describedby="walking-limit"'}>Less walking</button></div>${walking.supported ? '' : '<p class="preference-note" id="walking-limit">Walking distances aren’t available for these references. Less walking can’t be compared.</p>'}<p class="preference-reason" id="preference-reason" role="status"></p></section>` : ''}<div class="options-layout"><div class="trip-options"></div><aside class="options-aside">${mapMarkup('options-map', 'See your trip landmarks')}<p>Choose a corridor reference. Confirm the signboard and stops with the driver; current service is not verified.</p></aside></div>`, 'Your jeepney options');
    function updateRanking() {
      const ranking = rankTripOptions(options, routePreference);
      $('#options-screen .trip-options').innerHTML = ranking.options.map((option, index) => optionCard(option, index, ranking.supported)).join('');
      if ($('#preference-reason')) $('#preference-reason').textContent = ranking.reason;
      document.querySelectorAll('[data-route-preference]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.routePreference === routePreference)));
    }
    document.querySelectorAll('[data-route-preference]').forEach(button => button.addEventListener('click', () => {
      routePreference = button.dataset.routePreference; updateRanking();
    }));
    updateRanking();
    viewMap = createTripMap($('#options-map'), { from, to, connection: false });
  }
  function openOptions(from, to, push = true) {
    rememberSearch(from, to);
    hooks.applyForm({ origin: from.name, destination: to.name });
    if (push) go(`#options/${from.id}/${to.id}`);
    else renderOptions(from, to);
  }
  function openDetails(option) {
    state.selectedOptionId = option.id;
    rememberSearch(option.from, option.to);
    hooks.applyForm({ origin: option.from.name, destination: option.to.name });
    hooks.renderDetails(option);
  }
  function enhanceDetails(option) {
    $('#result-screen .back-button').insertAdjacentHTML('beforebegin', `<a class="back-button details-back" href="#options/${option.originId}/${option.destinationId}" data-app-link>${icon('arrow')}Back to options</a>`);
    $('#result-screen .recommendation').insertAdjacentHTML('afterend', `<div class="trip-signboard"><span>SIGNBOARD TO CONFIRM</span><strong>${esc(option.signboard)}</strong><p>${option.transferCount ? `Then transfer to ${esc(option.lineCodes[1])} toward ${esc(option.to.short)} at the indicated demo transfer point.` : `Direction: toward ${esc(option.to.name)}.`} Confirm the signboard with the driver; exact stops may vary.</p></div>`);
    const button = $('#start-trip-guide');
    button.innerHTML = `${state.activeTrip?.optionId === option.id ? 'Resume trip guide' : 'Start trip guide'} <span aria-hidden="true">→</span>`;
    button.onclick = () => startGuide(option);
  }
  function renderDirectory() {
    show('directory', `${heading('Explore jeepneys', 'Know your route before you ride.')}<label class="directory-label" for="directory-search">SEARCH ROUTES</label><input class="directory-search" id="directory-search" placeholder="Try R1, B3, Highway, or Cogon" type="search" autocomplete="off"><p class="directory-count" id="directory-count" role="status"></p><div class="directory-list" id="directory-list"></div>${disclosure}`, 'Explore jeepneys');
    function filter() {
      const lines = searchLines($('#directory-search').value);
      $('#directory-count').textContent = `${lines.length} route ${lines.length === 1 ? 'reference' : 'references'}`;
      $('#directory-list').innerHTML = lines.length ? lines.map(line => `<a class="directory-line" href="#line/${line.id}/${line.directions[0].id}" data-app-link><span class="mini-route-badge" data-long="${line.code.length > 3}">${line.code}<small>ROUTE</small></span><span><strong>${esc(line.name)}</strong><small>${esc(line.via)}</small><span class="directory-directions">${esc(line.statusLabel)}</span></span><span class="directory-arrow" aria-hidden="true">→</span></a>`).join('') : '<div class="inline-empty"><h2>No matching route</h2><p>Try R1, C2, Highway, or a landmark such as Cogon.</p></div>';
    }
    $('#directory-search').addEventListener('input', filter);
    filter();
  }
  function renderLine(lineId, directionId) {
    const line = jeepneyLines.find(line => line.id === lineId);
    const direction = line?.directions.find(direction => direction.id === directionId);
    if (!line || !direction) { renderDirectory(); return; }
    const option = getTripOptions(direction.originId, direction.destinationId).find(option => option.lineIds.includes(line.id));
    show('line', `${heading(`${line.code} <span class="title-demo">REFERENCE</span>`, esc(line.name), '#jeepneys')}<div class="line-layout"><div><label class="directory-label" for="line-direction">TRIP / DIRECTION TO CONFIRM</label><select id="line-direction">${line.directions.map(dir => `<option value="${dir.id}" ${dir.id === direction.id ? 'selected' : ''}>${esc(placeById(dir.originId).short)} → ${esc(placeById(dir.destinationId).short)}</option>`).join('')}</select><div class="trip-signboard"><span>SIGNBOARD TO CONFIRM</span><strong>${esc(direction.signboard)}</strong><p>${esc(line.notes)}</p></div><h2 class="small-section-title">Corridor highlights</h2><p class="app-subtitle">${esc(line.via)}</p><ol class="line-stops">${direction.orderedStops.map((id, index) => `<li><span>${index + 1}</span><div><strong>${esc(placeById(id).name)}</strong><small>${index === 0 ? 'Starting area' : 'Destination area'} · confirm actual stop locally</small></div></li>`).join('')}</ol><button type="button" class="primary-button" data-plan-line="${option.id}">Plan this trip <span aria-hidden="true">→</span></button>${sources(option)}${disclosure}</div><aside>${mapMarkup('line-map', 'Explore these landmarks')}</aside></div>`, `${line.code} route reference`);
    $('#line-direction').addEventListener('change', event => go(`#line/${line.id}/${event.target.value}`, true));
    viewMap = createTripMap($('#line-map'), { from: option.from, to: option.to, connection: true });
  }
  function renderMyTrip() {
    const active = state.activeTrip;
    const option = getTripOption(active?.optionId || state.selectedOptionId);
    if (!option) {
      show('mytrip', `${heading('My Trip', 'Your next journey, all in one place.')}<div class="trip-empty"><span class="empty-icon">${icon('trip')}</span><h2>Your next trip starts here.</h2><p>Choose a route reference to see your journey here. No account needed.</p><a class="primary-button" href="#home" data-app-link>Plan a trip <span aria-hidden="true">→</span></a><a class="back-button" href="#jeepneys" data-app-link>Explore jeepneys ↗</a></div>`, 'My Trip');
      return;
    }
    show('mytrip', `${heading('My Trip', active ? 'Your manual trip guide is saved here.' : 'A route reference, ready when you are.')}<article class="my-trip-card"><div class="option-top">${badges(option)}<span class="demo-pill">${active ? 'GUIDE SAVED' : 'SELECTED ROUTE'}</span></div><h2>${esc(option.from.short)} → ${esc(option.to.short)}</h2><p>${esc(option.description)}</p>${active ? `<p class="saved-step">Step ${active.stepIndex + 1} of ${option.steps.length} · ${esc(option.steps[active.stepIndex].guideTitle)}</p><progress value="${active.stepIndex}" max="${option.steps.length}" aria-label="Completed guide steps"></progress>` : ''}<button type="button" class="primary-button" data-start-option="${option.id}">${active ? 'Resume trip guide' : 'Start trip guide'} <span aria-hidden="true">→</span></button><a class="back-button" href="#trip/${option.originId}/${option.destinationId}/${option.id}" data-app-link>View directions ↗</a><p class="save-note">${storageAvailable ? 'Only route selection and progress are saved on this device.' : 'Browser storage is unavailable. Progress stays in this tab until it closes.'} Exact GPS coordinates are never saved.</p></article>${disclosure}`, 'My Trip');
  }
  function confirm(title, description, actionLabel, callback, cancelLabel = 'Keep guiding') {
    $('#guide-confirm-title').textContent = title;
    $('#guide-confirm-description').textContent = description;
    $('#confirm-accept').textContent = actionLabel;
    $('#confirm-cancel').textContent = cancelLabel;
    promptAction = callback;
    confirmDialog.showModal();
  }
  $('#confirm-cancel').addEventListener('click', () => confirmDialog.close());
  $('#confirm-accept').addEventListener('click', () => { confirmDialog.close(); promptAction?.(); });
  function startGuide(option) {
    const start = () => {
      if (state.activeTrip?.optionId !== option.id) state.activeTrip = { optionId: option.id, stepIndex: 0, status: 'active' };
      state.activeTrip.status = 'active'; state.selectedOptionId = option.id; state.completedOptionId = null;
      save(); go('#guide');
    };
    if (state.activeTrip && state.activeTrip.optionId !== option.id) confirm('Replace your saved guide?', 'Starting this guide will replace your current guide progress. Your search choices will stay available.', 'Start new guide', start, 'Keep saved guide');
    else start();
  }
  function renderGuide() {
    const active = state.activeTrip;
    const option = getTripOption(active?.optionId);
    if (!option) { renderMyTrip(); return; }
    const current = option.steps[active.stepIndex];
    active.status = 'active'; save();
    show('guide', `<div class="guide-header"><span class="eyebrow">MANUAL TRIP GUIDE</span><button type="button" class="text-button" id="exit-guide">Exit guide ↗</button></div><div class="guide-destination">${badges(option)}<div><span>HEADING TO</span><h1 class="guide-title" data-screen-title tabindex="-1">${esc(option.to.name)}</h1></div></div><p class="guide-manual-note">Manual walkthrough only. You advance each step; no location tracking or real navigation.</p><progress class="guide-progress" value="${active.stepIndex}" max="${option.steps.length}" aria-label="Completed guide steps"></progress><article class="current-guide-step" aria-live="polite"><span class="eyebrow">STEP ${active.stepIndex + 1} OF ${option.steps.length}</span><span class="guide-step-icon">${icon(current.type === 'stop' ? 'jeep' : current.type)}</span><h2>${esc(current.guideTitle)}</h2><strong>${esc(current.place)}</strong><p>${esc(current.detail)}</p></article>${miniJourney(option)}<h2 class="small-section-title">Your journey</h2><ol class="guide-step-list">${option.steps.map((step, index) => `<li class="${index < active.stepIndex ? 'is-complete' : index === active.stepIndex ? 'is-current' : ''}" ${index === active.stepIndex ? 'aria-current="step"' : ''}><span>${index < active.stepIndex ? icon('check') : index + 1}</span><div><strong>${esc(step.title)}</strong><small>${index < active.stepIndex ? 'Completed' : index === active.stepIndex ? 'Current step' : 'Upcoming'}</small></div></li>`).join('')}</ol><div class="guide-actions"><button type="button" class="secondary-button" id="previous-guide-step" ${active.stepIndex === 0 ? 'disabled' : ''}>Previous step</button><button type="button" class="primary-button" id="advance-guide">${esc(current.action)}</button></div>`, 'Manual demo trip guide');
    $('#advance-guide').addEventListener('click', () => {
      if (active.stepIndex === option.steps.length - 1) {
        state.completedOptionId = option.id; state.activeTrip = null; state.selectedOptionId = null; save();
        go(`#arrival/${option.id}`, true);
      } else { active.stepIndex += 1; save(); renderGuide(); }
    });
    $('#previous-guide-step').addEventListener('click', () => { if (active.stepIndex > 0) { active.stepIndex -= 1; save(); renderGuide(); } });
    $('#exit-guide').addEventListener('click', () => confirm('Leave the trip guide?', 'Your progress will be saved in My Trip. You can resume at this step whenever you’re ready.', 'Save and leave', () => { active.status = 'paused'; save(); go('#my-trip'); }));
  }
  function renderArrival(option) {
    if (!option || state.completedOptionId !== option.id) { renderMyTrip(); return; }
    show('arrival', `<div class="arrival-content"><span class="arrival-icon">${icon('check')}</span><span class="eyebrow">WALKTHROUGH COMPLETE</span><h1 class="arrival-title" data-screen-title tabindex="-1">You're here!</h1><h2>Salamat sa pagsakay!</h2><p>You completed the manual trip guide.<br>${esc(option.from.name)} → <strong>${esc(option.to.name)}</strong></p>${badges(option)}<a class="primary-button" href="#home" data-app-link>Plan another trip <span aria-hidden="true">→</span></a><a class="back-button" href="#home" data-app-link>Back to home</a><p class="arrival-note">This confirms your manual walkthrough, not a GPS-verified arrival. Your search choices are kept.</p></div>`, 'Demo journey complete');
  }

  function applyDraft() {
    if (!draft) return;
    hooks.applyForm({ origin: draft.origin, destination: draft.destination });
    const from = resolveLocation(draft.origin); const to = resolveLocation(draft.destination);
    if (from && to) rememberSearch(from, to);
  }
  function searchMatches() {
    const selection = demoSelection(resolveLocation(draft.origin)?.id, resolveLocation(draft.destination)?.id);
    draft = { origin: selection.from.name, destination: selection.to.name };
    $('#search-origin').value = draft.origin;
    $('#search-destination').value = draft.destination;
    const list = searchField === 'origin' ? getDemoOrigins() : getDemoDestinations(selection.from.id);
    const chosen = searchField === 'origin' ? selection.from : selection.to;
    $('#search-no-match').hidden = true;
    $('#search-list-title').textContent = searchField === 'origin' ? 'Choose your starting point' : `Destinations from ${selection.from.short}`;
    $('#search-location-list').innerHTML = list.map(place => `<button type="button" class="search-location ${place.id === chosen.id ? 'is-selected' : ''}" data-search-place="${place.id}" aria-pressed="${place.id === chosen.id}"><span class="search-place-icon">${icon('trip')}</span><span><strong>${esc(place.name)}</strong><small>${esc(place.category)}</small></span><span aria-hidden="true">${place.id === chosen.id ? '✓' : '↗'}</span></button>`).join('');
    $('#search-swap').hidden = !getTripOptions(selection.to.id, selection.from.id).length;
    $('#search-help').textContent = 'Every destination shown has a ready-to-view demo journey.';
  }
  function resizeSearch() {
    if (!searchDialog.open) return;
    searchDialog.style.height = `${window.visualViewport?.height || innerHeight}px`;
    searchDialog.style.top = `${window.visualViewport?.offsetTop || 0}px`;
  }
  function closeSearch(commit = true) {
    if (!searchDialog.open) return;
    if (commit) applyDraft();
    closingSearch = true;
    searchDialog.close();
    $('#origin').setAttribute('aria-expanded', 'false');
    $('#destination').setAttribute('aria-expanded', 'false');
    document.body.classList.remove('search-open');
    requestAnimationFrame(() => { closingSearch = false; });
  }
  function openSearch(field = 'destination', push = true) {
    if (closingSearch || searchDialog.open) return;
    const form = hooks.formValues(); draft = { origin: form.origin, destination: form.destination };
    searchField = field;
    $('#search-origin').value = draft.origin; $('#search-destination').value = draft.destination;
    if (push) { history.pushState({}, '', baseUrl(`#search/${field}`)); searchLocal = true; }
    searchDialog.showModal(); $(`#${field}`).setAttribute('aria-expanded', 'true'); document.body.classList.add('search-open'); resizeSearch();
    $(`#search-${field}`).focus(); searchMatches();
  }
  function backFromSearch() {
    closeSearch();
    if (searchLocal) { searchLocal = false; history.back(); }
    else go('#home', true);
  }
  $('.search-back').addEventListener('click', backFromSearch);
  searchDialog.addEventListener('cancel', event => { event.preventDefault(); backFromSearch(); });
  ['origin', 'destination'].forEach(field => {
    $(`#search-${field}`).addEventListener('focus', () => { searchField = field; searchMatches(); });
    $(`#search-${field}`).addEventListener('input', searchMatches);
    $(`#search-${field}`).addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); $('#search-submit').click(); } });
    $(`#${field}`).addEventListener('keydown', event => {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); openSearch(field); }
    });
    // Finish the tap before introducing an animated modal. Opening on pointerdown
    // can place a new control beneath the pointer before its release/click.
    $(`#${field}`).addEventListener('click', event => {
      event.preventDefault(); openSearch(field);
    });
  });
  $('#search-location-list').addEventListener('click', event => {
    const button = event.target.closest('[data-search-place]');
    if (!button) return;
    const place = placeById(button.dataset.searchPlace);
    draft[searchField] = place.name;
    $(`#search-${searchField}`).value = place.name;
    searchMatches(); applyDraft();
    if (searchField === 'origin') $('#search-destination').focus();
  });
  $('#search-swap').addEventListener('click', () => {
    if (draft.origin === 'Current location') { $('#search-help').textContent = 'GPS can only be a starting point. Choose a landmark before swapping.'; return; }
    [draft.origin, draft.destination] = [draft.destination, draft.origin];
    $('#search-origin').value = draft.origin; $('#search-destination').value = draft.destination;
    searchMatches(); applyDraft();
  });
  $('#search-submit').addEventListener('click', () => {
    const from = resolveLocation(draft.origin); const to = resolveLocation(draft.destination);
    const gps = draft.origin === 'Current location' && hooks.formValues().isGps;
    if (!to || (!from && !gps) || from?.id === to?.id) { searchMatches(); return; }
    closeSearch(); hooks.submit();
  });
  window.visualViewport?.addEventListener('resize', resizeSearch);
  window.visualViewport?.addEventListener('scroll', resizeSearch);

  document.addEventListener('click', event => {
    const link = event.target.closest('[data-main-nav], [data-app-link]');
    if (link) { event.preventDefault(); go(link.getAttribute('href')); }
    const option = event.target.closest('[data-select-option]');
    if (option) {
      const selected = getTripOption(option.dataset.selectOption);
      go(`#trip/${selected.originId}/${selected.destinationId}/${selected.id}`);
    }
    const start = event.target.closest('[data-start-option]');
    if (start) startGuide(getTripOption(start.dataset.startOption));
    const line = event.target.closest('[data-plan-line]');
    if (line) { const option = getTripOption(line.dataset.planLine); openOptions(option.from, option.to); }
    if (event.target.closest('[data-edit-trip]')) {
      openSearch('destination');
    }
  });

  function onScreen(name) {
    if (confirmDialog.open) confirmDialog.close();
    currentView = name;
    document.body.dataset.screen = name;
    $('#details-action').hidden = name !== 'result';
    if (name !== 'home') closeSearch();
    const activeNav = ['directory', 'line'].includes(name) ? 'directory' : ['mytrip', 'guide', 'arrival'].includes(name) ? 'mytrip' : 'home';
    $('#plan-link').classList.toggle('nav-active', activeNav === 'home');
    if (activeNav === 'home') $('#plan-link').setAttribute('aria-current', 'page');
    else $('#plan-link').removeAttribute('aria-current');
    document.querySelectorAll('[data-main-nav]').forEach(link => {
      const active = link.dataset.mainNav === activeNav;
      link.classList.toggle('nav-active', active);
      if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    if (!screenNames.includes(name)) { viewMap?.dispose(); viewMap = null; }
  }
  function restoreHash() {
    const hash = location.hash;
    if (!hash.startsWith('#search/')) closeSearch();
    if (currentView === 'guide' && hash !== '#guide' && state.activeTrip) { state.activeTrip.status = 'paused'; save(); }
    if (hash === '#home') { hooks.showHome(); return true; }
    if (hash === '#jeepneys') { renderDirectory(); return true; }
    if (hash === '#my-trip') { renderMyTrip(); return true; }
    if (hash === '#guide') { renderGuide(); return true; }
    let match = hash.match(/^#options\/([a-z]+)\/([a-z]+)$/);
    if (match && placeById(match[1]) && placeById(match[2])) { renderOptions(placeById(match[1]), placeById(match[2])); return true; }
    match = hash.match(/^#trip\/([a-z]+)\/([a-z]+)(?:\/([a-z0-9-]+))?$/);
    if (match) {
      const option = match[3] ? getTripOption(match[3]) : getTripOptions(match[1], match[2])[0];
      if (option && option.originId === match[1] && option.destinationId === match[2]) { openDetails(option); return true; }
    }
    match = hash.match(/^#line\/([a-z0-9-]+)\/([a-z-]+)$/);
    if (match) { renderLine(match[1], match[2]); return true; }
    match = hash.match(/^#arrival\/([a-z0-9-]+)$/);
    if (match) { renderArrival(getTripOption(match[1])); return true; }
    match = hash.match(/^#search\/(origin|destination)$/);
    if (match) { hooks.showHome(); openSearch(match[1], false); return true; }
    return false;
  }
  return { onScreen, restoreHash, openOptions, enhanceDetails, openSearch,
    setPreference(value) { routePreference = ['transfers', 'simple', 'walking'].includes(value) ? value : 'transfers'; },
  };
}
