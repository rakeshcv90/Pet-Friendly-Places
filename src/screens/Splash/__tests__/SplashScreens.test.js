import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import useWindowDimensions from 'react-native/Libraries/Utilities/useWindowDimensions';
import { SplashScreen } from '../index';
import { MainSplash } from '../MainSplash';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const screen = (width, height) =>
  useWindowDimensions.mockReturnValue({ width, height, scale: 2, fontScale: 1 });

const PHONE = [1080, 2400];
const FOLDABLE = [2076, 2152];

describe('Welcome screen (Get Started) on different screens', () => {
  const navigation = { replace: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('fills a normal phone without any side fill', () => {
    screen(...PHONE);
    const { queryByTestId, getByText } = render(<SplashScreen navigation={navigation} />);

    expect(queryByTestId('splash-side-fill')).toBeNull();
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('shows the whole picture on a foldable, with a colour gradient at the sides', () => {
    screen(...FOLDABLE);
    const { getByTestId } = render(<SplashScreen navigation={navigation} />);

    const fill = getByTestId('splash-side-fill');
    expect(fill.props.colors.length).toBeGreaterThan(1);
  });

  it("extends the picture's own edges across the sides on a foldable, so it looks full", () => {
    screen(...FOLDABLE);
    const { getByTestId } = render(<SplashScreen navigation={navigation} />);

    const [width] = FOLDABLE;
    for (const side of ['left', 'right']) {
      const strip = StyleSheet.flatten(getByTestId(`splash-edge-${side}`).props.style);
      // A thin slice of the picture is stretched out to the width of the side area
      expect(strip.width).toBe(3);
      const sideWidth = strip.transform[0].scaleX * 3;
      expect(sideWidth).toBeGreaterThan(100);
      expect(sideWidth).toBeLessThan(width / 2);
    }
    // Left strip starts at the screen edge; right strip starts where the picture ends
    const left = StyleSheet.flatten(getByTestId('splash-edge-left').props.style);
    const right = StyleSheet.flatten(getByTestId('splash-edge-right').props.style);
    expect(left.left).toBe(0);
    expect(right.left).toBeGreaterThan(width / 2);
    // Both sides are the same width, since the picture is centred
    expect(left.transform[0].scaleX).toBeCloseTo(right.transform[0].scaleX);
  });

  it('adds no edge strips on a phone or a tablet, where the picture fills the screen', () => {
    for (const size of [PHONE, [1600, 2560]]) {
      screen(...size);
      const { queryByTestId, unmount } = render(<SplashScreen navigation={navigation} />);
      expect(queryByTestId('splash-edge-left')).toBeNull();
      expect(queryByTestId('splash-edge-right')).toBeNull();
      unmount();
    }
  });

  it('uses the wider 2:3 picture on a tablet and the tall one on a phone', () => {
    const { theme } = require('../../../theme');
    const sourceOf = tree => tree.UNSAFE_getAllByType(require('../../../components/common/FastImage').default)
      .map(n => n.props.source);

    screen(...PHONE);
    const phone = sourceOf(render(<SplashScreen navigation={navigation} />));
    expect(phone).toContain(theme.images.splashBackground1);
    expect(phone).not.toContain(theme.images.splashTablet);

    screen(1600, 2560);
    const tablet = sourceOf(render(<SplashScreen navigation={navigation} />));
    expect(tablet).toContain(theme.images.splashTablet);
  });

  it('keeps the Get Started button a sensible size on a wide screen', () => {
    screen(...FOLDABLE);
    const { getByText } = render(<SplashScreen navigation={navigation} />);

    // The button is capped, not 80% of a 2076-wide screen
    let node = getByText('Get Started');
    let maxWidth;
    while (node && maxWidth === undefined) {
      maxWidth = StyleSheet.flatten(node.props.style)?.maxWidth;
      node = node.parent;
    }
    expect(maxWidth).toBe(380);
  });

  it('still goes on to onboarding when Get Started is pressed', () => {
    screen(...FOLDABLE);
    const { getByText } = render(<SplashScreen navigation={navigation} />);

    fireEvent.press(getByText('Get Started'));
    expect(navigation.replace).toHaveBeenCalledWith('Onboarding');
  });
});

describe('Splash video on different screens', () => {
  it('fills a normal phone', () => {
    screen(...PHONE);
    const { getByTestId } = render(<MainSplash onFinish={jest.fn()} />);
    expect(getByTestId('splash-video').props.resizeMode).toBe('cover');
  });

  it('shows the whole video on a foldable instead of cutting off the top and bottom', () => {
    screen(...FOLDABLE);
    const { getByTestId } = render(<MainSplash onFinish={jest.fn()} />);
    expect(getByTestId('splash-video').props.resizeMode).toBe('contain');
  });
});
