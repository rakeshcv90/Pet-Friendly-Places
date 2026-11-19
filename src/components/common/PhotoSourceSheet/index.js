import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { BouncyPressable } from '../BouncyPressable';

// Bottom sheet for choosing where a photo comes from. The caller decides what each choice does;
// the sheet only closes itself and reports the choice.
const OPTIONS = [
  {
    key: 'camera',
    icon: 'camera',
    title: 'Take a photo',
    subtitle: 'Use your camera',
    colors: ['#7B2CFF', '#3B108F'],
  },
  {
    key: 'gallery',
    icon: 'image',
    title: 'Choose from gallery',
    subtitle: 'Pick an existing photo',
    colors: ['#EE2A7B', '#B4165A'],
  },
];

export const PhotoSourceSheet = ({
  visible,
  onClose,
  onCamera,
  onGallery,
  onRemove,
  title = 'Add a photo',
  isDarkMode = false,
}) => {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.spring(slide, { toValue: 1, friction: 9, tension: 70, useNativeDriver: true }).start();
    }
  }, [visible, slide]);

  const choose = handler => () => {
    onClose?.();
    // Let the sheet finish closing first: iOS cannot present the camera or picker over a modal
    // that is still dismissing
    setTimeout(() => handler?.(), 350);
  };

  const handlers = { camera: onCamera, gallery: onGallery };

  if (!visible) {
    return null;
  }

  // A plain overlay, not a native Modal. It is shown inside the Add Pet modal, and a modal opened
  // inside a modal can leave iOS on a black screen once the outer one closes.
  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.rootInner}>
        <Pressable style={styles.backdrop} onPress={onClose} testID="photo-sheet-backdrop" />

        <Animated.View
          style={[
            styles.sheet,
            isDarkMode && styles.sheetDark,
            { paddingBottom: Math.max(insets.bottom, s(16)) + s(8) },
            {
              transform: [
                {
                  translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [s(260), 0] }),
                },
              ],
            },
          ]}>
          <View style={[styles.handle, isDarkMode && styles.handleDark]} />

          <Text style={[styles.title, isDarkMode && styles.titleDark]}>{title}</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Choose where the photo comes from
          </Text>

          <View style={styles.options}>
            {OPTIONS.map(option => (
              <BouncyPressable
                key={option.key}
                style={[styles.option, isDarkMode && styles.optionDark]}
                activeScale={0.97}
                onPress={choose(handlers[option.key])}
                testID={`photo-source-${option.key}`}>
                <LinearGradient
                  colors={option.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionIcon}>
                  <Feather name={option.icon} size={ms(22)} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, isDarkMode && styles.titleDark]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionSub, isDarkMode && styles.subtitleDark]}>
                    {option.subtitle}
                  </Text>
                </View>
                <Feather name="chevron-right" size={ms(18)} color="#94A3B8" />
              </BouncyPressable>
            ))}

            {onRemove ? (
              <BouncyPressable
                style={[styles.option, isDarkMode && styles.optionDark]}
                activeScale={0.97}
                onPress={choose(onRemove)}>
                <View style={[styles.optionIcon, styles.removeIcon]}>
                  <Feather name="trash-2" size={ms(20)} color="#DC2626" />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, styles.removeTitle]}>Remove photo</Text>
                </View>
              </BouncyPressable>
            ) : null}
          </View>

          <BouncyPressable
            style={[styles.cancel, isDarkMode && styles.cancelDark]}
            activeScale={0.97}
            onPress={onClose}>
            <Text style={[styles.cancelText, isDarkMode && styles.titleDark]}>Cancel</Text>
          </BouncyPressable>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
  },
  rootInner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 35, 0.55)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(28),
    borderTopRightRadius: s(28),
    paddingHorizontal: s(20),
    paddingTop: s(10),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetDark: {
    backgroundColor: '#1A1230',
  },
  handle: {
    alignSelf: 'center',
    width: s(40),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: '#E2D9F3',
    marginBottom: s(16),
  },
  handleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: s(19),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B5C85',
    textAlign: 'center',
    marginTop: s(4),
    marginBottom: s(18),
  },
  subtitleDark: {
    color: '#A99CC4',
  },
  options: {
    gap: s(10),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(12),
    borderRadius: s(18),
    backgroundColor: '#F7F3FF',
    borderWidth: 1,
    borderColor: 'rgba(123, 44, 255, 0.12)',
  },
  optionDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionIcon: {
    width: s(46),
    height: s(46),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(14),
  },
  removeIcon: {
    backgroundColor: '#FEE2E2',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
  },
  removeTitle: {
    color: '#DC2626',
  },
  optionSub: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B5C85',
    marginTop: s(2),
  },
  cancel: {
    marginTop: s(14),
    height: s(48),
    borderRadius: s(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE8FB',
  },
  cancelDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
  },
});

export default PhotoSourceSheet;
