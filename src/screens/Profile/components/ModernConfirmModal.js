import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

// Look of each kind of message: icon, colours for the icon bubble and the confirm button
const KINDS = {
  logout: {
    icon: 'log-out',
    tint: '#EF4444',
    soft: '#FEE2E2',
    softDark: '#4A1414',
    colors: ['#F87171', '#DC2626'],
    edge: '#991B1B',
  },
  warning: {
    icon: 'warning',
    tint: '#F59E0B',
    soft: '#FEF3C7',
    softDark: '#46300A',
    colors: ['#FBBF24', '#D97706'],
    edge: '#92400E',
  },
  success: {
    icon: 'checkmark-circle',
    tint: '#10B981',
    soft: '#D1FAE5',
    softDark: '#0B3B2B',
    colors: ['#34D399', '#059669'],
    edge: '#047857',
  },
  info: {
    icon: 'information-circle',
    tint: '#7C3AED',
    soft: '#EDE9FE',
    softDark: '#2A1654',
    colors: ['#8B5CF6', '#6D28D9'],
    edge: '#4C1D95',
  },
};

const kindFor = type => {
  if (type === 'logout') {
    return KINDS.logout;
  }
  if (type === 'danger' || type === 'error') {
    return { ...KINDS.logout, icon: 'alert-circle' };
  }
  return KINDS[type] || KINDS.info;
};

// The app's confirmation / message popup: a compact card with a raised icon bubble, the message, and
// one or two buttons. `singleButton` makes it an acknowledgement instead of a question.
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
  const kind = kindFor(type);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      fade.setValue(0);
      rise.setValue(0);
      pop.setValue(0);
      return undefined;
    }
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 1, friction: 8, tension: 90, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(120),
        Animated.spring(pop, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true }),
      ]),
    ]).start();
    bob.start();
    return () => bob.stop();
  }, [visible, fade, rise, pop, float]);

  const handleDismiss = () => {
    onClose?.();
  };

  const handleConfirm = () => {
    onClose?.();
    onConfirm?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                isDarkMode && styles.cardDark,
                {
                  opacity: fade,
                  transform: [
                    {
                      translateY: rise.interpolate({
                        inputRange: [0, 1],
                        outputRange: [vs(40), 0],
                      }),
                    },
                    { scale: rise.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                },
              ]}>
              {/* Tinted top band */}
              <View
                style={[styles.band, { backgroundColor: isDarkMode ? kind.softDark : kind.soft }]}
              />

              {showCloseButton && (
                <BouncyPressable
                  testID="modern-confirm-close-btn"
                  accessibilityLabel="Close modal"
                  style={[styles.close, isDarkMode && styles.closeDark]}
                  activeScale={0.88}
                  onPress={handleDismiss}>
                  <Feather name="x" size={ms(15)} color={isDarkMode ? '#CBD5E1' : '#475569'} />
                </BouncyPressable>
              )}

              {/* Raised icon bubble */}
              <Animated.View
                style={[
                  styles.bubbleWrap,
                  {
                    transform: [
                      { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                      {
                        translateY: float.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -vs(3)],
                        }),
                      },
                    ],
                  },
                ]}>
                <View style={[styles.ring, { borderColor: kind.tint }]}>
                  <LinearGradient
                    colors={kind.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, { borderBottomColor: kind.edge }]}>
                    <Ionicons name={kind.icon} size={ms(28)} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </Animated.View>

              <View style={styles.body}>
                {!!badge && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isDarkMode ? kind.softDark : kind.soft },
                    ]}>
                    <View style={[styles.badgeDot, { backgroundColor: kind.tint }]} />
                    <Text style={[styles.badgeText, { color: kind.tint }]}>{badge}</Text>
                  </View>
                )}
                <Text style={[styles.title, isDarkMode && styles.titleDark]}>{title}</Text>
                {!!subtitle && (
                  <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                    {subtitle}
                  </Text>
                )}

                {type === 'logout' && (
                  <View style={[styles.note, isDarkMode && styles.noteDark]}>
                    <Ionicons name="shield-checkmark" size={ms(15)} color="#059669" />
                    <Text style={[styles.noteText, isDarkMode && styles.noteTextDark]}>
                      Your pawsport stamps and trips stay safely saved.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                {!singleButton && (
                  <BouncyPressable
                    style={[styles.cancel, isDarkMode && styles.cancelDark]}
                    activeScale={0.94}
                    onPress={handleDismiss}>
                    <Text
                      style={[styles.cancelText, isDarkMode && styles.cancelTextDark]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}>
                      {cancelText}
                    </Text>
                  </BouncyPressable>
                )}
                <BouncyPressable
                  style={[styles.confirmWrap, singleButton && styles.confirmWrapFull]}
                  activeScale={0.94}
                  onPress={singleButton ? handleDismiss : handleConfirm}>
                  <LinearGradient
                    colors={kind.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.confirm, { borderBottomColor: kind.edge }]}>
                    <Text
                      style={styles.confirmText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}>
                      {confirmText}
                    </Text>
                  </LinearGradient>
                </BouncyPressable>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ModernConfirmModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
    backgroundColor: 'rgba(15,7,29,0.62)',
  },
  card: {
    width: '100%',
    maxWidth: s(340),
    borderRadius: s(26),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E9E5F5',
    borderBottomWidth: 4,
    borderBottomColor: '#D8D0EE',
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#3B1F66' },
  band: {
    height: vs(70),
    borderTopLeftRadius: s(25),
    borderTopRightRadius: s(25),
  },
  close: {
    position: 'absolute',
    top: s(10),
    right: s(10),
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeDark: { backgroundColor: 'rgba(30,16,53,0.9)', borderColor: '#371B58' },
  bubbleWrap: { position: 'absolute', top: vs(70) - s(36), alignSelf: 'center' },
  ring: {
    width: s(76),
    height: s(76),
    borderRadius: s(38),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  bubble: {
    width: s(62),
    height: s(62),
    borderRadius: s(31),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
  },
  body: { alignItems: 'center', paddingHorizontal: s(22), paddingTop: vs(44) },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: s(12),
  },
  badgeDot: { width: s(6), height: s(6), borderRadius: s(3), marginRight: s(6) },
  badgeText: {
    fontSize: ms(9.5),
    letterSpacing: 1.3,
    fontFamily: theme.typography.fontFamily.bold,
  },
  title: {
    marginTop: vs(10),
    textAlign: 'center',
    fontSize: s(19),
    letterSpacing: -0.4,
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  titleDark: { color: '#FFFFFF' },
  subtitle: {
    marginTop: vs(6),
    textAlign: 'center',
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  subtitleDark: { color: '#A5B4CF' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: vs(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(14),
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  noteDark: { backgroundColor: '#0B3B2B', borderColor: '#14532D' },
  noteText: {
    flex: 1,
    marginLeft: s(8),
    fontSize: s(11),
    color: '#047857',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  noteTextDark: { color: '#6EE7B7' },
  actions: { flexDirection: 'row', gap: s(10), padding: s(18), paddingTop: vs(18) },
  cancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
    borderRadius: s(16),
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  cancelDark: { backgroundColor: '#27104B', borderBottomColor: '#3B1F66' },
  cancelText: { fontSize: s(13), color: '#334155', fontFamily: theme.typography.fontFamily.bold },
  cancelTextDark: { color: '#E9D5FF' },
  confirmWrap: { flex: 1.5 },
  confirmWrapFull: { flex: 1 },
  confirm: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(10),
    borderRadius: s(16),
    borderBottomWidth: 3,
  },
  confirmText: {
    fontSize: s(13),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
});
