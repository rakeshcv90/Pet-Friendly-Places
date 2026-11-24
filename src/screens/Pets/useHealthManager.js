import { useCallback, useMemo, useState } from 'react';
import { launchImageLibrary } from 'react-native-image-picker';

import {
  useHealthHistory,
  useUpdateHealthRecord,
  useArchiveHealthRecord,
  useRestoreHealthRecord,
  useArchivedHealthRecords,
  useAddVaccination,
  useConfirmDueDate,
  useFindVets,
  useConfirmVet,
  useExtractFile,
  useExtractAllPages,
  useOrganizePages,
  useApproveExtraction,
  useReplaceHealthFile,
  useAddHealthFiles,
  useCreateHealthRecord,
  useDeleteHealthRecordFile,
  toIsoDate,
} from '../../hooks/usePetHealth';
import {
  EMPTY_VACCINATION,
  buildVaccinationPayload,
  fileIdOf,
  fileNameOf,
  groupHistory,
  historyRows,
  recordFiles,
  recordToForm,
  vetOptions,
} from './healthModel';

const MAX_PHOTOS = 10;

const messageOf = error =>
  error?.response?.data?.error || error?.message || 'Please try again.';

// Everything the website's health section can do for the selected record: the vaccine history, adding
// a vaccination, files (replace, remove, read, approve), editing, archiving and restoring. The
// screen only lays it out.
export const useHealthManager = ({ pet, records, setToast, setView }) => {
  const petId = pet?.id;

  const history = useHealthHistory(petId);
  const createRecord = useCreateHealthRecord(petId);
  const updateRecord = useUpdateHealthRecord(petId);
  const archiveRecord = useArchiveHealthRecord(petId);
  const restoreRecord = useRestoreHealthRecord(petId);
  const addVaccination = useAddVaccination(petId);
  const confirmDue = useConfirmDueDate(petId);
  const findVet = useFindVets(petId);
  const confirmVet = useConfirmVet(petId);
  const extractFile = useExtractFile(petId);
  const extractAll = useExtractAllPages(petId);
  const organize = useOrganizePages(petId);
  const approve = useApproveExtraction(petId);
  const replaceFile = useReplaceHealthFile(petId);
  const addFiles = useAddHealthFiles(petId);
  const deleteFile = useDeleteHealthRecordFile(petId);

  const [selectedId, setSelectedId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const archived = useArchivedHealthRecords(petId, showArchived);
  const [vaccination, setVaccination] = useState(EMPTY_VACCINATION);
  const [vaccinationError, setVaccinationError] = useState('');
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  // One popup for everything here: a question (confirm) or a message (error)
  const [dialog, setDialog] = useState(null);

  // The record the Files card is about: the one tapped, else the first
  const selected = useMemo(
    () => records.find(record => record?.id === selectedId) || records[0] || null,
    [records, selectedId],
  );

  const busy =
    updateRecord.isPending ||
    archiveRecord.isPending ||
    restoreRecord.isPending ||
    extractFile.isPending ||
    extractAll.isPending ||
    organize.isPending ||
    approve.isPending ||
    replaceFile.isPending ||
    addFiles.isPending ||
    deleteFile.isPending;

  const groups = useMemo(() => groupHistory(historyRows(history.data)), [history.data]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const showError = useCallback(
    (title, error) => setDialog({ kind: 'error', title, subtitle: messageOf(error) }),
    [],
  );
  const ask = useCallback(options => setDialog({ kind: 'confirm', ...options }), []);

  // ── Add vaccination ──
  const changeVaccination = useCallback((key, value) => {
    setVaccination(current => ({ ...current, [key]: value }));
  }, []);

  const saveVaccination = useCallback(async () => {
    setVaccinationError('');
    const { payload, error } = buildVaccinationPayload(vaccination);
    if (error) {
      setVaccinationError(error);
      return;
    }
    try {
      // A vaccination lives on a record: use the selected one, or start a vaccination record
      let recordId = selected?.id;
      if (!recordId) {
        const created = await createRecord.mutateAsync({
          form: { documentType: 'vaccination' },
          photos: [],
        });
        const record = created?.record;
        recordId = record?.id ?? record?.record?.id;
      }
      if (!recordId) {
        throw new Error('Could not start a record for this vaccination.');
      }
      await addVaccination.mutateAsync({ recordId, payload });
      setVaccination(EMPTY_VACCINATION);
      setToast('Vaccination saved');
    } catch (e) {
      setVaccinationError(messageOf(e));
    }
  }, [vaccination, selected, createRecord, addVaccination, setToast]);

  const confirmDueDate = useCallback(
    async (row, dueDate) => {
      try {
        await confirmDue.mutateAsync({ entryId: row.entryId, dueDate });
        setToast('Due date updated');
      } catch (e) {
        showError('Could not update the date', e);
      }
    },
    [confirmDue, setToast, showError],
  );

  // The "Find" box: search clinics and vets, then link the one the owner picks to this entry
  const findVets = useCallback(
    async query => {
      try {
        return vetOptions(await findVet.mutateAsync({ q: query }));
      } catch (e) {
        showError('Could not search', e);
        return [];
      }
    },
    [findVet, showError],
  );

  const pickVet = useCallback(
    async (row, option) => {
      // The entry's own record, else the one on screen
      const recordId = row.recordId ?? selected?.id;
      if (!recordId || row.entryId === null) {
        showError('Could not link the vet', { message: 'This entry has no record to link to.' });
        return false;
      }
      try {
        await confirmVet.mutateAsync({
          recordId,
          entryId: row.entryId,
          listingId: option.listingId,
        });
        setToast(`Linked to ${option.name}`);
        return true;
      } catch (e) {
        showError('Could not link the vet', e);
        return false;
      }
    },
    [confirmVet, selected, setToast, showError],
  );

  // ── Files of the selected record ──
  const pickPhotos = useCallback(
    limit =>
      new Promise(resolve => {
        launchImageLibrary(
          { mediaType: 'photo', quality: 0.85, selectionLimit: limit, maxWidth: 2000, maxHeight: 2000 },
          response => {
            if (response?.didCancel) {
              resolve([]);
            } else if (response?.errorCode) {
              showError('Photo', { message: response.errorMessage || 'Unable to open your photos.' });
              resolve([]);
            } else {
              resolve((response?.assets || []).filter(asset => asset?.uri));
            }
          },
        );
      }),
    [showError],
  );

  const chooseFiles = useCallback(async () => {
    if (!selected?.id) {
      return;
    }
    const room = Math.max(1, MAX_PHOTOS - recordFiles(selected).length);
    const photos = await pickPhotos(room);
    if (photos.length === 0) {
      return;
    }
    try {
      const { failed } = await addFiles.mutateAsync({ recordId: selected.id, photos });
      const saved = photos.length - failed;
      setToast(
        failed > 0
          ? `${saved} added, ${failed} could not be uploaded.`
          : `${saved} ${saved === 1 ? 'page' : 'pages'} added`,
      );
    } catch (e) {
      showError('Could not add pages', e);
    }
  }, [selected, pickPhotos, addFiles, setToast, showError]);

  const replacePage = useCallback(
    async file => {
      const [photo] = await pickPhotos(1);
      if (!photo || !selected?.id) {
        return;
      }
      try {
        await replaceFile.mutateAsync({ recordId: selected.id, fileId: fileIdOf(file), photo });
        setToast('Page replaced');
      } catch (e) {
        showError('Could not replace the page', e);
      }
    },
    [pickPhotos, selected, replaceFile, setToast, showError],
  );

  const removeAllPages = useCallback(() => {
    const files = recordFiles(selected);
    if (files.length === 0) {
      return;
    }
    ask({
      badge: 'REMOVE PAGES',
      title: `Remove all ${files.length} ${files.length === 1 ? 'page' : 'pages'}?`,
      subtitle: 'Every photo is deleted from this record. This can\'t be undone.',
      confirmText: 'Remove all',
      cancelText: 'Keep them',
      onConfirm: async () => {
        // There is no single bulk delete: each file is removed on its own
        let failed = 0;
        for (const file of files) {
          try {
            await deleteFile.mutateAsync({ recordId: selected.id, fileId: fileIdOf(file) });
          } catch (e) {
            failed += 1;
          }
        }
        if (failed > 0) {
          showError('Could not remove every page', {
            message: `${failed} of ${files.length} pages could not be removed.`,
          });
        } else {
          setToast('All pages removed');
        }
      },
    });
  }, [selected, ask, deleteFile, setToast, showError]);

  // ── Reading pages ──
  const extractOne = useCallback(
    async file => {
      try {
        await extractFile.mutateAsync({ recordId: selected.id, fileId: fileIdOf(file) });
        setToast('Reading started. Review the suggestions when they appear.');
      } catch (e) {
        showError('Could not read this page', e);
      }
    },
    [selected, extractFile, setToast, showError],
  );

  const extractEverything = useCallback(async () => {
    try {
      await extractAll.mutateAsync({ recordId: selected.id });
      await organize.mutateAsync({ recordId: selected.id });
      setToast('Pages read and arranged. Review the suggestions before saving.');
    } catch (e) {
      showError('Could not read and arrange the pages', e);
    }
  }, [selected, extractAll, organize, setToast, showError]);

  // The owner has looked at the suggestions: confirm them
  const approveDetails = useCallback(
    async (file, suggestions) => {
      const details = {};
      suggestions.forEach(row => {
        details[row.key] = row.value;
      });
      try {
        await approve.mutateAsync({ recordId: selected.id, fileId: fileIdOf(file), details });
        setToast(`Details approved for ${fileNameOf(file)}`);
      } catch (e) {
        showError('Could not approve the details', e);
      }
    },
    [selected, approve, setToast, showError],
  );

  // ── Edit / archive / restore ──
  const startEdit = useCallback(() => {
    if (!selected) {
      return;
    }
    setEditForm(recordToForm(selected));
    setEditError('');
    setView('edit');
  }, [selected, setView]);

  const changeEdit = useCallback((key, value) => {
    setEditForm(current => ({ ...current, [key]: value }));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditForm(null);
    setView('add');
  }, [setView]);

  const saveEdit = useCallback(async () => {
    setEditError('');
    if (toIsoDate(editForm.dateIssued) === null || toIsoDate(editForm.nextDueDate) === null) {
      setEditError('Enter dates as DD/MM/YYYY, for example 05/03/2026.');
      return;
    }
    try {
      await updateRecord.mutateAsync({ recordId: selected.id, form: editForm });
      setEditForm(null);
      setView('add');
      setToast('Record details saved');
    } catch (e) {
      setEditError(messageOf(e));
    }
  }, [editForm, selected, updateRecord, setView, setToast]);

  const archive = useCallback(() => {
    if (!selected) {
      return;
    }
    ask({
      badge: 'ARCHIVE RECORD',
      title: 'Archive this record?',
      subtitle: 'The record and its pages are put away, not deleted. You can restore it later.',
      confirmText: 'Archive',
      cancelText: 'Keep it',
      onConfirm: async () => {
        try {
          await archiveRecord.mutateAsync({ recordId: selected.id });
          setSelectedId(null);
          setToast('Record archived');
        } catch (e) {
          showError('Could not archive the record', e);
        }
      },
    });
  }, [selected, ask, archiveRecord, setToast, showError]);

  const restore = useCallback(
    async record => {
      try {
        await restoreRecord.mutateAsync({ recordId: record.id });
        setToast('Record restored');
      } catch (e) {
        showError('Could not restore the record', e);
      }
    },
    [restoreRecord, setToast, showError],
  );

  return {
    selected,
    select: setSelectedId,
    busy,
    // vaccine history
    groups,
    historyBusy: confirmDue.isPending,
    confirmDueDate,
    findVets,
    pickVet,
    // add vaccination
    vaccination,
    vaccinationError,
    vaccinationSaving: addVaccination.isPending || createRecord.isPending,
    changeVaccination,
    saveVaccination,
    // files
    chooseFiles,
    replacePage,
    removeAllPages,
    extractOne,
    extractEverything,
    approveDetails,
    // edit / archive
    editForm,
    editError,
    editSaving: updateRecord.isPending,
    startEdit,
    changeEdit,
    cancelEdit,
    saveEdit,
    archive,
    restore,
    showArchived,
    toggleArchived: () => setShowArchived(current => !current),
    archivedRecords: archived.data || [],
    archivedLoading: archived.isLoading,
    // the popup
    dialog,
    closeDialog,
  };
};
