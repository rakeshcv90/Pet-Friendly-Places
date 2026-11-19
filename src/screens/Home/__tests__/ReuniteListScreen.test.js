import React from 'react';
import { render as rtlRender, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReuniteListScreen } from '../ReuniteListScreen';

const mockPosts = [
  { id: 'a', type: 'lost', species: 'dog', name: 'Tommy', location: 'Delhi', eventDate: '2026-10-22' },
  { id: 'b', type: 'found', species: 'cat', name: '', location: 'Noida', eventDate: '2026-11-05' },
];

jest.mock('../../../hooks/useReunite', () => ({
  ...jest.requireActual('../../../hooks/useReunite'),
  useReuniteCases: () => ({ data: mockPosts, isLoading: false, isRefetching: false, refetch: jest.fn() }),
}));

// The shared screen header reads the user profile through react-query
const render = ui =>
  rtlRender(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const navigation = { goBack: jest.fn(), navigate: jest.fn() };

describe('ReuniteListScreen', () => {
  it('shows every post with the card details', () => {
    const { getByText } = render(
      <ReuniteListScreen navigation={navigation} route={{ params: {} }} />,
    );
    expect(getByText('Tommy')).toBeTruthy();
    expect(getByText('Name unknown')).toBeTruthy();
    expect(getByText('Missing since 22 Oct')).toBeTruthy();
    expect(getByText('Found on 5 Nov')).toBeTruthy();
  });

  it('opens on the tab it was given and filters by it', () => {
    const { queryByText } = render(
      <ReuniteListScreen navigation={navigation} route={{ params: { initialTab: 'found' } }} />,
    );
    expect(queryByText('Tommy')).toBeNull();
    expect(queryByText('Name unknown')).toBeTruthy();
  });

  it('filters by pet type', () => {
    const { getByText, queryByText } = render(
      <ReuniteListScreen navigation={navigation} route={{ params: {} }} />,
    );
    fireEvent.press(getByText('Cats'));
    expect(queryByText('Tommy')).toBeNull();
    expect(getByText('Name unknown')).toBeTruthy();
  });
});
