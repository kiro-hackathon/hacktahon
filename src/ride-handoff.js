/** Verified 2026-10-17. Website handoff only; no private schemes or booking API.
 * Android listings verified too, but official sites work across platforms:
 * https://play.google.com/store/apps/details?id=com.joyride.rider
 * https://play.google.com/store/apps/details?id=com.angkas.customer
 */
export const rideServices = [
  { id: 'joyride', name: 'JoyRide', description: 'Motorcycle taxi and car rides.', url: 'https://joyride.com.ph/', domain: 'joyride.com.ph' },
  { id: 'angkas', name: 'Angkas', description: 'Motorcycle taxi rides.', url: 'https://www.angkas.com/', domain: 'www.angkas.com' },
];

const transportIcon = icon('jeep');
const externalIcon = icon('external');
let sheet;
let opener;
let sheetVersion = 0;

export function closeRideHandoff() {
  if (sheet?.open) sheet.close();
}

function ensureSheet() {
  if (sheet) return sheet;
  sheet = document.createElement('dialog');
  sheet.id = 'ride-handoff';
  sheet.className = 'ride-handoff';
  sheet.setAttribute('aria-labelledby', 'handoff-title');
  sheet.setAttribute('aria-describedby', 'handoff-description');
  sheet.innerHTML = `<div class="handoff-top"><span class="eyebrow">CONTINUE YOUR JOURNEY</span><button type="button" class="icon-button" data-handoff-close aria-label="Close ride-hailing handoff">×</button></div>
    <div class="handoff-heading"><span class="ride-service-icon">${transportIcon}</span><h2 id="handoff-title"></h2></div>
    <p id="handoff-description">Booking continues in the provider’s app. Enter your pickup and destination there; RoutaCagayan won’t transfer them automatically.</p>
    <dl class="handoff-trip"><div><dt>STARTING POINT</dt><dd id="handoff-origin"></dd></div><div><dt>DESTINATION</dt><dd id="handoff-destination"></dd></div></dl>
    <button type="button" class="handoff-copy" id="copy-ride-destination"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H4v13h4"/></svg><span>Copy destination</span></button>
    <p class="handoff-status" id="handoff-copy-status" role="status" aria-live="polite"></p>
    <label for="handoff-copy-fallback" class="sr-only">Destination to copy manually</label><input id="handoff-copy-fallback" class="handoff-copy-fallback" readonly hidden>
    <p class="handoff-external-note" id="handoff-external-note"></p>
    <div class="handoff-actions"><button type="button" class="handoff-cancel" data-handoff-close autofocus>Cancel</button><a class="primary-button" id="handoff-continue" target="_blank" rel="noopener noreferrer" aria-describedby="handoff-external-note">Continue to app ${externalIcon}<span class="sr-only"> (opens a new tab)</span></a></div>`;
  document.body.append(sheet);
  sheet.querySelectorAll('[data-handoff-close]').forEach(button => button.addEventListener('click', () => sheet.close()));
  sheet.addEventListener('close', () => {
    sheetVersion += 1;
    if (opener?.isConnected && opener.getClientRects().length) opener.focus({ preventScroll: true });
  });
  sheet.addEventListener('click', event => {
    if (event.target !== sheet) return;
    const box = sheet.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) sheet.close();
  });
  sheet.querySelector('#handoff-continue').addEventListener('click', () => sheet.close());
  return sheet;
}

function openHandoff(service, trip, trigger) {
  const dialog = ensureSheet();
  const version = ++sheetVersion;
  opener = trigger;
  dialog.querySelector('#handoff-title').textContent = `Continue with ${service.name}`;
  dialog.querySelector('#handoff-origin').textContent = trip.origin;
  dialog.querySelector('#handoff-destination').textContent = trip.destination;
  dialog.querySelector('#handoff-external-note').textContent = `Opens ${service.domain}, the official website, in a new tab. Continue in the provider’s app to check availability and book.`;
  dialog.querySelector('#handoff-continue').href = service.url;
  const copy = dialog.querySelector('#copy-ride-destination');
  const status = dialog.querySelector('#handoff-copy-status');
  const fallback = dialog.querySelector('#handoff-copy-fallback');
  copy.disabled = false;
  copy.querySelector('span').textContent = 'Copy destination';
  status.textContent = '';
  fallback.hidden = true;
  fallback.value = trip.destination;
  copy.onclick = async () => {
    copy.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(trip.destination);
      if (version !== sheetVersion) return;
      copy.querySelector('span').textContent = 'Destination copied';
      status.textContent = 'Copied. Paste it into the provider’s app.';
    } catch {
      if (version !== sheetVersion) return;
      status.textContent = 'Clipboard unavailable. Select and copy the destination below.';
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
    } finally {
      if (version === sheetVersion) copy.disabled = false;
    }
  };
  dialog.showModal();
}

export function addRideOptions(afterElement, trip) {
  const section = document.createElement('section');
  section.className = 'ride-options';
  section.setAttribute('aria-labelledby', 'ride-options-title');
  section.innerHTML = `<h2 id="ride-options-title">Other ways to get there</h2><p class="ride-options-description">Prefer a direct ride? Continue with a ride-hailing app.</p><div class="ride-service-list">${rideServices.map(service => `<article class="ride-service"><span class="ride-service-icon">${transportIcon}</span><div class="ride-service-copy"><h3>${service.name}</h3><p>${service.description}</p></div><button type="button" class="ride-open" data-ride-provider="${service.id}" aria-haspopup="dialog">Open ${service.name} ${externalIcon}</button></article>`).join('')}</div><p class="ride-options-note">Booking continues outside RoutaCagayan.</p>`;
  section.querySelectorAll('[data-ride-provider]').forEach(button => {
    button.addEventListener('click', () => openHandoff(rideServices.find(service => service.id === button.dataset.rideProvider), trip, button));
  });
  afterElement.after(section);
}
import { icon } from './icons.js';
