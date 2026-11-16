import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SavedPlacesScreen } from '../SavedPlacesScreen';
import { useSavedPlaces } from '../../../hooks/useUser';

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
  useSavedPlaces: jest.fn(),
  useUnsavePlace: () => ({ mutate: jest.fn() }),
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
});
