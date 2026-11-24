import {
  PET_TABS,
  isTabId,
  SOCIAL_FIELDS,
  readSocial,
  socialPayload,
  socialChanged,
  stampedCities,
  lockedCities,
  groupHealthRecords,
  healthRecordMeta,
} from '../petProfileModel';

describe('tabs', () => {
  it('has the five tabs of the website, in order', () => {
    expect(PET_TABS.map(tab => tab.label)).toEqual([
      'Basic Info',
      'Photo',
      'Social',
      'Stamps',
      'Health Records',
    ]);
    expect(PET_TABS.map(tab => tab.id)).toEqual(['basic', 'photo', 'social', 'stamps', 'health']);
  });

  it('knows which names are tabs', () => {
    expect(isTabId('stamps')).toBe(true);
    expect(isTabId('nope')).toBe(false);
    expect(isTabId(undefined)).toBe(false);
  });
});

describe('social links', () => {
  it('lists Instagram, YouTube, X / Twitter and Website', () => {
    expect(SOCIAL_FIELDS.map(field => field.label)).toEqual([
      'Instagram',
      'YouTube',
      'X / Twitter',
      'Website',
    ]);
  });

  it('reads the links under the names the API may use', () => {
    expect(
      readSocial({
        instagram: 'bruni',
        youtubeUrl: 'youtube.com/c/b',
        xHandle: 'bx',
        website: 'b.com',
      }),
    ).toEqual({
      instagram: 'bruni',
      youtube: 'youtube.com/c/b',
      twitter: 'bx',
      website: 'b.com',
    });
    expect(readSocial({ social: { instagram: 'a', x: 'ax' } })).toMatchObject({
      instagram: 'a',
      twitter: 'ax',
    });
  });

  it('gives empty text for what is missing, and copes with no pet', () => {
    const empty = { instagram: '', youtube: '', twitter: '', website: '' };
    expect(readSocial({})).toEqual(empty);
    expect(readSocial(undefined)).toEqual(empty);
    expect(readSocial({ instagram: null, website: 5 })).toEqual(empty);
  });

  it('trims what is saved and drops a leading @ from handles, but not from other links', () => {
    expect(
      socialPayload({
        instagram: '  @@bruni ',
        youtube: ' youtube.com/c/b ',
        twitter: '@bx',
        website: ' b.com ',
      }),
    ).toEqual({ instagram: 'bruni', youtube: 'youtube.com/c/b', twitter: 'bx', website: 'b.com' });
  });

  it('saves empty text for a link that was cleared', () => {
    expect(socialPayload({ instagram: '', youtube: undefined })).toEqual({
      instagram: '',
      youtube: '',
      twitter: '',
      website: '',
    });
  });

  it('notices when something changed, and when only spacing or an @ differs', () => {
    const pet = { instagram: 'bruni', website: 'b.com' };
    expect(socialChanged({ instagram: 'bruni', website: 'b.com' }, pet)).toBe(false);
    expect(socialChanged({ instagram: '@bruni ', website: 'b.com' }, pet)).toBe(false);
    expect(socialChanged({ instagram: 'bruni2', website: 'b.com' }, pet)).toBe(true);
    expect(socialChanged({ instagram: 'bruni', website: '' }, pet)).toBe(true);
  });
});

describe('stamps', () => {
  const stamps = [{ city: 'Agonda' }, { cityName: ' Goa ' }, { placeName: 'No city here' }, null];

  it('collects the cities a pet has stamps for', () => {
    expect([...stampedCities(stamps)].sort()).toEqual(['agonda', 'goa']);
    expect(stampedCities(undefined).size).toBe(0);
  });

  it('lists the cities still to unlock, without the stamped ones, in the same order', () => {
    const known = [
      { name: 'New Delhi' },
      { city: 'Agonda' },
      'Jaipur',
      { name: 'goa' },
      { name: 'Pune' },
    ];
    expect(lockedCities(known, stamps)).toEqual(['New Delhi', 'Jaipur', 'Pune']);
  });

  it('lists each city once, skips blanks, and stops at the limit', () => {
    const known = [{ name: 'A' }, { name: 'a ' }, { name: '' }, null, { name: 'B' }, { name: 'C' }];
    expect(lockedCities(known, [], 10)).toEqual(['A', 'B', 'C']);
    expect(lockedCities(known, [], 2)).toEqual(['A', 'B']);
  });

  it('gives an empty list for no cities', () => {
    expect(lockedCities(undefined, stamps)).toEqual([]);
    expect(lockedCities('x', stamps)).toEqual([]);
  });
});

describe('healthRecordMeta', () => {
  it('writes the line the website shows, with "Not added" for missing dates', () => {
    expect(healthRecordMeta({})).toBe('Issued Not added · Due Not added · 0 files');
    expect(
      healthRecordMeta({
        dateIssued: '2026-03-05T00:00:00Z',
        nextDueDate: '2027-03-05',
        files: [{}],
      }),
    ).toBe('Issued 2026-03-05 · Due 2027-03-05 · 1 file');
  });

  it('counts files from a list or from a count', () => {
    expect(healthRecordMeta({ files: [{}, {}] })).toMatch(/2 files$/);
    expect(healthRecordMeta({ fileCount: 3 })).toMatch(/3 files$/);
    expect(healthRecordMeta(undefined)).toMatch(/0 files$/);
  });
});

describe('groupHealthRecords', () => {
  it('groups by document type in the order each type first appears, keeping each original place', () => {
    const records = [
      { id: 1, documentType: 'vaccination' },
      { id: 2, documentType: 'deworming' },
      { id: 3, documentType: 'vaccination' },
    ];

    const groups = groupHealthRecords(records);

    expect(groups.map(group => group.type)).toEqual(['vaccination', 'deworming']);
    expect(groups[0].entries.map(entry => [entry.record.id, entry.index])).toEqual([
      [1, 0],
      [3, 2],
    ]);
  });

  it('puts a record with no type under other, and copes with nothing at all', () => {
    expect(groupHealthRecords([{ id: 1 }])[0].type).toBe('other');
    expect(groupHealthRecords(undefined)).toEqual([]);
    expect(groupHealthRecords(null)).toEqual([]);
  });
});
