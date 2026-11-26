import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Animated,
  Pressable,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage, { prefetchImages } from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme, images } from '../../theme';
import { LoaderCard } from '../../components/common/Loader';
import { AppHeader } from '../../components/common/AppHeader';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { useStore } from '../../store';
import { useUserProfile } from '../../hooks/useUser';
import { useInfiniteListings, resolveImageUrl } from '../../hooks/useDiscovery';
import { useSavePlace } from '../../hooks/useUser';
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  STAY_SUBCATEGORIES,
  categoryLabel,
  filtersToChips,
  filtersToParams,
  removeFilter,
  resolveApiCategory,
} from './listingFilters';

// ── Subcategory chips (Stays only) ──
const SUBCATEGORIES = Object.keys(STAY_SUBCATEGORIES);

const PET_TAGS = {
  pet_first: { tag: 'Pet First', tagColor: '#FFFFFF', tagBg: '#34B38A' },
  pet_friendly: { tag: 'Pet Friendly', tagColor: '#FFFFFF', tagBg: '#7B2CFF' },
  pet_tolerant: { tag: 'Pet Tolerant', tagColor: '#3B2A00', tagBg: '#F8B84E' },
};

// Short category names shown above the title (same wording as the website cards)
const CATEGORY_CARD_LABELS = {
  vet: 'Vet',
  'Pet Clinic': 'Vet',
  PET_BOARDING: 'Boarding',
  'Pet Food Shop': 'Pet Store',
  Stays: 'Stays',
  Cafe: 'Cafe',
  Restaurant: 'Restaurant',
  Resort: 'Resort',
  'Pet Store': 'Pet Store',
  'Nature & Water': 'Nature & Water',
  PET_RELOCATION: 'Pet Relocation',
  'Pet Experience': 'Pet Experience',
  Outdoor: 'Outdoor',
  'Pet Welfare & Rescue': 'Pet Welfare & Rescue',
  TAXI_SERVICE: 'Pet Taxi',
  CARAVAN: 'Caravan',
  Transport: 'Transport',
  'Travel & Transport': 'Transport',
};

// Stays show their type (Hotel, Homestay...) above the title, like the website
const STAY_TYPE_LABELS = {
  hotel: 'Hotel',
  hostel: 'Hostel',
  resort: 'Resort',
  resort_hotel: 'Resort',
  airbnb: 'Airbnb',
  oyo: 'OYO',
  homestay: 'Homestay',
  private_guest_room: 'Homestay',
  farmstay: 'Farmstay',
  guest_house: 'Guest House',
  bed_and_breakfast: 'Bed & Breakfast',
  campground: 'Campground',
};

const cardCategoryName = item =>
  (item.category === 'Stays' && STAY_TYPE_LABELS[String(item.specific_type || '').toLowerCase()]) ||
  CATEGORY_CARD_LABELS[item.category] ||
  item.category ||
  '';

const formatViews = n => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : `${n}`);

// Excerpt with the highlighted phrase emphasised, like the website
const renderExcerpt = (excerpt, highlight, isDarkMode) => {
  const at = highlight ? excerpt.indexOf(highlight) : -1;
  if (at === -1) {
    return excerpt;
  }
  return [
    excerpt.slice(0, at),
    <Text key="hl" style={[styles.excerptHighlight, isDarkMode && styles.excerptHighlightDark]}>
      {highlight}
    </Text>,
    excerpt.slice(at + highlight.length),
  ];
};

// Listings API item -> what the card renders
const toPlace = item => {
  const rating = item.user_average_rating || item.google_rating;
  let verificationVariant = null;
  if (item.tails_verified || item.verification_tier === 'TAILS_VERIFIED') {
    verificationVariant = 'tails';
  } else if (item.owner_claimed) {
    verificationVariant = 'owner';
  } else if (item.verification_status === 'verified') {
    verificationVariant = 'team';
  }
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    verificationVariant,
    rating: rating ? Number(rating).toFixed(1) : null,
    reviews: item.review_count || item.google_review_count || null,
    categoryName: cardCategoryName(item),
    excerpt: item.excerpt || item.excerpt_highlight || '',
    highlight: item.excerpt_highlight || '',
    // Call is only offered for vets
    phone: item.category === 'vet' ? item.booking_phone || item.phone || '' : '',
    famousArea: item.famous_area || '',
    petsInPool: Boolean(item.pets_in_pool),
    views: item.view_count || 0,
    location: [
      ...new Set([item.local_area, item.city, item.state].filter(Boolean)),
    ].join(', '),
    image: item.main_image_url ? resolveImageUrl(item.main_image_url) : null,
    ...(PET_TAGS[item.pet_friendliness_level] || {}),
  };
};

