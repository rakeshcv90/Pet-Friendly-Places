import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BackPill } from '../index';

describe('BackPill', () => {
  it('shows the label with a back chevron and goes back when the pill is pressed', () => {
    const onPress = jest.fn();
    const { getByText, getByLabelText } = render(<BackPill label="🐾 Tails Community" onPress={onPress} />);

    expect(getByText('🐾 Tails Community')).toBeTruthy();
    fireEvent.press(getByLabelText('Back'));
    // The label is part of the button, not only the round chevron
    fireEvent.press(getByText('🐾 Tails Community'));
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('defaults the label to Back and passes the testID to the button', () => {
    const { getByText, getByTestId } = render(<BackPill testID="back" onPress={() => {}} />);
    expect(getByText('🐾 Back')).toBeTruthy();
    expect(getByTestId('back')).toBeTruthy();
  });
});
