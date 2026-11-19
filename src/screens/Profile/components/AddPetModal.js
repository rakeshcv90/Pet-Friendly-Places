import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { NightSky } from '../../Community/NightSky';
import { Bob, Enter } from '../../Community/Motion';
import { LoaderCard } from '../../../components/common/Loader';
import { PhotoSourceSheet } from '../../../components/common/PhotoSourceSheet';
import {
  requestCamera,
  openPhoneSettings,
} from '../../../services/permissions/permissions';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';

const SPECIES_OPTIONS = [
  { id: 'Dog', label: 'Dog', emoji: '🐶' },
  { id: 'Cat', label: 'Cat', emoji: '🐱' },
  { id: 'Rabbit', label: 'Rabbit', emoji: '🐰' },
  { id: 'Bird', label: 'Bird', emoji: '🦜' },
  { id: 'Other', label: 'Other', emoji: '🐾' },
];

export const AddPetModal = ({ visible, onClose, onAddPet, isDarkMode = false }) => {
  const insets = useSafeAreaInsets();

  const [petName, setPetName] = useState('');
  const [species, setSpecies] = useState(SPECIES_OPTIONS[0]);
  const [breed, setBreed] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);

  // Springs the preview emoji when the species changes
  const pop = useRef(new Animated.Value(1)).current;

  const handleClose = () => {
    setPetName('');
    setBreed('');
    setBio('');
    setPhoto(null);
    setSpecies(SPECIES_OPTIONS[0]);
    setFocusedField(null);
    onClose?.();
  };

  const isFormValid = petName.trim().length > 0 && breed.trim().length > 0;

  const handleSelectSpecies = item => {
    setSpecies(item);
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.18, duration: 120, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePickResult = response => {
    const asset = response?.assets?.[0];
    if (response?.didCancel) {
      return;
    }
    if (response?.errorCode) {
      Alert.alert('Photo', response.errorMessage || 'Unable to open your photos.');
    } else if (asset?.uri) {
      setPhoto(asset);
    }
  };

  const pickFromGallery = () => {
    // The system photo picker needs no permission: the app only receives what the user picks
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.85, selectionLimit: 1, maxWidth: 1600, maxHeight: 1600 },
      handlePickResult,
    );
  };

  const takePhoto = async () => {
    const status = await requestCamera();
    if (status === 'denied' || status === 'blocked') {
      Alert.alert(
        'Camera permission needed',
        'Allow camera access to take a photo of your pet. You can change this in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openPhoneSettings() },
        ],
      );
      return;
    }
    // 'unavailable' means this phone cannot report it; the camera screen still asks on its own
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.85,
        maxWidth: 1600,
        maxHeight: 1600,
        saveToPhotos: false,
      },
      handlePickResult,
    );
  };

  const pickPhoto = () => setSourceSheetOpen(true);

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    const trimmedName = petName.trim();
    if (!trimmedName) {
      Alert.alert('Pet Name Required', 'Please enter your furry friend’s name.');
      return;
    }
    const trimmedBreed = breed.trim();
    if (!trimmedBreed) {
      Alert.alert('Breed Required', 'Please specify your pet’s breed or mix.');
      return;
    }

    // The form stays open if saving fails, so nothing typed is lost
    setSubmitting(true);
    try {
      await onAddPet?.({
        name: trimmedName,
        type: species.label,
        breed: trimmedBreed,
        bio: bio.trim(),
        photo,
      });
      // Hide the loader before the form closes: iOS black-screens when two modals dismiss together
      setSubmitting(false);
      handleClose();
    } catch (error) {
      Alert.alert(
        'Could not add pet',
        error?.response?.data?.error || error?.message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const placeholderColor = isDarkMode ? '#64748B' : '#94A3B8';
  const fieldStyle = name => [
    styles.field,
    isDarkMode && styles.fieldDark,
    focusedField === name && styles.fieldFocused,
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}>
      <View style={[styles.root, isDarkMode && styles.rootDark]}>
        <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}>
            {/* Hero with a live preview of the pawsport */}
            <LinearGradient
              colors={[DEEP_PURPLE, PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(8) }]}>
              <LinearGradient
                pointerEvents="none"
                colors={[DEEP_PURPLE, 'rgba(59,16,143,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.heroTopFade, { height: insets.top + s(70) }]}
              />
              <NightSky topInset={insets.top} />

              <View style={styles.heroTop}>
                <BouncyPressable
                  testID="add-pet-close-btn"
                  accessibilityLabel="Close"
                  style={styles.closeBtn}
                  activeScale={0.9}
                  onPress={handleClose}>
                  <Feather name="x" size={ms(18)} color="#FFFFFF" />
                </BouncyPressable>
                <Text style={styles.heroEyebrow}>NEW PAWSPORT</Text>
                <View style={styles.closeBtnSpacer} />
              </View>

              <Text style={styles.heroTitle}>Add a pet</Text>
              <Text style={styles.heroDesc}>
                Create a digital pawsport for your companion in under a minute.
              </Text>

              <View style={styles.preview}>
                <Bob style={styles.previewEmblem} distance={3} duration={2400}>
                  <Animated.Text style={[styles.previewEmoji, { transform: [{ scale: pop }] }]}>
                    {species.emoji}
                  </Animated.Text>
                </Bob>
                <View style={styles.previewText}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {petName.trim() ? `${petName.trim()}'s Pawsport` : 'Your pet’s Pawsport'}
                  </Text>
                  <Text style={styles.previewMeta} numberOfLines={1}>
                    {[breed.trim(), species.label].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={styles.previewBadge}>
                  <Ionicons name="shield-checkmark" size={ms(14)} color="#6EE7B7" />
                </View>
              </View>
            </LinearGradient>

            {/* Species */}
            <Enter index={0}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>Companion type</Text>
              <View style={styles.speciesRow}>
                {SPECIES_OPTIONS.map(option => {
                  const active = option.id === species.id;
                  return (
                    <BouncyPressable
                      key={option.id}
                      testID={`species-${option.id}`}
                      activeScale={0.92}
                      onPress={() => handleSelectSpecies(option)}
                      style={[
                        styles.speciesTile,
                        isDarkMode && styles.speciesTileDark,
                        active && styles.speciesTileActive,
                      ]}>
                      <Text style={styles.speciesEmoji}>{option.emoji}</Text>
                      <Text
                        style={[
                          styles.speciesText,
                          isDarkMode && styles.mutedDark,
                          active && styles.speciesTextActive,
                        ]}>
                        {option.label}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </View>
            </Enter>

            {/* Photo */}
            <Enter index={1}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                Photo <Text style={styles.optional}>(optional)</Text>
              </Text>
              <BouncyPressable
                testID="add-pet-photo"
                style={[styles.photoRow, isDarkMode && styles.fieldDark]}
                activeScale={0.97}
                onPress={pickPhoto}>
                {photo ? (
                  <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                ) : (
                  <View style={[styles.photoThumb, styles.photoEmpty]}>
                    <Feather name="camera" size={ms(18)} color="#7C3AED" />
                  </View>
                )}
                <Text style={[styles.photoText, isDarkMode && styles.inputDark]}>
                  {photo ? 'Change photo' : 'Add a profile photo'}
                </Text>
                <Feather name="chevron-right" size={ms(16)} color="#94A3B8" />
              </BouncyPressable>
            </Enter>

            {/* Name */}
            <Enter index={1}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                Pet name <Text style={styles.required}>*</Text>
              </Text>
              <View style={fieldStyle('name')}>
                <Feather name="heart" size={ms(16)} color="#7C3AED" />
                <TextInput
                  testID="add-pet-name"
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  placeholder="e.g. Bruno, Cleo, Mango"
                  placeholderTextColor={placeholderColor}
                  value={petName}
                  onChangeText={setPetName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={40}
                />
              </View>
            </Enter>

            {/* Breed */}
            <Enter index={2}>
              <Text style={[styles.label, isDarkMode && styles.labelDark]}>
                Breed <Text style={styles.required}>*</Text>
              </Text>
              <View style={fieldStyle('breed')}>
                <Feather name="award" size={ms(16)} color="#7C3AED" />
                <TextInput
                  testID="add-pet-breed"
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  placeholder="e.g. Golden Retriever, Indie, Tabby"
                  placeholderTextColor={placeholderColor}
                  value={breed}
                  onChangeText={setBreed}
                  onFocus={() => setFocusedField('breed')}
                  onBlur={() => setFocusedField(null)}
                  maxLength={60}
                />
              </View>
            </Enter>

            {/* Bio */}
            <Enter index={3}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, styles.labelInline, isDarkMode && styles.labelDark]}>
                  About <Text style={styles.optional}>(optional)</Text>
                </Text>
                <Text style={styles.counter}>{bio.length}/400</Text>
              </View>
              <View style={[fieldStyle('bio'), styles.bioField]}>
                <TextInput
                  testID="add-pet-bio"
                  style={[styles.input, styles.bioInput, isDarkMode && styles.inputDark]}
                  placeholder="Personality, favourite spots, travel style..."
                  placeholderTextColor={placeholderColor}
                  value={bio}
                  onChangeText={setBio}
                  onFocus={() => setFocusedField('bio')}
                  onBlur={() => setFocusedField(null)}
                  multiline
                  maxLength={400}
                  textAlignVertical="top"
                />
              </View>
            </Enter>
          </ScrollView>

          {/* Submit dock */}
          <View
            style={[
              styles.dock,
              isDarkMode && styles.dockDark,
              { paddingBottom: Math.max(insets.bottom, vs(14)) },
            ]}>
            <BouncyPressable
              testID="add-pet-submit"
              style={[styles.submit, !isFormValid && styles.submitDisabled]}
              activeScale={0.96}
              onPress={handleSubmit}>
              <LinearGradient
                colors={
                  isFormValid
                    ? ['#8B5CF6', '#7C3AED', '#6D28D9']
                    : ['#CBD5E1', '#CBD5E1', '#CBD5E1']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}>
                <Text style={styles.submitText}>Create Pawsport</Text>
                <Ionicons name="shield-checkmark" size={ms(17)} color="#FFFFFF" />
              </LinearGradient>
            </BouncyPressable>
          </View>
        </KeyboardAvoidingView>

        {/* A plain overlay, not a Loader modal: a modal inside this modal black-screens iOS */}
        {submitting ? (
          <View style={styles.submitOverlay} pointerEvents="auto">
            <LoaderCard label="Creating pawsport…" subtitle="" isDarkMode={isDarkMode} />
          </View>
        ) : null}

        <PhotoSourceSheet
          visible={sourceSheetOpen}
          onClose={() => setSourceSheetOpen(false)}
          onCamera={takePhoto}
          onGallery={pickFromGallery}
          onRemove={photo ? () => setPhoto(null) : undefined}
          title="Pet photo"
          isDarkMode={isDarkMode}
        />
      </View>
    </Modal>
  );
};

export default AddPetModal;

const styles = StyleSheet.create({
  submitOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 7, 29, 0.55)',
    zIndex: 50,
  },
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  rootDark: { backgroundColor: '#0F071D' },
  scroll: { paddingBottom: vs(24) },
  hero: {
    paddingHorizontal: s(16),
    paddingBottom: s(20),
    marginBottom: vs(18),
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
  },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnSpacer: { width: s(34) },
  heroEyebrow: {
    fontSize: ms(10),
    letterSpacing: 1.8,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.bold,
  },
  heroTitle: {
    marginTop: s(14),
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(26),
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  heroDesc: {
    marginTop: s(4),
    marginBottom: s(16),
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(18),
    color: 'rgba(255,255,255,0.85)',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(12),
    borderRadius: s(18),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.35)',
  },
  previewEmblem: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: '#EDE9FE',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  previewEmoji: { fontSize: s(24) },
  previewText: { flex: 1, marginLeft: s(12) },
  previewName: {
    fontSize: s(15),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  previewMeta: {
    marginTop: s(1),
    fontSize: s(11.5),
    color: 'rgba(255,255,255,0.75)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  previewBadge: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(16,185,129,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginHorizontal: s(16),
    marginBottom: vs(8),
    fontSize: s(12.5),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  labelInline: { marginHorizontal: 0, marginBottom: 0 },
  labelDark: { color: '#E2E8F0' },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginBottom: vs(8),
  },
  required: { color: '#EC4899' },
  optional: { color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
  counter: { fontSize: s(11), color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
  speciesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginBottom: vs(18),
  },
  speciesTile: {
    width: (s(360) - s(32) - s(32)) / 5,
    flexGrow: 1,
    marginHorizontal: s(3),
    alignItems: 'center',
    paddingVertical: vs(10),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  speciesTileDark: {
    backgroundColor: '#1A0B30',
    borderColor: '#2E1654',
    borderBottomColor: '#3B1F66',
  },
  speciesTileActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#7C3AED',
    borderBottomColor: '#6D28D9',
  },
  speciesEmoji: { fontSize: s(24) },
  speciesText: {
    marginTop: vs(3),
    fontSize: s(10.5),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  speciesTextActive: { color: '#6D28D9' },
  mutedDark: { color: '#94A3B8' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginBottom: vs(18),
    paddingHorizontal: s(14),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    marginBottom: vs(18),
    padding: s(10),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  photoThumb: { width: s(44), height: s(44), borderRadius: s(14) },
  photoEmpty: { backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  photoText: {
    flex: 1,
    marginLeft: s(12),
    fontSize: s(13.5),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  fieldDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#3B1F66' },
  fieldFocused: { borderColor: '#7C3AED', borderBottomColor: '#6D28D9' },
  input: {
    flex: 1,
    paddingVertical: vs(13),
    marginLeft: s(10),
    fontSize: s(14),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.medium,
  },
  inputDark: { color: '#FFFFFF' },
  bioField: { alignItems: 'flex-start' },
  bioInput: { minHeight: vs(96), marginLeft: 0, paddingTop: vs(13) },
  dock: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  dockDark: { backgroundColor: '#150A28', borderTopColor: '#2E1654' },
  submit: {
    borderRadius: s(18),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitDisabled: { shadowOpacity: 0, elevation: 0 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: vs(14),
    borderRadius: s(18),
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(30,7,71,0.35)',
  },
  submitText: {
    fontSize: s(15),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
});
