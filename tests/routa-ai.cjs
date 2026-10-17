/* Browser integration QA; uses installed Playwright/Chrome, no app dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8080';
const evidence = '.hackathon/routa-ai-screenshots';
(async () => {
  const { tripOptions, getTripOptions, locations } = await import('../src/routes.js');
  const pair = tripOptions.find(option => getTripOptions(option.originId, option.destinationId).length > 1);
  assert.ok(pair, 'Dataset must have a pair with multiple itineraries for preference UI QA');
  const options = getTripOptions(pair.originId, pair.destinationId);
  const unsupported = locations.flatMap(from => locations.map(to => [from, to])).find(([from, to]) => from.id !== to.id && !getTripOptions(from.id, to.id).length);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const passed = [], errors = [], external = [];
  const pass = name => { passed.push(name); console.log(`PASS ${name}`); };
  fs.mkdirSync(evidence, { recursive: true });
  async function setup(width = 390, height = 844) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 761, hasTouch: width < 761 });
    await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edf3e9"/><text x="30" y="120">QA TILE FIXTURE</text></svg>' }));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => { if (!req.url().startsWith(base) && !req.url().startsWith('https://tile.openstreetmap.org/')) external.push(req.url()); });
    await page.goto(base);
    return { context, page };
  }
  const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  async function describe(page, text) {
    if (!await page.locator('#smart-search').getAttribute('open')) await page.locator('#smart-search').evaluate(el => { el.open = true; });
    await page.locator('#smart-trip-input').fill(text);
    await page.locator('#smart-trip-form button').click();
  }
  async function screenshot(page, name) { await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: false }); }
  try {
    for (const width of [360, 390]) {
      const { context, page } = await setup(width);
      assert.equal(await page.locator('#smart-search').evaluate(el => el.open), false);
      const find = await page.locator('#find-button').boundingBox();
      const nav = await page.locator('#bottom-nav').boundingBox();
      assert.ok(find.y + find.height <= nav.y, 'Normal primary search remains unobstructed');
      await screenshot(page, `home-${width}`);
      await page.locator('#find-button').click();
      assert.match(await page.locator('#form-error').innerText(), /Choose a destination/);
      await page.locator('#destination').fill('Airport');
      await page.locator('#find-button').click();
      assert.match(await page.locator('#form-error').innerText(), /recognize that destination/);
      await page.locator('#destination').fill('USTP CDO');
      await page.locator('#find-button').click();
      assert.match(await page.locator('#form-error').innerText(), /same place twice/);
      // Exercise existing mobile landmark selection, rather than bypassing the form.
      await page.locator('#origin').tap();
      await page.locator('#search-origin').fill(pair.from.name);
      await page.locator(`[data-search-place="${pair.originId}"]`).click();
      await page.locator('#search-destination').fill(pair.to.name);
      await page.locator(`[data-search-place="${pair.destinationId}"]`).click();
      await page.locator('#search-submit').click();
      assert.equal(await page.locator('#options-screen').isVisible(), true);
      assert.equal(await page.locator('.trip-option').count(), options.length);
      assert.equal(await page.getByRole('button', { name: 'Less walking', exact: true }).isDisabled(), true);
      assert.match(await page.locator('#walking-limit').innerText(), /aren’t available/);
      assert.match(await page.locator('#preference-reason').innerText(), /no transfers/);
      await page.getByRole('button', { name: 'Simpler journey', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: 'Simpler journey', exact: true }).getAttribute('aria-pressed'), 'true');
      assert.match(await page.locator('#preference-reason').innerText(), /instruction steps/);
      await noOverflow(page); await screenshot(page, `options-${width}`);
      await page.locator(`[data-select-option="${pair.id}"]`).click();
      assert.equal(await page.locator('.timeline li').count(), pair.steps.length);
      await page.locator('#ask-routa').click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'routa-assistant-close');
      assert.match(await page.locator('#routa-assistant-context').innerText(), new RegExp(pair.code));
      await page.getByRole('button', { name: 'Where do I board?', exact: true }).click();
      assert.ok((await page.locator('.is-routa').last().innerText()).includes(pair.boarding));
      await screenshot(page, `boarding-${width}`);
      await page.getByRole('button', { name: 'Where do I get off?', exact: true }).click();
      assert.ok((await page.locator('.is-routa').last().innerText()).includes(pair.dropoff));
      await page.getByRole('button', { name: 'Are there transfers?', exact: true }).click();
      assert.match(await page.locator('.is-routa').last().innerText(), /no transfers/);
      await page.getByRole('button', { name: 'What signboard should I look for?', exact: true }).click();
      assert.ok((await page.locator('.is-routa').last().innerText()).includes(pair.signboard));
      await page.locator('#routa-question').fill('Where is the live jeepney?');
      await page.locator('#routa-question-form button').click();
      assert.match(await page.locator('.is-routa').last().innerText(), /unavailable/);
      for (let i = 0; i < 16; i++) {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('#routa-assistant')), true);
      }
      await noOverflow(page);
      const sheet = await page.locator('#routa-assistant').boundingBox();
      assert.ok(sheet.x >= 0 && sheet.y >= 0 && sheet.x + sheet.width <= width && sheet.y + sheet.height <= 845);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#routa-assistant').isVisible(), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'ask-routa');
      await page.locator('#ask-routa').click();
      assert.equal(await page.locator('.assistant-bubble').count(), 1, 'Reopen clears stale conversation');
      await page.locator('#routa-assistant-close').click();
      await page.locator('#start-trip-guide').click();
      for (let i = 0; i < pair.steps.length; i++) await page.locator('#advance-guide').click();
      assert.equal(await page.locator('#arrival-screen').isVisible(), true);
      await page.getByRole('link', { name: 'Plan another trip' }).click();
      assert.equal(await page.locator('#home-screen').isVisible(), true);
      pass(`${width}px: existing mobile search → preferences → selected details → assistant replies/focus/Escape → manual guide → arrival → home`);

      await describe(page, `From ${pair.from.name} to ${pair.to.name}, simpler journey please`);
      assert.ok((await page.locator('#smart-trip-status').innerText()).includes(pair.from.short));
      await screenshot(page, `smart-search-${width}`);
      await page.locator('#smart-view-routes').click();
      assert.equal(await page.getByRole('button', { name: 'Simpler journey', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.locator(`[data-select-option="${pair.id}"]`).click();
      await page.reload();
      await page.locator('#ask-routa').click();
      await page.locator('#routa-question').fill('Asa ko mosakay?');
      await page.locator('#routa-question').press('Enter');
      assert.ok((await page.locator('.is-routa').last().innerText()).includes(pair.boarding));
      await page.goBack();
      assert.equal(await page.locator('#routa-assistant').isVisible(), false);
      assert.equal(await page.locator('#options-screen').isVisible(), true);
      pass(`${width}px: natural-language endpoints/preferences → original options and details; reload context and browser Back`);
      await context.close();
    }

    const { context, page } = await setup();
    await page.locator('#origin').fill('');
    await describe(page, `How do I get to ${pair.to.name}?`);
    assert.match(await page.locator('#smart-trip-status').innerText(), /Choose a starting landmark/);
    assert.equal(await page.locator('#smart-view-routes').isVisible(), false);
    await page.locator('#smart-origin').selectOption(pair.originId);
    assert.equal(await page.locator('#smart-view-routes').isVisible(), true);
    await page.locator('#smart-view-routes').click();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    await page.goto(base);
    await describe(page, `Unsa akong sakyan padulong ${pair.to.short}?`);
    assert.match(await page.locator('#smart-trip-status').innerText(), /Using your selected starting point/);
    await describe(page, 'From Airport to Divisoria');
    assert.match(await page.locator('#smart-trip-status').innerText(), /couldn’t identify the starting point/);
    assert.equal(await page.locator('#smart-view-routes').isVisible(), false);
    await describe(page, 'to mall');
    assert.match(await page.locator('#smart-trip-status').innerText(), /Which landmark/);
    await describe(page, `From ${unsupported[0].name} to ${unsupported[1].name}`);
    assert.match(await page.locator('#smart-trip-status').innerText(), /no demo itinerary/);
    assert.equal(await page.locator('#smart-view-routes').isVisible(), false);
    pass('Missing origin selection and reuse, Bisaya search, unsupported origin/pair, and ambiguous mall clarification');

    await page.goto(`${base}/#trip/${pair.originId}/${pair.destinationId}/${pair.id}`);
    await page.locator('#ask-routa').click();
    for (const [question, pattern] of [['Saan ako bababa?', new RegExp(pair.to.short)], ['May lipat ba?', /no transfers/], ['What is the weather?', /didn’t recognize/]]) {
      await page.locator('#routa-question').fill(question); await page.locator('#routa-question').press('Enter');
      assert.match(await page.locator('.is-routa').last().innerText(), pattern);
    }
    await page.locator('#routa-question').fill('<img src=x onerror=alert(1)>');
    await page.locator('#routa-question').press('Enter');
    assert.equal(await page.locator('#routa-messages img').count(), 0);
    await page.locator('#routa-assistant-close').click();
    const other = tripOptions.find(option => option.destinationId !== pair.destinationId);
    await page.goto(`${base}/#trip/${other.originId}/${other.destinationId}/${other.id}`);
    await page.locator('#ask-routa').click();
    await page.getByRole('button', { name: 'Where do I get off?', exact: true }).click();
    assert.ok((await page.locator('.is-routa').last().innerText()).includes(other.dropoff));
    pass('Filipino phrases, unknown questions, escaped user text, and changed-route context');

    for (const [width, height] of [[320, 640], [390, 568], [390, 420], [768, 900], [1440, 1000]]) {
      await page.setViewportSize({ width, height });
      // visualViewport resize is asynchronous; inspect the settled layout, not its previous frame.
      await page.waitForFunction(() => {
        const rect = document.querySelector('#routa-assistant').getBoundingClientRect();
        return rect.x >= 0 && rect.y >= 0 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
      });
      await page.waitForFunction(() => {
        const log = document.querySelector('#routa-messages');
        return log.scrollTop + log.clientHeight >= log.scrollHeight - 1;
      });
      await noOverflow(page);
      const box = await page.locator('#routa-assistant').boundingBox();
      assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `${width}×${height}: sheet fits`);
      const composer = await page.locator('#routa-question-form').boundingBox();
      assert.ok(composer.y >= box.y && composer.y + composer.height <= height, 'Composer remains usable');
      await screenshot(page, `sheet-${width}-${height}`);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('Escape');
    await page.locator('#ask-routa').click();
    await page.getByRole('button', { name: 'Where do I board?', exact: true }).click();
    assert.ok((await page.locator('.is-routa').last().innerText()).includes(other.boarding));
    await page.mouse.click(4, 4);
    assert.equal(await page.locator('#routa-assistant').isVisible(), false);
    pass('320–1440px reflow, short viewport/composer, reduced motion, and backdrop dismissal');
    await context.close();
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    pass('No uncaught JavaScript errors or external assistant requests');
    fs.writeFileSync('.hackathon/routa-ai-test-results.json', JSON.stringify({ passed, errors, external, comparisonPair: `${pair.from.short} → ${pair.to.short}`, optionIds: options.map(option => option.id), datasetItineraries: tripOptions.length }, null, 2));
    console.log(`${passed.length} browser check groups passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
