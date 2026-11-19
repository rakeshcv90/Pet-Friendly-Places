import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockApi = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };
jest.mock('../../services/api/apiClient', () => ({ api: mockApi }));
jest.mock('../../store', () => ({
  useStore: selector => selector({ isAuthenticated: true, token: 't' }),
}));

const { useSavePlace } = require('../useUser');

// One client per test: a client made inside the wrapper would be rebuilt on every render
let client;
const wrapper = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

afterEach(() => client.clear());

describe('useSavePlace', () => {
  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    jest.clearAllMocks();
    // A tiny fake server: what POST saves is what the next GET returns
    const server = [{ id: 7, name: 'Saved already' }];
    mockApi.get.mockImplementation(async () => [...server]);
    mockApi.post.mockImplementation(async url => {
      server.unshift({ id: Number(url.split('/').pop()), name: 'New' });
      return {};
    });
    mockApi.delete.mockResolvedValue({});
  });

  it('saves with POST /accounts/me/saved/{id}', async () => {
    const { result } = renderHook(() => useSavePlace(42, { id: 42, name: 'Cyberfarm' }), { wrapper });
    await waitFor(() => expect(mockApi.get).toHaveBeenCalled());
    expect(result.current.saved).toBe(false);

    act(() => {
      result.current.toggle();
    });
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith('/accounts/me/saved/42'));
    // The heart is filled, and stays filled once the list is reloaded from the server
    await waitFor(() => expect(result.current.saved).toBe(true));
  });

  it('removes with DELETE /accounts/me/saved/{id} when already saved', async () => {
    const { result } = renderHook(() => useSavePlace(7), { wrapper });
    await waitFor(() => expect(result.current.saved).toBe(true));

    act(() => {
      result.current.toggle();
    });
    await waitFor(() => expect(mockApi.delete).toHaveBeenCalledWith('/accounts/me/saved/7'));
  });

  it('does nothing without a listing id', async () => {
    const { result } = renderHook(() => useSavePlace(undefined), { wrapper });
    act(() => {
      expect(result.current.toggle()).toBe(false);
    });
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(mockApi.delete).not.toHaveBeenCalled();
  });
});
