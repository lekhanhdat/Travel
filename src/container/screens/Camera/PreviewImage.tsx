import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import ImageView from "react-native-image-viewing";
import NavigationService from '../NavigationService';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { SendSvg } from '../../../assets/ImageSvg';

interface IPreviewImageProps {
  navigation: any;
}

interface IPreviewImageState {

}

export default class PreviewImage extends React.PureComponent<IPreviewImageProps, IPreviewImageState> {
  constructor(props: IPreviewImageProps) {
    super(props);
    this.state = {
    }
  }
  render(): React.ReactNode {
    return (
      <Page>
        <View style={{ flex: 1 }}>
          <ImageView
            images={[{ uri: this.props.navigation.state.params?.uri ?? '' }]}
            imageIndex={0}
            visible={true}
            onRequestClose={() => {
              NavigationService.pop();
            }}
            FooterComponent={
              () => {
                return <View style={{ width: sizes.width, paddingVertical: sizes._16sdp, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <TouchableOpacity
                    style={{
                      width: sizes._50sdp,
                      height: sizes._50sdp,
                      borderRadius: 50,
                      borderWidth: 1,
                      borderColor: colors.white,
                      paddingTop: sizes._12sdp,
                      paddingLeft: sizes._9sdp
                    }}
                  >
                    <SendSvg width={sizes._30sdp} height={sizes._30sdp} color={colors.white} />
                  </TouchableOpacity>
                </View>
              }
            }
          />
        </View>
      </Page>
    );
  }
}