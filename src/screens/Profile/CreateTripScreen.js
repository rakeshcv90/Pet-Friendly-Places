import React, { useState, useMemo, useRef } from 'react';
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
import { getItem, setItem, STORAGE_KEYS } from '../../services/storage/storage';

export const CreateTripScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const storePets = useStore(state => state.pets);
  const storeUser = useStore(state => state.user);

  // Form states matching Add a Pet design language
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedPetIds, setSelectedPetIds] = useState([]);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placesVisited, setPlacesVisited] = useState([]);

  // Focus states for input 3D highlight
  const [focusedField, setFocusedField] = useState(null);
  const focusedFieldRef = useRef(null);

  // Scroll View Ref for smooth scrolling
  const scrollViewRef = useRef(null);

  // Date Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Validation & Loading
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Quick place suggestions
  const SUGGESTED_PLACES = ['Beach Walk', 'Dog Park', 'Pet-Friendly Cafe', 'Nature Trail'];

  // Sanitize pets so "REPLACE_ME" and placeholders are cleaned up
  const sanitizePet = (pet, index) => {
    if (!pet) return null;
    let name = pet.name || pet.pet_name;
    if (
      !name ||
      name === 'undefined' ||
      name === 'null' ||
      name === 'REPLACE_ME' ||
      (typeof name === 'string' && name.includes('REPLACE_ME')) ||
      name.trim() === ''
    ) {
      name = index === 0 ? 'Simba' : `Pet ${index + 1}`;
    }

    let breed = pet.breed || pet.pet_breed || pet.breed_name;
    if (
      !breed ||
      breed === 'undefined' ||
      breed === 'null' ||
      breed === 'REPLACE_ME' ||
      (typeof breed === 'string' && breed.includes('REPLACE_ME')) ||
      breed.trim() === ''
    ) {
      const isCat = pet.type === 'Cat' || pet.pet_type === 'Cat';
      breed = isCat ? 'Indie Cat' : 'Golden Retriever';
    }

    let type = pet.type || pet.pet_type || pet.species || 'Dog';
    if (type !== 'Dog' && type !== 'Cat') {
      type = 'Dog';
    }

    const id = pet.id || pet._id || `pet-${index + 1}`;
    return {
      ...pet,
      id,
      name,
      breed,
      type,
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
      prev.includes(petId)
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
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

  const handleAddPlace = placeToAdd => {
    const p = (placeToAdd || placeQuery).trim();
    if (!p) return;
    if (!placesVisited.includes(p)) {
      setPlacesVisited(prev => [...prev, p]);
    }
    setPlaceQuery('');
  };

  const handleRemovePlace = indexToRemove => {
    setPlacesVisited(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const isFormValid =
    title.trim().length > 0 &&
    (availablePets.length === 0 || selectedPetIds.length > 0);

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
      const newTrip = {
        id: `trip-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        date: date.trim() || formatDateToString(new Date()),
        destination: destination.trim(),
        petIds: selectedPetIds,
        placesVisited,
        createdAt: new Date().toISOString(),
      };

      const existingTrips = getItem(STORAGE_KEYS.SAVED_TRIPS, true) || [];
      const updatedTrips = [newTrip, ...existingTrips];
      setItem(STORAGE_KEYS.SAVED_TRIPS, updatedTrips);

      setIsSaving(false);
      setShowSuccessModal(true);
    } catch (e) {
      setIsSaving(false);
      Alert.alert('Error', 'Unable to save trip. Please try again.');
    }
  };

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* ── Home Page Signature Ambient Decorative Glow Orbs ── */}
      <View
        style={[
          styles.ambientGlowTopRight,
          isDarkMode && styles.ambientGlowDark,
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.ambientGlowTopLeft,
          isDarkMode && styles.ambientGlowDark,
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.ambientGlowMidRight,
          isDarkMode && styles.ambientGlowDark,
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.ambientGlowMidLeft,
          isDarkMode && styles.ambientGlowDark,
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.ambientGlowBottomRight,
          isDarkMode && styles.ambientGlowDark,
        ]}
        pointerEvents="none"
      />

      {/* ── Home Page Signature Ambient Paw Watermarks ── */}
      <View
        style={styles.ambientPawWatermarkTop}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(130)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(123, 44, 255, 0.035)'}
        />
      </View>
      <View
        style={styles.ambientPawWatermarkBottom}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(238, 42, 123, 0.06)' : 'rgba(238, 42, 123, 0.03)'}
        />
      </View>

      {/* ── Top Header Navigation Bar (Fixed at top with clean icon back button) ── */}
      <View
        style={[
          styles.topNav,
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? vs(10) : vs(6)) },
          isDarkMode && styles.topNavDark,
        ]}>
        <BouncyPressable
          testID="create-trip-back-btn"
          accessibilityLabel="Back"
          style={[styles.backButton, isDarkMode && styles.backButtonDark]}
          activeScale={0.88}
          onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={s(20)}
            color={isDarkMode ? '#FFFFFF' : '#1E1B4B'}
          />
        </BouncyPressable>

        <View style={[styles.navBadge, isDarkMode && styles.navBadgeDark]}>
          <Ionicons name="sparkles" size={ms(11)} color="#F59E0B" style={styles.sparkleIcon} />
          <Text style={[styles.navBadgeText, isDarkMode && styles.navBadgeTextDark]}>
            PAWSPORT ADVENTURES 🐾
          </Text>
        </View>

        <View style={styles.topNavSpacer} />
      </View>

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.flexOne}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: vs(8),
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? vs(32) : vs(16)) + vs(50),
          },
        ]}
        enableOnAndroid={false}
        enableAutomaticScroll={Platform.OS === 'ios'}
        extraScrollHeight={Platform.OS === 'android' ? vs(120) : vs(80)}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── Header Title & Subtitle ── */}
        <View style={styles.headerBlock}>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, isDarkMode && styles.textWhite]}>
              Create a trip
            </Text>
            <Text style={styles.titlePawEmoji}> 🐾</Text>
          </View>
          <Text style={[styles.pageSubtitle, isDarkMode && styles.pageSubtitleDark]}>
            Record an adventure and show it on your pets' Pawsports.
          </Text>
        </View>

        {/* ── Form Fields Section (exact styling from AddPetModal) ── */}
        <View style={styles.formContainer}>
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
                            <View style={[styles.petAvatarInner, isSelected && styles.petAvatarInnerSelected]}>
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

            {/* Field 5: Places visited (optional) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                  Places visited <Text style={styles.optionalText}>(optional)</Text>
                </Text>
                {placesVisited.length > 0 && (
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
                  onSubmitEditing={() => handleAddPlace()}
                  returnKeyType="done"
                />
                {placeQuery.trim().length > 0 && (
                  <TouchableOpacity
                    onPress={() => handleAddPlace()}
                    style={styles.addPlaceButton}>
                    <Text style={styles.addPlaceButtonText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Suggestions Chips */}
              <View style={styles.suggestedPlacesRow}>
                {SUGGESTED_PLACES.map(suggested => (
                  <TouchableOpacity
                    key={suggested}
                    onPress={() => handleAddPlace(suggested)}
                    activeOpacity={0.7}
                    style={[styles.suggestedChip, isDarkMode && styles.suggestedChipDark]}>
                    <Text
                      style={[
                        styles.suggestedChipText,
                        isDarkMode && styles.suggestedChipTextDark,
                      ]}>
                      + {suggested}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Added Places Tags */}
              {placesVisited.length > 0 && (
                <View style={styles.placesChipsContainer}>
                  {placesVisited.map((p, idx) => (
                    <View
                      key={`${p}-${idx}`}
                      style={[styles.placeTag, isDarkMode && styles.placeTagDark]}>
                      <Ionicons name="location-sharp" size={ms(12)} color="#7C3AED" style={styles.placeTagIcon} />
                      <Text style={[styles.placeTagText, isDarkMode && styles.textWhite]}>
                        {p}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemovePlace(idx)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <Ionicons name="close-circle" size={ms(14)} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

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

            {/* ── Submit Button with 3D Bevels & Luxury Glow ── */}
            <View style={styles.submitSection}>
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
                      <Text style={styles.submitBtnActiveText}>
                        {isSaving ? 'Saving Trip...' : 'Save trip 🐾'}
                      </Text>
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
                      Save trip 🐾
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAwareScrollView>

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
            <View
              style={[
                styles.nativePickerCard,
                isDarkMode && styles.nativePickerCardDark,
              ]}>
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
                  <Text
                    style={[
                      styles.nativePickerHeaderTitle,
                      isDarkMode && styles.textWhite,
                    ]}>
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

  /* ── Home Screen Background Ambient Decorative Glows & Watermarks ── */
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
  ambientGlowDark: {
    opacity: 0.18,
  },
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: s(180),
    right: -s(20),
    transform: [{ rotate: '-25deg' }],
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: s(220),
    left: -s(30),
    transform: [{ rotate: '30deg' }],
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(20),
  },

  /* ── Top Header Navigation Bar ── */
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(20),
    paddingBottom: vs(8),
  },
  topNavDark: {
    borderBottomColor: '#1F1635',
  },
  backButton: {
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
  backButtonDark: {
    backgroundColor: '#1E1035',
    borderColor: '#371B58',
  },
  navBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  navBadgeDark: {
    backgroundColor: '#2E1A05',
    borderColor: '#78350F',
  },
  sparkleIcon: {
    marginRight: s(4),
  },
  navBadgeText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#B45309',
    letterSpacing: 0.6,
  },
  navBadgeTextDark: {
    color: '#FCD34D',
  },
  topNavSpacer: {
    width: s(38),
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
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    height: vs(48),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  inputCardWrapperDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
  },
  inputCardWrapperFocused: {
    borderColor: '#7C3AED',
    borderBottomColor: '#5B21B6',
    backgroundColor: '#FAF5FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputCardWrapperError: {
    borderColor: '#EF4444',
    borderBottomColor: '#DC2626',
  },
  inputIconBox: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    backgroundColor: '#F5F3FF',
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
    flexDirection: 'row',
    gap: s(10),
    marginBottom: vs(18),
  },
  dateCol: {
    flex: 1,
  },
  destCol: {
    flex: 1.15,
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
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    borderRadius: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    minWidth: s(130),
    flex: 1,
  },
  petCompanionCardDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
  },
  petCompanionCardSelected: {
    borderColor: '#7C3AED',
    borderBottomColor: '#5B21B6',
    backgroundColor: '#FAF5FF',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
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
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    borderRadius: s(14),
    padding: s(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  bioCardWrapperDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
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
    height: vs(50),
    borderRadius: s(14),
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    height: vs(50),
    borderRadius: s(14),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  submitBtnGradient: {
    flex: 1,
    borderRadius: s(14),
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
