import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePrivacySettings,
  useUpdatePrivacy,
  normalizePrivacy,
  DEFAULT_PRIVACY,
} from '../usePrivacy';
import { api } from '../../services/api/apiClient';
import { useStore } from '../../store';

jest.mock('../../services/api/apiClient', () => ({
  api: { get: jest.fn(), patch: jest.fn() },
}));

const SERVER = {
  isPublic: true,
  showPets: true,
  showCommunityPosts: true,
  showReviews: true,
  showLeaderboard: true,
  showSavedPlaces: false,
  allowFollowers: true,
};

// One client per test, created once, so a re-render never swaps it out
const setup = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => ({ settings: usePrivacySettings(), update: useUpdatePrivacy() }), {
    wrapper,
  });
};

describe('normalizePrivacy', () => {
  it('reads the switches from the top level or from a wrapper object', () => {
    expect(normalizePrivacy(SERVER)).toEqual(SERVER);
    expect(normalizePrivacy({ privacy: { ...SERVER, showPets: false } }).showPets).toBe(false);
    expect(normalizePrivacy({ settings: { showReviews: false } }).showReviews).toBe(false);
  });

  it('ignores fields it does not know and values that are not booleans', () => {
    const result = normalizePrivacy({ showPets: 'no', somethingElse: true, isPublic: false });
    expect(result.showPets).toBe(DEFAULT_PRIVACY.showPets);
    expect(result.isPublic).toBe(false);
    expect(result).not.toHaveProperty('somethingElse');
  });

  it('falls back to the defaults for an empty response', () => {
    expect(normalizePrivacy(undefined)).toEqual(DEFAULT_PRIVACY);
    expect(normalizePrivacy(null)).toEqual(DEFAULT_PRIVACY);
  });
});

describe('usePrivacySettings and useUpdatePrivacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStore.setState({ isAuthenticated: true });
  });

  it('loads the settings from GET /accounts/me/privacy', async () => {
    api.get.mockResolvedValueOnce({ ...SERVER, showPets: false });
    const { result } = setup();

    await waitFor(() => expect(result.current.settings.data).toBeDefined());
    expect(api.get).toHaveBeenCalledWith('/accounts/me/privacy');
    expect(result.current.settings.data.showPets).toBe(false);
  });

  it('sends only the switch that changed as a boolean', async () => {
    api.get.mockResolvedValueOnce(SERVER);
    api.patch.mockResolvedValueOnce({ ...SERVER, showSavedPlaces: true });
    const { result } = setup();
    await waitFor(() => expect(result.current.settings.data).toBeDefined());

    await act(async () => {
      await result.current.update.mutateAsync({ field: 'showSavedPlaces', value: true });
    });

    expect(api.patch).toHaveBeenCalledTimes(1);
    expect(api.patch).toHaveBeenCalledWith('/accounts/me/privacy', { showSavedPlaces: true });
    await waitFor(() => expect(result.current.settings.data.showSavedPlaces).toBe(true));
  });

  it('keeps what was sent when the server answers without the settings', async () => {
    api.get.mockResolvedValueOnce(SERVER);
    api.patch.mockResolvedValueOnce({});
    const { result } = setup();
    await waitFor(() => expect(result.current.settings.data).toBeDefined());

    await act(async () => {
      await result.current.update.mutateAsync({ field: 'showPets', value: false });
    });

    await waitFor(() => expect(result.current.settings.data.showPets).toBe(false));
    expect(result.current.settings.data.showReviews).toBe(true);
  });

  it('puts the switch back when saving fails', async () => {
    api.get.mockResolvedValueOnce(SERVER);
    api.patch.mockRejectedValueOnce(new Error('network'));
    const { result } = setup();
    await waitFor(() => expect(result.current.settings.data).toBeDefined());

    await act(async () => {
      await result.current.update.mutateAsync({ field: 'showPets', value: false }).catch(() => {});
    });

    await waitFor(() => expect(result.current.settings.data.showPets).toBe(true));
  });

  it('does not load anything when signed out', () => {
    useStore.setState({ isAuthenticated: false });
    setup();
    expect(api.get).not.toHaveBeenCalled();
  });
});
