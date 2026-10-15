import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
import { theme } from '../../../theme';
import { useStore } from '../../../store';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 750;

export const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setAuthInfo } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (email && password) {
      setAuthInfo({ name: 'User', email }, 'mock_token_123');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <FastImage
        source={theme.images.backgroundimg}
        style={[styles.backgroundImage, { bottom: insets.bottom }]}
        objectFit="cover"
      />
      <KeyboardAwareScrollView
          style={styles.keyboardView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: isSmallDevice
                ? Math.max(insets.top, s(24)) + s(50)
                : Math.max(insets.top, s(50)) + s(50),
              // paddingBottom: Math.max(insets.bottom, s(16)) + s(16),
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
            <Input
              label="Email or Phone"
              labelStyle={styles.inputLabel}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.primary}
              value={email}
              onChangeText={setEmail}
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

            <Input
              label="Password"
              labelStyle={styles.inputLabel}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.primary}
              value={password}
              onChangeText={setPassword}
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

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Primary Login Button using common Button component with reduced width */}
            <Button
              title="Login"
              onPress={handleLogin}
              gradientColors={['rgb(5 16, 143)', 'rgb(123, 44, 255)']}
              width="80%"
              style={styles.loginButton}
              contentStyle={isSmallDevice ? styles.buttonCompactContent : null}
              textStyle={styles.loginButtonText}
            />

            {/* Footer positioned cleanly below Login button */}
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
    marginBottom: isSmallDevice ? s(14) : s(22),
  },
  logoImage: {
    width: isSmallDevice ? s(175) : s(210),
    height: isSmallDevice ? s(48) : s(58),
    marginBottom: isSmallDevice ? s(12) : s(20),
    alignSelf: 'center',
  },
  title: {
    fontSize: isSmallDevice ? s(25) : s(28),
    lineHeight: isSmallDevice ? s(30) : s(34),
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    textAlign: 'center',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
    }),
    marginBottom: s(4),
  },
  subtitle: {
    fontSize: isSmallDevice ? s(13.5) : s(15),
    color: theme.colors.primaryDark,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    // Left unconstrained by flex:1 so footer stays directly beneath the Login button
  },
  inputNormalMargin: {
    marginBottom: s(16),
  },
  inputCompactMargin: {
    marginBottom: s(10),
  },
  inputLabel: {
    color: theme.colors.primaryDark,
    fontWeight: '700',
    fontSize: isSmallDevice ? s(13) : s(14),
    marginBottom: isSmallDevice ? s(4) : s(6),
  },
  inputBox: {
    height: isSmallDevice ? s(44) : s(48),
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    marginBottom: isSmallDevice ? 0 : s(4),
  },
  inputText: {
    fontSize: s(15),
    color: theme.colors.primaryDark,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: isSmallDevice ? s(2) : s(6),
    marginBottom: isSmallDevice ? s(14) : s(20),
  },
  forgotPasswordText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(12.5) : s(13),
    fontWeight: '700',
  },
  loginButton: {
    marginTop: isSmallDevice ? s(2) : s(4),
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
    fontSize: isSmallDevice ? s(15) : s(16),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallDevice ? s(14) : s(22),
    paddingBottom: s(10),
  },
  footerText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(13) : s(14),
    fontWeight: '500',
  },
  signupText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(13) : s(14),
    fontWeight: '700',
  },
});
