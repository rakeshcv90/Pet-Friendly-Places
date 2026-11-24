import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import FastImage from '../../components/common/FastImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { s } from 'react-native-size-matters';
import { Button } from '../../components/common/Button';
import { getFitLayout } from './splashLayout';

const IMAGE_WIDTH = 887;
const IMAGE_HEIGHT = 1773;

export const SplashScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isAuthenticated = useStore(state => state.isAuthenticated);

  const handleGetStarted = () => {
    navigation.replace('Onboarding');
  };

  useEffect(() => {
    if (isAuthenticated) {
    }
  }, [isAuthenticated]);

  // Phones: fill the screen. Wide screens (a foldable open, a tablet): show the whole picture and
  // fill the sides with a blurred copy, instead of zooming in until the logo and the dog are cut off.
  const layout = getFitLayout(IMAGE_WIDTH, IMAGE_HEIGHT, screenWidth, screenHeight);
  const dynamicImageStyle = {
    width: layout.width,
    height: layout.height,
    top: layout.top,
    left: layout.left,
  };

  const dynamicContentStyle = {
    paddingBottom: insets.bottom ? insets.bottom + s(12) : s(12),
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Full-screen background image */}
      <View style={styles.imageContainer}>
        {layout.mode === 'contain' && (
          <>
            {/* The picture does not reach the sides: a blurred, dimmed copy fills the screen */}
            <FastImage
              testID="splash-blur-fill"
              source={theme.images.splashBackground1}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              blurRadius={30}
            />
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.blurDim]} />
          </>
        )}
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
  blurDim: { backgroundColor: 'rgba(20,10,40,0.25)' },
  getStartedButton: {
    width: '80%',
    // On a wide screen 80% would be an enormous button
    maxWidth: 380,
    alignSelf: 'center',
    marginBottom: theme.spacing.m,
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.bold,
  },
});

export { MainSplash } from './MainSplash';
