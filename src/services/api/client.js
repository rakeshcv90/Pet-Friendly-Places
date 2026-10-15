import axios from 'axios';
import { getItem, STORAGE_KEYS } from '../storage/storage';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.example.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
client.interceptors.request.use(
  config => {
    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response Interceptor
client.interceptors.response.use(
  response => response,
  error => {
    // Global error handling
    if (error.response) {
      if (error.response.status === 401) {
        // Handle unauthorized access (e.g., redirect to login, clear token)
      }
    }
    return Promise.reject(error);
  },
);

export default client;
