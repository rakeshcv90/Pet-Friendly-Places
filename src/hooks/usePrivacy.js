import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { useStore } from '../store';

// The switches the API knows about, in the order the screen shows them
export const PRIVACY_FIELDS = [
  'isPublic',
  'showPets',
  'showCommunityPosts',
  'showReviews',
  'showLeaderboard',
  'showSavedPlaces',
  'allowFollowers',
];

// Used until the server answers, so the screen never shows a switch in a guessed position
export const DEFAULT_PRIVACY = {
  isPublic: true,
  showPets: true,
  showCommunityPosts: true,
  showReviews: true,
  showLeaderboard: true,
  showSavedPlaces: false,
  allowFollowers: true,
};

// The API may wrap the switches ({ privacy: {...} }); keep only the known boolean fields
export const normalizePrivacy = data => {
  const source = data?.privacy || data?.settings || data?.data || data || {};
  const result = { ...DEFAULT_PRIVACY };
  PRIVACY_FIELDS.forEach(field => {
    if (typeof source[field] === 'boolean') {
      result[field] = source[field];
    }
  });
  return result;
};

const QUERY_KEY = ['account', 'privacy'];

// GET /accounts/me/privacy
export const usePrivacySettings = (options = {}) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: QUERY_KEY,
    enabled: isAuthenticated,
    queryFn: async () => normalizePrivacy(await api.get(API_ENDPOINTS.PRIVACY)),
    staleTime: 1000 * 30,
    ...options,
  });
};

// PATCH /accounts/me/privacy with only the switch that changed, e.g. { showPets: false }.
// The switch moves straight away and goes back if the server refuses.
export const useUpdatePrivacy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ field, value }) =>
      api.patch(API_ENDPOINTS.PRIVACY, { [field]: Boolean(value) }),
    onMutate: async ({ field, value }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData(QUERY_KEY);
      queryClient.setQueryData(QUERY_KEY, current => ({
        ...(current || DEFAULT_PRIVACY),
        [field]: Boolean(value),
      }));
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data, { field, value }) => {
      // The server returns the saved settings; fall back to what was sent if it does not
      const saved = normalizePrivacy(data);
      const hasFields = PRIVACY_FIELDS.some(
        key => typeof (data?.privacy || data)?.[key] === 'boolean',
      );
      queryClient.setQueryData(QUERY_KEY, current =>
        hasFields ? saved : { ...(current || DEFAULT_PRIVACY), [field]: Boolean(value) },
      );
    },
  });
};
