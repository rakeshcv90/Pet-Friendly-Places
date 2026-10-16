import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  Easing,
  Dimensions,
} from 'react-native';
import { theme } from '../../../theme';
import { s } from 'react-native-size-matters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Premium Animated Loader Modal
 * Features rotating glow ring, breathing branded logo, smooth entrance, and status text.
 */
export const Loader = ({
  visible = false,
  fullScreen = false,
  title = 'Please wait...',
  subtitle = 'Connecting to server...',
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible || fullScreen) {
      // Fade in & scale entrance
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous 360-degree rotation animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );

      // Continuous breathing pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.08,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 0.98,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      spinAnimation.start();
      pulseAnimation.start();

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      fadeValue.setValue(0);
      cardScale.setValue(0.92);
    }
  }, [visible, fullScreen, fadeValue, cardScale, spinValue, pulseValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const LoaderCard = (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: fadeValue,
          transform: [{ scale: cardScale }],
        },
      ]}>
      {/* Animated Graphic Container */}
      <View style={styles.graphicContainer}>
        {/* Rotating outer accent ring */}
        <Animated.View
          style={[
            styles.outerRing,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />

        {/* Pulsing Center with Branded Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseValue }],
            },
          ]}>
          <Animated.Image
            source={theme.images.logo}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Status Typography */}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Decorative Progress Dots */}
      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
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
        <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
          {LoaderCard}
        </Animated.View>
      </Modal>
    );
  }

  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        {LoaderCard}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 6, 32, 0.65)', // Deep translucent purple-tinted backdrop
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: Math.min(SCREEN_WIDTH - s(48), s(290)),
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    paddingVertical: s(28),
    paddingHorizontal: s(22),
    alignItems: 'center',
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(123, 44, 255, 0.12)',
  },
  graphicContainer: {
    width: s(96),
    height: s(96),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: s(16),
  },
  outerRing: {
    position: 'absolute',
    width: s(90),
    height: s(90),
    borderRadius: s(45),
    borderWidth: 3,
    borderColor: 'rgba(123, 44, 255, 0.2)',
    borderTopColor: theme.colors.primary,
    borderRightColor: theme.colors.primaryDark,
  },
  logoContainer: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: '#F5EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 255, 0.15)',
  },
  logo: {
    width: s(50),
    height: s(50),
  },
  title: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: s(6),
  },
  subtitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: s(18),
    paddingHorizontal: s(8),
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(16),
  },
  dot: {
    width: s(7),
    height: s(7),
    borderRadius: s(3.5),
    marginHorizontal: s(4),
  },
  dot1: {
    backgroundColor: theme.colors.primary,
    opacity: 0.9,
  },
  dot2: {
    backgroundColor: theme.colors.primaryLight,
    opacity: 0.65,
  },
  dot3: {
    backgroundColor: theme.colors.primaryDark,
    opacity: 0.4,
  },
});
