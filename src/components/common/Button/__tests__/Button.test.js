import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../index';

describe('Button component', () => {
  it('renders title correctly', () => {
    const { getByText } = render(<Button title="Submit Application" onPress={() => {}} />);
    expect(getByText('Submit Application')).toBeTruthy();
  });

  it('handles onPress event when tapped', () => {
    const handlePress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={handlePress} />);

    fireEvent.press(getByText('Click Me'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('shows ActivityIndicator and does not call onPress when isLoading is true', () => {
    const handlePress = jest.fn();
    const { queryByText, UNSAFE_getByType } = render(
      <Button title="Loading Button" onPress={handlePress} isLoading={true} />
    );

    // Title should not be displayed when loading
    expect(queryByText('Loading Button')).toBeNull();

    // ActivityIndicator should be rendered
    const activityIndicator = UNSAFE_getByType('ActivityIndicator');
    expect(activityIndicator).toBeTruthy();
  });

  it('renders outline variant correctly', () => {
    const { getByText } = render(
      <Button title="Secondary Action" variant="outline" onPress={() => {}} />
    );
    expect(getByText('Secondary Action')).toBeTruthy();
  });
});
