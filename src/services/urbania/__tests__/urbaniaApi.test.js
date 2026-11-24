const mockClient = { get: jest.fn(), post: jest.fn() };
jest.mock('axios', () => ({ create: jest.fn(() => mockClient) }));

const axios = require('axios');
const api = require('../urbaniaApi');
const { saveStatusToken, loadStatusToken } = require('../statusTokenStore');

describe('urbania api client', () => {
  it('is its own client: public headers, and not the account client that adds the login token', () => {
    expect(axios.create).toHaveBeenCalledTimes(1);
    const config = axios.create.mock.calls[0][0];
    expect(config.baseURL).toMatch(/\/api$/);
    expect(config.headers).toMatchObject({
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('urbania api calls', () => {
  beforeEach(() => {
    mockClient.get.mockReset();
    mockClient.post.mockReset();
  });

  it('loads the public config', async () => {
    mockClient.get.mockResolvedValue({ data: { timezone: 'Asia/Kolkata' } });
    expect(await api.fetchPublicConfig()).toEqual({ timezone: 'Asia/Kolkata' });
    expect(mockClient.get.mock.calls[0][0]).toBe('/urbania/public-config');
  });

  it('checks a window with the start and end kept as given (+05:30)', async () => {
    mockClient.get.mockResolvedValue({ data: { available: true } });
    await api.fetchAvailability({
      start: '2027-01-15T09:00:00+05:30',
      end: '2027-01-15T18:00:00+05:30',
    });
    expect(mockClient.get).toHaveBeenCalledWith('/urbania/availability', {
      params: { start: '2027-01-15T09:00:00+05:30', end: '2027-01-15T18:00:00+05:30' },
    });
  });

  it('posts the estimate and the request as they are', async () => {
    mockClient.post.mockResolvedValue({ data: { ok: 1 } });
    await api.requestEstimate({ a: 1 });
    await api.submitRequest({ b: 2 });
    expect(mockClient.post).toHaveBeenNthCalledWith(1, '/urbania/estimate', { a: 1 });
    expect(mockClient.post).toHaveBeenNthCalledWith(2, '/urbania/requests', { b: 2 });
  });

  it('sends the booking token only to the status call, as a Bearer header', async () => {
    mockClient.post.mockResolvedValue({ data: { status: 'received' } });
    await api.fetchStatus('secret-token');
    expect(mockClient.post).toHaveBeenCalledWith('/urbania/status', undefined, {
      headers: { Authorization: 'Bearer secret-token' },
    });
  });

  describe('location suggestions', () => {
    it('asks after 3 letters, and keeps each address with its Place ID', async () => {
      mockClient.post.mockResolvedValue({
        data: {
          suggestions: [{ address: 'Gurugram, Haryana', placeId: 'abc' }, { address: 'Gurgaon' }],
        },
      });
      const list = await api.fetchLocationSuggestions('Gurugram');

      expect(mockClient.post).toHaveBeenCalledWith(
        '/urbania/location-suggestions',
        { input: 'Gurugram' },
        { signal: undefined },
      );
      expect(list).toEqual([
        expect.objectContaining({ description: 'Gurugram, Haryana', placeId: 'abc', id: 'abc' }),
        expect.objectContaining({ description: 'Gurgaon', placeId: '' }),
      ]);
    });

    it('does not ask for text that is too short', async () => {
      expect(await api.fetchLocationSuggestions('Gu')).toEqual([]);
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    it('gives an empty list, not an error, when the call fails', async () => {
      mockClient.post.mockRejectedValue(new Error('offline'));
      expect(await api.fetchLocationSuggestions('Gurugram')).toEqual([]);
    });

    it('reads a plain list of addresses too', () => {
      expect(api.parseSuggestions(['Jaipur', 'Jodhpur']).map(item => item.description)).toEqual([
        'Jaipur',
        'Jodhpur',
      ]);
      expect(api.parseSuggestions(null)).toEqual([]);
    });
  });

  describe('apiMessage', () => {
    it('uses the reason the server gave, or the fallback', () => {
      expect(api.apiMessage({ response: { data: { message: 'Bad dates' } } }, 'x')).toBe(
        'Bad dates',
      );
      expect(api.apiMessage({ response: { data: { error: 'Too long' } } }, 'x')).toBe('Too long');
      expect(api.apiMessage({ response: { data: { error: { message: 'Nope' } } } }, 'x')).toBe(
        'Nope',
      );
      expect(api.apiMessage(new Error('Network'), 'Try again')).toBe('Try again');
    });
  });
});

describe('status token store', () => {
  it("keeps a booking's token in the secure store, per booking", async () => {
    expect(await saveStatusToken('URB-1', 'tok-1')).toBe(true);
    expect(await saveStatusToken('URB-2', 'tok-2')).toBe(true);
    expect(await loadStatusToken('URB-1')).toBe('tok-1');
    expect(await loadStatusToken('URB-2')).toBe('tok-2');
    expect(await loadStatusToken('URB-9')).toBeNull();
  });

  it('saves nothing without both a reference and a token', async () => {
    expect(await saveStatusToken('', 'tok')).toBe(false);
    expect(await saveStatusToken('URB-3', '')).toBe(false);
  });
});

describe('console logging of the booking calls', () => {
  it('masks the private status token', () => {
    expect(
      api.maskToken({ reference: 'URB-1', statusToken: 'secret', request: { statusToken: 's' } }),
    ).toEqual({
      reference: 'URB-1',
      statusToken: '***',
      request: { statusToken: '***' },
    });
    expect(api.maskToken(undefined)).toBeUndefined();
  });

  it('stays quiet in tests and still returns the answer', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockClient.post.mockResolvedValue({ data: { reference: 'URB-1' } });
    expect(await api.submitRequest({ a: 1 })).toEqual({ reference: 'URB-1' });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
