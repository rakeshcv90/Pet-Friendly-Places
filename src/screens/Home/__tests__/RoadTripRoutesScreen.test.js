import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoadTripRoutesScreen } from '../RoadTripRoutesScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {},
};

jest.mock('../../../hooks/useDiscovery', () => ({
  useHomeData: () => ({
    data: { routes: [] },
  }),
  useRoadTrips: () => ({
    data: [
      {
        id: 99,
        slug: 'api-delhi-jaipur',
        title: 'Jaipur Heritage Expressway',
        origin_city: 'Delhi',
        destination_city: 'Jaipur',
        total_distance_km: 260,
        est_drive_hours: 4.5,
        stop_count: 3,
        category: 'mountains',
        cover_image_url: 'https://example.com/jaipur.jpg',
      },
    ],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  resolveImageUrl: url => url || '',
}));

describe('RoadTripRoutesScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders top navigation bar with EXPLORE TOGETHER and Road trip routes', () => {
    const { getByText, getByTestId } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('EXPLORE TOGETHER')).toBeTruthy();
    expect(getByText('Road trip routes')).toBeTruthy();
    expect(getByTestId('road-trips-back-btn')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const { getByTestId } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('road-trips-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('renders hero banner Good roads. Better company.', () => {
    const { getByText } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('CURATED PAW BY PAW')).toBeTruthy();
    expect(getByText(/Good roads/)).toBeTruthy();
    expect(getByText(/Verified stops, open spaces/)).toBeTruthy();
  });

  it('renders API routes directly in list', () => {
    const { getByText } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('Delhi → Jaipur')).toBeTruthy();
  });

  it('toggles search drawer and searches routes', () => {
    const { getByTestId, queryByText } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Open search drawer
    fireEvent.press(getByTestId('search-toggle-btn'));
    expect(getByTestId('road-trip-search-input')).toBeTruthy();

    // Type query
    fireEvent.changeText(getByTestId('road-trip-search-input'), 'Jaipur');
    expect(queryByText('Delhi → Jaipur')).toBeTruthy();
  });

  it('toggles favorite on route card', () => {
    const { getByTestId } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    const favBtn = getByTestId('favorite-btn-99');
    fireEvent.press(favBtn);
  });

  it('navigates to RoadTripDetailScreen on Explore press', () => {
    const { getByTestId } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    fireEvent.press(getByTestId('explore-route-btn-99'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'RoadTripDetailScreen',
      expect.objectContaining({
        slug: 'api-delhi-jaipur',
        routeId: '99',
      }),
    );
  });

  it('renders bottom feature card Every stop earns its place.', () => {
    const { getByText } = render(
      <RoadTripRoutesScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('BUILT FOR REAL TRAVEL DAYS')).toBeTruthy();
    expect(getByText('Every stop earns its place.')).toBeTruthy();
    expect(getByText('Breaks')).toBeTruthy();
    expect(getByText('Food')).toBeTruthy();
    expect(getByText('Sleep')).toBeTruthy();
  });
});
