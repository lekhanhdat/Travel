import React, {useRef} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useRoute} from '@react-navigation/native';
import {StyleSheet, View, Image, TouchableOpacity} from 'react-native';
import {LanguageProvider} from '../i18n';
import images from '../res/images';
import strings from '../res/strings';
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
import LoginScreen from './screens/Login/LoginScreen';
import HomeScreen from './screens/Home/HomeScreen';
import NewFeedScreen from './screens/NewFeed/NewFeedScreen';
import MapsScreen from './screens/Maps/MapScreenV2';
import CameraScreen from './screens/Camera/CameraScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import ViewAllLocation from './screens/Home/ViewAllLocation';
import DetailItemScreen from './screens/Home/DetailLocation';
import PreviewImage from './screens/Camera/PreviewImage';
import LocationImage from './screens/Home/LocationImage';
import LocationVideo from './screens/Home/LocationVideo';
import Personal from './screens/Profile/Personal';
import Settings from './screens/Profile/Settings';
import FAQ from './screens/Profile/FAQ';
import Policy from './screens/Profile/Policy';
import About from './screens/Profile/About';
import Advise from './screens/Maps/Advise';
import DetailItem from './screens/NewFeed/DetailItem';
import AllItemScreen from './screens/NewFeed/AllItemsScreen';
import FestivalsScreen from './screens/Festival/FestivalsScreen';
import DetailFestivalScreen from './screens/Festival/DetailFestival';
import ViewAllFestivals from './screens/Festival/ViewAllFestivals';
import SignUpScreen from './screens/Login/SignUpScreen';
import ForgotPasswordScreen from './screens/Login/ForgotPasswordScreen';
import Donation from './screens/Profile/Donation';
import ChatBotScreen from './screens/Profile/ChatbotScreen';

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
  let refScroll = useRef(null);

  if (refScroll.current) {
    //@ts-ignore
    refScroll.current.scrollToIndex({index: state.index});
  }
  return (
    <View style={[styles.containerTab, {}]}>
      {state.routes.map((item: any, index: number) => {
        const label = item.name;
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
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.containerTouch]}>
            {getSourceWithIndex(index, isFocused).icon}
            <TextBase
              style={[
                styles.title,
                {color: isFocused ? colors.black : colors.xam},
              ]}>
              {getSourceWithIndex(index, isFocused).name}
            </TextBase>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
function getSourceWithIndex(key: number, isFocused: boolean) {
  switch (key) {
    case 0:
      if (isFocused) {
        return {
          icon: <HomeSvg width={24} height={24} fill={colors.black} />,
          name: strings.home_page,
        };
      }
      return {
        icon: <HomeSvg width={24} height={24} />,
        name: strings.home_page,
      };
    case 1:
      if (isFocused) {
        return {
          icon: <FireworksSvg width={24} height={24} fill={colors.black} />,
          name: strings.festival,
        };
      }
      return {
        icon: <FireworksSvg width={24} height={24} />,
        name: strings.festival,
      };
    case 2:
      if (isFocused) {
        return {
          icon: <NewFeed width={24} height={24} fill={colors.black} />,
          name: strings.new_feed,
        };
      }
      return {
        icon: <NewFeed width={24} height={24} />,
        name: strings.new_feed,
      };
    case 3:
      if (isFocused) {
        return {
          icon: <MapSvg width={24} height={24} fill={colors.black} />,
          name: strings.map,
        };
      }
      return {
        icon: <MapSvg width={24} height={24} fill={'#DDDDDD'} />,
        name: strings.map,
      };
    case 4:
      if (isFocused) {
        return {
          icon: <CameraSvg width={24} height={24} fill={colors.black} />,
          name: strings.camera,
        };
      }
      return {
        icon: <CameraSvg width={24} height={24} />,
        name: strings.camera,
      };
    case 5:
      if (isFocused) {
        return {
          icon: <ProfileSvg width={24} height={24} fill={colors.black} />,
          name: strings.profile,
        };
      }
      return {
        icon: <ProfileSvg width={24} height={24} />,
        name: strings.profile,
      };
    default:
      if (isFocused) {
        return {
          icon: <HomeSvg width={24} height={24} fill={colors.black} />,
          name: strings.home_page,
        };
      }
      return {
        icon: <HomeSvg width={24} height={24} />,
        name: strings.home_page,
      };
  }
}
const Tabs = createBottomTabNavigator();
function HomeStack() {
  const route = useRoute();
  //@ts-ignore
  const tabIndex = route.params?.tabIndex ?? 0;
  const getRouterFromProp = () => {
    switch (Number(tabIndex)) {
      case 0: {
        return strings.home_page;
      }
      case 1: {
        return strings.festival;
      }
      case 2: {
        return strings.new_feed;
      }
      case 3: {
        return strings.map;
      }
      case 4: {
        return strings.camera;
      }
      case 5: {
        return strings.profile;
      }
      default: {
        return strings.home_page;
      }
    }
  };
  return (
    <View style={styles.container}>
      <Tabs.Navigator
        key={getRouterFromProp()}
        initialRouteName={strings.home_page}
        screenOptions={{
          headerShown: false,
        }}
        tabBar={props => (
          <MyTabBar _descriptors={undefined} _position={undefined} {...props} />
        )}>
        <Tabs.Screen
          name={strings.home_page}
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
          name={strings.festival}
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
        <Tabs.Screen
          name={strings.new_feed}
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
        <Tabs.Screen
          name={strings.map}
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
        <Tabs.Screen
          name={strings.camera}
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
        <Tabs.Screen
          name={strings.profile}
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
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ViewAllLocation" component={ViewAllLocation} />
      <Stack.Screen name="DetailLocationScreen" component={DetailItemScreen} />
      <Stack.Screen name="PreviewImage" component={PreviewImage} />
      <Stack.Screen name="MapsScreen" component={MapsScreen} />
      <Stack.Screen name="LocationImage" component={LocationImage} />
      <Stack.Screen name="LocationVideo" component={LocationVideo} />
      <Stack.Screen name="Personal" component={Personal} />
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="FAQ" component={FAQ} />
      <Stack.Screen name="Policy" component={Policy} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="Advise" component={Advise} />
      <Stack.Screen name="DetailItem" component={DetailItem} />
      <Stack.Screen name="ViewAllItem" component={AllItemScreen} />
      <Stack.Screen name="SearchScreen" component={FestivalsScreen} />
      <Stack.Screen
        name="DetailFestivalScreen"
        component={DetailFestivalScreen}
      />
      <Stack.Screen name="ViewAllFestivals" component={ViewAllFestivals} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
      <Stack.Screen name="Donation" component={Donation} />
      <Stack.Screen name="ChatBotScreen" component={ChatBotScreen} />
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
    width: sizes.width / 6,
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
// Wrap AppContainer with LanguageProvider
const AppWithLanguage = () => (
  <LanguageProvider>
    <AppContainer />
  </LanguageProvider>
);

export default AppWithLanguage;
