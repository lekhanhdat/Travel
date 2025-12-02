import React from 'react';
import {ScrollView, View, Image, FlatList, TouchableOpacity, StyleSheet, Modal, Dimensions} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import {BackSvg, Clock, CardSvg, ThunderSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import {IFestival, IFestivalReview} from '../../../services/festivals.api';
import {IReview} from '../../../common/types';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import ReviewItem from '../../../component/ReviewItem';
import festivalsApi from '../../../services/festivals.api';
import {StarActive, StarInActive} from '../../../assets/assets/ImageSvg';
import {MapSvg} from '../../../assets/ImageSvg';
import {ScreenName} from '../../AppContainer';
import {Button} from 'react-native-paper';
import SimilarItemsComponent from '../../../component/SimilarItemsComponent';

interface IDetailFestivalScreenProps {
  navigation: any;
}

interface IDetailFestivalScreenState {
  allFestivals: IFestival[];
  showImageModal: boolean;
  selectedImageIndex: number;
}

export default class DetailFestivalScreen extends React.PureComponent<
  IDetailFestivalScreenProps,
  IDetailFestivalScreenState
> {
  constructor(props: IDetailFestivalScreenProps) {
    super(props);
    this.state = {
      allFestivals: [],
      showImageModal: false,
      selectedImageIndex: 0,
    };
  }

  async componentDidMount() {
    // Load all festivals để filter theo types
    const festivals = await festivalsApi.getFestivals();
    this.setState({ allFestivals: festivals });
  }

  // Convert IFestivalReview to IReview for ReviewItem component
  convertToReview = (festivalReview: IFestivalReview): IReview => {
    return {
      id: festivalReview.id,
      content: festivalReview.content,
      name_user_review: festivalReview.name_user_review,
      fullName: festivalReview.fullName,
      time_review: festivalReview.time_review,
      start: festivalReview.start,
      avatar: festivalReview.avatar,
      images: festivalReview.images,
    };
  };

  renderReviewItem = ({item, index}: {item: IFestivalReview; index: number}) => {
    const review = this.convertToReview(item);
    return <ReviewItem review={review} />;
  };

  // Tính rating trung bình
  calculateAverageRating = (reviews: IFestivalReview[]) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.start, 0);
    return sum / reviews.length;
  };

  // Tìm các lễ hội có cùng types (tối đa 10 festivals)
  getSimilarFestivals = (currentFestival: IFestival) => {
    const currentTypes = currentFestival.types || [];

    if (currentTypes.length === 0) {
      console.log('⚠️ Current festival has no types');
      return [];
    }

    // Filter festivals có ít nhất 1 type trùng với current festival
    const similarFestivals = this.state.allFestivals.filter(fest => {
      const festTypes = fest.types || [];

      // Không include chính festival hiện tại
      if (fest.Id === currentFestival.Id) {
        return false;
      }

      // Check xem có type nào trùng không
      const hasCommonType = festTypes.some(type => currentTypes.includes(type));
      return hasCommonType;
    });

    // Chỉ lấy 10 festivals đầu tiên
    const limitedFestivals = similarFestivals.slice(0, 10);

    console.log(`🔍 Found ${similarFestivals.length} similar festivals, showing ${limitedFestivals.length}`);
    return limitedFestivals;
  };

  render(): React.ReactNode {
    const festival: IFestival = this.props.navigation.state.params?.festival;
    
    // Get first image or use placeholder
    const festivalImage = festival.images && festival.images.length > 0 
      ? festival.images[0] 
      : 'https://via.placeholder.com/400x200?text=Festival';

    const avgRating = this.calculateAverageRating(festival.reviews);

    return (
      <Page>
        <HeaderBase
          title={'Chi tiết lễ hội'}
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
        />
        <View style={{flex: 1, backgroundColor: colors.primary_200}}>
          <ScrollView>
            <Image
              source={{uri: festivalImage}}
              style={{
                width: sizes.width,
                height: sizes._200sdp,
              }}
            />

            <View style={{flex: 1, padding: sizes._16sdp}}>
              <TextBase style={[AppStyle.txt_20_bold, {textAlign: 'center'}]}>
                {festival.name}
              </TextBase>

              {/* Average Rating Display */}
              {festival.reviews && festival.reviews.length > 0 && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: sizes._12sdp,
                }}>
                  {Array.from([1, 2, 3, 4, 5]).map((i) => {
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
                    {avgRating.toFixed(1)} ({festival.reviews.length} đánh giá)
                  </TextBase>
                </View>
              )}

              {/* Description */}
              <TextBase
                style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._12sdp, textAlign: 'justify'}]}>
                {festival.description}
              </TextBase>

              {/* Event Time */}
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                <Clock
                  width={sizes._20sdp}
                  height={sizes._20sdp}
                  color={colors.primary}
                />
                <TextBase
                  style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                  Thời gian: {festival.event_time}
                </TextBase>
              </View>

              {/* Location */}
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                <MapSvg
                  width={sizes._20sdp}
                  height={sizes._20sdp}
                  color={colors.primary}
                />
                <TextBase
                  style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                  Địa điểm: {festival.location}
                </TextBase>
              </View>

              {/* Price Level */}
              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                <CardSvg
                  width={sizes._20sdp}
                  height={sizes._20sdp}
                  color={colors.primary}
                />
                <TextBase
                  style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                  Phí: {festival.price_level === 0 ? 'Miễn phí' :
                       festival.price_level === 1 ? 'Có phí' : 'Cao cấp'}
                  {festival.ticket_info && ` (${festival.ticket_info})`}
                </TextBase>
              </View>

              {/* Advise Section */}
              {festival.advise && festival.advise.length > 0 && (
                <View style={{marginTop: sizes._12sdp}}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <ThunderSvg
                      width={sizes._20sdp}
                      height={sizes._20sdp}
                      color={colors.primary}
                    />
                    <TextBase style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp}]}>
                      Lời khuyên:
                    </TextBase>
                  </View>
                  {festival.advise.map((advice, index) => (
                    <TextBase
                      key={`advice-${index}`}
                      style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._4sdp, marginLeft: sizes._28sdp, textAlign: 'justify'}]}>
                      • {advice}
                    </TextBase>
                  ))}
                </View>
              )}

              {/* Festival Images Gallery */}
              {festival.images && festival.images.length > 0 && (
                <View style={{marginTop: sizes._16sdp}}>
                  <TextBase style={[AppStyle.txt_20_bold, {marginBottom: sizes._12sdp}]}>
                    Hình ảnh lễ hội
                  </TextBase>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{marginBottom: sizes._8sdp}}
                  >
                    {festival.images.map((imageUrl, index) => (
                      <TouchableOpacity
                        key={`festival-image-${index}`}
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

              {/* Buttons: Lễ hội tương tự */}
              <View style={{
                marginTop: sizes._16sdp,
              }}>
                <Button
                  mode="outlined"
                  icon="calendar-search"
                  onPress={() => {
                    const similarFestivals = this.getSimilarFestivals(festival);
                    if (similarFestivals.length > 0) {
                      NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
                        title: 'Lễ hội tương tự',
                        festivals: similarFestivals,
                        valueSearch: '', // Không cần search
                      });
                    } else {
                      console.log('⚠️ No similar festivals found');
                      // TODO: Show toast/alert to user
                    }
                  }}
                  style={{
                    borderColor: colors.primary,
                    borderWidth: 2,
                  }}
                  labelStyle={{
                    fontSize: 14,
                    color: colors.primary,
                  }}
                >
                  Lễ hội tương tự
                </Button>
              </View>

              {/* Semantic Similar Items from Backend */}
              {festival.Id && (
                <SimilarItemsComponent
                  entityType="festival"
                  entityId={festival.Id}
                  title="Lễ hội tương tự (AI gợi ý)"
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
                {'Nhận xét của du khách:'}
              </TextBase>

              <FlatList
                data={festival.reviews}
                scrollEnabled={false}
                renderItem={this.renderReviewItem}
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
            {festival.images && festival.images.length > 1 && (
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
                  {this.state.selectedImageIndex + 1} / {festival.images.length}
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
              {festival.images && festival.images.map((imageUrl, index) => (
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

