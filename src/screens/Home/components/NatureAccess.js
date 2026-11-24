import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { s } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { Button } from '../../../components/common/Button';
import { BouncyPressable } from './BouncyPressable';
import { styles as homeStyles } from './styles';
import { Bob, Enter } from '../../Community/Motion';

// The four outdoor groups and their wording: fixed content, with the colours of the website
export const NATURE_CARDS = [
  {
    key: 'lakes',
    emoji: '🏞️',
    title: 'Ponds & Lakes',
    text: 'Check access type, walking distance, crowd level and whether dogs can safely reach the water. Dog friendly lakes across India listed with entry rules.',
    places: 47,
    colors: ['#56BCA6', '#5DB777'],
    lip: '#3E9A86',
  },
  {
    key: 'rivers',
    emoji: '🌊',
    title: 'Rivers & Waterfalls',
    text: 'Seasonal warnings, slippery rock alerts, water flow and safe entry points before visiting with dogs. Pet friendly waterfalls and rivers across India.',
    places: 62,
    colors: ['#6D36F5', '#4F7FD0', '#52B8A8'],
    lip: '#4F25B8',
  },
  {
    key: 'beaches',
    emoji: '🏖️',
    title: 'Beaches & Picnic Spots',
    text: 'Dog friendly beaches in India, leash rules, tide timings, parking and the ones where your dog can actually run the fun shoreline.',
    places: 38,
    colors: ['#F2A340', '#F7D27A'],
    lip: '#C77F1E',
  },
  {
    key: 'forests',
    emoji: '🌲',
    title: 'Forest Trails & Parks',
    text: 'Off-leash trails, eco-resort walks, jungle paths and national park pet rules. Pet friendly parks and forest trails with timing and safety guidance.',
    places: 54,
    colors: ['#52A56B', '#1F4D2C'],
    lip: '#173B21',
  },
];

// Where the Search screen opens: the "Nature & Water" filter, which lists the outdoor places
export const NATURE_SEARCH_PARAMS = { apiCategory: 'Nature & Water', category: 'Paws in the Wild' };

export const CARD_WIDTH = s(212);
export const CARD_GAP = s(10);
const STEP = CARD_WIDTH + CARD_GAP;

// ── Live effects behind each card, to suit its title ─────────────────────────────────────────────

// A value that runs 0 -> 1 again and again. `delay` staggers the pieces of one effect.
const useCycle = (duration, delay, nativeDriver) => {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, duration, delay, nativeDriver]);
  return value;
};

// Where a creature starts (just off the left edge) and where it ends (just off the right edge)
const CROSS_FROM = -s(40);
const CROSS_TO = CARD_WIDTH + s(20);

// Ponds & Lakes, Beaches: a small creature that goes across the card from left to right, bobbing a
// little as it goes. Creatures that look to the left in the emoji are turned to face right.
const Crosser = ({ emoji, kind, top, size, delay, duration, bob, nativeDriver }) => {
  const t = useCycle(duration, delay, nativeDriver);
  return (
    <Animated.Text
      pointerEvents="none"
      testID={`nature-cross-${kind}`}
      style={[
        styles.critter,
        {
          top,
          fontSize: size,
          opacity: t.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            {
              translateX: t.interpolate({
                inputRange: [0, 1],
                outputRange: [CROSS_FROM, CROSS_TO],
              }),
            },
            {
              translateY: t.interpolate({
                inputRange: [0, 0.25, 0.5, 0.75, 1],
                outputRange: [0, -bob, 0, bob, 0],
              }),
            },
            { scaleX: -1 },
          ],
        },
      ]}>
      {emoji}
    </Animated.Text>
  );
};

// Rivers & Waterfalls: drops of water falling down the card, like a waterfall
const Drop = ({ left, delay, duration, nativeDriver }) => {
  const t = useCycle(duration, delay, nativeDriver);
  return (
    <Animated.Text
      pointerEvents="none"
      testID="nature-drop"
      style={[
        styles.critter,
        {
          left,
          fontSize: s(16),
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-24, 270] }) },
            { translateX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 6, -4] }) },
          ],
        },
      ]}>
      💧
    </Animated.Text>
  );
};

// Beaches & Picnic Spots: a small sun that turns slowly
const Sun = ({ nativeDriver }) => {
  const t = useCycle(16000, 0, nativeDriver);
  return (
    <Animated.Text
      pointerEvents="none"
      testID="nature-sun"
      style={[
        styles.critter,
        styles.sun,
        {
          transform: [
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}>
      ☀️
    </Animated.Text>
  );
};

// Forest Trails & Parks: leaves drift down, turning as they go
const Leaf = ({ left, delay, duration, nativeDriver }) => {
  const t = useCycle(duration, delay, nativeDriver);
  return (
    <Animated.Text
      pointerEvents="none"
      testID="nature-leaf"
      style={[
        styles.leaf,
        {
          left,
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-24, 270] }) },
            { translateX: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 20, -6] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '260deg'] }) },
          ],
        },
      ]}>
      🍃
    </Animated.Text>
  );
};

