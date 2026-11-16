import { api, queryClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiList';
import { removeItem, STORAGE_KEYS } from '../storage/storage';
import { useStore } from '../../store';

// Signs the user out. The server is told first, while the access token is still available:
//  - this device: POST /auth/account/mobile/logout revokes this session and its refresh tokens
//  - all devices: POST /auth/account/mobile/logout-all revokes every mobile session of the account
// The device is then cleared whatever the server answered, so a failed request (offline, expired
// token) never leaves the user stuck signed in. Resolves to whether the server confirmed it.
export const signOut = async ({ allDevices = false } = {}) => {
  let revoked = false;
  try {
    await api.post(allDevices ? API_ENDPOINTS.AUTH.LOGOUT_ALL : API_ENDPOINTS.AUTH.LOGOUT);
    revoked = true;
  } catch (e) {
    // Cleared below regardless
  }

  // Tokens, user and location, plus everything cached for this user
  useStore.getState().logout();
  [
    STORAGE_KEYS.COMMUNITY_MEMBERSHIPS,
    STORAGE_KEYS.COMMUNITY_PENDING_REPLIES,
    STORAGE_KEYS.TAILS_GUIDE_SESSION_TOKEN,
    STORAGE_KEYS.SAVED_TRIPS,
  ].forEach(removeItem);
  queryClient.clear();

  return revoked;
};
