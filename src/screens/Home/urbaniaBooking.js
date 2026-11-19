// Rules, prices and wording for booking the pet-friendly Urbania (Home > Book Now).
// Kept free of any screen code so it can be tested on its own.

export const BOOKING_EMAIL = 'hello@petfriendlyplaces.in';

export const TRIP_TYPES = [
  { id: 'local', label: 'Local NCR' },
  { id: 'outstation', label: 'Outstation' },
];

export const MAX_PASSENGERS = 12;
export const MAX_PETS = 20;
export const MAX_STOPS = 5;
// A booking may run for at most 72 hours, touching at most 3 booking days
export const MAX_HOURS = 72;
export const MAX_STARTED_DAYS = 3;

// Prices shown on the website, after the 10% pet-parent discount
export const PRICING = {
  localBase: 5850,
  outstationPerDay: 8800,
  extraLocalKm: 32.4,
  extraHour: 360,
  driverPerDay: 700,
  nightDriving: 500,
  depositRefundable: 5000,
  advancePercent: 25,
};

export const EMPTY_BOOKING = {
  tripType: 'local',
  pickup: '',
  destination: '',
  stops: [],
  dropoff: '',
  pickupAt: '',
  returnAt: '',
  stayPlan: '',
  itinerary: '',
  sightseeingKm: '',
  passengers: 2,
  pets: 1,
  breeds: '',
  name: '',
  phone: '',
  email: '',
};

// ── Date and time (DD/MM/YYYY HH:MM) ────────────────────────────────────────────────────────────

// Keeps typing in DD/MM/YYYY HH:MM shape: digits only, separators added as you go
export const formatDateTime = text => {
  const d = String(text || '')
    .replace(/\D/g, '')
    .slice(0, 12);
  let out = d.slice(0, 2);
  if (d.length > 2) {
    out += `/${d.slice(2, 4)}`;
  }
  if (d.length > 4) {
    out += `/${d.slice(4, 8)}`;
  }
  if (d.length > 8) {
    out += ` ${d.slice(8, 10)}`;
  }
  if (d.length > 10) {
    out += `:${d.slice(10, 12)}`;
  }
  return out;
};

