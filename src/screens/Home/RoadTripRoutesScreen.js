import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useRoadTrips, resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';

const HighwayRoadStrip = React.memo(({ origin, destination, index = 0 }) => {
  const [lineWidth, setLineWidth] = useState(0);
  const carProgress = useRef(new Animated.Value(0)).current;

  // Stagger each card's start & varied duration so animations run independently
  const initialDelay = useMemo(() => ((index * 850) % 2550) + 120, [index]);
  const travelDuration = useMemo(() => 2800 + ((index * 600) % 1800), [index]);
  const pauseDelay = useMemo(() => 450 + ((index * 250) % 750), [index]);

  useEffect(() => {
    let isMounted = true;
    let animationLoop = null;

    const timer = setTimeout(() => {
      if (!isMounted) return;

      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(carProgress, {
            toValue: 1,
            duration: travelDuration,
            easing: Easing.bezier(0.35, 0.05, 0.25, 1),
            useNativeDriver: true,
          }),
          Animated.delay(pauseDelay),
          Animated.timing(carProgress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(350),
        ]),
      );
      animationLoop.start();
    }, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (animationLoop) animationLoop.stop();
    };
  }, [carProgress, initialDelay, travelDuration, pauseDelay]);

  // Generous buffer: car chip is s(34) wide, leaving ~20dp clear visible road space
  // before the destination pill so it never collides or crowds the destination.
  const maxTravel = Math.max(0, lineWidth - s(66));

  return (
    <View style={styles.highwayStripContainer}>
      {/* Origin Pill (Dark Navy Slate with Cyan Pulse Dot) */}
      <LinearGradient
        colors={['#1E1B4B', '#0F172A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.originPill}>
        <View style={styles.originPulseDot} />
        <Text style={styles.originPillText} numberOfLines={1}>
          {origin || 'Delhi'}
        </Text>
      </LinearGradient>

      {/* 3D Tubular Purple Highway Ribbon */}
      <View
        style={styles.purpleRoadTrack}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - lineWidth) > 2) {
            setLineWidth(w);
          }
        }}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#6D28D9', '#4338CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Glossy top edge highlight for 3D tubular cylinder feel */}
        <View style={styles.roadTopHighlight} pointerEvents="none" />

        {/* Real dashed highway lane markings */}
        <View style={styles.roadDashedLaneRow} pointerEvents="none">
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
          <View style={styles.roadDashBar} />
        </View>

        {/* Traveling Animated Car with Pet */}
        {lineWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.animatedCarWrapper,
              {
                transform: [
                  {
                    translateX: carProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, maxTravel],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.carChipBadge}>
              <Ionicons name="car" size={ms(11)} color="#00E5BE" />
              <Text style={styles.carDogChip}>🐶</Text>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {/* Destination Pill (Radiant Sunset Ruby Gradient with Location Pin) */}
      <LinearGradient
        colors={['#FF6B35', '#EA580C', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.destinationPill}>
        <Ionicons name="location-sharp" size={ms(10)} color="#FFFFFF" />
        <Text style={styles.destinationPillText} numberOfLines={1}>
          {destination || 'Destination'}
        </Text>
      </LinearGradient>
    </View>
  );
});

