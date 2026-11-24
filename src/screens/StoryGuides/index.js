import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Pressable,
  Dimensions,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme, colors } from '../../theme';
import { useStore } from '../../store';
import { AppHeader } from '../../components/common/AppHeader';
import { TravelStoryScreen } from '../Home/TravelStoryScreen';
import { GuidesScreen } from './GuidesScreen';
import { LoaderCard } from '../../components/common/Loader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_TRACK_WIDTH = Math.max(0, Math.round(SCREEN_WIDTH - s(30)));
const HEADER_COLLAPSE_DISTANCE = s(74);

const TABS = [
  {
    key: 'stories',
    label: 'Travel Story',
    icon: 'book',
    iconOutline: 'book-outline',
    testID: 'tab-travel-stories',
  },
  {
    key: 'guides',
    label: 'Guides',
    icon: 'map',
    iconOutline: 'map-outline',
    testID: 'tab-guides',
  },
];

const resolveTab = value => (value === 'guides' || value === 'routes' ? 'guides' : 'stories');


const TabButton = React.memo(function TabButton({ tab, isActive, isDarkMode, iconScale, onPress }) {
  let iconColor = isDarkMode ? '#94A3B8' : '#64748B';
  if (isActive) {
    iconColor = isDarkMode ? '#C4B5FD' : '#7C3AED';
  }

  return (
    <Pressable
      testID={tab.testID}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      style={styles.segmentTab}
      onPress={() => onPress(tab.key)}>
      <View style={styles.tabInnerRow}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons
            name={isActive ? tab.icon : tab.iconOutline}
            size={ms(14.5)}
            color={iconColor}
          />
        </Animated.View>
        <Text
          style={[
            styles.segmentTabText,
            isDarkMode && styles.segmentTabTextDark,
            isActive &&
              (isDarkMode ? styles.segmentTabTextActiveDark : styles.segmentTabTextActive),
          ]}>
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
});


const Pane = ({ isActive, isMounted, children }) => (
  <View
    style={[styles.paneItem, isActive ? styles.paneActive : styles.paneHidden]}
    pointerEvents={isActive ? 'auto' : 'none'}
    accessibilityElementsHidden={!isActive}
    importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}>
    {isMounted ? (
      children
    ) : (
      <View style={styles.panePlaceholder}>
        <LoaderCard label="Loading…" />
      </View>
    )}
  </View>
);

