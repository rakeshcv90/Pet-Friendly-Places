import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { s, vs, ms } from 'react-native-size-matters';

import { theme } from '../../../theme';
import { BouncyPressable } from '../../../components/common/BouncyPressable';
import { documentTypeLabel, formatDateInput, toIsoDate } from '../../../hooks/usePetHealth';
import { PrimaryButton } from './HealthRecordAdd';
import {
  recordFiles,
  fileIdOf,
  fileNameOf,
  fileTypeOf,
  fileStatusOf,
  fileSuggestions,
  isoToInput,
  prettyDate,
} from '../healthModel';

const PURPLE = '#7B2CFF';
const font = theme.typography.fontFamily;

// A small pill button: purple outline, or red for anything that removes
export const SmallButton = ({ label, onPress, testID, danger, disabled, isDarkMode }) => (
  <BouncyPressable
    testID={testID}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }}
    activeScale={0.96}
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.small,
      danger && styles.smallDanger,
      isDarkMode && (danger ? styles.smallDangerDark : styles.smallDark),
      disabled && styles.disabled,
    ]}>
    <Text style={[styles.smallText, danger && styles.smallTextDanger]}>{label}</Text>
  </BouncyPressable>
);

const Card = ({ children, testID, isDarkMode, style }) => (
  <View testID={testID} style={[styles.card, isDarkMode && styles.cardDark, style]}>
    {children}
  </View>
);

const LabelledInput = ({ label, isDarkMode, ...props }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, isDarkMode && styles.textWhite]}>{label}</Text>
    <TextInput
      placeholderTextColor={isDarkMode ? '#64748B' : '#9CA3AF'}
      style={[styles.input, isDarkMode && styles.inputDark]}
      {...props}
    />
  </View>
);

// ── Confirmed vaccine history ────────────────────────────────────────────────────────────────────

// The "Find" box under Booklet page: search a clinic or vet by name, then tap the right one to link it
const VetFinder = ({ row, onFindVet, onPickVet, isDarkMode }) => {
  const [query, setQuery] = useState(row.vet || '');
  const [options, setOptions] = useState(null); // null: not searched yet
  const [searching, setSearching] = useState(false);

  const find = async () => {
    const text = query.trim();
    if (!text || searching) {
      return;
    }
    setSearching(true);
    setOptions(await onFindVet(text));
    setSearching(false);
  };

  const pick = async option => {
    if (await onPickVet(row, option)) {
      setOptions(null);
    }
  };

  return (
    <View style={styles.finder}>
      <View style={styles.dueEdit}>
        <TextInput
          testID={`history-vet-${row.id}`}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={find}
          returnKeyType="search"
          placeholder="Clinic or vet name"
          placeholderTextColor="#9CA3AF"
          style={[styles.input, styles.dueInput, isDarkMode && styles.inputDark]}
        />
        <BouncyPressable
          testID={`history-find-${row.id}`}
          accessibilityRole="button"
          accessibilityLabel="Find"
          accessibilityState={{ disabled: searching || !query.trim() }}
          disabled={searching || !query.trim()}
          activeScale={0.96}
          onPress={find}
          style={[styles.findBtn, (searching || !query.trim()) && styles.disabled]}>
          <Text style={styles.findText}>{searching ? '…' : 'Find'}</Text>
        </BouncyPressable>
      </View>
      {options !== null && options.length === 0 ? (
        <Text style={[styles.sub, isDarkMode && styles.mutedDark]} testID={`history-vet-none-${row.id}`}>
          No clinics or vets found for that name.
        </Text>
      ) : null}
      {options && options.length > 0
        ? options.map(option => (
            <BouncyPressable
              key={option.key}
              testID={`history-vet-option-${option.key}`}
              accessibilityRole="button"
              accessibilityLabel={`Link ${option.name}`}
              activeScale={0.98}
              onPress={() => pick(option)}
              style={[styles.option, isDarkMode && styles.optionDark]}>
              <Text style={[styles.optionName, isDarkMode && styles.textWhite]}>{option.name}</Text>
              {option.place ? (
                <Text style={[styles.historyKey, isDarkMode && styles.mutedDark]}>{option.place}</Text>
              ) : null}
            </BouncyPressable>
          ))
        : null}
    </View>
  );
};

