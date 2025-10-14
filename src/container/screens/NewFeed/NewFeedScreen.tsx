import React from 'react';
import {FlatList, TouchableOpacity, View, Image, ScrollView, Alert, ActivityIndicator} from 'react-native';
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
import {Avatar, getDisplayName} from '../../../utils/avatarUtils';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import LocalStorageCommon from '../../../utils/LocalStorageCommon';
import {localStorageKey} from '../../../common/constants';
import {StarActive, StarInActive} from '../../../assets/assets/ImageSvg';
import {TextInput, Button} from 'react-native-paper';
import moment from 'moment';
import _ from 'lodash';
import {
  LOCATION_NEARLY,
  LOCATION_POPULAR,
} from '../../../common/locationConstants';
import LargeItemLocation from '../../../component/LargeItemLocation';
import locationApi from '../../../services/locations.api';
import {launchImageLibrary} from 'react-native-image-picker';
import {convertCitationVietnameseUnsigned} from '../../../utils/Utils';


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
  selectedImages: any[]; // Array of selected images
  uploading: boolean; // Upload status
  locationSearchQuery: string; // Search query for location modal
  filterLocationId: number | null; // Filter reviews by location ID
  filterLocationQuery: string; // Filter location search query (user input)
  showFilterSuggestions: boolean; // Show/hide filter suggestions dropdown
}

export default class NewFeedScreen extends React.PureComponent<
  INewFeedScreenProps,
  INewFeedScreenState
