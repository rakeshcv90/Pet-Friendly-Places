import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from '../../components/common/FastImage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { getItem, setItem, STORAGE_KEYS } from '../../services/storage/storage';
import { useCommunityPost, useAcceptReply, useCreateReply } from '../../hooks/useCommunity';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import {
  TYPE_STYLES,
  timeAgo,
  credentialLabel,
  cleanText,
  initialsOf,
  avatarColorsFor,
} from './utils';
import { PawLoader, SkeletonPost, ErrorState } from './LoadingStates';
import { Enter } from './Motion';
import { ReplyComposer } from './ReplyComposer';
import { ReplyActionBar, InlineReplyForm, ReportModal } from './ReplyActions';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';
const PINK = '#FF4FB8';
const MAX_DEPTH = 2;
// Replies are moderated, so one you send waits on this device until the server lists it
const PENDING_KEEP_MS = 7 * 24 * 60 * 60 * 1000;

const readPending = key => {
  const all = getItem(STORAGE_KEYS.COMMUNITY_PENDING_REPLIES, true) || {};
  const now = Date.now();
  return (all[key] || []).filter(
    reply => now - new Date(reply.createdAt).getTime() < PENDING_KEEP_MS,
  );
};

const writePending = (key, replies) => {
  const all = getItem(STORAGE_KEYS.COMMUNITY_PENDING_REPLIES, true) || {};
  if (replies.length) {
    all[key] = replies;
  } else {
    delete all[key];
  }
  setItem(STORAGE_KEYS.COMMUNITY_PENDING_REPLIES, all);
};

// Flattens replies into display order, tracking nesting depth (orphans become top-level)
const buildThread = replies => {
  const ids = new Set(replies.map(reply => reply.id));
  const children = {};
  replies.forEach(reply => {
    const key = reply.parentReplyId && ids.has(reply.parentReplyId) ? reply.parentReplyId : 0;
    (children[key] = children[key] || []).push(reply);
  });

  const out = [];
  const walk = (parentKey, depth) => {
    (children[parentKey] || []).forEach(reply => {
      out.push({ ...reply, depth: Math.min(depth, MAX_DEPTH) });
      walk(reply.id, depth + 1);
    });
  };
  walk(0, 0);
  return out;
};

const AuthorRow = ({ name, credential, createdAt, size = 26, light, isDarkMode }) => {
  const label = credentialLabel(credential);
  const colors = avatarColorsFor(name);
  return (
    <View style={styles.authorRow}>
      <View
        style={[
          styles.avatar,
          {
            width: s(size),
            height: s(size),
            borderRadius: s(size / 2),
            backgroundColor: colors.bg,
            borderColor: light ? 'rgba(255,255,255,0.8)' : `${colors.color}33`,
          },
        ]}>
        <Text style={[styles.avatarText, { color: colors.color, fontSize: s(size * 0.38) }]}>
          {initialsOf(name)}
        </Text>
      </View>
      <View style={styles.flex}>
        <View style={styles.authorNameRow}>
          <Text
            style={[styles.authorName, light && styles.textLight, isDarkMode && styles.textLight]}
            numberOfLines={1}>
            {name}
          </Text>
          {label && (
            <View style={styles.verified}>
              <Text style={styles.verifiedText}>✓ {label}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.metaText, light && styles.metaLight]}>{timeAgo(createdAt)}</Text>
      </View>
    </View>
  );
};

