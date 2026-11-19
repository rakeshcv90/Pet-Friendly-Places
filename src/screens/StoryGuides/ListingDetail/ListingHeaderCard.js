import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { styles } from './styles';
import { styles as shared } from '../GuideDetail/styles/shared';
import { styles as hero } from '../GuideDetail/styles/hero';

/** Badges, name, location, summary and photo / view counts, lifted over the gallery. */
export const ListingHeaderCard = ({ listing, palette, isDarkMode, motion }) => (
  <Animated.View
    style={[
      styles.headerCard,
      shared.card3D,
      styles.headerShadow,
      isDarkMode && shared.card3DDark,
      {
        backgroundColor: palette.card,
        opacity: motion.entrance,
        transform: [
          { perspective: 1000 },
          { translateY: motion.cardEntranceY },
          { rotateX: motion.cardEntranceRotate },
          { rotateX: motion.cardTiltX },
        ],
      },
    ]}>
    <View style={hero.articleHeaderClip} pointerEvents="none">
      <LinearGradient
        colors={['#3B108F', '#7B2CFF', '#C4ADFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={hero.accentStrip}
      />
      <Animated.View
        style={[hero.articleSheen, { transform: [{ translateX: motion.sheenX }, { rotate: '25deg' }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>

    <View style={styles.chipRow}>
      {listing.categoryLabel ? (
        <View style={[styles.chip, { backgroundColor: palette.soft }]}>
          <Ionicons name="bed-outline" size={ms(12)} color={palette.accent} />
          <Text style={[styles.chipText, { color: palette.accent }]}>
            {[listing.categoryLabel, listing.type].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}
      {listing.verifiedLabel ? (
        <View style={[styles.chip, { backgroundColor: palette.goodSoft }]}>
          <Ionicons name="shield-checkmark" size={ms(12)} color={palette.good} />
          <Text style={[styles.chipText, { color: palette.good }]}>{listing.verifiedLabel}</Text>
        </View>
      ) : null}
    </View>

    <Text style={[styles.name, { color: palette.text }]}>{listing.name}</Text>

    {listing.levelLabel ? (
      <View style={[styles.chip, styles.levelChip, { backgroundColor: palette.warnSoft }]}>
        <Ionicons name="paw" size={ms(12)} color={palette.warn} />
        <Text style={[styles.chipText, { color: palette.warn }]}>{listing.levelLabel}</Text>
      </View>
    ) : null}

    {listing.location ? (
      <View style={styles.locationRow}>
        <Ionicons name="location-sharp" size={ms(14)} color={palette.accent} />
        <Text style={[styles.locationText, { color: palette.muted }]}>
          {listing.location}
          {listing.alsoIn ? `  ·  Also in ${listing.alsoIn}` : ''}
        </Text>
      </View>
    ) : null}

    {listing.excerpt ? (
      <Text style={[styles.summary, { color: palette.body }]} numberOfLines={5}>
        {listing.excerpt}
      </Text>
    ) : null}

    <View style={styles.statRow}>
      {listing.photos.length ? (
        <View style={styles.stat}>
          <Ionicons name="images-outline" size={ms(13)} color={palette.muted} />
          <Text style={[styles.statText, { color: palette.muted }]}>
            {listing.photos.length} {listing.photos.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
      ) : null}
      {listing.viewsLabel ? (
        <View style={styles.stat}>
          <Ionicons name="eye-outline" size={ms(13)} color={palette.muted} />
          <Text style={[styles.statText, { color: palette.muted }]}>{listing.viewsLabel}</Text>
        </View>
      ) : null}
      {listing.rating ? (
        <View style={styles.stat}>
          <Ionicons name="star" size={ms(13)} color="#D97706" />
          <Text style={[styles.statText, { color: palette.text }]}>
            {listing.rating}
            {listing.ratingCount ? ` (${listing.ratingCount})` : ''}
          </Text>
        </View>
      ) : null}
      {listing.price ? (
        <View style={styles.stat}>
          <Ionicons name="pricetag-outline" size={ms(13)} color={palette.muted} />
          <Text style={[styles.statText, { color: palette.muted }]}>{listing.price}</Text>
        </View>
      ) : null}
    </View>
  </Animated.View>
);
