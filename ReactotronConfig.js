import Reactotron, {networking} from 'reactotron-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.disableYellowBox = true;
// First, set some configuration settings on how to connect to the app,
const reactotron = Reactotron.configure({
  name: 'BYME',
  host: '127.0.0.1',
  port: 9090,
})
  .setAsyncStorageHandler(AsyncStorage)
  // .use(sagaPlugin())
  .useReactNative({
    asyncStorage: {ignore: ['secret']},
  })
  .use(
    networking({
      ignoreContentTypes: /^(image)\/.*$/i,
      ignoreUrls: /\/(logs|symbolicate)$/,
    }),
  )
  .connect();
let tempLog = console.log;
console.log = (...args) => {
  tempLog(...args);
  // Reactotron.log(...args);
};
export default reactotron;
