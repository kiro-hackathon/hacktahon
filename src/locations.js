/** Landmark centers verified against OpenStreetMap on 2026-10-17.
 * Coordinates locate landmarks, NOT entrances, jeepney stops, or road routes.
 * Source feature centers and evidence: .hackathon/landmark-source.json.
 */
export const mapConfig = {
  center: [8.481, 124.650],
  zoom: 14,
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  // Approximate urban demo coverage, NOT a municipal/legal boundary.
  coverage: { south: 8.40, north: 8.57, west: 124.58, east: 124.76 },
};

export function isInDemoArea(latitude, longitude) {
  const { south, north, west, east } = mapConfig.coverage;
  return latitude >= south && latitude <= north && longitude >= west && longitude <= east;
}

export const locations = [
  { id: 'ustp', coordinates: [8.4862343, 124.6567017], source: 'https://www.openstreetmap.org/way/427550462', name: 'USTP CDO', category: 'Campus', short: 'USTP CDO', icon: 'campus', aliases: ['university', 'school', 'lapasan'] },
  { id: 'divisoria', coordinates: [8.4777014, 124.6438021], source: 'https://www.openstreetmap.org/relation/13841686', name: 'Divisoria', category: 'City center', short: 'Divisoria', icon: 'city', aliases: ['downtown', 'plaza'] },
  { id: 'centrio', coordinates: [8.4848322, 124.6510816], source: 'https://www.openstreetmap.org/relation/4659728', name: 'Centrio', category: 'Shopping & dining', short: 'Centrio', icon: 'bag', aliases: ['ayala', 'mall'] },
  { id: 'limketkai', coordinates: [8.4819682, 124.6565655], source: 'https://www.openstreetmap.org/way/129409508', name: 'Limketkai', category: 'Shopping & dining', short: 'Limketkai', icon: 'building', aliases: ['ketkai', 'mall'] },
  { id: 'cogon', coordinates: [8.47743, 124.6515306], source: 'https://www.openstreetmap.org/way/178432221', name: 'Cogon Market', category: 'Local market', short: 'Cogon Market', icon: 'market', aliases: ['palengke', 'market'] },
  { id: 'sm', coordinates: [8.4842559, 124.6547009], source: 'https://www.openstreetmap.org/way/611712300', name: 'SM CDO Downtown Premier', category: 'Shopping & dining', short: 'SM Downtown', icon: 'shop', aliases: ['sm downtown', 'sm cdo', 'mall', 'sm cdo downtown'] },
];
