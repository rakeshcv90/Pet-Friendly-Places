import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Animated, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useSavedPlaces, useUnsavePlace } from '../../hooks/useUser';
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

  // Demo list for checking the design; removing a card only updates this local copy
  const [demoPlaces, setDemoPlaces] = useState(DEMO_SAVED_PLACES);
  const handleUnsave = id =>
    SHOW_DEMO_SAVED_PLACES
      ? setDemoPlaces(current => current.filter(place => place.id !== id))
      : unsave.mutate(id);

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
  const visible = useMemo(
    () =>
      activeCategory === 'All' ? places : places.filter(p => p.categoryLabel === activeCategory),
    [places, activeCategory],
  );
  const verifiedCount = places.filter(place => place.verifiedLabel).length;
  const cityCount = new Set(places.map(place => place.city).filter(Boolean)).size;

  const header = (
    <View>
      <View style={styles.statTiles}>
        {[
          { icon: '📍', value: places.length, label: 'Saved' },
          { icon: '🛡️', value: verifiedCount, label: 'Verified' },
          { icon: '🏙️', value: cityCount, label: cityCount === 1 ? 'City' : 'Cities' },
        ].map(tile => (
          <View key={tile.label} style={[styles.statTile, isDarkMode && styles.statTileDark]}>
            <Text style={styles.statTileIcon}>{tile.icon}</Text>
            <View>
              <Text style={[styles.statTileValue, isDarkMode && styles.textWhite]}>
                {tile.value}
              </Text>
              <Text style={[styles.statTileLabel, isDarkMode && styles.mutedDark]}>
                {tile.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {categories?.length > 2 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {categories?.map(name => {
            const active = name === activeCategory;
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
              </BouncyPressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.headerSpacer} />
      )}
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
              <Ionicons
                name={isError ? 'cloud-offline-outline' : 'bookmark-outline'}
                size={ms(44)}
                color={isDarkMode ? '#64748B' : '#94A3B8'}
              />
              <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                {isError
                  ? 'Could not load your saved places. Pull down to retry.'
                  : 'No saved places yet. Tap the bookmark on any place to keep it here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  statTiles: { flexDirection: 'row', gap: s(8), paddingHorizontal: s(15), paddingTop: vs(4) },
  statTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: '#FFFFFF',
    borderColor: '#ECE8E1',
    borderWidth: 1.2,
    borderBottomWidth: 3.5,
    borderBottomColor: '#DDD7CC',
    borderRadius: s(16),
    paddingVertical: s(8),
    paddingHorizontal: s(10),
    shadowColor: '#200744',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statTileDark: {
    backgroundColor: '#190A32',
    borderColor: '#371569',
    borderBottomColor: '#230A47',
  },
  statTileIcon: { fontSize: s(17) },
  statTileValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    lineHeight: s(19),
    color: '#1E1B4B',
  },
  statTileLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(9.5),
    color: '#6B7280',
  },
  headerSpacer: { height: vs(16) },
  chips: { paddingHorizontal: s(16), paddingVertical: vs(14) },
  chip: {
    paddingHorizontal: s(16),
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
