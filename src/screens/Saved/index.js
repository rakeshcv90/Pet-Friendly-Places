import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { AppHeader } from '../../components/common/AppHeader';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useCommunities, useFeaturedThread } from '../../hooks/useCommunity';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { DraggableFab } from '../Community/DraggableFab';
import { InfoButton } from '../Community/InfoButton';
import { CommunityInfoModal } from '../Community/CommunityInfoModal';
import {
  toCommunityCard,
  credentialLabel,
  cleanText,
  initialOf,
  timeAgo,
} from '../Community/utils';
import { PawLoader, SkeletonRow, SkeletonFeatured, ErrorState } from '../Community/LoadingStates';
import { useHomeAnimations, styles as homeStyles } from '../Home/components';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GUTTER = s(15);
const GRID_GAP = s(10);
// Two cards per row, so the whole list fits the page width with no sideways scrolling
const GRID_CARD_WIDTH = Math.floor((SCREEN_WIDTH - GUTTER * 2 - GRID_GAP) / 2) - 1;

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';

const STEPS = [
  {
    icon: '💬',
    bg: '#EDE9FE',
    title: 'Ask anything',
    desc: 'Post questions and get lived answers.',
  },
  {
    icon: '📍',
    bg: '#CCFBF1',
    title: 'Share finds',
    desc: 'Add dog-friendly places for everyone.',
  },
  { icon: '✨', bg: '#D1FAE5', title: 'Reviewed', desc: 'Moderated and verified with care.' },
];

// Fades and lifts its children in, staggered by `index`.
const FadeIn = ({ index = 0, children, style }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 520,
      delay: index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
};

// Card that tilts toward the touch point, like a physical card being pressed.
// Style keys that position the card; they stay on the static touch wrapper
const LAYOUT_KEYS = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'alignSelf',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
];

const splitLayoutStyle = style => {
  const flat = StyleSheet.flatten(style) || {};
  const outer = {};
  const inner = {};
  Object.keys(flat).forEach(key => {
    (LAYOUT_KEYS.includes(key) ? outer : inner)[key] = flat[key];
  });
  return [outer, inner];
};

// Card that tilts toward the touch point, like a physical card being pressed.
// The touch area is a static Pressable; only the card inside it is animated, so
// the transforms can never shift or shrink where taps are detected.
const Tilt3D = ({ style, children, onPress, max = 10 }) => {
  const ref = useRef(null);
  const pressed = useRef(false);
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [outerStyle, innerStyle] = splitLayoutStyle(style);

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
    spring(scale, 0.97);
  };

  const handlePressOut = () => {
    pressed.current = false;
    spring(tiltX, 0);
    spring(tiltY, 0);
    spring(scale, 1);
  };

  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={outerStyle}>
      <Animated.View
        pointerEvents="none"
        style={[
          innerStyle,
          styles.tiltFill,
          {
            transform: [
              { perspective: 800 },
              {
                rotateX: tiltY.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [`${max}deg`, `${-max}deg`],
                }),
              },
              {
                rotateY: tiltX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [`${-max}deg`, `${max}deg`],
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

// Gently bobs its children up and down.
const Float = ({ children, style, distance = 4, duration = 2400, delay = 0 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(progress, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);
    loop.start();
    return () => loop.stop();
  }, [progress, distance, duration, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }),
            },
            {
              rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
};

// Light streak that sweeps across its (overflow hidden) parent every few seconds.
const Sheen = ({ travel = 200 }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sheen,
        {
          transform: [
            {
              translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-60, travel] }),
            },
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
  );
};

const PulseDot = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View style={styles.eyebrowDotWrap}>
      <Animated.View
        style={[
          styles.eyebrowDot,
          styles.pulseRing,
          {
            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
            transform: [
              { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) },
            ],
          },
        ]}
      />
      <View style={styles.eyebrowDot} />
    </View>
  );
};

