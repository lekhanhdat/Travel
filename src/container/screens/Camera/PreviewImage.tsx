import React from 'react';
import { TouchableOpacity, View, Platform, ActivityIndicator } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import ImageView from 'react-native-image-viewing';
import NavigationService from '../NavigationService';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { SendSvg } from '../../../assets/ImageSvg';
import RNFetchBlob from 'rn-fetch-blob';
import { SERVER_URL } from '../../../utils/configs';
import Toast from 'react-native-toast-message';
import CameraResultModal from '../../../component/CameraResultModal';
import TextBase from '../../../common/TextBase';

interface IPreviewImageProps {
  navigation: any;
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

  uploadImage = async (filePath: string) => {
    const url = `${SERVER_URL}/detect`;
    console.log('=== UPLOAD IMAGE START ===');
    console.log('Uploading image to:', url);
    console.log('File path:', filePath);

    this.setState({ isDetecting: true });

    try {
      const response = await RNFetchBlob.fetch(
        'POST',
        url,
        {
          'Content-Type': 'multipart/form-data',
        },
        [
          {
            name: 'image_file',
            filename: 'image.jpg',
            data: RNFetchBlob.wrap(filePath),
          },
        ],
      );

      console.log('Response status:', response.info().status);
      console.log('Response data:', response?.data);

      if (response.info().status === 200) {
        try {
          const content = JSON.parse(response?.data);
          console.log('Parsed content:', content);

          this.setState({
            visible: true,
            resultName: content.name || 'Không xác định',
            resultDescription: content.description || 'Không có mô tả',
            resultPhotoPath: filePath,
          });

          Toast.show({
            type: 'success',
            text1: 'Nhận diện thành công',
            text2: 'Đã xử lý ảnh thành công',
          });
        } catch (parseError) {
          console.log('Parse error:', parseError);
          Toast.show({
            type: 'error',
            text1: 'Lỗi xử lý dữ liệu',
            text2: 'Không thể xử lý kết quả từ server',
          });
        }
      } else {
        console.log('Server error status:', response.info().status);
        Toast.show({
          type: 'error',
          text1: 'Lỗi server',
          text2: `Server trả về lỗi: ${response.info().status}`,
        });
      }
    } catch (error) {
      console.log('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến server. Vui lòng thử lại.',
      });
    } finally {
      this.setState({
        isDetecting: false,
      });
      console.log('=== UPLOAD IMAGE END ===');
    }
  };

  handleSendImage = () => {
    const imagePath = this.props.navigation.state.params?.imagePath ?? '';
    if (imagePath) {
      this.uploadImage(imagePath);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không tìm thấy đường dẫn ảnh',
      });
    }
  };

  render(): React.ReactNode {
    const imagePath = this.props.navigation.state.params?.imagePath ?? '';
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
                  Đang nhận diện địa điểm...
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
