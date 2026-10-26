import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { AppHeader } from '../../components/common/AppHeader';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { useStore } from '../../store';
import { useUserProfile } from '../../hooks/useUser';

// ── 1. Subcategories Data ──
const SUBCATEGORIES = [
  'All stays',
  'Hotels',
  'Resorts',
  'Homestays',
  'Camps',
];

// ── 2. Initial Active Filter Tags ──
const INITIAL_ACTIVE_FILTERS = ['Verified', 'All breeds', 'Open lawn'];

// ── 3. Stays / Places Data matching screenshot ──
const STAYS_DATA = [
  {
    id: 'stay-1',
    name: 'Aravali Pet Retreat',
    verificationType: 'Tails Verified',
    verificationVariant: 'tails', // purple badge with paw
    rating: '4.9',
    location: 'Gurugram, Haryana • 18 km away',
    tag: 'Pet First',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    category: 'Resorts',
    filters: ['Verified', 'All breeds', 'Open lawn'],
    image:
      'https://images.unsplash.com/photo-1542314831-c53cd3816002?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'stay-2',
    name: 'The Orchard Homestay',
    verificationType: 'Team Verified',
    verificationVariant: 'team', // mint badge with check
    rating: '4.7',
    location: 'Sohna, Haryana • 31 km away',
    tag: 'Pet Friendly',
    tagColor: '#7C3AED',
    tagBg: '#F5F3FF',
    category: 'Homestays',
    filters: ['Verified', 'Open lawn'],
    image:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'stay-3',
    name: 'Hillside Camp & Cottages',
    verificationType: 'Owner Verified',
    verificationVariant: 'owner', // dark charcoal badge
    rating: '4.8',
    location: 'Faridabad, Haryana • 26 km away',
    tag: 'Pet Friendly',
    tagColor: '#7C3AED',
    tagBg: '#F5F3FF',
    category: 'Camps',
    filters: ['Verified', 'All breeds'],
    image:
      'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'stay-4',
    name: 'Kikar Lodge Forest Resort',
    verificationType: 'Tails Verified',
    verificationVariant: 'tails',
    rating: '4.9',
    location: 'Rupnagar, Punjab • 45 km away',
    tag: 'Pet First',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    category: 'Resorts',
    filters: ['Verified', 'All breeds', 'Open lawn'],
    image:
      'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'stay-5',
    name: 'Cyberfarm Farmhouse Villa',
    verificationType: 'Team Verified',
    verificationVariant: 'team',
    rating: '4.8',
    location: 'Sector 135, Noida • 14 km away',
    tag: 'Pet Friendly',
    tagColor: '#7C3AED',
    tagBg: '#F5F3FF',
    category: 'Hotels',
    filters: ['Verified', 'Open lawn'],
    image:
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&auto=format&fit=crop&q=80',
  },
];

