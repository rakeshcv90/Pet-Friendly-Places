import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';

// Any pet's public profile, found by its slug (the leaderboard row's slug)
export const usePublicPet = (slug, options = {}) =>
  useQuery({
    queryKey: ['pet', 'public', slug],
    enabled: !!slug,
    queryFn: () => api.get(API_ENDPOINTS.PET_BY_SLUG(slug)),
    staleTime: 1000 * 60,
    ...options,
  });

// A public pet's photo gallery. The server only returns approved items to visitors.
export const usePublicPetMedia = (petId, options = {}) =>
  useQuery({
    queryKey: ['pet', 'public-media', petId],
    enabled: !!petId,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.PET_MEDIA(petId));
      const list = Array.isArray(data) ? data : data?.media || data?.items || [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60,
    ...options,
  });

// Follower count and whether the signed-in user follows this pet
export const usePetFollowState = (petId, options = {}) =>
  useQuery({
    queryKey: ['pet', 'followers', petId],
    enabled: !!petId,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.PET_FOLLOWERS(petId));
      return {
        followerCount: Number(data?.followerCount) || 0,
        viewerFollowing: !!data?.viewerFollowing,
      };
    },
    staleTime: 1000 * 30,
    ...options,
  });

// Follow / unfollow. The server answers { following, followerCount }, which replaces the cached state
export const useTogglePetFollow = petId => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async following =>
      following
        ? api.delete(API_ENDPOINTS.PET_FOLLOW(petId))
        : api.post(API_ENDPOINTS.PET_FOLLOW(petId)),
    onSuccess: data => {
      queryClient.setQueryData(['pet', 'followers', petId], {
        followerCount: Number(data?.followerCount) || 0,
        viewerFollowing: !!data?.following,
      });
    },
  });
};

// ---- Adventure photo / video: likes and comments ----

const readLikes = data => ({
  likeCount: Number(data?.likeCount ?? data?.count) || 0,
  viewerLiked: !!(data?.viewerLiked ?? data?.liked),
});

export const usePetMediaLikes = (mediaId, options = {}) =>
  useQuery({
    queryKey: ['pet', 'media-likes', mediaId],
    enabled: !!mediaId,
    queryFn: async () => readLikes(await api.get(API_ENDPOINTS.PET_MEDIA_LIKES(mediaId))),
    staleTime: 1000 * 15,
    ...options,
  });

// POST toggles the like; the answer replaces the cached like state
export const useTogglePetMediaLike = mediaId => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(API_ENDPOINTS.PET_MEDIA_LIKES(mediaId)),
    onSuccess: data => {
      queryClient.setQueryData(['pet', 'media-likes', mediaId], readLikes(data));
    },
  });
};

export const usePetMediaComments = (mediaId, options = {}) =>
  useQuery({
    queryKey: ['pet', 'media-comments', mediaId],
    enabled: !!mediaId,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.PET_MEDIA_COMMENTS(mediaId));
      const list = Array.isArray(data) ? data : data?.comments || [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 15,
    ...options,
  });

// POST { body }. Comments may wait for approval, so the list is reloaded rather than appended
export const usePostPetMediaComment = mediaId => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: body => api.post(API_ENDPOINTS.PET_MEDIA_COMMENTS(mediaId), { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', 'media-comments', mediaId] });
    },
  });
};
