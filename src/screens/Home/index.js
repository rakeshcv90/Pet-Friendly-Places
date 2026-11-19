/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useUserProfile, useSavePlace } from '../../hooks/useUser';
import { useHomeData, resolveImageUrl } from '../../hooks/useDiscovery';
import { useStore } from '../../store';
import { mapApiCategories } from '../../utils/categories';
import { AppHeader } from '../../components/common/AppHeader';
import {
  BouncyPressable,
  AnimatedCategoryItem,
  AnimatedRehomeOption,
  useHomeAnimations,
  StoryCoverImage,
  StoryOverlay,
  styles,
  UrbaniaBanner,
} from './components';
import { LoaderCard } from '../../components/common/Loader';

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const heartBurstAnim = useRef(new Animated.Value(1)).current;

  const { data: userProfileData } = useUserProfile();
  const isDarkMode = useStore(state => state.isDarkMode);
  const storeUser = useStore(state => state.user);

  const userName = useMemo(() => {
    const user =
      userProfileData?.account ||
      userProfileData?.user ||
      (userProfileData?.id ? userProfileData : null) ||
      storeUser;
    return user?.name || user?.displayName || user?.display_name || user?.full_name || 'Pet Parent';
  }, [userProfileData, storeUser]);

  const {
    data: homeData,
    refetch: refetchHome,
    isRefetching: isHomeRefetching,
    isLoading: isHomeLoading,
  } = useHomeData();

  // Memoized Tails Verified listing
  const tailsListing = homeData?.tails_verified_listings?.[0];

  // The heart saves this place to the account (POST / DELETE /accounts/me/saved/{id})
  const { saved: isFavorite, toggle: toggleSaved } = useSavePlace(tailsListing?.id, tailsListing);
  const handleToggleFavorite = useCallback(() => {
    if (!toggleSaved()) {
      return;
    }
    heartBurstAnim.setValue(0.6);
    Animated.spring(heartBurstAnim, {
      toValue: 1,
      friction: 3,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [toggleSaved, heartBurstAnim]);
  const tailsData = useMemo(() => {
    if (!tailsListing) return null;
    return {
      imageUri: resolveImageUrl(tailsListing.main_image_url),
      title: tailsListing.name,
      location: [tailsListing.city, tailsListing.state].filter(Boolean).join(', '),
      highlight: tailsListing.excerpt_highlight || tailsListing.specific_type,
      price: tailsListing.price_range,
      rating: tailsListing.google_rating || tailsListing.user_average_rating,
    };
  }, [tailsListing]);

  const {
    imageUri: tailsImageUri,
    title: tailsTitle,
    location: tailsLocation,
    highlight: tailsHighlight,
    price: tailsPrice,
    rating: tailsRating,
  } = tailsData || {};

  // Memoized Recently Verified listing
  const recentListing = homeData?.recently_verified?.[0];

  const recentData = useMemo(() => {
    if (!recentListing) return null;
    return {
      imageUri: resolveImageUrl(recentListing.main_image_url),
      title: recentListing.name,
      location:
        [recentListing.local_area || recentListing.famous_area, recentListing.city]
          .filter(Boolean)
          .join(' • ') || recentListing.city,
      category: recentListing.category || recentListing.specific_type,
      rating: recentListing.google_rating || recentListing.user_average_rating,
    };
  }, [recentListing]);

  const {
    imageUri: recentImageUri,
    title: recentTitle,
    location: recentLocation,
    category: recentCategory,
    rating: recentRating,
  } = recentData || {};

  // Dynamic Real Travel Stories solely from API (homeData.stories)
  const storiesList = useMemo(() => {
    if (!homeData?.stories || !Array.isArray(homeData.stories)) {
      return [];
    }
    return homeData.stories.map(item => ({
      id: String(item.id),
      slug: item.slug,
      title: item.title,
      excerpt: item.excerpt,
      imageUri: resolveImageUrl(item.cover_image_url),
      pillText: item.destination
        ? `${(item.story_type || 'Travel Story').toUpperCase()} • ${item.destination.toUpperCase()}`
        : (item.story_type || 'Travel Story').toUpperCase(),
    }));
  }, [homeData?.stories]);

  // Dynamic Curated Road Trips solely from API (homeData.routes)
  const roadTripsList = useMemo(() => {
    if (!homeData?.routes || !Array.isArray(homeData.routes)) {
      return [];
    }
    return homeData.routes.map(route => ({
      id: String(route.id),
      badge: `${route.total_distance_km ? `${route.total_distance_km} KM` : 'ROAD TRIP'} • ${
        route.est_drive_hours ? `${route.est_drive_hours}H DRIVE` : 'SCENIC'
      }`,
      // The API sends no `title` for routes, so build it from the cities like the Routes screen does
      title: route.title || `${route.origin_city || ''} → ${route.destination_city || ''}`,
      details: `${route.stop_count || 0} pet stops • ${route.origin_city || ''} to ${
        route.destination_city || ''
      }`,
      image: resolveImageUrl(route.cover_image_url),
      slug: route.slug,
    }));
  }, [homeData?.routes]);

  // Dynamic Categories solely from homeData.top_categories (API only)
  const categoriesList = useMemo(
    () => mapApiCategories(homeData?.top_categories),
    [homeData?.top_categories],
  );

  const handleCategoryPress = useCallback(
    cat => {
      setSelectedCategory(cat.id);
      navigation.navigate('SearchScreen', { apiCategory: cat.id, category: cat.name });
    },
    [navigation],
  );

  const handleRefresh = useCallback(() => {
    refetchHome();
  }, [refetchHome]);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Scroll-driven 3D parallax & micro-animations
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
    heroScale,
    heroRotateX,
    heroImageParallax,
    heroSheenX,
    heroPillScale,
    heroBtnScale,
    categoryScale,
    categoryRotateX,
    catRow2Scale,
    storyHeaderOpacity,
    storyScale,
    storyRotateX,
    storyOpacity,
    storyImageParallax,
    storySheenX,
    storyPillScale,
    tailsHeaderOpacity,
    tailsScale,
    tailsRotateX,
    tailsOpacity,
    tailsImageParallax,
    tailsBadgeScale,
    favoriteBtnScale,
    recentHeaderOpacity,
    recentScale,
    recentRotateX,
    recentOpacity,
    rehomeScale,
    rehomeRotateX,
    rehomeOpacity,
    rehomeBtn1Scale,
    rehomeBtn2Scale,
    rehomeBtn3Scale,
    roadTripHeaderOpacity,
    roadTripScale,
    roadTripRotateX,
    roadTripOpacity,
  } = useHomeAnimations(scrollY);

  // Quick actions: header fade-in, staggered card slide-in and a looping CTA nudge
  const quickHeaderAnim = useRef(new Animated.Value(0)).current;
  const quickCardAnims = useRef([new Animated.Value(0), new Animated.Value(0)]).current;
  const quickNudge = useRef(new Animated.Value(0)).current;
  const quickShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(quickHeaderAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        140,
        quickCardAnims.map(v =>
          Animated.spring(v, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
        ),
      ),
    ]).start();
    const nudgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(quickNudge, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(quickNudge, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    nudgeLoop.start();
    // Quick wiggle every few seconds to catch the eye
    const shakeStep = toValue =>
      Animated.timing(quickShake, { toValue, duration: 70, useNativeDriver: true });
    const shakeLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        shakeStep(1),
        shakeStep(-1),
        shakeStep(1),
        shakeStep(-1),
        shakeStep(0),
      ]),
    );
    shakeLoop.start();
    return () => {
      nudgeLoop.stop();
      shakeLoop.stop();
    };
  }, [quickHeaderAnim, quickCardAnims, quickNudge, quickShake]);

  // dir: -1 = left card (tilts left, enters from left), 1 = right card
  const quickTileStyle = (anim, dir) => ({
    opacity: anim,
    transform: [
      { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [dir * s(60), 0] }) },
      {
        rotate: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${dir * 12}deg`, `${dir * 2}deg`],
        }),
      },
      { translateX: quickShake.interpolate({ inputRange: [-1, 1], outputRange: [-s(3), s(3)] }) },
      {
        rotate: quickShake.interpolate({ inputRange: [-1, 1], outputRange: ['-1.5deg', '1.5deg'] }),
      },
    ],
  });
  const quickNudgeStyle = {
    transform: [
      { translateX: quickNudge.interpolate({ inputRange: [0, 1], outputRange: [0, s(3)] }) },
    ],
  };

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
        refreshControl={
          <RefreshControl
            refreshing={isHomeRefetching}
            onRefresh={handleRefresh}
            tintColor="#7B2CFF"
            colors={['#7B2CFF', '#EE2A7B']}
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, s(20)) + s(90) },
        ]}>
        <AppHeader
          // greeting={greeting}
          userName={userName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={query => {
            const text = (query !== undefined ? query : searchQuery || '').trim();
            if (!text) {
              return;
            }
            // SearchScreen calls GET /listings?q=<text>&page_size=18
            navigation.navigate('SearchScreen', { query: text });
            // Clear the Home search box so it's empty when the user comes back
            setSearchQuery('');
          }}
          avatarScale={avatarScale}
          avatarRotate={avatarRotate}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
        />

        <UrbaniaBanner onBookNow={() => navigation.navigate('UrbaniaBookingScreen')} />
{/* 
        <Animated.View
          style={[
            styles.heroCard,
            {
              transform: [{ perspective: 1000 }, { scale: heroScale }, { rotateX: heroRotateX }],
            },
          ]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { transform: [{ translateY: heroImageParallax }, { scale: 1.12 }] },
            ]}>
            <FastImage
              source={theme.images.home}
              style={{ width: '100%', height: '100%' }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </Animated.View>

          <LinearGradient
            colors={['rgba(25, 10, 45, 0.88)', 'rgba(25, 10, 45, 0.65)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />

          
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glassSheenOverlay,
              {
                transform: [{ translateX: heroSheenX }, { rotate: '25deg' }],
              },
            ]}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0)',
                'rgba(255, 255, 255, 0.22)',
                'rgba(255, 255, 255, 0)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          <View style={styles.heroContent}>
            <View style={styles.heroTopGroup}>
              <Animated.View
                style={[styles.alignSelfStart, { transform: [{ scale: heroPillScale }] }]}>
                <View style={styles.heroPillBadge}>
                  <Ionicons name="home-sharp" size={ms(10)} color="#FFFFFF" />
                  <Text style={styles.heroPillText}>MADE FOR PET PARENTS</Text>
                </View>
              </Animated.View>

              <Text style={styles.heroTitle}>Traveling is better{'\n'}with your pet.</Text>
              <Text style={styles.heroSubtitle}>
                Verified stays, cafes and trails—without the guesswork.
              </Text>
            </View>

            <Animated.View
              style={[styles.alignSelfStart, { transform: [{ scale: heroBtnScale }] }]}>
              <BouncyPressable
                style={styles.heroCtaBtn}
                activeScale={0.92}
                onPress={() => navigation.navigate('Explore')}>
                <Text style={styles.heroCtaText}>Explore nearby</Text>
                <Feather
                  name="arrow-right"
                  size={ms(16)}
                  color="#3B108F"
                  style={styles.btnArrowMargin}
                />
              </BouncyPressable>
            </Animated.View>
          </View>
        </Animated.View> */}

        {/* Loading Indicator when initial home data is in-flight */}
        {isHomeLoading && !homeData && (
          <View style={{ paddingVertical: s(40), alignItems: 'center', justifyContent: 'center' }}>
            <LoaderCard label="Finding pet-friendly places..." isDarkMode={isDarkMode} />
          </View>
        )}

        {categoriesList && categoriesList.length > 0 ? (
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
            <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
              FIND YOUR KIND OF PLACE
            </Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Explore by category
            </Text>

            <View style={styles.categoriesGrid}>
              {categoriesList.map((cat, index) => (
                <Animated.View
                  key={cat.id}
                  style={[
                    styles.categoryCol,
                    index >= 4 ? { transform: [{ scale: catRow2Scale }] } : null,
                  ]}>
                  <AnimatedCategoryItem
                    cat={cat}
                    isSelected={selectedCategory === cat.id}
                    onPress={() => handleCategoryPress(cat)}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* ── 5. Real travel stories ── */}
        {storiesList.length > 0 ? (
          <>
            <Animated.View style={{ opacity: storyHeaderOpacity }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                    NEW FROM THE COMMUNITY
                  </Text>
                  <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                    Real travel stories
                  </Text>
                </View>
                <BouncyPressable
                  testID="view-all-stories-btn"
                  activeScale={0.9}
                  onPress={() => navigation.navigate('TravelStoryScreen')}>
                  <Text style={[styles.viewAllText, isDarkMode && styles.viewAllTextDark]}>
                    View all
                  </Text>
                </BouncyPressable>
              </View>
            </Animated.View>

            {storiesList?.length === 1 ? (
              <Animated.View
                style={[
                  styles.storyCard,
                  {
                    opacity: storyOpacity,
                    transform: [
                      { perspective: 1000 },
                      { scale: storyScale },
                      { rotateX: storyRotateX },
                    ],
                  },
                ]}>
                <BouncyPressable
                  containerStyle={StyleSheet.absoluteFillObject}
                  style={styles.fullSize}
                  activeScale={0.97}
                  onPress={() =>
                    navigation.navigate('TravelStoryScreen', { initialStoryId: storiesList[0].id })
                  }>
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFillObject,
                      { transform: [{ translateY: storyImageParallax }, { scale: 1.12 }] },
                    ]}>
                    <StoryCoverImage uri={storiesList[0].imageUri} />
                  </Animated.View>

                  <StoryOverlay />

                  {/* Dynamic Glass Holographic Sheen */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.glassSheenOverlay,
                      {
                        transform: [{ translateX: storySheenX }, { rotate: '25deg' }],
                      },
                    ]}>
                    <LinearGradient
                      colors={[
                        'rgba(255, 255, 255, 0)',
                        'rgba(255, 255, 255, 0.2)',
                        'rgba(255, 255, 255, 0)',
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                  </Animated.View>

                  <View style={styles.storyContent}>
                    <Animated.View
                      style={[styles.alignSelfStart, { transform: [{ scale: storyPillScale }] }]}>
                      <View style={styles.storyTopPill}>
                        <Text style={styles.storyTopPillText} numberOfLines={1}>
                          {storiesList[0].pillText}
                        </Text>
                      </View>
                    </Animated.View>

                    <View>
                      <Text style={styles.storyTitle} numberOfLines={2}>
                        {storiesList[0].title}
                      </Text>
                      <Text style={styles.storyDesc} numberOfLines={2}>
                        {storiesList[0].excerpt}
                      </Text>
                      <View style={styles.storyLinkRow}>
                        <Text style={styles.storyLinkText}>Read Story</Text>
                        <Feather
                          name="arrow-right"
                          size={ms(13)}
                          color="#FFFFFF"
                          style={styles.linkArrowMargin}
                        />
                      </View>
                    </View>
                  </View>
                </BouncyPressable>
              </Animated.View>
            ) : (
              <Animated.View
                style={{
                  opacity: storyOpacity,
                  transform: [
                    { perspective: 1000 },
                    { scale: storyScale },
                    { rotateX: storyRotateX },
                  ],
                }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesScroll}>
                  {storiesList?.map(item => (
                    <BouncyPressable
                      key={item.id}
                      style={styles.storyScrollCard}
                      activeScale={0.97}
                      onPress={() =>
                        navigation.navigate('TravelStoryScreen', { initialStoryId: item.id })
                      }>
                      <StoryCoverImage uri={item.imageUri} />
                      <StoryOverlay />

                      <View style={styles.storyContent}>
                        <View style={styles.storyTopPill}>
                          <Text style={styles.storyTopPillText} numberOfLines={1}>
                            {item.pillText}
                          </Text>
                        </View>

                        <View>
                          <Text style={styles.storyTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.storyDesc} numberOfLines={2}>
                            {item.excerpt}
                          </Text>
                          <View style={styles.storyLinkRow}>
                            <Text style={styles.storyLinkText}>Read Story</Text>
                            <Feather
                              name="arrow-right"
                              size={ms(13)}
                              color="#FFFFFF"
                              style={styles.linkArrowMargin}
                            />
                          </View>
                        </View>
                      </View>
                    </BouncyPressable>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </>
        ) : null}

        {/* ── 6. Tails Verified ── */}
        {tailsListing ? (
          <>
            <Animated.View style={{ opacity: tailsHeaderOpacity }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                    PERSONALLY VISITED BY OUR PACK
                  </Text>
                  <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                    Tails Verified
                  </Text>
                </View>
                <BouncyPressable
                  style={[styles.circleArrowBtn, isDarkMode && styles.circleArrowBtnDark]}
                  activeScale={0.85}
                  onPress={() =>
                    navigation.navigate('SearchScreen', {
                      tailsVerified: true,
                      category: 'Tails Verified',
                    })
                  }
                  >
                  <Feather
                    name="arrow-right"
                    size={ms(18)}
                    color={isDarkMode ? '#A855F7' : '#7B2CFF'}
                  />
                </BouncyPressable>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.tailsVerifiedCard,
                isDarkMode && styles.tailsVerifiedCardDark,
                {
                  opacity: tailsOpacity,
                  transform: [
                    { perspective: 1000 },
                    { scale: tailsScale },
                    { rotateX: tailsRotateX },
                  ],
                },
              ]}>
              <BouncyPressable
                style={styles.fullWidth}
                activeScale={0.975}
                onPress={() => {
                  navigation?.navigate?.('ListingDetailScreen', { slug: tailsListing.slug });
                }}>
                <View style={styles.tailsImageContainer}>
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFillObject,
                      { transform: [{ translateY: tailsImageParallax }, { scale: 1.12 }] },
                    ]}>
                    <FastImage
                      source={{
                        uri: tailsImageUri,
                      }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </Animated.View>

                  {/* Tails Verified Badge with Gradient & Glow */}
                  <Animated.View
                    style={[styles.tailsBadgeOverlay, { transform: [{ scale: tailsBadgeScale }] }]}>
                    <LinearGradient
                      colors={['#4C1D95', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="paw" size={ms(10)} color="#FFFFFF" />
                    <Text style={styles.tailsBadgeText}>Tails Verified</Text>
                  </Animated.View>

                  {/* Favorite Button with Heart Burst Pop */}
                  <Animated.View
                    style={[
                      styles.favoriteBtn,
                      isDarkMode && styles.favoriteBtnDark,
                      { transform: [{ scale: favoriteBtnScale }] },
                    ]}>
                    <Pressable style={styles.centerFill} onPress={handleToggleFavorite}>
                      <Animated.View style={{ transform: [{ scale: heartBurstAnim }] }}>
                        <Ionicons
                          name={isFavorite ? 'heart' : 'heart-outline'}
                          size={ms(16)}
                          color={isFavorite ? '#E11D48' : isDarkMode ? '#FFFFFF' : '#000000'}
                        />
                      </Animated.View>
                    </Pressable>
                  </Animated.View>
                </View>

                <View style={[styles.tailsDetails, isDarkMode && styles.tailsDetailsDark]}>
                  <View style={styles.tailsTitleRow}>
                    <Text
                      style={[styles.placeTitle, isDarkMode && styles.placeTitleDark]}
                      numberOfLines={1}>
                      {tailsTitle}
                    </Text>
                    {tailsRating ? (
                      <View style={[styles.ratingBadge, isDarkMode && styles.ratingBadgeDark]}>
                        <Ionicons
                          name="star"
                          size={ms(10)}
                          color={isDarkMode ? '#F59E0B' : '#D97706'}
                        />
                        <Text style={[styles.ratingText, isDarkMode && styles.ratingTextDark]}>
                          {tailsRating}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {tailsLocation ? (
                    <View style={styles.placeLocationRow}>
                      <Ionicons name="location-outline" size={ms(12)} color="#8E8E93" />
                      <Text
                        style={[
                          styles.placeLocationText,
                          isDarkMode && styles.placeLocationTextDark,
                        ]}>
                        {tailsLocation}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.tailsBottomRow}>
                    <View style={styles.tagsGroup}>
                      {tailsHighlight ? (
                        <View style={[styles.tagPill, isDarkMode && styles.tagPillDark]}>
                          <Ionicons
                            name="sparkles"
                            size={ms(10)}
                            color="#7C3AED"
                            style={{ marginRight: s(4) }}
                          />
                          <Text
                            style={[styles.tagText, isDarkMode && styles.tagTextDark]}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {tailsHighlight}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {tailsPrice ? (
                      <View style={styles.priceContainer}>
                        <Text
                          style={[styles.priceBold, isDarkMode && styles.priceBoldDark]}
                          numberOfLines={1}>
                          {tailsPrice}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </BouncyPressable>
            </Animated.View>
          </>
        ) : null}

        {/* ── 7. Recently verified near you ── */}
        {recentListing ? (
          <>

            <Animated.View style={{ opacity: recentHeaderOpacity }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                    FRESHLY CHECKED AROUND DELHI NCR
                  </Text>
                  <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                    Recently verified 
                  </Text>
                </View>
                <BouncyPressable
                  style={[styles.circleArrowBtn, isDarkMode && styles.circleArrowBtnDark]}
                  activeScale={0.85}
                  onPress={() =>
                    navigation.navigate('SearchScreen', {
                      verifiedOnly: true,
                      category: 'Recently Verified',
                    })
                  }>
                  <Feather
                    name="arrow-right"
                    size={ms(18)}
                    color={isDarkMode ? '#A855F7' : '#7B2CFF'}
                  />
                </BouncyPressable>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: recentOpacity,
                transform: [
                  { perspective: 1000 },
                  { scale: recentScale },
                  { rotateX: recentRotateX },
                ],
              }}>
              <BouncyPressable
                style={[styles.recentCompactCard, isDarkMode && styles.recentCompactCardDark]}
                activeScale={0.965}
                onPress={() => {
                  navigation?.navigate?.('ListingDetailScreen', { slug: recentListing.slug });
                }}>
                <View style={styles.recentImgContainer}>
                  <FastImage
                    source={{
                      uri: recentImageUri,
                    }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                </View>

                <View style={styles.recentInfoContainer}>
                  <View style={styles.recentTopRow}>
                    {recentCategory ? (
                      <View
                        style={[
                          styles.recentCategoryPill,
                          isDarkMode && styles.recentCategoryPillDark,
                        ]}>
                        <Ionicons name="sparkles" size={ms(10)} color="#7B2CFF" />
                        <Text
                          style={[
                            styles.recentCategoryText,
                            isDarkMode && styles.recentCategoryTextDark,
                          ]}>
                          {recentCategory}
                        </Text>
                      </View>
                    ) : null}
                    {recentRating ? (
                      <View
                        style={[
                          styles.recentRatingBadge,
                          isDarkMode && styles.recentRatingBadgeDark,
                        ]}>
                        <Ionicons
                          name="star"
                          size={ms(9)}
                          color={isDarkMode ? '#F59E0B' : '#D97706'}
                        />
                        <Text
                          style={[
                            styles.recentRatingText,
                            isDarkMode && styles.recentRatingTextDark,
                          ]}>
                          {recentRating}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={[styles.recentTitle, isDarkMode && styles.recentTitleDark]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {recentTitle}
                  </Text>

                  {recentLocation ? (
                    <View style={styles.recentLocationRow}>
                      <Ionicons name="location-outline" size={ms(15)} color="#8E8E93" />
                      <Text
                        style={[
                          styles.recentLocationText,
                          isDarkMode && styles.recentLocationTextDark,
                        ]}
                        numberOfLines={1}>
                        {recentLocation}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.recentAmenitiesRow}>
                    <View
                      style={[
                        styles.amenityVerifiedPill,
                        isDarkMode && styles.amenityVerifiedPillDark,
                      ]}>
                      <Ionicons name="checkmark-circle" size={ms(10)} color="#059669" />
                      <Text
                        style={[
                          styles.amenityVerifiedText,
                          isDarkMode && styles.amenityVerifiedTextDark,
                        ]}>
                        Verified
                      </Text>
                    </View>
                    <View style={[styles.amenityPetPill, isDarkMode && styles.amenityPetPillDark]}>
                      <Ionicons name="paw" size={ms(9)} color="#7C3AED" />
                      <Text style={styles.amenityPetText}>Pet Friendly</Text>
                    </View>
                  </View>
                </View>
              </BouncyPressable>
            </Animated.View>
          </>
        ) : null}

        {/* ── 8. Help a pet find their way (Reunite & Rehome) ── */}
        <Animated.View
          style={[
            styles.rehomeCardWrapper,
            {
              opacity: rehomeOpacity,
              transform: [
                { perspective: 1000 },
                { scale: rehomeScale },
                { rotateX: rehomeRotateX },
              ],
            },
          ]}>
          <LinearGradient
            colors={isDarkMode ? ['#1C0E34', '#120824'] : ['#FFFFFF', '#FBF9FE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.rehomeCard, isDarkMode && styles.rehomeCardDark]}>
            {/* Ambient subtle light orb in corner */}
            <View
              style={[styles.rehomeCardAmbientOrb, isDarkMode && styles.rehomeCardAmbientOrbDark]}
              pointerEvents="none"
            />

            <Pressable
              style={styles.rehomeTopRow}
              onPress={() => navigation.navigate('ReuniteScreen', { initialTab: 'all' })}>
              <View style={styles.rehomeBadgeContainer}>
                <LinearGradient
                  colors={['#FF4E7E', '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.rehomeIconBadge}>
                  <Ionicons name="heart" size={ms(20)} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <View style={styles.rehomeTextGroup}>
                <View style={styles.rehomeOverlineRow}>
                  <View style={[styles.rehomePulseDot, isDarkMode && styles.rehomePulseDotDark]} />
                  <Text style={[styles.rehomeOverline, isDarkMode && styles.rehomeOverlineDark]}>
                    Reunite & rehome
                  </Text>
                </View>
                <Text style={[styles.rehomeTitle, isDarkMode && styles.rehomeTitleDark]}>
                  Help a pet find their way
                </Text>
                <Text style={[styles.rehomeSubtitle, isDarkMode && styles.rehomeSubtitleDark]}>
                  Quick access to urgent community posts near you.
                </Text>
              </View>

              <View style={[styles.rehomeArrowCircle, isDarkMode && styles.rehomeArrowCircleDark]}>
                <Feather
                  name="arrow-up-right"
                  size={ms(16)}
                  color={isDarkMode ? '#C084FC' : '#7B2CFF'}
                />
              </View>
            </Pressable>

            {/* Subtle Divider */}
            <View style={[styles.rehomeDivider, isDarkMode && styles.rehomeDividerDark]} />

            {/* 3 Interactive Action Mini-Cards */}
            <View style={styles.rehomeActionRow}>
              <Animated.View
                style={[styles.rehomeBtnCol, { transform: [{ scale: rehomeBtn1Scale }] }]}>
                <AnimatedRehomeOption
                  icon="alert-circle"
                  label="Lost pet"
                  tag="URGENT"
                  tagColor={isDarkMode ? '#FB7185' : '#E11D48'}
                  tagBg={isDarkMode ? 'rgba(244, 63, 94, 0.16)' : '#FFE4E6'}
                  gradientColors={['#FF4E7E', '#E11D48']}
                  buttonStyle={isDarkMode ? styles.rehomeCardLostDark : styles.rehomeCardLost}
                  labelColor={isDarkMode ? '#FFFFFF' : '#1F0F3D'}
                  onPress={() => navigation.navigate('ReuniteScreen', { initialTab: 'lost' })}
                />
              </Animated.View>

              <Animated.View
                style={[styles.rehomeBtnCol, { transform: [{ scale: rehomeBtn2Scale }] }]}>
                <AnimatedRehomeOption
                  icon="search"
                  label="Found pet"
                  tag="REPORT"
                  tagColor={isDarkMode ? '#C084FC' : '#7B2CFF'}
                  tagBg={isDarkMode ? 'rgba(168, 85, 247, 0.16)' : '#F3E8FF'}
                  gradientColors={['#A855F7', '#7B2CFF']}
                  buttonStyle={isDarkMode ? styles.rehomeCardFoundDark : styles.rehomeCardFound}
                  labelColor={isDarkMode ? '#FFFFFF' : '#1F0F3D'}
                  onPress={() => navigation.navigate('ReuniteScreen', { initialTab: 'found' })}
                />
              </Animated.View>

              <Animated.View
                style={[styles.rehomeBtnCol, { transform: [{ scale: rehomeBtn3Scale }] }]}>
                <AnimatedRehomeOption
                  icon="home"
                  label="Needs home"
                  tag="ADOPT"
                  tagColor={isDarkMode ? '#34D399' : '#059669'}
                  tagBg={isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5'}
                  gradientColors={['#10B981', '#059669']}
                  buttonStyle={isDarkMode ? styles.rehomeCardAdoptDark : styles.rehomeCardAdopt}
                  labelColor={isDarkMode ? '#FFFFFF' : '#1F0F3D'}
                  onPress={() => navigation.navigate('ReuniteScreen', { initialTab: 'adopt' })}
                />
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 9. Curated road trips ── */}
        {roadTripsList && roadTripsList.length > 0 ? (
          <>
            <Animated.View style={{ opacity: roadTripHeaderOpacity }}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                    ROUTES TESTED FOR REAL LIFE
                  </Text>
                  <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                    Curated road trips
                  </Text>
                </View>
                <BouncyPressable
                  testID="view-all-road-trips-btn"
                  activeScale={0.9}
                  onPress={() => navigation.navigate('RoadTripRoutesScreen')}>
                  <Text style={[styles.viewAllText, isDarkMode && styles.viewAllTextDark]}>
                    View all
                  </Text>
                </BouncyPressable>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: roadTripOpacity,
                transform: [
                  { perspective: 1000 },
                  { scale: roadTripScale },
                  { rotateX: roadTripRotateX },
                ],
              }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roadTripsScroll}>
                {roadTripsList.map(trip => (
                  <BouncyPressable
                    key={trip.id}
                    style={[styles.roadTripCard, isDarkMode && styles.roadTripCardDark]}
                    activeScale={0.95}
                    onPress={() =>
                      navigation.navigate('RoadTripDetailScreen', {
                        slug: trip.slug,
                      })
                    }>
                    {trip.image ? (
                      <FastImage
                        source={{ uri: trip.image }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      // Routes currently come back without a cover image
                      <LinearGradient
                        colors={['#3B108F', '#7B2CFF', '#EE2A7B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}>
                        <Ionicons
                          name="car-sport"
                          size={ms(90)}
                          color="rgba(255, 255, 255, 0.12)"
                          style={styles.roadTripPlaceholderIcon}
                        />
                      </LinearGradient>
                    )}
                    <LinearGradient
                      colors={['rgba(15, 6, 32, 0.3)', 'rgba(15, 6, 32, 0.88)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />

                    <View style={styles.roadTripContent}>
                      <View style={styles.roadTripPill}>
                        <Text style={styles.roadTripPillText} numberOfLines={1}>
                          {trip.badge}
                        </Text>
                      </View>

                      <View>
                        <Text style={styles.roadTripTitle} numberOfLines={2}>
                          {trip.title}
                        </Text>
                        <Text style={styles.roadTripDetails} numberOfLines={1}>
                          {trip.details}
                        </Text>
                        <View style={styles.roadTripLinkRow}>
                          <Text style={styles.roadTripLinkText}>View route</Text>
                          <Feather
                            name="arrow-right"
                            size={ms(12)}
                            color="#FFFFFF"
                            style={styles.linkArrowMargin}
                          />
                        </View>
                      </View>
                    </View>
                  </BouncyPressable>
                ))}
              </ScrollView>
            </Animated.View>
          </>
        ) : null}

        {/* ── 10. Quick Actions: Add place + Transport with Dogs ── */}
        <Animated.View
          style={{
            opacity: quickHeaderAnim,
            transform: [
              {
                translateY: quickHeaderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [s(12), 0],
                }),
              },
            ],
          }}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                MORE FOR PET PARENTS
              </Text>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Quick actions
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.quickTilesRow}>
          {[
            {
              key: 'add-place',
              colors: ['#2E0A5C', '#5B21B6', '#8B5CF6'],
              border: '#3B0F73',
              accent: '#FBBF24',
              accentText: '#1E1035',
              icon: 'storefront',
              overline: 'HELP THE PACK GROW',
              title: 'Add a place',
              desc: 'Add it for review',
              ctaIcon: 'plus',
              onPress: () => navigation.navigate('AddPlaceScreen'),
            },
            {
              key: 'transport',
              colors: ['#053F3A', '#0F766E', '#2DD4BF'],
              border: '#064E48',
              accent: '#99F6E4',
              accentText: '#134E4A',
              icon: 'car',
              overline: 'TRAVEL EASY',
              title: 'Transport With Dogs',
              desc: 'Taxis, trains & more',
              ctaIcon: 'arrow-right',
              onPress: () => navigation.navigate('TransportScreen'),
            },
          ].map((tile, i) => (
            <Animated.View
              key={tile.key}
              style={[styles.quickTileWrap, quickTileStyle(quickCardAnims[i], i === 0 ? -1 : 1)]}>
              <BouncyPressable style={styles.fullWidth} activeScale={0.97} onPress={tile.onPress}>
                <LinearGradient
                  colors={tile.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.quickTile, { borderBottomColor: tile.border }]}>
                  {/* Large faint watermark icon */}
                  <Ionicons
                    name={tile.icon}
                    size={ms(96)}
                    color="rgba(255,255,255,0.09)"
                    style={styles.quickTileWatermark}
                  />
                  {/* Soft top glass highlight */}
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
                    style={styles.quickTileGloss}
                  />
                  <View style={styles.quickTileTop}>
                    <View style={[styles.quickActionBadge, { backgroundColor: tile.accent }]}>
                      <Ionicons name={tile.icon} size={ms(18)} color={tile.accentText} />
                    </View>
                    <Animated.View style={[styles.quickTilePill, quickNudgeStyle]}>
                      <Feather name={tile.ctaIcon} size={ms(16)} color={tile.accentText} />
                    </Animated.View>
                  </View>
                  <View>
                    <Text style={styles.quickTileOverline} numberOfLines={1}>
                      {tile.overline}
                    </Text>
                    <Text style={styles.quickTileTitle}>{tile.title}</Text>
                    <Text style={styles.quickActionDesc} numberOfLines={1}>
                      {tile.desc}
                    </Text>
                  </View>
                </LinearGradient>
              </BouncyPressable>
            </Animated.View>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export { ReuniteScreen } from './ReuniteScreen';
export { ReuniteListScreen } from './ReuniteListScreen';
export { ReuniteDetailScreen } from './ReuniteDetailScreen';
export { PetAlertsScreen } from './PetAlertsScreen';
export { AddPlaceScreen } from './AddPlaceScreen';
export { TransportScreen } from './TransportScreen';
export { TransportModeScreen } from './TransportModeScreen';
export { TravelStoryScreen } from './TravelStoryScreen';
export { StoryDetailScreen } from './StoryDetailScreen';
export { RoadTripRoutesScreen } from './RoadTripRoutesScreen';
export { RoadTripDetailScreen } from './RoadTripDetailScreen';
export { RoadTripStopDetailScreen } from './RoadTripStopDetailScreen';
export { UrbaniaBookingScreen } from './UrbaniaBookingScreen';
