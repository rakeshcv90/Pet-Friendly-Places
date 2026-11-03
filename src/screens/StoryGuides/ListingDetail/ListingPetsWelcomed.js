import React from 'react';
import { View, Text } from 'react-native';
import { SectionCard, Pill } from './SectionCard';
import { styles } from './styles';

/** "Pets welcomed": which animals are allowed, plus the place's pet-related attributes. */
export const ListingPetsWelcomed = ({ listing, palette, isDarkMode }) => {
  if (!listing.petsWelcomed.length && !listing.attributes.length) {
    return null;
  }
  return (
    <SectionCard title="Pets welcomed" icon="paw" palette={palette} isDarkMode={isDarkMode}>
      {listing.petsWelcomed.length ? (
        <View style={styles.chipsWrap}>
          {listing.petsWelcomed.map(pet => (
            <View key={pet.label} style={[styles.petPill, { backgroundColor: palette.soft }]}>
              <Text style={styles.petEmoji}>{pet.emoji}</Text>
              <Text style={[styles.petPillText, { color: palette.accent }]}>{pet.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {listing.attributes.length || listing.levelLabel ? (
        <View style={[styles.chipsWrap, listing.petsWelcomed.length ? styles.gapTop : null]}>
          {listing.levelLabel ? (
            <Pill label={listing.levelLabel} icon="paw" background={palette.warnSoft} color={palette.warn} />
          ) : null}
          {listing.attributes.map(label => (
            <Pill key={label} label={label} icon="checkmark-circle" background={palette.goodSoft} color={palette.good} />
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
};
