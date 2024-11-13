import React from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {AppStyle} from '../common/AppStyle';
import colors from '../common/colors';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import {IItem} from '../common/types';
import {DB_URL} from '../utils/configs';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';

interface IHistoricalArtifactProps {
  item: IItem;
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
    const {item} = this.props;
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          NavigationService.navigate(ScreenName.DETAIL_ITEM, {
            item,
          });
        }}>
        <Image
          source={{
            uri:
              item.images && item.images.length > 0
                ? // @ts-ignore
                  `${DB_URL}/${item.images[0]?.path}`
                : undefined,
          }}
          style={styles.icon}
          onError={err => {
            console.error(err);
          }}
        />
        <View
          style={{
            paddingVertical: sizes._12sdp,
            paddingHorizontal: sizes._16sdp,
          }}>
          <TextBase numberOfLines={1} style={[AppStyle.txt_20_bold]}>
            {`${item.name}`}
          </TextBase>
          <TextBase
            numberOfLines={2}
            style={[AppStyle.txt_16_regular, {marginTop: sizes._8sdp}]}>
            {item.description}
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
    shadowOffset: {width: 2, height: 2}, // Vị trí bóng (ngang, dọc)
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
