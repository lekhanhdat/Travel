/**
 * One "View all" list for places and festivals (replaces ViewAllLocation +
 * ViewAllFestivals, owner decision D-2). Accepts `items` (DiscoverItem[]) or the
 * legacy `locations` / `festivals` params, so older call sites keep working.
 */
import React, {useMemo, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import Page from '../../../component/Page';
import {useTranslation} from '../../../hooks/useTranslation';
import {AppHeader} from '../../../ui/AppHeader';
import {Chip} from '../../../ui/Chip';
import {Text} from '../../../ui/Text';
import {Icon} from '../../../ui/Icon';
import {color, space} from '../../../theme/tokens';
import {
  DiscoverFilter,
  DiscoverItem,
  filterByKind,
  itemsFromParams,
} from '../../../features/discover/discover';
import {DiscoverCard, ROW_HEIGHT} from '../../../features/discover/DiscoverCard';

const keyOf = (item: DiscoverItem) => item.key;
const renderRow = ({item}: {item: DiscoverItem}) => <DiscoverCard item={item} variant="row" />;
const layout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

const ViewAllScreen = ({route}: {route: any}) => {
  const {t, language} = useTranslation();
  const params = useMemo(() => route?.params ?? {}, [route?.params]);
  const items = useMemo(() => itemsFromParams(params), [params]);
  const hasBoth = useMemo(
    () => items.some(i => i.kind === 'location') && items.some(i => i.kind === 'festival'),
    [items],
  );
  const [filter, setFilter] = useState<DiscoverFilter>(
    hasBoth ? params.initialFilter ?? 'all' : 'all',
  );
  const shown = useMemo(() => filterByKind(items, filter), [items, filter]);

  const filters: {key: DiscoverFilter; label: string; icon: any}[] = [
    {key: 'all', label: t('discover.all'), icon: 'view-grid-outline'},
    {key: 'location', label: t('discover.places'), icon: 'map-marker-outline'},
    {key: 'festival', label: t('discover.festivals'), icon: 'party-popper'},
  ];

  return (
    <Page style={styles.page}>
      <AppHeader title={params.title ?? t('home.viewAll')} />
      {hasBoth ? (
        <View style={styles.chips}>
          {filters.map(f => (
            <Chip
              key={f.key}
              label={f.label}
              icon={f.icon}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </View>
      ) : null}
      <Text variant="caption" tone="textSecondary" style={styles.count}>
        {shown.length} {t('search.results')}
        {params.isSemanticSearch ? ` · ${t('search.sortedByRelevance')}` : ''}
      </Text>
      <FlatList
        data={shown}
        keyExtractor={keyOf}
        renderItem={renderRow}
        getItemLayout={layout}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        extraData={language}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="map-search-outline" size={48} color={color.textMuted} />
            <Text variant="headline" style={styles.emptyTitle}>
              {t('discover.emptyTitle')}
            </Text>
            <Text variant="bodySmall" tone="textSecondary" style={styles.center}>
              {t('discover.emptyHint')}
            </Text>
          </View>
        }
      />
    </Page>
  );
};

export default ViewAllScreen;

const styles = StyleSheet.create({
  page: {backgroundColor: color.background},
  chips: {flexDirection: 'row', paddingHorizontal: space.page, paddingTop: space.sm},
  count: {paddingHorizontal: space.page, paddingTop: space.sm, paddingBottom: space.xs},
  list: {paddingHorizontal: space.page, paddingBottom: space.xxxl},
  empty: {alignItems: 'center', paddingTop: space.xxxl, paddingHorizontal: space.xl},
  emptyTitle: {marginTop: space.sm, marginBottom: space.xxs},
  center: {textAlign: 'center'},
});
