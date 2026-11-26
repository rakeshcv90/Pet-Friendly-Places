import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../services/api/apiList';
import { getItem, setItem } from '../services/storage/storage';
import { logListing } from '../utils/listingDebug';

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

// Display metadata for mode_hub pages; the list endpoint has no emoji/colour/verdict text.
const TRANSPORT_MODE_META = {
  conditional: {
    verdict: 'partial',
    verdict_text: 'Allowed with conditions',
    verdict_color: '#B45309',
  },
  allowed: { verdict: 'allowed', verdict_text: 'Allowed', verdict_color: '#047857' },
  not_allowed: { verdict: 'not_allowed', verdict_text: 'Not allowed', verdict_color: '#B91C1C' },
};
const TRANSPORT_MODE_EMOJI = {
  train: '🚆',
  taxi: '🚕',
  flight: '✈️',
  metro: '🚇',
  bus: '🚌',
  auto: '🛺',
};

// Builds the hub the Transport screen renders from the plain `/transport` pages, used when the
// backend does not send `hub_content` for the `transport-hub` page.
const buildTransportHubFromPages = (hubPage, pages) => {
  const modeCards = pages
    .filter(page => page.page_type === 'mode_hub')
    .map(page => {
      const meta = TRANSPORT_MODE_META[page.pet_verdict] || TRANSPORT_MODE_META.conditional;
      return {
        // slug (e.g. "trains") is what /transport/mode/:mode expects
        mode: page.slug,
        label: page.title,
        emoji: TRANSPORT_MODE_EMOJI[page.transport_mode] || '🐾',
        insight: page.excerpt,
        ...meta,
      };
    });

  return {
    eyebrow: 'Transport guide',
    hero_title_prefix: hubPage.title,
    hero_title_highlight: '',
    hero_description: hubPage.excerpt,
    section_title: 'Choose how you are travelling',
    section_description: null,
    mode_cards: modeCards,
    trust_banner: null,
    journey_testers: [],
  };
};

