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
  const systemScheme = Appearance.getColorScheme();
  const isDark =
    initialMode === 'dark' || (initialMode === 'system' && systemScheme === 'dark');

  // Reactively listen to device system appearance changes when in 'system' mode
  try {
    Appearance.addChangeListener?.(({ colorScheme }) => {
      const state = get?.();
      if (state?.themeMode === 'system') {
        set({ isDarkMode: colorScheme === 'dark' });
      }
    });
  } catch (e) {
    // safely ignore in environments where addChangeListener is not present
  }

  return {
    themeMode: initialMode, // 'light' | 'dark' | 'system'
    isDarkMode: isDark,
    accentColor: '#7C3AED',

    syncSystemTheme: scheme => {
      const { themeMode } = get();
      if (themeMode === 'system') {
        const detected = scheme || Appearance.getColorScheme();
        if (detected === 'dark' || detected === 'light') {
          set({ isDarkMode: detected === 'dark' });
        }
      }
    },

    setThemeMode: mode => {
      setItem(THEME_STORAGE_KEY, mode);
      let nextDark;
      if (mode === 'dark') {
        nextDark = true;
      } else if (mode === 'light') {
        nextDark = false;
      } else {
        // 'system' / Auto: query device default theme
        const currentSystem = Appearance.getColorScheme();
        nextDark = currentSystem === 'dark';
      }
      set({ themeMode: mode, isDarkMode: nextDark });
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
