import {
  isoToInput,
  recordFiles,
  fileIdOf,
  fileNameOf,
  fileTypeOf,
  fileStatusOf,
  fileSuggestions,
  recordToForm,
  historyRows,
  groupHistory,
  buildVaccinationPayload,
  prettyDate,
  vetOptions,
} from '../healthModel';

describe('isoToInput', () => {
  it('turns an ISO date into DD/MM/YYYY and leaves nothing for a missing one', () => {
    expect(isoToInput('2026-03-05T00:00:00Z')).toBe('05/03/2026');
    expect(isoToInput('2026-03-05')).toBe('05/03/2026');
    expect(isoToInput('')).toBe('');
    expect(isoToInput(undefined)).toBe('');
    expect(isoToInput('soon')).toBe('');
  });
});

describe('files of a record', () => {
  it('reads files from whichever field the API used, and never a non-list', () => {
    expect(recordFiles({ files: [1] })).toEqual([1]);
    expect(recordFiles({ pages: [2] })).toEqual([2]);
    expect(recordFiles({ documents: [3] })).toEqual([3]);
    expect(recordFiles({ files: 'nope' })).toEqual([]);
    expect(recordFiles(undefined)).toEqual([]);
  });

  it('reads the id, name and type', () => {
    expect(fileIdOf({ id: 'a' })).toBe('a');
    expect(fileIdOf({ fileId: 'b' })).toBe('b');
    expect(fileIdOf({ file_id: 'c' })).toBe('c');
    expect(fileNameOf({ fileName: 'x.jpg' })).toBe('x.jpg');
    expect(fileNameOf({ originalName: 'y.jpg' })).toBe('y.jpg');
    expect(fileNameOf({}, 2)).toBe('Page 3');
    expect(fileTypeOf({ mimeType: 'image/jpeg' })).toBe('image/jpeg');
    expect(fileTypeOf({})).toBe('');
  });
});

describe('fileStatusOf', () => {
  it('is pending extraction until the file has been read', () => {
    expect(fileStatusOf({})).toMatchObject({ label: 'Pending extraction', pending: true });
    expect(fileStatusOf({ extractionStatus: 'pending' }).pending).toBe(true);
  });

  it('says a read file needs the owner to review it', () => {
    const status = fileStatusOf({ extractionStatus: 'extracted' });
    expect(status).toMatchObject({ label: 'Extracted · needs owner review', extracted: true });
    expect(status.pending).toBe(false);
    expect(status.approved).toBe(false);
  });

  it('says approved once the owner confirmed it', () => {
    expect(fileStatusOf({ extractionStatus: 'approved' })).toMatchObject({
      label: 'Approved',
      approved: true,
    });
    expect(fileStatusOf({ ownerConfirmed: true }).approved).toBe(true);
  });

  it('knows a file that is being read and one that failed', () => {
    expect(fileStatusOf({ status: 'processing' })).toMatchObject({ label: 'Reading…', reading: true });
    expect(fileStatusOf({ status: 'failed' })).toMatchObject({
      label: 'Could not be read',
      failed: true,
      pending: false,
    });
  });
});

describe('fileSuggestions', () => {
  it('lists what was read as label and value rows, dates trimmed to the day', () => {
    const rows = fileSuggestions({
      suggestions: { vaccineName: 'Rabies', dateAdministered: '2026-03-05T00:00:00Z', clinic: 'Happy Paws' },
    });

    expect(rows).toEqual([
      { key: 'vaccineName', label: 'Vaccine', value: 'Rabies' },
      { key: 'dateAdministered', label: 'Given', value: '2026-03-05' },
      { key: 'clinic', label: 'Clinic', value: 'Happy Paws' },
    ]);
  });

  it('copes with a list of suggestions and with nothing at all', () => {
    expect(fileSuggestions({ extraction: { suggestions: [{ vaccineName: 'A' }, { vaccineName: 'B' }] } })).toHaveLength(2);
    expect(fileSuggestions({})).toEqual([]);
    expect(fileSuggestions(undefined)).toEqual([]);
  });
});

describe('recordToForm', () => {
  it('fills the form from a record with dates as DD/MM/YYYY', () => {
    expect(
      recordToForm({
        documentType: 'deworming',
        recordName: 'Round 2',
        dateIssued: '2026-03-05',
        nextDueDate: '2026-09-01',
        clinicName: 'Happy Paws',
      }),
    ).toMatchObject({
      documentType: 'deworming',
      recordName: 'Round 2',
      dateIssued: '05/03/2026',
      nextDueDate: '01/09/2026',
      clinicName: 'Happy Paws',
      vetName: '',
    });
  });

  it('starts a record with no details as a blank vaccination form', () => {
    expect(recordToForm(undefined)).toMatchObject({ documentType: 'vaccination', recordName: '', dateIssued: '' });
  });
});

