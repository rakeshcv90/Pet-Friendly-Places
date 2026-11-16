// Pure helpers that turn the city hub API responses into what CityDetail renders.
// The responses are only loosely typed, so every reader tolerates missing keys.
import { resolveImageUrl } from '../../hooks/useDiscovery';

export const slugifyCity = name =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const stripHtml = value =>
  typeof value === 'string'
    ? value
        .replace(/<\/(p|div|li|h\d)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : '';

const asArray = res => {
  if (Array.isArray(res)) {
    return res;
  }
  return res?.items || res?.data || res?.routes || res?.cities || res?.intros || [];
};

const CATEGORY_ICONS = [
  [/stay|hotel|resort|homestay|villa/i, 'bed-outline'],
  [/eat|cafe|restaurant|food|dining/i, 'cafe-outline'],
  [/care|vet|groom|pet shop|boarding|train/i, 'medkit-outline'],
  [/park|trail|outdoor|nature|walk|beach/i, 'leaf-outline'],
  [/activity|attraction|things/i, 'compass-outline'],
];

export const categoryIcon = label =>
  (CATEGORY_ICONS.find(([re]) => re.test(label)) || [null, 'paw-outline'])[1];

export const isVerified = l =>
  l?.verification_status === 'verified' ||
  l?.verification_tier === 'TAILS_VERIFIED' ||
  l?.verification_tier === 'TEAM_VERIFIED';

export const verifiedLabel = l => {
  if (l?.verification_tier === 'TAILS_VERIFIED') {
    return 'Tails Verified';
  }
  if (l?.verification_tier === 'TEAM_VERIFIED') {
    return 'Team Verified';
  }
  return isVerified(l) ? 'Verified' : '';
};

// Tails Verified first, then Team Verified, then the rest; stable within a tier
const tierRank = l => {
  if (l?.verification_tier === 'TAILS_VERIFIED') {
    return 0;
  }
  return isVerified(l) ? 1 : 2;
};

export const sortListings = listings =>
  listings
    .map((l, i) => ({ l, i }))
    .sort((a, b) => tierRank(a.l) - tierRank(b.l) || a.i - b.i)
    .map(({ l }) => l);

// [{ key, label, count, icon }] with "All places" first
export const buildCategories = listings => {
  const counts = new Map();
  listings.forEach(l => {
    const label = l?.category;
    if (label) {
      counts.set(label, (counts.get(label) || 0) + 1);
    }
  });
  const rest = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ key: label, label, count, icon: categoryIcon(label) }));
  return [{ key: 'all', label: 'All places', count: listings.length, icon: 'business-outline' }, ...rest];
};

export const listingToCard = l => ({
  id: l.slug || String(l.id),
  slug: l.slug,
  type: String(l.specific_type || l.category || 'Place').toUpperCase(),
  name: l.name,
  area: l.area || l.neighbourhood || l.locality || l.city || '',
  note: stripHtml(l.excerpt_highlight || l.pet_charges_notes || l.excerpt || ''),
  badge: verifiedLabel(l),
  imageUri: resolveImageUrl(l.main_image_url || l.images?.[0]?.image_url),
});

// Published category intros are a list; tolerate a `city` scope and several tagline keys
export const categoryTaglines = (res, citySlug) => {
  const map = {};
  asArray(res).forEach(row => {
    const label = row?.category || row?.category_name || row?.name;
    const tagline = row?.tagline || row?.intro || row?.description;
    const scope = row?.city_slug || (row?.city ? slugifyCity(row.city) : null);
    if (label && tagline && (!scope || scope === citySlug)) {
      map[label] = stripHtml(tagline);
    }
  });
  return map;
};

const SECTION_META = [
  ['about', 'About', 'information-circle-outline'],
  ['getting_there', 'Getting there', 'navigate-outline'],
  ['pet_safety', 'Pet safety', 'shield-checkmark-outline'],
  ['areas_to_know', 'Areas to know', 'map-outline'],
];

const toCamel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// Section bodies arrive as text/HTML, a list of strings, or a list of { title, description }
const readBody = raw => {
  if (Array.isArray(raw)) {
    return raw
      .map(item =>
        typeof item === 'string'
          ? stripHtml(item)
          : [item?.title || item?.name, stripHtml(item?.description || item?.body || '')]
              .filter(Boolean)
              .join(': '),
      )
      .filter(Boolean);
  }
  const text = stripHtml(raw);
  return text ? [text] : [];
};

export const normalizeIntro = res => {
  const raw = Array.isArray(res) ? res[0] : res;
  if (!raw || typeof raw !== 'object') {
    return { summary: '', sections: [] };
  }
  const sections = SECTION_META.map(([key, title, icon]) => {
    const body = readBody(raw[key] ?? raw[toCamel(key)] ?? raw[`${key}_html`]);
    return body.length > 0 ? { key, title, icon, body } : null;
  }).filter(Boolean);
  const summary = stripHtml(raw.summary || raw.tagline || raw.subtitle || '');
  return { summary, sections };
};

export const readCover = res => {
  const raw = Array.isArray(res) ? res[0] : res;
  const url = raw?.cover_image_url || raw?.image_url || raw?.cover_image || raw?.url;
  return url ? resolveImageUrl(url) : null;
};

export const readRoutes = res =>
  asArray(res)
    .filter(r => r?.slug)
    .map(r => ({
      slug: r.slug,
      title: r.title || r.name,
      subtitle: [r.origin_city || r.start_city, r.destination_city].filter(Boolean).join(' to '),
      meta: [r.distance_km ? `${r.distance_km} km` : '', r.duration || r.duration_label || '']
        .filter(Boolean)
        .join(' · '),
    }));

export const readNearby = (res, currentCity) =>
  asArray(res)
    .map(c => ({
      city: c.name || c.city,
      state: c.state,
      verified: typeof c.verified_count === 'number' ? c.verified_count : c.listing_count || 0,
    }))
    .filter(c => c.city && c.city.toLowerCase() !== String(currentCity).toLowerCase());
