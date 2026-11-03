import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCommunityMembership } from '../useCommunity';
import { api } from '../../services/api/apiClient';
import { getItem, setItem, removeItem, STORAGE_KEYS } from '../../services/storage/storage';
import { useStore } from '../../store';

jest.mock('../../services/api/apiClient', () => ({
  api: { get: jest.fn(), post: jest.fn() },
}));

const wrapper = ({ children }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useCommunityMembership', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    removeItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS);
    useStore.setState({ user: { id: 7 }, isAuthenticated: true });
  });

  it('posts the community slug once per toggle and follows the joined flag', async () => {
    api.post.mockResolvedValueOnce({ joined: true }).mockResolvedValueOnce({ joined: false });
    const { result } = renderHook(() => useCommunityMembership('travel-and-road-trips'), { wrapper });

    expect(result.current.isMember).toBe(false);

    await act(async () => {
      await result.current.toggle();
    });
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith('/community/memberships', { communitySlug: 'travel-and-road-trips' });
    await waitFor(() => expect(result.current.isMember).toBe(true));

    await act(async () => {
      await result.current.toggle();
    });
    expect(api.post).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.isMember).toBe(false));
  });

  it('keeps the previous state when the request fails', async () => {
    api.post.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });

    await act(async () => {
      await result.current.toggle().catch(() => {});
    });

    expect(result.current.isMember).toBe(false);
    expect(getItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, true)).toBeNull();
  });

  it('restores a remembered membership for the same user only', () => {
    setItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, { '7:mumbai': true });

    const sameUser = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
    expect(sameUser.result.current.isMember).toBe(true);

    useStore.setState({ user: { id: 8 } });
    const otherUser = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
    expect(otherUser.result.current.isMember).toBe(false);
  });
});
