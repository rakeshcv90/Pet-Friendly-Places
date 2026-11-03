import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { useStore } from '../../store';
import {
  useCommunityPosts,
  useCommunities,
  useCommunityMembership,
} from '../../hooks/useCommunity';
import {
  TYPE_STYLES,
  shortDate,
  credentialLabel,
  initialsOf,
  avatarColorsFor,
  openCommunityGuidelines,
} from './utils';
import { PawLoader, SkeletonPost, ErrorState } from './LoadingStates';
import { Bob, Shine, Enter } from './Motion';
import { DraggableFab } from './DraggableFab';
import { NightSky } from './NightSky';
import { ModernConfirmModal } from '../Profile/components/ModernConfirmModal';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';
const PINK = '#FF4FB8';

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'QUESTION', label: '❓ Questions' },
  { key: 'DISCUSSION', label: '💬 Discussions' },
  { key: 'EVENT', label: '🎉 Events' },
  { key: 'GUIDE', label: '📖 Guides' },
];

const GUIDELINES = [
  'Be kind and constructive',
  'No spam or self-promotion',
  'Stay on topic',
  'Report anything that feels off',
];

const PostCard = ({ post, index, isDarkMode, onPress }) => {
  const typeStyle = TYPE_STYLES[post.type] || TYPE_STYLES.DISCUSSION;
  const credential = credentialLabel(post.authorVerifiedCredential);
  const avatar = avatarColorsFor(post.authorDisplayName);
  const isHot = post.upvoteCount >= 100;

  return (
    <Enter index={index}>
      <BouncyPressable
        activeScale={0.98}
        onPress={onPress}
        style={[
          styles.postCard,
          isDarkMode && styles.postCardDark,
          { shadowColor: typeStyle.color },
        ]}>
        <LinearGradient
          pointerEvents="none"
          colors={
            isDarkMode
              ? ['rgba(255,255,255,0)', `${typeStyle.color}26`]
              : ['#FFFFFF', `${typeStyle.color}14`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[typeStyle.color, `${typeStyle.color}66`]}
          style={styles.postAccent}
        />
        <View style={styles.postTopRow}>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: typeStyle.bg, borderColor: typeStyle.border },
            ]}>
            <Text style={[styles.typeBadgeText, { color: typeStyle.color }]}>
              {typeStyle.emoji} {typeStyle.label}
            </Text>
          </View>
          {isHot && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>🔥 Hot</Text>
            </View>
          )}
        </View>

        <Text style={[styles.postTitle, isDarkMode && styles.textLight]}>{post.title}</Text>

        <View style={[styles.postFooter, isDarkMode && styles.postFooterDark]}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: avatar.bg, borderColor: `${avatar.color}33` },
            ]}>
            <Text style={[styles.avatarText, { color: avatar.color }]}>
              {initialsOf(post.authorDisplayName)}
            </Text>
          </View>
          <View style={styles.authorBlock}>
            <View style={styles.authorLine}>
              <Text
                style={[styles.authorName, isDarkMode && styles.textMutedDark]}
                numberOfLines={1}>
                {post.authorDisplayName}
              </Text>
              {credential && (
                <View style={styles.verified}>
                  <Text style={styles.verifiedText}>✓ {credential}</Text>
                </View>
              )}
            </View>
            <Text style={styles.metaText}>{shortDate(post.createdAt)}</Text>
          </View>
          <View style={[styles.countPill, isDarkMode && styles.countPillDark]}>
            <Text style={styles.countPillText}>💬 {post.replyCount}</Text>
          </View>
          <View style={[styles.countPill, styles.countPillPaw]}>
            <Text style={[styles.countPillText, styles.countPillPawText]}>
              🐾 {post.upvoteCount}
            </Text>
          </View>
        </View>
      </BouncyPressable>
    </Enter>
  );
};

