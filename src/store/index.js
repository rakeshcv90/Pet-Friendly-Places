import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createPetSlice } from './slices/petSlice';

// Zustand store for UI & client-side state
export const useStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createPetSlice(...a),
}));