// Flips a block up into place as it scrolls into view. Must be a direct child of the main scroll view.
const Reveal = ({ scrollY, onMeasure, children }) => {
  const [y, setY] = useState(null);

  if (y === null) {
    return (
      <View
        style={styles.hidden}
        onLayout={e => {
          setY(e.nativeEvent.layout.y);
          onMeasure?.(e.nativeEvent.layout.y);
        }}>
        {children}
      </View>
    );
  }

  const range = [y - SCREEN_HEIGHT + 60, y - SCREEN_HEIGHT + 260];
  const progress = scrollY.interpolate({
    inputRange: range,
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      onLayout={e => {
        setY(e.nativeEvent.layout.y);
        onMeasure?.(e.nativeEvent.layout.y);
      }}
      style={{
        opacity: progress,
        transform: [
          { perspective: 900 },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
          { rotateX: progress.interpolate({ inputRange: [0, 1], outputRange: ['14deg', '0deg'] }) },
          { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
};

const SectionHeading = ({ overline, title, isDarkMode }) => (
  <View style={styles.sectionHeading}>
    <Text style={styles.overline}>{overline}</Text>
    <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>{title}</Text>
  </View>
);

// Darkens a #RRGGBB colour by mixing it with black
const shade = (hex, amount) => {
  const mix = start => Math.round(parseInt(hex.slice(start, start + 2), 16) * (1 - amount));
  return `rgb(${mix(1)}, ${mix(3)}, ${mix(5)})`;
};

// Rich accent-to-deep gradient card, the same family as the leaderboard banner: glass icon,
// white text, frosted count pills and a slow shine
const CommunityTile = ({ item, accent, onPress, index = 0 }) => (
  <View style={styles.gridItem}>
    <Tilt3D
      onPress={onPress}
      style={[styles.tile, { shadowColor: accent, borderBottomColor: shade(accent, 0.62) }]}
      max={8}>
      <LinearGradient
        pointerEvents="none"
        colors={[accent, shade(accent, 0.45)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0)']}
        style={styles.tileGloss}
      />
      <Text style={styles.tileWatermark}>{item.icon}</Text>
      <View style={styles.tileTop}>
        <Float distance={2} duration={2600} delay={index * 250}>
          <View style={[styles.tileIcon, { borderBottomColor: shade(accent, 0.5) }]}>
            <View pointerEvents="none" style={styles.iconGloss} />
            <Text style={styles.tileEmoji}>{item.icon}</Text>
          </View>
        </Float>
        <View style={styles.tileArrow}>
          <Ionicons name="arrow-forward" size={ms(12)} color={shade(accent, 0.35)} />
        </View>
      </View>
      <Text style={styles.tileTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {item.title}
      </Text>
      <Text style={styles.tileDesc} numberOfLines={2}>
        {item.desc}
      </Text>
      <View style={styles.tilePills}>
        <View style={styles.tilePill}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={styles.tilePillText}>
            👥 {item.members} members
          </Text>
        </View>
        <View style={styles.tilePill}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={styles.tilePillText}>
            📝 {item.posts} {item.posts === 1 ? 'post' : 'posts'}
          </Text>
        </View>
      </View>
      <Sheen travel={GRID_CARD_WIDTH} />
    </Tilt3D>
  </View>
);

const TopicCard = ({ item, index, isDarkMode, onPress }) => (
  <CommunityTile
    item={item}
    accent={item.colors[0]}
    index={index}
    isDarkMode={isDarkMode}
    onPress={onPress}
  />
);

const CityCard = ({ item, isDarkMode, onPress }) => (
  <CommunityTile item={item} accent={item.accent} onPress={onPress} />
);

// Entry point to the leaderboard: trophy, title and the current top three pets
const LeaderboardCard = ({ topPets, onPress }) => (
  <BouncyPressable
    activeScale={0.97}
    onPress={onPress}
    accessibilityLabel="Open leaderboard"
    style={styles.lbWrap}>
    <LinearGradient
      colors={['#2E008B', DEEP_PURPLE, PURPLE]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.lbCard}>
      <View style={styles.lbGlow} />
      <Ionicons name="paw" size={ms(70)} color="rgba(255,255,255,0.07)" style={styles.lbPaw} />

      <Float distance={3} duration={2200}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lbTrophy}>
          <Text style={styles.lbTrophyEmoji}>🏆</Text>
        </LinearGradient>
      </Float>

      <View style={styles.lbText}>
        <Text style={styles.lbOverline}>TRAVELLING TAILS</Text>
        <Text style={styles.lbTitle}>Leaderboard</Text>
        <Text style={styles.lbSubtitle} numberOfLines={1}>
          India's most adventurous pets
        </Text>
      </View>

      {topPets.length > 0 && (
        <View style={styles.lbStack}>
          {topPets.map((pet, index) => (
            <View
              key={pet.petProfileId}
              style={[styles.lbAvatar, index > 0 && styles.lbAvatarOverlap]}>
              {pet.profilePhotoUrl ? (
                <Image
                  source={{ uri: resolveImageUrl(pet.profilePhotoUrl) }}
                  style={styles.lbAvatarImage}
                />
              ) : (
                <Text style={styles.lbAvatarInitial}>
                  {(pet.petName || '?').charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.lbArrow}>
        <Ionicons name="arrow-forward" size={ms(14)} color={DEEP_PURPLE} />
      </View>
      <Sheen travel={SCREEN_WIDTH} />
    </LinearGradient>
  </BouncyPressable>
);

const SectionState = ({ withLoader, isLoading, isError, isEmpty, onRetry, isDarkMode }) => {
  if (isLoading) {
    return (
      <View>
        {withLoader ? <PawLoader label="Fetching communities…" isDarkMode={isDarkMode} /> : null}
        <SkeletonRow count={2} width={GRID_CARD_WIDTH} isDarkMode={isDarkMode} />
      </View>
    );
  }
  if (isError) {
    return <ErrorState onRetry={onRetry} isDarkMode={isDarkMode} />;
  }
  if (isEmpty) {
    return (
      <View style={styles.sectionState}>
        <Text style={[styles.sectionStateText, isDarkMode && styles.textMutedDark]}>
          Nothing here yet.
        </Text>
      </View>
    );
  }
  return null;
};

// Most-upvoted real post of the busiest community, with its top replies
const FeaturedThread = ({ featured, isDarkMode }) => {
  const { community, post, body, replies } = featured;

  return (
    <View style={[styles.card3D, styles.thread, isDarkMode && styles.card3DDark]}>
      <LinearGradient
        colors={['#2E008B', DEEP_PURPLE, PURPLE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.threadHeader}>
        <View style={styles.threadGlow} />
        <Ionicons
          name="paw"
          size={ms(76)}
          color="rgba(255,255,255,0.08)"
          style={styles.threadPaw}
        />
        <Text style={styles.featuredEyebrow}>★ FEATURED THREAD</Text>
        <View style={styles.threadHeaderRow}>
          <Float distance={3} duration={2400}>
            <View style={styles.threadHeaderIcon}>
              <Text style={styles.threadHeaderEmoji}>{community.emoji}</Text>
            </View>
          </Float>
          <View style={styles.flex}>
            <Text style={styles.threadCommunity} numberOfLines={1}>
              {community.name}
            </Text>
            <Text style={styles.threadCommunityMeta}>
              {community.memberCount} members · {community.postCount} posts
            </Text>
          </View>
          <View style={styles.topicTag}>
            <Text style={styles.topicTagText}>{community.type}</Text>
          </View>
        </View>
        <Sheen travel={SCREEN_WIDTH} />
      </LinearGradient>

      <View style={styles.threadBody}>
        <View style={styles.authorRow}>
          <LinearGradient colors={['#FF9F1C', '#FFD166']} style={styles.avatar}>
            <Text style={styles.avatarText}>{initialOf(post.authorDisplayName)}</Text>
          </LinearGradient>
          <View style={styles.flex}>
            <Text style={[styles.authorName, isDarkMode && styles.textLight]} numberOfLines={1}>
              {post.authorDisplayName}
            </Text>
            <Text style={styles.authorMeta}>asked {timeAgo(post.createdAt)}</Text>
          </View>
        </View>
        <Text style={[styles.threadTitle, isDarkMode && styles.textLight]}>{post.title}</Text>
        {body ? (
          <View style={[styles.quote, isDarkMode && styles.quoteDark]}>
            <Text
              style={[styles.threadExcerpt, isDarkMode && styles.textMutedDark]}
              numberOfLines={3}>
              {cleanText(body)}
            </Text>
          </View>
        ) : null}
      </View>

      {replies.length > 0 && (
        <View style={[styles.answers, isDarkMode && styles.answersDark]}>
          <View style={styles.answersLabelRow}>
            <Ionicons name="trophy" size={ms(11)} color="#F59E0B" />
            <Text style={styles.answersLabel}>TOP ANSWERS</Text>
          </View>
          {replies.map((reply, i) => {
            const credential = credentialLabel(reply.authorVerifiedCredential);
            const teal = i % 2 === 0;
            return (
              <View
                key={reply.id}
                style={[
                  styles.answerCard,
                  teal ? styles.answerCardTeal : styles.answerCardPurple,
                  isDarkMode && styles.answerCardDark,
                ]}>
                <View
                  style={[
                    styles.answerAvatar,
                    teal ? styles.answerAvatarTeal : styles.answerAvatarPurple,
                  ]}>
                  <Text
                    style={[
                      styles.answerAvatarText,
                      teal ? styles.answerAvatarTextTeal : styles.answerAvatarTextPurple,
                    ]}>
                    {initialOf(reply.authorDisplayName)}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <View style={styles.answerNameRow}>
                    <Text style={[styles.answerName, isDarkMode && styles.textLight]}>
                      {reply.authorDisplayName}
                    </Text>
                    {credential && (
                      <View style={styles.verified}>
                        <Text style={styles.verifiedText}>✓ {credential}</Text>
                      </View>
                    )}
                    {reply.upvoteCount > 0 && (
                      <Text style={styles.answerVotes}>👍 {reply.upvoteCount}</Text>
                    )}
                  </View>
                  <Text
                    style={[styles.answerText, isDarkMode && styles.textMutedDark]}
                    numberOfLines={2}>
                    {cleanText(reply.body)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={[styles.threadFooter, isDarkMode && styles.threadFooterDark]}>
        <View style={styles.countPills}>
          <View style={[styles.countPill, isDarkMode && styles.countPillDark]}>
            <Text style={styles.countPillText}>💬 {post.replyCount}</Text>
          </View>
          <View style={[styles.countPill, styles.countPillHot]}>
            <Text style={[styles.countPillText, styles.countPillHotText]}>
              👍 {post.upvoteCount} helpful
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const SavedScreen = ({ navigation }) => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const { data: apiCommunities, isLoading, isError, refetch } = useCommunities();
  console.log('SavedScreen: apiCommunities', apiCommunities);
  const communities = apiCommunities || [];
  const topics = communities.filter(c => c.type === 'TOPIC').map(toCommunityCard);
  const cities = communities.filter(c => c.type === 'CITY').map(toCommunityCard);
  const featured = useFeaturedThread(apiCommunities);
  const { data: topPets } = useLeaderboard('all', 3);
  const stats = [
    { value: apiCommunities ? String(communities.length) : '–', label: 'Communities' },
    {
      value: apiCommunities
        ? String(communities.reduce((sum, c) => sum + (c.postCount || 0), 0))
        : '–',
      label: 'Posts',
    },
    { value: apiCommunities ? String(cities.length) : '–', label: 'Cities' },
  ];
  const openCommunity = community => navigation?.navigate?.('CommunityDetailScreen', { community });

  // Same scroll-driven orbs, watermarks and header motion as the Home screen
  const {
    orbTopRightY,
    orbTopRightScale,
    orbTopLeftY,
    orbMidRightY,
    orbMidLeftY,
    orbBottomRightY,
    watermarkTopY,
    watermarkBottomY,
    avatarScale,
    avatarRotate,
    searchBarScale,
    searchIconRotate,
  } = useHomeAnimations(scrollY);

  return (
    <View
      style={[
        styles.container,
        isDarkMode && styles.containerDark,
        { paddingTop: Math.max(insets.top, s(12)) },
      ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : theme.colors.background}
        translucent={false}
      />

      <Animated.View
        style={[
          homeStyles.ambientGlowTopRight,
          isDarkMode && homeStyles.ambientGlowDark,
          { transform: [{ translateY: orbTopRightY }, { scale: orbTopRightScale }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          homeStyles.ambientGlowTopLeft,
          isDarkMode && homeStyles.ambientGlowDark,
          { transform: [{ translateY: orbTopLeftY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          homeStyles.ambientGlowMidRight,
          isDarkMode && homeStyles.ambientGlowDark,
          { transform: [{ translateY: orbMidRightY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          homeStyles.ambientGlowMidLeft,
          isDarkMode && homeStyles.ambientGlowDark,
          { transform: [{ translateY: orbMidLeftY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          homeStyles.ambientGlowBottomRight,
          isDarkMode && homeStyles.ambientGlowDark,
          { transform: [{ translateY: orbBottomRightY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          homeStyles.ambientPawWatermarkTop,
          { transform: [{ rotate: '-25deg' }, { translateY: watermarkTopY }] },
        ]}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(130)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(123, 44, 255, 0.035)'}
        />
      </Animated.View>
      <Animated.View
        style={[
          homeStyles.ambientPawWatermarkBottom,
          { transform: [{ rotate: '30deg' }, { translateY: watermarkBottomY }] },
        ]}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(238, 42, 123, 0.06)' : 'rgba(238, 42, 123, 0.03)'}
        />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, s(20)) + s(90) },
        ]}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}>
        <AppHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search communities, topics, cities"
          onSearchSubmit={query =>
            navigation?.navigate?.('SearchScreen', { query, category: 'Pet Friendly Stays' })
          }
          onAvatarPress={() => navigation?.navigate?.('Profile')}
          avatarScale={avatarScale}
          avatarRotate={avatarRotate}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
        />

        {/* Hero */}
        <FadeIn index={0} style={styles.hero}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrow, isDarkMode && styles.eyebrowDark]}>
              <PulseDot />
              <Text style={styles.eyebrowText}>INDIA'S PET COMMUNITY</Text>
            </View>
            <InfoButton onPress={() => setInfoVisible(true)} />
          </View>
          <Text style={[styles.heroTitle, isDarkMode && styles.textLight]}>
            Where pet parents <Text style={styles.heroTitleAccent}>find their people</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isDarkMode && styles.textMutedDark]} numberOfLines={2}>
            Ask questions, share discoveries and connect with fellow pet parents.
          </Text>
          <LeaderboardCard
            topPets={(topPets || []).slice(0, 3)}
            onPress={() => navigation?.navigate?.('LeaderboardScreen')}
          />
        </FadeIn>

        {/* Stats */}
        <FadeIn
          index={1}
          style={[styles.card3D, styles.statsCard, isDarkMode && styles.card3DDark]}>
          {stats.map((stat, i) => (
            <View
              key={stat.label}
              style={[
                styles.stat,
                i > 0 && styles.statDivider,
                i > 0 && isDarkMode && styles.statDividerDark,
              ]}>
              <Text style={[styles.statValue, isDarkMode && styles.textLight]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </FadeIn>

        {/* Featured thread */}
        {isLoading ? (
          <FadeIn index={2}>
            <SkeletonFeatured isDarkMode={isDarkMode} />
          </FadeIn>
        ) : featured.post && featured.community ? (
          <FadeIn index={2} style={styles.threadWrap}>
            <FeaturedThread featured={featured} isDarkMode={isDarkMode} />
          </FadeIn>
        ) : null}

        {/* By Topic */}
        <Reveal scrollY={scrollY}>
          <SectionHeading overline="Explore" title="By Topic" isDarkMode={isDarkMode} />
          <SectionState
            withLoader
            isLoading={isLoading}
            isError={isError && !apiCommunities}
            isEmpty={!isLoading && !isError && topics.length === 0}
            onRetry={refetch}
            isDarkMode={isDarkMode}
          />
          <View style={styles.grid}>
            {topics.map((item, i) => (
              <TopicCard
                key={item.slug}
                item={item}
                index={i}
                isDarkMode={isDarkMode}
                onPress={() => openCommunity(item)}
              />
            ))}
          </View>
        </Reveal>

        {/* By City */}
        <Reveal scrollY={scrollY}>
          <SectionHeading overline="Nearby" title="By City" isDarkMode={isDarkMode} />
          <SectionState
            isLoading={isLoading}
            isError={isError && !apiCommunities}
            isEmpty={!isLoading && !isError && cities.length === 0}
            onRetry={refetch}
            isDarkMode={isDarkMode}
          />
          <View style={styles.grid}>
            {cities.map(item => (
              <CityCard
                key={item.slug}
                item={item}
                isDarkMode={isDarkMode}
                onPress={() => openCommunity(item)}
              />
            ))}
          </View>
        </Reveal>

        {/* How it works */}
        <Reveal scrollY={scrollY}>
          <SectionHeading overline="How it works" title="Tails Community" isDarkMode={isDarkMode} />
          <View style={styles.steps}>
            {STEPS.map((step, i) => (
              <Tilt3D
                key={step.title}
                style={[styles.card3D, styles.step, isDarkMode && styles.card3DDark]}
                max={10}>
                <Float distance={3} duration={2400} delay={i * 300}>
                  <View style={[styles.stepIcon, { backgroundColor: step.bg }]}>
                    <Text style={styles.stepEmoji}>{step.icon}</Text>
                  </View>
                </Float>
                <Text style={[styles.stepTitle, isDarkMode && styles.textLight]}>{step.title}</Text>
                <Text
                  style={[styles.cardDesc, styles.stepDesc, isDarkMode && styles.textMutedDark]}
                  numberOfLines={3}>
                  {step.desc}
                </Text>
              </Tilt3D>
            ))}
          </View>
        </Reveal>

        {/* Closing banner */}
        <Reveal scrollY={scrollY}>
          <Tilt3D style={styles.bannerWrap} max={6}>
            <LinearGradient
              colors={['#2E008B', DEEP_PURPLE, PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}>
              <View style={styles.flex}>
                <Text style={styles.bannerTitle}>Someone has already solved your pet problem</Text>
                <Text style={styles.bannerText}>Join pet parents sharing what they learned.</Text>
              </View>
              <TouchableOpacity activeOpacity={0.88} style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Browse 🐾</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Tilt3D>
        </Reveal>
      </Animated.ScrollView>

      <CommunityInfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />

      <DraggableFab
        label="Ask a Question"
        icon="help"
        onPress={() => navigation?.navigate?.('NewPostScreen', { type: 'QUESTION' })}
        minY={insets.top + s(60)}
        bottomGap={Math.max(insets.bottom, s(4)) + s(80)}
      />
    </View>
  );
};

const shadow = (color, opacity, radius, y) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
  elevation: Math.round(radius / 3),
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  content: { paddingTop: s(4) },
  flex: { flex: 1 },
  hidden: { opacity: 0 },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },

  // Same bevelled "3D" card edge as the Home screen cards
  card3D: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    ...shadow('#4A1D96', 0.1, 14, 6),
  },
  card3DDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },

  hero: { paddingHorizontal: GUTTER, marginBottom: s(12) },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: s(4),
    marginBottom: 0,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(8),
  },
  eyebrowDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  eyebrowDotWrap: { width: s(6), height: s(6), alignItems: 'center', justifyContent: 'center' },
  eyebrowDot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: '#FF4FB8' },
  pulseRing: { position: 'absolute' },
  eyebrowText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(9.5),
    letterSpacing: 0.7,
    color: DEEP_PURPLE,
  },
  heroTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    lineHeight: s(26),
    letterSpacing: -0.6,
    color: DEEP_PURPLE,
    marginBottom: s(4),
  },
  heroTitleAccent: { color: PURPLE },
  heroSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(17),
    color: '#6B7280',
    marginBottom: s(10),
  },
  lbWrap: { marginTop: s(2), borderRadius: s(20), ...shadow(DEEP_PURPLE, 0.28, 14, 7) },
  lbCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderRadius: s(20),
    paddingVertical: s(12),
    paddingHorizontal: s(12),
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderBottomWidth: 3,
    borderBottomColor: '#24086A',
  },
  lbGlow: {
    position: 'absolute',
    top: -s(50),
    right: -s(30),
    width: s(150),
    height: s(150),
    borderRadius: s(75),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  lbPaw: { position: 'absolute', right: s(40), bottom: -s(16), transform: [{ rotate: '-20deg' }] },
  lbTrophy: {
    width: s(46),
    height: s(46),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    ...shadow('#FFA500', 0.45, 10, 4),
  },
  lbTrophyEmoji: { fontSize: s(24) },
  lbText: { flex: 1 },
  lbOverline: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(8.5),
    letterSpacing: 1,
    color: '#FBBF24',
  },
  lbTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(18),
    lineHeight: s(22),
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  lbSubtitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    color: 'rgba(255,255,255,0.8)',
  },
  lbStack: { flexDirection: 'row', alignItems: 'center' },
  lbAvatar: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#A26BFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lbAvatarOverlap: { marginLeft: -s(9) },
  lbAvatarImage: { width: '100%', height: '100%' },
  lbAvatarInitial: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(11),
    color: '#FFFFFF',
  },
  lbArrow: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheen: { position: 'absolute', top: 0, bottom: 0, left: 0, width: s(40) },

  statsCard: {
    flexDirection: 'row',
    marginHorizontal: GUTTER,
    borderRadius: s(18),
    paddingVertical: s(10),
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: '#EDE8F8' },
  statDividerDark: { borderLeftColor: '#2E1654' },
  statValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(15),
    color: DEEP_PURPLE,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(10),
    color: '#9A8BA9',
    marginTop: s(1),
  },

  threadWrap: { marginHorizontal: GUTTER, marginTop: s(10) },
  thread: {
    borderRadius: s(22),
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  threadHeader: {
    paddingTop: s(8),
    paddingBottom: s(11),
    paddingHorizontal: s(12),
    overflow: 'hidden',
  },
  threadGlow: {
    position: 'absolute',
    width: s(150),
    height: s(150),
    borderRadius: s(75),
    top: -s(70),
    right: -s(30),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  threadPaw: {
    position: 'absolute',
    right: s(40),
    bottom: -s(18),
    transform: [{ rotate: '-20deg' }],
  },
  featuredEyebrow: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(8.5),
    letterSpacing: 1,
    color: '#FBBF24',
    marginBottom: s(6),
  },
  threadHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  threadHeaderIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(11),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadHeaderEmoji: { fontSize: s(17) },
  threadCommunity: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13.5),
    color: '#FFFFFF',
  },
  threadCommunityMeta: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10),
    color: 'rgba(255,255,255,0.78)',
  },
  topicTag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: s(3),
  },
  topicTagText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(9), color: '#FFFFFF' },

  threadBody: { paddingTop: s(12), paddingHorizontal: s(12), paddingBottom: s(10), gap: s(8) },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  avatar: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow('#FF9F1C', 0.35, 6, 3),
  },
  avatarText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    color: '#FFFFFF',
  },
  authorName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11.5),
    color: DEEP_PURPLE,
  },
  authorMeta: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(9.5),
    color: '#9A8BA9',
  },
  threadTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(15),
    lineHeight: s(20),
    letterSpacing: -0.3,
    color: DEEP_PURPLE,
  },
  quote: {
    backgroundColor: '#F8F6FF',
    borderLeftWidth: 3,
    borderLeftColor: PURPLE,
    borderRadius: s(8),
    paddingVertical: s(7),
    paddingHorizontal: s(10),
  },
  quoteDark: { backgroundColor: '#170A2E' },
  threadExcerpt: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11),
    lineHeight: s(16),
    color: '#6B7280',
  },

  answers: {
    backgroundColor: '#FAFBFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F0FF',
    paddingTop: s(10),
    paddingHorizontal: s(12),
    paddingBottom: s(4),
    gap: s(7),
  },
  answersDark: { backgroundColor: '#13072A', borderTopColor: '#2E1654' },
  answersLabelRow: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  answersLabel: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(9),
    letterSpacing: 0.9,
    color: '#9A8BA9',
  },
  answerCard: {
    flexDirection: 'row',
    gap: s(8),
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderRadius: s(12),
    paddingVertical: s(8),
    paddingHorizontal: s(10),
    marginBottom: s(3),
    ...shadow('#4A1D96', 0.06, 6, 2),
  },
  answerCardTeal: { borderLeftColor: '#00B894' },
  answerCardPurple: { borderLeftColor: PURPLE },
  answerCardDark: { backgroundColor: '#1E0E38' },
  answerAvatar: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerAvatarTeal: { backgroundColor: '#CCFBF1' },
  answerAvatarPurple: { backgroundColor: '#EDE8F8' },
  answerAvatarText: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(10.5) },
  answerAvatarTextTeal: { color: '#00A892' },
  answerAvatarTextPurple: { color: PURPLE },
  answerNameRow: { flexDirection: 'row', alignItems: 'center', gap: s(5), marginBottom: s(2) },
  answerName: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(11), color: DEEP_PURPLE },
  answerVotes: {
    marginLeft: 'auto',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(9.5),
    color: '#9A8BA9',
  },
  answerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10.5),
    lineHeight: s(15),
    color: '#4B4B6B',
  },
  verified: {
    backgroundColor: '#D1FAE5',
    borderRadius: s(8),
    paddingHorizontal: s(6),
    paddingVertical: s(1),
  },
  verifiedText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(8), color: '#065F46' },

  threadFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FAFBFF',
    paddingVertical: s(10),
    paddingHorizontal: s(12),
  },
  threadFooterDark: { backgroundColor: '#13072A' },
  countPills: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  countPill: {
    backgroundColor: '#F3EFFF',
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: s(4),
  },
  countPillDark: { backgroundColor: '#2E1654' },
  countPillHot: { backgroundColor: '#FEF3C7' },
  countPillText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(10), color: PURPLE },
  countPillHotText: { color: '#B45309' },

  sectionHeading: { marginHorizontal: GUTTER, marginTop: s(10), marginBottom: s(4) },
  overline: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#9A8BA9',
    lineHeight: s(14),
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: s(21),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: DEEP_PURPLE,
    lineHeight: s(24),
    letterSpacing: -0.84,
  },

  tiltFill: { flexGrow: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: GUTTER,
    paddingTop: s(2),
    paddingBottom: s(6),
  },
  gridItem: { width: GRID_CARD_WIDTH },
  sectionState: { alignItems: 'center', paddingVertical: s(24), gap: s(8) },
  sectionStateText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    color: '#6B7280',
  },
  tile: {
    borderRadius: s(20),
    padding: s(11),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255,255,255,0.6)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.12)',
    borderBottomWidth: s(4),
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  tileGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%' },
  tileWatermark: {
    position: 'absolute',
    right: -s(8),
    bottom: -s(12),
    fontSize: s(70),
    opacity: 0.14,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(8),
  },
  tileIcon: {
    width: s(38),
    height: s(38),
    borderRadius: s(13),
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileEmoji: { fontSize: s(19) },
  tileArrow: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13.5),
    lineHeight: s(17),
    letterSpacing: -0.3,
    color: '#FFFFFF',
    marginBottom: s(3),
  },
  tileDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10),
    lineHeight: s(14),
    color: 'rgba(255,255,255,0.82)',
    minHeight: s(28),
  },
  tilePills: { flexDirection: 'row', alignItems: 'center', gap: s(4), marginTop: s(9) },
  tilePill: {
    borderRadius: s(10),
    flexShrink: 1,
    paddingHorizontal: s(6),
    paddingVertical: s(3),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  tilePillText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(9.5),
    color: '#FFFFFF',
  },
  iconGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  iconTile: {
    width: s(38),
    height: s(38),
    borderRadius: s(13),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cardDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10),
    lineHeight: s(13),
    color: '#6B7280',
  },

  steps: { flexDirection: 'row', gap: s(8), paddingHorizontal: GUTTER },
  step: {
    flex: 1,
    alignItems: 'center',
    borderRadius: s(18),
    paddingVertical: s(10),
    paddingHorizontal: s(8),
  },
  stepIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(6),
  },
  stepEmoji: { fontSize: s(16) },
  stepTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(11.5),
    color: DEEP_PURPLE,
    marginBottom: s(2),
    textAlign: 'center',
  },
  stepDesc: { textAlign: 'center', fontSize: s(10) },

  bannerWrap: {
    marginHorizontal: GUTTER,
    marginTop: s(16),
    borderRadius: s(20),
    ...shadow(DEEP_PURPLE, 0.25, 14, 8),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderRadius: s(20),
    paddingVertical: s(12),
    paddingHorizontal: s(14),
  },
  bannerTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13),
    lineHeight: s(17),
    color: '#FFFFFF',
  },
  bannerText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    color: 'rgba(255,255,255,0.8)',
    marginTop: s(2),
  },
  bannerBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingVertical: s(7),
    paddingHorizontal: s(12),
  },
  bannerBtnText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(11.5),
    color: DEEP_PURPLE,
  },
});
