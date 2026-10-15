import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { navigationRef } from './navigationRef';
import { useStore } from '../store';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';
import { Loader } from '../components/common/Loader';

export const RootNavigator = () => {
  const { isAuthenticated, setAuthInfo } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check MMKV for existing auth token synchronously
    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const user = getItem(STORAGE_KEYS.USER_INFO, true);

    if (token && user) {
      setAuthInfo(user, token);
    }
    
    setIsInitializing(false);
  }, [setAuthInfo]);

  if (isInitializing) {
    return <Loader fullScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
