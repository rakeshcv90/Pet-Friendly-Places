import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { readBookingDetail } from '../screens/Home/urbaniaBooking';
import { devLog } from '../services/urbania/urbaniaApi';

// One booking with all its details (GET /accounts/me/urbania-bookings/{id}), fetched when its trip
// details are opened. The list only has a summary: the addresses and the payment note are here.
export const useUrbaniaBookingDetail = (id, enabled = true) =>
  useQuery({
    queryKey: ['urbania', 'booking', id],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.URBANIA_BOOKING(id));
      devLog(`booking ${id} detail response`, data);
      return readBookingDetail(data);
    },
    enabled: !!id && enabled,
    staleTime: 1000 * 30,
  });
