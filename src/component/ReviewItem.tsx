import React from 'react';
import {Image, View, ScrollView, TouchableOpacity, Modal, Dimensions, Alert} from 'react-native';
import Toast from 'react-native-toast-message';
import {IReview} from '../common/types';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import {StarActive} from '../assets/assets/ImageSvg';
import colors from '../common/colors';
import {Avatar, getReviewAuthorName} from '../utils/avatarUtils';
import CachedImage from './CachedImage';
import reviewsApi from '../services/reviews.api';
import {requireLogin} from '../utils/requireLogin';

interface IReviewItemProps {
  review: IReview;
  isShowLocation?: boolean;
  /** Signed-in account: its own reviews show "Xóa" instead of "Báo cáo". */
  currentAccountId?: number;
  onDeleted?: (reviewId: number) => void;
}

interface IReviewItemState {
  showImageModal: boolean;
  selectedImageIndex: number;
}

const arrStar = [1, 1, 1, 1, 1];

export default class ReviewItem extends React.PureComponent<
  IReviewItemProps,
  IReviewItemState
> {
  constructor(props: IReviewItemProps) {
    super(props);
    this.state = {
      showImageModal: false,
      selectedImageIndex: 0,
    };
  }

  componentDidMount(): void {
    // Debug: Log review images (only in development)
    if (__DEV__ && this.props.review.images && this.props.review.images.length > 0) {
      console.log('📸 ReviewItem - Review has images:', {
        reviewId: this.props.review.id,
        imagesCount: this.props.review.images.length,
      });
    }
  }

  // P7 (Play UGC policy): any signed-in user can report a review; several reports hide it on the BE.
  handleReport = async () => {
    if (!(await requireLogin())) {return;}
    Alert.alert('Báo cáo đánh giá', 'Đánh giá này có nội dung không phù hợp?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Báo cáo', style: 'destructive', onPress: async () => {
        try {
          const message = await reviewsApi.report(this.props.review.id);
          Toast.show({type: 'success', text1: message});
        } catch (error: any) {
          Toast.show({type: 'error', text1: error?.message || 'Không thể gửi báo cáo'});
        }
      }},
    ]);
  };

  handleDelete = () => {
    Alert.alert('Xóa đánh giá', 'Bạn chắc chắn muốn xóa đánh giá này?', [
      {text: 'Hủy', style: 'cancel'},
      {text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await reviewsApi.remove(this.props.review.id);
          this.props.onDeleted?.(this.props.review.id);
          Toast.show({type: 'success', text1: 'Đã xóa đánh giá'});
        } catch (error: any) {
          Toast.show({type: 'error', text1: error?.message || 'Không thể xóa đánh giá'});
        }
      }},
    ]);
  };

  render(): React.ReactNode {
    const {review, currentAccountId} = this.props;
    const isOwn = currentAccountId !== undefined && review.accountId === currentAccountId;
    return (
      <View style={{marginBottom: sizes._16sdp}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: sizes.width - sizes._32sdp,
            marginBottom: sizes._12sdp,
          }}>
          <Avatar avatarUrl={review.avatar} size={sizes._36sdp} />
          <TextBase
            style={[AppStyle.txt_18_regular, {marginLeft: sizes._8sdp}]}>
            {getReviewAuthorName(review)}
          </TextBase>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: sizes._8sdp,
          }}>
          {/* Chỉ hiển thị số sao được chọn */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {arrStar.slice(0, review.start).map((star, index) => {
              return (
                <StarActive
                  key={index}
                  width={sizes._24sdp}
                  height={sizes._24sdp}
                  color={colors.primary}
                />
              );
            })}
          </View>

          <TextBase style={[AppStyle.txt_16_regular]}>
            {review.time_review}
          </TextBase>
        </View>

        <TextBase style={[AppStyle.txt_18_regular]}>{review.content}</TextBase>

        {/* Display review images */}
        {review.images && review.images.length > 0 && (
          <ScrollView
            horizontal
            style={{
              marginTop: sizes._12sdp,
              marginBottom: sizes._8sdp,
            }}
            showsHorizontalScrollIndicator={false}
          >
            {review.images.map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  this.setState({
                    showImageModal: true,
                    selectedImageIndex: index,
                  });
                }}
                activeOpacity={0.8}
              >
                <CachedImage
                  uri={imageUrl}
                  style={{
                    width: sizes._100sdp,
                    height: sizes._100sdp,
                    borderRadius: sizes._8sdp,
                    marginRight: sizes._8sdp,
                  }}
                  placeholderColor={colors.primary_100}
                  showLoader={false}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {this.props.isShowLocation && (review.location || review.festival) && (
          <TextBase
            style={[
              AppStyle.txt_16_regular,
              {marginTop: sizes._12sdp},
            ]}>{review.location ? `Địa điểm: ${review.location.name}` : `Lễ hội: ${review.festival?.name}`}</TextBase>
        )}

        <TouchableOpacity
          onPress={isOwn ? this.handleDelete : this.handleReport}
          style={{alignSelf: 'flex-end', marginTop: sizes._8sdp}}>
          <TextBase style={[AppStyle.txt_14_regular, {color: colors.primary_400}]}>
            {isOwn ? 'Xóa' : 'Báo cáo'}
          </TextBase>
        </TouchableOpacity>

        <View
          style={{
            width: '100%',
            height: 2,
            backgroundColor: colors.primary_200,
            marginTop: sizes._16sdp,
          }}
        />

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
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
            {review.images && review.images.length > 1 && (
              <View
                style={{
                  position: 'absolute',
                  top: sizes._40sdp,
                  left: sizes._20sdp,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: sizes._16sdp,
                  paddingHorizontal: sizes._12sdp,
                  paddingVertical: sizes._6sdp,
                }}
              >
                <TextBase style={{color: colors.white, fontSize: 16}}>
                  {this.state.selectedImageIndex + 1} / {review.images.length}
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
              {review.images && review.images.map((imageUrl, index) => (
                <View
                  key={index}
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
      </View>
    );
  }
}
