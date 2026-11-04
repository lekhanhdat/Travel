const {CatalogError} = require('../../src/services/catalog.client');
const {adaptLocation, adaptFestival, REMOVED_FIELDS} = require('../../src/services/catalog.adapter');

// Same field sets as Travel_BE/tests/check_contract.py (locations 21, festivals 18).
const COMMON = {id: 1, record_id: 'source-1', name: 'Tên từ API', types: ['culture'], description: '',
  long_description: '', rating: null, review_count: 0, content_en: {}, images: [], videos: [], advise: [], website: '',
  phone: '', ticket_info: '', publishable: true};
const LOCATION = {...COMMON, address: '', lat: 16.05, long: 108.2, opening_hours: '', avatar: ''};
const FESTIVAL = {...COMMON, event_time: '', location_id: 7};
const without = (row, key) => Object.fromEntries(Object.entries(row).filter(([k]) => k !== key));

describe('catalog adapter contract', () => {
  it('accepts exactly the BE field sets', () => {
    expect(Object.keys(LOCATION)).toHaveLength(21);
    expect(Object.keys(FESTIVAL)).toHaveLength(18);
    expect(adaptLocation(LOCATION)).toEqual(LOCATION);
    expect(adaptFestival(FESTIVAL)).toEqual(FESTIVAL);
    expect(adaptFestival({...FESTIVAL, location_id: null}).location_id).toBeNull();
  });

  // P12 (schema 013): `reviews` left the contract; an API deployed before P12 still sends `reviews: []`.
  it('accepts the legacy empty reviews field from an API deployed before P12', () => {
    expect(() => adaptLocation({...LOCATION, reviews: []})).not.toThrow();
    expect(() => adaptFestival({...FESTIVAL, reviews: []})).not.toThrow();
  });

  it('lists every field removed by schema 002–006', () => {
    expect([...REMOVED_FIELDS].sort()).toEqual(['amenities', 'end_date', 'location', 'marker', 'metadata',
      'operational_status', 'organizer', 'price_level', 'schedule_status', 'start_date', 'verification_status']);
  });

  it.each(REMOVED_FIELDS)('rejects removed field %s', key => {
    expect(() => adaptLocation({...LOCATION, [key]: null})).toThrow(CatalogError);
    expect(() => adaptFestival({...FESTIVAL, [key]: ''})).toThrow(CatalogError);
  });

  // P7: review_count may be missing from an API deployed before P7 (treated as 0), never malformed.
  it('defaults a missing review_count to 0 and rejects a malformed one', () => {
    expect(adaptLocation(without(LOCATION, 'review_count')).review_count).toBe(0);
    expect(adaptFestival({...FESTIVAL, review_count: 3}).review_count).toBe(3);
    for (const bad of [-1, 1.5, '2', null]) {
      expect(() => adaptLocation({...LOCATION, review_count: bad})).toThrow(CatalogError);
    }
  });

  it.each(Object.keys(LOCATION).filter(key => !['review_count', 'content_en'].includes(key)))('rejects a location without %s', key => {
    expect(() => adaptLocation(without(LOCATION, key))).toThrow(CatalogError);
  });

  it.each(Object.keys(FESTIVAL).filter(key => !['review_count', 'content_en'].includes(key)))('rejects a festival without %s', key => {
    expect(() => adaptFestival(without(FESTIVAL, key))).toThrow(CatalogError);
  });

  it('rejects a non-integer festival location_id', () => {
    expect(() => adaptFestival({...FESTIVAL, location_id: 1.5})).toThrow(CatalogError);
    expect(() => adaptFestival({...FESTIVAL, location_id: '7'})).toThrow(CatalogError);
  });
});
