import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { styles as homeStyles } from '../styles';
import {
  PopularDestinations,
  toDestinations,
  iconForCity,
  placesLabel,
  DESTINATION_COLORS,
  CARD_WIDTH,
  CARD_GAP,
} from '../PopularDestinations';

jest.mock('../../../../hooks/useDiscovery', () => ({
  resolveImageUrl: url => `https://cdn.test${url}`,
}));

// The list the Home API sends
const TOP_CITIES = [
  { city: 'New Delhi', state: 'Delhi', listing_count: 53, hero_image_url: null },
  { city: 'Rishikesh', state: 'Uttarakhand', listing_count: 48, hero_image_url: null },
  { city: 'Gurugram', state: 'Haryana', listing_count: 48, hero_image_url: null },
  { city: 'Bengaluru', state: 'Karnataka', listing_count: 47, hero_image_url: null },
  { city: 'Dehradun', state: 'Uttarakhand', listing_count: 43, hero_image_url: null },
  { city: 'Jaipur', state: 'Rajasthan', listing_count: 43, hero_image_url: null },
  { city: 'Delhi', state: 'Delhi', listing_count: 32, hero_image_url: null },
  { city: 'Mussoorie', state: 'Uttarakhand', listing_count: 29, hero_image_url: null },
  { city: 'Shimla', state: 'Himachal Pradesh', listing_count: 25, hero_image_url: null },
  { city: 'Kolkata', state: 'West Bengal', listing_count: 19, hero_image_url: null },
];

describe('toDestinations', () => {
  it('turns the API list into cards in the same order, with city, state and count', () => {
    const items = toDestinations(TOP_CITIES);

    expect(items).toHaveLength(10);
    expect(items[0]).toMatchObject({ city: 'New Delhi', state: 'Delhi', count: 53 });
    expect(items[9]).toMatchObject({ city: 'Kolkata', state: 'West Bengal', count: 19 });
  });

  it('gives each card its own colour, repeating after ten', () => {
    const items = toDestinations([...TOP_CITIES, { city: 'Goa', state: 'Goa', listing_count: 3 }]);

    expect(new Set(items.slice(0, 10).map(i => i.colors.accent)).size).toBe(10);
    expect(items[10].colors).toBe(DESTINATION_COLORS[0]);
  });

  it('works out how popular each city is compared with the top one', () => {
    const items = toDestinations(TOP_CITIES);

    expect(items[0].share).toBe(1);
    expect(items[9].share).toBeCloseTo(19 / 53, 5);
    items.forEach(item => {
      expect(item.share).toBeGreaterThanOrEqual(0);
      expect(item.share).toBeLessThanOrEqual(1);
    });
  });

  it('does not divide by zero when no city has any places', () => {
    const [a] = toDestinations([{ city: 'Pune', listing_count: 0 }]);
    expect(a.share).toBe(0);
  });

  it('skips entries with no city, and copes with no list at all', () => {
    expect(
      toDestinations([{ city: '' }, { state: 'X' }, null, { city: ' Pune ', listing_count: '7' }]),
    ).toEqual([expect.objectContaining({ city: 'Pune', count: 7 })]);
    expect(toDestinations(undefined)).toEqual([]);
    expect(toDestinations(null)).toEqual([]);
    expect(toDestinations('nope')).toEqual([]);
  });

  it('turns a missing or odd count into 0, and builds a photo address only when there is one', () => {
    const [a, b] = toDestinations([
      { city: 'A', listing_count: 'x' },
      { city: 'B', listing_count: 2, hero_image_url: '/img/b.jpg' },
    ]);
    expect(a.count).toBe(0);
    expect(a.image).toBe('');
    expect(b.image).toBe('https://cdn.test/img/b.jpg');
  });
});

