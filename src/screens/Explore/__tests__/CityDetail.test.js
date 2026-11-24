import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { CityDetail } from '../CityDetail';
import { useStore } from '../../../store';

const LISTINGS = [
  {
    id: 1,
    slug: 'pas-coffee',
    name: 'PAS SPECIALTY COFFEE',
    category: 'Cafe',
    area: 'Agonda',
    verification_tier: 'TAILS_VERIFIED',
    verification_status: 'verified',
    main_image_url: '/img/pas',
    excerpt: 'Garden seating and water bowls.',
  },
  {
    id: 2,
    slug: 'beach-stay',
    name: 'Beach Stay',
    category: 'Stays',
    area: 'Agonda',
    verification_status: 'verified',
    main_image_url: '/img/stay',
  },
];

jest.mock('../../../hooks/useDiscovery', () => ({
  resolveImageUrl: url => (url ? `https://cdn.test${url}` : ''),
  useDiscoveryCities: () => ({ data: [] }),
  useCityListings: () => ({ data: { listings: LISTINGS }, isLoading: false }),
  useCityIntro: () => ({
    data: {
      title: 'Pet-Friendly Places in Agonda',
      cityIntroMarkdown: 'Agonda is both a village and a beach destination in Canacona taluka.',
      bestTimeToVisitMarkdown: 'November to March is the best time for dogs.',
    },
  }),
  useCityCover: () => ({ data: null }),
  useCityCategoryIntros: () => ({ data: [] }),
  useCityRoutes: () => ({
    data: [{ slug: 'delhi-goa', title: 'Delhi to Goa', subtitle: 'A long drive' }],
  }),
  useNearbyCities: () => ({ data: [{ city: 'Palolem', state: 'Goa', verified: 3 }] }),
}));

const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  push: jest.fn(),
  canGoBack: () => true,
};
const route = { params: { city: 'Agonda', state: 'Goa' } };
const style = node => StyleSheet.flatten(node.props.style);

const setup = dark => {
  useStore.setState({ isDarkMode: dark });
  return render(<CityDetail navigation={navigation} route={route} />);
};

afterEach(() => useStore.setState({ isDarkMode: false }));

describe('CityDetail in dark mode', () => {
  it('has a dark page behind everything', () => {
    const { getByTestId } = setup(true);
    expect(style(getByTestId('city-container')).backgroundColor).toBe('#0F071D');
  });

  it('keeps the light page in light mode', () => {
    const { getByTestId } = setup(false);
    expect(style(getByTestId('city-container')).backgroundColor).toBe('#F8F7FC');
  });

  it('turns the local guide card deep purple with a raised bottom edge', () => {
    const { getByTestId } = setup(true);
    const card = style(getByTestId('city-guide'));

    expect(card.backgroundColor).toBe('#1A0B30');
    expect(card.borderBottomColor).toBe('#4C1D95');
    expect(card.borderBottomWidth).toBeGreaterThan(card.borderLeftWidth);
  });

  it('keeps the guide card white in light mode', () => {
    const { getByTestId } = setup(false);
    expect(style(getByTestId('city-guide')).backgroundColor).toBe('#FFFFFF');
  });

  it('writes the section headings and the guide text so they can be read on the dark page', () => {
    const { getAllByTestId, getByText } = setup(true);

    getAllByTestId('city-section-title').forEach(title => {
      expect(style(title).color).toBe('#FFFFFF');
    });
    expect(style(getByText('Plan Agonda with your pet')).color).toBe('#C4B5FD');
    expect(style(getByText('LOCAL GUIDE')).color).toBe('#94A3B8');
    expect(style(getByText('FIND YOUR KIND OF PLACE')).color).toBe('#A855F7');
  });

  it('keeps the dark purple headings in light mode', () => {
    const { getAllByTestId } = setup(false);
    getAllByTestId('city-section-title').forEach(title => {
      expect(style(title).color).toBe('#4C1D95');
    });
  });

  it('makes the category cards dark, but keeps the chosen one purple', () => {
    const { getByTestId } = setup(true);

    expect(style(getByTestId('city-category-all')).backgroundColor).toBe('#7C3AED');
    expect(style(getByTestId('city-category-Cafe')).backgroundColor).toBe('#1A0B30');

    fireEvent.press(getByTestId('city-category-Cafe'));
    expect(style(getByTestId('city-category-Cafe')).backgroundColor).toBe('#7C3AED');
    expect(style(getByTestId('city-category-all')).backgroundColor).toBe('#1A0B30');
  });

  it('writes the category names white and their counts grey on the dark cards', () => {
    const { getByText } = setup(true);

    expect(style(getByText('Cafe')).color).toBe('#FFFFFF');
    expect(style(getByText('Stays')).color).toBe('#FFFFFF');
  });

  it('makes the place cards dark, with white names and a lighter place line', () => {
    const { getByTestId, getByText } = setup(true);

    expect(style(getByTestId('city-place-0')).backgroundColor).toBe('#1A0B30');
    expect(style(getByText('PAS SPECIALTY COFFEE')).color).toBe('#FFFFFF');
    expect(style(getByText('CAFE', { exact: true })).color).toBe('#C4B5FD');
  });

  it('keeps the place cards white in light mode', () => {
    const { getByTestId, getByText } = setup(false);

    expect(style(getByTestId('city-place-0')).backgroundColor).toBe('#FFFFFF');
    expect(style(getByText('PAS SPECIALTY COFFEE')).color).toBe('#1A0B2E');
  });

  it('makes the about cards, the road trips and the nearby cities dark too', () => {
    const { getByText } = setup(true);
    const cardOf = text => {
      let node = getByText(text);
      while (node && !(node.props.style && style(node).borderBottomWidth)) {
        node = node.parent;
      }
      return style(node);
    };

    expect(cardOf('Delhi to Goa').backgroundColor).toBe('#1A0B30');
    expect(cardOf('Palolem').backgroundColor).toBe('#1A0B30');
    expect(style(getByText('Delhi to Goa')).color).toBe('#FFFFFF');
    expect(style(getByText('Palolem')).color).toBe('#FFFFFF');
  });

  it('still opens a place when it is tapped', () => {
    const { getByTestId } = setup(true);

    fireEvent.press(getByTestId('city-place-0'));
    expect(navigation.navigate).toHaveBeenCalledWith('ListingDetailScreen', { slug: 'pas-coffee' });
  });

  it('follows the app when the theme changes while the page is open', () => {
    const view = setup(false);
    expect(style(view.getByTestId('city-container')).backgroundColor).toBe('#F8F7FC');

    useStore.setState({ isDarkMode: true });
    view.rerender(<CityDetail navigation={navigation} route={route} />);
    expect(style(view.getByTestId('city-container')).backgroundColor).toBe('#0F071D');
  });
});
