import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { BouncyPressable } from '../common/BouncyPressable';
import { timeAgo, iconForType, readableType } from './format';

const { fontFamily } = theme.typography;

const BRAND_GRADIENT = ['#8A2DE2', '#EE2A7B'];

// Cards rise and fade in one after another (first few only, so long lists don't wait).
const useEntrance = index => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      delay: Math.min(index, 8) * 70,
      easing: Easing.out(Easing.back(1.1)),
      useNativeDriver: true,
    }).start();
  }, [progress, index]);
  // Tilts up from the back (rotateX) while rising, the same 3D entrance as the Home cards
  return {
    opacity: progress,
    transform: [
      { perspective: 900 },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) },
      { rotateX: progress.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '0deg'] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
    ],
  };
};

// Page paths inside a message ("/anjuna/pet-friendly-resorts") are picked out so long texts scan easily.
const PATH_PATTERN = /(\/[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)+)/gi;

const renderBody = (text, isDarkMode) =>
  text
    .split(PATH_PATTERN)
    .map((part, i) =>
      i % 2 === 1 ? (
        <Text key={i} style={[styles.path, isDarkMode && styles.pathDark]}>
          {part}
        </Text>
      ) : (
        part
      ),
    );

/**
 * One notification card in the app's raised-card style. Unread: gradient icon badge, a pink dot and
 * a lavender edge. Read: soft lavender badge, plain card.
 */
export const NotificationItem = ({ item, isDarkMode, onPress, testID, index = 0 }) => {
  const entrance = useEntrance(index);
  const unread = !item.isRead;
  const icon = iconForType(item.type);
  const label = readableType(item.type);

  return (
    <Animated.View style={entrance}>
      <BouncyPressable
        testID={testID}
        activeScale={0.98}
        onPress={() => onPress?.(item)}
        style={[
          styles.card,
          isDarkMode && styles.cardDark,
          unread && (isDarkMode ? styles.cardUnreadDark : styles.cardUnread),
        ]}>
        {unread ? (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={isDarkMode ? ['#24104A', '#1A0B36'] : ['#FFFFFF', '#F6F0FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardWash}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['#EE2A7B', '#7B2CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.accentBar}
            />
          </>
        ) : null}

        {unread ? (
          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconBox, styles.iconBoxUnread]}>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
              style={styles.iconGloss}
            />
            <Ionicons name={icon} size={ms(17)} color="#FFFFFF" />
          </LinearGradient>
        ) : (
          <View style={[styles.iconBox, isDarkMode ? styles.iconBoxReadDark : styles.iconBoxRead]}>
            <Ionicons name={icon} size={ms(17)} color={isDarkMode ? '#C4B5FD' : '#7B2CFF'} />
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.label, isDarkMode && styles.labelDark]} numberOfLines={1}>
              {label ? label.toUpperCase() : 'UPDATE'}
            </Text>
            <View style={[styles.timePill, isDarkMode && styles.timePillDark]}>
              <Text style={[styles.time, isDarkMode && styles.textMuted]}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          </View>
          {item.title ? (
            <Text
              style={[styles.title, isDarkMode && styles.textLight, !unread && styles.titleRead]}
              numberOfLines={2}>
              {item.title}
            </Text>
          ) : null}
          {item.body ? (
            <Text
              style={[
                styles.text,
                !item.title && styles.textMain,
                !item.title && !unread && styles.textMainRead,
                isDarkMode && styles.textMuted,
              ]}
              numberOfLines={2}>
              {renderBody(item.body, isDarkMode)}
            </Text>
          ) : null}
        </View>
      </BouncyPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(10),
    paddingVertical: s(10),
    paddingHorizontal: s(11),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD7CC',
    marginBottom: vs(8),
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardDark: { backgroundColor: '#190A32', borderColor: '#371569', borderBottomColor: '#230A47' },
  cardUnread: { borderColor: '#DCCBFF', borderBottomColor: '#C9B2F5' },
  cardUnreadDark: { borderColor: '#5B2FA8', borderBottomColor: '#3B1B73' },
  cardWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: s(15),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: s(12),
    bottom: s(12),
    width: s(3.5),
    borderTopRightRadius: s(4),
    borderBottomRightRadius: s(4),
  },
  iconBox: {
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnread: {
    shadowColor: '#EE2A7B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 7,
    elevation: 4,
  },
  iconGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    borderTopLeftRadius: s(12),
    borderTopRightRadius: s(12),
  },
  iconBoxRead: { backgroundColor: '#F3EEFF' },
  iconBoxReadDark: { backgroundColor: '#2A1250' },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flex: 1, fontSize: s(9.5), letterSpacing: 0.9, fontFamily: fontFamily.bold, color: '#7B2CFF' },
  labelDark: { color: '#C4B5FD' },
  timePill: {
    backgroundColor: '#F4F1EA',
    borderRadius: s(8),
    paddingHorizontal: s(7),
    paddingVertical: vs(2),
    marginRight: s(14),
  },
  timePillDark: { backgroundColor: '#2A1250' },
  time: { fontSize: s(10), fontFamily: fontFamily.semiBold, color: '#8B8497' },
  title: { fontSize: s(13), fontFamily: fontFamily.bold, color: '#1E1B4B', marginTop: vs(2) },
  titleRead: { fontFamily: fontFamily.semiBold },
  text: {
    fontSize: s(11.5),
    lineHeight: s(16),
    fontFamily: fontFamily.regular,
    color: '#5B5470',
    marginTop: vs(2),
  },
  textMain: { fontSize: s(12), fontFamily: fontFamily.medium, color: '#1E1B4B' },
  textMainRead: { fontFamily: fontFamily.regular, color: '#4B4563' },
  path: { fontFamily: fontFamily.bold, color: '#7B2CFF' },
  pathDark: { color: '#C4B5FD' },
  textLight: { color: '#F3E8FF' },
  textMuted: { color: '#A99BC4' },
});
