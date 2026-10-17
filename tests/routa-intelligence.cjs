const assert = require('node:assert/strict');
(async () => {
  const { parseTripRequest: parse, answerRouteQuestion: answer, rankTripOptions: rank, matchLandmark } = await import('../src/routa-intelligence.js');
  const { getTripOptions, tripOptions, locations } = await import('../src/routes.js');
  let groups = 0;
  const pass = name => { groups++; console.log(`PASS ${name}`); };
  for (const [query, from, to] of [
    ['From USTP to Divisoria', 'ustp', 'divisoria'],
    ['FROM university TO plaza!', 'ustp', 'divisoria'],
    ['Gikan sa Lapasan padulong sa Ayala', 'ustp', 'centrio'],
    ['Mula sa USTP papunta sa palengke', 'ustp', 'cogon'],
    ['To USTP from Divisoria', 'divisoria', 'ustp'],
    ['From USTP to SM CDO Downtown Premier', 'ustp', 'sm'],
  ]) {
    const result = parse(query);
    assert.equal(result.status, getTripOptions(from, to).length ? 'ready' : 'unsupported-trip', query); assert.equal(result.from.id, from); assert.equal(result.to.id, to);
  }
  pass('Explicit endpoints, names, dataset aliases, casing, punctuation, three languages, and reverse phrases');
  for (const query of ['Unsa akong sakyan padulong Divisoria?', 'How do I get to Divisoria?', 'Paano ako pumunta sa Divisoria?', 'Divisoria']) {
    assert.equal(parse(query, 'ustp').reusedOrigin, true);
    assert.equal(parse(query).status, 'missing-origin');
    assert.equal(parse(query, 'current').status, 'missing-origin');
  }
  assert.equal(parse('How do I get to Centrio?', 'divisoria').from.id, 'divisoria');
  pass('Missing origin reuses only a selected dataset landmark; empty or GPS origins ask for selection');
  for (const query of ['', 'airport', 'From USTP to Airport', 'From Airport to Divisoria', 'From USTP', 'USTP and Divisoria', 'From USTP to Divisoria via Airport', '<script>alert(1)</script>', 'SM North']) assert.equal(parse(query, 'ustp').status, 'clarify', query);
  const unsupported = locations.flatMap(from => locations.map(to => [from, to])).find(([from, to]) => from.id !== to.id && !getTripOptions(from.id, to.id).length);
  assert.equal(parse(`From ${unsupported[0].name} to ${unsupported[1].name}`).status, 'unsupported-trip');
  assert.equal(parse('From USTP to USTP').status, 'clarify');
  assert.equal(matchLandmark('mall').place, null);
  assert.equal(parse('to mall', 'ustp').matches.length, 3);
  assert.equal(parse('From mall to Divisoria').field, 'origin');
  pass('Unknown and ambiguous locations, partial requests, unconfigured pairs, identical endpoints, and unsafe input never invent a trip');
  for (const option of tripOptions) {
    const parsed = parse(`From ${option.from.name} to ${option.to.name}`);
    assert.equal(parsed.status, 'ready');
    for (const question of ['Where do I board?', 'Asa ko mosakay?', 'Saan ako sasakay?']) assert.ok(answer(question, option).includes(option.boarding));
    for (const question of ['Where do I get off?', 'Asa ko manaog?', 'Saan ako bababa?']) assert.ok(answer(question, option).includes(option.dropoff));
    for (const question of ['What signboard should I look for?', 'Unsa nga karatula?', 'Anong signboard?']) assert.ok(answer(question, option).includes(option.signboard));
    for (const question of ['Are there transfers?', 'Naay balhin?', 'May lipat ba?']) assert.match(answer(question, option), option.transferCount ? /Centrio/ : /no transfers/);
    assert.match(answer('Where do I board?', option), /unverified|not verified/);
  }
  pass(`All ${tripOptions.length} configured sample itineraries produce route-specific boarding, drop-off, signboard, and transfer answers`);
  for (const q of ['Where do I board?', 'Where do I get off?', 'Are there transfers?', 'Which signboard?']) assert.match(answer(q, {}), /unavailable/);
  for (const q of ['How much is the fare?', 'Pila ang pamasahe?', 'Magkano?', 'How long will it take?', 'Is it cheapest?', 'Where is the jeepney live?']) assert.match(answer(q, tripOptions[0]), /unavailable/);
  assert.match(answer('Will it rain?', tripOptions[0]), /didn’t recognize/);
  assert.match(answer('Where do I board?', null), /Choose a demo itinerary/);
  pass('Missing route fields, unsupported facts, and unknown questions receive honest fallback answers');
  const direct = tripOptions[0];
  // Ranking transfer fixtures exercise the rules without adding routes to product data.
  const transfer = { ...direct, id: 'test-transfer', transferCount: 1, steps: [...direct.steps, { type: 'transfer' }] };
  assert.match(answer('Are there transfers?', transfer), /Transfer-point information is unavailable/);
  assert.match(answer('Which signboard?', transfer), /Remaining signboard information is unavailable/);
  const reversed = [transfer, direct];
  assert.equal(rank(reversed).options[0], direct);
  assert.match(rank(reversed).reason, /no transfers/);
  assert.equal(rank(reversed, 'simple').options[0], direct);
  assert.deepEqual(reversed, [transfer, direct]);
  assert.equal(rank(reversed, 'walking').supported, false);
  assert.deepEqual(rank(reversed, 'walking').options, reversed);
  assert.equal(rank([{}]).supported, false);
  assert.equal(rank([]).supported, false);
  const ties = [{ id: 'a', transferCount: 0, steps: [{}, {}, {}] }, { id: 'b', transferCount: 0, steps: [{}] }];
  assert.equal(rank(ties, 'transfers').options[0].id, 'a');
  assert.equal(rank(ties, 'simple').options[0].id, 'b');
  pass('Stable deterministic ranking uses transfers then instruction count; no mutation or unsupported walking comparison');
  const distanceFixtures = [400, 150].map((distance, index) => ({ id: index, steps: [{ type: 'walk', distanceMeters: distance }, { type: 'flag', distanceMeters: 20 }] }));
  assert.equal(rank(distanceFixtures, 'walking').options[0].id, 1);
  assert.equal(rank([...distanceFixtures, { steps: [{ type: 'transfer' }] }], 'walking').supported, false);
  assert.equal(rank([{ steps: [{ type: 'jeep' }] }], 'walking').supported, false);
  assert.equal(parse('From USTP to Divisoria with fewer transfers').preference, 'transfers');
  assert.equal(parse('From USTP to Divisoria, simpler journey please').preference, 'simple');
  assert.equal(parse('From USTP to Divisoria with less walking').preference, 'walking');
  assert.ok(locations.length >= 6);
  pass('Walking ranks only complete explicit distance fixtures; natural-language preferences remain deterministic');
  console.log(`${groups} logic check groups passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
