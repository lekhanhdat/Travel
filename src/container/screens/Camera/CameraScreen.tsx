import React from 'react';
import i18n from '../../../i18n';
import {Platform, TouchableOpacity, View, Image, AppState, Linking, StyleSheet} from 'react-native';
import {launchImageLibrary} from '../../../utils/imagePicker';
import {ActivityIndicator, Button as PaperButton, Modal, Portal} from 'react-native-paper';
import {Text as AppText} from '../../../ui/Text';
import {color, space} from '../../../theme/tokens';
import Toast from 'react-native-toast-message';
import {Camera} from 'react-native-vision-camera';
import {CameraSvg, Lightning, LightningOff, SendSvg} from '../../../assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import Page from '../../../component/Page';
import {env} from '../../../utils/env';
import {detectImage, DetectError} from '../../../services/detect.api';
import {requireLogin} from '../../../utils/requireLogin';
import {Icon} from '../../../ui/Icon';
import CameraResultModal from '../../../component/CameraResultModal';
import TextBase from '../../../common/TextBase';

interface ICameraScreenProps {
  navigation?: any; // optional: the tab navigator passes it
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
  // Preview modal states
  showPreviewModal: boolean;
  previewImagePath: string;
  isDetecting: boolean;
}
const defaultSize = sizes.width * 0.7;

export default class CameraScreen extends React.PureComponent<
  ICameraScreenProps,
  ICameraScreenState
