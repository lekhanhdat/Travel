import FEATURE_FLAGS from '../config/featureFlags';
import React, {useRef, useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useRoute} from '@react-navigation/native';
import {StyleSheet, View, Image, TouchableOpacity} from 'react-native';
import {TranslationProvider} from '../context/TranslationContext';
import {useTranslation} from '../hooks/useTranslation';
import {offlineFallback} from '../services/translation';
import images from '../res/images';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import fonts from '../common/fonts';
import colors from '../common/colors';
import {
  HomeSvg,
  FireworksSvg,
  NewFeed,
  MapSvg,
  CameraSvg,
  ProfileSvg,
} from '../assets/ImageSvg';
// P1: Keep deferred imports commented to avoid native/service initialization.
import LoginScreen from './screens/Login/LoginScreen';
import HomeScreen from './screens/Home/HomeScreen';
import NewFeedScreen from './screens/NewFeed/NewFeedScreen';
import MapsScreen from './screens/Maps/MapScreenV2';
// import CameraScreen from './screens/Camera/CameraScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import ViewAllLocation from './screens/Home/ViewAllLocation';
import DetailItemScreen from './screens/Home/DetailLocation';
// import PreviewImage from './screens/Camera/PreviewImage';
import LocationImage from './screens/Home/LocationImage';
import LocationVideo from './screens/Home/LocationVideo';
import Personal from './screens/Profile/Personal';
import Settings from './screens/Profile/Settings';
import FAQ from './screens/Profile/FAQ';
import Policy from './screens/Profile/Policy';
import About from './screens/Profile/About';
import Advise from './screens/Maps/Advise';
// import DetailItem from './screens/NewFeed/DetailItem';
// import AllItemScreen from './screens/NewFeed/AllItemsScreen';
import FestivalsScreen from './screens/Festival/FestivalsScreen';
import DetailFestivalScreen from './screens/Festival/DetailFestival';
import ViewAllFestivals from './screens/Festival/ViewAllFestivals';
import SignUpScreen from './screens/Login/SignUpScreen';
// import ForgotPasswordScreen from './screens/Login/ForgotPasswordScreen';
// import Donation from './screens/Profile/Donation';
// import ChatBotScreen from './screens/Profile/ChatbotScreen';

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
  DETAIL_ITEM = 'DetailItem',
  VIEW_ALL_ITEM = 'ViewAllItem',
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

// Fixed icon order for getTabIcon, independent of which tabs are currently enabled
const TAB_ORDER: string[] = [
  TAB_NAMES.HOME, TAB_NAMES.FESTIVAL, TAB_NAMES.FEED, TAB_NAMES.MAP, TAB_NAMES.CAMERA, TAB_NAMES.PROFILE,
];

// Translation keys for tab labels
const TAB_TRANSLATION_KEYS = {
  [TAB_NAMES.HOME]: 'navigation.home',
  [TAB_NAMES.FESTIVAL]: 'navigation.festivals',
  [TAB_NAMES.FEED]: 'navigation.feed',
  [TAB_NAMES.MAP]: 'navigation.map',
  [TAB_NAMES.CAMERA]: 'navigation.camera',
  [TAB_NAMES.PROFILE]: 'navigation.profile',
} as const;
function MyTabBar({
  state,
  _descriptors,
  navigation,
  _position,
}: {
  state: any;
  _descriptors: any;
  navigation: any;
  _position: any;
}) {
  const {t} = useTranslation();
  let refScroll = useRef(null);

  if (refScroll.current) {
    //@ts-ignore
    refScroll.current.scrollToIndex({index: state.index});
  }

  // Get icon for tab index
  // Active tab: dark color (colors.black)
  // Inactive tab: light/muted color (colors.xam)
  const getTabIcon = (index: number, isFocused: boolean) => {
    const iconColor = isFocused ? colors.black : colors.xam;
    switch (index) {
      case 0:
        return <HomeSvg width={24} height={24} fill={iconColor} />;
      case 1:
        return <FireworksSvg width={24} height={24} fill={iconColor} />;
      case 2:
        return <NewFeed width={24} height={24} fill={iconColor} />;
      case 3:
        return <MapSvg width={24} height={24} fill={iconColor} />;
      case 4:
        return <CameraSvg width={24} height={24} fill={iconColor} />;
      case 5:
        return <ProfileSvg width={24} height={24} fill={iconColor} />;
      default:
        return <HomeSvg width={24} height={24} fill={iconColor} />;
    }
  };

  // Get translated label for tab
  const getTabLabel = (tabName: string) => {
    const translationKey = TAB_TRANSLATION_KEYS[tabName as keyof typeof TAB_TRANSLATION_KEYS];
    return translationKey ? t(translationKey) : tabName;
  };

  return (
    <View style={[styles.containerTab, {}]}>
      {state.routes.map((item: any, index: number) => {
        const isFocused = state.index === index;

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
          navigation.emit({
            type: 'tabLongPress',
            target: item.key,
          });
        };
        return (
          <TouchableOpacity
            key={item.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.containerTouch]}>
            {getTabIcon(TAB_ORDER.indexOf(item.name), isFocused)}
            <TextBase
              style={[
                styles.title,
                {color: isFocused ? colors.black : colors.xam},
              ]}>
              {getTabLabel(item.name)}
            </TextBase>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const Tabs = createBottomTabNavigator();
function HomeStack() {
  const route = useRoute();
  //@ts-ignore
  const tabIndex = route.params?.tabIndex ?? 0;
  const getRouterFromProp = () => {
    switch (Number(tabIndex)) {
      case 0:
        return TAB_NAMES.HOME;
      case 1:
        return TAB_NAMES.FESTIVAL;
      case 2:
        return TAB_NAMES.FEED;
      case 3:
        return TAB_NAMES.MAP;
      case 4:
        return TAB_NAMES.CAMERA;
      case 5:
        return TAB_NAMES.PROFILE;
      default:
        return TAB_NAMES.HOME;
    }
  };
  return (
    <View style={styles.container}>
      <Tabs.Navigator
        key={getRouterFromProp()}
        initialRouteName={TAB_NAMES.HOME}
        screenOptions={{
          headerShown: false,
        }}
        tabBar={props => (
          <MyTabBar _descriptors={undefined} _position={undefined} {...props} />
        )}>
        <Tabs.Screen
          name={TAB_NAMES.HOME}
          component={HomeScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <Image
                source={
                  focused
                    ? images.tab_add_friends_focus
                    : images.tab_add_friends
                }
              />
            ),
          }}
        />
        <Tabs.Screen
          name={TAB_NAMES.FESTIVAL}
          component={FestivalsScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <View>
                <Image
                  source={
                    focused
                      ? images.tab_add_friends_focus
                      : images.tab_add_friends
                  }
                />
              </View>
            ),
          }}
        />
        {/* P7: Feed restored (reviews via BE; writing needs an account). */}
        {FEATURE_FLAGS.ENABLE_FEED && (
        <Tabs.Screen
          name={TAB_NAMES.FEED}
          component={NewFeedScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <View>
                <Image
                  source={
                    focused ? images.tab_add_friends : images.tab_add_friends
                  }
                />
              </View>
            ),
          }}
        />
        )}
        {/* P4: Map restored. */}
        <Tabs.Screen
          name={TAB_NAMES.MAP}
          component={MapsScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <Image
                source={
                  focused ? images.tab_add_friends : images.tab_add_friends
                }
              />
            ),
          }}
        />
        {/* P1: Temporarily disabled; retain for restoration.
        <Tabs.Screen
          name={TAB_NAMES.CAMERA}
          component={CameraScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <Image
                source={
                  focused ? images.tab_add_friends : images.tab_add_friends
                }
              />
            ),
          }}
        />
        */}
        {/* P6: Profile restored (guest sees Settings/FAQ/Policy/About + Login). */}
        <Tabs.Screen
          name={TAB_NAMES.PROFILE}
          component={ProfileScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <Image
                source={
                  focused ? images.tab_add_friends : images.tab_add_friends
                }
              />
            ),
          }}
        />
      </Tabs.Navigator>
    </View>
  );
}

