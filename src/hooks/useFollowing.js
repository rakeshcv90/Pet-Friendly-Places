import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';

export const FOLLOWING_KEY = ['me', 'following'];

// One followed pet, in the shape the Following screen uses. The server sends id, petName, slug,
// species, breed, a photo url, level, follower count and the follow date.
export const normalizeFollowedPet = raw => {
  if (!raw || raw.id == null) {
    return null;
  }
  return {
    id: raw.id,
    petName: raw.petName || raw.name || 'Pet',
    slug: raw.slug || '',
    species: raw.species || '',
    breed: raw.breed || '',
    photo: raw.profilePhotoUrl || raw.photoUrl || raw.photo || raw.imageUrl || '',
    level: Number(raw.level) || 0,
    followerCount: Number(raw.followerCount) || 0,
    followedAt: raw.followedAt || raw.followDate || raw.createdAt || '',
  };
};

// The pets the signed-in user follows (Profile > Following)
export const useFollowingPets = (options = {}) =>
  useQuery({
    queryKey: FOLLOWING_KEY,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.ME_FOLLOWING);
      const list = Array.isArray(data) ? data : data?.following || [];
      return (Array.isArray(list) ? list : []).map(normalizeFollowedPet).filter(Boolean);
    },
    staleTime: 1000 * 30,
    ...options,
  });

// Unfollow a pet from the list. No request body. Once the server says yes, the pet leaves the list
// and the follow state other screens keep for that pet (its public profile) is updated too.
export const useUnfollowPet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: petId => api.delete(API_ENDPOINTS.PET_FOLLOW(petId)),
    onSuccess: (data, petId) => {
      queryClient.setQueryData(FOLLOWING_KEY, current =>
        (current || []).filter(pet => String(pet.id) !== String(petId)),
      );
      // Only when that pet's follow state is known: never invent a follower count
      queryClient.setQueryData(['pet', 'followers', petId], previous => {
        if (!previous && data?.followerCount == null) {
          return undefined;
        }
        return {
          followerCount: Number(data?.followerCount ?? previous?.followerCount) || 0,
          viewerFollowing: false,
        };
      });
    },
  });
};
