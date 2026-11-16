import React, { useRef, useState } from 'react';
import { View, Text, Modal, FlatList, StatusBar, useWindowDimensions } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { styles } from './styles';

/** Full-screen photo gallery (the website's "See full gallery"). */
export const PhotoViewer = ({ visible, photos, startIndex = 0, onClose }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(startIndex);

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
          data={photos}
          initialScrollIndex={Math.min(startIndex, Math.max(photos.length - 1, 0))}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <FastImage
              source={{ uri: item }}
              style={{ width, height }}
              resizeMode={FastImage.resizeMode.contain}
            />
          )}
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
          {index + 1} / {photos.length}
        </Text>
      </View>
    </Modal>
  );
};
