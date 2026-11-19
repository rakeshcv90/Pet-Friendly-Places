import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeaderboard, LEADERBOARD_WINDOWS } from '../useLeaderboard';
import { api } from '../../services/api/apiClient';

jest.mock('../../services/api/apiClient', () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const wrapper = ({ children }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useLeaderboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requests the chosen window with a limit and returns the entries', async () => {
    api.get.mockResolvedValueOnce({ window: 'all', entries: [{ rank: 1, petName: 'Apple' }] });
    const { result } = renderHook(() => useLeaderboard('all', 3), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/leaderboard', { params: { window: 'all', limit: 3 } });
    expect(result.current.data).toEqual([{ rank: 1, petName: 'Apple' }]);
  });

  it('defaults to the week window and 20 entries', async () => {
    api.get.mockResolvedValueOnce({ window: 'week', entries: [] });
    const { result } = renderHook(() => useLeaderboard(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/leaderboard', { params: { window: 'week', limit: 20 } });
  });

  it('treats a malformed response as an empty board', async () => {
    api.get.mockResolvedValueOnce({ window: 'week' });
    const { result } = renderHook(() => useLeaderboard('week'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('exposes the three website tabs', () => {
    expect(LEADERBOARD_WINDOWS.map(item => item.key)).toEqual(['week', 'month', 'all']);
    expect(LEADERBOARD_WINDOWS.map(item => item.label)).toEqual(['This week', 'This month', 'All time']);
  });
});
