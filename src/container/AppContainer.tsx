import React, {useRef} from 'react';
import {createAppContainer, createSwitchNavigator} from 'react-navigation';
import {createCompatNavigatorFactory} from '@react-navigation/compat';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useRoute} from '@react-navigation/native';
import {StyleSheet, View, Image, TouchableOpacity} from 'react-native';
import images from '../res/images';
import strings from '../res/strings';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import fonts from '../common/fonts';
import colors from '../common/colors';
import {
  HomeSvg,
  CategorySvg,
  FriendsSvg,
  LibrarySvg,
  ChartsSvg,
  TranslateSvg,
  VipSvg,
  SearchSvg,
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
import Advise from './screens/Maps/Advise';
import DetailItem from './screens/NewFeed/DetailItem';
import AllItemScreen from './screens/NewFeed/AllItemsScreen';
import SearchScreen from './screens/NewFeed/SearchScreen';
import SignUpScreen from './screens/Login/SignUpScreen';
import ForgotPasswordScreen from './screens/Login/ForgotPasswordScreen';



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
  ADVISE = 'Advise',
  DETAIL_ITEM = 'DetailItem',
  VIEW_ALL_ITEM = 'ViewAllItem',
  SEARCH_sCREEN = 'SearchScreen',
  SIGN_UP = 'SignUpScreen',
  FORGOT_PASSWORD = 'ForgotPasswordScreen',

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
          icon: <SearchSvg width={24} height={24} fill={colors.black} />,
          name: strings.search,
        };
      }
      return {
        icon: <SearchSvg width={24} height={24} />,
        name: strings.search,
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
        return strings.search;
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
          name={strings.search}
          component={SearchScreen}
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
//@ts-ignore
const AppNavigator = createCompatNavigatorFactory(createStackNavigator)(
  {
    HomeStack: {screen: HomeStack},
    LoginScreen: {screen: LoginScreen},
    ViewAllLocation: {screen: ViewAllLocation},
    DetailLocationScreen: {screen: DetailItemScreen},
    PreviewImage: {screen: PreviewImage},
    MapsScreen: {screen: MapsScreen},
    LocationImage: {screen: LocationImage},
    LocationVideo: {screen: LocationVideo},
    Personal: {screen: Personal},
    Advise: {screen: Advise},
    DetailItem: {screen: DetailItem},
    ViewAllItem: {screen: AllItemScreen},
    SearchScreen: {screen: SearchScreen},
    SignUpScreen: {screen: SignUpScreen},
    ForgotPasswordScreen: {screen: ForgotPasswordScreen},
  },
  {
    headerMode: 'none',
    initialRouteName: __DEV__
      ? ScreenName.HOME_STACK_SCREEN
      : ScreenName.HOME_STACK_SCREEN,
  },
);
const switchNavigator = createSwitchNavigator(
  {
    AppNavigator: AppNavigator,
  },
  {
    initialRouteName: 'AppNavigator',
  },
);
const AppContainer = createAppContainer(switchNavigator);
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
export default AppContainer;
