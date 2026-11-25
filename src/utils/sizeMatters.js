// Drop-in replacement for 'react-native-size-matters' (Metro points that import here, see
// metro.config.js). The library scales every size by screen width / 350, which is right for
// phones but makes everything 1.7x on a tablet: huge buttons and text. Here the scale is capped,
// so phones are exactly as before and tablets stop growing.
import { Dimensions } from 'react-native';

// Phones (short side up to PHONE_MAX_SHORT_SIDE dp) scale exactly like the library: a large phone
// is about 1.23 across and 1.4 down. A wider screen is a tablet or an unfolded foldable: it has more
// room, not bigger people, so it gets a small fixed scale instead of growing with the screen.
export const PHONE_MAX_SHORT_SIDE = 440;
export const TABLET_SCALE = 1.2;
export const TABLET_VERTICAL_SCALE = 1.2;

const GUIDELINE_WIDTH = 350;
const GUIDELINE_HEIGHT = 680;

const { width, height } = Dimensions.get('window');
const [shortDimension, longDimension] = width < height ? [width, height] : [height, width];
const isTablet = shortDimension > PHONE_MAX_SHORT_SIDE;

export const scaleFactor = isTablet ? TABLET_SCALE : shortDimension / GUIDELINE_WIDTH;
export const verticalScaleFactor = isTablet
  ? TABLET_VERTICAL_SCALE
  : longDimension / GUIDELINE_HEIGHT;

export const scale = size => scaleFactor * size;
export const verticalScale = size => verticalScaleFactor * size;
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
export const moderateVerticalScale = (size, factor = 0.5) =>
  size + (verticalScale(size) - size) * factor;

export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;