describe('labels and icons', () => {
  it('writes the number of places', () => {
    expect(placesLabel(53)).toBe('53 places');
    expect(placesLabel(1)).toBe('1 place');
    expect(placesLabel(0)).toBe('0 places');
    expect(placesLabel(undefined)).toBe('0 places');
  });

  it('picks an icon for each known city, whatever its capital letters, and a pin for others', () => {
    expect(iconForCity('Jaipur')).toBe('castle');
    expect(iconForCity('  GURUGRAM ')).toBe('office-building');
    expect(iconForCity('Rishikesh')).toBe('bridge');
    expect(iconForCity('Nowhereville')).toBe('map-marker-radius');
    expect(iconForCity(undefined)).toBe('map-marker-radius');
  });
});

describe('PopularDestinations', () => {
  const setup = (cities = TOP_CITIES, extra = {}) => {
    const onOpenCity = jest.fn();
    const view = render(
      <PopularDestinations cities={cities} onOpenCity={onOpenCity} isDarkMode={false} {...extra} />,
    );
    return { ...view, onOpenCity };
  };

  it('shows the heading and the line under it', () => {
    const { getByText } = setup();

    expect(getByText('Popular Indian Destinations for Pet Travel')).toBeTruthy();
    expect(
      getByText('Where pet parents are travelling, searching and planning road trips right now.'),
    ).toBeTruthy();
  });

  it('shows a card for every city with its number of places', () => {
    const { getByText, getByTestId } = setup();

    // The names are written in capitals on the cards
    [
      'NEW DELHI',
      'RISHIKESH',
      'GURUGRAM',
      'BENGALURU',
      'DEHRADUN',
      'JAIPUR',
      'DELHI',
      'MUSSOORIE',
      'SHIMLA',
      'KOLKATA',
    ].forEach(city => expect(getByText(city)).toBeTruthy());
    expect(getByTestId('destination-0-count').props.children).toBe('53 places');
    expect(getByTestId('destination-2-count').props.children).toBe('48 places');
    expect(getByTestId('destination-9-count').props.children).toBe('19 places');
  });

  it('opens the city when its card is tapped, with the city and the state', () => {
    const { getByTestId, onOpenCity } = setup();

    fireEvent.press(getByTestId('destination-5'));

    expect(onOpenCity).toHaveBeenCalledTimes(1);
    expect(onOpenCity.mock.calls[0][0]).toMatchObject({ city: 'Jaipur', state: 'Rajasthan' });
  });

  it('describes each card for screen readers', () => {
    const { getByTestId } = setup();
    expect(getByTestId('destination-0').props.accessibilityLabel).toBe('New Delhi, 53 places');
  });

  it('shows the city photo instead of the icon when the API gives one', () => {
    const { getByTestId, queryByTestId } = setup([
      { city: 'Goa', state: 'Goa', listing_count: 9, hero_image_url: '/img/goa.jpg' },
      { city: 'Agra', state: 'UP', listing_count: 4, hero_image_url: null },
    ]);

    expect(getByTestId('destination-0-photo')).toBeTruthy();
    expect(queryByTestId('destination-1-photo')).toBeNull();
  });

  it('shows nothing at all when there are no cities, so no empty heading is left', () => {
    const { queryByTestId, queryByText } = setup([]);
    expect(queryByTestId('popular-destinations')).toBeNull();
    expect(queryByText('Popular Indian Destinations for Pet Travel')).toBeNull();
  });

  describe('sideways row', () => {
    it('is a row that scrolls sideways, with no bar', () => {
      const { getByTestId } = render(
        <PopularDestinations cities={TOP_CITIES} onOpenCity={jest.fn()} isDarkMode={false} />,
      );
      const scroll = getByTestId('destinations-scroll');

      expect(scroll.props.horizontal).toBe(true);
      expect(scroll.props.showsHorizontalScrollIndicator).toBe(false);
    });

    it('snaps to one card at a time', () => {
      const { getByTestId } = render(
        <PopularDestinations cities={TOP_CITIES} onOpenCity={jest.fn()} isDarkMode={false} />,
      );
      const scroll = getByTestId('destinations-scroll');

      expect(scroll.props.snapToInterval).toBe(CARD_WIDTH + CARD_GAP);
      expect(scroll.props.decelerationRate).toBe('fast');
    });

    it('gives every card the same fixed width, so ten cards need no wrapping', () => {
      const { getByTestId } = render(
        <PopularDestinations cities={TOP_CITIES} onOpenCity={jest.fn()} isDarkMode={false} />,
      );

      for (let i = 0; i < 10; i += 1) {
        expect(getByTestId(`destination-${i}`)).toBeTruthy();
      }
    });

    it('starts with the first card full size and bright, and the next one softer and smaller', () => {
      const { getByTestId } = render(
        <PopularDestinations cities={TOP_CITIES} onOpenCity={jest.fn()} isDarkMode={false} />,
      );
      const lift = i => StyleSheet.flatten(getByTestId(`destination-${i}-lift`).props.style);

      expect(lift(0).opacity).toBe(1);
      expect(lift(0).transform[0].scale).toBe(1);
      expect(lift(1).opacity).toBeLessThan(1);
      expect(lift(1).transform[0].scale).toBeLessThan(1);
    });

    it('moves the highlight along when the row is scrolled', () => {
      const { getByTestId } = render(
        <PopularDestinations
          cities={TOP_CITIES}
          onOpenCity={jest.fn()}
          isDarkMode={false}
          nativeDriver={false}
        />,
      );
      const lift = i => StyleSheet.flatten(getByTestId(`destination-${i}-lift`).props.style);

      fireEvent.scroll(getByTestId('destinations-scroll'), {
        nativeEvent: { contentOffset: { x: CARD_WIDTH + CARD_GAP } },
      });

      expect(lift(1).transform[0].scale).toBe(1);
      expect(lift(0).transform[0].scale).toBeLessThan(1);
    });

    it('still opens a city from a card in the row', () => {
      const onOpenCity = jest.fn();
      const { getByTestId } = render(
        <PopularDestinations cities={TOP_CITIES} onOpenCity={onOpenCity} isDarkMode={false} />,
      );

      fireEvent.press(getByTestId('destination-9'));
      expect(onOpenCity.mock.calls[0][0]).toMatchObject({ city: 'Kolkata' });
    });
  });

  describe('passport stamp card', () => {
    const renderRow = (extra = {}) =>
      render(
        <PopularDestinations
          cities={TOP_CITIES}
          onOpenCity={jest.fn()}
          isDarkMode={false}
          {...extra}
        />,
      );
    const style = node => StyleSheet.flatten(node.props.style);

    it('is a light card with a dashed edge in the card colour, not a gradient tile', () => {
      const { getByTestId } = renderRow();
      const card = style(getByTestId('destination-1'));

      expect(card.borderStyle).toBe('dashed');
      expect(card.borderColor).toBe(DESTINATION_COLORS[1].accent);
      expect(card.backgroundColor).toBe('#FFFDF8');
      const gradients = getByTestId('destination-1').findAll(
        node => node.props && Array.isArray(node.props.colors),
      );
      expect(gradients).toHaveLength(0);
    });

    it('numbers the cards "No. 01", "No. 02" and so on, in order', () => {
      const { getByTestId } = renderRow();

      expect(getByTestId('destination-0-rank').props.children).toBe('No. 01');
      expect(getByTestId('destination-9-rank').props.children).toBe('No. 10');
    });

    it('shows a round stamp with the city icon, turned a little', () => {
      const { getByTestId } = renderRow();
      const stamp = style(getByTestId('destination-5-stamp'));

      expect(stamp.transform.some(entry => entry.rotate === '-9deg')).toBe(true);
      const icons = getByTestId('destination-5-stamp').findAll(
        node => node.props && node.props.name === 'castle',
      );
      expect(icons.length).toBeGreaterThan(0);
    });

    it('sets each card a little crooked, one way and then the other', () => {
      const { getByTestId } = renderRow();
      const tilt = i => style(getByTestId(`destination-${i}-lift`)).transform[1].rotate;

      expect(tilt(0)).toBe('-1.2deg');
      expect(tilt(1)).toBe('1.2deg');
      expect(tilt(2)).toBe('-1.2deg');
    });

    it('writes the city in spaced capitals, with the state under it', () => {
      const { getByText, getAllByText } = renderRow();

      expect(style(getByText('JAIPUR')).letterSpacing).toBeGreaterThan(0);
      expect(getByText('Rajasthan')).toBeTruthy();
      expect(getAllByText('Uttarakhand')).toHaveLength(3);
    });

    it('leaves out the state line when the API has none', () => {
      const { queryByText } = render(
        <PopularDestinations
          cities={[{ city: 'Pune', listing_count: 4 }]}
          onOpenCity={jest.fn()}
          isDarkMode={false}
        />,
      );
      expect(queryByText('PUNE')).toBeTruthy();
      expect(queryByText('Maharashtra')).toBeNull();
    });

    it('colours the places count with the card colour', () => {
      const { getByTestId } = renderRow();

      expect(style(getByTestId('destination-3-count')).color).toBe(DESTINATION_COLORS[3].accent);
    });

    it('draws a bar for how popular the city is: full for the top one, shorter for the others', () => {
      const { getByTestId } = renderRow();

      expect(style(getByTestId('destination-0-bar')).width).toBe('100%');
      expect(style(getByTestId('destination-9-bar')).width).toBe('36%');
      expect(style(getByTestId('destination-0-bar')).backgroundColor).toBe(
        DESTINATION_COLORS[0].accent,
      );
    });

    it('never shows an empty bar, even for a city with no places', () => {
      const { getByTestId } = render(
        <PopularDestinations
          cities={[
            { city: 'Pune', listing_count: 0 },
            { city: 'Goa', listing_count: 9 },
          ]}
          onOpenCity={jest.fn()}
          isDarkMode={false}
        />,
      );
      expect(style(getByTestId('destination-0-bar')).width).toBe('8%');
    });

    it('uses the dark app colours in dark mode', () => {
      const { getByTestId } = renderRow({ isDarkMode: true });

      expect(style(getByTestId('destination-0')).backgroundColor).toBe('#1A0B30');
      expect(style(getByTestId('destination-0-track')).backgroundColor).toBe('#27104B');
    });
  });
});

