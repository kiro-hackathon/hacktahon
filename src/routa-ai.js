import { parseTripRequest, matchLandmark, answerRouteQuestion } from './routa-intelligence.js';
import { locations, tripOptions } from './routes.js';

/** View adapter only. Intent parsing and route answers live in routa-intelligence.js. */
export function createRoutaAI(hooks) {
  const $ = selector => document.querySelector(selector);
  let request;
  let selectedRoute;
  let returnFocus;
  let awaitingOrigin = false;

  $('#trip-form').insertAdjacentHTML('afterend', `<details class="smart-search" id="smart-search">
    <summary><span><strong>Try Routa AI</strong><small>Choose a ready-to-view trip</small></span><span class="ai-concept">AI concept demo</span></summary>
    <div class="smart-search-content"><form id="smart-trip-form" novalidate>
      <label for="smart-trip-input">Where would you like to go?</label>
      <select id="smart-trip-input" aria-describedby="smart-trip-hint smart-trip-status"></select>
      <p id="smart-trip-hint">Every trip in this list has a complete demo journey.</p>
      <button class="smart-submit" type="submit">Find demo routes <span aria-hidden="true">→</span></button>
    </form><div id="smart-trip-result" hidden><p id="smart-trip-status" role="status"></p>
      <div id="smart-origin-picker" hidden><label for="smart-origin">Starting landmark</label><select id="smart-origin"><option value="">Choose your starting point</option></select></div>
      <button type="button" class="smart-submit" id="smart-view-routes" hidden>View demo routes <span aria-hidden="true">→</span></button>
    </div><p class="ai-local-note">Prototype assistant · Local rules, no language model.</p></div>
  </details>`);
  locations.forEach(place => $('#smart-origin').add(new Option(place.name, place.id)));
  const presets = [...new Map(tripOptions.map(option => [`${option.originId}/${option.destinationId}`, option])).values()];
  presets.forEach(option => $('#smart-trip-input').add(new Option(`${option.from.short} → ${option.to.short}`, `From ${option.from.short} to ${option.to.short}`)));
  $('#smart-trip-input').value = 'From DICT Office to Centrio';
  document.body.insertAdjacentHTML('beforeend', `<dialog id="routa-assistant" class="routa-assistant" aria-labelledby="routa-assistant-title" aria-describedby="routa-assistant-disclosure">
    <div class="assistant-handle" aria-hidden="true"></div>
    <header class="assistant-header"><div><span class="ai-concept">AI concept demo</span><h2 id="routa-assistant-title">Ask Routa</h2></div><button type="button" class="assistant-close" id="routa-assistant-close" aria-label="Close Ask Routa" autofocus>×</button></header>
    <p class="assistant-context" id="routa-assistant-context"></p>
    <div class="assistant-messages" id="routa-messages" role="log" aria-label="Routa conversation" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
    <div class="assistant-questions" aria-label="Suggested questions">${['Where do I board?', 'Where do I get off?', 'Are there transfers?', 'What signboard should I look for?'].map(question => `<button type="button" data-routa-question="${question}">${question}</button>`).join('')}</div>
    <form id="routa-question-form" class="assistant-composer"><label class="sr-only" for="routa-question">Ask about this sample route</label><input id="routa-question" maxlength="300" autocomplete="off" placeholder="Ask about this sample route…"><button type="submit" aria-label="Send question">↑</button></form>
    <p class="assistant-disclosure" id="routa-assistant-disclosure">Local rules · Sample instructions, unverified stops.<br>No verified fares, travel times, or live tracking.</p>
  </dialog>`);
  const sheet = $('#routa-assistant');

  function clearPreview() {
    request = null;
    awaitingOrigin = false;
    $('#smart-trip-result').hidden = true;
    $('#smart-view-routes').hidden = true;
    $('#smart-origin-picker').hidden = true;
    $('#smart-trip-input').removeAttribute('aria-invalid');
  }
  function parse() {
    const selected = matchLandmark(hooks.originValue()).place;
    const start = awaitingOrigin ? $('#smart-origin').value : selected?.id;
    request = parseTripRequest($('#smart-trip-input').value, start);
    $('#smart-trip-result').hidden = false;
    $('#smart-trip-status').textContent = request.message;
    $('#smart-origin-picker').hidden = request.status !== 'missing-origin';
    $('#smart-view-routes').hidden = request.status !== 'ready';
    $('#smart-trip-input').setAttribute('aria-invalid', String(request.status === 'clarify'));
    if (request.status === 'missing-origin') {
      awaitingOrigin = true;
      $('#smart-origin').value = '';
      $('#smart-origin').focus();
    }
  }
  $('#smart-trip-form').addEventListener('submit', event => { event.preventDefault(); parse(); });
  $('#smart-trip-input').addEventListener('change', clearPreview);
  $('#smart-origin').addEventListener('change', () => { if ($('#smart-origin').value) parse(); });
  // Recheck against the latest origin before navigation; no stale preview can submit a different trip.
  $('#smart-view-routes').addEventListener('click', () => {
    parse();
    if (request.status === 'ready') hooks.plan(request.from, request.to, request.preference);
  });

  function bubble(message, speaker) {
    const item = document.createElement('div');
    item.className = `assistant-bubble ${speaker === 'You' ? 'is-user' : 'is-routa'}`;
    const label = document.createElement('span');
    label.className = 'assistant-speaker'; label.textContent = speaker;
    const paragraph = document.createElement('p'); paragraph.textContent = message;
    item.append(label, paragraph); $('#routa-messages').append(item);
    // Bound tab memory while retaining a useful conversation, without persisting questions.
    while ($('#routa-messages').children.length > 40) $('#routa-messages').firstElementChild.remove();
    $('#routa-messages').scrollTop = $('#routa-messages').scrollHeight;
  }
  function ask(question) {
    if (!question.trim()) return;
    bubble(question.trim(), 'You');
    bubble(answerRouteQuestion(question, selectedRoute), 'Routa');
    $('#routa-question').value = '';
  }
  function resizeSheet() {
    if (!sheet.open) return;
    const viewport = window.visualViewport;
    sheet.style.setProperty('--assistant-viewport', `${viewport?.height || innerHeight}px`);
    sheet.style.top = `${viewport?.offsetTop || 0}px`;
    sheet.style.bottom = 'auto';
    sheet.style.marginTop = `${Math.max(8, (viewport?.height || innerHeight) - sheet.getBoundingClientRect().height)}px`;
    // Keep the latest reply visible when keyboard space changes the transcript height.
    requestAnimationFrame(() => { $('#routa-messages').scrollTop = $('#routa-messages').scrollHeight; });
  }
  function close() { if (sheet.open) sheet.close(); }
  function open(option, trigger) {
    selectedRoute = option; returnFocus = trigger;
    $('#routa-messages').replaceChildren();
    $('#routa-question').value = '';
    $('#routa-assistant-context').textContent = `${option.code} · ${option.from.short} → ${option.to.short}`;
    bubble('I can explain this selected sample’s boarding point, drop-off, transfers, and signboards. What would you like to know?', 'Routa');
    sheet.showModal(); document.body.classList.add('assistant-open');
    resizeSheet(); $('#routa-assistant-close').focus({ preventScroll: true });
  }
  $('#routa-assistant-close').addEventListener('click', close);
  sheet.addEventListener('close', () => {
    document.body.classList.remove('assistant-open');
    if (returnFocus?.isConnected && returnFocus.getClientRects().length) returnFocus.focus({ preventScroll: true });
    selectedRoute = null;
  });
  sheet.addEventListener('click', event => {
    const question = event.target.closest('[data-routa-question]');
    if (question) ask(question.dataset.routaQuestion);
    if (event.target !== sheet) return;
    const rect = sheet.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  $('#routa-question-form').addEventListener('submit', event => { event.preventDefault(); ask($('#routa-question').value); });
  window.addEventListener('popstate', close);
  window.visualViewport?.addEventListener('resize', resizeSheet);
  window.visualViewport?.addEventListener('scroll', resizeSheet);
  return {
    close,
    attach(option) {
      const panel = document.createElement('div'); panel.className = 'ask-routa-panel';
      panel.innerHTML = '<div><strong>A question about this trip?</strong><small>Prototype assistant · Uses these sample steps</small></div><button type="button" id="ask-routa" aria-haspopup="dialog">Ask Routa <span aria-hidden="true">↗</span></button>';
      $('#result-screen .trip-signboard').insertAdjacentElement('afterend', panel);
      panel.querySelector('button').addEventListener('click', event => open(option, event.currentTarget));
    },
  };
}
