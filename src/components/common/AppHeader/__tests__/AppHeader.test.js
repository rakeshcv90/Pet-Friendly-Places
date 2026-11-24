import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { AppHeader } from '../index';

jest.mock('../../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Rishab' } } }),
}));

jest.mock('../../../notifications/NotificationBell', () => ({
  NotificationBell: () => null,
}));

jest.mock('../../CityPickerModal', () => ({
  CityPickerModal: () => null,
}));

describe('AppHeader paw badge', () => {
  it('draws the badge from a rounded, clipping view, not only from the gradient', () => {
    const { getByTestId } = render(<AppHeader title="Where to?" showSearch={false} />);

    const badge = StyleSheet.flatten(getByTestId('app-header-avatar').props.style);
    expect(badge.borderRadius).toBeGreaterThan(0);
    expect(badge.width).toBe(badge.height);

    const clip = StyleSheet.flatten(getByTestId('app-header-avatar').children[0].props.style);
    expect(clip.overflow).toBe('hidden');
    expect(clip.borderRadius).toBe(badge.borderRadius);
  });

  it('opens the avatar action when the badge is pressed', () => {
    const onAvatarPress = jest.fn();
    const { getByTestId } = render(
      <AppHeader title="Where to?" showSearch={false} onAvatarPress={onAvatarPress} />,
    );

    fireEvent.press(getByTestId('app-header-avatar'));
    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });

  it('shows a custom avatar instead of the paw badge when one is given', () => {
    const { queryByTestId } = render(
      <AppHeader title="Back" showSearch={false} avatarComponent={<></>} />,
    );
    expect(queryByTestId('app-header-avatar')).toBeNull();
  });
});

describe('AppHeader title and tagline', () => {
  it('shows the title and the tagline, with no greeting or location row', () => {
    const { getByTestId, queryByText, queryByTestId } = render(<AppHeader showSearch={false} />);

    expect(getByTestId('app-header-title').props.children).toBe('Pet Friendly Places');
    expect(getByTestId('app-header-tagline')).toBeTruthy();
    expect(getByTestId('app-header-paws')).toBeTruthy();
    expect(queryByText(/GOOD (MORNING|AFTERNOON|EVENING|NIGHT)/)).toBeNull();
    expect(queryByText('Change')).toBeNull();
    expect(queryByTestId('app-header-greeting')).toBeNull();
  });

  it('writes the tagline in two colours, split after the comma', () => {
    const { getByText } = render(<AppHeader showSearch={false} />);

    expect(getByText('Explore karo,')).toBeTruthy();
    expect(getByText(' Sath Travel Karo!')).toBeTruthy();
  });

  it('fits the tagline on one line, and animates the paw prints', () => {
    const { getByTestId } = render(<AppHeader showSearch={false} />);

    const tagline = getByTestId('app-header-tagline');
    expect(tagline.props.numberOfLines).toBe(1);
    expect(tagline.props.adjustsFontSizeToFit).toBe(true);
    [0, 1, 2].forEach(index => {
      const paw = StyleSheet.flatten(getByTestId(`app-header-paw-${index}`).props.style);
      expect(paw.opacity).toBeDefined();
      expect(paw.transform.some(item => item.scale !== undefined)).toBe(true);
    });
  });

  it('takes another tagline', () => {
    const { getByText } = render(<AppHeader showSearch={false} tagline="Go far, stay close" />);

    expect(getByText('Go far,')).toBeTruthy();
  });

  it('can still show the city row when asked to', () => {
    const { getByText, queryByTestId } = render(<AppHeader showSearch={false} showLocation />);

    expect(getByText('Change')).toBeTruthy();
    expect(queryByTestId('app-header-tagline')).toBeNull();
  });
});
