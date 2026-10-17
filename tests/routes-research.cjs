const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edf3e9"/></svg>';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const passed = [];
  const pass = message => { passed.push(message); console.log(`PASS ${message}`); };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: tile }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const visit = async hash => { await page.goto(`${base}/${hash}`); await page.reload(); await page.locator('#bottom-nav').waitFor({ state: 'attached' }); };
  const overflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  fs.mkdirSync('.hackathon/route-research-screenshots', { recursive: true });
  try {
    await visit('');
    const data = await page.evaluate(async () => {
      const r = await import('./src/routes.js');
      return {
        codes: r.routes.map(line => line.code), ids: r.routes.map(line => line.id),
        forward: r.getTripOptions('gaisano', 'carmen').map(line => line.code),
        downtown: r.getTripOptions('centrio', 'divisoria').map(line => line.code),
        reverse: r.getTripOptions('limketkai', 'ustp').length,
        conditionalR1: r.getTripOptions('gaisano', 'cogon').map(line => line.code),
        highway: r.searchLines('Highway').map(line => line.code),
        all: r.tripOptions.map(option => ({ id: option.id, from: option.originId, to: option.destinationId, code: option.code })),
        aliases: ['camp evangelista', 'carmen public market', 'nha', 'gaisano city mall', 'ketkai'].map(q => r.resolveLocation(q)?.id),
        empty: r.getTripOptions('bugo', 'patag').length,
      };
    });
    assert.deepEqual(data.codes, ['R1', 'R2', 'C2', 'B3', 'Patag', 'Iponan', 'NHA', 'RD']);
    assert.equal(new Set(data.ids).size, 8);
    assert.deepEqual(data.forward, ['R1', 'R2']);
    assert.deepEqual(data.downtown, ['R2']);
    assert.equal(data.reverse, 0);
    assert.deepEqual(data.conditionalR1, ['R2']);
    assert.ok(data.highway.includes('B3') && !data.highway.includes('Highway'));
    assert.deepEqual(data.aliases, ['patag', 'carmen', 'nha', 'gaisano', 'limketkai']);
    assert.equal(data.empty, 0);
    pass('Eight stable signboards; direction-aware filtering, aliases, Highway corridor, and conditional R1 variant');

    // Exercise each curated option, its deep link, source disclosure, and four-step detail.
    for (const option of data.all) {
      await visit(`#trip/${option.from}/${option.to}/${option.id}`);
      assert.equal(await page.locator('#result-screen').isVisible(), true, option.id);
      assert.match(await page.locator('.route-badge').innerText(), new RegExp(option.code));
      assert.equal(await page.locator('.timeline li').count(), 4);
      assert.match(await page.locator('.result-disclosure').innerText(), /Confirm the signboard/);
      assert.ok(await page.locator('.result-disclosure a').count());
      assert.doesNotMatch(await page.locator('#result-screen').innerText(), /invented route|fictional|\bD[1-7]\b/i);
      await overflow();
    }
    pass(`All ${data.all.length} curated directional references load with source links and fitting badges`);

    await visit('#jeepneys');
    assert.equal(await page.locator('.directory-line').count(), 8);
    for (const query of ['R1', 'R2', 'C2', 'B3', 'Highway', 'Carmen', 'Patag', 'Gaisano', 'Cogon', 'Agora', 'Bulua', 'Iponan', 'Gusa', 'Bugo']) {
      await page.locator('#directory-search').fill(query);
      assert.ok(await page.locator('.directory-line').count(), query);
    }
    await page.locator('#directory-search').fill('does-not-exist');
    assert.match(await page.locator('#directory-list').innerText(), /No matching route/);
    await page.locator('#directory-search').fill('R1');
    // R2 notes also mention R1; select the actual R1 line rather than every text match.
    await page.locator('.directory-line[href^="#line/legacy-r1-gaisano-carmen/"]').click();
    assert.match(page.url(), /legacy-r1-gaisano-carmen/);
    await page.locator('#line-direction').selectOption('divisoria-centrio');
    assert.match(await page.locator('.trip-signboard').innerText(), /Centrio/);
    await page.reload();
    assert.equal(await page.locator('#line-direction').inputValue(), 'divisoria-centrio');
    await page.locator('#line-map summary').click();
    await page.waitForSelector('#line-map .leaflet-marker-icon');
    assert.match(await page.locator('#line-map .map-connection-note').innerText(), /not for navigation/);
    pass('Directory code and corridor search, no matches, stable line links, direction selection and reload');

    await visit('#line/legacy-r1-gaisano-carmen/gaisano-carmen');
    await page.locator('#line-map summary').click();
    await page.waitForSelector('#line-map .leaflet-marker-icon');
    assert.equal(await page.locator('#line-map .marker-origin').count(), 0);
    assert.equal(await page.locator('#line-map .marker-destination').count(), 0);
    assert.match(await page.locator('#line-map .map-connection-note').innerText(), /no verified map point/);
    pass('Unsourced areas do not create guessed map markers or paths');

    await page.evaluate(() => localStorage.clear());
    await visit('');
    assert.equal(await page.locator('#origin').inputValue(), 'DICT Office');
    assert.equal(await page.locator('#destination').inputValue(), 'Centrio');
    assert.equal(await page.locator('#origin').getAttribute('readonly'), '');
    assert.equal(await page.locator('#destination').getAttribute('readonly'), '');
    assert.equal(await page.locator('#use-location').isVisible(), false);
    await page.locator('#origin').focus();
    await page.keyboard.type('Unsupported');
    assert.equal(await page.locator('#origin').inputValue(), 'DICT Office');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#destination-search').isVisible(), true);
    const origins = await page.locator('[data-search-place]').evaluateAll(nodes => nodes.map(node => node.dataset.searchPlace));
    assert.ok(origins.includes('dict') && !origins.includes('bugo'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#destination-search').isVisible(), false);
    pass('Preset-only inputs, keyboard open/Escape, DICT default and no arbitrary GPS entry');

    let supportedPairs = 0;
    for (const originId of origins) {
      await visit('#home');
      await page.locator('#origin').click();
      await page.locator(`[data-search-place="${originId}"]`).click();
      const destinations = await page.locator('[data-search-place]').evaluateAll(nodes => nodes.map(node => node.dataset.searchPlace));
      assert.ok(destinations.length, originId);
      for (const destinationId of destinations) {
        if (!(await page.locator('#destination-search').isVisible())) await page.locator('#destination').click();
        await page.locator(`[data-search-place="${destinationId}"]`).click();
        await page.locator('#search-submit').click();
        assert.equal(await page.locator('#options-screen').isVisible(), true, `${originId}/${destinationId}`);
        assert.ok(await page.locator('.trip-option').count());
        await page.locator('[data-select-option]').first().click();
        assert.equal(await page.locator('#result-screen').isVisible(), true);
        assert.equal(await page.locator('.timeline li').count(), 4);
        assert.equal(await page.locator('#empty-screen').isVisible(), false);
        supportedPairs++;
        await visit('#home');
      }
    }
    pass(`All ${supportedPairs} selectable origin/destination pairs reach successful results`);

    await visit('#trip/dict/centrio');
    assert.match(await page.locator('.result-topline').innerText(), /DEMO JOURNEY/);
    assert.match(await page.locator('.timeline').innerText(), /nearby Carmen corridor/);
    await page.locator('#start-trip-guide').click();
    await page.locator('#advance-guide').click();
    await page.reload();
    assert.match(await page.locator('.current-guide-step').innerText(), /STEP 2 OF 4/);
    for (let i = 0; i < 3; i++) await page.locator('#advance-guide').click();
    assert.equal(await page.locator('#arrival-screen').isVisible(), true);
    pass('DICT sample includes nearby boarding, explicit demo labeling, guide persistence and completion');

    await visit('#home');
    await page.locator('#smart-search summary').click();
    assert.equal(await page.locator('#smart-trip-input').evaluate(node => node.tagName), 'SELECT');
    const prompts = await page.locator('#smart-trip-input option').evaluateAll(nodes => nodes.map(node => node.value));
    for (const prompt of prompts) {
      await page.locator('#smart-trip-input').selectOption(prompt);
      await page.locator('#smart-trip-form button').click();
      assert.equal(await page.locator('#smart-view-routes').isVisible(), true, prompt);
      assert.doesNotMatch(await page.locator('#smart-trip-status').innerText(), /no demo itinerary|couldn’t/);
    }
    await page.locator('#smart-view-routes').click();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    pass(`All ${prompts.length} AI trip presets resolve and open route options`);

    for (const oldHash of ['#trip/limketkai/ustp', '#trip/bugo/patag', '#options/bugo/patag']) {
      await visit(oldHash);
      assert.equal(await page.locator('#home-screen').isVisible(), true);
      assert.doesNotMatch(await page.locator('body').innerText(), /No researched route/);
      await page.locator('#find-button').click();
      assert.equal(await page.locator('#options-screen').isVisible(), true);
    }
    pass('Old unsupported links recover into a valid preset planner without a no-route screen');

    for (const width of [320, 360, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [state, hash] of [['home', ''], ['options', '#options/ustp/limketkai'], ['directory', '#jeepneys'], ['line', '#line/legacy-iponan-cogon/iponan-cogon'], ['result', '#trip/ustp/limketkai'], ['dict', '#trip/dict/centrio']]) {
        await visit(hash);
        await overflow();
        if ([390, 1440].includes(width)) await page.screenshot({ path: `.hackathon/route-research-screenshots/${state}-${width}.png`, fullPage: true });
      }
    }
    pass('Home, options, directory, line, results and DICT demo fit 320–1440px');
    assert.deepEqual(errors, []);
    pass('No browser exceptions across all route and map journeys');
    fs.writeFileSync('.hackathon/route-research-results.json', JSON.stringify({ passed, errors, references: data.all.length }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
