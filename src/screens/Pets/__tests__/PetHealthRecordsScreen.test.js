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

  it('shows the health records card, with an empty message when there are none', () => {
    const { getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    expect(getByText('Health Records')).toBeTruthy();
    expect(getByText('Open health records book')).toBeTruthy();
    expect(getByText(/No health records yet/)).toBeTruthy();
    // The add area stays closed until it is asked for
    expect(queryByText(/vaccination book or certificates/)).toBeNull();
  });

  it('lists records the API returns', () => {
    mockRecords = [{ id: 1, documentType: 'vaccination', recordName: 'Rabies booster', dateIssued: '2026-03-05T00:00:00Z' }];
    const { getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    expect(getByText('Rabies booster')).toBeTruthy();
    expect(getByText('Vaccination · 2026-03-05')).toBeTruthy();
    expect(queryByText(/No health records yet/)).toBeNull();
  });

  it('opens the photo card from Add photos, then the form from "enter details by hand"', () => {
    const { getByTestId, getByText, queryByText } = render(
      <PetHealthRecordsScreen navigation={navigation} route={route} />
    );
    fireEvent.press(getByTestId('health-photos'));
    expect(getByText("Add photos of Bruno's vaccination book or certificates")).toBeTruthy();
    expect(getByText('Take photo')).toBeTruthy();
    expect(getByText('Choose files')).toBeTruthy();
    expect(queryByText('Add health record')).toBeNull();

    fireEvent.press(getByTestId('health-by-hand'));
    expect(getByText('Add health record')).toBeTruthy();
    expect(getByText('Save record')).toBeTruthy();
  });

  it('saves the record with what was typed', async () => {
    const { getByTestId } = render(<PetHealthRecordsScreen navigation={navigation} route={route} />);
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
    fireEvent.press(getByTestId('health-add-record'));
    fireEvent.changeText(getByTestId('health-date-issued'), '31022026');
    fireEvent.press(getByTestId('health-save'));

    expect(await findByText(/Enter dates as DD\/MM\/YYYY/)).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
