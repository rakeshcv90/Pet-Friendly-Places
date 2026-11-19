import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import FastImage from '../../../components/common/FastImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { useStore } from '../../../store';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { petPhoto } from '../petUtils';
import { formatLongDate } from '../../StoryGuides/ListingDetail/listingModel';
import { NightSky } from '../../Community/NightSky';
import { Bob, Enter } from '../../Community/Motion';

const PURPLE = '#7B2CFF';
const DEEP_PURPLE = '#3B108F';

const speciesEmoji = species => (/cat/i.test(species) ? '🐱' : /dog/i.test(species) ? '🐶' : '🐾');

// One pet's full profile (opened by tapping the Pawsport card on Profile). The pet arrives as a
// route param, so it works with whatever the account API returned for it.
export const PetDetailsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const pet = route?.params?.pet || {};

  const name = pet.name || pet.petName || 'Your pet';
  const species = pet.species || pet.type || '';
  const photo = petPhoto(pet);
  const added = formatLongDate(pet.createdAt || pet.created_at);

  const rows = [
    { icon: 'paw-outline', label: 'Species', value: species },
    { icon: 'ribbon-outline', label: 'Breed', value: pet.breed },
    { icon: 'calendar-outline', label: 'Added', value: added },
    { icon: 'trophy-outline', label: 'Badge', value: pet.badge },
  ].filter(row => !!row.value);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + vs(32) }}>
        <LinearGradient
          colors={[DEEP_PURPLE, PURPLE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: Math.max(insets.top, s(12)) + s(8) }]}>
          <LinearGradient
            pointerEvents="none"
            colors={[DEEP_PURPLE, 'rgba(59,16,143,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.heroTopFade, { height: insets.top + s(70) }]}
          />
          <NightSky topInset={insets.top} />

          <BouncyPressable
            testID="pet-details-back-btn"
            accessibilityLabel="Back"
            activeScale={0.95}
            onPress={() => navigation.goBack()}
            style={styles.backLink}>
            <Feather name="chevron-left" size={ms(15)} color="rgba(255,255,255,0.8)" />
            <Text style={styles.backLinkText}>🐾 Profile</Text>
          </BouncyPressable>

          <View style={styles.identity}>
            <Bob style={styles.avatar} distance={4} duration={2400}>
              {photo ? (
                <FastImage source={{ uri: photo }} style={styles.avatarPhoto} />
              ) : (
                <Text style={styles.avatarEmoji}>{speciesEmoji(species)}</Text>
              )}
            </Bob>
            <View style={styles.identityText}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {name}
              </Text>
              {!!pet.breed && <Text style={styles.heroDesc}>{pet.breed}</Text>}
            </View>
          </View>

          <View style={styles.statTiles}>
            <View style={styles.statTile}>
              <Text style={styles.statTileIcon}>🐾</Text>
              <View>
                <Text style={styles.statTileValue}>{pet.stamps ?? 0}</Text>
                <Text style={styles.statTileLabel}>Stamps</Text>
              </View>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileIcon}>🛡️</Text>
              <View>
                <Text style={styles.statTileValue}>Active</Text>
                <Text style={styles.statTileLabel}>Pack member</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Passport */}
        <Enter index={0}>
          <LinearGradient
            colors={
              isDarkMode ? ['#150A2A', '#260D55', '#380B5C'] : ['#1E103A', '#2E1065', '#3B0764']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.passport}>
            <Ionicons
              name="paw"
              size={ms(110)}
              color="rgba(255,255,255,0.05)"
              style={styles.passportPaw}
            />
            <View style={styles.passportTop}>
              <View style={styles.passportTag}>
                <Ionicons name="shield-checkmark" size={ms(14)} color="#FCD34D" />
                <Text style={styles.passportTagText}>OFFICIAL PET PAWSPORT</Text>
              </View>
              <View style={styles.verified}>
                <Ionicons name="checkmark-circle" size={ms(11)} color="#10B981" />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>
            <Text style={styles.passportLabel}>PASSPORT ID</Text>
            <Text style={styles.passportNo}>{pet.passportNo || 'Pending'}</Text>
            <Text style={styles.passportName}>{name}</Text>
          </LinearGradient>
        </Enter>

        {/* Details */}
        {rows.length > 0 && (
          <Enter index={1}>
            <View style={[styles.card, isDarkMode && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>Pet details</Text>
              {rows.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    styles.row,
                    i > 0 && styles.rowBorder,
                    isDarkMode && styles.rowBorderDark,
                  ]}>
                  <View style={[styles.rowIcon, isDarkMode && styles.rowIconDark]}>
                    <Ionicons name={row.icon} size={ms(16)} color="#7C3AED" />
                  </View>
                  <Text style={[styles.rowLabel, isDarkMode && styles.mutedDark]}>{row.label}</Text>
                  <Text style={[styles.rowValue, isDarkMode && styles.textWhite]} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </Enter>
        )}

        {/* About */}
        <Enter index={2}>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>About {name}</Text>
            <Text style={[styles.bio, isDarkMode && styles.mutedDark]}>
              {pet.bio || `No bio yet. Tell the pack what ${name} loves.`}
            </Text>
          </View>
        </Enter>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  containerDark: { backgroundColor: '#0F071D' },
  hero: {
    paddingHorizontal: s(15),
    paddingBottom: s(18),
    overflow: 'hidden',
    borderBottomLeftRadius: s(28),
    borderBottomRightRadius: s(28),
  },
  heroTopFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(2),
    marginBottom: s(10),
    marginLeft: -s(4),
  },
  backLinkText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(11.5),
    color: 'rgba(255,255,255,0.78)',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: s(14), marginBottom: s(14) },
  avatar: {
    width: s(72),
    height: s(72),
    borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(20,6,60,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 6,
  },
  avatarPhoto: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: s(36) },
  identityText: { flex: 1 },
  heroTitle: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(24),
    lineHeight: s(29),
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  heroDesc: {
    marginTop: s(2),
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: s(13),
    color: 'rgba(255,255,255,0.85)',
  },
  statTiles: { flexDirection: 'row', gap: s(8) },
  statTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,6,60,0.35)',
    borderRadius: s(16),
    paddingVertical: s(8),
    paddingHorizontal: s(14),
    elevation: 3,
  },
  statTileIcon: { fontSize: s(17) },
  statTileValue: {
    fontFamily: theme.typography.fontFamily.extraBold,
    fontSize: s(16),
    lineHeight: s(19),
    color: '#FFFFFF',
  },
  statTileLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: s(9.5),
    color: 'rgba(255,255,255,0.75)',
  },
  passport: {
    marginHorizontal: s(16),
    marginTop: vs(16),
    padding: s(18),
    borderRadius: s(22),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(252,211,77,0.35)',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(252,211,77,0.5)',
  },
  passportPaw: { position: 'absolute', right: -s(10), bottom: -s(14) },
  passportTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passportTag: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  passportTagText: {
    fontSize: ms(10),
    letterSpacing: 1.4,
    color: '#FCD34D',
    fontFamily: theme.typography.fontFamily.bold,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(10),
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  verifiedText: {
    fontSize: ms(9.5),
    color: '#6EE7B7',
    fontFamily: theme.typography.fontFamily.bold,
  },
  passportLabel: {
    marginTop: vs(18),
    fontSize: ms(9.5),
    letterSpacing: 1.6,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: theme.typography.fontFamily.bold,
  },
  passportNo: {
    marginTop: vs(2),
    fontSize: ms(22),
    letterSpacing: 2,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  passportName: {
    marginTop: vs(10),
    fontSize: ms(13),
    color: 'rgba(255,255,255,0.85)',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  card: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  cardTitle: {
    marginBottom: vs(6),
    fontSize: s(15.5),
    letterSpacing: -0.2,
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(10) },
  rowBorder: { borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  rowBorderDark: { borderTopColor: '#2E1654' },
  rowIcon: {
    width: s(32),
    height: s(32),
    borderRadius: s(11),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDark: { backgroundColor: '#27104B' },
  rowLabel: {
    flex: 1,
    marginLeft: s(10),
    fontSize: s(12.5),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  rowValue: {
    maxWidth: '55%',
    textAlign: 'right',
    fontSize: s(13),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  bio: {
    fontSize: s(13),
    lineHeight: s(20),
    color: '#475569',
    fontFamily: theme.typography.fontFamily.regular,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
