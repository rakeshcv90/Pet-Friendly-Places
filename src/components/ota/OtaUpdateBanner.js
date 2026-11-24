import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { BouncyPressable } from '../common/BouncyPressable';
import { useOtaUpdate } from '../../hooks/useOtaUpdate';
import { OTA_STATUS } from '../../services/ota/otaStore';
import { useAppUpdateStore } from '../../services/appUpdate/appUpdateStore';

// A small, non-blocking notice for updates that arrive by themselves (start-up or resume):
// downloading, ready to apply, or failed. It never restarts the app: only the user's tap does.
const useBannerView = () => {
  const ota = useOtaUpdate();
  // The store-update dialog or the required-update screen is showing: one update message at a time
  const storeUpdateShowing = useAppUpdateStore(state => state.modalVisible || state.mandatory);
  if (ota.sheetOpen || storeUpdateShowing) {
    return null;
  }
  if (ota.status === OTA_STATUS.DOWNLOADING && ota.source === 'auto') {
    return { kind: 'downloading', progress: ota.progress, ota };
  }
  if (ota.restartPending && !ota.bannerDismissed) {
    return { kind: ota.restartRequired ? 'required' : 'ready', ota };
  }
  // A failed automatic update is reported once. Offline is not an error, so it stays quiet.
  if (ota.status === OTA_STATUS.ERROR && ota.source === 'auto' && !ota.bannerDismissed) {
    return { kind: 'error', ota };
  }
  return null;
};

export const OtaUpdateBanner = () => {
  const insets = useSafeAreaInsets();
  const view = useBannerView();
  const slide = useRef(new Animated.Value(0)).current;
  const shown = !!view;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: shown ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [shown, slide]);

  if (!view) {
    return null;
  }

  const { kind, ota } = view;
  const percent = Math.round((view.progress || 0) * 100);
  const colors = kind === 'error' ? ['#9F1239', '#E11D48'] : ['#4A12B0', '#7B2CFF'];
  const icon =
    kind === 'downloading' ? 'download-cloud' : kind === 'error' ? 'alert-circle' : 'check-circle';
  const message =
    kind === 'downloading'
      ? `Downloading update… ${percent}%`
      : kind === 'required'
      ? 'A required update is ready. It applies shortly after you leave the app, or restart now.'
      : kind === 'ready'
      ? 'Update ready. The app updates itself when you leave it for a moment, or restart now.'
      : ota.error || "We couldn't install an update. We'll try again later.";

  return (
    <Animated.View
      testID="ota-banner"
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          top: Math.max(insets.top, s(12)) + s(6),
          opacity: slide,
          transform: [
            { translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-s(20), 0] }) },
          ],
        },
      ]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.card}>
        <Feather name={icon} size={ms(18)} color="#FFFFFF" />
        <View style={styles.body}>
          <Text style={styles.message}>{message}</Text>
          {kind === 'downloading' && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${percent}%` }]} />
            </View>
          )}
        </View>
        {(kind === 'ready' || kind === 'required') && (
          <BouncyPressable
            testID="ota-banner-restart"
            accessibilityLabel="Restart now"
            activeScale={0.94}
            onPress={ota.restart}
            style={styles.action}>
            <Text style={styles.actionText}>Restart</Text>
          </BouncyPressable>
        )}
        {kind !== 'downloading' && kind !== 'required' && (
          <BouncyPressable
            testID="ota-banner-dismiss"
            accessibilityLabel="Dismiss"
            activeScale={0.9}
            onPress={ota.dismissBanner}
            style={styles.close}>
            <Feather name="x" size={ms(16)} color="rgba(255,255,255,0.85)" />
          </BouncyPressable>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: s(12), right: s(12), zIndex: 1000 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    borderRadius: s(16),
    paddingVertical: s(10),
    paddingHorizontal: s(14),
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  body: { flex: 1 },
  message: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12),
    lineHeight: s(17),
    color: '#FFFFFF',
  },
  track: {
    height: s(4),
    borderRadius: s(2),
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: s(7),
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: s(2), backgroundColor: '#FFFFFF' },
  action: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    paddingHorizontal: s(14),
    paddingVertical: s(6),
  },
  actionText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(12), color: '#4A12B0' },
  close: { padding: s(4) },
});
