import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import FastImage from '../../../components/common/FastImage';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { useUpdatePet, usePawsport, uploadPetPhoto } from '../../../hooks/useUser';
import { useDiscoveryCities } from '../../../hooks/useDiscovery';
import { useHealthRecords, documentTypeLabel } from '../../../hooks/usePetHealth';
import { cleanText, petBreed, petName, petPhoto, petSpecies, speciesEmoji } from '../petUtils';
import {
  SOCIAL_FIELDS,
  healthRecordMeta,
  groupHealthRecords,
  lockedCities,
  readSocial,
  socialChanged,
  socialPayload,
} from '../petProfileModel';

const PURPLE = '#7C3AED';
export const SPECIES = [
  { id: 'Dog', emoji: '🐶' },
  { id: 'Cat', emoji: '🐱' },
  { id: 'Rabbit', emoji: '🐰' },
  { id: 'Bird', emoji: '🦜' },
  { id: 'Other', emoji: '🐾' },
];
export const GENDERS = ['Not specified', 'Male', 'Female'];

const errorText = error => error?.response?.data?.error || error?.message || 'Please try again.';

// ── Shared look ─────────────────────────────────────────────────────────────────────────────────

const Card = ({ children, isDarkMode, testID, style }) => (
  <View testID={testID} style={[styles.card, isDarkMode && styles.cardDark, style]}>
    {children}
  </View>
);

const CardHead = ({ title, text, isDarkMode }) => (
  <>
    <Text style={[styles.cardTitle, isDarkMode && styles.textWhite]}>{title}</Text>
    {text ? <Text style={[styles.cardText, isDarkMode && styles.mutedDark]}>{text}</Text> : null}
  </>
);

const Label = ({ children, optional, isDarkMode }) => (
  <Text style={[styles.label, isDarkMode && styles.labelDark]}>
    {children}
    {optional ? <Text style={styles.optional}> (optional)</Text> : null}
  </Text>
);

