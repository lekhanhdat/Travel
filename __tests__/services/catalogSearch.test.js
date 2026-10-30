const {normalizeSearchText, searchCatalog, LOCATION_SEARCH_FIELDS, FESTIVAL_SEARCH_FIELDS} = require('../../src/utils/catalogSearch');
const {sortByDistance, formatDistance} = require('../../src/utils/nearby');

const locations = [
  {id: 1, name: 'Bãi biển Mỹ Khê', description: 'Bãi tắm đẹp', types: ['beach', 'nature'], address: 'Sơn Trà, Đà Nẵng'},
  {id: 2, name: 'Bảo tàng Điêu khắc Chăm', description: 'Hiện vật Chăm Pa', types: ['museum', 'historical'], address: 'Hải Châu'},
  {id: 3, name: 'Công viên nước', description: '', types: ['water_park'], address: ''},
];
const festivals = [
  {id: 1, name: 'Lễ hội pháo hoa quốc tế', description: 'Trình diễn trên sông Hàn', types: ['fireworks'], location: 'Cầu Rồng'},
  {id: 2, name: 'Đua thuyền', description: '', types: ['boat-racing'], location: ''},
];

describe('local catalog search', () => {
  it('normalizes accents, đ, case, arrays and separators', () => {
    expect(normalizeSearchText('  Đà   Nẵng ')).toBe('da nang');
    expect(normalizeSearchText(['water_park', 'boat-racing'])).toBe('water park boat racing');
    expect(normalizeSearchText(null)).toBe('');
  });

  it('matches name/description/types/address without accents; every word must match', () => {
    const search = q => searchCatalog(locations, q, [...LOCATION_SEARCH_FIELDS]).map(row => row.id);
    expect(search('my khe')).toEqual([1]);
    expect(search('BAO TANG cham')).toEqual([2]);
    expect(search('museum')).toEqual([2]);
    expect(search('water park')).toEqual([3]);
    expect(search('son tra')).toEqual([1]);
    expect(search('bien cham')).toEqual([]);
    expect(search('   ')).toEqual([1, 2, 3]);
  });

  it('searches festivals by venue and type slugs', () => {
    const search = q => searchCatalog(festivals, q, [...FESTIVAL_SEARCH_FIELDS]).map(row => row.id);
    expect(search('cau rong')).toEqual([1]);
    expect(search('song han')).toEqual([1]);
    expect(search('boat racing')).toEqual([2]);
    expect(search('phao hoa')).toEqual([1]);
  });
});

describe('nearby', () => {
  const origin = {latitude: 16.0544, longitude: 108.2022};
  it('sorts by haversine distance, skips missing/invalid GPS and limits the list', () => {
    const rows = [
      {id: 1, lat: 16.0611, long: 108.2470},
      {id: 2, lat: null, long: null},
      {id: 3, lat: 16.0545, long: 108.2023},
      {id: 4, lat: 95, long: 108},
      {id: 5, lat: 15.88, long: 108.33},
    ];
    const sorted = sortByDistance(rows, origin);
    expect(sorted.map(row => row.id)).toEqual([3, 1, 5]);
    expect(sorted[0].distanceKm).toBeLessThan(0.1);
    expect(sorted[1].distanceKm).toBeGreaterThan(4);
    expect(sorted[1].distanceKm).toBeLessThan(6);
    expect(sortByDistance(rows, origin, 1)).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty('distanceKm');
  });

  it('formats distances', () => {
    expect(formatDistance(0.85)).toBe('850 m');
    expect(formatDistance(1.234)).toBe('1.2 km');
    expect(formatDistance(12.6)).toBe('13 km');
  });
});
