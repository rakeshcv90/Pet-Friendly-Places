import {
  tripWindow,
  isWindowValid,
  describeWindow,
  formatRupeesExact,
  chargedNights,
  overnightPeriods,
  WINDOW_ERROR,
  parseDateTime,
  tripLength,
  validateTrip,
  validateGroup,
  validateContact,
  formatRupees,
  EMPTY_BOOKING,
  PRICING,
  toIstIso,
  buildTripPayload,
  buildRequestPayload,
  newIdempotencyKey,
  readAvailability,
  readEstimate,
  readRequestResult,
  readAccountBookings,
  mergeBookings,
  hasAllConsents,
  returnForPayload,
  readBookingStatus,
  statusLabel,
  mapUrl,
  humanizeKey,
  formatDuration,
  dayKey,
  toDateText,
  monthKey,
  parseDateText,
  monthDays,
  formatTime12,
  composeDateTime,
  readMonthAvailability,
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
    expect(tripLength('05/03/2027 09:00', '05/03/2027 17:00')).toEqual({
      hours: 8,
      startedDays: 1,
    });
    expect(tripLength('05/03/2027 09:00', '06/03/2027 09:00')).toEqual({
      hours: 24,
      startedDays: 1,
    });
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
    expect(validateTrip({ ...trip, pickupAt: '05/03/2027' }, NOW).pickupAt).toMatch(
      /DD\/MM\/YYYY HH:MM/,
    );
  });

  it('needs the return to be after the pickup', () => {
    expect(validateTrip({ ...trip, returnAt: '05/03/2027 08:00' }, NOW).returnAt).toMatch(
      /after pickup/,
    );
  });

  it('limits a trip to 72 hours, 3 started days and 2 nights, with one message for all of them', () => {
    // 60 hours, 3 started days, 2 nights: fine
    expect(validateTrip({ ...trip, returnAt: '07/03/2027 21:00' }, NOW).window).toBeUndefined();
    // Exactly 72 hours but across 3 nights: too long
    expect(validateTrip({ ...trip, returnAt: '08/03/2027 09:00' }, NOW).window).toBe(WINDOW_ERROR);
    // Over 72 hours
    expect(validateTrip({ ...trip, returnAt: '08/03/2027 09:01' }, NOW).window).toBe(WINDOW_ERROR);
    // 2 nights but 4 started days
    expect(
      validateTrip({ ...trip, pickupAt: '05/03/2027 00:30', returnAt: '07/03/2027 23:30' }, NOW)
        .window,
    ).toBeUndefined();
  });

  it('writes the too-long message the way the website does', () => {
    expect(WINDOW_ERROR).toBe(
      'Enter a valid trip window up to 3 started days, 2 nights and 72 hours.',
    );
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

  it('needs a name, a 10-digit phone, an email and the agreement', () => {
    expect(Object.keys(validateContact(EMPTY_BOOKING)).sort()).toEqual([
      'accountTerms',
      'ageConfirmed',
      'agreed',
      'email',
      'name',
      'phone',
    ]);
    const ok = {
      ...EMPTY_BOOKING,
      name: 'Rishab',
      phone: '+91 98765-43210',
      email: 'a@b.co',
      agreed: true,
      ageConfirmed: true,
      accountTerms: true,
    };
    expect(validateContact(ok)).toEqual({});
    expect(validateContact({ ...ok, email: 'nope' }).email).toBeTruthy();
    expect(validateContact({ ...ok, agreed: false }).agreed).toBeTruthy();
  });
});

