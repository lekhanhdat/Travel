import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
// import { SafeAreaView } from 'react-native-safe-area-context';
import {StatusBar, StyleSheet, View, Text} from 'react-native';
import AppContainer, {TAB_NAMES} from './src/container/AppContainer';
import BootSplash from 'react-native-bootsplash';
import NavigationService from './src/container/screens/NavigationService';
import {RootSiblingParent} from 'react-native-root-siblings';
import {MD3LightTheme as DefaultTheme, PaperProvider} from 'react-native-paper';
import colors from './src/common/colors';
import Toast from 'react-native-toast-message';
import FEATURE_FLAGS from './src/config/featureFlags';

interface Props {}
interface States {
  startupError: boolean;
  showChatBubble: boolean;
}
class App extends React.PureComponent<Props, States> {
  state: States = {startupError: false, showChatBubble: true};

  hideSplash = () => {
    BootSplash.hide({fade: true}).catch(error => {
      console.warn('Unable to hide splash screen', error);
    });
  };

  componentDidCatch(error: Error) {
    console.error('App rendering failed', error);
    this.setState({startupError: true});
    this.hideSplash();
  }

  updateChatBubble = () => {
    const route = NavigationService.getNavigator()?.getCurrentRoute();
    this.setState({showChatBubble: route?.name !== TAB_NAMES.PROFILE});
  };

  render() {
    if (this.state.startupError) {
      return (
        <View style={styles.container}>
          <Text>Không thể mở ứng dụng. Vui lòng khởi động lại Danavi.</Text>
        </View>
      );
    }
    return (
      <RootSiblingParent>
        <PaperProvider
          theme={{
            ...DefaultTheme,
            colors: {
              ...DefaultTheme.colors,
              primary: colors.primary,
              background: colors.white,
              // place
              // placeholder: colors.primary,

              onSurfaceVariant: colors.primary,
            },
          }}>
          <View style={styles.container}>
            <StatusBar barStyle={'dark-content'} backgroundColor={'#ffffff'} />

            <NavigationContainer
              onReady={() => {
                this.updateChatBubble();
                this.hideSplash();
              }}
              onStateChange={state => {
                this.updateChatBubble();
                if (state?.routes && state.routes.length > 0) {
                  NavigationService.setActiveScreen(
                    state.routes[state.routes.length - 1].name,
                  );
                  NavigationService.setParentOfActiveScreen(
                    state.routes[0].name,
                  );
                }
              }}
              ref={ref => {
                if (ref) {
                  NavigationService.setTopLevelNavigator(ref);
                }
              }}>
              <AppContainer />
            </NavigationContainer>
            {FEATURE_FLAGS.ENABLE_AI && this.state.showChatBubble && React.createElement(
              require('./src/component/FloatingChatBubble').default,
            )}
          </View>
        </PaperProvider>
        <Toast />
      </RootSiblingParent>
    );
  }
}

export default App;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
