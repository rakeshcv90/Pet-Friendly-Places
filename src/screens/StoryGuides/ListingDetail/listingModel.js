import { resolveImageUrl } from '../../../hooks/useDiscovery';
import { formatPublishedDate } from '../GuideDetail/format';

/** API arrays sometimes arrive as JSON text ('["Dogs","Cats"]'): always return a string[]. */
export const parseList = value => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map(String);
      }
    } catch {
      // not JSON: treat it as a comma separated list
    }
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const toDate = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** "3 June 2026" (UTC, like the website). */
export const formatLongDate = value => {
  const d = toDate(value);
  return d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : '';
};

/** "June 2026". */
export const formatMonthYear = value => {
  const d = toDate(value);
  return d ? `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : '';
};

const withCommas = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const titleCase = text =>
  String(text || '')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

/** Splits a policy paragraph into its sentences. */
export const splitSentences = text =>
  (String(text || '').match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).map(p => p.trim()).filter(Boolean);

const unique = list => [...new Set(list)];

const VERIFY_LABELS = {
  TEAM_VERIFIED: 'Team Verified',
  OWNER_VERIFIED: 'Owner Verified',
  TAILS_VERIFIED: 'Tails Verified',
};

const PET_LEVELS = {
  pet_friendly: 'Pet Friendly',
  pet_first: 'Pet First',
  pet_tolerant: 'Pet Tolerant',
  pet_allowed: 'Pets Allowed',
};

const PET_EMOJI = { dogs: '🐶', cats: '🐱', rabbits: '🐰', birds: '🦜', hamsters: '🐹', 'guinea pigs': '🐹' };

const ATTRIBUTES = [
  ['water_access_available', 'Water Access'],
  ['parking_available', 'Parking Available'],
  ['open_lawn_available', 'Open Lawn'],
  ['best_for_large_dogs', 'Large Dogs Welcome'],
  ['best_for_small_dogs', 'Small Dogs Welcome'],
  ['best_for_road_trips', 'Road Trip Friendly'],
  ['best_for_day_outing', 'Day Outing Friendly'],
  ['best_for_overnight_stay', 'Overnight Stay'],
  ['pets_allowed_on_furniture', 'Pets on Furniture'],
  ['food_water_bowls_available', 'Food & Water Bowls'],
  ['pet_bed_available', 'Pet Bed'],
  ['pet_menu_available', 'Pet Menu'],
  ['nearby_vet_available', 'Nearby Vet'],
  ['has_off_leash_area', 'Off-leash Area'],
];

const BEST_FOR = [
  ['best_for_dogs', 'Dogs'],
  ['best_for_cats', 'Cats'],
  ['best_for_large_dogs', 'Large dogs'],
  ['best_for_small_dogs', 'Small dogs'],
  ['best_for_road_trips', 'Road trips'],
  ['best_for_day_outing', 'Day outings'],
  ['best_for_overnight_stay', 'Overnight stay'],
];

const mapsUrlFor = raw => {
  if (raw.google_maps_url) {
    return raw.google_maps_url;
  }
  if (raw.latitude && raw.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${raw.latitude},${raw.longitude}`;
  }
  const query = [raw.name, raw.address].filter(Boolean).join(' ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
};

const locationOf = item =>
  unique([item.local_area || item.famous_area, item.city, item.state].filter(Boolean)).join(', ');

const buildQuickFacts = raw => {
  const facts = [];
  const add = (icon, label, value) => {
    if (value) {
      facts.push({ icon, label, value: String(value) });
    }
  };

  const charges = raw.pet_charges_notes
    ? raw.pet_charges
      ? `${raw.pet_charges} · ${raw.pet_charges_notes}`
      : raw.pet_charges_notes
    : raw.pet_charges;
  add('wallet-outline', 'Pet Charges', charges);
  add('car-outline', 'Parking', raw.parking_available === true ? 'Available' : null);
  add('home-outline', raw.category === 'Stays' ? 'Room Type' : 'Type', raw.specific_type);
  add('scale-outline', 'Dog Sizes', parseList(raw.allowed_dog_sizes).join(', '));
  add('bed-outline', 'Pets in Room', raw.pets_in_room === true ? 'Yes' : null);
  add('restaurant-outline', 'Pets in Restaurant', raw.pets_in_restaurant === true ? 'Yes' : null);
  add('link-outline', 'Leash Required?', raw.leash_policy);
  add('time-outline', 'Opening Hours', raw.opening_hours);
  add('ticket-outline', 'Entry Fee', raw.entry_fee);
  add('wallet-outline', 'Pet Deposit', raw.pet_deposit);
  return facts;
};

