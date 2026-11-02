import {createCatalogCache, fetchCatalog} from './catalog.client';
import {adaptFestival, adaptHotel, adaptLocation, FestivalDTO, HotelDTO, LocationDTO} from './catalog.adapter';
import {isMapLocationVisible} from '../utils/catalogVisibility';

/** Festival with the venue name resolved from location_id ('' when it has no linked location). */
export type CatalogFestival = FestivalDTO & {location: string};

export interface CatalogSnapshot {
  locations: LocationDTO[];
  festivals: CatalogFestival[];
  locationById: Map<number, LocationDTO>;
  festivalById: Map<number, CatalogFestival>;
  festivalsByLocationId: Map<number, CatalogFestival[]>;
  /** Locations allowed on the map: publishable with a valid GPS pair. */
  mapMarkers: LocationDTO[];
}

export function buildCatalogSnapshot(locations: LocationDTO[], rawFestivals: FestivalDTO[]): CatalogSnapshot {
  const locationById = new Map(locations.map(location => [location.id, location]));
  const festivals = rawFestivals.map(festival => ({
    ...festival,
    location: festival.location_id !== null ? locationById.get(festival.location_id)?.name ?? '' : '',
  }));
  const festivalsByLocationId = new Map<number, CatalogFestival[]>();
  for (const festival of festivals) {
    if (festival.location_id === null) {continue;}
    const list = festivalsByLocationId.get(festival.location_id) ?? [];
    list.push(festival);
    festivalsByLocationId.set(festival.location_id, list);
  }
  return {
    locations,
    festivals,
    locationById,
    festivalById: new Map(festivals.map(festival => [festival.id, festival])),
    festivalsByLocationId,
    mapMarkers: locations.filter(isMapLocationVisible),
  };
}

// One shared load for the whole app: both lists in parallel, cached 10 minutes.
// A failed refresh rejects; the previous snapshot is dropped only by an explicit refresh/clear.
const cache = createCatalogCache(async () => {
  const [locations, festivals] = await Promise.all([
    fetchCatalog('/locations', adaptLocation),
    fetchCatalog('/festivals', adaptFestival),
  ]);
  return buildCatalogSnapshot(locations, festivals);
});

// P11.4: hotels are loaded lazily, only when a search needs them (~44 KB gzip), with the same cache rules.
const hotelsCache = createCatalogCache<HotelDTO[]>(() => fetchCatalog('/hotels', adaptHotel));

const catalogRepository = {
  get: (forceRefresh = false) => cache.get(forceRefresh),
  refresh: () => cache.get(true),
  getHotels: (forceRefresh = false) => hotelsCache.get(forceRefresh),
  clear: () => {
    cache.clear();
    hotelsCache.clear();
  },
};

export default catalogRepository;
