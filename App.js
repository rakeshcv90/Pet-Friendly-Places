import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/services/api/apiClient';
import { RootNavigator } from './src/navigation/RootNavigator';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

export default App;

