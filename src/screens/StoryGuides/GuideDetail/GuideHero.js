import React, { useState, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { images } from '../../../theme';
import { styles } from './styles/hero';
import { AppImage } from '../../../components/common/AppImage';

/** Parallax hero image with the category pill. */
export const GuideHero = ({ guide, isDarkMode, heroScale, heroTranslateY }) => {
  const [imageError, setImageError] = useState(false);
  const heroImageUri = guide.imageUri;
  const heroSource = useMemo(
    () =>
      heroImageUri && !imageError
        ? { uri: heroImageUri, priority: FastImage.priority.high }
        : images.noimage,
    [heroImageUri, imageError],
  );

  return (
    <View style={styles.heroContainer}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { transform: [{ translateY: heroTranslateY }, { scale: heroScale }] },
        ]}>
        <AppImage
          source={heroSource}
          defaultSource={images.noimage}
          onError={() => setImageError(true)}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(15, 7, 29, 0.55)', 'rgba(15, 7, 29, 0)', 'rgba(15, 7, 29, 0.78)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <View style={styles.heroOverlay}>
        <View
          style={[
            styles.heroCategoryPill,
            isDarkMode && styles.heroCategoryPillDark,
            { backgroundColor: guide.accent.main },
          ]}>
          <Ionicons name={guide.categoryIcon} size={ms(11)} color="#FFFFFF" />
          <Text style={styles.heroCategoryPillText} numberOfLines={1}>
            {guide.badgeText}
          </Text>
        </View>
      </View>
    </View>
  );
};
