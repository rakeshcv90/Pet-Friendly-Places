// How a fixed-shape picture or video fills a screen.
//
// "Cover" (fill the screen, crop what spills over) is right for phones. On a tall phone only a
// little of the sides is cropped, which is harmless, so cover is always used there.
// On a WIDE screen, such as a foldable's inner display or a tablet, covering zooms in so far that
// the top and bottom disappear (the logo, the dog's head, the button area). When covering would
// crop more than MAX_CROP_RATIO there, the whole picture is shown ("contain") centred, and the
// caller fills the leftover sides with a blurred copy of the same picture.
export const MAX_CROP_RATIO = 1.15;

// A picture with nothing important near its edges (like the logo video, a centred logo on a plain
// background) can be cropped much more than the welcome picture before anything is lost.
export const EDGE_SAFE_CROP_RATIO = 1.6;

export const getFitLayout = (
  contentWidth,
  contentHeight,
  screenWidth,
  screenHeight,
  maxCropRatio = MAX_CROP_RATIO,
) => {
  const cover = Math.max(screenWidth / contentWidth, screenHeight / contentHeight);
  const contain = Math.min(screenWidth / contentWidth, screenHeight / contentHeight);
  const screenIsWider = screenWidth / screenHeight > contentWidth / contentHeight;
  const useCover = !screenIsWider || cover / contain <= maxCropRatio;
  const scale = useCover ? cover : contain;
  const width = contentWidth * scale;
  const height = contentHeight * scale;

  return {
    mode: useCover ? 'cover' : 'contain',
    width,
    height,
    left: (screenWidth - width) / 2,
    top: (screenHeight - height) / 2,
  };
};
