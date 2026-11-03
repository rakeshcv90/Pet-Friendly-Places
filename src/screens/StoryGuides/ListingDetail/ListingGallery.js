import React, { useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { images as themeImages } from '../../../theme';
import { styles } from './styles';

/** Swipeable photo gallery; tapping a photo (or the counter) opens the full gallery. */
export const ListingGallery = ({ photos, height, onOpen }) => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length) {
      setIndex(viewableItems[0].index ?? 0);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const data = photos.length ? photos : [null];

  return (
    <View style={{ height }}>
      <FlatList
        horizontal
        pagingEnabled
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(uri, i) => `${uri || 'none'}-${i}`}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index: i }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            disabled={!item}
            onPress={() => onOpen && onOpen(i)}>
            <FastImage
              source={item ? { uri: item, priority: FastImage.priority.high } : themeImages.noimage}
              style={{ width, height }}
              resizeMode={FastImage.resizeMode.cover}
            />
          </TouchableOpacity>
        )}
      />
      <LinearGradient
        colors={['rgba(15, 7, 29, 0.5)', 'rgba(15, 7, 29, 0)', 'rgba(15, 7, 29, 0.35)']}
        locations={[0, 0.45, 1]}
        style={styles.galleryShade}
        pointerEvents="none"
      />
      {photos.length > 0 ? (
        <TouchableOpacity
          testID="listing-open-gallery"
          activeOpacity={0.85}
          style={styles.galleryCounter}
          onPress={() => onOpen && onOpen(index)}>
          <Ionicons name="images-outline" size={ms(13)} color="#FFFFFF" />
          <Text style={styles.galleryCounterText}>
            {photos.length > 1 ? `${index + 1}/${photos.length}` : '1 photo'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {photos.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {photos.slice(0, 8).map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
};
