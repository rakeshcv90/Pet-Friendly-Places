import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';

// ── Dropdown Options ──
const CATEGORY_OPTIONS = [
  'Pet Friendly Stays',
  'Eat Out Together',
  'Paws in the Wild',
  'Vet & Pet Care',
  'Road Trip Routes',
  'Transport with Dogs',
  'Pet-Friendly Caravans',
  'Pet Friendly Offices',
  'Pet Welfare & Rescue',
  'Cities',
];

const STATE_OPTIONS = [
  'All states',
  'Delhi NCR',
  'Haryana',
  'Uttar Pradesh',
  'Karnataka',
  'Maharashtra',
  'Uttarakhand',
  'Himachal Pradesh',
];

const BADGE_OPTIONS = [
  'Any badge',
  'Tails Verified',
  'Team Verified',
  'Owner Verified',
];

const PET_SIZES_DATA = [
  { id: 'Small', label: 'Small', flex: 1 },
  { id: 'Medium', label: 'Medium', flex: 1.05 },
  { id: 'Large', label: 'Large', flex: 1 },
  { id: 'Any size', label: 'Any size', flex: 1.25 },
];

const RATINGS_DATA = [
  { id: '4.5', hasStar: true, label: '4.5+', flex: 1 },
  { id: '4.0', hasStar: true, label: '4.0+', flex: 1 },
  { id: '3.5', hasStar: true, label: '3.5+', flex: 1 },
  { id: 'any', hasStar: false, label: 'Any rating', flex: 1.35 },
];

