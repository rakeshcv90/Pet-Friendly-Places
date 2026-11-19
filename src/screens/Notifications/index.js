import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';
import { theme } from '../../theme';
import { useStore } from '../../store';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { LoaderCard } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { NotificationItem } from '../../components/notifications/NotificationItem';
import { DAY_GROUPS, dayGroup } from '../../components/notifications/format';
import { AmbientBackground } from '../Home/components';

const { fontFamily } = theme.typography;
const SCREEN_WIDTH = Dimensions.get('window').width;

const byNewest = (a, b) =>
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

/**
 * Compact summary: unread count, read progress and the one-tap "Mark all read".
 * It tips in with a 3D entrance, a light band sweeps across it, and the bell rings now and then.
 */
const SummaryCard = ({ unreadCount, total, onMarkAll }) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const swing = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 8 }).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    shimmerLoop.start();

    const swingLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(swing, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(swing, { toValue: -1, duration: 160, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0.6, duration: 130, useNativeDriver: true }),
        Animated.timing(swing, { toValue: -0.4, duration: 130, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]),
    );
    swingLoop.start();

    return () => {
      shimmerLoop.stop();
      swingLoop.stop();
    };
  }, [entrance, shimmer, swing]);

  const intro = {
    opacity: entrance,
    transform: [
      { perspective: 1000 },
      { rotateX: entrance.interpolate({ inputRange: [0, 1], outputRange: ['24deg', '0deg'] }) },
      { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
      { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
    ],
  };
  const sweep = {
    transform: [
      { translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-s(170), SCREEN_WIDTH] }) },
      { rotate: '18deg' },
    ],
  };
  const ring = {
    transform: [
      { rotate: swing.interpolate({ inputRange: [-1, 1], outputRange: ['-22deg', '22deg'] }) },
    ],
  };

  const read = total - unreadCount;
  const readPercent = total > 0 ? Math.round((read / total) * 100) : 0;

  return (
    <Animated.View style={intro}>
      <LinearGradient
        colors={['#35128A', '#7B2CFF', '#C026D3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summary}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          style={styles.summaryGloss}
        />
        <View pointerEvents="none" style={styles.summaryGlow} />
        <Animated.View pointerEvents="none" style={[styles.sweep, sweep]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sweepFill}
          />
        </Animated.View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryBell}>
            <Animated.View style={ring}>
              <Ionicons name="notifications" size={ms(19)} color="#FFFFFF" />
            </Animated.View>
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>
              <Text style={styles.summaryCount}>{unreadCount}</Text>
              {` unread ${unreadCount === 1 ? 'notification' : 'notifications'}`}
            </Text>
            <Text style={styles.summarySub}>
              {unreadCount > 0 ? `${total} in total` : 'You are all caught up'}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <BouncyPressable
              testID="notifications-mark-all"
              style={styles.markAllBtn}
              activeScale={0.94}
              onPress={onMarkAll}>
              <Ionicons name="checkmark-done" size={ms(14)} color="#4C1D95" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </BouncyPressable>
          ) : null}
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={['#FFFFFF', '#FBCFE8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${readPercent}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {read} of {total} read
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

/** "View all" from the bell: every notification, unread and read together, newest first. */
export const NotificationsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [tab, setTab] = useState('all');
  const [tabsWidth, setTabsWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: tab === 'all' ? 0 : 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [tab, slide]);
  const pillWidth = Math.max(0, (tabsWidth - s(8)) / 2);

  const items = useMemo(() => [...(data || [])].sort(byNewest), [data]);
  const unreadCount = useMemo(() => items.filter(item => !item.isRead).length, [items]);

  // Newest first, grouped under Today / Yesterday / This week / Earlier
  const sections = useMemo(() => {
    const visible = tab === 'unread' ? items.filter(item => !item.isRead) : items;
    return DAY_GROUPS.map(title => ({
      title,
      data: visible.filter(item => dayGroup(item.createdAt) === title),
    })).filter(section => section.data.length > 0);
  }, [items, tab]);

  const handlePress = item => {
    if (!item.isRead) {
      markRead.mutate([item.id]);
    }
  };

  const renderEmpty = () => {
    if (isError) {
      return (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={ms(48)} color="#C4B5FD" />
          <Text style={[styles.emptyTitle, isDarkMode && styles.textLight]}>
            Could not load notifications
          </Text>
          <BouncyPressable style={styles.emptyBtn} activeScale={0.95} onPress={refetch}>
            <Text style={styles.emptyBtnText}>Try again</Text>
          </BouncyPressable>
        </View>
      );
    }
    const caughtUp = tab === 'unread';
    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyBadge, isDarkMode && styles.emptyBadgeDark]}>
          <Ionicons
            name={caughtUp ? 'checkmark-done' : 'notifications-off-outline'}
            size={ms(30)}
            color={isDarkMode ? '#C4B5FD' : '#7B2CFF'}
          />
        </View>
        <Text style={[styles.emptyTitle, isDarkMode && styles.textLight]}>
          {caughtUp ? 'You are all caught up' : 'No notifications yet'}
        </Text>
        <Text style={[styles.emptyText, isDarkMode && styles.textMuted]}>
          {caughtUp
            ? 'No unread notifications right now.'
            : 'Replies, alerts and updates will show up here.'}
        </Text>
      </View>
    );
  };

  const tabs = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Notifications"
        subtitle="YOUR UPDATES"
        onBack={() => navigation.goBack()}
        testID="notifications-back-btn"
      />

      {isLoading ? (
        <LoaderCard style={styles.flex} label="Loading notifications…" isDarkMode={isDarkMode} />
      ) : (
        <>
          {/* Fixed: stays in place while only the list below scrolls */}
          <View style={styles.fixed}>
            {!isError && items.length > 0 ? (
              <SummaryCard
                unreadCount={unreadCount}
                total={items.length}
                onMarkAll={() => markAllRead.mutate()}
              />
            ) : null}
            <View
              style={[styles.tabs, isDarkMode && styles.tabsDark]}
              onLayout={e => setTabsWidth(e.nativeEvent.layout.width)}>
              {tabsWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.pill,
                    {
                      width: pillWidth,
                      transform: [
                        {
                          translateX: slide.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, pillWidth],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <LinearGradient
                    colors={['#35128A', '#7B2CFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pillFill}
                  />
                </Animated.View>
              ) : null}
              {tabs.map(t => {
                const active = tab === t.key;
                return (
                  <BouncyPressable
                    key={t.key}
                    testID={`notifications-tab-${t.key}`}
                    style={[styles.tab, active && tabsWidth === 0 && styles.tabActive]}
                    activeScale={0.96}
                    onPress={() => setTab(t.key)}>
                    <Text
                      style={[
                        styles.tabText,
                        isDarkMode && styles.textMuted,
                        active && styles.tabTextActive,
                      ]}>
                      {t.label}
                    </Text>
                    <View style={[styles.tabCount, active && styles.tabCountActive]}>
                      <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                        {t.count}
                      </Text>
                    </View>
                  </BouncyPressable>
                );
              })}
            </View>
          </View>

          <SectionList
            style={styles.flex}
            sections={sections}
            keyExtractor={item => String(item.id)}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                  {section.title.toUpperCase()}
                </Text>
                <View style={[styles.sectionLine, isDarkMode && styles.sectionLineDark]} />
              </View>
            )}
            renderItem={({ item, index }) => (
              <NotificationItem
                item={item}
                index={index}
                isDarkMode={isDarkMode}
                testID={`notifications-item-${item.id}`}
                onPress={handlePress}
              />
            )}
            ListEmptyComponent={renderEmpty}
            scrollEventThrottle={16}
            onScroll={e => scrollY.setValue(e.nativeEvent.contentOffset.y)}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={isRefetching}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + vs(24) }]}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },
  fixed: { paddingHorizontal: s(15), paddingTop: vs(4) },
  listContent: { paddingHorizontal: s(15), paddingTop: vs(2), flexGrow: 1 },

  summary: {
    borderRadius: s(20),
    paddingHorizontal: s(14),
    paddingVertical: s(12),
    overflow: 'hidden',
    marginBottom: vs(10),
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    borderBottomWidth: 4,
    borderBottomColor: '#220D5C',
    ...Platform.select({
      ios: {
        shadowColor: '#35128A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
      android: { elevation: 7 },
    }),
  },
  summaryGloss: { position: 'absolute', top: 0, left: 0, right: 0, height: s(46) },
  summaryGlow: {
    position: 'absolute',
    right: -s(30),
    top: -s(40),
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  sweep: { position: 'absolute', top: -s(30), bottom: -s(30), width: s(110) },
  sweepFill: { flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  summaryBell: {
    width: s(38),
    height: s(38),
    borderRadius: s(13),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: { flex: 1 },
  summaryTitle: { color: '#FFFFFF', fontSize: s(13), fontFamily: fontFamily.bold },
  summaryCount: { fontSize: s(18), fontFamily: fontFamily.extraBold },
  summarySub: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: s(10.5),
    fontFamily: fontFamily.medium,
    marginTop: vs(1),
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    backgroundColor: '#FFFFFF',
    borderRadius: s(13),
    paddingHorizontal: s(11),
    paddingVertical: vs(7),
    borderBottomWidth: 3,
    borderBottomColor: '#D4C8F3',
  },
  markAllText: { fontSize: s(11), fontFamily: fontFamily.bold, color: '#4C1D95' },
  progressWrap: { marginTop: vs(10), flexDirection: 'row', alignItems: 'center', gap: s(10) },
  progressTrack: {
    flex: 1,
    height: s(5),
    borderRadius: s(3),
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: s(3) },
  progressText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: s(10),
    fontFamily: fontFamily.semiBold,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: s(16),
    padding: s(4),
    marginBottom: vs(4),
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    borderBottomWidth: 3,
    borderBottomColor: '#DDD7CC',
  },
  tabsDark: { backgroundColor: '#190A32', borderColor: '#371569', borderBottomColor: '#230A47' },
  pill: { position: 'absolute', top: s(4), bottom: s(4), left: s(4) },
  pillFill: {
    flex: 1,
    borderRadius: s(12),
    borderBottomWidth: 3,
    borderBottomColor: '#220D5C',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(7),
    paddingVertical: vs(7),
    borderRadius: s(12),
  },
  tabActive: { backgroundColor: '#35128A' },
  tabText: { fontSize: s(12), fontFamily: fontFamily.bold, color: '#6B5E8A' },
  tabTextActive: { color: '#FFFFFF' },
  tabCount: {
    minWidth: s(20),
    paddingHorizontal: s(6),
    paddingVertical: vs(1),
    borderRadius: s(10),
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
  },
  tabCountActive: { backgroundColor: '#EE2A7B' },
  tabCountText: { fontSize: s(10.5), fontFamily: fontFamily.bold, color: '#4C1D95' },
  tabCountTextActive: { color: '#FFFFFF' },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginTop: vs(10),
    marginBottom: vs(8),
  },
  sectionTitle: { fontSize: s(10), letterSpacing: 1, fontFamily: fontFamily.bold, color: '#7B2CFF' },
  sectionTitleDark: { color: '#C4B5FD' },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#E4D8FF' },
  sectionLineDark: { backgroundColor: '#371569' },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
    paddingTop: vs(40),
  },
  emptyBadge: {
    width: s(72),
    height: s(72),
    borderRadius: s(24),
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBadgeDark: { backgroundColor: '#2A1250' },
  emptyTitle: {
    fontSize: s(17),
    fontFamily: fontFamily.extraBold,
    color: '#1E1B4B',
    marginTop: vs(14),
    textAlign: 'center',
  },
  emptyText: {
    fontSize: s(13),
    fontFamily: fontFamily.regular,
    color: '#7A6F8A',
    textAlign: 'center',
    marginTop: vs(6),
  },
  emptyBtn: {
    marginTop: vs(16),
    backgroundColor: '#35128A',
    borderRadius: s(16),
    paddingHorizontal: s(26),
    paddingVertical: vs(11),
  },
  emptyBtnText: { fontSize: s(14), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  textLight: { color: '#F3E8FF' },
  textMuted: { color: '#A99BC4' },
});
