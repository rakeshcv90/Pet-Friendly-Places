import { submitPlace, buildPlaceForm, createIdempotencyKey } from '../placeSubmission';
import { apiClient, queryClient } from '../../services/api/apiClient';
import { useStore } from '../../store';

jest.mock('../../services/api/apiClient', () => ({
  api: { get: jest.fn() },
  apiClient: { post: jest.fn() },
  queryClient: { invalidateQueries: jest.fn() },
}));

const photo = { uri: 'file:///a.jpg', fileName: 'a.jpg', type: 'image/jpeg' };
const fields = {
  proposedName: '  The Barking Cat Cafe ',
  category: 'Food & Cafes',
  city: 'Mumbai',
  descriptionText: 'Lovely garden seating and the staff brought water for our dog.',
  state: '',
  website: 'https://example.com',
  petCount: '2',
};

let appendSpy;
const appended = () => appendSpy.mock.calls.map(([name, value]) => [name, value]);
const valueOf = name => appended().find(([key]) => key === name)?.[1];

describe('placeSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appendSpy = jest.spyOn(FormData.prototype, 'append');
    useStore.setState({ isAuthenticated: true });
  });

  afterEach(() => appendSpy.mockRestore());

  it('builds the multipart body with required fields, only filled optionals and every photo', () => {
    buildPlaceForm({ fields, photos: [photo, { uri: 'file:///b.png', type: 'image/png' }] });

    expect(valueOf('proposedName')).toBe('The Barking Cat Cafe');
    expect(valueOf('category')).toBe('Food');
    expect(valueOf('city')).toBe('Mumbai');
    expect(valueOf('photoUseAccepted')).toBe('true');
    expect(valueOf('confirmedNotDuplicate')).toBe('false');
    expect(valueOf('website')).toBe('https://example.com');
    expect(valueOf('petCount')).toBe('2');
    expect(valueOf('state')).toBeUndefined();

    const photoParts = appended().filter(([key]) => key === 'photos');
    expect(photoParts).toHaveLength(2);
    expect(photoParts[0][1]).toEqual({ uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' });
    expect(photoParts[1][1].name).toBe('photo-2.jpg');
  });

  it('posts multipart to /places/submit through apiClient with the idempotency key', async () => {
    apiClient.post.mockResolvedValue({ status: 201, data: { id: 7 } });

    const result = await submitPlace({ fields, photos: [photo], idempotencyKey: 'key-1' });

    expect(result).toEqual({ ok: true, status: 201, data: { id: 7 } });
    const [url, body, config] = apiClient.post.mock.calls[0];
    expect(url).toBe('/places/submit');
    expect(body).toBeInstanceOf(FormData);
    expect(config.headers).toEqual({
      'Content-Type': 'multipart/form-data',
      'Idempotency-Key': 'key-1',
    });
    expect(config.timeout).toBeGreaterThan(15000);
    expect(config.transformRequest(body)).toBe(body);
  });

  it('maps LIVE_SUBMISSION_REQUIRED to a clear message', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 403, data: { code: 'LIVE_SUBMISSION_REQUIRED' } },
    });
    const result = await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/live app/);
  });

  it('uses the server message for validation errors', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 400, data: { message: 'descriptionText is too short' } },
    });
    const result = await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(result.error).toBe('descriptionText is too short');
  });

  it('asks the user to sign in on a 401', async () => {
    apiClient.post.mockRejectedValue({ response: { status: 401, data: {} } });
    const result = await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(result.status).toBe(401);
    expect(result.error).toMatch(/sign in/);
  });

  it('returns a network error instead of throwing', async () => {
    apiClient.post.mockRejectedValue(new Error('offline'));
    const result = await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(result).toMatchObject({ ok: false, status: 0 });
  });

  it('refreshes My Submissions after a successful submit', async () => {
    apiClient.post.mockResolvedValue({ status: 201, data: {} });
    await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['places', 'my-submissions'],
    });
  });

  it('does not upload when signed out', async () => {
    useStore.setState({ isAuthenticated: false });
    const result = await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(result.status).toBe(401);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('rejects missing, too many, remote and non-image photos before any request', async () => {
    const attempt = photos => submitPlace({ fields, photos, idempotencyKey: 'k' });

    expect((await attempt([])).error).toMatch(/at least one photo/);
    expect((await attempt(Array(6).fill(photo))).error).toMatch(/up to 5/);
    expect((await attempt([{ uri: 'https://evil.example/a.jpg' }])).error).toMatch(
      /from your device/,
    );
    expect((await attempt([{ uri: 'file:///a.pdf', type: 'application/pdf' }])).error).toMatch(
      /JPG, PNG or WebP/,
    );
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('sends a double tap only once while a request is in flight', async () => {
    let resolvePost;
    apiClient.post.mockReturnValue(new Promise(resolve => (resolvePost = resolve)));

    const first = submitPlace({ fields, photos: [photo], idempotencyKey: 'dup' });
    const second = submitPlace({ fields, photos: [photo], idempotencyKey: 'dup' });
    resolvePost({ status: 201, data: {} });

    expect(await first).toEqual(await second);
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });

  it('cleans server messages before showing them', async () => {
    apiClient.post.mockRejectedValue({
      response: { status: 400, data: { message: `bad\u0000\nvalue ${'x'.repeat(400)}` } },
    });
    const { error } = await submitPlace({ fields, photos: [photo], idempotencyKey: 'k' });
    expect(error.length).toBeLessThanOrEqual(200);
    // eslint-disable-next-line no-control-regex
    expect(error).not.toMatch(/[\u0000-\u001F]/);
  });

  it('creates a different idempotency key each time', () => {
    expect(createIdempotencyKey()).not.toBe(createIdempotencyKey());
  });
});

describe('mapPlaceSubmission', () => {
  const { mapPlaceSubmission } = require('../placeSubmission');

  it('reads camelCase fields', () => {
    expect(
      mapPlaceSubmission({
        id: 9,
        proposedName: 'Cafe',
        category: 'Food',
        city: 'Pune',
        status: 'Pending',
        createdAt: '2026-01-01',
        photos: [{ url: '/api/storage/a.jpg' }, { url: '/b.jpg' }],
      }),
    ).toMatchObject({
      id: '9',
      name: 'Cafe',
      status: 'pending',
      photoCount: 2,
      photoUrl: '/api/storage/a.jpg',
    });
  });

  it('reads snake_case fields and falls back to safe defaults', () => {
    expect(
      mapPlaceSubmission({ id: 1, proposed_name: 'Park', created_at: '2026-02-02' }),
    ).toMatchObject({
      name: 'Park',
      createdAt: '2026-02-02',
      status: 'pending',
    });
    expect(mapPlaceSubmission({ id: 2 }).name).toBe('Untitled place');
  });
});
