// The Dimensions are read when the module loads, so each case sets the screen first
const load = (width, height) => {
  jest.resetModules();
  jest.doMock('react-native', () => ({
    Dimensions: { get: () => ({ width, height }) },
  }));
  return require('../sizeMatters');
};

describe('sizeMatters', () => {
  it('scales a normal phone exactly like react-native-size-matters', () => {
    const { s, vs, ms } = load(393, 852);
    expect(s(52)).toBeCloseTo((393 / 350) * 52);
    expect(vs(10)).toBeCloseTo((852 / 680) * 10);
    expect(ms(16)).toBeCloseTo(16 + ((393 / 350) * 16 - 16) * 0.5);
  });

  it('does not cap a large phone', () => {
    const { s } = load(430, 932);
    expect(s(10)).toBeCloseTo((430 / 350) * 10);
  });

  it('uses a small fixed scale on a tablet, whatever its size', () => {
    const { s, vs, TABLET_SCALE, TABLET_VERTICAL_SCALE } = load(600, 960);
    expect(s(52)).toBeCloseTo(52 * TABLET_SCALE);
    expect(s(52)).toBeLessThan(70);
    expect(vs(100)).toBeCloseTo(100 * TABLET_VERTICAL_SCALE);
    const bigTablet = load(800, 1280);
    expect(bigTablet.s(52)).toBeCloseTo(52 * TABLET_SCALE);
  });

  it('is never bigger on a tablet than on the largest phone', () => {
    const phone = load(430, 932).s(10);
    const tablet = load(600, 960).s(10);
    expect(tablet).toBeLessThan(phone);
  });

  it('gives the same size in portrait and landscape', () => {
    const portrait = load(600, 960).s(20);
    const landscape = load(960, 600).s(20);
    expect(landscape).toBeCloseTo(portrait);
  });

  it('keeps moderate scale between the plain size and the scaled size', () => {
    const { ms, s } = load(430, 932);
    expect(ms(20)).toBeGreaterThan(20);
    expect(ms(20)).toBeLessThan(s(20));
  });
});
