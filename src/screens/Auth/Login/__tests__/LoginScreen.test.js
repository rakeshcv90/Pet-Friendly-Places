import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../index';

jest.mock('../../../../hooks/useAuth', () => ({
  useLogin: () => ({ login: jest.fn(), isPending: false, error: null, reset: jest.fn() }),
}));

describe('LoginScreen', () => {
  const navigation = { navigate: jest.fn() };

  it('shows the form and links to Register and Forgot password', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();

    fireEvent.press(getByText('Sign Up'));
    expect(navigation.navigate).toHaveBeenCalledWith('Register');
    fireEvent.press(getByText('Forgot password?'));
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('keeps the form in a column no wider than a large phone, centred (for tablets)', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    let node = getByText('Welcome back');
    let column = null;
    while (node && !column) {
      const style = StyleSheet.flatten(node.props.style) || {};
      if (style.maxWidth) {
        column = style;
      }
      node = node.parent;
    }
    expect(column).toBeTruthy();
    expect(column.maxWidth).toBeLessThanOrEqual(520);
    expect(column.alignSelf).toBe('center');
  });

  it('shows a validation message for an empty login', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    fireEvent.press(getByText('Login'));
    expect(getByText('Please enter your email or phone number')).toBeTruthy();
  });
});
