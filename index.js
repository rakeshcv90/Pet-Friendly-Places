/**
 * @format
 */

import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import { initSecureStorage } from './src/services/storage/storage';
import { name as appName } from './app.json';

// The app (and the store it creates) reads the saved session as soon as it is imported. The session
// lives in the Keychain, which can only be read asynchronously, so the app is loaded afterwards.
const Root = () => {
  const [App, setApp] = useState(null);

  useEffect(() => {
    initSecureStorage().finally(() => setApp(() => require('./App').default));
  }, []);

  return App ? <App /> : null;
};

AppRegistry.registerComponent(appName, () => Root);
