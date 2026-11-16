import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as RNP from 'react-native-permissions';
import { PermissionsSheet } from '../PermissionsSheet';

describe('PermissionsSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RNP.check.mockResolvedValue('denied');
    RNP.checkNotifications.mockResolvedValue({ status: 'denied' });
  });

  it('explains both permissions', async () => {
    const { findByText } = render(<PermissionsSheet visible onClose={jest.fn()} />);

    expect(await findByText('Location')).toBeTruthy();
    expect(await findByText('Notifications')).toBeTruthy();
  });

  it('asks for location, then notifications, when Allow is pressed', async () => {
    // The phone reports "denied" until the user has answered, then "granted"
    let answered = false;
    RNP.check.mockImplementation(async () => (answered ? 'granted' : 'denied'));
    RNP.checkNotifications.mockImplementation(async () => ({
      status: answered ? 'granted' : 'denied',
    }));
    RNP.request.mockResolvedValue('granted');
    RNP.requestNotifications.mockImplementation(async () => {
      answered = true;
      return { status: 'granted' };
    });
    const { getByTestId, findAllByText } = render(<PermissionsSheet visible onClose={jest.fn()} />);

    fireEvent.press(getByTestId('permissions-allow'));

    await waitFor(() => expect(RNP.request).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(RNP.requestNotifications).toHaveBeenCalledTimes(1));
    expect((await findAllByText('Allowed')).length).toBe(2);
  });

  it('closes on Maybe later without asking the phone', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<PermissionsSheet visible onClose={onClose} />);

    fireEvent.press(getByTestId('permissions-later'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(RNP.request).not.toHaveBeenCalled();
    expect(RNP.requestNotifications).not.toHaveBeenCalled();
  });

  it('sends a blocked permission to the phone settings', async () => {
    RNP.check.mockResolvedValue('blocked');
    const { findByText } = render(<PermissionsSheet visible onClose={jest.fn()} />);

    fireEvent.press(await findByText('Settings'));

    expect(RNP.openSettings).toHaveBeenCalled();
  });
});
