import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';

export const MainSplash = ({ navigation, onFinish }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useStore();
  const isDarkMode = useStore(state => state.isDarkMode);
  const hasFinishedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Calculate system navigation bar height to avoid covering bottom graphics/text
  const screenHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const systemNavHeight = Math.max(insets.bottom, screenHeight - windowHeight);
  const bottomInset = systemNavHeight > 0 ? systemNavHeight + s(6) : s(16);

  // Prevent hardware back press from breaking the splash video
  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, []);

  const handleProceed = useCallback(() => {
    if (hasFinishedRef.current) {
      return;
    }
    hasFinishedRef.current = true;

    // Smooth dissolve into the pre-rendered screen underneath (no white flash)
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      } else if (navigation) {
        if (isAuthenticated) {
          navigation.replace('App');
        } else {
          navigation.replace('Splash');
        }
      }
    });
  }, [fadeAnim, onFinish, navigation, isAuthenticated]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <Video
        source={theme.images.splashVideo}
        style={[
          styles.video,
          {
            bottom: bottomInset,
          },
        ]}
        resizeMode="stretch"
        repeat={false}
        paused={false}
        muted={true}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        onLoad={() => setVideoLoaded(true)}
        onEnd={handleProceed}
        onError={() => handleProceed()}
      />

      {/* Seamless lavender bottom fill matching the bottom wave under the navigation bar */}
      <View style={[styles.bottomBarFill, { height: bottomInset }]} />

      {/* Skip Button */}
      {videoLoaded && (
        <View
          style={[
            styles.skipContainer,
            { top: Math.max(insets.top, s(16)) + s(10) },
          ]}>
          <Pressable
            style={styles.skipButton}
            onPress={handleProceed}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EFE6FD',
    zIndex: 9999,
    elevation: 99,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomBarFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EFE6FD',
  },
  skipContainer: {
    position: 'absolute',
    right: s(20),
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: s(14),
    paddingVertical: s(6),
    borderRadius: s(16),
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.medium,
  },
});

export default MainSplash;
