import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { BouncyPressable } from '../common/BouncyPressable';
import {
  getPermissionStatuses,
  requestLocation,
  requestNotificationPermission,
  openPhoneSettings,
} from '../../services/permissions/permissions';

const wait = delay => new Promise(resolve => setTimeout(resolve, delay));

const ROWS = [
  {
    key: 'location',
    icon: 'location',
    title: 'Location',
    text: 'Find pet-friendly places near you',
    colors: ['#34D399', '#059669'],
  },
  {
    key: 'notifications',
    icon: 'notifications',
    title: 'Notifications',
    text: 'Stamps, replies and trip tips',
    colors: ['#F472B6', '#DB2777'],
  },
];

// Shown once after sign-in (and from Settings): explains why each permission helps, then asks the
// phone for them one after the other. Photos and videos need no permission, so they are not here.
export const PermissionsSheet = ({ visible, onClose, isDarkMode = false }) => {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState({ location: 'denied', notifications: 'denied' });
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      setAsked(false);
      return;
    }
    getPermissionStatuses().then(next => alive.current && setStatus(next));
    Animated.spring(slide, { toValue: 1, friction: 9, tension: 80, useNativeDriver: true }).start();
  }, [visible, slide]);

  const close = useCallback(() => {
    Animated.timing(slide, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose?.());
  }, [slide, onClose]);

  // Location first, then notifications, with a short pause so each system popup lands cleanly
  const allowAll = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    if (status.location === 'denied') {
      const location = await requestLocation();
      alive.current && setStatus(prev => ({ ...prev, location }));
      await wait(450);
    }
    if (status.notifications === 'denied') {
      const notifications = await requestNotificationPermission();
      alive.current && setStatus(prev => ({ ...prev, notifications }));
    }
    if (!alive.current) {
      return;
    }
    setBusy(false);
    setAsked(true);
    const next = await getPermissionStatuses();
    if (alive.current) {
      setStatus(next);
      if (next.location === 'granted' && next.notifications === 'granted') {
        await wait(700);
        alive.current && close();
      }
    }
  };

  const allDone = status.location === 'granted' && status.notifications === 'granted';
  const anyBlocked = status.location === 'blocked' || status.notifications === 'blocked';

  const renderState = row => {
    const value = status[row.key];
    if (value === 'granted') {
      return (
        <View style={styles.allowed}>
          <Ionicons name="checkmark-circle" size={ms(16)} color="#059669" />
          <Text style={styles.allowedText}>Allowed</Text>
        </View>
      );
    }
    if (value === 'blocked') {
      return (
        <BouncyPressable style={styles.settingsPill} activeScale={0.94} onPress={openPhoneSettings}>
          <Text style={styles.settingsText}>Settings</Text>
        </BouncyPressable>
      );
    }
    if (value === 'unavailable') {
      return <Text style={[styles.muted, isDarkMode && styles.mutedDark]}>Not available</Text>;
    }
    return <View style={[styles.radio, isDarkMode && styles.radioDark]} />;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}>
      <TouchableWithoutFeedback onPress={busy ? undefined : close}>
        <Animated.View style={[styles.backdrop, { opacity: slide }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.sheet,
                isDarkMode && styles.sheetDark,
                {
                  paddingBottom: Math.max(insets.bottom, vs(16)),
                  transform: [
                    {
                      translateY: slide.interpolate({
                        inputRange: [0, 1],
                        outputRange: [vs(420), 0],
                      }),
                    },
                  ],
                },
              ]}>
              <View style={styles.grabber} />

              <LinearGradient colors={['#3B108F', '#7B2CFF']} style={styles.bubble}>
                <Ionicons name="paw" size={ms(26)} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.title, isDarkMode && styles.titleDark]}>
                Get the most from PetFriendly
              </Text>
              <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
                Two quick permissions. You can change them any time in your phone's Settings.
              </Text>

              <View style={styles.rows}>
                {ROWS.map(row => (
                  <View key={row.key} style={[styles.row, isDarkMode && styles.rowDark]}>
                    <LinearGradient colors={row.colors} style={styles.rowIcon}>
                      <Ionicons name={row.icon} size={ms(18)} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, isDarkMode && styles.titleDark]}>
                        {row.title}
                      </Text>
                      <Text style={[styles.rowSub, isDarkMode && styles.subtitleDark]}>
                        {row.text}
                      </Text>
                    </View>
                    {renderState(row)}
                  </View>
                ))}
              </View>

              {anyBlocked && (
                <Text style={styles.hint}>
                  A blocked permission can only be turned on in your phone's Settings.
                </Text>
              )}

              <BouncyPressable
                testID="permissions-allow"
                style={styles.primary}
                activeScale={0.96}
                onPress={allDone || asked ? close : allowAll}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.primaryGrad, busy && styles.primaryBusy]}>
                  <Text style={styles.primaryText}>
                    {busy ? 'Waiting for your answer…' : allDone || asked ? 'Continue' : 'Allow'}
                  </Text>
                </LinearGradient>
              </BouncyPressable>

              {!allDone && !asked && (
                <BouncyPressable
                  testID="permissions-later"
                  style={styles.later}
                  activeScale={0.95}
                  onPress={busy ? undefined : close}>
                  <Text style={[styles.laterText, isDarkMode && styles.mutedDark]}>
                    Maybe later
                  </Text>
                </BouncyPressable>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,7,29,0.6)' },
  sheet: {
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: vs(10),
    borderTopLeftRadius: s(30),
    borderTopRightRadius: s(30),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.2,
    borderColor: '#E9E5F5',
  },
  sheetDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  grabber: {
    width: s(40),
    height: vs(4),
    borderRadius: 2,
    backgroundColor: '#D8D0EE',
    marginBottom: vs(16),
  },
  bubble: {
    width: s(60),
    height: s(60),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#240A5E',
  },
  title: {
    marginTop: vs(14),
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
  rows: { alignSelf: 'stretch', marginTop: vs(18), gap: s(10) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(12),
    borderRadius: s(18),
    backgroundColor: '#F8F7FC',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD6FE',
  },
  rowDark: { backgroundColor: '#150A28', borderColor: '#2E1654', borderBottomColor: '#3B1F66' },
  rowIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, marginLeft: s(12) },
  rowTitle: { fontSize: s(14), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  rowSub: {
    marginTop: vs(1),
    fontSize: s(11.5),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  allowed: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  allowedText: {
    fontSize: s(11.5),
    color: '#059669',
    fontFamily: theme.typography.fontFamily.bold,
  },
  settingsPill: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: s(12),
    backgroundColor: '#FEF3C7',
  },
  settingsText: { fontSize: s(11), color: '#B45309', fontFamily: theme.typography.fontFamily.bold },
  radio: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    borderWidth: 2,
    borderColor: '#C4B5FD',
  },
  radioDark: { borderColor: '#4C1D95' },
  muted: { fontSize: s(11), color: '#94A3B8', fontFamily: theme.typography.fontFamily.medium },
  mutedDark: { color: '#94A3B8' },
  hint: {
    marginTop: vs(12),
    textAlign: 'center',
    fontSize: s(11.5),
    color: '#B45309',
    fontFamily: theme.typography.fontFamily.medium,
  },
  primary: { alignSelf: 'stretch', marginTop: vs(18), borderRadius: s(18) },
  primaryGrad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(14),
    borderRadius: s(18),
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(30,7,71,0.35)',
  },
  primaryBusy: { opacity: 0.75 },
  primaryText: {
    fontSize: s(15),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  later: { marginTop: vs(8), padding: s(10) },
  laterText: {
    fontSize: s(12.5),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
