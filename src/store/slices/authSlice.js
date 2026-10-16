import { getItem, removeItem, STORAGE_KEYS } from '../../services/storage/storage';

export const createAuthSlice = (set, get) => ({
  user: getItem(STORAGE_KEYS.USER_INFO, true) || null,
  token: getItem(STORAGE_KEYS.ACCESS_TOKEN) || null,
  isAuthenticated: !!getItem(STORAGE_KEYS.ACCESS_TOKEN),
  isLoading: false,
  error: null,

  setUser: user => set({ user }),

  logout: () => {
    removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeItem(STORAGE_KEYS.USER_INFO);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setAuthInfo: (user, token) => {
    set({ user, token, isAuthenticated: !!token });
  },
});
