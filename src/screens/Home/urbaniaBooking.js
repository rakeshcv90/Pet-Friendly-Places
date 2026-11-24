// Rules, prices and wording for booking the pet-friendly Urbania (Home > Book Now).
// Kept free of any screen code so it can be tested on its own.

export const TRIP_TYPES = [
  { id: 'local', label: 'Local NCR' },
  { id: 'outstation', label: 'Outstation' },
];

export const MAX_PASSENGERS = 12;
export const MAX_PETS = 50;
export const MAX_STOPS = 5;
// A booking may run for at most 72 hours, touching at most 3 booking days
export const MAX_HOURS = 72;
export const MAX_STARTED_DAYS = 3;
export const MAX_NIGHTS = 2;
export const WINDOW_ERROR =
  'Enter a valid trip window up to 3 started days, 2 nights and 72 hours.';
export const BASE_PLACE = 'Urbania base, Udyog Vihar Phase 5, Gurugram';

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
  // How the fare is worked out: the per-km price before the 10% pet-parent discount, the discount,
  // and the shortest distance a started 24-hour day is charged for
  outstationKmRate: 36,
  discountPercent: 10,
  minKmPerDay: 250,
  localHours: 8,
};

export const EMPTY_BOOKING = {
  tripType: 'local',
  pickup: '',
  destination: '',
  stops: [],
  dropoff: '',
  pickupAt: '',
  returnAt: '',
  // The calendar day and the exact time are chosen separately; pickupAt and returnAt are made from them
  pickupDate: '',
  returnDate: '',
  pickupTime: '09:00',
  returnTime: '18:00',
  stayPlan: '',
  itinerary: '',
  sightseeingKm: '',
  passengers: 2,
  pets: 1,
  breeds: '',
  luggage: '',
  special: '',
  nightDriving: false,
  nightPeriods: 1,
  name: '',
  phone: '',
  email: '',
  agreed: false,
  ageConfirmed: false,
  accountTerms: false,
};

// ── Date and time (DD/MM/YYYY HH:MM) ────────────────────────────────────────────────────────────

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

// The trip window the website shows: hours, started 24-hour days and nights (midnights crossed)
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate());
export const tripWindow = (pickupAt, returnAt) => {
  const start = parseDateTime(pickupAt);
  const end = parseDateTime(returnAt);
  if (!start || !end || end <= start) {
    return null;
  }
  const hours = (end - start) / HOUR;
  const minutes = Math.round((end - start) / 60000);
  return {
    hours,
    startedDays: Math.ceil(hours / 24),
    nights: Math.round((startOfDay(end) - startOfDay(start)) / (24 * HOUR)),
    label: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
  };
};

export const isWindowValid = window =>
  !!window &&
  window.hours <= MAX_HOURS &&
  window.startedDays <= MAX_STARTED_DAYS &&
  window.nights <= MAX_NIGHTS;

// "3 started day(s) · 2 night(s) · 54h 1m"
export const describeWindow = window =>
  `${window.startedDays} started day(s) · ${window.nights} night(s) · ${window.label}`;

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
    errors.pickupAt = 'Select the pickup date on the calendar';
  } else if (start === null) {
    errors.pickupAt = 'Use DD/MM/YYYY HH:MM, for example 05/03/2027 09:30';
  } else if (start.getTime() < now) {
    errors.pickupAt = 'Pickup cannot be in the past';
  }

  const end = parseDateTime(form.returnAt);
  if (!form.returnAt.trim()) {
    if (form.tripType === 'outstation') {
      errors.returnAt = 'Select the return date on the calendar for an outstation trip';
    }
  } else if (end === null) {
    errors.returnAt = 'Use DD/MM/YYYY HH:MM, for example 06/03/2027 20:00';
  } else if (start && end <= start) {
    errors.returnAt = 'Return must be after pickup';
  } else if (start && !isWindowValid(tripWindow(form.pickupAt, form.returnAt))) {
    // Too long for a booking: shown as one message under the Next button, like the website
    errors.window = WINDOW_ERROR;
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
  if (!form.email.trim()) {
    errors.email = 'Please enter your email address';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }
  if (!form.agreed) {
    errors.agreed = 'Please confirm you understand this is a provisional request';
  }
  if (!form.ageConfirmed) {
    errors.ageConfirmed = 'Please confirm that you are 18 or older';
  }
  if (!form.accountTerms) {
    errors.accountTerms = 'Please accept the Terms of Service and Privacy Policy';
  }
  return errors;
};

