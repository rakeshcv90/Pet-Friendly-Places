import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { s, vs } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { useUpdatePet, useDeletePet } from '../../hooks/useUser';
import { BouncyPressable } from '../../components/common/BouncyPressable';
import { Enter } from '../Community/Motion';
import { PetHero, DEEP_PURPLE } from './components/PetHero';
import { cleanText, petName, petSpecies, petBreed, petSubtitle, petPhoto } from './petUtils';
import { Loader } from '../../components/common/Loader';

const SPECIES = [
  { id: 'Dog', emoji: '🐶' },
  { id: 'Cat', emoji: '🐱' },
  { id: 'Rabbit', emoji: '🐰' },
  { id: 'Bird', emoji: '🦜' },
  { id: 'Other', emoji: '🐾' },
];
const GENDERS = ['Not specified', 'Male', 'Female'];

// Edit a pet's basic info (opened from the My Pets card)
export const PetEditScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const pet = route?.params?.pet || {};
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();
  const [photo, setPhoto] = useState(null);

  const [name, setName] = useState(cleanText(pet.petName) || cleanText(pet.name));
  const [species, setSpecies] = useState(
    SPECIES.find(item => item.id.toLowerCase() === petSpecies(pet).toLowerCase())?.id || 'Other',
  );
  const [gender, setGender] = useState(
    GENDERS.find(item => item.toLowerCase() === String(pet.gender || '').toLowerCase()) ||
      GENDERS[0],
  );
  const [breed, setBreed] = useState(petBreed(pet));
  const [age, setAge] = useState(pet.age != null ? String(pet.age) : '');
  const [bio, setBio] = useState(pet.bio || '');
  const [focused, setFocused] = useState(null);

  const placeholderColor = isDarkMode ? '#64748B' : '#94A3B8';
  const field = key => [
    styles.field,
    isDarkMode && styles.fieldDark,
    focused === key && styles.fieldFocused,
  ];
  const label = text => <Text style={[styles.label, isDarkMode && styles.labelDark]}>{text}</Text>;
  const focusProps = key => ({ onFocus: () => setFocused(key), onBlur: () => setFocused(null) });

  const pickPhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.85, selectionLimit: 1, maxWidth: 1600, maxHeight: 1600 },
      response => {
        const asset = response?.assets?.[0];
        if (response?.errorCode) {
          Alert.alert('Photo', response.errorMessage || 'Unable to open your photos.');
        } else if (asset?.uri) {
          setPhoto(asset);
        }
      },
    );
  };

  // Archives the pet on the server (its history is kept) and returns to the list
  const handleRemove = () =>
    Alert.alert(
      `Remove ${petName(pet)}?`,
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your pet’s name.');
      return;
    }
    try {
      await updatePet.mutateAsync({
        id: pet.id,
        petName: name.trim(),
        species,
        breed: breed.trim(),
        bio: bio.trim(),
        photo,
        ...(gender !== GENDERS[0] ? { gender: gender.toLowerCase() } : {}),
        ...(age.trim() && !Number.isNaN(Number(age)) ? { age: Number(age) } : {}),
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Could not save changes',
        error?.response?.data?.error || error?.message || 'Please try again.',
      );
    }
  };

  const chip = (text, active, onPress, key) => (
    <BouncyPressable
      key={key || text}
      activeScale={0.94}
      onPress={onPress}
      style={[styles.chip, isDarkMode && styles.chipDark, active && styles.chipActive]}>
      <Text
        style={[styles.chipText, isDarkMode && styles.mutedDark, active && styles.chipTextActive]}>
        {text}
      </Text>
    </BouncyPressable>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={DEEP_PURPLE} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: vs(24) }}>
          <PetHero
            eyebrow="EDITING"
            title={`Edit ${petName(pet)}`}
            subtitle={petSubtitle(pet) || 'Update your pet’s profile'}
            backLabel="🐾 My pets"
            onBack={() => navigation.goBack()}
          />

          <Enter index={0}>
            <View style={[styles.card, isDarkMode && styles.cardDark]}>
              <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>Basic Info</Text>

              <BouncyPressable
                testID="edit-pet-photo"
                style={[styles.photoRow, isDarkMode && styles.fieldDark]}
                activeScale={0.97}
                onPress={pickPhoto}>
                {photo?.uri || petPhoto(pet) ? (
                  <Image source={{ uri: photo?.uri || petPhoto(pet) }} style={styles.photoThumb} />
                ) : (
                  <View style={[styles.photoThumb, styles.photoEmpty]}>
                    <Feather name="camera" size={16} color="#7C3AED" />
                  </View>
                )}
                <Text style={[styles.photoText, isDarkMode && styles.textWhite]}>
                  {photo ? 'New photo selected' : 'Change profile photo'}
                </Text>
                <Feather name="chevron-right" size={16} color="#94A3B8" />
              </BouncyPressable>

              {label('Name *')}
              <View style={field('name')}>
                <TextInput
                  testID="edit-pet-name"
                  style={[styles.input, isDarkMode && styles.textWhite]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Pet name"
                  placeholderTextColor={placeholderColor}
                  maxLength={40}
                  {...focusProps('name')}
                />
              </View>

              {label('Species')}
              <View style={styles.chips}>
                {SPECIES.map(item =>
                  chip(
                    `${item.emoji} ${item.id}`,
                    species === item.id,
                    () => setSpecies(item.id),
                    item.id,
                  ),
                )}
              </View>

              {label('Gender (optional)')}
              <View style={styles.chips}>
                {GENDERS.map(item => chip(item, gender === item, () => setGender(item)))}
              </View>

              <View style={styles.twoCol}>
                <View style={styles.colWide}>
                  {label('Breed (optional)')}
                  <View style={field('breed')}>
                    <TextInput
                      testID="edit-pet-breed"
                      style={[styles.input, isDarkMode && styles.textWhite]}
                      value={breed}
                      onChangeText={setBreed}
                      placeholder="Breed"
                      placeholderTextColor={placeholderColor}
                      maxLength={60}
                      {...focusProps('breed')}
                    />
                  </View>
                </View>
                <View style={styles.colNarrow}>
                  {label('Age (yrs)')}
                  <View style={field('age')}>
                    <TextInput
                      testID="edit-pet-age"
                      style={[styles.input, isDarkMode && styles.textWhite]}
                      value={age}
                      onChangeText={setAge}
                      placeholder="e.g. 3"
                      placeholderTextColor={placeholderColor}
                      keyboardType="numeric"
                      maxLength={3}
                      {...focusProps('age')}
                    />
                  </View>
                </View>
              </View>

              {label('Bio (optional)')}
              <View style={field('bio')}>
                <TextInput
                  testID="edit-pet-bio"
                  style={[styles.input, styles.bioInput, isDarkMode && styles.textWhite]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell the pack about your pet"
                  placeholderTextColor={placeholderColor}
                  multiline
                  maxLength={400}
                  textAlignVertical="top"
                  {...focusProps('bio')}
                />
              </View>
              <Text style={styles.counter}>{bio.length}/400</Text>
            </View>
          </Enter>

          <BouncyPressable
            testID="edit-pet-remove"
            style={styles.remove}
            activeScale={0.96}
            onPress={handleRemove}>
            <Feather name="trash-2" size={14} color="#B91C1C" />
            <Text style={styles.removeText}>Remove {petName(pet)}</Text>
          </BouncyPressable>
        </ScrollView>

        <View
          style={[
            styles.dock,
            isDarkMode && styles.dockDark,
            { paddingBottom: Math.max(insets.bottom, vs(14)) },
          ]}>
          <Loader
            visible={updatePet.isPending || deletePet.isPending}
            title={deletePet.isPending ? 'Removing pet…' : 'Saving changes…'}
          />
          <BouncyPressable
            testID="edit-pet-save"
            style={styles.save}
            activeScale={0.96}
            onPress={handleSave}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveGradient}>
              <Text style={styles.saveText}>Save Changes</Text>
            </LinearGradient>
          </BouncyPressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  containerDark: { backgroundColor: '#0F071D' },
  card: {
    marginHorizontal: s(16),
    marginTop: vs(16),
    padding: s(16),
    backgroundColor: '#FFFFFF',
    borderRadius: s(22),
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  cardTitle: {
    fontSize: s(16),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.extraBold,
    marginBottom: vs(4),
  },
  label: {
    marginTop: vs(14),
    marginBottom: vs(6),
    fontSize: s(12),
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.bold,
  },
  labelDark: { color: '#E2E8F0' },
  field: {
    borderRadius: s(14),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
    paddingHorizontal: s(12),
  },
  fieldDark: { backgroundColor: '#150A28', borderColor: '#2E1654', borderBottomColor: '#3B1F66' },
  fieldFocused: { borderColor: '#7C3AED', borderBottomColor: '#6D28D9' },
  input: {
    paddingVertical: vs(11),
    fontSize: s(14),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.medium,
  },
  bioInput: { minHeight: vs(90) },
  counter: {
    marginTop: vs(6),
    fontSize: s(11),
    color: '#94A3B8',
    fontFamily: theme.typography.fontFamily.medium,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  chip: {
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: s(18),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipDark: { backgroundColor: '#150A28', borderColor: '#2E1654' },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#6D28D9' },
  chipText: { fontSize: s(12), color: '#64748B', fontFamily: theme.typography.fontFamily.bold },
  chipTextActive: { color: '#FFFFFF' },
  twoCol: { flexDirection: 'row', gap: s(10) },
  colWide: { flex: 2 },
  colNarrow: { flex: 1 },
  dock: {
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDE9FE',
  },
  dockDark: { backgroundColor: '#150A28', borderTopColor: '#2E1654' },
  save: {
    borderRadius: s(18),
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(14),
    borderRadius: s(18),
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(30,7,71,0.35)',
  },
  saveText: {
    fontSize: s(15),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(12),
    padding: s(10),
    borderRadius: s(14),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderBottomWidth: 3,
    borderBottomColor: '#CBD5E1',
  },
  photoThumb: { width: s(44), height: s(44), borderRadius: s(14) },
  photoEmpty: { backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
  photoText: {
    flex: 1,
    marginLeft: s(12),
    fontSize: s(13.5),
    color: '#0F172A',
    fontFamily: theme.typography.fontFamily.bold,
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    marginHorizontal: s(16),
    marginTop: vs(14),
    paddingVertical: vs(12),
    borderRadius: s(16),
    backgroundColor: '#FEF2F2',
    borderWidth: 1.2,
    borderColor: '#FECACA',
    borderBottomWidth: 3,
    borderBottomColor: '#FCA5A5',
  },
  removeText: { fontSize: s(13), color: '#B91C1C', fontFamily: theme.typography.fontFamily.bold },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
