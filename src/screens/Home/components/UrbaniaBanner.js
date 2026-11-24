import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from './BouncyPressable';
import { Enter } from '../../Community/Motion';

const DARK_RED = '#8A1C12';

export const URBANIA_FEATURES = [
  { icon: 'shield-checkmark-outline', label: 'Pet Friendly Driver' },
  { icon: 'paw-outline', label: 'No Breed Restriction' },
  { icon: 'people-outline', label: 'No Pet Limit' },
  { icon: 'heart-outline', label: 'Truly Pet First' },
];

const VAN_WIDTH = s(205);
const VAN_HEIGHT = (VAN_WIDTH * 458) / 1000;
const DASH = s(12);
const GAP = s(9);
const DASH_COUNT = Math.ceil(VAN_WIDTH / (DASH + GAP)) + 2;

const useLoop = (duration, { easing = Easing.linear, yoyo = false } = {}) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const to = (toValue, time = duration) =>
      Animated.timing(value, { toValue, duration: time, easing, useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence(yoyo ? [to(1), to(0)] : [to(1), to(0, 0)]));
    loop.start();
    return () => loop.stop();
  }, [value, duration, easing, yoyo]);
  return value;
};

const Road = () => {
  const move = useLoop(520);
  return (
    <View style={styles.road} pointerEvents="none" testID="urbania-road">
      <Animated.View
        style={[
          styles.dashes,
          {
            transform: [
              {
                translateX: move.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-(DASH + GAP), 0],
                }),
              },
            ],
          },
        ]}>
        {Array.from({ length: DASH_COUNT }, (_, index) => (
          <View key={index} style={styles.dash} />
        ))}
      </Animated.View>
    </View>
  );
};

const Streak = ({ top, width, duration, delay }) => {
  const run = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(run, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(run, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [run, duration, delay]);

  return (
    <Animated.View
      style={[
        styles.streak,
        {
          top,
          width,
          opacity: run.interpolate({
            inputRange: [0, 0.15, 0.8, 1],
            outputRange: [0, 0.7, 0.7, 0],
          }),
          transform: [
            {
              translateX: run.interpolate({
                inputRange: [0, 1],
                outputRange: [-(width + s(10)), VAN_WIDTH + s(10)],
              }),
            },
          ],
        },
      ]}
    />
  );
};

const STREAKS = [
  { top: '6%', width: s(30), duration: 850, delay: 0 },
  { top: '24%', width: s(18), duration: 650, delay: 300 },
  { top: '78%', width: s(34), duration: 950, delay: 120 },
  { top: '92%', width: s(20), duration: 700, delay: 450 },
];

const WindStreaks = () => (
  <View pointerEvents="none" style={styles.streaks} testID="urbania-wind">
    {STREAKS.map(streak => (
      <Streak key={streak.top} {...streak} />
    ))}
  </View>
);

const Rumble = ({ children }) => {
  const bump = useLoop(130, { easing: Easing.inOut(Easing.quad), yoyo: true });
  const rock = useLoop(1500, { easing: Easing.inOut(Easing.sin), yoyo: true });

  return (
    <Animated.View
      testID="urbania-van-motion"
      style={{
        transform: [
          { translateX: rock.interpolate({ inputRange: [0, 1], outputRange: [-s(1.5), s(1.5)] }) },
          { rotate: rock.interpolate({ inputRange: [0, 1], outputRange: ['-0.5deg', '0.5deg'] }) },
        ],
      }}>
      <Animated.View
        style={{
          transform: [
            { translateY: bump.interpolate({ inputRange: [0, 1], outputRange: [0, s(1.3)] }) },
          ],
        }}>
        {children}
      </Animated.View>
    </Animated.View>
  );
};

// The van driving in, with wind streaks and a moving road: the Home banner and the booking history
// page show the same scene
export const UrbaniaVanScene = ({ style }) => {
  const drive = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(drive, {
      toValue: 1,
      friction: 8,
      tension: 42,
      delay: 250,
      useNativeDriver: true,
    }).start();
  }, [drive]);

  return (
    <Animated.View
      pointerEvents="none"
      testID="urbania-van-scene"
      style={[
        styles.vanWrap,
        style,
        {
          opacity: drive,
          transform: [
            ...(style?.transform || []),
            { translateX: drive.interpolate({ inputRange: [0, 1], outputRange: [s(110), 0] }) },
          ],
        },
      ]}>
      <WindStreaks />
      <Rumble>
        <View style={styles.van}>
          <Image
            testID="urbania-van"
            source={theme.images.urbaniaVan}
            style={styles.vanImage}
            resizeMode="contain"
            accessibilityLabel="Travel With Tails and Rubicon pet-friendly Urbania van"
          />
        </View>
      </Rumble>
      <Road />
    </Animated.View>
  );
};

