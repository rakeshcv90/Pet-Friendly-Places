import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../../services/api/apiClient';
import { useStore } from '../../store';
import {
  useHealthHistory,
  useUpdateHealthRecord,
  useArchiveHealthRecord,
  useRestoreHealthRecord,
  useAddVaccination,
  useConfirmDueDate,
  useFindVets,
  useConfirmVet,
  useExtractFile,
  useExtractAllPages,
  useOrganizePages,
  useApproveExtraction,
  useReplaceHealthFile,
  useArchivedHealthRecords,
  useHealthSettings, useUpdateHealthSettings, useDeleteHealthRecordFile } from '../usePetHealth';
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

describe('useDeleteHealthRecordFile', () => {
  it('sends DELETE to the file address and refreshes the records', async () => {
    const del = jest.spyOn(api, 'delete').mockResolvedValue({});
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const wrapper = ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteHealthRecordFile('pet-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ recordId: 'rec-2', fileId: 'file-3' });
    });

    expect(del).toHaveBeenCalledWith('/pets/pet-1/health-records/rec-2/files/file-3');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['pet', 'healthRecords', 'pet-1'] });
    del.mockRestore();
  });
});

describe('health reminder settings', () => {
  const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapperFor = client => ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    useStore.setState({ isAuthenticated: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads the current setting from the pet health settings address', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ notifyHealthRemindersEmail: true });
    const { result } = renderHook(() => useHealthSettings('pet-1'), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.emailReminders).toBe(true));
    expect(get).toHaveBeenCalledWith('/pets/pet-1/health-settings');
  });

  it('reads the setting when the server wraps it in settings', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({ settings: { notifyHealthRemindersEmail: true } });
    const { result } = renderHook(() => useHealthSettings('pet-1'), {
      wrapper: wrapperFor(makeClient()),
    });

    await waitFor(() => expect(result.current.emailReminders).toBe(true));
  });

  it('is off until the server has answered, and off when it says nothing', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({});
    const { result } = renderHook(() => useHealthSettings('pet-1'), {
      wrapper: wrapperFor(makeClient()),
    });

    expect(result.current.emailReminders).toBe(false);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.emailReminders).toBe(false);
  });

  it('does not ask for a pet that has no id', () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({});
    renderHook(() => useHealthSettings(undefined), { wrapper: wrapperFor(makeClient()) });

    expect(get).not.toHaveBeenCalled();
  });

  it('sends the new value with PATCH and keeps it after the refresh', async () => {
    // A tiny pretend server that remembers what was saved
    let saved = false;
    jest.spyOn(api, 'get').mockImplementation(async () => ({ notifyHealthRemindersEmail: saved }));
    const patch = jest.spyOn(api, 'patch').mockImplementation(async (url, body) => {
      saved = body.notifyHealthRemindersEmail;
      return {};
    });
    const client = makeClient();
    const { result } = renderHook(
      () => ({ settings: useHealthSettings('pet-1'), update: useUpdateHealthSettings('pet-1') }),
      { wrapper: wrapperFor(client) },
    );
    await waitFor(() => expect(result.current.settings.isSuccess).toBe(true));
    expect(result.current.settings.emailReminders).toBe(false);

    await act(async () => {
      await result.current.update.mutateAsync({ notifyHealthRemindersEmail: true });
    });

    expect(patch).toHaveBeenCalledWith('/pets/pet-1/health-settings', {
      notifyHealthRemindersEmail: true,
    });
    await waitFor(() => expect(result.current.settings.emailReminders).toBe(true));
  });

  it('puts the box back when the server refuses the change', async () => {
    jest.spyOn(api, 'get').mockResolvedValue({ notifyHealthRemindersEmail: false });
    jest.spyOn(api, 'patch').mockRejectedValue(new Error('nope'));
    const client = makeClient();
    const { result } = renderHook(
      () => ({ settings: useHealthSettings('pet-1'), update: useUpdateHealthSettings('pet-1') }),
      { wrapper: wrapperFor(client) },
    );
    await waitFor(() => expect(result.current.settings.isSuccess).toBe(true));

    await act(async () => {
      await result.current.update
        .mutateAsync({ notifyHealthRemindersEmail: true })
        .catch(() => {});
    });

    await waitFor(() => expect(result.current.settings.emailReminders).toBe(false));
  });
});

