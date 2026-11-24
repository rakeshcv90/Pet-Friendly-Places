import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Alert, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../theme';
import { useStore } from '../../store';
import { Enter } from '../Community/Motion';
import { PetHero, DEEP_PURPLE } from './components/PetHero';
import { petName } from './petUtils';
import { groupHealthRecords, healthRecordMeta } from './petProfileModel';
import { useHealthManager } from './useHealthManager';
import { fileIdOf } from './healthModel';
import {
  HealthHistoryCard,
  AddVaccinationCard,
  HealthFilesCard,
  ArchivedRecordsCard,
} from './components/HealthSections';
import { HealthBook } from './components/HealthBook';
import { ActionTile } from './components/ActionTile';
import {
  HealthPhotoCard,
  HealthReminderCard,
  HealthRecordForm,
  PrimaryButton,
  OutlineButton,
} from './components/HealthRecordAdd';
import { SuccessToast } from '../../components/common/SuccessToast';
import { ModernConfirmModal } from '../Profile/components/ModernConfirmModal';
import { requestCamera, openPhoneSettings } from '../../services/permissions/permissions';
import {
  useHealthRecords,
  useCreateHealthRecord,
  useDeleteHealthRecordFile,
  useHealthSettings,
  useUpdateHealthSettings,
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

export const PetHealthRecordsScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useStore(state => state.isDarkMode) || false;
  const pet = route?.params?.pet || {};
  const name = petName(pet);

  const { data: records = [] } = useHealthRecords(pet.id);
  const createRecord = useCreateHealthRecord(pet.id);
  const deleteFile = useDeleteHealthRecordFile(pet.id);
  const healthSettings = useHealthSettings(pet.id);
  const updateSettings = useUpdateHealthSettings(pet.id);
  const [reminderError, setReminderError] = useState('');

  
  const [view, setView] = useState(route?.params?.initialView === 'form' ? 'form' : 'book'); // 'book' | 'add' | 'form' | 'edit'
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [savingPhotos, setSavingPhotos] = useState(false);
  const manager = useHealthManager({ pet, records, setToast, setView });
  const toggleReminders = useCallback(async () => {
    try {
      await updateSettings.mutateAsync({
        notifyHealthRemindersEmail: !healthSettings.emailReminders,
      });
    } catch (e) {
      setReminderError(e?.response?.data?.error || e?.message || 'Please try again.');
    }
  }, [updateSettings, healthSettings.emailReminders]);

  // Asks first (in the app's own popup), then removes the one photo from its record
  const [pageToRemove, setPageToRemove] = useState(null);
  const [removeError, setRemoveError] = useState('');

  const handleRemovePage = useCallback(page => setPageToRemove(page), []);

  const confirmRemovePage = useCallback(async () => {
    const page = pageToRemove;
    if (!page) {
      return;
    }
    try {
      await deleteFile.mutateAsync({ recordId: page.recordId, fileId: page.fileId });
      setToast('Page removed');
    } catch (e) {
      setRemoveError(e?.response?.data?.error || e?.message || 'Please try again.');
    }
  }, [pageToRemove, deleteFile]);

  const openBook = useCallback(() => setView('book'), []);
  const openAdd = useCallback(() => setView(current => (current === 'book' ? 'add' : current)), []);
  const openForm = useCallback(() => setView('form'), []);

  const addPhotos = useCallback(assets => {
    const picked = (assets || []).filter(asset => asset?.uri);
    if (picked.length === 0) {
      return;
    }
    setPhotos(current => [...current, ...picked].slice(0, MAX_PHOTOS));
   
    setView(current => (current === 'book' ? 'add' : current));
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

  const handleSavePhotos = useCallback(async () => {
    if (photos.length === 0 || savingPhotos) {
      return;
    }
    setSavingPhotos(true);
    try {
      const { failedPhotos } = await createRecord.mutateAsync({
        form: { documentType: 'vaccination' },
        photos,
      });
      const saved = photos.length - failedPhotos;
      setPhotos([]);
      setView('book');
      setToast(
        failedPhotos > 0
          ? `${saved} photo${saved === 1 ? '' : 's'} saved, ${failedPhotos} could not be uploaded.`
          : `${saved} photo${saved === 1 ? '' : 's'} saved`,
      );
    } catch (e) {
      Alert.alert(
        'Could not save photos',
        e?.response?.data?.error || e?.message || 'Please try again.',
      );
    } finally {
      setSavingPhotos(false);
    }
  }, [photos, savingPhotos, createRecord]);

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
              <HealthBook
                records={records}
                petId={pet.id}
                isDarkMode={isDarkMode}
                onAddPhotos={openAdd}
                onRemovePage={handleRemovePage}
              />
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
              {manager.groups.length > 0 ? (
                <HealthHistoryCard
                  groups={manager.groups}
                  onConfirmDue={manager.confirmDueDate}
                  onFindVet={manager.findVets}
                  onPickVet={manager.pickVet}
                  busy={manager.historyBusy}
                  isDarkMode={isDarkMode}
                />
              ) : null}
              <AddVaccinationCard
                form={manager.vaccination}
                onChange={manager.changeVaccination}
                onSave={manager.saveVaccination}
                saving={manager.vaccinationSaving}
                error={manager.vaccinationError}
                isDarkMode={isDarkMode}
              />
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
                  <OutlineButton
                    testID="health-archived-toggle"
                    label={manager.showArchived ? 'Hide archived' : 'Archived records'}
                    onPress={manager.toggleArchived}
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
                    {groupHealthRecords(records).map(group => (
                      <View key={group.type} testID={`health-group-${group.type}`}>
                        <Text style={[styles.groupLabel, isDarkMode && styles.groupLabelDark]}>
                          {documentTypeLabel(group.type).toUpperCase()}
                        </Text>
                        <View style={styles.groupRows}>
                          {group.entries.map(({ record, index }) => (
                            <Pressable
                              key={record.id ?? index}
                              testID={`health-record-${index}`}
                              accessibilityRole="button"
                              accessibilityState={{ selected: manager.selected?.id === record.id }}
                              onPress={() => manager.select(record.id)}
                              style={[
                                styles.recordRow,
                                isDarkMode && styles.recordRowDark,
                                manager.selected?.id === record.id && styles.recordRowOn,
                              ]}>
                              <View
                                style={[
                                  styles.emptyIcon,
                                  styles.recordIcon,
                                  isDarkMode && styles.emptyIconDark,
                                ]}>
                                <Ionicons
                                  name="document-text-outline"
                                  size={ms(18)}
                                  color="#7C3AED"
                                />
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
                                  testID={`health-record-meta-${index}`}
                                  style={[styles.recordMeta, isDarkMode && styles.mutedDark]}>
                                  {healthRecordMeta(record)}
                                </Text>
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Enter>

            <Enter index={3}>
              <HealthFilesCard
                record={manager.selected}
                busy={manager.busy}
                onChooseFiles={manager.chooseFiles}
                onReplace={manager.replacePage}
                onRemove={file =>
                  handleRemovePage({ recordId: manager.selected.id, fileId: fileIdOf(file) })
                }
                onRemoveAll={manager.removeAllPages}
                onExtract={manager.extractOne}
                onExtractAll={manager.extractEverything}
                onApprove={manager.approveDetails}
                onEdit={manager.startEdit}
                onArchive={manager.archive}
                isDarkMode={isDarkMode}
              />
              {manager.showArchived ? (
                <ArchivedRecordsCard
                  records={manager.archivedRecords}
                  loading={manager.archivedLoading}
                  onRestore={manager.restore}
                  busy={manager.busy}
                  isDarkMode={isDarkMode}
                />
              ) : null}
            </Enter>

            <Enter index={3}>
              <HealthReminderCard
                checked={healthSettings.emailReminders}
                onToggle={toggleReminders}
                disabled={healthSettings.isLoading || updateSettings.isPending}
                isDarkMode={isDarkMode}
              />
            </Enter>

            <HealthPhotoCard
              petName={name}
              photos={photos}
              onTakePhoto={handleTakePhoto}
              onChoosePhotos={handleChoosePhotos}
              onRemovePhoto={index => setPhotos(current => current.filter((_, i) => i !== index))}
              onEnterByHand={openForm}
              onSavePhotos={handleSavePhotos}
              savingPhotos={savingPhotos}
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
            {view === 'edit' && manager.editForm ? (
              <>
                <HealthRecordForm
                  title="Edit record details"
                  saveLabel="Save changes"
                  form={manager.editForm}
                  onChange={manager.changeEdit}
                  onSave={manager.saveEdit}
                  saving={manager.editSaving}
                  error={manager.editError}
                  isDarkMode={isDarkMode}
                />
                <View style={styles.cancelEdit}>
                  <OutlineButton
                    testID="health-edit-cancel"
                    label="Cancel"
                    onPress={manager.cancelEdit}
                    isDarkMode={isDarkMode}
                  />
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <ModernConfirmModal
        visible={!!manager.dialog}
        type={manager.dialog?.kind === 'error' ? 'error' : 'danger'}
        singleButton={manager.dialog?.kind === 'error'}
        badge={manager.dialog?.kind === 'error' ? 'SOMETHING WENT WRONG' : manager.dialog?.badge}
        title={manager.dialog?.title}
        subtitle={manager.dialog?.subtitle}
        confirmText={manager.dialog?.kind === 'error' ? 'OK' : manager.dialog?.confirmText}
        cancelText={manager.dialog?.cancelText}
        isDarkMode={isDarkMode}
        onClose={manager.closeDialog}
        onConfirm={manager.dialog?.onConfirm}
      />

      <ModernConfirmModal
        visible={!!pageToRemove}
        type="danger"
        badge="REMOVE PAGE"
        title="Remove this page?"
        subtitle="The photo will be deleted from this health record. This can't be undone."
        confirmText="Remove"
        cancelText="Keep it"
        isDarkMode={isDarkMode}
        onClose={() => setPageToRemove(null)}
        onConfirm={confirmRemovePage}
      />
      <ModernConfirmModal
        visible={!!removeError}
        type="error"
        singleButton
        badge="SOMETHING WENT WRONG"
        title="Could not remove page"
        subtitle={removeError}
        confirmText="OK"
        isDarkMode={isDarkMode}
        onClose={() => setRemoveError('')}
      />

      <ModernConfirmModal
        visible={!!reminderError}
        type="error"
        singleButton
        badge="SOMETHING WENT WRONG"
        title="Could not update reminders"
        subtitle={reminderError}
        confirmText="OK"
        isDarkMode={isDarkMode}
        onClose={() => setReminderError('')}
      />

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
  recordList: { marginTop: vs(14), gap: vs(14) },
  groupLabel: {
    marginBottom: vs(8),
    fontSize: s(12),
    letterSpacing: 0.8,
    color: '#7B2CFF',
    fontFamily: theme.typography.fontFamily.extraBold,
  },
  groupLabelDark: { color: '#C4B5FD' },
  groupRows: { gap: s(10) },
  cancelEdit: { alignItems: 'center', marginTop: vs(10), marginBottom: vs(10) },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(10),
    borderRadius: s(16),
    backgroundColor: '#F8F5FF',
  },
  recordRowDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  recordRowOn: { borderWidth: 1.5, borderColor: '#A78BFA' },
  recordIcon: { width: s(40), height: s(40), borderRadius: s(14) },
  recordText: { flex: 1, marginLeft: s(12) },
  recordName: { fontSize: s(14), color: '#1E1B4B', fontFamily: theme.typography.fontFamily.bold },
  recordMeta: {
    marginTop: 2,
    fontSize: s(11.5),
    lineHeight: s(16),
    color: '#6B5C85',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
