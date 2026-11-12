/**
 * Discover = locations + festivals shown together (owner decision D-2).
 * Home sections and the unified "View all" list work on DiscoverItem so both
 * kinds can be mixed, sorted by distance, or filtered by kind.
 */
import {ILocation} from '../../common/types';
import {IFestival} from '../../services/festivals.api';
import {CatalogSnapshot} from '../../services/catalogRepository';
import {catalogImage} from '../../utils/catalogDisplay';
import {Coordinates} from '../../utils/nearby';
import haversineDistance from '../../utils/haversineDistance';

export type DiscoverKind = 'location' | 'festival';
export type DiscoverFilter = 'all' | DiscoverKind;

interface Base {
  key: string;
  id: number;
  name: string;
  image: string;
  rating: number | null;
  reviewCount: number;
  lat: number | null;
  long: number | null;
  distanceKm?: number;
}
export interface LocationItem extends Base {
  kind: 'location';
  location: ILocation;
}
export interface FestivalItem extends Base {
  kind: 'festival';
  festival: IFestival;
}
export type DiscoverItem = LocationItem | FestivalItem;

export function fromLocation(location: ILocation): LocationItem {
  // hotels share ids with locations → keep them apart in keys
  const kindKey = location.kind === 'hotel' ? 'hotel' : 'location';
  return {
    kind: 'location',
    key: `${kindKey}:${location.id}`,
    id: location.id,
    name: location.name,
    image: catalogImage(location),
    rating: location.rating ?? null,
    reviewCount: location.review_count ?? 0,
    lat: location.lat,
    long: location.long,
    location,
  };
}

export function fromFestival(
  festival: IFestival,
  venue?: {lat: number | null; long: number | null},
): FestivalItem {
  return {
    kind: 'festival',
    key: `festival:${festival.id}`,
    id: festival.id,
    name: festival.name,
    image: catalogImage(festival as any),
    rating: festival.rating ?? null,
    reviewCount: festival.review_count ?? 0,
    lat: venue?.lat ?? null,
    long: venue?.long ?? null,
    festival,
  };
}

export function buildDiscoverItems(snapshot: CatalogSnapshot): {
  locations: LocationItem[];
  festivals: FestivalItem[];
} {
  const locations = snapshot.locations.map(l => fromLocation(l as ILocation));
  const festivals = snapshot.festivals.map(f =>
    fromFestival(
      f as IFestival,
      f.location_id !== null ? snapshot.locationById.get(f.location_id) : undefined,
    ),
  );
  return {locations, festivals};
}

/** Stable ranking: most reviewed, then best rated, then API order. */
function rank<T extends DiscoverItem>(items: T[]): T[] {
  return items
    .map((item, index) => ({item, index}))
    .sort(
      (a, b) =>
        b.item.reviewCount - a.item.reviewCount ||
        (b.item.rating ?? 0) - (a.item.rating ?? 0) ||
        a.index - b.index,
    )
    .map(x => x.item);
}

/** Interleave two ranked lists: 2 locations, 1 festival, … until `limit`. */
export function mixPopular(
  locations: LocationItem[],
  festivals: FestivalItem[],
  limit = 20,
): DiscoverItem[] {
  const l = rank(locations);
  const f = rank(festivals);
  const out: DiscoverItem[] = [];
  let i = 0;
  let j = 0;
  while (out.length < limit && (i < l.length || j < f.length)) {
    for (let n = 0; n < 2 && i < l.length && out.length < limit; n++) {
      out.push(l[i++]);
    }
    if (j < f.length && out.length < limit) {
      out.push(f[j++]);
    }
    if (i >= l.length) {
      while (j < f.length && out.length < limit) {
        out.push(f[j++]);
      }
    }
  }
  return out;
}

const validGps = (lat: number | null, long: number | null) =>
  typeof lat === 'number' &&
  typeof long === 'number' &&
  Number.isFinite(lat) &&
  Number.isFinite(long) &&
  Math.abs(lat) <= 90 &&
  Math.abs(long) <= 180;

/** Locations and festivals (at their venue) nearest first. */
export function sortNearby(
  items: DiscoverItem[],
  origin: Coordinates,
  limit = 20,
): DiscoverItem[] {
  return items
    .filter(item => validGps(item.lat, item.long))
    .map(item => ({
      ...item,
      distanceKm:
        haversineDistance(origin, {
          latitude: item.lat as number,
          longitude: item.long as number,
        }) / 1000,
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, limit);
}

export function filterByKind(
  items: DiscoverItem[],
  filter: DiscoverFilter,
): DiscoverItem[] {
  return filter === 'all' ? items : items.filter(i => i.kind === filter);
}

/** Accepts the new `items` param and the legacy `locations` / `festivals` arrays. */
export function itemsFromParams(params: any): DiscoverItem[] {
  if (Array.isArray(params?.items)) {
    return params.items;
  }
  const out: DiscoverItem[] = [];
  if (Array.isArray(params?.locations)) {
    out.push(...params.locations.map((l: ILocation) => fromLocation(l)));
  }
  if (Array.isArray(params?.festivals)) {
    out.push(...params.festivals.map((f: IFestival) => fromFestival(f)));
  }
  return out;
}
