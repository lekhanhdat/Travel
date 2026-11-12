/** Shared building blocks of the Detail screens (location + festival). */
import React, {useState} from 'react';
import {Linking, Pressable, StyleSheet, View} from 'react-native';
import {color, radius, space} from '../../theme/tokens';
import {Text} from '../../ui/Text';
import {Icon, IconName} from '../../ui/Icon';

export const Section = ({
  title,
  children,
  right,
}: {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <View style={styles.section}>
    {title ? (
      <View style={styles.sectionHead}>
        <Text variant="headline" accessibilityRole="header" style={styles.flex}>
          {title}
        </Text>
        {right}
      </View>
    ) : null}
    {children}
  </View>
);

/** Centered meta line under the name: type · ★ rating (count) · distance. */
export const MetaLine = ({
  parts,
  rating,
  count,
}: {
  parts: (string | null | undefined)[];
  rating?: number | null;
  count?: number;
}) => {
  const items: React.ReactNode[] = [];
  const clean = parts.filter(Boolean) as string[];
  if (clean[0]) {
    items.push(
      <Text key="type" variant="bodySmall" tone="textSecondary">
        {clean[0]}
      </Text>,
    );
  }
  if (count && count > 0 && rating != null) {
    items.push(
      <View key="rating" style={styles.inline}>
        <Icon name="star" size={16} color={color.star} />
        <Text variant="label" style={styles.ratingText}>
          {rating.toFixed(1)}
        </Text>
        <Text variant="bodySmall" tone="textSecondary">
          ({count})
        </Text>
      </View>,
    );
  }
  clean.slice(1).forEach((p, i) =>
    items.push(
      <Text key={`p${i}`} variant="bodySmall" tone="textSecondary">
        {p}
      </Text>,
    ),
  );
  if (!items.length) {return null;}
  return (
    <View style={styles.meta}>
      {items.map((node, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <Text variant="bodySmall" tone="textMuted" style={styles.dot}>
              ·
            </Text>
          ) : null}
          {node}
        </React.Fragment>
      ))}
    </View>
  );
};

export interface ActionItem {
  icon: IconName;
  label: string;
  onPress: () => void;
}

/** Row of round actions (Gọi / Website / Bản đồ / Chia sẻ). */
export const ActionRow = ({actions}: {actions: ActionItem[]}) =>
  actions.length ? (
    <View style={styles.actions}>
      {actions.map(a => (
        <Pressable
          key={a.label}
          onPress={a.onPress}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          style={({pressed}) => [styles.action, pressed && styles.pressed]}>
          <View style={styles.actionIcon}>
            <Icon name={a.icon} size={22} color={color.primary} />
          </View>
          <Text variant="caption" tone="textSecondary" numberOfLines={1}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </View>
  ) : null;

/** Paragraph clamped to `lines` with "Xem thêm / Thu gọn". */
export const ExpandableText = ({
  text,
  lines = 3,
  moreLabel,
  lessLabel,
}: {
  text: string;
  lines?: number;
  moreLabel: string;
  lessLabel: string;
}) => {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  if (!text) {return null;}
  return (
    <View>
      <Text
        variant="body"
        tone="textSecondary"
        numberOfLines={open ? undefined : lines}
        onTextLayout={e => {
          if (!open && e.nativeEvent.lines.length > lines) {setClamped(true);}
        }}>
        {text}
      </Text>
      {/* onTextLayout reports all lines on Android; on iOS long texts are assumed clamped */}
      {clamped || text.length > 220 ? (
        <Pressable onPress={() => setOpen(o => !o)} hitSlop={8} accessibilityRole="button">
          <Text variant="label" tone="textLink" style={styles.more}>
            {open ? lessLabel : moreLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

/** One row of the info block; tappable when `url` is given. */
export const InfoRow = ({
  icon,
  label,
  value,
  url,
}: {
  icon: IconName;
  label: string;
  value?: string | null;
  url?: string;
}) => {
  if (!value) {return null;}
  const body = (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={color.textSecondary} style={styles.infoIcon} />
      <View style={styles.flex}>
        <Text variant="caption" tone="textMuted">
          {label}
        </Text>
        <Text variant="bodySmall" tone={url ? 'textLink' : 'text'}>
          {value}
        </Text>
      </View>
    </View>
  );
  return url ? (
    <Pressable
      onPress={() => Linking.openURL(url).catch(() => {})}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}>
      {body}
    </Pressable>
  ) : (
    body
  );
};

export const Card = ({children}: {children: React.ReactNode}) => (
  <View style={styles.card}>{children}</View>
);

export const normalizeUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `https://${url}`;
export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const styles = StyleSheet.create({
  flex: {flex: 1},
  section: {marginTop: space.lg},
  sectionHead: {flexDirection: 'row', alignItems: 'center', marginBottom: space.sm},
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  inline: {flexDirection: 'row', alignItems: 'center'},
  ratingText: {marginLeft: 3, marginRight: 3},
  dot: {marginHorizontal: space.xs},
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: space.sm,
    paddingVertical: space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  action: {alignItems: 'center', minWidth: 64},
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pressed: {opacity: 0.7},
  more: {marginTop: space.xxs},
  infoRow: {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: space.xs},
  infoIcon: {marginRight: space.sm, marginTop: 2},
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
});
