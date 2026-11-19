import * as Keychain from 'react-native-keychain';
import {
  setItem,
  getItem,
  removeItem,
  clearStorage,
  initSecureStorage,
  saveSecureTokens,
  STORAGE_KEYS,
  storage,
} from '../storage';

const SESSION = { service: 'com.petfriendly.session' };

describe('storage service', () => {
  beforeEach(() => {
    clearStorage();
    jest.clearAllMocks();
  });

  it('stores and retrieves string values', () => {
    setItem(STORAGE_KEYS.SELECTED_LOCATION, 'Bengaluru');
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.SELECTED_LOCATION, 'Bengaluru');

    const result = getItem(STORAGE_KEYS.SELECTED_LOCATION);
    expect(result).toBe('Bengaluru');
  });

  it('serializes objects on setItem and deserializes with isObject=true', () => {
    const user = { id: 'u1', name: 'Buddy Owner', role: 'admin' };
    setItem(STORAGE_KEYS.USER_INFO, user);

    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO, JSON.stringify(user));

    const retrieved = getItem(STORAGE_KEYS.USER_INFO, true);
    expect(retrieved).toEqual(user);
  });

  it('returns null when parsing invalid JSON with isObject=true', () => {
    storage.getString.mockReturnValueOnce('invalid_json_string{');
    const result = getItem(STORAGE_KEYS.USER_INFO, true);
    expect(result).toBeNull();
  });

  it('removes item using removeItem', () => {
    setItem('TEST_KEY', 'some_value');
    removeItem('TEST_KEY');
    expect(storage.remove).toHaveBeenCalledWith('TEST_KEY');
  });

  it('clears storage completely on clearStorage', () => {
    clearStorage();
    expect(storage.clearAll).toHaveBeenCalled();
  });

  describe('secure session', () => {
    beforeEach(async () => {
      await Keychain.resetGenericPassword(SESSION);
      jest.clearAllMocks();
    });

    it('keeps the tokens out of MMKV and in the Keychain', async () => {
      setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-1');
      setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-1');
      await saveSecureTokens('access-1', 'refresh-1');

      expect(getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-1');
      expect(storage.set).not.toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, expect.anything());
      expect(storage.set).not.toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN, expect.anything());

      const saved = await Keychain.getGenericPassword(SESSION);
      expect(JSON.parse(saved.password)).toEqual({
        ACCESS_TOKEN: 'access-1',
        REFRESH_TOKEN: 'refresh-1',
      });
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'session',
        expect.any(String),
        expect.objectContaining({ accessible: 'AccessibleAfterFirstUnlockThisDeviceOnly' }),
      );
    });

    it('saves a rotated pair of tokens in a single write', async () => {
      await saveSecureTokens('new-access', 'new-refresh');

      expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1);
      expect(getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh');
    });

    it('loads the session from the Keychain on start', async () => {
      await Keychain.setGenericPassword(
        'session',
        JSON.stringify({ ACCESS_TOKEN: 'a', REFRESH_TOKEN: 'r' }),
        SESSION,
      );
      removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      // An app that was launched before (not a fresh install) already has its install marker
      storage.set(STORAGE_KEYS.INSTALL_MARKER, '1');

      await initSecureStorage();

      expect(getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('a');
      expect(getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('r');
    });

    it('drops a session left in the Keychain by a deleted app (fresh install)', async () => {
      // Deleting the app wipes MMKV but not the Keychain
      storage.clearAll();
      await Keychain.setGenericPassword(
        'session',
        JSON.stringify({ ACCESS_TOKEN: 'old-a', REFRESH_TOKEN: 'old-r' }),
        SESSION,
      );

      await initSecureStorage();

      expect(getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeUndefined();
      expect(getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeUndefined();
      expect(await Keychain.getGenericPassword(SESSION)).toBe(false);
      // The next launch is a normal one and keeps whatever was saved since
      expect(storage.getString(STORAGE_KEYS.INSTALL_MARKER)).toBe('1');
    });

    it('keeps the session when an app that has data is simply updated', async () => {
      storage.clearAll();
      storage.set(STORAGE_KEYS.SELECTED_LOCATION, 'Delhi');
      await Keychain.setGenericPassword(
        'session',
        JSON.stringify({ ACCESS_TOKEN: 'a', REFRESH_TOKEN: 'r' }),
        SESSION,
      );

      await initSecureStorage();

      expect(getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('a');
    });

    it('moves tokens an older version left in MMKV into the Keychain', async () => {
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, 'legacy-access');
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'legacy-refresh');
      await Keychain.resetGenericPassword(SESSION);

      await initSecureStorage();

      expect(getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('legacy-access');
      expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
      expect(storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
      const saved = await Keychain.getGenericPassword(SESSION);
      expect(JSON.parse(saved.password).REFRESH_TOKEN).toBe('legacy-refresh');
    });

    it('clears the Keychain when the last token is removed', async () => {
      await saveSecureTokens('a', 'r');
      removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      removeItem(STORAGE_KEYS.REFRESH_TOKEN);

      await new Promise(resolve => setImmediate(resolve));
      expect(await Keychain.getGenericPassword(SESSION)).toBe(false);
    });
  });
});
