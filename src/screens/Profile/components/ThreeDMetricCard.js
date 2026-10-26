import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * ── 3D Metric Card Component ──
 * Tactile perspective tilt on press with color-matched glowing shadows
 */
export const ThreeDMetricCard = ({
  emoji,
  number,
  label,
  subtext,
  gradientColors,
  shadowColor,
  bevelColor,
  onPress,
  delay = 0,
}) => {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const entranceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(entranceAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, entranceAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      tension: 220,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      tension: 140,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const cardTransform = {
    transform: [
      { perspective: 850 },
      {
        scale: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.94],
        }),
      },
      {
        rotateX: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '8deg'],
        }),
      },
      {
        translateY: pressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 4],
        }),
      },
      {
        scale: entranceAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.88, 1],
        }),
      },
    ],
    opacity: entranceAnim,
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.metricCardOuter, { shadowColor }, cardTransform]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.metricCardGradient, { borderBottomColor: bevelColor }]}>
        {/* Specular 3D Glass Sheen Top Layer */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.8 }}
          style={styles.specularSheen}
        />

        {/* Background Paw Watermark */}
        <Ionicons
          name="paw"
          size={ms(68)}
          color="rgba(255, 255, 255, 0.07)"
          style={styles.cardWatermark}
        />

        {/* Floating 3D Emoji Orb */}
        <View style={styles.metricCardTopRow}>
          <View style={styles.emojiDisc}>
            <Text style={styles.metricEmoji}>{emoji}</Text>
          </View>
          <View style={styles.cardCornerFlare} />
        </View>

        {/* Numeric Stat & Labels */}
        <View style={styles.metricCardBottom}>
          <Text style={styles.metricNumber}>{number}</Text>
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricSubtext}>{subtext}</Text>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

export default ThreeDMetricCard;

const styles = StyleSheet.create({
  metricCardOuter: {
    width: '48.2%',
    height: s(136),
    borderRadius: s(22),
    marginBottom: vs(14),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 7,
  },
  metricCardGradient: {
    flex: 1,
    borderRadius: s(22),
    padding: s(14),
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 3.5,
  },
  specularSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: s(55),
    borderRadius: s(22),
  },
  cardWatermark: {
    position: 'absolute',
    right: -s(10),
    bottom: -s(12),
  },
  metricCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emojiDisc: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  metricEmoji: {
    fontSize: s(18),
  },
  cardCornerFlare: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  metricCardBottom: {
    zIndex: 2,
  },
  metricNumber: {
    fontSize: s(26),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: s(30),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metricLabel: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginTop: vs(2),
  },
  metricSubtext: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.82)',
  },
});
