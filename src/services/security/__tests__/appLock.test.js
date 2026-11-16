import * as Keychain from 'react-native-keychain';
import { authenticate, enableAppLock, disableAppLock, isAppLockSupported } from '../appLock';

describe('app lock service', () => {
  beforeEach(async () => {
    await disableAppLock();
    jest.clearAllMocks();
  });

  it('is supported when the phone has a screen lock', async () => {
    Keychain.isPasscodeAuthAvailable.mockResolvedValueOnce(true);
    expect(await isAppLockSupported()).toBe(true);
  });

  it('is not supported without a screen lock or biometrics', async () => {
    Keychain.isPasscodeAuthAvailable.mockResolvedValueOnce(false);
    Keychain.getSupportedBiometryType.mockResolvedValueOnce(null);
    expect(await isAppLockSupported()).toBe(false);
  });

  it('turns on only after the user passes the phone check once', async () => {
    expect(await enableAppLock()).toBe(true);
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'lock',
      '1',
      expect.objectContaining({ accessControl: 'BiometryAnyOrDevicePasscode' }),
    );
  });

  it('leaves the lock off when the check fails', async () => {
    Keychain.getGenericPassword.mockRejectedValueOnce(new Error('user canceled'));
    expect(await enableAppLock()).toBe(false);
    expect(Keychain.resetGenericPassword).toHaveBeenCalled();
  });

  it('authenticate resolves to false when the user cancels', async () => {
    await enableAppLock();
    Keychain.getGenericPassword.mockRejectedValueOnce(new Error('canceled'));
    expect(await authenticate()).toBe(false);
  });

  it('authenticate resolves to true when the phone releases the marker', async () => {
    await enableAppLock();
    expect(await authenticate()).toBe(true);
  });
});
