import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { navigationRef } from './navigationRef';
import { useStore } from '../store';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';

export const RootNavigator = () => {
  const { isAuthenticated, setAuthInfo } = useStore();

  useEffect(() => {
    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const user = getItem(STORAGE_KEYS.USER_INFO, true);

    if (token && user) {
      setAuthInfo(user, token);
    }
  }, [setAuthInfo]);

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