export const UrbaniaBanner = ({ onBookNow }) => {
  const pulse = useLoop(1100, { easing: Easing.inOut(Easing.sin), yoyo: true });
  const nudge = useLoop(650, { easing: Easing.inOut(Easing.quad), yoyo: true });
  const glowDrift = useLoop(3600, { easing: Easing.inOut(Easing.sin), yoyo: true });

  return (
    <View style={styles.card} testID="urbania-banner">
      <LinearGradient
        pointerEvents="none"
        colors={['#EA4033', '#D0291E', '#A31B13']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            transform: [
              {
                translateY: glowDrift.interpolate({ inputRange: [0, 1], outputRange: [0, s(10)] }),
              },
              { scale: glowDrift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            ],
          },
        ]}
      />
      <View pointerEvents="none" style={styles.glowSmall} />

      <View style={styles.top}>
        <View style={styles.topText}>
          <Enter index={0}>
            <View style={styles.pill}>
              <Ionicons name="paw" size={ms(10)} color="#D0291E" />
              <Text style={styles.pillText} numberOfLines={1}>
                NEWLY LAUNCHED
              </Text>
            </View>
          </Enter>
          <Enter index={1}>
            <Text style={styles.title}>Road trips are better together</Text>
          </Enter>
        </View>

        <UrbaniaVanScene />
      </View>

      <Enter index={2}>
        <Text style={styles.subtitle}>Pet-friendly Urbania from Gurugram</Text>
      </Enter>

      <View style={styles.features}>
        {URBANIA_FEATURES.map((feature, index) => (
          <Enter key={feature.label} index={3 + index}>
            <View style={styles.feature}>
              <Ionicons name={feature.icon} size={ms(12)} color="#FFE4D6" />
              <Text style={styles.featureText}>{feature.label}</Text>
            </View>
          </Enter>
        ))}
      </View>

      <Enter index={7}>
        <View style={styles.bottomRow}>
          <Animated.View
            style={[
              styles.offer,
              {
                transform: [
                  { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
                ],
              },
            ]}>
            <Ionicons name="pricetag" size={ms(12)} color={DARK_RED} />
            <Text style={styles.offerText}>10% off for pet parents</Text>
          </Animated.View>
          <BouncyPressable
            testID="urbania-book"
            activeScale={0.93}
            onPress={onBookNow}
            style={styles.book}>
            <Text style={styles.bookText}>Book Now</Text>
            <Animated.View
              style={{
                transform: [
                  { translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, s(3)] }) },
                ],
              }}>
              <Feather name="arrow-right" size={ms(14)} color={DARK_RED} />
            </Animated.View>
          </BouncyPressable>
        </View>
      </Enter>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s(15),
    marginBottom: s(12),
    padding: s(11),
    borderRadius: s(22),
    overflow: 'hidden',
    backgroundColor: '#D0291E',
    borderTopWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.4)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.18)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 3.5,
    borderBottomColor: 'rgba(90,10,6,0.7)',
    shadowColor: '#7A130B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 9,
  },
  glow: {
    position: 'absolute',
    top: -s(70),
    right: -s(60),
    width: s(210),
    height: s(210),
    borderRadius: s(105),
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  glowSmall: {
    position: 'absolute',
    bottom: -s(50),
    left: -s(40),
    width: s(140),
    height: s(140),
    borderRadius: s(70),
    backgroundColor: 'rgba(255,200,170,0.1)',
  },
  top: { flexDirection: 'row', alignItems: 'center' },
  topText: { flex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(4),
    paddingHorizontal: s(7),
    paddingVertical: s(3),
    borderRadius: s(12),
    backgroundColor: '#FFF3E8',
  },
  pillText: {
    fontSize: s(8.5),
    letterSpacing: 0.3,
    color: DARK_RED,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  title: {
    marginTop: s(6),
    fontSize: s(18),
    lineHeight: s(21),
    letterSpacing: -0.4,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  subtitle: {
    marginTop: s(2),
    fontSize: s(11.5),
    lineHeight: s(15),
    color: 'rgba(255,255,255,0.92)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  vanWrap: { width: VAN_WIDTH, marginLeft: s(2), marginRight: -s(8) },
  van: { width: VAN_WIDTH, height: VAN_HEIGHT },
  // An exact size, so the picture is never drawn at its natural (much larger) pixel size
  vanImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: VAN_WIDTH,
    height: VAN_HEIGHT,
    resizeMode: 'contain',
  },
  streaks: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: VAN_WIDTH,
    height: VAN_HEIGHT,
    overflow: 'hidden',
  },
  streak: {
    position: 'absolute',
    left: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  road: {
    height: 3,
    marginTop: s(1),
    overflow: 'hidden',
    borderRadius: 2,
  },
  dashes: { flexDirection: 'row', gap: GAP, width: '200%' },
  dash: { width: DASH, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.55)' },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(5),
    marginTop: s(8),
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: s(3.5),
    borderRadius: s(12),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featureText: {
    fontSize: s(10),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: s(8),
    marginTop: s(9),
  },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    paddingHorizontal: s(9),
    paddingVertical: s(5),
    borderRadius: s(13),
    backgroundColor: '#F8DF8F',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D9B85A',
  },
  offerText: {
    fontSize: s(11),
    color: DARK_RED,
    fontFamily: theme.typography.fontFamily.bold,
  },
  book: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(14),
    paddingVertical: s(5.5),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#E7C9C4',
    shadowColor: '#5C0C06',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bookText: {
    fontSize: s(12),
    color: DARK_RED,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
});
