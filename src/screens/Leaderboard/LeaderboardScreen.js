import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  Animated,
  Pressable,
  Easing,
  RefreshControl,
} from 'react-native';
import FastImage from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { BackButton } from '../../components/common/BackButton';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useLeaderboard, LEADERBOARD_WINDOWS } from '../../hooks/useLeaderboard';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { Loader } from '../../components/common/Loader';
import { ErrorState } from '../Community/LoadingStates';
import { Bob, Enter, Shine } from '../Community/Motion';

const GUTTER = s(15);
const LEADERBOARD_LIMIT = 20;

const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const DEEP_PURPLE = '#3B108F';
const INK = '#1A1A2E';
const MUTED = '#6B6B8A';
const SOFT = '#B0ABCA';
const LINE = '#EDE8F5';

// Same ladder as the website
export const RANKS = [
  { name: 'Paw Wanderer', emoji: '🐾', min: 0, bg: '#F5F5F5', color: '#6B6B8A' },
  { name: 'Tail Hopper', emoji: '🐿️', min: 20, bg: '#FFF8E8', color: '#854F0B' },
  { name: 'Trail Sniffer', emoji: '🦮', min: 50, bg: '#FAEEDA', color: '#854F0B' },
  { name: 'Paw Explorer', emoji: '🗺️', min: 100, bg: '#E6F1FB', color: '#185FA5' },
  { name: 'Tails Traveller', emoji: '🚗', min: 200, bg: '#E8F8F3', color: '#0E6B4A' },
  { name: 'Pack Leader', emoji: '⭐', min: 400, bg: '#FFF8E8', color: '#C47912' },
  { name: 'Roaming Ranger', emoji: '🏔️', min: 750, bg: '#F5F0FF', color: '#3B108F' },
  { name: 'Pawsport Elite', emoji: '🛡️', min: 1200, bg: '#E8F8F3', color: '#085041' },
  { name: 'Top Dog', emoji: '🥇', min: 2000, bg: '#FFF8E8', color: '#C47912' },
  { name: 'Legendary Paws', emoji: '👑', min: 3500, bg: '#F5F0FF', color: '#2D0E6B' },
];

// "Apple (The Golden Retriever)" -> the short name for the podium, the rest is in the breed line
const shortName = name => (name || '').replace(/\s*\(.*\)\s*$/, '') || name;

export const rankFor = pts => [...RANKS].reverse().find(rank => pts >= rank.min) ?? RANKS[0];

const SOCIALS = {
  instagram: { icon: '📸', url: handle => `https://instagram.com/${handle.replace('@', '')}` },
  youtube: {
    icon: '▶️',
    url: handle => (handle.startsWith('http') ? handle : `https://youtube.com/@${handle}`),
  },
  twitter: { icon: '🐦', url: handle => `https://x.com/${handle.replace('@', '')}` },
  website: {
    icon: '🌐',
    url: handle => (handle.startsWith('http') ? handle : `https://${handle}`),
  },
};

// Podium order is 2nd, 1st, 3rd, like the website
const PODIUM = [
  {
    borderColor: 'rgba(192,192,192,0.45)',
    flex: 0.92,
    borderWidth: 1.5,
    top: s(22),
    avatar: s(46),
    points: '#888888',
    bubble: ['#A8A8A8', '#787878'],
    bubbleSize: s(26),
    base: s(16),
    baseColor: '#C0C0C0',
  },
  {
    borderColor: '#FFD700',
    flex: 1.16,
    borderWidth: 2,
    top: 0,
    avatar: s(58),
    points: '#C47912',
    bubble: ['#FFD700', '#FFA500'],
    bubbleSize: s(30),
    base: s(28),
    baseColor: '#FFD700',
  },
  {
    borderColor: 'rgba(205,127,50,0.45)',
    flex: 0.92,
    borderWidth: 1.5,
    top: s(34),
    avatar: s(46),
    points: '#CD7F32',
    bubble: ['#CD7F32', '#A0522D'],
    bubbleSize: s(26),
    base: s(9),
    baseColor: '#CD7F32',
  },
];

