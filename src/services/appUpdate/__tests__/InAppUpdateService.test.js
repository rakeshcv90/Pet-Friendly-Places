import { Linking, Platform } from 'react-native';
import { getBuildNumber, getVersion } from 'react-native-device-info';
import { APP_UPDATE_CONFIG } from '../../../config/appUpdate';
import { removeItem, STORAGE_KEYS } from '../../storage/storage';
import { APP_UPDATE_STATUS, UPDATE_KIND, useAppUpdateStore } from '../appUpdateStore';
import {
  __resetAppUpdateForTests,
  applyCachedPolicy,
  autoCheckAppUpdate,
  checkForAppUpdate,
  completeFlexibleUpdate,
  openAppUpdateCheck,
  pickAndroidUpdateKind,
  startAppUpdate,
} from '../InAppUpdateService';

// The library stand-in: tests decide what the store answers
const mockLib = {
  checkNeedsUpdate: jest.fn(),
  startUpdate: jest.fn(),
  installUpdate: jest.fn(),
  addStatusUpdateListener: jest.fn(),
  addIntentSelectionListener: jest.fn(),
};
jest.mock('sp-react-native-in-app-updates', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockLib),
}));

const state = () => useAppUpdateStore.getState();

const androidUpdate = (extra = {}) => ({
  shouldUpdate: true,
  storeVersion: '7',
  other: {
    updateAvailability: 2,
    updatePriority: 0,
    isFlexibleUpdateAllowed: true,
    isImmediateUpdateAllowed: true,
    totalBytes: 5 * 1024 * 1024,
    versionCode: 7,
    ...extra,
  },
});

const iosUpdate = (extra = {}) => ({
  shouldUpdate: true,
  storeVersion: '1.5.0',
  other: {
    version: '1.5.0',
    trackId: 123456789,
    trackViewUrl: 'https://apps.apple.com/in/app/pet-friendly/id123456789?uo=4',
    releaseNotes: 'Faster maps',
    ...extra,
  },
});

const originalOS = Platform.OS;
const originalConfig = { ...APP_UPDATE_CONFIG };

// Reads the callbacks the service gave the library
const nativeStatus = () => mockLib.addStatusUpdateListener.mock.calls[0][0];
const nativeResult = () => mockLib.addIntentSelectionListener.mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(APP_UPDATE_CONFIG, originalConfig, {
    MINIMUM_SUPPORTED_VERSION: { android: '0.0.0', ios: '0.0.0' },
  });
  removeItem(STORAGE_KEYS.APP_UPDATE_POLICY);
  getVersion.mockReturnValue('1.0');
  getBuildNumber.mockReturnValue('1');
  mockLib.checkNeedsUpdate.mockResolvedValue({ shouldUpdate: false, other: {} });
  mockLib.startUpdate.mockResolvedValue(undefined);
  global.fetch = jest.fn();
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  Platform.OS = 'android';
  __resetAppUpdateForTests();
});

afterEach(() => {
  Platform.OS = originalOS;
  jest.restoreAllMocks();
});