describe('trip window', () => {
  // The website's example: 1 Dec 13:42 to 3 Dec 19:43
  const window = tripWindow('01/12/2026 13:42', '03/12/2026 19:43');

  it('measures hours, started days and nights', () => {
    expect(window.startedDays).toBe(3);
    expect(window.nights).toBe(2);
    expect(window.label).toBe('54h 1m');
    expect(describeWindow(window)).toBe('3 started day(s) · 2 night(s) · 54h 1m');
  });

  it('counts a night for every midnight the trip crosses', () => {
    expect(tripWindow('05/03/2027 09:00', '05/03/2027 17:00').nights).toBe(0);
    expect(tripWindow('05/03/2027 22:00', '06/03/2027 06:00').nights).toBe(1);
    expect(tripWindow('05/03/2027 09:00', '08/03/2027 09:00').nights).toBe(3);
  });

  it('has no window until both times are real and the return is after the pickup', () => {
    expect(tripWindow('', '03/12/2026 19:43')).toBeNull();
    expect(tripWindow('01/12/2026 13:42', '')).toBeNull();
    expect(tripWindow('03/12/2026 19:43', '01/12/2026 13:42')).toBeNull();
    expect(tripWindow('31/02/2026 13:42', '03/12/2026 19:43')).toBeNull();
  });

  it('is valid up to 3 started days, 2 nights and 72 hours', () => {
    expect(isWindowValid(window)).toBe(true);
    expect(isWindowValid(tripWindow('05/03/2027 09:00', '08/03/2027 09:00'))).toBe(false);
    expect(isWindowValid(tripWindow('05/03/2027 09:00', '08/03/2027 09:01'))).toBe(false);
    expect(isWindowValid(null)).toBe(false);
  });
});

describe('rupees', () => {
  it('writes rupees the Indian way', () => {
    expect(formatRupees(5850)).toBe('₹5,850');
    expect(formatRupees(125000)).toBe('₹1,25,000');
    expect(formatRupeesExact(33168.17)).toBe('₹33,168.17');
    expect(formatRupeesExact(5000)).toBe('₹5,000.00');
    expect(formatRupeesExact(-3316.82)).toBe('-₹3,316.82');
  });
});

describe('toIstIso', () => {
  it('writes the typed time as Asia/Kolkata, with the +05:30 offset kept', () => {
    expect(toIstIso('15/01/2027 09:00')).toBe('2027-01-15T09:00:00+05:30');
    expect(toIstIso('05/03/2027 18:05')).toBe('2027-03-05T18:05:00+05:30');
  });

  it('gives nothing for a time that is empty or not real', () => {
    expect(toIstIso('')).toBe('');
    expect(toIstIso('31/02/2027 09:00')).toBe('');
  });
});

describe('buildTripPayload', () => {
  const form = {
    ...trip,
    tripType: 'outstation',
    pickup: ' Gurugram pickup address ',
    destination: 'Jaipur destination',
    stops: ['Manesar', '  '],
    pickupAt: '15/01/2027 09:00',
    returnAt: '16/01/2027 18:00',
    passengers: 2,
    pets: 1,
  };

  it('has exactly the fields the estimate takes, in the shape the API documents', () => {
    expect(buildTripPayload(form)).toEqual({
      tripType: 'outstation',
      pickupAddress: 'Gurugram pickup address',
      destinationAddress: 'Jaipur destination',
      stops: ['Manesar'],
      dropAddress: 'Gurugram pickup address',
      pickupAt: '2027-01-15T09:00:00+05:30',
      expectedReturnAt: '2027-01-16T18:00:00+05:30',
      sightseeingKm: 0,
      passengers: 2,
      petCount: 1,
      nightDrivingRequested: false,
      nightDrivingNights: 0,
    });
  });

  it('drops off at the pickup unless another drop-off is given', () => {
    expect(buildTripPayload(form).dropAddress).toBe('Gurugram pickup address');
    expect(buildTripPayload({ ...form, dropoff: 'Delhi airport' }).dropAddress).toBe(
      'Delhi airport',
    );
  });

  it('always sends a return time, as the API requires it, and the sightseeing km as a number', () => {
    const local = buildTripPayload({
      ...form,
      tripType: 'local',
      returnAt: '',
      returnTime: '18:00',
      sightseeingKm: '40.5',
    });
    expect(local.expectedReturnAt).toBe('2027-01-15T18:00:00+05:30');
    expect(local.sightseeingKm).toBe(40.5);
  });

  it('ends a local trip 8 hours after pickup when the return time is not after it', () => {
    const local = buildTripPayload({
      ...form,
      tripType: 'local',
      pickupAt: '15/01/2027 19:00',
      returnAt: '',
      returnTime: '18:00',
    });
    expect(local.expectedReturnAt).toBe('2027-01-16T03:00:00+05:30');
  });

  it('keeps a chosen return day for a local trip', () => {
    const local = buildTripPayload({ ...form, tripType: 'local' });
    expect(local.expectedReturnAt).toBe('2027-01-16T18:00:00+05:30');
  });

  it('asks for night driving only for the overnight periods the trip really has', () => {
    const night = { ...form, nightDriving: true, nightPeriods: 2 };
    expect(buildTripPayload(night)).toMatchObject({
      nightDrivingRequested: true,
      nightDrivingNights: 1,
    });
    const sameDay = { ...night, returnAt: '15/01/2027 18:00' };
    expect(buildTripPayload(sameDay)).toMatchObject({
      nightDrivingRequested: false,
      nightDrivingNights: 0,
    });
  });
});

