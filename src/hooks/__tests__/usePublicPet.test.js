import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePublicPet,
  usePublicPetMedia,
  usePetFollowState,
  useTogglePetFollow,
  usePetMediaLikes,
  useTogglePetMediaLike,
  usePetMediaComments,
  usePostPetMediaComment,
} from '../usePublicPet';
import { api } from '../../services/api/apiClient';

jest.mock('../../services/api/apiClient', () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

let client;
const wrapper = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

describe('usePublicPet hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  it('loads a pet by slug', async () => {
    api.get.mockResolvedValueOnce({ id: 'p1', petName: 'Apple' });
    const { result } = renderHook(() => usePublicPet('apple-sikarwar'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/pets/by-slug/apple-sikarwar');
    expect(result.current.data.id).toBe('p1');
  });

  it('does not call the API without a slug', () => {
    renderHook(() => usePublicPet(undefined), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });

  it('reads the gallery from { media }', async () => {
    api.get.mockResolvedValueOnce({ media: [{ id: 'm1' }] });
    const { result } = renderHook(() => usePublicPetMedia('p1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/pets/p1/media');
    expect(result.current.data).toEqual([{ id: 'm1' }]);
  });

  it('reads the follower count and whether the viewer follows', async () => {
    api.get.mockResolvedValueOnce({ followerCount: 7, viewerFollowing: true, followers: [] });
    const { result } = renderHook(() => usePetFollowState('p1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/pets/p1/followers');
    expect(result.current.data).toEqual({ followerCount: 7, viewerFollowing: true });
  });

  it('follows with POST and stores the server answer', async () => {
    api.post.mockResolvedValueOnce({ following: true, followerCount: 3 });
    const { result } = renderHook(() => useTogglePetFollow('p1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(false);
    });
    expect(api.post).toHaveBeenCalledWith('/pets/p1/follow');
    expect(client.getQueryData(['pet', 'followers', 'p1'])).toEqual({
      followerCount: 3,
      viewerFollowing: true,
    });
  });

  it('unfollows with DELETE and stores the server answer', async () => {
    api.delete.mockResolvedValueOnce({ following: false, followerCount: 2 });
    const { result } = renderHook(() => useTogglePetFollow('p1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(true);
    });
    expect(api.delete).toHaveBeenCalledWith('/pets/p1/follow');
    expect(client.getQueryData(['pet', 'followers', 'p1'])).toEqual({
      followerCount: 2,
      viewerFollowing: false,
    });
  });

  it('loads the like state of an adventure', async () => {
    api.get.mockResolvedValueOnce({ likeCount: 5, viewerLiked: true });
    const { result } = renderHook(() => usePetMediaLikes('m1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/pets/media/m1/likes');
    expect(result.current.data).toEqual({ likeCount: 5, viewerLiked: true });
  });

  it('toggles an adventure like with POST and stores the answer', async () => {
    api.post.mockResolvedValueOnce({ liked: true, likeCount: 6 });
    const { result } = renderHook(() => useTogglePetMediaLike('m1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(api.post).toHaveBeenCalledWith('/pets/media/m1/likes');
    expect(client.getQueryData(['pet', 'media-likes', 'm1'])).toEqual({
      likeCount: 6,
      viewerLiked: true,
    });
  });

  it('loads the visible comments of an adventure', async () => {
    api.get.mockResolvedValueOnce({ comments: [{ id: 'c1', body: 'Cute!' }] });
    const { result } = renderHook(() => usePetMediaComments('m1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/pets/media/m1/comments');
    expect(result.current.data).toEqual([{ id: 'c1', body: 'Cute!' }]);
  });

  it('posts a comment as { body } and reloads the list', async () => {
    api.post.mockResolvedValueOnce({ id: 'c2' });
    const spy = jest.spyOn(QueryClient.prototype, 'invalidateQueries');
    const { result } = renderHook(() => usePostPetMediaComment('m1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('Lovely trip');
    });
    expect(api.post).toHaveBeenCalledWith('/pets/media/m1/comments', { body: 'Lovely trip' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['pet', 'media-comments', 'm1'] });
    spy.mockRestore();
  });
});
