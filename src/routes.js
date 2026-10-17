/** Fictional demonstration data. Never use these routes or stops as travel directions. */
export const locations = [
  { id: 'ustp', name: 'USTP CDO', category: 'Campus', short: 'USTP CDO', icon: 'campus', aliases: ['university', 'school', 'lapasan'] },
  { id: 'divisoria', name: 'Divisoria', category: 'City center', short: 'Divisoria', icon: 'city', aliases: ['downtown', 'plaza'] },
  { id: 'centrio', name: 'Centrio', category: 'Shopping & dining', short: 'Centrio', icon: 'bag', aliases: ['ayala', 'mall'] },
  { id: 'limketkai', name: 'Limketkai', category: 'Shopping & dining', short: 'Limketkai', icon: 'building', aliases: ['ketkai', 'mall'] },
  { id: 'cogon', name: 'Cogon Market', category: 'Local market', short: 'Cogon Market', icon: 'market', aliases: ['palengke', 'market'] },
  { id: 'sm', name: 'SM CDO Downtown Premier', category: 'Shopping & dining', short: 'SM Downtown', icon: 'shop', aliases: ['sm downtown', 'sm cdo', 'mall', 'sm cdo downtown'] },
];

// Only these pairs and their reverse journeys are supported. D codes are invented.
export const routes = [
  { code: 'D1', name: 'Campus → City Center', from: 'ustp', to: 'divisoria', via: 'USTP · Divisoria' },
  { code: 'D2', name: 'Campus → Centrio', from: 'ustp', to: 'centrio', via: 'USTP · Centrio' },
  { code: 'D3', name: 'Campus → Limketkai', from: 'ustp', to: 'limketkai', via: 'USTP · Limketkai' },
  { code: 'D4', name: 'Campus → Cogon', from: 'ustp', to: 'cogon', via: 'USTP · Cogon Market' },
  { code: 'D5', name: 'Campus → SM Downtown', from: 'ustp', to: 'sm', via: 'USTP · SM Downtown' },
  { code: 'D6', name: 'City Center → Centrio', from: 'divisoria', to: 'centrio', via: 'Divisoria · Centrio' },
  { code: 'D7', name: 'Cogon → Limketkai', from: 'cogon', to: 'limketkai', via: 'Cogon Market · Limketkai' },
];

export function searchLocations(query) {
  const value = query.trim().toLowerCase();
  return locations.filter(place => `${place.name} ${place.category} ${place.aliases.join(' ')}`.toLowerCase().includes(value));
}

export function resolveLocation(value) {
  const normalized = value.trim().toLowerCase();
  return locations.find(place => place.name.toLowerCase() === normalized || place.short.toLowerCase() === normalized || place.aliases.includes(normalized));
}

export function findRoute(fromId, toId) {
  const route = routes.find(item => (item.from === fromId && item.to === toId) || (item.to === fromId && item.from === toId));
  if (!route) return null;
  const from = locations.find(place => place.id === fromId);
  const to = locations.find(place => place.id === toId);
  return {
    ...route, from, to,
    name: fromId === route.from ? route.name : `${from.short} → ${to.short}`,
    boarding: `${from.short} demo boarding point`,
    dropoff: `${to.short} demo stop`,
    steps: [
      { type: 'walk', title: 'Walk to the boarding point', place: `${from.short} demo boarding point`, detail: `Begin at ${from.name}. In this fictional example, walk to the marked demo boarding point.` },
      { type: 'jeep', title: `Board the ${route.code} demo jeepney`, place: `Toward ${to.short}`, detail: `Look for the fictional ${route.code} sign. This example uses one jeepney, with no transfers.` },
      { type: 'stop', title: 'Get off at your stop', place: `${to.short} demo stop`, detail: `In this example, get off at the demo stop for ${to.name}.` },
      { type: 'flag', title: 'Walk to your destination', place: to.name, detail: `Complete the final walk to ${to.name}. You’ve reached the end of the sample journey.` },
    ],
  };
}
