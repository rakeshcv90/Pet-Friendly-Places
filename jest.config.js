module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-community|@react-navigation|react-native-mmkv|react-native-nitro-modules|react-native-size-matters|react-native-vector-icons|react-native-linear-gradient|react-native-video|react-native-keyboard-aware-scroll-view)/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
