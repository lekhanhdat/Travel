/**
 * Festival Detail — same scaffold as the location Detail (hero · name alone, centered,
 * 1 line · meta below) but its own sections: when / venue / ticket card, venue mini
 * map, tips, photos, similar festivals, reviews. Sticky "Chỉ đường" to the venue.
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
import {IFestival} from '../../../services/festivals.api';
import {ILocation, IReview} from '../../../common/types';
import catalogRepository from '../../../services/catalogRepository';
import {translateFestivalField, translateLocationField} from '../../../utils/translationHelpers';
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

/** Festivals sharing a type with `current` (max 10), most shared types first. */
function similarFestivals(current: IFestival, all: IFestival[]): IFestival[] {
  const types = current.types ?? [];
  if (!types.length) {return [];}
  return all
    .filter(f => f.id !== current.id)
    .map(f => ({f, n: (f.types ?? []).filter(x => types.includes(x)).length}))
    .filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 10)
    .map(x => x.f);
}

const DetailFestivalScreen = ({route}: {route: any; navigation: any}) => {
  const festival: IFestival = route.params?.festival;
  const {t} = useTranslation('common');
  const [venue, setVenue] = useState<ILocation | null>(null);
  const [allFestivals, setAllFestivals] = useState<IFestival[]>([]);
  const [catalogError, setCatalogError] = useState(false);

  const loadCatalog = useCallback(
    async (force = false) => {
      setCatalogError(false);
      try {
        const {festivals, locationById} = await catalogRepository.get(force);
        setAllFestivals(festivals as IFestival[]);
        setVenue(
          festival.location_id != null
            ? ((locationById.get(festival.location_id) as ILocation) ?? null)
            : null,
        );
      } catch {
        setCatalogError(true);
      }
    },
    [festival.location_id],
  );
  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const reviews = useReviews('festival', festival.id, {
    rating: festival.rating,
    count: festival.review_count,
  });

  const hasGps =
    !!venue &&
    typeof venue.lat === 'number' &&
    typeof venue.long === 'number' &&
    Number.isFinite(venue.lat) &&
    Number.isFinite(venue.long);
  const distanceKm = useDistance(hasGps ? venue!.lat : null, hasGps ? venue!.long : null);

  const name = translateFestivalField(t, festival, 'name', festival.name);
  const description = translateFestivalField(
    t,
    festival,
    'long_description',
    festival.long_description || festival.description,
  );
  const when = festival.event_time
    ? translateFestivalField(t, festival, 'event_time', festival.event_time)
    : '';
  const venueName = venue
    ? translateLocationField(t, venue, 'name', venue.name)
    : festival.location
    ? translateFestivalField(t, festival, 'location', festival.location)
    : '';
  const ticket = festival.ticket_info
    ? translateFestivalField(t, festival, 'ticket_info', festival.ticket_info)
    : '';
  const advise = useMemo(
    () =>
      (festival.advise ?? [])
        .map((a, i) => translateFestivalField(t, festival, 'advise', a, i))
        .filter(Boolean),
    [festival, t],
  );
  const similar = useMemo(
    () => similarFestivals(festival, allFestivals).map(f => fromFestival(f)),
    [festival, allFestivals],
  );

  const showMap = FEATURE_FLAGS.ENABLE_MAP && hasGps;
  const openMap = useCallback(() => {
    if (venue) {
      NavigationService.navigate(ScreenName.MAP_SCREEN, {
        locations: [venue],
        showRoute: true,
      });
    }
  }, [venue]);
  const openVenue = useCallback(() => {
    if (venue) {
      NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {location: venue});
    }
  }, [venue]);

  const actions: ActionItem[] = [];
  if (venue) {
    actions.push({icon: 'map-marker-outline', label: t('detail.viewLocation'), onPress: openVenue});
  }
  if (festival.phone) {
    actions.push({
      icon: 'phone-outline',
      label: t('detail.call'),
      onPress: () => Linking.openURL(telUrl(festival.phone)).catch(() => {}),
    });
  }
  if (festival.website) {
    actions.push({
      icon: 'web',
      label: t('detail.website'),
      onPress: () => Linking.openURL(normalizeUrl(festival.website)).catch(() => {}),
    });
  }
  if (showMap) {
    actions.push({icon: 'map-outline', label: t('detail.viewOnMap'), onPress: openMap});
  }

  return (
    <DetailScaffold
      image={catalogImage(festival as any)}
      name={name}
      backLabel={t('buttons.back')}
      shareLabel={t('detail.share')}
      shareMessage={[name, when, venueName].filter(Boolean).join('\n')}
      cta={showMap ? {label: t('detail.directions'), icon: 'directions', onPress: openMap} : null}>
      <MetaLine
        parts={[t('discover.festival'), distanceKm != null ? formatDistance(distanceKm) : null]}
        rating={reviews.summary.rating}
        count={reviews.summary.count}
      />
      <CatalogStatus loading={false} error={catalogError} onRetry={() => loadCatalog(true)} />

      {when || venueName || ticket ? (
        <View style={styles.facts}>
          <Card>
            <InfoRow icon="calendar-clock" label={t('detail.when')} value={when} />
            <InfoRow icon="map-marker-outline" label={t('detail.where')} value={venueName} />
            <InfoRow icon="ticket-confirmation-outline" label={t('detail.fee')} value={ticket} />
          </Card>
        </View>
      ) : null}

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

      {advise.length > 0 ? (
        <Section title={t('detail.advice')}>
          <Card>
            {advise.map((a, i) => (
              <View key={`advice-${i}`} style={styles.tip}>
                <Text variant="body" tone="accentText" style={styles.bullet}>
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

      {showMap ? (
        <Section title={t('detail.onMap')}>
          <MiniMap
            lat={venue!.lat as number}
            long={venue!.long as number}
            label={t('detail.viewOnMap')}
            onPress={openMap}
          />
        </Section>
      ) : null}

      {festival.images && festival.images.length > 0 ? (
        <Section title={t('detail.festivalImages')}>
          <Gallery images={festival.images.filter(i => typeof i === 'string' && i)} />
        </Section>
      ) : null}

      {similar.length > 0 ? (
        <Section title={t('detail.similarFestivals')}>
          <FlatList
            data={similar}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.key}
            renderItem={({item}) => <DiscoverCard item={item} />}
          />
        </Section>
      ) : null}

      {/* Semantic similar items from the BE */}
      {FEATURE_FLAGS.ENABLE_AI ? (
        <SimilarItemsComponent
          entityType="festival"
          entityId={festival.id}
          title={t('detail.similarFestivalsAI')}
          limit={5}
        />
      ) : null}

      <Section title={t('detail.reviews')}>
        <FlatList
          data={reviews.items}
          scrollEnabled={false}
          renderItem={renderReview}
          keyExtractor={item => entityKey(item, 'review')}
          ListEmptyComponent={<ReviewStatus status={reviews.status} onRetry={reviews.reload} />}
        />
      </Section>
    </DetailScaffold>
  );
};

export default DetailFestivalScreen;

const styles = StyleSheet.create({
  flex: {flex: 1},
  facts: {marginTop: space.lg},
  tip: {flexDirection: 'row', paddingVertical: space.xxs},
  bullet: {width: 16},
});