const SaveButton = ({ testID, label, onPress, busy }) => (
  <BouncyPressable
    testID={testID}
    accessibilityState={{ disabled: busy }}
    disabled={busy}
    activeScale={0.96}
    onPress={onPress}
    style={styles.save}>
    <LinearGradient
      colors={['#4C1D95', PURPLE, '#C026D3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.saveFill, busy && styles.saveBusy]}>
      <Text style={styles.saveText}>{busy ? 'Saving…' : label}</Text>
    </LinearGradient>
  </BouncyPressable>
);

const Chip = ({ testID, text, active, onPress, isDarkMode }) => (
  <BouncyPressable
    testID={testID}
    accessibilityState={{ selected: active }}
    activeScale={0.94}
    onPress={onPress}
    style={[styles.chip, isDarkMode && styles.chipDark, active && styles.chipOn]}>
    <Text style={[styles.chipText, isDarkMode && styles.mutedDark, active && styles.chipTextOn]}>
      {text}
    </Text>
  </BouncyPressable>
);

// ── Basic Info ──────────────────────────────────────────────────────────────────────────────────

export const BasicInfoPanel = ({ pet, isDarkMode, onToast }) => {
  const updatePet = useUpdatePet();
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
  const placeholder = isDarkMode ? '#64748B' : '#94A3B8';

  const box = key => [
    styles.box,
    isDarkMode && styles.boxDark,
    focused === key && styles.boxFocused,
    focused === key && isDarkMode && styles.boxFocusedDark,
  ];
  const focus = key => ({ onFocus: () => setFocused(key), onBlur: () => setFocused(null) });

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
        ...(gender !== GENDERS[0] ? { gender: gender.toLowerCase() } : {}),
        ...(age.trim() && !Number.isNaN(Number(age)) ? { age: Number(age) } : {}),
      });
      onToast('Changes saved');
    } catch (error) {
      Alert.alert('Could not save changes', errorText(error));
    }
  };

  return (
    <Card isDarkMode={isDarkMode} testID="pet-panel-basic">
      <CardHead title="Basic Info" isDarkMode={isDarkMode} />

      <Label isDarkMode={isDarkMode}>
        Name <Text style={styles.required}>*</Text>
      </Label>
      <View style={box('name')}>
        <TextInput
          testID="pet-name"
          value={name}
          onChangeText={setName}
          placeholder="Pet name"
          placeholderTextColor={placeholder}
          maxLength={40}
          style={[styles.input, isDarkMode && styles.textWhite]}
          {...focus('name')}
        />
      </View>

      <Label isDarkMode={isDarkMode}>Species</Label>
      <View style={styles.chips}>
        {SPECIES.map(item => (
          <Chip
            key={item.id}
            testID={`pet-species-${item.id}`}
            text={`${item.emoji} ${item.id}`}
            active={species === item.id}
            onPress={() => setSpecies(item.id)}
            isDarkMode={isDarkMode}
          />
        ))}
      </View>

      <Label optional isDarkMode={isDarkMode}>
        Gender
      </Label>
      <View style={styles.chips}>
        {GENDERS.map(item => (
          <Chip
            key={item}
            testID={`pet-gender-${item}`}
            text={item}
            active={gender === item}
            onPress={() => setGender(item)}
            isDarkMode={isDarkMode}
          />
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.wide}>
          <Label optional isDarkMode={isDarkMode}>
            Breed
          </Label>
          <View style={box('breed')}>
            <TextInput
              testID="pet-breed"
              value={breed}
              onChangeText={setBreed}
              placeholder="Breed"
              placeholderTextColor={placeholder}
              maxLength={60}
              style={[styles.input, isDarkMode && styles.textWhite]}
              {...focus('breed')}
            />
          </View>
        </View>
        <View style={styles.narrow}>
          <Label isDarkMode={isDarkMode}>Age (yrs)</Label>
          <View style={box('age')}>
            <TextInput
              testID="pet-age"
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 3"
              placeholderTextColor={placeholder}
              keyboardType="numeric"
              maxLength={3}
              style={[styles.input, isDarkMode && styles.textWhite]}
              {...focus('age')}
            />
          </View>
        </View>
      </View>

      <Label optional isDarkMode={isDarkMode}>
        Bio
      </Label>
      <View style={box('bio')}>
        <TextInput
          testID="pet-bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell the pack about your pet"
          placeholderTextColor={placeholder}
          multiline
          maxLength={400}
          textAlignVertical="top"
          style={[styles.input, styles.bio, isDarkMode && styles.textWhite]}
          {...focus('bio')}
        />
      </View>
      <Text testID="pet-bio-count" style={[styles.counter, isDarkMode && styles.mutedDark]}>
        {`${bio.length}/400`}
      </Text>

      <SaveButton
        testID="pet-save-basic"
        label="Save Changes"
        busy={updatePet.isPending}
        onPress={handleSave}
      />
    </Card>
  );
};

// ── Photo ───────────────────────────────────────────────────────────────────────────────────────

export const PhotoPanel = ({ pet, isDarkMode, onToast }) => {
  const queryClient = useQueryClient();
  const [localPhoto, setLocalPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const photo = localPhoto || petPhoto(pet);

  const choose = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.85, selectionLimit: 1, maxWidth: 1600, maxHeight: 1600 },
      async response => {
        const asset = response?.assets?.[0];
        if (response?.errorCode) {
          Alert.alert('Photo', response.errorMessage || 'Unable to open your photos.');
          return;
        }
        if (!asset?.uri) {
          return;
        }
        setUploading(true);
        const ok = await uploadPetPhoto(pet.id, asset);
        setUploading(false);
        if (ok) {
          setLocalPhoto(asset.uri);
          queryClient.invalidateQueries({ queryKey: ['user', 'pets'] });
          onToast('Photo updated');
        } else {
          Alert.alert('Could not upload photo', 'Please check your connection and try again.');
        }
      },
    );
  };

  return (
    <Card isDarkMode={isDarkMode} testID="pet-panel-photo">
      <CardHead
        title="Profile Photo"
        text="Reviewed by AI — goes live instantly if it passes."
        isDarkMode={isDarkMode}
      />
      <View style={styles.photoRow}>
        <View style={styles.photoCol}>
          <View style={[styles.photoRing, isDarkMode && styles.photoRingDark]}>
            {photo ? (
              <FastImage
                testID="pet-photo-image"
                source={{ uri: photo }}
                style={styles.photoImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.photoEmoji}>{speciesEmoji(petSpecies(pet))}</Text>
            )}
          </View>
          {!photo ? (
            <Text
              testID="pet-photo-empty"
              style={[styles.photoCaption, isDarkMode && styles.mutedDark]}>
              No photo yet
            </Text>
          ) : null}
        </View>
        <View style={styles.photoInfo}>
          <Text style={[styles.cardText, isDarkMode && styles.mutedDark]}>
            Upload a clear photo of your pet. Square photos fit best.
          </Text>
          <BouncyPressable
            testID="pet-photo-change"
            accessibilityState={{ disabled: uploading }}
            disabled={uploading}
            activeScale={0.96}
            onPress={choose}
            style={[styles.outline, isDarkMode && styles.outlineDark]}>
            <Text style={[styles.outlineText, isDarkMode && styles.accentText]}>
              {uploading ? 'Uploading…' : 'Change photo'}
            </Text>
          </BouncyPressable>
          <Text style={[styles.hint, isDarkMode && styles.mutedDark]}>
            JPG, PNG, WebP or HEIC · max 10 MB
          </Text>
        </View>
      </View>
    </Card>
  );
};

