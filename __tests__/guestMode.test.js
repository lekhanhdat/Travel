const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {VIEW_ALL_SCREEN: 'ViewAllLocation', DETAIL_LOCATION_SCREEN: 'DetailLocationScreen'}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn()}));
jest.mock('../src/hoc/withAzureTranslation', () => ({withAzureTranslation: component => component}));
jest.mock('../src/hooks/useTranslation', () => ({useTranslation: () => ({t: key => key})}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/BigItemLocation', () => 'LocationCard');
jest.mock('../src/component/LargeItemLocation', () => 'LocationCard');
jest.mock('../src/component/LargeItemFestival', () => 'FestivalCard');
jest.mock('../src/component/HistoricalArtifact', () => 'Item');
jest.mock('../src/component/BottomSheet', () => 'BottomSheet');
jest.mock('../src/component/LanguageDropdown', () => 'Language');
jest.mock('../src/component/RecommendationsWidget', () => 'Recommendations');
jest.mock('../src/component/SimilarItemsComponent', () => 'SimilarItems');
jest.mock('react-native-paper', () => ({Button: 'Button', Searchbar: 'Searchbar'}));
jest.mock('react-native-svg', () => ({__esModule: true, default: 'Svg', Circle: 'Circle', Line: 'Line'}));
jest.mock('@react-native-community/geolocation', () => ({getCurrentPosition: jest.fn()}));

const Home = require('../src/container/screens/Home/HomeScreen').default;
const Festival = require('../src/container/screens/Festival/FestivalsScreen').default;
const Search = require('../src/component/SemanticSearchBarComponent').default;
const CatalogStatus = require('../src/component/CatalogStatus').default;
const storage = require('../src/utils/LocalStorageCommon').default;
const {request} = require('../src/services/axios');
const locationApi = require('../src/services/locations.api').default;
const catalogRepository = require('../src/services/catalogRepository').default;
const {buildCatalogSnapshot} = require('../src/services/catalogRepository');
const geo = require('@react-native-community/geolocation');
const {PermissionsAndroid} = require('react-native');

const props = () => ({navigation: {addListener: jest.fn(() => jest.fn())}, t: key => key, language: 'vi'});

describe('Phase 1 Guest Mode', () => {
  afterEach(() => jest.restoreAllMocks());

  it('loads detail catalogs and exact FK in recovery, and surfaces failure with a forced retry', async () => {
    const DetailLocation = require('../src/container/screens/Home/DetailLocation').default;
    const DetailFestival = require('../src/container/screens/Festival/DetailFestival').default;
    const snapshot = buildCatalogSnapshot([{id: 7, name: 'Venue'}, {id: 8, name: 'Other'}],
      [{id: 2, location_id: 7}, {id: 3, location_id: 8}, {id: 4, location_id: null}]);
    const get = jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
    const detail = new DetailLocation({...props(), route: {params: {location: {id: 7}}}});
    detail.setState = state => {detail.state = {...detail.state, ...state};};
    await detail.loadCatalog();
    expect(detail.state).toMatchObject({catalogError: false, allLocations: snapshot.locations});
    expect(detail.state.festivals.map(row => [row.id, row.location])).toEqual([[2, 'Venue']]);
    get.mockRejectedValueOnce(new Error('offline'));
    await detail.loadCatalog();
    expect(detail.state.catalogError).toBe(true);
    await detail.loadCatalog(true);
    expect(get).toHaveBeenLastCalledWith(true);
    expect(detail.state.catalogError).toBe(false);
    const festival = new DetailFestival(props());
    festival.setState = state => {festival.state = {...festival.state, ...state};};
    await festival.loadCatalog();
    expect(festival.state.allFestivals).toBe(snapshot.festivals);
    get.mockRejectedValueOnce(new Error('offline'));
    await festival.loadCatalog();
    expect(festival.state.catalogError).toBe(true);
    await festival.loadCatalog(true);
    expect(get).toHaveBeenLastCalledWith(true);
    expect(festival.state.catalogError).toBe(false);
    // Festival -> its location via the repository index; none without location_id.
    const linked = new DetailFestival({...props(), route: {params: {festival: snapshot.festivalById.get(2)}}});
    linked.setState = state => {linked.state = {...linked.state, ...state};};
    await linked.loadCatalog();
    expect(linked.state.venue).toBe(snapshot.locationById.get(7));
    const unlinked = new DetailFestival({...props(), route: {params: {festival: snapshot.festivalById.get(4)}}});
    unlinked.setState = state => {unlinked.state = {...unlinked.state, ...state};};
    await unlinked.loadCatalog();
    expect(unlinked.state.venue).toBeNull();
  });

  const nearbyCatalog = () => buildCatalogSnapshot([
    {id: 1, name: 'Far', lat: 15.88, long: 108.33},
    {id: 2, name: 'No GPS', lat: null, long: null},
    {id: 3, name: 'Near', lat: 16.0545, long: 108.2023},
  ], []);
  const findButton = (tree, label) => tree.root.find(node => node.type === 'Button' && node.props.children === label);

  it('asks for location only on demand; a denial keeps Home lists and explains', async () => {
    jest.replaceProperty(require('react-native').Platform, 'OS', 'android');
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(nearbyCatalog());
    const permission = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, props()));});
    expect(permission).not.toHaveBeenCalled();
    expect(tree.getInstance().state.locationsPopular).toHaveLength(3);
    await act(async () => {await findButton(tree, 'home.useMyLocation').props.onPress();});
    expect(permission).toHaveBeenCalledTimes(1);
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
    expect(tree.getInstance().state).toMatchObject({nearbyStatus: 'denied', locationsNearly: []});
    expect(tree.getInstance().state.locationsPopular).toHaveLength(3);
    expect(tree.root.findAll(node => node.props.children === 'home.locationDenied').length).toBeGreaterThan(0);
    tree.unmount();
  });

  it('shows nearest places with distance after permission is granted', async () => {
    jest.replaceProperty(require('react-native').Platform, 'OS', 'android');
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(nearbyCatalog());
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    geo.getCurrentPosition.mockImplementationOnce(success => success({coords: {latitude: 16.0544, longitude: 108.2022}}));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, props()));});
    await act(async () => {await findButton(tree, 'home.useMyLocation').props.onPress();});
    const state = tree.getInstance().state;
    expect(state.nearbyStatus).toBe('ready');
    expect(state.locationsNearly.map(row => row.id)).toEqual([3, 1]);
    expect(state.locationsNearly[0].distanceKm).toBeLessThan(0.1);
    geo.getCurrentPosition.mockClear();
    tree.unmount();
  });

  it('pull-to-refresh forces a repository refresh and keeps the list when it fails', async () => {
    const snapshot = nearbyCatalog();
    const get = jest.spyOn(catalogRepository, 'get').mockResolvedValueOnce(snapshot)
      .mockRejectedValueOnce(new Error('offline'));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, props()));});
    const {RefreshControl} = require('react-native');
    await act(async () => {await tree.root.findByType(RefreshControl).props.onRefresh();});
    expect(get.mock.calls).toEqual([[false], [true]]);
    expect(tree.getInstance().state).toMatchObject({refreshing: false, loading: false, error: true});
    expect(tree.getInstance().state.locations).toBe(snapshot.locations);
    expect(tree.root.findByType(CatalogStatus).props.error).toBe(true);
    tree.unmount();
  });

  it('mounts Home as guest without GPS or outgoing requests; only the local profile is read; retry settles', async () => {
    const get = jest.spyOn(catalogRepository, 'get').mockRejectedValue(new Error('Catalog network error'));
    const permission = jest.spyOn(PermissionsAndroid, 'request');
    const account = jest.spyOn(storage, 'getItem');
    const adapter = jest.fn(() => {throw new Error('Unexpected network');});
    const oldAdapter = request.defaults.adapter;
    request.defaults.adapter = adapter;
    let tree;
    try {
      await act(async () => {tree = renderer.create(React.createElement(Home, props()));});
      expect(tree.getInstance().state).toMatchObject({account: null, loading: false, error: true, locations: []});
      expect(permission).not.toHaveBeenCalled();
      expect(geo.getCurrentPosition).not.toHaveBeenCalled();
      // P6: Home reads the locally stored profile (AVT) for signed-in features; no account request.
      expect(account.mock.calls).toEqual([['AVT']]);
      await act(async () => {tree.root.findByType(CatalogStatus).props.onRetry();});
      expect(tree.getInstance().state).toMatchObject({loading: false, error: true});
      // Mount reads the shared cache; only Retry forces a refresh.
      expect(get.mock.calls).toEqual([[false], [true]]);
      expect(adapter).not.toHaveBeenCalled();
      expect(tree.root.findAllByType('Recommendations')).toHaveLength(0);
    } finally {request.defaults.adapter = oldAdapter; tree?.unmount();}
  });

  it('mounts Festival with an explicit error and retry, without fetching Items', async () => {
    const items = jest.spyOn(locationApi, 'getItems');
    jest.spyOn(catalogRepository, 'get').mockRejectedValue(new Error('Catalog network error'));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Festival, props()));});
    expect(tree.getInstance().state).toMatchObject({loading: false, error: true, festivals: []});
    expect(items).not.toHaveBeenCalled();
    await act(async () => {tree.root.findByType(CatalogStatus).props.onRetry();});
    expect(tree.getInstance().state.loading).toBe(false);
    const {RefreshControl} = require('react-native');
    await act(async () => {await tree.root.findByType(RefreshControl).props.onRefresh();});
    expect(catalogRepository.get).toHaveBeenLastCalledWith(true);
    expect(tree.getInstance().state.refreshing).toBe(false);
    tree.unmount();
  });

  it('filters accented keywords locally and submits fresh data without semantic HTTP', async () => {
    const onSubmitSearch = jest.fn();
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Search, {
      data: [{id: 1, name: 'Đà Nẵng'}, {id: 2, name: 'Hội An'}], searchFields: ['name'],
      entityType: 'location', onSearch: jest.fn(), onSubmitSearch,
    }));});
    const search = tree.getInstance();
    await act(async () => {search.handleSearchChange('da nang');});
    await act(async () => {await search.handleSubmitSearch();});
    expect(onSubmitSearch).toHaveBeenCalledWith([{id: 1, name: 'Đà Nẵng'}], 'da nang', false);
    await act(async () => {search.toggleSearchMode();});
    expect(search.state.useSemanticSearch).toBe(false);
    tree.unmount();
  });

  it('rejects legacy reads/writes before Axios adapter while catalog uses a separate client', async () => {
    const adapter = jest.fn();
    await expect(request.get('/api/v2/accounts', {adapter})).rejects.toThrow('disabled');
    await expect(request.post('/api/v2/storage/upload', {}, {adapter})).rejects.toThrow('disabled');
    expect(adapter).not.toHaveBeenCalled();
    expect(require('../src/services/catalog.client').catalogRequest).not.toBe(request);
  });

  it('never calls Azure fetch when disabled, even with local credentials present', async () => {
    const azure = require('../src/services/translation/AzureTranslatorService').default;
    const fetch = jest.spyOn(global, 'fetch');
    await expect(azure.translateBatch(['Travel'], 'vi')).resolves.toEqual(['Travel']);
    await expect(azure.detectLanguage('Travel')).resolves.toBe('en');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['Location', () => require('../src/container/screens/Home/ViewAllLocation').default, 'locations'],
    ['Festival', () => require('../src/container/screens/Festival/ViewAllFestivals').default, 'festivals'],
  ])('keeps %s results in keyword mode despite legacy semantic route params', async (_, load, field) => {
    const Screen = load();
    let tree;
    await act(async () => {
      tree = renderer.create(React.createElement(Screen, {
        ...props(), route: {params: {isSemanticSearch: true, [field]: [], valueSearch: 'danang'}},
      }));
    });
    expect(tree.getInstance().state.searchMode).toBe('keyword');
    expect(tree.root.findAll(node =>
      typeof node.props.children === 'string' && node.props.children.includes('AI Search'),
    )).toHaveLength(0);
    await act(async () => {tree.getInstance().toggleSearchMode();});
    expect(tree.getInstance().state.searchMode).toBe('keyword');
    tree.unmount();
  });
});
