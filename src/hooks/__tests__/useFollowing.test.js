import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFollowingPets, useUnfollowPet, normalizeFollowedPet, FOLLOWING_KEY } from '../useFollowing';
import { api } from '../../services/api/apiClient';

jest.mock('../../services/api/apiClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

let client;
const wrapper = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const apple = {
  id: 'adb6362c',
  petName: 'Apple',
  slug: 'apple-sikarwar',
  species: 'dog',
  breed: 'Golden Retriever',
  photoUrl: '/uploads/apple.jpg',
  level: 4,
  followerCount: 1,
  followedAt: '2026-11-20T10:00:00Z',
};
const bruno = { id: 'b2', petName: 'Bruno', slug: 'bruno-1', species: 'dog', followerCount: 3 };

describe('normalizeFollowedPet', () => {
  it('keeps the fields the Following screen uses', () => {
    expect(normalizeFollowedPet(apple)).toEqual({
      id: 'adb6362c',
      petName: 'Apple',
      slug: 'apple-sikarwar',
      species: 'dog',
      breed: 'Golden Retriever',
      photo: '/uploads/apple.jpg',
      level: 4,
      followerCount: 1,
      followedAt: '2026-11-20T10:00:00Z',
    });
  });

  it('fills the gaps and drops an entry without an id', () => {
    expect(normalizeFollowedPet({ id: 1 })).toMatchObject({
      petName: 'Pet',
      slug: '',
      photo: '',
      level: 0,
      followerCount: 0,
    });
    expect(normalizeFollowedPet({ petName: 'No id' })).toBeNull();
    expect(normalizeFollowedPet(null)).toBeNull();
  });
});

describe('useFollowingPets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('loads the pets from GET /me/following ({ following: [...] })', async () => {
    api.get.mockResolvedValueOnce({ following: [apple, bruno] });
    const { result } = renderHook(() => useFollowingPets(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/me/following');
    expect(result.current.data.map(pet => pet.petName)).toEqual(['Apple', 'Bruno']);
  });

  it('accepts a bare list and an empty answer', async () => {
    api.get.mockResolvedValueOnce([apple]);
    const first = renderHook(() => useFollowingPets(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(first.result.current.data).toHaveLength(1);

    client.clear();
    api.get.mockResolvedValueOnce({});
    const second = renderHook(() => useFollowingPets(), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(second.result.current.data).toEqual([]);
  });

  it('reports a failed request', async () => {
    api.get.mockRejectedValueOnce(new Error('Network Error'));
    const { result } = renderHook(() => useFollowingPets(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUnfollowPet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(FOLLOWING_KEY, [normalizeFollowedPet(apple), normalizeFollowedPet(bruno)]);
  });

  it('sends DELETE /pets/{id}/follow with no body, then removes that pet from the list', async () => {
    api.delete.mockResolvedValueOnce({ following: false, followerCount: 0 });
    const { result } = renderHook(() => useUnfollowPet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('adb6362c');
    });

    expect(api.delete).toHaveBeenCalledWith('/pets/adb6362c/follow');
    expect(client.getQueryData(FOLLOWING_KEY).map(pet => pet.id)).toEqual(['b2']);
  });

  it('keeps the pet in the list when the request fails', async () => {
    api.delete.mockRejectedValueOnce(new Error('Request failed with status code 500'));
    const { result } = renderHook(() => useUnfollowPet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('adb6362c').catch(() => {});
    });

    expect(client.getQueryData(FOLLOWING_KEY)).toHaveLength(2);
  });

  it("updates that pet's follow state for its public profile when it is known", async () => {
    client.setQueryData(['pet', 'followers', 'adb6362c'], { followerCount: 1, viewerFollowing: true });
    api.delete.mockResolvedValueOnce({ following: false, followerCount: 0 });
    const { result } = renderHook(() => useUnfollowPet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('adb6362c');
    });

    expect(client.getQueryData(['pet', 'followers', 'adb6362c'])).toEqual({
      followerCount: 0,
      viewerFollowing: false,
    });
  });

  it('does not invent a follow state for a pet whose profile was never opened', async () => {
    api.delete.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUnfollowPet(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('adb6362c');
    });

    expect(client.getQueryData(['pet', 'followers', 'adb6362c'])).toBeUndefined();
  });
});
