jest.mock('../../../hooks/useDiscovery', () => ({
  resolveImageUrl: u => (u ? (u.startsWith('http') ? u : `https://x.test${u}`) : ''),
}));

import {
  slugifyCity,
  buildCategories,
  sortListings,
  listingToCard,
  normalizeIntro,
  categoryTaglines,
  readRoutes,
  readNearby,
} from '../cityDetailModel';

const L = [
  { id: 1, slug: 'a', name: 'A', category: 'Stays', verification_tier: 'TEAM_VERIFIED', verification_status: 'verified' },
  { id: 2, slug: 'b', name: 'B', category: 'Eat out' },
  { id: 3, slug: 'c', name: 'C', category: 'Stays', verification_tier: 'TAILS_VERIFIED', verification_status: 'verified', main_image_url: '/img/c' },
];

describe('cityDetailModel', () => {
  it('slugifies city names', () => {
    expect(slugifyCity('New Delhi')).toBe('new-delhi');
    expect(slugifyCity(' Agonda ')).toBe('agonda');
  });

  it('builds category counts with All first', () => {
    const cats = buildCategories(L);
    expect(cats[0]).toMatchObject({ key: 'all', count: 3 });
    expect(cats[1]).toMatchObject({ key: 'Stays', count: 2, icon: 'bed-outline' });
  });

  it('sorts Tails Verified first and maps cards', () => {
    const sorted = sortListings(L);
    expect(sorted.map(l => l.id)).toEqual([3, 1, 2]);
    expect(listingToCard(L[2])).toMatchObject({
      slug: 'c',
      badge: 'Tails Verified',
      imageUri: 'https://x.test/img/c',
    });
    expect(listingToCard(L[1]).badge).toBe('');
  });

  it('normalizes intro sections from text, html and lists', () => {
    const intro = normalizeIntro({
      about: '<p>Quiet beach town.</p>',
      getting_there: ['By road', 'By train'],
      areasToKnow: [{ title: 'Palolem', description: 'Busy' }],
    });
    expect(intro.sections.map(s => s.key)).toEqual(['about', 'getting_there', 'areas_to_know']);
    expect(intro.sections[0].body).toEqual(['Quiet beach town.']);
    expect(intro.sections[2].body).toEqual(['Palolem: Busy']);
    expect(normalizeIntro(null).sections).toEqual([]);
  });

  it('reads taglines, routes and nearby cities', () => {
    expect(categoryTaglines([{ category: 'Stays', tagline: 'Sleep easy' }], 'agonda')).toEqual({
      Stays: 'Sleep easy',
    });
    expect(readRoutes([{ slug: 'r', title: 'T', origin_city: 'Delhi', destination_city: 'Agonda' }])[0].subtitle).toBe('Delhi to Agonda');
    expect(readNearby([{ name: 'Agonda' }, { name: 'Palolem', state: 'Goa', verified_count: 3 }], 'Agonda')).toEqual([
      { city: 'Palolem', state: 'Goa', verified: 3 },
    ]);
  });
});
