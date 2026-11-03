import { API_BASE_URL } from '../../../services/api/apiList';

export const WEB_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const CALLOUT_COLORS = {
  purple: { bg: '#EEEDFE', bar: '#534AB7', title: '#3C3489', bgDark: '#26215C', titleDark: '#CECBF6' },
  teal: { bg: '#E1F5EE', bar: '#0F6E56', title: '#085041', bgDark: '#04342C', titleDark: '#9FE1CB' },
  amber: { bg: '#FAEEDA', bar: '#854F0B', title: '#633806', bgDark: '#412402', titleDark: '#FAC775' },
  coral: { bg: '#FAECE7', bar: '#993C1D', title: '#712B13', bgDark: '#4A1B0C', titleDark: '#F5C4B3' },
  gold: { bg: '#FDF8E8', bar: '#D4AF37', title: '#8B6914', bgDark: '#2C2000', titleDark: '#F5E6A8' },
  default: { bg: '#F1F5F9', bar: '#64748B', title: '#334155', bgDark: '#1E293B', titleDark: '#CBD5E1' },
};

// Accent per article category (badge type from mapCategoryToBadge, ids from CATEGORY_TABS)
export const BRAND_ACCENT = { main: '#7B2CFF', soft: '#F3EEFF', softDark: 'rgba(168, 85, 247, 0.16)' };
export const CATEGORY_THEMES = {
  destination: BRAND_ACCENT,
  travel: BRAND_ACCENT,
  health: BRAND_ACCENT,
  parenting: BRAND_ACCENT,
  misconceptions: BRAND_ACCENT,
  rescue: BRAND_ACCENT,
};

// Author box shown on every guide, same copy as the website
export const TRUST_BOX = {
  name: 'Tails Team',
  desc: 'Real pet parents sharing honest experiences from the road. Apple (The Golden Retriever), Captain and Kimchi are the real authors.',
  linkLabel: 'Read our travel stories →',
};

export const CALLOUT_BODY = '#241B35';
export const CALLOUT_BODY_DARK = '#E5E7EB';

export const MARK_COLORS = {
  purple: '#E8DEFF',
  teal: '#B8F0E5',
  amber: '#FFF0C2',
  coral: '#FDDDD0',
  gold: '#FBF0C4',
  default: 'rgba(255, 206, 115, 0.45)',
};
