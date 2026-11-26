import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import Video from 'react-native-video';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from './BouncyPressable';
import { theme } from '../../theme';

// Development console log, to find out why a video does not play. Silent in release builds and in
// tests. Filter the console by "[Video]".
const logVideo = (...args) => {
  if (__DEV__ && !process.env.JEST_WORKER_ID) {
    // eslint-disable-next-line no-console
    console.log('[Video]', ...args);
  }
};

// Video pieces for photo galleries: a card that shows the first frame with a play mark, and the
// full-screen player with a clear message (and Try again) when the video cannot play.

// A paused video that shows its first frame, with a play mark on top. Fills its parent.
export const VideoThumb = ({ uri, testID }) => {
  const ref = useRef(null);
  // Some phones cannot decode the file, or the server cannot send it: keep the card, drop the frame
  const [failed, setFailed] = useState(false);
  return (
    // pointerEvents none: the native video view otherwise swallows the tap meant for the card
    <View style={styles.thumb} pointerEvents="none">
      {failed ? (
        <LinearGradient
          colors={['#3B108F', '#7B2CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <Video
          ref={ref}
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          paused
          muted
          playInBackground={false}
          // Android shows a black frame until it seeks a little way in
          onLoad={() => ref.current?.seek(0.1)}
          onError={event => {
            logVideo('thumbnail could not load', uri, JSON.stringify(event?.error ?? event));
            setFailed(true);
          }}
          testID={testID}
        />
      )}
      <View style={styles.playOverlay} pointerEvents="none">
        <View style={styles.playCircle}>
          <Feather name="play" size={ms(22)} color="#FFFFFF" style={styles.playIcon} />
        </View>
      </View>
    </View>
  );
};

// The video in a full-screen viewer. Plays only while `active` (the page on screen). A spinner shows
// while it loads and whenever it stops to buffer, so the person can see something is happening.
export const PlayableVideo = ({ uri, active, testID }) => {
  const [failed, setFailed] = useState(false);
  // True until the first frame is ready, and again while the player waits for more data
  const [loading, setLoading] = useState(true);
  // A new number loads the video from scratch
  const [round, setRound] = useState(0);

  if (failed) {
    return (
      <View style={styles.failed} testID={`${testID}-failed`}>
        <Feather name="alert-circle" size={ms(34)} color="#E9D5FF" />
        <Text style={styles.failedTitle}>This video can't be played right now</Text>
        <Text style={styles.failedText}>
          It may be unavailable at the moment, or your phone may not be able to play this file. You
          can try again, or open it in another app.
        </Text>
        <BouncyPressable
          style={styles.failedButton}
          activeScale={0.96}
          onPress={() => {
            setFailed(false);
            setLoading(true);
            setRound(value => value + 1);
          }}
          testID={`${testID}-retry`}>
          <Feather name="refresh-cw" size={ms(14)} color="#FFFFFF" />
          <Text style={styles.failedButtonText}>Try again</Text>
        </BouncyPressable>
        <BouncyPressable
          style={[styles.failedButton, styles.failedButtonSecondary]}
          activeScale={0.96}
          onPress={() => Linking.openURL(uri).catch(() => {})}
          testID={`${testID}-open-external`}>
          <Feather name="external-link" size={ms(14)} color="#FFFFFF" />
          <Text style={styles.failedButtonText}>Open in another app</Text>
        </BouncyPressable>
      </View>
    );
  }

  return (
    <>
      <Video
        key={round}
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="contain"
        controls
        paused={!active}
        playInBackground={false}
        ignoreSilentSwitch="ignore"
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onReadyForDisplay={() => setLoading(false)}
        onBuffer={({ isBuffering }) => setLoading(Boolean(isBuffering))}
        onError={event => {
          // errorString / errorCode tell a phone that cannot decode the file (DECODING_FAILED,
          // DECODER_INIT_FAILED) from a network or server problem (IO_BAD_HTTP_STATUS, IO_*)
          logVideo('could not play', uri, JSON.stringify(event?.error ?? event));
          setLoading(false);
          setFailed(true);
        }}
        testID={testID}
      />
      {loading && active ? (
        <View style={styles.loading} pointerEvents="none" testID={`${testID}-loading`}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      ) : null}
    </>
  );
};

const font = theme.typography.fontFamily;

const styles = StyleSheet.create({
  thumb: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1A0B33', overflow: 'hidden' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,7,29,0.25)',
  },
  playCircle: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    backgroundColor: 'rgba(123,44,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { marginLeft: s(3) },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  loadingText: {
    marginTop: s(12),
    color: '#FFFFFF',
    fontSize: s(13),
    fontFamily: font.medium,
  },
  failed: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
  },
  failedTitle: {
    marginTop: s(14),
    color: '#FFFFFF',
    fontSize: s(16),
    fontFamily: font.bold,
    textAlign: 'center',
  },
  failedText: {
    marginTop: s(8),
    color: 'rgba(255,255,255,0.7)',
    fontSize: s(13),
    lineHeight: s(19),
    fontFamily: font.regular,
    textAlign: 'center',
  },
  failedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: s(18),
    paddingHorizontal: s(18),
    paddingVertical: s(10),
    borderRadius: s(20),
    backgroundColor: '#7B2CFF',
  },
  failedButtonSecondary: { marginTop: s(10), backgroundColor: 'rgba(255,255,255,0.16)' },
  failedButtonText: { color: '#FFFFFF', fontSize: s(13), fontFamily: font.bold },
});
