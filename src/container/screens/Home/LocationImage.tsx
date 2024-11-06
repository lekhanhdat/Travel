import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import { BackSvg } from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import NavigationService from '../NavigationService';
import { ILocation } from '../../../common/types';
import YoutubePlayer from 'react-native-youtube-iframe';

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
          title={'Hình ảnh & Video'}
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
            <Text style={styles.sectionTitle}>Hình ảnh</Text>
            {location.images?.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.img} />
            ))}


          <View
            style={{
              width: '100%',
              height: 3,
              backgroundColor: colors.xam,
              marginTop: sizes._8sdp,
              marginBottom: sizes._16sdp,
            }}
          />


            <Text style={styles.sectionTitle}>Video</Text>
            {location.videos?.map((video, index) => (
              <View key={index} style={styles.videoContainer}>
                <ChildVideo videoId={video} />
              </View>
            ))}
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
  sectionTitle: {
    fontSize: sizes._22sdp,
    fontWeight: 'bold',
    color: colors.primary_950,
    marginBottom: sizes._16sdp,
    textAlign: 'center', 
  },
  img: {
    width: sizes.width - sizes._32sdp,
    height: sizes._200sdp,
    marginBottom: sizes._16sdp,
    borderRadius: sizes._16sdp,
  },
  videoContainer: {
    borderRadius: sizes._16sdp,
    overflow: 'hidden', 
  },
});

interface VideoProps {
  videoId: string;
}
interface VideoState {}
export class ChildVideo extends React.PureComponent<VideoProps, VideoState> {
  render(): React.ReactNode {
    return (
      <View style={styles.videoContainer}>
        <YoutubePlayer
          height={220}
          play={true}
          videoId={this.props.videoId}
          onChangeState={() => {}}
          mute={true}
        />
      </View>
    );
  }
}
