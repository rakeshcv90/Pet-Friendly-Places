import React, { useEffect } from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { BouncyPressable } from '../common/BouncyPressable';
import { useOtaUpdate, useOtaVersionInfo } from '../../hooks/useOtaUpdate';
import { OTA_STATUS, useOtaStore } from '../../services/ota/otaStore';
import { formatBytes } from '../../services/ota/otaService';

const PURPLE = '#7B2CFF';

const PrimaryButton = ({ label, onPress, testID }) => (
  <BouncyPressable testID={testID} activeScale={0.96} onPress={onPress} style={styles.buttonWrap}>
    <LinearGradient
      colors={['#7B2CFF', '#C026D3', '#FF4FB8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.primary}>
      <Text style={styles.primaryText}>{label}</Text>
    </LinearGradient>
  </BouncyPressable>
);

const SecondaryButton = ({ label, onPress, testID, isDarkMode }) => (
  <BouncyPressable
    testID={testID}
    activeScale={0.96}
    onPress={onPress}
    style={[styles.secondary, isDarkMode && styles.secondaryDark]}>
    <Text style={[styles.secondaryText, isDarkMode && styles.textMutedDark]}>{label}</Text>
  </BouncyPressable>
);

// "Check for updates" in the Profile menu: look for an update, show what it is, download it with a
// progress bar and offer to restart once it is installed.
export const OtaUpdateSheet = ({ visible, onClose, isDarkMode = false }) => {
  const ota = useOtaUpdate();
  const version = useOtaVersionInfo();
  const { check, status } = ota;

  // Each time the sheet opens it checks, and tells the banner to stay out of the way
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    useOtaStore.setState({ sheetOpen: true });
    check();
    return () => useOtaStore.setState({ sheetOpen: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const close = () => onClose?.();
  const later = () => {
    // Keep a reminder in the banner for an update that is waiting for a restart
    ota.dismissBanner();
    close();
  };

  const percent = Math.round(ota.progress * 100);
  const versionLine = [
    version.appVersion ? `Version ${version.appVersion}` : '',
    version.label ? `Update ${version.label}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  let icon = 'refresh-cw';
  let title = 'Checking for updates…';
  let subtitle = '';
  let body = null;
  let actions = null;

  if (status === OTA_STATUS.UP_TO_DATE) {
    icon = 'check-circle';
    title = 'Your app is up to date';
    subtitle = versionLine || 'You have the latest version.';
    actions = <SecondaryButton testID="ota-close" label="Close" onPress={close} isDarkMode={isDarkMode} />;
  } else if (status === OTA_STATUS.AVAILABLE && ota.update) {
    icon = 'gift';
    title = ota.update.isMandatory ? 'Required update available' : 'Update available';
    subtitle = [ota.update.label, formatBytes(ota.update.size)].filter(Boolean).join(' · ');
    body = (
      <View>
        {!!ota.update.description && (
          <ScrollView style={styles.notes} showsVerticalScrollIndicator={false}>
            <Text style={[styles.notesText, isDarkMode && styles.textMutedDark]}>
              {ota.update.description}
            </Text>
          </ScrollView>
        )}
        {ota.update.isMandatory && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Required</Text>
          </View>
        )}
      </View>
    );
    actions = (
      <>
        <PrimaryButton testID="ota-download" label="Download update" onPress={ota.download} />
        {!ota.update.isMandatory && (
          <SecondaryButton testID="ota-later" label="Not now" onPress={close} isDarkMode={isDarkMode} />
        )}
      </>
    );
  } else if (status === OTA_STATUS.DOWNLOADING) {
    icon = 'download-cloud';
    title = 'Downloading update…';
    subtitle = `${percent}%`;
    body = (
      <View style={[styles.track, isDarkMode && styles.trackDark]}>
        <View testID="ota-progress-fill" style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    );
  } else if (status === OTA_STATUS.INSTALLED) {
    icon = 'check-circle';
    title = 'Update installed';
    subtitle = ota.restartRequired
      ? 'This is a required update. It applies shortly after you leave the app. Restart to use it now.'
      : 'It applies by itself when you leave the app for a moment. Restart to use it right away.';
    actions = (
      <>
        <PrimaryButton testID="ota-restart" label="Restart now" onPress={ota.restart} />
        {!ota.restartRequired && (
          <SecondaryButton testID="ota-later" label="Later" onPress={later} isDarkMode={isDarkMode} />
        )}
      </>
    );
  } else if (status === OTA_STATUS.OFFLINE || status === OTA_STATUS.ERROR) {
    icon = status === OTA_STATUS.OFFLINE ? 'wifi-off' : 'alert-circle';
    title = status === OTA_STATUS.OFFLINE ? "You're offline" : 'Something went wrong';
    subtitle = ota.error || '';
    actions = (
      <>
        <PrimaryButton
          testID="ota-retry"
          label="Try again"
          onPress={() => (ota.update ? ota.download() : check())}
        />
        <SecondaryButton testID="ota-close" label="Close" onPress={close} isDarkMode={isDarkMode} />
      </>
    );
  } else if (status === OTA_STATUS.DISABLED) {
    icon = 'info';
    title = 'Updates unavailable';
    subtitle = ota.error || '';
    actions = <SecondaryButton testID="ota-close" label="Close" onPress={close} isDarkMode={isDarkMode} />;
  }

  const busy = status === OTA_STATUS.CHECKING || status === OTA_STATUS.IDLE;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View testID="ota-sheet" style={[styles.card, isDarkMode && styles.cardDark]}>
          <View style={[styles.iconWrap, isDarkMode && styles.iconWrapDark]}>
            {busy ? (
              <ActivityIndicator testID="ota-spinner" color={PURPLE} />
            ) : (
              <Feather name={icon} size={ms(26)} color={PURPLE} />
            )}
          </View>
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>{title}</Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, isDarkMode && styles.textMutedDark]}>{subtitle}</Text>
          )}
          {body}
          {!!actions && <View style={styles.actions}>{actions}</View>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,7,29,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
  },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    paddingHorizontal: s(20),
    paddingTop: s(24),
    paddingBottom: s(20),
  },
  cardDark: { backgroundColor: '#1E0E38' },
  iconWrap: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(14),
  },
  iconWrapDark: { backgroundColor: '#2A1450' },
  title: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(18),
    letterSpacing: -0.3,
    color: '#1A0B2E',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#64748B',
    textAlign: 'center',
    marginTop: s(6),
  },
  textWhite: { color: '#FFFFFF' },
  textMutedDark: { color: '#A5B4C7' },
  notes: {
    maxHeight: s(110),
    alignSelf: 'stretch',
    marginTop: s(12),
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderRadius: s(14),
    padding: s(12),
  },
  notesText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(18),
    color: '#475569',
  },
  chip: {
    alignSelf: 'center',
    marginTop: s(10),
    backgroundColor: '#FEF3C7',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: s(3),
  },
  chipText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(10.5), color: '#92400E' },
  track: {
    alignSelf: 'stretch',
    height: s(8),
    borderRadius: s(4),
    backgroundColor: '#EDE9FE',
    marginTop: s(16),
    overflow: 'hidden',
  },
  trackDark: { backgroundColor: '#2E1654' },
  fill: { height: '100%', borderRadius: s(4), backgroundColor: PURPLE },
  actions: { alignSelf: 'stretch', gap: s(8), marginTop: s(18) },
  buttonWrap: { alignSelf: 'stretch', borderRadius: s(16) },
  primary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(12),
    borderRadius: s(16),
  },
  primaryText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13.5), color: '#FFFFFF' },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(11),
    borderRadius: s(16),
    backgroundColor: '#F5F3FF',
  },
  secondaryDark: { backgroundColor: '#2A1450' },
  secondaryText: { fontFamily: theme.typography.fontFamily.bold, fontSize: s(13), color: '#6D28D9' },
});
