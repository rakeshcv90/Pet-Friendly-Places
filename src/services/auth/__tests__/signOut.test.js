import { signOut } from '../signOut';
import { api, queryClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/apiList';
import { useStore } from '../../../store';

jest.mock('../../api/apiClient', () => ({
  api: { post: jest.fn() },
  queryClient: { clear: jest.fn() },
}));

describe('signOut', () => {
  const logout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(useStore, 'getState').mockReturnValue({ logout });
  });

  it('revokes this device, then clears the device', async () => {
    api.post.mockResolvedValue({});

    const revoked = await signOut();

    expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT);
    expect(logout).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(revoked).toBe(true);
  });

  it('revokes every device when asked to', async () => {
    api.post.mockResolvedValue({});

    await signOut({ allDevices: true });

    expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.AUTH.LOGOUT_ALL);
  });

  it('still clears the device when the server cannot be reached', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));

    const revoked = await signOut();

    expect(logout).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(revoked).toBe(false);
  });
});
