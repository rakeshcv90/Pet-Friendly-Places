import {
  optimizeImageUrl,
  isOptimizableImageUrl,
  snapImageWidth,
  imageWidthForSize,
  IMAGE_WIDTHS,
  DEFAULT_IMAGE_WIDTH,
} from '../imageUrl';

const PHOTO = 'https://petfriendlyplaces.in/api/storage/objects/uploads/160e71e2-5dfa-4b17-ae0d-6b2d9edc26b8';

describe('optimizeImageUrl', () => {
  it('asks the image service for a resized copy, like the website does', () => {
    expect(optimizeImageUrl(PHOTO, 1080)).toBe(
      'https://petfriendlyplaces.in/_next/image?url=%2Fapi%2Fstorage%2Fobjects%2Fuploads%2F160e71e2-5dfa-4b17-ae0d-6b2d9edc26b8&w=1080&q=75',
    );
  });

  it('uses the default width when none is given', () => {
    expect(optimizeImageUrl(PHOTO)).toContain(`&w=${DEFAULT_IMAGE_WIDTH}&`);
  });

  it('leaves other addresses alone: other sites, local files, already resized, no address', () => {
    expect(optimizeImageUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    expect(optimizeImageUrl('file:///data/photo.jpg')).toBe('file:///data/photo.jpg');
    const resized = optimizeImageUrl(PHOTO, 640);
    expect(optimizeImageUrl(resized)).toBe(resized);
    expect(optimizeImageUrl('')).toBe('');
    expect(optimizeImageUrl(undefined)).toBeUndefined();
  });

  it('recognises only our own uploads', () => {
    expect(isOptimizableImageUrl(PHOTO)).toBe(true);
    expect(isOptimizableImageUrl('https://petfriendlyplaces.in/api/other/x')).toBe(false);
    expect(isOptimizableImageUrl(null)).toBe(false);
  });
});

describe('widths', () => {
  it('uses only three widths, so the server has few copies to make', () => {
    expect(IMAGE_WIDTHS).toEqual([640, 1080, 1920]);
  });

  it('only ever asks for one of the few widths the app uses', () => {
    for (const wanted of [1, 50, 100, 300, 700, 1000, 1500, 5000]) {
      expect(IMAGE_WIDTHS).toContain(snapImageWidth(wanted));
    }
  });

  it('picks the smallest allowed width that is big enough', () => {
    expect(snapImageWidth(100)).toBe(640);
    expect(snapImageWidth(640)).toBe(640);
    expect(snapImageWidth(641)).toBe(1080);
    expect(snapImageWidth(1500)).toBe(1920);
    expect(snapImageWidth(9999)).toBe(1920);
  });

  it('falls back to the default when the size is unknown', () => {
    expect(snapImageWidth(undefined)).toBe(DEFAULT_IMAGE_WIDTH);
    expect(imageWidthForSize('100%')).toBe(DEFAULT_IMAGE_WIDTH);
    expect(imageWidthForSize(undefined)).toBe(DEFAULT_IMAGE_WIDTH);
  });

  it('takes the screen density into account for a known size', () => {
    // jest's PixelRatio is 2: a 72 dp thumbnail needs 144 px, so the smallest copy (640)
    expect(imageWidthForSize(72)).toBe(640);
    // a 400 dp wide picture needs 800 px, so 1080
    expect(imageWidthForSize(400)).toBe(1080);
  });
});