describe('website health actions', () => {
  const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapperFor = client => ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const KEYS = ['healthRecords', 'healthHistory', 'healthArchived'];

  beforeEach(() => {
    useStore.setState({ isAuthenticated: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Runs one action and checks the address, the body and that records, history and archive refresh
  const checkAction = async ({ hook, method, input, url, body }) => {
    const spy = jest.spyOn(api, method).mockResolvedValue({});
    const client = makeClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => hook('pet-1'), { wrapper: wrapperFor(client) });

    await act(async () => {
      await result.current.mutateAsync(input);
    });

    if (body === undefined) {
      expect(spy).toHaveBeenCalledWith(url);
    } else {
      expect(spy).toHaveBeenCalledWith(url, body);
    }
    KEYS.forEach(key =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['pet', key, 'pet-1'] }),
    );
  };

  it('edits a record with PATCH and the form turned into a body', () =>
    checkAction({
      hook: useUpdateHealthRecord,
      method: 'patch',
      input: { recordId: 'r1', form: { documentType: 'deworming', recordName: 'Round 2', dateIssued: '05/03/2026' } },
      url: '/pets/pet-1/health-records/r1',
      body: { documentType: 'deworming', recordName: 'Round 2', dateIssued: '2026-03-05' },
    }));

  it('archives a record with DELETE on the record', () =>
    checkAction({
      hook: useArchiveHealthRecord,
      method: 'delete',
      input: { recordId: 'r1' },
      url: '/pets/pet-1/health-records/r1',
    }));

  it('restores a record with POST', () =>
    checkAction({
      hook: useRestoreHealthRecord,
      method: 'post',
      input: { recordId: 'r1' },
      url: '/pets/pet-1/health-records/r1/restore',
      body: undefined,
    }));

  it('adds a vaccination to a record', () =>
    checkAction({
      hook: useAddVaccination,
      method: 'post',
      input: { recordId: 'r1', payload: { vaccineName: 'Rabies', dueDate: '2027-01-01' } },
      url: '/pets/pet-1/health-records/r1/vaccinations',
      body: { vaccineName: 'Rabies', dueDate: '2027-01-01' },
    }));

  it('confirms a due date in the history', () =>
    checkAction({
      hook: useConfirmDueDate,
      method: 'post',
      input: { entryId: 9, dueDate: '2026-12-23' },
      url: '/pets/pet-1/health-history/due-date',
      body: { entryId: 9, dueDate: '2026-12-23' },
    }));

  it('links a vet to a vaccination entry with the chosen listing', () =>
    checkAction({
      hook: useConfirmVet,
      method: 'post',
      input: { recordId: 'r1', entryId: 'e1', listingId: 'L9' },
      url: '/pets/pet-1/health-records/r1/vaccinations/e1/vet-confirm',
      body: { listingId: 'L9' },
    }));

  describe('searching for a vet', () => {
    const search = async data => {
      const get = jest.spyOn(api, 'get').mockResolvedValue(data);
      const { result } = renderHook(() => useFindVets('pet-1'), { wrapper: wrapperFor(makeClient()) });
      let list;
      await act(async () => {
        list = await result.current.mutateAsync({ q: 'happy' });
      });
      return { get, list };
    };

    it('asks the vet suggestions address with the search text', async () => {
      const { get } = await search([]);

      expect(get).toHaveBeenCalledWith('/pets/pet-1/health-records/vet-suggestions', {
        params: { q: 'happy' },
      });
    });

    it('returns the list whichever field it comes in', async () => {
      expect((await search([{ id: 1 }])).list).toEqual([{ id: 1 }]);
      expect((await search({ suggestions: [{ id: 2 }] })).list).toEqual([{ id: 2 }]);
      expect((await search({ results: [{ id: 3 }] })).list).toEqual([{ id: 3 }]);
      expect((await search({})).list).toEqual([]);
    });
  });

  it('reads one file', () =>
    checkAction({
      hook: useExtractFile,
      method: 'post',
      input: { recordId: 'r1', fileId: 'f1' },
      url: '/pets/pet-1/health-records/r1/files/f1/extract',
      body: undefined,
    }));

  it('reads every page of a record', () =>
    checkAction({
      hook: useExtractAllPages,
      method: 'post',
      input: { recordId: 'r1' },
      url: '/pets/pet-1/health-records/r1/extract/bulk',
      body: undefined,
    }));

  it('arranges the pages of a record', () =>
    checkAction({
      hook: useOrganizePages,
      method: 'post',
      input: { recordId: 'r1' },
      url: '/pets/pet-1/health-records/r1/organize',
      body: undefined,
    }));

  it('approves a reviewed extraction with the reviewed details', () =>
    checkAction({
      hook: useApproveExtraction,
      method: 'post',
      input: { recordId: 'r1', fileId: 'f1', details: { vaccineName: 'Rabies' } },
      url: '/pets/pet-1/health-records/r1/files/f1/extract/approve',
      body: { vaccineName: 'Rabies' },
    }));

  it('loads the vaccine history', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ rows: [] });
    const { result } = renderHook(() => useHealthHistory('pet-1'), { wrapper: wrapperFor(makeClient()) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/pets/pet-1/health-history');
  });

  it('loads archived records only when asked, as a list', async () => {
    const get = jest.spyOn(api, 'get').mockResolvedValue({ records: [{ id: 'a' }] });
    const closed = renderHook(() => useArchivedHealthRecords('pet-1', false), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(get).not.toHaveBeenCalled();
    closed.unmount();

    const { result } = renderHook(() => useArchivedHealthRecords('pet-1', true), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.data).toEqual([{ id: 'a' }]));
    expect(get).toHaveBeenCalledWith('/pets/pet-1/health-records/archived');
  });

  describe('replacing a page', () => {
    const photo = { uri: 'file:///new.jpg', fileName: 'new.jpg', type: 'image/jpeg' };

    it('uploads the new photo first and only then removes the old one', async () => {
      const order = [];
      global.fetch = jest.fn(async () => {
        order.push('upload');
        return { ok: true };
      });
      jest.spyOn(api, 'delete').mockImplementation(async () => {
        order.push('delete');
        return {};
      });
      const { result } = renderHook(() => useReplaceHealthFile('pet-1'), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current.mutateAsync({ recordId: 'r1', fileId: 'f1', photo });
      });

      expect(order).toEqual(['upload', 'delete']);
      expect(api.delete).toHaveBeenCalledWith('/pets/pet-1/health-records/r1/files/f1');
    });

    it('keeps the old page when the new photo could not be uploaded', async () => {
      global.fetch = jest.fn(async () => ({ ok: false }));
      const del = jest.spyOn(api, 'delete').mockResolvedValue({});
      const { result } = renderHook(() => useReplaceHealthFile('pet-1'), {
        wrapper: wrapperFor(makeClient()),
      });

      await act(async () => {
        await result.current
          .mutateAsync({ recordId: 'r1', fileId: 'f1', photo })
          .catch(() => {});
      });

      expect(del).not.toHaveBeenCalled();
    });
  });
});
