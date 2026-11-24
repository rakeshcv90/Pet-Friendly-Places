import React from 'react';
import { ScrollView } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SavedScreen, STEPS, SECTION_DESCRIPTIONS, HERO_TEXT } from '../index';

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

  it('scrolls back to the top when Browse is pressed', () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => {});
    const { getByText } = renderScreen();

    fireEvent.press(getByText('Browse 🐾'));
    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
    scrollTo.mockRestore();
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

  describe('the descriptions the website shows', () => {
    const LONG =
      'Bengaluru pet parents — parks, cafes, vets, weekend getaways from the city, and local meetups. One of India\'s most pet-loving cities, in one place.';

    it('shows the full hero text, not a two-line cut', () => {
      const { getByTestId } = renderScreen();
      const hero = getByTestId('hero-description');

      expect(hero.props.children).toBe(HERO_TEXT);
      expect(hero.props.numberOfLines).toBeUndefined();
      expect(HERO_TEXT).toMatch(/Moderated, permanent, and searchable/);
      expect(HERO_TEXT).toMatch(/Not another chat group where answers scroll away/);
    });

    it('puts the website line under By Topic, By City and How it works', () => {
      const { getAllByTestId, getByText } = renderScreen();
      const lines = getAllByTestId('section-description').map(node => node.props.children);

      expect(lines).toEqual([
        'Questions, tips and stories for every pet parent journey',
        'Connect with pet parents in your city',
        'A genuine space, built, moderated, and used by Indian pet parents.',
      ]);
      expect(getByText(SECTION_DESCRIPTIONS.topic)).toBeTruthy();
      expect(getByText(SECTION_DESCRIPTIONS.city)).toBeTruthy();
      expect(getByText(SECTION_DESCRIPTIONS.how)).toBeTruthy();
    });

    it('shows a community description in full instead of cutting it after two lines', () => {
      mockCommunities.mockReturnValue({
        data: [{ id: 3, slug: 'bengaluru', type: 'CITY', name: 'Bengaluru', description: LONG, emoji: '🌳', memberCount: 26, postCount: 0 }],
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      });
      const { getByText } = renderScreen();
      const description = getByText(LONG);

      expect(description.props.numberOfLines).toBeUndefined();
    });

    it('uses the website wording for the three steps', () => {
      const { getByText } = renderScreen();

      expect(STEPS.map(step => step.title)).toEqual(['Ask anything', 'Share discoveries', 'Reviewed with care']);
      STEPS.forEach(step => {
        expect(getByText(step.title)).toBeTruthy();
        expect(getByText(step.desc)).toBeTruthy();
      });
      expect(getByText(/New members' first posts are reviewed by our team before going live/)).toBeTruthy();
    });

    it('shows each step in full, with no line limit', () => {
      const { getByText } = renderScreen();

      STEPS.forEach(step => {
        expect(getByText(step.desc).props.numberOfLines).toBeUndefined();
      });
    });
  });

  describe('the long-form text from the website', () => {
    it('shows it on the screen itself, not only in the popup', () => {
      const { getByTestId, getByText } = renderScreen();

      expect(getByTestId('community-about')).toBeTruthy();
      expect(getByText("Why India's pet parents needed a place like this")).toBeTruthy();
      expect(getByText('Lessons the road taught us (so you can skip the hard way)')).toBeTruthy();
      expect(getByText('The questions this community was built for')).toBeTruthy();
      expect(getByText('Frequently asked questions')).toBeTruthy();
    });

    it('shows the opening paragraphs and the lessons', () => {
      const { getByText } = renderScreen();

      expect(getByText(/Every day, somewhere in India, a pet parent types a question into a WhatsApp group/)).toBeTruthy();
      expect(getByText('“Pet friendly” on the internet means almost nothing')).toBeTruthy();
      expect(getByText('Ask the narrower question')).toBeTruthy();
      expect(getByText('Leopard country is real')).toBeTruthy();
    });

    it('lists all six questions of the FAQ', () => {
      const { getByText } = renderScreen();

      [
        'Is there an online community or forum for pet parents in India?',
        'How is this different from a WhatsApp pet group?',
        'Can I trust the advice here?',
        'Is Tails Community free?',
        'I run a pet business. Can I participate?',
        'My dog is an indie. Is this community for me?',
      ].forEach(question => expect(getByText(question)).toBeTruthy());
    });

    it('opens the first answer, keeps the others closed, and opens one when its question is tapped', () => {
      const { getByText, queryByText } = renderScreen();
      const FIRST = /There are many WhatsApp and Facebook pet groups in India/;
      const FREE = /Create a free account, join the communities that fit your life/;

      expect(getByText(FIRST)).toBeTruthy();
      expect(queryByText(FREE)).toBeNull();

      fireEvent.press(getByText('Is Tails Community free?'));

      expect(getByText(FREE)).toBeTruthy();
      // Only one answer is open at a time
      expect(queryByText(FIRST)).toBeNull();
    });

    it('closes an open answer when its question is tapped again', () => {
      const { getByText, queryByText } = renderScreen();

      fireEvent.press(getByText('Is there an online community or forum for pet parents in India?'));

      expect(queryByText(/There are many WhatsApp and Facebook pet groups in India/)).toBeNull();
    });

    it('is still in the About popup too', () => {
      const { getByText, getAllByText, getByLabelText } = renderScreen();
      const before = getAllByText('Frequently asked questions').length;

      fireEvent.press(getByLabelText('About the community'));

      expect(getByText('About Tails Community')).toBeTruthy();
      expect(getAllByText('Frequently asked questions').length).toBeGreaterThan(before);
    });
  });
});

