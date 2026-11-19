import React from 'react';
import { Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { useHomeAnimations } from './useHomeAnimations';
import { styles } from './styles';

// The Home screen's soft glows and paw watermarks, moving with the scroll position
export const AmbientBackground = ({ scrollY, isDarkMode }) => {
  const {
    orbTopRightY,
    orbTopRightScale,
    orbTopLeftY,
    orbMidRightY,
    orbMidLeftY,
    orbBottomRightY,
    watermarkTopY,
    watermarkBottomY,
  } = useHomeAnimations(scrollY);
  const glow = isDarkMode && styles.ambientGlowDark;

  return (
    <>
      <Animated.View
        style={[
          styles.ambientGlowTopRight,
          glow,
          { transform: [{ translateY: orbTopRightY }, { scale: orbTopRightScale }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowTopLeft, glow, { transform: [{ translateY: orbTopLeftY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowMidRight, glow, { transform: [{ translateY: orbMidRightY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowMidLeft, glow, { transform: [{ translateY: orbMidLeftY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientGlowBottomRight,
          glow,
          { transform: [{ translateY: orbBottomRightY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientPawWatermarkTop,
          { transform: [{ rotate: '-25deg' }, { translateY: watermarkTopY }] },
        ]}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(130)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(123, 44, 255, 0.035)'}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.ambientPawWatermarkBottom,
          { transform: [{ rotate: '30deg' }, { translateY: watermarkBottomY }] },
        ]}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(238, 42, 123, 0.06)' : 'rgba(238, 42, 123, 0.03)'}
        />
      </Animated.View>
    </>
  );
};
