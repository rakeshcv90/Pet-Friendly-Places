import React from 'react';
import { StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { BouncyPressable } from '../BouncyPressable';

// The app's standard back button: a white rounded square with a soft shadow and a dark arrow, as on
// the Cities list. `dark` gives the dark-theme version.
export const BackButton = ({ onPress, testID, dark = false, style }) => (
  <BouncyPressable
    testID={testID}
    accessibilityRole="button"
    accessibilityLabel="Back"
    activeScale={0.88}
    onPress={onPress}
    style={[styles.button, dark && styles.buttonDark, style]}>
    <Feather name="arrow-left" size={ms(18)} color={dark ? '#FFFFFF' : '#1E1035'} />
  </BouncyPressable>
);

const styles = StyleSheet.create({
  button: {
    width: s(38),
    height: s(38),
    borderRadius: s(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE8F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E1035',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDark: { backgroundColor: '#1E0E38', borderColor: '#2E1654' },
});
