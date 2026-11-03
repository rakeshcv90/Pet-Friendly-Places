import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { INITIAL_COMMUNITY_POSTS } from './communityData';

const getCategoryMeta = categoryName => {
  switch (categoryName) {
    case 'Health & Vet Advice':
    case 'Health & Care':
      return {
        accent: '#EC4899',
        border: '#FBCFE8',
        borderDark: '#4A1D34',
        badgeBg: '#FDF2F8',
        badgeBgDark: '#381628',
        text: '#DB2777',
      };
    case 'Cafes & Dog Parks':
    case 'Places & Meetups':
    case 'Dog Parks':
      return {
        accent: '#06B6D4',
        border: '#BAE6FD',
        borderDark: '#133543',
        badgeBg: '#F0F9FF',
        badgeBgDark: '#102B37',
        text: '#0284C7',
      };
    case 'Food & Nutrition':
      return {
        accent: '#F59E0B',
        border: '#FDE68A',
        borderDark: '#452A12',
        badgeBg: '#FEF3C7',
        badgeBgDark: '#38220F',
        text: '#D97706',
      };
    case 'Training & Behavior':
    case 'Training':
      return {
        accent: '#10B981',
        border: '#A7F3D0',
        borderDark: '#133E2B',
        badgeBg: '#ECFDF5',
        badgeBgDark: '#0F2F21',
        text: '#059669',
      };
    case 'Travel & Road Trips':
    case 'Travel & Trips':
    default:
      return {
        accent: '#7C3AED',
        border: '#DDD6FE',
        borderDark: '#341852',
        badgeBg: '#F5F3FF',
        badgeBgDark: '#27104B',
        text: '#7C3AED',
      };
  }
};

