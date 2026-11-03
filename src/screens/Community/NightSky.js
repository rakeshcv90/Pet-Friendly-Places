import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { s } from 'react-native-size-matters';

// Twinkling stars, a glowing moon and drifting fireflies behind the hero
const STARS = [
  { left: '6%', top: '14%', size: 2, delay: 0 },
  { left: '18%', top: '30%', size: 3, delay: 500 },
  { left: '30%', top: '10%', size: 2, delay: 900 },
  { left: '44%', top: '24%', size: 2, delay: 300 },
  { left: '56%', top: '8%', size: 3, delay: 1200 },
  { left: '68%', top: '34%', size: 2, delay: 700 },
  { left: '80%', top: '18%', size: 2, delay: 200 },
  { left: '92%', top: '38%', size: 3, delay: 1000 },
];

const FIREFLIES = [
  { left: '12%', bottom: '8%', delay: 0 },
  { left: '48%', bottom: '4%', delay: 1100 },
  { left: '84%', bottom: '10%', delay: 2200 },
];

const Pulse = ({ children, style, from = 0.15, to = 0.95, duration = 1600, delay = 0 }) => {
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
        { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) },
      ]}>
      {children}
    </Animated.View>
  );
};

const Firefly = ({ left, bottom, delay }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        styles.firefly,
        {
          left,
          bottom,
          opacity: progress.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -s(22)] }) },
            {
              translateX: progress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, s(8), -s(6)],
              }),
            },
          ],
        },
      ]}
    />
  );
};

// `topInset` keeps the sky below the solid status bar strip so nothing is cut off
export const NightSky = ({ topInset = 0 }) => (
  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: topInset }]}>
    {STARS.map(star => (
      <Pulse
        key={star.left}
        delay={star.delay}
        style={[
          styles.star,
          {
            left: star.left,
            top: star.top,
            width: s(star.size),
            height: s(star.size),
            borderRadius: s(star.size),
          },
        ]}
      />
    ))}
    <Pulse style={styles.moonHalo} from={0.3} to={0.6} duration={2600} />
    <View style={styles.moon} />
    {FIREFLIES.map(fly => (
      <Firefly key={fly.left} {...fly} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  star: { position: 'absolute', backgroundColor: '#FFFFFF' },
  moonHalo: {
    position: 'absolute',
    top: s(6),
    right: s(24),
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: 'rgba(255,236,170,0.28)',
  },
  moon: {
    position: 'absolute',
    top: s(19),
    right: s(37),
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255,244,200,0.9)',
  },
  firefly: {
    position: 'absolute',
    width: s(4),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: '#F8E060',
    shadowColor: '#F8E060',
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
});
