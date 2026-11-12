import React from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import {env} from '../../utils/env';
import {color, radius} from '../../theme/tokens';
import {Text} from '../../ui/Text';
import {Icon} from '../../ui/Icon';

const WIDTH = 600;
const HEIGHT = 280;

/**
 * Non-interactive map preview (D-7) from the Mapbox Static Images API: one PNG
 * request per Detail view (free up to 50 000 requests/month), no map engine, no GPS.
 * Tapping opens the full Map screen.
 */
export function staticMapUrl(lat: number, long: number, token = env.MAPBOX_ACCESS_TOKEN) {
  const pin = `pin-l+${color.primary.slice(1)}(${long},${lat})`;
  return (
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/' +
    `${pin}/${long},${lat},14.5,0/${WIDTH}x${HEIGHT}@2x?access_token=${token}`
  );
}

export const MiniMap = ({
  lat,
  long,
  label,
  onPress,
}: {
  lat: number;
  long: number;
  label: string;
  onPress: () => void;
}) => {
  if (!env.MAPBOX_ACCESS_TOKEN) {return null;}
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({pressed}) => [styles.wrap, pressed && styles.pressed]}>
      <Image
        source={{uri: staticMapUrl(lat, long)}}
        style={styles.image}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.chip}>
        <Icon name="map-search-outline" size={16} color={color.primary} />
        <Text variant="caption" tone="primary" style={styles.chipText}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: color.placeholder,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  pressed: {opacity: 0.9},
  image: {width: '100%', aspectRatio: WIDTH / HEIGHT},
  chip: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {marginLeft: 4},
});

export default MiniMap;
