import axios from 'axios';
import { apiClient } from '../apiClient';
import { API_ENDPOINTS } from '../apiList';
import { getItem, setItem, STORAGE_KEYS } from '../../storage/storage';

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return { ...actual, post: jest.fn() };
});

// Serves 401 for the old token and 200 once the new one is sent, without touching the network
const stubServer = () => {
  apiClient.defaults.adapter = async config => {
    const ok = config.headers.Authorization === 'Bearer new-access';
    const response = { data: { ok }, status: ok ? 200 : 401, statusText: '', headers: {}, config };
    if (ok) {
      return response;
    }
    const error = new Error('Unauthorized');
    error.config = config;
    error.response = response;
    throw error;
  };
};

describe('token refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setItem(STORAGE_KEYS.ACCESS_TOKEN, 'old-access');
    setItem(STORAGE_KEYS.REFRESH_TOKEN, 'old-refresh');
    stubServer();
  });

  it('sends the refresh token with X-Requested-With, saves both new tokens and retries', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
    });

    const res = await apiClient.get('/me/pets');

    expect(res.data.ok).toBe(true);
    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toContain(API_ENDPOINTS.AUTH.REFRESH_TOKEN);
    expect(body).toEqual({ refresh_token: 'old-refresh' });
    expect(config.headers['X-Requested-With']).toBe('fetch');
    expect(getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('new-access');
    expect(getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh');
  });

  it('refreshes only once for several requests that fail together', async () => {
    axios.post.mockResolvedValue({
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
    });

    await Promise.all([apiClient.get('/a'), apiClient.get('/b'), apiClient.get('/c')]);

    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when the refresh fails because the network is down', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    await expect(apiClient.get('/me/pets')).rejects.toBeTruthy();

    expect(getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('old-refresh');
  });

  it('ends the session when the server rejects the refresh token', async () => {
    axios.post.mockRejectedValue({ response: { status: 401 }, message: 'expired' });

    await expect(apiClient.get('/me/pets')).rejects.toBeTruthy();

    expect(getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeFalsy();
  });
});
