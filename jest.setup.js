/* eslint-env jest */
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

// Extend testing-library matchers
require('@testing-library/react-native/build/matchers/extend-expect');

// Safe Area Context
jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// React Native Screens
jest.mock('react-native-screens', () => {
  const { View } = require('react-native');
  return {
    ...jest.requireActual('react-native-screens'),
    enableScreens: jest.fn(),
    enableFreeze: jest.fn(),
    ScreenContainer: View,
    Screen: View,
  };
});

// React Native MMKV (in-memory mock)
jest.mock('react-native-mmkv', () => {
  const storage = new Map();
  return {
    createMMKV: () => ({
      set: jest.fn((key, value) => {
        storage.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }),
      getString: jest.fn(key => {
        const val = storage.get(key);
        return val !== undefined ? String(val) : undefined;
      }),
      getNumber: jest.fn(key => {
        const val = storage.get(key);
        return val !== undefined ? Number(val) : undefined;
      }),
      getBoolean: jest.fn(key => {
        const val = storage.get(key);
        return val !== undefined ? val === 'true' || val === true : undefined;
      }),
      remove: jest.fn(key => storage.delete(key)),
      clearAll: jest.fn(() => storage.clear()),
      getAllKeys: jest.fn(() => Array.from(storage.keys())),
      contains: jest.fn(key => storage.has(key)),
    }),
  };
});

// Linear Gradient
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockLinearGradient = ({ children, ...props }) =>
    React.createElement(View, props, children);
  return MockLinearGradient;
});

// Vector Icons
const mockIcon = () => 'Icon';
jest.mock('react-native-vector-icons/Ionicons', () => mockIcon);
jest.mock('react-native-vector-icons/MaterialIcons', () => mockIcon);
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => mockIcon);
jest.mock('react-native-vector-icons/Feather', () => mockIcon);
jest.mock('react-native-vector-icons/FontAwesome', () => mockIcon);
jest.mock('react-native-vector-icons/FontAwesome5', () => mockIcon);
jest.mock('react-native-vector-icons/AntDesign', () => mockIcon);

// Fast Image
jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  const FastImage = props => React.createElement(Image, props);
  FastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  };
  FastImage.priority = {
    low: 'low',
    normal: 'normal',
    high: 'high',
  };
  FastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  FastImage.preload = jest.fn();
  return FastImage;
});

// React Native Video
jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return props => React.createElement(View, props);
});

// Image Picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// React Native Community DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockDateTimePicker = props => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockDateTimePicker,
    DateTimePickerAndroid: {
      open: jest.fn(options => {
        if (options && typeof options.onChange === 'function') {
          options.onChange({ type: 'set' }, options.value || new Date());
        }
      }),
      dismiss: jest.fn(),
    },
  };
});

// Mock Animated.loop to prevent infinite timer scheduling in screen animations
const { Animated } = require('react-native');
if (Animated && Animated.loop) {
  jest.spyOn(Animated, 'loop').mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  }));
}
