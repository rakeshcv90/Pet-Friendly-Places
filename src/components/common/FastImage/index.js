import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { images } from '../../../theme/images';
import { useStore } from '../../../store';
import { optimizeImageUrl, imageWidthForSize } from '../../../utils/imageUrl';

// Drop-in replacement for `react-native-fast-image`, built on React Native's own Image.
//
// The library's iOS image loader (SDWebImage with extra decoders) crashed the app with
// EXC_BAD_ACCESS: in the SVG decoder (SDImageSVGCoder) when an API returned an SVG url, and in the
// WebP path when bundled placeholders were drawn. React Native's Image uses the system loader and
// cache, simply fails to show an unsupported file, and never takes the app down.
//
// It keeps the same name, props and constants, so screens only changed their import. Options that
// only FastImage understood (`priority`, `cache`) are dropped.
//
// Pictures loaded from the web get a soft placeholder while they download, fade in once they are
// ready, and fall back to the bundled "no image" picture when they fail. Bundled pictures and
// local files (photos just picked from the camera or gallery) are drawn as they are.

const FADE_MS = 220;
const PLACEHOLDER_LIGHT = '#EFEAF8';
const PLACEHOLDER_DARK = '#1E0E38';
const MIN_ICON_BOX = 44;
// A picture that fails to load (a dropped connection, a busy server, memory pressure while many
// big pictures decode at once) is tried again this many times, a little later each time, before
// the "no image" picture is shown. Most failures are brief, so this saves a blank or missing photo.
export const MAX_RETRIES = 2;
export const RETRY_DELAY_MS = 900;

const isRemoteSource = source =>
  !!source &&
  typeof source === 'object' &&
  !Array.isArray(source) &&
  typeof source.uri === 'string' &&
  /^https?:\/\//i.test(source.uri);

const cleanSource = source => {
  // eslint-disable-next-line no-unused-vars
  const { priority, cache, ...imageSource } = source;
  return imageSource;
};

// Start downloading pictures before they scroll into view so they are ready when needed.
export const prefetchImages = (urls = [], limit = 12) => {
  const unique = [...new Set(urls)].filter(
    url => typeof url === 'string' && /^https?:\/\//i.test(url),
  );
  unique.slice(0, limit).forEach(url => {
    try {
      Promise.resolve(Image.prefetch(optimizeImageUrl(url))).catch(() => {});
    } catch (e) {
      // prefetch is only a speed-up
    }
  });
};

const RemoteImage = React.forwardRef(
  ({ source, resizeMode, style, onLoad, onError, onLayout, ...rest }, ref) => {
    const isDarkMode = useStore(state => state.isDarkMode);
    // The address asked for, and the one actually requested: our own uploads are fetched as a resized
    // copy (see utils/imageUrl.js), with the original as a last resort if that fails
    const originalUri = source.uri;
    const [useOriginal, setUseOriginal] = useState(false);
    const flatStyle = StyleSheet.flatten(style) || {};
    const requestWidth = imageWidthForSize(
      typeof flatStyle.width === 'number' ? flatStyle.width : undefined,
    );
    const uri = useOriginal ? originalUri : optimizeImageUrl(originalUri, requestWidth);
    const [status, setStatus] = useState('loading'); // loading | loaded | error
    const [box, setBox] = useState(0);
    // Which try this is; a new number makes React Native request the picture again
    const [attempt, setAttempt] = useState(0);
    const retryTimer = useRef(null);
    // A fresh fade value for every picture and every try, matching the image view React mounts for it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fade = useMemo(() => new Animated.Value(0), [uri, attempt]);
    const pulse = useRef(new Animated.Value(0.35)).current;

    // A new picture starts again from the placeholder
    useEffect(() => {
      setStatus('loading');
      setAttempt(0);
      setUseOriginal(false);
    }, [originalUri]);

    useEffect(() => () => clearTimeout(retryTimer.current), []);

    useEffect(() => {
      if (status !== 'loading') {
        return undefined;
      }
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.85,
            duration: 750,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0.35,
            duration: 750,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }, [status, pulse]);

    const handleLoad = useCallback(
      event => {
        setStatus('loaded');
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
        onLoad?.(event);
      },
      [fade, onLoad],
    );

    const handleError = useCallback(
      event => {
        if (attempt < MAX_RETRIES) {
          // Keep the placeholder showing and ask again shortly
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(
            () => setAttempt(value => value + 1),
            RETRY_DELAY_MS * (attempt + 1),
          );
          return;
        }
        // The resized copy failed: try the original once before giving up
        if (!useOriginal && uri !== originalUri) {
          setUseOriginal(true);
          setAttempt(0);
          return;
        }
        setStatus('error');
        onError?.(event);
      },
      [attempt, onError, useOriginal, uri, originalUri],
    );

    const handleLayout = useCallback(
      event => {
        const { width, height } = event.nativeEvent.layout;
        setBox(Math.min(width, height));
        onLayout?.(event);
      },
      [onLayout],
    );

    // The caller's layout style goes on the container; the picture and placeholder fill it
    const {
      tintColor,
      resizeMode: styleResizeMode,
      ...layoutStyle
    } = StyleSheet.flatten(style) || {};
    const background = isDarkMode ? PLACEHOLDER_DARK : PLACEHOLDER_LIGHT;
    const iconSize = Math.max(14, Math.min(40, box * 0.34));

    return (
      <View style={[layoutStyle, styles.container]} onLayout={handleLayout}>
        {status === 'error' ? (
          <Image
            testID="fast-image-fallback"
            source={images.noimage1}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <>
            {status === 'loading' ? (
              <View
                testID="fast-image-placeholder"
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  styles.placeholder,
                  { backgroundColor: background },
                ]}>
                {box >= MIN_ICON_BOX ? (
                  <Animated.View style={{ opacity: pulse }}>
                    <Ionicons
                      name="paw"
                      size={iconSize}
                      color={isDarkMode ? '#7C3AED' : '#B9A5E8'}
                    />
                  </Animated.View>
                ) : null}
              </View>
            ) : null}
            <Animated.Image
              key={attempt}
              ref={ref}
              source={uri === originalUri ? source : { ...source, uri }}
              resizeMode={resizeMode}
              // Android decodes web pictures at their full size by default ("scale"). The story
              // photos are 8 MB originals, which can run the phone out of memory and fail to
              // load. "resize" decodes them at the size they are drawn instead.
              resizeMethod="resize"
              style={[
                StyleSheet.absoluteFill,
                { opacity: fade, resizeMode },
                tintColor ? { tintColor } : null,
              ]}
              onLoad={handleLoad}
              onError={handleError}
              {...rest}
            />
          </>
        )}
      </View>
    );
  },
);
RemoteImage.displayName = 'RemoteImage';

const FastImage = React.forwardRef(({ source, resizeMode = 'cover', style, ...rest }, ref) => {
  if (isRemoteSource(source)) {
    return (
      <RemoteImage
        ref={ref}
        source={cleanSource(source)}
        resizeMode={resizeMode}
        style={style}
        {...rest}
      />
    );
  }

  let nextSource = source;
  if (source && typeof source === 'object' && source.uri) {
    nextSource = cleanSource(source);
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

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});

FastImage.displayName = 'FastImage';
FastImage.resizeMode = { contain: 'contain', cover: 'cover', stretch: 'stretch', center: 'center' };
FastImage.priority = { low: 'low', normal: 'normal', high: 'high' };
FastImage.cacheControl = { immutable: 'immutable', web: 'web', cacheOnly: 'cacheOnly' };

export default FastImage;
export { FastImage };
