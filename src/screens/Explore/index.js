import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
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

// ── 1. Nearby Areas Data ──
const NEARBY_AREAS = [
  'Near me',
  'Dwarka',
  'Faridabad',
  'Noida',
  'South Delhi',
  'Ghaziabad',
  'Gurugram',
];

// ── 2. Categories Data matching screenshot exactly ──
const EXPLORE_CATEGORIES = [
  {
    id: 'cities',
    title: 'Cities',
    subtitle: 'Find pet-friendly places by city',
    icon: 'business-outline',
    iconColor: '#7C3AED',
    iconColorDark: '#C084FC',
    iconBg: '#EDE9FE',
    subcategories: ['Explore India'],
  },
  {
    id: 'stays',
    title: 'Pet Friendly Stays',
    subtitle: 'Hotels, resorts & homestays that truly welcome pets',
    icon: 'bed-outline',
    iconColor: '#7C3AED',
    iconColorDark: '#C084FC',
    iconBg: '#EDE9FE',
    subcategories: ['Hotels', 'Resorts', 'Homestays', 'Camps'],
  },
  {
    id: 'wild',
    title: 'Paws in the Wild',
    subtitle: 'Lakes, trails, beaches & forests to explore together',
    icon: 'leaf-outline',
    iconColor: '#10B981',
    iconColorDark: '#34D399',
    iconBg: '#DCFCE7',
    subcategories: ['Lakes', 'Beaches', 'Trails', 'Forests'],
  },
  {
    id: 'eat',
    title: 'Eat Out Together',
    subtitle: 'Cafes & restaurants where your dog sits with you',
    icon: 'cafe-outline',
    iconColor: '#E11D48',
    iconColorDark: '#FB7185',
    iconBg: '#FCE7F3',
    subcategories: ['Cafes', 'Restaurants', 'Rooftops', 'Bakeries'],
  },
  {
    id: 'vet',
    title: 'Vet & Pet Care',
    subtitle: 'Clinics, grooming & boarding near you',
    icon: 'medkit-outline',
    iconColor: '#D97706',
    iconColorDark: '#FBBF24',
    iconBg: '#FEF3C7',
    subcategories: ['Vets', 'Grooming', 'Boarding', 'Pet Stores'],
  },
  {
    id: 'routes',
    title: 'Road Trip Routes',
    subtitle: 'Curated paw-by-paw drives for pet families',
    icon: 'navigate-outline',
    iconColor: '#D97706',
    iconColorDark: '#FBBF24',
    iconBg: '#FEF3C7',
    subcategories: ['Hill Stations', 'Weekend Drives', 'Scenic Routes'],
  },
  {
    id: 'transport',
    title: 'Transport with Dogs',
    subtitle: 'Pet-safe taxis, trains & relocation services',
    icon: 'car-outline',
    iconColor: '#0D9488',
    iconColorDark: '#2DD4BF',
    iconBg: '#CCFBF1',
    subcategories: ['Taxis', 'Trains', 'Relocation', 'Flights'],
  },
  {
    id: 'caravans',
    title: 'Pet-Friendly Caravans',
    subtitle: 'Explore pet-friendly RV and caravan rentals across India',
    icon: 'bus-outline',
    iconColor: '#7C3AED',
    iconColorDark: '#C084FC',
    iconBg: '#EDE9FE',
    subcategories: ['Caravans', 'RV Rentals', 'Motorhomes', 'Road Trips'],
  },
  {
    id: 'offices',
    title: 'Pet Friendly Offices',
    subtitle: 'Workplaces that welcome your dog every day',
    icon: 'briefcase-outline',
    iconColor: '#0284C7',
    iconColorDark: '#38BDF8',
    iconBg: '#E0F2FE',
    subcategories: ['Co-Working', 'Startups', 'Dog-Friendly Desks'],
  },
  {
    id: 'rescue',
    title: 'Pet Welfare & Rescue',
    subtitle: 'Shelters, rescue groups and adoption support across India',
    icon: 'heart-outline',
    iconColor: '#8B5CF6',
    iconColorDark: '#C084FC',
    iconBg: '#EDE9FE',
    subcategories: ['Shelters', 'NGOs', 'Adoption', 'Foster'],
  },
];

