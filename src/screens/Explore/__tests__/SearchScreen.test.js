import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SearchScreen } from '../SearchScreen';
import { useInfiniteListings } from '../../../hooks/useDiscovery';

jest.mock('../../../hooks/useDiscovery', () => ({
  useInfiniteListings: jest.fn(),
  resolveImageUrl: url => url,
}));

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { account: { name: 'Test User' } } }),
  useSavePlace: () => ({ isSaved: false, toggle: jest.fn(), isPending: false }),
}));

const makeItem = id => ({
  id,
  slug: `place-${id}`,
  name: `Place ${id}`,
  category: 'cafe',
  city: 'Delhi',
});

const baseQuery = {
  data: { pages: [{ items: [], total: 0 }] },
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isRefetching: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

describe('SearchScreen list', () => {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    useInfiniteListings.mockReturnValue(baseQuery);
  });

  it('renders the results as a virtualized list and opens a place', () => {
    useInfiniteListings.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ items: [makeItem(1), makeItem(2)], total: 2 }] },
    });
    const { getByText, UNSAFE_getByType } = render(
      <SearchScreen navigation={navigation} route={{ params: {} }} />,
    );

    const { FlatList } = require('react-native');
    expect(UNSAFE_getByType(FlatList).props.data).toHaveLength(2);

    fireEvent.press(getByText('Place 1'));
    expect(navigation.navigate).toHaveBeenCalledWith('ListingDetailScreen', { slug: 'place-1' });
  });

  it('does not render every item up front for a long result set', () => {
    const items = Array.from({ length: 200 }, (_, i) => makeItem(i + 1));
    useInfiniteListings.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ items, total: 200 }] },
    });
    const { queryByText } = render(
      <SearchScreen navigation={navigation} route={{ params: {} }} />,
    );

    expect(queryByText('Place 1')).toBeTruthy();
    expect(queryByText('Place 200')).toBeNull();
  });

  it('shows the empty message when nothing matches', () => {
    const { getByText } = render(<SearchScreen navigation={navigation} route={{ params: {} }} />);
    expect(getByText('No places match your filters')).toBeTruthy();
  });

  it('shows a retry hint when loading fails', () => {
    useInfiniteListings.mockReturnValue({ ...baseQuery, isError: true });
    const { getByText } = render(<SearchScreen navigation={navigation} route={{ params: {} }} />);
    expect(getByText('Could not load places')).toBeTruthy();
  });

  it('asks for the next page when the end of the list is reached', () => {
    const fetchNextPage = jest.fn();
    useInfiniteListings.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ items: [makeItem(1)], total: 40 }] },
      hasNextPage: true,
      fetchNextPage,
    });
    const { UNSAFE_getByType } = render(
      <SearchScreen navigation={navigation} route={{ params: {} }} />,
    );
    const { FlatList } = require('react-native');
    UNSAFE_getByType(FlatList).props.onEndReached();
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('does not ask for another page while one is already loading', () => {
    const fetchNextPage = jest.fn();
    useInfiniteListings.mockReturnValue({
      ...baseQuery,
      data: { pages: [{ items: [makeItem(1)], total: 40 }] },
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage,
    });
    const { UNSAFE_getByType } = render(
      <SearchScreen navigation={navigation} route={{ params: {} }} />,
    );
    const { FlatList } = require('react-native');
    UNSAFE_getByType(FlatList).props.onEndReached();
    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
