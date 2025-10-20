import React, {useEffect, useState, useCallback} from 'react';
import {
  ScrollView,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapboxGL from '@rnmapbox/maps';
import Page from '../../../component/Page';
import HeaderBase from '../../../component/HeaderBase';
import {BackSvg} from '../../../assets/assets/ImageSvg';
import colors from '../../../common/colors';
import sizes from '../../../common/sizes';
import {ILocation} from '../../../common/types';
import {AppStyle} from '../../../common/AppStyle';
import TextBase from '../../../common/TextBase';
import NavigationService from '../NavigationService';
import {ScreenName} from '../../AppContainer';
import SoundPlayer from 'react-native-sound-player';
import mapboxApi from '../../../services/mapbox.api';
import {Button, Modal} from 'react-native-paper';
import images from '../../../res/images';
import locationApi from '../../../services/locations.api';

MapboxGL.setAccessToken(
  'sk.eyJ1IjoibGVraGFuaGRhdCIsImEiOiJjbWdsdTdpOXIwOW43MmpyNTB3cGhyNWd0In0.Ddl4CSNIDIjkqGMEz-cS4A',
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
    backgroundColor: 'white', // White background
    borderColor: 'green', // Green border
    borderWidth: 3, // Border width
  },
  buttonText: {
    fontWeight: 'bold', // Làm đậm chữ
    color: '#F97350',
  },
  touchableText: {
    color: 'white',
    fontWeight: 'bold',
  },
  matchParent: {flex: 1},
});

interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  coordinates: {latitude: number; longitude: number}[];
}

