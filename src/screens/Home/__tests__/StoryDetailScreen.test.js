import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StoryDetailScreen } from '../StoryDetailScreen';

const mockStory = {
  id: 45,
  slug: 'gurgaon-to-jabalpur-road-trip-dogs',
  title: 'Gurgaon to Jabalpur with Dogs',
  excerpt: 'We drove 850km overnight.',
  destination: 'Jabalpur, Madhya Pradesh',
  travel_date: '2026-07-29',
  vehicle: 'Jeep Wrangler Rubicon',
  trip_cost: '₹20K INR',
  view_count: 7,
  body: '<p>We left Gurgaon at 5:26pm.</p><h2>Arrival: Nani Ghar</h2><p>We pulled into Vijay Nagar.</p>',
  related_listings: [
    { id: 1, slug: 'leela-homestay-jabalpur', name: 'Leela Homestay (Jabalpur)', city: 'Jabalpur', state: 'Madhya Pradesh', tails_verified: true },
  ],
  timeline_stops: [
    {
      id: 's1',
      badge: 'Start',
      badgeColor: 'purple',
      time: '29 Jul 2026 · 5:26 PM',
      location: 'Departure — Green Heritage, Gurgaon',
      body: 'We left Gurgaon.',
      pros: ['Night drive means cooler car'],
      cons: ['Fill tank at Gurgaon'],
      dogMoments: { apple: 'Settled immediately.' },
      activityTags: ['Night departure'],
      linkedListingSlug: 'leela-homestay-jabalpur',
    },
  ],
  quick_facts: [{ id: 'q1', icon: '🚗', label: 'VEHICLE', value: 'Jeep Wrangler Rubicon' }],
  reality_scores: { dog_happiness: 10, amenities_on_road: 2 },
  parent_tips: [{ id: 'p1', heading: 'Fill the tank', text: 'Fill completely.' }],
  gallery_media: [
    { id: 'g1', url: '/api/storage/a', kind: 'image', caption: 'Packing in Gurgaon' },
    { id: 'v1', url: '/api/storage/v', kind: 'video', caption: null },
  ],
};

let mockDetail = { data: mockStory, isLoading: false, isError: false, refetch: jest.fn() };
jest.mock('../../../hooks/useDiscovery', () => ({
  useTravelStory: () => mockDetail,
  resolveImageUrl: url => (url ? `https://example.com${url}` : ''),
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const route = { params: { slug: 'gurgaon-to-jabalpur-road-trip-dogs' } };

describe('StoryDetailScreen', () => {
  beforeEach(() => {
    mockDetail = { data: mockStory, isLoading: false, isError: false, refetch: jest.fn() };
    navigation.navigate.mockClear();
  });

  it('shows the story, places, timeline, facts, scores and tips from the API', () => {
    const { getByText, getAllByText, queryByText } = render(
      <StoryDetailScreen navigation={navigation} route={route} />
    );

    // The title is in the hero and again in the header bar that fades in on scroll
    expect(getAllByText('Gurgaon to Jabalpur with Dogs').length).toBeGreaterThan(0);
    expect(getByText('Places in this story')).toBeTruthy();
    expect(getByText('Leela Homestay (Jabalpur)')).toBeTruthy();
    expect(getByText('Arrival: Nani Ghar')).toBeTruthy();
    expect(getByText('Journey Timeline')).toBeTruthy();
    expect(getByText('Start')).toBeTruthy();
    expect(getByText('Settled immediately.')).toBeTruthy();
    expect(getByText('Night drive means cooler car')).toBeTruthy();
    expect(getByText('Quick Facts')).toBeTruthy();
    expect(getByText('Reality Score')).toBeTruthy();
    expect(getAllByText('10/10').length).toBeGreaterThan(0);
    expect(queryByText(/Amenities/)).toBeNull();
    expect(getByText('Pet Parent Tips')).toBeTruthy();
    expect(getByText('Photo Gallery')).toBeTruthy();
  });

  it('shows a gallery video as a thumbnail with a play mark', () => {
    const { getByTestId } = render(<StoryDetailScreen navigation={navigation} route={route} />);
    expect(getByTestId('gallery-thumb-v1')).toBeTruthy();
  });

  it('opens a gallery photo or video in full screen and closes it', () => {
    const { getByTestId, queryByTestId } = render(
      <StoryDetailScreen navigation={navigation} route={route} />
    );
    expect(queryByTestId('gallery-viewer')).toBeNull();

    fireEvent.press(getByTestId('gallery-item-v1'));
    expect(getByTestId('gallery-viewer')).toBeTruthy();

    fireEvent.press(getByTestId('gallery-viewer-close'));
    expect(queryByTestId('gallery-viewer')).toBeNull();

    fireEvent.press(getByTestId('gallery-item-g1'));
    expect(getByTestId('gallery-viewer')).toBeTruthy();
  });

  it('opens the place when a place card is pressed', () => {
    const { getByText } = render(<StoryDetailScreen navigation={navigation} route={route} />);
    fireEvent.press(getByText('Leela Homestay (Jabalpur)'));
    expect(navigation.navigate).toHaveBeenCalledWith('ListingDetailScreen', {
      slug: 'leela-homestay-jabalpur',
    });
  });

  it('skips sections a story has no data for', () => {
    mockDetail = {
      data: { id: 1, slug: 'plain', title: 'A plain story', body: '<p>Just text.</p>' },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    const { getAllByText, queryByText } = render(
      <StoryDetailScreen navigation={navigation} route={route} />
    );
    expect(getAllByText('A plain story').length).toBeGreaterThan(0);
    expect(queryByText('Journey Timeline')).toBeNull();
    expect(queryByText('Places in this story')).toBeNull();
    expect(queryByText('Reality Score')).toBeNull();
    expect(queryByText('Photo Gallery')).toBeNull();
  });

  it('goes back from the back button', () => {
    const { getByTestId } = render(<StoryDetailScreen navigation={navigation} route={route} />);
    fireEvent.press(getByTestId('story-back'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
