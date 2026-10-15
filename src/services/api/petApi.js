import client from './client';

export const petApi = {
  getPets: params => client.get('/pets', { params }),
  getPetById: id => client.get(`/pets/${id}`),
  addPet: data => client.post('/pets', data),
  updatePet: (id, data) => client.put(`/pets/${id}`, data),
  deletePet: id => client.delete(`/pets/${id}`),
};
