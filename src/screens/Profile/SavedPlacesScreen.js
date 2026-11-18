import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useSavedPlaces, useUnsavePlace, useRestoreSavedPlace } from '../../hooks/useUser';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { SavedPlaceCard } from './components';
import { buildListing } from '../StoryGuides/ListingDetail/listingModel';
import { SHOW_DEMO_SAVED_PLACES, DEMO_SAVED_PLACES } from './savedPlacesDemo';
import { LoaderCard } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from '../Home/components';

// All places the signed-in user saved (opened from Profile > Saved Places)
export const SavedPlacesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const { data, isLoading, isError, refetch, isRefetching } = useSavedPlaces();
  const unsave = useUnsavePlace();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const restore = useRestoreSavedPlace();
  // The place just removed, kept for a few seconds so Undo can put it back
  const [undo, setUndo] = useState(null);
  useEffect(() => {
    if (!undo) {
      return undefined;
    }
    const timer = setTimeout(() => setUndo(null), 4500);
    return () => clearTimeout(timer);
  }, [undo]);

  // Demo list for checking the design; removing a card only updates this local copy
  const [demoPlaces, setDemoPlaces] = useState(DEMO_SAVED_PLACES);
  const handleUnsave = id => {
    if (SHOW_DEMO_SAVED_PLACES) {
      setDemoPlaces(current => current.filter(place => place.id !== id));
      return;
    }
    const entry = (data || [])
      .map(raw => raw?.listing || raw)
      .find(raw => String(raw?.id ?? raw?.listing_id) === String(id));
    unsave.mutate(id);
    setUndo({ id, name: entry?.name, entry: entry || { id } });
  };
  const handleUndo = useCallback(() => {
    if (undo) {
      restore.mutate({ ...undo.entry, id: undo.id });
      setUndo(null);
    }
  }, [undo, restore]);

  // buildListing drops the id, which the delete request needs
  const places = useMemo(
    () =>
      (SHOW_DEMO_SAVED_PLACES ? demoPlaces : data || [])
        .map(raw => {
          const place = buildListing(raw);
          return place && { ...place, id: raw.id ?? raw.listing_id };
        })
        .filter(Boolean),
    [data, demoPlaces],
  );

  const categories = useMemo(
    () => ['All', ...new Set(places.map(place => place.categoryLabel).filter(Boolean))],
    [places],
  );
  const activeCategory = categories.includes(category) ? category : 'All';
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return places.filter(place => {
      if (activeCategory !== 'All' && place.categoryLabel !== activeCategory) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [place.name, place.city, place.location, place.categoryLabel]
        .filter(Boolean)
        .some(text => String(text).toLowerCase().includes(needle));
    });
  }, [places, activeCategory, query]);
  const categoryCounts = useMemo(() => {
    const counts = {};
    places.forEach(place => {
      counts[place.categoryLabel] = (counts[place.categoryLabel] || 0) + 1;
    });
    return counts;
  }, [places]);
  const verifiedCount = places.filter(place => place.verifiedLabel).length;
  const cityCount = new Set(places.map(place => place.city).filter(Boolean)).size;

  const header = (
    <View>
      {/* Collection banner */}
      <LinearGradient
        colors={['#3B108F', '#7B2CFF', '#C026D3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}>
        <View style={styles.bannerGlow} />
        <View style={styles.bannerTop}>
          <View style={styles.bannerIcon}>
            <Ionicons name="bookmark" size={ms(20)} color="#FFFFFF" />
          </View>
          <View style={styles.bannerTitles}>
            <Text style={styles.bannerOverline}>YOUR COLLECTION</Text>
            <Text style={styles.bannerTitle}>Places you love</Text>
          </View>
        </View>
        <View style={styles.bannerStats}>
          {[
            { value: places.length, label: 'Saved' },
            { value: verifiedCount, label: 'Verified' },
            { value: cityCount, label: cityCount === 1 ? 'City' : 'Cities' },
          ].map((tile, index) => (
            <View key={tile.label} style={[styles.bannerStat, index > 0 && styles.bannerStatDivider]}>
              <Text style={styles.bannerStatValue}>{tile.value}</Text>
              <Text style={styles.bannerStatLabel}>{tile.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {places.length > 3 ? (
        <View style={[styles.search, isDarkMode && styles.searchDark]}>
          <Ionicons name="search" size={ms(16)} color={isDarkMode ? '#94A3B8' : '#7C3AED'} />
          <TextInput
            testID="saved-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search your saved places"
            placeholderTextColor={isDarkMode ? '#64748B' : '#A49AAF'}
            style={[styles.searchInput, isDarkMode && styles.textWhite]}
            returnKeyType="search"
          />
          {query ? (
            <BouncyPressable activeScale={0.85} onPress={() => setQuery('')} testID="saved-search-clear">
              <Ionicons name="close-circle" size={ms(18)} color="#94A3B8" />
            </BouncyPressable>
          ) : null}
        </View>
      ) : null}

      {categories?.length > 2 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {categories?.map(name => {
            const active = name === activeCategory;
            const count = name === 'All' ? places.length : categoryCounts[name];
            return (
              <BouncyPressable
                key={name}
                testID={`saved-filter-${name}`}
                activeScale={0.94}
                onPress={() => setCategory(name)}
                style={[styles.chip, isDarkMode && styles.chipDark, active && styles.chipActive]}>
                <Text
                  style={[
                    styles.chipText,
                    isDarkMode && styles.mutedDark,
                    active && styles.chipTextActive,
                  ]}>
                  {name}
                </Text>
                <View style={[styles.chipCount, active && styles.chipCountActive]}>
                  <Text style={[styles.chipCountText, active && styles.chipTextActive]}>{count}</Text>
                </View>
              </BouncyPressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.headerSpacer} />
      )}

      {places.length > 0 ? (
        <Text style={[styles.resultLine, isDarkMode && styles.mutedDark]}>
          {visible.length === places.length
            ? `${places.length} saved ${places.length === 1 ? 'place' : 'places'}`
            : `${visible.length} of ${places.length} saved places`}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />

      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Saved Places"
        subtitle="YOUR BOOKMARKS"
        onBack={() => navigation.goBack()}
        testID="saved-places-back-btn"
      />

      {isLoading && !SHOW_DEMO_SAVED_PLACES ? (
        <LoaderCard style={styles.center} label="Loading saved places…" isDarkMode={isDarkMode} />
      ) : (
        <Animated.FlatList
          data={visible}
          keyExtractor={(item, index) => String(item.id ?? item.slug ?? index)}
          renderItem={({ item, index }) => (
            <SavedPlaceCard
              item={item}
              index={index}
              scrollY={scrollY}
              isDarkMode={isDarkMode}
              onOpen={() =>
                item.slug && navigation.navigate('ListingDetailScreen', { slug: item.slug })
              }
              onRemove={handleUnsave}
            />
          )}
          ListHeaderComponent={header}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ paddingBottom: insets.bottom + vs(36) }}
          ListEmptyComponent={
            <View style={[styles.emptyCard, isDarkMode && styles.emptyCardDark]}>
              <LinearGradient
                colors={isError ? ['#94A3B8', '#64748B'] : ['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIcon}>
                <Ionicons
                  name={isError ? 'cloud-offline-outline' : 'bookmark-outline'}
                  size={ms(30)}
                  color="#FFFFFF"
                />
              </LinearGradient>
              {places.length > 0 ? (
                <>
                  <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
                    No matching places
                  </Text>
                  <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                    Try another search or choose a different category.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.emptyTitle, isDarkMode && styles.textWhite]}>
                    {isError ? 'Something went wrong' : 'Your collection is empty'}
                  </Text>
                  <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                    {isError
                      ? 'Could not load your saved places. Pull down to retry.'
                      : 'No saved places yet. Tap the heart on any place to keep it here.'}
                  </Text>
                  {!isError ? (
                    <BouncyPressable
                      testID="saved-explore-btn"
                      activeScale={0.96}
                      style={styles.emptyCta}
                      onPress={() => navigation.navigate('SearchScreen')}>
                      <LinearGradient
                        colors={['#7B2CFF', '#3B108F']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emptyCtaGrad}>
                        <Ionicons name="compass-outline" size={ms(16)} color="#FFFFFF" />
                        <Text style={styles.emptyCtaText}>Explore places</Text>
                      </LinearGradient>
                    </BouncyPressable>
                  ) : null}
                </>
              )}
            </View>
          }
        />
      )}

      {undo ? (
        <View style={[styles.undoBar, { bottom: insets.bottom + vs(18) }]} testID="saved-undo-bar">
          <Ionicons name="bookmark-outline" size={ms(16)} color="#E9D5FF" />
          <Text style={styles.undoText} numberOfLines={1}>
            {undo.name ? `Removed ${undo.name}` : 'Removed from saved'}
          </Text>
          <BouncyPressable testID="saved-undo-btn" activeScale={0.92} onPress={handleUndo}>
            <Text style={styles.undoAction}>Undo</Text>
          </BouncyPressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  banner: {
    marginHorizontal: s(16),
    marginTop: vs(4),
    borderRadius: s(24),
    padding: s(18),
    overflow: 'hidden',
    shadowColor: '#7B2CFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerGlow: {
    position: 'absolute',
    right: -s(40),
    top: -s(50),
    width: s(160),
    height: s(160),
    borderRadius: s(80),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  bannerTop: { flexDirection: 'row', alignItems: 'center' },
  bannerIcon: {
    width: s(40),
    height: s(40),
    borderRadius: s(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  bannerTitles: { flex: 1 },
  bannerOverline: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: s(10),
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.75)',
  },
  bannerTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(20),
    color: '#FFFFFF',
    marginTop: 2,
  },
  bannerStats: {
    flexDirection: 'row',
    marginTop: vs(16),
    borderRadius: s(16),
    backgroundColor: 'rgba(15,7,29,0.28)',
    paddingVertical: vs(10),
  },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerStatDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
  bannerStatValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(20),
    color: '#FFFFFF',
  },
  bannerStatLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(10.5),
    color: 'rgba(255,255,255,0.78)',
    marginTop: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginHorizontal: s(16),
    marginTop: vs(14),
    paddingHorizontal: s(14),
    height: vs(44),
    borderRadius: s(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  searchDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  searchInput: {
    flex: 1,
    fontSize: s(13.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: '#1E1B4B',
    paddingVertical: 0,
  },
  resultLine: {
    marginHorizontal: s(20),
    marginBottom: vs(10),
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(12),
    color: '#6B5C85',
  },
  chipCount: {
    marginLeft: s(7),
    minWidth: s(20),
    paddingHorizontal: s(6),
    height: s(18),
    borderRadius: s(9),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  chipCountText: { fontSize: s(10.5), color: '#64748B', fontFamily: theme.typography.fontFamily.bold },
  emptyIcon: {
    width: s(68),
    height: s(68),
    borderRadius: s(34),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: vs(16),
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(17),
    color: '#1E1B4B',
    textAlign: 'center',
  },
  emptyCta: { marginTop: vs(18), borderRadius: s(22), overflow: 'hidden' },
  emptyCtaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(22),
    paddingVertical: vs(11),
  },
  emptyCtaText: { color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold, fontSize: s(13.5) },
  undoBar: {
    position: 'absolute',
    left: s(16),
    right: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderRadius: s(18),
    backgroundColor: '#1E1B4B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  undoText: { flex: 1, color: '#FFFFFF', fontFamily: theme.typography.fontFamily.medium, fontSize: s(13) },
  undoAction: { color: '#C4B5FD', fontFamily: theme.typography.fontFamily.extraBold, fontSize: s(13.5) },
  headerSpacer: { height: vs(16) },
  chips: { paddingHorizontal: s(16), paddingVertical: vs(14) },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    paddingVertical: vs(7.5),
    borderRadius: s(20),
    marginRight: s(8),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#6D28D9' },
  chipText: { fontSize: s(12), color: '#64748B', fontFamily: theme.typography.fontFamily.bold },
  chipTextActive: { color: '#FFFFFF' },
  center: { marginTop: vs(60), marginHorizontal: s(40) },
  emptyCard: {
    marginHorizontal: s(16),
    paddingVertical: vs(44),
    paddingHorizontal: s(24),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  emptyCardDark: {
    backgroundColor: '#1A0B30',
    borderColor: '#2E1654',
    borderBottomColor: '#4C1D95',
  },
  emptyText: {
    marginTop: vs(12),
    textAlign: 'center',
    fontSize: s(13),
    lineHeight: s(19),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  mutedDark: { color: '#94A3B8' },
  textWhite: { color: '#FFFFFF' },
});