const RouteGraphicBanner = React.memo(({ item, index = 0, isFavorited, onToggleFavorite }) => {
  const destLower = String(item.destination || '').toLowerCase();
  const originLower = String(item.origin || '').toLowerCase();

  let skyGradient = ['#3B82F6', '#60A5FA', '#93C5FD'];
  let landmarkType = 'lake';

  if (destLower.includes('corbett')) {
    skyGradient = ['#1E3A2F', '#2D6A4F', '#1B4332'];
    landmarkType = 'jungle';
  } else if (destLower.includes('pune')) {
    skyGradient = ['#C2410C', '#EA580C', '#FB923C'];
    landmarkType = 'city';
  } else if (destLower.includes('mussoorie')) {
    skyGradient = ['#5B5FC7', '#818CF8', '#C7D2FE'];
    landmarkType = 'peaks';
  } else if (destLower.includes('rishikesh')) {
    skyGradient = ['#047857', '#059669', '#34D399'];
    landmarkType = 'bridge';
  } else if (destLower.includes('dehradun')) {
    skyGradient = ['#0284C7', '#38BDF8', '#7DD3FC'];
    landmarkType = 'clock';
  } else if (destLower.includes('bhimtal')) {
    skyGradient = ['#2563EB', '#60A5FA', '#93C5FD'];
    landmarkType = 'lake';
  }

  const isDelhi = originLower.includes('delhi');
  const isGurgaon = originLower.includes('gurgaon');

  return (
    <View style={styles.graphicBannerWrap}>
      {/* Background Sky Gradient */}
      <LinearGradient
        colors={skyGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Fluffy Organic White Sky Clouds */}
      <View style={styles.cloudGroup1} pointerEvents="none">
        <View style={styles.cloudBubble1} />
        <View style={styles.cloudBubble2} />
        <View style={styles.cloudBubble3} />
      </View>
      <View style={styles.cloudGroup2} pointerEvents="none">
        <View style={styles.cloudBubble4} />
        <View style={styles.cloudBubble5} />
      </View>

      {/* Horizon Rolling Hills Backdrops */}
      <View style={styles.backHillLayer} pointerEvents="none" />
      <View style={styles.frontHillLayer} pointerEvents="none" />

      {/* Left Landmark: India Gate (Delhi) or City Tower (Gurgaon) */}
      {isDelhi ? (
        <View style={styles.indiaGateWrap}>
          <View style={styles.gateTopBar} />
          <View style={styles.gateArch}>
            <View style={styles.gatePillar} />
            <View style={styles.gateOpening} />
            <View style={styles.gatePillar} />
          </View>
          <View style={styles.gateBase} />
          <View style={styles.gateShrubLeft} />
          <View style={styles.gateShrubRight} />
        </View>
      ) : isGurgaon ? (
        <View style={styles.gurgaonTowerWrap}>
          <View style={styles.towerBlock}>
            <View style={styles.towerWindow} />
            <View style={styles.towerWindow} />
            <View style={styles.towerWindow} />
          </View>
        </View>
      ) : null}

      {/* Right Landmark based on destination */}
      {landmarkType === 'lake' ? (
        <View style={styles.lakeMountainsWrap}>
          <View style={styles.mountainPeak1}>
            <View style={styles.snowCap1} />
          </View>
          <View style={styles.mountainPeak2}>
            <View style={styles.snowCap2} />
          </View>
          <View style={styles.lakeOval} />
        </View>
      ) : landmarkType === 'peaks' ? (
        <View style={styles.mussooriePeaksWrap}>
          <View style={styles.mountainPeak1}>
            <View style={styles.snowCap1} />
          </View>
          <View style={styles.mountainPeak2}>
            <View style={styles.snowCap2} />
          </View>
          <View style={styles.cableCarWire} />
          <View style={styles.cableCarCabin} />
        </View>
      ) : landmarkType === 'clock' ? (
        <View style={styles.clockTowerWrap}>
          <View style={styles.clockTowerRoof} />
          <View style={styles.clockTowerBody}>
            <View style={styles.clockDial}>
              <View style={styles.clockHand} />
            </View>
          </View>
        </View>
      ) : landmarkType === 'jungle' ? (
        <View style={styles.corbettJungleWrap}>
          <View style={styles.jungleTree1} />
          <View style={styles.jungleTree2} />
          <View style={styles.corbettGateSign}>
            <Text style={styles.corbettSignText}>JIM CORBETT</Text>
          </View>
        </View>
      ) : landmarkType === 'city' ? (
        <View style={styles.puneCityWrap}>
          <View style={styles.puneBuilding1} />
          <View style={styles.puneBuilding2} />
          <View style={styles.puneBuilding3} />
        </View>
      ) : landmarkType === 'bridge' ? (
        <View style={styles.rishikeshBridgeWrap}>
          <View style={styles.bridgeTower1} />
          <View style={styles.bridgeCable} />
          <View style={styles.bridgeTower2} />
          <View style={styles.riverGangaWater} />
        </View>
      ) : null}

      {/* Top Center: Pet Friendly Pill Badge */}
      <View style={styles.petFriendlyBadge}>
        <Ionicons name="paw" size={ms(10)} color="#FFFFFF" />
        <Text style={styles.petFriendlyBadgeText}>Pet Friendly</Text>
      </View>

      {/* Top Right: Glowing Sun Disc */}
      <View style={styles.sunGlowRing} pointerEvents="none">
        <View style={styles.sunCoreDisc} />
      </View>

      {/* Top Left: Frosted Favorite Heart Button */}
      <BouncyPressable
        testID={`favorite-btn-${item.id}`}
        style={styles.cardFavoriteBtn}
        activeScale={0.85}
        onPress={() => onToggleFavorite(item.id)}>
        <Ionicons
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={ms(14)}
          color={isFavorited ? '#EF4444' : '#FFFFFF'}
        />
      </BouncyPressable>

      {/* Bottom Road Highway Strip with Origin and Destination Pills */}
      <HighwayRoadStrip origin={item.origin} destination={item.destination} index={index} />
    </View>
  );
});

