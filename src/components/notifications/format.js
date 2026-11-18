const toDate = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** "Just now", "5m ago", "3h ago", "2d ago", then "12 Jun" / "12 Jun 2025". */
export const timeAgo = (value, now = new Date()) => {
  const date = toDate(value);
  if (!date) {
    return '';
  }
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) {
    return 'Just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return date.getFullYear() === now.getFullYear() ? label : `${label} ${date.getFullYear()}`;
};

const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Section a notification belongs to on the full screen. */
export const DAY_GROUPS = ['Today', 'Yesterday', 'This week', 'Earlier'];
export const dayGroup = (value, now = new Date()) => {
  const date = toDate(value);
  if (!date) {
    return 'Earlier';
  }
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  if (days <= 0) {
    return 'Today';
  }
  return days === 1 ? 'Yesterday' : days < 7 ? 'This week' : 'Earlier';
};

/** "pseo_inventory_review" -> "Pseo Inventory Review". */
export const readableType = type =>
  String(type || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());

// One icon per kind of notification. Colours stay on the app palette, only the glyph changes.
const TYPE_ICONS = [
  ['reply', 'chatbubble-ellipses'],
  ['comment', 'chatbubble-ellipses'],
  ['like', 'heart'],
  ['place', 'location'],
  ['listing', 'location'],
  ['seo', 'trending-up'],
  ['page', 'document-text'],
  ['pet', 'paw'],
  ['reunite', 'paw'],
  ['alert', 'alert-circle'],
  ['community', 'people'],
  ['badge', 'ribbon'],
];

export const iconForType = type => {
  const t = String(type || '').toLowerCase();
  const match = TYPE_ICONS.find(([key]) => t.includes(key));
  return match ? match[1] : 'notifications';
};
