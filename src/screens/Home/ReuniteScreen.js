import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme, colors } from '../../theme';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { CityPickerModal } from '../../components/common/CityPickerModal';
import { useStore } from '../../store';
import { PetAlertsModal, PostPetWizardModal } from './components';

const TABS = [
  { id: 'all', label: 'All posts' },
  { id: 'lost', label: 'Lost' },
  { id: 'found', label: 'Found' },
  { id: 'adopt', label: 'Adoption' },
];

const PET_FILTER_OPTIONS = [
  { id: 'all', label: 'All pets', emoji: '🐾' },
  { id: 'dog', label: 'Dogs', emoji: '🐶' },
  { id: 'cat', label: 'Cats', emoji: '🐱' },
  { id: 'rabbit', label: 'Rabbits', emoji: '🐰' },
  { id: 'guinea_pig', label: 'Guinea pigs', emoji: '🐹' },
  { id: 'hamster', label: 'Hamsters', emoji: '🐭' },
  { id: 'bird', label: 'Birds', emoji: '🦜' },
];

const STEPS = [
  {
    step: '01',
    title: 'Post a pet',
    desc: 'Add a clear photo and last-seen area.',
  },
  {
    step: '02',
    title: 'We check it',
    desc: 'Our team reviews every post first.',
  },
  {
    step: '03',
    title: 'People connect',
    desc: 'Owners and finders speak directly.',
  },
];