export const STEP_VALIDATORS = [validateTrip, validateGroup, validateContact];

// ── Estimate ────────────────────────────────────────────────────────────────────────────────────

export const formatRupees = amount => `₹${Math.round(amount).toLocaleString('en-IN')}`;
export const formatRupeesExact = amount =>
  `${amount < 0 ? '-' : ''}₹${Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// The overnight periods in the trip that night driving can be asked for
export const overnightPeriods = form => {
  const window = tripWindow(form.pickupAt, form.returnAt);
  return window ? window.nights : 0;
};

// How many overnight periods are charged for night driving: only when it is asked for, and never
// more than the trip has
export const chargedNights = form => {
  const nights = overnightPeriods(form);
  if (!form.nightDriving || nights < 1) {
    return 0;
  }
  return Math.min(Math.max(form.nightPeriods, 1), nights);
};

// ── The request sent to the booking API ─────────────────────────────────────────────────────────

// The service runs on Asia/Kolkata, so a typed "05/03/2027 09:30" is that wall-clock time in IST
export const IST_OFFSET = '+05:30';

// "05/03/2027 09:30" -> "2027-03-05T09:30:00+05:30"; '' when it is not a real date and time
export const toIstIso = text => {
  const date = parseDateTime(text);
  if (!date) {
    return '';
  }
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:00${IST_OFFSET}`;
};

// The API needs a return time for every trip, local ones too. A local trip without a chosen return day
// ends the same day at the chosen return time (6 pm unless changed), or 8 hours after pickup when that
// time is not after the pickup.
export const returnForPayload = form => {
  if (form.returnAt.trim()) {
    return toIstIso(form.returnAt);
  }
  const start = parseDateTime(form.pickupAt);
  if (!start) {
    return '';
  }
  const [hour, minute] = String(form.returnTime || '18:00')
    .split(':')
    .map(Number);
  let end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), hour, minute || 0);
  if (!(end > start)) {
    end = new Date(start.getTime() + 8 * 60 * 60 * 1000);
  }
  const pad = number => String(number).padStart(2, '0');
  return toIstIso(
    `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()} ${pad(
      end.getHours(),
    )}:${pad(end.getMinutes())}`,
  );
};

const trimmedStops = form => form.stops.map(stop => stop.trim()).filter(Boolean);

// The trip fields shared by the estimate and the request
export const buildTripPayload = form => {
  const pickupAddress = form.pickup.trim();
  const nights = chargedNights(form);
  return {
    tripType: form.tripType,
    pickupAddress,
    destinationAddress: form.destination.trim(),
    stops: trimmedStops(form),
    dropAddress: form.dropoff.trim() || pickupAddress,
    pickupAt: toIstIso(form.pickupAt),
    // The API requires this for every trip, local ones too (it answers "Required" without it)
    expectedReturnAt: returnForPayload(form),
    sightseeingKm: Number(form.sightseeingKm) || 0,
    passengers: form.passengers,
    petCount: form.pets,
    nightDrivingRequested: nights > 0,
    nightDrivingNights: nights,
  };
};

// All three tick boxes are needed before a request can be sent
export const hasAllConsents = form =>
  form.agreed === true && form.ageConfirmed === true && form.accountTerms === true;

export const buildRequestPayload = (form, idempotencyKey) => ({
  ...buildTripPayload(form),
  customerName: form.name.trim(),
  customerPhone: form.phone.trim(),
  customerEmail: form.email.trim(),
  idempotencyKey,
  termsAccepted: form.agreed === true,
  accountAgeAffirmed: form.ageConfirmed === true,
  accountTermsAccepted: form.accountTerms === true,
  connectToAccount: false,
});

// A new key for one submission. Reuse it only to retry that same submission.
export const newIdempotencyKey = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random % 4) + 8).toString(16);
  });

// ── Reading the API's answers ───────────────────────────────────────────────────────────────────

// Availability for a window -> { available, message }. Only an explicit "no" blocks the booking, so
// an answer in a shape we do not know never stops a customer from asking.
export const readAvailability = data => {
  const source =
    data?.availability && typeof data.availability === 'object' ? data.availability : data;
  const flag = [source?.available, source?.isAvailable, source?.ok].find(
    value => typeof value === 'boolean',
  );
  const status = String(source?.status || '').toLowerCase();
  const blocked =
    flag === false || ['unavailable', 'blocked', 'conflict', 'booked'].includes(status);
  return {
    available: !blocked,
    message: blocked
      ? source?.message ||
        source?.reason ||
        'The Urbania is not available for this window. Please choose different dates.'
      : '',
  };
};