const buildPolicy = raw => {
  const methodLabel = raw.verification_method ? raw.verification_method.replace(/_/g, ' ') : '';
  return {
    keyRules: splitSentences(raw.pet_policy),
    restricted: parseList(raw.restricted_areas),
    offLeash: raw.off_leash_use_permitted === true ? 'Yes' : raw.off_leash_use_permitted === false ? 'No' : '',
    leashRules: raw.leash_policy || '',
    charges: raw.pet_charges_notes || raw.pet_charges || '',
    allowedPets: parseList(raw.allowed_pet_types),
    dogSizes: parseList(raw.allowed_dog_sizes),
    allowedIn: parseList(raw.pet_friendly_areas).map(a => a.replace(/\s+,\s+/g, ', ')),
    amenities: parseList(raw.pet_amenities),
    access: raw.public_or_private_access ? titleCase(raw.public_or_private_access) : '',
    feeBasis: raw.pet_charges_type ? titleCase(raw.pet_charges_type) : '',
    reviewMethod: methodLabel,
    reviewDate: formatLongDate(raw.reviewed_at || raw.created_at),
  };
};

/** API listing -> the view model the page renders. Pure, so it is easy to test. */
export const buildListing = raw => {
  if (!raw) {
    return null;
  }

  const photos = (Array.isArray(raw.images) ? raw.images : [])
    .filter(img => img && img.image_url && (!img.media_type || img.media_type === 'image'))
    .sort((a, b) => Number(Boolean(b.is_main)) - Number(Boolean(a.is_main)))
    .map(img => resolveImageUrl(img.image_url));
  if (!photos.length && raw.main_image_url) {
    photos.push(resolveImageUrl(raw.main_image_url));
  }

  let verifiedLabel = null;
  if (raw.tails_verified) {
    verifiedLabel = 'Tails Verified';
  } else if (VERIFY_LABELS[raw.verification_tier]) {
    verifiedLabel = VERIFY_LABELS[raw.verification_tier];
  } else if (raw.verification_status === 'verified') {
    verifiedLabel = 'Verified';
  }

  const levelLabel = raw.pet_friendliness_level
    ? PET_LEVELS[raw.pet_friendliness_level] || titleCase(raw.pet_friendliness_level)
    : '';

  const methodLabel = raw.verification_method ? raw.verification_method.replace(/_/g, ' ') : '';
  const verifiedAt = raw.last_verified_at || raw.verification_tier_set_at || raw.reviewed_at;

  return {
    slug: raw.slug,
    name: raw.name,
    type: raw.specific_type || '',
    categoryLabel: raw.category === 'Stays' ? 'Stay' : titleCase(raw.category),
    city: raw.city || '',
    location: locationOf(raw),
    alsoIn: raw.broader_city || '',
    address: raw.address || '',
    rating: raw.google_rating || raw.user_average_rating || null,
    ratingCount: raw.google_review_count || raw.review_count || 0,
    reviewCount: raw.review_count || 0,
    viewsLabel: raw.view_count ? `${withCommas(raw.view_count)} views` : '',
    price: raw.price_range || '',
    verifiedLabel,
    levelLabel,
    photos,
    excerpt: raw.excerpt || '',
    descriptionHtml: raw.description || '',
    petsWelcomed: parseList(raw.allowed_pet_types).map(label => ({
      label,
      emoji: PET_EMOJI[label.toLowerCase()] || '🐾',
    })),
    attributes: ATTRIBUTES.filter(([key]) => raw[key] === true).map(([, label]) => label),
    quickFacts: buildQuickFacts(raw),
    policy: buildPolicy(raw),
    bestFor: BEST_FOR.filter(([key]) => raw[key] === true).map(([, label]) => label),
    bestForNotes: parseList(raw.best_for),
    pros: parseList(raw.pros),
    cons: parseList(raw.cons),
    knowBeforeYouGo: parseList(raw.know_before_you_go),
    tags: parseList(raw.tags),
    trust: {
      label: verifiedLabel,
      text: methodLabel
        ? `Pet policy confirmed by the Pet Friendly Places team via ${methodLabel}.`
        : 'Pet policy confirmed by the Pet Friendly Places team.',
      monthYear: formatMonthYear(verifiedAt),
      notes: raw.verification_notes || '',
    },
    contact: {
      phone: raw.booking_phone || raw.phone || '',
      whatsapp: raw.whatsapp || raw.whatsapp_number || '',
      website: raw.booking_url || raw.website || '',
      email: raw.email || '',
      mapsUrl: mapsUrlFor(raw),
    },
  };
};

export { formatPublishedDate };
