import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../index';

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
});
