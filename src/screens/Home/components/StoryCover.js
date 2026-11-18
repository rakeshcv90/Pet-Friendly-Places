import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from '../../../components/common/FastImage';

/**
 * Cover photo for a story card. The brand gradient sits underneath, so a card whose photo is
 * still loading (the originals are several MB) or has no cover shows the app colours, not a dark box.
 */
export const StoryCoverImage = ({ uri }) => (
  <>
    <LinearGradient
      pointerEvents="none"
      colors={['#35128A', '#7B2CFF', '#C026D3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
    {uri ? (
      <FastImage
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode={FastImage.resizeMode.cover}
        fadeDuration={300}
      />
    ) : null}
  </>
);

/**
 * The photo stays clear: nothing over the top half, and only a soft dark fade at the bottom where the
 * title sits (the text also carries its own shadow, so it stays readable on a bright photo).
 */
export const StoryOverlay = () => (
  <LinearGradient
    pointerEvents="none"
    colors={['rgba(20, 10, 35, 0)', 'rgba(20, 10, 35, 0)', 'rgba(20, 10, 35, 0.5)', 'rgba(20, 10, 35, 0.78)']}
    locations={[0, 0.45, 0.78, 1]}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 1 }}
    style={StyleSheet.absoluteFillObject}
  />
);
