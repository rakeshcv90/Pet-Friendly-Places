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

      const account = data?.account || data?.user || (data?.id ? data : null);
      const pets = data?.pets || data?.account?.pets || [];

      if (account) {
        setItem(STORAGE_KEYS.USER_INFO, account);
      }

      if (account) {
        useStore.getState().setUser(account);
        const apiLocation = account?.location || account?.city;
        const savedLocation = getItem(STORAGE_KEYS.SELECTED_LOCATION);
        if (apiLocation && !savedLocation) {
          useStore.getState().setCurrentLocation(apiLocation);
        }
      }
      if (pets && Array.isArray(pets)) {
        useStore.getState().setPets(pets);
      }

      return data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useRefreshProfile = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
};
