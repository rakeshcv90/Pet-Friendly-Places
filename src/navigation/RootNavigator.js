import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { MainSplash } from '../screens/Splash/MainSplash';
import { AppLockGate } from '../components/security/AppLockGate';
import { PermissionsGate } from '../components/permissions/PermissionsGate';
import { navigationRef } from './navigationRef';
import { useStore } from '../store';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';

export const RootNavigator = () => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const setAuthInfo = useStore(state => state.setAuthInfo);
  const isDarkMode = useStore(state => state.isDarkMode);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const user = getItem(STORAGE_KEYS.USER_INFO, true);

    if (token && user) {
      setAuthInfo(user, token);
    }
  }, [setAuthInfo]);

  const navTheme = useMemo(() => {
    if (isDarkMode) {
      return {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#0F071D',
          card: '#17092E',
          text: '#FFFFFF',
          border: '#2E1654',
          primary: '#7C3AED',
        },
      };
    }
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: '#FAF7F2',
        card: '#FFFFFF',
        text: '#1C1C1C',
        border: '#E8E5DF',
        primary: '#7B2CFF',
      },
    };
  }, [isDarkMode]);

  return (
    <View style={[styles.rootContainer, isDarkMode && styles.rootContainerDark]}>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>

      {/* The lock screen covers the app (and the offer to turn it on) until the user is verified */}
      <AppLockGate ready={!showSplash} isDarkMode={isDarkMode} />
      <PermissionsGate ready={!showSplash} isDarkMode={isDarkMode} />

      {/* Splash overlay renders on top so HomeScreen/Auth pre-renders underneath, eliminating any white flash */}
      {showSplash && (
        <MainSplash onFinish={() => setShowSplash(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  rootContainerDark: {
    backgroundColor: '#0F071D',
  },
});
