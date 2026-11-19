import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';

// A short message that slides in at the top and hides itself. It is a plain view, not a native
// Modal, so it can show right after a modal closes without any iOS presentation clash.
export const SuccessToast = ({ message, onHide, duration = 3000 }) => {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) {
      return undefined;
    }
    Animated.spring(anim, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        onHide?.(),
      );
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, anim, onHide]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          top: Math.max(insets.top, s(12)) + s(8),
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-s(24), 0] }) },
          ],
        },
      ]}>
      <Feather name="check-circle" size={ms(18)} color="#FFFFFF" />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: s(20),
    right: s(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingVertical: s(12),
    paddingHorizontal: s(16),
    borderRadius: s(16),
    backgroundColor: '#16A34A',
    zIndex: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
  },
});

export default SuccessToast;
