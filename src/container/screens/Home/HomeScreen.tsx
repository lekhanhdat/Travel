import React from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {Button, Card, Searchbar, TextInput} from 'react-native-paper';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import {ILocation, IAccount} from '../../../common/types';
import BigItemLocation from '../../../component/BigItemLocation';
import {
  LOCATION_NEARLY,
  LOCATION_POPULAR,
} from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import _, {size} from 'lodash';
import images from '../../../res/images';
import {Text} from 'react-native-paper';
import {Image} from 'react-native-svg';
import locationApi from '../../../services/locations.api';
import fonts from '../../../common/fonts';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {withTranslation, WithTranslationProps} from '../../../i18n/withTranslation';
import LanguageDropdown from '../../../component/LanguageDropdown';
import Geolocation from '@react-native-community/geolocation';

interface IHomeScreenProps extends WithTranslationProps {
  navigation: any;
}

interface IHomeScreenState {
  valueSearch: string;
  locations: ILocation[];
  locationsPopular: ILocation[];
  locationsNearly: ILocation[];
  account: IAccount | null;
  currentLat: number;
  currentLong: number;
  locationPermission: boolean;
}

class HomeScreen extends React.PureComponent<
  IHomeScreenProps,
  IHomeScreenState
> {
  refInput: any;
  constructor(props: IHomeScreenProps) {
    super(props);
    this.state = {
      valueSearch: '',
      locations: [],
      locationsNearly: [],
      locationsPopular: [],
      account: null,
      currentLat: 15.974620784990472, 
      currentLong: 108.25290513035998,
      locationPermission: false,
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        valueSearch: '',
      });
    });

    this.requestLocationPermission();
    this.fetchLocations();
    this.handleGetUser();
  }

  handleGetUser = async () => {
    const response: IAccount = await LocalStorageCommon.getItem(
      localStorageKey.AVT,
    );
    this.setState({
      account: response,
    });
  };

  // Request location permission
  requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby places.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          this.setState({locationPermission: true});
          this.getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      // iOS
      this.setState({locationPermission: true});
      this.getCurrentLocation();
    }
  };

  // Get current GPS location
  getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        this.setState({
          currentLat: latitude,
          currentLong: longitude,
        });
        console.log('📍 Current location:', latitude, longitude);
        // Re-fetch locations to sort by distance
        this.fetchLocations();
      },
      (error) => {
        console.log('❌ Error getting location:', error);
        // Use default Đà Nẵng coordinates
        this.fetchLocations();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  async fetchLocations() {
    const data = await locationApi.getLocations();

    // Calculate distance for each location
    const locationsWithDistance = data.map(location => ({
      ...location,
      distance: this.calculateDistance(
        this.state.currentLat,
        this.state.currentLong,
        location.lat,
        location.long,
      ),
    }));

    // Sort by distance (nearest first)
    const sortedByDistance = [...locationsWithDistance].sort((a, b) => a.distance - b.distance);

    // Get top 10 nearest locations
    const nearestLocations = sortedByDistance.slice(0, 10);

    // Get popular locations (first 10 from original data)
    const popularLocations = data.slice(0, 10);

    this.setState({
      locations: data,
      locationsNearly: nearestLocations,
      locationsPopular: popularLocations,
    });

    console.log('🎯 Nearest location:', nearestLocations[0]?.name, nearestLocations[0]?.distance?.toFixed(2), 'km');
  }

  renderItemHorizontal = ({item, index}: {item: ILocation; index: number}) => {
    return <BigItemLocation location={item} />;
  };

  renderItemLarge = ({item, index}: {item: ILocation; index: number}) => {
    return <LargeItemLocation location={item} />;
  };

  handleSearch = (isViewAll: boolean, locations: ILocation[]) => {
    NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
      title: isViewAll ? 'Xem tất cả' : 'Tìm kiếm',
      locations: locations,
      valueSearch: this.state.valueSearch,
    });
  };

  render(): React.ReactNode {
    return (
      <Page style={{backgroundColor: colors.background}}>
        {/* <HeaderBase hideLeftIcon title={strings.home_page} /> */}

        <View style={styles.headerContainer}>
          <TextBase
            style={[
              AppStyle.txt_18_bold,
              {
                marginTop: sizes._36sdp,
                marginLeft: sizes._16sdp,
                color: colors.black,
                flex: 1,
              },
            ]}>
            {this.props.t('home.greeting')}{this.state.account?.fullName ? `, ${this.state.account.fullName}` : ''}
          </TextBase>
          <View style={styles.languageDropdownContainer}>
            <LanguageDropdown compact={true} showFlag={true} showNativeName={false} />
          </View>
        </View>
        <TextBase
          style={[
            AppStyle.txt_20_bold,
            {
              marginTop: sizes._6sdp,
              marginLeft: sizes._16sdp,
              color: colors.black,
            },
          ]}>
          Chúc bạn có những trải nghiệm tuyệt vời
        </TextBase>
        <TextBase
          style={[
            AppStyle.txt_20_bold,
            {
              marginLeft: sizes._16sdp,
              marginBottom: sizes._8sdp,
              color: colors.black,
            },
          ]}>
          tại Đà Nẵng!
        </TextBase>

        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginVertical: sizes._16sdp,
            marginHorizontal: sizes._16sdp,
            backgroundColor: '#fff', // Nền trắng để đổ bóng hiển thị tốt hơn
            borderRadius: 30, // Bo tròn các góc
            // Đổ bóng trên Android
            elevation: 7,
            // width: sizes.width - sizes._32sdp,
            // marginBottom: sizes._22sdp,
            // marginLeft: sizes._16sdp,
            // marginTop: sizes._16sdp,
            // display: 'flex',
            // flexDirection: 'row',
            // alignItems: 'center',
            // justifyContent: 'space-between',
          }}>
          <Searchbar
            value={this.state.valueSearch}
            onChangeText={txt => {
              this.setState({valueSearch: txt});
            }}
            placeholder="Tìm kiếm địa điểm, địa chỉ,..."
            style={{
              // backgroundColor: '#CEE8E7',
              backgroundColor: colors.primary_200,
              color: colors.black,
              flex: 1,
            }}
            inputStyle={{
              color: colors.black,
              fontFamily: 'GoogleSans_Regular',
            }}
            onIconPress={() =>
              this.handleSearch(
                false,
                this.state.locations,
                // _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
              )
            }
          />
          {/* <Button
            mode="contained"
            onPress={() =>
              this.handleSearch(
                false,
                _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
              )
            }>
            Tìm kiếm
          </Button> */}
          {/* <TextInput
            mode="outlined"
            label="Tìm kiếm địa điểm du lịch"
            placeholder="nhập tên địa điểm, địa chỉ..."
            outlineStyle={{
              borderColor: colors.black,
              borderRadius: sizes._20sdp,
            }}
            textColor={colors.black}
            placeholderTextColor={colors.black}
            style={{width: sizes.width - sizes._135sdp, color: colors.black}}
            onChangeText={txt => {
              this.setState({
                valueSearch: txt,
              });
            }}
            value={this.state.valueSearch}
          /> */}
          {/* <TouchableOpacity
            style={{
              paddingVertical: sizes._16sdp,
              backgroundColor: colors.primary_600,
              borderRadius: sizes._20sdp,
              width: sizes._90sdp,
              height: sizes._54sdp,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() =>
              this.handleSearch(
                false,
                _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
              )
            }>
            <TextBase style={AppStyle.txt_16_medium}>Tìm kiếm</TextBase>
          </TouchableOpacity> */}
        </View>
        <ScrollView>
          <View style={styles.container}>
            <View style={styles.rowCenter}>
              <TextBase style={[AppStyle.txt_20_bold]}>Phổ biến</TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.locationsPopular)
                }>
                <TextBase style={[AppStyle.txt_18_regular]}>
                  Xem tất cả
                </TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              contentContainerStyle={{
                paddingVertical: sizes._16sdp,
              }}
              data={this.state.locationsPopular}
              renderItem={this.renderItemHorizontal}
              keyExtractor={item => item.Id.toString()}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />

            <View style={[styles.rowCenter, {marginTop: sizes._24sdp}]}>
              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._16sdp}]}>
                Gần tôi
              </TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.locationsNearly)
                }>
                <TextBase
                  style={[
                    AppStyle.txt_18_regular,
                    {marginBottom: sizes._16sdp},
                  ]}>
                  Xem tất cả
                </TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              data={this.state.locationsNearly}
              renderItem={this.renderItemLarge}
              keyExtractor={item => item.Id.toString()}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </Page>
    );
  }
}

export default withTranslation(HomeScreen);

const styles = StyleSheet.create({
  container: {
    padding: sizes._16sdp,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: sizes._16sdp,
  },
  languageDropdownContainer: {
    marginTop: sizes._36sdp,
  },
});