// ── 4. Place Card Component ──
const SearchPlaceCard = ({ place, isLiked, onToggleLike }) => {
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleHeartPress = () => {
    onToggleLike(place.id);
    heartScale.setValue(0.65);
    Animated.spring(heartScale, {
      toValue: 1,
      tension: 180,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const isDarkMode = useStore(state => state.isDarkMode);

  const renderBadge = () => {
    if (place.verificationVariant === 'tails') {
      return (
        <View style={styles.badgeTails}>
          <Ionicons name="paw" size={ms(11)} color="#FFFFFF" style={styles.badgeIcon} />
          <Text style={styles.badgeTailsText}>Tails Verified</Text>
        </View>
      );
    }
    if (place.verificationVariant === 'team') {
      return (
        <View style={styles.badgeTeam}>
          <Ionicons name="checkmark" size={ms(12)} color="#065F46" style={styles.badgeIcon} />
          <Text style={styles.badgeTeamText}>Team Verified</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeOwner}>
        <Ionicons name="checkmark" size={ms(12)} color="#FFFFFF" style={styles.badgeIcon} />
        <Text style={styles.badgeOwnerText}>Owner Verified</Text>
      </View>
    );
  };

  return (
    <BouncyPressable activeScale={0.98} style={[styles.cardContainer, isDarkMode && styles.cardContainerDark]}>
      {/* Top Image Container */}
      <View style={[styles.imageWrapper, isDarkMode && styles.imageWrapperDark]}>
        <FastImage
          source={{ uri: place.image, priority: FastImage.priority.normal }}
          style={styles.cardImage}
          resizeMode={FastImage.resizeMode.cover}
        />

        {/* Top Badges Row over image */}
        <View style={styles.imageOverlayTop}>
          {renderBadge()}

          {/* Heart button */}
          <Pressable hitSlop={10} onPress={handleHeartPress} style={[styles.heartButtonCircle, isDarkMode && styles.heartButtonCircleDark]}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={ms(18)}
                color={isLiked ? '#FF2A7A' : (isDarkMode ? '#FFFFFF' : '#1D1238')}
              />
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* Bottom Content Area */}
      <View style={styles.cardContent}>
        {/* Title and Rating Row */}
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]} numberOfLines={1}>
            {place.name}
          </Text>

          <View style={[styles.ratingBadge, isDarkMode && styles.ratingBadgeDark]}>
            <Ionicons name="star" size={ms(10)} color="#F59E0B" style={styles.starIcon} />
            <Text style={[styles.ratingText, isDarkMode && styles.ratingTextDark]}>{place.rating}</Text>
          </View>
        </View>

        {/* Location Row */}
        <View style={styles.cardLocationRow}>
          <Ionicons
            name="location-sharp"
            size={ms(11)}
            color={isDarkMode ? '#64748B' : '#9CA3AF'}
            style={styles.locationPinIcon}
          />
          <Text style={[styles.cardLocationText, isDarkMode && styles.cardLocationTextDark]} numberOfLines={1}>
            {place.location}
          </Text>
        </View>

        {/* Tag Pill */}
        <View style={[styles.featureTagPill, isDarkMode ? styles.featureTagPillDark : { backgroundColor: place.tagBg }]}>
          <Text style={[styles.featureTagText, isDarkMode ? styles.featureTagTextDark : { color: place.tagColor }]}>{place.tag}</Text>
        </View>
      </View>
    </BouncyPressable>
  );
};

