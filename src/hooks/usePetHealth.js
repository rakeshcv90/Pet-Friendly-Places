import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/apiClient';
import { API_ENDPOINTS, API_BASE_URL } from '../services/api/apiList';
import { useStore } from '../store';
import { getItem, STORAGE_KEYS } from '../services/storage/storage';

// documentType values the API accepts when a record is created
export const HEALTH_DOCUMENT_TYPES = [
  { id: 'vaccination', label: 'Vaccination' },
  { id: 'sterilization', label: 'Sterilization' },
  { id: 'health_certificate', label: 'Health certificate' },
  { id: 'deworming', label: 'Deworming' },
  { id: 'travel_permit', label: 'Travel permit' },
  { id: 'microchip', label: 'Microchip' },
  { id: 'medical_history', label: 'Medical history' },
  { id: 'other', label: 'Other' },
];

export const documentTypeLabel = id =>
  HEALTH_DOCUMENT_TYPES.find(type => type.id === id)?.label ||
  String(id || 'Record').replace(/_/g, ' ');

// Keeps typing in DD/MM/YYYY shape: digits only, slashes added as you go
export const formatDateInput = text => {
  const digits = String(text || '').replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
};

// DD/MM/YYYY -> YYYY-MM-DD, or '' when it is empty. Returns null for a date that does not exist.
export const toIsoDate = text => {
  const value = String(text || '').trim();
  if (!value) {
    return '';
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) {
    return null;
  }
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  const real =
    date.getUTCFullYear() === Number(yyyy) &&
    date.getUTCMonth() === Number(mm) - 1 &&
    date.getUTCDate() === Number(dd);
  return real ? `${yyyy}-${mm}-${dd}` : null;
};

// Form fields -> the JSON body for POST /pets/{id}/health-records. Empty optional fields are left out.
export const buildHealthRecordPayload = form => {
  const payload = { documentType: form.documentType || 'vaccination' };
  const text = {
    recordName: form.recordName,
    vetName: form.vetName,
    clinicName: form.clinicName,
    documentNumber: form.documentNumber,
    notes: form.notes,
  };
  Object.entries(text).forEach(([key, value]) => {
    if (value && String(value).trim()) {
      payload[key] = String(value).trim();
    }
  });
  const issued = toIsoDate(form.dateIssued);
  const due = toIsoDate(form.nextDueDate);
  if (issued) {
    payload.dateIssued = issued;
  }
  if (due) {
    payload.nextDueDate = due;
  }
  return payload;
};

const readList = data => {
  const list = Array.isArray(data) ? data : data?.records || data?.items || data?.healthRecords;
  return Array.isArray(list) ? list : [];
};

// A pet's health records
export const useHealthRecords = (petId, options = {}) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: ['pet', 'healthRecords', petId],
    enabled: !!petId && isAuthenticated,
    queryFn: async () => readList(await api.get(API_ENDPOINTS.PET_HEALTH_RECORDS(petId))),
    staleTime: 1000 * 30,
    ...options,
  });
};

