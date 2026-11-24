import React from 'react';
import { Linking } from 'react-native';
import { Animated } from 'react-native';
import { render, fireEvent, within, act } from '@testing-library/react-native';
import { StoryDetailScreen, toBlocks, breedsFromFacts, SCORE_COLORS, NOTE_LIPS, tipParts, travellersOf, textOf } from '../StoryDetailScreen';
import { useStore } from '../../../store';

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

// What the live "Dehradun with Apple, Captain and Kimchi" story sends: a warning box and embeds
// inside the body, photos on each stop, dogs by name only, and a description on every place
const BODY =
  '<p><strong>Four days.</strong> That is how long it took.</p>' +
  '<h3>Stairway To Heaven</h3><p>We booked it that evening.</p>' +
  '<div style="display:flex;"><div><iframe src="https://www.instagram.com/p/DZ5qY9VzisW/embed/" width="320" height="568"></iframe></div></div>' +
  '<div class="brush-callout coral">\n  <div class="brush-title">⚠️ One waterfall to skip with dogs</div>\n' +
  '  <div class="brush-body">Kimadi waterfall is not good for dogs — rocky, crowded access.</div>\n</div>' +
  '<div style="margin:24px 0;"><iframe width="100%" height="380" src="https://www.youtube.com/embed/8nUoeONiCH4" title="Dehradun Waterfalls + Stairway To Heaven Day Tour" frameborder="0"></iframe></div>' +
  '<p>Back on the road.</p>';

const dehradun = over => ({
  id: 9,
  slug: 'dehradun-with-apple-captain-kimchi',
  title: 'Dehradun with Apple, Captain and Kimchi',
  destination: 'Dehradun, Uttarakhand',
  trip_cost: '20K INR',
  km_one_way: '214',
  drive_hours: '4.5',
  road_stops: '3',
  reality_scores: { dog_happiness: 8, crowd_level: 6 },
  dogs_involved: ['Apple', 'Captain', 'Kimchi'],
  dog_cards: [],
  body: BODY,
  related_listings: [
    {
      id: 1,
      slug: 'jaldi-road-diner',
      name: 'Jaldi Road Diner (Bijrol)',
      city: 'Bijrol',
      state: 'Uttar Pradesh',
      excerpt: 'A pet-friendly road stop on the expressway with outdoor seating and parking.',
    },
  ],
  timeline_stops: [
    {
      id: 'd2',
      location: 'Shahi Baithak NH-75',
      time: '9:09 PM · Stop 1',
      body: 'Around the 90km mark the dogs needed out.',
      pros: [],
      cons: [],
      quote: { text: '', source: '' },
      highlights: [],
      photos: [
        { url: '/api/storage/a', kind: 'image', caption: '' },
        { url: '/api/storage/b', kind: 'video', caption: '' },
      ],
    },
  ],
  gallery_media: [
    { id: 'g1', url: '/api/storage/1', kind: 'image' },
    { id: 'g2', url: '/api/storage/2', kind: 'image' },
    { id: 'g3', url: '/api/storage/3', kind: 'video' },
  ],
  ...over,
});

describe('story body', () => {
  it('keeps the warning box, with its title and text', () => {
    const blocks = toBlocks(BODY);

    expect(blocks.find(block => block.type === 'callout')).toEqual({
      type: 'callout',
      tone: 'coral',
      title: '⚠️ One waterfall to skip with dogs',
      text: 'Kimadi waterfall is not good for dogs — rocky, crowded access.',
    });
  });

  it('keeps an Instagram post and a YouTube video as embeds', () => {
    const embeds = toBlocks(BODY).filter(block => block.type === 'embed');

    expect(embeds).toEqual([
      expect.objectContaining({
        provider: 'instagram',
        url: 'https://www.instagram.com/p/DZ5qY9VzisW/',
      }),
      expect.objectContaining({
        provider: 'youtube',
        id: '8nUoeONiCH4',
        url: 'https://www.youtube.com/watch?v=8nUoeONiCH4',
        title: 'Dehradun Waterfalls + Stairway To Heaven Day Tour',
      }),
    ]);
  });

  it('keeps everything in the order it was written', () => {
    expect(toBlocks(BODY).map(block => block.type)).toEqual([
      'paragraph',
      'heading',
      'paragraph',
      'embed',
      'callout',
      'embed',
      'paragraph',
    ]);
  });

  it('reads an Instagram reel and a plain link', () => {
    const blocks = toBlocks(
      '<iframe src="https://www.instagram.com/reel/ABC123/embed/"></iframe><iframe src="https://example.com/x"></iframe>',
    );

    expect(blocks[0]).toMatchObject({ provider: 'instagram', url: 'https://www.instagram.com/reel/ABC123/' });
    expect(blocks[1]).toMatchObject({ provider: 'link', url: 'https://example.com/x' });
  });

  it('drops an iframe that has no address, and still reads a body with no tags', () => {
    expect(toBlocks('<iframe></iframe>')).toEqual([]);
    expect(toBlocks('Just words.')).toEqual([{ type: 'paragraph', text: 'Just words.' }]);
  });
});

