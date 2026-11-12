import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StatusBar, StyleSheet, View} from 'react-native';
import AppContainer, {TAB_NAMES} from './src/container/AppContainer';
import BootSplash from 'react-native-bootsplash';
import NavigationService from './src/container/screens/NavigationService';
import {RootSiblingParent} from 'react-native-root-siblings';
import {PaperProvider} from 'react-native-paper';
import paperTheme from './src/theme/paperTheme';
import {Text as AppText} from './src/ui/Text';
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
    this.setState({
      showChatBubble:
        route?.name !== TAB_NAMES.PROFILE &&
        route?.name !== TAB_NAMES.CAMERA &&
        route?.name !== TAB_NAMES.MAP &&
        // Detail screens have a sticky "Chỉ đường" bar the bubble would cover.
        route?.name !== 'DetailLocationScreen' &&
        route?.name !== 'DetailFestivalScreen' &&
        // Auth forms: the bubble would cover the fields and the chat needs an account anyway.
        route?.name !== 'LoginScreen' &&
        route?.name !== 'SignUpScreen' &&
        route?.name !== 'ForgotPasswordScreen',
    });
  };

  render() {
    if (this.state.startupError) {
      return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <SafeAreaView style={styles.container}>
            <AppText>Không thể mở ứng dụng. Vui lòng khởi động lại Danavi.</AppText>
          </SafeAreaView>
        </SafeAreaProvider>
      );
    }
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <SafeAreaView style={styles.container}>
            <RootSiblingParent>
              {/* Previous inline theme (mint primary) replaced by src/theme/paperTheme.ts:
                theme={{...DefaultTheme, colors: {...DefaultTheme.colors, primary: colors.primary,
                background: colors.white, onSurfaceVariant: colors.primary}}} */}
              <PaperProvider theme={paperTheme}>
                <View style={styles.container}>
                  <StatusBar barStyle="dark-content" />

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
                  {FEATURE_FLAGS.ENABLE_AI &&
                    this.state.showChatBubble &&
                    React.createElement(
                      require('./src/component/FloatingChatBubble').default,
                    )}
                </View>
              </PaperProvider>
              <Toast />
            </RootSiblingParent>
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
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
