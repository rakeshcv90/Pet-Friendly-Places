import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { s } from 'react-native-size-matters';
import { Button } from '../../components/common/Button';

const IMAGE_WIDTH = 887;
const IMAGE_HEIGHT = 1773;
const IMAGE_RATIO = IMAGE_WIDTH / IMAGE_HEIGHT; // ~ 0.50028

export const SplashScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { isAuthenticated } = useStore();

  const handleGetStarted = () => {
    navigation.replace('Onboarding');
  };

  useEffect(() => {
    if (isAuthenticated) {
    }
  }, [isAuthenticated]);

  // Cover the full screen: scale image to fill without any top offset
  const screenRatio = screenWidth / screenHeight;
  let imgWidth = screenWidth;
  let imgHeight = screenHeight;
  let imgLeft = 0;
  let imgTop = 0;

  if (screenRatio > IMAGE_RATIO) {
    // Screen is wider (shorter) than image — match width, center vertically
    imgWidth = screenWidth;
    imgHeight = screenWidth / IMAGE_RATIO;
    // Center the image vertically so the dog doesn't get clipped at the bottom
    imgTop = (screenHeight - imgHeight) / 2;
  } else {
    // Screen is taller than image — match height, center horizontally
    imgHeight = screenHeight;
    imgWidth = screenHeight * IMAGE_RATIO;
    imgLeft = (screenWidth - imgWidth) / 2;
  }

  const dynamicImageStyle = {
    width: imgWidth,
    height: imgHeight,
    top: imgTop,
    left: imgLeft,
  };

  const dynamicContentStyle = {
    paddingBottom: insets.bottom ? insets.bottom + s(12) : s(12),
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Full-screen background image */}
      <View style={styles.imageContainer}>
        <FastImage
          source={theme.images.splashBackground1}
          style={[styles.backgroundImage, dynamicImageStyle]}
          objectFit="cover"
        />
      </View>

      {/* Button area with gradient so it doesn't overlap the dog */}
      <View style={styles.content}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.4, 1]}
          style={[styles.gradientOverlay, dynamicContentStyle]}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
            textStyle={styles.buttonText}
          />
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradientOverlay: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: s(60),
  },
  getStartedButton: {
    width: '80%',
    alignSelf: 'center',
    marginBottom: theme.spacing.m,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.bold,
  },
});
