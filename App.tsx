import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
// import { SafeAreaView } from 'react-native-safe-area-context';
import {SafeAreaView, StatusBar, StyleSheet, View} from 'react-native';
import AppContainer from './src/container/AppContainer';
import NavigationService from './src/container/screens/NavigationService';
import {RootSiblingParent} from 'react-native-root-siblings';
import {MD3LightTheme as DefaultTheme, PaperProvider} from 'react-native-paper';
import colors from './src/common/colors';
import Toast from 'react-native-toast-message';
import FloatingChatBubble from './src/component/FloatingChatBubble';

interface Props {}
interface States {}
class App extends React.PureComponent<Props, States> {
  render() {
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
              onStateChange={state => {
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
            <FloatingChatBubble />
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
  },
});
