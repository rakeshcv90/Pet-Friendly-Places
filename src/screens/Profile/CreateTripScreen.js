import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  Keyboard,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { ModernConfirmModal } from './components/ModernConfirmModal';
import { Loader } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from '../Home/components';
import { api, getErrorMessage } from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../services/api/apiList';

const SectionCard = ({ icon, title, hint, step, done, isDarkMode, children }) => (
  <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
    <View style={styles.sectionHeader}>
      <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={ms(15)} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.sectionHeaderText}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>{title}</Text>
        {!!hint && (
          <Text style={[styles.sectionHint, isDarkMode && styles.pageSubtitleDark]}>{hint}</Text>
        )}
      </View>
      {done ? (
        <View style={styles.sectionDoneBadge}>
          <Feather name="check" size={ms(12)} color="#FFFFFF" />
        </View>
      ) : (
        <Text style={styles.sectionStep}>{step}</Text>
      )}
    </View>
    {children}
  </View>
);

export const CreateTripScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const storePets = useStore(state => state.pets);
  const storeUser = useStore(state => state.user);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedPetIds, setSelectedPetIds] = useState([]);
  const [placeQuery, setPlaceQuery] = useState('');
  // Selected stops: { listingId, name, city, state, stopNote }
  const [stops, setStops] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Focus states for input 3D highlight
  const [focusedField, setFocusedField] = useState(null);
  const focusedFieldRef = useRef(null);

  // Scroll View Ref for smooth scrolling
  const scrollViewRef = useRef(null);
  // Drives the background glows, as on the Home screen
  const scrollY = useRef(new Animated.Value(0)).current;

  // Date Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Validation & Loading
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Search listings once at least two characters are typed (debounced)
  useEffect(() => {
    const q = placeQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return undefined;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(API_ENDPOINTS.LISTINGS.SEARCH, {
          params: { q, limit: 8 },
        });
        if (!cancelled) {
          setSuggestions(Array.isArray(data?.listings) ? data.listings : []);
        }
      } catch (e) {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placeQuery]);

  // Use only API values; placeholders such as REPLACE_ME become ''
  const cleanText = (...values) => {
    const found = values.find(
      v =>
        typeof v === 'string' &&
        v.trim() !== '' &&
        v !== 'undefined' &&
        v !== 'null' &&
        !v.includes('REPLACE_ME'),
    );
    return found ? found.trim() : '';
  };

  const sanitizePet = (pet, index) => {
    if (!pet) return null;
    return {
      ...pet,
      id: pet.id || pet._id || `pet-${index + 1}`,
      name: cleanText(pet.petName, pet.name, pet.pet_name),
      breed: cleanText(pet.breed, pet.pet_breed, pet.breed_name),
      type: cleanText(pet.species, pet.type, pet.pet_type),
    };
  };

  // Resolve user pets
  const availablePets = useMemo(() => {
    let raw = [];
    if (storePets && storePets.length > 0) raw = storePets;
    else if (storeUser?.pets && storeUser.pets.length > 0) raw = storeUser.pets;
    return raw.map((p, i) => sanitizePet(p, i)).filter(Boolean);
  }, [storePets, storeUser]);

  const handleSelectPet = petId => {
    setSelectedPetIds(prev =>
      prev.includes(petId) ? prev.filter(id => id !== petId) : [...prev, petId],
    );

    if (errors.pets) {
      setErrors(prev => ({ ...prev, pets: null }));
    }
  };

  // ── Input Focus Helpers ──
  const handleInputFocus = fieldKey => {
    setFocusedField(fieldKey);
    focusedFieldRef.current = fieldKey;
  };

  const handleInputBlur = () => {
    setFocusedField(null);
    focusedFieldRef.current = null;
  };

  // ── Native Date Picker Helpers ──
  const parseDateString = str => {
    if (!str || typeof str !== 'string' || !str.includes('/')) return null;
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d);
      }
    }
    return null;
  };

  const formatDateToString = dateObj => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return '';
    }
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const openDatePickerModal = () => {
    Keyboard.dismiss();
    setFocusedField(null);
    focusedFieldRef.current = null;

    const initialDate = parseDateString(date) || new Date();
    setPickerDate(initialDate);

    // On Android: Launch native Android Material DatePickerDialog
    if (
      Platform.OS === 'android' &&
      DateTimePickerAndroid &&
      typeof DateTimePickerAndroid.open === 'function'
    ) {
      try {
        DateTimePickerAndroid.open({
          value: initialDate,
          mode: 'date',
          is24Hour: false,
          onChange: (event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              const formatted = formatDateToString(selectedDate);
              setDate(formatted);
              if (errors.date) {
                setErrors(prev => ({ ...prev, date: null }));
              }
            }
          },
        });
        return;
      } catch (e) {
        // Fallback to component modal below
      }
    }

    // On iOS or fallback: open modal sheet
    setShowDatePicker(true);
  };

  const selectPlace = listing => {
    setStops(current =>
      current.some(stop => stop.listingId === listing.id)
        ? current
        : [
            ...current,
            {
              listingId: listing.id, // numeric ID from the search result
              name: listing.name,
              city: listing.city,
              state: listing.state,
              stopNote: '',
            },
          ],
    );
    setPlaceQuery('');
    setSuggestions([]);
  };

  const handleRemovePlace = indexToRemove => {
    setStops(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // dd/mm/yyyy (display) -> YYYY-MM-DD (API)
  const toApiDate = value => {
    const parsed = parseDateString(value) || new Date();
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isFormValid =
    title.trim().length > 0 && (availablePets.length === 0 || selectedPetIds.length > 0);

  const progressSteps = [
    title.trim().length > 0,
    availablePets.length === 0 || selectedPetIds.length > 0,
    stops.length > 0,
  ];
  const progressDone = progressSteps.filter(Boolean).length;

  const handleSaveTrip = async () => {
    const validationErrors = {};

    if (!title.trim()) {
      validationErrors.title = 'Please enter a trip title.';
    }

    if (availablePets.length > 0 && selectedPetIds.length === 0) {
      validationErrors.pets = 'Please select at least one pet on this trip.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: title.trim(),
        tripDate: toApiDate(date.trim()),
        petIds: selectedPetIds,
        stops: stops.map(stop => ({
          listingId: stop.listingId,
          ...(stop.stopNote ? { stopNote: stop.stopNote } : {}),
        })),
      };
      if (description.trim()) {
        payload.subtitle = description.trim();
      }
      if (destination.trim()) {
        payload.destination = destination.trim();
      }

      console.log('Create trip payload:', JSON.stringify(payload, null, 2));
      const response = await api.post(API_ENDPOINTS.TRIPS, payload);
      console.log('Create trip response:', JSON.stringify(response, null, 2));

      setIsSaving(false);
      setShowSuccessModal(true);
    } catch (e) {
      console.log('Create trip error:', e?.response?.status, JSON.stringify(e?.response?.data));
      setIsSaving(false);
      Alert.alert('Error', getErrorMessage(e));
    }
  };

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Create a Trip"
        subtitle="PAWSPORT ADVENTURES 🐾"
        onBack={() => navigation.goBack()}
        testID="create-trip-back-btn"
      />

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.flexOne}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: vs(8),
            paddingBottom:
              Math.max(insets.bottom, Platform.OS === 'android' ? vs(32) : vs(16)) + vs(50),
          },
        ]}
        enableOnAndroid={false}
        enableAutomaticScroll={Platform.OS === 'ios'}
        extraScrollHeight={Platform.OS === 'android' ? vs(120) : vs(80)}
        keyboardOpeningTime={0}
        scrollEventThrottle={16}
        onScroll={e => scrollY.setValue(e.nativeEvent.contentOffset.y)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── Boarding-pass Hero ── */}
        <LinearGradient
          colors={['#1E0B4B', '#4C1D95', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}>
          <View style={styles.heroPawMark} pointerEvents="none">
            <Ionicons name="paw" size={ms(120)} color="rgba(255, 255, 255, 0.07)" />
          </View>

          <View style={styles.heroTopRow}>
            <View style={styles.heroEyebrowPill}>
              <Ionicons name="airplane" size={ms(10)} color="#FDE68A" />
              <Text style={styles.heroEyebrowText}>PAWSPORT BOARDING PASS</Text>
            </View>
            <Text
              style={styles.heroProgressLabel}>{`${progressDone}/${progressSteps.length}`}</Text>
          </View>

          <Text style={styles.heroTitle} numberOfLines={2}>
            {title.trim() || 'Create a trip'}
          </Text>
          <View style={styles.heroDestRow}>
            <Ionicons name="location-sharp" size={ms(12)} color="#FDE68A" />
            <Text style={styles.heroSubtitle} numberOfLines={1}>
              {destination.trim() || "Show it on your pets' Pawsports"}
            </Text>
          </View>

          {/* Perforated ticket divider */}
          <View style={styles.ticketDividerRow}>
            <View
              style={[
                styles.ticketNotch,
                styles.ticketNotchLeft,
                isDarkMode ? styles.ticketNotchDark : styles.ticketNotchLight,
              ]}
            />
            <View style={styles.ticketDash} />
            <View
              style={[
                styles.ticketNotch,
                styles.ticketNotchRight,
                isDarkMode ? styles.ticketNotchDark : styles.ticketNotchLight,
              ]}
            />
          </View>

          <View style={styles.ticketStatsRow}>
            <View style={styles.ticketStat}>
              <Text style={styles.ticketStatLabel}>DATE</Text>
              <Text style={styles.ticketStatValue}>{date || '—'}</Text>
            </View>
            <View style={styles.ticketStat}>
              <Text style={styles.ticketStatLabel}>PETS</Text>
              <Text style={styles.ticketStatValue}>{selectedPetIds.length}</Text>
            </View>
            <View style={styles.ticketStat}>
              <Text style={styles.ticketStatLabel}>STOPS</Text>
              <Text style={styles.ticketStatValue}>{stops.length}</Text>
            </View>
          </View>

          <View style={styles.heroProgressTrack}>
            <View
              style={[
                styles.heroProgressFill,
                { width: `${Math.round((progressDone / progressSteps.length) * 100)}%` },
              ]}
            />
          </View>
        </LinearGradient>

        {/* ── Form Fields Section (exact styling from AddPetModal) ── */}
        <View style={styles.formContainer}>
          <SectionCard
            icon="compass"
            title="Trip details"
            hint="Name it, date it, say where"
            step="01"
            done={title.trim().length > 0}
            isDarkMode={isDarkMode}>
            {/* Field 1: Trip Title */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                  Trip title <Text style={styles.requiredStar}>*</Text>
                </Text>
                {title.trim().length > 0 && (
                  <View style={styles.filledCheckMark}>
                    <Feather name="check" size={ms(11)} color="#10B981" />
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.inputCardWrapper,
                  isDarkMode && styles.inputCardWrapperDark,
                  focusedField === 'title' && styles.inputCardWrapperFocused,
                  errors.title ? styles.inputCardWrapperError : null,
                ]}>
                <View style={styles.inputIconBox}>
                  <Feather name="compass" size={ms(16)} color="#7C3AED" />
                </View>
                <TextInput
                  testID="create-trip-title-input"
                  style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                  placeholder="e.g. Monsoon weekend in Coorg"
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={title}
                  onChangeText={txt => {
                    setTitle(txt);
                    if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                  }}
                  onFocus={() => handleInputFocus('title')}
                  onBlur={handleInputBlur}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />
                {title.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setTitle('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Field 2 & 3: Two-Column Row for Date & Destination */}
            <View style={styles.twoColumnRow}>
              {/* Date Field */}
              <View style={styles.dateCol}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                    Date <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  {date.trim().length > 0 && (
                    <View style={styles.filledCheckMark}>
                      <Feather name="check" size={ms(11)} color="#10B981" />
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  testID="create-trip-date-box"
                  activeOpacity={0.8}
                  onPress={openDatePickerModal}
                  style={[
                    styles.inputCardWrapper,
                    isDarkMode && styles.inputCardWrapperDark,
                    showDatePicker && styles.inputCardWrapperFocused,
                  ]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="calendar-outline" size={ms(16)} color="#7C3AED" />
                  </View>
                  <TextInput
                    testID="create-trip-date-input"
                    style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                    placeholder="dd/mm/yyyy"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={date}
                    editable={false}
                    pointerEvents="none"
                  />
                  <TouchableOpacity
                    testID="create-trip-calendar-btn"
                    onPress={openDatePickerModal}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.clearBtn}>
                    <Feather name="chevron-down" size={ms(16)} color="#7C3AED" />
                  </TouchableOpacity>
                </TouchableOpacity>
                <View style={styles.quickDateRow}>
                  {[
                    { label: 'Today', offset: 0 },
                    { label: 'Tomorrow', offset: 1 },
                    { label: 'This weekend', offset: 'weekend' },
                  ].map(chip => {
                    const d = new Date();
                    if (chip.offset === 'weekend') {
                      d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
                    } else {
                      d.setDate(d.getDate() + chip.offset);
                    }
                    const value = formatDateToString(d);
                    const active = date === value;
                    return (
                      <TouchableOpacity
                        key={chip.label}
                        testID={`quick-date-${chip.label}`}
                        activeOpacity={0.8}
                        onPress={() => setDate(value)}
                        style={[
                          styles.quickDateChip,
                          isDarkMode && styles.suggestedChipDark,
                          active && styles.quickDateChipActive,
                        ]}>
                        <Text style={[styles.quickDateText, active && styles.quickDateTextActive]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Destination Field */}
              <View style={styles.destCol}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                    Destination <Text style={styles.optionalText}>(optional)</Text>
                  </Text>
                  {destination.trim().length > 0 && (
                    <View style={styles.filledCheckMark}>
                      <Feather name="check" size={ms(11)} color="#10B981" />
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.inputCardWrapper,
                    isDarkMode && styles.inputCardWrapperDark,
                    focusedField === 'destination' && styles.inputCardWrapperFocused,
                  ]}>
                  <View style={styles.inputIconBox}>
                    <Feather name="map-pin" size={ms(15)} color="#7C3AED" />
                  </View>
                  <TextInput
                    testID="create-trip-destination-input"
                    style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                    placeholder="e.g. Coorg, Karnataka"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={destination}
                    onChangeText={setDestination}
                    onFocus={() => handleInputFocus('destination')}
                    onBlur={handleInputBlur}
                    returnKeyType="next"
                  />
                  {destination.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setDestination('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </SectionCard>

          <SectionCard
            icon="paw"
            title="Companions"
            hint="Who came along"
            step="02"
            done={selectedPetIds.length > 0}
            isDarkMode={isDarkMode}>
            {/* Field 4: Pets on this trip (Companion Selector matching AddPetModal) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                  Pets on this trip <Text style={styles.requiredStar}>*</Text>
                </Text>
                <Text style={styles.speciesHintBadge}>Select Pack Companions</Text>
              </View>

              {availablePets.length === 0 ? (
                <View style={[styles.emptyPetsCard, isDarkMode && styles.emptyPetsCardDark]}>
                  <Ionicons name="paw" size={ms(18)} color="#7C3AED" style={styles.emptyPetsIcon} />
                  <View style={styles.emptyPetsTextWrap}>
                    <Text style={[styles.emptyPetsTitle, isDarkMode && styles.textWhite]}>
                      Add a pet profile first to log trips.
                    </Text>
                    <Text style={[styles.emptyPetsSub, isDarkMode && styles.pageSubtitleDark]}>
                      Trips are recorded onto your pet's official Pawsport!
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.petsSelectorRow}>
                  {availablePets.map(pet => {
                    const isSelected = selectedPetIds.includes(pet.id);
                    return (
                      <TouchableOpacity
                        key={pet.id}
                        testID={`pet-chip-${pet.id}`}
                        onPress={() => handleSelectPet(pet.id)}
                        activeOpacity={0.85}
                        style={[
                          styles.petCompanionCard,
                          isDarkMode && styles.petCompanionCardDark,
                          isSelected && styles.petCompanionCardSelected,
                        ]}>
                        <View style={styles.petAvatarOrb}>
                          <LinearGradient
                            colors={isSelected ? ['#FDE68A', '#F59E0B'] : ['#E2E8F0', '#CBD5E1']}
                            style={styles.petAvatarRing}>
                            <View
                              style={[
                                styles.petAvatarInner,
                                isSelected && styles.petAvatarInnerSelected,
                              ]}>
                              <Ionicons
                                name="paw"
                                size={ms(14)}
                                color={isSelected ? '#FFFFFF' : '#7C3AED'}
                              />
                            </View>
                          </LinearGradient>
                        </View>

                        <View style={styles.petInfoCol}>
                          <Text
                            style={[
                              styles.petNameLabel,
                              isSelected && styles.petNameLabelSelected,
                              isDarkMode && !isSelected && styles.textWhite,
                            ]}>
                            {pet.name}
                          </Text>
                          <Text
                            style={[
                              styles.petBreedLabel,
                              isSelected && styles.petBreedLabelSelected,
                              isDarkMode && !isSelected && styles.pageSubtitleDark,
                            ]}>
                            {pet.breed || pet.type || 'Companion'}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.petSelectionTick,
                            isSelected && styles.petSelectionTickActive,
                          ]}>
                          <Feather
                            name={isSelected ? 'check' : 'plus'}
                            size={ms(12)}
                            color={isSelected ? '#FFFFFF' : '#94A3B8'}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {errors.pets && <Text style={styles.errorText}>{errors.pets}</Text>}
            </View>
          </SectionCard>

          <SectionCard
            icon="map"
            title="Route stops"
            hint="Search pet-friendly places you visited"
            step="03"
            done={stops.length > 0}
            isDarkMode={isDarkMode}>
            {/* Field 5: Places visited (optional) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                  Places visited <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                {stops.length > 0 && (
                  <View style={styles.filledCheckMark}>
                    <Feather name="check" size={ms(11)} color="#10B981" />
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.inputCardWrapper,
                  isDarkMode && styles.inputCardWrapperDark,
                  focusedField === 'place' && styles.inputCardWrapperFocused,
                ]}>
                <View style={styles.inputIconBox}>
                  <Feather name="search" size={ms(15)} color="#7C3AED" />
                </View>
                <TextInput
                  testID="create-trip-places-input"
                  style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                  placeholder="Search for a place to add..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  value={placeQuery}
                  onChangeText={setPlaceQuery}
                  onFocus={() => handleInputFocus('place')}
                  onBlur={handleInputBlur}
                  returnKeyType="search"
                />
              </View>

              {/* Custom loader while the first results load */}
              {isSearching && suggestions.length === 0 && (
                <View style={styles.searchLoaderBox}>
                  <Loader fullScreen transparent title="Searching places..." />
                </View>
              )}

              {/* Search suggestions from the listings API */}
              {suggestions.length > 0 && (
                <View style={[styles.suggestionList, isDarkMode && styles.suggestionListDark]}>
                  {suggestions.map((listing, idx) => (
                    <TouchableOpacity
                      key={listing.id}
                      testID={`place-suggestion-${listing.id}`}
                      onPress={() => selectPlace(listing)}
                      activeOpacity={0.7}
                      style={[
                        styles.suggestionRow,
                        idx > 0 && styles.suggestionRowDivider,
                        idx > 0 && isDarkMode && styles.suggestionRowDividerDark,
                      ]}>
                      <View style={styles.suggestionPin}>
                        <Ionicons name="location-sharp" size={ms(13)} color="#7C3AED" />
                      </View>
                      <View style={styles.suggestionTextCol}>
                        <Text
                          numberOfLines={1}
                          style={[styles.suggestionName, isDarkMode && styles.textWhite]}>
                          {listing.name}
                        </Text>
                        {!!(listing.city || listing.state) && (
                          <Text
                            numberOfLines={1}
                            style={[styles.suggestionMeta, isDarkMode && styles.pageSubtitleDark]}>
                            {[listing.city, listing.state].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.suggestionAdd}>
                        <Feather name="plus" size={ms(13)} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {placeQuery.trim().length >= 2 && !isSearching && suggestions.length === 0 && (
                <Text style={[styles.emptyPetsSub, isDarkMode && styles.pageSubtitleDark]}>
                  No places found.
                </Text>
              )}

              {/* Selected stops timeline */}
              {stops.length > 0 && (
                <View style={styles.stopsList}>
                  {stops.map((stop, idx) => (
                    <View
                      key={stop.listingId}
                      style={[styles.stopRow, isDarkMode && styles.stopRowDark]}>
                      <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.stopIndex}>
                        <Text style={styles.stopIndexText}>{idx + 1}</Text>
                      </LinearGradient>
                      <View style={styles.suggestionTextCol}>
                        <Text
                          numberOfLines={1}
                          style={[styles.suggestionName, isDarkMode && styles.textWhite]}>
                          {stop.name}
                        </Text>
                        {!!(stop.city || stop.state) && (
                          <Text
                            numberOfLines={1}
                            style={[styles.suggestionMeta, isDarkMode && styles.pageSubtitleDark]}>
                            {[stop.city, stop.state].filter(Boolean).join(', ')}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemovePlace(idx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="close-circle" size={ms(18)} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </SectionCard>

          <SectionCard
            icon="create"
            title="The story"
            hint="A line to remember it by"
            step="04"
            done={description.trim().length > 0}
            isDarkMode={isDarkMode}>
            {/* Field 6: Short Description (Textarea matching AddPetModal Bio) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                  Short description <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                <Text style={[styles.charCountBadge, isDarkMode && styles.charCountBadgeDark]}>
                  {`${description.length}/400`}
                </Text>
              </View>

              <View
                style={[
                  styles.bioCardWrapper,
                  isDarkMode && styles.bioCardWrapperDark,
                  focusedField === 'description' && styles.inputCardWrapperFocused,
                ]}>
                <TextInput
                  testID="create-trip-description-input"
                  style={[styles.bioTextInput, isDarkMode && styles.textWhite]}
                  placeholder="A quick line about this adventure"
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  multiline
                  maxLength={400}
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => handleInputFocus('description')}
                  onBlur={handleInputBlur}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </SectionCard>

          {/* ── Submit Button with 3D Bevels & Luxury Glow ── */}
          <View style={styles.submitSection}>
            <Text style={[styles.submitSummary, isDarkMode && styles.pageSubtitleDark]}>
              {`${selectedPetIds.length} pet${selectedPetIds.length === 1 ? '' : 's'}  ·  ${
                stops.length
              } stop${stops.length === 1 ? '' : 's'}`}
            </Text>
            {isFormValid ? (
              <BouncyPressable
                testID="create-trip-submit-btn"
                style={styles.submitBtnActive}
                activeScale={0.96}
                disabled={isSaving}
                onPress={handleSaveTrip}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#581C87']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnGradient}>
                  <View style={styles.btnContentRow}>
                    <Ionicons name="paper-plane" size={ms(15)} color="#FFFFFF" />
                    <Text style={styles.submitBtnActiveText}>Save trip</Text>
                  </View>
                </LinearGradient>
              </BouncyPressable>
            ) : (
              <TouchableOpacity
                testID="create-trip-submit-btn"
                style={[styles.submitBtnDisabled, isDarkMode && styles.submitBtnDisabledDark]}
                activeOpacity={0.8}
                onPress={handleSaveTrip}>
                <View style={styles.btnContentRow}>
                  <Text
                    style={[
                      styles.submitBtnDisabledText,
                      isDarkMode && styles.submitBtnDisabledTextDark,
                    ]}>
                    Save trip
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      <Loader visible={isSaving} title="Saving your trip..." />

      {/* ── Native Third-Party DateTimePicker Modal for iOS / Component Fallback ── */}
      {showDatePicker && (
        <Modal
          testID="date-selector-modal"
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.dateModalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={[styles.nativePickerCard, isDarkMode && styles.nativePickerCardDark]}>
              <View style={styles.nativePickerHeader}>
                <TouchableOpacity
                  testID="date-modal-cancel-btn"
                  onPress={() => setShowDatePicker(false)}
                  style={styles.nativePickerHeaderBtn}>
                  <Text
                    style={[
                      styles.nativePickerCancelText,
                      isDarkMode && styles.nativePickerCancelTextDark,
                    ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <View style={styles.nativePickerHeaderTitleWrap}>
                  <Text style={[styles.nativePickerHeaderTitle, isDarkMode && styles.textWhite]}>
                    Select Date
                  </Text>
                </View>

                <TouchableOpacity
                  testID="confirm-date-btn"
                  onPress={() => {
                    const formatted = formatDateToString(pickerDate || new Date());
                    setDate(formatted);
                    if (errors.date) {
                      setErrors(prev => ({ ...prev, date: null }));
                    }
                    setShowDatePicker(false);
                  }}
                  style={styles.nativePickerHeaderBtn}>
                  <Text style={styles.nativePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.nativePickerWrap}>
                <DateTimePicker
                  testID="date-time-picker"
                  value={pickerDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor={isDarkMode ? '#FFFFFF' : '#1E1B4B'}
                  themeVariant={isDarkMode ? 'dark' : 'light'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                      if (event.type === 'set' && selectedDate) {
                        const formatted = formatDateToString(selectedDate);
                        setDate(formatted);
                        if (errors.date) {
                          setErrors(prev => ({ ...prev, date: null }));
                        }
                      }
                    } else if (selectedDate) {
                      setPickerDate(selectedDate);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Modern Confirm Modal on Success */}
      <ModernConfirmModal
        visible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.goBack();
        }}
        title="Trip Saved! 🐾"
        subtitle={`Your trip "${title}" has been recorded to your pet's Pawsport.`}
        badge="PAWSPORT ADVENTURE"
        type="success"
        confirmText="View Pawsport"
        singleButton={true}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    position: 'relative',
  },
  rootContainerDark: {
    backgroundColor: '#0F071D',
  },

  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(20),
  },

  /* ── Hero ── */
  heroCard: {
    borderRadius: s(24),
    padding: s(18),
    marginBottom: vs(18),
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  heroPawMark: {
    position: 'absolute',
    right: -s(18),
    bottom: -vs(20),
  },
  heroEyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(5),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(20),
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.35)',
  },
  heroEyebrowText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
    letterSpacing: 1.2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginTop: vs(4),
  },
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(14),
    marginHorizontal: -s(18),
  },
  ticketNotch: {
    width: s(16),
    height: s(16),
    borderRadius: s(8),
  },
  ticketNotchLight: {
    backgroundColor: '#FAF7F2',
  },
  ticketNotchDark: {
    backgroundColor: '#0F071D',
  },
  ticketNotchLeft: {
    marginLeft: -s(8),
  },
  ticketNotchRight: {
    marginRight: -s(8),
  },
  ticketDash: {
    flex: 1,
    marginHorizontal: s(6),
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  ticketStatsRow: {
    flexDirection: 'row',
    marginBottom: vs(14),
  },
  ticketStat: {
    flex: 1,
  },
  ticketStatLabel: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1.4,
  },
  ticketStatValue: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    marginTop: vs(2),
  },
  sectionDoneBadge: {
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLoaderBox: {
    height: vs(170),
    marginTop: vs(4),
  },
  quickDateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    marginTop: vs(10),
  },
  quickDateChip: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(20),
    backgroundColor: '#F7F2FF',
    borderWidth: 1,
    borderColor: '#E4D9FB',
  },
  quickDateChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  quickDateText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6D28D9',
  },
  quickDateTextActive: {
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: s(28),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: vs(14),
  },
  heroSubtitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: s(18),
    marginTop: 0,
    flex: 1,
  },
  heroProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginTop: vs(16),
  },
  heroProgressTrack: {
    width: '100%',
    height: vs(6),
    borderRadius: s(4),
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: s(4),
    backgroundColor: '#FDE68A',
  },
  heroProgressLabel: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
  },

  /* ── Section Cards ── */
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: s(22),
    padding: s(16),
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: '#F0EBFA',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  sectionCardDark: {
    backgroundColor: 'rgba(23, 9, 46, 0.85)',
    borderColor: '#2D1452',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  sectionIconWrap: {
    width: s(32),
    height: s(32),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111827',
  },
  sectionHint: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: 1,
  },
  sectionStep: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: 'rgba(124, 58, 237, 0.18)',
  },

  /* ── Place suggestions & stops ── */
  suggestionList: {
    marginTop: vs(8),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#EAE6F5',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  suggestionListDark: {
    backgroundColor: '#120726',
    borderColor: '#2D1452',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  suggestionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1EEF9',
  },
  suggestionRowDividerDark: {
    borderTopColor: '#2D1452',
  },
  suggestionPin: {
    width: s(28),
    height: s(28),
    borderRadius: s(9),
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  suggestionTextCol: {
    flex: 1,
    marginRight: s(8),
  },
  suggestionName: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
  },
  suggestionMeta: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: 1,
  },
  suggestionAdd: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopsList: {
    marginTop: vs(10),
    gap: vs(8),
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(10),
    borderRadius: s(16),
    backgroundColor: '#F7F2FF',
    borderWidth: 1,
    borderColor: '#E4D9FB',
  },
  stopRowDark: {
    backgroundColor: '#1E0B3C',
    borderColor: '#3B1B6B',
  },
  stopIndex: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  stopIndexText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  submitSummary: {
    textAlign: 'center',
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
    marginBottom: vs(10),
  },

  /* ── Header Block ── */
  headerBlock: {
    marginBottom: vs(18),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: s(27),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111827',
    letterSpacing: -0.4,
  },
  titlePawEmoji: {
    fontSize: s(24),
  },
  pageSubtitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(4),
    lineHeight: s(18),
  },
  pageSubtitleDark: {
    color: '#94A3B8',
  },

  /* ── Form Container ── */
  formContainer: {
    marginTop: vs(2),
  },
  inputGroup: {
    marginBottom: vs(18),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(6),
  },
  inputLabel: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
  },
  requiredStar: {
    color: '#EF4444',
  },
  optionalText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  speciesHintBadge: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8B5CF6',
  },
  filledCheckMark: {
    width: s(16),
    height: s(16),
    borderRadius: s(8),
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Input Card Wrappers with Depth (exact matching AddPetModal) */
  inputCardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6F5',
    borderRadius: s(16),
    paddingHorizontal: s(12),
    height: vs(52),
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputCardWrapperDark: {
    backgroundColor: '#120726',
    borderColor: '#2D1452',
  },
  inputCardWrapperFocused: {
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
  },
  inputCardWrapperError: {
    borderColor: '#EF4444',
  },
  inputIconBox: {
    width: s(28),
    height: s(28),
    borderRadius: s(10),
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  premiumTextInput: {
    flex: 1,
    height: '100%',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#0F172A',
  },
  clearBtn: {
    padding: s(4),
  },
  errorText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#EF4444',
    marginTop: vs(4),
    marginLeft: s(2),
  },

  /* Two Column Row */
  twoColumnRow: {
    flexDirection: 'column',
    gap: vs(16),
    marginBottom: vs(14),
  },
  dateCol: {
    width: '100%',
  },
  destCol: {
    width: '100%',
  },

  /* Pets Selector */
  emptyPetsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  emptyPetsCardDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
  },
  emptyPetsIcon: {
    marginRight: s(10),
  },
  emptyPetsTextWrap: {
    flex: 1,
  },
  emptyPetsTitle: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
    marginBottom: vs(1),
  },
  emptyPetsSub: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  petsSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  petCompanionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EAE6F5',
    borderRadius: s(16),
    paddingHorizontal: s(10),
    paddingVertical: vs(10),
    minWidth: s(130),
    flex: 1,
  },
  petCompanionCardDark: {
    backgroundColor: '#120726',
    borderColor: '#2D1452',
  },
  petCompanionCardSelected: {
    borderColor: '#7C3AED',
    borderWidth: 1.8,
    backgroundColor: '#F7F2FF',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  petAvatarOrb: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    marginRight: s(8),
  },
  petAvatarRing: {
    flex: 1,
    borderRadius: s(14),
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarInner: {
    flex: 1,
    width: '100%',
    borderRadius: s(13),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarInnerSelected: {
    backgroundColor: '#7C3AED',
  },
  petInfoCol: {
    flex: 1,
  },
  petNameLabel: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
  },
  petNameLabelSelected: {
    color: '#5B21B6',
  },
  petBreedLabel: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  petBreedLabelSelected: {
    color: '#7C3AED',
  },
  petSelectionTick: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(4),
  },
  petSelectionTickActive: {
    backgroundColor: '#7C3AED',
  },

  /* Places Visited */
  addPlaceButton: {
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    backgroundColor: '#EDE9FE',
    borderRadius: s(8),
  },
  addPlaceButtonText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#6D28D9',
  },
  suggestedPlacesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginTop: vs(6),
  },
  suggestedChip: {
    paddingHorizontal: s(9),
    paddingVertical: vs(4),
    borderRadius: s(10),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestedChipDark: {
    backgroundColor: '#1E1035',
    borderColor: '#371B58',
  },
  suggestedChipText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#4B5563',
  },
  suggestedChipTextDark: {
    color: '#DDD6FE',
  },
  placesChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
    marginTop: vs(8),
  },
  placeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: s(10),
    paddingHorizontal: s(9),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  placeTagDark: {
    backgroundColor: '#2E1065',
    borderColor: '#581C87',
  },
  placeTagIcon: {
    marginRight: s(4),
  },
  placeTagText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#5B21B6',
    marginRight: s(6),
  },

  /* Bio Card Wrapper */
  bioCardWrapper: {
    height: vs(95),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE6F5',
    borderRadius: s(16),
    padding: s(12),
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bioCardWrapperDark: {
    backgroundColor: '#120726',
    borderColor: '#2D1452',
  },
  bioTextInput: {
    flex: 1,
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#0F172A',
    lineHeight: s(18),
  },
  charCountBadge: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  charCountBadgeDark: {
    color: '#94A3B8',
  },

  /* ── Submit Section inside KeyboardAwareScrollView ── */
  submitSection: {
    marginTop: vs(18),
    marginBottom: vs(24),
  },
  submitBtnDisabled: {
    height: vs(54),
    borderRadius: s(18),
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  submitBtnDisabledDark: {
    backgroundColor: '#1A0B34',
    borderColor: '#2E1456',
  },
  submitBtnDisabledText: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#64748B',
  },
  submitBtnDisabledTextDark: {
    color: '#64748B',
  },
  btnContentRow: {
    gap: s(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    height: vs(54),
    borderRadius: s(18),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnGradient: {
    flex: 1,
    borderRadius: s(18),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
  },
  submitBtnActiveText: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Native DateTimePicker Modal Styles ── */
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(20),
  },
  nativePickerCard: {
    width: '100%',
    maxWidth: s(340),
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(16),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5B21B6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  nativePickerCardDark: {
    backgroundColor: '#1E1035',
    borderWidth: 1,
    borderColor: '#371B58',
  },
  nativePickerHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nativePickerHeaderBtn: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  nativePickerHeaderTitleWrap: {
    alignItems: 'center',
  },
  nativePickerHeaderTitle: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1B4B',
  },
  nativePickerCancelText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
  },
  nativePickerCancelTextDark: {
    color: '#A78BFA',
  },
  nativePickerDoneText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  nativePickerWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
  },
  textWhite: {
    color: '#FFFFFF',
  },
});