describe('PopularDestinations header', () => {
  it('has the same header look as the other Home sections: colour, font, size and spacing', () => {
    const { getByText } = render(
      <PopularDestinations cities={TOP_CITIES} onOpenCity={jest.fn()} isDarkMode={false} />,
    );
    const title = StyleSheet.flatten(
      getByText('Popular Indian Destinations for Pet Travel').props.style,
    );
    const overline = StyleSheet.flatten(getByText('TOP CITIES').props.style);
    const home = StyleSheet.flatten(homeStyles.sectionTitle);
    const homeOverline = StyleSheet.flatten(homeStyles.sectionOverline);

    expect(title.color).toBe(home.color);
    expect(title.fontFamily).toBe(home.fontFamily);
    expect(title.fontSize).toBe(home.fontSize);
    expect(title.letterSpacing).toBe(home.letterSpacing);
    expect(overline.color).toBe(homeOverline.color);
    expect(overline.fontSize).toBe(homeOverline.fontSize);
  });

  it('uses the Home dark header colours in dark mode', () => {
    const { getByText } = render(
      <PopularDestinations cities={TOP_CITIES} onOpenCity={jest.fn()} isDarkMode />,
    );
    expect(StyleSheet.flatten(getByText('TOP CITIES').props.style).color).toBe(
      StyleSheet.flatten(homeStyles.sectionOverlineDark).color,
    );
  });
});
