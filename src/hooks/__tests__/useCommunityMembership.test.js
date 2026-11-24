import React from 'react';
import { AppState } from 'react-native';
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
    // A failed toggle never saves a join (the server check may save the real state: not a member)
    expect((getItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, true) || {})['7:mumbai']).not.toBe(true);
  });

  it('restores a remembered membership for the same user only', () => {
    setItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, { '7:mumbai': true });

    const sameUser = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
    expect(sameUser.result.current.isMember).toBe(true);

    useStore.setState({ user: { id: 8 } });
    const otherUser = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
    expect(otherUser.result.current.isMember).toBe(false);
  });

  describe('server membership state', () => {
    it('looks again when the app returns to the foreground (e.g. after joining on the website)', async () => {
      let onChange;
      const remove = jest.fn();
      const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, cb) => {
        onChange = cb;
        return { remove };
      });
      api.get.mockResolvedValueOnce({ joined: false, memberCount: 29 });
      const { result, unmount } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
      await waitFor(() => expect(result.current.memberCount).toBe(29));

      // Joined on the website while the app was in the background
      api.get.mockResolvedValueOnce({ joined: true, memberCount: 30 });
      await act(async () => {
        onChange('active');
      });
      await waitFor(() => expect(result.current.isMember).toBe(true));
      expect(result.current.memberCount).toBe(30);

      // Going to the background does not refetch
      const calls = api.get.mock.calls.length;
      await act(async () => {
        onChange('background');
      });
      expect(api.get.mock.calls.length).toBe(calls);

      unmount();
      expect(remove).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('reads joined and memberCount from GET /community/memberships/{slug}', async () => {
      api.get.mockResolvedValueOnce({ joined: true, memberCount: 29 });
      const { result } = renderHook(() => useCommunityMembership('travel-and-road-trips'), { wrapper });

      await waitFor(() => expect(result.current.isMember).toBe(true));
      expect(api.get).toHaveBeenCalledWith('/community/memberships/travel-and-road-trips');
      expect(result.current.memberCount).toBe(29);
      expect(getItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, true)).toEqual({ '7:travel-and-road-trips': true });
    });

    it('lets the server override a stale remembered membership', async () => {
      setItem(STORAGE_KEYS.COMMUNITY_MEMBERSHIPS, { '7:mumbai': true });
      api.get.mockResolvedValueOnce({ joined: false, memberCount: 3 });
      const { result } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });

      expect(result.current.isMember).toBe(true);
      await waitFor(() => expect(result.current.isMember).toBe(false));
    });

    it('does not call the membership GET for guests', () => {
      useStore.setState({ user: null, isAuthenticated: false });
      renderHook(() => useCommunityMembership('mumbai'), { wrapper });
      expect(api.get).not.toHaveBeenCalled();
    });

    it('uses the member count from the join answer', async () => {
      api.get.mockResolvedValueOnce({ joined: false, memberCount: 29 });
      api.post.mockResolvedValueOnce({ joined: true, memberCount: 30 });
      const { result } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
      await waitFor(() => expect(result.current.memberCount).toBe(29));

      await act(async () => {
        await result.current.toggle();
      });
      await waitFor(() => expect(result.current.memberCount).toBe(30));
      expect(result.current.isMember).toBe(true);
    });

    it('after a timeout, treats a changed state as success without sending the POST again', async () => {
      api.get.mockResolvedValueOnce({ joined: false, memberCount: 29 });
      api.post.mockRejectedValueOnce(new Error('timeout of 15000ms exceeded'));
      const { result } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

      // The POST did reach the server: the check shows the user is now a member
      api.get.mockResolvedValueOnce({ joined: true, memberCount: 30 });
      await act(async () => {
        await result.current.toggle();
      });
      expect(api.post).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(result.current.isMember).toBe(true));
      expect(result.current.memberCount).toBe(30);
    });

    it('after a timeout, reports the failure when nothing changed so it can be retried', async () => {
      api.get.mockResolvedValue({ joined: false, memberCount: 29 });
      api.post.mockRejectedValueOnce(new Error('timeout of 15000ms exceeded'));
      const { result } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

      let failed = false;
      await act(async () => {
        await result.current.toggle().catch(() => {
          failed = true;
        });
      });
      expect(failed).toBe(true);
      expect(result.current.isMember).toBe(false);
    });

    it('does not second-guess an error the server answered', async () => {
      api.get.mockResolvedValue({ joined: false, memberCount: 29 });
      api.post.mockRejectedValueOnce({ response: { status: 401 } });
      const { result } = renderHook(() => useCommunityMembership('mumbai'), { wrapper });
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));

      await act(async () => {
        await result.current.toggle().catch(() => {});
      });
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });
});
