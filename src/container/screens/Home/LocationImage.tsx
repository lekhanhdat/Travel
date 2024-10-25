import {Image, ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import {ILocation} from '../../../common/types';
interface Props {
  navigation: any;
}
interface States {}
export default class LocationImage extends React.PureComponent<Props, States> {
  render(): React.ReactNode {
    const location: ILocation = this.props.navigation.state.params?.location;
    return (
      <Page>
        <HeaderBase
          title={'Xem chi tiết hình ảnh'}
          leftIconSvg={
            <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => {
            NavigationService.pop();
          }}
        />

        <View style={styles.container}>
          <ScrollView>
            {location.images?.map(image => {
              return <Image source={{uri: image}} style={styles.img} />;
            })}
          </ScrollView>
        </View>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: sizes._16sdp,
  },
  img: {
    width: sizes.width - sizes._32sdp,
    height: sizes._200sdp,
    marginBottom: sizes._16sdp,
    borderRadius: sizes._16sdp,
  },
});
