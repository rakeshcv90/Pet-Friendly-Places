import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChangePasswordScreen } from '../ChangePasswordScreen';

describe('ChangePasswordScreen Component', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders change password screen with header, inputs, and buttons', () => {
    const { getByText, getByTestId, getAllByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );

    expect(getAllByText('Change Password').length).toBeGreaterThan(0);
    expect(getByText('Enter your current password and choose a new one')).toBeTruthy();
    expect(getByText('Current Password')).toBeTruthy();
    expect(getByText('New Password')).toBeTruthy();
    expect(getByText('Confirm New Password')).toBeTruthy();
    expect(getByTestId('current-password-input')).toBeTruthy();
    expect(getByTestId('new-password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Update Password')).toBeTruthy();
  });

  it('calls goBack when back button or cancel button is pressed', () => {
    const { getByTestId, getByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('change-password-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Cancel'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(2);
  });

  it('shows error if fields are empty when submit is pressed', () => {
    const { getByTestId, getByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('change-password-submit-btn'));
    expect(getByText('Please enter your current password.')).toBeTruthy();
  });

  it('shows error if new password is too short', () => {
    const { getByTestId, getByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('current-password-input'), 'currentpass123');
    fireEvent.changeText(getByTestId('new-password-input'), '123');
    fireEvent.changeText(getByTestId('confirm-password-input'), '123');

    fireEvent.press(getByTestId('change-password-submit-btn'));
    expect(getByText('New password must be at least 6 characters.')).toBeTruthy();
  });

  it('successfully submits and shows success confirmation modal when valid passwords provided', async () => {
    const { getByTestId, getByText } = render(
      <ChangePasswordScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByTestId('current-password-input'), 'currentpass123');
    fireEvent.changeText(getByTestId('new-password-input'), 'securenewpass456');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'securenewpass456');

    fireEvent.press(getByTestId('change-password-submit-btn'));

    await waitFor(() => {
      expect(getByText('Password Updated! 🔐')).toBeTruthy();
    }, { timeout: 1500 });
  });
});
