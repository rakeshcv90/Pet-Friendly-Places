import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { render, act } from '@testing-library/react-native';
import { Image } from 'react-native';
import { UrbaniaHero, SWIPE_MS, prefetchGallery } from '../UrbaniaSections';
import { theme } from '../../../../theme';

const { width } = Dimensions.get('window');

// JS-driven animations (nativeDriver off) so that the test can run them all the way to the end,
// which is how the "blank hero after the first change" bug is caught
const setup = (photoIndex = 0) => {
  const view = render(<UrbaniaHero photoIndex={photoIndex} nativeDriver={false} />);
  const show = index => view.rerender(<UrbaniaHero photoIndex={index} nativeDriver={false} />);
  const wait = ms =>
    act(() => {
      jest.advanceTimersByTime(ms);
    });
  const frame = id => StyleSheet.flatten(view.getByTestId(id).props.style);
  const move = frame2 => ({
    x: frame2.transform[0].translateX,
    scale: frame2.transform[1].scale,
    fade: frame2.opacity,
  });
  const front = () => move(frame('urbania-hero-photo-frame'));
  const other = () => move(frame('urbania-hero-photo-other-frame'));
  const source = () => view.getByTestId('urbania-hero-photo').props.source;
  return { ...view, show, wait, front, other, source };
};

