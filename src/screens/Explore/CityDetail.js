import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import {
  useDiscoveryCities,
  useCityListings,
  useCityIntro,
  useCityCover,
  useCityCategoryIntros,
  useCityRoutes,
  useNearbyCities,
} from '../../hooks/useDiscovery';
import {
  slugifyCity,
  isVerified,
  sortListings,
  buildCategories,
  listingToCard,
  categoryTaglines,
  normalizeIntro,
  readCover,
  readRoutes,
  readNearby,
} from './cityDetailModel';
import { LoaderCard } from '../../components/common/Loader';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80';
const PREVIEW_COUNT = 4;
const EXPANDED_COUNT = 40;

const TACTILE = {
  borderTopWidth: 1.5,
  borderTopColor: '#FFFFFF',
  borderLeftWidth: 1.2,
  borderLeftColor: '#ECE7F6',
  borderRightWidth: 1.2,
  borderRightColor: '#ECE7F6',
  borderBottomWidth: 3.8,
  borderBottomColor: '#DDD6FE',
};

// Springs its children up into place on mount
const Reveal = ({ delay = 0, children }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 70,
      friction: 9,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
          { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
        ],
      }}>
      {children}
    </Animated.View>
  );
};

// Decorative glyph that bobs gently on a loop
const FloatingGlyph = ({ name, size, style, delay = 0 }) => {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float, delay]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glyph,
        style,
        {
          transform: [
            { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) },
            { rotate: float.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
          ],
        },
      ]}>
      <Ionicons name={name} size={size} color="rgba(255, 255, 255, 0.5)" />
    </Animated.View>
  );
};

