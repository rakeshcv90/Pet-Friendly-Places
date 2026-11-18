import React, { useEffect } from 'react';
import { AppState, StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';
import { queryClient } from './src/services/api/apiClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useStore } from './src/store';

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
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

export default App;