// The pieces of each effect: what they are, where they sit and how fast they go
const LAKE_CREATURES = [
  { emoji: '🦆', top: '24%', size: s(24), delay: 0, duration: 9000, bob: s(3) },
  { emoji: '🐟', top: '48%', size: s(20), delay: 2500, duration: 6500, bob: s(5) },
  { emoji: '🦆', top: '66%', size: s(22), delay: 5200, duration: 10000, bob: s(3) },
  { emoji: '🐟', top: '82%', size: s(18), delay: 1200, duration: 7000, bob: s(5) },
];
const RIVER_DROPS = [
  { left: '10%', delay: 0, duration: 2600 },
  { left: '26%', delay: 900, duration: 3000 },
  { left: '44%', delay: 400, duration: 2800 },
  { left: '60%', delay: 1500, duration: 3200 },
  { left: '76%', delay: 700, duration: 2700 },
  { left: '90%', delay: 1900, duration: 3100 },
];
const BEACH_CREATURES = [
  { emoji: '🦀', top: '84%', size: s(20), delay: 0, duration: 11000, bob: s(2), kind: 'beaches' },
  { emoji: '🕊️', top: '26%', size: s(20), delay: 1500, duration: 8000, bob: s(7), kind: 'beaches' },
  { emoji: '🕊️', top: '44%', size: s(16), delay: 5000, duration: 9500, bob: s(6), kind: 'beaches' },
];
const LEAVES = [
  { left: '18%', delay: 0, duration: 6200 },
  { left: '42%', delay: 2000, duration: 7200 },
  { left: '66%', delay: 900, duration: 6600 },
  { left: '84%', delay: 3200, duration: 7600 },
];

// What moves behind each card, by card. The count is how many animated pieces it has.
export const AMBIENT_PIECES = {
  lakes: LAKE_CREATURES.length,
  rivers: RIVER_DROPS.length,
  beaches: BEACH_CREATURES.length + 1,
  forests: LEAVES.length,
};

export const NatureAmbient = ({ kind, nativeDriver = true }) => (
  <View pointerEvents="none" testID={`nature-ambient-${kind}`} style={StyleSheet.absoluteFill}>
    {kind === 'lakes'
      ? LAKE_CREATURES.map(item => (
          <Crosser
            key={`${item.emoji}-${item.top}`}
            kind="lakes"
            {...item}
            nativeDriver={nativeDriver}
          />
        ))
      : null}
    {kind === 'rivers'
      ? RIVER_DROPS.map(drop => <Drop key={drop.left} {...drop} nativeDriver={nativeDriver} />)
      : null}
    {kind === 'beaches' ? (
      <>
        <Sun nativeDriver={nativeDriver} />
        {BEACH_CREATURES.map(item => (
          <Crosser key={`${item.emoji}-${item.top}`} {...item} nativeDriver={nativeDriver} />
        ))}
      </>
    ) : null}
    {kind === 'forests'
      ? LEAVES.map(leaf => <Leaf key={leaf.left} {...leaf} nativeDriver={nativeDriver} />)
      : null}
  </View>
);

// One card. As the row scrolls, the card at the left edge is full size and bright and its
// neighbours are a little smaller and softer; the icon floats gently.
const NatureCard = ({ card, index, scrollX, onExplore, nativeDriver }) => {
  const range = [(index - 1) * STEP, index * STEP, (index + 1) * STEP];
  const lift = {
    opacity: scrollX.interpolate({
      inputRange: range,
      outputRange: [0.78, 1, 0.78],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        scale: scrollX.interpolate({
          inputRange: range,
          outputRange: [0.94, 1, 0.94],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <Enter index={index} style={styles.cell}>
      <Animated.View testID={`nature-lift-${card.key}`} style={[styles.liftWrap, lift]}>
        <BouncyPressable
          testID={`nature-card-${card.key}`}
          accessibilityRole="button"
          accessibilityLabel={`${card.title}, ${card.places} places`}
          activeScale={0.97}
          onPress={onExplore}
          // A solid colour behind the gradient carries the shadow, so Android always draws the card
          style={[styles.card, { backgroundColor: card.lip, shadowColor: card.lip }]}>
          <LinearGradient
            colors={card.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.face}>
            <NatureAmbient kind={card.key} nativeDriver={nativeDriver} />
            <View style={styles.top}>
              <Bob distance={s(3)} duration={2300 + (index % 3) * 300} delay={index * 140}>
                <Text style={styles.emoji}>{card.emoji}</Text>
              </Bob>
              <View style={styles.pill}>
                <Text style={styles.pillText}>✓ Swim safety noted</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardText}>{card.text}</Text>
            <Text testID={`nature-places-${card.key}`} style={styles.places}>
              {`${card.places} places →`}
            </Text>
          </LinearGradient>
        </BouncyPressable>
      </Animated.View>
    </Enter>
  );
};


const BUTTON_WIDTH = s(210);
const BUTTON_FACE = s(42);

// A soft band of light that sweeps across the button face, then rests for a moment
const ButtonShine = ({ nativeDriver = true }) => {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1800),
        Animated.timing(sweep, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: nativeDriver }),
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep, nativeDriver]);

  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-s(60), BUTTON_WIDTH + s(20)] });

  return (
    <View pointerEvents="none" testID="nature-explore-shine" style={styles.shineClip}>
      <Animated.View style={[styles.shineBar, { transform: [{ translateX }, { skewX: '-20deg' }] }]} />
    </View>
  );
};

