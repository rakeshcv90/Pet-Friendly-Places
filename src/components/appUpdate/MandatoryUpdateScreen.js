import React from 'react';
import { View, Text, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { s } from 'react-native-size-matters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useInAppUpdate } from '../../hooks/useInAppUpdate';
import { APP_UPDATE_STATUS } from '../../services/appUpdate/appUpdateStore';
import { AppIcon, PrimaryButton, ProgressBar, SecondaryButton, VersionRow } from './AppUpdateModal';

// Full screen that replaces the app while the installed version is below the minimum supported
// one. It cannot be dismissed (the Android back button does nothing). It checks again each time the
// app returns to the foreground (useAppUpdateAutoCheck) and offers Update now and Try again, and it
// explains being offline instead of failing silently.
export const MandatoryUpdateScreen = () => {
  const isDarkMode = useStore(state => state.isDarkMode);
  const insets = useSafeAreaInsets();
  const app = useInAppUpdate();
  const { status } = app;

  if (!app.mandatory) {
    return null;
  }

  const installedLine = app.installedBuild
    ? `${app.installedVersion} (${app.installedBuild})`
    : app.installedVersion;
  const available = app.storeVersion || app.minimumVersion;
  const checking = status === APP_UPDATE_STATUS.CHECKING || status === APP_UPDATE_STATUS.IDLE;
  const working = status === APP_UPDATE_STATUS.UPDATING;
  const downloading = status === APP_UPDATE_STATUS.DOWNLOADING;
  const offline = status === APP_UPDATE_STATUS.OFFLINE;

  let message = `This version of Pet Friendly Places is no longer supported. Please update to version ${
    app.minimumVersion || 'the latest'
  } or newer to keep using the app.`;
  if (offline) {
    message = app.error;
  } else if (status === APP_UPDATE_STATUS.ERROR) {
    message = app.error;
  } else if (app.cancelled) {
    message = 'The update was cancelled. This update is required to continue.';
  } else if (working) {
    message = 'Google Play is installing the update. The app will restart when it is done.';
  } else if (downloading) {
    message = 'Downloading the update…';
  } else if (status === APP_UPDATE_STATUS.UNAVAILABLE) {
    message = `${message} The update is not available in the store yet, so please try again later.`;
  }

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View
        testID="mandatory-update-screen"
        style={[
          styles.screen,
          isDarkMode && styles.screenDark,
          { paddingTop: insets.top + s(24), paddingBottom: insets.bottom + s(24) },
        ]}>
        <View style={styles.center}>
          <AppIcon isDarkMode={isDarkMode} />
          <Text style={[styles.title, isDarkMode && styles.textWhite]}>Update required</Text>
          <Text
            testID="mandatory-update-message"
            style={[styles.message, isDarkMode && styles.textMutedDark]}>
            {message}
          </Text>
          <View style={styles.versions}>
            <VersionRow installed={installedLine} available={available} isDarkMode={isDarkMode} />
          </View>
          {downloading && <ProgressBar progress={app.progress} isDarkMode={isDarkMode} />}
          {(checking || working) && (
            <ActivityIndicator testID="mandatory-update-spinner" color="#7B2CFF" style={styles.spinner} />
          )}
        </View>

        {!working && !downloading && (
          <View style={styles.actions}>
            {!offline && (
              <PrimaryButton testID="mandatory-update-now" label="Update now" onPress={app.update} />
            )}
            <SecondaryButton
              testID="mandatory-update-retry"
              label={offline ? 'Try again' : 'Check again'}
              onPress={app.check}
              isDarkMode={isDarkMode}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F2', paddingHorizontal: s(24) },
  screenDark: { backgroundColor: '#0F071D' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', maxWidth: 420 },
  title: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    letterSpacing: -0.4,
    color: '#1A0B2E',
    textAlign: 'center',
  },
  message: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(13.5),
    lineHeight: s(20),
    color: '#64748B',
    textAlign: 'center',
    marginTop: s(8),
  },
  versions: { alignSelf: 'stretch' },
  spinner: { marginTop: s(18) },
  textWhite: { color: '#FFFFFF' },
  textMutedDark: { color: '#A5B4C7' },
  actions: { alignSelf: 'center', width: '100%', maxWidth: 420, gap: s(8) },
});
