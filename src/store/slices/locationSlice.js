import { getItem, setItem, STORAGE_KEYS } from '../../services/storage/storage';

export const createLocationSlice = set => ({
  currentLocation: getItem(STORAGE_KEYS.SELECTED_LOCATION) || null,

  setCurrentLocation: location => {
    if (location) {
      setItem(STORAGE_KEYS.SELECTED_LOCATION, location);
    }
    set({ currentLocation: location });
  },
});
