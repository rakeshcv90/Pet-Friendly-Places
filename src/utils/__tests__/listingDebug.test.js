import { summarizeListingMedia } from '../../utils/listingDebug';

// The Food King Plaza response: 3 photos and 2 videos
const raw = {
  slug: 'food-king-plaza-yamuna-expressway',
  name: 'Food King Plaza (Yamuna Expressway)',
  main_image_url: '/api/storage/objects/uploads/a',
  images: [
    { image_url: '/api/storage/objects/uploads/a', caption: 'Plaza', media_type: 'image', is_main: true },
    { image_url: '/api/storage/objects/uploads/b', caption: 'Green space', media_type: 'image' },
    { image_url: '/api/storage/objects/uploads/c', caption: 'Night', media_type: 'image' },
    { image_url: '/api/storage/objects/uploads/d', media_type: 'video' },
    { image_url: '/api/storage/objects/uploads/e', media_type: 'video' },
  ],
};

describe('summarizeListingMedia', () => {
  it('counts what the API sent and what the app shows, to compare with Postman', () => {
    const summary = summarizeListingMedia(raw, ['a', 'b', 'c']);
    expect(summary.images_in_response).toBe(5);
    expect(summary.photos_in_response).toBe(3);
    expect(summary.videos_in_response).toBe(2);
    expect(summary.photos_shown_in_app).toBe(3);
    expect(summary.images[3]).toEqual({
      index: 3,
      media_type: 'video',
      is_main: false,
      image_url: '/api/storage/objects/uploads/d',
      caption: '',
    });
  });

  it('copes with a response that has no images', () => {
    const summary = summarizeListingMedia({ slug: 'x' });
    expect(summary.images_in_response).toBe(0);
    expect(summary.images).toEqual([]);
    expect(summarizeListingMedia(null).images_in_response).toBe(0);
  });
});
