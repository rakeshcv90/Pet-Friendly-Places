import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  Share,
  Linking,
  Modal,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from '../../components/common/FastImage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useListingDetail, resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';
import { ModernConfirmModal } from '../Profile/components/ModernConfirmModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Robust helper to parse Postgres array, JSON array, or plain string
const parseAnyArray = val => {
  if (!val) {
    return [];
  }
  if (Array.isArray(val)) {
    return val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return trimmed
          .slice(1, -1)
          .split(',')
          .map(item => item.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
    }
    return [trimmed];
  }
  return [];
};

// Strips HTML tags and unescapes standard entities
const stripHtml = str => {
  if (!str) {
    return '';
  }
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

// Strips HTML tags but preserves <mark ...> and </mark> for inline highlights
const stripHtmlPreserveMark = str => {
  if (!str) {
    return '';
  }
  return str
    .replace(/<(?!mark\b|\/mark)[^>]+>/gi, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
};

// Removes duplicate parenthesized descriptions, e.g. "Apple (The Golden Retriever) (Golden Retriever)" -> "Apple (The Golden Retriever)"
const cleanDuplicateParentheses = str => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .replace(/\(The\s+([^)]+)\)\s*\(\1\)/gi, '(The $1)')
    .replace(/\(([^)]+)\)\s*\(The\s+\1\)/gi, '(The $1)')
    .replace(/\(([^)]+)\)\s*\(\1\)/gi, '($1)')
    .trim();
};