export const StoryGuidesScreen = React.memo(function StoryGuidesScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;

  const initialTab = resolveTab(route?.params?.initialTab);
  const [activeTab, setActiveTab] = useState(initialTab); // 'stories' | 'guides'
  const activeTabRef = useRef(initialTab);
  const [trackWidth, setTrackWidth] = useState(DEFAULT_TRACK_WIDTH);

  const [mounted, setMounted] = useState({
    stories: initialTab === 'stories',
    guides: initialTab === 'guides',
  });

  useEffect(() => {
    let timer;
    let idle;
    const warmUp = () => {
      timer = setTimeout(() => setMounted({ stories: true, guides: true }), 300);
    };
    if (typeof requestIdleCallback === 'function') {
      idle = requestIdleCallback(warmUp, { timeout: 2000 });
    } else {
      warmUp();
    }
    return () => {
      if (idle !== undefined && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idle);
      }
      clearTimeout(timer);
    };
  }, []);

  const slideAnim = useRef(new Animated.Value(initialTab === 'guides' ? 1 : 0)).current;
  const iconScales = useRef({
    stories: new Animated.Value(initialTab === 'stories' ? 1.05 : 1),
    guides: new Animated.Value(initialTab === 'guides' ? 1.05 : 1),
  }).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const isHeaderHidden = useRef(false);
  const lastScrollY = useRef(0);

  const headerOpacity = useMemo(
    () =>
      headerTranslateY.interpolate({
        inputRange: [-HEADER_COLLAPSE_DISTANCE, -HEADER_COLLAPSE_DISTANCE * 0.4, 0],
        outputRange: [0, 0.4, 1],
        extrapolate: 'clamp',
      }),
    [headerTranslateY],
  );

  const setHeaderHidden = useCallback(
    hidden => {
      if (isHeaderHidden.current === hidden) {
        return;
      }
      isHeaderHidden.current = hidden;
      Animated.timing(headerTranslateY, {
        toValue: hidden ? -HEADER_COLLAPSE_DISTANCE : 0,
        duration: hidden ? 240 : 220,
        useNativeDriver: true,
      }).start();
    },
    [headerTranslateY],
  );

  const onScroll = useCallback(
    event => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const diff = currentScrollY - lastScrollY.current;

      if (currentScrollY <= 15) {
        // near the top: always show the header
        setHeaderHidden(false);
        lastScrollY.current = Math.max(0, currentScrollY);
        return;
      }
      if (diff > 8 && currentScrollY > 40) {
        setHeaderHidden(true); // scrolling down
      } else if (diff < -8) {
        setHeaderHidden(false); // scrolling up
      }
      lastScrollY.current = currentScrollY;
    },
    [setHeaderHidden],
  );

 
  const handleTabSwitch = useCallback(
    tabKey => {
      if (tabKey === activeTabRef.current) {
        return;
      }
      activeTabRef.current = tabKey;
      setActiveTab(tabKey);
      setMounted(prev => (prev[tabKey] ? prev : { ...prev, [tabKey]: true }));

      setHeaderHidden(false);
      lastScrollY.current = 0;

      Animated.timing(slideAnim, {
        toValue: tabKey === 'guides' ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      const other = tabKey === 'stories' ? 'guides' : 'stories';
      iconScales[tabKey].setValue(0.82);
      Animated.spring(iconScales[tabKey], {
        toValue: 1.05,
        friction: 4,
        tension: 110,
        useNativeDriver: true,
      }).start();
      Animated.spring(iconScales[other], {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    },
    [slideAnim, iconScales, setHeaderHidden],
  );

  const tabRequest = route?.params?.tabRequest;
  const requestedTab = route?.params?.initialTab;
  useEffect(() => {
    if (tabRequest) {
      handleTabSwitch(resolveTab(requestedTab));
    }
  }, [tabRequest, requestedTab, handleTabSwitch]);

  const tabWidth = trackWidth > 0 ? (trackWidth - s(8)) / 2 : 0;
  const pillTranslateX = useMemo(
    () =>
      slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, tabWidth],
        extrapolate: 'clamp',
      }),
    [slideAnim, tabWidth],
  );

  const onTrackLayout = useCallback(e => {
    const w = e.nativeEvent.layout.width;
    setTrackWidth(prev => (w > 0 && Math.abs(w - prev) > 2 ? w : prev));
  }, []);

  const topHeader = useMemo(
    () => (
      <AppHeader
        // title=""
        showSearch={false}
        onAvatarPress={() => navigation?.navigate?.('Profile')}
      />
    ),
    [navigation],
  );

  const statusInset = Math.max(insets.top, Platform.OS === 'android' ? vs(8) : vs(4));

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : colors.background}
      />

     
      <View
        style={[styles.statusBarCover, isDarkMode && styles.statusBarCoverDark, { height: statusInset }]}
        pointerEvents="none"
      />


      <Animated.View
        style={[
          styles.collapsibleMainContainer,
          { paddingTop: statusInset, transform: [{ translateY: headerTranslateY }] },
        ]}>
        <Animated.View style={{ opacity: headerOpacity }}>{topHeader}</Animated.View>

   
        <View
          style={[styles.segmentTrack, isDarkMode && styles.segmentTrackDark]}
          onLayout={onTrackLayout}>
          {tabWidth > 0 && (
            <Animated.View
              style={[
                styles.slidingPill,
                isDarkMode && styles.slidingPillDark,
                { width: tabWidth, transform: [{ translateX: pillTranslateX }] },
              ]}
              pointerEvents="none"
            />
          )}
          {TABS.map(tab => (
            <TabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              isDarkMode={isDarkMode}
              iconScale={iconScales[tab.key]}
              onPress={handleTabSwitch}
            />
          ))}
        </View>

     
        <View style={styles.contentWrap}>
          <Pane isActive={activeTab === 'stories'} isMounted={mounted.stories}>
            <TravelStoryScreen navigation={navigation} route={route} hideTopNav onScroll={onScroll} />
          </Pane>
          <Pane isActive={activeTab === 'guides'} isMounted={mounted.guides}>
            <GuidesScreen navigation={navigation} route={route} onScroll={onScroll} />
          </Pane>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  statusBarCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF7F2',
    zIndex: 10,
  },
  statusBarCoverDark: {
    backgroundColor: '#0F071D',
  },
  collapsibleMainContainer: {
    flex: 1,
    marginBottom: -s(74),
    zIndex: 1,
  },
  segmentTrack: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: s(16),
    marginTop: vs(2),
    marginBottom: vs(8),
    padding: s(4),
    borderRadius: s(15),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 1,
  },
  segmentTrackDark: {
    backgroundColor: '#1A0B30',
    borderColor: '#2E1654',
  },
  slidingPill: {
    position: 'absolute',
    top: s(4),
    left: s(4),
    bottom: s(4),
    backgroundColor: '#FFFFFF',
    borderRadius: s(12),
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: '#F3EFE6',
    borderRightColor: '#F3EFE6',
    borderBottomWidth: 3,
    borderBottomColor: '#DCD4C6',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  slidingPillDark: {
    backgroundColor: '#2A1245',
    borderTopColor: '#3E1B66',
    borderLeftColor: '#351458',
    borderRightColor: '#351458',
    borderBottomColor: '#180B2E',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(8),
    borderRadius: s(12),
    zIndex: 2,
  },
  tabInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
  },
  segmentTabText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#64748B',
  },
  segmentTabTextDark: {
    color: '#94A3B8',
  },
  segmentTabTextActive: {
    color: '#7C3AED',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  segmentTabTextActiveDark: {
    color: '#C4B5FD',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  contentWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  horizontalTrack: {
    flex: 1,
    flexDirection: 'row',
  },
  paneItem: {
    ...StyleSheet.absoluteFillObject,
  },
  paneActive: {
    opacity: 1,
    zIndex: 1,
  },
  paneHidden: {
    opacity: 0,
    zIndex: 0,
  },
  panePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { GuidesScreen } from './GuidesScreen';
export { GuideDetailScreen } from './GuideDetailScreen';
export { ListingDetailScreen } from './ListingDetailScreen';
export default StoryGuidesScreen;
