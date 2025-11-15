import React from 'react';
import {ScrollView, View, Image, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
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
import {StarActive, StarInActive} from '../../../assets/assets/ImageSvg';
import {MapSvg} from '../../../assets/ImageSvg';
import {ScreenName} from '../../AppContainer';
import {Button} from 'react-native-paper';

interface IDetailLocationScreenProps {
  navigation: any;
}

interface IDetailLocationScreenState {
  allLocations: ILocation[];
}

export default class DetailLocationScreen extends React.PureComponent<
  IDetailLocationScreenProps,
  IDetailLocationScreenState
> {
  constructor(props: IDetailLocationScreenProps) {
    super(props);
    this.state = {
      allLocations: [],
    };
  }

  async componentDidMount() {
    // Load all locations để filter theo types
    const locations = await locationApi.getLocations();
    this.setState({ allLocations: locations });
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

  // Tìm các địa điểm có cùng types (tối đa 10 locations)
  getSimilarLocations = (currentLocation: ILocation) => {
    const currentTypes = currentLocation.types || [];

    if (currentTypes.length === 0) {
      console.log('⚠️ Current location has no types');
      return [];
    }

    // Filter locations có ít nhất 1 type trùng với current location
    const similarLocations = this.state.allLocations.filter(loc => {
      const locTypes = loc.types || [];

      // Không include chính location hiện tại (so sánh bằng name vì ID có thể khác nhau)
      if (loc.name === currentLocation.name) {
        return false;
      }

      // Check xem có type nào trùng không
      const hasCommonType = locTypes.some(type => currentTypes.includes(type));
      return hasCommonType;
    });

    // Chỉ lấy 10 locations đầu tiên
    const limitedLocations = similarLocations.slice(0, 10);

    console.log(`🔍 Found ${similarLocations.length} similar locations, showing ${limitedLocations.length}`);
    return limitedLocations;
  };

  render(): React.ReactNode {
    const location: ILocation = this.props.navigation.state.params?.location;
    return (
      <Page>
        <HeaderBase
          title={'Xem chi tiết'}
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
              <TextBase style={[AppStyle.txt_20_bold, {textAlign: 'center',}]}>
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
                    {locationApi.calculateAverageRating(location.reviews).toFixed(1)} ({location.reviews.length} đánh giá)
                  </TextBase>
                </View>
              )}

              <TextBase
                style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._12sdp}]}>
                {location.description}
              </TextBase>

              <TextBase
                style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._12sdp}]}>
                Địa chỉ: {location.address}
              </TextBase>

              {/* Buttons: Địa điểm tương tự và Chỉ đường */}
              <View style={{
                flexDirection: 'row',
                gap: sizes._12sdp,
                marginTop: sizes._16sdp,
              }}>
                <Button
                  mode="outlined"
                  icon="map-search"
                  onPress={() => {
                    const similarLocations = this.getSimilarLocations(location);
                    if (similarLocations.length > 0) {
                      NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
                        title: 'Địa điểm tương tự',
                        locations: similarLocations,
                        valueSearch: '', // Không cần search
                      });
                    } else {
                      console.log('⚠️ No similar locations found');
                      // TODO: Show toast/alert to user
                    }
                  }}
                  style={{
                    flex: 1,
                    borderColor: colors.primary,
                    borderWidth: 2,
                  }}
                  labelStyle={{
                    fontSize: 14,
                    color: colors.primary,
                  }}
                >
                  Địa điểm tương tự
                </Button>

                <Button
                  mode="contained"
                  icon="directions"
                  onPress={() => {
                    NavigationService.navigate(ScreenName.MAP_SCREEN, {
                      locations: [location],
                      showRoute: true, // Flag để hiển thị đường đi
                    });
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                  }}
                  labelStyle={{fontSize: 14}}
                >
                  Chỉ đường
                </Button>
              </View>

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
                {'Nhận xét của du khách:'}
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
      </Page>
    );
  }
}
