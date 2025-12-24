import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import colors from '../common/colors';
import sizes from '../common/sizes';
import TextBase from '../common/TextBase';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface ChatBubbleProps {
  onPress: () => void;
  unreadCount?: number;
}

interface ChatBubbleState {
  pan: Animated.ValueXY;
}

/**
 * Draggable Chat Bubble Component
 * Floating button that can be moved around the screen
 */
export default class ChatBubble extends React.PureComponent<
  ChatBubbleProps,
  ChatBubbleState
> {
  private panResponder: any;

  constructor(props: ChatBubbleProps) {
    super(props);

    // Initial position (bottom right corner)
    const initialX = SCREEN_WIDTH - sizes._70sdp - sizes._16sdp;
    const initialY = SCREEN_HEIGHT - sizes._150sdp;

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
        [null, {dx: this.state.pan.x, dy: this.state.pan.y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: (e, gesture) => {
        this.state.pan.flattenOffset();

        // Get current position
        // @ts-ignore
        const currentX = this.state.pan.x._value;
        // @ts-ignore
        const currentY = this.state.pan.y._value;

        // Snap to nearest edge (left or right)
        const snapToRight = currentX > SCREEN_WIDTH / 2;
        const targetX = snapToRight
          ? SCREEN_WIDTH - sizes._70sdp - sizes._16sdp
          : sizes._16sdp;

        // Constrain Y position
        let targetY = currentY;
        const minY = sizes._50sdp; // Below status bar
        const maxY = SCREEN_HEIGHT - sizes._150sdp; // Above bottom nav

        if (targetY < minY) {targetY = minY;}
        if (targetY > maxY) {targetY = maxY;}

        // Animate to final position
        Animated.spring(this.state.pan, {
          toValue: {x: targetX, y: targetY},
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();

        // If gesture is a tap (not drag), trigger onPress
        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          this.props.onPress();
        }
      },
    });
  }

  render() {
    const {unreadCount} = this.props;

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {translateX: this.state.pan.x},
              {translateY: this.state.pan.y},
            ],
          },
        ]}
        {...this.panResponder.panHandlers}>
        <TouchableOpacity
          style={styles.bubble}
          activeOpacity={0.8}
          onPress={this.props.onPress}>
          {/* AI Icon */}
          <View style={styles.iconContainer}>
            <TextBase style={styles.iconText}>🤖</TextBase>
          </View>

          {/* Unread badge */}
          {unreadCount && unreadCount > 0 ? (
            <View style={styles.badge}>
              <TextBase style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </TextBase>
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  bubble: {
    width: sizes._60sdp,
    height: sizes._60sdp,
    borderRadius: sizes._30sdp,
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
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: sizes._28sdp,
  },
  badge: {
    position: 'absolute',
    top: -sizes._4sdp,
    right: -sizes._4sdp,
    backgroundColor: '#FF3B30',
    borderRadius: sizes._10sdp,
    minWidth: sizes._20sdp,
    height: sizes._20sdp,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizes._4sdp,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: sizes._10sdp,
    fontWeight: 'bold',
  },
});

