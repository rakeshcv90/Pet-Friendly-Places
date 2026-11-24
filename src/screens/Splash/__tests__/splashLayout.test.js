import { getFitLayout, MAX_CROP_RATIO } from '../splashLayout';

// The welcome picture is 887 x 1773 (a tall portrait)
const W = 887;
const H = 1773;

describe('getFitLayout', () => {
  it('fills a normal tall phone, as before', () => {
    // 1080 x 2400
    const layout = getFitLayout(W, H, 1080, 2400);

    expect(layout.mode).toBe('cover');
    // Matches the height and centres sideways, cropping a little of the width
    expect(layout.height).toBeCloseTo(2400);
    expect(layout.top).toBeCloseTo(0);
    expect(layout.width).toBeGreaterThanOrEqual(1080 * 0.99);
    expect(layout.left).toBeCloseTo((1080 - layout.width) / 2);
  });

  it('fills a 16:9 phone too: the crop there is small', () => {
    const layout = getFitLayout(W, H, 1080, 1920);
    expect(layout.mode).toBe('cover');
  });

  it('shows the whole picture on a foldable\'s near-square screen', () => {
    // The foldable in the bug report: 2076 x 2152
    const layout = getFitLayout(W, H, 2076, 2152);

    expect(layout.mode).toBe('contain');
    // Nothing is cut: the full height is shown, and the width is the picture's own shape
    expect(layout.height).toBeCloseTo(2152);
    expect(layout.width).toBeCloseTo(2152 * (W / H));
    expect(layout.top).toBeCloseTo(0);
    // Centred, with room left on both sides for the blurred fill
    expect(layout.left).toBeGreaterThan(0);
    expect(layout.left).toBeCloseTo((2076 - layout.width) / 2);
  });

  it('shows the whole picture on a tablet', () => {
    const layout = getFitLayout(W, H, 1600, 2560);
    expect(layout.mode).toBe('contain');
    expect(layout.width).toBeLessThanOrEqual(1600);
    expect(layout.height).toBeLessThanOrEqual(2560);
  });

  it('keeps filling very tall phones: only a little of the sides is lost', () => {
    // 21:9 phone, taller than the picture
    expect(getFitLayout(W, H, 1080, 2520).mode).toBe('cover');
    expect(getFitLayout(W, H, 1080, 2640).mode).toBe('cover');
  });

  it('does not let a wide screen crop more than the allowed amount when it fills the screen', () => {
    for (const [sw, sh] of [[1080, 1920], [1080, 1800], [1100, 1900], [1500, 2560]]) {
      const layout = getFitLayout(W, H, sw, sh);
      if (layout.mode === 'cover' && sw / sh > W / H) {
        const contain = Math.min(sw / W, sh / H);
        expect(layout.height / (H * contain)).toBeLessThanOrEqual(MAX_CROP_RATIO + 1e-9);
      }
    }
  });

  it('treats the 1080 x 1920 splash video the same way: fills phones, shows all on a foldable', () => {
    expect(getFitLayout(1080, 1920, 1080, 2400).mode).toBe('cover');
    expect(getFitLayout(1080, 1920, 1080, 1920).mode).toBe('cover');
    expect(getFitLayout(1080, 1920, 2076, 2152).mode).toBe('contain');
  });

  it('keeps the picture inside the screen whenever it shows all of it', () => {
    for (const [sw, sh] of [[2076, 2152], [1600, 2560], [800, 2400], [1500, 1500]]) {
      const layout = getFitLayout(W, H, sw, sh);
      if (layout.mode === 'contain') {
        expect(layout.width).toBeLessThanOrEqual(sw + 1e-6);
        expect(layout.height).toBeLessThanOrEqual(sh + 1e-6);
        expect(layout.left).toBeGreaterThanOrEqual(-1e-6);
        expect(layout.top).toBeGreaterThanOrEqual(-1e-6);
      }
    }
  });
});
