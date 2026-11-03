import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ModernConfirmModal } from './components/ModernConfirmModal';

// Exact 8 reason options matching website screenshot
export const CONTACT_REASONS = [
  'Add a place',
  'Claim listing',
  'Correct information',
  'Delisting request',
  'Advertising',
  'Collaboration',
  'Technical issue',
  'Other',
];

export const CONTACT_TOPICS = [
  'Adding a new pet-friendly place',
  'Correcting listing details',
  'Claiming a business listing',
  'Requesting delisting',
  'Advertising opportunities',
  'Travel collaborations',
  'Pet-friendly resort or hotel partnerships',
  'Technical issues',
  'Media and content enquiries',
];

const TOPIC_ICONS = {
  'Adding a new pet-friendly place': 'paw',
  'Correcting listing details': 'create-outline',
  'Claiming a business listing': 'business-outline',
  'Requesting delisting': 'trash-outline',
  'Advertising opportunities': 'megaphone-outline',
  'Travel collaborations': 'heart-outline',
  'Pet-friendly resort or hotel partnerships': 'bed-outline',
  'Technical issues': 'build-outline',
  'Media and content enquiries': 'newspaper-outline',
};

export const ContactUsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [listingUrl, setListingUrl] = useState('');
  const [message, setMessage] = useState('');

  // UI Interactive states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Animations
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(chevronAnim, {
        toValue: isDropdownOpen ? 1 : 0,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownAnim, {
        toValue: isDropdownOpen ? 1 : 0,
        duration: isDropdownOpen ? 220 : 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDropdownOpen, chevronAnim, dropdownAnim]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const dropdownScale = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  const toggleDropdown = () => {
    Keyboard.dismiss();
    setIsDropdownOpen(prev => !prev);
  };

  const handleSelectReason = selectedReason => {
    setReason(selectedReason);
    setIsDropdownOpen(false);
    if (errorMessage) setErrorMessage('');
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:hello@petfriendlyplaces.in');
  };

  const handleOpenInstagram = () => {
    Linking.openURL('https://instagram.com/travelwithtailsandrubicon').catch(() => {});
  };

  const handleOpenYouTube = () => {
    Linking.openURL('https://www.youtube.com/@TravelWithTailsAndRubicon').catch(() => {});
  };

  const handleOpenFacebook = () => {
    Linking.openURL('https://facebook.com/travelwithtailsandrubicon').catch(() => {});
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    setIsDropdownOpen(false);
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Please select a reason for contacting us.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please write your message.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 600);
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FFFFFF'}
      />

      {/* ── Top Header Navigation Bar ── */}
      <View style={[styles.headerBar, isDarkMode && styles.headerBarDark, { paddingTop: insets.top + vs(4) }]}>
        <BouncyPressable
          testID="contact-us-back-btn"
          accessibilityLabel="Back"
          style={[styles.backBtn, isDarkMode && styles.backBtnDark]}
          activeScale={0.88}
          onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={ms(20)}
            color={isDarkMode ? '#FFFFFF' : '#1E1B4B'}
          />
        </BouncyPressable>

        <Text style={[styles.headerBarTitle, isDarkMode && styles.textWhite]}>
          Contact Us
        </Text>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Premium Loader Modal */}
      <Loader
        visible={isSubmitting}
        title="Submitting message..."
        subtitle="Sending your inquiry to the PetFriendly team..."
      />

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? vs(32) : 0) + vs(64),
          },
        ]}
        enableOnAndroid={true}
        enableResetScrollToCoords={false}
        extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
        keyboardOpeningTime={0}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Premium Mobile Hero Card ── */}
        <View style={styles.heroCardOuter}>
          <LinearGradient
            colors={
              isDarkMode
                ? ['#1C0B36', '#260D49', '#1A0738']
                : ['#3B0764', '#581C87', '#6D28D9']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}>
            <View style={styles.heroPawWatermark} pointerEvents="none">
              <Ionicons name="paw" size={ms(95)} color="rgba(255, 255, 255, 0.05)" />
            </View>

            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={ms(10)} color="#FCD34D" style={styles.heroSparkle} />
                <Text style={styles.heroBadgeText}>PETFRIENDLY SUPPORT</Text>
              </View>
              <View style={styles.heroResponsePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.heroResponseText}>Fast Response</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Contact Pet Friendly Places</Text>
            <Text style={styles.heroSubtitle}>
              Have a question, correction, listing request or collaboration idea? We would love to hear from you.
            </Text>
          </LinearGradient>
        </View>

        {/* ── Section 1: Topics We Can Help With (Informative Guide) ── */}
        <View style={[styles.sectionBlock, isDarkMode && styles.sectionBlockDark]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconDisc, styles.sectionIconAmber]}>
              <Ionicons name="information-circle-outline" size={ms(15)} color="#D97706" />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
                Use this page to contact us about:
              </Text>
              <Text style={[styles.sectionSub, isDarkMode && styles.textMutedDark]}>
                Topics and inquiry categories our team supports
              </Text>
            </View>
          </View>

          <View style={[styles.infoGuideCard, isDarkMode && styles.infoGuideCardDark]}>
            {CONTACT_TOPICS.map((topic, index) => {
              const iconName = TOPIC_ICONS[topic] || 'paw';
              return (
                <View
                  key={index}
                  style={[
                    styles.infoTopicRow,
                    index < CONTACT_TOPICS.length - 1 && styles.infoTopicDivider,
                    isDarkMode && styles.infoTopicDividerDark,
                  ]}>
                  <View style={[styles.infoIconDisc, isDarkMode && styles.infoIconDiscDark]}>
                    <Ionicons
                      name={iconName}
                      size={ms(12)}
                      color={isDarkMode ? '#C084FC' : '#7C3AED'}
                    />
                  </View>
                  <Text style={[styles.infoTopicText, isDarkMode && styles.textWhite]}>
                    {topic}
                  </Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={ms(13)}
                    color={isDarkMode ? '#34D399' : '#059669'}
                    style={styles.infoCheckmark}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Section 2: Reach Us Directly (Executive 3D Social Cards) ── */}
        <View style={[styles.sectionBlock, isDarkMode && styles.sectionBlockDark]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconDisc, styles.sectionIconTeal]}>
              <Ionicons name="chatbubble-ellipses-outline" size={ms(14)} color="#0891B2" />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
                Reach us directly
              </Text>
              <Text style={[styles.sectionSub, isDarkMode && styles.textMutedDark]}>
                Connect directly with our community pack
              </Text>
            </View>
          </View>

          <View style={styles.channelsStack}>
            {/* Instagram Executive Card */}
            <BouncyPressable
              activeScale={0.97}
              style={[styles.socialConnectCard, isDarkMode && styles.socialConnectCardDark]}
              onPress={handleOpenInstagram}>
              <LinearGradient
                colors={['#833AB4', '#FD1D1D', '#F77737']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.socialIconDisc}>
                <Ionicons name="logo-instagram" size={ms(18)} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.socialTextWrap}>
                <View style={styles.socialHeaderLine}>
                  <Text style={[styles.socialTitle, isDarkMode && styles.textWhite]}>
                    Instagram
                  </Text>
                  <View style={styles.socialFollowBadge}>
                    <Text style={styles.socialFollowText}>Follow</Text>
                  </View>
                </View>
                <Text style={[styles.socialHandleText, isDarkMode && styles.socialHandleTextDark]}>
                  @travelwithtailsandrubicon
                </Text>
                <Text style={[styles.socialSubDetail, isDarkMode && styles.textMutedDark]}>
                  Stories, reels and pet travel inspiration
                </Text>
              </View>
              <View style={[styles.socialActionBubble, isDarkMode && styles.socialActionBubbleDark]}>
                <Feather name="arrow-up-right" size={ms(15)} color={isDarkMode ? '#C084FC' : '#7C3AED'} />
              </View>
            </BouncyPressable>

            {/* YouTube Executive Card */}
            <BouncyPressable
              activeScale={0.97}
              style={[styles.socialConnectCard, isDarkMode && styles.socialConnectCardDark]}
              onPress={handleOpenYouTube}>
              <View style={[styles.socialIconDisc, styles.youtubeIconDisc]}>
                <Ionicons name="logo-youtube" size={ms(18)} color="#FFFFFF" />
              </View>
              <View style={styles.socialTextWrap}>
                <View style={styles.socialHeaderLine}>
                  <Text style={[styles.socialTitle, isDarkMode && styles.textWhite]}>
                    YouTube
                  </Text>
                  <View style={[styles.socialFollowBadge, styles.youtubeFollowBadge]}>
                    <Text style={[styles.socialFollowText, styles.youtubeFollowText]}>Subscribe</Text>
                  </View>
                </View>
                <Text style={[styles.socialHandleText, styles.youtubeHandleText]}>
                  @TravelWithTailsAndRubicon
                </Text>
                <Text style={[styles.socialSubDetail, isDarkMode && styles.textMutedDark]}>
                  Long-form trip videos with the pack
                </Text>
              </View>
              <View style={[styles.socialActionBubble, isDarkMode && styles.socialActionBubbleDark]}>
                <Feather name="arrow-up-right" size={ms(15)} color={isDarkMode ? '#C084FC' : '#7C3AED'} />
              </View>
            </BouncyPressable>

            {/* Facebook Executive Card */}
            <BouncyPressable
              activeScale={0.97}
              style={[styles.socialConnectCard, isDarkMode && styles.socialConnectCardDark]}
              onPress={handleOpenFacebook}>
              <View style={[styles.socialIconDisc, styles.facebookIconDisc]}>
                <Ionicons name="logo-facebook" size={ms(19)} color="#FFFFFF" />
              </View>
              <View style={styles.socialTextWrap}>
                <View style={styles.socialHeaderLine}>
                  <Text style={[styles.socialTitle, isDarkMode && styles.textWhite]}>
                    Facebook
                  </Text>
                  <View style={[styles.socialFollowBadge, styles.facebookFollowBadge]}>
                    <Text style={[styles.socialFollowText, styles.facebookFollowText]}>Follow</Text>
                  </View>
                </View>
                <Text style={[styles.socialHandleText, styles.facebookHandleText]}>
                  @travelwithtailsandrubicon
                </Text>
                <Text style={[styles.socialSubDetail, isDarkMode && styles.textMutedDark]}>
                  Community updates, photos and pet events
                </Text>
              </View>
              <View style={[styles.socialActionBubble, isDarkMode && styles.socialActionBubbleDark]}>
                <Feather name="arrow-up-right" size={ms(15)} color={isDarkMode ? '#C084FC' : '#7C3AED'} />
              </View>
            </BouncyPressable>
          </View>
        </View>

        {/* ── Section 3: Send Us a Message (Luxury Mobile Form) ── */}
        <View style={[styles.sectionBlock, isDarkMode && styles.sectionBlockDark, styles.formBlockContainer]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconDisc, styles.sectionIconEmerald]}>
              <Feather name="mail" size={ms(14)} color="#059669" />
            </View>
            <View style={styles.sectionTitleWrap}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
                Send us a message
              </Text>
              <Text style={[styles.sectionSub, isDarkMode && styles.textMutedDark]}>
                We usually reply within 2-4 hours
              </Text>
            </View>
          </View>

          {/* Error Banner */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={ms(15)} color="#DC2626" style={styles.errorIcon} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Field: Name * */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputBox3D,
                isDarkMode && styles.inputBox3DDark,
                focusedField === 'name' && styles.inputFocused,
              ]}>
              <Feather
                name="user"
                size={ms(15)}
                color={focusedField === 'name' ? '#7C3AED' : (isDarkMode ? '#94A3B8' : '#A1A1AA')}
                style={styles.fieldLeadIcon}
              />
              <TextInput
                testID="contact-name-input"
                style={[styles.nativeInput, isDarkMode && styles.textWhite]}
                placeholder="Your full name"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                value={name}
                onFocus={() => {
                  setFocusedField('name');
                  setIsDropdownOpen(false);
                }}
                onBlur={() => setFocusedField(null)}
                onChangeText={txt => {
                  setName(txt);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>
          </View>

          {/* Field: Email * */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Email <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputBox3D,
                isDarkMode && styles.inputBox3DDark,
                focusedField === 'email' && styles.inputFocused,
              ]}>
              <Feather
                name="mail"
                size={ms(15)}
                color={focusedField === 'email' ? '#7C3AED' : (isDarkMode ? '#94A3B8' : '#A1A1AA')}
                style={styles.fieldLeadIcon}
              />
              <TextInput
                testID="contact-email-input"
                style={[styles.nativeInput, isDarkMode && styles.textWhite]}
                placeholder="you@example.com"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onFocus={() => {
                  setFocusedField('email');
                  setIsDropdownOpen(false);
                }}
                onBlur={() => setFocusedField(null)}
                onChangeText={txt => {
                  setEmail(txt);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>
          </View>

          {/* Field: Phone (optional) */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Phone (optional)
            </Text>
            <View
              style={[
                styles.inputBox3D,
                isDarkMode && styles.inputBox3DDark,
                focusedField === 'phone' && styles.inputFocused,
              ]}>
              <Feather
                name="phone"
                size={ms(15)}
                color={focusedField === 'phone' ? '#7C3AED' : (isDarkMode ? '#94A3B8' : '#A1A1AA')}
                style={styles.fieldLeadIcon}
              />
              <TextInput
                testID="contact-phone-input"
                style={[styles.nativeInput, isDarkMode && styles.textWhite]}
                placeholder="+91 98765 43210"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                keyboardType="phone-pad"
                value={phone}
                onFocus={() => {
                  setFocusedField('phone');
                  setIsDropdownOpen(false);
                }}
                onBlur={() => setFocusedField(null)}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* ── Field: Reason * with Floating 3D Dropdown (Zero layout shift on inputs) ── */}
          <View style={[styles.fieldWrap, styles.reasonFieldWrap]}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Reason <Text style={styles.requiredStar}>*</Text>
            </Text>

            {/* Selector Box */}
            <TouchableOpacity
              testID="contact-reason-picker"
              style={[
                styles.inputBox3D,
                isDarkMode && styles.inputBox3DDark,
                isDropdownOpen && styles.selectBoxActive,
              ]}
              activeOpacity={0.8}
              onPress={toggleDropdown}>
              <Feather
                name="tag"
                size={ms(15)}
                color={isDropdownOpen ? '#EC4899' : (isDarkMode ? '#94A3B8' : '#A1A1AA')}
                style={styles.fieldLeadIcon}
              />
              <Text
                style={[
                  styles.selectText,
                  !reason && styles.selectPlaceholderText,
                  isDarkMode && !!reason && styles.textWhite,
                ]}>
                {reason || 'Select reason...'}
              </Text>
              <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                <Feather
                  name="chevron-down"
                  size={ms(17)}
                  color={isDropdownOpen ? '#EC4899' : (isDarkMode ? '#94A3B8' : '#64748B')}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Floating 3D Dropdown (Position Absolute to never move Name and Email) */}
            {isDropdownOpen && (
              <Animated.View
                style={[
                  styles.floatingDropdownMenu3D,
                  isDarkMode && styles.dropdownMenu3DDark,
                  {
                    opacity: dropdownAnim,
                    transform: [{ scale: dropdownScale }],
                  },
                ]}>
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                  style={styles.dropdownScrollView}>
                  {CONTACT_REASONS.map((item, index) => {
                    const isSelected = reason === item;
                    return (
                      <TouchableOpacity
                        key={index}
                        testID={`reason-option-${index}`}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectReason(item)}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                            isDarkMode && !isSelected && styles.textWhite,
                          ]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            )}
          </View>

          {/* Field: Related listing URL (optional) */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Related listing URL (optional)
            </Text>
            <View
              style={[
                styles.inputBox3D,
                isDarkMode && styles.inputBox3DDark,
                focusedField === 'url' && styles.inputFocused,
              ]}>
              <Feather
                name="link"
                size={ms(15)}
                color={focusedField === 'url' ? '#7C3AED' : (isDarkMode ? '#94A3B8' : '#A1A1AA')}
                style={styles.fieldLeadIcon}
              />
              <TextInput
                testID="contact-url-input"
                style={[styles.nativeInput, isDarkMode && styles.textWhite]}
                placeholder="https://petfriendlyplaces.in/places/..."
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                autoCapitalize="none"
                value={listingUrl}
                onFocus={() => {
                  setFocusedField('url');
                  setIsDropdownOpen(false);
                }}
                onBlur={() => setFocusedField(null)}
                onChangeText={setListingUrl}
              />
            </View>
          </View>

          {/* Field: Message * */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>
              Message <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.textAreaBox3D,
                isDarkMode && styles.inputBox3DDark,
                focusedField === 'message' && styles.inputFocused,
              ]}>
              <TextInput
                testID="contact-message-input"
                style={[styles.nativeTextArea, isDarkMode && styles.textWhite]}
                placeholder="Tell us what's on your mind."
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={message}
                onFocus={() => {
                  setFocusedField('message');
                  setIsDropdownOpen(false);
                }}
                onBlur={() => setFocusedField(null)}
                onChangeText={txt => {
                  setMessage(txt);
                  if (errorMessage) setErrorMessage('');
                }}
              />
            </View>
          </View>

          {/* 3D Extruded Gradient Submit Button */}
          <BouncyPressable
            testID="contact-submit-btn"
            style={styles.submitBtnWrap}
            activeScale={0.96}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED', '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn3D}>
              <Feather name="send" size={ms(15)} color="#FFFFFF" style={styles.submitBtnIcon} />
              <Text style={styles.submitBtnText}>Submit Message</Text>
            </LinearGradient>
          </BouncyPressable>

          {/* Direct Email Chip Footer */}
          <TouchableOpacity
            style={[styles.emailPillChip, isDarkMode && styles.emailPillChipDark]}
            onPress={handleOpenEmail}
            activeOpacity={0.75}>
            <Ionicons name="mail-unread-outline" size={ms(15)} color="#7C3AED" style={styles.emailPillIcon} />
            <Text style={[styles.emailPillPrompt, isDarkMode && styles.textMutedDark]}>
              Prefer email? Write to{' '}
            </Text>
            <Text style={styles.emailPillAddress}>hello@petfriendlyplaces.in</Text>
          </TouchableOpacity>
        </View>

        {/* Generous bottom spacer to prevent clipping below system navigation */}
        <View style={styles.bottomSafetySpacer} />
      </KeyboardAwareScrollView>

      {/* ── Celebratory Success Confirmation Modal ── */}
      <ModernConfirmModal
        visible={showSuccessModal}
        onClose={handleSuccessDone}
        onConfirm={handleSuccessDone}
        title="Message Received! 📨"
        subtitle="Thank you for reaching out. Our team will review your enquiry and get back to you shortly."
        badge="PETFRIENDLY SUPPORT"
        type="success"
        confirmText="Done"
        singleButton={true}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  rootContainerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── Header Bar ── */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(8),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#ECE8E1',
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerBarDark: {
    backgroundColor: '#16082F',
    borderBottomColor: '#28114D',
  },
  backBtn: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
  },
  backBtnDark: {
    backgroundColor: '#261347',
    borderColor: '#3D1C73',
    borderBottomColor: '#210C42',
  },
  headerBarTitle: {
    fontSize: s(15.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#16082F',
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: s(34),
  },

  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(14),
    paddingTop: vs(12),
  },

  /* ── Luxury Mobile Hero Card ── */
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
      android: {
        elevation: 4,
      },
    }),
  },
  heroGradient: {
    paddingHorizontal: s(16),
    paddingTop: vs(14),
    paddingBottom: vs(16),
    position: 'relative',
  },
  heroPawWatermark: {
    position: 'absolute',
    right: s(-10),
    bottom: vs(-10),
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(8),
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  heroSparkle: {
    marginRight: s(4),
  },
  heroBadgeText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FCD34D',
    letterSpacing: 0.5,
  },
  heroResponsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(10),
  },
  onlineDot: {
    width: s(5),
    height: s(5),
    borderRadius: s(2.5),
    backgroundColor: '#34D399',
    marginRight: s(4),
  },
  heroResponseText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#D1FAE5',
  },
  heroTitle: {
    fontSize: s(18.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: vs(4),
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: s(16),
  },

  /* ── Section Blocks ── */
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
      android: {
        elevation: 3,
      },
    }),
  },
  sectionBlockDark: {
    backgroundColor: '#190A32',
    borderColor: '#371569',
    borderBottomColor: '#230A47',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
  },
  formBlockContainer: {
    zIndex: 100,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  sectionIconDisc: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(8),
  },
  sectionIconAmber: {
    backgroundColor: '#FEF3C7',
  },
  sectionIconTeal: {
    backgroundColor: '#CFFAFE',
  },
  sectionIconEmerald: {
    backgroundColor: '#D1FAE5',
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#2E1065',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    marginTop: vs(1),
  },

  /* ── Informative Topics Guide (Section 1) ── */
  infoGuideCard: {
    backgroundColor: '#FAF8FC',
    borderRadius: s(13),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingHorizontal: s(10),
    paddingVertical: vs(2),
  },
  infoGuideCardDark: {
    backgroundColor: '#200D3D',
    borderColor: '#37186A',
  },
  infoTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(6),
  },
  infoTopicDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3EEFA',
  },
  infoTopicDividerDark: {
    borderBottomColor: '#2C1355',
  },
  infoIconDisc: {
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(9),
  },
  infoIconDiscDark: {
    backgroundColor: '#32145E',
  },
  infoTopicText: {
    flex: 1,
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#334155',
    letterSpacing: -0.1,
  },
  infoCheckmark: {
    marginLeft: s(6),
    opacity: 0.85,
  },

  /* ── Section 2: Executive Social Connect Cards ── */
  channelsStack: {
    gap: vs(8),
  },
  socialConnectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: s(14),
    paddingVertical: vs(9),
    paddingHorizontal: s(11),
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD7CC',
  },
  socialConnectCardDark: {
    backgroundColor: '#220D42',
    borderColor: '#38166D',
    borderBottomColor: '#240B4C',
  },
  socialIconDisc: {
    width: s(36),
    height: s(36),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  youtubeIconDisc: {
    backgroundColor: '#FF0000',
  },
  facebookIconDisc: {
    backgroundColor: '#1877F2',
  },
  socialTextWrap: {
    flex: 1,
  },
  socialHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(1),
  },
  socialTitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#16082F',
    marginRight: s(6),
  },
  socialFollowBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: s(6),
    paddingVertical: vs(1),
    borderRadius: s(8),
  },
  youtubeFollowBadge: {
    backgroundColor: '#FEE2E2',
  },
  facebookFollowBadge: {
    backgroundColor: '#DBEAFE',
  },
  socialFollowText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#DB2777',
  },
  youtubeFollowText: {
    color: '#DC2626',
  },
  facebookFollowText: {
    color: '#1D4ED8',
  },
  socialHandleText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    marginBottom: vs(1),
  },
  socialHandleTextDark: {
    color: '#C084FC',
  },
  youtubeHandleText: {
    color: '#DC2626',
  },
  facebookHandleText: {
    color: '#1877F2',
  },
  socialSubDetail: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    lineHeight: s(14),
  },
  socialActionBubble: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: s(6),
  },
  socialActionBubbleDark: {
    backgroundColor: '#2E1055',
    borderColor: '#4A1D88',
  },

  /* ── Form Inputs ── */
  fieldWrap: {
    marginBottom: vs(9),
  },
  reasonFieldWrap: {
    zIndex: Platform.OS === 'ios' ? 1000 : 10,
  },
  fieldLabel: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#374151',
    marginBottom: vs(4),
  },
  requiredStar: {
    color: '#EF4444',
  },
  inputBox3D: {
    height: vs(38),
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
  selectBoxActive: {
    borderColor: '#EC4899',
    borderBottomColor: '#BE185D',
    backgroundColor: '#FFFFFF',
  },
  fieldLeadIcon: {
    marginRight: s(8),
  },
  nativeInput: {
    flex: 1,
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#16082F',
    paddingVertical: 0,
  },
  selectText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#16082F',
    flex: 1,
  },
  selectPlaceholderText: {
    color: '#94A3B8',
  },
  textAreaBox3D: {
    height: vs(66),
    backgroundColor: '#FAF8F5',
    borderRadius: s(11),
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
    paddingHorizontal: s(10),
    paddingTop: vs(7),
  },
  nativeTextArea: {
    flex: 1,
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#16082F',
    paddingVertical: 0,
  },

  /* ── Floating 3D Dropdown Menu (Screenshot Match) ── */
  floatingDropdownMenu3D: {
    position: 'absolute',
    top: vs(60),
    left: 0,
    right: 0,
    zIndex: 9999,
    maxHeight: vs(210),
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3.5,
    borderBottomColor: '#CBD5E1',
    paddingVertical: vs(4),
    paddingHorizontal: s(4),
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
      },
      android: {
        elevation: 25,
      },
    }),
  },
  dropdownScrollView: {
    maxHeight: vs(200),
  },
  dropdownMenu3DDark: {
    backgroundColor: '#1E0D3D',
    borderColor: '#3D1C73',
    borderBottomColor: '#240B4C',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
  },
  dropdownItem: {
    paddingVertical: vs(7.5),
    paddingHorizontal: s(11),
    borderRadius: s(9),
    marginVertical: vs(1),
  },
  dropdownItemSelected: {
    backgroundColor: '#EC4899',
    borderBottomWidth: 1.5,
    borderBottomColor: '#DB2777',
  },
  dropdownItemText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1F2937',
  },
  dropdownItemTextSelected: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },

  /* ── 3D Extruded Gradient Submit Button ── */
  submitBtnWrap: {
    marginTop: vs(6),
    marginBottom: vs(10),
  },
  submitBtn3D: {
    height: vs(42),
    borderRadius: s(21),
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
      android: {
        elevation: 5,
      },
    }),
  },
  submitBtnIcon: {
    marginRight: s(6),
  },
  submitBtnText: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Direct Email Pill Chip ── */
  emailPillChip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: s(12),
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: vs(2),
  },
  emailPillChipDark: {
    backgroundColor: '#210B3E',
    borderColor: '#42167A',
  },
  emailPillIcon: {
    marginRight: s(6),
  },
  emailPillPrompt: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
  },
  emailPillAddress: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    textDecorationLine: 'underline',
  },

  /* ── Error Banner ── */
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
    marginBottom: vs(9),
  },
  errorIcon: {
    marginRight: s(6),
  },
  errorBannerText: {
    flex: 1,
    fontSize: s(11.5),
    color: '#991B1B',
    fontFamily: theme.typography.fontFamily.medium,
  },

  bottomSafetySpacer: {
    height: vs(36),
  },

  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});

export default ContactUsScreen;
