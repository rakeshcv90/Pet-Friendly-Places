import { useMemo } from 'react';
import { s } from 'react-native-size-matters';

/**
 * Custom hook to generate all scroll-driven 3D parallax,
 * tilt, scale, and holographic sheen interpolations for the Home screen.
 *
 * @param {import('react-native').Animated.Value} scrollY
 */
export const useHomeAnimations = scrollY => {
  return useMemo(() => {
    // Background Ambient Orbs 3D Parallax Interpolations
    const orbTopRightY = scrollY.interpolate({
      inputRange: [-100, 0, 800],
      outputRange: [-25, 0, -160],
    });
    const orbTopRightScale = scrollY.interpolate({
      inputRange: [0, 400],
      outputRange: [1, 1.15],
      extrapolate: 'clamp',
    });
    const orbTopLeftY = scrollY.interpolate({
      inputRange: [-100, 0, 800],
      outputRange: [-15, 0, 90],
    });
    const orbMidRightY = scrollY.interpolate({
      inputRange: [0, 1000],
      outputRange: [0, -120],
    });
    const orbMidLeftY = scrollY.interpolate({
      inputRange: [0, 1000],
      outputRange: [0, -80],
    });
    const orbBottomRightY = scrollY.interpolate({
      inputRange: [0, 1000],
      outputRange: [0, 100],
    });
    const watermarkTopY = scrollY.interpolate({
      inputRange: [0, 800],
      outputRange: [0, -130],
    });
    const watermarkBottomY = scrollY.interpolate({
      inputRange: [0, 800],
      outputRange: [0, 90],
    });

    // ── 1. Top Header & Search Bar Interactive Motion ──
    const avatarScale = scrollY.interpolate({
      inputRange: [-80, 0, 140],
      outputRange: [1.08, 1, 0.92],
      extrapolate: 'clamp',
    });
    const avatarRotate = scrollY.interpolate({
      inputRange: [0, 140],
      outputRange: ['0deg', '6deg'],
      extrapolate: 'clamp',
    });
    const searchBarScale = scrollY.interpolate({
      inputRange: [-80, 0, 120],
      outputRange: [1.02, 1, 0.99],
      extrapolate: 'clamp',
    });
    const searchIconRotate = scrollY.interpolate({
      inputRange: [0, 140],
      outputRange: ['0deg', '12deg'],
      extrapolate: 'clamp',
    });

    // ── 2. Hero Card 3D Perspective & Holographic Sheen ──
    const heroScale = scrollY.interpolate({
      inputRange: [-120, 0, 220],
      outputRange: [1.02, 1, 0.98],
      extrapolate: 'clamp',
    });
    const heroRotateX = scrollY.interpolate({
      inputRange: [0, 220],
      outputRange: ['0deg', '3.5deg'],
      extrapolate: 'clamp',
    });
    const heroImageParallax = scrollY.interpolate({
      inputRange: [-120, 0, 260],
      outputRange: [-15, 0, 20],
      extrapolate: 'clamp',
    });
    const heroSheenX = scrollY.interpolate({
      inputRange: [-60, 0, 240],
      outputRange: [-s(180), -s(40), s(340)],
      extrapolate: 'clamp',
    });
    const heroPillScale = scrollY.interpolate({
      inputRange: [-60, 0, 180],
      outputRange: [1.06, 1, 0.96],
      extrapolate: 'clamp',
    });
    const heroBtnScale = scrollY.interpolate({
      inputRange: [0, 90, 220],
      outputRange: [1, 1.05, 0.98],
      extrapolate: 'clamp',
    });

    // ── 3. Categories Card 3D & Staggered Row Reveal ──
    const categoryScale = scrollY.interpolate({
      inputRange: [0, 160, 420],
      outputRange: [1, 1, 0.98],
      extrapolate: 'clamp',
    });
    const categoryRotateX = scrollY.interpolate({
      inputRange: [0, 180, 420],
      outputRange: ['0deg', '0deg', '3deg'],
      extrapolate: 'clamp',
    });
    const catRow2Scale = scrollY.interpolate({
      inputRange: [40, 200],
      outputRange: [0.94, 1],
      extrapolate: 'clamp',
    });

    // ── 4. Story Card 3D, Sheen & Floating Pill ──
    const storyHeaderOpacity = scrollY.interpolate({
      inputRange: [40, 180],
      outputRange: [0.65, 1],
      extrapolate: 'clamp',
    });
    const storyScale = scrollY.interpolate({
      inputRange: [50, 300, 650],
      outputRange: [0.975, 1, 0.985],
      extrapolate: 'clamp',
    });
    const storyRotateX = scrollY.interpolate({
      inputRange: [50, 300, 650],
      outputRange: ['-3deg', '0deg', '3deg'],
      extrapolate: 'clamp',
    });
    const storyOpacity = scrollY.interpolate({
      inputRange: [50, 220],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });
    const storyImageParallax = scrollY.interpolate({
      inputRange: [50, 320, 650],
      outputRange: [-15, 0, 18],
      extrapolate: 'clamp',
    });
    const storySheenX = scrollY.interpolate({
      inputRange: [50, 320, 650],
      outputRange: [-s(180), 0, s(320)],
      extrapolate: 'clamp',
    });
    const storyPillScale = scrollY.interpolate({
      inputRange: [80, 300, 550],
      outputRange: [0.94, 1.04, 0.96],
      extrapolate: 'clamp',
    });

    // ── 5. Tails Verified Card 3D & Floating Badges ──
    const tailsHeaderOpacity = scrollY.interpolate({
      inputRange: [220, 400],
      outputRange: [0.65, 1],
      extrapolate: 'clamp',
    });
    const tailsScale = scrollY.interpolate({
      inputRange: [250, 550, 900],
      outputRange: [0.975, 1, 0.985],
      extrapolate: 'clamp',
    });
    const tailsRotateX = scrollY.interpolate({
      inputRange: [250, 550, 900],
      outputRange: ['-3deg', '0deg', '3deg'],
      extrapolate: 'clamp',
    });
    const tailsOpacity = scrollY.interpolate({
      inputRange: [250, 420],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });
    const tailsImageParallax = scrollY.interpolate({
      inputRange: [250, 580, 900],
      outputRange: [-16, 0, 18],
      extrapolate: 'clamp',
    });
    const tailsBadgeScale = scrollY.interpolate({
      inputRange: [250, 550, 850],
      outputRange: [0.92, 1.04, 0.95],
      extrapolate: 'clamp',
    });
    const favoriteBtnScale = scrollY.interpolate({
      inputRange: [250, 550, 850],
      outputRange: [0.92, 1.06, 0.95],
      extrapolate: 'clamp',
    });

    // ── 6. Recently Verified Card 3D ──
    const recentHeaderOpacity = scrollY.interpolate({
      inputRange: [480, 660],
      outputRange: [0.65, 1],
      extrapolate: 'clamp',
    });
    const recentScale = scrollY.interpolate({
      inputRange: [500, 800, 1150],
      outputRange: [0.975, 1, 0.985],
      extrapolate: 'clamp',
    });
    const recentRotateX = scrollY.interpolate({
      inputRange: [500, 800, 1150],
      outputRange: ['-3deg', '0deg', '3deg'],
      extrapolate: 'clamp',
    });
    const recentOpacity = scrollY.interpolate({
      inputRange: [500, 680],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    // ── 7. Rehome Card 3D & Staggered Action Keys ──
    const rehomeScale = scrollY.interpolate({
      inputRange: [700, 1000, 1350],
      outputRange: [0.975, 1, 0.985],
      extrapolate: 'clamp',
    });
    const rehomeRotateX = scrollY.interpolate({
      inputRange: [700, 1000, 1350],
      outputRange: ['-3deg', '0deg', '3deg'],
      extrapolate: 'clamp',
    });
    const rehomeOpacity = scrollY.interpolate({
      inputRange: [700, 880],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });
    const rehomeBtn1Scale = scrollY.interpolate({
      inputRange: [680, 940],
      outputRange: [0.9, 1],
      extrapolate: 'clamp',
    });
    const rehomeBtn2Scale = scrollY.interpolate({
      inputRange: [720, 980],
      outputRange: [0.9, 1],
      extrapolate: 'clamp',
    });
    const rehomeBtn3Scale = scrollY.interpolate({
      inputRange: [760, 1020],
      outputRange: [0.9, 1],
      extrapolate: 'clamp',
    });

    // ── 8. Curated Road Trips 3D Carousel ──
    const roadTripHeaderOpacity = scrollY.interpolate({
      inputRange: [900, 1100],
      outputRange: [0.65, 1],
      extrapolate: 'clamp',
    });
    const roadTripScale = scrollY.interpolate({
      inputRange: [900, 1200, 1550],
      outputRange: [0.975, 1, 0.985],
      extrapolate: 'clamp',
    });
    const roadTripRotateX = scrollY.interpolate({
      inputRange: [900, 1200, 1550],
      outputRange: ['-3deg', '0deg', '3deg'],
      extrapolate: 'clamp',
    });
    const roadTripOpacity = scrollY.interpolate({
      inputRange: [900, 1080],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    // ── 9. Community Callout Banner 3D & Sheen ──
    const calloutScale = scrollY.interpolate({
      inputRange: [1150, 1450],
      outputRange: [0.965, 1],
      extrapolate: 'clamp',
    });
    const calloutRotateX = scrollY.interpolate({
      inputRange: [1150, 1450],
      outputRange: ['-3deg', '0deg'],
      extrapolate: 'clamp',
    });
    const calloutOpacity = scrollY.interpolate({
      inputRange: [1150, 1350],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });
    const calloutSheenX = scrollY.interpolate({
      inputRange: [1150, 1500, 1850],
      outputRange: [-s(200), s(40), s(360)],
      extrapolate: 'clamp',
    });
    const calloutBadgeRotate = scrollY.interpolate({
      inputRange: [1150, 1480],
      outputRange: ['-8deg', '0deg'],
      extrapolate: 'clamp',
    });
    const calloutBtnScale = scrollY.interpolate({
      inputRange: [1200, 1500],
      outputRange: [0.94, 1.04],
      extrapolate: 'clamp',
    });

    return {
      orbTopRightY,
      orbTopRightScale,
      orbTopLeftY,
      orbMidRightY,
      orbMidLeftY,
      orbBottomRightY,
      watermarkTopY,
      watermarkBottomY,
      avatarScale,
      avatarRotate,
      searchBarScale,
      searchIconRotate,
      heroScale,
      heroRotateX,
      heroImageParallax,
      heroSheenX,
      heroPillScale,
      heroBtnScale,
      categoryScale,
      categoryRotateX,
      catRow2Scale,
      storyHeaderOpacity,
      storyScale,
      storyRotateX,
      storyOpacity,
      storyImageParallax,
      storySheenX,
      storyPillScale,
      tailsHeaderOpacity,
      tailsScale,
      tailsRotateX,
      tailsOpacity,
      tailsImageParallax,
      tailsBadgeScale,
      favoriteBtnScale,
      recentHeaderOpacity,
      recentScale,
      recentRotateX,
      recentOpacity,
      rehomeScale,
      rehomeRotateX,
      rehomeOpacity,
      rehomeBtn1Scale,
      rehomeBtn2Scale,
      rehomeBtn3Scale,
      roadTripHeaderOpacity,
      roadTripScale,
      roadTripRotateX,
      roadTripOpacity,
      calloutScale,
      calloutRotateX,
      calloutOpacity,
      calloutSheenX,
      calloutBadgeRotate,
      calloutBtnScale,
    };
  }, [scrollY]);
};
