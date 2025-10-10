import React from 'react';
import {Platform, TouchableOpacity, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {ActivityIndicator} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import {Camera} from 'react-native-vision-camera';
import RNFetchBlob from 'rn-fetch-blob';
import {CameraSvg, Lightning, LightningOff} from '../../../assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import Page from '../../../component/Page';
import {SERVER_URL} from '../../../utils/configs';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import CameraResultModal from '../../../component/CameraResultModal';

interface ICameraScreenProps {
  navigation: any;
}

interface ICameraScreenState {
  hasPermission: boolean;
  devices: any;
  device: any;
  isActive: boolean;
  isLoading: boolean;
  isShowLightning: boolean;
  visible: boolean;
  resultName: string;
  resultDescription: string;
  resultPhotoPath: string;
  // content: {
  //   name: string;
  //   description: string;
  // };
}
const defaultSize = sizes.width * 0.7;

export default class CameraScreen extends React.PureComponent<
  ICameraScreenProps,
  ICameraScreenState
> {
  camera: Camera | null = null;
  constructor(props: ICameraScreenProps) {
    super(props);
    this.state = {
      hasPermission: false,
      devices: null,
      device: null,
      isActive: true,
      isLoading: false,
      isShowLightning: false,
      visible: false,
      // content: {name: '', description: ''},
      resultName: '',
      resultDescription: '',
      resultPhotoPath: '',
    };
  }

  async componentDidMount() {
    this.props.navigation.addListener('blur', () => {
      this.setState({
        // isActive: false,
      });
    });

    this.props.navigation.addListener('focus', () => {
      this.setState({
        isActive: true,
      });
    });
    
    // Test backend connection on mount
    this.testBackendConnection();
    
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();

    if (cameraPermission === 'granted' && microphonePermission === 'granted') {
      this.setState({hasPermission: true});
      const devices = await Camera.getAvailableCameraDevices();
      const device = devices;
      this.setState({devices, device});
    }
  }

  testBackendConnection = async () => {
    console.log('=== TESTING BACKEND CONNECTION ===');
    console.log('Testing backend connection to:', SERVER_URL);
    
    try {
      const response = await fetch(`${SERVER_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend connection successful:', data);
        Toast.show({
          type: 'success',
          text1: '✅ Kết nối thành công',
          text2: 'Backend API đang hoạt động bình thường',
        });
      } else {
        console.log('Backend connection failed with status:', response.status);
        Toast.show({
          type: 'error',
          text1: '❌ Lỗi kết nối',
          text2: `Server trả về lỗi: ${response.status}`,
        });
      }
    } catch (error) {
      console.log('Backend connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Toast.show({
        type: 'error',
        text1: '❌ Lỗi kết nối',
        text2: `Không thể kết nối đến server: ${errorMessage}`,
      });
    }
    console.log('=== TESTING BACKEND CONNECTION END ===');
  };

  capturePhoto = () => {
    this.setState(
      {
        isLoading: true,
      },
      async () => {
        if (this.camera) {
          try {
            const photo = await this.camera.takePhoto({
              flash: this.state.isShowLightning ? 'on' : 'off',
            });

            console.log('Photo captured:', photo);
            
            if (!photo.path) {
              console.log('No photo path received');
              this.setState({
                isLoading: false,
              });
              Toast.show({
                type: 'error',
                text1: 'Lỗi chụp ảnh',
                text2: 'Không thể lưu ảnh',
              });
              return;
            }

            console.log('Photo path:', photo.path);
            this.setState({
              resultPhotoPath: photo.path,
            });

            await this.uploadImage(photo.path);
          } catch (error) {
            console.log('Camera error:', error);
            this.setState({
              isLoading: false,
            });
            Toast.show({
              type: 'error',
              text1: 'Lỗi camera',
              text2: 'Không thể chụp ảnh',
            });
          }
        }
      },
    );
  };

  uploadImage = async (filePath: string) => {
    const url = `${SERVER_URL}/detect`;
    console.log('=== UPLOAD IMAGE START ===');
    console.log('Uploading image to:', url);
    console.log('File path:', filePath);

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
      console.log('Response info:', response.info());

      if (response.info().status === 200) {
        try {
          const content = JSON.parse(response?.data);
          console.log('Parsed content:', content);

          this.setState({
            visible: true,
            resultName: content.name || 'Không xác định',
            resultDescription: content.description || 'Không có mô tả',
          });

          Toast.show({
            type: 'success',
            text1: 'Nhận diện thành công',
            text2: 'Đã xử lý ảnh thành công',
          });
        } catch (parseError) {
          console.log('Parse error:', parseError);
          console.log('Raw response data:', response?.data);
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
      console.error('Error Details:', JSON.stringify(error, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến server. Vui lòng thử lại.',
      });
    } finally {
      this.setState({
        isLoading: false,
      });
      console.log('=== UPLOAD IMAGE END ===');
    }
  };

  pickImage = async () => {
    await launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorCode);
          Toast.show({
            type: 'error',
            text1: 'Lỗi chọn ảnh',
            text2: 'Không thể chọn ảnh từ thư viện',
          });
        } else {
          console.log('Image picker response:', response);
          if (response.assets && response.assets.length > 0) {
            const img = response.assets[0];
            console.log('Selected image:', img);
            
            this.setState({
              isLoading: true,
              resultPhotoPath: img.uri!,
            });
            
            // Xử lý URI cho Android và iOS
            const filePath = Platform.OS === 'android' 
              ? img.uri!.replace('file://', '') 
              : img.uri!;
              
            this.uploadImage(filePath);
          }
        }
      },
    );
  };

  render(): React.ReactNode {
    if (!this.state.hasPermission || !this.state.device) {
      return <View />;
    }
    return (
      <Page>
        <View style={{flex: 1}}>
          {
            <Camera
              style={{flex: 1}}
              device={this.state.devices[0]}
              isActive={true}
              ref={ref => {
                this.camera = ref;
              }}
              photo={true}
            />
          }
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: sizes.width,
            height: sizes._70sdp,
            backgroundColor: colors.primary_950,
            opacity: 0.5,
            zIndex: 2,
          }}
        />
        <View
          style={{
            width: sizes.width,
            height: sizes._screen_height,
            backgroundColor: 'transparent',
            position: 'absolute',
            zIndex: 1,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={{
              width: defaultSize,
              height: defaultSize,
              backgroundColor: 'transparent',
            }}>
            {/* view dọc */}
            <View
              style={{
                width: defaultSize * 0.4,
                height: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                left: 0,
              }}
            />
            <View
              style={{
                width: defaultSize * 0.4,
                height: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                right: 0,
              }}
            />
            <View
              style={{
                width: defaultSize * 0.4,
                height: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                bottom: 0,
              }}
            />
            <View
              style={{
                width: defaultSize * 0.4,
                height: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                bottom: 0,
                right: 0,
              }}
            />

            {/* view ngang */}
            <View
              style={{
                height: defaultSize * 0.4,
                width: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                left: 0,
              }}
            />
            <View
              style={{
                height: defaultSize * 0.4,
                width: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                right: 0,
              }}
            />
            <View
              style={{
                height: defaultSize * 0.4,
                width: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                bottom: 0,
              }}
            />
            <View
              style={{
                height: defaultSize * 0.4,
                width: sizes._5sdp,
                backgroundColor: '#cdcdcd',
                position: 'absolute',
                bottom: 0,
                right: 0,
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={this.pickImage}
          style={{
            width: sizes._50sdp,
            height: sizes._50sdp,
            position: 'absolute',
            bottom: sizes._10sdp,
            left: sizes._16sdp,
            borderRadius: 50,
            borderColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
          <Icon name="insert-photo" color="white" size={24} />
        </TouchableOpacity>

        <TouchableOpacity
          disabled={this.state.isLoading}
          onPress={this.capturePhoto}
          style={{
            width: sizes._50sdp,
            height: sizes._50sdp,
            position: 'absolute',
            bottom: sizes._10sdp,
            left: (sizes.width - sizes._50sdp) / 2,
            borderRadius: 50,
            borderWidth: 1,
            borderColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
          {this.state.isLoading ? (
            <ActivityIndicator animating={true} color={colors.white} />
          ) : (
            <CameraSvg
              width={sizes._30sdp}
              height={sizes._30sdp}
              color={colors.white}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          disabled={this.state.isLoading}
          onPress={() => {
            this.setState({
              isShowLightning: !this.state.isShowLightning,
            });
          }}
          style={{
            width: sizes._50sdp,
            height: sizes._50sdp,
            position: 'absolute',
            bottom: sizes._10sdp,
            right: sizes._16sdp,
            borderRadius: 50,
            borderColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
          {this.state.isShowLightning ? (
            <Lightning
              width={sizes._30sdp}
              height={sizes._30sdp}
              color={colors.white}
            />
          ) : (
            <LightningOff
              width={sizes._30sdp}
              height={sizes._30sdp}
              color={colors.white}
            />
          )}
        </TouchableOpacity>

        {/* Test Connection Button */}
        <TouchableOpacity
          onPress={() => {
            console.log('=== WIFI BUTTON PRESSED ===');
            this.testBackendConnection();
          }}
          style={{
            width: sizes._50sdp,
            height: sizes._50sdp,
            position: 'absolute',
            top: sizes._50sdp,
            right: sizes._16sdp,
            borderRadius: 50,
            backgroundColor: colors.primary_950,
            opacity: 0.8,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            borderWidth: 2,
            borderColor: 'white',
          }}>
          <Icon name="wifi" color="white" size={24} />
        </TouchableOpacity>

        <CameraResultModal
          visible={this.state.visible}
          onClose={() => {
            this.setState({
              visible: false,
            });
          }}
          resultName={this.state.resultName}
          resultDescription={this.state.resultDescription}
          resultPhotoPath={this.state.resultPhotoPath}
        />
      </Page>
    );
  }
}
