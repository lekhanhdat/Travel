/**
 * Home ("Khám phá") — locations and festivals together (owner decision D-2).
 * Sections: Phù hợp (AI, signed-in) · Phổ biến · Gần bạn. Every section mixes both
 * kinds; the chips on top narrow all sections to only places or only festivals.
 */
import FEATURE_FLAGS from '../../../config/featureFlags';
import CatalogStatus from '../../../component/CatalogStatus';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {Button} from 'react-native-paper';
import Page from '../../../component/Page';
import {ILocation, IAccount} from '../../../common/types';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import catalogRepository, {CatalogSnapshot} from '../../../services/catalogRepository';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {useTranslation} from '../../../hooks/useTranslation';
import LanguageDropdown from '../../../component/LanguageDropdown';
import {getPreciseLocation} from '../../../utils/preciseLocation';
import SemanticSearchBarComponent from '../../../component/SemanticSearchBarComponent';
import {LOCATION_SEARCH_FIELDS} from '../../../utils/catalogSearch';
import {Text} from '../../../ui/Text';
import {Chip} from '../../../ui/Chip';
import {SectionHeader} from '../../../ui/SectionHeader';
import {color, space} from '../../../theme/tokens';
import {
  buildDiscoverItems,
  DiscoverFilter,
  DiscoverItem,
  filterByKind,
  fromFestival,
  fromLocation,
  mixPopular,
  sortNearby,
} from '../../../features/discover/discover';
import {
  DiscoverCard,
  HERO_GAP,
  HERO_WIDTH,
} from '../../../features/discover/DiscoverCard';
import {useRecommendations} from '../../../features/discover/useRecommendations';

type NearbyStatus = 'idle' | 'locating' | 'denied' | 'unavailable' | 'ready';
const NEARBY_PREVIEW = 5;

const keyOf = (item: DiscoverItem) => item.key;
const heroLayout = (_: unknown, index: number) => ({
  length: HERO_WIDTH + HERO_GAP,
  offset: (HERO_WIDTH + HERO_GAP) * index,
  index,
});
const renderHero = ({item}: {item: DiscoverItem}) => <DiscoverCard item={item} />;

interface Props {
  navigation: any;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const {t, language} = useTranslation();
  const searchBarRef = useRef<SemanticSearchBarComponent<ILocation> | null>(null);

  const [snapshot, setSnapshot] = useState<CatalogSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<DiscoverFilter>('all');
  const [account, setAccount] = useState<IAccount | null>(null);
  const [hotels, setHotels] = useState<ILocation[]>([]);
  const [nearbyStatus, setNearbyStatus] = useState<NearbyStatus>('idle');
  const [coords, setCoords] = useState<{latitude: number; longitude: number} | null>(null);

