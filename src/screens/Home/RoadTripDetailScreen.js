import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useRoadTripDetail } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Loader } from '../../components/common/Loader';

export const RoadTripDetailScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  // Slug passed from route params
  const slug = route?.params?.slug;

  // Fetch full route details by slug (Primary and direct source of truth)
  const {
    data: detailData,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
    isRefetching,
  } = useRoadTripDetail(slug);

  // Extract route object and stops array directly from detailData
  const routeObj = detailData?.route;
  const stops = useMemo(() => {
    return Array.isArray(detailData?.stops) ? detailData.stops : [];
  }, [detailData]);

  // Extract highway code (e.g. NH24, NH334, NH9) from H1 or fallback
  const highwayTag = useMemo(() => {
    const text = routeObj?.h1 || '';
    const match = text.match(/\((NH\d+[^)]*)\)/i) || text.match(/(NH\d+)/i);
    return match ? match[1] : 'NH9';
  }, [routeObj?.h1]);

  // Cleanly extract primary travel season so it stays on a single line without wrapping
  const primaryBestTime = useMemo(() => {
    const raw = routeObj?.best_time_to_travel || '';
    if (!raw) return '';
    const cleaned = raw.split(/[—–-]\s*avoid|,\s*avoid|\(\s*avoid/i)[0]?.trim();
    return cleaned || raw;
  }, [routeObj?.best_time_to_travel]);

  // Unified Journey Milestones for the horizontal track:
  // Guaranteed to include Origin (Delhi, 0 km), Highway Pit Stops (Udaipur, Surat), and Destination (Pune)
  const journeyMilestones = useMemo(() => {
    if (!routeObj) return [];
    const list = [];

    // 1. Origin Milestone (e.g. Delhi - 0 km)
    if (routeObj.origin_city) {
      list.push({
        id: 'milestone-origin',
        isOrigin: true,
        title: routeObj.origin_city,
        city: routeObj.origin_state ? `${routeObj.origin_state} • Departure` : 'Departure Point',
        distance: 0,
        badgeText: 'START',
        badgeGradient: ['#10B981', '#059669'],
        tagText: 'Trip Origin',
        venueName: routeObj.origin_city,
        locationName: routeObj.origin_city,
      });
    }

    // 2. Intermediate Verified Highway Pit Stops
    stops.forEach((item, idx) => {
      list.push({
        id: item.sequenceOrder || `stop-${idx}`,
        isStop: true,
        originalItem: item,
        title: item.listing?.name || `Pit Stop ${idx + 1}`,
        city: item.listing?.city || 'Verified Stop',
        distance: item.distanceFromOriginKm || 0,
        badgeText: idx < 9 ? `0${idx + 1}` : `${idx + 1}`,
        badgeGradient: ['#7C3AED', '#6D28D9'],
        tagText: 'Pet Friendly',
        venueName: item.listing?.name,
        locationName: item.listing?.city || routeObj.destination_city,
      });
    });

    // 3. Destination Milestone (e.g. Pune - Total km)
    if (routeObj.destination_city) {
      list.push({
        id: 'milestone-destination',
        isDestination: true,
        title: routeObj.destination_city,
        city: routeObj.destination_state
          ? `${routeObj.destination_state} • Arrival`
          : 'Final Destination',
        distance: routeObj.total_distance_km || 0,
        badgeText: 'END',
        badgeGradient: ['#F59E0B', '#D97706'],
        tagText: 'Destination',
        venueName: routeObj.destination_city,
        locationName: routeObj.destination_city,
      });
    }

    return list;
  }, [routeObj, stops]);

  // Animated traveling car along the highway track
  const carProgress = useRef(new Animated.Value(0)).current;
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(carProgress, {
          toValue: 1,
          duration: 3200,
          easing: Easing.bezier(0.35, 0.05, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(carProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [carProgress]);

  // Max travel distance for the car chip on the track
  const maxCarTravel = Math.max(0, lineWidth - s(42));

  // Parse markdown intro narrative sections (handles both routes with ## headings like Bhimtal and single narratives like Jim Corbett)
  const guideSections = useMemo(() => {
    const raw = routeObj?.intro_markdown?.trim();
    if (!raw) return [];

    // Check if the text contains markdown headings (e.g. ## Heading or # Heading)
    const hasHeadings = /^#{1,3}\s+/m.test(raw);

    if (!hasHeadings) {
      // No headings present (like Delhi to Jim Corbett):
      // Set section title to 'The Route' and put the entire text as body so it renders in regular body weight
      return [
        {
          title: 'The Route',
          body: raw,
        },
      ];
    }

    // When markdown headings exist (like Delhi to Bhimtal)
    const sections = [];
    const lines = raw.split('\n');
    let currentTitle = 'The Route';
    let currentBodyLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^#{1,3}\s+(.+)$/);

      if (headingMatch) {
        const body = currentBodyLines.join('\n').trim();
        if (body || (currentTitle && currentTitle !== 'The Route')) {
          sections.push({ title: currentTitle, body });
        }
        currentTitle = headingMatch[1].trim();
        currentBodyLines = [];
      } else {
        currentBodyLines.push(line);
      }
    }

    const finalBody = currentBodyLines.join('\n').trim();
    if (currentTitle || finalBody) {
      sections.push({
        title: currentTitle || 'The Route',
        body: finalBody,
      });
    }

    return sections.filter(sec => sec.title || sec.body);
  }, [routeObj?.intro_markdown]);

  // Parse FAQ markdown into question and answer pairs
  const parsedFaqs = useMemo(() => {
    const raw = routeObj?.faq_markdown;
    if (!raw) return [];

    const regex = /\*\*(.*?)\*\*\n([\s\S]*?)(?=(?:\*\*|$))/g;
    const faqs = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim().replace(/\[(.*?)\]\(.*?\)/g, '$1'), // Strip raw markdown link wrappers
      });
    }
    return faqs;
  }, [routeObj?.faq_markdown]);



  // Handle Stop click - Navigate to RoadTripStopDetailScreen for listing items!
  const handleOpenStopDetail = useCallback(
    stopItem => {
      if (!stopItem || !stopItem.listing) {
        return;
      }
      navigation.navigate('RoadTripStopDetailScreen', {
        slug: stopItem.listing.slug,
        // stopId: stopItem.listing.id,
        // stopItem: stopItem,
        // listing: stopItem.listing,
        // routeInfo: {
        //   originCity: routeObj?.origin_city,
        //   destinationCity: routeObj?.destination_city,
        //   highwayTag: highwayTag,
        //   totalDistanceKm: routeObj?.total_distance_km,
        // },
      });
    },
    [navigation],
  );

  // Helper to render text with **bold** formatting inline
  const renderFormattedParagraphs = useCallback((bodyText, isDark) => {
    if (!bodyText) return null;
    const paragraphs = bodyText.split('\n\n').filter(Boolean);

    return paragraphs.map((para, pIdx) => {
      const parts = para.split(/(\*\*.*?\*\*)/g);
      return (
        <Text key={pIdx} style={[styles.narrativeBodyText, isDark && styles.narrativeBodyTextDark]}>
          {parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Text
                  key={idx}
                  style={[
                    styles.narrativeBodyTextBold,
                    isDark && styles.narrativeBodyTextBoldDark,
                  ]}>
                  {part.slice(2, -2)}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    });
  }, []);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />

      {/* ── App Signature Ambient Decorative Glows & Watermarks ── */}
      <View
        style={[styles.ambientGlowTopRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowTopLeft, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientGlowMidRight, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none"
      />
      <View
        style={[styles.ambientPawWatermarkTop, isDarkMode && styles.ambientGlowDark]}
        pointerEvents="none">
        <Ionicons
          name="paw"
          size={s(110)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.04)' : 'rgba(124, 58, 237, 0.04)'}
        />
      </View>

      {/* ── Top Header Navigation Bar (Matches App & Home Screen Design Pattern) ── */}
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
          <Feather name="arrow-left" size={ms(19)} color={isDarkMode ? '#F3E8FF' : '#1F0F3D'} />
        </BouncyPressable>

        <View style={styles.headerCenterWrap}>
          <Text style={[styles.headerOverline, isDarkMode && styles.headerOverlineDark]}>
            PET-FRIENDLY ROAD TRIPS
          </Text>
          <Text
            style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
            numberOfLines={1}>
            {routeObj
              ? `${routeObj.origin_city} to ${routeObj.destination_city}`
              : 'Road Trip Guide'}
          </Text>
        </View>

        {/* Invisible right spacer to maintain perfect symmetrical center alignment */}
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Premium Custom Animated PetFriendly Loader */}
      {isDetailLoading && !detailData ? (
        <Loader
          fullScreen
          title="Loading road trip guide..."
          subtitle="Fetching verified pet stops & highway details..."
        />
      ) : !routeObj ? (
        <View style={styles.centerLoadingWrap}>
          <Ionicons name="alert-circle-outline" size={ms(44)} color="#EF4444" />
          <Text style={[styles.centerErrorTitle, isDarkMode && styles.centerErrorTitleDark]}>
            Route Not Found
          </Text>
          <Text style={[styles.centerLoadingText, isDarkMode && styles.centerLoadingTextDark]}>
            We could not load details for this road trip.
          </Text>
          <BouncyPressable style={styles.retryBtn} activeScale={0.92} onPress={refetchDetail}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </BouncyPressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, s(24)) + s(30) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetchDetail}
              tintColor="#7B2CFF"
              colors={['#7B2CFF', '#EE2A7B']}
            />
          }>
          {/* ── 1. Top Pet Friendly Overline Pill (Home & App Design System) ── */}
          <View style={styles.topPillRow}>
            <LinearGradient
              colors={['#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroOverlinePill}>
              <Ionicons name="paw" size={ms(10)} color="#FFFFFF" />
              <Text style={styles.heroOverlinePillText}>TAILS VERIFIED ROUTE</Text>
            </LinearGradient>

            <View style={[styles.testedBadge, isDarkMode && styles.testedBadgeDark]}>
              <Ionicons name="shield-checkmark" size={ms(11)} color="#10B981" />
              <Text style={[styles.testedBadgeText, isDarkMode && styles.testedBadgeTextDark]}>
                Pet Tested
              </Text>
            </View>
          </View>

          {/* ── 2. Route Main Title ── */}
          <Text style={[styles.routeMainH1, isDarkMode && styles.routeMainH1Dark]}>
            {routeObj.h1 ||
              `${routeObj.origin_city} to ${routeObj.destination_city}: Pet-Friendly Road Trip Guide (${highwayTag})`}
          </Text>

          {/* ── 3. Specs Glass Chips Bar (Always on the exact same line) ── */}
          <View style={styles.specsChipsRow}>
            <View style={[styles.specChip, isDarkMode && styles.specChipDark]}>
              <Feather name="map-pin" size={ms(11)} color={isDarkMode ? '#C4B5FD' : '#7C3AED'} />
              <Text
                style={[styles.specChipText, isDarkMode && styles.specChipTextDark]}
                numberOfLines={1}>
                <Text style={[styles.specChipBold, isDarkMode && styles.specChipBoldDark]}>
                  {routeObj.total_distance_km} km
                </Text>
                {'  '}
                total
              </Text>
            </View>

            <View style={[styles.specChip, isDarkMode && styles.specChipDark]}>
              <Feather name="clock" size={ms(11)} color={isDarkMode ? '#93C5FD' : '#2563EB'} />
              <Text
                style={[styles.specChipText, isDarkMode && styles.specChipTextDark]}
                numberOfLines={1}>
                <Text style={[styles.specChipBold, isDarkMode && styles.specChipBoldDark]}>
                  {routeObj.est_drive_hours} hrs
                </Text>{' '}
                drive
              </Text>
            </View>

            <View style={[styles.specChip, isDarkMode && styles.specChipDark]}>
              <Ionicons
                name="paw-outline"
                size={ms(12)}
                color={isDarkMode ? '#6EE7B7' : '#059669'}
              />
              <Text
                style={[styles.specChipText, isDarkMode && styles.specChipTextDark]}
                numberOfLines={1}>
                <Text style={[styles.specChipBold, isDarkMode && styles.specChipBoldDark]}>
                  {stops.length || routeObj.stop_count || 0}
                </Text>{' '}
                stops
              </Text>
            </View>
          </View>

          {/* ── Best Time to Travel Card (Single Line) ── */}
          {primaryBestTime ? (
            <View style={[styles.bestTimeCard, isDarkMode && styles.bestTimeCardDark]}>
              <Ionicons name="sunny-outline" size={ms(13)} color="#D97706" />
              <Text
                style={[styles.bestTimeLabel, isDarkMode && styles.bestTimeLabelDark]}
                numberOfLines={1}
                ellipsizeMode="tail">
                Best time to travel:{' '}
                <Text style={[styles.bestTimeValue, isDarkMode && styles.bestTimeValueDark]}>
                  {primaryBestTime}
                </Text>
              </Text>
            </View>
          ) : null}

          {/* ── 4. Brand New Modern Scenic Highway Journey Card ── */}
          <View style={[styles.journeyCard, isDarkMode && styles.journeyCardDark]}>
            {/* Ambient Background Gradient */}
            <LinearGradient
              colors={
                isDarkMode ? ['#1C0E35', '#16092B', '#100520'] : ['#FFFFFF', '#F9F7FE', '#F3EEFF']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Top Card Bar: Highway Shield & Drive Metrics */}
            <View style={styles.journeyTopBar}>
              <View style={styles.highwayTagPill}>
                <Ionicons name="shield-checkmark" size={ms(12)} color="#F59E0B" />
                <Text style={styles.highwayTagText}>{highwayTag} EXPRESSWAY</Text>
              </View>

              <View style={[styles.journeyStatsPill, isDarkMode && styles.journeyStatsPillDark]}>
                <Feather name="clock" size={ms(11)} color={isDarkMode ? '#C084FC' : '#7C3AED'} />
                <Text style={[styles.journeyStatsText, isDarkMode && styles.journeyStatsTextDark]}>
                  {routeObj.est_drive_hours}h • {routeObj.total_distance_km} km
                </Text>
              </View>
            </View>

            {/* Highway Animated Progression Track */}
            <View style={styles.highwayTrackContainer}>
              {/* Origin Pill (Delhi) */}
              <View style={[styles.originPill, isDarkMode && styles.originPillDark]}>
                <View style={styles.originPulseDot} />
                <Text style={styles.originPillText} numberOfLines={1}>
                  {routeObj.origin_city}
                </Text>
              </View>

              {/* 3D Tubular Highway Strip */}
              <View
                style={styles.highwayRoadRibbon}
                onLayout={e => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0 && Math.abs(w - lineWidth) > 2) {
                    setLineWidth(w);
                  }
                }}>
                <LinearGradient
                  colors={['#4F46E5', '#7C3AED', '#6D28D9', '#4338CA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* 3D Top Edge Glossy Highlight */}
                <View style={styles.roadTopHighlight} pointerEvents="none" />

                {/* Dashed Center Lane Marks */}
                <View style={styles.roadDashedLaneRow} pointerEvents="none">
                  <View style={styles.roadDashMark} />
                  <View style={styles.roadDashMark} />
                  <View style={styles.roadDashMark} />
                  <View style={styles.roadDashMark} />
                  <View style={styles.roadDashMark} />
                  <View style={styles.roadDashMark} />
                </View>

                {/* Animated Moving Pet Car with Dog emoji */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.animatedCarWrapper,
                    {
                      transform: [
                        {
                          translateX: carProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, maxCarTravel],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <View style={styles.carChipBadge}>
                    <Ionicons name="car-sport" size={ms(12)} color="#FFFFFF" />
                  </View>
                </Animated.View>
              </View>

              {/* Destination Pill (Jim Corbett) */}
              <View style={styles.destPill}>
                <Ionicons name="flag" size={ms(11)} color="#FFFFFF" />
                <Text style={styles.destPillText} numberOfLines={1}>
                  {routeObj.destination_city}
                </Text>
              </View>
            </View>

            {/* ── PLANNED PIT STOPS & ROUTE: Horizontal Scrollable Track (Never Squished) ── */}
            <View style={styles.milestonesHeaderRow}>
              <View style={styles.milestonesLabelGroup}>
                <Text
                  style={[
                    styles.milestonesSectionLabel,
                    isDarkMode && styles.milestonesSectionLabelDark,
                  ]}>
                  PLANNED PIT STOPS & ROUTE
                </Text>
                <Text
                  style={[
                    styles.milestonesSwipeHint,
                    isDarkMode && styles.milestonesSwipeHintDark,
                  ]}>
                  Scroll horizontally to view stops →
                </Text>
              </View>
              <View style={[styles.stopsCountBadge, isDarkMode && styles.stopsCountBadgeDark]}>
                <Text
                  style={[
                    styles.stopsCountBadgeText,
                    isDarkMode && styles.stopsCountBadgeTextDark,
                  ]}>
                  {stops.length} STOPS
                </Text>
              </View>
            </View>

            {/* Scrollable Milestone Cards Track (3D Tactile Design) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.milestonesScrollContainer}>
              {journeyMilestones.map((item, idx) => {
                const dist = item.distance;
                const venueName = item.title;
                const venueCity = item.city;

                return (
                  <BouncyPressable
                    key={item.id || idx}
                    style={[styles.milestoneCard, isDarkMode && styles.milestoneCardDark]}
                    activeScale={item.isStop && item.originalItem ? 0.95 : 1}
                    onPress={() => {
                      if (item.isStop && item.originalItem) {
                        handleOpenStopDetail(item.originalItem);
                      }
                    }}>
                    {/* Top Row: Sequence Badge & Distance */}
                    <View style={styles.milestoneTopHeader}>
                      <LinearGradient
                        colors={item.badgeGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.milestoneStepBadge}>
                        <Text style={styles.milestoneStepNum}>{item.badgeText}</Text>
                      </LinearGradient>

                      <View
                        style={[
                          styles.milestoneDistChip,
                          isDarkMode && styles.milestoneDistChipDark,
                        ]}>
                        <Ionicons
                          name={
                            item.isOrigin
                              ? 'flag-outline'
                              : item.isDestination
                              ? 'location-outline'
                              : 'speedometer-outline'
                          }
                          size={ms(10)}
                          color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                        />
                        <Text
                          style={[
                            styles.milestoneDistText,
                            isDarkMode && styles.milestoneDistTextDark,
                          ]}>
                          {dist} km
                        </Text>
                      </View>
                    </View>

                    {/* Venue Full Name (Comfortable 2 Lines, Never Squished) */}
                    <Text
                      style={[styles.milestoneTitle, isDarkMode && styles.milestoneTitleDark]}
                      numberOfLines={2}>
                      {venueName}
                    </Text>

                    {/* City Location Subtitle */}
                    <View style={styles.milestoneLocationRow}>
                      <Ionicons
                        name="location-sharp"
                        size={ms(10)}
                        color={isDarkMode ? '#C084FC' : '#8B5CF6'}
                      />
                      <Text
                        style={[styles.milestoneCity, isDarkMode && styles.milestoneCityDark]}
                        numberOfLines={1}>
                        {venueCity}
                      </Text>
                    </View>

                    {/* Bottom Tag / Amenity */}
                    <View
                      style={[
                        styles.milestoneBottomTagRow,
                        isDarkMode && styles.milestoneBottomTagRowDark,
                      ]}>
                      <View style={styles.milestonePetChip}>
                        <Ionicons
                          name={item.isOrigin ? 'navigate' : item.isDestination ? 'flag' : 'paw'}
                          size={ms(9)}
                          color={
                            isDarkMode
                              ? item.isOrigin
                                ? '#34D399'
                                : item.isDestination
                                ? '#FCD34D'
                                : '#34D399'
                              : item.isOrigin
                              ? '#059669'
                              : item.isDestination
                              ? '#D97706'
                              : '#059669'
                          }
                        />
                        <Text
                          style={[
                            styles.milestonePetChipText,
                            isDarkMode && styles.milestonePetChipTextDark,
                            item.isDestination && styles.milestoneDestChipText,
                            item.isDestination && isDarkMode && styles.milestoneDestChipTextDark,
                          ]}>
                          {item.tagText}
                        </Text>
                      </View>
                      {item.isStop ? (
                        <Feather
                          name="arrow-up-right"
                          size={ms(13)}
                          color={isDarkMode ? '#A78BFA' : '#7C3AED'}
                        />
                      ) : null}
                    </View>
                  </BouncyPressable>
                );
              })}
            </ScrollView>

            {/* Bottom Travel Badges */}
            <View style={[styles.cardBadgesRow, isDarkMode && styles.cardBadgesRowDark]}>
              <View style={[styles.featurePill, isDarkMode && styles.featurePillDark]}>
                <Ionicons name="paw" size={ms(11)} color={isDarkMode ? '#C4B5FD' : '#7C3AED'} />
                <Text style={[styles.featurePillText, isDarkMode && styles.featurePillTextDark]}>
                  Pet Verified Stops
                </Text>
              </View>
              <View style={[styles.featurePill, isDarkMode && styles.featurePillDark]}>
                <Ionicons name="water" size={ms(11)} color={isDarkMode ? '#6EE7B7' : '#059669'} />
                <Text style={[styles.featurePillText, isDarkMode && styles.featurePillTextDark]}>
                  Stretch & Water Breaks
                </Text>
              </View>
              <View style={[styles.featurePill, isDarkMode && styles.featurePillDark]}>
                <Ionicons name="car" size={ms(11)} color={isDarkMode ? '#FCD34D' : '#D97706'} />
                <Text style={[styles.featurePillText, isDarkMode && styles.featurePillTextDark]}>
                  FASTag Route
                </Text>
              </View>
            </View>
          </View>

          {/* ── 5. Narrative Content from intro_markdown (3D Tactile Cards) ── */}
          <View style={styles.narrativeSectionWrap}>
            {guideSections.map((section, sIdx) => (
              <View
                key={sIdx}
                style={[styles.narrativeCard, isDarkMode && styles.narrativeCardDark]}>
                <View style={styles.narrativeHeaderRow}>
                  <View style={styles.narrativeIconBadge}>
                    <Feather
                      name={sIdx === 0 ? 'compass' : 'shield'}
                      size={ms(14)}
                      color="#7C3AED"
                    />
                  </View>
                  <Text
                    style={[
                      styles.narrativeSectionHeading,
                      isDarkMode && styles.narrativeSectionHeadingDark,
                    ]}>
                    {section.title}
                  </Text>
                </View>

                {renderFormattedParagraphs(section.body, isDarkMode)}
              </View>
            ))}
          </View>

          {/* ── 6. "Stops along the way" Itinerary Timeline Section ── */}
          <View style={styles.stopsTimelineSection}>
            <View style={styles.timelineSectionHeader}>
              <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                DETAILED ITINERARY
              </Text>
              <Text
                style={[
                  styles.stopsTimelineSectionTitle,
                  isDarkMode && styles.stopsTimelineSectionTitleDark,
                ]}>
                Stops along the way
              </Text>
            </View>

            <View style={styles.timelineContainer}>
              {/* Continuous Purple Timeline Vertical Rail */}
              <View
                style={[styles.timelineVerticalRail, isDarkMode && styles.timelineVerticalRailDark]}
              />

              {/* Start Departure Node for Origin (Delhi) */}
              <View style={styles.timelineRow}>
                <View style={styles.timelineNodeCol}>
                  <View
                    style={[
                      styles.timelineCircleNode,
                      styles.timelineStartNode,
                      isDarkMode && styles.timelineStartNodeDark,
                    ]}>
                    <Ionicons name="flag" size={ms(11)} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.timelineCardCol}>
                  <Text
                    style={[
                      styles.timelineDistTag,
                      styles.timelineStartDistTag,
                      isDarkMode && styles.timelineStartDistTagDark,
                    ]}>
                    START • 0 KM • DEPARTURE
                  </Text>

                  <View
                    style={[
                      styles.stopDetailCard,
                      styles.departureCardSpecial,
                      isDarkMode && styles.stopDetailCardDark,
                      isDarkMode && styles.departureCardSpecialDark,
                    ]}>
                    <View style={styles.stopTitleRow}>
                      <Text style={[styles.stopCardName, isDarkMode && styles.stopCardNameDark]}>
                        Departing from {routeObj.origin_city}
                      </Text>
                      <Ionicons
                        name="sparkles"
                        size={ms(14)}
                        color="#10B981"
                        style={styles.stopSparkleIcon}
                      />
                    </View>

                    <View style={styles.stopLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={ms(13)}
                        color={isDarkMode ? '#A7F3D0' : '#059669'}
                      />
                      <Text
                        style={[
                          styles.stopSubtitleText,
                          isDarkMode && styles.stopSubtitleTextDark,
                        ]}>
                        {[routeObj.origin_state, `Route begins via ${highwayTag}`]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {stops.map((stopItem, index) => {
                const listing = stopItem.listing || {};
                const distKm = stopItem.distanceFromOriginKm || 0;

                return (
                  <View key={stopItem.sequenceOrder || index} style={styles.timelineRow}>
                    {/* Numbered Circle Node on the rail */}
                    <View style={styles.timelineNodeCol}>
                      <View
                        style={[
                          styles.timelineCircleNode,
                          isDarkMode && styles.timelineCircleNodeDark,
                        ]}>
                        <Text
                          style={[
                            styles.timelineCircleNum,
                            isDarkMode && styles.timelineCircleNumDark,
                          ]}>
                          {stopItem.sequenceOrder || index + 1}
                        </Text>
                      </View>
                    </View>

                    {/* Stop Detail Content Card (Tactile 3D Card) */}
                    <View style={styles.timelineCardCol}>
                      {/* Distance Header Tag */}
                      <Text
                        style={[styles.timelineDistTag, isDarkMode && styles.timelineDistTagDark]}>
                        {distKm} KM FROM {routeObj.origin_city.toUpperCase()}
                      </Text>

                      <View
                        style={[styles.stopDetailCard, isDarkMode && styles.stopDetailCardDark]}>
                        {/* Stop Name with sparkle glyph */}
                        <View style={styles.stopTitleRow}>
                          <Text
                            style={[styles.stopCardName, isDarkMode && styles.stopCardNameDark]}>
                            {listing.name || `Stop #${index + 1}`}
                          </Text>
                          <Ionicons
                            name="sparkles"
                            size={ms(14)}
                            color="#7C3AED"
                            style={styles.stopSparkleIcon}
                          />
                        </View>

                        {/* Location Subtitle */}
                        <View style={styles.stopLocationRow}>
                          <Ionicons name="location-outline" size={ms(13)} color="#6B7280" />
                          <Text
                            style={[
                              styles.stopSubtitleText,
                              isDarkMode && styles.stopSubtitleTextDark,
                            ]}>
                            {[listing.city, listing.state, `via ${highwayTag}`]
                              .filter(Boolean)
                              .join(' • ')}
                          </Text>
                        </View>

                        {/* Stop Note in Highlighted Soft Callout Container */}
                        {stopItem.stopNote ? (
                          <View
                            style={[
                              styles.stopNoteCallout,
                              isDarkMode && styles.stopNoteCalloutDark,
                            ]}>
                            <Ionicons
                              name="paw"
                              size={ms(12)}
                              color="#7C3AED"
                              style={styles.stopNotePawIcon}
                            />
                            <Text
                              style={[styles.stopNoteText, isDarkMode && styles.stopNoteTextDark]}>
                              {stopItem.stopNote}
                            </Text>
                          </View>
                        ) : null}

                        {/* See full details button */}
                        <BouncyPressable
                          style={[
                            styles.seeFullDetailsBtn,
                            isDarkMode && styles.seeFullDetailsBtnDark,
                          ]}
                          activeScale={0.94}
                          onPress={() => handleOpenStopDetail(stopItem)}>
                          <Text
                            style={[
                              styles.seeFullDetailsText,
                              isDarkMode && styles.seeFullDetailsTextDark,
                            ]}>
                            View Stop Details
                          </Text>
                          <Feather
                            name="arrow-up-right"
                            size={ms(13)}
                            color={isDarkMode ? '#C084FC' : '#7C3AED'}
                          />
                        </BouncyPressable>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* End Arrival Node */}
              <View style={styles.arrivalNodeRow}>
                <View style={styles.timelineNodeCol}>
                  <View style={styles.arrivalPinCircle}>
                    <Ionicons name="location-sharp" size={ms(14)} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.arrivalTextCol}>
                  <Text style={[styles.arrivalOverline, isDarkMode && styles.arrivalOverlineDark]}>
                    YOU'VE ARRIVED AT YOUR DESTINATION
                  </Text>
                  <BouncyPressable
                    activeScale={1}
                    // onPress={handleOpenDestination}
                  >
                    <View style={[styles.arrivalCard, isDarkMode && styles.arrivalCardDark]}>
                      <View style={styles.arrivalCardLeft}>
                        <Text
                          style={[
                            styles.arrivalMainTitle,
                            isDarkMode && styles.arrivalMainTitleDark,
                          ]}>
                          Welcome to {routeObj.destination_city}
                        </Text>
                        <Text
                          style={[styles.arrivalSubText, isDarkMode && styles.arrivalSubTextDark]}>
                          Tap to view destination details
                        </Text>
                      </View>
                      <View style={styles.arrivalArrowBtn}>
                        <Feather name="arrow-right" size={ms(16)} color="#FFFFFF" />
                      </View>
                    </View>
                  </BouncyPressable>
                </View>
              </View>
            </View>
          </View>

          {/* ── 7. "Frequently asked" Section ── */}
          {parsedFaqs.length > 0 && (
            <View style={styles.faqSection}>
              <View style={styles.timelineSectionHeader}>
                <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>
                  HELP & ADVICE
                </Text>
                <Text style={[styles.faqSectionTitle, isDarkMode && styles.faqSectionTitleDark]}>
                  Frequently asked
                </Text>
              </View>

              {parsedFaqs.map((faq, fIdx) => (
                <View key={fIdx} style={[styles.faqCard, isDarkMode && styles.faqCardDark]}>
                  <View style={styles.faqQuestionRow}>
                    <View style={[styles.faqQBadge, isDarkMode && styles.faqQBadgeDark]}>
                      <Text style={[styles.faqQBadgeText, isDarkMode && styles.faqQBadgeTextDark]}>
                        Q
                      </Text>
                    </View>
                    <Text
                      style={[styles.faqQuestionTitle, isDarkMode && styles.faqQuestionTitleDark]}>
                      {faq.question}
                    </Text>
                  </View>
                  <Text style={[styles.faqAnswerText, isDarkMode && styles.faqAnswerTextDark]}>
                    {faq.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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

  /* ── Whole Screen Background Ambient Decorative Glows & Watermarks ── */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -s(30),
    right: -s(50),
    width: s(260),
    height: s(260),
    borderRadius: s(130),
    backgroundColor: 'rgba(233, 213, 255, 0.45)',
  },
  ambientGlowTopLeft: {
    position: 'absolute',
    top: s(80),
    left: -s(80),
    width: s(240),
    height: s(240),
    borderRadius: s(120),
    backgroundColor: 'rgba(254, 240, 215, 0.40)',
  },
  ambientGlowMidRight: {
    position: 'absolute',
    top: s(540),
    right: -s(80),
    width: s(280),
    height: s(280),
    borderRadius: s(140),
    backgroundColor: 'rgba(252, 231, 243, 0.40)',
  },
  ambientGlowDark: {
    opacity: 0.2,
  },
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: s(140),
    right: -s(25),
    transform: [{ rotate: '-25deg' }],
  },

  // Header Bar (Matches App & Home Screen Design Pattern)
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingBottom: s(10),
    zIndex: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  headerBarDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerCircleBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCircleBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomColor: '#3B1578',
    shadowOpacity: 0.25,
  },
  headerCenterWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(8),
  },
  headerOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerOverlineDark: {
    color: '#C084FC',
  },
  headerTitle: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1F0F3D',
    marginTop: vs(1),
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerRightSpacer: {
    width: s(38),
    height: s(38),
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: s(12),
  },

  // Top Pill Row
  topPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: s(10),
  },
  heroOverlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(10),
    paddingVertical: s(4),
    borderRadius: s(12),
  },
  heroOverlinePillText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  testedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#ECFDF5',
    paddingHorizontal: s(8),
    paddingVertical: s(3.5),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  testedBadgeDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testedBadgeText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },
  testedBadgeTextDark: {
    color: '#34D399',
  },

  // H1 Main Title
  routeMainH1: {
    fontSize: ms(21),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    lineHeight: ms(28),
    letterSpacing: -0.4,
    marginBottom: s(12),
  },
  routeMainH1Dark: {
    color: '#FFFFFF',
  },

  // Specs Chips Row (Always strictly in a single line)
  specsChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: s(6),
    marginBottom: s(10),
  },
  specChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(4),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: s(4),
    paddingVertical: s(6.5),
    borderRadius: s(12),
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  specChipDark: {
    backgroundColor: '#200F3D',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    borderBottomColor: '#36126D',
    borderColor: 'rgba(167, 139, 250, 0.22)',
  },
  specChipText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#4B5563',
  },
  specChipTextDark: {
    color: '#CBD5E1',
  },
  specChipBold: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111827',
  },
  specChipBoldDark: {
    color: '#FFFFFF',
  },

  // Best Time Card (Always strictly in a single line)
  bestTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: s(6.5),
    marginBottom: s(16),
  },
  bestTimeCardDark: {
    backgroundColor: 'rgba(217, 119, 6, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bestTimeLabel: {
    flex: 1,
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#92400E',
  },
  bestTimeLabelDark: {
    color: '#FCD34D',
  },
  bestTimeValue: {
    fontFamily: theme.typography.fontFamily.medium,
    color: '#B45309',
  },
  bestTimeValueDark: {
    color: '#FDE68A',
  },

  // ── Brand New Scenic Journey Card ──
  journeyCard: {
    borderRadius: ms(24),
    overflow: 'hidden',
    padding: s(16),
    marginBottom: s(24),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  journeyCardDark: {
    backgroundColor: '#1C0E36',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: '#260B4E',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowOpacity: 0.25,
  },

  journeyTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(14),
  },
  highwayTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#1E1035',
    paddingHorizontal: s(10),
    paddingVertical: s(4.5),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  highwayTagText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  journeyStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: s(9),
    paddingVertical: s(4),
    borderRadius: s(10),
  },
  journeyStatsPillDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  journeyStatsText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  journeyStatsTextDark: {
    color: '#C084FC',
  },

  // Highway Track
  highwayTrackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(16),
  },
  originPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#1E1035',
    paddingHorizontal: s(10),
    paddingVertical: s(6.5),
    borderRadius: s(14),
    zIndex: 5,
  },
  originPillDark: {
    backgroundColor: '#261347',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  originPulseDot: {
    width: s(7),
    height: s(7),
    borderRadius: s(3.5),
    backgroundColor: '#10B981',
  },
  originPillText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  highwayRoadRibbon: {
    flex: 1,
    height: s(24),
    borderRadius: s(12),
    marginHorizontal: s(6),
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 2.5,
    borderBottomColor: '#3730A3',
  },
  roadTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: s(4),
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  roadDashedLaneRow: {
    position: 'absolute',
    left: s(6),
    right: s(6),
    height: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roadDashMark: {
    width: s(10),
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 1,
  },
  animatedCarWrapper: {
    position: 'absolute',
    left: s(2),
  },
  carChipBadge: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  destPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#F59E0B',
    paddingHorizontal: s(10),
    paddingVertical: s(6.5),
    borderRadius: s(14),
    zIndex: 5,
  },
  destPillText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },

  // Milestones Header Row
  milestonesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(10),
    paddingTop: s(4),
  },
  milestonesLabelGroup: {
    flex: 1,
  },
  milestonesSectionLabel: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#6D28D9',
    letterSpacing: 0.6,
  },
  milestonesSectionLabelDark: {
    color: '#A78BFA',
  },
  milestonesSwipeHint: {
    fontSize: ms(8.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#9CA3AF',
    marginTop: s(1),
  },
  milestonesSwipeHintDark: {
    color: '#6B7280',
  },
  stopsCountBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: s(8),
    paddingVertical: s(2.5),
    borderRadius: s(8),
  },
  stopsCountBadgeDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  stopsCountBadgeText: {
    fontSize: ms(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  stopsCountBadgeTextDark: {
    color: '#DDD6FE',
  },

  // Milestones Scrollable Track
  milestonesScrollContainer: {
    paddingLeft: s(4),
    paddingRight: s(12),
    paddingBottom: s(10),
    gap: s(10),
  },
  milestoneCard: {
    width: s(165),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(12),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  milestoneCardDark: {
    backgroundColor: '#261347',
    borderTopColor: 'rgba(255, 255, 255, 0.20)',
    borderBottomColor: '#120524',
    borderBottomWidth: 3.5,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.28)',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    elevation: 4,
  },
  milestoneTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(8),
  },
  milestoneStepBadge: {
    paddingHorizontal: s(6),
    paddingVertical: s(2),
    borderRadius: s(6),
  },
  milestoneStepNum: {
    fontSize: ms(9),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
  },
  milestoneDistChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    paddingHorizontal: s(6),
    paddingVertical: s(2),
    borderRadius: s(6),
  },
  milestoneDistChipDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.32)',
  },
  milestoneDistText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  milestoneDistTextDark: {
    color: '#DDD6FE',
  },
  milestoneTitle: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
    lineHeight: ms(16),
    marginBottom: s(4),
    minHeight: ms(32),
  },
  milestoneTitleDark: {
    color: '#FFFFFF',
  },
  milestoneLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    marginBottom: s(8),
  },
  milestoneCity: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    flex: 1,
  },
  milestoneCityDark: {
    color: '#C4B5FD',
  },
  milestoneBottomTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: s(6),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  milestoneBottomTagRowDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  milestonePetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  milestonePetChipText: {
    fontSize: ms(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#059669',
  },
  milestonePetChipTextDark: {
    color: '#34D399',
  },
  milestoneDestChipText: {
    color: '#D97706',
  },
  milestoneDestChipTextDark: {
    color: '#FCD34D',
  },

  // Bottom Travel Feature Badges
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: s(6),
    paddingTop: s(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(221, 214, 254, 0.4)',
  },
  cardBadgesRowDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(10),
  },
  featurePillDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  featurePillText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#5B21B6',
  },
  featurePillTextDark: {
    color: '#EDE9FE',
  },

  // Narrative Content Sections (3D Tactile Cards)
  narrativeSectionWrap: {
    marginBottom: s(24),
    gap: s(14),
  },
  narrativeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(20),
    padding: s(16),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  narrativeCardDark: {
    backgroundColor: '#1A0E32',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: '#2B0E52',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  narrativeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: s(10),
  },
  narrativeIconBadge: {
    width: s(30),
    height: s(30),
    borderRadius: s(10),
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  narrativeSectionHeading: {
    flex: 1,
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
    letterSpacing: -0.2,
  },
  narrativeSectionHeadingDark: {
    color: '#FFFFFF',
  },
  narrativeBodyText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: ms(19),
    marginBottom: s(8),
  },
  narrativeBodyTextDark: {
    color: '#D1D5DB',
  },
  narrativeBodyTextBold: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111827',
  },
  narrativeBodyTextBoldDark: {
    color: '#FFFFFF',
  },

  // "Stops along the way" Section
  stopsTimelineSection: {
    marginBottom: s(28),
  },
  timelineSectionHeader: {
    marginBottom: s(14),
  },
  sectionOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: s(2),
  },
  sectionOverlineDark: {
    color: '#C084FC',
  },
  stopsTimelineSectionTitle: {
    fontSize: ms(18),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#111827',
  },
  stopsTimelineSectionTitleDark: {
    color: '#FFFFFF',
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: s(4),
  },
  timelineVerticalRail: {
    position: 'absolute',
    top: s(16),
    bottom: s(40),
    left: s(16),
    width: 2,
    backgroundColor: '#7C3AED',
  },
  timelineVerticalRailDark: {
    backgroundColor: '#8B5CF6',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: s(16),
  },
  timelineNodeCol: {
    width: s(28),
    alignItems: 'center',
    marginRight: s(12),
  },
  timelineCircleNode: {
    width: s(26),
    height: s(26),
    borderRadius: s(13),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(10),
    elevation: 2,
  },
  timelineCircleNodeDark: {
    backgroundColor: '#190B33',
    borderColor: '#A855F7',
  },
  timelineCircleNum: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
  },
  timelineCircleNumDark: {
    color: '#C084FC',
  },
  timelineStartNode: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  timelineStartNodeDark: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
  },
  timelineStartDistTag: {
    color: '#059669',
  },
  timelineStartDistTagDark: {
    color: '#34D399',
  },
  departureCardSpecial: {
    borderTopColor: '#FFFFFF',
    borderBottomColor: '#A7F3D0',
    borderColor: '#D1FAE5',
  },
  departureCardSpecialDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    borderBottomColor: '#120524',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },

  timelineCardCol: {
    flex: 1,
  },
  timelineDistTag: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
    letterSpacing: 0.6,
    marginBottom: s(5),
  },
  timelineDistTagDark: {
    color: '#C084FC',
  },
  stopDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(18),
    padding: s(14),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  stopDetailCardDark: {
    backgroundColor: '#160B2C',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: '#2B0D52',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0.15,
  },
  stopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: s(4),
  },
  stopCardName: {
    flex: 1,
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1035',
  },
  stopCardNameDark: {
    color: '#FFFFFF',
  },
  stopSparkleIcon: {
    marginTop: -s(2),
  },
  stopLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    marginBottom: s(8),
  },
  stopSubtitleText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    flex: 1,
  },
  stopSubtitleTextDark: {
    color: '#9CA3AF',
  },

  // Stop Note Callout Box
  stopNoteCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(6),
    backgroundColor: 'rgba(124, 58, 237, 0.06)',
    borderRadius: s(10),
    padding: s(9),
    marginBottom: s(10),
    borderLeftWidth: 3,
    borderLeftColor: '#7C3AED',
  },
  stopNoteCalloutDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderLeftColor: '#C084FC',
  },
  stopNotePawIcon: {
    marginTop: s(1.5),
  },
  stopNoteText: {
    flex: 1,
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#374151',
    lineHeight: ms(16),
  },
  stopNoteTextDark: {
    color: '#E5E7EB',
  },

  seeFullDetailsBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#FAF5FF',
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  seeFullDetailsBtnDark: {
    backgroundColor: '#2D1654',
    borderColor: 'rgba(167, 139, 250, 0.35)',
  },
  seeFullDetailsText: {
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  seeFullDetailsTextDark: {
    color: '#DDD6FE',
  },

  // Arrival Node at the end of the timeline
  arrivalNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(4),
  },
  arrivalPinCircle: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  arrivalTextCol: {
    flex: 1,
  },
  arrivalOverline: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#059669',
    letterSpacing: 0.6,
    marginBottom: s(4),
  },
  arrivalOverlineDark: {
    color: '#34D399',
  },
  arrivalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(14),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3.5,
    borderBottomColor: '#A7F3D0',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    elevation: 3,
  },
  arrivalCardDark: {
    backgroundColor: '#11221D',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: '#064E3B',
    borderColor: '#065F46',
  },
  arrivalCardLeft: {
    flex: 1,
    marginRight: s(10),
  },
  arrivalMainTitle: {
    fontSize: ms(15),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#065F46',
  },
  arrivalMainTitleDark: {
    color: '#6EE7B7',
  },
  arrivalSubText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#047857',
    marginTop: s(2),
  },
  arrivalSubTextDark: {
    color: '#A7F3D0',
  },
  arrivalArrowBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // "Frequently asked" Section (Tactile Accordion Cards)
  faqSection: {
    marginBottom: s(20),
    gap: s(10),
  },
  faqSectionTitle: {
    fontSize: ms(18),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#111827',
  },
  faqSectionTitleDark: {
    color: '#FFFFFF',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(16),
    padding: s(14),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD6FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  faqCardDark: {
    backgroundColor: '#190E30',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: '#2B0E52',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s(8),
    marginBottom: s(6),
  },
  faqQBadge: {
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(1),
  },
  faqQBadgeDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
  },
  faqQBadgeText: {
    fontSize: ms(9.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#7C3AED',
  },
  faqQBadgeTextDark: {
    color: '#DDD6FE',
  },
  faqQuestionTitle: {
    flex: 1,
    fontSize: ms(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
    lineHeight: ms(18),
  },
  faqQuestionTitleDark: {
    color: '#FFFFFF',
  },
  faqAnswerText: {
    fontSize: ms(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: '#4B5563',
    lineHeight: ms(17),
    paddingLeft: s(26),
  },
  faqAnswerTextDark: {
    color: '#D1D5DB',
  },

  // Center Loading & Error Wrap
  centerLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(24),
  },
  centerLoadingText: {
    fontSize: ms(13),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#6B7280',
    marginTop: s(10),
    textAlign: 'center',
  },
  centerLoadingTextDark: {
    color: '#C084FC',
  },
  centerErrorTitle: {
    fontSize: ms(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#111827',
    marginTop: s(10),
  },
  centerErrorTitleDark: {
    color: '#FFFFFF',
  },
  retryBtn: {
    marginTop: s(14),
    backgroundColor: '#7C3AED',
    paddingHorizontal: s(18),
    paddingVertical: s(8),
    borderRadius: s(12),
  },
  retryBtnText: {
    fontSize: ms(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});

export default RoadTripDetailScreen;
