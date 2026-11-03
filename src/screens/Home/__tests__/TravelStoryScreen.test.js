import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TravelStoryScreen } from '../TravelStoryScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const mockRoute = {
  params: {},
};

const MOCK_API_STORIES = [
  {
    id: 45,
    slug: 'gurgaon-to-jabalpur-road-trip-dogs',
    title: 'Gurgaon to Jabalpur with Dogs: 850 km and One Overnight Drive',
    excerpt:
      'Two expressway stops, a Husky encounter at 10:30 PM, and Apple and Kimchi’s first Nani Ghar visit at dawn',
    destination: 'Jabalpur, Madhya Pradesh',
    story_type: 'Road Trips',
    cover_image_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9',
    body: '<p>Driving 850 km with three dogs sounds daunting until you hit the Delhi-Mumbai expressway.</p>',
    dogs_involved: ['Apple', 'Captain', 'Kimchi'],
    tags: ['parenting tip', 'expressway guide'],
    author_name: 'Ekta and Akash',
    parent_tips: [
      {
        id: 'pt-1',
        heading: 'Schedule Expressway Stops',
        text: 'Schedule expressway stops every 3.5 hours for hydration and potty breaks.',
      },
    ],
    timeline_stops: [
      {
        id: 's1',
        badge: 'Start',
        location: 'Gurgaon',
        time: '5:26 PM',
        sub: '850 km overnight',
        body: 'We left Gurgaon.',
      },
    ],
  },
  {
    id: 43,
    slug: 'apple-goa-express-first-ac',
    title: 'Apple on the Goa Express: 27 Hours in First AC',
    excerpt: 'Booking a 2-berth coupe in Indian Railways First AC with a dog.',
    destination: 'Pune to Delhi',
    story_type: 'Train Journeys',
    cover_image_url: 'https://images.unsplash.com/photo-1544568100-847a948585b9',
    body: '<p>Taking a dog on Indian Railways in First AC coupe.</p>',
    dogs_involved: ['Apple'],
    parent_tips: [
      {
        id: 'pt-2',
        heading: 'Book 2-berth coupe',
        text: 'Always carry the vet vaccination book.',
      },
    ],
  },
];

jest.mock('../../../hooks/useDiscovery', () => ({
  useHomeData: () => ({
    data: {
      stories: [
        {
          id: 101,
          slug: 'api-story-shimla',
          title: 'Snowy Shimla with Oliver',
          excerpt: 'Scenic colonial walks and pet-welcoming apple orchards.',
          destination: 'Shimla, HP',
          story_type: 'Train Journeys',
          cover_image_url: 'https://example.com/shimla.jpg',
          author_name: 'Rahul Sen',
        },
      ],
    },
  }),
  useTravelStories: () => ({
    data: MOCK_API_STORIES,
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  resolveImageUrl: url => url || '',
}));

describe('TravelStoryScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders top navigation bar and title matching design', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('TRAVEL WITH TAILS')).toBeTruthy();
    expect(getByText('Stories')).toBeTruthy();
  });

  it('renders hero banner and storyteller pack', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('REAL JOURNEYS ACROSS INDIA')).toBeTruthy();
    expect(getByText(/Stories from/)).toBeTruthy();
    expect(getByText('The travelling pack')).toBeTruthy();
  });

  it('renders category filter chips matching design', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('All Stories')).toBeTruthy();
    expect(getByText('Road Trips')).toBeTruthy();
    expect(getByText('Water Play')).toBeTruthy();
    expect(getByText('Pet Friendly Stays')).toBeTruthy();
    expect(getByText('Pet Parenting Tips')).toBeTruthy();
  });

  it('renders featured journey and latest stories sections', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('EDITOR’S PICK')).toBeTruthy();
    expect(getByText('Featured journey')).toBeTruthy();
    expect(getByText(/Gurgaon to Jabalpur with Dogs/)).toBeTruthy();

    expect(getByText('FRESH FROM THE PACK')).toBeTruthy();
    expect(getByText('Latest stories')).toBeTruthy();
    expect(getByText(/Apple on the Goa Express/)).toBeTruthy();
  });

  it('renders meet your storytellers and notification banner', () => {
    const { getByText, getAllByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    expect(getByText('MEET YOUR STORYTELLERS')).toBeTruthy();
    expect(getByText('Three dogs. One very well-used car.')).toBeTruthy();
    expect(getAllByText('Apple').length).toBeGreaterThan(0);
    expect(getAllByText('Captain').length).toBeGreaterThan(0);
    expect(getAllByText('Kimchi').length).toBeGreaterThan(0);

    expect(getByText('TRAVEL WITH THE PACK')).toBeTruthy();
    expect(getByText('New roads, honest notes.')).toBeTruthy();
    expect(getByText('Notify me')).toBeTruthy();
  });

  it('opens reader modal when a story card is pressed', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    const featuredStory = getByText(/Gurgaon to Jabalpur with Dogs/);
    fireEvent.press(featuredStory);

    expect(getByText(/Pack Tips & Must-Knows/)).toBeTruthy();
  });

  it('toggles notification button state when pressed', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    const notifyBtn = getByText('Notify me');
    fireEvent.press(notifyBtn);

    expect(getByText('Notified! ✓')).toBeTruthy();
  });

  it('filters stories when category tab is pressed using website matching rules', () => {
    const { getByText } = render(
      <TravelStoryScreen navigation={mockNavigation} route={mockRoute} />
    );

    // Click 'Road Trips'
    fireEvent.press(getByText('Road Trips'));
    expect(getByText(/Gurgaon to Jabalpur with Dogs/)).toBeTruthy();

    // Click 'Pet Parenting Tips' (Story 45 has 'parenting tip' in tags)
    fireEvent.press(getByText('Pet Parenting Tips'));
    expect(getByText(/Gurgaon to Jabalpur with Dogs/)).toBeTruthy();

    // Click 'Apple (The Golden Retriever)'
    fireEvent.press(getByText(/Apple \(The Golden Retriever\)/));
    expect(getByText(/Gurgaon to Jabalpur with Dogs/)).toBeTruthy();
  });
});
