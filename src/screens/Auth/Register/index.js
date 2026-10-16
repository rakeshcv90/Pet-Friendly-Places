import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Dimensions,
  Keyboard,
  Animated,
} from 'react-native';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FastImage from 'react-native-fast-image';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Loader } from '../../../components/common/Loader';
import { CityPickerModal } from '../../../components/common/CityPickerModal';
import { theme } from '../../../theme';
import { useRegister } from '../../../hooks/useAuth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 750;
const CARD_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.76), s(290));
const CARD_MARGIN = s(12);
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;
const DOT_SLOT_WIDTH = s(22);
const ACTIVE_PILL_WIDTH = s(22);

const ROLE_OPTIONS = [
  {
    idx: 0,
    icon: '🐾',
    title: 'Pet Parent',
    description: 'Looking for pet-friendly places to visit, ask questions, share experiences',
    role: 'pet_parent',
    intent: 'pet_parent',
  },
  {
    idx: 1,
    icon: '🏠',
    title: 'Place Host',
    description: 'I run a hotel, café, resort, homestay, or other pet-friendly place',
    role: 'property_owner',
    intent: 'place_host',
  },
  {
    idx: 2,
    icon: '🚕',
    title: 'On-the-Go Partner',
    description: 'I run a pet taxi, relocation, grooming van, or mobile pet service',
    role: 'property_owner',
    intent: 'on_the_go_partner',
  },
  {
    idx: 3,
    icon: '🩺',
    title: 'Vet or Pet Professional',
    description:
      'I run a vet clinic or pet care practice. Full vet-verified status is granted once you claim your clinic listing.',
    role: 'property_owner',
    intent: 'vet_pro',
  },
];

