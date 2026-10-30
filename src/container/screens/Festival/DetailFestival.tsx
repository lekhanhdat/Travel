import FEATURE_FLAGS from '../../../config/featureFlags';
import React from 'react';
import CatalogStatus from '../../../component/CatalogStatus';
import {ScrollView, View, Image, FlatList, TouchableOpacity, StyleSheet, Modal, Dimensions} from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg, Clock, CardSvg, ThunderSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import festivalsApi, {IFestival, IFestivalReview} from '../../../services/festivals.api';
import {ILocation, IReview} from '../../../common/types';
import TextBase from '../../../common/TextBase';
import {AppStyle} from '../../../common/AppStyle';
import ReviewItem from '../../../component/ReviewItem';
import {StarActive, StarInActive} from '../../../assets/assets/ImageSvg';
import {MapSvg, CalendarSearchSvg} from '../../../assets/ImageSvg';
import {ScreenName} from '../../AppContainer';
import {Button} from 'react-native-paper';
import SimilarItemsComponent from '../../../component/SimilarItemsComponent';
import {
  withAzureTranslation,
  WithAzureTranslationProps,
} from '../../../hoc/withAzureTranslation';
import { translateFestivalField } from '../../../utils/translationHelpers';
import catalogRepository from '../../../services/catalogRepository';
import { catalogImage } from '../../../utils/catalogDisplay';
import CachedImage from '../../../component/CachedImage';

interface IDetailFestivalScreenProps extends WithAzureTranslationProps {
  navigation: any;
  route: any;
}

interface IDetailFestivalScreenState {
  catalogError: boolean;
  allFestivals: IFestival[];
  /** Linked location from location_id, resolved via the repository index. */
  venue: ILocation | null;
  showImageModal: boolean;
  selectedImageIndex: number;
  reviews: IFestivalReview[] | null; // P7: GET /reviews?festival_id (null until loaded)
}

class DetailFestivalScreen extends React.PureComponent<
  IDetailFestivalScreenProps,
  IDetailFestivalScreenState
