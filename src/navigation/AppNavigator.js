import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { SearchScreen, FilterScreen, CityList } from '../screens/Explore';
import { ReuniteScreen } from '../screens/Home';

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
    </Stack.Navigator>
  );
};
