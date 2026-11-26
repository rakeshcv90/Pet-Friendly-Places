import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, FlatList, StatusBar, useWindowDimensions } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { PlayableVideo } from '../../../components/common/GalleryVideo';
import { styles } from './styles';

/** Full-screen gallery of photos and videos (the website's "See full gallery"). */
export const PhotoViewer = ({ visible, media, photos = [], startIndex = 0, onClose }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(startIndex);
  // `media` is photos and videos; callers that only have photo addresses still work
  const items = media || photos.map(url => ({ type: 'image', url }));
  const current = items[index];

  // Opening on a different item (a video, say) starts there: it counts as the one on screen at once
  useEffect(() => {
    if (visible) {
      setIndex(startIndex);
    }
  }, [visible, startIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.viewerRoot}>
        <StatusBar barStyle="light-content" />
        <FlatList
          horizontal
          pagingEnabled
          data={items}
          initialScrollIndex={Math.min(startIndex, Math.max(items.length - 1, 0))}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index: i }) =>
            item.type === 'video' ? (
              <View style={{ width, height }}>
                <PlayableVideo
                  uri={item.url}
                  active={visible && i === index}
                  testID={`viewer-video-${i}`}
                />
              </View>
            ) : (
              <FastImage
                source={{ uri: item.url }}
                style={{ width, height }}
                resizeMode={FastImage.resizeMode.contain}
              />
            )
          }
        />
        <BouncyPressable
          testID="photo-viewer-close"
          accessibilityRole="button"
          accessibilityLabel="Close gallery"
          style={[styles.viewerClose, { top: insets.top + 8 }]}
          activeScale={0.9}
          onPress={onClose}>
          <Ionicons name="close" size={ms(22)} color="#FFFFFF" />
        </BouncyPressable>
        <Text style={[styles.viewerCounter, { top: insets.top + 18 }]}>
          {index + 1} / {items.length}
        </Text>
        {current?.caption ? (
          <View
            style={[styles.viewerCaption, { paddingBottom: insets.bottom + 16 }]}
            pointerEvents="none">
            <Text style={styles.viewerCaptionText}>{current.caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
};
