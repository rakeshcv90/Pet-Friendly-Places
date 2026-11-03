import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Switch } from 'react-native';
import { SettingsBottomSheet } from '../components/SettingsBottomSheet';

const baseProps = {
  visible: true,
  onClose: jest.fn(),
  themeMode: 'light',
  isDarkMode: false,
  toggleDarkMode: jest.fn(),
  accentColor: '#7C3AED',
  setAccentColor: jest.fn(),
  pushNotifications: true,
  setPushNotifications: jest.fn(),
  travelAlerts: true,
  setTravelAlerts: jest.fn(),
  publicProfile: true,
  setPublicProfile: jest.fn(),
  onChangePassword: jest.fn(),
};

describe('SettingsBottomSheet theme controls', () => {
  it('applies a theme once even when tapped repeatedly while it is being applied', async () => {
    const setThemeMode = jest.fn();
    const { getByText } = render(<SettingsBottomSheet {...baseProps} setThemeMode={setThemeMode} />);

    fireEvent.press(getByText('Dark'));
    fireEvent.press(getByText('Dark'));
    fireEvent.press(getByText('Light'));

    await waitFor(() => expect(setThemeMode).toHaveBeenCalledTimes(1));
    expect(setThemeMode).toHaveBeenCalledWith('dark');
  });

  it('flips the dark switch immediately, before the store has changed', () => {
    const setThemeMode = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <SettingsBottomSheet {...baseProps} setThemeMode={setThemeMode} />,
    );
    const darkSwitch = () => UNSAFE_getAllByType(Switch)[0];

    expect(darkSwitch().props.value).toBe(false);
    fireEvent(darkSwitch(), 'valueChange', true);
    expect(darkSwitch().props.value).toBe(true);
  });

  it('ignores a tap on the mode that is already active', async () => {
    const setThemeMode = jest.fn();
    const { getByText } = render(<SettingsBottomSheet {...baseProps} setThemeMode={setThemeMode} />);

    fireEvent.press(getByText('Light'));
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(setThemeMode).not.toHaveBeenCalled();
  });
});