// Slow breathing pulse around the whole button
const BreathingView = ({ children, nativeDriver = true }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, nativeDriver]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  return <Animated.View style={{ alignSelf: 'center', transform: [{ scale }] }}>{children}</Animated.View>;
};

// Leaf icon for the Explore button: sways side to side like it is moving in the breeze
const SwayingLeaf = ({ nativeDriver = true }) => {
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
        Animated.timing(sway, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sway]);

  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '18deg'] });
  const translateY = sway.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, -2, 1] });

  return (
    <Animated.View testID="nature-explore-icon" style={[styles.buttonIcon, { transform: [{ translateY }, { rotate }] }]}>
      <Ionicons name="leaf" size={s(16)} color="#FFFFFF" />
    </Animated.View>
  );
};

export const NatureAccess = ({ onExplore, isDarkMode, nativeDriver = true }) => {
  const scrollX = useRef(new Animated.Value(0)).current;

  return (
    <View testID="nature-access">
      {/* Same header style as the other Home sections */}
      <View style={styles.heading}>
        <Text style={[homeStyles.sectionOverline, isDarkMode && homeStyles.sectionOverlineDark]}>
          OUTDOORS
        </Text>
        <Text style={[homeStyles.sectionTitle, isDarkMode && homeStyles.sectionTitleDark]}>
          Water, nature and outdoor pet access
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Pet friendly lakes, ponds, waterfalls, rivers and beaches need more than a “pet allowed”
          tag. Pet parents need access, safety, crowd and parking details before they go.
        </Text>
      </View>

      <Animated.ScrollView
        testID="nature-scroll"
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={STEP}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: nativeDriver,
        })}
        contentContainerStyle={styles.row}>
        {NATURE_CARDS.map((card, index) => (
          <NatureCard
            key={card.key}
            card={card}
            index={index}
            scrollX={scrollX}
            onExplore={onExplore}
            nativeDriver={nativeDriver}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.buttonWrap}>
        <BreathingView nativeDriver={nativeDriver}>
          <Button
            testID="nature-explore"
            accessibilityRole="button"
            accessibilityLabel="Explore Water and Nature Places"
            title="Explore Nature Places"
            leftIcon={<SwayingLeaf nativeDriver={nativeDriver} />}
            onPress={onExplore}
            width={BUTTON_WIDTH}
            textStyle={styles.buttonText}
            contentStyle={styles.buttonFill}
            style={styles.button3d}
          />
          <ButtonShine nativeDriver={nativeDriver} />
        </BreathingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: { marginHorizontal: s(15), marginTop: s(8), marginBottom: s(4) },
  subtitle: {
    marginTop: s(6),
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  subtitleDark: { color: '#94A3B8' },
  row: { paddingHorizontal: s(15), paddingTop: s(14), paddingBottom: s(10), gap: CARD_GAP },
  cell: { width: CARD_WIDTH },
  liftWrap: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: s(20),
    paddingBottom: s(3),
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  face: { flex: 1, borderRadius: s(20), padding: s(13), overflow: 'hidden' },
  critter: { position: 'absolute', left: 0, top: 0 },
  sun: { top: s(48), left: undefined, right: s(14), fontSize: s(24) },
  leaf: { position: 'absolute', top: 0, fontSize: s(22) },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emoji: { fontSize: s(27) },
  pill: {
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(11),
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  pillText: { fontSize: s(9.5), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  cardTitle: {
    marginTop: s(10),
    fontSize: s(16.5),
    lineHeight: s(20),
    letterSpacing: -0.4,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  cardText: {
    flex: 1,
    marginTop: s(5),
    fontSize: s(11),
    lineHeight: s(16),
    color: 'rgba(255,255,255,0.9)',
    fontFamily: theme.typography.fontFamily.regular,
  },
  places: {
    marginTop: s(9),
    fontSize: s(12),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  // 3D lip: darker base shows under the gradient, like the cards above
  buttonIcon: { marginRight: s(8) },
  button3d: { backgroundColor: theme.colors.primaryDark, paddingBottom: s(3) },
  buttonFill: { height: BUTTON_FACE },
  shineClip: { position: 'absolute', top: 0, left: 0, width: BUTTON_WIDTH, height: BUTTON_FACE, borderRadius: BUTTON_FACE / 2, overflow: 'hidden' },
  shineBar: { position: 'absolute', top: 0, bottom: 0, width: s(26), backgroundColor: 'rgba(255,255,255,0.28)' },
  buttonText: { fontSize: s(14), fontFamily: theme.typography.fontFamily.extraBold },
  buttonWrap: { marginTop: s(8), marginBottom: s(22), paddingHorizontal: theme.spacing.m },
});
