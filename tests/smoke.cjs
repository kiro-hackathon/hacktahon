/* Optional browser QA. Requires an existing Playwright installation and Chrome.
   Start the static server, then run: node tests/smoke.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const requests = [];
  const passed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
  const pass = name => { passed.push(name); console.log(`PASS ${name}`); };
  const search = async (from, to) => {
    await page.goto(base);
    await page.locator('#origin').fill(from);
    await page.locator('#destination').fill(to);
    await page.getByRole('button', { name: 'Find my jeepney' }).click();
  };
  try {
    await page.goto(base);
    await page.getByRole('button', { name: 'Find my jeepney' }).click();
    assert.match(await page.locator('#form-error').innerText(), /Choose a destination/);
    assert.equal(await page.locator('#destination').getAttribute('aria-invalid'), 'true');
    pass('Empty destination shows actionable validation');

    await page.locator('#destination').fill('Airport');
    assert.match(await page.locator('#destination-list').innerText(), /No matching landmark/);
    await page.getByRole('button', { name: 'Find my jeepney' }).click();
    assert.match(await page.locator('#form-error').innerText(), /recognize that destination/);
    pass('Unknown landmark shows suggestion and validation recovery');

    await page.locator('#destination').fill('USTP CDO');
    await page.getByRole('button', { name: 'Find my jeepney' }).click();
    assert.match(await page.locator('#form-error').innerText(), /same place twice/);
    pass('Identical endpoints are handled');

    await page.goto(base);
    assert.equal(await page.getByRole('button', { name: 'USTP CDO is your starting point' }).isDisabled(), true);
    assert.match(await page.locator('[data-destination="ustp"] small').innerText(), /Your starting point/);
    await page.getByRole('button', { name: 'Set destination to Divisoria', exact: true }).click();
    assert.equal(await page.locator('#destination').inputValue(), 'Divisoria');
    assert.equal(await page.locator('[data-destination="divisoria"]').getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Find my jeepney' }).click();
    assert.equal(await page.locator('#result-screen').isVisible(), true);
    assert.match(await page.locator('.route-badge').innerText(), /D1/);
    assert.equal(await page.locator('.timeline li').count(), 4);
    const steps = await page.locator('.timeline').innerText();
    for (const text of ['USTP CDO demo boarding point', 'Board the D1 demo jeepney', 'Divisoria demo stop', 'Walk to your destination']) assert.ok(steps.includes(text));
    assert.match(await page.locator('.result-disclosure').innerText(), /fictional and unverified/);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'result-title');
    pass('Shortcut → D1 result; four correct steps; disclosure; focus');

    await page.reload();
    assert.match(await page.locator('#result-title').innerText(), /Divisoria/);
    await page.getByRole('button', { name: 'Change trip', exact: true }).click();
    assert.equal(await page.locator('#destination').inputValue(), 'Divisoria');
    await page.getByRole('button', { name: 'Swap starting point and destination' }).click();
    assert.equal(await page.locator('#origin').inputValue(), 'Divisoria');
    assert.equal(await page.locator('#destination').inputValue(), 'USTP CDO');
    await page.getByRole('button', { name: 'Find my jeepney' }).click();
    assert.match(await page.locator('.timeline li').first().innerText(), /Divisoria demo boarding point/);
    assert.match(await page.locator('.timeline li').last().innerText(), /USTP CDO/);
    pass('Reload, change trip, preserved fields, swap, and reverse instructions');

    await search('Centrio', 'Cogon Market');
    assert.equal(await page.locator('#empty-screen').isVisible(), true);
    assert.match(await page.locator('.empty-content').innerText(), /Centrio → Cogon Market/);
    await page.locator('.example-trip').first().click();
    assert.equal(await page.locator('#result-screen').isVisible(), true);
    assert.match(await page.locator('#result-title').innerText(), /Centrio/);
    pass('Unsupported pair offers a working journey from the same origin');

    await page.goto(base);
    await page.locator('#destination').fill('aya');
    assert.match(await page.locator('#destination-list').innerText(), /Centrio/);
    await page.locator('#destination').press('ArrowDown');
    assert.ok(await page.locator('#destination').getAttribute('aria-activedescendant'));
    await page.locator('#destination').press('Enter');
    assert.equal(await page.locator('#destination').inputValue(), 'Centrio');
    assert.equal(await page.locator('#destination').getAttribute('aria-expanded'), 'false');
    await page.locator('#destination').press('ArrowDown');
    await page.locator('#destination').press('Escape');
    assert.equal(await page.locator('#destination').getAttribute('aria-expanded'), 'false');
    pass('Autocomplete alias search, ArrowDown, Enter, and Escape');

    await page.getByRole('button', { name: 'How it works' }).click();
    assert.equal(await page.locator('dialog').isVisible(), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').isVisible(), false);
    await page.getByRole('button', { name: 'About the demo' }).click();
    await page.getByRole('button', { name: 'Got it. Let’s plan a trip' }).click();
    assert.equal(await page.locator('dialog').isVisible(), false);
    pass('Both information controls and dialog dismissal work');

    // Validate every curated pair in both directions rather than only one screenshot.
    const pairs = [['ustp', 'divisoria', 'D1'], ['ustp', 'centrio', 'D2'], ['ustp', 'limketkai', 'D3'], ['ustp', 'cogon', 'D4'], ['ustp', 'sm', 'D5'], ['divisoria', 'centrio', 'D6'], ['cogon', 'limketkai', 'D7']];
    for (const [from, to, code] of pairs) {
      for (const [a, b] of [[from, to], [to, from]]) {
        await page.goto(`${base}/#trip/${a}/${b}`);
        await page.reload();
        assert.match(await page.locator('.route-badge').innerText(), new RegExp(code));
        assert.equal(await page.locator('.timeline li').count(), 4);
      }
    }
    pass('All 7 curated pairs work in both directions (14 journeys)');

    fs.mkdirSync('.hackathon/screenshots', { recursive: true });
    for (const width of [320, 360, 375, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      for (const state of ['home', 'result', 'empty']) {
        await page.goto(state === 'home' ? base : state === 'result' ? `${base}/#trip/ustp/divisoria` : `${base}/#trip/centrio/cogon`);
        await page.reload();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${state} overflow at ${width}px`);
        if ([375, 390, 1440].includes(width)) await page.screenshot({ path: `.hackathon/screenshots/${state}-${width}.png`, fullPage: true });
      }
    }
    pass('Home, result, and empty states: no overflow at 320/360/375/390/430/768/1440px');

    // Browser zoom changes the CSS viewport. 640 CSS px represents a 1280px
    // display at 200%; CSS `zoom` would not update responsive media queries.
    await page.setViewportSize({ width: 640, height: 450 });
    await page.goto(base);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    pass('200% zoom equivalent reflow (640 CSS px) and reduced-motion scroll behavior');

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/#trip/ustp/divisoria`);
    await page.reload();
    await page.getByRole('link', { name: 'Plan a trip', exact: true }).click();
    assert.equal(await page.locator('#home-screen').isVisible(), true);
    await page.goBack();
    assert.equal(await page.locator('#result-screen').isVisible(), true);
    await page.goForward();
    assert.equal(await page.locator('#home-screen').isVisible(), true);
    pass('Plan navigation, browser Back, and Forward restore correct screens');

    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    await search('USTP CDO', 'SM CDO Downtown Premier');
    assert.match(await page.locator('.route-badge').innerText(), /D5/);
    assert.equal(requests.some(url => !url.startsWith(base)), false);
    pass('App makes only local requests and works with external network blocked');

    assert.deepEqual(errors, []);
    pass('No browser console errors, uncaught exceptions, or HTTP failures');
    fs.writeFileSync('.hackathon/test-results.json', JSON.stringify({ browser: 'Chrome (Playwright)', passed, errors, date: '2026-10-17' }, null, 2));
    console.log(`\n${passed.length} checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
