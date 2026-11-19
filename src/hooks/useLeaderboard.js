import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';

export const LEADERBOARD_WINDOWS = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

// Ranked pets for one time window. Entries carry rank, petName, slug, breed, profilePhotoUrl, pts,
// stampCount, socialLinks and the owner's name and photo.
export const useLeaderboard = (window = 'week', limit = 20, options = {}) => {
  return useQuery({
    queryKey: ['leaderboard', window, limit],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.LEADERBOARD, { params: { window, limit } });
      return Array.isArray(data?.entries) ? data.entries : [];
    },
    staleTime: 1000 * 60,
    ...options,
  });
};
