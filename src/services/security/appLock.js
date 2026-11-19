import * as Keychain from 'react-native-keychain';

// The app lock asks the phone to verify the user (fingerprint, face, or the screen PIN, pattern or
// password). It works by storing a small marker in the Keychain / Keystore that the OS will only
// release after that check, so the check itself is done by the phone, not by the app.
const LOCK_SERVICE = 'com.petfriendly.applock';
const ACCESS_CONTROL = Keychain.ACCESS_CONTROL?.BIOMETRY_ANY_OR_DEVICE_PASSCODE;

const PROMPT = {
  title: 'Unlock PetFriendly',
  subtitle: 'Use your fingerprint, face or phone lock',
  cancel: 'Cancel',
};

// True when the phone has a screen lock or biometrics set up. Without one the lock cannot work.
export const isAppLockSupported = async () => {
  try {
    const [passcode, biometry] = await Promise.all([
      Keychain.isPasscodeAuthAvailable?.() ?? false,
      Keychain.getSupportedBiometryType?.() ?? null,
    ]);
    return !!passcode || !!biometry;
  } catch (e) {
    return false;
  }
};

// Shows the phone's own unlock prompt. Resolves to true only when the user passed it.
export const authenticate = async () => {
  try {
    const result = await Keychain.getGenericPassword({
      service: LOCK_SERVICE,
      accessControl: ACCESS_CONTROL,
      authenticationPrompt: PROMPT,
    });
    return !!result;
  } catch (e) {
    return false;
  }
};

// Turns the lock on. The user must pass the phone's check once, so a lock that could never be
// opened is never switched on. Resolves to whether it is now on.
export const enableAppLock = async () => {
  try {
    await Keychain.setGenericPassword('lock', '1', {
      service: LOCK_SERVICE,
      accessControl: ACCESS_CONTROL,
      accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      authenticationPrompt: PROMPT,
    });
    if (await authenticate()) {
      return true;
    }
  } catch (e) {
    // fall through to cleanup
  }
  await disableAppLock();
  return false;
};

export const disableAppLock = async () => {
  try {
    await Keychain.resetGenericPassword({ service: LOCK_SERVICE });
  } catch (e) {
    // nothing to remove
  }
};
