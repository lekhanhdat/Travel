import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {color, minTouch, space} from '../theme/tokens';
import {Text} from './Text';
import {Icon, IconName} from './Icon';
import NavigationService from '../container/screens/NavigationService';

export interface HeaderAction {
  icon: IconName;
  label: string;
  onPress: () => void;
}

interface Props {
  title?: string;
  onBack?: (() => void) | null; // null hides the back button
  actions?: HeaderAction[];
  transparent?: boolean;
}

export const IconButton = ({
  icon,
  label,
  onPress,
  tint = color.text,
  filled,
}: HeaderAction & {tint?: string; filled?: boolean}) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    hitSlop={4}
    style={({pressed}) => [
      styles.iconBtn,
      filled && styles.iconBtnFilled,
      pressed && styles.pressed,
    ]}>
    <Icon name={icon} size={24} color={tint} />
  </Pressable>
);

export const AppHeader = ({title, onBack, actions, transparent}: Props) => {
  const {t} = useTranslation('common');
  const back = onBack === undefined ? () => NavigationService.pop() : onBack;
  return (
    <View style={[styles.bar, transparent ? styles.transparent : styles.solid]}>
      {back ? (
        <IconButton
          icon="arrow-left"
          label={t('buttons.back')}
          onPress={back}
          filled={transparent}
        />
      ) : (
        <View style={styles.spacer} />
      )}
      <Text variant="headline" numberOfLines={1} style={styles.title} accessibilityRole="header">
        {transparent ? '' : title ?? ''}
      </Text>
      {(actions ?? []).map(a => (
        <IconButton key={a.label} {...a} filled={transparent} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xxs,
  },
  solid: {
    backgroundColor: color.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  transparent: {backgroundColor: 'transparent'},
  title: {flex: 1, marginHorizontal: space.xxs},
  spacer: {width: space.sm},
  iconBtn: {
    width: minTouch,
    height: minTouch,
    borderRadius: minTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnFilled: {backgroundColor: 'rgba(255,255,255,0.92)', width: 40, height: 40, margin: 4},
  pressed: {opacity: 0.7},
});

export default AppHeader;
