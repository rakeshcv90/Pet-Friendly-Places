import { setItem, removeItem, STORAGE_KEYS } from '../../services/storage/storage';
import { authApi } from '../../services/api/authApi';

export const createAuthSlice = (set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Mocking API call for now since we don't have a real backend
      // const response = await authApi.login(email, password);
      // const { user, token } = response.data;
      
      const token = 'mock_token_123';
      const user = { id: '1', name: 'Test User', email };
      
      setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      setItem(STORAGE_KEYS.USER_INFO, user);
      
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error.message || 'Login failed', isLoading: false });
    }
  },

  logout: () => {
    removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeItem(STORAGE_KEYS.USER_INFO);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setAuthInfo: (user, token) => {
    set({ user, token, isAuthenticated: !!token });
  },
});
