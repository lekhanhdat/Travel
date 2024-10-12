import React from 'react';
import { Image, View } from 'react-native';
import { IReview } from '../common/types';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import { AppStyle } from '../common/AppStyle';
import { StarActive, StarInActive } from '../assets/assets/ImageSvg';
import colors from '../common/colors';

interface IReviewItemProps {
  review: IReview;
  isShowLocation?: boolean;
}

interface IReviewItemState {

}

const arrStar = [1, 1, 1, 1, 1]

export default class ReviewItem extends React.PureComponent<IReviewItemProps, IReviewItemState> {
  constructor(props: IReviewItemProps) {
    super(props);
    this.state = {
    }
  }
  render(): React.ReactNode {
    const { review } = this.props;
    return (
      <View style={{ marginBottom: sizes._16sdp }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: sizes.width - sizes._32sdp, marginBottom: sizes._8sdp }}>
          <Image source={{ uri: review.avatar }} style={{ width: sizes._30sdp, height: sizes._30sdp, borderRadius: 99 }} />
          <TextBase style={[AppStyle.txt_16_regular, { marginLeft: sizes._8sdp}]}>
            {review.name_user_review ?? '-'}
          </TextBase>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: sizes._8sdp }}>
          {
            arrStar.slice(0, review.start).map(star => {
              return (
                <StarActive width={sizes._20sdp} height={sizes._20sdp} color={colors.primary} />
              )
            })
          }
          {
            arrStar.slice(0, 5 - review.start).map(star => {
              return (
                <StarInActive width={sizes._20sdp} height={sizes._20sdp} color={colors.primary_950} />
              )
            })
          }
        </View>

        <TextBase style={[AppStyle.txt_16_regular]}>{review.content}</TextBase>
        <TextBase style={[AppStyle.txt_14_regular, { marginTop: sizes._8sdp }]}>{review.time_review}</TextBase>
        {
          this.props.isShowLocation &&
          <TextBase style={[AppStyle.txt_14_regular, { marginTop: sizes._8sdp }]}>{`Địa điểm: ${review.location?.name}`}</TextBase>
        }

        <View style={{ width: '100%', height: 1, backgroundColor: colors.primary, marginTop: sizes._16sdp }} />
      </View>
    );
  }
}