export const SearchScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isDarkMode = useStore(state => state.isDarkMode);

  // Route params for dynamic category / title
  const initialCategory = route?.params?.category || 'Pet Friendly Stays';
  const initialQuery = route?.params?.query || '';
  const initialSubcategory = route?.params?.subcategory || 'All stays';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [activeFilterTags, setActiveFilterTags] = useState(INITIAL_ACTIVE_FILTERS);
  const [sortOrder, setSortOrder] = useState('Recommended');
  const [favorites, setFavorites] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  // User & location
  const { data: userProfile } = useUserProfile();
  const storeUser = useStore(state => state.user);
  const globalLocation = useStore(state => state.currentLocation);

  const activeUser =
    userProfile?.account ||
    userProfile?.user ||
    (userProfile?.id ? userProfile : null) ||
    storeUser;

  const userName =
    activeUser?.name ||
    activeUser?.displayName ||
    activeUser?.display_name ||
    activeUser?.full_name ||
    'Pet Parent';

  const currentCity = globalLocation || activeUser?.location || activeUser?.city || 'Delhi NCR';

  // Toggle favorite
  const toggleFavorite = placeId => {
    setFavorites(prev => ({
      ...prev,
      [placeId]: !prev[placeId],
    }));
  };

  // Remove active filter tag
  const removeFilterTag = tag => {
    setActiveFilterTags(prev => prev.filter(t => t !== tag));
  };

  // Pull to refresh simulation
  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  // ── Parallax Ambient Glow & Watermark Animations ──
  const orbTopRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-100, 0, 800],
        outputRange: [-25, 0, -160],
      }),
    [scrollY],
  );
  const orbTopRightScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [1, 1.15],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const orbTopLeftY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-100, 0, 800],
        outputRange: [-15, 0, 90],
      }),
    [scrollY],
  );
  const orbMidRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1000],
        outputRange: [0, -120],
      }),
    [scrollY],
  );
  const watermarkTopY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 800],
        outputRange: [0, -130],
      }),
    [scrollY],
  );
  const orbMidLeftY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1000],
        outputRange: [0, -100],
      }),
    [scrollY],
  );
  const orbBottomRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1000],
        outputRange: [0, -140],
      }),
    [scrollY],
  );
  const watermarkBottomY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1000],
        outputRange: [0, -160],
      }),
    [scrollY],
  );

  // Header motion
  const avatarScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-80, 0, 140],
        outputRange: [1.08, 1, 0.92],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const avatarRotate = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 140],
        outputRange: ['0deg', '6deg'],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const searchBarScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-80, 0, 120],
        outputRange: [1.02, 1, 0.99],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const searchIconRotate = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 140],
        outputRange: ['0deg', '12deg'],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  // Filter places
  const filteredPlaces = useMemo(() => {
    return STAYS_DATA.filter(place => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = place.name.toLowerCase().includes(query);
        const matchesLoc = place.location.toLowerCase().includes(query);
        if (!matchesName && !matchesLoc) {
          return false;
        }
      }

      // Subcategory filter
      if (selectedSubcategory && selectedSubcategory !== 'All stays') {
        if (place.category?.toLowerCase() !== selectedSubcategory.toLowerCase()) {
          return false;
        }
      }

      // Active filter tags
      if (activeFilterTags.length > 0) {
        const matchesAll = activeFilterTags.every(tag => place.filters.includes(tag));
        if (!matchesAll) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedSubcategory, activeFilterTags]);

  const displayedPlaces = filteredPlaces.slice(0, visibleCount);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark, { paddingTop: Math.max(insets.top, s(12)) }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'} translucent={false} />

      {/* ── Parallax Ambient Glow Orbs ── */}
      <Animated.View
        style={[
          styles.ambientGlowTopRight,
          isDarkMode && styles.ambientGlowDark,
          { transform: [{ translateY: orbTopRightY }, { scale: orbTopRightScale }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientGlowTopLeft,
          isDarkMode && styles.ambientGlowDark,
          { transform: [{ translateY: orbTopLeftY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientGlowMidRight,
          isDarkMode && styles.ambientGlowDark,
          { transform: [{ translateY: orbMidRightY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientGlowMidLeft,
          isDarkMode && styles.ambientGlowDark,
          { transform: [{ translateY: orbMidLeftY }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientGlowBottomRight,
          isDarkMode && styles.ambientGlowDark,
          { transform: [{ translateY: orbBottomRightY }] },
        ]}
        pointerEvents="none"
      />

      {/* ── Paw Watermarks ── */}
      <Animated.View
        style={[
          styles.ambientPawWatermarkTop,
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
          styles.ambientPawWatermarkBottom,
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
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#7B2CFF"
            colors={['#7B2CFF', '#EE2A7B']}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, s(20)) + s(95) },
        ]}>
        {/* ── AppHeader ── */}
        <AppHeader
          userName={userName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={query => setSearchQuery(query !== undefined ? query : searchQuery)}
          avatarScale={avatarScale}
          avatarRotate={avatarRotate}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
          onNotificationPress={() => navigation?.navigate?.('Notifications')}
          enableCityPicker={true}
        />

        {/* ── Sub-Header Navigation Row (Back | EXPLORE Title | Map) ── */}
        <View style={styles.navRow}>
          {/* Back Button */}
          <BouncyPressable
            activeScale={0.88}
            style={[styles.navSquareBtn, isDarkMode && styles.navSquareBtnDark]}
            onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={ms(19)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
          </BouncyPressable>

          {/* Center Title */}
          <View style={styles.navTitleCenter}>
            <Text style={[styles.navSubtitle, isDarkMode && styles.navSubtitleDark]}>EXPLORE</Text>
            <Text style={[styles.navTitle, isDarkMode && styles.navTitleDark]} numberOfLines={1}>
              {initialCategory}
            </Text>
          </View>

          {/* Map Button */}
          <BouncyPressable
            activeScale={0.88}
            style={[styles.navSquareBtn, isDarkMode && styles.navSquareBtnDark]}
            onPress={() => navigation?.navigate?.('Map')}>
            <Ionicons name="map-outline" size={ms(19)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
          </BouncyPressable>
        </View>

        {/* ── Hero Gradient Card ("STAYS AROUND YOU") ── */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={['#4C1D95', '#6D28D9', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}>
            {/* Decorative background circle */}
            <View style={styles.heroDecorCircle} />

            {/* Top Tag */}
            <View style={styles.heroTopTagRow}>
              <Ionicons name="bed-outline" size={ms(12)} color="#DDD6FE" />
              <Text style={styles.heroTopTagText}>STAYS AROUND YOU</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroTitle}>{initialCategory}</Text>

            {/* Subtitle */}
            <Text style={styles.heroDescription}>
              Clear pet charges, breed rules and access details before you book.
            </Text>

            {/* Badges Row */}
            <View style={styles.heroBadgesRow}>
              <View style={styles.heroBadgePill}>
                <Ionicons name="checkmark" size={ms(12)} color="#FFFFFF" style={styles.pillIcon} />
                <Text style={styles.heroBadgeText}>120+ verified</Text>
              </View>

              <View style={styles.heroBadgePill}>
                <Ionicons
                  name="location-sharp"
                  size={ms(11)}
                  color="#FFFFFF"
                  style={styles.pillIcon}
                />
                <Text style={styles.heroBadgeText}>{currentCity}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Subcategories Horizontal Pills ── */}
        <View style={styles.subcategoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoriesScroll}>
            {SUBCATEGORIES.map(sub => {
              const isSelected = selectedSubcategory === sub;

              return (
                <BouncyPressable
                  key={sub}
                  activeScale={0.92}
                  style={[
                    styles.subcatChip,
                    isSelected
                      ? styles.subcatChipActive
                      : [styles.subcatChipInactive, isDarkMode && styles.subcatChipInactiveDark],
                  ]}
                  onPress={() => setSelectedSubcategory(sub)}>
                  <Text
                    style={[
                      styles.subcatChipText,
                      isSelected
                        ? styles.subcatChipTextActive
                        : [styles.subcatChipTextInactive, isDarkMode && styles.subcatChipTextInactiveDark],
                    ]}>
                    {sub}
                  </Text>
                </BouncyPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Filters & Sorting Row ── */}
        <View style={styles.filterSortRow}>
          {/* Filters Button with count badge */}
          <BouncyPressable
            activeScale={0.93}
            style={[styles.filtersBtn, isDarkMode && styles.filtersBtnDark]}
            onPress={() => {
              const rootNav =
                navigation?.getParent?.()?.getParent?.() ||
                navigation?.getParent?.() ||
                navigation;
              rootNav?.navigate?.('FilterScreen', {
                category: initialCategory,
                onApplyFilters: applied => {
                  if (applied.tags) {
                    setActiveFilterTags(applied.tags);
                  }
                },
              });
            }}>
            <Text style={[styles.filtersBtnText, isDarkMode && styles.filtersBtnTextDark]}>Filters</Text>
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{activeFilterTags.length}</Text>
            </View>
          </BouncyPressable>

          {/* Sort Dropdown */}
          <BouncyPressable
            activeScale={0.94}
            style={[styles.sortBtn, isDarkMode && styles.sortBtnDark]}
            onPress={() => {
              setSortOrder(prev => (prev === 'Recommended' ? 'Top Rated' : 'Recommended'));
            }}>
            <View style={styles.sortLeftGroup}>
              <Text style={[styles.sortLabel, isDarkMode && styles.sortLabelDark]}>SORT</Text>
              <Text style={[styles.sortValue, isDarkMode && styles.sortValueDark]}>{sortOrder}</Text>
            </View>
            <Ionicons name="chevron-down" size={ms(15)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
          </BouncyPressable>
        </View>

        {/* ── Active Filter Tags Row with close buttons ── */}
        {activeFilterTags.length > 0 && (
          <View style={styles.activeTagsRow}>
            {activeFilterTags.map(tag => (
              <BouncyPressable
                key={tag}
                activeScale={0.92}
                style={[styles.activeTagPill, isDarkMode && styles.activeTagPillDark]}
                onPress={() => removeFilterTag(tag)}>
                <Text style={[styles.activeTagText, isDarkMode && styles.activeTagTextDark]}>{tag}</Text>
                <Ionicons name="close" size={ms(12)} color={isDarkMode ? '#C4B5FD' : '#6B21A8'} style={styles.closeTagIcon} />
              </BouncyPressable>
            ))}
          </View>
        )}

        {/* ── Results Header ── */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCountText, isDarkMode && styles.resultsCountTextDark]}>
            {`${filteredPlaces.length > 0 ? '24' : '0'} stays nearby`}
          </Text>
          <Text style={[styles.resultsSortSubtext, isDarkMode && styles.resultsSortSubtextDark]}>
            {`Sorted by ${sortOrder.toLowerCase()}`}
          </Text>
        </View>

        {/* ── Places Cards List ── */}
        {displayedPlaces.length === 0 ? (
          <View style={[styles.noResultsCard, isDarkMode && styles.noResultsCardDark]}>
            <Ionicons name="search-outline" size={ms(32)} color={isDarkMode ? '#64748B' : '#A09AA8'} />
            <Text style={[styles.noResultsTitle, isDarkMode && styles.noResultsTitleDark]}>No stays match your filters</Text>
            <Text style={[styles.noResultsSubtitle, isDarkMode && styles.noResultsSubtitleDark]}>
              Try clearing active filters or selecting another category.
            </Text>
            <BouncyPressable
              style={styles.resetFiltersBtn}
              onPress={() => {
                setActiveFilterTags(INITIAL_ACTIVE_FILTERS);
                setSelectedSubcategory('All stays');
                setSearchQuery('');
              }}>
              <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
            </BouncyPressable>
          </View>
        ) : (
          displayedPlaces.map(place => (
            <SearchPlaceCard
              key={place.id}
              place={place}
              isLiked={!!favorites[place.id]}
              onToggleLike={toggleFavorite}
            />
          ))
        )}

        {/* ── "Show more stays" Button ── */}
        {displayedPlaces.length < filteredPlaces.length && (
          <BouncyPressable
            activeScale={0.94}
            style={[styles.showMoreBtn, isDarkMode && styles.showMoreBtnDark]}
            onPress={() => setVisibleCount(prev => prev + 3)}>
            <Text style={[styles.showMoreBtnText, isDarkMode && styles.showMoreBtnTextDark]}>Show more stays</Text>
          </BouncyPressable>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollContent: {
    paddingTop: vs(2),
  },

  /* ── Ambient Decorative Glows ── */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -s(40),
    right: -s(60),
    width: s(280),
    height: s(280),
    borderRadius: s(140),
    backgroundColor: 'rgba(233, 213, 255, 0.45)',
  },
  ambientGlowTopLeft: {
    position: 'absolute',
    top: s(70),
    left: -s(90),
    width: s(240),
    height: s(240),
    borderRadius: s(120),
    backgroundColor: 'rgba(254, 240, 215, 0.40)',
  },
  ambientGlowMidRight: {
    position: 'absolute',
    top: s(520),
    right: -s(80),
    width: s(280),
    height: s(280),
    borderRadius: s(140),
    backgroundColor: 'rgba(252, 231, 243, 0.45)',
  },
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: s(180),
    right: -s(20),
  },
  ambientGlowMidLeft: {
    position: 'absolute',
    top: s(380),
    left: -s(80),
    width: s(290),
    height: s(290),
    borderRadius: s(145),
    backgroundColor: 'rgba(254, 240, 215, 0.55)',
  },
  ambientGlowBottomRight: {
    position: 'absolute',
    bottom: s(140),
    right: -s(70),
    width: s(320),
    height: s(320),
    borderRadius: s(160),
    backgroundColor: 'rgba(245, 230, 255, 0.45)',
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: s(220),
    left: -s(30),
  },

  /* ── Sub-Header Navigation Row ── */
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(15),
    marginBottom: vs(14),
    marginTop: vs(2),
  },
  navSquareBtn: {
    width: s(42),
    height: s(42),
    borderRadius: s(15),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  navTitleCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: s(8),
  },
  navSubtitle: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8E93',
    letterSpacing: 0.8,
  },
  navTitle: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    marginTop: vs(1),
  },

  /* ── Hero Gradient Card ── */
  heroCardContainer: {
    marginHorizontal: s(15),
    marginBottom: vs(16),
    borderRadius: s(24),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 3.5,
    borderBottomColor: '#3B0764',
    shadowColor: '#4A1D96',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  heroGradient: {
    padding: s(18),
    borderRadius: s(24),
    position: 'relative',
    overflow: 'hidden',
  },
  heroDecorCircle: {
    position: 'absolute',
    bottom: -s(30),
    right: -s(30),
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroTopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  heroTopTagText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#DDD6FE',
    letterSpacing: 0.8,
    marginLeft: s(5),
  },
  heroTitle: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#E9D5FF',
    lineHeight: ms(17),
    marginTop: vs(5),
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(12),
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(4.5),
    marginRight: s(8),
  },
  pillIcon: {
    marginRight: s(4),
  },
  heroBadgeText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#FFFFFF',
  },

  /* ── Subcategories Horizontal Pills ── */
  subcategoriesSection: {
    marginBottom: vs(14),
  },
  subcategoriesScroll: {
    paddingHorizontal: s(15),
  },
  subcatChip: {
    paddingHorizontal: s(16),
    paddingVertical: vs(7.5),
    borderRadius: s(18),
    marginRight: s(8),
  },
  subcatChipActive: {
    backgroundColor: '#7B2CFF',
    borderTopWidth: 1.2,
    borderTopColor: '#A875FF',
    borderBottomWidth: 3,
    borderBottomColor: '#5313BA',
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  subcatChipInactive: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 2.5,
    borderBottomColor: '#DCD4C6',
  },
  subcatChipText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  subcatChipTextActive: {
    color: '#FFFFFF',
  },
  subcatChipTextInactive: {
    color: '#374151',
  },

  /* ── Filters & Sorting Row ── */
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(15),
    marginBottom: vs(12),
  },
  filtersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingHorizontal: s(15),
    paddingVertical: vs(9),
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 2.8,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersBtnText: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
  },
  filterCountBadge: {
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(7),
  },
  filterCountText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  sortBtn: {
    flex: 1,
    marginLeft: s(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingHorizontal: s(14),
    paddingVertical: vs(9),
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 2.8,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sortLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8E93',
    marginRight: s(6),
  },
  sortValue: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#1D1238',
  },

  /* ── Active Filter Tags Row ── */
  activeTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s(15),
    marginBottom: vs(12),
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderRadius: s(14),
    paddingHorizontal: s(11),
    paddingVertical: vs(5),
    marginRight: s(8),
    marginBottom: vs(6),
    borderWidth: 0.8,
    borderColor: '#E9D5FF',
  },
  activeTagText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#6B21A8',
  },
  closeTagIcon: {
    marginLeft: s(4),
  },

  /* ── Results Header ── */
  resultsHeader: {
    paddingHorizontal: s(15),
    marginBottom: vs(14),
  },
  resultsCountText: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
  },
  resultsSortSubtext: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8E8E93',
    marginTop: vs(1),
  },

  /* ── 3D Places Card ── */
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    marginBottom: vs(16),
    borderRadius: s(24),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#361466',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    height: vs(175),
    position: 'relative',
    backgroundColor: '#EBE8E1',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: s(12),
    left: s(12),
    right: s(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeTails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#581C87',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4.5),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeTailsText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  badgeTeam: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4.5),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeTeamText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#065F46',
  },
  badgeOwner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4.5),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeOwnerText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  badgeIcon: {
    marginRight: s(4),
  },
  heartButtonCircle: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  /* ── Content Below Image ── */
  cardContent: {
    padding: s(14),
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: ms(15.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    flex: 1,
    marginRight: s(8),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: s(7),
    paddingVertical: vs(2.5),
    borderRadius: s(7),
    borderTopWidth: 0.8,
    borderTopColor: '#FFFBEB',
    borderBottomWidth: 1.6,
    borderBottomColor: '#FDE68A',
  },
  starIcon: {
    marginRight: s(2.5),
  },
  ratingText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#B45309',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },
  locationPinIcon: {
    marginRight: s(2.5),
  },
  cardLocationText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    flex: 1,
  },
  featureTagPill: {
    alignSelf: 'flex-start',
    borderRadius: s(8),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    marginTop: vs(8),
  },
  featureTagText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.semiBold,
  },

  /* ── "Show More Stays" Button ── */
  showMoreBtn: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    marginTop: vs(4),
    marginBottom: vs(20),
    borderRadius: s(20),
    paddingVertical: vs(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  showMoreBtnText: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },

  /* ── No Results State ── */
  noResultsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    borderRadius: s(22),
    padding: s(24),
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
  },
  noResultsTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    marginTop: vs(10),
  },
  noResultsSubtitle: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#7E7889',
    textAlign: 'center',
    marginTop: vs(4),
    lineHeight: ms(16),
  },
  resetFiltersBtn: {
    marginTop: vs(12),
    backgroundColor: '#7B2CFF',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(12),
  },
  resetFiltersBtnText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#FFFFFF',
  },

  /* ── Luxury Dark Mode Theme Overrides ── */
  containerDark: {
    backgroundColor: '#0F071D',
  },
  ambientGlowDark: {
    opacity: 0,
    backgroundColor: 'transparent',
  },
  imageWrapperDark: {
    backgroundColor: '#1E0E38',
  },
  navSquareBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  navSubtitleDark: {
    color: '#A78BFA',
  },
  navTitleDark: {
    color: '#FFFFFF',
  },
  subcatChipInactiveDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
  },
  subcatChipTextInactiveDark: {
    color: '#94A3B8',
  },
  filtersBtnDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  filtersBtnTextDark: {
    color: '#FFFFFF',
  },
  sortBtnDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  sortLabelDark: {
    color: '#A78BFA',
  },
  sortValueDark: {
    color: '#FFFFFF',
  },
  activeTagPillDark: {
    backgroundColor: '#261245',
    borderColor: '#3B1D6E',
  },
  activeTagTextDark: {
    color: '#C4B5FD',
  },
  resultsCountTextDark: {
    color: '#FFFFFF',
  },
  resultsSortSubtextDark: {
    color: '#94A3B8',
  },
  cardContainerDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  heartButtonCircleDark: {
    backgroundColor: '#1E0E38',
    shadowColor: '#000000',
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  ratingBadgeDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderTopColor: 'rgba(245, 158, 11, 0.3)',
    borderBottomColor: 'rgba(245, 158, 11, 0.4)',
  },
  ratingTextDark: {
    color: '#FCD34D',
  },
  cardLocationTextDark: {
    color: '#94A3B8',
  },
  featureTagPillDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  featureTagTextDark: {
    color: '#C4B5FD',
  },
  showMoreBtnDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
    borderBottomColor: '#1E0E38',
    shadowColor: '#000000',
  },
  showMoreBtnTextDark: {
    color: '#C4B5FD',
  },
  noResultsCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
  },
  noResultsTitleDark: {
    color: '#FFFFFF',
  },
  noResultsSubtitleDark: {
    color: '#94A3B8',
  },
});

export default SearchScreen;
