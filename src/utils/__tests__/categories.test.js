import { mapApiCategories } from '../categories';

describe('categories utility - mapApiCategories', () => {
  it('returns an empty array when input is invalid or empty', () => {
    expect(mapApiCategories(null)).toEqual([]);
    expect(mapApiCategories(undefined)).toEqual([]);
    expect(mapApiCategories('invalid')).toEqual([]);
    expect(mapApiCategories([])).toEqual([]);
  });

  it('maps known categories correctly with configuration attributes', () => {
    const rawCategories = [
      { category: 'Stays', listing_count: 15 },
      { category: 'Cafe', listing_count: 8 },
      { category: 'vet', listing_count: 4 },
    ];

    const result = mapApiCategories(rawCategories);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'Stays',
      name: 'Stays',
      icon: 'bed-outline',
      color: '#7B2CFF',
      bgColor: '#F3EEFF',
      count: 15,
      rawCategory: 'Stays',
    });
    expect(result[2]).toEqual({
      id: 'vet',
      name: 'Vet care',
      icon: 'medkit-outline',
      color: '#D946EF',
      bgColor: '#FDF4FF',
      count: 4,
      rawCategory: 'vet',
    });
  });

  it('provides safe defaults for unknown category keys', () => {
    const rawCategories = [{ category: 'UnknownCategory', listing_count: 2 }];
    const result = mapApiCategories(rawCategories);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'UnknownCategory',
      name: 'UnknownCategory',
      icon: 'paw-outline',
      color: '#7B2CFF',
      bgColor: '#F3EEFF',
      count: 2,
      rawCategory: 'UnknownCategory',
    });
  });

  it('defaults listing count to 0 when missing', () => {
    const rawCategories = [{ category: 'Cafe' }];
    const result = mapApiCategories(rawCategories);

    expect(result[0].count).toBe(0);
  });
});
