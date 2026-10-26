import React, { useRef } from 'react';
import { Pressable, Animated, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { useStore } from '../../../store';

export const AnimatedCategoryItem = ({ cat, isSelected, onPress }) => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.84,
        tension: 180,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        tension: 180,
        friction: 6,
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
      Animated.spring(rotateAnim, {
        toValue: 0,
        tension: 100,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-7deg'],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.categoryItemCenter}>
      <Animated.View
        style={[
          styles.categoryIconWrap,
          isDarkMode && styles.categoryIconWrapDark,
          {
            backgroundColor: isDarkMode ? '#1E0E38' : cat.bgColor,
            borderColor: isSelected ? cat.color : isDarkMode ? '#2E1654' : `${cat.color}30`,
            borderBottomColor: isSelected ? cat.color : isDarkMode ? '#180B2E' : `${cat.color}60`,
            shadowColor: cat.color,
            transform: [{ scale: scaleAnim }, { rotate: spin }],
          },
          isSelected && styles.categoryIconWrapSelected,
        ]}>
        <Ionicons name={cat.icon} size={ms(22)} color={cat.color} />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={[
          styles.categoryLabel,
          isDarkMode && styles.categoryLabelDark,
          isSelected && [styles.categoryLabelSelected, { color: isDarkMode ? '#A855F7' : cat.color }],
        ]}>
        {cat.name}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  categoryItemCenter: {
    alignItems: 'center',
  },
  categoryIconWrap: {
    width: s(48),
    height: s(48),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(6),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
    elevation: 4,
  },
  categoryIconWrapDark: {
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowOpacity: 0.25,
  },
  categoryIconWrapSelected: {
    borderWidth: 2,
    shadowOpacity: 0.35,
  },
  categoryLabel: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#373244',
    textAlign: 'center',
  },
  categoryLabelDark: {
    color: '#E2E8F0',
  },
  categoryLabelSelected: {
    fontFamily: theme.typography.fontFamily.bold,
  },
});
