import React from 'react';
import {} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import sizes from '../common/sizes';

interface Props {
  height?: number;
}
interface States {}
class BottomSheet extends React.PureComponent<Props, States> {
  bottomSheetRef: RBSheet;
  onClose = () => {};
  onOpen = () => {};
  open = () => {
    this.bottomSheetRef.open();
  };
  close = () => {
    this.bottomSheetRef.close();
  };
  render(): React.ReactNode {
    const {height} = this.props;
    return (
      <RBSheet
        ref={ref => {
          this.bottomSheetRef = ref;
        }}
        dragFromTopOnly={true}
        closeOnDragDown={false}
        closeOnPressBack={true}
        closeOnPressMask={true}
        openDuration={250}
        height={height}
        onClose={this.onClose}
        onOpen={this.onOpen}
        customStyles={{
          container: {
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