// ── Social ──────────────────────────────────────────────────────────────────────────────────────

export const SocialPanel = ({ pet, isDarkMode, onToast }) => {
  const updatePet = useUpdatePet();
  const [values, setValues] = useState(() => readSocial(pet));
  const [focused, setFocused] = useState(null);

  const handleSave = async () => {
    if (!socialChanged(values, pet)) {
      onToast('No changes to save');
      return;
    }
    try {
      await updatePet.mutateAsync({ id: pet.id, ...socialPayload(values) });
      onToast('Links saved');
    } catch (error) {
      Alert.alert('Could not save links', errorText(error));
    }
  };

  return (
    <Card isDarkMode={isDarkMode} testID="pet-panel-social">
      <CardHead
        title="Social Links"
        text="Add your pet's social profiles. These appear on their Pawsport and in the leaderboard."
        isDarkMode={isDarkMode}
      />
      {SOCIAL_FIELDS.map(field => (
        <View key={field.key}>
          <Label isDarkMode={isDarkMode}>{field.label}</Label>
          <View
            style={[
              styles.box,
              styles.boxRow,
              isDarkMode && styles.boxDark,
              focused === field.key && styles.boxFocused,
              focused === field.key && isDarkMode && styles.boxFocusedDark,
            ]}>
            <Ionicons
              name={field.icon}
              size={ms(17)}
              color={focused === field.key ? PURPLE : isDarkMode ? '#94A3B8' : '#8D809E'}
            />
            <TextInput
              testID={`pet-social-${field.key}`}
              value={values[field.key]}
              onChangeText={text => setValues(current => ({ ...current, [field.key]: text }))}
              placeholder={field.placeholder}
              placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.inputBare, isDarkMode && styles.textWhite]}
              onFocus={() => setFocused(field.key)}
              onBlur={() => setFocused(null)}
            />
          </View>
        </View>
      ))}
      <SaveButton
        testID="pet-save-social"
        label="Save Links"
        busy={updatePet.isPending}
        onPress={handleSave}
      />
    </Card>
  );
};

// ── Stamps ──────────────────────────────────────────────────────────────────────────────────────