const FavouriteCard = ({ item, index, saved, onToggleSave, onPress }) => (
  <Reveal delay={index * 90}>
    <BouncyPressable style={styles.placeCard} activeScale={0.97} onPress={onPress}>
      <View style={styles.placeImage}>
        {!!item.imageUri && (
          <FastImage
            source={{ uri: item.imageUri }}
            style={styles.placeImageFill}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        {!!item.badge && (
          <View style={styles.verifiedChip}>
            <Ionicons name="paw" size={ms(9)} color="#FFFFFF" />
            <Text style={styles.verifiedChipText}>{item.badge}</Text>
          </View>
        )}
        <BouncyPressable style={styles.heartBtn} activeScale={0.85} onPress={onToggleSave}>
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={ms(16)}
            color={saved ? '#EF4444' : '#1E1035'}
          />
        </BouncyPressable>
      </View>

      <View style={styles.placeInfo}>
        <Text style={styles.placeType}>{item.type}</Text>
        <Text style={styles.placeName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.placeAreaRow}>
          <Ionicons name="location-outline" size={ms(11)} color="#8E8A9F" />
          <Text style={styles.placeArea}>{item.area}</Text>
        </View>
        <View style={styles.placeFooter}>
          <Text style={styles.placeNote} numberOfLines={2}>
            {item.note}
          </Text>
          <View style={styles.goBtn}>
            <Feather name="arrow-right" size={ms(14)} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </BouncyPressable>
  </Reveal>
);

export const CityDetail = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const setCurrentLocation = useStore(state => state.setCurrentLocation);
  const { data: knownCities } = useDiscoveryCities();
  const paramSlug = route?.params?.citySlug;

  // Opened from the city list with city + state, or by slug alone (resolved from /cities/known)
  const knownMatch = useMemo(() => {
    if (!paramSlug || !Array.isArray(knownCities)) {
      return null;
    }
    return knownCities.find(c => slugifyCity(c.name || c.city) === paramSlug) || null;
  }, [paramSlug, knownCities]);

  const city = route?.params?.city || knownMatch?.name || knownMatch?.city || '';
  const citySlug = paramSlug || slugifyCity(city);

  const { data: listingsData, isLoading: listingsLoading } = useCityListings(city);
  const { data: introRaw } = useCityIntro(citySlug);
  const { data: coverRaw } = useCityCover(citySlug);
  const { data: categoryIntrosRaw } = useCityCategoryIntros();
  const { data: routesRaw } = useCityRoutes(city);

  const listings = useMemo(() => listingsData?.listings || [], [listingsData]);
  const state = route?.params?.state || knownMatch?.state || listings[0]?.state || '';
  const { data: nearbyRaw } = useNearbyCities(state);

  const [activeCategory, setActiveCategory] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [savedIds, setSavedIds] = useState({});

  const categories = useMemo(() => buildCategories(listings), [listings]);
  const verifiedCount = useMemo(() => listings.filter(isVerified).length, [listings]);
  const intro = useMemo(() => normalizeIntro(introRaw), [introRaw]);
  const coverUri = useMemo(() => readCover(coverRaw), [coverRaw]);
  const taglines = useMemo(
    () => categoryTaglines(categoryIntrosRaw, citySlug),
    [categoryIntrosRaw, citySlug],
  );
  const roadTrips = useMemo(() => readRoutes(routesRaw), [routesRaw]);
  const nearbyCities = useMemo(() => readNearby(nearbyRaw, city), [nearbyRaw, city]);

  const visibleCards = useMemo(() => {
    const pool =
      activeCategory === 'all' ? listings : listings.filter(l => l.category === activeCategory);
    return sortListings(pool)
      .slice(0, expanded ? EXPANDED_COUNT : PREVIEW_COUNT)
      .map(listingToCard);
  }, [listings, activeCategory, expanded]);
  const activeTotal = categories.find(c => c.key === activeCategory)?.count || 0;
  const activeTagline = activeCategory === 'all' ? '' : taglines[activeCategory];
  const heroSubtitle = intro.summary || 'Verified pet-friendly places, local tips and road trips.';

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroHeight = s(270) + insets.top;

  const selectCategory = key => {
    setActiveCategory(key);
    setExpanded(false);
  };

  const heroImageStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [-heroHeight, 0, heroHeight],
          outputRange: [-heroHeight / 2, 0, heroHeight * 0.4],
          extrapolate: 'clamp',
        }),
      },
      {
        scale: scrollY.interpolate({
          inputRange: [-heroHeight, 0],
          outputRange: [2, 1],
          extrapolateRight: 'clamp',
        }),
      },
    ],
  };

  const heroContentStyle = {
    opacity: scrollY.interpolate({
      inputRange: [0, heroHeight * 0.6],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, heroHeight],
          outputRange: [0, -24],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Explore' });
    }
  };

  const handleBrowseAll = () => {
    if (setCurrentLocation) {
      setCurrentLocation(city);
    }
    if (route?.params?.onSelectCity) {
      route.params.onSelectCity(city);
    }
    navigation?.navigate?.('MainTabs', { screen: 'Explore' });
  };

  const toggleSave = id => setSavedIds(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, vs(10)) + vs(16) }}>
        {/* ── Hero ── */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, heroImageStyle]}>
            <FastImage
              source={{
                uri: coverUri || FALLBACK_COVER,
              }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={FastImage.resizeMode.cover}
            />
          </Animated.View>
          <LinearGradient
            colors={['rgba(20, 8, 40, 0.55)', 'rgba(28, 12, 52, 0.1)', 'rgba(24, 9, 44, 0.9)']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* ── Header ── */}
          <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, s(10)) }]}>
            <BouncyPressable style={styles.roundBtn} activeScale={0.88} onPress={handleBack}>
              <Feather name="arrow-left" size={ms(18)} color="#FFFFFF" />
            </BouncyPressable>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerOverline}>CITY GUIDE</Text>
              <Text style={styles.headerTitle}>{[city, state].filter(Boolean).join(', ')}</Text>
            </View>
            <BouncyPressable style={styles.roundBtn} activeScale={0.88}>
              <Feather name="share-2" size={ms(16)} color="#FFFFFF" />
            </BouncyPressable>
          </View>
          <FloatingGlyph name="paw" size={ms(18)} style={styles.glyphA} />
          <FloatingGlyph name="heart" size={ms(16)} style={styles.glyphB} delay={600} />
          <FloatingGlyph name="leaf" size={ms(15)} style={styles.glyphC} delay={1200} />
          <Animated.View style={[styles.heroContent, heroContentStyle]}>
            <View style={styles.heroRegionRow}>
              <Ionicons name="location-outline" size={ms(12)} color="#FBBF24" />
              <Text style={styles.heroRegionText}>{(state || 'INDIA').toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle}>{`Pet-friendly ${city}`}</Text>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {heroSubtitle}
            </Text>
            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <Feather name="check" size={ms(11)} color="#FFFFFF" />
                <Text style={styles.heroPillText}>{`${verifiedCount} verified`}</Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons name="paw" size={ms(11)} color="#FFFFFF" />
                <Text style={styles.heroPillText}>{`${listings.length} places`}</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* ── Local guide card ── */}
        {intro.sections.length > 0 && (
          <Reveal delay={120}>
            <View style={styles.guideCard}>
              <LinearGradient
                colors={['#7C3AED', '#C026D3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guideIcon}>
                <Ionicons name="paw" size={ms(20)} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.guideText}>
                <Text style={styles.guideOverline}>LOCAL GUIDE</Text>
                <Text style={styles.guideTitle}>{`Plan ${city} with your pet`}</Text>
                <Text style={styles.guideDesc} numberOfLines={5}>
                  {intro.sections[0].body[0]}
                </Text>
              </View>
            </View>
          </Reveal>
        )}

        {/* ── Categories ── */}
        <Reveal delay={200}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionOverline}>FIND YOUR KIND OF PLACE</Text>
            <Text style={styles.sectionTitle}>{`Explore ${city}`}</Text>
          </View>
        </Reveal>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}>
          {categories.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <BouncyPressable
                key={cat.key}
                style={[styles.categoryCard, active && styles.categoryCardActive]}
                activeScale={0.94}
                onPress={() => selectCategory(cat.key)}>
                <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
                  <Ionicons name={cat.icon} size={ms(18)} color={active ? '#FFFFFF' : '#A78BFA'} />
                </View>
                <Text
                  style={[styles.categoryLabel, active && styles.categoryLabelActive]}
                  numberOfLines={1}>
                  {cat.label}
                </Text>
                <Text style={[styles.categoryCount, active && styles.categoryCountActive]}>
                  {`${cat.count} ${cat.count === 1 ? 'place' : 'places'}`}
                </Text>
              </BouncyPressable>
            );
          })}
        </ScrollView>
        {!!activeTagline && <Text style={styles.categoryTagline}>{activeTagline}</Text>}

        {/* ── Places ── */}
        <View style={styles.favHeadRow}>
          <View style={styles.favHeadText}>
            <Text style={styles.sectionOverline}>PERSONALLY CHECKED BY THE PACK</Text>
            <Text style={styles.sectionTitle}>
              {activeCategory === 'all' ? `${city} favourites` : activeCategory}
            </Text>
          </View>
          {activeTotal > PREVIEW_COUNT && (
            <BouncyPressable
              style={styles.viewAllBtn}
              activeScale={0.94}
              onPress={() => setExpanded(v => !v)}>
              <Text style={styles.viewAllText}>{expanded ? 'Show less' : 'View all'}</Text>
              <Feather name={expanded ? 'arrow-up' : 'arrow-right'} size={ms(13)} color="#7C3AED" />
            </BouncyPressable>
          )}
        </View>

        {listingsLoading && listings.length === 0 && (
          <View style={styles.stateBox}>
            <LoaderCard label={`Loading places in ${city}...`} />
          </View>
        )}

        {!listingsLoading && visibleCards.length === 0 && (
          <View style={styles.stateBox}>
            <Ionicons name="search-outline" size={ms(34)} color="#CBD5E1" />
            <Text style={styles.stateText}>{`No places listed in ${city} yet.`}</Text>
          </View>
        )}

        {visibleCards.map((item, index) => (
          <FavouriteCard
            key={`${activeCategory}-${item.id}`}
            index={Math.min(index, 4)}
            item={item}
            saved={!!savedIds[item.id]}
            onToggleSave={() => toggleSave(item.id)}
            onPress={() => navigation?.navigate?.('ListingDetailScreen', { slug: item.slug })}
          />
        ))}

        {/* ── Editorial sections ── */}
        {intro.sections.length > 0 && (
          <View style={styles.sectionHead}>
            <Text style={styles.sectionOverline}>KNOW BEFORE YOU GO</Text>
            <Text style={styles.sectionTitle}>{`About ${city}`}</Text>
          </View>
        )}
        {intro.sections.map((section, i) => (
          <Reveal key={section.key} delay={i * 90}>
            <View style={styles.noteCard}>
              <View style={styles.noteIcon}>
                <Ionicons name={section.icon} size={ms(18)} color="#7C3AED" />
              </View>
              <View style={styles.noteText}>
                <Text style={styles.noteTitle}>{section.title}</Text>
                {section.body.map(line => (
                  <Text key={line} style={styles.noteDesc}>
                    {section.body.length > 1 ? `\u2022 ${line}` : line}
                  </Text>
                ))}
              </View>
            </View>
          </Reveal>
        ))}

        {/* ── Road trips ── */}
        {roadTrips.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionOverline}>ROAD TRIPS</Text>
              <Text style={styles.sectionTitle}>{`Drive to ${city}`}</Text>
            </View>
            {roadTrips.map(trip => (
              <BouncyPressable
                key={trip.slug}
                style={styles.noteCard}
                activeScale={0.97}
                onPress={() => navigation?.navigate?.('RoadTripDetailScreen', { slug: trip.slug })}>
                <View style={styles.noteIcon}>
                  <Ionicons name="car-outline" size={ms(18)} color="#7C3AED" />
                </View>
                <View style={styles.noteText}>
                  <Text style={styles.noteTitle} numberOfLines={2}>
                    {trip.title}
                  </Text>
                  {!!(trip.subtitle || trip.meta) && (
                    <Text style={styles.noteDesc}>
                      {[trip.subtitle, trip.meta].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={ms(16)} color="#A78BFA" />
              </BouncyPressable>
            ))}
          </>
        )}

        {/* ── Nearby cities ── */}
        {nearbyCities.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionOverline}>{`ELSEWHERE IN ${state.toUpperCase()}`}</Text>
              <Text style={styles.sectionTitle}>Nearby cities</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}>
              {nearbyCities.map(c => (
                <BouncyPressable
                  key={c.city}
                  style={styles.nearbyCard}
                  activeScale={0.94}
                  onPress={() =>
                    navigation?.push?.('CityDetail', {
                      city: c.city,
                      state: c.state,
                      onSelectCity: route?.params?.onSelectCity,
                    })
                  }>
                  <Text style={styles.nearbyName} numberOfLines={1}>
                    {c.city}
                  </Text>
                  <Text style={styles.categoryCount}>{`${c.verified} verified`}</Text>
                </BouncyPressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── CTA ── */}
        <BouncyPressable style={styles.ctaBtn} activeScale={0.97} onPress={handleBrowseAll}>
          <LinearGradient
            colors={['#5B21B6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.ctaText}>{`Browse all ${listings.length} ${city} places`}</Text>
          <Feather name="arrow-right" size={ms(15)} color="#FFFFFF" style={styles.ctaArrow} />
        </BouncyPressable>
      </Animated.ScrollView>
    </View>
  );
};

export default CityDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },

  /* ── Header ── */
  headerRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingBottom: vs(8),
  },
  roundBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    marginHorizontal: s(12),
  },
  headerOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    marginTop: s(1),
  },

  /* ── Hero ── */
  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
    backgroundColor: '#1E0E35',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: s(16),
  },
  heroRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRegionText: {
    color: '#FBBF24',
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.7,
    marginLeft: s(4),
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: s(26),
    lineHeight: s(32),
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: vs(4),
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: s(12.5),
    lineHeight: s(17),
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: vs(4),
  },
  heroPillRow: {
    flexDirection: 'row',
    marginTop: vs(10),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    marginRight: s(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderBottomWidth: 2.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    marginLeft: s(5),
  },

  glyph: {
    position: 'absolute',
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphA: { top: '30%', right: s(24) },
  glyphB: { top: '44%', right: s(78) },
  glyphC: { top: '24%', right: s(96) },

  /* ── Local guide card ── */
  guideCard: {
    flexDirection: 'row',
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(14),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    ...TACTILE,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  guideIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  guideText: {
    flex: 1,
  },
  guideOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8A9F',
    letterSpacing: 0.7,
  },
  guideTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#5B21B6',
    marginTop: vs(2),
  },
  guideDesc: {
    fontSize: s(12),
    lineHeight: s(17),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(4),
  },

  /* ── Section headings ── */
  sectionHead: {
    marginHorizontal: s(16),
    marginTop: vs(22),
    marginBottom: vs(10),
  },
  sectionOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8A9F',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#4C1D95',
    marginTop: vs(2),
  },

  /* ── Categories ── */
  categoryRow: {
    paddingHorizontal: s(16),
  },
  categoryCard: {
    width: s(88),
    padding: s(10),
    marginRight: s(10),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    ...TACTILE,
  },
  categoryCardActive: {
    backgroundColor: '#7C3AED',
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderLeftColor: '#7C3AED',
    borderRightColor: '#7C3AED',
    borderBottomColor: '#4C1D95',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(11),
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(14),
  },
  categoryIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryLabel: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  categoryCount: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#9CA3AF',
    marginTop: vs(1),
  },
  categoryCountActive: {
    color: 'rgba(255, 255, 255, 0.75)',
  },

  /* ── Favourites ── */
  favHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginTop: vs(22),
    marginBottom: vs(10),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: vs(3),
  },
  viewAllText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    marginRight: s(4),
  },
  placeCard: {
    flexDirection: 'row',
    marginHorizontal: s(16),
    marginBottom: vs(10),
    padding: s(8),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    ...TACTILE,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  placeImage: {
    width: s(112),
    height: s(112),
    borderRadius: s(16),
    backgroundColor: '#EAE6F2',
  },
  verifiedChip: {
    position: 'absolute',
    top: s(8),
    left: s(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D28D9',
    borderRadius: s(8),
    paddingHorizontal: s(7),
    paddingVertical: vs(3),
  },
  verifiedChipText: {
    color: '#FFFFFF',
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    marginLeft: s(3),
  },
  heartBtn: {
    position: 'absolute',
    bottom: s(8),
    right: s(8),
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeImageFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: s(16),
  },
  placeInfo: {
    flex: 1,
    marginLeft: s(12),
    paddingRight: s(4),
    justifyContent: 'center',
  },
  placeType: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  placeName: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    marginTop: vs(3),
  },
  placeAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(3),
  },
  placeArea: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#8E8A9F',
    marginLeft: s(3),
  },
  placeFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: vs(10),
  },
  placeNote: {
    flex: 1,
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#15803D',
    marginRight: s(8),
  },
  goBtn: {
    width: s(30),
    height: s(30),
    borderRadius: s(10),
    backgroundColor: '#7C3AED',
    borderBottomWidth: 2.5,
    borderBottomColor: '#4C1D95',
    alignItems: 'center',
    justifyContent: 'center',
  },

  favHeadText: {
    flex: 1,
    marginRight: s(8),
  },
  categoryTagline: {
    marginHorizontal: s(16),
    marginTop: vs(10),
    fontSize: s(12),
    lineHeight: s(17),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
  },
  stateBox: {
    alignItems: 'center',
    paddingVertical: vs(30),
  },
  stateText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8E8A9F',
    marginTop: vs(10),
  },
  nearbyCard: {
    width: s(120),
    padding: s(12),
    marginRight: s(10),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    ...TACTILE,
  },
  nearbyName: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    marginBottom: vs(2),
  },

  /* ── Neighbourhood notes ── */
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginBottom: vs(8),
    padding: s(12),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    ...TACTILE,
  },
  noteIcon: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  noteText: {
    flex: 1,
  },
  noteTitle: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
  },
  noteDesc: {
    fontSize: s(11),
    lineHeight: s(15),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#8E8A9F',
    marginTop: vs(2),
  },

  /* ── Best time ── */
  bestTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginTop: vs(8),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#F0FDF8',
    borderWidth: 1,
    borderColor: '#CCF2E3',
  },
  bestTimeIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: '#FCD34D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  bestTimeOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F766E',
    letterSpacing: 0.6,
  },
  bestTimeTitle: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#047857',
    marginTop: vs(2),
  },
  bestTimeDesc: {
    fontSize: s(11.5),
    lineHeight: s(16),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(2),
  },

  /* ── CTA ── */
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: s(16),
    marginTop: vs(16),
    height: s(50),
    borderRadius: s(16),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 4,
    borderBottomColor: '#3B0764',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  ctaArrow: {
    marginLeft: s(8),
  },
});