describe('buildRequestPayload', () => {
  const form = {
    ...trip,
    pickupAt: '15/01/2027 09:00',
    returnAt: '16/01/2027 18:00',
    name: ' Rishab ',
    phone: '9876543210',
    email: 'r@example.com',
    agreed: true,
    ageConfirmed: true,
    accountTerms: true,
  };

  it('adds the customer, the key and the consent to the trip fields', () => {
    expect(buildRequestPayload(form, 'key-1')).toMatchObject({
      pickupAddress: 'Delhi',
      customerName: 'Rishab',
      customerPhone: '9876543210',
      customerEmail: 'r@example.com',
      idempotencyKey: 'key-1',
      termsAccepted: true,
      accountAgeAffirmed: true,
      accountTermsAccepted: true,
      connectToAccount: false,
    });
  });

  it('only says each consent was given when it really was', () => {
    expect(buildRequestPayload({ ...form, agreed: false }, 'k').termsAccepted).toBe(false);
    expect(buildRequestPayload({ ...form, ageConfirmed: false }, 'k').accountAgeAffirmed).toBe(
      false,
    );
    expect(buildRequestPayload({ ...form, accountTerms: false }, 'k').accountTermsAccepted).toBe(
      false,
    );
  });

  it('needs all three consents', () => {
    expect(hasAllConsents(form)).toBe(true);
    expect(hasAllConsents({ ...form, agreed: false })).toBe(false);
    expect(hasAllConsents({ ...form, ageConfirmed: false })).toBe(false);
    expect(hasAllConsents({ ...form, accountTerms: false })).toBe(false);
  });
});

describe('newIdempotencyKey', () => {
  it('looks like a version 4 UUID, and is new each time', () => {
    const key = newIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(newIdempotencyKey()).not.toBe(key);
  });
});

describe('readAvailability', () => {
  it('lets the request go on when the answer says available, or says nothing we know', () => {
    expect(readAvailability({ available: true }).available).toBe(true);
    expect(readAvailability({ availability: { isAvailable: true } }).available).toBe(true);
    expect(readAvailability({}).available).toBe(true);
    expect(readAvailability(undefined).available).toBe(true);
  });

  it('stops it on a clear no, with the reason the server gave', () => {
    const answer = readAvailability({ available: false, message: 'Already booked' });
    expect(answer).toEqual({ available: false, message: 'Already booked' });
    expect(readAvailability({ availability: { status: 'conflict' } }).available).toBe(false);
    expect(readAvailability({ available: false }).message).toMatch(/not available/);
  });
});

