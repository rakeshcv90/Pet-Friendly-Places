import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Linking, Alert } from 'react-native';
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
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { usePawsport } from '../../hooks/useUser';
import {
  usePublicPet,
  usePublicPetMedia,
  usePetFollowState,
  useTogglePetFollow,
} from '../../hooks/usePublicPet';
import { getErrorMessage } from '../../services/api/apiClient';
import { Loader } from '../../components/common/Loader';
import { ErrorState } from '../Community/LoadingStates';
import { Enter } from '../Community/Motion';
import { rankFor, RANKS } from './LeaderboardScreen';
import { PawsportBook } from './PawsportBook';
import { AdventureViewer } from './AdventureViewer';

const GUTTER = s(15);
const PURPLE = '#7B2CFF';
const PINK = '#FF4FB8';
const DEEP_PURPLE = '#3B108F';
const INK = '#1A1A2E';
const MUTED = '#6B6B8A';
const SOFT = '#B0ABCA';
const LINE = '#EDE8F5';
const BANNER_HEIGHT = s(215);
const AVATAR = s(92);

const SOCIALS = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: '📸',
    url: v => `https://instagram.com/${v.replace('@', '')}`,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: '▶️',
    url: v => (v.startsWith('http') ? v : `https://youtube.com/@${v}`),
  },
  { key: 'twitter', label: 'X', icon: '🐦', url: v => `https://x.com/${v.replace('@', '')}` },
  {
    key: 'website',
    label: 'Website',
    icon: '🌐',
    url: v => (v.startsWith('http') ? v : `https://${v}`),
  },
];

const capitalize = value => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];
const formatMonth = iso => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};
const placeIcon = category =>
  /restaurant|cafe|caf\u00e9|dining/i.test(category || '') ? '🍽️' : '📍';

