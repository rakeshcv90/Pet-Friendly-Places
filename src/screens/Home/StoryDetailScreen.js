import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Animated,
  Image,
  BackHandler,
  useWindowDimensions,
  StyleSheet,
  Share,
  Linking,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from 'react-native-size-matters';

import { useStore } from '../../store';
import { theme, images } from '../../theme';
import FastImage from '../../components/common/FastImage';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { useTravelStory, resolveImageUrl } from '../../hooks/useDiscovery';

const PURPLE = '#7B2CFF';
const DEEP = '#3B108F';

// ── Helpers ────────────────────────────────────────────────────────────────

const decode = text =>
  String(text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

// The story body is HTML. Turn it into headings and paragraphs, in order.
const toBlocks = html => {
  const source = String(html || '');
  const blocks = [];
  const re = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>|<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match = re.exec(source);
  while (match) {
    if (match[1] !== undefined) {
      const text = decode(match[1]);
      if (text) {
        blocks.push({ type: 'heading', text });
      }
    } else {
      const text = decode(match[2]);
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
    }
    match = re.exec(source);
  }
  if (blocks.length === 0 && source.trim()) {
    decode(source.replace(/<\/p>|<br\s*\/?>/gi, '\n\n'))
      .split(/\n{2,}/)
      .filter(Boolean)
      .forEach(text => blocks.push({ type: 'paragraph', text }));
  }
  return blocks;
};

const asArray = value => (Array.isArray(value) ? value : []);

// Every story fills a different set of fields, so each piece is read defensively
const dogNotesOf = stop => {
  const notes = [];
  if (stop.dogMoments && typeof stop.dogMoments === 'object' && !Array.isArray(stop.dogMoments)) {
    Object.entries(stop.dogMoments).forEach(([name, text]) => {
      if (text) {
        notes.push({ name: name.charAt(0).toUpperCase() + name.slice(1), text: String(text) });
      }
    });
  }
  asArray(stop.dog_notes).forEach(note => {
    if (note?.mood) {
      notes.push({ name: note.name || 'Dog', text: String(note.mood) });
    }
  });
  return notes;
};

// Newer stories use `timeline_stops`; older ones only have `timeline_blocks`
const stopsOf = story => {
  const stops = asArray(story.timeline_stops);
  if (stops.length > 0) {
    return stops.map(stop => ({
      id: stop.id,
      badge: stop.badge,
      badgeColor: stop.badgeColor,
      time: stop.time,
      title: stop.location || stop.title,
      sub: stop.sub || stop.subtitle,
      body: stop.body || stop.content,
      pros: asArray(stop.pros),
      cons: asArray(stop.cons),
      tags: asArray(stop.activityTags).length ? asArray(stop.activityTags) : asArray(stop.tags),
      notes: dogNotesOf(stop),
      listingSlug: stop.linkedListingSlug || stop.listing_slug || '',
      emoji: stop.emoji,
    }));
  }
  return asArray(story.timeline_blocks).map(block => ({
    id: block.id,
    badge: block.type ? block.type.charAt(0).toUpperCase() + block.type.slice(1) : '',
    time: block.time_or_day,
    title: block.title,
    sub: block.subtitle,
    body: block.content,
    pros: asArray(block.pros),
    cons: asArray(block.cons),
    tags: asArray(block.tags),
    notes: dogNotesOf(block),
    listingSlug: block.listing_slug || '',
    emoji: block.emoji,
  }));
};

const BADGE_COLORS = {
  purple: ['#EDE9FE', '#6D28D9'],
  green: ['#DCFCE7', '#15803D'],
  gray: ['#F1F5F9', '#475569'],
  blue: ['#DBEAFE', '#1D4ED8'],
  amber: ['#FEF3C7', '#B45309'],
};

const SCORE_LABELS = {
  dog_happiness: ['🐕', 'Dog Happiness'],
  adventure_score: ['🏔️', 'Adventure Score'],
  photo_worthy: ['📸', 'Photo Worthy'],
  water_safety: ['💧', 'Water Safety'],
  puppy_friendly: ['🐶', 'Puppy Friendly'],
  large_dog_friendly: ['🐾', 'Large Dog Friendly'],
  crowd_level: ['👥', 'Crowd Level'],
  road_quality: ['🛣️', 'Road Quality'],
  luxury_score: ['✨', 'Luxury Score'],
};

const humanize = key =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

const formatDate = value => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Small pieces ───────────────────────────────────────────────────────────

const SectionTitle = ({ icon, children, isDarkMode }) => (
  <View style={styles.sectionTitleRow}>
    <LinearGradient colors={['#8B5CF6', '#EE2A7B']} style={styles.sectionAccent} />
    {icon ? <Text style={styles.sectionTitleIcon}>{icon}</Text> : null}
    <Text style={[styles.sectionTitle, isDarkMode && styles.textLight]}>{children}</Text>
  </View>
);

const Card = ({ children, style, isDarkMode }) => (
  <View style={[styles.card, isDarkMode && styles.cardDark, style]}>{children}</View>
);

const BulletList = ({ items, kind, isDarkMode }) =>
  items.length === 0 ? null : (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={`${kind}-${index}`} style={styles.bulletRow}>
          <Feather
            name={kind === 'pro' ? 'check' : 'x'}
            size={ms(13)}
            color={kind === 'pro' ? '#15803D' : '#DC2626'}
            style={styles.bulletIcon}
          />
          <Text style={[styles.bulletText, isDarkMode && styles.textMuted]}>{String(item)}</Text>
        </View>
      ))}
    </View>
  );

