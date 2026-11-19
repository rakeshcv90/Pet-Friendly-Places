import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { SectionCard } from './SectionCard';
import { styles } from './styles';

const BulletList = ({ items, icon, color, palette }) =>
  items.map(item => (
    <View key={item} style={styles.bulletRow}>
      <Ionicons name={icon} size={ms(15)} color={color} />
      <Text style={[styles.bulletText, { color: palette.body }]}>{item}</Text>
    </View>
  ));

/** What pets love, what to know first, and extra tips. */
export const ListingProsCons = ({ listing, palette, isDarkMode }) => (
  <>
    {listing.pros.length ? (
      <SectionCard title="What pets will love" icon="happy-outline" palette={palette} isDarkMode={isDarkMode}>
        <BulletList items={listing.pros} icon="checkmark-circle" color={palette.good} palette={palette} />
      </SectionCard>
    ) : null}
    {listing.cons.length ? (
      <SectionCard title="Good to know" icon="alert-circle-outline" palette={palette} isDarkMode={isDarkMode}>
        <BulletList items={listing.cons} icon="information-circle" color={palette.warn} palette={palette} />
      </SectionCard>
    ) : null}
    {listing.knowBeforeYouGo.length ? (
      <SectionCard title="Know before you go" icon="bulb-outline" palette={palette} isDarkMode={isDarkMode}>
        <BulletList items={listing.knowBeforeYouGo} icon="arrow-forward-circle" color={palette.accent} palette={palette} />
      </SectionCard>
    ) : null}
  </>
);
