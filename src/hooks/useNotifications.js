import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { useStore } from '../store';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';

export const NOTIFICATION_KEYS = {
  list: ['notifications', 'list'],
  count: ['notifications', 'unreadCount'],
};

const LIST_PAGE_SIZE = 50;

/** The list arrives either as a bare array or wrapped ({ items }, { notifications }, { data }...). */
export const extractNotificationList = res => {
  if (Array.isArray(res)) {
    return res;
  }
  const list = res?.items ?? res?.notifications ?? res?.data ?? res?.results;
  return Array.isArray(list) ? list : [];
};

/** The count arrives as a number or as { count } / { unread_count } / { unreadCount }. */
export const extractUnreadCount = res => {
  const value =
    typeof res === 'number' ? res : res?.count ?? res?.unread_count ?? res?.unreadCount ?? res?.unread;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

/** API notification -> the shape the UI renders. A notification is unread unless the API says read. */
export const normalizeNotification = raw => {
  const readFlag = [raw?.is_read, raw?.isRead, raw?.read].find(v => typeof v === 'boolean');
  const isRead = readFlag !== undefined ? readFlag : Boolean(raw?.read_at ?? raw?.readAt);
  return {
    id: raw?.id,
    type: raw?.type || raw?.category || '',
    title: raw?.title || raw?.subject || '',
    body: raw?.body || raw?.message || raw?.text || raw?.content || '',
    createdAt: raw?.created_at || raw?.createdAt || null,
    isRead,
    data: raw?.data ?? raw?.payload ?? null,
  };
};

const useHasSession = () => {
  const token = useStore(state => state.token) || getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return !!token;
};

// Unread badge number for the bell
export const useUnreadCount = (options = {}) => {
  const enabled = useHasSession();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.count,
    queryFn: async () => extractUnreadCount(await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)),
    enabled,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    ...options,
  });
};

// One cached list serves both views: the bell popup (`unreadOnly`) and the "View all" screen.
export const useNotifications = ({ unreadOnly = false, ...options } = {}) => {
  const enabled = useHasSession();
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list,
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { page_size: LIST_PAGE_SIZE },
      });
      return extractNotificationList(res).map(normalizeNotification);
    },
    select: unreadOnly ? list => list.filter(item => !item.isRead) : undefined,
    enabled,
    staleTime: 1000 * 30,
    ...options,
  });
};

// Flips items to read in both caches straight away; the refetch afterwards confirms with the server.
const useReadMutation = (mutationFn, { all = false } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async ids => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const list = queryClient.getQueryData(NOTIFICATION_KEYS.list) || [];
      const wasUnread = list.filter(n => !n.isRead && (all || ids.includes(n.id))).length;
      queryClient.setQueryData(NOTIFICATION_KEYS.list, current =>
        current?.map(n => (all || ids.includes(n.id) ? { ...n, isRead: true } : n)),
      );
      queryClient.setQueryData(NOTIFICATION_KEYS.count, current =>
        all ? 0 : Math.max(0, (current ?? 0) - wasUnread),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkRead = () =>
  useReadMutation(ids => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, { ids }));

export const useMarkAllRead = () =>
  useReadMutation(() => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ), { all: true });
