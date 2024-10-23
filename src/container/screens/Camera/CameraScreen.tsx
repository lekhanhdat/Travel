import React from 'react';
import {Modal, Platform, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import RNFS from 'react-native-fs';
import {launchImageLibrary} from 'react-native-image-picker';
import {ActivityIndicator} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import {Camera} from 'react-native-vision-camera';
import RNFetchBlob from 'rn-fetch-blob';
import {CameraSvg, Lightning, LightningOff} from '../../../assets/ImageSvg';
import {AppStyle} from '../../../common/AppStyle';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import TextBase from '../../../common/TextBase';
import Page from '../../../component/Page';
import {SERVER_URL} from '../../../utils/configs';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
      this.setState({hasPermission: true});
      const devices = await Camera.getAvailableCameraDevices();
      const device = devices;
      this.setState({devices, device});
    }
  }

  capturePhoto = () => {
    this.setState(
      {
        isLoading: true,
      },
      async () => {
        if (this.camera) {
          const photo = await this.camera.takePhoto({
            flash: this.state.isShowLightning ? 'on' : 'off',
          });

          console.log('xxxx222', photo);
          if (!photo.path) {
            this.setState({
              isLoading: false,
            });
            return;
          }

          const checking = await RNFS.exists(photo.path);
          const path = photo.path.replace('file://', '');

          await this.uploadImage(photo.path);
          // NavigationService.navigate(ScreenName.PREVIEW_IMAGE_SCREEN, {
          //   uri: 'file://' + photo.path,
          // });

          this.setState({
            isLoading: false,
          });
        }
      },
    );
  };

  uploadImage = async (filePath: string) => {
    // const res = await fetch(`${SERVER_URL}/ai/`, {method: 'get'});
    // console.log(await res.json());
    // return;

    const url = `${SERVER_URL}/ai/detect`;

    try {
      const data = new FormData();
      data.append('image_file', {
        name: 'image.jpg',
        type: 'image/jpg',
        uri: Platform.OS === 'android' ? 'file://' + filePath : filePath,
        // uri: filePath,
      } as any);

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

      this.setState({
        isLoading: false,
      });
      const content = JSON.parse(response?.data);

      this.setState({
        visible: true,
        resultName: content.name,
        resultDescription: content.description,
      });
    } catch (error) {
      this.setState({
        isLoading: false,
      });
      Toast.show({
        type: 'error',
        text1: 'Error',
      });
      console.error('Error Details:', JSON.stringify(error, null, 2));
    }
  };

  pickImage = async () => {
    await launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.5,
      },
      response => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorCode);
        } else {
          console.log('response', response);
          if (response.assets && response.assets.length > 0) {
            const img = response.assets[0];
            this.setState({
              isLoading: true,
            });
            this.uploadImage(img.uri!.replace('file://', ''));
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
        
        <Modal visible={this.state.visible} transparent>
          <View
            onStartShouldSetResponder={() => {
              this.setState({
                visible: false,
              });
              return true;
            }}
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: sizes.width - sizes._32sdp,
                padding: sizes._16sdp,
                height: 400, // Đặt chiều cao cố định cho modal
                backgroundColor: colors.white,
                borderRadius: sizes._16sdp,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
            <ScrollView>
              <TextBase
                style={[
                  AppStyle.txt_20_bold,
                  {textAlign: 'center', marginBottom: sizes._8sdp},
                ]}>
                {this.state.resultName}
              </TextBase>
              <TextBase
                style={[AppStyle.txt_16_regular, {textAlign: 'center'}]}>
                {this.state.resultDescription}
              </TextBase>
            </ScrollView>
            </View>
          </View>
        </Modal>
      </Page>
    );
  }
}
