import React from 'react';
import {FlatList, TouchableOpacity, View, Image} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {reviews} from '../../../common/reviewsConstants';
import {IAccount, ILocation, IReview,} from '../../../common/types';
import ReviewItem from '../../../component/ReviewItem';
import sizes from '../../../common/sizes';
import BottomSheet from '../../../component/BottomSheet';
import {Add} from '../../../assets/ImageSvg';
import colors from '../../../common/colors';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {StarActive, StarInActive} from '../../../assets/assets/ImageSvg';
import {TextInput} from 'react-native-paper';
import {random} from 'lodash';
import moment from 'moment';
import _ from 'lodash';
import {
  LOCATION_NEARLY,
  LOCATION_POPULAR,
} from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import locationApi from '../../../services/locations.api';


// ĐÂY LÀ TRANG NEWFEED CHUẨN
// ĐÂY LÀ TRANG NEWFEED CHUẨN
// ĐÂY LÀ TRANG NEWFEED CHUẨN

interface INewFeedScreenProps {
  navigation: any;
}

interface INewFeedScreenState {
  reviews: IReview[];
  avt: IAccount | null | undefined;
  star: number;
  content: string;
  location?: ILocation | null | undefined;
  valueSearch: string;
  locations: ILocation[];
  locationsPopular: ILocation[];
  locationsNearly: ILocation[];
}

export default class NewFeedScreen extends React.PureComponent<
  INewFeedScreenProps,
  INewFeedScreenState