describe('readEstimate', () => {
  const answer = {
    route: { distanceMeters: 281400, durationSeconds: 19800 },
    fare: {
      regularVehiclePaise: 1000000,
      discountPaise: 100000,
      totalPaise: 1020000,
      discountPercent: 10,
      billableKm: 250,
    },
    manualReviewReasons: ['Night driving needs review', { message: 'Long route' }],
  };

  it('turns the fare from paise into rupees, with the total last', () => {
    const { rows, hasFare } = readEstimate(answer);
    expect(hasFare).toBe(true);
    expect(rows.map(row => [row.label, row.value])).toEqual([
      ['Vehicle fare before discount', 10000],
      ['Pet-parent discount', 1000],
      ['Total fare', 10200],
    ]);
    expect(rows[rows.length - 1].strong).toBe(true);
  });

  it('does not show quantities such as percents or km as money', () => {
    const keys = readEstimate(answer).rows.map(row => row.key);
    expect(keys).not.toContain('discountPercent');
    expect(keys).not.toContain('billableKm');
  });

  it('reads the route distance in km and the drive time in minutes', () => {
    const { distanceKm, durationMinutes } = readEstimate(answer);
    expect(distanceKm).toBe(281.4);
    expect(durationMinutes).toBe(330);
    expect(formatDuration(330)).toBe('5h 30m');
  });

  it('lists the reasons for a manual review', () => {
    expect(readEstimate(answer).reasons).toEqual(['Night driving needs review', 'Long route']);
  });

  it('has no fare when the API sends none (manual review)', () => {
    const manual = readEstimate({ route: {}, fare: null, manualReviewReasons: ['Remote area'] });
    expect(manual.hasFare).toBe(false);
    expect(manual.rows).toEqual([]);
    expect(manual.distanceKm).toBeNull();
    expect(manual.reasons).toEqual(['Remote area']);
  });

  it('keeps the night-driving charge, which is money, not a count of nights', () => {
    const { rows } = readEstimate({ fare: { nightChargePaise: 100000, totalPaise: 100000 } });
    expect(rows.map(row => [row.label, row.value])).toEqual([
      ['Night driving', 1000],
      ['Total fare', 1000],
    ]);
  });

  it("reads the live answer's legs, totals, window and fare notes", () => {
    const live = readEstimate({
      route: {
        provider: 'Google Maps',
        legs: [{ from: 'Base', to: 'Pickup', distanceMeters: 21155, durationSeconds: 2797 }],
        totalDistanceMeters: 1570268,
        totalDurationSeconds: 115438,
        baseWindowStart: '2026-12-01T03:43:23.000Z',
        baseWindowEnd: '2026-12-03T05:19:38.000Z',
      },
      fare: {
        regularVehiclePaise: 5663765,
        totalPaise: 5337388,
        advancePaise: 1334347,
        balancePaise: 4003041,
        refundableDepositPaise: 500000,
        outstation: {
          bookingDays: 2,
          minimumDistanceMeters: 500000,
          billableDistanceMeters: 1573268,
        },
      },
      availability: 'manual_review',
      availabilityMessage: 'Operator must review.',
    });
    expect(live.legs).toEqual([{ from: 'Base', to: 'Pickup', text: '21.2 km · 0h 47m' }]);
    expect(live.distanceKm).toBe(1570.3);
    expect(live.durationMinutes).toBe(1924);
    expect(live.windowStart).toBe('1 Dec 2026, 9:13 am');
    expect(live.windowEnd).toBe('3 Dec 2026, 10:49 am');
    expect(live.summary).toEqual({ advance: 13343.47, balance: 40030.41, deposit: 5000 });
    expect(live.fareNote).toContain('2 started booking day(s); minimum distance 500 km');
    expect(live.fareNote).toContain('(1,573.3 km billable)');
    expect(live.availabilityMessage).toBe('Operator must review.');
    expect(live.availability.available).toBe(true);
  });

  it('copes with an empty answer', () => {
    expect(readEstimate(undefined)).toMatchObject({ hasFare: false, rows: [], reasons: [] });
  });
});

