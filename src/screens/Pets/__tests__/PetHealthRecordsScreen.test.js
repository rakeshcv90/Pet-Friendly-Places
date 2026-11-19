import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PetHealthRecordsScreen } from '../PetHealthRecordsScreen';

const mockMutateAsync = jest.fn();
let mockRecords = [];

jest.mock('../../../hooks/usePetHealth', () => ({
  ...jest.requireActual('../../../hooks/usePetHealth'),
  useHealthRecords: () => ({ data: mockRecords }),
  useCreateHealthRecord: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

const navigation = { goBack: jest.fn(), navigate: jest.fn() };
const route = { params: { pet: { id: 'pet-1', name: 'Bruno' } } };

describe('PetHealthRecordsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecords = [];
    mockMutateAsync.mockResolvedValue({ failedPhotos: 0 });
  });

  it('opens on the records book, with its empty message and the three actions', () => {
    const { getByText, getByTestId, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
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
      { id: 1, documentType: 'vaccination', recordName: 'Rabies booster', files: [{ id: 9, url: 'https://x.test/p1.jpg' }] },
    ];
    const { getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    expect(getByText('1 page')).toBeTruthy();
    expect(getByText('Rabies booster')).toBeTruthy();
    expect(queryByText(/No source pages yet/)).toBeNull();
  });

  it('opens the add area from Add photos, with the card, records and photo upload', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    fireEvent.press(getByTestId('health-photos'));

    expect(getByText('Health Records')).toBeTruthy();
    expect(getByText('Open health records book')).toBeTruthy();
    expect(getByText(/No health records yet/)).toBeTruthy();
    expect(getByText("Add photos of Bruno's vaccination book or certificates")).toBeTruthy();
    expect(getByText('Take photo')).toBeTruthy();
    expect(getByText('Choose files')).toBeTruthy();
    // Book and form are not shown yet
    expect(queryByText('No pages yet')).toBeNull();
    expect(queryByText('Add health record')).toBeNull();
  });

  it('lists records the API returns in the add area', () => {
    mockRecords = [{ id: 1, documentType: 'vaccination', recordName: 'Rabies booster', dateIssued: '2026-03-05T00:00:00Z' }];
    const { getByText, getByTestId, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    fireEvent.press(getByTestId('health-photos'));

    expect(getByText('Rabies booster')).toBeTruthy();
    expect(getByText('Vaccination · 2026-03-05')).toBeTruthy();
    expect(queryByText(/No health records yet/)).toBeNull();
  });

  it('opens the form from "Add record" and from "enter details by hand"', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
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
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    fireEvent.press(getByTestId('health-photos'));
    expect(queryByText('No pages yet')).toBeNull();

    fireEvent.press(getByTestId('health-open-book'));
    expect(getByText('No pages yet')).toBeTruthy();
    expect(getByTestId('health-download')).toBeTruthy();
    expect(queryByText('Health Records')).toBeNull();
  });

  it('saves the record with what was typed', async () => {
    const { getByTestId } = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
    fireEvent.press(getByTestId('health-photos'));
    fireEvent.press(getByTestId('health-add-record'));
    fireEvent.press(getByTestId('health-type-deworming'));
    fireEvent.changeText(getByTestId('health-record-name'), 'Round 2');
    fireEvent.changeText(getByTestId('health-date-issued'), '05032026');
    fireEvent.press(getByTestId('health-save'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    const { form, photos } = mockMutateAsync.mock.calls[0][0];
    expect(form).toMatchObject({ documentType: 'deworming', recordName: 'Round 2', dateIssued: '05/03/2026' });
    expect(photos).toEqual([]);
  });

  it('does not save a date that does not exist', async () => {
    const { getByTestId, findByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
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
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    const { ScrollView } = require('react-native');

    ['health-download', 'health-share', 'health-photos'].forEach(id =>
      expect(getByTestId(id)).toBeTruthy()
    );
    const horizontal = UNSAFE_queryAllByType(ScrollView).filter(view => view.props.horizontal);
    expect(horizontal).toHaveLength(0);
  });
});