> {
  refSheet: BottomSheet | null | undefined;
  refSheetLocation: BottomSheet | null | undefined;
  constructor(props: INewFeedScreenProps) {
    super(props);
    this.state = {
      reviews: [],
      avt: null,
      star: 0,
      content: '',
      location: null,
      valueSearch: '',
      locations: [],
      locationsNearly: [],
      locationsPopular: [],
    };
  }

  componentDidMount(): void {
    this.handleGetReviews();
    this.handleGetAvt();
    this.fetchLocations();
  }

  async fetchLocations() {
    const data = await locationApi.getLocations();
    this.setState({
      locations: data,
      locationsNearly: data.slice(10, 20),
      locationsPopular: data.slice(0, 10),
    });
  }

  handleGetReviews = () => {
    const locations: ILocation[] = _.unionBy(
      LOCATION_POPULAR,
      LOCATION_NEARLY,
      'id',
    );
    let reviewsLocal: IReview[] = [];
    locations.forEach(location => {
      location.reviews.forEach(review => {
        review.location = location;
        reviewsLocal = reviewsLocal.concat(review);
      });
    });
    this.setState({
      reviews: reviewsLocal,
    });
  };

  handleGetAvt = async () => {
    const avt = await LocalStorageCommon.getItem(localStorageKey.AVT);
    this.setState({
      avt: avt,
    });
  };
  
  renderItemLarge = ({item, index}: {item: ILocation; index: number}) => {
    return <LargeItemLocation location={item} 
    onPress={() => {
      this.setState(
        {
          location: item,
        },
        () => {
          this.refSheetLocation?.close();
        },
      );
    }}
    />;
  };

  renderItem = ({item, index}: {item: IReview; index: number}) => {
    return (
      <ReviewItem key={`feed-${index}`} review={item} isShowLocation={true} />
    );
  };

  render(): React.ReactNode {
    return (
      <Page>
        <HeaderBase hideLeftIcon title={strings.new_feed} />
        <View
          style={{
            flex: 1,
            padding: sizes._16sdp,
            backgroundColor: colors.background,
          }}>
          <FlatList
            data={this.state.reviews}
            renderItem={this.renderItem}
            contentContainerStyle={{paddingBottom: sizes._100sdp}}
            keyExtractor={(item, index) => item.id + item.content + index}
          />

          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: sizes._16sdp,
              padding: sizes._8sdp,
              backgroundColor: colors.primary,
              borderRadius: sizes._200sdp,
              right: sizes._16sdp,
            }}
            onPress={() => {
              this.refSheet?.open();
            }}>
            <Add
              width={sizes._40sdp}
              height={sizes._40sdp}
              color={colors.primary_950}
            />
          </TouchableOpacity>
        </View>

        <BottomSheet
          height={sizes._csreen_height * 0.8}
          ref={ref => {
            this.refSheet = ref;
          }}>
          <View style={{flex: 1, alignItems: 'center'}}>
            <View
              style={{
                width: sizes.width,
                backgroundColor: colors.primary,
                paddingVertical: sizes._16sdp,
                alignItems: 'center',
              }}>
              <TextBase style={AppStyle.txt_20_bold}>Thêm Bình Luận</TextBase>
            </View>

            <View
              style={{
                flexDirection: 'col',
                alignItems: 'center',
                paddingHorizontal: sizes._16sdp,
                paddingVertical: sizes._16sdp,
                borderBottomWidth: 1,
                borderColor: colors.primary,
              }}>
              <Image
                source={{uri: this.state.avt?.avatar}}
                style={{
                  width: sizes._40sdp,
                  height: sizes._40sdp,
                  borderRadius: sizes._900sdp,
                }}
              />
              <TextBase
                style={[
                  AppStyle.txt_18_bold_review,
                  {marginTop: sizes._8sdp,}
                  // {marginLeft: sizes._16sdp},
                ]}>
                {this.state.avt?.userName}
              </TextBase>
            </View>

            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  // marginLeft: sizes._16sdp,
                  marginTop: sizes._24sdp,
                },
              ]}>
              Đánh giá
            </TextBase>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: sizes._40sdp,
                paddingVertical: sizes._10sdp,
              }}>
              {Array.from([1, 2, 3, 4, 5]).map(i => {
                return (
                  <TouchableOpacity
                    onPress={() => {
                      this.setState({
                        star: i,
                      });
                    }}>
                    {i <= this.state.star ? (
                      <StarActive
                        width={sizes._36sdp}
                        height={sizes._36sdp}
                        color={colors.primary}
                      />
                    ) : (
                      <StarInActive
                        width={sizes._36sdp}
                        height={sizes._36sdp}
                        color={colors.primary_950}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  // marginLeft: sizes._16sdp,
                  marginTop: sizes._16sdp,
                },
              ]}>
              Nội dung
            </TextBase>

            <View
              style={{
                // paddingHorizontal: sizes._8sdp,
                // paddingVertical: sizes._8sdp,
                elevation: 4,
              }}>
              <TextInput
                mode="outlined"
                label="Đánh giá"
                placeholder="Nhập nội dung"
                style={{width: sizes.width * 0.4, maxHeight: sizes._180sdp, textAlign: 'center', justifyContent: 'center'}}
                outlineStyle={{
                  borderColor: colors.primary,
                  borderRadius: sizes._16sdp,
                }}
                textColor={colors.primary_950}
                placeholderTextColor={colors.primary_950}
                onChangeText={txt => {
                  this.setState({
                    content: txt,
                  });
                }}
                multiline
              />
            </View>

            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  // marginLeft: sizes._16sdp,
                  marginTop: sizes._16sdp,
                  marginBottom: sizes._8sdp,
                },
              ]}>
              Địa điểm
            </TextBase>

            {this.state.location && (
              <View style={{paddingHorizontal: sizes._16sdp, width: sizes.width - sizes._16sdp,}}>
                <LargeItemLocation location={this.state.location} />
              </View>
            )}
            <TouchableOpacity
              style={{
                width: sizes.width * 0.4,
                // marginLeft: sizes._16sdp,
                height: sizes._50sdp,
                backgroundColor: colors.primary,
                borderRadius: sizes._16sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                this.refSheetLocation?.open();
              }}>
              <TextBase style={AppStyle.txt_18_bold}>
                {' '}
                {this.state.location ? 'Chọn lại địa điểm' : 'Chọn địa điểm'}
              </TextBase>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                const newReview: IReview = {
                  id: random(),
                  content: this.state.content,
                  name_user_review: this.state.avt?.userName ?? '',
                  time_review: moment().format('dd/mm/yyyy hh:mm'),
                  start: this.state.star,
                  avatar: this.state.avt?.avatar ?? '',
                  //@ts-ignore
                  location: this.state.location,
                };
                this.setState(
                  {
                    reviews: [...[newReview], ...this.state.reviews],
                  },
                  () => {
                    this.setState({
                      content: '',
                      star: 0,
                      location: null,
                    });
                  },
                );
                this.refSheet?.close();
              }}
              disabled={this.state.content.length === 0 || !this.state.location}
              style={{
                position: 'absolute',
                bottom: sizes._32sdp,
                width: sizes.width - sizes._32sdp,
                left: sizes._16sdp,
                backgroundColor:
                  this.state.content.length === 0 || !this.state.location
                    ? colors.primary_100
                    : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                height: sizes._50sdp,
                borderRadius: sizes._16sdp,
              }}>
              <TextBase
                //@ts-ignore
                style={[
                  AppStyle.txt_18_bold,
                  (this.state.content.length === 0 || !this.state.location) && {
                    color: colors.primary_400,
                  },
                ]}>
                Đăng
              </TextBase>
            </TouchableOpacity>
          </View>
        </BottomSheet>

        <BottomSheet
          height={sizes._csreen_height * 0.6}
          ref={ref => {
            this.refSheetLocation = ref;
          }}>
          <View
            style={{
              width: sizes.width,
              backgroundColor: colors.primary,
              paddingVertical: sizes._16sdp,
              alignItems: 'center',
            }}>
            <TextBase style={AppStyle.txt_20_bold}>Chọn địa điểm</TextBase>
          </View>
          <View style={{padding: sizes._16sdp}}>
            <FlatList
              data={this.state.locations}
              renderItem={this.renderItemLarge}
              contentContainerStyle={{paddingBottom: sizes._60sdp}}
              keyExtractor={item => item.Id.toString()}
              scrollEnabled={true}
              showsHorizontalScrollIndicator={false}
              
              // renderItem={({item, index}) => {
              //   return (
              //     <LargeItemLocation
              //       location={item}
              //       onPress={() => {
              //         this.setState(
              //           {
              //             location: item,
              //           },
              //           () => {
              //             this.refSheetLocation?.close();
              //           },
              //         );
              //       }}
              //     />
              //   );
              // }}
            />
          </View>
        </BottomSheet>
      </Page>
    );
  }
}
