const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {VIEW_ALL_SCREEN: 'ViewAllLocation', DETAIL_LOCATION_SCREEN: 'DetailLocationScreen'}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn()}));
jest.mock('../src/hoc/withTranslation', () => ({withTranslation: component => component}));
jest.mock('../src/hooks/useTranslation', () => ({useTranslation: () => ({t: key => key})}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('../src/component/HeaderBase', () => 'Header');
jest.mock('../src/component/BigItemLocation', () => 'LocationCard');
jest.mock('../src/component/LargeItemLocation', () => 'LocationCard');
jest.mock('../src/component/LargeItemFestival', () => 'FestivalCard');
jest.mock('../src/component/BottomSheet', () => 'BottomSheet');
jest.mock('../src/component/LanguageDropdown', () => 'Language');
jest.mock('../src/component/RecommendationsWidget', () => 'Recommendations');
jest.mock('../src/component/SimilarItemsComponent', () => 'SimilarItems');
jest.mock('react-native-paper', () => ({Button: 'Button', Searchbar: 'Searchbar'}));
jest.mock('react-native-svg', () => ({__esModule: true, default: 'Svg', Circle: 'Circle', Line: 'Line'}));
// Home reads one precise fix through utils/preciseLocation (watchPosition, high accuracy).
jest.mock('@react-native-community/geolocation', () => ({getCurrentPosition: jest.fn(), watchPosition: jest.fn(), clearWatch: jest.fn()}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));

const Home = require('../src/container/screens/Home/HomeScreen').default;
const Festival = require('../src/container/screens/Festival/FestivalsScreen').default;
const Search = require('../src/component/SemanticSearchBarComponent').default;
const CatalogStatus = require('../src/component/CatalogStatus').default;
const storage = require('../src/utils/LocalStorageCommon').default;
const {apiRequest: request} = require('../src/services/api.client');
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
    expect(geo.watchPosition).not.toHaveBeenCalled();
    expect(tree.getInstance().state).toMatchObject({nearbyStatus: 'denied', locationsNearly: []});
    expect(tree.getInstance().state.locationsPopular).toHaveLength(3);
    expect(tree.root.findAll(node => node.props.children === 'home.locationDenied').length).toBeGreaterThan(0);
    tree.unmount();
  });

  it('shows nearest places with distance after permission is granted', async () => {
    jest.replaceProperty(require('react-native').Platform, 'OS', 'android');
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(nearbyCatalog());
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    geo.watchPosition.mockImplementationOnce((success, _error, options) => {
      expect(options.enableHighAccuracy).toBe(true); // LOW_POWER positions are city-level
      success({coords: {latitude: 16.0544, longitude: 108.2022, accuracy: 5}});
      return 1;
    });
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, props()));});
    await act(async () => {await findButton(tree, 'home.useMyLocation').props.onPress();});
    const state = tree.getInstance().state;
    expect(state.nearbyStatus).toBe('ready');
    expect(state.locationsNearly.map(row => row.id)).toEqual([3, 1]);
    expect(state.locationsNearly[0].distanceKm).toBeLessThan(0.1);
    expect(geo.getCurrentPosition).not.toHaveBeenCalled(); // crashes on Play Services with a second fix
    expect(geo.clearWatch).toHaveBeenCalledWith(1);
    geo.watchPosition.mockClear();
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
      expect(geo.watchPosition).not.toHaveBeenCalled();
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

  it('mounts Festival with an explicit error and retry', async () => {
    jest.spyOn(catalogRepository, 'get').mockRejectedValue(new Error('Catalog network error'));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Festival, props()));});
    expect(tree.getInstance().state).toMatchObject({loading: false, error: true, festivals: []});
    await act(async () => {tree.root.findByType(CatalogStatus).props.onRetry();});
    expect(tree.getInstance().state.loading).toBe(false);
    const {RefreshControl} = require('react-native');
    await act(async () => {await tree.root.findByType(RefreshControl).props.onRefresh();});
    expect(catalogRepository.get).toHaveBeenLastCalledWith(true);
    expect(tree.getInstance().state.refreshing).toBe(false);
    tree.unmount();
  });

  // P9: AI on — guests search semantically through the BE; no result or an error falls back to keywords.
  it('semantic search falls back to accent-insensitive keywords; keyword mode makes no semantic call', async () => {
    const semantic = require('../src/services/semantic.api');
    const searchSemantic = jest.spyOn(semantic, 'searchSemantic').mockResolvedValue({success: false, results: []});
    const onSubmitSearch = jest.fn();
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Search, {
      data: [{id: 1, name: 'Đà Nẵng'}, {id: 2, name: 'Hội An'}], searchFields: ['name'],
      entityType: 'location', onSearch: jest.fn(), onSubmitSearch,
    }));});
    const search = tree.getInstance();
    expect(search.state.useSemanticSearch).toBe(true);
    await act(async () => {search.setState({searchValue: 'da nang'});});
    await act(async () => {await search.handleSubmitSearch();});
    expect(searchSemantic).toHaveBeenCalledWith(expect.objectContaining({query: 'da nang', entity_types: ['location']}));
    expect(onSubmitSearch).toHaveBeenLastCalledWith([{id: 1, name: 'Đà Nẵng'}], 'da nang', true);
    // Semantic hits are matched to the local catalog by Neon id.
    searchSemantic.mockResolvedValueOnce({success: true, results: [{id: 2, entity_type: 'location', score: 0.8}]});
    await act(async () => {search.setState({searchValue: 'pho co'});});
    await act(async () => {await search.handleSubmitSearch();});
    expect(onSubmitSearch).toHaveBeenLastCalledWith([{id: 2, name: 'Hội An'}], 'pho co', true);
    await act(async () => {search.toggleSearchMode();});
    expect(search.state.useSemanticSearch).toBe(false);
    searchSemantic.mockClear();
    await act(async () => {search.handleSearchChange('da nang');});
    await act(async () => {await search.handleSubmitSearch();});
    expect(onSubmitSearch).toHaveBeenLastCalledWith([{id: 1, name: 'Đà Nẵng'}], 'da nang', false);
    expect(searchSemantic).not.toHaveBeenCalled();
    tree.unmount();
  });

  it('a hotel Detail never loads reviews or festivals by its (colliding) id', async () => {
    const DetailLocation = require('../src/container/screens/Home/DetailLocation').default;
    const snapshot = buildCatalogSnapshot([{id: 7, name: 'Venue'}], [{id: 2, location_id: 7}]);
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
    const reviews = jest.spyOn(locationApi, 'getReviews');
    const detail = new DetailLocation({...props(), route: {params: {location: {id: 7, kind: 'hotel'}}}});
    detail.setState = state => {detail.state = {...detail.state, ...state};};
    await detail.loadCatalog();
    await detail.loadReviews();
    expect(detail.state.festivals).toEqual([]);
    expect(detail.state.reviews).toEqual([]);
    expect(reviews).not.toHaveBeenCalled();
  });

  // P11.4: hotels share the Home search; their ids collide with location ids, so they never match semantic
  // results by id and are appended by keyword instead.
  it('hotels join search results by keyword, never by a colliding semantic id', async () => {
    const semantic = require('../src/services/semantic.api');
    jest.spyOn(semantic, 'searchSemantic').mockResolvedValue({success: true, results: [{id: 1, entity_type: 'location', score: 0.9}]});
    const onSubmitSearch = jest.fn();
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Search, {
      data: [{id: 1, name: 'Bãi biển Mỹ Khê', types: ['beach']}, {id: 1, kind: 'hotel', name: 'Khách sạn biển', types: ['hotel']},
        {id: 2, kind: 'hotel', name: 'Resort núi', types: ['resort']}],
      searchFields: ['name', 'types'], entityType: 'location', onSearch: jest.fn(), onSubmitSearch,
    }));});
    const search = tree.getInstance();
    await act(async () => {search.setState({searchValue: 'bien'});});
    await act(async () => {await search.handleSubmitSearch();});
    expect(onSubmitSearch.mock.calls[0][0].map(row => [row.id, row.kind ?? 'location'])).toEqual([[1, 'location'], [1, 'hotel']]);
    tree.unmount();
  });

  it.each([
    ['Location', () => require('../src/container/screens/Home/ViewAllLocation').default, 'locations'],
    ['Festival', () => require('../src/container/screens/Festival/ViewAllFestivals').default, 'festivals'],
  ])('%s results: semantic order from the search bar, keyword mode filters locally', async (_, load, field) => {
    const Screen = load();
    const rows = [{id: 1, name: 'Hội An'}, {id: 2, name: 'Đà Nẵng'}];
    let tree;
    await act(async () => {
      tree = renderer.create(React.createElement(Screen, {
        ...props(), route: {params: {isSemanticSearch: true, [field]: rows, valueSearch: 'da nang'}},
      }));
    });
    // P9: AI on — semantic results arrive already ranked and are shown as they are.
    expect(tree.getInstance().state.searchMode).toBe('semantic');
    expect(tree.getInstance().state[field].map(row => row.id)).toEqual([1, 2]);
    await act(async () => {tree.getInstance().toggleSearchMode();});
    expect(tree.getInstance().state.searchMode).toBe('keyword');
    expect(tree.getInstance().state[field].map(row => row.id)).toEqual([2]);
    tree.unmount();
  });
});
