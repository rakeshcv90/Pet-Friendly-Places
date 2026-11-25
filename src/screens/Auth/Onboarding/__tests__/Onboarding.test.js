// The screen reads the window size when it loads, so each case sets the width first
const load = width => {
  jest.resetModules();
  jest.doMock('../../../../theme', () => {
    const actual = jest.requireActual('../../../../theme');
    return {
      ...actual,
      theme: {
        ...actual.theme,
        dimensions: { ...actual.theme.dimensions, window: { width, height: width * 1.6 } },
      },
    };
  });
  return require('../index');
};

const TITLE = 'Discover\nPet-Friendly Places\nAcross India';

describe('Onboarding title', () => {
  afterEach(() => jest.dontMock('../../../../theme'));

  it('keeps the written line breaks on a phone', () => {
    const { formatTitle } = load(393);
    expect(formatTitle(TITLE)).toBe(TITLE);
  });

  it('puts the title on one flowing line on a tablet', () => {
    const { formatTitle } = load(800);
    expect(formatTitle(TITLE)).toBe('Discover Pet-Friendly Places Across India');
    expect(formatTitle('Know the Rules\nBefore You Go')).toBe('Know the Rules Before You Go');
  });
});
