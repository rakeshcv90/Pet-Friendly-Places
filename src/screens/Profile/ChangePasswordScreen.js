import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Image,
  Keyboard,
} from 'react-native';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FastImage from 'react-native-fast-image';

import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { ModernConfirmModal } from './components/ModernConfirmModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 750;

export const ChangePasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Password strength calculation
  const getPasswordStrength = pass => {
    if (!pass) return { score: 0, label: '', color: '#CBD5E1' };
    if (pass.length < 6) return { score: 1, label: 'Too short', color: '#EF4444' };

    let score = 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass) && /[a-zA-Z]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score === 2) return { score: 2, label: 'Fair', color: '#F59E0B' };
    return { score: 3, label: 'Strong', color: '#10B981' };
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleUpdate = () => {
    Keyboard.dismiss();
    setErrorMessage('');

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMessage('Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    // Simulate secure update with loader
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 750);
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark, { paddingBottom: insets.bottom }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Signature Brand Background Image */}
      <FastImage
        source={theme.images.backgroundimg1}
        style={[
          styles.backgroundImage,
          isDarkMode && styles.backgroundImageDark,
          { bottom: insets.bottom },
        ]}
        objectFit={Platform.OS === 'ios' && isSmallDevice ? 'fill' : 'cover'}
      />

      {/* Premium Animated Loading Modal (same loader as Login & Signup) */}
      <Loader
        visible={isSubmitting}
        title="Updating password..."
        subtitle="Encrypting and securing your credentials..."
      />

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, s(12)) + s(6),
            paddingBottom: Math.max(insets.bottom, s(14)) + s(10),
          },
        ]}
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Top Header Navigation */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            testID="change-password-back-btn"
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={[styles.backButton, isDarkMode && styles.backButtonDark]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons
              name="chevron-back"
              size={s(20)}
              color={isDarkMode ? '#FFFFFF' : theme.colors.primaryDark}
            />
          </TouchableOpacity>
        </View>

        {/* Compact Center Illustration matching Forgot Password */}
        <View style={styles.illustrationContainer}>
          <Image
            source={theme.images.resetPassword}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Header Texts */}
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>
            Change Password
          </Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Enter your current password and choose a new one
          </Text>
        </View>

        {/* Form with exact text input field styling from Login & Signup */}
        <View style={styles.form}>
          {/* Error Alert Banner */}
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <FeatherIcon
                name="alert-circle"
                size={s(14)}
                color="#C0392B"
                style={styles.errorIcon}
              />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          )}

          {/* Current Password Field */}
          <Input
            testID="current-password-input"
            label="Current Password"
            labelStyle={[styles.inputLabel, isDarkMode && styles.textWhite]}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.primary}
            value={currentPassword}
            onChangeText={txt => {
              setCurrentPassword(txt);
              if (errorMessage) setErrorMessage('');
            }}
            style={styles.inputMargin}
            inputWrapperStyle={[
              styles.inputBox,
              isDarkMode && styles.inputBoxDark,
              errorMessage && !currentPassword ? styles.inputBoxError : null,
            ]}
            inputStyle={[styles.inputText, isDarkMode && styles.textWhite]}
            leftIcon={
              <FeatherIcon
                name="key"
                size={isSmallDevice ? s(15) : s(16)}
                color={isDarkMode ? '#C084FC' : theme.colors.primaryDark}
              />
            }
            rightIcon={
              <FeatherIcon
                name={showCurrent ? 'eye' : 'eye-off'}
                size={isSmallDevice ? s(15) : s(16)}
                color={isDarkMode ? '#94A3B8' : theme.colors.primaryDark}
              />
            }
            onRightIconPress={() => setShowCurrent(!showCurrent)}
            secureTextEntry={!showCurrent}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* New Password Field */}
          <Input
            testID="new-password-input"
            label="New Password"
            labelStyle={[styles.inputLabel, isDarkMode && styles.textWhite]}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.primary}
            value={newPassword}
            onChangeText={txt => {
              setNewPassword(txt);
              if (errorMessage) setErrorMessage('');
            }}
            style={newPassword.length > 0 ? styles.inputMarginTight : styles.inputMargin}
            inputWrapperStyle={[
              styles.inputBox,
              isDarkMode && styles.inputBoxDark,
              errorMessage && !newPassword ? styles.inputBoxError : null,
            ]}
            inputStyle={[styles.inputText, isDarkMode && styles.textWhite]}
            leftIcon={
              <FeatherIcon
                name="lock"
                size={isSmallDevice ? s(15) : s(16)}
                color={isDarkMode ? '#C084FC' : theme.colors.primaryDark}
              />
            }
            rightIcon={
              <FeatherIcon
                name={showNew ? 'eye' : 'eye-off'}
                size={isSmallDevice ? s(15) : s(16)}
                color={isDarkMode ? '#94A3B8' : theme.colors.primaryDark}
              />
            }
            onRightIconPress={() => setShowNew(!showNew)}
            secureTextEntry={!showNew}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Compact Password Strength Meter */}
          {newPassword.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthSegmentsWrap}>
                {[1, 2, 3].map(level => (
                  <View
                    key={level}
                    style={[
                      styles.strengthSegment,
                      {
                        backgroundColor:
                          strength.score >= level
                            ? strength.color
                            : isDarkMode
                            ? '#2D1452'
                            : '#E2E8F0',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Confirm New Password Field */}
          <Input
            testID="confirm-password-input"
            label="Confirm New Password"
            labelStyle={[styles.inputLabel, isDarkMode && styles.textWhite]}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.primary}
            value={confirmPassword}
            onChangeText={txt => {
              setConfirmPassword(txt);
              if (errorMessage) setErrorMessage('');
            }}
            style={passwordsMismatch || passwordsMatch ? styles.inputMarginTight : styles.inputMargin}
            inputWrapperStyle={[
              styles.inputBox,
              isDarkMode && styles.inputBoxDark,
              passwordsMismatch ? styles.inputBoxError : null,
              passwordsMatch ? styles.inputBoxSuccess : null,
            ]}
            inputStyle={[styles.inputText, isDarkMode && styles.textWhite]}
            leftIcon={
              <FeatherIcon
                name="check-circle"
                size={isSmallDevice ? s(15) : s(16)}
                color={
                  passwordsMatch
                    ? '#10B981'
                    : passwordsMismatch
                    ? '#EF4444'
                    : isDarkMode
                    ? '#C084FC'
                    : theme.colors.primaryDark
                }
              />
            }
            rightIcon={
              <FeatherIcon
                name={showConfirm ? 'eye' : 'eye-off'}
                size={isSmallDevice ? s(15) : s(16)}
                color={isDarkMode ? '#94A3B8' : theme.colors.primaryDark}
              />
            }
            onRightIconPress={() => setShowConfirm(!showConfirm)}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {passwordsMismatch && (
            <Text style={styles.fieldErrorText}>Passwords do not match</Text>
          )}
          {passwordsMatch && (
            <Text style={styles.fieldSuccessText}>✓ Passwords match</Text>
          )}

          {/* Update Password Button matching Login & Forgot Password */}
          <Button
            testID="change-password-submit-btn"
            title={isSubmitting ? 'Updating...' : 'Update Password'}
            onPress={handleUpdate}
            isLoading={isSubmitting}
            disabled={isSubmitting}
            style={styles.sendButton}
            contentStyle={styles.sendButtonContent}
            textStyle={styles.sendButtonText}
            gradientColors={
              !currentPassword.trim() ||
              !newPassword.trim() ||
              !confirmPassword.trim() ||
              isSubmitting
                ? ['#C4B5E2', '#D1C8E8']
                : ['rgb(59, 16, 143)', 'rgb(123, 44, 255)']
            }
            width="80%"
          />

          {/* Back to Profile / Cancel */}
          <TouchableOpacity
            style={styles.backToProfileButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <FeatherIcon
              name="arrow-left"
              size={s(15)}
              color={isDarkMode ? '#C084FC' : theme.colors.primary}
              style={styles.backToProfileIcon}
            />
            <Text style={[styles.backToProfileText, isDarkMode && styles.backToProfileTextDark]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Celebratory Success Modal */}
      <ModernConfirmModal
        visible={showSuccessModal}
        onClose={handleSuccessDone}
        onConfirm={handleSuccessDone}
        title="Password Updated! 🔐"
        subtitle="Your password has been securely updated. Use your new password the next time you sign in."
        badge="SECURITY & SESSION"
        type="success"
        confirmText="Done"
        singleButton={true}
        isDarkMode={isDarkMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF7',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundImageDark: {
    opacity: 0.15,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(22),
  },

  /* ── Top Nav ── */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(2),
  },
  backButton: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButtonDark: {
    backgroundColor: '#1C0D36',
    borderColor: '#371569',
  },

  /* ── Compact Center Illustration ── */
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(2),
    marginBottom: s(2),
  },
  illustration: {
    width: isSmallDevice ? s(105) : s(120),
    height: isSmallDevice ? s(80) : s(90),
  },

  /* ── Header ── */
  header: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? s(10) : s(14),
    marginTop: s(2),
  },
  title: {
    fontSize: isSmallDevice ? s(20) : s(21),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: s(3),
  },
  subtitle: {
    fontSize: isSmallDevice ? s(12) : s(12.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    paddingHorizontal: s(12),
  },
  subtitleDark: {
    color: '#CBD5E1',
  },

  /* ── Form matching Login & Signup ── */
  form: {
    width: '100%',
  },
  inputMargin: {
    marginBottom: isSmallDevice ? s(6) : s(8),
  },
  inputMarginTight: {
    marginBottom: s(3),
  },
  inputLabel: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(12) : s(12.5),
    marginBottom: s(3),
  },
  inputBox: {
    height: isSmallDevice ? s(40) : s(42),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: s(12),
  },
  inputBoxDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#6D28D9',
  },
  inputText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: isSmallDevice ? s(13) : s(13.5),
  },
  inputBoxError: {
    borderColor: '#E53E3E',
  },
  inputBoxSuccess: {
    borderColor: '#10B981',
  },
  fieldErrorText: {
    fontSize: isSmallDevice ? s(10.5) : s(11),
    color: '#E53E3E',
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: s(2),
    marginBottom: s(6),
    paddingHorizontal: s(4),
  },
  fieldSuccessText: {
    fontSize: isSmallDevice ? s(10.5) : s(11),
    color: '#10B981',
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: s(2),
    marginBottom: s(6),
    paddingHorizontal: s(4),
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s(2),
    marginBottom: s(6),
    paddingHorizontal: s(4),
  },
  strengthSegmentsWrap: {
    flexDirection: 'row',
    flex: 1,
    gap: s(4),
    marginRight: s(10),
  },
  strengthSegment: {
    flex: 1,
    height: s(3),
    borderRadius: s(1.5),
  },
  strengthLabel: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── Error Banner ── */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: s(10),
    paddingHorizontal: s(10),
    paddingVertical: s(6),
    marginBottom: s(8),
  },
  errorIcon: {
    marginRight: s(6),
  },
  errorBannerText: {
    flex: 1,
    fontSize: isSmallDevice ? s(11) : s(11.5),
    color: '#991B1B',
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: s(15),
  },

  /* ── Buttons matching Login & Signup ── */
  sendButton: {
    marginTop: isSmallDevice ? s(8) : s(12),
    marginBottom: isSmallDevice ? s(4) : s(6),
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonContent: {
    height: isSmallDevice ? s(44) : s(46),
    borderRadius: s(23),
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(14) : s(14.5),
    letterSpacing: 0.3,
  },
  backToProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallDevice ? s(6) : s(8),
    paddingVertical: s(6),
  },
  backToProfileIcon: {
    marginRight: s(6),
  },
  backToProfileText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(13.5) : s(14),
  },
  backToProfileTextDark: {
    color: '#C084FC',
  },
  textWhite: {
    color: '#FFFFFF',
  },
});

export default ChangePasswordScreen;
