const React = require('react');
jest.mock('axios', () => jest.requireActual(require('path').join(require.resolve('axios/package.json'), '..', 'dist', 'node', 'axios.cjs')));
const renderer = require('react-test-renderer');
const {catalogImage} = require('../../src/utils/catalogDisplay');

jest.mock('../../src/container/screens/NavigationService', () => ({navigate: jest.fn()}));
jest.mock('../../src/container/AppContainer', () => ({ScreenName: {}}));
jest.mock('../../src/component/CachedImage', () => 'CachedImage');
jest.mock('react-native-iphone-x-helper', () => ({isIphoneX: () => false}));

const festival = overrides => ({id: 3, Id: 3, record_id: 'f-3', name: 'Lễ hội API', types: [], description: '',
  long_description: '', rating: null, reviews: [], images: [], videos: [], advise: [], website: '', phone: '',
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

  it('festival card hides venue, time and rating when the API has none', () => {
    const LargeItemFestival = require('../../src/component/LargeItemFestival').default;
    let tree;
    renderer.act(() => {tree = renderer.create(React.createElement(LargeItemFestival, {festival: festival()}));});
    const shown = texts(tree).join('|');
    expect(shown).toContain('Lễ hội API');
    expect(shown).not.toContain('📍');
    expect(shown).not.toContain('⏰');
    expect(shown).not.toContain('⭐');
    expect(tree.root.findByType('CachedImage').props.uri).toBe('');
  });

  it('festival card shows the venue resolved from location_id', () => {
    const LargeItemFestival = require('../../src/component/LargeItemFestival').default;
    let tree;
    renderer.act(() => {
      tree = renderer.create(React.createElement(LargeItemFestival, {festival: festival({
        location_id: 7, location: 'An Phú Farm', event_time: 'Tháng 3', images: ['https://img/f.jpg'],
        reviews: [{start: 4}],
      })}));
    });
    const shown = texts(tree).join('|');
    expect(shown).toContain('📍 An Phú Farm');
    expect(shown).toContain('⏰ Tháng 3');
    expect(shown).toContain('⭐ 4.0');
    expect(tree.root.findByType('CachedImage').props.uri).toBe('https://img/f.jpg');
  });
});
