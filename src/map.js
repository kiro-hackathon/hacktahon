import { locations, mapConfig } from './locations.js';
import { getRoadPath, findNearestRoadPath } from './road-paths.js';

/** Optional maps are lazy: hidden sections never request tiles. */
export function createTripMap(section, initial = {}) {
  let map;
  let tiles;
  let group;
  let state = initial;
  let timeout;
  let observer;
  let loaded = false;
  let failures = 0;
  let disposed = false;
  const container = section.querySelector('.leaflet-map');
  const message = section.querySelector('.map-status');
  const retry = section.querySelector('[data-map-retry]');
  const expand = section.querySelector('[data-map-expand]');

  function status(text, failed = false) {
    message.textContent = text;
    section.classList.toggle('map-unavailable', failed);
    retry.hidden = !failed;
  }

  function fallback() {
    if (disposed) return;
    clearTimeout(timeout);
    status('Map tiles are unavailable. Your planner and illustrated journey still work. Check your connection and retry.', true);
  }

  function marker(place, role) {
    const label = `${role ? `${role}: ` : ''}${place.name}`;
    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = label;
    content.append(title);
    if (place.source) {
      const detail = document.createElement('p');
      detail.textContent = 'Landmark center, not a boarding point.';
      const source = document.createElement('a');
      source.href = place.source;
      source.target = '_blank';
      source.rel = 'noopener';
      source.textContent = 'Landmark source: OpenStreetMap ↗';
      content.append(detail, source);
    }
    const kind = role === 'Origin' ? 'origin' : role === 'Destination' ? 'destination' : role === 'Transfer' ? 'transfer' : 'landmark';
    const pin = L.marker(place.coordinates, {
      title: label, alt: label, keyboard: true,
      icon: L.divIcon({ className: `trip-map-marker marker-${kind}`, html: `<span>${kind === 'origin' ? 'A' : kind === 'destination' ? 'B' : kind === 'transfer' ? 'T' : ''}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
    }).bindPopup(content);
    pin.on('add', () => pin.getElement()?.setAttribute('aria-label', label));
    return pin.addTo(group);
  }

  function draw() {
    if (!map || disposed) return;
    group.clearLayers();
    const { from, to, via = [], connection = false, path } = state;
    const selected = new Set([from?.id, to?.id, ...via.map(place => place.id)]);
    locations.filter(place => place.coordinates && !selected.has(place.id)).forEach(place => marker(place));
    if (from?.coordinates) marker(from, 'Origin');
    if (to?.coordinates) marker(to, 'Destination');
    via.filter(place => place.coordinates).forEach(place => marker(place, 'Transfer'));
    if (from?.id === 'current' && Number.isFinite(from.accuracy) && from.accuracy > 0) {
      L.circle(from.coordinates, { radius: from.accuracy, color: '#147d76', weight: 1, fillOpacity: 0.07, interactive: false }).addTo(group);
    }
    let roadPoints = null;
    if (connection && from?.coordinates && to?.coordinates && via.every(place => place.coordinates)) {
      if (!path && via.length > 0) {
        const segments = [];
        const stops = [from, ...via, to];
        for (let i = 0; i < stops.length - 1; i++) {
          const seg = (stops[i]?.id && stops[i + 1]?.id ? getRoadPath(stops[i].id, stops[i + 1].id) : null) || findNearestRoadPath(stops[i], stops[i + 1]);
          if (seg) {
            if (segments.length > 0) segments.push(...seg.slice(1));
            else segments.push(...seg);
          }
        }
        if (segments.length > 0) roadPoints = segments;
      }
      if (!roadPoints) {
        roadPoints = path || (from?.id && to?.id ? getRoadPath(from.id, to.id) : null) || findNearestRoadPath(from, to) || [from.coordinates, ...via.map(place => place.coordinates), to.coordinates];
      }
      L.polyline(roadPoints, { color: '#147d76', weight: 4, dashArray: '7 9', interactive: false }).addTo(group);
    }
    section.querySelector('.map-connection-note').textContent = [from, ...via, to].some(place => place && !place.coordinates)
      ? 'Some route areas have no verified map point yet. Only sourced landmarks are shown; no route path is mapped.'
      : connection
      ? 'Approximate / not for navigation · road corridor preview, not a verified jeepney road route.'
      : from?.id === 'current'
        ? 'GPS position and destination only · no live jeepney routing.'
        : 'Landmark locations only · no live jeepney routing or road directions.';
    const points = [from, ...via, to].filter(place => place?.coordinates).map(place => place.coordinates);
    map.invalidateSize({ pan: false });
    if (points.length > 1) {
      const fitCoords = (roadPoints && roadPoints.length > 1) ? roadPoints : points;
      map.fitBounds(fitCoords, { padding: [40, 40], maxZoom: 16, animate: false });
    }
    else if (points.length && from?.id === 'current') map.setView(points[0], 14, { animate: false });
    else if (points.length) map.fitBounds(locations.filter(place => place.coordinates).map(place => place.coordinates), { padding: [35, 35], maxZoom: 15, animate: false });
    else map.setView(mapConfig.center, mapConfig.zoom, { animate: false });
  }

  function load() {
    if (disposed || !section.open) return;
    if (map) { draw(); return; }
    if (!window.L) {
      status('The map library couldn’t load. The trip planner and illustration are still available. Reload to retry.', true);
      retry.textContent = 'Reload map';
      return;
    }
    map = L.map(container, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    group = L.layerGroup().addTo(map);
    tiles = L.tileLayer(mapConfig.tileUrl, {
      maxZoom: 19,
      keepBuffer: 0,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    });
    tiles.on('tileload', () => {
      loaded = true;
      clearTimeout(timeout);
      if (!failures) status('Map ready. Drag to explore; use + and − to zoom.');
    });
    tiles.on('tileerror', () => { failures += 1; fallback(); });
    tiles.on('load', () => { if (failures) fallback(); });
    tiles.addTo(map);
    draw();
    timeout = setTimeout(() => { if (!loaded) fallback(); }, 10000);
    observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);
  }

  function onToggle() {
    if (section.open) load();
    else {
      section.classList.remove('map-expanded');
      expand.textContent = 'Expand map';
      expand.setAttribute('aria-pressed', 'false');
    }
  }
  function onRetry() {
    if (!window.L) { window.location.reload(); return; }
    if (!map) { load(); return; }
    loaded = false;
    failures = 0;
    status('Retrying map tiles…');
    tiles.redraw();
    clearTimeout(timeout);
    timeout = setTimeout(() => { if (!loaded) fallback(); }, 10000);
  }
  function onExpand() {
    const expanded = section.classList.toggle('map-expanded');
    expand.textContent = expanded ? 'Compact map' : 'Expand map';
    expand.setAttribute('aria-pressed', String(expanded));
    requestAnimationFrame(() => { map?.invalidateSize({ pan: false }); draw(); });
  }

  section.addEventListener('toggle', onToggle);
  retry.addEventListener('click', onRetry);
  expand.addEventListener('click', onExpand);
  const view = {
    update(next) { state = next; if (section.open) load(); },
    dispose() {
      disposed = true;
      clearTimeout(timeout);
      observer?.disconnect();
      map?.remove();
      section.removeEventListener('toggle', onToggle);
      retry.removeEventListener('click', onRetry);
      expand.removeEventListener('click', onExpand);
    },
  };
  if (section.open) load();
  return view;
}

export function mapMarkup(id, title = 'Explore this trip on a map', open = false) {
  return `<details class="map-section" id="${id}"${open ? ' open' : ''}><summary><span class="map-summary-icon" aria-hidden="true">⌖</span><span>${title}<small>Interactive OpenStreetMap · optional</small></span><span class="map-chevron" aria-hidden="true">+</span></summary><div class="map-content"><div class="map-toolbar"><span><i class="map-origin-key">A</i> Origin <i class="map-destination-key">B</i> Destination</span><button type="button" data-map-expand aria-pressed="false">Expand map</button></div><div class="leaflet-map" aria-label="Interactive map of Cagayan de Oro and selected locations" role="region"></div><p class="map-connection-note">Landmark locations only · no live jeepney routing or road directions.</p><div class="map-feedback"><p class="map-status" role="status">Open the map to see CDO landmarks. Online tiles required.</p><button type="button" data-map-retry hidden>Retry map</button></div><p class="map-privacy">Tiles are fetched from OpenStreetMap for the visible area. Exact GPS coordinates stay in this tab.</p></div></details>`;
}
