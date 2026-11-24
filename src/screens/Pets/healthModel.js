// Pure helpers for the health records screens: reading what the API sends (field names vary a
// little) and building what it expects. No React in here, so it is easy to test.
import { toIsoDate } from '../../hooks/usePetHealth';

const day = value => (value ? String(value).slice(0, 10) : '');

// DD/MM/YYYY for an input box, from an ISO date the API sent
export const isoToInput = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Nov 23, 2026" from an ISO date, like the website; empty when there is no date
export const prettyDate = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  if (!match) {
    return '';
  }
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}, ${match[1]}` : '';
};

// ── Files of a record ────────────────────────────────────────────────────────────────────────────

export const recordFiles = record => {
  const files = record?.files || record?.pages || record?.documents || [];
  return Array.isArray(files) ? files : [];
};

export const fileIdOf = file => file?.id ?? file?.fileId ?? file?.file_id;

export const fileNameOf = (file, index = 0) =>
  file?.fileName || file?.originalName || file?.filename || file?.name || `Page ${index + 1}`;

export const fileTypeOf = file => file?.mimeType || file?.contentType || file?.mime || file?.type || '';

// "Pending extraction" until it is read; "Extracted · needs owner review" until the owner approves
export const fileStatusOf = file => {
  const raw = String(file?.extractionStatus || file?.status || file?.extraction?.status || '').toLowerCase();
  const approved = !!(file?.approved || file?.ownerConfirmed || raw === 'approved' || raw === 'confirmed');
  const extracted = approved || ['extracted', 'completed', 'done', 'review', 'needs_review', 'ready'].includes(raw);
  const reading = ['processing', 'running', 'queued', 'in_progress'].includes(raw);
  const failed = ['failed', 'error'].includes(raw);
  let label = 'Pending extraction';
  if (approved) {
    label = 'Approved';
  } else if (extracted) {
    label = 'Extracted · needs owner review';
  } else if (reading) {
    label = 'Reading…';
  } else if (failed) {
    label = 'Could not be read';
  }
  return { label, approved, extracted, reading, failed, pending: !extracted && !reading && !failed };
};

// The suggestions a read file came back with, as label/value rows for the owner to review
export const fileSuggestions = file => {
  const source =
    file?.suggestions || file?.extraction?.suggestions || file?.extractedData || file?.extraction?.data || null;
  if (!source || typeof source !== 'object') {
    return [];
  }
  const labels = {
    vaccineName: 'Vaccine',
    dateAdministered: 'Given',
    dueDate: 'Next due',
    batch: 'Batch / lot',
    clinic: 'Clinic',
    vet: 'Vet',
  };
  const rows = Array.isArray(source) ? source : [source];
  return rows.flatMap(row =>
    Object.keys(labels)
      .filter(key => row?.[key])
      .map(key => ({
        key,
        label: labels[key],
        value: key.toLowerCase().includes('date') ? day(row[key]) : String(row[key]),
      })),
  );
};

// ── Edit record details ──────────────────────────────────────────────────────────────────────────

// A record -> the form fields (dates as DD/MM/YYYY)
export const recordToForm = record => ({
  documentType: record?.documentType || 'vaccination',
  recordName: record?.recordName || record?.name || '',
  dateIssued: isoToInput(record?.dateIssued),
  nextDueDate: isoToInput(record?.nextDueDate),
  vetName: record?.vetName || '',
  clinicName: record?.clinicName || '',
  documentNumber: record?.documentNumber || '',
  notes: record?.notes || '',
});

// ── Confirmed vaccine history ────────────────────────────────────────────────────────────────────

const historyList = data => {
  const list = Array.isArray(data)
    ? data
    : data?.rows || data?.history || data?.items || data?.vaccinations || data?.entries;
  return Array.isArray(list) ? list : [];
};

// Normalised rows, whatever the server calls the fields
export const historyRows = data =>
  historyList(data).map((row, index) => ({
    id: row?.id ?? row?.entryId ?? row?.vaccinationId ?? `row-${index}`,
    // The entry the server knows it by (used to save a due date or link a vet) and its record
    entryId: row?.entryId ?? row?.id ?? row?.vaccinationId ?? null,
    recordId: row?.recordId ?? row?.healthRecordId ?? row?.record?.id ?? null,
    vet: row?.vetName || row?.clinicName || row?.clinic || row?.vet || '',
    family: row?.vaccineFamily || row?.family || row?.group || 'Other',
    given: day(row?.dateAdministered || row?.givenDate || row?.date),
    asWritten: row?.vaccineName || row?.asWritten || row?.name || '',
    due: day(row?.dueDate || row?.nextDueDate || row?.confirmedDueDate),
    confirmed: !!(row?.ownerConfirmed ?? row?.confirmed ?? row?.dueDateConfirmed),
    page: row?.pageNumber ?? row?.page ?? row?.bookletPage ?? null,
    needsReview: !!(row?.needsReview || row?.unconfirmed),
  }));

// Rows grouped by vaccine family in the order each family first appears, each with the latest due date
export const groupHistory = rows => {
  const groups = [];
  rows.forEach(row => {
    let group = groups.find(item => item.family === row.family);
    if (!group) {
      group = { family: row.family, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  });
  return groups.map(group => ({
    ...group,
    currentDue: group.rows.map(row => row.due).filter(Boolean).sort().pop() || '',
  }));
};

// ── Add vaccination ──────────────────────────────────────────────────────────────────────────────

export const EMPTY_VACCINATION = {
  vaccineName: '',
  dateAdministered: '',
  dueDate: '',
  batch: '',
  clinic: '',
  vet: '',
};

// { payload } when it can be sent, { error } with a plain message when it cannot
export const buildVaccinationPayload = form => {
  const name = String(form.vaccineName || '').trim();
  if (!name) {
    return { error: 'Enter the vaccine name.' };
  }
  const given = toIsoDate(form.dateAdministered);
  const due = toIsoDate(form.dueDate);
  if (given === null || due === null) {
    return { error: 'Enter dates as DD/MM/YYYY, for example 05/03/2026.' };
  }
  if (!given && !due) {
    return { error: 'Enter at least one date: the date given or the next due date.' };
  }
  const payload = { vaccineName: name };
  if (given) {
    payload.dateAdministered = given;
  }
  if (due) {
    payload.dueDate = due;
  }
  ['batch', 'clinic', 'vet'].forEach(key => {
    if (form[key] && String(form[key]).trim()) {
      payload[key] = String(form[key]).trim();
    }
  });
  return { payload };
};

// A search result for a clinic or vet, whatever the server calls the fields
export const vetOptions = list =>
  (Array.isArray(list) ? list : [])
    .map((item, index) => ({
      key: String(item?.listingId ?? item?.id ?? index),
      listingId: item?.listingId ?? item?.id ?? null,
      name: item?.name || item?.title || item?.clinicName || '',
      place: [item?.city, item?.address || item?.area].filter(Boolean).join(', '),
    }))
    .filter(option => option.listingId !== null && option.name);

