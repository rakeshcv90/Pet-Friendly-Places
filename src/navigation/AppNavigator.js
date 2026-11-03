import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { SearchScreen, FilterScreen, CityList } from '../screens/Explore';
import {
  ReuniteScreen,
  TravelStoryScreen,
  RoadTripRoutesScreen,
  RoadTripDetailScreen,
  RoadTripStopDetailScreen,
} from '../screens/Home';
import { ChangePasswordScreen } from '../screens/Profile/ChangePasswordScreen';
import { ContactUsScreen } from '../screens/Profile/ContactUsScreen';
import { TailsGuideScreen } from '../screens/Profile/TailsGuideScreen';
import { PfpAssistantScreen } from '../screens/Profile/PfpAssistantScreen';
import { CreateTripScreen } from '../screens/Profile/CreateTripScreen';
import { CommunityPostsScreen } from '../screens/Profile/CommunityPostsScreen';
import { MyProfileScreen } from '../screens/Profile/MyProfileScreen';
import {
  StoryGuidesScreen,
  GuideDetailScreen,
  ListingDetailScreen,
} from '../screens/StoryGuides';
import { SavedScreen } from '../screens/Saved';
import { InAppBrowserScreen } from '../screens/Web/InAppBrowserScreen';
import { LeaderboardScreen } from '../screens/Leaderboard/LeaderboardScreen';
import {
  CommunityDetailScreen,
  PostDetailScreen,
  NewPostScreen,
} from '../screens/Community';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'ios_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animationDuration: 280,
      }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="FilterScreen"
        component={FilterScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          animationDuration: 280,
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ReuniteScreen"
        component={ReuniteScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="TravelStoryScreen"
        component={TravelStoryScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="RoadTripRoutesScreen"
        component={RoadTripRoutesScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="RoadTripDetailScreen"
        component={RoadTripDetailScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="RoadTripStopDetailScreen"
        component={RoadTripStopDetailScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CityList"
        component={CityList}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CityListScreen"
        component={CityList}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ContactUsScreen"
        component={ContactUsScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="TailsGuideScreen"
        component={TailsGuideScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="PfpAssistantScreen"
        component={PfpAssistantScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CreateTripScreen"
        component={CreateTripScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CommunityPostsScreen"
        component={CommunityPostsScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CommunityDetailScreen"
        component={CommunityDetailScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="LeaderboardScreen"
        component={LeaderboardScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="InAppBrowserScreen"
        component={InAppBrowserScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="NewPostScreen"
        component={NewPostScreen}
        options={{
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="CommunityPostDetailScreen"
        component={PostDetailScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="MyProfileScreen"
        component={MyProfileScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="StoryGuidesScreen"
        component={StoryGuidesScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="GuideDetailScreen"
        component={GuideDetailScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="ListingDetailScreen"
        component={ListingDetailScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="SavedScreen"
        component={SavedScreen}
        options={{
          animation: 'ios_from_right',
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};
