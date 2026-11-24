import { storyCoverUrl } from '../storyCover';

describe('storyCoverUrl', () => {
  it('uses the cover the story sets', () => {
    expect(storyCoverUrl({ cover_image_url: '/cover.jpg', og_image_url: '/og.jpg' })).toBe('/cover.jpg');
  });

  it('uses the share image when there is no cover', () => {
    expect(storyCoverUrl({ cover_image_url: '', og_image_url: '/og.jpg' })).toBe('/og.jpg');
  });

  it('uses the first photo of the gallery when the story sets neither, like the website', () => {
    expect(
      storyCoverUrl({
        cover_image_url: '',
        og_image_url: null,
        gallery_media: [
          { url: '/first.jpg', kind: 'image' },
          { url: '/second.jpg', kind: 'image' },
        ],
      }),
    ).toBe('/first.jpg');
  });

  it('skips a video at the front of the gallery and takes the first photo', () => {
    expect(
      storyCoverUrl({
        gallery_media: [
          { url: '/clip.mp4', kind: 'video' },
          { url: '/photo.jpg', kind: 'image' },
        ],
      }),
    ).toBe('/photo.jpg');
  });

  it('skips gallery items without an address', () => {
    expect(storyCoverUrl({ gallery_media: [{ kind: 'image' }, { url: '/x.jpg', kind: 'image' }] })).toBe('/x.jpg');
  });

  it('falls back to the second hero image when the gallery has no photo', () => {
    expect(
      storyCoverUrl({
        gallery_media: [{ url: '/clip.mp4', kind: 'video' }],
        hero_secondary_image_url: '/hero2.jpg',
      }),
    ).toBe('/hero2.jpg');
  });

  it('gives nothing when the story has no picture at all', () => {
    expect(storyCoverUrl({ cover_image_url: '' })).toBe('');
    expect(storyCoverUrl({ gallery_media: [] })).toBe('');
    expect(storyCoverUrl({ gallery_media: 'nope' })).toBe('');
  });

  it('copes with a missing story', () => {
    expect(storyCoverUrl(undefined)).toBe('');
    expect(storyCoverUrl(null)).toBe('');
    expect(storyCoverUrl('text')).toBe('');
  });
});