const StatItem = ({ icon, value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const PostDetailScreen = ({ navigation, route }) => {
  const { slug, title: routeTitle } = route?.params || {};
  const isDarkMode = useStore(state => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const { data, isLoading, isError, refetch, isRefetching } = useCommunityPost(slug);
  const acceptReply = useAcceptReply(slug);
  const createReply = useCreateReply(slug);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const user = useStore(state => state.user);
  const pendingKey = `${user?.id ?? user?.email ?? 'anon'}:${slug}`;
  const [pendingReplies, setPendingReplies] = useState(() => readPending(pendingKey));

  useEffect(() => {
    writePending(pendingKey, pendingReplies);
  }, [pendingKey, pendingReplies]);

  // Once the server lists a reply with the same text, it is approved and no longer pending
  useEffect(() => {
    const approved = new Set((data?.replies || []).map(reply => reply.body.trim()));
    if (pendingReplies.some(reply => approved.has(reply.body))) {
      setPendingReplies(prev => prev.filter(reply => !approved.has(reply.body)));
    }
  }, [data?.replies, pendingReplies]);
  const [actionError, setActionError] = useState(null);

  const handleAccept = async replyId => {
    setAcceptingId(replyId);
    setActionError(null);
    try {
      await acceptReply.mutateAsync(replyId);
    } catch (e) {
      setActionError(e?.response?.data?.error ?? 'Could not accept this answer. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  const post = data?.post;
  const thread = useMemo(() => buildThread(data?.replies || []), [data?.replies]);
  // The API only lists approved replies, so a reply you just sent is shown from this device, marked
  // as pending, until a moderator approves it and it arrives from the server
  const displayThread = useMemo(() => {
    const approvedBodies = new Set((data?.replies || []).map(reply => reply.body.trim()));
    const name = user?.name || user?.displayName || user?.display_name || user?.full_name || 'You';
    const mine = pendingReplies
      .filter(reply => !approvedBodies.has(reply.body))
      .map(reply => ({
        ...reply,
        pending: true,
        isAccepted: false,
        upvoteCount: 0,
        authorDisplayName: name,
        createdAt: reply.createdAt,
      }));
    const out = [...thread];
    mine.forEach(reply => {
      const parentIndex = reply.parentReplyId
        ? out.findIndex(item => item.id === reply.parentReplyId)
        : -1;
      if (parentIndex >= 0) {
        out.splice(parentIndex + 1, 0, {
          ...reply,
          depth: Math.min(out[parentIndex].depth + 1, MAX_DEPTH),
        });
      } else {
        out.push({ ...reply, depth: 0 });
      }
    });
    return out;
  }, [thread, pendingReplies, data?.replies, user]);

  // Called by the reply forms on submit: makes the API call, then records the reply as pending
  const handleSubmitted = async ({ body, parentReplyId }) => {
    const data = await createReply.mutateAsync({ body, parentReplyId });
    if (data && !data.error && typeof data.id === 'number' && !/^approved$/i.test(data.status || '')) {
      setPendingReplies(prev => [
        ...prev,
        { id: data.id, status: data.status, body, parentReplyId, createdAt: new Date().toISOString() },
      ]);
    }
    return data;
  };
  const typeStyle = TYPE_STYLES[post?.type] || TYPE_STYLES.DISCUSSION;

  const renderHero = () => (
    <LinearGradient
      colors={[DEEP_PURPLE, PURPLE]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(6) }]}>
      {/* Soft glow orbs and a faint paw instead of busy sky details */}
      <View pointerEvents="none" style={styles.orbLarge} />
      <View pointerEvents="none" style={styles.orbSmall} />
      <Text pointerEvents="none" style={styles.heroPaw}>
        🐾
      </Text>

      <View style={styles.topBar}>
        <BouncyPressable
          activeScale={0.88}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
          style={styles.backBtn}>
          <Ionicons name="chevron-back" size={ms(20)} color="#FFFFFF" />
        </BouncyPressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {post ? 'Tails Community' : routeTitle || 'Post'}
        </Text>
        {post ? (
          <View
            style={[
              styles.heroBadge,
              { backgroundColor: typeStyle.bg, shadowColor: typeStyle.color },
            ]}>
            <Text style={[styles.heroBadgeText, { color: typeStyle.color }]}>
              {typeStyle.emoji} {typeStyle.label.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {post ? (
        <View style={styles.heroBody}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <AuthorRow
            name={post.authorDisplayName}
            credential={post.authorVerifiedCredential}
            createdAt={post.createdAt}
            size={32}
            light
          />
          <View style={styles.statBar}>
            <StatItem icon="💬" value={post.replyCount} label="replies" />
            <View style={styles.statDivider} />
            <StatItem icon="👍" value={post.upvoteCount} label="upvotes" />
            <View style={styles.statDivider} />
            <StatItem icon="👁" value={post.viewCount} label="views" />
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.content}>
          <PawLoader label="Loading discussion…" isDarkMode={isDarkMode} />
          <SkeletonPost isDarkMode={isDarkMode} />
          <View style={styles.skeletonGap} />
          <SkeletonPost isDarkMode={isDarkMode} />
        </View>
      );
    }
    if (isError || !post) {
      return (
        <View style={styles.content}>
          <ErrorState
            message="Could not load this post"
            onRetry={refetch}
            isDarkMode={isDarkMode}
          />
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <View style={[styles.card3D, styles.postCard, isDarkMode && styles.card3DDark]}>
          <LinearGradient
            pointerEvents="none"
            colors={[typeStyle.color, PINK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postAccent}
          />
          <Text style={[styles.cardLabel, { color: typeStyle.color }]}>
            ✦ THE {typeStyle.label.toUpperCase()}
          </Text>
          {post.imageUrl ? (
            <FastImage
              source={{ uri: resolveImageUrl(post.imageUrl) }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.bodyRow}>
            <View style={[styles.quoteBar, { backgroundColor: `${typeStyle.color}55` }]} />
            <Text style={[styles.postBodyText, isDarkMode && styles.textMutedDark]}>
              {cleanText(post.body)}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.overline}>Discussion</Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>
              {thread.length} {thread.length === 1 ? 'Reply' : 'Replies'}
            </Text>
          </View>
        </View>

        {actionError ? (
          <Text accessibilityRole="alert" style={styles.actionError}>
            {actionError}
          </Text>
        ) : null}

        {displayThread.length === 0 ? (
          <View style={[styles.card3D, styles.emptyCard, isDarkMode && styles.card3DDark]}>
            <Text style={styles.emptyEmoji}>🐾</Text>
            <Text style={[styles.stateText, isDarkMode && styles.textMutedDark]}>
              No replies yet.
            </Text>
          </View>
        ) : (
          displayThread.map((reply, index) => (
            <Enter key={reply.id} index={index}>
              <View style={{ marginLeft: s(16) * reply.depth }}>
                <View style={styles.replyRow}>
                  {reply.depth > 0 ? <View style={styles.threadLine} /> : null}
                  <View
                    style={[
                      styles.card3D,
                      styles.replyCard,
                      isDarkMode && styles.card3DDark,
                      reply.isAccepted && styles.replyAccepted,
                      reply.pending && styles.replyPending,
                    ]}>
                    {reply.isAccepted ? (
                      <LinearGradient
                        pointerEvents="none"
                        colors={['rgba(35,179,111,0.14)', 'rgba(35,179,111,0)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                    {reply.pending ? (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>⏳ Pending review</Text>
                      </View>
                    ) : null}
                    {reply.isAccepted && (
                      <LinearGradient
                        colors={['#23B36F', '#16A085']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.acceptedBadge}>
                        <Text style={styles.acceptedText}>✓ Accepted answer</Text>
                      </LinearGradient>
                    )}
                    <AuthorRow
                      name={reply.authorDisplayName}
                      credential={reply.authorVerifiedCredential}
                      createdAt={reply.createdAt}
                      size={26}
                      isDarkMode={isDarkMode}
                    />
                    <Text style={[styles.replyText, isDarkMode && styles.textMutedDark]}>
                      {cleanText(reply.body)}
                    </Text>
                    {reply.upvoteCount > 0 && (
                      <View style={styles.helpfulPill}>
                        <Text style={styles.helpfulText}>👍 {reply.upvoteCount} helpful</Text>
                      </View>
                    )}
                    {reply.pending ? null : (
                      <ReplyActionBar
                        onAccept={
                          isAuthenticated &&
                          post.type === 'QUESTION' &&
                          !reply.isAccepted &&
                          !reply.parentReplyId
                            ? () => handleAccept(reply.id)
                            : undefined
                        }
                        accepting={acceptingId === reply.id}
                        onReply={
                          isAuthenticated && !reply.parentReplyId
                            ? () => setReplyingTo(replyingTo === reply.id ? null : reply.id)
                            : undefined
                        }
                        onReport={() => setReportTarget({ type: 'reply', id: reply.id })}
                      />
                    )}
                  </View>
                </View>
                {replyingTo === reply.id ? (
                  <InlineReplyForm
                    parentReplyId={reply.id}
                    isDarkMode={isDarkMode}
                    onCancel={() => setReplyingTo(null)}
                    onSubmit={handleSubmitted}
                    submitting={createReply.isPending}
                  />
                ) : null}
              </View>
            </Enter>
          ))
        )}

        <ReplyComposer
          hasReplies={displayThread.length > 0}
          isDarkMode={isDarkMode}
          onSubmit={handleSubmitted}
          submitting={createReply.isPending}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} translucent={false} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#FFFFFF"
              colors={[PURPLE]}
            />
          }
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, s(20)) + s(20) }}>
          {renderHero()}
          {renderBody()}
        </ScrollView>
      </KeyboardAvoidingView>

      <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },
  textLight: { color: '#FFFFFF' },
  textMutedDark: { color: '#94A3B8' },

  hero: {
    paddingHorizontal: s(16),
    paddingBottom: s(38),
    overflow: 'hidden',
    borderBottomLeftRadius: s(30),
    borderBottomRightRadius: s(30),
  },
  orbLarge: {
    position: 'absolute',
    top: -s(50),
    right: -s(40),
    width: s(190),
    height: s(190),
    borderRadius: s(95),
    backgroundColor: 'rgba(255,79,184,0.22)',
  },
  orbSmall: {
    position: 'absolute',
    bottom: -s(30),
    left: -s(30),
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: 'rgba(162,107,255,0.3)',
  },
  heroPaw: { position: 'absolute', right: s(10), bottom: s(34), fontSize: s(90), opacity: 0.08 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: s(16) },
  backBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12),
    color: 'rgba(255,255,255,0.8)',
  },
  heroBody: { gap: s(14) },
  heroBadge: {
    borderRadius: s(12),
    paddingHorizontal: s(11),
    paddingVertical: s(4),
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  heroBadgeText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(10),
    letterSpacing: 1,
  },
  postTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(19),
    lineHeight: s(25),
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.3)',
    borderRadius: s(16),
    paddingVertical: s(9),
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: s(5) },
  statDivider: { width: 1, height: s(16), backgroundColor: 'rgba(255,255,255,0.25)' },
  statIcon: { fontSize: s(12) },
  statValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(12.5),
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(9.5),
    color: 'rgba(255,255,255,0.75)',
  },

  content: { paddingHorizontal: s(15), marginTop: -s(22) },

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
    shadowColor: '#4A1D96',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  card3DDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },

  postCard: {
    borderRadius: s(22),
    padding: s(16),
    paddingTop: s(18),
    gap: s(12),
    overflow: 'hidden',
  },
  postAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: s(4) },
  cardLabel: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(9.5),
    letterSpacing: 1.2,
  },
  bodyRow: { flexDirection: 'row', gap: s(10) },
  quoteBar: { width: s(3), borderRadius: s(2) },
  postImage: { width: '100%', height: s(190), borderRadius: s(14) },
  postBodyText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(13),
    lineHeight: s(21),
    color: '#4B4B6B',
  },
  metaText: { fontFamily: theme.typography.fontFamily.semiBold, fontSize: s(10), color: '#9A8BA9' },
  metaLight: { color: 'rgba(255,255,255,0.7)' },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  avatar: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: theme.typography.fontFamily.extraBold },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  authorName: {
    flexShrink: 1,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12),
    color: DEEP_PURPLE,
  },
  verified: {
    backgroundColor: '#D1FAE5',
    borderRadius: s(8),
    paddingHorizontal: s(6),
    paddingVertical: s(1),
  },
  verifiedText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(8.5),
    color: '#065F46',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: s(8),
    marginBottom: s(10),
  },
  overline: {
    marginTop: s(10),
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

  replyRow: { marginBottom: s(10), flexDirection: 'row' },
  threadLine: {
    width: s(3),
    borderRadius: s(2),
    backgroundColor: '#DDD6FE',
    marginRight: s(8),
    marginLeft: s(2),
  },
  replyCard: { flex: 1, borderRadius: s(18), padding: s(13), gap: s(8), overflow: 'hidden' },
  replyPending: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: s(3),
  },
  pendingText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(9.5),
    color: '#B45309',
  },
  replyAccepted: {
    borderTopColor: '#23B36F',
    borderLeftColor: '#23B36F',
    borderRightColor: '#23B36F',
    borderBottomColor: '#23B36F',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 3.5,
    shadowColor: '#23B36F',
    shadowOpacity: 0.3,
  },
  acceptedBadge: {
    alignSelf: 'flex-start',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: s(3),
  },
  acceptedText: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(9.5),
    color: '#FFFFFF',
  },
  replyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#4B4B6B',
  },
  helpfulPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3EFFF',
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: s(3),
  },
  helpfulText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(9.5), color: PURPLE },
  actionError: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: '#B91C1C',
    marginBottom: s(8),
  },
  skeletonGap: { height: s(10) },

  emptyCard: { borderRadius: s(18), alignItems: 'center', paddingVertical: s(22), gap: s(6) },
  emptyEmoji: { fontSize: s(26), opacity: 0.6 },
  stateText: { fontFamily: theme.typography.fontFamily.medium, fontSize: s(12), color: '#6B7280' },
});