// One row of the history. Its due date can be confirmed again with a new date.
const HistoryRow = ({ row, onConfirmDue, onFindVet, onPickVet, busy, isDarkMode }) => {
  const [due, setDue] = useState(isoToInput(row.due));
  const [error, setError] = useState('');

  const update = () => {
    const iso = toIsoDate(due);
    if (!iso) {
      setError('Enter the date as DD/MM/YYYY.');
      return;
    }
    setError('');
    onConfirmDue(row, iso);
  };

  return (
    <View style={[styles.historyRow, isDarkMode && styles.historyRowDark]} testID={`history-row-${row.id}`}>
      <View style={styles.historyLine}>
        <Text style={[styles.historyKey, isDarkMode && styles.mutedDark]}>Date</Text>
        <Text style={[styles.historyValueBold, isDarkMode && styles.textWhite]}>
          {prettyDate(row.given) || '—'}
        </Text>
      </View>
      <View style={styles.historyLine}>
        <Text style={[styles.historyKey, isDarkMode && styles.mutedDark]}>As written</Text>
        <Text style={[styles.historyValue, isDarkMode && styles.textWhite]}>{row.asWritten || '—'}</Text>
      </View>
      <View style={styles.historyLine}>
        <Text style={[styles.historyKey, isDarkMode && styles.mutedDark]}>Due date</Text>
        <View style={styles.historyDue}>
          <Text style={[styles.historyValue, isDarkMode && styles.textWhite]}>
            {prettyDate(row.due) || '—'}
          </Text>
          {row.confirmed ? <Text style={styles.confirmed}>Owner confirmed</Text> : null}
        </View>
      </View>
      <View style={styles.dueEdit}>
        <TextInput
          testID={`history-due-${row.id}`}
          value={due}
          onChangeText={text => setDue(formatDateInput(text))}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.input, styles.dueInput, isDarkMode && styles.inputDark]}
        />
        <SmallButton
          testID={`history-update-${row.id}`}
          label="Update date"
          onPress={update}
          disabled={busy}
          isDarkMode={isDarkMode}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.historyLine}>
        <Text style={[styles.historyKey, isDarkMode && styles.mutedDark]}>Booklet page</Text>
        <Text style={[styles.historyValue, isDarkMode && styles.textWhite]}>
          {row.page !== null && row.page !== undefined ? `Page ${row.page}` : '—'}
        </Text>
      </View>
      {onFindVet ? (
        <VetFinder row={row} onFindVet={onFindVet} onPickVet={onPickVet} isDarkMode={isDarkMode} />
      ) : null}
    </View>
  );
};

export const HealthHistoryCard = ({ groups, onConfirmDue, onFindVet, onPickVet, busy, isDarkMode }) => {
  const count = groups.reduce((total, group) => total + group.rows.length, 0);
  return (
    <Card testID="health-history" isDarkMode={isDarkMode}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, isDarkMode && styles.textWhite]}>Confirmed vaccine history</Text>
        <Text style={[styles.count, isDarkMode && styles.mutedDark]} testID="health-history-count">
          {`${count} confirmed ${count === 1 ? 'row' : 'rows'}`}
        </Text>
      </View>
      <Text style={[styles.sub, isDarkMode && styles.mutedDark]}>
        This view includes only rows you have confirmed. Names stay as written in the booklet, with a
        vaccine family added for grouping.
      </Text>

      {count === 0 ? (
        <Text style={[styles.sub, styles.emptyGap, isDarkMode && styles.mutedDark]} testID="health-history-empty">
          No confirmed vaccines yet. Add a vaccination below, or confirm what is read from a page.
        </Text>
      ) : (
        groups.map(group => (
          <View key={group.family} style={[styles.group, isDarkMode && styles.groupDark]} testID={`history-group-${group.family}`}>
            <View style={styles.groupHead}>
              <Text style={[styles.groupName, isDarkMode && styles.groupNameDark]}>{group.family}</Text>
              {group.currentDue ? (
                <Text style={[styles.groupDue, isDarkMode && styles.mutedDark]}>
                  {`Current due date: ${prettyDate(group.currentDue)}`}
                </Text>
              ) : null}
            </View>
            {group.rows.map(row => (
              <HistoryRow
                key={row.id}
                row={row}
                onConfirmDue={onConfirmDue}
                onFindVet={onFindVet}
                onPickVet={onPickVet}
                busy={busy}
                isDarkMode={isDarkMode}
              />
            ))}
          </View>
        ))
      )}
    </Card>
  );
};

