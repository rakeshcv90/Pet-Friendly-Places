import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Platform,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

export const ModernConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Sign Out',
  subtitle = 'Are you sure you want to sign out of PetFriendly?',
  badge = 'SECURITY & SESSION',
  type = 'logout',
  confirmText = 'Sign Out',
  cancelText = 'Cancel',
  singleButton = false,
  isDarkMode = false,
  showCloseButton = true,
}) => {
  // ── Entrance & Stagger Spring Animations ──
  const backdropFade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.72)).current;
  const cardTranslateY = useRef(new Animated.Value(42)).current;
  const cardRotate = useRef(new Animated.Value(0)).current; // -2deg to 0deg
  const contentFade = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(24)).current;

  // ── 3D Icon Entrance & Elastic Bounce ──
  const iconPop = useRef(new Animated.Value(0)).current;

  // ── Continuous Ambient Micro-Animation Loops ──
  // 1. Dual Concentric Ripple Halos
  const auraPulse1 = useRef(new Animated.Value(1)).current;
  const auraPulse2 = useRef(new Animated.Value(1)).current;

  // 2. 3D Floating Levitation & Subtle Dynamic Tilt
  const iconFloatY = useRef(new Animated.Value(0)).current;
  const iconTilt = useRef(new Animated.Value(0)).current;

  // 3. Luxurious Diagonal Shimmer Light Sweep across Modal Card
  const shimmerTranslateX = useRef(new Animated.Value(-350)).current;

  // 4. Ambient Twinkling Floating Sparkles
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // 5. Pulsing Status Beacon Dot
  const dotPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset values for a fresh cinematic arrival
      backdropFade.setValue(0);
      cardScale.setValue(0.72);
      cardTranslateY.setValue(42);
      cardRotate.setValue(0);
      iconPop.setValue(0);
      contentFade.setValue(0);
      buttonsTranslateY.setValue(24);
      shimmerTranslateX.setValue(-350);

      // ── 1. Orchestrated Entrance Sequence ──
      Animated.parallel([
        Animated.timing(backdropFade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          damping: 14,
          mass: 0.72,
          stiffness: 210,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          damping: 16,
          mass: 0.78,
          stiffness: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cardRotate, {
          toValue: 1,
          damping: 15,
          mass: 0.75,
          stiffness: 190,
          useNativeDriver: true,
        }),
        // Icon pop-in with bouncy elastic overshoot
        Animated.sequence([
          Animated.delay(60),
          Animated.spring(iconPop, {
            toValue: 1,
            damping: 10,
            mass: 0.58,
            stiffness: 230,
            useNativeDriver: true,
          }),
        ]),
        // Content fade & gentle upward slide
        Animated.sequence([
          Animated.delay(95),
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Buttons snappy spring entrance
        Animated.sequence([
          Animated.delay(125),
          Animated.spring(buttonsTranslateY, {
            toValue: 0,
            damping: 15,
            mass: 0.75,
            stiffness: 185,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // ── 2. Dual Concentric Ripple Halos ──
      const auraLoop1 = Animated.loop(
        Animated.sequence([
          Animated.timing(auraPulse1, {
            toValue: 1.34,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(auraPulse1, {
            toValue: 1.0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      auraLoop1.start();

      const auraLoop2 = Animated.loop(
        Animated.sequence([
          Animated.timing(auraPulse2, {
            toValue: 1.48,
            duration: 2400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(auraPulse2, {
            toValue: 1.0,
            duration: 2400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      auraLoop2.start();

      // ── 3. 3D Floating Levitation & Subtle Bobbing ──
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(iconFloatY, {
            toValue: -4.5,
            duration: 1700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconFloatY, {
            toValue: 1.5,
            duration: 1700,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      floatLoop.start();

      const tiltLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(iconTilt, {
            toValue: 1,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(iconTilt, {
            toValue: 0,
            duration: 1900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      tiltLoop.start();

      // ── 4. Diagonal Shimmer Light Sweep across the Card ──
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(350),
          Animated.timing(shimmerTranslateX, {
            toValue: 360,
            duration: 850,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.delay(3800),
          Animated.timing(shimmerTranslateX, {
            toValue: -350,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
      shimmerLoop.start();

      // ── 5. Ambient Twinkling Floating Sparkles ──
      const sparkleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      sparkleLoop.start();

      // ── 6. Pulsing Overline Badge Dot ──
      const dotLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(dotPulse, {
            toValue: 1.35,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotPulse, {
            toValue: 1.0,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      dotLoop.start();

      return () => {
        auraLoop1.stop();
        auraLoop2.stop();
        floatLoop.stop();
        tiltLoop.stop();
        shimmerLoop.stop();
        sparkleLoop.stop();
        dotLoop.stop();
      };
    }
  }, [
    visible,
    backdropFade,
    cardScale,
    cardTranslateY,
    cardRotate,
    iconPop,
    contentFade,
    buttonsTranslateY,
    auraPulse1,
    auraPulse2,
    iconFloatY,
    iconTilt,
    shimmerTranslateX,
    sparkleAnim,
    dotPulse,
  ]);

  const handleDismiss = () => {
    onClose?.();
  };

  const handleConfirm = () => {
    onClose?.();
    onConfirm?.();
  };

  const isLogout = type === 'logout' || type === 'danger';
  const isSuccess = type === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropFade }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                isDarkMode && styles.modalCardDark,
                {
                  opacity: backdropFade,
                  transform: [
                    { scale: cardScale },
                    { translateY: cardTranslateY },
                    {
                      rotate: cardRotate.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-1.8deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}>
              {/* ── Top Subtle Device Native Handle Bar ── */}
              <View style={[styles.topHandleBar, isDarkMode && styles.topHandleBarDark]} />

              {/* ── Top-Right Frosted Circular Close Button ── */}
              {showCloseButton && (
                <BouncyPressable
                  testID="modern-confirm-close-btn"
                  accessibilityLabel="Close modal"
                  style={[styles.closeBtn, isDarkMode && styles.closeBtnDark]}
                  activeScale={0.88}
                  onPress={handleDismiss}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons
                    name="close"
                    size={ms(16)}
                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                  />
                </BouncyPressable>
              )}

              {/* ── Ambient Radial Backlight Glow ── */}
              <View
                style={[
                  styles.ambientBacklight,
                  isLogout && styles.backlightLogout,
                  isSuccess && styles.backlightSuccess,
                  isDarkMode && styles.backlightDark,
                ]}
              />

              {/* ── Diagonal Shimmer Reflection Beam (Luxury Glass Effect) ── */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.shimmerBeamWrapper,
                  {
                    transform: [{ translateX: shimmerTranslateX }, { rotate: '25deg' }],
                  },
                ]}>
                <LinearGradient
                  colors={
                    isDarkMode
                      ? [
                          'rgba(255, 255, 255, 0)',
                          'rgba(255, 255, 255, 0.07)',
                          'rgba(255, 255, 255, 0)',
                        ]
                      : [
                          'rgba(255, 255, 255, 0)',
                          'rgba(255, 255, 255, 0.22)',
                          'rgba(255, 255, 255, 0)',
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerBeamGradient}
                />
              </Animated.View>

              {/* ── 3D Icon & Dual Concentric Halos & Floating Sparkles ── */}
              <View style={styles.iconContainer}>
                {/* 1. Outer Ripple Wave Halo (Radar Effect) */}
                <Animated.View
                  style={[
                    styles.pulsingAuraOuter,
                    isLogout && styles.auraLogout,
                    isSuccess && styles.auraSuccess,
                    isDarkMode && isLogout && styles.auraLogoutDark,
                    isDarkMode && isSuccess && styles.auraSuccessDark,
                    {
                      transform: [{ scale: auraPulse2 }],
                      opacity: auraPulse2.interpolate({
                        inputRange: [1.0, 1.48],
                        outputRange: [0.4, 0.0],
                      }),
                    },
                  ]}
                />

                {/* 2. Inner Pulsing Breathing Aura Ring */}
                <Animated.View
                  style={[
                    styles.pulsingAura,
                    isLogout && styles.auraLogout,
                    isSuccess && styles.auraSuccess,
                    isDarkMode && isLogout && styles.auraLogoutDark,
                    isDarkMode && isSuccess && styles.auraSuccessDark,
                    {
                      transform: [{ scale: auraPulse1 }],
                      opacity: auraPulse1.interpolate({
                        inputRange: [1.0, 1.34],
                        outputRange: [0.65, 0.18],
                      }),
                    },
                  ]}
                />

                {/* 3. Floating Twinkling Sparkle 1 (Top-Right) */}
                <Animated.View
                  style={[
                    styles.sparkleItem1,
                    {
                      opacity: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.35, 1, 0.35],
                      }),
                      transform: [
                        {
                          scale: sparkleAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.75, 1.15, 0.75],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <Ionicons
                    name="sparkles"
                    size={ms(14)}
                    color={isLogout ? '#F87171' : isSuccess ? '#34D399' : '#C084FC'}
                  />
                </Animated.View>

                {/* 4. Floating Twinkling Sparkle 2 (Bottom-Left) */}
                <Animated.View
                  style={[
                    styles.sparkleItem2,
                    {
                      opacity: sparkleAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.85, 0.25, 0.85],
                      }),
                      transform: [
                        {
                          scale: sparkleAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1.12, 0.72, 1.12],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <Ionicons
                    name="star"
                    size={ms(11)}
                    color={isLogout ? '#FCA5A5' : isSuccess ? '#6EE7B7' : '#E9D5FF'}
                  />
                </Animated.View>

                {/* 5. 3D Floating & Bobbing Badge Sphere */}
                <Animated.View
                  style={[
                    styles.floatingBadgeWrapper,
                    {
                      transform: [
                        { scale: iconPop },
                        { translateY: iconFloatY },
                        {
                          rotate: iconTilt.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-2.2deg', '2.2deg'],
                          }),
                        },
                      ],
                    },
                  ]}>
                  {/* Glassmorphic Outer Bevel Ring */}
                  <View
                    style={[
                      styles.glassRingOuter,
                      isLogout && styles.glassRingLogout,
                      isSuccess && styles.glassRingSuccess,
                      isDarkMode && styles.glassRingDark,
                    ]}>
                    {/* Middle Frosted Ring */}
                    <View
                      style={[
                        styles.glassRingInner,
                        isLogout && styles.innerRingLogout,
                        isSuccess && styles.innerRingSuccess,
                        isDarkMode && styles.innerRingDark,
                      ]}>
                      {/* Core 3D Tactile Gradient Sphere */}
                      <LinearGradient
                        colors={
                          isLogout
                            ? ['#FF6B6B', '#EF4444', '#DC2626', '#991B1B']
                            : isSuccess
                            ? ['#34D399', '#10B981', '#059669', '#065F46']
                            : ['#C084FC', '#9333EA', '#7C3AED', '#4C1D95']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.coreIconSphere}>
                        {isLogout ? (
                          <Feather name="log-out" size={ms(25)} color="#FFFFFF" />
                        ) : isSuccess ? (
                          <Ionicons name="checkmark-sharp" size={ms(28)} color="#FFFFFF" />
                        ) : (
                          <Ionicons name="sparkles" size={ms(25)} color="#FFFFFF" />
                        )}
                      </LinearGradient>
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* ── Staggered Content Block ── */}
              <Animated.View style={[styles.contentBlock, { opacity: contentFade }]}>
                {/* Pill Overline Badge with Live Pulsing Dot */}
                {!!badge && (
                  <View
                    style={[
                      styles.badgePill,
                      isLogout && styles.badgePillLogout,
                      isSuccess && styles.badgePillSuccess,
                      isDarkMode && styles.badgePillDark,
                    ]}>
                    <Animated.View
                      style={[
                        styles.badgeDot,
                        isLogout && styles.badgeDotLogout,
                        isSuccess && styles.badgeDotSuccess,
                        { transform: [{ scale: dotPulse }] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        isLogout && styles.badgeTextLogout,
                        isSuccess && styles.badgeTextSuccess,
                      ]}>
                      {badge}
                    </Text>
                  </View>
                )}

                {/* Modal Title */}
                <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
                  {title}
                </Text>

                {/* Modal Subtitle */}
                <Text style={[styles.modalSubtitle, isDarkMode && styles.modalSubtitleDark]}>
                  {subtitle}
                </Text>

                {/* Reassurance Callout for Sign Out or Success */}
                {isLogout ? (
                  <View style={[styles.reassuranceBox, isDarkMode && styles.reassuranceBoxDark]}>
                    <View style={styles.reassuranceIconWrap}>
                      <Ionicons
                        name="shield-checkmark"
                        size={ms(16)}
                        color={isDarkMode ? '#34D399' : '#059669'}
                      />
                    </View>
                    <View style={styles.reassuranceContent}>
                      <Text
                        style={[
                          styles.reassuranceTitle,
                          isDarkMode && styles.reassuranceTitleDark,
                        ]}>
                        Pawsport Cloud Backup
                      </Text>
                      <Text
                        style={[
                          styles.reassuranceText,
                          isDarkMode && styles.reassuranceTextDark,
                        ]}>
                        Pawsport stamps and trips remain securely saved.
                      </Text>
                    </View>
                  </View>
                ) : isSuccess ? (
                  <View
                    style={[
                      styles.reassuranceBox,
                      styles.reassuranceBoxSuccess,
                      isDarkMode && styles.reassuranceBoxDark,
                    ]}>
                    <View
                      style={[
                        styles.reassuranceIconWrap,
                        styles.reassuranceIconWrapSuccess,
                      ]}>
                      <Ionicons
                        name="ribbon"
                        size={ms(16)}
                        color={isDarkMode ? '#34D399' : '#059669'}
                      />
                    </View>
                    <View style={styles.reassuranceContent}>
                      <Text
                        style={[
                          styles.reassuranceTitle,
                          isDarkMode && styles.reassuranceTitleDark,
                        ]}>
                        Official Digital Stamp
                      </Text>
                      <Text
                        style={[
                          styles.reassuranceText,
                          isDarkMode && styles.reassuranceTextDark,
                        ]}>
                        Ready for adventures, check-ins & pack stories.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </Animated.View>

              {/* ── 3D Interactive Action Buttons ── */}
              <Animated.View
                style={[
                  styles.actionsRow,
                  singleButton && styles.actionsRowSingle,
                  { transform: [{ translateY: buttonsTranslateY }], opacity: contentFade },
                ]}>
                {!singleButton && (
                  <BouncyPressable
                    style={[styles.cancelBtn, isDarkMode && styles.cancelBtnDark]}
                    activeScale={0.93}
                    onPress={handleDismiss}>
                    <Text style={[styles.cancelBtnText, isDarkMode && styles.cancelBtnTextDark]}>
                      {cancelText}
                    </Text>
                  </BouncyPressable>
                )}

                <BouncyPressable
                  style={[styles.confirmBtnWrap, singleButton && styles.confirmBtnWrapFull]}
                  activeScale={0.93}
                  onPress={singleButton ? handleDismiss : handleConfirm}>
                  <LinearGradient
                    colors={
                      isLogout
                        ? ['#F87171', '#EF4444', '#DC2626', '#B91C1C']
                        : isSuccess
                        ? ['#34D399', '#10B981', '#059669', '#047857']
                        : ['#A855F7', '#8B5CF6', '#7C3AED', '#5B21B6']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.confirmBtn,
                      isLogout && styles.confirmBtnLogout,
                      isSuccess && styles.confirmBtnSuccess,
                    ]}>
                    <Text style={styles.confirmBtnText}>{confirmText}</Text>
                    {isLogout ? (
                      <Feather
                        name="arrow-right"
                        size={ms(16)}
                        color="#FFFFFF"
                        style={styles.confirmBtnIcon}
                      />
                    ) : isSuccess ? (
                      <Ionicons
                        name="checkmark"
                        size={ms(17)}
                        color="#FFFFFF"
                        style={styles.confirmBtnIcon}
                      />
                    ) : null}
                  </LinearGradient>
                </BouncyPressable>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 4, 18, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(22),
  },
  modalCard: {
    width: '100%',
    maxWidth: s(344),
    backgroundColor: '#FFFFFF',
    borderRadius: s(30),
    paddingHorizontal: s(22),
    paddingTop: s(24),
    paddingBottom: s(22),
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EFEAE1',
    borderTopWidth: 2.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderLeftColor: '#F5EFE6',
    borderRightColor: '#F5EFE6',
    borderBottomWidth: 4.5,
    borderBottomColor: '#DBD2C4',
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 18 },
        shadowOpacity: 0.24,
        shadowRadius: 30,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  modalCardDark: {
    backgroundColor: '#190A32',
    borderTopColor: '#6D28D9',
    borderLeftColor: '#3B1475',
    borderRightColor: '#3B1475',
    borderBottomColor: '#0E041C',
    borderColor: '#3B1475',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.58,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  /* ── Decorative Elements ── */
  topHandleBar: {
    width: s(38),
    height: vs(3.5),
    borderRadius: s(2),
    backgroundColor: '#E2E8F0',
    marginBottom: s(10),
  },
  topHandleBarDark: {
    backgroundColor: '#3B1475',
  },
  closeBtn: {
    position: 'absolute',
    top: s(16),
    right: s(16),
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10,
  },
  closeBtnDark: {
    backgroundColor: '#28114D',
    borderColor: '#431E7D',
  },
  ambientBacklight: {
    position: 'absolute',
    top: -s(60),
    width: s(240),
    height: s(170),
    borderRadius: s(85),
    backgroundColor: 'rgba(168, 85, 247, 0.09)',
    alignSelf: 'center',
  },
  backlightLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.09)',
  },
  backlightSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.09)',
  },
  backlightDark: {
    opacity: 0.16,
  },

  /* ── Shimmer Light Sweep ── */
  shimmerBeamWrapper: {
    position: 'absolute',
    top: -vs(100),
    bottom: -vs(100),
    width: s(90),
    zIndex: 1,
  },
  shimmerBeamGradient: {
    flex: 1,
    width: '100%',
  },

  /* ── 3D Icon & Concentric Halos ── */
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
    position: 'relative',
    height: s(96),
    width: s(96),
    zIndex: 2,
  },
  pulsingAuraOuter: {
    position: 'absolute',
    width: s(102),
    height: s(102),
    borderRadius: s(51),
    backgroundColor: 'rgba(168, 85, 247, 0.14)',
  },
  pulsingAura: {
    position: 'absolute',
    width: s(86),
    height: s(86),
    borderRadius: s(43),
    backgroundColor: 'rgba(168, 85, 247, 0.22)',
  },
  auraLogout: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
  },
  auraSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  auraLogoutDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.35)',
  },
  auraSuccessDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.35)',
  },

  /* Sparkles */
  sparkleItem1: {
    position: 'absolute',
    top: s(2),
    right: s(4),
    zIndex: 4,
  },
  sparkleItem2: {
    position: 'absolute',
    bottom: s(6),
    left: s(4),
    zIndex: 4,
  },

  floatingBadgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  glassRingOuter: {
    width: s(82),
    height: s(82),
    borderRadius: s(41),
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(192, 132, 252, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  glassRingLogout: {
    backgroundColor: '#FEF2F2',
    borderColor: 'rgba(248, 113, 113, 0.38)',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  glassRingSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: 'rgba(52, 211, 153, 0.38)',
  },
  glassRingDark: {
    backgroundColor: '#260F45',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  glassRingInner: {
    width: s(66),
    height: s(66),
    borderRadius: s(33),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRingLogout: {
    backgroundColor: '#FEE2E2',
  },
  innerRingSuccess: {
    backgroundColor: '#DCFCE7',
  },
  innerRingDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  coreIconSphere: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.8,
    borderTopColor: 'rgba(255, 255, 255, 0.58)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0, 0, 0, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.26,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  /* ── Content Block ── */
  contentBlock: {
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    paddingHorizontal: s(12),
    paddingVertical: s(4.5),
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: s(8),
  },
  badgePillLogout: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  badgePillSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  badgePillDark: {
    backgroundColor: '#28114D',
    borderColor: '#431E7D',
  },
  badgeDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#8B5CF6',
    marginRight: s(6),
  },
  badgeDotLogout: {
    backgroundColor: '#EF4444',
  },
  badgeDotSuccess: {
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
    letterSpacing: 1.2,
  },
  badgeTextLogout: {
    color: '#DC2626',
  },
  badgeTextSuccess: {
    color: '#059669',
  },
  modalTitle: {
    fontSize: s(19.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#16082F',
    textAlign: 'center',
    marginBottom: s(6),
    letterSpacing: -0.2,
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: s(19),
    paddingHorizontal: s(4),
    marginBottom: s(14),
  },
  modalSubtitleDark: {
    color: '#94A3B8',
  },

  /* ── Reassurance Callout ── */
  reassuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: s(9),
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: s(18),
    width: '100%',
  },
  reassuranceBoxSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  reassuranceBoxDark: {
    backgroundColor: '#0A2618',
    borderColor: '#12452A',
  },
  reassuranceIconWrap: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  reassuranceIconWrapSuccess: {
    backgroundColor: '#BBF7D0',
  },
  reassuranceContent: {
    flex: 1,
  },
  reassuranceTitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#065F46',
    marginBottom: s(1),
  },
  reassuranceTitleDark: {
    color: '#A7F3D0',
  },
  reassuranceText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#047857',
    lineHeight: s(14.5),
  },
  reassuranceTextDark: {
    color: '#6EE7B7',
  },

  /* ── Buttons ── */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    width: '100%',
    zIndex: 2,
  },
  actionsRowSingle: {
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    height: vs(45),
    borderRadius: s(16),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#D1D5DB',
  },
  cancelBtnDark: {
    backgroundColor: '#261347',
    borderColor: '#3E1C70',
    borderTopColor: '#4A2184',
    borderBottomColor: '#170830',
  },
  cancelBtnText: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#4B5563',
  },
  cancelBtnTextDark: {
    color: '#E2E8F0',
  },
  confirmBtnWrap: {
    flex: 1.25,
  },
  confirmBtnWrapFull: {
    flex: 1,
  },
  confirmBtn: {
    height: vs(45),
    borderRadius: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(14),
    borderTopWidth: 1.8,
    borderTopColor: 'rgba(255, 255, 255, 0.45)',
    borderBottomWidth: 4,
    borderBottomColor: '#581C87',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  confirmBtnLogout: {
    borderBottomColor: '#7F1D1D',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.42,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  confirmBtnSuccess: {
    borderBottomColor: '#047857',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  confirmBtnText: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  confirmBtnIcon: {
    marginLeft: s(6),
  },
});
