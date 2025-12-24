import React from 'react';
import {
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
  Image,
  View,
} from 'react-native';
import fonts from '../common/fonts';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';

interface Props {
  containerStyle?: ViewStyle;
  labelButton: string;
  buttonWidth: number;
  labelStyle?: TextStyle;
  hasRightButton?: boolean;
  hasLeftButton?: boolean;
  rightIcon?: any;
  lefticon?: any;
  handleOnPressButton?: () => void;
  handleOnPressRight?: () => void;
  disableContainerButton?: boolean;
}
interface States { }
class ButtonBase extends React.PureComponent<Props, States> {
  render(): React.ReactNode {
    const {
      containerStyle,
      labelButton,
      buttonWidth,
      labelStyle,
      hasRightButton,
      hasLeftButton,
      lefticon,
      rightIcon,
      handleOnPressButton,
      handleOnPressRight,
      disableContainerButton,
    } = this.props;
    return (
      <View>
        <TouchableOpacity
          style={[styles.container, containerStyle]}
          onPress={handleOnPressButton}
          disabled={disableContainerButton}>
          {hasLeftButton && (
            <TouchableOpacity onPress={handleOnPressRight}>
              <Image style={styles.icon} source={lefticon} />
            </TouchableOpacity>
          )}
          <TextBase
            title={labelButton}
            style={[
              styles.label,
              //@ts-ignore
              labelStyle,

              {
                width: hasRightButton ? buttonWidth - sizes._72sdp : '100%',
              },
            ]}
          />
          {hasRightButton && (
            <TouchableOpacity onPress={handleOnPressRight}>
              <Image style={styles.icon} source={rightIcon} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  }
}
export default ButtonBase;
const styles = StyleSheet.create({
  container: {
    width: sizes.width - sizes._48sdp,
    height: sizes._48sdp,
    borderRadius: sizes._12sdp,
    paddingHorizontal: sizes._12sdp,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    fontSize: sizes._20sdp,
    fontFamily: fonts.GoogleSans_Bold,
    lineHeight: sizes._48sdp,
    textAlign: 'center',
  },
  icon: {
    width: sizes._24sdp,
    height: sizes._24sdp,
    resizeMode: 'contain',
    position: 'absolute',
    top: -sizes._12sdp,
  },
});
