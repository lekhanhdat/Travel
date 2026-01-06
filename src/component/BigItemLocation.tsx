import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ILocation} from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';
import CachedImage from './CachedImage';
import {translateLocationField} from '../utils/translationHelpers';

interface IBigItemLocationProps {
  location: ILocation;
  onPress?: () => void;
}

const BigItemLocation: React.FC<IBigItemLocationProps> = ({location, onPress}) => {
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
      <CachedImage
        uri={location.avatar}
        style={styles.icon}
      />
      <View
        style={{
          paddingVertical: sizes._12sdp,
          paddingHorizontal: sizes._16sdp,
        }}>
        <TextBase numberOfLines={1} style={[AppStyle.txt_20_bold]}>
          {translatedName}
        </TextBase>
        <TextBase
          numberOfLines={3}
          style={[AppStyle.txt_16_regular, {marginTop: sizes._8sdp}]}>
          {translatedDescription}
        </TextBase>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: sizes._16sdp,
    // backgroundColor: '#F7F2E5',
    backgroundColor: colors.primary_200,
    marginRight: sizes._16sdp,
    borderRadius: sizes._16sdp,
    overflow: 'hidden',
    maxWidth: sizes.width * 0.8,
    elevation: 7, // Tạo độ cao đổ bóng trên Android
    shadowColor: '#000', // Màu của bóng
    shadowOffset: {width: 2, height: 2}, // Vị trí bóng (ngang, dọc)
    shadowOpacity: 0.25, // Độ mờ của bóng
    shadowRadius: 3.84, // Độ lớn của bóng
  },
  icon: {
    // width: sizes._210sdp,
    // height: sizes._112sdp,
    height: sizes._160sdp,
    width: '100%',
  },
});

export default BigItemLocation;