const Stat = ({ icon, value, label, isDarkMode }) => (
  <View style={[styles.stat, isDarkMode && styles.statDark]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, isDarkMode && styles.textLight]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Section = ({ title, isDarkMode, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <LinearGradient colors={[PINK, PURPLE]} style={styles.sectionBar} />
      <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>{title}</Text>
    </View>
    {children}
  </View>
);

// Public profile of a pet opened from the leaderboard: same data as the website's traveller page
export const PublicPetProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const slug = route?.params?.slug;
  const seed = route?.params?.entry || {};

  const petQuery = usePublicPet(slug);
  const pet = petQuery.data;
  const petId = pet?.id;
  const pawsport = usePawsport(slug).data;
  const media = usePublicPetMedia(petId).data || [];
  const follow = usePetFollowState(petId);
  const toggleFollow = useTogglePetFollow(petId);
  const [openMedia, setOpenMedia] = useState(null);

  const name = pet?.petName || seed.petName || '';
  const points = pet?.pointsTotal ?? seed.pts ?? 0;
  const rank = rankFor(points);
  const nextRank = RANKS.find(item => item.min > points);
  const stamps = Array.isArray(pawsport?.stamps) ? pawsport.stamps : [];
  const stampTotal = pawsport?.totalStamps ?? pet?.pawsportStamps ?? seed.stampCount ?? 0;
  const followerCount = follow.data?.followerCount ?? pet?.followerCount ?? 0;
  const following = !!follow.data?.viewerFollowing;
  const socials = SOCIALS.filter(item => pet?.socialLinks?.[item.key]);
  const breedLine = [capitalize(pet?.species || seed.species), pet?.breed || seed.breed]
    .filter(Boolean)
    .join(' · ');
  const aboutBits = [
    pet?.age ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'} old` : '',
    capitalize(pet?.gender),
  ].filter(Boolean);

  const onFollow = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in to follow', `Sign in to follow ${name || 'this pet'}.`);
      return;
    }
    toggleFollow.mutate(following, {
      onError: err =>
        Alert.alert(following ? 'Could not unfollow' : 'Could not follow', getErrorMessage(err)),
    });
  };

  const backButton = (
    <BackButton
      onPress={() => navigation.goBack()}
      style={[styles.backBtn, { top: Math.max(insets.top, s(12)) + s(6) }]}
    />
  );

  if (petQuery.isLoading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Loader fullScreen title="Loading profile…" subtitle="Fetching this pet's pawsport..." />
        {backButton}
      </View>
    );
  }

  if (petQuery.isError || !pet) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <ErrorState
          message="Could not load this profile"
          onRetry={petQuery.refetch}
          isDarkMode={isDarkMode}
        />
        {backButton}
      </View>
    );
  }

  const card = [styles.card, isDarkMode && styles.cardDark];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, s(20)) + s(30) }}>
        <View style={styles.banner}>
          {pet.bannerImageUrl ? (
            <FastImage
              source={{ uri: resolveImageUrl(pet.bannerImageUrl) }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <LinearGradient
              colors={['#2A0A6B', '#4A12B0', PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Ionicons
            name="paw"
            size={ms(110)}
            color="rgba(255,255,255,0.08)"
            style={styles.bannerPaw}
          />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(26,10,60,0.6)', 'rgba(26,10,60,0)', 'rgba(26,10,60,0.55)']}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <Enter index={0}>
          <View style={[card, styles.profileCard]}>
            <LinearGradient
              colors={[PINK, PURPLE, '#00C2A8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}>
              <View style={[styles.avatarInner, isDarkMode && styles.avatarInnerDark]}>
                {pet.profilePhotoUrl ? (
                  <FastImage
                    source={{ uri: resolveImageUrl(pet.profilePhotoUrl) }}
                    style={styles.avatar}
                  />
                ) : (
                  <LinearGradient
                    colors={[PURPLE, '#00C2A8']}
                    style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                )}
              </View>
            </LinearGradient>

            <Text style={[styles.name, isDarkMode && styles.textLight]}>{name}</Text>
            {!!breedLine && <Text style={styles.breed}>{breedLine}</Text>}
            <View style={[styles.rankChip, { backgroundColor: rank.bg }]}>
              <Text style={[styles.rankChipText, { color: rank.color }]}>
                {rank.emoji} {rank.name}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <Stat icon="🏆" value={points} label="points" isDarkMode={isDarkMode} />
              <Stat icon="🐾" value={stampTotal} label="stamps" isDarkMode={isDarkMode} />
              <Stat icon="❤️" value={followerCount} label="followers" isDarkMode={isDarkMode} />
            </View>

            <BouncyPressable
              activeScale={0.96}
              accessibilityLabel={following ? 'Unfollow' : 'Follow'}
              disabled={toggleFollow.isPending || follow.isLoading}
              onPress={onFollow}
              style={styles.followWrap}>
              {following ? (
                <View style={[styles.followBtn, styles.followingBtn]}>
                  <Feather name="check" size={ms(14)} color={PURPLE} />
                  <Text style={[styles.followText, { color: PURPLE }]}>Following</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={[PURPLE, PINK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.followBtn, styles.followGlow]}>
                  <Feather name="user-plus" size={ms(14)} color="#FFFFFF" />
                  <Text style={styles.followText}>Follow</Text>
                </LinearGradient>
              )}
            </BouncyPressable>

            {socials.length > 0 && (
              <View style={styles.socials}>
                {socials.map(item => (
                  <BouncyPressable
                    key={item.key}
                    activeScale={0.92}
                    accessibilityLabel={`${item.label} ${pet.socialLinks[item.key]}`}
                    onPress={() =>
                      Linking.openURL(item.url(pet.socialLinks[item.key])).catch(() => {})
                    }
                    style={styles.socialChip}>
                    <Text style={styles.socialIcon}>{item.icon}</Text>
                    <Text style={styles.socialLabel}>{item.label}</Text>
                  </BouncyPressable>
                ))}
              </View>
            )}
          </View>
        </Enter>

        {(!!pet.bio || aboutBits.length > 0) && (
          <Enter index={1}>
            <View style={styles.body}>
              <Section title={`About ${name}`} isDarkMode={isDarkMode}>
                <View style={card}>
                  {aboutBits.length > 0 && (
                    <View style={styles.pills}>
                      {aboutBits.map(bit => (
                        <View key={bit} style={styles.pill}>
                          <Text style={styles.pillText}>{bit}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {!!pet.bio && (
                    <Text style={[styles.bio, isDarkMode && styles.textMutedDark]}>{pet.bio}</Text>
                  )}
                </View>
              </Section>
            </View>
          </Enter>
        )}

        <Enter index={2}>
          <View style={styles.body}>
            <Section title="Rank" isDarkMode={isDarkMode}>
              <View style={[card, styles.rankCard]}>
                <View style={styles.rankTop}>
                  <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
                    <Text style={styles.rankBadgeEmoji}>{rank.emoji}</Text>
                  </View>
                  <View style={styles.rankTitleWrap}>
                    <Text style={[styles.rankLine, isDarkMode && styles.textLight]}>
                      {rank.emoji} {rank.name}
                    </Text>
                    <Text style={styles.rankPoints}>{points} points earned</Text>
                  </View>
                </View>
                {nextRank ? (
                  <>
                    <View style={styles.progressTrack}>
                      <LinearGradient
                        colors={[PURPLE, PINK]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(
                              100,
                              Math.max(4, ((points - rank.min) / (nextRank.min - rank.min)) * 100),
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.rankHint}>
                      {nextRank.min - points} more points to {nextRank.emoji} {nextRank.name}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.rankHint}>Top rank reached. Legendary!</Text>
                )}
              </View>
            </Section>
          </View>
        </Enter>

        <Enter index={3}>
          <View style={styles.body}>
            <PawsportBook
              name={name}
              breed={pet.breed}
              photoUrl={pet.profilePhotoUrl}
              emoji={pet.species === 'cat' ? '🐈' : '🐕'}
              stamps={stamps}
              isDarkMode={isDarkMode}
            />
          </View>
        </Enter>

        <Enter index={4}>
          <View style={styles.body}>
            <View style={[card, styles.placesCard]}>
              <View style={styles.placesHead}>
                <View style={styles.placesHeadText}>
                  <Text style={[styles.placesTitle, isDarkMode && styles.textLight]}>
                    🥇 Places Visited
                  </Text>
                  <Text style={styles.placesSub}>Places {name} has verified visited</Text>
                </View>
                <LinearGradient
                  colors={[PURPLE, '#00A8B5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.placesBadge}>
                  <Text style={styles.placesBadgeText}>{stampTotal}</Text>
                </LinearGradient>
              </View>
              {stamps.length === 0 ? (
                <Text style={styles.placesEmpty}>No places visited yet.</Text>
              ) : (
                <View style={styles.placesGrid}>
                  {stamps.map(stamp => (
                    <View
                      key={stamp.reviewId || stamp.listingSlug}
                      style={[styles.place, isDarkMode && styles.placeDark]}>
                      <Text style={styles.placeIcon}>{placeIcon(stamp.listingCategory)}</Text>
                      <Text
                        style={[styles.placeName, isDarkMode && styles.textLight]}
                        numberOfLines={4}>
                        {stamp.listingName}
                      </Text>
                      {!!stamp.listingCity && (
                        <Text style={styles.placeCity} numberOfLines={1}>
                          📍 {stamp.listingCity}
                        </Text>
                      )}
                      <View style={styles.placeFoot}>
                        <Text style={styles.placeStars}>
                          {'★'.repeat(Math.max(0, Math.min(5, Math.round(stamp.rating || 0))))}
                        </Text>
                        <Text style={styles.placeDate}>{formatMonth(stamp.awardedAt)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </Enter>

        {media.length > 0 && (
          <Enter index={5}>
            <View style={styles.body}>
              <Section title="Adventures" isDarkMode={isDarkMode}>
                <View style={styles.gallery}>
                  {media.map((item, index) => (
                    <BouncyPressable
                      key={item.id}
                      activeScale={0.97}
                      accessibilityLabel={`Open ${item.title || 'adventure'}`}
                      onPress={() => setOpenMedia(item)}
                      style={[styles.galleryItem, index === 0 && styles.galleryFeatured]}>
                      {item.mediaType === 'video' && !item.thumbnailUrl ? (
                        <View style={[styles.galleryImage, styles.videoPlaceholder]} />
                      ) : (
                        <FastImage
                          source={{ uri: resolveImageUrl(item.thumbnailUrl || item.url) }}
                          style={styles.galleryImage}
                          resizeMethod="resize"
                        />
                      )}
                      {item.mediaType === 'video' && (
                        <View pointerEvents="none" style={styles.playBadge}>
                          <Feather name="play" size={ms(18)} color="#FFFFFF" />
                        </View>
                      )}
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(20,8,48,0)', 'rgba(20,8,48,0.78)']}
                        style={styles.galleryFade}>
                        {!!item.title && (
                          <Text style={styles.galleryTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                        )}
                        <Text style={styles.galleryCounts}>
                          ❤️ {item.likeCount ?? 0} 💬 {item.commentCount ?? 0}
                        </Text>
                      </LinearGradient>
                    </BouncyPressable>
                  ))}
                </View>
              </Section>
            </View>
          </Enter>
        )}
      </ScrollView>
      {backButton}
      <AdventureViewer
        media={openMedia}
        isAuthenticated={isAuthenticated}
        isDarkMode={isDarkMode}
        onClose={() => setOpenMedia(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  containerDark: { backgroundColor: '#0F071D' },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },
  body: { paddingHorizontal: GUTTER, marginTop: s(18) },

  backBtn: { position: 'absolute', left: GUTTER },
  banner: { height: BANNER_HEIGHT, backgroundColor: DEEP_PURPLE, overflow: 'hidden' },
  bannerPaw: { position: 'absolute', right: -s(14), top: s(40), transform: [{ rotate: '18deg' }] },

  card: {
    backgroundColor: '#FFFFFF',
    borderColor: LINE,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderRadius: s(20),
    padding: s(14),
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: GUTTER,
    marginTop: -s(44),
    paddingTop: AVATAR / 2 + s(10),
  },

  avatarRing: {
    position: 'absolute',
    top: -AVATAR / 2 - s(5),
    width: AVATAR + s(10),
    height: AVATAR + s(10),
    borderRadius: (AVATAR + s(10)) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  avatarInner: { padding: s(3), borderRadius: (AVATAR + s(6)) / 2, backgroundColor: '#FFFFFF' },
  avatarInnerDark: { backgroundColor: '#1E0E38' },
  avatar: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, backgroundColor: LINE },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: AVATAR * 0.4,
    color: '#FFFFFF',
  },
  name: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(24),
    letterSpacing: -0.6,
    color: INK,
    textAlign: 'center',
  },
  breed: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    color: MUTED,
    marginTop: s(2),
    textAlign: 'center',
  },
  rankChip: {
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: s(5),
    marginTop: s(9),
  },
  rankChipText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(12) },

  statsRow: { flexDirection: 'row', alignSelf: 'stretch', gap: s(8), marginTop: s(16) },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F4FF',
    borderRadius: s(14),
    paddingVertical: s(10),
  },
  statDark: { backgroundColor: '#2A1450' },
  statIcon: { fontSize: s(15), marginBottom: s(2) },
  statValue: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(18), color: INK },
  statLabel: { fontFamily: theme.typography.fontFamily.regular, fontSize: s(10.5), color: SOFT },

  followWrap: { alignSelf: 'stretch', marginTop: s(14) },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(7),
    paddingVertical: s(12),
    borderRadius: s(26),
  },
  followGlow: {
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  followingBtn: { backgroundColor: '#F5F0FF', borderWidth: 1.5, borderColor: PURPLE },
  followText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(14),
    color: '#FFFFFF',
  },

  socials: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(8),
    marginTop: s(12),
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#F5F0FF',
    borderWidth: 1,
    borderColor: 'rgba(123,44,255,0.15)',
    borderRadius: s(16),
    paddingHorizontal: s(12),
    paddingVertical: s(6),
  },
  socialIcon: { fontSize: s(12) },
  socialLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11),
    color: DEEP_PURPLE,
  },

  section: {},
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: s(10) },
  sectionBar: { width: s(4), height: s(16), borderRadius: s(2) },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    letterSpacing: -0.3,
    color: INK,
  },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginBottom: s(8) },
  pill: {
    backgroundColor: '#F5F0FF',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: s(4),
  },
  pillText: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: s(11), color: PURPLE },
  bio: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(20),
    color: MUTED,
  },

  rankCard: { gap: s(2) },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
  rankBadge: {
    width: s(46),
    height: s(46),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeEmoji: { fontSize: s(24) },
  rankTitleWrap: { flex: 1 },
  rankLine: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(14.5), color: INK },
  rankPoints: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11),
    color: SOFT,
    marginTop: s(1),
  },
  progressTrack: {
    height: s(9),
    borderRadius: s(5),
    backgroundColor: LINE,
    marginTop: s(12),
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: s(5) },
  rankHint: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(11),
    color: MUTED,
    marginTop: s(8),
  },

  placesCard: { padding: s(14) },
  placesHead: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10) },
  placesHeadText: { flex: 1 },
  placesTitle: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(17), color: INK },
  placesSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11.5),
    color: MUTED,
    marginTop: s(2),
  },
  placesBadge: {
    minWidth: s(40),
    height: s(26),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(10),
  },
  placesBadgeText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13),
    color: '#FFFFFF',
  },
  placesEmpty: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12),
    color: SOFT,
    textAlign: 'center',
    paddingVertical: s(16),
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: s(10),
    marginTop: s(14),
  },
  place: {
    width: '48.5%',
    minHeight: s(138),
    backgroundColor: '#FAF7FF',
    borderColor: LINE,
    borderWidth: 1,
    borderRadius: s(16),
    padding: s(11),
  },
  placeDark: { backgroundColor: '#26124A', borderColor: '#2E1654' },
  placeIcon: { fontSize: s(18), marginBottom: s(8) },
  placeName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12),
    lineHeight: s(16),
    color: INK,
  },
  placeCity: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(10.5),
    color: MUTED,
    marginTop: s(4),
  },
  placeFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: s(8),
  },
  placeStars: { fontSize: s(10.5), letterSpacing: 1, color: '#F5B301' },
  placeDate: { fontFamily: theme.typography.fontFamily.regular, fontSize: s(10), color: SOFT },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: s(10),
  },
  galleryItem: {
    width: '48.5%',
    borderRadius: s(16),
    overflow: 'hidden',
    backgroundColor: LINE,
    shadowColor: DEEP_PURPLE,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  galleryFeatured: { width: '100%' },
  galleryImage: { width: '100%', aspectRatio: 1 },
  galleryFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: s(10),
    paddingTop: s(22),
    paddingBottom: s(8),
  },
  videoPlaceholder: { backgroundColor: '#1E0E38' },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: s(40),
    height: s(40),
    marginTop: -s(20),
    marginLeft: -s(20),
    borderRadius: s(20),
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryCounts: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(10),
    color: 'rgba(255,255,255,0.85)',
    marginTop: s(2),
  },
  galleryTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11.5),
    color: '#FFFFFF',
  },
});
