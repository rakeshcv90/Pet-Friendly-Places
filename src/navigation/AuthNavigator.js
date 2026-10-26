import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/Auth/Login';
import { RegisterScreen } from '../screens/Auth/Register';
import { ForgotPasswordScreen } from '../screens/Auth/ForgotPassword';
import { VerifyOTPScreen } from '../screens/Auth/VerifyOTP';
import { SetNewPasswordScreen } from '../screens/Auth/SetNewPassword';
import { PasswordResetSuccessScreen } from '../screens/Auth/PasswordResetSuccess';
import { OnboardingScreen } from '../screens/Auth/Onboarding';
import { SplashScreen } from '../screens/Splash';
import MainSplash from '../screens/Splash/MainSplash';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'ios_from_right',
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
      initialRouteName="Splash">
      <Stack.Screen
        name="MainSplash"
        component={MainSplash}
        options={{ animation: 'fade', animationDuration: 350 }}
      />
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animation: 'fade', animationDuration: 350 }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ animation: 'fade', animationDuration: 350 }}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
      <Stack.Screen
        name="PasswordResetSuccess"
        component={PasswordResetSuccessScreen}
        options={{ animation: 'fade_from_bottom' }}
      />
    </Stack.Navigator>
  );
};
