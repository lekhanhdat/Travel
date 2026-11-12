import FEATURE_FLAGS from '../config/featureFlags';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {TranslationProvider} from '../context/TranslationContext';
import {useTranslation} from '../hooks/useTranslation';
import {Icon, IconName} from '../ui/Icon';
import {Text} from '../ui/Text';
import {color, space} from '../theme/tokens';
// Tab roots are imported eagerly; every other screen is loaded on first use via
// `getComponent` (R-NAV1) so startup only evaluates what the first frame needs.
import HomeScreen from './screens/Home/HomeScreen';
import NewFeedScreen from './screens/NewFeed/NewFeedScreen';
import MapsScreen from './screens/Maps/MapScreen';
import CameraScreen from './screens/Camera/CameraScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
// D-2: the Festivals tab is merged into Home; FestivalsScreen, ViewAllLocation and
// ViewAllFestivals were replaced by the Home sections + screens/Discover/ViewAllScreen.
// import ForgotPasswordScreen from './screens/Login/ForgotPasswordScreen';

export enum ScreenName {
  SPLASH_SCREEN = 'SplashScreen',
  HOME_STACK_SCREEN = 'HomeStack',
  LOGIN_SCREEN = 'LoginScreen',
  VIEW_ALL_SCREEN = 'ViewAllLocation',
  DETAIL_LOCATION_SCREEN = 'DetailLocationScreen',
  PREVIEW_IMAGE_SCREEN = 'PreviewImage',
  MAP_SCREEN = 'MapsScreen',
  LOCATION_IMAGE = 'LocationImage',
  LOCATION_VIDEO = 'LocationVideo',
  PERSONAL = 'Personal',
  SETTINGS = 'Settings',
  FAQ = 'FAQ',
  POLICY = 'Policy',
  ABOUT = 'About',
  ADVISE = 'Advise',
  SEARCH_sCREEN = 'SearchScreen',
  DETAIL_FESTIVAL_SCREEN = 'DetailFestivalScreen',
  VIEW_ALL_FESTIVALS = 'ViewAllFestivals',
  SIGN_UP = 'SignUpScreen',
  FORGOT_PASSWORD = 'ForgotPasswordScreen',
  DONATION = 'Donation',
  CHATBOT = 'ChatBotScreen',
}

// Tab names as constants (used for navigation routing - do not translate)
export const TAB_NAMES = {
  HOME: 'TabHome',
  FESTIVAL: 'TabFestival',
  FEED: 'TabFeed',
  MAP: 'TabMap',
  CAMERA: 'TabCamera',
  PROFILE: 'TabProfile',
} as const;

// [inactive, active] icon per tab
const TAB_ICONS: Record<string, [IconName, IconName]> = {
  [TAB_NAMES.HOME]: ['compass-outline', 'compass'],
  [TAB_NAMES.FESTIVAL]: ['party-popper', 'party-popper'],
  [TAB_NAMES.FEED]: ['newspaper-variant-outline', 'newspaper-variant'],
  [TAB_NAMES.MAP]: ['map-outline', 'map'],
  [TAB_NAMES.CAMERA]: ['camera-outline', 'camera'],
  [TAB_NAMES.PROFILE]: ['account-circle-outline', 'account-circle'],
};

// Translation keys for tab labels
const TAB_TRANSLATION_KEYS = {
  [TAB_NAMES.HOME]: 'navigation.home',
  [TAB_NAMES.FESTIVAL]: 'navigation.festivals',
  [TAB_NAMES.FEED]: 'navigation.feed',
  [TAB_NAMES.MAP]: 'navigation.map',
  [TAB_NAMES.CAMERA]: 'navigation.camera',
  [TAB_NAMES.PROFILE]: 'navigation.profile',
} as const;