  const load = useCallback(async (force = false, pull = false) => {
    pull ? setRefreshing(true) : setLoading(true);
    setError(false);
    try {
      setSnapshot(await catalogRepository.get(force));
    } catch {
      // A failed refresh keeps what is shown; CatalogStatus offers Retry.
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (FEATURE_FLAGS.ENABLE_AUTH) {
      LocalStorageCommon.getItem(localStorageKey.AVT).then(setAccount);
    }
    const unsub = navigation.addListener('focus', () => {
      searchBarRef.current?.resetSearch();
      if (FEATURE_FLAGS.ENABLE_AUTH) {
        LocalStorageCommon.getItem(localStorageKey.AVT).then(setAccount);
      }
    });
    return unsub;
  }, [load, navigation]);

  // R-DATA1: the first get() may resolve from the saved snapshot; the background refresh arrives here.
  useEffect(() => catalogRepository.subscribe(next => setSnapshot(next)), []);

  const all = useMemo(
    () => (snapshot ? buildDiscoverItems(snapshot) : {locations: [], festivals: []}),
    [snapshot],
  );
  const mixed = useMemo(() => [...all.locations, ...all.festivals], [all]);
  const popular = useMemo(
    () =>
      filter === 'all'
        ? mixPopular(all.locations, all.festivals, 20)
        : mixPopular(
            filter === 'location' ? all.locations : [],
            filter === 'festival' ? all.festivals : [],
            20,
          ),
    [all, filter],
  );
  const nearby = useMemo(
    () => (coords ? sortNearby(filterByKind(mixed, filter), coords, 20) : []),
    [coords, mixed, filter],
  );

  const userId = FEATURE_FLAGS.ENABLE_AI ? account?.id : undefined;
  const recs = useRecommendations(userId, 10);
  const recommended = useMemo(() => filterByKind(recs.items, filter), [recs.items, filter]);

  // "Gần bạn": ask for location only on demand; a denial keeps the rest of Home usable.
  const requestMyLocation = useCallback(async () => {
    setNearbyStatus('locating');
    if (Platform.OS === 'android') {
      let granted: string | null = null;
      try {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('home.locationPermissionTitle'),
            message: t('home.locationPermissionMessage'),
            buttonNegative: t('home.cancel'),
            buttonPositive: 'OK',
          },
        );
      } catch (err) {
        console.warn(err);
      }
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setNearbyStatus('denied');
        return;
      }
    }
    try {
      const position = await getPreciseLocation();
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setNearbyStatus('ready');
    } catch {
      setNearbyStatus('unavailable');
    }
  }, [t]);

  const openList = useCallback(
    (title: string, items: DiscoverItem[]) =>
      NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
        title,
        items,
        initialFilter: filter,
      }),
    [filter],
  );

  // P11.4: hotels join the search data the first time the user types (one lazy /hotels load).
  const hotelsRequested = useRef(false);
  const ensureHotels = useCallback(() => {
    if (hotelsRequested.current) {return;}
    hotelsRequested.current = true;
    catalogRepository
      .getHotels()
      .then(h => setHotels(h as ILocation[]))
      .catch(() => {
        hotelsRequested.current = false; // search keeps working with locations only
      });
  }, []);

  // D-2: one search over places, hotels and festivals (festivals tagged kind 'festival').
  const searchData = useMemo(
    () => [
      ...((snapshot?.locations as ILocation[]) ?? []),
      ...hotels,
      ...((snapshot?.festivals ?? []).map(f => ({...f, kind: 'festival'})) as unknown as ILocation[]),
    ],
    [snapshot, hotels],
  );

  const onSubmitSearch = useCallback(
    (results: ILocation[], value: string, isSemantic: boolean) => {
      if (!value?.trim()) {return;}
      const venueOf = (id: number | null) =>
        id !== null ? snapshot?.locationById.get(id) : undefined;
      const items: DiscoverItem[] = results.map(r =>
        (r as any).kind === 'festival'
          ? fromFestival(r as any, venueOf((r as any).location_id))
          : fromLocation(r),
      );
      NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
        title: isSemantic ? t('home.aiSearchResults') : t('home.search'),
        items,
        valueSearch: value,
        isSemanticSearch: isSemantic,
      });
    },
    [t, snapshot],
  );

  const filters: {key: DiscoverFilter; label: string; icon: any}[] = [
    {key: 'all', label: t('discover.all'), icon: 'view-grid-outline'},
    {key: 'location', label: t('discover.places'), icon: 'map-marker-outline'},
    {key: 'festival', label: t('discover.festivals'), icon: 'party-popper'},
  ];

  const renderRail = (data: DiscoverItem[]) => (
    <FlatList
      data={data}
      keyExtractor={keyOf}
      renderItem={renderHero}
      getItemLayout={heroLayout}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
      initialNumToRender={3}
      maxToRenderPerBatch={4}
      windowSize={5}
      extraData={language}
    />
  );

  return (
    <Page style={styles.page}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="bodySmall" tone="textSecondary">
            {t('home.greeting')}
            {account?.fullName ? `, ${account.fullName}` : ''}
          </Text>
          <Text variant="title" accessibilityRole="header">
            {t('discover.headline')}
          </Text>
        </View>
        <LanguageDropdown compact={true} showFlag={true} showNativeName={false} />
      </View>

      <SemanticSearchBarComponent<ILocation>
        ref={searchBarRef}
        data={searchData}
        searchFields={[...LOCATION_SEARCH_FIELDS, 'location' as keyof ILocation]}
        onSearch={ensureHotels}
        onSubmitSearch={onSubmitSearch}
        placeholder={t('home.searchPlaceholder')}
        entityType="location"
        entityTypes={['location', 'festival']}
        idField="id"
        onQueryChange={ensureHotels}
      />

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

      <CatalogStatus loading={loading && !snapshot} error={error} onRetry={() => load(true)} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              load(true, true);
              recs.reload();
            }}
            colors={[color.primary]}
          />
        }>
        {recommended.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={t('discover.forYou')}
              actionLabel={t('home.viewAll')}
              onAction={() => openList(t('discover.forYou'), recommended)}
            />
            {renderRail(recommended)}
          </View>
        ) : null}

        {popular.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title={t('discover.popular')}
              actionLabel={t('home.viewAll')}
              onAction={() =>
                openList(
                  t('discover.popular'),
                  mixPopular(
                    filter === 'festival' ? [] : all.locations,
                    filter === 'location' ? [] : all.festivals,
                    Number.MAX_SAFE_INTEGER,
                  ),
                )
              }
            />
            {renderRail(popular)}
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader
            title={t('discover.nearby')}
            actionLabel={nearbyStatus === 'ready' && nearby.length > NEARBY_PREVIEW ? t('home.viewAll') : undefined}
            onAction={() => openList(t('discover.nearby'), nearby)}
          />
          <View style={styles.pad}>
            {nearbyStatus === 'ready' ? (
              nearby.length > 0 ? (
                nearby.slice(0, NEARBY_PREVIEW).map(item => (
                  <DiscoverCard key={item.key} item={item} variant="row" />
                ))
              ) : (
                <Text variant="bodySmall" tone="textSecondary">
                  {t('home.noNearby')}
                </Text>
              )
            ) : (
              <View style={styles.nearbyCard}>
                <Text variant="bodySmall" tone="textSecondary" style={styles.nearbyText}>
                  {nearbyStatus === 'denied'
                    ? t('home.locationDenied')
                    : nearbyStatus === 'unavailable'
                    ? t('home.locationUnavailable')
                    : t('discover.nearbyHint')}
                </Text>
                <Button
                  mode="contained"
                  icon="crosshairs-gps"
                  loading={nearbyStatus === 'locating'}
                  disabled={nearbyStatus === 'locating'}
                  onPress={requestMyLocation}>
                  {t(nearbyStatus === 'locating' ? 'home.locating' : 'home.useMyLocation')}
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Page>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  page: {backgroundColor: color.background},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.page,
    paddingTop: space.lg,
    paddingBottom: space.xs,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: space.page,
    paddingTop: space.xs,
    paddingBottom: space.xs,
  },
  scroll: {paddingTop: space.xs, paddingBottom: space.xxxl},
  section: {marginTop: space.md},
  rail: {paddingHorizontal: space.page, paddingBottom: space.xs},
  pad: {paddingHorizontal: space.page},
  nearbyCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: space.md,
    borderWidth: 1,
    borderColor: color.border,
  },
  nearbyText: {marginBottom: space.sm},
});
