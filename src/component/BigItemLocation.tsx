import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {ILocation} from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import TextBase from '../common/TextBase';
import {AppStyle} from '../common/AppStyle';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';
import CachedImage from './CachedImage';

interface IBigItemLocationProps {
  location: ILocation;
}

interface IBigItemLocationState {}

export default class BigItemLocation extends React.PureComponent<
  IBigItemLocationProps,
  IBigItemLocationState
> {
  constructor(props: IBigItemLocationProps) {
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
            {`${location.name}`}
          </TextBase>
          <TextBase
            numberOfLines={3}
            style={[AppStyle.txt_16_regular, {marginTop: sizes._8sdp}]}>
            {location.description}
          </TextBase>
        </View>
      </TouchableOpacity>
    );

    // return (
    //   <Card
    //     style={{
    //       height: '100%',
    //       width: sizes.width * 0.6,
    //       marginRight: sizes._16sdp,
    //       backgroundColor: colors.primary_200,
    //       paddingBottom: sizes._16sdp,
    //     }}>
    //     <Card.Cover source={{uri: location.avatar}} />
    //     <Card.Title
    //       title={location.name}
    //       subtitle={location.description}
    //       subtitleNumberOfLines={3}
    //       // left={LeftContent}
    //     />
    //   </Card>
    // );
  }
}

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
