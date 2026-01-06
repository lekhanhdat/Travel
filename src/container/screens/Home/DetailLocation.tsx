import React from 'react';
import {ScrollView, View, Image, FlatList, TouchableOpacity, StyleSheet, Modal, Dimensions} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import {ILocation, IReview} from '../../../common/types';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import ReviewItem from '../../../component/ReviewItem';
import {reviews} from '../../../common/reviewsConstants';
import locationApi from '../../../services/locations.api';
import {StarActive, StarInActive, ThunderSvg} from '../../../assets/assets/ImageSvg';
import {MapSvg, Call, GlobeSvg, ClockSvg} from '../../../assets/ImageSvg';
import {ScreenName} from '../../AppContainer';
import {Button} from 'react-native-paper';
import festivalsApi, {IFestival} from '../../../services/festivals.api';
import SimilarItemsComponent from '../../../component/SimilarItemsComponent';
import {
  withAzureTranslation,
  WithAzureTranslationProps,
} from '../../../hoc/withAzureTranslation';

interface IDetailLocationScreenProps extends WithAzureTranslationProps {
  navigation: any;
  route: any;
}

interface IDetailLocationScreenState {
  allLocations: ILocation[];
  showImageModal: boolean;
  selectedImageIndex: number;
  festivals: IFestival[];
}

class DetailLocationScreen extends React.PureComponent<
  IDetailLocationScreenProps,
  IDetailLocationScreenState
