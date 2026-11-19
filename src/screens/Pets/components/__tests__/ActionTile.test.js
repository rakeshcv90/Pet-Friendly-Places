import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActionTile } from '../ActionTile';

const props = {
  testID: 'tile',
  label: 'Add photos',
  icon: 'cloud-upload-outline',
  colors: ['#EC4899', '#7C3AED'],
  depthColor: '#7E1D6B',
};

describe('ActionTile', () => {
  it('shows its label and is a button for screen readers', () => {
    const { getByText, getByLabelText } = render(<ActionTile {...props} onPress={jest.fn()} />);
    expect(getByText('Add photos')).toBeTruthy();
    expect(getByLabelText('Add photos').props.accessibilityRole).toBe('button');
  });

  it('calls onPress when tapped, including after a press in and out', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<ActionTile {...props} onPress={onPress} />);
    const tile = getByTestId('tile');

    fireEvent(tile, 'pressIn');
    fireEvent(tile, 'pressOut');
    fireEvent.press(tile);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('can float gently without changing what it shows', () => {
    const { getByText } = render(<ActionTile {...props} float onPress={jest.fn()} />);
    expect(getByText('Add photos')).toBeTruthy();
  });
});
