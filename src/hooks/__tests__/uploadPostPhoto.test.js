import { uploadPostPhoto, uploadReplyPhoto } from '../useCommunity';
import { setItem, removeItem, STORAGE_KEYS } from '../../services/storage/storage';

jest.mock('../../services/api/apiClient', () => ({ api: { get: jest.fn(), post: jest.fn() } }));

const photo = { uri: 'file:///a.jpg', fileName: 'a.jpg', type: 'image/jpeg' };

let appendSpy;

describe('uploadPostPhoto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appendSpy = jest.spyOn(FormData.prototype, 'append');
    setItem(STORAGE_KEYS.ACCESS_TOKEN, 'token-123');
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => appendSpy.mockRestore());

  afterAll(() => removeItem(STORAGE_KEYS.ACCESS_TOKEN));

  const appended = () => Object.fromEntries(appendSpy.mock.calls.map(([name, value]) => [name, value]));

  it('uploads one photo as multipart form data with the bearer token and no manual Content-Type', async () => {
    const ok = await uploadPostPhoto(42, photo);

    expect(ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/community\/media\/upload$/);
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ Authorization: 'Bearer token-123' });
    expect(options.body).toBeInstanceOf(FormData);

    expect(appended()).toEqual({
      file: { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' },
      targetType: 'post',
      targetId: '42',
    });
  });

  it('falls back to a default file name and type', async () => {
    await uploadPostPhoto(7, { uri: 'file:///b' });

    expect(appended().file).toEqual({ uri: 'file:///b', name: 'photo.jpg', type: 'image/jpeg' });
  });

  it('reports failure without throwing', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });
    expect(await uploadPostPhoto(1, photo)).toBe(false);

    global.fetch.mockRejectedValueOnce(new Error('network'));
    expect(await uploadPostPhoto(1, photo)).toBe(false);
  });

  it('attaches a photo to a reply with the reply target type', async () => {
    expect(await uploadReplyPhoto(9, photo)).toBe(true);

    expect(appended()).toEqual(expect.objectContaining({ targetType: 'reply', targetId: '9' }));
  });
});
