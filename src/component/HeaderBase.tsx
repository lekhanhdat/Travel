import React from 'react';
import {
  Image,
  NativeModules,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {OptionsSvg} from '../assets/ImageSvg';
import colors from '../common/colors';
import fonts from '../common/fonts';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';
const {StatusBarManager} = NativeModules;

interface Props {
  leftIconSvg?: any;
  leftIconImage?: any;

  title?: string;
  hideLeftIcon?: boolean;

  rightIconImageOne?: any;
  rightIconImageTwo?: any;
  rightIconImageThree?: any;

  rightIconSvgOne?: any;
  rightIconSvgTwo?: any;
  rightIconSvgThree?: any;

  onLeftIconPress?: () => void;
  onRightIconOnePress?: () => void;
  onRightIconTwoPress?: () => void;
  onRightIconThreePress?: () => void;
}
interface States {}
class HeaderBase extends React.PureComponent<Props, States> {
  render() {
    const {
      leftIconImage,
      leftIconSvg,
      title,
      hideLeftIcon,
      rightIconImageOne,
      rightIconImageThree,
      rightIconImageTwo,
      rightIconSvgOne,
      rightIconSvgThree,
      rightIconSvgTwo,
      onLeftIconPress,
      onRightIconOnePress,
      onRightIconThreePress,
      onRightIconTwoPress,
    } = this.props;
    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor={colors.transparent} />
        <View style={styles.content}>
          <View style={styles.viewLeft}>
            {!hideLeftIcon && (
              <TouchableOpacity
                onPress={onLeftIconPress}
                style={{marginRight: sizes._2sdp}}>
                <View style={styles.viewPadding}>
                  {leftIconImage ? (
                    <Image source={leftIconImage} style={styles.icon} />
                  ) : (
                    leftIconSvg ?? <OptionsSvg />
                  )}
                </View>
              </TouchableOpacity>
            )}
            {title && (
              //@ts-ignore
              <TextBase style={[styles.title, hideLeftIcon && {}]}>
                {title}
              </TextBase>
            )}
          </View>

          <View style={styles.viewRight}>
            {/* icon phải 1 */}
            {(rightIconImageOne || rightIconSvgOne) && (
              <TouchableOpacity
                style={
                  (rightIconImageTwo || rightIconSvgTwo) && {
                    marginRight: sizes._16sdp,
                  }
                }
                onPress={onRightIconOnePress}>
                <View style={styles.viewPadding}>
                  {rightIconImageOne ? (
                    <Image source={rightIconImageOne} style={styles.icon} />
                  ) : (
                    rightIconSvgOne
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* icon phải 2 */}
            {(rightIconImageTwo || rightIconSvgTwo) && (
              <TouchableOpacity
                style={
                  (rightIconImageThree || rightIconSvgThree) && {
                    marginRight: sizes._16sdp,
                  }
                }
                onPress={onRightIconTwoPress}>
                <View style={styles.viewPadding}>
                  {rightIconImageTwo ? (
                    <Image source={rightIconImageTwo} style={styles.icon} />
                  ) : (
                    rightIconSvgTwo
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* icon phải 3 */}
            {(rightIconImageThree || rightIconSvgThree) && (
              <TouchableOpacity onPress={onRightIconThreePress}>
                <View style={styles.viewPadding}>
                  {rightIconImageThree ? (
                    <Image source={rightIconImageThree} style={styles.icon} />
                  ) : (
                    rightIconSvgThree
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }
}

export default HeaderBase;
const styles = StyleSheet.create({
  container: {
    width: sizes.width,
    height: sizes._60sdp + StatusBarManager.HEIGHT,
    backgroundColor: '#0A8791',
    paddingTop: StatusBarManager.HEIGHT,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.36,
    shadowRadius: 6.68,

    elevation: 11,
  },
  content: {
    flex: 1,
    padding: sizes._8sdp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPadding: {
    padding: sizes._8sdp,
  },
  icon: {
    width: sizes._24sdp,
    height: sizes._24sdp,
    resizeMode: 'contain',
  },
  title: {
    fontSize: sizes._20sdp,
    fontFamily: fonts.NotoSansJP_Bold,
    color: colors.black,
    lineHeight: sizes._30sdp,
  },
  viewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