> {
  constructor(props: IDetailLocationScreenProps) {
    super(props);
    this.state = {
      allLocations: [],
      showImageModal: false,
      selectedImageIndex: 0,
      festivals: [],
    };
  }

  async componentDidMount() {
    // Load all locations để filter theo types
    const locations = await locationApi.getLocations();
    this.setState({ allLocations: locations });

    // Load festivals cho địa điểm này
    const location: ILocation = this.props.route.params?.location;
    if (location.Id || location.id) {
      const locationId = location.Id || location.id;
      try {
        const festivals = await festivalsApi.getFestivalsByLocationId(locationId!);
        if (__DEV__) {console.log(`🎉 Found ${festivals.length} festivals for location ${locationId}`);}
        this.setState({ festivals });
      } catch (error) {
        if (__DEV__) {console.error('❌ Error loading festivals:', error);}
      }
    }
  }

  renderItem = ({item, index}: {item: IReview; index: number}) => {
    return <ReviewItem review={item} />;
  };

  getRandomElements = (arr: IReview[], num: number) => {
    // Copy mảng gốc để tránh thay đổi
    const shuffled = [...arr];
    // Sắp xếp lại mảng một cách ngẫu nhiên
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Trả về `num` phần tử đầu tiên
    return shuffled.slice(0, num);
  };

  // Tìm các địa điểm có cùng types (tối đa 20 locations)
  // Priority: locations matching first type > second type > third type, etc.
  getSimilarLocations = (currentLocation: ILocation): ILocation[] => {
    const currentTypes = currentLocation.types || [];

    if (currentTypes.length === 0) {
      if (__DEV__) {console.log('⚠️ Current location has no types');}
      return [];
    }

    // Filter locations có ít nhất 1 type trùng với current location
    const similarLocations = this.state.allLocations.filter(loc => {
      const locTypes = loc.types || [];

      // Không include chính location hiện tại (so sánh bằng Id/id hoặc name)
      const currentId = currentLocation.Id || currentLocation.id;
      const locId = loc.Id || loc.id;
      if (currentId && locId && currentId === locId) {
        return false;
      }
      if (loc.name === currentLocation.name) {
        return false;
      }

      // Check xem có type nào trùng không
      const hasCommonType = locTypes.some(type => currentTypes.includes(type));
      return hasCommonType;
    });

    // Sort by priority: Prioritize locations that match earlier types in the array
    // Calculate priority score: lower index = higher priority
    const sortedLocations = similarLocations
      .map(loc => {
        const locTypes = loc.types || [];

        // Find the best (lowest) matching type index
        let bestMatchIndex = currentTypes.length; // Default to worst priority
        let matchCount = 0;

        for (let i = 0; i < currentTypes.length; i++) {
          if (locTypes.includes(currentTypes[i])) {
            matchCount++;
            if (i < bestMatchIndex) {
              bestMatchIndex = i;
            }
          }
        }

        return {
          location: loc,
          bestMatchIndex, // Lower is better (matches earlier type)
          matchCount,     // Higher is better (more types in common)
        };
      })
      .sort((a, b) => {
        // Primary sort: by best matching type index (first type match is highest priority)
        if (a.bestMatchIndex !== b.bestMatchIndex) {
          return a.bestMatchIndex - b.bestMatchIndex;
        }
        // Secondary sort: by number of matching types (more matches = higher priority)
        return b.matchCount - a.matchCount;
      })
      .map(item => item.location);

    // Chỉ lấy 20 locations đầu tiên
    const limitedLocations = sortedLocations.slice(0, 20);

    if (__DEV__) {
      console.log(`🔍 Found ${similarLocations.length} similar locations, showing ${limitedLocations.length}`);
      console.log(`📋 Current types: [${currentTypes.join(', ')}]`);
    }
    return limitedLocations;
  };

  render(): React.ReactNode {
    const location: ILocation = this.props.route.params?.location;
    const {t} = this.props;
    return (
      <Page>
        <HeaderBase
          title={t('detail.viewDetail')}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => {
            NavigationService.pop();
          }}
          rightIconSvgOne={
            <MapSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onRightIconOnePress={() => {
            NavigationService.navigate(ScreenName.MAP_SCREEN, {
              locations: [location],
              showRoute: true,
            });
          }}
        />
        <View style={{flex: 1, backgroundColor: colors.primary_200}}>
          <ScrollView>
            <Image
              source={{uri: location.avatar}}
              style={{
                width: sizes.width,
                height: sizes._200sdp,
              }}
            />

            <View style={{flex: 1, padding: sizes._16sdp}}>
              <TextBase style={[AppStyle.txt_20_bold, {textAlign: 'center'}]}>
                {location.name}
              </TextBase>

              {/* Average Rating Display */}
              {location.reviews && location.reviews.length > 0 && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: sizes._12sdp,
                }}>
                  {Array.from([1, 2, 3, 4, 5]).map((i) => {
                    const avgRating = locationApi.calculateAverageRating(location.reviews);
                    return i <= Math.round(avgRating) ? (
                      <StarActive
                        key={i}
                        width={sizes._20sdp}
                        height={sizes._20sdp}
                        color={colors.primary}
                      />
                    ) : (
                      <StarInActive
                        key={i}
                        width={sizes._20sdp}
                        height={sizes._20sdp}
                        color={colors.primary_950}
                      />
                    );
                  })}
                  <TextBase style={[AppStyle.txt_16_regular, {marginLeft: sizes._8sdp}]}>
                    {locationApi.calculateAverageRating(location.reviews).toFixed(1)} ({location.reviews.length})
                  </TextBase>
                </View>
              )}

              {/* Description: Use long_description if available, fallback to description */}
              <TextBase
                style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._12sdp, textAlign: 'justify'}]}>
                {location.long_description || location.description}
              </TextBase>

              {/* Address with Icon */}
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                <MapSvg
                  width={sizes._20sdp}
                  height={sizes._20sdp}
                  color={'#000000'}
                />
                <TextBase
                  style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                  {t('detail.address')}: {location.address}
                </TextBase>
              </View>

              {/* Phone Number with Icon */}
              {location.phone && (
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                  <Call
                    width={sizes._20sdp}
                    height={sizes._20sdp}
                    color={'#000000'}
                  />
                  <TextBase
                    style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                    {t('detail.phone')}: {location.phone}
                  </TextBase>
                </View>
              )}

              {/* Website with Icon */}
              {location.website && (
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                  <GlobeSvg
                    width={sizes._24sdp}
                    height={sizes._24sdp}
                    color={'#000000'}
                  />
                  <TextBase
                    style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                    {t('detail.website')}: {location.website}
                  </TextBase>
                </View>
              )}

              {/* Opening Hours with Icon */}
              {location.opening_hours && (
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                  <ClockSvg
                    width={sizes._24sdp}
                    height={sizes._24sdp}
                    color={'#000000'}
                  />
                  <TextBase
                    style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                    {t('detail.openingHours')}: {location.opening_hours}
                  </TextBase>
                </View>
              )}

              {/* Location Images Gallery */}
              {location.images && location.images.length > 0 && (
                <View style={{marginTop: sizes._16sdp}}>
                  <TextBase style={[AppStyle.txt_20_bold, {marginBottom: sizes._12sdp}]}>
                    {t('detail.locationImages')}
                  </TextBase>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{marginBottom: sizes._8sdp}}
                  >
                    {location.images.map((imageUrl, index) => (
                      <TouchableOpacity
                        key={`location-image-${index}`}
                        onPress={() => {
                          this.setState({
                            showImageModal: true,
                            selectedImageIndex: index,
                          });
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{uri: imageUrl}}
                          style={{
                            width: sizes._150sdp,
                            height: sizes._150sdp,
                            borderRadius: sizes._8sdp,
                            marginRight: sizes._12sdp,
                            backgroundColor: colors.primary_100,
                          }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Festivals at Location */}
              {this.state.festivals && this.state.festivals.length > 0 && (
                <View style={{marginTop: sizes._16sdp}}>
                  <TextBase style={[AppStyle.txt_20_bold, {marginBottom: sizes._12sdp}]}>
                    {t('detail.festivalsAtLocation')}
                  </TextBase>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{marginBottom: sizes._8sdp}}
                  >
                    {this.state.festivals.map((festival, index) => (
                      <TouchableOpacity
                        key={`festival-${festival.Id || index}`}
                        onPress={() => {
                          NavigationService.navigate(ScreenName.DETAIL_FESTIVAL_SCREEN, {
                            festival: festival,
                          });
                        }}
                        activeOpacity={0.8}
                        style={{
                          marginRight: sizes._12sdp,
                          width: sizes._200sdp,
                          backgroundColor: colors.white,
                          borderRadius: sizes._8sdp,
                          overflow: 'hidden',
                          elevation: 2,
                          shadowColor: '#000',
                          shadowOffset: {width: 0, height: 2},
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                        }}
                      >
                        {/* Festival Image */}
                        {festival.images && festival.images.length > 0 && (
                          <Image
                            source={{uri: festival.images[0]}}
                            style={{
                              width: sizes._200sdp,
                              height: sizes._120sdp,
                              backgroundColor: colors.primary_100,
                            }}
                            resizeMode="cover"
                          />
                        )}

                        {/* Festival Info */}
                        <View style={{padding: sizes._12sdp}}>
                          <TextBase
                            numberOfLines={2}
                            style={[AppStyle.txt_16_bold, {marginBottom: sizes._4sdp}]}
                          >
                            {festival.name}
                          </TextBase>

                          {/* Event Time */}
                          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._4sdp}}>
                            <TextBase style={[AppStyle.txt_14_regular, {color: colors.primary}]}>
                              🗓️ {festival.event_time}
                            </TextBase>
                          </View>

                          {/* Price Level */}
                          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._4sdp}}>
                            <TextBase style={[AppStyle.txt_14_regular, {color: colors.primary_700}]}>
                              💰 {festival.price_level === 0 ? t('priceLevel.free') : festival.price_level === 1 ? '$' : '$$'}
                            </TextBase>
                          </View>

                          {/* Rating */}
                          {festival.rating > 0 && (
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._4sdp}}>
                              <StarActive
                                width={sizes._16sdp}
                                height={sizes._16sdp}
                                color={colors.primary}
                              />
                              <TextBase style={[AppStyle.txt_14_regular, {marginLeft: sizes._4sdp}]}>
                                {festival.rating.toFixed(1)}
                              </TextBase>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Advise Section */}
              {location.advise && (
                <View style={{marginTop: sizes._16sdp}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <TextBase style={[AppStyle.txt_20_bold]}>
                      {t('detail.advice')}:
                    </TextBase>
                  </View>
                  {(Array.isArray(location.advise)
                    ? location.advise
                    : location.advise.split('\n')
                  ).map((advice, index) => (
                    <TextBase
                      key={`advice-${index}`}
                      style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._4sdp, marginLeft: sizes._8sdp, textAlign: 'justify'}]}>
                      • {advice.trim()}
                    </TextBase>
                  ))}
                </View>
              )}

              {/* Buttons: Directions */}
              <View style={{
                flexDirection: 'row',
                gap: sizes._12sdp,
                marginTop: sizes._16sdp,
              }}>
                <Button
                  mode="contained"
                  icon="directions"
                  onPress={() => {
                    NavigationService.navigate(ScreenName.MAP_SCREEN, {
                      locations: [location],
                      showRoute: true,
                    });
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                  }}
                  labelStyle={{fontSize: 14}}
                >
                  {t('detail.directions')}
                </Button>
              </View>

              {/* Semantic Similar Items from Backend */}
              {(location.Id || location.id) && (
                <SimilarItemsComponent
                  entityType="location"
                  entityId={location.Id || location.id!}
                  title={t('detail.similarLocations')}
                  limit={5}
                />
              )}

              <View
                style={{
                  width: sizes.width - sizes._32sdp,
                  height: 2,
                  elevation: 2,
                  backgroundColor: colors.primary_700,
                  marginVertical: sizes._25sdp,
                }}
              />

              <TextBase
                style={[AppStyle.txt_20_bold, {marginBottom: sizes._20sdp}]}>
                {t('detail.touristReviews')}
              </TextBase>

              <FlatList
                data={location.reviews}
                scrollEnabled={false}
                renderItem={this.renderItem}
                keyExtractor={(item, index) => index.toString() + item.id}
              />
            </View>
          </ScrollView>
        </View>

        {/* Image Viewer Modal */}
        <Modal
          visible={this.state.showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => this.setState({showImageModal: false})}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Close button */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: sizes._40sdp,
                right: sizes._20sdp,
                zIndex: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 20,
                padding: sizes._8sdp,
                width: sizes._40sdp,
                height: sizes._40sdp,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => this.setState({showImageModal: false})}
            >
              <TextBase style={{color: colors.white, fontSize: 24, fontWeight: 'bold'}}>×</TextBase>
            </TouchableOpacity>

            {/* Image counter */}
            {location.images && location.images.length > 1 && (
              <View
                style={{
                  position: 'absolute',
                  top: sizes._40sdp,
                  left: sizes._20sdp,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: sizes._16sdp,
                  paddingHorizontal: sizes._12sdp,
                  paddingVertical: sizes._6sdp,
                  zIndex: 10,
                }}
              >
                <TextBase style={{color: colors.white, fontSize: 16}}>
                  {this.state.selectedImageIndex + 1} / {location.images.length}
                </TextBase>
              </View>
            )}

            {/* Scrollable images */}
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentOffset={{x: this.state.selectedImageIndex * Dimensions.get('window').width, y: 0}}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(
                  event.nativeEvent.contentOffset.x / Dimensions.get('window').width
                );
                this.setState({selectedImageIndex: newIndex});
              }}
            >
              {location.images && location.images.map((imageUrl, index) => (
                <View
                  key={`modal-image-${index}`}
                  style={{
                    width: Dimensions.get('window').width,
                    height: Dimensions.get('window').height,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={{uri: imageUrl}}
                    style={{
                      width: Dimensions.get('window').width,
                      height: Dimensions.get('window').width,
                    }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      </Page>
    );
  }
}

export default withAzureTranslation(DetailLocationScreen);
