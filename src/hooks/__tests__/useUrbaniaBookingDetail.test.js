import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUrbaniaBookingDetail } from '../useUrbaniaBookingDetail';
import { api } from '../../services/api/apiClient';

jest.mock('../../services/api/apiClient', () => ({ api: { get: jest.fn() } }));

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('useUrbaniaBookingDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls the booking endpoint and reads the answer', async () => {
    api.get.mockResolvedValue({
      id: 'uuid-1',
      reference: 'URB-1',
      pickupAddress: 'Delhi',
    });
    const { result } = renderHook(() => useUrbaniaBookingDetail('uuid-1', true), { wrapper });
    await waitFor(() => expect(result.current.data).toBeTruthy());
    expect(api.get).toHaveBeenCalledWith('/accounts/me/urbania-bookings/uuid-1');
    expect(result.current.data.places).toEqual([{ kind: 'pickup', address: 'Delhi' }]);
  });

  it('does not call while closed or with no id', () => {
    renderHook(() => useUrbaniaBookingDetail('uuid-1', false), { wrapper });
    renderHook(() => useUrbaniaBookingDetail('', true), { wrapper });
    expect(api.get).not.toHaveBeenCalled();
  });
});