// "05/03/2027 09:30" -> a Date, '' when empty, null when it is not a real date and time
export const parseDateTime = text => {
  const value = String(text || '').trim();
  if (!value) {
    return '';
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const [dd, mm, yyyy, hh, min] = match.slice(1).map(Number);
  const date = new Date(yyyy, mm - 1, dd, hh, min);
  const real =
    date.getFullYear() === yyyy &&
    date.getMonth() === mm - 1 &&
    date.getDate() === dd &&
    date.getHours() === hh &&
    date.getMinutes() === min;
  return real ? date : null;
};

const HOUR = 60 * 60 * 1000;

// Hours and started 24-hour days between pickup and return; null when either is missing or invalid
export const tripLength = (pickupAt, returnAt) => {
  const start = parseDateTime(pickupAt);
  const end = parseDateTime(returnAt);
  if (!start || !end || end <= start) {
    return null;
  }
  const hours = (end - start) / HOUR;
  return { hours, startedDays: Math.ceil(hours / 24) };
};

// ── Checks, one step at a time ──────────────────────────────────────────────────────────────────

export const validateTrip = (form, now = Date.now()) => {
  const errors = {};
  if (!form.pickup.trim()) {
    errors.pickup = 'Please enter the pickup location';
  }
  if (!form.destination.trim()) {
    errors.destination = 'Please enter where you want to go';
  }

  const start = parseDateTime(form.pickupAt);
  if (!form.pickupAt.trim()) {
    errors.pickupAt = 'Enter the pickup date and time';
  } else if (start === null) {
    errors.pickupAt = 'Use DD/MM/YYYY HH:MM, for example 05/03/2027 09:30';
  } else if (start.getTime() < now) {
    errors.pickupAt = 'Pickup cannot be in the past';
  }

  const end = parseDateTime(form.returnAt);
  if (!form.returnAt.trim()) {
    if (form.tripType === 'outstation') {
      errors.returnAt = 'Enter the expected return for an outstation trip';
    }
  } else if (end === null) {
    errors.returnAt = 'Use DD/MM/YYYY HH:MM, for example 06/03/2027 20:00';
  } else if (start && end <= start) {
    errors.returnAt = 'Return must be after pickup';
  } else if (start) {
    const { hours, startedDays } = tripLength(form.pickupAt, form.returnAt);
    if (hours > MAX_HOURS || startedDays > MAX_STARTED_DAYS) {
      errors.returnAt = `A trip can last up to ${MAX_HOURS} hours (${MAX_STARTED_DAYS} started days)`;
    }
  }

  if (form.sightseeingKm.trim() && !/^\d+(\.\d+)?$/.test(form.sightseeingKm.trim())) {
    errors.sightseeingKm = 'Enter the distance as a number of km';
  }
  return errors;
};

export const validateGroup = form => {
  const errors = {};
  if (form.passengers < 1) {
    errors.passengers = 'At least one passenger is needed';
  } else if (form.passengers > MAX_PASSENGERS) {
    errors.passengers = `The Urbania seats ${MAX_PASSENGERS} passengers`;
  }
  if (form.pets < 0) {
    errors.pets = 'The number of pets cannot be negative';
  }
  return errors;
};

export const validateContact = form => {
  const errors = {};
  if (!form.name.trim()) {
    errors.name = 'Please enter your name';
  }
  if (form.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Please enter a valid 10-digit phone number';
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }
  return errors;
};

export const STEP_VALIDATORS = [validateTrip, validateGroup, validateContact];

// ── Estimate ────────────────────────────────────────────────────────────────────────────────────

export const formatRupees = amount => `₹${Math.round(amount).toLocaleString('en-IN')}`;

// A starting price only: tolls and parking are charged at actuals and Akash confirms every request
export const estimateFare = form => {
  if (form.tripType === 'local') {
    return { amount: PRICING.localBase, basis: 'Local NCR · 8h / 80 km' };
  }
  const length = tripLength(form.pickupAt, form.returnAt);
  const days = length ? length.startedDays : 1;
  return {
    amount: days * PRICING.outstationPerDay,
    basis: `Outstation · ${days} started ${days === 1 ? 'day' : 'days'} at ${formatRupees(
      PRICING.outstationPerDay,
    )} minimum`,
  };
};

// ── The request as an email ─────────────────────────────────────────────────────────────────────

const tripLabel = id => TRIP_TYPES.find(type => type.id === id)?.label || id;

export const buildBookingMailto = form => {
  const subject = `Urbania booking request: ${form.pickup.trim()} to ${form.destination.trim()}`;
  const stops = form.stops.map(stop => stop.trim()).filter(Boolean);
  const fare = estimateFare(form);
  const lines = [
    'Hello,',
    '',
    'I would like to book the pet-friendly Urbania.',
    '',
    `Trip type: ${tripLabel(form.tripType)}`,
    `Pickup: ${form.pickup.trim()}`,
    `Destination: ${form.destination.trim()}`,
  ];
  if (stops.length > 0) {
    lines.push(`Stops: ${stops.join(', ')}`);
  }
  if (form.dropoff.trim()) {
    lines.push(`Drop-off: ${form.dropoff.trim()}`);
  }
  lines.push(`Pickup date and time: ${form.pickupAt.trim()}`);
  if (form.returnAt.trim()) {
    lines.push(`Expected return: ${form.returnAt.trim()}`);
  }
  if (form.stayPlan.trim()) {
    lines.push(`Stay plan: ${form.stayPlan.trim()}`);
  }
  if (form.itinerary.trim()) {
    lines.push(`Itinerary notes: ${form.itinerary.trim()}`);
  }
  if (form.sightseeingKm.trim()) {
    lines.push(`Sightseeing distance: ${form.sightseeingKm.trim()} km`);
  }
  lines.push('', `Passengers: ${form.passengers}`, `Pets: ${form.pets}`);
  if (form.breeds.trim()) {
    lines.push(`Breeds: ${form.breeds.trim()}`);
  }
  lines.push('', `Name: ${form.name.trim()}`, `Phone: ${form.phone.trim()}`);
  if (form.email.trim()) {
    lines.push(`Email: ${form.email.trim()}`);
  }
  lines.push(
    '',
    `Estimate shown in the app: from ${formatRupees(fare.amount)} (${
      fare.basis
    }). Tolls and parking at actuals.`,
    '',
    'Thank you',
  );
  return `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    lines.join('\n'),
  )}`;
};