> {
  constructor(props: IDetailFestivalScreenProps) {
    super(props);
    this.state = {
      catalogError: false,
      allFestivals: [],
      venue: null,
      showImageModal: false,
      selectedImageIndex: 0,
      reviews: null,
    };
  }

  componentDidMount() {
    // P1: if (FEATURE_FLAGS.RECOVERY_MODE) {return;}
    this.loadCatalog();
    this.loadReviews();
  }

  loadReviews = async () => {
    const festival: IFestival | undefined = this.props.route?.params?.festival;
    if (!festival) {return;}
    try {
      this.setState({reviews: await festivalsApi.getReviews(festival.id)});
    } catch {
      this.setState({reviews: []});
    }
  };

  loadCatalog = async (forceRefresh = false) => {
    this.setState({catalogError: false});
    try {
      const {festivals, locationById} = await catalogRepository.get(forceRefresh);
      const festival: IFestival | undefined = this.props.route?.params?.festival;
      const venue = festival?.location_id != null ? locationById.get(festival.location_id) ?? null : null;
      this.setState({allFestivals: festivals, venue});
    } catch {
      this.setState({catalogError: true});
    }
  };

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
    if (!reviews || reviews.length === 0) {return 0;}
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
      if (fest.id === currentFestival.id) {
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
    const festival: IFestival = this.props.route.params?.festival;
    const {t} = this.props;

    const festivalId = festival.id;
    const translatedName = festivalId
      ? translateFestivalField(t, festivalId, 'name', festival.name)
      : festival.name;
    const translatedDescription = festivalId
      ? translateFestivalField(t, festivalId, 'description', festival.description)
      : festival.description;
    const translatedLocation = festivalId
      ? translateFestivalField(t, festivalId, 'location', festival.location)
      : festival.location;
    const translatedEventTime = festivalId
      ? translateFestivalField(t, festivalId, 'event_time', festival.event_time)
      : festival.event_time;
    const translatedTicketInfo = festivalId && festival.ticket_info
      ? translateFestivalField(t, festivalId, 'ticket_info', festival.ticket_info)
      : festival.ticket_info;


    // P7: fresh reviews when loaded, otherwise the catalog's BE-computed rating/review_count.
    const reviews = this.state.reviews;
    const avgRating = reviews ? this.calculateAverageRating(reviews) : festival.rating ?? 0;
    const reviewCount = reviews ? reviews.length : festival.review_count ?? 0;

    return (
      <Page>
        <HeaderBase
          title={t('detail.festivalDetail')}
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
        <CatalogStatus loading={false} error={this.state.catalogError}
          onRetry={() => this.loadCatalog(true)} />
        <View style={{flex: 1, backgroundColor: colors.primary_200}}>
          <ScrollView>
            <CachedImage
              uri={catalogImage(festival)}
              style={{
                width: sizes.width,
                height: sizes._200sdp,
              }}
            />

            <View style={{flex: 1, padding: sizes._16sdp}}>
              <TextBase style={[AppStyle.txt_20_bold, {textAlign: 'center'}]}>
                {translatedName}
              </TextBase>

              {/* Average Rating Display */}
              {reviewCount > 0 && (
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
                    {avgRating.toFixed(1)} ({reviewCount})
                  </TextBase>
                </View>
              )}

              {/* Description */}
              <TextBase
                style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._12sdp, textAlign: 'justify'}]}>
                {translatedDescription}
              </TextBase>

              {/* Event Time */}
              {translatedEventTime ? (
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                  <Clock
                    width={sizes._20sdp}
                    height={sizes._20sdp}
                    color={colors.primary}
                  />
                  <TextBase
                    style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                    {t('detail.eventTime')}: {translatedEventTime}
                  </TextBase>
                </View>
              ) : null}

              {/* Location: hidden when the festival has no location_id */}
              {festival.location_id !== null && translatedLocation ? (
                <TouchableOpacity
                  disabled={!this.state.venue}
                  accessibilityRole="link"
                  onPress={() => {
                    if (this.state.venue) {
                      NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {location: this.state.venue});
                    }
                  }}
                  style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                  <MapSvg
                    width={sizes._20sdp}
                    height={sizes._20sdp}
                    color={colors.primary}
                  />
                  <TextBase
                    style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                    {t('detail.location')}: {translatedLocation}
                  </TextBase>
                  {this.state.venue ? (
                    <TextBase style={[AppStyle.txt_14_bold, {color: colors.primary, marginLeft: sizes._8sdp}]}>
                      {t('detail.viewLocation')} ›
                    </TextBase>
                  ) : null}
                </TouchableOpacity>
              ) : null}

              {/* Ticket information */}
              {translatedTicketInfo ? <View style={{flexDirection: 'row', alignItems: 'center', marginTop: sizes._12sdp}}>
                <CardSvg
                  width={sizes._20sdp}
                  height={sizes._20sdp}
                  color={colors.primary}
                />
                <TextBase
                  style={[AppStyle.txt_16_medium_detail, {marginLeft: sizes._8sdp, flex: 1, textAlign: 'justify'}]}>
                  {t('detail.fee')}: {translatedTicketInfo}
                </TextBase>
              </View> : null}

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
                      {t('detail.advice')}:
                    </TextBase>
                  </View>
                  {festival.advise.map((advice, index) => {
                    const translatedAdvice = festivalId
                      ? translateFestivalField(t, festivalId, 'advise', advice, index)
                      : advice;
                    return (
                      <TextBase
                        key={`advice-${index}`}
                        style={[AppStyle.txt_16_medium_detail, {marginTop: sizes._4sdp, marginLeft: sizes._28sdp, textAlign: 'justify'}]}>
                        • {translatedAdvice}
                      </TextBase>
                    );
                  })}
                </View>
              )}

              {/* Festival Images Gallery */}
              {festival.images && festival.images.length > 0 && (
                <View style={{marginTop: sizes._16sdp}}>
                  <TextBase style={[AppStyle.txt_20_bold, {marginBottom: sizes._12sdp}]}>
                    {t('detail.festivalImages')}
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

              {/* Buttons: Similar Festivals */}
              <View style={{
                marginTop: sizes._16sdp,
              }}>
                <TouchableOpacity
                  onPress={() => {
                    const similarFestivals = this.getSimilarFestivals(festival);
                    if (similarFestivals.length > 0) {
                      NavigationService.navigate(ScreenName.VIEW_ALL_FESTIVALS, {
                        title: t('detail.similarFestivals'),
                        festivals: similarFestivals,
                        valueSearch: '',
                      });
                    } else {
                      console.log('⚠️ No similar festivals found');
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: colors.primary,
                    borderWidth: 2,
                    paddingVertical: sizes._12sdp,
                    paddingHorizontal: sizes._16sdp,
                    borderRadius: sizes._8sdp,
                    gap: sizes._8sdp,
                  }}
                >
                  <CalendarSearchSvg
                    width={sizes._20sdp}
                    height={sizes._20sdp}
                    color={colors.primary}
                  />
                  <TextBase style={{fontSize: 14, color: colors.primary, fontWeight: '500'}}>
                    {t('detail.similarFestivals')}
                  </TextBase>
                </TouchableOpacity>
              </View>

              {/* Semantic Similar Items from Backend */}
              {FEATURE_FLAGS.ENABLE_AI && (
                <SimilarItemsComponent
                  entityType="festival"
                  entityId={festival.id}
                  title={t('detail.similarFestivalsAI')}
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
                data={reviews ?? []}
                scrollEnabled={false}
                renderItem={this.renderReviewItem}
                keyExtractor={(item, index) => index.toString() + item.id}
                ListEmptyComponent={
                  <TextBase style={[AppStyle.txt_16_regular, {textAlign: 'center'}]}>
                    {t('detail.noReviews')}
                  </TextBase>
                }
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

export default withAzureTranslation(DetailFestivalScreen);
