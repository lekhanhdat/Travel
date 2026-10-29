// Display helpers for API catalog records; missing data yields empty values so screens show an empty state.

/** First usable image of a record (`avatar`, then `images[0]`); '' lets CachedImage show its placeholder. */
export function catalogImage(item: {avatar?: string | null; images?: unknown} | null | undefined): string {
  if (!item) {return '';}
  if (typeof item.avatar === 'string' && item.avatar.trim()) {return item.avatar;}
  const first = Array.isArray(item.images) ? item.images.find(image => typeof image === 'string' && image.trim()) : '';
  return typeof first === 'string' ? first : '';
}
