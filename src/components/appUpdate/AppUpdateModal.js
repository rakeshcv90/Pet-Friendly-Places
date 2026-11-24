import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../common/BouncyPressable';
import { useInAppUpdate } from '../../hooks/useInAppUpdate';
import { APP_UPDATE_STATUS } from '../../services/appUpdate/appUpdateStore';
import { formatBytes } from '../../services/ota/otaService';

const PURPLE = '#7B2CFF';

export const PrimaryButton = ({ label, onPress, testID }) => (
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

export const SecondaryButton = ({ label, onPress, testID, isDarkMode }) => (
  <BouncyPressable
    testID={testID}
    activeScale={0.96}
    onPress={onPress}
    style={[styles.secondary, isDarkMode && styles.secondaryDark]}>
    <Text style={[styles.secondaryText, isDarkMode && styles.textLilacDark]}>{label}</Text>
  </BouncyPressable>
);

// Installed -> available, side by side. The two numbers are always shown apart: a store update
// changes the app version, an OTA update only changes the release label (see the OTA sheet).
export const VersionRow = ({ installed, available, isDarkMode }) => (
  <View style={[styles.versions, isDarkMode && styles.versionsDark]}>
    <View style={styles.versionCell}>
      <Text style={[styles.versionLabel, isDarkMode && styles.textMutedDark]}>Installed</Text>
      <Text testID="app-update-installed" style={[styles.versionValue, isDarkMode && styles.textWhite]}>
        {installed || '-'}
      </Text>
    </View>
    <Feather name="arrow-right" size={ms(16)} color={PURPLE} />
    <View style={styles.versionCell}>
      <Text style={[styles.versionLabel, isDarkMode && styles.textMutedDark]}>Available</Text>
      <Text testID="app-update-available" style={[styles.versionValue, isDarkMode && styles.textWhite]}>
        {available || '-'}
      </Text>
    </View>
  </View>
);

export const ProgressBar = ({ progress, isDarkMode }) => (
  <View style={[styles.track, isDarkMode && styles.trackDark]}>
    <View
      testID="app-update-progress-fill"
      style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]}
    />
  </View>
);

export const AppIcon = ({ isDarkMode }) => (
  <View style={[styles.iconWrap, isDarkMode && styles.iconWrapDark]}>
    <Image source={theme.images.logo} style={styles.icon} resizeMode="contain" />
  </View>
);

