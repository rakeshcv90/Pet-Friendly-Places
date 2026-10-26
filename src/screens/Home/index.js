import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  StatusBar,
  Pressable,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useUserProfile } from '../../hooks/useUser';
import { useHomeData, resolveImageUrl } from '../../hooks/useDiscovery';
import { useStore } from '../../store';
import { mapApiCategories } from '../../utils/categories';
import { AppHeader } from '../../components/common/AppHeader';
import {
  BouncyPressable,
  AnimatedCategoryItem,
  AnimatedRehomeOption,
  useHomeAnimations,
  styles,
} from './components';

export const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const heartBurstAnim = useRef(new Animated.Value(1)).current;

  const handleToggleFavorite = () => {
    setIsFavorite(prev => !prev);
    heartBurstAnim.setValue(0.6);
    Animated.spring(heartBurstAnim, {
      toValue: 1,
      friction: 3,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const { data } = useUserProfile();
  const isDarkMode = useStore(state => state.isDarkMode);
  const storeUser = useStore(state => state.user);
  const user = data?.account || data?.user || (data?.id ? data : null) || storeUser;
  const userName =
    user?.name || user?.displayName || user?.display_name || user?.full_name || 'Pet Parent';

  const { data: homeData, refetch: refetchHome, isRefetching: isHomeRefetching } = useHomeData();
  useFocusEffect(
    useCallback(() => {
      refetchHome();
    }, [refetchHome]),
  );

  // Dynamic Tails Verified listing solely from API
  const tailsListing = homeData?.tails_verified_listings?.[0];
  const tailsImageUri = resolveImageUrl(tailsListing?.main_image_url);
  const tailsTitle = tailsListing?.name;
  const tailsLocation = [tailsListing?.city, tailsListing?.state].filter(Boolean).join(', ');
  const tailsHighlight = tailsListing?.excerpt_highlight || tailsListing?.specific_type;
  const tailsPrice = tailsListing?.price_range;
  const tailsRating = tailsListing?.google_rating || tailsListing?.user_average_rating;

  // Dynamic Recently Verified listing solely from API
  const recentListing = homeData?.recently_verified?.[0];
  const recentImageUri = resolveImageUrl(recentListing?.main_image_url);
  const recentTitle = recentListing?.name;
  const recentLocation =
    [recentListing?.local_area || recentListing?.famous_area, recentListing?.city]
      .filter(Boolean)
      .join(' • ') || recentListing?.city;
  const recentCategory = recentListing?.category || recentListing?.specific_type;
  const recentRating = recentListing?.google_rating || recentListing?.user_average_rating;

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
      title: route.title,
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
    calloutScale,
    calloutRotateX,
    calloutOpacity,
    calloutSheenX,
    calloutBadgeRotate,
    calloutBtnScale,
  } = useHomeAnimations(scrollY);

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
            onRefresh={refetchHome}
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
            navigation.navigate('SearchScreen', {
              query: query !== undefined ? query : searchQuery,
              category: 'Pet Friendly Stays',
            });
          }}
          avatarScale={avatarScale}
          avatarRotate={avatarRotate}
          searchBarScale={searchBarScale}
          searchIconRotate={searchIconRotate}
        />

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
              style={StyleSheet.absoluteFillObject}
              resizeMode={FastImage.resizeMode.cover}
            />
          </Animated.View>

          <LinearGradient
            colors={['rgba(25, 10, 45, 0.88)', 'rgba(25, 10, 45, 0.65)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Dynamic Holographic Glass Light Sheen */}
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
                  color="#2B0E68"
                  style={styles.btnArrowMargin}
                />
              </BouncyPressable>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── 4. Explore by category Card ── */}
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
                    onPress={() => setSelectedCategory(prev => (prev === cat.id ? null : cat.id))}
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
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
            </Animated.View>

            {storiesList.length === 1 ? (
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
                  onPress={() => {}}>
                  <Animated.View
                    style={[
                      StyleSheet.absoluteFillObject,
                      { transform: [{ translateY: storyImageParallax }, { scale: 1.12 }] },
                    ]}>
                    <FastImage
                      source={{ uri: storiesList[0].imageUri }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  </Animated.View>

                  <LinearGradient
                    colors={['rgba(20, 10, 35, 0.45)', 'rgba(20, 10, 35, 0.88)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

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
                  {storiesList.map(item => (
                    <BouncyPressable
                      key={item.id}
                      style={styles.storyScrollCard}
                      activeScale={0.97}
                      onPress={() => {}}>
                      <FastImage
                        source={{ uri: item.imageUri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      <LinearGradient
                        colors={['rgba(20, 10, 35, 0.45)', 'rgba(20, 10, 35, 0.88)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />

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
                  onPress={() => {}}>
                  <Feather name="arrow-right" size={ms(14)} color={isDarkMode ? '#A855F7' : '#7B2CFF'} />
                </BouncyPressable>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.tailsVerifiedCard,
                isDarkMode && styles.tailsVerifiedCardDark,
                {
                  opacity: tailsOpacity,
                  transform: [{ perspective: 1000 }, { scale: tailsScale }, { rotateX: tailsRotateX }],
                },
              ]}>
              <BouncyPressable style={styles.fullWidth} activeScale={0.975} onPress={() => {}}>
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
                          color={isFavorite ? '#E11D48' : '#FFFFFF'}
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
                        <Ionicons name="star" size={ms(10)} color={isDarkMode ? '#F59E0B' : '#D97706'} />
                        <Text style={[styles.ratingText, isDarkMode && styles.ratingTextDark]}>{tailsRating}</Text>
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
                    Recently verified near you
                  </Text>
                </View>
                <BouncyPressable
                  style={[styles.circleArrowBtn, isDarkMode && styles.circleArrowBtnDark]}
                  activeScale={0.85}
                  onPress={() => {}}>
                  <Feather name="arrow-right" size={ms(14)} color={isDarkMode ? '#A855F7' : '#7B2CFF'} />
                </BouncyPressable>
              </View>
            </Animated.View>

            <Animated.View
              style={{
                opacity: recentOpacity,
                transform: [{ perspective: 1000 }, { scale: recentScale }, { rotateX: recentRotateX }],
              }}>
              <BouncyPressable
                style={[styles.recentCompactCard, isDarkMode && styles.recentCompactCardDark]}
                activeScale={0.965}
                onPress={() => {}}>
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
                      <View style={[styles.recentRatingBadge, isDarkMode && styles.recentRatingBadgeDark]}>
                        <Ionicons name="star" size={ms(9)} color={isDarkMode ? '#F59E0B' : '#D97706'} />
                        <Text style={[styles.recentRatingText, isDarkMode && styles.recentRatingTextDark]}>{recentRating}</Text>
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
                      <Ionicons name="location-outline" size={ms(11)} color="#8E8E93" />
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
                    <View
                      style={[
                        styles.amenityPetPill,
                        isDarkMode && styles.amenityPetPillDark,
                      ]}>
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
            colors={
              isDarkMode
                ? ['#1C0E34', '#120824']
                : ['#FFFFFF', '#FBF9FE']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.rehomeCard, isDarkMode && styles.rehomeCardDark]}>
            {/* Ambient subtle light orb in corner */}
            <View
              style={[
                styles.rehomeCardAmbientOrb,
                isDarkMode && styles.rehomeCardAmbientOrbDark,
              ]}
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
                  <View
                    style={[
                      styles.rehomePulseDot,
                      isDarkMode && styles.rehomePulseDotDark,
                    ]}
                  />
                  <Text
                    style={[
                      styles.rehomeOverline,
                      isDarkMode && styles.rehomeOverlineDark,
                    ]}>
                    COMMUNITY SOS
                  </Text>
                </View>
                <Text style={[styles.rehomeTitle, isDarkMode && styles.rehomeTitleDark]}>
                  Help a pet find their way
                </Text>
                <Text style={[styles.rehomeSubtitle, isDarkMode && styles.rehomeSubtitleDark]}>
                  Urgent alerts & adoption network
                </Text>
              </View>

              <View
                style={[
                  styles.rehomeArrowCircle,
                  isDarkMode && styles.rehomeArrowCircleDark,
                ]}>
                <Feather
                  name="arrow-up-right"
                  size={ms(16)}
                  color={isDarkMode ? '#C084FC' : '#7B2CFF'}
                />
              </View>
            </Pressable>

            {/* Subtle Divider */}
            <View
              style={[
                styles.rehomeDivider,
                isDarkMode && styles.rehomeDividerDark,
              ]}
            />

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
                <BouncyPressable activeScale={0.9} onPress={() => {}}>
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
                    onPress={() => {}}>
                    <FastImage
                      source={{ uri: trip.image }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode={FastImage.resizeMode.cover}
                    />
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

        {/* ── 10. Know a pet-friendly place? Callout Banner ── */}
        <Animated.View
          style={{
            opacity: calloutOpacity,
            transform: [
              { perspective: 1000 },
              { scale: calloutScale },
              { rotateX: calloutRotateX },
            ],
          }}>
          <BouncyPressable style={styles.fullWidth} activeScale={0.98} onPress={() => {}}>
            <LinearGradient
              colors={['#4C1378', '#6D28D9', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.communityCalloutCard}>
              {/* Dynamic Glass Holographic Sheen */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.glassSheenOverlay,
                  {
                    transform: [{ translateX: calloutSheenX }, { rotate: '25deg' }],
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

              {/* Decorative concentric rings in background */}
              <View style={styles.calloutDecoCircleOuter} />
              <View style={styles.calloutDecoCircleInner} />

              <Animated.View style={{ transform: [{ rotate: calloutBadgeRotate }] }}>
                <View style={styles.calloutIconBadge}>
                  <Ionicons name="storefront" size={ms(20)} color="#1E1035" />
                </View>
              </Animated.View>

              <Text style={styles.calloutOverline}>HELP THE PACK GROW</Text>
              <Text style={styles.calloutTitle}>Know a pet-friendly place?</Text>
              <Text style={styles.calloutDesc}>
                Add it for review and help other pet parents explore with confidence.
              </Text>

              <Animated.View
                style={[styles.alignSelfStart, { transform: [{ scale: calloutBtnScale }] }]}>
                <BouncyPressable style={styles.calloutBtn} activeScale={0.92} onPress={() => {}}>
                  <Text style={styles.calloutBtnText}>Add place</Text>
                  <Feather
                    name="arrow-right"
                    size={ms(13)}
                    color="#220D47"
                    style={styles.btnArrowMargin}
                  />
                </BouncyPressable>
              </Animated.View>
            </LinearGradient>
          </BouncyPressable>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

export { ReuniteScreen } from './ReuniteScreen';
