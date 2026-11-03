import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { s } from 'react-native-size-matters';

// Gently bobs its children up and down
export const Bob = ({ children, style, distance = 5, duration = 2200, delay = 0 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [progress, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
};

// Light streak sweeping across an overflow-hidden parent every few seconds
export const Shine = ({ travel = 200 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shine,
        {
          transform: [
            {
              translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-60, travel] }),
            },
            { skewX: '-20deg' },
          ],
        },
      ]}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

// Fades and lifts its children in, staggered by `index`
export const Enter = ({ children, style, index = 0 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      delay: Math.min(index, 6) * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: s(36) },
});
