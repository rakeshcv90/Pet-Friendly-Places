import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { Enter } from '../Community/Motion';
import { PetHero, DEEP_PURPLE } from './components/PetHero';
import { petName } from './petUtils';
import { HealthBook } from './components/HealthBook';
import { ActionTile } from './components/ActionTile';
import {
  HealthPhotoCard,
  HealthRecordForm,
  PrimaryButton,
  OutlineButton,
} from './components/HealthRecordAdd';
import { SuccessToast } from '../../components/common/SuccessToast';
import { requestCamera, openPhoneSettings } from '../../services/permissions/permissions';
import {
  useHealthRecords,
  useCreateHealthRecord,
  documentTypeLabel,
  toIsoDate,
} from '../../hooks/usePetHealth';

const MAX_PHOTOS = 10;
const EMPTY_FORM = {
  documentType: 'vaccination',
  recordName: '',
  dateIssued: '',
  nextDueDate: '',
  vetName: '',
  clinicName: '',
  documentNumber: '',
  notes: '',
};

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

  const { data: records = [] } = useHealthRecords(pet.id);
  const createRecord = useCreateHealthRecord(pet.id);

  // Three views, like the website: the records book first; "Add photos" opens the add area with
  // the photo card; "Add record" (or a picked photo) adds the form; "Open health records book"
  // goes back to the book
  const [view, setView] = useState('book'); // 'book' | 'add' | 'form'
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const openBook = useCallback(() => setView('book'), []);
  const openAdd = useCallback(() => setView(current => (current === 'book' ? 'add' : current)), []);
  const openForm = useCallback(() => setView('form'), []);

  const addPhotos = useCallback(assets => {
    const picked = (assets || []).filter(asset => asset?.uri);
    if (picked.length === 0) {
      return;
    }
    setPhotos(current => [...current, ...picked].slice(0, MAX_PHOTOS));
    setView('form');
  }, []);

  const handlePhotoResult = useCallback(
    response => {
      if (response?.didCancel) {
        return;
      }
      if (response?.errorCode) {
        Alert.alert('Photo', response.errorMessage || 'Unable to open your photos.');
        return;
      }
      addPhotos(response?.assets);
    },
    [addPhotos],
  );

  const handleTakePhoto = useCallback(async () => {
    const status = await requestCamera();
    if (status === 'denied' || status === 'blocked') {
      Alert.alert(
        'Camera permission needed',
        'Allow camera access to take a photo of the document. You can change this in Settings.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openPhoneSettings() },
        ],
      );
      return;
    }
    launchCamera(
      { mediaType: 'photo', quality: 0.85, maxWidth: 2000, maxHeight: 2000, saveToPhotos: false },
      handlePhotoResult,
    );
  }, [handlePhotoResult]);

  const handleChoosePhotos = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.85,
        selectionLimit: Math.max(1, MAX_PHOTOS - photos.length),
        maxWidth: 2000,
        maxHeight: 2000,
      },
      handlePhotoResult,
    );
  }, [handlePhotoResult, photos.length]);

  const handleChange = useCallback((key, value) => {
    setForm(current => ({ ...current, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setError('');
    if (toIsoDate(form.dateIssued) === null || toIsoDate(form.nextDueDate) === null) {
      setError('Enter dates as DD/MM/YYYY, for example 05/03/2026.');
      return;
    }
    try {
      const { failedPhotos } = await createRecord.mutateAsync({ form, photos });
      setForm(EMPTY_FORM);
      setPhotos([]);
      setView('add');
      setToast(
        failedPhotos > 0
          ? `Record saved. ${failedPhotos} photo${
              failedPhotos > 1 ? 's' : ''
            } could not be uploaded.`
          : 'Health record saved',
      );
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || 'Could not save this record. Please try again.',
      );
    }
  }, [form, photos, createRecord]);

  const actions = [
    {
      id: 'download',
      label: 'Download summary',
      icon: 'download-outline',
      colors: ['#7C3AED', '#5B21B6'],
    },
    {
      id: 'share',
      label: 'Share for 24 hours',
      icon: 'share-social-outline',
      colors: ['#6D28D9', '#4C1D95'],
    },
    {
      id: 'photos',
      label: 'Add photos',
      icon: 'cloud-upload-outline',
      colors: ['#EC4899', '#7C3AED'],
    },
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

        {view === 'book' ? (
          <>
            <View style={styles.actions}>
              {actions.map((action, index) => (
                <ActionTile
                  key={action.id}
                  testID={`health-${action.id}`}
                  index={index}
                  label={action.label}
                  icon={action.icon}
                  colors={action.colors}
                  depthColor={action.depth}
                  float={action.id === 'photos'}
                  onPress={() => (action.id === 'photos' ? openAdd() : comingSoon(action.label))}
                />
              ))}
            </View>

            <Enter index={1}>
              <HealthBook records={records} isDarkMode={isDarkMode} onAddPhotos={openAdd} />
            </Enter>
          </>
        ) : (
          <>
            <Enter index={1}>
              <View style={[styles.note, isDarkMode && styles.cardDark]}>
                <Ionicons name="lock-closed-outline" size={ms(16)} color="#7C3AED" />
                <Text style={[styles.noteText, isDarkMode && styles.mutedDark]}>
                  Only you can see these. Health records are never shown on your pet's public
                  profile.
                </Text>
              </View>
            </Enter>

            <Enter index={2}>
              <View style={[styles.card, styles.recordsCard, isDarkMode && styles.cardDark]}>
                <Text
                  style={[styles.cardTitle, styles.recordsTitle, isDarkMode && styles.textWhite]}>
                  Health Records
                </Text>
                <Text style={[styles.recordsSub, isDarkMode && styles.mutedDark]}>
                  Keep health and travel documents together for easy access.
                </Text>
                <View style={styles.recordsButtons}>
                  <PrimaryButton
                    testID="health-open-book"
                    label="Open health records book"
                    onPress={openBook}
                  />
                  <OutlineButton
                    testID="health-add-record"
                    label="Add record"
                    onPress={openForm}
                    isDarkMode={isDarkMode}
                  />
                </View>

                {records.length === 0 ? (
                  <Text
                    style={[styles.emptyText, styles.recordsEmpty, isDarkMode && styles.mutedDark]}>
                    No health records yet. Add a record to keep important documents private and easy
                    to find.
                  </Text>
                ) : (
                  <View style={styles.recordList}>
                    {records.map((record, index) => (
                      <View
                        key={record.id ?? index}
                        style={[styles.recordRow, isDarkMode && styles.recordRowDark]}>
                        <View
                          style={[
                            styles.emptyIcon,
                            styles.recordIcon,
                            isDarkMode && styles.emptyIconDark,
                          ]}>
                          <Ionicons name="document-text-outline" size={ms(18)} color="#7C3AED" />
                        </View>
                        <View style={styles.recordText}>
                          <Text
                            style={[styles.recordName, isDarkMode && styles.textWhite]}
                            numberOfLines={1}>
                            {record.recordName ||
                              record.name ||
                              documentTypeLabel(record.documentType)}
                          </Text>
                          <Text
                            style={[styles.recordMeta, isDarkMode && styles.mutedDark]}
                            numberOfLines={1}>
                            {[
                              documentTypeLabel(record.documentType),
                              record.dateIssued && String(record.dateIssued).slice(0, 10),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Enter>

            <HealthPhotoCard
              petName={name}
              photos={photos}
              onTakePhoto={handleTakePhoto}
              onChoosePhotos={handleChoosePhotos}
              onRemovePhoto={index => setPhotos(current => current.filter((_, i) => i !== index))}
              onEnterByHand={openForm}
              isDarkMode={isDarkMode}
            />
            {view === 'form' ? (
              <HealthRecordForm
                form={form}
                onChange={handleChange}
                onSave={handleSave}
                saving={createRecord.isPending}
                error={error}
                isDarkMode={isDarkMode}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <SuccessToast message={toast} onHide={() => setToast('')} />
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
  actions: {
    flexDirection: 'row',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    gap: s(8),
  },
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
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginHorizontal: s(16),
    marginBottom: vs(14),
    padding: s(14),
    borderRadius: s(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
  },
  noteText: {
    flex: 1,
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#4B5563',
    fontFamily: theme.typography.fontFamily.medium,
  },
  recordsCard: { padding: s(18) },
  recordsTitle: {
    padding: 0,
    fontSize: s(18),
    fontFamily: theme.typography.fontFamily.extraBold,
    color: '#1E1B4B',
  },
  recordsSub: {
    marginTop: vs(4),
    fontSize: s(12.5),
    lineHeight: s(18),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
  recordsButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10), marginTop: vs(14) },
  recordsEmpty: { textAlign: 'left', marginTop: vs(16) },
  recordList: { marginTop: vs(14), gap: s(10) },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(10),
    borderRadius: s(16),
    backgroundColor: '#F8F5FF',
  },
  recordRowDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  recordIcon: { width: s(40), height: s(40), borderRadius: s(14) },
  recordText: { flex: 1, marginLeft: s(12) },
  recordName: { fontSize: s(14), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  recordMeta: {
    marginTop: 2,
    fontSize: s(11.5),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
