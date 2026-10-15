import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  register: userData => client.post('/auth/register', userData),
  forgotPassword: email => client.post('/auth/forgot-password', { email }),
};
