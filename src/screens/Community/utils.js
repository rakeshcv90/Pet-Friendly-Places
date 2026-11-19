import { WEB_BASE_URL } from '../../services/api/apiList';

// Gradient pairs for topic communities, cycled by position in the list
const TOPIC_COLORS = [
  ['#7B2CFF', '#A26BFF'],
  ['#00B894', '#2DD4BF'],
  ['#FF9F1C', '#FFD166'],
  ['#FF4FB8', '#F472B6'],
  ['#3B108F', '#7B2CFF'],
];

const CITY_ACCENTS = ['#00B894', '#23B36F', '#5B4BF0', '#FF9F1C'];

export const TYPE_STYLES = {
  QUESTION: { label: 'Question', emoji: '❓', bg: '#EDE9FE', color: '#5B21B6', border: '#C4B5FD' },
  DISCUSSION: {
    label: 'Discussion',
    emoji: '💬',
    bg: '#CCFBF1',
    color: '#0F766E',
    border: '#5EEAD4',
  },
  EVENT: { label: 'Event', emoji: '🎉', bg: '#FFEDD5', color: '#C2410C', border: '#FDBA74' },
  GUIDE: { label: 'Guide', emoji: '📖', bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
};

// Turns an API community into the shape the screens render
export const toCommunityCard = (community, index) => {
  const colors = TOPIC_COLORS[index % TOPIC_COLORS.length];
  return {
    slug: community.slug,
    type: community.type,
    title: community.name,
    icon: community.emoji,
    desc: community.description,
    posts: community.postCount ?? 0,
    members: community.memberCount ?? 0,
    colors,
    accent: community.type === 'CITY' ? CITY_ACCENTS[index % CITY_ACCENTS.length] : colors[0],
  };
};

export const timeAgo = iso => {
  const time = new Date(iso).getTime();
  if (!time) {
    return '';
  }
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 60) {
    return `${Math.max(minutes, 1)}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(months / 12)}y ago`;
};

export const credentialLabel = credential => {
  if (!credential) {
    return null;
  }
  const labels = {
    EXPERT: 'Expert',
    VET: 'Vet Verified',
    TRAINER: 'Trainer',
    VERIFIED: 'Verified',
  };
  const key = String(credential).toUpperCase();
  return labels[key] || key.charAt(0) + key.slice(1).toLowerCase();
};

// Post bodies are plain text; drop stray markdown emphasis markers
export const cleanText = text => (text || '').replace(/\*\*(.*?)\*\*/g, '$1').trim();

export const initialOf = name => (name || '?').trim().charAt(0).toUpperCase();

const AVATAR_COLORS = [
  { bg: '#EDE9FE', color: '#7B2CFF' },
  { bg: '#D1FAE5', color: '#065F46' },
  { bg: '#FFEDD5', color: '#C2410C' },
  { bg: '#FCE7F3', color: '#BE185D' },
  { bg: '#DBEAFE', color: '#1D4ED8' },
];

// Two-letter initials, e.g. "Pooja Nair" -> "PN"
export const initialsOf = name => {
  const words = (name || '?').trim().split(/\s+/);
  return (words[0].charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase();
};

// Stable colour per author name
export const avatarColorsFor = name => {
  const sum = Array.from(name || '').reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

// "5 Jul", or "5 Jul 2025" when not in the current year
export const shortDate = iso => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return date.getFullYear() === new Date().getFullYear() ? label : `${label} ${date.getFullYear()}`;
};

export const COMMUNITY_GUIDELINES_URL = `${WEB_BASE_URL}/community-guidelines`;

// Parts of the website that make no sense inside the app: its header, bottom tab bar, chat button,
// floating YouTube promo and the Next.js development badge
export const WEBSITE_CHROME_SELECTORS = [
  'header',
  '.pfp-mobile-bottom-nav-outer',
  '.pfp-mobile-bottom-nav',
  '.pfp-chat-wrapper',
  '.yt-float-wrapper',
  'nextjs-portal',
];

// Opens the guidelines page inside the app (in-app browser screen)
export const openCommunityGuidelines = navigation =>
  navigation.navigate('InAppBrowserScreen', {
    url: COMMUNITY_GUIDELINES_URL,
    title: 'Community guidelines',
    hideSelectors: WEBSITE_CHROME_SELECTORS,
  });
