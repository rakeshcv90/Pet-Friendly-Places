import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  Image,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { WEB_BASE_URL } from '../../services/api/apiList';
import { submitPlace, createIdempotencyKey } from '../../hooks/placeSubmission';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from './components';
import { ModernConfirmModal } from '../Profile/components/ModernConfirmModal';

const MAX_PHOTOS = 5;
const MIN_EXPERIENCE_CHARS = 30;

// Same categories as the website's Add a Pet Friendly Place form
const CATEGORIES = [
  'Stays',
  'Food & Cafes',
  'Water & Nature',
  'Pet Care',
  'Travel Options',
  'Workplaces',
  'Public Places',
];

const TRUST_CHIPS = [
  { icon: 'checkmark-circle', text: 'Free to submit' },
  { icon: 'search', text: 'Researched before publishing' },
  { icon: 'paw', text: 'Helps 2,500+ pet parents' },
];

// Existing Terms passages that apply to submitted photos (same wording as the website)
const PHOTO_TERMS = [
  {
    title: 'Terms of Service, section 4',
    text: "You confirm that your photos were taken by you or you have permission to use them, and they don't infringe anyone's rights or privacy.",
  },
  {
    title: 'Terms of Service, section 5',
    text: 'You keep ownership of your User Content. You grant us a worldwide, non-exclusive, royalty-free licence to host, store, display, reproduce, excerpt, adapt for formatting, and distribute your User Content on and in connection with the operation and promotion of petfriendlyplaces.in, for as long as the content remains on the service, plus the retention period described in §8.8.',
  },
  {
    title: 'Community Guidelines',
    text: 'Post your own words and photos, or content you have the right to share.',
  },
];

const PHOTO_TERMS_LINKS = [
  { label: 'Terms, section 4', path: '/terms' },
  { label: 'Terms, section 5', path: '/terms' },
  { label: 'Privacy, section 5', path: '/privacy' },
  { label: 'Community Guidelines', path: '/community-guidelines' },
];

