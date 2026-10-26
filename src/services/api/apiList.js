/**
 * Centralized API List & Endpoints for PetFriendly Places
 */

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
  },
};

export default API_ENDPOINTS;
