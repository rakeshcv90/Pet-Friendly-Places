import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { theme } from '../../../theme';
import { s } from 'react-native-size-matters';

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = theme.dimensions.window;
const isSmallDevice = SCREEN_HEIGHT < 720;
const IMAGE_HEIGHT = isSmallDevice ? SCREEN_HEIGHT * 0.42 : SCREEN_HEIGHT * 0.5;
const DOT_SLOT_WIDTH = s(24);

const ONBOARDING_DATA = [
  {
    id: '1',
    tag: 'EXPLORE INDIA',
    title: 'Discover\nPet-Friendly Places\nAcross India',
    subtitle: 'Find the best places, stays, cafes, parks and more — all pet approved.',
    image: theme.images.onboarding.slide1,
  },
  {
    id: '2',
    tag: 'PET POLICIES',
    title: 'Know the Rules\nBefore You Go',
    subtitle: 'Get pet rules, charges, breed info and more for every place.',
    image: theme.images.onboarding.slide2,
  },
  {
    id: '3',
    tag: 'TRIP PLANNER',
    title: 'Plan Your Trips\nwith Your Pet',
    subtitle: 'Save places, create road trips and explore together.',
    image: theme.images.onboarding.slide3,
  },
];

// Animated slide component with cinematic 3D parallax and staggered typography
const AnimatedSlide = ({ item, index, scrollX }) => {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  // Subtle parallax translation
  const imageTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [SCREEN_WIDTH * 0.09, 0, -SCREEN_WIDTH * 0.09],
    extrapolate: 'clamp',
  });

  // Cinematic depth zoom
  const imageScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.08, 1, 1.08],
    extrapolate: 'clamp',
  });

  // Soft fade for content
  const contentOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  // Staggered vertical float for category tag
  const tagTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [s(14), 0, -s(14)],
    extrapolate: 'clamp',
  });

  // Staggered vertical float for title
  const titleTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [s(22), 0, -s(18)],
    extrapolate: 'clamp',
  });

  // Staggered vertical float for subtitle
  const subtitleTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [s(32), 0, -s(12)],
    extrapolate: 'clamp',
  });

  // Gentle content breath scale
  const contentScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.slide}>
      <View style={styles.imageWrapper}>
        <View style={styles.imageContainer}>
          <AnimatedFastImage
            source={item.image}
            style={[
              styles.image,
              {
                transform: [{ translateX: imageTranslateX }, { scale: imageScale }],
              },
            ]}
            objectFit="cover"
          />
        </View>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ scale: contentScale }],
          },
        ]}>
        <Animated.View style={[styles.tagBadge, { transform: [{ translateY: tagTranslateY }] }]}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { transform: [{ translateY: titleTranslateY }] }]}>
          {item.title}
        </Animated.Text>
        <Animated.Text
          style={[styles.subtitle, { transform: [{ translateY: subtitleTranslateY }] }]}>
          {item.subtitle}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

// Apple-style sliding capsule pagination with liquid elastic stretch
const SlidingPagination = ({ data, scrollX }) => {
  const translateX = scrollX.interpolate({
    inputRange: data.map((_, i) => i * SCREEN_WIDTH),
    outputRange: data.map((_, i) => i * DOT_SLOT_WIDTH),
    extrapolate: 'clamp',
  });

  // Dynamic elastic stretch while dragging between slides
  const stretchRange = [];
  const stretchOutput = [];
  data.forEach((_, i) => {
    stretchRange.push(i * SCREEN_WIDTH);
    stretchOutput.push(1);
    if (i < data.length - 1) {
      stretchRange.push((i + 0.5) * SCREEN_WIDTH);
      stretchOutput.push(1.22);
    }
  });

  const scaleX = scrollX.interpolate({
    inputRange: stretchRange,
    outputRange: stretchOutput,
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.paginationContainer}>
      <View style={styles.dotsTrack}>
        {data.map((item, index) => (
          <View key={`dot-${item.id || index}`} style={styles.inactiveDotSlot}>
            <View style={styles.inactiveDot} />
          </View>
        ))}

        <Animated.View
          style={[
            styles.activePill,
            {
              transform: [{ translateX }, { scaleX }],
            },
          ]}
        />
      </View>
    </View>
  );
};

