import { patchCachedProfile } from '../useUser';

jest.mock('../../services/api/apiClient', () => ({ api: { get: jest.fn() } }));

const run = current => {
  let result;
  const queryClient = {
    setQueryData: (key, updater) => {
      expect(key).toEqual(['user', 'profile']);
      result = updater(current);
    },
  };
  patchCachedProfile(queryClient, { name: 'New Name' });
  return result;
};

describe('patchCachedProfile', () => {
  it('patches the account in { account, pets }', () => {
    expect(run({ account: { id: 1, name: 'Old' }, pets: [] })).toEqual({
      account: { id: 1, name: 'New Name' },
      pets: [],
    });
  });

  it('patches { user } and a bare account', () => {
    expect(run({ user: { name: 'Old' } })).toEqual({ user: { name: 'New Name' } });
    expect(run({ id: 1, name: 'Old' })).toEqual({ id: 1, name: 'New Name' });
  });

  it('leaves an empty cache alone', () => {
    expect(run(undefined)).toBeUndefined();
  });
});