// Sent with fetch and no manual Content-Type, so the multipart boundary is added automatically
export const uploadHealthRecordPhoto = async (petId, recordId, photo) => {
  try {
    const form = new FormData();
    form.append('file', {
      uri: photo.uri,
      name: photo.fileName ?? 'page.jpg',
      type: photo.type ?? 'image/jpeg',
    });
    const token = getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.PET_HEALTH_RECORD_FILES(petId, recordId)}`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      },
    );
    return response.ok;
  } catch (e) {
    return false;
  }
};

// Creates the record, then attaches each photo. Resolves to { record, failedPhotos } so a photo that
// fails to upload never hides that the record itself was saved.
export const useCreateHealthRecord = petId => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ form, photos = [] }) => {
      const record = await api.post(
        API_ENDPOINTS.PET_HEALTH_RECORDS(petId),
        buildHealthRecordPayload(form),
      );
      const recordId = record?.id ?? record?.record?.id;
      let failedPhotos = 0;
      if (recordId) {
        for (const photo of photos) {
          const ok = await uploadHealthRecordPhoto(petId, recordId, photo);
          if (!ok) {
            failedPhotos += 1;
          }
        }
      } else {
        failedPhotos = photos.length;
      }
      return { record, failedPhotos };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pet', 'healthRecords', petId] }),
  });
};

// Removes one photo (page) from a record. The endpoint is the file's own address with DELETE.
export const useDeleteHealthRecordFile = petId => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, fileId }) =>
      api.delete(API_ENDPOINTS.PET_HEALTH_RECORD_FILE(petId, recordId, fileId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet', 'healthRecords', petId] });
      queryClient.invalidateQueries({ queryKey: ['pet', 'healthHistory', petId] });
    },
  });
};

const readReminderSetting = data =>
  data?.notifyHealthRemindersEmail ?? data?.settings?.notifyHealthRemindersEmail;

// Whether this pet's vaccination and health reminder emails are on. `emailReminders` is a plain
// true/false (false until the server has answered).
export const useHealthSettings = petId => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const query = useQuery({
    queryKey: ['pet', 'healthSettings', petId],
    enabled: !!petId && isAuthenticated,
    queryFn: async () => ({
      notifyHealthRemindersEmail: !!readReminderSetting(
        await api.get(API_ENDPOINTS.PET_HEALTH_SETTINGS(petId)),
      ),
    }),
    staleTime: 1000 * 30,
  });
  return { ...query, emailReminders: !!query.data?.notifyHealthRemindersEmail };
};

// Turns the email reminders on or off. The tick changes straight away and goes back if the
// server says no.
export const useUpdateHealthSettings = petId => {
  const queryClient = useQueryClient();
  const key = ['pet', 'healthSettings', petId];
  return useMutation({
    mutationFn: body => api.patch(API_ENDPOINTS.PET_HEALTH_SETTINGS(petId), body),
    onMutate: async body => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, { notifyHealthRemindersEmail: !!body.notifyHealthRemindersEmail });
      return { previous };
    },
    onError: (error, body, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

// ── Everything the website's health section can do ───────────────────────────────────────────────

const refreshHealth = (queryClient, petId) => {
  queryClient.invalidateQueries({ queryKey: ['pet', 'healthRecords', petId] });
  queryClient.invalidateQueries({ queryKey: ['pet', 'healthHistory', petId] });
  queryClient.invalidateQueries({ queryKey: ['pet', 'healthArchived', petId] });
};

// The confirmed vaccine history shown above the records
export const useHealthHistory = (petId, options = {}) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: ['pet', 'healthHistory', petId],
    enabled: !!petId && isAuthenticated,
    queryFn: () => api.get(API_ENDPOINTS.PET_HEALTH_HISTORY(petId)),
    staleTime: 1000 * 30,
    ...options,
  });
};

// Archived records, loaded only when the list is opened
export const useArchivedHealthRecords = (petId, enabled) => {
  const isAuthenticated = useStore(state => state.isAuthenticated);
  return useQuery({
    queryKey: ['pet', 'healthArchived', petId],
    enabled: !!petId && isAuthenticated && !!enabled,
    queryFn: async () => readList(await api.get(API_ENDPOINTS.PET_HEALTH_ARCHIVED(petId))),
  });
};

// Builds a mutation that calls the API and then refreshes the records and the history
const useHealthAction = (petId, run) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => refreshHealth(queryClient, petId),
  });
};

export const useUpdateHealthRecord = petId =>
  useHealthAction(petId, ({ recordId, form }) =>
    api.patch(API_ENDPOINTS.PET_HEALTH_RECORD(petId, recordId), buildHealthRecordPayload(form)),
  );

// DELETE archives the record: it can be restored later
export const useArchiveHealthRecord = petId =>
  useHealthAction(petId, ({ recordId }) => api.delete(API_ENDPOINTS.PET_HEALTH_RECORD(petId, recordId)));

export const useRestoreHealthRecord = petId =>
  useHealthAction(petId, ({ recordId }) => api.post(API_ENDPOINTS.PET_HEALTH_RESTORE(petId, recordId)));

export const useAddVaccination = petId =>
  useHealthAction(petId, ({ recordId, payload }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_VACCINATIONS(petId, recordId), payload),
  );

// Confirms the due date of a vaccine row in the history
export const useConfirmDueDate = petId =>
  useHealthAction(petId, ({ entryId, dueDate }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_HISTORY_DUE_DATE(petId), { entryId, dueDate }),
  );

// Searches clinics and vets by name for the "Find" box. Nothing is cached or refreshed: it only reads.
export const useFindVets = petId =>
  useMutation({
    mutationFn: async ({ q }) => {
      const data = await api.get(API_ENDPOINTS.PET_HEALTH_VET_SUGGESTIONS(petId), { params: { q } });
      const list = Array.isArray(data)
        ? data
        : data?.suggestions || data?.results || data?.items || data?.listings;
      return Array.isArray(list) ? list : [];
    },
  });

// Links the vet the owner picked to a vaccination entry
export const useConfirmVet = petId =>
  useHealthAction(petId, ({ recordId, entryId, listingId }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_VET_CONFIRM(petId, recordId, entryId), { listingId }),
  );

// Reads one file, or every page of a record. The answers come back as unconfirmed suggestions.
export const useExtractFile = petId =>
  useHealthAction(petId, ({ recordId, fileId }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_EXTRACT(petId, recordId, fileId)),
  );

export const useExtractAllPages = petId =>
  useHealthAction(petId, ({ recordId }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_EXTRACT_BULK(petId, recordId)),
  );

// Pages newest first, using the dates found in the document
export const useOrganizePages = petId =>
  useHealthAction(petId, ({ recordId }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_ORGANIZE(petId, recordId)),
  );

// The owner has reviewed a suggestion and confirms it
export const useApproveExtraction = petId =>
  useHealthAction(petId, ({ recordId, fileId, details }) =>
    api.post(API_ENDPOINTS.PET_HEALTH_EXTRACT_APPROVE(petId, recordId, fileId), details || {}),
  );

// Replaces a page: the new photo is uploaded first, and only then is the old one removed, so a
// failed upload never loses the page
export const useReplaceHealthFile = petId =>
  useHealthAction(petId, async ({ recordId, fileId, photo }) => {
    const ok = await uploadHealthRecordPhoto(petId, recordId, photo);
    if (!ok) {
      throw new Error('The new photo could not be uploaded.');
    }
    return api.delete(API_ENDPOINTS.PET_HEALTH_RECORD_FILE(petId, recordId, fileId));
  });

// Adds more photos to a record that already exists
export const useAddHealthFiles = petId =>
  useHealthAction(petId, async ({ recordId, photos }) => {
    let failed = 0;
    for (const photo of photos) {
      const ok = await uploadHealthRecordPhoto(petId, recordId, photo);
      if (!ok) {
        failed += 1;
      }
    }
    return { failed };
  });
