import React from 'react';
import { Image } from 'react-native';

// Drop-in replacement for `react-native-fast-image`, built on React Native's own Image.
//
// The library's iOS image loader (SDWebImage with extra decoders) crashed the app with
// EXC_BAD_ACCESS: in the SVG decoder (SDImageSVGCoder) when an API returned an SVG url, and in the
// WebP path when bundled placeholders were drawn. React Native's Image uses the system loader and
// cache, simply fails to show an unsupported file, and never takes the app down.
//
// It keeps the same name, props and constants, so screens only changed their import. Options that
// only FastImage understood (`priority`, `cache`) are dropped.
const FastImage = React.forwardRef(({ source, resizeMode = 'cover', style, ...rest }, ref) => {
  let nextSource = source;
  if (source && typeof source === 'object' && source.uri) {
    // eslint-disable-next-line no-unused-vars
    const { priority, cache, ...imageSource } = source;
    nextSource = imageSource;
  }
  // resizeMode is also set in the style: newer React Native versions prefer it there, and without
  // it the image can render at its natural size and show only a zoomed centre crop.
  return (
    <Image
      ref={ref}
      source={nextSource}
      resizeMode={resizeMode}
      style={[style, { resizeMode }]}
      {...rest}
    />
  );
});

FastImage.displayName = 'FastImage';
FastImage.resizeMode = { contain: 'contain', cover: 'cover', stretch: 'stretch', center: 'center' };
FastImage.priority = { low: 'low', normal: 'normal', high: 'high' };
FastImage.cacheControl = { immutable: 'immutable', web: 'web', cacheOnly: 'cacheOnly' };

export default FastImage;
export { FastImage };