export const CommunityDetailScreen = ({ navigation, route }) => {
  const community = route?.params?.community || {};
  const isDarkMode = useStore(state => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('ALL');
  const { isMember, isAuthenticated, isPending, toggle } = useCommunityMembership(community.slug);
  const [modal, setModal] = useState({ visible: false });
  const showModal = config => setModal({ visible: true, ...config });
  const closeModal = () => setModal(prev => ({ ...prev, visible: false }));

  // Live counts, refreshed after joining or leaving
  const { data: liveCommunities } = useCommunities();
  const liveCommunity = liveCommunities?.find(item => item.slug === community.slug);
  const members = liveCommunity?.memberCount ?? community.members;
  const postCount = liveCommunity?.postCount ?? community.posts;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityPosts(community.slug);

  const allPosts = data?.pages?.flatMap(page => page?.posts || []) || [];
  const posts = filter === 'ALL' ? allPosts : allPosts.filter(post => post.type === filter);
  const countFor = key =>
    key === 'ALL' ? allPosts.length : allPosts.filter(post => post.type === key).length;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // One request per tap: the endpoint toggles membership, so never call it twice for one action
  const handleMembership = () => {
    if (isPending) {
      return;
    }
    if (!isAuthenticated) {
      showModal({
        type: 'progress',
        badge: 'SIGN IN REQUIRED',
        title: 'Sign in to join',
        subtitle: 'Sign in to your account to join communities and take part in the conversation.',
        confirmText: 'Got it',
        singleButton: true,
      });
      return;
    }
    const update = async () => {
      try {
        await toggle();
      } catch (e) {
        showModal({
          type: 'danger',
          badge: 'MEMBERSHIP',
          title: 'Something went wrong',
          subtitle:
            'We could not update your membership. Please check your connection and try again.',
          confirmText: 'OK',
          singleButton: true,
        });
      }
    };
    if (isMember) {
      showModal({
        type: 'danger',
        badge: 'COMMUNITY',
        title: `Leave ${community.title}?`,
        subtitle: 'You will stop seeing this community as a member. You can rejoin any time.',
        confirmText: 'Leave',
        cancelText: 'Stay',
        onConfirm: update,
      });
    } else {
      update();
    }
  };

  const handleOpenGuidelines = () => openCommunityGuidelines(navigation);

  const openNewPost = type => navigation.navigate('NewPostScreen', { community, type });

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={[DEEP_PURPLE, PURPLE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(8) }]}>
        {/* Solid status-bar colour at the very top, fading into the diagonal gradient below */}
        <LinearGradient
          pointerEvents="none"
          colors={[DEEP_PURPLE, 'rgba(59,16,143,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.heroTopFade, { height: insets.top + s(70) }]}
        />
        <NightSky topInset={insets.top} />

        <BouncyPressable
          activeScale={0.95}
          onPress={() => navigation.goBack()}
          style={styles.backLink}>
          <Feather name="chevron-left" size={ms(15)} color="rgba(255,255,255,0.8)" />
          <Text style={styles.backLinkText}>🐾 Tails Community</Text>
        </BouncyPressable>

        <View style={styles.titleRow}>
          <Bob style={styles.emojiTile} distance={4} duration={2400}>
            <Text style={styles.emojiTileText}>{community.icon}</Text>
          </Bob>
          <Text style={styles.heroTitle}>{community.title}</Text>
        </View>
        <Text style={styles.heroDesc}>{community.desc}</Text>

        <View style={styles.statTiles}>
          <View style={styles.statTile}>
            <Text style={styles.statTileIcon}>👥</Text>
            <View>
              <Text style={styles.statTileValue}>{members}</Text>
              <Text style={styles.statTileLabel}>Members</Text>
            </View>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileIcon}>📝</Text>
            <View>
              <Text style={styles.statTileValue}>{postCount}</Text>
              <Text style={styles.statTileLabel}>Posts</Text>
            </View>
          </View>
        </View>
        <Text style={styles.heroNote}>
          🔍 Every post here is reviewed by our team before it appears.
        </Text>

        <View style={styles.heroButtons}>
          <BouncyPressable
            activeScale={0.95}
            disabled={isPending}
            onPress={handleMembership}
            style={[styles.joinBtn, isMember && styles.joinBtnMember]}>
            {isPending ? (
              <ActivityIndicator size="small" color={isMember ? '#FFFFFF' : DEEP_PURPLE} />
            ) : (
              <Text style={[styles.joinBtnText, isMember && styles.joinBtnTextMember]}>
                {isMember ? 'Leave Community' : 'Join Community'}
              </Text>
            )}
          </BouncyPressable>
          <BouncyPressable
            activeScale={0.95}
            onPress={() => openNewPost('QUESTION')}
            style={styles.askBtn}>
            <Text style={styles.askBtnText}>+ Ask a question</Text>
            <Shine travel={s(150)} />
          </BouncyPressable>
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filters}>
        {FILTERS.map(item => {
          const active = item.key === filter;
          return (
            <BouncyPressable
              key={item.key}
              activeScale={0.94}
              onPress={() => setFilter(item.key)}
              style={styles.filterWrap}>
              {active ? (
                <LinearGradient
                  colors={[PURPLE, PINK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.filterChip, styles.filterChipActive]}>
                  <Text style={[styles.filterText, styles.filterTextActive]}>{item.label}</Text>
                  {allPosts.length > 0 && (
                    <View style={[styles.filterCount, styles.filterCountActive]}>
                      <Text style={[styles.filterCountText, styles.filterCountTextActive]}>
                        {countFor(item.key)}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.filterChip, isDarkMode && styles.filterChipDark]}>
                  <Text style={styles.filterText}>{item.label}</Text>
                  {allPosts.length > 0 && (
                    <View style={[styles.filterCount, isDarkMode && styles.filterCountDark]}>
                      <Text style={styles.filterCountText}>{countFor(item.key)}</Text>
                    </View>
                  )}
                </View>
              )}
            </BouncyPressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View>
          <PawLoader label="Loading posts…" isDarkMode={isDarkMode} />
          <SkeletonPost isDarkMode={isDarkMode} />
          <View style={styles.separator} />
          <SkeletonPost isDarkMode={isDarkMode} />
          <View style={styles.separator} />
          <SkeletonPost isDarkMode={isDarkMode} />
        </View>
      );
    }
    if (isError) {
      return (
        <ErrorState message="Could not load posts" onRetry={refetch} isDarkMode={isDarkMode} />
      );
    }
    const filterLabel = FILTERS.find(item => item.key === filter)?.label;
    return (
      <View style={styles.state}>
        <Text style={styles.emptyEmoji}>🐾</Text>
        <Text style={[styles.stateText, isDarkMode && styles.textMutedDark]}>
          {allPosts.length > 0 ? `No ${filterLabel} yet.` : 'No posts yet. Check back soon.'}
        </Text>
      </View>
    );
  };

  const renderFooter = () => (
    <View>
      {isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} color={PURPLE} /> : null}

      <View style={[styles.ctaCard, isDarkMode && styles.ctaCardDark]}>
        <Text style={styles.ctaEmoji}>{community.icon}</Text>
        <Text style={[styles.ctaTitle, isDarkMode && styles.textLight]}>
          Have something to share?
        </Text>
        <Text style={[styles.ctaText, isDarkMode && styles.textMutedDark]}>
          Ask a question or start a discussion in {community.title}.
        </Text>
        <BouncyPressable
          activeScale={0.95}
          onPress={() => openNewPost('QUESTION')}
          style={styles.ctaBtnWrap}>
          <LinearGradient
            colors={[PURPLE, PINK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>+ New Post 🐾</Text>
          </LinearGradient>
        </BouncyPressable>
      </View>

      <View style={[styles.guidelines, isDarkMode && styles.guidelinesDark]}>
        <Text style={[styles.guidelinesTitle, isDarkMode && styles.textLight]}>
          🤝 Community guidelines
        </Text>
        {GUIDELINES.map(rule => (
          <View key={rule} style={styles.ruleRow}>
            <Text style={styles.ruleBullet}>•</Text>
            <Text style={[styles.ruleText, isDarkMode && styles.textMutedDark]}>{rule}</Text>
          </View>
        ))}
        <BouncyPressable
          activeScale={0.96}
          onPress={handleOpenGuidelines}
          style={styles.fullGuidelines}>
          <Text style={styles.fullGuidelinesText}>Read full guidelines →</Text>
        </BouncyPressable>
      </View>

      <BouncyPressable
        activeScale={0.96}
        onPress={() => navigation.goBack()}
        style={[styles.allBtn, isDarkMode && styles.allBtnDark]}>
        <Feather name="arrow-left" size={ms(14)} color={PURPLE} />
        <Text style={styles.allBtnText}>All Communities</Text>
      </BouncyPressable>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} translucent={false} />

      <Ionicons name="paw" size={ms(110)} color="rgba(255,79,184,0.05)" style={styles.pawMark} />

      <FlatList
        data={posts}
        keyExtractor={post => String(post.id)}
        renderItem={({ item, index }) => (
          <PostCard
            post={item}
            index={index}
            isDarkMode={isDarkMode}
            onPress={() =>
              navigation.navigate('CommunityPostDetailScreen', {
                slug: item.slug,
                title: item.title,
              })
            }
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={Separator}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor="#FFFFFF"
            colors={[PURPLE]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, s(20)) + s(80) }}
      />

      <DraggableFab
        label="New Post"
        icon="create"
        badge="+"
        onPress={() => openNewPost('QUESTION')}
        minY={insets.top + s(60)}
        bottomGap={Math.max(insets.bottom, s(12)) + s(12)}
      />

      <ModernConfirmModal
        visible={modal.visible}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        subtitle={modal.subtitle}
        badge={modal.badge}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        singleButton={modal.singleButton}
        isDarkMode={isDarkMode}
      />

      {/* Keeps the status bar area solid purple while the list scrolls beneath it */}
      <View pointerEvents="none" style={[styles.statusCover, { height: insets.top }]} />
    </View>
  );
};

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },
  statusCover: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: DEEP_PURPLE },
  pawMark: {
    position: 'absolute',
    right: -s(20),
    bottom: s(160),
    transform: [{ rotate: '-20deg' }],
  },
  separator: { height: s(10) },

  hero: {
    paddingHorizontal: s(15),
    paddingBottom: s(18),
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
  },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(2),
    marginBottom: s(8),
    marginLeft: -s(4),
  },
  backLinkText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: 'rgba(255,255,255,0.78)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: s(8),
    paddingRight: s(70),
  },
  emojiTile: {
    width: s(46),
    height: s(46),
    borderRadius: s(15),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emojiTileText: { fontSize: s(24) },
  heroTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    lineHeight: s(27),
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  heroDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(18),
    color: 'rgba(255,255,255,0.88)',
    marginBottom: s(12),
  },
  statTiles: { flexDirection: 'row', gap: s(8) },
  statTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.35)',
    borderRadius: s(16),
    paddingVertical: s(8),
    paddingHorizontal: s(14),
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statTileIcon: { fontSize: s(17) },
  statTileValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    lineHeight: s(19),
    color: '#FFFFFF',
  },
  statTileLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(9.5),
    color: 'rgba(255,255,255,0.75)',
  },
  heroNote: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10),
    color: 'rgba(255,255,255,0.58)',
    marginTop: s(8),
  },
  heroButtons: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(12) },
  joinBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingVertical: s(9),
    paddingHorizontal: s(18),
    borderBottomWidth: 3,
    borderBottomColor: '#DDD3F2',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  joinBtnMember: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(255,255,255,0.35)',
    shadowOpacity: 0,
    elevation: 0,
  },
  joinBtnText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    color: DEEP_PURPLE,
  },
  joinBtnTextMember: { color: '#FFFFFF' },
  askBtn: {
    backgroundColor: PINK,
    borderRadius: s(20),
    paddingVertical: s(9),
    paddingHorizontal: s(16),
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: '#C21F8A',
    shadowColor: PINK,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  askBtnText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12),
    color: '#FFFFFF',
  },

  filtersScroll: { flexGrow: 0 },
  filters: { paddingHorizontal: s(15), paddingVertical: s(12), gap: s(8) },
  filterWrap: { borderRadius: s(18) },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDD6FE',
    borderWidth: 1.5,
    borderRadius: s(18),
    paddingVertical: s(6),
    paddingHorizontal: s(14),
  },
  filterChipDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  filterChipActive: {
    borderColor: PURPLE,
    shadowColor: PINK,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  filterCount: {
    minWidth: s(17),
    height: s(17),
    borderRadius: s(9),
    backgroundColor: '#F3EFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
    marginLeft: s(6),
  },
  filterCountDark: { backgroundColor: '#2E1654' },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(9.5),
    color: PURPLE,
  },
  filterCountTextActive: { color: '#FFFFFF' },
  filterText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(11.5), color: PURPLE },
  filterTextActive: { color: '#FFFFFF' },

  postCard: {
    marginHorizontal: s(15),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderLeftWidth: 1,
    borderLeftColor: '#F3EFE6',
    overflow: 'hidden',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    borderRadius: s(16),
    paddingTop: s(12),
    paddingHorizontal: s(16),
    paddingBottom: s(10),
    shadowColor: '#4A1D96',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  postAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: s(5) },
  postCardDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(7),
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: s(12),
    paddingHorizontal: s(9),
    paddingVertical: s(2),
  },
  typeBadgeText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(10) },
  hotBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: s(2),
  },
  hotBadgeText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(9.5),
    color: '#B45309',
  },
  postTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(14),
    lineHeight: s(20),
    letterSpacing: -0.2,
    color: DEEP_PURPLE,
    marginBottom: s(10),
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    borderTopWidth: 1,
    borderTopColor: '#F3F0FF',
    paddingTop: s(9),
  },
  postFooterDark: { borderTopColor: '#2E1654' },
  avatar: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(9.5) },
  authorBlock: { flex: 1 },
  authorLine: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  authorName: {
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11),
    color: '#4B5563',
  },
  verified: {
    backgroundColor: '#D1FAE5',
    borderRadius: s(8),
    paddingHorizontal: s(5),
    paddingVertical: s(1),
  },
  verifiedText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(8), color: '#065F46' },
  metaText: { fontFamily: theme.typography.fontFamily.medium, fontSize: s(10), color: '#9CA3AF' },
  countPill: {
    backgroundColor: '#F3EFFF',
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: s(3),
  },
  countPillDark: { backgroundColor: '#2E1654' },
  countPillPaw: { backgroundColor: '#FCE7F3' },
  countPillText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(10), color: PURPLE },
  countPillPawText: { color: '#BE185D' },

  state: { alignItems: 'center', paddingVertical: s(36), gap: s(8) },
  stateText: { fontFamily: theme.typography.fontFamily.medium, fontSize: s(12), color: '#6B7280' },
  emptyEmoji: { fontSize: s(30) },
  footerLoader: { paddingVertical: s(14) },

  ctaCard: {
    alignItems: 'center',
    marginHorizontal: s(15),
    marginTop: s(18),
    backgroundColor: '#FFFFFF',
    borderColor: '#EDE8F8',
    borderWidth: 1.5,
    borderRadius: s(18),
    padding: s(16),
    shadowColor: PURPLE,
    shadowOpacity: 0.09,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ctaCardDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  ctaEmoji: { fontSize: s(30), marginBottom: s(4) },
  ctaTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(15),
    color: DEEP_PURPLE,
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11.5),
    lineHeight: s(17),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: s(2),
    marginBottom: s(12),
  },
  ctaBtnWrap: {
    alignSelf: 'stretch',
    borderRadius: s(12),
    shadowColor: PINK,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaBtn: {
    alignItems: 'center',
    borderRadius: s(12),
    paddingVertical: s(12),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.16)',
  },
  ctaBtnText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(13),
    color: '#FFFFFF',
  },

  guidelines: {
    marginHorizontal: s(15),
    marginTop: s(18),
    backgroundColor: '#FFFFFF',
    borderColor: '#EDE8F8',
    borderWidth: 1.5,
    borderRadius: s(16),
    padding: s(14),
    gap: s(4),
    shadowColor: PURPLE,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fullGuidelines: { alignSelf: 'flex-start', marginTop: s(8), paddingVertical: s(2) },
  fullGuidelinesText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11.5),
    color: PURPLE,
  },
  guidelinesDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
  guidelinesTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12.5),
    color: '#1A1A2E',
    marginBottom: s(4),
  },
  ruleRow: { flexDirection: 'row', gap: s(6) },
  ruleBullet: { fontSize: s(11.5), color: PURPLE },
  ruleText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(11.5),
    lineHeight: s(18),
    color: '#6B7280',
  },

  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginHorizontal: s(15),
    marginTop: s(12),
    backgroundColor: '#FFFFFF',
    borderColor: PURPLE,
    borderWidth: 2,
    borderRadius: s(14),
    paddingVertical: s(11),
  },
  allBtnDark: { backgroundColor: '#1E0E38' },
  allBtnText: { fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(13), color: PURPLE },
});
