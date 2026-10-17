/* Existing Playwright + Chrome only. Provider navigations are intercepted;
   this verifies handoff destinations without attempting a real booking. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8080';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const passed = [];
  const externalRequests = [];
  const pass = name => { passed.push(name); console.log(`PASS ${name}`); };
  await context.route(/https:\/\/(?:www\.)?(?:joyride\.com\.ph|angkas\.com)\//, route => {
    externalRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Provider handoff fixture</title><p>Verified destination navigation intercepted for QA. No booking attempted.</p>' });
  });
  await context.addInitScript(() => {
    window.testClipboardWrites = [];
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.testClipboardWrites.push(text); } } });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  try {
    await page.goto(`${base}/#trip/ustp/divisoria`);
    assert.match(await page.locator('.route-badge').innerText(), /D1/);
    assert.equal(await page.locator('.timeline li').count(), 4);
    assert.equal(await page.locator('.ride-service').count(), 2);
    assert.match(await page.locator('#ride-options-title').innerText(), /Other ways to get there/);
    assert.equal(await page.evaluate(() => !!(document.querySelector('.journey-steps').compareDocumentPosition(document.querySelector('.ride-options')) & Node.DOCUMENT_POSITION_FOLLOWING)), true);
    assert.equal(externalRequests.length, 0);
    pass('Two secondary services follow the unchanged D1 recommendation and four instructions; no pre-emptive provider requests');

    const original = { url: page.url(), title: await page.locator('#result-title').innerText(), steps: await page.locator('.timeline').innerText() };
    await page.getByRole('button', { name: 'Open JoyRide', exact: true }).click();
    assert.equal(await page.getByRole('dialog', { name: 'Continue with JoyRide' }).isVisible(), true);
    assert.equal(await page.locator('#handoff-origin').innerText(), 'USTP CDO');
    assert.equal(await page.locator('#handoff-destination').innerText(), 'Divisoria');
    assert.match(await page.locator('#handoff-description').innerText(), /won’t transfer them automatically/);
    assert.match(await page.locator('#handoff-external-note').innerText(), /official website, in a new tab/);
    assert.equal(externalRequests.length, 0);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(page.url(), original.url);
    assert.equal(await page.locator('#result-title').innerText(), original.title);
    assert.equal(await page.locator('.timeline').innerText(), original.steps);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.rideProvider), 'joyride');
    pass('JoyRide sheet shows current trip and transfer limitation; Cancel preserves trip and returns focus');

    for (const [provider, url] of [['JoyRide', 'https://joyride.com.ph/'], ['Angkas', 'https://www.angkas.com/']]) {
      await page.getByRole('button', { name: `Open ${provider}`, exact: true }).click();
      const link = page.locator('#handoff-continue');
      assert.equal(await link.getAttribute('href'), url);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.match(await link.getAttribute('rel'), /noopener/);
      assert.match(await link.getAttribute('rel'), /noreferrer/);
      const popupPromise = page.waitForEvent('popup');
      await link.click();
      const popup = await popupPromise;
      await popup.waitForURL(url);
      assert.equal(popup.url(), url);
      assert.equal(await page.locator('#ride-handoff').isVisible(), false);
      assert.match(await page.locator('.route-badge').innerText(), /D1/);
      await popup.close();
      await page.bringToFront();
      pass(`${provider} Continue opens the exact verified official URL in a separate tab with no trip query or booking simulation`);
    }

    await page.getByRole('button', { name: 'Open Angkas', exact: true }).click();
    await page.getByRole('button', { name: 'Copy destination', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.testClipboardWrites), ['Divisoria']);
    assert.match(await page.locator('#handoff-copy-status').innerText(), /Copied. Paste it/);
    assert.equal(await page.locator('#handoff-copy-fallback').isVisible(), false);
    pass('Copy destination writes only the selected landmark after an explicit click (clipboard fixture)');

    await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new DOMException('Clipboard blocked', 'NotAllowedError'); }; });
    await page.getByRole('button', { name: 'Destination copied', exact: true }).click();
    await page.locator('#handoff-copy-fallback').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#handoff-copy-fallback').inputValue(), 'Divisoria');
    assert.match(await page.locator('#handoff-copy-status').innerText(), /Select and copy/);
    assert.deepEqual(await page.locator('#handoff-copy-fallback').evaluate(input => [input.selectionStart, input.selectionEnd]), [0, 9]);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#ride-handoff').isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.rideProvider), 'angkas');
    await page.getByRole('button', { name: 'Open JoyRide', exact: true }).click();
    assert.equal(await page.locator('#handoff-copy-fallback').isVisible(), false);
    assert.equal(await page.locator('#handoff-copy-status').innerText(), '');
    pass('Clipboard failure offers selected text without permissions; Escape restores focus and reopening resets copy state');

    for (let i = 0; i < 9; i++) {
      await page.keyboard.press('Tab');
      // Native dialogs may yield one Tab stop to browser chrome (BODY in
      // headless Chrome); no underlying page control may receive focus.
      assert.equal(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('#ride-handoff')), true);
    }
    await page.getByRole('button', { name: 'Close ride-hailing handoff' }).click();
    await page.getByRole('button', { name: 'Open Angkas', exact: true }).click();
    await page.mouse.click(4, 4);
    assert.equal(await page.locator('#ride-handoff').isVisible(), false);
    pass('Native modal keeps underlying controls out of keyboard focus; close button and backdrop preserve the result');

    await page.goto(`${base}/#trip/divisoria/ustp`);
    await page.getByRole('button', { name: 'Open Angkas', exact: true }).click();
    assert.equal(await page.locator('#handoff-origin').innerText(), 'Divisoria');
    assert.equal(await page.locator('#handoff-destination').innerText(), 'USTP CDO');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    pass('Reverse trip handoff uses the current origin and destination');

    fs.mkdirSync('.hackathon/handoff-screenshots', { recursive: true });
    for (const [width, height] of [[320, 640], [360, 640], [375, 812], [390, 844], [430, 932], [768, 900], [1440, 1000], [390, 568]]) {
      await page.setViewportSize({ width, height });
      await page.goto(`${base}/#trip/ustp/sm`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `result overflow ${width}x${height}`);
      const button = page.getByRole('button', { name: 'Open JoyRide', exact: true });
      assert.ok((await button.boundingBox()).height >= 44);
      await button.click();
      const bounds = await page.locator('#ride-handoff').boundingBox();
      assert.ok(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= width + 1 && bounds.y + bounds.height <= height + 1, `sheet outside ${width}x${height}`);
      assert.equal(await page.locator('#ride-handoff').evaluate(dialog => dialog.scrollWidth > dialog.clientWidth), false);
      assert.equal(await page.locator('#handoff-destination').innerText(), 'SM CDO Downtown Premier');
      if ([390, 1440].includes(width) && height !== 568) await page.screenshot({ path: `.hackathon/handoff-screenshots/sheet-${width}.png` });
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      if ([390, 1440].includes(width) && height !== 568) {
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.screenshot({ path: `.hackathon/handoff-screenshots/result-${width}.png`, fullPage: true });
      }
    }
    pass('Service controls and long-trip sheet fit 320/360/375/390/430/768/1440px and a short 390x568 viewport');

    await page.goto(base);
    await page.locator('#destination').fill('Divisoria');
    await findAndSelect(page);
    await page.getByRole('button', { name: 'Open JoyRide', exact: true }).click();
    await page.goBack();
    assert.equal(await page.locator('#options-screen').isVisible(), true);
    assert.equal(await page.locator('#ride-handoff').isVisible(), false);
    pass('Browser navigation dismisses the sheet without altering the existing planner flow');
    assert.deepEqual(externalRequests, ['https://joyride.com.ph/', 'https://www.angkas.com/']);
    assert.deepEqual(errors, []);
    pass('Only explicit Continue actions request provider URLs; no browser console or application errors');
    fs.writeFileSync('.hackathon/handoff-test-results.json', JSON.stringify({ date: '2026-10-17', browser: 'Chrome via Playwright', providerNavigation: 'Exact official URLs intercepted; no actual booking attempted', clipboard: 'API success/failure fixtures; OS clipboard not accessed', passed, errors }, null, 2));
    console.log(`\n${passed.length} ride-handoff checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

// Route choice is intentional in the complete experience; retain the detail checks.
async function findAndSelect(target) {
  await target.getByRole('button', { name: 'Find my jeepney', exact: true }).click();
  if (await target.locator('#options-screen').isVisible()) {
    await target.locator('[data-select-option]').first().click();
  }
}
