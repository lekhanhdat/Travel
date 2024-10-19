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
        <View style={{ flexDirection: 'row', alignItems: 'center', width: sizes.width - sizes._32sdp, marginBottom: sizes._12sdp }}>
          <Image source={{ uri: review.avatar }} style={{ width: sizes._36sdp, height: sizes._36sdp, borderRadius: 99 }} />
          <TextBase style={[AppStyle.txt_18_regular, { marginLeft: sizes._8sdp}]}>
            {review.name_user_review ?? '-'}
          </TextBase>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: sizes._8sdp }}>
          {
            arrStar.slice(0, review.start).map(star => {
              return (
                <StarActive width={sizes._24sdp} height={sizes._24sdp} color={colors.primary} />
              )
            })
          }
          <View style={{ flex: 1 }} />
          <TextBase style={[AppStyle.txt_16_regular, { marginTop: sizes._12sdp }]}>{review.time_review}</TextBase>
          {
            arrStar.slice(0, 5 - review.start).map(star => {
              return (
                <StarInActive width={sizes._24sdp} height={sizes._24sdp} color={colors.primary_950} />
              )
            })
          }
        </View>

        <TextBase style={[AppStyle.txt_18_regular]}>{review.content}</TextBase>
        
        {
          this.props.isShowLocation &&
          <TextBase style={[AppStyle.txt_16_regular, { marginTop: sizes._12sdp }]}>{`Địa điểm: ${review.location?.name}`}</TextBase>
        }

        <View style={{ width: '100%', height: 2, backgroundColor: colors.primary, marginTop: sizes._16sdp }} />
      </View>
    );
  }
}