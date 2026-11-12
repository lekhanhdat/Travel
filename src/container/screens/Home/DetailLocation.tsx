/**
 * Location Detail (REDESIGN_PLAN §4.4): hero · name (alone, centered, 1 line) ·
 * type · rating · reviews · distance · action row · 3-line description + "Xem thêm" ·
 * info block · mini map · photos · festivals here · tips · similar · reviews ·
 * sticky "Chỉ đường".
 */
import FEATURE_FLAGS from '../../../config/featureFlags';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {FlatList, Linking, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import CatalogStatus from '../../../component/CatalogStatus';
import ReviewItem from '../../../component/ReviewItem';
import ReviewStatus from '../../../component/ReviewStatus';
import SimilarItemsComponent from '../../../component/SimilarItemsComponent';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import {ILocation, IReview} from '../../../common/types';
import {IFestival} from '../../../services/festivals.api';
import catalogRepository from '../../../services/catalogRepository';
import {translateLocationField} from '../../../utils/translationHelpers';
import {catalogImage} from '../../../utils/catalogDisplay';
import {formatDistance} from '../../../utils/nearby';
import {entityKey} from '../../../utils/entityKey';
import {Text} from '../../../ui/Text';
import {space} from '../../../theme/tokens';
import {DetailScaffold, Gallery} from '../../../features/detail/DetailScaffold';
import {
  ActionItem,
  ActionRow,
  Card,
  ExpandableText,
  InfoRow,
  MetaLine,
  Section,
  normalizeUrl,
  telUrl,
} from '../../../features/detail/DetailParts';
import {MiniMap} from '../../../features/detail/MiniMap';
import {useReviews} from '../../../features/detail/useReviews';
import {useDistance} from '../../../features/detail/useDistance';
import {DiscoverCard} from '../../../features/discover/DiscoverCard';
import {fromFestival} from '../../../features/discover/discover';

const renderReview = ({item}: {item: IReview}) => <ReviewItem review={item} />;

const DetailLocationScreen = ({route}: {route: any; navigation: any}) => {
  const location: ILocation = route.params?.location;
  const {t} = useTranslation('common');
  const isHotel = location.kind === 'hotel';
  const [festivals, setFestivals] = useState<IFestival[]>([]);
  const [catalogError, setCatalogError] = useState(false);

  const loadCatalog = useCallback(
    async (force = false) => {
      setCatalogError(false);
      try {
        const catalog = await catalogRepository.get(force);
        // P11.4: a hotel id is not a location id (no linked festivals).
        setFestivals(
          isHotel ? [] : ((catalog.festivalsByLocationId.get(location.id) ?? []) as IFestival[]),
        );
      } catch {
        setCatalogError(true);
      }
    },
    [isHotel, location.id],
  );
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // P11.4: reviews are keyed by location id; hotels have none yet.
  const reviews = useReviews(
    'location',
    location.id,
    {rating: location.rating, count: location.review_count},
    isHotel,
  );

  const hasGps =
    typeof location.lat === 'number' &&
    typeof location.long === 'number' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.long);
  const distanceKm = useDistance(hasGps ? location.lat : null, hasGps ? location.long : null);

  const name = translateLocationField(t, location, 'name', location.name);
  const description = translateLocationField(
    t,
    location,
    'long_description',
    location.long_description || location.description,
  );
  const address = location.address
    ? translateLocationField(t, location, 'address', location.address)
    : '';
  const hours = location.opening_hours
    ? translateLocationField(t, location, 'opening_hours', location.opening_hours)
    : '';
  const advise = useMemo(
    () =>
      (Array.isArray(location.advise)
        ? location.advise
        : (location.advise ?? '').split('\n')
      )
        .map((a, i) => translateLocationField(t, location, 'advise', a.trim(), i))
        .filter(Boolean),
    [location, t],
  );
  const typeLabel = isHotel
    ? location.category || t('discover.stay')
    : location.types?.[0]
    ? t(`types.${location.types[0]}`, {defaultValue: location.types[0]})
    : null;

  const openMap = useCallback(
    () =>
      NavigationService.navigate(ScreenName.MAP_SCREEN, {
        locations: [location],
        showRoute: true,
      }),
    [location],
  );
  const showMap = FEATURE_FLAGS.ENABLE_MAP && hasGps;

  const actions: ActionItem[] = [];
  if (location.phone) {
    actions.push({
      icon: 'phone-outline',
      label: t('detail.call'),
      onPress: () => Linking.openURL(telUrl(location.phone as string)).catch(() => {}),
    });
  }
  if (location.website) {
    actions.push({
      icon: 'web',
      label: t('detail.website'),
      onPress: () =>
        Linking.openURL(normalizeUrl(location.website as string)).catch(() => {}),
    });
  }
  if (showMap) {
    actions.push({icon: 'map-outline', label: t('detail.viewOnMap'), onPress: openMap});
  }

  const shareMessage = [
    name,
    address,
    hasGps ? `https://maps.google.com/?q=${location.lat},${location.long}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const festivalItems = useMemo(
    () => festivals.map(f => fromFestival(f, location)),
    [festivals, location],
  );

  return (
    <DetailScaffold
      image={catalogImage(location)}
      name={name}
      backLabel={t('buttons.back')}
      shareLabel={t('detail.share')}
      shareMessage={shareMessage}
      cta={showMap ? {label: t('detail.directions'), icon: 'directions', onPress: openMap} : null}>
      <MetaLine
        parts={[typeLabel, distanceKm != null ? formatDistance(distanceKm) : null]}
        rating={reviews.summary.rating}
        count={reviews.summary.count}
      />
      <CatalogStatus loading={false} error={catalogError} onRetry={() => loadCatalog(true)} />
      <ActionRow actions={actions} />

      {description ? (
        <Section title={t('detail.about')}>
          <ExpandableText
            text={description}
            moreLabel={t('detail.readMore')}
            lessLabel={t('detail.readLess')}
          />
        </Section>
      ) : null}

      {address || hours || location.phone || location.website ? (
        <Section title={t('detail.info')}>
          <Card>
            <InfoRow icon="map-marker-outline" label={t('detail.address')} value={address} />
            <InfoRow icon="clock-outline" label={t('detail.openingHours')} value={hours} />
            <InfoRow
              icon="phone-outline"
              label={t('detail.phone')}
              value={location.phone}
              url={location.phone ? telUrl(location.phone) : undefined}
            />
            <InfoRow
              icon="web"
              label={t('detail.website')}
              value={location.website}
              url={location.website ? normalizeUrl(location.website) : undefined}
            />
          </Card>
        </Section>
      ) : null}

      {showMap ? (
        <Section title={t('detail.onMap')}>
          <MiniMap
            lat={location.lat as number}
            long={location.long as number}
            label={t('detail.viewOnMap')}
            onPress={openMap}
          />
        </Section>
      ) : null}

      {location.images && location.images.length > 0 ? (
        <Section title={t('detail.locationImages')}>
          <Gallery images={location.images.filter(i => typeof i === 'string' && i)} />
        </Section>
      ) : null}

      {festivalItems.length > 0 ? (
        <Section title={t('detail.festivalsAtLocation')}>
          <FlatList
            data={festivalItems}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            renderItem={({item}) => <DiscoverCard item={item} />}
          />
        </Section>
      ) : null}

      {advise.length > 0 ? (
        <Section title={t('detail.advice')}>
          <Card>
            {advise.map((a, i) => (
              <View key={`advice-${i}`} style={styles.tip}>
                <Text variant="body" tone="primary" style={styles.bullet}>
                  •
                </Text>
                <Text variant="bodySmall" style={styles.flex}>
                  {a}
                </Text>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

      {/* Semantic similar items from the BE (P11.4: hotels are not in the location index) */}
      {FEATURE_FLAGS.ENABLE_AI && !isHotel ? (
        <SimilarItemsComponent
          entityType="location"
          entityId={location.id}
          title={t('detail.similarLocations')}
          limit={5}
        />
      ) : null}

      {!isHotel ? (
        <Section title={t('detail.reviews')}>
          <FlatList
            data={reviews.items}
            scrollEnabled={false}
            renderItem={renderReview}
            keyExtractor={item => entityKey(item, 'review')}
            ListEmptyComponent={
              <ReviewStatus status={reviews.status} onRetry={reviews.reload} />
            }
          />
        </Section>
      ) : null}
    </DetailScaffold>
  );
};

export default DetailLocationScreen;

const styles = StyleSheet.create({
  flex: {flex: 1},
  tip: {flexDirection: 'row', paddingVertical: space.xxs},
  bullet: {width: 16},
});
