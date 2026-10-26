import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { theme, colors } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { useStore } from '../../../store';

const DISTANCE_OPTIONS = [
  { value: '5 km', label: '5 km', desc: 'Walking neighborhood' },
  { value: '10 km', label: '10 km', desc: 'Recommended local radius' },
  { value: '25 km', label: '25 km', desc: 'Extended city-wide coverage' },
  { value: '50 km', label: '50 km', desc: 'Wider metropolitan area' },
];

const POST_TYPES = [
  {
    id: 'lost',
    label: 'Lost',
    desc: 'Pets reported missing',
    badgeBg: '#FFE4E6',
    badgeText: '#E11D48',
    icon: 'alert-circle',
  },
  {
    id: 'found',
    label: 'Found',
    desc: 'Sightings & rescued pets',
    badgeBg: '#F3E8FF',
    badgeText: '#7C3AED',
    icon: 'shield-checkmark',
  },
  {
    id: 'adoption',
    label: 'Adoption',
    desc: 'Pets seeking a home',
    badgeBg: '#DCFCE7',
    badgeText: '#059669',
    icon: 'heart',
  },
];

const SPECIES_OPTIONS = [
  { id: 'dog', label: 'Dog', emoji: '🐶' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
  { id: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { id: 'guinea_pig', label: 'Guinea pig', emoji: '🐹' },
  { id: 'hamster', label: 'Hamster', emoji: '🐭' },
  { id: 'bird', label: 'Bird', emoji: '🦜' },
];

export const PetAlertsModal = ({ visible, onClose, initialCity = '' }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);

  // Form states
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState(initialCity || 'Delhi NCR');
  const [stateName, setStateName] = useState('');
  const [distance, setDistance] = useState('10 km');
  const [isDistancePickerOpen, setIsDistancePickerOpen] = useState(false);

  // Checkbox states (matching website reference defaults)
  const [selectedPostTypes, setSelectedPostTypes] = useState(['lost', 'found']);
  const [selectedSpecies, setSelectedSpecies] = useState(['dog', 'cat']);
  const [reachEmail, setReachEmail] = useState(true);
  const [reachPush, setReachPush] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);

  // Focus state for interactive styling
  const [focusedInput, setFocusedInput] = useState('city');

  // Active saved alerts (up to 3 alerts)
  const [savedAlerts, setSavedAlerts] = useState([]);

  // Toggle helper for arrays
  const toggleItem = (currentList, setList, itemId) => {
    if (currentList.includes(itemId)) {
      if (currentList.length === 1) {
        Alert.alert('Required', 'Please keep at least one option selected.');
        return;
      }
      setList(currentList.filter(id => id !== itemId));
    } else {
      setList([...currentList, itemId]);
    }
  };

  const handleCreateAlert = () => {
    const trimmedLocality = locality.trim();
    const trimmedCity = city.trim();

    if (!trimmedLocality && !trimmedCity) {
      Alert.alert(
        'Location Required',
        'Please enter a locality or city so we know where to watch for pets.',
      );
      return;
    }

    if (selectedPostTypes.length === 0) {
      Alert.alert('Post Type Required', 'Please select at least one post type.');
      return;
    }

    if (selectedSpecies.length === 0) {
      Alert.alert('Species Required', 'Please select at least one species.');
      return;
    }

    if (!reachEmail && !reachPush) {
      Alert.alert(
        'Notification Channel',
        'Please select at least one notification method (Email or Push).',
      );
      return;
    }

    if (!consentAgreed) {
      Alert.alert(
        'Consent Required',
        'Please tick the consent checkbox below to activate Reunite alerts.',
      );
      return;
    }

    if (savedAlerts.length >= 3) {
      Alert.alert(
        'Alert Limit Reached',
        'You have used all 3 free alerts. Delete an active alert below to create a new one.',
      );
      return;
    }

    const newAlert = {
      id: Date.now().toString(),
      locality: trimmedLocality || trimmedCity,
      city: trimmedCity || trimmedLocality,
      state: stateName.trim(),
      distance,
      postTypes: [...selectedPostTypes],
      species: [...selectedSpecies],
      email: reachEmail,
      push: reachPush,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };

    setSavedAlerts(prev => [newAlert, ...prev]);

    // Reset locality & consent for next alert
    setLocality('');
    setConsentAgreed(false);

    Alert.alert(
      'Alert Created 🎉',
      `We'll notify you whenever matching pets appear near ${
        trimmedLocality ? `${trimmedLocality}, ` : ''
      }${trimmedCity || 'your area'}.`,
    );
  };

  const handleDeleteAlert = alertId => {
    Alert.alert('Remove Alert', 'Are you sure you want to stop receiving alerts for this area?', [
      { text: 'Keep Alert', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSavedAlerts(prev => prev.filter(a => a.id !== alertId));
        },
      },
    ]);
  };

  const usedCount = savedAlerts.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : 'transparent'}
        translucent
      />

      <View
        style={[
          styles.rootContainer,
          isDarkMode && styles.rootContainerDark,
          {
            paddingTop: insets.top || ms(12),
            paddingBottom: insets.bottom || 0,
          },
        ]}>
        {/* ── Background Ambient Luminous Glow Orbs (Signature 3D Theme) ── */}
        <View style={[styles.ambientTopRightGlow, isDarkMode && styles.ambientGlowDark]} pointerEvents="none" />
        <View style={[styles.ambientMidLeftGlow, isDarkMode && styles.ambientGlowDark]} pointerEvents="none" />
        <View style={styles.ambientWatermark} pointerEvents="none">
          <Ionicons
            name="paw"
            size={ms(180)}
            color={isDarkMode ? 'rgba(255, 255, 255, 0.03)' : colors.ambient.pawWatermarkPurple}
          />
        </View>

        {/* ── Top Luxury Sticky App Bar ── */}
        <View style={[styles.headerBar, isDarkMode && styles.headerBarDark]}>
          <BouncyPressable
            style={[styles.closeBtn, isDarkMode && styles.closeBtnDark]}
            activeScale={0.88}
            onPress={onClose}>
            <Feather name="x" size={ms(18)} color={isDarkMode ? '#FFFFFF' : colors.reunite.titleDark} />
          </BouncyPressable>

          <View style={styles.headerTitleBox}>
            <Text style={[styles.headerMainTitle, isDarkMode && styles.headerMainTitleDark]}>Pet alerts</Text>
            <Text style={[styles.headerSubBadge, isDarkMode && styles.headerSubBadgeDark]}>Neighborhood Radar</Text>
          </View>

          <View style={[styles.headerStatusPill, isDarkMode && styles.headerStatusPillDark]}>
            <View style={styles.pulsingDot} />
            <Text style={[styles.headerStatusText, isDarkMode && styles.headerStatusTextDark]}>
              {usedCount}/3 Active
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: (insets.bottom || ms(20)) + ms(32) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* ── Luxury Hero Feature Card ── */}
            <View style={styles.heroFeatureCard}>
              <LinearGradient
                colors={['#4C1D95', '#2E008B', '#1E005A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroFeatureGradient}>

                {/* Ambient Decorative Rings */}
                <View style={styles.heroDecorativeRing} />

                {/* Overline Badge Row */}
                <View style={styles.heroFeatureTopRow}>
                  <View style={styles.heroFeaturePill}>
                    <Ionicons name="sparkles" size={ms(12)} color="#FBBF24" />
                    <Text style={styles.heroFeaturePillText}>COMMUNITY SOS RADAR</Text>
                  </View>
                  <View style={styles.heroSlotsLeftBadge}>
                    <Text style={styles.heroSlotsLeftText}>
                      {3 - usedCount} slots left
                    </Text>
                  </View>
                </View>

                {/* Main Hero Title */}
                <Text style={styles.heroFeatureTitle}>
                  Never miss a missing pet nearby
                </Text>

                {/* Hero Subtitle */}
                <Text style={styles.heroFeatureSubtitle}>
                  Get real-time verified alerts when a checked lost or found pet post is reported in your area.
                </Text>

                {/* 3 Trust Chips */}
                <View style={styles.heroTrustRow}>
                  <View style={styles.heroTrustChip}>
                    <Feather name="check" size={ms(11)} color="#A7F3D0" />
                    <Text style={styles.heroTrustChipText}>Zero Spam</Text>
                  </View>
                  <View style={styles.heroTrustChip}>
                    <Feather name="check" size={ms(11)} color="#A7F3D0" />
                    <Text style={styles.heroTrustChipText}>Coordinates Private</Text>
                  </View>
                  <View style={styles.heroTrustChip}>
                    <Feather name="check" size={ms(11)} color="#A7F3D0" />
                    <Text style={styles.heroTrustChipText}>Real-time</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Instruction Row */}
            <View style={[styles.instructionBanner, isDarkMode && styles.instructionBannerDark]}>
              <Ionicons
                name="location-outline"
                size={ms(16)}
                color={isDarkMode ? '#C084FC' : colors.reunite.petAlertsDeepPurple}
              />
              <Text style={[styles.instructionBannerText, isDarkMode && styles.instructionBannerTextDark]}>
                Choose a neighbourhood below to get started
              </Text>
            </View>

            {/* ── Active Alerts Section (If User Has Alerts) ── */}
            {savedAlerts.length > 0 && (
              <View style={styles.activeAlertsSection}>
                <Text style={[styles.sectionHeading, isDarkMode && styles.sectionHeadingDark]}>Your Active Alerts</Text>
                {savedAlerts.map(item => (
                  <View key={item.id} style={[styles.activeAlertCard, isDarkMode && styles.activeAlertCardDark]}>
                    <View style={styles.activeAlertHeader}>
                      <View style={styles.activeAlertLocationRow}>
                        <View style={[styles.activePinSquircle, isDarkMode && styles.activePinSquircleDark]}>
                          <Ionicons
                            name="location-sharp"
                            size={ms(14)}
                            color={isDarkMode ? '#C084FC' : colors.reunite.petAlertsDeepPurple}
                          />
                        </View>
                        <View>
                          <Text style={[styles.activeAlertTitle, isDarkMode && styles.activeAlertTitleDark]}>
                            {item.locality}
                            {item.city && item.city !== item.locality ? `, ${item.city}` : ''}
                          </Text>
                          <Text style={[styles.activeAlertMeta, isDarkMode && styles.activeAlertMetaDark]}>
                            Within {item.distance} radius • Created {item.date}
                          </Text>
                        </View>
                      </View>
                      <BouncyPressable
                        style={styles.deleteAlertBtn}
                        activeScale={0.85}
                        onPress={() => handleDeleteAlert(item.id)}>
                        <Feather name="trash-2" size={ms(16)} color={colors.error} />
                      </BouncyPressable>
                    </View>

                    <View style={styles.alertTagsRow}>
                      {item.postTypes.map(t => (
                        <View key={t} style={[styles.alertTagPill, isDarkMode && styles.alertTagPillDark]}>
                          <Text style={[styles.alertTagText, isDarkMode && styles.alertTagTextDark]}>{t}</Text>
                        </View>
                      ))}
                      {item.species.map(spec => (
                        <View key={spec} style={[styles.alertTagPillSpecies, isDarkMode && styles.alertTagPillSpeciesDark]}>
                          <Text style={[styles.alertTagTextSpecies, isDarkMode && styles.alertTagTextSpeciesDark]}>{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Main Form 3D Luxury Card ── */}
            <View style={[styles.cardContainer, isDarkMode && styles.cardContainerDark]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardHeaderIconBox, isDarkMode && styles.cardHeaderIconBoxDark]}>
                  <Ionicons
                    name="sparkles"
                    size={ms(16)}
                    color={isDarkMode ? '#C084FC' : colors.reunite.petAlertsDeepPurple}
                  />
                </View>
                <View style={styles.cardHeaderCol}>
                  <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>Set up an alert</Text>
                  <Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
                    Use a locality, city and state we can locate. Exact coordinates stay private.
                  </Text>
                </View>
              </View>

              {/* Field: Locality */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                  Locality <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isDarkMode && styles.inputWrapperDark,
                    focusedInput === 'locality' && styles.inputWrapperFocused,
                  ]}>
                  <Ionicons
                    name="location-outline"
                    size={ms(18)}
                    color={
                      focusedInput === 'locality'
                        ? (isDarkMode ? '#C084FC' : colors.reunite.petAlertsInputFocusBorder)
                        : (isDarkMode ? '#94A3B8' : colors.reunite.textMuted)
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, isDarkMode && styles.textInputDark]}
                    value={locality}
                    onChangeText={setLocality}
                    placeholder="e.g. Indiranagar, Bandra West, CP"
                    placeholderTextColor={isDarkMode ? '#64748B' : colors.reunite.modalPlaceholder}
                    onFocus={() => setFocusedInput('locality')}
                    onBlur={() => setFocusedInput('')}
                  />
                  {locality.length > 0 && (
                    <BouncyPressable
                      activeScale={0.85}
                      onPress={() => setLocality('')}
                      style={styles.inputClearBtn}>
                      <Feather name="x" size={ms(13)} color={isDarkMode ? '#94A3B8' : colors.reunite.textMuted} />
                    </BouncyPressable>
                  )}
                </View>
              </View>

              {/* Field: City (Signature Purple Glow from Reference Mockup) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                  City <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isDarkMode && styles.inputWrapperDark,
                    focusedInput === 'city'
                      ? styles.inputWrapperFocusedPurple
                      : (isDarkMode ? styles.inputWrapperActiveBorderDark : styles.inputWrapperActiveBorder),
                  ]}>
                  <Ionicons
                    name="business-outline"
                    size={ms(18)}
                    color={isDarkMode ? '#C084FC' : colors.reunite.petAlertsInputFocusBorder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, isDarkMode && styles.textInputDark]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="e.g. Delhi NCR, Mumbai, Bangalore"
                    placeholderTextColor={isDarkMode ? '#64748B' : colors.reunite.modalPlaceholder}
                    onFocus={() => setFocusedInput('city')}
                    onBlur={() => setFocusedInput('')}
                  />
                  {city.length > 0 && (
                    <BouncyPressable
                      activeScale={0.85}
                      onPress={() => setCity('')}
                      style={styles.inputClearBtn}>
                      <Feather name="x" size={ms(13)} color={isDarkMode ? '#94A3B8' : colors.reunite.textMuted} />
                    </BouncyPressable>
                  )}
                </View>
              </View>

              {/* Field: State */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>State</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    isDarkMode && styles.inputWrapperDark,
                    focusedInput === 'state' && styles.inputWrapperFocused,
                  ]}>
                  <Ionicons
                    name="map-outline"
                    size={ms(18)}
                    color={
                      focusedInput === 'state'
                        ? (isDarkMode ? '#C084FC' : colors.reunite.petAlertsInputFocusBorder)
                        : (isDarkMode ? '#94A3B8' : colors.reunite.textMuted)
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.textInput, isDarkMode && styles.textInputDark]}
                    value={stateName}
                    onChangeText={setStateName}
                    placeholder="e.g. Delhi, Maharashtra, Karnataka"
                    placeholderTextColor={isDarkMode ? '#64748B' : colors.reunite.modalPlaceholder}
                    onFocus={() => setFocusedInput('state')}
                    onBlur={() => setFocusedInput('')}
                  />
                  {stateName.length > 0 && (
                    <BouncyPressable
                      activeScale={0.85}
                      onPress={() => setStateName('')}
                      style={styles.inputClearBtn}>
                      <Feather name="x" size={ms(13)} color={isDarkMode ? '#94A3B8' : colors.reunite.textMuted} />
                    </BouncyPressable>
                  )}
                </View>
              </View>

              {/* Field: Distance (Luxury Dropdown matching website mockup) */}
              <View style={styles.inputGroup}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>Distance</Text>
                <BouncyPressable
                  style={[
                    styles.distanceDropdownBtn,
                    isDarkMode && styles.distanceDropdownBtnDark,
                    isDistancePickerOpen && styles.distanceDropdownBtnActive,
                  ]}
                  activeScale={0.98}
                  onPress={() => setIsDistancePickerOpen(!isDistancePickerOpen)}>
                  <View style={styles.distanceSelectedRow}>
                    <Ionicons
                      name="radio-outline"
                      size={ms(18)}
                      color={
                        isDistancePickerOpen
                          ? (isDarkMode ? '#C084FC' : colors.reunite.petAlertsInputFocusBorder)
                          : (isDarkMode ? '#A78BFA' : colors.reunite.petAlertsDeepPurple)
                      }
                      style={styles.inputIcon}
                    />
                    <Text style={[styles.distanceSelectedText, isDarkMode && styles.distanceSelectedTextDark]}>{distance}</Text>
                    <View style={[styles.distanceBadgePill, isDarkMode && styles.distanceBadgePillDark]}>
                      <Text style={[styles.distanceBadgePillText, isDarkMode && styles.distanceBadgePillTextDark]}>
                        {distance === '5 km'
                          ? 'Walking'
                          : distance === '10 km'
                          ? 'Recommended'
                          : distance === '25 km'
                          ? 'City-wide'
                          : 'Metro'}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={isDistancePickerOpen ? 'chevron-up' : 'chevron-down'}
                    size={ms(18)}
                    color={isDarkMode ? '#FFFFFF' : colors.reunite.titleDark}
                  />
                </BouncyPressable>

                {/* Animated Dropdown Menu */}
                {isDistancePickerOpen && (
                  <View style={[styles.distanceMenuContainer, isDarkMode && styles.distanceMenuContainerDark]}>
                    {DISTANCE_OPTIONS.map((opt, idx) => {
                      const isSelected = distance === opt.value;
                      const isLast = idx === DISTANCE_OPTIONS.length - 1;
                      return (
                        <BouncyPressable
                          key={opt.value}
                          style={[
                            styles.distanceMenuItem,
                            isDarkMode && styles.distanceMenuItemDark,
                            isSelected && (isDarkMode ? styles.distanceMenuItemActiveDark : styles.distanceMenuItemActive),
                            isLast && styles.distanceMenuItemLast,
                          ]}
                          activeScale={0.97}
                          onPress={() => {
                            setDistance(opt.value);
                            setIsDistancePickerOpen(false);
                          }}>
                          <View style={styles.distanceMenuItemLeft}>
                            <View
                              style={[
                                styles.distanceRadioRing,
                                isDarkMode && styles.distanceRadioRingDark,
                                isSelected && styles.distanceRadioRingActive,
                              ]}>
                              {isSelected && <View style={styles.distanceRadioDot} />}
                            </View>
                            <View>
                              <Text
                                style={[
                                  styles.distanceMenuTitle,
                                  isDarkMode && styles.distanceMenuTitleDark,
                                  isSelected && styles.distanceMenuTitleActive,
                                ]}>
                                {opt.label}
                              </Text>
                              <Text style={[styles.distanceMenuDesc, isDarkMode && styles.distanceMenuDescDark]}>{opt.desc}</Text>
                            </View>
                          </View>

                          {isSelected && (
                            <View style={styles.distanceCheckSquircle}>
                              <Feather
                                name="check"
                                size={ms(13)}
                                color={colors.surface}
                              />
                            </View>
                          )}
                        </BouncyPressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={[styles.dividerLine, isDarkMode && styles.dividerLineDark]} />

              {/* Section: Post types (Interactive Luxury Cards) */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                  Post types <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View style={styles.postTypesContainer}>
                  {POST_TYPES.map(item => {
                    const isChecked = selectedPostTypes.includes(item.id);
                    return (
                      <BouncyPressable
                        key={item.id}
                        style={[
                          styles.postTypeCard,
                          isDarkMode && styles.postTypeCardDark,
                          isChecked && (isDarkMode ? styles.postTypeCardActiveDark : styles.postTypeCardActive),
                        ]}
                        activeScale={0.96}
                        onPress={() =>
                          toggleItem(selectedPostTypes, setSelectedPostTypes, item.id)
                        }>
                        <View style={styles.postTypeLeftRow}>
                          <View
                            style={[
                              styles.checkboxSquircle,
                              isDarkMode && styles.checkboxSquircleDark,
                              isChecked && styles.checkboxSquircleChecked,
                            ]}>
                            {isChecked && (
                              <Feather name="check" size={ms(12)} color={colors.surface} />
                            )}
                          </View>
                          <View>
                            <Text style={[styles.postTypeTitle, isDarkMode && styles.postTypeTitleDark]}>{item.label}</Text>
                            <Text style={[styles.postTypeDesc, isDarkMode && styles.postTypeDescDark]}>{item.desc}</Text>
                          </View>
                        </View>
                        <View style={[styles.postTypeBadge, { backgroundColor: item.badgeBg }]}>
                          <Text style={[styles.postTypeBadgeText, { color: item.badgeText }]}>
                            {item.label}
                          </Text>
                        </View>
                      </BouncyPressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.dividerLine, isDarkMode && styles.dividerLineDark]} />

              {/* Section: Species (Sleek Pet Emoji Avatar Chips) */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>
                  Species <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View style={styles.speciesGrid}>
                  {SPECIES_OPTIONS.map(item => {
                    const isChecked = selectedSpecies.includes(item.id);
                    return (
                      <BouncyPressable
                        key={item.id}
                        style={[
                          styles.speciesChip,
                          isDarkMode && styles.speciesChipDark,
                          isChecked && (isDarkMode ? styles.speciesChipActiveDark : styles.speciesChipActive),
                        ]}
                        activeScale={0.94}
                        onPress={() => toggleItem(selectedSpecies, setSelectedSpecies, item.id)}>
                        <Text style={styles.speciesEmoji}>{item.emoji}</Text>
                        <Text
                          style={[
                            styles.speciesLabel,
                            isDarkMode && styles.speciesLabelDark,
                            isChecked && styles.speciesLabelActive,
                          ]}>
                          {item.label}
                        </Text>
                        <View
                          style={[
                            styles.speciesMiniCheck,
                            isChecked && styles.speciesMiniCheckActive,
                          ]}>
                          {isChecked && (
                            <Feather name="check" size={ms(9)} color={colors.surface} />
                          )}
                        </View>
                      </BouncyPressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.dividerLine, isDarkMode && styles.dividerLineDark]} />

              {/* Section: How should we reach you? */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>How should we reach you?</Text>

                {/* Email Alert Card */}
                <BouncyPressable
                  style={[
                    styles.reachCard,
                    isDarkMode && styles.reachCardDark,
                    reachEmail && (isDarkMode ? styles.reachCardActiveDark : styles.reachCardActive),
                  ]}
                  activeScale={0.96}
                  onPress={() => setReachEmail(!reachEmail)}>
                  <View
                    style={[
                      styles.checkboxSquircle,
                      isDarkMode && styles.checkboxSquircleDark,
                      reachEmail && styles.checkboxSquircleChecked,
                    ]}>
                    {reachEmail && <Feather name="check" size={ms(12)} color={colors.surface} />}
                  </View>
                  <View style={styles.reachInfoCol}>
                    <View style={styles.reachTitleRow}>
                      <Ionicons
                        name="mail"
                        size={ms(15)}
                        color={isDarkMode ? '#C084FC' : colors.reunite.petAlertsDeepPurple}
                        style={styles.reachIcon}
                      />
                      <Text style={[styles.reachTitle, isDarkMode && styles.reachTitleDark]}>Email alerts</Text>
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedBadgeText}>Included</Text>
                      </View>
                    </View>
                    <Text style={[styles.reachSub, isDarkMode && styles.reachSubDark]}>
                      Receive immediate incident reports in your inbox.
                    </Text>
                  </View>
                </BouncyPressable>

                {/* Push Notifications Card */}
                <BouncyPressable
                  style={[
                    styles.reachCard,
                    isDarkMode && styles.reachCardDark,
                    reachPush && (isDarkMode ? styles.reachCardActiveDark : styles.reachCardActive),
                  ]}
                  activeScale={0.96}
                  onPress={() => setReachPush(!reachPush)}>
                  <View
                    style={[
                      styles.checkboxSquircle,
                      isDarkMode && styles.checkboxSquircleDark,
                      reachPush && styles.checkboxSquircleChecked,
                    ]}>
                    {reachPush && <Feather name="check" size={ms(12)} color={colors.surface} />}
                  </View>
                  <View style={styles.reachInfoCol}>
                    <View style={styles.reachTitleRow}>
                      <Ionicons
                        name="notifications"
                        size={ms(15)}
                        color={colors.primary}
                        style={styles.reachIcon}
                      />
                      <Text style={[styles.reachTitle, isDarkMode && styles.reachTitleDark]}>Push notifications</Text>
                      <Text style={[styles.optionalTag, isDarkMode && styles.optionalTagDark]}>(optional)</Text>
                    </View>
                    <Text style={[styles.reachSub, isDarkMode && styles.reachSubDark]}>
                      Urgent lock-screen popups when a pet is spotted nearby.
                    </Text>
                  </View>
                </BouncyPressable>

                {/* Helper notice banner */}
                <View style={[styles.permissionNoticeBox, isDarkMode && styles.permissionNoticeBoxDark]}>
                  <Ionicons
                    name="shield-checkmark"
                    size={ms(14)}
                    color={isDarkMode ? '#A78BFA' : colors.reunite.textMuted}
                  />
                  <Text style={[styles.helperNotice, isDarkMode && styles.helperNoticeDark]}>
                    Permission is requested only if you tick push notifications. Turning this off
                    will not affect chat notifications.
                  </Text>
                </View>
              </View>

              {/* Consent Checkbox */}
              <BouncyPressable
                style={[
                  styles.consentCard,
                  isDarkMode && styles.consentCardDark,
                  consentAgreed && (isDarkMode ? styles.consentCardActiveDark : styles.consentCardActive),
                ]}
                activeScale={0.97}
                onPress={() => setConsentAgreed(!consentAgreed)}>
                <View
                  style={[
                    styles.checkboxSquircle,
                    isDarkMode && styles.checkboxSquircleDark,
                    consentAgreed && styles.checkboxSquircleChecked,
                  ]}>
                  {consentAgreed && <Feather name="check" size={ms(12)} color={colors.surface} />}
                </View>
                <Text style={[styles.consentLabel, isDarkMode && styles.consentLabelDark]}>
                  Send me Reunite alerts for pets near this location. I can unsubscribe anytime.
                </Text>
              </BouncyPressable>

              {/* Action Button: Create Alert */}
              <BouncyPressable
                style={styles.createAlertBtn}
                activeScale={0.94}
                onPress={handleCreateAlert}>
                <LinearGradient
                  colors={['#4C1D95', '#2E008B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createAlertGradient}>
                  <Ionicons
                    name="notifications"
                    size={ms(17)}
                    color={colors.surface}
                    style={styles.createBtnIcon}
                  />
                  <Text style={styles.createAlertBtnText}>Create alert</Text>
                  <Feather
                    name="arrow-right"
                    size={ms(16)}
                    color={colors.surface}
                    style={styles.createBtnArrow}
                  />
                </LinearGradient>
              </BouncyPressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },

  /* ── Background Ambient Luminous Glow Orbs ── */
  ambientTopRightGlow: {
    position: 'absolute',
    top: -s(60),
    right: -s(60),
    width: s(260),
    height: s(260),
    borderRadius: s(130),
    backgroundColor: colors.ambient.glowPurple,
    opacity: 0.65,
  },
  ambientMidLeftGlow: {
    position: 'absolute',
    top: s(360),
    left: -s(80),
    width: s(240),
    height: s(240),
    borderRadius: s(120),
    backgroundColor: colors.ambient.glowPeach,
    opacity: 0.55,
  },
  ambientWatermark: {
    position: 'absolute',
    right: -s(30),
    top: s(160),
    opacity: 0.8,
  },

  /* ── Top Luxury Sticky App Bar ── */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingTop: ms(6),
    paddingBottom: ms(10),
    backgroundColor: colors.background,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDE7DC',
    zIndex: 10,
  },
  closeBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(13),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomColor: colors.card3D.borderBottom,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerMainTitle: {
    fontSize: ms(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
    letterSpacing: -0.3,
  },
  headerSubBadge: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.textMuted,
    marginTop: ms(1),
  },
  headerStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: s(10),
    paddingVertical: ms(6),
    borderRadius: ms(20),
    borderWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomColor: colors.card3D.borderBottom,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pulsingDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(3.5),
    backgroundColor: colors.primary,
    marginRight: s(6),
  },
  headerStatusText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
  },

  /* ── Keyboard & Scroll ── */
  keyboardContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: ms(14),
  },

  /* ── Luxury Hero Feature Card ── */
  heroFeatureCard: {
    borderRadius: ms(22),
    overflow: 'hidden',
    marginBottom: ms(14),
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderLeftColor: 'rgba(255, 255, 255, 0.20)',
    borderRightColor: 'rgba(255, 255, 255, 0.20)',
    borderBottomColor: '#240066',
    shadowColor: '#2E008B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  heroFeatureGradient: {
    padding: s(18),
    position: 'relative',
  },
  heroDecorativeRing: {
    position: 'absolute',
    right: -s(25),
    top: -s(25),
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    borderWidth: ms(16),
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroFeatureTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ms(12),
  },
  heroFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: s(8),
    paddingVertical: ms(4),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroFeaturePillText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
    marginLeft: s(5),
  },
  heroSlotsLeftBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.20)',
    paddingHorizontal: s(8),
    paddingVertical: ms(3),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  heroSlotsLeftText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
  },
  heroFeatureTitle: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    lineHeight: ms(26),
    letterSpacing: -0.4,
    marginBottom: ms(6),
  },
  heroFeatureSubtitle: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.86)',
    lineHeight: ms(18),
    marginBottom: ms(14),
  },
  heroTrustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
  },
  heroTrustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: s(8),
    paddingVertical: ms(4),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroTrustChipText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#FFFFFF',
    marginLeft: s(4),
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 0, 139, 0.05)',
    paddingHorizontal: s(14),
    paddingVertical: ms(10),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: 'rgba(46, 0, 139, 0.12)',
    marginBottom: ms(14),
  },
  instructionBannerText: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: colors.reunite.petAlertsDeepPurple,
    marginLeft: s(8),
  },

  /* ── Active Alerts ── */
  activeAlertsSection: {
    marginBottom: ms(18),
  },
  sectionHeading: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
    marginBottom: ms(8),
  },
  activeAlertCard: {
    backgroundColor: colors.surface,
    borderRadius: ms(16),
    padding: s(14),
    marginBottom: ms(10),
    borderWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomColor: colors.card3D.borderBottom,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  activeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(10),
  },
  activeAlertLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: s(8),
  },
  activePinSquircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(10),
    backgroundColor: colors.reunite.foundBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  activeAlertTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
  },
  activeAlertMeta: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    marginTop: ms(2),
  },
  deleteAlertBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
  },
  alertTagPill: {
    backgroundColor: colors.reunite.foundBg,
    paddingHorizontal: s(8),
    paddingVertical: ms(4),
    borderRadius: ms(8),
  },
  alertTagText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.foundTitle,
    textTransform: 'capitalize',
  },
  alertTagPillSpecies: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: s(8),
    paddingVertical: ms(4),
    borderRadius: ms(8),
  },
  alertTagTextSpecies: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.titleDark,
    textTransform: 'capitalize',
  },

  /* ── Main Form 3D Luxury Card ── */
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: ms(24),
    padding: s(18),
    borderWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomColor: colors.card3D.borderBottom,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: ms(20),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ms(18),
  },
  cardHeaderIconBox: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(12),
    backgroundColor: colors.reunite.foundBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    marginTop: ms(2),
    borderWidth: 1,
    borderColor: colors.reunite.foundBorder,
  },
  cardHeaderCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: ms(17),
    color: colors.reunite.petAlertsHelper,
    marginTop: ms(4),
  },

  /* ── Form Inputs ── */
  inputGroup: {
    marginBottom: ms(16),
  },
  fieldLabel: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsLabel,
    marginBottom: ms(6),
  },
  fieldRequired: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ms(48),
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: colors.reunite.petAlertsInputBorder,
    backgroundColor: '#FAF9F7',
    paddingHorizontal: s(12),
  },
  inputWrapperFocused: {
    borderColor: colors.reunite.petAlertsInputFocusBorder,
    backgroundColor: colors.surface,
  },
  inputWrapperActiveBorder: {
    borderColor: '#C4B5FD',
    backgroundColor: colors.surface,
  },
  inputWrapperFocusedPurple: {
    borderColor: colors.reunite.petAlertsInputFocusBorder,
    borderWidth: 2,
    backgroundColor: colors.reunite.petAlertsInputFocusBg,
  },
  inputIcon: {
    marginRight: s(8),
  },
  textInput: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.titleDark,
    paddingVertical: 0,
  },
  inputClearBtn: {
    padding: ms(4),
  },

  /* ── Distance Luxury Dropdown ── */
  distanceDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ms(48),
    borderRadius: ms(14),
    borderWidth: 1.5,
    borderColor: colors.reunite.petAlertsInputBorder,
    backgroundColor: '#FAF9F7',
    paddingHorizontal: s(12),
  },
  distanceDropdownBtnActive: {
    borderColor: colors.reunite.petAlertsInputFocusBorder,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  distanceSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distanceSelectedText: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
    marginRight: s(8),
  },
  distanceBadgePill: {
    backgroundColor: colors.reunite.foundBg,
    paddingHorizontal: s(8),
    paddingVertical: ms(3),
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: colors.reunite.foundBorder,
  },
  distanceBadgePillText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
  },
  distanceMenuContainer: {
    marginTop: ms(8),
    backgroundColor: colors.surface,
    borderRadius: ms(16),
    borderWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomColor: colors.card3D.borderBottom,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  distanceMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(12),
    paddingHorizontal: s(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  distanceMenuItemActive: {
    backgroundColor: colors.reunite.petAlertsInputFocusBg,
  },
  distanceMenuItemLast: {
    borderBottomWidth: 0,
  },
  distanceMenuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  distanceRadioRing: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 1.8,
    borderColor: colors.reunite.petAlertsCheckboxBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
    backgroundColor: colors.surface,
  },
  distanceRadioRingActive: {
    borderColor: colors.reunite.petAlertsDeepPurple,
  },
  distanceRadioDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: colors.reunite.petAlertsDeepPurple,
  },
  distanceMenuTitle: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
  },
  distanceMenuTitleActive: {
    color: colors.reunite.petAlertsDeepPurple,
  },
  distanceMenuDesc: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    marginTop: ms(1),
  },
  distanceCheckSquircle: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(8),
    backgroundColor: colors.reunite.petAlertsDeepPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dividerLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: ms(16),
  },

  /* ── Post Types ── */
  sectionBlock: {
    marginBottom: ms(4),
  },
  postTypesContainer: {
    gap: ms(8),
  },
  postTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F7',
    borderRadius: ms(14),
    paddingVertical: ms(10),
    paddingHorizontal: s(12),
    borderWidth: 1.5,
    borderColor: '#ECE7DD',
  },
  postTypeCardActive: {
    backgroundColor: colors.surface,
    borderColor: colors.reunite.petAlertsInputFocusBorder,
    borderWidth: 1.8,
  },
  postTypeLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxSquircle: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(6),
    borderWidth: 1.8,
    borderColor: colors.reunite.petAlertsCheckboxBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  checkboxSquircleChecked: {
    backgroundColor: colors.reunite.petAlertsDeepPurple,
    borderColor: colors.reunite.petAlertsDeepPurple,
  },
  postTypeTitle: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
  },
  postTypeDesc: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    marginTop: ms(1),
  },
  postTypeBadge: {
    paddingHorizontal: s(8),
    paddingVertical: ms(4),
    borderRadius: ms(6),
  },
  postTypeBadgeText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── Species Chips ── */
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F7',
    borderRadius: ms(12),
    paddingVertical: ms(8),
    paddingHorizontal: s(11),
    borderWidth: 1.5,
    borderColor: '#ECE7DD',
  },
  speciesChipActive: {
    backgroundColor: colors.reunite.foundBg,
    borderColor: colors.reunite.foundBorder,
  },
  speciesEmoji: {
    fontSize: ms(15),
    marginRight: s(6),
  },
  speciesLabel: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.titleDark,
    marginRight: s(6),
  },
  speciesLabelActive: {
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
  },
  speciesMiniCheck: {
    width: ms(15),
    height: ms(15),
    borderRadius: ms(7.5),
    borderWidth: 1,
    borderColor: colors.reunite.petAlertsCheckboxBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speciesMiniCheckActive: {
    backgroundColor: colors.reunite.petAlertsDeepPurple,
    borderColor: colors.reunite.petAlertsDeepPurple,
  },

  /* ── Notification Channels ── */
  reachCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FAF9F7',
    borderRadius: ms(14),
    padding: s(12),
    borderWidth: 1.5,
    borderColor: '#ECE7DD',
    marginBottom: ms(8),
  },
  reachCardActive: {
    backgroundColor: colors.surface,
    borderColor: colors.reunite.petAlertsInputFocusBorder,
    borderWidth: 1.8,
  },
  reachInfoCol: {
    flex: 1,
  },
  reachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ms(2),
  },
  reachIcon: {
    marginRight: s(6),
  },
  reachTitle: {
    fontSize: ms(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
  },
  optionalTag: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    marginLeft: s(4),
  },
  recommendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: s(6),
    paddingVertical: ms(2),
    borderRadius: ms(6),
    marginLeft: s(8),
  },
  recommendedBadgeText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },
  reachSub: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: ms(16),
    color: colors.reunite.textMuted,
  },
  permissionNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.025)',
    borderRadius: ms(10),
    padding: s(10),
    marginTop: ms(4),
  },
  helperNotice: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: ms(15),
    color: colors.reunite.textMuted,
    marginLeft: s(6),
    flex: 1,
  },

  /* ── Consent Card ── */
  consentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFDF9',
    borderRadius: ms(14),
    padding: s(12),
    borderWidth: 1.5,
    borderColor: '#F2EDE2',
    marginVertical: ms(14),
  },
  consentCardActive: {
    backgroundColor: colors.surface,
    borderColor: colors.reunite.petAlertsDeepPurple,
  },
  consentLabel: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: ms(17),
    color: colors.reunite.titleDark,
    flex: 1,
  },

  /* ── Action Button ── */
  createAlertBtn: {
    borderRadius: ms(26),
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: colors.reunite.petAlertsBtnBevelBottom,
    shadowColor: colors.reunite.petAlertsDeepPurple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    marginTop: ms(6),
  },
  createAlertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ms(14),
    paddingHorizontal: s(24),
  },
  createBtnIcon: {
    marginRight: s(8),
  },
  createAlertBtnText: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.surface,
    letterSpacing: 0.2,
  },
  createBtnArrow: {
    marginLeft: s(8),
  },

  /* ── Luxury Dark Mode Theme Overrides ── */
  rootContainerDark: {
    backgroundColor: '#0F071D',
  },
  ambientGlowDark: {
    opacity: 0,
  },
  headerBarDark: {
    backgroundColor: '#0F071D',
    borderBottomColor: '#260F45',
  },
  closeBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  headerMainTitleDark: {
    color: '#FFFFFF',
  },
  headerSubBadgeDark: {
    color: '#A78BFA',
  },
  headerStatusPillDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  headerStatusTextDark: {
    color: '#C084FC',
  },
  instructionBannerDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  instructionBannerTextDark: {
    color: '#C4B5FD',
  },
  sectionHeadingDark: {
    color: '#FFFFFF',
  },
  activeAlertCardDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  activePinSquircleDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  activeAlertTitleDark: {
    color: '#FFFFFF',
  },
  activeAlertMetaDark: {
    color: '#94A3B8',
  },
  alertTagPillDark: {
    backgroundColor: '#261047',
  },
  alertTagTextDark: {
    color: '#C084FC',
  },
  alertTagPillSpeciesDark: {
    backgroundColor: '#1E0E38',
  },
  alertTagTextSpeciesDark: {
    color: '#E2E8F0',
  },
  cardContainerDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#3B1D6E',
    borderLeftColor: '#2E1654',
    borderRightColor: '#2E1654',
    borderBottomColor: '#120524',
    shadowColor: '#000000',
  },
  cardHeaderIconBoxDark: {
    backgroundColor: '#261047',
    borderColor: '#3B1D6E',
  },
  cardTitleDark: {
    color: '#FFFFFF',
  },
  cardSubtitleDark: {
    color: '#C4B5FD',
  },
  fieldLabelDark: {
    color: '#E2E8F0',
  },
  inputWrapperDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  inputWrapperActiveBorderDark: {
    borderColor: '#7C3AED',
  },
  textInputDark: {
    color: '#FFFFFF',
  },
  distanceDropdownBtnDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  distanceSelectedTextDark: {
    color: '#FFFFFF',
  },
  distanceBadgePillDark: {
    backgroundColor: '#261047',
    borderColor: '#3B1D6E',
  },
  distanceBadgePillTextDark: {
    color: '#C084FC',
  },
  distanceMenuContainerDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  distanceMenuItemDark: {
    borderBottomColor: '#260F45',
  },
  distanceMenuItemActiveDark: {
    backgroundColor: '#261047',
  },
  distanceRadioRingDark: {
    borderColor: '#94A3B8',
  },
  distanceMenuTitleDark: {
    color: '#FFFFFF',
  },
  distanceMenuDescDark: {
    color: '#94A3B8',
  },
  dividerLineDark: {
    backgroundColor: '#260F45',
  },
  postTypeCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  postTypeCardActiveDark: {
    backgroundColor: '#261047',
    borderColor: '#7C3AED',
  },
  checkboxSquircleDark: {
    backgroundColor: '#261047',
    borderColor: '#3B1D6E',
  },
  postTypeTitleDark: {
    color: '#FFFFFF',
  },
  postTypeDescDark: {
    color: '#C4B5FD',
  },
  speciesChipDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  speciesChipActiveDark: {
    backgroundColor: '#261047',
    borderColor: '#7C3AED',
  },
  speciesLabelDark: {
    color: '#E2E8F0',
  },
  reachCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  reachCardActiveDark: {
    backgroundColor: '#261047',
    borderColor: '#7C3AED',
  },
  reachTitleDark: {
    color: '#FFFFFF',
  },
  optionalTagDark: {
    color: '#94A3B8',
  },
  reachSubDark: {
    color: '#C4B5FD',
  },
  permissionNoticeBoxDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#260F45',
  },
  helperNoticeDark: {
    color: '#94A3B8',
  },
  consentCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  consentCardActiveDark: {
    backgroundColor: '#261047',
    borderColor: '#7C3AED',
  },
  consentLabelDark: {
    color: '#E2E8F0',
  },
});
