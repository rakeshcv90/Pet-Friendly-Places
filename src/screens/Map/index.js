import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { theme } from '../../theme';
import { useStore } from '../../store';
import Icon from 'react-native-vector-icons/Ionicons';

export const MapScreen = () => {
  const isDarkMode = useStore(state => state.isDarkMode);

  return (
    <ScreenContainer style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.mapPlaceholder, isDarkMode && styles.mapPlaceholderDark]}>
        <View style={[styles.iconCircle, isDarkMode && styles.iconCircleDark]}>
          <Icon name="map-outline" size={48} color={isDarkMode ? '#A78BFA' : '#7C3AED'} />
        </View>
        <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>Map View</Text>
        <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
          Interactive pet-friendly map view.
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  containerDark: { backgroundColor: '#0F071D' },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    margin: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ECE8F4',
  },
  mapPlaceholderDark: {
    backgroundColor: '#170A2E',
    borderColor: '#2E1654',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircleDark: {
    backgroundColor: '#261245',
    borderWidth: 1,
    borderColor: '#3B1D6E',
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.h4,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: theme.typography.sizes.body2,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#94A3B8',
  },
});

