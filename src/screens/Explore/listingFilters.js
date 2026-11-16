// Shared by SearchScreen and FilterScreen: the filter model and how it maps to the listings API
// (GET /listings?category=&state=&city=&pet_friendliness=&pet_size=&min_rating=&verified_only=...)

export const API_CATEGORIES = [
  { id: 'Stays', label: 'Pet Friendly Stays' },
  { id: 'Food', label: 'Eat Out Together' },
  { id: 'Cafe', label: 'Cafes' },
  { id: 'Restaurant', label: 'Restaurants' },
  { id: 'Resort', label: 'Resorts' },
  { id: 'Pet Store', label: 'Pet Stores' },
  { id: 'Nature & Water', label: 'Paws in the Wild' },
  { id: 'Pet Care', label: 'Vet & Pet Care' },
  { id: 'vet', label: 'Vets' },
  { id: 'PET_RELOCATION', label: 'Pet Relocation' },
  { id: 'Pet Experience', label: 'Pet Experiences' },
  { id: 'Outdoor', label: 'Outdoor' },
  { id: 'Pet Welfare & Rescue', label: 'Pet Welfare & Rescue' },
  { id: 'CARAVAN', label: 'Pet-Friendly Caravans' },
  { id: 'Travel', label: 'Transport with Dogs' },
  { id: 'TAXI_SERVICE', label: 'Pet Taxis' },
];

// Explore passes display titles; these are the ones that have a matching API category
const TITLE_TO_API = {
  'Pet Friendly Stays': 'Stays',
  'Eat Out Together': 'Food',
  'Paws in the Wild': 'Nature & Water',
  'Vet & Pet Care': 'Pet Care',
  'Transport with Dogs': 'Travel',
  'Pet-Friendly Caravans': 'CARAVAN',
  'Pet Welfare & Rescue': 'Pet Welfare & Rescue',
};

export const resolveApiCategory = (apiCategory, title) =>
  apiCategory || TITLE_TO_API[title] || null;

export const categoryLabel = id => API_CATEGORIES.find(c => c.id === id)?.label || id;

export const STATE_OPTIONS = [
  'All states',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// label -> API value for pet_friendliness
export const PET_BADGES = {
  'Any badge': null,
  'Pet First': 'pet_first',
  'Pet Friendly': 'pet_friendly',
  'Pet Tolerant': 'pet_tolerant',
  'Pending Policy Confirmation': 'pending',
};
export const BADGE_OPTIONS = Object.keys(PET_BADGES);

// Subcategory chips (Stays only) -> specific_type; the API matches one exact type
export const STAY_SUBCATEGORIES = {
  'All stays': null,
  Hotels: 'Hotel',
  Hostels: 'Hostel',
  Resorts: 'Resort',
  Airbnb: 'Airbnb',
  OYO: 'OYO',
  Homestays: 'Homestay',
  Farmstays: 'Farmstay',
};

// FilterScreen checkbox key -> amenities query value
export const AMENITY_VALUES = {
  noPetFee: 'no-pet-fee',
  openLawn: 'lawn',
  largeDogs: 'large-dogs',
  parking: 'parking',
  poolAccess: 'pool',
};
const AMENITY_LABELS = {
  noPetFee: 'No pet fee',
  openLawn: 'Open lawn',
  largeDogs: 'Large dogs',
  parking: 'Parking',
  poolAccess: 'Pool access',
};

export const DEFAULT_FILTERS = {
  state: null,
  city: '',
  petBadge: null,
  petSize: null,
  minRating: null,
  verifiedOnly: false,
  petsInPool: false,
  amenities: [],
};

export const filtersToParams = filters => ({
  state: filters.state || undefined,
  city: filters.city?.trim() || undefined,
  pet_friendliness: filters.petBadge || undefined,
  pet_size: filters.petSize || undefined,
  min_rating: filters.minRating || undefined,
  verified_only: filters.verifiedOnly ? 'true' : undefined,
  pets_allowed_in_pool: filters.petsInPool ? 'true' : undefined,
  amenities: filters.amenities?.length ? filters.amenities.join(',') : undefined,
});

// Removable chips shown under the Filters button
export const filtersToChips = filters => {
  const chips = [];
  if (filters.state) chips.push({ key: 'state', label: filters.state });
  if (filters.city?.trim()) chips.push({ key: 'city', label: filters.city.trim() });
  if (filters.petBadge) {
    const label = Object.keys(PET_BADGES).find(k => PET_BADGES[k] === filters.petBadge);
    chips.push({ key: 'petBadge', label });
  }
  if (filters.petSize) {
    chips.push({ key: 'petSize', label: `${filters.petSize[0].toUpperCase()}${filters.petSize.slice(1)} dogs` });
  }
  if (filters.minRating) chips.push({ key: 'minRating', label: `${filters.minRating}+ rating` });
  if (filters.verifiedOnly) chips.push({ key: 'verifiedOnly', label: 'Verified' });
  if (filters.petsInPool) chips.push({ key: 'petsInPool', label: 'Pets in pool' });
  filters.amenities.forEach(value => {
    const key = Object.keys(AMENITY_VALUES).find(k => AMENITY_VALUES[k] === value);
    chips.push({ key: `amenity:${value}`, label: AMENITY_LABELS[key] || value });
  });
  return chips;
};

export const removeFilter = (filters, chipKey) => {
  if (chipKey.startsWith('amenity:')) {
    const value = chipKey.slice('amenity:'.length);
    return { ...filters, amenities: filters.amenities.filter(item => item !== value) };
  }
  return { ...filters, [chipKey]: DEFAULT_FILTERS[chipKey] };
};

// Sort dropdown -> `sort` query param of GET /listings (relevance is the API default)
export const SORT_OPTIONS = [
  { key: 'relevance', label: 'Most Relevant', param: undefined },
  { key: 'rating', label: 'Highest Rated', param: 'rating' },
  { key: 'pool_first', label: 'Pets allowed in pool first', param: 'pool_first' },
  { key: 'newest', label: 'Newest First', param: 'newest' },
  { key: 'popular', label: 'Most Viewed', param: 'popular' },
  { key: 'az', label: 'A to Z', param: 'az' },
];