// ── Add vaccination ──────────────────────────────────────────────────────────────────────────────

export const AddVaccinationCard = ({ form, onChange, onSave, saving, error, isDarkMode }) => (
  <Card testID="add-vaccination" isDarkMode={isDarkMode} style={styles.tinted}>
    <Text style={[styles.title, isDarkMode && styles.textWhite]}>Add vaccination</Text>
    <Text style={[styles.sub, isDarkMode && styles.mutedDark]}>
      Enter a vaccine and at least one date. Dates use DD/MM/YYYY.
    </Text>
    <LabelledInput
      testID="vaccine-name"
      label="Vaccine name"
      value={form.vaccineName}
      onChangeText={text => onChange('vaccineName', text)}
      isDarkMode={isDarkMode}
    />
    <LabelledInput
      testID="vaccine-given"
      label="Given date"
      placeholder="DD/MM/YYYY"
      keyboardType="number-pad"
      maxLength={10}
      value={form.dateAdministered}
      onChangeText={text => onChange('dateAdministered', formatDateInput(text))}
      isDarkMode={isDarkMode}
    />
    <LabelledInput
      testID="vaccine-due"
      label="Next due"
      placeholder="DD/MM/YYYY"
      keyboardType="number-pad"
      maxLength={10}
      value={form.dueDate}
      onChangeText={text => onChange('dueDate', formatDateInput(text))}
      isDarkMode={isDarkMode}
    />
    <LabelledInput
      testID="vaccine-batch"
      label="Batch / lot"
      value={form.batch}
      onChangeText={text => onChange('batch', text)}
      isDarkMode={isDarkMode}
    />
    <LabelledInput
      testID="vaccine-clinic"
      label="Clinic"
      value={form.clinic}
      onChangeText={text => onChange('clinic', text)}
      isDarkMode={isDarkMode}
    />
    <LabelledInput
      testID="vaccine-vet"
      label="Vet"
      value={form.vet}
      onChangeText={text => onChange('vet', text)}
      isDarkMode={isDarkMode}
    />
    {error ? (
      <Text style={styles.error} testID="vaccine-error">
        {error}
      </Text>
    ) : null}
    <View style={styles.saveRow}>
      <PrimaryButton
        testID="vaccine-save"
        label={saving ? 'Saving…' : 'Save and add next'}
        onPress={onSave}
        disabled={saving}
      />
    </View>
  </Card>
);

// ── Files of the selected record ─────────────────────────────────────────────────────────────────

