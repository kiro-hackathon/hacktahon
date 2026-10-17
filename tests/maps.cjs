/* Optional QA: existing Playwright + Chrome; no app dependencies required.
   Tiles are intercepted to avoid automated pan/zoom traffic on OSM servers. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edf3e9"/><path d="M0 70h256M80 0v256M0 210h256M210 0v256" stroke="#cbd7c7" stroke-width="8"/><text x="90" y="140" fill="#8e9d87" font-size="12">TEST TILE</text></svg>';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const passed = [];
  const pageErrors = [];
  const pass = text => { passed.push(text); console.log(`PASS ${text}`); };
  async function newPage(options = {}, init) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
    await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: tile }));
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(base);
    // Inspect map state via a test-only Leaflet hook; no test API in product code.
    await page.evaluate(() => { window.__maps = []; L.Map.addInitHook(function () { window.__maps.push(this); }); });
    return { page, context };
  }
  try {
    const { page, context } = await newPage();
    let tileRequests = 0;
    page.on('request', request => { if (request.url().includes('tile.openstreetmap.org')) tileRequests++; });
    assert.equal(await page.locator('#home-trip-map').getAttribute('open'), null);
    assert.equal(tileRequests, 0);
    const data = await page.evaluate(async () => (await import('/src/locations.js')).locations);
    assert.equal(data.length, 6);
    for (const place of data) { assert.equal(place.coordinates.length, 2); assert.match(place.source, /^https:\/\/www.openstreetmap.org\/(way|relation)\//); }
    pass('Six sourced coordinates; maps stay lazy before opening');

    await page.locator('#home-trip-map summary').click();
    await page.waitForFunction(() => document.querySelector('#home-trip-map .map-status').textContent.startsWith('Map ready'));
    assert.equal(await page.locator('#home-trip-map .leaflet-marker-icon').count(), 6);
    assert.ok(await page.locator('#home-trip-map .leaflet-control-attribution').isVisible());
    assert.match(await page.locator('#home-trip-map .leaflet-control-attribution').innerText(), /OpenStreetMap contributors/);
    const zoom = await page.evaluate(() => window.__maps[0].getZoom());
    await page.locator('#home-trip-map .leaflet-control-zoom-in').click();
    await page.waitForFunction(previous => window.__maps[0].getZoom() > previous, zoom);
    await page.waitForFunction(() => !window.__maps[0]._animatingZoom);
    await page.locator('#home-trip-map .leaflet-map').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const center = await page.evaluate(() => window.__maps[0].getCenter().toString());
    const bounds = await page.locator('#home-trip-map .leaflet-map').boundingBox();
    await page.mouse.move(bounds.x + bounds.width * .7, bounds.y + bounds.height * .5);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .4, bounds.y + bounds.height * .65, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(previous => window.__maps[0].getCenter().toString() !== previous, center);
    pass('Map renders six markers and attribution; zoom and pan work (fixture tiles)');

    await page.getByRole('button', { name: 'Set destination to Divisoria', exact: true }).click();
    await page.getByRole('button', { name: 'Origin: USTP CDO', exact: true }).waitFor({ state: 'visible' });
    assert.ok(await page.getByRole('button', { name: 'Origin: USTP CDO', exact: true }).isVisible());
    assert.ok(await page.getByRole('button', { name: 'Destination: Divisoria', exact: true }).isVisible());
    assert.match(await page.locator('#home-trip-map .map-connection-note').innerText(), /straight line, not a verified/);
    assert.equal(await page.evaluate(() => { let count = 0; window.__maps[0].eachLayer(layer => { if (layer instanceof L.Polyline) count++; }); return count; }), 1);
    await findAndSelect(page);
    assert.match(await page.locator('.route-badge').innerText(), /D1/);
    assert.equal(await page.locator('.timeline li').count(), 4);
    await page.locator('#result-trip-map summary').click();
    await page.waitForFunction(() => document.querySelector('#result-trip-map .map-status').textContent.startsWith('Map ready'));
    const map = page.locator('#result-trip-map .leaflet-map');
    const mapBounds = await map.boundingBox();
    for (const name of ['Origin: USTP CDO', 'Destination: Divisoria']) {
      const point = await page.getByRole('button', { name, exact: true }).boundingBox();
      assert.ok(point.x >= mapBounds.x && point.y >= mapBounds.y && point.x + point.width <= mapBounds.x + mapBounds.width && point.y + point.height <= mapBounds.y + mapBounds.height);
    }
    const compactHeight = mapBounds.height;
    await page.locator('#result-trip-map [data-map-expand]').click();
    assert.equal(await page.locator('#result-trip-map [data-map-expand]').getAttribute('aria-pressed'), 'true');
    assert.ok((await map.boundingBox()).height > compactHeight);
    await page.locator('#result-trip-map [data-map-expand]').click();
    assert.equal((await map.boundingBox()).height, compactHeight);
    await page.locator('#result-trip-map [data-map-expand]').click();
    await page.locator('#result-trip-map summary').click();
    await page.locator('#result-trip-map summary').click();
    assert.equal(await page.locator('#result-trip-map [data-map-expand]').getAttribute('aria-pressed'), 'false');
    assert.ok(await page.locator('.schematic').isVisible());
    pass('Supported trip shows both fitted markers, labeled demo line, expansion, and original timeline/illustration');
    await context.close();

    const gps = await newPage({ permissions: ['geolocation'], geolocation: { latitude: 8.4862342, longitude: 124.6567018, accuracy: 24 } });
    const gpsRequests = [];
    gps.page.on('request', request => gpsRequests.push(request.url()));
    await gps.page.locator('#destination').fill('Divisoria');
    await gps.page.getByRole('button', { name: 'Use my current location' }).click();
    await gps.page.waitForFunction(() => document.querySelector('#origin').value === 'Current location');
    assert.match(await gps.page.locator('#location-status').innerText(), /Location detected/);
    await gps.page.waitForFunction(() => window.__maps.length > 0);
    const actualCoordinates = await gps.page.evaluate(() => { let coordinates; window.__maps[0].eachLayer(layer => { if (layer instanceof L.Marker && layer.options.title === 'Origin: Current location') coordinates = [layer.getLatLng().lat, layer.getLatLng().lng]; }); return coordinates; });
    assert.deepEqual(actualCoordinates, [8.4862342, 124.6567018]);
    await findAndSelect(gps.page);
    assert.match(await gps.page.locator('#empty-title').innerText(), /Live jeepney routing/);
    assert.equal(await gps.page.locator('#empty-screen .recommendation').count(), 0);
    assert.equal(await gps.page.locator('#gps-trip-map .leaflet-marker-icon').count(), 7);
    assert.equal(await gps.page.evaluate(() => { let count = 0; window.__maps.at(-1).eachLayer(layer => { if (layer instanceof L.Polyline) count++; }); return count; }), 0);
    const persisted = await gps.page.evaluate(() => ({ url: location.href, history: history.state, local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }));
    assert.ok(!JSON.stringify(persisted).includes('8.4862342'));
    assert.ok(!gpsRequests.some(url => url.includes('8.4862342') || url.includes('124.6567018')));
    pass('Browser GPS success preserves exact position in memory and markers; no fabricated route or coordinate persistence/transmission');

    await gps.page.locator('[data-gps-demo]').click();
    assert.equal(await gps.page.locator('#origin').inputValue(), 'USTP CDO');
    assert.equal(await gps.page.locator('#destination').inputValue(), 'Divisoria');
    assert.match(await gps.page.locator('#location-status').innerText(), /sample landmark, not your detected position/);
    await findAndSelect(gps.page);
    assert.match(await gps.page.locator('.route-badge').innerText(), /D1/);
    pass('GPS unsupported state explicitly switches to a working demo trip without losing destination');
    await gps.context.close();

    const manual = await newPage({ permissions: ['geolocation'], geolocation: { latitude: 8.48, longitude: 124.65 } });
    await manual.page.getByRole('button', { name: 'Use my current location' }).click();
    await manual.page.waitForFunction(() => document.querySelector('#origin').value === 'Current location');
    await manual.page.locator('#origin').fill('Centrio');
    await manual.page.locator('#destination').fill('Divisoria');
    await findAndSelect(manual.page);
    assert.match(await manual.page.locator('.route-badge').innerText(), /D6/);
    pass('Manually editing the origin clears GPS state and restores curated routing');
    await manual.context.close();

    const outside = await newPage({ permissions: ['geolocation'], geolocation: { latitude: 14.5995, longitude: 120.9842 } });
    await outside.page.getByRole('button', { name: 'Use my current location' }).click();
    await outside.page.waitForFunction(() => document.querySelector('#origin').value === 'Current location');
    assert.match(await outside.page.locator('#location-status').innerText(), /outside our Cagayan de Oro demo area/);
    await outside.page.locator('#destination').fill('Divisoria');
    await findAndSelect(outside.page);
    assert.match(await outside.page.locator('.empty-content').innerText(), /outside our Cagayan de Oro demo area/);
    pass('Outside-CDO GPS is retained honestly, with no substituted landmark or jeepney');
    await outside.page.reload();
    assert.equal(await outside.page.locator('#home-screen').isVisible(), true);
    assert.equal(await outside.page.locator('#origin').inputValue(), '');
    assert.match(await outside.page.locator('#location-status').innerText(), /wasn’t saved/);
    pass('Reload of GPS-only result requests a new position instead of persisting coordinates');
    await outside.context.close();

    const denied = await newPage();
    const cdp = await denied.context.newCDPSession(denied.page);
    await cdp.send('Browser.setPermission', { permission: { name: 'geolocation' }, setting: 'denied', origin: base });
    await denied.page.getByRole('button', { name: 'Use my current location' }).click();
    await denied.page.waitForFunction(() => document.querySelector('#location-status').textContent.includes('permission was denied'));
    assert.equal(await denied.page.locator('#origin').inputValue(), 'USTP CDO');
    await denied.page.getByRole('button', { name: 'Try demo location: USTP CDO', exact: true }).click();
    assert.match(await denied.page.locator('#location-status').innerText(), /Demo location selected/);
    pass('Browser permission denial explains recovery; separate demo button works');
    await denied.context.close();

    for (const [code, expected] of [[2, 'unavailable'], [3, 'timed out']]) {
      const failure = await newPage({}, { content: `Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(ok, fail) { fail({code:${code}}); } } });` });
      await failure.page.getByRole('button', { name: 'Use my current location' }).click();
      assert.match(await failure.page.locator('#location-status').innerText(), new RegExp(expected));
      assert.equal(await failure.page.locator('#origin').inputValue(), 'USTP CDO');
      assert.equal(await failure.page.locator('#use-location').isDisabled(), false);
      pass(`Geolocation ${expected} error recovers without replacing the origin`);
      await failure.context.close();
    }
    for (const [name, script, expected] of [
      ['unsupported browser', "Object.defineProperty(navigator,'geolocation',{value:undefined});", /doesn’t support/],
      ['insecure context', "Object.defineProperty(window,'isSecureContext',{value:false});", /HTTPS or localhost/],
    ]) {
      const failure = await newPage({}, { content: script });
      await failure.page.getByRole('button', { name: 'Use my current location' }).click();
      assert.match(await failure.page.locator('#location-status').innerText(), expected);
      pass(`Geolocation ${name} explains the limitation`);
      await failure.context.close();
    }
    const race = await newPage({}, { content: "window.gpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok){window.gpsCalls++;setTimeout(()=>ok({coords:{latitude:8.48,longitude:124.65,accuracy:20}}),300)}}});" });
    assert.equal(await race.page.evaluate(() => window.gpsCalls), 0);
    await race.page.getByRole('button', { name: 'Use my current location' }).click();
    await race.page.getByRole('button', { name: 'Try demo location: USTP CDO', exact: true }).click();
    await race.page.waitForTimeout(450);
    assert.equal(await race.page.locator('#origin').inputValue(), 'USTP CDO');
    assert.equal(await race.page.evaluate(() => window.gpsCalls), 1);
    pass('Geolocation only runs after a click; late callbacks cannot overwrite a newer demo choice');
    await race.context.close();

    const offline = await newPage();
    await offline.context.unroute('https://tile.openstreetmap.org/**');
    await offline.context.route('https://tile.openstreetmap.org/**', route => route.abort('failed'));
    await offline.page.goto(`${base}/#trip/ustp/divisoria`);
    await offline.page.locator('#result-trip-map summary').click();
    await offline.page.waitForFunction(() => document.querySelector('#result-trip-map').classList.contains('map-unavailable'));
    assert.match(await offline.page.locator('#result-trip-map .map-status').innerText(), /illustrated journey still work/);
    assert.equal(await offline.page.locator('.timeline li').count(), 4);
    assert.ok(await offline.page.locator('.schematic').isVisible());
    await offline.context.unroute('https://tile.openstreetmap.org/**');
    await offline.context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: tile }));
    await offline.page.getByRole('button', { name: 'Retry map' }).click();
    await offline.page.waitForFunction(() => document.querySelector('#result-trip-map .map-status').textContent.startsWith('Map ready'));
    pass('Tile failures preserve the illustration and steps; retry restores the map');
    await offline.context.close();

    const responsive = await newPage();
    fs.mkdirSync('.hackathon/maps-screenshots', { recursive: true });
    for (const width of [320, 360, 375, 390, 430, 768, 1440]) {
      await responsive.page.setViewportSize({ width, height: 844 });
      for (const trip of ['', '/#trip/ustp/divisoria']) {
        await responsive.page.goto(base + trip);
        const section = trip ? '#result-trip-map' : '#home-trip-map';
        await responsive.page.locator(`${section} summary`).click();
        await responsive.page.locator(`${section} [data-map-expand]`).click();
        assert.equal(await responsive.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${trip || 'home'} overflow at ${width}`);
        await responsive.page.locator(`${section} [data-map-expand]`).click();
        if ([390, 1440].includes(width)) await responsive.page.screenshot({ path: `.hackathon/maps-screenshots/${trip ? 'result' : 'home'}-${width}-fixture.png`, fullPage: true });
      }
    }
    pass('Expanded home/result maps fit at 320/360/375/390/430/768/1440px');
    await responsive.context.close();
    assert.deepEqual(pageErrors, []);
    pass('No uncaught JavaScript errors across map/geolocation scenarios');
    fs.writeFileSync('.hackathon/maps-test-results.json', JSON.stringify({ date: '2026-10-17', browser: 'Chrome via Playwright', tileMode: 'intercepted fixture; no automated live OSM pan/zoom traffic', passed, pageErrors }, null, 2));
    console.log(`\n${passed.length} map/geolocation checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

// Route choice is intentional in the complete experience; retain the detail checks.
async function findAndSelect(target) {
  await target.getByRole('button', { name: 'Find my jeepney', exact: true }).click();
  if (await target.locator('#options-screen').isVisible()) {
    await target.locator('[data-select-option]').first().click();
  }
}
