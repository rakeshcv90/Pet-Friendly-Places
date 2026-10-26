import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StatusBar,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useDiscoveryCities } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';

// Initial curated pet-friendly cities exactly matching the design
const DEFAULT_CITIES = [
  {
    city: 'Rishikesh',
    state: 'Uttarakhand',
    listing_count: 67,
    region: 'North',
    icon: 'water-outline',
    paletteIndex: 0,
  },
  {
    city: 'Dehradun',
    state: 'Uttarakhand',
    listing_count: 51,
    region: 'North',
    icon: 'leaf-outline',
    paletteIndex: 1,
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    listing_count: 34,
    region: 'North',
    icon: 'business-outline',
    paletteIndex: 2,
  },
  {
    city: 'Mussoorie',
    state: 'Uttarakhand',
    listing_count: 34,
    region: 'North',
    icon: 'trail-sign-outline',
    paletteIndex: 3,
  },
  {
    city: 'Jaipur',
    state: 'Rajasthan',
    listing_count: 33,
    region: 'North',
    icon: 'compass-outline',
    paletteIndex: 0,
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    listing_count: 28,
    region: 'South',
    icon: 'flower-outline',
    paletteIndex: 1,
  },
  {
    city: 'Manali',
    state: 'Himachal Pradesh',
    listing_count: 26,
    region: 'North',
    icon: 'triangle-outline',
    paletteIndex: 2,
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    listing_count: 20,
    region: 'West',
    icon: 'navigate-outline',
    paletteIndex: 3,
  },
  {
    city: 'Noida',
    state: 'Uttar Pradesh',
    listing_count: 19,
    region: 'North',
    icon: 'cube-outline',
    paletteIndex: 0,
  },
  {
    city: 'Bhimtal',
    state: 'Uttarakhand',
    listing_count: 17,
    region: 'North',
    icon: 'water-outline',
    paletteIndex: 1,
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    listing_count: 15,
    region: 'West',
    icon: 'book-outline',
    paletteIndex: 2,
  },
  {
    city: 'Dharamshala',
    state: 'Himachal Pradesh',
    listing_count: 13,
    region: 'North',
    icon: 'sparkles-outline',
    paletteIndex: 3,
  },
  {
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    listing_count: 12,
    region: 'North',
    icon: 'flame-outline',
    paletteIndex: 0,
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    listing_count: 9,
    region: 'South',
    icon: 'sunny-outline',
    paletteIndex: 1,
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    listing_count: 10,
    region: 'East',
    icon: 'library-outline',
    paletteIndex: 2,
  },
  {
    city: 'Udaipur',
    state: 'Rajasthan',
    listing_count: 8,
    region: 'North',
    icon: 'heart-outline',
    paletteIndex: 3,
  },
];

const REGION_MAPPING = {
  Uttarakhand: 'North',
  Delhi: 'North',
  'Delhi NCR': 'North',
  Haryana: 'North',
  'Himachal Pradesh': 'North',
  Rajasthan: 'North',
  Punjab: 'North',
  'Uttar Pradesh': 'North',
  'Jammu and Kashmir': 'North',
  Chandigarh: 'North',
  Ladakh: 'North',
  Maharashtra: 'West',
  Gujarat: 'West',
  Goa: 'West',
  Karnataka: 'South',
  'Tamil Nadu': 'South',
  Kerala: 'South',
  Telangana: 'South',
  'Andhra Pradesh': 'South',
  Puducherry: 'South',
  'West Bengal': 'East',
  Odisha: 'East',
  Bihar: 'East',
  Jharkhand: 'East',
  Assam: 'East',
  Sikkim: 'East',
  Meghalaya: 'East',
  'Madhya Pradesh': 'North',
};

const PALETTES = [
  { bg: '#EDE9FE', border: '#DDD6FE', iconColor: '#7C3AED', icon: 'trail-sign-outline' }, // Purple
  { bg: '#CCFBF1', border: '#99F6E4', iconColor: '#0D9488', icon: 'leaf-outline' }, // Teal
  { bg: '#FEF3C7', border: '#FDE68A', iconColor: '#D97706', icon: 'business-outline' }, // Amber
  { bg: '#FCE7F3', border: '#FBCFE8', iconColor: '#DB2777', icon: 'heart-outline' }, // Pink
];

