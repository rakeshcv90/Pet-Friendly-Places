import { create } from 'zustand';
import { createAuthSlice } from './slices/authSlice';
import { createPetSlice } from './slices/petSlice';
import { createLocationSlice } from './slices/locationSlice';
import { createThemeSlice } from './slices/themeSlice';

// Zustand store for UI & client-side state
export const useStore = create((...a) => ({
  ...createAuthSlice(...a),
  ...createPetSlice(...a),
  ...createLocationSlice(...a),
  ...createThemeSlice(...a),
}));

