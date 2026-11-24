import { AppState } from 'react-native';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useOtaAutoUpdate, useOtaUpdate, useOtaVersionInfo } from '../useOtaUpdate';
import { useOtaStore, OTA_STATUS } from '../../services/ota/otaStore';
import * as service from '../../services/ota/otaService';
import { useAppUpdateStore } from '../../services/appUpdate/appUpdateStore';

jest.mock('../../services/ota/otaService', () => ({
  ...jest.requireActual('../../services/ota/otaService'),
  autoUpdate: jest.fn().mockResolvedValue(undefined),
  getVersionInfo: jest.fn(),
}));

describe('useOtaAutoUpdate', () => {
  let onChange;
  let remove;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
      onChange = callback;
      return { remove };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    AppState.addEventListener.mockRestore();
  });

  it('does not look for an OTA update while a required store update blocks the app', () => {
    useAppUpdateStore.getState().setAppUpdate({ mandatory: true });
    renderHook(() => useOtaAutoUpdate({ startDelayMs: 4000 }));

    act(() => {
      jest.advanceTimersByTime(4000);
      onChange('active');
    });

    expect(service.autoUpdate).not.toHaveBeenCalled();
    useAppUpdateStore.getState().resetAppUpdate();
  });

  it('checks shortly after the app starts, not instantly', () => {
    renderHook(() => useOtaAutoUpdate({ startDelayMs: 4000 }));

    expect(service.autoUpdate).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(service.autoUpdate).toHaveBeenCalledTimes(1);
  });

  it('checks again when the app returns to the foreground, not when it leaves', () => {
    renderHook(() => useOtaAutoUpdate());

    act(() => onChange('background'));
    expect(service.autoUpdate).not.toHaveBeenCalled();
    act(() => onChange('active'));
    expect(service.autoUpdate).toHaveBeenCalledTimes(1);
  });

  it('cleans up its timer and listener', () => {
    const { unmount } = renderHook(() => useOtaAutoUpdate({ startDelayMs: 4000 }));
    unmount();

    expect(remove).toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(service.autoUpdate).not.toHaveBeenCalled();
  });
});

describe('useOtaUpdate', () => {
  beforeEach(() => useOtaStore.getState().resetOta());

  it('follows the shared update state', () => {
    const { result } = renderHook(() => useOtaUpdate());
    expect(result.current.status).toBe(OTA_STATUS.IDLE);

    act(() => {
      useOtaStore.setState({ status: OTA_STATUS.DOWNLOADING, progress: 0.4 });
    });
    expect(result.current.status).toBe(OTA_STATUS.DOWNLOADING);
    expect(result.current.progress).toBe(0.4);
  });

  it('exposes the actions the screens need', () => {
    const { result } = renderHook(() => useOtaUpdate());
    ['check', 'download', 'restart', 'dismissBanner'].forEach(name =>
      expect(typeof result.current[name]).toBe('function'),
    );
  });
});

describe('useOtaVersionInfo', () => {
  it('loads the native version and the running update', async () => {
    service.getVersionInfo.mockResolvedValue({ appVersion: '1.0', label: 'v2', description: '' });
    const { result } = renderHook(() => useOtaVersionInfo());

    expect(result.current.appVersion).toBe('');
    await waitFor(() => expect(result.current.appVersion).toBe('1.0'));
    expect(result.current.label).toBe('v2');
  });
});
