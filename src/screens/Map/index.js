import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import Icon from 'react-native-vector-icons/Ionicons';

export const MapScreen = () => {
  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Icon name="map-outline" size={64} color={theme.colors.border} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Map View</Text>
        <Text style={styles.emptyText}>Map integration goes here.</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8E5DF' },
  emptyTitle: { fontSize: theme.typography.sizes.h4, fontFamily: theme.typography.fontFamily.bold, color: theme.colors.text, marginBottom: 8 },
  emptyText: { fontSize: theme.typography.sizes.body2, fontFamily: theme.typography.fontFamily.regular, color: theme.colors.textSecondary, textAlign: 'center' },
});
