import React, { useRef } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useMyPlaceSubmissions } from '../../hooks/placeSubmission';
import { resolveImageUrl } from '../../hooks/useDiscovery';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import FastImage from '../../components/common/FastImage';
import { LoaderCard } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from '../Home/components';

const STATUS_META = {
  pending: { label: 'Pending review', color: '#B45309', bg: '#FEF3C7', icon: 'time-outline' },
  in_review: { label: 'In review', color: '#1D4ED8', bg: '#DBEAFE', icon: 'search-outline' },
  approved: { label: 'Approved', color: '#047857', bg: '#D1FAE5', icon: 'checkmark-circle' },
  published: { label: 'Published', color: '#047857', bg: '#D1FAE5', icon: 'checkmark-circle' },
  rejected: { label: 'Not accepted', color: '#B91C1C', bg: '#FEE2E2', icon: 'close-circle' },
  needs_changes: {
    label: 'Needs changes',
    color: '#C2410C',
    bg: '#FFEDD5',
    icon: 'create-outline',
  },
};

export const getStatusMeta = status => {
  const key = String(status || '').replace(/[\s-]+/g, '_');
  if (STATUS_META[key]) {
    return STATUS_META[key];
  }
  if (key.includes('review')) {
    return STATUS_META.in_review;
  }
  if (key.includes('reject') || key.includes('declin')) {
    return STATUS_META.rejected;
  }
  if (key.includes('approv') || key.includes('publish') || key.includes('live')) {
    return STATUS_META.published;
  }
  return STATUS_META.pending;
};

