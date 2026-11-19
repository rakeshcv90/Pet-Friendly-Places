import React from 'react';
import { Alert, Linking } from 'react-native';
import { StyleSheet } from 'react-native';
import { s } from 'react-native-size-matters';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UrbaniaBookingScreen } from '../UrbaniaBookingScreen';
import { BOOKING_EMAIL } from '../urbaniaBooking';
import { theme } from '../../../theme';

let mockProfile = { account: { name: 'Rishab', phone: '9876543210', email: 'r@example.com' } };
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: mockProfile }),
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

const fillTrip = ({ getByTestId }) => {
  fireEvent.changeText(getByTestId('urbania-pickup'), 'Delhi');
  fireEvent.changeText(getByTestId('urbania-destination'), 'Goa');
  fireEvent.changeText(getByTestId('urbania-pickup-at'), '050320990900');
};

describe('UrbaniaBookingScreen', () => {
  let open;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfile = { account: { name: 'Rishab', phone: '9876543210', email: 'r@example.com' } };
    open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => open.mockRestore());

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

    it('shows all five photos in the gallery with the first one chosen', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(theme.images.urbaniaGallery).toHaveLength(5);
      for (let i = 0; i < 5; i += 1) {
        expect(getByTestId(`urbania-photo-${i}`)).toBeTruthy();
      }
      expect(getByTestId('urbania-photo-0').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('urbania-photo-1').props.accessibilityState.selected).toBe(false);
    });

    it('puts the chosen photo in the hero', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      fireEvent.press(getByTestId('urbania-photo-3'));

      expect(getByTestId('urbania-hero-photo').props.source).toBe(theme.images.urbaniaGallery[3]);
      expect(getByTestId('urbania-photo-3').props.accessibilityState.selected).toBe(true);
      expect(getByTestId('urbania-photo-0').props.accessibilityState.selected).toBe(false);
    });

    it('describes each photo for screen readers', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByTestId('urbania-photo-0').props.accessibilityLabel).toMatch(/Rubicon sticker/);
      expect(getByTestId('urbania-photo-2').props.accessibilityLabel).toMatch(/Inside the Urbania/);
      fireEvent.press(getByTestId('urbania-photo-2'));
      expect(getByTestId('urbania-hero-photo').props.accessibilityLabel).toMatch(
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

    it('puts a solid green square with a white icon on each of the four facts', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      for (let i = 0; i < 4; i += 1) {
        const icon = StyleSheet.flatten(getByTestId(`urbania-feature-icon-${i}`).props.style);
        expect(icon.backgroundColor).toBe('#10B981');
      }
    });

    it('shows the gallery between the fact cards and the request card', () => {
      const { toJSON } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const order = [];
      const walk = node => {
        if (!node) {
          return;
        }
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        const id = node.props && node.props.testID;
        if (id === 'urbania-hero' || id === 'urbania-gallery' || id === 'urbania-feature-icon-0') {
          order.push(id);
        }
        if (node.children) {
          node.children.forEach(child => typeof child !== 'string' && walk(child));
        }
      };
      walk(toJSON());
      expect(order).toEqual(['urbania-hero', 'urbania-feature-icon-0', 'urbania-gallery']);
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

    it('floats the back button over the photo and goes back when pressed', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      const back = StyleSheet.flatten(getByTestId('urbania-back-btn').props.style);

      expect(back.position).toBe('absolute');
      fireEvent.press(getByTestId('urbania-back-btn'));
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    });

    it('turns the back button into a light one once the page scrolls past the photo', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      const before = StyleSheet.flatten(getByTestId('urbania-back-btn').props.style);
      expect(before.backgroundColor).toBe('rgba(20,8,40,0.4)');

      fireEvent.scroll(getByTestId('urbania-scroll'), {
        nativeEvent: { contentOffset: { y: 900 } },
      });
      const after = StyleSheet.flatten(getByTestId('urbania-back-btn').props.style);
      expect(after.backgroundColor).toBe('#FFFFFF');

      fireEvent.scroll(getByTestId('urbania-scroll'), { nativeEvent: { contentOffset: { y: 0 } } });
      const back = StyleSheet.flatten(getByTestId('urbania-back-btn').props.style);
      expect(back.backgroundColor).toBe('rgba(20,8,40,0.4)');
    });
  });

  describe('form text', () => {
    it('uses Manrope ExtraBold 12 / 14 with no letter spacing for the labels', () => {
      const { getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      ['Pickup location', 'Destination', 'Drop-off location', 'Itinerary notes'].forEach(label => {
        const style = StyleSheet.flatten(getByText(label).props.style);
        expect(style.fontFamily).toBe('Manrope-ExtraBold');
        expect(style.fontSize).toBe(s(12));
        expect(style.lineHeight).toBe(s(14));
        expect(style.letterSpacing).toBe(0);
      });
    });

    it('colours the placeholder text #3D2D46', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      [
        'urbania-pickup',
        'urbania-destination',
        'urbania-dropoff',
        'urbania-pickup-at',
        'urbania-return-at',
        'urbania-stay',
        'urbania-itinerary',
        'urbania-km',
      ].forEach(id => expect(getByTestId(id).props.placeholderTextColor).toBe('#3D2D46'));
    });

    it('sets typed text and placeholders in Manrope Regular 14 / 20', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);

      ['urbania-pickup', 'urbania-dropoff', 'urbania-stay', 'urbania-km'].forEach(id => {
        const style = StyleSheet.flatten(getByTestId(id).props.style);
        expect(style.fontFamily).toBe('Manrope-Regular');
        expect(style.fontSize).toBe(s(14));
        expect(style.lineHeight).toBe(s(20));
      });
    });

    it('applies the same text style on the group and request steps', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));

      const breeds = StyleSheet.flatten(view.getByTestId('urbania-breeds').props.style);
      expect(breeds.fontFamily).toBe('Manrope-Regular');
      expect(breeds.lineHeight).toBe(s(20));
      expect(view.getByTestId('urbania-breeds').props.placeholderTextColor).toBe('#3D2D46');

      fireEvent.press(view.getByTestId('urbania-next'));
      ['urbania-name', 'urbania-phone', 'urbania-email'].forEach(id =>
        expect(view.getByTestId(id).props.placeholderTextColor).toBe('#3D2D46'),
      );
      expect(StyleSheet.flatten(view.getByText('Your name').props.style).fontFamily).toBe(
        'Manrope-ExtraBold',
      );
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
    it('starts on "Where are you going?" as step 1 of 3', () => {
      const { getByTestId, getByText } = render(<UrbaniaBookingScreen navigation={navigation} />);

      expect(getByText('TRIP ESTIMATE & REQUEST')).toBeTruthy();
      expect(getByTestId('urbania-step-title').props.children).toBe('Where are you going?');
      expect(getByText('1 of 3')).toBeTruthy();
      expect(getByText('Next: passengers and pets')).toBeTruthy();
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
      expect(getByText('Enter the pickup date and time')).toBeTruthy();
      expect(getByTestId('urbania-step-title').props.children).toBe('Where are you going?');
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

    it('adds the separators to the date and time as it is typed', () => {
      const { getByTestId } = render(<UrbaniaBookingScreen navigation={navigation} />);
      fireEvent.changeText(getByTestId('urbania-pickup-at'), '050320990930');
      expect(getByTestId('urbania-pickup-at').props.value).toBe('05/03/2099 09:30');
    });

    it('needs a return date for an outstation trip', () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-type-outstation'));
      fireEvent.press(view.getByTestId('urbania-next'));

      expect(view.getByText('Enter the expected return for an outstation trip')).toBeTruthy();
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

      expect(view.getByTestId('urbania-step-title').props.children).toBe('Who is travelling?');
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
      expect(getByTestId('urbania-step-title').props.children).toBe('Where are you going?');
      expect(getByTestId('urbania-pickup').props.value).toBe('Delhi');
      expect(getByTestId('urbania-destination').props.value).toBe('Goa');
    });

    it('lets a finished step be tapped to go back to it', () => {
      const { getByTestId } = toGroup();
      fireEvent.press(getByTestId('urbania-step-1'));
      expect(getByTestId('urbania-step-title').props.children).toBe('Where are you going?');
    });

    it('moves to the request step', () => {
      const { getByTestId } = toGroup();
      fireEvent.press(getByTestId('urbania-next'));
      expect(getByTestId('urbania-step-title').props.children).toBe('How can we reach you?');
    });
  });

  describe('step 3: request', () => {
    const toRequest = () => {
      const view = render(<UrbaniaBookingScreen navigation={navigation} />);
      fillTrip(view);
      fireEvent.press(view.getByTestId('urbania-next'));
      fireEvent.press(view.getByTestId('urbania-next'));
      return view;
    };

    it('fills in the contact details from the account', () => {
      const { getByTestId } = toRequest();

      expect(getByTestId('urbania-name').props.value).toBe('Rishab');
      expect(getByTestId('urbania-phone').props.value).toBe('9876543210');
      expect(getByTestId('urbania-email').props.value).toBe('r@example.com');
    });

    it('shows the starting price for the trip', () => {
      const { getByTestId, getByText } = toRequest();

      expect(getByTestId('urbania-estimate')).toBeTruthy();
      expect(getByText('From ₹5,850')).toBeTruthy();
    });

    it('does not send when the name or phone is missing', () => {
      mockProfile = { account: {} };
      const view = toRequest();

      fireEvent.press(view.getByTestId('urbania-send'));

      expect(view.getByText('Please enter your name')).toBeTruthy();
      expect(view.getByText('Please enter a valid 10-digit phone number')).toBeTruthy();
      expect(open).not.toHaveBeenCalled();
    });

    it('opens an email to the booking address with every detail filled in', () => {
      const view = toRequest();
      fireEvent.press(view.getByTestId('urbania-send'));

      expect(open).toHaveBeenCalledTimes(1);
      const url = open.mock.calls[0][0];
      expect(url.startsWith(`mailto:${BOOKING_EMAIL}?subject=`)).toBe(true);
      const body = decodeURIComponent(url.split('&body=')[1]);
      expect(body).toContain('Pickup: Delhi');
      expect(body).toContain('Destination: Goa');
      expect(body).toContain('Pickup date and time: 05/03/2099 09:00');
      expect(body).toContain('Passengers: 2');
      expect(body).toContain('Pets: 1');
      expect(body).toContain('Name: Rishab');
      expect(body).toContain('Phone: 9876543210');
    });

    it('tells the user the email address when no email app can be opened', async () => {
      open.mockRejectedValueOnce(new Error('no mail app'));
      const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const view = toRequest();

      fireEvent.press(view.getByTestId('urbania-send'));

      await waitFor(() => expect(alert).toHaveBeenCalled());
      expect(alert.mock.calls[0][1]).toContain(BOOKING_EMAIL);
      alert.mockRestore();
    });
  });
});
