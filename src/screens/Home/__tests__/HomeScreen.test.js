import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
      <HomeScreen navigation={mockNavigation} />
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

  it('renders categories from home data', () => {
    const { getByText } = renderWithNavigation(
      <HomeScreen navigation={mockNavigation} />
    );

    expect(getByText('Cafe')).toBeTruthy();
  });

  it('renders View all button and navigates to TravelStoryScreen on press', () => {
    const { getByTestId } = renderWithNavigation(
      <HomeScreen navigation={mockNavigation} />
    );

    const viewAllBtn = getByTestId('view-all-stories-btn');
    expect(viewAllBtn).toBeTruthy();

    fireEvent.press(viewAllBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('TravelStoryScreen');
  });

  it('renders View all in Curated road trips and navigates to RoadTripRoutesScreen on press', () => {
    const { getByTestId } = renderWithNavigation(
      <HomeScreen navigation={mockNavigation} />
    );

    const viewAllRoutesBtn = getByTestId('view-all-road-trips-btn');
    expect(viewAllRoutesBtn).toBeTruthy();

    fireEvent.press(viewAllRoutesBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('RoadTripRoutesScreen');
  });
});
