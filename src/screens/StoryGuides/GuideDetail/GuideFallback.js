import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { Loader } from '../../../components/common/Loader';
import { styles } from './styles/chrome';
import { styles as shared } from './styles/shared';

/** Fallback header used by the loading and not-found states. */
const HeaderBar = ({ isDarkMode, insets, onBack, onShare }) => (
  <View
    style={[
      styles.fallbackHeader,
      isDarkMode && styles.fallbackHeaderDark,
      { paddingTop: Math.max(insets.top, s(12)) },
    ]}>
    <BouncyPressable
      testID="guide-back-button"
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={[styles.headerCircleBtn, isDarkMode && styles.headerCircleBtnDark]}
      activeScale={0.88}
      onPress={onBack}>
      <Feather name="arrow-left" size={ms(19)} color={isDarkMode ? '#F3E8FF' : '#1F0F3D'} />
    </BouncyPressable>
    <Text style={[styles.fallbackTitle, isDarkMode && styles.fallbackTitleDark]}>Pet Guide</Text>
    <View style={styles.headerActionsRow}>
      <BouncyPressable
        testID="guide-share-button"
        accessibilityRole="button"
        accessibilityLabel="Share guide"
        style={[styles.headerCircleBtn, isDarkMode && styles.headerCircleBtnDark]}
        activeScale={0.88}
        onPress={onShare}>
        <Ionicons
          name="share-social-outline"
          size={ms(17)}
          color={isDarkMode ? '#F3E8FF' : '#1F0F3D'}
        />
      </BouncyPressable>
    </View>
  </View>
);

export const GuideLoading = ({ isDarkMode, insets, onBack, onShare }) => (
  <View style={[shared.container, isDarkMode && shared.containerDark]}>
    <StatusBar
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
    />
    <HeaderBar isDarkMode={isDarkMode} insets={insets} onBack={onBack} onShare={onShare} />
    <Loader fullScreen title="Loading pet guide..." subtitle="Fetching article details..." />
  </View>
);

export const GuideNotFound = ({ isDarkMode, insets, onBack, onShare }) => (
  <View style={[shared.container, isDarkMode && shared.containerDark]}>
    <StatusBar
      barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
    />
    <HeaderBar isDarkMode={isDarkMode} insets={insets} onBack={onBack} onShare={onShare} />
    <View style={styles.emptyContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={ms(44)}
        color={isDarkMode ? '#C084FC' : '#7C3AED'}
      />
      <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>Guide Not Found</Text>
      <Text style={[styles.emptySubtitle, isDarkMode && styles.emptySubtitleDark]}>
        We could not load the details for this guide. Please return to all guides.
      </Text>
      <BouncyPressable
        style={[styles.emptyBackBtn, isDarkMode && styles.emptyBackBtnDark]}
        activeScale={0.92}
        onPress={onBack}>
        <Text style={styles.emptyBackBtnText}>Back to Guides</Text>
      </BouncyPressable>
    </View>
  </View>
);
