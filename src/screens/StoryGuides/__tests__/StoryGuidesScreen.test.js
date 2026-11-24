import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { StoryGuidesScreen } from '../index';

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({
    data: { name: 'Luna Parent' },
  }),
}));

jest.mock('../../../hooks/useDiscovery', () => ({
  useTravelStories: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  useInfiniteArticles: () => ({
    data: { pages: [] },
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
  }),
  useArticles: () => ({
    data: { articles: [], total: 0 },
    isLoading: false,
    refetch: jest.fn(),
  }),
  resolveImageUrl: url => url,
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

describe('StoryGuidesScreen', () => {
  it('renders top AppHeader and segmented tabs for Travel Story and Guides', () => {
    const { getByText, getByTestId } = render(
      <StoryGuidesScreen navigation={mockNavigation} route={{}} />,
    );

    expect(getByText('Pet Friendly Places')).toBeTruthy();
    expect(getByTestId('tab-travel-stories')).toBeTruthy();
    expect(getByTestId('tab-guides')).toBeTruthy();
    expect(getByText('Travel Story')).toBeTruthy();
    expect(getByText('Guides')).toBeTruthy();
  });

  it('switches between Travel Story and Guides tabs smoothly without errors', async () => {
    const { getByTestId, getByText } = render(
      <StoryGuidesScreen navigation={mockNavigation} route={{}} />,
    );

    const guidesTab = getByTestId('tab-guides');
    fireEvent.press(guidesTab);

    // the heavy pane mounts once the slide animation has finished
    await waitFor(() => expect(getByText('FROM TRAVEL WITH TAILS & RUBICON')).toBeTruthy());

    const storiesTab = getByTestId('tab-travel-stories');
    fireEvent.press(storiesTab);

    await waitFor(() => expect(getByText('Stories from\nthe road.')).toBeTruthy());
  });

  it('initializes on Guides tab when passed initialTab param', () => {
    const { getByText } = render(
      <StoryGuidesScreen
        navigation={mockNavigation}
        route={{ params: { initialTab: 'guides' } }}
      />,
    );

    expect(getByText('FROM TRAVEL WITH TAILS & RUBICON')).toBeTruthy();
    expect(getByText('50+')).toBeTruthy();
  });
});
