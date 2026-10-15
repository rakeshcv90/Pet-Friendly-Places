/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { View, Text, StyleSheet } from 'react-native';
import { HomeScreen } from '../screens/Home';
import { ExploreScreen } from '../screens/Explore';
import { MapScreen } from '../screens/Map';
import { SavedScreen } from '../screens/Saved';
import { ProfileScreen } from '../screens/Profile';
import { theme } from '../theme';

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});



const createTabBarIcon =
  (activeIcon, inactiveIcon) =>
  ({ focused, color }) =>
    <Icon name={focused ? activeIcon : inactiveIcon} size={24} color={color} />;

const createTabBarLabel =
  routeName =>
  ({ focused, color }) =>
    (
      <Text style={[styles.tabBarLabel, { color, fontWeight: focused ? 'bold' : '500' }]}>
        {routeName}
      </Text>
    );

const TabIcons = {
  Home: createTabBarIcon('home', 'home-outline'),
  Explore: createTabBarIcon('search', 'search-outline'),
  Map: createTabBarIcon('map', 'map-outline'),
  Saved: createTabBarIcon('heart', 'heart-outline'),
  Profile: createTabBarIcon('person', 'person-outline'),
};

const TabLabels = {
  Home: createTabBarLabel('Home'),
  Explore: createTabBarLabel('Explore'),
  Map: createTabBarLabel('Map'),
  Saved: createTabBarLabel('Saved'),
  Profile: createTabBarLabel('Profile'),
};

const Tab = createBottomTabNavigator();

export const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 60 + Math.max(insets.bottom, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ],
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: TabIcons.Home, tabBarLabel: TabLabels.Home }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarIcon: TabIcons.Explore, tabBarLabel: TabLabels.Explore }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarIcon: TabIcons.Map, tabBarLabel: TabLabels.Map }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{ tabBarIcon: TabIcons.Saved, tabBarLabel: TabLabels.Saved }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: TabIcons.Profile, tabBarLabel: TabLabels.Profile }}
      />
    </Tab.Navigator>
  );
};
