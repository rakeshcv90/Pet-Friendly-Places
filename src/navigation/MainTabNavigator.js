import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Platform, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { s, ms } from 'react-native-size-matters';
import { HomeScreen } from '../screens/Home';
import { ExploreScreen } from '../screens/Explore';
import { MapScreen } from '../screens/Map';
import { SavedScreen } from '../screens/Saved';
import { ProfileScreen } from '../screens/Profile';
import { theme } from '../theme';

import { useStore } from '../store';

const TAB_CONFIG = {
  Home: {
    icon: 'home-outline',
    activeIcon: 'home',
    label: 'Home',
  },
  Map: {
    icon: 'map-outline',
    activeIcon: 'map',
    label: 'Map',
  },
  Explore: {
    icon: 'search',
    activeIcon: 'search',
    label: 'Explore',
  },
  Saved: {
    icon: 'heart-outline',
    activeIcon: 'heart',
    label: 'Saved',
  },
  Profile: {
    icon: 'person-outline',
    activeIcon: 'person',
    label: 'Profile',
  },
};

/* ── Compact Animated Tab Button ───────────────────────── */
const TabButton = ({ route, isFocused, onPress, onLongPress, isDarkMode, accentColor }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const focusScale = useRef(new Animated.Value(isFocused ? 1.04 : 1)).current;
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0.65)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(focusScale, {
        toValue: isFocused ? 1.04 : 1,
        tension: 260,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.timing(labelOpacity, {
        toValue: isFocused ? 1 : 0.65,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, focusScale, labelOpacity]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 220,
      friction: 8,
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
            isFocused ? [styles.activeIconSquircle, { backgroundColor: primaryAccent, shadowColor: primaryAccent }] : styles.inactiveIconWrap,
            { transform: [{ scale: focusScale }] },
          ]}>
          <Ionicons
            name={isFocused ? config.activeIcon : config.icon}
            size={ms(18)}
            color={isFocused ? '#FFFFFF' : isDarkMode ? '#94A3B8' : '#8E8E93'}
          />
        </Animated.View>
        <Animated.Text
          style={[
            styles.tabLabel,
            isDarkMode && styles.tabLabelDark,
            isFocused && [styles.activeTabLabel, { color: primaryAccent }],
            { opacity: labelOpacity },
          ]}>
          {config.label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

/* ── Custom Tab Bar ────────────────────────────────────── */
const CustomTabBar = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(st => st.isDarkMode);
  const accentColor = useStore(st => st.accentColor);

  return (
    <View
      style={[
        styles.tabBarContainer,
        isDarkMode && styles.tabBarContainerDark,
        { paddingBottom: Math.max(insets.bottom, s(4)) },
      ]}>
      <View style={styles.tabButtonsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
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

/* ── Premium Parallax Shift & Fade Scene Transition ────── */
const tabSceneStyleInterpolator = ({ current }) => ({
  sceneStyle: {
    opacity: current.progress.interpolate({
      inputRange: [-1, -0.2, 0, 0.2, 1],
      outputRange: [0, 0.75, 1, 0.75, 0],
    }),
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [-24, 0, 24],
        }),
      },
    ],
  },
});

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={renderCustomTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyleInterpolator: tabSceneStyleInterpolator,
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 220,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          },
        },
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
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
  activeIconSquircle: {
    width: s(34),
    height: s(32),
    borderRadius: s(11),
    backgroundColor: '#8233FE',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8233FE',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inactiveIconWrap: {
    width: s(34),
    height: s(32),
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
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#8E8E93',
    marginTop: s(2),
  },
  activeTabLabel: {
    color: '#8233FE',
    fontFamily: theme.typography.fontFamily.bold,
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
