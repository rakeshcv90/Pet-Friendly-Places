import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { setItem, STORAGE_KEYS } from '../services/storage/storage';
import { useStore } from '../store';

export const useLogin = () => {
  const setAuthInfo = useStore(state => state.setAuthInfo);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: credentials => api.post(API_ENDPOINTS.AUTH.LOGIN, credentials),

    retry: 0,

    onSuccess: data => {
      const token = data?.access_token;
      const refreshToken = data?.refresh_token;
      const user = data?.account;

      if (!data?.ok || !token) {
        console.warn('[Login] Missing success status or access token.');
        return;
      }

      setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

      if (refreshToken) {
        setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }

      if (user) {
        setItem(STORAGE_KEYS.USER_INFO, user);
      }

      setAuthInfo(user || null, token);
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },

    onError: error => {},
  });

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
};
export const useRegister = () => {
  const mutation = useMutation({
    mutationFn: payload => api.post(API_ENDPOINTS.AUTH.REGISTER, payload),
    retry: 0,

    onSuccess: data => {
      console.log('Registration successful', data);
    },
  });

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
};

export const useForgotPassword = () => {
  const mutation = useMutation({
    mutationFn: async payload => {
      const email = typeof payload === 'string' ? payload.trim() : payload?.email?.trim();
      return await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    },
    retry: 0,
  });

  return {
    forgotPassword: mutation.mutate,
    forgotPasswordAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error ? getErrorMessage(mutation.error) : null,
    reset: mutation.reset,
  };
};
