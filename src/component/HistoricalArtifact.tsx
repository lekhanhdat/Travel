import React from 'react';
import {StyleSheet, TouchableOpacity, Image, View} from 'react-native';
import {ILocation} from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';
import {Card, Text, Button} from 'react-native-paper';
import { size } from 'lodash';

interface IHistoricalArtifactProps {
  location: ILocation;
}

interface IHistoricalArtifactState {}

export default class HistoricalArtifact extends React.PureComponent<
  IHistoricalArtifactProps,
  IHistoricalArtifactState
> {
  constructor(props: IHistoricalArtifactProps) {
    super(props);
    this.state = {};
  }
  render(): React.ReactNode {
    const {location} = this.props;
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {
            location: location,
          });
        }}>
        <Image
          source={{uri: location.avatar}}
          style={styles.icon}
          onError={() => {
            console.log('errr', location.avatar);
          }}
        />
        <View
          style={{
            paddingVertical: sizes._12sdp,
            paddingHorizontal: sizes._16sdp,
          }}>
          <TextBase
            numberOfLines={1}
            style={[AppStyle.txt_20_bold]}>
            {`${location.name}`}
          </TextBase>
          <TextBase
            numberOfLines={2}
            style={[AppStyle.txt_16_regular, {marginTop: sizes._8sdp}]}>
            {location.description}
          </TextBase>
        </View>
      </TouchableOpacity>
    );

  }
}

const styles = StyleSheet.create({
  container: {
    // padding: sizes._16sdp,
    backgroundColor: '#F7F2E5',
    // backgroundColor: colors.primary_200,
    marginRight: sizes._16sdp,
    borderRadius: sizes._16sdp,
    overflow: 'hidden',
    // maxWidth: sizes.width * 0.8,
    width: sizes._140sdp,
    elevation: 7, // Tạo độ cao đổ bóng trên Android
    shadowColor: '#000', // Màu của bóng
    shadowOffset: { width: 2, height: 2 }, // Vị trí bóng (ngang, dọc)
    shadowOpacity: 0.25, // Độ mờ của bóng
    shadowRadius: 3.84, // Độ lớn của bóng
  },
  icon: {
    // width: sizes._210sdp,
    // height: sizes._112sdp,
    height: sizes._140sdp,
    width: '100%',
  },
});