export const FilterScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const isDarkMode = useStore(state => state.isDarkMode);

  // Parallax Ambient Glow Orbs & Watermarks (matching Home screen)
  const orbTopRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -35],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const orbTopLeftY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -25],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const orbMidRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -45],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const orbMidLeftY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -30],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const orbBottomRightY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -40],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const watermarkTopY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -20],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  const watermarkBottomY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 400],
        outputRange: [0, -35],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  // 3D Card Perspective Tilt
  const cardTiltRotateX = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 250, 500],
        outputRange: ['0deg', '1.6deg', '-1.2deg'],
        extrapolate: 'clamp',
      }),
    [scrollY],
  );

  // Route initial filters
  const initialCategory = route?.params?.category || 'Pet Friendly Stays';

  // State
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState('All states');
  const [cityQuery, setCityQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('Any badge');

  // Checkbox: Pets allowed in pool
  const [petsInPool, setPetsInPool] = useState(false);

  // Pet Size
  const [selectedSize, setSelectedSize] = useState('Any size');

  // Pet Amenities (7 checkboxes)
  const [amenities, setAmenities] = useState({
    noPetFee: false,
    petMenu: false,
    openLawn: true,
    largeDogs: false,
    waterAccess: false,
    parking: false,
    indoorAccess: false,
  });

  // Minimum Rating
  const [selectedRating, setSelectedRating] = useState('any');

  // Verified listings only
  const [verifiedOnly, setVerifiedOnly] = useState(true);

  // Modal selector states
  const [activePicker, setActivePicker] = useState(null); // 'category' | 'state' | 'badge' | null

  // Toggle amenity helper
  const toggleAmenity = key => {
    setAmenities(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Clear all filters
  const handleClearAll = () => {
    setSelectedCategory('Pet Friendly Stays');
    setSelectedState('All states');
    setCityQuery('');
    setSelectedBadge('Any badge');
    setPetsInPool(false);
    setSelectedSize('Any size');
    setAmenities({
      noPetFee: false,
      petMenu: false,
      openLawn: false,
      largeDogs: false,
      waterAccess: false,
      parking: false,
      indoorAccess: false,
    });
    setSelectedRating('any');
    setVerifiedOnly(false);
  };

  // Dynamic matching count calculation
  const matchCount = useMemo(() => {
    let count = 24;
    if (selectedState !== 'All states') count -= 5;
    if (cityQuery.trim()) count -= 4;
    if (petsInPool) count -= 6;
    if (selectedSize !== 'Any size') count -= 3;
    if (selectedRating !== 'any') count -= 4;
    if (amenities.noPetFee) count -= 2;
    if (amenities.waterAccess) count -= 2;
    return Math.max(count, 4);
  }, [selectedState, cityQuery, petsInPool, selectedSize, selectedRating, amenities]);

  // Apply and navigate back
  const handleApply = () => {
    const tags = [];
    if (verifiedOnly) tags.push('Verified');
    if (selectedSize === 'Any size') tags.push('All breeds');
    else tags.push(`${selectedSize} dogs`);
    if (amenities.openLawn) tags.push('Open lawn');
    if (amenities.noPetFee) tags.push('No pet fee');
    if (petsInPool) tags.push('Pool access');
    if (amenities.indoorAccess) tags.push('Indoor access');

    if (route?.params?.onApplyFilters) {
      route.params.onApplyFilters({
        category: selectedCategory,
        state: selectedState,
        city: cityQuery,
        badge: selectedBadge,
        tags,
        selectedRating,
      });
    }

    navigation?.goBack?.();
  };

  // Render a custom checkbox component
  const renderCheckbox = (checked, onPress, label, description) => (
    <Pressable style={styles.checkboxRow} onPress={onPress}>
      <View
        style={[
          styles.checkboxSquare,
          isDarkMode && styles.checkboxSquareDark,
          checked && styles.checkboxSquareChecked,
        ]}>
        {checked && <Ionicons name="checkmark" size={ms(14)} color="#FFFFFF" />}
      </View>
      <View style={styles.checkboxTextGroup}>
        <Text style={[styles.checkboxLabel, isDarkMode && styles.checkboxLabelDark]}>{label}</Text>
        {description ? (
          <Text style={[styles.checkboxDesc, isDarkMode && styles.checkboxDescDark]}>{description}</Text>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark, { paddingTop: Math.max(insets.top, vs(8)) }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'} translucent={false} />

      {/* ── Background Ambient Decorative Glows & Watermarks (matching Home screen) ── */}
      <Animated.View
        style={[styles.ambientGlowTopRight, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbTopRightY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowTopLeft, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbTopLeftY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowMidRight, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbMidRightY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowMidLeft, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbMidLeftY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowBottomRight, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbBottomRightY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientPawWatermarkTop,
          { transform: [{ rotate: '-25deg' }, { translateY: watermarkTopY }] },
        ]}
        pointerEvents="none">
        <Ionicons name="paw" size={ms(120)} color={isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(123, 44, 255, 0.035)'} />
      </Animated.View>
      <Animated.View
        style={[
          styles.ambientPawWatermarkBottom,
          { transform: [{ rotate: '30deg' }, { translateY: watermarkBottomY }] },
        ]}
        pointerEvents="none">
        <Ionicons name="paw" size={ms(140)} color={isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(238, 42, 123, 0.035)'} />
      </Animated.View>

      {/* ── Top Header Row (Back | REFINE YOUR SEARCH / Filters | Clear all) ── */}
      <View style={styles.headerRow}>
        <BouncyPressable
          activeScale={0.88}
          style={[styles.backBtn, isDarkMode && styles.backBtnDark]}
          onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={ms(19)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
        </BouncyPressable>

        <View style={styles.headerTitleGroup}>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>REFINE YOUR SEARCH</Text>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Filters</Text>
        </View>

        <BouncyPressable activeScale={0.9} onPress={handleClearAll} style={styles.clearAllBtn}>
          <Text style={[styles.clearAllText, isDarkMode && styles.clearAllTextDark]}>Clear all</Text>
        </BouncyPressable>
      </View>

      <View style={[styles.headerDivider, isDarkMode && styles.headerDividerDark]} />

      {/* ── Scrollable Form Content ── */}
      <Animated.ScrollView
        style={styles.scrollFlex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}>
        <Animated.View
          style={{
            transform: [{ perspective: 1000 }, { rotateX: cardTiltRotateX }],
          }}>
          {/* ── 1. CATEGORY ── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>CATEGORY</Text>
            <BouncyPressable
              activeScale={0.98}
              style={[styles.dropdownBox, isDarkMode && styles.dropdownBoxDark]}
              onPress={() => setActivePicker('category')}>
              <Text style={[styles.dropdownValueText, isDarkMode && styles.dropdownValueTextDark]}>{selectedCategory}</Text>
              <Ionicons name="chevron-down" size={ms(17)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
            </BouncyPressable>
          </View>

          {/* ── 2. STATE & CITY (Side by Side) ── */}
          <View style={styles.sectionContainer}>
            <View style={styles.twoColRow}>
              {/* Left: State */}
              <View style={styles.colHalf}>
                <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>STATE</Text>
                <BouncyPressable
                  activeScale={0.97}
                  style={[styles.dropdownBox, isDarkMode && styles.dropdownBoxDark]}
                  onPress={() => setActivePicker('state')}>
                  <Text style={[styles.dropdownValueText, isDarkMode && styles.dropdownValueTextDark]} numberOfLines={1}>
                    {selectedState}
                  </Text>
                  <Ionicons name="chevron-down" size={ms(16)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
                </BouncyPressable>
              </View>

              {/* Right: City */}
              <View style={styles.colHalf}>
                <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>CITY</Text>
                <View style={[styles.inputBox, isDarkMode && styles.inputBoxDark]}>
                  <TextInput
                    style={[styles.textInput, isDarkMode && styles.textInputDark]}
                    placeholder="e.g. Gurugram"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
                    value={cityQuery}
                    onChangeText={setCityQuery}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ── 3. PET BADGE & POOL CHECKBOX ── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>PET BADGE</Text>
            <BouncyPressable
              activeScale={0.98}
              style={[styles.dropdownBox, isDarkMode && styles.dropdownBoxDark]}
              onPress={() => setActivePicker('badge')}>
              <Text style={[styles.dropdownValueText, isDarkMode && styles.dropdownValueTextDark]}>{selectedBadge}</Text>
              <Ionicons name="chevron-down" size={ms(17)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
            </BouncyPressable>

            {/* Pets allowed in pool */}
            <View style={styles.poolCheckboxWrap}>
              {renderCheckbox(
                petsInPool,
                () => setPetsInPool(prev => !prev),
                'Pets allowed in pool',
                'Confirmed access to a dedicated pet pool',
              )}
            </View>
          </View>

          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ── 4. PET SIZE (True Horizontal Capsules) ── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>PET SIZE</Text>
            <View style={styles.pillsRow}>
              {PET_SIZES_DATA.map(item => {
                const isSelected = selectedSize === item.id;
                return (
                  <View key={item.id} style={[styles.pillContainer, { flex: item.flex }]}>
                    <BouncyPressable
                      activeScale={0.93}
                      style={styles.pillPressableFlex}
                      onPress={() => setSelectedSize(item.id)}>
                      {isSelected ? (
                        <LinearGradient
                          colors={['#8B3DFF', '#721FE8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.pillGradientActive}>
                          <Text numberOfLines={1} style={styles.sizePillTextActive}>
                            {item.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.sizePillInactive, isDarkMode && styles.sizePillInactiveDark]}>
                          <Text numberOfLines={1} style={[styles.sizePillTextInactive, isDarkMode && styles.sizePillTextInactiveDark]}>
                            {item.label}
                          </Text>
                        </View>
                      )}
                    </BouncyPressable>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ── 5. PET AMENITIES (2 Columns) ── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>PET AMENITIES</Text>
            <View style={styles.amenitiesGrid}>
              {/* Column 1 */}
              <View style={styles.amenitiesCol}>
                {renderCheckbox(
                  amenities.noPetFee,
                  () => toggleAmenity('noPetFee'),
                  'No pet fee',
                )}
                {renderCheckbox(
                  amenities.petMenu,
                  () => toggleAmenity('petMenu'),
                  'Pet menu',
                )}
                {renderCheckbox(
                  amenities.openLawn,
                  () => toggleAmenity('openLawn'),
                  'Open space / lawn',
                )}
                {renderCheckbox(
                  amenities.largeDogs,
                  () => toggleAmenity('largeDogs'),
                  'Large dogs allowed',
                )}
              </View>

              {/* Column 2 */}
              <View style={styles.amenitiesCol}>
                {renderCheckbox(
                  amenities.waterAccess,
                  () => toggleAmenity('waterAccess'),
                  'Water access',
                )}
                {renderCheckbox(
                  amenities.parking,
                  () => toggleAmenity('parking'),
                  'Parking',
                )}
                {renderCheckbox(
                  amenities.indoorAccess,
                  () => toggleAmenity('indoorAccess'),
                  'Indoor access',
                )}
              </View>
            </View>
          </View>

          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ── 6. MINIMUM RATING (True Horizontal Capsules) ── */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>MINIMUM RATING</Text>
            <View style={styles.pillsRow}>
              {RATINGS_DATA.map(item => {
                const isSelected = selectedRating === item.id;
                return (
                  <View key={item.id} style={[styles.pillContainer, { flex: item.flex }]}>
                    <BouncyPressable
                      activeScale={0.93}
                      style={styles.pillPressableFlex}
                      onPress={() => setSelectedRating(item.id)}>
                      {isSelected ? (
                        <LinearGradient
                          colors={['#8B3DFF', '#721FE8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.pillGradientActive}>
                          {item.hasStar && (
                            <Ionicons
                              name="star"
                              size={ms(12)}
                              color="#FFFFFF"
                              style={styles.ratingStarIcon}
                            />
                          )}
                          <Text numberOfLines={1} style={styles.ratingPillTextActive}>
                            {item.label}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.ratingPillInactive, isDarkMode && styles.ratingPillInactiveDark]}>
                          {item.hasStar && (
                            <Ionicons
                              name="star"
                              size={ms(12)}
                              color={isDarkMode ? '#FCD34D' : '#1D1238'}
                              style={styles.ratingStarIcon}
                            />
                          )}
                          <Text numberOfLines={1} style={[styles.ratingPillTextInactive, isDarkMode && styles.ratingPillTextInactiveDark]}>
                            {item.label}
                          </Text>
                        </View>
                      )}
                    </BouncyPressable>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ── 7. Verified listings only ── */}
          <View style={styles.sectionContainer}>
            {renderCheckbox(
              verifiedOnly,
              () => setVerifiedOnly(prev => !prev),
              'Verified listings only',
              'Hide places with unconfirmed pet policies',
            )}
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* ── Fixed Bottom Bar (Cleanly at Bottom, Zero Unwanted Gap) ── */}
      <View
        style={[
          styles.bottomBar,
          isDarkMode && styles.bottomBarDark,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + vs(8) : vs(18),
          },
        ]}>
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomPlacesCount, isDarkMode && styles.bottomPlacesCountDark]}>{`${matchCount} places`}</Text>
          <Text style={[styles.bottomSubtext, isDarkMode && styles.bottomSubtextDark]}>match these filters</Text>
        </View>

        <BouncyPressable activeScale={0.94} onPress={handleApply}>
          <View style={styles.applyBtnOuter}>
            <LinearGradient
              colors={['#8F42FF', '#701CE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.applyBtnGradient}>
              <Text style={styles.applyBtnText}>Show results</Text>
              <Ionicons name="arrow-forward" size={ms(15)} color="#FFFFFF" style={styles.arrowIcon} />
            </LinearGradient>
          </View>
        </BouncyPressable>
      </View>

      {/* ── Selection Modal for Dropdowns ── */}
      <Modal
        visible={!!activePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
          <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
            <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
                {activePicker === 'category'
                  ? 'Select Category'
                  : activePicker === 'state'
                  ? 'Select State'
                  : 'Select Pet Badge'}
              </Text>
              <Pressable hitSlop={10} onPress={() => setActivePicker(null)}>
                <Ionicons name="close" size={ms(20)} color={isDarkMode ? '#FFFFFF' : '#1D1238'} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {(activePicker === 'category'
                ? CATEGORY_OPTIONS
                : activePicker === 'state'
                ? STATE_OPTIONS
                : BADGE_OPTIONS
              ).map(item => {
                const isSelected =
                  (activePicker === 'category' && selectedCategory === item) ||
                  (activePicker === 'state' && selectedState === item) ||
                  (activePicker === 'badge' && selectedBadge === item);

                return (
                  <Pressable
                    key={item}
                    style={[
                      styles.modalOption,
                      isDarkMode && styles.modalOptionDark,
                      isSelected && (isDarkMode ? styles.modalOptionSelectedDark : styles.modalOptionSelected),
                    ]}
                    onPress={() => {
                      if (activePicker === 'category') setSelectedCategory(item);
                      if (activePicker === 'state') setSelectedState(item);
                      if (activePicker === 'badge') setSelectedBadge(item);
                      setActivePicker(null);
                    }}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        isDarkMode && styles.modalOptionTextDark,
                        isSelected && (isDarkMode ? styles.modalOptionTextSelectedDark : styles.modalOptionTextSelected),
                      ]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-sharp" size={ms(18)} color="#A78BFA" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  scrollFlex: {
    flex: 1,
  },

  /* ── Header Row ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    paddingTop: vs(4),
  },
  backBtn: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E8',
    borderRightWidth: 1,
    borderRightColor: '#EAE3D6',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD5C7',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTitleGroup: {
    flex: 1,
    marginLeft: s(12),
  },
  headerSubtitle: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#8E8E93',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: ms(19),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    marginTop: vs(1),
  },
  clearAllBtn: {
    paddingVertical: vs(6),
    paddingHorizontal: s(8),
  },
  clearAllText: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#D946EF',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#F0ECE6',
    width: '100%',
  },

  /* ── Scroll Content ── */
  scrollContent: {
    paddingTop: vs(16),
    paddingHorizontal: s(16),
    paddingBottom: vs(24),
  },
  sectionContainer: {
    marginBottom: vs(12),
  },
  sectionLabel: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#524B66',
    letterSpacing: 0.6,
    marginBottom: vs(8),
  },
  divider: {
    height: 1,
    backgroundColor: '#F0ECE6',
    marginVertical: vs(12),
  },
  bottomSpacer: {
    height: vs(16),
  },

  /* ── Dropdown Box (3D Card) ── */
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(15),
    paddingHorizontal: s(15),
    paddingVertical: vs(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E8',
    borderRightWidth: 1,
    borderRightColor: '#EAE3D6',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD5C7',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownValueText: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1D1238',
    flex: 1,
  },

  /* ── State & City Side by Side ── */
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -s(5),
  },
  colHalf: {
    flex: 1,
    marginHorizontal: s(5),
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(15),
    paddingHorizontal: s(14),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E8',
    borderRightWidth: 1,
    borderRightColor: '#EAE3D6',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD5C7',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    height: vs(46),
    justifyContent: 'center',
  },
  textInput: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1D1238',
    padding: 0,
  },

  /* ── Pool Checkbox ── */
  poolCheckboxWrap: {
    marginTop: vs(12),
  },

  /* ── Checkbox Row & Styles ── */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: vs(7),
  },
  checkboxSquare: {
    width: s(21),
    height: s(21),
    borderRadius: s(5.5),
    borderTopWidth: 1.2,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#CBD5E1',
    borderRightWidth: 1,
    borderRightColor: '#94A3B8',
    borderBottomWidth: 2,
    borderBottomColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(1),
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  checkboxSquareChecked: {
    backgroundColor: '#7C3AED',
    borderTopWidth: 1.2,
    borderTopColor: '#A78BFA',
    borderLeftWidth: 1,
    borderLeftColor: '#8B5CF6',
    borderRightWidth: 1,
    borderRightColor: '#6D28D9',
    borderBottomWidth: 2,
    borderBottomColor: '#5B21B6',
  },
  checkboxTextGroup: {
    marginLeft: s(10),
    flex: 1,
  },
  checkboxLabel: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#1D1238',
  },
  checkboxDesc: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(2),
    lineHeight: ms(16),
  },

  /* ── Pills Selector Row ── */
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -s(3),
  },
  pillContainer: {
    marginHorizontal: s(3),
    alignItems: 'stretch',
  },

  /* ── Pet Size & Rating Pills (3D Capsule with Ambient Background Glow) ── */
  pillPressableFlex: {
    width: '100%',
  },
  pillGradientActive: {
    width: '100%',
    height: s(39),
    borderRadius: s(19.5),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
    ...Platform.select({
      ios: {
        shadowColor: '#8233FE',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sizePillInactive: {
    width: '100%',
    height: s(39),
    borderRadius: s(19.5),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E8',
    borderRightWidth: 1,
    borderRightColor: '#EAE3D6',
    borderBottomWidth: 2.5,
    borderBottomColor: '#DDD5C7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingPillInactive: {
    width: '100%',
    height: s(39),
    borderRadius: s(19.5),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#F5F1E8',
    borderRightWidth: 1,
    borderRightColor: '#EAE3D6',
    borderBottomWidth: 2.5,
    borderBottomColor: '#DDD5C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(4),
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sizePillText: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  sizePillTextActive: {
    color: '#FFFFFF',
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  sizePillTextInactive: {
    color: '#1D1238',
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  ratingStarIcon: {
    marginRight: s(3),
  },
  ratingPillText: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  ratingPillTextActive: {
    color: '#FFFFFF',
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  ratingPillTextInactive: {
    color: '#1D1238',
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.semiBold,
  },

  /* ── Amenities 2-Column Grid ── */
  amenitiesGrid: {
    flexDirection: 'row',
  },
  amenitiesCol: {
    flex: 1,
  },

  /* ── Fixed Bottom Action Bar (Sits Cleanly at Bottom, No Unwanted Gap) ── */
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0ECE6',
    paddingHorizontal: s(20),
    paddingTop: vs(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1035',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomInfo: {
    flex: 1,
  },
  bottomPlacesCount: {
    fontSize: ms(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
    letterSpacing: -0.3,
  },
  bottomSubtext: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8E8E93',
    marginTop: vs(1),
  },

  /* ── Show Results Button (Clean 3D Tactile Design Matching Home Screen) ── */
  applyBtnOuter: {
    borderRadius: s(18),
    ...Platform.select({
      ios: {
        shadowColor: '#8233FE',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  applyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(22),
    height: vs(46),
    borderRadius: s(18),
  },
  applyBtnText: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  arrowIcon: {
    marginLeft: s(7),
  },

  /* ── Selection Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(20),
  },
  modalCard: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    padding: s(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  modalTitle: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1D1238',
  },
  modalList: {
    marginTop: vs(8),
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(13),
    paddingHorizontal: s(12),
    borderRadius: s(12),
    marginVertical: vs(2),
  },
  modalOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  modalOptionText: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#374151',
  },
  modalOptionTextSelected: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
  },

  /* ── Whole Screen Background Ambient Decorative Glows & Watermarks (matching Home screen) ── */
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

  /* ── Luxury Dark Mode Theme Overrides ── */
  containerDark: {
    backgroundColor: '#0F071D',
  },
  ambientGlowDark: {
    opacity: 0,
    backgroundColor: 'transparent',
  },
  backBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  headerSubtitleDark: {
    color: '#A78BFA',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  clearAllTextDark: {
    color: '#C4B5FD',
  },
  headerDividerDark: {
    backgroundColor: '#260F45',
  },
  sectionLabelDark: {
    color: '#A78BFA',
  },
  dropdownBoxDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  dropdownValueTextDark: {
    color: '#FFFFFF',
  },
  inputBoxDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  textInputDark: {
    color: '#FFFFFF',
  },
  dividerDark: {
    backgroundColor: '#260F45',
  },
  checkboxSquareDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  checkboxLabelDark: {
    color: '#FFFFFF',
  },
  checkboxDescDark: {
    color: '#94A3B8',
  },
  sizePillInactiveDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
  },
  sizePillTextInactiveDark: {
    color: '#CBD5E1',
  },
  ratingPillInactiveDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
  },
  ratingPillTextInactiveDark: {
    color: '#CBD5E1',
  },
  bottomBarDark: {
    backgroundColor: '#17092E',
    borderTopColor: '#260F45',
    shadowColor: '#000000',
  },
  bottomPlacesCountDark: {
    color: '#FFFFFF',
  },
  bottomSubtextDark: {
    color: '#94A3B8',
  },
  modalCardDark: {
    backgroundColor: '#17092E',
    borderWidth: 1,
    borderColor: '#2E1654',
    shadowColor: '#000000',
  },
  modalHeaderDark: {
    borderBottomColor: '#260F45',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalOptionDark: {
    backgroundColor: 'transparent',
  },
  modalOptionSelectedDark: {
    backgroundColor: '#261245',
  },
  modalOptionTextDark: {
    color: '#E2E8F0',
  },
  modalOptionTextSelectedDark: {
    color: '#C4B5FD',
  },
});

export default FilterScreen;
