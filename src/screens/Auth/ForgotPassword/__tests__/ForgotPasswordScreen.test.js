import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { ForgotPasswordScreen } from '../index';

jest.mock('../../../../hooks/useAuth', () => ({
  useForgotPassword: () => ({
    forgotPassword: jest.fn(),
    forgotPasswordAsync: jest.fn(),
    isPending: false,
    error: null,
    reset: jest.fn(),
  }),
}));

describe('ForgotPasswordScreen', () => {
  it('shows the reset form', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={{ navigate: jest.fn() }} />);
    expect(getByText('Reset your password')).toBeTruthy();
    expect(getByText('Send reset link')).toBeTruthy();
    expect(getByText('Back to login')).toBeTruthy();
  });

  it('keeps the form a phone-sized column on a wide screen (jest window is 750 wide)', () => {
    const { UNSAFE_getAllByProps } = render(
      <ForgotPasswordScreen navigation={{ navigate: jest.fn() }} />,
    );
    const paddings = UNSAFE_getAllByProps({ enableOnAndroid: true }).map(
      n => StyleSheet.flatten(n.props.contentContainerStyle)?.paddingHorizontal,
    );
    // (750 - 480) / 2 each side
    expect(paddings).toContain(135);
  });
});
