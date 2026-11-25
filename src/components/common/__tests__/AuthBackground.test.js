import React from 'react';
import { render } from '@testing-library/react-native';
import useWindowDimensions from 'react-native/Libraries/Utilities/useWindowDimensions';
import { AuthBackground, getBackgroundLayout, SPLIT_CROP_RATIO } from '../AuthBackground';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// background2.webp is 863 x 1823
const W = 863;
const H = 1823;

describe('getBackgroundLayout', () => {
  it('fills a phone with one picture', () => {
    const layout = getBackgroundLayout(W, H, 393, 852);
    expect(layout.split).toBe(false);
    expect(layout.height).toBeGreaterThanOrEqual(852 - 1e-6);
    expect(layout.width).toBeGreaterThanOrEqual(393 - 1e-6);
  });

  it('splits into two halves on a tablet, where one picture would lose its top or bottom', () => {
    const layout = getBackgroundLayout(W, H, 600, 960);
    expect(layout.split).toBe(true);
    expect(layout.width).toBeCloseTo(600);
    expect(layout.height / 960).toBeGreaterThan(SPLIT_CROP_RATIO);
  });

  it('always covers the whole screen width', () => {
    for (const [sw, sh] of [[393, 852], [600, 960], [800, 1280], [1000, 1000]]) {
      const layout = getBackgroundLayout(W, H, sw, sh);
      expect(layout.left).toBeLessThanOrEqual(1e-6);
      expect(layout.left + layout.width).toBeGreaterThanOrEqual(sw - 1e-6);
      expect(layout.height).toBeGreaterThanOrEqual(sh - 1e-6);
    }
  });
});

describe('AuthBackground', () => {
  const props = { source: 1, imageWidth: W, imageHeight: H, testID: 'bg' };

  it('renders a single picture on a phone', () => {
    useWindowDimensions.mockReturnValue({ width: 393, height: 852 });
    const { getByTestId, queryByTestId } = render(<AuthBackground {...props} />);
    expect(getByTestId('bg')).toBeTruthy();
    expect(queryByTestId('bg-top')).toBeNull();
  });

  it('renders the top and the bottom of the picture on a tablet', () => {
    useWindowDimensions.mockReturnValue({ width: 600, height: 960 });
    const { getByTestId } = render(<AuthBackground {...props} />);
    expect(getByTestId('bg-top')).toBeTruthy();
    expect(getByTestId('bg-bottom')).toBeTruthy();
  });
});
