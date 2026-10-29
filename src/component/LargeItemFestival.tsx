import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {IFestival} from '../services/festivals.api';
import festivalsApi from '../services/festivals.api';
import sizes from '../common/sizes';
import colors from '../common/colors';
import {AppStyle} from '../common/AppStyle';
import TextBase from '../common/TextBase';
import {ScreenName} from '../container/AppContainer';
import NavigationService from '../container/screens/NavigationService';
import {translateFestivalField} from '../utils/translationHelpers';
import {catalogImage} from '../utils/catalogDisplay';
import CachedImage from './CachedImage';

interface ILargeItemFestivalProps {
  festival: IFestival;
  onPress?: () => void;
}

const LargeItemFestival: React.FC<ILargeItemFestivalProps> = ({festival, onPress}) => {
  const {t} = useTranslation('common');

  const festivalId = festival.Id;
  const translatedName = festivalId
    ? translateFestivalField(t, festivalId, 'name', festival.name)
    : festival.name;
  const translatedLocation = festivalId
    ? translateFestivalField(t, festivalId, 'location', festival.location)
    : festival.location;
  const translatedEventTime = festivalId
    ? translateFestivalField(t, festivalId, 'event_time', festival.event_time)
    : festival.event_time;


  // Calculate rating from reviews instead of using static rating field
  const avgRating = festivalsApi.calculateAverageRating(festival.reviews);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        NavigationService.navigate(ScreenName.DETAIL_FESTIVAL_SCREEN, {
          festival: festival,
        });
      }}>
      <View style={styles.rowCenter}>
        <CachedImage
          uri={catalogImage(festival)}
          style={{
            height: sizes.width * 0.25,
            width: sizes.width * 0.25,
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
            {translatedName}
          </TextBase>

          {translatedEventTime ? (
            <TextBase
              numberOfLines={1}
              style={[AppStyle.txt_14_regular, {marginTop: sizes._4sdp}]}>
              ⏰ {translatedEventTime}
            </TextBase>
          ) : null}

          {/* Festivals without location_id have no venue line. */}
          {translatedLocation ? (
            <TextBase
              numberOfLines={1}
              style={[AppStyle.txt_14_regular, {marginTop: sizes._4sdp}]}>
              📍 {translatedLocation}
            </TextBase>
          ) : null}

          {festival.reviews?.length > 0 ? (
            <View style={{flexDirection: 'row', marginTop: sizes._4sdp}}>
              <TextBase style={[AppStyle.txt_14_bold]}>
                ⭐ {avgRating.toFixed(1)}
              </TextBase>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

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

export default LargeItemFestival;

