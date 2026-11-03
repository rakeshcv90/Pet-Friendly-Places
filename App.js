import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
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

