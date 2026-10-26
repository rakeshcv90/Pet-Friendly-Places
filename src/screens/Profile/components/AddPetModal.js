import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

const SPECIES_OPTIONS = [
  { id: 'Dog', label: 'Dog', emoji: '🐶', subtitle: 'Canine companion & trail runner' },
  { id: 'Cat', label: 'Cat', emoji: '🐱', subtitle: 'Feline adventurer & cozy explorer' },
  { id: 'Rabbit', label: 'Rabbit', emoji: '🐰', subtitle: 'Hoppy buddy & gentle friend' },
  { id: 'Bird', label: 'Bird', emoji: '🦜', subtitle: 'Feathered singer & sky voyager' },
  { id: 'Other', label: 'Other', emoji: '🐾', subtitle: 'Unique pack member' },
];


export const AddPetModal = ({
  visible,
  onClose,
  onAddPet,
  isDarkMode = false,
  accentColor = '#7C3AED',
}) => {
  const insets = useSafeAreaInsets();

  const [petName, setPetName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(SPECIES_OPTIONS[0]); // Default to Dog
  const [breed, setBreed] = useState('');
  const [bio, setBio] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Animated live preview card scale
  const previewScaleAnim = useRef(new Animated.Value(1)).current;

  const handleClose = () => {
    setPetName('');
    setBreed('');
    setBio('');
    setSelectedSpecies(SPECIES_OPTIONS[0]);
    setDropdownOpen(false);
    setFocusedField(null);
    onClose?.();
  };

  const isFormValid = petName.trim().length > 0 && breed.trim().length > 0;

  const handleSelectSpecies = item => {
    setSelectedSpecies(item);
    setDropdownOpen(false);

    // Subtle celebratory spring on live badge
    Animated.sequence([
      Animated.timing(previewScaleAnim, {
        toValue: 1.05,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(previewScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = () => {
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

    onAddPet?.({
      name: trimmedName,
      type: selectedSpecies.label,
      breed: trimmedBreed,
      bio: bio.trim(),
    });

    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}>
      <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={isDarkMode ? '#0A0314' : '#FFF7ED'}
          translucent={Platform.OS === 'android'}
        />

        {/* Ambient Luxury Background Glows */}
        <LinearGradient
          colors={
            isDarkMode
              ? ['#250947', '#17062E', '#0A0314']
              : ['#FFF3E8', '#FAF5FF', '#F8FAFC']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.45 }}
          style={styles.ambientGlow}
          pointerEvents="none"
        />

        {/* Paw Print Security Watermark */}
        <Ionicons
          name="paw"
          size={ms(180)}
          color={isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(124, 58, 237, 0.03)'}
          style={styles.bgWatermarkPaw}
          pointerEvents="none"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexOne}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + (Platform.OS === 'android' ? vs(14) : vs(8)),
                paddingBottom: Math.max(insets.bottom, vs(20)) + vs(85),
              },
            ]}
            keyboardShouldPersistTaps="handled">
            {/* ── Top Bar with VIP Frosted Back Capsule ── */}
            <View style={styles.topBarRow}>
              <BouncyPressable
                style={[styles.backCapsuleBtn, isDarkMode && styles.backCapsuleBtnDark]}
                activeScale={0.92}
                onPress={handleClose}>
                <Feather name="arrow-left" size={ms(16)} color="#7C3AED" style={styles.backIcon} />
                <Text style={styles.backText}>Back</Text>
              </BouncyPressable>

              <View style={[styles.vipPassTag, isDarkMode && styles.vipPassTagDark]}>
                <Ionicons name="sparkles" size={ms(10)} color="#F59E0B" style={styles.sparkleIcon} />
                <Text style={styles.vipPassTagText}>OFFICIAL REGISTRATION</Text>
              </View>
            </View>

            {/* ── Header Title & Subtitle ── */}
            <View style={styles.headerBlock}>
              <View style={styles.titleRow}>
                <Text style={[styles.pageTitle, isDarkMode && styles.textWhite]}>
                  Add a pet
                </Text>
                <Text style={styles.titlePawEmoji}> 🐾</Text>
              </View>
              <Text style={[styles.pageSubtitle, isDarkMode && styles.pageSubtitleDark]}>
                Create an official verified Pawsport for your furry travel companion.
              </Text>
            </View>

            {/* ── LIVE INTERACTIVE PAWSPORT PREVIEW CARD ── */}
            <Animated.View
              style={[
                styles.livePawsportCard,
                isDarkMode && styles.livePawsportCardDark,
                { transform: [{ scale: previewScaleAnim }] },
              ]}>
              <LinearGradient
                colors={
                  isDarkMode
                    ? ['#1E0A3C', '#2F0F5C', '#3E0D68']
                    : ['#1E103A', '#2E1065', '#3B0764']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liveCardGrad}>
                {/* Holographic Sheen Top Line */}
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardSheen}
                />

                {/* Card Watermark */}
                <Ionicons
                  name="paw"
                  size={ms(90)}
                  color="rgba(255, 255, 255, 0.04)"
                  style={styles.liveCardPawWatermark}
                />

                {/* Card Header Row */}
                <View style={styles.liveCardHeaderRow}>
                  <View style={styles.liveCardBadge}>
                    <Ionicons name="shield-checkmark" size={ms(13)} color="#FCD34D" style={styles.shieldIcon} />
                    <Text style={styles.liveCardBadgeText}>PET PAWSPORT DRAFT</Text>
                  </View>
                  <View style={styles.verifiedLivePill}>
                    <Ionicons name="checkmark-circle" size={ms(11)} color="#10B981" style={styles.checkIcon} />
                    <Text style={styles.verifiedLiveText}>READY TO ACTIVATE</Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.liveCardBodyRow}>
                  {/* 3D Gold Avatar Emblem */}
                  <View style={styles.liveAvatarOrb}>
                    <LinearGradient
                      colors={['#FDE68A', '#F59E0B']}
                      style={styles.liveAvatarGoldRing}>
                      <LinearGradient
                        colors={['#EDE9FE', '#DDD6FE', '#C4B5FD']}
                        style={styles.liveAvatarInner}>
                        <Text style={styles.liveAvatarEmoji}>{selectedSpecies.emoji}</Text>
                      </LinearGradient>
                    </LinearGradient>
                  </View>

                  {/* Pet Info Live Details */}
                  <View style={styles.liveCardDetailsCol}>
                    <Text style={styles.livePetNameText} numberOfLines={1}>
                      {petName.trim() ? `${petName.trim()}'s Pawsport` : 'Your Pet’s Pawsport'}
                    </Text>
                    <Text style={styles.livePetBreedText} numberOfLines={1}>
                      {breed.trim() ? `${breed.trim()} · Ready for adventures` : `${selectedSpecies.label} · Ready for adventures`}
                    </Text>

                    <View style={styles.liveCardMetaRow}>
                      <View style={styles.liveCardIdBadge}>
                        <Text style={styles.liveCardIdLabel}>ID: </Text>
                        <Text style={styles.liveCardIdValue}>PAW-NEW-IN</Text>
                      </View>
                      <View style={styles.livePackStatusBadge}>
                        <Text style={styles.livePackStatusText}>Active Pack 🐾</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* ── Form Fields Section ── */}
            <View style={styles.formContainer}>
              {/* Field 1: Pet Name */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                    Pet name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  {petName.trim().length > 0 && (
                    <View style={styles.filledCheckMark}>
                      <Feather name="check" size={ms(11)} color="#10B981" />
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.inputCardWrapper,
                    isDarkMode && styles.inputCardWrapperDark,
                    focusedField === 'name' && styles.inputCardWrapperFocused,
                  ]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="pricetag-outline" size={ms(16)} color={accentColor} />
                  </View>
                  <TextInput
                    style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                    placeholder="e.g. Bruno, Cleo, Mango"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={petName}
                    onChangeText={setPetName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                  />
                  {petName.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPetName('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Field 2: Species Dropdown */}
              <View style={[styles.inputGroup, styles.speciesGroup]}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                    Species <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <Text style={styles.speciesHintBadge}>Select Companion Type</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.dropdownSelectBox,
                    isDarkMode && styles.dropdownSelectBoxDark,
                    dropdownOpen && styles.dropdownSelectBoxActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setDropdownOpen(prev => !prev)}>
                  <View style={styles.dropdownSelectedValueRow}>
                    <View style={styles.speciesSelectedOrb}>
                      <Text style={styles.dropdownSelectedEmoji}>{selectedSpecies.emoji}</Text>
                    </View>
                    <View>
                      <Text style={[styles.dropdownSelectedLabel, isDarkMode && styles.textWhite]}>
                        {selectedSpecies.label}
                      </Text>
                      <Text style={[styles.dropdownSelectedSub, isDarkMode && styles.textMutedDark]}>
                        {selectedSpecies.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.chevronPill, dropdownOpen && styles.chevronPillActive]}>
                    <Feather
                      name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={ms(16)}
                      color={dropdownOpen ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#64748B'}
                    />
                  </View>
                </TouchableOpacity>

                {/* Floating Dropdown Options Menu */}
                {dropdownOpen && (
                  <View style={[styles.dropdownMenuCard, isDarkMode && styles.dropdownMenuCardDark]}>
                    {/* Header Item */}
                    <View style={styles.dropdownHeaderItem}>
                      <Feather name="check" size={ms(13)} color="#94A3B8" style={styles.checkIconHeader} />
                      <Text style={styles.dropdownHeaderText}>Choose a species</Text>
                    </View>

                    {/* Species List Items */}
                    {SPECIES_OPTIONS.map(species => {
                      const isSelected = selectedSpecies.id === species.id;
                      return (
                        <TouchableOpacity
                          key={species.id}
                          style={[
                            styles.dropdownOptionRow,
                            isSelected && styles.dropdownOptionRowSelected,
                            !isSelected && isDarkMode && styles.dropdownOptionRowUnselectedDark,
                          ]}
                          activeOpacity={0.8}
                          onPress={() => handleSelectSpecies(species)}>
                          <View style={styles.dropdownOptionLeft}>
                            <Text style={styles.dropdownOptionEmoji}>{species.emoji}</Text>
                            <View>
                              <Text
                                style={[
                                  styles.dropdownOptionLabel,
                                  isSelected && styles.dropdownOptionLabelSelected,
                                  !isSelected && isDarkMode && styles.textWhite,
                                ]}>
                                {species.label}
                              </Text>
                              <Text
                                style={[
                                  styles.dropdownOptionSub,
                                  isSelected && styles.dropdownOptionSubSelected,
                                  !isSelected && isDarkMode && styles.textMutedDark,
                                ]}>
                                {species.subtitle}
                              </Text>
                            </View>
                          </View>

                          {isSelected && (
                            <View style={styles.selectedTickCircle}>
                              <Feather name="check" size={ms(12)} color="#3B82F6" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Field 3: Breed */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                    Breed <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  {breed.trim().length > 0 && (
                    <View style={styles.filledCheckMark}>
                      <Feather name="check" size={ms(11)} color="#10B981" />
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.inputCardWrapper,
                    isDarkMode && styles.inputCardWrapperDark,
                    focusedField === 'breed' && styles.inputCardWrapperFocused,
                  ]}>
                  <View style={styles.inputIconBox}>
                    <Ionicons name="ribbon-outline" size={ms(16)} color={accentColor} />
                  </View>
                  <TextInput
                    style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                    placeholder="e.g. Golden Retriever, Indie, Tabby"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    value={breed}
                    onChangeText={setBreed}
                    onFocus={() => setFocusedField('breed')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="next"
                  />
                  {breed.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setBreed('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.clearBtn}>
                      <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Field 4: Bio (optional) + Quick Trait Chips */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                    Bio <Text style={styles.optionalText}>(optional)</Text>
                  </Text>
                  <Text style={[styles.charCountBadge, isDarkMode && styles.charCountBadgeDark]}>
                    {`${bio.length}/400`}
                  </Text>
                </View>

                {/* Bio Multiline Textarea */}
                <View
                  style={[
                    styles.bioCardWrapper,
                    isDarkMode && styles.bioCardWrapperDark,
                    focusedField === 'bio' && styles.inputCardWrapperFocused,
                  ]}>
                  <TextInput
                    style={[styles.bioTextInput, isDarkMode && styles.textWhite]}
                    placeholder="About your pet, personality, favourite spots, travel style..."
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    multiline
                    maxLength={400}
                    value={bio}
                    onChangeText={setBio}
                    onFocus={() => setFocusedField('bio')}
                    onBlur={() => setFocusedField(null)}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* ── Fixed Floating Bottom Dock with 3D Create Pawsport Button ── */}
          <View
            style={[
              styles.floatingBottomDock,
              isDarkMode && styles.floatingBottomDockDark,
              { paddingBottom: Math.max(insets.bottom, vs(14)) },
            ]}>
            {isFormValid ? (
              <BouncyPressable
                style={styles.submitBtnActive}
                activeScale={0.95}
                onPress={handleSubmit}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#581C87']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtnGradient}>
                  <View style={styles.btnContentRow}>
                    <Text style={styles.submitBtnActiveText}>Create Pawsport</Text>
                    <Text style={styles.btnPassportEmoji}> 🛂</Text>
                  </View>
                </LinearGradient>
              </BouncyPressable>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtnDisabled, isDarkMode && styles.submitBtnDisabledDark]}
                activeOpacity={0.8}
                onPress={handleSubmit}>
                <View style={styles.btnContentRow}>
                  <Text
                    style={[
                      styles.submitBtnDisabledText,
                      isDarkMode && styles.submitBtnDisabledTextDark,
                    ]}>
                    Create Pawsport
                  </Text>
                  <Text style={styles.btnPassportEmojiMuted}> 🛂</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default AddPetModal;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  rootContainerDark: {
    backgroundColor: '#0A0314',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(320),
  },
  bgWatermarkPaw: {
    position: 'absolute',
    right: -s(30),
    top: vs(120),
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(20),
  },

  /* Top Bar */
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(14),
  },
  backCapsuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingHorizontal: s(13),
    paddingVertical: vs(7),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  backCapsuleBtnDark: {
    backgroundColor: '#1C0D34',
    borderColor: '#381665',
  },
  backIcon: {
    marginRight: s(6),
  },
  backText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  vipPassTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vipPassTagDark: {
    backgroundColor: '#2E1A05',
    borderColor: '#78350F',
  },
  sparkleIcon: {
    marginRight: s(4),
  },
  vipPassTagText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#B45309',
    letterSpacing: 0.6,
  },

  /* Header Block */
  headerBlock: {
    marginBottom: vs(14),
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

  /* ── Live Pawsport Card Preview ── */
  livePawsportCard: {
    borderRadius: s(20),
    marginBottom: vs(20),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 7,
  },
  livePawsportCardDark: {
    shadowColor: '#A855F7',
    shadowOpacity: 0.35,
  },
  liveCardGrad: {
    borderRadius: s(20),
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    borderTopColor: '#C4B5FD',
    borderBottomWidth: 3.5,
    borderBottomColor: '#1E0747',
    padding: s(16),
    position: 'relative',
    overflow: 'hidden',
  },
  cardSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(50),
    borderRadius: s(20),
  },
  liveCardPawWatermark: {
    position: 'absolute',
    right: -s(10),
    bottom: -s(15),
  },
  liveCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: vs(10),
  },
  liveCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shieldIcon: {
    marginRight: s(5),
  },
  liveCardBadgeText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FDE68A',
    letterSpacing: 1,
  },
  verifiedLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: s(8),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderWidth: 0.8,
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  checkIcon: {
    marginRight: s(3),
  },
  verifiedLiveText: {
    fontSize: s(8),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#34D399',
    letterSpacing: 0.4,
  },
  liveCardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveAvatarOrb: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    marginRight: s(12),
  },
  liveAvatarGoldRing: {
    flex: 1,
    borderRadius: s(26),
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveAvatarInner: {
    flex: 1,
    width: '100%',
    borderRadius: s(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveAvatarEmoji: {
    fontSize: s(24),
  },
  liveCardDetailsCol: {
    flex: 1,
  },
  livePetNameText: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  livePetBreedText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#DDD6FE',
    marginTop: vs(1),
  },
  liveCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(5),
  },
  liveCardIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: s(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(1.5),
    marginRight: s(6),
  },
  liveCardIdLabel: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FCD34D',
  },
  liveCardIdValue: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  livePackStatusBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.22)',
    borderRadius: s(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(1.5),
  },
  livePackStatusText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#E9D5FF',
  },

  /* ── Form Inputs ── */
  formContainer: {
    marginTop: vs(2),
  },
  inputGroup: {
    marginBottom: vs(18),
  },
  speciesGroup: {
    zIndex: 10,
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

  /* Input Card Wrappers with Depth */
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

  /* Species Dropdown Box */
  dropdownSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    height: vs(54),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  dropdownSelectBoxDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
  },
  dropdownSelectBoxActive: {
    borderColor: '#7C3AED',
    borderBottomColor: '#5B21B6',
    backgroundColor: '#FAF5FF',
  },
  dropdownSelectedValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  speciesSelectedOrb: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  dropdownSelectedEmoji: {
    fontSize: s(20),
  },
  dropdownSelectedLabel: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
  },
  dropdownSelectedSub: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(1),
  },
  chevronPill: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronPillActive: {
    backgroundColor: '#7C3AED',
  },

  /* Floating Dropdown Card */
  dropdownMenuCard: {
    marginTop: vs(8),
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: s(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  dropdownMenuCardDark: {
    backgroundColor: '#1A0B34',
    borderColor: '#34185C',
  },
  dropdownHeaderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: vs(4),
  },
  checkIconHeader: {
    marginRight: s(6),
  },
  dropdownHeaderText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#94A3B8',
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    borderRadius: s(10),
    marginVertical: vs(2),
  },
  dropdownOptionRowUnselectedDark: {
    backgroundColor: '#17092E',
  },
  dropdownOptionRowSelected: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownOptionEmoji: {
    fontSize: s(18),
    marginRight: s(10),
  },
  dropdownOptionLabel: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
  },
  dropdownOptionLabelSelected: {
    color: '#FFFFFF',
  },
  dropdownOptionSub: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(1),
  },
  dropdownOptionSubSelected: {
    color: '#E0F2FE',
  },
  selectedTickCircle: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Bio Textarea */
  bioCardWrapper: {
    height: vs(125),
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

  /* ── Fixed Floating Bottom Action Dock ── */
  floatingBottomDock: {
    paddingHorizontal: s(20),
    paddingTop: vs(10),
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 12,
  },
  floatingBottomDockDark: {
    backgroundColor: 'rgba(10, 3, 20, 0.94)',
    borderTopColor: '#280F4A',
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
  btnPassportEmoji: {
    fontSize: s(16),
  },
  btnPassportEmojiMuted: {
    fontSize: s(16),
    opacity: 0.6,
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
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