> {
  camera: Camera | null = null;
  private mounted = false;
  private unsubscribeFocus?: () => void;
  private unsubscribeBlur?: () => void;
  private appSubscription?: ReturnType<typeof AppState.addEventListener>;
  private updateActive = () => {
    this.setState({isActive: !!this.props.navigation?.isFocused?.() && AppState.currentState === 'active'});
    if (AppState.currentState === 'active') {this.refreshPermission();}
  };
  private refreshPermission = async () => {
    const hasPermission = Camera.getCameraPermissionStatus() === 'granted';
    const devices = hasPermission ? Camera.getAvailableCameraDevices() : [];
    if (this.mounted) {this.setState({hasPermission, devices, device: devices[0] ?? null});}
  };
  componentWillUnmount() {
    this.mounted = false;
    this.unsubscribeFocus?.();
    this.unsubscribeBlur?.();
    this.appSubscription?.remove();
  }
  constructor(props: ICameraScreenProps) {
    super(props);
    this.state = {
      hasPermission: false,
      devices: null,
      device: null,
      isActive: false,
      isLoading: false,
      isShowLightning: false,
      visible: false,
      resultName: '',
      resultDescription: '',
      resultPhotoPath: '',
      showPreviewModal: false,
      previewImagePath: '',
      isDetecting: false,
    };
  }

  async componentDidMount() {
    this.mounted = true;
    // isActive: false,
    this.unsubscribeBlur = this.props.navigation?.addListener('blur', this.updateActive);
    this.unsubscribeFocus = this.props.navigation?.addListener('focus', this.updateActive);
    this.appSubscription = AppState.addEventListener('change', this.updateActive);
    this.updateActive();

    // Test backend connection on mount
    if (__DEV__) {this.testBackendConnection();}

    const cameraPermission = await Camera.requestCameraPermission();
    // P8: photos only, so the microphone is not requested (Play: ask only for what is used).
    // const microphonePermission = await Camera.requestMicrophonePermission();

    if (this.mounted && cameraPermission === 'granted') {await this.refreshPermission();}
  }

  /** Ask again; once Android stops showing the dialog ('denied' for good), open Settings. */
  requestPermission = async () => {
    const result = await Camera.requestCameraPermission();
    if (result === 'granted') {
      await this.refreshPermission();
    } else {
      Linking.openSettings().catch(() => {});
    }
  };

  testBackendConnection = async () => {
    if (!__DEV__) {return;}

    try {
      const response = await fetch(`${env.API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });


      if (response.ok) {
        await response.json();
        Toast.show({
          type: 'success',
          text1: i18n.t('common:ui.camera.connected'),
          text2: i18n.t('common:ui.camera.backendOk'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: i18n.t('common:ui.camera.connectionError'),
          text2: i18n.t('common:ui.camera.serverStatus', {status: response.status}),
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Toast.show({
        type: 'error',
        text1: i18n.t('common:ui.camera.connectionError'),
        text2: i18n.t('common:ui.camera.cannotConnect', {message: errorMessage}),
      });
    }
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


            if (!photo.path) {
              this.setState({
                isLoading: false,
              });
              Toast.show({
                type: 'error',
                text1: i18n.t('common:ui.camera.captureError'),
                text2: i18n.t('common:ui.camera.saveFailed'),
              });
              return;
            }


            // Show preview modal instead of uploading immediately
            this.setState({
              isLoading: false,
              showPreviewModal: true,
              previewImagePath: photo.path,
            });
          } catch (error) {
            this.setState({
              isLoading: false,
            });
            Toast.show({
              type: 'error',
              text1: 'Lỗi camera',
              text2: i18n.t('common:ui.camera.captureFailed'),
            });
          }
        }
      },
    );
  };

  // P8: POST /detect on Cloud Run with the account's token (guests are asked to log in first).
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
        showPreviewModal: false, // Hide preview modal when showing result
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

  pickImage = async () => {
    await launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        // P8: BE accepts photos up to 8 MB; resizing keeps gallery images well below it.
        maxWidth: 2048,
        maxHeight: 2048,
      },
      response => {
        if (response.didCancel) {
        } else if (response.errorCode) {
          Toast.show({
            type: 'error',
            text1: i18n.t('common:ui.camera.pickError'),
            text2: i18n.t('common:ui.camera.pickFailed'),
          });
        } else {
          if (response.assets && response.assets.length > 0) {
            const img = response.assets[0];

            // Xử lý URI cho Android và iOS
            const filePath = Platform.OS === 'android'
              ? img.uri!.replace('file://', '')
              : img.uri!;

            // Show preview modal instead of uploading immediately
            this.setState({
              showPreviewModal: true,
              previewImagePath: filePath,
            });
          }
        }
      },
    );
  };

  render(): React.ReactNode {
    if (!this.state.hasPermission || !this.state.device) {
      const noDevice = this.state.hasPermission;
      return (
        <Page>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name={noDevice ? 'camera-off-outline' : 'camera-outline'} size={40} color={color.primary} />
            </View>
            <AppText variant="headline" style={styles.center}>
              {i18n.t(noDevice ? 'common:camera.noDeviceTitle' : 'common:camera.permissionTitle')}
            </AppText>
            <AppText variant="bodySmall" tone="textSecondary" style={[styles.center, styles.emptyText]}>
              {i18n.t(noDevice ? 'common:camera.noDevice' : 'common:camera.permissionDenied')}
            </AppText>
            {!noDevice ? (
              <PaperButton mode="contained" icon="camera" style={styles.emptyBtn} contentStyle={styles.btnContent}
                onPress={this.requestPermission}>
                {i18n.t('common:camera.allow')}
              </PaperButton>
            ) : null}
            <PaperButton mode="outlined" icon="image-outline" style={styles.emptyBtn} contentStyle={styles.btnContent}
              onPress={this.pickImage}>
              {i18n.t('common:camera.pickFromGallery')}
            </PaperButton>
          </View>
        </Page>
      );
    }
    return (
      <Page>
        <View style={{flex: 1}}>
          {
            <Camera
              style={{flex: 1}}
              device={this.state.device}
              isActive={this.state.isActive}
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
          <Icon name="image-outline" color="white" size={24} />
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
        {__DEV__ && <TouchableOpacity
          onPress={() => {
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
        </TouchableOpacity>}

        {/* Preview Modal */}
        <Portal>
          <Modal
            visible={this.state.showPreviewModal}
            onDismiss={() => {
              this.setState({ showPreviewModal: false });
            }}
            contentContainerStyle={{
              height: 500,
            }}>
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: sizes.width - sizes._32sdp,
                  backgroundColor: colors.white,
                  borderRadius: sizes._16sdp,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 2},
                  shadowOpacity: 0.8,
                  shadowRadius: 2,
                  elevation: 5,
                }}>
                {/* Preview Image */}
                <Image
                  source={{
                    uri: Platform.OS === 'android'
                      ? `file://${this.state.previewImagePath}`
                      : this.state.previewImagePath,
                  }}
                  style={{
                    width: sizes.width - sizes._32sdp,
                    height: 300,
                    resizeMode: 'cover',
                  }}
                />

                {/* Send Button Footer */}
                <View style={{
                  width: '100%',
                  paddingVertical: sizes._16sdp,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <TouchableOpacity
                    style={{
                      width: sizes._50sdp,
                      height: sizes._50sdp,
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: colors.white,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: this.state.isDetecting ? 'rgba(255,255,255,0.3)' : 'transparent',
                    }}
                    onPress={() => {
                      if (this.state.previewImagePath) {
                        this.uploadImage(this.state.previewImagePath);
                      }
                    }}
                    disabled={this.state.isDetecting}
                  >
                    {this.state.isDetecting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <SendSvg width={sizes._28sdp} height={sizes._28sdp} color={colors.white} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Loading Overlay */}
                {this.state.isDetecting && (
                  <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                    borderRadius: sizes._16sdp,
                  }}>
                    <View style={{
                      backgroundColor: colors.white,
                      padding: sizes._24sdp,
                      borderRadius: sizes._12sdp,
                      alignItems: 'center',
                      minWidth: 200,
                    }}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <TextBase style={{
                        marginTop: sizes._16sdp,
                        fontSize: sizes._16sdp,
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}>
                        {i18n.t('common:ui.camera.recognizing')}
                      </TextBase>
                      <TextBase style={{
                        marginTop: sizes._8sdp,
                        fontSize: sizes._14sdp,
                        color: colors.gray,
                        textAlign: 'center',
                      }}>
                        {i18n.t('common:ui.camera.wait')}
                      </TextBase>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        </Portal>

        {/* Result Modal */}
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

const styles = StyleSheet.create({
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xl},
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: color.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyText: {marginTop: space.xs, marginBottom: space.lg},
  emptyBtn: {alignSelf: 'stretch', marginTop: space.sm, borderRadius: 12},
  btnContent: {height: 48},
  center: {textAlign: 'center'},
});