describe('Android (Google Play)', () => {
  it('reports an up to date app', async () => {
    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.UP_TO_DATE);
    expect(state().installedVersion).toBe('1.0');
    expect(state().installedBuild).toBe('1');
  });

  it('compares the build number (versionCode), not the version name', async () => {
    await checkForAppUpdate({ source: 'manual' });

    const options = mockLib.checkNeedsUpdate.mock.calls[0][0];
    expect(options.curVersion).toBe('1');
    expect(options.customVersionComparator('12', '9')).toBe(1);
    expect(options.customVersionComparator('3', '3')).toBe(0);
  });

  it('offers a flexible update when Google Play allows it', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate());

    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.AVAILABLE);
    expect(state().kind).toBe(UPDATE_KIND.FLEXIBLE);
    expect(state().storeVersion).toBe('Build 7');
    expect(state().totalBytes).toBe(5 * 1024 * 1024);
    expect(state().mandatory).toBe(false);
  });

  it('prefers the immediate update for a high priority release', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate({ updatePriority: 5 }));

    await checkForAppUpdate({ source: 'manual' });

    expect(state().kind).toBe(UPDATE_KIND.IMMEDIATE);
    // High priority still does not block the app: only the minimum version does that
    expect(state().mandatory).toBe(false);
  });

  it('uses the immediate update when the version is below the minimum', async () => {
    APP_UPDATE_CONFIG.MINIMUM_SUPPORTED_VERSION = { android: '1.2.0', ios: '0.0.0' };
    mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate());

    await checkForAppUpdate({ source: 'auto' });

    expect(state().mandatory).toBe(true);
    expect(state().kind).toBe(UPDATE_KIND.IMMEDIATE);
    // The blocking screen handles it: the optional dialog stays closed
    expect(state().modalVisible).toBe(false);
  });

  describe('which update type', () => {
    const allowed = { immediateAllowed: true, flexibleAllowed: true };

    it('follows what Google Play allows', () => {
      expect(pickAndroidUpdateKind({ ...allowed, mandatory: false, priority: 0 })).toBe('flexible');
      expect(pickAndroidUpdateKind({ ...allowed, mandatory: true, priority: 0 })).toBe('immediate');
      expect(pickAndroidUpdateKind({ ...allowed, mandatory: false, priority: 4 })).toBe('immediate');
      expect(
        pickAndroidUpdateKind({ immediateAllowed: false, flexibleAllowed: true, mandatory: true, priority: 5 }),
      ).toBe('flexible');
      expect(
        pickAndroidUpdateKind({ immediateAllowed: true, flexibleAllowed: false, mandatory: false, priority: 0 }),
      ).toBe('immediate');
      expect(
        pickAndroidUpdateKind({ immediateAllowed: false, flexibleAllowed: false, mandatory: false, priority: 0 }),
      ).toBe('store');
    });
  });

  describe('flexible update', () => {
    beforeEach(async () => {
      mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate());
      await checkForAppUpdate({ source: 'manual' });
    });

    it('starts the Google Play flexible flow', async () => {
      await startAppUpdate();

      expect(mockLib.startUpdate).toHaveBeenCalledWith({ updateType: 0 });
      expect(state().status).toBe(APP_UPDATE_STATUS.DOWNLOADING);
    });

    it('tracks the download and asks for a restart when it is done', async () => {
      await startAppUpdate();

      nativeStatus()({ status: 2, bytesDownloaded: 25, totalBytesToDownload: 100 });
      expect(state().status).toBe(APP_UPDATE_STATUS.DOWNLOADING);
      expect(state().progress).toBe(0.25);

      // The dialog may have been hidden while it downloaded: it comes back for the restart
      useAppUpdateStore.getState().setAppUpdate({ modalVisible: false });
      nativeStatus()({ status: 11, bytesDownloaded: 100, totalBytesToDownload: 100 });
      expect(state().status).toBe(APP_UPDATE_STATUS.DOWNLOADED);
      expect(state().modalVisible).toBe(true);

      completeFlexibleUpdate();
      expect(mockLib.installUpdate).toHaveBeenCalledTimes(1);
    });

    it('goes back to "available" when the user cancels in Google Play', async () => {
      await startAppUpdate();

      nativeResult()('6');

      expect(state().status).toBe(APP_UPDATE_STATUS.AVAILABLE);
      expect(state().cancelled).toBe(true);
    });

    it('shows a failed download as an error', async () => {
      await startAppUpdate();

      nativeStatus()({ status: 5, bytesDownloaded: 0, totalBytesToDownload: 0 });

      expect(state().status).toBe(APP_UPDATE_STATUS.ERROR);
    });

    it('registers the Google Play listeners only once', async () => {
      await startAppUpdate();
      await startAppUpdate();

      expect(mockLib.addStatusUpdateListener).toHaveBeenCalledTimes(1);
      expect(mockLib.addIntentSelectionListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('immediate update', () => {
    beforeEach(async () => {
      mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate({ updatePriority: 5 }));
      await checkForAppUpdate({ source: 'manual' });
    });

    it('starts the full-screen Google Play flow', async () => {
      await startAppUpdate();

      expect(mockLib.startUpdate).toHaveBeenCalledWith({ updateType: 1 });
      expect(state().status).toBe(APP_UPDATE_STATUS.UPDATING);
    });

    it('can be cancelled, and the update is offered again', async () => {
      await startAppUpdate();

      nativeResult()('6');

      expect(state().status).toBe(APP_UPDATE_STATUS.AVAILABLE);
      expect(state().cancelled).toBe(true);
      await startAppUpdate();
      expect(mockLib.startUpdate).toHaveBeenCalledTimes(2);
    });

    it('opens the store page when Google Play refuses this update type', async () => {
      mockLib.startUpdate.mockRejectedValue(new Error('Update type unavailable'));

      await startAppUpdate();

      expect(Linking.openURL).toHaveBeenCalledWith('market://details?id=com.petfriendly');
    });
  });

  it('resumes an immediate update that Google Play already started', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue({
      shouldUpdate: false,
      other: { updateAvailability: 3 },
    });

    await checkForAppUpdate({ source: 'auto' });

    expect(mockLib.startUpdate).toHaveBeenCalledWith({ updateType: 1 });
    expect(state().status).toBe(APP_UPDATE_STATUS.UPDATING);
  });

  it('explains that updates need an install from Google Play', async () => {
    mockLib.checkNeedsUpdate.mockRejectedValue(
      new Error('Exception: Install Error(-10): The app is not owned by any user on this device.'),
    );

    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.UNAVAILABLE);
    expect(state().reason).toBe('notFromStore');
  });

  it('reports being offline', async () => {
    mockLib.checkNeedsUpdate.mockRejectedValue(new Error('Network request failed'));

    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.OFFLINE);
    expect(state().error).toMatch(/offline/i);
  });

  it('reports any other failure, and a later check can recover', async () => {
    mockLib.checkNeedsUpdate.mockRejectedValueOnce(new Error('boom'));

    await checkForAppUpdate({ source: 'manual' });
    expect(state().status).toBe(APP_UPDATE_STATUS.ERROR);

    await checkForAppUpdate({ source: 'manual' });
    expect(state().status).toBe(APP_UPDATE_STATUS.UP_TO_DATE);
  });
});

