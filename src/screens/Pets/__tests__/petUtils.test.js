import { petSubtitle, capitalizeFirst } from '../petUtils';

describe('petUtils', () => {
  it('capitalizes only the first letter', () => {
    expect(capitalizeFirst('rabbit')).toBe('Rabbit');
    expect(capitalizeFirst('golden retriever')).toBe('Golden retriever');
    expect(capitalizeFirst('')).toBe('');
    expect(capitalizeFirst(undefined)).toBe('');
  });

  it('writes the pet type and breed starting with capital letters', () => {
    expect(petSubtitle({ type: 'rabbit', breed: 'Desi' })).toBe('Rabbit · Desi');
    expect(petSubtitle({ type: 'DOG', breed: 'golden retriever' })).toBe('Dog · Golden retriever');
  });

  it('skips a missing breed and placeholder values', () => {
    expect(petSubtitle({ type: 'cat' })).toBe('Cat');
    expect(petSubtitle({ type: 'dog', breed: 'REPLACE_ME' })).toBe('Dog');
    expect(petSubtitle({})).toBe('');
  });
});