// ── 3. Useful Filters ──
const USEFUL_FILTERS = [
  'Tails Verified',
  'Indoor access',
  'Open now',
  'Top rated',
  'No pet fee',
  'Big dogs',
];

// ── 4. Closest Places Data matching screenshot ──
const PLACES_DATA = [
  {
    id: '1',
    name: 'Roots Café in the Park',
    verificationType: 'TEAM VERIFIED',
    verificationColor: '#7C3AED',
    rating: '4.8',
    location: 'Sector 29, Gurugram • 3.1 km',
    area: 'Gurugram',
    tags: ['Outdoor seating', 'No pet fee'],
    filters: ['Tails Verified', 'Top rated', 'No pet fee'],
    category: 'Cafes',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'Tail Trails Dog Park',
    verificationType: 'OWNER VERIFIED',
    verificationColor: '#059669',
    rating: '4.7',
    location: 'Chhatarpur • 4.6 km',
    area: 'South Delhi',
    tags: ['Off-leash zone', 'Big dogs welcome'],
    filters: ['Open now', 'Big dogs'],
    category: 'Trails',
    image:
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Blue Tokai Coffee Roasters',
    verificationType: 'TEAM VERIFIED',
    verificationColor: '#7C3AED',
    rating: '4.9',
    location: 'Saidulajab, Saket • 5.2 km',
    area: 'South Delhi',
    tags: ['Water bowls provided', 'Pet treats'],
    filters: ['Tails Verified', 'Top rated', 'Indoor access'],
    category: 'Cafes',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'Cyberfarm Pet Retreat',
    verificationType: 'TEAM VERIFIED',
    verificationColor: '#7C3AED',
    rating: '4.8',
    location: 'Sector 135, Noida • 6.8 km',
    area: 'Noida',
    tags: ['Natural pool', 'Boarding available'],
    filters: ['Tails Verified', 'Top rated', 'Big dogs'],
    category: 'Resorts',
    image:
      'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&auto=format&fit=crop&q=80',
  },
];

