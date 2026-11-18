import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SavedPlacesScreen } from '../SavedPlacesScreen';
import { useSavedPlaces } from '../../../hooks/useUser';

const mockUnsave = jest.fn();
const mockRestore = jest.fn();
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
  useSavedPlaces: jest.fn(),
  useUnsavePlace: () => ({ mutate: (...args) => mockUnsave(...args) }),
  useRestoreSavedPlace: () => ({ mutate: (...args) => mockRestore(...args) }),
}));

jest.mock('../savedPlacesDemo', () => ({ SHOW_DEMO_SAVED_PLACES: false, DEMO_SAVED_PLACES: [] }));

const baseQuery = {
  data: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isRefetching: false,
};

describe('SavedPlacesScreen', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useSavedPlaces.mockReturnValue(baseQuery);
  });

  it('uses the app header with a back badge and goes back', () => {
    const { getByText, getByTestId } = render(<SavedPlacesScreen navigation={navigation} />);

    expect(getByText('Saved Places')).toBeTruthy();
    expect(getByText('YOUR BOOKMARKS')).toBeTruthy();
    fireEvent.press(getByTestId('saved-places-back-btn'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('shows the stat tiles and the empty message when nothing is saved', () => {
    const { getByText } = render(<SavedPlacesScreen navigation={navigation} />);

    expect(getByText('Saved')).toBeTruthy();
    expect(getByText('Verified')).toBeTruthy();
    expect(getByText(/No saved places yet/)).toBeTruthy();
  });

  it('shows a retry hint when loading fails', () => {
    useSavedPlaces.mockReturnValue({ ...baseQuery, isError: true });
    const { getByText } = render(<SavedPlacesScreen navigation={navigation} />);
    expect(getByText(/Could not load your saved places/)).toBeTruthy();
  });

  const PLACES = [
    { id: 1, slug: 'cafe-one', name: 'Paws Cafe', category: 'Cafes', city: 'Delhi', main_image_url: '/a' },
    { id: 2, slug: 'stay-two', name: 'Hill Stay', category: 'Stays', city: 'Manali', main_image_url: '/b' },
    { id: 3, slug: 'park-three', name: 'Dog Park', category: 'Parks', city: 'Pune', main_image_url: '/c' },
    { id: 4, slug: 'cafe-four', name: 'Brew House', category: 'Cafes', city: 'Delhi', main_image_url: '/d' },
  ];

  it('sends an empty collection to Explore', () => {
    const { getByTestId } = render(<SavedPlacesScreen navigation={navigation} />);
    fireEvent.press(getByTestId('saved-explore-btn'));
    expect(navigation.navigate).toHaveBeenCalledWith('SearchScreen');
  });

  it('shows the collection banner with counts, a search box and category counts', () => {
    useSavedPlaces.mockReturnValue({ ...baseQuery, data: PLACES });
    const { getByText, getByTestId } = render(<SavedPlacesScreen navigation={navigation} />);

    expect(getByText('YOUR COLLECTION')).toBeTruthy();
    expect(getByText('4 saved places')).toBeTruthy();
    expect(getByTestId('saved-search')).toBeTruthy();
    expect(getByTestId('saved-filter-Cafes')).toBeTruthy();
  });

  it('filters the saved places by what is typed', () => {
    useSavedPlaces.mockReturnValue({ ...baseQuery, data: PLACES });
    const { getByText, getByTestId, queryByText } = render(
      <SavedPlacesScreen navigation={navigation} />
    );

    fireEvent.changeText(getByTestId('saved-search'), 'manali');
    expect(getByText('Hill Stay')).toBeTruthy();
    expect(queryByText('Paws Cafe')).toBeNull();
    expect(getByText('1 of 4 saved places')).toBeTruthy();

    fireEvent.changeText(getByTestId('saved-search'), 'zzz');
    expect(getByText('No matching places')).toBeTruthy();
  });
});
