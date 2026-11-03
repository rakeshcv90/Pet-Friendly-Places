import { createMMKV } from 'react-native-mmkv';

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
};

export const setItem = (key, value) => {
  if (typeof value === 'object') {
    storage.set(key, JSON.stringify(value));
  } else {
    storage.set(key, value);
  }
};

export const getItem = (key, isObject = false) => {
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
  storage.remove(key);
};

export const clearStorage = () => {
  storage.clearAll();
};
