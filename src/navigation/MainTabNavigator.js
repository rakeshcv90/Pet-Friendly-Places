import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { s, ms } from 'react-native-size-matters';
import { HomeScreen } from '../screens/Home';
import { ExploreScreen } from '../screens/Explore';
import { ProfileScreen } from '../screens/Profile';
import { theme } from '../theme';
import { useStore } from '../store';
import { StoryGuidesScreen } from '../screens/StoryGuides';
import { SavedScreen } from '../screens/Saved';

const TAB_CONFIG = {
  Home: {
    icon: 'home-outline',
    activeIcon: 'home',
    label: 'Home',
  },
  'Story & Guides': {
    icon: 'book-outline',
    activeIcon: 'book',
    label: 'Story & Guides',
  },
  Explore: {
    icon: 'search',
    activeIcon: 'search',
    label: 'Explore',
  },
  Community: {
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
    label: 'Community',
  },
  Profile: {
    icon: 'person-outline',
    activeIcon: 'person',
    label: 'Profile',
  },
  Map: {
    icon: 'book-outline',
    activeIcon: 'book',
    label: 'Story & Guides',
  },
  Saved: {
    icon: 'chatbubbles-outline',
    activeIcon: 'chatbubbles',
    label: 'Community',
  },
};

/* ── Compact Animated Tab Button ───────────────────────── */
const TabButton = ({ route, isFocused, onPress, onLongPress, isDarkMode, accentColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isFocused, activeAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 240,
      friction: 9,
      useNativeDriver: true,
    }).start();
  };

  const isExplore = route.name === 'Explore';
  const config = TAB_CONFIG[route.name] || {
    icon: 'apps-outline',
    activeIcon: 'apps',
    label: route.name,
  };

  const primaryAccent = accentColor || '#7C3AED';

  // Smooth background color interpolation (no sudden pop)
  const squircleBg = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDarkMode ? 'rgba(30, 16, 53, 0)' : 'rgba(124, 58, 237, 0)',
      primaryAccent,
    ],
  });

  const squircleScale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const labelColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? '#94A3B8' : '#8E8E93', primaryAccent],
  });

  const labelOpacity = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1],
  });

  const indicatorWidth = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, s(16)],
  });

  const indicatorOpacity = activeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  if (isExplore) {
    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.tabItem}>
        <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.exploreOuterPod, isDarkMode && styles.exploreOuterPodDark]}>
            <LinearGradient
              colors={['#EE2A7B', '#A855F7', '#8233FE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.exploreGradientBtn}>
              <Ionicons name="search" size={ms(18)} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.tabLabel,
              isDarkMode && styles.tabLabelDark,
              styles.exploreLabel,
              isDarkMode && styles.exploreLabelDark,
              isFocused && [styles.exploreLabelActive, isDarkMode && styles.exploreLabelActiveDark],
              { opacity: labelOpacity },
            ]}>
            Explore
          </Animated.Text>
          <Animated.View
            style={[
              styles.activeTabIndicatorPill,
              {
                width: indicatorWidth,
                opacity: indicatorOpacity,
                backgroundColor: primaryAccent,
              },
            ]}
          />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}>
      <Animated.View style={[styles.tabContent, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.View
          style={[
            styles.iconSquircleBase,
            {
              backgroundColor: squircleBg,
              transform: [{ scale: squircleScale }],
            },
          ]}>
          <Ionicons
            name={isFocused ? config.activeIcon : config.icon}
            size={ms(18)}
            color={isFocused ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#8E8E93'}
          />
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.tabLabel,
            isDarkMode && styles.tabLabelDark,
            isFocused && styles.activeTabLabelFont,
            { color: labelColor, opacity: labelOpacity },
          ]}>
          {config.label}
        </Animated.Text>
        <Animated.View
          style={[
            styles.activeTabIndicatorPill,
            {
              width: indicatorWidth,
              opacity: indicatorOpacity,
              backgroundColor: primaryAccent,
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

/* ── Custom Tab Bar ────────────────────────────────────── */
const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(st => st.isDarkMode);
  const accentColor = useStore(st => st.accentColor);
  const [optimisticIndex, setOptimisticIndex] = useState(state.index);

  useEffect(() => {
    setOptimisticIndex(state.index);
  }, [state.index]);

  return (
    <View
      style={[
        styles.tabBarContainer,
        isDarkMode && styles.tabBarContainerDark,
        { paddingBottom: Math.max(insets.bottom, s(4)) },
      ]}>
      <View style={styles.tabButtonsRow}>
        {state.routes.map((route, index) => {
          const isFocused = optimisticIndex === index;

          const onPress = () => {
            if (state.index !== index) {
              setOptimisticIndex(index);
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (state.index !== index && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
          );
        })}
      </View>
    </View>
  );
};

const renderCustomTabBar = props => <CustomTabBar {...props} />;

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const isDarkMode = useStore(st => st.isDarkMode);

  return (
    <Tab.Navigator
      tabBar={renderCustomTabBar}
      sceneContainerStyle={isDarkMode ? styles.sceneDark : styles.sceneLight}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: false,
        animation: 'fade',
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Story & Guides"
        component={StoryGuidesScreen}
        options={{ lazy: false }}
      />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Community" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  sceneLight: {
    backgroundColor: '#FAF7F2',
  },
  sceneDark: {
    backgroundColor: '#0F071D',
  },
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3EFE6',
    paddingTop: s(4),
    ...Platform.select({
      ios: {
        shadowColor: '#1E1035',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabButtonsRow: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(1),
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Compact Active / Inactive icon containers */
  iconSquircleBase: {
    width: s(34),
    height: s(32),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Compact Explore center button */
  exploreOuterPod: {
    marginTop: -s(12),
    width: s(46),
    height: s(46),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8233FE',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  exploreGradientBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(13),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EE2A7B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  /* Compact Labels */
  tabLabel: {
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8E8E93',
    marginTop: s(2),
    textAlign: 'center',
  },
  activeTabLabelFont: {
    fontFamily: theme.typography.fontFamily.bold,
  },
  activeTabIndicatorPill: {
    height: s(2.5),
    borderRadius: s(1.5),
    marginTop: s(2),
  },
  exploreLabel: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1E1035',
  },
  exploreLabelDark: {
    color: '#94A3B8',
  },
  exploreLabelActive: {
    color: '#8233FE',
  },
  exploreLabelActiveDark: {
    color: '#FFFFFF',
  },
  tabBarContainerDark: {
    backgroundColor: '#0F071D',
    borderTopColor: '#260F45',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  exploreOuterPodDark: {
    backgroundColor: '#170A2E',
    borderWidth: 1.5,
    borderColor: '#2E1654',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  tabLabelDark: {
    color: '#94A3B8',
  },
});
