import {MD3LightTheme, configureFonts} from 'react-native-paper';
import {color, font} from './tokens';

const weightToFamily: Record<string, string> = {
  '400': font.regular,
  '500': font.medium,
  '600': font.semibold,
  '700': font.bold,
};

const fonts = configureFonts({
  config: Object.fromEntries(
    Object.entries(MD3LightTheme.fonts).map(([key, v]) => [
      key,
      {
        ...v,
        fontFamily: weightToFamily[String(v.fontWeight)] ?? font.regular,
        fontWeight: 'normal' as const,
        letterSpacing: 0,
      },
    ]),
  ) as any,
});

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 3,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: color.primary,
    onPrimary: color.onPrimary,
    primaryContainer: color.primaryContainer,
    onPrimaryContainer: color.primaryPressed,
    secondary: color.accent,
    secondaryContainer: color.primaryContainer,
    onSecondaryContainer: color.primaryPressed,
    background: color.surface,
    surface: color.surface,
    surfaceVariant: color.surfaceAlt,
    onSurface: color.text,
    onSurfaceVariant: color.textSecondary,
    outline: color.borderStrong,
    outlineVariant: color.border,
    error: color.error,
  },
};

export default paperTheme;
