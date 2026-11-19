import React, { useCallback, useRef, useState } from 'react';
import { View, Text, Animated, Alert, Linking, StyleSheet, StatusBar, Switch } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { usePrivacySettings, useUpdatePrivacy } from '../../hooks/usePrivacy';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { LoaderCard } from '../../components/common/Loader';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { AmbientBackground } from '../Home/components';
import { Enter } from '../Community/Motion';

const PROFILE_URL = 'https://petfriendlyplaces.in/profile/';

// What can be shown on the public profile; each switch saves on its own
export const PRIVACY_ROWS = [
  { field: 'showPets', title: 'My Pets', text: 'Show your pet profiles' },
  { field: 'showCommunityPosts', title: 'Community Posts', text: 'Show your posts in communities' },
  { field: 'showReviews', title: 'Reviews', text: 'Show your pet-friendly place reviews' },
  { field: 'showLeaderboard', title: 'Leaderboard rank', text: 'Appear on the Tails Leaderboard' },
  { field: 'showSavedPlaces', title: 'Saved places', text: "Show places you've saved" },
  { field: 'allowFollowers', title: 'Allow followers', text: 'Let others follow you' },
];

const PrivacySwitch = ({ value, onValueChange, disabled, testID, label }) => (
  <Switch
    testID={testID}
    accessibilityLabel={label}
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: '#D4D4D8', true: '#7C3AED' }}
    thumbColor="#FFFFFF"
    ios_backgroundColor="#D4D4D8"
  />
);

