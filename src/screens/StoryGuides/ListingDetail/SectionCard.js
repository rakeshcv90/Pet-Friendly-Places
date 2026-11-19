import React from 'react';
import { View, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ms } from 'react-native-size-matters';
import { styles } from './styles';
import { styles as shared } from '../GuideDetail/styles/shared';

/** Titled card used by every content section of the listing page. */
export const SectionCard = ({ title, icon, palette, isDarkMode, right, children }) => (
  <View
    style={[
      styles.section,
      shared.card3D,
      isDarkMode && shared.card3DDark,
      { backgroundColor: palette.card },
    ]}>
    <View style={styles.sectionHead}>
      <LinearGradient
        colors={['#3B108F', '#7B2CFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sectionIcon}>
        <Ionicons name={icon} size={ms(15)} color="#FFFFFF" />
      </LinearGradient>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      {right || null}
    </View>
    <View style={[styles.sectionRule, { backgroundColor: palette.border }]} />
    {children}
  </View>
);

/** Small pill used for amenities / attributes / tags. */
export const Pill = ({ label, icon, background, color }) => (
  <View style={[styles.chip, { backgroundColor: background }]}>
    {icon ? <Ionicons name={icon} size={ms(12)} color={color} /> : null}
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

/** Icon + label + value row used by the pet policy section. */
export const FactRow = ({ icon, label, value, palette, first }) => (
  <View
    style={[
      styles.factRow,
      !first && styles.factRowBorder,
      { borderTopColor: palette.border },
    ]}>
    <View style={[styles.factIcon, { backgroundColor: palette.soft }]}>
      <Ionicons name={icon} size={ms(15)} color={palette.accent} />
    </View>
    <View style={styles.factTexts}>
      <Text style={[styles.factLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.factValue, { color: palette.text }]}>{value}</Text>
    </View>
  </View>
);
