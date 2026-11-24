import React from 'react';
import { Linking } from 'react-native';
import { Alert } from 'react-native';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { s } from 'react-native-size-matters';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { UrbaniaBookingScreen } from '../UrbaniaBookingScreen';
import { AUTO_SWIPE_MS } from '../UrbaniaBookingScreen';
import { GALLERY_RATIOS, isPortrait, FEATURES, COST_NOTES } from '../components/UrbaniaSections';
import { useStore } from '../../../store';
import {
  fetchLocationSuggestions as fetchPlaceSuggestions,
  fetchPublicConfig,
  fetchAvailability,
  fetchMonthAvailability,
  requestEstimate,
  submitRequest,
  fetchStatus,
} from '../../../services/urbania/urbaniaApi';
import { loadStatusToken } from '../../../services/urbania/statusTokenStore';
import { theme } from '../../../theme';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: jest.fn(() => null),
  DateTimePickerAndroid: { open: jest.fn() },
}));

// Never reach the network from a test: every booking call is faked
jest.mock('../../../services/urbania/urbaniaApi', () => ({
  ...jest.requireActual('../../../services/urbania/urbaniaApi'),
  fetchLocationSuggestions: jest.fn(async () => []),
  fetchPublicConfig: jest.fn(async () => ({})),
  fetchAvailability: jest.fn(async () => ({ available: true })),
  fetchMonthAvailability: jest.fn(async () => ({})),
  requestEstimate: jest.fn(),
  submitRequest: jest.fn(),
  fetchStatus: jest.fn(),
}));

let mockProfile = { account: { name: 'Rishab', phone: '9876543210', email: 'r@example.com' } };
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: mockProfile }),
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

