jest.mock('@react-navigation/native', () => ({useIsFocused: () => true}));
const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('@rnmapbox/maps', () => {
  const ReactMock = require('react');
  // Class components so the screen's refs (mapRef/cameraRef) attach.
  const host = name => class extends ReactMock.Component {
    fitBounds = jest.fn();
    setCamera = jest.fn();
    getClusterExpansionZoom = jest.fn(async () => 14);
    getClusterLeaves = jest.fn(async () => ({features: []}));
    render() {return ReactMock.createElement(name, this.props, this.props.children);}
  };
  return {__esModule: true, default: {
    setAccessToken: jest.fn(),
    StyleURL: {Outdoors: 'outdoors', Satellite: 'satellite', Dark: 'dark'},
    MapView: host('MapView'), Camera: host('Camera'), MarkerView: host('MarkerView'),
    Images: host('Images'), Image: host('MapImage'), SymbolLayer: host('SymbolLayer'), CircleLayer: host('CircleLayer'),
    ShapeSource: host('ShapeSource'), LineLayer: host('LineLayer'), VectorSource: host('VectorSource'),
  }};
});
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(), watchPosition: jest.fn(() => 1), clearWatch: jest.fn(), setRNConfiguration: jest.fn(),
}));
jest.mock('react-native-sound-player', () => ({
  addEventListener: () => ({remove: jest.fn()}), stop: jest.fn(), loadSoundFile: jest.fn(), play: jest.fn(),
}));
jest.mock('react-native-tts', () => ({
  setDefaultLanguage: jest.fn(async () => {}), setDefaultRate: jest.fn(async () => {}),
  setDefaultPitch: jest.fn(async () => {}), addEventListener: jest.fn(), removeAllListeners: jest.fn(),
  stop: jest.fn(), speak: jest.fn(),
}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
jest.mock('react-native-paper', () => ({Button: 'Button', Modal: 'Modal'}));
jest.mock('react-i18next', () => ({useTranslation: () => ({t: key => key})}));
jest.mock('../src/services/mapbox.api', () => ({
  formatDistance: jest.fn(value => `${value} m`),
  formatDuration: jest.fn(value => `${value} s`),
  getDirections: jest.fn(), convertGeoJSONToCoordinates: coords => coords.map(([longitude, latitude]) => ({latitude, longitude})),
}));
jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn(), pop: jest.fn()}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/CachedImage', () => 'CachedImage');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));

const {PermissionsAndroid, Platform, AppState} = require('react-native');
const Geolocation = require('@react-native-community/geolocation');
const Toast = require('react-native-toast-message');
const mapboxApi = require('../src/services/mapbox.api');
const catalogRepository = require('../src/services/catalogRepository').default;
const {buildCatalogSnapshot} = require('../src/services/catalogRepository');
const MapScreen = require('../src/container/screens/Maps/MapScreen').default;
// Module-level configuration, captured before afterEach clears mock calls.
const geoConfigCalls = [...Geolocation.setRNConfiguration.mock.calls];

const place = (id, extra) => ({id, name: `Place ${id}`, description: '', address: '', avatar: '', images: [],
  lat:16.05 + id / 100, long: 108.2, publishable: true, ...extra});
const snapshot = buildCatalogSnapshot([
  place(1, {lat: 16.06}), place(2, {publishable: false}), place(3, {lat: null, long: null}), place(4, {lat: 16.09}),
], []);
const props = () => ({navigation: {addListener: jest.fn(() => jest.fn())}, route: {params: {}}});
const source = tree => tree.root.find(node => node.type === 'ShapeSource' && node.props.id === 'catalogMarkers');
const features = tree => source(tree).props.shape.features;
const markerIds = tree => [...features(tree).map(feature => feature.id),
  ...tree.root.findAll(node => node.type === 'MarkerView').map(node => node.props.id)];
const tapPoint = (tree, id) => source(tree).props.onPress({features: features(tree).filter(feature => feature.id === id)});
const directionsButton = tree => tree.root.find(node => node.type === 'Button' && node.props.icon === 'directions');
// Fixes come from watchPosition (utils/preciseLocation for the first fix, then the live watch).
const giveFix = coords => Geolocation.watchPosition.mockImplementation(success => {
  success({coords: {accuracy: 5, ...coords}});
  return 1;
});

describe('Map (P4)', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    AppState.currentState = 'active';
    // No fix unless a test gives one (clearAllMocks keeps implementations from earlier tests).
    Geolocation.watchPosition.mockReset().mockImplementation(() => 1);
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
  });
  afterEach(() => {jest.restoreAllMocks(); jest.clearAllMocks();});

  it('shows only publishable markers with GPS; a denied permission blocks directions and "you are here"', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
    expect(markerIds(tree)).toEqual(['location-1', 'location-4']);
    expect(features(tree).map(feature => feature.geometry.coordinates)).toEqual([[108.2, 16.06], [108.2, 16.09]]);
    expect(markerIds(tree)).not.toContain('myLocation');
    // Select a marker and ask for directions without a real GPS fix.
    await act(async () => {await tapPoint(tree, 'location-1');});
    await act(async () => {directionsButton(tree).props.onPress();});
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({type: 'info'}));
    expect(mapboxApi.getDirections).not.toHaveBeenCalled();
    await act(async () => {tree.unmount();});
  });

  it('routes from the real position once GPS is available; only foreground location APIs are used', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    giveFix({latitude: 16.0, longitude: 108.1});
    mapboxApi.getDirections.mockResolvedValue({routes: [{distance: 1200, duration: 300, legs: [{steps: []}],
      geometry: {coordinates: [[108.1, 16.0], [108.2, 16.06]]}}]});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
    expect(markerIds(tree)).toContain('myLocation');
    await act(async () => {await tapPoint(tree, 'location-1');});
    await act(async () => {await directionsButton(tree).props.onPress();});
    expect(mapboxApi.getDirections).toHaveBeenCalledTimes(1);
    expect(mapboxApi.getDirections).toHaveBeenCalledWith(expect.objectContaining({coordinates: '108.1,16;108.2,16.06'}));
    expect(Toast.show).not.toHaveBeenCalled();
    expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
    await act(async () => {tree.unmount();});
    expect(Geolocation.clearWatch).toHaveBeenCalled();
  });

  const cameraCenter = tree => tree.root.find(node => node.type === 'Camera').props.centerCoordinate;

  it('opens on the catalog area for a far (stale) fix, moves to the user once on the first nearby fix, then stays', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    // Emulator default position (California): "you are here" is shown there, the map opens on the markers.
    let onWatch;
    Geolocation.watchPosition
      .mockImplementation(success => {onWatch = success; success({coords: {latitude: 37.42, longitude: -122.08, accuracy: 5}}); return 1;});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
    expect(markerIds(tree)).toContain('myLocation');
    expect(cameraCenter(tree)).toEqual([108.2, 16.075]);
    await act(async () => {onWatch({coords: {latitude: 16.07, longitude: 108.21}});});
    expect(cameraCenter(tree)).toEqual([108.21, 16.07]);
    await act(async () => {onWatch({coords: {latitude: 16.08, longitude: 108.22}});});
    expect(cameraCenter(tree)).toEqual([108.21, 16.07]);
    await act(async () => {tree.unmount();});
  });

  it('uses the fused provider in high accuracy only; never LOW_POWER nor the crashing getCurrentPosition', async () => {
    expect(geoConfigCalls[0]).toEqual([expect.objectContaining({locationProvider: 'playServices'})]);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    // An "unavailable" error does not end the wait; the next fix is used.
    Geolocation.watchPosition.mockImplementation((success, failure) => {
      failure({code: 2, message: 'unavailable'});
      success({coords: {latitude: 16.0, longitude: 108.1, accuracy: 8}});
      return 1;
    });
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
    expect(Geolocation.watchPosition.mock.calls.every(call => call[2].enableHighAccuracy === true)).toBe(true);
    expect(Geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(markerIds(tree)).toContain('myLocation');
    await act(async () => {tree.unmount();});
  });

  it('opens on the user when near the catalog, and on the focused place (even if not publishable) from Detail', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    giveFix({latitude: 16.0, longitude: 108.1});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
    expect(cameraCenter(tree)).toEqual([108.1, 16.0]);
    await act(async () => {tree.unmount();});
    const hidden = snapshot.locationById.get(2);
    await act(async () => {tree = renderer.create(React.createElement(MapScreen,
      {...props(), route: {params: {locations: [hidden], showRoute: false}}}));});
    expect(markerIds(tree)).toEqual(['location-2', 'myLocation']);
    expect(cameraCenter(tree)).toEqual([108.2, hidden.lat]);
    await act(async () => {tree.unmount();});
  });

  it('festival mode shows every festival at its venue (any location with GPS) and opens its detail', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    const festival = (id, location_id) => ({id, name: `Lá»… há»™i ${id}`, description: '', images: [], location_id,
      event_time: '', content_en: {}});
    // 10 at a publishable place, 11 at a non-publishable place, 12 at a place without GPS, 13 without a place.
    const withFestivals = buildCatalogSnapshot(snapshot.locations,
      [festival(10, 1), festival(11, 2), festival(12, 3), festival(13, null)]);
    catalogRepository.get.mockResolvedValue(withFestivals);
    const NavigationService = require('../src/container/screens/NavigationService');
    const modeButton = (tree, key) => tree.root.find(node => node.type === require('react-native').TouchableOpacity &&
      node.findAll(child => React.Children.toArray(child.props.children).some(value => typeof value === 'string' && value.includes(key))).length > 0);
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
    expect(markerIds(tree)).toEqual(['location-1', 'location-4']);
    await act(async () => {modeButton(tree, 'map.modeFestivals').props.onPress();});
    expect(markerIds(tree)).toEqual(['festival-10', 'festival-11']);
    const venue = withFestivals.locationById.get(2);
    expect(features(tree).find(feature => feature.id === 'festival-11').geometry.coordinates).toEqual([venue.long, venue.lat]);
    await act(async () => {
      await tapPoint(tree, 'festival-10');
    });
    expect(NavigationService.navigate).toHaveBeenCalledWith(undefined, {festival: withFestivals.festivalById.get(10)});
    await act(async () => {modeButton(tree, 'map.modeLocations').props.onPress();});
    expect(markerIds(tree)).toEqual(['location-1', 'location-4']);
    await act(async () => {tree.unmount();});
    // Opened for one place (from Detail): no mode switch.
    await act(async () => {tree = renderer.create(React.createElement(MapScreen,
      {...props(), route: {params: {locations: [withFestivals.locationById.get(1)], showRoute: false}}}));});
    expect(tree.root.findAll(node => React.Children.toArray(node.props.children).some(value => typeof value === 'string' && value.includes('map.modeFestivals')))).toHaveLength(0);
    await act(async () => {tree.unmount();});
  });
});


