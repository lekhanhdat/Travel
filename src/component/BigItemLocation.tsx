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
            style={[AppStyle.txt_20_bold, {marginTop: sizes._10sdp}]}>
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
    backgroundColor: colors.primary_200,
    marginRight: sizes._16sdp,
    borderRadius: sizes._24sdp,
    overflow: 'hidden',
    maxWidth: sizes.width * 0.8,
  },
  icon: {
    // width: sizes._210sdp,
    // height: sizes._112sdp,
    height: sizes._160sdp,
    width: '100%',
  },
});