const MONTH_NAMES = [
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

// Shows the calendar month a "DDMMYYYY..." date is in, by pressing the arrows
const showMonthOf = (view, digits) => {
  const month = Number(digits.slice(2, 4)) - 1;
  const year = Number(digits.slice(4, 8));
  for (let i = 0; i < 400; i += 1) {
    const [name, shownYear] = []
      .concat(view.getByTestId('urbania-cal-title').props.children)
      .join('')
      .split(' ');
    const diff = (year - Number(shownYear)) * 12 + (month - MONTH_NAMES.indexOf(name));
    if (diff === 0) {
      return;
    }
    fireEvent.press(view.getByTestId(diff > 0 ? 'urbania-cal-next' : 'urbania-cal-prev'));
  }
};

const tapDay = (view, digits) => {
  showMonthOf(view, digits);
  fireEvent.press(
    view.getByTestId(
      `urbania-day-${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`,
    ),
  );
};

// Picks an exact time ("0930") with the time picker, as a person would
const setTime = (view, key, hhmm) => {
  if (!hhmm || view.getByTestId(`urbania-${key}-time-value`).props.children === toLabel(hhmm)) {
    return;
  }
  fireEvent.press(view.getByTestId(`urbania-${key}-time`));
  const date = new Date(2099, 0, 1, Number(hhmm.slice(0, 2)), Number(hhmm.slice(2, 4)));
  act(() => {
    DateTimePicker.mock.calls[DateTimePicker.mock.calls.length - 1][0].onValueChange({}, date);
  });
  fireEvent.press(view.getByTestId(`urbania-${key}-time`));
};
const toLabel = hhmm => {
  const hour = Number(hhmm.slice(0, 2));
  return `${String(((hour + 11) % 12) + 1).padStart(2, '0')}:${hhmm.slice(2, 4)} ${
    hour < 12 ? 'AM' : 'PM'
  }`;
};

// Picks a pickup and a return the way a person does: the days on the calendar, then the exact times.
// Both are "DDMMYYYYHHMM". Without a return only the pickup day is picked.
const fillDates = (view, pickup, ret) => {
  tapDay(view, pickup);
  setTime(view, 'pickup', pickup.slice(8));
  if (ret !== undefined) {
    tapDay(view, ret);
    setTime(view, 'return', ret.slice(8));
  }
};

// The three consent boxes on the last step
const agreeAll = view =>
  ['urbania-agree', 'urbania-age', 'urbania-account-terms'].forEach(id =>
    fireEvent.press(view.getByTestId(id)),
  );

const fillTrip = view => {
  fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
  fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
  fillDates(view, '050320990900');
};

// "1 of 3": which step the card is on
const stepCount = getByTestId =>
  [].concat(getByTestId('urbania-step-count').props.children).join('');

// What the estimate API answers in these tests: the fare is in paise
const ESTIMATE = {
  route: {
    provider: 'Google Maps',
    legs: [
      { from: 'Urbania base', to: 'Pickup', distanceMeters: 21155, durationSeconds: 2797 },
      { from: 'Pickup', to: 'Destination', distanceMeters: 260245, durationSeconds: 17003 },
    ],
    totalDistanceMeters: 281400,
    totalDurationSeconds: 19800,
    baseWindowStart: '2099-01-14T03:43:23.000Z',
    baseWindowEnd: '2099-01-16T13:19:38.000Z',
  },
  fare: {
    currency: 'INR',
    regularVehiclePaise: 650000,
    discountPaise: 65000,
    discountedVehiclePaise: 585000,
    includedDriverPaise: 140000,
    nightChargePaise: 50000,
    totalPaise: 775000,
    advancePaise: 193750,
    balancePaise: 581250,
    refundableDepositPaise: 500000,
    outstation: { bookingDays: 3, minimumDistanceMeters: 750000, billableDistanceMeters: 781400 },
  },
  availability: 'manual_review',
  availabilityMessage: 'Open for a request; the operator reviews feasibility.',
  manualReviewReasons: [],
};

// Only the clock is faked (to 10 Jan 2099), so the calendar opens on a month where 2099 dates are ahead
const FAKE_TODAY = {
  now: new Date(2099, 0, 10, 8, 0),
  advanceTimers: true,
  doNotFake: [
    'setTimeout',
    'clearTimeout',
    'setInterval',
    'clearInterval',
    'setImmediate',
    'clearImmediate',
    'nextTick',
    'queueMicrotask',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'requestIdleCallback',
    'cancelIdleCallback',
    'performance',
    'hrtime',
  ],
};

describe('UrbaniaBookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(FAKE_TODAY);
    fetchMonthAvailability.mockResolvedValue({});
    mockProfile = { account: { name: 'Rishab', phone: '9876543210', email: 'r@example.com' } };
    fetchPublicConfig.mockResolvedValue({});
    fetchAvailability.mockResolvedValue({ available: true });
    requestEstimate.mockResolvedValue(ESTIMATE);
    submitRequest.mockResolvedValue({ reference: 'URB-1001', statusToken: 'secret-token' });
  });

  afterEach(() => jest.useRealTimers());

  describe('the page', () => {
    it('opens with the header, the hero and the four facts about the van', () => {
      const { getByText, getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('Book the Urbania')).toBeTruthy();
      expect(getByText('PRIVATE ROAD TRIP')).toBeTruthy();
      expect(getByTestId('urbania-hero')).toBeTruthy();
      expect(getByText('Bring the whole pack.')).toBeTruthy();
      [
        '12 passenger seats',
        'All breeds welcome',
        'Up to 72 hours',
        'Driver & fuel included',
      ].forEach(title => expect(getByText(title)).toBeTruthy());
    });

    it('explains the vehicle, the agreement, the pricing and how a booking works', () => {
      const { getByText, getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('A private road-trip vehicle, not a camper')).toBeTruthy();
      expect(getByText('Space, time and trip costs')).toBeTruthy();
      expect(getByText('Room for your group')).toBeTruthy();
      expect(getByText('Local NCR or short outstation')).toBeTruthy();
      expect(getByText('Pay only what is explained')).toBeTruthy();
      expect(getByTestId('urbania-tolls')).toBeTruthy();

      expect(getByTestId('urbania-pricing')).toBeTruthy();
      expect(getByText('Know the rules before the road')).toBeTruthy();
      expect(getByText('₹5,850')).toBeTruthy();
      expect(getByText('₹8,800')).toBeTruthy();

      expect(getByText('How a booking works')).toBeTruthy();
      expect(getByText('Share your route')).toBeTruthy();
      expect(getByText('Akash reviews it')).toBeTruthy();
      expect(getByText('Advance, then confirmation')).toBeTruthy();
    });

    it('goes back from the header button', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(getByTestId('urbania-back-btn'));
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('links to the road trip routes for ideas', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(getByTestId('urbania-routes'));
      expect(navigation.navigate).toHaveBeenCalledWith('RoadTripRoutesScreen');
    });
  });

  describe('photos', () => {
    // Go to photo n by opening the viewer, stepping on, and closing it again
    const showPhoto = (view, n) => {
      fireEvent.press(view.getByTestId('urbania-hero'));
      for (let i = 0; i < n; i += 1) {
        fireEvent.press(view.getByTestId('urbania-viewer-next'));
      }
      fireEvent.press(view.getByTestId('urbania-viewer-close'));
    };

    it('opens with a photo of the van behind the headline', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByTestId('urbania-hero-photo').props.source).toBe(theme.images.urbaniaGallery[0]);
      expect(getByText('PET-FRIENDLY · GURUGRAM')).toBeTruthy();
      expect(
        getByText(
          'A private 12-seat Force Urbania with driver, fuel and a warm welcome for every breed.',
        ),
      ).toBeTruthy();
      ['12 seats', 'All breeds', '10% off'].forEach(chip => expect(getByText(chip)).toBeTruthy());
    });

    it('has no row of small photos on the page: the photos are only in the full-screen viewer', () => {
      const { queryByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(queryByTestId('urbania-gallery')).toBeNull();
      for (let i = 0; i < 5; i += 1) {
        expect(queryByTestId(`urbania-photo-${i}`)).toBeNull();
      }
    });

    it('shows all five photos together once the header photo is tapped', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(theme.images.urbaniaGallery).toHaveLength(5);

      fireEvent.press(getByTestId('urbania-hero'));
      for (let i = 0; i < 5; i += 1) {
        expect(getByTestId(`urbania-viewer-thumb-${i}`)).toBeTruthy();
        expect(getByTestId(`urbania-viewer-photo-${i}`)).toBeTruthy();
      }
    });

    it('puts the photo last viewed in the header', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      showPhoto(view, 3);

      expect(view.getByTestId('urbania-hero-photo').props.source).toBe(
        theme.images.urbaniaGallery[3],
      );
    });

    it('describes the header photo for screen readers', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(view.getByTestId('urbania-hero-photo').props.accessibilityLabel).toMatch(
        /Rubicon sticker/,
      );
      showPhoto(view, 2);
      expect(view.getByTestId('urbania-hero-photo').props.accessibilityLabel).toMatch(
        /Inside the Urbania/,
      );
    });
  });

  describe('look of the page', () => {
    it('runs the hero photo edge to edge, like the website, not as a rounded card', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const hero = StyleSheet.flatten(getByTestId('urbania-hero').props.style);

      expect(hero.marginHorizontal).toBeUndefined();
      expect(hero.borderRadius).toBeUndefined();
      expect(hero.height).toBeGreaterThan(300);
    });

    it('gives each of the four facts its own colour, from the app palette, with a white icon', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      const seen = new Set();
      for (let i = 0; i < 4; i += 1) {
        const icon = getByTestId(`urbania-feature-icon-${i}`);
        // A two-colour gradient square
        expect(FEATURES[i].colors).toHaveLength(2);
        expect(icon.props.colors).toEqual(FEATURES[i].colors);
        seen.add(FEATURES[i].colors.join());
      }
      expect(seen.size).toBe(4);
    });

    it('adds the app gradient accent above each section heading and along the top of the request card', () => {
      const { getAllByTestId, getByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      const headings = getAllByTestId('urbania-heading-accent');
      // Agreement, How a booking works, FAQs
      expect(headings).toHaveLength(3);
      headings.forEach(accent =>
        expect(accent.props.colors).toEqual(['#7B2CFF', '#EC4899', '#FF7A00']),
      );
      expect(getByTestId('urbania-card-accent').props.colors).toEqual([
        '#7B2CFF',
        '#EC4899',
        '#FF7A00',
      ]);
    });

    it('keeps the status bar readable with a solid strip once the page scrolls under it', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      expect(queryByTestId('urbania-status-strip')).toBeNull();
      fireEvent.scroll(getByTestId('urbania-scroll'), {
        nativeEvent: { contentOffset: { y: 900 } },
      });
      expect(getByTestId('urbania-status-strip')).toBeTruthy();
      fireEvent.scroll(getByTestId('urbania-scroll'), { nativeEvent: { contentOffset: { y: 0 } } });
      expect(queryByTestId('urbania-status-strip')).toBeNull();
    });
  });

  describe('header over the photo', () => {
    const insideHero = (view, id) => {
      const hero = view.getByTestId('urbania-hero');
      let node = view.getByTestId(id);
      while (node) {
        if (node === hero) {
          return true;
        }
        node = node.parent;
      }
      return false;
    };

    it('shows the page title on the photo, so no separate header bar takes up room', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(view.getByText('PRIVATE ROAD TRIP')).toBeTruthy();
      expect(view.getByText('Book the Urbania')).toBeTruthy();
      expect(insideHero(view, 'urbania-hero-header')).toBe(true);
    });

    it('starts the photo at the top of the screen with no gap above it', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const hero = StyleSheet.flatten(getByTestId('urbania-hero').props.style);

      expect(hero.marginTop).toBeUndefined();
      expect(hero.marginHorizontal).toBeUndefined();
    });

    it('puts the back button on the photo and goes back when it is pressed', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      const back = StyleSheet.flatten(view.getByTestId('urbania-back-btn').props.style);

      expect(back.position).toBe('absolute');
      expect(insideHero(view, 'urbania-back-btn')).toBe(true);
      fireEvent.press(view.getByTestId('urbania-back-btn'));
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('does not open the photos when the back button is pressed', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      fireEvent.press(getByTestId('urbania-back-btn'));
      expect(queryByTestId('urbania-viewer')).toBeNull();
    });

    it('scrolls with the page: the back button is inside the scrolling content, not pinned to the screen', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const scroll = getByTestId('urbania-scroll');

      let node = getByTestId('urbania-back-btn');
      let inside = false;
      while (node) {
        if (node === scroll) {
          inside = true;
          break;
        }
        node = node.parent;
      }
      expect(inside).toBe(true);
    });

    it('keeps the back button looking the same however far the page is scrolled', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const before = StyleSheet.flatten(getByTestId('urbania-back-btn').props.style);

      fireEvent.scroll(getByTestId('urbania-scroll'), {
        nativeEvent: { contentOffset: { y: 900 } },
      });
      const after = StyleSheet.flatten(getByTestId('urbania-back-btn').props.style);
      expect(after).toEqual(before);
    });
  });

  describe('text boxes in the app style', () => {
    const style = node => StyleSheet.flatten(node.props.style);

    it('uses the same text box as the rest of the app: warm fill, 3D bottom edge', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const box = style(getByTestId('urbania-dropoff'));

      expect(box.backgroundColor).toBe('#FAF8F5');
      expect(box.borderColor).toBe('#E5E7EB');
      expect(box.borderBottomColor).toBe('#D1D5DB');
      expect(box.borderBottomWidth).toBeGreaterThan(box.borderWidth);
    });

    it('gives the pickup and destination boxes the same look, with their pin icons', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      ['urbania-pickup-box', 'urbania-destination-box'].forEach(id => {
        const row = style(getByTestId(id));
        expect(row.backgroundColor).toBe('#FAF8F5');
        expect(row.borderBottomWidth).toBeGreaterThan(row.borderWidth);
      });
    });

    it('lights the box up in purple while it is being typed in, and back again after', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent(getByTestId('urbania-dropoff'), 'focus');
      let box = style(getByTestId('urbania-dropoff'));
      expect(box.borderColor).toBe('#7C3AED');
      expect(box.borderBottomColor).toBe('#5B21B6');
      expect(box.backgroundColor).toBe('#FFFFFF');

      fireEvent(getByTestId('urbania-dropoff'), 'blur');
      box = style(getByTestId('urbania-dropoff'));
      expect(box.borderColor).toBe('#E5E7EB');
      expect(box.backgroundColor).toBe('#FAF8F5');
    });

    it('lights up the whole row, pin included, for the pickup box', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent(getByTestId('urbania-pickup'), 'focus');
      expect(style(getByTestId('urbania-pickup-box')).borderColor).toBe('#7C3AED');
      fireEvent(getByTestId('urbania-pickup'), 'blur');
      expect(style(getByTestId('urbania-pickup-box')).borderColor).toBe('#E5E7EB');
    });

    it('turns the box red when it needs fixing', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-next'));
      const box = style(getByTestId('urbania-pickup-box'));
      expect(box.borderColor).toBe('#DC2626');
      expect(box.borderBottomColor).toBe('#B91C1C');
    });

    it('uses the dark app colours in dark mode', () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const box = style(getByTestId('urbania-dropoff'));

      expect(box.backgroundColor).toBe('#220D42');
      expect(box.borderColor).toBe('#3D1C73');
      useStore.setState({ isDarkMode: false });
    });
  });

  describe('compact fact cards', () => {
    it('keeps the four fact cards small', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      for (let i = 0; i < 4; i += 1) {
        const icon = StyleSheet.flatten(getByTestId(`urbania-feature-icon-${i}`).props.style);
        expect(icon.width).toBeLessThanOrEqual(s(36));
        expect(icon.height).toBeLessThanOrEqual(s(36));
      }
    });

    it('still shows every fact, with its one-line detail', () => {
      const { getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('Separate driver seat · normal reclining seats')).toBeTruthy();
      expect(getByText('No fixed pet-count limit; safe space required')).toBeTruthy();
      expect(getByText('Maximum 3 started days and 2 nights')).toBeTruthy();
      expect(getByText('Sonu’s regular driver costs included')).toBeTruthy();
    });
  });

  describe('photo that swipes by itself', () => {
    // setImmediate stays real: the test library needs it to clean up after each test
    beforeEach(() =>
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }),
    );
    afterEach(() => jest.useRealTimers());

    const wait = ms =>
      act(() => {
        jest.advanceTimersByTime(ms);
      });
    const shown = view => view.getByTestId('urbania-hero-photo').props.source;

    it('has no drive-in or drifting animation on the photo', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const frame = StyleSheet.flatten(getByTestId('urbania-hero-photo-frame').props.style);

      // Only the swipe between photos moves it: a sideways move and a small zoom, nothing looping
      expect(frame.transform.map(entry => Object.keys(entry)[0])).toEqual(['translateX', 'scale']);
      expect(frame.left).toBe(0);
      expect(frame.right).toBe(0);
    });

    it('shows the photo in a wide area, not stretched over the whole tall hero, so it is not zoomed in', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const hero = StyleSheet.flatten(getByTestId('urbania-hero').props.style);
      const frame = StyleSheet.flatten(getByTestId('urbania-hero-photo-frame').props.style);

      expect(frame.height).toBeLessThan(hero.height);
      // The photo area is wider than it is tall, close to the shape of the photos themselves
      const { width } = Dimensions.get('window');
      expect(width / frame.height).toBeGreaterThan(1.3);
    });

    it('draws a wide photo only a little bigger than its frame, and the tall photo whole inside it', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      const { width } = Dimensions.get('window');
      const draw = () => StyleSheet.flatten(view.getByTestId('urbania-hero-photo').props.style);
      const frameHeight = () =>
        StyleSheet.flatten(view.getByTestId('urbania-hero-photo-frame').props.style).height;

      // Photo 1 is wide: it covers the frame, in its own shape, and is not blown up
      const wide = draw();
      expect(wide.width).toBeGreaterThanOrEqual(width - 1e-6);
      expect(wide.height).toBeGreaterThanOrEqual(frameHeight() - 1e-6);
      expect(wide.width / wide.height).toBeCloseTo(GALLERY_RATIOS[0], 3);
      expect(wide.width).toBeLessThan(width * 1.3);
      expect(wide.height).toBeLessThan(frameHeight() * 1.3);

      // Photo 3 (index 2) is tall: it is drawn whole, inside the frame, in its own shape
      fireEvent.press(view.getByTestId('urbania-hero'));
      fireEvent.press(view.getByTestId('urbania-viewer-thumb-2'));
      fireEvent.press(view.getByTestId('urbania-viewer-close'));
      const tall = draw();
      expect(tall.width).toBeLessThanOrEqual(width + 1e-6);
      expect(tall.height).toBeLessThanOrEqual(frameHeight() + 1e-6);
      expect(tall.width / tall.height).toBeCloseTo(GALLERY_RATIOS[2], 3);
      expect(view.getByTestId('urbania-hero-photo').props.source).toBe(
        theme.images.urbaniaGallery[2],
      );
    });

    it('draws the photo at an exact size and does not leave the scaling to the phone', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const photo = getByTestId('urbania-hero-photo');
      const style = StyleSheet.flatten(photo.props.style);

      expect(photo.props.resizeMode).toBe('stretch');
      expect(typeof style.width).toBe('number');
      expect(typeof style.height).toBe('number');
    });

    it('knows which gallery photos are tall', () => {
      expect(GALLERY_RATIOS).toHaveLength(theme.images.urbaniaGallery.length);
      expect(GALLERY_RATIOS.map((_, i) => isPortrait(i))).toEqual([
        false,
        false,
        true,
        false,
        false,
      ]);
    });

    it('swipes to the next photo on its own', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[0]);

      wait(AUTO_SWIPE_MS);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[1]);

      wait(AUTO_SWIPE_MS);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[2]);
    });

    it('slides the new photo in from the right while the old one leaves to the left', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      wait(AUTO_SWIPE_MS);

      const leaving = view.getByTestId('urbania-hero-photo-other');
      expect(leaving.props.source).toBe(theme.images.urbaniaGallery[0]);
      const incoming = StyleSheet.flatten(view.getByTestId('urbania-hero-photo-frame').props.style);
      expect(incoming.transform[0].translateX).toBeGreaterThan(0);
      const outgoing = StyleSheet.flatten(
        view.getByTestId('urbania-hero-photo-other-frame').props.style,
      );
      expect(outgoing.transform[0].translateX).toBe(0);
    });

    it('goes back to the first photo after the last', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId('urbania-hero'));
      fireEvent.press(view.getByTestId('urbania-viewer-thumb-4'));
      fireEvent.press(view.getByTestId('urbania-viewer-close'));

      wait(AUTO_SWIPE_MS);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[0]);
    });

    it('gives a full pause after the viewer is closed before it moves on again', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      wait(AUTO_SWIPE_MS - 1500);
      fireEvent.press(view.getByTestId('urbania-hero'));
      fireEvent.press(view.getByTestId('urbania-viewer-thumb-2'));
      fireEvent.press(view.getByTestId('urbania-viewer-close'));

      wait(AUTO_SWIPE_MS - 500);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[2]);
      wait(600);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[3]);
    });

    it('stops while the full-screen viewer is open and starts again when it closes', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(view.getByTestId('urbania-hero'));
      wait(AUTO_SWIPE_MS * 4);
      expect(view.getByTestId('urbania-viewer-counter').props.children).toBe('1 / 5');

      fireEvent.press(view.getByTestId('urbania-viewer-close'));
      wait(AUTO_SWIPE_MS);
      expect(shown(view)).toBe(theme.images.urbaniaGallery[1]);
    });
  });

  describe('full-screen photos', () => {
    it('is closed until the photo is tapped', () => {
      const { queryByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(queryByTestId('urbania-viewer')).toBeNull();
    });

    it('opens full screen on the photo that is showing when the header photo is tapped', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-hero'));

      expect(getByTestId('urbania-viewer')).toBeTruthy();
      expect(getByTestId('urbania-viewer-counter').props.children).toBe('1 / 5');
    });

    it('opens on the photo that was last viewed, not always the first', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-hero'));
      fireEvent.press(getByTestId('urbania-viewer-thumb-3'));
      fireEvent.press(getByTestId('urbania-viewer-close'));
      fireEvent.press(getByTestId('urbania-hero'));

      expect(getByTestId('urbania-viewer-counter').props.children).toBe('4 / 5');
    });

    it('goes through the photos with next and previous', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-hero'));
      expect(getByTestId('urbania-viewer-counter').props.children).toBe('1 / 5');

      fireEvent.press(getByTestId('urbania-viewer-next'));
      fireEvent.press(getByTestId('urbania-viewer-next'));
      expect(getByTestId('urbania-viewer-counter').props.children).toBe('3 / 5');

      fireEvent.press(getByTestId('urbania-viewer-prev'));
      expect(getByTestId('urbania-viewer-counter').props.children).toBe('2 / 5');
    });

    it('leaves the header on the last photo that was viewed', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      fireEvent.press(getByTestId('urbania-hero'));
      fireEvent.press(getByTestId('urbania-viewer-next'));
      fireEvent.press(getByTestId('urbania-viewer-next'));
      fireEvent.press(getByTestId('urbania-viewer-close'));

      expect(queryByTestId('urbania-viewer')).toBeNull();
      expect(getByTestId('urbania-hero-photo').props.source).toBe(theme.images.urbaniaGallery[2]);
    });

    it('does not go back a screen when the viewer is closed', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-hero'));
      fireEvent.press(getByTestId('urbania-viewer-close'));
      expect(navigation.goBack).not.toHaveBeenCalled();
    });
  });

  describe('3D bottom edge on the cards', () => {
    const style = node => StyleSheet.flatten(node.props.style);

    it('gives every numbered card in the agreement and the booking steps a raised bottom edge', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      for (let i = 0; i < 3; i += 1) {
        ['urbania-agreement', 'urbania-booking'].forEach(prefix => {
          const card = style(getByTestId(`${prefix}-card-${i}`));
          expect(card.borderBottomWidth).toBeGreaterThan(card.borderWidth);
          expect(card.borderBottomColor).toBe('#DDD6FE');
        });
      }
    });

    it('gives the FAQ card the same raised bottom edge', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const card = style(getByTestId('urbania-faq-card'));

      expect(card.borderBottomWidth).toBeGreaterThan(card.borderWidth);
    });

    it('shows a darker lip under the pricing card, so it has the same raised edge', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const outer = style(getByTestId('urbania-pricing-shadow'));

      expect(outer.paddingBottom).toBeGreaterThan(0);
      // The lip is darker than the gradient's own start colour
      expect(outer.backgroundColor).toBe('#2A0A6B');
    });

    it('uses the dark app edge colour in dark mode', () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const card = style(getByTestId('urbania-agreement-card-0'));

      expect(card.borderBottomColor).toBe('#4C1D95');
      expect(card.borderBottomWidth).toBeGreaterThan(card.borderWidth);
      useStore.setState({ isDarkMode: false });
    });
  });

  describe('cost notes card', () => {
    const style = node => StyleSheet.flatten(node.props.style);

    it('is a card with a header, instead of a plain line of grey text', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByTestId('urbania-tolls')).toBeTruthy();
      expect(getByText('GOOD TO KNOW')).toBeTruthy();
      expect(getByText('Before you request')).toBeTruthy();
    });

    it('keeps every word of the original message, split into three rows', () => {
      const { getByText, getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(COST_NOTES).toHaveLength(3);
      expect(getByText('Tolls and parking')).toBeTruthy();
      expect(getByText('Charged at actuals.')).toBeTruthy();
      expect(getByText('GST')).toBeTruthy();
      expect(getByText('This estimate does not calculate a separate GST amount.')).toBeTruthy();
      expect(getByText('Confirmation')).toBeTruthy();
      expect(getByText('A request is provisional until Akash confirms it.')).toBeTruthy();
      for (let i = 0; i < 3; i += 1) {
        expect(getByTestId(`urbania-cost-row-${i}`)).toBeTruthy();
      }
    });

    it('gives each row its own colour from the app palette', () => {
      expect(new Set(COST_NOTES.map(note => note.colors.join())).size).toBe(3);
      COST_NOTES.forEach(note => expect(note.colors).toHaveLength(2));
    });

    it('has the raised bottom edge and a gradient accent along the top, like the other cards', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const card = style(getByTestId('urbania-tolls'));

      expect(card.borderBottomWidth).toBeGreaterThan(card.borderWidth);
      expect(card.borderBottomColor).toBe('#DDD6FE');
      expect(card.overflow).toBe('hidden');
    });

    it('uses the dark app colours in dark mode', () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const card = style(getByTestId('urbania-tolls'));

      expect(card.backgroundColor).toBe('#1A0B30');
      expect(card.borderBottomColor).toBe('#4C1D95');
      useStore.setState({ isDarkMode: false });
    });
  });

  describe('pricing card', () => {
    it('puts the discount tag on its own line, not on top of the heading', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const tag = StyleSheet.flatten(getByTestId('urbania-discount').props.style);

      expect(tag.position).not.toBe('absolute');
      expect(tag.top).toBeUndefined();
      expect(tag.right).toBeUndefined();
      expect(tag.alignSelf).toBe('flex-start');
    });

    it('shows the tag before the heading in the card, so they are stacked, not overlapping', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const card = getByTestId('urbania-pricing');
      const order = card.children.map(child =>
        typeof child === 'string' ? null : child.props.testID || null,
      );

      expect(order.indexOf('urbania-discount')).toBeGreaterThan(-1);
      expect(order.indexOf('urbania-pricing-eyebrow')).toBeGreaterThan(
        order.indexOf('urbania-discount'),
      );
    });

    it('does not squeeze the heading to make room for a tag', () => {
      const { getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const title = StyleSheet.flatten(getByText('Know the rules before the road').props.style);
      expect(title.paddingRight).toBeUndefined();
    });

    it('has no leftover bottom border showing as a grey strip under the card', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const card = StyleSheet.flatten(getByTestId('urbania-pricing').props.style);
      expect(card.borderBottomWidth).toBeUndefined();
    });

    it('keeps the shadow off the gradient: it is on a solid outer view, so the card always draws', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const gradient = StyleSheet.flatten(getByTestId('urbania-pricing').props.style);
      const outer = StyleSheet.flatten(getByTestId('urbania-pricing-shadow').props.style);

      // A shadow on the gradient itself makes Android draw an empty ghost box
      expect(gradient.elevation).toBeUndefined();
      expect(gradient.shadowOpacity).toBeUndefined();
      expect(gradient.overflow).toBe('hidden');
      // The outer view has a solid colour behind the shadow
      expect(outer.backgroundColor).toBeTruthy();
      expect(outer.elevation).toBeGreaterThan(0);
      expect(outer.borderRadius).toBe(gradient.borderRadius);
    });

    it('keeps the card content inside the gradient, which is inside the shadow view', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const outer = getByTestId('urbania-pricing-shadow');

      let node = getByText('Know the rules before the road');
      let reachedGradient = false;
      let reachedOuter = false;
      while (node) {
        if (node === getByTestId('urbania-pricing')) {
          reachedGradient = true;
        }
        if (node === outer) {
          reachedOuter = true;
        }
        node = node.parent;
      }
      expect(reachedGradient).toBe(true);
      expect(reachedOuter).toBe(true);
    });

    it('still shows the discount and both prices', () => {
      const { getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('10%')).toBeTruthy();
      expect(getByText(' Discount Applied')).toBeTruthy();
      expect(getByText('SIMPLE, TRANSPARENT PRICING')).toBeTruthy();
      expect(getByText('₹5,850')).toBeTruthy();
      expect(getByText('₹8,800')).toBeTruthy();
    });
  });

  describe('Add stop button', () => {
    const style = node => StyleSheet.flatten(node.props.style);

    it('is a raised 3D button: a darker depth layer under a lighter face', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('Add a stop')).toBeTruthy();
      expect(style(getByTestId('urbania-add-stop-depth')).backgroundColor).toBe('#B9A6F2');
      const face = style(getByTestId('urbania-add-stop-face'));
      expect(face.borderRadius).toBeGreaterThan(0);
      // The face is moved by a transform, so it can sink into the depth when pressed
      expect(face.transform[0]).toHaveProperty('translateY');
    });

    it('sits the depth layer lower than the face, so a raised edge shows at the bottom', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const depth = style(getByTestId('urbania-add-stop-depth'));

      expect(depth.top).toBeGreaterThan(0);
      expect(depth.bottom).toBe(0);
    });

    it('still adds a stop when pressed, and can be pressed down and let go', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const button = getByTestId('urbania-add-stop');

      fireEvent(button, 'pressIn');
      fireEvent(button, 'pressOut');
      fireEvent.press(button);
      expect(getByTestId('urbania-stop-0')).toBeTruthy();
    });

    it('uses the darker app colours in dark mode', () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(style(getByTestId('urbania-add-stop-depth')).backgroundColor).toBe('#4C1D95');
      expect(style(getByTestId('urbania-add-stop-face')).backgroundColor).toBe('#27104B');
      useStore.setState({ isDarkMode: false });
    });
  });

  describe('calendar and exact times', () => {
    const lastPicker = () => DateTimePicker.mock.calls[DateTimePicker.mock.calls.length - 1][0];
    const renderScreen = () => render(<UrbaniaBookingScreen navigation={navigation} />);

    beforeEach(() => {
      DateTimePicker.mockClear();
      DateTimePickerAndroid.open.mockClear();
    });

    it('shows the month calendar with its legend, as on the website', () => {
      const { getByTestId, getByText } = renderScreen();

      expect(getByTestId('urbania-cal-title').props.children).toBe('January 2099');
      ['Available', 'Partially available', 'Unavailable'].forEach(label =>
        expect(getByText(label)).toBeTruthy(),
      );
      ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach(day =>
        expect(getByText(day)).toBeTruthy(),
      );
      // 1 Jan 2099 is a Thursday: 31 days are shown
      expect(getByTestId('urbania-day-2099-01-31')).toBeTruthy();
    });

    it('no longer has the typed date boxes', () => {
      const { queryByTestId } = renderScreen();
      expect(queryByTestId('urbania-pickup-at')).toBeNull();
      expect(queryByTestId('urbania-return-at')).toBeNull();
    });

    it('moves between months, but not back before this month', () => {
      const { getByTestId } = renderScreen();

      expect(getByTestId('urbania-cal-prev').props.accessibilityState.disabled).toBe(true);
      fireEvent.press(getByTestId('urbania-cal-next'));
      expect(getByTestId('urbania-cal-title').props.children).toBe('February 2099');
      fireEvent.press(getByTestId('urbania-cal-prev'));
      expect(getByTestId('urbania-cal-title').props.children).toBe('January 2099');
    });

    it('asks the API for the month, and again for each month that is opened', async () => {
      const { getByTestId } = renderScreen();
      await act(async () => {});
      expect(fetchMonthAvailability).toHaveBeenLastCalledWith('2099-01');

      fireEvent.press(getByTestId('urbania-cal-next'));
      await act(async () => {});
      expect(fetchMonthAvailability).toHaveBeenLastCalledWith('2099-02');
    });

    it('does not let a day in the past be picked', () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId('urbania-day-2099-01-09').props.accessibilityState.disabled).toBe(true);
      expect(getByTestId('urbania-day-2099-01-10').props.accessibilityState.disabled).toBe(false);
    });

    it('does not let a day the API says is unavailable be picked, and shows the others as open', async () => {
      fetchMonthAvailability.mockResolvedValue({
        days: [
          { date: '2099-01-20', status: 'unavailable' },
          { date: '2099-01-21', status: 'partial' },
        ],
      });
      const { getByTestId } = renderScreen();
      await act(async () => {});

      expect(getByTestId('urbania-day-2099-01-20').props.accessibilityState.disabled).toBe(true);
      expect(getByTestId('urbania-day-2099-01-21').props.accessibilityState.disabled).toBe(false);
      expect(getByTestId('urbania-day-2099-01-22').props.accessibilityState.disabled).toBe(false);
      expect(getByTestId('urbania-day-2099-01-20').props.accessibilityLabel).toBe(
        '20 January, Full',
      );
      expect(getByTestId('urbania-day-2099-01-21').props.accessibilityLabel).toBe(
        '21 January, Partial',
      );
      expect(getByTestId('urbania-day-2099-01-22').props.accessibilityLabel).toBe(
        '22 January, Open',
      );
    });

    it('still shows the calendar when the month cannot be loaded', async () => {
      fetchMonthAvailability.mockRejectedValue(new Error('offline'));
      const { getByTestId } = renderScreen();
      await act(async () => {});
      expect(getByTestId('urbania-day-2099-01-20').props.accessibilityState.disabled).toBe(false);
    });

    it('takes the first tap as the pickup and the second as the return', () => {
      const view = renderScreen();

      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
      expect(view.getByTestId('urbania-day-2099-01-15').props.accessibilityState.selected).toBe(
        true,
      );
      expect(view.queryByTestId('urbania-window')).toBeNull();

      fireEvent.press(view.getByTestId('urbania-day-2099-01-16'));
      expect(view.getByTestId('urbania-day-2099-01-16').props.accessibilityState.selected).toBe(
        true,
      );
      expect(view.getByTestId('urbania-window-title').props.children).toBe(
        '2 started day(s) · 1 night(s) · 33h 0m',
      );
    });

    it('marks the picked days "Pickup" and "Drop", and shows them under the calendar', () => {
      const view = renderScreen();
      expect(view.getByTestId('urbania-cal-pickup').props.children).toBe('Pick a day');

      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
      fireEvent.press(view.getByTestId('urbania-day-2099-01-16'));

      expect(view.getByText('Pickup')).toBeTruthy();
      expect(view.getByText('Drop')).toBeTruthy();
      expect(view.getByTestId('urbania-day-2099-01-15-selected')).toBeTruthy();
      expect(view.getByTestId('urbania-cal-pickup').props.children).toBe('Thu, 15 Jan');
      expect(view.getByTestId('urbania-cal-return').props.children).toBe('Fri, 16 Jan');
    });

    it('joins the pickup and the return with a band over the days between', () => {
      const view = renderScreen();
      fireEvent.press(view.getByTestId('urbania-day-2099-01-14'));
      fireEvent.press(view.getByTestId('urbania-day-2099-01-17'));

      expect(view.getByTestId('urbania-day-2099-01-15-range')).toBeTruthy();
      expect(view.getByTestId('urbania-day-2099-01-16-range')).toBeTruthy();
      expect(view.queryByTestId('urbania-day-2099-01-14-range')).toBeNull();
      expect(view.queryByTestId('urbania-day-2099-01-18-range')).toBeNull();
    });

    it('calls a one-day trip "Trip", and rings today', () => {
      const view = renderScreen();
      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
      // "Trip" is also the name of step 1, so the day's label is the second one
      expect(view.getAllByText('Trip')).toHaveLength(2);

      const today = StyleSheet.flatten(
        view.getByTestId('urbania-day-2099-01-10-circle').props.style,
      );
      expect(today.borderColor).toBe('#7C3AED');
    });

    it('uses the dark app colours for the calendar in dark mode', () => {
      useStore.setState({ isDarkMode: true });
      const view = renderScreen();
      expect(
        StyleSheet.flatten(view.getByTestId('urbania-calendar').props.style).backgroundColor,
      ).toBe('#1A0B30');
      useStore.setState({ isDarkMode: false });
    });

    it('starts again when a third day is tapped, or a day before the pickup', () => {
      const view = renderScreen();
      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
      fireEvent.press(view.getByTestId('urbania-day-2099-01-16'));

      fireEvent.press(view.getByTestId('urbania-day-2099-01-18'));
      expect(view.getByTestId('urbania-day-2099-01-18').props.accessibilityState.selected).toBe(
        true,
      );
      expect(view.getByTestId('urbania-day-2099-01-16').props.accessibilityState.selected).toBe(
        false,
      );
      expect(view.queryByTestId('urbania-window')).toBeNull();

      fireEvent.press(view.getByTestId('urbania-day-2099-01-12'));
      expect(view.getByTestId('urbania-day-2099-01-12').props.accessibilityState.selected).toBe(
        true,
      );
      expect(view.getByTestId('urbania-day-2099-01-18').props.accessibilityState.selected).toBe(
        false,
      );
    });

    it('allows the return on the same day as the pickup', () => {
      const view = renderScreen();
      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
      fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));

      expect(view.getByTestId('urbania-window-title').props.children).toBe(
        '1 started day(s) · 0 night(s) · 9h 0m',
      );
    });

    it('starts the exact times at 09:00 AM and 06:00 PM, with a clock on each', () => {
      const { getByTestId, getByText } = renderScreen();

      expect(getByText('Exact pickup time (IST)')).toBeTruthy();
      expect(getByText('Exact return time (IST)')).toBeTruthy();
      expect(getByTestId('urbania-pickup-time-value').props.children).toBe('09:00 AM');
      expect(getByTestId('urbania-return-time-value').props.children).toBe('06:00 PM');
    });

    describe('on iPhone', () => {
      it('opens a time picker under the boxes, and closes it when the box is pressed again', () => {
        const { getByTestId, queryByTestId } = renderScreen();
        expect(queryByTestId('urbania-time-picker')).toBeNull();

        fireEvent.press(getByTestId('urbania-pickup-time'));
        expect(lastPicker().mode).toBe('time');
        expect(lastPicker().value.getHours()).toBe(9);

        fireEvent.press(getByTestId('urbania-pickup-time'));
        expect(DateTimePicker.mock.calls.length).toBeGreaterThan(0);
        expect(queryByTestId('urbania-time-picker')).toBeNull();
      });

      it('shows the picked time in the box and uses it for the trip window', () => {
        const view = renderScreen();
        fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
        fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
        setTime(view, 'pickup', '1030');

        expect(view.getByTestId('urbania-pickup-time-value').props.children).toBe('10:30 AM');
        expect(view.getByTestId('urbania-window-title').props.children).toBe(
          '1 started day(s) · 0 night(s) · 7h 30m',
        );
      });

      it('uses the dark picker in dark mode', () => {
        useStore.setState({ isDarkMode: true });
        const { getByTestId } = renderScreen();
        fireEvent.press(getByTestId('urbania-pickup-time'));
        expect(lastPicker().themeVariant).toBe('dark');
        useStore.setState({ isDarkMode: false });
      });
    });

    describe('on Android', () => {
      const original = Platform.OS;
      beforeEach(() => {
        Platform.OS = 'android';
      });
      afterEach(() => {
        Platform.OS = original;
      });

      it('opens the time dialog, and fills the box from it', () => {
        const view = renderScreen();
        fireEvent.press(view.getByTestId('urbania-return-time'));

        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
        const options = DateTimePickerAndroid.open.mock.calls[0][0];
        expect(options.mode).toBe('time');
        expect(options.value.getHours()).toBe(18);

        act(() => options.onValueChange({}, new Date(2099, 0, 1, 20, 15)));
        expect(view.getByTestId('urbania-return-time-value').props.children).toBe('08:15 PM');
        expect(DateTimePicker).not.toHaveBeenCalled();
      });
    });

    describe('availability of the chosen window', () => {
      it('says the times are available once both days are picked', async () => {
        const view = renderScreen();
        fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
        fireEvent.press(view.getByTestId('urbania-day-2099-01-16'));
        await act(async () => {});

        expect(fetchAvailability).toHaveBeenLastCalledWith({
          start: '2099-01-15T09:00:00+05:30',
          end: '2099-01-16T18:00:00+05:30',
        });
        expect(view.getByText(/Selected times are available/)).toBeTruthy();
      });

      it('says so, and does not go on, when the window is taken', async () => {
        fetchAvailability.mockResolvedValue({ available: false, message: 'Already booked' });
        const view = renderScreen();
        fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
        fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
        fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
        fireEvent.press(view.getByTestId('urbania-day-2099-01-16'));
        await act(async () => {});

        expect(view.getByTestId('urbania-availability')).toBeTruthy();
        expect(view.getAllByText('Already booked').length).toBeGreaterThan(0);

        fireEvent.press(view.getByTestId('urbania-next'));
        expect(stepCount(view.getByTestId)).toBe('1 of 3');
        expect(view.getByTestId('urbania-window-error')).toBeTruthy();
      });

      it('shows both messages like the website, even for a trip that is too long', async () => {
        const view = renderScreen();
        fireEvent.press(view.getByTestId('urbania-day-2099-01-12'));
        fireEvent.press(view.getByTestId('urbania-day-2099-01-20'));
        await act(async () => {});

        expect(fetchAvailability).toHaveBeenCalledTimes(1);
        expect(view.getByText(/Selected times are available/)).toBeTruthy();
        expect(view.getByTestId('urbania-window-title').props.children).toBe(
          '9 started day(s) · 8 night(s) · 201h 0m',
        );
        expect(view.getByText('Maximum 3 started days, 2 nights and 72 hours.')).toBeTruthy();
      });

      it('shows the availability message above the trip length', async () => {
        const view = renderScreen();
        fireEvent.press(view.getByTestId('urbania-day-2099-01-15'));
        fireEvent.press(view.getByTestId('urbania-day-2099-01-16'));
        await act(async () => {});

        const order = view.toJSON();
        const flat = JSON.stringify(order);
        expect(flat.indexOf('urbania-availability')).toBeLessThan(flat.indexOf('urbania-window"'));
      });
    });

    it('asks for the pickup day on the calendar when none is picked', () => {
      const view = renderScreen();
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
      fireEvent.press(view.getByTestId('urbania-next'));

      expect(view.getByTestId('urbania-dates-error').props.children).toBe(
        'Select the pickup date on the calendar',
      );
    });
  });

  describe('trip window and the too-long error', () => {
    // The website's own example: 1 Dec 13:42 to 3 Dec 19:43
    const website = view => {
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
      fillDates(view, '011220991342', '031220991943');
    };

    it('shows the trip window under the dates once both are filled in', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(view.queryByTestId('urbania-window')).toBeNull();

      fillDates(view, '011220991342', '031220991943');

      expect(view.getByTestId('urbania-window-title').props.children).toBe(
        '3 started day(s) · 2 night(s) · 54h 1m',
      );
      expect(view.getByText('Maximum 3 started days, 2 nights and 72 hours.')).toBeTruthy();
    });

    it('does not show a window with only the pickup, or with a return before the pickup', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      fillDates(view, '011220991342');
      expect(view.queryByTestId('urbania-window')).toBeNull();
      fillDates(view, '011220991342', '301120991000');
      expect(view.queryByTestId('urbania-window')).toBeNull();
    });

    it('updates the window as the times change', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillDates(view, '011220990900', '011220991700');
      expect(view.getByTestId('urbania-window-title').props.children).toBe(
        '1 started day(s) · 0 night(s) · 8h 0m',
      );

      fillDates(view, '011220990900', '021220991000');
      expect(view.getByTestId('urbania-window-title').props.children).toBe(
        '2 started day(s) · 1 night(s) · 25h 0m',
      );
    });

    it('tints the window pink when the trip is too long', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      fillDates(view, '011220990900', '051220990900');
      const card = StyleSheet.flatten(view.getByTestId('urbania-window').props.style);
      expect(card.backgroundColor).toBe('#FDF2F2');

      fillDates(view, '011220990900', '021220991000');
      const fine = StyleSheet.flatten(view.getByTestId('urbania-window').props.style);
      expect(fine.backgroundColor).toBe('#F3EEFF');
    });

    it('shows the website message in a pink box under the Next button when the trip is too long', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
      fillDates(view, '011220990900', '051220990900');

      fireEvent.press(view.getByTestId('urbania-next'));

      expect(view.getByTestId('urbania-window-error')).toBeTruthy();
      expect(
        view.getByText('Enter a valid trip window up to 3 started days, 2 nights and 72 hours.'),
      ).toBeTruthy();
      expect(stepCount(view.getByTestId)).toBe('1 of 3');
      const box = StyleSheet.flatten(view.getByTestId('urbania-window-error').props.style);
      expect(box.backgroundColor).toBe('#FDF2F2');
    });

    it('takes the message away as soon as a date is changed', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
      fillDates(view, '011220990900', '051220990900');
      fireEvent.press(view.getByTestId('urbania-next'));
      expect(view.getByTestId('urbania-window-error')).toBeTruthy();

      fillDates(view, '011220990900', '021220991000');
      expect(view.queryByTestId('urbania-window-error')).toBeNull();
    });

    it('moves on to the group step when the trip window is fine', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      website(view);

      fireEvent.press(view.getByTestId('urbania-next'));
      expect(view.queryByTestId('urbania-window-error')).toBeNull();
      expect(stepCount(view.getByTestId)).toBe('2 of 3');
    });
  });

  describe('group step as on the website', () => {
    const toGroup = (ret = '031220991943', type = 'outstation') => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId(`urbania-type-${type}`));
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
      fillDates(view, '011220991342', ret);
      fireEvent.press(view.getByTestId('urbania-next'));
      return view;
    };

    it('has the website fields and labels', () => {
      const { getByText, getByTestId } = toGroup();

      expect(getByText('Passengers (maximum 12)')).toBeTruthy();
      expect(getByText('Number of pets (no fixed cap)')).toBeTruthy();
      expect(getByText('Optional breed / size notes')).toBeTruthy();
      expect(getByText('Luggage notes')).toBeTruthy();
      expect(getByText('Special requirements')).toBeTruthy();
      ['urbania-breeds', 'urbania-luggage', 'urbania-special'].forEach(id =>
        expect(getByTestId(id)).toBeTruthy(),
      );
      expect(getByText('Check route & fare')).toBeTruthy();
    });

    it('uses the same text box style and fonts on the new notes boxes', () => {
      const { getByTestId } = toGroup();

      ['urbania-luggage', 'urbania-special'].forEach(id => {
        const box = StyleSheet.flatten(getByTestId(id).props.style);
        expect(box.backgroundColor).toBe('#FAF8F5');
        expect(box.fontFamily).toBe('Manrope-Regular');
        expect(box.lineHeight).toBe(s(20));
        expect(getByTestId(id).props.placeholderTextColor).toBe('#3D2D46');
      });
    });

    it('offers night driving with the price and the parking-only note', () => {
      const { getByTestId } = toGroup();
      const label = [].concat(
        getByTestId('urbania-night-driving').findByType(require('react-native').Text).props
          .children,
      );

      expect(label.join('')).toContain('Request night driving (10pm–6am).');
      expect(label.join('')).toContain('₹500');
      expect(label.join('')).toContain('A parking-only overnight has no charge.');
    });

    it('shows no overnight choices until night driving is ticked', () => {
      const { queryByTestId, getByTestId } = toGroup();
      expect(queryByTestId('urbania-night-1')).toBeNull();

      fireEvent.press(getByTestId('urbania-night-driving'));
      expect(getByTestId('urbania-night-driving').props.accessibilityState.checked).toBe(true);
      expect(getByTestId('urbania-night-1')).toBeTruthy();
    });

    it('lists one choice for each overnight period of the trip, like "1 of 2 overnight period(s)"', () => {
      const { getByTestId, getByText, queryByTestId } = toGroup();
      fireEvent.press(getByTestId('urbania-night-driving'));

      expect(getByText('1 of 2 overnight period(s)')).toBeTruthy();
      expect(getByText('2 of 2 overnight period(s)')).toBeTruthy();
      expect(queryByTestId('urbania-night-3')).toBeNull();
      expect(getByTestId('urbania-night-1').props.accessibilityState.selected).toBe(true);

      fireEvent.press(getByTestId('urbania-night-2'));
      expect(getByTestId('urbania-night-2').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('urbania-night-1').props.accessibilityState.selected).toBe(false);
    });

    it('offers one choice only for a trip with a single night', () => {
      const { getByTestId, getByText, queryByTestId } = toGroup('021220991000');
      fireEvent.press(getByTestId('urbania-night-driving'));

      expect(getByText('1 of 1 overnight period(s)')).toBeTruthy();
      expect(queryByTestId('urbania-night-2')).toBeNull();
    });

    it('says there is no overnight period when the trip is within one day', () => {
      const { getByTestId, queryByTestId } = toGroup('011220992000');
      fireEvent.press(getByTestId('urbania-night-driving'));

      expect(getByTestId('urbania-night-hint')).toBeTruthy();
      expect(queryByTestId('urbania-night-1')).toBeNull();
    });

    it('keeps what was typed when going back and forward', () => {
      const view = toGroup();
      fireEvent.changeText(view.getByTestId('urbania-luggage'), 'Two bags');
      fireEvent.press(view.getByTestId('urbania-night-driving'));
      fireEvent.press(view.getByTestId('urbania-night-2'));

      fireEvent.press(view.getByTestId('urbania-prev'));
      fireEvent.press(view.getByTestId('urbania-next'));

      expect(view.getByTestId('urbania-luggage').props.value).toBe('Two bags');
      expect(view.getByTestId('urbania-night-driving').props.accessibilityState.checked).toBe(true);
      expect(view.getByTestId('urbania-night-2').props.accessibilityState.selected).toBe(true);
    });
  });

  describe('request step as on the website', () => {
    const toRequest = async ({
      ret = '031220991943',
      type = 'outstation',
      night,
      stops = [],
    } = {}) => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId(`urbania-type-${type}`));
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Delhi');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'Goa');
      stops.forEach((stop, index) => {
        fireEvent.press(view.getByTestId('urbania-add-stop'));
        fireEvent.changeText(view.getByTestId(`urbania-stop-${index}`), stop);
      });
      fillDates(view, '011220991342', ret);
      fireEvent.press(view.getByTestId('urbania-next'));
      if (night) {
        fireEvent.press(view.getByTestId('urbania-night-driving'));
        fireEvent.press(view.getByTestId(`urbania-night-${night}`));
      }
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-next'));
      });
      return view;
    };

    it('shows the route as a list of places, from the base and back', async () => {
      requestEstimate.mockResolvedValue({
        ...ESTIMATE,
        route: { distanceKm: 281.4, durationMinutes: 330 },
        availabilityMessage: undefined,
      });
      const view = await toRequest({ stops: ['Jaipur'] });
      const route = view.getByTestId('urbania-route');

      expect(view.getByText('Route estimate')).toBeTruthy();
      ['Urbania base', 'Pickup', 'Stop 1', 'Destination', 'Drop-off', 'Back to base'].forEach(
        role => expect(view.getAllByText(role).length).toBeGreaterThan(0),
      );
      // The drop-off is the pickup place unless another one is given
      expect(view.getAllByText('Delhi')).toHaveLength(2);
      expect(view.getByText('Jaipur')).toBeTruthy();
      expect(view.getByText('Goa')).toBeTruthy();
      expect(route).toBeTruthy();
    });

    it('says the route distance is only an estimate that Akash confirms', async () => {
      requestEstimate.mockResolvedValue({
        ...ESTIMATE,
        route: { distanceKm: 281.4, durationMinutes: 330 },
        availabilityMessage: undefined,
      });
      const { getByText } = await toRequest();

      expect(
        getByText(/Route distance and drive time are estimates, and Akash confirms the route/),
      ).toBeTruthy();
      expect(
        getByText(/The time appears open for a request, but the operator must review feasibility/),
      ).toBeTruthy();
    });

    it('shows the base window in the website format', async () => {
      requestEstimate.mockResolvedValue({
        ...ESTIMATE,
        route: { distanceKm: 281.4, durationMinutes: 330 },
        availabilityMessage: undefined,
      });
      const { getByTestId } = await toRequest();
      const text = [].concat(getByTestId('urbania-route-window').props.children).join('');

      expect(text).toBe('Base window: 1 Dec 2099, 1:42 pm – 3 Dec 2099, 7:43 pm');
    });

    it('loads the service settings when the page opens, and uses the base address from them', async () => {
      requestEstimate.mockResolvedValue({
        ...ESTIMATE,
        route: { distanceKm: 281.4, durationMinutes: 330 },
        availabilityMessage: undefined,
      });
      fetchPublicConfig.mockResolvedValue({ baseAddress: 'Urbania depot, Sector 18, Gurugram' });
      const view = await toRequest();

      expect(fetchPublicConfig).toHaveBeenCalledTimes(1);
      expect(view.getAllByText('Urbania depot, Sector 18, Gurugram').length).toBe(2);
    });

    it('shows the fare the API worked out, turned from paise into rupees', async () => {
      const { getByTestId, getByText } = await toRequest();

      expect(getByText('Server fare breakdown')).toBeTruthy();
      const value = key => [].concat(getByTestId(`urbania-fare-${key}`).props.children).join('');
      expect(value('regularVehiclePaise')).toBe('₹6,500.00');
      expect(getByText('Vehicle fare before discount')).toBeTruthy();
      expect(value('discountPaise')).toBe('-₹650.00');
      expect(getByText('Pet-parent discount')).toBeTruthy();
      expect(value('discountedVehiclePaise')).toBe('₹5,850.00');
      expect(value('includedDriverPaise')).toBe('₹1,400.00');
      expect(value('nightChargePaise')).toBe('₹500.00');
      expect(getByText('Night driving')).toBeTruthy();
      expect(value('totalPaise')).toBe('₹7,750.00');
      expect(getByText('Total fare')).toBeTruthy();
    });

    it('shows the advance, the balance and the deposit like the website', async () => {
      const { getByTestId, getByText } = await toRequest();

      expect(getByText('Balance at pickup', { exact: false })).toBeTruthy();
      expect(getByTestId('urbania-fare-advance').props.children).toBe('₹1,937.50');
      expect(getByTestId('urbania-fare-balance').props.children).toBe('₹5,812.50');
      expect(getByTestId('urbania-fare-deposit').props.children).toBe('₹5,000.00');
      expect(getByTestId('urbania-fare-note').props.children).toBe(
        '3 started booking day(s); minimum distance 750 km. The vehicle charge uses the greater of actual route distance or that minimum (781.4 km billable).',
      );
    });

    it('lists each leg of the route with its distance and drive time', async () => {
      const { getByTestId } = await toRequest();

      expect(getByTestId('urbania-route-leg-0').props.children).toBe('21.2 km · 0h 47m');
      expect(getByTestId('urbania-route-leg-1').props.children).toBe('260.2 km · 4h 43m');
    });

    it("uses the server's base window and message", async () => {
      const { getByTestId } = await toRequest();

      expect([].concat(getByTestId('urbania-route-window').props.children).join('')).toBe(
        'Base window: 14 Jan 2099, 9:13 am – 16 Jan 2099, 6:49 pm',
      );
      expect(getByTestId('urbania-route-message').props.children).toBe(
        'Open for a request; the operator reviews feasibility.',
      );
    });

    it('asked the API for the estimate with this trip, in IST', async () => {
      await toRequest({ stops: ['Jaipur'] });

      expect(requestEstimate).toHaveBeenCalledTimes(1);
      expect(requestEstimate).toHaveBeenCalledWith(
        expect.objectContaining({
          tripType: 'outstation',
          pickupAddress: 'Delhi',
          destinationAddress: 'Goa',
          stops: ['Jaipur'],
          dropAddress: 'Delhi',
          pickupAt: '2099-12-01T13:42:00+05:30',
          expectedReturnAt: '2099-12-03T19:43:00+05:30',
          passengers: 2,
          petCount: 1,
        }),
      );
    });

    it('checks that exact window is free before asking for the estimate', async () => {
      await toRequest();

      expect(fetchAvailability).toHaveBeenCalledWith({
        start: '2099-12-01T13:42:00+05:30',
        end: '2099-12-03T19:43:00+05:30',
      });
    });

    it('shows the route distance and drive time from the estimate', async () => {
      const { getByTestId } = await toRequest();
      const text = [].concat(getByTestId('urbania-route-distance').props.children).join('');
      expect(text).toBe('Total base-route: 281.4 km · 5h 30m');
    });

    it('says the route needs a manual review, with the reasons, when there is no fare', async () => {
      requestEstimate.mockResolvedValue({
        route: {},
        fare: null,
        manualReviewReasons: ['Remote destination'],
      });
      const { getByTestId, queryByTestId } = await toRequest();

      expect(getByTestId('urbania-fare-manual')).toBeTruthy();
      expect(getByTestId('urbania-review-reason-0').props.children).toBe('Remote destination');
      expect(queryByTestId('urbania-fare-totalFare')).toBeNull();
    });

    it('stays on the group step, with the reason, when the dates are not available', async () => {
      fetchAvailability.mockResolvedValue({ available: false, message: 'Booked on those days' });
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-next'));
      });

      expect(stepCount(view.getByTestId)).toBe('2 of 3');
      expect(view.getByTestId('urbania-problem')).toBeTruthy();
      expect(view.getByText('Booked on those days')).toBeTruthy();
      expect(requestEstimate).not.toHaveBeenCalled();
    });

    it('stays on the group step, with the reason, when the estimate fails', async () => {
      requestEstimate.mockRejectedValue({ response: { data: { message: 'Route not found' } } });
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-next'));
      });

      expect(stepCount(view.getByTestId)).toBe('2 of 3');
      expect(view.getByText('Route not found')).toBeTruthy();
    });

    it('shows the night driving that was asked for as a note, and sends it to the API', async () => {
      const view = await toRequest({ night: 1 });

      expect(view.getByTestId('urbania-route-night')).toBeTruthy();
      expect(requestEstimate).toHaveBeenCalledWith(
        expect.objectContaining({ nightDrivingRequested: true, nightDrivingNights: 1 }),
      );
    });

    it('has no night driving line or route note when it was not asked for', async () => {
      const { queryByTestId } = await toRequest();

      expect(queryByTestId('urbania-fare-night')).toBeNull();
      expect(queryByTestId('urbania-route-night')).toBeNull();
    });

    it('shows the cancellation notice in the yellow box', async () => {
      const { getByTestId } = await toRequest();
      const box = StyleSheet.flatten(getByTestId('urbania-notice').props.style);

      expect(box.backgroundColor).toBe('#FFF8E6');
      const text = []
        .concat(
          getByTestId('urbania-notice').findByType(require('react-native').Text).props.children,
        )
        .join('');
      expect(text).toContain('the 25% advance is non-refundable');
      expect(text).toContain('₹5,000 refundable damage deposit are due at pickup');
    });

    it('asks for the name, the mobile and a required email', async () => {
      const { getByText } = await toRequest();

      expect(getByText('Your name')).toBeTruthy();
      expect(getByText('Mobile / WhatsApp')).toBeTruthy();
      expect(getByText('Email (required)')).toBeTruthy();
    });

    it('hides Send until all three boxes are ticked', async () => {
      const view = await toRequest();

      expect(view.queryByTestId('urbania-send')).toBeNull();
      expect(view.getByTestId('urbania-consent-hint')).toBeTruthy();

      fireEvent.press(view.getByTestId('urbania-agree'));
      expect(view.queryByTestId('urbania-send')).toBeNull();
      fireEvent.press(view.getByTestId('urbania-age'));
      expect(view.queryByTestId('urbania-send')).toBeNull();
      fireEvent.press(view.getByTestId('urbania-account-terms'));

      expect(view.getByTestId('urbania-send').props.accessibilityState.disabled).toBe(false);
      expect(view.getByText('Send provisional request')).toBeTruthy();
      expect(view.queryByTestId('urbania-consent-hint')).toBeNull();
      expect(submitRequest).not.toHaveBeenCalled();
    });

    it('hides Send again when a box is unticked', async () => {
      const view = await toRequest();
      agreeAll(view);
      expect(view.getByTestId('urbania-send')).toBeTruthy();

      fireEvent.press(view.getByTestId('urbania-age'));
      expect(view.queryByTestId('urbania-send')).toBeNull();
    });

    it('shows the 18+ and account wording from the website', async () => {
      const { getByTestId } = await toRequest();
      const words = id =>
        [].concat(getByTestId(id).findByType(require('react-native').Text).props.children).join('');

      expect(words('urbania-age')).toBe('I confirm that I am 18 or older.');
      expect(words('urbania-account-terms')).toContain(
        'I accept the account Terms of Service and Privacy Policy.',
      );
    });

    it('shows the agreement wording from the website', async () => {
      const { getByTestId } = await toRequest();
      const text = []
        .concat(
          getByTestId('urbania-agree').findByType(require('react-native').Text).props.children,
        )
        .join('');

      expect(text).toContain(
        'I understand this is a provisional request, not a confirmed booking.',
      );
      expect(text).toContain(
        'No payment is completed by viewing a QR code or submitting a reference.',
      );
    });

    it('needs an email before it can be sent', async () => {
      mockProfile = { account: { name: 'Rishab', phone: '9876543210' } };
      const view = await toRequest();

      agreeAll(view);
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });

      expect(view.getByText('Please enter your email address')).toBeTruthy();
      expect(submitRequest).not.toHaveBeenCalled();
    });

    it('uses the dark app colours for the new cards in dark mode', async () => {
      useStore.setState({ isDarkMode: true });
      const { getByTestId } = await toRequest();

      expect(StyleSheet.flatten(getByTestId('urbania-route').props.style).backgroundColor).toBe(
        '#27104B',
      );
      expect(StyleSheet.flatten(getByTestId('urbania-fare').props.style).backgroundColor).toBe(
        '#220D42',
      );
      useStore.setState({ isDarkMode: false });
    });
  });

  describe('trip type tabs', () => {
    it('shows a sliding pill and an icon for each tab', () => {
      const { getByTestId, getAllByText } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      expect(getByTestId('urbania-tab-thumb')).toBeTruthy();
      // Each label is drawn twice: a muted one, and a white one that fades in over it
      expect(getAllByText('Local NCR')).toHaveLength(2);
      expect(getAllByText('Outstation')).toHaveLength(2);
    });

    it('starts the pill on the first tab and moves it to the second when it is chosen', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const x = () =>
        StyleSheet.flatten(getByTestId('urbania-tab-thumb').props.style).transform[0].translateX;

      expect(x()).toBe(0);
      fireEvent.press(getByTestId('urbania-type-outstation'));
      expect(getByTestId('urbania-type-outstation').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('urbania-type-local').props.accessibilityState.selected).toBe(false);
    });

    it('lets the pill slide back to the first tab', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-type-outstation'));
      fireEvent.press(getByTestId('urbania-type-local'));
      expect(getByTestId('urbania-type-local').props.accessibilityState.selected).toBe(true);
    });

    it('is marked as tabs for screen readers', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(getByTestId('urbania-type-local').props.accessibilityRole).toBe('tab');
    });
  });

  describe('step buttons', () => {
    const goToLast = async view => {
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-next'));
      });
    };

    it('keeps Back and Next side by side on the first two steps', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(
        StyleSheet.flatten(view.getByTestId('urbania-buttons').props.style).flexDirection,
      ).toBe('row');

      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      expect(
        StyleSheet.flatten(view.getByTestId('urbania-buttons').props.style).flexDirection,
      ).toBe('row');
    });

    it('stacks the long Send provisional request button above Back on the last step', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await goToLast(view);
      agreeAll(view);

      const row = StyleSheet.flatten(view.getByTestId('urbania-buttons').props.style);
      expect(row.flexDirection).toBe('column-reverse');
      expect(row.alignItems).toBe('stretch');
      expect(view.getByText('Send provisional request')).toBeTruthy();
      expect(view.getByTestId('urbania-prev')).toBeTruthy();
    });

    it('lets the Send label shrink to one line instead of being cut off', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await goToLast(view);
      agreeAll(view);

      const label = view.getByText('Send provisional request');
      expect(label.props.numberOfLines).toBe(1);
      expect(label.props.adjustsFontSizeToFit).toBe(true);
    });

    it('still goes back from the last step', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await goToLast(view);

      fireEvent.press(view.getByTestId('urbania-prev'));
      expect(stepCount(view.getByTestId)).toBe('2 of 3');
    });
  });

  describe('Google place suggestions', () => {
    const CORBETT = {
      id: 'p1',
      title: 'Jim Corbett National Park',
      subtitle: 'Uttarakhand, India',
      description: 'Jim Corbett National Park, Uttarakhand, India',
    };
    const MANALI = {
      id: 'p2',
      title: 'Manali',
      subtitle: 'Himachal Pradesh',
      description: 'Manali, Himachal Pradesh, India',
    };

    beforeEach(() => {
      jest.useFakeTimers({
        now: FAKE_TODAY.now,
        doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'],
      });
      fetchPlaceSuggestions.mockReset();
      fetchPlaceSuggestions.mockResolvedValue([CORBETT, MANALI]);
    });
    afterEach(() => jest.useRealTimers());

    const type = async (view, id, text) => {
      fireEvent(view.getByTestId(id), 'focus');
      fireEvent.changeText(view.getByTestId(id), text);
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
    };

    it("shows Google's places under the destination box while it is typed in", async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      expect(view.queryByTestId('urbania-destination-suggestions')).toBeNull();

      await type(view, 'urbania-destination', 'Corbett');

      expect(view.getByTestId('urbania-destination-suggestions')).toBeTruthy();
      expect(view.getByText('Jim Corbett National Park')).toBeTruthy();
      expect(view.getByText('Uttarakhand, India')).toBeTruthy();
      expect(view.getByText('Manali')).toBeTruthy();
    });

    it('does the same under the pickup box', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      await type(view, 'urbania-pickup', 'Gurugram');

      expect(view.getByTestId('urbania-pickup-suggestions')).toBeTruthy();
      expect(view.queryByTestId('urbania-destination-suggestions')).toBeNull();
    });

    it('fills the box with the full place when one is tapped, and closes the list', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await type(view, 'urbania-destination', 'Corbett');

      fireEvent.press(view.getByTestId('urbania-destination-suggestions-item-0'));

      expect(view.getByTestId('urbania-destination').props.value).toBe(CORBETT.description);
      expect(view.queryByTestId('urbania-destination-suggestions')).toBeNull();
    });

    it('does not search again for the place that was just picked', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await type(view, 'urbania-pickup', 'Delhi');
      const calls = fetchPlaceSuggestions.mock.calls.length;

      fireEvent.press(view.getByTestId('urbania-pickup-suggestions-item-1'));
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      expect(fetchPlaceSuggestions.mock.calls.length).toBe(calls);
      expect(view.getByTestId('urbania-pickup').props.value).toBe(MANALI.description);
    });

    it('clears the "needs fixing" message once a place is picked', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId('urbania-next'));
      expect(view.getByText('Please enter where you want to go')).toBeTruthy();

      await type(view, 'urbania-destination', 'Corbett');
      fireEvent.press(view.getByTestId('urbania-destination-suggestions-item-0'));
      expect(view.queryByText('Please enter where you want to go')).toBeNull();
    });

    it('hides the list when the box is left', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await type(view, 'urbania-destination', 'Corbett');

      fireEvent(view.getByTestId('urbania-destination'), 'blur');
      expect(view.queryByTestId('urbania-destination-suggestions')).toBeNull();
    });

    it('shows no list when Google has nothing, so the box is just a normal text box', async () => {
      fetchPlaceSuggestions.mockResolvedValue([]);
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      await type(view, 'urbania-destination', 'zzzzzz');
      expect(view.queryByTestId('urbania-destination-suggestions')).toBeNull();
      expect(view.getByTestId('urbania-destination').props.value).toBe('zzzzzz');
    });

    it('still lets a place be typed by hand and moves on with it', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'My own street');
      fireEvent.changeText(view.getByTestId('urbania-destination'), 'My own place');
      fillDates(view, '050320990900');
      fireEvent.press(view.getByTestId('urbania-next'));

      expect(stepCount(view.getByTestId)).toBe('2 of 3');
    });

    it('shows places under a stop too, and fills the stop when one is tapped', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId('urbania-add-stop'));

      await type(view, 'urbania-stop-0', 'Jaipur');
      expect(view.getByTestId('urbania-stop-0-suggestions')).toBeTruthy();
      expect(view.getByText('Jim Corbett National Park')).toBeTruthy();

      fireEvent.press(view.getByTestId('urbania-stop-0-suggestions-item-1'));
      expect(view.getByTestId('urbania-stop-0').props.value).toBe(MANALI.description);
      expect(view.queryByTestId('urbania-stop-0-suggestions')).toBeNull();
    });

    it('gives every stop its own list, and only the one being typed in shows it', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId('urbania-add-stop'));
      fireEvent.press(view.getByTestId('urbania-add-stop'));

      await type(view, 'urbania-stop-1', 'Udaipur');
      expect(view.getByTestId('urbania-stop-1-suggestions')).toBeTruthy();
      expect(view.queryByTestId('urbania-stop-0-suggestions')).toBeNull();

      fireEvent(view.getByTestId('urbania-stop-1'), 'blur');
      await type(view, 'urbania-stop-0', 'Jaipur');
      expect(view.getByTestId('urbania-stop-0-suggestions')).toBeTruthy();
      expect(view.queryByTestId('urbania-stop-1-suggestions')).toBeNull();
    });

    it('keeps a picked stop in the route and the email', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.press(view.getByTestId('urbania-add-stop'));
      await type(view, 'urbania-stop-0', 'Jaipur');
      fireEvent.press(view.getByTestId('urbania-stop-0-suggestions-item-0'));

      expect(view.getByTestId('urbania-stop-0').props.value).toBe(CORBETT.description);
      fireEvent.press(view.getByTestId('urbania-remove-stop-0'));
      expect(view.queryByTestId('urbania-stop-0')).toBeNull();
    });

    it('sets the drop-off to the pickup by default, and keeps it in step while the pickup changes', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Gurugram');
      expect(view.getByTestId('urbania-dropoff').props.value).toBe('Gurugram');
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Gurugram Sector 18');
      expect(view.getByTestId('urbania-dropoff').props.value).toBe('Gurugram Sector 18');
    });

    it('stops following the pickup once the drop-off is changed by hand', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Gurugram');
      fireEvent.changeText(view.getByTestId('urbania-dropoff'), 'Delhi airport');
      fireEvent.changeText(view.getByTestId('urbania-pickup'), 'Noida');

      expect(view.getByTestId('urbania-dropoff').props.value).toBe('Delhi airport');
    });

    it('fills the drop-off too when the pickup is picked from the suggestions', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await type(view, 'urbania-pickup', 'Gurugram');
      fireEvent.press(view.getByTestId('urbania-pickup-suggestions-item-0'));

      expect(view.getByTestId('urbania-dropoff').props.value).toBe(CORBETT.description);
      expect(view.getByTestId('urbania-dropoff-chosen')).toBeTruthy();
    });

    it('offers places for the drop-off box too, and says when one was picked', async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await type(view, 'urbania-dropoff', 'Gurugram');

      expect(fetchPlaceSuggestions).toHaveBeenCalledTimes(1);
      fireEvent.press(view.getByTestId('urbania-dropoff-suggestions-item-0'));
      expect(view.getByTestId('urbania-dropoff').props.value).toBe(CORBETT.description);
      expect(view.getByTestId('urbania-dropoff-chosen')).toBeTruthy();

      // Editing the text takes the note away: it is no longer the picked place
      fireEvent.changeText(view.getByTestId('urbania-dropoff'), 'Somewhere else');
      expect(view.queryByTestId('urbania-dropoff-chosen')).toBeNull();
    });

    it('uses the dark app colours for the list in dark mode', async () => {
      useStore.setState({ isDarkMode: true });
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      await type(view, 'urbania-destination', 'Corbett');

      expect(
        StyleSheet.flatten(view.getByTestId('urbania-destination-suggestions').props.style)
          .backgroundColor,
      ).toBe('#220D42');
      useStore.setState({ isDarkMode: false });
    });
  });

  describe('FAQs', () => {
    it('shows the first answer open and the others closed', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      expect(getByTestId('urbania-faq-answer-0')).toBeTruthy();
      expect(queryByTestId('urbania-faq-answer-1')).toBeNull();
    });

    it('opens one answer at a time, and closes it again', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      fireEvent.press(getByTestId('urbania-faq-3'));
      expect(queryByTestId('urbania-faq-answer-0')).toBeNull();
      expect(getByTestId('urbania-faq-answer-3')).toBeTruthy();

      fireEvent.press(getByTestId('urbania-faq-3'));
      expect(queryByTestId('urbania-faq-answer-3')).toBeNull();
    });
  });

  describe('step 1: trip', () => {
    it('starts on "Plan your trip" as step 1 of 3', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('TRIP ESTIMATE & REQUEST')).toBeTruthy();
      expect(getByTestId('urbania-step-title').props.children).toBe('Plan your trip');
      expect(stepCount(getByTestId)).toBe('1 of 3');
      expect(getByText('Next: passengers and pets')).toBeTruthy();
    });

    it('explains the time zone, the base and the limits under the title, like the website', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const note = [].concat(getByTestId('urbania-card-note').props.children).join('');

      expect(note).toContain('Time zone: Asia/Kolkata.');
      expect(note).toContain('Your route is only an estimate; availability is checked again');
      expect(note).toContain('Base: Udyog Vihar Phase 5, Gurugram, Haryana, India');
      expect(note).toContain('maximum 3 started day(s) / 2 night(s)');
    });

    it('marks the exact times as India time', () => {
      const { getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('Exact pickup time (IST)')).toBeTruthy();
      expect(getByText('Exact return time (IST)')).toBeTruthy();
    });

    it('switches between Local NCR and Outstation', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByTestId('urbania-type-local').props.accessibilityState.selected).toBe(true);
      fireEvent.press(getByTestId('urbania-type-outstation'));
      expect(getByTestId('urbania-type-outstation').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('urbania-type-local').props.accessibilityState.selected).toBe(false);
    });

    it('shows what is missing and stays on the step', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-next'));

      expect(getByText('Please enter the pickup location')).toBeTruthy();
      expect(getByText('Please enter where you want to go')).toBeTruthy();
      expect(getByText('Select the pickup date on the calendar')).toBeTruthy();
      expect(stepCount(getByTestId)).toBe('1 of 3');
    });

    it('clears an error as soon as that field is edited', () => {
      const { getByTestId, getByText, queryByText } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );
      fireEvent.press(getByTestId('urbania-next'));
      expect(getByText('Please enter the pickup location')).toBeTruthy();

      fireEvent.changeText(getByTestId('urbania-pickup'), 'Delhi');
      expect(queryByText('Please enter the pickup location')).toBeNull();
    });

    it('needs a return date for an outstation trip', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-type-outstation'));
      fireEvent.press(view.getByTestId('urbania-next'));

      expect(
        view.getByText('Select the return date on the calendar for an outstation trip'),
      ).toBeTruthy();
    });

    it('adds and removes stops', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      fireEvent.press(getByTestId('urbania-add-stop'));
      fireEvent.press(getByTestId('urbania-add-stop'));
      expect(getByTestId('urbania-stop-0')).toBeTruthy();
      expect(getByTestId('urbania-stop-1')).toBeTruthy();

      fireEvent.changeText(getByTestId('urbania-stop-0'), 'Jaipur');
      fireEvent.changeText(getByTestId('urbania-stop-1'), 'Udaipur');
      fireEvent.press(getByTestId('urbania-remove-stop-0'));

      expect(queryByTestId('urbania-stop-1')).toBeNull();
      expect(getByTestId('urbania-stop-0').props.value).toBe('Udaipur');
    });

    it('stops offering more stops after five', () => {
      const { getByTestId, queryByTestId } = render(
        <UrbaniaBookingScreen navigation={navigation} />,
      );

      for (let i = 0; i < 5; i += 1) {
        fireEvent.press(getByTestId('urbania-add-stop'));
      }
      expect(queryByTestId('urbania-add-stop')).toBeNull();
    });

    it('moves to the group step when the trip is complete', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));

      expect(stepCount(view.getByTestId)).toBe('2 of 3');
      expect(view.getByText('2 of 3')).toBeTruthy();
    });
  });

  describe('step 2: group', () => {
    const toGroup = () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      return view;
    };

    it('starts with 2 passengers and 1 pet and changes them within the limits', () => {
      const { getByTestId } = toGroup();

      expect(getByTestId('passengers-value').props.children).toBe(2);
      expect(getByTestId('pets-value').props.children).toBe(1);

      fireEvent.press(getByTestId('passengers-plus'));
      expect(getByTestId('passengers-value').props.children).toBe(3);
      fireEvent.press(getByTestId('passengers-minus'));
      fireEvent.press(getByTestId('passengers-minus'));
      fireEvent.press(getByTestId('passengers-minus'));
      expect(getByTestId('passengers-value').props.children).toBe(1);

      // Travelling with no pets is allowed
      fireEvent.press(getByTestId('pets-minus'));
      fireEvent.press(getByTestId('pets-minus'));
      expect(getByTestId('pets-value').props.children).toBe(0);
    });

    it('caps the passengers at the 12 seats', () => {
      const { getByTestId } = toGroup();
      for (let i = 0; i < 20; i += 1) {
        fireEvent.press(getByTestId('passengers-plus'));
      }
      expect(getByTestId('passengers-value').props.children).toBe(12);
    });

    it('goes back to the trip step with the details still there', () => {
      const { getByTestId } = toGroup();

      fireEvent.press(getByTestId('urbania-prev'));
      expect(stepCount(getByTestId)).toBe('1 of 3');
      expect(getByTestId('urbania-pickup').props.value).toBe('Delhi');
      expect(getByTestId('urbania-destination').props.value).toBe('Goa');
    });

    it('lets a finished step be tapped to go back to it', () => {
      const { getByTestId } = toGroup();
      fireEvent.press(getByTestId('urbania-step-1'));
      expect(stepCount(getByTestId)).toBe('1 of 3');
    });

    it('moves to the request step once the route and fare have been worked out', async () => {
      const { getByTestId } = toGroup();
      await act(async () => {
        fireEvent.press(getByTestId('urbania-next'));
      });
      expect(stepCount(getByTestId)).toBe('3 of 3');
    });
  });

  describe('step 3: request', () => {
    const toRequest = async () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-next'));
      });
      return view;
    };

    it('fills in the contact details from the account', async () => {
      const { getByTestId } = await toRequest();

      expect(getByTestId('urbania-name').props.value).toBe('Rishab');
      expect(getByTestId('urbania-phone').props.value).toBe('9876543210');
      expect(getByTestId('urbania-email').props.value).toBe('r@example.com');
    });

    it('does not send when the name or phone is missing', async () => {
      mockProfile = { account: {} };
      const view = await toRequest();

      agreeAll(view);
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });

      expect(view.getByText('Please enter your name')).toBeTruthy();
      expect(view.getByText('Please enter a valid 10-digit phone number')).toBeTruthy();
      expect(view.getByText('Please enter your email address')).toBeTruthy();
      expect(submitRequest).not.toHaveBeenCalled();
    });

    const send = async view => {
      agreeAll(view);
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });
    };

    it('sends the request to the API with the contact details, the consent and a key', async () => {
      const view = await toRequest();
      await send(view);

      expect(submitRequest).toHaveBeenCalledTimes(1);
      const body = submitRequest.mock.calls[0][0];
      expect(body).toMatchObject({
        pickupAddress: 'Delhi',
        destinationAddress: 'Goa',
        pickupAt: '2099-03-05T09:00:00+05:30',
        customerName: 'Rishab',
        customerPhone: '9876543210',
        customerEmail: 'r@example.com',
        termsAccepted: true,
        accountAgeAffirmed: true,
        accountTermsAccepted: true,
        connectToAccount: false,
      });
      expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('checks the window again before sending, and does not send when it is taken', async () => {
      const view = await toRequest();
      fetchAvailability.mockClear();
      fetchAvailability.mockResolvedValue({ available: false, message: 'Just booked' });
      await send(view);

      expect(fetchAvailability).toHaveBeenCalledTimes(1);
      expect(submitRequest).not.toHaveBeenCalled();
      expect(view.getByText('Just booked')).toBeTruthy();
    });

    it('shows the reference, says it is only provisional, and keeps the token in the secure store', async () => {
      const view = await toRequest();
      await send(view);

      expect(view.getByTestId('urbania-sent')).toBeTruthy();
      expect(view.getByTestId('urbania-sent-reference').props.children.join('')).toBe(
        'Reference URB-1001',
      );
      expect(view.getByText(/provisional request, not a confirmed booking/)).toBeTruthy();
      expect(await loadStatusToken('URB-1001')).toBe('secret-token');
      // The token is never shown on the screen
      expect(view.queryByText(/secret-token/)).toBeNull();
    });

    it('sends a return time even for a local trip with no return day', async () => {
      const view = await toRequest();
      await send(view);

      expect(submitRequest.mock.calls[0][0].expectedReturnAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\+05:30$/,
      );
    });

    it('keeps the booking in the history on this phone, without the token', async () => {
      const { loadBookings } = require('../../../services/urbania/bookingHistory');
      const { storage } = require('../../../services/storage/storage');
      storage.remove('URBANIA_BOOKINGS');
      const view = await toRequest();
      await send(view);

      const saved = loadBookings()[0];
      expect(saved).toMatchObject({
        reference: 'URB-1001',
        status: 'pending_review',
        pickupLabel: '5 Mar 2099, 9:00 am',
      });
      expect(saved.places.map(place => place.kind)).toEqual(['pickup', 'destination', 'drop']);
      expect(saved.fare.total).toBe(7750);
      expect(JSON.stringify(saved)).not.toContain('secret-token');
    });

    it('shows the booking status card like the website after sending', async () => {
      const view = await toRequest();
      await send(view);

      expect(view.getByText('REQUEST RECEIVED')).toBeTruthy();
      expect(view.getByText('Booking status')).toBeTruthy();
      expect(view.getByTestId('urbania-status').props.children).toBe('pending_review');
      expect(view.getByTestId('urbania-status-when').props.children).toBe('5 Mar 2099, 9:00 am');
      expect(view.getByText('Open pickup map', { exact: false })).toBeTruthy();
      expect(view.getByText('Open destination map', { exact: false })).toBeTruthy();
      expect(view.getByText('Open drop-off map', { exact: false })).toBeTruthy();
      expect(view.getByTestId('urbania-status-fare')).toBeTruthy();
      expect(
        view.getByText('This request is still under review. No payment action is available yet.'),
      ).toBeTruthy();
      expect(
        view.getByText('Your request needs an operator review before an advance can be requested.'),
      ).toBeTruthy();
    });

    it('keeps the Add a stop gloss faint on the dark theme', () => {
      useStore.setState({ isDarkMode: true });
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      const gloss = StyleSheet.flatten(view.getByTestId('urbania-add-stop-gloss').props.style);
      expect(gloss.backgroundColor).toBe('rgba(196,181,253,0.07)');
      useStore.setState({ isDarkMode: false });
    });

    it('opens a place in Google Maps from the status card', async () => {
      const open = jest.spyOn(Linking, 'openURL').mockResolvedValue();
      const view = await toRequest();
      await send(view);

      fireEvent.press(view.getByTestId('urbania-map-open-pickup-map'));
      expect(open).toHaveBeenCalledWith('https://www.google.com/maps/search/?api=1&query=Delhi');
      open.mockRestore();
    });

    it('refreshes the status with the private token, and shows the new status', async () => {
      fetchStatus.mockResolvedValueOnce({ request: { status: 'quoted' }, message: 'Quote ready.' });
      const view = await toRequest();
      await send(view);

      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-refresh-status'));
      });

      expect(fetchStatus).toHaveBeenCalledWith('secret-token');
      expect(view.getByTestId('urbania-status').props.children).toBe('quoted');
      expect(view.getByText('Quote ready.')).toBeTruthy();
      expect(view.queryByText(/secret-token/)).toBeNull();
    });

    it('says so when the status cannot be refreshed', async () => {
      fetchStatus.mockRejectedValueOnce(new Error('Network Error'));
      const view = await toRequest();
      await send(view);

      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-refresh-status'));
      });

      expect(view.getByText('We could not refresh the status. Please try again.')).toBeTruthy();
      expect(view.getByTestId('urbania-status').props.children).toBe('pending_review');
    });

    it('goes back from the confirmation with Done', async () => {
      const view = await toRequest();
      await send(view);

      fireEvent.press(view.getByTestId('urbania-sent-done'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it("shows the server's reason when sending fails, and keeps the details", async () => {
      submitRequest.mockRejectedValueOnce({ response: { data: { message: 'Phone looks wrong' } } });
      const view = await toRequest();
      await send(view);

      expect(view.getByText('Phone looks wrong')).toBeTruthy();
      expect(view.queryByTestId('urbania-sent')).toBeNull();
      expect(view.getByTestId('urbania-name').props.value).toBe('Rishab');
    });

    it('retries a lost connection with the same key, and a rejected request with a new one', async () => {
      submitRequest.mockRejectedValueOnce(new Error('Network Error'));
      const view = await toRequest();
      await send(view);
      const firstKey = submitRequest.mock.calls[0][0].idempotencyKey;

      submitRequest.mockRejectedValueOnce({ response: { status: 422, data: { message: 'No' } } });
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });
      expect(submitRequest.mock.calls[1][0].idempotencyKey).toBe(firstKey);

      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });
      expect(submitRequest.mock.calls[2][0].idempotencyKey).not.toBe(firstKey);
    });

    it('does not send twice from a double tap', async () => {
      let finish;
      submitRequest.mockImplementationOnce(() => new Promise(resolve => (finish = resolve)));
      const view = await toRequest();
      agreeAll(view);
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });
      await act(async () => {
        fireEvent.press(view.getByTestId('urbania-send'));
      });

      expect(submitRequest).toHaveBeenCalledTimes(1);
      expect(view.getByText('Sending request...')).toBeTruthy();
      await act(async () => {
        finish({ reference: 'URB-7', statusToken: 't' });
      });
    });
  });
});
