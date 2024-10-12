import React from 'react';
import { Modal, View } from 'react-native';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import strings from '../../../res/strings';
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from 'react-native-maps';
import { LOCATION_POPULAR } from '../../../common/locationConstants';
import { LOCATION_NEARLY } from '../../../common/locationConstants';
import colors from '../../../common/colors';
import BackgroundGeolocation from "react-native-background-geolocation";
import { ActivityIndicator } from 'react-native-paper';
import _ from 'lodash';
import { ILocation } from '../../../common/types';
import axios from 'axios';
import { SPACE_WARNING } from '../../../common/constants';
import SoundPlayer from 'react-native-sound-player'
import { BackSvg } from '../../../assets/assets/ImageSvg';
import sizes from '../../../common/sizes';
import NavigationService from '../NavigationService';
import AIApi from '../../../services/AIApi';
import BottomSheet from '../../../component/BottomSheet';
import { AppStyle } from '../../../common/AppStyle';
import TextBase from '../../../common/TextBase';
import images from '../../../res/images';

interface IMapsScreenProps {
  navigation: any;
}

interface IMapsScreenState {
  currentLat: number;
  currentLong: number;
  routeCoordinates: any[];
  visible: boolean;
}

export default class MapsScreen extends React.PureComponent<IMapsScreenProps, IMapsScreenState> {
  _onFinishedPlayingSubscription: any = null
  _onFinishedLoadingSubscription: any = null
  _onFinishedLoadingFileSubscription: any = null
  _onFinishedLoadingURLSubscription: any = null
  isPlayingSuccess: boolean = true;
  locationShowWarning: ILocation | undefined | null = null;
  constructor(props: IMapsScreenProps) {
    super(props);
    this.state = {
      currentLat: 0,
      currentLong: 0,
      routeCoordinates: [],
      visible: false,
    }
  }

  componentDidMount(): void {
    SoundPlayer.stop()

    this._onFinishedPlayingSubscription = SoundPlayer.addEventListener('FinishedPlaying', ({ success }) => {
      console.log('finished playing', success)
      this.isPlayingSuccess = true;
    })
    this._onFinishedLoadingSubscription = SoundPlayer.addEventListener('FinishedLoading', ({ success }) => {
      console.log('finished loading', success)
    })
    this._onFinishedLoadingFileSubscription = SoundPlayer.addEventListener('FinishedLoadingFile', ({ success, name, type }) => {
      console.log('finished loading file', success, name, type)
      SoundPlayer.play()
      this.setState({
        visible: true
      })
    })


    this.props.navigation.addListener('focus', () => {
      BackgroundGeolocation.ready({

      }).then((state) => {
        BackgroundGeolocation.start();
        BackgroundGeolocation.getCurrentPosition({}, (location) => {

          this.setState({
            currentLat: location.coords.latitude,
            currentLong: location.coords.longitude,
          })
        })
        BackgroundGeolocation.watchPosition((position) => {
          console.log('xxxxx-----', position)
          this.setState({
            currentLat: position.coords.latitude,
            currentLong: position.coords.longitude,
          });
          if (!this.isPlayingSuccess) {
            return;
          }
          let localLocationShow: ILocation | undefined | null = null;
          let isPlayVoice = false;
          ((locationProps?.length > 0 ? locationProps : _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY))).forEach(location => {
            if (!location.haveVoice) {
              return;
            }
            const mile = this.haversineDistance({ latitude: location.lat, longitude: location.long }, { latitude: position.coords.latitude, longitude: position.coords.longitude })
            if (mile > SPACE_WARNING) {
              return;
            }
            localLocationShow = location;
            isPlayVoice = true;
          })
          if (localLocationShow?.id === this.locationShowWarning?.id) {
            return;
          }
          this.locationShowWarning = localLocationShow;
          if (isPlayVoice) {
            try {
              SoundPlayer.loadSoundFile('warning', 'mp3')
            } catch (e) {
              console.log(`cannot play the sound file`, e)
            }
          }
        }, () => { }, { interval: 20000 });
      });
    })

    this.props.navigation.addListener('blur', () => {
      // SoundPlayer.stop()
      BackgroundGeolocation.stopWatchPosition();
    })




    const locationProps: ILocation[] = this.props.navigation.state?.params?.locations ?? [];

