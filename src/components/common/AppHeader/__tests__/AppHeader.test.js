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
