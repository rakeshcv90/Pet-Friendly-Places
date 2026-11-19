import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../services/api/apiList';
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

// Merges `patch` into the cached profile (shape: { account }, { user } or the account itself), so every
// screen reading useUserProfile() shows the edit straight away instead of the older server copy.
export const patchCachedProfile = (queryClient, patch) =>
  queryClient.setQueryData(['user', 'profile'], current => {
    if (!current) {
      return current;
    }
    if (current.account) {
      return { ...current, account: { ...current.account, ...patch } };
    }
    if (current.user) {
      return { ...current, user: { ...current.user, ...patch } };
    }
    return { ...current, ...patch };
  });

export const useRefreshProfile = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
};

// The signed-in account's pet list. Accepts a plain array or one under `pets`.
export const useMyPets = (options = {}) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: ['user', 'pets'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.MY_PETS);
      const pets = Array.isArray(data) ? data : data?.pets || data?.items || [];
      useStore.getState().setPets(pets);
      return pets;
    },
    staleTime: 1000 * 15,
    // Reload when the app returns to the foreground: the account may have changed on another phone
    refetchOnWindowFocus: true,
    ...options,
  });
};

// Uploads a pet's profile photo (or banner) as multipart form data. Resolves to false instead of
// throwing, so a failed photo never hides that the pet itself was saved. Sent with fetch and no
// manual Content-Type, so the multipart boundary is added automatically.
export const uploadPetPhoto = async (petId, photo, purpose = 'profile_photo') => {
  try {
    const form = new FormData();
    form.append('photo', {
      uri: photo.uri,
      name: photo.fileName ?? 'photo.jpg',
      type: photo.type ?? 'image/jpeg',
    });
    form.append('purpose', purpose);

    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const url = `${API_BASE_URL}${API_ENDPOINTS.PET_PHOTO(petId)}`;
    if (__DEV__) {
      console.log('[pet photo] POST', url, {
        petId,
        purpose,
        hasToken: !!token,
        file: { uri: photo.uri, name: photo.fileName, type: photo.type, size: photo.fileSize },
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (__DEV__) {
      console.log('[pet photo] response', response.status, await response.text());
    }
    return response.ok;
  } catch (e) {
    if (__DEV__) {
      console.log('[pet photo] upload error', e?.message);
    }
    return false;
  }
};


export const useCreatePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ petName, species, breed, bio, photo }) => {
      const created = await api.post(API_ENDPOINTS.PETS, {
        petName,
        species,
        breed,
        ...(bio ? { bio } : {}),
      });
      const id = created?.id ?? created?.pet?.id;
      if (photo && id) {
        await uploadPetPhoto(id, photo);
      }
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', 'pets'] }),
  });
};

// Archives a pet (the server keeps its history), then reloads the pet list.
export const useDeletePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: petId => api.delete(API_ENDPOINTS.PET(petId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', 'pets'] }),
  });
};

// Adventure gallery items of one type ('photo' | 'video'), newest first. Each item carries a
// moderation / processing status, which the screen shows. Accepts a plain array or one under
// `media` / `items`.
export const usePetMedia = (petId, type = 'photo', options = {}) =>
  useQuery({
    queryKey: ['pet', 'media', petId, type],
    enabled: !!petId,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.PET_MEDIA(petId), { params: { type, limit: 30 } });
      const list = Array.isArray(data) ? data : data?.media || data?.items || data?.results || [];
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 30,
    ...options,
  });

