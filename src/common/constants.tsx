import {useEffect, useState} from 'react';
import {AppState, AppStateStatus, Dimensions, Platform} from 'react-native';
// import StaticSafeAreaInsets from 'react-native-static-safe-area-insets';

export const API_TIME_OUT = 10000;
export const localStorageKey = {
  AUTH_TOKEN: 'AUTH_TOKEN',
  ITEM_UPLOAD: 'ITEM_UPLOAD',
  USER_LOGIN: 'USER_LOGIN',

  USERNAME: 'USERNAME',
  PASSWORD: 'PASSWORD',
  AVT: 'AVT',
};

export const CONTENT_SPACING = 15;

// const SAFE_BOTTOM =
//   Platform.select({
//     ios: StaticSafeAreaInsets.safeAreaInsetsBottom,
//   }) ?? 0;

// export const SAFE_AREA_PADDING = {
//   paddingLeft: StaticSafeAreaInsets.safeAreaInsetsLeft + CONTENT_SPACING,
//   paddingTop: StaticSafeAreaInsets.safeAreaInsetsTop + CONTENT_SPACING,
//   paddingRight: StaticSafeAreaInsets.safeAreaInsetsRight + CONTENT_SPACING,
//   paddingBottom: SAFE_BOTTOM + CONTENT_SPACING,
// };

export const SAFE_AREA_PADDING = {
  paddingLeft: 0 + CONTENT_SPACING,
  paddingTop: 0 + CONTENT_SPACING,
  paddingRight: 0 + CONTENT_SPACING,
  paddingBottom: 0 + CONTENT_SPACING,
};

// The maximum zoom _factor_ you should be able to zoom in
export const MAX_ZOOM_FACTOR = 20;

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Platform.select<number>({
  android: Dimensions.get('screen').height - 15,
  ios: Dimensions.get('window').height,
}) as number;

// Capture Button
export const CAPTURE_BUTTON_SIZE = 78;

export const useIsForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(true);

  useEffect(() => {
    const onChange = (state: AppStateStatus): void => {
      setIsForeground(state === 'active');
    };
    const listener = AppState.addEventListener('change', onChange);
    return () => listener.remove();
  }, [setIsForeground]);

  return isForeground;
};
export const TYPE_EMIT = {
  RELOAD_SUB_CATEGORY: 'RELOAD_SUB_CATEGORY',
};
export const TYPE_SCREEN = {
  ADD: 'ADD',
  EDIT: 'EDIT',
};
export enum Language {
  VIETNAMESE = 'vi',
  ENGLISH = 'en',
}


export const SPACE_WARNING = 1000;
