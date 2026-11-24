import React from 'react';
import { Animated } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

import { MainTabNavigator } from '../MainTabNavigator';

// Each tab shows a tiny stand-in screen: only the tab bar is under test here
jest.mock('../../screens/Home', () => {
  const { Text: T } = require('react-native');
  return { HomeScreen: () => <T>home screen</T> };
});
jest.mock('../../screens/Explore', () => {
  const { Text: T } = require('react-native');
  return { ExploreScreen: () => <T>explore screen</T> };
});
jest.mock('../../screens/Profile', () => {
  const { Text: T } = require('react-native');
  return { ProfileScreen: () => <T>profile screen</T> };
});
jest.mock('../../screens/StoryGuides', () => {
  const { Text: T } = require('react-native');
  return { StoryGuidesScreen: () => <T>story screen</T> };
});
jest.mock('../../screens/Saved', () => {
  const { Text: T } = require('react-native');
  return { SavedScreen: () => <T>community screen</T> };
});

const setup = () =>
  render(
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>,
  );

describe('MainTabNavigator bottom tab animations', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows all five tab labels', () => {
    const { getByText } = setup();

    ['Home', 'Story & Guides', 'Explore', 'Community', 'Profile'].forEach(label => {
      expect(getByText(label)).toBeTruthy();
    });
  });

  it('has a halo ring behind each icon and a glow behind Explore', () => {
    const { getByTestId } = setup();

    ['Home', 'Story & Guides', 'Community', 'Profile'].forEach(name => {
      expect(getByTestId(`tab-halo-${name}`)).toBeTruthy();
    });
    expect(getByTestId('tab-halo-Explore')).toBeTruthy();
    expect(getByTestId('tab-explore-glow')).toBeTruthy();
  });

  it('keeps every halo invisible while at rest', () => {
    const { getByTestId } = setup();

    ['Home', 'Story & Guides', 'Community', 'Profile', 'Explore'].forEach(name => {
      const merged = Object.assign({}, ...[].concat(getByTestId(`tab-halo-${name}`).props.style).flat());
      expect(merged.opacity).toBe(0);
    });
  });

  it('does not play the icon spring on first paint', () => {
    const spring = jest.spyOn(Animated, 'spring');
    setup();

    // Press-in springs only happen on touch; nothing should spring just from mounting
    expect(spring).not.toHaveBeenCalled();
    spring.mockRestore();
  });

  it('switches tab and springs the icon of the tab that was pressed', () => {
    const { getByText, queryByText } = setup();
    expect(getByText('home screen')).toBeTruthy();

    const spring = jest.spyOn(Animated, 'spring');
    fireEvent.press(getByText('Profile'));
    act(() => {
      jest.advanceTimersByTime(80);
    });

    expect(getByText('profile screen')).toBeTruthy();
    expect(queryByText('explore screen')).toBeNull();
    // One spring for the icon pop of the newly selected tab
    expect(spring).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, friction: 6, useNativeDriver: true }),
    );
    spring.mockRestore();
  });

  it('bursts the halo ring on the newly selected tab', () => {
    const timing = jest.spyOn(Animated, 'timing');
    const { getByText } = setup();
    const before = timing.mock.calls.filter(([, cfg]) => cfg.duration === 560).length;

    fireEvent.press(getByText('Community'));
    act(() => {
      jest.advanceTimersByTime(80);
    });

    const after = timing.mock.calls.filter(([, cfg]) => cfg.duration === 560).length;
    expect(before).toBe(0);
    expect(after).toBe(1);
    timing.mockRestore();
  });

  it('keeps the Explore button working with its animations', () => {
    const { getByText } = setup();

    fireEvent.press(getByText('Explore'));
    act(() => {
      jest.advanceTimersByTime(80);
    });

    expect(getByText('explore screen')).toBeTruthy();
  });

  it('can be unmounted without leaving the glow loop running', () => {
    const { unmount } = setup();

    expect(() => {
      unmount();
      act(() => {
        jest.advanceTimersByTime(3000);
      });
    }).not.toThrow();
  });
});
