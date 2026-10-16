import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { useStore } from '../store';
import { getItem, setItem, STORAGE_KEYS } from '../services/storage/storage';

export const useUserProfile = (options = {}) => {
  const token = useStore(state => state.token) || getItem(STORAGE_KEYS.ACCESS_TOKEN);

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.USER.PROFILE);

      const account = data?.account || data?.user || null;
      const pets = data?.pets || [];

      // 1. Persist to MMKV for offline / instant startup
      if (account) {
        setItem(STORAGE_KEYS.USER_INFO, account);
      }

      // 2. Synchronize to global Zustand store for app-wide reactivity
      if (account) {
        useStore.getState().setUser(account);
      }
      if (pets && Array.isArray(pets)) {
        useStore.getState().setPets(pets);
      }

      return data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
    ...options,
  });
};

/**
 * Hook to manually trigger or update user profile
 */
export const useRefreshProfile = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
};
