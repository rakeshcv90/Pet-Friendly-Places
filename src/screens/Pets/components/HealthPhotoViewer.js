import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import FastImage from '../../../components/common/FastImage';

// Full-screen view of the health record pages. Swipe sideways, or use Previous / Next, to go
// through every page; the close button (or the Android back button) returns to the page you were on.
export const HealthPhotoViewer = ({ visible, pages, index, onIndexChange, onClose }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const last = pages.length - 1;
  const current = pages[Math.min(Math.max(index, 0), last)];

  // Opening on page N: jump the list straight to it
  useEffect(() => {
    if (visible) {
      listRef.current?.scrollToIndex?.({ index: Math.min(Math.max(index, 0), last), animated: false });
    }
    // only when it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

  if (!current) {
    return null;
  }

  const atStart = index <= 0;
  const atEnd = index >= last;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root} testID="health-viewer">
        <FlatList
          ref={listRef}
          testID="health-viewer-list"
          data={pages}
          keyExtractor={item => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={Math.min(Math.max(index, 0), last)}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <View style={{ width, height }}>
              <FastImage source={item.source} style={styles.image} resizeMode="contain" />
            </View>
          )}
        />

        <View style={[styles.top, { paddingTop: insets.top + s(10) }]} pointerEvents="box-none">
          <View style={styles.counter}>
            <Text style={styles.counterText} testID="health-viewer-count">
              {`${Math.min(Math.max(index, 0), last) + 1} / ${pages.length}`}
            </Text>
          </View>
          <Pressable
            testID="health-viewer-close"
            accessibilityRole="button"
            accessibilityLabel="Close photos"
            onPress={onClose}
            style={styles.close}>
            <Ionicons name="close" size={ms(20)} color="#FFFFFF" />
          </Pressable>
        </View>

        <View
          style={[styles.bottom, { paddingBottom: insets.bottom + s(16) }]}
          pointerEvents="box-none">
          <Pressable
            testID="health-viewer-prev"
            accessibilityRole="button"
            accessibilityLabel="Previous page"
            accessibilityState={{ disabled: atStart }}
            disabled={atStart}
            onPress={() => goTo(index - 1)}
            style={[styles.nav, atStart && styles.navOff]}>
            <Ionicons name="chevron-back" size={ms(16)} color="#FFFFFF" />
            <Text style={styles.navText}>Previous</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {current.title}
          </Text>
          <Pressable
            testID="health-viewer-next"
            accessibilityRole="button"
            accessibilityLabel="Next page"
            accessibilityState={{ disabled: atEnd }}
            disabled={atEnd}
            onPress={() => goTo(index + 1)}
            style={[styles.nav, atEnd && styles.navOff]}>
            <Text style={styles.navText}>Next</Text>
            <Ionicons name="chevron-forward" size={ms(16)} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(8,4,16,0.96)' },
  image: { width: '100%', height: '100%' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
  },
  counter: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  counterText: { fontSize: s(12.5), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  close: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
    paddingHorizontal: s(16),
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(16),
    backgroundColor: 'rgba(124,58,237,0.9)',
  },
  navOff: { opacity: 0.35 },
  navText: { fontSize: s(13), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: s(12),
    color: 'rgba(255,255,255,0.75)',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
