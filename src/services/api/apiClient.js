/* eslint-disable no-console */
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { getItem, setItem, removeItem, STORAGE_KEYS } from '../storage/storage';
import { API_BASE_URL, API_ENDPOINTS } from './apiList';
import { useStore } from '../../store';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'fetch',
  },
});

// Refresh token queue state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleForceLogout = () => {
  try {
    removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    removeItem(STORAGE_KEYS.USER_INFO);
    useStore.getState().logout();
  } catch (e) {
    if (__DEV__) {
      console.warn('[apiClient] Error during forced logout:', e);
    }
  }
};

// Request Interceptor: Attach access token only to authenticated requests
apiClient.interceptors.request.use(
  config => {
    try {
      // Public endpoints that must not send an Authorization header
      const isPublicEndpoint =
        config.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
        config.url?.includes(API_ENDPOINTS.AUTH.REGISTER) ||
        config.url?.includes(API_ENDPOINTS.AUTH.FORGOT_PASSWORD);

      if (isPublicEndpoint) {
        delete config.headers.Authorization;
      } else {
        const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {}

    if (__DEV__) {
      console.log(
        `🚀 [API ${config.method?.toUpperCase() || 'REQUEST'}] ${config.url}`,
        config.data ? config.data : '',
      );
    }

    return config;
  },
  error => Promise.reject(error),
);

// Response Interceptor: Automatically handle 401 Unauthorized via Refresh Token
apiClient.interceptors.response.use(
  response => {
    if (__DEV__) {
      console.log(`🟢 [API SUCCESS] ${response.config?.url} [${response.status}]:`, response.data);
    }
    return response;
  },
  async error => {
    if (__DEV__) {
      console.log(
        `🔴 [API ERROR] ${error.config?.url} [${error.response?.status}]:`,
        error.response?.data || error.message,
      );
    }

    const originalRequest = error.config;

    // Check if error is 401 and request has not already been retried
    const isAuthEndpoint =
      originalRequest?.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      originalRequest?.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN);

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      const refreshToken = getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        handleForceLogout();
        return Promise.reject(error);
      }

      // If a refresh is already underway, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(newToken => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Direct raw axios call so it bypasses apiClient interceptors
        const refreshResponse = await axios.post(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );

        const newAccessToken =
          refreshResponse.data?.access_token ||
          refreshResponse.data?.accessToken ||
          refreshResponse.data?.token;

        const newRefreshToken =
          refreshResponse.data?.refresh_token || refreshResponse.data?.refreshToken;

        if (newAccessToken) {
          // Persist the fresh tokens in MMKV
          setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
          if (newRefreshToken) {
            setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Release all queued pending requests
          processQueue(null, newAccessToken);

          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshError) {
        // Refresh failed (e.g. refresh token expired or revoked) -> logout
        processQueue(refreshError, null);
        handleForceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const api = {
  get: async (url, config = {}) => {
    const res = await apiClient.get(url, config);
    return res.data;
  },
  post: async (url, data = {}, config = {}) => {
    const res = await apiClient.post(url, data, config);
    return res.data;
  },
  put: async (url, data = {}, config = {}) => {
    const res = await apiClient.put(url, data, config);
    return res.data;
  },
  patch: async (url, data = {}, config = {}) => {
    const res = await apiClient.patch(url, data, config);
    return res.data;
  },
  delete: async (url, config = {}) => {
    const res = await apiClient.delete(url, config);
    return res.data;
  },
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const getErrorMessage = err => {
  if (!err) {
    return 'An unexpected error occurred. Please try again.';
  }

  const serverMsg =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.response?.data?.msg;

  if (
    typeof serverMsg === 'string' &&
    serverMsg.trim().length > 0 &&
    !/^(error|failed|bad request|internal server error)$/i.test(serverMsg.trim())
  ) {
    return serverMsg;
  }

  const status = err?.response?.status;
  const rawError = serverMsg || err?.message || '';

  if (status === 401 || status === 403 || /forbidden|unauthorized/i.test(rawError)) {
    return 'Incorrect email/phone or password. Please check your details and try again.';
  }
  if (status === 404 || /not found/i.test(rawError)) {
    return 'Requested resource not found. Please check your details and try again.';
  }
  if (status === 429 || /rate|too many/i.test(rawError)) {
    return 'Too many login attempts. Please wait a few moments and try again.';
  }
  if (status >= 500) {
    return 'Server is currently unavailable. Please try again shortly.';
  }
  if (err?.message === 'Network Error' || !err?.response) {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  return 'Something went wrong. Please check your details and try again.';
};

export default apiClient;
