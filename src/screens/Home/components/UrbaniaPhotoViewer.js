import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Animated,
  BackHandler,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from './BouncyPressable';
import { GALLERY_LABELS, GALLERY_RATIOS } from './UrbaniaSections';
import { fitSize } from '../photoFit';

// Room kept at the bottom for the row of thumbnails
const THUMB_AREA = s(78);

// Full-screen view of the Urbania photos. Swipe sideways or use the arrows to go through all of
// them. It is a plain overlay, not a Modal, so it cannot cause the black-screen problem that nested
// modals cause on iOS.
export const UrbaniaPhotoViewer = ({ index, onIndexChange, onClose }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const appear = useRef(new Animated.Value(0)).current;
  const photos = theme.images.urbaniaGallery;
  const last = photos.length - 1;

  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [appear]);

  // On Android the back button closes the viewer first, not the whole screen
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [onClose]);

  const goTo = useCallback(
    next => {
      const target = Math.min(Math.max(next, 0), last);
      if (target === index) {
        return;
      }
      listRef.current?.scrollToIndex?.({ index: target, animated: true });
      onIndexChange(target);
    },
    [index, last, onIndexChange],
  );

  const handleScrollEnd = useCallback(
    event => {
      const page = Math.round(event.nativeEvent.contentOffset.x / width);
      if (page !== index && page >= 0 && page <= last) {
        onIndexChange(page);
      }
    },
    [index, last, onIndexChange, width],
  );

  const atStart = index <= 0;
  const atEnd = index >= last;

  return (
    <Animated.View
      style={[styles.root, { opacity: appear }]}
      testID="urbania-viewer"
      accessibilityViewIsModal>
      <FlatList
        ref={listRef}
        testID="urbania-viewer-list"
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={({ item, index: i }) => {
          // Drawn whole, at an exact size worked out from the photo's shape
          const whole = fitSize(GALLERY_RATIOS[i], width, height, 'contain');
          return (
            <View style={[styles.page, { width, height }]}>
              <Image
                testID={`urbania-viewer-photo-${i}`}
                source={item}
                style={[styles.photo, whole]}
                resizeMode="stretch"
                accessibilityLabel={GALLERY_LABELS[i]}
              />
            </View>
          );
        }}
      />

      <View style={[styles.top, { paddingTop: insets.top + s(10) }]} pointerEvents="box-none">
        <View style={styles.counter}>
          <Text testID="urbania-viewer-counter" style={styles.counterText}>
            {`${index + 1} / ${photos.length}`}
          </Text>
        </View>
        <BouncyPressable
          testID="urbania-viewer-close"
          accessibilityLabel="Close photos"
          activeScale={0.9}
          onPress={onClose}
          style={styles.round}>
          <Ionicons name="close" size={ms(22)} color="#FFFFFF" />
        </BouncyPressable>
      </View>

      <BouncyPressable
        testID="urbania-viewer-prev"
        accessibilityLabel="Previous photo"
        accessibilityState={{ disabled: atStart }}
        activeScale={0.9}
        disabled={atStart}
        onPress={() => goTo(index - 1)}
        style={[styles.arrow, styles.arrowLeft, atStart && styles.arrowOff]}>
        <Ionicons name="chevron-back" size={ms(24)} color="#FFFFFF" />
      </BouncyPressable>
      <BouncyPressable
        testID="urbania-viewer-next"
        accessibilityLabel="Next photo"
        accessibilityState={{ disabled: atEnd }}
        activeScale={0.9}
        disabled={atEnd}
        onPress={() => goTo(index + 1)}
        style={[styles.arrow, styles.arrowRight, atEnd && styles.arrowOff]}>
        <Ionicons name="chevron-forward" size={ms(24)} color="#FFFFFF" />
      </BouncyPressable>

      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + THUMB_AREA }]}
        pointerEvents="none">
        <Text testID="urbania-viewer-caption" style={styles.caption}>
          {GALLERY_LABELS[index]}
        </Text>
      </View>

      {/* All the photos together: tap one to jump to it */}
      <View
        style={[styles.thumbs, { bottom: insets.bottom + s(14) }]}
        testID="urbania-viewer-thumbs">
        {photos.map((photo, i) => (
          <BouncyPressable
            key={GALLERY_LABELS[i]}
            testID={`urbania-viewer-thumb-${i}`}
            accessibilityRole="button"
            accessibilityLabel={GALLERY_LABELS[i]}
            accessibilityState={{ selected: i === index }}
            activeScale={0.94}
            onPress={() => goTo(i)}
            style={[styles.thumb, i === index && styles.thumbOn]}>
            <Image source={photo} style={styles.thumbImage} resizeMode="cover" />
          </BouncyPressable>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
    backgroundColor: '#050208',
  },
  page: { overflow: 'hidden' },
  photo: { position: 'absolute' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(15),
  },
  counter: {
    paddingHorizontal: s(12),
    paddingVertical: s(6),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  counterText: {
    fontSize: s(12.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },
  round: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -s(24),
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,8,40,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  arrowLeft: { left: s(12) },
  arrowRight: { right: s(12) },
  arrowOff: { opacity: 0.25 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: s(24),
    paddingTop: s(40),
  },
  caption: {
    textAlign: 'center',
    fontSize: s(12.5),
    lineHeight: s(18),
    color: 'rgba(255,255,255,0.85)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  thumbs: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(8),
    paddingHorizontal: s(15),
  },
  thumb: {
    flex: 1,
    maxWidth: s(72),
    height: s(48),
    borderRadius: s(11),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.55,
  },
  thumbOn: { borderColor: '#FFFFFF', opacity: 1 },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});