describe('StoryDetailScreen: everything the website shows', () => {
  const open = over => {
    mockDetail = { data: dehradun(over), isLoading: false, isError: false, refetch: jest.fn() };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    Linking.openURL.mockRestore();
  });

  it('shows the warning box inside the story', () => {
    const { getByText, getByTestId } = open();

    expect(getByTestId('story-callout')).toBeTruthy();
    expect(getByText('⚠️ One waterfall to skip with dogs')).toBeTruthy();
    expect(getByText(/Kimadi waterfall is not good for dogs/)).toBeTruthy();
  });

  it('opens the Instagram post and the YouTube video from their cards', () => {
    const { getByTestId } = open();

    fireEvent.press(getByTestId('story-embed-DZ5qY9VzisW'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.instagram.com/p/DZ5qY9VzisW/');

    fireEvent.press(getByTestId('story-embed-8nUoeONiCH4'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=8nUoeONiCH4');
  });

  it('names the YouTube video on its card', () => {
    const { getByText } = open();

    expect(getByText('Dehradun Waterfalls + Stairway To Heaven Day Tour')).toBeTruthy();
  });

  it("shows a stop's photos and videos, and opens them in the viewer", () => {
    const { getByTestId, queryByTestId } = open();
    expect(getByTestId('story-stop-photos-0')).toBeTruthy();
    expect(queryByTestId('gallery-viewer')).toBeNull();

    fireEvent.press(getByTestId('story-stop-photo-d2-photo-1'));

    expect(getByTestId('gallery-viewer')).toBeTruthy();
    fireEvent.press(getByTestId('gallery-viewer-close'));
    expect(queryByTestId('gallery-viewer')).toBeNull();
  });

  it('shows no photo strip for a stop without photos', () => {
    const { queryByTestId } = open({
      timeline_stops: [{ id: 'x', location: 'No photos here', photos: [] }],
    });

    expect(queryByTestId('story-stop-photos-0')).toBeNull();
  });

  it('shows the description of each place', () => {
    const { getByText } = open();

    expect(getByText('A pet-friendly road stop on the expressway with outdoor seating and parking.')).toBeTruthy();
  });

  it('shows the dogs by name when the story has no dog cards, with the website note', () => {
    const { getByText, getByTestId } = open();

    expect(getByTestId('story-crew')).toBeTruthy();
    expect(getByText('Apple')).toBeTruthy();
    expect(getByText('Captain')).toBeTruthy();
    expect(getByText('Kimchi')).toBeTruthy();
    expect(String(getByTestId('story-crew-note').props.children)).toMatch(
      /Dog details for this story are still being verified/,
    );
  });

  it('uses the dog cards, and no note, when the story has them', () => {
    const { queryByTestId, getByText } = open({
      dog_cards: [{ id: 'a', name: 'Apple', breed: 'Golden Retriever' }],
    });

    expect(queryByTestId('story-crew')).toBeNull();
    expect(queryByTestId('story-crew-note')).toBeNull();
    expect(getByText('Apple · Golden Retriever')).toBeTruthy();
  });

  it('shows no crew at all when the story names no dogs', () => {
    const { queryByTestId } = open({ dogs_involved: [], dog_cards: [] });

    expect(queryByTestId('story-crew')).toBeNull();
  });

  it('shows four headline numbers, so dog happiness is not cut off', () => {
    const { getByText, getAllByText } = open();

    expect(getByText('TRIP COST')).toBeTruthy();
    expect(getByText('DISTANCE')).toBeTruthy();
    expect(getByText('DRIVE')).toBeTruthy();
    expect(getByText('DOG HAPPINESS')).toBeTruthy();
    // Once in the numbers bar, once in the Reality Score list
    expect(getAllByText('8/10')).toHaveLength(2);
  });

  it('counts the photos and videos in the gallery', () => {
    const { getByTestId } = open();

    expect(getByTestId('story-gallery-count').props.children).toBe('2 photos & 1 video');
  });

  it('shows a stop quote with who said it', () => {
    const { getByText, getByTestId } = open({
      timeline_stops: [
        {
          id: 'q',
          location: 'River',
          quote: { text: 'Best day ever', source: 'Apple' },
          photos: [],
        },
      ],
    });

    expect(getByTestId('story-stop-quote-0')).toBeTruthy();
    expect(getByText('“Best day ever”')).toBeTruthy();
    expect(getByText('— Apple')).toBeTruthy();
  });

  it('shows no quote when the API sends an empty one', () => {
    const { queryByTestId } = open();

    expect(queryByTestId('story-stop-quote-0')).toBeNull();
  });
});

describe('StoryDetailScreen: "The little details that stay with you"', () => {
  const FACTS = [
    { id: 'f1', icon: '📍', label: 'ROUTE', value: 'Gurgaon to Dehradun (214 km)' },
    { id: 'f2', icon: '⏱️', label: 'DRIVE TIME', value: '~4.5 hours one way' },
    { id: 'f3', icon: '🐕', label: 'DOGS ON THIS TRIP', value: 'Apple (Golden Retriever), Captain (Indie), Kimchi (Black Retriever)' },
    { id: 'f4', icon: '🏠', label: 'STAY', value: 'Stairway To Heaven, 500 flat/day' },
    { id: 'f5', icon: '🌊', label: 'BEST WATER SPOT', value: 'Maldevta Picnic Point' },
  ];
  const TIPS = [
    { id: 't1', heading: 'Fill up before the expressway', text: 'No fuel on the expressway.' },
    { id: 't2', heading: 'Book directly', text: 'Confirm the pet policy first.' },
  ];
  const STOPS = [
    { id: 's1', time: 'Evening · Departure', location: 'Gurgaon — Departure', body: 'The plan was simple.', badgeColor: 'amber', photos: [] },
    { id: 's2', time: '9:09 PM · Stop 1', location: 'Shahi Baithak NH-75', body: 'Around the 90km mark.', badgeColor: 'blue', photos: [] },
    { id: 's3', time: 'No text', location: 'Empty stop', body: '', photos: [] },
  ];

  const open = over => {
    mockDetail = {
      data: dehradun({
        excerpt: 'We searched four days for a stay.',
        quick_facts: FACTS,
        parent_tips: TIPS,
        timeline_stops: STOPS,
        ...over,
      }),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  it('has the website heading and its line under it', () => {
    const { getByText } = open();

    expect(getByText('The little details that stay with you')).toBeTruthy();
    expect(getByText(/A few recorded details from this journey/)).toBeTruthy();
  });

  it('shows the excerpt as "The short version"', () => {
    const { getByTestId } = open();
    const card = within(getByTestId('story-short-version'));

    expect(card.getByText('THE SHORT VERSION')).toBeTruthy();
    expect(card.getByText('We searched four days for a stay.')).toBeTruthy();
  });

  it('shows each stop as a note labelled with its time and place', () => {
    const { getByTestId } = open();

    expect(within(getByTestId('story-note-0')).getByText('EVENING · DEPARTURE · GURGAON — DEPARTURE')).toBeTruthy();
    expect(within(getByTestId('story-note-0')).getByText('The plan was simple.')).toBeTruthy();
    expect(within(getByTestId('story-note-1')).getByText('9:09 PM · STOP 1 · SHAHI BAITHAK NH-75')).toBeTruthy();
  });

  it('leaves out a stop that has no text', () => {
    const { queryByTestId, queryByText } = open();

    expect(queryByTestId('story-note-2')).toBeNull();
    expect(queryByText(/EMPTY STOP/)).toBeNull();
  });

  it('colours a note by the colour of its stop', () => {
    const { getByTestId } = open();
    const background = id =>
      Object.assign({}, ...[].concat(getByTestId(id).props.style).flat()).backgroundColor;

    expect(background('story-note-0')).toBe('#FEF3C7');
    expect(background('story-note-1')).toBe('#DBEAFE');
  });

  it('pins the first four facts only', () => {
    const { getByTestId } = open();
    const pinned = within(getByTestId('story-pinned'));

    expect(pinned.getByText('PIN THIS PAGE')).toBeTruthy();
    expect(pinned.getByText('ROUTE')).toBeTruthy();
    expect(pinned.getByText('STAY')).toBeTruthy();
    expect(pinned.getByText('Gurgaon to Dehradun (214 km)')).toBeTruthy();
    expect(pinned.queryByText('BEST WATER SPOT')).toBeNull();
  });

  it('lists the dog-parent notes with their headings', () => {
    const { getByTestId } = open();
    const notes = within(getByTestId('story-parent-notes'));

    expect(notes.getByText('DOG-PARENT NOTES')).toBeTruthy();
    expect(notes.getByText('Fill up before the expressway')).toBeTruthy();
    expect(notes.getByText('No fuel on the expressway.')).toBeTruthy();
    expect(notes.getByText('Book directly')).toBeTruthy();
  });

  it('leaves out the parts the story has no data for', () => {
    const { getByTestId, queryByTestId } = open({ excerpt: '', quick_facts: [], parent_tips: [] });

    expect(queryByTestId('story-short-version')).toBeNull();
    expect(queryByTestId('story-pinned')).toBeNull();
    expect(queryByTestId('story-parent-notes')).toBeNull();
    expect(getByTestId('story-note-0')).toBeTruthy();
  });

  it('is left out altogether when the story has nothing for it', () => {
    mockDetail = {
      data: { id: 2, slug: 'bare', title: 'Bare story', body: '<p>Only text.</p>' },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    const { queryByTestId, queryByText } = render(
      <StoryDetailScreen navigation={navigation} route={route} />,
    );

    expect(queryByTestId('story-details')).toBeNull();
    expect(queryByText('The little details that stay with you')).toBeNull();
  });

  it('puts the breeds next to the dog names', () => {
    const { getByText } = open();

    expect(getByText('Apple · Golden Retriever')).toBeTruthy();
    expect(getByText('Captain · Indie')).toBeTruthy();
    expect(getByText('Kimchi · Black Retriever')).toBeTruthy();
  });

  it('shows a dog name on its own when no breed is known', () => {
    const { getByText } = open({ quick_facts: [] });

    expect(getByText('Apple')).toBeTruthy();
  });
});

describe('breedsFromFacts', () => {
  it('reads names and breeds from the Dogs on this trip fact', () => {
    expect(
      breedsFromFacts([
        { label: 'ROUTE', value: 'A (B)' },
        { label: 'DOGS ON THIS TRIP', value: 'Apple (Golden Retriever), Captain (Indie), Kimchi (Black Retriever)' },
      ]),
    ).toEqual({ apple: 'Golden Retriever', captain: 'Indie', kimchi: 'Black Retriever' });
  });

  it('gives nothing when there is no such fact, or no breeds in it', () => {
    expect(breedsFromFacts([{ label: 'ROUTE', value: 'x' }])).toEqual({});
    expect(breedsFromFacts([{ label: 'DOGS', value: 'Apple, Captain' }])).toEqual({});
    expect(breedsFromFacts(undefined)).toEqual({});
  });
});

describe('StoryDetailScreen: a story with no cover image', () => {
  const NO_COVER = {
    id: 12,
    slug: 'caravan-on-rent-rishikesh-with-dogs',
    title: 'Delhi to Rishikesh in a Pet-Friendly Caravan',
    cover_image_url: '',
    og_image_url: null,
    gallery_media: [
      { id: 'c1', url: '/api/storage/first-photo', kind: 'image' },
      { id: 'c2', url: '/api/storage/second-photo', kind: 'image' },
    ],
  };

  const open = story => {
    mockDetail = { data: story, isLoading: false, isError: false, refetch: jest.fn() };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  it('uses the first gallery photo as the cover instead of the "No image" picture', () => {
    const { UNSAFE_getAllByType, getAllByText } = open(NO_COVER);
    const { Image } = require('react-native');
    const uris = UNSAFE_getAllByType(Image)
      .map(node => node.props.source?.uri)
      .filter(Boolean);

    // The cover is drawn, and the title sits over it in the hero
    expect(uris).toContain('https://example.com/api/storage/first-photo');
    expect(getAllByText('Delhi to Rishikesh in a Pet-Friendly Caravan').length).toBeGreaterThan(0);
  });

  it('still shows the placeholder when there is no picture anywhere', () => {
    const { UNSAFE_getAllByType } = open({ ...NO_COVER, gallery_media: [] });
    const { Image } = require('react-native');
    const uris = UNSAFE_getAllByType(Image)
      .map(node => node.props.source?.uri)
      .filter(Boolean);

    expect(uris.filter(uri => String(uri).includes('first-photo'))).toHaveLength(0);
  });
});

describe('StoryDetailScreen: Reality Score colours', () => {
  const SCORES = {
    dog_happiness: 9,
    adventure_score: 6,
    photo_worthy: 9,
    water_safety: 5,
    large_dog_friendly: 8,
    crowd_level: 2,
    road_quality: 7,
    puppy_friendly: 8,
    luxury_score: 4,
  };

  const open = scores => {
    mockDetail = {
      data: { id: 3, slug: 'scores', title: 'Scores story', reality_scores: scores },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  const styleOf = element => Object.assign({}, ...[].concat(element.props.style).flat());

  it("gives each score its own colour, like the website's bars", () => {
    const { getByTestId } = open(SCORES);

    expect(styleOf(getByTestId('score-fill-dog_happiness')).backgroundColor).toBe('#4FAF72');
    expect(styleOf(getByTestId('score-fill-adventure_score')).backgroundColor).toBe('#F2A340');
    expect(styleOf(getByTestId('score-fill-photo_worthy')).backgroundColor).toBe('#7B2CFF');
    expect(styleOf(getByTestId('score-fill-water_safety')).backgroundColor).toBe('#4DBBA5');
    expect(styleOf(getByTestId('score-fill-large_dog_friendly')).backgroundColor).toBe('#3B108F');
    expect(styleOf(getByTestId('score-fill-crowd_level')).backgroundColor).toBe('#F2A340');
    expect(styleOf(getByTestId('score-fill-road_quality')).backgroundColor).toBe('#6B7280');
  });

  it('colours the number the same as its bar', () => {
    const { getByTestId } = open(SCORES);

    Object.keys(SCORES).forEach(key => {
      expect(styleOf(getByTestId(`score-value-${key}`)).color).toBe(
        styleOf(getByTestId(`score-fill-${key}`)).backgroundColor,
      );
    });
  });

  it('is not one colour for every bar', () => {
    const { getByTestId } = open(SCORES);
    const colors = new Set(
      Object.keys(SCORES).map(key => styleOf(getByTestId(`score-fill-${key}`)).backgroundColor),
    );

    expect(colors.size).toBeGreaterThan(5);
  });

  it('has a colour for every score the story can have', () => {
    Object.keys(SCORES).forEach(key => expect(SCORE_COLORS[key]).toBeTruthy());
  });

  it('fills the bar to the score, out of ten', () => {
    const { getByTestId } = open({ dog_happiness: 9, crowd_level: 2 });

    expect(styleOf(getByTestId('score-fill-dog_happiness')).width).toBe('90%');
    expect(styleOf(getByTestId('score-fill-crowd_level')).width).toBe('20%');
  });

  it('uses purple for a score it has no colour for', () => {
    const { getByTestId } = open({ mystery_score: 5 });

    expect(styleOf(getByTestId('score-fill-mystery_score')).backgroundColor).toBe('#7B2CFF');
  });
});

describe('StoryDetailScreen: the notes look raised and move', () => {
  const STOPS = [
    { id: 'a', time: 'Evening', location: 'Gurgaon', body: 'First note.', badgeColor: 'amber', photos: [] },
    { id: 'b', time: '9 PM', location: 'Stop', body: 'Second note.', badgeColor: 'blue', photos: [] },
    { id: 'c', time: '11 PM', location: 'Arrival', body: 'Third note.', badgeColor: 'green', photos: [] },
  ];

  const open = () => {
    mockDetail = {
      data: { id: 5, slug: 'notes', title: 'Notes story', excerpt: 'In short.', timeline_stops: STOPS },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  const styleOf = element => Object.assign({}, ...[].concat(element.props.style).flat());

  afterEach(() => {
    useStore.setState({ isDarkMode: false });
  });

  it('gives every note a darker edge underneath and a shadow, so it looks 3D', () => {
    const { getByTestId } = open();

    ['story-short-version', 'story-note-0', 'story-note-1', 'story-note-2'].forEach(id => {
      const style = styleOf(getByTestId(id));
      expect(style.borderBottomWidth).toBe(4);
      expect(style.shadowOpacity).toBeGreaterThan(0);
      expect(style.elevation).toBeGreaterThan(0);
    });
  });

  it('uses a darker shade of the note colour for the edge', () => {
    const { getByTestId } = open();

    expect(styleOf(getByTestId('story-short-version')).borderBottomColor).toBe(NOTE_LIPS.pink);
    expect(styleOf(getByTestId('story-note-0')).borderBottomColor).toBe(NOTE_LIPS.amber);
    expect(styleOf(getByTestId('story-note-1')).borderBottomColor).toBe(NOTE_LIPS.blue);
    expect(styleOf(getByTestId('story-note-2')).borderBottomColor).toBe(NOTE_LIPS.green);
    expect(styleOf(getByTestId('story-note-0')).backgroundColor).not.toBe(NOTE_LIPS.amber);
  });

  it('has an edge colour for every note colour', () => {
    ['amber', 'blue', 'green', 'purple', 'gray', 'pink'].forEach(tone =>
      expect(NOTE_LIPS[tone]).toMatch(/^#[0-9A-F]{6}$/i),
    );
  });

  it('tilts the notes a hair, one way then the other', () => {
    const { getByTestId } = open();
    const tilt = id => styleOf(getByTestId(id)).transform[0].rotate;

    expect(tilt('story-short-version')).toBe('-0.5deg');
    expect(tilt('story-note-0')).toBe('0.5deg');
    expect(tilt('story-note-1')).toBe('-0.5deg');
  });

  it('floats each note at its own pace', () => {
    const timing = jest.spyOn(Animated, 'timing');
    open();

    const durations = timing.mock.calls.map(([, config]) => config.duration);
    // 2400, 2750 and 3100 ms: three different speeds repeating across the notes
    [2400, 2750, 3100].forEach(duration => expect(durations).toContain(duration));
    timing.mockRestore();
  });

  it('uses the dark note colours and a deep edge in dark mode', () => {
    act(() => {
      useStore.setState({ isDarkMode: true });
    });
    const { getByTestId } = open();
    const style = styleOf(getByTestId('story-note-0'));

    expect(style.backgroundColor).toBe('#27104B');
    expect(style.borderBottomColor).toBe('#4C1D95');
  });
});

// What the older "Jim Corbett with Apple, Captain and Kimchi" story sends: tips named title and
// description, and the dogs as dog_profiles (the website's "Meet the travellers") as well as dog_cards
describe('StoryDetailScreen: an older story with differently named fields', () => {
  const TIPS = [
    {
      id: 'pt-1',
      icon: '🌙',
      title: 'Night drives work — but only if planned properly',
      description: 'Driving at night meant cooler temperatures and calmer dogs.',
    },
    {
      id: 'pt-2',
      icon: '🐾',
      title: 'Do not rush the Gajraula stop',
      description: 'Kundan\'s Gajraula was almost an hour and that was the right call.',
    },
  ];
  const PROFILES = [
    {
      name: 'Apple (The Golden Retriever)',
      breed: 'Golden Retriever',
      age: '5 years',
      isLead: false,
      personality: 'Calm, wise and emotionally grounding.',
      highlight: 'Jumped straight into Kosi River.',
    },
    {
      name: 'Captain',
      breed: 'Indie Dog',
      age: '3 years',
      isLead: true,
      personality: 'Dramatic Nawab.',
      highlight: 'Stood in the open Rubicon boot.',
    },
  ];
  const CARDS = [
    {
      id: 'apple-may2026',
      name: 'Apple (The Golden Retriever)',
      breed: 'Golden Retriever',
      age: '5 years',
      emoji: '🐾',
      isLead: false,
      personality: 'Card personality text.',
      funny_moment: 'Card funny moment.',
    },
  ];

  const open = over => {
    mockDetail = {
      data: {
        id: 1,
        slug: 'jim-corbett',
        title: 'Jim Corbett with Apple, Captain and Kimchi',
        parent_tips: TIPS,
        dog_profiles: PROFILES,
        dog_cards: CARDS,
        timeline_stops: [{ id: 's', location: 'Start', body: 'We left.', photos: [] }],
        ...over,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  describe('tips named title and description', () => {
    it('shows the heading and the text of each tip in Pet Parent Tips', () => {
      const { getAllByText } = open();

      // Once in the dog-parent notes, once in Pet Parent Tips
      expect(getAllByText('Night drives work — but only if planned properly')).toHaveLength(2);
      expect(getAllByText('Driving at night meant cooler temperatures and calmer dogs.')).toHaveLength(2);
      expect(getAllByText('Do not rush the Gajraula stop')).toHaveLength(2);
    });

    it('shows them in the dog-parent notes too', () => {
      const { getByTestId } = open();
      const notes = within(getByTestId('story-parent-notes'));

      expect(notes.getByText('Do not rush the Gajraula stop')).toBeTruthy();
      expect(notes.getByText("Kundan's Gajraula was almost an hour and that was the right call.")).toBeTruthy();
    });

    it('still reads tips named heading and text', () => {
      const { getAllByText } = open({ parent_tips: [{ id: 'x', heading: 'New style', text: 'New style text.' }] });

      expect(getAllByText('New style')).toHaveLength(2);
      expect(getAllByText('New style text.')).toHaveLength(2);
    });

    it('reads a tip that is only a plain string', () => {
      const { getAllByText } = open({ parent_tips: ['Pack extra water.'] });

      expect(getAllByText('Pack extra water.').length).toBeGreaterThan(0);
    });
  });

  describe('Meet the travellers', () => {
    it('shows each dog with its breed and age, personality and highlight from the profiles', () => {
      const { getByText, getByTestId } = open();

      expect(getByText('Meet the travellers')).toBeTruthy();
      expect(getByTestId('story-travellers')).toBeTruthy();
      expect(getByText('Golden Retriever · 5 years')).toBeTruthy();
      expect(getByText('Calm, wise and emotionally grounding.')).toBeTruthy();
      expect(getByText('Jumped straight into Kosi River.')).toBeTruthy();
      expect(getByText('Indie Dog · 3 years')).toBeTruthy();
    });

    it('marks the lead dog and no other', () => {
      const { getAllByText, queryAllByTestId } = open();

      expect(getAllByText('Lead dog')).toHaveLength(1);
      expect(queryAllByTestId(/story-lead-/)).toHaveLength(1);
    });

    it('uses the dog cards when the story has no profiles', () => {
      const { getByText, queryByText } = open({ dog_profiles: [] });

      expect(getByText('Card personality text.')).toBeTruthy();
      expect(getByText('Card funny moment.')).toBeTruthy();
      expect(queryByText('Calm, wise and emotionally grounding.')).toBeNull();
    });

    it('is left out when the story has neither', () => {
      const { queryByTestId, queryByText } = open({ dog_profiles: [], dog_cards: [] });

      expect(queryByTestId('story-travellers')).toBeNull();
      expect(queryByText('Meet the travellers')).toBeNull();
    });
  });
});

describe('tipParts', () => {
  it('reads heading and text, or title and description', () => {
    expect(tipParts({ heading: 'H', text: 'T' })).toEqual({ icon: null, heading: 'H', text: 'T' });
    expect(tipParts({ icon: '🌙', title: 'Ti', description: 'De' })).toEqual({
      icon: '🌙',
      heading: 'Ti',
      text: 'De',
    });
  });

  it('prefers heading and text when both are there', () => {
    expect(tipParts({ heading: 'H', title: 'Ti', text: 'T', description: 'De' })).toMatchObject({
      heading: 'H',
      text: 'T',
    });
  });

  it('reads a plain string, and nothing', () => {
    expect(tipParts('Just words')).toEqual({ icon: null, heading: '', text: 'Just words' });
    expect(tipParts(undefined)).toEqual({ icon: null, heading: '', text: '' });
  });
});

describe('travellersOf', () => {
  it('prefers the dog profiles and uses the highlight as the moment', () => {
    expect(
      travellersOf({
        dog_profiles: [{ name: 'Apple', breed: 'Golden', age: '5 years', highlight: 'Swam' }],
        dog_cards: [{ name: 'Other' }],
      }),
    ).toEqual([
      {
        key: 'Apple',
        name: 'Apple',
        emoji: '🐾',
        lead: false,
        detail: 'Golden · 5 years',
        personality: '',
        moment: 'Swam',
      },
    ]);
  });

  it('falls back to the dog cards and their funny moment', () => {
    expect(travellersOf({ dog_cards: [{ id: 'c', name: 'Kimchi', emoji: '🐕', funny_moment: 'Splashed' }] })[0]).toMatchObject({
      key: 'c',
      name: 'Kimchi',
      emoji: '🐕',
      moment: 'Splashed',
    });
  });

  it('leaves out a dog with no name, and copes with nothing', () => {
    expect(travellersOf({ dog_profiles: [{ breed: 'Golden' }] })).toEqual([]);
    expect(travellersOf(undefined)).toEqual([]);
    expect(travellersOf({})).toEqual([]);
  });

  it('shows the breed alone when there is no age', () => {
    expect(travellersOf({ dog_cards: [{ name: 'A', breed: 'Indie' }] })[0].detail).toBe('Indie');
  });
});

// The real "The Den Corbett Resort & Spa" stop: its highlights are objects, not text
describe('StoryDetailScreen: a stop whose lists hold objects', () => {
  const DEN = {
    id: 'd5',
    time: '3 May 2026 · 5:06 AM',
    location: 'The Den Corbett Resort & Spa',
    sub: '2 nights · Superior family room',
    body: 'After almost 8 hours on the road, we arrived early.',
    highlights: [
      { type: 'star', label: 'Pet First rating' },
      { type: 'good', label: 'No pet charges' },
      { type: 'good', label: 'Pet-friendly pool' },
      { type: 'honest', label: 'Food is average' },
    ],
    pros: [
      'Pet-friendly infinity pool — One of very few in India.',
      'Large open lawn — Kimchi and Chiku had the best afternoon.',
    ],
    cons: ['Food not the highlight — Breakfast was not good.'],
    activityTags: ['Check in', 'Infinity pool'],
    quote: { text: 'Apple walked into that pool.', source: 'Apple at the infinity pool' },
    photos: [],
  };

  const open = over => {
    mockDetail = {
      data: { id: 8, slug: 'den', title: 'Den story', timeline_stops: [{ ...DEN, ...over }] },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    return render(<StoryDetailScreen navigation={navigation} route={route} />);
  };

  it('never prints "[object Object]"', () => {
    const { queryByText } = open();

    expect(queryByText(/\[object Object\]/)).toBeNull();
  });

  it('does not list the highlights, which the website does not show either', () => {
    const { queryByText } = open();

    expect(queryByText('Pet First rating')).toBeNull();
    expect(queryByText('Food is average')).toBeNull();
  });

  it('still shows the pros, the cons, the tags and the quote of the stop', () => {
    const { getByText } = open();

    expect(getByText('Pet-friendly infinity pool — One of very few in India.')).toBeTruthy();
    expect(getByText('Large open lawn — Kimchi and Chiku had the best afternoon.')).toBeTruthy();
    expect(getByText('Food not the highlight — Breakfast was not good.')).toBeTruthy();
    expect(getByText('Check in')).toBeTruthy();
    expect(getByText('Infinity pool')).toBeTruthy();
    expect(getByText('“Apple walked into that pool.”')).toBeTruthy();
    expect(getByText('— Apple at the infinity pool')).toBeTruthy();
  });

  it('reads a pro or a con that arrives as an object, by its label or text', () => {
    const { getByText, queryByText } = open({
      pros: [{ label: 'Has a pool' }, { text: 'Big lawn' }, { nothing: true }],
      cons: [{ title: 'Pricey' }],
    });

    expect(getByText('Has a pool')).toBeTruthy();
    expect(getByText('Big lawn')).toBeTruthy();
    expect(getByText('Pricey')).toBeTruthy();
    expect(queryByText(/\[object Object\]/)).toBeNull();
  });

  it('reads tags that arrive as objects', () => {
    const { getByText, queryByText } = open({ activityTags: [{ label: 'Night drive' }, 'Lawn'] });

    expect(getByText('Night drive')).toBeTruthy();
    expect(getByText('Lawn')).toBeTruthy();
    expect(queryByText(/\[object Object\]/)).toBeNull();
  });
});

describe('textOf', () => {
  it('returns text as it is', () => {
    expect(textOf('Plain')).toBe('Plain');
    expect(textOf(5)).toBe('5');
  });

  it('reads the words out of an object, whichever field holds them', () => {
    expect(textOf({ label: 'L' })).toBe('L');
    expect(textOf({ text: 'T' })).toBe('T');
    expect(textOf({ title: 'Ti' })).toBe('Ti');
    expect(textOf({ name: 'N' })).toBe('N');
    expect(textOf({ label: 'L', text: 'T' })).toBe('L');
  });

  it('gives nothing for an object with no words, or for nothing', () => {
    expect(textOf({ type: 'star' })).toBe('');
    expect(textOf(null)).toBe('');
    expect(textOf(undefined)).toBe('');
  });
});

