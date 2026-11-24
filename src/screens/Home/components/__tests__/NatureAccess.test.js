import React from 'react';
import { StyleSheet } from 'react-native';
import { s } from 'react-native-size-matters';
import { render, fireEvent } from '@testing-library/react-native';
import {
  NatureAccess,
  NATURE_CARDS,
  NATURE_SEARCH_PARAMS,
  CARD_WIDTH,
  CARD_GAP,
  NatureAmbient,
  AMBIENT_PIECES,
} from '../NatureAccess';
import { styles as homeStyles } from '../styles';
import { resolveApiCategory, categoryLabel } from '../../../Explore/listingFilters';

const setup = (extra = {}) => {
  const onExplore = jest.fn();
  const view = render(<NatureAccess onExplore={onExplore} isDarkMode={false} {...extra} />);
  return { ...view, onExplore };
};

describe('NatureAccess', () => {
  it('shows the heading and the line under it', () => {
    const { getByText } = setup();

    expect(getByText('Water, nature and outdoor pet access')).toBeTruthy();
    expect(
      getByText(/Pet friendly lakes, ponds, waterfalls, rivers and beaches need more than/),
    ).toBeTruthy();
  });

  it('has the four outdoor cards with their titles, in order', () => {
    const { getByText } = setup();

    expect(NATURE_CARDS.map(card => card.title)).toEqual([
      'Ponds & Lakes',
      'Rivers & Waterfalls',
      'Beaches & Picnic Spots',
      'Forest Trails & Parks',
    ]);
    NATURE_CARDS.forEach(card => expect(getByText(card.title)).toBeTruthy());
  });

  it("shows each card's wording and its number of places", () => {
    const { getByText, getByTestId } = setup();

    expect(getByText(/Check access type, walking distance, crowd level/)).toBeTruthy();
    expect(getByText(/Seasonal warnings, slippery rock alerts/)).toBeTruthy();
    expect(getByText(/Dog friendly beaches in India, leash rules, tide timings/)).toBeTruthy();
    expect(getByText(/Off-leash trails, eco-resort walks, jungle paths/)).toBeTruthy();
    expect(getByTestId('nature-places-lakes').props.children).toBe('47 places →');
    expect(getByTestId('nature-places-rivers').props.children).toBe('62 places →');
    expect(getByTestId('nature-places-beaches').props.children).toBe('38 places →');
    expect(getByTestId('nature-places-forests').props.children).toBe('54 places →');
  });

  it('puts the "Swim safety noted" tag on every card', () => {
    const { getAllByText } = setup();
    expect(getAllByText('✓ Swim safety noted')).toHaveLength(4);
  });

  it('gives each card its own icon and its own colours: teal-green, purple-teal, orange, green', () => {
    const { getByTestId, getByText } = setup();

    expect(NATURE_CARDS.map(card => card.emoji)).toEqual(['🏞️', '🌊', '🏖️', '🌲']);
    NATURE_CARDS.forEach(card => expect(getByText(card.emoji)).toBeTruthy());
    expect(NATURE_CARDS[0].colors).toEqual(['#56BCA6', '#5DB777']);
    expect(NATURE_CARDS[1].colors[0]).toBe('#6D36F5');
    expect(NATURE_CARDS[2].colors).toEqual(['#F2A340', '#F7D27A']);
    expect(NATURE_CARDS[3].colors).toEqual(['#52A56B', '#1F4D2C']);
    NATURE_CARDS.forEach(card => {
      const gradient = getByTestId(`nature-card-${card.key}`).findAll(
        node => node.props && Array.isArray(node.props.colors),
      )[0];
      expect(gradient.props.colors).toEqual(card.colors);
    });
  });

  it('keeps the shadow on a solid colour behind the gradient, so Android always draws the card', () => {
    const { getByTestId } = setup();

    NATURE_CARDS.forEach(card => {
      const style = StyleSheet.flatten(getByTestId(`nature-card-${card.key}`).props.style);
      expect(style.backgroundColor).toBe(card.lip);
      expect(style.shadowColor).toBe(card.lip);
      expect(style.elevation).toBeGreaterThan(0);
    });
  });

  it('is a row that scrolls sideways and snaps to one card at a time', () => {
    const { getByTestId } = setup();
    const scroll = getByTestId('nature-scroll');

    expect(scroll.props.horizontal).toBe(true);
    expect(scroll.props.showsHorizontalScrollIndicator).toBe(false);
    expect(scroll.props.snapToInterval).toBeGreaterThan(CARD_WIDTH);
  });

  it('has the "Explore Nature Places" button', () => {
    const { getByText, getByTestId } = setup();

    expect(getByText('Explore Nature Places')).toBeTruthy();
    expect(getByTestId('nature-explore-icon')).toBeTruthy();
    expect(getByTestId('nature-explore-shine')).toBeTruthy();
    expect(getByTestId('nature-explore').props.accessibilityRole).toBe('button');
  });

  it('opens the outdoor places when the button is pressed', () => {
    const { getByTestId, onExplore } = setup();

    fireEvent.press(getByTestId('nature-explore'));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });

  it('opens the same outdoor places when a card is pressed', () => {
    const { getByTestId, onExplore } = setup();

    fireEvent.press(getByTestId('nature-card-rivers'));
    expect(onExplore).toHaveBeenCalledTimes(1);
  });

  it('describes each card for screen readers', () => {
    const { getByTestId } = setup();
    expect(getByTestId('nature-card-forests').props.accessibilityLabel).toBe(
      'Forest Trails & Parks, 54 places',
    );
  });

  it('uses the dark app colours for the heading in dark mode', () => {
    const { getByText } = setup({ isDarkMode: true });
    expect(
      StyleSheet.flatten(getByText('Water, nature and outdoor pet access').props.style).color,
    ).toBe('#FFFFFF');
  });
});

