import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../index';

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
  useMyPets: () => ({ data: [], isLoading: false, refetch: jest.fn(), isRefetching: false }),
  useCreatePet: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

jest.mock('../../../hooks/useCommunity', () => ({
  useMyActivity: () => ({ data: [], isLoading: false }),
  filterActivity: items => items,
}));

describe('ProfileScreen menu', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the Privacy screen from the Privacy menu item', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('Privacy'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('PrivacyScreen');
  });

  it('opens My Profile from the My Profile menu item', () => {
    const { getByText } = render(<ProfileScreen navigation={mockNavigation} />);

    fireEvent.press(getByText('My Profile'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MyProfileScreen');
  });
});