describe('iOS (App Store)', () => {
  beforeEach(() => {
    Platform.OS = 'ios';
  });

  it('finds the newest App Store version and shows the notes', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue(iosUpdate());

    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.AVAILABLE);
    expect(state().storeVersion).toBe('1.5.0');
    expect(state().releaseNotes).toBe('Faster maps');
    expect(state().kind).toBe(UPDATE_KIND.STORE);
    // The lookup uses the app's own bundle id and compares the version name
    expect(mockLib.checkNeedsUpdate.mock.calls[0][0]).toMatchObject({
      bundleId: 'com.petfriendly',
      curVersion: '1.0',
    });
  });

  it("opens this app's App Store page, without tracking parameters", async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue(iosUpdate());
    await checkForAppUpdate({ source: 'manual' });

    await startAppUpdate();

    expect(Linking.openURL).toHaveBeenCalledWith('https://apps.apple.com/in/app/pet-friendly/id123456789');
    expect(mockLib.startUpdate).not.toHaveBeenCalled();
  });

  it('reports an up to date app', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue({
      shouldUpdate: false,
      storeVersion: '1.0.0',
      other: { version: '1.0.0', trackViewUrl: 'https://apps.apple.com/app/id1' },
    });

    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.UP_TO_DATE);
  });

  it('says so when the app is not on the App Store yet, and never invents a store link', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValue({
      shouldUpdate: false,
      reason: "Couldn't fetch the latest version",
      other: { updateIsAvailable: false },
    });

    await checkForAppUpdate({ source: 'manual' });
    expect(state().status).toBe(APP_UPDATE_STATUS.UNAVAILABLE);
    expect(state().reason).toBe('notPublished');

    await startAppUpdate();
    expect(Linking.openURL).not.toHaveBeenCalled();
    expect(state().status).toBe(APP_UPDATE_STATUS.ERROR);
  });

  it('uses the configured App Store id only when Apple has no listing', async () => {
    APP_UPDATE_CONFIG.IOS_APP_STORE_ID = '987654321';
    mockLib.checkNeedsUpdate.mockResolvedValue({ shouldUpdate: false, other: {} });
    await checkForAppUpdate({ source: 'manual' });

    await startAppUpdate();

    expect(Linking.openURL).toHaveBeenCalledWith('https://apps.apple.com/app/id987654321');
  });

  it('reports being offline', async () => {
    mockLib.checkNeedsUpdate.mockRejectedValue(new Error('TypeError: Network request failed'));

    await checkForAppUpdate({ source: 'manual' });

    expect(state().status).toBe(APP_UPDATE_STATUS.OFFLINE);
  });

  it('blocks a version below the minimum supported version', async () => {
    APP_UPDATE_CONFIG.MINIMUM_SUPPORTED_VERSION = { android: '0.0.0', ios: '1.2.0' };
    mockLib.checkNeedsUpdate.mockResolvedValue(iosUpdate());

    await checkForAppUpdate({ source: 'auto' });

    expect(state().mandatory).toBe(true);
    expect(state().minimumVersion).toBe('1.2.0');
    expect(state().modalVisible).toBe(false);
  });
});

