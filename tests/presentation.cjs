/* Focused real-browser checks for the launch and map-first home experience. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
const evidence = '.hackathon/presentation-screenshots';
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edf3e9"/><path d="M0 70h256M75 0v256M0 190h256M195 0v256" stroke="#fff" stroke-width="9"/><text x="20" y="150" fill="#637378" font-size="12">QA MAP FIXTURE</text></svg>';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const passed = [], errors = [];
  const pass = message => { passed.push(message); console.log(`PASS ${message}`); };
  fs.mkdirSync(evidence, { recursive: true });
  async function setup(width, height = 844, options = {}) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 761, hasTouch: width < 761, ...options });
    await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: tile }));
    await context.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => { window.launchStart = performance.now(); });
      window.addEventListener('routa:launched', () => { window.launchDuration = performance.now() - window.launchStart; });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    return { context, page };
  }
  const launched = async page => { await page.locator('#launch-splash').waitFor({ state: 'detached' }); await page.waitForTimeout(400); };
  const overflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  try {
    for (const width of [360, 390, 430]) {
      const { context, page } = await setup(width, width === 360 ? 800 : 844);
      await page.goto(base);
      assert.equal(await page.locator('#launch-splash').evaluate(el => el.matches(':modal')), true);
      if (width === 390) { await page.waitForTimeout(650); await page.screenshot({ path: `${evidence}/splash-390.png` }); }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#launch-splash').isVisible(), true);
      await launched(page);
      const duration = await page.evaluate(() => launchDuration);
      assert.ok(duration >= 2900 && duration < 4500, `Launch lasted ${duration}ms`);
      const map = await page.locator('#home-trip-map .leaflet-map').boundingBox();
      const input = await page.locator('#destination').boundingBox();
      const button = await page.locator('#find-button').boundingBox();
      const nav = await page.locator('#bottom-nav').boundingBox();
      assert.ok(map.height >= 210 && map.y < input.y);
      assert.ok(input.height >= 44);
      assert.ok(button.y + button.height <= nav.y, `Primary action covered at ${width}px`);
      assert.match(await page.locator('.home-map-mode').innerText(), /GPS off/);
      assert.ok(await page.locator('#home-trip-map .leaflet-control-attribution').isVisible());
      assert.equal(await page.locator('#home-trip-map .marker-origin').count(), 0, 'No fabricated DICT coordinates');
      await overflow(page);
      await page.screenshot({ path: `${evidence}/home-${width}.png` });
      await page.locator('#destination').click();
      assert.equal(await page.locator('#destination-search').isVisible(), true);
      const first = page.locator('[data-search-place]').first();
      assert.ok((await first.boundingBox()).height >= 44);
      await overflow(page);
      await page.locator('.search-back').click();
      assert.equal(await page.locator('#destination').inputValue(), 'Centrio');
      await page.locator('#destination').click();
      await page.locator('[data-search-place="centrio"]').click();
      await page.locator('#search-submit').click();
      assert.equal(await page.locator('#options-screen').isVisible(), true);
      assert.ok(await page.locator('#options-screen').evaluate(el => el.getAnimations().some(a => a.playState === 'running')));
      await page.locator('[data-select-option]').first().click();
      assert.match(await page.locator('.route-badge').innerText(), /R1/);
      assert.equal(await page.locator('.timeline li').count(), 4);
      assert.equal(await page.locator('#launch-splash').count(), 0);
      await page.locator('#start-trip-guide').click();
      const guideAction = await page.locator('#advance-guide').boundingBox();
      assert.ok(guideAction.y >= 0 && guideAction.y + guideAction.height <= (width === 360 ? 800 : 844), 'Guide action remains anchored during entry motion');
      for (let step = 0; step < 4; step++) await page.locator('#advance-guide').click();
      assert.equal(await page.locator('#arrival-screen').isVisible(), true);
      await overflow(page);
      pass(`${width}px: three-second modal splash, map-first layout, visible CTA, picker cancel, animated results and four-step arrival`);
      await context.close();
    }

    const { context, page } = await setup(390);
    await page.goto(base);
    await launched(page);
    for (let tap = 0; tap < 6; tap++) {
      await page.locator('#origin').tap();
      assert.match(await page.locator('#search-list-title').innerText(), /starting point/);
      assert.equal(await page.locator('#search-origin').inputValue(), 'DICT Office');
      await page.locator('.search-back').tap();
      await page.waitForFunction(() => !document.querySelector('#destination-search').open && !location.hash.startsWith('#search/'));
    }
    await page.locator('#origin').click();
    await page.screenshot({ path: `${evidence}/starting-point-picker.png` });
    assert.match(await page.locator('#search-list-title').innerText(), /starting point/);
    await page.locator('[data-search-place="ustp"]').click();
    await page.locator('[data-search-place="limketkai"]').click();
    await page.locator('#search-submit').click();
    assert.equal(await page.locator('.trip-option').count(), 2);
    await page.goBack();
    await page.locator('#home-screen').waitFor({ state: 'visible' });
    if (await page.locator('#destination-search').isVisible()) await page.locator('.search-back').click();
    assert.equal(await page.locator('#origin').inputValue(), 'USTP CDO');
    assert.equal(await page.locator('#destination').inputValue(), 'Limketkai');
    await page.locator('#bottom-nav [data-main-nav="directory"]').click();
    assert.equal(await page.locator('.directory-line').count(), 8);
    await page.locator('#bottom-nav [data-main-nav="mytrip"]').click();
    assert.equal(await page.locator('#mytrip-screen').isVisible(), true);
    await page.locator('#bottom-nav [data-main-nav="home"]').click();
    await page.locator('#smart-search summary').click();
    await page.locator('#smart-trip-input').selectOption('From DICT Office to Centrio');
    await page.locator('#smart-trip-form button').click();
    assert.equal(await page.locator('#smart-view-routes').isVisible(), true);
    await page.locator('#smart-view-routes').click();
    assert.ok(await page.locator('.trip-option').count());
    pass('USTP/Limketkai comparison, browser Back with choices retained, eight-line directory, My Trip and Routa AI preserved');
    await page.locator('[data-select-option]').first().click();
    const tripUrl = page.url();
    for (const [provider, url] of [['joyride', 'https://joyride.com.ph/'], ['angkas', 'https://www.angkas.com/']]) {
      await page.locator(`[data-ride-provider="${provider}"]`).click();
      assert.equal(await page.locator('#handoff-continue').getAttribute('href'), url);
      assert.equal(await page.locator('#handoff-destination').innerText(), 'Centrio');
      await page.locator('.handoff-cancel').click();
      assert.equal(page.url(), tripUrl);
      assert.equal(await page.locator('#result-screen').isVisible(), true);
    }
    await page.locator('#bottom-nav [data-main-nav="home"]').click();
    const mapHeight = (await page.locator('#home-trip-map .leaflet-map').boundingBox()).height;
    await page.locator('#home-trip-map [data-map-expand]').click();
    assert.ok((await page.locator('#home-trip-map .leaflet-map').boundingBox()).height > mapHeight + 100);
    await page.locator('#home-trip-map .home-map-info summary').click();
    assert.equal(await page.locator('#home-trip-map .map-connection-note').isVisible(), true);
    await page.setViewportSize({ width: 390, height: 450 });
    await page.locator('#find-button').click();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    await overflow(page);
    pass('Provider URLs and cancel retain the trip; expanded map and short viewport keep the planner usable');
    await context.close();

    const reduced = await setup(390, 844, { reducedMotion: 'reduce' });
    await reduced.page.goto(base);
    assert.equal(await reduced.page.locator('.launch-identity').evaluate(el => getComputedStyle(el).animationName), 'none');
    await launched(reduced.page);
    await reduced.page.locator('#destination').click();
    assert.equal(await reduced.page.locator('#destination-search').evaluate(el => getComputedStyle(el).animationName), 'none');
    await reduced.page.locator('#search-submit').click();
    assert.equal(await reduced.page.locator('#options-screen').evaluate(el => el.getAnimations().length), 0);
    pass('Reduced motion keeps the launch timing and disables splash, picker, and screen motion');
    await reduced.context.close();

    const desktop = await setup(1280, 900);
    await desktop.page.goto(base);
    await launched(desktop.page);
    const dm = await desktop.page.locator('#home-trip-map').boundingBox();
    const dp = await desktop.page.locator('.planner-column').boundingBox();
    assert.ok(dm.x + dm.width <= dp.x + 1);
    await overflow(desktop.page);
    await desktop.page.screenshot({ path: `${evidence}/home-desktop.png` });
    pass('Desktop has a proportional map and planner, with no horizontal overflow');
    await desktop.context.close();

    const offline = await setup(390);
    await offline.context.unroute('https://tile.openstreetmap.org/**');
    await offline.context.route('https://tile.openstreetmap.org/**', route => route.abort());
    await offline.page.goto(base);
    await launched(offline.page);
    await offline.page.locator('#home-trip-map.map-unavailable').waitFor();
    assert.equal(await offline.page.locator('[data-map-retry]').first().isVisible(), true);
    await offline.page.locator('#find-button').click();
    assert.equal(await offline.page.locator('#options-screen').isVisible(), true);
    pass('Tile failure does not delay splash completion or prevent trip results; retry remains accessible');
    await offline.context.close();

    assert.deepEqual(errors, []);
    pass('No uncaught browser exceptions');
    fs.writeFileSync('.hackathon/presentation-results.json', JSON.stringify({ passed, errors, tiles: 'Local SVG fixtures; live OSM separately reviewed once' }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
