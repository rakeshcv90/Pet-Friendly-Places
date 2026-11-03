// Website (not the API): used for links that open in the browser, e.g. the community guidelines
export const WEB_BASE_URL = 'https://petfriendlyplaces.in';

export const API_BASE_URL =
  'https://af764897-7306-4080-80a7-e25f9325ccdf-00-1p3we5yilmeoo-jtyfzm0j.sisko.replit.dev/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/account/mobile/login',
    REGISTER: '/auth/account/register',
    FORGOT_PASSWORD: '/auth/account/forgot-password',
    REFRESH_TOKEN: '/auth/account/mobile/refresh',
    LOGOUT: '/auth/account/mobile/logout',
  },

  // User Profile & Preferences
  USER: {
    PROFILE: '/auth/account/mobile/me',
    HOME_DATA: '/discovery/mobile-home',
    CITIES: '/discovery/cities',
    ROAD_TRIP: '/routes?status=published',
    TRAVEL_STORY: '/stories',
    ARTICLES: '/articles',
    REQUEST_CITY: '/mobile/cities/known',
  },

  // Travelling Tails leaderboard (public): ?window=week|month|all&limit=20
  LEADERBOARD: '/leaderboard',

  // Community (public, no auth required)
  COMMUNITY: {
    LIST: '/community/communities',
    MEMBERSHIPS: '/community/memberships',
    MEDIA_UPLOAD: '/community/media/upload',
    POSTS: '/community/posts',
    POST_DETAIL: slug => `/community/posts/${slug}`,
    POST_REPLIES: slug => `/community/posts/${slug}/replies`,
    POST_ACCEPT: slug => `/community/posts/${slug}/accept`,
    REPORTS: '/community/reports',
  },
};

export default API_ENDPOINTS;