export const ReuniteScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const initialTab = route?.params?.initialTab || 'all';
  const [activeTab, setActiveTab] = useState(
    initialTab === 'lost'
      ? 'lost'
      : initialTab === 'found'
      ? 'found'
      : initialTab === 'adopt'
      ? 'adopt'
      : 'all',
  );
  const [selectedPetFilter, setSelectedPetFilter] = useState('all');
  const [isSpeciesDropdownOpen, setIsSpeciesDropdownOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCityPickerVisible, setCityPickerVisible] = useState(false);
  const [isReportModalVisible, setReportModalVisible] = useState(false);
  const [isSafetyModalVisible, setSafetyModalVisible] = useState(false);
  const [isAlertsModalVisible, setAlertsModalVisible] = useState(false);

  // Wizard Modal Type
  const [reportType, setReportType] = useState('lost');

  // Location from Zustand Store
  const globalLocation = useStore(state => state.currentLocation);
  const setCurrentLocation = useStore(state => state.setCurrentLocation);
  const isDarkMode = useStore(state => state.isDarkMode);
  const displayLocation = globalLocation || 'Delhi NCR';

  // ── Scroll-driven 3D Animations ──
  const scrollY = useRef(new Animated.Value(0)).current;

  // Background Ambient Orbs 3D Parallax Interpolations
  const orbTopRightY = scrollY.interpolate({
    inputRange: [-100, 0, 800],
    outputRange: [-20, 0, -130],
  });
  const orbMidLeftY = scrollY.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, -70],
  });
  const orbMidRightY = scrollY.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, -100],
  });
  const watermarkTopY = scrollY.interpolate({
    inputRange: [0, 800],
    outputRange: [0, -110],
  });

  // Hero Card 3D Perspective & Holographic Sheen
  const heroScale = scrollY.interpolate({
    inputRange: [-120, 0, 220],
    outputRange: [1.03, 1, 0.97],
    extrapolate: 'clamp',
  });
  const heroRotateX = scrollY.interpolate({
    inputRange: [0, 220],
    outputRange: ['0deg', '3.5deg'],
    extrapolate: 'clamp',
  });
  const heroSheenX = scrollY.interpolate({
    inputRange: [-60, 0, 240],
    outputRange: [-s(180), -s(40), s(340)],
    extrapolate: 'clamp',
  });

  // Action Cards Stagger Scale
  const actionCardScale = scrollY.interpolate({
    inputRange: [0, 160],
    outputRange: [1, 0.98],
    extrapolate: 'clamp',
  });

  // Alert & Safety Cards 3D Tilt
  const alertCardScale = scrollY.interpolate({
    inputRange: [200, 480],
    outputRange: [0.97, 1],
    extrapolate: 'clamp',
  });
  const alertCardRotateX = scrollY.interpolate({
    inputRange: [200, 480],
    outputRange: ['2.5deg', '0deg'],
    extrapolate: 'clamp',
  });
  const alertSheenX = scrollY.interpolate({
    inputRange: [180, 480],
    outputRange: [-s(180), s(340)],
    extrapolate: 'clamp',
  });

  const safetyCardScale = scrollY.interpolate({
    inputRange: [300, 580],
    outputRange: [0.97, 1],
    extrapolate: 'clamp',
  });
  const safetyCardRotateX = scrollY.interpolate({
    inputRange: [300, 580],
    outputRange: ['2.5deg', '0deg'],
    extrapolate: 'clamp',
  });

  // ── 1. Page Mount Entrance Cascade Animations ──
  const entranceHero = useRef(new Animated.Value(0)).current;
  const entranceActions = useRef(new Animated.Value(0)).current;
  const entrancePosts = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(entranceHero, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.spring(entranceActions, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
      Animated.spring(entrancePosts, {
        toValue: 1,
        friction: 7,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [entranceHero, entranceActions, entrancePosts]);

  const heroEntranceTranslateY = entranceHero.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });
  const actionsEntranceTranslateY = entranceActions.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });
  const postsEntranceTranslateY = entrancePosts.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  });

  // ── 2. Heart Burst on Tap ──
  const heartBurstScale = useRef(new Animated.Value(1)).current;
  const handleToggleFavorite = () => {
    setIsFavorite(prev => !prev);
    heartBurstScale.setValue(0.55);
    Animated.spring(heartBurstScale, {
      toValue: 1,
      friction: 3,
      tension: 90,
      useNativeDriver: true,
    }).start();
  };

  // ── 3. Continuous Floating Bob Motion for Glass Heart Badge ──
  const heartFloatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartFloatAnim, {
          toValue: -6,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(heartFloatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [heartFloatAnim]);

  // ── 4. Pulsing Sparkle Glow on Hero Badge ──
  const sparklePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparklePulse, {
          toValue: 1.25,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(sparklePulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    sparkleLoop.start();
    return () => sparkleLoop.stop();
  }, [sparklePulse]);

  // ── 5. Bell Periodic Jiggle on Alert Card ──
  const bellJiggle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const bellLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(bellJiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(bellJiggle, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(bellJiggle, { toValue: 0.7, duration: 90, useNativeDriver: true }),
        Animated.timing(bellJiggle, { toValue: -0.7, duration: 90, useNativeDriver: true }),
        Animated.timing(bellJiggle, { toValue: 0, duration: 90, useNativeDriver: true }),
      ]),
    );
    bellLoop.start();
    return () => bellLoop.stop();
  }, [bellJiggle]);

  const bellRotate = bellJiggle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  });

  // ── 6. Playful Gentle Polaroid Flutter / Sway in Empty State ──
  const polaroidSway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(polaroidSway, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(polaroidSway, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );
    swayLoop.start();
    return () => swayLoop.stop();
  }, [polaroidSway]);

  const polaroidLeftRotate = polaroidSway.interpolate({
    inputRange: [0, 1],
    outputRange: ['-9deg', '-11.5deg'],
  });
  const polaroidRightRotate = polaroidSway.interpolate({
    inputRange: [0, 1],
    outputRange: ['9deg', '11.5deg'],
  });
  const polaroidCenterTranslateY = polaroidSway.interpolate({
    inputRange: [0, 1],
    outputRange: [-s(4), -s(7)],
  });

  // ── 7. Filter Tab Tap Spring Animation ──
  const tabScale = useRef(new Animated.Value(1)).current;
  const handleTabPress = tabId => {
    setActiveTab(tabId);
    tabScale.setValue(0.92);
    Animated.spring(tabScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // ── 8. Gentle Breathing Pulse on Post A Pet CTA Button ──
  const ctaPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const ctaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1.04,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    ctaLoop.start();
    return () => ctaLoop.stop();
  }, [ctaPulse]);

  // Filter Posts
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeTab !== 'all') {
      result = result.filter(p => p.type === activeTab);
    }
    if (selectedPetFilter !== 'all') {
      result = result.filter(p => {
        const str = `${p.species || ''} ${p.breed || ''} ${p.name || ''}`.toLowerCase();
        return str.includes(selectedPetFilter.toLowerCase());
      });
    }
    return result;
  }, [posts, activeTab, selectedPetFilter]);


  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0F071D' : colors.background} />

      {/* ── Background Ambient Decorative Glows & Watermarks (Home Screen Pattern) ── */}
      <Animated.View
        style={[styles.ambientGlowTopRight, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbTopRightY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowMidLeft, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbMidLeftY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.ambientGlowMidRight, isDarkMode && styles.ambientGlowDark, { transform: [{ translateY: orbMidRightY }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientPawWatermarkTop,
          { transform: [{ rotate: '-25deg' }, { translateY: watermarkTopY }] },
        ]}
        pointerEvents="none">
        <Ionicons name="paw" size={ms(130)} color={isDarkMode ? 'rgba(255, 255, 255, 0.03)' : colors.ambient.pawWatermark} />
      </Animated.View>

      {/* ── 1. Top Navigation Bar (Seamless Background) ── */}
      <View style={[styles.navBar, isDarkMode && styles.navBarDark, { paddingTop: Math.max(insets.top, s(10)) }]}>
        <BouncyPressable
          style={[styles.navRoundBtn, isDarkMode && styles.navRoundBtnDark]}
          activeScale={0.88}
          onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={ms(18)} color={isDarkMode ? '#FFFFFF' : colors.reunite.navBtnIcon} />
        </BouncyPressable>

        <View style={styles.navTitleGroup}>
          <Text style={[styles.navOverline, isDarkMode && styles.navOverlineDark]}>COMMUNITY CARE</Text>
          <Text style={[styles.navTitle, isDarkMode && styles.navTitleDark]}>Reunite</Text>
        </View>

        <BouncyPressable
          style={[styles.navRoundBtn, isDarkMode && styles.navRoundBtnDark]}
          activeScale={0.88}
          onPress={handleToggleFavorite}>
          <Animated.View style={{ transform: [{ scale: heartBurstScale }] }}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={ms(18)}
              color={isFavorite ? colors.reunite.heartActive : (isDarkMode ? '#A78BFA' : colors.reunite.heartInactive)}
            />
          </Animated.View>
        </BouncyPressable>
      </View>

      {/* ── 2. Scrollable Body ── */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + s(30) },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}>
        {/* ── Hero Banner Card (Gradient with 3D Perspective & Holographic Sheen) ── */}
        <Animated.View
          style={[
            styles.heroCardWrapper,
            {
              opacity: entranceHero,
              transform: [
                { translateY: heroEntranceTranslateY },
                { perspective: 1000 },
                { scale: heroScale },
                { rotateX: heroRotateX },
              ],
            },
          ]}>
          <LinearGradient
            colors={colors.reunite.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}>
            {/* Background Decorative Rings */}
            <View style={styles.heroDecoRingOuter} />
            <View style={styles.heroDecoRingInner} />

            {/* Dynamic Holographic Glass Light Sheen (Home Screen Hero Effect) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.glassSheenOverlay,
                {
                  transform: [{ translateX: heroSheenX }, { rotate: '25deg' }],
                },
              ]}>
              <LinearGradient
                colors={colors.ambient.sheenGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            {/* Top Right Floating Glass Heart Badge with Micro-Floating & Twinkling Animation */}
            <Animated.View
              style={[
                styles.heroHeartBadgeContainer,
                { transform: [{ translateY: heartFloatAnim }] },
              ]}>
              <View style={styles.heroHeartBadge}>
                <Ionicons name="heart-outline" size={ms(18)} color={colors.reunite.heroTitle} />
              </View>
              <Animated.View
                style={[
                  styles.heroHeartMiniDot,
                  { transform: [{ scale: sparklePulse }] },
                ]}>
                <Ionicons name="sparkles" size={ms(7)} color={colors.reunite.heroSparkleIcon} />
              </Animated.View>
            </Animated.View>

            {/* Text Content */}
            <Text style={styles.heroOverline}>NO PET SHOULD SEARCH ALONE</Text>
            <Text style={styles.heroTitle}>
              Let&apos;s bring{'\n'}them home.
            </Text>
            <Text style={styles.heroSubtitle}>
              Every post is checked before it goes live. People nearby can contact owners or finders directly.
            </Text>

            {/* Feature Pills */}
            <View style={styles.heroPillsRow}>
              <View style={styles.heroPill}>
                <Feather
                  name="check"
                  size={ms(9.5)}
                  color={colors.reunite.heroPillText}
                  style={styles.heroPillIcon}
                />
                <Text style={styles.heroPillText}>Team checked</Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons
                  name="location-outline"
                  size={ms(9.5)}
                  color={colors.reunite.heroPillText}
                  style={styles.heroPillIcon}
                />
                <Text style={styles.heroPillText}>Location based</Text>
              </View>
              <View style={styles.heroPill}>
                <Ionicons
                  name="heart-outline"
                  size={ms(9.5)}
                  color={colors.reunite.heroPillText}
                  style={styles.heroPillIcon}
                />
                <Text style={styles.heroPillText}>Adoption is free</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Section: START HERE - How can we help? ── */}
        <Animated.View
          style={{
            opacity: entranceActions,
            transform: [{ translateY: actionsEntranceTranslateY }],
          }}>
          <View style={styles.sectionHeadingWrap}>
            <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>START HERE</Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>How can we help?</Text>
          </View>

          {/* Card 1: I lost my pet (Full width vibrant magenta 3D card) */}
          <Animated.View style={{ transform: [{ scale: actionCardScale }] }}>
            <BouncyPressable
              style={styles.lostPetCard}
              activeScale={0.97}
              onPress={() => {
                setReportType('lost');
                setReportModalVisible(true);
              }}>
              <LinearGradient
                colors={colors.reunite.lostGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.lostPetGradient}>
                {/* Left Search Icon Squircle */}
                <View style={styles.lostIconSquircle}>
                  <Feather name="search" size={ms(18)} color={colors.reunite.lostIconColor} />
                </View>

                {/* Text */}
                <View style={styles.lostTextGroup}>
                  <Text style={styles.lostCardTitle}>I lost my pet</Text>
                  <Text style={styles.lostCardSubtitle}>Post an alert for people nearby</Text>
                </View>

                {/* Right Arrow */}
                <View style={styles.lostArrowSquircle}>
                  <Feather name="arrow-right" size={ms(14)} color={colors.reunite.lostArrowIcon} />
                </View>
              </LinearGradient>
            </BouncyPressable>
          </Animated.View>

          {/* 2-Columns Row: I found a pet & Adopt or rehome */}
          <View style={styles.helpCardsRow}>
            {/* Card 2: I found a pet (Lavender 3D Card) */}
            <BouncyPressable
              style={[styles.foundPetCard, isDarkMode && styles.foundPetCardDark]}
              activeScale={0.96}
              onPress={() => {
                setReportType('found');
                setReportModalVisible(true);
              }}>
              <View style={[styles.foundIconSquircle, isDarkMode && styles.foundIconSquircleDark]}>
                <Ionicons
                  name="location-outline"
                  size={ms(17)}
                  color={isDarkMode ? '#C084FC' : colors.reunite.foundIconColor}
                />
              </View>
              <Text
                style={[styles.foundCardTitle, isDarkMode && styles.foundCardTitleDark]}
                numberOfLines={1}>
                I found a pet
              </Text>
              <Text
                style={[styles.foundCardSubtitle, isDarkMode && styles.foundCardSubtitleDark]}
                numberOfLines={2}>
                Help them get safely home
              </Text>
              <View style={[styles.foundArrowCircle, isDarkMode && styles.foundArrowCircleDark]}>
                <Feather
                  name="arrow-right"
                  size={ms(12)}
                  color={isDarkMode ? '#E9D5FF' : colors.reunite.foundArrowIcon}
                />
              </View>
            </BouncyPressable>

            {/* Card 3: Adopt or rehome (Mint 3D Card) */}
            <BouncyPressable
              style={[styles.adoptPetCard, isDarkMode && styles.adoptPetCardDark]}
              activeScale={0.96}
              onPress={() => {
                setReportType('adopt');
                setReportModalVisible(true);
              }}>
              <View style={[styles.adoptIconSquircle, isDarkMode && styles.adoptIconSquircleDark]}>
                <Ionicons
                  name="heart-outline"
                  size={ms(17)}
                  color={isDarkMode ? '#34D399' : colors.reunite.adoptIconColor}
                />
              </View>
              <Text
                style={[styles.adoptCardTitle, isDarkMode && styles.adoptCardTitleDark]}
                numberOfLines={1}>
                Adopt or rehome
              </Text>
              <Text
                style={[styles.adoptCardSubtitle, isDarkMode && styles.adoptCardSubtitleDark]}
                numberOfLines={2}>
                Always free, never sold
              </Text>
              <View style={[styles.adoptArrowCircle, isDarkMode && styles.adoptArrowCircleDark]}>
                <Feather
                  name="arrow-right"
                  size={ms(12)}
                  color={isDarkMode ? '#A7F3D0' : colors.reunite.adoptArrowIcon}
                />
              </View>
            </BouncyPressable>
          </View>
        </Animated.View>

        {/* ── Section: CHECKED COMMUNITY POSTS ── */}
        <Animated.View
          style={{
            opacity: entrancePosts,
            transform: [{ translateY: postsEntranceTranslateY }],
          }}>
          <View style={[styles.sectionHeadingWrap, styles.communitySectionTop]}>
            <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>CHECKED COMMUNITY POSTS</Text>
            <View style={styles.locationTitleRow}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Near {displayLocation}</Text>
              <BouncyPressable
                style={[styles.changeLocationBtn, isDarkMode && styles.changeLocationBtnDark]}
                activeScale={0.9}
                onPress={() => setCityPickerVisible(true)}>
                <Ionicons name="location-outline" size={ms(13)} color={colors.reunite.locationChange} />
                <Text style={[styles.changeLocationText, isDarkMode && styles.changeLocationTextDark]}>Change</Text>
              </BouncyPressable>
            </View>
          </View>

          {/* Filter Tabs Segment with Spring Feedback */}
          <Animated.View style={[styles.tabsTrack, isDarkMode && styles.tabsTrackDark, { transform: [{ scale: tabScale }] }]}>
            {TABS.map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={[
                    styles.tabSegment,
                    isDarkMode && styles.tabSegmentDark,
                    isSelected && (isDarkMode ? styles.tabSegmentActiveDark : styles.tabSegmentActive),
                  ]}
                  onPress={() => handleTabPress(tab.id)}>
                  <Text
                    style={[
                      styles.tabSegmentText,
                      isDarkMode && styles.tabSegmentTextDark,
                      isSelected && (isDarkMode ? styles.tabSegmentTextActiveDark : styles.tabSegmentTextActive),
                    ]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Sub-Filter Controls */}
          <View style={styles.subFilterRow}>
            <View style={styles.allPetsWrapper}>
              <BouncyPressable
                style={[
                  styles.allPetsPill,
                  isDarkMode && styles.allPetsPillDark,
                  isSpeciesDropdownOpen && (isDarkMode ? styles.allPetsPillActiveDark : styles.allPetsPillActive),
                ]}
                activeScale={0.92}
                onPress={() => setIsSpeciesDropdownOpen(!isSpeciesDropdownOpen)}>
                <Text style={styles.allPetsPillEmoji}>
                  {PET_FILTER_OPTIONS.find(o => o.id === selectedPetFilter)?.emoji || '🐾'}
                </Text>
                <Text
                  style={[
                    styles.allPetsText,
                    isDarkMode && styles.allPetsTextDark,
                    isSpeciesDropdownOpen && (isDarkMode ? styles.allPetsTextActiveDark : styles.allPetsTextActive),
                  ]}>
                  {PET_FILTER_OPTIONS.find(o => o.id === selectedPetFilter)?.label || 'All pets'}
                </Text>
                <Feather
                  name={isSpeciesDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={ms(13)}
                  color={
                    isSpeciesDropdownOpen
                      ? (isDarkMode ? '#C084FC' : colors.reunite.petAlertsDeepPurple)
                      : (isDarkMode ? '#A78BFA' : colors.reunite.allPetsPillIcon)
                  }
                />
              </BouncyPressable>

              {/* Species Dropdown Menu (Luxury 3D Popover with Avatars) */}
              {isSpeciesDropdownOpen && (
                <>
                  <Pressable
                    style={styles.dropdownBackdrop}
                    onPress={() => setIsSpeciesDropdownOpen(false)}
                  />
                  <View style={[styles.speciesDropdownCard, isDarkMode && styles.speciesDropdownCardDark]}>
                    {PET_FILTER_OPTIONS.map((item, idx) => {
                      const isSelected = selectedPetFilter === item.id;
                      return (
                        <React.Fragment key={item.id}>
                          <BouncyPressable
                            style={[
                              styles.speciesDropdownItem,
                              isSelected && (isDarkMode ? styles.speciesDropdownItemActiveDark : styles.speciesDropdownItemActive),
                            ]}
                            activeScale={0.96}
                            onPress={() => {
                              setSelectedPetFilter(item.id);
                              setIsSpeciesDropdownOpen(false);
                            }}>
                            <View style={styles.dropdownItemLeft}>
                              <View
                                style={[
                                  styles.speciesEmojiBox,
                                  isDarkMode && styles.speciesEmojiBoxDark,
                                  isSelected && (isDarkMode ? styles.speciesEmojiBoxActiveDark : styles.speciesEmojiBoxActive),
                                ]}>
                                <Text style={styles.speciesEmojiText}>{item.emoji}</Text>
                              </View>
                              <Text
                                style={[
                                  styles.speciesDropdownText,
                                  isDarkMode && styles.speciesDropdownTextDark,
                                  isSelected && (isDarkMode ? styles.speciesDropdownTextActiveDark : styles.speciesDropdownTextActive),
                                ]}>
                                {item.label}
                              </Text>
                            </View>

                            {isSelected && (
                              <View style={[styles.dropdownActiveBadge, isDarkMode && styles.dropdownActiveBadgeDark]}>
                                <Feather
                                  name="check"
                                  size={ms(13)}
                                  color={isDarkMode ? '#C084FC' : colors.reunite.petAlertsDeepPurple}
                                />
                              </View>
                            )}
                          </BouncyPressable>
                          {/* Divider after 'All pets' */}
                          {idx === 0 && <View style={[styles.dropdownDivider, isDarkMode && styles.dropdownDividerDark]} />}
                        </React.Fragment>
                      );
                    })}
                  </View>
                </>
              )}
            </View>

            <Text style={[styles.sortText, isDarkMode && styles.sortTextDark]}>Latest first</Text>
          </View>

          {/* Community Posts Cards or Empty State */}
          {filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <View key={post.id} style={[styles.communityPostCard, isDarkMode && styles.communityPostCardDark]}>
                <View style={styles.postCardTop}>
                  <View
                    style={[
                      styles.postBadge,
                      post.type === 'lost'
                        ? styles.badgeLost
                        : post.type === 'found'
                        ? styles.badgeFound
                        : styles.badgeAdopt,
                    ]}>
                    <Text
                      style={[
                        styles.postBadgeText,
                        post.type === 'lost'
                          ? styles.badgeTextLost
                          : post.type === 'found'
                          ? styles.badgeTextFound
                          : styles.badgeTextAdopt,
                      ]}>
                      {post.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.postTimeText}>{post.timeAgo}</Text>
                </View>
                <Text style={[styles.postName, isDarkMode && styles.postNameDark]}>{post.name}</Text>
                <Text style={[styles.postBreed, isDarkMode && styles.postBreedDark]}>{post.breed}</Text>
                <View style={styles.postLocationRow}>
                  <Ionicons name="location-outline" size={ms(13)} color={isDarkMode ? '#A78BFA' : colors.reunite.textMuted} />
                  <Text style={[styles.postLocationText, isDarkMode && styles.postLocationTextDark]}>{post.location}</Text>
                </View>
              </View>
            ))
          ) : (
            /* Empty State Matching Design with Playful Polaroid Flutter */
            <View style={[styles.emptyStateCard, isDarkMode && styles.emptyStateCardDark]}>
              {/* 3 Polaroid Frames Peeking with Micro-Sway Animation */}
              <View style={styles.polaroidContainer}>
                {/* Left polaroid (swaying tilt) */}
                <Animated.View
                  style={[
                    styles.polaroidCard,
                    isDarkMode && styles.polaroidCardDark,
                    styles.polaroidLeft,
                    { transform: [{ rotate: polaroidLeftRotate }] },
                  ]}>
                  <View style={[styles.polaroidTape, isDarkMode && styles.polaroidTapeDark]} />
                  <View style={[styles.polaroidImgBox, isDarkMode && styles.polaroidImgBoxDark]}>
                    <Ionicons name="paw" size={ms(18)} color={colors.reunite.polaroidPawLost} />
                  </View>
                  <View style={[styles.polaroidPill, styles.badgeLost]}>
                    <Text style={[styles.polaroidPillText, styles.badgeTextLost]}>LOST</Text>
                  </View>
                </Animated.View>

                {/* Center polaroid (gentle bob) */}
                <Animated.View
                  style={[
                    styles.polaroidCard,
                    isDarkMode && styles.polaroidCardDark,
                    styles.polaroidCenter,
                    { transform: [{ translateY: polaroidCenterTranslateY }] },
                  ]}>
                  <View style={[styles.polaroidTape, isDarkMode && styles.polaroidTapeDark]} />
                  <View style={[styles.polaroidImgBox, isDarkMode && styles.polaroidImgBoxDark]}>
                    <Ionicons name="paw" size={ms(20)} color={colors.reunite.polaroidPawFound} />
                  </View>
                  <View style={[styles.polaroidPill, styles.badgeFound]}>
                    <Text style={[styles.polaroidPillText, styles.badgeTextFound]}>FOUND</Text>
                  </View>
                </Animated.View>

                {/* Right polaroid (swaying tilt) */}
                <Animated.View
                  style={[
                    styles.polaroidCard,
                    isDarkMode && styles.polaroidCardDark,
                    styles.polaroidRight,
                    { transform: [{ rotate: polaroidRightRotate }] },
                  ]}>
                  <View style={[styles.polaroidTape, isDarkMode && styles.polaroidTapeDark]} />
                  <View style={[styles.polaroidImgBox, isDarkMode && styles.polaroidImgBoxDark]}>
                    <Ionicons name="paw" size={ms(18)} color={colors.reunite.polaroidPawAdopt} />
                  </View>
                  <View style={[styles.polaroidPill, styles.badgeAdopt]}>
                    <Text style={[styles.polaroidPillText, styles.badgeTextAdopt]}>ADOPT</Text>
                  </View>
                </Animated.View>
              </View>

              <Text style={[styles.emptyOverline, isDarkMode && styles.emptyOverlineDark]}>ALL CLEAR NEARBY</Text>
              <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>No posts here yet</Text>
              <Text style={[styles.emptyDesc, isDarkMode && styles.emptyDescDark]}>
                When someone near you needs help, their checked post will appear here. Your report could be what brings a pet home.
              </Text>

              <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                <BouncyPressable
                  style={styles.postPetBtn}
                  activeScale={0.92}
                  onPress={() => setReportModalVisible(true)}>
                  <Text style={styles.postPetBtnText}>Post a pet</Text>
                  <Feather
                    name="arrow-right"
                    size={ms(14)}
                    color={colors.reunite.postPetBtnText}
                    style={styles.postPetArrow}
                  />
                </BouncyPressable>
              </Animated.View>
            </View>
          )}

          {/* ── Section: Get local pet alerts (Royal Purple 3D Card with Sheen & Wiggle Bell) ── */}
          <Animated.View
            style={[
              styles.alertCard,
              {
                transform: [
                  { perspective: 1000 },
                  { scale: alertCardScale },
                  { rotateX: alertCardRotateX },
                ],
              },
            ]}>
            {/* Dynamic Light Sheen across Alert Card */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.alertSheenOverlay,
                {
                  transform: [{ translateX: alertSheenX }, { rotate: '25deg' }],
                },
              ]}>
              <LinearGradient
                colors={colors.ambient.sheenGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>

            <Animated.View style={[styles.alertBellSquircle, { transform: [{ rotate: bellRotate }] }]}>
              <Ionicons name="notifications" size={ms(20)} color={colors.reunite.alertBellIcon} />
            </Animated.View>
            <Text style={styles.alertOverline}>STAY AWARE NEARBY</Text>
            <Text style={styles.alertTitle}>Get local pet alerts</Text>
            <Text style={styles.alertSubtitle}>
              Hear about newly checked lost and found posts around your location.
            </Text>

            <BouncyPressable
              style={styles.setupAlertsBtn}
              activeScale={0.92}
              onPress={() => setAlertsModalVisible(true)}>
              <Text style={styles.setupAlertsBtnText}>Set up alerts</Text>
              <Feather
                name="arrow-right"
                size={ms(13)}
                color={colors.reunite.alertBtnText}
                style={styles.setupAlertsArrow}
              />
            </BouncyPressable>
          </Animated.View>

          {/* ── Section: COMMUNITY SAFETY (Soft Yellow 3D Card) ── */}
          <Animated.View
            style={[
              styles.safetyCard,
              isDarkMode && styles.safetyCardDark,
              {
                transform: [
                  { perspective: 1000 },
                  { scale: safetyCardScale },
                  { rotateX: safetyCardRotateX },
                ],
              },
            ]}>
            <View style={[styles.safetyIconSquircle, isDarkMode && styles.safetyIconSquircleDark]}>
              <Feather name="check" size={ms(18)} color={isDarkMode ? '#FBBF24' : colors.reunite.safetyIconColor} />
            </View>
            <Text style={[styles.safetyOverline, isDarkMode && styles.safetyOverlineDark]}>COMMUNITY SAFETY</Text>
            <Text style={[styles.safetyTitle, isDarkMode && styles.safetyTitleDark]}>Protect pets and people</Text>
            <Text style={[styles.safetyDesc, isDarkMode && styles.safetyDescDark]}>
              Never send money before meeting. Ask finders to describe a detail that is not visible in the post. Adoption here is always free.
            </Text>

            <BouncyPressable
              style={styles.safetyLinkBtn}
              activeScale={0.9}
              onPress={() => setSafetyModalVisible(true)}>
              <Text style={[styles.safetyLinkText, isDarkMode && styles.safetyLinkTextDark]}>Read safety guide</Text>
              <Feather
                name="arrow-right"
                size={ms(13)}
                color={isDarkMode ? '#FBBF24' : colors.reunite.safetyLink}
                style={styles.safetyLinkArrow}
              />
            </BouncyPressable>
          </Animated.View>

          {/* ── Section: SIMPLE AND CHECKED - How Reunite works ── */}
          <View style={[styles.sectionHeadingWrap, styles.howItWorksTop]}>
            <Text style={[styles.sectionOverline, isDarkMode && styles.sectionOverlineDark]}>SIMPLE AND CHECKED</Text>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>How Reunite works</Text>
          </View>

          {/* 3 Step Cards with Tactile BouncyPressable Feedback */}
          {STEPS.map(item => (
            <BouncyPressable
              key={item.step}
              style={[styles.stepCard, isDarkMode && styles.stepCardDark]}
              activeScale={0.97}
              onPress={() => {}}>
              <View style={[styles.stepPillBadge, isDarkMode && styles.stepPillBadgeDark]}>
                <Text style={[styles.stepPillNumber, isDarkMode && styles.stepPillNumberDark]}>{item.step}</Text>
              </View>
              <View style={styles.stepTextGroup}>
                <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>{item.title}</Text>
                <Text style={[styles.stepDesc, isDarkMode && styles.stepDescDark]}>{item.desc}</Text>
              </View>
            </BouncyPressable>
          ))}
        </Animated.View>
      </Animated.ScrollView>

      {/* ── City Picker Modal ── */}
      <CityPickerModal
        visible={isCityPickerVisible}
        selectedCity={displayLocation}
        onSelectCity={city => {
          if (setCurrentLocation) {
            setCurrentLocation(city);
          }
          setCityPickerVisible(false);
        }}
        onClose={() => setCityPickerVisible(false)}
      />

      {/* ── Report / Post a Pet Wizard Modal (8 Steps) ── */}
      <PostPetWizardModal
        visible={isReportModalVisible}
        onClose={() => setReportModalVisible(false)}
        initialType={reportType}
        defaultLocation={displayLocation}
        onPostCreated={newPost => {
          setPosts(prev => [newPost, ...prev]);
        }}
      />

      {/* ── Safety Modal ── */}
      <Modal
        visible={isSafetyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSafetyModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSafetyModalVisible(false)}>
          <Pressable
            style={[styles.premiumModalCard, isDarkMode && styles.premiumModalCardDark]}
            onPress={e => e.stopPropagation()}>
            {/* Top Close 'X' Button */}
            <BouncyPressable
              style={[styles.modalCloseCircle, isDarkMode && styles.modalCloseCircleDark]}
              activeScale={0.88}
              onPress={() => setSafetyModalVisible(false)}>
              <Feather name="x" size={ms(16)} color={isDarkMode ? '#E2E8F0' : colors.reunite.textMuted} />
            </BouncyPressable>

            {/* 3D Shield Squircle Icon */}
            <View style={[styles.safetyModalIconSquircle, isDarkMode && styles.safetyModalIconSquircleDark]}>
              <Feather name="shield" size={ms(26)} color={isDarkMode ? '#34D399' : colors.reunite.modalShieldIcon} />
              <View style={styles.safetyModalDotBadge}>
                <Feather name="check" size={ms(9)} color={colors.surface} />
              </View>
            </View>

            <Text style={[styles.premiumModalTitle, isDarkMode && styles.premiumModalTitleDark]}>
              Community Safety Guide
            </Text>
            <Text style={[styles.premiumModalSubtitle, isDarkMode && styles.premiumModalSubtitleDark]}>
              Keep pets and pet parents safe during every reunion.
            </Text>

            {/* Safety Checklist Items */}
            <View style={[styles.modalBulletsContainer, isDarkMode && styles.modalBulletsContainerDark]}>
              <View style={styles.modalBulletRow}>
                <View style={[styles.bulletCheckCircle, styles.bulletCheckGreen, isDarkMode && styles.bulletCheckCircleDark]}>
                  <Feather name="check" size={ms(10)} color={isDarkMode ? '#34D399' : colors.reunite.modalShieldIcon} />
                </View>
                <Text style={[styles.modalBulletText, isDarkMode && styles.modalBulletTextDark]}>
                  Never send advance payment or delivery fees
                </Text>
              </View>
              <View style={styles.modalBulletRow}>
                <View style={[styles.bulletCheckCircle, styles.bulletCheckGreen, isDarkMode && styles.bulletCheckCircleDark]}>
                  <Feather name="check" size={ms(10)} color={isDarkMode ? '#34D399' : colors.reunite.modalShieldIcon} />
                </View>
                <Text style={[styles.modalBulletText, isDarkMode && styles.modalBulletTextDark]}>
                  Always meet in well-lit public daylight areas
                </Text>
              </View>
              <View style={styles.modalBulletRow}>
                <View style={[styles.bulletCheckCircle, styles.bulletCheckGreen, isDarkMode && styles.bulletCheckCircleDark]}>
                  <Feather name="check" size={ms(10)} color={isDarkMode ? '#34D399' : colors.reunite.modalShieldIcon} />
                </View>
                <Text style={[styles.modalBulletText, isDarkMode && styles.modalBulletTextDark]}>
                  Verify microchip details and unique markings
                </Text>
              </View>
              <View style={styles.modalBulletRow}>
                <View style={[styles.bulletCheckCircle, styles.bulletCheckGreen, isDarkMode && styles.bulletCheckCircleDark]}>
                  <Feather name="check" size={ms(10)} color={isDarkMode ? '#34D399' : colors.reunite.modalShieldIcon} />
                </View>
                <Text style={[styles.modalBulletText, isDarkMode && styles.modalBulletTextDark]}>
                  Adoption is 100% free — pet sales strictly banned
                </Text>
              </View>
            </View>

            {/* 3D Primary Button */}
            <BouncyPressable
              style={styles.modalPrimaryBtn}
              activeScale={0.95}
              onPress={() => setSafetyModalVisible(false)}>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalPrimaryGradient}>
                <Feather name="check" size={ms(15)} color={colors.surface} />
                <Text style={styles.modalPrimaryBtnText}>I Understand</Text>
              </LinearGradient>
            </BouncyPressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Pet Alerts Modal (Matching Website Reference) ── */}
      <PetAlertsModal
        visible={isAlertsModalVisible}
        onClose={() => setAlertsModalVisible(false)}
        initialCity={displayLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* ── Background Ambient Decorative Glows & Watermarks (Home Screen Pattern) ── */
  ambientGlowTopRight: {
    position: 'absolute',
    top: -s(30),
    right: -s(50),
    width: s(260),
    height: s(260),
    borderRadius: s(130),
    backgroundColor: colors.ambient.glowPurple,
  },
  ambientGlowMidLeft: {
    position: 'absolute',
    top: s(360),
    left: -s(70),
    width: s(260),
    height: s(260),
    borderRadius: s(130),
    backgroundColor: colors.ambient.glowPeach,
  },
  ambientGlowMidRight: {
    position: 'absolute',
    top: s(600),
    right: -s(60),
    width: s(280),
    height: s(280),
    borderRadius: s(140),
    backgroundColor: colors.ambient.glowMagenta,
  },
  ambientPawWatermarkTop: {
    position: 'absolute',
    top: s(140),
    right: -s(20),
    transform: [{ rotate: '-25deg' }],
  },

  /* ── Navigation Header (Solid Background so content scrolls cleanly underneath) ── */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: s(16),
    paddingBottom: s(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(220, 212, 198, 0.45)',
    zIndex: 10,
  },
  navRoundBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(13),
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomWidth: 3,
    borderBottomColor: colors.card3D.borderBottom,
    ...Platform.select({
      ios: {
        shadowColor: colors.card3D.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  navTitleGroup: {
    flex: 1,
    marginLeft: s(12),
  },
  navOverline: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.overline,
    letterSpacing: 0.8,
  },
  navTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
    marginTop: s(1),
  },

  /* ── Scroll Area ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: s(16),
    paddingTop: s(8),
  },

  /* ── Hero Banner Card with 3D Effect & Holographic Sheen (Compact) ── */
  heroCardWrapper: {
    borderRadius: s(22),
    marginBottom: s(16),
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.heroShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroGradient: {
    borderRadius: s(22),
    paddingHorizontal: s(16),
    paddingVertical: s(13),
    overflow: 'hidden',
    position: 'relative',
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.heroBevelTop,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.heroBevelBottom,
  },
  glassSheenOverlay: {
    position: 'absolute',
    top: -s(80),
    left: -s(60),
    width: s(120),
    height: s(360),
  },
  heroDecoRingOuter: {
    position: 'absolute',
    bottom: -s(50),
    right: -s(40),
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    borderWidth: 1.5,
    borderColor: colors.reunite.heroRings,
  },
  heroDecoRingInner: {
    position: 'absolute',
    bottom: -s(25),
    right: -s(15),
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    borderWidth: 1.5,
    borderColor: colors.reunite.heroRings,
  },
  heroHeartBadgeContainer: {
    position: 'absolute',
    top: s(13),
    right: s(13),
  },
  heroHeartBadge: {
    width: s(38),
    height: s(38),
    borderRadius: s(14),
    backgroundColor: colors.reunite.heroGlassHeartBg,
    borderWidth: 1.2,
    borderColor: colors.reunite.heroGlassHeartBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeartMiniDot: {
    position: 'absolute',
    bottom: -s(2),
    right: -s(2),
    width: s(16),
    height: s(16),
    borderRadius: s(8),
    backgroundColor: colors.reunite.heroSparkleBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.reunite.heroSparkleBadgeBorder,
  },
  heroOverline: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.heroOverline,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: s(19),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.heroTitle,
    marginTop: s(2),
    lineHeight: s(23),
  },
  heroSubtitle: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.heroSubtitle,
    marginTop: s(5),
    lineHeight: s(14.5),
    maxWidth: '80%',
  },
  heroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(5),
    marginTop: s(10),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.reunite.heroPillBg,
    paddingHorizontal: s(8),
    paddingVertical: s(3.5),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: colors.reunite.heroPillBorder,
  },
  heroPillIcon: {
    marginRight: s(3),
  },
  heroPillText: {
    fontSize: s(9),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.heroPillText,
  },

  /* ── Section Headings ── */
  sectionHeadingWrap: {
    marginBottom: s(12),
  },
  sectionOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.overline,
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: s(16.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
    marginTop: s(2),
  },
  locationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s(2),
  },
  changeLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeLocationText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.locationChange,
    marginLeft: s(3),
  },

  /* ── Card 1: I lost my pet (Magenta 3D Card) ── */
  lostPetCard: {
    borderRadius: s(20),
    marginBottom: s(12),
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.lostShadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  lostPetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(15),
    borderRadius: s(20),
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.lostBevelTop,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.lostBevelBottom,
  },
  lostIconSquircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(13),
    backgroundColor: colors.reunite.lostIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.card3D.borderTop,
    borderBottomWidth: 2,
    borderBottomColor: colors.card3D.borderBottom,
  },
  lostTextGroup: {
    flex: 1,
    marginLeft: s(12),
  },
  lostCardTitle: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.lostTitle,
  },
  lostCardSubtitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.lostSubtitle,
    marginTop: s(1.5),
  },
  lostArrowSquircle: {
    width: s(34),
    height: s(34),
    borderRadius: s(11),
    backgroundColor: colors.reunite.lostArrowBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── 2-Columns Row (Found & Adopt 3D Cards) ── */
  helpCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: s(24),
  },
  foundPetCard: {
    width: '48.5%',
    backgroundColor: colors.reunite.foundBg,
    borderRadius: s(18),
    paddingHorizontal: s(12),
    paddingTop: s(12),
    paddingBottom: s(14),
    minHeight: s(118),
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.foundBevelTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.reunite.foundBorder,
    borderRightColor: colors.reunite.foundBorder,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.foundBevelBottom,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.foundShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  foundIconSquircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    backgroundColor: colors.reunite.foundIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.card3D.borderTop,
    borderBottomWidth: 2,
    borderBottomColor: colors.reunite.foundBorder,
  },
  foundCardTitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.foundTitle,
    marginTop: s(8),
    lineHeight: s(16),
  },
  foundCardSubtitle: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.foundSubtitle,
    marginTop: s(2),
    lineHeight: s(13),
    paddingRight: s(18),
  },
  foundArrowCircle: {
    position: 'absolute',
    bottom: s(10),
    right: s(10),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: colors.reunite.foundArrowBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  adoptPetCard: {
    width: '48.5%',
    backgroundColor: colors.reunite.adoptBg,
    borderRadius: s(18),
    paddingHorizontal: s(12),
    paddingTop: s(12),
    paddingBottom: s(14),
    minHeight: s(118),
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.adoptBevelTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.reunite.adoptBorder,
    borderRightColor: colors.reunite.adoptBorder,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.adoptBevelBottom,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.adoptShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  adoptIconSquircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(10),
    backgroundColor: colors.reunite.adoptIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.card3D.borderTop,
    borderBottomWidth: 2,
    borderBottomColor: colors.reunite.adoptBorder,
  },
  adoptCardTitle: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.adoptTitle,
    marginTop: s(8),
    lineHeight: s(16),
  },
  adoptCardSubtitle: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.adoptSubtitle,
    marginTop: s(2),
    lineHeight: s(13),
    paddingRight: s(18),
  },
  adoptArrowCircle: {
    position: 'absolute',
    bottom: s(10),
    right: s(10),
    width: s(22),
    height: s(22),
    borderRadius: s(11),
    backgroundColor: colors.reunite.adoptArrowBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Community Posts Section ── */
  communitySectionTop: {
    marginTop: s(4),
  },
  tabsTrack: {
    flexDirection: 'row',
    backgroundColor: colors.reunite.tabTrack,
    borderRadius: s(22),
    padding: s(3.5),
    marginBottom: s(14),
  },
  tabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(7.5),
    borderRadius: s(18),
  },
  tabSegmentActive: {
    backgroundColor: colors.reunite.tabActiveBg,
    borderTopWidth: 1.2,
    borderTopColor: colors.card3D.borderTop,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.card3D.borderBottom,
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.titleDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabSegmentText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.tabInactiveText,
  },
  tabSegmentTextActive: {
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.tabActiveText,
  },

  subFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s(14),
    position: 'relative',
    zIndex: 100,
  },
  allPetsWrapper: {
    position: 'relative',
    zIndex: 101,
  },
  allPetsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.reunite.allPetsPillBg,
    borderTopWidth: 1.2,
    borderTopColor: colors.card3D.borderTop,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.reunite.allPetsPillBorder,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.card3D.borderBottom,
    borderRadius: s(14),
    paddingHorizontal: s(12),
    paddingVertical: s(5.5),
    gap: s(6),
  },
  allPetsPillActive: {
    borderColor: '#7C3AED',
    borderWidth: 1.8,
    backgroundColor: '#FAF5FF',
  },
  allPetsPillEmoji: {
    fontSize: ms(13),
  },
  allPetsText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: colors.reunite.allPetsPillText,
  },
  allPetsTextActive: {
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -s(800),
    left: -s(800),
    width: s(2000),
    height: s(3000),
    backgroundColor: 'transparent',
    zIndex: 998,
  },
  speciesDropdownCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: s(185),
    backgroundColor: colors.surface,
    borderRadius: ms(20),
    paddingVertical: ms(7),
    paddingHorizontal: ms(5),
    borderWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomColor: colors.card3D.borderBottom,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 16,
    zIndex: 999,
  },
  speciesDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: ms(7.5),
    paddingHorizontal: s(8),
    borderRadius: ms(12),
  },
  speciesDropdownItemActive: {
    backgroundColor: colors.reunite.petAlertsInputFocusBg,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  speciesEmojiBox: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(8),
    backgroundColor: '#F7F5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(9),
  },
  speciesEmojiBoxActive: {
    backgroundColor: colors.reunite.foundBg,
  },
  speciesEmojiText: {
    fontSize: ms(14),
  },
  speciesDropdownText: {
    fontSize: ms(14),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.titleDark,
  },
  speciesDropdownTextActive: {
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.petAlertsDeepPurple,
  },
  dropdownActiveBadge: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: colors.reunite.foundBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: ms(4),
    marginHorizontal: s(8),
  },
  sortText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.sortText,
  },

  /* ── Empty State Card Matching Design ── */
  emptyStateCard: {
    backgroundColor: colors.reunite.emptyCardBg,
    borderRadius: s(24),
    paddingVertical: s(24),
    paddingHorizontal: s(18),
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.reunite.emptyCardBorder,
    marginBottom: s(24),
    ...Platform.select({
      ios: {
        shadowColor: colors.card3D.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  polaroidContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: s(94),
    marginBottom: s(12),
  },
  polaroidCard: {
    width: s(64),
    height: s(78),
    backgroundColor: colors.reunite.polaroidBg,
    borderRadius: s(8),
    padding: s(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.reunite.polaroidBorder,
    shadowColor: colors.card3D.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  polaroidLeft: {
    marginRight: -s(10),
    zIndex: 1,
  },
  polaroidCenter: {
    zIndex: 2,
  },
  polaroidRight: {
    marginLeft: -s(10),
    zIndex: 1,
  },
  polaroidTape: {
    position: 'absolute',
    top: -s(5),
    width: s(22),
    height: s(7),
    backgroundColor: colors.reunite.polaroidTape,
    borderRadius: s(2),
  },
  polaroidImgBox: {
    width: '100%',
    height: s(46),
    backgroundColor: colors.reunite.polaroidImgBox,
    borderRadius: s(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidPill: {
    marginTop: s(4),
    paddingHorizontal: s(6),
    paddingVertical: s(1.5),
    borderRadius: s(4),
  },
  polaroidPillText: {
    fontSize: s(7.5),
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.3,
  },

  emptyOverline: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.emptyOverline,
    letterSpacing: 0.8,
  },
  emptyTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.emptyTitle,
    marginTop: s(3),
  },
  emptyDesc: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.emptyDesc,
    textAlign: 'center',
    lineHeight: s(16.5),
    marginTop: s(4),
    maxWidth: '92%',
  },
  postPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.reunite.postPetBtnBg,
    borderRadius: s(20),
    paddingHorizontal: s(22),
    paddingVertical: s(10),
    marginTop: s(16),
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.lostBevelTop,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.postPetBtnBevelBottom,
    shadowColor: colors.reunite.postPetBtnShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  postPetBtnText: {
    color: colors.reunite.postPetBtnText,
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  postPetArrow: {
    marginLeft: s(6),
  },

  /* ── Section: Get local pet alerts (Royal Purple 3D Card) ── */
  alertCard: {
    backgroundColor: colors.reunite.alertBg,
    borderRadius: s(24),
    padding: s(20),
    marginBottom: s(16),
    overflow: 'hidden',
    position: 'relative',
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.alertBevelTop,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.alertBevelBottom,
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.alertShadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  alertSheenOverlay: {
    position: 'absolute',
    top: -s(80),
    left: -s(60),
    width: s(120),
    height: s(360),
  },
  alertBellSquircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(14),
    backgroundColor: colors.reunite.alertBellBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
  },
  alertOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.alertOverline,
    letterSpacing: 0.8,
  },
  alertTitle: {
    fontSize: s(16.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.alertTitle,
    marginTop: s(2),
  },
  alertSubtitle: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.alertSubtitle,
    marginTop: s(4),
    lineHeight: s(16),
    maxWidth: '90%',
  },
  setupAlertsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.reunite.alertBtnBg,
    borderRadius: s(16),
    paddingHorizontal: s(15),
    paddingVertical: s(8.5),
    alignSelf: 'flex-start',
    marginTop: s(14),
    borderTopWidth: 1.2,
    borderTopColor: colors.card3D.borderTop,
    borderBottomWidth: 3,
    borderBottomColor: colors.reunite.alertBtnBevelBottom,
  },
  setupAlertsBtnText: {
    color: colors.reunite.alertBtnText,
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
  },
  setupAlertsArrow: {
    marginLeft: s(5),
  },

  /* ── Section: COMMUNITY SAFETY (Soft Yellow 3D Card) ── */
  safetyCard: {
    backgroundColor: colors.reunite.safetyBg,
    borderRadius: s(22),
    padding: s(18),
    borderTopWidth: 1.5,
    borderTopColor: colors.reunite.safetyBevelTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.reunite.safetyBorder,
    borderRightColor: colors.reunite.safetyBorder,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.safetyBevelBottom,
    marginBottom: s(24),
    ...Platform.select({
      ios: {
        shadowColor: colors.reunite.safetyShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  safetyIconSquircle: {
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: colors.reunite.safetyIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(10),
  },
  safetyOverline: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.safetyOverline,
    letterSpacing: 0.8,
  },
  safetyTitle: {
    fontSize: s(14.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.safetyTitle,
    marginTop: s(2),
  },
  safetyDesc: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.safetyDesc,
    lineHeight: s(16),
    marginTop: s(4),
  },
  safetyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(10),
  },
  safetyLinkText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.safetyLink,
  },
  safetyLinkArrow: {
    marginLeft: s(4),
  },

  /* ── How Reunite Works (3D Bevel Step Cards) ── */
  howItWorksTop: {
    marginTop: s(4),
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.reunite.stepCardBg,
    borderRadius: s(18),
    padding: s(14),
    borderTopWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.reunite.stepCardBorder,
    borderRightColor: colors.reunite.stepCardBorder,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.reunite.stepCardBevelBottom,
    marginBottom: s(10),
    ...Platform.select({
      ios: {
        shadowColor: colors.card3D.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stepPillBadge: {
    width: s(36),
    height: s(36),
    borderRadius: s(12),
    backgroundColor: colors.reunite.stepPillBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(14),
  },
  stepPillNumber: {
    fontSize: s(13),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.stepPillText,
  },
  stepTextGroup: {
    flex: 1,
  },
  stepTitle: {
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.stepTitle,
  },
  stepDesc: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.stepDesc,
    marginTop: s(2),
  },

  /* ── Active Community Post Card ── */
  communityPostCard: {
    backgroundColor: colors.surface,
    borderRadius: s(18),
    padding: s(16),
    marginBottom: s(12),
    borderTopWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomWidth: 3.5,
    borderBottomColor: colors.card3D.borderBottom,
    elevation: 3,
  },
  postCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postBadge: {
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(8),
  },
  postBadgeText: {
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.bold,
  },
  badgeLost: {
    backgroundColor: colors.reunite.badgeLostBg,
  },
  badgeFound: {
    backgroundColor: colors.reunite.badgeFoundBg,
  },
  badgeAdopt: {
    backgroundColor: colors.reunite.badgeAdoptBg,
  },
  badgeTextLost: {
    color: colors.reunite.badgeLostText,
  },
  badgeTextFound: {
    color: colors.reunite.badgeFoundText,
  },
  badgeTextAdopt: {
    color: colors.reunite.badgeAdoptText,
  },
  postTimeText: {
    fontSize: s(10.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textLightMuted,
  },
  postName: {
    fontSize: s(15),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
    marginTop: s(6),
  },
  postBreed: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.primary,
    marginTop: s(1),
  },
  postLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(6),
  },
  postLocationText: {
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    marginLeft: s(4),
  },

  /* ── Modals & Form Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.reunite.modalSheetBg,
    borderTopLeftRadius: s(24),
    borderTopRightRadius: s(24),
    padding: s(20),
    maxHeight: '85%',
  },
  sheetHandle: {
    width: s(40),
    height: s(4),
    borderRadius: s(2),
    backgroundColor: colors.reunite.modalHandle,
    alignSelf: 'center',
    marginBottom: s(14),
  },
  modalHeaderTitle: {
    fontSize: s(17),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
  },
  modalHeaderSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    marginTop: s(2),
    marginBottom: s(16),
  },
  formTypesRow: {
    flexDirection: 'row',
    gap: s(8),
    marginBottom: s(14),
  },
  formTypeBtn: {
    flex: 1,
    paddingVertical: s(8),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: colors.reunite.modalFieldBorder,
    alignItems: 'center',
    backgroundColor: colors.reunite.modalFieldBg,
  },
  formTypeLostActive: {
    backgroundColor: colors.reunite.lostGradient[0],
    borderColor: colors.reunite.lostGradient[0],
  },
  formTypeFoundActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formTypeAdoptActive: {
    backgroundColor: colors.reunite.adoptIconColor,
    borderColor: colors.reunite.adoptIconColor,
  },
  formTypeBtnText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.textMuted,
  },
  formTypeBtnTextActive: {
    color: colors.surface,
    fontFamily: theme.typography.fontFamily.bold,
  },
  fieldLabel: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.text,
    marginBottom: s(5),
    marginTop: s(10),
  },
  fieldInput: {
    backgroundColor: colors.reunite.modalFieldBg,
    borderWidth: 1,
    borderColor: colors.reunite.modalFieldBorder,
    borderRadius: s(10),
    paddingHorizontal: s(12),
    paddingVertical: s(9),
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.modalFieldText,
  },
  submitReportBtn: {
    marginTop: s(20),
    marginBottom: s(20),
    borderRadius: s(14),
    overflow: 'hidden',
  },
  submitReportGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(12),
    gap: s(6),
  },
  submitReportText: {
    color: colors.surface,
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
  },

  /* ── Ultra-Premium 3D Modal Card Styles ── */
  premiumModalCard: {
    backgroundColor: colors.surface,
    borderRadius: s(26),
    marginHorizontal: s(20),
    alignSelf: 'center',
    paddingHorizontal: s(20),
    paddingTop: s(22),
    paddingBottom: s(14),
    alignItems: 'center',
    position: 'relative',
    width: '90%',
    maxWidth: s(360),
    borderTopWidth: 1.5,
    borderTopColor: colors.card3D.borderTop,
    borderLeftWidth: 1.2,
    borderRightWidth: 1.2,
    borderLeftColor: colors.card3D.borderSides,
    borderRightColor: colors.card3D.borderSides,
    borderBottomWidth: 4,
    borderBottomColor: colors.card3D.borderBottom,
    ...Platform.select({
      ios: {
        shadowColor: colors.card3D.shadow,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 28,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalCloseCircle: {
    position: 'absolute',
    top: s(14),
    right: s(14),
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: colors.reunite.navBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  alertModalIconSquircle: {
    width: s(60),
    height: s(60),
    borderRadius: s(20),
    backgroundColor: colors.reunite.foundBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
    borderWidth: 1.5,
    borderColor: colors.reunite.foundBorder,
    position: 'relative',
  },
  safetyModalIconSquircle: {
    width: s(60),
    height: s(60),
    borderRadius: s(20),
    backgroundColor: colors.reunite.modalShieldBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
    borderWidth: 1.5,
    borderColor: colors.reunite.adoptBorder,
    position: 'relative',
  },
  alertModalDotBadge: {
    position: 'absolute',
    bottom: -s(2),
    right: -s(2),
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: colors.reunite.heroSparkleBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  safetyModalDotBadge: {
    position: 'absolute',
    bottom: -s(2),
    right: -s(2),
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: colors.reunite.modalShieldIcon,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  premiumModalTitle: {
    fontSize: s(17.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
    textAlign: 'center',
    marginBottom: s(4),
  },
  premiumModalSubtitle: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
    lineHeight: s(16),
    textAlign: 'center',
    marginBottom: s(14),
    paddingHorizontal: s(6),
  },
  modalBulletsContainer: {
    width: '100%',
    backgroundColor: '#FAF8F4',
    borderRadius: s(16),
    padding: s(12),
    gap: s(8),
    marginBottom: s(16),
    borderWidth: 1,
    borderColor: '#ECE6DA',
  },
  modalBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletCheckCircle: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: colors.reunite.foundBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(9),
  },
  bulletCheckGreen: {
    backgroundColor: colors.reunite.adoptBg,
  },
  modalBulletText: {
    flex: 1,
    fontSize: s(11),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.titleDark,
    lineHeight: s(15),
  },
  modalPrimaryBtn: {
    width: '100%',
    borderRadius: s(15),
    overflow: 'hidden',
    borderTopWidth: 1.2,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 3.5,
    borderBottomColor: colors.primaryDark,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(11),
    gap: s(6),
  },
  modalPrimaryBtnText: {
    color: colors.surface,
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
  modalSecondaryBtn: {
    paddingVertical: s(8),
    marginTop: s(4),
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.textLightMuted,
  },

  /* ── Luxury Dark Mode Theme Overrides ── */
  containerDark: {
    backgroundColor: '#0F071D',
  },
  ambientGlowDark: {
    opacity: 0,
    backgroundColor: 'transparent',
  },
  navBarDark: {
    backgroundColor: '#0F071D',
    borderBottomColor: '#260F45',
  },
  navRoundBtnDark: {
    backgroundColor: '#1E0E38',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#16092E',
    shadowColor: '#000000',
  },
  navOverlineDark: {
    color: '#A78BFA',
  },
  navTitleDark: {
    color: '#FFFFFF',
  },
  sectionOverlineDark: {
    color: '#A78BFA',
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  changeLocationBtnDark: {
    backgroundColor: '#1E0E38',
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#2E1654',
  },
  changeLocationTextDark: {
    color: '#F43F5E',
  },
  foundPetCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#3B1D6E',
    borderLeftColor: '#2E1654',
    borderRightColor: '#2E1654',
    borderBottomColor: '#120524',
    shadowColor: '#000000',
  },
  foundIconSquircleDark: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderTopColor: '#3B1D6E',
    borderBottomColor: '#1E0E38',
  },
  foundCardTitleDark: {
    color: '#FFFFFF',
  },
  foundCardSubtitleDark: {
    color: '#C4B5FD',
  },
  foundArrowCircleDark: {
    backgroundColor: '#261047',
  },
  adoptPetCardDark: {
    backgroundColor: '#0B231D',
    borderTopColor: '#134E48',
    borderLeftColor: '#0F3A33',
    borderRightColor: '#0F3A33',
    borderBottomColor: '#061C19',
    shadowColor: '#000000',
  },
  adoptIconSquircleDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderTopColor: '#134E48',
    borderBottomColor: '#0A2E25',
  },
  adoptCardTitleDark: {
    color: '#FFFFFF',
  },
  adoptCardSubtitleDark: {
    color: '#A7F3D0',
  },
  adoptArrowCircleDark: {
    backgroundColor: '#0A3328',
  },
  tabsTrackDark: {
    backgroundColor: '#170A2E',
    borderWidth: 1,
    borderColor: '#2E1654',
  },
  tabSegmentDark: {
    backgroundColor: 'transparent',
  },
  tabSegmentActiveDark: {
    backgroundColor: '#7B2CFF',
    borderTopColor: '#9D5CFF',
    borderBottomColor: '#5B19BD',
  },
  tabSegmentTextDark: {
    color: '#94A3B8',
  },
  tabSegmentTextActiveDark: {
    color: '#FFFFFF',
  },
  allPetsPillDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#120524',
  },
  allPetsPillActiveDark: {
    backgroundColor: '#261047',
    borderColor: '#7C3AED',
  },
  allPetsTextDark: {
    color: '#FFFFFF',
  },
  allPetsTextActiveDark: {
    color: '#C084FC',
  },
  sortTextDark: {
    color: '#94A3B8',
  },
  speciesDropdownCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#3B1D6E',
    borderLeftColor: '#2E1654',
    borderRightColor: '#2E1654',
    borderBottomColor: '#120524',
    shadowColor: '#000000',
  },
  speciesDropdownItemActiveDark: {
    backgroundColor: '#261047',
  },
  speciesEmojiBoxDark: {
    backgroundColor: '#210D3D',
  },
  speciesEmojiBoxActiveDark: {
    backgroundColor: '#3B1669',
  },
  speciesDropdownTextDark: {
    color: '#E2E8F0',
  },
  speciesDropdownTextActiveDark: {
    color: '#FFFFFF',
  },
  dropdownActiveBadgeDark: {
    backgroundColor: '#261047',
  },
  dropdownDividerDark: {
    backgroundColor: '#2E1654',
  },
  emptyStateCardDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  polaroidCardDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#3B1D6E',
    shadowColor: '#000000',
  },
  polaroidTapeDark: {
    backgroundColor: 'rgba(251, 191, 36, 0.45)',
  },
  polaroidImgBoxDark: {
    backgroundColor: '#130624',
  },
  emptyOverlineDark: {
    color: '#F43F5E',
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyDescDark: {
    color: '#C4B5FD',
  },
  safetyCardDark: {
    backgroundColor: '#241604',
    borderTopColor: '#78350F',
    borderLeftColor: '#451A03',
    borderRightColor: '#451A03',
    borderBottomColor: '#290E02',
  },
  safetyIconSquircleDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
  },
  safetyOverlineDark: {
    color: '#FBBF24',
  },
  safetyTitleDark: {
    color: '#FEF3C7',
  },
  safetyDescDark: {
    color: '#FDE68A',
  },
  safetyLinkTextDark: {
    color: '#FBBF24',
  },
  stepCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#120524',
  },
  stepPillBadgeDark: {
    backgroundColor: '#261047',
  },
  stepPillNumberDark: {
    color: '#F43F5E',
  },
  stepTitleDark: {
    color: '#FFFFFF',
  },
  stepDescDark: {
    color: '#C4B5FD',
  },
  communityPostCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#2E1654',
    borderLeftColor: '#260F45',
    borderRightColor: '#260F45',
    borderBottomColor: '#120524',
  },
  postNameDark: {
    color: '#FFFFFF',
  },
  postBreedDark: {
    color: '#A78BFA',
  },
  postLocationTextDark: {
    color: '#94A3B8',
  },
  premiumModalCardDark: {
    backgroundColor: '#170A2E',
    borderTopColor: '#3B1D6E',
    borderLeftColor: '#2E1654',
    borderRightColor: '#2E1654',
    borderBottomColor: '#120524',
  },
  modalCloseCircleDark: {
    backgroundColor: '#261047',
  },
  safetyModalIconSquircleDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: '#134E48',
  },
  premiumModalTitleDark: {
    color: '#FFFFFF',
  },
  premiumModalSubtitleDark: {
    color: '#C4B5FD',
  },
  modalBulletsContainerDark: {
    backgroundColor: '#1E0E38',
    borderColor: '#2E1654',
  },
  modalBulletTextDark: {
    color: '#E2E8F0',
  },
  bulletCheckCircleDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
});

export default ReuniteScreen;
