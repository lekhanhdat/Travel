const React = require('react');
const renderer = require('react-test-renderer');
jest.mock('../src/services/translation', () => ({translationQueue: {translate: jest.fn()}}));
const {TranslationProvider, useTranslationContext} = require('../src/context/TranslationContext');
const {translationQueue} = require('../src/services/translation');
const storage = require('@react-native-async-storage/async-storage');

it('uses Vietnamese/English local UI strings and returns unknown content without queue/network translation', async () => {
  let context;
  function Probe() {context = useTranslationContext(); return null;}
  const remove = jest.spyOn(storage, 'removeItem');
  let tree;
  await renderer.act(async () => {tree = renderer.create(React.createElement(TranslationProvider, null, React.createElement(Probe)));});
  expect(context.translateSync('recovery.retry')).toBe('Thử lại');
  await expect(context.translate('Catalog content without a local key')).resolves.toBe('Catalog content without a local key');
  await renderer.act(async () => {await context.setLanguage('en');});
  expect(context.translateSync('recovery.retry')).toBe('Retry');
  expect(translationQueue.translate).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  tree.unmount();
  remove.mockRestore();
});