describe('optional update prompts', () => {
  beforeEach(() => {
    mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate());
  });

  it('opens the dialog for an automatic check, once per store version per session', async () => {
    await checkForAppUpdate({ source: 'auto' });
    expect(state().modalVisible).toBe(true);

    // "Later"
    useAppUpdateStore.getState().setAppUpdate({ modalVisible: false });
    await checkForAppUpdate({ source: 'auto' });
    expect(state().modalVisible).toBe(false);
  });

  it('prompts again for a newer store version', async () => {
    await checkForAppUpdate({ source: 'auto' });
    useAppUpdateStore.getState().setAppUpdate({ modalVisible: false });

    mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate({ versionCode: 8 }));
    mockLib.checkNeedsUpdate.mockResolvedValue({ ...androidUpdate(), storeVersion: '8' });
    await checkForAppUpdate({ source: 'auto' });

    expect(state().modalVisible).toBe(true);
  });

  it('does not open on top of the OTA sheet', async () => {
    require('../../ota/otaStore').useOtaStore.setState({ sheetOpen: true });

    await checkForAppUpdate({ source: 'auto' });

    expect(state().modalVisible).toBe(false);
    require('../../ota/otaStore').useOtaStore.setState({ sheetOpen: false });
  });

  it('a manual check always shows the dialog, even for a version already offered', async () => {
    await checkForAppUpdate({ source: 'auto' });
    useAppUpdateStore.getState().setAppUpdate({ modalVisible: false });

    await openAppUpdateCheck();

    expect(state().modalVisible).toBe(true);
    expect(state().status).toBe(APP_UPDATE_STATUS.AVAILABLE);
  });

  it('stays quiet when an automatic check finds nothing or fails', async () => {
    mockLib.checkNeedsUpdate.mockResolvedValueOnce({ shouldUpdate: false, other: {} });
    await checkForAppUpdate({ source: 'auto' });
    expect(state().modalVisible).toBe(false);

    mockLib.checkNeedsUpdate.mockRejectedValueOnce(new Error('Network request failed'));
    await checkForAppUpdate({ source: 'auto' });
    expect(state().modalVisible).toBe(false);
  });
});

