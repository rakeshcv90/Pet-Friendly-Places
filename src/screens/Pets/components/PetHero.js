import React from 'react';
import { Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { NightSky } from '../../Community/NightSky';

const PURPLE = '#7B2CFF';
export const DEEP_PURPLE = '#3B108F';

// The purple night-sky header used by the pet screens
export const PetHero = ({ title, subtitle, backLabel = '🐾 Back', onBack, children }) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[DEEP_PURPLE, PURPLE]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(8) }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[DEEP_PURPLE, 'rgba(59,16,143,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.topFade, { height: insets.top + s(70) }]}
      />
      <NightSky topInset={insets.top} />
      <BouncyPressable
        testID="pet-hero-back"
        accessibilityLabel="Back"
        activeScale={0.95}
        onPress={onBack}
        style={styles.back}>
        <Feather name="chevron-left" size={ms(15)} color="rgba(255,255,255,0.8)" />
        <Text style={styles.backText}>{backLabel}</Text>
      </BouncyPressable>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: s(15),
    paddingBottom: s(18),
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
  },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(2),
    marginBottom: s(10),
    marginLeft: -s(4),
  },
  backText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: 'rgba(255,255,255,0.78)',
  },
  title: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    lineHeight: s(27),
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: s(4),
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(18),
    color: 'rgba(255,255,255,0.85)',
  },
});
