import {StyleSheet, TextStyle, StyleProp} from 'react-native';
import {font} from '../theme/tokens';

/**
 * The app uses ONE font family (Google Sans, OFL) everywhere (owner decision D-1).
 * Android ignores `fontWeight` for custom fonts and synthesises fake bold, so we
 * translate weight → the matching static file and drop `fontWeight`.
 */
const LEGACY: Record<string, string> = {
  GoogleSans_Regular: font.regular,
  GoogleSans_Medium: font.medium,
  GoogleSans_SemiBold: font.semibold,
  GoogleSans_Bold: font.bold,
};

const byWeight = (w?: TextStyle['fontWeight']): string => {
  switch (String(w ?? '400')) {
    case '500':
      return font.medium;
    case '600':
      return font.semibold;
    case '700':
    case '800':
    case '900':
    case 'bold':
      return font.bold;
    default:
      return font.regular;
  }
};

const KNOWN = new Set<string>(Object.values(font));

export function resolveFont(style: StyleProp<TextStyle>): TextStyle {
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const fam = flat.fontFamily;
  let family: string;
  if (fam && KNOWN.has(fam)) {
    family = fam;
  } else if (fam && LEGACY[fam]) {
    family = LEGACY[fam];
  } else {
    family = byWeight(flat.fontWeight);
  }
  return {fontFamily: family, fontWeight: 'normal'};
}
