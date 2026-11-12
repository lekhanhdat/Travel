/** Catalog ids are unique within a kind, not across hotels and locations. */
export function entityKey(item: unknown, fallbackKind = 'location'): string {
  const entity = item as {kind?: string; id?: number | string};
  return `${entity.kind ?? fallbackKind}:${entity.id}`;
}
