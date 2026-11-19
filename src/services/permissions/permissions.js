import { Platform } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  checkNotifications,
  requestNotifications,
  openSettings,
} from 'react-native-permissions';

// The two permissions asked for after sign-in. Photos and videos need none: the photo picker lets
// the user choose items without the app getting access to the library. The camera is asked for in
// the moment someone takes a picture.
const LOCATION = Platform.select({
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  default: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
});

const CAMERA = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  default: PERMISSIONS.ANDROID.CAMERA,
});

// One vocabulary for both platforms:
//  granted      allowed
//  denied       not asked yet, or refused once (the system prompt can still be shown)
//  blocked      refused for good: only the phone's Settings can change it
//  unavailable  this phone cannot do it
const normalize = result => {
  if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
    return 'granted';
  }
  if (result === RESULTS.BLOCKED) {
    return 'blocked';
  }
  if (result === RESULTS.UNAVAILABLE) {
    return 'unavailable';
  }
  return 'denied';
};

const safe = async (run, fallback = 'unavailable') => {
  try {
    return await run();
  } catch (e) {
    return fallback;
  }
};

export const getLocationStatus = () => safe(async () => normalize(await check(LOCATION)));

export const getNotificationStatus = () =>
  safe(async () => normalize((await checkNotifications()).status));

export const requestLocation = () => safe(async () => normalize(await request(LOCATION)));

export const requestNotificationPermission = () =>
  safe(async () => normalize((await requestNotifications(['alert', 'sound', 'badge'])).status));

export const getCameraStatus = () => safe(async () => normalize(await check(CAMERA)));

export const requestCamera = () => safe(async () => normalize(await request(CAMERA)));

export const getPermissionStatuses = async () => {
  const [location, notifications] = await Promise.all([
    getLocationStatus(),
    getNotificationStatus(),
  ]);
  return { location, notifications };
};

export const openPhoneSettings = () => safe(() => openSettings(), undefined);
