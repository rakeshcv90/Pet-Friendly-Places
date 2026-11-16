import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { CreateTripScreen } from '../CreateTripScreen';

// Mock storage
jest.mock('../../../services/storage/storage', () => ({
  getItem: jest.fn().mockReturnValue([]),
  setItem: jest.fn(),
  STORAGE_KEYS: { SAVED_TRIPS: 'SAVED_TRIPS' },
}));

// Mock store
jest.mock('../../../store', () => ({
  useStore: jest.fn(selector =>
    selector({
      isDarkMode: false,
      pets: [
        { id: 'pet-1', name: 'Milo', breed: 'Golden Retriever', type: 'Dog' },
        { id: 'pet-2', name: 'Luna', breed: 'Indie Cat', type: 'Cat' },
      ],
      user: { name: 'Rishab' },
    })
  ),
}));

// The screen and the shared header both read the profile
jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: undefined }),
}));

describe('CreateTripScreen Component', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Create a trip screen with all inputs and Save trip button', () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    // Header
    expect(getByText('Create a trip')).toBeTruthy();
    expect(getByText('PAWSPORT ADVENTURES 🐾')).toBeTruthy();
    expect(getByText("Show it on your pets' Pawsports")).toBeTruthy();

    // Inputs
    expect(getByPlaceholderText('e.g. Monsoon weekend in Coorg')).toBeTruthy();
    expect(getByPlaceholderText('A quick line about this adventure')).toBeTruthy();
    expect(getByPlaceholderText('dd/mm/yyyy')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Coorg, Karnataka')).toBeTruthy();
    expect(getByPlaceholderText('Search for a place to add...')).toBeTruthy();

    // Pet Selector
    expect(getByText('Milo')).toBeTruthy();
    expect(getByText('Luna')).toBeTruthy();

    // Submit button
    expect(getByTestId('create-trip-submit-btn')).toBeTruthy();
    expect(getByTestId('create-trip-submit-btn')).toBeTruthy();

    // Verify preview card has been removed
    const { queryByText } = render(<CreateTripScreen navigation={mockNavigation} />);
    expect(queryByText('TRIP ADVENTURE DRAFT')).toBeNull();
    expect(queryByText('READY TO RECORD')).toBeNull();
  });

  it('navigates back when top back button is pressed', () => {
    const { getByTestId } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('create-trip-back-btn'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('validates required fields and displays error if title is empty', async () => {
    const { getByTestId, getByText } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('create-trip-submit-btn'));
    });

    expect(getByText('Please enter a trip title.')).toBeTruthy();
  });

  it('allows user to fill the form, select pets, add places, and save trip', async () => {
    const { setItem } = require('../../../services/storage/storage');

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    // 1. Fill Trip title
    fireEvent.changeText(
      getByTestId('create-trip-title-input'),
      'Monsoon Trek in Ooty'
    );

    // 2. Fill Description
    fireEvent.changeText(
      getByTestId('create-trip-description-input'),
      'Amazing misty hills and cozy pet cafes'
    );

    // 3. Fill Destination
    fireEvent.changeText(
      getByTestId('create-trip-destination-input'),
      'Ooty, Tamil Nadu'
    );

    // 4. Select a pet
    fireEvent.press(getByTestId('pet-chip-pet-1'));

    // 5. Add a place visited
    fireEvent.changeText(
      getByPlaceholderText('Search for a place to add...'),
      'Botanical Gardens'
    );
    fireEvent.press(getByText('+ Add'));
    expect(getByText('Botanical Gardens')).toBeTruthy();

    // 6. Submit trip
    await act(async () => {
      fireEvent.press(getByTestId('create-trip-submit-btn'));
    });

    // 7. Verification: Saved to storage & Success modal shown
    expect(setItem).toHaveBeenCalled();
    await waitFor(() => {
      expect(getByText('Trip Saved! 🐾')).toBeTruthy();
    });
  });

  it('opens native third-party date picker when clicking date option or calendar icon', async () => {
    const { getByTestId, queryByTestId } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    expect(queryByTestId('date-selector-modal')).toBeFalsy();

    // 1. Click on date option box to open date picker
    fireEvent.press(getByTestId('create-trip-date-box'));

    // On iOS (Jest default), date-selector-modal and date-time-picker are displayed
    expect(getByTestId('date-selector-modal')).toBeTruthy();
    expect(getByTestId('date-time-picker')).toBeTruthy();

    // 2. Confirm date selection
    fireEvent.press(getByTestId('confirm-date-btn'));

    // Modal closes and date input is set
    expect(queryByTestId('date-selector-modal')).toBeFalsy();
    const dateInput = getByTestId('create-trip-date-input');
    expect(dateInput.props.value).toBeTruthy();
    expect(dateInput.props.value).toContain('/');
  });

  it('invokes DateTimePickerAndroid.open when Platform.OS is android', () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
    const { getByTestId } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByTestId('create-trip-date-box'));
    expect(DateTimePickerAndroid.open).toHaveBeenCalled();

    Platform.OS = originalOS;
  });

  it('handles text input focus and blur for smooth screen movement', () => {
    const { getByTestId } = render(
      <CreateTripScreen navigation={mockNavigation} />
    );

    const titleInput = getByTestId('create-trip-title-input');
    const descInput = getByTestId('create-trip-description-input');
    const destInput = getByTestId('create-trip-destination-input');
    const placesInput = getByTestId('create-trip-places-input');

    // Simulate focus and blur on all inputs
    fireEvent(titleInput, 'focus');
    fireEvent(titleInput, 'blur');

    fireEvent(descInput, 'focus');
    fireEvent(descInput, 'blur');

    fireEvent(destInput, 'focus');
    fireEvent(destInput, 'blur');

    fireEvent(placesInput, 'focus');
    fireEvent(placesInput, 'blur');
  });
});
