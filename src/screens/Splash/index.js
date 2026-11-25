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

// Top to bottom colours of the picture's edges: sky, the glow near the horizon, then forest
const SIDE_FILL_COLORS = ['#7FAEE3', '#F3C77E', '#C9A24C', '#4E6B2B'];
const SIDE_FILL_LOCATIONS = [0, 0.3, 0.55, 1];

// Phones use the tall picture; tablets and foldables (screens at least this wide) use the 2:3 one
const PHONE_IMAGE = { width: 887, height: 1773 };
const TABLET_IMAGE = { width: 1024, height: 1536 };
const TABLET_MIN_ASPECT = 0.6;

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
  const isTablet = screenWidth / screenHeight >= TABLET_MIN_ASPECT;
  const picture = isTablet ? TABLET_IMAGE : PHONE_IMAGE;
  const pictureSource = isTablet ? theme.images.splashTablet : theme.images.splashBackground1;
  const layout = getFitLayout(picture.width, picture.height, screenWidth, screenHeight);
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
            {/* The picture does not reach the sides: a calm gradient in the picture's own colours
                (sky, sunset glow, forest) sits behind, in case a side is wider than one mirrored copy */}
            <LinearGradient
              testID="splash-side-fill"
              colors={SIDE_FILL_COLORS}
              locations={SIDE_FILL_LOCATIONS}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        <FastImage
          source={pictureSource}
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
