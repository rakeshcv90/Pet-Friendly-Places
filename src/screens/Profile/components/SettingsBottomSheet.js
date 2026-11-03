import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  Switch,
  Animated,
  PanResponder,
  Appearance,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { s, vs, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

export const SettingsBottomSheet = ({
  visible,
  onClose,
  themeMode,
  setThemeMode,
  isDarkMode,
  toggleDarkMode,
  accentColor,
  setAccentColor,
  pushNotifications,
  setPushNotifications,
  travelAlerts,
  setTravelAlerts,
  publicProfile,
  setPublicProfile,
  onChangePassword,
}) => {
  const insets = useSafeAreaInsets();

  // Switching theme re-renders the whole app in one pass, which can take a moment. The
  // controls therefore answer from local state first (a controlled Switch snaps back if its
  // value does not change right away), and taps are ignored while a change is being applied.
  const [pendingMode, setPendingMode] = useState(null);
  const activeMode = pendingMode || themeMode;
  const activeDark = pendingMode
    ? pendingMode === 'dark' || (pendingMode === 'system' && Appearance.getColorScheme() === 'dark')
    : isDarkMode;

  const applyTheme = useCallback(
    mode => {
      if (pendingMode || mode === themeMode) {
        return;
      }
      setPendingMode(mode);
      // let the control repaint first, then flip the app-wide theme
      requestAnimationFrame(() => setThemeMode(mode));
    },
    [pendingMode, themeMode, setThemeMode],
  );

  // the store caught up (or it never will, e.g. the same mode): release the controls
  useEffect(() => {
    if (!pendingMode) {
      return undefined;
    }
    if (pendingMode === themeMode) {
      setPendingMode(null);
      return undefined;
    }
    const timer = setTimeout(() => setPendingMode(null), 1500);
    return () => clearTimeout(timer);
  }, [pendingMode, themeMode]);

  const settingsSlideAnim = useRef(new Animated.Value(650)).current;
  const settingsFadeAnim = useRef(new Animated.Value(0)).current;

  const closeSettingsModal = useCallback(
    (velocity = 0) => {
      Animated.parallel([
        Animated.spring(settingsSlideAnim, {
          toValue: 650,
          velocity: Math.max(velocity, 1.2),
          tension: 80,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(settingsFadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose?.();
        settingsSlideAnim.setValue(650);
      });
    },
    [settingsSlideAnim, settingsFadeAnim, onClose],
  );

  // Automatically trigger slide-up entrance animation when visible turns true
  useEffect(() => {
    if (visible) {
      settingsSlideAnim.setValue(650);
      settingsFadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(settingsSlideAnim, {
          toValue: 0,
          damping: 22,
          mass: 0.85,
          stiffness: 140,
          useNativeDriver: true,
        }),
        Animated.timing(settingsFadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, settingsSlideAnim, settingsFadeAnim]);

  // Keep ref to latest closeSettingsModal for PanResponder closure safety
  const closeSettingsModalRef = useRef(closeSettingsModal);
  useEffect(() => {
    closeSettingsModalRef.current = closeSettingsModal;
  }, [closeSettingsModal]);

  // Interactive PanResponder for pull-down gestures
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 4 || Math.abs(gestureState.dy) > 8;
      },
      onPanResponderGrant: () => {
        settingsSlideAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          // Track finger 1:1 when pulling down
          settingsSlideAnim.setValue(gestureState.dy);
          const opacityVal = Math.max(0, 1 - gestureState.dy / 380);
          settingsFadeAnim.setValue(opacityVal);
        } else {
          // Elastic resistance when dragging upwards
          settingsSlideAnim.setValue(gestureState.dy * 0.2);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If pulled down past threshold (100px) or flicked with downward velocity:
        if (gestureState.dy > 100 || gestureState.vy > 0.45) {
          closeSettingsModalRef.current(gestureState.vy);
        } else {
          // Released before threshold: spring back to fully open position
          Animated.parallel([
            Animated.spring(settingsSlideAnim, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }),
            Animated.timing(settingsFadeAnim, {
              toValue: 1,
              duration: 160,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => closeSettingsModal()}>
      <View style={styles.sheetModalRoot}>
        {/* Animated Fade Backdrop */}
        <TouchableWithoutFeedback onPress={() => closeSettingsModal()}>
          <Animated.View style={[styles.sheetBackdrop, { opacity: settingsFadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Animated Slide-Up Bottom Sheet Card */}
        <Animated.View
          style={[
            styles.bottomSheetBox,
            isDarkMode && styles.bottomSheetBoxDark,
            {
              paddingBottom: Math.max(insets.bottom, vs(20)) + vs(10),
              transform: [{ translateY: settingsSlideAnim }],
            },
          ]}>
          {/* Top Drag Handle & Header Area with PanResponder */}
          <View {...sheetPanResponder.panHandlers} style={styles.sheetDragHeaderArea}>
            <View style={styles.sheetHandleContainer}>
              <View style={[styles.sheetHandleBar, isDarkMode && styles.sheetHandleBarDark]} />
            </View>

            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalIconWrap, isDarkMode && styles.modalIconWrapDark]}>
                <Feather name="settings" size={ms(20)} color={accentColor} />
              </View>
              <TouchableOpacity
                onPress={() => closeSettingsModal()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={ms(20)} color={isDarkMode ? '#94A3B8' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, isDarkMode && styles.textWhite]}>
              Settings & Appearance
            </Text>
            <Text style={[styles.modalSubtitle, isDarkMode && styles.textMutedDark]}>
              Customize theme, dark mode, alerts, and account preferences
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.settingsScrollContent}>
            {/* ── DARK THEME & APPEARANCE SECTION ── */}
            <View style={styles.settingsSection}>
              <View style={styles.settingsSectionHeaderRow}>
                <Ionicons
                  name="moon"
                  size={ms(14)}
                  color={accentColor}
                  style={styles.sectionHeaderIcon}
                />
                <Text
                  style={[
                    styles.settingsSectionTitle,
                    isDarkMode && styles.textSectionTitleDark,
                  ]}>
                  APPEARANCE & THEME
                </Text>
              </View>

              {/* 3 Visual Theme Mode Selector Cards */}
              <View style={styles.themeModeGrid}>
                {/* Light Card */}
                <TouchableOpacity
                  style={[
                    styles.themeModeCard,
                    isDarkMode && styles.themeModeCardDark,
                    activeMode === 'light' &&
                      (isDarkMode
                        ? [styles.themeModeCardActiveDark, { borderColor: accentColor }]
                        : [styles.themeModeCardActiveLight, { borderColor: accentColor }]),
                  ]}
                  onPress={() => applyTheme('light')}>
                  <View style={styles.themePreviewLight}>
                    <View style={styles.previewLightBar} />
                    <View style={styles.previewLightCircle} />
                  </View>
                  <View style={styles.themeCardFooter}>
                    <Text style={styles.themeModeEmoji}>☀️</Text>
                    <Text
                      style={[
                        styles.themeModeTitle,
                        isDarkMode
                          ? styles.themeModeTitleDark
                          : styles.themeModeTitleLight,
                        activeMode === 'light' &&
                          (isDarkMode
                            ? styles.themeModeTitleActiveDark
                            : [styles.themeModeTitleActiveLight, { color: accentColor }]),
                      ]}>
                      Light
                    </Text>
                  </View>
                  {activeMode === 'light' && (
                    <View style={[styles.activeCheckBadge, { backgroundColor: accentColor }]}>
                      <Ionicons name="checkmark" size={ms(10)} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Dark Card */}
                <TouchableOpacity
                  style={[
                    styles.themeModeCard,
                    isDarkMode && styles.themeModeCardDark,
                    activeMode === 'dark' &&
                      (isDarkMode
                        ? [styles.themeModeCardActiveDark, { borderColor: accentColor }]
                        : [styles.themeModeCardActiveLight, { borderColor: accentColor }]),
                  ]}
                  onPress={() => applyTheme('dark')}>
                  <View style={styles.themePreviewDark}>
                    <View style={styles.previewDarkBar} />
                    <View style={styles.previewDarkCircle} />
                  </View>
                  <View style={styles.themeCardFooter}>
                    <Text style={styles.themeModeEmoji}>🌙</Text>
                    <Text
                      style={[
                        styles.themeModeTitle,
                        isDarkMode
                          ? styles.themeModeTitleDark
                          : styles.themeModeTitleLight,
                        activeMode === 'dark' &&
                          (isDarkMode
                            ? styles.themeModeTitleActiveDark
                            : [styles.themeModeTitleActiveLight, { color: accentColor }]),
                      ]}>
                      Dark
                    </Text>
                  </View>
                  {activeMode === 'dark' && (
                    <View style={[styles.activeCheckBadge, { backgroundColor: accentColor }]}>
                      <Ionicons name="checkmark" size={ms(10)} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* System Auto Card */}
                <TouchableOpacity
                  style={[
                    styles.themeModeCard,
                    isDarkMode && styles.themeModeCardDark,
                    activeMode === 'system' &&
                      (isDarkMode
                        ? [styles.themeModeCardActiveDark, { borderColor: accentColor }]
                        : [styles.themeModeCardActiveLight, { borderColor: accentColor }]),
                  ]}
                  onPress={() => applyTheme('system')}>
                  <View style={styles.themePreviewSystem}>
                    <View style={styles.previewSystemHalfLight} />
                    <View style={styles.previewSystemHalfDark} />
                  </View>
                  <View style={styles.themeCardFooter}>
                    <Text style={styles.themeModeEmoji}>📱</Text>
                    <Text
                      style={[
                        styles.themeModeTitle,
                        isDarkMode
                          ? styles.themeModeTitleDark
                          : styles.themeModeTitleLight,
                        activeMode === 'system' &&
                          (isDarkMode
                            ? styles.themeModeTitleActiveDark
                            : [styles.themeModeTitleActiveLight, { color: accentColor }]),
                      ]}>
                      Auto
                    </Text>
                  </View>
                  {activeMode === 'system' && (
                    <View style={[styles.activeCheckBadge, { backgroundColor: accentColor }]}>
                      <Ionicons name="checkmark" size={ms(10)} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Dark Theme Switch Row */}
              <View style={[styles.settingRowCard, isDarkMode && styles.settingRowCardDark]}>
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.settingIconBox,
                      isDarkMode ? styles.settingIconBoxPurpleDark : styles.settingIconBoxPurple,
                    ]}>
                    <Ionicons name="moon-outline" size={ms(18)} color={accentColor} />
                  </View>
                  <View style={styles.settingRowTextWrap}>
                    <Text style={[styles.settingRowTitle, isDarkMode && styles.textWhite]}>
                      Dark Theme
                    </Text>
                    <Text style={[styles.settingRowSub, isDarkMode && styles.textMutedDark]}>
                      Deep midnight palette for night browsing
                    </Text>
                  </View>
                </View>
                <Switch
                  value={activeDark}
                  onValueChange={value => applyTheme(value ? 'dark' : 'light')}
                  trackColor={{ false: '#CBD5E1', true: accentColor }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Accent Color Aura Swatches */}
              <View
                style={[
                  styles.settingRowCard,
                  isDarkMode && styles.settingRowCardDark,
                  styles.settingRowCardSpacing,
                ]}>
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.settingIconBox,
                      isDarkMode ? styles.settingIconBoxPurpleDark : styles.settingIconBoxPurple,
                    ]}>
                    <Ionicons name="color-palette-outline" size={ms(18)} color={accentColor} />
                  </View>
                  <View style={styles.settingRowTextWrap}>
                    <Text style={[styles.settingRowTitle, isDarkMode && styles.textWhite]}>
                      Accent Aura
                    </Text>
                    <Text style={[styles.settingRowSub, isDarkMode && styles.textMutedDark]}>
                      Highlight tint
                    </Text>
                  </View>
                </View>
                <View style={styles.accentSwatchesRow}>
                  {[
                    { id: 'purple', color: '#7C3AED' },
                    { id: 'emerald', color: '#059669' },
                    { id: 'amber', color: '#D97706' },
                    { id: 'rose', color: '#E11D48' },
                  ].map(swatch => {
                    const isSelected = accentColor === swatch.color;
                    return (
                      <TouchableOpacity
                        key={swatch.id}
                        onPress={() => setAccentColor(swatch.color)}
                        style={[
                          styles.swatchCircle,
                          { backgroundColor: swatch.color },
                          isSelected && styles.swatchCircleSelected,
                        ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={ms(11)} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* ── NOTIFICATIONS & PRIVACY ── */}
            <View style={styles.settingsSection}>
              <View style={styles.settingsSectionHeaderRow}>
                <Ionicons
                  name="notifications-outline"
                  size={ms(14)}
                  color={accentColor}
                  style={styles.sectionHeaderIcon}
                />
                <Text
                  style={[
                    styles.settingsSectionTitle,
                    isDarkMode && styles.textSectionTitleDark,
                  ]}>
                  NOTIFICATIONS & ALERTS
                </Text>
              </View>

              <View style={[styles.settingRowCard, isDarkMode && styles.settingRowCardDark]}>
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.settingIconBox,
                      isDarkMode ? styles.settingIconBoxSlateDark : styles.settingIconBoxSlate,
                    ]}>
                    <Ionicons
                      name="notifications-outline"
                      size={ms(18)}
                      color={isDarkMode ? '#94A3B8' : '#475569'}
                    />
                  </View>
                  <View style={styles.settingRowTextWrap}>
                    <Text style={[styles.settingRowTitle, isDarkMode && styles.textWhite]}>
                      Push Notifications
                    </Text>
                    <Text style={[styles.settingRowSub, isDarkMode && styles.textMutedDark]}>
                      Stamps & community updates
                    </Text>
                  </View>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={setPushNotifications}
                  trackColor={{ false: '#CBD5E1', true: accentColor }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.settingRowCard,
                  isDarkMode && styles.settingRowCardDark,
                  styles.settingRowCardSpacing,
                ]}>
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.settingIconBox,
                      isDarkMode ? styles.settingIconBoxSlateDark : styles.settingIconBoxSlate,
                    ]}>
                    <Ionicons
                      name="map-outline"
                      size={ms(18)}
                      color={isDarkMode ? '#94A3B8' : '#475569'}
                    />
                  </View>
                  <View style={styles.settingRowTextWrap}>
                    <Text style={[styles.settingRowTitle, isDarkMode && styles.textWhite]}>
                      Travel & Reunite Alerts
                    </Text>
                    <Text style={[styles.settingRowSub, isDarkMode && styles.textMutedDark]}>
                      Nearby pet alerts & trip tips
                    </Text>
                  </View>
                </View>
                <Switch
                  value={travelAlerts}
                  onValueChange={setTravelAlerts}
                  trackColor={{ false: '#CBD5E1', true: accentColor }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.settingRowCard,
                  isDarkMode && styles.settingRowCardDark,
                  styles.settingRowCardSpacing,
                ]}>
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.settingIconBox,
                      isDarkMode ? styles.settingIconBoxSlateDark : styles.settingIconBoxSlate,
                    ]}>
                    <Ionicons
                      name="globe-outline"
                      size={ms(18)}
                      color={isDarkMode ? '#94A3B8' : '#475569'}
                    />
                  </View>
                  <View style={styles.settingRowTextWrap}>
                    <Text style={[styles.settingRowTitle, isDarkMode && styles.textWhite]}>
                      Public Profile
                    </Text>
                    <Text style={[styles.settingRowSub, isDarkMode && styles.textMutedDark]}>
                      Visible to the pack
                    </Text>
                  </View>
                </View>
                <Switch
                  value={publicProfile}
                  onValueChange={setPublicProfile}
                  trackColor={{ false: '#CBD5E1', true: accentColor }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* ── ACCOUNT & SECURITY SECTION ── */}
            <View style={styles.settingsSection}>
              <View style={styles.settingsSectionHeaderRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={ms(14)}
                  color={accentColor}
                  style={styles.sectionHeaderIcon}
                />
                <Text
                  style={[
                    styles.settingsSectionTitle,
                    isDarkMode && styles.textSectionTitleDark,
                  ]}>
                  ACCOUNT & SECURITY
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.settingRowCard, isDarkMode && styles.settingRowCardDark]}
                activeOpacity={0.7}
                onPress={() => {
                  closeSettingsModal();
                  setTimeout(() => {
                    onChangePassword?.();
                  }, 200);
                }}>
                <View style={styles.settingRowLeft}>
                  <View
                    style={[
                      styles.settingIconBox,
                      isDarkMode ? styles.settingIconBoxSlateDark : styles.settingIconBoxSlate,
                    ]}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={ms(18)}
                      color={isDarkMode ? '#C084FC' : '#7C3AED'}
                    />
                  </View>
                  <View style={styles.settingRowTextWrap}>
                    <Text style={[styles.settingRowTitle, isDarkMode && styles.textWhite]}>
                      Change Password
                    </Text>
                    <Text style={[styles.settingRowSub, isDarkMode && styles.textMutedDark]}>
                      Update security credentials
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={ms(18)}
                  color={isDarkMode ? '#94A3B8' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>

            {/* App Version Info */}
            <View style={styles.appVersionRow}>
              <Text style={[styles.appVersionText, isDarkMode && styles.textMutedDark]}>
                PetFriendly App · v2.4.0 (VIP Pass Edition)
              </Text>
            </View>

            {/* Done / Close Button */}
            <BouncyPressable
              style={styles.submitModalBtn}
              activeScale={0.95}
              onPress={() => closeSettingsModal()}>
              <LinearGradient
                colors={
                  isDarkMode
                    ? ['#9333EA', '#7C3AED', '#581C87']
                    : ['#8B5CF6', '#7C3AED', '#6D28D9']
                }
                style={styles.submitModalBtnGrad}>
                <Text style={styles.submitModalBtnText}>Done</Text>
              </LinearGradient>
            </BouncyPressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SettingsBottomSheet;

const styles = StyleSheet.create({
  sheetModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 4, 22, 0.72)',
  },
  bottomSheetBox: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(32),
    borderTopRightRadius: s(32),
    paddingHorizontal: s(20),
    paddingTop: vs(4),
    borderTopWidth: 1.5,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 24,
  },
  bottomSheetBoxDark: {
    backgroundColor: '#160B2C',
    borderTopColor: '#3F1F75',
  },
  sheetDragHeaderArea: {
    paddingBottom: vs(6),
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: vs(10),
    marginBottom: vs(4),
  },
  sheetHandleBar: {
    width: s(46),
    height: vs(5),
    borderRadius: s(3),
    backgroundColor: '#CBD5E1',
  },
  sheetHandleBarDark: {
    backgroundColor: '#475569',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(10),
  },
  modalIconWrap: {
    width: s(42),
    height: s(42),
    borderRadius: s(13),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrapDark: {
    backgroundColor: '#2A144E',
  },
  modalTitle: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A0B2E',
  },
  modalSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(4),
    lineHeight: s(16),
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textMutedDark: {
    color: '#94A3B8',
  },
  settingsScrollContent: {
    paddingTop: vs(10),
    paddingBottom: vs(16),
  },
  settingsSection: {
    marginBottom: vs(20),
  },
  settingsSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(10),
  },
  sectionHeaderIcon: {
    marginRight: s(6),
  },
  settingsSectionTitle: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#475569',
    letterSpacing: 1.1,
  },
  textSectionTitleDark: {
    color: '#CBD5E1',
  },
  themeModeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  themeModeCard: {
    width: '31.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: s(16),
    padding: s(8),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    alignItems: 'center',
  },
  themeModeCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  themeModeCardActiveLight: {
    borderColor: '#7C3AED',
    backgroundColor: '#FAF5FF',
    borderWidth: 2,
  },
  themeModeCardActiveDark: {
    borderColor: '#A855F7',
    backgroundColor: '#2E1256',
    borderWidth: 2,
  },
  themePreviewLight: {
    width: '100%',
    height: s(44),
    backgroundColor: '#FFFFFF',
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: s(6),
    justifyContent: 'space-between',
  },
  previewLightBar: {
    width: '60%',
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#7C3AED',
  },
  previewLightCircle: {
    width: s(14),
    height: s(14),
    borderRadius: s(7),
    backgroundColor: '#E2E8F0',
    alignSelf: 'flex-end',
  },
  themePreviewDark: {
    width: '100%',
    height: s(44),
    backgroundColor: '#0F071D',
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#381A6B',
    padding: s(6),
    justifyContent: 'space-between',
  },
  previewDarkBar: {
    width: '60%',
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#A855F7',
  },
  previewDarkCircle: {
    width: s(14),
    height: s(14),
    borderRadius: s(7),
    backgroundColor: '#260F45',
    alignSelf: 'flex-end',
  },
  themePreviewSystem: {
    width: '100%',
    height: s(44),
    borderRadius: s(10),
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewSystemHalfLight: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  previewSystemHalfDark: {
    flex: 1,
    backgroundColor: '#0F071D',
  },
  themeCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(6),
  },
  themeModeEmoji: {
    fontSize: s(11),
    marginRight: s(3),
  },
  themeModeTitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.bold,
  },
  themeModeTitleLight: {
    color: '#475569',
  },
  themeModeTitleDark: {
    color: '#CBD5E1',
  },
  themeModeTitleActiveLight: {
    color: '#7C3AED',
  },
  themeModeTitleActiveDark: {
    color: '#FFFFFF',
  },
  activeCheckBadge: {
    position: 'absolute',
    top: -s(4),
    right: -s(4),
    width: s(16),
    height: s(16),
    borderRadius: s(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  settingRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: s(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
  },
  settingRowCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
    borderBottomColor: '#180B2E',
  },
  settingRowCardSpacing: {
    marginTop: vs(8),
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconBox: {
    width: s(34),
    height: s(34),
    borderRadius: s(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  settingIconBoxPurple: {
    backgroundColor: '#EDE9FE',
  },
  settingIconBoxPurpleDark: {
    backgroundColor: '#2D1652',
  },
  settingIconBoxSlate: {
    backgroundColor: '#F1F5F9',
  },
  settingIconBoxSlateDark: {
    backgroundColor: '#1E293B',
  },
  settingRowTextWrap: {
    flex: 1,
    paddingRight: s(8),
  },
  settingRowTitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E293B',
  },
  settingRowSub: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#64748B',
    marginTop: vs(1),
  },
  accentSwatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatchCircle: {
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    marginLeft: s(6),
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCircleSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  appVersionRow: {
    alignItems: 'center',
    marginTop: vs(18),
    marginBottom: vs(4),
  },
  appVersionText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#94A3B8',
  },
  submitModalBtn: {
    borderRadius: s(14),
    marginTop: vs(18),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitModalBtnGrad: {
    paddingVertical: vs(12),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#4C1D95',
  },
  submitModalBtnText: {
    color: '#FFFFFF',
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
  },
});