const DARK_PALETTES = [
  { bg: 'rgba(124, 58, 237, 0.22)', border: '#3B1D6E', iconColor: '#C4B5FD', icon: 'trail-sign-outline' }, // Purple
  { bg: 'rgba(13, 148, 136, 0.22)', border: '#134E4A', iconColor: '#5EEAD4', icon: 'leaf-outline' }, // Teal
  { bg: 'rgba(217, 119, 6, 0.22)', border: '#78350F', iconColor: '#FCD34D', icon: 'business-outline' }, // Amber
  { bg: 'rgba(219, 39, 119, 0.22)', border: '#831843', iconColor: '#F472B6', icon: 'heart-outline' }, // Pink
];

const REGIONS = ['All', 'North', 'West', 'South', 'East'];

export const CityList = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const setCurrentLocation = useStore(state => state.setCurrentLocation);
  const isDarkMode = useStore(state => state.isDarkMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestCityName, setRequestCityName] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Fetch live discovery cities from API if available
  const { data: apiCities } = useDiscoveryCities();

  const citiesData = useMemo(() => {
    if (Array.isArray(apiCities) && apiCities.length > 0) {
      // Merge live API data with design fallbacks for icons/regions
      const apiMap = new Map();
      apiCities.forEach(c => {
        if (c.city) {
          apiMap.set(c.city.toLowerCase(), c);
        }
      });

      // Update default cities with fresh live count if available
      const mergedDefaults = DEFAULT_CITIES.map(def => {
        const live = apiMap.get(def.city.toLowerCase());
        return {
          ...def,
          listing_count: live?.listing_count || def.listing_count,
        };
      });

      // Add any additional cities from API that weren't in default list
      const existingNames = new Set(DEFAULT_CITIES.map(d => d.city.toLowerCase()));
      const extraCities = [];
      apiCities.forEach((c, idx) => {
        if (c.city && !existingNames.has(c.city.toLowerCase())) {
          const region = REGION_MAPPING[c.state] || 'North';
          extraCities.push({
            city: c.city,
            state: c.state || 'India',
            listing_count: c.listing_count || 1,
            region,
            icon: 'location-outline',
            paletteIndex: (DEFAULT_CITIES.length + idx) % PALETTES.length,
          });
        }
      });

      return [...mergedDefaults, ...extraCities];
    }
    return DEFAULT_CITIES;
  }, [apiCities]);

  // Filtered by Search query & Region tab
  const filteredCities = useMemo(() => {
    return citiesData.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.city.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q);

      const matchesRegion =
        selectedRegion === 'All' || item.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [citiesData, searchQuery, selectedRegion]);

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

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark, { paddingTop: Math.max(insets.top, s(10)) }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0F071D' : '#F8F7FC'} />

      {/* ── Top Header Bar ── */}
      <View style={styles.headerRow}>
        <BouncyPressable style={[styles.backButton, isDarkMode && styles.backButtonDark]} activeScale={0.88} onPress={handleBack}>
          <Feather name="arrow-left" size={ms(18)} color={isDarkMode ? '#FFFFFF' : '#1E1035'} />
        </BouncyPressable>

        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerOverline, isDarkMode && styles.headerOverlineDark]}>EXPLORE INDIA</Text>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Pet-friendly cities</Text>
        </View>

        <View style={[styles.headerBadge, isDarkMode && styles.headerBadgeDark]}>
          <Text style={[styles.headerBadgeText, isDarkMode && styles.headerBadgeTextDark]}>97+</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, vs(24)) + vs(40) },
        ]}>
        {/* ── Hero Banner ── */}
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
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.heroContent}>
            <View style={styles.heroBadgeRow}>
              <Ionicons name="paw" size={ms(12)} color="#FBBF24" />
              <Text style={styles.heroBadgeText}>PET-FRIENDLY DESTINATIONS</Text>
            </View>

            <View style={styles.heroTitleGroup}>
              <Text style={styles.heroTitle}>Find your next city</Text>
              <Text style={styles.heroTitle}>together</Text>
              <Text style={styles.heroSubtitle}>
                Real pet rules, verified places, and local guides for travelling across India with your
                best friend.
              </Text>
            </View>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatPillText}>97+ cities</Text>
              </View>
              <View style={styles.heroStatPill}>
                <Text style={styles.heroStatPillText}>500+ verified places</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Search Bar ── */}
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
              <Ionicons name="close-circle" size={ms(17)} color={isDarkMode ? '#94A3B8' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Featured Region Card (Delhi NCR) ── */}
        <View style={[styles.featuredRegionCard, isDarkMode && styles.featuredRegionCardDark]}>
          <LinearGradient
            colors={isDarkMode ? ['#1F1338', '#2A184D'] : ['#FFFDF7', '#FEF3C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Decorative architectural watermark icon */}
          <Ionicons
            name="business"
            size={ms(58)}
            color={isDarkMode ? 'rgba(251, 191, 36, 0.08)' : 'rgba(217, 119, 6, 0.12)'}
            style={styles.featuredWatermark}
          />

          <View style={styles.featuredCardContent}>
            <Text style={[styles.featuredOverline, isDarkMode && styles.featuredOverlineDark]}>FEATURED REGION</Text>
            <Text style={[styles.featuredTitle, isDarkMode && styles.featuredTitleDark]}>Delhi NCR</Text>
            <Text style={[styles.featuredSubtitle, isDarkMode && styles.featuredSubtitleDark]}>
              Delhi · Gurugram · Noida · Faridabad · Aerocity
            </Text>

            <View style={styles.featuredTagsRow}>
              <View style={[styles.featuredTagPill, isDarkMode && styles.featuredTagPillDark]}>
                <Text style={[styles.featuredTagText, isDarkMode && styles.featuredTagTextDark]}>🐕  Dog walks</Text>
              </View>
              <View style={[styles.featuredTagPill, isDarkMode && styles.featuredTagPillDark]}>
                <Text style={[styles.featuredTagText, isDarkMode && styles.featuredTagTextDark]}>☕  Pet cafes</Text>
              </View>
              <View style={[styles.featuredTagPill, isDarkMode && styles.featuredTagPillDark]}>
                <Text style={[styles.featuredTagText, isDarkMode && styles.featuredTagTextDark]}>🏨  Stays</Text>
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

        {/* ── Browse Destinations Header & Region Tabs ── */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>BROWSE DESTINATIONS</Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Pick a city, pack the leash</Text>
          </View>
          <Text style={[styles.shownCountText, isDarkMode && styles.shownCountTextDark]}>{`${filteredCities.length} shown`}</Text>
        </View>

        {/* Region Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.regionTabsScroll}>
          {REGIONS.map(region => {
            const isSelected = selectedRegion === region;
            return (
              <BouncyPressable
                key={region}
                style={[
                  styles.regionTabChip,
                  isSelected
                    ? styles.regionTabChipActive
                    : [styles.regionTabChipInactive, isDarkMode && styles.regionTabChipInactiveDark],
                ]}
                activeScale={0.92}
                onPress={() => setSelectedRegion(region)}>
                <Text
                  style={[
                    styles.regionTabText,
                    isSelected
                      ? styles.regionTabTextActive
                      : [styles.regionTabTextInactive, isDarkMode && styles.regionTabTextInactiveDark],
                  ]}>
                  {region}
                </Text>
              </BouncyPressable>
            );
          })}
        </ScrollView>

        {/* ── City Cards List ── */}
        {filteredCities.length > 0 ? (
          filteredCities.map((item, index) => {
            const paletteList = isDarkMode ? DARK_PALETTES : PALETTES;
            const palette = paletteList[item.paletteIndex ?? index % paletteList.length];
            const iconName = item.icon || palette.icon;

            return (
              <BouncyPressable
                key={`${item.city}-${index}`}
                style={[styles.cityCard, isDarkMode && styles.cityCardDark]}
                activeScale={0.97}
                onPress={() => handleSelectCity(item.city)}>
                <View style={styles.cityCardLeft}>
                  <View
                    style={[
                      styles.cityIconBox,
                      { backgroundColor: palette.bg, borderColor: palette.border },
                    ]}>
                    <Ionicons name={iconName} size={ms(18)} color={palette.iconColor} />
                  </View>

                  <View style={styles.cityNameGroup}>
                    <Text style={[styles.cityNameText, isDarkMode && styles.cityNameTextDark]} numberOfLines={1}>
                      {item.city}
                    </Text>
                    <Text style={[styles.cityStateText, isDarkMode && styles.cityStateTextDark]} numberOfLines={1}>
                      {item.state}
                    </Text>
                  </View>
                </View>

                <View style={styles.cityCardRight}>
                  <View style={[styles.verifiedBadge, isDarkMode && styles.verifiedBadgeDark]}>
                    <Text style={[styles.verifiedBadgeText, isDarkMode && styles.verifiedBadgeTextDark]}>
                      {`${item.listing_count} Verified Places`}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={ms(14)} color={isDarkMode ? '#64748B' : '#9CA3AF'} />
                </View>
              </BouncyPressable>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={ms(38)} color={isDarkMode ? '#475569' : '#CBD5E1'} />
            <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>No cities found</Text>
            <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
              {`We couldn't find any destination matching "${searchQuery}".`}
            </Text>
            <BouncyPressable
              style={[styles.emptyResetBtn, isDarkMode && styles.emptyResetBtnDark]}
              activeScale={0.92}
              onPress={() => {
                setSearchQuery('');
                setSelectedRegion('All');
              }}>
              <Text style={[styles.emptyResetText, isDarkMode && styles.emptyResetTextDark]}>Clear filters</Text>
            </BouncyPressable>
          </View>
        )}

        {/* ── Can't find your city? Callout Banner ── */}
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
      </ScrollView>

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
                    <Ionicons name="close" size={ms(20)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                  </TouchableOpacity>
                </View>

                {requestSuccess ? (
                  <View style={styles.successState}>
                    <Ionicons name="checkmark-circle" size={ms(44)} color="#10B981" />
                    <Text style={styles.successTitle}>Request Submitted!</Text>
                    <Text style={[styles.successDesc, isDarkMode && styles.successDescDark]}>
                      Our team is prioritizing {requestCityName.trim()} to research and verify pet-friendly
                      places for you.
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Request a Pet-Friendly City</Text>
                    <Text style={[styles.modalDesc, isDarkMode && styles.modalDescDark]}>
                      Tell us which city or town you want our pack to map and personally verify next.
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
                        <Text style={[styles.modalCancelText, isDarkMode && styles.modalCancelTextDark]}>Cancel</Text>
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
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

  /* ── 3. Search Bar ── */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginTop: vs(14),
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
    borderWidth: 1.2,
    borderColor: '#FDE68A',
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

  /* ── Region Filter Chips ── */
  regionTabsScroll: {
    paddingLeft: s(16),
    paddingRight: s(8),
    marginBottom: vs(12),
  },
  regionTabChip: {
    borderRadius: s(20),
    paddingHorizontal: s(15),
    paddingVertical: vs(6),
    marginRight: s(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionTabChipActive: {
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  regionTabChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7F6',
  },
  regionTabText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  regionTabTextActive: {
    color: '#FFFFFF',
  },
  regionTabTextInactive: {
    color: '#6B7280',
  },

  /* ── 6. City Cards ── */
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginBottom: vs(9),
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    borderWidth: 1,
    borderColor: '#F0ECF8',
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1.5,
  },
  cityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityIconBox: {
    width: s(40),
    height: s(40),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: s(12),
  },
  cityNameGroup: {
    flex: 1,
  },
  cityNameText: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
  },
  cityStateText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    marginTop: vs(1.5),
  },
  cityCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 0.8,
    borderColor: '#FDE68A',
    borderRadius: s(6),
    paddingHorizontal: s(8),
    paddingVertical: vs(3.5),
    marginRight: s(8),
  },
  verifiedBadgeText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#92400E',
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
    borderColor: '#3B1D6E',
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
  regionTabChipInactiveDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  regionTabTextInactiveDark: {
    color: '#94A3B8',
  },
  cityCardDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
    shadowColor: '#000000',
  },
  cityNameTextDark: {
    color: '#FFFFFF',
  },
  cityStateTextDark: {
    color: '#94A3B8',
  },
  verifiedBadgeDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  verifiedBadgeTextDark: {
    color: '#FCD34D',
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
});
