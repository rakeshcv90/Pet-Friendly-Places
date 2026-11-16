import { useQuery } from '@tanstack/react-query';
import { api, apiClient, queryClient } from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiList';
import { useStore } from '../store';

const MY_SUBMISSIONS_KEY = ['places', 'my-submissions'];

// The form shows "Food & Cafes"; the server expects "Food"
const SERVER_CATEGORY = { 'Food & Cafes': 'Food' };

// Optional text fields, form key -> server key. Blank values are not sent.
const OPTIONAL_FIELDS = {
  state: 'state',
  address: 'address',
  mapPin: 'mapPin',
  website: 'website',
  phone: 'phone',
  travelDate: 'travelDate',
  petCount: 'petCount',
  petTypes: 'petTypes',
  petAllowedAreas: 'petAllowedAreas',
  petPolicyText: 'petPolicyText',
  petChargesDetails: 'petChargesDetails',
  additionalFacts: 'additionalFacts',
};

const MAX_PHOTOS = 5;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// Photos must be local files from the picker, never a remote or arbitrary URL
const LOCAL_URI = /^(file|content|ph|assets-library):\/\//i;
// Photos can be several MB each, so allow longer than apiClient's 15s default
const SUBMIT_TIMEOUT_MS = 60000;
const MAX_ERROR_LENGTH = 200;

// A new random key per submission; reuse the same one when retrying that submission
export const createIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;

const clean = value => (value == null ? '' : String(value).trim());

export const buildPlaceForm = ({ fields, photos }) => {
  const form = new FormData();
  form.append('proposedName', clean(fields.proposedName));
  form.append('category', SERVER_CATEGORY[fields.category] ?? fields.category);
  form.append('city', clean(fields.city));
  form.append('descriptionText', clean(fields.descriptionText));
  form.append('photoUseAccepted', 'true');
  form.append('confirmedNotDuplicate', 'false');

  Object.keys(OPTIONAL_FIELDS).forEach(key => {
    const value = clean(fields[key]);
    if (value) {
      form.append(OPTIONAL_FIELDS[key], value);
    }
  });

  photos.forEach((photo, index) => {
    form.append('photos', {
      uri: photo.uri,
      name: photo.fileName ?? `photo-${index + 1}.jpg`,
      type: photo.type ?? 'image/jpeg',
    });
  });
  return form;
};

// Checks the photos before anything is uploaded. Returns an error message, or null when fine.
const validatePhotos = photos => {
  if (!Array.isArray(photos) || photos.length === 0) {
    return 'Please add at least one photo.';
  }
  if (photos.length > MAX_PHOTOS) {
    return `You can upload up to ${MAX_PHOTOS} photos.`;
  }
  const invalid = photos.some(
    photo =>
      typeof photo?.uri !== 'string' ||
      !LOCAL_URI.test(photo.uri) ||
      (photo.type && !ALLOWED_PHOTO_TYPES.includes(String(photo.type).toLowerCase())),
  );
  return invalid ? 'Only JPG, PNG or WebP photos from your device can be uploaded.' : null;
};

// Server text is shown to the user, so strip control characters and cap the length
const safeMessage = text =>
  typeof text === 'string'
    ? text
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .trim()
        .slice(0, MAX_ERROR_LENGTH)
    : '';

const friendlyError = (status, body) => {
  const code = body?.code || body?.error?.code;
  const serverMessage =
    safeMessage(body?.message) || safeMessage(body?.error) || safeMessage(body?.error?.message);

  if (status === 401) {
    return 'Please sign in again to submit a place.';
  }
  if (code === 'LIVE_SUBMISSION_REQUIRED') {
    return 'Place submissions are only accepted on the live app right now.';
  }
  if (serverMessage) {
    return serverMessage;
  }
  if (status === 413) {
    return 'Your photos are too large. Try fewer or smaller photos.';
  }
  if (status === 429) {
    return 'Too many submissions. Please try again later.';
  }
  return 'Could not submit the place. Please try again.';
};

const send = async ({ fields, photos, idempotencyKey }) => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.PLACE_SUBMIT,
      buildPlaceForm({ fields, photos }),
      {
        headers: { 'Content-Type': 'multipart/form-data', 'Idempotency-Key': idempotencyKey },
        timeout: SUBMIT_TIMEOUT_MS,
        // Keep the multipart body as is instead of letting axios serialise it to JSON
        transformRequest: data => data,
      },
    );
    // The new place should appear in My Submissions straight away
    queryClient.invalidateQueries({ queryKey: MY_SUBMISSIONS_KEY });
    return { ok: true, status: response.status, data: response.data };
  } catch (e) {
    if (e?.response) {
      const { status, data } = e.response;
      return { ok: false, status, data, error: friendlyError(status, data) };
    }
    return { ok: false, status: 0, error: 'Network error. Check your connection and try again.' };
  }
};


const inFlight = new Map();


export const submitPlace = ({ fields, photos, idempotencyKey }) => {
  if (!useStore.getState().isAuthenticated) {
    return Promise.resolve({ ok: false, status: 401, error: friendlyError(401) });
  }
  const photoError = validatePhotos(photos);
  if (photoError) {
    return Promise.resolve({ ok: false, status: 400, error: photoError });
  }
  if (inFlight.has(idempotencyKey)) {
    return inFlight.get(idempotencyKey);
  }

  const request = send({ fields, photos, idempotencyKey }).finally(() =>
    inFlight.delete(idempotencyKey),
  );
  inFlight.set(idempotencyKey, request);
  return request;
};

const pick = (obj, keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};


export const mapPlaceSubmission = raw => {
  const photos = pick(raw, ['photos', 'images']);
  const firstPhoto = Array.isArray(photos) ? photos[0] : undefined;
  return {
    id: String(pick(raw, ['id', 'submissionId', 'submission_id']) ?? ''),
    name: pick(raw, ['proposedName', 'proposed_name', 'name', 'title']) || 'Untitled place',
    category: pick(raw, ['category']) || '',
    city: pick(raw, ['city']) || '',
    state: pick(raw, ['state']) || '',
    status: String(pick(raw, ['status', 'state_label', 'reviewStatus']) || 'pending').toLowerCase(),
    createdAt: pick(raw, ['createdAt', 'created_at', 'submittedAt', 'submitted_at']),
    photoCount:
      pick(raw, ['photoCount', 'photo_count']) ?? (Array.isArray(photos) ? photos.length : 0),
    photoUrl:
      typeof firstPhoto === 'string'
        ? firstPhoto
        : pick(firstPhoto, ['url', 'imageUrl', 'image_url', 'thumbnailUrl']) ||
          pick(raw, ['coverImageUrl', 'cover_image_url', 'thumbnailUrl']),
  };
};

export const useMyPlaceSubmissions = (options = {}) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: MY_SUBMISSIONS_KEY,
    enabled: isAuthenticated,
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.MY_PLACE_SUBMISSIONS);
      const list = Array.isArray(data)
        ? data
        : data?.submissions || data?.placeSubmissions || data?.items || data?.data || [];
      return (Array.isArray(list) ? list : []).map(mapPlaceSubmission);
    },
    staleTime: 1000 * 30,
    ...options,
  });
};