const STATS = [
  { value: '10 pts', label: 'per approved review' },
  { value: '+5 pts', label: 'first review bonus' },
  { value: '6/week', label: 'max scoring reviews' },
];

const STEPS = [
  {
    icon: '🐾',
    title: 'Register your pet',
    body: "Create a free account and add your dog's profile with a photo, breed and bio. Your dog gets a public pawsport page.",
  },
  {
    icon: '📍',
    title: 'Visit and review places',
    body: 'Visit a pet-friendly place from our verified directory and leave an honest review. Every approved review earns 10 points, and the first review of a place earns a bonus 5.',
  },
  {
    icon: '🏆',
    title: 'Collect stamps and climb ranks',
    body: "Each reviewed place becomes a stamp on your dog's pawsport. Collect enough to climb from Paw Wanderer to Legendary Paws.",
  },
  {
    icon: '📲',
    title: "Share your dog's profile",
    body: "Add your dog's Instagram or YouTube to their profile. The leaderboard shows social links so other pet parents can follow your adventures.",
  },
];

const FAQS = [
  {
    q: 'How do I get my dog on the leaderboard?',
    a: "Create a free account on Pet Friendly Places, add your dog's profile, then leave reviews on pet-friendly places you have actually visited together. Every approved review earns points and a place stamp automatically.",
  },
  {
    q: 'What counts as a verified stamp?',
    a: 'A stamp is awarded when your review of a place is approved by the Pet Friendly Places team. You must have genuinely visited the place with your dog. We verify this through the review content and may follow up.',
  },
  {
    q: "Can I add my dog's Instagram to their profile?",
    a: "Yes. When editing your dog's profile, add their Instagram handle, YouTube channel, X (Twitter) handle, or website. These appear on their pawsport page and on the leaderboard so other pet parents can follow their journey.",
  },
  {
    q: 'Which dogs are on the leaderboard?',
    a: 'All dogs with at least one approved review appear on the leaderboard. The ranking is by total points earned.',
  },
  {
    q: 'How many points do I need to reach the top rank?',
    a: 'Legendary Paws requires 3,500 points. At 10 points per approved review and up to 6 scoring reviews per week, consistent travel with your dog across India is what it takes to get there.',
  },
  {
    q: 'Is this only for dogs in Delhi or Mumbai?',
    a: 'No. Pet Friendly Places covers cities across India, including Rishikesh, Jim Corbett, Goa, Bengaluru, Jaipur, Dehradun, Bhimtal and many more. Any dog travelling anywhere in India can earn stamps and climb the leaderboard.',
  },
];

