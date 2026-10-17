const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
const storageKey = 'routacagayan.demo.v1';
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edf3e9"/><path d="M0 90h256M90 0v256" stroke="#d2decc" stroke-width="10"/><text x="105" y="150" fill="#74856b" font-size="11">TEST TILE</text></svg>';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const passed = [];
  const errors = [];
  const pass = text => { passed.push(text); console.log(`PASS ${text}`); };
  fs.mkdirSync('.hackathon/experience-screenshots', { recursive: true });
  async function setup(width = 390, extra = {}) {
    const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 1000 : 844 }, isMobile: width < 761, hasTouch: width < 761, ...extra });
    await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: tile }));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base);
    return { context, page };
  }
  async function capture(page, name) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `.hackathon/experience-screenshots/${name}.png`, fullPage: false });
  }
  async function clearState(page) { await page.evaluate(key => localStorage.removeItem(key), storageKey); await page.goto(base); }
  try {
    for (const width of [360, 390, 430, 1440]) {
      const { page, context } = await setup(width);
      assert.match(await page.locator('#location-status').innerText(), /GPS is off/);
      if (width < 761) {
        assert.equal(await page.locator('#bottom-nav a').count(), 3);
        const find = await page.locator('#find-button').boundingBox();
        const nav = await page.locator('#bottom-nav').boundingBox();
        assert.ok(find.y + find.height < nav.y, `Primary action hidden at ${width}px`);
        assert.equal(await page.locator('.explore-panel').isVisible(), false);
        await page.locator('#destination').tap();
        assert.equal(await page.locator('#destination-search').isVisible(), true);
        assert.equal(await page.locator('#bottom-nav').isVisible(), false);
        assert.equal(await page.evaluate(() => document.activeElement.id), 'search-destination');
        await page.locator('#search-destination').fill('dIvIs');
        await page.locator('[data-search-place="divisoria"]').click();
        assert.equal(await page.locator('[data-search-place="divisoria"]').getAttribute('aria-pressed'), 'true');
        if (width === 390) await capture(page, 'search-390');
        await page.locator('#search-submit').click();
      } else {
        assert.equal(await page.locator('#bottom-nav').isVisible(), false);
        assert.equal(await page.locator('.explore-panel').isVisible(), true);
        await page.locator('#destination').fill('Divisoria');
        await page.locator('#find-button').click();
      }
      assert.equal(await page.locator('#options-screen').isVisible(), true);
      assert.equal(await page.locator('.trip-option').count(), 2);
      assert.match(await page.locator('.trip-option').first().innerText(), /1 jeepney ride · No transfers/);
      assert.match(await page.locator('.trip-option').nth(1).innerText(), /2 jeepney rides · 1 transfer/);
      assert.match(await page.locator('.trip-option').first().innerText(), /D1 · Divisoria · DEMO/);
      await capture(page, `options-${width}`);
      await page.locator('[data-select-option="d1-ustp-divisoria"]').click();
      assert.equal(await page.locator('.timeline li').count(), 4);
      assert.match(await page.locator('.trip-signboard').innerText(), /D1 · Divisoria · DEMO/);
      assert.equal(await page.getByRole('button', { name: 'Open JoyRide', exact: true }).isVisible(), true);
      assert.equal(await page.getByRole('button', { name: 'Open Angkas', exact: true }).isVisible(), true);
      if (width < 761) {
        const start = await page.locator('#start-trip-guide').boundingBox();
        const nav = await page.locator('#bottom-nav').boundingBox();
        assert.ok(start.y + start.height <= nav.y, 'Start button overlaps bottom navigation');
        assert.equal(await page.locator('#start-trip-guide').evaluate(button => { const r = button.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === button; }), true);
      }
      await page.locator('#start-trip-guide').click();
      assert.equal(await page.locator('#guide-screen').isVisible(), true);
      assert.equal(await page.locator('#bottom-nav').isVisible(), false);
      assert.match(await page.locator('.guide-manual-note').innerText(), /no location tracking/);
      for (let step = 0; step < 4; step++) {
        assert.match(await page.locator('.current-guide-step .eyebrow').innerText(), new RegExp(`STEP ${step + 1} OF 4`));
        assert.equal(await page.locator('.guide-step-list .is-complete').count(), step);
        assert.equal(await page.locator('.guide-step-list [aria-current="step"]').count(), 1);
        if (step === 1) {
          await page.reload();
          assert.match(await page.locator('.current-guide-step .eyebrow').innerText(), /STEP 2 OF 4/);
          await page.locator('#previous-guide-step').click();
          assert.match(await page.locator('.current-guide-step .eyebrow').innerText(), /STEP 1 OF 4/);
          await page.locator('#advance-guide').click();
        }
        if (width === 390 && step === 1) await capture(page, 'guide-390');
        await page.locator('#advance-guide').click();
      }
      assert.equal(await page.locator('#arrival-screen').isVisible(), true);
      assert.match(await page.locator('.arrival-content').innerText(), /You're here!/);
      const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
      assert.equal(stored.activeTrip, null);
      assert.equal(stored.selectedOptionId, null);
      assert.deepEqual(stored.lastSearch, { originId: 'ustp', destinationId: 'divisoria' });
      if (width === 390) await capture(page, 'arrival-390');
      await page.getByRole('link', { name: 'Plan another trip' }).click();
      assert.equal(await page.locator('#home-screen').isVisible(), true);
      assert.equal(await page.locator('#destination').inputValue(), 'Divisoria');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      pass(`${width}px: Home → focused search → compare options → details → four manual steps → arrival → Home; refresh, previous step, safe action placement, and selections preserved`);
      await context.close();
    }

    const { page, context } = await setup();
    await page.locator('#bottom-nav [data-main-nav="mytrip"]').click();
    assert.match(await page.locator('#mytrip-screen').innerText(), /Your next trip starts here/);
    await page.locator('#bottom-nav [data-main-nav="directory"]').click();
    assert.equal(await page.locator('.directory-line').count(), 7);
    await page.locator('#directory-search').fill('cOgOn');
    assert.equal(await page.locator('.directory-line').count(), 2);
    await page.locator('#directory-search').fill('D1');
    await page.locator('.directory-line').click();
    assert.match(await page.locator('#line-screen .trip-signboard').innerText(), /D1 · Divisoria/);
    assert.equal(await page.locator('#line-direction option').count(), 2);
    await page.locator('#line-direction').selectOption('reverse');
    assert.match(await page.locator('#line-screen .trip-signboard').innerText(), /D1 · USTP CDO/);
    await page.locator('[data-plan-line]').click();
    assert.match(await page.locator('#options-screen .app-subtitle').innerText(), /Divisoria.*USTP CDO/);
    await page.locator('[data-select-option]').first().click();
    await page.locator('#bottom-nav [data-main-nav="mytrip"]').click();
    assert.match(await page.locator('#mytrip-screen').innerText(), /A demo journey, ready/);
    pass('Jeepneys directory searches the shared seven lines, exposes explicit reverse data, and plans a matching selected journey in My Trip');

    await page.goto(`${base}/#options/ustp/divisoria`);
    await page.locator('[data-select-option="via-centrio-ustp-divisoria"]').click();
    assert.equal(await page.locator('.timeline li').count(), 7);
    assert.equal(await page.locator('.detail-badges .route-badge').count(), 2);
    assert.match(await page.locator('.transfer-schematic').innerText(), /Transfer D2 → D6 DEMO/);
    await page.locator('#result-trip-map summary').click();
    await page.getByRole('button', { name: 'Transfer: Centrio', exact: true }).waitFor();
    await page.locator('#start-trip-guide').click();
    await page.locator('#advance-guide').click();
    await page.locator('#advance-guide').click();
    await page.locator('#exit-guide').click();
    await page.locator('#confirm-cancel').click();
    assert.match(await page.locator('.current-guide-step .eyebrow').innerText(), /STEP 3 OF 7/);
    await page.locator('#exit-guide').click();
    await page.locator('#confirm-accept').click();
    assert.equal(await page.locator('#mytrip-screen').isVisible(), true);
    assert.match(await page.locator('.saved-step').innerText(), /Step 3 of 7/);
    await page.locator('#bottom-nav [data-main-nav="home"]').click();
    await page.locator('#bottom-nav [data-main-nav="directory"]').click();
    await page.locator('#bottom-nav [data-main-nav="mytrip"]').click();
    await page.reload();
    await page.locator('[data-start-option]').click();
    assert.match(await page.locator('.current-guide-step .eyebrow').innerText(), /STEP 3 OF 7/);
    for (let step = 2; step < 7; step++) await page.locator('#advance-guide').click();
    assert.match(await page.locator('#arrival-screen').innerText(), /D2/);
    assert.match(await page.locator('#arrival-screen').innerText(), /D6/);
    await page.locator('#bottom-nav [data-main-nav="mytrip"]').click();
    assert.match(await page.locator('#mytrip-screen').innerText(), /Your next trip starts here/);
    pass('Seven-step D2 → Centrio → D6 transfer guide: map transfer marker, exit confirmation, tab switching, refresh/resume, and intentional completion clearing');

    await clearState(page);
    await page.locator('#destination').tap();
    await page.locator('#search-destination').fill('Airport nowhere');
    assert.equal(await page.locator('#search-no-match').isVisible(), true);
    await page.locator('#search-submit').click();
    assert.equal(await page.locator('#destination-search').isVisible(), true);
    await page.locator('#search-destination').fill('USTP CDO');
    await page.locator('#search-submit').click();
    assert.match(await page.locator('#search-help').innerText(), /both places are the same/);
    await page.locator('#search-destination').fill('Divisoria');
    await page.locator('[data-search-place="divisoria"]').click();
    await page.locator('.search-back').click();
    await page.waitForFunction(() => !document.querySelector('#destination-search').open);
    assert.equal(await page.locator('#destination').inputValue(), 'Divisoria');
    await page.locator('#find-button').click();
    await page.locator('[data-select-option]').first().click();
    await page.locator('.details-back').click();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    await page.locator('[data-select-option="via-centrio-ustp-divisoria"]').click();
    assert.equal(await page.locator('.timeline li').count(), 7);
    await page.goBack();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    pass('Unknown/same-place searches explain recovery; search Back preserves chosen places; details Back and browser Back allow changing options');

    await page.goto(`${base}/#trip/ustp/divisoria`);
    await page.locator('#start-trip-guide').click();
    await page.locator('#advance-guide').click();
    await page.locator('#exit-guide').click();
    await page.goBack();
    assert.equal(await page.locator('#guide-confirm').isVisible(), false);
    assert.equal(await page.locator('#result-screen').isVisible(), true);
    await page.goto(`${base}/#trip/ustp/centrio`);
    await page.locator('#start-trip-guide').click();
    assert.match(await page.locator('#guide-confirm-title').innerText(), /Replace your saved guide/);
    await page.locator('#confirm-cancel').click();
    await page.locator('#bottom-nav [data-main-nav="mytrip"]').click();
    assert.match(await page.locator('.saved-step').innerText(), /Step 2 of 4/);
    assert.match(await page.locator('.my-trip-card h2').innerText(), /Divisoria/);
    pass('Selecting another journey cannot silently replace an existing saved guide');

    await clearState(page);
    await page.locator('#origin').fill('Centrio');
    await page.locator('#destination').fill('Cogon Market');
    await page.locator('#find-button').click();
    assert.equal(await page.locator('#empty-screen').isVisible(), true);
    assert.match(await page.locator('#empty-title').innerText(), /isn’t in our/);
    await page.locator('.example-trip').first().click();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Browser.setPermission', { permission: { name: 'geolocation' }, setting: 'denied', origin: base });
    await page.locator('#bottom-nav [data-main-nav="home"]').click();
    await page.locator('#use-location').click();
    await page.waitForFunction(() => document.querySelector('#location-status').textContent.includes('permission was denied'));
    await page.locator('#demo-location').click();
    assert.match(await page.locator('#location-status').innerText(), /Demo location selected/);
    await page.locator('#destination').fill('Divisoria');
    await page.locator('#find-button').click();
    assert.equal(await page.locator('.trip-option').count(), 2);
    pass('Unsupported pair offers working examples; real browser GPS denial preserves manual/demo routing');

    await page.evaluate(() => document.documentElement.style.setProperty('--safe-area-bottom', '24px'));
    const navHeight = (await page.locator('#bottom-nav').boundingBox()).height;
    assert.ok(navHeight >= 88);
    await page.locator('[data-select-option]').first().click();
    let start = await page.locator('#start-trip-guide').boundingBox();
    let nav = await page.locator('#bottom-nav').boundingBox();
    assert.ok(start.y + start.height <= nav.y);
    await page.locator('#result-trip-map summary').click();
    await page.locator('#result-trip-map [data-map-expand]').click();
    assert.equal(await page.locator('#start-trip-guide').evaluate(button => { const r = button.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === button; }), true);
    pass('Simulated 24px safe area keeps sticky CTA above navigation; expanded map cannot block the primary action');

    const state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
    assert.ok(!JSON.stringify(state).includes('coordinates'));
    assert.ok(!JSON.stringify(state).includes('latitude'));
    await page.evaluate(key => localStorage.setItem(key, '{broken json'), storageKey);
    await page.reload();
    assert.equal(await page.locator('#result-screen').isVisible(), true);
    pass('Persistence stores fixture identifiers/progress only; malformed storage does not break the app');

    for (const width of [360, 390, 430, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      for (const hash of ['#home', '#options/ustp/divisoria', '#trip/ustp/divisoria/via-centrio-ustp-divisoria', '#jeepneys', '#line/D6/reverse', '#my-trip']) {
        await page.goto(`${base}/${hash}`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}: ${hash}`);
        if (width === 390 && ['#home', '#jeepneys', '#my-trip'].includes(hash)) await capture(page, `${hash.slice(1)}-390`);
      }
      await page.goto(`${base}/#trip/ustp/divisoria/via-centrio-ustp-divisoria`);
      await page.locator('#start-trip-guide').click();
      // A saved direct guide may require explicit replacement.
      if (await page.locator('#guide-confirm').isVisible()) await page.locator('#confirm-accept').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Transfer guide overflow ${width}`);
      await page.locator('#exit-guide').click();
      await page.locator('#confirm-accept').click();
    }
    pass('Home, options, transfer details, directory, line details, My Trip, and transfer guide have no overflow at 360/390/430/1440px');

    await page.setViewportSize({ width: 390, height: 450 });
    await page.goto(base);
    await page.locator('#destination').tap();
    await page.locator('#search-destination').fill('div');
    await page.locator('[data-search-place="divisoria"]').click();
    const searchButton = await page.locator('#search-submit').boundingBox();
    assert.ok(searchButton.y + searchButton.height <= 450);
    assert.equal(await page.locator('#search-submit').evaluate(button => { const r = button.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === button; }), true);
    await page.locator('#search-submit').click();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    pass('Focused search remains usable in a 390x450 reduced visual viewport (keyboard-space approximation)');
    await context.close();

    const blocked = await setup(390);
    await blocked.page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); }; });
    await blocked.page.goto(`${base}/#trip/ustp/divisoria`);
    await blocked.page.reload();
    await blocked.page.locator('#start-trip-guide').click();
    await blocked.page.locator('#advance-guide').click();
    await blocked.page.locator('#exit-guide').click();
    await blocked.page.locator('#confirm-accept').click();
    assert.match(await blocked.page.locator('.save-note').innerText(), /storage is unavailable/);
    await blocked.page.locator('[data-start-option]').click();
    assert.match(await blocked.page.locator('.current-guide-step .eyebrow').innerText(), /STEP 2 OF 4/);
    pass('Blocked storage still allows in-tab guide resume and explains the persistence limit');
    await blocked.context.close();

    assert.deepEqual(errors, []);
    pass('No console errors or uncaught application exceptions during the complete walkthrough');
    fs.writeFileSync('.hackathon/experience-test-results.json', JSON.stringify({ date: '2026-10-17', browser: 'Chrome through Playwright; mobile touch emulation', tiles: 'Fixture tiles for repeated map checks', safeArea: 'CSS 24px simulated inset; physical notch not tested', passed, errors }, null, 2));
    console.log(`\n${passed.length} complete-experience checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
