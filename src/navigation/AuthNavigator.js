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

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      <Stack.Screen name="SetNewPassword" component={SetNewPasswordScreen} />
      <Stack.Screen name="PasswordResetSuccess" component={PasswordResetSuccessScreen} />
    </Stack.Navigator>
  );
};
