import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  View,
  Text,
  Animated,
  Easing,
  LayoutAnimation,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useFollowingPets, useUnfollowPet } from '../../hooks/useFollowing';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { FastImage } from '../../components/common/FastImage';
import { LoaderCard } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from '../Home/components';

const REMOVE_ANIMATION = {
  duration: 280,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

const capitalize = text => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

export const followerLabel = count => `${count} ${count === 1 ? 'follower' : 'followers'}`;

// "Dog · Golden Retriever · 1 follower"
export const petSummaryLine = pet =>
  [capitalize(pet.species), pet.breed, followerLabel(pet.followerCount)]
    .filter(Boolean)
    .join(' · ');

// Created once: a new function on every render would restart the loops each time the screen updates
const EASE_SINE = Easing.inOut(Easing.sin);
const EASE_LINEAR = Easing.linear;

// A value that loops 0 -> 1 -> 0 (or 0 -> 1 and again, for a steady spin) for as long as the screen
// is open. Does not move at all when the phone's "reduce motion" setting is on.
const useLoop = ({ duration, easing = EASE_SINE, steady = false }) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop = null;
    let cancelled = false;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled?.())
      .then(reduced => {
        if (cancelled || reduced) {
          return;
        }
        const forward = Animated.timing(value, {
          toValue: 1,
          duration,
          easing,
          useNativeDriver: true,
        });
        const back = Animated.timing(value, {
          toValue: 0,
          duration,
          easing,
          useNativeDriver: true,
        });
        loop = Animated.loop(steady ? forward : Animated.sequence([forward, back]));
        loop.start();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [value, duration, easing, steady]);
  return value;
};

// A number that counts up to its value, and again whenever the value changes (a pet unfollowed).
// Steps on a plain interval, easing out so it settles gently on the final number.
const COUNT_STEPS = 24;
const COUNT_STEP_MS = 38;

export const CountUp = ({ value, style, testID }) => {
  const numeric = typeof value === 'number';
  const [shown, setShown] = useState(numeric ? 0 : value);
  useEffect(() => {
    if (!numeric) {
      setShown(value);
      return undefined;
    }
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      const t = Math.min(1, step / COUNT_STEPS);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t >= 1) {
        clearInterval(timer);
      }
    }, COUNT_STEP_MS);
    return () => clearInterval(timer);
  }, [value, numeric]);
  return (
    <Text style={style} testID={testID}>
      {shown}
    </Text>
  );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Nov 2026", or '' when the follow date is missing or not a date
export const followedSince = value => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

// Cards slide up one after another when the list appears; later cards (scrolled in afterwards)
// appear at once
const STAGGER_MS = 70;
const MAX_STAGGER = 8;

