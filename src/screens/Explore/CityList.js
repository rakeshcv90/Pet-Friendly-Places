import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StatusBar,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useDiscoveryCities, resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { LoaderCard } from '../../components/common/Loader';

const PALETTES = [
  {
    bg: '#EDE9FE',
    border: '#DDD6FE',
    shadowBorder: '#C4B5FD',
    iconColor: '#7C3AED',
    icon: 'trail-sign-outline',
  }, // Purple
  {
    bg: '#CCFBF1',
    border: '#99F6E4',
    shadowBorder: '#5EEAD4',
    iconColor: '#0D9488',
    icon: 'leaf-outline',
  }, // Teal
  {
    bg: '#FEF3C7',
    border: '#FDE68A',
    shadowBorder: '#FCD34D',
    iconColor: '#D97706',
    icon: 'business-outline',
  }, // Amber
  {
    bg: '#FCE7F3',
    border: '#FBCFE8',
    shadowBorder: '#F472B6',
    iconColor: '#DB2777',
    icon: 'heart-outline',
  }, // Pink
];

const DARK_PALETTES = [
  {
    bg: 'rgba(124, 58, 237, 0.22)',
    border: '#3B1D6E',
    shadowBorder: '#230E4A',
    iconColor: '#C4B5FD',
    icon: 'trail-sign-outline',
  }, // Purple
  {
    bg: 'rgba(13, 148, 136, 0.22)',
    border: '#134E4A',
    shadowBorder: '#0A2D2A',
    iconColor: '#5EEAD4',
    icon: 'leaf-outline',
  }, // Teal
  {
    bg: 'rgba(217, 119, 6, 0.22)',
    border: '#78350F',
    shadowBorder: '#451A03',
    iconColor: '#FCD34D',
    icon: 'business-outline',
  }, // Amber
  {
    bg: 'rgba(219, 39, 119, 0.22)',
    border: '#831843',
    shadowBorder: '#4C0D24',
    iconColor: '#F472B6',
    icon: 'heart-outline',
  }, // Pink
];

const CityCardItem = React.memo(
  ({ item, index, isDarkMode, failedImages, setFailedImages, onSelectCity }) => {
    const enterAnim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.spring(enterAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: Math.min(index * 35, 240),
        useNativeDriver: true,
      }).start();
    }, [enterAnim, index]);

    const paletteList = isDarkMode ? DARK_PALETTES : PALETTES;
    const palette = paletteList[index % paletteList.length];
    const iconName = item.icon || palette.icon;
    const verifiedCount =
      typeof item.verified_count === 'number' && item.verified_count > 0
        ? item.verified_count
        : item.listing_count || 0;
    const totalCount =
      typeof item.total_count === 'number' && item.total_count > 0
        ? item.total_count
        : verifiedCount || 1;
    const displayVerified = verifiedCount > 0 ? verifiedCount : totalCount;
    const hasCover = !!item.cover_image_url && !failedImages[item.cover_image_url];

    const translateY = enterAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
    });

    const scale = enterAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.96, 1],
    });

    return (
      <Animated.View
        style={[
          styles.cityCardAnimatedWrap,
          {
            opacity: enterAnim,
            transform: [{ translateY }, { scale }],
          },
        ]}>
        <BouncyPressable
          style={[styles.cityCard, isDarkMode && styles.cityCardDark]}
          activeScale={0.96}
          springTension={180}
          springFriction={7}
          onPress={() => onSelectCity(item)}>
          <View style={styles.cityCardLeft}>
            {hasCover ? (
              <View style={[styles.cityImageBox, isDarkMode && styles.cityImageBoxDark]}>
                <View style={styles.imageFallbackHolder}>
                  <Ionicons name={iconName} size={ms(18)} color={palette.iconColor} />
                </View>
                <FastImage
                  source={{
                    uri: item.cover_image_url,
                    priority: FastImage.priority.normal,
                  }}
                  style={styles.cityCoverImage}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={() => {
                    setFailedImages(prev => ({
                      ...prev,
                      [item.cover_image_url]: true,
                    }));
                  }}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.cityIconBox,
                  {
                    backgroundColor: palette.bg,
                    borderColor: palette.border,
                    borderBottomColor: palette.shadowBorder,
                  },
                ]}>
                <Ionicons name={iconName} size={ms(18)} color={palette.iconColor} />
              </View>
            )}

            <View style={styles.cityNameGroup}>
              <Text
                style={[styles.cityNameText, isDarkMode && styles.cityNameTextDark]}
                numberOfLines={2}>
                {item.city}
              </Text>
              <Text
                style={[styles.cityStateText, isDarkMode && styles.cityStateTextDark]}
                numberOfLines={1}>
                {item.state}
              </Text>
              {totalCount > 0 && (
                <Text
                  style={[styles.cityTotalText, isDarkMode && styles.cityTotalTextDark]}
                  numberOfLines={1}>
                  {`${totalCount} total`}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.cityCardRight}>
            <View style={[styles.verifiedBadge, isDarkMode && styles.verifiedBadgeDark]}>
              <Text style={[styles.verifiedBadgeText, isDarkMode && styles.verifiedBadgeTextDark]}>
                {`${displayVerified} Verified ${displayVerified === 1 ? 'Place' : 'Places'}`}
              </Text>
            </View>
            <View style={[styles.cityArrowWell, isDarkMode && styles.cityArrowWellDark]}>
              <Feather
                name="arrow-right"
                size={ms(12)}
                color={isDarkMode ? '#A78BFA' : '#7C3AED'}
              />
            </View>
          </View>
        </BouncyPressable>
      </Animated.View>
    );
  },
);

