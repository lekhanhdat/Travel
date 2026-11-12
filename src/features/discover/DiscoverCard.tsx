import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import CachedImage from '../../component/CachedImage';
import {color, elevation, radius, space} from '../../theme/tokens';
import {Text} from '../../ui/Text';
import {Icon} from '../../ui/Icon';
import {
  translateFestivalField,
  translateLocationField,
} from '../../utils/translationHelpers';
import {formatDistance} from '../../utils/nearby';
import {DiscoverItem} from './discover';
import {openDiscoverItem} from './openDiscoverItem';

interface Props {
  item: DiscoverItem;
  variant?: 'hero' | 'row';
  onPress?: (item: DiscoverItem) => void;
}

export const HERO_WIDTH = 240;
export const HERO_GAP = space.sm;
export const ROW_HEIGHT = 88 + space.sm;

function useLabels(item: DiscoverItem) {
  const {t} = useTranslation('common');
  if (item.kind === 'festival') {
    const f = item.festival;
    return {
      name: translateFestivalField(t, f, 'name', f.name),
      subtitle:
        translateFestivalField(t, f, 'event_time', f.event_time) ||
        translateFestivalField(t, f, 'location', f.location),
      kindLabel: t('discover.festival'),
    };
  }
  const l = item.location;
  return {
    name: translateLocationField(t, l, 'name', l.name),
    subtitle: translateLocationField(t, l, 'address', l.address ?? ''),
    kindLabel:
      l.kind === 'hotel'
        ? t('discover.stay')
        : t('discover.place'),
  };
}

const Meta = ({item}: {item: DiscoverItem}) => {
  const hasRating = item.reviewCount > 0 && item.rating != null;
  if (!hasRating && item.distanceKm == null) {
    return null;
  }
  return (
    <View style={styles.meta}>
      {hasRating ? (
        <>
          <Icon name="star" size={14} color={color.star} />
          <Text variant="caption" tone="text" style={styles.metaText}>
            {(item.rating as number).toFixed(1)}
          </Text>
          <Text variant="caption" tone="textMuted">
            ({item.reviewCount})
          </Text>
        </>
      ) : null}
      {hasRating && item.distanceKm != null ? (
        <Text variant="caption" tone="textMuted">
          {'  ·  '}
        </Text>
      ) : null}
      {item.distanceKm != null ? (
        <Text variant="caption" tone="textMuted">
          {formatDistance(item.distanceKm)}
        </Text>
      ) : null}
    </View>
  );
};

const KindBadge = ({item, label}: {item: DiscoverItem; label: string}) => {
  const festival = item.kind === 'festival';
  return (
    <View style={[styles.badge, festival ? styles.badgeFestival : styles.badgePlace]}>
      <Icon
        name={festival ? 'party-popper' : 'map-marker-outline'}
        size={12}
        color={festival ? color.accentText : color.primary}
      />
      <Text
        variant="caption"
        tone={festival ? 'accentText' : 'primary'}
        style={styles.badgeText}>
        {label}
      </Text>
    </View>
  );
};

export const DiscoverCard = React.memo(({item, variant = 'hero', onPress}: Props) => {
  const {name, subtitle, kindLabel} = useLabels(item);
  const press = () => (onPress ? onPress(item) : openDiscoverItem(item));
  const a11y = `${kindLabel}: ${name}`;

  if (variant === 'row') {
    return (
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({pressed}) => [styles.row, pressed && styles.pressed]}>
        <CachedImage uri={item.image} style={styles.rowImage} showLoader={false} />
        <View style={styles.rowBody}>
          <KindBadge item={item} label={kindLabel} />
          <Text variant="label" numberOfLines={1} style={styles.rowName}>
            {name}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          <Meta item={item} />
        </View>
        <Icon name="chevron-right" size={20} color={color.textMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({pressed}) => [styles.hero, pressed && styles.pressed]}>
      <View>
        <CachedImage uri={item.image} style={styles.heroImage} showLoader={false} />
        <View style={styles.heroBadge}>
          <KindBadge item={item} label={kindLabel} />
        </View>
      </View>
      <View style={styles.heroBody}>
        <Text variant="headline" numberOfLines={1}>
          {name}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="textSecondary" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Meta item={item} />
      </View>
    </Pressable>
  );
});
DiscoverCard.displayName = 'DiscoverCard';

const styles = StyleSheet.create({
  pressed: {opacity: 0.9, transform: [{scale: 0.98}]},
  hero: {
    width: HERO_WIDTH,
    marginRight: HERO_GAP,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...elevation.card,
  },
  heroImage: {width: HERO_WIDTH, height: 160, backgroundColor: color.placeholder},
  heroBadge: {position: 'absolute', top: space.xs, left: space.xs},
  heroBody: {padding: space.sm, minHeight: 86},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 88,
    marginBottom: space.sm,
    paddingRight: space.xs,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...elevation.card,
  },
  rowImage: {width: 88, height: 88, backgroundColor: color.placeholder},
  rowBody: {flex: 1, paddingHorizontal: space.sm, justifyContent: 'center'},
  rowName: {marginTop: 2},
  meta: {flexDirection: 'row', alignItems: 'center', marginTop: 2},
  metaText: {marginLeft: 2, marginRight: 2},
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgePlace: {backgroundColor: color.primaryContainer},
  badgeFestival: {backgroundColor: color.accentContainer},
  badgeText: {marginLeft: 3},
});

export default DiscoverCard;
