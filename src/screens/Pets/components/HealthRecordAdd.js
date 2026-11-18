import React from 'react';
import { View, Text, TextInput, Image, ScrollView, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { HEALTH_DOCUMENT_TYPES, formatDateInput } from '../../../hooks/usePetHealth';

const PURPLE = '#7B2CFF';
const font = theme.typography.fontFamily;

const PrimaryButton = ({ label, icon, onPress, testID, disabled }) => (
  <BouncyPressable
    testID={testID}
    activeScale={0.96}
    disabled={disabled}
    onPress={onPress}
    style={[styles.primaryWrap, disabled && styles.disabled]}>
    <LinearGradient
      colors={['#7B2CFF', '#3B108F']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.primary}>
      {icon ? <Ionicons name={icon} size={ms(15)} color="#FFFFFF" /> : null}
      <Text style={styles.primaryText}>{label}</Text>
    </LinearGradient>
  </BouncyPressable>
);

const OutlineButton = ({ label, icon, onPress, testID, isDarkMode }) => (
  <BouncyPressable
    testID={testID}
    activeScale={0.96}
    onPress={onPress}
    style={[styles.outline, isDarkMode && styles.outlineDark]}>
    {icon ? <Ionicons name={icon} size={ms(15)} color={PURPLE} /> : null}
    <Text style={styles.outlineText}>{label}</Text>
  </BouncyPressable>
);

export { PrimaryButton, OutlineButton };

// Dashed drop area: take or choose photos of the vaccination book or certificates
export const HealthPhotoCard = ({
  petName,
  photos,
  onTakePhoto,
  onChoosePhotos,
  onRemovePhoto,
  onEnterByHand,
  isDarkMode,
}) => (
  <View style={[styles.dashed, isDarkMode && styles.dashedDark]}>
    <View style={[styles.dashedIcon, isDarkMode && styles.dashedIconDark]}>
      <Ionicons name="camera-outline" size={ms(26)} color={PURPLE} />
    </View>
    <Text style={[styles.dashedTitle, isDarkMode && styles.textWhite]}>
      {`Add photos of ${petName}'s vaccination book or certificates`}
    </Text>
    <Text style={[styles.dashedText, isDarkMode && styles.mutedDark]}>
      One page per photo works best. We read the details for you.
    </Text>

    {photos.length > 0 ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbScroll}
        contentContainerStyle={styles.thumbRow}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.thumbWrap}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} />
            <BouncyPressable
              testID={`health-photo-remove-${index}`}
              activeScale={0.85}
              onPress={() => onRemovePhoto(index)}
              style={styles.thumbRemove}>
              <Ionicons name="close" size={ms(12)} color="#FFFFFF" />
            </BouncyPressable>
          </View>
        ))}
      </ScrollView>
    ) : null}

    <View style={styles.dashedButtons}>
      <PrimaryButton
        testID="health-take-photo"
        label="Take photo"
        icon="camera-outline"
        onPress={onTakePhoto}
      />
      <OutlineButton
        testID="health-choose-files"
        label="Choose files"
        icon="cloud-upload-outline"
        onPress={onChoosePhotos}
        isDarkMode={isDarkMode}
      />
    </View>
    <BouncyPressable testID="health-by-hand" activeScale={0.97} onPress={onEnterByHand}>
      <Text style={[styles.byHand, isDarkMode && styles.mutedDark]}>
        No photo? Enter details by hand.
      </Text>
    </BouncyPressable>
  </View>
);

const Field = ({ label, optional, required, children, isDarkMode }) => (
  <View style={styles.field}>
    <Text style={[styles.label, isDarkMode && styles.textWhite]}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
      {optional ? <Text style={[styles.optional, isDarkMode && styles.mutedDark]}> (optional)</Text> : null}
    </Text>
    {children}
  </View>
);

const Input = ({ isDarkMode, style, ...props }) => (
  <TextInput
    placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
    style={[styles.input, isDarkMode && styles.inputDark, style]}
    {...props}
  />
);

