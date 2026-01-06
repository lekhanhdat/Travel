import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ILocation} from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import {AppStyle} from '../common/AppStyle';
import TextBase from '../common/TextBase';
import {ScreenName} from '../container/AppContainer';
import NavigationService from '../container/screens/NavigationService';
import CachedImage from './CachedImage';
import {translateLocationField} from '../utils/translationHelpers';

interface ILargeItemLocationProps {
  location: ILocation;
  onPress?: () => void;
}

const LargeItemLocation: React.FC<ILargeItemLocationProps> = ({location, onPress}) => {
  const {t} = useTranslation(['common', 'locations']);

  const locationId = location.Id || location.id;
  const translatedName = locationId
    ? translateLocationField(t, locationId, 'name', location.name)
    : location.name;
  const translatedDescription = locationId
    ? translateLocationField(t, locationId, 'description', location.description)
    : location.description;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {
          location: location,
        });
      }}>
      <View style={styles.rowCenter}>
        <CachedImage
          uri={location.avatar}
          style={{
            height: sizes.width * 0.25,
            width: sizes.width * 0.25,
            marginRight: sizes._16sdp,
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
          <TextBase
            numberOfLines={3}
            style={[AppStyle.txt_14_regular, {marginTop: sizes._8sdp}]}>
            {translatedDescription}
          </TextBase>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor: '#F7F2E5',
    backgroundColor: colors.primary_200,
    marginBottom: sizes._16sdp,
    borderRadius: sizes._16sdp,
    overflow: 'hidden',
    elevation: 5,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default LargeItemLocation;
