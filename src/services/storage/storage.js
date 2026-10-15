import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'ACCESS_TOKEN',
  USER_INFO: 'USER_INFO',
  APP_SETTINGS: 'APP_SETTINGS',
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
