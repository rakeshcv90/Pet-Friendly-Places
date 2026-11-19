import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { SectionCard } from './SectionCard';

const font = theme.typography.fontFamily;

/** "Pet-friendly places in {city}": other listings the API returns as `nearby`. */
export const ListingNearby = ({ listing, palette, isDarkMode, navigation }) => {
  if (!listing.nearby.length) {
    return null;
  }
  return (
    <SectionCard
      title={`Pet-friendly places in ${listing.city || 'this area'}`}
      icon="map-outline"
      palette={palette}
      isDarkMode={isDarkMode}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {listing.nearby.map(place => (
          <BouncyPressable
            key={place.slug}
            style={[styles.card, { backgroundColor: palette.soft, borderColor: palette.border }]}
            activeScale={0.96}
            onPress={() => navigation?.push?.('ListingDetailScreen', { slug: place.slug })}>
            <View style={styles.image}>
              {!!place.imageUri && (
                <FastImage
                  source={{ uri: place.imageUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode={FastImage.resizeMode.cover}
                />
              )}
              {!!place.verifiedLabel && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{place.verifiedLabel}</Text>
                </View>
              )}
            </View>
            <View style={styles.info}>
              <Text style={[styles.category, { color: palette.accent }]} numberOfLines={1}>
                {place.category}
              </Text>
              <Text style={[styles.name, { color: palette.text }]} numberOfLines={2}>
                {place.name}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={ms(11)} color={palette.muted} />
                <Text style={[styles.location, { color: palette.muted }]} numberOfLines={1}>
                  {place.location}
                </Text>
              </View>
            </View>
          </BouncyPressable>
        ))}
      </ScrollView>
    </SectionCard>
  );
};

const styles = StyleSheet.create({
  row: { paddingTop: vs(4), paddingRight: s(4) },
  card: {
    width: s(180),
    marginRight: s(10),
    borderRadius: s(16),
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { height: s(104), backgroundColor: 'rgba(124, 58, 237, 0.12)' },
  badge: {
    position: 'absolute',
    top: s(8),
    left: s(8),
    backgroundColor: '#6D28D9',
    borderRadius: s(8),
    paddingHorizontal: s(7),
    paddingVertical: vs(3),
  },
  badgeText: { color: '#FFFFFF', fontSize: ms(9), fontFamily: font.bold },
  info: { padding: s(10) },
  category: { fontSize: ms(9.5), fontFamily: font.bold, letterSpacing: 0.4 },
  name: { fontSize: ms(13), lineHeight: ms(17), fontFamily: font.bold, marginTop: vs(2) },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(4) },
  location: { flex: 1, fontSize: ms(11), fontFamily: font.regular, marginLeft: s(3) },
});
