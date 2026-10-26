import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const BouncyPressable = ({
  children,
  style,
  onPress,
  activeScale = 0.96,
  springTension = 150,
  springFriction = 6,
  disabled = false,
  containerStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = event => {
    props.onPressIn?.(event);
    Animated.spring(scaleAnim, {
      toValue: activeScale,
      tension: springTension,
      friction: springFriction,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = event => {
    props.onPressOut?.(event);
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 90,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const flatStyle = StyleSheet.flatten([containerStyle, style]) || {};
  const existingTransforms = Array.isArray(flatStyle.transform) ? flatStyle.transform : [];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        containerStyle,
        style,
        {
          transform: [...existingTransforms, { scale: scaleAnim }],
        },
      ]}
      {...props}>
      {children}
    </AnimatedPressable>
  );
};

export default BouncyPressable;
