import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { PetHealthRecordsScreen } from '../PetHealthRecordsScreen';

jest.mock('../../../services/permissions/permissions', () => ({
  requestCamera: jest.fn(async () => 'granted'),
  openPhoneSettings: jest.fn(),
}));

const mockMutateAsync = jest.fn();
const mockDeleteFile = jest.fn();
const mockUpdateSettings = jest.fn();
let mockEmailReminders = false;
let mockSettingsLoading = false;
let mockRecords = [];
let mockHistory = {};
let mockArchived = [];
// One mock per action of the website's health section, keyed by what it does
const mockActions = {};
const action = name => {
  if (!mockActions[name]) {
    mockActions[name] = jest.fn();
  }
  return { mutateAsync: (...args) => mockActions[name](...args), isPending: false };
};

jest.mock('../../../hooks/usePetHealth', () => ({
  ...jest.requireActual('../../../hooks/usePetHealth'),
  useHealthRecords: () => ({ data: mockRecords }),
  useCreateHealthRecord: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
  useDeleteHealthRecordFile: () => ({ mutateAsync: mockDeleteFile }),
  useHealthSettings: () => ({ emailReminders: mockEmailReminders, isLoading: mockSettingsLoading }),
  useUpdateHealthSettings: () => ({ mutateAsync: mockUpdateSettings, isPending: false }),
  useHealthHistory: () => ({ data: mockHistory }),
  useArchivedHealthRecords: (id, enabled) => ({ data: enabled ? mockArchived : undefined, isLoading: false }),
  useUpdateHealthRecord: () => action('update'),
  useArchiveHealthRecord: () => action('archive'),
  useRestoreHealthRecord: () => action('restore'),
  useAddVaccination: () => action('addVaccination'),
  useConfirmDueDate: () => action('confirmDue'),
  useFindVets: () => action('findVets'),
  useConfirmVet: () => action('confirmVet'),
  useExtractFile: () => action('extractFile'),
  useExtractAllPages: () => action('extractAll'),
  useOrganizePages: () => action('organize'),
  useApproveExtraction: () => action('approve'),
  useReplaceHealthFile: () => action('replace'),
  useAddHealthFiles: () => action('addFiles'),
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const route = { params: { pet: { id: 'pet-1', name: 'Bruno' } } };

describe('PetHealthRecordsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecords = [];
    mockMutateAsync.mockResolvedValue({ failedPhotos: 0 });
    mockDeleteFile.mockResolvedValue({});
    mockUpdateSettings.mockResolvedValue({});
    mockEmailReminders = false;
    mockSettingsLoading = false;
    mockHistory = {};
    mockArchived = [];
    Object.keys(mockActions).forEach(name => {
      mockActions[name].mockReset();
      mockActions[name].mockResolvedValue({});
    });
  });

  it('opens on the records book, with its empty message and the three actions', () => {
    const { getByText, getByTestId, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    expect(getByText("Bruno's health records")).toBeTruthy();
    expect(getByTestId('health-download')).toBeTruthy();
    expect(getByTestId('health-share')).toBeTruthy();
    expect(getByTestId('health-photos')).toBeTruthy();
    expect(getByText('No pages yet')).toBeTruthy();
    expect(getByText(/No source pages yet/)).toBeTruthy();
    // The add area stays closed until it is asked for
    expect(queryByText('Health Records')).toBeNull();
    expect(queryByText(/vaccination book or certificates/)).toBeNull();
  });

  it('shows the pages attached to the records in the book', () => {
    mockRecords = [
      {
        id: 1,
        documentType: 'vaccination',
        recordName: 'Rabies booster',
        files: [{ id: 9, url: 'https://x.test/p1.jpg' }],
      },
    ];
    const { getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    expect(getByText('1 page')).toBeTruthy();
    expect(getByText('Rabies booster')).toBeTruthy();
    expect(queryByText(/No source pages yet/)).toBeNull();
  });

  it('shows the page of a record whose file the API describes only by ID', () => {
    mockRecords = [{ id: 'rec-1', documentType: 'vaccination', files: [{ id: 'file-1' }] }];
    const { getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    expect(getByText('1 page')).toBeTruthy();
    expect(queryByText('No pages yet')).toBeNull();
  });

  describe('removing a page', () => {
    beforeEach(() => {
      mockRecords = [{ id: 'rec-1', documentType: 'vaccination', files: [{ id: 'file-1' }] }];
    });

    it('asks in the app popup before removing, and removes nothing if kept', () => {
      const { getByTestId, getByText, queryByText } = render(
        <PetHealthRecordsScreen navigation={navigation} route={route} />,
      );
      expect(queryByText('Remove this page?')).toBeNull();

      fireEvent.press(getByTestId('health-page-remove'));

      expect(getByText('Remove this page?')).toBeTruthy();
      expect(getByText(/deleted from this health record/)).toBeTruthy();
      fireEvent.press(getByText('Keep it'));
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('deletes the file of that record once confirmed and says so', async () => {
      const { getByTestId, getByText, findByText } = render(
        <PetHealthRecordsScreen navigation={navigation} route={route} />,
      );

      fireEvent.press(getByTestId('health-page-remove'));
      fireEvent.press(getByText('Remove'));

      await waitFor(() =>
        expect(mockDeleteFile).toHaveBeenCalledWith({ recordId: 'rec-1', fileId: 'file-1' }),
      );
      expect(await findByText('Page removed')).toBeTruthy();
    });

    it('tells the user in a popup when the page could not be removed', async () => {
      mockDeleteFile.mockRejectedValue({ response: { data: { error: 'Not allowed' } } });
      const { getByTestId, getByText, findByText } = render(
        <PetHealthRecordsScreen navigation={navigation} route={route} />,
      );

      fireEvent.press(getByTestId('health-page-remove'));
      fireEvent.press(getByText('Remove'));

      expect(await findByText('Could not remove page')).toBeTruthy();
      expect(getByText('Not allowed')).toBeTruthy();
    });
  });

  it('opens the add area from Add photos, with the card, records and photo upload', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));

    expect(getByText('Health Records')).toBeTruthy();
    expect(getByText('Open health records book')).toBeTruthy();
    expect(getByText(/No health records yet/)).toBeTruthy();
    expect(getByText("Add photos of Bruno's vaccination book or certificates")).toBeTruthy();
    expect(getByText('Take photo')).toBeTruthy();
    expect(getByText('Choose from gallery')).toBeTruthy();
    // Book and form are not shown yet
    expect(queryByText('No pages yet')).toBeNull();
    expect(queryByText('Add health record')).toBeNull();
  });

  it('lists records the API returns in the add area', () => {
    mockRecords = [
      {
        id: 1,
        documentType: 'vaccination',
        recordName: 'Rabies booster',
        dateIssued: '2026-03-05T00:00:00Z',
      },
    ];
    const { getByText, getByTestId, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));

    expect(getByText('Rabies booster')).toBeTruthy();
    expect(getByText('Issued 2026-03-05 · Due Not added · 0 files')).toBeTruthy();
    expect(queryByText(/No health records yet/)).toBeNull();
  });

  it('lets the issued, due and files line wrap instead of cutting it off', () => {
    mockRecords = [{ id: 1, documentType: 'vaccination', files: [{ id: 'a' }] }];
    const { getByTestId } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));

    const meta = getByTestId('health-record-meta-0');

    expect(meta.props.numberOfLines).toBeUndefined();
    expect(meta.props.children).toBe('Issued Not added · Due Not added · 1 file');
  });

  it('groups records under their type and shows issued, due and file count like the website', () => {
    mockRecords = [
      { id: 1, documentType: 'vaccination', files: [{ id: 'a' }] },
      { id: 2, documentType: 'vaccination', recordName: "Cleo's health records", files: [1, 2, 3, 4, 5] },
      { id: 3, documentType: 'deworming', nextDueDate: '2026-09-01T00:00:00Z' },
      { id: 4, documentType: 'vaccination', files: [{ id: 'b' }, { id: 'c' }] },
    ];
    const { getByTestId, getByText, getAllByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));

    // One heading per type, vaccinations together even though a deworming came between them
    expect(getByText('VACCINATION')).toBeTruthy();
    expect(getByText('DEWORMING')).toBeTruthy();
    expect(getByTestId('health-group-vaccination')).toBeTruthy();
    expect(getByText('Issued Not added · Due Not added · 1 file')).toBeTruthy();
    expect(getByText('Issued Not added · Due Not added · 5 files')).toBeTruthy();
    expect(getByText('Issued Not added · Due 2026-09-01 · 0 files')).toBeTruthy();
    expect(getAllByText('Issued Not added · Due Not added · 2 files')).toHaveLength(1);
    expect(getByText("Cleo's health records")).toBeTruthy();
  });

  it('opens the form from "Add record" and from "enter details by hand"', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));
    fireEvent.press(getByTestId('health-by-hand'));
    expect(getByText('Add health record')).toBeTruthy();
    expect(getByText('Save record')).toBeTruthy();
    expect(getByText("Add photos of Bruno's vaccination book or certificates")).toBeTruthy();

    // Back to the book, then straight to the form with "Add record"
    fireEvent.press(getByTestId('health-open-book'));
    expect(queryByText('Add health record')).toBeNull();
    fireEvent.press(getByTestId('health-photos'));
    fireEvent.press(getByTestId('health-add-record'));
    expect(getByText('Add health record')).toBeTruthy();
  });

  it('goes back to the records book from "Open health records book"', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));
    expect(queryByText('No pages yet')).toBeNull();

    fireEvent.press(getByTestId('health-open-book'));
    expect(getByText('No pages yet')).toBeTruthy();
    expect(getByTestId('health-download')).toBeTruthy();
    expect(queryByText('Health Records')).toBeNull();
  });

  it('saves the record with what was typed', async () => {
    const { getByTestId } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));
    fireEvent.press(getByTestId('health-add-record'));
    fireEvent.press(getByTestId('health-type-deworming'));
    fireEvent.changeText(getByTestId('health-record-name'), 'Round 2');
    fireEvent.changeText(getByTestId('health-date-issued'), '05032026');
    fireEvent.press(getByTestId('health-save'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    const { form, photos } = mockMutateAsync.mock.calls[0][0];
    expect(form).toMatchObject({
      documentType: 'deworming',
      recordName: 'Round 2',
      dateIssued: '05/03/2026',
    });
    expect(photos).toEqual([]);
  });

  it('does not save a date that does not exist', async () => {
    const { getByTestId, findByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    fireEvent.press(getByTestId('health-photos'));
    fireEvent.press(getByTestId('health-add-record'));
    fireEvent.changeText(getByTestId('health-date-issued'), '31022026');
    fireEvent.press(getByTestId('health-save'));

    expect(await findByText(/Enter dates as DD\/MM\/YYYY/)).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows Download, Share and Add photos together in one row, not in a sideways scroll', () => {
    const { getByTestId, UNSAFE_queryAllByType } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />,
    );
    const { ScrollView } = require('react-native');

    ['health-download', 'health-share', 'health-photos'].forEach(id =>
      expect(getByTestId(id)).toBeTruthy(),
    );
    const horizontal = UNSAFE_queryAllByType(ScrollView).filter(view => view.props.horizontal);
    expect(horizontal).toHaveLength(0);
  });

  it('opens straight on the add form when asked to', () => {
    const { getByText } = render(
      <PetHealthRecordsScreen
        navigation={navigation}
        route={{ params: { ...route.params, initialView: 'form' } }}
      />,
    );
    expect(getByText('Health Records')).toBeTruthy();
  });

  describe('photos and the record form are separate', () => {
    const pick = (...uris) =>
      launchImageLibrary.mockImplementation((options, callback) =>
        callback({ assets: uris.map(uri => ({ uri, fileName: `${uri}.jpg`, type: 'image/jpeg' })) }),
      );

    const openAdd = utils => fireEvent.press(utils.getByTestId('health-photos'));

    it('offers both the camera and the gallery', () => {
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);

      expect(utils.getByText('Take photo')).toBeTruthy();
      expect(utils.getByText('Choose from gallery')).toBeTruthy();
    });

    it('opens the camera from Take photo and adds what it returns', async () => {
      launchCamera.mockImplementation((options, callback) =>
        callback({ assets: [{ uri: 'file:///cam.jpg', fileName: 'cam.jpg', type: 'image/jpeg' }] }),
      );
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);

      fireEvent.press(utils.getByTestId('health-take-photo'));

      await waitFor(() => expect(launchCamera).toHaveBeenCalledTimes(1));
      expect(await utils.findByTestId('health-photo-remove-0')).toBeTruthy();
    });

    it('opens the gallery from Choose from gallery, not the camera', () => {
      pick('file:///a.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);

      fireEvent.press(utils.getByTestId('health-choose-files'));

      expect(launchImageLibrary).toHaveBeenCalledWith(
        expect.objectContaining({ mediaType: 'photo', selectionLimit: expect.any(Number) }),
        expect.any(Function),
      );
      expect(launchCamera).not.toHaveBeenCalled();
    });

    it('keeps the record form closed after a photo is picked', () => {
      pick('file:///a.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);

      fireEvent.press(utils.getByTestId('health-choose-files'));

      expect(utils.getByTestId('health-photo-remove-0')).toBeTruthy();
      expect(utils.queryByText('Add health record')).toBeNull();
      expect(utils.queryByText('Save record')).toBeNull();
    });

    it('shows Save photo only once a photo is picked', () => {
      pick('file:///a.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);
      expect(utils.queryByTestId('health-save-photos')).toBeNull();

      fireEvent.press(utils.getByTestId('health-choose-files'));

      expect(utils.getByText('Save photo')).toBeTruthy();
    });

    it('counts the photos on the button when there are several', () => {
      pick('file:///a.jpg', 'file:///b.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);

      fireEvent.press(utils.getByTestId('health-choose-files'));

      expect(utils.getByText('Save 2 photos')).toBeTruthy();
    });

    it('saves just the photos, as a vaccination record with nothing typed in', async () => {
      pick('file:///a.jpg', 'file:///b.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);
      fireEvent.press(utils.getByTestId('health-choose-files'));

      fireEvent.press(utils.getByTestId('health-save-photos'));

      await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
      const { form, photos } = mockMutateAsync.mock.calls[0][0];
      expect(form).toEqual({ documentType: 'vaccination' });
      expect(photos.map(photo => photo.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
      expect(await utils.findByText('2 photos saved')).toBeTruthy();
      // The picked photos are cleared and the book is shown again
      expect(utils.queryByTestId('health-save-photos')).toBeNull();
      expect(utils.getByTestId('health-book')).toBeTruthy();
    });

    it('says when some photos could not be uploaded', async () => {
      mockMutateAsync.mockResolvedValue({ failedPhotos: 1 });
      pick('file:///a.jpg', 'file:///b.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);
      fireEvent.press(utils.getByTestId('health-choose-files'));

      fireEvent.press(utils.getByTestId('health-save-photos'));

      expect(await utils.findByText('1 photo saved, 1 could not be uploaded.')).toBeTruthy();
    });

    it('keeps the photos and tells the user when saving fails', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network down'));
      const alertSpy = jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});
      pick('file:///a.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);
      fireEvent.press(utils.getByTestId('health-choose-files'));

      fireEvent.press(utils.getByTestId('health-save-photos'));

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith('Could not save photos', 'Network down'),
      );
      expect(utils.getByText('Save photo')).toBeTruthy();
      alertSpy.mockRestore();
    });

    it('opens the form only from Add record, with Save record separate from Save photo', () => {
      pick('file:///a.jpg');
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      openAdd(utils);
      fireEvent.press(utils.getByTestId('health-choose-files'));

      fireEvent.press(utils.getByTestId('health-add-record'));

      expect(utils.getByText('Add health record')).toBeTruthy();
      expect(utils.getByText('Save record')).toBeTruthy();
      expect(utils.getByText('Save photo')).toBeTruthy();
    });
  });

  describe('vaccination and health reminders', () => {
    const open = () => {
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      fireEvent.press(utils.getByTestId('health-photos'));
      return utils;
    };

    it('shows the reminders card with its explanation in the add area', () => {
      const { getByText, getByTestId } = open();

      expect(getByText('Vaccination & Health Reminders')).toBeTruthy();
      expect(
        getByText('Email reminders 2 weeks before, 3 days before, and on the due date.'),
      ).toBeTruthy();
      expect(getByTestId('health-reminders')).toBeTruthy();
    });

    it('is not on the records book view', () => {
      const { queryByText } = render(
        <PetHealthRecordsScreen navigation={navigation} route={route} />,
      );

      expect(queryByText('Vaccination & Health Reminders')).toBeNull();
    });

    it('shows the box ticked when the saved setting is on, and empty when it is off', () => {
      mockEmailReminders = true;
      const on = open();
      expect(on.getByTestId('health-reminders').props.accessibilityState.checked).toBe(true);
      on.unmount();

      mockEmailReminders = false;
      const off = open();
      expect(off.getByTestId('health-reminders').props.accessibilityState.checked).toBe(false);
    });

    it('turns the reminders on when the box is ticked', async () => {
      const { getByTestId } = open();

      fireEvent.press(getByTestId('health-reminders'));

      await waitFor(() =>
        expect(mockUpdateSettings).toHaveBeenCalledWith({ notifyHealthRemindersEmail: true }),
      );
    });

    it('turns the reminders off when a ticked box is pressed', async () => {
      mockEmailReminders = true;
      const { getByTestId } = open();

      fireEvent.press(getByTestId('health-reminders'));

      await waitFor(() =>
        expect(mockUpdateSettings).toHaveBeenCalledWith({ notifyHealthRemindersEmail: false }),
      );
    });

    it('cannot be pressed while the setting is still loading', () => {
      mockSettingsLoading = true;
      const { getByTestId } = open();

      expect(getByTestId('health-reminders').props.accessibilityState.disabled).toBe(true);
      fireEvent.press(getByTestId('health-reminders'));
      expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('tells the user in a popup when the change could not be saved', async () => {
      mockUpdateSettings.mockRejectedValue({ response: { data: { error: 'Server busy' } } });
      const { getByTestId, findByText, getByText } = open();

      fireEvent.press(getByTestId('health-reminders'));

      expect(await findByText('Could not update reminders')).toBeTruthy();
      expect(getByText('Server busy')).toBeTruthy();
    });
  });

  describe("the website's health tools", () => {
    const mocked = name => {
      action(name);
      return mockActions[name];
    };

    const RECORDS = [
      {
        id: 'rec-1',
        documentType: 'vaccination',
        recordName: 'Rabies booster',
        dateIssued: '2026-03-05',
        files: [{ id: 'f1', fileName: 'a.jpg', mimeType: 'image/jpeg' }],
      },
      {
        id: 'rec-2',
        documentType: 'vaccination',
        recordName: 'Second record',
        files: [{ id: 'f2', fileName: 'b.jpg', mimeType: 'image/jpeg' }],
      },
    ];

    const open = () => {
      const utils = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
      fireEvent.press(utils.getByTestId('health-photos'));
      return utils;
    };

    beforeEach(() => {
      mockRecords = RECORDS;
    });

    describe('confirmed vaccine history', () => {
      const ROW = {
        id: 1,
        vaccineFamily: 'Other',
        dateAdministered: '2026-11-23T00:00:00Z',
        vaccineName: 'Test',
        dueDate: '2026-12-23',
        ownerConfirmed: true,
        pageNumber: 0,
      };

      it('shows the confirmed rows grouped by vaccine family', () => {
        mockHistory = { rows: [ROW] };
        const { getByText, getByTestId } = open();

        expect(getByText('Confirmed vaccine history')).toBeTruthy();
        expect(getByTestId('health-history-count').props.children).toBe('1 confirmed row');
        expect(getByText('Other')).toBeTruthy();
        expect(getByText('Current due date: Dec 23, 2026')).toBeTruthy();
        expect(getByText('Nov 23, 2026')).toBeTruthy();
        expect(getByText('Test')).toBeTruthy();
        expect(getByText('Owner confirmed')).toBeTruthy();
        expect(getByText('Page 0')).toBeTruthy();
      });

      it('is left out altogether when nothing is confirmed yet', () => {
        const { queryByTestId, queryByText } = open();

        expect(queryByTestId('health-history')).toBeNull();
        expect(queryByText('Confirmed vaccine history')).toBeNull();
      });

      it('confirms a new due date for a row', async () => {
        mockHistory = { rows: [ROW] };
        const { getByTestId, findByText } = open();

        fireEvent.changeText(getByTestId('history-due-1'), '24122026');
        fireEvent.press(getByTestId('history-update-1'));

        await waitFor(() =>
          expect(mockActions.confirmDue).toHaveBeenCalledWith({
            entryId: 1,
            dueDate: '2026-12-24',
          }),
        );
        expect(await findByText('Due date updated')).toBeTruthy();
      });

      it('does not send a date that is not complete', () => {
        mockHistory = { rows: [ROW] };
        const { getByTestId, getByText } = open();

        fireEvent.changeText(getByTestId('history-due-1'), '2412');
        fireEvent.press(getByTestId('history-update-1'));

        expect(getByText('Enter the date as DD/MM/YYYY.')).toBeTruthy();
        expect(mockActions.confirmDue).not.toHaveBeenCalled();
      });

      describe('finding the clinic or vet', () => {
        const withRow = over => {
          mockHistory = { rows: [{ ...ROW, ...over }] };
        };

        it('starts with the vet that is already named', () => {
          withRow({ clinicName: 'Happy Paws' });
          const { getByTestId } = open();

          expect(getByTestId('history-vet-1').props.value).toBe('Happy Paws');
        });

        it('searches by what was typed and lists the matches', async () => {
          withRow({});
          mocked('findVets').mockResolvedValue([
            { listingId: 'L1', name: 'Happy Paws', city: 'Gurugram' },
          ]);
          const { getByTestId, findByText, getByText } = open();

          fireEvent.changeText(getByTestId('history-vet-1'), 'happy');
          fireEvent.press(getByTestId('history-find-1'));

          expect(await findByText('Happy Paws')).toBeTruthy();
          expect(getByText('Gurugram')).toBeTruthy();
          expect(mockActions.findVets).toHaveBeenCalledWith({ q: 'happy' });
        });

        it('links the chosen vet to that entry and its record', async () => {
          withRow({ entryId: 'e1', recordId: 'r1' });
          mocked('findVets').mockResolvedValue([{ listingId: 'L1', name: 'Happy Paws' }]);
          const { getByTestId, findByTestId, findByText, queryByTestId } = open();

          fireEvent.changeText(getByTestId('history-vet-1'), 'happy');
          fireEvent.press(getByTestId('history-find-1'));
          fireEvent.press(await findByTestId('history-vet-option-L1'));

          await waitFor(() =>
            expect(mockActions.confirmVet).toHaveBeenCalledWith({
              recordId: 'r1',
              entryId: 'e1',
              listingId: 'L1',
            }),
          );
          expect(await findByText('Linked to Happy Paws')).toBeTruthy();
          expect(queryByTestId('history-vet-option-L1')).toBeNull();
        });

        it('uses the record on screen when the entry does not say which record it is in', async () => {
          withRow({});
          mocked('findVets').mockResolvedValue([{ listingId: 'L1', name: 'Happy Paws' }]);
          const { getByTestId, findByTestId } = open();

          fireEvent.changeText(getByTestId('history-vet-1'), 'happy');
          fireEvent.press(getByTestId('history-find-1'));
          fireEvent.press(await findByTestId('history-vet-option-L1'));

          await waitFor(() =>
            expect(mockActions.confirmVet).toHaveBeenCalledWith(
              expect.objectContaining({ recordId: 'rec-1', entryId: 1 }),
            ),
          );
        });

        it('says when nothing matches', async () => {
          withRow({});
          mocked('findVets').mockResolvedValue([]);
          const { getByTestId, findByTestId } = open();

          fireEvent.changeText(getByTestId('history-vet-1'), 'zzz');
          fireEvent.press(getByTestId('history-find-1'));

          expect(await findByTestId('history-vet-none-1')).toBeTruthy();
        });

        it('cannot search with an empty box', () => {
          withRow({});
          const { getByTestId } = open();

          expect(getByTestId('history-find-1').props.accessibilityState.disabled).toBe(true);
          fireEvent.press(getByTestId('history-find-1'));
          expect(mockActions.findVets).not.toHaveBeenCalled();
        });

        it('tells the user when the search fails', async () => {
          withRow({});
          mocked('findVets').mockRejectedValue(new Error('Offline'));
          const { getByTestId, findByText } = open();

          fireEvent.changeText(getByTestId('history-vet-1'), 'happy');
          fireEvent.press(getByTestId('history-find-1'));

          expect(await findByText('Could not search')).toBeTruthy();
        });

        it('tells the user when the vet could not be linked', async () => {
          withRow({ recordId: 'r1' });
          mocked('findVets').mockResolvedValue([{ listingId: 'L1', name: 'Happy Paws' }]);
          mocked('confirmVet').mockRejectedValue({ response: { data: { error: 'Not allowed' } } });
          const { getByTestId, findByTestId, findByText } = open();

          fireEvent.changeText(getByTestId('history-vet-1'), 'happy');
          fireEvent.press(getByTestId('history-find-1'));
          fireEvent.press(await findByTestId('history-vet-option-L1'));

          expect(await findByText('Could not link the vet')).toBeTruthy();
        });
      });

      it('tells the user when the date could not be updated', async () => {
        mockHistory = { rows: [ROW] };
        mocked('confirmDue').mockRejectedValue({ response: { data: { error: 'Locked' } } });
        const { getByTestId, findByText, getByText } = open();

        fireEvent.press(getByTestId('history-update-1'));

        expect(await findByText('Could not update the date')).toBeTruthy();
        expect(getByText('Locked')).toBeTruthy();
      });
    });

    describe('add vaccination', () => {
      const fill = utils => {
        fireEvent.changeText(utils.getByTestId('vaccine-name'), 'Rabies');
        fireEvent.changeText(utils.getByTestId('vaccine-given'), '05032026');
        fireEvent.changeText(utils.getByTestId('vaccine-clinic'), 'Happy Paws');
      };

      it('saves the vaccination on the selected record and clears the form for the next one', async () => {
        const utils = open();
        fill(utils);

        fireEvent.press(utils.getByTestId('vaccine-save'));

        await waitFor(() =>
          expect(mockActions.addVaccination).toHaveBeenCalledWith({
            recordId: 'rec-1',
            payload: { vaccineName: 'Rabies', dateAdministered: '2026-03-05', clinic: 'Happy Paws' },
          }),
        );
        expect(await utils.findByText('Vaccination saved')).toBeTruthy();
        expect(utils.getByTestId('vaccine-name').props.value).toBe('');
      });

      it('goes to the record that was tapped', async () => {
        const utils = open();
        fireEvent.press(utils.getByTestId('health-record-1'));
        fill(utils);

        fireEvent.press(utils.getByTestId('vaccine-save'));

        await waitFor(() =>
          expect(mockActions.addVaccination).toHaveBeenCalledWith(
            expect.objectContaining({ recordId: 'rec-2' }),
          ),
        );
      });

      it('starts a vaccination record first when the pet has none', async () => {
        mockRecords = [];
        mockMutateAsync.mockResolvedValue({ record: { id: 'new-1' }, failedPhotos: 0 });
        const utils = open();
        fill(utils);

        fireEvent.press(utils.getByTestId('vaccine-save'));

        await waitFor(() =>
          expect(mockActions.addVaccination).toHaveBeenCalledWith(
            expect.objectContaining({ recordId: 'new-1' }),
          ),
        );
        expect(mockMutateAsync.mock.calls[0][0].form).toEqual({ documentType: 'vaccination' });
      });

      it('asks for the vaccine name and a date before saving', () => {
        const utils = open();

        fireEvent.press(utils.getByTestId('vaccine-save'));
        expect(utils.getByTestId('vaccine-error').props.children).toMatch(/vaccine name/);

        fireEvent.changeText(utils.getByTestId('vaccine-name'), 'Rabies');
        fireEvent.press(utils.getByTestId('vaccine-save'));
        expect(utils.getByTestId('vaccine-error').props.children).toMatch(/at least one date/);
        expect(mockActions.addVaccination).not.toHaveBeenCalled();
      });

      it('shows the server message when saving fails and keeps what was typed', async () => {
        mocked('addVaccination').mockRejectedValue({ response: { data: { error: 'Duplicate' } } });
        const utils = open();
        fill(utils);

        fireEvent.press(utils.getByTestId('vaccine-save'));

        expect(await utils.findByText('Duplicate')).toBeTruthy();
        expect(utils.getByTestId('vaccine-name').props.value).toBe('Rabies');
      });
    });

    describe('files of the selected record', () => {
      it('shows the first record files, and the files of another record once it is tapped', () => {
        const { getByText, queryByText, getByTestId } = open();
        expect(getByText('a.jpg')).toBeTruthy();
        expect(queryByText('b.jpg')).toBeNull();

        fireEvent.press(getByTestId('health-record-1'));

        expect(getByText('b.jpg')).toBeTruthy();
        expect(queryByText('a.jpg')).toBeNull();
        expect(getByTestId('health-record-1').props.accessibilityState.selected).toBe(true);
      });

      it('shows the type and extraction status of a file', () => {
        const { getByText } = open();

        expect(getByText('image/jpeg · Pending extraction')).toBeTruthy();
        expect(
          getByText('Pending extraction. This file is stored privately and has not been sent for reading.'),
        ).toBeTruthy();
      });

      it('starts reading one page with Extract details', async () => {
        const { getByTestId, findByText } = open();

        fireEvent.press(getByTestId('health-file-extract-0'));

        await waitFor(() =>
          expect(mockActions.extractFile).toHaveBeenCalledWith({ recordId: 'rec-1', fileId: 'f1' }),
        );
        expect(await findByText(/Reading started/)).toBeTruthy();
      });

      it('reads and then arranges all pages', async () => {
        const order = [];
        mocked('extractAll').mockImplementation(async () => order.push('read'));
        mocked('organize').mockImplementation(async () => order.push('arrange'));
        const { getByTestId, findByText } = open();

        fireEvent.press(getByTestId('health-files-read-all'));

        expect(await findByText(/Pages read and arranged/)).toBeTruthy();
        expect(order).toEqual(['read', 'arrange']);
        expect(mockActions.extractAll).toHaveBeenCalledWith({ recordId: 'rec-1' });
      });

      it('does not arrange the pages when reading them failed', async () => {
        mocked('extractAll').mockRejectedValue(new Error('Busy'));
        const { getByTestId, findByText } = open();

        fireEvent.press(getByTestId('health-files-read-all'));

        expect(await findByText('Could not read and arrange the pages')).toBeTruthy();
        expect(mockActions.organize).not.toHaveBeenCalled();
      });

      it('keeps suggestions unconfirmed until the owner approves them', async () => {
        mockRecords = [
          {
            id: 'rec-1',
            documentType: 'vaccination',
            files: [
              {
                id: 'f1',
                fileName: 'read.jpg',
                extractionStatus: 'extracted',
                suggestions: { vaccineName: 'Rabies', dateAdministered: '2026-03-05' },
              },
            ],
          },
        ];
        const { getByText, getByTestId, queryByTestId, findByText } = open();

        expect(getByText('image/jpeg · Extracted · needs owner review'.replace('image/jpeg · ', ''))).toBeTruthy();
        expect(getByText('Suggested details. Not confirmed until you approve them.')).toBeTruthy();
        expect(getByText('Rabies')).toBeTruthy();
        expect(queryByTestId('health-file-extract-0')).toBeNull();

        fireEvent.press(getByTestId('health-file-approve-0'));

        await waitFor(() =>
          expect(mockActions.approve).toHaveBeenCalledWith({
            recordId: 'rec-1',
            fileId: 'f1',
            details: { vaccineName: 'Rabies', dateAdministered: '2026-03-05' },
          }),
        );
        expect(await findByText('Details approved for read.jpg')).toBeTruthy();
      });

      it('offers no approval for a page that has not been read', () => {
        const { queryByTestId } = open();

        expect(queryByTestId('health-file-approve-0')).toBeNull();
      });

      it('replaces a page with a photo from the gallery', async () => {
        launchImageLibrary.mockImplementation((options, callback) =>
          callback({ assets: [{ uri: 'file:///new.jpg', fileName: 'new.jpg', type: 'image/jpeg' }] }),
        );
        const { getByTestId, findByText } = open();

        fireEvent.press(getByTestId('health-file-replace-0'));

        await waitFor(() =>
          expect(mockActions.replace).toHaveBeenCalledWith({
            recordId: 'rec-1',
            fileId: 'f1',
            photo: expect.objectContaining({ uri: 'file:///new.jpg' }),
          }),
        );
        expect(await findByText('Page replaced')).toBeTruthy();
        expect(launchImageLibrary).toHaveBeenCalledWith(
          expect.objectContaining({ selectionLimit: 1 }),
          expect.any(Function),
        );
      });

      it('replaces nothing when the gallery is closed without a choice', async () => {
        launchImageLibrary.mockImplementation((options, callback) => callback({ didCancel: true }));
        const { getByTestId } = open();

        fireEvent.press(getByTestId('health-file-replace-0'));
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockActions.replace).not.toHaveBeenCalled();
      });

      it('adds more pages to the selected record from the gallery', async () => {
        mocked('addFiles').mockResolvedValue({ failed: 0 });
        launchImageLibrary.mockImplementation((options, callback) =>
          callback({ assets: [{ uri: 'file:///1.jpg' }, { uri: 'file:///2.jpg' }] }),
        );
        const { getByTestId, findByText } = open();

        fireEvent.press(getByTestId('health-files-choose'));

        await waitFor(() =>
          expect(mockActions.addFiles).toHaveBeenCalledWith({
            recordId: 'rec-1',
            photos: [expect.objectContaining({ uri: 'file:///1.jpg' }), expect.objectContaining({ uri: 'file:///2.jpg' })],
          }),
        );
        expect(await findByText('2 pages added')).toBeTruthy();
      });

      it('removes one page after the popup is confirmed', async () => {
        const { getByTestId, getByText } = open();

        fireEvent.press(getByTestId('health-file-remove-0'));
        expect(getByText('Remove this page?')).toBeTruthy();
        fireEvent.press(getByText('Remove'));

        await waitFor(() =>
          expect(mockDeleteFile).toHaveBeenCalledWith({ recordId: 'rec-1', fileId: 'f1' }),
        );
      });

      it('removes every page one by one once confirmed, and not before', async () => {
        mockRecords = [
          {
            id: 'rec-1',
            documentType: 'vaccination',
            files: [{ id: 'f1' }, { id: 'f2' }],
          },
        ];
        const { getByTestId, getByText, findByText } = open();
        expect(getByText('Remove all 2 pages')).toBeTruthy();

        fireEvent.press(getByTestId('health-files-remove-all'));
        expect(getByText('Remove all 2 pages?')).toBeTruthy();
        expect(mockDeleteFile).not.toHaveBeenCalled();
        fireEvent.press(getByText('Remove all'));

        expect(await findByText('All pages removed')).toBeTruthy();
        expect(mockDeleteFile).toHaveBeenCalledTimes(2);
        expect(mockDeleteFile).toHaveBeenCalledWith({ recordId: 'rec-1', fileId: 'f1' });
        expect(mockDeleteFile).toHaveBeenCalledWith({ recordId: 'rec-1', fileId: 'f2' });
      });

      it('says how many pages could not be removed', async () => {
        mockRecords = [{ id: 'rec-1', documentType: 'vaccination', files: [{ id: 'f1' }, { id: 'f2' }] }];
        mockDeleteFile.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('x'));
        const { getByTestId, getByText, findByText } = open();

        fireEvent.press(getByTestId('health-files-remove-all'));
        fireEvent.press(getByText('Remove all'));

        expect(await findByText('1 of 2 pages could not be removed.')).toBeTruthy();
      });

      it('says there is nothing to show when the pet has no records', () => {
        mockRecords = [];
        const { getByTestId } = open();

        expect(getByTestId('health-files-empty')).toBeTruthy();
      });

      it('says when the selected record has no pages', () => {
        mockRecords = [{ id: 'rec-1', documentType: 'vaccination', files: [] }];
        const { getByTestId, queryByTestId } = open();

        expect(getByTestId('health-files-none')).toBeTruthy();
        expect(queryByTestId('health-files-remove-all')).toBeNull();
      });
    });

    describe('archive and restore', () => {
      it('archives the selected record once confirmed', async () => {
        const { getByTestId, getByText, findByText } = open();

        fireEvent.press(getByTestId('health-record-archive'));
        expect(getByText('Archive this record?')).toBeTruthy();
        expect(mockActions.archive).not.toHaveBeenCalled();
        fireEvent.press(getByText('Archive'));

        await waitFor(() => expect(mockActions.archive).toHaveBeenCalledWith({ recordId: 'rec-1' }));
        expect(await findByText('Record archived')).toBeTruthy();
      });

      it('archives nothing when the user keeps the record', () => {
        const { getByTestId, getByText } = open();

        fireEvent.press(getByTestId('health-record-archive'));
        fireEvent.press(getByText('Keep it'));

        expect(mockActions.archive).not.toHaveBeenCalled();
      });

      it('shows the archived records on request, and restores one', async () => {
        mockArchived = [{ id: 'old-1', documentType: 'deworming', recordName: 'Old round' }];
        const { getByTestId, queryByTestId, getByText, findByText } = open();
        expect(queryByTestId('health-archived')).toBeNull();

        fireEvent.press(getByTestId('health-archived-toggle'));
        expect(getByText('Old round')).toBeTruthy();
        fireEvent.press(getByTestId('archived-restore-0'));

        await waitFor(() => expect(mockActions.restore).toHaveBeenCalledWith({ recordId: 'old-1' }));
        expect(await findByText('Record restored')).toBeTruthy();
      });

      it('says when there are no archived records', () => {
        const { getByTestId } = open();

        fireEvent.press(getByTestId('health-archived-toggle'));

        expect(getByTestId('health-archived-empty')).toBeTruthy();
      });
    });

    describe('edit record details', () => {
      it('opens the form filled with the record, and saves the changes', async () => {
        const { getByTestId, getByText, getAllByText, findByText } = open();

        fireEvent.press(getByTestId('health-record-edit'));
        // The link in the Files card, and the title of the form that opened
        expect(getAllByText('Edit record details')).toHaveLength(2);
        expect(getByTestId('health-record-name').props.value).toBe('Rabies booster');
        expect(getByTestId('health-date-issued').props.value).toBe('05/03/2026');

        fireEvent.changeText(getByTestId('health-record-name'), 'Rabies yearly');
        fireEvent.press(getByText('Save changes'));

        await waitFor(() =>
          expect(mockActions.update).toHaveBeenCalledWith({
            recordId: 'rec-1',
            form: expect.objectContaining({ recordName: 'Rabies yearly', dateIssued: '05/03/2026' }),
          }),
        );
        expect(await findByText('Record details saved')).toBeTruthy();
      });

      it('does not save a date that does not exist', async () => {
        const { getByTestId, getByText, findByText } = open();
        fireEvent.press(getByTestId('health-record-edit'));

        fireEvent.changeText(getByTestId('health-date-issued'), '31022026');
        fireEvent.press(getByText('Save changes'));

        expect(await findByText(/Enter dates as DD\/MM\/YYYY/)).toBeTruthy();
        expect(mockActions.update).not.toHaveBeenCalled();
      });

      it('leaves the record alone on Cancel', () => {
        const { getByTestId, queryByTestId, queryAllByText } = open();
        fireEvent.press(getByTestId('health-record-edit'));
        expect(queryByTestId('health-record-name')).toBeTruthy();

        fireEvent.press(getByTestId('health-edit-cancel'));

        expect(queryByTestId('health-record-name')).toBeNull();
        expect(queryAllByText('Edit record details')).toHaveLength(1);
        expect(mockActions.update).not.toHaveBeenCalled();
      });

      it('edits the record that was tapped, not the first one', async () => {
        const { getByTestId, getByText } = open();
        fireEvent.press(getByTestId('health-record-1'));
        fireEvent.press(getByTestId('health-record-edit'));

        expect(getByTestId('health-record-name').props.value).toBe('Second record');
        fireEvent.press(getByText('Save changes'));

        await waitFor(() =>
          expect(mockActions.update).toHaveBeenCalledWith(expect.objectContaining({ recordId: 'rec-2' })),
        );
      });
    });
  });
});
