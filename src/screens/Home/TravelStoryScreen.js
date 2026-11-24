import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  ScrollView,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage, { prefetchImages } from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme, colors, images } from '../../theme';
import { useStore } from '../../store';
import { useTravelStories, resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from './components';
import { storyCoverUrl } from './storyCover';

const formatStory = item => {
    const cleanBody = (item.body || item.content || item.excerpt || '')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const readTime = item.estimated_read_minutes
      ? `${item.estimated_read_minutes} min`
      : item.drive_hours
      ? `${item.drive_hours} hr drive`
      : item.reading_time || '8 min';

    const companions =
      item.companions_line ||
      (Array.isArray(item.dogs_involved) && item.dogs_involved.length > 0
        ? item.dogs_involved.join(' + ')
        : '') ||
      item.primary_dog ||
      item.author_name ||
      'The Pack';

    const location = item.destination || item.location || 'India';
    const storyType = item.story_type || (item.km_one_way ? 'Road Trips' : 'Travel Story');
    const tag = `${storyType.toUpperCase()} • ${readTime.toUpperCase()}`;

    let category = 'road_trips';
    const lowerType = storyType.toLowerCase();
    const lowerTitle = (item.title || '').toLowerCase();
    if (
      lowerType.includes('train') ||
      lowerTitle.includes('train') ||
      lowerTitle.includes('express')
    ) {
      category = 'train_journeys';
    } else if (
      lowerType.includes('water') ||
      lowerType.includes('nature') ||
      lowerTitle.includes('lake') ||
      lowerTitle.includes('ganga') ||
      lowerTitle.includes('river') ||
      lowerTitle.includes('water') ||
      lowerTitle.includes('narmada')
    ) {
      category = 'water_play';
    } else if (
      lowerType.includes('stay') ||
      lowerTitle.includes('stay') ||
      lowerTitle.includes('homestay') ||
      lowerTitle.includes('cottage')
    ) {
      category = 'pet_friendly_stays';
    }

    const rawTips =
      (Array.isArray(item.parent_tips) && item.parent_tips.length > 0 && item.parent_tips) ||
      (Array.isArray(item.pet_tips) && item.pet_tips.length > 0 && item.pet_tips) ||
      [];

    const timelineStops =
      (Array.isArray(item.timeline_stops) &&
        item.timeline_stops.length > 0 &&
        item.timeline_stops) ||
      (Array.isArray(item.timeline_blocks) &&
        item.timeline_blocks.length > 0 &&
        item.timeline_blocks) ||
      [];

    return {
      id: String(item.id),
      slug: item.slug || `story-${item.id}`,
      has_slug: !!item.slug,
      raw: item,
      tag,
      category,
      title: item.title,
      location,
      destination: location,
      companion: companions,
      reading_time: readTime,
      excerpt: item.excerpt || cleanBody.slice(0, 160) + '...',
      content: cleanBody || item.excerpt,
      cover_image: resolveImageUrl(storyCoverUrl(item)),
      tags: Array.isArray(item.tags)
        ? item.tags
        : typeof item.tags === 'string'
        ? [item.tags]
        : [],
      story_type: item.story_type || '',
      dogs_involved: Array.isArray(item.dogs_involved) ? item.dogs_involved : [],
      pet_tips: rawTips,
      parent_tips: rawTips,
      timeline_stops: timelineStops,
      quick_facts: Array.isArray(item.quick_facts) ? item.quick_facts : [],
      dog_cards: Array.isArray(item.dog_cards) ? item.dog_cards : [],
      author_name: item.author_name,
      trip_cost: item.trip_cost,
      vehicle: item.vehicle,
      travel_date: item.travel_date,
      km_one_way: item.km_one_way,
    };
};

export const TravelStoryScreen = React.memo(function TravelStoryScreen({
  navigation,
  route,
  hideTopNav = false,
  onScroll,
}) {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;
  const {
    data: apiStoriesData,
    isLoading: isStoriesLoading,
    refetch: refetchStories,
    isRefetching,
  } = useTravelStories();

  const storytellers = useMemo(() => {
    const rawList = Array.isArray(apiStoriesData)
      ? apiStoriesData
      : Array.isArray(apiStoriesData?.stories)
      ? apiStoriesData.stories
      : [];

    const pack = [
      {
        initial: 'A',
        color: '#D97706',
        name: 'Apple',
        role: 'The water expert',
        description: 'A 5-year-old golden explorer who has swum in 12 lakes across North India.',
      },
      {
        initial: 'C',
        color: '#1E293B',
        name: 'Captain',
        role: 'The calm observer',
        description: 'The senior indie strategist who calculates every rest-stop detour.',
      },
      {
        initial: 'K',
        color: '#B45309',
        name: 'Kimchi',
        role: 'The curious rookie',
        description: 'Always first at the car window, barking at toll gates and sheep herds.',
      },
    ];

    rawList.forEach(story => {
      if (Array.isArray(story.dog_cards)) {
        story.dog_cards.forEach(card => {
          const lower = (card.name || '').toLowerCase();
          pack.forEach(dog => {
            if (lower.includes(dog.name.toLowerCase())) {
              if (card.role) dog.role = card.role;
              if (card.personality || card.mood) {
                dog.description = card.personality || card.mood;
              }
            }
          });
        });
      }
    });

    return pack;
  }, [apiStoriesData]);

  // Top category tabs matching design screenshot
  const categories = useMemo(
    () => [
      { id: 'all', label: 'All Stories' },
      { id: 'road_trips', label: 'Road Trips' },
      { id: 'water_play', label: 'Water Play' },
      { id: 'pet_friendly_stays', label: 'Pet Friendly Stays' },
      { id: 'parenting_tips', label: 'Pet Parenting Tips' },
      { id: 'apple', label: '🦮 Apple (The Golden Retriever)' },
      { id: 'captain', label: '🐕 Captain' },
      { id: 'kimchi', label: '🐕‍🦺 Kimchi' },
    ],
    [],
  );

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotified, setIsNotified] = useState(false);

  // Auto-open story if passed via navigation params
  const initialStoryId = route?.params?.initialStoryId;

  // Process live stories from TRAVEL_STORY: '/stories' API
  const { featuredStory, allStories } = useMemo(() => {
    const rawList = Array.isArray(apiStoriesData)
      ? apiStoriesData
      : Array.isArray(apiStoriesData?.stories)
      ? apiStoriesData.stories
      : [];

    if (rawList.length === 0) {
      return {
        featuredStory: null,
        allStories: [],
      };
    }

    const formattedStories = rawList.map(formatStory);

    return {
      featuredStory: formattedStories[0] || null,
      allStories: formattedStories,
    };
  }, [apiStoriesData]);

  // Download the first covers ahead of time so they are ready when they scroll into view
  React.useEffect(() => {
    prefetchImages(allStories.map(story => story.cover_image));
  }, [allStories]);

  // A story id passed in (from Home) opens that story's screen once, then the param is cleared so
  // coming back does not open it again
  React.useEffect(() => {
    if (!initialStoryId) {
      return;
    }
    const found =
      String(initialStoryId) === featuredStory?.id
        ? featuredStory
        : allStories.find(story => String(story.id) === String(initialStoryId));
    if (found) {
      navigation.setParams({ initialStoryId: undefined });
      openStory(found);
    }
  }, [initialStoryId, featuredStory, allStories, navigation, openStory]);

  // Filter latest stories by category and search
  const filteredStories = useMemo(() => {
    let result =
      activeCategory === 'all' && !searchQuery.trim() && allStories.length > 1
        ? allStories.slice(1)
        : allStories;

    if (activeCategory !== 'all') {
      result = allStories.filter(story => {
        const tagsStr = Array.isArray(story.tags) ? story.tags.join(' ') : String(story.tags || '');
        // Search fields (hay): title, excerpt, tags, or story_type (matching website filter logic)
        const fieldsText = `${story.title || ''} ${story.excerpt || ''} ${tagsStr} ${
          story.story_type || ''
        }`.toLowerCase();

        switch (activeCategory) {
          case 'road_trips': {
            // Keywords like road, trip, drive, Kosi, or Jim Corbett in title, excerpt, tags, or story_type
            const keywords = ['road', 'trip', 'drive', 'kosi', 'jim corbett'];
            return keywords.some(kw => fieldsText.includes(kw));
          }
          case 'water_play': {
            // river, lake, water, or swim in those fields
            const keywords = ['river', 'lake', 'water', 'swim'];
            return keywords.some(kw => fieldsText.includes(kw));
          }
          case 'pet_friendly_stays': {
            // stay, hotel, resort, or cafe in those fields
            const keywords = ['stay', 'hotel', 'resort', 'cafe'];
            return keywords.some(kw => fieldsText.includes(kw));
          }
          case 'parenting_tips': {
            // tip, guide, parent, or “nobody tells” in those fields
            const keywords = ['tip', 'guide', 'parent', 'nobody tells'];
            return keywords.some(kw => fieldsText.includes(kw));
          }
          case 'apple':
          case 'captain':
          case 'kimchi': {
            // Match website filter: dog name in dogs_involved[] or in fieldsText (title, excerpt, tags, story_type)
            const dogName = activeCategory;
            const inDogsInvolved =
              Array.isArray(story.dogs_involved) &&
              story.dogs_involved.some(d => String(d).toLowerCase().includes(dogName));
            const inFieldsText = fieldsText.includes(dogName);
            return inDogsInvolved || inFieldsText;
          }
          default:
            return true;
        }
      });
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        story =>
          (story.title || '').toLowerCase().includes(q) ||
          (story.location || '').toLowerCase().includes(q) ||
          (story.companion || '').toLowerCase().includes(q) ||
          (story.excerpt || '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [allStories, activeCategory, searchQuery]);


  const openStory = useCallback(
    story => {
      if (!story) {
        return;
      }
      navigation.navigate('StoryDetailScreen', {
        slug: story.has_slug ? story.slug : undefined,
        preview: story.raw,
      });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {!hideTopNav && (
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#0F071D' : colors.background}
        />
      )}

  
      {!hideTopNav && (
        <>
          <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />
          <ScreenHeader
            title="Stories"
            subtitle="TRAVEL WITH TAILS"
            onBack={() => navigation.goBack()}
            testID="travel-story-back-btn"
            rightComponent={
              <BouncyPressable
                style={[styles.navSquircleBtn, isDarkMode && styles.navSquircleBtnDark]}
                activeScale={0.88}
                onPress={() => setIsSearchVisible(prev => !prev)}>
                <Ionicons
                  name={isSearchVisible ? 'close' : 'search-outline'}
                  size={ms(19)}
                  color={isDarkMode ? '#A78BFA' : '#1E1035'}
                />
              </BouncyPressable>
            }
          />
        </>
      )}

      {isSearchVisible && (
        <View style={[styles.searchBoxWrap, isDarkMode && styles.searchBoxWrapDark]}>
          <View style={[styles.searchBox, isDarkMode && styles.searchBoxDark]}>
            <Feather
              name="search"
              size={ms(15)}
              color={isDarkMode ? '#A78BFA' : '#7B2CFF'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
              placeholder="Search stories, destinations, dogs..."
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <BouncyPressable onPress={() => setSearchQuery('')}>
                <Feather name="x" size={ms(15)} color={isDarkMode ? '#C4B5FD' : '#6A6A6A'} />
              </BouncyPressable>
            )}
          </View>
        </View>
      )}

  
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + s(30) }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
          listener: onScroll,
        })}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchStories}
            tintColor={isDarkMode ? '#A855F7' : '#7C3AED'}
            colors={['#7C3AED', '#EE2A7B']}
          />
        }>
       
        <LinearGradient
          colors={
            isDarkMode ? ['#260D4E', '#4C1D95', '#6D28D9'] : ['#2E1065', '#581C87', '#7C3AED']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}>
          <View style={styles.heroCircle} />
          <View style={styles.heroGlassBadge}>
            <Ionicons name="book-outline" size={ms(24)} color="#FFFFFF" />
          </View>

          <Text style={styles.heroOverline}>REAL JOURNEYS ACROSS INDIA</Text>
          <Text style={styles.heroTitle}>Stories from{'\n'}the road.</Text>
          <Text style={styles.heroDescription}>
            Honest pet parenting, long drives, unexpected detours and the places Apple, Captain and
            Kimchi found along the way.
          </Text>

          {/* Overlapping Pack Avatars */}
          <View style={styles.packAvatarsRow}>
            <View style={styles.avatarStack}>
              {storytellers.map((st, idx) => (
                <View
                  key={st.name}
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: st.color, zIndex: 10 - idx },
                    idx > 0 && styles.avatarOverlapped,
                  ]}>
                  <Text style={styles.avatarLetter}>{st.initial}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.packLabel}>The travelling pack</Text>
          </View>
        </LinearGradient>

       
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}>
          {categories.map(cat => {
            const isSelected = activeCategory === cat.id;
            return (
              <BouncyPressable
                key={cat.id}
                style={[
                  styles.categoryPill,
                  isDarkMode && styles.categoryPillDark,
                  isSelected && styles.categoryPillActive,
                ]}
                activeScale={0.92}
                onPress={() => setActiveCategory(cat.id)}>
                <Text
                  style={[
                    styles.categoryText,
                    isDarkMode && styles.categoryTextDark,
                    isSelected && styles.categoryTextActive,
                  ]}>
                  {cat.label}
                </Text>
              </BouncyPressable>
            );
          })}
        </ScrollView>

        {/* ── 4. Section: Featured Journey (EDITOR'S PICK) ── */}
        {featuredStory && activeCategory === 'all' && !searchQuery.trim() && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                  EDITOR’S PICK
                </Text>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                  Featured journey
                </Text>
              </View>
              <Text style={styles.newBadgeText}>New</Text>
            </View>

            {/* Large Featured Card */}
            <BouncyPressable
              style={[styles.featuredCard, isDarkMode && styles.featuredCardDark]}
              activeScale={0.98}
              onPress={() => openStory(featuredStory)}>
              <FastImage
                source={
                  featuredStory.cover_image
                    ? { uri: featuredStory.cover_image, priority: FastImage.priority.high }
                    : images.noimage
                }
                defaultSource={images.noimage}
                alt={featuredStory.title || 'Featured story'}
                accessibilityLabel={featuredStory.title || 'Featured story'}
                style={StyleSheet.absoluteFillObject}
                resizeMode={FastImage.resizeMode.cover}
              />
              <LinearGradient
                colors={['rgba(20, 10, 35, 0.1)', 'rgba(20, 10, 35, 0.88)']}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <View style={styles.featuredContent}>
                <Text style={styles.featuredTag}>{featuredStory.tag}</Text>
                <Text style={styles.featuredTitle}>{featuredStory.title}</Text>
                <Text style={styles.featuredExcerpt} numberOfLines={3}>
                  {featuredStory.excerpt}
                </Text>

                <View style={styles.featuredBottomRow}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={ms(13)} color="#E2E8F0" />
                    <Text style={styles.featuredLocationText}>{featuredStory.destination}</Text>
                  </View>

                  <BouncyPressable
                    style={styles.readPillBtn}
                    activeScale={0.92}
                    onPress={() => openStory(featuredStory)}>
                    <Text style={styles.readPillText}>Read</Text>
                    <Feather name="arrow-right" size={ms(12)} color="#1C1C1C" />
                  </BouncyPressable>
                </View>
              </View>
            </BouncyPressable>
          </View>
        )}

        {/* ── 5. Section: Latest Stories (FRESH FROM THE PACK) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                FRESH FROM THE PACK
              </Text>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Latest stories
              </Text>
            </View>
            <Text style={[styles.storiesCountText, isDarkMode && styles.storiesCountTextDark]}>
              {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </Text>
          </View>

          {/* Custom Animated PetFriendly Loader */}
          {isStoriesLoading && allStories.length === 0 ? (
            <View style={styles.customLoaderWrap}>
              <Loader
                fullScreen
                title="Loading travel stories..."
                subtitle="Fetching verified pack stories & road detours..."
              />
            </View>
          ) : null}

          {/* Empty State */}
          {!isStoriesLoading && filteredStories.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="trail-sign-outline"
                size={ms(32)}
                color={isDarkMode ? '#A78BFA' : '#7B2CFF'}
              />
              <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
                No stories found
              </Text>
              <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
                Try selecting another category or check back later.
              </Text>
            </View>
          ) : null}

          {/* List of Latest Stories Cards */}
          {filteredStories?.map(story => (
            <BouncyPressable
              key={story.id}
              style={[styles.storyItemCard, isDarkMode && styles.storyItemCardDark]}
              activeScale={0.97}
              onPress={() => openStory(story)}>
              {/* Left: Thumbnail Image */}
              <View
                style={[styles.storyThumbnailWrap, isDarkMode && styles.storyThumbnailWrapDark]}>
                <FastImage
                  source={
                    story.cover_image
                      ? { uri: story.cover_image, priority: FastImage.priority.normal }
                      : images.noimage
                  }
                  defaultSource={images.noimage}
                  alt={story.title || 'Travel story thumbnail'}
                  accessibilityLabel={story.title || 'Travel story thumbnail'}
                  style={styles.storyThumbnailImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </View>

              {/* Right: Content Column */}
              <View style={styles.storyCardRight}>
                <View style={styles.storyTextContent}>
                  <Text style={[styles.storyTagText, isDarkMode && styles.storyTagTextDark]}>
                    {story.tag}
                  </Text>
                  <Text
                    style={[styles.storyItemTitle, isDarkMode && styles.storyItemTitleDark]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {story.title}
                  </Text>
                  <View style={styles.storyLocationRow}>
                    <Ionicons
                      name="location-outline"
                      size={ms(11.5)}
                      color={isDarkMode ? '#94A3B8' : '#737380'}
                    />
                    <Text
                      style={[styles.storyLocationText, isDarkMode && styles.storyLocationTextDark]}
                      numberOfLines={1}>
                      {story.location}
                    </Text>
                  </View>
                </View>

                {/* Bottom Row: Companion & Compact Next Button */}
                <View style={styles.storyCardBottomRow}>
                  <View style={styles.companionRow}>
                    <Ionicons
                      name="paw-outline"
                      size={ms(11.5)}
                      color={isDarkMode ? '#A78BFA' : '#737380'}
                    />
                    <Text
                      style={[styles.companionText, isDarkMode && styles.companionTextDark]}
                      numberOfLines={1}>
                      {story.companion || 'The Pack'}
                    </Text>
                  </View>

                  {/* Compact Squircle Next Button */}
                  <View style={styles.arrowSquareBtn}>
                    <Ionicons name="arrow-forward" size={ms(13)} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </BouncyPressable>
          ))}
        </View>

        {/* ── 6. Section: Meet Your Storytellers ── */}
        <View style={[styles.storytellersCard, isDarkMode && styles.storytellersCardDark]}>
          <Text
            style={[styles.storytellersOverline, isDarkMode && styles.storytellersOverlineDark]}>
            MEET YOUR STORYTELLERS
          </Text>
          <Text style={[styles.storytellersTitle, isDarkMode && styles.storytellersTitleDark]}>
            Three dogs. One very well-used car.
          </Text>
          <Text style={[styles.storytellersDesc, isDarkMode && styles.storytellersDescDark]}>
            Apple is the veteran, Captain is the skeptic, and Kimchi is always first at the window.
            Every guide begins with what they experienced.
          </Text>

          {/* Storyteller Dog Cards */}
          {storytellers.map(dog => (
            <View key={dog.name} style={[styles.dogRowCard, isDarkMode && styles.dogRowCardDark]}>
              <View style={[styles.dogAvatar, { backgroundColor: dog.color }]}>
                <Text style={styles.dogAvatarText}>{dog.initial}</Text>
              </View>
              <View style={styles.dogInfo}>
                <Text style={[styles.dogName, isDarkMode && styles.dogNameDark]}>{dog.name}</Text>
                <Text style={[styles.dogRole, isDarkMode && styles.dogRoleDark]}>{dog.role}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── 7. Section: Notification CTA Card ("Travel with the pack") ── */}
        <LinearGradient
          colors={['#3B0764', '#581C87', '#6B21A8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.notifyCard}>
          <View style={styles.notifyTopSquircle}>
            <Ionicons name="paw" size={ms(20)} color="#1E1035" />
          </View>

          <Text style={styles.notifyOverline}>TRAVEL WITH THE PACK</Text>
          <Text style={styles.notifyTitle}>New roads, honest notes.</Text>
          <Text style={styles.notifyDesc}>
            Get notified when the next real journey is published.
          </Text>

          <BouncyPressable
            style={[styles.notifyBtn, isNotified && styles.notifyBtnActive]}
            activeScale={0.92}
            onPress={() => setIsNotified(prev => !prev)}>
            <Text style={[styles.notifyBtnText, isNotified && styles.notifyBtnTextActive]}>
              {isNotified ? 'Notified! ✓' : 'Notify me'}
            </Text>
            {!isNotified && (
              <Feather
                name="arrow-right"
                size={ms(13)}
                color="#2E1065"
                style={styles.notifyBtnArrow}
              />
            )}
          </BouncyPressable>
        </LinearGradient>
      </Animated.ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── 1. Top Navigation Bar ── */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: s(12),
    backgroundColor: 'transparent',
  },
  navBarDark: {},
  navLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navSquircleBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#EDE9E2',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 2.5,
    borderBottomColor: '#DCD4C6',
    ...Platform.select({
      ios: {
        shadowColor: '#2B1A4A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  navSquircleBtnDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    borderBottomColor: '#180B2E',
  },
  navTitleGroup: {
    marginLeft: s(12),
    justifyContent: 'center',
  },
  navOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8B7F9E',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  navOverlineDark: {
    color: '#A899C2',
  },
  navTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
    marginTop: s(1),
  },
  navTitleDark: {
    color: '#FFFFFF',
  },

  searchBoxWrap: {
    paddingHorizontal: s(16),
    paddingBottom: s(8),
  },
  searchBoxWrapDark: {},
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: Platform.OS === 'ios' ? s(9) : s(3),
    borderWidth: 1,
    borderColor: '#E8E5DF',
    elevation: 2,
  },
  searchBoxDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  searchIcon: {
    marginRight: s(6),
  },
  searchInput: {
    flex: 1,
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1C1C1C',
  },
  searchInputDark: {
    color: '#FFFFFF',
  },

  /* ── Scrollable Body ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(16),
  },

  /* ── 2. Hero Card ── */
  heroCard: {
    borderRadius: s(24),
    padding: s(20),
    marginTop: s(4),
    marginBottom: s(16),
    overflow: 'hidden',
    position: 'relative',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 3.5,
    borderBottomColor: '#1E0A45',
    elevation: 4,
  },
  heroCircle: {
    position: 'absolute',
    right: -s(40),
    bottom: -s(50),
    width: s(150),
    height: s(150),
    borderRadius: s(75),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroGlassBadge: {
    position: 'absolute',
    top: s(16),
    right: s(16),
    width: s(52),
    height: s(52),
    borderRadius: s(18),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlyph: {
    position: 'absolute',
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphPaw: {
    top: s(22),
    right: s(24),
  },
  glyphMusic: {
    top: s(68),
    right: s(64),
  },
  glyphHeart: {
    bottom: s(30),
    right: s(22),
  },
  heroOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE047',
    letterSpacing: 1.2,
    marginBottom: s(6),
  },
  heroTitle: {
    fontSize: s(24),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: s(30),
    marginBottom: s(8),
  },
  heroDescription: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: s(16),
    maxWidth: '82%',
    marginBottom: s(16),
  },
  packAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarApple: {
    backgroundColor: '#D97706',
    zIndex: 10,
  },
  avatarCaptain: {
    backgroundColor: '#1E293B',
    zIndex: 9,
  },
  avatarKimchi: {
    backgroundColor: '#B45309',
    zIndex: 8,
  },
  avatarOverlapped: {
    marginLeft: -s(10),
  },
  avatarLetter: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  packLabel: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: s(10),
  },

  /* ── 3. Category Horizontal Pills ── */
  categoryScroll: {
    paddingVertical: s(6),
    paddingBottom: s(16),
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    paddingHorizontal: s(16),
    paddingVertical: s(8.5),
    borderWidth: 1.2,
    borderColor: '#E8E5DF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 3,
    borderBottomColor: '#DCD4C6',
    marginRight: s(8),
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
  categoryPillDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#140628',
    borderColor: '#260F45',
  },
  categoryPillActive: {
    backgroundColor: '#2E1065',
    borderColor: '#3B148F',
    borderTopWidth: 1.5,
    borderTopColor: '#581C87',
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: '#3B148F',
    borderRightColor: '#3B148F',
    borderBottomWidth: 3.5,
    borderBottomColor: '#170638',
    ...Platform.select({
      ios: {
        shadowColor: '#2E1065',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.38,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
  },
  categoryTextDark: {
    color: '#E2E8F0',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── Section Wrappers ── */
  sectionWrap: {
    marginBottom: s(20),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(10),
  },
  sectionOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8B5CF6',
    letterSpacing: 1.1,
  },
  sectionOverlineDark: {
    color: '#A855F7',
  },
  sectionTitle: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
    marginTop: s(1),
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  newBadgeText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },
  storiesCountText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },
  storiesCountTextDark: {
    color: '#94A3B8',
  },

  /* ── 4. Featured Card ── */
  featuredCard: {
    height: vs(320),
    borderRadius: s(22),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E1035',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 4,
    borderBottomColor: '#DCD4C6',
    elevation: 3,
  },
  featuredCardDark: {
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#120524',
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: s(16),
  },
  featuredTag: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE047',
    letterSpacing: 1,
    marginBottom: s(6),
  },
  featuredTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: s(24),
    marginBottom: s(6),
  },
  featuredExcerpt: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: s(16),
    marginBottom: s(14),
  },
  featuredBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  featuredLocationText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#E2E8F0',
  },
  readPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
  },
  readPillText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1C1C1C',
  },

  /* ── 5. Latest Stories Card ── */
  storyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(10),
    marginBottom: s(14),
    // 3D slab: bright top lip, tinted sides and a thick darker bottom edge
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: 'rgba(124, 58, 237, 0.18)',
    borderRightColor: 'rgba(124, 58, 237, 0.18)',
    borderBottomWidth: 4,
    borderBottomColor: '#5B3FA8',
    ...Platform.select({
      ios: {
        shadowColor: '#4C1D95',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 7,
        shadowColor: '#4C1D95',
      },
    }),
  },
  storyItemCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#4C1D95',
    borderColor: '#260F45',
    shadowColor: '#000000',
  },
  storyThumbnailWrap: {
    width: s(96),
    height: s(106),
    borderRadius: s(16),
    overflow: 'hidden',
    backgroundColor: '#F3EFE6',
  },
  storyThumbnailWrapDark: {
    backgroundColor: '#260F45',
  },
  storyThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  storyCardRight: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginLeft: s(12),
    minHeight: s(106),
    justifyContent: 'space-between',
  },
  storyTextContent: {
    flexShrink: 1,
    width: '100%',
  },
  storyTagText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7047EB',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: s(3),
  },
  storyTagTextDark: {
    color: '#C084FC',
  },
  storyItemTitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.32,
    color: '#302339',
    marginBottom: s(4),
  },
  storyItemTitleDark: {
    color: '#F3E8FF',
  },
  storyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  storyLocationText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    flexShrink: 1,
  },
  storyLocationTextDark: {
    color: '#94A3B8',
  },
  storyCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s(4),
    width: '100%',
  },
  companionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    flex: 1,
    flexShrink: 1,
    marginRight: s(6),
  },
  companionText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    flexShrink: 1,
  },
  companionTextDark: {
    color: '#94A3B8',
  },
  arrowSquareBtn: {
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

  /* ── 6. Meet Your Storytellers ── */
  storytellersCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: s(22),
    padding: s(18),
    marginBottom: s(20),
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#D8B4FE',
  },
  storytellersCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    borderBottomColor: '#180B2E',
  },
  storytellersOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
    letterSpacing: 1.1,
    marginBottom: s(4),
  },
  storytellersOverlineDark: {
    color: '#A855F7',
  },
  storytellersTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
    lineHeight: s(24),
    marginBottom: s(6),
  },
  storytellersTitleDark: {
    color: '#FFFFFF',
  },
  storytellersDesc: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    lineHeight: s(16),
    marginBottom: s(14),
  },
  storytellersDescDark: {
    color: '#C4B5FD',
  },
  dogRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    padding: s(10),
    marginBottom: s(8),
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  dogRowCardDark: {
    backgroundColor: '#170A2E',
    borderColor: '#260F45',
  },
  dogAvatar: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  dogAvatarText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  dogInfo: {
    flex: 1,
  },
  dogName: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1F2937',
  },
  dogNameDark: {
    color: '#FFFFFF',
  },
  dogRole: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },
  dogRoleDark: {
    color: '#94A3B8',
  },

  /* ── 7. Notification CTA Card ── */
  notifyCard: {
    borderRadius: s(22),
    padding: s(20),
    marginBottom: s(16),
    position: 'relative',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 3.5,
    borderBottomColor: '#1E0A45',
    elevation: 3,
  },
  notifyTopSquircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(14),
  },
  notifyOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1.1,
    marginBottom: s(4),
  },
  notifyTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: s(25),
    marginBottom: s(6),
  },
  notifyDesc: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: s(16),
    marginBottom: s(16),
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingHorizontal: s(16),
    paddingVertical: s(10),
  },
  notifyBtnActive: {
    backgroundColor: '#10B981',
  },
  notifyBtnText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#2E1065',
  },
  notifyBtnTextActive: {
    color: '#FFFFFF',
  },
  notifyBtnArrow: {
    marginLeft: s(4),
  },

  /* ── 8. Story Reader Modal ── */
  readerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  readerContainerDark: {
    backgroundColor: '#0F071D',
  },
  readerImageWrap: {
    height: vs(240),
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FDF8FB',
    justifyContent: 'space-between',
    padding: s(16),
  },
  readerHeroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  readerPlaceholderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF8FB',
  },
  readerPlaceholderImage: {
    height: '100%',
    aspectRatio: 1230 / 1278,
  },
  readerCloseBtn: {
    position: 'absolute',
    top: s(14),
    left: s(16),
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(20, 10, 35, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  readerPillGroup: {
    marginTop: 'auto',
  },
  readerTypePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#7B2CFF',
    borderRadius: s(8),
    paddingHorizontal: s(10),
    paddingVertical: s(5),
  },
  readerTypePillText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  readerBody: {
    padding: s(18),
  },
  readerLocationText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
  },
  readerLocationTextDark: {
    color: '#C084FC',
  },
  readerTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1C1C1C',
    marginTop: s(6),
    lineHeight: s(26),
  },
  readerTitleDark: {
    color: '#FFFFFF',
  },
  readerCompanionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: s(14),
    padding: s(12),
    marginVertical: s(14),
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  readerCompanionBarDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#3B1D6E',
  },
  readerCompanionText: {
    flex: 1,
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#2E1065',
    marginLeft: s(8),
  },
  readerCompanionTextDark: {
    color: '#C4B5FD',
  },
  readerShareBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  tipsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: s(16),
    padding: s(14),
    marginBottom: s(18),
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipsBoxDark: {
    backgroundColor: '#261C08',
    borderLeftColor: '#FBBF24',
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: s(8),
  },
  tipsHeaderTitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#92400E',
  },
  tipsHeaderTitleDark: {
    color: '#FDE68A',
  },
  tipItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: s(3),
  },
  tipBullet: {
    width: s(5),
    height: s(5),
    borderRadius: s(2.5),
    backgroundColor: '#F59E0B',
    marginTop: s(6),
    marginRight: s(8),
  },
  tipText: {
    flex: 1,
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#78350F',
    lineHeight: s(17),
  },
  tipTextDark: {
    color: '#FEF3C7',
  },

  storyContentText: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#374151',
    lineHeight: s(22),
  },
  storyContentTextDark: {
    color: '#D1D5DB',
  },

  tipHeading: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#92400E',
    marginBottom: vs(2),
  },
  tipHeadingDark: {
    color: '#FDE68A',
  },

  /* Quick Facts */
  quickFactsWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: s(16),
    padding: s(14),
    marginVertical: vs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickFactsWrapDark: {
    backgroundColor: '#1E1435',
    borderColor: '#37275C',
  },
  quickFactsTitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    marginBottom: vs(10),
  },
  quickFactsTitleDark: {
    color: '#F1F5F9',
  },
  quickFactsGrid: {
    gap: s(8),
  },
  qfItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(8),
  },
  qfIcon: {
    fontSize: s(13),
  },
  qfLabel: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  qfLabelDark: {
    color: '#94A3B8',
  },
  qfValue: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1E293B',
    marginTop: vs(1),
    lineHeight: s(16),
  },
  qfValueDark: {
    color: '#E2E8F0',
  },

  /* Timeline */
  timelineWrap: {
    marginTop: vs(20),
    paddingTop: vs(16),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  timelineWrapDark: {
    borderTopColor: '#37275C',
  },
  timelineHeaderTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1B4B',
    marginBottom: vs(14),
  },
  timelineHeaderTitleDark: {
    color: '#FFFFFF',
  },
  stopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    paddingVertical: s(10),
    paddingHorizontal: s(12),
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  stopCardDark: {
    backgroundColor: '#1E1435',
    borderColor: '#37275C',
    shadowOpacity: 0.25,
  },
  stopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  stopHeaderText: {
    flex: 1,
  },
  stopNode: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  stopNodeText: {
    color: '#FFFFFF',
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
  },
  stopLocationTitle: {
    fontSize: s(14),
    lineHeight: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1B4B',
  },
  stopLocationTitleDark: {
    color: '#F9FAFB',
  },
  stopSubText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#7B2CFF',
    marginTop: 1,
  },
  stopSubTextDark: {
    color: '#C4B5FD',
  },
  stopBodyText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#4B5563',
    lineHeight: s(18),
  },
  stopBodyTextDark: {
    color: '#D1D5DB',
  },

  /* Loading & Empty */
  loadingCenterWrap: {
    paddingVertical: vs(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    marginTop: vs(8),
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },
  emptyWrap: {
    paddingVertical: vs(40),
    paddingHorizontal: s(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1F2937',
    marginTop: vs(12),
  },
  emptyTitleDark: {
    color: '#F3F4F6',
  },
  emptySubtitle: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: vs(4),
  },
  emptySubtitleDark: {
    color: '#9CA3AF',
  },
  flexCol: {
    flex: 1,
  },
  customLoaderWrap: {
    minHeight: vs(280),
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: vs(12),
  },
});

export default TravelStoryScreen;