const money = paise => Number(paise) / 100;

// "vehicleFareBeforeDiscount" -> "Vehicle fare before discount"
export const humanizeKey = key =>
  String(key)
    .replace(/(Paise|Amount)$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^./, char => char.toUpperCase());

// Keys that hold a quantity, not money
const QUANTITY_WORDS =
  /^(percent|percentage|km|kms|distance|days?|hours?|minutes?|seconds?|count|rate)$/;
const isQuantity = key =>
  humanizeKey(key)
    .toLowerCase()
    .split(' ')
    .some(word => QUANTITY_WORDS.test(word));
const TOTAL_KEY = /^(total|grand|totalfare|fare)/i;

// The server's fare lines, in the website's order and words
const FARE_LINES = [
  ['regularVehiclePaise', 'Vehicle fare before discount'],
  ['discountPaise', 'Pet-parent discount', true],
  ['discountedVehiclePaise', 'Discounted vehicle fare'],
  ['includedDriverPaise', 'Included driver cost'],
  ['nightChargePaise', 'Night driving'],
  ['totalPaise', 'Total fare', false, true],
];
const FARE_SUMMARY = {
  advancePaise: 'advance',
  balancePaise: 'balance',
  refundableDepositPaise: 'deposit',
};
const FARE_HANDLED = [...FARE_LINES.map(line => line[0]), ...Object.keys(FARE_SUMMARY)];

const kmText = meters => `${(Math.round(meters / 100) / 10).toLocaleString('en-IN')} km`;

