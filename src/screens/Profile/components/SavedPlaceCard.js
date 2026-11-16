import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Pressable, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD = s(8);
const ACCENT_H = 3.5;
const PHOTO_H = vs(150);
const INFO_H = vs(88);
const CARD_H = ACCENT_H + PAD * 2 + PHOTO_H + INFO_H + 4;
const GAP = vs(16);

// Height of one row in the list, used for the photo parallax
export const SAVED_CARD_ITEM_HEIGHT = CARD_H + GAP;

const lerp = (progress, from, to) =>
  progress.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

// One saved place, in the app's card style: white, rounded, a coloured top strip and a thicker
// bottom edge. It fades up with a stagger, a light streak crosses the photo once, the photo drifts
// against the scroll, and the card slides away when the place is removed.
export const SavedPlaceCard = ({ item, index, scrollY, isDarkMode, onOpen, onRemove }) => {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = Math.min(index, 5) * 80;
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(sheen, {
      toValue: 1,
      duration: 1100,
      delay: delay + 450,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [enter, sheen, index]);

  const pressTo = value =>
    Animated.spring(press, {
      toValue: value,
      friction: 7,
      tension: 140,
      useNativeDriver: true,
    }).start();

  const handleRemove = () =>
    Animated.timing(exit, {
      toValue: 1,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onRemove(item.id));

  // Photo drifts slower than the card, which gives the depth
  const base = index * SAVED_CARD_ITEM_HEIGHT;
  const drift = scrollY.interpolate({
    inputRange: [base - vs(500), base + vs(500)],
    outputRange: [-PHOTO_H * 0.1, PHOTO_H * 0.1],
    extrapolate: 'clamp',
  });

  const opacity = Animated.multiply(lerp(enter, 0, 1), lerp(exit, 1, 0));
  const transform = [
    { translateY: lerp(enter, vs(24), 0) },
    { scale: lerp(press, 1, 0.97) },
    { translateY: lerp(press, 0, 2) },
    { translateX: lerp(exit, 0, -SCREEN_WIDTH * 0.25) },
    { scale: lerp(exit, 1, 0.94) },
  ];

  return (
    <Animated.View style={[styles.card, isDarkMode && styles.cardDark, { opacity, transform }]}>
      <LinearGradient
        colors={['#7C3AED', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />

      <Pressable
        testID={`saved-place-${item.slug}`}
        style={styles.inner}
        onPress={onOpen}
        onPressIn={() => pressTo(1)}
        onPressOut={() => pressTo(0)}>
        <View style={styles.photoWrap}>
          {item.photos[0] ? (
            <Animated.Image
              source={{ uri: item.photos[0] }}
              style={[styles.photo, { transform: [{ translateY: drift }] }]}
            />
          ) : (
            <LinearGradient
              colors={['#3B108F', '#7B2CFF', '#EE2A7B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, styles.photoEmpty]}>
              <Ionicons name="paw" size={ms(64)} color="rgba(255,255,255,0.28)" />
            </LinearGradient>
          )}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(15,7,29,0.25)', 'rgba(15,7,29,0)', 'rgba(15,7,29,0.5)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Light streak crossing the photo once */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sheen,
              {
                transform: [
                  { translateX: lerp(sheen, -s(120), SCREEN_WIDTH) },
                  { skewX: '-20deg' },
                ],
              },
            ]}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {!!item.rating && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={ms(11)} color="#F59E0B" />
              <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, isDarkMode && styles.textWhite]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={ms(13)} color="#7C3AED" />
            <Text style={[styles.location, isDarkMode && styles.mutedDark]} numberOfLines={1}>
              {item.location || item.city}
            </Text>
          </View>
          <View style={styles.pills}>
            <View style={[styles.pill, styles.pillCategory, isDarkMode && styles.pillCategoryDark]}>
              <Text
                style={[
                  styles.pillText,
                  styles.pillCategoryText,
                  isDarkMode && styles.pillCategoryTextDark,
                ]}>
                {item.categoryLabel || 'Place'}
              </Text>
            </View>
            {!!item.verifiedLabel && (
              <View
                style={[styles.pill, styles.pillVerified, isDarkMode && styles.pillVerifiedDark]}>
                <Ionicons
                  name="shield-checkmark"
                  size={ms(11)}
                  color={isDarkMode ? '#6EE7B7' : '#059669'}
                />
                <Text
                  style={[
                    styles.pillText,
                    styles.pillVerifiedText,
                    isDarkMode && styles.pillVerifiedTextDark,
                  ]}>
                  {item.verifiedLabel}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      <BouncyPressable
        testID={`unsave-place-${item.slug}`}
        accessibilityLabel="Remove from saved"
        style={styles.unsaveBtn}
        activeScale={0.85}
        onPress={handleRemove}>
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.unsaveGrad}>
          <Ionicons name="bookmark" size={ms(16)} color="#FFFFFF" />
        </LinearGradient>
      </BouncyPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    height: CARD_H,
    marginHorizontal: s(16),
    marginBottom: GAP,
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 5,
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: ACCENT_H, zIndex: 2 },
  inner: { flex: 1, padding: PAD, paddingTop: PAD + ACCENT_H },
  photoWrap: {
    height: PHOTO_H,
    borderRadius: s(16),
    overflow: 'hidden',
    backgroundColor: '#EDE9FE',
  },
  // Taller than its frame so it can drift without showing an edge
  photo: {
    position: 'absolute',
    top: -PHOTO_H * 0.12,
    left: 0,
    right: 0,
    height: PHOTO_H * 1.24,
    resizeMode: 'cover',
  },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: s(90) },
  ratingPill: {
    position: 'absolute',
    left: s(10),
    bottom: s(10),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(9),
    paddingVertical: vs(4),
    borderRadius: s(12),
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  ratingText: {
    marginLeft: s(4),
    fontSize: s(11.5),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  info: { height: INFO_H, paddingHorizontal: s(6), paddingTop: vs(9) },
  name: {
    fontSize: s(15.5),
    letterSpacing: -0.2,
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(3) },
  location: {
    flex: 1,
    marginLeft: s(4),
    fontSize: s(12),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.regular,
  },
  pills: { flexDirection: 'row', alignItems: 'center', marginTop: vs(8) },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    marginRight: s(6),
  },
  pillText: { fontSize: s(11), fontFamily: theme.typography.fontFamily.bold },
  pillCategory: { backgroundColor: '#EEF2FF' },
  pillCategoryDark: { backgroundColor: '#1E1B4B' },
  pillCategoryText: { color: '#4F46E5' },
  pillCategoryTextDark: { color: '#A5B4FC' },
  pillVerified: { backgroundColor: '#ECFDF5' },
  pillVerifiedDark: { backgroundColor: '#064E3B' },
  pillVerifiedText: { marginLeft: s(4), color: '#059669' },
  pillVerifiedTextDark: { color: '#6EE7B7' },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
  unsaveBtn: {
    position: 'absolute',
    top: PAD + ACCENT_H + s(10),
    right: PAD + s(10),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 3,
  },
  unsaveGrad: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#5B21B6',
  },
});
