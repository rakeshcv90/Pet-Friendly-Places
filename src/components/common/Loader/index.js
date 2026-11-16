import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { theme } from '../../../theme';
import { useStore } from '../../../store';
import { s } from 'react-native-size-matters';
import { PawLoader } from '../PawLoader';

/**
 * The loader card: the hopping paws and a title in a white card. Used by the modal and the inline
 * versions below, and directly for inline loading (a list footer, an empty state).
 */
export const LoaderCard = ({ label, subtitle, isDarkMode, style }) => (
  <View style={[styles.card, isDarkMode && styles.cardDark, style]}>
    <View style={styles.content}>
      <PawLoader
        label={label}
        isDarkMode={isDarkMode}
        style={styles.paws}
        labelStyle={styles.pawsLabel}
      />
      {subtitle ? (
        <Text numberOfLines={2} style={[styles.detail, isDarkMode && styles.detailDark]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  </View>
);

/**
 * Loader. Modal when `visible` (the paw loader in a card over a dimmed screen), inline when
 * `fullScreen` (the paw loader centred, `transparent` keeps the parent's background).
 * `message` is accepted as an alias of `title` (some screens pass it).
 */
export const Loader = ({
  visible = false,
  fullScreen = false,
  transparent = false,
  title,
  subtitle,
  message,
}) => {
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const heading = title ?? message ?? 'Please wait...';
  const detail = subtitle ?? (title || message ? '' : 'Connecting to server...');

  const card = <LoaderCard label={heading} subtitle={detail} isDarkMode={isDarkMode} />;

  if (visible) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View style={styles.overlay}>{card}</View>
      </Modal>
    );
  }

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenContainer,
          isDarkMode && styles.fullScreenContainerDark,
          transparent && styles.fullScreenTransparent,
        ]}>
        {card}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 7, 29, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  card: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: s(124),
    height: s(124),
    borderRadius: s(62),
    paddingHorizontal: s(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#4C1D95' },
  paws: { paddingVertical: 0 },
  pawsLabel: { fontSize: s(10) },
  content: { alignItems: 'center', justifyContent: 'center' },
  detail: {
    marginTop: s(2),
    textAlign: 'center',
    fontSize: s(9),
    color: '#94A3B8',
    fontFamily: theme.typography.fontFamily.regular,
  },
  detailDark: { color: '#A78BFA' },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#FAF8F2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(24),
  },
  fullScreenContainerDark: {
    backgroundColor: '#0F071D',
  },
  fullScreenTransparent: {
    backgroundColor: 'transparent',
  },
});
