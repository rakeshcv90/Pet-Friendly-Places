import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SavedScreen } from '../index';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

jest.mock('../../../hooks/useUser', () => ({
  useUserProfile: () => ({ data: { name: 'Luna Parent' } }),
}));

const mockCommunities = jest.fn();
const mockFeatured = jest.fn();
const mockLeaderboard = jest.fn();
jest.mock('../../../hooks/useCommunity', () => ({
  useCommunities: () => mockCommunities(),
  useFeaturedThread: () => mockFeatured(),
}));

jest.mock('../../../hooks/useLeaderboard', () => ({
  useLeaderboard: (...args) => mockLeaderboard(...args),
}));

const API_COMMUNITIES = [
  { id: 1, slug: 'travel-and-road-trips', type: 'TOPIC', name: 'Travel & Road Trips', description: 'Planning a trip with your dog?', emoji: '🚗', memberCount: 26, postCount: 12 },
  { id: 6, slug: 'delhi-ncr', type: 'CITY', name: 'Delhi NCR', description: 'Pet parents across Delhi.', emoji: '🏙️', memberCount: 31, postCount: 2 },
];

const renderScreen = () =>
  render(
    <NavigationContainer>
      <SavedScreen navigation={mockNavigation} />
    </NavigationContainer>,
  );

describe('SavedScreen (Community tab)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommunities.mockReturnValue({ data: API_COMMUNITIES, isLoading: false, isError: false, refetch: jest.fn() });
    mockLeaderboard.mockReturnValue({ data: [] });
    mockFeatured.mockReturnValue({ community: undefined, post: null, body: undefined, replies: [] });
  });

  it('renders topics and cities from the community API', () => {
    const { getByText, queryByText } = renderScreen();

    expect(getByText('Travel & Road Trips')).toBeTruthy();
    expect(getByText('Pet parents across Delhi.')).toBeTruthy();
    expect(getByText('👥 31 members')).toBeTruthy();
    expect(getByText('👥 26 members')).toBeTruthy();
    expect(getByText('📝 12 posts')).toBeTruthy();
    expect(getByText('📝 2 posts')).toBeTruthy();
    expect(queryByText('Mumbai')).toBeNull();
  });

  it('opens the community when a topic card is pressed', () => {
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Travel & Road Trips'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'CommunityDetailScreen',
      expect.objectContaining({ community: expect.objectContaining({ slug: 'travel-and-road-trips', posts: 12 }) }),
    );
  });

  it('derives the stats from the API data', () => {
    const { getByText } = renderScreen();

    expect(getByText('Communities')).toBeTruthy();
    expect(getByText('14')).toBeTruthy();
  });

  it('shows no communities, and a loader, until the API responds', () => {
    mockCommunities.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const { queryByText, getAllByText, getByText } = renderScreen();

    expect(queryByText('Mumbai')).toBeNull();
    expect(queryByText('Travel & Road Trips')).toBeNull();
    expect(getAllByText('–').length).toBe(3);
    expect(getByText('Fetching communities…')).toBeTruthy();
  });

  it('offers a retry when the directory fails to load', () => {
    const refetch = jest.fn();
    mockCommunities.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const { getAllByText } = renderScreen();

    expect(getAllByText('Could not load communities').length).toBeGreaterThan(0);
    fireEvent.press(getAllByText('Try again')[0]);
    expect(refetch).toHaveBeenCalled();
  });

  it('features a real post with its top answers as a display-only card', () => {
    mockFeatured.mockReturnValue({
      community: API_COMMUNITIES[0],
      post: {
        slug: 'best-route-manali',
        title: 'Best route for Manali with a dog?',
        authorDisplayName: 'Rohan',
        replyCount: 14,
        upvoteCount: 32,
      },
      body: 'Planning a trip from Delhi.',
      replies: [{ id: 1, authorDisplayName: 'Sneha', authorVerifiedCredential: 'EXPERT', body: 'Stay at Banjara Camp.' }],
    });
    const { getByText } = renderScreen();

    expect(getByText('Planning a trip from Delhi.')).toBeTruthy();
    expect(getByText('Stay at Banjara Camp.')).toBeTruthy();
    expect(getByText('✓ Expert')).toBeTruthy();

    // Display-only card: pressing it does not navigate
    fireEvent.press(getByText('Best route for Manali with a dog?'));
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it('no longer shows the Browse Communities and in-hero Ask buttons', () => {
    const { queryByText } = renderScreen();

    expect(queryByText('Browse Communities')).toBeNull();
    expect(queryByText('Ask a Question')).toBeNull();
  });

  it('opens the new post screen from the floating Ask a Question button', () => {
    const { getByLabelText } = renderScreen();

    const fab = getByLabelText('Ask a Question');
    fab.props.onAccessibilityTap();
    expect(mockNavigation.navigate).toHaveBeenCalledWith('NewPostScreen', { type: 'QUESTION' });
  });

  it('opens the community info popup from the info button', () => {
    const { getByLabelText, queryByText, getByText } = renderScreen();

    expect(queryByText('About Tails Community')).toBeNull();
    fireEvent.press(getByLabelText('About the community'));
    expect(getByText('About Tails Community')).toBeTruthy();
    expect(getByText('Got it')).toBeTruthy();
  });

  it('opens the leaderboard from the leaderboard card', () => {
    const { getByText, getByLabelText } = renderScreen();

    expect(getByText('Leaderboard')).toBeTruthy();
    expect(getByText('TRAVELLING TAILS')).toBeTruthy();
    fireEvent.press(getByLabelText('Open leaderboard'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('LeaderboardScreen');
  });

  it('previews the current top three pets on the leaderboard card', () => {
    mockLeaderboard.mockReturnValue({
      data: [
        { petProfileId: 'a', petName: 'Apple', profilePhotoUrl: null },
        { petProfileId: 'b', petName: 'Captain', profilePhotoUrl: null },
        { petProfileId: 'c', petName: 'Kimchi', profilePhotoUrl: null },
        { petProfileId: 'd', petName: 'Rustie', profilePhotoUrl: null },
      ],
    });
    const { getByText, queryByText } = renderScreen();

    expect(mockLeaderboard).toHaveBeenCalledWith('all', 3);
    expect(getByText('A')).toBeTruthy();
    expect(getByText('C')).toBeTruthy();
    expect(getByText('K')).toBeTruthy();
    expect(queryByText('R')).toBeNull();
  });
});