// The store-update dialog: the optional "Update available" offer (Update now / Later), and the
// Settings > Check for app update result (checking, up to date, offline, error). The blocking
// "Update required" screen is separate (MandatoryUpdateScreen). One instance lives in App.js.
export const AppUpdateModal = () => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const app = useInAppUpdate();
  const { status } = app;
  // A required update has its own full screen
  const visible = app.modalVisible && !app.mandatory;

  const installedLine = app.installedBuild
    ? `${app.installedVersion} (${app.installedBuild})`
    : app.installedVersion;
  const percent = Math.round(app.progress * 100);

  let icon = 'refresh-cw';
  let title = 'Checking for updates…';
  let subtitle = '';
  let body = null;
  let actions = null;
  let busy = status === APP_UPDATE_STATUS.CHECKING || status === APP_UPDATE_STATUS.IDLE;

  const closeButton = (
    <SecondaryButton testID="app-update-close" label="Close" onPress={app.later} isDarkMode={isDarkMode} />
  );

  if (status === APP_UPDATE_STATUS.UP_TO_DATE) {
    icon = 'check-circle';
    title = 'Your app is up to date';
    subtitle = installedLine ? `Version ${installedLine}` : 'You have the latest version.';
    actions = closeButton;
  } else if (status === APP_UPDATE_STATUS.AVAILABLE) {
    icon = 'gift';
    title = 'Update available';
    subtitle = formatBytes(app.totalBytes);
    body = (
      <View style={styles.bodyBox}>
        <VersionRow installed={installedLine} available={app.storeVersion} isDarkMode={isDarkMode} />
        {!!app.releaseNotes && (
          <ScrollView style={styles.notes} showsVerticalScrollIndicator={false}>
            <Text style={[styles.notesText, isDarkMode && styles.textMutedDark]}>{app.releaseNotes}</Text>
          </ScrollView>
        )}
        {app.cancelled && (
          <Text style={[styles.hint, isDarkMode && styles.textMutedDark]}>The update was cancelled.</Text>
        )}
      </View>
    );
    actions = (
      <>
        <PrimaryButton testID="app-update-now" label="Update now" onPress={app.update} />
        <SecondaryButton testID="app-update-later" label="Later" onPress={app.later} isDarkMode={isDarkMode} />
      </>
    );
  } else if (status === APP_UPDATE_STATUS.DOWNLOADING) {
    icon = 'download-cloud';
    title = 'Downloading update…';
    subtitle = 'You can keep using the app while it downloads.';
    body = (
      <View style={styles.bodyBox}>
        <ProgressBar progress={app.progress} isDarkMode={isDarkMode} />
        <Text testID="app-update-percent" style={[styles.percent, isDarkMode && styles.textMutedDark]}>
          {percent}%
        </Text>
      </View>
    );
    actions = (
      <SecondaryButton testID="app-update-hide" label="Keep using the app" onPress={app.later} isDarkMode={isDarkMode} />
    );
  } else if (status === APP_UPDATE_STATUS.DOWNLOADED) {
    icon = 'check-circle';
    title = 'Update ready';
    subtitle = 'Restart the app to finish updating.';
    actions = (
      <>
        <PrimaryButton testID="app-update-restart" label="Restart to update" onPress={app.restart} />
        <SecondaryButton testID="app-update-later" label="Later" onPress={app.later} isDarkMode={isDarkMode} />
      </>
    );
  } else if (status === APP_UPDATE_STATUS.UPDATING) {
    title = 'Updating…';
    subtitle = 'Google Play is installing the update.';
    busy = true;
  } else if (status === APP_UPDATE_STATUS.UNAVAILABLE) {
    icon = 'info';
    title = 'No store update to check';
    subtitle = app.error || '';
    actions = closeButton;
  } else if (status === APP_UPDATE_STATUS.OFFLINE || status === APP_UPDATE_STATUS.ERROR) {
    icon = status === APP_UPDATE_STATUS.OFFLINE ? 'wifi-off' : 'alert-circle';
    title = status === APP_UPDATE_STATUS.OFFLINE ? "You're offline" : 'Something went wrong';
    subtitle = app.error || '';
    actions = (
      <>
        <PrimaryButton testID="app-update-retry" label="Try again" onPress={app.check} />
        {closeButton}
      </>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={app.later}>
      <View style={styles.backdrop}>
        <View testID="app-update-modal" style={[styles.card, isDarkMode && styles.cardDark]}>
          <AppIcon isDarkMode={isDarkMode} />
          <View style={[styles.statusIcon, isDarkMode && styles.statusIconDark]}>
            {busy ? (
              <ActivityIndicator testID="app-update-spinner" color={PURPLE} />
            ) : (
              <Feather name={icon} size={ms(20)} color={PURPLE} />
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
    maxWidth: 420,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(24),
    paddingHorizontal: s(20),
    paddingTop: s(24),
    paddingBottom: s(20),
  },
  cardDark: { backgroundColor: '#1E0E38' },
  iconWrap: {
    width: s(64),
    height: s(64),
    borderRadius: s(18),
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
    overflow: 'hidden',
  },
  iconWrapDark: { backgroundColor: '#2A1450' },
  icon: { width: s(44), height: s(44) },
  statusIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(10),
  },
  statusIconDark: { backgroundColor: '#2A1450' },
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
  textLilacDark: { color: '#D8C4FF' },
  bodyBox: { alignSelf: 'stretch' },
  versions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: s(14),
    backgroundColor: 'rgba(124,58,237,0.06)',
    borderRadius: s(14),
    paddingVertical: s(10),
  },
  versionsDark: { backgroundColor: 'rgba(124,58,237,0.14)' },
  versionCell: { alignItems: 'center' },
  versionLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(10.5),
    color: '#64748B',
  },
  versionValue: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(14),
    color: '#1A0B2E',
    marginTop: s(2),
  },
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
  hint: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(11.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: s(10),
  },
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
  percent: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(12),
    color: '#64748B',
    textAlign: 'center',
    marginTop: s(6),
  },
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
