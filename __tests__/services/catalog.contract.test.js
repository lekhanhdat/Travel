const {CatalogError} = require('../../src/services/catalog.client');
const {adaptLocation, adaptFestival, REMOVED_FIELDS} = require('../../src/services/catalog.adapter');

// Same field sets as Travel_BE/tests/check_contract.py (locations 20, festivals 17).
const COMMON = {id: 1, record_id: 'source-1', name: 'Tên từ API', types: ['culture'], description: '',
  long_description: '', rating: null, reviews: [], images: [], videos: [], advise: [], website: '',
  phone: '', ticket_info: '', publishable: true};
const LOCATION = {...COMMON, address: '', lat: 16.05, long: 108.2, opening_hours: '', avatar: ''};
const FESTIVAL = {...COMMON, event_time: '', location_id: 7};
const without = (row, key) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== key));

describe('catalog adapter contract', () => {
  it('accepts exactly the BE field sets', () => {
    expect(Object.keys(LOCATION)).toHaveLength(20);
    expect(Object.keys(FESTIVAL)).toHaveLength(17);
    expect(adaptLocation(LOCATION)).toEqual(LOCATION);
    expect(adaptFestival(FESTIVAL)).toEqual(FESTIVAL);
    expect(adaptFestival({...FESTIVAL, location_id: null}).location_id).toBeNull();
  });

  it('lists every field removed by schema 002–006', () => {
    expect([...REMOVED_FIELDS].sort()).toEqual(['amenities', 'end_date', 'location', 'marker', 'metadata',
      'operational_status', 'organizer', 'price_level', 'schedule_status', 'start_date', 'verification_status']);
  });

  it.each(REMOVED_FIELDS)('rejects removed field %s', key => {
    expect(() => adaptLocation({...LOCATION, [key]: null})).toThrow(CatalogError);
    expect(() => adaptFestival({...FESTIVAL, [key]: ''})).toThrow(CatalogError);
  });

  it.each(Object.keys(LOCATION))('rejects a location without %s', key => {
    expect(() => adaptLocation(without(LOCATION, key))).toThrow(CatalogError);
  });

  it.each(Object.keys(FESTIVAL))('rejects a festival without %s', key => {
    expect(() => adaptFestival(without(FESTIVAL, key))).toThrow(CatalogError);
  });

  it('rejects a non-integer festival location_id', () => {
    expect(() => adaptFestival({...FESTIVAL, location_id: 1.5})).toThrow(CatalogError);
    expect(() => adaptFestival({...FESTIVAL, location_id: '7'})).toThrow(CatalogError);
  });
});