describe('automatic checks', () => {
  it('does not run two checks at once', async () => {
    let release;
    mockLib.checkNeedsUpdate.mockReturnValue(
      new Promise(resolve => {
        release = () => resolve({ shouldUpdate: false, other: {} });
      }),
    );

    const first = checkForAppUpdate({ source: 'auto' });
    const second = checkForAppUpdate({ source: 'manual' });
    release();
    await Promise.all([first, second]);

    expect(mockLib.checkNeedsUpdate).toHaveBeenCalledTimes(1);
  });

  it('checks at most once per interval in the foreground, but always when forced', async () => {
    await autoCheckAppUpdate({ force: true });
    await autoCheckAppUpdate();
    expect(mockLib.checkNeedsUpdate).toHaveBeenCalledTimes(1);

    await autoCheckAppUpdate({ force: true });
    expect(mockLib.checkNeedsUpdate).toHaveBeenCalledTimes(2);
  });

  it('always rechecks while the app is blocked', async () => {
    APP_UPDATE_CONFIG.MINIMUM_SUPPORTED_VERSION = { android: '1.2.0', ios: '1.2.0' };
    await autoCheckAppUpdate({ force: true });
    expect(state().mandatory).toBe(true);

    await autoCheckAppUpdate();

    expect(mockLib.checkNeedsUpdate).toHaveBeenCalledTimes(2);
  });

  it('unblocks once the installed version meets the minimum', async () => {
    APP_UPDATE_CONFIG.MINIMUM_SUPPORTED_VERSION = { android: '1.2.0', ios: '1.2.0' };
    await autoCheckAppUpdate({ force: true });
    expect(state().mandatory).toBe(true);

    getVersion.mockReturnValue('1.2.0');
    await autoCheckAppUpdate();

    expect(state().mandatory).toBe(false);
  });

  it('leaves a running download or a restart prompt alone', async () => {
    useAppUpdateStore.getState().setAppUpdate({ status: APP_UPDATE_STATUS.DOWNLOADING });
    await autoCheckAppUpdate({ force: true });
    useAppUpdateStore.getState().setAppUpdate({ status: APP_UPDATE_STATUS.DOWNLOADED });
    await autoCheckAppUpdate({ force: true });

    expect(mockLib.checkNeedsUpdate).not.toHaveBeenCalled();
  });
});

describe('minimum version from a remote file', () => {
  beforeEach(() => {
    APP_UPDATE_CONFIG.REMOTE_POLICY_URL = 'https://example.com/app-policy.json';
  });

  const reply = json => ({ ok: true, json: () => Promise.resolve(json) });

  it('blocks a version below the remote minimum for this platform', async () => {
    global.fetch.mockResolvedValue(reply({ android: { minimumVersion: '1.1.0' }, ios: { minimumVersion: '0.5.0' } }));

    await checkForAppUpdate({ source: 'auto' });

    expect(state().mandatory).toBe(true);
    expect(state().minimumVersion).toBe('1.1.0');
  });

  it('does not block when the remote minimum is not above the installed version', async () => {
    global.fetch.mockResolvedValue(reply({ android: { minimumVersion: '1.0.0' } }));

    await checkForAppUpdate({ source: 'auto' });

    expect(state().mandatory).toBe(false);
  });

  it('shows the latest version and the message from the remote file', async () => {
    global.fetch.mockResolvedValue(
      reply({ android: { minimumVersion: '0.0.0', latestVersion: '1.4.0', message: 'New trips page' } }),
    );
    mockLib.checkNeedsUpdate.mockResolvedValue(androidUpdate());

    await checkForAppUpdate({ source: 'manual' });

    expect(state().storeVersion).toBe('1.4.0');
    expect(state().releaseNotes).toBe('New trips page');
  });

  it('keeps a blocked version blocked when the file cannot be read later', async () => {
    global.fetch.mockResolvedValueOnce(reply({ android: { minimumVersion: '1.1.0' } }));
    await checkForAppUpdate({ source: 'auto' });
    expect(state().mandatory).toBe(true);

    // Next start, offline: the last file read is used before any network call
    __resetAppUpdateForTests();
    applyCachedPolicy();
    expect(state().mandatory).toBe(true);

    global.fetch.mockRejectedValue(new Error('Network request failed'));
    await checkForAppUpdate({ source: 'auto' });
    expect(state().mandatory).toBe(true);
  });

  it('never blocks because of a bad file or a failed request', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) });
    await checkForAppUpdate({ source: 'auto' });
    expect(state().mandatory).toBe(false);

    global.fetch.mockResolvedValue(reply({ android: { minimumVersion: 'soon' } }));
    await checkForAppUpdate({ source: 'auto' });
    expect(state().mandatory).toBe(false);
  });

  it('shows the blocking state even when the store cannot be reached', async () => {
    global.fetch.mockResolvedValue(reply({ android: { minimumVersion: '1.1.0' } }));
    mockLib.checkNeedsUpdate.mockRejectedValue(new Error('Network request failed'));

    await checkForAppUpdate({ source: 'auto' });

    expect(state().mandatory).toBe(true);
    expect(state().status).toBe(APP_UPDATE_STATUS.OFFLINE);
  });
});
