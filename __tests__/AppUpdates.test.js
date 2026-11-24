import React from 'react';
import { render, act } from '@testing-library/react-native';
import codePush from '@revopush/react-native-code-push';
import App from '../App';
import { useAppUpdateStore, APP_UPDATE_STATUS } from '../src/services/appUpdate/appUpdateStore';
import { useOtaStore } from '../src/services/ota/otaStore';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-vector-icons/Feather', () => 'Feather');
jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => {
    const { Text } = require('react-native');
    return <Text>the app</Text>;
  },
}));

// Store updates (Google Play / App Store) and OTA updates (Revopush) live side by side in App.js
describe('App update layers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppUpdateStore.getState().resetAppUpdate();
    useOtaStore.getState().resetOta();
  });

  it('shows the app normally when the installed version is supported', () => {
    const { getByText, queryByTestId } = render(<App />);

    expect(getByText('the app')).toBeTruthy();
    expect(queryByTestId('mandatory-update-screen')).toBeNull();
    expect(queryByTestId('app-update-modal')).toBeNull();
  });

  it('puts the Update required screen over the app when the version is below the minimum', () => {
    const { getByTestId } = render(<App />);

    act(() => {
      useAppUpdateStore.getState().setAppUpdate({
        mandatory: true,
        minimumVersion: '9.0.0',
        status: APP_UPDATE_STATUS.AVAILABLE,
      });
    });

    expect(getByTestId('mandatory-update-screen')).toBeTruthy();
  });

  it('shows the optional store update dialog, and the OTA banner stays out of its way', () => {
    const { getByTestId, queryByTestId } = render(<App />);

    act(() => {
      useOtaStore.getState().setOta({ restartPending: true, source: 'auto' });
    });
    expect(queryByTestId('ota-banner')).toBeTruthy();

    act(() => {
      useAppUpdateStore.getState().setAppUpdate({
        modalVisible: true,
        status: APP_UPDATE_STATUS.AVAILABLE,
        storeVersion: '1.5.0',
      });
    });

    expect(getByTestId('app-update-modal')).toBeTruthy();
    expect(queryByTestId('ota-banner')).toBeNull();
  });

  it('still wraps the root component with Revopush, checking manually', () => {
    jest.isolateModules(() => {
      const wrapper = jest.fn(component => component);
      codePush.mockReturnValueOnce(wrapper);

      require('../App');

      expect(codePush).toHaveBeenCalledWith({ checkFrequency: 2 });
      expect(wrapper).toHaveBeenCalledTimes(1);
    });
  });
});
