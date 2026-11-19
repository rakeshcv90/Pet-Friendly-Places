import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '../services/api/apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../services/api/apiList';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';
import { timeAgo } from '../screens/Community/utils';

export const toApiDate = text => {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((text || '').trim());
  if (!match) {
    return null;
  }
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};


const uploadCasePhoto = async (caseCode, uri, index) => {
  const form = new FormData();
  form.append('photo', { uri, name: `photo-${index + 1}.jpg`, type: 'image/jpeg' });

  const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.REUNITE.CASE_PHOTOS(caseCode)}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.text();

  if (!response.ok) {
    let message;
    try {
      message = JSON.parse(body)?.error;
    } catch (e) {}
    throw new Error(message || 'A photo could not be uploaded. Please try again.');
  }
};


const pick = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
};

const clean = value => {
  const text = value === null || value === undefined ? '' : String(value).trim();
  return text.toLowerCase() === 'unknown' ? '' : text;
};

const titleCase = text => text.charAt(0).toUpperCase() + text.slice(1);

const yesNo = value => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return titleCase(clean(value));
};

// New posts carry the pet details in the description ("Name: Tommy. Breed: Indian. ..."), because
// the create endpoint takes no separate fields for them. Posts from the website have them as fields.
const parseDescription = description => {
  const match = /(?:^|\n\n)(Name: [^]*)$/.exec(description);
  const details = match?.[1] || '';
  const get = label => new RegExp(`${label}:\\s*([^.]+)`).exec(details)?.[1]?.trim() || '';
  return {
    story: (match ? description.slice(0, match.index) : description).trim(),
    name: get('Name'),
    breed: get('Breed'),
    colour: get('Colour'),
    sex: get('Sex'),
    age: get('Age'),
    size: get('Size'),
    collar: /Wearing a collar/.test(details) ? 'Yes' : '',
    microchip: get('Microchip'),
    sterilised: get('Sterilised'),
    vaccinated: get('Vaccinated'),
  };
};

// "2026-11-05 14:50:53.347916+00" is not a date format the phone's JS engine reads, so make it ISO
const toIso = value =>
  typeof value === 'string'
    ? value
        .replace(' ', 'T')
        .replace(/(\.\d{3})\d+/, '$1')
        .replace(/([+-]\d{2})$/, '$1:00')
    : value;

const absoluteUrl = path =>
  path?.startsWith('/') ? `${API_BASE_URL.replace(/\/api$/, '')}${path}` : path;

// The list response is not documented, so both snake_case and camelCase keys are read
export const normalizeCase = item => {
  const species = pick(item, 'species') || '';
  const parsed = parseDescription(pick(item, 'description') || '');
  const caseType = String(pick(item, 'case_type', 'caseType', 'type') || 'LOST').toLowerCase();
  const photos = pick(item, 'photos', 'photo_urls', 'images') || [];
  const images = photos
    .map(photo => (typeof photo === 'string' ? photo : pick(photo, 'url', 'photo_url', 'path')))
    .filter(Boolean)
    .map(absoluteUrl);
  const locality = pick(item, 'locality');
  const city = pick(item, 'city');
  const state = pick(item, 'state');
  const createdAt = pick(item, 'created_at', 'createdAt', 'submitted_at', 'event_date', 'eventDate');

  return {
    id: String(pick(item, 'case_code', 'caseCode', 'id')),
    caseCode: pick(item, 'case_code', 'caseCode') || '',
    slug: pick(item, 'slug') || '',
    type: caseType === 'adoption' || caseType === 'rehome' ? 'adopt' : caseType,
    name: clean(pick(item, 'pet_name', 'petName', 'name')) || parsed.name,
    species: species === 'bird' && pick(item, 'bird_species') ? pick(item, 'bird_species') : species,
    breed: clean(pick(item, 'breed')) || parsed.breed,
    colour: clean(pick(item, 'colour_markings', 'colour')) || parsed.colour,
    sex: titleCase(clean(pick(item, 'sex'))) || parsed.sex,
    age: clean(pick(item, 'age_text', 'age')) || parsed.age,
    size: titleCase(clean(pick(item, 'size'))) || parsed.size,
    collar: yesNo(pick(item, 'had_collar')) || parsed.collar,
    microchip: yesNo(pick(item, 'microchipped')) || parsed.microchip,
    sterilised: yesNo(pick(item, 'sterilised')) || parsed.sterilised,
    vaccinated: yesNo(pick(item, 'vaccinated')) || parsed.vaccinated,
    story: parsed.story,
    contactName: pick(item, 'contact_name', 'contactName') || '',
    locality,
    city,
    state,
    location: [locality, city, state]
      .filter((part, index, parts) => part && parts.findIndex(p => p?.toLowerCase() === part.toLowerCase()) === index)
      .join(', '),
    image: images[0],
    images,
    eventDate: pick(item, 'event_date', 'eventDate') || createdAt,
    timeAgo: timeAgo(toIso(createdAt)),
  };
};

