import {ScrollView, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import NavigationService from '../NavigationService';
import {ILocation} from '../../../common/types';
import YoutubePlayer from 'react-native-youtube-iframe';

interface Props {
  navigation: any;
}
interface States {}

export default class LocationVideo extends React.PureComponent<Props, States> {
  render(): React.ReactNode {
    const location: ILocation = this.props.navigation.state.params?.location;
    return (
      <Page>
        <HeaderBase
          title={'Xem chi tiết video'}
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
        <View
          style={{
            flex: 1,
            backgroundColor: colors.white,
            padding: sizes._16sdp,
          }}>
          <ScrollView>
            {location.videos?.map(video => {
              return <View>
                <ChildVideo videoId={video}/>
              </View>;
            })}
          </ScrollView>
        </View>
      </Page>
    );
  }
}

const styles = StyleSheet.create({
  backgroundVideo: {
    width: sizes.width - sizes._32sdp,
    height: sizes._200sdp,
  },
});

interface VideoProps {videoId: string}
interface VideoState {}
export class ChildVideo extends React.PureComponent<VideoProps, VideoState> {
  render(): React.ReactNode {
    return (
      <YoutubePlayer
        height={300}
        play={true}
        videoId={this.props.videoId}
        onChangeState={() => {}}
        mute={true}
      />
    );
  }
}
