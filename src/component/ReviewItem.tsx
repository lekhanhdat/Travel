import React from 'react';
import {Image, View, ScrollView} from 'react-native';
import {IReview} from '../common/types';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import {StarActive} from '../assets/assets/ImageSvg';
import colors from '../common/colors';

interface IReviewItemProps {
  review: IReview;
  isShowLocation?: boolean;
}

interface IReviewItemState {}

const arrStar = [1, 1, 1, 1, 1];

export default class ReviewItem extends React.PureComponent<
  IReviewItemProps,
  IReviewItemState
> {
  constructor(props: IReviewItemProps) {
    super(props);
    this.state = {};
  }

  componentDidMount(): void {
    // Debug: Log review images
    if (this.props.review.images && this.props.review.images.length > 0) {
      console.log('📸 ReviewItem - Review has images:', {
        reviewId: this.props.review.id,
        imagesCount: this.props.review.images.length,
        images: this.props.review.images,
        imagesType: typeof this.props.review.images,
        isArray: Array.isArray(this.props.review.images),
      });
    }
  }

  render(): React.ReactNode {
    const {review} = this.props;
    return (
      <View style={{marginBottom: sizes._16sdp}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: sizes.width - sizes._32sdp,
            marginBottom: sizes._12sdp,
          }}>
          <Image
            source={{uri: review.avatar}}
            style={{
              width: sizes._36sdp,
              height: sizes._36sdp,
              borderRadius: 99,
            }}
          />
          <TextBase
            style={[AppStyle.txt_18_regular, {marginLeft: sizes._8sdp}]}>
            {review.name_user_review ?? '-'}
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
            {review.images.map((imageUrl, index) => {
              // Debug: Log each image URL
              console.log(`📸 ReviewItem - Rendering image ${index}:`, imageUrl);

              return (
                <Image
                  key={index}
                  source={{uri: imageUrl}}
                  style={{
                    width: sizes._100sdp,
                    height: sizes._100sdp,
                    borderRadius: sizes._8sdp,
                    marginRight: sizes._8sdp,
                    backgroundColor: colors.primary_100, // Placeholder color
                  }}
                  onError={(error) => {
                    console.error(`❌ ReviewItem - Image load error ${index}:`, error.nativeEvent.error);
                  }}
                  onLoad={() => {
                    console.log(`✅ ReviewItem - Image loaded ${index}:`, imageUrl.substring(0, 50) + '...');
                  }}
                />
              );
            })}
          </ScrollView>
        )}

        {this.props.isShowLocation && (
          <TextBase
            style={[
              AppStyle.txt_16_regular,
              {marginTop: sizes._12sdp},
            ]}>{`Địa điểm: ${review.location?.name}`}</TextBase>
        )}

        <View
          style={{
            width: '100%',
            height: 2,
            backgroundColor: colors.primary_200,
            marginTop: sizes._16sdp,
          }}
        />
      </View>
    );
  }
}
