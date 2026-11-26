import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HomeScreen } from '../index';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  dispatch: jest.fn(),
  goBack: jest.fn(),
};

// Mock custom hooks
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({
    data: { name: 'Luna Parent' },
  }),
  useSavePlace: () => ({ saved: false, toggle: () => true }),
}));

jest.mock('../../../hooks/useDiscovery', () => ({
  useHomeData: () => ({
    data: {
      top_categories: [{ category: 'Cafe', listing_count: 5 }],
      top_cities: [
        { city: 'New Delhi', state: 'Delhi', listing_count: 53, hero_image_url: null },
        { city: 'Rishikesh', state: 'Uttarakhand', listing_count: 48, hero_image_url: null },
      ],
      stories: [
        {
          id: '1',
          title: 'A Goa Trip with Milo',
          excerpt: 'Golden sands and gentle waves.',
          cover_image_url: 'https://example.com/goa.jpg',
        },
      ],
      routes: [
        {
          id: 'route-1',
          title: 'Delhi to Bhimtal',
          total_distance_km: 295,
          est_drive_hours: 7.5,
          stop_count: 3,
          origin_city: 'Delhi',
          destination_city: 'Bhimtal',
          cover_image_url: 'https://example.com/bhimtal.jpg',
        },
      ],
      recent: null,
    },
    refetch: jest.fn(),
    isRefetching: false,
  }),
  resolveImageUrl: url => url,
}));

const renderWithNavigation = ui => {
  return render(<NavigationContainer>{ui}</NavigationContainer>);
};

