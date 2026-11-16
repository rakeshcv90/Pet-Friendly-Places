import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, ms } from 'react-native-size-matters';
import { theme, colors } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';

const NO_IMAGE = require('../../../assets/images/NoImage.webp');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDay = iso => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

const POST_TYPES = {
  lost: { gradient: ['#B91C1C', '#EF4444'], dateLabel: 'Missing since', date: '#DC2626', dateDark: '#FCA5A5', soft: '#FEF2F2' },
  found: { gradient: ['#047857', '#10B981'], dateLabel: 'Found on', date: '#059669', dateDark: '#6EE7B7', soft: '#ECFDF5' },
  adopt: { gradient: ['#5B21B6', '#8B5CF6'], dateLabel: 'Available from', date: '#7C3AED', dateDark: '#C4B5FD', soft: '#F5F3FF' },
};

export const ReunitePostCard = React.memo(({ post, isDarkMode, onPress, tilt = '0deg' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const type = POST_TYPES[post.type] || POST_TYPES.lost;
  const day = formatDay(post.eventDate);
  const species = post.species
    ? post.species.charAt(0).toUpperCase() + post.species.slice(1).replace('_', ' ')
    : 'Pet';
  const muted = isDarkMode ? '#94A3B8' : colors.reunite.textMuted;
  const dateColor = isDarkMode ? type.dateDark : type.date;

  return (
    <BouncyPressable
      containerStyle={[styles.wrap, { transform: [{ rotate: tilt }] }]}
      activeScale={0.97}
      onPress={onPress}>
      <View style={[styles.card, isDarkMode && styles.cardDark]}>
        <View style={styles.imageBox}>
          <Image
            source={post.image && !imageFailed ? { uri: post.image } : NO_IMAGE}
            style={styles.image}
            resizeMode="cover"
            onError={e => {
              if (__DEV__) {
                console.log('[reunite] image failed', post.image, e?.nativeEvent?.error);
              }
              setImageFailed(true);
            }}
          />
          <LinearGradient
            colors={type.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.badge}>
            <Text style={styles.badgeText}>{(post.type || 'lost').toUpperCase()}</Text>
          </LinearGradient>
          {!!post.timeAgo && (
            <View style={styles.timePill}>
              <Text style={styles.timeText}>{post.timeAgo}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, isDarkMode && styles.nameDark]} numberOfLines={1}>
            {post.name || 'Name unknown'}
          </Text>
          <Text style={[styles.meta, { color: muted }]} numberOfLines={1}>
            {post.breed ? `${species} · ${post.breed}` : species}
          </Text>
          {!!post.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={ms(11)} color={isDarkMode ? '#A78BFA' : '#7B2CFF'} />
              <Text style={[styles.location, { color: muted }]} numberOfLines={1}>
                {post.location}
              </Text>
            </View>
          )}
        </View>

        {!!day && (
          <View style={[styles.dateStrip, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : type.soft }]}>
            <Ionicons name="calendar-outline" size={ms(11)} color={dateColor} />
            <Text style={[styles.date, { color: dateColor }]} numberOfLines={1}>
              {type.dateLabel} {day}
            </Text>
          </View>
        )}
      </View>
    </BouncyPressable>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '46%',
    marginBottom: s(16),
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: s(14),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE7FB',
    shadowColor: '#3B108F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1.55,
    backgroundColor: colors.reunite.polaroidImgBox,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: s(6),
    left: s(6),
    paddingHorizontal: s(8),
    paddingVertical: s(3),
    borderRadius: s(10),
  },
  badgeText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  timePill: {
    position: 'absolute',
    top: s(6),
    right: s(6),
    paddingHorizontal: s(7),
    paddingVertical: s(3),
    borderRadius: s(10),
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  timeText: {
    fontSize: s(8.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A1A2E',
  },
  body: {
    paddingHorizontal: s(8),
    paddingTop: s(6),
    paddingBottom: s(6),
  },
  name: {
    fontSize: s(12.5),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  nameDark: {
    color: '#FFFFFF',
  },
  meta: {
    marginTop: 0,
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(4),
  },
  location: {
    flex: 1,
    marginLeft: s(3),
    fontSize: s(10),
    fontFamily: theme.typography.fontFamily.medium,
  },
  dateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(8),
    paddingVertical: s(5),
  },
  date: {
    flex: 1,
    marginLeft: s(4),
    fontSize: s(9.5),
    fontFamily: theme.typography.fontFamily.bold,
  },
});
