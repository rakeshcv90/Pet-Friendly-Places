import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';
const GUTTER = s(15);
const PAW_COLORS = [PURPLE, '#FF4FB8', '#FF9F1C'];

// Grey placeholder with a light streak sweeping across it
export const SkeletonBlock = ({ style, isDarkMode }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const streak = isDarkMode ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.7)';

  return (
    <View
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={[styles.block, isDarkMode && styles.blockDark, style]}>
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width, width],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', streak, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
};

// Three paw prints that hop one after another
export const PawLoader = ({ label, isDarkMode }) => {
  const hops = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = hops.map((value, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(value, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 360,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((hops.length - 1 - i) * 180),
        ]),
      ),
    );
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [hops]);

  return (
    <View style={styles.pawLoader}>
      <View style={styles.pawRow}>
        {hops.map((value, i) => (
          <Animated.View
            key={PAW_COLORS[i]}
            style={{
              opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -s(10)] }) },
                { rotate: i % 2 === 0 ? '-18deg' : '18deg' },
              ],
            }}>
            <Ionicons name="paw" size={ms(22)} color={PAW_COLORS[i]} />
          </Animated.View>
        ))}
      </View>
      {label ? (
        <Text style={[styles.pawLabel, isDarkMode && styles.textMutedDark]}>{label}</Text>
      ) : null}
    </View>
  );
};

// Friendly failure state with a wobbling pup and a retry button
export const ErrorState = ({ message = 'Could not load communities', onRetry, isDarkMode }) => {
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: -1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(wobble, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wobble]);

  return (
    <View style={styles.errorState}>
      <Animated.Text
        style={[
          styles.errorEmoji,
          {
            transform: [
              {
                rotate: wobble.interpolate({
                  inputRange: [-1, 1],
                  outputRange: ['-10deg', '10deg'],
                }),
              },
            ],
          },
        ]}>
        🐶
      </Animated.Text>
      <Text style={[styles.errorTitle, isDarkMode && styles.textLight]}>{message}</Text>
      <Text style={[styles.errorText, isDarkMode && styles.textMutedDark]}>
        Check your connection and try again.
      </Text>
      <BouncyPressable activeScale={0.94} onPress={onRetry} style={styles.retryWrap}>
        <LinearGradient
          colors={[DEEP_PURPLE, PURPLE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.retryBtn}>
          <Ionicons name="refresh" size={ms(13)} color="#FFFFFF" />
          <Text style={styles.retryText}>Try again</Text>
        </LinearGradient>
      </BouncyPressable>
    </View>
  );
};

// Placeholder shaped like a topic or city card
export const SkeletonCard = ({ width, isDarkMode }) => (
  <View style={[styles.skelCard, { width }, isDarkMode && styles.skelCardDark]}>
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelTile} />
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelTitle} />
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelLine} />
    <SkeletonBlock isDarkMode={isDarkMode} style={[styles.skelLine, styles.skelLineShort]} />
    <View style={styles.skelPills}>
      <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelPill} />
      <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelPill} />
    </View>
  </View>
);

export const SkeletonRow = ({ count = 3, width, isDarkMode }) => (
  <View style={styles.skelRow}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} width={width} isDarkMode={isDarkMode} />
    ))}
  </View>
);

// Placeholder shaped like the featured thread card
export const SkeletonFeatured = ({ isDarkMode }) => (
  <View style={[styles.skelCard, styles.skelFeatured, isDarkMode && styles.skelCardDark]}>
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelFeaturedHeader} />
    <View style={styles.skelFeaturedBody}>
      <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelTitle} />
      <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelLine} />
      <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelLine} />
      <SkeletonBlock isDarkMode={isDarkMode} style={[styles.skelLine, styles.skelLineShort]} />
    </View>
  </View>
);

// Placeholder shaped like a post row
export const SkeletonPost = ({ isDarkMode }) => (
  <View style={[styles.skelCard, styles.skelPost, isDarkMode && styles.skelCardDark]}>
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelBadge} />
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelLine} />
    <SkeletonBlock isDarkMode={isDarkMode} style={[styles.skelLine, styles.skelLineShort]} />
    <SkeletonBlock isDarkMode={isDarkMode} style={styles.skelAuthor} />
  </View>
);

const styles = StyleSheet.create({
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },

  block: { backgroundColor: '#EDE8F8', borderRadius: s(6), overflow: 'hidden' },
  blockDark: { backgroundColor: '#2E1654' },

  pawLoader: { alignItems: 'center', paddingVertical: s(14), gap: s(6) },
  pawRow: { flexDirection: 'row', alignItems: 'flex-end', gap: s(12), height: s(36) },
  pawLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: '#9A8BA9',
  },

  errorState: { alignItems: 'center', paddingVertical: s(22), paddingHorizontal: s(24), gap: s(4) },
  errorEmoji: { fontSize: s(40), marginBottom: s(4) },
  errorTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(14),
    color: DEEP_PURPLE,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11.5),
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: s(8),
  },
  retryWrap: {
    borderRadius: s(18),
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    borderRadius: s(18),
    paddingHorizontal: s(16),
    paddingVertical: s(8),
  },
  retryText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(11.5),
    color: '#FFFFFF',
  },

  skelRow: { flexDirection: 'row', gap: s(10), paddingHorizontal: GUTTER, overflow: 'hidden' },
  skelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#F0EBF8',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    padding: s(10),
    gap: s(7),
  },
  skelCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    borderBottomColor: '#180B2E',
  },
  skelTile: { width: s(34), height: s(34), borderRadius: s(11) },
  skelTitle: { width: '70%', height: s(12) },
  skelLine: { width: '100%', height: s(9) },
  skelLineShort: { width: '60%' },
  skelPills: { flexDirection: 'row', gap: s(5), marginTop: s(2) },
  skelPill: { width: s(58), height: s(16), borderRadius: s(8) },

  skelFeatured: {
    marginHorizontal: GUTTER,
    marginTop: s(10),
    padding: 0,
    borderRadius: s(22),
    overflow: 'hidden',
    gap: 0,
  },
  skelFeaturedHeader: { height: s(62), borderRadius: 0 },
  skelFeaturedBody: { padding: s(12), gap: s(8) },

  skelPost: { gap: s(8), padding: s(12) },
  skelBadge: { width: s(60), height: s(14), borderRadius: s(8) },
  skelAuthor: { width: '45%', height: s(11), marginTop: s(2) },
});
