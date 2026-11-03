import { fetchArticles, fetchArticleDetail, resolveImageUrl } from '../useDiscovery';
import { api } from '../../services/api/apiClient';

jest.mock('../../services/api/apiClient', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('../../services/storage/storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('useDiscovery - Article endpoints and pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches All Guides using GET /articles?limit=100&offset=0 without category param', async () => {
    api.get.mockResolvedValueOnce({ articles: [{ id: 1, title: 'Guide 1' }], total: 96 });

    const result = await fetchArticles({ limit: 100, offset: 0 });

    expect(api.get).toHaveBeenCalledWith('/articles?limit=100&offset=0');
    expect(result.total).toBe(96);
    expect(result.articles.length).toBe(1);
  });

  it('fetches Pet Health guides using GET /articles?category=pet-health&limit=100&offset=0', async () => {
    api.get.mockResolvedValueOnce({ articles: [{ id: 2, title: 'Health Guide' }], total: 16 });

    const result = await fetchArticles({
      category: 'pet-health',
      limit: 100,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/articles?category=pet-health&limit=100&offset=0',
    );
    expect(result.total).toBe(16);
  });

  it('fetches Pet Travel India guides using GET /articles?category=pet-travel&limit=100&offset=0', async () => {
    api.get.mockResolvedValueOnce({ articles: [], total: 14 });

    await fetchArticles({
      category: 'pet-travel',
      limit: 100,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/articles?category=pet-travel&limit=100&offset=0',
    );
  });

  it('fetches Pet Parenting guides using GET /articles?category=pet-parenting&limit=100&offset=0', async () => {
    api.get.mockResolvedValueOnce({ articles: [], total: 7 });

    await fetchArticles({
      category: 'pet-parenting',
      limit: 100,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/articles?category=pet-parenting&limit=100&offset=0',
    );
  });

  it('fetches Misconceptions guides using GET /articles?category=misconceptions&limit=100&offset=0', async () => {
    api.get.mockResolvedValueOnce({ articles: [], total: 7 });

    await fetchArticles({
      category: 'misconceptions',
      limit: 100,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/articles?category=misconceptions&limit=100&offset=0',
    );
  });

  it('fetches Destination Guides using GET /articles?category=destinations&limit=100&offset=0', async () => {
    api.get.mockResolvedValueOnce({ articles: [], total: 25 });

    await fetchArticles({
      category: 'destinations',
      limit: 100,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/articles?category=destinations&limit=100&offset=0',
    );
  });

  it('fetches Rescue & Welfare guides using GET /articles?category=guide&limit=100&offset=0', async () => {
    api.get.mockResolvedValueOnce({ articles: [], total: 16 });

    await fetchArticles({
      category: 'guide',
      limit: 100,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith(
      '/articles?category=guide&limit=100&offset=0',
    );
  });

  it('handles pagination with offset increments', async () => {
    api.get.mockResolvedValueOnce({ articles: [{ id: 101 }], total: 150 });

    await fetchArticles({
      category: null,
      limit: 100,
      offset: 100,
    });

    expect(api.get).toHaveBeenCalledWith('/articles?limit=100&offset=100');
  });

  it('fetches single article details using GET /articles/:slug', async () => {
    const mockDetail = { id: 'art-1', slug: 'dog-friendly-lake', title: 'Dog Friendly Lake' };
    api.get.mockResolvedValueOnce(mockDetail);

    const result = await fetchArticleDetail('dog-friendly-lake');

    expect(api.get).toHaveBeenCalledWith('/articles/dog-friendly-lake');
    expect(result).toEqual(mockDetail);
  });

  it('resolves image URLs accurately', () => {
    expect(resolveImageUrl('https://example.com/pic.jpg')).toBe(
      'https://example.com/pic.jpg',
    );
    expect(
      resolveImageUrl(
        '/api/storage/objects/uploads/abc',
      ),
    ).toContain('/api/storage/objects/uploads/abc');
    expect(resolveImageUrl('', 'fallback.jpg')).toBe('fallback.jpg');
  });
});
