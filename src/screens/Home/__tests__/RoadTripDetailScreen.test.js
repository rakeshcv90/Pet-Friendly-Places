import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoadTripDetailScreen } from '../RoadTripDetailScreen';

let mockDetail;
jest.mock('../../../hooks/useDiscovery', () => ({
  useRoadTripDetail: () => mockDetail,
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const route = { params: { slug: 'delhi-to-pune' } };

const detail = faq => ({
  data: {
    route: {
      slug: 'delhi-to-pune',
      h1: 'Delhi to Pune with a Dog (NH48)',
      origin_city: 'Delhi',
      destination_city: 'Pune',
      origin_state: 'Delhi',
      destination_state: 'Maharashtra',
      total_distance_km: 1700,
      est_drive_hours: 32,
      intro_markdown: 'The drive runs through Jaipur and Udaipur.',
      faq_markdown: faq,
    },
    stops: [],
  },
  isLoading: false,
  refetch: jest.fn(),
  isRefetching: false,
});

const open = faq => {
  mockDetail = detail(faq);
  return render(<RoadTripDetailScreen navigation={navigation} route={route} />);
};

describe('RoadTripDetailScreen: Frequently asked', () => {
  it('shows the questions of a route that writes them as headings, like Delhi to Pune', () => {
    const { getByText } = open(
      '### How often should you stop with a dog on a long car ride?\nEvery 2 to 3 hours.\n\n### Is it safe to leave a dog in the car?\nNot for long.',
    );

    expect(getByText('Frequently asked')).toBeTruthy();
    expect(getByText('How often should you stop with a dog on a long car ride?')).toBeTruthy();
    expect(getByText('Every 2 to 3 hours.')).toBeTruthy();
    expect(getByText('Is it safe to leave a dog in the car?')).toBeTruthy();
    expect(getByText('Not for long.')).toBeTruthy();
  });

  it('still shows the questions of a route that writes them in bold', () => {
    const { getByText } = open('**Are there tolls?**\nYes, several.');

    expect(getByText('Frequently asked')).toBeTruthy();
    expect(getByText('Are there tolls?')).toBeTruthy();
    expect(getByText('Yes, several.')).toBeTruthy();
  });

  it('shows the questions when a title sits above them', () => {
    const { getByText, queryByText } = open(
      '## Frequently asked questions\n\n**Is it pet friendly?**\nYes.',
    );

    expect(getByText('Is it pet friendly?')).toBeTruthy();
    // The title is not turned into a question of its own
    expect(queryByText('Frequently asked questions')).toBeNull();
  });

  it('leaves the section out when the route has no FAQs', () => {
    const { queryByText } = open('');

    expect(queryByText('Frequently asked')).toBeNull();
  });
});

describe('RoadTripDetailScreen: the destination card', () => {
  beforeEach(() => {
    navigation.navigate.mockClear();
  });

  it('says welcome to the destination city', () => {
    const { getByText } = open('');

    expect(getByText('Welcome to Pune')).toBeTruthy();
    expect(getByText("YOU'VE ARRIVED AT YOUR DESTINATION")).toBeTruthy();
  });

  it('opens the search screen for that city when it is tapped', () => {
    const { getByTestId } = open('');

    fireEvent.press(getByTestId('road-trip-destination'));

    expect(navigation.navigate).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith('SearchScreen', { query: 'Pune' });
  });

  it('searches for the city of this route, whichever it is', () => {
    mockDetail = detail('');
    mockDetail.data.route.destination_city = 'Jim Corbett';
    const { getByTestId } = render(<RoadTripDetailScreen navigation={navigation} route={route} />);

    fireEvent.press(getByTestId('road-trip-destination'));

    expect(navigation.navigate).toHaveBeenCalledWith('SearchScreen', { query: 'Jim Corbett' });
  });

  it('can be found by its name for screen readers', () => {
    const { getByTestId } = open('');

    expect(getByTestId('road-trip-destination').props.accessibilityLabel).toBe('Explore Pune');
    expect(getByTestId('road-trip-destination').props.accessibilityRole).toBe('button');
  });
});