// Hub content for the Transport screen: the `transport-hub` page's hub_content (mode cards etc.)
export const useTransportHub = (options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'transportHub'],
    queryFn: async () => {
      const pages = await api.get(API_ENDPOINTS.TRANSPORT.LIST);
      const list = Array.isArray(pages) ? pages : pages?.data ?? pages?.results ?? [];
      const hubPage = list.find(page => page.slug === 'transport-hub');

      if (!hubPage) {
        return null;
      }
      return hubPage.hub_content ?? buildTransportHubFromPages(hubPage, list);
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// Detail for one mode ({ hub, vehicles }). Modes without a guide yet (e.g. bus, auto) return 404,
// which resolves to null so the screen can fall back to the card content.
export const useTransportMode = (mode, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'transportMode', mode],
    queryFn: async () => {
      try {
        return await api.get(`${API_ENDPOINTS.TRANSPORT.MODE}/${mode}`);
      } catch (error) {
        if (error?.response?.status === 404 || error?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!mode,
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

// One travel story with its full content: GET /stories/{slug}
export const useTravelStory = (slug, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'travelStory', slug],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.USER.TRAVEL_STORY_DETAIL(slug));
      // The API may wrap the story as { story } or { data }
      return data?.story || data?.data || data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const LISTING_TIMEOUT_MS = 60000;

export const useListingDetail = (slug, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'listingDetail', slug],
    queryFn: async () => {
      if (!slug) {
        return null;
      }
      logListing(`GET ${API_BASE_URL}/listings/${slug}`);
      // A place with many photos can take the server 20 seconds or more to answer, longer than the
      // app's usual 15 seconds, which used to end on "Listing not found". Wait longer for this one.
      const data = await api.get(`/listings/${slug}`, { timeout: LISTING_TIMEOUT_MS });
      return data;
    },
    enabled: !!slug,
    // One retry only: with the longer timeout, the app's usual two retries could leave someone
    // waiting minutes
    retry: 1,
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

// Paginated listings for one category: GET /listings?category=<type>&page_size=18&page=<n>
// Response: { items, total, page, page_size }
export const LISTINGS_PAGE_SIZE = 18;

export const useInfiniteListings = (
  { category, filters = {}, pageSize = LISTINGS_PAGE_SIZE } = {},
  options = {},
) => {
  return useInfiniteQuery({
    // `filters` are API query params (state, city, pet_friendliness, ...); empty values are dropped
    queryKey: ['discovery', 'categoryListings', category, pageSize, filters],
    queryFn: async ({ pageParam = 1 }) => {
      return api.get(API_ENDPOINTS.LISTINGS.LIST, {
        params: { ...filters, category, page_size: pageSize, page: pageParam },
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (count, page) => count + (Array.isArray(page?.items) ? page.items.length : 0),
        0,
      );
      const total = typeof lastPage?.total === 'number' ? lastPage.total : 0;
      return loaded < total ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// Total number of listings matching a category + filters (one-item page), for the filter count
export const useListingCount = ({ category, filters = {} } = {}, options = {}) => {
  return useQuery({
    queryKey: ['discovery', 'listingCount', category, filters],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.LISTINGS.LIST, {
        params: { ...filters, category, page_size: 1, page: 1 },
      });
      return typeof res?.total === 'number' ? res.total : 0;
    },
    placeholderData: previous => previous,
    staleTime: 1000 * 60 * 2,
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

/* ── City hub (CityDetail screen) ── */

const CITY_LISTINGS_PAGE_SIZE = 250;
const CITY_LISTINGS_MAX_PAGES = 8;

// Optional endpoints answer 404 / null when a city has no editorial content; that is not an error
const getOrNull = async endpoint => {
  try {
    return await api.get(endpoint);
  } catch (e) {
    return null;
  }
};

const pickListings = res => {
  if (Array.isArray(res)) {
    return res;
  }
  return res?.listings || res?.items || res?.data || [];
};

// GET /listings?city=...&page=n&page_size=250, following `total` for further pages
export const fetchCityListings = async city => {
  const all = [];
  let total = 0;
  for (let page = 1; page <= CITY_LISTINGS_MAX_PAGES; page += 1) {
    const res = await api.get(
      `/listings?city=${encodeURIComponent(
        city,
      )}&page=${page}&page_size=${CITY_LISTINGS_PAGE_SIZE}`,
    );
    const batch = pickListings(res);
    all.push(...batch);
    total = typeof res?.total === 'number' ? res.total : all.length;
    if (batch.length === 0 || all.length >= total) {
      break;
    }
  }
  return { listings: all, total: Math.max(total, all.length) };
};

export const useCityListings = (city, options = {}) =>
  useQuery({
    queryKey: ['discovery', 'cityListings', city],
    queryFn: () => fetchCityListings(city),
    enabled: !!city,
    staleTime: 1000 * 60 * 5,
    ...options,
  });

export const useCityIntro = (citySlug, options = {}) =>
  useQuery({
    queryKey: ['discovery', 'cityIntro', citySlug],
    queryFn: async () => {
      const one = await getOrNull(`/cities/intros?city_slug=${encodeURIComponent(citySlug)}`);
      if (one) {
        return one;
      }
      // Some deployments only answer the full list: pick this city out of it
      const all = await getOrNull('/cities/intros');
      return Array.isArray(all) ? all.find(row => row?.citySlug === citySlug) || null : null;
    },
    enabled: !!citySlug,
    staleTime: 1000 * 60 * 10,
    ...options,
  });

export const useCityCover = (citySlug, options = {}) =>
  useQuery({
    queryKey: ['discovery', 'cityCover', citySlug],
    queryFn: () => getOrNull(`/cities/cover?city_slug=${encodeURIComponent(citySlug)}`),
    enabled: !!citySlug,
    staleTime: 1000 * 60 * 10,
    ...options,
  });

export const useCityCategoryIntros = (options = {}) =>
  useQuery({
    queryKey: ['discovery', 'cityCategoryIntros'],
    queryFn: () => getOrNull('/city-category-intros?status=published'),
    staleTime: 1000 * 60 * 10,
    ...options,
  });

export const useCityRoutes = (city, options = {}) =>
  useQuery({
    queryKey: ['discovery', 'cityRoutes', city],
    queryFn: () =>
      getOrNull(`/routes?destination_city=${encodeURIComponent(city)}&status=published`),
    enabled: !!city,
    staleTime: 1000 * 60 * 5,
    ...options,
  });

export const useNearbyCities = (state, options = {}) =>
  useQuery({
    queryKey: ['discovery', 'nearbyCities', state],
    queryFn: () => getOrNull(`/cities/known?state=${encodeURIComponent(state)}&min_verified=2`),
    enabled: !!state,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
