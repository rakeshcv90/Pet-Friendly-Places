import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GuidesScreen } from '../GuidesScreen';

const mockFetchNextPage = jest.fn();

const MOCK_ARTICLES = [
  {
    id: 'guide-staycation-gurgaon',
    title: 'Pet Friendly Staycation Near Gurgaon - 3 Private Villas Where Dogs Actually Run Free',
    category: 'destinations',
    excerpt: 'Three verified pet-friendly private villas within 45 minutes of Gurgaon...',
    estimatedReadMinutes: 8,
    coverImageUrl: '',
    authorName: 'Ekta & Akash',
  },
  {
    id: 'guide-panikot-lake',
    title: 'Dog Friendly Lake Near Delhi NCR - Panikot Lake, Faridabad (Hidden Gem)',
    category: 'destinations',
    excerpt: 'An abandoned open quarry mine in the Aravalli hills near Faridabad...',
    estimatedReadMinutes: 10,
    coverImageUrl: '',
    authorName: 'Apple The Golden Pack',
  },
  {
    id: 'guide-shelters-helplines',
    title: 'Animal Shelters & Rescue Helplines Across India',
    category: 'guide',
    excerpt: 'A researched directory of verified animal welfare organisations...',
    estimatedReadMinutes: 5,
    coverImageUrl: '',
    authorName: 'Tails Welfare Council',
  },
  {
    id: 'guide-corbett-trip',
    title: 'Jim Corbett Road Trip with 3 Dogs - What Actually Happened',
    category: 'destinations',
    excerpt: 'Three dogs, one Jeep Rubicon, one overnight drive from Gurugram...',
    estimatedReadMinutes: 11,
    coverImageUrl: '',
    authorName: 'Ekta & Akash with Sky, Apple & Captain',
  },
  {
    id: 'guide-monsoon-summer-health',
    title: 'Monsoon & Summer Travel Health: Ticks, Dehydration & Paws',
    category: 'pet-health',
    excerpt: 'Preventing tick fever in monsoon grass...',
    estimatedReadMinutes: 8,
    coverImageUrl: '',
    authorName: 'Dr. Neha Rao',
  },
];

jest.mock('../../../hooks/useDiscovery', () => ({
  useInfiniteArticles: jest.fn(({ category }) => {
    const filtered = category
      ? MOCK_ARTICLES.filter(a => a.category === category)
      : MOCK_ARTICLES;
    return {
      data: { pages: [{ articles: filtered, total: filtered.length }] },
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage: mockFetchNextPage,
      refetch: jest.fn(),
    };
  }),
  useArticles: jest.fn(() => ({
    data: { articles: [], total: 0 },
    isLoading: false,
    refetch: jest.fn(),
  })),
  resolveImageUrl: url => url,
}));

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

describe('GuidesScreen', () => {
  it('renders web information with app design header, stats, and real guides', () => {
    const { getByPlaceholderText, getByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    expect(
      getByPlaceholderText('Search guides, packing tips, rules...'),
    ).toBeTruthy();
    expect(getByText('FROM TRAVEL WITH TAILS & RUBICON')).toBeTruthy();
    expect(getByText('Pet Travel Guides & Advice for Indian Pet Parents')).toBeTruthy();
    expect(getByText('50+')).toBeTruthy();
    expect(getByText('Pet guides published')).toBeTruthy();
    expect(
      getByText('Dog Friendly Lake Near Delhi NCR - Panikot Lake, Faridabad (Hidden Gem)'),
    ).toBeTruthy();
  });

  it('filters guides when selecting a category tab', () => {
    const { getByText, getAllByText, queryByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    const rescueTab = getAllByText('Rescue & Welfare')[0];
    fireEvent.press(rescueTab);

    expect(getByText('Animal Shelters & Rescue Helplines Across India')).toBeTruthy();
    expect(
      queryByText('Dog Friendly Lake Near Delhi NCR - Panikot Lake, Faridabad (Hidden Gem)'),
    ).toBeNull();
  });

  it('filters guides when typing into search bar', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    const input = getByPlaceholderText('Search guides, packing tips, rules...');
    fireEvent.changeText(input, 'Corbett');

    expect(getByText('Jim Corbett Road Trip with 3 Dogs - What Actually Happened')).toBeTruthy();
    expect(
      queryByText('Animal Shelters & Rescue Helplines Across India'),
    ).toBeNull();
  });

  it('renders verified badges and guide cards with compact design', () => {
    const { getAllByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    expect(getAllByText('Verified Guide').length).toBeGreaterThan(0);
    expect(getAllByText(/DESTINATION GUIDE/i).length).toBeGreaterThan(0);
  });

  it('navigates to GuideDetailScreen with guide data when pressed', () => {
    const { getAllByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    const guideCard = getAllByText(/Pet Friendly Staycation Near Gurgaon/)[0];
    fireEvent.press(guideCard);

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'GuideDetailScreen',
      expect.objectContaining({
        guide: expect.objectContaining({
          title: expect.stringContaining('Pet Friendly Staycation Near Gurgaon'),
        }),
      }),
    );
  });

  it('renders all category tabs requested: All Guides, Pet Travel India, Pet Health, Pet Parenting, Misconceptions, Destination Guides, Rescue & Welfare', () => {
    const { getAllByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    expect(getAllByText('All Guides').length).toBeGreaterThan(0);
    expect(getAllByText('Pet Travel India').length).toBeGreaterThan(0);
    expect(getAllByText('Pet Health').length).toBeGreaterThan(0);
    expect(getAllByText('Pet Parenting').length).toBeGreaterThan(0);
    expect(getAllByText('Misconceptions').length).toBeGreaterThan(0);
    expect(getAllByText('Destination Guides').length).toBeGreaterThan(0);
    expect(getAllByText('Rescue & Welfare').length).toBeGreaterThan(0);
  });

  it('allows clicking category tabs like Pet Health and triggers category selection', () => {
    const { getAllByText, getByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    const healthTab = getAllByText('Pet Health')[0];
    fireEvent.press(healthTab);

    expect(getByText('Monsoon & Summer Travel Health: Ticks, Dehydration & Paws')).toBeTruthy();
  });

  it('renders pagination load more button and calls fetchNextPage on click', () => {
    const { getByText } = render(
      <GuidesScreen navigation={mockNavigation} />,
    );

    const loadMoreBtn = getByText('Load More Guides');
    expect(loadMoreBtn).toBeTruthy();

    fireEvent.press(loadMoreBtn);
    expect(mockFetchNextPage).toHaveBeenCalled();
  });
});

