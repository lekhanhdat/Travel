const React = require('react');
const renderer = require('react-test-renderer');
const {act} = renderer;

jest.mock('../src/container/AppContainer', () => ({ScreenName: {
  VIEW_ALL_SCREEN: 'ViewAllLocation', DETAIL_LOCATION_SCREEN: 'DetailLocationScreen',
  DETAIL_FESTIVAL_SCREEN: 'DetailFestivalScreen', MAP_SCREEN: 'MapsScreen',
}}));
jest.mock('../src/container/screens/NavigationService', () => ({navigate: jest.fn(), pop: jest.fn()}));
jest.mock('../src/hooks/useTranslation', () => ({useTranslation: () => ({t: key => key, language: 'vi'})}));
jest.mock('../src/component/Page', () => 'Page');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));
jest.mock('../src/component/LanguageDropdown', () => 'Language');
jest.mock('../src/component/SimilarItemsComponent', () => 'SimilarItems');
jest.mock('../src/component/ReviewItem', () => 'ReviewItem');
jest.mock('../src/component/CachedImage', () => 'Image');
jest.mock('react-native-paper', () => ({Button: 'Button', Searchbar: 'Searchbar'}));
jest.mock('react-native-svg', () => ({__esModule: true, default: 'Svg', Circle: 'Circle', Line: 'Line'}));
// Home reads one precise fix through utils/preciseLocation (watchPosition, high accuracy).
jest.mock('@react-native-community/geolocation', () => ({getCurrentPosition: jest.fn(), watchPosition: jest.fn(), clearWatch: jest.fn()}));
jest.mock('react-native-toast-message', () => ({show: jest.fn()}));
// Detail screens load reviews on focus; outside a navigator run the effect once.
jest.mock('@react-navigation/native', () => {
  const ReactActual = jest.requireActual('react');
  return {
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: effect => ReactActual.useEffect(effect, [effect]),
    useIsFocused: () => true,
  };
});

const Home = require('../src/container/screens/Home/HomeScreen').default;
const ViewAll = require('../src/container/screens/Discover/ViewAllScreen').default;
const Search = require('../src/component/SemanticSearchBarComponent').default;
const CatalogStatus = require('../src/component/CatalogStatus').default;
const {DiscoverCard} = require('../src/features/discover/DiscoverCard');
const {Chip} = require('../src/ui/Chip');
const storage = require('../src/utils/LocalStorageCommon').default;
const {apiRequest: request} = require('../src/services/api.client');
const reviewsApi = require('../src/services/reviews.api').default;
const catalogRepository = require('../src/services/catalogRepository').default;
const {buildCatalogSnapshot} = require('../src/services/catalogRepository');
const geo = require('@react-native-community/geolocation');
const {PermissionsAndroid, RefreshControl} = require('react-native');

const navigation = () => ({addListener: jest.fn(() => jest.fn())});
const Card = DiscoverCard.type ?? DiscoverCard; // React.memo
const cards = tree => tree.root.findAllByType(Card).map(card => card.props.item);
const {FlatList} = require('react-native');
// Rails are virtualized (only the first cards mount), so check the data they were given.
const railItems = tree => tree.root.findAllByType(FlatList).flatMap(list => list.props.data ?? []);
const findButton = (tree, label) => tree.root.find(node => node.type === 'Button' && node.props.children === label);
const hasText = (tree, text) => tree.root.findAll(node => node.props.children === text).length > 0;

const catalog = () => buildCatalogSnapshot([
  {id: 1, name: 'Far', lat: 15.88, long: 108.33},
  {id: 2, name: 'No GPS', lat: null, long: null},
  {id: 3, name: 'Near', lat: 16.0545, long: 108.2023},
], [
  {id: 10, name: 'Lễ hội gần', location_id: 3},
  {id: 11, name: 'Lễ hội không địa điểm', location_id: null},
]);

