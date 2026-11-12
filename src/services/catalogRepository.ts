import {fetchCatalog} from './catalog.client';
import {adaptFestival, adaptHotel, adaptLocation, FestivalDTO, HotelDTO, LocationDTO} from './catalog.adapter';
import {createPersistentCatalog} from './catalogStore';
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
const listeners = new Set<(snapshot: CatalogSnapshot) => void>();
let repositoryVersion = 0;
let lastSnapshot: CatalogSnapshot | undefined;
let lastLocations: LocationDTO[] | undefined;
let lastFestivals: FestivalDTO[] | undefined;
const snapshotFor = (locations: LocationDTO[], festivals: FestivalDTO[]) => {
  if (!lastSnapshot || locations !== lastLocations || festivals !== lastFestivals) {
    lastLocations = locations;
    lastFestivals = festivals;
    lastSnapshot = buildCatalogSnapshot(locations, festivals);
  }
  return lastSnapshot;
};
const publish = () => {
  const locations = locationsStore.peek();
  const festivals = festivalsStore.peek();
  if (!locations || !festivals) {return;}
  const snapshot = snapshotFor(locations.items, festivals.items);
  listeners.forEach(listener => {
    try {listener(snapshot);} catch { /* A consumer must not break a successful refresh. */ }
  });
};
const locationsStore = createPersistentCatalog('locations', adaptLocation,
  () => fetchCatalog('/locations', adaptLocation), publish);
const festivalsStore = createPersistentCatalog('festivals', adaptFestival,
  () => fetchCatalog('/festivals', adaptFestival), publish);

// P11.4: hotels are loaded lazily, only when a search needs them (~44 KB gzip), with the same cache rules.
const hotelsStore = createPersistentCatalog('hotels', adaptHotel, () => fetchCatalog('/hotels', adaptHotel), () => {});
const get = async (forceRefresh = false) => {
  const version = repositoryVersion;
  const [locations, festivals] = await Promise.all([locationsStore.get(forceRefresh), festivalsStore.get(forceRefresh)]);
  if (version !== repositoryVersion) {return buildCatalogSnapshot(locations, festivals);}
  return snapshotFor(locationsStore.peek()?.items ?? locations, festivalsStore.peek()?.items ?? festivals);
};
const catalogRepository = {
  get,
  refresh: () => get(true),
  getHotels: (forceRefresh = false): Promise<HotelDTO[]> => hotelsStore.get(forceRefresh),
  subscribe: (listener: (snapshot: CatalogSnapshot) => void) => {
    listeners.add(listener);
    return () => {listeners.delete(listener);};
  },
  meta: () => {
    const resources = [locationsStore.peek(), festivalsStore.peek()];
    return {
      savedAt: resources.every(Boolean) ? Math.min(...resources.map(value => value!.savedAt)) : null,
      fromCache: resources.some(value => value?.fromCache === true),
    };
  },
  clear: () => {
    repositoryVersion++;
    lastSnapshot = undefined;
    lastLocations = undefined;
    lastFestivals = undefined;
    return Promise.all([locationsStore.clear(), festivalsStore.clear(), hotelsStore.clear()]).then(() => {});
  },
};

export default catalogRepository;
