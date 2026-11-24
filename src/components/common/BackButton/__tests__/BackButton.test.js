import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BackButton } from '../index';

describe('BackButton', () => {
  it('goes back when pressed', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<BackButton onPress={onPress} />);
    fireEvent.press(getByLabelText('Back'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('passes the testID to the button', () => {
    const { getByTestId } = render(<BackButton testID="back" onPress={() => {}} />);
    expect(getByTestId('back')).toBeTruthy();
  });
});
