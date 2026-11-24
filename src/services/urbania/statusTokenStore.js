import * as Keychain from 'react-native-keychain';

const serviceFor = reference => `com.petfriendly.urbania.${reference}`;

export const saveStatusToken = async (reference, token) => {
  if (!reference || !token) {
    return false;
  }
  try {
    await Keychain.setGenericPassword(String(reference), String(token), {
      service: serviceFor(reference),
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const loadStatusToken = async reference => {
  try {
    const saved = await Keychain.getGenericPassword({ service: serviceFor(reference) });
    return saved ? saved.password : null;
  } catch (e) {
    return null;
  }
};
