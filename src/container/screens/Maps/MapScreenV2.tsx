import React, {useEffect, useState, useCallback} from 'react';
import {
  ScrollView,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  Linking,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Page from '../../../component/Page';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import {
  LOCATION_POPULAR,
  LOCATION_NEARLY,
} from '../../../common/locationConstants';
import {ILocation} from '../../../common/types';
import {AppStyle} from '../../../common/AppStyle';
import TextBase from '../../../common/TextBase';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import _ from 'lodash';
// import BackgroundGeolocation from 'react-native-background-geolocation';
import SoundPlayer from 'react-native-sound-player';
import AIApi from '../../../services/AIApi';
import {SPACE_WARNING} from '../../../common/constants';
import haversineDistance from '../../../utils/haversineDistance';
import decodePolyline from '../../../utils/decodePolyline';
import {Button, Modal, Text} from 'react-native-paper';
import images from '../../../res/images';


MapboxGL.setAccessToken(
  'pk.eyJ1IjoiaG9hbmd0cnVuZzE4MDEiLCJhIjoiY20ybXVpbDJ3MHF6NzJqcHMyOWJnbzQ0OSJ9.eMymOvaYvLYhRhoMTLhPng',
);

const styles = StyleSheet.create({
  touchableContainer: {borderColor: 'black', borderWidth: 1.0, width: 60},
  touchable: {
    backgroundColor: 'blue',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customButton: {
    backgroundColor: 'white',  // White background
    borderColor: 'green',  // Green border
    borderWidth: 3,  // Border width
  },
  buttonText: {
    fontWeight: 'bold',  // Làm đậm chữ
  },
  touchableText: {
    color: 'white',
    fontWeight: 'bold',
  },
  matchParent: {flex: 1},
});

const AnnotationContent = ({title}: {title: string}) => (
  <View style={styles.touchableContainer}>
    <Text>{title}</Text>
    <TouchableOpacity
      style={styles.touchable}
      onPress={() => {
        console.log('1234');
      }}>
      <Text style={styles.touchableText}>Btn</Text>
    </TouchableOpacity>
  </View>
);

const MapScreenV2 = ({navigation}: {navigation: any}) => {
  const [currentLat, setCurrentLat] = useState(16.058425754796364);
  const [currentLong, setCurrentLong] = useState(108.23708583212756);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(
    null,
  );
  const openGoogleForm = () => {
    const url = 'https://hoanghoatham.edu.vn/'; // Thay bằng link Google Form của bạn
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };
  
  const [visibleSecondModal, setVisibleSecondModal] = useState(false);
  const [isPlayingSuccess, setIsPlayingSuccess] = useState(true);
  const [locationShowWarning, setLocationShowWarning] = useState<
    ILocation | undefined | null
  >(null);

  useEffect(() => {
    console.log('restart0-----------')

    const onFinishedPlayingSubscription = SoundPlayer.addEventListener(
      'FinishedPlaying',
      ({success}) => {
        console.log('finished playing', success);
        setIsPlayingSuccess(true);
      },
    );

    const onFinishedLoadingSubscription = SoundPlayer.addEventListener(
      'FinishedLoading',
      ({success}) => {
        console.log('finished loading', success);
      },
    );

    const onFinishedLoadingFileSubscription = SoundPlayer.addEventListener(
      'FinishedLoadingFile',
      ({success, name, type}) => {
        console.log('finished loading file111111', success, name, type);
        SoundPlayer.play();
        console.log('finished loading file2222', SoundPlayer.play(), name, type);
      },
    );

    // const focusListener = navigation.addListener('focus', () => {
    //   BackgroundGeolocation.ready({}).then(state => {
    //     BackgroundGeolocation.start();
    //     BackgroundGeolocation.getCurrentPosition({}, location => {
    //       setCurrentLat(location.coords.latitude);
    //       setCurrentLong(location.coords.longitude);
    //     });
    //     BackgroundGeolocation.watchPosition(
    //       position => {
    //         console.log('xxxxx-----', position);
    //         setCurrentLat(position.coords.latitude);
    //         setCurrentLong(position.coords.longitude);

    //         if (!isPlayingSuccess) {
    //           return;
    //         }

    //         let localLocationShow: ILocation | undefined | null = null;
    //         let isPlayVoice = false;
    //         (locationProps?.length > 0
    //           ? locationProps
    //           : _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY)
    //         ).forEach(location => {
    //           if (!location.haveVoice) {
    //             return;
    //           }
    //           const mile = haversineDistance(
    //             {latitude: location.lat, longitude: location.long},
    //             {
    //               latitude: position.coords.latitude,
    //               longitude: position.coords.longitude,
    //             },
    //           );
    //           if (mile > SPACE_WARNING) {
    //             return;
    //           }
    //           localLocationShow = location;
    //           isPlayVoice = true;
    //         });

    //         if (localLocationShow?.id === locationShowWarning?.id) {
    //           return;
    //         }
    //         setLocationShowWarning(localLocationShow);

    //         if (isPlayVoice) {
    //           try {
    //             SoundPlayer.loadSoundFile('warning', 'mp3');
    //           } catch (e) {
    //             console.log(`cannot play the sound file`, e);
    //           }
    //         }
    //       },
    //       () => {},
    //       {interval: 20000},
    //     );
    //   });
    // });

    // const blurListener = navigation.addListener('blur', () => {
    //   BackgroundGeolocation.stopWatchPosition();
    // });

    // const locationProps: ILocation[] =
    //   navigation.state?.params?.locations ?? [];
    // if (locationProps.length > 0) {
    //   fetchRoute();
    // }

    return () => {
      // onFinishedPlayingSubscription.remove();
      // onFinishedLoadingSubscription.remove();
      // onFinishedLoadingFileSubscription.remove();
      // focusListener();
      // blurListener();
      // BackgroundGeolocation.stopWatchPosition();
    };
  }, []);

  // const fetchRoute = async () => {
  //   const locationProps: ILocation[] =
  //     navigation.state?.params?.locations ?? [];
  //   const first = locationProps[0];
  //   try {
  //     const params = {
  //       key: 'AIzaSyBex7Qrp4f4xvQYnChRpe6o7wV7KurxzUE',
  //       mode: 'walking',
  //       origin: [currentLat, currentLong].toString(),
  //       destination: [first.lat, first.long].toString(),
  //     };
  //     const response = await AIApi.getLine(params);
  //     if (response.data.routes.length) {
  //       const points = decodePolyline(
  //         response.data.routes[0].overview_polyline.points,
  //       );
  //       setRouteCoordinates(points);
  //     }
  //   } catch (error: any) {
  //     console.error('Error fetching route:', error);
  //   }
  // };

  const onMarkerPress = (location: ILocation) => {
    setSelectedLocation(location);
    // setVisibleSecondModal(true);
  };

  const onRegionChange = () => {};

  const onPressView = () => {
    if (selectedLocation) {
      if(selectedLocation.voiceName) {
        SoundPlayer.stop();
        SoundPlayer.loadSoundFile(selectedLocation.voiceName, 'mp3')
      }
      setVisibleSecondModal(true);
    }
  };

  useEffect(() => {
    console.log({selectedLocation});
  }, [selectedLocation]);

  const locationProps: ILocation[] = navigation?.state?.params?.locations ?? [];

  if (currentLat === 0 || currentLong === 0) {
    return (
      <Page>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Page>
    );
  }

  console.log([currentLong, currentLat]);

  return (
    <Page>
      <View style={{flex: 1}}>
        <MapboxGL.MapView
          style={{flex: 1}}
          styleURL={MapboxGL.StyleURL.Satellite}
          onRegionDidChange={onRegionChange}>
          <MapboxGL.Camera
            centerCoordinate={[currentLong, currentLat]}
            zoomLevel={17}
          />

          {(locationProps.length > 0
            ? locationProps
            : _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY)
          ).map((location, index) => (
            <MapboxGL.PointAnnotation
              key={String(index)}
              id={`marker-${index}`}
              coordinate={[location.long, location.lat]}
              title={location.name}
              onSelected={() => onMarkerPress(location)}
              onDeselected={() => setSelectedLocation(null)}>
              <MapboxGL.Callout title={location.name} />
            </MapboxGL.PointAnnotation>
          ))}

          <MapboxGL.PointAnnotation
            key={'myLocation'}
            id={'myLocation'}
            coordinate={[currentLong, currentLat]}
            title={'Vị trí của tôi'}>
            <MapboxGL.Callout title={'Vị trí của tôi'} />
          </MapboxGL.PointAnnotation>

          {/* {locationProps.length > 0 && (
            <MapboxGL.ShapeSource
              id="line1"
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [currentLong, currentLat],
                    [locationProps[0].long, locationProps[0].lat],
                  ],
                },
                properties: {}, // Add an empty properties object
              }}>
              <MapboxGL.LineLayer
                id="linelayer1"
                style={{lineWidth: 4, lineColor: colors.primary}}
              />
            </MapboxGL.ShapeSource>
          )} */}
        </MapboxGL.MapView>
      </View>

      {selectedLocation && (
        <View style={{position: 'absolute', right: 10, bottom: 10}}>
          <Button
            icon="arrow-up"
            mode="contained"
            onPress={() => {
              onPressView();
            }}>
            Xem
          </Button>
        </View>
      )}

      <Modal visible={visible}>
        <View
          onStartShouldSetResponder={() => {
            setVisible(false);
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
              backgroundColor: colors.white,
              borderRadius: sizes._8sdp,
            }}>
            <TextBase style={AppStyle.txt_16_bold}>
              Người dân và du khách hãy chung tay giữ gìn lá phổi xanh Sơn Trà -
              Đà Nẵng bằng cách:
            </TextBase>
            <View style={{height: sizes._16sdp}} />
            <TextBase style={AppStyle.txt_14_regular}>
              - Bỏ rác vào thùng hoặc mang rác về sau khi tham quan tại Bán đảo
              Sơn Trà.
            </TextBase>
            <View style={{height: sizes._8sdp}} />
            <TextBase style={AppStyle.txt_14_regular}>
              - Không cho khỉ ăn bằng bất kỳ hình thức nào hoặc tiếp xúc gần với
              khỉ, điều này giúp bảo vệ đàn khỉ và tránh các nguy cơ gây hại cho
              con người, vì khỉ có thể tấn công hoặc lây nhiễm các bệnh do vi
              khuẩn và vi-rút sang con người.
            </TextBase>
            <View style={{height: sizes._8sdp}} />
            <TextBase style={AppStyle.txt_14_regular}>
              Tham quan trải nghiệm cho chúng ta
            </TextBase>
            <View style={{height: sizes._8sdp}} />
            <TextBase style={AppStyle.txt_14_regular}>
              Bảo vệ cảnh quan thiên nhiên và đa dạng sinh học cho Bán đảo Sơn
              Trà.
            </TextBase>
          </View>
        </View>
      </Modal>

      <Modal
        visible={visibleSecondModal}
        onDismiss={() => {
          setVisibleSecondModal(false);
        }}>
        <View
          style={{
            width: sizes.width - sizes._32sdp,
            maxHeight: 300,
            // height: 400, // Fixed height for the modal
            padding: sizes._16sdp,
            backgroundColor: colors.white,
            borderRadius: sizes._16sdp,
            marginHorizontal: 'auto',
            borderColor: 'green',  // Green border
            borderWidth: 3,  // Border width
          }}>
          <ScrollView>
            {selectedLocation && (
              <>
                <TextBase style={[AppStyle.txt_18_bold, {marginBottom: 10, textAlign: 'center', alignSelf: 'center',}]}>
                  {selectedLocation.name}
                </TextBase>
                <TextBase style={[AppStyle.txt_16_medium, {marginBottom: 10, textAlign: 'justify'}]}>
                  {selectedLocation.description}
                </TextBase>
                <TextBase style={[AppStyle.txt_16_medium, {marginBottom: 10, textAlign: 'justify'}]}>
                  Địa chỉ: {selectedLocation.address}
                </TextBase>
                <Image
                  source={{uri: selectedLocation.avatar}} // Image URL
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
                    marginBottom: 10,
                  }} // Customize size and style
                  resizeMode="cover" // Image display mode
                />

                
              </>
            )}
          </ScrollView>
        </View>

        <View
    style={{
      width: sizes.width - sizes._32sdp,
      maxHeight: 400,
      paddingHorizontal: sizes._20sdp,
      padding: sizes._8sdp,
      backgroundColor: 'rgba(255, 255, 255, 0.0)', // Nền trong suốt
      borderRadius: sizes._16sdp,
      marginHorizontal: 'auto',
      marginTop: sizes._8sdp,
      flexDirection: 'row', // Thay đổi chiều hướng của View
      alignItems: 'center',  // Căn giữa theo chiều dọc
    }}>
    <View
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: sizes._12sdp,
                    flex: 1, // Để View này chiếm phần còn lại
                  }}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      NavigationService.navigate(
                        ScreenName.ADVISE,
                        {
                          location: selectedLocation,
                        },
                      );
                    }}
                    style={styles.customButton}
                    labelStyle={styles.buttonText} // Sử dụng labelStyle để chỉnh sửa chữ trong Button
                    >
                    Quy tắc ứng xử văn minh
                  </Button>


                  <Button
                    mode="outlined"
                    onPress={() => {
                      NavigationService.navigate(
                        ScreenName.DETAIL_LOCATION_SCREEN,
                        {
                          location: selectedLocation,
                        },
                      );
                    }}
                    style={styles.customButton}
                    labelStyle={styles.buttonText}>
                    Thông tin chi tiết
                  </Button>                  

                  <Button
                    mode="outlined"
                    onPress={() => {
                      NavigationService.navigate(
                        ScreenName.LOCATION_IMAGE,
                        {
                          location: selectedLocation,
                        },
                      );
                    }}
                    style={styles.customButton}
                    labelStyle={styles.buttonText}>
                    Hình ảnh & Video
                  </Button>

                  {/* <Button
                    mode="contained"
                    onPress={() => {
                      NavigationService.navigate(
                        ScreenName.LOCATION_VIDEO,
                        {
                          location: selectedLocation,
                        },
                      );
                    }}>
                    Xem thêm video
                  </Button> */}

                  <Button
                    mode="outlined"
                    onPress={() => {
                      NavigationService.navigate(ScreenName.VIEW_ALL_SCREEN, {
                        title:'Tìm kiếm',
                        locations: _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
                        valueSearch: selectedLocation?.relatedKeyWord ?? '',
                      });
                    }}
                    style={styles.customButton}
                    labelStyle={styles.buttonText}>
                    Hiện vật tại đây
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={openGoogleForm}
                    style={styles.customButton}
                    labelStyle={styles.buttonText}>
                    Trắc nghiệm tìm hiểu
                  </Button>
                </View>

                    {/* Hình ảnh ở bên phải của các button */}
    <Image
        source={images.dantoc}
        style={{
          width: 100, // Đặt chiều rộng cho hình ảnh
          height: 270, // Đặt chiều cao cho hình ảnh
          marginLeft: sizes._16sdp, // Khoảng cách giữa button và hình ảnh
        }}
    />
  </View>
      </Modal>
    </Page>
  );
};

export default MapScreenV2;
