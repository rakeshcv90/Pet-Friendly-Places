import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { UrbaniaBookingsScreen, bookingStatusText } from '../UrbaniaBookingsScreen';
import { saveBooking, loadBookings } from '../../../services/urbania/bookingHistory';
import { saveStatusToken } from '../../../services/urbania/statusTokenStore';
import { fetchStatus } from '../../../services/urbania/urbaniaApi';
import { api } from '../../../services/api/apiClient';
import { s } from 'react-native-size-matters';
import { useStore } from '../../../store';
import { storage } from '../../../services/storage/storage';

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Rishab' } } }),
}));

let mockAccount = {
  data: [],
  isLoading: false,
  isError: false,
  isRefetching: false,
  refetch: jest.fn(),
};
jest.mock('../../../hooks/useUrbaniaBookings', () => ({
  useUrbaniaBookings: () => mockAccount,
}));

let mockDetail = { data: undefined, isLoading: false, isError: false };
const mockDetailHook = jest.fn(() => mockDetail);
jest.mock('../../../hooks/useUrbaniaBookingDetail', () => ({
  useUrbaniaBookingDetail: (...args) => mockDetailHook(...args),
}));

jest.mock('../../../services/api/apiClient', () => ({
  api: { post: jest.fn(), get: jest.fn() },
}));

