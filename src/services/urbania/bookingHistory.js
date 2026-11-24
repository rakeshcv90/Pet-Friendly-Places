import { storage } from '../storage/storage';

// The bookings made on this phone, newest first. Only trip details and fare totals live here: the
// private status token stays in the secure store (statusTokenStore) and is never part of a record.
const KEY = 'URBANIA_BOOKINGS';
const LIMIT = 50;

export const loadBookings = () => {
  try {
    const list = JSON.parse(storage.getString(KEY) || '[]');
    return Array.isArray(list) ? list.filter(item => item && item.reference) : [];
  } catch (e) {
    return [];
  }
};

const write = list => {
  try {
    storage.set(KEY, JSON.stringify(list.slice(0, LIMIT)));
  } catch (e) {
    // The history is a convenience: a failed save must never fail a booking
  }
};

// Adds a booking, or updates the one with the same reference
export const saveBooking = record => {
  if (!record?.reference) {
    return;
  }
  const rest = loadBookings().filter(item => item.reference !== record.reference);
  const current = loadBookings().find(item => item.reference === record.reference);
  write([{ ...current, ...record, savedAt: current?.savedAt || Date.now() }, ...rest]);
};

export const updateBooking = (reference, patch) => {
  write(loadBookings().map(item => (item.reference === reference ? { ...item, ...patch } : item)));
};
