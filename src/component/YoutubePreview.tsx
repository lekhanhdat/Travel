import React, {useCallback, useEffect, useState} from 'react';
import {AppState, Image, Pressable, StyleSheet, View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import YoutubePlayer from 'react-native-youtube-iframe';
import {Icon} from '../ui/Icon';
import {color} from '../theme/tokens';

let stopCurrent: (() => void) | null = null;

/**
 * R-FIX7: no autoplay. Shows the YouTube thumbnail; the player (a WebView) is mounted
 * only after a tap, at most one at a time app-wide, and stops on blur / background.
 */
export default function YoutubePreview({videoId, height}: {videoId: string; height: number}) {
  const {t} = useTranslation('common');
  const focused = useIsFocused();
  const [playing, setPlaying] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const stop = useCallback(() => {
    setPlaying(false);
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => {
      subscription.remove();
      if (stopCurrent === stop) {stopCurrent = null;}
    };
  }, [stop]);
  useEffect(() => {
    if (!focused || appState !== 'active') {stop();}
  }, [focused, appState, stop]);
  useEffect(() => {stop();}, [videoId, stop]);

  if (playing && focused && appState === 'active') {
    return (
      <YoutubePlayer
        height={height}
        videoId={videoId}
        play={true}
        onChangeState={(state: string) => {
          if (state === 'ended') {stop();}
        }}
      />
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('media.play')}
      onPress={() => {
        stopCurrent?.();
        stopCurrent = stop;
        setPlaying(true);
      }}
      style={[styles.wrap, {height}]}>
      <Image
        source={{uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View style={styles.play}>
        <Icon name="play" size={36} color={color.onPrimary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: color.text,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  play: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