CityCardItem.displayName = 'CityCardItem';

export const CityList = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const setCurrentLocation = useStore(state => state.setCurrentLocation);
  const isDarkMode = useStore(state => state.isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestCityName, setRequestCityName] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const scrollY = useRef(new Animated.Value(0)).current;
  const HERO_DISTANCE = s(220) + vs(16);

  const isSearching = searchQuery.trim().length > 0;
  const translateY = isSearching
    ? 0
    : scrollY.interpolate({
        inputRange: [0, HERO_DISTANCE],
        outputRange: [HERO_DISTANCE, 0],
        extrapolate: 'clamp',
      });

  const backgroundOpacity = isSearching
    ? 1
    : scrollY.interpolate({
        inputRange: [Math.max(0, HERO_DISTANCE - vs(16)), HERO_DISTANCE],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });

  // Fetch live discovery cities from API (/cities/known)
  const { data: apiCities, isLoading } = useDiscoveryCities();
  

  const citiesData = useMemo(() => {
    if (Array.isArray(apiCities) && apiCities.length > 0) {
      const mapped = apiCities
        .map(c => {
          const cityName = c.name || c.city;
          if (!cityName) {
            return null;
          }
          const state = c.state || 'India';
          const verifiedCount =
            typeof c.verified_count === 'number'
              ? c.verified_count
              : typeof c.listing_count === 'number'
              ? c.listing_count
              : 0;
          const totalCount = typeof c.total_count === 'number' ? c.total_count : verifiedCount;
          const listingCount = verifiedCount > 0 ? verifiedCount : totalCount || 1;

          const rawCover =
            c.cover_image_url || c.cover_image || c.coverImage || c.image_url || c.image;
          let coverImageUrl = rawCover ? resolveImageUrl(rawCover) : null;

          // If Rishikesh has the expired 404 Unsplash ID from backend, replace with verified working photo
          if (coverImageUrl && coverImageUrl.includes('photo-1600100397608-4f0cefd4f05b')) {
            coverImageUrl =
              'https://images.unsplash.com/photo-1720819029162-8500607ae232?w=800&auto=format&fit=crop&q=80';
          }

          return {
            city: cityName,
            state,
            verified_count: verifiedCount,
            total_count: totalCount,
            listing_count: listingCount,
            cover_image_url: coverImageUrl,
          };
        })
        .filter(Boolean);

      // Alphabetical sorting (A to Z) so destinations like Agonda appear at the top
      return mapped.sort((a, b) => a.city.localeCompare(b.city));
    }
    return [];
  }, [apiCities]);

  const totalVerifiedCount = useMemo(() => {
    return citiesData.reduce(
      (acc, curr) => acc + (curr.verified_count || curr.listing_count || 0),
      0,
    );
  }, [citiesData]);

  // Filtered by Search query
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return citiesData;
    }
    return citiesData.filter(item => {
      return item.city.toLowerCase().includes(q) || item.state.toLowerCase().includes(q);
    });
  }, [citiesData, searchQuery]);

  const handleSelectCity = cityName => {
    if (setCurrentLocation) {
      setCurrentLocation(cityName);
    }
    if (route?.params?.onSelectCity) {
      route.params.onSelectCity(cityName);
    }
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Explore' });
    }
  };

  const handleOpenCity = item => {
    navigation?.navigate?.('CityDetail', {
      city: item.city,
      state: item.state,
      onSelectCity: route?.params?.onSelectCity,
    });
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else {
      navigation?.navigate?.('MainTabs', { screen: 'Explore' });
    }
  };

  const handleRequestSubmit = () => {
    if (!requestCityName.trim()) {
      return;
    }
    Keyboard.dismiss();
    setRequestSuccess(true);
    setTimeout(() => {
      setRequestSuccess(false);
      setRequestCityName('');
      setRequestModalVisible(false);
    }, 1600);
  };

  const renderListHeader = () => {
    return (
      <View>
        {!searchQuery.trim() && (
          /* ── Hero Banner ── */
          <View style={styles.heroCard}>
            <FastImage
              source={{
                uri: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&auto=format&fit=crop&q=80',
              }}
              style={StyleSheet.absoluteFillObject}
              resizeMode={FastImage.resizeMode.cover}
            />
            <LinearGradient
              colors={['rgba(28, 12, 52, 0.45)', 'rgba(24, 9, 44, 0.94)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Subtle Decorative Floating Glyphs */}
            <View style={[styles.ambientGlyph, styles.glyphPaw]}>
              <Ionicons name="paw" size={ms(18)} color="rgba(255, 255, 255, 0.14)" />
            </View>
            <View style={[styles.ambientGlyph, styles.glyphMusic]}>
              <Ionicons name="musical-notes" size={ms(16)} color="rgba(255, 255, 255, 0.11)" />
            </View>
            <View style={[styles.ambientGlyph, styles.glyphHeart]}>
              <Ionicons name="heart" size={ms(18)} color="rgba(255, 255, 255, 0.11)" />
            </View>

            {/* 3D Border Bevel Overlay */}
            <View style={styles.hero3DBorderOverlay} pointerEvents="none" />

            <View style={styles.heroContent}>
              <View style={styles.heroBadgeRow}>
                <Ionicons name="paw" size={ms(12)} color="#FBBF24" />
                <Text style={styles.heroBadgeText}>PET-FRIENDLY DESTINATIONS</Text>
              </View>

              <View style={styles.heroTitleGroup}>
                <Text style={styles.heroTitle}>Find your next city</Text>
                <Text style={styles.heroTitle}>together</Text>
                <Text style={styles.heroSubtitle}>
                  Real pet rules, verified places, and local guides for travelling across India with
                  your best friend.
                </Text>
              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatPillText}>
                    {citiesData.length > 0 ? `${citiesData.length}+ cities` : '97+ cities'}
                  </Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Text style={styles.heroStatPillText}>
                    {totalVerifiedCount > 0
                      ? `${totalVerifiedCount}+ verified places`
                      : '500+ verified places'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        {/* ── Spacer for Sticky Search Bar ── */}
        <View style={styles.searchSpacer} />

        {!searchQuery.trim() && (
          /* ── Featured Region Card (Delhi NCR) ── */
          <View style={[styles.featuredRegionCard, isDarkMode && styles.featuredRegionCardDark]}>
            <LinearGradient
              colors={isDarkMode ? ['#1F1338', '#2A184D'] : ['#FFFDF7', '#FEF3C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <Ionicons
              name="business"
              size={ms(58)}
              color={isDarkMode ? 'rgba(251, 191, 36, 0.08)' : 'rgba(217, 119, 6, 0.12)'}
              style={styles.featuredWatermark}
            />

            <View style={styles.featuredCardContent}>
              <Text style={[styles.featuredOverline, isDarkMode && styles.featuredOverlineDark]}>
                FEATURED REGION
              </Text>
              <Text style={[styles.featuredTitle, isDarkMode && styles.featuredTitleDark]}>
                Delhi NCR
              </Text>
              <Text style={[styles.featuredSubtitle, isDarkMode && styles.featuredSubtitleDark]}>
                Delhi · Gurugram · Noida · Faridabad · Aerocity
              </Text>

              <View style={styles.featuredTagsRow}>
                <View style={[styles.featuredTagPill, isDarkMode && styles.featuredTagPillDark]}>
                  <Text style={[styles.featuredTagText, isDarkMode && styles.featuredTagTextDark]}>
                    🐕 Dog walks
                  </Text>
                </View>
                <View style={[styles.featuredTagPill, isDarkMode && styles.featuredTagPillDark]}>
                  <Text style={[styles.featuredTagText, isDarkMode && styles.featuredTagTextDark]}>
                    ☕ Pet cafes
                  </Text>
                </View>
                <View style={[styles.featuredTagPill, isDarkMode && styles.featuredTagPillDark]}>
                  <Text style={[styles.featuredTagText, isDarkMode && styles.featuredTagTextDark]}>
                    🏨 Stays
                  </Text>
                </View>
              </View>

              <BouncyPressable
                style={styles.featuredCtaBtn}
                activeScale={0.94}
                onPress={() => handleSelectCity('Delhi NCR')}>
                <Text style={styles.featuredCtaText}>Explore Delhi NCR</Text>
                <Feather name="arrow-right" size={ms(13)} color="#FFFFFF" style={styles.ctaArrow} />
              </BouncyPressable>
            </View>
          </View>
        )}

        {/* ── Browse Destinations Header ── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
              BROWSE DESTINATIONS
            </Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Pick a city, pack the leash
            </Text>
          </View>
          <Text
            style={[
              styles.shownCountText,
              isDarkMode && styles.shownCountTextDark,
            ]}>{`${filteredCities.length} shown`}</Text>
        </View>
      </View>
    );
  };

  const renderCityCard = ({ item, index }) => {
    return (
      <CityCardItem
        item={item}
        index={index}
        isDarkMode={isDarkMode}
        failedImages={failedImages}
        setFailedImages={setFailedImages}
        onSelectCity={handleOpenCity}
      />
    );
  };

  const renderListEmpty = () => {
    if (isLoading && citiesData.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <LoaderCard label="Loading pet-friendly cities..." isDarkMode={isDarkMode} />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={ms(38)} color={isDarkMode ? '#475569' : '#CBD5E1'} />
        <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
          No cities found
        </Text>
        <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
          {`We couldn't find any destination matching "${searchQuery}".`}
        </Text>
        <BouncyPressable
          style={[styles.emptyResetBtn, isDarkMode && styles.emptyResetBtnDark]}
          activeScale={0.92}
          onPress={() => setSearchQuery('')}>
          <Text style={[styles.emptyResetText, isDarkMode && styles.emptyResetTextDark]}>
            Clear search
          </Text>
        </BouncyPressable>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        isDarkMode && styles.containerDark,
        { paddingTop: Math.max(insets.top, s(10)) },
      ]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#F8F7FC'}
      />

      {/* ── Top Header Bar (Fixed) ── */}
      <View style={[styles.headerRow, isDarkMode && styles.headerRowDark]}>
        <BouncyPressable
          style={[styles.backButton, isDarkMode && styles.backButtonDark]}
          activeScale={0.88}
          onPress={handleBack}>
          <Feather name="arrow-left" size={ms(18)} color={isDarkMode ? '#FFFFFF' : '#1E1035'} />
        </BouncyPressable>

        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerOverline, isDarkMode && styles.headerOverlineDark]}>
            EXPLORE INDIA
          </Text>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Pet-friendly cities
          </Text>
        </View>

        <View style={[styles.headerBadge, isDarkMode && styles.headerBadgeDark]}>
          <Text style={[styles.headerBadgeText, isDarkMode && styles.headerBadgeTextDark]}>
            {citiesData.length > 0 ? `${citiesData.length}+` : '97+'}
          </Text>
        </View>
      </View>

      {/* ── Scroll Area with Sticky Search ── */}
      <View style={styles.listArea}>
        <Animated.FlatList
          data={filteredCities}
          keyExtractor={item => item.city}
          renderItem={renderCityCard}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderListEmpty}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          keyboardShouldPersistTaps="handled"
          style={styles.flatListFlex}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          scrollEventThrottle={16}
        />

        {/* ── Sticky Search Bar (Sticks near header when scrolled) ── */}
        <Animated.View
          style={[styles.stickySearchWrapper, { transform: [{ translateY }] }]}
          pointerEvents="box-none">
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              styles.stickyBackgroundMask,
              isDarkMode && styles.stickyBackgroundMaskDark,
              { opacity: backgroundOpacity },
            ]}
            pointerEvents="none"
          />
          <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
            <Feather name="search" size={ms(16)} color="#7C3AED" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
              placeholder="Search a city or state"
              placeholderTextColor={isDarkMode ? '#94A3B8' : '#A59DB7'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons
                  name="close-circle"
                  size={ms(17)}
                  color={isDarkMode ? '#94A3B8' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* ── Fixed Bottom Callout: Can't find your city? (Always visible) ── */}
      <View
        style={[styles.bottomCalloutWrapper, { paddingBottom: Math.max(insets.bottom, vs(10)) }]}>
        <View style={styles.requestCalloutCard}>
          <LinearGradient
            colors={['#3B0764', '#581C87', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.requestIconBadge}>
            <Ionicons name="location" size={ms(18)} color="#1E1035" />
          </View>

          <View style={styles.requestTextGroup}>
            <Text style={styles.requestTitle}>Can&apos;t find your city?</Text>
            <Text style={styles.requestSubtitle}>
              Help us bring verified pet-friendly places closer to you.
            </Text>
          </View>

          <BouncyPressable
            style={styles.requestBtn}
            activeScale={0.92}
            onPress={() => setRequestModalVisible(true)}>
            <Text style={styles.requestBtnText}>Request</Text>
          </BouncyPressable>
        </View>
      </View>

      {/* ── Request City Modal ── */}
      <Modal
        visible={requestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRequestModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setRequestModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.modalBox, isDarkMode && styles.modalBoxDark]}>
                <View style={styles.modalHeaderRow}>
                  <View style={[styles.modalIconWrap, isDarkMode && styles.modalIconWrapDark]}>
                    <Ionicons name="location" size={ms(20)} color="#A78BFA" />
                  </View>
                  <TouchableOpacity
                    onPress={() => setRequestModalVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons
                      name="close"
                      size={ms(20)}
                      color={isDarkMode ? '#94A3B8' : '#6B7280'}
                    />
                  </TouchableOpacity>
                </View>

                {requestSuccess ? (
                  <View style={styles.successState}>
                    <Ionicons name="checkmark-circle" size={ms(44)} color="#10B981" />
                    <Text style={styles.successTitle}>Request Submitted!</Text>
                    <Text style={[styles.successDesc, isDarkMode && styles.successDescDark]}>
                      Our team is prioritizing {requestCityName.trim()} to research and verify
                      pet-friendly places for you.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
                      Request a Pet-Friendly City
                    </Text>
                    <Text style={[styles.modalDesc, isDarkMode && styles.modalDescDark]}>
                      Tell us which city or town you want our pack to map and personally verify
                      next.
                    </Text>

                    <TextInput
                      style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
                      placeholder="e.g. Chandigarh, Goa, Pondicherry..."
                      placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                      value={requestCityName}
                      onChangeText={setRequestCityName}
                      autoFocus
                    />

                    <View style={styles.modalBtnRow}>
                      <TouchableOpacity
                        style={styles.modalCancelBtn}
                        onPress={() => setRequestModalVisible(false)}>
                        <Text
                          style={[
                            styles.modalCancelText,
                            isDarkMode && styles.modalCancelTextDark,
                          ]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>

                      <BouncyPressable
                        style={[
                          styles.modalSubmitBtn,
                          !requestCityName.trim() && styles.modalSubmitBtnDisabled,
                        ]}
                        activeScale={0.94}
                        onPress={handleRequestSubmit}>
                        <Text style={styles.modalSubmitText}>Submit Request</Text>
                      </BouncyPressable>
                    </View>
                  </>
                )}
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default CityList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  scrollContent: {
    paddingTop: vs(4),
  },

  /* ── 1. Top Header Bar ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    marginBottom: vs(4),
    backgroundColor: '#F8F7FC',
    zIndex: 20,
  },
  backButton: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTextGroup: {
    flex: 1,
    marginLeft: s(12),
  },
  headerOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8A9F',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: s(16.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    marginTop: s(1),
  },
  headerBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  headerBadgeText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },

  /* ── 2. Hero Card ── */
  heroCard: {
    marginHorizontal: s(16),
    marginTop: vs(8),
    height: s(220),
    borderRadius: s(24),
    overflow: 'hidden',
    backgroundColor: '#1E0E35',
    shadowColor: '#1E0E35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  hero3DBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: s(24),
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 1.2,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightWidth: 1.2,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomWidth: 3.8,
    borderBottomColor: '#1E0A45',
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
  heroContent: {
    flex: 1,
    padding: s(16),
    justifyContent: 'space-between',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: s(12),
    paddingHorizontal: s(9),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  heroBadgeText: {
    color: '#FBBF24',
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.7,
    marginLeft: s(4),
  },
  heroTitleGroup: {
    marginTop: vs(6),
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: s(21),
    lineHeight: s(26),
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: s(11),
    lineHeight: s(15.5),
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: vs(5),
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },
  heroStatPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: s(12),
    paddingHorizontal: s(11),
    paddingVertical: vs(5),
    marginRight: s(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroStatPillText: {
    color: '#FFFFFF',
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── 3. Search Bar & Sticky Positioning ── */
  listArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  searchSpacer: {
    height: s(45) + vs(14),
  },
  stickySearchWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: vs(6),
    paddingBottom: vs(8),
  },
  stickyBackgroundMask: {
    backgroundColor: '#F8F7FC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    height: s(45),
    borderRadius: s(24),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7F6',
    paddingHorizontal: s(16),
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: s(10),
  },
  searchInput: {
    flex: 1,
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1A0B2E',
    paddingVertical: 0,
  },

  /* ── 4. Featured Region Card ── */
  featuredRegionCard: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    borderRadius: s(22),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#FDE68A',
    borderRightWidth: 1.2,
    borderRightColor: '#FDE68A',
    borderBottomWidth: 3.5,
    borderBottomColor: '#F59E0B',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  featuredCardContent: {
    padding: s(16),
  },
  featuredWatermark: {
    position: 'absolute',
    right: s(14),
    top: s(14),
  },
  featuredOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#B45309',
    letterSpacing: 0.7,
  },
  featuredTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    marginTop: vs(2),
  },
  featuredSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#78716C',
    marginTop: vs(2),
  },
  featuredTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: vs(12),
  },
  featuredTagPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    marginRight: s(6),
    marginBottom: vs(4),
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  featuredTagText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#44403C',
  },
  featuredCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#7C3AED',
    borderRadius: s(18),
    paddingHorizontal: s(16),
    paddingVertical: vs(8.5),
    marginTop: vs(12),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  featuredCtaText: {
    color: '#FFFFFF',
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  ctaArrow: {
    marginLeft: s(6),
  },

  /* ── 5. Browse Destinations Header ── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginTop: vs(20),
    marginBottom: vs(10),
  },
  sectionOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8A9F',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    marginTop: vs(1),
  },
  shownCountText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8E8A9F',
  },

  /* ── 6. City Cards (3D Tactile Design with Spring Animation) ── */
  cityCardAnimatedWrap: {
    marginHorizontal: 0,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginBottom: vs(11),
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.2,
    borderLeftColor: '#ECE7F6',
    borderRightWidth: 1.2,
    borderRightColor: '#ECE7F6',
    borderBottomWidth: 3.8,
    borderBottomColor: '#DDD6FE',
    paddingHorizontal: s(13),
    paddingVertical: vs(12),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: s(6),
  },
  cityIconBox: {
    width: s(44),
    height: s(44),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2.8,
    marginRight: s(10),
  },
  cityImageBox: {
    width: s(44),
    height: s(44),
    borderRadius: s(14),
    overflow: 'hidden',
    marginRight: s(10),
    backgroundColor: '#F1EDFA',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#ECE7F6',
    borderBottomWidth: 2.8,
    borderBottomColor: '#C4B5FD',
  },
  cityCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: s(13),
  },
  imageFallbackHolder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityNameGroup: {
    flex: 1,
    marginRight: s(4),
  },
  cityNameText: {
    fontSize: ms(15),
    lineHeight: ms(19),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    letterSpacing: -0.2,
  },
  cityStateText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#8E8A9F',
    marginTop: vs(1.5),
  },
  cityTotalText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    marginTop: vs(1.5),
  },
  cityCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  verifiedBadge: {
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#FFFBEB',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#FDE68A',
    borderBottomWidth: 2.5,
    borderBottomColor: '#F59E0B',
    borderRadius: s(14),
    paddingHorizontal: s(8),
    paddingVertical: vs(4.5),
    marginRight: s(6),
  },
  verifiedBadgeText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#92400E',
  },
  cityArrowWell: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#F8F6FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 1.8,
    borderBottomColor: '#DDD6FE',
  },
  flatListFlex: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: vs(12),
  },
  bottomCalloutWrapper: {
    backgroundColor: 'transparent',
  },

  /* ── Empty State ── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(40),
    paddingHorizontal: s(24),
  },
  emptyTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    marginTop: vs(10),
  },
  emptySubtitle: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: vs(4),
  },
  emptyResetBtn: {
    marginTop: vs(14),
    backgroundColor: '#EDE9FE',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(12),
  },
  emptyResetText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },

  /* ── 7. Can't find your city? Callout ── */
  requestCalloutCard: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    marginBottom: vs(18),
    borderRadius: s(20),
    overflow: 'hidden',
    padding: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomWidth: 3.5,
    borderBottomColor: '#26094A',
    shadowColor: '#581C87',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  requestIconBadge: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  requestTextGroup: {
    flex: 1,
    marginRight: s(10),
  },
  requestTitle: {
    color: '#FFFFFF',
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  requestSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: s(10.5),
    lineHeight: s(14),
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: vs(2),
  },
  requestBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: vs(7.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestBtnText: {
    color: '#581C87',
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── Request Modal ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 6, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    padding: s(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  modalIconWrap: {
    width: s(40),
    height: s(40),
    borderRadius: s(12),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
  },
  modalDesc: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(4),
    lineHeight: s(17),
  },
  modalInput: {
    height: s(46),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: s(14),
    paddingHorizontal: s(14),
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1A0B2E',
    marginTop: vs(14),
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: vs(18),
  },
  modalCancelBtn: {
    paddingHorizontal: s(14),
    paddingVertical: vs(9),
    marginRight: s(8),
  },
  modalCancelText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#6B7280',
  },
  modalSubmitBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: s(18),
    paddingVertical: vs(9.5),
    borderRadius: s(14),
  },
  modalSubmitBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  modalSubmitText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: vs(14),
  },
  successTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#10B981',
    marginTop: vs(8),
  },
  successDesc: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#475569',
    textAlign: 'center',
    marginTop: vs(4),
    lineHeight: s(17),
  },

  /* ── Luxury Dark Mode Theme Overrides ── */
  containerDark: {
    backgroundColor: '#0F071D',
  },
  headerRowDark: {
    backgroundColor: '#0F071D',
  },
  stickyBackgroundMaskDark: {
    backgroundColor: '#0F071D',
  },
  backButtonDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    shadowColor: '#000000',
  },
  headerOverlineDark: {
    color: '#A78BFA',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerBadgeDark: {
    backgroundColor: '#261245',
    borderColor: '#3B1D6E',
  },
  headerBadgeTextDark: {
    color: '#C4B5FD',
  },
  searchContainerDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
    shadowColor: '#000000',
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  featuredRegionCardDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftColor: '#3B1D6E',
    borderRightColor: '#3B1D6E',
    borderBottomColor: '#260B4E',
    shadowColor: '#000000',
  },
  featuredOverlineDark: {
    color: '#FBBF24',
  },
  featuredTitleDark: {
    color: '#FFFFFF',
  },
  featuredSubtitleDark: {
    color: '#CBD5E1',
  },
  featuredTagPillDark: {
    backgroundColor: '#16092C',
    borderColor: '#2E1654',
  },
  featuredTagTextDark: {
    color: '#E2E8F0',
  },
  sectionOverlineDark: {
    color: '#A78BFA',
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  shownCountTextDark: {
    color: '#94A3B8',
  },
  cityCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderLeftColor: '#2E1654',
    borderRightColor: '#2E1654',
    borderBottomColor: '#260B4E',
    shadowColor: '#000000',
  },
  cityImageBoxDark: {
    backgroundColor: '#261245',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: '#3B1D6E',
    borderBottomColor: '#1E0E38',
  },
  cityNameTextDark: {
    color: '#FFFFFF',
  },
  cityStateTextDark: {
    color: '#94A3B8',
  },
  cityTotalTextDark: {
    color: '#A78BFA',
  },
  verifiedBadgeDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderTopColor: 'rgba(251, 191, 36, 0.3)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderBottomColor: 'rgba(217, 119, 6, 0.6)',
  },
  verifiedBadgeTextDark: {
    color: '#FCD34D',
  },
  cityArrowWellDark: {
    backgroundColor: '#261245',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: '#3B1D6E',
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptySubtitleDark: {
    color: '#94A3B8',
  },
  emptyResetBtnDark: {
    backgroundColor: '#261245',
  },
  emptyResetTextDark: {
    color: '#C4B5FD',
  },
  modalBoxDark: {
    backgroundColor: '#17092E',
    borderWidth: 1,
    borderColor: '#2E1654',
  },
  modalIconWrapDark: {
    backgroundColor: '#261245',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalDescDark: {
    color: '#94A3B8',
  },
  modalInputDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    color: '#FFFFFF',
  },
  modalCancelTextDark: {
    color: '#94A3B8',
  },
  successDescDark: {
    color: '#CBD5E1',
  },
  loadingContainer: {
    paddingVertical: vs(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: vs(12),
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },
  loadingTextDark: {
    color: '#94A3B8',
  },
});
