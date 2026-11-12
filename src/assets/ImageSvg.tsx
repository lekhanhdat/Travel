/**
 * Legacy icon names. The 32 bundled SVG files were replaced by the single
 * MaterialCommunityIcons set (src/ui/Icon.tsx); these wrappers keep the old
 * `<HomeSvg width fill/color />` call sites working. New code: use <Icon name=… />.
 */
import React from 'react';
import {StyleProp, TextStyle} from 'react-native';
import {Icon, IconName} from '../ui/Icon';

type LegacyProps = {
  width?: number;
  height?: number;
  fill?: string;
  color?: string;
  style?: StyleProp<TextStyle>;
};

const make = (name: IconName, defaultSize = 24) => {
  const C = ({width, height, fill, color, style}: LegacyProps) => (
    <Icon name={name} size={width ?? height ?? defaultSize} color={fill ?? color} style={style} />
  );
  C.displayName = `Icon(${name})`;
  return C;
};

export const Add = make('plus');
export const BackSvg = make('arrow-left');
export const CalendarSearchSvg = make('calendar-search');
export const Call = make('phone-outline');
export const CameraSvg = make('camera-outline');
export const CardSvg = make('ticket-confirmation-outline');
export const ChatBotSvg = make('robot-happy-outline');
export const CircleDot = make('record-circle-outline', 10);
export const CirclePlay = make('play-circle-outline');
export const Clock = make('clock-outline');
export const ClockSvg = make('clock-outline');
export const CloseSvg = make('close');
export const DirectionsSvg = make('directions');
export const FAQ = make('help-circle-outline');
export const FireworksSvg = make('party-popper');
export const GlobeSvg = make('web');
export const HomeSvg = make('home-variant-outline');
export const Lightning = make('flash');
export const LightningOff = make('flash-off');
export const MapSvg = make('map-outline');
export const NewFeed = make('newspaper-variant-outline');
export const Next = make('chevron-right');
export const OptionsSvg = make('menu');
export const Play = make('play');
export const Policy = make('shield-check-outline');
export const ProfileSvg = make('account-circle-outline');
export const SendSvg = make('send');
export const Setting = make('cog-outline');
export const StarActive = make('star');
export const StarInActive = make('star-outline');
export const ThunderSvg = make('lightbulb-on-outline');
export const UserSvg = make('account-outline');
