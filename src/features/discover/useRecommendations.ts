import {useCallback, useEffect, useState} from 'react';
import {getRecommendations} from '../../services/semantic.api';
import catalogRepository from '../../services/catalogRepository';
import {ILocation} from '../../common/types';
import {IFestival} from '../../services/festivals.api';
import {DiscoverItem, fromFestival, fromLocation} from './discover';

/** "Phù hợp" section: AI recommendations (locations and festivals) resolved against the catalog. */
export function useRecommendations(userId: number | undefined, limit = 10) {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getRecommendations(userId, limit);
      if (!response.success) {
        setItems([]);
        return;
      }
      const {locationById, festivalById} = await catalogRepository.get();
      const out: DiscoverItem[] = [];
      for (const rec of response.recommendations) {
        if (rec.entity_type === 'location') {
          const l = locationById.get(rec.entity_id);
          if (l) {out.push(fromLocation(l as ILocation));}
        } else if (rec.entity_type === 'festival') {
          const f = festivalById.get(rec.entity_id);
          if (f) {
            const venue = f.location_id !== null ? locationById.get(f.location_id) : undefined;
            out.push(fromFestival(f as IFestival, venue));
          }
        }
      }
      setItems(out);
    } catch {
      setItems([]); // section simply hides; the rest of Home keeps working
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return {items, loading, reload: load};
}
