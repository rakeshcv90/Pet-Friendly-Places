import {
  extractNotificationList,
  extractUnreadCount,
  normalizeNotification,
} from '../useNotifications';

const { timeAgo, dayGroup, readableType, iconForType } = require('../../components/notifications/format');

describe('notification data helpers', () => {
  it('reads the list from a bare array or a wrapped response', () => {
    const list = [{ id: 1 }];
    expect(extractNotificationList(list)).toEqual(list);
    expect(extractNotificationList({ items: list })).toEqual(list);
    expect(extractNotificationList({ notifications: list })).toEqual(list);
    expect(extractNotificationList({ data: list })).toEqual(list);
    expect(extractNotificationList(null)).toEqual([]);
  });

  it('reads the unread count from a number or common field names', () => {
    expect(extractUnreadCount(4)).toBe(4);
    expect(extractUnreadCount({ count: 3 })).toBe(3);
    expect(extractUnreadCount({ unread_count: 2 })).toBe(2);
    expect(extractUnreadCount({ unreadCount: 1 })).toBe(1);
    expect(extractUnreadCount({})).toBe(0);
    expect(extractUnreadCount({ count: -5 })).toBe(0);
  });

  it('treats a notification as unread unless the API marks it read', () => {
    expect(normalizeNotification({ id: 1, is_read: false }).isRead).toBe(false);
    expect(normalizeNotification({ id: 1, is_read: true }).isRead).toBe(true);
    expect(normalizeNotification({ id: 1, read: true }).isRead).toBe(true);
    expect(normalizeNotification({ id: 1, read_at: null }).isRead).toBe(false);
    expect(normalizeNotification({ id: 1, read_at: '2026-06-01T10:00:00Z' }).isRead).toBe(true);
    expect(normalizeNotification({ id: 1 }).isRead).toBe(false);
  });

  it('maps title, body and date from alternative field names', () => {
    const n = normalizeNotification({ id: 9, subject: 'Hi', message: 'Hello', createdAt: 'x' });
    expect(n).toMatchObject({ id: 9, title: 'Hi', body: 'Hello', createdAt: 'x' });
  });
});

describe('timeAgo', () => {
  const now = new Date('2026-11-16T12:00:00Z');
  it('formats recent and older dates', () => {
    expect(timeAgo('2026-11-16T11:59:40Z', now)).toBe('Just now');
    expect(timeAgo('2026-11-16T11:55:00Z', now)).toBe('5m ago');
    expect(timeAgo('2026-11-16T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-11-14T12:00:00Z', now)).toBe('2d ago');
    expect(timeAgo(null, now)).toBe('');
  });
});

describe('notification display helpers', () => {
  const now = new Date(2026, 10, 16, 12, 0, 0);
  it('groups by day', () => {
    expect(dayGroup(new Date(2026, 10, 16, 1, 0), now)).toBe('Today');
    expect(dayGroup(new Date(2026, 10, 15, 23, 0), now)).toBe('Yesterday');
    expect(dayGroup(new Date(2026, 10, 12, 9, 0), now)).toBe('This week');
    expect(dayGroup(new Date(2026, 9, 7, 9, 0), now)).toBe('Earlier');
    expect(dayGroup(null, now)).toBe('Earlier');
  });

  it('makes a readable label and picks an icon per type', () => {
    expect(readableType('pseo_inventory_review')).toBe('Pseo Inventory Review');
    expect(readableType('')).toBe('');
    expect(iconForType('new_reply')).toBe('chatbubble-ellipses');
    expect(iconForType('seo_page_review')).toBe('trending-up');
    expect(iconForType('something_else')).toBe('notifications');
  });
});
