import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { RegisterScreen } from '../index';

jest.mock('../../../../hooks/useAuth', () => ({
  useRegister: () => ({
    registerAsync: jest.fn(),
    isPending: false,
    error: null,
    reset: jest.fn(),
  }),
}));

describe('RegisterScreen', () => {
  it('shows the first step and the background', () => {
    const { getByText, getByTestId } = render(
      <RegisterScreen navigation={{ navigate: jest.fn() }} />,
    );
    expect(getByText('Create your account')).toBeTruthy();
    expect(getByText('Already have an account?')).toBeTruthy();
    expect(getByTestId('register-background')).toBeTruthy();
  });

  it('keeps the form a phone-sized column on a wide screen (jest window is 750 wide)', () => {
    const { UNSAFE_getAllByProps } = render(
      <RegisterScreen navigation={{ navigate: jest.fn() }} />,
    );
    const paddings = UNSAFE_getAllByProps({ enableOnAndroid: true }).map(
      n => StyleSheet.flatten(n.props.contentContainerStyle)?.paddingHorizontal,
    );
    expect(paddings).toContain(135);
  });
});
