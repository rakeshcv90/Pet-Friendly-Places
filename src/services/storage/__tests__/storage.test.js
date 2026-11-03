import {
  setItem,
  getItem,
  removeItem,
  clearStorage,
  STORAGE_KEYS,
  storage,
} from '../storage';

describe('storage service', () => {
  beforeEach(() => {
    clearStorage();
    jest.clearAllMocks();
  });

  it('stores and retrieves string values', () => {
    setItem(STORAGE_KEYS.ACCESS_TOKEN, 'test_token_123');
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN, 'test_token_123');

    const result = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    expect(result).toBe('test_token_123');
  });

  it('serializes objects on setItem and deserializes with isObject=true', () => {
    const user = { id: 'u1', name: 'Buddy Owner', role: 'admin' };
    setItem(STORAGE_KEYS.USER_INFO, user);

    expect(storage.set).toHaveBeenCalledWith(
      STORAGE_KEYS.USER_INFO,
      JSON.stringify(user)
    );

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
});
