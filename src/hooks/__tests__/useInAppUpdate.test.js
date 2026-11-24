import { AppState } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { useAppUpdateAutoCheck, useAppVersionLabel, useInAppUpdate } from '../useInAppUpdate';
import { useAppUpdateStore, APP_UPDATE_STATUS } from '../../services/appUpdate/appUpdateStore';
import * as service from '../../services/appUpdate/InAppUpdateService';

jest.mock('../../services/appUpdate/InAppUpdateService', () => ({
  ...jest.requireActual('../../services/appUpdate/InAppUpdateService'),
  applyCachedPolicy: jest.fn(),
  autoCheckAppUpdate: jest.fn().mockResolvedValue(undefined),
  checkForAppUpdate: jest.fn().mockResolvedValue(undefined),
  openAppUpdateCheck: jest.fn(),
  startAppUpdate: jest.fn(),
  completeFlexibleUpdate: jest.fn(),
}));

describe('useAppUpdateAutoCheck', () => {
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

  it('applies the last known minimum version at once, before any network call', () => {
    renderHook(() => useAppUpdateAutoCheck({ startDelayMs: 2500 }));

    expect(service.applyCachedPolicy).toHaveBeenCalledTimes(1);
    expect(service.autoCheckAppUpdate).not.toHaveBeenCalled();
  });

  it('checks shortly after start-up, not instantly, so start-up is not slowed down', () => {
    renderHook(() => useAppUpdateAutoCheck({ startDelayMs: 2500 }));

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(service.autoCheckAppUpdate).toHaveBeenCalledWith({ force: true });
  });

  it('checks when the app comes back to the foreground, not when it goes away', () => {
    renderHook(() => useAppUpdateAutoCheck({ startDelayMs: 2500 }));

    act(() => onChange('background'));
    expect(service.autoCheckAppUpdate).not.toHaveBeenCalled();

    act(() => onChange('active'));
    expect(service.autoCheckAppUpdate).toHaveBeenCalledWith();
  });

  it('stops listening and cancels the first check when it unmounts', () => {
    const { unmount } = renderHook(() => useAppUpdateAutoCheck({ startDelayMs: 2500 }));

    unmount();
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(service.autoCheckAppUpdate).not.toHaveBeenCalled();
  });
});

describe('useInAppUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppUpdateStore.getState().resetAppUpdate();
  });

  it('exposes the shared state and the actions', () => {
    const { result } = renderHook(() => useInAppUpdate());

    expect(result.current.status).toBe(APP_UPDATE_STATUS.IDLE);

    act(() => {
      result.current.check();
      result.current.update();
      result.current.restart();
    });
    expect(service.checkForAppUpdate).toHaveBeenCalledWith({ source: 'manual' });
    expect(service.startAppUpdate).toHaveBeenCalled();
    expect(service.completeFlexibleUpdate).toHaveBeenCalled();

    act(() => result.current.later());
    expect(useAppUpdateStore.getState().modalVisible).toBe(false);
  });
});

describe('useAppVersionLabel', () => {
  it('shows the native version and build, never the OTA label', () => {
    const { result } = renderHook(() => useAppVersionLabel());

    expect(result.current).toBe('v1.0 (1)');
  });
});
