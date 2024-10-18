import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ILocation } from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import { AppStyle } from '../common/AppStyle';
import TextBase from '../common/TextBase';
import { ScreenName } from '../container/AppContainer';
import NavigationService from '../container/screens/NavigationService';

interface ILargeItemLocationProps {
  location: ILocation;
  onPress?: () => void
}

interface ILargeItemLocationState { }

export default class LargeItemLocation extends React.PureComponent<
  ILargeItemLocationProps,
  ILargeItemLocationState
> {
  constructor(props: ILargeItemLocationProps) {
    super(props);
    this.state = {};
  }
  render(): React.ReactNode {
    const { location } = this.props;
    return (
      <TouchableOpacity style={styles.container}
        onPress={() => {
          if (this.props.onPress) {
            this.props.onPress();
            return;
          }
          NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, { location: location })
        }}
      >
        <View style={styles.rowCenter}>
          <Image
            source={{ uri: location.avatar }}
            style={{
              width: sizes._80sdp,
              height: sizes._80sdp,
              resizeMode: 'cover',
              marginRight: sizes._16sdp,

              borderRadius: sizes._10sdp,
            }}
          />
          <View style={{ flex: 1 }}>
            <TextBase numberOfLines={1} style={AppStyle.txt_16_medium}>
              {`${location.name}`}
            </TextBase>
            <TextBase
              numberOfLines={3}
              style={[AppStyle.txt_14_regular, { marginTop: sizes._8sdp }]}>
              {location.description}
            </TextBase>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: sizes._16sdp,
    backgroundColor: colors.primary_400,
    marginBottom: sizes._16sdp,
    borderRadius: sizes._20sdp,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
