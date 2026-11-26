import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useMyActivity, filterActivity } from '../../hooks/useCommunity';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { ActivityCard } from './components';
import { NightSky } from '../Community/NightSky';
import { Bob } from '../Community/Motion';
import { LoaderCard } from '../../components/common/Loader';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';

// Full list of the signed-in user's own posts and replies (opened from Profile > Community > Browse)
// One activity row. Memoised, so switching the filter or refreshing redraws only what changed.
const ActivityRow = React.memo(({ item, isDarkMode, onOpen }) => (
  <ActivityCard item={item} isDarkMode={isDarkMode} onPress={() => onOpen(item)} />
));

const keyOfActivity = item => `${item.kind}-${item.id}`;

export const MyActivityScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const openActivity = useCallback(
    item => navigation.navigate('CommunityPostDetailScreen', { slug: item.postSlug || item.slug }),
    [navigation],
  );
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const renderActivity = useCallback(
    ({ item }) => <ActivityRow item={item} isDarkMode={isDarkMode} onOpen={openActivity} />,
    [isDarkMode, openActivity],
  );
  const [filter, setFilter] = useState(route?.params?.initialFilter || 'all');
  const { data, isLoading, isError, refetch, isRefetching } = useMyActivity();

  const items = useMemo(() => filterActivity(data?.items || [], filter), [data, filter]);
  const postCount = data?.postCount ?? 0;
  const replyCount = data?.replyCount ?? 0;
  const filters = [
    { id: 'all', label: `All (${postCount + replyCount})` },
    { id: 'posts', label: `Posts (${postCount})` },
    { id: 'replies', label: `Replies (${replyCount})` },
  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />

      {/* Signature ambient paw watermarks, as on the other community screens */}
      <View style={styles.pawTop} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(140)}
          color={isDarkMode ? 'rgba(168, 85, 247, 0.08)' : 'rgba(123, 44, 255, 0.035)'}
        />
      </View>
      <View style={styles.pawBottom} pointerEvents="none">
        <Ionicons
          name="paw"
          size={ms(160)}
          color={isDarkMode ? 'rgba(238, 42, 123, 0.06)' : 'rgba(238, 42, 123, 0.03)'}
        />
      </View>

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
          style={[styles.heroTopFade, { height: insets.top + s(70) }]}
        />
        <NightSky topInset={insets.top} />

        <BouncyPressable
          testID="my-activity-back-btn"
          accessibilityLabel="Back"
          activeScale={0.95}
          onPress={() => navigation.goBack()}
          style={styles.backLink}>
          <Feather name="chevron-left" size={ms(15)} color="rgba(255,255,255,0.8)" />
          <Text style={styles.backLinkText}>🐾 Profile</Text>
        </BouncyPressable>

        <View style={styles.titleRow}>
          <Bob style={styles.emojiTile} distance={4} duration={2400}>
            <Text style={styles.emojiTileText}>✍️</Text>
          </Bob>
          <Text style={styles.heroTitle}>My Activity</Text>
        </View>
        <Text style={styles.heroDesc}>
          Everything you have posted and replied to across the pack community.
        </Text>

        <View style={styles.statTiles}>
          <View style={styles.statTile}>
            <Text style={styles.statTileIcon}>📝</Text>
            <View>
              <Text style={styles.statTileValue}>{postCount}</Text>
              <Text style={styles.statTileLabel}>Posts</Text>
            </View>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statTileIcon}>💬</Text>
            <View>
              <Text style={styles.statTileValue}>{replyCount}</Text>
              <Text style={styles.statTileLabel}>Replies</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {isLoading ? (
        <LoaderCard style={styles.center} label="Loading your activity…" isDarkMode={isDarkMode} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={keyOfActivity}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={[styles.segmentTrack, isDarkMode && styles.segmentTrackDark]}>
                {filters.map(f => {
                  const isActive = filter === f.id;
                  return (
                    <BouncyPressable
                      key={f.id}
                      testID={`activity-tab-${f.id}`}
                      style={[
                        styles.segmentTab,
                        isActive &&
                          (isDarkMode ? styles.segmentTabActiveDark : styles.segmentTabActive),
                      ]}
                      activeScale={0.96}
                      onPress={() => setFilter(f.id)}>
                      <Text
                        style={[
                          styles.segmentText,
                          isDarkMode && styles.mutedDark,
                          isActive &&
                            (isDarkMode ? styles.segmentTextActiveDark : styles.segmentTextActive),
                        ]}>
                        {f.label}
                      </Text>
                    </BouncyPressable>
                  );
                })}
              </View>
            </>
          }
          renderItem={renderActivity}
          contentContainerStyle={{ paddingBottom: insets.bottom + vs(36) }}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={[styles.emptyCard, isDarkMode && styles.emptyCardDark]}>
              <Ionicons
                name={isError ? 'cloud-offline-outline' : 'chatbubble-outline'}
                size={ms(44)}
                color={isDarkMode ? '#64748B' : '#94A3B8'}
              />
              <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                {isError
                  ? 'Could not load your activity. Pull down to retry.'
                  : `No ${filter === 'all' ? 'activity' : filter} yet.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  containerDark: { backgroundColor: '#0F071D' },
  pawTop: {
    position: 'absolute',
    top: vs(120),
    right: -s(25),
    transform: [{ rotate: '-25deg' }],
  },
  pawBottom: {
    position: 'absolute',
    bottom: vs(100),
    left: -s(30),
    transform: [{ rotate: '30deg' }],
  },
  hero: {
    paddingHorizontal: s(15),
    paddingBottom: s(18),
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
  },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(2),
    marginBottom: s(8),
    marginLeft: -s(4),
  },
  backLinkText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: 'rgba(255,255,255,0.78)',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginBottom: s(8) },
  emojiTile: {
    width: s(46),
    height: s(46),
    borderRadius: s(15),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emojiTileText: { fontSize: s(24) },
  heroTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(22),
    lineHeight: s(27),
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  heroDesc: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: s(12),
    lineHeight: s(18),
    color: 'rgba(255,255,255,0.88)',
    marginBottom: s(12),
  },
  statTiles: { flexDirection: 'row', gap: s(8) },
  statTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.35)',
    borderRadius: s(16),
    paddingVertical: s(8),
    paddingHorizontal: s(14),
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statTileIcon: { fontSize: s(17) },
  statTileValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    lineHeight: s(19),
    color: '#FFFFFF',
  },
  statTileLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(9.5),
    color: 'rgba(255,255,255,0.75)',
  },
  segmentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: s(16),
    marginTop: vs(14),
    marginBottom: vs(12),
    padding: s(3.5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  segmentTrackDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(7.5),
    borderRadius: s(11),
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  segmentTabActiveDark: { backgroundColor: '#2D1452', borderColor: '#7C3AED' },
  segmentText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#64748B',
  },
  segmentTextActive: { color: '#7C3AED', fontFamily: theme.typography.fontFamily.bold },
  segmentTextActiveDark: { color: '#C084FC', fontFamily: theme.typography.fontFamily.bold },
  center: { marginTop: vs(60), marginHorizontal: s(40) },
  emptyCard: {
    marginHorizontal: s(16),
    paddingVertical: vs(40),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyCardDark: { backgroundColor: '#1A1033', borderColor: '#2E1F55' },
  emptyText: {
    marginTop: vs(10),
    fontSize: ms(13),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
