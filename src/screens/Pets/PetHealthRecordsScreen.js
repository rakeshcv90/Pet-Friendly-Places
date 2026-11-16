import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Enter } from '../Community/Motion';
import { PetHero, DEEP_PURPLE } from './components/PetHero';
import { petName } from './petUtils';

const comingSoon = feature =>
  Alert.alert(
    feature,
    'This will be available in the app soon. You can use it on the website for now.',
  );

// A pet's private health records (opened from the My Pets card)
export const PetHealthRecordsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const pet = route?.params?.pet || {};
  const name = petName(pet);

  const actions = [
    { id: 'download', label: 'Download summary', icon: 'download-outline' },
    { id: 'share', label: 'Share for 24 hours', icon: 'share-social-outline' },
    { id: 'photos', label: 'Add photos', icon: 'cloud-upload-outline' },
  ];

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + vs(32) }}>
        <PetHero
          title={`${name}'s health records`}
          subtitle="Original photos stay attached to every review."
          backLabel="🐾 My pets"
          onBack={() => navigation.goBack()}>
          <View style={styles.private}>
            <Ionicons name="lock-closed" size={ms(11)} color="#FFFFFF" />
            <Text style={styles.privateText}>Private to your account</Text>
          </View>
        </PetHero>

        <Enter index={0}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actions}>
            {actions.map(action => (
              <BouncyPressable
                key={action.id}
                testID={`health-${action.id}`}
                style={styles.action}
                activeScale={0.94}
                onPress={() => comingSoon(action.label)}>
                <Ionicons name={action.icon} size={ms(15)} color="#FFFFFF" />
                <Text style={styles.actionText}>{action.label}</Text>
              </BouncyPressable>
            ))}
          </ScrollView>
        </Enter>

        <Enter index={1}>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>No pages yet</Text>
            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, isDarkMode && styles.emptyIconDark]}>
                <Ionicons name="document-text-outline" size={ms(30)} color="#7C3AED" />
              </View>
              <Text style={[styles.emptyText, isDarkMode && styles.mutedDark]}>
                No source pages yet. Add a clear photo from the health-record editor.
              </Text>
            </View>
          </View>
        </Enter>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  containerDark: { backgroundColor: '#0F071D' },
  private: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: s(5),
    marginTop: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(12),
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  privateText: {
    fontSize: s(10.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  actions: { paddingHorizontal: s(16), paddingVertical: vs(16), gap: s(8) },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderRadius: s(14),
    backgroundColor: '#6D28D9',
    borderBottomWidth: 3,
    borderBottomColor: '#4C1D95',
  },
  actionText: { fontSize: s(12), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  card: {
    marginHorizontal: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
    overflow: 'hidden',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  cardTitle: {
    padding: s(16),
    fontSize: s(15.5),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  dividerDark: { backgroundColor: '#2E1654' },
  empty: { alignItems: 'center', paddingVertical: vs(34), paddingHorizontal: s(24) },
  emptyIcon: {
    width: s(60),
    height: s(60),
    borderRadius: s(20),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconDark: { backgroundColor: '#27104B' },
  emptyText: {
    marginTop: vs(12),
    textAlign: 'center',
    fontSize: s(13),
    lineHeight: s(19),
    color: '#64748B',
    fontFamily: theme.typography.fontFamily.medium,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
