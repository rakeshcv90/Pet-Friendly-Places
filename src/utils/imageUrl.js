import { PixelRatio } from 'react-native';
import { API_BASE_URL } from '../services/api/apiList';

// The website never sends the original photos to a browser. Uploads can be 20 MB or more (and the
// server sometimes fails with an error on the biggest ones), so the site asks its image service for
// a resized copy: /_next/image?url=<path>&w=<width>&q=75. The app does the same, which makes photos
// 50 to 200 times smaller.
//
// The server makes each (photo, width) copy the first time it is asked for, and for a 20 MB original
// that can take many seconds (sometimes over a minute); after that it is served from its cache in
// under a second. So the app asks for only three widths: every extra width is another slow first
// request for the same photo. (The service accepts more widths, but only these three are used.)
export const IMAGE_WIDTHS = [640, 1080, 1920];
export const DEFAULT_IMAGE_WIDTH = 1080;
export const IMAGE_QUALITY = 75;

const ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
// Only photos stored on our own server go through the image service
const UPLOADS_PREFIX = `${ORIGIN}/api/storage/objects/uploads/`;

// The smallest allowed width that is at least as wide as asked for
export const snapImageWidth = pixels => {
  const wanted = Number(pixels);
  if (!Number.isFinite(wanted) || wanted <= 0) {
    return DEFAULT_IMAGE_WIDTH;
  }
  return IMAGE_WIDTHS.find(width => width >= wanted) || IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];
};

// A width in pixels for a picture drawn `dp` wide on this screen, or the default if unknown
export const imageWidthForSize = dp => {
  if (typeof dp !== 'number' || !Number.isFinite(dp) || dp <= 0) {
    return DEFAULT_IMAGE_WIDTH;
  }
  return snapImageWidth(dp * Math.min(PixelRatio.get(), 3));
};

export const isOptimizableImageUrl = url =>
  typeof url === 'string' && url.startsWith(UPLOADS_PREFIX) && !url.includes('?');

// The resized-copy address for one of our uploaded photos; any other address is returned unchanged
export const optimizeImageUrl = (url, width = DEFAULT_IMAGE_WIDTH) => {
  if (!isOptimizableImageUrl(url)) {
    return url;
  }
  const path = url.slice(ORIGIN.length);
  return `${ORIGIN}/_next/image?url=${encodeURIComponent(path)}&w=${snapImageWidth(
    width,
  )}&q=${IMAGE_QUALITY}`;
};
