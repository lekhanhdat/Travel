import FEATURE_FLAGS from '../../../config/featureFlags';
import CatalogStatus from '../../../component/CatalogStatus';
import React from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Page from '../../../component/Page';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import {ILocation, IAccount} from '../../../common/types';
import BigItemLocation from '../../../component/BigItemLocation';
import LargeItemLocation from '../../../component/LargeItemLocation';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import catalogRepository from '../../../services/catalogRepository';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {
  withAzureTranslation,
  WithAzureTranslationProps,
} from '../../../hoc/withAzureTranslation';
import LanguageDropdown from '../../../component/LanguageDropdown';
import Geolocation from '@react-native-community/geolocation';
import SemanticSearchBarComponent from '../../../component/SemanticSearchBarComponent';
import RecommendationsWidget from '../../../component/RecommendationsWidget';
import {Button} from 'react-native-paper';
import {sortByDistance} from '../../../utils/nearby';
import {LOCATION_SEARCH_FIELDS} from '../../../utils/catalogSearch';

interface IHomeScreenProps extends WithAzureTranslationProps {
  navigation: any;
}

type NearbyStatus = 'idle' | 'locating' | 'denied' | 'unavailable' | 'ready';
type NearbyLocation = ILocation & {distanceKm: number};

interface IHomeScreenState {
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  valueSearch: string;
  locations: ILocation[];
  locationsPopular: ILocation[];
  locationsNearly: NearbyLocation[];
  nearbyStatus: NearbyStatus;
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
  searchBarRef: React.RefObject<SemanticSearchBarComponent<ILocation>>;

  constructor(props: IHomeScreenProps) {
    super(props);
    this.searchBarRef = React.createRef();
    this.state = {
      loading: true,
      refreshing: false,
      error: false,
      valueSearch: '',
      locations: [],
      locationsNearly: [],
      locationsPopular: [],
      nearbyStatus: 'idle',
      account: null,
      currentLat: 15.974620784990472,
      currentLong: 108.25290513035998,
      locationPermission: false,
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', () => {
      // Force update to refresh translations
      this.forceUpdate();

      this.setState({
        valueSearch: '',
      });
      // Reset search bar when screen is focused
      this.searchBarRef.current?.resetSearch();
    });

