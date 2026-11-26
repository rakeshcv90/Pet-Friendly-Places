import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { SectionCard } from './SectionCard';
import { styles } from './styles';

/** The verification card: who confirmed the pet policy, how, and when. */
export const ListingVerified = ({ listing, palette, isDarkMode }) => {
  const [expanded, setExpanded] = useState(false);
  const { label, text, monthYear, notes } = listing.trust;
  if (!label) {
    return null;
  }

  return (
    <SectionCard
      title="Verification"
      icon="shield-checkmark-outline"
      palette={palette}
      isDarkMode={isDarkMode}>
      <LinearGradient
        colors={
          isDarkMode ? ['rgba(34,197,94,0.22)', 'rgba(34,197,94,0.04)'] : ['#DCFCE7', '#F0FDF4']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.verifiedBanner}>
        <LinearGradient
          colors={['#16A34A', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={ms(20)} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.fill}>
          <Text style={[styles.verifiedTitle, { color: palette.text }]}>{label}</Text>
          {monthYear ? (
            <Text style={[styles.verifiedDate, { color: palette.good }]}>Verified {monthYear}</Text>
          ) : null}
        </View>
      </LinearGradient>
      <Text style={[styles.trustText, { color: palette.body }]}>{text}</Text>
      {notes ? (
        <>
          <Text
            numberOfLines={expanded ? undefined : 3}
            style={[styles.trustNotes, { color: palette.muted }]}>
            {notes}
          </Text>
          <TouchableOpacity onPress={() => setExpanded(v => !v)} activeOpacity={0.7}>
            <Text style={[styles.readMore, { color: palette.accent }]}>
              {expanded ? 'Show less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </SectionCard>
  );
};
