import { resolveImageUrl } from '../../hooks/useDiscovery';

// Small helpers shared by the pet screens. A pet is whatever the account API returned, cleaned by
// the Profile screen (name, type, breed) with the raw API fields kept alongside.
export const STAMP_GOAL = 20;

// Placeholder values from the API ("REPLACE_ME") count as empty
export const cleanText = value =>
  typeof value === 'string' && value.trim() && !/REPLACE_ME/i.test(value) ? value.trim() : '';

export const speciesEmoji = species =>
  /cat/i.test(species)
    ? '🐱'
    : /dog/i.test(species)
    ? '🐶'
    : /rabbit/i.test(species)
    ? '🐰'
    : /bird/i.test(species)
    ? '🦜'
    : '🐾';

export const petName = pet => cleanText(pet?.name) || cleanText(pet?.petName) || 'Your pet';
export const petSpecies = pet => cleanText(pet?.type) || cleanText(pet?.species);
export const petBreed = pet => cleanText(pet?.breed);
export const petStamps = pet =>
  Number(pet?.stamps ?? pet?.stampCount ?? pet?.stamps_count ?? 0) || 0;
export const petLevel = pet => 1 + Math.floor(petStamps(pet) / STAMP_GOAL);
export const petSubtitle = pet =>
  [petSpecies(pet).toLowerCase(), petBreed(pet)].filter(Boolean).join(' · ');

// Profile photo URL, whichever field the API used; '' when the pet has none
export const petPhoto = pet =>
  resolveImageUrl(
    pet?.profilePhotoUrl ||
      pet?.profile_photo_url ||
      pet?.photoUrl ||
      pet?.photo_url ||
      pet?.photo ||
      '',
  );