export const RoadTripStopDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const slug = route?.params?.slug;

  // ── Fetch complete listing data from API ──
  const { data: apiListing, isLoading } = useListingDetail(slug);

  // ── Fallback params if provided ──
  const listing = apiListing || route?.params?.listing || {};

  // ── Routes featuring this listing directly from apiListing.listing_routes ──
  const featuredRoutes = useMemo(() => {
    if (Array.isArray(listing?.listing_routes) && listing.listing_routes.length > 0) {
      return listing.listing_routes;
    }
    return [];
  }, [listing?.listing_routes]);

  // ── State for Interactive Features ──
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [wipModal, setWipModal] = useState({ visible: false, title: '', subtitle: '' });
  const heartScaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev);
    heartScaleAnim.setValue(0.7);
    Animated.spring(heartScaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [heartScaleAnim]);

  // ── Parse fields from API with safe fallbacks ──
  const venueName = listing.name;
  const categoryName = listing.category;
  const specificType = listing.specific_type;
  const cityName = listing.city;
  const stateName = listing.state;
  const addressText = listing.address;
  const viewCount = listing.view_count ? Number(listing.view_count).toLocaleString() : null;

  // ── Dynamic Pet Friendliness from API: e.g. "pet_tolerant" -> "Pet Tolerant", "pet_friendly" -> "Pet Friendly" ──
  const petFriendlinessLevel = listing.pet_friendliness_level;
  const petFriendlinessText = useMemo(() => {
    if (!petFriendlinessLevel || typeof petFriendlinessLevel !== 'string') {
      return null;
    }
    return petFriendlinessLevel
      .split('_')
      .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ');
  }, [petFriendlinessLevel]);

  const isTolerant = petFriendlinessLevel === 'pet_tolerant';

  const allowedDogSizes = useMemo(
    () => parseAnyArray(listing.allowed_dog_sizes),
    [listing.allowed_dog_sizes],
  );
  const allowedPetTypes = useMemo(
    () => parseAnyArray(listing.allowed_pet_types),
    [listing.allowed_pet_types],
  );
  const petAmenities = useMemo(() => parseAnyArray(listing.pet_amenities), [listing.pet_amenities]);
  const tagsList = useMemo(() => parseAnyArray(listing.tags), [listing.tags]);

  const [showFullPolicyDetails, setShowFullPolicyDetails] = useState(false);

  // Policy bullet points parsed dynamically from listing.pet_policy
  const policyBulletPoints = useMemo(() => {
    if (!listing.pet_policy || typeof listing.pet_policy !== 'string') {
      return [];
    }
    if (listing.pet_policy.includes('\n')) {
      return listing.pet_policy
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    }
    return listing.pet_policy
      .split(/(?<=[.?!])\s+/)
      .map(line => line.trim())
      .filter(Boolean);
  }, [listing.pet_policy]);

  const petChargeDisplay = useMemo(() => {
    if (
      listing.pet_charges_amount !== undefined &&
      listing.pet_charges_amount !== null &&
      listing.pet_charges_amount !== ''
    ) {
      return `₹${listing.pet_charges_amount}`;
    }
    if (listing.pet_charges === 'free' || !listing.pet_charges) {
      return '₹0';
    }
    return String(listing.pet_charges);
  }, [listing.pet_charges_amount, listing.pet_charges]);

  const feeBasisText = useMemo(() => {
    if (listing.pet_charges_type === 'free' || listing.pet_charges === 'free') {
      return 'Free';
    }
    if (listing.pet_charges_type && typeof listing.pet_charges_type === 'string') {
      return listing.pet_charges_type.charAt(0).toUpperCase() + listing.pet_charges_type.slice(1);
    }
    return 'Free';
  }, [listing.pet_charges_type, listing.pet_charges]);

  const reviewMethodText = useMemo(() => {
    const raw = cleanDuplicateParentheses(listing.verification_method);
    return String(raw).toLowerCase();
  }, [listing.verification_method]);

  const cleanedVerificationMethod = useMemo(() => {
    return cleanDuplicateParentheses(listing.verification_method);
  }, [listing.verification_method]);

  const cleanedVerifiedByName = useMemo(() => {
    return cleanDuplicateParentheses(listing.verified_by_name);
  }, [listing.verified_by_name]);

  const tailsNoteText = useMemo(() => {
    let note = listing.tails_verified_note || listing.verification_notes || '';
    if (typeof note !== 'string') {
      return '';
    }
    note = note.trim();
    if (
      (note.startsWith('"') && note.endsWith('"')) ||
      (note.startsWith('“') && note.endsWith('”'))
    ) {
      note = note.slice(1, -1).trim();
    }
    return cleanDuplicateParentheses(note);
  }, [listing.tails_verified_note, listing.verification_notes]);

  const formattedReviewDate = useMemo(() => {
    const raw = listing.tails_verified_date || listing.verification_date || listing.created_at;
    if (!raw) {
      return '';
    }
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) {
        const parts = String(raw).split(/[-T\s]/);
        if (parts.length >= 3 && parts[0].length === 4) {
          const year = parts[0];
          const monthIdx = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
            return `${day} ${months[monthIdx]} ${year}`;
          }
        }
        return String(raw);
      }
      const day = d.getDate();
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return String(raw);
    }
  }, [listing.tails_verified_date, listing.verification_date, listing.created_at]);

  // Gallery Photos
  const galleryImages = useMemo(() => {
    const list = [];
    if (Array.isArray(listing?.images) && listing.images.length > 0) {
      listing.images.forEach(img => {
        const url = typeof img === 'string' ? img : img?.image_url;
        if (url) {
          list.push(resolveImageUrl(url));
        }
      });
    }
    if (list.length === 0 && (listing?.main_image_url || listing?.cover_image_url)) {
      list.push(resolveImageUrl(listing.main_image_url || listing.cover_image_url));
    }
    return list;
  }, [listing?.images, listing?.main_image_url, listing?.cover_image_url]);

  const heroImageUri = galleryImages[0] || null;

  // Nearby Places
  const nearbyList = useMemo(() => {
    if (Array.isArray(listing?.nearby)) {
      return listing.nearby;
    }
    return [];
  }, [listing?.nearby]);

  // Description HTML Parser for Rich Article Blocks
  const parsedArticle = useMemo(() => {
    const raw = listing.description || '';
    if (!raw) {
      return { stats: [], callouts: [], sections: [], intro: listing.excerpt || '' };
    }

    // 1. Stats
    const statsRegex =
      /<div class="article-stat">[\s\S]*?<span class="article-stat-icon">([\s\S]*?)<\/span>[\s\S]*?<div class="article-stat-value">([\s\S]*?)<\/div>[\s\S]*?<div class="article-stat-label">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g;
    let match;
    const stats = [];
    while ((match = statsRegex.exec(raw)) !== null) {
      stats.push({
        icon: stripHtml(match[1]),
        value: stripHtml(match[2]),
        label: stripHtml(match[3]),
      });
    }

    // 2. Callouts (preserve <mark> tags for inline text highlights)
    const calloutRegex =
      /<div class="brush-callout\s+([^"]+)">[\s\S]*?<div class="brush-title">([\s\S]*?)<\/div>[\s\S]*?<div class="brush-body">([\s\S]*?)<\/div>[\s\S]*?<\/div>/g;
    const callouts = [];
    while ((match = calloutRegex.exec(raw)) !== null) {
      callouts.push({
        theme: match[1],
        title: stripHtml(match[2]),
        body: stripHtmlPreserveMark(match[3]),
      });
    }

    // 3. H3 Sections (preserve <mark> tags for inline text highlights)
    const sectionRegex = /<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/g;
    const sections = [];
    while ((match = sectionRegex.exec(raw)) !== null) {
      sections.push({
        title: stripHtml(match[1]),
        content: stripHtmlPreserveMark(match[2]),
      });
    }

    // 4. Intro paragraphs (preserve <mark> tags for inline text highlights)
    const pRegex = /<p>([\s\S]*?)<\/p>/g;
    const paragraphs = [];
    while ((match = pRegex.exec(raw)) !== null) {
      const cleanP = stripHtmlPreserveMark(match[1]);
      if (cleanP && !cleanP.startsWith('Address:')) {
        paragraphs.push(cleanP);
      }
    }

    // Prepare fallback excerpt with excerpt_highlight if available
    let fallbackIntro = listing.excerpt || '';
    if (
      fallbackIntro &&
      listing.excerpt_highlight &&
      fallbackIntro.includes(listing.excerpt_highlight)
    ) {
      fallbackIntro = fallbackIntro.replace(
        listing.excerpt_highlight,
        `<mark class="keyword-highlight hl-amber">${listing.excerpt_highlight}</mark>`,
      );
    }

    return {
      stats: stats, // Purely dynamic from API data - no static fallback!
      callouts,
      sections,
      intro: paragraphs[0] || fallbackIntro,
      secondaryIntro: paragraphs[1] || '',
    };
  }, [listing.description, listing.excerpt, listing.excerpt_highlight]);

  // ── Render inline highlighted text based on <mark> tags from API ──
  const renderHighlightedText = useCallback(
    (textWithMarks, baseStyle) => {
      if (!textWithMarks) {
        return null;
      }
      const regex = /<mark(?:\s+class="([^"]*)")?>([\s\S]*?)<\/mark>/gi;
      const elements = [];
      let lastIndex = 0;
      let match;
      let keyIndex = 0;

      while ((match = regex.exec(textWithMarks)) !== null) {
        if (match.index > lastIndex) {
          elements.push(
            <Text key={`txt-${keyIndex++}`}>
              {textWithMarks.substring(lastIndex, match.index)}
            </Text>,
          );
        }
        const className = match[1] || '';
        const isTeal = className.includes('hl-teal');
        elements.push(
          <Text
            key={`mark-${keyIndex++}`}
            style={[
              isTeal ? styles.highlightTeal : styles.highlightAmber,
              isDarkMode && (isTeal ? styles.highlightTealDark : styles.highlightAmberDark),
            ]}>
            {stripHtml(match[2])}
          </Text>,
        );
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < textWithMarks.length) {
        elements.push(<Text key={`txt-${keyIndex++}`}>{textWithMarks.substring(lastIndex)}</Text>);
      }

      return <Text style={baseStyle}>{elements}</Text>;
    },
    [isDarkMode],
  );

  // Actions
  const handleOpenDirections = useCallback(() => {
    if (listing.google_maps_url) {
      Linking.openURL(listing.google_maps_url).catch(() => {
        const query = encodeURIComponent(`${venueName} ${cityName}`);
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
      });
    } else {
      const query = encodeURIComponent(`${venueName} ${addressText || cityName}`);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
    }
  }, [listing.google_maps_url, venueName, cityName, addressText]);

  const handleShare = useCallback(() => {
    Share.share({
      message: `${venueName} — Pet-friendly ${specificType} in ${cityName}.\nVerified stop with dogs!\n${
        listing.google_maps_url || ''
      }`,
      title: venueName,
    }).catch(() => {});
  }, [venueName, specificType, cityName, listing.google_maps_url]);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />

      {/* ── Background Ambient Decorative Glow Orbs (Matching HomeScreen) ── */}
      <View
        style={[styles.ambientGlowTopRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowMidLeft, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowBottomRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View style={styles.ambientPawWatermarkTop} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(130)}
          color={isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(124, 58, 237, 0.04)'}
        />
      </View>
      <View style={styles.ambientPawWatermarkBottom} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(245, 158, 11, 0.03)'}
        />
      </View>

      {/* ── Top Header Navigation Bar ── */}
      <View
        style={[
          styles.headerBar,
          isDarkMode && styles.headerBarDark,
          { paddingTop: Math.max(insets.top, s(12)) },
        ]}>
        <BouncyPressable
          style={[styles.headerCircleBtn, isDarkMode && styles.headerCircleBtnDark]}
          activeScale={0.88}
          onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={ms(19)} color={isDarkMode ? '#EDE9FE' : '#1E1035'} />
        </BouncyPressable>

        <View style={styles.headerCenterCol}>
          <Text style={[styles.headerSubHeading, isDarkMode && styles.headerSubHeadingDark]}>
            HIGHWAY PET STOP
          </Text>
          <Text
            style={[styles.headerMainTitle, isDarkMode && styles.headerMainTitleDark]}
            numberOfLines={1}>
            {venueName}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <BouncyPressable
            style={[styles.headerCircleBtn, isDarkMode && styles.headerCircleBtnDark]}
            activeScale={0.88}
            onPress={handleToggleFavorite}>
            <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={ms(18)}
                color={isFavorited ? '#EF4444' : isDarkMode ? '#C4B5FD' : '#7C3AED'}
              />
            </Animated.View>
          </BouncyPressable>

          <BouncyPressable
            style={[styles.headerCircleBtn, isDarkMode && styles.headerCircleBtnDark]}
            activeScale={0.88}
            onPress={handleShare}>
            <Feather name="share-2" size={ms(17)} color={isDarkMode ? '#EDE9FE' : '#1E1035'} />
          </BouncyPressable>
        </View>
      </View>

      {/* ── Main Scrollable Body or Loader ── */}
      {isLoading && !apiListing && !route?.params?.listing?.name ? (
        <Loader
          fullScreen
          title="Loading pet stop..."
          subtitle="Fetching verified pet policy & details..."
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: s(85) + Math.max(insets.bottom, s(16)) },
            ]}
            showsVerticalScrollIndicator={false}>
            {/* ── 1. Hero Image Banner ── */}
            <View style={[styles.heroCard, isDarkMode && styles.heroCardDark]}>
              {heroImageUri ? (
                <FastImage
                  source={{ uri: heroImageUri, priority: FastImage.priority.high }}
                  style={styles.heroImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <LinearGradient
                  colors={
                    isDarkMode
                      ? ['#31135E', '#200A43', '#14052C']
                      : ['#7C3AED', '#6D28D9', '#4C1D95']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroFallbackGradient}>
                  <Ionicons
                    name="paw"
                    size={ms(120)}
                    color="rgba(255, 255, 255, 0.08)"
                    style={styles.heroPawBg}
                  />
                  <View style={styles.heroIconBadge}>
                    <Ionicons name="restaurant" size={ms(32)} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              )}

              {/* Bottom Gradient for Scrim */}
              <LinearGradient
                colors={['transparent', 'rgba(15, 7, 29, 0.88)']}
                style={styles.heroScrim}
              />

              {/* Top Floating Badges */}
              <View style={styles.heroTopBadgesRow}>
                {categoryName ? (
                  <View style={styles.categoryPill}>
                    <Ionicons name="pricetag" size={ms(10)} color="#FFFFFF" />
                    <Text style={styles.categoryPillText}>{categoryName.toUpperCase()}</Text>
                  </View>
                ) : specificType ? (
                  <View style={styles.categoryPill}>
                    <Ionicons name="pricetag" size={ms(10)} color="#FFFFFF" />
                    <Text style={styles.categoryPillText}>{specificType.toUpperCase()}</Text>
                  </View>
                ) : null}

                {viewCount ? (
                  <View style={styles.viewsPill}>
                    <Ionicons name="eye-outline" size={ms(11)} color="#E0E7FF" />
                    <Text style={styles.viewsPillText}>{viewCount} views</Text>
                  </View>
                ) : null}
              </View>

              {/* Verification Badge Float */}
              <View style={styles.heroVerifiedBadge}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.verifiedGradientBadge}>
                  <Ionicons name="sparkles" size={ms(12)} color="#FFFFFF" />
                  <Text style={styles.verifiedBadgeText}>TAILS VERIFIED</Text>
                </LinearGradient>
              </View>
            </View>

            {/* ── 2. Photos & Videos Reel (From API images) ── */}
            {galleryImages.length > 0 && (
              <View style={styles.photosReelSection}>
                <View style={styles.sectionHeadingRow}>
                  <View style={styles.sectionTitleLeft}>
                    <Feather
                      name="image"
                      size={ms(14)}
                      color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                    />
                    <Text
                      style={[styles.sectionHeadingText, isDarkMode && styles.sectionHeadingDark]}>
                      Photos & Videos
                    </Text>
                    <View style={[styles.countBadge, isDarkMode && styles.countBadgeDark]}>
                      <Text
                        style={[styles.countBadgeText, isDarkMode && styles.countBadgeTextDark]}>
                        {galleryImages.length}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.sectionHeadingAction, isDarkMode && styles.sectionActionDark]}>
                    Tap to expand
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.galleryScroll}>
                  {galleryImages.map((imgUri, index) => (
                    <BouncyPressable
                      key={index}
                      activeScale={0.94}
                      style={[styles.galleryThumbCard, isDarkMode && styles.galleryThumbCardDark]}
                      onPress={() => setSelectedPhoto(imgUri)}>
                      <FastImage
                        source={{ uri: imgUri }}
                        style={styles.galleryThumbImg}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.45)']}
                        style={styles.galleryThumbScrim}>
                        <Ionicons name="expand" size={ms(13)} color="#FFFFFF" />
                      </LinearGradient>
                    </BouncyPressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── 3. Venue Title, Type & Full Address ── */}
            <View style={[styles.venueInfoCard, isDarkMode && styles.venueInfoCardDark]}>
              {/* Subtitle / Type Pills */}
              <View style={styles.typePillsRow}>
                {specificType ? (
                  <View style={[styles.typePill, isDarkMode && styles.typePillDark]}>
                    <Text style={[styles.typePillText, isDarkMode && styles.typePillTextDark]}>
                      {specificType}
                    </Text>
                  </View>
                ) : null}

                {categoryName && categoryName !== specificType ? (
                  <View
                    style={[
                      styles.categoryOutlinePill,
                      isDarkMode && styles.categoryOutlinePillDark,
                    ]}>
                    <Text
                      style={[
                        styles.categoryOutlinePillText,
                        isDarkMode && styles.categoryOutlinePillTextDark,
                      ]}>
                      {categoryName}
                    </Text>
                  </View>
                ) : null}

                {petFriendlinessText ? (
                  <View
                    style={[
                      styles.friendlinessPill,
                      isTolerant ? styles.friendlinessPillAmber : styles.friendlinessPillGreen,
                      isDarkMode &&
                        (isTolerant
                          ? styles.friendlinessPillAmberDark
                          : styles.friendlinessPillGreenDark),
                    ]}>
                    <Ionicons
                      name={isTolerant ? 'paw' : 'shield-checkmark'}
                      size={ms(11)}
                      color={
                        isTolerant
                          ? isDarkMode
                            ? '#FCD34D'
                            : '#D97706'
                          : isDarkMode
                          ? '#34D399'
                          : '#059669'
                      }
                    />
                    <Text
                      style={[
                        styles.friendlinessPillText,
                        isTolerant
                          ? styles.friendlinessPillAmberText
                          : styles.friendlinessPillGreenText,
                        isDarkMode &&
                          (isTolerant
                            ? styles.friendlinessPillAmberTextDark
                            : styles.friendlinessPillGreenTextDark),
                      ]}>
                      {petFriendlinessText}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.venueH1, isDarkMode && styles.venueH1Dark]}>{venueName}</Text>

              {/* Area / City */}
              <Text style={[styles.venueCitySubtitle, isDarkMode && styles.venueCitySubtitleDark]}>
                {[cityName, stateName].filter(Boolean).join(', ')}
              </Text>

              {/* Full Address */}
              {addressText ? (
                <View style={[styles.addressBox, isDarkMode && styles.addressBoxDark]}>
                  <Ionicons
                    name="location-sharp"
                    size={ms(15)}
                    color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                    style={styles.addressPinIcon}
                  />
                  <Text style={[styles.addressText, isDarkMode && styles.addressTextDark]}>
                    {addressText}
                  </Text>
                </View>
              ) : null}

              {/* Quick Pet Meta Tags (Matching Web screenshot) */}
              <View style={styles.metaChipsWrap}>
                {allowedPetTypes.map((pet, pIdx) => (
                  <View
                    key={`pet-${pIdx}`}
                    style={[styles.metaChipGreen, isDarkMode && styles.metaChipGreenDark]}>
                    <Ionicons
                      name={pet.toLowerCase().includes('dog') ? 'paw' : 'happy'}
                      size={ms(11)}
                      color="#10B981"
                    />
                    <Text
                      style={[
                        styles.metaChipGreenText,
                        isDarkMode && styles.metaChipGreenTextDark,
                      ]}>
                      {pet}
                    </Text>
                  </View>
                ))}

                <View style={[styles.metaChipTeal, isDarkMode && styles.metaChipTealDark]}>
                  <Ionicons name="pricetag" size={ms(11)} color="#0D9488" />
                  <Text
                    style={[styles.metaChipTealText, isDarkMode && styles.metaChipTealTextDark]}>
                    {listing.pet_charges && listing.pet_charges !== 'free'
                      ? `Pet Fee: ${listing.pet_charges}`
                      : 'Zero Pet Fee'}
                  </Text>
                </View>

                <View style={[styles.metaChipPurple, isDarkMode && styles.metaChipPurpleDark]}>
                  <Ionicons name="moon" size={ms(11)} color="#7C3AED" />
                  <Text
                    style={[
                      styles.metaChipPurpleText,
                      isDarkMode && styles.metaChipPurpleTextDark,
                    ]}>
                    24/7 Overnight Stop
                  </Text>
                </View>

                <View style={[styles.metaChipAmber, isDarkMode && styles.metaChipAmberDark]}>
                  <Ionicons name="heart" size={ms(11)} color="#D97706" />
                  <Text
                    style={[styles.metaChipAmberText, isDarkMode && styles.metaChipAmberTextDark]}>
                    {allowedDogSizes.length > 0 ? allowedDogSizes.join(', ') : 'All Dog Sizes'}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── 4. Quick Actions ("Get in touch") ── */}
            <View style={styles.quickActionsRow}>
              <BouncyPressable
                style={[styles.actionBtnPrimary, isDarkMode && styles.actionBtnPrimaryDark]}
                activeScale={0.95}
                onPress={handleOpenDirections}>
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnPrimaryGradient}>
                  <Ionicons name="navigate-outline" size={ms(15)} color="#FFFFFF" />
                  <Text style={styles.actionBtnPrimaryText}>Directions</Text>
                  <Feather name="arrow-up-right" size={ms(14)} color="#FFFFFF" />
                </LinearGradient>
              </BouncyPressable>

              <BouncyPressable
                style={[styles.actionBtnOutline, isDarkMode && styles.actionBtnOutlineDark]}
                activeScale={0.95}
                onPress={handleToggleFavorite}>
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={ms(15)}
                  color={isFavorited ? '#EF4444' : isDarkMode ? '#C4B5FD' : '#7C3AED'}
                />
                <Text
                  style={[
                    styles.actionBtnOutlineText,
                    isDarkMode && styles.actionBtnOutlineDarkText,
                  ]}>
                  {isFavorited ? 'Saved' : 'Save'}
                </Text>
              </BouncyPressable>

              <BouncyPressable
                style={[styles.actionBtnOutline, isDarkMode && styles.actionBtnOutlineDark]}
                activeScale={0.95}
                onPress={handleShare}>
                <Feather name="share-2" size={ms(14)} color={isDarkMode ? '#C4B5FD' : '#7C3AED'} />
                <Text
                  style={[
                    styles.actionBtnOutlineText,
                    isDarkMode && styles.actionBtnOutlineDarkText,
                  ]}>
                  Share
                </Text>
              </BouncyPressable>
            </View>

            {/* ── 5. Tails Verified Audit Card (Amber / Peach Card from Screenshot) ── */}
            {(listing.tails_verified_note || listing.tails_verified) && (
              <View style={[styles.tailsAuditCard, isDarkMode && styles.tailsAuditCardDark]}>
                <View style={styles.tailsAuditHeader}>
                  <View style={styles.tailsAuditBadge}>
                    <Ionicons name="shield-checkmark" size={ms(14)} color="#FFFFFF" />
                    <Text style={styles.tailsAuditBadgeText}>TAILS VERIFIED ON ROAD TRIP</Text>
                  </View>
                  {formattedReviewDate ? (
                    <Text
                      numberOfLines={1}
                      style={[styles.tailsAuditDate, isDarkMode && styles.tailsAuditDateDark]}>
                      {formattedReviewDate}
                    </Text>
                  ) : null}
                </View>

                {tailsNoteText ? (
                  <Text style={[styles.tailsAuditNote, isDarkMode && styles.tailsAuditNoteDark]}>
                    {`"${tailsNoteText}"`}
                  </Text>
                ) : null}

                <View style={styles.tailsAuditFooter}>
                  <Ionicons
                    name="checkmark-circle"
                    size={ms(12)}
                    color="#10B981"
                    style={styles.tailsAuditFooterIcon}
                  />
                  <Text
                    style={[
                      styles.tailsAuditVerifiedBy,
                      isDarkMode && styles.tailsAuditVerifiedByDark,
                    ]}>
                    {`Verified by ${cleanedVerifiedByName} • ${cleanedVerificationMethod}`}
                  </Text>
                </View>
              </View>
            )}

            {/* ── 6. "Why Pet Parents Will Love This Place" ── */}
            <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
              <View style={styles.sectionHeaderWrap}>
                <Ionicons
                  name="sparkles"
                  size={ms(15)}
                  color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                />
                <Text style={[styles.mainSectionTitle, isDarkMode && styles.mainSectionTitleDark]}>
                  Why pet parents will love this place
                </Text>
              </View>

              {/* 3 Stat Cards Row - Only show if present in API data */}
              {parsedArticle.stats && parsedArticle.stats.length > 0 ? (
                <View style={styles.statsThreeRow}>
                  {parsedArticle.stats.map((st, sIdx) => (
                    <View
                      key={`stat-${sIdx}`}
                      style={[styles.statBoxCard, isDarkMode && styles.statBoxCardDark]}>
                      <Text style={styles.statIconEmoji}>{st.icon}</Text>
                      <Text style={[styles.statValueText, isDarkMode && styles.statValueTextDark]}>
                        {st.value}
                      </Text>
                      <Text style={[styles.statLabelText, isDarkMode && styles.statLabelTextDark]}>
                        {st.label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Intro Paragraphs with Inline Highlights */}
              {parsedArticle.intro
                ? renderHighlightedText(parsedArticle.intro, [
                    styles.articleParagraph,
                    isDarkMode && styles.articleParagraphDark,
                  ])
                : null}

              {parsedArticle.secondaryIntro
                ? renderHighlightedText(parsedArticle.secondaryIntro, [
                    styles.articleParagraph,
                    isDarkMode && styles.articleParagraphDark,
                  ])
                : null}

              {/* Brush Callouts (e.g. Original Shiva Dhaba Note) */}
              {parsedArticle.callouts.map((callout, cIdx) => (
                <View
                  key={`callout-${cIdx}`}
                  style={[
                    styles.calloutCard,
                    callout.theme === 'amber' ? styles.calloutAmber : styles.calloutPurple,
                    isDarkMode &&
                      (callout.theme === 'amber'
                        ? styles.calloutAmberDark
                        : styles.calloutPurpleDark),
                  ]}>
                  <View style={styles.calloutTitleRow}>
                    <Ionicons
                      name={callout.theme === 'amber' ? 'alert-circle' : 'information-circle'}
                      size={ms(15)}
                      color={callout.theme === 'amber' ? '#D97706' : '#7C3AED'}
                    />
                    <Text
                      style={[
                        styles.calloutTitle,
                        callout.theme === 'amber'
                          ? styles.calloutAmberTitle
                          : styles.calloutPurpleTitle,
                        isDarkMode && styles.calloutTitleDark,
                      ]}>
                      {callout.title}
                    </Text>
                  </View>
                  {renderHighlightedText(callout.body, [
                    styles.calloutBody,
                    callout.theme === 'amber' ? styles.calloutAmberBody : styles.calloutPurpleBody,
                    isDarkMode && styles.calloutBodyDark,
                  ])}
                </View>
              ))}

              {/* Formatted Sub-sections with Inline Highlights */}
              {parsedArticle.sections.map((sec, secIdx) => (
                <View key={`sec-${secIdx}`} style={styles.articleSubSection}>
                  <View style={styles.subSectionTitleRow}>
                    <View
                      style={[styles.subSectionBullet, isDarkMode && styles.subSectionBulletDark]}
                    />
                    <Text
                      style={[
                        styles.subSectionHeading,
                        isDarkMode && styles.subSectionHeadingDark,
                      ]}>
                      {sec.title}
                    </Text>
                  </View>
                  {renderHighlightedText(sec.content, [
                    styles.articleParagraph,
                    isDarkMode && styles.articleParagraphDark,
                  ])}
                </View>
              ))}
            </View>

            {/* ── 7. Pet Policy Section (Matching Website Exact Layout) ── */}
            <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
              <View style={styles.sectionHeaderWrap}>
                <Text style={styles.sectionPawEmoji}>🐾</Text>
                <Text style={[styles.mainSectionTitle, isDarkMode && styles.mainSectionTitleDark]}>
                  Pet Policy
                </Text>
              </View>

              {/* 1. Key Rules Box */}
              <View style={[styles.keyRulesContainer, isDarkMode && styles.keyRulesContainerDark]}>
                <View style={styles.keyRulesBadgeRow}>
                  <View style={[styles.petPolicyBadge, isDarkMode && styles.petPolicyBadgeDark]}>
                    <Text
                      style={[
                        styles.petPolicyBadgeText,
                        isDarkMode && styles.petPolicyBadgeTextDark,
                      ]}>
                      Pet policy
                    </Text>
                  </View>
                  <Text style={[styles.keyRulesLabel, isDarkMode && styles.keyRulesLabelDark]}>
                    Key rules
                  </Text>
                </View>

                <View
                  style={[
                    styles.otherPolicyDetailsCard,
                    isDarkMode && styles.otherPolicyDetailsCardDark,
                  ]}>
                  <Text
                    style={[
                      styles.otherPolicyDetailsTitle,
                      isDarkMode && styles.otherPolicyDetailsTitleDark,
                    ]}>
                    Other policy details
                  </Text>
                  {policyBulletPoints.length > 0 ? (
                    policyBulletPoints.map((point, pIdx) => (
                      <View key={`policy-pt-${pIdx}`} style={styles.bulletRow}>
                        <View style={[styles.bulletDot, isDarkMode && styles.bulletDotDark]} />
                        <Text style={[styles.bulletText, isDarkMode && styles.bulletTextDark]}>
                          {point}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.bulletText, isDarkMode && styles.bulletTextDark]}>
                      {listing.pet_policy || 'No formal pet policy recorded.'}
                    </Text>
                  )}
                </View>
              </View>

              {/* 2. Pet Charges Banner */}
              <View style={[styles.petChargesBanner, isDarkMode && styles.petChargesBannerDark]}>
                <Text style={[styles.petChargesLabel, isDarkMode && styles.petChargesLabelDark]}>
                  Pet charges
                </Text>
                <View
                  style={[styles.petChargeTealChip, isDarkMode && styles.petChargeTealChipDark]}>
                  <Text
                    style={[
                      styles.petChargeTealChipText,
                      isDarkMode && styles.petChargeTealChipTextDark,
                    ]}>
                    {petChargeDisplay}
                  </Text>
                </View>
              </View>

              {/* 3. Water Access Banner */}
              <View style={[styles.waterAccessCard, isDarkMode && styles.waterAccessCardDark]}>
                <View style={[styles.waterAccessBadge, isDarkMode && styles.waterAccessBadgeDark]}>
                  <Text
                    style={[
                      styles.waterAccessBadgeText,
                      isDarkMode && styles.waterAccessBadgeTextDark,
                    ]}>
                    Pets may enter the water
                  </Text>
                </View>
                <Text style={[styles.waterAccessValue, isDarkMode && styles.waterAccessValueDark]}>
                  {listing.pets_in_pool || listing.water_access_available ? 'Yes' : 'No'}
                </Text>
              </View>

              {/* 4. Side-by-Side: Allowed Pets & Pet Amenities */}
              <View style={styles.sideBySideRow}>
                {/* Allowed Pets */}
                <View style={[styles.allowedPetsCard, isDarkMode && styles.allowedPetsCardDark]}>
                  <View
                    style={[
                      styles.allowedPetsHeaderBadge,
                      isDarkMode && styles.allowedPetsHeaderBadgeDark,
                    ]}>
                    <Text
                      style={[
                        styles.allowedPetsHeaderBadgeText,
                        isDarkMode && styles.allowedPetsHeaderBadgeTextDark,
                      ]}>
                      🐾 Allowed Pets
                    </Text>
                  </View>
                  <View style={styles.chipsWrapRow}>
                    {allowedPetTypes.length > 0 ? (
                      allowedPetTypes.map((petType, idx) => (
                        <View
                          key={`pet-${idx}`}
                          style={[styles.allowedPetPill, isDarkMode && styles.allowedPetPillDark]}>
                          <Text
                            style={[
                              styles.allowedPetPillText,
                              isDarkMode && styles.allowedPetPillTextDark,
                            ]}>
                            {petType}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View
                        style={[styles.allowedPetPill, isDarkMode && styles.allowedPetPillDark]}>
                        <Text
                          style={[
                            styles.allowedPetPillText,
                            isDarkMode && styles.allowedPetPillTextDark,
                          ]}>
                          Dogs
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Pet Amenities */}
                <View style={[styles.petAmenitiesCard, isDarkMode && styles.petAmenitiesCardDark]}>
                  <View
                    style={[
                      styles.petAmenitiesHeaderBadge,
                      isDarkMode && styles.petAmenitiesHeaderBadgeDark,
                    ]}>
                    <Text
                      style={[
                        styles.petAmenitiesHeaderBadgeText,
                        isDarkMode && styles.petAmenitiesHeaderBadgeTextDark,
                      ]}>
                      ⭐ Pet Amenities
                    </Text>
                  </View>
                  <View style={styles.chipsWrapRow}>
                    {petAmenities.length > 0 ? (
                      petAmenities.map((amenity, idx) => (
                        <View
                          key={`amenity-${idx}`}
                          style={[styles.petAmenityPill, isDarkMode && styles.petAmenityPillDark]}>
                          <Text
                            style={[
                              styles.petAmenityPillText,
                              isDarkMode && styles.petAmenityPillTextDark,
                            ]}>
                            {amenity}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View
                        style={[styles.petAmenityPill, isDarkMode && styles.petAmenityPillDark]}>
                        <Text
                          style={[
                            styles.petAmenityPillText,
                            isDarkMode && styles.petAmenityPillTextDark,
                          ]}>
                          Pet-friendly outdoor area
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* 5. Collapsible Details Toggle */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowFullPolicyDetails(prev => !prev)}
                style={styles.detailsToggleRow}>
                <Text
                  style={[styles.detailsToggleText, isDarkMode && styles.detailsToggleTextDark]}>
                  {showFullPolicyDetails ? '▲' : '▼'} Full pet policy, fee history and review
                  details
                </Text>
              </TouchableOpacity>

              {showFullPolicyDetails && (
                <View
                  style={[
                    styles.expandedDetailsContainer,
                    isDarkMode && styles.expandedDetailsContainerDark,
                  ]}>
                  {/* Full pet policy */}
                  <View style={styles.detailsSection}>
                    <Text
                      style={[
                        styles.detailsSectionTitle,
                        isDarkMode && styles.detailsSectionTitleDark,
                      ]}>
                      Full pet policy
                    </Text>
                    <Text
                      style={[
                        styles.detailsSectionBody,
                        isDarkMode && styles.detailsSectionBodyDark,
                      ]}>
                      {listing.pet_policy || 'No formal pet policy recorded.'}
                    </Text>
                  </View>

                  {/* Fee history and source notes */}
                  <View style={styles.detailsSection}>
                    <Text
                      style={[
                        styles.detailsSectionTitle,
                        isDarkMode && styles.detailsSectionTitleDark,
                      ]}>
                      Fee history and source notes
                    </Text>

                    <View style={styles.feeRecordItem}>
                      <Text
                        style={[
                          styles.detailsFieldLabel,
                          isDarkMode && styles.detailsFieldLabelDark,
                        ]}>
                        Pet charge record
                      </Text>
                      <Text
                        style={[
                          styles.detailsFieldValue,
                          isDarkMode && styles.detailsFieldValueDark,
                        ]}>
                        {listing.pet_charges || 'free'}
                      </Text>
                    </View>

                    <View style={styles.feeRecordItem}>
                      <Text
                        style={[
                          styles.detailsFieldLabel,
                          isDarkMode && styles.detailsFieldLabelDark,
                        ]}>
                        Recorded amount
                      </Text>
                      <Text
                        style={[
                          styles.detailsFieldValue,
                          isDarkMode && styles.detailsFieldValueDark,
                        ]}>
                        {listing.pet_charges_amount !== undefined &&
                        listing.pet_charges_amount !== null &&
                        listing.pet_charges_amount !== ''
                          ? `₹${listing.pet_charges_amount}`
                          : '₹0'}
                      </Text>
                    </View>

                    <View style={styles.feeRecordItem}>
                      <Text
                        style={[
                          styles.detailsFieldLabel,
                          isDarkMode && styles.detailsFieldLabelDark,
                        ]}>
                        Recorded fee basis
                      </Text>
                      <Text
                        style={[
                          styles.detailsFieldValue,
                          isDarkMode && styles.detailsFieldValueDark,
                        ]}>
                        {feeBasisText}
                      </Text>
                    </View>
                  </View>

                  {/* Review details */}
                  <View style={styles.detailsSection}>
                    <Text
                      style={[
                        styles.detailsSectionTitle,
                        isDarkMode && styles.detailsSectionTitleDark,
                      ]}>
                      Review details
                    </Text>
                    <Text
                      style={[
                        styles.detailsSectionBody,
                        isDarkMode && styles.detailsSectionBodyDark,
                      ]}>
                      Review method: {reviewMethodText}.
                    </Text>
                    <Text
                      style={[
                        styles.detailsSectionBody,
                        isDarkMode && styles.detailsSectionBodyDark,
                        { marginTop: ms(4) },
                      ]}>
                      Review date: {formattedReviewDate}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ── 8. Amenities Section ── */}
            {petAmenities.length > 0 && (
              <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
                <View style={styles.sectionHeaderWrap}>
                  <Ionicons name="checkmark-done-circle" size={ms(15)} color="#3B82F6" />
                  <Text
                    style={[styles.mainSectionTitle, isDarkMode && styles.mainSectionTitleDark]}>
                    Amenities & Highway Facilities
                  </Text>
                </View>

                <View style={styles.amenitiesWrap}>
                  {petAmenities.map((amenity, aIdx) => (
                    <View
                      key={`amenity-${aIdx}`}
                      style={[styles.amenityChip, isDarkMode && styles.amenityChipDark]}>
                      <Ionicons name="paw" size={ms(12)} color="#10B981" />
                      <Text
                        style={[styles.amenityChipText, isDarkMode && styles.amenityChipTextDark]}>
                        {amenity}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── 9. Tags Row ── */}
            {tagsList.length > 0 && (
              <View style={[styles.tagsContainer, isDarkMode && styles.tagsContainerDark]}>
                <Text style={[styles.tagsHeaderLabel, isDarkMode && styles.tagsHeaderLabelDark]}>
                  TAGS & TOPICS
                </Text>
                <View style={styles.tagsFlexRow}>
                  {tagsList.map((tag, tIdx) => (
                    <View
                      key={`tag-${tIdx}`}
                      style={[styles.tagPill, isDarkMode && styles.tagPillDark]}>
                      <Text style={[styles.tagPillText, isDarkMode && styles.tagPillTextDark]}>
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── 10. "Part of a Pet-Friendly Road Trip" ── */}
            {featuredRoutes.length > 0 && (
              <View style={[styles.sectionCard, isDarkMode && styles.sectionCardDark]}>
                <View style={styles.sectionHeaderWrap}>
                  <Ionicons name="map" size={ms(15)} color="#7C3AED" />
                  <Text
                    style={[styles.mainSectionTitle, isDarkMode && styles.mainSectionTitleDark]}>
                    Part of a pet-friendly road trip
                  </Text>
                </View>

                {featuredRoutes.map((rt, rIdx) => (
                  <BouncyPressable
                    key={`route-${rIdx}`}
                    style={[styles.featuredRouteCard, isDarkMode && styles.featuredRouteCardDark]}
                    activeScale={0.97}
                    onPress={() => navigation.navigate('RoadTripDetailScreen', { slug: rt.slug })}>
                    <View style={styles.featuredRouteTop}>
                      <View style={styles.featuredRouteBadge}>
                        <Ionicons name="flag" size={ms(11)} color="#FFFFFF" />
                        <Text style={styles.featuredRouteBadgeText}>RECOMMENDED ROAD TRIP</Text>
                      </View>
                      {rt.totalDistanceKm ? (
                        <Text
                          style={[
                            styles.featuredRouteDistText,
                            isDarkMode && styles.featuredRouteDistTextDark,
                          ]}>
                          {rt.totalDistanceKm} km
                        </Text>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.featuredRouteName,
                        isDarkMode && styles.featuredRouteNameDark,
                      ]}>
                      {rt.origin || 'Delhi'} → {rt.destination || 'Destination'}
                    </Text>

                    <View style={styles.featuredRouteFooter}>
                      <Text
                        style={[
                          styles.featuredRouteAction,
                          isDarkMode && styles.featuredRouteActionDark,
                        ]}>
                        View Road Trip Guide
                      </Text>
                      <Feather
                        name="arrow-up-right"
                        size={ms(13)}
                        color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                      />
                    </View>
                  </BouncyPressable>
                ))}
              </View>
            )}

            {/* ── 11. Nearby Pet-Friendly Places Reel ── */}
            {nearbyList.length > 0 && (
              <View style={styles.nearbySection}>
                <View style={styles.sectionHeadingRow}>
                  <View style={styles.sectionTitleLeft}>
                    <Ionicons
                      name="compass-outline"
                      size={ms(16)}
                      color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                    />
                    <Text
                      style={[styles.sectionHeadingText, isDarkMode && styles.sectionHeadingDark]}>
                      Pet-friendly places nearby
                    </Text>
                  </View>
                  <Text
                    style={[styles.sectionHeadingCount, isDarkMode && styles.sectionActionDark]}>
                    {nearbyList.length} places
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.nearbyScroll}>
                  {nearbyList.map(place => {
                    const coverImg = place.main_image_url || place.cover_image_url;
                    const resolvedCover = coverImg ? resolveImageUrl(coverImg) : null;
                    return (
                      <BouncyPressable
                        key={place.id}
                        style={[styles.nearbyCard, isDarkMode && styles.nearbyCardDark]}
                        activeScale={0.96}
                        onPress={() => {
                          if (place.slug) {
                            navigation.push('RoadTripStopDetailScreen', { slug: place.slug });
                          }
                        }}>
                        <View style={styles.nearbyImageWrap}>
                          {resolvedCover ? (
                            <FastImage
                              source={{ uri: resolvedCover }}
                              style={styles.nearbyImage}
                              resizeMode={FastImage.resizeMode.cover}
                            />
                          ) : (
                            <View
                              style={[
                                styles.nearbyImageFallback,
                                isDarkMode && styles.nearbyImageFallbackDark,
                              ]}>
                              <Ionicons name="paw" size={ms(24)} color="rgba(255, 255, 255, 0.4)" />
                            </View>
                          )}
                          <View style={styles.nearbyTierPill}>
                            <Ionicons name="sparkles" size={ms(9)} color="#FFFFFF" />
                            <Text style={styles.nearbyTierText}>
                              {place.verification_tier === 'TAILS_VERIFIED'
                                ? 'Tails Verified'
                                : 'Pet Verified'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.nearbyBody}>
                          <Text
                            style={[
                              styles.nearbyCategoryText,
                              isDarkMode && styles.nearbyCategoryDark,
                            ]}
                            numberOfLines={1}>
                            {String(
                              place?.specific_type || place?.category || 'Pit Stop',
                            ).toUpperCase()}
                          </Text>
                          <Text
                            style={[styles.nearbyTitleText, isDarkMode && styles.nearbyTitleDark]}
                            numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text
                            style={[styles.nearbyCityText, isDarkMode && styles.nearbyCityDark]}
                            numberOfLines={1}>
                            {[place.city, place.state].filter(Boolean).join(', ')}
                          </Text>
                          {place.excerpt ? (
                            <Text
                              style={[
                                styles.nearbyExcerptText,
                                isDarkMode && styles.nearbyExcerptDark,
                              ]}
                              numberOfLines={2}>
                              {place.excerpt}
                            </Text>
                          ) : null}
                        </View>
                      </BouncyPressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* ── Floating Bottom Action Bar ── */}
          <View
            style={[
              styles.floatingBottomBar,
              isDarkMode && styles.floatingBottomBarDark,
              { paddingBottom: Math.max(insets.bottom, s(12)) + s(6) },
            ]}>
            <View style={styles.bottomBarLeft}>
              <Text style={[styles.bottomBarPrice, isDarkMode && styles.bottomBarPriceDark]}>
                {listing.pet_charges === 'free'
                  ? 'Zero Pet Fee'
                  : petFriendlinessText || 'Pet Friendly'}
              </Text>
              <Text style={[styles.bottomBarStatus, isDarkMode && styles.bottomBarStatusDark]}>
                Open 24 Hours • Confirmed
              </Text>
            </View>

            <BouncyPressable
              style={styles.bottomBarBtn}
              activeScale={0.95}
              onPress={handleOpenDirections}>
              <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bottomBarGradient}>
                <Ionicons name="navigate" size={ms(14)} color="#FFFFFF" />
                <Text style={styles.bottomBarBtnText}>Get Directions</Text>
              </LinearGradient>
            </BouncyPressable>
          </View>
        </>
      )}

      {/* ── Image Lightbox Modal ── */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.modalBackdrop}>
          <BouncyPressable
            style={[styles.modalCloseBtn, { top: insets.top + s(15) }]}
            activeScale={0.9}
            onPress={() => setSelectedPhoto(null)}>
            <Feather name="x" size={ms(20)} color="#FFFFFF" />
          </BouncyPressable>

          {selectedPhoto && (
            <FastImage
              source={{ uri: selectedPhoto }}
              style={styles.modalFullImage}
              resizeMode={FastImage.resizeMode.contain}
            />
          )}
        </View>
      </Modal>

      {/* ── Work in Progress Modal ── */}
      <ModernConfirmModal
        visible={wipModal.visible}
        onClose={() => setWipModal({ visible: false, title: '', subtitle: '' })}
        onConfirm={() => setWipModal({ visible: false, title: '', subtitle: '' })}
        title={wipModal.title}
        subtitle={wipModal.subtitle}
        badge="COMMUNITY FEATURE"
        type="progress"
        confirmText="Got it"
      />

      {/* ── Premium Custom Loader ── */}
      {/* Only when a partial stop was passed in: otherwise the page loader above is already showing */}
      <Loader
        visible={isLoading && !listing?.id && !!route?.params?.listing?.name}
        message="Loading verified highway stop..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },

  /* ── Background Ambient Decorative Glows (Matching HomeScreen) ── */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -s(30),
    right: -s(50),
    width: s(280),
    height: s(280),
    borderRadius: s(140),
    backgroundColor: 'rgba(233, 213, 255, 0.45)',
  },
  ambientGlowMidLeft: {
    position: 'absolute',
    top: s(400),
    left: -s(70),
    width: s(260),
    height: s(260),
    borderRadius: s(130),
    backgroundColor: 'rgba(254, 240, 215, 0.50)',
  },
  ambientGlowBottomRight: {
    position: 'absolute',
    bottom: s(120),
    right: -s(60),
    width: s(300),
    height: s(300),
    borderRadius: s(150),
    backgroundColor: 'rgba(245, 230, 255, 0.45)',
  },
  ambientGlowDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: s(160),
    right: -s(20),
    transform: [{ rotate: '-25deg' }],
  },
  ambientPawWatermarkBottom: {
    position: 'absolute',
    bottom: s(240),
    left: -s(30),
    transform: [{ rotate: '28deg' }],
  },

  /* ── Header ── */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: s(10),
    backgroundColor: '#FAF7F2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
    zIndex: 10,
  },
  headerBarDark: {
    backgroundColor: '#0F071D',
    borderBottomColor: 'rgba(46, 22, 84, 0.5)',
  },
  headerCircleBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCircleBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#3B186E',
    borderLeftColor: '#2E1256',
    borderRightColor: '#2E1256',
    borderBottomColor: '#120524',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  headerCenterCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(10),
  },
  headerSubHeading: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: ms(14),
    letterSpacing: 0.56,
    textTransform: 'uppercase',
    color: '#9A8CA2',
    marginBottom: s(1),
  },
  headerSubHeadingDark: {
    color: '#C4B5FD',
  },
  headerMainTitle: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: ms(24),
    letterSpacing: 0,
    color: '#392840',
  },
  headerMainTitleDark: {
    color: '#FFFFFF',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },

  scrollContent: {
    paddingTop: s(10),
  },

  /* ── Hero Image Banner ── */
  heroCard: {
    marginHorizontal: s(16),
    height: s(210),
    borderRadius: s(22),
    overflow: 'hidden',
    backgroundColor: '#170A2E',
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
    marginBottom: s(14),
  },
  heroCardDark: {
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallbackGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroPawBg: {
    position: 'absolute',
    right: -s(20),
    bottom: -s(20),
  },
  heroIconBadge: {
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: s(90),
  },
  heroTopBadgesRow: {
    position: 'absolute',
    top: s(12),
    left: s(12),
    right: s(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(15, 7, 29, 0.75)',
    paddingHorizontal: s(10),
    paddingVertical: s(4.5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryPillText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  viewsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(15, 7, 29, 0.75)',
    paddingHorizontal: s(9),
    paddingVertical: s(4.5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewsPillText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#E0E7FF',
  },
  heroVerifiedBadge: {
    position: 'absolute',
    bottom: s(12),
    left: s(12),
  },
  verifiedGradientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    paddingHorizontal: s(11),
    paddingVertical: s(5.5),
    borderRadius: s(16),
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedBadgeText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },

  /* ── Photos & Videos Section ── */
  photosReelSection: {
    marginBottom: s(14),
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    marginBottom: s(8),
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  sectionHeadingText: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.semiBold,
    lineHeight: ms(30),
    letterSpacing: -0.8,
    color: '#3B108F',
  },
  sectionHeadingDark: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    paddingHorizontal: s(7),
    paddingVertical: s(1.5),
    borderRadius: s(10),
  },
  countBadgeDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  countBadgeText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
  },
  countBadgeTextDark: {
    color: '#C4B5FD',
  },
  sectionHeadingAction: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  sectionActionDark: {
    color: '#C4B5FD',
  },
  galleryScroll: {
    paddingHorizontal: s(16),
    gap: s(10),
  },
  galleryThumbCard: {
    width: s(115),
    height: s(85),
    borderRadius: s(14),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  galleryThumbCardDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  galleryThumbScrim: {
    position: 'absolute',
    right: s(5),
    bottom: s(5),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  /* ── Venue Title & Location Card ── */
  venueInfoCard: {
    marginHorizontal: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(16),
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: s(12),
  },
  venueInfoCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  typePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: s(8),
  },
  typePill: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: s(9),
    paddingVertical: s(3.5),
    borderRadius: s(8),
  },
  typePillDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  typePillText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
  },
  typePillTextDark: {
    color: '#C4B5FD',
  },
  categoryOutlinePill: {
    backgroundColor: 'rgba(107, 114, 128, 0.08)',
    paddingHorizontal: s(8),
    paddingVertical: s(3.5),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.2)',
  },
  categoryOutlinePillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryOutlinePillText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#6B7280',
  },
  categoryOutlinePillTextDark: {
    color: '#D1D5DB',
  },
  friendlinessPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(8),
    paddingVertical: s(3.5),
    borderRadius: s(8),
    borderWidth: 1,
  },
  friendlinessPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  friendlinessPillGreenDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  friendlinessPillGreenText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },
  friendlinessPillGreenTextDark: {
    color: '#34D399',
  },
  friendlinessPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  friendlinessPillAmberDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  friendlinessPillAmberText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#D97706',
  },
  friendlinessPillAmberTextDark: {
    color: '#FCD34D',
  },
  venueH1: {
    fontSize: ms(20),
    fontFamily: theme.typography.fontFamily.semiBold,
    lineHeight: ms(25.5),
    letterSpacing: -1.03,
    color: '#1E1035',
    marginBottom: s(4),
  },
  venueH1Dark: {
    color: '#FFFFFF',
  },
  venueCitySubtitle: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#6B7280',
    marginBottom: s(10),
  },
  venueCitySubtitleDark: {
    color: '#9CA3AF',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    padding: s(10),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: s(12),
  },
  addressBoxDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#260F45',
  },
  addressPinIcon: {
    marginTop: s(2),
    marginRight: s(6),
  },
  addressText: {
    flex: 1,
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#4B5563',
    lineHeight: ms(16),
  },
  addressTextDark: {
    color: '#D1D5DB',
  },
  metaChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
  },
  metaChipGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: s(9),
    paddingVertical: s(4.5),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  metaChipGreenDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  metaChipGreenText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },
  metaChipGreenTextDark: {
    color: '#34D399',
  },
  metaChipTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: s(9),
    paddingVertical: s(4.5),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
  },
  metaChipTealDark: {
    backgroundColor: 'rgba(13, 148, 136, 0.18)',
  },
  metaChipTealText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0D9488',
  },
  metaChipTealTextDark: {
    color: '#2DD4BF',
  },
  metaChipPurple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: s(9),
    paddingVertical: s(4.5),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  metaChipPurpleDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
  },
  metaChipPurpleText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  metaChipPurpleTextDark: {
    color: '#C4B5FD',
  },
  metaChipAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: s(9),
    paddingVertical: s(4.5),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  metaChipAmberDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  metaChipAmberText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#D97706',
  },
  metaChipAmberTextDark: {
    color: '#FCD34D',
  },

  /* ── Quick Actions Row ── */
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(16),
    gap: s(8),
    marginBottom: s(12),
  },
  actionBtnPrimary: {
    flex: 2,
    borderRadius: s(14),
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnPrimaryDark: {
    shadowColor: '#000000',
  },
  actionBtnPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    paddingVertical: s(12),
    paddingHorizontal: s(12),
  },
  actionBtnPrimaryText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(5),
    paddingVertical: s(11),
    backgroundColor: '#FFFFFF',
    borderRadius: s(14),
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 2.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnOutlineDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  actionBtnOutlineText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
  },
  actionBtnOutlineDarkText: {
    color: '#FFFFFF',
  },

  /* ── Tails Verified Audit Card ── */
  tailsAuditCard: {
    marginHorizontal: s(16),
    backgroundColor: '#FFFBEB',
    borderRadius: s(18),
    padding: s(15),
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FDE68A',
    borderRightColor: '#FDE68A',
    borderBottomColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: s(12),
  },
  tailsAuditCardDark: {
    backgroundColor: '#27190A',
    borderTopColor: '#452A08',
    borderLeftColor: '#3B2306',
    borderRightColor: '#3B2306',
    borderBottomColor: '#2A1702',
    shadowColor: '#000000',
  },
  tailsAuditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: s(6),
    marginBottom: s(8),
  },
  tailsAuditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#D97706',
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderRadius: s(12),
  },
  tailsAuditBadgeText: {
    fontSize: ms(9),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  tailsAuditDate: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#B45309',
    flexShrink: 1,
  },
  tailsAuditDateDark: {
    color: '#FCD34D',
  },
  tailsAuditNote: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: ms(18),
    letterSpacing: 0,
    textAlign: 'left',
    color: '#78350F',
    marginBottom: s(10),
  },
  tailsAuditNoteDark: {
    color: '#FDE68A',
  },
  tailsAuditFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(6),
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.2)',
    paddingTop: s(8),
  },
  tailsAuditFooterIcon: {
    marginTop: s(1.5),
  },
  tailsAuditVerifiedBy: {
    flex: 1,
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#92400E',
    lineHeight: ms(15),
  },
  tailsAuditVerifiedByDark: {
    color: '#FCD34D',
  },

  /* ── General Section Card ── */
  sectionCard: {
    marginHorizontal: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    padding: s(16),
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3.5,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: s(12),
  },
  sectionCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(7),
    marginBottom: s(14),
  },
  mainSectionTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
  },
  mainSectionTitleDark: {
    color: '#FFFFFF',
  },

  /* ── 3 Stat Cards Row ── */
  statsThreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: s(14),
  },
  statBoxCard: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    borderRadius: s(14),
    padding: s(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  statBoxCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#3B186E',
  },
  statIconEmoji: {
    fontSize: ms(18),
    marginBottom: s(3),
  },
  statValueText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    textAlign: 'center',
  },
  statValueTextDark: {
    color: '#FFFFFF',
  },
  statLabelText: {
    fontSize: ms(8.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: s(2),
  },
  statLabelTextDark: {
    color: '#9CA3AF',
  },

  articleParagraph: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: ms(19),
    marginBottom: s(10),
  },
  articleParagraphDark: {
    color: '#D1D5DB',
  },

  /* Callouts */
  calloutCard: {
    borderRadius: s(14),
    padding: s(12),
    marginBottom: s(12),
    borderLeftWidth: 4,
  },
  calloutPurple: {
    backgroundColor: '#FAF5FF',
    borderLeftColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  calloutPurpleDark: {
    backgroundColor: '#1F0B3D',
    borderColor: '#3B186E',
    borderLeftColor: '#A855F7',
  },
  calloutAmber: {
    backgroundColor: '#FFFBEB',
    borderLeftColor: '#D97706',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  calloutAmberDark: {
    backgroundColor: '#27190A',
    borderColor: '#452A08',
    borderLeftColor: '#F59E0B',
  },
  calloutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: s(4),
  },
  calloutTitle: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  calloutPurpleTitle: {
    color: '#6D28D9',
  },
  calloutAmberTitle: {
    color: '#B45309',
  },
  calloutTitleDark: {
    color: '#FFFFFF',
  },
  calloutBody: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.medium,
    lineHeight: ms(17),
  },
  calloutPurpleBody: {
    color: '#4C1D95',
  },
  calloutAmberBody: {
    color: '#78350F',
  },
  calloutBodyDark: {
    color: '#E5E7EB',
  },

  /* ── Inline Keyword Highlights (matching <mark class="keyword-highlight">) ── */
  highlightAmber: {
    backgroundColor: '#FEF08A',
    color: '#713F12',
    fontFamily: theme.typography.fontFamily.bold,
  },
  highlightAmberDark: {
    backgroundColor: 'rgba(250, 204, 21, 0.28)',
    color: '#FDE047',
  },
  highlightTeal: {
    backgroundColor: '#CCFBF1',
    color: '#0F766E',
    fontFamily: theme.typography.fontFamily.bold,
  },
  highlightTealDark: {
    backgroundColor: 'rgba(20, 184, 166, 0.28)',
    color: '#5EEAD4',
  },

  /* Sub sections */
  articleSubSection: {
    marginTop: s(6),
    marginBottom: s(6),
  },
  subSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: s(6),
  },
  subSectionBullet: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#7C3AED',
  },
  subSectionBulletDark: {
    backgroundColor: '#A855F7',
  },
  subSectionHeading: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
  },
  subSectionHeadingDark: {
    color: '#FFFFFF',
  },

  sectionPawEmoji: {
    fontSize: ms(16),
    marginRight: s(6),
  },

  /* ── Website-matched Pet Policy Styles ── */
  keyRulesContainer: {
    backgroundColor: '#F8F6FF',
    borderRadius: s(12),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginTop: s(4),
  },
  keyRulesContainerDark: {
    backgroundColor: '#1E1238',
    borderColor: '#372063',
  },
  keyRulesBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(8),
  },
  petPolicyBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(6),
  },
  petPolicyBadgeDark: {
    backgroundColor: '#372063',
  },
  petPolicyBadgeText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  petPolicyBadgeTextDark: {
    color: '#DDD6FE',
  },
  keyRulesLabel: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#4B5563',
    marginLeft: s(8),
  },
  keyRulesLabelDark: {
    color: '#9CA3AF',
  },
  otherPolicyDetailsCard: {
    backgroundColor: '#F9F8FC',
    borderRadius: s(10),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#E5E0F5',
  },
  otherPolicyDetailsCardDark: {
    backgroundColor: '#150B28',
    borderColor: '#2D1B50',
  },
  otherPolicyDetailsTitle: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#4B5563',
    marginBottom: s(6),
  },
  otherPolicyDetailsTitleDark: {
    color: '#A78BFA',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: s(4),
  },
  bulletDot: {
    width: s(4),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: '#374151',
    marginTop: s(7),
    marginRight: s(8),
  },
  bulletDotDark: {
    backgroundColor: '#9CA3AF',
  },
  bulletText: {
    flex: 1,
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#292238',
    lineHeight: ms(18.5),
  },
  bulletTextDark: {
    color: '#E2E8F0',
  },

  /* Pet charges banner */
  petChargesBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: s(11),
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(10),
  },
  petChargesBannerDark: {
    backgroundColor: '#062817',
    borderColor: '#059669',
  },
  petChargesLabel: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111827',
  },
  petChargesLabelDark: {
    color: '#F3F4F6',
  },
  petChargeTealChip: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(6),
    marginLeft: s(8),
  },
  petChargeTealChipDark: {
    backgroundColor: '#042F2E',
  },
  petChargeTealChipText: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#0D9488',
  },
  petChargeTealChipTextDark: {
    color: '#2DD4BF',
  },

  /* Water access card */
  waterAccessCard: {
    backgroundColor: '#F8F6FF',
    borderRadius: s(10),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginTop: s(10),
  },
  waterAccessCardDark: {
    backgroundColor: '#1E1238',
    borderColor: '#372063',
  },
  waterAccessBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(6),
    alignSelf: 'flex-start',
    marginBottom: s(6),
  },
  waterAccessBadgeDark: {
    backgroundColor: '#372063',
  },
  waterAccessBadgeText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  waterAccessBadgeTextDark: {
    color: '#DDD6FE',
  },
  waterAccessValue: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#292238',
  },
  waterAccessValueDark: {
    color: '#F3F4F6',
  },

  /* Side-by-side Allowed Pets & Pet Amenities */
  sideBySideRow: {
    flexDirection: 'row',
    gap: s(10),
    marginTop: s(10),
  },
  allowedPetsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    padding: s(10),
    borderWidth: 1,
    borderColor: '#97C459',
  },
  allowedPetsCardDark: {
    backgroundColor: '#0D2214',
    borderColor: '#22C55E',
  },
  allowedPetsHeaderBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: s(7),
    paddingVertical: s(3),
    borderRadius: s(6),
    alignSelf: 'flex-start',
    marginBottom: s(8),
  },
  allowedPetsHeaderBadgeDark: {
    backgroundColor: '#14532D',
  },
  allowedPetsHeaderBadgeText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#15803D',
  },
  allowedPetsHeaderBadgeTextDark: {
    color: '#86EFAC',
  },
  chipsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
  },
  allowedPetPill: {
    backgroundColor: '#EEF9E8',
    borderRadius: s(999),
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderWidth: 1,
    borderColor: '#97C459',
  },
  allowedPetPillDark: {
    backgroundColor: '#052E16',
    borderColor: '#22C55E',
  },
  allowedPetPillText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#3B6D11',
  },
  allowedPetPillTextDark: {
    color: '#86EFAC',
  },

  petAmenitiesCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    padding: s(10),
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  petAmenitiesCardDark: {
    backgroundColor: '#0B1D3A',
    borderColor: '#3B82F6',
  },
  petAmenitiesHeaderBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: s(7),
    paddingVertical: s(3),
    borderRadius: s(6),
    alignSelf: 'flex-start',
    marginBottom: s(8),
  },
  petAmenitiesHeaderBadgeDark: {
    backgroundColor: '#2E1065',
  },
  petAmenitiesHeaderBadgeText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  petAmenitiesHeaderBadgeTextDark: {
    color: '#DDD6FE',
  },
  petAmenityPill: {
    backgroundColor: '#E6F1FB',
    borderRadius: s(999),
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  petAmenityPillDark: {
    backgroundColor: '#082F49',
    borderColor: '#38BDF8',
  },
  petAmenityPillText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#0C5499',
  },
  petAmenityPillTextDark: {
    color: '#7DD3FC',
  },

  /* Collapsible Details */
  detailsToggleRow: {
    paddingVertical: s(12),
    marginTop: s(6),
  },
  detailsToggleText: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#3B108F',
  },
  detailsToggleTextDark: {
    color: '#C4B5FD',
  },
  expandedDetailsContainer: {
    paddingTop: s(4),
    borderTopWidth: 1,
    borderTopColor: '#EDE8FC',
    marginTop: s(4),
  },
  expandedDetailsContainerDark: {
    borderTopColor: '#2D194B',
  },
  detailsSection: {
    marginTop: s(10),
  },
  detailsSectionTitle: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A1230',
    marginBottom: s(6),
  },
  detailsSectionTitleDark: {
    color: '#F3F4F6',
  },
  detailsSectionBody: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#292238',
    lineHeight: ms(19),
  },
  detailsSectionBodyDark: {
    color: '#D1D5DB',
  },
  feeRecordItem: {
    marginBottom: s(8),
  },
  detailsFieldLabel: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#5A5172',
    marginBottom: s(2),
  },
  detailsFieldLabelDark: {
    color: '#9CA3AF',
  },
  detailsFieldValue: {
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#292238',
  },
  detailsFieldValueDark: {
    color: '#E2E8F0',
  },

  /* Amenities */
  amenitiesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#F9FAFB',
    paddingHorizontal: s(10),
    paddingVertical: s(6.5),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amenityChipDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#260F45',
  },
  amenityChipText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#374151',
  },
  amenityChipTextDark: {
    color: '#E5E7EB',
  },

  /* Tags */
  tagsContainer: {
    marginHorizontal: s(16),
    marginBottom: s(12),
    padding: s(14),
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: s(18),
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  tagsContainerDark: {
    backgroundColor: 'rgba(23, 10, 46, 0.65)',
    borderColor: 'rgba(46, 22, 84, 0.6)',
  },
  tagsHeaderLabel: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: s(8),
  },
  tagsHeaderLabelDark: {
    color: '#9CA3AF',
  },
  tagsFlexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(6),
  },
  tagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderRadius: s(10),
  },
  tagPillDark: {
    backgroundColor: '#1E0E38',
  },
  tagPillText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#4B5563',
  },
  tagPillTextDark: {
    color: '#D1D5DB',
  },

  /* Part of road trip */
  featuredRouteCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: s(14),
    padding: s(12),
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: s(4),
  },
  featuredRouteCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#3B186E',
  },
  featuredRouteTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(6),
  },
  featuredRouteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#7C3AED',
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(10),
  },
  featuredRouteBadgeText: {
    fontSize: ms(8.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  featuredRouteDistText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  featuredRouteDistTextDark: {
    color: '#C4B5FD',
  },
  featuredRouteName: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    marginBottom: s(6),
  },
  featuredRouteNameDark: {
    color: '#FFFFFF',
  },
  featuredRouteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  featuredRouteAction: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  featuredRouteActionDark: {
    color: '#C4B5FD',
  },

  /* Nearby Section */
  nearbySection: {
    marginBottom: s(14),
  },
  sectionHeadingCount: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#6B7280',
  },
  nearbyScroll: {
    paddingHorizontal: s(16),
    gap: s(12),
  },
  nearbyCard: {
    width: s(180),
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    overflow: 'hidden',
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#EDE9FE',
    borderRightColor: '#EDE9FE',
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  nearbyCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#180B2E',
  },
  nearbyImageWrap: {
    width: '100%',
    height: s(105),
    backgroundColor: '#1F0B3D',
    position: 'relative',
  },
  nearbyImage: {
    width: '100%',
    height: '100%',
  },
  nearbyImageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyImageFallbackDark: {
    backgroundColor: '#31135E',
  },
  nearbyTierPill: {
    position: 'absolute',
    top: s(7),
    left: s(7),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    backgroundColor: 'rgba(15, 7, 29, 0.75)',
    paddingHorizontal: s(6.5),
    paddingVertical: s(3),
    borderRadius: s(10),
  },
  nearbyTierText: {
    fontSize: ms(8),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
  },
  nearbyBody: {
    padding: s(10),
  },
  nearbyCategoryText: {
    fontSize: ms(8.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
    marginBottom: s(2),
  },
  nearbyCategoryDark: {
    color: '#C4B5FD',
  },
  nearbyTitleText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    marginBottom: s(2),
  },
  nearbyTitleDark: {
    color: '#FFFFFF',
  },
  nearbyCityText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    marginBottom: s(4),
  },
  nearbyCityDark: {
    color: '#9CA3AF',
  },
  nearbyExcerptText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#4B5563',
    lineHeight: ms(13),
  },
  nearbyExcerptDark: {
    color: '#D1D5DB',
  },

  /* Empty Reviews */
  emptyReviewsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(12),
  },
  emptyReviewsIconCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(8),
  },
  emptyReviewsIconCircleDark: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  emptyReviewsTitle: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    marginBottom: s(3),
  },
  emptyReviewsTitleDark: {
    color: '#FFFFFF',
  },
  emptyReviewsSubtitle: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: s(20),
    marginBottom: s(12),
  },
  emptyReviewsSubtitleDark: {
    color: '#9CA3AF',
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#7C3AED',
    paddingHorizontal: s(16),
    paddingVertical: s(9),
    borderRadius: s(14),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  writeReviewBtnDark: {
    backgroundColor: '#6D28D9',
  },
  writeReviewBtnText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
  },

  /* Floating Bottom Bar */
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingTop: s(10),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingBottomBarDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#260F45',
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarPrice: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#059669',
  },
  bottomBarPriceDark: {
    color: '#34D399',
  },
  bottomBarStatus: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    marginTop: s(1),
  },
  bottomBarStatusDark: {
    color: '#9CA3AF',
  },
  bottomBarBtn: {
    borderRadius: s(14),
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(18),
    paddingVertical: s(11),
  },
  bottomBarBtnText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
  },

  /* Lightbox Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: s(20),
    zIndex: 20,
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFullImage: {
    width: SCREEN_WIDTH - s(20),
    height: SCREEN_WIDTH * 1.1,
    borderRadius: s(16),
  },
});
