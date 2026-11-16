// Each test loads the slice fresh, so it reads storage and the phone's setting as on a new start
const loadSlice = ({ phone, saved }) => {
  jest.resetModules();
  const { Appearance } = require('react-native');
  jest.spyOn(Appearance, 'getColorScheme').mockReturnValue(phone);
  if (saved) {
    require('../../../services/storage/storage').setItem('PETFRIENDLY_THEME_MODE_V2', saved);
  }
  return require('../themeSlice').createThemeSlice(
    jest.fn(),
    jest.fn(() => ({})),
  );
};

describe('themeSlice first start', () => {
  it('follows the phone when no theme was ever chosen (phone in dark mode)', () => {
    const slice = loadSlice({ phone: 'dark' });

    expect(slice.themeMode).toBe('system');
    expect(slice.isDarkMode).toBe(true);
  });

  it('follows the phone when no theme was ever chosen (phone in light mode)', () => {
    const slice = loadSlice({ phone: 'light' });

    expect(slice.themeMode).toBe('system');
    expect(slice.isDarkMode).toBe(false);
  });

  it('keeps a theme the user chose, whatever the phone says', () => {
    const slice = loadSlice({ phone: 'dark', saved: 'light' });

    expect(slice.themeMode).toBe('light');
    expect(slice.isDarkMode).toBe(false);
  });
});
