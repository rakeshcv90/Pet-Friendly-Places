import React, { useEffect } from 'react';
import { AppState, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { queryClient } from './src/services/api/apiClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useStore } from './src/store';
import codePush from '@revopush/react-native-code-push';
import { useOtaAutoUpdate } from './src/hooks/useOtaUpdate';
import { OtaUpdateBanner } from './src/components/ota/OtaUpdateBanner';
import { useAppUpdateAutoCheck } from './src/hooks/useInAppUpdate';
import { AppUpdateModal } from './src/components/appUpdate/AppUpdateModal';
import { MandatoryUpdateScreen } from './src/components/appUpdate/MandatoryUpdateScreen';

const App = () => {
  const systemScheme = useColorScheme();
  const themeMode = useStore(state => state.themeMode);
  const isDarkMode = useStore(state => state.isDarkMode);
  const syncSystemTheme = useStore(state => state.syncSystemTheme);

  useEffect(() => {
    if (themeMode === 'system' && syncSystemTheme) {
      syncSystemTheme(systemScheme);
    }
  }, [systemScheme, themeMode, syncSystemTheme]);

  // Google Play / App Store updates for new native builds: checked at start-up and on return to the
  // foreground. A version below the minimum supported one is blocked by MandatoryUpdateScreen, and
  // that always comes before any OTA prompt.
  useAppUpdateAutoCheck();

  // Over-the-air updates: look for one at start-up and on return to the foreground. It downloads
  // compatible updates and installs them for the next start, and never restarts the app itself.
  useOtaAutoUpdate();

  // React Query only knows about browser tabs. Tell it when the app comes back to the foreground, so
  // queries that opt in (refetchOnWindowFocus) reload, e.g. a pet added from another phone.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent={true}
        />
        <RootNavigator />
        <OtaUpdateBanner />
        <AppUpdateModal />
        <MandatoryUpdateScreen />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

// Revopush OTA. The wrapper tells the SDK the app started fine once it has rendered (that is what
// keeps an update installed; a crash before that rolls it back on the next start). Checking for
// updates is MANUAL here because useOtaAutoUpdate above does it, with the app's own rules. If the
// native module is missing (for example an old build), the app runs unwrapped.
const codePushOptions = { checkFrequency: codePush?.CheckFrequency?.MANUAL ?? 2 };

export default typeof codePush === 'function' ? codePush(codePushOptions)(App) : App;

