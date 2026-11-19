import {
  formatDateTime,
  parseDateTime,
  tripLength,
  validateTrip,
  validateGroup,
  validateContact,
  estimateFare,
  formatRupees,
  buildBookingMailto,
  EMPTY_BOOKING,
  BOOKING_EMAIL,
  PRICING,
} from '../urbaniaBooking';

const NOW = new Date(2026, 10, 19, 10, 0).getTime(); // 19 Nov 2026, 10:00

const trip = {
  ...EMPTY_BOOKING,
  pickup: 'Delhi',
  destination: 'Goa',
  pickupAt: '05/03/2027 09:00',
  returnAt: '06/03/2027 20:00',
};

describe('date and time', () => {
  it('adds the separators as digits are typed', () => {
    expect(formatDateTime('050320270930')).toBe('05/03/2027 09:30');
    expect(formatDateTime('0503')).toBe('05/03');
    expect(formatDateTime('05032027')).toBe('05/03/2027');
    expect(formatDateTime('0503202709')).toBe('05/03/2027 09');
  });

  it('ignores letters and anything past 12 digits', () => {
    expect(formatDateTime('ab05/03/2027 09:30 99')).toBe('05/03/2027 09:30');
  });

  it('reads a real date and time', () => {
    const date = parseDateTime('05/03/2027 09:30');
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(5);
    expect(date.getHours()).toBe(9);
    expect(date.getMinutes()).toBe(30);
  });

  it('returns empty for nothing and null for a date that does not exist', () => {
    expect(parseDateTime('')).toBe('');
    expect(parseDateTime('31/02/2027 09:00')).toBeNull();
    expect(parseDateTime('05/03/2027 25:00')).toBeNull();
    expect(parseDateTime('05/03/27 09:00')).toBeNull();
  });

  it('measures the trip in hours and started days', () => {
    expect(tripLength('05/03/2027 09:00', '05/03/2027 17:00')).toEqual({ hours: 8, startedDays: 1 });
    expect(tripLength('05/03/2027 09:00', '06/03/2027 09:00')).toEqual({ hours: 24, startedDays: 1 });
    expect(tripLength('05/03/2027 09:00', '06/03/2027 09:01').startedDays).toBe(2);
    expect(tripLength('05/03/2027 09:00', '04/03/2027 09:00')).toBeNull();
    expect(tripLength('', '06/03/2027 09:00')).toBeNull();
  });
});

describe('validateTrip', () => {
  it('accepts a complete outstation trip', () => {
    expect(validateTrip({ ...trip, tripType: 'outstation' }, NOW)).toEqual({});
  });

  it('asks for pickup, destination and pickup time', () => {
    const errors = validateTrip(EMPTY_BOOKING, NOW);
    expect(Object.keys(errors).sort()).toEqual(['destination', 'pickup', 'pickupAt']);
  });

  it('needs a return for an outstation trip but not for a local one', () => {
    const noReturn = { ...trip, returnAt: '' };
    expect(validateTrip({ ...noReturn, tripType: 'outstation' }, NOW).returnAt).toBeTruthy();
    expect(validateTrip({ ...noReturn, tripType: 'local' }, NOW).returnAt).toBeUndefined();
  });

  it('rejects a pickup in the past or in the wrong shape', () => {
    expect(validateTrip({ ...trip, pickupAt: '18/11/2026 09:00' }, NOW).pickupAt).toMatch(/past/);
    expect(validateTrip({ ...trip, pickupAt: '05/03/2027' }, NOW).pickupAt).toMatch(/DD\/MM\/YYYY HH:MM/);
  });

  it('needs the return to be after the pickup', () => {
    expect(validateTrip({ ...trip, returnAt: '05/03/2027 08:00' }, NOW).returnAt).toMatch(/after pickup/);
  });

  it('limits a trip to 72 hours and 3 started days', () => {
    const exactly72 = { ...trip, returnAt: '08/03/2027 09:00' };
    expect(validateTrip(exactly72, NOW).returnAt).toBeUndefined();
    const over = { ...trip, returnAt: '08/03/2027 09:01' };
    expect(validateTrip(over, NOW).returnAt).toMatch(/72 hours/);
  });

  it('checks the optional sightseeing distance is a number', () => {
    expect(validateTrip({ ...trip, sightseeingKm: '40' }, NOW).sightseeingKm).toBeUndefined();
    expect(validateTrip({ ...trip, sightseeingKm: '12.5' }, NOW).sightseeingKm).toBeUndefined();
    expect(validateTrip({ ...trip, sightseeingKm: 'far' }, NOW).sightseeingKm).toBeTruthy();
  });
});

