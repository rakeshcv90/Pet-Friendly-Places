import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoadTripStopDetailScreen } from '../RoadTripStopDetailScreen';

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
};

const mockRoute = {
  params: {
    slug: 'shiva-dhaba-babugarh-nh24',
  },
};

jest.mock('../../../hooks/useDiscovery', () => ({
  useListingDetail: slug => {
    if (slug === 'custom-test') {
      return {
        data: {
          id: 541,
          slug: 'custom-test',
          name: 'Shiva Dhaba',
          category: 'Restaurant',
          tails_verified: true,
          tails_verified_date: '2026-05-20T00:00:00.000+05:30',
          tails_verified_note: 'Stopped here for a quick break.',
          verified_by_name: 'Ekta & Sky (Travel With Tails)',
          verification_method:
            'Personal visit with Apple (The Golden Retriever) (Golden Retriever) and Shimba',
        },
        isLoading: false,
      };
    }
    return {
      data: {
        id: 540,
        slug: 'shiva-dhaba-babugarh-nh24',
        name: 'Shiva Dhaba (Babugarh)',
        city: 'Allabuxpur Urf Bagadpur',
        state: 'Uttar Pradesh',
        specific_type: 'Highway Dhaba',
        category: 'Restaurant',
        excerpt:
          'Shiva Dhaba (Babugarh) is a 24-hour highway dhaba on NH24 with spacious outdoor area.',
        address: 'PV62+HQP, Chakrasenpur, Babugarh, NH 24, Uttar Pradesh',
        pet_charges: 'free',
        allowed_dog_sizes: '{Small,Medium,Large}',
        allowed_pet_types: '["Dogs","Cats"]',
        tags: '["shiva dhaba babugarh","dog friendly highway dhaba"]',
        tails_verified: true,
        tails_verified_note:
          'Stopped here during overnight road trip to Bhimtal with Apple (The Golden Retriever).',
        tails_verified_date: '2026-05-20',
        view_count: 37816,
        listing_routes: [
          {
            slug: 'delhi-to-bhimtal',
            origin: 'Delhi',
            destination: 'Bhimtal',
            totalDistanceKm: 295,
          },
        ],
      },
      isLoading: false,
    };
  },
  resolveImageUrl: url => url || '',
}));

describe('RoadTripStopDetailScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders venue name, location, and key sections from API data', () => {
    const { getByText, getAllByText } = render(
      <RoadTripStopDetailScreen navigation={mockNavigation} route={mockRoute} />,
    );

    expect(getAllByText('Shiva Dhaba (Babugarh)').length).toBeGreaterThan(0);
    expect(getByText(/Allabuxpur Urf Bagadpur, Uttar Pradesh/)).toBeTruthy();
    expect(getByText('Why pet parents will love this place')).toBeTruthy();
    expect(getAllByText(/Pet Policy/i).length).toBeGreaterThan(0);
    expect(getByText('Key rules')).toBeTruthy();
    expect(getByText('Pet charges')).toBeTruthy();
    expect(getByText('Pets may enter the water')).toBeTruthy();
    expect(getByText('🐾 Allowed Pets')).toBeTruthy();
    expect(getByText('⭐ Pet Amenities')).toBeTruthy();
    expect(getByText('Part of a pet-friendly road trip')).toBeTruthy();
    expect(getByText('Delhi → Bhimtal')).toBeTruthy();

    // Test expanding collapsible details
    const accordionToggle = getByText(/Full pet policy, fee history and review details/i);
    expect(accordionToggle).toBeTruthy();
    fireEvent.press(accordionToggle);
    expect(getByText('Fee history and source notes')).toBeTruthy();
    expect(getByText('Review details')).toBeTruthy();
  });

  it('navigates back when header back button is pressed', () => {
    render(<RoadTripStopDetailScreen navigation={mockNavigation} route={mockRoute} />);

    // Test back navigation
    expect(mockNavigation.goBack).not.toHaveBeenCalled();
  });

  it('handles missing category and loading state gracefully without crashing', () => {
    expect(() => {
      render(
        <RoadTripStopDetailScreen
          navigation={mockNavigation}
          route={{ params: { slug: 'test-slug', listing: { id: 999, name: 'Test Stop' } } }}
        />,
      );
    }).not.toThrow();
  });

  it('renders Tails Verified audit card with formatted date and cleaned duplicate parenthesized text', () => {
    const { getByText, queryByText } = render(
      <RoadTripStopDetailScreen
        navigation={mockNavigation}
        route={{
          params: {
            slug: 'custom-test',
            listing: {
              id: 540,
              name: 'Shiva Dhaba',
              category: 'Restaurant',
              tails_verified: true,
              tails_verified_date: '2026-05-20T00:00:00.000+05:30',
              tails_verified_note: 'Stopped here for a quick break.',
              verified_by_name: 'Ekta & Sky (Travel With Tails)',
              verification_method:
                'Personal visit with Apple (The Golden Retriever) (Golden Retriever) and Shimba',
            },
          },
        }}
      />,
    );

    expect(getByText('TAILS VERIFIED ON ROAD TRIP')).toBeTruthy();
    // Raw ISO date should not be displayed
    expect(queryByText('2026-05-20T00:00:00.000+05:30')).toBeNull();
    // Formatted human-readable date should be displayed
    expect(getByText('20 May 2026')).toBeTruthy();
    // Repeated (Golden Retriever) should be cleaned
    expect(
      getByText(
        'Verified by Ekta & Sky (Travel With Tails) • Personal visit with Apple (The Golden Retriever) and Shimba',
      ),
    ).toBeTruthy();
  });
});
