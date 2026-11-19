import React from 'react';
import { Animated, StatusBar, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs } from 'react-native-size-matters';

import { useStore } from '../../store';
import { useGuideData } from './GuideDetail/useGuideData';
import { useGuideScroll } from './GuideDetail/useGuideScroll';
import { useGuideActions } from './GuideDetail/useGuideActions';
import { CompactBar } from './GuideDetail/CompactBar';
import { FloatingHeader } from './GuideDetail/FloatingHeader';
import { GuideHero } from './GuideDetail/GuideHero';
import { ArticleHeaderCard } from './GuideDetail/ArticleHeaderCard';
import { GuideBody } from './GuideDetail/GuideBody';
import { GuideFooter } from './GuideDetail/GuideFooter';
import { GuideLoading, GuideNotFound } from './GuideDetail/GuideFallback';
import { styles as shared } from './GuideDetail/styles/shared';

export { parseArticleBody, dropFurtherReading } from './GuideDetail/parser';


export const GuideDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const slug =
    route?.params?.slug || route?.params?.guide?.slug || route?.params?.guide?.id || null;
  const initialGuide = route?.params?.guide || null;

  const { guide, bodyNodes, isLoading, refetch, isRefetching } = useGuideData(slug, initialGuide);
  const scroll = useGuideScroll(Boolean(guide));
  const { handleShareGuide, handleOpenGuideHub, handleLinkPress, handleBack } = useGuideActions(
    navigation,
    guide,
  );

  if (isLoading && !guide) {
    return (
      <GuideLoading
        isDarkMode={isDarkMode}
        insets={insets}
        onBack={handleBack}
        onShare={handleShareGuide}
      />
    );
  }

  if (!guide) {
    return (
      <GuideNotFound
        isDarkMode={isDarkMode}
        insets={insets}
        onBack={handleBack}
        onShare={handleShareGuide}
      />
    );
  }

  const { motion } = scroll;
  const topInset = Math.max(insets.top, s(12));

  return (
    <View style={[shared.container, isDarkMode && shared.containerDark]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <CompactBar
        title={guide.title}
        isDarkMode={isDarkMode}
        height={topInset + vs(52)}
        topInset={topInset}
        opacity={motion.compactOpacity}
        progressX={motion.progressX}
        screenWidth={scroll.screenWidth}
      />
      <FloatingHeader topInset={topInset} onBack={handleBack} onShare={handleShareGuide} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scroll.onScroll}
        onLayout={scroll.onViewLayout}
        onContentSizeChange={scroll.onContentSizeChange}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, vs(20)) + vs(40) }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }>
        <GuideHero
          guide={guide}
          isDarkMode={isDarkMode}
          heroScale={motion.heroScale}
          heroTranslateY={motion.heroTranslateY}
        />
        <ArticleHeaderCard guide={guide} isDarkMode={isDarkMode} motion={motion} />
        <GuideBody
          nodes={bodyNodes}
          scrollY={scroll.scrollY}
          viewportH={scroll.viewportH}
          bodyTop={scroll.bodyTop}
          onLayout={scroll.onBodyLayout}
          isDarkMode={isDarkMode}
          onLinkPress={handleLinkPress}
        />
        <GuideFooter
          guide={guide}
          isDarkMode={isDarkMode}
          onShare={handleShareGuide}
          onBack={handleBack}
          onOpenGuideHub={handleOpenGuideHub}
        />
      </Animated.ScrollView>
    </View>
  );
};
