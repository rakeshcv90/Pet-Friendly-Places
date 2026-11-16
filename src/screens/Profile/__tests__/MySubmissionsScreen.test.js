import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MySubmissionsScreen, getStatusMeta } from '../MySubmissionsScreen';
import { useMyPlaceSubmissions } from '../../../hooks/placeSubmission';

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
}));

jest.mock('../../../hooks/placeSubmission', () => ({
  useMyPlaceSubmissions: jest.fn(),
}));

const baseQuery = {
  data: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isRefetching: false,
};

describe('MySubmissionsScreen', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useMyPlaceSubmissions.mockReturnValue(baseQuery);
  });

  it('shows the empty state and opens Add Place', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <MySubmissionsScreen navigation={navigation} />,
    );

    expect(getByText('My Submissions')).toBeTruthy();
    expect(getByText('No contributions yet')).toBeTruthy();
    expect(getByText('Help the community by sharing pet-friendly spots.')).toBeTruthy();
    expect(queryByTestId('my-submissions-fab')).toBeNull();

    fireEvent.press(getByTestId('my-submissions-add-btn'));
    expect(navigation.navigate).toHaveBeenCalledWith('AddPlaceScreen');
  });

  it('lists submissions with status, location and an add button', () => {
    useMyPlaceSubmissions.mockReturnValue({
      ...baseQuery,
      data: [
        {
          id: '1',
          name: 'The Barking Cat Cafe',
          category: 'Food',
          city: 'Mumbai',
          state: 'Maharashtra',
          status: 'pending',
          createdAt: '2026-11-01T10:00:00Z',
        },
        {
          id: '2',
          name: 'Paws Resort',
          category: 'Stays',
          city: 'Goa',
          state: '',
          status: 'approved',
        },
      ],
    });
    const { getByText, queryByText, getByTestId } = render(
      <MySubmissionsScreen navigation={navigation} />,
    );

    expect(getByText('The Barking Cat Cafe')).toBeTruthy();
    expect(getByText('Food · Mumbai, Maharashtra')).toBeTruthy();
    expect(getByText('Pending review')).toBeTruthy();
    expect(getByText('Paws Resort')).toBeTruthy();
    expect(getByText('Approved')).toBeTruthy();
    expect(getByText('2 places submitted')).toBeTruthy();
    expect(queryByText('No contributions yet')).toBeNull();

    fireEvent.press(getByTestId('my-submissions-fab'));
    expect(navigation.navigate).toHaveBeenCalledWith('AddPlaceScreen');
  });

  it('shows an error state with retry instead of the empty message', () => {
    useMyPlaceSubmissions.mockReturnValue({ ...baseQuery, isError: true });
    const { getByText, queryByText, getByTestId } = render(
      <MySubmissionsScreen navigation={navigation} />,
    );

    expect(getByText('Could not load your submissions')).toBeTruthy();
    expect(queryByText('No contributions yet')).toBeNull();
    fireEvent.press(getByTestId('my-submissions-retry-btn'));
    expect(baseQuery.refetch).toHaveBeenCalled();
  });

  it('goes back from the hero', () => {
    const { getByTestId } = render(<MySubmissionsScreen navigation={navigation} />);
    fireEvent.press(getByTestId('my-submissions-back-btn'));
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  it('maps unknown statuses to sensible labels', () => {
    expect(getStatusMeta('under review').label).toBe('In review');
    expect(getStatusMeta('rejected').label).toBe('Not accepted');
    expect(getStatusMeta('PUBLISHED'.toLowerCase()).label).toBe('Published');
    expect(getStatusMeta('something-new').label).toBe('Pending review');
  });
});