const formatSubmitted = value => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const SubmissionCard = ({ item, isDarkMode }) => {
  const meta = getStatusMeta(item.status);
  const place = [item.city, item.state].filter(Boolean).join(', ');
  const submitted = formatSubmitted(item.createdAt);
  const imageUri = resolveImageUrl(item.photoUrl);

  return (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={[styles.thumb, isDarkMode && styles.thumbDark]}>
        {imageUri ? (
          <FastImage source={{ uri: imageUri }} style={styles.thumbImage} />
        ) : (
          <Ionicons name="location" size={ms(22)} color={isDarkMode ? '#C4B5FD' : '#7C3AED'} />
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]} numberOfLines={2}>
          {item.name}
        </Text>
        {!!(item.category || place) && (
          <Text style={[styles.cardMeta, isDarkMode && styles.mutedDark]} numberOfLines={1}>
            {[item.category, place].filter(Boolean).join(' · ')}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon} size={ms(11)} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {!!submitted && (
            <Text style={[styles.cardDate, isDarkMode && styles.mutedDark]}>{submitted}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

// The signed-in user's own place submissions (opened from Profile > My Submissions)
export const MySubmissionsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const { data, isLoading, isError, refetch, isRefetching } = useMyPlaceSubmissions();
  const submissions = data || [];
  // Drives the background glows, as on the Home screen
  const scrollY = useRef(new Animated.Value(0)).current;

  const goToAddPlace = () => navigation.navigate('AddPlaceScreen');

  const renderEmpty = () => {
    if (isError) {
      return (
        <View style={styles.emptyWrap}>
          <Ionicons
            name="cloud-offline-outline"
            size={ms(44)}
            color={isDarkMode ? '#64748B' : '#94A3B8'}
          />
          <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
            Could not load your submissions
          </Text>
          <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
            Check your connection and try again.
          </Text>
          <BouncyPressable
            testID="my-submissions-retry-btn"
            style={styles.emptyBtn}
            activeScale={0.95}
            onPress={refetch}>
            <Text style={styles.emptyBtnText}>Try again</Text>
          </BouncyPressable>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="location-outline" size={ms(52)} color="#A7D3B0" />
        <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
          No contributions yet
        </Text>
        <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
          Help the community by sharing pet-friendly spots.
        </Text>
        <BouncyPressable
          testID="my-submissions-add-btn"
          style={styles.emptyBtn}
          activeScale={0.95}
          onPress={goToAddPlace}>
          <Text style={styles.emptyBtnText}>Add a Place</Text>
        </BouncyPressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />

      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="My Submissions"
        subtitle="PLACES YOU SHARED"
        onBack={() => navigation.goBack()}
        testID="my-submissions-back-btn"
      />

      {isLoading ? (
        <LoaderCard
          style={styles.center}
          label="Loading your submissions…"
          isDarkMode={isDarkMode}
        />
      ) : (
        <FlatList
          data={submissions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <SubmissionCard item={item} isDarkMode={isDarkMode} />}
          ListHeaderComponent={
            submissions.length > 0 ? (
              <View style={[styles.countPill, isDarkMode && styles.countPillDark]}>
                <Ionicons name="location" size={ms(11)} color="#7C3AED" />
                <Text style={[styles.countText, isDarkMode && styles.textWhite]}>
                  {submissions.length} {submissions.length === 1 ? 'place' : 'places'} submitted
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={renderEmpty}
          scrollEventThrottle={16}
          onScroll={e => scrollY.setValue(e.nativeEvent.contentOffset.y)}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + vs(96) }]}
        />
      )}

      {submissions.length > 0 && (
        <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom, vs(16)) + vs(12) }]}>
          <BouncyPressable
            testID="my-submissions-fab"
            style={styles.fab}
            activeScale={0.95}
            onPress={goToAddPlace}>
            <Ionicons name="add" size={ms(18)} color="#FFFFFF" />
            <Text style={styles.fabText}>Add a Place</Text>
          </BouncyPressable>
        </View>
      )}
    </View>
  );
};

const { fontFamily } = theme.typography;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },
  center: { flex: 1 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
    alignSelf: 'flex-start',
    marginBottom: vs(12),
    backgroundColor: '#F3EEFF',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  countPillDark: { backgroundColor: '#2A1250' },
  countText: { fontSize: s(10.5), fontFamily: fontFamily.bold, color: '#4C1D95' },
  listContent: { paddingHorizontal: s(15), paddingTop: vs(4), flexGrow: 1 },
  card: {
    flexDirection: 'row',
    gap: s(12),
    backgroundColor: '#FFFFFF',
    borderRadius: s(18),
    padding: s(12),
    marginBottom: vs(12),
    borderWidth: 1.2,
    borderColor: '#ECE8E1',
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD7CC',
    ...Platform.select({
      ios: {
        shadowColor: '#200744',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  cardDark: { backgroundColor: '#190A32', borderColor: '#371569', borderBottomColor: '#230A47' },
  thumb: {
    width: s(64),
    height: s(64),
    borderRadius: s(14),
    backgroundColor: '#F3EEFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbDark: { backgroundColor: '#2A1250' },
  thumbImage: { width: '100%', height: '100%' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: s(13.5), fontFamily: fontFamily.bold, color: '#1E1B4B' },
  cardMeta: { fontSize: s(11), fontFamily: fontFamily.regular, color: '#6B7280', marginTop: vs(2) },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(8),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    borderRadius: s(10),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
  },
  statusText: { fontSize: s(10), fontFamily: fontFamily.bold },
  cardDate: { fontSize: s(10), fontFamily: fontFamily.medium, color: '#9CA3AF' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(24),
    paddingTop: vs(60),
  },
  emptyTitle: {
    fontSize: s(18),
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
    marginTop: vs(18),
    backgroundColor: '#35128A',
    borderRadius: s(16),
    paddingHorizontal: s(28),
    paddingVertical: vs(12),
  },
  emptyBtnText: { fontSize: s(14), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  fabWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#35128A',
    borderRadius: s(24),
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
    borderBottomWidth: 3.5,
    borderBottomColor: '#220D5C',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  fabText: { fontSize: s(13), fontFamily: fontFamily.bold, color: '#FFFFFF' },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#B4A8D0' },
});
