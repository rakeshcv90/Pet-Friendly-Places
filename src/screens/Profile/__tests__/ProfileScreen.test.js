import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../index';
import { useAppUpdateStore } from '../../../services/appUpdate/appUpdateStore';
import { __resetAppUpdateForTests } from '../../../services/appUpdate/InAppUpdateService';

let mockPets = [];
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), setParams: jest.fn() };

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: () => {},
}));

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({
    data: { account: { name: 'Rishab', email: 'rishab@example.com' } },
    isLoading: false,
    refetch: jest.fn(),
  }),
  useMyPets: () => ({ data: mockPets, isLoading: false, refetch: jest.fn(), isRefetching: false }),
  useCreatePet: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('../../../hooks/useCommunity', () => ({
  useMyActivity: () => ({ data: [], isLoading: false }),
  filterActivity: items => items,
}));

describe('ProfileScreen menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPets = [];
  });

  it('opens the Privacy screen from the Privacy menu item', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('Privacy'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PrivacyScreen');
  });

  it('opens the Urbania bookings history from its menu item', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('Urbania bookings'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('UrbaniaBookingsScreen');
  });

  it('opens My Profile from the My Profile menu item', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('My Profile'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MyProfileScreen');
  });

  it('opens the pet profile page when a pet card is tapped', () => {
    const pet = { id: 'pet-1', petName: 'Bruni', species: 'Dog' };
    mockPets = [pet];
    const { getByTestId, getByText } = render(<ProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('My Pets'));
    fireEvent.press(getByTestId('pet-card-pet-1'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PetProfileScreen', {
      pet: expect.objectContaining({ id: 'pet-1', petName: 'Bruni' }),
    });
  });

  it('opens the add-pet form when sent here by "Add a pet", then clears the request', () => {
    const { queryByText } = render(
      <ProfileScreen navigation={mockNavigation} route={{ params: { openAddPet: true } }} />,
    );

    expect(mockNavigation.setParams).toHaveBeenCalledWith({ openAddPet: undefined });
    expect(queryByText(/Add (a )?pet/i)).toBeTruthy();
  });

  it('does not open the add-pet form on a normal visit', () => {
    render(<ProfileScreen navigation={mockNavigation} route={{ params: {} }} />);
    expect(mockNavigation.setParams).not.toHaveBeenCalled();
  });

  describe('Update rows', () => {
    it('has two separate rows in the main Profile menu: the store update and the OTA update', () => {
      const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

      expect(getByText('Check for app update')).toBeTruthy();
      expect(getByText('Check for OTA update')).toBeTruthy();
    });

    it('shows the native version on the app row, not on the OTA row', () => {
      const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

      // From the mocked device info: version 1.0, build 1
      expect(getByText('v1.0 (1)')).toBeTruthy();
    });

    it('opens the OTA update check from the OTA row', async () => {
      const { getByText, findByText, queryByText } = render(
        <ProfileScreen navigation={mockNavigation} />,
      );
      expect(queryByText('Updates unavailable')).toBeNull();

      fireEvent.press(getByText('Check for OTA update'));

      // Tests run as a development build, where updates are off, so the sheet explains that
      expect(await findByText('Updates unavailable')).toBeTruthy();
    });

    it('opens the store update dialog from the app row', () => {
      __resetAppUpdateForTests();
      const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

      fireEvent.press(getByText('Check for app update'));

      expect(useAppUpdateStore.getState().modalVisible).toBe(true);
      expect(useAppUpdateStore.getState().source).toBe('manual');
    });
  });
});