const FollowedPetCard = React.memo(
  ({ pet, index, pulse, spin, shine, isDarkMode, busy, onView, onUnfollow }) => {
    const enter = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.timing(enter, {
        toValue: 1,
        duration: 420,
        delay: Math.min(index, MAX_STAGGER) * STAGGER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [enter, index]);
    const since = followedSince(pet.followedAt);

    return (
      <Animated.View
        testID={`following-card-${pet.id}`}
        style={[
          styles.card,
          isDarkMode && styles.cardDark,
          {
            opacity: enter,
            transform: [
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}>
        <View style={styles.cardTop}>
          <View style={styles.ring}>
            {/* The gradient turns slowly behind the photo, so the ring looks alive */}
            <Animated.View
              testID={`following-ring-${pet.id}`}
              style={[
                styles.ringSpin,
                {
                  transform: [
                    {
                      rotate: spin.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}>
              <LinearGradient
                colors={['#7B2CFF', '#C026D3', '#FF4FB8', '#FBBF24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ringGradient}
              />
            </Animated.View>
            <View style={[styles.avatar, isDarkMode && styles.avatarDark]}>
              {pet.photo ? (
                <FastImage
                  source={{ uri: resolveImageUrl(pet.photo) }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="paw" size={ms(24)} color="#7B2CFF" />
              )}
            </View>
          </View>
          <View style={styles.cardText}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.name, isDarkMode && styles.textWhite]}
                numberOfLines={1}
                testID={`following-name-${pet.id}`}>
                {pet.petName}
              </Text>
              {pet.level > 0 ? (
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.level}
                  testID={`following-level-${pet.id}`}>
                  <Animated.View
                    style={{
                      transform: [
                        {
                          scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }),
                        },
                      ],
                    }}>
                    <Ionicons name="star" size={ms(9)} color="#FFFFFF" />
                  </Animated.View>
                  <Text style={styles.levelText}>{`Lv ${pet.level}`}</Text>
                </LinearGradient>
              ) : null}
            </View>
            <Text style={[styles.meta, isDarkMode && styles.mutedDark]} numberOfLines={1}>
              {petSummaryLine(pet)}
            </Text>
            {since ? (
              <View style={styles.sinceRow}>
                <Animated.View
                  style={{
                    transform: [
                      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
                    ],
                  }}>
                  <Ionicons name="heart" size={ms(11)} color="#EC4899" />
                </Animated.View>
                <Text
                  style={[styles.since, isDarkMode && styles.mutedDark]}
                  testID={`following-since-${pet.id}`}>
                  {`Following since ${since}`}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.actions}>
          <BouncyPressable
            testID={`following-view-${pet.id}`}
            activeScale={0.96}
            disabled={!pet.slug}
            onPress={() => onView(pet)}
            style={[styles.btnWrap, !pet.slug && styles.disabled]}>
            <LinearGradient
              colors={['#7B2CFF', '#C026D3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.btn, styles.clip]}>
              <Ionicons name="paw-outline" size={ms(15)} color="#FFFFFF" />
              <Text style={styles.viewText}>View</Text>
              {/* A soft light glides across the button now and then */}
              <Animated.View
                pointerEvents="none"
                testID={`following-shine-${pet.id}`}
                style={[
                  styles.shine,
                  {
                    transform: [
                      {
                        translateX: shine.interpolate({
                          inputRange: [0, 0.45, 1],
                          outputRange: [-140, 200, 200],
                        }),
                      },
                      { skewX: '-20deg' },
                    ],
                  },
                ]}
              />
            </LinearGradient>
          </BouncyPressable>
          <BouncyPressable
            testID={`following-unfollow-${pet.id}`}
            activeScale={0.96}
            disabled={busy}
            onPress={() => onUnfollow(pet)}
            style={[
              styles.btnWrap,
              styles.btn,
              styles.unfollowBtn,
              isDarkMode && styles.unfollowBtnDark,
              busy && styles.disabled,
            ]}>
            {busy ? (
              <ActivityIndicator size="small" color="#DC2626" testID={`following-busy-${pet.id}`} />
            ) : (
              <>
                <Ionicons name="heart-dislike-outline" size={ms(15)} color="#DC2626" />
                <Text style={styles.unfollowText}>Unfollow</Text>
              </>
            )}
          </BouncyPressable>
        </View>
      </Animated.View>
    );
  },
);

const keyOfPet = item => String(item.id);

// The banner above the list: how big the pack is, with a slowly drifting glow
const PackBanner = ({ pets, scrollY }) => {
  const intro = useRef(new Animated.Value(0)).current;
  const drift = useLoop({ duration: 4200 });
  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  const followers = pets.reduce((sum, pet) => sum + pet.followerCount, 0);
  const topLevel = pets.reduce((max, pet) => Math.max(max, pet.level), 0);
  const tiles = [
    { value: pets.length, label: 'Following' },
    { value: followers, label: followers === 1 ? 'Follower' : 'Followers' },
    { value: topLevel || '-', label: 'Top level' },
  ];
  // Little paws that float up through the banner, each at its own pace
  const paws = [
    { left: '58%', size: 13, from: 18, to: -22, opacity: 0.35 },
    { left: '74%', size: 18, from: 30, to: -30, opacity: 0.25 },
    { left: '88%', size: 11, from: 12, to: -16, opacity: 0.4 },
  ];

  return (
    <Animated.View
      testID="following-banner"
      style={{
        opacity: intro,
        transform: [
          { translateY: intro.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) },
        ],
      }}>
      {/* Scrolling: the banner moves a little slower than the list and fades; pulling down grows it */}
      <Animated.View
        style={{
          opacity: scrollY.interpolate({
            inputRange: [0, 240],
            outputRange: [1, 0.35],
            extrapolate: 'clamp',
          }),
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, 240],
                outputRange: [0, 70],
                extrapolate: 'clamp',
              }),
            },
            {
              scale: scrollY.interpolate({
                inputRange: [-140, 0],
                outputRange: [1.1, 1],
                extrapolate: 'clamp',
              }),
            },
          ],
        }}>
        <LinearGradient
          colors={['#3B108F', '#7B2CFF', '#C026D3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}>
          <Animated.View
            style={[
              styles.bannerGlow,
              {
                transform: [
                  { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-10, 14] }) },
                  { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [6, -10] }) },
                  { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) },
                ],
              },
            ]}
          />
          {paws.map(paw => (
            <Animated.View
              key={paw.left}
              pointerEvents="none"
              style={[
                styles.bannerPaw,
                {
                  left: paw.left,
                  opacity: drift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [paw.opacity, paw.opacity * 0.4],
                  }),
                  transform: [
                    {
                      translateY: drift.interpolate({
                        inputRange: [0, 1],
                        outputRange: [paw.from, paw.to],
                      }),
                    },
                    {
                      rotate: drift.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-14deg', '14deg'],
                      }),
                    },
                  ],
                },
              ]}>
              <Ionicons name="paw" size={ms(paw.size)} color="#FFFFFF" />
            </Animated.View>
          ))}
          <View style={styles.bannerTop}>
            <View style={styles.bannerIcon}>
              <Ionicons name="people" size={ms(20)} color="#FFFFFF" />
            </View>
            <View style={styles.bannerTitles}>
              <Text style={styles.bannerOverline}>YOUR PACK</Text>
              <Text style={styles.bannerTitle}>Pets you follow</Text>
            </View>
          </View>
          <View style={styles.bannerStats}>
            {tiles.map((tile, index) => (
              <View
                key={tile.label}
                style={[styles.bannerStat, index > 0 && styles.bannerStatDivider]}>
                <CountUp
                  value={tile.value}
                  style={styles.bannerStatValue}
                  testID={`following-stat-${index}`}
                />
                <Text style={styles.bannerStatLabel}>{tile.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

// The pets the signed-in user follows (Profile > Following), from GET /me/following. View opens the
// pet's public profile by its slug; Unfollow sends DELETE /pets/{id}/follow and, once the server
// agrees, takes the pet out of the list.
export const FollowingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const { data, isLoading, isError, refetch, isRefetching } = useFollowingPets();
  const unfollow = useUnfollowPet();
  const scrollY = useRef(new Animated.Value(0)).current;
  // One shared beat and one shared spin drive every card, instead of a loop per card
  const pulse = useLoop({ duration: 1100 });
  const spin = useLoop({ duration: 9000, easing: EASE_LINEAR, steady: true });
  const shine = useLoop({ duration: 3200, easing: EASE_LINEAR, steady: true });
  const pets = data || [];
  // A failed unfollow is said once, in plain words, and the pet stays in the list
  const [failedName, setFailedName] = useState('');
  useEffect(() => {
    if (!failedName) {
      return undefined;
    }
    const timer = setTimeout(() => setFailedName(''), 4500);
    return () => clearTimeout(timer);
  }, [failedName]);

  const handleView = useCallback(
    pet => navigation.navigate('PublicPetProfileScreen', { slug: pet.slug, entry: pet }),
    [navigation],
  );
  const handleUnfollow = useCallback(
    pet => {
      setFailedName('');
      unfollow.mutate(pet.id, {
        // The card fades out and the ones below slide up, instead of vanishing
        onSuccess: () => LayoutAnimation.configureNext(REMOVE_ANIMATION),
        onError: () => setFailedName(pet.petName),
      });
    },
    [unfollow],
  );
  const busyId = unfollow.isPending ? unfollow.variables : null;
  const renderPet = useCallback(
    ({ item, index }) => (
      <FollowedPetCard
        pet={item}
        index={index}
        pulse={pulse}
        spin={spin}
        shine={shine}
        isDarkMode={isDarkMode}
        busy={String(busyId) === String(item.id)}
        onView={handleView}
        onUnfollow={handleUnfollow}
      />
    ),
    [pulse, spin, shine, isDarkMode, busyId, handleView, handleUnfollow],
  );

  const header = (
    <View>
      {failedName ? (
        <View style={styles.errorBar} testID="following-error">
          <Ionicons name="alert-circle" size={ms(16)} color="#B91C1C" />
          <Text
            style={styles.errorText}>{`Couldn't unfollow ${failedName}. Please try again.`}</Text>
        </View>
      ) : null}
      {pets.length > 0 ? (
        <>
          <PackBanner pets={pets} scrollY={scrollY} />
          <Text
            style={[styles.resultLine, isDarkMode && styles.mutedDark]}
            testID="following-count">
            {`Following ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'}`}
          </Text>
        </>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />
      <ScreenHeader
        title="Following"
        subtitle="PETS YOU FOLLOW"
        onBack={() => navigation.goBack()}
        testID="following-back-btn"
      />

      {isLoading ? (
        <LoaderCard
          style={styles.center}
          label="Loading the pets you follow…"
          isDarkMode={isDarkMode}
        />
      ) : (
        <Animated.FlatList
          data={pets}
          keyExtractor={keyOfPet}
          renderItem={renderPet}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingBottom: insets.bottom + vs(36) }}
          ListEmptyComponent={
            <View
              testID={isError ? 'following-error-state' : 'following-empty'}
              style={[styles.emptyCard, isDarkMode && styles.emptyCardDark]}>
              <Animated.View
                style={{
                  transform: [
                    { translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) },
                  ],
                }}>
                <LinearGradient
                  colors={isError ? ['#94A3B8', '#64748B'] : ['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyIcon}>
                  <Ionicons
                    name={isError ? 'cloud-offline-outline' : 'people-outline'}
                    size={ms(30)}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </Animated.View>
              <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
                {isError ? 'Something went wrong' : "You're not following any pets yet"}
              </Text>
              <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                {isError
                  ? 'Could not load the pets you follow.'
                  : 'Follow pets on the leaderboard to keep up with their adventures.'}
              </Text>
              <BouncyPressable
                testID={isError ? 'following-retry' : 'following-explore'}
                activeScale={0.96}
                style={styles.emptyCta}
                onPress={isError ? refetch : () => navigation.navigate('LeaderboardScreen')}>
                <LinearGradient
                  colors={['#7B2CFF', '#3B108F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyCtaGrad}>
                  <Ionicons
                    name={isError ? 'refresh' : 'trophy-outline'}
                    size={ms(16)}
                    color="#FFFFFF"
                  />
                  <Text style={styles.emptyCtaText}>
                    {isError ? 'Try again' : 'Open leaderboard'}
                  </Text>
                </LinearGradient>
              </BouncyPressable>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  center: { marginTop: vs(40) },
  headerSpacer: { height: vs(8) },
  resultLine: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    color: '#64748B',
    marginHorizontal: s(18),
    marginTop: vs(8),
    marginBottom: vs(10),
  },
  mutedDark: { color: '#A5B4C7' },
  textWhite: { color: '#FFFFFF' },
  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginHorizontal: s(16),
    marginTop: vs(8),
    padding: s(12),
    borderRadius: s(14),
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    color: '#991B1B',
  },
  banner: {
    marginHorizontal: s(16),
    marginTop: vs(4),
    borderRadius: s(24),
    padding: s(18),
    overflow: 'hidden',
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerGlow: {
    position: 'absolute',
    top: -s(40),
    right: -s(30),
    width: s(150),
    height: s(150),
    borderRadius: s(75),
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  bannerPaw: { position: 'absolute', top: s(22) },
  bannerTop: { flexDirection: 'row', alignItems: 'center' },
  bannerIcon: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitles: { marginLeft: s(12), flex: 1 },
  bannerOverline: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(10),
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.72)',
  },
  bannerTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(19),
    letterSpacing: -0.3,
    color: '#FFFFFF',
    marginTop: s(2),
  },
  bannerStats: {
    flexDirection: 'row',
    marginTop: vs(16),
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: s(16),
    paddingVertical: vs(10),
  },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.22)' },
  bannerStatValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(20),
    color: '#FFFFFF',
  },
  bannerStatLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    color: 'rgba(255,255,255,0.75)',
    marginTop: s(1),
  },
  card: {
    marginHorizontal: s(16),
    marginBottom: vs(12),
    padding: s(14),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1E0E38' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  ring: {
    width: s(68),
    height: s(68),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSpin: { position: 'absolute', width: s(68), height: s(68) },
  ringGradient: { width: s(68), height: s(68), borderRadius: s(34) },
  avatar: {
    width: s(61),
    height: s(61),
    borderRadius: s(30.5),
    backgroundColor: '#F5F0FF',
    borderWidth: s(2.5),
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarDark: { backgroundColor: '#2A1450', borderColor: '#1E0E38' },
  avatarImg: { width: '100%', height: '100%' },
  cardText: { flex: 1, marginLeft: s(12) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  name: {
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    color: '#1A0B2E',
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    height: s(20),
    borderRadius: s(10),
    paddingHorizontal: s(7),
  },
  levelText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(10.5), color: '#FFFFFF' },
  sinceRow: { flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: s(5) },
  since: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(11),
    color: '#94A3B8',
  },
  meta: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12.5),
    color: '#64748B',
    marginTop: s(3),
  },
  actions: { flexDirection: 'row', gap: s(10), marginTop: vs(14) },
  btnWrap: { flex: 1, borderRadius: s(14) },
  clip: { overflow: 'hidden' },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: s(34),
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  btn: {
    height: vs(42),
    borderRadius: s(14),
    flexDirection: 'row',
    gap: s(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13), color: '#FFFFFF' },
  unfollowBtn: { borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  unfollowBtnDark: { borderColor: '#7F1D1D', backgroundColor: '#2D1216' },
  unfollowText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13), color: '#DC2626' },
  disabled: { opacity: 0.55 },
  emptyCard: {
    marginHorizontal: s(16),
    marginTop: vs(24),
    padding: s(24),
    borderRadius: s(24),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyCardDark: { backgroundColor: '#1E0E38' },
  emptyIcon: {
    width: s(68),
    height: s(68),
    borderRadius: s(34),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(14),
  },
  emptyTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(17),
    color: '#1A0B2E',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#64748B',
    textAlign: 'center',
    marginTop: s(6),
  },
  emptyCta: { marginTop: vs(16), borderRadius: s(16), overflow: 'hidden' },
  emptyCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(20),
    paddingVertical: vs(11),
  },
  emptyCtaText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13), color: '#FFFFFF' },
});
