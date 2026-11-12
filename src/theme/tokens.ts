/**
 * Danavi Coast design tokens (REDESIGN_PLAN §3.1).
 * Single source of truth for colour, type, spacing, radius and elevation.
 * Legacy `common/colors.tsx` and `common/fonts.tsx` map onto these values.
 */
import {Platform, TextStyle, ViewStyle} from 'react-native';

export const palette = {
  blue50: '#EEF5FF',
  blue100: '#E3F0FF',
  blue200: '#BFDCFF',
  blue300: '#8EC2FF',
  blue400: '#4A9BF0',
  blue500: '#1E7BE0',
  blue600: '#1565C0', // logo blue
  blue700: '#0F4A8E',
  blue800: '#0D3C73',
  blue900: '#0B2F5A',
  orange500: '#F97350',
  orange100: '#FFE9E2',
  slate900: '#0F172A',
  slate600: '#475569',
  slate500: '#64748B',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F5F7FA',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const color = {
  primary: palette.blue600,
  primaryPressed: palette.blue700,
  primaryContainer: palette.blue100,
  onPrimary: palette.white,
  accent: palette.orange500,
  accentContainer: palette.orange100,
  accentText: '#B4441F',
  onAccent: palette.white,
  surface: palette.white,
  surfaceAlt: palette.slate50,
  background: palette.slate50,
  text: palette.slate900,
  textSecondary: palette.slate600,
  textMuted: palette.slate500,
  textLink: palette.blue600,
  border: palette.slate200,
  borderStrong: palette.slate300,
  placeholder: palette.slate100,
  scrim: 'rgba(15,23,42,0.55)',
  success: '#16A34A',
  warning: '#D97706',
  warningContainer: '#FFF7E6',
  error: '#DC2626',
  star: '#F5A524',
} as const;

export const font = {
  regular: 'GoogleSans-Regular',
  medium: 'GoogleSans-Medium',
  semibold: 'GoogleSans-SemiBold',
  bold: 'GoogleSans-Bold',
} as const;

export type TypeVariant =
  | 'display'
  | 'title'
  | 'headline'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'caption';

export const type: Record<TypeVariant, TextStyle> = {
  display: {fontFamily: font.bold, fontSize: 28, lineHeight: 34},
  title: {fontFamily: font.bold, fontSize: 22, lineHeight: 28},
  headline: {fontFamily: font.semibold, fontSize: 18, lineHeight: 24},
  body: {fontFamily: font.regular, fontSize: 16, lineHeight: 24},
  bodySmall: {fontFamily: font.regular, fontSize: 14, lineHeight: 20},
  label: {fontFamily: font.medium, fontSize: 14, lineHeight: 20},
  caption: {fontFamily: font.medium, fontSize: 12, lineHeight: 16},
};

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  page: 16,
  section: 24,
} as const;

export const radius = {sm: 8, md: 12, lg: 16, full: 999} as const;

const shadow = (elevation: number, opacity: number, r: number): ViewStyle =>
  Platform.select<ViewStyle>({
    android: {elevation},
    default: {
      shadowColor: palette.slate900,
      shadowOpacity: opacity,
      shadowRadius: r,
      shadowOffset: {width: 0, height: Math.ceil(r / 2)},
    },
  }) as ViewStyle;

export const elevation = {
  card: shadow(2, 0.08, 6),
  floating: shadow(6, 0.14, 12),
} as const;

export const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};
export const minTouch = 48;

const tokens = {palette, color, font, type, space, radius, elevation};
export default tokens;
