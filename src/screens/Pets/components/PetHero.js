import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { NightSky } from '../../Community/NightSky';
import { Bob, Enter } from '../../Community/Motion';

const PURPLE = '#7B2CFF';
export const DEEP_PURPLE = '#3B108F';

// Short gradient bar under the title that grows in once the header appears
const AccentBar = () => {
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(grow, {
      toValue: 1,
      duration: 700,
      delay: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [grow]);

  return (
    <Animated.View
      testID="pet-hero-accent"
      style={[
        styles.accentWrap,
        { width: grow.interpolate({ inputRange: [0, 1], outputRange: [0, s(46)] }) },
      ]}>
      <LinearGradient
        colors={['#FDE68A', '#F472B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

// The purple night-sky header used by the pet screens
export const PetHero = ({ title, subtitle, eyebrow, backLabel = '🐾 Back', onBack, children }) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#2A0A6B', PURPLE, '#A21CAF']}
      locations={[0, 0.62, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(8) }]}>
      <LinearGradient
        pointerEvents="none"
        colors={['#2A0A6B', 'rgba(42,10,107,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.topFade, { height: insets.top + s(70) }]}
      />

      {/* Soft glowing orbs that drift slowly */}
      <Bob style={styles.orbPink} distance={s(7)} duration={3200}>
        <View pointerEvents="none" style={styles.orbPinkInner} />
      </Bob>
      <Bob style={styles.orbBlue} distance={s(9)} duration={3800} delay={600}>
        <View pointerEvents="none" style={styles.orbBlueInner} />
      </Bob>

      <NightSky topInset={insets.top} />

      <Enter index={0} style={styles.backRow}>
        <View style={styles.backPill}>
          <BouncyPressable
            testID="pet-hero-back"
            accessibilityLabel="Back"
            activeScale={0.88}
            onPress={onBack}
            style={styles.backBtn}>
            <Feather name="chevron-left" size={ms(20)} color="#FFFFFF" />
          </BouncyPressable>
          <Text style={styles.backText}>{backLabel}</Text>
        </View>
      </Enter>

      {!!eyebrow && (
        <Enter index={1}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </Enter>
      )}
      <Enter index={2}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </Enter>
      <AccentBar />
      {!!subtitle && (
        <Enter index={4}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Enter>
      )}
      {children ? <Enter index={5}>{children}</Enter> : null}
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
  backRow: { alignSelf: 'flex-start', marginBottom: s(12) },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingRight: s(14),
    borderRadius: s(20),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  backText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12.5),
    color: 'rgba(255,255,255,0.92)',
  },
  eyebrow: {
    marginBottom: s(3),
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(11),
    letterSpacing: 2,
    color: '#FDE68A',
  },
  accentWrap: {
    height: s(4),
    marginTop: s(8),
    borderRadius: s(2),
    overflow: 'hidden',
  },
  orbPink: { position: 'absolute', top: -s(30), right: -s(40) },
  orbPinkInner: {
    width: s(190),
    height: s(190),
    borderRadius: s(95),
    backgroundColor: 'rgba(244,114,182,0.22)',
  },
  orbBlue: { position: 'absolute', bottom: -s(50), left: -s(50) },
  orbBlueInner: {
    width: s(170),
    height: s(170),
    borderRadius: s(85),
    backgroundColor: 'rgba(96,165,250,0.18)',
  },
  title: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(26),
    lineHeight: s(31),
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: s(10),
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(14.5),
    lineHeight: s(21),
    color: 'rgba(255,255,255,0.88)',
  },
  backBtn: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
