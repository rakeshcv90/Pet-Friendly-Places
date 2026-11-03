import React from 'react';
import { Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { LeaderboardScreen, rankFor } from '../LeaderboardScreen';
import { WEB_BASE_URL } from '../../../services/api/apiList';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockLeaderboard = jest.fn();

jest.mock('../../../hooks/useLeaderboard', () => ({
  ...jest.requireActual('../../../hooks/useLeaderboard'),
  useLeaderboard: (...args) => mockLeaderboard(...args),
}));

const ENTRIES = [
  { rank: 1, petProfileId: 'a', petName: 'Apple', slug: 'apple-sikarwar', species: 'dog', breed: 'Golden Retriever', profilePhotoUrl: null, pts: 965, stampCount: 20, socialLinks: { instagram: 'travelwithtails' }, ownerDisplayName: 'Ekta Sikarwar', ownerPhotoUrl: null },
  { rank: 2, petProfileId: 'b', petName: 'Captain', slug: 'captain-sikarwar', species: 'dog', breed: 'Indie Dog', profilePhotoUrl: null, pts: 630, stampCount: 2, socialLinks: null, ownerDisplayName: 'Ekta Sikarwar', ownerPhotoUrl: null },
  { rank: 3, petProfileId: 'c', petName: 'Kimchi', slug: 'kimchi-sikarwar', species: 'dog', breed: 'Black Retriever', profilePhotoUrl: null, pts: 290, stampCount: 2, socialLinks: null, ownerDisplayName: 'Ekta Sikarwar', ownerPhotoUrl: null },
  { rank: 4, petProfileId: 'd', petName: 'Rustie', slug: 'rustie-sikarwar', species: 'dog', breed: 'Beagle Mix', profilePhotoUrl: null, pts: 90, stampCount: 1, socialLinks: null, ownerDisplayName: 'Gaurav', ownerPhotoUrl: null },
];

const renderScreen = () => render(<LeaderboardScreen navigation={mockNavigation} />);

describe('LeaderboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLeaderboard.mockReturnValue({ data: ENTRIES, isLoading: false, isError: false, refetch: jest.fn(), isRefetching: false });
  });

  it('follows the website: hero, tabs and the scoring chips', () => {
    const { getByText } = renderScreen();

    expect(getByText("🏆 India's most adventurous pet leaderboard")).toBeTruthy();
    expect(getByText('Travelling Tails Leaderboard')).toBeTruthy();
    expect(getByText('This week')).toBeTruthy();
    expect(getByText('This month')).toBeTruthy();
    expect(getByText('All time')).toBeTruthy();
    expect(getByText('4+')).toBeTruthy();
    expect(getByText('pets competing')).toBeTruthy();
    expect(getByText('10 pts')).toBeTruthy();
    expect(getByText('+5 pts')).toBeTruthy();
    expect(getByText('6/week')).toBeTruthy();
  });

  it('loads the week by default and switches the time window with the tabs', () => {
    const { getByText } = renderScreen();

    expect(mockLeaderboard).toHaveBeenLastCalledWith('week', 20);
    fireEvent.press(getByText('This month'));
    expect(mockLeaderboard).toHaveBeenLastCalledWith('month', 20);
    fireEvent.press(getByText('All time'));
    expect(mockLeaderboard).toHaveBeenLastCalledWith('all', 20);
  });

  it("shows the podium, the full rankings and each pet's rank, points and stamps", () => {
    const { getAllByText, getByText } = renderScreen();

    // The champion's crown, plus the Legendary Paws entry in the ladder
    expect(getAllByText('👑').length).toBe(2);
    expect(getAllByText('Apple').length).toBe(2);
    expect(getAllByText('Captain').length).toBe(2);
    expect(getAllByText('Kimchi').length).toBe(2);
    expect(getByText('Full rankings')).toBeTruthy();
    // 4th place appears in the list only
    expect(getAllByText('Rustie').length).toBe(1);
    expect(getAllByText('965').length).toBeGreaterThanOrEqual(1);
    expect(getByText('🐾 20')).toBeTruthy();
    expect(getAllByText('🏔️ Roaming Ranger').length).toBeGreaterThanOrEqual(1);
    // Medals for the first three rows (🥇 also appears for Top Dog in the ladder)
    expect(getAllByText('🥇').length).toBe(2);
    expect(getByText('🥈')).toBeTruthy();
    expect(getByText('🥉')).toBeTruthy();
  });

  it("opens a pet's traveller page inside the app without the website chrome", () => {
    const { getAllByText } = renderScreen();

    fireEvent.press(getAllByText('Rustie')[0]);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('InAppBrowserScreen', {
      url: `${WEB_BASE_URL}/traveller/rustie-sikarwar`,
      title: 'Rustie',
      hideSelectors: expect.arrayContaining(['header', '.pfp-chat-wrapper']),
    });
  });

  it('opens social links outside the app', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getAllByLabelText } = renderScreen();

    fireEvent.press(getAllByLabelText('instagram travelwithtails')[0]);

    expect(openURL).toHaveBeenCalledWith('https://instagram.com/travelwithtails');
    openURL.mockRestore();
  });

  it('shows the empty state with a way to find places', () => {
    mockLeaderboard.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: jest.fn() });
    const { getByText, getAllByText } = renderScreen();

    expect(getByText('0+')).toBeTruthy();
    expect(getByText('Be the first to write a review and earn points!')).toBeTruthy();

    fireEvent.press(getAllByText('Find places to visit 🗺️')[0]);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainTabs', { screen: 'Explore' });
  });

  it('shows a loader while loading and a retry when loading fails', () => {
    mockLeaderboard.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: jest.fn() });
    const loading = renderScreen();
    expect(loading.getByText('Loading the leaderboard…')).toBeTruthy();
    loading.unmount();

    const refetch = jest.fn();
    mockLeaderboard.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });
    const failed = renderScreen();
    expect(failed.getByText('Could not load the leaderboard')).toBeTruthy();
    fireEvent.press(failed.getByText('Try again'));
    expect(refetch).toHaveBeenCalled();
  });

  it('lists the rank ladder with the point thresholds', () => {
    const { getByText } = renderScreen();

    expect(getByText('Rank ladder 🐾')).toBeTruthy();
    expect(getByText('Paw Wanderer')).toBeTruthy();
    expect(getByText('0 pts')).toBeTruthy();
    expect(getByText('Legendary Paws')).toBeTruthy();
    expect(getByText('3500 pts')).toBeTruthy();
  });

  it('maps points to the right rank', () => {
    expect(rankFor(0).name).toBe('Paw Wanderer');
    expect(rankFor(19).name).toBe('Paw Wanderer');
    expect(rankFor(20).name).toBe('Tail Hopper');
    expect(rankFor(965).name).toBe('Roaming Ranger');
    expect(rankFor(3500).name).toBe('Legendary Paws');
    expect(rankFor(99999).name).toBe('Legendary Paws');
  });

  it('has how it works and an expandable FAQ', () => {
    const { getByText, queryByText } = renderScreen();

    expect(queryByText('Ready to climb the board?')).toBeNull();

    expect(getByText('How it works')).toBeTruthy();
    expect(getByText('Register your pet')).toBeTruthy();

    expect(queryByText(/Legendary Paws requires 3,500 points/)).toBeNull();
    fireEvent.press(getByText('How many points do I need to reach the top rank?'));
    expect(getByText(/Legendary Paws requires 3,500 points/)).toBeTruthy();
  });

  it('goes back from the header button', () => {
    const { getByLabelText } = renderScreen();

    fireEvent.press(getByLabelText('Back'));
    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
