import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { BouncyPressable } from '../common/BouncyPressable';
import { NightSky } from '../../screens/Community/NightSky';
import { Bob } from '../../screens/Community/Motion';
import { authenticate } from '../../services/security/appLock';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';

// Shown instead of the app while it is locked. It shows nothing of the user's data, and opens the
// phone's own unlock prompt on its own once (`autoPrompt`), then again each time Unlock is tapped.
export const LockScreen = ({ autoPrompt = true, onUnlock, onSignOut }) => {
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const prompted = useRef(false);

  const unlock = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    const ok = await authenticate();
    busy.current = false;
    if (ok) {
      onUnlock();
    } else {
      setFailed(true);
    }
  }, [onUnlock]);

  useEffect(() => {
    if (autoPrompt && !prompted.current) {
      prompted.current = true;
      unlock();
    }
  }, [autoPrompt, unlock]);

  return (
    <LinearGradient
      colors={[DEEP_PURPLE, PURPLE]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />
      <NightSky topInset={0} />

      <View style={styles.center}>
        <Bob style={styles.emblem} distance={5} duration={2400}>
          <Ionicons name="lock-closed" size={ms(34)} color="#FFFFFF" />
        </Bob>
        <Text style={styles.title}>PetFriendly is locked</Text>
        <Text style={styles.subtitle}>
          {failed
            ? 'We could not verify it is you. Please try again.'
            : 'Use your fingerprint, face or phone lock to continue.'}
        </Text>

        <BouncyPressable
          testID="lock-unlock"
          style={styles.unlock}
          activeScale={0.95}
          onPress={unlock}>
          <Ionicons name="finger-print" size={ms(20)} color={DEEP_PURPLE} />
          <Text style={styles.unlockText}>Unlock</Text>
        </BouncyPressable>

        <BouncyPressable
          testID="lock-sign-out"
          style={styles.signOut}
          activeScale={0.95}
          onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out instead</Text>
        </BouncyPressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: { ...StyleSheet.absoluteFillObject, zIndex: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(32) },
  emblem: {
    width: s(84),
    height: s(84),
    borderRadius: s(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(20,6,60,0.4)',
  },
  title: {
    marginTop: vs(22),
    fontSize: s(22),
    letterSpacing: -0.5,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  subtitle: {
    marginTop: vs(8),
    textAlign: 'center',
    fontSize: s(13),
    lineHeight: s(19),
    color: 'rgba(255,255,255,0.85)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  unlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginTop: vs(28),
    paddingHorizontal: s(34),
    paddingVertical: vs(14),
    borderRadius: s(26),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  unlockText: {
    fontSize: s(15),
    color: DEEP_PURPLE,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  signOut: { marginTop: vs(18), padding: s(8) },
  signOutText: {
    fontSize: s(12.5),
    color: 'rgba(255,255,255,0.8)',
    textDecorationLine: 'underline',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
});
