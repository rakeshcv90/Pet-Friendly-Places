import React, { useRef } from 'react';
import { Pressable, Animated, Text, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';

export const AnimatedRehomeOption = ({
  icon,
  label,
  tag,
  tagColor,
  tagBg,
  gradientColors,
  buttonStyle,
  labelColor,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        tension: 240,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 2,
        tension: 240,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        tension: 100,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.fullWidth}>
      <Animated.View
        style={[
          styles.cardBase,
          buttonStyle,
          {
            transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          },
        ]}>
        {/* Glowing Gradient Circle for the Icon */}
        <View style={styles.iconCircleWrapper}>
          <LinearGradient
            colors={gradientColors || ['#7B2CFF', '#9333EA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}>
            <Feather name={icon} size={ms(15)} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={[styles.label, { color: labelColor || '#FFFFFF' }]} numberOfLines={1}>
          {label}
        </Text>

        {/* Tag Pill */}
        {tag ? (
          <View style={[styles.tagPill, { backgroundColor: tagBg }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  cardBase: {
    width: '100%',
    borderRadius: s(16),
    paddingVertical: s(11),
    paddingHorizontal: s(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWrapper: {
    marginBottom: s(6),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  iconCircle: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  label: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: s(4),
  },
  tagPill: {
    paddingHorizontal: s(7),
    paddingVertical: s(2),
    borderRadius: s(6),
  },
  tagText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
});
