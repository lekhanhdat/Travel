import React from 'react';
import {StyleProp, TextStyle} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {color as tokens} from '../theme/tokens';

/**
 * Single icon set for the whole app (MaterialCommunityIcons, already shipped
 * with react-native-paper). Browse names at https://pictogrammers.com/library/mdi/
 */
export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const Icon = React.memo(
  ({name, size = 24, color, style, accessibilityLabel}: IconProps) => (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color ?? tokens.text}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  ),
);
Icon.displayName = 'Icon';

export default Icon;