    this.fetchLocations();
    if (FEATURE_FLAGS.ENABLE_AUTH) {this.handleGetUser();}
  }

  handleGetUser = async () => {
    const response: IAccount = await LocalStorageCommon.getItem(
      localStorageKey.AVT,
    );
    this.setState({
      account: response,
    });
  };

  // "Gần bạn": ask for location only on demand; a denial keeps the rest of Home usable.
  handleUseMyLocation = async () => {
    const {t} = this.props;
    this.setState({nearbyStatus: 'locating'});
    if (Platform.OS === 'android') {
      let granted: string | null = null;
      try {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('home.locationPermissionTitle'),
            message: t('home.locationPermissionMessage'),
            buttonNegative: t('home.cancel'),
            buttonPositive: 'OK',
          },
        );
      } catch (err) {
        console.warn(err);
      }
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        this.setState({locationPermission: false, nearbyStatus: 'denied'});
        return;
      }
    }
    this.setState({locationPermission: true});
    this.getCurrentLocation();
  };

  // Get current GPS location (foreground only)
  getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        this.setState({currentLat: latitude, currentLong: longitude}, this.updateNearby);
      },
      error => {
        console.log('❌ Error getting location:', error);
        this.setState({nearbyStatus: 'unavailable'});
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  };

  updateNearby = () => {
    if (!this.state.locationPermission || this.state.nearbyStatus === 'denied') {return;}
    if (this.state.nearbyStatus !== 'locating' && this.state.nearbyStatus !== 'ready') {return;}
    this.setState({
      locationsNearly: sortByDistance(this.state.locations,
        {latitude: this.state.currentLat, longitude: this.state.currentLong}),
      nearbyStatus: 'ready',
    });
  };

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
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

  /* P1: Legacy GPS/nearby loader retained while Guest Mode uses the loader below.
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
    const sortedByDistance = [...locationsWithDistance].sort(
      (a, b) => a.distance - b.distance,
    );

    // Get top 10 nearest locations
    const nearestLocations = sortedByDistance.slice(0, 20);

    // Get popular locations (first 10 from original data)
    const popularLocations = data.slice(0, 20);

    this.setState({
      locations: data,
      locationsNearly: nearestLocations,
      locationsPopular: popularLocations,
    });

    if (__DEV__) {
      console.log(
        '🎯 Nearest location:',
        nearestLocations[0]?.name,
        nearestLocations[0]?.distance?.toFixed(2),
        'km',
      );
    }
  }
  */

  async fetchLocations(forceRefresh = false, pullToRefresh = false) {
    this.setState({loading: !pullToRefresh, refreshing: pullToRefresh, error: false});
    try {
      const {locations: data} = await catalogRepository.get(forceRefresh);
      this.setState({locations: data, locationsPopular: data.slice(0, 20)}, this.updateNearby);
    } catch {
      // A failed refresh keeps the list already shown; CatalogStatus offers Retry.
      this.setState({error: true});
    } finally {
      this.setState({loading: false, refreshing: false});
    }
  }

  handlePullToRefresh = () => this.fetchLocations(true, true);

  renderItemNearby = ({item}: {item: NearbyLocation}) => (
    <LargeItemLocation location={item} distanceKm={item.distanceKm} />
  );

  // ============ PERFORMANCE OPTIMIZATION: Memoized render functions ============
  renderItemHorizontal = ({item, index}: {item: ILocation; index: number}) => {
    return (
      <BigItemLocation 
        location={item} 
        // Force re-render when language changes
        key={`h-${item.id}-${this.props.language}`}
      />
    );
  };

  renderItemLarge = ({item, index}: {item: ILocation; index: number}) => {
    return (
      <LargeItemLocation 
        location={item} 
        // Force re-render when language changes
        key={`v-${item.id}-${this.props.language}`}
      />
    );
  };

  // Stable keyExtractor functions to prevent re-creation
  keyExtractorById = (item: ILocation) => item.id.toString();

  // getItemLayout for horizontal FlatList (BigItemLocation)
  // BigItemLocation width: 200 + marginRight: 12 = 212
  getItemLayoutHorizontal = (
    data: ILocation[] | null | undefined,
    index: number,
  ) => ({
    length: 212,
    offset: 212 * index,
    index,
  });

  // getItemLayout for vertical FlatList (LargeItemLocation)
  // LargeItemLocation height: approximately 120 (image 80 + padding + text)
  getItemLayoutVertical = (
    data: ILocation[] | null | undefined,
    index: number,
  ) => ({
    length: 120,
    offset: 120 * index,
    index,
  });

  handleSearch = (isViewAll: boolean, locations: ILocation[]) => {
    const searchValue = this.searchBarRef.current?.getSearchValue() || '';
    NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
      title: isViewAll ? this.props.t('home.viewAll') : this.props.t('home.search'),
      locations: locations,
      valueSearch: searchValue,
    });
  };

  // Called while typing - just update local state, don't navigate
  handleSearchCallback = (
    filteredData: ILocation[],
    searchValue: string,
    isSemanticSearch?: boolean,
  ) => {
    this.setState({valueSearch: searchValue});
  };

  // Called when user explicitly submits search (Enter key or search button)
  handleSearchSubmit = (
    filteredData: ILocation[],
    searchValue: string,
    isSemanticSearch?: boolean,
  ) => {
    console.log('📥 [HomeScreen] handleSearchSubmit received:');
    console.log('  📋 filteredData.length:', filteredData?.length || 0);
    console.log('  📋 searchValue:', searchValue);
    console.log('  📋 isSemanticSearch:', isSemanticSearch);

    if (!searchValue || searchValue.trim().length === 0) {
      console.log('  ⚠️ Empty search, not navigating');
      return; // Don't navigate if search is empty
    }
    this.setState({valueSearch: searchValue}, () => {
      // ALWAYS use filteredData from the search component - it contains the semantic results
      const locationsToShow = filteredData;
      console.log('  ➡️ Navigating with', locationsToShow.length, 'locations');
      this.handleSearchWithFlag(
        false,
        locationsToShow,
        isSemanticSearch || false,
      );
    });
  };

  handleSearchWithFlag = (
    isViewAll: boolean,
    locations: ILocation[],
    isSemanticSearch: boolean,
  ) => {
    const searchValue =
      this.searchBarRef.current?.getSearchValue?.() ||
      this.state.valueSearch ||
      '';
    console.log('🧭 [HomeScreen] Navigating to ViewAllLocation:');
    console.log('  📋 locations.length:', locations.length);
    console.log('  📋 isSemanticSearch:', isSemanticSearch);
    NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
      title: isViewAll
        ? this.props.t('home.viewAll')
        : isSemanticSearch
        ? `🧠 ${this.props.t('home.aiSearchResults')}`
        : this.props.t('home.search'),
      locations: locations,
      valueSearch: searchValue,
      isSemanticSearch: isSemanticSearch,
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
            {this.props.t('home.greeting')}
            {this.state.account?.fullName
              ? `, ${this.state.account.fullName}`
              : ''}
          </TextBase>
          <View style={styles.languageDropdownContainer}>
            <LanguageDropdown
              compact={true}
              showFlag={true}
              showNativeName={false}
            />
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
          {this.props.t('home.welcomeMessage')}
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
          {this.props.t('home.inDanang')}
        </TextBase>

        <SemanticSearchBarComponent<ILocation>
          ref={this.searchBarRef}
          data={this.state.locations}
          searchFields={[...LOCATION_SEARCH_FIELDS]}
          onSearch={this.handleSearchCallback}
          onSubmitSearch={this.handleSearchSubmit}
          placeholder={this.props.t('home.searchPlaceholder')}
          entityType="location"
          idField="id"
        />
        <CatalogStatus loading={this.state.loading} error={this.state.error}
          onRetry={() => this.fetchLocations(true)} />
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={this.state.refreshing} onRefresh={this.handlePullToRefresh} />
          }>
          <View style={styles.container}>
            {/* 1. AI-Powered Recommendations - At the top */}
            {FEATURE_FLAGS.ENABLE_AI && this.state.account?.id && (
              <RecommendationsWidget
                userId={this.state.account.id}
                title={this.props.t('home.recommendedLocations')}
                limit={10}
              />
            )}

            {/* 2. Popular Locations */}
            <View
              style={[
                styles.rowCenter,
                {marginTop: this.state.account?.id ? sizes._24sdp : 0},
              ]}>
              <TextBase style={[AppStyle.txt_20_bold]}>
                {this.props.t('home.popularLocations')}
              </TextBase>
              <TouchableOpacity
                onPress={() =>
                  this.handleSearch(true, this.state.locationsPopular)
                }>
                <TextBase style={[AppStyle.txt_18_regular]}>
                  {this.props.t('home.viewAll')}
                </TextBase>
              </TouchableOpacity>
            </View>

            <FlatList
              contentContainerStyle={{
                paddingVertical: sizes._16sdp,
              }}
              data={this.state.locationsPopular}
              renderItem={this.renderItemHorizontal}
              keyExtractor={this.keyExtractorById}
              getItemLayout={this.getItemLayoutHorizontal}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              initialNumToRender={5}
              maxToRenderPerBatch={5}
              windowSize={5}
              removeClippedSubviews={true}
            />

            {/* 3. Nearby: on-demand location, distance by haversine */}
            <View style={[styles.rowCenter, {marginTop: sizes._24sdp}]}>
              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._16sdp}]}>
                {this.props.t('home.nearbyLocations')}
              </TextBase>
              {this.state.nearbyStatus === 'ready' && this.state.locationsNearly.length > 0 ? (
                <TouchableOpacity
                  onPress={() =>
                    this.handleSearch(true, this.state.locationsNearly)
                  }>
                  <TextBase
                    style={[
                      AppStyle.txt_18_regular,
                      {marginBottom: sizes._16sdp},
                    ]}>
                    {this.props.t('home.viewAll')}
                  </TextBase>
                </TouchableOpacity>
              ) : null}
            </View>

            {this.state.nearbyStatus === 'ready' ? (
              this.state.locationsNearly.length > 0 ? (
                <FlatList
                  data={this.state.locationsNearly}
                  renderItem={this.renderItemNearby}
                  keyExtractor={this.keyExtractorById}
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={false}
                  initialNumToRender={5}
                  maxToRenderPerBatch={5}
                  removeClippedSubviews={true}
                />
              ) : (
                <TextBase style={AppStyle.txt_16_regular}>{this.props.t('home.noNearby')}</TextBase>
              )
            ) : (
              <View>
                {this.state.nearbyStatus === 'denied' || this.state.nearbyStatus === 'unavailable' ? (
                  <TextBase style={[AppStyle.txt_16_regular, {marginBottom: sizes._12sdp}]}>
                    {this.props.t(this.state.nearbyStatus === 'denied' ? 'home.locationDenied' : 'home.locationUnavailable')}
                  </TextBase>
                ) : null}
                <Button
                  mode="outlined"
                  loading={this.state.nearbyStatus === 'locating'}
                  disabled={this.state.nearbyStatus === 'locating'}
                  onPress={this.handleUseMyLocation}>
                  {this.props.t(this.state.nearbyStatus === 'locating' ? 'home.locating' : 'home.useMyLocation')}
                </Button>
              </View>
            )}

          </View>
        </ScrollView>
      </Page>
    );
  }
}

export default withAzureTranslation(HomeScreen);

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
