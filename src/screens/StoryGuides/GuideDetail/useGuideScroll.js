import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import { s } from 'react-native-size-matters';

/**
 * Scroll state for the guide page: the scroll value, the entrance animation and every
 * scroll-driven animated node. The nodes are created once (re-creating them on a re-render
 * makes Animated re-attach them mid-scroll, which flickers).
 */
export const useGuideScroll = hasGuide => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = useWindowDimensions();
  const [metrics, setMetrics] = useState({ content: 0, view: 0, bodyTop: 0 });

  useEffect(() => {
    if (hasGuide) {
      entrance.setValue(0);
      Animated.spring(entrance, {
        toValue: 1,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [hasGuide, entrance]);

  const maxScroll = Math.max(metrics.content - metrics.view, 1);
  const motion = useMemo(
    () => ({
      entrance,
      heroScale: scrollY.interpolate({
        inputRange: [-300, 0],
        outputRange: [1.7, 1],
        extrapolateRight: 'clamp',
      }),
      heroTranslateY: scrollY.interpolate({
        inputRange: [0, 300],
        outputRange: [0, 110],
        extrapolate: 'clamp',
      }),
      cardTiltX: scrollY.interpolate({
        inputRange: [0, 240],
        outputRange: ['0deg', '3deg'],
        extrapolate: 'clamp',
      }),
      sheenX: scrollY.interpolate({
        inputRange: [-60, 0, 320],
        outputRange: [-s(200), -s(60), s(380)],
        extrapolate: 'clamp',
      }),
      compactOpacity: scrollY.interpolate({
        inputRange: [150, 230],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      progressX: scrollY.interpolate({
        inputRange: [0, maxScroll],
        outputRange: [-screenWidth, 0],
        extrapolate: 'clamp',
      }),
      cardEntranceY: entrance.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }),
      cardEntranceRotate: entrance.interpolate({
        inputRange: [0, 1],
        outputRange: ['9deg', '0deg'],
      }),
    }),
    [scrollY, entrance, maxScroll, screenWidth],
  );

  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );
  const onViewLayout = useCallback(e => {
    const view = e.nativeEvent.layout.height;
    setMetrics(m => (m.view === view ? m : { ...m, view }));
  }, []);
  // only the progress line needs the content height, and not to the pixel
  const onContentSizeChange = useCallback((_, content) => {
    setMetrics(m => (Math.abs(m.content - content) > 40 ? { ...m, content } : m));
  }, []);
  const onBodyLayout = useCallback(e => {
    const bodyTop = e.nativeEvent.layout.y;
    setMetrics(m => (m.bodyTop === bodyTop ? m : { ...m, bodyTop }));
  }, []);

  return {
    scrollY,
    motion,
    screenWidth,
    viewportH: metrics.view,
    bodyTop: metrics.bodyTop,
    onScroll,
    onViewLayout,
    onContentSizeChange,
    onBodyLayout,
  };
};