// ── 4. Place Card Component ──
const SearchPlaceCard = ({ place, onPress }) => {
  const heartScale = useRef(new Animated.Value(1)).current;
  // The heart saves the place to the account (POST / DELETE /accounts/me/saved/{id})
  const { saved: isLiked, toggle } = useSavePlace(place.id, {
    id: place.id,
    slug: place.slug,
    name: place.name,
    main_image_url: place.image,
    city: place.location,
  });

  const handleHeartPress = () => {
    if (!toggle()) {
      return;
    }
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
    if (place.verificationVariant === 'owner') {
      return (
      <View style={styles.badgeOwner}>
        <Ionicons name="checkmark" size={ms(12)} color="#FFFFFF" style={styles.badgeIcon} />
        <Text style={styles.badgeOwnerText}>Owner Verified</Text>
      </View>
      );
    }
    return null;
  };

  return (
    <BouncyPressable
      activeScale={0.98}
      onPress={onPress}
      testID={`search-place-${place.slug}`}
      style={[styles.cardContainer, isDarkMode && styles.cardContainerDark]}>
      {/* Top Image Container */}
      <View style={[styles.imageWrapper, isDarkMode && styles.imageWrapperDark]}>
        <FastImage
          source={place.image ? { uri: place.image, priority: FastImage.priority.normal } : images.noimage}
          style={styles.cardImage}
          resizeMode={FastImage.resizeMode.cover}
        />

        {/* Top Badges Row over image */}
        <View style={styles.imageOverlayTop}>
          <View style={styles.badgeColumn}>
            {renderBadge()}
            {place.tag ? (
              <View style={[styles.petLevelBadge, { backgroundColor: place.tagBg }]}>
                <Text style={[styles.petLevelText, { color: place.tagColor }]}>{place.tag}</Text>
              </View>
            ) : null}
          </View>

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
        {place.petsInPool ? (
          <View style={styles.poolBadge}>
            <Text style={styles.poolBadgeText}>Pets Allowed in Pool</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Content Area */}
      <View style={styles.cardContent}>
        {place.categoryName ? (
          <Text style={[styles.cardCategory, isDarkMode && styles.cardCategoryDark]} numberOfLines={1}>
            {place.categoryName}
          </Text>
        ) : null}

        <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]} numberOfLines={2}>
          {place.name}
        </Text>

        {/* Location Row */}
        <View style={styles.cardLocationRow}>
          <Ionicons
            name="location-sharp"
            size={ms(11)}
            color={isDarkMode ? '#64748B' : '#9CA3AF'}
            style={styles.locationPinIcon}
          />
          <Text style={[styles.cardLocationText, isDarkMode && styles.cardLocationTextDark]} numberOfLines={2}>
            {place.location}
          </Text>
        </View>

        {place.famousArea ? (
          <Text style={[styles.famousAreaText, isDarkMode && styles.cardLocationTextDark]} numberOfLines={1}>
            Famous area: {place.famousArea}
          </Text>
        ) : null}

        {place.excerpt ? (
          <Text style={[styles.cardSummary, isDarkMode && styles.cardLocationTextDark]} numberOfLines={5}>
            {renderExcerpt(place.excerpt, place.highlight, isDarkMode)}
          </Text>
        ) : null}

        {/* Footer: call, views, open */}
        <View style={styles.cardFooter}>
          {place.phone ? (
            <Pressable
              hitSlop={8}
              onPress={() => Linking.openURL(`tel:${place.phone.replace(/\s+/g, '')}`)}
              style={styles.callButton}>
              <Ionicons name="call" size={ms(12)} color="#FFFFFF" />
              <Text style={styles.callButtonText}>Call</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <View style={styles.cardFooterRight}>
            <Ionicons name="eye-outline" size={ms(13)} color="#A09AA8" />
            <Text style={styles.viewsText}>{formatViews(place.views)}</Text>
            <View style={styles.openCircle}>
              <Ionicons name="arrow-forward" size={ms(14)} color="#92700C" />
            </View>
          </View>
        </View>
      </View>
    </BouncyPressable>
  );
};

export const SearchScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isDarkMode = useStore(state => state.isDarkMode);

  // Route params: `apiCategory` is the listings API category id; `category` is a display title
  const initialApiCategory = resolveApiCategory(route?.params?.apiCategory, route?.params?.category);
  const tailsVerifiedOnly = Boolean(route?.params?.tailsVerified);
  const verifiedOnly = Boolean(route?.params?.verifiedOnly);
  const initialQuery = route?.params?.query || '';
  const routeSubcategory = route?.params?.subcategory;
  const initialSubcategory = SUBCATEGORIES.includes(routeSubcategory) ? routeSubcategory : 'All stays';

  const [apiCategory, setApiCategory] = useState(initialApiCategory);
  const [searchText, setSearchText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState('relevance');
  const [sortOpen, setSortOpen] = useState(false);
  const sortOption = SORT_OPTIONS.find(o => o.key === sortKey) || SORT_OPTIONS[0];

  const categoryTitle =
    (apiCategory && categoryLabel(apiCategory)) || route?.params?.category || 'All places';
  const isStays = apiCategory === 'Stays';
  const filterChips = useMemo(() => filtersToChips(filters), [filters]);

  const queryParams = useMemo(
    () => ({
      ...filtersToParams(filters),
      q: submittedQuery.trim() || undefined,
      tails_verified: tailsVerifiedOnly ? 'true' : undefined,
      verified_only: verifiedOnly ? 'true' : undefined,
      sort: sortOption.param,
      specific_type: isStays ? STAY_SUBCATEGORIES[selectedSubcategory] || undefined : undefined,
    }),
    [
      filters,
      submittedQuery,
      isStays,
      selectedSubcategory,
      tailsVerifiedOnly,
      verifiedOnly,
      sortOption.param,
    ],
  );

  // "Paws in the Wild": the API's `Outdoor` group already includes `Nature & Water`,
  // so one request returns the full set (a second request would only duplicate rows).
  const listingsCategory = apiCategory === 'Nature & Water' ? 'Outdoor' : apiCategory;

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings({ category: listingsCategory || undefined, filters: queryParams });

  const total = data?.pages?.[0]?.total ?? 0;
  const places = useMemo(() => {
    const seen = new Set();
    return (data?.pages ?? [])
      .flatMap(page => page?.items ?? [])
      .filter(item => {
        if (seen.has(item.id)) {
          return false;
        }
        seen.add(item.id);
        return true;
      })
      .map(toPlace);
  }, [data?.pages]);

  React.useEffect(() => {
    prefetchImages(places.map(place => place.image));
  }, [places]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: true,
  });

  const renderPlace = useCallback(
    ({ item }) => (
      <SearchPlaceCard
        place={item}
        onPress={() => navigation?.navigate?.('ListingDetailScreen', { slug: item.slug })}
      />
    ),
    [navigation],
  );

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

      <Animated.FlatList
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        data={isLoading ? [] : places}
        keyExtractor={item => String(item.id)}
        renderItem={renderPlace}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor="#7B2CFF"
            colors={['#7B2CFF', '#EE2A7B']}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, s(20)) + s(95) },
        ]}
        ListHeaderComponent={
          <>
        {/* ── AppHeader ── */}
        <AppHeader
          userName={userName}
          searchQuery={searchText}
          onSearchChange={setSearchText}
          onSearchSubmit={query => setSubmittedQuery(query !== undefined ? query : searchText)}
          avatarScale={avatarScale}
          avatarRotate={avatarRotate}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
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
              {categoryTitle}
            </Text>
          </View>

          {/* Map Button */}
          {/* <BouncyPressable
            activeScale={0.88}
            style={[styles.navSquareBtn, isDarkMode && styles.navSquareBtnDark]}
            onPress={() => navigation?.navigate?.('Map')}>
            <Ionicons name="map-outline" size={ms(19)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
          </BouncyPressable> */}
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
              <Text style={styles.heroTopTagText}>{isStays ? 'STAYS AROUND YOU' : 'PLACES AROUND YOU'}</Text>
            </View>

            {/* Headline */}
            <Text style={styles.heroTitle}>{categoryTitle}</Text>

            {/* Subtitle */}
            <Text style={styles.heroDescription}>
              Clear pet charges, breed rules and access details before you book.
            </Text>

            {/* Badges Row */}
            <View style={styles.heroBadgesRow}>
              <View style={styles.heroBadgePill}>
                <Ionicons name="checkmark" size={ms(12)} color="#FFFFFF" style={styles.pillIcon} />
                <Text style={styles.heroBadgeText}>{`${total} places`}</Text>
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

        {/* ── Subcategories Horizontal Pills (Stays only) ── */}
        {isStays ? (
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
        ) : null}

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
                category: apiCategory,
                filters,
                onApplyFilters: applied => {
                  setFilters(applied.filters);
                  if (applied.category !== apiCategory) {
                    setApiCategory(applied.category);
                    setSelectedSubcategory('All stays');
                  }
                },
              });
            }}>
            <Text style={[styles.filtersBtnText, isDarkMode && styles.filtersBtnTextDark]}>Filters</Text>
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{filterChips.length}</Text>
            </View>
          </BouncyPressable>

          {/* Sort Dropdown */}
          <BouncyPressable
            activeScale={0.94}
            style={[styles.sortBtn, isDarkMode && styles.sortBtnDark]}
            onPress={() => setSortOpen(open => !open)}>
            <View style={styles.sortLeftGroup}>
              <Text style={[styles.sortLabel, isDarkMode && styles.sortLabelDark]}>SORT</Text>
              <Text style={[styles.sortValue, isDarkMode && styles.sortValueDark]}>{sortOption.label}</Text>
            </View>
            <Ionicons name={sortOpen ? 'chevron-up' : 'chevron-down'} size={ms(15)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
          </BouncyPressable>
        </View>

        {sortOpen ? (
          <View style={[styles.sortMenu, isDarkMode && styles.sortMenuDark]}>
            {SORT_OPTIONS.map(option => {
              const selected = option.key === sortKey;
              return (
                <Pressable
                  key={option.key}
                  style={[styles.sortMenuItem, selected && styles.sortMenuItemActive]}
                  onPress={() => {
                    setSortKey(option.key);
                    setSortOpen(false);
                  }}>
                  <Text
                    style={[
                      styles.sortMenuText,
                      isDarkMode && styles.sortMenuTextDark,
                      selected && styles.sortMenuTextActive,
                    ]}>
                    {option.label}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={ms(16)} color="#7B2CFF" /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* ── Active Filter Tags Row with close buttons ── */}
        {filterChips.length > 0 && (
          <View style={styles.activeTagsRow}>
            {filterChips.map(chip => (
              <BouncyPressable
                key={chip.key}
                activeScale={0.92}
                style={[styles.activeTagPill, isDarkMode && styles.activeTagPillDark]}
                onPress={() => setFilters(prev => removeFilter(prev, chip.key))}>
                <Text style={[styles.activeTagText, isDarkMode && styles.activeTagTextDark]}>{chip.label}</Text>
                <Ionicons name="close" size={ms(12)} color={isDarkMode ? '#C4B5FD' : '#6B21A8'} style={styles.closeTagIcon} />
              </BouncyPressable>
            ))}
          </View>
        )}

        {/* ── Results Header ── */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCountText, isDarkMode && styles.resultsCountTextDark]}>
            {`${total} ${isStays ? 'stays' : 'places'} ${filterChips.length > 0 ? 'found' : 'nearby'}`}
          </Text>
          <Text style={[styles.resultsSortSubtext, isDarkMode && styles.resultsSortSubtextDark]}>
            {`Sorted by ${sortOption.label.toLowerCase()}`}
          </Text>
        </View>

          </>
        }
        ListEmptyComponent={
          isLoading ? (
            <LoaderCard label="Loading…" isDarkMode={isDarkMode} style={styles.listLoader} />
          ) : (
            <View style={[styles.noResultsCard, isDarkMode && styles.noResultsCardDark]}>
              <Ionicons
                name={isError ? 'cloud-offline-outline' : 'search-outline'}
                size={ms(32)}
                color={isDarkMode ? '#64748B' : '#A09AA8'}
              />
              <Text style={[styles.noResultsTitle, isDarkMode && styles.noResultsTitleDark]}>
                {isError ? 'Could not load places' : 'No places match your filters'}
              </Text>
              <Text style={[styles.noResultsSubtitle, isDarkMode && styles.noResultsSubtitleDark]}>
                {isError
                  ? 'Pull down to retry.'
                  : 'Try clearing active filters or selecting another category.'}
              </Text>
              {!isError ? (
                <BouncyPressable
                  style={styles.resetFiltersBtn}
                  onPress={() => {
                    setFilters(DEFAULT_FILTERS);
                    setSelectedSubcategory('All stays');
                    setSearchText('');
                    setSubmittedQuery('');
                  }}>
                  <Text style={styles.resetFiltersBtnText}>Reset Filters</Text>
                </BouncyPressable>
              ) : null}
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <LoaderCard label="Loading more…" isDarkMode={isDarkMode} style={styles.listLoader} />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sortMenu: {
    marginHorizontal: s(15),
    marginBottom: vs(10),
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    paddingVertical: vs(6),
    borderWidth: 1,
    borderColor: '#E8E1D5',
    shadowColor: '#361466',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  sortMenuDark: { backgroundColor: '#1A0B30', borderColor: '#4C1D95' },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(11),
  },
  sortMenuItemActive: { backgroundColor: 'rgba(123,44,255,0.08)' },
  sortMenuText: { fontSize: ms(13.5), color: '#1D1238', fontFamily: theme.typography.fontFamily.medium },
  sortMenuTextDark: { color: '#E2E8F0' },
  sortMenuTextActive: { color: '#7B2CFF', fontFamily: theme.typography.fontFamily.bold },
  listLoader: {
    marginHorizontal: s(15),
    marginVertical: s(16),
  },
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
    height: vs(120),
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
    alignItems: 'flex-start',
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
    paddingHorizontal: s(14),
    paddingTop: s(10),
    paddingBottom: s(12),
  },
  cardSummary: {
    fontSize: ms(11.5),
    lineHeight: ms(16),
    color: '#6B6480',
    marginTop: vs(5),
    fontFamily: theme.typography.fontFamily.regular,
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
  },
  cardCategory: {
    fontSize: ms(10.5),
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#7B2CFF',
    marginBottom: vs(3),
    fontFamily: theme.typography.fontFamily.bold,
  },
  badgeColumn: { alignItems: 'flex-start', flex: 1 },
  petLevelBadge: {
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    marginTop: vs(6),
  },
  petLevelText: { fontSize: ms(11), fontFamily: theme.typography.fontFamily.bold },
  poolBadge: {
    position: 'absolute',
    left: s(12),
    bottom: s(12),
    backgroundColor: 'rgba(15,118,110,0.92)',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  poolBadgeText: { fontSize: ms(10), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  famousAreaText: {
    fontSize: ms(11),
    color: '#6B6480',
    marginTop: vs(3),
    fontFamily: theme.typography.fontFamily.regular,
  },
  cardCategoryDark: { color: '#A855F7' },
  excerptHighlight: {
    backgroundColor: '#FDF0B8',
    color: '#4A3A06',
    fontFamily: theme.typography.fontFamily.bold,
  },
  excerptHighlightDark: { backgroundColor: '#5B4A10', color: '#FDF0B8' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(10),
  },
  cardFooterRight: { flexDirection: 'row', alignItems: 'center' },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E6B4A',
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(6),
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    marginLeft: s(5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  viewsText: {
    fontSize: ms(11),
    color: '#A09AA8',
    marginLeft: s(4),
    marginRight: s(10),
    fontFamily: theme.typography.fontFamily.regular,
  },
  openCircle: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#FDF0B8',
    alignItems: 'center',
    justifyContent: 'center',
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
  ratingBadgeEmpty: {
    backgroundColor: '#F3F0EA',
    borderBottomColor: '#E4DED2',
  },
  ratingTextEmpty: {
    color: '#8A8496',
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
    marginTop: vs(7),
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