// A paused video that shows its first frame, with a play button on top, like a photo with a play mark
const GalleryVideoThumb = ({ uri, testID }) => {
  const ref = useRef(null);
  // Some phones cannot decode the file (e.g. 4K 10-bit HEVC on Android): keep the card, drop the frame
  const [failed, setFailed] = useState(false);
  return (
    // pointerEvents none on the wrapper: the native video view otherwise swallows the tap, so the
    // card's own press (opening the full-screen viewer) never fires
    <View style={styles.videoThumb} pointerEvents="none">
      {failed ? (
        <LinearGradient
          colors={['#3B108F', '#7B2CFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <Video
          ref={ref}
          source={{ uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          paused
          muted
          playInBackground={false}
          // Android shows a black frame until it seeks a little way in
          onLoad={() => ref.current?.seek(0.1)}
          onError={() => setFailed(true)}
          testID={testID}
        />
      )}
      <View style={styles.playOverlay} pointerEvents="none">
        <View style={styles.playCircle}>
          <Feather name="play" size={ms(22)} color="#FFFFFF" style={styles.playIcon} />
        </View>
      </View>
    </View>
  );
};

// One video in the viewer. If this phone cannot decode it, say so and offer another app.
const ViewerVideo = ({ uri, active, testID }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={styles.videoFailed}>
        <Feather name="alert-circle" size={ms(34)} color="#E9D5FF" />
        <Text style={styles.videoFailedTitle}>This video can't be played here</Text>
        <Text style={styles.videoFailedText}>
          Your phone could not decode this file. You can try opening it in another app.
        </Text>
        <BouncyPressable
          style={styles.videoFailedBtn}
          activeScale={0.96}
          onPress={() => Linking.openURL(uri).catch(() => {})}
          testID={`${testID}-open-external`}>
          <Feather name="external-link" size={ms(14)} color="#FFFFFF" />
          <Text style={styles.videoFailedBtnText}>Open in another app</Text>
        </BouncyPressable>
      </View>
    );
  }
  return (
    <Video
      source={{ uri }}
      style={StyleSheet.absoluteFillObject}
      resizeMode="contain"
      controls
      paused={!active}
      playInBackground={false}
      ignoreSilentSwitch="ignore"
      onError={() => setFailed(true)}
      testID={testID}
    />
  );
};

// One photo in the viewer: a spinner shows until it has drawn
const ViewerImage = ({ uri }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded ? (
        <View style={styles.viewerSpinner} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
      <FastImage
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode={FastImage.resizeMode.contain}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
};

// Full-screen gallery: swipe between photos and videos. It is a plain overlay on the screen, not a
// native Modal, so it cannot clash with another modal on iOS.
const GalleryViewer = ({ items, startIndex, onClose, topInset, bottomInset }) => {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  const current = items[index];

  return (
    <View style={styles.viewerRoot} testID="gallery-viewer">
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={startIndex}
        // Android drops off-screen items from the native tree, which can leave a photo blank
        removeClippedSubviews={false}
        initialNumToRender={items.length}
        windowSize={3}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        keyExtractor={item => String(item.id || item.url)}
        onMomentumScrollEnd={event =>
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item, index: i }) => {
          const uri = resolveImageUrl(item.url);
          return (
            <View style={{ width, height }}>
              {item.kind === 'video' ? (
                <ViewerVideo
                  uri={uri}
                  active={i === index}
                  testID={`viewer-video-${item.id || item.url}`}
                />
              ) : (
                <ViewerImage uri={uri} />
              )}
            </View>
          );
        }}
      />

      <View style={[styles.viewerTop, { top: topInset + s(8) }]} pointerEvents="box-none">
        <BouncyPressable
          style={styles.roundBtn}
          activeScale={0.88}
          onPress={onClose}
          testID="gallery-viewer-close">
          <Feather name="x" size={ms(20)} color="#FFFFFF" />
        </BouncyPressable>
        {items.length > 1 ? (
          <View style={styles.viewerCount}>
            <Text style={styles.viewerCountText}>
              {index + 1} / {items.length}
            </Text>
          </View>
        ) : null}
      </View>

      {current?.caption ? (
        <View style={[styles.viewerCaption, { paddingBottom: bottomInset + s(16) }]} pointerEvents="none">
          <Text style={styles.viewerCaptionText}>{current.caption}</Text>
        </View>
      ) : null}
    </View>
  );
};

// ── Screen ─────────────────────────────────────────────────────────────────

export const StoryDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const slug = route?.params?.slug;
  // The list item the user tapped, so the page has content before the detail call returns
  const preview = route?.params?.preview;

  // GET /stories/{slug}
  const { data: detail, isLoading, isError, refetch } = useTravelStory(slug);
  const story = detail && typeof detail === 'object' ? detail : preview;

  const topInset = insets.top || 0;

  // Scroll-driven hero: the photo drifts slower than the page and stretches on pull-down
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroHeight = vs(340) + topInset;
  const heroTranslate = scrollY.interpolate({
    inputRange: [-heroHeight, 0, heroHeight],
    outputRange: [-heroHeight / 2, 0, heroHeight * 0.35],
    extrapolate: 'clamp',
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-heroHeight, 0],
    outputRange: [2, 1],
    extrapolate: 'clamp',
  });
  const stickyOpacity = scrollY.interpolate({
    inputRange: [heroHeight - s(140), heroHeight - s(80)],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Index of the gallery item open in full screen, or null
  const [viewerIndex, setViewerIndex] = useState(null);

  const bodyBlocks = useMemo(() => toBlocks(story?.body || story?.content), [story]);
  const stops = useMemo(() => (story ? stopsOf(story) : []), [story]);
  const gallery = useMemo(() => asArray(story?.gallery_media).filter(item => item?.url), [story]);
  const places = useMemo(() => asArray(story?.related_listings), [story]);
  const quickFacts = useMemo(() => asArray(story?.quick_facts), [story]);
  const tips = useMemo(
    () => (asArray(story?.parent_tips).length ? asArray(story.parent_tips) : asArray(story?.pet_tips)),
    [story],
  );
  const dogs = useMemo(() => asArray(story?.dog_cards), [story]);
  const scores = useMemo(
    () =>
      Object.entries(story?.reality_scores || {}).filter(
        ([key, value]) => typeof value === 'number' && key !== 'amenities_on_road',
      ),
    [story],
  );

  // Load the gallery photos into the image cache up front, so the full-screen viewer opens at once
  useEffect(() => {
    gallery
      .filter(item => item.kind !== 'video')
      .forEach(item => {
        Promise.resolve(Image.prefetch?.(resolveImageUrl(item.url))).catch(() => {});
      });
  }, [gallery]);

  const cover = resolveImageUrl(story?.cover_image_url || story?.og_image_url);
  const title = story?.title || '';
  const destination = story?.destination || story?.location || '';
  const storyType = story?.story_type || 'Travel Story';

  const metaChips = [
    destination ? { icon: 'map-pin', text: destination } : null,
    story?.travel_date ? { icon: 'calendar', text: formatDate(story.travel_date) } : null,
    story?.vehicle ? { icon: 'truck', text: story.vehicle } : null,
    typeof story?.view_count === 'number'
      ? { icon: 'eye', text: `${story.view_count} reads` }
      : null,
  ].filter(Boolean);

  const glanceRows = [
    ['Destination', destination],
    ['When', formatDate(story?.travel_date)],
    ['Vehicle', story?.vehicle],
    ['Trip cost', story?.trip_cost],
    ['Distance', story?.km_one_way ? `${story.km_one_way} km one way` : ''],
    ['Drive time', story?.drive_hours ? `${story.drive_hours} hr` : ''],
    ['Trip length', story?.trip_duration],
    ['Best season', story?.best_season],
    ['Suitable for', asArray(story?.suitable_for).join(', ')],
    ['Road stops', story?.road_stops ? String(story.road_stops) : ''],
  ].filter(([, value]) => value);

  // Up to three headline numbers shown on the gradient bar under the hero
  const stats = [
    story?.trip_cost ? { label: 'TRIP COST', value: String(story.trip_cost).replace(/INR/i, '').trim() } : null,
    story?.km_one_way ? { label: 'DISTANCE', value: `${story.km_one_way} km` } : null,
    story?.drive_hours ? { label: 'DRIVE', value: `${story.drive_hours} hr` } : null,
    typeof story?.reality_scores?.dog_happiness === 'number'
      ? { label: 'DOG HAPPINESS', value: `${story.reality_scores.dog_happiness}/10` }
      : null,
  ]
    .filter(Boolean)
    .slice(0, 3);

  const watchLinks = [
    story?.watch_youtube_url ? { label: 'Watch on YouTube', url: story.watch_youtube_url } : null,
    story?.watch_instagram_reel_url
      ? { label: 'Watch the reel', url: story.watch_instagram_reel_url }
      : null,
    story?.watch_instagram_post_url
      ? { label: 'See the Instagram post', url: story.watch_instagram_post_url }
      : null,
  ].filter(Boolean);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `🐾 Check out this travel story on PetFriendly: "${title}"${
          destination ? ` (${destination})` : ''
        }`,
        title,
      });
    } catch {
      // The user closed the share sheet
    }
  }, [title, destination]);

  const openListing = useCallback(
    listingSlug => {
      if (listingSlug) {
        navigation.navigate('ListingDetailScreen', { slug: listingSlug });
      }
    },
    [navigation],
  );

  // Nothing to show yet and nothing from the list either
  if (!story) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.centered]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {isLoading ? (
          <ActivityIndicator size="large" color={PURPLE} />
        ) : (
          <>
            <Text style={[styles.errorText, isDarkMode && styles.textLight]}>
              {isError ? 'We could not load this story.' : 'Story not found.'}
            </Text>
            <BouncyPressable style={styles.retryBtn} onPress={() => (isError ? refetch() : navigation.goBack())}>
              <Text style={styles.retryText}>{isError ? 'Try again' : 'Go back'}</Text>
            </BouncyPressable>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header bar that fades in once the hero has scrolled away */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.stickyBar,
          isDarkMode && styles.stickyBarDark,
          { height: topInset + s(56), opacity: stickyOpacity },
        ]}>
        <Text
          style={[styles.stickyTitle, { marginTop: topInset + s(8) }, isDarkMode && styles.textLight]}
          numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingBottom: insets.bottom + s(48) }}>
        {/* ── Hero ── */}
        <View style={[styles.hero, { height: heroHeight }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { transform: [{ translateY: heroTranslate }, { scale: heroScale }] },
            ]}>
            {cover ? (
              <FastImage
                source={{ uri: cover, priority: FastImage.priority.high }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <FastImage
                  source={images.noimage}
                  style={styles.heroPlaceholderImage}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </View>
            )}
          </Animated.View>

          {cover ? (
            <>
              <LinearGradient
                colors={['rgba(15,7,29,0.55)', 'rgba(15,7,29,0)', 'rgba(15,7,29,0.92)']}
                locations={[0, 0.35, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Title over the photo */}
              <View style={styles.heroText}>
                <View style={styles.heroTagRow}>
                  <View style={styles.glassPill}>
                    <Text style={styles.glassPillText}>{storyType}</Text>
                  </View>
                  {destination ? (
                    <View style={styles.heroPlace}>
                      <Feather name="map-pin" size={ms(12)} color="#E9D5FF" />
                      <Text style={styles.heroPlaceText} numberOfLines={1}>
                        {destination}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.heroTitle} numberOfLines={4}>
                  {title}
                </Text>
                {story.author_name ? (
                  <Text style={styles.heroAuthor}>By {story.author_name}</Text>
                ) : null}
              </View>
            </>
          ) : null}
        </View>

        {/* ── Content sheet ── */}
        <View style={[styles.body, isDarkMode && styles.bodyDark]}>
          <View style={[styles.sheetGrip, isDarkMode && styles.sheetGripDark]} />

          {/* No cover photo: the title sits here in dark text instead of over the image */}
          {!cover ? (
            <>
              <View style={styles.tagRow}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{storyType}</Text>
                </View>
              </View>
              <Text style={[styles.title, isDarkMode && styles.textLight]}>{title}</Text>
              {story.author_name ? (
                <Text style={[styles.author, isDarkMode && styles.textMuted]}>
                  By {story.author_name}
                </Text>
              ) : null}
            </>
          ) : null}

          {/* Key numbers */}
          {stats.length > 0 ? (
            <LinearGradient
              colors={['#3B108F', '#7B2CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsBar}>
              {stats.map((stat, index) => (
                <View key={stat.label} style={[styles.statItem, index > 0 && styles.statDivider]}>
                  <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </LinearGradient>
          ) : null}

          {story.excerpt ? (
            <View style={styles.leadWrap}>
              <View style={styles.leadBar} />
              <Text style={[styles.excerpt, isDarkMode && styles.textMuted]}>{story.excerpt}</Text>
            </View>
          ) : null}

          {metaChips.length > 0 ? (
            <View style={styles.chipRow}>
              {metaChips.map(chip => (
                <View key={chip.icon} style={[styles.chip, isDarkMode && styles.chipDark]}>
                  <Feather name={chip.icon} size={ms(12)} color={PURPLE} />
                  <Text style={[styles.chipText, isDarkMode && styles.textLight]} numberOfLines={1}>
                    {chip.text}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Detail is still loading and the list preview is on screen */}
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={PURPLE} />
              <Text style={[styles.loadingText, isDarkMode && styles.textMuted]}>
                Loading the full story…
              </Text>
            </View>
          ) : null}

          {/* ── Trip at a glance ── */}
          {glanceRows.length > 0 ? (
            <>
              <SectionTitle icon="🗺️" isDarkMode={isDarkMode}>
                Trip at a glance
              </SectionTitle>
              <Card isDarkMode={isDarkMode}>
                {glanceRows.map(([label, value], index) => (
                  <View
                    key={label}
                    style={[
                      styles.glanceRow,
                      index > 0 && styles.glanceRowBorder,
                      index > 0 && isDarkMode && styles.glanceRowBorderDark,
                    ]}>
                    <Text style={[styles.glanceLabel, isDarkMode && styles.textMuted]}>{label}</Text>
                    <Text style={[styles.glanceValue, isDarkMode && styles.textLight]}>{value}</Text>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {/* ── Places in this story ── */}
          {places.length > 0 ? (
            <>
              <SectionTitle icon="📍" isDarkMode={isDarkMode}>
                Places in this story
              </SectionTitle>
              {places.map(place => {
                const image = resolveImageUrl(place.main_image_url);
                return (
                  <BouncyPressable
                    key={place.id || place.slug}
                    activeScale={0.98}
                    style={[styles.placeCard, isDarkMode && styles.cardDark]}
                    onPress={() => openListing(place.slug)}>
                    {image ? (
                      <FastImage source={{ uri: image }} style={styles.placeImage} />
                    ) : (
                      <View style={[styles.placeImage, styles.placeImageEmpty]}>
                        <Feather name="map-pin" size={ms(20)} color={PURPLE} />
                      </View>
                    )}
                    <View style={styles.placeText}>
                      <Text
                        style={[styles.placeName, isDarkMode && styles.textLight]}
                        numberOfLines={2}>
                        {place.name}
                      </Text>
                      <Text style={[styles.placeSub, isDarkMode && styles.textMuted]} numberOfLines={1}>
                        {[place.city, place.state].filter(Boolean).join(', ')}
                      </Text>
                      {place.tails_verified ? (
                        <View style={styles.verifiedPill}>
                          <Feather name="check-circle" size={ms(10)} color="#15803D" />
                          <Text style={styles.verifiedText}>Tails verified</Text>
                        </View>
                      ) : null}
                    </View>
                    <Feather name="chevron-right" size={ms(18)} color="#94A3B8" />
                  </BouncyPressable>
                );
              })}
            </>
          ) : null}

          {/* ── The story ── */}
          {bodyBlocks.length > 0 ? (
            <View style={styles.storyWrap}>
              {bodyBlocks.map((block, index) =>
                block.type === 'heading' ? (
                  <View key={index} style={styles.storyHeadingRow}>
                    <View style={styles.storyHeadingBar} />
                    <Text style={[styles.storyHeading, isDarkMode && styles.textLight]}>
                      {block.text}
                    </Text>
                  </View>
                ) : (
                  <Text
                    key={index}
                    style={[
                      styles.storyText,
                      index === 0 && styles.storyLead,
                      isDarkMode && styles.textBody,
                    ]}>
                    {block.text}
                  </Text>
                ),
              )}
            </View>
          ) : null}

          {/* ── Journey timeline ── */}
          {stops.length > 0 && story.show_timeline !== false ? (
            <>
              <SectionTitle icon="🗺" isDarkMode={isDarkMode}>
                Journey Timeline
              </SectionTitle>

              {dogs.length > 0 ? (
                <View style={styles.dogChipRow}>
                  {dogs.map(dog => (
                    <View key={dog.id || dog.name} style={[styles.dogChip, isDarkMode && styles.chipDark]}>
                      <Text style={styles.dogChipEmoji}>{dog.emoji || '🐕'}</Text>
                      <Text style={[styles.dogChipText, isDarkMode && styles.textLight]}>
                        {dog.name}
                        {dog.breed ? ` · ${dog.breed}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {stops.map((stop, index) => {
                const colors = BADGE_COLORS[stop.badgeColor] || BADGE_COLORS.purple;
                return (
                  <Card
                    key={stop.id || index}
                    isDarkMode={isDarkMode}
                    style={[styles.stopCard, { borderLeftColor: colors[1] }]}>
                    <View style={styles.stopTop}>
                      <Text style={styles.stopEmoji}>{stop.emoji || '📍'}</Text>
                      <View style={styles.stopTopText}>
                        {stop.time ? (
                          <Text style={[styles.stopTime, isDarkMode && styles.textMuted]}>
                            {stop.time}
                          </Text>
                        ) : null}
                        <Text style={[styles.stopTitle, isDarkMode && styles.textLight]}>
                          {stop.title}
                        </Text>
                        {stop.sub ? <Text style={styles.stopSub}>{stop.sub}</Text> : null}
                      </View>
                      {stop.badge ? (
                        <View style={[styles.stopBadge, { backgroundColor: colors[0] }]}>
                          <Text style={[styles.stopBadgeText, { color: colors[1] }]}>
                            {stop.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {stop.body ? (
                      <Text style={[styles.stopBody, isDarkMode && styles.textBody]}>{stop.body}</Text>
                    ) : null}

                    {stop.notes.length > 0 ? (
                      <View style={styles.notesWrap}>
                        {stop.notes.map(note => (
                          <View
                            key={`${note.name}-${note.text.slice(0, 12)}`}
                            style={[styles.noteBox, isDarkMode && styles.noteBoxDark]}>
                            <Text style={styles.noteName}>{note.name}</Text>
                            <Text style={[styles.noteText, isDarkMode && styles.textMuted]}>
                              {note.text}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    <BulletList items={stop.pros} kind="pro" isDarkMode={isDarkMode} />
                    <BulletList items={stop.cons} kind="con" isDarkMode={isDarkMode} />

                    {stop.tags.length > 0 ? (
                      <View style={styles.tagWrap}>
                        {stop.tags.map(tag => (
                          <View key={String(tag)} style={styles.smallTag}>
                            <Text style={styles.smallTagText}>{String(tag)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {stop.listingSlug ? (
                      <BouncyPressable
                        style={styles.listingLink}
                        activeScale={0.97}
                        onPress={() => openListing(stop.listingSlug)}>
                        <Feather name="map-pin" size={ms(13)} color="#FFFFFF" />
                        <Text style={styles.listingLinkText}>View this place</Text>
                      </BouncyPressable>
                    ) : null}
                  </Card>
                );
              })}
            </>
          ) : null}

          {/* ── Photo gallery ── */}
          {gallery.length > 0 ? (
            <>
              <SectionTitle icon="📸" isDarkMode={isDarkMode}>
                Photo Gallery
              </SectionTitle>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryRow}>
                {gallery.map((item, itemIndex) => {
                  const isVideo = item.kind === 'video';
                  const itemId = item.id || item.url;
                  const uri = resolveImageUrl(item.url);
                  return (
                    <View
                      key={itemId}
                      style={[styles.galleryItem, isVideo ? styles.galleryItemVideo : null]}>
                      <BouncyPressable
                        activeScale={0.97}
                        onPress={() => setViewerIndex(itemIndex)}
                        testID={`gallery-item-${itemId}`}>
                        {isVideo ? (
                          <GalleryVideoThumb uri={uri} testID={`gallery-thumb-${itemId}`} />
                        ) : (
                          <FastImage
                            source={{ uri }}
                            style={styles.galleryImage}
                            resizeMode={FastImage.resizeMode.cover}
                          />
                        )}
                      </BouncyPressable>
                      {item.caption ? (
                        <Text
                          style={[styles.galleryCaption, isDarkMode && styles.textMuted]}
                          numberOfLines={2}>
                          {item.caption}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          {/* ── Quick facts ── */}
          {quickFacts.length > 0 ? (
            <>
              <SectionTitle icon="⚡" isDarkMode={isDarkMode}>
                Quick Facts
              </SectionTitle>
              <Card isDarkMode={isDarkMode}>
                {quickFacts.map((fact, index) => (
                  <View
                    key={fact.id || index}
                    style={[
                      styles.factRow,
                      index > 0 && styles.glanceRowBorder,
                      index > 0 && isDarkMode && styles.glanceRowBorderDark,
                    ]}>
                    <Text style={styles.factIcon}>{fact.icon || '•'}</Text>
                    <View style={styles.factText}>
                      <Text style={styles.factLabel}>{fact.label}</Text>
                      <Text style={[styles.factValue, isDarkMode && styles.textLight]}>
                        {fact.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          {/* ── Reality score ── */}
          {scores.length > 0 ? (
            <>
              <SectionTitle icon="📊" isDarkMode={isDarkMode}>
                Reality Score
              </SectionTitle>
              <Card isDarkMode={isDarkMode}>
                {scores.map(([key, value]) => {
                  const [emoji, label] = SCORE_LABELS[key] || ['•', humanize(key)];
                  const pct = Math.max(0, Math.min(10, value)) * 10;
                  return (
                    <View key={key} style={styles.scoreRow}>
                      <View style={styles.scoreTop}>
                        <Text style={[styles.scoreLabel, isDarkMode && styles.textLight]}>
                          {emoji} {label}
                        </Text>
                        <Text style={styles.scoreValue}>{value}/10</Text>
                      </View>
                      <View style={[styles.scoreTrack, isDarkMode && styles.scoreTrackDark]}>
                        <LinearGradient
                          colors={['#8B5CF6', PURPLE]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.scoreFill, { width: `${pct}%` }]}
                        />
                      </View>
                    </View>
                  );
                })}
              </Card>
            </>
          ) : null}

          {/* ── Pet parent tips ── */}
          {tips.length > 0 ? (
            <>
              <SectionTitle icon="💡" isDarkMode={isDarkMode}>
                Pet Parent Tips
              </SectionTitle>
              {tips.map((tip, index) => {
                const heading = typeof tip === 'object' ? tip.heading : null;
                const text = typeof tip === 'object' ? tip.text || tip.tip || '' : String(tip);
                return (
                  <Card key={tip?.id || index} isDarkMode={isDarkMode} style={styles.tipCard}>
                    <Text style={styles.tipIcon}>{(typeof tip === 'object' && tip.icon) || '🐾'}</Text>
                    <View style={styles.tipText}>
                      {heading ? (
                        <Text style={[styles.tipHeading, isDarkMode && styles.textLight]}>
                          {heading}
                        </Text>
                      ) : null}
                      <Text style={[styles.tipBody, isDarkMode && styles.textBody]}>{text}</Text>
                    </View>
                  </Card>
                );
              })}
            </>
          ) : null}

          {/* ── Watch links ── */}
          {watchLinks.length > 0 ? (
            <View style={styles.watchWrap}>
              {watchLinks.map(link => (
                <BouncyPressable
                  key={link.url}
                  style={styles.watchBtn}
                  activeScale={0.97}
                  onPress={() => Linking.openURL(link.url).catch(() => {})}>
                  <Feather name="play" size={ms(14)} color="#FFFFFF" />
                  <Text style={styles.watchText}>{story.watch_cta_text || link.label}</Text>
                </BouncyPressable>
              ))}
            </View>
          ) : null}

          {story.end_summary_text ? (
            <Text style={[styles.endSummary, isDarkMode && styles.textMuted]}>
              {story.end_summary_text}
            </Text>
          ) : null}
        </View>
      </Animated.ScrollView>

      {viewerIndex !== null ? (
        <GalleryViewer
          items={gallery}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          topInset={topInset}
          bottomInset={insets.bottom}
        />
      ) : null}

      {/* ── Floating back and share ── */}
      <View style={[styles.topBar, { top: topInset + s(8) }]} pointerEvents="box-none">
        <BouncyPressable
          style={styles.roundBtn}
          activeScale={0.88}
          onPress={() => navigation.goBack()}
          testID="story-back">
          <Feather name="arrow-left" size={ms(20)} color="#FFFFFF" />
        </BouncyPressable>
        <BouncyPressable
          style={styles.roundBtn}
          activeScale={0.88}
          onPress={handleShare}
          testID="story-share">
          <Feather name="share-2" size={ms(18)} color="#FFFFFF" />
        </BouncyPressable>
      </View>
    </View>
  );
};

export default StoryDetailScreen;

// ── Styles ─────────────────────────────────────────────────────────────────

const font = theme.typography.fontFamily;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8FF' },
  containerDark: { backgroundColor: '#0F071D' },
  centered: { alignItems: 'center', justifyContent: 'center', padding: s(24) },
  textLight: { color: '#FFFFFF' },
  textMuted: { color: '#A99CC4' },
  textBody: { color: '#D1D5DB' },

  errorText: { fontSize: s(15), fontFamily: font.medium, color: DEEP, textAlign: 'center' },
  retryBtn: {
    marginTop: s(14),
    paddingHorizontal: s(22),
    paddingVertical: s(10),
    borderRadius: s(20),
    backgroundColor: PURPLE,
  },
  retryText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: s(14) },

  // Hero
  hero: { width: '100%', backgroundColor: '#FDF8FB', overflow: 'hidden' },
  heroPlaceholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderImage: { height: '100%', aspectRatio: 1230 / 1278 },
  topBar: {
    position: 'absolute',
    left: s(16),
    right: s(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: 'rgba(20, 10, 35, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroText: { position: 'absolute', left: s(18), right: s(18), bottom: s(46) },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: s(12) },
  glassPill: {
    paddingHorizontal: s(12),
    paddingVertical: s(5),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  glassPillText: { color: '#FFFFFF', fontSize: s(10.5), fontFamily: font.bold, letterSpacing: 1, textTransform: 'uppercase' },
  heroPlace: { flexDirection: 'row', alignItems: 'center', gap: s(5), flexShrink: 1 },
  heroPlaceText: { color: '#E9D5FF', fontSize: s(12.5), fontFamily: font.medium, flexShrink: 1 },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: s(25),
    lineHeight: s(32),
    fontFamily: font.extraBold,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroAuthor: { marginTop: s(10), color: 'rgba(255,255,255,0.85)', fontSize: s(12.5), fontFamily: font.medium },

  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    alignItems: 'center',
    paddingHorizontal: s(64),
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B108F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  stickyBarDark: { backgroundColor: '#17092E' },
  stickyTitle: { fontSize: s(15), fontFamily: font.bold, color: DEEP, textAlign: 'center' },

  body: {
    marginTop: -s(28),
    borderTopLeftRadius: s(30),
    borderTopRightRadius: s(30),
    backgroundColor: '#FAF8FF',
    paddingHorizontal: s(16),
    paddingTop: s(10),
  },
  bodyDark: { backgroundColor: '#0F071D' },
  sheetGrip: { alignSelf: 'center', width: s(44), height: s(4), borderRadius: s(2), backgroundColor: '#E2D9F3', marginBottom: s(18) },
  sheetGripDark: { backgroundColor: 'rgba(255,255,255,0.2)' },

  statsBar: {
    flexDirection: 'row',
    borderRadius: s(20),
    paddingVertical: s(16),
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: s(6) },
  statDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.25)' },
  statValue: { color: '#FFFFFF', fontSize: s(19), fontFamily: font.extraBold },
  statLabel: { marginTop: s(3), color: 'rgba(255,255,255,0.75)', fontSize: s(9.5), fontFamily: font.bold, letterSpacing: 1 },
  leadWrap: { flexDirection: 'row', marginTop: s(20) },
  leadBar: { width: 3, borderRadius: 2, backgroundColor: '#8B5CF6', marginRight: s(12) },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: s(10) },
  tagPill: {
    backgroundColor: PURPLE,
    paddingHorizontal: s(12),
    paddingVertical: s(5),
    borderRadius: s(14),
  },
  tagPillText: {
    color: '#FFFFFF',
    fontSize: s(11),
    fontFamily: font.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tagMeta: { fontSize: s(12), fontFamily: font.medium, color: '#6B5C85' },
  title: { fontSize: s(22), lineHeight: s(29), fontFamily: font.bold, color: DEEP },
  excerpt: {
    flex: 1,
    fontSize: s(14.5),
    lineHeight: s(23),
    fontStyle: 'italic',
    fontFamily: font.regular,
    color: '#4B5563',
  },
  author: { marginTop: s(8), fontSize: s(12), fontFamily: font.medium, color: '#6B5C85' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(14) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    maxWidth: '100%',
    paddingHorizontal: s(10),
    paddingVertical: s(6),
    borderRadius: s(14),
    backgroundColor: '#F1EAFE',
  },
  chipDark: { backgroundColor: 'rgba(255,255,255,0.08)' },
  chipText: { fontSize: s(12), fontFamily: font.medium, color: DEEP, flexShrink: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(14) },
  loadingText: { fontSize: s(12), fontFamily: font.medium, color: '#6B5C85' },

  // Sections
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(30), marginBottom: s(14) },
  sectionAccent: { width: 4, height: s(20), borderRadius: 2, marginRight: s(2) },
  sectionTitleIcon: { fontSize: s(17) },
  sectionTitle: { fontSize: s(18), fontFamily: font.extraBold, color: DEEP },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(16),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1E1435', borderColor: '#37275C', shadowOpacity: 0.25 },

  // Trip at a glance
  glanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: s(8), gap: s(12) },
  glanceRowBorder: { borderTopWidth: 1, borderTopColor: '#F1EAFE' },
  glanceRowBorderDark: { borderTopColor: '#37275C' },
  glanceLabel: { fontSize: s(12.5), fontFamily: font.medium, color: '#6B5C85' },
  glanceValue: { flex: 1, textAlign: 'right', fontSize: s(13), fontFamily: font.bold, color: DEEP },

  // Places
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(10),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: s(12),
    shadowColor: '#5B21B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  placeImage: { width: s(72), height: s(72), borderRadius: s(16), marginRight: s(12) },
  placeImageEmpty: { backgroundColor: '#F1EAFE', alignItems: 'center', justifyContent: 'center' },
  placeText: { flex: 1 },
  placeName: { fontSize: s(14), fontFamily: font.bold, color: DEEP },
  placeSub: { fontSize: s(12), fontFamily: font.regular, color: '#6B5C85', marginTop: 2 },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(4),
    marginTop: s(5),
    paddingHorizontal: s(8),
    paddingVertical: s(2),
    borderRadius: s(10),
    backgroundColor: '#DCFCE7',
  },
  verifiedText: { fontSize: s(10), fontFamily: font.bold, color: '#15803D' },

  // Story body
  storyWrap: { marginTop: s(22) },
  storyHeadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: s(22), marginBottom: s(10) },
  storyHeadingBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: '#EE2A7B', marginRight: s(10) },
  storyHeading: { flex: 1, fontSize: s(18), lineHeight: s(25), fontFamily: font.extraBold, color: DEEP },
  storyText: { fontSize: s(14.5), lineHeight: s(24), fontFamily: font.regular, color: '#374151', marginBottom: s(10) },
  storyLead: { fontSize: s(16), lineHeight: s(26), fontFamily: font.medium, color: '#1E1B4B' },

  // Timeline
  dogChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginBottom: s(12) },
  dogChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(10),
    paddingVertical: s(6),
    borderRadius: s(14),
    backgroundColor: '#F1EAFE',
  },
  dogChipEmoji: { fontSize: s(13) },
  dogChipText: { fontSize: s(12), fontFamily: font.bold, color: DEEP },
  stopCard: { marginBottom: s(14), borderLeftWidth: 4 },
  stopTop: { flexDirection: 'row', alignItems: 'flex-start' },
  stopEmoji: { fontSize: s(22), marginRight: s(10) },
  stopTopText: { flex: 1 },
  stopTime: { fontSize: s(11), fontFamily: font.medium, color: '#6B5C85', marginBottom: 2 },
  stopTitle: { fontSize: s(15), lineHeight: s(20), fontFamily: font.bold, color: DEEP },
  stopSub: { fontSize: s(12), fontFamily: font.medium, color: PURPLE, marginTop: 2 },
  stopBadge: { paddingHorizontal: s(9), paddingVertical: s(3), borderRadius: s(10), marginLeft: s(8) },
  stopBadgeText: { fontSize: s(10.5), fontFamily: font.bold },
  stopBody: { marginTop: s(10), fontSize: s(13), lineHeight: s(20), fontFamily: font.regular, color: '#4B5563' },
  notesWrap: { marginTop: s(10), gap: s(8) },
  noteBox: { borderRadius: s(12), backgroundColor: '#F8F5FF', padding: s(10), borderLeftWidth: 3, borderLeftColor: '#8B5CF6' },
  noteBoxDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  noteName: { fontSize: s(11.5), fontFamily: font.bold, color: PURPLE, marginBottom: 2 },
  noteText: { fontSize: s(12), lineHeight: s(18), fontFamily: font.regular, color: '#4B5563' },
  bulletList: { marginTop: s(10), gap: s(5) },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start' },
  bulletIcon: { marginRight: s(8), marginTop: 3 },
  bulletText: { flex: 1, fontSize: s(12.5), lineHeight: s(18), fontFamily: font.regular, color: '#4B5563' },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginTop: s(10) },
  smallTag: { paddingHorizontal: s(9), paddingVertical: s(3), borderRadius: s(10), backgroundColor: '#F1EAFE' },
  smallTagText: { fontSize: s(10.5), fontFamily: font.medium, color: '#6D28D9' },
  listingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(6),
    marginTop: s(12),
    paddingHorizontal: s(14),
    paddingVertical: s(8),
    borderRadius: s(16),
    backgroundColor: PURPLE,
  },
  listingLinkText: { color: '#FFFFFF', fontSize: s(12.5), fontFamily: font.bold },

  // Full-screen gallery viewer
  videoFailed: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: s(32) },
  videoFailedTitle: { marginTop: s(14), color: '#FFFFFF', fontSize: s(16), fontFamily: font.bold, textAlign: 'center' },
  videoFailedText: { marginTop: s(8), color: 'rgba(255,255,255,0.7)', fontSize: s(13), lineHeight: s(19), fontFamily: font.regular, textAlign: 'center' },
  videoFailedBtn: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: s(18), paddingHorizontal: s(18), paddingVertical: s(10), borderRadius: s(20), backgroundColor: '#7B2CFF' },
  videoFailedBtnText: { color: '#FFFFFF', fontSize: s(13), fontFamily: font.bold },
  viewerSpinner: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  viewerRoot: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000', zIndex: 100, elevation: 100 },
  viewerTop: { position: 'absolute', left: s(16), right: s(16), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  viewerCount: { paddingHorizontal: s(12), paddingVertical: s(6), borderRadius: s(14), backgroundColor: 'rgba(255,255,255,0.18)' },
  viewerCountText: { color: '#FFFFFF', fontSize: s(12), fontFamily: font.bold },
  viewerCaption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: s(20), paddingTop: s(24), backgroundColor: 'rgba(0,0,0,0.55)' },
  viewerCaptionText: { color: '#FFFFFF', fontSize: s(13), lineHeight: s(19), fontFamily: font.medium, textAlign: 'center' },

  // Gallery
  galleryRow: { gap: s(12), paddingRight: s(16) },
  galleryItem: { width: s(250) },
  galleryItemVideo: { width: s(170) },
  galleryImage: { width: '100%', height: s(226), borderRadius: s(18), backgroundColor: '#E9E1FB', overflow: 'hidden' },
  videoThumb: { width: '100%', height: s(226), borderRadius: s(18), backgroundColor: '#1E1435', overflow: 'hidden' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.12)' },
  playCircle: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,10,35,0.55)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  playIcon: { marginLeft: s(3) },
  galleryCaption: { marginTop: s(6), fontSize: s(11.5), lineHeight: s(16), fontFamily: font.regular, color: '#6B5C85' },

  // Quick facts
  factRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: s(9) },
  factIcon: { fontSize: s(18), marginRight: s(12), width: s(26) },
  factText: { flex: 1 },
  factLabel: { fontSize: s(10.5), fontFamily: font.bold, color: PURPLE, letterSpacing: 0.6 },
  factValue: { fontSize: s(13), lineHeight: s(19), fontFamily: font.medium, color: '#374151', marginTop: 2 },

  // Reality score
  scoreRow: { marginBottom: s(12) },
  scoreTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(5) },
  scoreLabel: { fontSize: s(12.5), fontFamily: font.medium, color: DEEP },
  scoreValue: { fontSize: s(12.5), fontFamily: font.bold, color: PURPLE },
  scoreTrack: { height: s(8), borderRadius: s(4), backgroundColor: '#EDE9FE', overflow: 'hidden' },
  scoreTrackDark: { backgroundColor: '#37275C' },
  scoreFill: { height: '100%', borderRadius: s(4) },

  // Tips
  tipCard: { flexDirection: 'row', marginBottom: s(10) },
  tipIcon: { fontSize: s(20), marginRight: s(12) },
  tipText: { flex: 1 },
  tipHeading: { fontSize: s(14), lineHeight: s(19), fontFamily: font.bold, color: DEEP, marginBottom: s(4) },
  tipBody: { fontSize: s(12.5), lineHeight: s(19), fontFamily: font.regular, color: '#4B5563' },

  // Watch and end
  watchWrap: { marginTop: s(22), gap: s(10) },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingVertical: s(12),
    borderRadius: s(24),
    backgroundColor: DEEP,
  },
  watchText: { color: '#FFFFFF', fontSize: s(14), fontFamily: font.bold },
  endSummary: { marginTop: s(22), fontSize: s(13.5), lineHeight: s(21), fontFamily: font.medium, color: '#4B5563', textAlign: 'center' },
});