describe('vaccine history', () => {
  it('reads rows from whichever list the API used', () => {
    expect(historyRows([{ id: 1 }])).toHaveLength(1);
    expect(historyRows({ rows: [{ id: 1 }, { id: 2 }] })).toHaveLength(2);
    expect(historyRows({ history: [{ id: 1 }] })).toHaveLength(1);
    expect(historyRows({})).toEqual([]);
    expect(historyRows(undefined)).toEqual([]);
  });

  it('normalises a row', () => {
    expect(
      historyRows([
        {
          id: 7,
          vaccineFamily: 'Rabies',
          dateAdministered: '2026-11-23T00:00:00Z',
          vaccineName: 'Test',
          dueDate: '2026-12-23',
          ownerConfirmed: true,
          pageNumber: 0,
        },
      ])[0],
    ).toEqual({
      id: 7,
      entryId: 7,
      recordId: null,
      vet: '',
      family: 'Rabies',
      given: '2026-11-23',
      asWritten: 'Test',
      due: '2026-12-23',
      confirmed: true,
      page: 0,
      needsReview: false,
    });
  });

  it('files a row with no family under Other', () => {
    expect(historyRows([{ id: 1 }])[0].family).toBe('Other');
  });

  it('groups by family in order of first appearance, with the latest due date', () => {
    const groups = groupHistory(
      historyRows([
        { id: 1, vaccineFamily: 'Rabies', dueDate: '2026-01-01' },
        { id: 2, vaccineFamily: 'Other', dueDate: '2026-05-01' },
        { id: 3, vaccineFamily: 'Rabies', dueDate: '2027-01-01' },
      ]),
    );

    expect(groups.map(group => group.family)).toEqual(['Rabies', 'Other']);
    expect(groups[0].rows).toHaveLength(2);
    expect(groups[0].currentDue).toBe('2027-01-01');
    expect(groups[1].currentDue).toBe('2026-05-01');
  });

  it('has no current due date when no row has one', () => {
    expect(groupHistory(historyRows([{ id: 1 }]))[0].currentDue).toBe('');
  });
});

describe('buildVaccinationPayload', () => {
  const form = over => ({
    vaccineName: 'Rabies',
    dateAdministered: '05/03/2026',
    dueDate: '',
    batch: '',
    clinic: '',
    vet: '',
    ...over,
  });

  it('builds the body with ISO dates and leaves out empty optional fields', () => {
    expect(buildVaccinationPayload(form({ dueDate: '05/03/2027', clinic: ' Happy Paws ' }))).toEqual({
      payload: {
        vaccineName: 'Rabies',
        dateAdministered: '2026-03-05',
        dueDate: '2027-03-05',
        clinic: 'Happy Paws',
      },
    });
  });

  it('accepts one date on its own', () => {
    expect(buildVaccinationPayload(form({ dateAdministered: '', dueDate: '05/03/2027' })).payload).toEqual({
      vaccineName: 'Rabies',
      dueDate: '2027-03-05',
    });
  });

  it('needs a vaccine name', () => {
    expect(buildVaccinationPayload(form({ vaccineName: '  ' })).error).toMatch(/vaccine name/);
  });

  it('needs at least one date', () => {
    expect(buildVaccinationPayload(form({ dateAdministered: '' })).error).toMatch(/at least one date/);
  });

  it('refuses a date that does not exist or is badly typed', () => {
    expect(buildVaccinationPayload(form({ dateAdministered: '31/02/2026' })).error).toMatch(/DD\/MM\/YYYY/);
    expect(buildVaccinationPayload(form({ dueDate: '5/3/27' })).error).toMatch(/DD\/MM\/YYYY/);
  });
});

describe('prettyDate', () => {
  it('writes an ISO date the way the website does', () => {
    expect(prettyDate('2026-11-23')).toBe('Nov 23, 2026');
    expect(prettyDate('2026-12-23T00:00:00Z')).toBe('Dec 23, 2026');
    expect(prettyDate('2026-03-05')).toBe('Mar 5, 2026');
  });

  it('writes nothing for a missing or odd date', () => {
    expect(prettyDate('')).toBe('');
    expect(prettyDate(undefined)).toBe('');
    expect(prettyDate('soon')).toBe('');
    expect(prettyDate('2026-13-01')).toBe('');
  });
});

describe('history entry ids', () => {
  it('uses the entry id, the record it belongs to and the vet it names', () => {
    const [row] = historyRows([{ id: 'x', entryId: 'e1', recordId: 'r1', clinicName: 'Happy Paws' }]);

    expect(row).toMatchObject({ id: 'x', entryId: 'e1', recordId: 'r1', vet: 'Happy Paws' });
  });

  it('falls back to the row id when there is no separate entry id', () => {
    expect(historyRows([{ id: 5 }])[0].entryId).toBe(5);
  });
});

describe('vetOptions', () => {
  it('turns search results into options with a place line', () => {
    expect(
      vetOptions([{ listingId: 'L1', name: 'Happy Paws', city: 'Gurugram', address: 'Sector 14' }]),
    ).toEqual([{ key: 'L1', listingId: 'L1', name: 'Happy Paws', place: 'Gurugram, Sector 14' }]);
  });

  it('reads id and title as well, and drops results that cannot be linked', () => {
    const options = vetOptions([{ id: 2, title: 'Pet Care' }, { name: 'No id' }, { id: 3 }]);

    expect(options).toEqual([{ key: '2', listingId: 2, name: 'Pet Care', place: '' }]);
  });

  it('copes with nothing', () => {
    expect(vetOptions(undefined)).toEqual([]);
    expect(vetOptions('x')).toEqual([]);
  });
});