export const RegisterScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { registerAsync, isPending, error: apiError, reset: resetApiError } = useRegister();

  // Multi-step signup: 1 = Details, 2 = Role selection, 3 = Verification email sent
  const [step, setStep] = useState(1);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [city, setCity] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);

  // Consents (Only isAdult and agreed are mandatory)
  const [isAdult, setIsAdult] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [subscribeTips, setSubscribeTips] = useState(false);

  // Role selection
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const horizontalScrollRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const step2EntranceAnim = useRef(new Animated.Value(0)).current;

  // Entrance animation when entering Step 2 + sync initial scroll position
  useEffect(() => {
    if (step === 2) {
      step2EntranceAnim.setValue(0);
      Animated.spring(step2EntranceAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        const scrollNode = horizontalScrollRef.current?.getNode
          ? horizontalScrollRef.current.getNode()
          : horizontalScrollRef.current;
        scrollNode?.scrollTo({
          x: selectedRoleIdx * SNAP_INTERVAL,
          animated: false,
        });
        scrollX.setValue(selectedRoleIdx * SNAP_INTERVAL);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Sliding Capsule Pagination with Liquid Elastic Stretch
  const paginationTranslateX = scrollX.interpolate({
    inputRange: ROLE_OPTIONS.map((_, i) => i * SNAP_INTERVAL),
    outputRange: ROLE_OPTIONS.map((_, i) => i * DOT_SLOT_WIDTH),
    extrapolate: 'clamp',
  });

  const stretchRange = [];
  const stretchOutput = [];
  ROLE_OPTIONS.forEach((_, i) => {
    stretchRange.push(i * SNAP_INTERVAL);
    stretchOutput.push(1);
    if (i < ROLE_OPTIONS.length - 1) {
      stretchRange.push((i + 0.5) * SNAP_INTERVAL);
      stretchOutput.push(1.3);
    }
  });

  const paginationScaleX = scrollX.interpolate({
    inputRange: stretchRange,
    outputRange: stretchOutput,
    extrapolate: 'clamp',
  });

  const handleRoleSelect = idx => {
    setSelectedRoleIdx(idx);
    if (apiError) {
      resetApiError();
    }
    const scrollNode = horizontalScrollRef.current?.getNode
      ? horizontalScrollRef.current.getNode()
      : horizontalScrollRef.current;
    scrollNode?.scrollTo({
      x: idx * SNAP_INTERVAL,
      animated: true,
    });
  };

  const handleScrollEnd = event => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIdx = Math.round(offsetX / SNAP_INTERVAL);
    if (newIdx >= 0 && newIdx < ROLE_OPTIONS.length && newIdx !== selectedRoleIdx) {
      setSelectedRoleIdx(newIdx);
      if (apiError) {
        resetApiError();
      }
    }
  };

  // Verification state
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Only the two required checkboxes control whether Next is active
  const canSubmitStep1 = Boolean(isAdult && agreed);

  // Form validation on Next press
  const validateStep1 = () => {
    const errs = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errs.email = 'Please enter your email';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errs.email = 'Please enter a valid email address';
      }
    }

    if (!password) {
      errs.password = 'Please enter a password';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords don't match";
    }

    if (!city || !city.trim()) {
      errs.city = 'Please select your city';
    }

    if (!isAdult) {
      errs.isAdult = 'You must confirm you are 18 or older';
    }

    if (!agreed) {
      errs.agreed = 'You must agree to the Terms of Service';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      if (apiError) {
        resetApiError();
      }
      setStep(2);
      setTimeout(() => {
        horizontalScrollRef.current?.scrollTo({
          x: selectedRoleIdx * SNAP_INTERVAL,
          animated: false,
        });
      }, 60);
    }
  };

  const handleSelectCity = selectedCity => {
    Keyboard.dismiss();
    setCity(selectedCity);
    if (fieldErrors.city) {
      setFieldErrors(prev => ({ ...prev, city: null }));
    }
    setIsCityModalVisible(false);
  };

  // Create Account submission
  const handleCreateAccount = async () => {
    const chosenRole = ROLE_OPTIONS[selectedRoleIdx] || ROLE_OPTIONS[0];
    const payload = {
      email: email.trim(),
      password,
      age_affirmed: Boolean(isAdult),
      agree_terms: Boolean(agreed),
      marketing_opt_in: Boolean(subscribeTips),
      role: chosenRole.role,
      location: city,
      intent: chosenRole.intent,
    };

    if (name.trim()) {
      payload.display_name = name.trim();
    }

    try {
      await registerAsync(payload);
      setRegisteredEmail(email.trim());
      setStep(3);
    } catch {
      // Error message is automatically managed by useRegister
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

      {/* Premium Animated Loading Modal */}
      <Loader
        visible={isPending}
        title="Creating your account..."
        subtitle="Setting up your pet profile..."
      />

      <KeyboardAwareScrollView
        style={styles.keyboardView}
        scrollEnabled={step === 1}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: isSmallDevice
              ? Math.max(insets.top, s(-10)) + s(-10)
              : Math.max(insets.top, s(0)) + s(0),
            paddingBottom: s(10),
          },
        ]}
        enableOnAndroid={true}
        enableResetScrollToCoords={false}
        extraHeight={s(30)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* ── STEP 1: Account Details ── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>Create your account</Text>
              <Text style={styles.subtitle}>Join our pet-friendly community</Text>
            </View>

            <View style={styles.form}>
              {/* Row 1: Name + Email */}
              <View style={styles.row}>
                <View style={styles.leftCol}>
                  <Input
                    label="Your name (optional)"
                    labelStyle={styles.inputLabel}
                    placeholder="e.g. Priya"
                    placeholderTextColor={theme.colors.primary}
                    value={name}
                    onChangeText={setName}
                    style={styles.inputWrapperContainer}
                    inputWrapperStyle={styles.inputBox}
                    inputStyle={styles.inputText}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.rightCol}>
                  <Input
                    label="Email address"
                    labelStyle={styles.inputLabel}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.primary}
                    value={email}
                    onChangeText={txt => {
                      setEmail(txt);
                      if (fieldErrors.email) {
                        setFieldErrors(prev => ({ ...prev, email: null }));
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.inputWrapperContainer}
                    inputWrapperStyle={[
                      styles.inputBox,
                      fieldErrors.email ? styles.inputBoxError : null,
                    ]}
                    inputStyle={styles.inputText}
                  />
                  {fieldErrors.email && (
                    <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
                  )}
                </View>
              </View>

              {/* Row 2: Password + Confirm Password */}
              <View style={styles.row}>
                <View style={styles.leftCol}>
                  <Input
                    label="Password"
                    labelStyle={styles.inputLabel}
                    placeholder="At least 8 chars"
                    placeholderTextColor={theme.colors.primary}
                    value={password}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={txt => {
                      setPassword(txt);
                      if (fieldErrors.password) {
                        setFieldErrors(prev => ({ ...prev, password: null }));
                      }
                    }}
                    secureTextEntry={!showPassword}
                    style={styles.inputWrapperContainer}
                    inputWrapperStyle={[
                      styles.inputBox,
                      fieldErrors.password ? styles.inputBoxError : null,
                    ]}
                    inputStyle={styles.inputText}
                    rightIcon={
                      <FeatherIcon
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={s(15)}
                        color={theme.colors.primaryDark}
                      />
                    }
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />
                  {fieldErrors.password && (
                    <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>
                  )}
                </View>

                <View style={styles.rightCol}>
                  <Input
                    label="Confirm password"
                    labelStyle={styles.inputLabel}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.colors.primary}
                    value={confirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={txt => {
                      setConfirmPassword(txt);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                      }
                    }}
                    secureTextEntry={!showConfirmPassword}
                    style={styles.inputWrapperContainer}
                    inputWrapperStyle={[
                      styles.inputBox,
                      fieldErrors.confirmPassword ||
                      (confirmPassword.length > 0 && password !== confirmPassword)
                        ? styles.inputBoxError
                        : null,
                    ]}
                    inputStyle={styles.inputText}
                    rightIcon={
                      <FeatherIcon
                        name={showConfirmPassword ? 'eye' : 'eye-off'}
                        size={s(15)}
                        color={theme.colors.primaryDark}
                      />
                    }
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  {confirmPassword.length > 0 && password !== confirmPassword ? (
                    <Text style={styles.fieldErrorText}>Passwords don&apos;t match</Text>
                  ) : fieldErrors.confirmPassword ? (
                    <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
                  ) : null}
                </View>
              </View>

              {/* Row 3: City Dropdown */}
              <View style={styles.citySection}>
                <Text style={styles.inputLabel}>Your city</Text>
                <TouchableOpacity
                  style={[styles.cityDropdown, fieldErrors.city ? styles.inputBoxError : null]}
                  onPress={() => setIsCityModalVisible(true)}
                  activeOpacity={0.8}>
                  <Text
                    style={[styles.cityText, !city && styles.cityPlaceholder]}
                    numberOfLines={1}>
                    {city || 'Select your city'}
                  </Text>
                  <FeatherIcon name="chevron-down" size={s(18)} color={theme.colors.primaryDark} />
                </TouchableOpacity>
                {fieldErrors.city ? (
                  <Text style={styles.fieldErrorText}>{fieldErrors.city}</Text>
                ) : (
                  <Text style={styles.citySubtext}>
                    Used for nearby recommendations. You can change it later.
                  </Text>
                )}
              </View>

              {/* Checkbox Divider Line */}
              <View style={styles.checkboxDivider} />

              {/* Checkbox 1: Age affirmation (MANDATORY) */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setIsAdult(!isAdult);
                  if (fieldErrors.isAdult) {
                    setFieldErrors(prev => ({ ...prev, isAdult: null }));
                  }
                }}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.checkbox,
                    isAdult && styles.checkboxChecked,
                    fieldErrors.isAdult && styles.checkboxError,
                  ]}>
                  {isAdult && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabelBold}>I&apos;m 18 or older.</Text>
              </TouchableOpacity>

              {/* Checkbox 2: Terms & Privacy (MANDATORY) */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  setAgreed(!agreed);
                  if (fieldErrors.agreed) {
                    setFieldErrors(prev => ({ ...prev, agreed: null }));
                  }
                }}
                activeOpacity={0.7}>
                <View
                  style={[
                    styles.checkbox,
                    agreed && styles.checkboxChecked,
                    fieldErrors.agreed && styles.checkboxError,
                  ]}>
                  {agreed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
              </TouchableOpacity>

              {/* Checkbox 3: Optional tips (OPTIONAL) */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSubscribeTips(!subscribeTips)}
                activeOpacity={0.7}>
                <View style={[styles.checkbox, subscribeTips && styles.checkboxChecked]}>
                  {subscribeTips && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabelMuted}>
                  Send me occasional pet-travel tips and updates. (optional)
                </Text>
              </TouchableOpacity>

              {/* Primary Action Button */}
              <Button
                title="Next"
                onPress={handleNextStep}
                disabled={!canSubmitStep1}
                gradientColors={!canSubmitStep1 ? ['#C4B5E2', '#D1C8E8'] : undefined}
                width="85%"
                style={styles.registerButton}
                contentStyle={isSmallDevice ? styles.buttonCompactContent : null}
                textStyle={styles.registerButtonText}
              />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={styles.loginLinkText}>Log in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── STEP 2: Role Selection (Clean Native Full-Screen Layout) ── */}
        {step === 2 && (
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: step2EntranceAnim,
                transform: [
                  {
                    translateY: step2EntranceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [s(14), 0],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.header}>
              <Text style={styles.title}>How will you use{'\n'}Pet Friendly Places?</Text>
              <Text style={styles.subtitle}>This helps us set up your profile.</Text>
            </View>

            {/* Horizontal Swipable List of Role Cards */}
            <View style={styles.horizontalListWrapper}>
              <Animated.ScrollView
                ref={horizontalScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                disableIntervalMomentum={true}
                overScrollMode="never"
                bounces={false}
                nestedScrollEnabled={true}
                contentContainerStyle={styles.horizontalScrollContent}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                  useNativeDriver: true,
                })}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScrollEnd}>
                {ROLE_OPTIONS.map((item, index) => {
                  const isSelected = selectedRoleIdx === item.idx;

                  const inputRange = [
                    (index - 1) * SNAP_INTERVAL,
                    index * SNAP_INTERVAL,
                    (index + 1) * SNAP_INTERVAL,
                  ];

                  // 3D scale transition
                  const cardScale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.93, 1.0, 0.93],
                    extrapolate: 'clamp',
                  });

                  // 3D perspective rotation (subtle, elegant curved carousel depth)
                  const cardRotateY = scrollX.interpolate({
                    inputRange,
                    outputRange: ['-6deg', '0deg', '6deg'],
                    extrapolate: 'clamp',
                  });

                  // Depth of field opacity
                  const cardOpacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.72, 1.0, 0.72],
                    extrapolate: 'clamp',
                  });

                  // 3D vertical lift for the active card
                  const cardTranslateY = scrollX.interpolate({
                    inputRange,
                    outputRange: [s(4), -s(2), s(4)],
                    extrapolate: 'clamp',
                  });

                  // Floating 3D pop for the icon inside active card
                  const iconScale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.9, 1.08, 0.9],
                    extrapolate: 'clamp',
                  });

                  const iconTranslateY = scrollX.interpolate({
                    inputRange,
                    outputRange: [0, -s(2), 0],
                    extrapolate: 'clamp',
                  });

                  return (
                    <TouchableOpacity
                      key={item.idx}
                      onPress={() => handleRoleSelect(item.idx)}
                      activeOpacity={0.88}>
                      <Animated.View
                        renderToHardwareTextureAndroid={true}
                        style={[
                          styles.roleCard,
                          isSelected ? styles.roleCardSelected : styles.roleCardUnselected,
                          {
                            opacity: cardOpacity,
                            transform: [
                              { perspective: 1000 },
                              { scale: cardScale },
                              { translateY: cardTranslateY },
                              { rotateY: cardRotateY },
                            ],
                          },
                        ]}>
                        {/* Top row: Icon and check badge */}
                        <View style={styles.cardTopRow}>
                          <Animated.View
                            renderToHardwareTextureAndroid={true}
                            style={[
                              styles.cardIconWrap,
                              isSelected && styles.cardIconWrapSelected,
                              {
                                transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
                              },
                            ]}>
                            <Text style={styles.cardIcon}>{item.icon}</Text>
                          </Animated.View>
                          <View
                            style={[
                              styles.cardBadge,
                              isSelected ? styles.cardBadgeSelected : styles.cardBadgeUnselected,
                            ]}>
                            {isSelected && (
                              <FeatherIcon name="check" size={s(12)} color="#FFFFFF" />
                            )}
                          </View>
                        </View>

                        {/* Title */}
                        <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                          {item.title}
                        </Text>

                        {/* Description */}
                        <Text style={styles.cardDescription}>{item.description}</Text>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </Animated.ScrollView>

              {/* Sliding Capsule Pagination with Liquid Elastic Stretch */}
              <View style={styles.paginationContainer}>
                <View style={styles.dotsTrack}>
                  {ROLE_OPTIONS.map(item => (
                    <TouchableOpacity
                      key={`dot-slot-${item.idx}`}
                      onPress={() => handleRoleSelect(item.idx)}
                      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                      style={styles.inactiveDotSlot}>
                      <View style={styles.inactiveDot} />
                    </TouchableOpacity>
                  ))}

                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.activePill,
                      {
                        transform: [
                          { translateX: paginationTranslateX },
                          { scaleX: paginationScaleX },
                        ],
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Caption Note */}
            <Text style={styles.communityNote}>
              All accounts include full community access. Your choice helps us set up your profile.
            </Text>

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

            {/* Create Account Action Button */}
            <Button
              title={isPending ? 'Creating account…' : 'Create account'}
              onPress={handleCreateAccount}
              isLoading={isPending}
              disabled={isPending || selectedRoleIdx === null || selectedRoleIdx === undefined}
              gradientColors={isPending ? ['#C4B5E2', '#D1C8E8'] : undefined}
              width="85%"
              style={styles.registerButton}
              contentStyle={isSmallDevice ? styles.buttonCompactContent : null}
              textStyle={styles.registerButtonText}
            />

            {/* Back Button below Create Account Button */}
            <TouchableOpacity
              style={styles.backBelowCreateButton}
              onPress={() => {
                if (apiError) {
                  resetApiError();
                }
                setStep(1);
              }}
              activeOpacity={0.7}>
              <FeatherIcon name="arrow-left" size={s(16)} color={theme.colors.primaryDark} />
              <Text style={styles.backBelowCreateText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── STEP 3: Verification Sent (Clean Native Full-Screen Layout) ── */}
        {step === 3 && (
          <View style={[styles.stepContainer, styles.successContainer]}>
            {/* 3D Mailbox Graphic */}
            <FastImage
              source={theme.images.mailbox}
              style={styles.mailboxImage}
              resizeMode="contain"
            />

            {/* Title & Subtitle */}
            <Text style={styles.title}>Check your inbox</Text>
            <Text style={styles.subtitle}>We sent a verification link to</Text>

            {/* Registered Email Pill */}
            <View style={styles.emailPill}>
              <Text style={styles.successEmail}>{registeredEmail || email}</Text>
            </View>

            {/* Instructions */}
            <Text style={styles.successInstructions}>
              Click the link in the email to activate your account. It may take a minute or two to
              arrive. Check your spam folder if you don&apos;t see it.
            </Text>

            {/* Go to Login Button */}
            <Button
              title="Go to login"
              onPress={() => navigation.navigate('Login')}
              width="85%"
              style={styles.registerButton}
              contentStyle={isSmallDevice ? styles.buttonCompactContent : null}
              textStyle={styles.registerButtonText}
            />

            {/* Wrong email footnote */}
            <View style={styles.wrongEmailRow}>
              <Text style={styles.wrongEmailText}>Wrong email? </Text>
              <TouchableOpacity
                onPress={() => {
                  setStep(1);
                  if (apiError) {
                    resetApiError();
                  }
                }}
                activeOpacity={0.7}>
                <Text style={styles.startOverText}>Start over</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAwareScrollView>

      {/* Reusable City Picker Modal Component */}
      <CityPickerModal
        visible={isCityModalVisible}
        selectedCity={city}
        onSelectCity={handleSelectCity}
        onClose={() => setIsCityModalVisible(false)}
      />
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
    paddingHorizontal: s(20),
  },
  stepContainer: {
    width: '100%',
    marginTop: s(50),
  },

  // ── Header (Unified across all steps) ──
  header: {
    marginBottom: s(14),
  },
  title: {
    fontSize: s(22),
    lineHeight: s(30),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    textAlign: 'center',
    marginBottom: s(4),
  },
  subtitle: {
    fontSize: s(13.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
    opacity: 0.85,
  },

  // ── Back Button ──
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(10),
    alignSelf: 'flex-start',
    paddingVertical: s(4),
    paddingRight: s(12),
  },
  backButtonText: {
    color: theme.colors.primaryDark,
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    marginLeft: s(4),
  },

  // ── Form (Step 1) ──
  form: {
    marginTop: s(2),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: s(2),
  },
  leftCol: {
    flex: 1,
    marginRight: s(5),
  },
  rightCol: {
    flex: 1,
    marginLeft: s(5),
  },
  inputWrapperContainer: {
    marginBottom: s(8),
  },
  inputLabel: {
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12),
    marginBottom: s(4),
  },
  inputBox: {
    height: s(44),
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    marginBottom: 0,
    paddingHorizontal: s(8),
  },
  inputBoxError: {
    borderColor: '#E53E3E',
  },
  inputText: {
    fontSize: s(12.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.regular,
    paddingHorizontal: s(2),
  },
  fieldErrorText: {
    fontSize: s(10.5),
    color: '#E53E3E',
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: s(2),
    marginBottom: s(6),
  },
  citySection: {
    marginBottom: s(10),
  },
  cityDropdown: {
    height: s(44),
    borderWidth: 1.2,
    borderColor: theme.colors.primary,
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
  },
  cityText: {
    fontSize: s(13),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
  },
  cityPlaceholder: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  citySubtext: {
    fontSize: s(10.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.regular,
    opacity: 0.7,
    marginTop: s(4),
    paddingHorizontal: s(2),
  },
  checkboxDivider: {
    height: 1,
    backgroundColor: '#EAE0F8',
    marginTop: s(4),
    marginBottom: s(12),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: s(10),
  },
  checkbox: {
    width: s(20),
    height: s(20),
    borderWidth: 1.6,
    borderColor: theme.colors.primaryDark,
    borderRadius: s(5),
    marginRight: s(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: s(1),
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primaryDark,
    borderColor: theme.colors.primaryDark,
  },
  checkboxError: {
    borderColor: '#E53E3E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
  },
  checkboxLabelBold: {
    fontSize: s(12),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.bold,
    flex: 1,
    lineHeight: s(18),
  },
  checkboxLabel: {
    fontSize: s(12),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.medium,
    flex: 1,
    lineHeight: s(18),
  },
  checkboxLabelMuted: {
    fontSize: s(11.5),
    color: theme.colors.primaryDark,
    fontFamily: theme.typography.fontFamily.regular,
    opacity: 0.75,
    flex: 1,
    lineHeight: s(18),
  },
  linkText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },

  // ── Unified Buttons ──
  registerButton: {
    marginTop: isSmallDevice ? s(6) : s(10),
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonCompactContent: {
    height: s(46),
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: isSmallDevice ? s(15) : s(16),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallDevice ? s(14) : s(18),
    paddingBottom: s(16),
  },
  footerText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(13) : s(13),
    fontFamily: theme.typography.fontFamily.medium,
  },
  loginLinkText: {
    color: theme.colors.primaryDark,
    fontSize: isSmallDevice ? s(12) : s(12),
    fontFamily: theme.typography.fontFamily.bold,
  },

  // ── Step 2: Role Selection (Horizontal Swipable List) ──
  horizontalListWrapper: {
    marginHorizontal: -s(20),
    marginTop: s(12),
    marginBottom: s(4),
  },
  horizontalScrollContent: {
    paddingHorizontal: s(20),
    paddingVertical: s(6),
  },
  roleCard: {
    width: CARD_WIDTH,
    minHeight: isSmallDevice ? s(156) : s(174),
    padding: s(16),
    borderRadius: s(22),
    marginRight: CARD_MARGIN,
    justifyContent: 'flex-start',
    shadowColor: '#3B108F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  roleCardSelected: {
    borderWidth: 2,
    borderBottomWidth: 4.5,
    borderColor: '#3B108F',
    borderBottomColor: '#24065A',
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  roleCardUnselected: {
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    borderColor: 'rgba(59, 16, 143, 0.12)',
    borderBottomColor: 'rgba(59, 16, 143, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s(10),
  },
  cardIconWrap: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 16, 143, 0.12)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(59, 16, 143, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B108F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardIconWrapSelected: {
    backgroundColor: '#FAF7FF',
    borderColor: 'rgba(59, 16, 143, 0.28)',
    borderBottomWidth: 3.5,
    borderBottomColor: 'rgba(59, 16, 143, 0.42)',
    shadowOpacity: 0.2,
    elevation: 5,
  },
  cardIcon: {
    fontSize: s(24),
  },
  cardBadge: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadgeSelected: {
    backgroundColor: '#3B108F',
    borderBottomWidth: 2,
    borderBottomColor: '#200550',
    shadowColor: '#3B108F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  cardBadgeUnselected: {
    borderWidth: 1.5,
    borderColor: 'rgba(59, 16, 143, 0.22)',
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#241B35',
    marginBottom: s(6),
  },
  cardTitleSelected: {
    color: '#3B108F',
  },
  cardDescription: {
    fontSize: s(12),
    lineHeight: s(17.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#5A4D6B',
  },
  paginationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(12),
    marginBottom: s(6),
  },
  dotsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: s(12),
    position: 'relative',
    width: ROLE_OPTIONS.length * DOT_SLOT_WIDTH,
  },
  inactiveDotSlot: {
    width: DOT_SLOT_WIDTH,
    height: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: 'rgba(59, 16, 143, 0.2)',
  },
  activePill: {
    position: 'absolute',
    left: (DOT_SLOT_WIDTH - ACTIVE_PILL_WIDTH) / 2,
    top: (s(12) - s(6)) / 2,
    width: ACTIVE_PILL_WIDTH,
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#3B108F',
  },
  communityNote: {
    fontSize: s(11.5),
    lineHeight: s(16),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.primaryDark,
    opacity: 0.75,
    textAlign: 'center',
    marginTop: s(4),
    marginBottom: s(12),
    paddingHorizontal: s(10),
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCCCC',
    borderRadius: s(10),
    padding: s(10),
    marginBottom: s(12),
    marginHorizontal: s(10),
  },
  errorIcon: {
    marginRight: s(6),
  },
  errorBannerText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#C0392B',
    flex: 1,
  },
  backBelowCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(14),
    paddingVertical: s(8),
    paddingHorizontal: s(16),
    alignSelf: 'center',
  },
  backBelowCreateText: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primaryDark,
    marginLeft: s(6),
  },

  // ── Step 3: Success Screen ──
  successContainer: {
    alignItems: 'center',
    paddingTop: s(20),
  },
  mailboxImage: {
    width: s(84),
    height: s(84),
    marginBottom: s(20),
    alignSelf: 'center',
  },
  emailPill: {
    backgroundColor: 'rgba(59, 16, 143, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 16, 143, 0.18)',
    borderRadius: s(20),
    paddingHorizontal: s(16),
    paddingVertical: s(6),
    marginTop: s(8),
    marginBottom: s(8),
    alignSelf: 'center',
  },
  successEmail: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#3B108F',
    textAlign: 'center',
  },
  successInstructions: {
    fontSize: s(13),
    lineHeight: s(19.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.primaryDark,
    opacity: 0.75,
    textAlign: 'center',
    marginVertical: s(16),
    paddingHorizontal: s(16),
  },
  wrongEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(16),
    paddingBottom: s(20),
  },
  wrongEmailText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.primaryDark,
    opacity: 0.75,
  },
  startOverText: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7B2CFF',
  },
});

export default RegisterScreen;