// Uploads one photo or video to a pet's adventure gallery. Resolves to { ok, status, message }
// instead of throwing, so the screen can report why it failed. Sent with fetch and no manual Content-Type, so the
// multipart boundary is added automatically.
export const uploadPetMedia = async (petId, asset, { title, description } = {}) => {
  try {
    const isVideo = /^video/i.test(asset.type || '');
    const form = new FormData();
    form.append('media', {
      uri: asset.uri,
      name: asset.fileName ?? (isVideo ? 'adventure.mp4' : 'adventure.jpg'),
      type: asset.type ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    });
    if (title) {
      form.append('title', title);
    }
    if (description) {
      form.append('description', description);
    }

    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const url = `${API_BASE_URL}${API_ENDPOINTS.PET_MEDIA(petId)}?type=${
      isVideo ? 'video' : 'photo'
    }`;
    if (__DEV__) {
      console.log('[pet media] POST', url, {
        petId,
        hasToken: !!token,
        file: { uri: asset.uri, name: asset.fileName, type: asset.type, size: asset.fileSize },
        title,
        description,
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    // Read the body once as text, then try to parse it
    const raw = await response.text();
    let body = raw;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      // not JSON: keep the raw text
    }
    if (__DEV__) {
      console.log('[pet media] response', response.status, body);
    }
    if (response.ok) {
      return { ok: true, body };
    }
    return {
      ok: false,
      status: response.status,
      message:
        typeof body === 'object' ? body?.error || body?.message || '' : String(body).slice(0, 200),
    };
  } catch (e) {
    if (__DEV__) {
      console.log('[pet media] upload error', e?.message);
    }
    return { ok: false, status: 0, message: e?.message || 'Network request failed' };
  }
};

// A pet's public pawsport: stamp total, distinct places and the stamp details.
export const usePawsport = petSlug =>
  useQuery({
    queryKey: ['pet', 'pawsport', petSlug],
    enabled: !!petSlug,
    queryFn: () => api.get(API_ENDPOINTS.PAWSPORT(petSlug)),
    staleTime: 1000 * 60,
  });

// Saves edits to a pet from the Edit screen, then reloads the pet list.
export const useUpdatePet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, photo, ...fields }) => {
      const updated = await api.patch(API_ENDPOINTS.PET(id), fields);
      if (photo) {
        await uploadPetPhoto(id, photo);
      }
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', 'pets'] }),
  });
};

// Places the signed-in user saved. Each entry is a listing, sometimes wrapped as { listing }.
export const useSavedPlaces = (options = {}) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: ['user', 'saved'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.SAVED_PLACES);
      const list = Array.isArray(data)
        ? data
        : data?.saved || data?.places || data?.listings || data?.items || [];
      return (Array.isArray(list) ? list : []).map(entry => entry?.listing || entry);
    },
    staleTime: 1000 * 60,
    ...options,
  });
};

// Removes one place from the user's saved list. The card disappears straight away and comes back
// if the request fails.
export const useUnsavePlace = () => {
  const queryClient = useQueryClient();
  const key = ['user', 'saved'];
  return useMutation({
    mutationFn: listingId => api.delete(API_ENDPOINTS.SAVED_PLACE(listingId)),
    onMutate: async listingId => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, current =>
        (current || []).filter(place => String(place.id) !== String(listingId)),
      );
      return { previous };
    },
    onError: (_error, _listingId, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

// Save / unsave one place for the signed-in account:
//   POST   /accounts/me/saved/{listingId}   save
//   DELETE /accounts/me/saved/{listingId}   remove
// The heart flips straight away and flips back if the request fails. `listing` is optional and
// only gives the saved list a readable entry until the server's own list loads.
export const useSavePlace = (listingId, listing) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const { data: savedPlaces } = useSavedPlaces();
  const key = ['user', 'saved'];

  const saved =
    listingId !== undefined &&
    listingId !== null &&
    (savedPlaces || []).some(place => String(place?.id) === String(listingId));

  const mutation = useMutation({
    mutationFn: ({ id, save }) =>
      save ? api.post(API_ENDPOINTS.SAVED_PLACE(id)) : api.delete(API_ENDPOINTS.SAVED_PLACE(id)),
    onMutate: async ({ id, save }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, current => {
        const list = (current || []).filter(place => String(place?.id) !== String(id));
        return save ? [{ ...(listing || {}), id }, ...list] : list;
      });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const toggle = useCallback(() => {
    if (listingId === undefined || listingId === null || mutation.isPending) {
      return false;
    }
    if (!isAuthenticated) {
      Alert.alert('Sign in to save', 'Log in to keep places in your saved list.');
      return false;
    }
    mutation.mutate({ id: listingId, save: !saved });
    return true;
  }, [listingId, isAuthenticated, mutation, saved]);

  return { saved, toggle, isPending: mutation.isPending, isError: mutation.isError };
};

// Puts a just-removed place back into the saved list (the Undo on the Saved Places screen)
export const useRestoreSavedPlace = () => {
  const queryClient = useQueryClient();
  const key = ['user', 'saved'];
  return useMutation({
    mutationFn: place => api.post(API_ENDPOINTS.SAVED_PLACE(place.id)),
    onMutate: async place => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, current => [
        place,
        ...(current || []).filter(entry => String(entry?.id) !== String(place.id)),
      ]);
      return { previous };
    },
    onError: (_error, _place, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};