// Profile > Privacy: choose what other people see on your public profile
export const PrivacyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const user = useStore(state => state.user);
  const scrollY = useRef(new Animated.Value(0)).current;

  const { data: settings, isLoading, isError, refetch, isRefetching } = usePrivacySettings();
  const update = useUpdatePrivacy();
  // The switch being saved is locked so a second tap cannot race the first
  const [savingField, setSavingField] = useState(null);

  const slug = user?.profileSlug;
  const profileUrl = slug ? `${PROFILE_URL}${slug}` : '';

  const handleChange = useCallback(
    (field, value) => {
      setSavingField(field);
      update.mutate(
        { field, value },
        {
          onError: error =>
            Alert.alert(
              'Could not save',
              error?.response?.data?.error ||
                error?.message ||
                'Your privacy setting was not saved. Please try again.',
            ),
          onSettled: () => setSavingField(current => (current === field ? null : current)),
        },
      );
    },
    [update],
  );

  const openProfile = useCallback(() => {
    if (profileUrl) {
      Linking.openURL(profileUrl).catch(() => {});
    }
  }, [profileUrl]);

  const isPublic = settings?.isPublic ?? true;

  const renderBody = () => {
    if (isLoading) {
      return (
        <LoaderCard
          style={styles.center}
          label="Loading your privacy settings…"
          isDarkMode={isDarkMode}
        />
      );
    }
    if (isError || !settings) {
      return (
        <View style={[styles.card, styles.errorCard, isDarkMode && styles.cardDark]}>
          <Ionicons name="cloud-offline-outline" size={ms(30)} color="#94A3B8" />
          <Text style={[styles.errorTitle, isDarkMode && styles.textWhite]}>
            Could not load your settings
          </Text>
          <Text style={[styles.errorText, isDarkMode && styles.mutedDark]}>
            Check your connection and try again.
          </Text>
          <BouncyPressable
            testID="privacy-retry"
            activeScale={0.95}
            style={styles.retry}
            onPress={refetch}>
            <Text style={styles.retryText}>{isRefetching ? 'Trying…' : 'Try again'}</Text>
          </BouncyPressable>
        </View>
      );
    }

    return (
      <>
        <Enter index={0}>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.publicRow}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shield}>
                <Ionicons name="shield-checkmark" size={ms(20)} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.rowText}>
                <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>
                  Public Profile
                </Text>
                <Text style={[styles.rowSub, isDarkMode && styles.mutedDark]}>
                  Let others discover you on Pet Friendly Places
                </Text>
              </View>
              <PrivacySwitch
                testID="privacy-isPublic"
                label="Public Profile"
                value={settings.isPublic}
                disabled={savingField === 'isPublic'}
                onValueChange={value => handleChange('isPublic', value)}
              />
            </View>

            {profileUrl ? (
              <BouncyPressable
                testID="privacy-profile-link"
                activeScale={0.97}
                onPress={openProfile}
                style={[styles.link, isDarkMode && styles.linkDark, !isPublic && styles.linkOff]}>
                <Ionicons
                  name="globe-outline"
                  size={ms(15)}
                  color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                />
                <Text
                  style={[styles.linkText, isDarkMode && styles.linkTextDark]}
                  numberOfLines={1}>
                  {`petfriendlyplaces.in/profile/${slug}`}
                </Text>
                <Ionicons
                  name="open-outline"
                  size={ms(14)}
                  color={isDarkMode ? '#C4B5FD' : '#7C3AED'}
                />
              </BouncyPressable>
            ) : null}

            {!isPublic ? (
              <Text
                testID="privacy-hidden-note"
                style={[styles.hiddenNote, isDarkMode && styles.mutedDark]}>
                Your public profile is hidden right now.
              </Text>
            ) : null}
          </View>
        </Enter>

        <Enter index={1}>
          <View style={[styles.card, styles.listCard, isDarkMode && styles.cardDark]}>
            <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>
              What to show on your profile
            </Text>
            <Text style={[styles.rowSub, styles.listSub, isDarkMode && styles.mutedDark]}>
              Each toggle saves immediately
            </Text>

            {PRIVACY_ROWS.map((row, index) => (
              <View
                key={row.field}
                style={[
                  styles.row,
                  index < PRIVACY_ROWS.length - 1 && styles.rowBorder,
                  isDarkMode && styles.rowBorderDark,
                ]}>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, isDarkMode && styles.textWhite]}>{row.title}</Text>
                  <Text style={[styles.rowSub, isDarkMode && styles.mutedDark]}>{row.text}</Text>
                </View>
                <PrivacySwitch
                  testID={`privacy-${row.field}`}
                  label={row.title}
                  value={settings[row.field]}
                  disabled={savingField === row.field}
                  onValueChange={value => handleChange(row.field, value)}
                />
              </View>
            ))}
          </View>
        </Enter>

        <Enter index={2}>
          <View style={[styles.note, isDarkMode && styles.noteDark]}>
            <Ionicons name="information-circle-outline" size={ms(16)} color="#7C3AED" />
            <Text style={[styles.noteText, isDarkMode && styles.mutedDark]}>
              These switches only hide or show things on your public profile. Your pets, posts,
              reviews, saved places and points are never deleted.
            </Text>
          </View>
        </Enter>
      </>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Privacy"
        subtitle="YOUR PROFILE"
        onBack={() => navigation.goBack()}
        testID="privacy-back-btn"
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        contentContainerStyle={{ paddingTop: vs(8), paddingBottom: insets.bottom + vs(36) }}>
        {renderBody()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  center: { marginTop: vs(40), marginHorizontal: s(16) },
  card: {
    marginHorizontal: s(16),
    marginBottom: vs(14),
    padding: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  publicRow: { flexDirection: 'row', alignItems: 'center', gap: s(12) },
  shield: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  cardTitle: {
    fontSize: s(16),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  rowSub: {
    marginTop: 2,
    fontSize: s(12),
    lineHeight: s(17),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    alignSelf: 'flex-start',
    maxWidth: '100%',
    marginTop: vs(14),
    paddingHorizontal: s(12),
    paddingVertical: vs(9),
    borderRadius: s(14),
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  linkDark: { backgroundColor: '#27104B', borderColor: '#3B1B6E' },
  linkOff: { opacity: 0.5 },
  linkText: {
    flexShrink: 1,
    fontSize: s(12),
    color: '#6D28D9',
    fontFamily: theme.typography.fontFamily.bold,
  },
  linkTextDark: { color: '#C4B5FD' },
  hiddenNote: {
    marginTop: vs(10),
    fontSize: s(11.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  listCard: { paddingBottom: s(6) },
  listSub: { marginBottom: vs(6) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: vs(14),
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F1EEF8' },
  rowBorderDark: { borderBottomColor: '#2E1654' },
  rowTitle: {
    fontSize: s(14.5),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  note: {
    flexDirection: 'row',
    gap: s(10),
    marginHorizontal: s(16),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#F5F3FF',
  },
  noteDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  noteText: {
    flex: 1,
    fontSize: s(12),
    lineHeight: s(18),
    color: '#4B5563',
    fontFamily: theme.typography.fontFamily.medium,
  },
  errorCard: { alignItems: 'center', paddingVertical: vs(30) },
  errorTitle: {
    marginTop: vs(10),
    fontSize: s(15),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  errorText: {
    marginTop: vs(4),
    fontSize: s(12.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  retry: {
    marginTop: vs(14),
    paddingHorizontal: s(22),
    paddingVertical: vs(10),
    borderRadius: s(14),
    backgroundColor: '#7C3AED',
  },
  retryText: { fontSize: s(13), color: '#FFFFFF', fontFamily: theme.typography.fontFamily.bold },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