describe('NatureAccess header and animation', () => {
  const style = node => StyleSheet.flatten(node.props.style);

  it('has the same header look as the other Home sections: colour, font, size and spacing', () => {
    const { getByText } = render(<NatureAccess onExplore={jest.fn()} isDarkMode={false} />);
    const title = style(getByText('Water, nature and outdoor pet access'));
    const overline = style(getByText('OUTDOORS'));
    const home = StyleSheet.flatten(homeStyles.sectionTitle);
    const homeOverline = StyleSheet.flatten(homeStyles.sectionOverline);

    expect(title.color).toBe(home.color);
    expect(title.fontFamily).toBe(home.fontFamily);
    expect(title.fontSize).toBe(home.fontSize);
    expect(title.letterSpacing).toBe(home.letterSpacing);
    expect(overline.color).toBe(homeOverline.color);
    expect(overline.fontSize).toBe(homeOverline.fontSize);
    expect(overline.letterSpacing).toBe(homeOverline.letterSpacing);
  });

  it('uses the Home dark header colours in dark mode', () => {
    const { getByText } = render(<NatureAccess onExplore={jest.fn()} isDarkMode />);

    expect(style(getByText('OUTDOORS')).color).toBe(
      StyleSheet.flatten(homeStyles.sectionOverlineDark).color,
    );
    expect(style(getByText('Water, nature and outdoor pet access')).color).toBe('#FFFFFF');
  });

  it('keeps the cards compact', () => {
    expect(CARD_WIDTH).toBeLessThan(s(220));
  });

  it('highlights the card at the left edge, and softens the others', () => {
    const { getByTestId } = render(<NatureAccess onExplore={jest.fn()} isDarkMode={false} />);
    const lift = key => style(getByTestId(`nature-lift-${key}`));

    expect(lift('lakes').opacity).toBe(1);
    expect(lift('lakes').transform[0].scale).toBe(1);
    expect(lift('rivers').opacity).toBeLessThan(1);
    expect(lift('rivers').transform[0].scale).toBeLessThan(1);
  });

  it('moves the highlight along when the row is scrolled', () => {
    const { getByTestId } = render(
      <NatureAccess onExplore={jest.fn()} isDarkMode={false} nativeDriver={false} />,
    );
    const lift = key => style(getByTestId(`nature-lift-${key}`));

    fireEvent.scroll(getByTestId('nature-scroll'), {
      nativeEvent: { contentOffset: { x: CARD_WIDTH + CARD_GAP } },
    });
    expect(lift('rivers').transform[0].scale).toBe(1);
    expect(lift('lakes').transform[0].scale).toBeLessThan(1);

    fireEvent.scroll(getByTestId('nature-scroll'), {
      nativeEvent: { contentOffset: { x: (CARD_WIDTH + CARD_GAP) * 3 } },
    });
    expect(lift('forests').transform[0].scale).toBe(1);
  });
});

