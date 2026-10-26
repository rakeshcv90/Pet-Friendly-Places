import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import { useStore } from '../../store';
import Icon from 'react-native-vector-icons/Ionicons';

export const SavedScreen = () => {
  const isDarkMode = useStore(state => state.isDarkMode);

  return (
    <ScreenContainer style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>Saved Places</Text>
      </View>
      <View style={[styles.tabs, isDarkMode && styles.tabsDark]}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Places</Text>
        </View>
        <View style={styles.tab}>
          <Text style={[styles.tabText, isDarkMode && styles.tabTextDark]}>Trips</Text>
        </View>
      </View>
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, isDarkMode && styles.emptyIconContainerDark]}>
          <Icon name="heart" size={64} color={isDarkMode ? '#A78BFA' : theme.colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>No saved places yet</Text>
        <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
          Tap the heart icon on any place{'\n'}to save it here.
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  header: { padding: theme.spacing.m, alignItems: 'center' },
  headerTitle: { fontSize: theme.typography.sizes.h3, fontWeight: theme.typography.weights.bold, color: theme.colors.text },
  headerTitleDark: { color: '#FFFFFF' },
  tabs: { flexDirection: 'row', marginHorizontal: theme.spacing.m, backgroundColor: theme.colors.surface, borderRadius: 20, padding: 4, marginBottom: theme.spacing.xl },
  tabsDark: { backgroundColor: '#170A2E', borderWidth: 1, borderColor: '#2E1654' },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16 },
  activeTab: { backgroundColor: '#7C3AED' },
  tabText: { fontSize: theme.typography.sizes.body2, fontWeight: theme.typography.weights.semiBold, color: theme.colors.textSecondary },
  tabTextDark: { color: '#94A3B8' },
  activeTabText: { color: '#FFF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.xl, paddingBottom: 100 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(124, 58, 237, 0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIconContainerDark: { backgroundColor: 'rgba(124, 58, 237, 0.18)', borderWidth: 1, borderColor: '#3B1D6E' },
  emptyTitle: { fontSize: theme.typography.sizes.h4, fontWeight: theme.typography.weights.bold, color: theme.colors.text, marginBottom: 8 },
  emptyTitleDark: { color: '#FFFFFF' },
  emptyText: { fontSize: theme.typography.sizes.body2, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyTextDark: { color: '#94A3B8' },
});

