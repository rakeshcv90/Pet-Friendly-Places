import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Modal } from 'react-native';
import { theme } from '../../../theme';
import { s } from 'react-native-size-matters';

export const Loader = ({ visible = false, fullScreen = false }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (visible || fullScreen) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(opacityValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 0.7,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ])
      ).start();
    }
  }, [visible, fullScreen, scaleValue, opacityValue]);

  const LoaderContent = (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <Animated.Image 
        source={require('../../../assets/images/logo.jpg')}
        style={[
          styles.logo,
          { 
            transform: [{ scale: scaleValue }],
            opacity: opacityValue
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );

  if (visible) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          {LoaderContent}
        </View>
      </Modal>
    );
  }

  if (fullScreen) {
    return LoaderContent;
  }

  return null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(247, 241, 221, 0.85)', // Cream background with opacity matching theme
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  logo: {
    width: s(200),
    height: s(200),
  },
});
