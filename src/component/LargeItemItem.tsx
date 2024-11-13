import React from 'react';
import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import {IItem, ILocation} from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import {AppStyle} from '../common/AppStyle';
import TextBase from '../common/TextBase';
import {ScreenName} from '../container/AppContainer';
import NavigationService from '../container/screens/NavigationService';
import {DB_URL} from '../utils/configs';

interface ILargeItemLocationProps {
  item: IItem;
  onPress?: () => void;
}

interface ILargeItemLocationState {}

export default class LargeItemItem extends React.PureComponent<
  ILargeItemLocationProps,
  ILargeItemLocationState
> {
  constructor(props: ILargeItemLocationProps) {
    super(props);
    this.state = {};
  }
  render(): React.ReactNode {
    const {item} = this.props;
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={() => {
          if (this.props.onPress) {
            this.props.onPress();
            return;
          }
          NavigationService.navigate(ScreenName.DETAIL_ITEM, {
            item,
          });
        }}>
        <View style={styles.rowCenter}>
          <Image
            source={{
              uri:
                item.images && item.images.length > 0
                  ? // @ts-ignore
                    `${DB_URL}/${item.images[0]?.path}`
                  : undefined,
            }}
            style={{
              height: sizes.width * 0.25,
              width: sizes.width * 0.25,
              resizeMode: 'cover',
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
              numberOfLines={1} // Thay đổi thành 1 để nội dung không xuống dòng
              ellipsizeMode="tail" // Thêm thuộc tính này để hiển thị dấu '...'
              style={AppStyle.txt_18_bold}>
              {`${item.name}`}
            </TextBase>
            <TextBase
              numberOfLines={3}
              style={[AppStyle.txt_14_regular, {marginTop: sizes._8sdp}]}>
              {item.description}
            </TextBase>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

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
