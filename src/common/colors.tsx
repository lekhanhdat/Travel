/**
 * Legacy colour names, now mapped onto the Danavi Coast tokens (src/theme/tokens.ts).
 * Previous mint-green values are kept below as a comment for reference.
 * New code should import `color` from `src/theme/tokens` instead.
 */
import {color, palette} from '../theme/tokens';

const colors = {
  black: palette.black,
  white: palette.white,
  transparent: 'transparent',
  xam: palette.slate200,
  nen: palette.slate900,
  gray: palette.slate500,
  red: color.error,
  primary_25: palette.blue50,
  primary_50: palette.blue50,
  primary_100: palette.blue100,
  primary_200: palette.blue200,
  primary_300: palette.blue300,
  // used mostly as accent text colour → must keep ≥4.5:1 on white
  primary_400: '#1E6FC2',
  primary: color.primary,
  primary_500: color.primary,
  primary_600: palette.blue700,
  primary_700: palette.blue800,
  primary_800: palette.blue800,
  primary_900: palette.blue900,
  // used as the main dark text colour
  primary_950: color.text,
  background: color.background,
  accent: color.accent,
  textMuted: color.textMuted,
  border: color.border,
  E25039: color.accent,
  F9F9F9: palette.slate50,
  E6E8EC: palette.slate200,
  AFAFAF: palette.slate500,
};
// Previous palette (mint green, replaced by D-3):
// xam '#E6E4E6', nen '#111c10', primary_50 '#f1fcf5', primary_100 '#defaea',
// primary_200 '#bef4d4', primary_300 '#8beab3', primary_400 '#52d689', primary '#2ecc71',
// primary_600 '#1d9c53', primary_700 '#1b7a43', primary_800 '#1a6139', primary_900 '#175031',
// primary_950 '#072c18', background '#f7f7f8'
export default colors;
