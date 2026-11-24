// The picture a travel story is known by. Most stories set a cover; a few do not, and the website then
// uses the first photo of the story's gallery, so the app does the same instead of showing a blank.
// Returns the address as the API sent it (it may still need resolveImageUrl), or '' when there is none.
export const storyCoverUrl = story => {
  if (!story || typeof story !== 'object') {
    return '';
  }
  const direct = story.cover_image_url || story.og_image_url;
  if (direct) {
    return direct;
  }
  const gallery = Array.isArray(story.gallery_media) ? story.gallery_media : [];
  const photo = gallery.find(item => item?.url && item.kind !== 'video');
  return photo?.url || story.hero_secondary_image_url || '';
};