jest.mock('../../../services/urbania/urbaniaApi', () => ({
  ...jest.requireActual('../../../services/urbania/urbaniaApi'),
  fetchStatus: jest.fn(),
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

const FIRST = {
  reference: 'URB-202611-F2036A1078',
  status: 'pending_review',
  tripType: 'outstation',
  pickupLabel: '1 Dec 2026, 9:00 am',
  returnLabel: '3 Dec 2026, 6:00 pm',
  places: [
    { kind: 'pickup', address: 'Delhi' },
    { kind: 'stop', address: 'Jaipur' },
    { kind: 'destination', address: 'Goa' },
    { kind: 'drop', address: 'Delhi' },
  ],
  fare: { total: 33890.66, advance: 8472.67, balance: 25417.99, deposit: 5000 },
};
const SECOND = { ...FIRST, reference: 'URB-202611-584627077E', pickupLabel: '5 Dec 2026, 9:00 am' };

describe('UrbaniaBookingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.remove('URBANIA_BOOKINGS');
    mockAccount = {
      data: [],
      isLoading: false,
      isError: false,
      isRefetching: false,
      refetch: jest.fn(),
    };
    fetchStatus.mockRejectedValue(new Error('offline'));
  });

  it('shows the banner and a friendly empty state with no bookings', () => {
    const { getByText, getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(getByText('Your Urbania bookings')).toBeTruthy();
    expect(getByTestId('urbania-bookings-empty')).toBeTruthy();
    fireEvent.press(getByTestId('urbania-bookings-book'));
    expect(navigation.navigate).toHaveBeenCalledWith('UrbaniaBookingScreen');
  });

  it('lists the bookings with the count, the status and the provisional note', () => {
    saveBooking(SECOND);
    saveBooking(FIRST);
    const { getByTestId, getAllByText, getByText } = render(
      <UrbaniaBookingsScreen navigation={navigation} />,
    );

    expect(getByTestId('urbania-bookings-count')).toBeTruthy();
    expect(getByText('(2)')).toBeTruthy();
    expect(getByText('URB-202611-F2036A1078')).toBeTruthy();
    expect(getByText('URB-202611-584627077E')).toBeTruthy();
    expect(getByTestId(`booking-${FIRST.reference}-status`).props.children).toBe(
      'Request received',
    );
    expect(getAllByText('This request is provisional. It is not a confirmed trip.')).toHaveLength(
      2,
    );
    expect(getByText('Outstation · 1 Dec 2026, 9:00 am')).toBeTruthy();
  });

  it('opens and hides the trip details', () => {
    saveBooking(FIRST);
    const { getByTestId, queryByTestId, getByText } = render(
      <UrbaniaBookingsScreen navigation={navigation} />,
    );
    const id = FIRST.reference;

    expect(queryByTestId(`booking-${id}-details`)).toBeNull();
    fireEvent.press(getByTestId(`booking-${id}-toggle`));
    expect(getByTestId(`booking-${id}-details`)).toBeTruthy();
    expect(getByText('Hide details')).toBeTruthy();
    expect(getByText('3 Dec 2026, 6:00 pm')).toBeTruthy();
    expect(getByText('Booking status and actions')).toBeTruthy();
    expect(
      getByText('Your request needs an operator review before an advance can be requested.'),
    ).toBeTruthy();

    fireEvent.press(getByTestId(`booking-${id}-toggle`));
    expect(queryByTestId(`booking-${id}-details`)).toBeNull();
  });

  it('asks for the booking only once its details are opened, and shows its answer', () => {
    mockAccount = { ...mockAccount, data: [{ ...FIRST, id: 'uuid-1', places: [], fare: null }] };
    mockDetail = {
      data: {
        ...FIRST,
        id: 'uuid-1',
        payment: { status: 'No payment has been received.', received: 0 },
      },
      isLoading: false,
      isError: false,
    };
    const { getByTestId, getByText, queryByText } = render(
      <UrbaniaBookingsScreen navigation={navigation} />,
    );
    expect(mockDetailHook).toHaveBeenCalledWith('uuid-1', false);
    expect(queryByText('Pickup')).toBeNull();

    fireEvent.press(getByTestId(`booking-${FIRST.reference}-toggle`));

    expect(mockDetailHook).toHaveBeenCalledWith('uuid-1', true);
    expect(getByTestId(`booking-${FIRST.reference}-pickup`)).toBeTruthy();
    expect(getByTestId(`booking-${FIRST.reference}-destination`)).toBeTruthy();
    expect(getByText(/No payment has been received/)).toBeTruthy();
  });

  it('says so while the details load and when they fail', () => {
    mockAccount = { ...mockAccount, data: [{ ...FIRST, id: 'uuid-1', places: [] }] };
    mockDetail = { data: undefined, isLoading: true, isError: false };
    const view = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(view.getByTestId(`booking-${FIRST.reference}-toggle`));
    expect(view.getByTestId(`booking-${FIRST.reference}-detail-loading`)).toBeTruthy();

    mockDetail = { data: undefined, isLoading: false, isError: true };
    view.rerender(<UrbaniaBookingsScreen navigation={navigation} />);
    expect(view.getByTestId(`booking-${FIRST.reference}-detail-error`)).toBeTruthy();
  });

  it('shows the payment status the server sent', () => {
    saveBooking({
      ...FIRST,
      payment: { status: 'No payment has been received.', received: 0 },
    });
    const { getByTestId, getByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(getByTestId(`booking-${FIRST.reference}-toggle`));

    expect(getByTestId(`booking-${FIRST.reference}-payment`)).toBeTruthy();
    expect(getByText(/No payment has been received/)).toBeTruthy();
    expect(getByText('₹0.00')).toBeTruthy();
  });

  it('shows the quoted totals', () => {
    saveBooking(FIRST);
    const { getByTestId, getByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(getByTestId(`booking-${FIRST.reference}-toggle`));

    expect(getByTestId(`booking-${FIRST.reference}-fare`)).toBeTruthy();
    [
      'Estimated total',
      'Estimated advance',
      'Estimated balance after advance',
      'Refundable deposit at pickup (separate)',
    ].forEach(label =>
      expect(getByText(label)).toBeTruthy(),
    );
    ['₹33,890.66', '₹8,472.67', '₹25,417.99', '₹5,000.00'].forEach(value =>
      expect(getByText(value)).toBeTruthy(),
    );
  });

  it('opens each place in Google Maps', () => {
    saveBooking(FIRST);
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    const id = FIRST.reference;
    fireEvent.press(getByTestId(`booking-${id}-toggle`));

    fireEvent.press(getByTestId(`booking-${id}-pickup`));
    fireEvent.press(getByTestId(`booking-${id}-destination`));
    fireEvent.press(getByTestId(`booking-${id}-stop-0`));
    expect(open).toHaveBeenNthCalledWith(
      1,
      'https://www.google.com/maps/search/?api=1&query=Delhi',
    );
    expect(open).toHaveBeenNthCalledWith(2, 'https://www.google.com/maps/search/?api=1&query=Goa');
    expect(open).toHaveBeenNthCalledWith(
      3,
      'https://www.google.com/maps/search/?api=1&query=Jaipur',
    );
    open.mockRestore();
  });

  it("refreshes a booking's status with its private token and saves the new one", async () => {
    saveBooking(FIRST);
    await saveStatusToken(FIRST.reference, 'tok-1');
    fetchStatus.mockResolvedValue({ request: { status: 'confirmed' }, message: 'Confirmed.' });
    const { getByTestId, findByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    // The list refreshes itself when it opens
    expect(await findByText('Confirmed')).toBeTruthy();
    expect(fetchStatus).toHaveBeenCalledWith('tok-1');
    expect(loadBookings()[0].status).toBe('confirmed');
    expect(getByTestId(`booking-${FIRST.reference}-status`).props.children).toBe('Confirmed');
  });

  it('refreshes one booking from its button', async () => {
    saveBooking(FIRST);
    await saveStatusToken(FIRST.reference, 'tok-1');
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(getByTestId(`booking-${FIRST.reference}-toggle`));
    fetchStatus.mockClear();
    fetchStatus.mockResolvedValue({ request: { status: 'quoted' } });

    await act(async () => {
      fireEvent.press(getByTestId(`booking-${FIRST.reference}-refresh`));
    });

    expect(fetchStatus).toHaveBeenCalledWith('tok-1');
    expect(getByTestId(`booking-${FIRST.reference}-current`).props.children).toBe('quoted');
  });

  it('keeps what was saved when the status cannot be refreshed', async () => {
    saveBooking(FIRST);
    await saveStatusToken(FIRST.reference, 'tok-1');
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    await act(async () => {});

    expect(getByTestId(`booking-${FIRST.reference}-status`).props.children).toBe(
      'Request received',
    );
  });

  it('never keeps the private token in the saved history', async () => {
    saveBooking(FIRST);
    await saveStatusToken(FIRST.reference, 'tok-secret');
    render(<UrbaniaBookingsScreen navigation={navigation} />);
    await act(async () => {});

    expect(storage.getString('URBANIA_BOOKINGS')).not.toContain('tok-secret');
  });

  it('goes back', () => {
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(getByTestId('urbania-bookings-back'));
    expect(navigation.goBack).toHaveBeenCalled();
  });

  const REMOTE = {
    reference: 'URB-REMOTE-1',
    status: 'confirmed',
    tripType: 'outstation',
    pickupLabel: '9 Dec 2026, 8:00 am',
    returnLabel: '10 Dec 2026, 8:00 pm',
    places: [
      { kind: 'pickup', address: 'Noida' },
      { kind: 'destination', address: 'Manali' },
    ],
    fare: { total: 50000 },
    message: '',
    remote: true,
  };

  it("lists the account's bookings from the API", () => {
    mockAccount = { ...mockAccount, data: [REMOTE] };
    const { getByText, getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(getByText('URB-REMOTE-1')).toBeTruthy();
    expect(getByTestId('booking-URB-REMOTE-1-status').props.children).toBe('Confirmed');
    expect(getByText('(1)')).toBeTruthy();
    expect(getByText('Noida', { exact: false })).toBeTruthy();
  });

  it('adds the bookings made on this phone that the account does not have, once each', () => {
    saveBooking(FIRST);
    saveBooking({ ...FIRST, reference: REMOTE.reference });
    mockAccount = { ...mockAccount, data: [REMOTE] };
    const { getAllByText, getByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(getAllByText('URB-REMOTE-1')).toHaveLength(1);
    expect(getByText('URB-202611-F2036A1078')).toBeTruthy();
    expect(getByText('(2)')).toBeTruthy();
  });

  it('counts the requests and the confirmed trips in the banner', () => {
    mockAccount = {
      ...mockAccount,
      data: [REMOTE, { ...REMOTE, reference: 'URB-R2', status: 'pending_review' }],
    };
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(getByTestId('urbania-stat-total').props.children).toBe(2);
    expect(getByTestId('urbania-stat-confirmed').props.children).toBe(1);
  });

  it('shows the animated van scene from the Home banner', () => {
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(getByTestId('urbania-van-scene')).toBeTruthy();
    expect(getByTestId('urbania-van')).toBeTruthy();
    expect(getByTestId('urbania-van-motion')).toBeTruthy();
  });

  it('places the van so that all of it is inside the banner', () => {
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    const style = StyleSheet.flatten(getByTestId('urbania-van-scene').props.style);
    const scale = style.transform.find(item => item.scale !== undefined).scale;
    const width = s(205);
    // The box ends |right| past the banner's edge; scaling is around its centre
    const visibleRightEdge = width / 2 + style.right - (width * scale) / 2;
    expect(visibleRightEdge).toBeGreaterThanOrEqual(0);
  });

  it('shows placeholders while the account list loads', () => {
    mockAccount = { ...mockAccount, data: undefined, isLoading: true };
    const { getByTestId, queryByTestId } = render(
      <UrbaniaBookingsScreen navigation={navigation} />,
    );

    expect(getByTestId('urbania-bookings-loading')).toBeTruthy();
    expect(queryByTestId('urbania-bookings-empty')).toBeNull();
  });

  it('says so when the account list fails, and still shows the ones on this phone', () => {
    saveBooking(FIRST);
    mockAccount = { ...mockAccount, data: undefined, isError: true };
    const { getByTestId, getByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(getByTestId('urbania-bookings-error')).toBeTruthy();
    expect(getByText('URB-202611-F2036A1078')).toBeTruthy();
  });

  it('pulls down to reload the account list', () => {
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    getByTestId('urbania-bookings-scroll').props.refreshControl.props.onRefresh();
    expect(mockAccount.refetch).toHaveBeenCalled();
  });

  it('shows each address as the link text, like the website', () => {
    saveBooking(FIRST);
    const { getByTestId, getAllByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(getByTestId(`booking-${FIRST.reference}-toggle`));

    expect(getByTestId(`booking-${FIRST.reference}-destination`)).toBeTruthy();
    expect(getAllByText('Delhi').length).toBeGreaterThan(1);
    expect(getAllByText('Goa').length).toBeGreaterThan(0);
    expect(getAllByText('Jaipur').length).toBeGreaterThan(0);
  });

  it('keeps the fare chips readable on the dark theme', () => {
    useStore.setState({ isDarkMode: true });
    saveBooking(FIRST);
    const { getByTestId, getByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);
    fireEvent.press(getByTestId(`booking-${FIRST.reference}-toggle`));

    const value = StyleSheet.flatten(getByText('₹33,890.66').props.style);
    expect(value.color).toBe('#FFFFFF');
    const chip = StyleSheet.flatten(
      getByTestId(`booking-${FIRST.reference}-chip-Estimated total`).props.style,
    );
    expect(chip.backgroundColor).toBe('#27104B');
    useStore.setState({ isDarkMode: false });
  });

  describe('claim link and staff review', () => {
    const fillReview = view => {
      fireEvent.changeText(view.getByTestId('urbania-review-reference'), 'URB-202611-1');
      fireEvent.changeText(view.getByTestId('urbania-review-name'), 'Rishab');
      fireEvent.changeText(view.getByTestId('urbania-review-phone'), '9876543210');
      fireEvent.changeText(view.getByTestId('urbania-review-details'), 'Booked for my dog');
    };

    it('shows both under the list, even with no bookings', () => {
      const { getByText, getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      expect(getByText('Missing a guest booking made with this email?')).toBeTruthy();
      expect(getByText('Email a secure claim link')).toBeTruthy();
      expect(getByText('Can’t access your booking email?')).toBeTruthy();
      expect(getByTestId('urbania-review-submit')).toBeTruthy();
    });

    it('asks the API to email a claim link for the account', async () => {
      api.post.mockResolvedValue({});
      const { getByTestId, findByText } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      await act(async () => {
        fireEvent.press(getByTestId('urbania-claim-button'));
      });

      expect(api.post).toHaveBeenCalledWith('/accounts/me/urbania-bookings/claim', {});
      expect(
        await findByText(
          'If earlier guest bookings match this account email, a one-time link is on its way.',
        ),
      ).toBeTruthy();
    });

    it('shows the message the API sends back', async () => {
      api.post.mockResolvedValue({ message: 'Check your inbox for the link.' });
      const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      await act(async () => {
        fireEvent.press(getByTestId('urbania-claim-button'));
      });

      expect(getByTestId('urbania-claim-message').props.children).toBe(
        'Check your inbox for the link.',
      );
    });

    it('shows the server reason when the claim link fails', async () => {
      api.post.mockRejectedValue({ response: { data: { message: 'Too many requests' } } });
      const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      await act(async () => {
        fireEvent.press(getByTestId('urbania-claim-button'));
      });

      expect(getByTestId('urbania-claim-message').props.children).toBe('Too many requests');
    });

    it('needs the reference, the name and a phone before it asks for a staff review', async () => {
      const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      await act(async () => {
        fireEvent.press(getByTestId('urbania-review-submit'));
      });

      expect(getByTestId('urbania-review-error')).toBeTruthy();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('styles the review inputs like the booking form: warm, raised, with a focus state', () => {
      const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);
      const style = () => StyleSheet.flatten(getByTestId('urbania-review-name').props.style);

      expect(style()).toMatchObject({
        backgroundColor: '#FAF8F5',
        borderBottomWidth: 2.5,
        borderBottomColor: '#D1D5DB',
      });
      fireEvent(getByTestId('urbania-review-name'), 'focus');
      expect(style()).toMatchObject({ borderColor: '#7C3AED', backgroundColor: '#FFFFFF' });
      fireEvent(getByTestId('urbania-review-name'), 'blur');
      expect(style().backgroundColor).toBe('#FAF8F5');
    });

    it('uses the dark input colours on the dark theme', () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      expect(StyleSheet.flatten(getByTestId('urbania-review-phone').props.style)).toMatchObject({
        backgroundColor: '#220D42',
        color: '#FFFFFF',
      });
      useStore.setState({ isDarkMode: false });
    });

    it('marks the empty required inputs in red, and clears the mark when typing', async () => {
      const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      await act(async () => {
        fireEvent.press(getByTestId('urbania-review-submit'));
      });
      const name = () => StyleSheet.flatten(getByTestId('urbania-review-name').props.style);
      expect(name().borderColor).toBe('#DC2626');
      fireEvent.changeText(getByTestId('urbania-review-name'), 'R');
      expect(name().borderColor).not.toBe('#DC2626');
    });

    it('shows hints in the inputs', () => {
      const { getByPlaceholderText } = render(<UrbaniaBookingsScreen navigation={navigation} />);

      expect(getByPlaceholderText('10-digit mobile number')).toBeTruthy();
      expect(getByPlaceholderText('e.g. URB-202611-F2036A1078')).toBeTruthy();
    });

    it('sends the details for a staff review and clears the form', async () => {
      api.post.mockResolvedValue({});
      const view = render(<UrbaniaBookingsScreen navigation={navigation} />);
      fillReview(view);

      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-review-submit'));
      });

      expect(api.post).toHaveBeenCalledWith(expect.stringContaining('urbania'), {
        reference: 'URB-202611-1',
        name: 'Rishab',
        phone: '9876543210',
        details: 'Booked for my dog',
      });
      expect(view.getByTestId('urbania-review-done')).toBeTruthy();
      expect(view.getByTestId('urbania-review-reference').props.value).toBe('');
    });

    it('keeps the details and shows the reason when the review request fails', async () => {
      api.post.mockRejectedValue({ response: { data: { message: 'Not found' } } });
      const view = render(<UrbaniaBookingsScreen navigation={navigation} />);
      fillReview(view);

      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-review-submit'));
      });

      expect(view.getByText('Not found')).toBeTruthy();
      expect(view.getByTestId('urbania-review-name').props.value).toBe('Rishab');
    });
  });

  it('shows the pickup and the destination on the card, one line each', () => {
    saveBooking(FIRST);
    const { getByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    const route = getByTestId(`booking-${FIRST.reference}-route`);
    const lines = route.findAll(node => node.props.numberOfLines === 1 && node.type === 'Text');
    expect(lines.map(line => line.props.children)).toEqual(['Delhi', 'Goa']);
  });

  it('leaves the route out when a booking has no addresses', () => {
    saveBooking({ ...FIRST, places: [] });
    const { queryByTestId } = render(<UrbaniaBookingsScreen navigation={navigation} />);

    expect(queryByTestId(`booking-${FIRST.reference}-route`)).toBeNull();
  });

  it('words a status like the website', () => {
    expect(bookingStatusText('pending_review')).toBe('Request received');
    expect(bookingStatusText('')).toBe('Request received');
    expect(bookingStatusText('confirmed')).toBe('Confirmed');
  });
});
