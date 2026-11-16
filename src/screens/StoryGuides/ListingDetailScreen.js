import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StatusBar, Animated, RefreshControl, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { useStore } from '../../store';
import { useListingDetail } from '../../hooks/useDiscovery';
import { Loader } from '../../components/common/Loader';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { FloatingHeader } from './GuideDetail/FloatingHeader';
import { useGuideActions } from './GuideDetail/useGuideActions';
import { useGuideScroll } from './GuideDetail/useGuideScroll';
import { CompactBar } from './GuideDetail/CompactBar';
import { Reveal } from './GuideDetail/Reveal';
import { WEB_ORIGIN } from './GuideDetail/constants';
import { buildListing } from './ListingDetail/listingModel';
import { listingPalette } from './ListingDetail/listingPalette';
import { useSavedListing } from './ListingDetail/useSavedListing';
import { ListingGallery } from './ListingDetail/ListingGallery';
import { PhotoViewer } from './ListingDetail/PhotoViewer';
import { ListingHeaderCard } from './ListingDetail/ListingHeaderCard';
import { ListingPetsWelcomed } from './ListingDetail/ListingPetsWelcomed';
import { ListingQuickActions } from './ListingDetail/ListingQuickActions';
import { ListingQuickFacts } from './ListingDetail/ListingQuickFacts';
import { ListingAbout } from './ListingDetail/ListingAbout';
import { ListingPetPolicy } from './ListingDetail/ListingPetPolicy';
import { ListingProsCons } from './ListingDetail/ListingProsCons';
import { ListingVerified } from './ListingDetail/ListingVerified';
import { ListingNearby } from './ListingDetail/ListingNearby';
import { ContactBar, BAR_HEIGHT, contactActions } from './ListingDetail/ContactBar';
import { styles } from './ListingDetail/styles';


export const ListingDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const palette = useMemo(() => listingPalette(isDarkMode), [isDarkMode]);

  const slug = route?.params?.slug || null;
  const { data, isLoading, refetch, isRefetching } = useListingDetail(slug);
  const raw = data?.listing || data || null;
  const listing = useMemo(() => buildListing(raw), [raw]);


  const scroll = useGuideScroll(Boolean(listing));
  const { saved, toggle: toggleSave } = useSavedListing(slug);
  const [viewerIndex, setViewerIndex] = useState(null);

  // back + in-app link handling are shared with the guide page
  const { handleBack, handleLinkPress } = useGuideActions(navigation, null);

  const pageUrl = `${WEB_ORIGIN}/places/${slug}`;

  const handleShare = useCallback(async () => {
    if (!listing) {
      return;
    }
    try {
      await Share.share({ title: listing.name, message: `🐾 ${listing.name} on PetFriendly\n${pageUrl}` });
    } catch {
      // user cancelled
    }
  }, [listing, pageUrl]);

  const topInset = Math.max(insets.top, s(12));

  if (isLoading && !listing) {
    return (
      <View style={[styles.centerBox, { backgroundColor: palette.bg }]}>
        <Loader fullScreen title="Loading listing..." subtitle="Fetching place details..." />
        <FloatingHeader topInset={topInset} onBack={handleBack} onShare={handleShare} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.fill, { backgroundColor: palette.bg }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.centerBox, { paddingTop: topInset + vs(40) }]}>
          <Ionicons name="alert-circle-outline" size={ms(44)} color={palette.accent} />
          <Text style={[styles.centerTitle, { color: palette.text }]}>Listing not found</Text>
          <Text style={[styles.centerText, { color: palette.muted }]}>
            We could not load this place. Check your connection and try again.
          </Text>
          <BouncyPressable
            testID="listing-retry-button"
            style={[styles.retryBtn, { backgroundColor: palette.soft }]}
            activeScale={0.94}
            onPress={() => refetch()}>
            <Text style={[styles.retryText, { color: palette.accent }]}>Try again</Text>
          </BouncyPressable>
        </View>
        <FloatingHeader topInset={topInset} onBack={handleBack} onShare={handleShare} />
      </View>
    );
  }

  const { motion } = scroll;
  const hasActions = contactActions(listing.contact).length > 0;
  const barSpace = hasActions ? BAR_HEIGHT + insets.bottom : 0;
  const sectionProps = { listing, palette, isDarkMode };

  return (
    <View style={[styles.fill, { backgroundColor: palette.bg }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <CompactBar
        title={listing.name}
        isDarkMode={isDarkMode}
        height={topInset + vs(52)}
        topInset={topInset}
        opacity={motion.compactOpacity}
        progressX={motion.progressX}
        screenWidth={scroll.screenWidth}
      />
      <FloatingHeader topInset={topInset} onBack={handleBack} onShare={handleShare} />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scroll.onScroll}
        onLayout={scroll.onViewLayout}
        onContentSizeChange={scroll.onContentSizeChange}
        contentContainerStyle={{ paddingBottom: barSpace + vs(28) }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }>
        {/* photos: parallax while scrolling, stretch when pulled down */}
        <View style={styles.galleryClip}>
          <Animated.View
            style={{ transform: [{ translateY: motion.heroTranslateY }, { scale: motion.heroScale }] }}>
            <ListingGallery photos={listing.photos} height={vs(290)} onOpen={setViewerIndex} />
          </Animated.View>
        </View>
        <ListingHeaderCard {...sectionProps} motion={motion} />

        {/* every section rises and tilts into place as it scrolls into view */}
        <View onLayout={scroll.onBodyLayout}>
          {[
            <ListingQuickActions
              key="actions"
              saved={saved}
              onToggleSave={toggleSave}
              onShare={handleShare}
              palette={palette}
            />,
            <ListingPetsWelcomed key="pets" {...sectionProps} />,
            <ListingQuickFacts key="facts" {...sectionProps} />,
            <ListingAbout key="about" {...sectionProps} onLinkPress={handleLinkPress} />,
            <ListingPetPolicy key="policy" {...sectionProps} />,
            <ListingProsCons key="pros" {...sectionProps} />,
            <ListingVerified key="verified" {...sectionProps} />,
            <ListingNearby key="nearby" {...sectionProps} navigation={navigation} />,
          ].map(section => (
            <Reveal
              key={section.key}
              scrollY={scroll.scrollY}
              viewportH={scroll.viewportH}
              bodyTop={scroll.bodyTop}>
              {section}
            </Reveal>
          ))}
        </View>
      </Animated.ScrollView>

      <ContactBar contact={listing.contact} bottomInset={insets.bottom} palette={palette} />

      <PhotoViewer
        visible={viewerIndex !== null}
        photos={listing.photos}
        startIndex={viewerIndex || 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
};