describe('HomeScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens with the Urbania road trip banner as the main card under the header', () => {
    const { getByText, getByTestId, queryByText } = renderWithNavigation(
      <HomeScreen navigation={mockNavigation} />,
    );

    expect(getByTestId('urbania-banner')).toBeTruthy();
    expect(getByText('NEWLY LAUNCHED')).toBeTruthy();
    expect(getByText('Road trips are better together')).toBeTruthy();
    expect(getByText('Pet-friendly Urbania from Gurugram')).toBeTruthy();
    expect(getByText('10% off for pet parents')).toBeTruthy();
    // The old "Explore nearby" hero card is switched off
    expect(queryByText('MADE FOR PET PARENTS')).toBeNull();
    expect(queryByText('Explore nearby')).toBeNull();
  });

  it('shows the banner before the category section', () => {
    const { toJSON } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    const texts = [];
    const walk = node => {
      if (typeof node === 'string') {
        texts.push(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && node.children) {
        node.children.forEach(walk);
      }
    };
    walk(toJSON());
    const banner = texts.indexOf('Road trips are better together');
    const categories = texts.indexOf('Explore by category');
    expect(banner).toBeGreaterThan(-1);
    expect(categories).toBeGreaterThan(-1);
    expect(banner).toBeLessThan(categories);
  });

  it('opens the booking screen from the banner Book Now button', () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    fireEvent.press(getByTestId('urbania-book'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('UrbaniaBookingScreen');
  });

  it('shows the popular destinations from the API above the quick actions', () => {
    const { getByText, getByTestId, toJSON } = renderWithNavigation(
      <HomeScreen navigation={mockNavigation} />,
    );

    expect(getByText('Popular Indian Destinations for Pet Travel')).toBeTruthy();
    expect(getByTestId('destination-0-count').props.children).toBe('53 places');

    const texts = [];
    const walk = node => {
      if (typeof node === 'string') {
        texts.push(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && node.children) {
        node.children.forEach(walk);
      }
    };
    walk(toJSON());
    const destinations = texts.indexOf('Popular Indian Destinations for Pet Travel');
    const quick = texts.indexOf('Quick actions');
    expect(destinations).toBeGreaterThan(-1);
    expect(quick).toBeGreaterThan(-1);
    expect(destinations).toBeLessThan(quick);
  });

  it('opens the city page when a destination is tapped', () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    fireEvent.press(getByTestId('destination-1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CityDetail', {
      city: 'Rishikesh',
      state: 'Uttarakhand',
    });
  });

  it('shows the water and nature section below the destinations and above the quick actions', () => {
    const { getByText, toJSON } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    expect(getByText('Water, nature and outdoor pet access')).toBeTruthy();
    const texts = [];
    const walk = node => {
      if (typeof node === 'string') {
        texts.push(node);
      } else if (Array.isArray(node)) {
        node.forEach(walk);
      } else if (node && node.children) {
        node.children.forEach(walk);
      }
    };
    walk(toJSON());
    const destinations = texts.indexOf('Popular Indian Destinations for Pet Travel');
    const nature = texts.indexOf('Water, nature and outdoor pet access');
    const quick = texts.indexOf('Quick actions');
    expect(destinations).toBeGreaterThan(-1);
    expect(nature).toBeGreaterThan(destinations);
    expect(quick).toBeGreaterThan(nature);
  });

  it('opens Search on the Nature & Water filter from the Explore button', () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    fireEvent.press(getByTestId('nature-explore'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SearchScreen', {
      apiCategory: 'Nature & Water',
      category: 'Paws in the Wild',
    });
  });

  it('renders categories from home data', () => {
    const { getByText } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    expect(getByText('Cafe')).toBeTruthy();
  });

  it('renders View all button and navigates to TravelStoryScreen on press', () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    const viewAllBtn = getByTestId('view-all-stories-btn');
    expect(viewAllBtn).toBeTruthy();

    fireEvent.press(viewAllBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TravelStoryScreen');
  });

  it('renders View all in Curated road trips and navigates to RoadTripRoutesScreen on press', () => {
    const { getByTestId } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);

    const viewAllRoutesBtn = getByTestId('view-all-road-trips-btn');
    expect(viewAllRoutesBtn).toBeTruthy();

    fireEvent.press(viewAllRoutesBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('RoadTripRoutesScreen');
  });

  describe('smooth scrolling', () => {
    it('keeps the cards free of 3D tilt (perspective / rotateX), which is costly while scrolling', () => {
      const { UNSAFE_getAllByType } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);
      const transforms = UNSAFE_getAllByType(Animated.View)
        .map(view => StyleSheet.flatten(view.props.style)?.transform)
        .filter(Array.isArray)
        .flat();
      expect(transforms.some(t => t && 'perspective' in t)).toBe(false);
      expect(transforms.some(t => t && 'rotateX' in t)).toBe(false);
    });

    it('caches the moving background shapes as one layer each, so scrolling does not redraw them', () => {
      const { UNSAFE_getAllByType } = renderWithNavigation(<HomeScreen navigation={mockNavigation} />);
      const cached = UNSAFE_getAllByType(Animated.View).filter(
        view => view.props.renderToHardwareTextureAndroid === true,
      );
      // five glow shapes and two paw watermarks
      expect(cached.length).toBeGreaterThanOrEqual(7);
    });

    it('runs the looping call-to-action motion only while Home is on screen', () => {
      const stops = [];
      const loopSpy = jest.spyOn(Animated, 'loop').mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(() => stops.push('stop')),
      }));
      const handlers = {};
      const navigation = {
        ...mockNavigation,
        addListener: jest.fn((event, handler) => {
          handlers[event] = handler;
          return jest.fn();
        }),
      };
      renderWithNavigation(<HomeScreen navigation={navigation} />);
      const startedWhileFocused = loopSpy.mock.calls.length;
      expect(startedWhileFocused).toBeGreaterThan(0);

      // Other parts of the screen have their own loops, so count only what changes: another tab is
      // opened and Home's own two loops (the nudge and the wiggle) stop
      const stoppedBefore = stops.length;
      act(() => handlers.blur());
      expect(stops.length - stoppedBefore).toBeGreaterThanOrEqual(2);

      // Back on Home: they start again
      act(() => handlers.focus());
      expect(loopSpy.mock.calls.length - startedWhileFocused).toBeGreaterThanOrEqual(2);
      loopSpy.mockRestore();
    });
  });
});
