import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { useStore } from '../store';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';
import { readAccountBookings } from '../screens/Home/urbaniaBooking';
import { devLog } from '../services/urbania/urbaniaApi';

// The signed-in account's Urbania bookings (GET /accounts/me/urbania-bookings), read into the same
// shape the history page keeps on the phone
export const useUrbaniaBookings = (options = {}) => {
  const token = useStore(state => state.token) || getItem(STORAGE_KEYS.ACCESS_TOKEN);

  return useQuery({
    queryKey: ['urbania', 'bookings'],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.MY_URBANIA_BOOKINGS);
      devLog('account bookings response', data);
      return readAccountBookings(data);
    },
    enabled: !!token,
    staleTime: 1000 * 30,
    ...options,
  });
};