    if (locationProps.length > 0) {
      this.fetchRoute()
    }
  }

  fetchRoute = async () => {
    const locationProps: ILocation[] = this.props.navigation.state?.params?.locations ?? [];
    const first = locationProps[0]
    try {
      const params = {
        key: 'AIzaSyBex7Qrp4f4xvQYnChRpe6o7wV7KurxzUE',
        mode: 'walking',
        origin: [this.state.currentLat, this.state.currentLong].toString(),
        destination: [first.lat, first.long].toString()
      }
      const response = await AIApi.getLine(params);
      if (response.data.routes.length) {
        const points = this.decodePolyline(response.data.routes[0].overview_polyline.points);
        this.setState({
          routeCoordinates: points,
        })
      }
    } catch (error: any) {
    }
  };

  decodePolyline = (t: any) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };


  componentWillUnmount(): void {
    BackgroundGeolocation.stopWatchPosition();
  }

  onRegionChange = () => {

  }

  toRadian = (angle: any) => (Math.PI / 180) * angle;
  haversineDistance = (coords1: any, coords2: any) => {
    const R = 6371; // Bán kính Trái Đất theo km

    const dLat = this.toRadian(coords2.latitude - coords1.latitude);
    const dLon = this.toRadian(coords2.longitude - coords1.longitude);

    const lat1 = this.toRadian(coords1.latitude);
    const lat2 = this.toRadian(coords2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceInKm = R * c; // Khoảng cách theo km
    const distanceInMeters = distanceInKm * 1000; // Chuyển đổi sang mét

    return distanceInMeters; // Trả về khoảng cách theo mét
  }

  render(): React.ReactNode {
    const locationProps: ILocation[] = this.props.navigation?.state?.params?.locations ?? [];
    return (
      <Page>
        <HeaderBase hideLeftIcon={locationProps.length === 0} title={strings.map}
          leftIconSvg={
            locationProps.length > 0 && <BackSvg
              width={sizes._24sdp}
              height={sizes._24sdp}
              color={colors.primary_950}
            />
          }
          onLeftIconPress={() => {
            NavigationService.pop()
          }}
        />
        <View style={{ flex: 1 }}>
          {
            this.state.currentLat === 0 && this.state.currentLong === 0 ?
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator animating={true} color={colors.primary} size={'large'} />
              </View>
              :
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1, }}
                initialRegion={{
                  latitude: this.state.currentLat,
                  longitude: this.state.currentLong,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                onRegionChange={this.onRegionChange}
              >
                {
                  (locationProps?.length > 0 ? locationProps : _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY)).map((location, index) => {
                    return <Marker
                      key={index}
                      coordinate={{ latitude: location.lat, longitude: location.long }}
                      title={location.name}
                      description={location.description}
                      pinColor={colors.primary}
                      icon={location.icon}
                    />
                  })
                }
                <Marker
                  key={'myLocation'}
                  coordinate={{ latitude: this.state.currentLat, longitude: this.state.currentLong }}
                  title={'Vị trí của bạn'}
                />
                {
                  locationProps.length > 0 &&
                  <Polyline
                    coordinates={[{ latitude: this.state.currentLat, longitude: this.state.currentLong }, { latitude: locationProps[0].lat, longitude: locationProps[0].long }]}
                    strokeWidth={4}
                  />
                }
              </MapView>
          }
        </View>

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
            <View style={{ width: sizes.width - sizes._32sdp, padding: sizes._16sdp, backgroundColor: colors.white, borderRadius: sizes._8sdp }}>
              <TextBase style={AppStyle.txt_16_bold}>
                Người dân và du khách hãy chung tay giữ gìn lá phổi xanh Sơn Trà - Đà Nẵng bằng cách:
              </TextBase>
              <View style={{height: sizes._16sdp}}/>
              <TextBase style={AppStyle.txt_14_regular}>- Bỏ rác vào thùng hoặc mang rác về sau khi tham quan tại Bán đảo Sơn Trà.</TextBase>
              <View style={{height: sizes._8sdp}}/>

              <TextBase style={AppStyle.txt_14_regular}>- Không cho khỉ ăn bằng bất kỳ hình thức nào hoặc tiếp xúc gần với khỉ, điều này giúp bảo vệ đàn khỉ và tránh các nguy cơ gây hại cho con người, vì khỉ có thể tấn công hoặc lây nhiễm các bệnh do vi khuẩn và vi-rút sang con người. </TextBase>
              <View style={{height: sizes._8sdp}}/>

              <TextBase style={AppStyle.txt_14_regular}>Tham quan trải nghiệm cho chúng ta </TextBase>
              <View style={{height: sizes._8sdp}}/>

              <TextBase style={AppStyle.txt_14_regular}>Bảo vệ cảnh quan thiên nhiên và đa dạng sinh học cho Bán đảo Sơn Trà.</TextBase>
            </View>
          </View>
        </Modal>
      </Page>
    );
  }
}