describe('Guest mode — merged Home (D-2)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('mixes places and festivals; the chips narrow every section to one kind', async () => {
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(catalog());
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, {navigation: navigation()}));});
    const kinds = () => railItems(tree).map(item => item.kind);
    // Popular interleaves 2 places : 1 festival.
    expect(railItems(tree).map(item => item.key)).toEqual(['location:1', 'location:2', 'festival:10', 'location:3', 'festival:11']);
    const chip = label => tree.root.findAllByType(Chip.type ?? Chip).find(c => c.props.label === label);
    await act(async () => {chip('discover.festivals').props.onPress();});
    expect(new Set(kinds())).toEqual(new Set(['festival']));
    await act(async () => {chip('discover.places').props.onPress();});
    expect(new Set(kinds())).toEqual(new Set(['location']));
    tree.unmount();
  });

  it('asks for location only on demand; a denial keeps Home lists and explains', async () => {
    jest.replaceProperty(require('react-native').Platform, 'OS', 'android');
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(catalog());
    const permission = jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, {navigation: navigation()}));});
    expect(permission).not.toHaveBeenCalled();
    await act(async () => {await findButton(tree, 'home.useMyLocation').props.onPress();});
    expect(permission).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition).not.toHaveBeenCalled();
    expect(hasText(tree, 'home.locationDenied')).toBe(true);
    expect(railItems(tree)).toHaveLength(5); // popular rail still shown
    tree.unmount();
  });

  it('"Gần bạn" lists places and festivals (at their venue) nearest first after permission', async () => {
    jest.replaceProperty(require('react-native').Platform, 'OS', 'android');
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(catalog());
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    geo.watchPosition.mockImplementationOnce((success, _error, options) => {
      expect(options.enableHighAccuracy).toBe(true); // LOW_POWER positions are city-level
      success({coords: {latitude: 16.0544, longitude: 108.2022, accuracy: 5}});
      return 1;
    });
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, {navigation: navigation()}));});
    await act(async () => {await findButton(tree, 'home.useMyLocation').props.onPress();});
    const rows = tree.root.findAllByType(Card).filter(c => c.props.variant === 'row').map(c => c.props.item);
    expect(rows.map(item => item.key)).toEqual(['location:3', 'festival:10', 'location:1']);
    expect(rows[0].distanceKm).toBeLessThan(0.1);
    expect(geo.getCurrentPosition).not.toHaveBeenCalled(); // crashes on Play Services with a second fix
    expect(geo.clearWatch).toHaveBeenCalledWith(1);
    geo.watchPosition.mockClear();
    tree.unmount();
  });

  it('pull-to-refresh forces a repository refresh and keeps the list when it fails', async () => {
    const get = jest.spyOn(catalogRepository, 'get').mockResolvedValueOnce(catalog())
      .mockRejectedValueOnce(new Error('offline'));
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(Home, {navigation: navigation()}));});
    await act(async () => {await tree.root.findByType(RefreshControl).props.onRefresh();});
    expect(get.mock.calls).toEqual([[false], [true]]);
    expect(tree.root.findByType(CatalogStatus).props.error).toBe(true);
    expect(railItems(tree)).toHaveLength(5);
    tree.unmount();
  });

  it('mounts Home as guest without GPS or outgoing requests; only the local profile is read; retry forces', async () => {
    const get = jest.spyOn(catalogRepository, 'get').mockRejectedValue(new Error('Catalog network error'));
    const permission = jest.spyOn(PermissionsAndroid, 'request');
    const account = jest.spyOn(storage, 'getItem');
    const adapter = jest.fn(() => {throw new Error('Unexpected network');});
    const oldAdapter = request.defaults.adapter;
    request.defaults.adapter = adapter;
    let tree;
    try {
      await act(async () => {tree = renderer.create(React.createElement(Home, {navigation: navigation()}));});
      expect(tree.root.findByType(CatalogStatus).props).toMatchObject({loading: false, error: true});
      expect(permission).not.toHaveBeenCalled();
      expect(geo.watchPosition).not.toHaveBeenCalled();
      // P6: Home reads the locally stored profile (AVT) for signed-in features; no account request.
      expect(account.mock.calls.every(call => call[0] === 'AVT')).toBe(true);
      await act(async () => {tree.root.findByType(CatalogStatus).props.onRetry();});
      // Mount reads the shared cache; only Retry forces a refresh.
      expect(get.mock.calls).toEqual([[false], [true]]);
      expect(adapter).not.toHaveBeenCalled();
    } finally {request.defaults.adapter = oldAdapter; tree?.unmount();}
  });
});