const MapScreenV2 = ({navigation}: {navigation: any}) => {
  const [currentLat, setCurrentLat] = useState(0);
  const [currentLong, setCurrentLong] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number; longitude: number}[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]); // Lưu tất cả routes (main + alternatives)
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0); // Route đang được chọn
  const [routeDistance, setRouteDistance] = useState<number>(0); // Distance in meters
  const [routeDuration, setRouteDuration] = useState<number>(0); // Duration in seconds
  const [routeSteps, setRouteSteps] = useState<any[]>([]); // Turn-by-turn steps
  const [visible, setVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(
    null,
  );
  const [locationPermission, setLocationPermission] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to location to show your current position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setLocationPermission(true);
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
          // Fallback to default Đà Nẵng coordinates
          setCurrentLat(16.026084727153087);
          setCurrentLong(108.23980496658481);
        }
      } catch (err) {
        console.warn(err);
        // Fallback to default Đà Nẵng coordinates
        setCurrentLat(16.026084727153087);
        setCurrentLong(108.23980496658481);
      }
    } else {
      // iOS
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        setCurrentLat(latitude);
        setCurrentLong(longitude);
        console.log('Current location:', latitude, longitude);
      },
      (error) => {
        console.log('Error getting location:', error);
        // Fallback to default Đà Nẵng coordinates
        setCurrentLat(16.026084727153087);
        setCurrentLong(108.23980496658481);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const watchUserLocation = () => {
    const watchId = Geolocation.watchPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        setCurrentLat(latitude);
        setCurrentLong(longitude);
        console.log('📍 Location updated:', latitude, longitude);
      },
      (error) => {
        console.log('❌ Error watching location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0, // Không dùng cache, luôn lấy vị trí mới
        distanceFilter: 5, // Cập nhật khi di chuyển 5 mét (giảm từ 10m)
        interval: 5000, // Cập nhật mỗi 5 giây
        fastestInterval: 3000, // Nhanh nhất 3 giây
      },
    );
    return watchId;
  };

  const [visibleSecondModal, setVisibleSecondModal] = useState(false);
  const [locations, setLocations] = useState<ILocation[]>([]);
  const [focusLocation, setFocusLocation] = useState<ILocation | null>(null);
  const [shouldShowRoute, setShouldShowRoute] = useState(false);

  useEffect(() => {
    console.log('restart0-----------');

    // Request location permission and get current location
    requestLocationPermission();

    // Kiểm tra xem có location được truyền vào từ DetailLocation không
    const locationProps: ILocation[] = navigation?.state?.params?.locations ?? [];
    const showRoute = navigation?.state?.params?.showRoute ?? false;

    if (locationProps.length > 0) {
      // Nếu có location được truyền vào, dùng nó
      setLocations(locationProps);
      setFocusLocation(locationProps[0]); // Focus vào location đầu tiên
      setShouldShowRoute(showRoute); // Set flag để vẽ đường đi
      console.log('Using location from params:', locationProps[0]);
      console.log('Show route:', showRoute);

      // KHÔNG fetch route ở đây vì currentLat/currentLong chưa có
      // Sẽ fetch trong useEffect riêng khi đã có vị trí
    } else {
      // Nếu không, fetch từ NocoDB
      locationApi.getLocations().then(data => {
        setLocations(data);
      });
    }

    const onFinishedPlayingSubscription = SoundPlayer.addEventListener(
      'FinishedPlaying',
      ({success}) => {
        console.log('finished playing', success);
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
        console.log(
          'finished loading file2222',
          SoundPlayer.play(),
          name,
          type,
        );
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

    // Start watching user location for real-time updates
    const watchId = watchUserLocation();

    const focusListener = navigation.addListener('focus', () => {
      // Refresh location when screen comes into focus
      if (locationPermission) {
        getCurrentLocation();
      }
    });

    return () => {
      onFinishedPlayingSubscription.remove();
      onFinishedLoadingSubscription.remove();
      onFinishedLoadingFileSubscription.remove();
      // Clear location watch
      Geolocation.clearWatch(watchId);
      // Remove focus listener
      focusListener();
    };
  }, []);

  useEffect(() => {
    // Start watching location when permission is granted
    if (locationPermission) {
      const watchId = watchUserLocation();
      return () => {
        Geolocation.clearWatch(watchId);
      };
    }
  }, [locationPermission]);

  // Fetch route khi đã có vị trí hiện tại và cần hiển thị đường đi
  useEffect(() => {
    if (shouldShowRoute && focusLocation && currentLat !== 0 && currentLong !== 0) {
      console.log('🚗 Ready to fetch route - current location available');
      fetchRouteToLocation(focusLocation);
    }
  }, [shouldShowRoute, focusLocation, currentLat, currentLong]);

  const fetchRouteToLocation = async (location: ILocation) => {
    try {
      console.log('=== FETCHING ROUTE WITH MAPBOX ===');
      console.log('From:', currentLat, currentLong);
      console.log('To:', location.name, location.lat, location.long);

      // Kiểm tra vị trí hiện tại đã có chưa
      if (currentLat === 0 || currentLong === 0) {
        console.log('❌ Current location not available yet');
        return;
      }

      // Mapbox format: "long1,lat1;long2,lat2"
      const coordinates = `${currentLong},${currentLat};${location.long},${location.lat}`;

      console.log('Mapbox coordinates:', coordinates);

      const response = await mapboxApi.getDirections({
        profile: 'driving', // driving = xe máy/ô tô
        coordinates,
        geometries: 'geojson',
        overview: 'full',
        steps: true, // ✅ Bật turn-by-turn navigation
        alternatives: true, // ✅ Bật alternative routes
        banner_instructions: true,
        voice_instructions: true,
      });

      console.log('Mapbox response:', response);

      if (response && response.routes && response.routes.length > 0) {
        // Lưu tất cả routes (main + alternatives)
        const allRoutes: RouteInfo[] = response.routes.map((route: any) => {
          const geoJsonCoordinates = route.geometry.coordinates;
          const points = mapboxApi.convertGeoJSONToCoordinates(geoJsonCoordinates);

          return {
            distance: route.distance,
            duration: route.duration,
            coordinates: points,
          };
        });

        setRoutes(allRoutes);
        console.log('✅ Total routes:', allRoutes.length);

        // Hiển thị route đầu tiên (fastest)
        const mainRoute = response.routes[0];
        const geoJsonCoordinates = mainRoute.geometry.coordinates;
        const points = mapboxApi.convertGeoJSONToCoordinates(geoJsonCoordinates);

        console.log('✅ Main route - Distance:', mainRoute.distance, 'meters');
        console.log('✅ Main route - Duration:', mainRoute.duration, 'seconds');
        console.log('✅ Main route - Points:', points.length);

        setRouteCoordinates(points);
        setRouteDistance(mainRoute.distance);
        setRouteDuration(mainRoute.duration);

        // Lưu turn-by-turn steps
        if (mainRoute.legs && mainRoute.legs[0] && mainRoute.legs[0].steps) {
          const steps = mainRoute.legs[0].steps;
          console.log('✅ Turn-by-turn steps:', steps.length);
          console.log('📋 First step example:', steps[0]);
          setRouteSteps(steps);
        } else {
          console.log('❌ No steps found in route');
          console.log('Route structure:', {
            hasLegs: !!mainRoute.legs,
            legsLength: mainRoute.legs?.length,
            hasSteps: !!mainRoute.legs?.[0]?.steps,
          });
        }
      } else {
        console.log('❌ No routes found in response');
      }
    } catch (error: any) {
      console.error('❌ Error fetching route:', error);
    }
  };

  const onMarkerPress = (location: ILocation) => {
    setSelectedLocation(location);
    // setVisibleSecondModal(true);
  };

  const onRegionChange = () => {};

  const onPressView = () => {
    if (selectedLocation) {
      if (selectedLocation.voiceName) {
        SoundPlayer.stop();
        SoundPlayer.loadSoundFile(selectedLocation.voiceName, 'mp3');
      }
      setVisibleSecondModal(true);
    }
  };

  useEffect(() => {
    console.log({selectedLocation});
  }, [selectedLocation]);

  const locationProps: ILocation[] = navigation?.state?.params?.locations ?? [];
  console.log({locationProps});

  // Xác định tọa độ để focus camera
  const focusCoordinate =
    locationProps.length > 0
      ? [locationProps[0].long, locationProps[0].lat]
      : [currentLong, currentLat];

  const focusZoomLevel = locationProps.length > 0 ? 14 : 11; // Zoom gần hơn khi focus vào địa điểm cụ thể

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
  console.log('Focus coordinate:', focusCoordinate);
  console.log('🗺️ Route coordinates count:', routeCoordinates.length);
  console.log('🚗 Should show route:', shouldShowRoute);

  return (
    <Page>
      <HeaderBase
        title={'Bản đồ'}
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
      <View style={{flex: 1}}>
        <MapboxGL.MapView
          style={{flex: 1}}
          styleURL={MapboxGL.StyleURL.Satellite}
          onRegionDidChange={onRegionChange}>
          <MapboxGL.Camera
            centerCoordinate={focusCoordinate}
            zoomLevel={focusZoomLevel}
            animationDuration={1000}
          />

          {
            // (
            //   locationProps.length > 0
            //   ? locationProps
            //   : _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY)
            // )
            locations.map((location, index) => (
              <MapboxGL.PointAnnotation
                key={String(index)}
                id={`marker-${index}`}
                coordinate={[location.long, location.lat]}
                title={location.name}
                onSelected={() => onMarkerPress(location)}
                onDeselected={() => setSelectedLocation(null)}>
                <MapboxGL.Callout title={location.name} />
              </MapboxGL.PointAnnotation>
            ))
          }

          <MapboxGL.PointAnnotation
            key={'myLocation'}
            id={'myLocation'}
            coordinate={[currentLong, currentLat]}
            title={'Vị trí của tôi'}>
            <MapboxGL.Callout title={'Vị trí của tôi'} />
          </MapboxGL.PointAnnotation>

          {/* Vẽ đường đi nếu có routeCoordinates */}
          {routeCoordinates.length > 0 && (
            <MapboxGL.ShapeSource
              id="routeLine"
              shape={{
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates.map(point => [
                    point.longitude,
                    point.latitude,
                  ]),
                },
                properties: {},
              }}>
              <MapboxGL.LineLayer
                id="routeLineLayer"
                style={{
                  lineWidth: 6,
                  lineColor: '#0000FF', 
                  lineOpacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapboxGL.ShapeSource>
          )}
        </MapboxGL.MapView>
      </View>

      {/* Hiển thị Distance & Duration */}
      {routeDistance > 0 && routeDuration > 0 && (
        <View style={{
          position: 'absolute',
          top: 80,
          left: 10,
          right: 10,
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 12,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <TextBase style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>
                📍 {mapboxApi.formatDistance(routeDistance)}
              </TextBase>
              <TextBase style={{ fontSize: 14, color: colors.primary_950, marginTop: 4 }}>
                ⏱️ {mapboxApi.formatDuration(routeDuration)}
              </TextBase>
            </View>

            {routes.length > 1 && (
              <View style={{ marginLeft: 10 }}>
                <TextBase style={{ fontSize: 12, color: colors.primary_700 }}>
                  {routes.length} tuyến đường
                </TextBase>
              </View>
            )}
          </View>

          {/* Alternative Routes Buttons */}
          {routes.length > 1 && (
            <View style={{
              flexDirection: 'row',
              marginTop: 10,
              flexWrap: 'wrap',
            }}>
              {routes.map((route, index) => {
                const routeDist = route?.distance != null ? route.distance : 0;
                return (
                  <Button
                    key={index}
                    mode={selectedRouteIndex === index ? 'contained' : 'outlined'}
                    compact
                    onPress={() => {
                      setSelectedRouteIndex(index);
                      setRouteCoordinates(route.coordinates);
                      setRouteDistance(route.distance);
                      setRouteDuration(route.duration);
                      console.log(`Switched to route ${index + 1}`);
                    }}
                    style={{
                      borderColor: colors.primary,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                    labelStyle={{ fontSize: 12 }}
                  >
                    Tuyến {index + 1}: {mapboxApi.formatDistance(routeDist)}
                  </Button>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Buttons khi chọn địa điểm */}
      {selectedLocation && (
        <View style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          flexDirection: 'row',
          gap: 10,
        }}>
          <Button
            icon="directions"
            mode="outlined"
            onPress={() => {
              console.log('🧭 Chỉ đường đến:', selectedLocation.name);
              // Fetch route và hiển thị
              setFocusLocation(selectedLocation);
              setShouldShowRoute(true);
              fetchRouteToLocation(selectedLocation);
            }}
            style={{
              backgroundColor: colors.white,
              borderColor: colors.primary,
              borderWidth: 2,
            }}
            labelStyle={{
              color: colors.primary,
            }}
          >
            Chỉ đường
          </Button>

          <Button
            icon="arrow-up"
            mode="contained"
            onPress={() => {
              onPressView();
            }}
            style={{
              backgroundColor: colors.primary,
            }}
          >
            Xem
          </Button>
        </View>
      )}

      {/* Button Xem hướng dẫn từng bước */}
      {routeSteps.length > 0 && (
        <View style={{position: 'absolute', left: 10, bottom: 10}}>
          <Button
            icon="directions"
            mode="contained"
            onPress={() => {
              console.log('🧭 Opening turn-by-turn modal');
              console.log('Route steps count:', routeSteps.length);
              console.log('Route distance:', routeDistance);
              console.log('Route duration:', routeDuration);
              setVisible(true);
            }}
            style={{ backgroundColor: colors.primary_700 }}
          >
            Hướng dẫn
          </Button>
        </View>
      )}

      {/* Modal Turn-by-Turn Navigation */}
      <Modal
        visible={visible}
        onDismiss={() => setVisible(false)}
        contentContainerStyle={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: colors.white,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: 600,
              }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: sizes._16sdp,
                borderBottomWidth: 1,
                borderBottomColor: colors.primary_200,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextBase style={[AppStyle.txt_18_bold, { color: colors.primary }]}>
                    🧭 Hướng dẫn từng bước
                  </TextBase>
                  {routeSteps.length > 0 && (
                    <View style={{
                      marginLeft: 10,
                      backgroundColor: colors.primary_100,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <TextBase style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold' }}>
                        {routeSteps.length} bước
                      </TextBase>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <TextBase style={{ fontSize: 28, color: colors.primary_700, fontWeight: 'bold' }}>×</TextBase>
                </TouchableOpacity>
              </View>

              {/* Steps List */}
              {routeSteps.length > 0 ? (
                <ScrollView
                  style={{ padding: sizes._16sdp }}
                  showsVerticalScrollIndicator={true}
                >
                  {routeSteps.map((step: any, index: number) => {
                    // Kiểm tra và xử lý data
                    const distance = step?.distance != null ? mapboxApi.formatDistance(step.distance) : '0 m';
                    const instruction = step?.maneuver?.instruction || 'Tiếp tục đi';
                    const maneuverType = step?.maneuver?.type || '';
                    const modifier = step?.maneuver?.modifier || '';
                    const stepName = step?.name || '';
                    const stepDuration = step?.duration != null ? step.duration : 0;

                    // Icon dựa trên maneuver type
                    let icon = '➡️';
                    if (maneuverType === 'depart') icon = '🚗';
                    else if (maneuverType === 'arrive') icon = '🏁';
                    else if (maneuverType === 'turn') {
                      if (modifier.includes('left')) icon = '↰';
                      else if (modifier.includes('right')) icon = '↱';
                      else if (modifier === 'straight') icon = '⬆️';
                    } else if (maneuverType === 'roundabout') icon = '🔄';
                    else if (maneuverType === 'merge') icon = '🔀';

                    return (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          marginBottom: sizes._12sdp,
                          paddingBottom: sizes._12sdp,
                          borderBottomWidth: index < routeSteps.length - 1 ? 1 : 0,
                          borderBottomColor: colors.primary_100,
                        }}
                      >
                        {/* Step Number & Icon */}
                        <View style={{ alignItems: 'center', marginRight: 12 }}>
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: index === 0 ? colors.primary : colors.primary_200,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                            <TextBase style={{
                              color: index === 0 ? colors.white : colors.primary_700,
                              fontWeight: 'bold',
                              fontSize: 14,
                            }}>
                              {index + 1}
                            </TextBase>
                          </View>
                          <TextBase style={{ fontSize: 20, marginTop: 4 }}>
                            {icon}
                          </TextBase>
                        </View>

                        {/* Step Info */}
                        <View style={{ flex: 1 }}>
                          <TextBase style={[AppStyle.txt_14_medium, { color: colors.primary_950, lineHeight: 20 }]}>
                            {instruction}
                          </TextBase>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <TextBase style={[AppStyle.txt_12_regular, { color: colors.primary_700 }]}>
                              📍 {distance}
                            </TextBase>
                            {stepDuration > 0 && (
                              <TextBase style={[AppStyle.txt_12_regular, { color: colors.primary_600, marginLeft: 12 }]}>
                                ⏱️ {mapboxApi.formatDuration(stepDuration)}
                              </TextBase>
                            )}
                          </View>
                          {stepName && (
                            <TextBase style={[AppStyle.txt_12_regular, { color: colors.primary_600, marginTop: 4 }]}>
                              🛣️ {stepName}
                            </TextBase>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* Footer */}
                  {routeDistance > 0 && routeDuration > 0 && (
                    <View style={{
                      marginTop: 10,
                      padding: 12,
                      backgroundColor: colors.primary_50,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}>
                      <TextBase style={{ fontSize: 14, color: colors.primary_700, textAlign: 'center' }}>
                        🎯 Tổng cộng: {mapboxApi.formatDistance(routeDistance)} • {mapboxApi.formatDuration(routeDuration)}
                      </TextBase>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <View style={{ padding: sizes._32sdp, alignItems: 'center' }}>
                  <TextBase style={{ fontSize: 16, color: colors.primary_700, textAlign: 'center' }}>
                    Không có hướng dẫn chi tiết
                  </TextBase>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
            borderColor: 'green', // Green border
            borderWidth: 3, // Border width
          }}>
          <ScrollView>
            {selectedLocation && (
              <>
                <TextBase
                  style={[
                    AppStyle.txt_18_bold,
                    {
                      marginBottom: 10,
                      textAlign: 'center',
                      alignSelf: 'center',
                      color: '#F97350',
                    },
                  ]}>
                  {selectedLocation.name}
                </TextBase>
                <TextBase
                  style={[
                    AppStyle.txt_16_medium,
                    {marginBottom: 10, textAlign: 'justify'},
                  ]}>
                  {selectedLocation.description}
                </TextBase>
                <TextBase
                  style={[
                    AppStyle.txt_16_medium,
                    {marginBottom: 10, textAlign: 'justify'},
                  ]}>
                  Địa chỉ: {selectedLocation.address}
                </TextBase>
                <Image
                  source={{uri: selectedLocation.avatar}} // Image URL
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 8,
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
            alignItems: 'center', // Căn giữa theo chiều dọc
          }}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1, // Để View này chiếm phần còn lại
            }}>
            <Button
              mode="outlined"
              onPress={() => {
                NavigationService.navigate(ScreenName.ADVISE, {
                  location: selectedLocation,
                });
              }}
              style={[styles.customButton, { marginBottom: sizes._12sdp }]}
              labelStyle={styles.buttonText} // Sử dụng labelStyle để chỉnh sửa chữ trong Button
            >
              Quy tắc ứng xử văn minh
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                NavigationService.navigate(ScreenName.DETAIL_LOCATION_SCREEN, {
                  location: selectedLocation,
                });
              }}
              style={[styles.customButton, { marginBottom: sizes._12sdp }]}
              labelStyle={styles.buttonText}>
              Thông tin chi tiết
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                NavigationService.navigate(ScreenName.LOCATION_IMAGE, {
                  location: selectedLocation,
                });
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
                if (!selectedLocation || !selectedLocation.Id) {
                  return;
                }
                locationApi
                  .getItemsWithLocationId(selectedLocation.Id)
                  .then(data => {
                    NavigationService.navigate(ScreenName.VIEW_ALL_ITEM, {
                      title: 'Hiện vật',
                      // items: _.unionBy(LOCATION_POPULAR, LOCATION_NEARLY, 'id'),
                      items: data,
                      valueSearch: selectedLocation?.relatedKeyWord ?? '',
                    });
                  });
              }}
              style={styles.customButton}
              labelStyle={styles.buttonText}>
              Hiện vật tại đây
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                console.log('🧭 Chỉ đường đến:', selectedLocation?.name);
                // Đóng modal
                setVisibleSecondModal(false);
                // Fetch route và hiển thị
                if (selectedLocation) {
                  setFocusLocation(selectedLocation);
                  setShouldShowRoute(true);
                  fetchRouteToLocation(selectedLocation);
                }
              }}
              style={styles.customButton}
              labelStyle={styles.buttonText}>
              Chỉ đường
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