describe('validateGroup and validateContact', () => {
  it('keeps the group within the 12 seats', () => {
    expect(validateGroup({ ...EMPTY_BOOKING, passengers: 12 })).toEqual({});
    expect(validateGroup({ ...EMPTY_BOOKING, passengers: 13 }).passengers).toBeTruthy();
    expect(validateGroup({ ...EMPTY_BOOKING, passengers: 0 }).passengers).toBeTruthy();
  });

  it('allows travelling with no pets, but not a negative number', () => {
    expect(validateGroup({ ...EMPTY_BOOKING, pets: 0 })).toEqual({});
    expect(validateGroup({ ...EMPTY_BOOKING, pets: -1 }).pets).toBeTruthy();
  });

  it('needs a name and a 10-digit phone, and checks an email only when given', () => {
    expect(Object.keys(validateContact(EMPTY_BOOKING)).sort()).toEqual(['name', 'phone']);
    const ok = { ...EMPTY_BOOKING, name: 'Rishab', phone: '+91 98765-43210' };
    expect(validateContact(ok)).toEqual({});
    expect(validateContact({ ...ok, email: 'nope' }).email).toBeTruthy();
    expect(validateContact({ ...ok, email: 'a@b.co' })).toEqual({});
  });
});

describe('estimateFare', () => {
  it('starts a local trip at the local price', () => {
    const fare = estimateFare({ ...trip, tripType: 'local' });
    expect(fare.amount).toBe(5850);
    expect(fare.basis).toMatch(/Local NCR/);
  });

  it('charges an outstation trip the daily minimum for every started day', () => {
    // 9:00 on the 5th to 20:00 on the 6th = 35 hours = 2 started days
    expect(estimateFare({ ...trip, tripType: 'outstation' }).amount).toBe(2 * PRICING.outstationPerDay);
    expect(
      estimateFare({ ...trip, tripType: 'outstation', returnAt: '05/03/2027 18:00' }).amount
    ).toBe(PRICING.outstationPerDay);
  });

  it('falls back to one day when the return is missing', () => {
    expect(estimateFare({ ...trip, tripType: 'outstation', returnAt: '' }).amount).toBe(8800);
  });

  it('writes rupees the Indian way', () => {
    expect(formatRupees(5850)).toBe('₹5,850');
    expect(formatRupees(17600)).toBe('₹17,600');
    expect(formatRupees(125000)).toBe('₹1,25,000');
  });
});

describe('buildBookingMailto', () => {
  const full = {
    ...trip,
    tripType: 'outstation',
    stops: ['Jaipur', ' ', 'Udaipur'],
    dropoff: 'Gurugram',
    stayPlan: 'Hotel in Goa',
    itinerary: 'Beach day',
    sightseeingKm: '40',
    passengers: 6,
    pets: 3,
    breeds: 'Labrador, Beagle',
    name: 'Rishab',
    phone: '9876543210',
    email: 'r@example.com',
  };
  const body = url => decodeURIComponent(url.split('&body=')[1]);

  it('addresses the booking email with the route in the subject', () => {
    const url = buildBookingMailto(full);
    expect(url.startsWith(`mailto:${BOOKING_EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(url.split('subject=')[1].split('&body=')[0])).toBe(
      'Urbania booking request: Delhi to Goa'
    );
  });

  it('lists every detail that was filled in', () => {
    const text = body(buildBookingMailto(full));
    expect(text).toContain('Trip type: Outstation');
    expect(text).toContain('Stops: Jaipur, Udaipur');
    expect(text).toContain('Drop-off: Gurugram');
    expect(text).toContain('Pickup date and time: 05/03/2027 09:00');
    expect(text).toContain('Expected return: 06/03/2027 20:00');
    expect(text).toContain('Stay plan: Hotel in Goa');
    expect(text).toContain('Itinerary notes: Beach day');
    expect(text).toContain('Sightseeing distance: 40 km');
    expect(text).toContain('Passengers: 6');
    expect(text).toContain('Pets: 3');
    expect(text).toContain('Breeds: Labrador, Beagle');
    expect(text).toContain('Name: Rishab');
    expect(text).toContain('Phone: 9876543210');
    expect(text).toContain('Email: r@example.com');
    expect(text).toContain('from ₹17,600');
  });

  it('leaves out what was not filled in', () => {
    const text = body(buildBookingMailto({ ...trip, name: 'A', phone: '9876543210' }));
    expect(text).not.toContain('Stops:');
    expect(text).not.toContain('Drop-off:');
    expect(text).not.toContain('Stay plan:');
    expect(text).not.toContain('Email:');
  });

  it('encodes characters that would break a link', () => {
    const url = buildBookingMailto({ ...full, itinerary: 'a&b=c' });
    expect(url.split('&body=')[1]).not.toMatch(/[ &=]/);
  });
});