describe('Guest mode — unified "View all"', () => {
  it('accepts legacy locations/festivals params and filters by kind only when both are present', async () => {
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(ViewAll, {route: {params: {
      title: 'x', locations: [{id: 1, name: 'A'}, {id: 1, kind: 'hotel', name: 'H'}], festivals: [{id: 1, name: 'F'}],
    }}}));});
    // Colliding ids stay distinct (R-FIX5).
    expect(cards(tree).map(item => item.key)).toEqual(['location:1', 'hotel:1', 'festival:1']);
    const chip = tree.root.findAllByType(Chip.type ?? Chip).find(c => c.props.label === 'discover.festivals');
    await act(async () => {chip.props.onPress();});
    expect(cards(tree).map(item => item.key)).toEqual(['festival:1']);
    tree.unmount();
    await act(async () => {tree = renderer.create(React.createElement(ViewAll, {route: {params: {festivals: [{id: 2, name: 'F'}]}}}));});
    expect(tree.root.findAllByType(Chip.type ?? Chip)).toHaveLength(0);
    tree.unmount();
  });
});

describe('Guest mode — Detail', () => {
  afterEach(() => jest.restoreAllMocks());

  it('a hotel Detail never loads reviews or festivals by its (colliding) id', async () => {
    const DetailLocation = require('../src/container/screens/Home/DetailLocation').default;
    const snapshot = buildCatalogSnapshot([{id: 7, name: 'Venue'}], [{id: 2, location_id: 7}]);
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
    const reviews = jest.spyOn(reviewsApi, 'listPage');
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(DetailLocation, {
      route: {params: {location: {id: 7, kind: 'hotel', name: 'Hotel'}}},
    }));});
    expect(reviews).not.toHaveBeenCalled();
    expect(cards(tree)).toHaveLength(0); // no "festivals here"
    tree.unmount();
  });

  it('a location Detail shows its festivals and the catalog rating, with a forced retry on failure', async () => {
    const DetailLocation = require('../src/container/screens/Home/DetailLocation').default;
    const snapshot = buildCatalogSnapshot([{id: 7, name: 'Venue', rating: 4.5, review_count: 250}],
      [{id: 2, location_id: 7, name: 'Fest'}, {id: 3, location_id: null, name: 'Other'}]);
    const get = jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
    jest.spyOn(reviewsApi, 'listPage').mockResolvedValue({items: [], hasMore: true});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(DetailLocation, {
      route: {params: {location: snapshot.locationById.get(7)}},
    }));});
    expect(cards(tree).map(item => item.key)).toEqual(['festival:2']);
    expect(hasText(tree, '4.5')).toBe(true);
    get.mockRejectedValueOnce(new Error('offline'));
    tree.unmount();
    await act(async () => {tree = renderer.create(React.createElement(DetailLocation, {
      route: {params: {location: snapshot.locationById.get(7)}},
    }));});
    expect(tree.root.findByType(CatalogStatus).props.error).toBe(true);
    await act(async () => {await tree.root.findByType(CatalogStatus).props.onRetry();});
    expect(get).toHaveBeenLastCalledWith(true);
    tree.unmount();
  });

  it('a festival Detail links its venue from location_id; none without it', async () => {
    const DetailFestival = require('../src/container/screens/Festival/DetailFestival').default;
    const snapshot = buildCatalogSnapshot([{id: 7, name: 'Venue'}],
      [{id: 2, location_id: 7, name: 'Fest'}, {id: 4, location_id: null, name: 'Free'}]);
    jest.spyOn(catalogRepository, 'get').mockResolvedValue(snapshot);
    jest.spyOn(reviewsApi, 'listPage').mockResolvedValue({items: [], hasMore: false});
    let tree;
    await act(async () => {tree = renderer.create(React.createElement(DetailFestival, {
      route: {params: {festival: snapshot.festivalById.get(2)}},
    }));});
    expect(hasText(tree, 'Venue')).toBe(true);
    tree.unmount();
    await act(async () => {tree = renderer.create(React.createElement(DetailFestival, {
      route: {params: {festival: snapshot.festivalById.get(4)}},
    }));});
    expect(hasText(tree, 'Venue')).toBe(false);
    tree.unmount();
  });
});

describe('Guest mode — search bar', () => {
  afterEach(() => jest.restoreAllMocks());

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
});
