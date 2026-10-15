import client from './client';

export const userApi = {
  getProfile: () => client.get('/users/profile'),
  updateProfile: data => client.put('/users/profile', data),
  getFavorites: () => client.get('/users/favorites'),
  addFavorite: petId => client.post(`/users/favorites/${petId}`),
  removeFavorite: petId => client.delete(`/users/favorites/${petId}`),
};
