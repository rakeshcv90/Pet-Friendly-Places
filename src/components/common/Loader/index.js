import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Modal, Easing, Platform } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../../store';
import { s } from 'react-native-size-matters';

// Sized through u(): change SCALE to make the whole loader bigger or smaller
const SCALE = 1;
const u = n => s(n * SCALE);

const BADGE = u(84);

/**
 * Round branded loader: the logo inside a spinning gradient ring with a soft pulse,
 * and the message underneath. Native-driver animations, created once, stopped on close.
 */
const useLoaderMotion = active => {
  const v = useRef({
    entrance: new Animated.Value(0),
    spin: new Animated.Value(0),
    spinSlow: new Animated.Value(0),
    pulse: new Animated.Value(0),
  }).current;

  useEffect(() => {
    if (!active) {
      v.entrance.setValue(0);
      return undefined;
    }
    const running = [
      Animated.spring(v.entrance, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(v.spin, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.timing(v.spinSlow, {
          toValue: 1,
          duration: 2600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(v.pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v.pulse, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ];
    running.forEach(a => a.start());
    return () => {
      running.forEach(a => a.stop());
      Object.values(v).forEach(value => value.setValue(0));
    };
  }, [active, v]);

  return useMemo(
    () => ({
      entrance: v.entrance,
      scale: v.entrance.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
      spin: v.spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
      spinReverse: v.spinSlow.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }),
      haloScale: v.pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.22] }),
      haloOpacity: v.pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0.12] }),
      logoScale: v.pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.06] }),
    }),
    [v],
  );
};

/**
 * Loader. Modal when `visible`, inline when `fullScreen` (`transparent` keeps the parent's background).
 * `message` is accepted as an alias of `title` (some screens pass it).
 */
export const Loader = ({
  visible = false,
  fullScreen = false,
  transparent = false,
  title,
  subtitle,
  message,
}) => {
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const m = useLoaderMotion(visible || fullScreen);

  const heading = title ?? message ?? 'Please wait...';
  const detail = subtitle ?? (title || message ? '' : 'Connecting to server...');

  // the modal sits on a dark backdrop, so its text is light; inline follows the theme
  const lightText = visible || isDarkMode;

  const content = (
    <Animated.View style={[styles.wrap, { opacity: m.entrance, transform: [{ scale: m.scale }] }]}>
      <View style={styles.graphic}>
        <Animated.View
          style={[
            styles.halo,
            lightText && styles.haloLight,
            { opacity: m.haloOpacity, transform: [{ scale: m.haloScale }] },
          ]}
        />

        {/* round badge */}
        <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
          <Animated.View style={{ transform: [{ scale: m.logoScale }] }}>
            <Image source={theme.images.logo} style={styles.logo} resizeMode="contain" />
          </Animated.View>
        </View>

        {/* outer ring (fast) + thin inner ring (slow, reverse) */}
        <Animated.View
          style={[styles.ring, { transform: [{ rotate: m.spin }] }]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.ringInner,
            lightText && styles.ringInnerLight,
            { transform: [{ rotate: m.spinReverse }] },
          ]}
          pointerEvents="none"
        />
      </View>

      <Text numberOfLines={2} style={[styles.title, lightText && styles.titleLight]}>
        {heading}
      </Text>
      {detail ? (
        <Text numberOfLines={2} style={[styles.subtitle, lightText && styles.subtitleLight]}>
          {detail}
        </Text>
      ) : null}
    </Animated.View>
  );

  if (visible) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View style={styles.overlay}>{content}</View>
      </Modal>
    );
  }

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenContainer,
          isDarkMode && styles.fullScreenContainerDark,
          transparent && styles.fullScreenTransparent,
        ]}>
        {content}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 6, 32, 0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  fullScreenContainerDark: {
    backgroundColor: '#0F071D',
  },
  fullScreenTransparent: {
    backgroundColor: 'transparent',
  },
  wrap: {
    alignItems: 'center',
    maxWidth: s(250),
  },
  graphic: {
    width: BADGE + u(26),
    height: BADGE + u(26),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: u(10),
  },
  halo: {
    position: 'absolute',
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: 'rgba(123, 44, 255, 0.3)',
  },
  haloLight: {
    backgroundColor: 'rgba(196, 173, 255, 0.45)',
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 255, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#3B108F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 14,
      },
      android: { elevation: 10 },
    }),
  },
  badgeDark: {
    backgroundColor: '#1E1038',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  logo: {
    width: u(46),
    height: u(46),
  },
  ring: {
    position: 'absolute',
    width: BADGE + u(14),
    height: BADGE + u(14),
    borderRadius: (BADGE + u(14)) / 2,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#7B2CFF',
    borderRightColor: '#C4ADFF',
  },
  ringInner: {
    position: 'absolute',
    width: BADGE + u(24),
    height: BADGE + u(24),
    borderRadius: (BADGE + u(24)) / 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderBottomColor: 'rgba(59, 16, 143, 0.55)',
    borderLeftColor: 'rgba(123, 44, 255, 0.3)',
  },
  ringInnerLight: {
    borderBottomColor: 'rgba(255, 255, 255, 0.7)',
    borderLeftColor: 'rgba(196, 173, 255, 0.5)',
  },
  title: {
    fontSize: s(14.5),
    lineHeight: s(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E0A4D',
    textAlign: 'center',
  },
  titleLight: {
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: u(3),
    fontSize: s(12),
    lineHeight: s(17),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
  },
  subtitleLight: {
    color: '#DDD0FF',
  },
});

export default Loader;
