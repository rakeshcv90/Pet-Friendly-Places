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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FastImage from 'react-native-fast-image';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Loader } from '../../../components/common/Loader';
import { theme } from '../../../theme';
import { useForgotPassword } from '../../../hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 750;

export const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = isPending || isSubmitting;

  const {
    forgotPasswordAsync,
    isPending,
    error: apiError,
    reset: resetApiError,
  } = useForgotPassword();

  const validateEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter your email address');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSendResetLink = async () => {
    Keyboard.dismiss();
    if (!validateEmail()) {
      return;
    }

    if (apiError) {
      resetApiError();
    }

    setIsSubmitting(true);
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));

    try {
      await Promise.all([
        forgotPasswordAsync(email.trim()),
        minDelay,
      ]);
      setIsSent(true);
    } catch {
      await minDelay;
      // Error message is automatically managed by useForgotPassword hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FastImage
        source={theme.images.backgroundimg1}
        style={[styles.backgroundImage, { bottom: insets.bottom }]}
        objectFit={Platform.OS === 'ios' && isSmallDevice ? 'fill' : 'cover'}
      />

      {/* Premium Animated Loader Modal */}
      <Loader
        visible={isLoading}
        title="Sending reset link..."
        subtitle="Connecting to server and sending instructions..."
      />

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, s(16)) + s(10),
            paddingBottom: Math.max(insets.bottom, s(16)) + s(20),
          },
        ]}
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {isSent ? (
          /* Confirmation Screen (Clean Native Full-Screen Layout, No Card) */
          <View style={styles.successContainer}>
            {/* Center Mailbox Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={theme.images.mailbox}
                style={styles.mailboxIllustration}
                resizeMode="contain"
              />
            </View>

            {/* Header Texts */}
            <View style={styles.header}>
              <Text style={styles.title}>Check your inbox</Text>
              <Text style={styles.subtitle}>
                If an account exists for that email, we&apos;ve sent a reset link to
              </Text>
            </View>

            {/* Email Pill */}
            <View style={styles.emailPill}>
              <Text style={styles.emailPillText}>{email.trim()}</Text>
            </View>

            {/* Instructions */}
            <Text style={styles.instructionsText}>
              Click the link in the email to reset your password. It may take a minute or two to
              arrive. Check your spam folder if you don&apos;t see it.
            </Text>

            {/* Back to Login Button */}
            <Button
              title="Back to login"
              onPress={() => navigation.navigate('Login')}
              width="80%"
              style={styles.sendButton}
              contentStyle={styles.sendButtonContent}
              textStyle={styles.sendButtonText}
            />

            {/* Try Another Email Row */}
            <View style={styles.tryAnotherRow}>
              <Text style={styles.tryAnotherText}>Didn&apos;t get the email? </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSent(false);
                  if (apiError) {
                    resetApiError();
                  }
                }}
                activeOpacity={0.7}>
                <Text style={styles.tryAnotherLink}>Try another email</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Email Input Form */
          <>
            {/* Center Illustration */}
            <View style={styles.illustrationContainer}>
              <Image
                source={theme.images.resetPassword}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Header Texts */}
            <View style={styles.header}>
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>Enter your email to get a reset link</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Email"
                labelStyle={styles.inputLabel}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.primary}
                value={email}
                onChangeText={txt => {
                  setEmail(txt);
                  if (emailError) {
                    setEmailError('');
                  }
                  if (apiError) {
                    resetApiError();
                  }
                }}
                inputWrapperStyle={[
                  styles.inputBox,
                  (emailError || apiError) ? styles.inputBoxError : null,
                ]}
                inputStyle={styles.inputText}
                leftIcon={
                  <FeatherIcon
                    name="mail"
                    size={isSmallDevice ? s(16) : s(18)}
                    color={theme.colors.primaryDark}
                  />
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? (
                <Text style={styles.fieldErrorText}>{emailError}</Text>
              ) : null}

              {/* Error Alert Banner */}
              {apiError ? (
                <View style={styles.errorBanner}>
                  <FeatherIcon
                    name="alert-circle"
                    size={s(15)}
                    color="#C0392B"
                    style={styles.errorIcon}
                  />
                  <Text style={styles.errorBannerText}>{apiError}</Text>
                </View>
              ) : null}

              {/* Send Reset Link Button */}
              <Button
                title={isLoading ? 'Sending link…' : 'Send reset link'}
                onPress={handleSendResetLink}
                isLoading={isLoading}
                disabled={isLoading || !email.trim()}
                style={styles.sendButton}
                contentStyle={styles.sendButtonContent}
                textStyle={styles.sendButtonText}
                gradientColors={
                  !email.trim() || isLoading
                    ? ['#C4B5E2', '#D1C8E8']
                    : ['rgb(59, 16, 143)', 'rgb(123, 44, 255)']
                }
                width="80%"
              />

              {/* Back to login */}
              <TouchableOpacity
                style={styles.backToLoginButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}>
                <FeatherIcon
                  name="arrow-left"
                  size={s(16)}
                  color={theme.colors.primary}
                  style={styles.backToLoginIcon}
                />
                <Text style={styles.backToLoginText}>Back to login</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF7',
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(24),
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(50),
  },
  illustration: {
    width: isSmallDevice ? s(200) : s(200),
    height: isSmallDevice ? s(140) : s(170),
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? s(20) : s(28),
  },
  title: {
    fontSize: isSmallDevice ? s(23) : s(23),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: s(6),
  },
  subtitle: {
    fontSize: isSmallDevice ? s(13.5) : s(13.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputLabel: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(13) : s(13),
    marginBottom: s(6),
  },
  inputBox: {
    height: isSmallDevice ? s(44) : s(44),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: s(12),
  },
  inputText: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: isSmallDevice ? s(13.5) : s(13.5),
  },
  inputBoxError: {
    borderColor: '#E53E3E',
  },
  fieldErrorText: {
    fontSize: isSmallDevice ? s(11) : s(11.5),
    color: '#E53E3E',
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: s(4),
    marginBottom: s(4),
    paddingHorizontal: s(4),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: s(10),
    paddingHorizontal: s(12),
    paddingVertical: s(8),
    marginTop: s(6),
    marginBottom: s(10),
  },
  errorIcon: {
    marginRight: s(8),
  },
  errorBannerText: {
    flex: 1,
    fontSize: isSmallDevice ? s(11.5) : s(12),
    color: '#991B1B',
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: s(16),
  },
  sendButton: {
    marginTop: isSmallDevice ? s(12) : s(16),
    marginBottom: isSmallDevice ? s(6) : s(10),
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonContent: {
    height: isSmallDevice ? s(46) : s(50),
    borderRadius: s(25),
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(14.5) : s(15.5),
    letterSpacing: 0.3,
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallDevice ? s(16) : s(20),
    paddingVertical: s(8),
  },
  backToLoginIcon: {
    marginRight: s(6),
  },
  backToLoginText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(14) : s(15),
  },

  /* Sent State Confirmation Clean Layout (No Card) */
  successContainer: {
    alignItems: 'center',
    width: '100%',
  },
  mailboxIllustration: {
    width: isSmallDevice ? s(120) : s(140),
    height: isSmallDevice ? s(120) : s(140),
  },
  emailPill: {
    backgroundColor: 'rgba(59, 16, 143, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 16, 143, 0.18)',
    borderRadius: s(20),
    paddingHorizontal: s(16),
    paddingVertical: s(6),
    marginTop: s(4),
    marginBottom: s(6),
    alignSelf: 'center',
  },
  emailPillText: {
    fontSize: isSmallDevice ? s(13.5) : s(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#3B108F',
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: isSmallDevice ? s(12.5) : s(13),
    lineHeight: s(19),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.primaryDark,
    opacity: 0.75,
    textAlign: 'center',
    marginTop: s(8),
    marginBottom: isSmallDevice ? s(14) : s(18),
    paddingHorizontal: s(14),
  },
  tryAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallDevice ? s(14) : s(18),
    paddingBottom: s(20),
  },
  tryAnotherText: {
    fontSize: isSmallDevice ? s(12.5) : s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.primaryDark,
    opacity: 0.75,
  },
  tryAnotherLink: {
    fontSize: isSmallDevice ? s(12.5) : s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
  },
});
