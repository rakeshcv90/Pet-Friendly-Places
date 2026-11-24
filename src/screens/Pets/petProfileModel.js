// What the pet profile page needs that is not drawing: the tabs, the social links and the stamps.

export const PET_TABS = [
  { id: 'basic', label: 'Basic Info', emoji: '✏️' },
  { id: 'photo', label: 'Photo', emoji: '📷' },
  { id: 'social', label: 'Social', emoji: '🌐' },
  { id: 'stamps', label: 'Stamps', emoji: '🥇' },
  { id: 'health', label: 'Health Records', emoji: '📋' },
];

export const isTabId = id => PET_TABS.some(tab => tab.id === id);

// The four social links, in the order the page shows them. The API may send them under a few names.
export const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', placeholder: 'instagram_handle' },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'logo-youtube',
    placeholder: 'youtube.com/c/yourchannel',
  },
  { key: 'twitter', label: 'X / Twitter', icon: 'logo-twitter', placeholder: 'x_handle' },
  { key: 'website', label: 'Website', icon: 'globe-outline', placeholder: 'yourdog.com' },
];

const first = (...values) => {
  const found = values.find(value => typeof value === 'string' && value.trim());
  return found ? found.trim() : '';
};

export const readSocial = pet => {
  const social = pet?.social || pet?.socialLinks || {};
  return {
    instagram: first(pet?.instagram, pet?.instagramHandle, social.instagram),
    youtube: first(pet?.youtube, pet?.youtubeUrl, pet?.youtubeHandle, social.youtube),
    twitter: first(pet?.twitter, pet?.xHandle, pet?.x_handle, pet?.x, social.twitter, social.x),
    website: first(pet?.website, pet?.websiteUrl, social.website),
  };
};

// The values to save: trimmed, and an Instagram or X handle without a leading "@"
export const socialPayload = values => ({
  instagram: String(values.instagram || '')
    .trim()
    .replace(/^@+/, ''),
  youtube: String(values.youtube || '').trim(),
  twitter: String(values.twitter || '')
    .trim()
    .replace(/^@+/, ''),
  website: String(values.website || '').trim(),
});

// Has anything changed from what the pet already has?
export const socialChanged = (values, pet) => {
  const saved = readSocial(pet);
  const next = socialPayload(values);
  return SOCIAL_FIELDS.some(field => next[field.key] !== saved[field.key]);
};

const norm = text =>
  String(text || '')
    .trim()
    .toLowerCase();

// The cities a pet already has a stamp for
export const stampedCities = stamps =>
  new Set(
    (Array.isArray(stamps) ? stamps : [])
      .map(stamp => norm(stamp?.city || stamp?.cityName || stamp?.placeCity))
      .filter(Boolean),
  );

// The cities the pet has not been stamped in yet, from the list of cities the app knows
export const lockedCities = (known, stamps, limit = 10) => {
  const done = stampedCities(stamps);
  const seen = new Set();
  return (Array.isArray(known) ? known : [])
    .map(item => (typeof item === 'string' ? item : item?.name || item?.city || ''))
    .map(name => String(name).trim())
    .filter(name => {
      const key = norm(name);
      if (!key || done.has(key) || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

// "Issued 2026-03-05 · Due Not added · 1 file", as the website writes a health record's line
export const healthRecordMeta = record => {
  const day = value => (value ? String(value).slice(0, 10) : 'Not added');
  const files = Array.isArray(record?.files) ? record.files.length : Number(record?.fileCount) || 0;
  return `Issued ${day(record?.dateIssued)} · Due ${day(record?.nextDueDate)} · ${files} ${
    files === 1 ? 'file' : 'files'
  }`;
};

// Records grouped under their document type, in the order each type first appears, like the
// website's "VACCINATION" heading. Each entry keeps its place in the original list as `index`.
export const groupHealthRecords = (records = []) => {
  const groups = [];
  (Array.isArray(records) ? records : []).forEach((record, index) => {
    const type = record?.documentType || 'other';
    let group = groups.find(item => item.type === type);
    if (!group) {
      group = { type, entries: [] };
      groups.push(group);
    }
    group.entries.push({ record, index });
  });
  return groups;
};

