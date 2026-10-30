const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('@rnmapbox/maps', () => {
  const React = require('react');
  // Class components so the screen's refs (mapRef/cameraRef) attach.
  const host = name => class extends React.Component {
    render() {return React.createElement(name, this.props, this.props.children);}
  };
  return {__esModule: true, default: {
    setAccessToken: jest.fn(),
    StyleURL: {Outdoors: 'outdoors', Satellite: 'satellite', Dark: 'dark'},
    MapView: host('MapView'), Camera: host('Camera'), MarkerView: host('MarkerView'),
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
  getDirections: jest.fn(), convertGeoJSONToCoordinates: coords => coords.map(([longitude, latitude]) => ({latitude, longitude})),
}));
jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn(), pop: jest.fn()}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/CachedImage', () => 'CachedImage');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));

const {PermissionsAndroid, Platform} = require('react-native');
const Geolocation = require('@react-native-community/geolocation');
const Toast = require('react-native-toast-message');
const mapboxApi = require('../src/services/mapbox.api');
const catalogRepository = require('../src/services/catalogRepository').default;
const {buildCatalogSnapshot} = require('../src/services/catalogRepository');
const MapScreenV2 = require('../src/container/screens/Maps/MapScreenV2').default;
// Module-level configuration, captured before afterEach clears mock calls.
const geoConfigCalls = [...Geolocation.setRNConfiguration.mock.calls];

const place = (id, extra) => ({id, name: `Place ${id}`, description: '', address: '', avatar: '', images: [],
  reviews: [], lat: 16.05 + id / 100, long: 108.2, publishable: true, ...extra});
const snapshot = buildCatalogSnapshot([
  place(1, {lat: 16.06}), place(2, {publishable: false}), place(3, {lat: null, long: null}), place(4, {lat: 16.09}),
], []);
const props = () => ({navigation: {addListener: jest.fn(() => jest.fn())}, route: {params: {}}});
const markerIds = tree => tree.root.findAll(node => node.type === 'MarkerView').map(node => node.props.id);
const directionsButton = tree => tree.root.find(node => node.type === 'Button' && node.props.icon === 'directions');

describe('Map (P4)', () => {
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
  });
  afterEach(() => {jest.restoreAllMocks(); jest.clearAllMocks();});

  it('shows only publishable markers with GPS; a denied permission blocks directions and "you are here"', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreenV2, props()));});
    expect(markerIds(tree)).toEqual(['marker-0', 'marker-1']);
    const markers = tree.root.findAll(node => node.type === 'MarkerView');
    expect(markers.map(node => node.props.coordinate)).toEqual([[108.2, 16.06], [108.2, 16.09]]);
    expect(markerIds(tree)).not.toContain('myLocation');
    // Select a marker and ask for directions without a real GPS fix.
    await act(async () => {markers[0].findByType(require('react-native').TouchableOpacity).props.onPress();});
    await act(async () => {directionsButton(tree).props.onPress();});
    expect(Toast.show).toHaveBeenCalledWith(expect.objectContaining({type: 'info'}));
    expect(mapboxApi.getDirections).not.toHaveBeenCalled();
    tree.unmount();
  });

  it('routes from the real position once GPS is available; only foreground location APIs are used', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    Geolocation.getCurrentPosition.mockImplementation(success => success({coords: {latitude: 16.0, longitude: 108.1}}));
    mapboxApi.getDirections.mockResolvedValue({routes: [{distance: 1200, duration: 300, legs: [{steps: []}],
      geometry: {coordinates: [[108.1, 16.0], [108.2, 16.06]]}}]});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreenV2, props()));});
    expect(markerIds(tree)).toContain('myLocation');
    const markers = tree.root.findAll(node => node.type === 'MarkerView' && node.props.id === 'marker-0');
    await act(async () => {markers[0].findByType(require('react-native').TouchableOpacity).props.onPress();});
    await act(async () => {await directionsButton(tree).props.onPress();});
    expect(mapboxApi.getDirections).toHaveBeenCalledTimes(1);
    expect(mapboxApi.getDirections).toHaveBeenCalledWith(expect.objectContaining({coordinates: '108.1,16;108.2,16.06'}));
    expect(Toast.show).not.toHaveBeenCalled();
    expect(Geolocation.watchPosition).toHaveBeenCalled();
    tree.unmount();
    expect(Geolocation.clearWatch).toHaveBeenCalled();
  });

  const cameraCenter = tree => tree.root.find(node => node.type === 'Camera').props.centerCoordinate;

  it('opens on the catalog area for a far (stale) fix, moves to the user once on the first nearby fix, then stays', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    // Emulator default position (California): "you are here" is shown there, the map opens on the markers.
    Geolocation.getCurrentPosition.mockImplementation(success => success({coords: {latitude: 37.42, longitude: -122.08}}));
    let onWatch;
    Geolocation.watchPosition.mockImplementation(success => {onWatch = success; return 1;});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreenV2, props()));});
    expect(markerIds(tree)).toContain('myLocation');
    expect(cameraCenter(tree)).toEqual([108.2, 16.075]);
    await act(async () => {onWatch({coords: {latitude: 16.07, longitude: 108.21}});});
    expect(cameraCenter(tree)).toEqual([108.21, 16.07]);
    await act(async () => {onWatch({coords: {latitude: 16.08, longitude: 108.22}});});
    expect(cameraCenter(tree)).toEqual([108.21, 16.07]);
    tree.unmount();
  });

  it('uses the fused provider and retries a failed high-accuracy fix with normal accuracy', async () => {
    expect(geoConfigCalls[0]).toEqual([expect.objectContaining({locationProvider: 'playServices'})]);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    Geolocation.getCurrentPosition
      .mockImplementationOnce((success, failure) => failure({code: 3, message: 'timeout'}))
      .mockImplementationOnce(success => success({coords: {latitude: 16.0, longitude: 108.1}}));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreenV2, props()));});
    expect(Geolocation.getCurrentPosition.mock.calls.map(call => call[2].enableHighAccuracy)).toEqual([true, false]);
    expect(markerIds(tree)).toContain('myLocation');
    tree.unmount();
  });

  it('opens on the user when near the catalog, and on the focused place (even if not publishable) from Detail', async () => {
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    Geolocation.getCurrentPosition.mockImplementation(success => success({coords: {latitude: 16.0, longitude: 108.1}}));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(MapScreenV2, props()));});
    expect(cameraCenter(tree)).toEqual([108.1, 16.0]);
    tree.unmount();
    const hidden = snapshot.locationById.get(2);
    await act(async () => {tree = renderer.create(React.createElement(MapScreenV2,
      {...props(), route: {params: {locations: [hidden], showRoute: false}}}));});
    expect(markerIds(tree)).toEqual(['marker-0', 'myLocation']);
    expect(cameraCenter(tree)).toEqual([108.2, hidden.lat]);
    tree.unmount();
  });
});