// The "Add health record" form. `form` and `onChange(key, value)` are owned by the screen.
export const HealthRecordForm = ({ form, onChange, onSave, saving, error, isDarkMode }) => (
  <View style={[styles.formCard, isDarkMode && styles.formCardDark]}>
    <Text style={[styles.formTitle, isDarkMode && styles.textWhite]}>Add health record</Text>

    <Field label="Document type" required isDarkMode={isDarkMode}>
      <View style={styles.typeWrap}>
        {HEALTH_DOCUMENT_TYPES.map(type => {
          const active = form.documentType === type.id;
          return (
            <BouncyPressable
              key={type.id}
              testID={`health-type-${type.id}`}
              activeScale={0.95}
              onPress={() => onChange('documentType', type.id)}
              style={[styles.typeChip, isDarkMode && styles.typeChipDark, active && styles.typeChipActive]}>
              <Text style={[styles.typeText, active && styles.typeTextActive]}>{type.label}</Text>
            </BouncyPressable>
          );
        })}
      </View>
    </Field>

    <Field label="Record name" optional isDarkMode={isDarkMode}>
      <Input
        testID="health-record-name"
        value={form.recordName}
        onChangeText={value => onChange('recordName', value)}
        placeholder="e.g. Rabies booster"
        isDarkMode={isDarkMode}
      />
    </Field>

    <View style={styles.row}>
      <View style={styles.col}>
        <Field label="Date issued" optional isDarkMode={isDarkMode}>
          <Input
            testID="health-date-issued"
            value={form.dateIssued}
            onChangeText={value => onChange('dateIssued', formatDateInput(value))}
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
            maxLength={10}
            isDarkMode={isDarkMode}
          />
        </Field>
      </View>
      <View style={styles.col}>
        <Field label="Next due date" optional isDarkMode={isDarkMode}>
          <Input
            testID="health-next-due"
            value={form.nextDueDate}
            onChangeText={value => onChange('nextDueDate', formatDateInput(value))}
            placeholder="DD/MM/YYYY"
            keyboardType="number-pad"
            maxLength={10}
            isDarkMode={isDarkMode}
          />
        </Field>
      </View>
    </View>

    <Field label="Vet name" optional isDarkMode={isDarkMode}>
      <Input
        testID="health-vet-name"
        value={form.vetName}
        onChangeText={value => onChange('vetName', value)}
        isDarkMode={isDarkMode}
      />
    </Field>
    <Field label="Clinic name" optional isDarkMode={isDarkMode}>
      <Input
        testID="health-clinic-name"
        value={form.clinicName}
        onChangeText={value => onChange('clinicName', value)}
        isDarkMode={isDarkMode}
      />
    </Field>
    <Field label="Document number" optional isDarkMode={isDarkMode}>
      <Input
        testID="health-document-number"
        value={form.documentNumber}
        onChangeText={value => onChange('documentNumber', value)}
        isDarkMode={isDarkMode}
      />
    </Field>
    <Field label="Notes" optional isDarkMode={isDarkMode}>
      <Input
        testID="health-notes"
        value={form.notes}
        onChangeText={value => onChange('notes', value)}
        multiline
        textAlignVertical="top"
        style={styles.notes}
        isDarkMode={isDarkMode}
      />
    </Field>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    <View style={styles.saveRow}>
      <PrimaryButton
        testID="health-save"
        label={saving ? 'Saving…' : 'Save record'}
        onPress={onSave}
        disabled={saving}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  primaryWrap: { borderRadius: s(16), overflow: 'hidden' },
  disabled: { opacity: 0.6 },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
  },
  primaryText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: s(13.5) },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    paddingHorizontal: s(18),
    paddingVertical: vs(11),
    borderRadius: s(16),
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
  },
  outlineDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654' },
  outlineText: { color: PURPLE, fontFamily: font.bold, fontSize: s(13.5) },

  dashed: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(20),
    alignItems: 'center',
    borderRadius: s(24),
    borderWidth: 1.6,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
    backgroundColor: '#FFFFFF',
  },
  dashedDark: { backgroundColor: '#1A0B30', borderColor: '#4C1D95' },
  dashedIcon: {
    width: s(56),
    height: s(56),
    borderRadius: s(18),
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedIconDark: { backgroundColor: '#27104B' },
  dashedTitle: {
    marginTop: vs(14),
    textAlign: 'center',
    fontSize: s(15.5),
    lineHeight: s(22),
    color: '#1E1B4B',
    fontFamily: font.bold,
  },
  dashedText: {
    marginTop: vs(6),
    textAlign: 'center',
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: font.medium,
  },
  thumbScroll: { alignSelf: 'stretch', marginTop: vs(14) },
  thumbRow: { gap: s(10), paddingVertical: vs(4) },
  thumbWrap: { width: s(64), height: s(64) },
  thumb: { width: s(64), height: s(64), borderRadius: s(12), backgroundColor: '#EDE9FE' },
  thumbRemove: {
    position: 'absolute',
    top: -s(5),
    right: -s(5),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedButtons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: s(10), marginTop: vs(16) },
  byHand: {
    marginTop: vs(14),
    fontSize: s(12.5),
    color: '#6B5C85',
    fontFamily: font.bold,
    textDecorationLine: 'underline',
  },

  formCard: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(18),
    borderRadius: s(24),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    borderBottomWidth: 4,
    borderBottomColor: '#C4B5FD',
  },
  formCardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  formTitle: { fontSize: s(18), color: '#1E1B4B', fontFamily: font.extraBold, marginBottom: vs(12) },
  field: { marginBottom: vs(12) },
  label: { fontSize: s(13), color: '#1E1B4B', fontFamily: font.bold, marginBottom: vs(6) },
  required: { color: '#DC2626' },
  optional: { color: '#6B5C85', fontFamily: font.regular },
  input: {
    minHeight: vs(44),
    paddingHorizontal: s(14),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderColor: '#E4DEF5',
    backgroundColor: '#FFFFFF',
    fontSize: s(14),
    color: '#1E1B4B',
    fontFamily: font.regular,
  },
  inputDark: { backgroundColor: '#12071F', borderColor: '#2E1654', color: '#FFFFFF' },
  notes: { minHeight: vs(96), paddingTop: vs(10) },
  row: { flexDirection: 'row', gap: s(10) },
  col: { flex: 1 },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8) },
  typeChip: {
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
    borderRadius: s(16),
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E4DEF5',
  },
  typeChipDark: { backgroundColor: '#27104B', borderColor: '#2E1654' },
  typeChipActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  typeText: { fontSize: s(12), color: '#6D28D9', fontFamily: font.bold },
  typeTextActive: { color: '#FFFFFF' },
  error: { color: '#DC2626', fontSize: s(12.5), fontFamily: font.medium, marginBottom: vs(8) },
  saveRow: { alignItems: 'flex-end', marginTop: vs(4) },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
});
