import * as RNP from 'react-native-permissions';
import {
  getPermissionStatuses,
  requestLocation,
  requestNotificationPermission,
  openPhoneSettings,
} from '../permissions';

describe('permissions service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reports location and notifications in one shared vocabulary', async () => {
    RNP.check.mockResolvedValueOnce('limited');
    RNP.checkNotifications.mockResolvedValueOnce({ status: 'blocked' });

    expect(await getPermissionStatuses()).toEqual({
      location: 'granted',
      notifications: 'blocked',
    });
  });

  it('treats a first-time or once-refused permission as denied', async () => {
    RNP.check.mockResolvedValueOnce('denied');
    RNP.checkNotifications.mockResolvedValueOnce({ status: 'denied' });

    expect(await getPermissionStatuses()).toEqual({ location: 'denied', notifications: 'denied' });
  });

  it('asks the phone and returns the answer', async () => {
    RNP.request.mockResolvedValueOnce('granted');
    RNP.requestNotifications.mockResolvedValueOnce({ status: 'blocked' });

    expect(await requestLocation()).toBe('granted');
    expect(await requestNotificationPermission()).toBe('blocked');
    expect(RNP.requestNotifications).toHaveBeenCalledWith(['alert', 'sound', 'badge']);
  });

  it('never throws when the phone cannot answer', async () => {
    RNP.request.mockRejectedValueOnce(new Error('boom'));

    expect(await requestLocation()).toBe('unavailable');
  });

  it('opens the phone settings', async () => {
    await openPhoneSettings();
    expect(RNP.openSettings).toHaveBeenCalled();
  });
});