// Pet photo with the owner's small round photo on its corner
const PetAvatar = ({ url, name, size, ownerPhotoUrl, ownerDisplayName }) => {
  const badge = Math.round(size * 0.38);
  const showOwner = !!(ownerPhotoUrl || ownerDisplayName);

  return (
    <View style={{ width: size, height: size }}>
      {url ? (
        <FastImage
          source={{ uri: resolveImageUrl(url) }}
          style={[styles.avatarImage, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <LinearGradient
          colors={[PURPLE, '#00C2A8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.avatarImage,
            styles.avatarFallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}>
          <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>
            {(name || '?').charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      )}
      {showOwner && (
        <View style={[styles.ownerBadge, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          {ownerPhotoUrl ? (
            <FastImage source={{ uri: resolveImageUrl(ownerPhotoUrl) }} style={styles.ownerImage} />
          ) : (
            <Text style={[styles.ownerInitial, { fontSize: badge * 0.45 }]}>
              {(ownerDisplayName || '?').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const SocialButtons = ({ links, centered }) => {
  const entries = Object.entries(links || {}).filter(([key, value]) => value && SOCIALS[key]);
  if (entries.length === 0) {
    return null;
  }
  return (
    <View style={[styles.socials, centered && styles.socialsCentered]}>
      {entries.map(([key, value]) => (
        <BouncyPressable
          key={key}
          activeScale={0.88}
          accessibilityLabel={`${key} ${value}`}
          onPress={() => Linking.openURL(SOCIALS[key].url(value)).catch(() => {})}
          style={styles.socialBtn}>
          <Text style={styles.socialIcon}>{SOCIALS[key].icon}</Text>
        </BouncyPressable>
      ))}
    </View>
  );
};

const RankChip = ({ pts, small, centered }) => {
  const rank = rankFor(pts ?? 0);
  return (
    <View
      style={[
        styles.rankChip,
        { backgroundColor: rank.bg },
        small && styles.rankChipSmall,
        centered && styles.rankChipCentered,
      ]}>
      <Text
        style={[styles.rankChipText, { color: rank.color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}>
        {rank.emoji} {rank.name}
      </Text>
    </View>
  );
};

// Soft pulsing glow behind the champion's card
const GoldGlow = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.goldGlow,
        { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] }) },
      ]}
    />
  );
};

// Card that leans toward the finger on press (perspective tilt) and springs back on release
const Tilt3D = ({ style, children, onPress, max = 9, activeScale = 0.97 }) => {
  const ref = useRef(null);
  const pressed = useRef(false);
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const spring = (value, toValue) =>
    Animated.spring(value, { toValue, friction: 6, tension: 120, useNativeDriver: true }).start();

  const handlePressIn = e => {
    const { pageX, pageY } = e.nativeEvent;
    pressed.current = true;
    ref.current?.measureInWindow?.((x, y, width, height) => {
      if (!pressed.current || !width || !height) {
        return;
      }
      const clamp = n => Math.max(-1, Math.min(1, n));
      spring(tiltX, clamp(((pageX - x) / width - 0.5) * 2));
      spring(tiltY, clamp(((pageY - y) / height - 0.5) * 2));
    });
    spring(scale, activeScale);
  };

  const handlePressOut = () => {
    pressed.current = false;
    spring(tiltX, 0);
    spring(tiltY, 0);
    spring(scale, 1);
  };

  return (
    <Pressable ref={ref} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          style,
          {
            transform: [
              { perspective: 700 },
              {
                rotateX: tiltY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [`${max}deg`, `-${max}deg`],
                }),
              },
              {
                rotateY: tiltX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [`-${max}deg`, `${max}deg`],
                }),
              },
              { scale },
            ],
          },
        ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// Springs its children up from below, after `delay`
const Rise = ({ children, delay = 0, style }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
};

const RISE_DELAY = [260, 480, 40];

const PodiumCard = ({ entry, place, isDarkMode, onPress }) => {
  const config = PODIUM[place];
  const isChampion = entry.rank === 1;
  const rank = entry.rank;

  return (
    <Rise style={[styles.podiumColumn, { flex: config.flex }]} delay={RISE_DELAY[place]}>
      {isChampion && (
        <Bob distance={4} duration={1600}>
          <Text style={styles.crown}>👑</Text>
        </Bob>
      )}
      <View style={[styles.podiumShell, { marginTop: config.top }]}>
        {isChampion && <GoldGlow />}
        <Tilt3D
          activeScale={0.96}
          onPress={onPress}
          style={[
            styles.podiumCard,
            isDarkMode && styles.podiumCardDark,
            { borderColor: config.borderColor, borderWidth: config.borderWidth },
            isChampion && !isDarkMode && styles.podiumCardGold,
            { shadowColor: config.baseColor },
            isChampion && styles.podiumCardChampion,
          ]}>
          {isChampion && !isDarkMode && (
            <View pointerEvents="none" style={styles.podiumClip}>
              <LinearGradient
                colors={['#FFF1B8', '#FFFBEA', '#FFFFFF']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />
              <Shine travel={s(160)} />
            </View>
          )}
          <LinearGradient
            colors={config.bubble}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.rankBubble,
              {
                width: config.bubbleSize,
                height: config.bubbleSize,
                borderRadius: config.bubbleSize / 2,
              },
            ]}>
            <Text style={styles.rankBubbleText}>{rank}</Text>
          </LinearGradient>

          <View
            style={[
              styles.podiumAvatar,
              {
                borderColor: config.baseColor,
                borderRadius: (config.avatar + s(10)) / 2 + s(2),
              },
            ]}>
            <PetAvatar
              url={entry.profilePhotoUrl}
              name={entry.petName}
              size={config.avatar}
              ownerPhotoUrl={entry.ownerPhotoUrl}
              ownerDisplayName={entry.ownerDisplayName}
            />
          </View>

          <Text
            style={[
              styles.podiumName,
              isChampion && styles.podiumNameChampion,
              isDarkMode && styles.textLight,
            ]}
            numberOfLines={2}>
            {shortName(entry.petName)}
          </Text>
          <Text
            style={styles.podiumBreed}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}>
            {entry.breed ?? entry.species}
          </Text>
          <RankChip pts={entry.pts} small centered />
          <View style={[styles.pointsPill, { backgroundColor: `${config.baseColor}26` }]}>
            <Text
              style={[
                styles.podiumPoints,
                isChampion && styles.podiumPointsChampion,
                { color: config.points },
              ]}>
              {entry.pts ?? 0}
            </Text>
            <Text style={styles.podiumPointsLabel}>points</Text>
          </View>
          <SocialButtons links={entry.socialLinks} centered />
        </Tilt3D>
      </View>
    </Rise>
  );
};

const RankingRow = ({ entry, isDarkMode, onPress }) => {
  const medal =
    entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank;

  return (
    <Tilt3D
      max={5}
      activeScale={0.98}
      onPress={onPress}
      style={[styles.row, isDarkMode && styles.rowDark]}>
      <Text style={[styles.rowRank, typeof medal === 'string' && styles.rowMedal]}>{medal}</Text>
      <PetAvatar
        url={entry.profilePhotoUrl}
        name={entry.petName}
        size={s(38)}
        ownerPhotoUrl={entry.ownerPhotoUrl}
        ownerDisplayName={entry.ownerDisplayName}
      />
      <View style={styles.rowMain}>
        <Text style={[styles.rowName, isDarkMode && styles.textLight]} numberOfLines={1}>
          {entry.petName}
        </Text>
        <Text style={styles.rowBreed} numberOfLines={1}>
          {entry.breed ?? entry.species}
        </Text>
        <View style={styles.rowMeta}>
          <RankChip pts={entry.pts} small />
          <SocialButtons links={entry.socialLinks} />
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPoints}>{entry.pts ?? 0}</Text>
        <Text style={styles.rowStamps}>🐾 {entry.stampCount ?? 0}</Text>
      </View>
    </Tilt3D>
  );
};

const SectionTitle = ({ children, isDarkMode, style }) => (
  <View style={[styles.sectionHead, style]}>
    <LinearGradient colors={[PINK, PURPLE]} style={styles.sectionBar} />
    <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>{children}</Text>
  </View>
);

const FaqItem = ({ item, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  return (
    <BouncyPressable
      activeScale={0.99}
      onPress={() => setOpen(prev => !prev)}
      style={[styles.faq, isDarkMode && styles.faqDark]}>
      <View style={styles.faqHead}>
        <Text style={[styles.faqQuestion, isDarkMode && styles.textLight]}>{item.q}</Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={ms(16)} color={PURPLE} />
      </View>
      {open && <Text style={[styles.faqAnswer, isDarkMode && styles.textMutedDark]}>{item.a}</Text>}
    </BouncyPressable>
  );
};

export const LeaderboardScreen = ({ navigation }) => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('week');
  const {
    data: entries,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useLeaderboard(period, LEADERBOARD_LIMIT);

  const [tabsWidth, setTabsWidth] = useState(0);
  const tabWidth = tabsWidth > 0 ? (tabsWidth - 2 - 8) / LEADERBOARD_WINDOWS.length : 0;
  const indicatorX = useRef(new Animated.Value(0)).current;

  // The white pill slides to the active tab
  useEffect(() => {
    const index = LEADERBOARD_WINDOWS.findIndex(item => item.key === period);
    Animated.spring(indicatorX, {
      toValue: index * tabWidth,
      friction: 8,
      tension: 110,
      useNativeDriver: true,
    }).start();
  }, [period, tabWidth, indicatorX]);

  const list = entries || [];
  const podium = list.slice(0, 3);
  const second = podium[1];
  const third = podium[2];
  const champion = podium[0];
  const ordered = [second, champion, third];

  const openPet = entry =>
    navigation.navigate('PublicPetProfileScreen', { slug: entry.slug, entry });

  const goTab = screen => navigation.navigate('MainTabs', { screen });

  const renderBoard = () => {
    if (isLoading) {
      return (
        <View style={styles.loading}>
          <Loader
            fullScreen
            transparent
            title="Loading the leaderboard…"
            subtitle="Ranking the most adventurous pets..."
          />
        </View>
      );
    }
    if (isError && !entries) {
      return (
        <ErrorState
          message="Could not load the leaderboard"
          onRetry={refetch}
          isDarkMode={isDarkMode}
        />
      );
    }
    if (list.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyText}>Be the first to write a review and earn points!</Text>
          <BouncyPressable
            activeScale={0.95}
            onPress={() => navigation.navigate('SearchScreen')}
            style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Find places to visit 🗺️</Text>
          </BouncyPressable>
        </View>
      );
    }

    return (
      <>
        <View style={styles.podium}>
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,200,40,0.32)', 'rgba(255,200,40,0)']}
            style={styles.spotlight}
          />
          {ordered.map((entry, place) =>
            entry ? (
              <PodiumCard
                key={entry.petProfileId}
                entry={entry}
                place={place}
                isDarkMode={isDarkMode}
                onPress={() => openPet(entry)}
              />
            ) : (
              <View
                key={`empty-${place}`}
                style={[styles.podiumColumn, { flex: PODIUM[place].flex }]}
              />
            ),
          )}
        </View>
        <View style={styles.podiumBases}>
          {PODIUM.map((config, place) => (
            <LinearGradient
              key={place}
              colors={[config.baseColor, `${config.baseColor}33`]}
              style={[styles.podiumBase, { height: config.base, flex: config.flex }]}
            />
          ))}
        </View>

        <SectionTitle isDarkMode={isDarkMode}>Full rankings</SectionTitle>
        <View style={styles.rows}>
          {list.map((entry, index) => (
            <Enter key={entry.petProfileId} index={index}>
              <RankingRow entry={entry} isDarkMode={isDarkMode} onPress={() => openPet(entry)} />
            </Enter>
          ))}
        </View>
      </>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDarkMode ? '#17092E' : '#2A0A6B'}
        translucent={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PURPLE} />
        }
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, s(20)) + s(30) }}>
        <View style={styles.heroShell}>
          <LinearGradient
            colors={
              isDarkMode ? ['#17092E', '#2A0A6B', '#3B108F'] : ['#2A0A6B', '#4A12B0', '#7B2CFF']
            }
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.hero,
              { paddingTop: Math.max(insets.top, StatusBar.currentHeight ?? 0, s(12)) + s(8) },
            ]}>
            <View pointerEvents="none" style={styles.heroOrbA} />
            <View pointerEvents="none" style={styles.heroOrbB} />
            <Ionicons
              name="paw"
              size={ms(120)}
              color="rgba(255,255,255,0.07)"
              style={styles.heroPawA}
            />
            <Ionicons
              name="paw"
              size={ms(80)}
              color="rgba(255,79,184,0.16)"
              style={styles.heroPawB}
            />

            <View style={styles.topRow}>
              <BackButton onPress={() => navigation.goBack()} />
              <View style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit>
                  🏆 India's most adventurous pet leaderboard
                </Text>
              </View>
            </View>

            <View style={styles.heroBody}>
              <Text style={styles.heroTitle} numberOfLines={1} adjustsFontSizeToFit>
                Travelling Tails Leaderboard
              </Text>
              <Text style={styles.heroSubtitle}>
                India's most adventurous pets, ranked by verified places visited. Every stamp is a
                real place. Every point is earned.
              </Text>

              <View style={styles.tabs} onLayout={e => setTabsWidth(e.nativeEvent.layout.width)}>
                {tabWidth > 0 && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.tabIndicator,
                      { width: tabWidth, transform: [{ translateX: indicatorX }] },
                    ]}
                  />
                )}
                {LEADERBOARD_WINDOWS.map(item => {
                  const active = item.key === period;
                  return (
                    <BouncyPressable
                      key={item.key}
                      activeScale={0.95}
                      onPress={() => setPeriod(item.key)}
                      style={styles.tab}>
                      <Text style={[styles.tabText, active && styles.tabTextActive]}>
                        {item.label}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </View>

              <View style={styles.stats}>
                <View style={styles.statChip}>
                  <Text style={styles.statValue}>{list.length}+</Text>
                  <Text style={styles.statLabel}>pets competing</Text>
                </View>
                {STATS.map(stat => (
                  <View key={stat.label} style={styles.statChip}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          {renderBoard()}

          <SectionTitle isDarkMode={isDarkMode} style={styles.ladderTitle}>
            Rank ladder 🐾
          </SectionTitle>
          <Text style={[styles.sectionIntro, isDarkMode && styles.textMutedDark]}>
            Earn more points to unlock higher ranks. Each rank unlocks a badge on your dog's
            pawsport page.
          </Text>
          <View style={styles.ladder}>
            {RANKS.map(rank => (
              <View
                key={rank.name}
                style={[
                  styles.ladderItem,
                  { backgroundColor: rank.bg, borderColor: `${rank.color}33` },
                ]}>
                <View style={[styles.ladderTop, { backgroundColor: rank.color }]} />
                <View style={styles.ladderEmojiWrap}>
                  <Text style={styles.ladderEmoji}>{rank.emoji}</Text>
                </View>
                <Text style={[styles.ladderName, { color: rank.color }]}>{rank.name}</Text>
                <Text style={[styles.ladderMin, { color: rank.color }]}>{rank.min} pts</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />
          <SectionTitle isDarkMode={isDarkMode}>How it works</SectionTitle>
          <View style={styles.steps}>
            {STEPS.map(step => (
              <View key={step.title} style={[styles.step, isDarkMode && styles.stepDark]}>
                <LinearGradient
                  colors={['#F5F0FF', '#FFE6F5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepIconTile}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </LinearGradient>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, isDarkMode && styles.textLight]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.stepBody, isDarkMode && styles.textMutedDark]}>
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <SectionTitle isDarkMode={isDarkMode} style={styles.faqTitle}>
            Frequently asked questions
          </SectionTitle>
          {FAQS.map(item => (
            <FaqItem key={item.q} item={item} isDarkMode={isDarkMode} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  containerDark: { backgroundColor: '#0F071D' },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },
  body: { paddingHorizontal: GUTTER, paddingTop: s(16) },

  heroShell: {
    backgroundColor: DEEP_PURPLE,
    borderBottomLeftRadius: s(24),
    borderBottomRightRadius: s(24),
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  hero: {
    paddingHorizontal: GUTTER,
    paddingBottom: s(14),
    overflow: 'hidden',
    borderBottomLeftRadius: s(24),
    borderBottomRightRadius: s(24),
  },
  heroOrbA: {
    position: 'absolute',
    width: s(220),
    height: s(220),
    borderRadius: s(110),
    top: -s(70),
    left: -s(60),
    backgroundColor: 'rgba(255,79,184,0.22)',
  },
  heroOrbB: {
    position: 'absolute',
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    bottom: -s(60),
    right: -s(40),
    backgroundColor: 'rgba(0,194,168,0.2)',
  },
  heroPawA: { position: 'absolute', right: -s(20), top: s(20), transform: [{ rotate: '20deg' }] },
  heroPawB: {
    position: 'absolute',
    left: -s(10),
    bottom: s(30),
    transform: [{ rotate: '-25deg' }],
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  heroBody: { alignItems: 'center', marginTop: s(10) },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
    flex: 1,
    alignItems: 'center',
  },
  pillText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(10.5),
    color: '#FFE9A8',
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    lineHeight: s(26),
    letterSpacing: -0.6,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: s(5),
  },
  heroSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11),
    lineHeight: s(16),
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    marginBottom: s(10),
    paddingHorizontal: s(6),
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderRadius: s(14),
    padding: 4,
    marginBottom: s(10),
    alignSelf: 'stretch',
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: s(7), borderRadius: s(12) },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  tabText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: { fontFamily: theme.typography.fontFamily.bold, color: DEEP_PURPLE },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: s(6),
    alignSelf: 'stretch',
  },
  statChip: {
    width: '23.6%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderRadius: s(12),
    paddingVertical: s(7),
    paddingHorizontal: s(3),
  },
  statValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13),
    lineHeight: s(17),
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10),
    color: 'rgba(255,255,255,0.7)',
  },

  loading: { height: s(300) },

  empty: { alignItems: 'center', paddingVertical: s(40), paddingHorizontal: s(20) },
  emptyEmoji: { fontSize: s(44), marginBottom: s(10) },
  emptyText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(13),
    color: SOFT,
    textAlign: 'center',
    marginBottom: s(18),
  },
  emptyBtn: {
    backgroundColor: DEEP_PURPLE,
    borderRadius: s(20),
    paddingVertical: s(11),
    paddingHorizontal: s(24),
  },
  emptyBtnText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12.5),
    color: '#FFFFFF',
  },

  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: s(8), paddingTop: s(8) },
  podiumColumn: { alignItems: 'center' },
  spotlight: {
    position: 'absolute',
    top: -s(6),
    bottom: 0,
    left: '24%',
    width: '52%',
    borderTopLeftRadius: s(60),
    borderTopRightRadius: s(60),
  },
  crown: { fontSize: s(24), marginBottom: s(2) },
  podiumShell: { alignSelf: 'stretch' },
  goldGlow: {
    position: 'absolute',
    top: -s(4),
    left: -s(4),
    right: -s(4),
    bottom: -s(4),
    borderRadius: s(24),
    backgroundColor: 'rgba(255,215,0,0.5)',
  },
  podiumCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingTop: s(16),
    paddingBottom: s(10),
    paddingHorizontal: s(6),
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  podiumCardChampion: { shadowOpacity: 0.5, shadowRadius: 20 },
  podiumCardGold: { backgroundColor: '#FFFBEA' },
  podiumCardDark: { backgroundColor: '#1E0E38' },
  rankBubble: {
    position: 'absolute',
    top: -s(13),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF8F0',
    zIndex: 5,
  },
  rankBubbleText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    color: '#FFFFFF',
  },
  podiumClip: { ...StyleSheet.absoluteFillObject, borderRadius: s(20), overflow: 'hidden' },
  podiumAvatar: { padding: s(3), borderWidth: 2, marginBottom: s(5), marginTop: s(2) },
  pointsPill: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: s(14),
    paddingVertical: s(2),
    marginTop: s(6),
    marginHorizontal: s(4),
  },
  podiumName: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12.5),
    color: INK,
    textAlign: 'center',
  },
  podiumNameChampion: { fontSize: s(14) },
  podiumBreed: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10),
    color: SOFT,
    marginTop: s(1),
    marginBottom: s(4),
    textAlign: 'center',
  },
  podiumPoints: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(18),
    lineHeight: s(21),
  },
  podiumPointsChampion: { fontSize: s(22), lineHeight: s(25) },
  podiumPointsLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10),
    color: SOFT,
  },
  podiumBases: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: s(14),
    marginTop: -s(2),
    alignItems: 'flex-start',
  },
  podiumBase: {
    borderBottomLeftRadius: s(12),
    borderBottomRightRadius: s(12),
  },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: s(8) },
  sectionBar: { width: s(4), height: s(15), borderRadius: s(2) },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(15),
    letterSpacing: -0.3,
    color: INK,
  },
  sectionIntro: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11),
    lineHeight: s(16),
    color: MUTED,
    marginBottom: s(8),
  },
  rows: { gap: s(6) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    backgroundColor: '#FFFFFF',
    borderColor: LINE,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderRadius: s(14),
    paddingVertical: s(8),
    paddingHorizontal: s(12),
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  rowDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  rowRank: {
    width: s(26),
    height: s(26),
    lineHeight: s(26),
    borderRadius: s(13),
    overflow: 'hidden',
    backgroundColor: '#F5F0FF',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12),
    color: PURPLE,
  },
  rowMedal: { backgroundColor: 'transparent', fontSize: s(20) },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13.5), color: INK },
  rowBreed: { fontFamily: theme.typography.fontFamily.regular, fontSize: s(10.5), color: SOFT },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginTop: s(4),
    flexWrap: 'wrap',
  },
  rowRight: { alignItems: 'flex-end' },
  rowPoints: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    color: '#C47912',
  },
  rowStamps: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(10.5),
    color: INK,
    marginTop: s(2),
  },

  avatarImage: { backgroundColor: '#EDE8F5' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: theme.typography.fontFamily.extraBold, color: '#FFFFFF' },
  ownerBadge: {
    position: 'absolute',
    right: -s(3),
    bottom: -s(3),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerImage: { width: '100%', height: '100%' },
  ownerInitial: { fontFamily: theme.typography.fontFamily.extraBold, color: '#FFFFFF' },

  rankChip: {
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: s(2),
    alignSelf: 'flex-start',
  },
  rankChipSmall: { paddingVertical: s(1.5) },
  rankChipCentered: { alignSelf: 'center', maxWidth: '100%' },
  rankChipText: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: s(9.5) },

  socials: { flexDirection: 'row', gap: s(5), flexWrap: 'wrap' },
  socialsCentered: { justifyContent: 'center', marginTop: s(8) },
  socialBtn: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { fontSize: s(12) },

  ladderTitle: { marginTop: s(22) },
  ladder: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: s(8) },
  ladderItem: {
    width: '18.4%',
    alignItems: 'center',
    borderRadius: s(14),
    borderWidth: 1.5,
    paddingBottom: s(8),
    overflow: 'hidden',
  },
  ladderTop: { alignSelf: 'stretch', height: s(3), marginBottom: s(6), opacity: 0.85 },
  ladderEmojiWrap: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(3),
  },
  ladderEmoji: { fontSize: s(14) },
  ladderName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(8.5),
    lineHeight: s(10.5),
    textAlign: 'center',
    minHeight: s(21),
    paddingHorizontal: s(2),
  },
  ladderMin: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(8.5),
    marginTop: s(3),
    opacity: 0.75,
  },

  divider: { height: 1.5, backgroundColor: LINE, marginTop: s(22), marginBottom: s(18) },
  steps: { gap: s(8) },
  step: {
    flexDirection: 'row',
    gap: s(10),
    backgroundColor: '#FFFFFF',
    borderColor: LINE,
    borderWidth: 1.5,
    borderRadius: s(16),
    padding: s(10),
    borderBottomWidth: 3,
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  stepDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  stepIconTile: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(123,44,255,0.15)',
  },
  stepIcon: { fontSize: s(19) },
  stepText: { flex: 1, minWidth: 0 },
  stepTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12.5),
    color: INK,
    marginBottom: s(2),
  },
  stepBody: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10.5),
    lineHeight: s(15),
    color: MUTED,
  },

  faqTitle: { marginTop: s(22) },
  faq: {
    backgroundColor: '#FFFFFF',
    borderColor: LINE,
    borderWidth: 1.5,
    borderRadius: s(16),
    paddingVertical: s(10),
    paddingHorizontal: s(14),
    marginBottom: s(6),
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  faqDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(10),
  },
  faqQuestion: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: INK,
  },
  faqAnswer: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11.5),
    lineHeight: s(18),
    color: MUTED,
    marginTop: s(8),
  },
});
