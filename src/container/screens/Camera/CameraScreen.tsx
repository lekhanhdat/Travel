import React from 'react';
import { Image, Modal, Platform, TouchableOpacity, View } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import sizes from '../../../common/sizes';
import colors from '../../../common/colors';
import { CameraSvg, Frame, LibrarySvg, Lightning, LightningOff } from '../../../assets/ImageSvg';
import NavigationService from '../NavigationService';
import { ScreenName } from '../../AppContainer';
import { debounce } from 'lodash';
import { ActivityIndicator } from 'react-native-paper';
import images from '../../../res/images';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import TextBase from '../../../common/TextBase';
import { AppStyle } from '../../../common/AppStyle';
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
}
const defaultSize = sizes.width * 0.7

export default class CameraScreen extends React.PureComponent<
  ICameraScreenProps,
  ICameraScreenState
> {
  camera: Camera | null = null;
  content: string = '';
  constructor(props: ICameraScreenProps) {
    super(props);
    this.state = {
      hasPermission: false,
      devices: null,
      device: null,
      isActive: true,
      isLoading: false,
      isShowLightning: false,
      visible: false
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
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();

    if (cameraPermission === 'granted' && microphonePermission === 'granted') {
      this.setState({ hasPermission: true });
      const devices = await Camera.getAvailableCameraDevices();
      const device = devices;
      this.setState({ devices, device });
    }
  }

  capturePhoto = () => {
    this.setState({
      isLoading: true
    }, async () => {
      if (this.camera) {
        const photo = await this.camera.takePhoto({ 'flash': this.state.isShowLightning ? 'on' : 'off' });
        
        console.log('xxxx222', photo)
        if (!photo.path) {
          this.setState({
            isLoading: false,
          })
          return;
        }
        this.uploadImage(photo.path)
        // NavigationService.navigate(ScreenName.PREVIEW_IMAGE_SCREEN, { uri: 'file://' + photo.path })

      }
    })
  };

   uploadImage = async (filePath: string) => {
    const url = 'http://192.168.101.13:8000/api/v1/ai/detect';
    
    // Lấy file từ local
    const file = {
      uri: Platform.OS === 'android' ? 'file://' + filePath : filePath,
      type: 'image/jpeg', // Loại file
      name: 'concho.jpg', // Tên file
    };
  
    // Tạo FormData để gửi ảnh
    const formData = new FormData();
    formData.append('image_file', file);
  
    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      this.setState({
        isLoading: false,
      })
      console.log('Upload thành công:', response.data);
      this.content = response?.data?.toString()
      this.setState({
        visible: true,
      })
     
    } catch (error) {
      this.setState({
        isLoading: false,
      })
      Toast.show({
        type: 'error',
        text1: 'Error',
      })
      console.error('Upload thất bại:', error);
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasPermission || !this.state.device) {
      return <View />;
    }
    return (
      <Page>
        <View style={{ flex: 1 }}>
          {
            <Camera
              style={{ flex: 1, }}
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
            zIndex: 2
          }}
        />
        <View style={{ width: sizes.width, height: sizes._screen_height, backgroundColor: 'transparent', position: 'absolute', zIndex: 1, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: defaultSize, height: defaultSize, backgroundColor: 'transparent' }}>
            {/* view dọc */}
            <View style={{ width: defaultSize * 0.4, height: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', left: 0 }} />
            <View style={{ width: defaultSize * 0.4, height: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', right: 0 }} />
            <View style={{ width: defaultSize * 0.4, height: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', bottom: 0 }} />
            <View style={{ width: defaultSize * 0.4, height: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', bottom: 0, right: 0 }} />

            {/* view ngang */}
            <View style={{ height: defaultSize * 0.4, width: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', left: 0 }} />
            <View style={{ height: defaultSize * 0.4, width: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', right: 0 }} />
            <View style={{ height: defaultSize * 0.4, width: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', bottom: 0 }} />
            <View style={{ height: defaultSize * 0.4, width: sizes._5sdp, backgroundColor: '#cdcdcd', position: 'absolute', bottom: 0, right: 0 }} />
          </View>
        </View>
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
            zIndex: 3
          }}>
          {
            this.state.isLoading ?
              <ActivityIndicator animating={true} color={colors.white} />
              :
              <CameraSvg width={sizes._30sdp} height={sizes._30sdp} color={colors.white} />
          }
        </TouchableOpacity>

        <TouchableOpacity
          disabled={this.state.isLoading}
          onPress={() => {
            this.setState({
              isShowLightning: !this.state.isShowLightning
            })
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
            zIndex: 3
          }}>
          {
            this.state.isShowLightning ?
              <Lightning width={sizes._30sdp} height={sizes._30sdp} color={colors.white} />
              :
              <LightningOff width={sizes._30sdp} height={sizes._30sdp} color={colors.white} />
          }
        </TouchableOpacity>

        <Modal
          visible={this.state.visible}
          transparent
        >
          <View
            onStartShouldSetResponder={() => {
              this.setState({
                visible: false
              })
              return true;
            }}
            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: sizes.width - sizes._32sdp, padding: sizes._16sdp, backgroundColor: colors.white, borderRadius: sizes._8sdp,alignItems: 'center', justifyContent: 'center' }}>
            
              <TextBase style={[AppStyle.txt_14_regular, {textAlign: 'center'}]}>{this.content}</TextBase>
            </View>
          </View>
        </Modal>
      </Page>
    );
  }
}