const formatDate = date =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}/${date.getFullYear()}`;

const photoSignature = photo =>
  photo.fileName && photo.fileSize
    ? [photo.fileName, photo.fileSize, photo.width, photo.height].join('|')
    : photo.uri;

const toIsoDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

const SectionHeader = ({ icon, tint, title, subtitle, isDarkMode }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={[styles.sectionIconDisc, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={ms(15)} color="#5B21B6" />
    </View>
    <View style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>{title}</Text>
      <Text style={[styles.sectionSub, isDarkMode && styles.textMutedDark]}>{subtitle}</Text>
    </View>
  </View>
);

const Field = ({
  label,
  required,
  hint,
  icon,
  multiline,
  focused,
  onFocusField,
  onBlurField,
  isDarkMode,
  footer,
  children,
  ...inputProps
}) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
      {label}
      {required ? <Text style={styles.requiredStar}> *</Text> : null}
    </Text>
    {!!hint && <Text style={[styles.fieldHint, isDarkMode && styles.textMutedDark]}>{hint}</Text>}
    <View
      style={[
        styles.inputBox3D,
        multiline && styles.inputBoxMultiline,
        isDarkMode && styles.inputBox3DDark,
        focused && styles.inputFocused,
      ]}>
      {!!icon && (
        <Feather
          name={icon}
          size={ms(15)}
          color={focused ? '#7C3AED' : isDarkMode ? '#94A3B8' : '#A1A1AA'}
          style={[styles.fieldLeadIcon, multiline && styles.fieldLeadIconTop]}
        />
      )}
      {children || (
        <TextInput
          style={[
            styles.nativeInput,
            multiline && styles.nativeInputMultiline,
            isDarkMode && styles.textWhite,
          ]}
          placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={onFocusField}
          onBlur={onBlurField}
          {...inputProps}
        />
      )}
    </View>
    {footer}
  </View>
);

export const AddPlaceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [mapPin, setMapPin] = useState('');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');

  const [visitDate, setVisitDate] = useState(null);
  const [petCount, setPetCount] = useState('');
  const [petTypes, setPetTypes] = useState('');
  const [areasAllowed, setAreasAllowed] = useState('');
  const [petPolicy, setPetPolicy] = useState('');
  const [petFees, setPetFees] = useState('');
  const [experience, setExperience] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  const [photos, setPhotos] = useState([]);
  const [agreed, setAgreed] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showIosDate, setShowIosDate] = useState(false);
  // Same key for retries of the same submission; renewed once a submission succeeds
  const idempotencyKey = useRef(createIdempotencyKey());
  const [showPhotoTerms, setShowPhotoTerms] = useState(false);

  // Drives the background glows, as on the Home screen
  const scrollY = useRef(new Animated.Value(0)).current;

  const focusProps = key => ({
    focused: focusedField === key,
    onFocusField: () => setFocusedField(key),
    onBlurField: () => setFocusedField(null),
    isDarkMode,
  });

  const clearError = () => errorMessage && setErrorMessage('');

  const experienceChars = experience.trim().length;
  const trimmedName = name.trim();
  const trimmedCity = city.trim();

  // Mirrors the website's checklist under the submit button
  const checklist = [
    { done: !!trimmedName, text: 'Add the place name' },
    { done: !!trimmedCity, text: 'Add the city' },
    {
      done: experienceChars >= MIN_EXPERIENCE_CHARS,
      text: 'Your experience must be at least 30 characters',
    },
    { done: photos.length > 0, text: 'Add at least one photo' },
    { done: agreed, text: 'Accept the photo-use terms for this submission' },
  ];
  const canSubmit = checklist.every(item => item.done) && !!category;
  const stepsDone = checklist.filter(item => item.done).length + (category ? 1 : 0);
  const stepsTotal = checklist.length + 1;

  const openDatePicker = () => {
    Keyboard.dismiss();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: visitDate || new Date(),
        mode: 'date',
        maximumDate: new Date(),
        onValueChange: (_, date) => setVisitDate(date),
      });
    } else {
      setShowIosDate(prev => !prev);
    }
  };

  const pickPhotos = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });
    if (!result.assets?.length) {
      return;
    }

    // The picker copies each pick to a new temp uri, so compare name, size and dimensions instead
    const seen = new Set(photos.map(photoSignature));
    const fresh = [];
    result.assets.forEach(asset => {
      const signature = photoSignature(asset);
      if (!seen.has(signature)) {
        seen.add(signature);
        fresh.push(asset);
      }
    });

    setPhotos(prev => [...prev, ...fresh].slice(0, MAX_PHOTOS));
    if (fresh.length < result.assets.length) {
      setErrorMessage('That photo is already added. Please choose a different one.');
    } else {
      clearError();
    }
  };

  const removePhoto = uri => setPhotos(prev => prev.filter(p => p.uri !== uri));

  const openTermsLink = link => {
    setShowPhotoTerms(false);
    navigation.navigate('InAppBrowserScreen', {
      url: `${WEB_BASE_URL}${link.path}`,
      title: link.label,
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    Keyboard.dismiss();
    setErrorMessage('');

    if (!trimmedName) {
      setErrorMessage('Please add the place name.');
      return;
    }
    if (!category) {
      setErrorMessage('Please select a category.');
      return;
    }
    if (!trimmedCity) {
      setErrorMessage('Please add the city.');
      return;
    }
    if (experienceChars < MIN_EXPERIENCE_CHARS) {
      setErrorMessage('Your experience must be at least 30 characters.');
      return;
    }
    if (photos.length === 0) {
      setErrorMessage('Please add at least one photo.');
      return;
    }
    if (!agreed) {
      setErrorMessage('Please accept the photo-use terms for this submission.');
      return;
    }

    setIsSubmitting(true);
    const result = await submitPlace({
      idempotencyKey: idempotencyKey.current,
      photos,
      fields: {
        proposedName: name,
        category,
        city,
        descriptionText: experience,
        state,
        address,
        mapPin,
        website,
        phone,
        travelDate: visitDate ? toIsoDate(visitDate) : '',
        petCount,
        petTypes,
        petAllowedAreas: areasAllowed,
        petPolicyText: petPolicy,
        petChargesDetails: petFees,
        additionalFacts: extraNotes,
      },
    });
    setIsSubmitting(false);

    if (result.ok) {
      idempotencyKey.current = createIdempotencyKey();
      setShowSuccessModal(true);
    } else {
      setErrorMessage(result.error);
    }
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const cardStyle = [styles.sectionBlock, isDarkMode && styles.sectionBlockDark];

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FFFFFF'}
      />

      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Add a Place"
        subtitle="HELP THE PACK GROW"
        onBack={() => navigation.goBack()}
        testID="add-place-back-btn"
      />

      <Loader
        visible={isSubmitting}
        title="Submitting place..."
        subtitle="Sending your experience to the PetFriendly team..."
      />

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(insets.bottom, Platform.OS === 'android' ? vs(48) : vs(24)) + vs(72),
          },
        ]}
        enableOnAndroid
        enableResetScrollToCoords={false}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => scrollY.setValue(e.nativeEvent.contentOffset.y)}
        keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.heroCardOuter}>
          <LinearGradient
            colors={
              isDarkMode ? ['#1C0B36', '#260D49', '#1A0738'] : ['#2E008B', '#3B108F', '#7B2CFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}>
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroPawWatermark} pointerEvents="none">
              <Ionicons name="paw" size={ms(95)} color="rgba(255, 255, 255, 0.05)" />
            </View>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={ms(10)} color="#FCD34D" style={styles.heroSparkle} />
              <Text style={styles.heroBadgeText}>HELP THE PACK GROW</Text>
            </View>
            <Text style={styles.heroTitle}>Add a Pet Friendly Place</Text>
            <Text style={styles.heroSubtitle}>
              Help other pet parents across India discover great spots. Each submission is queued
              for research and review before it can be published.
            </Text>
            <View style={styles.trustRow}>
              {TRUST_CHIPS.map(chip => (
                <View key={chip.text} style={styles.trustChip}>
                  <Ionicons name={chip.icon} size={ms(11)} color="#FCD34D" />
                  <Text style={styles.trustChipText}>{chip.text}</Text>
                </View>
              ))}
            </View>
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#FCD34D', '#FF4FB8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${(stepsDone / stepsTotal) * 100}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {stepsDone} of {stepsTotal} required steps done
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Where is it? */}
        <View style={cardStyle}>
          <SectionHeader
            icon="location"
            tint="#EDE9FE"
            title="Where is it?"
            subtitle="Tell us the name, category, and location."
            isDarkMode={isDarkMode}
          />

          <Field
            label="Name of the Place"
            required
            icon="map-pin"
            testID="add-place-name-input"
            placeholder="e.g. The Barking Cat Cafe"
            value={name}
            onChangeText={txt => {
              setName(txt);
              clearError();
            }}
            {...focusProps('name')}
          />

          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Category<Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map(item => {
                const active = category === item;
                return (
                  <BouncyPressable
                    key={item}
                    testID={`add-place-category-${item}`}
                    activeScale={0.94}
                    style={[
                      styles.chip,
                      isDarkMode && styles.chipDark,
                      active && styles.chipActive,
                    ]}
                    onPress={() => {
                      setCategory(item);
                      clearError();
                    }}>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={ms(13)}
                      color={active ? '#6D28D9' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isDarkMode && styles.textWhite,
                        active && styles.chipTextActive,
                      ]}>
                      {item}
                    </Text>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Field
                label="City"
                required
                testID="add-place-city-input"
                placeholder="e.g. Mumbai"
                value={city}
                onChangeText={txt => {
                  setCity(txt);
                  clearError();
                }}
                {...focusProps('city')}
              />
            </View>
            <View style={styles.col}>
              <Field
                label="State"
                placeholder="e.g. Maharashtra"
                value={state}
                onChangeText={setState}
                {...focusProps('state')}
              />
            </View>
          </View>

          <Field
            label="Address / Area"
            icon="home"
            placeholder="Street address or neighbourhood"
            value={address}
            onChangeText={setAddress}
            {...focusProps('address')}
          />

          <Field
            label="Map pin (optional)"
            icon="navigation"
            placeholder="Latitude, longitude or a Google Maps link"
            value={mapPin}
            onChangeText={setMapPin}
            autoCapitalize="none"
            hint="A precise pin helps us recognize the same place. Coordinates can be copied from Google Maps."
            {...focusProps('mapPin')}
          />

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Field
                label="Website"
                placeholder="https://..."
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
                {...focusProps('website')}
              />
            </View>
            <View style={styles.col}>
              <Field
                label="Phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                {...focusProps('phone')}
              />
            </View>
          </View>
        </View>

        {/* Your Pet Experience */}
        <View style={cardStyle}>
          <SectionHeader
            icon="heart"
            tint="#FCE7F3"
            title="Your Pet Experience"
            subtitle="Tell us what it's like to visit with a pet."
            isDarkMode={isDarkMode}
          />

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Field label="When did you visit?" isDarkMode={isDarkMode} focused={showIosDate}>
                <TouchableOpacity
                  style={styles.dateTouch}
                  activeOpacity={0.8}
                  onPress={openDatePicker}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.dateText,
                      isDarkMode && styles.textWhite,
                      !visitDate && styles.datePlaceholder,
                    ]}>
                    {visitDate ? formatDate(visitDate) : 'dd/mm/yyyy'}
                  </Text>
                  <Feather
                    name="calendar"
                    size={ms(14)}
                    color={isDarkMode ? '#94A3B8' : '#A1A1AA'}
                  />
                </TouchableOpacity>
              </Field>
            </View>
            <View style={styles.col}>
              <Field
                label="How many pets were with you?"
                placeholder="e.g. 2"
                value={petCount}
                onChangeText={txt => setPetCount(txt.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                {...focusProps('petCount')}
              />
            </View>
          </View>

          {Platform.OS === 'ios' && showIosDate && (
            <DateTimePicker
              value={visitDate || new Date()}
              mode="date"
              display="inline"
              maximumDate={new Date()}
              themeVariant={isDarkMode ? 'dark' : 'light'}
              onValueChange={(_, date) => setVisitDate(date)}
              style={styles.iosPicker}
            />
          )}

          <Field
            label="What pets did you bring?"
            icon="heart"
            placeholder="e.g. Dog, cat"
            value={petTypes}
            onChangeText={setPetTypes}
            {...focusProps('petTypes')}
          />

          <Field
            label="Where were pets allowed?"
            hint="Optional, include any areas that were off limits too."
            multiline
            placeholder="e.g. Outdoor tables, garden, and lobby"
            value={areasAllowed}
            onChangeText={setAreasAllowed}
            {...focusProps('areasAllowed')}
          />

          <Field
            label="Pet policy as you understand it"
            hint="Optional, what rules did you observe?"
            multiline
            placeholder="e.g. Dogs on leash allowed in outdoor seating. Water bowl provided. Indoor not allowed."
            value={petPolicy}
            onChangeText={setPetPolicy}
            {...focusProps('petPolicy')}
          />

          <Field
            label="Pet charges or fees"
            hint="Optional, share charges, deposits, or anything you were told about fees."
            multiline
            placeholder="e.g. No pet fee, or ₹500 cleaning fee per stay"
            value={petFees}
            onChangeText={setPetFees}
            {...focusProps('petFees')}
          />

          <Field
            label="Your experience visiting with your pet"
            required
            multiline
            testID="add-place-experience-input"
            placeholder="Describe what it was like, what you loved, any tips for other pet parents, what your pet enjoyed..."
            value={experience}
            onChangeText={txt => {
              setExperience(txt);
              clearError();
            }}
            footer={
              <Text
                style={[
                  styles.counter,
                  experienceChars >= MIN_EXPERIENCE_CHARS && styles.counterDone,
                ]}>
                {experienceChars} / {MIN_EXPERIENCE_CHARS} min chars
              </Text>
            }
            {...focusProps('experience')}
          />

          <Field
            label="Anything else pet parents should know?"
            hint="Optional, share useful details that do not fit above."
            multiline
            placeholder="Accessibility, parking, water bowls, staff welcome, or practical tips"
            value={extraNotes}
            onChangeText={setExtraNotes}
            {...focusProps('extraNotes')}
          />
        </View>

        {/* Photos */}
        <View style={cardStyle}>
          <SectionHeader
            icon="images"
            tint="#CFFAFE"
            title="Photos"
            subtitle="At least one photo is required."
            isDarkMode={isDarkMode}
          />

          {photos.length > 0 && (
            <View style={styles.photoRow}>
              {photos.map(photo => (
                <View key={photo.uri} style={styles.photoBox}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <TouchableOpacity
                    accessibilityLabel="Remove photo"
                    style={styles.photoRemove}
                    onPress={() => removePhoto(photo.uri)}>
                    <Ionicons name="close" size={ms(12)} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {photos.length < MAX_PHOTOS && (
            <BouncyPressable
              testID="add-place-upload-btn"
              activeScale={0.97}
              style={[styles.uploadBox, isDarkMode && styles.uploadBoxDark]}
              onPress={pickPhotos}>
              <View style={styles.uploadIconDisc}>
                <Ionicons name="camera" size={ms(20)} color="#7C3AED" />
              </View>
              <Text style={styles.uploadTitle}>Tap to upload photos</Text>
              <Text style={[styles.uploadSub, isDarkMode && styles.textMutedDark]}>
                Up to {MAX_PHOTOS} photos · JPG, PNG, WebP
              </Text>
            </BouncyPressable>
          )}
        </View>

        {/* Terms */}
        <TouchableOpacity
          testID="add-place-terms"
          activeOpacity={0.85}
          style={[styles.termsBox, isDarkMode && styles.termsBoxDark]}
          onPress={() => {
            setAgreed(prev => !prev);
            clearError();
          }}>
          <Ionicons
            name={agreed ? 'checkbox' : 'square-outline'}
            size={ms(20)}
            color={agreed ? '#7C3AED' : '#9CA3AF'}
            style={styles.termsCheck}
          />
          <View style={styles.flex}>
            <Text style={[styles.termsTitle, isDarkMode && styles.textWhite]}>
              I agree to the existing Terms of Service and Community Guidelines for the photos in
              this submission.
            </Text>
            <Text style={[styles.termsSub, isDarkMode && styles.textMutedDark]}>
              Required once for this submission. It does not approve photos or publish a listing.
            </Text>
            <Text style={styles.termsLink} onPress={() => setShowPhotoTerms(true)}>
              Read the photo-use summary
            </Text>
          </View>
        </TouchableOpacity>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={ms(14)} color="#DC2626" style={styles.errorIcon} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* Submit */}
        <BouncyPressable
          testID="add-place-submit-btn"
          style={[styles.submitBtnWrap, !canSubmit && styles.submitBtnDisabled]}
          activeScale={0.96}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <LinearGradient
            colors={
              canSubmit ? ['#8B5CF6', '#7C3AED', '#5B21B6'] : ['#C4B5FD', '#B4A3F5', '#A592E8']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.submitBtn3D, !canSubmit && styles.submitBtn3DDisabled]}>
            <Ionicons name="paw" size={ms(15)} color="#FFFFFF" style={styles.submitBtnIcon} />
            <Text style={styles.submitBtnText}>Submit for Review</Text>
          </LinearGradient>
        </BouncyPressable>

        {!canSubmit && (
          <View style={styles.checklist}>
            {!category && (
              <View style={styles.checkRow}>
                <Ionicons name="ellipse-outline" size={ms(12)} color="#9CA3AF" />
                <Text style={[styles.checkText, isDarkMode && styles.textMutedDark]}>
                  Select a category
                </Text>
              </View>
            )}
            {checklist
              .filter(item => !item.done)
              .map(item => (
                <View key={item.text} style={styles.checkRow}>
                  <Ionicons name="ellipse-outline" size={ms(12)} color="#9CA3AF" />
                  <Text style={[styles.checkText, isDarkMode && styles.textMutedDark]}>
                    {item.text}
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* Keeps the last rows clear of the Android navigation bar / home indicator */}
        <View
          style={{
            height: Math.max(insets.bottom, vs(24)) + vs(Platform.OS === 'android' ? 96 : 40),
          }}
        />
      </KeyboardAwareScrollView>

      <Modal
        visible={showPhotoTerms}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoTerms(false)}>
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={styles.flex}
            activeOpacity={1}
            accessibilityLabel="Close photo-use summary"
            onPress={() => setShowPhotoTerms(false)}
          />
          <View
            style={[
              styles.sheet,
              isDarkMode && styles.sheetDark,
              {
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? vs(40) : vs(16)),
              },
            ]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.flex}>
                <Text style={[styles.sheetTitle, isDarkMode && styles.textWhite]}>
                  Photo-use summary
                </Text>
                <Text style={[styles.sheetIntro, isDarkMode && styles.textMutedDark]}>
                  These are the existing Terms passages that apply to photos submitted to Pet
                  Friendly Places.
                </Text>
              </View>
              <BouncyPressable
                testID="photo-terms-close-btn"
                style={[styles.sheetClose, isDarkMode && styles.sheetCloseDark]}
                activeScale={0.92}
                onPress={() => setShowPhotoTerms(false)}>
                <Text style={styles.sheetCloseText}>Close</Text>
              </BouncyPressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {PHOTO_TERMS.map(item => (
                <View key={item.title} style={styles.quoteBlock}>
                  <Text style={[styles.quoteTitle, isDarkMode && styles.textWhite]}>
                    {item.title}
                  </Text>
                  <View style={[styles.quoteBody, isDarkMode && styles.quoteBodyDark]}>
                    <Text style={[styles.quoteText, isDarkMode && styles.textWhite]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              ))}
              <Text style={[styles.sheetNote, isDarkMode && styles.textMutedDark]}>
                Each photo is still reviewed separately before it appears. This acceptance does not
                approve a photo or publish a listing.
              </Text>
              <View style={styles.sheetLinks}>
                {PHOTO_TERMS_LINKS.map(link => (
                  <Text
                    key={link.label}
                    style={styles.termsLink}
                    onPress={() => openTermsLink(link)}>
                    {link.label}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ModernConfirmModal
        visible={showSuccessModal}
        onClose={handleSuccessDone}
        onConfirm={handleSuccessDone}
        title="Place Submitted!"
        subtitle="Thank you for helping the pack grow. Our team will research and review it before it appears."
        badge="PETFRIENDLY"
        type="success"
        confirmText="Done"
        singleButton={true}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const { fontFamily } = theme.typography;

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#FAF8F5' },
  rootContainerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },

  /* Header */
  scrollContent: { paddingHorizontal: s(15), paddingTop: vs(12) },

  /* Hero */
  heroCardOuter: {
    borderRadius: s(20),
    overflow: 'hidden',
    marginBottom: vs(12),
    ...Platform.select({
      ios: {
        shadowColor: '#4C1D95',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  heroGradient: {
    paddingHorizontal: s(16),
    paddingTop: vs(14),
    paddingBottom: vs(16),
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -s(50),
    right: -s(40),
    width: s(170),
    height: s(170),
    borderRadius: s(85),
    backgroundColor: 'rgba(255, 79, 184, 0.28)',
  },
  progressWrap: { marginTop: vs(12) },
  progressTrack: {
    height: s(6),
    borderRadius: s(3),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: s(3) },
  progressText: {
    fontSize: s(10),
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: vs(5),
  },
  heroPawWatermark: { position: 'absolute', right: s(-10), bottom: vs(-10) },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
    marginBottom: vs(8),
  },
  heroSparkle: { marginRight: s(4) },
  heroBadgeText: {
    fontSize: s(9),
    fontFamily: fontFamily.bold,
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: s(18.5),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: vs(4),
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: s(11.5),
    fontFamily: fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: s(16),
  },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginTop: vs(10) },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  trustChipText: { fontSize: s(9.5), fontFamily: fontFamily.semiBold, color: '#FFFFFF' },

  /* Section cards */
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    marginBottom: vs(12),
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD7CC',
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  sectionBlockDark: {
    backgroundColor: '#190A32',
    borderColor: '#371569',
    borderBottomColor: '#230A47',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(12) },
  sectionIconDisc: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(9),
  },
  sectionTitleWrap: { flex: 1 },
  sectionTitle: { fontSize: s(14), fontFamily: fontFamily.extraBold, color: '#1E1B4B' },
  sectionSub: {
    fontSize: s(10.5),
    fontFamily: fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(1),
  },

  /* Fields */
  twoCol: { flexDirection: 'row', gap: s(10) },
  col: { flex: 1 },
  fieldWrap: { marginBottom: vs(10) },
  fieldLabel: {
    fontSize: s(11.5),
    fontFamily: fontFamily.bold,
    color: '#374151',
    marginBottom: vs(4),
  },
  fieldHint: {
    fontSize: s(10),
    fontFamily: fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(14),
    marginBottom: vs(4),
  },
  requiredStar: { color: '#EF4444' },
  inputBox3D: {
    minHeight: vs(38),
    backgroundColor: '#FAF8F5',
    borderRadius: s(11),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    paddingHorizontal: s(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxMultiline: { alignItems: 'flex-start', paddingTop: vs(9) },
  inputBox3DDark: {
    backgroundColor: '#220D42',
    borderColor: '#3D1C73',
    borderBottomColor: '#240B4C',
  },
  inputFocused: {
    borderColor: '#7C3AED',
    borderBottomColor: '#5B21B6',
    backgroundColor: '#FFFFFF',
  },
  fieldLeadIcon: { marginRight: s(8) },
  fieldLeadIconTop: { marginTop: vs(2) },
  nativeInput: {
    flex: 1,
    fontSize: s(12.5),
    fontFamily: fontFamily.regular,
    color: '#16082F',
    paddingVertical: 0,
  },
  nativeInputMultiline: { minHeight: vs(62), paddingBottom: vs(8) },
  counter: {
    alignSelf: 'flex-end',
    fontSize: s(10),
    fontFamily: fontFamily.medium,
    color: '#DC2626',
    marginTop: vs(4),
  },
  counterDone: { color: '#059669' },
  dateTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: vs(34),
  },
  dateText: { flex: 1, fontSize: s(12.5), fontFamily: fontFamily.regular, color: '#16082F' },
  datePlaceholder: { color: '#94A3B8' },
  iosPicker: { alignSelf: 'center', marginBottom: vs(10) },

  /* Category chips */
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(11),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipDark: { backgroundColor: '#220D42', borderColor: '#3D1C73', borderBottomColor: '#240B4C' },
  chipActive: { backgroundColor: '#F3EEFF', borderColor: '#7C3AED', borderBottomColor: '#5B21B6' },
  chipText: { fontSize: s(11.5), fontFamily: fontFamily.semiBold, color: '#374151' },
  chipTextActive: { color: '#4C1D95', fontFamily: fontFamily.bold },

  /* Photos */
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10), marginBottom: vs(10) },
  photoBox: { width: s(72), height: s(72) },
  photo: { width: '100%', height: '100%', borderRadius: s(12) },
  photoRemove: {
    position: 'absolute',
    top: -s(6),
    right: -s(6),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    alignItems: 'center',
    paddingVertical: vs(18),
    borderRadius: s(14),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    backgroundColor: '#F6F3FF',
  },
  uploadBoxDark: { backgroundColor: '#210B3E', borderColor: '#5B3AA6' },
  uploadIconDisc: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(6),
  },
  uploadTitle: { fontSize: s(12.5), fontFamily: fontFamily.bold, color: '#7C3AED' },
  uploadSub: {
    fontSize: s(10.5),
    fontFamily: fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(2),
  },

  /* Terms */
  termsBox: {
    flexDirection: 'row',
    backgroundColor: '#F6F3FF',
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E9D5FF',
    padding: s(12),
    marginBottom: vs(12),
  },
  termsBoxDark: { backgroundColor: '#210B3E', borderColor: '#42167A' },
  termsCheck: { marginRight: s(10), marginTop: vs(1) },
  termsTitle: { fontSize: s(11), fontFamily: fontFamily.bold, color: '#1E1B4B', lineHeight: s(16) },
  termsSub: {
    fontSize: s(10.5),
    fontFamily: fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(15),
    marginTop: vs(3),
  },
  termsLink: {
    fontSize: s(10.5),
    fontFamily: fontFamily.bold,
    color: '#5B21B6',
    textDecorationLine: 'underline',
    marginTop: vs(4),
  },

  /* Photo-use summary sheet */
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(22, 8, 47, 0.55)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    paddingHorizontal: s(18),
    paddingTop: vs(8),
  },
  sheetDark: { backgroundColor: '#190A32' },
  sheetHandle: {
    alignSelf: 'center',
    width: s(40),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: '#D8C2F5',
    marginBottom: vs(12),
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: s(10), marginBottom: vs(10) },
  sheetTitle: { fontSize: s(17), fontFamily: fontFamily.extraBold, color: '#1E1B4B' },
  sheetIntro: {
    fontSize: s(11.5),
    fontFamily: fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(17),
    marginTop: vs(4),
  },
  sheetClose: {
    paddingHorizontal: s(14),
    paddingVertical: vs(7),
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E9D5FF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D8C2F5',
  },
  sheetCloseDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#3D1C73',
    borderBottomColor: '#240B4C',
  },
  sheetCloseText: { fontSize: s(12), fontFamily: fontFamily.bold, color: '#3B108F' },
  quoteBlock: { marginTop: vs(12) },
  quoteTitle: {
    fontSize: s(13),
    fontFamily: fontFamily.bold,
    color: '#1E1B4B',
    marginBottom: vs(6),
  },
  quoteBody: { borderLeftWidth: 3, borderLeftColor: '#C4B5FD', paddingLeft: s(12) },
  quoteBodyDark: { borderLeftColor: '#5B3AA6' },
  quoteText: {
    fontSize: s(12),
    fontFamily: fontFamily.regular,
    color: '#1E1B4B',
    lineHeight: s(19),
  },
  sheetNote: {
    fontSize: s(11.5),
    fontFamily: fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(17),
    marginTop: vs(14),
  },
  sheetLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: s(14),
    rowGap: vs(6),
    marginTop: vs(12),
    marginBottom: vs(8),
  },

  /* Submit */
  submitBtnWrap: { marginBottom: vs(10) },
  submitBtnDisabled: { opacity: 0.9 },
  submitBtn3D: {
    height: vs(44),
    borderRadius: s(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3.8,
    borderBottomColor: '#4C1D95',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
    }),
  },
  submitBtn3DDisabled: { borderBottomColor: '#8B7BD0', shadowOpacity: 0, elevation: 0 },
  submitBtnIcon: { marginRight: s(6) },
  submitBtnText: {
    fontSize: s(13.5),
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  checklist: { gap: vs(5), paddingHorizontal: s(6) },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  checkText: { fontSize: s(11), fontFamily: fontFamily.regular, color: '#6B7280' },

  /* Error */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FCA5A5',
    borderBottomWidth: 2.5,
    borderBottomColor: '#F87171',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: vs(7),
    marginBottom: vs(10),
  },
  errorIcon: { marginRight: s(6) },
  errorBannerText: { flex: 1, fontSize: s(11.5), color: '#991B1B', fontFamily: fontFamily.medium },

  textWhite: { color: '#FFFFFF' },
  textMutedDark: { color: '#B4A8D0' },
});
