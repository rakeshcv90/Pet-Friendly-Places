import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { SectionCard } from './SectionCard';
import { styles } from './styles';

/** "Quick Facts": charges, parking, room type, sizes... as a two-column grid. */
export const ListingQuickFacts = ({ listing, palette, isDarkMode }) => {
  if (!listing.quickFacts.length) {
    return null;
  }
  return (
    <SectionCard title="Quick facts" icon="flash-outline" palette={palette} isDarkMode={isDarkMode}>
      <View style={styles.factGrid}>
        {listing.quickFacts.map(fact => (
          <View key={fact.label} style={[styles.factTile, { backgroundColor: palette.soft }]}>
            <View style={[styles.factTileIcon, { backgroundColor: palette.card }]}>
              <Ionicons name={fact.icon} size={ms(15)} color={palette.accent} />
            </View>
            <Text style={[styles.factTileLabel, { color: palette.muted }]}>{fact.label}</Text>
            <Text style={[styles.factTileValue, { color: palette.text }]}>{fact.value}</Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
};
