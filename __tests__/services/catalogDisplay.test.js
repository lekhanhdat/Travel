const React = require('react');
jest.mock('axios', () => jest.requireActual(require('path').join(require.resolve('axios/package.json'), '..', 'dist', 'node', 'axios.cjs')));
const renderer = require('react-test-renderer');
const {catalogImage} = require('../../src/utils/catalogDisplay');

jest.mock('../../src/container/screens/NavigationService', () => ({navigate: jest.fn()}));
jest.mock('../../src/container/AppContainer', () => ({ScreenName: {}}));
jest.mock('../../src/component/CachedImage', () => 'CachedImage');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));

const festival = overrides => ({id: 3, Id: 3, record_id: 'f-3', name: 'Lễ hội API', types: [], description: '',
  long_description: '', rating: null, review_count: 0, images: [], videos: [], advise: [], website: '', phone: '',
  ticket_info: '', publishable: false, event_time: '', location_id: null, location: '', ...overrides});

const texts = tree => tree.root.findAll(node => typeof node.type === 'string' && node.type === 'Text')
  .map(node => [node.props.children].flat(Infinity).join(''));

describe('catalog empty states', () => {
  it('picks avatar, then the first image, else empty for the placeholder', () => {
    expect(catalogImage({avatar: 'https://img/a.jpg', images: ['https://img/b.jpg']})).toBe('https://img/a.jpg');
    expect(catalogImage({avatar: '', images: ['', 'https://img/b.jpg']})).toBe('https://img/b.jpg');
    expect(catalogImage({avatar: '', images: []})).toBe('');
    expect(catalogImage({images: null})).toBe('');
    expect(catalogImage(null)).toBe('');
  });

  // D-2: festivals use the shared DiscoverCard (badge "Lễ hội", event time or venue as subtitle).
  const card = item => {
    const {DiscoverCard} = require('../../src/features/discover/DiscoverCard');
    let tree;
    renderer.act(() => {tree = renderer.create(React.createElement(DiscoverCard, {item}));});
    return tree;
  };

  it('festival card hides subtitle and rating when the API has none', () => {
    const {fromFestival} = require('../../src/features/discover/discover');
    const tree = card(fromFestival(festival()));
    const shown = texts(tree);
    expect(shown).toContain('Lễ hội API');
    expect(shown.filter(Boolean)).toHaveLength(2); // badge + name only
    expect(tree.root.findAllByType('Icon').map(icon => icon.props.name)).not.toContain('star');
    expect(tree.root.findByType('CachedImage').props.uri).toBe('');
  });

  it('festival card shows its time (else the venue resolved from location_id) and the rating', () => {
    const {fromFestival} = require('../../src/features/discover/discover');
    let shown = texts(card(fromFestival(festival({
      location_id: 7, location: 'An Phú Farm', event_time: 'Tháng 3', images: ['https://img/f.jpg'],
      rating: 4, review_count: 1,
    }))));
    expect(shown).toEqual(expect.arrayContaining(['Lễ hội API', 'Tháng 3', '4.0', '(1)']));
    shown = texts(card(fromFestival(festival({location_id: 7, location: 'An Phú Farm'}))));
    expect(shown).toContain('An Phú Farm');
    const tree = card(fromFestival(festival({images: ['https://img/f.jpg']})));
    expect(tree.root.findByType('CachedImage').props.uri).toBe('https://img/f.jpg');
  });
});