describe('readRequestResult and humanizeKey', () => {
  it('reads the reference and the private status token', () => {
    expect(readRequestResult({ reference: 'URB-1', statusToken: 'tok' })).toEqual({
      reference: 'URB-1',
      statusToken: 'tok',
      status: '',
    });
    expect(readRequestResult({ request: { reference: 'URB-2' }, statusToken: 't2' })).toEqual({
      reference: 'URB-2',
      statusToken: 't2',
      status: '',
    });
    expect(readRequestResult({ reference: 'URB-3', status: 'pending_review' }).status).toBe(
      'pending_review',
    );
    expect(readRequestResult(undefined)).toEqual({ reference: '', statusToken: '', status: '' });
  });

  it('writes a field name as a label', () => {
    expect(humanizeKey('driverCostPaise')).toBe('Driver cost');
    expect(humanizeKey('night_driving')).toBe('Night driving');
  });
});

describe('calendar helpers', () => {
  it('writes a day as the key the availability uses, and as the form text', () => {
    const date = new Date(2027, 0, 5);
    expect(dayKey(date)).toBe('2027-01-05');
    expect(toDateText(date)).toBe('05/01/2027');
    expect(monthKey(date)).toBe('2027-01');
  });

  it('reads the form text back to a day, or null', () => {
    expect(parseDateText('05/01/2027')).toEqual(new Date(2027, 0, 5));
    expect(parseDateText('')).toBeNull();
    expect(parseDateText('31/02/2027')).toBeNull();
  });

  it('lays a month out under the weekdays, with blanks before the 1st', () => {
    // January 2099 starts on a Thursday and has 31 days
    const days = monthDays(2099, 0);
    expect(days.slice(0, 4)).toEqual([null, null, null, null]);
    expect(days[4]).toEqual(new Date(2099, 0, 1));
    expect(days).toHaveLength(4 + 31);
    expect(monthDays(2028, 1).filter(Boolean)).toHaveLength(29);
  });

  it('writes 24-hour times the 12-hour way', () => {
    expect(formatTime12('09:00')).toBe('09:00 AM');
    expect(formatTime12('18:30')).toBe('06:30 PM');
    expect(formatTime12('00:05')).toBe('12:05 AM');
    expect(formatTime12('12:00')).toBe('12:00 PM');
  });

  it('puts a day and a time together, and nothing when there is no day', () => {
    expect(composeDateTime('05/01/2027', '09:00')).toBe('05/01/2027 09:00');
    expect(composeDateTime('', '09:00')).toBe('');
    expect(parseDateTime(composeDateTime('05/01/2027', '18:00'))).toEqual(
      new Date(2027, 0, 5, 18, 0),
    );
  });
});

describe('readMonthAvailability', () => {
  it('reads a list of days', () => {
    expect(
      readMonthAvailability({
        days: [
          { date: '2027-01-15', status: 'available' },
          { date: '2027-01-16', status: 'partially_available' },
          { date: '2027-01-17', status: 'booked' },
          { date: '2027-01-18T00:00:00+05:30', available: false },
        ],
      }),
    ).toEqual({
      '2027-01-15': 'available',
      '2027-01-16': 'partial',
      '2027-01-17': 'unavailable',
      '2027-01-18': 'unavailable',
    });
  });

  it('reads days keyed by date, and a bare list', () => {
    expect(readMonthAvailability({ days: { '2027-01-15': 'open', '2027-01-16': false } })).toEqual({
      '2027-01-15': 'available',
      '2027-01-16': 'unavailable',
    });
    expect(readMonthAvailability([{ date: '2027-02-01', state: 'limited' }])).toEqual({
      '2027-02-01': 'partial',
    });
  });

  it('leaves out what it does not understand, so those days show as open', () => {
    expect(
      readMonthAvailability({ days: [{ date: 'soon', status: 'booked' }, { date: '2027-01-01' }] }),
    ).toEqual({});
    expect(readMonthAvailability(undefined)).toEqual({});
    expect(readMonthAvailability({ month: '2027-01' })).toEqual({});
  });
});