> {
  refSheet: BottomSheet | null | undefined;
  refSheetLocation: BottomSheet | null | undefined;
  refSheetFilterLocation: BottomSheet | null | undefined;

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
      selectedImages: [],
      uploading: false,
      locationSearchQuery: '',
      filterLocationId: null,
      filterLocationQuery: '',
      showFilterSuggestions: false,
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
      locationsPopular: data.slice(36, 47),
    });
  }

  handleGetReviews = async () => {
    try {
      // 1. Lấy reviews từ cloud NocoDB
      const cloudReviews = await locationApi.getReviews();
      console.log('✅ Cloud reviews:', cloudReviews.length);

      // 2. Lấy reviews từ hardcode (backup)
      const locations: ILocation[] = _.unionBy(
        LOCATION_POPULAR,
        LOCATION_NEARLY,
        'id',
      );
      let hardcodeReviews: IReview[] = [];
      locations.forEach(location => {
        location.reviews.forEach(review => {
          review.location = location;
          hardcodeReviews = hardcodeReviews.concat(review);
        });
      });
      console.log('✅ Hardcode reviews:', hardcodeReviews.length);

      // 3. Merge: Cloud reviews lên trên, hardcode reviews ở dưới
      const allReviews = [...cloudReviews, ...hardcodeReviews];
      console.log('✅ Total reviews:', allReviews.length);

      // 4. Sắp xếp theo thời gian (mới nhất lên trên)
      const sortedReviews = allReviews.sort((a, b) => {
        // Parse time_review format: "HH:mm DD/MM/YYYY" hoặc "DD/MM/YYYY HH:mm"
        const parseTime = (timeStr: string) => {
          try {
            // Thử parse format mới: "HH:mm DD/MM/YYYY"
            let parsed = moment(timeStr, 'HH:mm DD/MM/YYYY', true);
            if (parsed.isValid()) return parsed;

            // Thử parse format cũ: "DD/MM/YYYY HH:mm"
            parsed = moment(timeStr, 'DD/MM/YYYY HH:mm', true);
            if (parsed.isValid()) return parsed;

            // Fallback
            return moment(timeStr);
          } catch (e) {
            return moment(0); // Trả về thời gian cũ nhất nếu parse lỗi
          }
        };

        const timeA = parseTime(a.time_review);
        const timeB = parseTime(b.time_review);

        // Sort descending (mới nhất lên trên)
        return timeB.valueOf() - timeA.valueOf();
      });

      this.setState({
        reviews: sortedReviews,
      });
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      // Fallback to hardcode reviews
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
    }
  };

  handleGetAvt = async () => {
    const avt = await LocalStorageCommon.getItem(localStorageKey.AVT);
    this.setState({
      avt: avt,
    });
  };

  handlePickImages = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 5, // Cho phép chọn tối đa 5 ảnh
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        } else if (response.assets) {
          this.setState({
            selectedImages: response.assets,
          });
          console.log('✅ Selected images:', response.assets.length);
        }
      },
    );
  };

  handleRemoveImage = (index: number) => {
    const newImages = [...this.state.selectedImages];
    newImages.splice(index, 1);
    this.setState({
      selectedImages: newImages,
    });
  };

  handleSubmitReview = async () => {
    try {
      this.setState({uploading: true});

      // 1. Upload images nếu có
      let imageUrls: string[] = [];
      if (this.state.selectedImages.length > 0) {
        console.log('📤 Uploading images...');
        for (const image of this.state.selectedImages) {
          try {
            const uploadResult = await locationApi.uploadImage(image);
            // uploadResult.url đã là signedUrl từ API
            imageUrls.push(uploadResult.url);
            console.log('✅ Image URL added:', uploadResult.url);
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
        console.log('✅ Images uploaded:', imageUrls.length);
        console.log('📸 Image URLs:', imageUrls);
      }

      // 2. Create review object
      // Dùng timestamp để tránh trùng ID với data cũ
      const newReview: IReview = {
        id: Date.now(), // Timestamp unique ID
        content: this.state.content,
        name_user_review: this.state.avt?.userName ?? '',
        fullName: this.state.avt?.fullName, // Add fullName field
        time_review: moment().format('HH:mm DD/MM/YYYY'), // Format: "HH:mm DD/MM/YYYY"
        start: this.state.star,
        avatar: this.state.avt?.avatar ?? '',
        //@ts-ignore
        location: this.state.location,
        images: imageUrls,
      };

      // 3. Save to NocoDB
      try {
        await locationApi.createReview(newReview);
        console.log('✅ Review saved to cloud');
      } catch (error) {
        console.error('❌ Error saving review to cloud:', error);
        Alert.alert('Thông báo', 'Không thể lưu đánh giá lên server, nhưng đã lưu local.');
      }

      // 4. Update local state
      this.setState(
        {
          reviews: [...[newReview], ...this.state.reviews],
        },
        () => {
          this.setState({
            content: '',
            star: 0,
            location: null,
            selectedImages: [],
            uploading: false,
          });
          Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi!');
        },
      );

      this.refSheet?.close();
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      this.setState({uploading: false});
      Alert.alert('Lỗi', 'Không thể gửi đánh giá. Vui lòng thử lại.');
    }
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
    // Filter reviews by location if selected
    const filteredReviews = this.state.filterLocationId
      ? this.state.reviews.filter(
          review =>
            review.location?.Id === this.state.filterLocationId ||
            review.location?.id === this.state.filterLocationId,
        )
      : this.state.reviews;

    return (
      <Page>
        <HeaderBase hideLeftIcon title={strings.new_feed} />

        <View style={{flex: 1, backgroundColor: colors.background}}>
          {/* Filter Input - Fixed at top */}
          <View
            style={{
              paddingHorizontal: sizes._16sdp,
              paddingTop: sizes._12sdp,
              paddingBottom: sizes._12sdp,
              backgroundColor: colors.background,
              zIndex: 100,
            }}>
            <TextInput
              mode="outlined"
              placeholder="Lọc theo địa điểm..."
              value={this.state.filterLocationQuery}
              onFocus={() => this.setState({showFilterSuggestions: true})}
              onChangeText={(text) => {
                this.setState({
                  filterLocationQuery: text,
                  showFilterSuggestions: true,
                });
              }}
              left={<TextInput.Icon icon="map-marker" />}
              right={
                this.state.filterLocationId || this.state.filterLocationQuery ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() =>
                      this.setState({
                        filterLocationId: null,
                        filterLocationQuery: '',
                        showFilterSuggestions: false,
                      })
                    }
                  />
                ) : undefined
              }
              style={{backgroundColor: colors.white}}
            />

            {/* Dropdown Suggestions - Absolute position, can overlap reviews */}
            {this.state.showFilterSuggestions && (
              <View
                style={{
                  position: 'absolute',
                  top: sizes._68sdp,
                  left: sizes._16sdp,
                  right: sizes._16sdp,
                  backgroundColor: colors.white,
                  borderRadius: sizes._8sdp,
                  maxHeight: sizes._250sdp,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 10,
                  zIndex: 1000,
                }}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled={true}
                >
                  {(() => {
                    const allLocations = this.state.locations.length > 0
                      ? this.state.locations
                      : [...this.state.locationsPopular, ...this.state.locationsNearly];

                    // Filter by query (support Vietnamese with/without accents)
                    const filteredLocations = this.state.filterLocationQuery.trim().length > 0
                      ? allLocations.filter(loc => {
                          const query = convertCitationVietnameseUnsigned(this.state.filterLocationQuery)?.toLowerCase() || '';
                          const name = convertCitationVietnameseUnsigned(loc.name ?? '')?.toLowerCase() || '';
                          const address = convertCitationVietnameseUnsigned(loc.address ?? '')?.toLowerCase() || '';

                          return name.includes(query) || address.includes(query);
                        })
                      : allLocations.slice(0, 3); // Show top 3 by default

                    if (filteredLocations.length === 0) {
                      return (
                        <View style={{padding: sizes._16sdp, alignItems: 'center'}}>
                          <TextBase style={{color: colors.primary_400}}>
                            Không tìm thấy địa điểm
                          </TextBase>
                        </View>
                      );
                    }

                    return filteredLocations.map((loc, index) => (
                      <TouchableOpacity
                        key={loc.Id || loc.id || index}
                        style={{
                          padding: sizes._12sdp,
                          borderBottomWidth: index < filteredLocations.length - 1 ? 1 : 0,
                          borderBottomColor: colors.primary_100,
                        }}
                        onPress={() => {
                          this.setState({
                            filterLocationId: loc.Id || loc.id || null,
                            filterLocationQuery: loc.name,
                            showFilterSuggestions: false,
                          });
                        }}
                      >
                        <TextBase style={[AppStyle.txt_16_bold]}>{loc.name}</TextBase>
                        <TextBase style={[AppStyle.txt_14_regular, {color: colors.primary_400}]}>
                          {loc.address}
                        </TextBase>
                      </TouchableOpacity>
                    ));
                  })()}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Reviews List */}
          <View style={{flex: 1, padding: sizes._16sdp}}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                // Ẩn dropdown khi click vào reviews area
                if (this.state.showFilterSuggestions) {
                  this.setState({showFilterSuggestions: false});
                }
              }}
              style={{flex: 1}}
            >
              <FlatList
                data={filteredReviews}
                renderItem={this.renderItem}
                contentContainerStyle={{paddingBottom: sizes._100sdp}}
                keyExtractor={(item, index) => item.id + item.content + index}
                ListEmptyComponent={() => (
                  <View style={{padding: sizes._32sdp, alignItems: 'center'}}>
                    <TextBase style={[AppStyle.txt_16_regular, {color: colors.primary_400}]}>
                      {this.state.filterLocationId
                        ? 'Chưa có đánh giá nào tại địa điểm này'
                        : 'Chưa có đánh giá nào'}
                    </TextBase>
                  </View>
                )}
              />
            </TouchableOpacity>
          </View>

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
          <View style={{flex: 1}}>
            <View
              style={{
                width: sizes.width,
                backgroundColor: colors.primary,
                paddingVertical: sizes._16sdp,
                alignItems: 'center',
              }}>
              <TextBase style={AppStyle.txt_20_bold}>Thêm Bình Luận</TextBase>
            </View>

            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{
                paddingBottom: sizes._100sdp,
                paddingHorizontal: sizes._16sdp,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingVertical: sizes._16sdp,
                  borderBottomWidth: 1,
                  borderColor: colors.primary_200,
                  marginBottom: sizes._16sdp,
                }}>
                <Avatar avatarUrl={this.state.avt?.avatar} size={sizes._50sdp} />
                <TextBase
                  style={[
                    AppStyle.txt_18_bold_review,
                    {marginTop: sizes._8sdp}
                  ]}>
                  {getDisplayName(this.state.avt)}
                </TextBase>
              </View>

            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  marginTop: sizes._8sdp,
                  marginBottom: sizes._8sdp,
                },
              ]}>
              Đánh giá
            </TextBase>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: sizes._12sdp,
                marginBottom: sizes._8sdp,
              }}>
              {Array.from([1, 2, 3, 4, 5]).map(i => {
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      this.setState({
                        star: i,
                      });
                    }}
                    style={{marginHorizontal: sizes._8sdp}}
                  >
                    {i <= this.state.star ? (
                      <StarActive
                        width={sizes._40sdp}
                        height={sizes._40sdp}
                        color={colors.primary}
                      />
                    ) : (
                      <StarInActive
                        width={sizes._40sdp}
                        height={sizes._40sdp}
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
                  marginTop: sizes._16sdp,
                  marginBottom: sizes._8sdp,
                },
              ]}>
              Nội dung
            </TextBase>

            <View style={{width: '100%'}}>
              <TextInput
                mode="outlined"
                label="Đánh giá"
                placeholder="Nhập nội dung đánh giá của bạn..."
                style={{
                  width: '100%',
                  minHeight: sizes._100sdp,
                  backgroundColor: colors.white,
                }}
                outlineStyle={{
                  borderColor: colors.primary,
                  borderRadius: sizes._12sdp,
                }}
                textColor={colors.primary_950}
                placeholderTextColor={colors.primary_400}
                value={this.state.content}
                onChangeText={txt => {
                  this.setState({
                    content: txt,
                  });
                }}
                multiline
                numberOfLines={4}
              />
            </View>

            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  marginTop: sizes._16sdp,
                  marginBottom: sizes._8sdp,
                },
              ]}>
              Địa điểm
            </TextBase>

            {this.state.location && (
              <View style={{
                width: '100%',
                marginBottom: sizes._12sdp,
                backgroundColor: colors.primary_100,
                borderRadius: sizes._12sdp,
                padding: sizes._8sdp,
              }}>
                <LargeItemLocation location={this.state.location} />
              </View>
            )}

            <Button
              mode="contained"
              icon="map-marker"
              onPress={() => {
                this.refSheetLocation?.open();
              }}
              style={{
                width: '100%',
                backgroundColor: colors.primary,
                borderRadius: sizes._12sdp,
              }}
              labelStyle={{
                fontSize: 16,
                color: colors.white,
              }}
            >
              {this.state.location ? 'Chọn lại địa điểm' : 'Chọn địa điểm'}
            </Button>

            {/* Upload Images Section */}
            <TextBase
              style={[
                AppStyle.txt_18_bold,
                {
                  marginTop: sizes._16sdp,
                  marginBottom: sizes._8sdp,
                },
              ]}>
              Hình ảnh (Tùy chọn)
            </TextBase>

            <Button
              mode="outlined"
              icon="camera"
              onPress={this.handlePickImages}
              style={{
                width: sizes.width * 0.4,
                borderColor: colors.primary,
                borderWidth: 2,
              }}
              labelStyle={{color: colors.primary}}
            >
              Chọn ảnh
            </Button>

            {/* Display selected images */}
            {this.state.selectedImages.length > 0 && (
              <ScrollView
                horizontal
                style={{
                  marginTop: sizes._12sdp,
                  maxHeight: sizes._100sdp,
                }}
                showsHorizontalScrollIndicator={false}
              >
                {this.state.selectedImages.map((image, index) => (
                  <View
                    key={index}
                    style={{
                      marginRight: sizes._8sdp,
                      position: 'relative',
                    }}
                  >
                    <Image
                      source={{uri: image.uri}}
                      style={{
                        width: sizes._80sdp,
                        height: sizes._80sdp,
                        borderRadius: sizes._8sdp,
                      }}
                    />
                    <TouchableOpacity
                      onPress={() => this.handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: colors.primary,
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TextBase style={{color: colors.white, fontWeight: 'bold'}}>×</TextBase>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={this.handleSubmitReview}
              disabled={this.state.content.length === 0 || !this.state.location || this.state.uploading}
              style={{
                position: 'absolute',
                bottom: sizes._32sdp,
                width: sizes.width - sizes._32sdp,
                left: sizes._16sdp,
                backgroundColor:
                  this.state.content.length === 0 || !this.state.location || this.state.uploading
                    ? colors.primary_100
                    : colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                height: sizes._50sdp,
                borderRadius: sizes._16sdp,
              }}>
              {this.state.uploading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <TextBase
                  style={[
                    AppStyle.txt_18_bold,
                    (this.state.content.length === 0 || !this.state.location) && {
                      color: colors.primary_400,
                    },
                  ]}>
                  Đăng
                </TextBase>
              )}
            </TouchableOpacity>
            </ScrollView>
          </View>
        </BottomSheet>

        <BottomSheet
          height={sizes._csreen_height * 0.7}
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

          {/* Search Box */}
          <View style={{paddingHorizontal: sizes._16sdp, paddingTop: sizes._12sdp}}>
            <TextInput
              mode="outlined"
              placeholder="Tìm kiếm địa điểm..."
              value={this.state.locationSearchQuery}
              onChangeText={(text) => this.setState({locationSearchQuery: text})}
              left={<TextInput.Icon icon="magnify" />}
              right={
                this.state.locationSearchQuery.length > 0 ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() => this.setState({locationSearchQuery: ''})}
                  />
                ) : undefined
              }
              style={{
                backgroundColor: colors.white,
              }}
              outlineStyle={{
                borderColor: colors.primary,
                borderRadius: sizes._12sdp,
              }}
            />
          </View>

          <View style={{padding: sizes._16sdp, flex: 1}}>
            <FlatList
              data={
                (() => {
                  const allLocations = this.state.locations.length > 0
                    ? this.state.locations
                    : [...this.state.locationsPopular, ...this.state.locationsNearly];

                  // Filter by search query (support Vietnamese with/without accents)
                  if (this.state.locationSearchQuery.trim().length > 0) {
                    const query = convertCitationVietnameseUnsigned(this.state.locationSearchQuery)?.toLowerCase() || '';
                    return allLocations.filter(loc => {
                      const name = convertCitationVietnameseUnsigned(loc.name ?? '')?.toLowerCase() || '';
                      const address = convertCitationVietnameseUnsigned(loc.address ?? '')?.toLowerCase() || '';

                      return name.includes(query) || address.includes(query);
                    });
                  }

                  return allLocations;
                })()
              }
              renderItem={this.renderItemLarge}
              contentContainerStyle={{paddingBottom: sizes._60sdp}}
              keyExtractor={(item, index) => (item.Id || item.id || index).toString()}
              scrollEnabled={true}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={() => (
                <View style={{
                  padding: sizes._32sdp,
                  alignItems: 'center',
                }}>
                  <TextBase style={[AppStyle.txt_16_regular, {color: colors.primary_400}]}>
                    Không tìm thấy địa điểm nào
                  </TextBase>
                </View>
              )}
            />
          </View>
        </BottomSheet>
      </Page>
    );
  }
}
