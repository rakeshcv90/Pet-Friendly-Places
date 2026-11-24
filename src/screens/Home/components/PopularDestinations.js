import React, { useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { s, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import FastImage from '../../../components/common/FastImage';
import { resolveImageUrl } from '../../../hooks/useDiscovery';
import { BouncyPressable } from './BouncyPressable';
import { styles as homeStyles } from './styles';
import { Bob, Enter } from '../../Community/Motion';

// Colours for the cards, in order: a soft tint for the top, and a stronger colour for the icon, the
// "places" line and the frame
export const DESTINATION_COLORS = [
  { tint: '#EDE7FB', accent: '#7C3AED', from: '#4C1D95', to: '#8B5CF6' },
  { tint: '#E6F6F3', accent: '#34A98F', from: '#0F766E', to: '#34D399' },
  { tint: '#F0E9F7', accent: '#C026D3', from: '#3B108F', to: '#C026D3' },
  { tint: '#E4ECFB', accent: '#2F5FC4', from: '#1E3A8A', to: '#3B82F6' },
  { tint: '#E9F5EC', accent: '#3FA55B', from: '#166534', to: '#4ADE80' },
  { tint: '#F8E6EA', accent: '#E11D48', from: '#9F1239', to: '#FB7185' },
  { tint: '#EAE5FB', accent: '#8B5CF6', from: '#5B21B6', to: '#A78BFA' },
  { tint: '#E3EEFA', accent: '#0EA5E9', from: '#075985', to: '#38BDF8' },
  { tint: '#FDF3DF', accent: '#F59E0B', from: '#B45309', to: '#FBBF24' },
  { tint: '#FAE9F4', accent: '#EC4899', from: '#9D174D', to: '#F472B6' },
];

// The row scrolls sideways one card at a time
export const CARD_WIDTH = s(118);
export const CARD_GAP = s(9);
const STEP = CARD_WIDTH + CARD_GAP;

// A line icon that suits each city. Others get a map pin.
const CITY_ICONS = {
  'new delhi': 'bank',
  delhi: 'bank',
  rishikesh: 'bridge',
  gurugram: 'office-building',
  bengaluru: 'city-variant-outline',
  bangalore: 'city-variant-outline',
  dehradun: 'pine-tree',
  jaipur: 'castle',
  mussoorie: 'image-filter-hdr',
  shimla: 'church',
  kolkata: 'bridge',
  mumbai: 'sail-boat',
  goa: 'sail-boat',
  manali: 'image-filter-hdr',
  udaipur: 'castle',
  agra: 'mosque',
  chandigarh: 'office-building',
};

export const iconForCity = city =>
  CITY_ICONS[
    String(city || '')
      .trim()
      .toLowerCase()
  ] || 'map-marker-radius';

// "53 places" / "1 place"
export const placesLabel = count => {
  const n = Number(count) || 0;
  return `${n} ${n === 1 ? 'place' : 'places'}`;
};

// The API's top_cities -> cards, skipping any entry with no city name
export const toDestinations = cities => {
  const list = (Array.isArray(cities) ? cities : []).filter(
    item => item && typeof item.city === 'string' && item.city.trim(),
  );
  const top = Math.max(1, ...list.map(item => Number(item.listing_count) || 0));
  return list.map((item, index) => {
    const count = Number(item.listing_count) || 0;
    return {
      key: `${item.city}-${item.state || index}`,
      city: item.city.trim(),
      state: item.state || '',
      count,
      // How popular, compared with the city that has the most places (0 to 1)
      share: count / top,
      image: item.hero_image_url ? resolveImageUrl(item.hero_image_url) : '',
      colors: DESTINATION_COLORS[index % DESTINATION_COLORS.length],
    };
  });
};

// One card. As the row is scrolled, the card nearest the left edge is full size and bright, and the
// ones beside it are a little smaller and softer; its icon also slides a little, for depth.
const DestinationCard = ({ item, index, scrollX, onOpen, isDarkMode }) => {
  const range = [(index - 1) * STEP, index * STEP, (index + 1) * STEP];
  const lift = {
    opacity: scrollX.interpolate({
      inputRange: range,
      outputRange: [0.75, 1, 0.75],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        scale: scrollX.interpolate({
          inputRange: range,
          outputRange: [0.93, 1, 0.93],
          extrapolate: 'clamp',
        }),
      },
      // Each card sits a little crooked, the way stamps do in a passport
      { rotate: index % 2 === 0 ? '-1.2deg' : '1.2deg' },
    ],
  };
  const stamp = {
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: range,
          outputRange: [-s(10), 0, s(10)],
          extrapolate: 'clamp',
        }),
      },
      { rotate: '-9deg' },
    ],
  };
  const accent = item.colors.accent;

  return (
    <Enter index={index} style={styles.cell}>
      <Animated.View testID={`destination-${index}-lift`} style={lift}>
        <BouncyPressable
          testID={`destination-${index}`}
          accessibilityRole="button"
          accessibilityLabel={`${item.city}, ${placesLabel(item.count)}`}
          activeScale={0.96}
          onPress={() => onOpen(item)}
          style={[
            styles.card,
            isDarkMode && styles.cardDark,
            { borderColor: accent, shadowColor: accent },
          ]}>
          <View style={styles.topRow}>
            <Text testID={`destination-${index}-rank`} style={[styles.rank, { color: accent }]}>
              {`No. ${String(index + 1).padStart(2, '0')}`}
            </Text>
            <Ionicons name="paw" size={ms(11)} color={accent} style={styles.paw} />
          </View>

          {item.image ? (
            <FastImage
              testID={`destination-${index}-photo`}
              source={{ uri: item.image }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <Animated.View testID={`destination-${index}-stamp`} style={[styles.stampWrap, stamp]}>
              <View style={[styles.stampOuter, { borderColor: accent }]}>
                <View
                  style={[
                    styles.stampInner,
                    {
                      borderColor: accent,
                      backgroundColor: isDarkMode ? '#27104B' : item.colors.tint,
                    },
                  ]}>
                  <Bob distance={s(2)} duration={2600 + (index % 3) * 300} delay={index * 120}>
                    <MaterialCommunityIcons
                      name={iconForCity(item.city)}
                      size={ms(22)}
                      color={accent}
                    />
                  </Bob>
                </View>
              </View>
            </Animated.View>
          )}

          <Text numberOfLines={1} style={[styles.city, isDarkMode && styles.cityDark]}>
            {item.city.toUpperCase()}
          </Text>
          {item.state ? (
            <Text numberOfLines={1} style={[styles.state, isDarkMode && styles.stateDark]}>
              {item.state}
            </Text>
          ) : null}

          <Text testID={`destination-${index}-count`} style={[styles.count, { color: accent }]}>
            {placesLabel(item.count)}
          </Text>
          <View
            testID={`destination-${index}-track`}
            style={[styles.track, { backgroundColor: isDarkMode ? '#27104B' : item.colors.tint }]}>
            <View
              testID={`destination-${index}-bar`}
              style={[
                styles.bar,
                { backgroundColor: accent, width: `${Math.max(8, Math.round(item.share * 100))}%` },
              ]}
            />
          </View>
        </BouncyPressable>
      </Animated.View>
    </Enter>
  );
};