// The server's ISO time -> "1 Dec 2026, 9:13 am" in India time
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
export const formatIst = iso => {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) {
    return '';
  }
  const date = new Date(time + 330 * 60000);
  const hour = date.getUTCHours();
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${
    ((hour + 11) % 12) + 1
  }:${two(date.getUTCMinutes())} ${hour < 12 ? 'am' : 'pm'}`;
};

// The estimate answer -> what the Request step shows. The fare is in paise (null when the route needs
// a manual review), so every money value is divided by 100 for rupees.
export const readEstimate = data => {
  const fare = data?.fare && typeof data.fare === 'object' ? data.fare : null;
  const known = [];
  const other = [];
  if (fare) {
    FARE_LINES.forEach(([key, label, negative, strong]) => {
      if (typeof fare[key] === 'number') {
        known.push({ key, label, value: money(fare[key]), negative: !!negative, strong: !!strong });
      }
    });
    Object.entries(fare)
      .filter(
        ([key, value]) =>
          typeof value === 'number' && !FARE_HANDLED.includes(key) && !isQuantity(key),
      )
      .forEach(([key, value]) =>
        other.push({
          key,
          label: humanizeKey(key),
          value: money(value),
          negative: false,
          strong: TOTAL_KEY.test(key),
        }),
      );
  }
  const rows = [...known, ...other].sort((a, b) => Number(a.strong) - Number(b.strong));

  const summary = {};
  Object.entries(FARE_SUMMARY).forEach(([key, name]) => {
    if (typeof fare?.[key] === 'number') {
      summary[name] = money(fare[key]);
    }
  });

  const outstation =
    fare?.outstation && typeof fare.outstation === 'object' ? fare.outstation : null;
  const billableKm =
    typeof outstation?.billableDistanceMeters === 'number'
      ? outstation.billableDistanceMeters / 1000
      : null;
  const minimumKm =
    typeof outstation?.minimumDistanceMeters === 'number'
      ? outstation.minimumDistanceMeters / 1000
      : null;
  const fareNote =
    outstation && typeof outstation.bookingDays === 'number' && minimumKm !== null
      ? `${
          outstation.bookingDays
        } started booking day(s); minimum distance ${minimumKm} km. The vehicle charge uses the greater of actual route distance or that minimum${
          billableKm !== null
            ? ` (${(Math.round(billableKm * 10) / 10).toLocaleString('en-IN')} km billable)`
            : ''
        }.`
      : '';

  const route = data?.route && typeof data.route === 'object' ? data.route : {};
  const totalMeters =
    typeof route.totalDistanceMeters === 'number'
      ? route.totalDistanceMeters
      : route.distanceMeters;
  const distanceKm =
    route.distanceKm ?? (typeof totalMeters === 'number' ? totalMeters / 1000 : null);
  const totalSeconds =
    typeof route.totalDurationSeconds === 'number'
      ? route.totalDurationSeconds
      : route.durationSeconds;
  const durationMinutes =
    route.durationMinutes ?? (typeof totalSeconds === 'number' ? totalSeconds / 60 : null);

  const legs = (Array.isArray(route.legs) ? route.legs : [])
    .filter(leg => leg && typeof leg.distanceMeters === 'number')
    .map(leg => ({
      from: String(leg.from || ''),
      to: String(leg.to || ''),
      text: `${kmText(leg.distanceMeters)} · ${formatDuration(
        Math.round((leg.durationSeconds || 0) / 60),
      )}`,
    }));

  const reasons = (Array.isArray(data?.manualReviewReasons) ? data.manualReviewReasons : [])
    .map(reason => (typeof reason === 'string' ? reason : reason?.message || reason?.reason || ''))
    .filter(Boolean);

  const availability = readAvailability(
    data?.availability && typeof data.availability === 'object'
      ? data
      : typeof data?.availability === 'string'
      ? { status: data.availability === 'manual_review' ? '' : data.availability }
      : {},
  );

  return {
    hasFare: rows.length > 0,
    rows,
    summary,
    fareNote,
    legs,
    source: typeof route.provider === 'string' ? route.provider : '',
    windowStart: route.baseWindowStart ? formatIst(route.baseWindowStart) : '',
    windowEnd: route.baseWindowEnd ? formatIst(route.baseWindowEnd) : '',
    availabilityMessage:
      typeof data?.availabilityMessage === 'string' ? data.availabilityMessage : '',
    distanceKm: typeof distanceKm === 'number' ? Math.round(distanceKm * 10) / 10 : null,
    durationMinutes: typeof durationMinutes === 'number' ? Math.round(durationMinutes) : null,
    reasons,
    availability,
  };
};

// The request answer -> { reference, statusToken, status }
export const readRequestResult = data => {
  const source = data?.request && typeof data.request === 'object' ? data.request : data || {};
  return {
    reference: String(source.reference || data?.reference || ''),
    statusToken: String(data?.statusToken || source.statusToken || ''),
    status: String(source.status || data?.status || ''),
  };
};

// "pending_review" -> "Pending review"
export const statusLabel = status =>
  String(status || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^./, char => char.toUpperCase());

// The status answer -> { status, message, estimate }. The fare is read like the estimate's, so one
// breakdown can show either; estimate is null when the answer carries no fare.
export const readBookingStatus = data => {
  const source = data?.request && typeof data.request === 'object' ? data.request : data || {};
  const fareSource = source.fare ?? source.quote?.fare ?? data?.fare;
  return {
    status: String(source.status || data?.status || ''),
    message: String(data?.message || source.message || source.statusMessage || ''),
    estimate:
      fareSource && typeof fareSource === 'object'
        ? readEstimate({ fare: fareSource, route: source.route ?? data?.route })
        : null,
  };
};

// The account's booking list -> the records the history page shows. The list may come bare or inside
// bookings / requests / items / data; each booking's trip fields are read by their API names.
export const readAccountBookings = data => {
  const list = Array.isArray(data)
    ? data
    : data?.bookings || data?.requests || data?.items || data?.data || data?.results || [];
  const text = value => (typeof value === 'string' ? value.trim() : '');
  const address = value =>
    typeof value === 'string' ? value.trim() : text(value?.address || value?.name || value?.label);
  return (Array.isArray(list) ? list : [])
    .map(item => {
      const source = item?.request && typeof item.request === 'object' ? item.request : item || {};
      const reference = text(source.reference || item?.reference);
      const fareSource = source.fare ?? source.quote ?? item?.fare ?? item?.quote;
      const estimate =
        fareSource && typeof fareSource === 'object' ? readEstimate({ fare: fareSource }) : null;
      const strong = estimate?.rows?.find(row => row.strong)?.value;
      const total =
        typeof strong === 'number'
          ? strong
          : typeof source.totalPaise === 'number'
          ? money(source.totalPaise)
          : null;
      // The address fields may be named a few ways, as a plain string or as { address }
      const pick = (...keys) => {
        for (const key of keys) {
          const found = address(source[key] ?? item?.[key]);
          if (found) {
            return found;
          }
        }
        return '';
      };
      const stopList = source.stops ?? source.plannedStops ?? item?.stops ?? [];
      const stops = (Array.isArray(stopList) ? stopList : [])
        .map(address)
        .filter(Boolean)
        .map(place => ({ kind: 'stop', address: place }));
      const places = [
        ['pickup', pick('pickupAddress', 'pickup', 'pickupLocation', 'pickup_address')],
        ...stops.map(stop => ['stop', stop.address]),
        [
          'destination',
          pick('destinationAddress', 'destination', 'destinationLocation', 'destination_address'),
        ],
        [
          'drop',
          pick(
            'dropAddress',
            'dropoffAddress',
            'dropLocation',
            'finalDrop',
            'drop',
            'drop_address',
          ),
        ],
      ]
        .map(([kind, value]) => ({ kind, address: value }))
        .filter(place => place.address);
      return {
        reference,
        status: text(source.status || item?.status) || 'pending_review',
        tripType: source.tripType === 'local' ? 'local' : 'outstation',
        pickupLabel: formatIst(source.pickupAt),
        returnLabel: formatIst(source.expectedReturnAt),
        pickupAt: text(source.pickupAt ?? source.pickup_at),
        places,
        fare: total === null ? null : { total, ...(estimate?.summary || {}) },
        message: text(item?.message || source.message || source.statusMessage),
        remote: true,
      };
    })
    .filter(booking => booking.reference);
};

// The account's bookings first (they are the source of truth), then any made on this phone that the
// account list does not have
export const mergeBookings = (remote, local) => {
  const known = new Set(remote.map(item => item.reference));
  return [...remote, ...local.filter(item => !known.has(item.reference))];
};

// A Google Maps link that searches for the address
export const mapUrl = address =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(address || ''))}`;

