import React, { Component } from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import colors from './colors';
import sizes from './sizes';
import {resolveFont} from '../ui/fontResolver';

interface Props extends TextProps {
  title?: any;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  onPress?: () => void;
  isSecurity?: boolean;
}

type State = {};

class TextBase extends Component<Props, State> {
  getTextSecurity(length: number): string {
    let s = '';
    for (let i = 0; i < length; i++) {
      s += '*';
    }
    return s;
  }
  render() {
    const style = [
          {
            fontSize: sizes._font_size_large,
            color: colors.primary_950,
            includeFontPadding: false,
            lineHeight:
              //@ts-ignore
              this.props.style && this.props.style.fontSize
                //@ts-ignore
                ? this.props.style.fontSize * 1.2
                : sizes._font_size_large * 1.2,
            // letterSpacing: sizes._1sdp / 2, // removed: Danavi type scale uses no tracking
          },
          this.props.style,
        ];
    return (
      <Text
        {...this.props}
        numberOfLines={this.props.numberOfLines}
        style={[style, resolveFont(style)]}>
        {this.props.isSecurity
          ? this.props.title
            ? this.getTextSecurity(this.props.title.length)
            : ''
          : this.props.title}
        {this.props.children}
      </Text>
    );
  }
}

export default TextBase;
