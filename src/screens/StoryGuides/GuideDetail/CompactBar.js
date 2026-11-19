import React from 'react';
import { Text, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from './styles/chrome';

/** Title bar + reading-progress line that fade in once the hero has scrolled away. */
export const CompactBar = ({
  title,
  isDarkMode,
  height,
  topInset,
  opacity,
  progressX,
  screenWidth,
}) => (
  <>
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.compactBar,
        isDarkMode && styles.compactBarDark,
        { height, paddingTop: topInset, opacity },
      ]}>
      <Text numberOfLines={1} style={[styles.compactTitle, isDarkMode && styles.compactTitleDark]}>
        {title}
      </Text>
    </Animated.View>
    <Animated.View
      pointerEvents="none"
      style={[styles.progressTrack, { top: height - 3, opacity }]}>
      <Animated.View style={{ width: screenWidth, transform: [{ translateX: progressX }] }}>
        <LinearGradient
          colors={['#3B108F', '#7B2CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.progressFill}
        />
      </Animated.View>
    </Animated.View>
  </>
);