export const CommunityPostsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const storeUser = useStore(state => state.user);
  const userName = storeUser?.name || storeUser?.displayName || 'Rakesh Rao';

  const initialTab = route?.params?.initialTab || 'all';
  const [activeTab, setActiveTab] = useState(initialTab); // 'all' | 'posts' | 'replies'
  const [posts, setPosts] = useState(INITIAL_COMMUNITY_POSTS);
  const [likedPosts, setLikedPosts] = useState({});

  // Compose Modal State
  const [composeModalVisible, setComposeModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Dog Parks');
  const [newLocation, setNewLocation] = useState('Bangalore, Karnataka');
  const [composeError, setComposeError] = useState('');

  // Handle Like Toggle
  const handleToggleLike = useCallback(postId => {
    setLikedPosts(prev => {
      const isCurrentlyLiked = !!prev[postId];
      return { ...prev, [postId]: !isCurrentlyLiked };
    });
  }, []);

  // Filtered Posts List (Tabs: All | Posts | Replies)
  const filteredPosts = useMemo(() => {
    return posts.filter(item => {
      if (activeTab === 'posts' && item.type !== 'post') return false;
      if (activeTab === 'replies' && item.type !== 'reply') return false;
      return true;
    });
  }, [posts, activeTab]);

  // Counts for pills
  const counts = useMemo(() => {
    const total = posts.length;
    const postsCount = posts.filter(p => p.type === 'post').length;
    const repliesCount = posts.filter(p => p.type === 'reply').length;
    return { all: total, posts: postsCount, replies: repliesCount };
  }, [posts]);

  // Submit New Post
  const handleCreatePost = () => {
    if (!newTitle.trim()) {
      setComposeError('Please enter a title for your post');
      return;
    }
    if (!newContent.trim()) {
      setComposeError('Please write your story or recommendation');
      return;
    }

    const created = {
      id: `post-${Date.now()}`,
      type: 'post',
      title: newTitle.trim(),
      content: newContent.trim(),
      location: newLocation.trim() || 'Bangalore, India',
      category: newCategory,
      author: userName,
      petName: 'Simba',
      petType: 'Golden Retriever',
      likesCount: 1,
      commentsCount: 0,
      timeAgo: 'Just now',
      date: new Date().toISOString().split('T')[0],
    };

    setPosts(prev => [created, ...prev]);
    setLikedPosts(prev => ({ ...prev, [created.id]: true }));
    setNewTitle('');
    setNewContent('');
    setComposeError('');
    setComposeModalVisible(false);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#F8F9FA'}
      />

      {/* ── Signature Ambient Paw Watermarks ── */}
      <View style={styles.ambientPawWatermarkTop} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(140)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(123, 44, 255, 0.035)'}
        />
      </View>
      <View style={styles.ambientPawWatermarkBottom} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(238, 42, 123, 0.06)' : 'rgba(238, 42, 123, 0.03)'}
        />
      </View>

      {/* ── 1. Top Navigation Bar ── */}
      <View
        style={[
          styles.headerRow,
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? vs(10) : vs(6)) },
          isDarkMode && styles.headerRowDark,
        ]}>
        <BouncyPressable
          testID="community-back-btn"
          accessibilityLabel="Back"
          style={[styles.backBtn, isDarkMode && styles.backBtnDark]}
          activeScale={0.88}
          onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={s(20)}
            color={isDarkMode ? '#FFFFFF' : '#1E1B4B'}
          />
        </BouncyPressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
            Community Posts
          </Text>
          <Text
            style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}
            numberOfLines={1}
            ellipsizeMode="tail">
            Stories & discussions with the pack
          </Text>
        </View>

        <BouncyPressable
          testID="create-post-top-btn"
          style={styles.newPostHeaderBtn}
          activeScale={0.92}
          onPress={() => {
            setComposeError('');
            setComposeModalVisible(true);
          }}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newPostGradient}>
            <Feather name="plus" size={ms(15)} color="#FFFFFF" />
            <Text style={styles.newPostText}>Post</Text>
          </LinearGradient>
        </BouncyPressable>
      </View>

      {/* ── 2. Segmented Sub-Tabs Bar (All | Posts | Replies) ── */}
      <View style={[styles.segmentTrack, isDarkMode && styles.segmentTrackDark]}>
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'posts', label: `Posts (${counts.posts})` },
          { id: 'replies', label: `Replies (${counts.replies})` },
        ].map(filter => {
          const isActive = activeTab === filter.id;
          return (
            <BouncyPressable
              key={filter.id}
              testID={`tab-${filter.id}`}
              style={[
                styles.segmentTab,
                isActive &&
                  (isDarkMode ? styles.segmentTabActiveDark : styles.segmentTabActive),
              ]}
              activeScale={0.96}
              onPress={() => setActiveTab(filter.id)}>
              <Text
                style={[
                  styles.segmentTabText,
                  isDarkMode && styles.segmentTabTextDark,
                  isActive &&
                    (isDarkMode
                      ? styles.segmentTabTextActiveDark
                      : styles.segmentTabTextActive),
                ]}>
                {filter.label}
              </Text>
            </BouncyPressable>
          );
        })}
      </View>

      {/* ── 3. Posts / Replies Scroll List ── */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vs(36) }]}
        showsVerticalScrollIndicator={false}>

        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => {
            const isLiked = !!likedPosts[post.id];
            const currentLikes = post.likesCount + (isLiked ? 1 : 0);
            const isReply = post.type === 'reply';
            const catMeta = getCategoryMeta(post.category);

            return (
              <View
                key={post.id}
                testID={`post-card-${post.id}`}
                style={[
                  styles.postCard,
                  { borderColor: isDarkMode ? catMeta.borderDark : catMeta.border },
                  isDarkMode && styles.postCardDark,
                ]}>
                {/* Top Accent Strip matching Image 3 design */}
                <View
                  style={[
                    styles.postCardTopAccent,
                    { backgroundColor: catMeta.accent },
                  ]}
                />

                {/* Card Top Row: Type Badge + Category + Timestamp */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.typeBadge,
                        isReply ? styles.typeBadgeReply : styles.typeBadgePost,
                      ]}>
                      <Text
                        style={[
                          styles.typeBadgeText,
                          isReply ? styles.typeBadgeTextReply : styles.typeBadgeTextPost,
                        ]}>
                        {isReply ? 'REPLY' : 'POST'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.categoryPill,
                        { backgroundColor: isDarkMode ? catMeta.badgeBgDark : catMeta.badgeBg },
                      ]}>
                      <Text
                        style={[
                          styles.categoryText,
                          { color: catMeta.text },
                        ]}>
                        {post.category}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.timeText, isDarkMode && styles.textMutedDark]}>
                    {post.timeAgo}
                  </Text>
                </View>

                {/* Title */}
                <Text style={[styles.postTitle, isDarkMode && styles.textWhite]}>{post.title}</Text>

                {/* Content snippet */}
                <Text style={[styles.postContent, isDarkMode && styles.postContentDark]}>
                  {post.content}
                </Text>

                {/* Location & Pet Tag Row */}
                <View style={styles.metaRow}>
                  <View style={styles.locationTag}>
                    <Ionicons
                      name="location-outline"
                      size={ms(12)}
                      color={isDarkMode ? '#A78BFA' : '#7C3AED'}
                    />
                    <Text
                      style={[styles.locationText, isDarkMode && styles.locationTextDark]}
                      numberOfLines={1}>
                      {post.location}
                    </Text>
                  </View>

                  {post.petName && (
                    <View style={[styles.petTag, isDarkMode && styles.petTagDark]}>
                      <Text style={styles.petTagText}>🐾 {post.petName}</Text>
                    </View>
                  )}
                </View>

                {/* Card Footer Interactions (Share option removed) */}
                <View style={[styles.cardFooter, isDarkMode && styles.cardFooterDark]}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    activeOpacity={0.7}
                    onPress={() => handleToggleLike(post.id)}>
                    <Ionicons
                      name={isLiked ? 'heart' : 'heart-outline'}
                      size={ms(16)}
                      color={isLiked ? '#EF4444' : isDarkMode ? '#94A3B8' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        isLiked && styles.actionTextLiked,
                        isDarkMode && !isLiked && styles.textMutedDark,
                      ]}>
                      {currentLikes}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionBtn}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={ms(15)}
                      color={isDarkMode ? '#94A3B8' : '#64748B'}
                    />
                    <Text style={[styles.actionText, isDarkMode && styles.textMutedDark]}>
                      {post.commentsCount}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          /* Web-Matched Empty State */
          <View style={[styles.emptyCard, isDarkMode && styles.emptyCardDark]}>
            <Ionicons
              name="chatbubble-outline"
              size={ms(48)}
              color={isDarkMode ? '#64748B' : '#94A3B8'}
              style={styles.emptyIcon}
            />
            <View style={styles.emptyTextRow}>
              <Text style={[styles.emptyMessage, isDarkMode && styles.textMutedDark]}>
                {activeTab === 'posts'
                  ? 'No posts yet. '
                  : activeTab === 'replies'
                  ? 'No replies yet. '
                  : 'No community activity yet. '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setComposeError('');
                  setComposeModalVisible(true);
                }}>
                <Text style={styles.joinLink}>Join the conversation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── 5. Create Post Modal ── */}
      <Modal
        visible={composeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setComposeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.composeModalCard, isDarkMode && styles.composeModalCardDark]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
                  Create Community Post
                </Text>
                <Text style={[styles.modalSubtitle, isDarkMode && styles.textMutedDark]}>
                  Share a trail, cafe experience or tip with the pack
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setComposeModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={ms(20)} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {composeError.length > 0 && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={ms(14)} color="#EF4444" />
                <Text style={styles.errorBannerText}>{composeError}</Text>
              </View>
            )}

            {/* Title Input */}
            <Text style={[styles.inputLabel, isDarkMode && styles.textMutedDark]}>
              Post Title *
            </Text>
            <TextInput
              placeholder="e.g. Morning off-leash run at Cubbon Park..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={newTitle}
              onChangeText={text => {
                setNewTitle(text);
                setComposeError('');
              }}
              style={[styles.textInputStyle, isDarkMode && styles.textInputDark]}
            />

            {/* Category Select */}
            <Text style={[styles.inputLabel, isDarkMode && styles.textMutedDark]}>Category</Text>
            <View style={styles.catPillRow}>
              {['Dog Parks', 'Pet Friendly Cafe', 'Travel Tips', 'Water Play'].map(cat => {
                const isSelected = newCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalCatPill,
                      isSelected && styles.modalCatPillSelected,
                      isDarkMode && !isSelected && styles.modalCatPillDark,
                    ]}
                    onPress={() => setNewCategory(cat)}>
                    <Text
                      style={[
                        styles.modalCatPillText,
                        isSelected && styles.modalCatPillTextSelected,
                        isDarkMode && !isSelected && styles.textMutedDark,
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Location Input */}
            <Text style={[styles.inputLabel, isDarkMode && styles.textMutedDark]}>Location</Text>
            <TextInput
              placeholder="e.g. Cubbon Park, Bangalore"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={newLocation}
              onChangeText={setNewLocation}
              style={[styles.textInputStyle, isDarkMode && styles.textInputDark]}
            />

            {/* Content Input */}
            <Text style={[styles.inputLabel, isDarkMode && styles.textMutedDark]}>
              Your Story / Tip *
            </Text>
            <TextInput
              placeholder="What made this place special for your pet? Any clean water bowls or leash tips?"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={newContent}
              onChangeText={text => {
                setNewContent(text);
                setComposeError('');
              }}
              multiline
              numberOfLines={4}
              style={[styles.textAreaStyle, isDarkMode && styles.textInputDark]}
            />

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setComposeModalVisible(false)}>
                <Text style={[styles.cancelModalBtnText, isDarkMode && styles.textMutedDark]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <BouncyPressable
                style={styles.publishBtn}
                activeScale={0.92}
                onPress={handleCreatePost}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.publishGradient}>
                  <Text style={styles.publishBtnText}>Publish Post</Text>
                </LinearGradient>
              </BouncyPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CommunityPostsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRowDark: {
    borderBottomColor: '#1E1435',
  },
  backBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  backBtnDark: {
    backgroundColor: '#1E1035',
    borderColor: '#371B58',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: s(12),
  },
  headerTitle: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(1),
  },
  headerSubtitleDark: {
    color: '#94A3B8',
  },
  newPostHeaderBtn: {
    borderRadius: s(20),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  newPostGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    paddingVertical: vs(7.5),
    borderRadius: s(20),
    gap: s(4),
  },
  newPostText: {
    color: '#FFFFFF',
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.2,
  },
  segmentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: s(16),
    marginTop: vs(12),
    marginBottom: vs(8),
    padding: s(3.5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentTrackDark: {
    backgroundColor: '#1A0B30',
    borderColor: '#2E1654',
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(7.5),
    borderRadius: s(11),
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentTabActiveDark: {
    backgroundColor: '#2D1452',
    borderColor: '#7C3AED',
  },
  segmentTabText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  segmentTabTextDark: {
    color: '#94A3B8',
  },
  segmentTabTextActive: {
    color: '#7C3AED',
    fontFamily: theme.typography.fontFamily.bold,
  },
  segmentTabTextActiveDark: {
    color: '#C084FC',
    fontFamily: theme.typography.fontFamily.bold,
  },
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: vs(4),
  },
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: vs(120),
    right: -s(25),
    transform: [{ rotate: '-25deg' }],
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: vs(100),
    left: -s(30),
    transform: [{ rotate: '30deg' }],
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    paddingHorizontal: s(16),
    paddingTop: vs(18),
    paddingBottom: vs(14),
    marginBottom: vs(14),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  postCardDark: {
    backgroundColor: '#190B30',
    borderColor: '#2E1654',
  },
  postCardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(8),
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  typeBadge: {
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(6),
  },
  typeBadgePost: {
    backgroundColor: '#EDE9FE',
  },
  typeBadgeReply: {
    backgroundColor: '#EFF6FF',
  },
  typeBadgeText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  typeBadgeTextPost: {
    color: '#7C3AED',
  },
  typeBadgeTextReply: {
    color: '#2563EB',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: s(7),
    paddingVertical: vs(2),
    borderRadius: s(6),
  },
  categoryPillDark: {
    backgroundColor: '#231242',
  },
  categoryText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#475569',
  },
  categoryTextDark: {
    color: '#A78BFA',
  },
  timeText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#94A3B8',
  },
  postTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
    marginBottom: vs(5),
    lineHeight: s(20),
  },
  postContent: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#475569',
    lineHeight: s(18),
    marginBottom: vs(10),
  },
  postContentDark: {
    color: '#CBD5E1',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: s(8),
    marginBottom: vs(12),
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  locationText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  locationTextDark: {
    color: '#A78BFA',
  },
  petTag: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: s(7),
    paddingVertical: vs(2),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  petTagDark: {
    backgroundColor: '#27104B',
    borderColor: '#3B156E',
  },
  petTagText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: vs(10),
    gap: s(18),
  },
  cardFooterDark: {
    borderTopColor: '#240F44',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  actionText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  actionTextLiked: {
    color: '#EF4444',
    fontFamily: theme.typography.fontFamily.bold,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingVertical: vs(50),
    paddingHorizontal: s(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(10),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  emptyCardDark: {
    backgroundColor: '#190B30',
    borderColor: '#2E1654',
    borderBottomColor: '#18072E',
  },
  emptyIcon: {
    marginBottom: vs(14),
    opacity: 0.7,
  },
  emptyTextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  joinLink: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  composeModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    padding: s(20),
    paddingBottom: vs(32),
  },
  composeModalCardDark: {
    backgroundColor: '#1A0B30',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: vs(14),
  },
  modalTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(2),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: s(8),
    borderRadius: s(10),
    marginBottom: vs(10),
    gap: s(6),
  },
  errorBannerText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#EF4444',
  },
  inputLabel: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#475569',
    marginBottom: vs(4),
    marginTop: vs(8),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInputStyle: {
    backgroundColor: '#F8FAFC',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    fontSize: s(13),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.regular,
  },
  textInputDark: {
    backgroundColor: '#240F44',
    borderColor: '#3B156E',
    color: '#FFFFFF',
  },
  textAreaStyle: {
    backgroundColor: '#F8FAFC',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    fontSize: s(13),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.regular,
    height: vs(80),
    textAlignVertical: 'top',
  },
  catPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginBottom: vs(4),
  },
  modalCatPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCatPillDark: {
    backgroundColor: '#27104B',
    borderColor: '#3B156E',
  },
  modalCatPillSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  modalCatPillText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#475569',
  },
  modalCatPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: vs(16),
    gap: s(12),
  },
  cancelModalBtn: {
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
  },
  cancelModalBtnText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  publishBtn: {
    borderRadius: s(12),
    overflow: 'hidden',
  },
  publishGradient: {
    paddingHorizontal: s(18),
    paddingVertical: vs(9),
    borderRadius: s(12),
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