// Looks for a phone number anywhere in the response, under any key that names one
const PHONE_KEY = /phone|mobile|number|whats|tel|contact/i;
const findPhone = (value, key = '') => {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    const looksLikePhone = text.replace(/\D/g, '').length >= 7;
    return looksLikePhone && (PHONE_KEY.test(key) || key === '') ? text : null;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) {
      const found = findPhone(child, childKey);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

// Asks the server for the poster's number, which the list hides from bots. The response shape is
// not documented, so the common key names are tried.
export const useRevealPhone = () =>
  useMutation({
    mutationFn: async caseId => {
      const data = await api.post(API_ENDPOINTS.REUNITE.CASE_REVEAL_PHONE(caseId));
  
      const phone = findPhone(data);
      if (!phone) {
        throw new Error('The number is not available for this post.');
      }
      return String(phone);
    },
  });

// Creates a pet alert for a neighbourhood. Resolves to the new alert (the server answers 201).
export const useCreateReuniteAlert = () =>
  useMutation({
    mutationFn: async body => {
 
      const data = await api.post(API_ENDPOINTS.REUNITE.ALERTS, body);
   
      return data;
    },
  });

export const filterReunitePosts = (posts, tab, species) =>
  posts.filter(post => {
    if (tab !== 'all' && post.type !== tab) {
      return false;
    }
    if (species === 'all') {
      return true;
    }
    return `${post.species || ''} ${post.breed || ''} ${post.name || ''}`
      .toLowerCase()
      .includes(species.toLowerCase());
  });

export const useReuniteCases = () =>
  useQuery({
    queryKey: ['reunite', 'cases'],
    queryFn: async () => {
      const data = await api.get(API_ENDPOINTS.REUNITE.CASES);
   
      const list = Array.isArray(data) ? data : data?.cases ?? data?.items ?? data?.data ?? [];
      return list.map(normalizeCase);
    },
  });

export const useCreateReuniteCase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fields, photos, progress }) => {
      if (!progress.caseCode) {
     
        const draft = await apiClient.post(API_ENDPOINTS.REUNITE.CASES, fields);
    
        const caseCode =
          draft.data?.case_code ?? draft.data?.caseCode ?? draft.data?.case?.case_code;
        if (!caseCode) {
          throw new Error('The post could not be created. Please try again.');
        }
        progress.caseCode = caseCode;
        progress.uploaded = 0;
      }

  
      for (let i = progress.uploaded; i < photos.length; i += 1) {
        await uploadCasePhoto(progress.caseCode, photos[i], i);
        progress.uploaded = i + 1;
      }

      // No body, so moderation runs synchronously
      const submitted = await apiClient.post(API_ENDPOINTS.REUNITE.CASE_SUBMIT(progress.caseCode));
 
      return submitted.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reunite', 'cases'] }),
  });
};
