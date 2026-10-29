const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('../src/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/assets/assets/ImageSvg', () => new Proxy({}, {get: (_, name) => name === '__esModule' ? false : 'Icon'}));
jest.mock('../src/container/AppContainer', () => ({ScreenName: {VIEW_ALL_SCREEN: 'ViewAllLocation'}}));
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
const festivalsApi = require('../src/services/festivals.api').default;
const geo = require('@react-native-community/geolocation');
const {PermissionsAndroid} = require('react-native');

const props = () => ({navigation: {addListener: jest.fn(() => jest.fn())}, t: key => key, language: 'vi'});

describe('Phase 1 Guest Mode', () => {
  afterEach(() => jest.restoreAllMocks());

  it('loads detail catalogs and exact FK in recovery, and surfaces failure with a forced retry', async () => {
    const DetailLocation = require('../src/container/screens/Home/DetailLocation').default;
    const DetailFestival = require('../src/container/screens/Festival/DetailFestival').default;
    const getLocations = jest.spyOn(locationApi, 'getLocations').mockResolvedValue([{id: 7, Id: 7}]);
    const getFestivals = jest.spyOn(festivalsApi, 'getFestivals').mockResolvedValue([{id: 2, Id: 2}]);
    const related = jest.spyOn(festivalsApi, 'getFestivalsByLocationId').mockResolvedValue([]);
    const clear = jest.spyOn(festivalsApi, 'clearCache');
    const detail = new DetailLocation({...props(), route: {params: {location: {id: 7, Id: 999}}}});
    detail.setState = state => {detail.state = {...detail.state, ...state};};
    await detail.loadCatalog();
    expect(related).toHaveBeenCalledWith(7);
    expect(detail.state).toMatchObject({catalogError: false, festivals: [], allLocations: [{id: 7, Id: 7}]});
    getLocations.mockRejectedValueOnce(new Error('offline'));
    await detail.loadCatalog();
    expect(detail.state.catalogError).toBe(true);
    await detail.loadCatalog(true);
    expect(getLocations).toHaveBeenLastCalledWith(true);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(detail.state.catalogError).toBe(false);
    const festival = new DetailFestival(props());
    festival.setState = state => {festival.state = {...festival.state, ...state};};
    await festival.loadCatalog();
    expect(festival.state.allFestivals).toEqual([{id: 2, Id: 2}]);
    getFestivals.mockRejectedValueOnce(new Error('offline'));
    await festival.loadCatalog();
    expect(festival.state.catalogError).toBe(true);
    await festival.loadCatalog(true);
    expect(getFestivals).toHaveBeenLastCalledWith(true);
    expect(festival.state.catalogError).toBe(false);
  });

  it('mounts Home as guest without GPS, account reads or outgoing requests; retry settles', async () => {
    jest.spyOn(locationApi, 'getLocations').mockRejectedValue(new Error('Catalog network error'));
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
      expect(account).not.toHaveBeenCalled();
      await act(async () => {tree.root.findByType(CatalogStatus).props.onRetry();});
      expect(tree.getInstance().state).toMatchObject({loading: false, error: true});
      expect(adapter).not.toHaveBeenCalled();
      expect(tree.root.findAllByType('Recommendations')).toHaveLength(0);
    } finally {request.defaults.adapter = oldAdapter; tree?.unmount();}
  });

  it('mounts Festival with an explicit error and retry, without fetching Items', async () => {
    const items = jest.spyOn(locationApi, 'getItems');
    jest.spyOn(festivalsApi, 'getFestivals').mockRejectedValue(new Error('Catalog network error'));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Festival, props()));});
    expect(tree.getInstance().state).toMatchObject({loading: false, error: true, festivals: []});
    expect(items).not.toHaveBeenCalled();
    await act(async () => {tree.root.findByType(CatalogStatus).props.onRetry();});
    expect(tree.getInstance().state.loading).toBe(false);
    tree.unmount();
  });

  it('filters accented keywords locally and submits fresh data without semantic HTTP', async () => {
    const onSubmitSearch = jest.fn();
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Search, {
      data: [{Id: 1, name: 'Đà Nẵng'}, {Id: 2, name: 'Hội An'}], searchFields: ['name'],
      entityType: 'location', onSearch: jest.fn(), onSubmitSearch,
    }));});
    const search = tree.getInstance();
    await act(async () => {search.handleSearchChange('da nang');});
    await act(async () => {await search.handleSubmitSearch();});
    expect(onSubmitSearch).toHaveBeenCalledWith([{Id: 1, name: 'Đà Nẵng'}], 'da nang', false);
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
