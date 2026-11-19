import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Shine } from './Motion';

const PURPLE = '#7B2CFF';
const SIZE = s(36);

// Round gradient info button: white rim, glossy top, soft pulsing halo and a passing shine
export const InfoButton = ({ onPress, label = 'About the community' }) => {
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [halo]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {
            opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }),
            transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
          },
        ]}
      />
      <BouncyPressable
        activeScale={0.9}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.rim}>
        <LinearGradient
          colors={['#A66BFF', PURPLE, '#4A12B0']}
          locations={[0, 0.5, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.fill}>
          <View pointerEvents="none" style={styles.gloss} />
          <Ionicons name="information" size={s(19)} color="#FFFFFF" />
          <Shine travel={SIZE} />
        </LinearGradient>
      </BouncyPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE },
  halo: { ...StyleSheet.absoluteFillObject, borderRadius: SIZE / 2, backgroundColor: PURPLE },
  rim: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    padding: s(2),
    backgroundColor: '#FFFFFF',
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fill: {
    flex: 1,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: s(4),
    right: s(4),
    height: '48%',
    borderBottomLeftRadius: SIZE,
    borderBottomRightRadius: SIZE,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