const Stack = createStackNavigator();

function AppContainer() {
  return (
    <Stack.Navigator
      initialRouteName={ScreenName.HOME_STACK_SCREEN}
      screenOptions={{headerShown: false}}>
      <Stack.Screen name="HomeStack" component={HomeStack} />
      {/* P6: restored. */}
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ViewAllLocation" component={ViewAllLocation} />
      <Stack.Screen name="DetailLocationScreen" component={DetailItemScreen} />
      {/* P1: Temporarily disabled; retain for restoration.
      <Stack.Screen name="PreviewImage" component={PreviewImage} />
      */}
      {/* P4: Map restored. */}
      <Stack.Screen name="MapsScreen" component={MapsScreen} />
      <Stack.Screen name="LocationImage" component={LocationImage} />
      <Stack.Screen name="LocationVideo" component={LocationVideo} />
      {/* P6: restored. */}
      <Stack.Screen name="Personal" component={Personal} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="FAQ" component={FAQ} />
      <Stack.Screen name="Policy" component={Policy} />
      <Stack.Screen name="About" component={About} />
      {/* P4: restored with Map (popup button). */}
      <Stack.Screen name="Advise" component={Advise} />
      {/* P1: Temporarily disabled; retain for restoration.
      <Stack.Screen name="DetailItem" component={DetailItem} />
      */}
      {/* P1: Temporarily disabled; retain for restoration.
      <Stack.Screen name="ViewAllItem" component={AllItemScreen} />
      */}
      <Stack.Screen name="SearchScreen" component={FestivalsScreen} />
      <Stack.Screen
        name="DetailFestivalScreen"
        component={DetailFestivalScreen}
      />
      <Stack.Screen name="ViewAllFestivals" component={ViewAllFestivals} />
      {/* P6: restored. */}
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      {/* P1: Temporarily disabled; retain for restoration. Debt N1 (email module off).
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      */}
      {/* P1: Temporarily disabled; retain for restoration.
      <Stack.Screen name="Donation" component={Donation} />
      */}
      {/* P1: Temporarily disabled; retain for restoration.
      <Stack.Screen name="ChatBotScreen" component={ChatBotScreen} />
      */}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  txtLabel: {
    fontSize: sizes._12sdp,
    fontFamily: fonts.GoogleSans_Regular,
  },
  containerTouch: {
    flex: 1,
    height: sizes._49sdp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerTab: {
    width: sizes.width,
    height: sizes._64sdp,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,

    elevation: 11,
  },
  imageTab: {
    width: sizes._24sdp,
    height: sizes._24sdp,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
    fontSize: sizes._14sdp,
    fontFamily: fonts.GoogleSans_Regular,
    marginTop: sizes._4sdp,
  },
});
// Wrap AppContainer with TranslationProvider (replaces LanguageProvider)
const AppWithTranslation = () => {
  useEffect(() => {
    // Initialize offline fallback translations
    if (FEATURE_FLAGS.ENABLE_OFFLINE_CACHE) {
      offlineFallback.initialize('vi');
    }
  }, []);

  return (
    <TranslationProvider>
      <AppContainer />
    </TranslationProvider>
  );
};

export default AppWithTranslation;
