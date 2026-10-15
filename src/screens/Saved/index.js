import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import Icon from 'react-native-vector-icons/Ionicons';

export const SavedScreen = () => {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Places</Text>
      </View>
      <View style={styles.tabs}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Places</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Trips</Text>
        </View>
      </View>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Icon name="heart" size={64} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No saved places yet</Text>
        <Text style={styles.emptyText}>Tap the heart icon on any place{'\n'}to save it here.</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.m, alignItems: 'center' },
  headerTitle: { fontSize: theme.typography.sizes.h3, fontWeight: theme.typography.weights.bold, color: theme.colors.text },
  tabs: { flexDirection: 'row', marginHorizontal: theme.spacing.m, backgroundColor: theme.colors.surface, borderRadius: 20, padding: 4, marginBottom: theme.spacing.xl },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 16 },
  activeTab: { backgroundColor: theme.colors.primary },
  tabText: { fontSize: theme.typography.sizes.body2, fontWeight: theme.typography.weights.semiBold, color: theme.colors.textSecondary },
  activeTabText: { color: '#FFF' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.spacing.xl, paddingBottom: 100 },
  emptyIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(1, 74, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: theme.typography.sizes.h4, fontWeight: theme.typography.weights.bold, color: theme.colors.text, marginBottom: 8 },
  emptyText: { fontSize: theme.typography.sizes.body2, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
