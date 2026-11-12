import React from 'react';
import {Text as RNText, TextProps} from 'react-native';
import {color, type, TypeVariant} from '../theme/tokens';
import {resolveFont} from './fontResolver';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  tone?: keyof typeof color;
}

/** Text with Danavi type scale + single font family. */
export const Text = React.forwardRef<RNText, AppTextProps>(
  ({variant, tone, style, ...rest}, ref) => {
    const base = [
      variant ? type[variant] : null,
      {color: color[tone ?? 'text'], includeFontPadding: false},
      style,
    ];
    return <RNText ref={ref} {...rest} style={[base, resolveFont(base)]} />;
  },
);
Text.displayName = 'AppText';

export default Text;
