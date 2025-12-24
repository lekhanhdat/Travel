import React from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {IFestival} from '../services/festivals.api';
import festivalsApi from '../services/festivals.api';
import sizes from '../common/sizes';
import colors from '../common/colors';
import {AppStyle} from '../common/AppStyle';
import TextBase from '../common/TextBase';
import {ScreenName} from '../container/AppContainer';
import NavigationService from '../container/screens/NavigationService';

interface ILargeItemFestivalProps {
  festival: IFestival;
  onPress?: () => void;
}

interface ILargeItemFestivalState {}

export default class LargeItemFestival extends React.PureComponent<
  ILargeItemFestivalProps,
  ILargeItemFestivalState
> {
  constructor(props: ILargeItemFestivalProps) {
    super(props);
    this.state = {};
  }

  render(): React.ReactNode {
    const {festival} = this.props;

    // Get first image or use placeholder
    const festivalImage = festival.images && festival.images.length > 0
      ? festival.images[0]
      : 'https://via.placeholder.com/200x200?text=Festival';

    // Calculate rating from reviews instead of using static rating field
    const avgRating = festivalsApi.calculateAverageRating(festival.reviews);

    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          if (this.props.onPress) {
            this.props.onPress();
            return;
          }
          NavigationService.navigate(ScreenName.DETAIL_FESTIVAL_SCREEN, {
            festival: festival,
          });
        }}>
        <View style={styles.rowCenter}>
          <Image
            source={{uri: festivalImage}}
            style={{
              height: sizes.width * 0.25,
              width: sizes.width * 0.25,
              resizeMode: 'cover',
              marginRight: sizes._16sdp,
              borderRadius: sizes._8sdp,
            }}
          />
          <View
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              marginRight: sizes._16sdp,
            }}>
            <TextBase
              numberOfLines={1}
              ellipsizeMode="tail"
              style={AppStyle.txt_18_bold}>
              {festival.name}
            </TextBase>

            <TextBase
              numberOfLines={1}
              style={[AppStyle.txt_14_regular, {marginTop: sizes._4sdp}]}>
              ⏰ {festival.event_time}
            </TextBase>

            <TextBase
              numberOfLines={1}
              style={[AppStyle.txt_14_regular, {marginTop: sizes._4sdp}]}>
              📍 {festival.location}
            </TextBase>

            <View style={{flexDirection: 'row', marginTop: sizes._4sdp}}>
              <TextBase style={[AppStyle.txt_14_bold]}>
                ⭐ {avgRating.toFixed(1)}
              </TextBase>
              <TextBase
                style={[
                  AppStyle.txt_14_regular,
                  {marginLeft: sizes._8sdp, color: colors.primary_600},
                ]}>
                {festival.price_level === 0
                  ? '🆓 Miễn phí'
                  : festival.price_level === 1
                  ? '💰 Có phí'
                  : '💰💰 Cao cấp'}
              </TextBase>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary_200,
    marginBottom: sizes._16sdp,
    borderRadius: sizes._16sdp,
    overflow: 'hidden',
    elevation: 5,
    padding: sizes._12sdp,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

