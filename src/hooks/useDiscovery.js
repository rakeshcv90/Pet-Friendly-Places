 
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
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

      if (data && typeof data === 'object') {
        setItem(DISCOVERY_CACHE_KEY, data);
      }

      return data;
    },
    placeholderData: () => getItem(DISCOVERY_CACHE_KEY, true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};

export const useRefreshHomeData = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['discovery', 'home'] });
};

const CITIES_CACHE_KEY = 'CACHED_DISCOVERY_CITIES';
const KNOWN_CITIES_CACHE_KEY = 'CACHED_KNOWN_CITIES';

export const useDiscoveryCities = (options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'knownCities'],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.USER?.REQUEST_CITY || '/cities/known';
      const data = await api.get(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        setItem(KNOWN_CITIES_CACHE_KEY, data);
      }
      return data;
    },
    placeholderData: () => getItem(KNOWN_CITIES_CACHE_KEY, true) || getItem(CITIES_CACHE_KEY, true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};

export const useKnownCities = useDiscoveryCities;

const ROAD_TRIPS_CACHE_KEY = 'CACHED_ROAD_TRIPS';

export const useRoadTrips = (options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'roadTrips'],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.USER?.ROAD_TRIP || '/routes?status=published';
      const data = await api.get(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        setItem(ROAD_TRIPS_CACHE_KEY, data);
      }
      return data;
    },
    placeholderData: () => getItem(ROAD_TRIPS_CACHE_KEY, true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};

export const useRoadTripDetail = (slug, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'roadTripDetail', slug],
    queryFn: async () => {
      if (!slug) {
        return null;
      }
      const data = await api.get(`/routes/${slug}`);
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

const TRAVEL_STORIES_CACHE_KEY = 'CACHED_TRAVEL_STORIES';

export const useTravelStories = (options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'travelStories'],
    queryFn: async () => {
      const endpoint = API_ENDPOINTS.USER?.TRAVEL_STORY || '/stories';
      const data = await api.get(endpoint);

      if (Array.isArray(data) && data.length > 0) {
        setItem(TRAVEL_STORIES_CACHE_KEY, data);
      }
      return data;
    },
    placeholderData: () => getItem(TRAVEL_STORIES_CACHE_KEY, true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};

export const useListingDetail = (slug, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'listingDetail', slug],
    queryFn: async () => {
      if (!slug) {
        return null;
      }
      const data = await api.get(`/listings/${slug}`);
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

const ARTICLES_CACHE_PREFIX = 'CACHED_ARTICLES_';

export const fetchArticles = async ({ category = null, limit = 100, offset = 0 } = {}) => {
  const base = API_ENDPOINTS.USER?.ARTICLES || '/articles';
  let endpoint = `${base}?limit=${limit}&offset=${offset}`;
  if (category && category !== 'all') {
    endpoint = `${base}?category=${encodeURIComponent(category)}&limit=${limit}&offset=${offset}`;
  }
  const data = await api.get(endpoint);
  return data;
};

export const useArticles = ({ category = null, limit = 100, offset = 0 } = {}, options = {}) => {
  const catKey = category && category !== 'all' ? category : 'all';
  const cacheKey = `${ARTICLES_CACHE_PREFIX}${catKey}_${limit}_${offset}`;
  return useQuery({
    queryKey: ['discovery', 'articles', catKey, limit, offset],
    queryFn: async () => {
      const data = await fetchArticles({ category, limit, offset });
      if (data && typeof data === 'object') {
        setItem(cacheKey, data);
      }
      return data;
    },
    placeholderData: () => getItem(cacheKey, true),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    ...options,
  });
};

export const fetchArticleDetail = async slug => {
  if (!slug) return null;
  const base = API_ENDPOINTS.USER?.ARTICLES || '/articles';
  const data = await api.get(`${base}/${encodeURIComponent(slug)}`);
  return data;
};

export const useArticleDetail = (slug, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'articleDetail', slug],
    queryFn: async () => {
      if (!slug) return null;
      const data = await fetchArticleDetail(slug);
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useInfiniteArticles = ({ category = null, limit = 100 } = {}, options = {}) => {
  const catKey = category && category !== 'all' ? category : 'all';
  return useInfiniteQuery({
    queryKey: ['discovery', 'infiniteArticles', catKey, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await fetchArticles({ category, limit, offset: pageParam });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, p) => acc + (Array.isArray(p?.articles) ? p.articles.length : 0),
        0,
      );
      const total = typeof lastPage?.total === 'number' ? lastPage.total : 0;
      if (loadedCount < total) {
        return loadedCount;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};
