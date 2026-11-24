import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  Alert,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import FastImage from '../../components/common/FastImage';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { ScreenHeader } from '../../components/common/AppHeader/ScreenHeader';
import { SuccessToast } from '../../components/common/SuccessToast';
import { Loader } from '../../components/common/Loader';
import { useMyPets, useDeletePet } from '../../hooks/useUser';
import { AmbientBackground } from '../Home/components';
import { PET_TABS, isTabId } from './petProfileModel';
import { petName, petPhoto, petSpecies, petSubtitle, speciesEmoji } from './petUtils';
import {
  BasicInfoPanel,
  PhotoPanel,
  SocialPanel,
  StampsPanel,
  HealthPanel,
} from './components/PetProfilePanels';

const PURPLE = '#7C3AED';

// Opened from the My Pets card: one pet's profile, with Basic Info, Photo, Social, Stamps and
// Health Records in tabs
export const PetProfileScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const routePet = route?.params?.pet || {};
  const { data: pets } = useMyPets();
  const deletePet = useDeletePet();
  const scrollY = useRef(new Animated.Value(0)).current;

  // The freshest copy of the pet: the list reloads after every save
  const pet = useMemo(
    () =>
      (Array.isArray(pets) ? pets.find(item => String(item?.id) === String(routePet.id)) : null) ||
      routePet,
    [pets, routePet],
  );

  const [tab, setTab] = useState(isTabId(route?.params?.tab) ? route.params.tab : 'basic');
  const [toast, setToast] = useState('');
  const name = petName(pet);
  const photo = petPhoto(pet);

  // Each tab fades in when it is chosen
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [tab, fade]);

  const handleRemove = () =>
    Alert.alert(
      `Remove ${name}?`,
      'This archives the pet profile. Its history is kept, but it will no longer show in your pets.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet.mutateAsync(pet.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Could not remove pet',
                error?.response?.data?.error || error?.message || 'Please try again.',
              );
            }
          },
        },
      ],
    );

  const addPet = () =>
    navigation.navigate('MainTabs', { screen: 'Profile', params: { openAddPet: true } });

  const panel = () => {
    const common = { pet, isDarkMode, onToast: setToast };
    switch (tab) {
      case 'photo':
        return <PhotoPanel {...common} />;
      case 'social':
        return <SocialPanel {...common} />;
      case 'stamps':
        return <StampsPanel {...common} />;
      case 'health':
        return (
          <HealthPanel
            {...common}
            onOpenBook={() => navigation.navigate('PetHealthRecordsScreen', { pet })}
            onAddRecord={() =>
              navigation.navigate('PetHealthRecordsScreen', { pet, initialView: 'form' })
            }
          />
        );
      default:
        return <BasicInfoPanel {...common} />;
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0F071D' : '#FAF7F2'}
      />
      <AmbientBackground scrollY={scrollY} isDarkMode={isDarkMode} />

      <ScreenHeader
        title="Pet profiles"
        subtitle="MY PETS"
        onBack={() => navigation.goBack()}
        testID="pet-profile-back"
        rightComponent={
          <BouncyPressable
            testID="pet-profile-add"
            accessibilityLabel="Add a pet"
            activeScale={0.94}
            onPress={addPet}
            style={styles.addBtn}>
            <Ionicons name="add" size={ms(16)} color="#FFFFFF" />
            <Text style={styles.addText}>Add a pet</Text>
          </BouncyPressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
            useNativeDriver: true,
          })}
          contentContainerStyle={{ paddingBottom: insets.bottom + vs(32) }}>
          <Text style={[styles.intro, isDarkMode && styles.mutedDark]}>
            Manage each pet’s profile, Pawsport, photos, and health records.
          </Text>

          {/* The pet being edited */}
          <View
            testID="pet-editing-card"
            style={[styles.editing, isDarkMode && styles.editingDark]}>
            <View style={[styles.avatar, isDarkMode && styles.avatarDark]}>
              {photo ? (
                <FastImage source={{ uri: photo }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarEmoji}>{speciesEmoji(petSpecies(pet))}</Text>
              )}
            </View>
            <View style={styles.editingText}>
              <Text style={styles.editingLabel}>EDITING</Text>
              <Text numberOfLines={1} style={[styles.editingName, isDarkMode && styles.textWhite]}>
                {name}
              </Text>
              <Text numberOfLines={1} style={[styles.editingMeta, isDarkMode && styles.mutedDark]}>
                {petSubtitle(pet) || 'Pet profile'}
              </Text>
            </View>
          </View>
          <View style={styles.editingActions}>
            <BouncyPressable
              testID="pet-view-profile"
              activeScale={0.95}
              onPress={() => navigation.navigate('PawsportScreen', { pet })}
              style={[styles.pill, isDarkMode && styles.pillDark]}>
              <Text style={[styles.pillText, isDarkMode && styles.accentText]}>View Profile</Text>
            </BouncyPressable>
            <BouncyPressable
              testID="pet-remove"
              activeScale={0.95}
              onPress={handleRemove}
              style={[styles.pill, styles.pillDanger]}>
              <Ionicons name="close" size={ms(14)} color="#B91C1C" />
              <Text style={styles.pillDangerText}>Remove</Text>
            </BouncyPressable>
          </View>

          {/* Tabs */}
          <ScrollView
            testID="pet-tabs"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}>
            {PET_TABS.map(item => {
              const active = tab === item.id;
              return (
                <BouncyPressable
                  key={item.id}
                  testID={`pet-tab-${item.id}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  activeScale={0.94}
                  onPress={() => setTab(item.id)}
                  style={styles.tabWrap}>
                  {active ? (
                    <LinearGradient
                      colors={['#4C1D95', PURPLE, '#C026D3']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.tab, styles.tabOn]}>
                      <Text style={styles.tabTextOn}>{`${item.emoji} ${item.label}`}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.tab, isDarkMode && styles.tabDark]}>
                      <Text style={[styles.tabText, isDarkMode && styles.accentText]}>
                        {`${item.emoji} ${item.label}`}
                      </Text>
                    </View>
                  )}
                </BouncyPressable>
              );
            })}
          </ScrollView>

          <Animated.View testID="pet-panel" style={{ opacity: fade }}>
            {panel()}
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <Loader visible={deletePet.isPending} title="Removing pet…" />
      <SuccessToast message={toast} onHide={() => setToast('')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  containerDark: { backgroundColor: '#0F071D' },
  flex: { flex: 1 },
  intro: {
    marginHorizontal: s(16),
    marginBottom: vs(12),
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(14),
    paddingVertical: s(9),
    borderRadius: s(16),
    backgroundColor: '#3B108F',
    borderBottomWidth: 3,
    borderBottomColor: '#1E0A52',
  },
  addText: {
    fontSize: s(12.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },

  editing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    marginHorizontal: s(15),
    padding: s(14),
    borderRadius: s(22),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  editingDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  avatar: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F3EEFF',
    borderWidth: 2,
    borderColor: '#DDD0FF',
  },
  avatarDark: { backgroundColor: '#27104B', borderColor: '#4C1D95' },
  avatarImage: { width: '100%', height: '100%' },
  avatarEmoji: { fontSize: s(24) },
  editingText: { flex: 1 },
  editingLabel: {
    fontSize: s(10),
    letterSpacing: 1,
    color: PURPLE,
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  editingName: {
    fontSize: s(18),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  editingMeta: {
    fontSize: s(12),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  editingActions: {
    flexDirection: 'row',
    gap: s(8),
    marginHorizontal: s(15),
    marginTop: vs(10),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    paddingHorizontal: s(16),
    paddingVertical: s(9),
    borderRadius: s(16),
    backgroundColor: '#F3EEFF',
    borderWidth: 1.2,
    borderColor: '#DDD0FF',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  pillDark: { backgroundColor: '#27104B', borderColor: '#3B1B6E', borderBottomColor: '#4C1D95' },
  pillText: {
    fontSize: s(12.5),
    color: '#6D28D9',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  pillDanger: { backgroundColor: '#FDF2F2', borderColor: '#F3C9C9', borderBottomColor: '#E8A9A9' },
  pillDangerText: {
    fontSize: s(12.5),
    color: '#B91C1C',
    fontFamily: theme.typography.fontFamily.extraBold,
  },

  tabs: { paddingHorizontal: s(15), paddingVertical: vs(14), gap: s(8) },
  tabWrap: { borderRadius: s(18) },
  tab: {
    paddingHorizontal: s(14),
    paddingVertical: s(10),
    borderRadius: s(18),
    backgroundColor: '#F1ECFD',
  },
  tabDark: { backgroundColor: '#27104B' },
  tabOn: {
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,5,60,0.5)',
    shadowColor: PURPLE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  tabText: {
    fontSize: s(12.5),
    color: '#6D28D9',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  tabTextOn: {
    fontSize: s(12.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
  accentText: { color: '#C4B5FD' },
});
