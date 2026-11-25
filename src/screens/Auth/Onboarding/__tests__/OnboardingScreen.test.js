import React from 'react';
import { render } from '@testing-library/react-native';
import { OnboardingScreen } from '../index';

// Jest's default window is 750 wide, which counts as a wide screen (a tablet)
describe('OnboardingScreen on a wide screen', () => {
  it('shows the title on one flowing line and a Next button', () => {
    const { getByText } = render(<OnboardingScreen navigation={{ replace: jest.fn() }} />);
    expect(getByText('Discover Pet-Friendly Places Across India')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
  });
});