const FileRow = ({ file, index, busy, onReplace, onRemove, onExtract, onApprove, isDarkMode }) => {
  const status = fileStatusOf(file);
  const suggestions = fileSuggestions(file);
  const type = fileTypeOf(file);
  return (
    <View style={[styles.file, isDarkMode && styles.fileDark]} testID={`health-file-${index}`}>
      <Text style={styles.fileName} numberOfLines={2}>
        {fileNameOf(file, index)}
      </Text>
      <Text style={[styles.fileMeta, isDarkMode && styles.mutedDark]}>
        {[type, status.label].filter(Boolean).join(' · ')}
      </Text>
      <View style={styles.fileButtons}>
        <SmallButton
          testID={`health-file-replace-${index}`}
          label="Replace page"
          onPress={() => onReplace(file)}
          disabled={busy}
          isDarkMode={isDarkMode}
        />
        <SmallButton
          testID={`health-file-remove-${index}`}
          label="Remove page"
          danger
          onPress={() => onRemove(file)}
          disabled={busy}
          isDarkMode={isDarkMode}
        />
      </View>

      {status.pending || status.failed ? (
        <View style={[styles.fileFoot, isDarkMode && styles.fileFootDark]}>
          <Text style={[styles.fileNote, isDarkMode && styles.mutedDark]}>
            {status.failed
              ? 'This page could not be read. You can try again.'
              : 'Pending extraction. This file is stored privately and has not been sent for reading.'}
          </Text>
          <SmallButton
            testID={`health-file-extract-${index}`}
            label="Extract details"
            onPress={() => onExtract(file)}
            disabled={busy}
            isDarkMode={isDarkMode}
          />
        </View>
      ) : null}

      {status.reading ? (
        <View style={[styles.fileFoot, isDarkMode && styles.fileFootDark]}>
          <Text style={[styles.fileNote, isDarkMode && styles.mutedDark]}>
            Reading this page. This can take a moment.
          </Text>
        </View>
      ) : null}

      {status.extracted && !status.approved ? (
        <View style={[styles.fileFoot, isDarkMode && styles.fileFootDark]} testID={`health-file-review-${index}`}>
          <Text style={[styles.fileNote, styles.reviewTitle, isDarkMode && styles.textWhite]}>
            Suggested details. Not confirmed until you approve them.
          </Text>
          {suggestions.length === 0 ? (
            <Text style={[styles.fileNote, isDarkMode && styles.mutedDark]}>
              Nothing could be read from this page.
            </Text>
          ) : (
            suggestions.map(row => (
              <View key={row.key} style={styles.suggestion}>
                <Text style={[styles.historyKey, isDarkMode && styles.mutedDark]}>{row.label}</Text>
                <Text style={[styles.historyValue, isDarkMode && styles.textWhite]}>{row.value}</Text>
              </View>
            ))
          )}
          {suggestions.length > 0 ? (
            <SmallButton
              testID={`health-file-approve-${index}`}
              label="Approve details"
              onPress={() => onApprove(file, suggestions)}
              disabled={busy}
              isDarkMode={isDarkMode}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

export const HealthFilesCard = ({
  record,
  busy,
  onChooseFiles,
  onReplace,
  onRemove,
  onRemoveAll,
  onExtract,
  onExtractAll,
  onApprove,
  onEdit,
  onArchive,
  isDarkMode,
}) => {
  const files = record ? recordFiles(record) : [];
  return (
    <Card testID="health-files" isDarkMode={isDarkMode}>
      <Text style={[styles.title, isDarkMode && styles.textWhite]}>Files</Text>
      <Text style={[styles.sub, isDarkMode && styles.mutedDark]}>
        Add one or more clear pages. Files stay private, and extraction only starts when you choose
        “Extract details” or “Read and arrange all pages.” Review any suggestions before saving.
      </Text>

      {!record ? (
        <Text style={[styles.sub, styles.emptyGap, isDarkMode && styles.mutedDark]} testID="health-files-empty">
          Select a record above to see and manage its files.
        </Text>
      ) : (
        <>
          <BouncyPressable
            testID="health-files-choose"
            accessibilityRole="button"
            accessibilityLabel="Choose files"
            activeScale={0.98}
            disabled={busy}
            onPress={onChooseFiles}
            style={[styles.choose, isDarkMode && styles.chooseDark]}>
            <Ionicons name="images-outline" size={ms(16)} color={PURPLE} />
            <Text style={[styles.chooseText, isDarkMode && styles.mutedDark]}>Choose from gallery</Text>
          </BouncyPressable>

          {files.length > 0 ? (
            <>
              <Text style={[styles.sub, styles.emptyGap, isDarkMode && styles.mutedDark]}>
                Pages are arranged newest first using dates found in the document. Undated pages
                keep their upload order.
              </Text>
              <View style={styles.toolbar}>
                <SmallButton
                  testID="health-files-read-all"
                  label="Read and arrange all pages"
                  onPress={onExtractAll}
                  disabled={busy}
                  isDarkMode={isDarkMode}
                />
                <SmallButton
                  testID="health-files-remove-all"
                  label={`Remove all ${files.length} ${files.length === 1 ? 'page' : 'pages'}`}
                  danger
                  onPress={onRemoveAll}
                  disabled={busy}
                  isDarkMode={isDarkMode}
                />
              </View>
              {files.map((file, index) => (
                <FileRow
                  key={fileIdOf(file) ?? index}
                  file={file}
                  index={index}
                  busy={busy}
                  onReplace={onReplace}
                  onRemove={onRemove}
                  onExtract={onExtract}
                  onApprove={onApprove}
                  isDarkMode={isDarkMode}
                />
              ))}
            </>
          ) : (
            <Text style={[styles.sub, styles.emptyGap, isDarkMode && styles.mutedDark]} testID="health-files-none">
              This record has no pages yet.
            </Text>
          )}

          <View style={styles.footer}>
            <BouncyPressable testID="health-record-edit" activeScale={0.97} onPress={onEdit}>
              <Text style={styles.editLink}>Edit record details</Text>
            </BouncyPressable>
            <SmallButton
              testID="health-record-archive"
              label="Archive record"
              danger
              onPress={onArchive}
              disabled={busy}
              isDarkMode={isDarkMode}
            />
          </View>
        </>
      )}
    </Card>
  );
};

// ── Archived records ─────────────────────────────────────────────────────────────────────────────

export const ArchivedRecordsCard = ({ records, loading, onRestore, busy, isDarkMode }) => (
  <Card testID="health-archived" isDarkMode={isDarkMode}>
    <Text style={[styles.title, isDarkMode && styles.textWhite]}>Archived records</Text>
    <Text style={[styles.sub, isDarkMode && styles.mutedDark]}>
      Archived records are kept safe. Restore one to bring it back.
    </Text>
    {loading ? (
      <Text style={[styles.sub, styles.emptyGap, isDarkMode && styles.mutedDark]}>Loading…</Text>
    ) : records.length === 0 ? (
      <Text style={[styles.sub, styles.emptyGap, isDarkMode && styles.mutedDark]} testID="health-archived-empty">
        No archived records.
      </Text>
    ) : (
      records.map((record, index) => (
        <View key={record.id ?? index} style={[styles.file, isDarkMode && styles.fileDark]} testID={`archived-${index}`}>
          <Text style={[styles.fileName, styles.archivedName, isDarkMode && styles.textWhite]} numberOfLines={1}>
            {record.recordName || record.name || documentTypeLabel(record.documentType)}
          </Text>
          <SmallButton
            testID={`archived-restore-${index}`}
            label="Restore"
            onPress={() => onRestore(record)}
            disabled={busy}
            isDarkMode={isDarkMode}
          />
        </View>
      ))
    )}
  </Card>
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: s(16),
    marginTop: vs(14),
    padding: s(16),
    borderRadius: s(22),
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#EDE9FE',
    borderBottomWidth: 4,
    borderBottomColor: '#DDD6FE',
  },
  cardDark: { backgroundColor: '#1A0B30', borderColor: '#2E1654', borderBottomColor: '#4C1D95' },
  tinted: { backgroundColor: '#F8F5FF' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: s(8) },
  title: { flexShrink: 1, fontSize: s(17), color: '#1E1B4B', fontFamily: font.extraBold },
  count: { fontSize: s(11), color: '#475569', fontFamily: font.bold },
  sub: { marginTop: vs(6), fontSize: s(12.5), lineHeight: s(18), color: '#64748B', fontFamily: font.medium },
  emptyGap: { marginTop: vs(12) },
  textWhite: { color: '#FFFFFF' },
  mutedDark: { color: '#94A3B8' },
  disabled: { opacity: 0.5 },
  error: { marginTop: vs(8), fontSize: s(12), color: '#B42318', fontFamily: font.semiBold },

  small: {
    paddingHorizontal: s(12),
    paddingVertical: vs(7),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FFFFFF',
  },
  smallDark: { backgroundColor: '#27104B', borderColor: '#4C1D95' },
  smallDanger: { backgroundColor: '#FEF3F2', borderColor: '#FCCACA' },
  smallDangerDark: { backgroundColor: '#3A1220', borderColor: '#7A2531' },
  smallText: { fontSize: s(12), color: PURPLE, fontFamily: font.bold },
  smallTextDanger: { color: '#B42318' },

  group: {
    marginTop: vs(14),
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    overflow: 'hidden',
  },
  groupDark: { borderColor: '#2E1654' },
  groupHead: { padding: s(12), backgroundColor: '#F8F5FF' },
  groupName: { fontSize: s(14), color: '#3B108F', fontFamily: font.extraBold },
  groupNameDark: { color: '#C4B5FD' },
  groupDue: { marginTop: 2, fontSize: s(11.5), color: '#64748B', fontFamily: font.medium },
  historyRow: { padding: s(12), borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: vs(6) },
  historyRowDark: { borderTopColor: '#2E1654' },
  historyLine: { flexDirection: 'row', justifyContent: 'space-between', gap: s(10) },
  historyKey: { fontSize: s(11.5), color: '#64748B', fontFamily: font.bold },
  historyValue: { flexShrink: 1, textAlign: 'right', fontSize: s(12.5), color: '#0F172A', fontFamily: font.medium },
  historyValueBold: { flexShrink: 1, textAlign: 'right', fontSize: s(12.5), color: '#0F172A', fontFamily: font.bold },
  historyDue: { alignItems: 'flex-end' },
  confirmed: { marginTop: 2, fontSize: s(11), color: '#15803D', fontFamily: font.bold },
  dueEdit: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  dueInput: { flex: 1, marginTop: 0 },
  finder: { gap: vs(8) },
  findBtn: {
    paddingHorizontal: s(16),
    paddingVertical: vs(9),
    borderRadius: s(12),
    backgroundColor: '#3B108F',
  },
  findText: { fontSize: s(12.5), color: '#FFFFFF', fontFamily: font.bold },
  option: {
    padding: s(10),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F8F5FF',
  },
  optionDark: { backgroundColor: '#27104B', borderColor: '#4C1D95' },
  optionName: { fontSize: s(13), color: '#1E1B4B', fontFamily: font.bold },

  field: { marginTop: vs(12) },
  fieldLabel: { fontSize: s(12), color: '#334155', fontFamily: font.bold },
  input: {
    marginTop: vs(6),
    paddingHorizontal: s(12),
    paddingVertical: vs(9),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    fontSize: s(13),
    color: '#0F172A',
    fontFamily: font.medium,
  },
  inputDark: { backgroundColor: '#27104B', borderColor: '#4C1D95', color: '#FFFFFF' },
  saveRow: { alignItems: 'center', marginTop: vs(16) },

  choose: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(8),
    marginTop: vs(12),
    paddingVertical: vs(12),
    borderRadius: s(14),
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: '#C4B5FD',
  },
  chooseDark: { borderColor: '#4C1D95' },
  chooseText: { fontSize: s(13), color: '#64748B', fontFamily: font.semiBold },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: vs(10) },
  file: {
    marginTop: vs(10),
    padding: s(12),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: '#EDE9FE',
    backgroundColor: '#FFFFFF',
  },
  fileDark: { backgroundColor: '#1F0F38', borderColor: '#2E1654' },
  fileName: { fontSize: s(13), color: PURPLE, fontFamily: font.bold },
  archivedName: { color: '#1E1B4B' },
  fileMeta: { marginTop: 2, fontSize: s(11.5), color: '#64748B', fontFamily: font.medium },
  fileButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: vs(10) },
  fileFoot: {
    marginTop: vs(10),
    padding: s(10),
    gap: vs(8),
    alignItems: 'flex-start',
    borderRadius: s(12),
    backgroundColor: '#F8F5FF',
  },
  fileFootDark: { backgroundColor: '#27104B' },
  fileNote: { fontSize: s(12), lineHeight: s(17), color: '#64748B', fontFamily: font.medium },
  reviewTitle: { color: '#1E1B4B', fontFamily: font.bold },
  suggestion: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', gap: s(10) },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(16),
  },
  editLink: { fontSize: s(12.5), color: PURPLE, fontFamily: font.bold },
});
