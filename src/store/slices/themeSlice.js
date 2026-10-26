import { getItem, setItem } from '../../services/storage/storage';
import { Appearance } from 'react-native';

const THEME_STORAGE_KEY = 'PETFRIENDLY_THEME_MODE_V2';

const getInitialMode = () => {
  try {
    const saved = getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    // fallback
  }
  return 'dark';
};

export const createThemeSlice = (set, get) => {
  const initialMode = getInitialMode();
  const systemScheme = Appearance.getColorScheme() || 'dark';
  const isDark =
    initialMode === 'dark' || (initialMode === 'system' && systemScheme === 'dark');

  return {
    themeMode: initialMode, // 'light' | 'dark' | 'system'
    isDarkMode: isDark,
    accentColor: '#7C3AED',

    setThemeMode: mode => {
      setItem(THEME_STORAGE_KEY, mode);
      const currentSystem = Appearance.getColorScheme() || 'light';
      const dark =
        mode === 'dark' || (mode === 'system' && currentSystem === 'dark');
      set({ themeMode: mode, isDarkMode: dark });
    },

    toggleDarkMode: () => {
      const { isDarkMode } = get();
      const newMode = isDarkMode ? 'light' : 'dark';
      setItem(THEME_STORAGE_KEY, newMode);
      set({ themeMode: newMode, isDarkMode: !isDarkMode });
    },

    setAccentColor: color => {
      set({ accentColor: color });
    },
  };
};