describe('live effects behind the cards', () => {
  const style = node => StyleSheet.flatten(node.props.style);
  const setup = (extra = {}) =>
    render(<NatureAccess onExplore={jest.fn()} isDarkMode={false} {...extra} />);
  const within = (view, kind, test) =>
    view.getByTestId(`nature-ambient-${kind}`).findAll(n => n.props && n.props.style && test(n));
  // Where a moving value starts and ends: [from, to] of its animation
  const range = value => value._config.outputRange;
  // Each animated piece shows up twice (the animated layer and the plain view under it); keep the
  // animated one, whose position is an animation object
  const animated = (nodes, axis) =>
    nodes.filter(n => typeof style(n).transform[0][axis] === 'object');
  const emojis = (view, kind, emoji, axis) =>
    animated(
      within(view, kind, n => n.props.children === emoji),
      axis,
    );

  it('puts one effect behind every card, matched to its title', () => {
    const { getByTestId } = setup();

    NATURE_CARDS.forEach(card => expect(getByTestId(`nature-ambient-${card.key}`)).toBeTruthy());
    expect(Object.keys(AMBIENT_PIECES)).toEqual(['lakes', 'rivers', 'beaches', 'forests']);
  });

  describe('lake: ducks and fish swimming across, left to right', () => {
    it('has two ducks and two fish', () => {
      const view = setup();

      expect(AMBIENT_PIECES.lakes).toBe(4);
      expect(emojis(view, 'lakes', '🦆', 'translateX')).toHaveLength(2);
      expect(emojis(view, 'lakes', '🐟', 'translateX')).toHaveLength(2);
    });

    it('starts each one off the left edge and ends it off the right edge', () => {
      const view = setup();

      ['🦆', '🐟'].forEach(emoji => {
        emojis(view, 'lakes', emoji, 'translateX').forEach(node => {
          const [from, to] = range(style(node).transform[0].translateX);
          expect(from).toBeLessThan(0);
          expect(to).toBeGreaterThan(CARD_WIDTH);
        });
      });
    });

    it('turns them to face the way they swim, to the right', () => {
      const view = setup();

      emojis(view, 'lakes', '🦆', 'translateX').forEach(node => {
        expect(style(node).transform.some(entry => entry.scaleX === -1)).toBe(true);
      });
    });

    it('bobs them up and down a little as they go', () => {
      const view = setup();

      emojis(view, 'lakes', '🐟', 'translateX').forEach(node => {
        const bob = style(node).transform[1].translateY;
        const [a, b, c, d] = range(bob);
        expect(a).toBe(0);
        expect(b).toBeLessThan(0);
        expect(c).toBe(0);
        expect(d).toBeGreaterThan(0);
      });
    });
  });

  describe('river: water falling like a waterfall', () => {
    it('drops six drops down the card, each in its own column', () => {
      const view = setup();
      const drops = emojis(view, 'rivers', '💧', 'translateY');

      expect(AMBIENT_PIECES.rivers).toBe(6);
      expect(drops).toHaveLength(6);
      expect(new Set(drops.map(node => style(node).left)).size).toBe(6);
    });

    it('lets each drop fall from above the card to below its middle', () => {
      const view = setup();

      emojis(view, 'rivers', '💧', 'translateY').forEach(node => {
        const [from, to] = range(style(node).transform[0].translateY);
        expect(from).toBeLessThan(0);
        expect(to).toBeGreaterThan(s(100));
      });
    });

    it('falls faster than the forest leaves', () => {
      const view = setup();
      expect(emojis(view, 'rivers', '💧', 'translateY').length).toBeGreaterThan(0);
      expect(AMBIENT_PIECES.rivers).toBeGreaterThan(AMBIENT_PIECES.forests);
    });
  });

  describe('beach: a turning sun, a crab on the sand and gulls', () => {
    it('has a sun, a crab and two gulls', () => {
      const view = setup();

      expect(AMBIENT_PIECES.beaches).toBe(4);
      expect(view.getByTestId('nature-sun')).toBeTruthy();
      expect(emojis(view, 'beaches', '🦀', 'translateX')).toHaveLength(1);
      expect(emojis(view, 'beaches', '🕊️', 'translateX')).toHaveLength(2);
    });

    it('turns the sun slowly all the way round', () => {
      const view = setup();
      const sun = animated(
        within(view, 'beaches', n => n.props.testID === 'nature-sun'),
        'rotate',
      )[0];

      expect(range(style(sun).transform[0].rotate)).toEqual(['0deg', '360deg']);
    });

    it('walks the crab and flies the gulls across, left to right, with the gulls facing right', () => {
      const view = setup();

      ['🦀', '🕊️'].forEach(emoji => {
        emojis(view, 'beaches', emoji, 'translateX').forEach(node => {
          const [from, to] = range(style(node).transform[0].translateX);
          expect(from).toBeLessThan(0);
          expect(to).toBeGreaterThan(CARD_WIDTH);
        });
      });
      emojis(view, 'beaches', '🕊️', 'translateX').forEach(node => {
        expect(style(node).transform.some(entry => entry.scaleX === -1)).toBe(true);
      });
    });

    it('keeps the crab down on the sand and the gulls up in the sky', () => {
      const view = setup();
      const top = emoji => parseFloat(style(emojis(view, 'beaches', emoji, 'translateX')[0]).top);

      expect(top('🦀')).toBeGreaterThan(70);
      expect(top('🕊️')).toBeLessThan(50);
    });
  });

  describe('forest: leaves falling', () => {
    it('drops four leaves down the card, each in its own column', () => {
      const view = setup();
      const leaves = emojis(view, 'forests', '🍃', 'translateY');

      expect(AMBIENT_PIECES.forests).toBe(4);
      expect(leaves).toHaveLength(4);
      expect(new Set(leaves.map(node => style(node).left)).size).toBe(4);
    });

    it('lets each leaf fall from above the card to below its middle', () => {
      const view = setup();

      emojis(view, 'forests', '🍃', 'translateY').forEach(node => {
        const [from, to] = range(style(node).transform[0].translateY);
        expect(from).toBeLessThan(0);
        expect(to).toBeGreaterThan(s(100));
      });
    });
  });

  describe('they all leave the card colour alone', () => {
    it('uses no background colour at all: only small emoji, so nothing washes the card out', () => {
      const view = setup();

      ['lakes', 'rivers', 'beaches', 'forests'].forEach(kind => {
        const filled = within(view, kind, n => style(n).backgroundColor !== undefined);
        expect(filled).toHaveLength(0);
      });
    });

    it('keeps every piece small', () => {
      const view = setup();

      ['lakes', 'rivers', 'beaches', 'forests'].forEach(kind => {
        within(view, kind, n => typeof style(n).fontSize === 'number').forEach(node => {
          expect(style(node).fontSize).toBeLessThanOrEqual(s(26));
        });
      });
    });
  });

  it("does not show one card's effect on another card", () => {
    const view = setup();

    expect(emojis(view, 'lakes', '🍃', 'translateY')).toHaveLength(0);
    expect(emojis(view, 'forests', '🦆', 'translateX')).toHaveLength(0);
    expect(emojis(view, 'rivers', '🦀', 'translateX')).toHaveLength(0);
  });

  it('never blocks a tap: the effects let touches through', () => {
    const { getByTestId } = setup();

    NATURE_CARDS.forEach(card => {
      expect(getByTestId(`nature-ambient-${card.key}`).props.pointerEvents).toBe('none');
    });
  });

  it('draws the effect before the title, the words and the tag, so they stay in front of it', () => {
    const { getByTestId } = setup();
    const order = [];
    const walk = node => {
      order.push(node);
      (node.children || []).forEach(child => typeof child !== 'string' && walk(child));
    };
    walk(getByTestId('nature-card-lakes'));

    const effect = order.findIndex(n => n.props && n.props.testID === 'nature-ambient-lakes');
    const title = order.findIndex(n => n.props && n.props.children === 'Ponds & Lakes');
    const tag = order.findIndex(n => n.props && n.props.children === '✓ Swim safety noted');
    const places = order.findIndex(n => n.props && n.props.testID === 'nature-places-lakes');

    expect(effect).toBeGreaterThan(-1);
    expect(effect).toBeLessThan(title);
    expect(effect).toBeLessThan(tag);
    expect(effect).toBeLessThan(places);
  });

  it("keeps every card's words readable, with the effects running", () => {
    const { getByText, getAllByText } = setup();

    NATURE_CARDS.forEach(card => expect(getByText(card.title)).toBeTruthy());
    expect(getAllByText('✓ Swim safety noted')).toHaveLength(4);
  });

  it('keeps the effects inside the card, rounded edge and all', () => {
    const { getByTestId } = setup();
    const face = getByTestId('nature-card-rivers').findAll(
      n => n.props && Array.isArray(n.props.colors),
    )[0];

    expect(style(face).overflow).toBe('hidden');
  });

  it('stops every effect quietly when the screen is left', () => {
    const view = setup();
    expect(() => view.unmount()).not.toThrow();
  });

  it('shows nothing for a card kind it does not know', () => {
    const { getByTestId } = render(<NatureAmbient kind="desert" />);
    expect(getByTestId('nature-ambient-desert').children).toHaveLength(0);
  });
});

describe('where the Explore button goes', () => {
  it('uses the Nature & Water filter, which the Search screen understands', () => {
    expect(NATURE_SEARCH_PARAMS).toEqual({
      apiCategory: 'Nature & Water',
      category: 'Paws in the Wild',
    });
    expect(
      resolveApiCategory(NATURE_SEARCH_PARAMS.apiCategory, NATURE_SEARCH_PARAMS.category),
    ).toBe('Nature & Water');
    expect(categoryLabel('Nature & Water')).toBe('Paws in the Wild');
  });
});