describe('UrbaniaHero photo change', () => {
  beforeEach(() =>
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] }),
  );
  afterEach(() => jest.useRealTimers());

  it('starts with the first photo at rest on screen and the spare slot parked to the right', () => {
    const hero = setup(0);

    expect(hero.source()).toBe(theme.images.urbaniaGallery[0]);
    expect(hero.front()).toEqual({ x: 0, scale: 1, fade: 1 });
    expect(hero.other().x).toBe(width);
  });

  it('brings the new photo in from the right and moves the old one left, dimming it', () => {
    const hero = setup(0);
    hero.show(1);
    hero.wait(SWIPE_MS * 0.4);

    const arriving = hero.front();
    const leaving = hero.other();
    expect(arriving.x).toBeGreaterThan(0);
    expect(arriving.x).toBeLessThan(width);
    expect(arriving.scale).toBeGreaterThan(1);
    expect(leaving.x).toBeLessThan(0);
    expect(leaving.fade).toBeLessThan(1);
    expect(hero.source()).toBe(theme.images.urbaniaGallery[1]);
  });

  it('ends with the new photo at rest, centred and fully visible: never a blank hero', () => {
    const hero = setup(0);
    hero.show(1);
    hero.wait(SWIPE_MS + 200);

    expect(hero.front()).toEqual({ x: 0, scale: 1, fade: 1 });
    expect(hero.source()).toBe(theme.images.urbaniaGallery[1]);
    // The photo that left is parked out of sight, ready for the next change
    expect(hero.other().x).toBe(width);
    expect(hero.other().fade).toBe(1);
    expect(hero.other().scale).toBe(1);
  });

  it('keeps ending at rest through many changes in a row, including from the last photo to the first', () => {
    const hero = setup(0);
    const order = [1, 2, 3, 4, 0, 1, 2];

    order.forEach(next => {
      hero.show(next);
      hero.wait(SWIPE_MS + 200);
      expect(hero.front()).toEqual({ x: 0, scale: 1, fade: 1 });
      expect(hero.source()).toBe(theme.images.urbaniaGallery[next]);
      expect(hero.other().x).toBe(width);
    });
  });

  it('finishes cleanly when another change comes before the first one is done', () => {
    const hero = setup(0);
    hero.show(1);
    hero.wait(SWIPE_MS * 0.3);
    hero.show(2);
    hero.wait(SWIPE_MS + 200);

    expect(hero.front()).toEqual({ x: 0, scale: 1, fade: 1 });
    expect(hero.source()).toBe(theme.images.urbaniaGallery[2]);
    expect(hero.other().x).toBe(width);
  });

  it('puts the photo that is arriving above the one that is leaving', () => {
    const hero = setup(0);
    hero.show(1);

    const arriving = hero.getByTestId('urbania-hero-photo-frame');
    const leaving = hero.getByTestId('urbania-hero-photo-other-frame');
    expect(StyleSheet.flatten(arriving.props.style).zIndex).toBeGreaterThan(
      StyleSheet.flatten(leaving.props.style).zIndex,
    );
  });

  it('shows the photo at once instead of fading it in from nothing', () => {
    const hero = setup(0);
    expect(hero.getByTestId('urbania-hero-photo').props.fadeDuration).toBe(0);
  });

  it('does nothing when the same photo is shown again', () => {
    const hero = setup(2);
    hero.show(2);
    hero.wait(SWIPE_MS + 200);

    expect(hero.front()).toEqual({ x: 0, scale: 1, fade: 1 });
    expect(hero.source()).toBe(theme.images.urbaniaGallery[2]);
  });

  it('stops its animation without errors when it is removed mid-change', () => {
    const hero = setup(0);
    hero.show(1);
    hero.wait(SWIPE_MS * 0.3);

    expect(() => {
      hero.unmount();
      jest.advanceTimersByTime(SWIPE_MS * 2);
    }).not.toThrow();
  });

  describe('layers', () => {
    // Child ids of the hero, in the order they are drawn (later ones are drawn on top)
    const childIds = hero => {
      const root = hero.getByTestId('urbania-hero');
      const collect = node =>
        (node.children || [])
          .filter(child => typeof child !== 'string')
          .map(child => child.props.testID || null);
      return collect(root);
    };

    it('keeps both photos in one layer, so their stacking cannot lift them above the text', () => {
      const hero = setup(0);
      hero.show(1);

      const layer = hero.getByTestId('urbania-hero-photos');
      expect(layer).toBeTruthy();
      const photoFrames = ['urbania-hero-photo-frame', 'urbania-hero-photo-other-frame'];
      photoFrames.forEach(id => {
        let node = hero.getByTestId(id);
        let inside = false;
        while (node) {
          if (node === layer) {
            inside = true;
            break;
          }
          node = node.parent;
        }
        expect(inside).toBe(true);
      });
      // No photo frame sits straight in the hero, where it could cover the text
      expect(childIds(hero)).not.toContain('urbania-hero-photo-frame');
      expect(childIds(hero)).not.toContain('urbania-hero-photo-other-frame');
    });

    it('draws the title and the headline after the photo layer, so they are in front of it', () => {
      const hero = setup(0);
      const ids = childIds(hero);

      expect(ids.indexOf('urbania-hero-photos')).toBe(0);
      expect(ids.indexOf('urbania-hero-header')).toBeGreaterThan(
        ids.indexOf('urbania-hero-photos'),
      );
    });

    it('gives the photo layer no stacking order of its own above the text', () => {
      const hero = setup(0);
      const layer = StyleSheet.flatten(hero.getByTestId('urbania-hero-photos').props.style);
      expect(layer.zIndex).toBe(0);
    });

    it('still shows the title and the headline text while a photo is changing', () => {
      const hero = setup(0);
      hero.show(2);
      hero.wait(SWIPE_MS * 0.5);

      expect(hero.getByText('Book the Urbania')).toBeTruthy();
      expect(hero.getByText('Bring the whole pack.')).toBeTruthy();
    });
  });

  describe('loading', () => {
    afterEach(() => jest.restoreAllMocks());

    it('prefetches every gallery photo once, and never throws when that fails', () => {
      jest
        .spyOn(Image, 'resolveAssetSource')
        .mockImplementation(source => ({ uri: `file://${source}` }));
      const prefetch = jest.spyOn(Image, 'prefetch').mockRejectedValue(new Error('offline'));

      expect(() => prefetchGallery()).not.toThrow();
      expect(prefetch).toHaveBeenCalledTimes(theme.images.urbaniaGallery.length);
    });

    it('does nothing for a photo that has no address', () => {
      jest.spyOn(Image, 'resolveAssetSource').mockReturnValue(null);
      const prefetch = jest.spyOn(Image, 'prefetch').mockResolvedValue(true);

      prefetchGallery();
      expect(prefetch).not.toHaveBeenCalled();
    });

    it('fades the photo in once it has loaded instead of popping in', () => {
      const hero = setup(0);
      const fade = () =>
        StyleSheet.flatten(hero.getAllByTestId('urbania-photo-fade')[0].props.style).opacity;

      expect(fade()).toBe(0);
      act(() => {
        hero.getByTestId('urbania-hero-photo').props.onLoad();
      });
      hero.wait(400);
      expect(fade()).toBe(1);
    });

    it('shows the photo anyway if the loaded signal never comes', () => {
      const hero = setup(0);
      const fade = () =>
        StyleSheet.flatten(hero.getAllByTestId('urbania-photo-fade')[0].props.style).opacity;

      expect(fade()).toBe(0);
      hero.wait(2000);
      expect(fade()).toBe(1);
    });

    it('shows the photo even when it fails to load, so the hero is never left empty', () => {
      const hero = setup(0);
      const fade = () =>
        StyleSheet.flatten(hero.getAllByTestId('urbania-photo-fade')[0].props.style).opacity;

      act(() => {
        hero.getByTestId('urbania-hero-photo').props.onError();
      });
      hero.wait(400);
      expect(fade()).toBe(1);
    });
  });
});
