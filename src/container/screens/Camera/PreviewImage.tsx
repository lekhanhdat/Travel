import React from 'react';
import i18n from '../../../i18n';
import { TouchableOpacity, View, Platform, ActivityIndicator } from 'react-native';
import Page from '../../../component/Page';

import ImageView from 'react-native-image-viewing';
import NavigationService from '../NavigationService';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { SendSvg } from '../../../assets/ImageSvg';
import {detectImage, DetectError} from '../../../services/detect.api';
import {requireLogin} from '../../../utils/requireLogin';
import Toast from 'react-native-toast-message';
import CameraResultModal from '../../../component/CameraResultModal';
import TextBase from '../../../common/TextBase';

interface IPreviewImageProps {
  navigation: any;
  route: any;
}

interface IPreviewImageState {
  isDetecting: boolean;
  visible: boolean;
  resultName: string;
  resultDescription: string;
  resultPhotoPath: string;
}

export default class PreviewImage extends React.PureComponent<IPreviewImageProps, IPreviewImageState> {
  constructor(props: IPreviewImageProps) {
    super(props);
    this.state = {
      isDetecting: false,
      visible: false,
      resultName: '',
      resultDescription: '',
      resultPhotoPath: '',
    }
  }

  // P8: POST /detect on Cloud Run with the account's token (same call as CameraScreen).
  uploadImage = async (filePath: string) => {
    if (!(await requireLogin())) {return;}
    this.setState({ isDetecting: true });
    try {
      const content = await detectImage(filePath);
      this.setState({
        visible: true,
        resultName: content.name || i18n.t('common:ui.common.unknown'),
        resultDescription: content.description || i18n.t('common:ui.common.noDescription'),
        resultPhotoPath: filePath,
      });
      Toast.show({
        type: 'success',
        text1: i18n.t('common:ui.camera.recognized'),
        text2: i18n.t('common:ui.camera.processed'),
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof DetectError ? i18n.t('common:ui.camera.notRecognized') : 'Lỗi kết nối',
        text2: error instanceof DetectError ? error.message : i18n.t('common:ui.common.serverError'),
      });
    } finally {
      this.setState({
        isDetecting: false,
      });
    }
  };

  handleSendImage = () => {
    const imagePath = this.props.route?.params?.imagePath ?? '';
    if (imagePath) {
      this.uploadImage(imagePath);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: i18n.t('common:ui.camera.noImagePath'),
      });
    }
  };

  render(): React.ReactNode {
    const imagePath = this.props.route?.params?.imagePath ?? '';
    const imageUri = Platform.OS === 'android'
      ? `file://${imagePath}`
      : imagePath;

    return (
      <Page>
        <View style={{ flex: 1 }}>
          <ImageView
            images={[{ uri: imageUri }]}
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
                      paddingLeft: sizes._9sdp,
                      opacity: this.state.isDetecting ? 0.5 : 1,
                    }}
                    onPress={this.handleSendImage}
                    disabled={this.state.isDetecting}
                  >
                    {this.state.isDetecting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <SendSvg width={sizes._30sdp} height={sizes._30sdp} color={colors.white} />
                    )}
                  </TouchableOpacity>
                </View>
              }
            }
          />

          {/* Loading Overlay */}
          {this.state.isDetecting && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            }}>
              <View style={{
                backgroundColor: colors.white,
                padding: sizes._20sdp,
                borderRadius: sizes._12sdp,
                alignItems: 'center',
              }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <TextBase style={{ marginTop: sizes._12sdp, fontSize: sizes._16sdp }}>
                  {i18n.t('common:ui.camera.recognizing')}
                </TextBase>
              </View>
            </View>
          )}

          {/* Result Modal */}
          <CameraResultModal
            visible={this.state.visible}
            onClose={() => {
              this.setState({ visible: false });
              NavigationService.pop();
            }}
            resultName={this.state.resultName}
            resultDescription={this.state.resultDescription}
            resultPhotoPath={this.state.resultPhotoPath}
          />
        </View>
      </Page>
    );
  }
}
