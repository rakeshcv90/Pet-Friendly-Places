import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';

const PAW_COLORS = ['#7B2CFF', '#FF4FB8', '#FF9F1C'];

/**
 * The app's loader: three paw prints that hop one after another.
 *  - default size: for screens and lists, with an optional label underneath
 *  - size="sm": a compact inline version for buttons and list footers; pass `color` to draw all
 *    three paws in one colour (for example white on a purple button)
 */
export const PawLoader = ({ label, isDarkMode, size = 'md', color, style, labelStyle }) => {
  const hops = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const small = size === 'sm';

  useEffect(() => {
    const loops = hops.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(value, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 360,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((hops.length - 1 - i) * 180),
        ]),
      ),
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [hops]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Loading'}
      style={[small ? styles.loaderSmall : styles.loader, style]}>
      <View style={small ? styles.rowSmall : styles.row}>
        {hops.map((value, i) => (
          <Animated.View
            key={PAW_COLORS[i]}
            style={{
              opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [
                {
                  translateY: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, small ? -s(5) : -s(10)],
                  }),
                },
                { rotate: i % 2 === 0 ? '-18deg' : '18deg' },
              ],
            }}>
            <Ionicons name="paw" size={small ? ms(12) : ms(22)} color={color || PAW_COLORS[i]} />
          </Animated.View>
        ))}
      </View>
      {label ? (
        <Text style={[styles.label, isDarkMode && styles.labelDark, labelStyle]}>{label}</Text>
      ) : null}
    </View>
  );
};

export default PawLoader;

const styles = StyleSheet.create({
  loader: { alignItems: 'center', paddingVertical: s(14), gap: s(6) },
  loaderSmall: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: s(12), height: s(36) },
  rowSmall: { flexDirection: 'row', alignItems: 'flex-end', gap: s(5), height: s(18) },
  label: {
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: '#9A8BA9',
  },
  labelDark: { color: '#94A3B8' },
});