export const StampsPanel = ({ pet, isDarkMode }) => {
  const { data: pawsport } = usePawsport(pet.slug);
  const { data: known } = useDiscoveryCities();
  const stamps = Array.isArray(pawsport?.stamps) ? pawsport.stamps : [];
  const locked = lockedCities(known, stamps, 10);

  return (
    <Card isDarkMode={isDarkMode} testID="pet-panel-stamps">
      <CardHead
        title="Pawsport Stamps"
        text="Stamps are earned automatically when your reviews are approved. Visit more places to unlock more."
        isDarkMode={isDarkMode}
      />

      {stamps.length > 0 ? (
        <>
          <Text style={[styles.subHead, isDarkMode && styles.mutedDark]}>Earned stamps</Text>
          <View style={styles.tiles}>
            {stamps.map((stamp, index) => (
              <View
                key={stamp?.id ?? index}
                testID={`pet-stamp-${index}`}
                style={[styles.tile, styles.tileEarned, isDarkMode && styles.tileEarnedDark]}>
                <Text style={styles.tileEmoji}>🥇</Text>
                <Text
                  numberOfLines={2}
                  style={[styles.tileName, styles.tileNameEarned, isDarkMode && styles.textWhite]}>
                  {stamp?.placeName || stamp?.listingName || stamp?.name || stamp?.city || 'Stamp'}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {locked.length > 0 ? (
        <>
          <Text style={[styles.subHead, isDarkMode && styles.mutedDark]}>
            Cities left to unlock
          </Text>
          <View style={styles.tiles}>
            {locked.map((city, index) => (
              <View
                key={city}
                testID={`pet-locked-${index}`}
                style={[styles.tile, isDarkMode && styles.tileDark]}>
                <Ionicons
                  name="lock-closed"
                  size={ms(18)}
                  color={isDarkMode ? '#64748B' : '#C4B5B0'}
                />
                <Text numberOfLines={2} style={[styles.tileName, isDarkMode && styles.mutedDark]}>
                  {city}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {stamps.length === 0 && locked.length === 0 ? (
        <Text testID="pet-stamps-empty" style={[styles.cardText, isDarkMode && styles.mutedDark]}>
          No stamps yet. Review a pet-friendly place to earn the first one.
        </Text>
      ) : null}
    </Card>
  );
};

// ── Health Records ──────────────────────────────────────────────────────────────────────────────

export const HealthPanel = ({ pet, isDarkMode, onOpenBook, onAddRecord }) => {
  const { data: records = [] } = useHealthRecords(pet.id);

  return (
    <View testID="pet-panel-health">
      <Card isDarkMode={isDarkMode} style={styles.noteCard}>
        <Text style={[styles.cardText, styles.noteText, isDarkMode && styles.mutedDark]}>
          Only you can see these. Health records are never shown on your pet's public profile.
        </Text>
      </Card>

      <Card isDarkMode={isDarkMode}>
        <CardHead
          title="Health Records"
          text="Keep health and travel documents together for easy access."
          isDarkMode={isDarkMode}
        />
        <View style={styles.buttonsRow}>
          <BouncyPressable
            testID="pet-health-book"
            activeScale={0.96}
            onPress={onOpenBook}
            style={styles.save}>
            <LinearGradient
              colors={['#4C1D95', PURPLE]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.smallFill}>
              <Text style={styles.saveText}>Open health records book</Text>
            </LinearGradient>
          </BouncyPressable>
          <BouncyPressable
            testID="pet-health-add"
            activeScale={0.96}
            onPress={onAddRecord}
            style={[styles.outline, styles.smallOutline, isDarkMode && styles.outlineDark]}>
            <Text style={[styles.outlineText, isDarkMode && styles.accentText]}>Add record</Text>
          </BouncyPressable>
        </View>

        {records.length === 0 ? (
          <Text
            testID="pet-health-empty"
            style={[styles.cardText, styles.gap, isDarkMode && styles.mutedDark]}>
            No health records yet. Add a record to keep important documents private and easy to
            find.
          </Text>
        ) : (
          <View style={styles.records}>
            {groupHealthRecords(records).map(group => (
              <View key={group.type} testID={`pet-record-group-${group.type}`}>
                <Text style={[styles.recordGroup, isDarkMode && styles.recordGroupDark]}>
                  {documentTypeLabel(group.type).toUpperCase()}
                </Text>
                {group.entries.map(({ record, index }) => (
                  <View
                    key={record?.id ?? index}
                    testID={`pet-record-${index}`}
                    style={[styles.record, isDarkMode && styles.recordDark]}>
                    <Text
                      numberOfLines={1}
                      style={[styles.recordName, isDarkMode && styles.textWhite]}>
                      {record?.recordName ||
                        record?.name ||
                        documentTypeLabel(record?.documentType)}
                    </Text>
                    <Text style={[styles.recordMeta, isDarkMode && styles.mutedDark]}>
                      {healthRecordMeta(record)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
};

export const panelPetName = petName;

const styles = StyleSheet.create({
  recordGroup: {
    marginTop: vs(6),
    marginBottom: vs(6),
    fontSize: s(12),
    letterSpacing: 0.8,
    color: '#7B2CFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  recordGroupDark: { color: '#C4B5FD' },
  card: {
    marginHorizontal: s(15),
    marginBottom: vs(12),
    padding: s(16),
    borderRadius: s(22),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  cardTitle: {
    fontSize: s(18),
    letterSpacing: -0.4,
    color: '#1E1B4B',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  cardText: {
    marginTop: s(4),
    fontSize: s(12.5),
    lineHeight: s(19),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
  accentText: { color: '#C4B5FD' },
  label: {
    marginTop: vs(14),
    marginBottom: s(6),
    fontSize: s(12),
    lineHeight: s(14),
    color: '#3B2A55',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  labelDark: { color: '#E9E3F7' },
  optional: { color: '#8D809E', fontFamily: theme.typography.fontFamily.medium },
  required: { color: '#DC2626' },

  box: {
    minHeight: s(46),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
  },
  boxRow: { flexDirection: 'row', alignItems: 'center', gap: s(10) },
  boxDark: { backgroundColor: '#220D42', borderColor: '#3D1C73', borderBottomColor: '#240B4C' },
  boxFocused: { borderColor: PURPLE, borderBottomColor: '#5B21B6', backgroundColor: '#FFFFFF' },
  boxFocusedDark: { backgroundColor: '#2E1259', borderBottomColor: '#4C1D95' },
  input: {
    fontSize: s(14),
    lineHeight: s(20),
    color: '#16082F',
    paddingVertical: s(8),
    fontFamily: theme.typography.fontFamily.regular,
  },
  inputBare: {
    flex: 1,
    fontSize: s(14),
    lineHeight: s(20),
    color: '#16082F',
    paddingVertical: s(8),
    fontFamily: theme.typography.fontFamily.regular,
  },
  bio: { minHeight: s(92), paddingTop: s(12) },
  counter: {
    marginTop: s(6),
    fontSize: s(11),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  row: { flexDirection: 'row', gap: s(10) },
  wide: { flex: 1.7 },
  narrow: { flex: 1 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  chip: {
    paddingHorizontal: s(13),
    paddingVertical: s(9),
    borderRadius: s(14),
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderBottomWidth: 2.5,
    borderBottomColor: '#D1D5DB',
  },
  chipDark: { backgroundColor: '#220D42', borderColor: '#3D1C73', borderBottomColor: '#240B4C' },
  chipOn: { backgroundColor: '#EFE6FF', borderColor: PURPLE, borderBottomColor: '#5B21B6' },
  chipText: {
    fontSize: s(12.5),
    color: '#4B3F63',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  chipTextOn: { color: '#4C1D95', fontFamily: theme.typography.fontFamily.bold },

  save: { alignSelf: 'flex-end', marginTop: vs(18), borderRadius: s(16), overflow: 'hidden' },
  saveFill: {
    paddingHorizontal: s(24),
    paddingVertical: s(13),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,5,60,0.5)',
  },
  smallFill: {
    paddingHorizontal: s(14),
    paddingVertical: s(10),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(20,5,60,0.5)',
  },
  saveBusy: { opacity: 0.7 },
  saveText: {
    fontSize: s(13.5),
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },

  outline: {
    alignSelf: 'flex-start',
    marginTop: s(12),
    paddingHorizontal: s(18),
    paddingVertical: s(11),
    borderRadius: s(14),
    backgroundColor: '#F7F4FE',
    borderWidth: 1.2,
    borderColor: '#DDD0FF',
    borderBottomWidth: 3,
    borderBottomColor: '#C4B5FD',
  },
  outlineDark: { backgroundColor: '#27104B', borderColor: '#3B1B6E', borderBottomColor: '#4C1D95' },
  outlineText: {
    fontSize: s(13.5),
    color: '#6D28D9',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  smallOutline: { marginTop: 0, paddingVertical: s(8), paddingHorizontal: s(14) },

  photoRow: { flexDirection: 'row', gap: s(16), marginTop: vs(16), alignItems: 'flex-start' },
  photoCol: { alignItems: 'center' },
  photoRing: {
    width: s(96),
    height: s(96),
    borderRadius: s(48),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F3EEFF',
    borderWidth: 3,
    borderColor: '#DDD0FF',
  },
  photoRingDark: { backgroundColor: '#27104B', borderColor: '#4C1D95' },
  photoImage: { width: '100%', height: '100%' },
  photoEmoji: { fontSize: s(40) },
  photoCaption: {
    marginTop: s(8),
    fontSize: s(11.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  photoInfo: { flex: 1 },
  hint: {
    marginTop: s(10),
    fontSize: s(11),
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.medium,
  },

  subHead: {
    marginTop: vs(16),
    marginBottom: s(8),
    fontSize: s(13),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.bold,
  },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  tile: {
    width: '31.5%',
    minHeight: s(84),
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(6),
    padding: s(8),
    borderRadius: s(16),
    backgroundColor: '#FBFAFF',
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: '#E4DCF3',
  },
  tileDark: { backgroundColor: '#12071F', borderColor: '#2E1654' },
  tileEarned: { backgroundColor: '#FFF8E6', borderStyle: 'solid', borderColor: '#F3DDA2' },
  tileEarnedDark: { backgroundColor: '#2A1A06', borderColor: '#7A5A12' },
  tileEmoji: { fontSize: s(24) },
  tileName: {
    textAlign: 'center',
    fontSize: s(11),
    color: '#8D809E',
    fontFamily: theme.typography.fontFamily.semiBold,
  },
  tileNameEarned: { color: '#1E1B4B' },

  noteCard: { paddingVertical: s(12) },
  noteText: { marginTop: 0, color: '#4B3F63' },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: s(8),
    marginTop: vs(12),
  },
  gap: { marginTop: vs(12) },
  records: { marginTop: vs(12), gap: s(8) },
  record: {
    padding: s(12),
    borderRadius: s(14),
    backgroundColor: '#FBFAFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
  },
  recordDark: { backgroundColor: '#12071F', borderColor: '#2E1654' },
  recordName: { fontSize: s(13.5), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  recordMeta: {
    marginTop: 2,
    fontSize: s(11),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
