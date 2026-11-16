import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { timeAgo } from '../../Community/utils';

const KIND = {
  post: { label: 'Post', icon: 'document-text', colors: ['#7C3AED', '#A855F7'], tint: '#7C3AED' },
  reply: {
    label: 'Reply',
    icon: 'chatbubble-ellipses',
    colors: ['#EC4899', '#F472B6'],
    tint: '#DB2777',
  },
};

// Moderation state of the user's own content, shown so a held or removed item is not a surprise
const STATUS = {
  held_for_review: { label: 'Under review', bg: '#FEF3C7', color: '#B45309', icon: 'time' },
  removed: { label: 'Removed', bg: '#FEE2E2', color: '#B91C1C', icon: 'close-circle' },
};

export const ActivityCard = ({ item, isDarkMode, onPress }) => {
  const kind = KIND[item.kind] || KIND.post;
  const status = STATUS[item.status];
  const title = item.kind === 'reply' ? item.postTitle : item.title;

  return (
    <BouncyPressable
      testID={`community-activity-${item.kind}-${item.id}`}
      style={[styles.card, isDarkMode && styles.cardDark]}
      activeScale={0.98}
      onPress={onPress}>
      <LinearGradient colors={kind.colors} style={styles.iconWrap}>
        <Ionicons name={kind.icon} size={ms(16)} color="#FFFFFF" />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={[styles.kindText, { color: kind.tint }]}>{kind.label.toUpperCase()}</Text>
          {!!status && (
            <View style={[styles.statusChip, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
          )}
          <Text style={[styles.time, isDarkMode && styles.mutedDark]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>

        <Text style={[styles.title, isDarkMode && styles.textWhite]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.excerpt, isDarkMode && styles.mutedDark]} numberOfLines={2}>
          {item.body}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.communityText} numberOfLines={1}>
            {item.communityName}
          </Text>
          <View style={styles.stat}>
            <Ionicons name="arrow-up-circle-outline" size={ms(13)} color="#94A3B8" />
            <Text style={styles.statText}>{item.upvoteCount ?? 0}</Text>
          </View>
          {item.kind === 'post' && (
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={ms(12)} color="#94A3B8" />
              <Text style={styles.statText}>{item.replyCount ?? 0}</Text>
            </View>
          )}
        </View>
      </View>
    </BouncyPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: s(16),
    marginBottom: vs(10),
    padding: s(12),
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDD6FE',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardDark: { backgroundColor: '#1A1033', borderColor: '#2E1F55', shadowOpacity: 0.3 },
  iconWrap: {
    width: s(34),
    height: s(34),
    borderRadius: s(11),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  content: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(3) },
  kindText: {
    fontSize: ms(10),
    fontFamily: theme.typography.fontFamily.extraBold,
    letterSpacing: 0.8,
  },
  statusChip: {
    paddingHorizontal: s(7),
    paddingVertical: vs(1.5),
    borderRadius: s(10),
    marginLeft: s(8),
  },
  statusText: { fontSize: ms(9.5), fontFamily: theme.typography.fontFamily.bold },
  time: {
    marginLeft: 'auto',
    fontSize: ms(10.5),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: '#94A3B8',
  },
  title: { fontSize: ms(14), fontFamily: theme.typography.fontFamily.extraBold, color: '#1E1B4B' },
  excerpt: { fontSize: ms(12), color: '#64748B', lineHeight: ms(17), marginTop: vs(2) },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: vs(8) },
  communityText: {
    flex: 1,
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#7C3AED',
  },
  stat: { flexDirection: 'row', alignItems: 'center', marginLeft: s(12) },
  statText: {
    fontSize: ms(11),
    fontFamily: theme.typography.fontFamily.bold,
    color: '#64748B',
    marginLeft: s(3),
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#A5B4CF' },
});
