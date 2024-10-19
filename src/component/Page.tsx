import React, { Component } from 'react';
import {
  View,
  ViewStyle,
  GestureResponderEvent,
  StyleSheet,
  Keyboard,
} from 'react-native';
import {
  withNavigation,
  NavigationScreenProp,
  NavigationState,
  NavigationInjectedProps,
  NavigationParams,
} from 'react-navigation';
import colors from '../common/colors';

type Props = {
  style?: ViewStyle;
  navigation: NavigationScreenProp<NavigationState>;
  onTouch?: (event: GestureResponderEvent) => boolean;
  children: any;
};

type State = {};

class Page extends Component<
  Props & NavigationInjectedProps<NavigationParams>,
  State
> {
  render() {
    return (
      <View
        style={[styles.container, this.props.style ? this.props.style : {}]}
        //@ts-ignore
        onStartShouldSetResponder={() => {
          Keyboard.dismiss();
        }}>
        {this.props.children}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingHorizontal: sizes._24sdp,
    backgroundColor: colors.nen,
  },
});
export default withNavigation(Page);
