import { createAuthSlice } from '../authSlice';
import { removeItem, STORAGE_KEYS } from '../../../services/storage/storage';

jest.mock('../../../services/storage/storage', () => ({
  getItem: jest.fn(() => null),
  removeItem: jest.fn(),
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'ACCESS_TOKEN',
    REFRESH_TOKEN: 'REFRESH_TOKEN',
    USER_INFO: 'USER_INFO',
    SELECTED_LOCATION: 'SELECTED_LOCATION',
  },
}));

describe('authSlice', () => {
  let state;
  let set;
  let get;

  beforeEach(() => {
    jest.clearAllMocks();
    state = {};
    set = jest.fn(updater => {
      if (typeof updater === 'function') {
        state = { ...state, ...updater(state) };
      } else {
        state = { ...state, ...updater };
      }
    });
    get = jest.fn(() => ({
      ...state,
      setCurrentLocation: jest.fn(),
    }));
  });

  it('initializes with default unauthenticated state', () => {
    const slice = createAuthSlice(set, get);
    expect(slice.user).toBeNull();
    expect(slice.token).toBeNull();
    expect(slice.isAuthenticated).toBe(false);
  });

  it('updates auth info and isAuthenticated flag via setAuthInfo', () => {
    const slice = createAuthSlice(set, get);
    const mockUser = { id: 'usr_1', name: 'John Doe', city: 'Bengaluru' };
    const mockToken = 'mock-jwt-token';

    slice.setAuthInfo(mockUser, mockToken);

    expect(set).toHaveBeenCalledWith({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
    });
  });

  it('clears session and removes keys on logout', () => {
    const slice = createAuthSlice(set, get);

    slice.logout();

    expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.ACCESS_TOKEN);
    expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.REFRESH_TOKEN);
    expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_INFO);
    expect(removeItem).toHaveBeenCalledWith(STORAGE_KEYS.SELECTED_LOCATION);

    expect(set).toHaveBeenCalledWith({
      user: null,
      token: null,
      isAuthenticated: false,
      currentLocation: null,
    });
  });
});
