import { loadBookings, saveBooking, updateBooking } from '../bookingHistory';
import { storage } from '../../storage/storage';

const booking = (reference, extra = {}) => ({
  reference,
  status: 'pending_review',
  tripType: 'outstation',
  pickupLabel: '1 Dec 2026, 9:00 am',
  ...extra,
});

describe('urbania booking history', () => {
  beforeEach(() => storage.remove('URBANIA_BOOKINGS'));

  it('starts empty', () => {
    expect(loadBookings()).toEqual([]);
  });

  it('keeps the newest booking first', () => {
    saveBooking(booking('URB-1'));
    saveBooking(booking('URB-2'));
    expect(loadBookings().map(item => item.reference)).toEqual(['URB-2', 'URB-1']);
  });

  it('updates a booking with the same reference instead of adding a copy', () => {
    saveBooking(booking('URB-1'));
    saveBooking(booking('URB-1', { status: 'quoted' }));
    expect(loadBookings()).toHaveLength(1);
    expect(loadBookings()[0].status).toBe('quoted');
  });

  it('changes one booking with updateBooking and leaves the others', () => {
    saveBooking(booking('URB-1'));
    saveBooking(booking('URB-2'));
    updateBooking('URB-1', { status: 'confirmed', message: 'See you soon' });
    const list = loadBookings();
    expect(list.find(item => item.reference === 'URB-1')).toMatchObject({
      status: 'confirmed',
      message: 'See you soon',
    });
    expect(list.find(item => item.reference === 'URB-2').status).toBe('pending_review');
  });

  it('ignores a record with no reference, and a damaged saved list', () => {
    saveBooking({ status: 'x' });
    expect(loadBookings()).toEqual([]);
    storage.set('URBANIA_BOOKINGS', '{not json');
    expect(loadBookings()).toEqual([]);
  });

  it('keeps at most 50 bookings', () => {
    for (let i = 0; i < 55; i += 1) {
      saveBooking(booking(`URB-${i}`));
    }
    expect(loadBookings()).toHaveLength(50);
    expect(loadBookings()[0].reference).toBe('URB-54');
  });
});
