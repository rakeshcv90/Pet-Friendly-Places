import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, ms } from 'react-native-size-matters';
import { theme, colors } from '../../theme';
import { useStore } from '../../store';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { useReuniteCases, filterReunitePosts } from '../../hooks/useReunite';
import { ReunitePostCard } from './components';
import { TABS, PET_FILTER_OPTIONS } from './ReuniteScreen';

// One grid cell. Memoised, so a row only draws again when its own post or the theme changes.
const ReuniteRow = React.memo(({ item, index, isDarkMode, onOpen }) => (
  <ReunitePostCard
    post={item}
    isDarkMode={isDarkMode}
    tilt={index % 2 === 0 ? '-2deg' : '2deg'}
    onPress={() => onOpen(item)}
  />
));

const keyOfPost = post => post.id;

export const ReuniteListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode);
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'all');
  const [species, setSpecies] = useState('all');
  const { data: allPosts = [], isLoading, isRefetching, isError, refetch } = useReuniteCases();

  const posts = useMemo(
    () => filterReunitePosts(allPosts, activeTab, species),
    [allPosts, activeTab, species],
  );
  const openPost = useCallback(
    post => navigation.navigate('ReuniteDetailScreen', { post }),
    [navigation],
  );
  const renderPost = useCallback(
    ({ item, index }) => (
      <ReuniteRow item={item} index={index} isDarkMode={isDarkMode} onOpen={openPost} />
    ),
    [isDarkMode, openPost],
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <ActivityIndicator style={styles.loader} color={colors.reunite.petAlertsDeepPurple} />;
    }
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, isDarkMode && styles.textDark]}>
          {isError ? 'Could not load posts' : 'No posts here yet'}
        </Text>
        <Text style={[styles.emptyDesc, isDarkMode && styles.emptyDescDark]}>
          {isError ? 'Pull down to try again.' : 'Try another tab or pet type.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScreenHeader
        title="Lost and found pets"
        subtitle="REUNITE"
        onBack={() => navigation.goBack()}
        testID="reunite-list-back-btn"
      />

      <View style={[styles.tabsTrack, isDarkMode && styles.tabsTrackDark]}>
        {TABS.map(tab => {
          const isSelected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tabSegment,
                isSelected && (isDarkMode ? styles.tabSegmentActiveDark : styles.tabSegmentActive),
              ]}
              onPress={() => setActiveTab(tab.id)}>
              <Text
                style={[
                  styles.tabText,
                  isDarkMode && styles.tabTextDark,
                  isSelected && (isDarkMode ? styles.tabTextActiveDark : styles.tabTextActive),
                ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {PET_FILTER_OPTIONS.map(option => {
            const isSelected = species === option.id;
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.chip,
                  isDarkMode && styles.chipDark,
                  isSelected && (isDarkMode ? styles.chipActiveDark : styles.chipActive),
                ]}
                onPress={() => setSpecies(option.id)}>
                <Text style={styles.chipEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.chipText,
                    isDarkMode && styles.tabTextDark,
                    isSelected && styles.chipTextActive,
                  ]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        keyExtractor={keyOfPost}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + s(24) }]}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={renderEmpty}
        renderItem={renderPost}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#0F071D',
  },
  textDark: {
    color: '#FFFFFF',
  },
  tabsTrack: {
    flexDirection: 'row',
    backgroundColor: colors.reunite.tabTrack,
    borderRadius: s(22),
    padding: s(3.5),
    marginHorizontal: s(16),
    marginBottom: s(12),
  },
  tabsTrackDark: {
    backgroundColor: '#170A2E',
  },
  tabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(7.5),
    borderRadius: s(18),
  },
  tabSegmentActive: {
    backgroundColor: colors.reunite.tabActiveBg,
  },
  tabSegmentActiveDark: {
    backgroundColor: '#7B2CFF',
  },
  tabText: {
    fontSize: s(11.5),
    fontFamily: theme.typography.fontFamily.medium,
    color: colors.reunite.tabInactiveText,
  },
  tabTextDark: {
    color: '#94A3B8',
  },
  tabTextActive: {
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.tabActiveText,
  },
  tabTextActiveDark: {
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  chipsRow: {
    paddingHorizontal: s(16),
    paddingBottom: s(12),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: s(7),
    borderRadius: s(16),
    marginRight: s(8),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  chipDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  chipActive: {
    backgroundColor: '#7B2CFF',
    borderColor: '#7B2CFF',
  },
  chipActiveDark: {
    backgroundColor: '#7B2CFF',
    borderColor: '#9D5CFF',
  },
  chipEmoji: {
    fontSize: s(13),
    marginRight: s(5),
  },
  chipText: {
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.semiBold,
    color: colors.reunite.titleDark,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: s(16),
    paddingTop: s(14),
    flexGrow: 1,
  },
  column: {
    justifyContent: 'space-between',
  },
  loader: {
    marginVertical: ms(32),
  },
  empty: {
    alignItems: 'center',
    paddingVertical: s(48),
  },
  emptyTitle: {
    fontSize: s(16),
    fontFamily: theme.typography.fontFamily.bold,
    color: colors.reunite.titleDark,
  },
  emptyDesc: {
    marginTop: s(6),
    fontSize: s(12),
    fontFamily: theme.typography.fontFamily.regular,
    color: colors.reunite.textMuted,
  },
  emptyDescDark: {
    color: '#94A3B8',
  },
});

export default ReuniteListScreen;
