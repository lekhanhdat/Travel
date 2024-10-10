import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ILocation } from '../common/types';
import sizes from '../common/sizes';
import colors from '../common/colors';
import TextBase from '../common/TextBase';
import { AppStyle } from '../common/AppStyle';
import NavigationService from '../container/screens/NavigationService';
import { ScreenName } from '../container/AppContainer';

interface IBigItemLocationProps {
  location: ILocation;
}

interface IBigItemLocationState {

}

export default class BigItemLocation extends React.PureComponent<IBigItemLocationProps, IBigItemLocationState> {
  constructor(props: IBigItemLocationProps) {
    super(props);
    this.state = {
    }
  }
  render(): React.ReactNode {
    const { location } = this.props;
    return (
      <TouchableOpacity style={styles.container}
        onPress={() => {
          NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, { location: location })
        }}
      >
        <Image source={{ uri: location.avatar }} style={styles.icon}
          onError={() => {
            console.log('errr', location.avatar)
          }}
        />
        <TextBase numberOfLines={1} style={[AppStyle.txt_14_medium, { marginTop: sizes._8sdp }]}>
          {`${location.name}`}
        </TextBase>
        <TextBase numberOfLines={3} style={[AppStyle.txt_12_regular, { marginTop: sizes._8sdp }]}>
          {location.description}
        </TextBase>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: sizes._16sdp,
    backgroundColor: colors.primary,
    marginRight: sizes._16sdp,
    borderRadius: sizes._20sdp,
    maxWidth: sizes.width * 0.6
  },
  icon: {
    width: sizes._75sdp,
    height: sizes._55sdp,
    borderRadius: sizes._10sdp,
  }
})