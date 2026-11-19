import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { Bob, Enter } from '../../Community/Motion';

const DEPTH = s(4);

// A 3D action button: a solid "depth" layer sits under a glossy face. Pressing tilts the face
// towards you and sinks it into the depth; letting go springs it back. `float` makes it bob gently.
export const ActionTile = ({
  testID,
  label,
  icon,
  colors,
  depthColor,
  onPress,
  index = 0,
  float = false,
}) => {
  const press = useRef(new Animated.Value(0)).current;

  const spring = toValue =>
    Animated.spring(press, { toValue, friction: 6, tension: 220, useNativeDriver: true }).start();

  const face = (
    <Animated.View
      style={[
        styles.face,
        {
          transform: [
            { perspective: 700 },
            { rotateX: press.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '12deg'] }) },
            { translateY: press.interpolate({ inputRange: [0, 1], outputRange: [0, DEPTH - 1] }) },
            { scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
          ],
        },
      ]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}>
        <View pointerEvents="none" style={styles.gloss} />
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={ms(14)} color="#FFFFFF" />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <Enter index={index} style={styles.cell}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => spring(1)}
        onPressOut={() => spring(0)}
        onPress={onPress}>
        <View style={styles.wrap}>
          <View style={[styles.depth, { backgroundColor: depthColor }]} />
          {float ? (
            <Bob distance={s(2)} duration={1900}>
              {face}
            </Bob>
          ) : (
            face
          )}
        </View>
      </Pressable>
    </Enter>
  );
};

const styles = StyleSheet.create({
  cell: { flex: 1 },
  wrap: { paddingBottom: DEPTH },
  depth: {
    position: 'absolute',
    top: DEPTH,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: s(15),
  },
  face: {
    borderRadius: s(15),
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(5),
    paddingHorizontal: s(4),
    paddingVertical: vs(9),
    borderRadius: s(15),
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: s(15),
    borderTopRightRadius: s(15),
  },
  iconCircle: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  label: {
    minHeight: s(26),
    fontSize: s(11),
    lineHeight: s(13),
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },
});
