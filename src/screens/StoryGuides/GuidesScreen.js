import React, { useState, useMemo, useCallback, useDeferredValue } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

import { theme, images } from '../../theme';
import { useStore } from '../../store';
import { useInfiniteArticles, resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';

export const mapCategoryToBadge = category => {
  const norm = (category || '').toLowerCase().trim();
  switch (norm) {
    case 'destinations':
    case 'destination guide':
    case 'destination guides':
      return { text: 'Destination Guide', type: 'destination' };
    case 'guide':
    case 'guides':
    case 'rescue':
    case 'rescue & welfare':
      return { text: 'Rescue & Welfare', type: 'rescue' };
    case 'pet-travel':
    case 'travel':
    case 'pet travel':
    case 'pet travel india':
      return { text: 'Pet Travel', type: 'travel' };
    case 'pet-health':
    case 'health':
    case 'pet health':
      return { text: 'Pet Health', type: 'health' };
    case 'pet-parenting':
    case 'parenting':
    case 'pet parenting':
      return { text: 'Pet Parenting', type: 'parenting' };
    case 'misconceptions':
      return { text: 'Misconceptions', type: 'misconceptions' };
    default:
      return {
        text: category ? category.replace(/-/g, ' ').toUpperCase() : 'GUIDE',
        type: 'travel',
      };
  }
};

export const extractCleanArticle = html => {
  if (!html) return { paragraphs: [], bulletItems: [], proTips: '' };

  let proTips = '';
  const calloutMatch = html.match(/class="[^"]*callout[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (calloutMatch) {
    proTips = calloutMatch[1].replace(/<[^>]+>/g, '').trim();
  }

  const bulletItems = [];
  const liMatches = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  for (const m of liMatches) {
    const itemText = m[1].replace(/<[^>]+>/g, '').trim();
    if (itemText && !bulletItems.includes(itemText)) {
      bulletItems.push(itemText);
    }
  }

  const clean = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

  const paragraphs = clean
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return { paragraphs, bulletItems, proTips };
};

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Guides', categorySlug: null, icon: 'sparkles' },
  {
    id: 'pet-travel',
    label: 'Pet Travel India',
    categorySlug: 'pet-travel',
    icon: 'airplane-outline',
  },
  { id: 'pet-health', label: 'Pet Health', categorySlug: 'pet-health', icon: 'medkit-outline' },
  {
    id: 'pet-parenting',
    label: 'Pet Parenting',
    categorySlug: 'pet-parenting',
    icon: 'paw-outline',
  },
  {
    id: 'misconceptions',
    label: 'Misconceptions',
    categorySlug: 'misconceptions',
    icon: 'bulb-outline',
  },
  {
    id: 'destinations',
    label: 'Destination Guides',
    categorySlug: 'destinations',
    icon: 'location-outline',
  },
  { id: 'guide', label: 'Rescue & Welfare', categorySlug: 'guide', icon: 'heart-outline' },
];

const INITIAL_VISIBLE = 10;
const VISIBLE_STEP = 10;

/** Static intro block: memoised so typing in search or switching a category never re-renders it. */
const GuidesHero = React.memo(function GuidesHero({ isDarkMode }) {
  return (
    <View style={styles.webHeaderSection}>
      <View style={[styles.fromRubiconBadge, isDarkMode && styles.fromRubiconBadgeDark]}>
        <Ionicons name="sparkles" size={ms(10)} color="#7C3AED" />
        <Text style={[styles.fromRubiconText, isDarkMode && styles.fromRubiconTextDark]}>
          FROM TRAVEL WITH TAILS & RUBICON
        </Text>
      </View>

      <Text style={[styles.webMainTitle, isDarkMode && styles.webMainTitleDark]}>
        Pet Travel Guides & Advice for Indian Pet Parents
      </Text>

      <Text style={[styles.webSubtitle, isDarkMode && styles.webSubtitleDark]}>
        Honest guides on travelling with pets in India, pet health, vaccinations, and everything
        nobody told you when you became a pet parent.
      </Text>

      {/* 3D Floating Stats & Trust Card */}
      <View style={[styles.statsCard3D, isDarkMode && styles.statsCard3DDark]}>
        <View style={styles.statsCardTop}>
          <View style={styles.statsCountGroup}>
            <Text style={styles.statsCountNumber}>50+</Text>
            <Text style={[styles.statsCountLabel, isDarkMode && styles.statsCountLabelDark]}>
              Pet guides published
            </Text>
          </View>
          <View style={styles.statsBadgeTails}>
            <Ionicons name="shield-checkmark" size={ms(12)} color="#10B981" />
            <Text style={styles.statsBadgeTailsText}>100% Pack Tested</Text>
          </View>
        </View>

        <View style={styles.statsBulletRow}>
          <View style={styles.statsBulletItem}>
            <View style={[styles.statsDot, styles.statsDotPurple]} />
            <Text style={[styles.statsBulletText, isDarkMode && styles.statsBulletTextDark]}>
              Travel & Road Trips
            </Text>
          </View>
          <View style={styles.statsBulletItem}>
            <View style={[styles.statsDot, styles.statsDotGreen]} />
            <Text style={[styles.statsBulletText, isDarkMode && styles.statsBulletTextDark]}>
              Health & Vet Advice
            </Text>
          </View>
          <View style={styles.statsBulletItem}>
            <View style={[styles.statsDot, styles.statsDotOrange]} />
            <Text style={[styles.statsBulletText, isDarkMode && styles.statsBulletTextDark]}>
              Nutrition & Food
            </Text>
          </View>
          <View style={styles.statsBulletItem}>
            <View style={[styles.statsDot, styles.statsDotTeal]} />
            <Text style={[styles.statsBulletText, isDarkMode && styles.statsBulletTextDark]}>
              Training & Behaviour
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const CategoryPill = React.memo(function CategoryPill({ tab, isSelected, isDarkMode, onSelect }) {
  let iconColor = isDarkMode ? '#C084FC' : '#7C3AED';
  if (isSelected) {
    iconColor = '#FFFFFF';
  }
  return (
    <BouncyPressable
      style={[
        styles.tabPill3D,
        isDarkMode && styles.tabPill3DDark,
        isSelected && (isDarkMode ? styles.tabPill3DActiveDark : styles.tabPill3DActive),
      ]}
      activeScale={0.94}
      onPress={() => onSelect(tab.id)}>
      <View style={styles.tabInnerContainer}>
        <Ionicons name={tab.icon} size={ms(13)} color={iconColor} />
        <Text
          style={[
            styles.tabPill3DText,
            isDarkMode && styles.tabPill3DTextDark,
            isSelected && styles.tabPill3DTextActive,
          ]}>
          {tab.label}
        </Text>
      </View>
    </BouncyPressable>
  );
});

const CategoryTabs = React.memo(function CategoryTabs({ selectedCategory, isDarkMode, onSelect }) {
  return (
    <View style={styles.categoryTabsWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsScroll}>
        {CATEGORY_TABS.map(tab => (
          <CategoryPill
            key={tab.id}
            tab={tab}
            isSelected={selectedCategory === tab.id}
            isDarkMode={isDarkMode}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
});

const SectionHeader = React.memo(function SectionHeader({ title, totalCount, isDarkMode }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
          VERIFIED PACK DIRECTORY
        </Text>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>{title}</Text>
      </View>
      <View style={[styles.newBadge, isDarkMode && styles.newBadgeDark]}>
        <Text style={[styles.newBadgeText, isDarkMode && styles.newBadgeTextDark]}>
          {totalCount} {totalCount === 1 ? 'GUIDE' : 'GUIDES'}
        </Text>
      </View>
    </View>
  );
});

const normalizeArticle = article => {
  const badge = mapCategoryToBadge(article.category);
  const tags = Array.isArray(article.tags) ? article.tags : [];
  const author = article.authorName || 'Ekta & Akash — Travel With Tails';
  const excerpt = article.excerpt || '';

  return {
    id: String(article.id || article.slug),
    slug: article.slug,
    title: article.title,
    category: badge.text,
    categorySlug: article.category,
    badgeText: badge.text,
    badgeType: badge.type,
    excerpt,
    readTime: article.estimatedReadMinutes ? `${article.estimatedReadMinutes} min read` : '8 min read',
    imageUri: article.coverImageUrl ? resolveImageUrl(article.coverImageUrl) : null,
    location: article.location || article.destination || tags[0] || 'Verified Guide',
    author,
    authorShort: (article.authorName || 'The Pack').split('—')[0].split('•')[0].trim(),
    rawBody: article.body,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt || article.createdAt,
    tags,
    // lower-cased once here, so every search keystroke is a single includes() per guide
    searchText: [article.title, excerpt, author, badge.text, ...tags].join(' ').toLowerCase(),
  };
};

/** One guide row. Memoised so typing in search or an image error never re-renders the whole list. */
const GuideCard = React.memo(function GuideCard({ guide, isDarkMode, onOpen }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSource = useMemo(
    () =>
      guide.imageUri && !imageFailed
        ? { uri: guide.imageUri, priority: FastImage.priority.normal }
        : images.noimage,
    [guide.imageUri, imageFailed],
  );

  return (
    <BouncyPressable
      style={[styles.guideCardRow, isDarkMode && styles.guideCardRowDark]}
      activeScale={0.97}
      onPress={() => onOpen(guide)}>
      {/* Left: Thumbnail Image */}
      <View
        style={[styles.guideThumbnailWrap, isDarkMode && styles.guideThumbnailWrapDark]}>
        <FastImage
          source={imageSource}
          defaultSource={images.noimage}
          onError={() => setImageFailed(true)}
          alt={guide.title || 'Pet guide thumbnail'}
          accessibilityLabel={guide.title || 'Pet guide thumbnail'}
          style={styles.guideThumbnailImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      </View>

      {/* Right: Content Column */}
      <View style={styles.guideCardRight}>
        <View style={styles.guideTextContent}>
          {/* Category Pill Badge */}
          <View
            style={[
              styles.guideCategoryPill,
              isDarkMode && styles.guideCategoryPillDark,
            ]}>
            <Text
              style={[
                styles.guideCategoryPillText,
                isDarkMode && styles.guideCategoryPillTextDark,
              ]}
              numberOfLines={1}>
              {guide.badgeText}
            </Text>
          </View>
          <Text
            style={[styles.guideItemTitle, isDarkMode && styles.guideItemTitleDark]}
            numberOfLines={2}
            ellipsizeMode="tail">
            {guide.title}
          </Text>
          <View style={styles.guideLocationRow}>
            <Ionicons
              name="location-outline"
              size={ms(11.5)}
              color={isDarkMode ? '#94A3B8' : '#737380'}
            />
            <Text
              style={[styles.guideLocationText, isDarkMode && styles.guideLocationTextDark]}
              numberOfLines={1}>
              {guide.location}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Companion & Compact Next Button */}
        <View style={styles.guideCardBottomRow}>
          <View style={styles.guideCompanionRow}>
            <Ionicons
              name="paw-outline"
              size={ms(11.5)}
              color={isDarkMode ? '#A78BFA' : '#737380'}
            />
            <Text
              style={[
                styles.guideCompanionText,
                isDarkMode && styles.guideCompanionTextDark,
              ]}
              numberOfLines={1}>
              {guide.authorShort || 'The Pack'}
            </Text>
          </View>

          {/* Compact Squircle Next Button */}
          <View style={styles.guideArrowSquareBtn}>
            <Ionicons name="arrow-forward" size={ms(13)} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </BouncyPressable>
  );
});

export const GuidesScreen = React.memo(function GuidesScreen({ navigation, onScroll } = {}) {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const activeTabConfig = useMemo(
    () => CATEGORY_TABS.find(t => t.id === selectedCategory) || CATEGORY_TABS[0],
    [selectedCategory],
  );
  const activeCategorySlug = activeTabConfig?.categorySlug || null;

  const {
    data: articlesPageData,
    isLoading: isArticlesLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteArticles({ category: activeCategorySlug, limit: 100 });

  const apiArticles = useMemo(() => {
    if (!articlesPageData?.pages) return [];
    return articlesPageData.pages.flatMap(page =>
      Array.isArray(page?.articles) ? page.articles : [],
    );
  }, [articlesPageData]);

  const totalCount = useMemo(() => {
    if (typeof articlesPageData?.pages?.[0]?.total === 'number') {
      return articlesPageData.pages[0].total;
    }
    return apiArticles.length;
  }, [articlesPageData, apiArticles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const normalizedGuides = useMemo(() => apiArticles.map(normalizeArticle), [apiArticles]);

  const handleOpenGuide = useCallback(
    guide => {
      navigation?.navigate?.('GuideDetailScreen', { slug: guide.slug || guide.id, guide });
    },
    [navigation],
  );

  // Typing stays instant; the (cheap) list filtering runs on the deferred value
  const deferredQuery = useDeferredValue(searchQuery);
  const filteredGuides = useMemo(() => {
    const q = deferredQuery.toLowerCase().trim();
    if (!q) {
      return normalizedGuides;
    }
    return normalizedGuides.filter(guide => guide.searchText.includes(q));
  }, [normalizedGuides, deferredQuery]);

  // Render the list progressively. The count is tied to the query/category it was grown for,
  // so changing either starts again from INITIAL_VISIBLE without an extra reset render.
  const listKey = `${selectedCategory}|${deferredQuery}`;
  const [visible, setVisible] = useState({ key: listKey, count: INITIAL_VISIBLE });
  const visibleCount = visible.key === listKey ? visible.count : INITIAL_VISIBLE;

  const visibleGuides = useMemo(
    () => filteredGuides.slice(0, visibleCount),
    [filteredGuides, visibleCount],
  );
  const hasMoreLocal = visibleCount < filteredGuides.length;

  const handleScroll = useCallback(
    event => {
      if (onScroll) {
        onScroll(event);
      }
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (
        hasMoreLocal &&
        layoutMeasurement.height + contentOffset.y > contentSize.height - layoutMeasurement.height
      ) {
        setVisible({ key: listKey, count: visibleCount + VISIBLE_STEP });
      }
    },
    [onScroll, hasMoreLocal, listKey, visibleCount],
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, vs(20)) + vs(84) },
        ]}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#A855F7' : '#7C3AED'}
            colors={['#7C3AED', '#EE2A7B']}
          />
        }>
        <View style={[styles.searchBarWrap, isDarkMode && styles.searchBarWrapDark]}>
          <View style={[styles.searchBar, isDarkMode && styles.searchBarDark]}>
            <Feather
              name="search"
              size={ms(18)}
              color={isDarkMode ? '#A855F7' : '#7C3AED'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
              placeholder="Search guides, packing tips, rules..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <GuidesHero isDarkMode={isDarkMode} />

        <CategoryTabs
          selectedCategory={selectedCategory}
          isDarkMode={isDarkMode}
          onSelect={setSelectedCategory}
        />

        <SectionHeader
          title={
            selectedCategory === 'all' ? 'All Pet Guides' : activeTabConfig?.label || selectedCategory
          }
          totalCount={totalCount}
          isDarkMode={isDarkMode}
        />

        {isArticlesLoading && (!articlesPageData?.pages || articlesPageData.pages.length === 0) ? (
          <View style={styles.customLoaderWrap}>
            <Loader
              fullScreen
              title="Loading pet guides..."
              subtitle="Fetching verified pack articles & advice..."
            />
          </View>
        ) : (
          visibleGuides.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              isDarkMode={isDarkMode}
              onOpen={handleOpenGuide}
            />
          ))
        )}

        {/* ── 6. Pagination & Load More ── */}
        {hasNextPage && !hasMoreLocal && (
          <View style={styles.loadMoreWrap}>
            <BouncyPressable
              style={[styles.loadMoreBtn, isDarkMode && styles.loadMoreBtnDark]}
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}>
              {isFetchingNextPage ? (
                <View style={styles.loadMoreInner}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text style={[styles.loadMoreText, isDarkMode && styles.loadMoreTextDark]}>
                    Loading next batch...
                  </Text>
                </View>
              ) : (
                <View style={styles.loadMoreInner}>
                  <Text style={[styles.loadMoreText, isDarkMode && styles.loadMoreTextDark]}>
                    Load More Guides
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={ms(16)}
                    color={isDarkMode ? '#C084FC' : '#7C3AED'}
                  />
                </View>
              )}
            </BouncyPressable>
          </View>
        )}

        {/* All Loaded Indicator */}
        {!hasNextPage && !hasMoreLocal && filteredGuides.length > 0 && !isArticlesLoading && (
          <View style={styles.allLoadedWrap}>
            <Ionicons name="checkmark-done" size={ms(14)} color="#10B981" />
            <Text style={[styles.allLoadedText, isDarkMode && styles.allLoadedTextDark]}>
              All {totalCount} verified guides loaded
            </Text>
          </View>
        )}

        {/* ── Empty State ── */}
        {filteredGuides.length === 0 && (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconCircle, isDarkMode && styles.emptyIconCircleDark]}>
              <Ionicons
                name="book-outline"
                size={ms(38)}
                color={isDarkMode ? '#C084FC' : '#7C3AED'}
              />
            </View>
            <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
              No pet guides found
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
              Try searching with another keyword or pick another category above.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2', // Signature warm cream Home screen background
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── 1. Search Bar (Home Screen 3D Beveled Search Bar) ── */
  searchBarWrap: {
    paddingHorizontal: s(15),
    paddingTop: vs(4),
    paddingBottom: vs(8),
    backgroundColor: '#FAF7F2',
    zIndex: 99,
  },
  searchBarWrapDark: {
    backgroundColor: '#0F071D',
  },
  searchBar: {
    height: s(50),
    backgroundColor: '#FFFFFF',
    borderRadius: s(17),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: s(15),
    paddingRight: s(6),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD6CA',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBarDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#14062A',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  searchIcon: {
    marginRight: s(8),
  },
  searchInput: {
    flex: 1,
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1D1238',
    paddingVertical: 0,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  searchArrowBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: '#7B2CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── 2. Editorial Header Section ── */
  webHeaderSection: {
    paddingHorizontal: s(15),
    paddingTop: vs(6),
    paddingBottom: vs(8),
  },
  fromRubiconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(8),
    marginBottom: vs(8),
  },
  fromRubiconBadgeDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  fromRubiconText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
    letterSpacing: 0.6,
  },
  fromRubiconTextDark: {
    color: '#C4B5FD',
  },
  webMainTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    lineHeight: s(26),
    letterSpacing: -0.6,
    marginBottom: vs(6),
  },
  webMainTitleDark: {
    color: '#FFFFFF',
  },
  webSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    lineHeight: s(17),
    marginBottom: vs(12),
  },
  webSubtitleDark: {
    color: '#94A3B8',
  },

  /* 3D Stats & Trust Card */
  statsCard3D: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(14),
    marginTop: vs(2),
    marginBottom: vs(6),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#2B1A4A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  statsCard3DDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
  },
  statsCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: vs(10),
  },
  statsCountGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: s(6),
  },
  statsCountNumber: {
    fontSize: s(22),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
  },
  statsCountLabel: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
  },
  statsCountLabelDark: {
    color: '#FFFFFF',
  },
  statsBadgeTails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#ECFDF5',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(8),
  },
  statsBadgeTailsText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },
  statsBulletRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
  },
  statsBulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    width: '46%',
  },
  statsDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
  },
  statsDotPurple: {
    backgroundColor: '#7C3AED',
  },
  statsDotGreen: {
    backgroundColor: '#10B981',
  },
  statsDotOrange: {
    backgroundColor: '#F59E0B',
  },
  statsDotTeal: {
    backgroundColor: '#059669',
  },
  statsBulletText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  statsBulletTextDark: {
    color: '#94A3B8',
  },

  /* ── 3. Category Tabs Bar ── */
  categoryTabsWrap: {
    marginBottom: vs(12),
  },
  categoryTabsScroll: {
    paddingHorizontal: s(15),
    gap: s(8),
  },
  tabPill3D: {
    paddingHorizontal: s(13),
    paddingVertical: vs(7),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 2.8,
    borderBottomColor: '#DCD4C6',
    ...Platform.select({
      ios: {
        shadowColor: '#2B1A4A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabPill3DDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  tabPill3DActive: {
    backgroundColor: '#7C3AED',
    borderTopColor: '#8B5CF6',
    borderLeftColor: '#7C3AED',
    borderRightColor: '#7C3AED',
    borderBottomWidth: 2.8,
    borderBottomColor: '#5B21B6',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
  },
  tabPill3DActiveDark: {
    backgroundColor: '#8B5CF6',
    borderTopColor: '#A78BFA',
    borderBottomColor: '#6D28D9',
  },
  tabInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  tabPill3DText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#64748B',
  },
  tabPill3DTextDark: {
    color: '#94A3B8',
  },
  tabPill3DTextActive: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── 4. Section Count Bar ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: s(15),
    marginBottom: s(12),
  },
  sectionOverline: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#9A8BA9',
    lineHeight: s(14),
    letterSpacing: 0.72,
    textTransform: 'uppercase',
  },
  sectionOverlineDark: {
    color: '#A855F7',
  },
  sectionTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#3B108F',
    lineHeight: s(24.15),
    letterSpacing: -0.84,
    marginTop: s(1),
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  newBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: '#FBCFE8',
    shadowColor: '#DB2777',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  newBadgeDark: {
    backgroundColor: '#2D123D',
    borderColor: '#4A1D54',
  },
  newBadgeText: {
    color: '#DB2777',
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  newBadgeTextDark: {
    color: '#F472B6',
  },

  /* ── 5. Horizontal Editorial Cards Feed ── */
  scrollContent: {
    paddingTop: vs(2),
  },
  guideCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(12),
    marginBottom: s(12),
    marginHorizontal: s(15),
    borderWidth: 1.2,
    borderColor: '#EDE9E2',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    ...Platform.select({
      ios: {
        shadowColor: '#2B1A4A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  guideCardRowDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#120524',
    borderColor: '#260F45',
  },
  guideThumbnailWrap: {
    width: s(96),
    height: s(106),
    borderRadius: s(16),
    overflow: 'hidden',
    backgroundColor: '#F3EFE6',
  },
  guideThumbnailWrapDark: {
    backgroundColor: '#260F45',
  },
  guideThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  guideCardRight: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: s(12),
    minHeight: s(106),
    justifyContent: 'space-between',
  },
  guideTextContent: {
    flexShrink: 1,
    width: '100%',
  },
  guideCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: s(20),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    marginBottom: vs(5),
  },
  guideCategoryPillDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.16)',
  },
  guideCategoryPillText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#7C3AED',
    letterSpacing: 0.3,
  },
  guideCategoryPillTextDark: {
    color: '#C084FC',
  },
  guideItemTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.32,
    color: '#302339',
    marginBottom: s(4),
  },
  guideItemTitleDark: {
    color: '#F3E8FF',
  },
  guideLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  guideLocationText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    flexShrink: 1,
  },
  guideLocationTextDark: {
    color: '#94A3B8',
  },
  guideCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s(4),
    width: '100%',
  },
  guideCompanionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    flex: 1,
    flexShrink: 1,
    marginRight: s(6),
  },
  guideCompanionText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    flexShrink: 1,
  },
  guideCompanionTextDark: {
    color: '#94A3B8',
  },
  guideArrowSquareBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: '#7047EB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#7047EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  /* ── Empty State ── */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(36),
    paddingHorizontal: s(24),
  },
  emptyIconCircle: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
  },
  emptyIconCircleDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  emptyTitle: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
    marginBottom: vs(4),
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: ms(17),
  },
  emptySubtitleDark: {
    color: '#94A3B8',
  },

  customLoaderWrap: {
    minHeight: vs(280),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: vs(12),
  },
  loadMoreWrap: {
    marginHorizontal: s(16),
    marginTop: vs(8),
    marginBottom: vs(16),
    alignItems: 'center',
  },
  loadMoreBtn: {
    width: '100%',
    paddingVertical: vs(13),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1035',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  loadMoreBtnDark: {
    backgroundColor: '#1E0D38',
    borderColor: '#2E1654',
  },
  loadMoreInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
  },
  loadMoreText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  loadMoreTextDark: {
    color: '#C084FC',
  },
  allLoadedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(16),
    gap: s(6),
  },
  allLoadedText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#94A3B8',
  },
  allLoadedTextDark: {
    color: '#64748B',
  },
});

export default GuidesScreen;
