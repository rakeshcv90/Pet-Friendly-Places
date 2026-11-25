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

// React Native Keychain (in-memory mock)
jest.mock('react-native-keychain', () => {
  const saved = {};
  return {
    ACCESSIBLE: {
      AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
      WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
    },
    ACCESS_CONTROL: { BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BiometryAnyOrDevicePasscode' },
    isPasscodeAuthAvailable: jest.fn(async () => true),
    getSupportedBiometryType: jest.fn(async () => null),
    setGenericPassword: jest.fn(async (username, password, options = {}) => {
      saved[options.service || 'default'] = { username, password };
      return { service: options.service || 'default' };
    }),
    getGenericPassword: jest.fn(async (options = {}) => saved[options.service || 'default'] || false),
    resetGenericPassword: jest.fn(async (options = {}) => {
      delete saved[options.service || 'default'];
      return true;
    }),
  };
});

// React Native Permissions (everything granted unless a test changes it)
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: { ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION' },
    IOS: { LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE' },
  },
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    LIMITED: 'limited',
  },
  check: jest.fn(async () => 'denied'),
  request: jest.fn(async () => 'granted'),
  checkNotifications: jest.fn(async () => ({ status: 'denied' })),
  requestNotifications: jest.fn(async () => ({ status: 'granted' })),
  openSettings: jest.fn(async () => undefined),
}));

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

// The header bell reads the notification hooks, which need a QueryClient. Screen tests render the
// header without one, so by default the hooks return "no notifications". Tests of the notification
// feature itself use jest.requireActual('./src/hooks/useNotifications') for the real implementation.
jest.mock('./src/hooks/useNotifications', () => {
  const actual = jest.requireActual('./src/hooks/useNotifications');
  const idle = { mutate: jest.fn() };
  return {
    ...actual,
    useUnreadCount: () => ({ data: 0 }),
    useNotifications: () => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() }),
    useMarkRead: () => idle,
    useMarkAllRead: () => idle,
  };
});

// Revopush OTA SDK. The real module needs its native side, so tests use this stand-in: the
// codePush(options) wrapper returns the component untouched and the API calls are mocks.
jest.mock('@revopush/react-native-code-push', () => {
  const codePush = jest.fn(() => component => component);
  Object.assign(codePush, {
    checkForUpdate: jest.fn().mockResolvedValue(null),
    getConfiguration: jest.fn().mockResolvedValue({ appVersion: '1.0', deploymentKey: 'key' }),
    getUpdateMetadata: jest.fn().mockResolvedValue(null),
    notifyAppReady: jest.fn().mockResolvedValue(undefined),
    restartApp: jest.fn(),
    sync: jest.fn(),
    InstallMode: { IMMEDIATE: 0, ON_NEXT_RESTART: 1, ON_NEXT_RESUME: 2, ON_NEXT_SUSPEND: 3 },
    CheckFrequency: { ON_APP_START: 0, ON_APP_RESUME: 1, MANUAL: 2 },
    SyncStatus: {},
    UpdateState: { RUNNING: 0, PENDING: 1, LATEST: 2 },
  });
  return { __esModule: true, default: codePush };
});

// Native app version, for the store-update check (needs the native module otherwise)
jest.mock('react-native-device-info', () => ({
  __esModule: true,
  getVersion: jest.fn(() => '1.0'),
  getBuildNumber: jest.fn(() => '1'),
  getBundleId: jest.fn(() => 'com.cvinfotech.petfriendlyplaces'),
}));

// Google Play in-app updates / App Store lookup. The real one needs its native side, so tests use
// this stand-in; a test that cares about a store reply sets checkNeedsUpdate itself.
jest.mock('sp-react-native-in-app-updates', () => {
  const InAppUpdates = jest.fn().mockImplementation(() => ({
    checkNeedsUpdate: jest.fn().mockResolvedValue({ shouldUpdate: false, other: {} }),
    startUpdate: jest.fn().mockResolvedValue(undefined),
    installUpdate: jest.fn(),
    addStatusUpdateListener: jest.fn(),
    removeStatusUpdateListener: jest.fn(),
    addIntentSelectionListener: jest.fn(),
    removeIntentSelectionListener: jest.fn(),
  }));
  return {
    __esModule: true,
    default: InAppUpdates,
    IAUUpdateKind: { FLEXIBLE: 0, IMMEDIATE: 1 },
  };
});
