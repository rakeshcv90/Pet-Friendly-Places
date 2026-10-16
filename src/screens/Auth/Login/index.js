import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Loader } from '../../../components/common/Loader';
import { theme } from '../../../theme';
import { useLogin } from '../../../hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 750;

export const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, isPending, error: apiError, reset: resetApiError } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Client-side form validation
  const validateForm = () => {
    const newErrors = {};
    const trimmed = email.trim();

    if (!trimmed) {
      newErrors.email = 'Please enter your email or phone number';
    } else {
      const isEmail = trimmed.includes('@');
      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
          newErrors.email = 'Please enter a valid email address';
        }
      } else {
        const cleanPhone = trimmed.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10) {
          newErrors.email = 'Please enter a valid 10-digit phone number';
        }
      }
    }

    if (!password) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailChange = text => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: null }));
    }
    if (apiError) {
      resetApiError();
    }
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: null }));
    }
    if (apiError) {
      resetApiError();
    }
  };

  const handleLogin = () => {
    if (!validateForm()) {
      return;
    }

    const trimmed = email.trim();
    const isEmail = trimmed.includes('@');
    const payload = isEmail ? { email: trimmed, password } : { phone: trimmed, password };

    login(payload);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FastImage
        source={theme.images.backgroundimg}
        style={[styles.backgroundImage, { bottom: insets.bottom }]}
        objectFit="cover"
      />

      {/* Premium Animated Loading Modal */}
      <Loader
        visible={isPending}
        title="Signing in..."
        subtitle="Verifying your account details..."
      />

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: isSmallDevice
              ? Math.max(insets.top, s(24)) + s(50)
              : Math.max(insets.top, s(50)) + s(50),
          },
        ]}
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <Image source={theme.images.logo} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* API Error Alert Banner */}
          {apiError ? (
            <View style={styles.apiErrorBanner}>
              <FeatherIcon
                name="alert-circle"
                size={s(16)}
                color="#B91C1C"
                style={styles.apiErrorIcon}
              />
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </View>
          ) : null}

          {/* Email or Phone Input */}
          <Input
            label="Email or Phone"
            labelStyle={styles.inputLabel}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.primary}
            value={email}
            onChangeText={handleEmailChange}
            error={errors.email}
            style={isSmallDevice ? styles.inputCompactMargin : styles.inputNormalMargin}
            inputWrapperStyle={styles.inputBox}
            inputStyle={styles.inputText}
            leftIcon={
              <FeatherIcon
                name="user"
                size={isSmallDevice ? s(16) : s(18)}
                color={theme.colors.primaryDark}
              />
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password Input */}
          <Input
            label="Password"
            labelStyle={styles.inputLabel}
            placeholder="••••••••"
            placeholderTextColor={theme.colors.primary}
            value={password}
            onChangeText={handlePasswordChange}
            error={errors.password}
            secureTextEntry={!showPassword}
            style={isSmallDevice ? styles.inputCompactMargin : styles.inputNormalMargin}
            inputWrapperStyle={styles.inputBox}
            inputStyle={styles.inputText}
            leftIcon={
              <FeatherIcon
                name="lock"
                size={isSmallDevice ? s(16) : s(18)}
                color={theme.colors.primaryDark}
              />
            }
            rightIcon={
              <FeatherIcon
                name={showPassword ? 'eye' : 'eye-off'}
                size={isSmallDevice ? s(16) : s(18)}
                color={theme.colors.primaryDark}
              />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Primary Login Button */}
          <Button
            title="Login"
            onPress={handleLogin}
            isLoading={isPending}
            disabled={isPending}
            gradientColors={['rgb(5 16, 143)', 'rgb(123, 44, 255)']}
            width="80%"
            style={styles.loginButton}
            contentStyle={isSmallDevice ? styles.buttonCompactContent : null}
            textStyle={styles.loginButtonText}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(24),
  },
  header: {
    marginBottom: isSmallDevice ? s(14) : s(14),
  },
  logoImage: {
    width: isSmallDevice ? s(175) : s(175),
    height: isSmallDevice ? s(48) : s(48),
    marginBottom: isSmallDevice ? s(12) : s(12),
    alignSelf: 'center',
  },
  title: {
    fontSize: isSmallDevice ? s(25) : s(25),
    lineHeight: isSmallDevice ? s(25) : s(25),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: s(4),
  },
  subtitle: {
    fontSize: isSmallDevice ? s(13.5) : s(13.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  form: {
    // Unconstrained so footer stays directly beneath the Login button
  },
  apiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: s(11),
    marginBottom: s(16),
  },
  apiErrorIcon: {
    marginRight: s(10),
  },
  apiErrorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: isSmallDevice ? s(12.5) : s(13.5),
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: s(18),
  },
  inputNormalMargin: {
    marginBottom: s(14),
  },
  inputCompactMargin: {
    marginBottom: s(10),
  },
  inputLabel: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: isSmallDevice ? s(13) : s(13),
    marginBottom: isSmallDevice ? s(4) : s(4),
  },
  inputBox: {
    height: isSmallDevice ? s(44) : s(44),
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    marginBottom: isSmallDevice ? 0 : s(4),
  },
  inputText: {
    fontSize: s(15),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.regular,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: isSmallDevice ? s(2) : s(2),
    marginBottom: isSmallDevice ? s(14) : s(14),
  },
  forgotPasswordText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(12.5) : s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  loginButton: {
    marginTop: isSmallDevice ? s(2) : s(2),
    color: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCompactContent: {
    height: s(46),
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallDevice ? s(15) : s(15),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallDevice ? s(14) : s(14),
    paddingBottom: s(10),
  },
  footerText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(13) : s(13),
    fontFamily: theme.typography.fontFamily.medium,
  },
  signupText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(13) : s(13),
    fontFamily: theme.typography.fontFamily.bold,
  },
});