export const RoadTripRoutesScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [favoriteRoutes, setFavoriteRoutes] = useState({});

  const {
    data: apiRoutes,
    isLoading: isRoutesLoading,
    refetch: refetchRoutes,
    isRefetching: isRoutesRefetching,
  } = useRoadTrips();

  const allRoutes = useMemo(() => {
    if (!Array.isArray(apiRoutes) || apiRoutes.length === 0) {
      return [];
    }

    return apiRoutes.map(apiRoute => ({
      ...apiRoute,
      id: String(apiRoute.id),
      slug: apiRoute.slug,
      origin: apiRoute.origin_city,
      destination: apiRoute.destination_city,
      distance: apiRoute.total_distance_km ? `${apiRoute.total_distance_km} km` : '',
      driveTime: apiRoute.est_drive_hours ? `${apiRoute.est_drive_hours} hr` : '',
      stopsCount: apiRoute.stop_count,
      title: `${apiRoute.origin_city} → ${apiRoute.destination_city}`,
      badge: apiRoute.origin_state ? apiRoute.origin_state.toUpperCase() : '',
      subTag: apiRoute.destination_state ? `${apiRoute.destination_state.toUpperCase()} DRIVE` : '',
      image: resolveImageUrl(apiRoute.cover_image_url),
    }));
  }, [apiRoutes]);

  // Filter routes based on Search Query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return allRoutes;
    const q = searchQuery.toLowerCase();
    return allRoutes.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q),
    );
  }, [allRoutes, searchQuery]);

  // Toggle Route Favorite
  const handleToggleFavorite = useCallback(routeId => {
    setFavoriteRoutes(prev => ({
      ...prev,
      [routeId]: !prev[routeId],
    }));
  }, []);

  // Navigate to Detail Screen
  const handleOpenRoute = useCallback(
    item => {
      navigation.navigate('RoadTripDetailScreen', {
        slug: item.slug,
        routeId: item.id,
        routeTitle: item.title,
        routeData: item,
      });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />

      {/* ── Signature Homepage Ambient Glow Orbs ── */}
      <View
        style={[styles.ambientGlowTopRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowTopLeft, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowMidRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowMidLeft, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowBottomRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />

      {/* ── Signature Ambient Paw Watermarks ── */}
      <View style={styles.ambientPawWatermarkTop} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(130)}
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
      <ScreenHeader
        title="Road trip routes"
        subtitle="EXPLORE TOGETHER"
        onBack={() => navigation.goBack()}
        testID="road-trips-back-btn"
        rightComponent={
          <BouncyPressable
            testID="search-toggle-btn"
            style={[styles.headerActionBtn, isDarkMode && styles.headerActionBtnDark]}
            activeScale={0.9}
            onPress={() => setIsSearchOpen(prev => !prev)}>
            <Ionicons
              name={isSearchOpen ? 'close' : 'search'}
              size={ms(18)}
              color={isDarkMode ? '#C084FC' : '#7C3AED'}
            />
          </BouncyPressable>
        }
      />

      {/* ── Optional Search Bar Drawer ── */}
      {isSearchOpen && (
        <View style={[styles.searchDrawer, isDarkMode && styles.searchDrawerDark]}>
          <Ionicons name="search" size={ms(16)} color="#7C3AED" style={styles.searchIcon} />
          <TextInput
            testID="road-trip-search-input"
            style={[styles.searchInput, isDarkMode && styles.textWhite]}
            placeholder="Search destination, stops, or city..."
            placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Scrollable Content ── */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vs(36) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRoutesRefetching}
            onRefresh={refetchRoutes}
            tintColor={isDarkMode ? '#A855F7' : '#7B2CFF'}
            colors={['#7B2CFF', '#EE2A7B']}
          />
        }>
        {/* ── 2. Hero Banner: Good roads. Better company. (Matching Image 2) ── */}
        <View style={styles.heroBannerWrap}>
          <LinearGradient
            colors={['#064E3B', '#047857', '#022C22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBannerGradient}>
            {/* Top Curated Pill Badge */}
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Feather
                  name="arrow-up-right"
                  size={ms(11)}
                  color="#A7F3D0"
                  style={styles.badgeArrow}
                />
                <Text style={styles.heroBadgeText}>CURATED PAW BY PAW</Text>
              </View>
            </View>

            {/* Headline */}
            <Text style={styles.heroHeadline}>Good roads.{'\n'}Better company.</Text>

            {/* Subtitle */}
            <Text style={styles.heroSubtitle}>
              Verified stops, open spaces and pet-friendly stays along every route.
            </Text>

            {/* Interactive Route Trail Illustration */}
            <View style={styles.routeIllustrationRow}>
              {/* White Car Badge */}
              <View style={styles.carBadge}>
                <Text style={styles.carEmoji}>🚗</Text>
              </View>

              {/* Dashed connecting track */}
              <View style={styles.trackLine}>
                <View style={styles.trackStopDot} />
              </View>

              {/* Destination Paw Pin */}
              <View style={styles.pinBadge}>
                <Ionicons name="paw" size={ms(14)} color="#FFFFFF" />
              </View>
            </View>
          </LinearGradient>
        </View>
        {/* ── 4. Sub-Header: Pick your next drive ── */}
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
              Pick your next drive
            </Text>
          </View>
        </View>
        {/* ── 5. List of Route Cards ── */}
        {isRoutesLoading && allRoutes.length === 0 ? (
          <Loader
            fullScreen
            title="Loading road trips..."
            subtitle="Finding verified pet-friendly routes..."
          />
        ) : filteredRoutes?.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={ms(42)} color="#94A3B8" />
            <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
              No road trips found
            </Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.textMutedDark]}>
              {searchQuery
                ? `No routes matching "${searchQuery}"`
                : 'No published road trips available right now.'}
            </Text>
          </View>
        ) : (
          filteredRoutes?.map((item, index) => {
            const isFavorited = !!favoriteRoutes[item.id];
            const isFeatured =
              item.is_featured ||
              String(item.destination || '')
                .toLowerCase()
                .includes('corbett');

            return (
              <BouncyPressable
                key={item.id}
                testID={`explore-route-btn-${item.id}`}
                activeScale={0.98}
                onPress={() => handleOpenRoute(item)}
                style={[
                  styles.routeCard,
                  isFeatured && styles.routeCardFeatured,
                  isDarkMode && styles.routeCardDark,
                ]}>
                <View testID={`route-card-${item.id}`}>
                  {/* 1. Top Route Graphic Banner with Highway Strip */}
                  <RouteGraphicBanner
                    item={item}
                    index={index}
                    isFavorited={isFavorited}
                    onToggleFavorite={handleToggleFavorite}
                  />

                  {/* 2. Card Body: Overline + Title Row + Inline Stats */}
                  <View style={[styles.cardBody, isDarkMode && styles.cardBodyDark]}>
                    <Text style={styles.routeOverline}>PET-FRIENDLY ROUTE</Text>

                    <View style={styles.routeTitleRow}>
                      <Text
                        style={[styles.routeTitleText, isDarkMode && styles.textWhite]}
                        numberOfLines={1}>
                        {item.title}
                      </Text>

                      <View style={styles.titleArrowWrap}>
                        <Feather
                          name="arrow-right"
                          size={ms(18)}
                          color={isFeatured ? '#10B981' : isDarkMode ? '#C4B5FD' : '#8B5CF6'}
                        />
                      </View>
                    </View>

                    {/* Inline Metrics Row */}
                    <View style={styles.metricsRow}>
                      {item.distance ? (
                        <Text style={[styles.statItemBold, isDarkMode && styles.textWhite]}>
                          {item.distance}
                        </Text>
                      ) : null}

                      {item.driveTime ? (
                        <View style={styles.statDriveTimeWrap}>
                          <Text style={[styles.statItemBold, isDarkMode && styles.textWhite]}>
                            {item.driveTime}
                          </Text>
                          <Text style={[styles.statItemMuted, isDarkMode && styles.textMutedDark]}>
                            {' '}
                            drive
                          </Text>
                        </View>
                      ) : null}

                      {item.stopsCount !== undefined && item.stopsCount !== null ? (
                        <Text style={styles.statStopsGreen}>{item.stopsCount} verified stops</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              </BouncyPressable>
            );
          })
        )}
        {/* ── 6. Bottom Feature Card: Every stop earns its place. (Matching Image 2) ── */}
        <View style={styles.bottomFeatureCardWrap}>
          <LinearGradient
            colors={['#2A2032', '#3B108F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bottomFeatureGradient}>
            <Text style={styles.featureOverline}>BUILT FOR REAL TRAVEL DAYS</Text>
            <Text style={styles.featureTitle}>Every stop earns its place.</Text>

            {/* Feature 1: Breaks */}
            <View style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name="pause" size={ms(13)} color="#A78BFA" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureItemTitle}>Breaks</Text>
                <Text style={styles.featureItemDesc}>Safe spaces to stretch and reset</Text>
              </View>
            </View>

            {/* Feature 2: Food */}
            <View style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name="restaurant" size={ms(13)} color="#A78BFA" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureItemTitle}>Food</Text>
                <Text style={styles.featureItemDesc}>Dhabas and cafes that welcome pets</Text>
              </View>
            </View>

            {/* Feature 3: Sleep */}
            <View style={styles.featureRow}>
              <View style={styles.featureIconBox}>
                <Ionicons name="bed" size={ms(13)} color="#A78BFA" />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureItemTitle}>Sleep</Text>
                <Text style={styles.featureItemDesc}>Verified stays at the destination</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── Homepage Signature Ambient Glow Orbs ── */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -s(80),
    right: -s(80),
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
  ambientGlowDark: {
    opacity: 0.18,
  },

  /* ── Homepage Signature Ambient Paw Watermarks ── */
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: vs(120),
    right: -s(20),
    transform: [{ rotate: '-25deg' }],
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: vs(160),
    left: -s(30),
    transform: [{ rotate: '30deg' }],
  },

  /* ── Header ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(10),
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOverline: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: vs(14),
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: '#7C3AED',
  },
  headerTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: vs(24),
    letterSpacing: 0,
    color: '#392840',
    marginTop: vs(1),
  },
  headerActionBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnDark: {
    backgroundColor: '#27104B',
    borderColor: '#4C1D95',
  },

  /* ── Search Drawer ── */
  searchDrawer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginTop: vs(8),
    paddingHorizontal: s(12),
    height: vs(44),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
  },
  searchDrawerDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
  },
  searchIcon: {
    marginRight: s(8),
  },
  searchInput: {
    flex: 1,
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#0F172A',
  },

  /* ── Scroll Content ── */
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
  },

  /* ── Hero Banner: Good roads. Better company. ── */
  heroBannerWrap: {
    marginBottom: vs(16),
    borderRadius: s(22),
    ...Platform.select({
      ios: {
        shadowColor: '#047857',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  heroBannerGradient: {
    borderRadius: s(22),
    padding: s(18),
    borderWidth: 1.2,
    borderColor: '#065F46',
    borderBottomWidth: 3.5,
    borderBottomColor: '#02211A',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: vs(10),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: s(9),
    paddingVertical: vs(4),
    borderRadius: s(14),
  },
  badgeArrow: {
    marginRight: s(4),
  },
  heroBadgeText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.extraBold,
    lineHeight: vs(14),
    letterSpacing: 0.63,
    textTransform: 'uppercase',
    color: '#FFE19A',
  },
  heroHeadline: {
    fontSize: s(35),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#FFFFFF',
    lineHeight: s(35),
    letterSpacing: -2.28,
  },
  heroSubtitle: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: vs(20),
    letterSpacing: 0,
    color: '#FFFFFFBF',
    marginTop: vs(6),
    marginBottom: vs(16),
  },
  routeIllustrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: vs(4),
  },
  carBadge: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  carEmoji: {
    fontSize: s(15),
  },
  trackLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderStyle: 'dashed',
    marginHorizontal: s(8),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackStopDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#FCD34D',
  },
  pinBadge: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Section Title Row ── */
  sectionHeaderWrap: {
    marginBottom: vs(12),
  },
  sectionOverline: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(2),
  },
  sectionTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.semiBold,
    lineHeight: vs(30),
    letterSpacing: -0.8,
    color: '#3B108F',
  },
  routesCountText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },

  /* ── Website-Matched Route Cards ── */
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    marginBottom: vs(16),
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  routeCardFeatured: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  routeCardDark: {
    backgroundColor: '#160D2E',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  /* Route Graphic Banner */
  graphicBannerWrap: {
    height: vs(154),
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },

  /* Fluffy Organic White Clouds */
  cloudGroup1: {
    position: 'absolute',
    top: vs(10),
    left: s(36),
    width: s(64),
    height: vs(24),
    opacity: 0.45,
  },
  cloudBubble1: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: s(34),
    height: vs(18),
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
  },
  cloudBubble2: {
    position: 'absolute',
    left: s(16),
    top: 0,
    width: s(26),
    height: vs(22),
    borderRadius: s(13),
    backgroundColor: '#FFFFFF',
  },
  cloudBubble3: {
    position: 'absolute',
    left: s(32),
    bottom: 0,
    width: s(28),
    height: vs(16),
    borderRadius: s(10),
    backgroundColor: '#FFFFFF',
  },
  cloudGroup2: {
    position: 'absolute',
    top: vs(8),
    right: s(50),
    width: s(50),
    height: vs(20),
    opacity: 0.35,
  },
  cloudBubble4: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: s(28),
    height: vs(16),
    borderRadius: s(10),
    backgroundColor: '#FFFFFF',
  },
  cloudBubble5: {
    position: 'absolute',
    left: s(16),
    top: 0,
    width: s(22),
    height: vs(18),
    borderRadius: s(11),
    backgroundColor: '#FFFFFF',
  },

  /* Horizon Rolling Hills Backdrop */
  backHillLayer: {
    position: 'absolute',
    bottom: 0,
    left: -s(20),
    right: -s(20),
    height: vs(58),
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderTopLeftRadius: s(90),
    borderTopRightRadius: s(90),
  },
  frontHillLayer: {
    position: 'absolute',
    bottom: 0,
    left: -s(10),
    right: -s(10),
    height: vs(44),
    backgroundColor: '#22C55E',
    opacity: 0.28,
    borderTopLeftRadius: s(70),
    borderTopRightRadius: s(70),
  },

  /* Top Center Pet Friendly Badge */
  petFriendlyBadge: {
    position: 'absolute',
    top: vs(10),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 16, 51, 0.92)',
    paddingHorizontal: s(12),
    paddingVertical: vs(4.5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    gap: s(4),
    zIndex: 10,
  },
  petFriendlyBadgeText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgbargb(59, 16, 143)',
    letterSpacing: 0.2,
  },

  /* Top Right Glowing Sun Disc */
  sunGlowRing: {
    position: 'absolute',
    top: vs(6),
    right: s(10),
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(253, 224, 71, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  sunCoreDisc: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#FDE047',
  },

  /* Top Left Frosted Favorite Button */
  cardFavoriteBtn: {
    position: 'absolute',
    top: vs(10),
    left: s(12),
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  /* Landmarks */
  indiaGateWrap: {
    position: 'absolute',
    bottom: vs(44),
    left: s(16),
    alignItems: 'center',
    zIndex: 3,
  },
  gateTopBar: {
    width: s(34),
    height: vs(4.5),
    backgroundColor: '#E2C290',
    borderRadius: s(1),
  },
  gateArch: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: s(30),
    height: vs(28),
  },
  gatePillar: {
    width: s(7.5),
    height: vs(28),
    backgroundColor: '#DEC08C',
  },
  gateOpening: {
    flex: 1,
    height: vs(20),
    backgroundColor: 'transparent',
    borderTopLeftRadius: s(7.5),
    borderTopRightRadius: s(7.5),
    borderWidth: 1.5,
    borderColor: '#C8A36E',
    borderBottomWidth: 0,
  },
  gateBase: {
    width: s(36),
    height: vs(3.5),
    backgroundColor: '#DEC08C',
    borderRadius: s(1),
  },
  gateShrubLeft: {
    position: 'absolute',
    bottom: 0,
    left: -s(8),
    width: s(14),
    height: s(14),
    borderRadius: s(7),
    backgroundColor: '#22C55E',
  },
  gateShrubRight: {
    position: 'absolute',
    bottom: 0,
    right: -s(8),
    width: s(14),
    height: s(14),
    borderRadius: s(7),
    backgroundColor: '#16A34A',
  },

  /* Right Destination Landmarks */
  lakeMountainsWrap: {
    position: 'absolute',
    bottom: vs(44),
    right: s(16),
    alignItems: 'center',
    zIndex: 3,
  },
  mountainPeak1: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: s(22),
    borderRightWidth: s(22),
    borderBottomWidth: vs(34),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#93C5FD',
    opacity: 0.95,
    position: 'relative',
  },
  snowCap1: {
    position: 'absolute',
    top: vs(1),
    left: -s(10),
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: s(10),
    borderRightWidth: s(10),
    borderBottomWidth: vs(14),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  mountainPeak2: {
    position: 'absolute',
    bottom: 0,
    right: -s(16),
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: s(16),
    borderRightWidth: s(16),
    borderBottomWidth: vs(26),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#BAE6FD',
    opacity: 0.9,
  },
  snowCap2: {
    position: 'absolute',
    top: vs(1),
    left: -s(7),
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: s(7),
    borderRightWidth: s(7),
    borderBottomWidth: vs(10),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  lakeOval: {
    position: 'absolute',
    bottom: -vs(5),
    right: s(2),
    width: s(46),
    height: vs(13),
    borderRadius: s(20),
    backgroundColor: '#38BDF8',
    opacity: 0.9,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },

  mussooriePeaksWrap: {
    position: 'absolute',
    bottom: vs(44),
    right: s(16),
    alignItems: 'center',
    zIndex: 3,
  },
  cableCarWire: {
    position: 'absolute',
    top: -vs(10),
    left: -s(60),
    width: s(80),
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    transform: [{ rotate: '12deg' }],
  },
  cableCarCabin: {
    position: 'absolute',
    top: -vs(8),
    left: -s(25),
    width: s(9),
    height: s(9),
    borderRadius: s(2),
    backgroundColor: '#EF4444',
  },

  clockTowerWrap: {
    position: 'absolute',
    bottom: vs(44),
    right: s(24),
    alignItems: 'center',
    zIndex: 3,
  },
  clockTowerRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: s(11),
    borderRightWidth: s(11),
    borderBottomWidth: vs(13),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#B45309',
  },
  clockTowerBody: {
    width: s(18),
    height: vs(36),
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockDial: {
    width: s(11),
    height: s(11),
    borderRadius: s(5.5),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHand: {
    width: s(1),
    height: vs(3.5),
    backgroundColor: '#1E1B4B',
  },

  corbettJungleWrap: {
    position: 'absolute',
    bottom: vs(44),
    right: s(14),
    alignItems: 'center',
    zIndex: 3,
  },
  jungleTree1: {
    position: 'absolute',
    bottom: 0,
    left: -s(14),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#15803D',
  },
  jungleTree2: {
    position: 'absolute',
    bottom: vs(6),
    right: -s(10),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: '#166534',
  },
  corbettGateSign: {
    backgroundColor: '#1F2937',
    paddingHorizontal: s(7),
    paddingVertical: vs(3),
    borderRadius: s(4),
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  corbettSignText: {
    fontSize: s(7.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#D1D5DB',
    letterSpacing: 0.5,
  },

  puneCityWrap: {
    position: 'absolute',
    bottom: vs(44),
    right: s(18),
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: s(3),
    zIndex: 3,
  },
  puneBuilding1: {
    width: s(13),
    height: vs(30),
    backgroundColor: 'rgba(154, 52, 18, 0.75)',
    borderRadius: s(2),
  },
  puneBuilding2: {
    width: s(16),
    height: vs(44),
    backgroundColor: 'rgba(194, 65, 12, 0.85)',
    borderRadius: s(2),
  },
  puneBuilding3: {
    width: s(12),
    height: vs(24),
    backgroundColor: 'rgba(154, 52, 18, 0.75)',
    borderRadius: s(2),
  },

  rishikeshBridgeWrap: {
    position: 'absolute',
    bottom: vs(44),
    right: s(16),
    alignItems: 'center',
    zIndex: 3,
  },
  bridgeTower1: {
    position: 'absolute',
    left: -s(20),
    bottom: 0,
    width: s(4.5),
    height: vs(34),
    backgroundColor: '#92400E',
  },
  bridgeTower2: {
    position: 'absolute',
    right: -s(8),
    bottom: 0,
    width: s(4.5),
    height: vs(34),
    backgroundColor: '#92400E',
  },
  bridgeCable: {
    width: s(38),
    height: vs(13),
    borderBottomWidth: 1.5,
    borderBottomColor: '#F59E0B',
    borderRadius: s(19),
  },
  riverGangaWater: {
    width: s(46),
    height: vs(8),
    backgroundColor: '#06B6D4',
    opacity: 0.75,
    borderRadius: s(4),
    marginTop: vs(2),
  },

  gurgaonTowerWrap: {
    position: 'absolute',
    bottom: vs(44),
    left: s(18),
    zIndex: 3,
  },
  towerBlock: {
    width: s(22),
    height: vs(40),
    backgroundColor: '#475569',
    borderRadius: s(3),
    padding: s(2),
    gap: vs(3),
  },
  towerWindow: {
    width: s(18),
    height: vs(4.5),
    backgroundColor: '#FDE047',
    borderRadius: s(1),
  },

  /* Bottom 3D Highway Strip */
  highwayStripContainer: {
    position: 'absolute',
    bottom: vs(10),
    left: s(10),
    right: s(10),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 8,
  },
  originPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: s(13),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: s(4),
    zIndex: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  originPulseDot: {
    width: s(5),
    height: s(5),
    borderRadius: s(2.5),
    backgroundColor: '#38BDF8',
  },
  originPillText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  purpleRoadTrack: {
    flex: 1,
    height: vs(26),
    borderRadius: s(13),
    marginHorizontal: s(-6),
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  roadTopHighlight: {
    position: 'absolute',
    top: 1,
    left: s(8),
    right: s(8),
    height: vs(2.5),
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  roadDashedLaneRow: {
    position: 'absolute',
    left: s(6),
    right: s(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  roadDashBar: {
    width: s(8),
    height: vs(2.5),
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  destinationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(5),
    paddingVertical: vs(5),
    borderRadius: s(13),
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    gap: s(4),
    zIndex: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.45,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  destinationPillText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  animatedCarWrapper: {
    position: 'absolute',
    left: s(6),
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },
  carChipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: s(5.5),
    paddingVertical: vs(2),
    borderRadius: s(8),
    borderWidth: 1.2,
    borderColor: '#38BDF8',
    gap: s(2),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  carDogChip: {
    fontSize: s(8),
  },

  /* Card Body */
  cardBody: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(14),
    paddingTop: vs(12),
    paddingBottom: vs(14),
  },
  cardBodyDark: {
    backgroundColor: '#160D2E',
  },
  routeOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: vs(4),
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(10),
  },
  routeTitleText: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.extraBold,
    lineHeight: vs(24.64),
    letterSpacing: -1.1,
    color: 'rgb(59, 16, 143)',
    flex: 1,
    marginRight: s(6),
  },
  titleArrowWrap: {
    paddingLeft: s(2),
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: vs(4),
    columnGap: s(16),
  },
  statItemBold: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgb(59, 16, 143)',
  },
  statDriveTimeWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statItemMuted: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: 'rgb(59, 16, 143)',
  },
  statStopsGreen: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },

  /* ── Bottom Feature Card: Every stop earns its place. ── */
  bottomFeatureCardWrap: {
    marginTop: vs(8),
    marginBottom: vs(20),
    borderRadius: s(22),
    ...Platform.select({
      ios: {
        shadowColor: '#2E1065',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  bottomFeatureGradient: {
    borderRadius: s(22),
    padding: s(20),
    borderWidth: 1.2,
    borderColor: '#3B156E',
    borderBottomWidth: 3.5,
    borderBottomColor: '#0E021F',
  },
  featureOverline: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.extraBold, // Manrope ExtraBold (800)
    lineHeight: vs(14),
    letterSpacing: 0.48,
    textTransform: 'uppercase',
    color: '#D8C4EF',
    marginBottom: vs(4),
  },
  featureTitle: {
    fontSize: s(20),
    fontFamily: theme.typography.fontFamily.semiBold,
    lineHeight: vs(30),
    letterSpacing: -0.8,
    color: '#FFFFFF',
    marginBottom: vs(16),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  featureIconBox: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  featureTextCol: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: vs(20),
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  featureItemDesc: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: vs(20),
    letterSpacing: 0,
    color: 'rgba(255, 255, 255, 0.62)',
    marginTop: vs(1),
  },

  /* ── Loading and Empty States ── */
  loadingContainer: {
    paddingVertical: vs(36),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(10),
  },
  loadingText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  emptyContainer: {
    paddingVertical: vs(40),
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(6),
  },
  emptyTitle: {
    fontSize: s(15.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1B4B',
  },
  emptySubtitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: s(24),
  },

  /* ── Dark Mode Typography ── */
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