function MyTabBar({state, navigation}: {state: any; navigation: any}) {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const getTabLabel = (tabName: string) => {
    const translationKey =
      TAB_TRANSLATION_KEYS[tabName as keyof typeof TAB_TRANSLATION_KEYS];
    return translationKey ? t(translationKey) : tabName;
  };

  return (
    <View
      style={[
        styles.containerTab,
        {paddingBottom: Math.max(insets.bottom, space.xxs)},
      ]}>
      {state.routes.map((item: any, index: number) => {
        const isFocused = state.index === index;
        const label = getTabLabel(item.name);
        const [idle, active] = TAB_ICONS[item.name] ?? [
          'circle-outline',
          'circle',
        ];
        const tint = isFocused ? color.primary : color.textMuted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: item.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(item.name);
          }
        };
        const onLongPress = () => {
          navigation.emit({type: 'tabLongPress', target: item.key});
        };
        return (
          <Pressable
            key={item.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{selected: isFocused}}
            style={styles.containerTouch}>
            {/* Keyed per state: on Android (legacy arch) changing only the background of a
                rounded view can drop its corner radius, leaving a square highlight. */}
            <View key={isFocused ? 'on' : 'off'} style={[styles.pill, isFocused && styles.pillActive]}>
              <Icon name={isFocused ? active : idle} size={24} color={tint} />
            </View>
            <Text
              variant="caption"
              numberOfLines={1}
              style={[styles.title, {color: tint}]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const renderTabBar = (props: any) => <MyTabBar {...props} />;

const Tabs = createBottomTabNavigator();
function HomeStack() {
  // Previously the navigator was remounted with key={getRouterFromProp()} (route param
  // tabIndex). Nothing navigates with tabIndex any more and the remount lost every
  // tab's state, so it is gone (R-NAV2).
  return (
    <View style={styles.container}>
      <Tabs.Navigator
        initialRouteName={TAB_NAMES.HOME}
        screenOptions={{headerShown: false}}
        tabBar={renderTabBar}>
        <Tabs.Screen name={TAB_NAMES.HOME} component={HomeScreen} />
        {/* D-2: Festivals tab merged into Home (mixed sections + filter chips).
        <Tabs.Screen name={TAB_NAMES.FESTIVAL} component={FestivalsScreen} />
        */}
        {/* P7: Feed restored (reviews via BE; writing needs an account). */}
        {FEATURE_FLAGS.ENABLE_FEED && (
          <Tabs.Screen name={TAB_NAMES.FEED} component={NewFeedScreen} />
        )}
        {/* P4: Map restored. */}
        <Tabs.Screen name={TAB_NAMES.MAP} component={MapsScreen} />
        {/* P8: Camera restored (POST /detect; recognising needs an account). */}
        {FEATURE_FLAGS.ENABLE_CAMERA && (
          <Tabs.Screen name={TAB_NAMES.CAMERA} component={CameraScreen} />
        )}
        {/* P6: Profile restored (guest sees Settings/FAQ/Policy/About + Login). */}
        <Tabs.Screen name={TAB_NAMES.PROFILE} component={ProfileScreen} />
      </Tabs.Navigator>
    </View>
  );
}

const Stack = createStackNavigator();
const lazy = (load: () => any) => () => load().default;

function AppContainer() {
  return (
    <Stack.Navigator
      initialRouteName={ScreenName.HOME_STACK_SCREEN}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeStack" component={HomeStack} />
      {/* P6: restored. */}
      <Stack.Screen
        name="LoginScreen"
        getComponent={lazy(() => require('./screens/Login/LoginScreen'))}
      />
      {/* D-2: one list for places + festivals; both legacy route names open it. */}
      <Stack.Screen
        name="ViewAllLocation"
        getComponent={lazy(() => require('./screens/Discover/ViewAllScreen'))}
      />
      <Stack.Screen
        name="ViewAllFestivals"
        getComponent={lazy(() => require('./screens/Discover/ViewAllScreen'))}
      />
      <Stack.Screen
        name="DetailLocationScreen"
        getComponent={lazy(() => require('./screens/Home/DetailLocation'))}
      />
      {/* P8: restored with Camera. */}
      <Stack.Screen
        name="PreviewImage"
        getComponent={lazy(() => require('./screens/Camera/PreviewImage'))}
      />
      {/* P4: Map restored. */}
      <Stack.Screen name="MapsScreen" component={MapsScreen} />
      <Stack.Screen
        name="LocationImage"
        getComponent={lazy(() => require('./screens/Home/LocationImage'))}
      />
      <Stack.Screen
        name="LocationVideo"
        getComponent={lazy(() => require('./screens/Home/LocationVideo'))}
      />
      {/* P6: restored. */}
      <Stack.Screen
        name="Personal"
        getComponent={lazy(() => require('./screens/Profile/Personal'))}
      />
      <Stack.Screen
        name="Settings"
        getComponent={lazy(() => require('./screens/Profile/Settings'))}
      />
      <Stack.Screen
        name="FAQ"
        getComponent={lazy(() => require('./screens/Profile/FAQ'))}
      />
      <Stack.Screen
        name="Policy"
        getComponent={lazy(() => require('./screens/Profile/Policy'))}
      />
      <Stack.Screen
        name="About"
        getComponent={lazy(() => require('./screens/Profile/About'))}
      />
      {/* P4: restored with Map (popup button). */}
      <Stack.Screen
        name="Advise"
        getComponent={lazy(() => require('./screens/Maps/Advise'))}
      />
      {/* Unused route, Festivals merged into Home (D-2):
      <Stack.Screen name="SearchScreen" component={FestivalsScreen} />
      */}
      <Stack.Screen
        name="DetailFestivalScreen"
        getComponent={lazy(() => require('./screens/Festival/DetailFestival'))}
      />
      {/* P6: restored. */}
      <Stack.Screen
        name="SignUpScreen"
        getComponent={lazy(() => require('./screens/Login/SignUpScreen'))}
      />
      {/* P1: Temporarily disabled; retain for restoration. Debt N1 (email module off).
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      */}
      {FEATURE_FLAGS.ENABLE_PAYMENT && (
        <Stack.Screen
          name={ScreenName.DONATION}
          getComponent={lazy(() => require('./screens/Profile/Donation'))}
        />
      )}
      {/* P9: restored (RAG chat on the BE; needs an account). */}
      <Stack.Screen
        name="ChatBotScreen"
        getComponent={lazy(() => require('./screens/Profile/ChatbotScreen'))}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  containerTouch: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    paddingTop: space.xxs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {backgroundColor: color.primaryContainer},
  title: {
    textAlign: 'center',
    marginTop: 2,
  },
});
// Wrap AppContainer with TranslationProvider (replaces LanguageProvider)
const AppWithTranslation = () => {
  return (
    <TranslationProvider>
      <AppContainer />
    </TranslationProvider>
  );
};

export default AppWithTranslation;
