import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../services/api/apiList';
import { getItem, setItem } from '../services/storage/storage';

const DISCOVERY_CACHE_KEY = 'CACHED_HOME_DISCOVERY';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const resolveImageUrl = (url, fallback = '') => {
  if (!url || typeof url !== 'string') {
    return fallback;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${cleanPath}`;
};

export const useHomeData = (options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'home'],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.USER?.HOME_DATA;

      const data = await api.get(endpoint);
      console.log('Home API Response:', endpoint, data);
      if (data && typeof data === 'object') {
        setItem(DISCOVERY_CACHE_KEY, data);
      }

      return data;
    },
    placeholderData: () => getItem(DISCOVERY_CACHE_KEY, true),
    staleTime: 0,
    ...options,
  });
};

export const useRefreshHomeData = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['discovery', 'home'] });
};

const CITIES_CACHE_KEY = 'CACHED_DISCOVERY_CITIES';

export const useDiscoveryCities = (options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'cities'],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.USER?.CITIES || '/discovery/cities';
      const data = await api.get(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        setItem(CITIES_CACHE_KEY, data);
      }
      return data;
    },
    placeholderData: () => getItem(CITIES_CACHE_KEY, true),
    staleTime: 60 * 1000,
    ...options,
  });
};