// ── 5. Individual Place Card with 3D tactile borders & Spring Heart ──
const PlaceCard = ({ place, isLiked, onToggleLike }) => {
  const isDarkMode = useStore(state => state.isDarkMode);
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

  return (
    <BouncyPressable
      activeScale={0.97}
      style={[styles.placeCard, isDarkMode && styles.placeCardDark]}>
      {/* Left Place Image */}
      <FastImage
        source={{ uri: place.image, priority: FastImage.priority.normal }}
        style={styles.placeImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      {/* Right Place Content */}
      <View style={styles.placeContent}>
        {/* Top Row: Verification + Rating */}
        <View style={styles.placeTopRow}>
          <Text
            style={[styles.placeVerifiedBadge, { color: place.verificationColor || '#7C3AED' }]}>
            {`✓ ${place.verificationType}`}
          </Text>

          <View style={styles.placeRatingBadge}>
            <Ionicons name="star" size={ms(10)} color="#D97706" style={styles.starIcon} />
            <Text style={styles.placeRatingText}>{place.rating}</Text>
          </View>
        </View>

        {/* Place Name */}
        <Text
          style={[styles.placeName, isDarkMode && styles.placeNameDark]}
          numberOfLines={1}>
          {place.name}
        </Text>

        {/* Place Location */}
        <View style={styles.placeLocationRow}>
          <Ionicons
            name="location-sharp"
            size={ms(11)}
            color={isDarkMode ? '#94A3B8' : '#9CA3AF'}
            style={styles.placePinIcon}
          />
          <Text
            style={[styles.placeLocationText, isDarkMode && styles.placeLocationTextDark]}
            numberOfLines={1}>
            {place.location}
          </Text>
        </View>

        {/* Bottom Row: Tags & Animated Favorite Button */}
        <View style={styles.placeBottomRow}>
          <View style={styles.placeTagsWrap}>
            {place.tags.map((tag, idx) => (
              <View
                key={idx}
                style={[styles.placeTagPill, isDarkMode && styles.placeTagPillDark]}>
                <Text
                  style={[styles.placeTagText, isDarkMode && styles.placeTagTextDark]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <Pressable hitSlop={12} onPress={handleHeartPress} style={styles.heartBtn}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={ms(19)}
                color={isLiked ? '#FF2A7A' : isDarkMode ? '#94A3B8' : '#9CA3AF'}
              />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </BouncyPressable>
  );
};

export const ExploreScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('Near me');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // User and location data
  const isDarkMode = useStore(state => state.isDarkMode);
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

  // Toggle favorite place
  const toggleFavorite = placeId => {
    setFavorites(prev => ({
      ...prev,
      [placeId]: !prev[placeId],
    }));
  };

  // Toggle useful filters
  const handleToggleFilter = filterName => {
    setSelectedFilters(prev =>
      prev.includes(filterName) ? prev.filter(f => f !== filterName) : [...prev, filterName],
    );
  };

  // Handle opening CityList screen
  const handleOpenCityList = () => {
    const targetNav =
      navigation?.getParent?.()?.getParent?.() ||
      navigation?.getParent?.() ||
      navigation;
    try {
      targetNav?.navigate?.('CityList');
    } catch {
      navigation?.navigate?.('CityList');
    }
  };

  // Select category & navigate
  const handleSelectCategory = category => {
    if (category.id === 'cities' || category.title.toLowerCase().includes('cit')) {
      handleOpenCityList();
      return;
    }
    navigation?.navigate?.('SearchScreen', {
      category: category.title,
      subcategory: category.subcategories[0],
    });
  };

  // Select subcategory pill & navigate
  const handleSelectSubcategory = (category, sub) => {
    if (category.id === 'cities' || sub === 'Explore India') {
      handleOpenCityList();
      return;
    }
    setSelectedSubcategory(sub);
    navigation?.navigate?.('SearchScreen', {
      category: category.title,
      subcategory: sub,
    });
  };

  // Pull to refresh simulation
  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // ── Parallax Ambient Glow & Watermark Animations (matching Home screen) ──
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
  const orbMidLeftY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1000],
        outputRange: [0, -80],
      }),
    [scrollY],
  );
  const orbBottomRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 1000],
        outputRange: [0, 100],
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
  const watermarkBottomY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 800],
        outputRange: [0, 90],
      }),
    [scrollY],
  );

  // ── Header Motion ──
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

  // ── 3D Card Tilts and Light Sheen ──
  const nearbyCardScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [-80, 0, 220],
        outputRange: [1.02, 1, 0.985],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const nearbyCardRotateX = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 220],
        outputRange: ['0deg', '2.5deg'],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const categoryScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 250, 600],
        outputRange: [0.985, 1, 0.99],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const categoryRotateX = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 250, 600],
        outputRange: ['-2.5deg', '0deg', '2.5deg'],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const categorySheenX = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 350, 750],
        outputRange: [-s(180), s(60), s(360)],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const filtersScale = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [350, 680, 1050],
        outputRange: [0.98, 1, 0.99],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );
  const filtersRotateX = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [350, 680, 1050],
        outputRange: ['-2.5deg', '0deg', '2.5deg'],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  // Filtered places list
  const filteredPlaces = useMemo(() => {
    return PLACES_DATA.filter(place => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = place.name.toLowerCase().includes(query);
        const matchesLocation = place.location.toLowerCase().includes(query);
        const matchesTags = place.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesName && !matchesLocation && !matchesTags) {
          return false;
        }
      }

      // Nearby Area filter
      if (selectedArea !== 'Near me') {
        if (!place.area.toLowerCase().includes(selectedArea.toLowerCase())) {
          return false;
        }
      }

      // Useful filters
      if (selectedFilters.length > 0) {
        const hasAllFilters = selectedFilters.every(
          f => place.filters.includes(f) || place.tags.includes(f),
        );
        if (!hasAllFilters) {
          return false;
        }
      }

      // Subcategory filter
      if (selectedSubcategory) {
        const matchesSubcategory =
          place.category?.toLowerCase() === selectedSubcategory.toLowerCase() ||
          place.tags.some(t => t.toLowerCase().includes(selectedSubcategory.toLowerCase()));
        if (!matchesSubcategory) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedArea, selectedFilters, selectedSubcategory]);

  return (
    <View
      style={[
        styles.container,
        isDarkMode && styles.containerDark,
        { paddingTop: Math.max(insets.top, s(12)) },
      ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
        translucent={false}
      />

      {/* ── Parallax Ambient Glow Orbs (matching Home screen) ── */}
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

      {/* ── Parallax Ambient Paw Watermarks (matching Home screen) ── */}
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
        {/* ── AppHeader with reactive 3D motion ── */}
        <AppHeader
          userName={userName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={query =>
            navigation?.navigate?.('SearchScreen', {
              query: query !== undefined ? query : searchQuery,
              category: 'Pet Friendly Stays',
            })
          }
          avatarScale={avatarScale}
          avatarRotate={avatarRotate}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
          onNotificationPress={() => navigation?.navigate?.('Notifications')}
          enableCityPicker={true}
          onLocationPress={handleOpenCityList}
        />

        {/* ── Discover Title Section ── */}
        <View style={styles.discoverSection}>
          <BouncyPressable
            style={styles.discoverCityBadge}
            activeScale={0.96}
            onPress={handleOpenCityList}>
            <Text style={styles.discoverSubtitle}>
              {`DISCOVER AROUND ${currentCity.toUpperCase()}`}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={ms(11)}
              color="#7B2CFF"
              style={styles.cityBadgeChevron}
            />
          </BouncyPressable>
          <Text style={[styles.discoverTitle, isDarkMode && styles.discoverTitleDark]}>
            Find a place for both of you
          </Text>
          <Text style={[styles.discoverDescription, isDarkMode && styles.discoverDescriptionDark]}>
            Start nearby, then narrow down by place type and the pet rules that matter to you.
          </Text>
        </View>

        {/* ── Nearby Areas Card with 3D Tilt & Tactile Bevel ── */}
        <Animated.View
          style={[
            styles.nearbyCard,
            isDarkMode && styles.nearbyCardDark,
            {
              transform: [
                { perspective: 1000 },
                { scale: nearbyCardScale },
                { rotateX: nearbyCardRotateX },
              ],
            },
          ]}>
          <View style={styles.nearbyHeaderRow}>
            <Text style={[styles.nearbyCardTitle, isDarkMode && styles.nearbyCardTitleDark]}>
              Nearby areas
            </Text>
            <BouncyPressable
              style={styles.nearbyLocationBadge}
              activeScale={0.92}
              onPress={handleOpenCityList}>
              <Ionicons name="location-sharp" size={ms(12)} color="#10B981" />
              <Text style={styles.nearbyLocationText}>{`${currentCity} · Change`}</Text>
            </BouncyPressable>
          </View>

          <View style={styles.chipsWrap}>
            {NEARBY_AREAS.map(area => {
              const isSelected = selectedArea === area;
              return (
                <BouncyPressable
                  key={area}
                  activeScale={0.93}
                  style={[
                    styles.areaChip,
                    isDarkMode && styles.areaChipDark,
                    isSelected && styles.areaChipActive,
                  ]}
                  onPress={() => setSelectedArea(area)}>
                  {area === 'Near me' && (
                    <Ionicons
                      name="navigate"
                      size={ms(11)}
                      color={isSelected ? '#FFFFFF' : '#7B2CFF'}
                      style={styles.areaChipIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.areaChipText,
                      isDarkMode && styles.areaChipTextDark,
                      isSelected && styles.areaChipTextActive,
                    ]}>
                    {area}
                  </Text>
                </BouncyPressable>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Categories Section with 3D Perspective & Holographic Sheen ── */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionHeading, isDarkMode && styles.sectionHeadingDark]}>
            Categories
          </Text>

          <Animated.View
            style={[
              styles.categoriesCard,
              isDarkMode && styles.categoriesCardDark,
              {
                transform: [
                  { perspective: 1000 },
                  { scale: categoryScale },
                  { rotateX: categoryRotateX },
                ],
              },
            ]}>
            {/* Holographic light sheen sweeping across card */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glassSheenOverlay,
                {
                  transform: [{ translateX: categorySheenX }, { rotate: '25deg' }],
                },
              ]}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0)',
                  'rgba(255, 255, 255, 0.40)',
                  'rgba(255, 255, 255, 0)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {EXPLORE_CATEGORIES.map((category, index) => {
              const isLast = index === EXPLORE_CATEGORIES.length - 1;

              return (
                <View
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    !isLast && (isDarkMode ? styles.categoryItemBorderDark : styles.categoryItemBorder),
                  ]}>
                  {/* Category Left Icon Squircle */}
                  <BouncyPressable
                    activeScale={0.9}
                    style={[
                      styles.categoryIconBox,
                      isDarkMode && styles.categoryIconBoxDark,
                      isDarkMode
                        ? styles[`iconBox_${category.id}_dark`]
                        : styles[`iconBox_${category.id}`],
                    ]}
                    onPress={() => handleSelectCategory(category)}>
                    <Ionicons
                      name={category.icon}
                      size={ms(20)}
                      color={isDarkMode ? category.iconColorDark : category.iconColor}
                    />
                  </BouncyPressable>

                  {/* Category Info */}
                  <Pressable
                    style={styles.categoryInfo}
                    onPress={() => handleSelectCategory(category)}>
                    <Text style={[styles.categoryTitle, isDarkMode && styles.categoryTitleDark]}>
                      {category.title}
                    </Text>
                    <Text style={[styles.categorySubtitle, isDarkMode && styles.categorySubtitleDark]}>
                      {category.subtitle}
                    </Text>

                    {/* Subcategories Pills */}
                    <View style={styles.subcategoriesWrap}>
                      {category.subcategories.map(sub => {
                        const isSubSelected = selectedSubcategory === sub;

                        return (
                          <BouncyPressable
                            key={sub}
                            activeScale={0.91}
                            style={[
                              styles.subcategoryPill,
                              isDarkMode && styles.subcategoryPillDark,
                              isSubSelected && styles.subcategoryPillActive,
                            ]}
                            onPress={() => handleSelectSubcategory(category, sub)}>
                            <Text
                              style={[
                                styles.subcategoryPillText,
                                isDarkMode && styles.subcategoryPillTextDark,
                                isSubSelected && styles.subcategoryPillTextActive,
                              ]}>
                              {sub}
                            </Text>
                          </BouncyPressable>
                        );
                      })}
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </Animated.View>
        </View>

        {/* ── Useful Filters Section with 3D Tilt ── */}
        <View style={styles.usefulFiltersSection}>
          <View style={styles.usefulFiltersHeaderRow}>
            <Text style={[styles.sectionHeadingNoMargin, isDarkMode && styles.sectionHeadingDark]}>
              Useful filters
            </Text>
            <BouncyPressable
              activeScale={0.9}
              style={[styles.openFilterBtn, isDarkMode && styles.openFilterBtnDark]}
              onPress={() => {
                const rootNav =
                  navigation?.getParent?.()?.getParent?.() ||
                  navigation?.getParent?.() ||
                  navigation;
                rootNav?.navigate?.('FilterScreen', {
                  category: 'Pet Friendly Stays',
                });
              }}>
              <Text style={[styles.openFilterBtnText, isDarkMode && styles.openFilterBtnTextDark]}>
                All filters
              </Text>
              <Ionicons
                name="options-outline"
                size={ms(13)}
                color={isDarkMode ? '#A855F7' : '#7B2CFF'}
              />
            </BouncyPressable>
          </View>

          <Animated.View
            style={[
              styles.usefulFiltersCard,
              isDarkMode && styles.usefulFiltersCardDark,
              {
                transform: [
                  { perspective: 1000 },
                  { scale: filtersScale },
                  { rotateX: filtersRotateX },
                ],
              },
            ]}>
            {USEFUL_FILTERS.map(filter => {
              const isFilterActive = selectedFilters.includes(filter);

              return (
                <BouncyPressable
                  key={filter}
                  activeScale={0.93}
                  style={[
                    styles.usefulFilterPill,
                    isDarkMode && styles.usefulFilterPillDark,
                    isFilterActive && (isDarkMode ? styles.usefulFilterPillActiveDark : styles.usefulFilterPillActive),
                  ]}
                  onPress={() => handleToggleFilter(filter)}>
                  {isFilterActive && (
                    <Ionicons
                      name="checkmark"
                      size={ms(12)}
                      color={isDarkMode ? '#A855F7' : '#7B2CFF'}
                      style={styles.filterCheckIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.usefulFilterText,
                      isDarkMode && styles.usefulFilterTextDark,
                      isFilterActive && styles.usefulFilterTextActive,
                    ]}>
                    {filter}
                  </Text>
                </BouncyPressable>
              );
            })}
          </Animated.View>
        </View>

        {/* ── Closest To You Places Section ── */}
        <View style={styles.placesSection}>
          <View style={styles.placesHeaderRow}>
            <View>
              <Text style={[styles.placesTopSubtitle, isDarkMode && styles.placesTopSubtitleDark]}>
                CLOSEST TO YOU
              </Text>
              <Text style={[styles.placesMainTitle, isDarkMode && styles.placesMainTitleDark]}>
                Pet-friendly places
              </Text>
            </View>

            {/* 3D Map Pill Button */}
            <BouncyPressable
              activeScale={0.88}
              style={[styles.mapBtn, isDarkMode && styles.mapBtnDark]}
              onPress={() => navigation?.navigate?.('Map')}>
              <Ionicons
                name="map-outline"
                size={ms(13)}
                color={isDarkMode ? '#A855F7' : '#7B2CFF'}
                style={styles.mapBtnIcon}
              />
              <Text style={[styles.mapBtnText, isDarkMode && styles.mapBtnTextDark]}>Map</Text>
            </BouncyPressable>
          </View>

          {/* Places List */}
          {filteredPlaces.length === 0 ? (
            <View style={styles.noResultsCard}>
              <Ionicons name="search-outline" size={ms(32)} color="#A09AA8" />
              <Text style={styles.noResultsTitle}>No places match your criteria</Text>
              <Text style={styles.noResultsSubtitle}>
                Try clearing selected filters or choosing another area.
              </Text>
              <BouncyPressable
                style={styles.clearFiltersBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedArea('Near me');
                  setSelectedFilters([]);
                  setSelectedSubcategory(null);
                }}>
                <Text style={styles.clearFiltersBtnText}>Reset Filters</Text>
              </BouncyPressable>
            </View>
          ) : (
            filteredPlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
                isLiked={!!favorites[place.id]}
                onToggleLike={toggleFavorite}
              />
            ))
          )}
        </View>
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

  /* ── Ambient Decorative Glows & Watermarks (matching Home screen) ── */
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
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: s(180),
    right: -s(20),
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: s(220),
    left: -s(30),
  },

  /* ── Holographic Light Sheen ── */
  glassSheenOverlay: {
    position: 'absolute',
    top: -s(100),
    bottom: -s(100),
    width: s(140),
    zIndex: 5,
  },

  /* ── Discover Title Section ── */
  discoverSection: {
    paddingHorizontal: s(16),
    marginTop: vs(6),
    marginBottom: vs(16),
  },
  discoverCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  cityBadgeChevron: {
    marginLeft: s(4),
  },
  discoverSubtitle: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  discoverTitle: {
    fontSize: ms(23),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    letterSpacing: -0.4,
    marginTop: vs(4),
    lineHeight: ms(28),
  },
  discoverDescription: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#635E70',
    lineHeight: ms(18),
    marginTop: vs(6),
  },

  /* ── Nearby Areas Card with 3D Bevel ── */
  nearbyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    borderRadius: s(24),
    padding: s(16),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    shadowColor: '#4A1D96',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    marginBottom: vs(20),
  },
  nearbyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(12),
  },
  nearbyCardTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
  },
  nearbyLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyLocationText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#10B981',
    marginLeft: s(3),
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -s(3),
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 2.8,
    borderBottomColor: '#DCD4C6',
    paddingHorizontal: s(13),
    paddingVertical: vs(7),
    borderRadius: s(18),
    marginHorizontal: s(3),
    marginBottom: vs(8),
    shadowColor: '#1D1238',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  areaChipActive: {
    backgroundColor: '#7B2CFF',
    borderTopWidth: 1.5,
    borderTopColor: '#A875FF',
    borderLeftWidth: 1,
    borderLeftColor: '#9354FF',
    borderRightWidth: 1,
    borderRightColor: '#6B1CDD',
    borderBottomWidth: 3.2,
    borderBottomColor: '#5313BA',
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 4,
  },
  areaChipIcon: {
    marginRight: s(4),
  },
  areaChipText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#374151',
  },
  areaChipTextActive: {
    color: '#FFFFFF',
  },

  /* ── Categories Section with 3D Bevel ── */
  categoriesSection: {
    marginBottom: vs(20),
  },
  sectionHeading: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    marginHorizontal: s(16),
    marginBottom: vs(10),
  },
  categoriesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    borderRadius: s(26),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    overflow: 'hidden',
    shadowColor: '#4A1D96',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  categoryItem: {
    flexDirection: 'row',
    paddingHorizontal: s(15),
    paddingVertical: vs(14),
  },
  categoryItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F2EC',
  },
  categoryIconBox: {
    width: s(46),
    height: s(46),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(2),
  },
  iconBox_cities: { backgroundColor: '#EDE9FE' },
  iconBox_stays: { backgroundColor: '#EDE9FE' },
  iconBox_wild: { backgroundColor: '#DCFCE7' },
  iconBox_eat: { backgroundColor: '#FCE7F3' },
  iconBox_vet: { backgroundColor: '#FEF3C7' },
  iconBox_routes: { backgroundColor: '#FEF3C7' },
  iconBox_transport: { backgroundColor: '#CCFBF1' },
  iconBox_caravans: { backgroundColor: '#EDE9FE' },
  iconBox_offices: { backgroundColor: '#E0F2FE' },
  iconBox_rescue: { backgroundColor: '#EDE9FE' },
  categoryInfo: {
    flex: 1,
    marginLeft: s(12),
  },
  categoryTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
  },
  categorySubtitle: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#7E7889',
    marginTop: vs(2),
    lineHeight: ms(16),
  },
  subcategoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: vs(8),
    marginHorizontal: -s(2.5),
  },
  subcategoryPill: {
    backgroundColor: '#F5F3FF',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4.5),
    marginHorizontal: s(2.5),
    marginTop: vs(4),
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 0.8,
    borderLeftColor: '#EDE9FE',
    borderRightWidth: 0.8,
    borderRightColor: '#DDD6FE',
    borderBottomWidth: 1.8,
    borderBottomColor: '#D8CFFD',
  },
  subcategoryPillActive: {
    backgroundColor: '#7B2CFF',
    borderTopColor: '#A875FF',
    borderBottomColor: '#5313BA',
  },
  subcategoryPillText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#7C3AED',
  },
  subcategoryPillTextActive: {
    color: '#FFFFFF',
  },

  /* ── Useful Filters Section with 3D Bevel ── */
  usefulFiltersSection: {
    marginBottom: vs(20),
  },
  usefulFiltersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginBottom: vs(10),
  },
  sectionHeadingNoMargin: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
  },
  openFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: s(10),
    paddingVertical: vs(4.5),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  openFilterBtnText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
    marginRight: s(3),
  },
  usefulFiltersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    borderRadius: s(22),
    padding: s(14),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#4A1D96',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  usefulFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 0.8,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 0.8,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 2.2,
    borderBottomColor: '#DCD4C6',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(16),
    marginRight: s(8),
    marginBottom: vs(8),
    shadowColor: '#1D1238',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  usefulFilterPillActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7B2CFF',
    borderBottomColor: '#6B1CDD',
  },
  filterCheckIcon: {
    marginRight: s(4),
  },
  usefulFilterText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#374151',
  },
  usefulFilterTextActive: {
    color: '#7B2CFF',
  },

  /* ── Closest To You Places Section ── */
  placesSection: {
    marginTop: vs(4),
    marginBottom: vs(12),
  },
  placesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginBottom: vs(12),
  },
  placesTopSubtitle: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7E7889',
    letterSpacing: 0.8,
  },
  placesMainTitle: {
    fontSize: ms(19),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    letterSpacing: -0.3,
    marginTop: vs(2),
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#EDE9FE',
    borderRightWidth: 1,
    borderRightColor: '#DDD6FE',
    borderBottomWidth: 2.8,
    borderBottomColor: '#C4B5FD',
    borderRadius: s(14),
    paddingHorizontal: s(11),
    paddingVertical: vs(5),
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  mapBtnIcon: {
    marginRight: s(4),
  },
  mapBtnText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
  },

  /* ── 3D Tactile Place Card ── */
  placeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: s(15),
    marginBottom: vs(14),
    borderRadius: s(22),
    padding: s(11),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#F5F1E9',
    borderRightWidth: 1.2,
    borderRightColor: '#E8E1D5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DCD4C6',
    flexDirection: 'row',
    shadowColor: '#361466',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  placeImage: {
    width: s(96),
    height: s(96),
    borderRadius: s(16),
    backgroundColor: '#EBE8E1',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  placeContent: {
    flex: 1,
    marginLeft: s(11),
    justifyContent: 'space-between',
    paddingVertical: vs(2),
  },
  placeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeVerifiedBadge: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.4,
  },
  placeRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: s(6.5),
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
  placeRatingText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#B45309',
  },
  placeName: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    marginTop: vs(2),
  },
  placeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(1),
  },
  placePinIcon: {
    marginRight: s(2),
  },
  placeLocationText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    flex: 1,
  },
  placeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(4),
  },
  placeTagsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  placeTagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: s(7),
    paddingVertical: vs(2.5),
    borderRadius: s(6),
    marginRight: s(5),
    marginVertical: vs(1),
    borderWidth: 0.6,
    borderColor: '#E5E7EB',
  },
  placeTagText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#4B5563',
  },
  heartBtn: {
    padding: s(4),
    marginLeft: s(4),
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
  clearFiltersBtn: {
    marginTop: vs(12),
    backgroundColor: '#7B2CFF',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(12),
    borderTopWidth: 1.2,
    borderTopColor: '#A875FF',
    borderBottomWidth: 3,
    borderBottomColor: '#5313BA',
  },
  clearFiltersBtnText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#FFFFFF',
  },

  /* ── Dark Mode Style Classes ── */
  containerDark: {
    backgroundColor: '#0F071D',
  },
  discoverTitleDark: {
    color: '#FFFFFF',
  },
  discoverDescriptionDark: {
    color: '#94A3B8',
  },
  nearbyCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  nearbyCardTitleDark: {
    color: '#FFFFFF',
  },
  areaChipDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  areaChipTextDark: {
    color: '#94A3B8',
  },
  sectionHeadingDark: {
    color: '#FFFFFF',
  },
  categoriesCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  categoryItemBorderDark: {
    borderBottomColor: '#240F44',
  },
  categoryIconBoxDark: {
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBox_cities_dark: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  iconBox_stays_dark: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  iconBox_wild_dark: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  iconBox_eat_dark: {
    backgroundColor: 'rgba(225, 29, 72, 0.22)',
    borderColor: 'rgba(251, 113, 133, 0.35)',
  },
  iconBox_vet_dark: {
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  iconBox_routes_dark: {
    backgroundColor: 'rgba(217, 119, 6, 0.22)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  iconBox_transport_dark: {
    backgroundColor: 'rgba(13, 148, 136, 0.22)',
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  iconBox_caravans_dark: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  iconBox_offices_dark: {
    backgroundColor: 'rgba(2, 132, 199, 0.22)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  iconBox_rescue_dark: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(192, 132, 252, 0.35)',
  },
  categoryTitleDark: {
    color: '#FFFFFF',
  },
  categorySubtitleDark: {
    color: '#94A3B8',
  },
  subcategoryPillDark: {
    backgroundColor: '#220D40',
    borderTopColor: '#3B1A66',
    borderLeftColor: '#33155E',
    borderRightColor: '#33155E',
    borderBottomColor: '#1A0733',
  },
  subcategoryPillTextDark: {
    color: '#DDD6FE',
  },
  usefulFiltersCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  usefulFilterPillDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  usefulFilterPillActiveDark: {
    backgroundColor: '#27104B',
    borderColor: '#7C3AED',
    borderBottomColor: '#5B17C4',
  },
  usefulFilterTextDark: {
    color: '#94A3B8',
  },
  openFilterBtnDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  openFilterBtnTextDark: {
    color: '#A855F7',
  },
  placesTopSubtitleDark: {
    color: '#A855F7',
  },
  placesMainTitleDark: {
    color: '#FFFFFF',
  },
  mapBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  mapBtnTextDark: {
    color: '#A855F7',
  },
  placeCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  placeNameDark: {
    color: '#FFFFFF',
  },
  placeLocationTextDark: {
    color: '#94A3B8',
  },
  placeTagPillDark: {
    backgroundColor: '#27104B',
    borderColor: '#3B1A66',
  },
  placeTagTextDark: {
    color: '#DDD6FE',
  },
  noResultsCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderBottomColor: '#180B2E',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
  },
  noResultsTitleDark: {
    color: '#FFFFFF',
  },
  noResultsSubtitleDark: {
    color: '#94A3B8',
  },
  ambientGlowDark: {
    opacity: 0,
    backgroundColor: 'transparent',
  },
});

export default ExploreScreen;
export { SearchScreen } from './SearchScreen';
export { FilterScreen } from './FilterScreen';
export { CityList, CityList as CityListScreen } from './CityList';