// "Popular Indian Destinations for Pet Travel": the cities with the most places, from the Home API,
// in a row that scrolls sideways and snaps to each card
export const PopularDestinations = ({ cities, onOpenCity, isDarkMode, nativeDriver = true }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const items = toDestinations(cities);
  if (items.length === 0) {
    return null;
  }

  return (
    <View testID="popular-destinations">
      {/* Same header style as the other Home sections */}
      <View style={styles.heading}>
        <Text style={[homeStyles.sectionOverline, isDarkMode && homeStyles.sectionOverlineDark]}>
          TOP CITIES
        </Text>
        <Text style={[homeStyles.sectionTitle, isDarkMode && homeStyles.sectionTitleDark]}>
          Popular Indian Destinations for Pet Travel
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Where pet parents are travelling, searching and planning road trips right now.
        </Text>
      </View>

      <Animated.ScrollView
        testID="destinations-scroll"
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
        {items.map((item, index) => (
          <DestinationCard
            key={item.key}
            item={item}
            index={index}
            scrollX={scrollX}
            onOpen={onOpenCity}
            isDarkMode={isDarkMode}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  heading: { marginHorizontal: s(15), marginTop: s(8), marginBottom: s(4) },
  subtitle: {
    marginTop: s(4),
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  subtitleDark: { color: '#94A3B8' },
  row: {
    paddingHorizontal: s(15),
    paddingVertical: s(10),
    gap: CARD_GAP,
    alignItems: 'flex-start',
  },
  cell: { width: CARD_WIDTH },
  // A light card with a dashed coloured edge, like a stamp page in a passport
  card: {
    alignItems: 'center',
    paddingHorizontal: s(9),
    paddingTop: s(7),
    paddingBottom: s(10),
    borderRadius: s(18),
    backgroundColor: '#FFFDF8',
    borderWidth: 1.6,
    borderStyle: 'dashed',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1A0B30' },
  topRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rank: {
    fontSize: s(9.5),
    letterSpacing: 0.6,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  paw: { opacity: 0.55 },
  stampWrap: { marginTop: s(4), marginBottom: s(6) },
  stampOuter: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.6,
    opacity: 0.95,
  },
  stampInner: {
    width: s(45),
    height: s(45),
    borderRadius: s(23),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  photo: { width: s(56), height: s(56), borderRadius: s(28), marginTop: s(4), marginBottom: s(6) },
  city: {
    fontSize: s(11),
    letterSpacing: 1,
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  cityDark: { color: '#FFFFFF' },
  state: {
    marginTop: 1,
    fontSize: s(9.5),
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.medium,
  },
  stateDark: { color: '#94A3B8' },
  count: { marginTop: s(6), fontSize: s(11.5), fontFamily: theme.typography.fontFamily.extraBold },
  track: {
    alignSelf: 'stretch',
    height: s(4),
    marginTop: s(5),
    borderRadius: s(2),
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: s(3) },
});
