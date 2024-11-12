import React from 'react';
import {
  Image,
  ImageStyle,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import colors from '../common/colors';
import fonts from '../common/fonts';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
import {validateEmail} from '../utils/Utils';

interface Props {
  containerStyle?: ViewStyle;
  containerInput?: ViewStyle;
  leftIcon?: any;
  rightIcon?: any;
  placeHolder?: string;
  title?: string;
  titleStyle?: TextStyle;
  leftIconStyle?: ImageStyle;
  rightIconStyle?: ImageStyle;
  onChangeText?: (text: string) => void;
  disableRightIcon?: boolean;
  handleOnPressRightIcon?: () => void;
  secureTextEntry?: boolean;
  type?: 'string' | 'email' | 'confirmPass';
  errorMessage?: string;
  emptyMessage?: string;
  passWord?: string;
  initValue?: string;
}
interface States {
  error: boolean;
  value: string;
}
class InputBase extends React.PureComponent<Props, States> {
  validate = () => {
    const {type, passWord} = this.props;
    const {value} = this.state;
    if (type === 'email') {
      if (!validateEmail(value) || value.trim().length === 0) {
        this.setState({
          error: true,
        });
        return false;
      }
      return true;
    }
    if (type === 'string' || !type) {
      if (value.trim().length === 0) {
        this.setState({
          error: true,
        });
        return false;
      }
      return true;
    }
    if (type === 'confirmPass') {
      if (value.trim() !== passWord || value.trim().length === 0) {
        this.setState({
          error: true,
        });
        return false;
      }
    }
    return true;
  };
  state: Readonly<States> = {
    error: false,
    value: this.props?.initValue ?? '',
  };
  setValue = value => {
    this.setState({
      value: value,
    });
  };
  render(): React.ReactNode {
    const {
      containerStyle,
      leftIcon,
      placeHolder,
      rightIcon,
      title,
      containerInput,
      titleStyle,
      leftIconStyle,
      rightIconStyle,
      onChangeText,
      disableRightIcon,
      handleOnPressRightIcon,
      secureTextEntry,
      errorMessage,
      emptyMessage,
      initValue,
    } = this.props;
    const {error, value} = this.state;
    return (
      <View style={containerStyle}>
        {/* tiêu đề  */}
        {title && <TextBase title={title} style={[styles.title, titleStyle]} />}
        {/* view tổng  */}
        <View
          style={[
            styles.container,
            containerInput,
            error && {
              borderColor: colors.E25039,
            },
          ]}>
          {/* icon bên trái  */}
          {leftIcon && (
            <Image source={leftIcon} style={[styles.leftIcon, leftIconStyle]} />
          )}
          <TextInput
            placeholder={placeHolder ?? ''}
            placeholderTextColor={colors.AFAFAF}
            style={[
              styles.inputContainer,
              {
                width:
                  leftIcon && rightIcon
                    ? sizes.width - sizes._136sdp
                    : leftIcon || rightIcon
                    ? sizes.width - sizes._104sdp
                    : sizes.width - sizes._72sdp,
              },
            ]}
            onChangeText={(text: string) => {
              this.setState(
                {
                  value: text,
                  error: false,
                },
                () => {
                  onChangeText(text);
                },
              );
            }}
            value={value}
            secureTextEntry={secureTextEntry}
          />
          {rightIcon && (
            <TouchableOpacity
              disabled={disableRightIcon}
              onPress={handleOnPressRightIcon}>
              <Image
                source={rightIcon}
                style={[styles.rightIcon, rightIconStyle]}
              />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <TextBase
            title={
              value.trim().length === 0
                ? emptyMessage ?? 'Vui lòng nhập thông tin'
                : errorMessage ?? 'Email không hợp lệ'
            }
            style={styles.txtError}
          />
        )}
      </View>
    );
  }
}
export default InputBase;
const styles = StyleSheet.create({
  container: {
    width: sizes.width - sizes._38sdp,
    height: sizes._44sdp,
    paddingLeft: sizes._14sdp,
    paddingRight: sizes._14sdp,
    borderRadius: sizes._11sdp,
    // borderWidth: sizes._1sdp,
    borderColor: colors.E6E8EC,
    backgroundColor: colors.F9F9F9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    color: colors[333333],
    fontSize: sizes._12sdp,
  },
  leftIcon: {
    width: sizes._24sdp,
    height: sizes._24sdp,
    marginRight: sizes._7sdp,
    resizeMode: 'contain',
  },
  rightIcon: {
    width: sizes._24sdp,
    height: sizes._24sdp,
    marginLeft: sizes._8sdp,
    resizeMode: 'contain',
  },
  title: {
    marginBottom: sizes._8sdp,
    marginLeft: sizes._12sdp,
    fontSize: sizes._14sdp,
    fontFamily: fonts.GoogleSans_Bold,
    color: colors['777E90'],
  },
  txtError: {
    fontSize: sizes._16sdp,
    fontFamily: fonts.GoogleSans_Regular,
    marginTop: sizes._8sdp,
    color: colors.E25039,
  },
});
