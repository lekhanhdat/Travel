import {useCallback, useEffect, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import reviewsApi from '../../services/reviews.api';
import catalogRepository from '../../services/catalogRepository';
import {IReview} from '../../common/types';

export type ReviewsStatus = 'loading' | 'error' | 'ready';

/**
 * Reviews of one location/festival (R-FIX4): separate loading / error / empty states,
 * stale responses dropped, and the rating summary taken from the catalog aggregate
 * (`rating` / `review_count`), never recomputed from the first page.
 */
export function useReviews(
  kind: 'location' | 'festival',
  id: number,
  initial: {rating: number | null | undefined; count: number | undefined},
  disabled = false,
) {
  const [items, setItems] = useState<IReview[]>([]);
  const [status, setStatus] = useState<ReviewsStatus>(disabled ? 'ready' : 'loading');
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState({
    rating: initial.rating ?? 0,
    count: initial.count ?? 0,
  });
  const generation = useRef(0);

  const load = useCallback(async () => {
    if (disabled) {
      setStatus('ready');
      return;
    }
    const gen = ++generation.current;
    setStatus(s => (s === 'ready' && items.length ? 'ready' : 'loading'));
    catalogRepository
      .get()
      .then(catalog => {
        const rec =
          kind === 'location' ? catalog.locationById.get(id) : catalog.festivalById.get(id);
        if (rec && gen === generation.current) {
          setSummary({rating: rec.rating ?? 0, count: rec.review_count ?? 0});
        }
      })
      .catch(() => {});
    try {
      const page = await reviewsApi.listPage(
        kind === 'location' ? {location_id: id} : {festival_id: id},
      );
      if (gen !== generation.current) {return;}
      setItems(page.items);
      setHasMore(page.hasMore);
      setStatus('ready');
    } catch {
      if (gen === generation.current) {setStatus('error');}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items only used to keep the list while refreshing
  }, [kind, id, disabled]);

  // Load on focus (also refreshes after the user wrote a review in Feed).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  return {items, status, hasMore, summary, reload: load};
}
