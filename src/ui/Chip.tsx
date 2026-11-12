import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {color, radius, space} from '../theme/tokens';
import {Text} from './Text';
import {Icon, IconName} from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  icon?: IconName;
  onPress?: () => void;
}

export const Chip = React.memo(({label, selected, icon, onPress}: ChipProps) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{selected: !!selected}}
    hitSlop={6}
    style={({pressed}) => [
      styles.chip,
      selected ? styles.selected : styles.idle,
      pressed && styles.pressed,
    ]}>
    <View style={styles.row}>
      {icon ? (
        <Icon
          name={icon}
          size={16}
          color={selected ? color.onPrimary : color.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text variant="label" tone={selected ? 'onPrimary' : 'textSecondary'}>
        {label}
      </Text>
    </View>
  </Pressable>
));
Chip.displayName = 'Chip';

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    paddingHorizontal: space.sm,
    borderRadius: radius.full,
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: space.xs,
  },
  idle: {backgroundColor: color.surface, borderColor: color.border},
  selected: {backgroundColor: color.primary, borderColor: color.primary},
  pressed: {opacity: 0.85},
  row: {flexDirection: 'row', alignItems: 'center'},
  icon: {marginRight: 4},
});

export default Chip;
