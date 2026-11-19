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
