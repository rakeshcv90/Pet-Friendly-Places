import axios from 'axios';
import { API_BASE_URL } from '../api/apiList';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

const post = (path, body, config) =>
  (config ? client.post(path, body, config) : client.post(path, body)).then(res => res.data);
const get = (path, params) => client.get(path, { params }).then(res => res.data);

const bearer = token => ({ headers: { Authorization: `Bearer ${token}` } });

export const apiMessage = (error, fallback) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  (typeof error?.response?.data?.error === 'string' ? error.response.data.error : '') ||
  fallback;

export const MIN_SUGGEST_LENGTH = 3;

// Service settings: time zone, tariff, base address, payment set-up
export const fetchPublicConfig = () => get('/urbania/public-config');

// Address suggestions: [{ address, placeId }]. Resolves to [] when the text is short or the call fails,
// so the box simply behaves as a normal text box.
export const fetchLocationSuggestions = async (input, { signal } = {}) => {
  const text = String(input || '').trim();
  if (text.length < MIN_SUGGEST_LENGTH) {
    return [];
  }
  try {
    const data = await post('/urbania/location-suggestions', { input: text }, { signal });
    return parseSuggestions(data);
  } catch (e) {
    return [];
  }
};

// The API's list -> [{ id, title, subtitle, description, placeId }]. The address and the Place ID stay
// together on one item, so the pair can be kept when a suggestion is picked.
export const parseSuggestions = data => {
  const list = Array.isArray(data)
    ? data
    : data?.suggestions || data?.items || data?.results || data?.data || [];
  return (Array.isArray(list) ? list : [])
    .map(item => {
      if (typeof item === 'string') {
        return { address: item, placeId: '' };
      }
      return {
        address: String(
          item?.address || item?.description || item?.text || item?.formattedAddress || '',
        ).trim(),
        placeId: String(item?.placeId || item?.place_id || '').trim(),
        title: item?.title || item?.mainText || '',
        subtitle: item?.subtitle || item?.secondaryText || '',
      };
    })
    .filter(item => item.address)
    .map((item, index) => ({
      id: item.placeId || `${index}-${item.address}`,
      title: item.title || item.address,
      subtitle: item.subtitle,
      description: item.address,
      placeId: item.placeId,
    }));
};

// Axios sends objects as JSON with Content-Type: application/json by itself.
// One month's availability, for the calendar: month is "2027-01"
export const fetchMonthAvailability = month => get('/urbania/availability', { month });

// Is this exact window free? The date-times must be ISO with the offset (+05:30); axios encodes them
export const fetchAvailability = ({ start, end }) => get('/urbania/availability', { start, end });

// Development only: shows what was sent and what came back in the Metro console. The booking's private
// status token is masked, so it never reaches a log.
export const maskToken = value =>
  value && typeof value === 'object'
    ? JSON.parse(JSON.stringify(value, (key, item) => (key === 'statusToken' ? '***' : item)))
    : value;

const logging = () => typeof __DEV__ !== 'undefined' && __DEV__ && process.env.NODE_ENV !== 'test';

/* eslint-disable no-console */
// Development only: a one-off look at an answer
export const devLog = (name, data) => {
  if (logging()) {
    console.log(`[urbania] ${name}`, JSON.stringify(maskToken(data), null, 2));
  }
};

// Development only: for every booking, the keys the server sent next to what the app read from them,
// so a field missing on the phone can be matched against Postman.
export const logBookingCompare = (data, bookings) => {
  if (!logging()) {
    return;
  }
  const list = Array.isArray(data)
    ? data
    : data?.bookings || data?.requests || data?.items || data?.data || data?.results || [];
  (Array.isArray(list) ? list : []).forEach((raw, index) => {
    const source = raw?.request && typeof raw.request === 'object' ? raw.request : raw || {};
    const read = bookings[index] || {};
    console.log(
      `[urbania] booking ${read.reference || index} api keys`,
      Object.keys(source).join(', '),
    );
    console.log(
      `[urbania] booking ${read.reference || index} shown in app`,
      JSON.stringify(
        { places: read.places, fare: read.fare, payment: read.payment, status: read.status },
        null,
        2,
      ),
    );
  });
};

const logged = async (name, path, body) => {
  if (!logging()) {
    return post(path, body);
  }
  console.log(`[urbania] ${name} payload`, JSON.stringify(body, null, 2));
  try {
    const data = await post(path, body);
    console.log(`[urbania] ${name} response`, JSON.stringify(maskToken(data), null, 2));
    return data;
  } catch (error) {
    console.log(
      `[urbania] ${name} failed`,
      error?.response?.status,
      JSON.stringify(maskToken(error?.response?.data) ?? error?.message),
    );
    throw error;
  }
};

/* eslint-enable no-console */

export const requestEstimate = body => logged('estimate', '/urbania/estimate', body);

export const submitRequest = body => logged('request', '/urbania/requests', body);

// Emails the customer a one-time link that connects this booking (and earlier guest bookings with the
// same email) to an account
export const claimBooking = token => post('/urbania/status/claim', undefined, bearer(token));

export const fetchStatus = token => post('/urbania/status', undefined, bearer(token));
