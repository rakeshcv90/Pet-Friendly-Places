// Development console log for checking a place against Postman. Silent in release builds and tests.
// Filter the console by "[Listing]".
export const logListing = (...args) => {
  if (__DEV__ && !process.env.JEST_WORKER_ID) {
    // eslint-disable-next-line no-console
    console.log('[Listing]', ...args);
  }
};

// What the response says about a place's photos and videos, in a shape that is easy to compare with
// the Postman response (`images` in the JSON), and how many of them the app shows.
export const summarizeListingMedia = (raw, shownPhotos = []) => {
  const images = Array.isArray(raw?.images) ? raw.images : [];
  return {
    slug: raw?.slug,
    name: raw?.name,
    main_image_url: raw?.main_image_url,
    images_in_response: images.length,
    photos_in_response: images.filter(i => !i?.media_type || i.media_type === 'image').length,
    videos_in_response: images.filter(i => i?.media_type === 'video').length,
    photos_shown_in_app: shownPhotos.length,
    images: images.map((image, index) => ({
      index,
      media_type: image?.media_type || 'image',
      is_main: Boolean(image?.is_main),
      image_url: image?.image_url,
      caption: image?.caption || '',
    })),
  };
};
