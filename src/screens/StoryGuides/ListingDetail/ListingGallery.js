import React, { useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { images as themeImages } from '../../../theme';
import { styles } from './styles';
import { AppImage } from '../../../components/common/AppImage';
import { VideoThumb } from '../../../components/common/GalleryVideo';

/** Swipeable gallery of photos and videos; tapping one (or the counter) opens the full gallery. */
export const ListingGallery = ({ media, photos = [], height, onOpen }) => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  // `media` is photos and videos; callers that only have photo addresses still work
  const items = media || photos.map(url => ({ type: 'image', url }));
  const data = items.length ? items : [null];

  return (
    <View style={{ height }}>
      <FlatList
        horizontal
        pagingEnabled
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, i) => `${item?.url || 'none'}-${i}`}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index: i }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            disabled={!item}
            testID={item ? `listing-media-${i}` : undefined}
            onPress={() => onOpen && onOpen(i)}>
            {item?.type === 'video' ? (
              <View style={{ width, height }}>
                <VideoThumb uri={item.url} testID={`listing-video-thumb-${i}`} />
              </View>
            ) : (
              <AppImage
                source={
                  item ? { uri: item.url, priority: FastImage.priority.high } : themeImages.noimage
                }
                style={{ width, height }}
                resizeMode="cover"
              />
            )}
          </TouchableOpacity>
        )}
      />
      <LinearGradient
        colors={['rgba(15, 7, 29, 0.5)', 'rgba(15, 7, 29, 0)', 'rgba(15, 7, 29, 0.35)']}
        locations={[0, 0.45, 1]}
        style={styles.galleryShade}
        pointerEvents="none"
      />
      {items.length > 0 ? (
        <TouchableOpacity
          testID="listing-open-gallery"
          activeOpacity={0.85}
          style={styles.galleryCounter}
          onPress={() => onOpen && onOpen(index)}>
          <Ionicons name="images-outline" size={ms(13)} color="#FFFFFF" />
          <Text style={styles.galleryCounterText}>
            {items.length > 1
              ? `${index + 1}/${items.length}`
              : items[0]?.type === 'video'
              ? '1 video'
              : '1 photo'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {items.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {items.slice(0, 8).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
};
