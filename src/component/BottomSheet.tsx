import React from 'react';
import {SafeAreaInsetsContext} from 'react-native-safe-area-context';
import RBSheet from 'react-native-raw-bottom-sheet';
import sizes from '../common/sizes';

interface Props {
  children?: React.ReactNode;
  height?: number;
}
interface States {}
class BottomSheet extends React.PureComponent<Props, States> {
  static contextType = SafeAreaInsetsContext;
  bottomSheetRef: React.ElementRef<typeof RBSheet> | null = null;
  onClose = () => {};
  onOpen = () => {};
  open = () => {
    this.bottomSheetRef?.open();
  };
  close = () => {
    this.bottomSheetRef?.close();
  };
  render(): React.ReactNode {
    const {height} = this.props;
    const insets = this.context as React.ContextType<
      typeof SafeAreaInsetsContext
    >;
    return (
      <RBSheet
        ref={ref => {
          this.bottomSheetRef = ref;
        }}
        draggable={false}
        customModalProps={{
          statusBarTranslucent: true,
          navigationBarTranslucent: true,
        }}
        closeOnPressBack={true}
        closeOnPressMask={true}
        openDuration={250}
        height={height ? height + (insets?.bottom ?? 0) : height}
        onClose={this.onClose}
        onOpen={this.onOpen}
        customStyles={{
          container: {
            paddingBottom: insets?.bottom ?? 0,
            paddingLeft: insets?.left ?? 0,
            paddingRight: insets?.right ?? 0,
            borderTopLeftRadius: sizes._10sdp,
            borderTopRightRadius: sizes._10sdp,
          },
        }}>
        {this.props.children}
      </RBSheet>
    );
  }
}
export default BottomSheet;
