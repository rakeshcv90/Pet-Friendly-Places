import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  Share,
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

export const MyProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const storeUser = useStore(state => state.user);
  const setUser = useStore(state => state.setUser);

  // Initial user values
  const initialName = storeUser?.name || storeUser?.displayName || 'Rakesh Rao';
  const initialEmail = storeUser?.email || 'rakeshrao@cvinfotech.com';
  const initialSlug = storeUser?.profileSlug || 'rakesh-rao-a82b24';
  const initialLocation = storeUser?.location || storeUser?.city || 'Delhi';
  const initialBio = storeUser?.bio || '';
  const initialInstagram = storeUser?.instagramHandle || storeUser?.instagram || 'helloworld';
  const initialYoutube = storeUser?.youtubeHandle || storeUser?.youtube || '';
  const initialWebsite = storeUser?.website || '';

  // Form states
  const [displayName, setDisplayName] = useState(initialName);
  const [email] = useState(initialEmail);
  const [profileSlug, setProfileSlug] = useState(initialSlug);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [instagramHandle, setInstagramHandle] = useState(initialInstagram);
  const [youtubeHandle, setYoutubeHandle] = useState(initialYoutube);
  const [website, setWebsite] = useState(initialWebsite);

  // Active focus state for 3D input depth & highlight
  const [focusedInput, setFocusedInput] = useState(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback(
    message => {
      setToastMessage(message);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();

      toastTimeoutRef.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setToastMessage(null);
        });
      }, 2200);
    },
    [toastAnim],
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Preview Modal
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Handlers for Save actions
  const handleSaveName = () => {
    if (!displayName.trim()) {
      showToast('⚠️ Please enter a display name');
      return;
    }
    if (setUser && storeUser) {
      setUser({ ...storeUser, name: displayName.trim(), displayName: displayName.trim() });
    }
    showToast('Display name updated successfully! ✨');
  };

  const handleSaveSlug = () => {
    const sanitized = profileSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    setProfileSlug(sanitized);

    if (setUser && storeUser) {
      setUser({ ...storeUser, profileSlug: sanitized });
    }
    showToast('Profile URL updated successfully! 🔗');
  };

  const handleSaveProfileInfo = () => {
    if (setUser && storeUser) {
      setUser({
        ...storeUser,
        bio: bio.trim(),
        location: location.trim(),
        instagramHandle: instagramHandle.trim(),
        youtubeHandle: youtubeHandle.trim(),
        website: website.trim(),
      });
    }
    showToast('Profile info saved successfully! 🌟');
  };

  const handleShareProfile = async () => {
    try {
      const publicUrl = `https://petfriendlyplaces.in/profile/${profileSlug}`;
      await Share.share({
        title: `${displayName}'s Pet Profile`,
        message: `Check out ${displayName}'s public pet profile on Pet Friendly Places: ${publicUrl}`,
        url: publicUrl,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />

      {/* ── Signature Homepage Ambient Glow Orbs ── */}
      <View
        style={[styles.ambientGlowTopRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowTopLeft, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowMidRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowMidLeft, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowBottomRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />

      {/* ── Signature Ambient Paw Watermarks ── */}
      <View style={styles.ambientPawWatermarkTop} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(130)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(123, 44, 255, 0.035)'}
        />
      </View>
      <View style={styles.ambientPawWatermarkBottom} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(238, 42, 123, 0.06)' : 'rgba(238, 42, 123, 0.03)'}
        />
      </View>

      {/* ── Fixed Top Navigation Bar ── */}
      <View
        style={[
          styles.headerRow,
          { paddingTop: Math.max(insets.top, Platform.OS === 'android' ? vs(10) : vs(6)) },
          isDarkMode && styles.headerRowDark,
        ]}>
        <BouncyPressable
          testID="my-profile-back-btn"
          accessibilityLabel="Back"
          style={[styles.backBtn, isDarkMode && styles.backBtnDark]}
          activeScale={0.88}
          onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={s(20)}
            color={isDarkMode ? '#FFFFFF' : '#1E1B4B'}
          />
        </BouncyPressable>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
            My Profile
          </Text>
        </View>

        <BouncyPressable
          testID="view-public-quick-btn"
          style={[styles.headerActionBtn, isDarkMode && styles.headerActionBtnDark]}
          activeScale={0.9}
          onPress={() => setPreviewModalVisible(true)}>
          <Feather name="globe" size={ms(16)} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
        </BouncyPressable>
      </View>

      {/* ── Floating Notification Toast ── */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: insets.top + vs(62),
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={[styles.toastPill, isDarkMode && styles.toastPillDark]}>
            <Ionicons name="checkmark-circle" size={ms(16)} color="#10B981" />
            <Text style={[styles.toastText, isDarkMode && styles.textWhite]}>
              {toastMessage}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── Scrollable Card Content ── */}
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + vs(36) },
        ]}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={vs(20)}>
        {/* Main Card Container with 3D Depth matching CreateTripScreen */}
        <View style={[styles.profileCard, isDarkMode && styles.profileCardDark]}>
          {/* Top colored accent stripe matching CreateTrip & Community card */}
          <View style={styles.cardTopAccent} />

          {/* ══════════════════════════════════════
              SECTION 1: Public Identity
          ══════════════════════════════════════ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
              Public Identity
            </Text>
          </View>

          {/* Display Name Field (3D Input Wrapper like CreateTripScreen) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                Display Name
              </Text>
              {displayName.trim().length > 0 && (
                <View style={styles.filledCheckMark}>
                  <Feather name="check" size={ms(11)} color="#10B981" />
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputCardWrapper,
                isDarkMode && styles.inputCardWrapperDark,
                focusedInput === 'displayName' && styles.inputCardWrapperFocused,
              ]}>
              <View style={styles.inputIconBox}>
                <Feather name="user" size={ms(16)} color="#7C3AED" />
              </View>
              <TextInput
                testID="input-display-name"
                style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Rakesh Rao"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                onFocus={() => setFocusedInput('displayName')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="words"
              />
              {displayName.length > 0 && (
                <TouchableOpacity
                  onPress={() => setDisplayName('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Email (read-only) Field with 3D Disabled Depth */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                Email <Text style={styles.readOnlyNote}>(read-only)</Text>
              </Text>
              <View style={styles.lockBadge}>
                <Feather name="lock" size={ms(11)} color="#94A3B8" />
              </View>
            </View>

            <View
              style={[
                styles.inputCardWrapper,
                styles.inputCardWrapperDisabled,
                isDarkMode && styles.inputCardWrapperDisabledDark,
              ]}>
              <View style={[styles.inputIconBox, styles.inputIconBoxMuted]}>
                <Feather name="mail" size={ms(16)} color="#64748B" />
              </View>
              <TextInput
                testID="input-email-readonly"
                style={[
                  styles.premiumTextInput,
                  styles.premiumTextInputMuted,
                  isDarkMode && styles.textMutedDark,
                ]}
                value={email}
                editable={false}
              />
            </View>
          </View>

          {/* Save Name Button with 3D Tactile Bevel */}
          <View style={styles.btnRowLeft}>
            <BouncyPressable
              testID="save-name-btn"
              style={styles.pill3DBtnWrap}
              activeScale={0.94}
              onPress={handleSaveName}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pill3DGradient}>
                <Text style={styles.pill3DText}>Save Name</Text>
              </LinearGradient>
            </BouncyPressable>
          </View>

          {/* Divider */}
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ══════════════════════════════════════
              SECTION 2: @ Profile URL
          ══════════════════════════════════════ */}
          <View style={styles.urlHeaderRow}>
            <View style={styles.atCircleBadge}>
              <Text style={styles.atBadgeText}>@</Text>
            </View>
            <Text style={[styles.sectionHeadingSmall, isDarkMode && styles.textWhite]}>
              Profile URL
            </Text>
            <Text
              style={[styles.urlHeaderSubtitle, isDarkMode && styles.textMutedDark]}
              numberOfLines={1}>
              Your public page on Pet Friendly Places
            </Text>
          </View>

          {/* Combined Prefix + Handle 3D Input */}
          <View
            style={[
              styles.combinedUrlWrapper,
              isDarkMode && styles.combinedUrlWrapperDark,
              focusedInput === 'profileSlug' && styles.inputCardWrapperFocused,
            ]}>
            <View
              style={[styles.urlPrefixBox, isDarkMode && styles.urlPrefixBoxDark]}>
              <Ionicons
                name="link-outline"
                size={ms(13)}
                color="#7C3AED"
                style={styles.prefixLinkIcon}
              />
              <Text style={[styles.urlPrefixText, isDarkMode && styles.textMutedDark]}>
                petfriendlyplaces.in/profile/
              </Text>
            </View>
            <TextInput
              testID="input-profile-slug"
              style={[styles.urlSlugInput, isDarkMode && styles.textWhite]}
              value={profileSlug}
              onChangeText={setProfileSlug}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="your-handle"
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              onFocus={() => setFocusedInput('profileSlug')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          <Text style={[styles.helperText, isDarkMode && styles.textMutedDark]}>
            3–40 characters, lowercase letters, numbers and hyphens only
          </Text>

          {/* Save Profile URL & View My Profile 3D Buttons */}
          <View style={styles.urlActionsRow}>
            <BouncyPressable
              testID="save-profile-url-btn"
              style={styles.pill3DBtnWrap}
              activeScale={0.94}
              onPress={handleSaveSlug}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pill3DGradient}>
                <Text style={styles.pill3DText}>Save Profile URL</Text>
              </LinearGradient>
            </BouncyPressable>

            <BouncyPressable
              testID="view-my-profile-btn"
              style={[styles.outline3DBtn, isDarkMode && styles.outline3DBtnDark]}
              activeScale={0.94}
              onPress={() => setPreviewModalVisible(true)}>
              <Ionicons
                name="globe-outline"
                size={ms(14)}
                color={isDarkMode ? '#C084FC' : '#7C3AED'}
              />
              <Text
                style={[
                  styles.outline3DText,
                  isDarkMode && styles.outline3DTextDark,
                ]}>
                View my profile
              </Text>
              <Feather
                name="external-link"
                size={ms(12)}
                color={isDarkMode ? '#C084FC' : '#7C3AED'}
              />
            </BouncyPressable>
          </View>

          {/* Divider */}
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* ══════════════════════════════════════
              SECTION 3: Bio & Social Links
          ══════════════════════════════════════ */}
          <Text style={[styles.sectionHeading, isDarkMode && styles.textWhite]}>
            Bio & Social Links
          </Text>

          {/* Bio Field with 3D Depth & live counter */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                Bio
              </Text>
              <Text style={[styles.charCounter, isDarkMode && styles.textMutedDark]}>
                ({bio.length}/300)
              </Text>
            </View>

            <View
              style={[
                styles.bioCardWrapper,
                isDarkMode && styles.bioCardWrapperDark,
                focusedInput === 'bio' && styles.inputCardWrapperFocused,
              ]}>
              <TextInput
                testID="input-bio"
                style={[styles.bioTextInput, isDarkMode && styles.textWhite]}
                value={bio}
                onChangeText={setBio}
                maxLength={300}
                multiline
                numberOfLines={4}
                placeholder="Tell the community about yourself and your pets..."
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                textAlignVertical="top"
                onFocus={() => setFocusedInput('bio')}
                onBlur={() => setFocusedInput(null)}
              />
              {/* Web-matched textarea diagonal corner resize indicator */}
              <View style={styles.textareaCornerGrip} pointerEvents="none">
                <View style={styles.gripLineShort} />
                <View style={styles.gripLineLong} />
              </View>
            </View>
          </View>

          {/* Location Field with 3D Depth */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                Location
              </Text>
              {location.trim().length > 0 && (
                <View style={styles.filledCheckMark}>
                  <Feather name="check" size={ms(11)} color="#10B981" />
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputCardWrapper,
                isDarkMode && styles.inputCardWrapperDark,
                focusedInput === 'location' && styles.inputCardWrapperFocused,
              ]}>
              <View style={[styles.inputIconBox, styles.inputIconBoxLocation]}>
                <Ionicons name="location" size={ms(16)} color="#7C3AED" />
              </View>
              <TextInput
                testID="input-location"
                style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                value={location}
                onChangeText={setLocation}
                placeholder="e.g. Delhi"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                onFocus={() => setFocusedInput('location')}
                onBlur={() => setFocusedInput(null)}
              />
              {location.length > 0 && (
                <TouchableOpacity
                  onPress={() => setLocation('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.helperText, isDarkMode && styles.textMutedDark]}>
              Type to search — select from the list to keep location uniform.
            </Text>
          </View>

          {/* Instagram Handle with 3D Rose Icon Box */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                Instagram handle
              </Text>
              {instagramHandle.trim().length > 0 && (
                <View style={styles.filledCheckMark}>
                  <Feather name="check" size={ms(11)} color="#10B981" />
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputCardWrapper,
                isDarkMode && styles.inputCardWrapperDark,
                focusedInput === 'instagram' && styles.inputCardWrapperFocused,
              ]}>
              <View style={[styles.inputIconBox, styles.inputIconBoxInstagram]}>
                <Ionicons name="logo-instagram" size={ms(16)} color="#E1306C" />
              </View>
              <TextInput
                testID="input-instagram"
                style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                value={instagramHandle}
                onChangeText={setInstagramHandle}
                autoCapitalize="none"
                placeholder="helloworld"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                onFocus={() => setFocusedInput('instagram')}
                onBlur={() => setFocusedInput(null)}
              />
              {instagramHandle.length > 0 && (
                <TouchableOpacity
                  onPress={() => setInstagramHandle('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* YouTube Handle with 3D Red Icon Box */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                YouTube handle
              </Text>
              {youtubeHandle.trim().length > 0 && (
                <View style={styles.filledCheckMark}>
                  <Feather name="check" size={ms(11)} color="#10B981" />
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputCardWrapper,
                isDarkMode && styles.inputCardWrapperDark,
                focusedInput === 'youtube' && styles.inputCardWrapperFocused,
              ]}>
              <View style={[styles.inputIconBox, styles.inputIconBoxYoutube]}>
                <Ionicons name="logo-youtube" size={ms(16)} color="#EF4444" />
              </View>
              <TextInput
                testID="input-youtube"
                style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                value={youtubeHandle}
                onChangeText={setYoutubeHandle}
                autoCapitalize="none"
                placeholder="@yourchannel"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                onFocus={() => setFocusedInput('youtube')}
                onBlur={() => setFocusedInput(null)}
              />
              {youtubeHandle.length > 0 && (
                <TouchableOpacity
                  onPress={() => setYoutubeHandle('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Website Field with 3D Cyan Icon Box */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, isDarkMode && styles.textWhite]}>
                Website
              </Text>
              {website.trim().length > 0 && (
                <View style={styles.filledCheckMark}>
                  <Feather name="check" size={ms(11)} color="#10B981" />
                </View>
              )}
            </View>

            <View
              style={[
                styles.inputCardWrapper,
                isDarkMode && styles.inputCardWrapperDark,
                focusedInput === 'website' && styles.inputCardWrapperFocused,
              ]}>
              <View style={[styles.inputIconBox, styles.inputIconBoxWebsite]}>
                <Ionicons name="globe-outline" size={ms(16)} color="#0284C7" />
              </View>
              <TextInput
                testID="input-website"
                style={[styles.premiumTextInput, isDarkMode && styles.textWhite]}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://yourwebsite.com"
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                onFocus={() => setFocusedInput('website')}
                onBlur={() => setFocusedInput(null)}
              />
              {website.length > 0 && (
                <TouchableOpacity
                  onPress={() => setWebsite('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={ms(16)} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Save Profile Info 3D Button */}
          <View style={styles.btnRowLeft}>
            <BouncyPressable
              testID="save-profile-info-btn"
              style={styles.pill3DBtnWrap}
              activeScale={0.94}
              onPress={handleSaveProfileInfo}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pill3DGradient}>
                <Text style={styles.pill3DText}>Save Profile Info</Text>
              </LinearGradient>
            </BouncyPressable>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* ── Public Profile Preview Modal ── */}
      <Modal
        visible={previewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDarkMode && styles.modalCardDark]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalGlobeIcon}>
                  <Ionicons name="globe" size={ms(20)} color="#7C3AED" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
                    Public Profile
                  </Text>
                  <Text style={[styles.modalSubtitle, isDarkMode && styles.textMutedDark]}>
                    Live community page
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={ms(20)} color={isDarkMode ? '#CBD5E1' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* Profile Snippet Preview with 3D Depth */}
            <View style={[styles.previewSnippetBox, isDarkMode && styles.previewSnippetBoxDark]}>
              <View style={styles.previewUserRow}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>
                    {(displayName.trim()[0] || 'R').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.previewInfo}>
                  <Text style={[styles.previewName, isDarkMode && styles.textWhite]}>
                    {displayName}
                  </Text>
                  <Text style={[styles.previewLocation, isDarkMode && styles.textMutedDark]}>
                    📍 {location || 'Delhi, India'}
                  </Text>
                </View>
              </View>

              {bio ? (
                <Text style={[styles.previewBioText, isDarkMode && styles.textMutedDark]}>
                  &ldquo;{bio}&rdquo;
                </Text>
              ) : null}

              <View style={styles.previewUrlBadge}>
                <Ionicons name="link-outline" size={ms(14)} color="#7C3AED" />
                <Text
                  style={styles.previewUrlText}
                  numberOfLines={1}
                  ellipsizeMode="middle">
                  petfriendlyplaces.in/profile/{profileSlug}
                </Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalShareBtn, isDarkMode && styles.modalShareBtnDark]}
                onPress={handleShareProfile}>
                <Feather name="share-2" size={ms(15)} color="#7C3AED" />
                <Text style={styles.modalShareText}>Share Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPreviewModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── Homepage Signature Ambient Glow Orbs ── */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -s(80),
    right: -s(80),
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

  /* ── Homepage Signature Ambient Paw Watermarks ── */
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: vs(120),
    right: -s(20),
    transform: [{ rotate: '-25deg' }],
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: vs(160),
    left: -s(30),
    transform: [{ rotate: '30deg' }],
  },

  /* ── Header ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRowDark: {
    borderBottomColor: '#1E1435',
  },
  backBtn: {
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
  backBtnDark: {
    backgroundColor: '#1E1035',
    borderColor: '#371B58',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: s(12),
  },
  headerTitle: {
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    letterSpacing: -0.3,
  },
  headerActionBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionBtnDark: {
    backgroundColor: '#27104B',
    borderColor: '#4C1D95',
  },

  /* ── Floating Toast ── */
  toastContainer: {
    position: 'absolute',
    left: s(16),
    right: s(16),
    zIndex: 999,
    alignItems: 'center',
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(16),
    paddingVertical: vs(9),
    borderRadius: s(24),
    gap: s(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  toastPillDark: {
    backgroundColor: '#1E1035',
    borderColor: '#371B58',
  },
  toastText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#0F172A',
  },

  /* ── Scroll Content & Card ── */
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    paddingHorizontal: s(18),
    paddingTop: vs(22),
    paddingBottom: vs(24),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  profileCardDark: {
    backgroundColor: '#190B30',
    borderColor: '#2E1654',
    borderBottomColor: '#17082A',
  },
  cardTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#7C3AED',
  },

  /* ── Section Headings ── */
  sectionHeaderRow: {
    marginBottom: vs(14),
  },
  sectionHeading: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    letterSpacing: -0.2,
    marginBottom: vs(14),
  },
  sectionHeadingSmall: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
    letterSpacing: -0.2,
  },

  /* ── 3D Form Fields (matching CreateTripScreen) ── */
  inputGroup: {
    marginBottom: vs(16),
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(7),
  },
  inputLabel: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
  },
  readOnlyNote: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#94A3B8',
  },
  lockBadge: {
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledCheckMark: {
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCounter: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#94A3B8',
  },

  /* 3D Input Card Wrapper with tactile depth bevel */
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
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  inputCardWrapperDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderBottomColor: '#E2E8F0',
  },
  inputCardWrapperDisabledDark: {
    backgroundColor: '#130825',
    borderColor: '#240F44',
    borderBottomColor: '#1A0B30',
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
  inputIconBoxMuted: {
    backgroundColor: '#F1F5F9',
  },
  inputIconBoxLocation: {
    backgroundColor: '#F3E8FF',
  },
  inputIconBoxInstagram: {
    backgroundColor: '#FDF2F8',
  },
  inputIconBoxYoutube: {
    backgroundColor: '#FEF2F2',
  },
  inputIconBoxWebsite: {
    backgroundColor: '#F0F9FF',
  },
  premiumTextInput: {
    flex: 1,
    height: '100%',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#0F172A',
  },
  premiumTextInputMuted: {
    color: '#64748B',
  },
  clearBtn: {
    padding: s(4),
  },
  helperText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#94A3B8',
    marginTop: vs(5),
    lineHeight: s(15),
    marginLeft: s(2),
  },

  /* ── 3D Pill Buttons (Tactile depth like CreateTrip) ── */
  btnRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(4),
  },
  pill3DBtnWrap: {
    borderRadius: s(12),
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pill3DGradient: {
    paddingHorizontal: s(18),
    paddingVertical: vs(9.5),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#4C1D95',
  },
  pill3DText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* ── Divider ── */
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: vs(22),
  },
  dividerDark: {
    backgroundColor: '#261347',
  },

  /* ── URL Section with 3D Depth ── */
  urlHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(10),
  },
  atCircleBadge: {
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: '#FAF5FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 2,
    borderBottomColor: '#C4B5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atBadgeText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  urlHeaderSubtitle: {
    flex: 1,
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  combinedUrlWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    height: vs(48),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  combinedUrlWrapperDark: {
    backgroundColor: '#17092E',
    borderColor: '#2D1452',
    borderBottomColor: '#1E0B38',
  },
  urlPrefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: s(10),
    height: '100%',
    borderRightWidth: 1.2,
    borderRightColor: '#E2E8F0',
  },
  urlPrefixBoxDark: {
    backgroundColor: '#140726',
    borderRightColor: '#2B134D',
  },
  prefixLinkIcon: {
    marginRight: s(4),
  },
  urlPrefixText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  urlSlugInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: s(10),
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
  },
  urlActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: s(10),
    marginTop: vs(12),
  },
  outline3DBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#FAF5FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 2.5,
    borderBottomColor: '#C4B5FD',
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: vs(9),
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  outline3DBtnDark: {
    backgroundColor: '#27104B',
    borderColor: '#4C1D95',
    borderBottomColor: '#36116B',
  },
  outline3DText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  outline3DTextDark: {
    color: '#C084FC',
  },

  /* ── 3D Bio Card Wrapper ── */
  bioCardWrapper: {
    minHeight: vs(95),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    borderRadius: s(14),
    padding: s(12),
    position: 'relative',
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
  textareaCornerGrip: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 14,
    height: 14,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    padding: 2,
  },
  gripLineShort: {
    width: 4,
    height: 1.2,
    backgroundColor: '#CBD5E1',
    marginBottom: 2,
  },
  gripLineLong: {
    width: 8,
    height: 1.2,
    backgroundColor: '#CBD5E1',
  },

  /* ── Preview Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 7, 29, 0.7)',
    justifyContent: 'center',
    paddingHorizontal: s(20),
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(20),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalCardDark: {
    backgroundColor: '#190B30',
    borderColor: '#2E1654',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(16),
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  modalGlobeIcon: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  previewSnippetBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: s(14),
    padding: s(14),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    marginBottom: vs(16),
  },
  previewSnippetBoxDark: {
    backgroundColor: '#200C3C',
    borderColor: '#34165C',
    borderBottomColor: '#17092E',
  },
  previewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(10),
  },
  previewAvatar: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarText: {
    color: '#FFFFFF',
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0F172A',
  },
  previewLocation: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
  },
  previewBioText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    fontStyle: 'italic',
    color: '#475569',
    lineHeight: s(17),
    marginBottom: vs(10),
  },
  previewUrlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#FAF5FF',
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  previewUrlText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#7C3AED',
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: s(10),
  },
  modalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#FAF5FF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 2,
    borderBottomColor: '#C4B5FD',
    borderRadius: s(8),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
  },
  modalShareBtnDark: {
    backgroundColor: '#27104B',
    borderColor: '#4C1D95',
    borderBottomColor: '#36116B',
  },
  modalShareText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  modalCloseBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: s(8),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 2,
    borderBottomColor: '#4C1D95',
    paddingHorizontal: s(18),
    paddingVertical: vs(8.5),
  },
  modalCloseText: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },

  /* ── Dark Mode Typography ── */
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
});
