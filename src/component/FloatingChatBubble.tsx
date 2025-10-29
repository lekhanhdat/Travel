import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import sizes from '../common/sizes';
import colors from '../common/colors';
import {ChatBotSvg} from '../assets/ImageSvg';
import NavigationService from '../container/screens/NavigationService';
import {ScreenName} from '../container/AppContainer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const BUBBLE_SIZE = sizes._56sdp;
const EDGE_PADDING = sizes._16sdp;

interface IFloatingChatBubbleProps {
  visible?: boolean;
}

interface IFloatingChatBubbleState {
  pan: Animated.ValueXY;
}

export default class FloatingChatBubble extends React.PureComponent<
  IFloatingChatBubbleProps,
  IFloatingChatBubbleState
> {
  private panResponder: any;

  constructor(props: IFloatingChatBubbleProps) {
    super(props);

    // Initial position (bottom right)
    const initialX = SCREEN_WIDTH - BUBBLE_SIZE - EDGE_PADDING;
    const initialY = SCREEN_HEIGHT - BUBBLE_SIZE - EDGE_PADDING - 100; // 100 for bottom tab bar

    this.state = {
      pan: new Animated.ValueXY({x: initialX, y: initialY}),
    };

    // Create pan responder for dragging
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Set offset to current value
        this.state.pan.setOffset({
          // @ts-ignore
          x: this.state.pan.x._value,
          // @ts-ignore
          y: this.state.pan.y._value,
        });
        this.state.pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event(
        [
          null,
          {
            dx: this.state.pan.x,
            dy: this.state.pan.y,
          },
        ],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: (e, gesture) => {
        this.state.pan.flattenOffset();

        // Get current position
        // @ts-ignore
        let finalX = this.state.pan.x._value;
        // @ts-ignore
        let finalY = this.state.pan.y._value;

        // Snap to edges
        const snapToLeft = finalX < SCREEN_WIDTH / 2;

        if (snapToLeft) {
          finalX = EDGE_PADDING;
        } else {
          finalX = SCREEN_WIDTH - BUBBLE_SIZE - EDGE_PADDING;
        }

        // Keep within vertical bounds
        if (finalY < EDGE_PADDING) {
          finalY = EDGE_PADDING;
        } else if (finalY > SCREEN_HEIGHT - BUBBLE_SIZE - EDGE_PADDING - 100) {
          finalY = SCREEN_HEIGHT - BUBBLE_SIZE - EDGE_PADDING - 100;
        }

        // Animate to final position
        Animated.spring(this.state.pan, {
          toValue: {x: finalX, y: finalY},
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();
      },
    });
  }

  handlePress = () => {
    // Navigate to ChatBot screen
    NavigationService.navigate(ScreenName.CHATBOT);
  };

  render() {
    const {visible = true} = this.props;

    if (!visible) {
      return null;
    }

    const {pan} = this.state;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{translateX: pan.x}, {translateY: pan.y}],
          },
        ]}
        {...this.panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.bubble}
          onPress={this.handlePress}
          activeOpacity={0.8}>
          <ChatBotSvg
            width={sizes._28sdp}
            height={sizes._28sdp}
            color={colors.white}
          />
          {/* Pulse animation indicator */}
          <View style={styles.pulseOuter} />
        </TouchableOpacity>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    zIndex: 9999,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pulseOuter: {
    position: 'absolute',
    width: BUBBLE_SIZE + 8,
    height: BUBBLE_SIZE + 8,
    borderRadius: (BUBBLE_SIZE + 8) / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.3,
  },
});

