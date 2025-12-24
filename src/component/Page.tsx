import React from 'react';
import {
  View,
  ViewStyle,
  GestureResponderEvent,
  StyleSheet,
  Keyboard,
} from 'react-native';
import colors from '../common/colors';

type Props = {
  style?: ViewStyle;
  onTouch?: (event: GestureResponderEvent) => boolean;
  children: React.ReactNode;
};

const Page: React.FC<Props> = ({style, children}) => {
  return (
    <View
      style={[styles.container, style]}
      onStartShouldSetResponder={() => {
        Keyboard.dismiss();
        return false;
      }}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default Page;