describe('booking status helpers', () => {
  it('writes a status as a label', () => {
    expect(statusLabel('pending_review')).toBe('Pending review');
    expect(statusLabel('')).toBe('');
  });

  it('reads the status, the message and a fare from the status answer', () => {
    const answer = readBookingStatus({
      request: {
        status: 'quoted',
        fare: { regularVehiclePaise: 100000, totalPaise: 90000, advancePaise: 22500 },
      },
      message: 'Your quote is ready.',
    });
    expect(answer.status).toBe('quoted');
    expect(answer.message).toBe('Your quote is ready.');
    expect(answer.estimate.rows.map(row => row.value)).toEqual([1000, 900]);
    expect(answer.estimate.summary.advance).toBe(225);
  });

  it('has no fare when the answer carries none', () => {
    expect(readBookingStatus({ status: 'pending_review' }).estimate).toBeNull();
    expect(readBookingStatus(undefined).status).toBe('');
  });

  it('links an address to Google Maps', () => {
    expect(mapUrl('Delhi & Goa')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Delhi%20%26%20Goa',
    );
  });
});

describe('account bookings', () => {
  const item = {
    reference: 'URB-1',
    status: 'pending_review',
    tripType: 'outstation',
    pickupAddress: 'Delhi',
    destinationAddress: 'Goa',
    dropAddress: 'Delhi',
    stops: ['Jaipur', { address: 'Udaipur' }, ''],
    pickupAt: '2026-12-01T03:30:00.000Z',
    expectedReturnAt: '2026-12-03T12:30:00.000Z',
    fare: {
      totalPaise: 3389066,
      advancePaise: 847267,
      balancePaise: 2541799,
      refundableDepositPaise: 500000,
    },
  };

  it('reads a booking from the list, whichever key holds it', () => {
    [[item], { bookings: [item] }, { requests: [item] }, { data: [item] }].forEach(shape => {
      expect(readAccountBookings(shape)).toHaveLength(1);
    });
    const [booking] = readAccountBookings([item]);
    expect(booking).toMatchObject({
      reference: 'URB-1',
      status: 'pending_review',
      tripType: 'outstation',
      pickupLabel: '1 Dec 2026, 9:00 am',
      returnLabel: '3 Dec 2026, 6:00 pm',
      remote: true,
    });
    expect(booking.places).toEqual([
      { kind: 'pickup', address: 'Delhi' },
      { kind: 'stop', address: 'Jaipur' },
      { kind: 'stop', address: 'Udaipur' },
      { kind: 'destination', address: 'Goa' },
      { kind: 'drop', address: 'Delhi' },
    ]);
    expect(booking.fare).toEqual({
      total: 33890.66,
      advance: 8472.67,
      balance: 25417.99,
      deposit: 5000,
    });
  });

  it('reads addresses named another way, as text or as { address }', () => {
    const [booking] = readAccountBookings([
      {
        reference: 'URB-9',
        pickup: { address: 'Noida' },
        destinationLocation: 'Manali',
        dropoffAddress: 'Noida',
        plannedStops: [{ name: 'Shimla' }],
      },
    ]);
    expect(booking.places).toEqual([
      { kind: 'pickup', address: 'Noida' },
      { kind: 'stop', address: 'Shimla' },
      { kind: 'destination', address: 'Manali' },
      { kind: 'drop', address: 'Noida' },
    ]);
  });

  it('reads a booking nested in request, and one with no fare', () => {
    const [booking] = readAccountBookings([
      { request: { ...item, fare: undefined }, message: 'Hi' },
    ]);
    expect(booking.reference).toBe('URB-1');
    expect(booking.fare).toBeNull();
    expect(booking.message).toBe('Hi');
  });

  it('skips rows with no reference and copes with nothing', () => {
    expect(readAccountBookings([{ status: 'x' }, null])).toEqual([]);
    expect(readAccountBookings(undefined)).toEqual([]);
    expect(readAccountBookings({})).toEqual([]);
  });

  it('merges the account list with the phone list without repeats', () => {
    const merged = mergeBookings(
      [{ reference: 'A' }, { reference: 'B' }],
      [{ reference: 'B' }, { reference: 'C' }],
    );
    expect(merged.map(entry => entry.reference)).toEqual(['A', 'B', 'C']);
  });
});