it('clusters at low zoom, expands clusters, and offers every overlapping festival at high zoom', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  AppState.currentState = 'active';
  jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
  const festivals = [10, 11].map(id => ({id, name: `Festival ${id}`, images: [], location_id: 1, content_en: {}}));
  jest.spyOn(catalogRepository, 'get').mockResolvedValue(buildCatalogSnapshot(snapshot.locations, festivals));
  const NavigationService = require('../src/container/screens/NavigationService');
  NavigationService.navigate.mockClear();
  let tree;
  await act(async () => {tree = renderer.create(React.createElement(MapScreen, props()));});
  expect(source(tree).props).toMatchObject({cluster: true, clusterMaxZoomLevel: 13});
  const mode = tree.root.find(node => node.type === require('react-native').TouchableOpacity &&
    node.findAll(child => React.Children.toArray(child.props.children).includes('map.modeFestivals')).length > 0);
  await act(async () => {mode.props.onPress();});
  const leaves = features(tree);
  tree.root.findByType(require('@rnmapbox/maps').default.ShapeSource).instance.getClusterLeaves.mockResolvedValue({features: leaves});
  const cluster = {type: 'Feature', properties: {cluster: true, cluster_id: 9, point_count: 2},
    geometry: {type: 'Point', coordinates: [108.2, 16.06]}};
  await act(async () => {await source(tree).props.onPress({features: [cluster]});});
  expect(tree.root.findByType(require('@rnmapbox/maps').default.ShapeSource).instance.getClusterExpansionZoom).toHaveBeenCalledWith(cluster);
  expect(tree.root.findByType(require('@rnmapbox/maps').default.Camera).instance.setCamera).toHaveBeenCalledWith(
    expect.objectContaining({zoomLevel: 14, centerCoordinate: [108.2, 16.06]}));
  await act(async () => {tree.root.find(node => node.type === 'Button' && node.props.children === 'map.close').props.onPress();});
  await act(async () => {await tapPoint(tree, 'festival-10');});
  expect(NavigationService.navigate).not.toHaveBeenCalled();
  const choice = tree.root.find(node => node.type === require('react-native').TouchableOpacity &&
    node.findAll(child => child.props.children === 'Festival 11').length > 0);
  await act(async () => {choice.props.onPress();});
  expect(NavigationService.navigate).toHaveBeenCalledWith(undefined, {festival: expect.objectContaining({id: 11})});
  await act(async () => {tree.unmount();}); jest.restoreAllMocks();
});
