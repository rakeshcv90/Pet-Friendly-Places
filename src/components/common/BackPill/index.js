import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { s, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { BouncyPressable } from '../BouncyPressable';

// The back button used on the purple hero headers: a round glass chevron inside a soft pill with a
// short label. The whole pill is tappable.
export const BackPill = ({ onPress, label = '🐾 Back', testID, style }) => (
  <BouncyPressable
    testID={testID}
    accessibilityRole="button"
    accessibilityLabel="Back"
    activeScale={0.93}
    onPress={onPress}
    style={[styles.pill, style]}>
    <View style={styles.circle}>
      <Feather name="chevron-left" size={ms(20)} color="#FFFFFF" />
    </View>
    <Text style={styles.label}>{label}</Text>
  </BouncyPressable>
);

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(8),
    paddingRight: s(14),
    borderRadius: s(20),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  circle: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12.5),
    color: 'rgba(255,255,255,0.92)',
  },
});