export const formatDuration = minutes => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

// ── Calendar ────────────────────────────────────────────────────────────────────────────────────

export const DEFAULT_PICKUP_TIME = '09:00';
export const DEFAULT_RETURN_TIME = '18:00';

const two = number => String(number).padStart(2, '0');

// A Date -> "2027-01-15" (the key the availability answer is read by) and "15/01/2027" (the form's text)
export const dayKey = date =>
  `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
export const toDateText = date =>
  `${two(date.getDate())}/${two(date.getMonth() + 1)}/${date.getFullYear()}`;
export const monthKey = date => `${date.getFullYear()}-${two(date.getMonth() + 1)}`;

// "15/01/2027" -> a Date at midnight, or null
export const parseDateText = text => {
  const date = parseDateTime(`${String(text || '').trim()} 00:00`);
  return date || null;
};

// The weeks of a month for the grid: null for the empty cells before the 1st, then each day
export const monthDays = (year, monthIndex) => {
  const lead = new Date(year, monthIndex, 1).getDay();
  const count = new Date(year, monthIndex + 1, 0).getDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];
};

// "09:00" -> "09:00 AM"
export const formatTime12 = time => {
  const [hour, minute] = String(time || '00:00')
    .split(':')
    .map(Number);
  return `${two(((hour + 11) % 12) + 1)}:${two(minute || 0)} ${hour < 12 ? 'AM' : 'PM'}`;
};

// A date and a time -> the form's "DD/MM/YYYY HH:MM"; '' until there is a date
export const composeDateTime = (dateText, time) => (dateText ? `${dateText} ${time}` : '');

const STATUS_WORDS = {
  available: 'available',
  open: 'available',
  free: 'available',
  partial: 'partial',
  partially_available: 'partial',
  'partially available': 'partial',
  limited: 'partial',
  unavailable: 'unavailable',
  booked: 'unavailable',
  blocked: 'unavailable',
  closed: 'unavailable',
  full: 'unavailable',
};

const readStatus = item => {
  if (typeof item === 'string') {
    return STATUS_WORDS[item.toLowerCase()] || null;
  }
  if (typeof item === 'boolean') {
    return item ? 'available' : 'unavailable';
  }
  if (item && typeof item === 'object') {
    const word = item.status ?? item.state ?? item.availability;
    if (word !== undefined) {
      return readStatus(word);
    }
    return typeof item.available === 'boolean' ? readStatus(item.available) : null;
  }
  return null;
};

// The month's answer -> { "2027-01-15": "available" | "partial" | "unavailable" }. A day the answer
// does not mention is left out, and the calendar shows it as open.
export const readMonthAvailability = data => {
  const source = data?.days ?? data?.dates ?? data?.calendar ?? data?.availability ?? data;
  const result = {};
  const add = (key, item) => {
    const status = readStatus(item);
    if (/^\d{4}-\d{2}-\d{2}/.test(String(key)) && status) {
      result[String(key).slice(0, 10)] = status;
    }
  };
  if (Array.isArray(source)) {
    source.forEach(item => add(item?.date ?? item?.day, item));
  } else if (source && typeof source === 'object') {
    Object.entries(source).forEach(([key, item]) => add(key, item));
  }
  return result;
};
