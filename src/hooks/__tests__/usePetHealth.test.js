import { formatDateInput, toIsoDate, buildHealthRecordPayload, documentTypeLabel } from '../usePetHealth';

describe('pet health record helpers', () => {
  it('formats typing as DD/MM/YYYY', () => {
    expect(formatDateInput('0')).toBe('0');
    expect(formatDateInput('0503')).toBe('05/03');
    expect(formatDateInput('05032026')).toBe('05/03/2026');
    expect(formatDateInput('05/03/2026 extra 99')).toBe('05/03/2026');
    expect(formatDateInput('')).toBe('');
  });

  it('turns DD/MM/YYYY into an ISO date, and rejects dates that do not exist', () => {
    expect(toIsoDate('05/03/2026')).toBe('2026-03-05');
    expect(toIsoDate('')).toBe('');
    expect(toIsoDate('31/02/2026')).toBeNull();
    expect(toIsoDate('5/3/2026')).toBeNull();
  });

  it('builds the create body and leaves out empty fields', () => {
    expect(
      buildHealthRecordPayload({
        documentType: 'deworming',
        recordName: ' Round 2 ',
        dateIssued: '05/03/2026',
        nextDueDate: '',
        vetName: '',
        clinicName: 'Happy Paws',
        documentNumber: '',
        notes: '',
      })
    ).toEqual({
      documentType: 'deworming',
      recordName: 'Round 2',
      dateIssued: '2026-03-05',
      clinicName: 'Happy Paws',
    });
    expect(buildHealthRecordPayload({})).toEqual({ documentType: 'vaccination' });
  });

  it('labels document types', () => {
    expect(documentTypeLabel('health_certificate')).toBe('Health certificate');
    expect(documentTypeLabel('something_new')).toBe('something new');
  });
});
