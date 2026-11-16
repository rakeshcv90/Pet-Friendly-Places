import { createMMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

export const storage = createMMKV();

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
  USER_INFO: 'USER_INFO',
  APP_SETTINGS: 'APP_SETTINGS',
  SELECTED_LOCATION: 'SELECTED_LOCATION',
  TAILS_GUIDE_SESSION_TOKEN: 'TAILS_GUIDE_SESSION_TOKEN',
  SAVED_TRIPS: 'SAVED_TRIPS',
  COMMUNITY_MEMBERSHIPS: 'COMMUNITY_MEMBERSHIPS',
  COMMUNITY_PENDING_REPLIES: 'COMMUNITY_PENDING_REPLIES',
  APP_LOCK_ENABLED: 'APP_LOCK_ENABLED',
  APP_LOCK_OFFERED: 'APP_LOCK_OFFERED',
  PERMISSIONS_OFFERED: 'PERMISSIONS_OFFERED',
};

// ── Secure storage ──────────────────────────────────────────────────────────────────────────
// The access and refresh tokens never go into MMKV (ordinary app storage). They live only in the
// iOS Keychain / Android Keystore, as one entry so both are always saved together. The OS API is
// async, so the tokens are held in memory while the app runs: reads stay synchronous, writes go to
// the Keychain in order straight away. `initSecureStorage()` must finish before anything reads the
// session (see index.js).
const SECURE_SERVICE = 'com.petfriendly.session';
const SECURE_KEYS = [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN];
const isSecureKey = key => SECURE_KEYS.includes(key);

let secureCache = {};
let writeChain = Promise.resolve(true);

// Writes the whole session to the Keychain. Writes are queued, so they land in call order.
// Resolves to whether this write succeeded; it never rejects.
const persistSecure = () => {
  const snapshot = { ...secureCache };
  writeChain = writeChain.then(async () => {
    try {
      if (Object.keys(snapshot).length === 0) {
        await Keychain.resetGenericPassword({ service: SECURE_SERVICE });
      } else {
        await Keychain.setGenericPassword('session', JSON.stringify(snapshot), {
          service: SECURE_SERVICE,
          // Not backed up, not synced to another device, readable once the phone was unlocked
          accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
        });
      }
      return true;
    } catch (e) {
      return false;
    }
  });
  return writeChain;
};

// Loads the saved session from the Keychain, and moves tokens an older version left in MMKV into it
export const initSecureStorage = async () => {
  try {
    const saved = await Keychain.getGenericPassword({ service: SECURE_SERVICE });
    secureCache = saved ? JSON.parse(saved.password) || {} : {};
  } catch (e) {
    secureCache = {};
  }

  const legacy = SECURE_KEYS.filter(key => storage.getString(key));
  if (legacy.length > 0) {
    legacy.forEach(key => {
      if (!secureCache[key]) {
        secureCache[key] = storage.getString(key);
      }
    });
    // Only delete the plain copies once the Keychain really has them
    if (await persistSecure()) {
      legacy.forEach(key => storage.remove(key));
    }
  }
};

// Saves both tokens in one Keychain write and waits for it. Use this when the tokens are rotated,
// so a refresh token that was just spent is never the one left on disk.
export const saveSecureTokens = (accessToken, refreshToken) => {
  secureCache[STORAGE_KEYS.ACCESS_TOKEN] = accessToken;
  if (refreshToken) {
    secureCache[STORAGE_KEYS.REFRESH_TOKEN] = refreshToken;
  }
  return persistSecure();
};

export const setItem = (key, value) => {
  if (isSecureKey(key)) {
    secureCache[key] = String(value);
    persistSecure();
    return;
  }
  if (typeof value === 'object') {
    storage.set(key, JSON.stringify(value));
  } else {
    storage.set(key, value);
  }
};

export const getItem = (key, isObject = false) => {
  if (isSecureKey(key)) {
    return secureCache[key];
  }
  if (isObject) {
    const jsonStr = storage.getString(key);
    if (jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  return storage.getString(key);
};

export const removeItem = key => {
  if (isSecureKey(key)) {
    delete secureCache[key];
    persistSecure();
    return;
  }
  storage.remove(key);
};

export const clearStorage = () => {
  storage.clearAll();
  secureCache = {};
  persistSecure();
};