export const OnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  // Smooth entrance animation when screen opens
  const entranceAnim = useRef(new Animated.Value(0)).current;

  // Spring morph animation for Back button (expanding from width 0 to 96)
  const backButtonAnim = useRef(new Animated.Value(0)).current;

  // Tactile touch scale springs for both buttons
  const nextPressScale = useRef(new Animated.Value(1)).current;
  const backPressScale = useRef(new Animated.Value(1)).current;

  // Celebration pulse on final slide "Get Started"
  const getStartedPulse = useRef(new Animated.Value(1)).current;

  // Text cross-fade opacity
  const nextTextOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(entranceAnim, {
      toValue: 1,
      tension: 45,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [entranceAnim]);

  // Smoothly animate the Back button expanding / collapsing (no spring wobbling)
  useEffect(() => {
    Animated.timing(backButtonAnim, {
      toValue: currentIndex > 0 ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // allows animating layout width and margin
    }).start();

    // Subtle text cross-fade when slide changes
    Animated.sequence([
      Animated.timing(nextTextOpacity, {
        toValue: 0.3,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(nextTextOpacity, {
        toValue: 1,
        duration: 130,
        useNativeDriver: true,
      }),
    ]).start();

    // Celebration pulse on final slide (clean, no oscillation)
    if (currentIndex === ONBOARDING_DATA.length - 1) {
      Animated.sequence([
        Animated.timing(getStartedPulse, {
          toValue: 1.04,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(getStartedPulse, {
          toValue: 1,
          duration: 150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentIndex, backButtonAnim, nextTextOpacity, getStartedPulse]);

  // Tactile button press interactions (subtle, non-wobbling)
  const handlePressInNext = () => {
    Animated.timing(nextPressScale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutNext = () => {
    Animated.timing(nextPressScale, {
      toValue: 1,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressInBack = () => {
    Animated.timing(backPressScale, {
      toValue: 0.96,
      duration: 90,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handlePressOutBack = () => {
    Animated.timing(backPressScale, {
      toValue: 1,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    if (currentIndexRef.current < ONBOARDING_DATA.length - 1) {
      const nextIndex = currentIndexRef.current + 1;
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      navigation.replace('Login');
    }
  };

  const handleBack = () => {
    if (currentIndexRef.current > 0) {
      const prevIndex = currentIndexRef.current - 1;
      currentIndexRef.current = prevIndex;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const nextIndex = viewableItems[0].index;
      if (nextIndex !== currentIndexRef.current) {
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const getItemLayout = useCallback(
    (_, index) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }) => <AnimatedSlide item={item} index={index} scrollX={scrollX} />,
    [scrollX],
  );

  // Smoothly fade out Skip button on the last slide
  const skipOpacity = scrollX.interpolate({
    inputRange: [
      (ONBOARDING_DATA.length - 2) * SCREEN_WIDTH,
      (ONBOARDING_DATA.length - 1) * SCREEN_WIDTH,
    ],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const footerTranslateY = entranceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [s(50), 0],
  });

  // Animated interpolations for the Back button sliding & expanding (clamped, no overshooting)
  const backWidth = backButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, s(96)],
    extrapolate: 'clamp',
  });

  const backMarginRight = backButtonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, s(12)],
    extrapolate: 'clamp',
  });

  const backOpacity = backButtonAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.2, 1],
    extrapolate: 'clamp',
  });

  const isLastSlide = currentIndex === ONBOARDING_DATA.length - 1;

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents={isLastSlide ? 'none' : 'auto'}
        style={[
          styles.skipButton,
          {
            top: Math.max(insets.top, s(16)) + (Platform.OS === 'ios' ? s(8) : s(12)),
            opacity: Animated.multiply(skipOpacity, entranceAnim),
          },
        ]}>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.7}
          style={styles.skipPill}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        getItemLayout={getItemLayout}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <Animated.View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, s(12)) + (isSmallDevice ? s(6) : s(16)),
            opacity: entranceAnim,
            transform: [{ translateY: footerTranslateY }],
          },
        ]}>
        <SlidingPagination data={ONBOARDING_DATA} scrollX={scrollX} />

        <View style={styles.buttonRow}>
          {/* Animated Back Button Container (layout & fade) */}
          <Animated.View
            style={[
              styles.backButtonWrapper,
              {
                width: backWidth,
                marginRight: backMarginRight,
                opacity: backOpacity,
              },
            ]}
            pointerEvents={currentIndex === 0 ? 'none' : 'auto'}>
            <TouchableOpacity
              onPress={handleBack}
              onPressIn={handlePressInBack}
              onPressOut={handlePressOutBack}
              activeOpacity={0.85}>
              <Animated.View
                style={[styles.backButtonInner, { transform: [{ scale: backPressScale }] }]}>
                <Icon
                  name="arrow-back"
                  size={s(16)}
                  color={theme.colors.primaryDark}
                  style={{ marginRight: s(4) }}
                />
                <Text style={styles.backButtonText}>Back</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>

          {/* Next / Get Started Button Container */}
          <View style={styles.nextButtonWrapper}>
            <TouchableOpacity
              onPress={handleNext}
              onPressIn={handlePressInNext}
              onPressOut={handlePressOutNext}
              activeOpacity={0.9}>
              <Animated.View
                style={[
                  styles.nextButtonTouchable,
                  {
                    transform: [{ scale: Animated.multiply(nextPressScale, getStartedPulse) }],
                  },
                ]}>
                <LinearGradient
                  colors={theme.colors.primaryGradient || ['rgb(59, 16, 143)', 'rgb(123, 44, 255)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nextGradient}>
                  <Animated.View style={[styles.nextButtonContent, { opacity: nextTextOpacity }]}>
                    <Text style={styles.nextButtonText}>
                      {isLastSlide ? 'Get Started' : 'Next'}
                    </Text>
                    <Icon
                      name={isLastSlide ? 'paw' : 'arrow-forward'}
                      size={isLastSlide ? s(18) : s(18)}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                  </Animated.View>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    right: s(20),
    zIndex: 20,
  },
  skipPill: {
    paddingHorizontal: s(14),
    paddingVertical: s(6),
    borderRadius: s(16),
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  skipText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.sizes.body2,
    fontFamily: theme.typography.fontFamily.medium,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_WIDTH * 2,
    borderBottomLeftRadius: SCREEN_WIDTH,
    borderBottomRightRadius: SCREEN_WIDTH,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  image: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 1.2,
    height: IMAGE_HEIGHT,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
    paddingTop: isSmallDevice ? s(10) : theme.spacing.l,
  },
  tagBadge: {
    paddingHorizontal: s(10),
    paddingVertical: s(3),
    borderRadius: s(12),
    backgroundColor: 'rgba(123, 44, 255, 0.1)',
    alignSelf: 'flex-start',
    marginBottom: isSmallDevice ? s(4) : s(8),
  },
  tagText: {
    color: theme.colors.primary,
    fontSize: isSmallDevice ? s(9) : s(10),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: isSmallDevice ? s(20) : theme.typography.sizes.h2,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
    marginBottom: isSmallDevice ? s(4) : theme.spacing.s,
    lineHeight: isSmallDevice ? s(26) : s(32),
  },
  subtitle: {
    fontSize: isSmallDevice ? s(12) : theme.typography.sizes.body1,
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: isSmallDevice ? s(17) : s(22),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.l,
    alignItems: 'center',
  },
  paginationContainer: {
    marginBottom: isSmallDevice ? s(12) : s(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: s(8),
    position: 'relative',
  },
  inactiveDotSlot: {
    width: DOT_SLOT_WIDTH,
    height: s(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: 'rgba(59, 16, 143, 0.18)',
  },
  activePill: {
    position: 'absolute',
    top: s(1),
    left: s(2),
    width: s(20),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: theme.colors.primary,
  },
  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    height: s(54),
  },
  backButtonWrapper: {
    height: s(52),
    overflow: 'hidden',
    justifyContent: 'center',
  },
  backButtonInner: {
    width: s(96),
    height: s(52),
    borderRadius: s(26),
    borderWidth: 1.5,
    borderColor: 'rgba(59, 16, 143, 0.22)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.sizes.body1,
    fontFamily: theme.typography.fontFamily.bold,
  },
  nextButtonWrapper: {
    flex: 1,
    height: s(52),
  },
  nextButtonTouchable: {
    borderRadius: s(26),
    elevation: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  nextGradient: {
    height: s(52),
    borderRadius: s(26),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: s(20),
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: s(8),
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.body1,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
});
