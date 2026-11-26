import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from './FastImage';

// The page colour behind the pictures; the two halves fade into it where they meet
export const BACKGROUND_COLOR = '#FAF8F2';

// When the picture would have to be cropped by more than this (1.08 = 8% of its height) to fill the
// screen, it is shown in two halves instead of being cut: the top of the picture at the top of the
// screen and the bottom of the picture at the bottom. The middle of these pictures is plain, so
// nothing is lost, and both the top and the bottom decoration stay visible (tablets, foldables).
export const SPLIT_CROP_RATIO = 1.08;
// Each half covers this share of the screen height; they overlap a little and fade together
export const HALF_SHARE = 0.56;

// Screens that would crop more than this (1.2 = 20%) of the login pictures: an iPad (about 33%). A 10-inch
// Android tablet crops about 11%, which looks fine as a single picture, so it is left as it was.
export const LOGIN_SPLIT_CROP_RATIO = 1.2;

// Size of the picture when it is as wide as the screen
export const getBackgroundLayout = (
  imageWidth,
  imageHeight,
  screenWidth,
  screenHeight,
  splitAbove = SPLIT_CROP_RATIO,
) => {
  const scale = Math.max(screenWidth / imageWidth, screenHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    left: (screenWidth - width) / 2,
    top: (screenHeight - height) / 2,
    split: height / screenHeight > splitAbove,
  };
};

// Full-screen decorative background for the sign-in screens
export const AuthBackground = ({
  source,
  imageWidth,
  imageHeight,
  bottom = 0,
  splitAbove = SPLIT_CROP_RATIO,
  testID,
}) => {
  const { width, height } = useWindowDimensions();
  const screenHeight = height - bottom;
  const layout = getBackgroundLayout(imageWidth, imageHeight, width, screenHeight, splitAbove);

  if (!layout.split) {
    return (
      <FastImage
        testID={testID}
        source={source}
        style={[
          styles.image,
          { width: layout.width, height: layout.height, left: layout.left, top: layout.top },
        ]}
        resizeMode="cover"
      />
    );
  }

  const halfHeight = screenHeight * HALF_SHARE;
  const imageStyle = { width: layout.width, height: layout.height, left: layout.left };
  return (
    <View testID={testID} pointerEvents="none" style={[styles.fill, { bottom }]}>
      <View testID={`${testID}-top`} style={[styles.half, { top: 0, height: halfHeight }]}>
        <FastImage
          source={source}
          style={[styles.image, imageStyle, { top: 0 }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(250,248,242,0)', BACKGROUND_COLOR]}
          style={styles.fadeBottom}
        />
      </View>
      <View testID={`${testID}-bottom`} style={[styles.half, { bottom: 0, height: halfHeight }]}>
        <FastImage
          source={source}
          style={[styles.image, imageStyle, { bottom: 0 }]}
          resizeMode="cover"
        />
        <LinearGradient colors={[BACKGROUND_COLOR, 'rgba(250,248,242,0)']} style={styles.fadeTop} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { position: 'absolute' },
  fill: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  half: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '35%' },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%' },
});
