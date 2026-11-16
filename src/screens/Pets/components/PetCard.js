import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import {
  STAMP_GOAL,
  speciesEmoji,
  petName,
  petSpecies,
  petStamps,
  petLevel,
  petSubtitle,
  petPhoto,
} from '../petUtils';

// Little paw prints floating in the empty top-left corner
const PAWS = [
  { left: s(10), top: s(12), size: 13, rotate: '-20deg' },
  { left: s(26), top: s(32), size: 9, rotate: '14deg' },
];

const useLoop = (build, deps = []) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(build(value));
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
};

// A pet on the My Pets carousel: a compact purple card with a floating emblem that wiggles like a
// happy dog, a trail of paw prints, a bone drifting by, and a thick bottom edge for depth.
export const PetCard = ({ pet, onOpen, onHealth, onPawsport, onEdit }) => {
  const stamps = petStamps(pet);
  const progress = Math.min(1, stamps / STAMP_GOAL);
  const species = petSpecies(pet);
  const isDog = /dog/i.test(species) || !species;
  const photo = petPhoto(pet);

  // Emblem: gentle bounce, plus a head-tilt wiggle every few seconds
  const bounce = useLoop(v =>
    Animated.sequence([
      Animated.timing(v, {
        toValue: 1,
        duration: 900,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(v, {
        toValue: 0,
        duration: 900,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]),
  );
  const wiggle = useLoop(v =>
    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(v, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(v, { toValue: -1, duration: 160, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(v, { toValue: -1, duration: 160, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 90, useNativeDriver: true }),
    ]),
  );
  const bone = useLoop(v =>
    Animated.sequence([
      Animated.timing(v, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(v, {
        toValue: 0,
        duration: 2600,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]),
  );

  const lerp = (v, from, to) => v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });

  return (
    <LinearGradient
      colors={['#3B108F', '#5B21B6', '#7B2CFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}>
      {/* Top-left highlight for a glassy, raised look */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Paw prints drifting in the corner */}
      {PAWS.map(paw => (
        <Animated.View
          key={paw.left}
          pointerEvents="none"
          style={[
            styles.paw,
            {
              left: paw.left,
              top: paw.top,
              opacity: lerp(bone, 0.18, 0.5),
              transform: [{ rotate: paw.rotate }, { translateY: lerp(bone, 0, -vs(4)) }],
            },
          ]}>
          <Ionicons name="paw" size={ms(paw.size)} color="#FFFFFF" />
        </Animated.View>
      ))}

      {/* Bone drifting by */}
      <Animated.Text
        pointerEvents="none"
        style={[
          styles.bone,
          {
            transform: [
              { translateY: lerp(bone, 0, -vs(6)) },
              { rotate: lerp(bone, '-18deg', '14deg') },
            ],
          },
        ]}>
        🦴
      </Animated.Text>

      <BouncyPressable
        testID={`pet-card-${pet.id}`}
        style={styles.top}
        activeScale={0.98}
        onPress={onOpen}>
        <Animated.View
          style={[styles.emblemWrap, { transform: [{ translateY: lerp(bounce, 0, -vs(3)) }] }]}>
          <View style={styles.emblemShadow} />
          <LinearGradient colors={['#FFFFFF', '#F5D0FE', '#C4B5FD']} style={styles.emblemRing}>
            <View style={styles.emblem}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.emblemPhoto} />
              ) : (
                <Animated.Text
                  style={[
                    styles.emblemEmoji,
                    {
                      transform: [
                        {
                          rotate: wiggle.interpolate({
                            inputRange: [-1, 1],
                            outputRange: isDog ? ['-14deg', '14deg'] : ['-6deg', '6deg'],
                          }),
                        },
                      ],
                    },
                  ]}>
                  {speciesEmoji(species)}
                </Animated.Text>
              )}
            </View>
          </LinearGradient>
          <View style={styles.level}>
            <Text style={styles.levelText}>LVL {petLevel(pet)}</Text>
          </View>
        </Animated.View>

        <Text style={styles.name} numberOfLines={1}>
          {petName(pet)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {petSubtitle(pet) || 'Ready for adventures'}
        </Text>
        <View style={styles.stampPill}>
          <Text style={styles.stampEmoji}>🥇</Text>
          <Text style={styles.stampText}>
            {stamps} / {STAMP_GOAL}
          </Text>
        </View>
      </BouncyPressable>

      <View style={styles.track}>
        <LinearGradient
          colors={['#FBCFE8', '#F9A8D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(progress * 100, stamps ? 4 : 0)}%` }]}
        />
      </View>

      <View style={styles.actions}>
        <BouncyPressable
          testID={`pet-health-${pet.id}`}
          accessibilityLabel="Health records"
          style={[styles.btn, styles.btnPrimary]}
          activeScale={0.9}
          onPress={onHealth}>
          <Ionicons name="medkit" size={ms(15)} color="#3B108F" />
          <Text
            style={[styles.btnLabel, styles.btnLabelPrimary]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}>
            Health
          </Text>
        </BouncyPressable>
        <BouncyPressable
          testID={`pet-pawsport-${pet.id}`}
          accessibilityLabel="Pawsport"
          style={[styles.btn, styles.btnGlass]}
          activeScale={0.9}
          onPress={onPawsport}>
          <Ionicons name="paw" size={ms(15)} color="#FFFFFF" />
          <Text
            style={styles.btnLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}>
            Pawsport
          </Text>
        </BouncyPressable>
        <BouncyPressable
          testID={`pet-edit-${pet.id}`}
          accessibilityLabel="Edit pet"
          style={[styles.btn, styles.btnGlass]}
          activeScale={0.9}
          onPress={onEdit}>
          <Ionicons name="create" size={ms(15)} color="#FFFFFF" />
          <Text
            style={styles.btnLabel}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}>
            Edit
          </Text>
        </BouncyPressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: s(10),
    borderRadius: s(20),
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderTopColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 4,
    borderBottomColor: '#2A0B6B',
  },
  paw: { position: 'absolute' },
  bone: { position: 'absolute', top: s(8), right: s(10), fontSize: s(14), opacity: 0.85 },
  top: { alignItems: 'center' },
  emblemWrap: { width: s(54), height: s(54) },
  emblemShadow: {
    position: 'absolute',
    bottom: -vs(3),
    left: s(8),
    right: s(8),
    height: vs(5),
    borderRadius: s(6),
    backgroundColor: 'rgba(20,6,60,0.4)',
  },
  emblemRing: { width: s(52), height: s(52), borderRadius: s(26), padding: s(2.5), elevation: 8 },
  emblem: {
    flex: 1,
    borderRadius: s(24),
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemPhoto: { width: '100%', height: '100%', borderRadius: s(24) },
  emblemEmoji: { fontSize: s(25) },
  level: {
    position: 'absolute',
    bottom: -s(4),
    alignSelf: 'center',
    paddingHorizontal: s(6),
    paddingVertical: vs(1),
    borderRadius: s(8),
    backgroundColor: '#EE2A7B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  levelText: {
    fontSize: ms(8),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  name: {
    marginTop: vs(9),
    fontSize: s(15),
    letterSpacing: -0.3,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  meta: {
    marginTop: vs(1),
    fontSize: s(10.5),
    color: 'rgba(255,255,255,0.78)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  stampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(5),
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    borderRadius: s(11),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  stampEmoji: { fontSize: s(10) },
  stampText: {
    marginLeft: s(4),
    fontSize: s(10.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },
  track: {
    height: vs(4),
    borderRadius: s(4),
    marginTop: vs(9),
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: s(4) },
  actions: { flexDirection: 'row', marginTop: vs(9), gap: s(5) },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: vs(6),
    paddingHorizontal: s(2),
    borderRadius: s(12),
  },
  btnLabel: {
    marginTop: vs(2),
    fontSize: s(8.5),
    textAlign: 'center',
    alignSelf: 'stretch',
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
  },
  btnLabelPrimary: { color: '#3B108F', fontFamily: theme.typography.fontFamily.extraBold },
  btnPrimary: { backgroundColor: '#FFFFFF', borderBottomWidth: 3, borderBottomColor: '#DDD6FE' },
  btnGlass: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.35)',
  },
});
