import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createPetSlice } from './slices/petSlice';

export const useStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createPetSlice(...a),
}));
